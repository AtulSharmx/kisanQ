# KisanQ

Smart Farmer Procurement & Queue Management Platform — a prototype for SIH26032 (Ministry of
Consumer Affairs, Food & Public Distribution).

Full specification lives in [`docs/`](docs/) — start with
[`docs/KisanQ_Master_Technical_Spec.md`](docs/KisanQ_Master_Technical_Spec.md). Working rules
for anyone (human or AI) contributing code are in [`CLAUDE.md`](CLAUDE.md).

## Stack

- **Farmer app:** React Native + Expo (`npm start`, scan with Expo Go)
- **Operator & Admin:** same codebase, web build (`npm run web`)
- **Backend:** Firebase Firestore, with real-time snapshot listeners

## Getting started

```bash
npm install
cp .env.example .env
```

Fill in `.env` with your Firebase project's config (Firebase Console → Project Settings →
General → Your apps → SDK setup and configuration). `.env` is git-ignored — never commit real
values.

```bash
npm start        # farmer app, via Expo Go
npm run web      # operator / admin web build
```

## Firebase / Firestore setup

1. Create a Firebase project (or use an existing one) with **Firestore** enabled.
2. Add a Web app in the project and copy its config into `.env` (see above).
3. **Enable Anonymous authentication:** Firebase Console → Authentication → Sign-in method →
   add **Anonymous**. The mocked Aadhaar+OTP flow never touches a real UIDAI API, but
   firestore.rules still need *some* real `request.auth` to scope access by owner — so every
   device silently signs in anonymously on launch and that uid becomes the farmerId (see
   `src/context/FarmerContext.tsx`). Without this enabled, registration will fail with a
   `permission-denied`/auth error.
4. Link the Firebase CLI to your project:
   ```bash
   npx firebase login
   npx firebase use --add
   ```
5. Deploy security rules and indexes (re-run this any time `firestore.rules` or
   `firestore.indexes.json` change):
   ```bash
   npx firebase deploy --only firestore:rules,firestore:indexes
   ```
6. Seed demo data (2-3 centres, today's slots, a couple of fake bookings ahead of a live demo
   token — see `docs/KisanQ_Missing_Details_Polish.md` section 9):
   - Firebase Console → Project Settings → Service Accounts → **Generate new private key**
   - Save the downloaded file as `serviceAccountKey.json` in the repo root (git-ignored)
   - `npm run seed`

## Firestore data model

See [`src/types/firestore.ts`](src/types/firestore.ts) for the TypeScript shape of every
collection, and [`docs/KisanQ_Master_Technical_Spec.md`](docs/KisanQ_Master_Technical_Spec.md#3-data-model-firestore-collections)
for the canonical spec:

`farmers`, `identityVerification`, `crops`, `centres`, `slots`, `bookings`, `queue`,
`procurement`, `payments`, `notifications`, `staff`, `staffSessions`, `tokenCounters`,
`queuePositionCounters` (the last four are internal, not in the Master Spec — see the comments
in `src/types/firestore.ts`).

## What's built so far

**Farmer App** (build order step 2 — registration through token generation), on native/Expo Go:
Splash/Language → Aadhaar+OTP (mocked) → Profile Confirm → Village/Crop/Preferred Centre →
Home Dashboard → Add Crop → Centre Selection (ranked by estimated wait) → Slot Booking → Token
screen with QR + share. Live Queue, Procurement Status, and Payment show their documented empty
states (Missing Details Polish sec. 2) until real-time listeners are wired up (step 4).

**Operator** (build order step 3 — scan/check-in + live queue), on the web build: Staff Login
(ID + PIN — demo: `staff-op-1` / `1234`) → Scan/Check-in (camera QR + always-visible manual
token entry, per Missing Details Polish sec. 3) → Live Queue Management (Waiting/Processing/
Completed tabs, real-time via `onSnapshot`, "Call Next" pushes a notification to the farmer).
Checking a farmer in is what actually starts populating their Live Queue position.
