# KisanQ — Project Instructions for Claude Code

KisanQ is a Smart Farmer Procurement & Queue Management Platform prototype for SIH26032
(Ministry of Consumer Affairs, Food & Public Distribution).

**Before doing any work, read every file in the `docs/` folder.** They contain the complete
specification for this project:

- [`docs/KisanQ_Master_Technical_Spec.md`](docs/KisanQ_Master_Technical_Spec.md) — the primary
  engineering reference: tech stack, Firestore data model, end-to-end app flow, screen list,
  build order. Start here.
- [`docs/KisanQ_UIUX_Spec.md`](docs/KisanQ_UIUX_Spec.md) — full screen-by-screen UI detail and
  village-first design principles (large touch targets, icon+text status, bilingual, high
  contrast). **Read this before writing any screen** — exact button labels, screen order, and
  layout are specified there, not left to invention.
- [`docs/KisanQ_Missing_Details_Polish.md`](docs/KisanQ_Missing_Details_Polish.md) — exact
  notification wording, empty/error states, token format, wait-time formula, security rules
  concept.
- [`docs/KisanQ_CrossQuestions_Reference.md`](docs/KisanQ_CrossQuestions_Reference.md) — edge
  cases and real-world constraints the design already accounts for (Aadhaar fallback, tenant
  farmers, network issues, etc.) — don't silently simplify these away.
- [`docs/KisanQ_Winning_Strategy.md`](docs/KisanQ_Winning_Strategy.md) — the core
  differentiator (real-time queue + weighing/quality transparency, framed as an
  anti-corruption mechanism, not just a nice-to-have status page) — this is the single most
  important feature to get working end-to-end.
- [`docs/KisanQ_PPT_Script.md`](docs/KisanQ_PPT_Script.md) — background/pitch context, not
  needed for coding decisions. The full conversation transcript (not stored in this repo) is
  background only too.

## Stack

- **Frontend:** React Native + Expo (farmer app on mobile via Expo Go; operator and admin as
  the web build of the same codebase via `expo start --web`)
- **Backend:** Firebase Firestore, with real-time snapshot listeners — this is required, not
  optional, since the Live Queue and Procurement Status screens must update in real time
  without polling
- **Identity:** mocked Aadhaar+OTP flow only — never attempt to integrate a real UIDAI API

This repo was scaffolded with `create-expo-app` (blank-typescript template) on Expo SDK 57.
Per `AGENTS.md`, Expo has changed significantly in recent versions — check the versioned docs
at https://docs.expo.dev/versions/v57.0.0/ before writing Expo-specific code (router, config
plugins, etc.) rather than relying on older training knowledge.

## Design principles (village-first — see `docs/KisanQ_UIUX_Spec.md` for full detail)

- Icons + short labels over long text; minimize free typing (dropdowns, icon-pickers, steppers).
- One decision per screen — break multi-field steps into small steps with a progress marker.
- High contrast, large touch targets (~50dp min) — the app is used outdoors in sunlight.
- Never rely on colour alone for status — always icon + text label together.
- Real-world metaphor icons (scale, truck, calendar, bell, ₹), filled/solid style, not thin outlines.
- Hindi is the default language; language choice is the very first screen, big and unmissable.
- Lightweight: vector icons over large images/animations, target the 50–100MB app-size ceiling.
- Show something meaningful even on a slow connection — loading skeletons, not blank screens.
- Confirm before anything irreversible (cancel booking, reject produce).
- A visible Help/Call option on every screen (floating, bottom-right).
- Colours: deep green + warm yellow/mustard primary, white/off-white background, red reserved
  only for rejected/error states — never decorative.
- Font: large rounded sans-serif with good Devanagari support (Noto Sans / Baloo 2), 16sp+ body,
  20sp+ for headers/numbers (token numbers, wait times).
- Flat navigation — every core action reachable in one tap from Home, no hamburger menus.

## Working rules

1. Match the UI/UX spec exactly — screen names, button labels, and flow order are already
   decided. If something in a spec file is ambiguous, ask rather than inventing a simplified
   version.
2. Never silently drop a documented feature (e.g. don't turn the quality-check screen into a
   single text field — it needs moisture %, grade, and an Accept/Reject confirmation, as
   specified).
3. Follow the build order in the Master Technical Spec: Firestore schema → Farmer App
   registration-to-token flow → Operator scan/check-in/live-queue → Farmer Live Queue +
   Procurement Status wired to real-time listeners → Operator weighing/quality screens → Admin
   dashboard (mock data is acceptable here) → UI polish pass on the Farmer App.
4. Use the exact Hindi notification and UI copy given in
   [`docs/KisanQ_Missing_Details_Polish.md`](docs/KisanQ_Missing_Details_Polish.md) rather than
   writing new wording.
5. Never store raw Aadhaar numbers — only a `referenceToken` in `identityVerification/`.
6. Payments are simulated only — no real money movement, ever.
7. Scope is non-perishable MSP crops (wheat, paddy) — not perishables.
8. Staff (operator/admin) PINs are never stored or compared in plaintext — hash before writing
   to `staff/{staffId}.pinHash`.
9. The Procurement Status tracker is the product's core differentiator, not a status page —
   every weighing/quality-check write must reach the farmer's screen in real time, framed as
   transparency against under-weighing/quality-cut fraud (see `KisanQ_Winning_Strategy.md`).

## Firebase / Firestore setup in this repo

- Firebase config lives in [`firebaseConfig.ts`](firebaseConfig.ts) and is read from
  environment variables (see `.env.example`) — never commit real API keys/config to git.
- Firestore document types for every collection in the data model live in
  [`src/types/firestore.ts`](src/types/firestore.ts).
- Security rules matching section 7 of `KisanQ_Missing_Details_Polish.md` live in
  [`firestore.rules`](firestore.rules) — redeploy after editing them
  (`npx firebase deploy --only firestore:rules,firestore:indexes`).
- Demo seed data (centres, slots, sample bookings) lives in
  [`scripts/seed.ts`](scripts/seed.ts) — run with `npm run seed` after real Firebase config is
  in place.
- **Identity model:** the mocked Aadhaar+OTP flow never mints a real auth token, but
  firestore.rules still need a real `request.auth` to scope access by owner/role instead of
  trusting the client. [`src/lib/firebase.ts`](src/lib/firebase.ts) signs every device in with
  Firebase **Anonymous** Auth on launch (invisible to the user), and that uid becomes the
  farmerId once registration succeeds — see [`src/context/FarmerContext.tsx`](src/context/FarmerContext.tsx).
  Anonymous auth must be enabled in Firebase Console → Authentication → Sign-in method.
- Farmer App screens live in [`src/screens/farmer/`](src/screens/farmer/), navigated by
  [`src/navigation/AppNavigator.tsx`](src/navigation/AppNavigator.tsx) (React Navigation native
  stack). Firestore reads/writes for the registration→token flow are centralized in
  [`src/services/firestoreService.ts`](src/services/firestoreService.ts) — add new
  screen-specific Firestore calls there rather than calling `firebase/firestore` directly from
  a screen component.
- Bilingual strings (Hindi default) live in [`src/i18n/strings.ts`](src/i18n/strings.ts); add
  new UI copy there using the exact wording from the docs rather than inline strings in a
  screen.
- **App routes by `Platform.OS`** (`App.tsx`): web → Operator/Admin (`OperatorNavigator`),
  native → Farmer App (`AppNavigator`) — matches the Master Spec's "same codebase, web build"
  architecture without an extra mode-switcher screen the docs never mention.
- **Operator identity model:** Staff ID + PIN login never mints a real auth token either. The
  device signs in anonymously (same mechanism as farmers) and, on successful login, writes
  `staffSessions/{uid}` claiming a role + centreId — firestore.rules cross-checks that claim
  against the real `staff/{staffId}` doc before trusting it. See
  [`src/context/OperatorContext.tsx`](src/context/OperatorContext.tsx) and the long identity-model
  comment at the top of [`firestore.rules`](firestore.rules).
- **Hard-won Firestore limitation, worth knowing before writing more queries:** security rules
  that call `get()`/`exists()` (the only way to check a role without a real custom claim) do
  **not** work to secure *list/collection queries* — only single-document `get()`/write
  requests. `bookings`, `crops`, `queue`, and `procurement` therefore have their **read** rule
  relaxed to `isSignedIn()` (writes stay properly scoped via `get()`-based checks, since writes
  are always single-document). This is a real, documented gap for the prototype — the correct
  fix is a Cloud Function that mints real custom claims on staff login, which needs the Blaze
  plan and is out of scope here. Don't "fix" this by adding a `get()`-based OR-branch to one of
  those read rules — it will silently break every list query on that collection again.
- **`slots.bookedCount`** is incremented by the *farmer's own device* inside `createBooking()`'s
  transaction, not by an operator — a real bug (found via an actual phone booking a slot)
  before `slots` had any update rule a farmer could satisfy. The fix in `firestore.rules` scopes
  it precisely with `diff(resource.data).affectedKeys().hasOnly(["bookedCount"])` plus an
  exact `+1` check, rather than opening `slots` writes broadly — copy that pattern for any
  future farmer-side field bump instead of relaxing the whole collection.
- PIN hashing ([`src/services/pinAuth.ts`](src/services/pinAuth.ts)) is plain SHA-256, no salt —
  `scripts/seed.ts` hashes the demo PINs the same way (Node's `crypto.createHash`) so seeded
  accounts can log in. Demo credentials (all PIN `1234`): `staff-op-1` (Karnal), `staff-op-2`
  (Panipat), `staff-op-3` (Sonipat); `staff-admin-1` / PIN `9999` (admin, not yet used by any
  screen — an admin logging in currently lands on the same Operator screens).
- **Farmer Live Queue / Procurement Status** ([`src/screens/farmer/LiveQueueScreen.tsx`](src/screens/farmer/LiveQueueScreen.tsx),
  [`ProcurementStatusScreen.tsx`](src/screens/farmer/ProcurementStatusScreen.tsx)) listen live
  via `listenQueueForCentre`/`listenBooking`/`listenProcurementForBooking`/
  `listenPaymentForProcurement` in `firestoreService.ts` — no polling. "People ahead of you" is
  a *live* count derived from the centre's whole queue (entries with `status != 'completed'`
  and a lower `position`), not the `estimatedWaitMinutes` field frozen at check-in. The
  Procurement Status "Payment" tick reads the `payments` collection directly rather than
  approximating from `booking.status` — that field flips to `"completed"` the moment
  quality-check finishes (accepted *or* rejected), which is not the same thing as paid. It only
  ticks at the last payment stage, `"credited"`. Procurement Status loads the farmer's booking via
  `getLatestBookingForFarmer()` (active first, else most recent *completed*, by
  `booking.createdAt`) — `getActiveBookingForFarmer()` excludes completed bookings, which made the
  screen go empty exactly when the payment breakdown mattered.
- **`react-native-web`'s `Alert.alert` is a complete no-op stub** (confirmed by reading
  `node_modules/react-native-web/src/exports/Alert/index.js` — it's a one-line empty function).
  It works fine on native, but since the Operator only ever runs on web, any confirm-before-
  action prompt on an Operator screen must use
  [`src/components/ConfirmDialog.tsx`](src/components/ConfirmDialog.tsx) (a real `Modal`-based
  dialog) instead — `Alert.alert` will silently swallow the action with no error and no dialog.
  Farmer-only screens (native) can still use `Alert.alert` safely.
- **Operator weighing + quality check** ([`src/screens/operator/WeighingScreen.tsx`](src/screens/operator/WeighingScreen.tsx),
  [`QualityCheckScreen.tsx`](src/screens/operator/QualityCheckScreen.tsx)) are reached from a
  "Processing" row in Live Queue Management, not from Scan/Check-in — `recordWeighing()` and
  `submitQualityCheck()` in `firestoreService.ts` handle the writes. Both booking and queue
  status become `"completed"` on either Accept *or* Reject (the farmer's turn at the centre is
  over either way); only `procurement.qualityStatus`/`procurementStatus` distinguish the
  outcome. `procurement/{id}` docs are scoped to an operator via the *booking's* centreId (a
  `get()` on `bookings/{bookingId}`, single-document context, not a list query — see
  `isOperatorForBooking()` in `firestore.rules`), since procurement docs don't carry their own
  centreId.
- **`OperatorNavigator.tsx` branches by `session.role`**, not just by whether a session exists:
  `"admin"` renders [`AdminOverviewScreen`](src/screens/admin/AdminOverviewScreen.tsx)/
  [`AdminDrilldownScreen`](src/screens/admin/AdminDrilldownScreen.tsx), anything else renders
  the Operator scan/queue/weighing stack. Both roles share the same `StaffLogin` screen and
  `OperatorProvider` session — there's no separate admin login flow.
- **Admin Dashboard** ([`getAdminOverview()`](src/services/firestoreService.ts),
  `getAdminCentreBreakdown()`) does full, unfiltered collection reads (all farmers, all
  bookings, all queue docs) with **no `where` filter at all** — that's exactly the shape of
  query the get()-in-list-queries limitation above does *not* break, because `isStaff()`
  doesn't depend on `resource.data`; it's a constant per requester, true or false for every
  document in the collection alike, and Cloud Firestore accepts that as provably secure for a
  list. That's different from `isOperatorForCentre(resource.data.centreId)`, which needed a
  matching query filter and *still* wasn't securable as a list rule (see above) — don't assume
  the two situations generalize the same way if you add more admin-side queries.
- These reads are one-time (`getDocs`, no `onSnapshot`) since the Admin Dashboard isn't
  real-time per the Master Spec, and are all-time counts, not scoped to "today" — see the
  comment above `getAdminOverview()` for why. `OVERLOAD_THRESHOLD_PCT` (80%) is a chosen value,
  not a spec number ("above a threshold" is all the UI/UX spec says).
- **Selection state needs a non-colour signal, not just a border/background colour change.**
  An audit for the Farmer App UI polish pass (build order step 7) found several selectable
  cards/rows (crop pickers, centre list, time slots) that only changed border colour when
  selected — a real violation of design principle 4. The fix used everywhere: prefix the
  label/name with `✓ ` when selected, rather than adding a separate badge/icon component —
  keep using that same convention for any new selectable card so it stays consistent. Also
  fixed: two action-link `Pressable`s (OTP fingerprint fallback, Profile Confirm "wrong info?")
  had no `minHeight`, so their tap target was just the text's bounding box, under the ~50dp
  minimum — give any bare text-link `Pressable` an explicit `minHeight: touchTarget`.
- **Express Slot was removed** (SIH26032 review): no paid/priority queue of any kind — queue order
  is plain arrival `position` everywhere (farmer Live Queue, operator Live Queue Management). Don't
  reintroduce `isExpress`-style fields or counters.
- **Pricing = MSP, from one file.** [`src/config/msp.ts`](src/config/msp.ts) holds the official
  RMS 2026-27 MSP per crop (wheat ₹2,585, gram/`chana` ₹5,875, rapeseed & mustard ₹6,200, barley
  ₹2,150, lentil/`masur` ₹7,000 — per quintal), the moisture limit per crop (only wheat's 12% is
  known) and the per-point deduction rate, which is a **DEMO value** (1% of MSP value per 1% excess
  moisture). `final = weight (quintals) × MSP − deduction`, computed by `computeBreakdown()`. Never
  put a price anywhere else, and never guess an MSP: crops without one (paddy, bajra, jowar, makka,
  kapas, ganna, moong, admin-added commodities) return `null`, show no MSP line, and the operator
  can't Accept them (`MSP_NOT_CONFIGURED`). The old per-centre `gradePrices` feature is gone —
  grade is recorded but doesn't change the price.
- **The procurement record is the receipt.** `submitQualityCheck()` stores every breakdown field
  (`mspPerQuintal`, `grossAmount`, `moisturePct`, `moistureLimitPct`, `excessMoisturePct`,
  `deductionPctPerPoint`, `deductionRule`, `deductionAmount`, `finalAmount`) plus
  `weighedByStaffId`/`qualityCheckedByStaffId`. Farmer screens render the stored values
  (`breakdownFromProcurement()`), never recompute from config — a config change must not rewrite
  what the farmer was told. Every weight is in quintals, in every language and notification.
- **Payment stages:** `payments.status` is `quality_accepted → jform_generated → payment_sent →
  credited` (`PAYMENT_STAGES` in `src/types/firestore.ts`). Created at `quality_accepted` by the
  operator's quality-check transaction (rules enforce that), moved forward one stage at a time only
  by an admin via `advancePaymentStage()` (Admin → Payments). Payment docs carry `bookingId` and
  `farmerId` so the farmer's Payment screen (`listenPaymentsForFarmer()`) and admin can find them.
- **Notifications are bilingual and every one is also an SMS.** `message` is Hindi (also the SMS
  text), `messageEn` English — the copy lives in
  [`src/services/notificationText.ts`](src/services/notificationText.ts) (firebase-free, so
  `scripts/seed.ts` uses the same wording). In-app notifications are written inside the
  transaction; `smsFarmer()` sends the SMS *after* it commits (best-effort — an SMS failure never
  fails the operator's action). `sendSms()` in [`src/services/sms.ts`](src/services/sms.ts) only
  writes a masked-number, status `"simulated"` entry to `smsLog` — it's the single function to
  change to plug in a real gateway (MSG91 etc., ideally via a Cloud Function). Rules: only staff
  create `smsLog`, only admin reads it. Any new farmer notification must go through
  `buildNotification()` + `smsFarmer()`.
- **Objections** (`objections/{bookingId}_{weighing|quality}`): deterministic ids so the farmer
  reads their own objection with single-document listeners (`listenObjectionsForBooking()`), which
  keeps the read rule owner-scoped despite the get()-in-list-queries limitation above — admin uses
  an unfiltered list. Create is farmer-only for their own booking (checked with `get()` on the
  booking — fine in a write rule), status `"open"`; only admin may update, and only `status` →
  `"resolved"`. `operatorStaffId` comes from the procurement record's staff fields.
- **Languages:** all 12 (`hi en pa bn mr gu te ta kn ml or ur`) have a complete translation of
  every UI string — `Lang` is a union, so TypeScript refuses a string missing any language. New
  strings need all 12; Hindi/English are the reviewed copy, the other ten should get a native
  speaker's review.
- **Lint:** `npm run lint` (Expo's ESLint config, `eslint.config.js`; `.claude/` worktrees are
  ignored). Keep it at zero errors and zero warnings, alongside `npx tsc --noEmit`.
