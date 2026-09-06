#!/bin/sh
# Dump the WQIS database and upload it to geo-redundant blob storage.
#
# Fails loudly rather than uploading a broken artifact: a backup job that
# reports success while writing an empty file is worse than no backup at all,
# because it removes the reason to look.
set -eu

: "${DATABASE_URL:?DATABASE_URL is required}"
: "${BACKUP_ACCOUNT:?BACKUP_ACCOUNT is required}"
BACKUP_CONTAINER="${BACKUP_CONTAINER:-pgdump}"

# Decompose DATABASE_URL into libpq environment variables rather than handing
# the URI to pg_dump directly.
#
# Two reasons. First, correctness: Azure connection strings can carry an "@" or
# other reserved characters inside the user or password, and pg_dump's URI
# parser splits on the FIRST "@" — it read the password as the hostname and
# failed to resolve it. Splitting on the LAST "@" handles those strings.
# Second, and more important: when pg_dump fails on a URI it prints the part it
# could not parse, which put a credential fragment into the job log and from
# there into Log Analytics. With PGPASSWORD the secret never appears in an
# argument or an error message.
REST="${DATABASE_URL#*://}"
USERINFO="${REST%@*}"
HOSTPART="${REST##*@}"

PGUSER="${USERINFO%%:*}"
PGPASSWORD="${USERINFO#*:}"

HOSTPORT="${HOSTPART%%/*}"
PGHOST="${HOSTPORT%%:*}"
case "$HOSTPORT" in
  *:*) PGPORT="${HOSTPORT##*:}" ;;
  *)   PGPORT=5432 ;;
esac

DBPART="${HOSTPART#*/}"
PGDATABASE="${DBPART%%\?*}"
PGSSLMODE="${PGSSLMODE:-require}"

export PGUSER PGPASSWORD PGHOST PGPORT PGDATABASE PGSSLMODE

STAMP=$(date -u +%Y%m%dT%H%M%SZ)
NAME="udc-wqis-${STAMP}.sql.gz"
FILE="/tmp/${NAME}"

echo "[backup] dumping ${PGDATABASE} from ${PGHOST}"
pg_dump --no-owner --no-privileges --format=plain | gzip -9 > "$FILE"

SIZE=$(wc -c < "$FILE")
echo "[backup] dump complete: ${SIZE} bytes"

# A healthy compressed dump of this database is comfortably over 100 KB. Anything
# smaller means pg_dump produced little or nothing, which must not be stored as
# though it were a good backup.
if [ "$SIZE" -lt 102400 ]; then
  echo "[backup] FAILED: dump is only ${SIZE} bytes, refusing to upload"
  exit 1
fi

# Container Apps injects IDENTITY_ENDPOINT/IDENTITY_HEADER for the job's managed
# identity. No storage key or connection string is stored for this to work.
echo "[backup] requesting managed-identity token"
TOKEN=$(curl -sf -H "X-IDENTITY-HEADER: ${IDENTITY_HEADER}" \
  "${IDENTITY_ENDPOINT}?resource=https%3A%2F%2Fstorage.azure.com%2F&api-version=2019-08-01" \
  | jq -r '.access_token')

if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
  echo "[backup] FAILED: could not obtain managed-identity token"
  exit 1
fi

echo "[backup] uploading ${NAME}"
CODE=$(curl -s -o /tmp/upload.log -w '%{http_code}' -X PUT \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "x-ms-blob-type: BlockBlob" \
  -H "x-ms-version: 2021-08-06" \
  -H "Content-Type: application/gzip" \
  --data-binary "@${FILE}" \
  "https://${BACKUP_ACCOUNT}.blob.core.windows.net/${BACKUP_CONTAINER}/${NAME}")

if [ "$CODE" != "201" ]; then
  echo "[backup] FAILED: upload returned HTTP ${CODE}"
  cat /tmp/upload.log
  exit 1
fi

echo "[backup] uploaded ${NAME} (${SIZE} bytes)"
