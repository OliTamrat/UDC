# Off-region logical backup for the WQIS database.
#
# The flexible server's 7-day PITR and the vault's 10-year weekly backups both
# live in Central US on locally-redundant storage, so losing the region loses
# every copy of the data. Neither geo-redundant backup nor vault GRS can be
# enabled after creation, so this job carries a compressed pg_dump out to a
# geo-redundant storage account instead.
#
# Built on the postgres image rather than azure-cli: it already has a pg_dump
# matching the server's major version, and uploading via the blob REST API with
# a managed-identity token needs nothing more than curl.
FROM postgres:16-alpine

RUN apk add --no-cache curl jq

COPY backup.sh /usr/local/bin/backup.sh
RUN chmod +x /usr/local/bin/backup.sh

ENTRYPOINT ["/usr/local/bin/backup.sh"]
