# KisanQ — Feature Inventory, Future Scope & Real-User Q&A

A single reference document reconstructed from the entire build conversation for this project —
what's genuinely live today, what was researched/discussed/decided but deliberately not built,
and the real practical questions that came up along the way (the kind a jury, a mentor, or an
actual farmer would ask), with the honest answer we arrived at for each.

This file exists so nobody has to scroll back through the whole chat history to remember "wait,
did we build that or just talk about it?" — every claim below is checked against the actual code,
not memory.

---

## Part 1 — What's Actually Built (Live Today)

### Farmer App

- **12-language support** — Hindi, English, Punjabi, Bengali, Marathi, Gujarati, Telugu, Tamil,
  Kannada, Malayalam, Odia, Urdu. The very first screen (before registration) deliberately shows
  only Hindi/English — the full list lives in Settings, reachable any time after.
- **Aadhaar + OTP registration** (mocked) with a fingerprint/biometric fallback path if OTP fails.
- **Village, crop, and centre selection** — village list derived from the mocked Aadhaar's
  district; crop picker covers 10 crops (wheat, paddy, mustard, chana, bajra, jowar, makka,
  kapas, ganna, moong), each translated into all 12 languages; manual quantity entry with a ±1
  stepper.
- **Advance booking** — Today / Tomorrow / Day-after date tabs, not same-day-only.
- **Centre Selection ranked list** — by live estimated wait and distance, and now also shows each
  centre's **live remaining daily buying capacity** for the specific crop the farmer is bringing
  (not a generic centre-wide number).
- **Express (Tatkal-style) priority slot** — a fixed, transparent, escalating-per-slot official
  fee (₹20 for 1st, ₹40 for 2nd) with a hard cap of 2 slots/day/centre. Deliberately not an
  open-ended bidding war — the cap is what stops "everyone just pays a bit more than the last
  person."
- **Digital token with QR code**, shareable via WhatsApp/any share sheet.
- **Cancel booking** — only while status is still "booked" (not yet checked in); releases the
  slot's capacity back for someone else, with a confirm dialog first.
- **Live Queue screen** — "X people ahead of you," computed live from the centre's actual queue
  state (Express entries correctly sort ahead of regular ones without touching anyone's stored
  position).
- **Procurement Status tracker** — Booked → Arrived → Weighed → Quality-checked → Accepted →
  Payment, ticking in real time via Firestore listeners as the operator works, not a page you
  have to refresh.
- **Real-time in-app Notifications** — call-next, weighing-recorded, and quality-checked
  notifications land live.
- **Settings** — full 12-language switcher + Logout.
- Persistent Home and Help/Call FABs on every screen (Help dials the Kisan Call Centre number).

### Operator Console

- Staff ID + PIN login (shared login screen with Admin; role decides what you see next).
- **Scan/Check-in** — QR scan with an always-visible manual token-entry fallback (never hidden
  behind a "can't scan?" link).
- **Live Queue Management** — Waiting / Processing / Completed tabs, one-tap "Call Next," Express
  entries visually flagged and correctly prioritized.
- **Weighing** — expected vs. actual quantity entry.
- **Quality Check** — moisture %, grade (A/B/C), Accept/Reject with a confirm-before-irreversible
  step; either outcome closes out the booking, only the quality fields differ.
- **Operator Settings** — language switcher + logout, same as Admin.
- Consistent icon-chip header across every operator screen (not plain text links).

### Admin Dashboard

- **Overview** — live icon stat cards: total centres, farmers, bookings, completed, currently
  waiting, average wait — all real-time, no manual refresh.
- **District → Centre Drilldown** — per-centre bookings/completed/waiting/avg-wait, with a
  utilization % and an overload flag above a configurable threshold.
- **Daily Buying Capacity management** — set a daily quintal ceiling **per (centre, crop) pair**
  (a mandi can genuinely be buying more than one crop the same day), view the live remaining
  number, and top it up manually (a deliberate policy action, never automatic).
- **Admin Settings** — language switcher + logout.

### Backend / Infrastructure

- Firebase Firestore throughout, with real-time `onSnapshot` listeners — no polling anywhere it
  matters (queue, procurement, notifications, admin dashboards, capacity numbers).
- Firebase Anonymous Auth backing every role-scoped security rule (farmer, operator, admin) —
  documented, deliberate limitation: rules that need `get()` to check a role can't secure
  *list/collection* queries, only single-document reads/writes; several collections' read rules
  are relaxed to "any signed-in device" as a result (see `firestore.rules`'s own comments).
  Writes stay properly scoped.
- Every counter that two people could race for (token numbers, queue positions, Express slots,
  daily capacity) is a Firestore transaction — read-before-write, verified live against the real
  project, not just type-checked.
- **Deployed and public**: Operator/Admin on Firebase Hosting, Farmer app as an installable
  Android APK via EAS Build — see the README for current links.

---

## Part 2 — Missing Features: Future Scope

Grouped by theme. Each item was either explicitly discussed and descoped, or surfaced as a real
gap during testing/review — none of these are silent omissions.

### Identity & continuity
- **No cross-device identity.** A farmer's identity is a Firebase Anonymous Auth UID tied to
  *this device*. Lose the phone, get a new one, or reinstall — the app treats you as a brand-new
  farmer with no history. A real fix would need Aadhaar-linked identity that survives a device
  change, not device-bound anonymous auth.
- **No protection against two people sharing one phone.** A common rural reality (a son's phone
  used by his father too) isn't handled — a second person registering on the same device without
  explicitly logging out first can collide with the first person's session.

### Communication
- **No real SMS gateway.** Every notification today is in-app only (a Firestore doc the farmer
  sees when they open the Notifications screen). The `NotificationType` union already has slots
  for `day_before_reminder`, `near_slot_reminder`, `delay_update`, `payment_processing`, and
  `payment_completed` — none of them are actually written by any function yet; only
  `call_next`, `weighing_recorded`, and `quality_checked` are live.
- **No real push notifications.** A farmer who's already left home and isn't actively looking at
  the app won't see an in-app notification about a delay until they open the app again. Fixing
  this needs `expo-notifications` with real device push tokens, not just a Firestore write.
- **`delay_update` is defined but never fires.** There's no mechanism today that detects "this is
  running late" and tells anyone.

### Queue intelligence
- **Wait-time estimate is a fixed formula, not adaptive.** `estimatedWaitMinutes = (position - 1)
  × 8 minutes` is computed once and frozen — if the operator actually takes 20 minutes on one
  farmer, everyone behind them still sees the old estimate. A real fix (discussed, not built): a
  rolling average of the last few farmers' *actual* processing time, recomputed live, the way
  real queue-management systems (banks, hospitals) do it.
- **No "Mark No-Show."** `BookingStatus` already has a `"no_show"` value, but nothing in the app
  ever sets it. A farmer who books a slot and never shows up leaves that slot's capacity occupied
  forever — nobody else can book it, and there's no operator action to release it.

### Capacity & policy
- **No automatic booking-shift when capacity runs out.** This was explicitly researched and
  descoped for the Daily Buying Capacity feature: if capacity is exhausted *after* a farmer's
  booking is already confirmed, that booking is left untouched — only *new* bookings for that
  centre+crop+day get blocked. Auto-moving an already-confirmed farmer to the next day would
  touch cancellation/rebooking/notification logic that's genuinely riskier than the rest of the
  feature.
- **No automatic daily reset.** `remainingCapacityQuintals` doesn't reset itself at midnight —
  it's managed the same way `slots.bookedCount` is: via the admin's manual top-up, or the
  `seed`/`reset` demo scripts. A real deployment would need actual day-rollover logic.
- **Capacity tracking is opt-in and currently seeded for wheat/paddy only** (matching the
  project's stated MSP scope) — the other 8 crops in the picker aren't capacity-gated unless an
  admin explicitly configures them.

### Trust & anti-corruption (the app's own core pitch)
- **Rejection reason has no audit trail.** It's a plain free-text field an operator fills in —
  nothing stops it from being used to hide a corrupt rejection. This directly cuts against the
  app's own "transparency" narrative and is worth solving properly (e.g. a fixed list of
  reason-codes plus photo evidence) rather than leaving it open text.

### Accessibility & inclusion
- **No phone-call/IVR path for farmers without a smartphone.** Repeatedly discussed as the
  intended Phase 2 — modeled on the already-trusted Kisan Call Centre (1800-180-1551) pattern —
  but not built; today's app is smartphone-only.
- **No text-to-speech / voice guidance** for low-literacy farmers.
- **No text-size / accessibility toggle** in Settings.
- **No offline mode.** Firestore's offline persistence/local cache isn't enabled anywhere, so a
  slow or intermittent connection (explicitly reported as a real, personally-experienced problem)
  makes every screen feel like it's hung rather than just slow — there's no connectivity-aware
  banner, and most of the `noInternet`/`retry` copy already written into the i18n strings isn't
  actually wired to real network-state detection.

### Compliance & production-readiness
- **Real Aadhaar verification isn't wired up.** UIDAI's official e-KYC integration would be
  needed for anything beyond a demo.
- **Real payment processing isn't wired up.** Payments are simulated only, deliberately — no real
  money moves anywhere in this codebase.
- **No server-side PIN verification.** Staff PIN checking happens client-side; closing this gap
  for real needs a Cloud Function, which needs the Blaze billing plan — out of scope for this
  prototype.
- **The `get()`-in-list-queries Firestore rules gap** (see `firestore.rules`'s own long comment)
  has a known, correct fix — a Cloud Function minting real custom claims on staff login — that
  also needs Blaze and hasn't been built.
- **Data sovereignty isn't addressed.** Firebase's infrastructure isn't India-hosted by default;
  a real government deployment would need to answer where farmer/Aadhaar-linked data actually
  lives.
- **No onboarding/discovery plan.** Nothing in the product tells a farmer this app exists or why
  they should install it over doing nothing — a real launch needs an awareness/adoption plan,
  not just the app itself.

### Smaller, not-yet-decided ideas
- A 7-day scrollable date-strip instead of the current 3-day Aaj/Kal/Parso tabs (proposed, not
  confirmed).
- Whether to lead the pitch with the Express feature at all, given the tension with the
  anti-corruption narrative (recommended: don't lead with it, keep it low-key) — not a build gap,
  a messaging decision.
- A default/preferred-centre setting, and an About/app-version entry, both raised as reasonable
  Settings additions but not built.

---

## Part 3 — Real-User Questions We Worked Through

These are the actual practical, "put yourself in a real person's shoes" questions raised during
this project's build, in the order the underlying problem was worked through — with the honest
answer, not a marketing one.

**Q: Advance booking — kya farmer aaj ke alawa kal ya parso ke liye bhi slot book kar sakta hai?**
Haan — Today/Tomorrow/Day-after date tabs already build hain. Har din ke apne slots hain, alag
`date`-keyed Firestore docs, token/Express counters bhi slot ki apni date se keyed hain (aaj ke
date se nahi) taaki advance booking token sequence ko galti se mix na kar de.

**Q: Price constraint / Express — koi zyada paisa deke line jaldi nikal sakta hai kya, bina yeh
ki sab dheere-dheere zyada aur zyada offer karte rahein?**
Yeh asli sawaal tha jispe deep sochna pada. Ek open-ended "jo zyada de woh aage" system genuinely
tootega — jaisa mentor ne khud bataya, har agla insaan thoda aur zyada offer karega. Solution:
Tatkal-jaisa mechanism — fixed, published price, HARD capped quota (2 slots/din/centre). Ek baar
quota khatam, koi bhi kitna bhi paisa de, aur slot nahi milega. Live test kiya: teesra khareedar
genuinely reject hota hai chahe woh zyada pay karne ko taiyar ho.

**Q: (Case 1) Agar pichli appointment ka time 15 minute se zyada exceed ho jaye, to agli
appointment pe kya asar padega?**
Abhi honestly ek real gap hai — wait-time ek fixed 8-min-per-person formula se calculate hota hai
jo kabhi update nahi hota chahe operator ek farmer pe zyada time le le. Proposed fix: rolling
average jo actual processing time se live adapt kare (rolling-average solution documented above).

**Q: (Case 2) 3 consecutive appointments 15-15 minute delay ho jayein to current appointment
kaise manage karenge?**
Same root cause jaisa Case 1 — errors compound hote jaayenge kyunki formula static hai. Fix wahi
rolling-average approach, jo compounding delays ko bhi naturally absorb kar lega.

**Q: (Case 3) Agar consumer/farmer apne slot pe late aa jaye to usko kaise handle karenge?**
Achhi khabar: queue position booking-time pe nahi, **check-in-time** pe assign hoti hai — matlab
late aane pe apna spot nahi khota, bas jab pahunchega tab jo position free ho wahi milegi. Buri
khabar: agar poore din nahi aata, uska slot forever "booked" reh jaata hai, koi release mechanism
nahi hai. `no_show` status type mein hai, use kahin nahi hota — yeh ek genuine open gap hai.

**Q: (Case 4) Agar main apni booking cancel karna chahu to kya hota hai?**
Yeh already poora bana hua hai — `cancelBooking()` transaction, slot capacity turant free, confirm
dialog pehle, sirf tab tak allowed jab tak check-in nahi hua.

**Q: Farmer ghar se nikal chuka hai, raaste mein hai, aur isi beech delay ho jaye — tab kya
karenge, jab woh screen dekh hi nahi raha?**
Yeh Case 1/2 se alag, deeper sawaal tha — sirf number sahi calculate karna kaafi nahi, jo already
travel kar raha hai use REACH karna hai. Asli gap: abhi "notification" ka matlab hai Firestore
entry likhna, jo tabhi dikhta hai jab farmer khud app khole — koi push notification nahi hai.
Real fix: `expo-notifications` se real push (lock-screen tak pahunche bina app khole), aur SMS
backup un farmers ke liye jinke paas smartphone nahi ya jinka data off hai raaste mein.

**Q: College/gaon mein internet slow hai, kabhi aata hi nahi — us waqt app bahut slow ho jaati
hai, isko kaise theek karein?**
Root cause verify kiya: Firestore ka offline cache kahin bhi enable nahi hai, har screen har baar
fresh network call karta hai — chahe wahi data 2 minute pehle dekha ho. `noInternet`/`retry` jaisi
strings already likhi padi hain lekin real connectivity-detection se judi nahi hain. Fix: Firestore
persistent cache on karna + `netinfo`-based real "offline/slow" banner + spinner ki jagah timeout
ke baad "Retry" button.

**Q: Ek hi phone do log (jaise pita-putra) use karein to kya hoga?**
Genuine gap — identity device ke anonymous-session se judi hai, insaan se nahi. Bina logout kiye
dusra farmer register kare to data overlap ho sakta hai. Aage Aadhaar-linked persistent identity
chahiye hogi isko sahi tarike se solve karne ke liye.

**Q: Agar phone kho jaye ya naya le lein, purana booking-history wapas milega kya?**
Nahi — yehi identity-per-device design ka sabse bada practical consequence hai. Naya device = ek
bilkul naya anonymous farmer record, purana kuch bhi link nahi hota. India mein phone
kho-jaana/badalna bahut common hai, isliye yeh genuinely important gap hai.

**Q: Payment kaise hota hai, kisan ko kaise/kab milega?**
Abhi poori tarah simulated hai, koi asli paisa transfer nahi hota (jaanbujhke, Ministry ke saath
official integration hone tak). Procurement Status screen sirf payment ka *status* track karta
hai, uski koi real mechanism (bank transfer, cheque, etc.) abhi define nahi hai.

**Q: Fasal reject ho gayi to farmer ko ab kya karna chahiye?**
Reason dikhta hai screen pe, lekin uske baad "ab kya karu" (wapas le jau? kahin aur becho?
appeal?) koi guidance nahi di jaati — sirf ek information-display hai, action-guidance nahi.

**Q: Agar centre pe hi internet na ho, to poora din kagaz-register pe wapas jaana padega?**
Haan, abhi genuinely aisa hi hoga — koi offline-first design nahi hai. Yeh sabse practical, sabse
bada risk hai is app ke rural-deployment context mein.

**Q: e-NAM jaisa system already hai — farmer isko kyu install karega, use pata kaise chalega?**
Yeh product ka sawaal nahi, go-to-market ka hai — app khud mein koi onboarding/awareness mechanism
nahi rakhta. Ek real launch ke liye alag adoption plan chahiye hoga.

**Q: Kisan ka Aadhaar-linked data Google/Firebase (ek US company) ke server pe ja raha hai —
sarkar isko allow karegi?**
Yeh genuinely address nahi kiya gaya hai. Real government deployment ke liye data-residency ka
jawab dena hoga, ek prototype ke liye chhoda gaya scope-item hai.

**Q: Operator corruption ke wajah se rejection ka galat reason likh sakta hai — system detect
karega?**
Nahi — yeh ek real weakness hai jo app ki apni "anti-corruption transparency" pitch ko hi kamzor
karta hai. Rejection reason ek plain free-text field hai, koi tamper-check ya audit trail nahi.

**Q: Weighing/operator update — jab operator weight update karta hai, uska poora flow kya hai,
aur agar farmer weight se disagree kare to?**
Weighing flow khud poora bana hai (expected vs actual, ek hi booking pe idempotent — dobara khole
to duplicate procurement doc nahi banta). Lekin farmer-side dispute/appeal ka koi mechanism nahi
hai agar unhe lage ki unka weight galat record hua — yeh bhi wahi "transparency" pitch se juda ek
open gap hai, rejection-reason wale point jaisa hi.

**Q: Ek mandi ek din mein sirf ek fasal khareedti hai ya alag-alag bhi ho sakti hain — capacity
kaise track hogi?**
Yehi wo sawaal tha jisne Daily Buying Capacity feature ko poora redesign karwaya. Real mandis ek
se zyada crop same din khareed sakti hain (jaise Rabi season mein wheat + mustard saath). Isliye
capacity ab centre-wide ek number nahi, balki **har (centre, crop) pair ke liye alag** track hoti
hai — Karnal aaj wheat aur paddy dono khareed sakta hai, dono ki apni-apni alag limit ke saath.
