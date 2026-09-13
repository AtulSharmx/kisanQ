# KisanQ — UI/UX Specification (Village-First Design)
### SIH26032 — Smart Farmer Procurement & Queue Management Platform

## Core Design Principles (research-based — why we're doing this)

1. **Icons + short labels over long text.** Low-literacy users process real-world graphics faster and more accurately than paragraphs of text (confirmed across multiple HCI studies on rural India apps).
2. **One decision per screen.** Don't stack multiple choices on one page — low-literacy users have less organized sequential memory, so break big forms into small steps with a visible "Step 2 of 4" progress marker.
3. **High contrast, big touch targets.** Farmers often use the app outdoors in sunlight. Minimum button size ~50dp, strong colour contrast, no thin pastel tones.
4. **Never rely on colour alone.** Every status (done/pending/rejected) needs an icon + text label, not just red/green — colour blindness and glare both break colour-only signals.
5. **Real-world metaphor icons.** Weighing scale, truck, calendar, bell, rupee symbol — not abstract shapes.
6. **Bilingual by default, not buried in settings.** Hindi should be the default; language choice is the very first screen, big and unmissable.
7. **Lightweight app.** ~40% of Indian smartphone users have 2GB RAM or less, and 50–100MB app size is a common practical ceiling. Avoid heavy animations/large images; use vector icons.
8. **Design for 2G/3G, not just Wi-Fi.** Every screen should show something meaningful even on a slow connection (loading skeletons, not blank white screens).
9. **Confirm before anything irreversible.** Cancel booking, reject produce, etc. — always one confirmation tap away from accidental action.
10. **A visible "Help/Call" option on every screen.** One-tap connect to a human (operator or helpline) — because for a first-time digital user, knowing a human is one tap away builds trust.

## Visual Style

- **Colours:** Deep green (trust, agriculture) + warm yellow/mustard (wheat, visibility) as primary; white/off-white background; red reserved only for rejected/error states, never decorative.
- **Font:** Large, rounded sans-serif (like Noto Sans / Baloo 2 which support Devanagari well), minimum 16sp body text, 20sp+ for headers and numbers (token numbers, wait times).
- **Icon style:** Filled/solid icons, not thin outline — more visible for older eyes and in sunlight.
- **Navigation:** Flat, not nested. From the Home screen, every core action should be reachable in one tap. No hamburger menus hiding important features.

---

## FARMER APP — Screen by Screen

### 0. Splash + Language Select
- App logo, name, tagline (short, one line)
- Big buttons: "हिंदी" / "English" / [regional language if added]
- No text entry here — just tap to choose

### 1. Login / Register Entry
- One field: 12-digit Aadhaar number (numeric keypad only, auto-formats in groups of 4)
- One big button: "आगे बढ़ें" (Continue)
- Small text link below: "पहले से रजिस्टर हैं? Login करें" → goes to mobile+OTP login for returning users
- Persistent "Help" icon (phone/headset icon) bottom corner — taps to call operator helpline

### 2. OTP Screen
- Large 6-box OTP input, auto-focuses next box on entry
- "OTP दोबारा भेजें" (Resend OTP) link, greyed out with countdown timer
- **Important reality check:** OTP only ever reaches the mobile number UIDAI has on file for that Aadhaar — not necessarily the phone the farmer is holding. If it's outdated/wrong, no amount of retrying helps.
- If OTP fails: show "Operator के पास फिंगरप्रिंट से वेरिफाई करें" (Verify by fingerprint with operator) — routes to the operator's biometric scanner (same tiered approach PDS/ration shops already use for this exact problem: OTP → fingerprint/iris → face auth → manual exception register logged by the operator, so a genuine farmer is never turned away just because Aadhaar authentication failed)

### 3. Profile Confirmation (auto-filled)
- Shows Name, State, District, Address, Mobile — pulled automatically, all in large text
- Single button: "यह सही है, आगे बढ़ें" (This is correct, continue)
- Small "गलत जानकारी? Operator को बताएं" (Wrong info? Tell the operator) link

### 4. Additional Info — broken into 3 small steps, not one form
- Step A: Village name (dropdown/searchable list, not free text where possible)
- Step B: Land/Farm details + Crop (icon-based crop picker: wheat, rice, etc. as pictures, not just a dropdown list)
- Step C: Expected quantity (numeric with + / − buttons, not just a keyboard) + Preferred procurement centre
- Progress dots at top: ●●●○ showing where they are

### 5. Home Dashboard (this is the screen they'll see most — must be simplest of all)
Icon grid, 2 columns, big tappable tiles with icon + one-word label:
- 📅 स्लॉट बुक करें (Book Slot)
- 🎫 मेरा टोकन (My Token)
- ⏳ लाइव कतार (Live Queue)
- 🌾 मेरी फसल (My Produce)
- 📋 प्रक्रिया स्थिति (Procurement Status)
- 💰 भुगतान (Payment)
- 🔔 सूचनाएं (Notifications)
- 📞 सहायता (Help/Call)

### 6. Add Crop / Produce
- Crop picker (icon grid, same style as onboarding)
- Quantity with +/− stepper
- Date picker — calendar view, today highlighted, past dates greyed out
- One button: "उपलब्ध स्लॉट देखें" (Check Available Slots)

### 7. Centre Selection
- List view (not map-first, since map requires more data literacy) — each centre as a card:
  - Centre name (large)
  - Distance (with a simple walking/driving icon)
  - "🟢 Slots available" or "🔴 Full" badge — icon + text, not colour alone
  - Estimated wait time shown as a clock icon + number
- Top recommended centre visually marked with a star/badge, one-line reason: "सबसे कम इंतज़ार" (Shortest wait)

### 8. Slot Booking → Token Screen
- Time slot buttons in a simple grid, greyed out if full
- On confirm: full-screen token card appears —
  - Big token number (e.g., KSN-1048) in large bold text
  - QR code, centred, large enough to scan easily
  - Date, time, centre name below
  - Button: "डाउनलोड / शेयर करें" (Download/Share) — lets them save it as an image or send via WhatsApp to a family member's phone too (covers the shared-phone reality)

### 9. Live Queue Status
- Big number showing "आपसे पहले X लोग" (X people ahead of you)
- Estimated wait time, large text
- Simple progress bar or moving-dot animation (lightweight, not heavy graphics)
- Auto-refreshes; also works as a push notification even if screen is closed

### 10. Procurement Status Tracker
- Vertical checklist with icons, each step ticked as it completes:
  ✅ स्लॉट बुक हुआ → ✅ पहुंच गए → ⬜ तौल हुई → ⬜ जांच हुई → ⬜ स्वीकार हुआ → ⬜ भुगतान
- Current step highlighted/animated, future steps greyed out

### 11. Payment Status
- Produce value (large number, ₹ symbol)
- Status badge: "प्रक्रिया में" (Processing) / "पूरा हुआ" (Completed) — icon + text
- Transaction reference number, copyable

### 12. Notifications
- Simple reverse-chronological list, each with an icon matching its type (bell = reminder, truck = "reach centre now", clock = delay update)

### Persistent elements on every screen
- Small "🏠" home icon top-left to always return to dashboard
- "📞 सहायता" help button bottom-right, floating

---

## OPERATOR MINI-APP — Screen by Screen (functional over pretty — this just needs to work for the live demo)

### 1. Staff Login
- Staff ID + PIN (simple, no need for anything elaborate)

### 2. Scan / Check-in
- Big "स्कैन करें" (Scan) button opens camera for QR
- Fallback: manual token number entry field
- On scan: shows Name, Token, Crop, Expected Quantity, Slot → one button "चेक-इन करें" (Check-In)

### 3. Live Queue Management (this screen powers the farmer's Live Queue screen — most important operator screen)
- Three columns or tabs: Waiting / Processing / Completed
- Each row: Token number, farmer name, wait duration
- One big button per row: "अगला बुलाएं" (Call Next) — triggers the app+SMS notification to that farmer

### 4. Weighing Screen
- Expected quantity shown (read-only)
- Actual weight — numeric input
- Button: "वज़न कन्फर्म करें" (Confirm Weight)

### 5. Quality Check Screen
- Moisture %, Grade — simple dropdowns/sliders
- Two big clear buttons: "स्वीकार करें" (Accept, green) / "अस्वीकार करें" (Reject, red) — with confirmation prompt before final submit

---

## ADMIN DASHBOARD — Screen by Screen (web-based, can be simpler/data-dense since admins are not the low-literacy persona)

### 1. Overview
- Top counters as cards: Total Centres, Total Farmers, Today's Bookings, Completed, Currently Waiting, Average Wait Time

### 2. District → Centre Drill-down
- Table or bar chart: Bookings, Completed, Waiting, Avg Wait, Capacity Utilization % per centre
- Overloaded centres (utilization above a threshold) visually flagged

*(This one can be a mock/static dataset for the demo — judges care that the concept works, not that it's pixel-polished.)*

---

## Build priority reminder (from earlier discussion)
1. Backend/data skeleton first
2. Farmer App — full polish here
3. Operator mini-screens 2 & 3 (scan + live queue) — must actually work for the live demo
4. Admin Dashboard — mock data is fine, last priority
