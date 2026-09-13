# KisanQ — Cross-Questions & Ground-Reality Reference

Everything discussed but not fully captured elsewhere — for the team and for Claude Code.

## 1. Identity & Registration Edge Cases

**Q: Farmer's Aadhaar isn't linked to the phone they're currently holding — where does the OTP
go?** OTP only ever goes to whatever mobile number UIDAI has on file for that Aadhaar — never
to whatever phone the farmer is physically holding. If that number is outdated, dead, or
belongs to someone else, no amount of retrying helps. **Fix:** Follow the same tiered fallback
the government's own PDS/ration-shop system already uses for this exact problem: OTP →
operator's fingerprint/biometric scanner → face authentication (optional) → operator-logged
manual exception register. Genuine beneficiaries are never turned away just because Aadhaar
authentication failed — that's existing DFPD policy for PDS, applied here to a new use case.

**Q: What if someone has no Aadhaar at all?** Rare (~99%+ coverage) but real. Allow
operator-verified manual exception registration using Voter ID / state Family ID (e.g.,
Haryana's own MFMB accepts Family ID/PPP as an alternative), logged properly — not a full open
manual form, just a narrow verified backup path.

**Q: How do you stop duplicate or fake crop registrations on the same land?** This is a real,
documented problem — Haryana's MFMB has had actual FIRs filed over fake crop registrations.
Fix: tie registration to a land record (khasra/khatauni number), allow only one active
registration per land per season.

**Q: What about tenant farmers (bataidars) who don't own the land they farm?** Genuinely hard,
be honest about this one. Officially they can register with a landowner's tenancy declaration,
but if the landowner won't cooperate (common), the tenant is still excluded — this is a known
limitation of existing systems too, not something KisanQ fully solves.

## 2. Trust, Adoption & How KisanQ Differs From What Already Exists

**Existing systems and their gaps:**

- Haryana e-Kharid — has registration + digital gate pass + a mobile app, but no live queue
  position, no real-time weighing/quality visibility
- Punjab Anaaj Kharid — handles procurement, but lacks multilingual support
- Rajasthan MSP Portal — good payment tracking, but no dedicated mobile app
- UP e-Procurement — basic flow, limited payment tracking
- e-NAM — solves a *different* problem entirely (open-market trading/price discovery, run by
  the Agriculture Ministry, not MSP procurement queues run by Consumer Affairs/Food & PDS)

**Q: "This already exists, why is yours different?"** None of the existing state systems give
farmers live queue position or real-time visibility into what happens to their produce
(weighing, quality grading) once handed over. Registration and slot booking went digital years
ago; the actual in-centre process is still largely opaque.

**Q: "Why hasn't anyone solved this already?"** Because every state built its own siloed
system, each with different gaps, and no one built the missing real-time layer — live queue
visibility plus transparent weighing/quality tracking plus inclusive access for non-smartphone
users, together, nationally.

**The corruption/transparency angle (core differentiator — use this heavily):** Even in Punjab
and Haryana, with digital gate-pass systems already in place, 2026 reports still describe
ongoing gate-pass fraud, under-weighing, arbitrary quality cuts, and unofficial commissions at
MSP centres. KisanQ pushes every weighing and quality-check entry to the farmer's own phone the
moment the operator makes it — creating a timestamped trail that's much harder to quietly alter
than a paper register.

**Q: Why should farmers trust a new app over walking in and waiting like always?** Acknowledge
it plainly — trust in physical presence is real and documented in research. Don't oversell
instant trust; the transparency angle (farmer sees their own recorded weight/grade immediately)
is the actual trust-building mechanism, not a marketing claim.

**Q: What about arhatiyas (commission agents)? Won't they resist or become irrelevant?**
Farmers depend on arhatiyas for more than trading — often informal credit too. Even government
systems like e-Kharid don't remove arhatiyas from the process. Position KisanQ as giving
arhatiyas a tool too (e.g., assisted registration helper), not replacing them — this shows
maturity to a jury.

## 3. Ground Reality & Operations

**Q: What if a farmer's produce is ready before/after their booked slot
(weather-dependent)?** Real problem — even e-Kharid requires manually contacting the mandi
secretary to reschedule if missed. Add a simple in-app "request reschedule" option.

**Q: How fast does payment actually arrive after procurement?** Honestly: days to weeks, since
it goes through government treasury/bank DBT processing — the app can only track and display
status, it doesn't control disbursement speed. Never imply instant payment.

**Q: Is this for all crops, including perishables (vegetables, fruits)?** No — scope this to
non-perishable MSP crops like wheat and paddy, where waiting doesn't spoil the produce.
Perishables need a fundamentally different (faster) model.

**Q: What happens with thousands of farmers hitting one centre during peak season?** A real,
documented risk — MFMB itself reports slow performance and session timeouts during peak
registration windows. Fine for a hackathon demo; flag as a "next engineering step" (cloud
scaling) for production, don't pretend it's already solved.

**Q: What if a farmer misses the registration window entirely?** In real systems, missing it
usually means losing that season's MSP eligibility, sometimes with a late window. KisanQ can at
least send reminders well before deadlines to reduce this.

**Q: Does the farmer pay anything to use the app?** No — free, like all comparable government
farmer portals.

**Q: What about farmers in areas with poor/no network?** Live queue notifications need
connectivity to work. Mitigate with: SMS as a backup channel alongside the app, and a physical
display board at the centre showing live queue/token numbers so even farmers without a working
phone/network benefit just by being physically present.

## 4. UI & Accessibility Cross-Questions (village-user lens)

- **Can a low-literacy farmer type into forms?** Minimize free text; use dropdowns,
  icon-pickers, and steppers instead. Free typing is a real barrier, not just a minor
  inconvenience.
- **Will the screen be readable in bright outdoor sunlight?** High contrast is mandatory;
  pastel/washed colours will fail in real conditions.
- **Is colour alone (red/green) enough to show status?** No — colour blindness and glare both
  break colour-only signals; every status needs an icon + text label together.
- **Are the icons actually universally understood?** Don't assume — real-world metaphor icons
  (scale, truck, calendar) test better than abstract ones, but should ideally be shown to a
  handful of real village users before finalizing.
- **What about a fully non-literate user (can't read Hindi either)?** Text-only design fails
  them. Consider an optional audio/voice-guidance mode — research on low-literacy interfaces in
  India consistently shows voice/graphics outperform text for this group.
- **Is the app installation itself a barrier?** Yes, potentially the first and biggest one —
  Play Store search and permission prompts are non-trivial for a first-time smartphone user.
  Mitigate with operator-assisted first install, or a QR poster at the centre linking directly
  to the install page.
- **Will the app work on a limited data plan?** Keep it lightweight; consider a "Lite" mode,
  following the well-known Indian pattern (Facebook Lite, YouTube Go) built for exactly this
  constraint.
- **Confirmation before irreversible actions?** Always — e.g. cancelling a booking or rejecting
  produce needs a confirm step, since low-literacy users may tap without full context.

## 5. Jury Q&A Quick Reference (rapid-fire)

| Question | Short answer |
|---|---|
| This already exists, how's yours different? | Live queue visibility + real-time weighing/quality transparency — no existing state system has both |
| Is the Aadhaar verification real? | No, mocked for the prototype; production needs official UIDAI authorization |
| What about the phone-based (non-smartphone) version? | Roadmap/concept stage, modeled on the trusted Kisan Call Centre pattern — not built for this demo |
| What if OTP fails? | Tiered fallback: biometric → exception register, same approach government PDS already uses |
| Will this scale to thousands of users? | Architecture supports it with proper cloud scaling in production; demo shows the concept working |
| Are you removing arhatiyas/middlemen? | No — giving them a tool too, not replacing their role |
| What about tenant farmers without land records? | Known limitation, shared with existing state systems; not fully solved |
