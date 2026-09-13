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
  [`firestore.rules`](firestore.rules).
- Demo seed data (centres, slots, sample bookings) lives in
  [`scripts/seed.ts`](scripts/seed.ts) — run with `npm run seed` after real Firebase config is
  in place.
