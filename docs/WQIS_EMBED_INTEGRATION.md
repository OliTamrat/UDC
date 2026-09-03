# WQIS Dashboard Embed — Integration Guide

**For:** UDC Web & Digital Manager
**From:** DAPS Analytics
**Applies to:** `https://udc.wqis-app.com/embed`

---

## 1. What changed on our side

The embed snippet already placed on the staging page pointed at a route that did
not exist yet, and our security headers blocked framing from any domain. Both are
now resolved:

| Item | Before | Now |
|---|---|---|
| `/embed` route | HTTP 404 | Live — chrome-free dashboard, no sidebar or top nav |
| `X-Frame-Options` | `DENY` on every route | Not sent on `/embed`; unchanged elsewhere |
| CSP `frame-ancestors` | Absent | `udc-dev.abcdandcompany.com`, `www.udc.edu`, `udc.edu` |

Only `/embed` is framable. The standalone dashboard, the admin panel and the
ingestion APIs remain unframable, so this does not widen the platform's exposure.

---

## 2. The snippet

The snippet on staging works as-is now that the route exists. No change required:

```html
<iframe
  src="https://udc.wqis-app.com/embed"
  width="100%"
  height="900"
  style="border: none; border-radius: 8px;"
  title="UDC Water Quality Research Dashboard"
  loading="lazy"
  allow="fullscreen"
></iframe>
```

### Recommended: let the frame size itself

`height="900"` is a fixed guess — it clips content on desktop and leaves a gap on
mobile. The embed reports its real height to the host page, so adding this once
lets the iframe track its content:

```html
<iframe
  id="wqis-embed"
  src="https://udc.wqis-app.com/embed"
  width="100%"
  height="900"
  style="border: none; border-radius: 8px;"
  title="UDC Water Quality Research Dashboard"
  loading="lazy"
  allow="fullscreen"
></iframe>

<script>
  window.addEventListener("message", function (event) {
    if (event.origin !== "https://udc.wqis-app.com") return;
    var data = event.data;
    if (!data || data.type !== "wqis:height") return;
    var frame = document.getElementById("wqis-embed");
    if (frame) frame.height = data.height;
  });
</script>
```

The origin check matters — without it any site could resize the frame. The embed
posts only to the UDC origins on our allow-list, never to `*`.

---

## 3. Display options

Append these to the `src` URL to retune the embed. No redeploy on either side.

| Parameter | Values | Default | Effect |
|---|---|---|---|
| `view` | `full`, `compact`, `map` | `full` | How much to show. `compact` = map, recreation safety and headline metrics. `map` = watershed map only. |
| `theme` | `dark`, `light` | `dark` | Colour scheme. Use `light` to match the UDC page. |
| `nav` | `blank`, `inline` | `blank` | Where a station link opens. `blank` = new tab (recommended — station pages carry full app chrome). `inline` = inside the frame. |
| `cta` | `0`, `1` | `0` | Show the "Open full dashboard" link. **Off by default** so no link out to a non-UDC domain appears on a UDC page. |
| `ai` | `0`, `1` | `0` | Include the AI research assistant. Off by default pending UDC's decision. |
| `toggle` | `0`, `1` | `1` | Show the light/dark appearance button in the embed header. |

### Appearance

The embed ships with a light/dark toggle in its header, so the two options can be
compared side by side on staging without a redeploy. `theme` sets the starting
appearance; the toggle lets a visitor change it. Once UDC settles on one look,
`?theme=light&toggle=0` (or `dark`) pins it and hides the control.

Example — light theme, compact, matching a light UDC page:

```
https://udc.wqis-app.com/embed?view=compact&theme=light
```

### Keeping everything on a UDC domain

The embed no longer shows any outbound link by default. The iframe itself still
loads from `udc.wqis-app.com`, which is visible to anyone who inspects the page.

The clean fix is a DNS record on UDC's side: point **`wqis.udc.edu`** at our Azure
endpoint with a CNAME, and the dashboard is served from a university host end to
end. No redeployment is needed — we add the hostname to the Container App, and
the embed URL becomes `https://wqis.udc.edu/embed`. UDC IT needs to create one
CNAME and we handle the rest.

Until then, `?cta=0` (the default) keeps the page free of vendor-facing links.

---

## 4. Confirmed about the UDC staging environment

Checked directly against the staging page:

- Serves over HTTPS — no mixed-content problem.
- No `Content-Security-Policy` response header, so nothing on the UDC side needs
  a `frame-src` change for the embed to load.
- Google Tag Manager and GA4 are active on the page. The embed sets no cookies
  and collects no personal data, so it adds no consent obligation.

---

## 5. Outstanding — needed from UDC

1. **Production URL.** The allow-list currently covers the staging host plus
   `www.udc.edu` and `udc.edu`. If the page ships on a different host
   (`wrri.udc.edu`, `causes.udc.edu`), tell us and we will add it — it is an
   environment variable, applied in minutes, no rebuild.

2. **"Request Researcher Access" destination.** The page advertises a Level 2
   tier with researcher login and restricted datasets. That tier is not built —
   the platform currently has no user authentication. Before go-live we need to
   agree whether the button points at a contact form or an email address for now,
   with authenticated access scoped as a follow-on phase.

3. **Body copy.** Two placeholders remain on the page: *"Explain mission of the
   tool and levels of access."* and *"Contact info."* DAPS will draft both for
   UDC approval.

4. **Go-live date** and any UDC change-freeze window.

---

## 6. Operational note (DAPS internal)

The frame allow-list is read at request time from `WQIS_EMBED_ANCESTORS`
(comma-separated origins) on the Azure Container App. Adding an approved UDC host
is a settings change plus a revision restart — never a code change. Leaving it
unset falls back to the defaults in `src/config/embed.config.ts`.

Regression coverage lives in `src/__tests__/embed-headers.test.ts`.
