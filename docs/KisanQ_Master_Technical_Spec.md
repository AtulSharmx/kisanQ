# KisanQ — Master Technical Build Specification

SIH26032 — Smart Farmer Procurement & Queue Management Platform

One self-contained doc: what to build, how the data is structured, how it flows end to end,
and what every screen looks like.

## 1. Core Idea (one paragraph)

KisanQ gives farmers real-time visibility into two things existing government procurement
systems don't show together: how long until their turn at the procurement centre, and exactly
what happened to their produce (weight, quality grade) the moment it's recorded — pushed
straight to their phone. One backend, three access surfaces: Farmer App (mobile), Operator
screens, Admin Dashboard (both of the latter as web views of the same codebase).

## 2. Tech Stack & Architecture

- **Frontend (Farmer App):** React Native + Expo — fastest iteration, live preview on a real
  phone via Expo Go, no Android Studio/Xcode needed for the demo.
- **Operator & Admin:** Same Expo codebase, run as a web build (`expo start --web`) — realistic
  since both are used at a fixed desk, and avoids building a separate app.
- **Backend/data:** Firebase Firestore — real-time listeners are what make the Live Queue
  feature actually work live in the demo, without building custom websocket infrastructure.
- **Identity:** Mocked Aadhaar+OTP for the prototype (clearly labeled as mocked in the
  UI/pitch); production would need real UIDAI e-KYC authorization.
- **Notifications:** In-app push via Firebase Cloud Messaging for the demo; SMS is a
  documented roadmap item, not required for the working prototype.

## 3. Data Model (Firestore collections)

```
farmers/{farmerId}
  name, mobile, verificationStatus, village, district, state, createdAt

identityVerification/{farmerId}
  method: "AADHAAR", status, referenceToken   // never store the raw Aadhaar number
  verifiedAt

crops/{cropId}
  farmerId, cropType, expectedQuantity, preferredCentreId

centres/{centreId}
  name, district, location (geopoint), dailyCapacity, status

slots/{slotId}
  centreId, date, startTime, endTime, capacity, bookedCount

bookings/{bookingId}
  farmerId, centreId, slotId, tokenNumber, status
  // status: booked → arrived → processing → completed → no_show

queue/{queueId}
  bookingId, centreId, position, status, estimatedWaitMinutes
  // this collection is what the Live Queue screen listens to in real time

procurement/{procurementId}
  bookingId, actualWeight, qualityStatus, moisturePct, grade, procurementStatus

payments/{paymentId}
  procurementId, amount, status, transactionReference
  // status: processing → completed. Simulated values only — no real money movement.

notifications/{notificationId}
  farmerId, type, message, channel, status, createdAt
```

**Real-time rule:** any write to a `queue/` or `procurement/` document should trigger an
immediate update on the farmer's Live Queue / Procurement Status screens via a Firestore
snapshot listener — this is the core technical requirement behind the app's whole
differentiator, so get this working before polishing anything else.

## 4. End-to-End App Flow

### Farmer journey

1. Open app → choose language → enter Aadhaar number → mock OTP → auto-filled profile shown →
   confirm
2. Fill village/land/crop/quantity/preferred centre (in small steps, not one long form)
3. Pick a centre from a ranked list (distance + slots + estimated wait) → pick a time slot
4. Get a digital token + QR code, shareable/downloadable
5. Before the slot: reminder notification. At/near the slot: "reach the centre now"
   notification
6. On arrival, operator scans the QR → farmer's app moves to "Arrived," queue position becomes
   visible
7. Farmer watches Live Queue update in real time as the operator processes people ahead of them
8. Operator's weighing entry → farmer's Procurement Status ticks "Weighing completed," shows
   the actual recorded weight
9. Operator's quality check (accept/reject) → status updates, farmer sees grade/moisture
   recorded
10. Procurement marked complete → Payment screen shows value + "Processing" → later "Completed"
    + transaction reference

### Operator journey

1. Log in (staff ID + PIN)
2. Scan farmer's QR (or manually enter token number) → check-in
3. Manage the live queue tab (Waiting / Processing / Completed) → tap "Call Next" to notify the
   next farmer
4. Weighing screen: enter actual weight against expected quantity → confirm
5. Quality check screen: enter moisture/grade → Accept or Reject (with confirmation prompt)

### Admin journey

1. Log in
2. View overview counters (total centres, farmers, today's bookings, completed, waiting,
   average wait)
3. Drill down by district → centre to see bookings/completed/waiting/avg wait/capacity
   utilization, spot overloaded centres

## 5. Screens — UI Detail

*(Design principles: bilingual by default, icon + text for every status — never colour alone,
large touch targets, one decision per screen, real-world metaphor icons, confirm before
irreversible actions. Full rationale in the UI/UX spec doc — this section has the buildable
detail.)*

### Farmer App

- **Splash/Language select** — logo + two big buttons: हिंदी / English
- **Aadhaar entry** — 12-digit numeric field, "आगे बढ़ें" button, help icon bottom corner
- **OTP** — 6-box auto-advancing input, resend-with-timer, "fails → fingerprint with operator"
  fallback link
- **Profile confirm** — auto-filled name/state/district/address/mobile, one confirm button
- **Additional info (3 steps)** — village (searchable list) → crop (icon picker) + quantity
  (+/- stepper) → preferred centre
- **Home dashboard** — 2-column icon grid: Book Slot, My Token, Live Queue, My Produce,
  Procurement Status, Payment, Notifications, Help/Call
- **Add crop/produce** — crop icon picker, quantity stepper, date picker, "check available
  slots" button
- **Centre selection** — list of cards (not map-first): distance, slot availability badge,
  estimated wait, top pick starred
- **Slot booking → token** — time slot grid → full-screen token card with QR, date/time/centre,
  download/share button
- **Live Queue** — big "X people ahead of you," estimated wait, auto-refreshing/real-time
- **Procurement status tracker** — vertical checklist with live-ticking steps
- **Payment status** — value, status badge, transaction reference
- **Notifications** — reverse-chronological list with type icons
- Persistent: home icon (top-left), floating help/call button (bottom-right)

### Operator (web)

- Staff login (ID + PIN)
- Scan/check-in screen (camera QR + manual fallback)
- Live queue management (three tabs: Waiting/Processing/Completed, "Call Next" button per row)
- Weighing screen (expected vs actual, numeric input)
- Quality check screen (moisture/grade fields, Accept/Reject with confirmation)

### Admin (web)

- Overview counters
- District → centre drill-down table/chart, overloaded centres flagged

## 6. Build order (for a 6-person team)

1. Firestore schema + Firebase project setup
2. Farmer App: registration through token generation
3. Operator: scan/check-in + live queue management (this powers the farmer's Live Queue —
   build together)
4. Farmer App: Live Queue + Procurement Status screens wired to real-time listeners
5. Operator: weighing + quality check screens
6. Admin dashboard (mock data acceptable)
7. Polish pass on Farmer App UI only — it's the most-judged surface

Companion docs: UI/UX Spec (design rationale), PPT Script, Winning Strategy, Cross-Questions
Reference — all in the same `docs` folder.
