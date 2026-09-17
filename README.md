# KisanQ

Smart Farmer Procurement & Queue Management Platform — prototype for **SIH26032**
(Ministry of Consumer Affairs, Food & Public Distribution).

Expo SDK 57 · React Native 0.86 · TypeScript · Firebase Firestore · MIT licensed

## Live demo

Both surfaces run against the real Firebase backend, so there is nothing to set up to try them:

| Surface | Link |
|---|---|
| Operator / Admin (web) | [kisanq-farmer.web.app](https://kisanq-farmer.web.app) |
| Farmer app (Android) | [Download APK](https://expo.dev/accounts/atulshxrma/projects/kisanq/builds/b64d0caf-3ba5-4e09-815a-7b32e5cd3d2f) — open on an Android phone and tap Install. No Play Store or Expo account needed. |

Staff logins are under [Demo credentials](#demo-credentials). Farmers register in the app
itself — Aadhaar entry accepts any 12 digits and the OTP is shown on screen.

The Android link is an EAS internal-distribution build, which expires about 14 days after it
was made — this one on 2026-09-29. Rebuild with
`eas build --platform android --profile preview`; the EAS project already holds the keystore
and Firebase config.

## The problem

A farmer brings their crop to an MSP procurement centre, hands it over, and from that point on
everything is opaque. How many people are ahead? Has the weighing happened? What grade did the
quality check give? Was the weight recorded honestly?

Registration and slot booking are digital in most states. What happens *inside* the centre
mostly isn't, and that is where under-weighing, arbitrary quality cuts and unofficial
commissions live.

## What KisanQ does about it

Every weighing entry and every quality-check entry is pushed to the farmer's own phone the
moment the operator records it. That makes a timestamped trail that is harder to quietly alter
than a paper register. Live queue position and real-time produce transparency in one place is
the combination the existing state portals (Haryana e-Kharid, Punjab Anaaj Kharid, Rajasthan
MSP Portal, UP e-Procurement) don't offer.

One Firebase backend, three surfaces from one Expo codebase:

| Surface | Who | Runs as |
|---|---|---|
| Farmer App | farmers, on their own phone | native, via Expo Go or the APK |
| Operator Console | front-desk staff at a centre | web build |
| Admin Dashboard | district / state administrators | web build |

## Features

### Farmer App

- 12 languages (Hindi default). The first screen offers only Hindi and English so a first-time
  open isn't a wall of choices; the full list is in Settings.
- Village-first UI: icon pickers and steppers instead of typing, ~50dp touch targets, high
  contrast for outdoor sunlight, a Help button on every screen.
- Aadhaar + OTP registration (mocked), with a biometric fallback path.
- Advance booking for today, tomorrow or the day after.
- Centre selection ranked by live estimated wait, showing each centre's remaining daily buying
  capacity for the crop being booked.
- Price range per centre — the ₹ range that mandi is actually paying for this crop, lowest to
  highest grade, so a farmer knows the realistic price before loading the tractor.
- Express slot: a fixed-fee, capped-quota priority booking. Capped deliberately, so it can't
  turn into a bidding war.
- Digital token with QR code, shareable on WhatsApp. A booking can be cancelled until check-in.
- Live Queue — "X people ahead of you", computed from the centre's current queue rather than a
  number frozen at check-in.
- Procurement Status tracker: Booked → Arrived → Weighed → Quality-checked → Accepted →
  Payment, ticking over in real time as the operator works.
- Payment row shows the rate, the total and the date the money is expected (acceptance + 3
  days, the MSP 72-hour settlement norm). It only turns green on an actual settled payment.
  Payments are simulated — no money moves.
- Real-time in-app notifications for every stage change.
- Photographs rather than emoji in the crop picker: ten openly-licensed Wikimedia Commons
  photos (credited in Settings and in [`assets/crops/CREDITS.md`](assets/crops/CREDITS.md)), so
  bajra and jowar can be told apart without reading. Runtime-added commodities fall back to an
  emoji.

### Operator Console

- Staff ID + PIN login, scoped to one centre.
- QR scan check-in, with manual token entry always visible as a fallback.
- Live queue management (Waiting / Processing / Completed) with one-tap Call Next.
- Weighing (expected vs actual) and quality check (moisture %, grade, Accept/Reject behind a
  confirm step). Both notify the farmer immediately.
- Rate entry at quality check: the operator types the ₹/unit actually being paid. Choosing a
  grade pre-fills the admin's rate for it, but the typed value always wins, the payable total
  is shown live, and accepting without a rate is blocked.
- Every staff screen has its own URL (`/checkin`, `/queue`, `/weighing`, `/quality-check`,
  `/admin`, …), so browser Back works, a reload keeps its place, and screens can be bookmarked.
  Neither Weighing nor Quality Check writes anything before its confirm button, so leaving
  mid-screen is safe.

### Admin Dashboard

- Centre / farmer / booking counters.
- District → centre drill-down, flagging centres above the utilization threshold.
- Daily Buying Capacity: a quintal limit per centre *per crop*, since one mandi buys several
  crops the same day. Decremented automatically when a lot is accepted, with a manual top-up
  for a deliberate policy increase. Tracked per (centre, crop) pair, never pooled — wheat
  running out never blocks a paddy booking, and a booking that doesn't fit is refused with the
  quintals still available.
- Commodity master: wheat and paddy aren't hardcoded. Commodities are Firestore rows with a
  name, icon and unit; one added from Settings appears in capacity rows, grade pricing and the
  farmer's crop picker immediately, with no redeploy. They are deactivated rather than deleted
  so past bookings can't dangle.
- Grade-based pricing: the ₹/unit for grades A, B and C per crop, typed in rather than derived
  from the grade letter. These drive the farmer's price range and the operator's pre-fill.

## Tech stack

- **Frontend:** React Native + Expo (TypeScript). One codebase — native for farmers, web build
  for staff, routed by `Platform.OS` in `App.tsx`.
- **Backend:** Firebase Firestore with `onSnapshot` listeners, no polling. Firebase Anonymous
  Auth backs the role-scoped security rules.
- **Identity:** Aadhaar + OTP is mocked end to end. This prototype never calls a real UIDAI API,
  and never stores a raw Aadhaar number — only a reference token.

## Getting started

```bash
npm install
cp .env.example .env
```

Fill `.env` with your Firebase web config (Firebase Console → Project Settings → General → Your
apps → SDK setup and configuration). `.env` is git-ignored; don't commit real values.

```bash
npm start     # Farmer app — scan the QR with Expo Go
npm run web   # Operator / Admin
```

### Firebase setup

1. Create a Firebase project with Firestore enabled.
2. Add a Web app and copy its config into `.env`.
3. **Enable Anonymous authentication** (Authentication → Sign-in method → Anonymous). The
   mocked Aadhaar flow mints no real auth token, but the security rules still need a real
   `request.auth` to scope access by owner, so every device signs in anonymously on launch and
   that uid becomes the farmerId. Without this, registration fails with `permission-denied`.
4. Link the CLI:
   ```bash
   npx firebase login
   npx firebase use --add
   ```
5. Deploy rules and indexes (re-run whenever `firestore.rules` or `firestore.indexes.json`
   change):
   ```bash
   npx firebase deploy --only firestore:rules,firestore:indexes
   ```
6. Seed demo data — centres, today's slots, and a few bookings already queued ahead of the demo
   token:
   - Project Settings → Service Accounts → Generate new private key
   - save it as `serviceAccountKey.json` in the repo root (git-ignored)
   - `npm run seed`

`npm run reset` clears rehearsal traffic before a demo.

### Demo credentials

| Role | Login | PIN |
|---|---|---|
| Operator — Karnal | `staff-op-1` | `1234` |
| Operator — Panipat | `staff-op-2` | `1234` |
| Operator — Sonipat | `staff-op-3` | `1234` |
| Admin | `staff-admin-1` | `9999` |

## Deployment

Both live surfaces deploy from this codebase against the same Firebase project.

Operator / Admin → Firebase Hosting:

```bash
npx expo export --platform web
npx firebase deploy --only hosting
```

`firebase.json` already points hosting at `dist/` with a single-page rewrite, since routing is
client-side.

Farmer app → EAS Build:

```bash
eas build --platform android --profile preview
```

The `preview` profile builds an installable APK rather than a Play Store bundle. Cloud builds
can't see the git-ignored `.env`, so the `EXPO_PUBLIC_FIREBASE_*` values are set as
[EAS environment variables](https://docs.expo.dev/eas/environment-variables/) instead
(`eas env:set preview --name <NAME> --value <VALUE>` for each key in `.env.example`).

## Project structure

```
kisanQ/
├── App.tsx                   # Routes Farmer vs Operator/Admin by Platform.OS
├── firebaseConfig.ts         # Firebase config from env vars
├── firestore.rules           # Role-scoped security rules
├── firebase.json             # Firestore + Hosting config
├── eas.json                  # EAS Build profiles
├── scripts/
│   ├── seed.ts               # Demo data (npm run seed)
│   └── reset.ts              # Clears rehearsal traffic (npm run reset)
├── src/
│   ├── screens/
│   │   ├── farmer/           # Registration → token → live queue → procurement status
│   │   ├── operator/         # Login → check-in → queue → weighing → quality check
│   │   └── admin/            # Overview + drill-down + settings
│   ├── services/
│   │   ├── firestoreService.ts   # All Firestore reads, writes and listeners
│   │   ├── mockAadhaar.ts        # Mocked Aadhaar + OTP
│   │   └── pinAuth.ts            # Staff PIN hashing
│   ├── data/                 # Bundled commodities, grades, crop photos
│   ├── hooks/                # useCommodities — Firestore rows over the bundled list
│   ├── context/              # Farmer / Operator / Language contexts
│   ├── navigation/           # React Navigation stacks
│   ├── components/           # Shared UI
│   ├── theme/                # Colours, spacing, type scale
│   ├── i18n/strings.ts       # UI copy, 12 languages
│   └── types/firestore.ts    # Shape of every Firestore collection
└── docs/                     # Project specification
```

## Firestore data model

`farmers`, `identityVerification`, `crops`, `centres`, `slots`, `bookings`, `queue`,
`procurement`, `payments`, `notifications`, `staff`, `staffSessions`, `tokenCounters`,
`queuePositionCounters`, `expressSlotCounters`, `commodities`, `centreCropCapacity`.

The last six aren't in the Master Spec — the counters exist to allocate token numbers, queue
positions and Express slots atomically; `commodities` and `centreCropCapacity` back the runtime
commodity master and per-crop capacity. `centreCropCapacity/{centreId}_{cropType}` holds one
mandi's daily capacity for one commodity plus its `gradePrices` map, which is what keeps each
commodity's capacity and rates independent of the others.

Field-by-field shapes are in [`src/types/firestore.ts`](src/types/firestore.ts); the canonical
spec is
[`docs/KisanQ_Master_Technical_Spec.md`](docs/KisanQ_Master_Technical_Spec.md#3-data-model-firestore-collections).

## Build status

All seven steps of the Master Spec's build order are done: Firestore schema, farmer
registration → token, operator check-in + live queue, the farmer's real-time Live Queue and
Procurement Status, operator weighing + quality check, admin dashboard, and the farmer-app UI
polish pass.

Known limitations, all deliberate for a prototype:

- Payments are simulated. A payment doc is raised when a lot is accepted and shows as
  "processing" with an expected date, but no gateway is contacted and nothing marks it settled.
- Staff PIN verification happens on the client. A client that already knows a valid staff ID
  could write a `staffSessions` doc without passing the PIN screen; closing that needs a Cloud
  Function to verify the PIN server-side.
- Some Firestore list-query rules are broader than the equivalent single-document rules.
  Firestore can't secure a list query with a role check that needs a `get()` call, so reads on
  `bookings`, `crops`, `queue` and `procurement` are scoped to any signed-in user. Writes stay
  properly scoped. The real fix is custom claims minted by a Cloud Function, which needs the
  Blaze plan.
- The Admin Dashboard's counts are all-time, not per-day, and read whole collections. Fine at
  demo scale, not beyond it.

## Documentation

The specification lives in [`docs/`](docs/) — start with the Master Technical Spec. Working
rules for contributors are in [`CLAUDE.md`](CLAUDE.md).

| Doc | Covers |
|---|---|
| [`KisanQ_Master_Technical_Spec.md`](docs/KisanQ_Master_Technical_Spec.md) | Tech stack, data model, end-to-end flow, screen list, build order |
| [`KisanQ_UIUX_Spec.md`](docs/KisanQ_UIUX_Spec.md) | Screen-by-screen UI detail, village-first design principles |
| [`KisanQ_Missing_Details_Polish.md`](docs/KisanQ_Missing_Details_Polish.md) | Notification copy, empty/error states, token format, wait-time formula |
| [`KisanQ_CrossQuestions_Reference.md`](docs/KisanQ_CrossQuestions_Reference.md) | Edge cases and ground-reality constraints |
| [`KisanQ_Winning_Strategy.md`](docs/KisanQ_Winning_Strategy.md) | The core differentiator and how it maps to judging criteria |
| [`KisanQ_PPT_Script.md`](docs/KisanQ_PPT_Script.md) | Pitch script |

## License

MIT — see [`LICENSE`](LICENSE).
