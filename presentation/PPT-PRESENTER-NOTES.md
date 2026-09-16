# KisanQ — PPT Presenter Notes

**For the 3 members presenting the slides. SIH26032 · Team CodeCrew · Theme: Smart Automation.**

This is not a script. Nothing here is written to be read out. It tells you what each slide is
*actually arguing*, which numbers are real, where the handoffs are, and what the judges will push
on — so each of you can build your own delivery in your own words. Read it once fully, then read
"your" slides twice.

---

## 0. What went wrong yesterday, stated plainly

Six people, one slide each, and the judges still did not understand **why we built this**. That is
not a fluency problem — it is a structure problem. Six speakers means six openings, six handoffs and
zero argument. The audience hears facts and never hears a point.

Three fixes for today:

1. **Three speakers, not six.** Each of you owns a *block*, not a slide, so each of you gets enough
   airtime to build something.
2. **Somebody says the "why" in the first 30 seconds.** Not on slide 2 — in the opening. If the
   judges leave knowing only one thing, it should be the problem, not the tech stack.
3. **The prototype is part of the presentation, not an appendix.** The PPT block ends by handing to
   the demo team. Do not say "and that's all from our side." Say "ab dekhiye chal raha hai."

---

## 1. The one-sentence spine

Everything on every slide is a branch of this. If you lose your thread mid-sentence, come back here:

> **A farmer reaches the mandi at 4am, waits blind for six hours, has no idea when his turn is, no
> idea what weight or grade was recorded for his crop, and no idea when he will be paid. We gave him
> a slot, a live queue position, and a phone that shows him his weight and grade the instant they are
> recorded.**

That last clause is the product. Slot booking is convenience. **Real-time transparency of weighing
and grading is the thing nobody else does**, and it is the thing to keep coming back to.

---

## 2. Block split — who owns what

| Block | Slides | Who | Roughly |
| --- | --- | --- | --- |
| **A — The problem & our answer** | Title + Slide 2 (Proposed Solution / How it addresses / Innovation) | Speaker 1 | ~2 min |
| **B — How it is built & is it viable** | Slide 3 (Technical Approach) + Slide 4 (Feasibility & Viability) | Speaker 2 | ~2 min |
| **C — Why it matters & what we stand on** | Slide 5 (Impact & Benefits) + Slide 6 (Research & References), then hand to the demo | Speaker 3 | ~1.5 min |

**Handoff rule:** the person finishing names the next person and what they will cover, in one line.
*"Ab [name] batayenge ki ye technically kaise khada hai."* No "so, uh, next slide."

---

## 3. Slide by slide

### Title slide

SIH 2026 · PS ID **SIH26032** · Theme **Smart Automation** · Category **Software** · Team **CodeCrew**.

The PS statement itself is: *"Farmers often face long waiting times, lack of information regarding
procurement schedules, and uncertainty about procurement status."*

**What to do here:** do not read the title slide. Nobody has ever been impressed by a team reading
its own problem statement ID. Use these 20 seconds for the **hook** instead — the one thing that was
missing yesterday.

Ideas for the hook (pick one, make it yours — do not deliver all three):
- The 4am image: a farmer leaves at 4am not because procurement starts at 4am, but because he has no
  way of knowing when it starts. He is buying certainty with his sleep.
- The three unknowns: *kab number aayega, kitna weight likha gaya, paisa kab aayega.* Three unknowns,
  and our app answers all three.
- The honest version: last year's systems digitised the *record*. Nobody digitised the *wait*.

Then land the PS in one sentence and move on.

---

### Slide 2 — Proposed Solution / How it addresses the problem / Innovation & Uniqueness

This slide has three numbered blocks. **Do not read nine bullets.** Group them.

**01 Proposed Solution** — digital farmer-to-mandi procurement platform; OTP registration + online
slot booking; digital token + live queue tracking; digital procurement & payment status.

**02 How it addresses the problem** — less long-distance travel; scheduled slots instead of random
visits; real-time queue transparency; organised operations and payment tracking.

**03 Innovation & Uniqueness** — three role-based portals (Farmer, Operator, Admin); live ETA from
queue and processing time; multi-commodity capacity management; low-bandwidth + SMS/IVR-ready.

**What this slide is really arguing:** we did not build a farmer app. We built the **whole loop** —
farmer, mandi operator, and department admin — because a queue number is worthless unless somebody at
the mandi is actually updating the queue. Most hackathon entries build one side and hand-wave the
other. Lead with that framing and the nine bullets stop sounding like a feature list.

**The line that makes "Innovation" land** — say something in this shape, in your words:
> *"Live ETA queue se calculate hoti hai, ek fixed number nahi hai. Agar aage wale ka kaam jaldi
> khatam ho gaya, farmer ka number apne aap ghat jaata hai — usne app kholi bhi nahi hogi."*

**Two honesty guardrails on this slide** (breaking these is how a team loses a Q&A):
- **"SMS/IVR-ready" means the architecture supports it — it is not implemented.** Say "ready for",
  never "we have".
- Multi-commodity is real and demonstrable: commodities are **not hardcoded**, an admin adds one at
  runtime and it appears in the farmer's app with no code change and no app update. Say that
  confidently, because the demo team can prove it live.

---

### Slide 3 — Technical Approach

What is on the slide:

| Layer | What we used |
| --- | --- |
| App | React Native + Expo SDK 57 (TypeScript 6) |
| Frontend | React Native Web + React Navigation v7 |
| Backend | Firebase Serverless + Firestore SDK v12 |
| Database | Cloud Firestore (NoSQL) + real-time `onSnapshot` |
| eKYC | Mock Aadhaar + OTP + Firebase Anonymous Auth |
| Notifications | Firestore-based real-time in-app notifications |
| Other | QR token, live queue, procurement tracking, payment status, Firebase Hosting + EAS Build |

**The trap on this slide: do not recite the table.** Judges can read a stack table faster than you
can say it, and a recited stack is the most forgettable 60 seconds in any pitch. Instead, make
**three architectural decisions** and give the reason for each. Reasons are what sound like
engineering; names sound like a shopping list.

**Decision 1 — One codebase, three portals.**
The farmer app is the native build; the operator and admin portals are the *web* build of the **same**
React Native codebase. One set of business logic, one data model, three surfaces. That is why three
portals were buildable by a student team in this time frame, and it is also how a state IT department
would actually want to maintain it.

**Decision 2 — Real-time listeners, not polling.**
`onSnapshot`, not a refresh button and not a timer. This is not a performance footnote — it is the
*reason the product works*. Transparency that arrives 30 seconds late while the farmer is standing at
the counter is not transparency. Tie it straight to the demo: *"jo aap abhi prototype mein dekhoge —
operator laptop par likhta hai, phone par usi second aata hai — wo isi wajah se hai."*

**Decision 3 — Serverless, so there is no server of ours to fail.**
Firestore scales horizontally by default, and a state-scale procurement load is a read-heavy workload
that this shape handles well. No VM to provision, no server to go down on the busiest procurement day
of the year.

**Say the security part before you are asked** — it costs 15 seconds and it buys real credibility:
- We **never store the Aadhaar number** — only a reference token.
- Staff PINs are **hashed (SHA-256), never stored in plaintext**.
- Every device signs in with Firebase Anonymous Auth, and **Firestore security rules** scope every
  read and write server-side. The client is never trusted.
- Aadhaar/OTP is **mocked** — no real UIDAI integration, deliberately, because that needs sanctioned
  access we do not have and should not fake.

**One known gap we volunteer, because volunteering it is stronger than being caught on it:** staff
role checks currently live in security rules; the production-correct version mints custom claims from
a Cloud Function on staff login. We know the gap and we know the fix. Teams that can name their own
limitations read as more competent, not less.

---

### Slide 4 — Feasibility and Viability

> ⚠️ **HEADS UP — this slide's content is an image / SmartArt, not text.** Nothing on it can be read
> out of the file, so whoever presents it **must open the deck and look at the slide** before going
> in. Do not walk in assuming these notes cover what is drawn there — they cover what this slide
> *needs to argue*, and you must match that to the actual boxes on screen.

Whatever the graphic says, a Feasibility & Viability slide is answering exactly three questions.
Make sure your delivery answers all three, in this order:

**1. Can it be built? — Already answered: it is built.**
This is our strongest feasibility argument and it costs one sentence. A working Android APK, a live
web portal on Firebase Hosting, a real Firestore backend, three role-based portals, a public GitHub
repo with the full commit history. Not a mockup. *"Feasibility ka sabse accha proof ye hai ki wo
aapke saamne chal raha hai."*

**2. Can it be deployed in the real world? — The adoption path, in order of difficulty:**
- **Operator side is the easy part.** It is a browser page. No install, no hardware — a mandi already
  has a computer and an internet connection. Training is under an hour.
- **Farmer side is the harder part**, and pretending otherwise is the fastest way to lose credibility.
  Our answers: Hindi-first with 12 languages; photographs instead of text for crops; one decision per
  screen; a Help/call button on every single screen; and — for a farmer with no smartphone at all —
  the token is shareable over WhatsApp and the operator console has **manual token entry always
  visible**, so a phone-less farmer is still processed normally. Adoption starts with the one person
  in the village who already has a smartphone, not with all of them.
- **Integration, not replacement.** This sits on top of e-NAM / eKharid; it does not ask a state to
  throw anything away.

**3. What will actually go wrong, and what do we do about it?**
Name the risks yourself — a risk you name is a risk you have thought about; a risk the judge names is
a hole:

| Risk | Our answer |
| --- | --- |
| Rural connectivity | Deliberately light app, small images, loading skeletons; listeners resync automatically on reconnect. *Honest caveat: a full offline booking queue is not implemented in this prototype.* |
| Digital literacy | Hindi default, 12 languages, icons + photos over text, one decision per screen, Help button everywhere |
| Operator adoption / resistance | It is a browser page with a QR scanner — it is faster than their current register, not extra work |
| Peak-season load | Serverless; no fixed capacity to exhaust |
| Someone entering a wrong weight anyway | We do not claim to prevent it. We make it *visible to the farmer in the same second* and permanently timestamped — disputable instead of deniable |

That last row is worth saying out loud even if the slide does not have it. Overclaiming
"corruption khatam ho jayega" is the single easiest way to lose a judge. The honest, defensible claim
is much stronger: **we do not make fraud impossible, we make it visible.**

---

### Slide 5 — Impact and Benefits

On the slide — three impact categories:

- **01 Social** — "Farmers treated fairly, not queued blindly."
- **02 Economic** — "Saved time → more farm work, less crop spoilage."
- **03 Environmental** — "Less crowding, fewer repeat trips to check."

And six benefits: less waiting time · more trust in the system · planned visits instead of guesswork ·
live queue visibility · faster procurement · better time management for farmers.

**Do not read six benefits.** They overlap heavily and reading them flattens all of them. Pick the
strongest, make it concrete, and let the rest stay on screen for the judges to read themselves.

**How to make this slide land — turn each category into a picture, not an adjective:**
- **Social:** "treated fairly, not queued blindly" is the strongest phrase in the whole deck. Unpack
  it: a queue nobody can see is a queue that can be rearranged, and the person who loses is always
  the farmer who does not know whom to ask. A visible queue is a fair queue.
- **Economic:** the cost of a wasted day is not just the day — it is a tractor hired, diesel burned,
  and a crop sitting in an open trolley. And the payment date is economic too: a farmer who knows
  money arrives in three days does not need to borrow at village interest rates in the meantime.
- **Environmental:** this one sounds weakest, so be specific rather than vague — repeat trips "just
  to check" are pure wasted diesel, and mandi crowding is what forces produce to sit in the sun.

**If a judge says "these benefits are obvious / everyone claims these":** agree, then separate
yourself. Every team claims impact; ask them to check which claims *this slide can actually back*.
Waiting time, queue visibility and planned visits are directly produced by mechanisms they are about
to watch running. We are not claiming outcomes we have no mechanism for.

---

### Slide 6 — Research and References

**Systems studied:** e-NAM (enam.gov.in) · eKharid Haryana (ekharid.haryana.gov.in) · Kisan Sarathi
(expert.kisansarathi.in) · Kisan Suvidha (kisansuvidha.gov.in) · AgriStack (mhfr.agristack.gov.in).

**Studies referenced:** SMS/text messages and farmer app adoption (2026) · digital agriculture
adoption in Rajasthan (2026) · digital procurement as a category of digital agriculture.

**What this slide is for, and how to use the last 30 seconds:** it exists to prove we looked at what
already exists before building. So do not read the list of URLs — **say what the gap was**:

> *"Ye sab systems exist karte hain. e-NAM trading karta hai, eKharid procurement record rakhta hai,
> Kisan Suvidha information deta hai. Inmein se koi bhi farmer ko ye nahi batata ki uske aage kitne
> log hain, ya uska weight aur grade kya likha gaya. Wahi gap humne bhara hai."*

Naming the incumbents and then naming the specific gap is what makes us look like we did homework
instead of like we reinvented something that exists.

**Then hand over to the demo — this is the most important handoff of the presentation.** One line,
then step aside:
> *"Ab hum ye sab bol chuke hain. [Name] aapko live chalke dikhayega."*

---

## 4. Questions the judges will throw at the PPT team

Short answers. Stop when you have answered. Hand anything demo-specific to the prototype team by
name rather than guessing — a confident handoff reads better than a shaky answer.

**"How is this different from e-NAM / eKharid?"**
They digitise trading and records. Neither tells a farmer at the gate how many people are ahead of
him, or shows him his weight and grade the moment they are recorded. We are the queue and
transparency layer, designed to sit on top of them.

**"Where did your problem understanding come from?"**
The PS itself names three things — waiting time, missing schedule information, uncertain status — and
we mapped one feature to each: slot booking, live queue with ETA, and the procurement + payment
tracker. That one-to-one mapping is a strong answer; know it cold.

**"What is real and what is mocked?"**
Mocked: Aadhaar + OTP. Simulated: payments — no money moves. Designed-but-not-built: SMS/IVR.
Everything else is real — real Firebase backend, real database, real-time listeners, three real
portals, real security rules, an installable APK.

**"How long did this take / did you build it yourselves?"**
Show the GitHub repo and the commit history. Best five-second answer available.

**"What is next if you win?"**
Three things, in this order: (1) real Aadhaar eKYC through a sanctioned integration; (2) SMS/IVR so a
feature-phone farmer gets the same queue updates; (3) a pilot at one real mandi for one procurement
season, because the only metric that matters is average waiting time before versus after.

**"Why should a state adopt this over building their own?"**
It is built, it is open, it integrates rather than replaces, and the operator side needs no hardware.
The expensive part of a system like this is not the code — it is the field design, and that is the
part we have actually done.

---

## 5. Delivery notes — the small things that decided yesterday

- **Speak to the judges, not to the screen.** If you are reading the slide, your back is the most
  memorable thing about your presentation.
- **Bullets are for them, sentences are for you.** Never say a bullet exactly as written.
- **One number, said slowly, beats six bullets said quickly.**
- **Do not apologise for anything.** Not the prototype, not the mocked Aadhaar, not the time. State
  it as a decision, because it was one.
- **When you do not know, say so and hand it over by name.** "Ye demo team better answer karegi —
  [name]?" is a completely acceptable answer and costs nothing. Bluffing costs a lot.
- **Nobody interrupts anybody.** Yesterday's real failure was six voices. One person owns the answer
  until they hand it over.
- **End on the demo, not on "thank you."** The last thing in the judges' heads should be the app
  running, not our sign-off.

---

## 6. Before you walk in

- [ ] Whoever has Slide 4 has **opened the deck and looked at the image** — its content is not in the
      file text (see the warning above)
- [ ] Each speaker has said their block out loud, once, on a timer
- [ ] Every speaker can say the one-sentence spine (§1) from memory
- [ ] Everyone knows the mocked/simulated list, word for word: **Aadhaar mocked, payments simulated,
      SMS/IVR designed not built**
- [ ] The handoff line to the demo team is decided and the demo team knows it is coming
- [ ] The deck is on the presenting laptop **and** on a pen drive **and** on somebody's email
