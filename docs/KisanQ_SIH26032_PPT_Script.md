# KisanQ — Presentation Script (for `KisanQ_SIH26032.pptx`)
### Smart Farmer Procurement & Queue Management Platform — SIH26032

This script is written for the **6-slide official SIH idea-submission deck** (Title → Idea Title →
Technical Approach → Feasibility and Viability → Impact and Benefits → Research and References),
not the older 12-slide narrative version in `KisanQ_PPT_Script.md`. Every claim here is checked
against what's actually built and live today — see the **"Abhi vs Future"** callouts; nothing is
inflated for the pitch.

---

## Before you start

1. **Timing**: ~5-6 minute pitch for 6 slides. Trim the "optional deeper detail" lines if you're
   tight on time.
2. **The honesty rule**: judges at SIH ask "is this actually built or just planned?" more than
   almost any other question. This script is written so you never have to guess the answer live —
   every feature is already tagged **[LIVE]** or **[FUTURE]** below.
3. **Have the live demo open in a second tab** before you start: **https://kisanq-farmer.web.app**
   (Operator/Admin — Staff ID `staff-op-1`, PIN `1234` for operator, `staff-admin-1` / `9999` for
   admin) and the Farmer app APK on a phone if you can. Nothing lands harder than "yeh planned nahi
   hai, yeh abhi live hai" followed by actually switching tabs and showing it.

---

## SLIDE 1 — Title Slide

"Good [morning/afternoon] judges. Hum hain [Team Name], aur hum present kar rahe hain **KisanQ** —
problem statement **SIH26032** ka solution, Ministry of Consumer Affairs, Food and Public
Distribution ke liye. Problem statement simple si baat kehta hai: farmers ko procurement ke time
lamba wait karna padta hai, unhe pata nahi hota schedule kya hai, aur payment/status ko lekar
uncertainty rehti hai. Hum yehi teen cheezein solve karte hain."

---

## SLIDE 2 — Idea Title / Proposed Solution

*(This slide already carries the Problem → Solution → "How it addresses the problem" → Innovation
bullets — narrate them in this order, don't just read them.)*

**Problem, real ground se:**
"Socho — ek kisan apni fasal lekar subah mandi pahunchta hai. Usse pata nahi kitne log uske aage
hain, weighing kab hogi, payment kab aayega. Woh bas wait karta hai — ghanton, kabhi poora din. Yeh
MSP season mein — Rabi mein wheat, Kharif mein paddy ke time — lakhon farmers ke saath rozana hota
hai."

**Solution:**
"KisanQ ek role-based platform hai — Farmer, Operator, aur Admin, teeno ke liye alag surface, ek hi
real-time backend pe. Farmer Aadhaar aur OTP se register karta hai, ek slot book karta hai, aur ek
sequential token milta hai — jaise KSN-1048. Uske baad har step — check-in, weighing, quality
grading — turant uske phone pe reflect hota hai."

**Innovation/uniqueness — is honest, not just a slogan:**
"Humne existing state procurement portals dekhe — Haryana ka e-Kharid, Punjab ka Anaaj Kharid, aur
kuch aur. Unme registration aur ek fixed slot milta hai. Lekin kisi mein bhi **live queue
position** nahi dikhti — farmer ko fir bhi nahi pata ki uski baari kab aayegi. Yehi woh gap hai jo
hum bharte hain: formula-driven wait time (queue position × average processing time), role-based
security jo database rules mein khud built-in hai, sirf UI mein chhupi hui nahi — aur ek
capped-quota, fixed-fee Express option, Tatkal jaisa, jo bina kisi bidding-war ke ek transparent
priority path deta hai."

---

## SLIDE 3 — Technical Approach

*(This is the "abhi kya kar rahi hai" slide — the honest current-state slide. Speak this slowly,
this is where judges probe hardest.)*

"Ab dekhte hain hum abhi kya bana chuke hain, sirf plan nahi — **abhi live, demo-able hai.**"

**[LIVE] Farmer app**: "Android app hai — humne isko EAS Build se ek installable APK bana ke public
kar diya hai, judges ko abhi is link se install karwa sakte hain. 12 languages support karta hai —
Hindi, English, Punjabi, Bengali, Marathi, Gujarati, Telugu, Tamil, Kannada, Malayalam, Odia, Urdu —
pehli screen simple rakhi hai (Hindi/English), baaki Settings mein."

**[LIVE] Operator aur Admin**: "Web dashboard hai, humne Firebase Hosting pe public deploy kiya hai
— kisanq-farmer.web.app. Operator check-in, weighing, quality-check karta hai; Admin district se
centre tak drill-down dekh sakta hai."

**[LIVE] Backend**: "Firebase Firestore, real-time. Har booking, weighing, quality-check ek
transaction mein hota hai, taaki do farmers ek hi slot ke liye race na karein — humne yeh khud test
kiya hai live, race-condition tak."

**[LIVE] Daily Buying Capacity** (naya, is round mein add hua): "Har centre ki, har fasal ke liye
alag daily buying limit hoti hai — jaise Karnal mein aaj sirf itna wheat aur itna paddy khareeda
jayega. Jab operator ek booking Accept karta hai, yeh number khud transaction mein ghatta hai;
farmer ko booking se pehle hi pata chal jaata hai ki aaj kitna bacha hai — taaki ek centre ek din
mein zyada commit na kar de jitna woh sach mein khareed sakta hai."

**[FUTURE] SMS gateway**: "Slide mein SMS gateway mention hai — honestly bata dein, abhi hamara
notification system poora **in-app real-time** hai, jo already live hai. Actual SMS provider
(Twilio ya similar) ka integration humara agla step hai, taaki bina smartphone wale farmers tak bhi
pahunch sakein."

**[FUTURE] Real Aadhaar verification**: "Abhi login Aadhaar-number + OTP se hota hai, lekin
verification mocked/simulated hai — production ke liye UIDAI ka official e-KYC integration chahiye
hoga, jo hum openly bolte hain, chhupate nahi."

---

## SLIDE 4 — Feasibility and Viability

*(Feasibility slide already has challenges + strategies — use it, then use the gap it leaves open
to talk Future Scope, since this deck doesn't have a separate Future Scope slide.)*

"Hum off-the-shelf stack use kar rahe hain — Android/PWA app, Firebase/Firestore, aur planned SMS
gateway — koi naya hardware centre pe nahi chahiye. Existing registration → weighing → quality
check → payment flow ko replace nahi karte, usi mein fit hote hain, taaki centres isse incrementally
adopt kar sakein."

**Real risks, honestly**: "Rural internet patchy ho sakta hai, kuch farmers ke paas smartphone nahi
hai, aur peak hours mein backend writes fail ho sakte hain. Inke liye humne already retry prompts,
manual token entry, aur 'not saved, try again' messaging bana rakha hai — yeh sab live hai, sirf
plan nahi."

**Future scope (yahan explicitly bol dena, chahe slide pe na likha ho):**
"Aage humara roadmap teen cheezon pe hai — pehla, ek phone-call/IVR-based path un farmers ke liye
jinke paas smartphone nahi, bilkul Kisan Call Centre (1800-180-1551) jaisa trusted, already-familiar
channel. Doosra, real SMS gateway integration. Teesra, real payment gateway — abhi payment simulate
hoti hai, CLAUDE.md-level policy ke hisaab se koi asli paisa nahi chalta, jab tak Ministry ke saath
official payment integration na ho."

---

## SLIDE 5 — Impact and Benefits

"Sabse bada impact — farmer ko ab ghar baithe pata chal jaata hai kitna wait hoga, isliye poora din
mandi mein khada nahi rehna padta. Payment/procurement status real-time milta hai, isliye baar-baar
poochne ya visit karne ki zaroorat nahi.

Social level pe — transparency badhti hai, agar produce reject ho to exact reason dikhta hai, silent
stop nahi. Economic level pe — farmers ke missed slots kam hote hain, aur ek centre proper capacity
ke andar hi kaam karta hai isliye overcommitment nahi hoti. Governance level pe — Ministry ko
real-time, digital procurement data milta hai, paper records ki jagah."

---

## SLIDE 6 — Research and References

"Humne official problem statement SIH26032 dekha, e-NAM ka existing agri-procurement digitisation
model dekha, aur Firebase/Firestore ki real-time database aur role-based security documentation
follow ki.

Toh summary mein — hum ek naya registration portal nahi bana rahe, hum woh missing real-time layer
bana rahe hain jo already-existing systems mein nahi hai: live queue visibility, transparent
capacity limits, aur role-scoped security — jo abhi live hai, aur SMS/phone-based inclusion jo
humara agla step hai. Dhanyavaad."

---

## Likely jury questions — be ready with these

- **"Yeh already exist karta hai, tumhara alag kaise hai?"** → Slide 2/3 wapas point karo: live
  queue visibility + database-level role security + transparent daily capacity, yeh existing
  systems mein humein nahi mila.
- **"SMS gateway kaam karta hai?"** → Honestly: "Abhi in-app notifications live hain, real-time;
  SMS gateway integration roadmap mein hai."
- **"Aadhaar verification real hai?"** → "Nahi, prototype mein mocked hai, production ke liye UIDAI
  se authorization chahiye hoga — yeh humne khud documentation mein likha hai."
- **"Payment kaise hota hai?"** → "Abhi simulated hai, koi asli paisa transfer nahi hota — yeh
  jaanbujhke hai jab tak Ministry ka official payment integration na ho."
- **"Yeh Daily Buying Capacity wala feature kya hai, kaise kaam karta hai?"** → "Har centre, har
  fasal ke liye alag limit set kar sakta hai — jaise aaj Karnal mein sirf 500 quintal wheat aur 300
  quintal paddy khareeda jayega. Operator jab ek booking Accept karta hai, yeh number khud transaction
  mein ghatta hai. Jab khatam ho jaye, sirf **naye** bookings block hote hain — jo already book kar
  chuke hain unko kuch nahi hota."
- **"Yeh app ka demo dikha sakte ho abhi?"** → Haan — Operator/Admin: kisanq-farmer.web.app; Farmer
  app: APK link (agar phone available hai to install karke dikhao).
