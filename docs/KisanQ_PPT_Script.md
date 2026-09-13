# KisanQ — PPT Presentation Script
### Smart Farmer Procurement & Queue Management Platform (SIH26032)

---

## Before you start — quick recommendations

1. **Timing**: Yeh script roughly 7-8 minute ke pitch ke liye likha hai (12 slides). Agar tumhara actual time slot chhota/bada hai, mujhe batana — main trim/expand kar dunga.
2. **Customize the brackets**: `[Team Name]`, `[Your Name]` jaise placeholders apne actual details se replace kar lena.
3. **Don't read word-for-word robotically** — script ko 2-3 baar padho, phir apne shabdon mein bolna practice karo. Jo natural lage wahi rakhna, jo ajeeb lage usse badal dena.
4. **Pause after rhetorical questions** — script mein jahan sawaal poocha hai, ek second ruk jaana, judges ko sochne do.
5. **Eye contact rule**: Slide ko mat padho, judges ko dekh ke bolo — slide sirf tumhare peeche support ke liye hai.

---

## SLIDE 1 — Title Slide

**[Visual: App name/logo, team name, SIH26032, problem statement title]**

"Good [morning/afternoon] judges. Hum hain [Team Name], aur hum present kar rahe hain KisanQ — problem statement SIH26032 ka solution, ek Smart Farmer Procurement aur Queue Management Platform. Ministry of Consumer Affairs, Food and Public Distribution ke liye."

---

## SLIDE 2 — The Problem, Real Ground Se

**[Visual: Photo/illustration of crowded mandi, farmers waiting]**

"Socho ek pal ke liye — ek kisan apni fasal lekar subah 5 baje mandi pahunchta hai. Usse pata nahi kitne log uske aage hain. Pata nahi weighing kab hogi. Pata nahi payment kab aayega. Woh bas... wait karta hai. Ghanton, kabhi-kabhi poora din.

Yeh koi kalpana nahi hai — yeh MSP procurement season mein, jaise Rabi mein wheat aur Kharif mein paddy ke time, lakhon farmers ke saath rozana hota hai. Ek hi centre pe ek hi din sainkdon farmers pahunch jaate hain, aur unke paas koi visibility nahi hoti ki unka number kab aayega."

---

## SLIDE 3 — Why This Problem Is Harder Than It Looks

**[Visual: Split image — smartphone user vs feature phone user]**

"Ab yahan ek cheez add karta hoon jo log bhool jaate hain. Hum sab sochte hain ki 'app bana do, solve ho jayega.' Par ground reality alag hai.

Aaj bhi India mein karodo log feature phone use karte hain, smartphone nahi. Aur jinke paas smartphone hai bhi, unme se bahut sabko app confidently use karna nahi aata — khaas taur pe older farmers, jo hamare asli target user hain.

Toh sawaal yeh nahi hai ki 'app kaisi banayein' — sawaal yeh hai ki 'har kisan tak kaise pahunchein, chahe uske paas kuch bhi ho.'"

---

## SLIDE 4 — Honest Reality: Kuch Already Exist Karta Hai

**[Visual: Logos/names — e-Kharid Haryana, Anaaj Kharid Punjab, Rajasthan MSP Portal, UP e-Procurement]**

"Ab main kuch aisa bolne ja raha hoon jo shayad koi aur team nahi bolegi — hum honestly maante hain ki humne research kiya hai, aur is problem pe kaam pehle se ho raha hai.

Haryana ke paas 'e-Kharid' hai — farmer registration aur digital gate-pass system, apna mobile app bhi hai. Punjab ka 'Anaaj Kharid' portal hai. Rajasthan aur UP ke bhi apne procurement portals hain.

Toh phir hum kya naya kar rahe hain?"

---

## SLIDE 5 — The Real Gap (Yeh Slide Sabse Important Hai)

**[Visual: Comparison table — Existing systems vs Our platform, highlight missing pieces]**

"Humne dhyan se dekha — har state ka system alag hai, aur har ek mein kuch na kuch missing hai. Kahin mobile app nahi hai. Kahin multiple languages support nahi karta. Aur sabse badi baat — **koi bhi system farmer ko live queue position nahi dikhata.**

Sab systems sirf ek fixed slot dete hain. Uske baad farmer ko kuch pata nahi chalta. Koi bhi system 'aapki baari aane wali hai' jaisi real-time notification nahi bhejta.

Hum yeh gap bhar rahe hain — ek naya registration portal nahi, balki woh missing layer jo farmer ko puri procurement journey mein guide karta hai, real-time mein."

---

## SLIDE 6 — Our Solution: Ek Backend, Teen Surfaces

**[Visual: Simple diagram — one backend, three boxes: Farmer App, Operator Dashboard, Admin Dashboard]**

"Hamara platform ek hi central backend pe chalta hai, jisse teen alag surfaces judte hain — Farmer App, Operator Dashboard centre pe, aur Admin Dashboard policy-level monitoring ke liye. Sab ek doosre se connected, real-time mein sync."

---

## SLIDE 7 — Farmer Journey Walkthrough

**[Visual: Screenshots/flow — Aadhaar+OTP → profile auto-fill → crop details → slot booking → digital token with QR]**

"Ab dekhte hain farmer ke liye yeh kaam kaise karta hai. Registration sirf Aadhaar number aur OTP se hota hai — koi lambi form nahi bharni padti, system khud verified details le leta hai. Hum yahan clearly bata dena chahte hain — yeh prototype mein ek mocked/simulated Aadhaar verification hai, production mein official UIDAI e-KYC integration lagega.

Uske baad farmer apni crop aur quantity daalta hai, nearby centres dekhta hai — distance, available slots, estimated wait time ke saath — aur ek slot book karta hai. Turant ek digital token QR code ke saath milta hai, jo centre pe fast check-in ke kaam aata hai."

---

## SLIDE 8 — The Differentiator: Live Queue + Notifications

**[Visual: Mock live queue screen, notification examples]**

"Yeh humara core innovation hai. Ek baar slot book ho jaye, farmer ko real-time queue status dikhta hai — kitne log aage hain, estimated wait time kya hai. Agar delay ho, toh updated wait time turant push ho jaata hai.

Aur jab operator 'Call Next Farmer' dabata hai, farmer ke phone pe seedha notification jaata hai — 'Counter pe pahunchiye, aapki baari aa gayi hai.' Yeh exact wahi cheez hai jo hamne existing systems mein missing paayi thi."

---

## SLIDE 9 — Operator Ka Nazariya

**[Visual: Operator dashboard mockup — check-in, weighing, quality check screens]**

"Centre pe operator ke liye kaam simple hai — QR scan karo, check-in ho jaata hai. Weighing screen pe expected vs actual quantity daalte hain, quality check mein moisture aur grade record karte hain, aur accept ya reject karte hain. Sab kuch chand taps mein, koi register mein likhne ki zaroorat nahi."

---

## SLIDE 10 — Admin Ka Nazariya — Data Se Faisla

**[Visual: Admin dashboard — district drill-down, capacity utilization]**

"Admin level pe, ek high-level view milta hai — kitne farmers, kitni bookings, kitna wait time — poore district mein. District se centre tak drill-down kar sakte hain, dekh sakte hain kaunsa centre overloaded hai, aur time rehte resources shift kar sakte hain."

---

## SLIDE 11 — Roadmap: Sabko Saath Le Jaana (Phase 2)

**[Visual: Phone icon, Kisan Call Centre reference]**

"Ab wapas us sawaal pe aate hain — jinke paas smartphone nahi hai, unka kya? Hamara Phase 2 roadmap ek phone-number-based access hai — bilkul us pattern pe jo Kisan Call Centre, 1800-180-1551, decades se safal tareeke se chala raha hai, 22 local languages mein.

Hum us hi trusted, already-familiar channel ko extend karna chahte hain — slot booking aur queue status ke liye, sirf ek phone call ya SMS se, bina kisi app ke. Aaj hum mobile app pe focus kar rahe hain kyunki woh core innovation demo karta hai, par yeh inclusion hamare roadmap ka zaroori hissa hai."

---

## SLIDE 12 — Closing

**[Visual: Team photo/names, thank you]**

"Toh summary mein — hum ek naya procurement system nahi bana rahe. Hum woh missing real-time layer bana rahe hain jo har farmer ko, chahe uske paas smartphone ho ya sirf ek basic phone, apni poori procurement journey ki visibility deta hai — kab tak wait karna hai, kab payment aayega, sab kuch. Dhanyavaad."

---

## Likely jury questions — be ready with these

- **"Yeh already exist karta hai, tumhara alag kaise hai?"** → Slide 5 wapas point karo: live queue visibility + inclusive access, yeh koi existing system nahi deta.
- **"Aadhaar verification real hai?"** → "Nahi, prototype mein mocked hai, production ke liye UIDAI se authorization chahiye hoga — yeh humne documentation mein clearly likha hai."
- **"Phone-based wala part actually bana hai kya?"** → Honestly bolo: "Abhi roadmap/concept hai, hamara demo mobile app pe hai."
