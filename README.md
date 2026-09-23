# 🌾 KisanQ

**Smart Farmer Procurement & Queue Management Platform**
Prototype for **SIH26032** — Ministry of Consumer Affairs, Food & Public Distribution

![Expo](https://img.shields.io/badge/Expo-SDK%2057-000020?logo=expo&logoColor=white)
![React Native](https://img.shields.io/badge/React%20Native-0.86-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-Firestore%20%2B%20Auth-FFCA28?logo=firebase&logoColor=black)
![License](https://img.shields.io/badge/License-MIT-green.svg)

---

## 🚀 Live demo

No local setup needed to try it — both surfaces are deployed against the real Firebase backend:

| Surface | Link |
|---|---|
| **Operator / Admin** (web) | **[kisanq-farmer.web.app](https://kisanq-farmer.web.app)** |
| **Farmer app** (Android) | **[Download APK](https://expo.dev/accounts/atulshxrma/projects/kisanq/builds/2ae5df23-c5e7-4cca-805a-de81535c2d62)** — open the link on an Android phone (or scan the QR code below) and tap Install. No Play Store, no Expo account needed. |

<p align="center">
  <a href="https://expo.dev/accounts/atulshxrma/projects/kisanq/builds/2ae5df23-c5e7-4cca-805a-de81535c2d62">
    <img src="assets/apk-qr.png" alt="QR code — scan on an Android phone to install the KisanQ Farmer app" width="200" />
  </a>
  <br />
  <sub>Scan on an Android phone to install the Farmer app</sub>
</p>

See [Demo credentials](#demo-credentials) below for the Staff ID/PIN to log into Operator/Admin.
Farmers register through the app itself (any 12-digit Aadhaar, OTP shown on-screen).

> **Note:** the Android build link is an EAS internal-distribution artifact, which expires
> ~14 days after it was built — this one on 2026-10-07. If it's gone stale, rebuild it with
> `eas build --platform android --profile preview` (see [`eas.json`](eas.json)) — everything
> needed (Firebase config, keystore) is already configured on the EAS project.

---

## The problem

A farmer brings their crop to an MSP procurement centre and hands it over — and from that
moment on, everything is opaque. How many people are ahead in line? Has the weighing even
happened yet? What grade did the quality check give it? Was the weight recorded correctly, or
quietly under-reported? Registration and slot booking have gone digital in most states, but
what happens *inside* the centre is still largely paper-based — which is exactly where
under-weighing, arbitrary quality cuts, and unofficial commissions slip in, even in states that
already have digital gate-pass systems.

## What KisanQ does differently

KisanQ pushes every weighing entry and every quality-check entry to the farmer's own phone the
moment the operator records it — not after the fact, not on request. That's a timestamped
digital trail that's much harder to quietly alter than a paper register, and it's the one thing
no existing state procurement portal (Haryana e-Kharid, Punjab Anaaj Kharid, Rajasthan MSP
Portal, UP e-Procurement) offers today: **live queue position** combined with **real-time
produce transparency**, in one place.

One Firebase backend, three access surfaces built from a single Expo codebase:

| Surface | Who | Runs as |
|---|---|---|
| **Farmer App** | Farmers, on their own phone | Native app via Expo Go |
| **Operator Console** | Front-desk staff at a procurement centre | Web build, fixed desk |
| **Admin Dashboard** | District/state administrators | Web build, fixed desk |

## Features

**Farmer App**
- 12 languages (Hindi, English, Punjabi, Bengali, Marathi, Gujarati, Telugu, Tamil, Kannada,
  Malayalam, Odia, Urdu) — the very first screen keeps it to Hindi/English for a farmer's first
  ever open, the full list lives in Settings
- Village-first UI — icon pickers and steppers over free text, large touch targets, high contrast
  for outdoor sunlight
- Aadhaar + OTP registration (mocked for the prototype) with a biometric-fallback path
- Advance booking — book a slot for today, tomorrow, or the day after, not just same-day
- Centre selection ranked by live estimated wait, not just distance, showing each centre's live
  remaining daily buying capacity for the crop being booked
- **MSP before you travel** — each centre card shows the crop's official MSP
  ("MSP: ₹2,585/quintal" for wheat). MSP is one fixed government price, not a range; every value
  comes from a single config file ([`src/config/msp.ts`](src/config/msp.ts), RMS 2026-27)
- Digital token with QR code, shareable via WhatsApp; cancel a not-yet-checked-in booking any time
- **Live Queue** — "X people ahead of you," computed live from the centre's actual queue state,
  not a number frozen at check-in
- **Procurement Status tracker** — Booked → Arrived → Weighed → Quality-checked → Accepted →
  Payment, ticking in real time as the operator works. Every weight is shown in quintals
- **Moisture & deduction breakdown** — once a lot is accepted the farmer sees the full sum:
  weight × MSP, moisture found vs the allowed limit, the excess, the ₹ deduction *and the rule it
  came from*, and the final amount. Every number is stored on the procurement record, so what the
  farmer saw at the mandi can't be quietly changed later
- **Payment stages with a date** — Quality accepted → J-Form generated → Payment sent →
  Credited to bank, as a step tracker on the Payment screen, with the expected date (acceptance
  + 3 days, the MSP 72-hour settlement norm). Payments are simulated; no money moves
- **"आपत्ति दर्ज करें" / Raise an objection** — after weighing or quality check the farmer can
  dispute the result (weight wrong / quality or moisture wrong / other, plus an optional note) and
  watch its status (open → resolved) live
- Real-time in-app Notifications (Hindi + English) for every stage change, each also sent as a
  (simulated) SMS
- **Photographs, not emoji, in the crop picker** — ten openly-licensed Wikimedia Commons photos
  (credited in Settings and in [`assets/crops/CREDITS.md`](assets/crops/CREDITS.md)), so bajra and
  jowar are told apart by sight rather than by reading the label. A commodity an admin adds at
  runtime falls back to its emoji
- **A Help button on every screen** — one tap to the Kisan Call Centre, from the language-select
  screen onwards, never covered by the screen's own buttons

**Operator Console**
- Staff ID + PIN login, scoped to one procurement centre, with its own Settings (language + logout)
- QR scan check-in with an always-visible manual token-entry fallback
- Live queue management (Waiting / Processing / Completed) with one-tap "Call Next"
- Weighing (expected vs. actual) and quality check (moisture %, grade, Accept/Reject with a
  confirm step) — both push an instant notification to the farmer
- **MSP pricing on the quality check** — the operator enters moisture % (stepper or typed) and
  grade; the price is never typed. The screen shows the same breakdown the farmer will get
  (weight × MSP − moisture deduction) live before Accept. A crop without a verified MSP can't be
  accepted (it can still be rejected). The operator's staff ID is stored on the procurement record
  for weighing and for quality check
- **Real URLs and a back button** — every staff screen has its own path (`/checkin`, `/queue`,
  `/weighing`, `/quality-check`, `/admin`, `/admin/centres`, …), so browser Back and Forward
  work, a reload keeps you where you were, and a screen can be bookmarked or shared. Weighing
  and Quality Check carry a back chip to the queue; neither writes anything until its confirm
  button, so leaving is safe

**Admin Dashboard**
- Centre/farmer/booking overview counters, with its own Settings (language + logout)
- District → centre drill-down with capacity-utilization flagging for overloaded centres
- **Daily Buying Capacity** — set a daily quintal limit per centre *per crop* (a mandi can be
  buying more than one crop the same day), auto-decremented the moment a booking is Accepted, with
  a manual top-up control for a deliberate policy increase. Capacity is tracked per (centre, crop)
  pair, never as a shared pool — wheat running out never blocks a rice booking, and a booking that
  doesn't fit is rejected with the exact quintals still available
- **Commodity master** — wheat and paddy aren't hardcoded. Commodities live in their own Firestore
  collection with a name, icon and unit (quintal/ton); an admin adds a new one from Settings at
  runtime and it immediately appears everywhere — capacity rows, the farmer's crop
  picker — with no code change and no redeploy. Commodities are deactivated rather than deleted, so
  a crop already referenced by past bookings can never dangle
- **Payments** — every simulated payment with its stage, and a button to move it to the next
  stage; each move notifies the farmer in-app and by SMS
- **Objections** — every farmer objection with the operator who did the weighing/quality check,
  and a "Mark resolved" button (admin-only in the security rules)
- **SMS Log** — every SMS the system sent, with masked mobile numbers, clearly labelled
  *"Simulated — gateway to be integrated in production"*. `sendSms()` in
  [`src/services/sms.ts`](src/services/sms.ts) is the only function to change to plug in a real
  gateway (e.g. MSG91)

## Tech stack

- **Frontend:** React Native + Expo (TypeScript) — one codebase, native build for farmers, web
  build for operators/admins
- **Backend:** Firebase Firestore, with real-time `onSnapshot` listeners (no polling) and
  Firebase Anonymous Auth backing role-scoped security rules
- **Identity:** Aadhaar + OTP is mocked end-to-end — this prototype never calls a real UIDAI API

## Getting started

```bash
npm install
cp .env.example .env
```

Fill in `.env` with your Firebase project's config (Firebase Console → Project Settings →
General → Your apps → SDK setup and configuration). `.env` is git-ignored — never commit real
values.

```bash
npm start        # Farmer app — scan the QR with Expo Go
npm run web      # Operator / Admin web build
```

### Firebase / Firestore setup

1. Create a Firebase project (or use an existing one) with **Firestore** enabled.
2. Add a Web app in the project and copy its config into `.env` (see above).
3. **Enable Anonymous authentication:** Firebase Console → Authentication → Sign-in method →
   add **Anonymous**. The mocked Aadhaar+OTP flow never touches a real UIDAI API, but
   `firestore.rules` still need *some* real `request.auth` to scope access by owner — so every
   device silently signs in anonymously on launch and that uid becomes the farmerId (see
   `src/context/FarmerContext.tsx`). Without this enabled, registration fails with a
   `permission-denied` error.
4. Link the Firebase CLI to your project:
   ```bash
   npx firebase login
   npx firebase use --add
   ```
5. Deploy security rules and indexes (re-run any time `firestore.rules` or
   `firestore.indexes.json` change):
   ```bash
   npx firebase deploy --only firestore:rules,firestore:indexes
   ```
6. Seed demo data (centres, today's slots, a few bookings already ahead of a live demo token —
   see `docs/KisanQ_Missing_Details_Polish.md` section 9):
   - Firebase Console → Project Settings → Service Accounts → **Generate new private key**
   - Save the downloaded file as `serviceAccountKey.json` in the repo root (git-ignored)
   - `npm run seed`

### Demo credentials

| Role | Login | PIN |
|---|---|---|
| Operator — Karnal | `staff-op-1` | `1234` |
| Operator — Panipat | `staff-op-2` | `1234` |
| Operator — Sonipat | `staff-op-3` | `1234` |
| Admin | `staff-admin-1` | `9999` |

Farmers register through the app itself (Aadhaar entry accepts any 12 digits; the OTP screen
shows the demo code on-screen).

## Deployment

Both live-demo surfaces above are deployed from this same codebase, against the same Firebase
project — no separate backend to stand up.

**Operator / Admin (web) → Firebase Hosting:**

```bash
npx expo export --platform web   # static build, output to dist/
npx firebase deploy --only hosting
```

`firebase.json`'s `hosting` config already points at `dist/` with a single-page-app rewrite
(every route falls back to `index.html`, since routing is client-side via React Navigation).

**Farmer app (Android) → EAS Build:**

```bash
eas build --platform android --profile preview
```

`eas.json`'s `preview` profile produces a directly-installable APK (`distribution: "internal"`,
`buildType: "apk"`) rather than a Play Store bundle — no store review needed, just a shareable
link/QR code. The EAS project already has the Android keystore and the `EXPO_PUBLIC_FIREBASE_*`
values needed for the build set as [EAS environment variables](https://docs.expo.dev/eas/environment-variables/)
(cloud builds don't see the local, git-ignored `.env` file, so these have to be set separately —
`eas env:set preview --name <NAME> --value <VALUE>` for each one, matching `.env.example`).

## Project structure

```
kisanQ/
├── App.tsx                  # Entry point — routes Farmer vs Operator/Admin by Platform.OS
├── firebaseConfig.ts         # Reads Firebase config from env vars
├── firestore.rules           # Role-scoped security rules
├── firestore.indexes.json
├── firebase.json             # Firestore + Hosting config (Operator/Admin web deploy)
├── eas.json                  # EAS Build profiles (Farmer app Android APK)
├── scripts/
│   ├── seed.ts               # Demo data seeder (npm run seed)
│   └── reset.ts              # Wipes rehearsal traffic before a demo (npm run reset)
├── src/
│   ├── screens/
│   │   ├── farmer/           # Registration → token → live queue → procurement status
│   │   ├── operator/         # Login → scan/check-in → live queue → weighing → quality check
│   │   └── admin/            # Overview + district → centre drill-down
│   ├── services/
│   │   ├── firestoreService.ts   # All Firestore reads/writes/listeners
│   │   ├── mockAadhaar.ts        # Mocked Aadhaar+OTP lookup
│   │   └── pinAuth.ts            # Staff PIN hashing
│   ├── data/
│   │   ├── commodities.ts     # Bundled fallback commodity list + label/unit helpers
│   │   └── grades.ts          # Quality grades (A/B/C)
│   ├── hooks/
│   │   └── useCommodities.ts  # Live commodity master, Firestore rows over the bundled list
│   ├── context/               # Farmer / Operator / Language React contexts
│   ├── navigation/            # React Navigation stacks (Farmer + Operator/Admin)
│   ├── components/            # Shared UI (buttons, dialogs, progress dots, status badges)
│   ├── theme/                 # Colours, spacing, type scale — from the UI/UX spec
│   ├── i18n/strings.ts        # UI copy in all 12 languages (Hindi default)
│   └── types/firestore.ts     # TypeScript shape of every Firestore collection
└── docs/                      # Full project specification (see below)
```

## Firestore data model

See [`src/types/firestore.ts`](src/types/firestore.ts) for the TypeScript shape of every
collection, and
[`docs/KisanQ_Master_Technical_Spec.md`](docs/KisanQ_Master_Technical_Spec.md#3-data-model-firestore-collections)
for the canonical spec:

`farmers`, `identityVerification`, `crops`, `centres`, `slots`, `bookings`, `queue`,
`procurement`, `payments`, `notifications`, `staff`, `staffSessions`, `tokenCounters`,
`queuePositionCounters`, `commodities`, `centreCropCapacity`, `objections`, `smsLog` (the last
eight are not in the Master Spec — see the comments in `src/types/firestore.ts`).

`commodities/{cropType}` is the runtime commodity master (name, icon, unit, `active`), and
`centreCropCapacity/{centreId}_{cropType}` holds that mandi's daily capacity for that one
commodity — one row per (centre, crop) pair, which keeps each commodity's capacity independent
of every other commodity's. Prices are not stored per centre: MSP, moisture limits and the
(DEMO) deduction rate live in [`src/config/msp.ts`](src/config/msp.ts).

`procurement` records carry the whole payment breakdown (`mspPerQuintal`, `grossAmount`,
`moisturePct`, `moistureLimitPct`, `excessMoisturePct`, `deductionPctPerPoint`, `deductionRule`,
`deductionAmount`, `finalAmount`) plus `weighedByStaffId` / `qualityCheckedByStaffId`.
`payments.status` is one of `quality_accepted → jform_generated → payment_sent → credited`.
`objections/{bookingId}_{weighing|quality}` holds farmer disputes; `smsLog` the simulated SMS.

## Build status

All 7 steps of the Master Spec's build order are done:

| # | Step | Status |
|---|---|---|
| 1 | Firestore schema + Firebase project setup | ✅ |
| 2 | Farmer App: registration → token generation | ✅ |
| 3 | Operator: scan/check-in + live queue management | ✅ |
| 4 | Farmer App: Live Queue + Procurement Status wired to real-time listeners | ✅ |
| 5 | Operator: weighing + quality check | ✅ |
| 6 | Admin dashboard | ✅ |
| 7 | UI polish pass on the Farmer App | ✅ |

Known, documented gaps (not oversights — see `CLAUDE.md` and the relevant code comments for
the reasoning): payments and SMS are simulated only (no bank, no SMS gateway); MSPs for
Kharif crops (paddy, bajra, jowar, maize, cotton, moong) and sugarcane's FRP are not yet
configured, so those crops can be booked but not accepted; moisture limits are configured for
wheat only, and the deduction rate is a DEMO value; staff PIN
verification happens client-side (a Cloud Function would be needed to verify it server-side);
and a handful of Firestore list-query security rules are intentionally broader than
single-document rules because Firestore can't secure a list query with a role check that
requires a `get()` call.

## Documentation

The full project specification lives in [`docs/`](docs/) — start with
[`docs/KisanQ_Master_Technical_Spec.md`](docs/KisanQ_Master_Technical_Spec.md). Working rules
for anyone (human or AI) contributing code are in [`CLAUDE.md`](CLAUDE.md).

| Doc | Covers |
|---|---|
| [`KisanQ_Master_Technical_Spec.md`](docs/KisanQ_Master_Technical_Spec.md) | Tech stack, data model, end-to-end flow, screen list, build order |
| [`KisanQ_UIUX_Spec.md`](docs/KisanQ_UIUX_Spec.md) | Screen-by-screen UI detail, village-first design principles |
| [`KisanQ_Missing_Details_Polish.md`](docs/KisanQ_Missing_Details_Polish.md) | Exact notification copy, empty/error states, token format, wait-time formula |
| [`KisanQ_CrossQuestions_Reference.md`](docs/KisanQ_CrossQuestions_Reference.md) | Edge cases and ground-reality constraints the design accounts for |
| [`KisanQ_Winning_Strategy.md`](docs/KisanQ_Winning_Strategy.md) | The core differentiator and how it maps to judging criteria |
| [`KisanQ_PPT_Script.md`](docs/KisanQ_PPT_Script.md) | Pitch script (background context) |

## License

MIT — see [`LICENSE`](LICENSE).
