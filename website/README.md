# KisanQ public website

Static site. No build step, no dependencies, no backend. Open `index.html` or serve the folder:

```bash
python -m http.server 8100 --directory website
```

```
index.html      homepage — sections #challenges #how #flow #product #honest #get #team
download.html   download page — sections #install
styles.css      all styles
site.js         mobile menu, scroll reveals, the counter→farmer demo, copy-link
make-qr.py      regenerates assets/qr.png from the URL in download.html (see below)
assets/         real app captures, staff-portal capture, download QR, favicon
```

The older `landing/` folder is the previous one-page download site. It is kept as a backup and
is not part of this site.

---

## The APK download URL

Both links and the QR point at the EAS build artifact for build `fd623f21`:

```
https://expo.dev/artifacts/eas/HKRroTwmq1wTlL1V9kKUk2mY6IbqGgQ5e5zxVR5teE4.apk
expires 24 November 2026
```

Verified working on 11 November 2026: `HTTP 200`, `Content-Length: 114983884`, which matches
`dist/kisanq.apk` byte for byte (SHA-256 `0763e7f0…16164`). It covers the 14 November
submission and ten days past it. Anyone opening the site after the 24th gets a dead link, so
replace it before then.

### Recommended: a public, APK-only GitHub repository + Release

`AtulSharmx/kisanQ` is private, and release assets on a private repo are not publicly
downloadable. Create a *separate* public repo holding only the APK and a short README — no
source, no `.env`, no Firebase config, no database exports, no internal docs. A release asset
then gives a permanent URL with no bandwidth ceiling:

```
https://github.com/<owner>/<apk-repo>/releases/download/v1.0.0/kisanq-1.0.0.apk
```

**Not done — publishing a public release is an external action and needs explicit approval.**

### Alternative: Firebase Hosting

`kisanq-farmer.web.app` already serves `dist/`, so `dist/kisanq.apk` would be reachable at
`https://kisanq-farmer.web.app/kisanq.apk` after `npx firebase deploy --only hosting`. Two
caveats before choosing this: `dist/` is build output, so any `expo export` wipes the APK and
it has to be copied back; and Firebase's hosting terms restrict using the service as a general
file-distribution host, so check the current Spark-plan policy before relying on it for a
public APK. The GitHub Release route avoids both questions.

### Swapping the URL

The URL appears in exactly **two** places, both in `download.html`, both marked with an
`APK-URL` comment: the Download button (`id="dl"`) and the copyable link text (`id="apk-url"`).
Every Download button elsewhere on the site points at `download.html`, so there is nothing
else to change.

Then regenerate the QR — it reads the new URL straight out of `download.html`, so it cannot
drift:

```bash
python website/make-qr.py
```

It uses error-correction level H because the code carries a centre logo knockout (a lower
level makes it unscannable), and it decodes its own output before saving, failing loudly if
the result does not scan back to the same URL.

Finally update the expiry lines in `download.html` (search for `24 November 2026`), or delete
those sentences once the URL no longer expires.

---

## Facts the site states, and where they come from

| Claim | Source |
| --- | --- |
| Wheat MSP ₹2,585 / quintal, RMS 2026-27 | `src/config/msp.ts`; the page links to agriwelfare.gov.in and calls it the announced price, not a guarantee |
| 12 languages | `src/i18n/strings.ts`, type-enforced across every key |
| Payment stages | `PAYMENT_STAGES` in `src/types/firestore.ts` |
| Overload flag above 80% | `OVERLOAD_THRESHOLD_PCT` in `src/services/firestoreService.ts` |
| APK version, size, SHA-256, package | read from `dist/kisanq.apk` itself and from the EAS build record |

## Rules this site holds to

- Every phone screen is a real capture from the running build. Drawn panels are labelled
  `illustration` or `conceptual diagram`.
- No demo staff credentials appear anywhere on the site. The staff ID in
  `assets/operator-login.jpg` is blurred, and the caption says so.
- No claim of government affiliation, official integration, or real money movement.
- "Never enter a real Aadhaar number" appears on both pages.
- No invented farmer counts, hours saved, testimonials or rankings.
