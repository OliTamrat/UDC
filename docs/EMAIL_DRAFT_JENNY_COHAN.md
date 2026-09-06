# Email draft — to UDC Web & Digital Manager

**To:** Ms. Jenny Cohan
**Subject:** WQIS dashboard is live on the WRRI staging page — a few items to confirm

---

Dear Ms. Cohan,

Thank you for setting up the staging environment and for placing the embed on the
Water Quality Intelligence System page. That gave us exactly what we needed to
finish the integration against the real page rather than in isolation.

**The dashboard is now live on your staging page.** Two items on our side were
holding it back, and both are resolved:

1. The `/embed` address the snippet points to did not exist yet — it returned a
   404, which is why the page showed an empty area. That view is now built: a
   clean version of the dashboard with our own navigation and footer removed, so
   it sits inside your page rather than competing with it.
2. Our security headers blocked the dashboard from being displayed inside any
   other website. We have now authorised the UDC staging domain specifically.
   No other site can embed it.

You should see the live Anacostia map, station data and water quality trends when
you reload the page. The snippet you added works as-is — no change needed.

---

### One optional improvement to the snippet

The embed is currently set to a fixed height of 900 pixels, which crops content on
desktop and leaves blank space on mobile. The dashboard can report its own height
to your page so the frame sizes itself. If you would like that, add this once
below the iframe and give the iframe `id="wqis-embed"`:

```html
<script>
  window.addEventListener("message", function (event) {
    if (event.origin !== "https://udc.wqis-app.com") return;
    if (!event.data || event.data.type !== "wqis:height") return;
    var frame = document.getElementById("wqis-embed");
    if (frame) frame.height = event.data.height;
  });
</script>
```

Entirely optional — the embed works without it.

---

### "Request Researcher Access" now has a destination

The button on the page previously had nowhere to go. It can now point to:

**`https://udc.wqis-app.com/request-access`**

That page is a short request form reviewed by WRRI staff. It is worth being
precise about what it is and is not: it is a **request**, not a login. It creates
no account and grants no access on its own — the authenticated researcher tier is
a later phase, and the page says so plainly rather than implying otherwise.

It collects only a name, email, institution and a description of intended use.
No tracking, no IP logging, nothing beyond what the person types. Requests are
deleted automatically after a year, and can be deleted sooner on request. What is
stored, who sees it and for how long is stated on the form itself.

If UDC's privacy office or registrar has a view on the retention period —
particularly for student submissions — please let us know and we will match it.

---

### Four things we need from you

1. **The production URL.** We have authorised the staging domain plus `udc.edu`
   and `www.udc.edu`. If the live page will sit on a different host, such as
   `wrri.udc.edu`, tell us and we will add it — a few minutes' work, no
   redeployment.

2. **The two placeholders.** The page still reads *"Explain mission of the tool
   and levels of access"* and *"Contact info."* We are glad to draft both for
   your review if that is helpful.

3. **A go-live date**, and any change-freeze period we should work around.

4. **A question worth raising early:** the page advertises a Level 2 tier with
   researcher login and restricted datasets. That tier is not built yet. We would
   rather flag it now than have a visitor click through and find nothing. Our
   suggestion is to keep the button pointing at the request form for launch, and
   treat authenticated access as a defined follow-on phase.

---

### Worth considering: serving it from a UDC address

The dashboard currently loads from `udc.wqis-app.com`, a domain we operate. For a
university research tool being promoted on a university page, it may read better
for it to live at a UDC address such as **`wqis.udc.edu`**.

That needs one DNS record from UDC IT — a CNAME pointing to our hosting endpoint.
Nothing else changes and there is no redeployment. Happy to give your IT team the
exact value whenever you want to pursue it. We have removed the outbound link
from the embed in the meantime, so nothing on your page directs visitors to a
non-UDC address.

---

Please take a look at the staging page when you have a moment. If anything looks
off — spacing, height, colours against your page design — tell us and we will
adjust. The dashboard has both a light and a dark appearance and a toggle is
built into the embed, so you can compare the two directly on staging and tell us
which you prefer.

Best regards,

**Oli Tamrat**
Co-Founder & CTO, DAPS Analytics
oli@dapsanalytics.com
