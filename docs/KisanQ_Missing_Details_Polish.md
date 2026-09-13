# KisanQ — Missing Details & Final Polish

Small things not written down anywhere else yet.

## 1. Notification exact copy (Hindi text to actually use)

These were described by type but never given exact wording — use these directly in the app:

- **Day-before reminder:** "कल आपकी स्लॉट है — [समय] बजे [केंद्र का नाम] पर पहुंचें।"
- **Near-slot reminder:** "आपका समय हो गया है — कृपया अभी केंद्र पहुंचें।"
- **Delay update:** "देरी हो रही है। नया अनुमानित समय: [X मिनट]।"
- **Call Next (operator-triggered):** "काउंटर [X] पर पहुंचें — आपकी बारी आ गई है।"
- **Weighing recorded:** "आपका वज़न दर्ज हुआ: [X] किलो।"
- **Quality checked:** "गुणवत्ता जांच पूरी — ग्रेड: [X]।"
- **Payment processing:** "भुगतान प्रक्रिया में है।"
- **Payment completed:** "भुगतान पूरा हुआ — ₹[X] आपके खाते में।"

## 2. Empty states (what a screen shows with nothing in it yet)

Not covered before — every list-based screen needs a first-time/empty version, not just a
blank white page:

- **My Produce (no crops added yet):** icon + "अभी कोई फसल जोड़ी नहीं गई" + a button to add one
- **Notifications (none yet):** icon + "अभी कोई सूचना नहीं"
- **Live Queue (no active booking):** "आपकी कोई बुकिंग नहीं है" + button to book a slot
- **Payment (nothing processed yet):** "अभी कोई भुगतान नहीं"

## 3. Error states (never discussed — real apps need these)

- **No internet during booking:** show "इंटरनेट कनेक्शन जांचें" with a retry button — never let
  the screen just spin forever
- **QR scan fails at operator side:** fall back to manual token-number entry field (already
  implied, now explicit: this field should always be visible next to the scan button, not
  hidden behind a "can't scan?" link)
- **Firestore write fails (e.g., operator loses connection mid-weighing):** show a clear
  "सेव नहीं हुआ, दोबारा कोशिश करें" message, don't silently lose the entry

## 4. Token number format (was just an example before — now a real rule)

Format: `[Centre code]-[4-digit sequential number, resets daily]` — e.g., `KSN-1048` where KSN
is the centre's short code. Sequential per centre per day, not random — this makes tokens
predictable and easy for operators to sanity-check against the physical queue.

## 5. Login/session behaviour (not explicitly stated before)

- Farmer stays logged in after first Aadhaar+OTP registration — mobile+OTP login is only
  needed again if they log out or switch devices, not every single time they open the app.
- Operator and Admin need their own login — simplest for a prototype: a staff ID + PIN set up
  by an admin when creating their account (not Aadhaar-based, since they're staff, not
  farmers).

## 6. Live Queue wait-time calculation (was left vague as "estimated wait" — here's the actual formula)

```
estimated_wait = (farmer's queue position – 1) × average_processing_time
```

For the demo, assume `average_processing_time = 8 minutes` (a reasonable real-world figure for
check-in + weighing + quality check combined) so the numbers shown on screen look sensible
rather than arbitrary.

## 7. Firestore security rules (concept — not written anywhere yet)

- A farmer can only read/write their own documents in `farmers/`, `bookings/`, `crops/`
  (matched by their own `farmerId`).
- An operator can only write to `queue/`, `procurement/` documents belonging to bookings at
  their assigned centre.
- Admin has read access across all collections, write access only to `centres/` management.
- This is worth a single slide line if asked: "access is scoped by role in the database rules
  themselves, not just hidden in the UI."

## 8. What happens on "Reject" in quality check (never followed through before)

When an operator rejects produce: `procurementStatus` is set to "rejected," the farmer's
Procurement Status screen shows this clearly with the reason (moisture/grade issue) rather
than just stopping silently, and the token is marked closed. A rejected farmer keeps their
produce (no payment obligation) — the app should say so plainly rather than leaving them
guessing.

## 9. Demo seed data (needed before the live demo, not covered before)

Before presenting, pre-populate: at least 2-3 centres, a handful of time slots (some full, some
available) for the current date, and 1-2 "fake" farmer bookings already sitting in the queue
ahead of your live demo booking — so the Live Queue screen shows a realistic "3 people ahead of
you" rather than an empty queue that makes the feature look unimpressive.

## 10. Demo-day contingency plan (important, never discussed)

- **Record a backup video** of the full working flow a day or two before presenting — if venue
  wifi fails or Firestore has a hiccup live, play the video rather than fumbling in front of
  judges.
- Have the app pre-installed and pre-logged-in on the demo phone before you're called up —
  don't do first-time setup live.
- Charge the demo phone and laptop fully; carry a power bank.
- If possible, test on the actual venue wifi beforehand — college hackathon networks are often
  congested.

## 11. Small UI wording examples (principle was stated before, exact text wasn't)

- **Confirm-before-cancel dialog:** "क्या आप वाकई अपनी स्लॉट रद्द करना चाहते हैं?" with two
  buttons — "हाँ, रद्द करें" / "नहीं"
- **Consent line at registration** (strengthens the "we care about privacy" narrative already
  in the pitch): a short line before Aadhaar entry — "आपकी जानकारी सिर्फ पंजीकरण के लिए इस्तेमाल
  होगी, सुरक्षित रखी जाएगी।"

*This file plus the other six in the docs folder should now cover the plan end to end — from
pitch script down to notification wording and demo-day contingency.*
