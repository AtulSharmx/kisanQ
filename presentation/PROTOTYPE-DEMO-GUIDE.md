# KisanQ — Prototype Demo Master Guide

**For the 3 members who demo the working app to the judges. SIH26032 · Team CodeCrew.**

Read this once end to end. It is not a script — nothing here is meant to be said word for word.
It tells you what exists, what to press, what to point at, and what to say when a judge pushes back.
If you have read this file, you can run the demo alone.

---

## 0. Who does what

Yesterday's problem was not the content — it was that six people each read one slide and nobody
ever showed the judges a working thing. Today the three of us are the proof, not the narration.

| Role | Who | Job |
| --- | --- | --- |
| **Driver** | 1 member | Holds the phone, drives the app. Talks while tapping. Never goes silent. |
| **Second** | 1 member | Stands next to the Driver on the **laptop / operator portal**. Also the safety net if the phone dies. |
| **Floater** | 1 member | Goes to the judges' side of the table, explains what they are looking at, takes questions so the Driver does not have to stop tapping. |

**The single most important rule:** the phone and the laptop must be visible to the judges **at the
same time**. The whole product is that what the operator types on the laptop appears on the farmer's
phone in the same second. If the judges only see one screen at a time, we have shown them nothing
they cannot already imagine.

**Handoff from the PPT team:** the last PPT speaker should end with a line that hands over, e.g.
*"Ye sab hum bol rahe hain — ab dekhiye chal raha hai."* Do not let there be a 20-second gap where
somebody is opening an app. Have everything already open (see the checklist below).

---

## 1. Pre-demo checklist (do this BEFORE you enter the room)

Tick every line. A demo that dies at the login screen is worse than no demo.

- [ ] **APK installed and logged in already.** Do not register live unless a judge asks — it costs
      90 seconds. Register once beforehand so the app opens straight on Home.
- [ ] **A second phone** (the Second's phone) with the APK installed too, already registered as a
      *different* farmer. This is the backup AND it makes the "3 people ahead of you" number real.
- [ ] **Laptop browser open on `https://kisanq-farmer.web.app`**, already logged in as
      `staff-op-1` / PIN `1234`, sitting on the **Live Queue** screen.
- [ ] **A second browser tab** logged in as admin (`staff-admin-1` / PIN `9999`) on `/admin`.
      Use a different browser or a private window — same browser, two tabs, will share one session.
- [ ] **Mobile hotspot ready** on two different SIMs. Venue WiFi fails. This is not paranoia.
- [ ] **Brightness to maximum** on the phone, and **browser zoom ~110–125%** on the laptop so a judge
      standing two feet away can actually read the queue table.
- [ ] **One booking already created and checked in**, sitting at the "Processing" stage — so you can
      show the live weighing moment inside 30 seconds without booking from scratch.
- [ ] Phone on **Do Not Disturb**. A WhatsApp banner over the token QR is a bad look.
- [ ] Know your fallback: if the internet dies, you still have the **APK link and the live URL in the
      README** — show the README on GitHub, and keep going with the story. Never freeze.

**Demo logins (memorise these, don't read them off a chit):**

| Portal | ID | PIN | Lands on |
| --- | --- | --- | --- |
| Operator (Karnal) | `staff-op-1` | `1234` | `/checkin` |
| Operator (Panipat) | `staff-op-2` | `1234` | `/checkin` |
| Operator (Sonipat) | `staff-op-3` | `1234` | `/checkin` |
| Admin | `staff-admin-1` | `9999` | `/admin` |

Farmer app: **any 12-digit number** works as Aadhaar, and the OTP is **`123456`** — it is printed on
the OTP screen itself, so you can point at it rather than looking like you typed a secret.

---

## 2. The demo in 4 minutes — the shape of it

Do not walk through every screen. Walk through **one farmer's one day**, and let the screens appear
as that story needs them. This is the order that works:

1. **The problem, in one sentence, holding the phone up.** (10 sec)
2. **Farmer books a slot and gets a token.** (60 sec)
3. **Farmer reaches the mandi — operator scans them in.** (30 sec)
4. **THE MOMENT: operator weighs and grades; the farmer's phone updates live.** (60 sec)
5. **Payment appears with a date on it.** (20 sec)
6. **Admin sees which mandi is overloaded.** (40 sec)
7. **Hand to Q&A.** (rest)

If you are running out of time, cut step 6, never step 4.

---

## 3. Farmer App — screen by screen

The farmer app is the **Android APK**. (Same codebase; the web build is the staff portal — that is
why the URL shows the operator console and not the farmer app. Say this if a judge asks; it is a
deliberate architecture decision, not a limitation.)

### 3.1 First open — language

Twelve languages: Hindi, English, Punjabi, Bengali, Marathi, Gujarati, Telugu, Tamil, Kannada,
Malayalam, Odia, Urdu. The **very first screen shows only Hindi and English** — a farmer's first-ever
tap should not be a list of twelve things. The full list lives in Settings.

> Point out: Hindi is the default, not English. The whole app is built Hindi-first.

### 3.2 Aadhaar + OTP

- Type any 12 digits → **आगे बढ़ें**
- OTP screen shows `(डेमो) OTP: 123456` on screen. Type it.
- There is a **fingerprint fallback link** ("Operator ke paas fingerprint se verify karein") for a
  farmer whose phone has no network or who cannot receive the OTP.

> **Say this before a judge asks it:** Aadhaar verification is **mocked** — we never call a real UIDAI
> API, and we **never store the Aadhaar number**. Only a reference token is stored. Saying this
> first makes you look careful. Being caught on it makes you look careless.

### 3.3 Profile confirm

Name, state, district, address, mobile come back pre-filled from the (mocked) eKYC. Two buttons:
confirm, or **"galat jaankari? Operator ko batayein"** — because a farmer cannot fix an Aadhaar
record from an app, and pretending otherwise would be a lie in the UI.

### 3.4 Village → Crop → Preferred centre (3 small steps, with a progress dot)

**One decision per screen.** This is a deliberate design principle, not laziness — a village farmer
filling a 6-field form on a phone in sunlight is the thing that kills adoption.

- **Village:** searchable list.
- **Crop:** a grid of **real photographs** — wheat, paddy, mustard, chana, bajra, jowar, makka,
  kapas, ganna, moong — plus a quantity stepper in quintals and a direct-type box.
  > Worth pointing at: these are photographs, not emoji, so bajra and jowar are told apart **by
  > sight**, not by reading a label. Credits for every photo are inside Settings — all openly
  > licensed. Judges notice this kind of care.
- **Preferred centre:** Karnal Sadar Mandi / Panipat Grain Market / Sonipat Procurement Centre.

### 3.5 Home

Eight tiles, everything one tap away, no hamburger menu:
**स्लॉट बुक करें · मेरा टोकन · लाइव कतार · मेरी फसल · प्रक्रिया स्थिति · भुगतान · सूचनाएं · सेटिंग्स**

> The **📞 button in the bottom-right corner is on every single screen**, from language-select
> onwards. One tap dials the Kisan Call Centre (1800-180-1551). Point at it once — "har screen par,
> pehli screen se" — it reads as a product that has actually thought about its user.

### 3.6 Book Slot — the screen with the most to show

- **Date tabs: today / tomorrow / day after.** Advance booking, not just same-day. This alone removes
  the "reach the mandi at 4am and hope" behaviour.
- **Centres ranked by live estimated wait**, not just distance — and each centre shows its **remaining
  daily buying capacity** for the crop being booked.
- **A price range per centre** — the ₹/quintal that mandi is actually paying, lowest grade to highest.
  > This is a genuinely strong line: *"Farmer ko tractor lodne se pehle pata hai ki kaunsi mandi kitna
  > de rahi hai."* Price discovery before travel, not after.
- **Express slot (Tatkal-style):** a fixed fee, a capped quota. If a judge frowns, get ahead of it:
  it is a **fixed** fee with a **hard cap**, deliberately not an open bidding war, because auctioning
  queue position would price out exactly the farmer this is for.
- Time slot grid → confirm.
- If the crop does not fit the centre's remaining capacity, the error tells you **how many quintals
  are actually left**, not a flat "centre full".

### 3.7 My Token

A **token number and a QR code**, shareable on WhatsApp. A booking that has not been checked in yet
can be cancelled any time (with a confirm dialog — nothing irreversible happens on one tap).

> The WhatsApp share matters: a farmer whose own phone is basic can have the token sent to whoever
> is driving the tractor.

### 3.8 Live Queue

**"X people ahead of you"** — and say this part precisely, because it is the difference between us and
a status page: that number is **computed live from the centre's actual queue right now**, not a number
frozen at check-in time. If someone ahead finishes, the farmer's number drops on its own.

### 3.9 Procurement Status — this is the product

Six steps, each with an icon *and* a text label (never colour alone):

**Booked → Arrived → Weighed → Quality checked → Accepted → Payment**

Keep this screen open on the phone while the Second works the operator laptop. See §5.

### 3.10 Payment

Rate per quintal, total, and — the part to slow down on — **"Payment in process"** with an
**expected payment date** (acceptance + 3 days, following the 72-hour MSP settlement norm).

> Why it matters, in one line: *"Processing likh dena aur date na dena — wahi to farmer ka asli
> problem hai."* An open-ended "processing" is the limbo this whole tracker exists to end.
> The row only turns green on an actually settled payment.

**Say it plainly: payments are simulated. No money moves.** Do not let a judge discover that.

### 3.11 Notifications & Settings

Real-time in-app notification for every stage change. Settings has the 12 languages, the photo
credits, and an explicit logout.

---

## 4. Operator Portal — `https://kisanq-farmer.web.app`

Log in with `staff-op-1` / `1234`. Every screen has a **real URL and a working browser Back button** —
worth demonstrating for two seconds, because it is the difference between a demo and a product.

| Screen | URL | What it does |
| --- | --- | --- |
| Login | `/login` | Staff ID + PIN, scoped to one centre |
| Scan / Check-in | `/checkin` | QR scan, **with a manual token-entry box always visible** |
| Live Queue Management | `/queue` | The day's queue; a row in "Processing" opens weighing |
| Weighing | `/weighing` | Expected qty vs **actual weight** → confirm |
| Quality Check | `/quality-check` | Moisture %, grade, ₹/unit, Accept / Reject |
| Settings | `/settings` | Language + logout |

Things to point out while you are there:

- **Manual entry next to the QR scanner is always visible, not hidden behind "having trouble?"** —
  because a cracked screen or a dead phone at the gate cannot be allowed to stop procurement.
- **Weighing shows expected vs actual side by side.** The farmer said 20 quintals; the scale says
  19.4. Both numbers are on the record.
- **Quality check** takes moisture %, a grade, and the **₹/unit actually being paid** — pre-filled
  from the rate the admin configured for that grade, but the operator can override it, and the
  **payable total updates live before Accept is pressed**. Accept and Reject both ask for
  confirmation first.
- Reject needs a **reason**. A rejection without a reason is exactly the opaque decision farmers
  complain about.

---

## 5. THE MOMENT — do not fumble this

This is the 60 seconds the whole demo exists for. Rehearse it twice before you walk in.

**Setup:** Driver holds the phone on **Procurement Status**, screen facing the judges.
Second is on the laptop at `/queue`, screen also facing the judges.

1. **Second** opens the farmer's row → **Weighing** → types an actual weight → Confirm.
2. **Driver says nothing and just tilts the phone.** The "Weighed" step ticks on its own. Let the
   silence do the work for one beat, then: *"Ye phone maine chhua tak nahi."*
3. **Second** goes to **Quality Check** → moisture %, grade, rate → the total appears → **Accept**.
4. **Driver:** "Quality checked" and "Accepted" tick; the **payment row turns to "payment in process"
   with the expected date**.
5. **Driver, one line, then stop talking:**
   > *"Jo weight operator ne likha, wahi farmer ke phone par hai — usi second. Ab under-weighing
   > chhupana possible nahi hai. Yehi hamara asli product hai."*

**Why this is the pitch and not a feature:** every other system tells the farmer what happened *after*
it happened, on paper, at the counter. Here the weight and the grade become visible to the farmer at
the instant they are recorded. That is an anti-corruption mechanism, not a status page. Say that
sentence in some form — it is the single strongest thing we have.

**If the tick does not appear within ~3 seconds:** do not tap frantically. Say *"live listener hai,
network thoda slow hai"*, pull the Live Queue screen down to refresh, and carry on. Panic reads
worse than latency.

---

## 6. Admin Portal — `staff-admin-1` / `9999`

| Screen | URL | What to show |
| --- | --- | --- |
| Overview | `/admin` | Totals across all centres — bookings, completed, waiting |
| Centre drilldown | `/admin/centres` | The table below |
| Settings | `/admin/settings` | Language + logout |

The **drilldown table** is the one to show: per centre — **Bookings · Completed · Waiting · Avg wait ·
Utilization**, with centres **above 80% utilization flagged as overloaded** (the threshold is stated
in a footnote under the table, so nobody has to guess what the flag means).

> The line to use: *"Ye sirf dashboard nahi hai — admin ko dikh raha hai ki kaunsi mandi overload ho
> rahi hai, to wo doosri mandi ki capacity badha sakta hai us se pehle ki farmers wahan phas jaayein."*

Also on this screen, and worth 20 seconds because judges ask "kya ye sirf gehun-dhaan ke liye hai?":

- **Daily buying capacity per centre, per crop** — a mandi can take 500 quintals of wheat and 200 of
  mustard on the same day, and those are separate limits.
- **Grade-based pricing** — the admin types ₹/unit per grade; those rates drive the price range the
  farmer sees *before* travelling and pre-fill the operator's quality check.
- **Commodity master** — wheat and paddy are **not hardcoded**. An admin adds a commodity from
  Settings and it appears immediately in the farmer's crop picker, in capacity rows and in grade
  pricing **with no code change and no app update**. Commodities are deactivated, never deleted, so a
  crop referenced by an old booking can never dangle.

If a judge asks whether it works: add a commodity live in front of them and pull-to-refresh the
farmer's crop screen. It is a 20-second trick and it lands.

---

## 7. Questions judges will actually ask

Answer short. Stop talking when you have answered. The most common way to lose a Q&A is to keep going.

**"e-NAM / eKharid already exists. What is new here?"**
Those solve *trading and payment records*. Neither tells a farmer standing outside a mandi gate how
many people are ahead of him, or shows him his weight and grade the moment they are recorded. We are
the queue and the transparency layer, and we are designed to sit **on top of** those systems, not
replace them.

**"What about farmers who don't have a smartphone?"**
Three answers, in this order: (1) the token is a number and a QR — it can be shared on WhatsApp to
whoever is driving the tractor; (2) the operator console has **manual token entry always visible**, so
a farmer with no working phone is still processed normally; (3) the architecture is SMS/IVR-ready —
be honest that **SMS/IVR is designed for, not built in this prototype**.

**"Aadhaar — privacy?"**
We never call a real UIDAI API — it is mocked end to end. We **never store the Aadhaar number**;
only a reference token is stored. Every device is signed in with Firebase Anonymous Auth, and the
Firestore security rules scope every read and write to that identity — the client is never trusted.

**"How do you know the operator won't just cheat anyway?"**
He can still type a wrong weight — but he has to do it **in front of the farmer, and it lands on the
farmer's phone in the same second**, with a timestamp, permanently. Today the farmer finds out later,
verbally, with nothing to point at. We have not made fraud impossible; we have made it visible and
disputable, which is what actually changes behaviour.

**"Network in villages is bad."**
The app is deliberately light — vector icons and small images, no heavy animation, loading skeletons
instead of blank screens. Firestore's listeners reconnect and resync on their own when the network
comes back. Be honest: **a full offline booking queue is not implemented in this prototype.**

**"Will this scale?"**
Firestore is serverless — there is no server of ours to fall over, and it scales horizontally by
default. The real production gap we already know about is moving staff role checks to Cloud Function
custom claims; we can name it because we have already identified it.

**"What is real and what is mocked?"** *(Answer this honestly — it builds more credit than it costs.)*
Mocked: Aadhaar + OTP, and payments are simulated — no money moves. SMS/IVR is architecture-only.
Real: everything else. Real Firebase backend, real database, real-time listeners, three real portals,
real security rules, a real signed APK you can install right now.

**"Express slot — isn't that paying to cut the queue?"**
Fixed fee, hard quota cap, never an auction. A farmer with a truck waiting and a perishable load has
a real emergency; the alternative in the real world is paying someone informally. Capping it keeps it
from becoming a bidding war.

**"How long did this take / is it your own work?"**
Show the GitHub repo and the commit history. It is the best possible answer and it takes five seconds.

---

## 8. Things NOT to do

- **Do not read the screen aloud.** The judges can read. Say what it *means*.
- **Do not open a screen you were not planning to open.** Every unplanned screen is a chance to find a
  bug live.
- **Do not say "abhi ye feature nahi hai, but we will add it."** Say what it does today, and what the
  next step is, in that order.
- **Do not overclaim.** One caught exaggeration costs more than five features gained.
- **Do not let three people answer one question.** The Floater takes questions. If the Floater does
  not know, they hand it to the Driver by name. Never talk over each other — that was yesterday's
  actual problem.
- **Do not apologise for the prototype.** It is a working product on a real backend. Behave like it.

---

## 9. If everything breaks

In order:

1. Switch to the **second phone** (already registered, already logged in).
2. Switch to the **mobile hotspot**.
3. If the backend itself is unreachable: open the **GitHub README** and walk the judges through the
   feature list and the screenshots while the Floater keeps them talking. You still have a story.
4. Worst case, say it straight: *"Venue network hai, code chal raha hai — main aapko repo aur live URL
   de deta hoon, aap khud kholiyega."* Honest and composed beats flustered, every time.

The judges are not scoring the WiFi. They are scoring whether you know what you built.
