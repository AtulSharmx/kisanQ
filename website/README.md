# KisanQ public website

Static site. No build step, no dependencies, no backend. Open `index.html` or serve the folder.

```
index.html      homepage (anchored sections: #problem #flow #product #status #get #about)
download.html   download page
styles.css      all styles
site.js         scroll reveals + the operator→farmer flow demo
assets/         real app captures, staff-portal capture, download QR
```

The older `landing/` folder is the previous one-page download site. It is kept as a backup and is
not part of this site.

---

## The APK download URL — action needed before submission

Every download link and the QR currently point at an **EAS build artifact URL**, which Expo
expires:

```
https://expo.dev/artifacts/eas/HKRroTwmq1wTlL1V9kKUk2mY6IbqGgQ5e5zxVR5teE4.apk
expires 24 November 2026
```

That is ten days after the 14 November submission, so it comfortably covers submission and
judging. Anyone opening the site after the 24th gets a dead link, so replace it with a URL you
control before then.

### Recommended: host the APK on the Firebase site you already own

You already have Firebase Hosting serving `dist/` at `kisanq-farmer.web.app`. Putting the APK
beside it gives a permanent, free URL under your own domain:

```
https://kisanq-farmer.web.app/kisanq.apk
```

Steps (**not run — needs your approval, since it deploys**):

1. Download the APK from the Expo link above.
2. Copy it into `dist/` as `kisanq.apk`.
3. `npx firebase deploy --only hosting`

Two things to know. First, `dist/` is build output — re-exporting the web build wipes it, so the
APK has to be copied back in after any `expo export`. Second, the Spark (free) plan allows 10 GB of
transfer per month; at ~110 MB per download that is roughly 90 downloads a month, which is ample
for a submission but not for public distribution.

### Alternative: a GitHub Release

A release asset gives a permanent URL and no bandwidth ceiling, but `AtulSharmx/kisanQ` is
**private** — release assets on a private repo are not publicly downloadable. This only works if
you make that repo public, or create a separate public repo to hold the release.

### Swapping the URL

The URL appears in exactly **two** places, both in `download.html` and both marked with an
`APK-URL` comment: the Download button (`id="dl"`) and the copyable link text (`id="apk-url"`).
Every other Download button on the site points at `download.html`, so there is nothing else to
change.

Then regenerate the QR so it matches:

```bash
python -c "import qrcode; qr=qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_M,box_size=10,border=2); qr.add_data('PUT_THE_NEW_URL_HERE'); qr.make(fit=True); qr.make_image(fill_color='#124026', back_color='#FBF9F4').convert('RGB').save('assets/qr.png', optimize=True)"
```

Also update the expiry lines in `download.html` (search for `24 November 2026`), or delete those
sentence once the URL no longer expires.

---

## Facts the site states, and where they come from

| Claim | Source |
| --- | --- |
| Wheat MSP ₹2,585 / quintal, RMS 2026-27 | `src/config/msp.ts` — **verify against the official notification before submission** |
| 12 languages | `src/i18n/strings.ts`, type-enforced across every key |
| Payment stages | `PAYMENT_STAGES` in `src/types/firestore.ts` |
| Overload flag above 80% | `OVERLOAD_THRESHOLD_PCT` in `src/services/firestoreService.ts` |

## Rules this site holds to

- Every phone screen is a real capture. Drawn panels are labelled `conceptual diagram`.
- No demo staff credentials appear anywhere on the site.
- No claim of government affiliation, official integration, or real money movement.
- "Never enter a real Aadhaar number" appears on both pages.
