# KisanQ — Presentation Script
### SIH26032 — Speak this while clicking through the slides. Don't read the slides out loud.

This script is written so you never have to look back at a slide to remember what to say — it
flows as one continuous talk, section by section, matching your deck's 6-part structure
(Title → Idea/Solution → Technical Approach → Feasibility → Impact → References). If the PPT gets
edited a little before the real presentation, this script still works — it's built around what
you're SAYING, not exact slide wording.

**Golden rule**: every "abhi live hai" line in this script is genuinely true today. Don't add
anything the app doesn't actually do — a judge who catches one exaggeration stops trusting
everything else you say.

---

## THE FULL SPOKEN SCRIPT

**[Slide 1 — Title]**

"Namaskar judges. Hum present kar rahe hain **KisanQ**, problem statement SIH26032 — Ministry of
Consumer Affairs, Food and Public Distribution ke liye.

Ek chhota sa sawaal se shuru karte hain — socho ek kisan apni fasal lekar subah 5 baje mandi
pahunchta hai. Usse pata nahi kitne log uske aage hain, weighing kab hogi, payment kab aayega. Woh
bas khada rehta hai — ghanton, kabhi poora din. Yeh koi kalpana nahi — MSP season mein, Rabi mein
wheat aur Kharif mein paddy ke time, lakhon farmers ke saath rozana hota hai. Isi problem ko hum
solve kar rahe hain."

**[Slide 2 — Idea Title / Proposed Solution]**

"Hamara solution — KisanQ — ek role-based platform hai: Farmer, Operator, aur Admin, teeno ke liye
alag surface, ek hi real-time backend pe chalta hai.

Farmer Aadhaar aur OTP se register karta hai, ek slot book karta hai, aur usse ek sequential token
milta hai — jaise KSN-1048. Uske baad har step — check-in, weighing, quality grading — turant uske
phone pe reflect hota hai, real-time mein, koi refresh ki zaroorat nahi.

Humne existing state procurement portals ka public info dekha — jaise Haryana ka e-Kharid, Punjab
ka Anaaj Kharid. Jo humein publicly mila, usme registration aur ek fixed slot milta hai, lekin
**live queue position** kahin nahi dikhti — farmer ko fir bhi nahi pata ki uski baari kab aayegi.
Yehi gap hum bharte hain: formula-driven wait time, aur database-level role security — sirf UI
mein chhupi hui nahi, balki data access khud database rules mein enforce hoti hai."

**[Slide 3 — Technical Approach — "yahan ruk ke slowly bolna, yeh sabse important slide hai"]**

"Ab dekhte hain hum abhi kya bana chuke hain — sirf plan nahi, **abhi live, demo-able hai.**

*(Yahan phone/laptop nikal ke live demo dikhao — kisanq-farmer.web.app khol ke. Agar time kam ho
to sirf bol dena "yeh live hai" aur aage badh jana.)*

Farmer app Android pe chalta hai, hamne EAS Build se ek installable APK banayi hai, judges abhi
isko apne phone pe install kar sakte hain. 12 languages support karta hai — Hindi, English, aur
das aur — Punjabi se lekar Urdu tak.

Operator aur Admin ka web dashboard bhi live hai, Firebase Hosting pe public deploy kiya hai.
Backend Firebase Firestore hai, real-time — har booking, weighing, quality-check ek transaction
mein hoti hai, taaki do farmers ek slot ke liye race na karein. Humne yeh khud live test kiya hai.

Ek aur cheez jo hamne recently add ki — **Daily Buying Capacity**. Har centre, har fasal ke liye
alag daily buying limit set kar sakta hai — jaise Karnal mein aaj sirf itna wheat aur itna paddy
khareeda jayega. Jab operator ek booking Accept karta hai, yeh number khud ghatta hai; farmer ko
booking se pehle hi pata chal jaata hai kitna bacha hai — taaki koi centre apni asli capacity se
zyada commit na kare.

Ab honestly kuch cheezon ke baare mein bata dete hain jo **abhi plan hai, ban nahi**: SMS gateway
abhi wire nahi hui — notifications poori tarah in-app hain, real-time, lekin actual SMS provider
ka integration agla step hai. Aadhaar verification bhi abhi mocked hai — production ke liye UIDAI
ka official e-KYC integration chahiye hoga. Hum yeh chhupate nahi, khule taur pe bolte hain."

**[Slide 4 — Feasibility and Viability]**

"Hum off-the-shelf stack use karte hain — Android/PWA app, Firebase/Firestore — koi naya hardware
centre pe nahi chahiye. Existing registration → weighing → quality check → payment flow ko replace
nahi karte, usi mein fit hote hain, taaki centres incrementally adopt kar sakein.

Real risks bhi honestly bata dete hain: rural internet patchy ho sakta hai, kuch farmers ke paas
smartphone nahi, aur peak hours mein backend writes fail ho sakte hain. Inke liye humne retry
prompts, manual token entry, aur 'not saved, try again' messaging already bana rakha hai.

Aage humara roadmap teen cheezon pe hai: pehla, ek phone-call/IVR-based path un farmers ke liye
jinke paas smartphone nahi — bilkul Kisan Call Centre, 1800-180-1551, jaisa trusted channel.
Doosra, real SMS gateway. Teesra, real payment gateway — abhi payment simulate hoti hai, koi asli
paisa nahi chalta jab tak Ministry ke saath official integration na ho."

**[Slide 5 — Impact and Benefits]**

"Sabse bada impact — farmer ko ab ghar baithe pata chal jaata hai kitna wait hoga. Ek chhota
example: agar centre pe 50 farmers hain aur average processing time 8 minute hai, purane system
mein har farmer ko bas 'wait karo' bola jaata; hamare system mein farmer number 30 ko pehle hi pata
hoga uske aage 29 log hain, matlab lagbhag 4 ghante ka wait — ab woh apna din plan kar sakta hai,
bina poora din mandi mein khada rehe.

Social level pe — agar produce reject ho to exact reason dikhta hai, silent stop nahi hota,
isliye disputes kam hote hain. Economic level pe — missed slots kam hote hain aur centre apni asli
capacity ke andar hi kaam karta hai. Governance level pe — Ministry ko real-time digital data
milta hai, paper records ki jagah."

**[Slide 6 — Research and References — Closing]**

"Humne official problem statement SIH26032, e-NAM ka existing digitisation model, aur
Firebase/Firestore ki documentation follow ki.

Toh summary mein — hum ek naya registration portal nahi bana rahe. Hum woh missing real-time layer
bana rahe hain jo existing systems mein humein publicly nahi mila: live queue visibility,
transparent daily capacity, aur database-level role security — jo abhi live hai — aur SMS/phone-based
inclusion jo humara agla step hai. Dhanyavaad."

---

## JURY Q&A — 10 likely questions, real answers

Yeh section practice karo achhe se — asli jury bilkul yeh type ke sawaal poochti hai.

**1. "Yeh already exist karta hai — e-Kharid, Anaaj Kharid jaisa — tumhara alag kaise hai?"**
→ "Humne jo public info dekhi, usme registration aur ek fixed slot milta hai, lekin live queue
position kahin nahi dikhti — farmer ko fir bhi pata nahi ki uski baari kab aayegi. Hum yeh
specific gap bharte hain, poora naya system nahi bana rahe."

**2. "SMS gateway abhi kaam karta hai kya?"**
→ "Abhi notifications poori tarah in-app real-time hain, jo already live hai. Actual SMS provider
integration roadmap mein hai, kyunki har farmer ke paas smartphone nahi hota."

**3. "Aadhaar verification real hai?"**
→ "Nahi, prototype mein mocked hai. Production ke liye UIDAI ka official e-KYC integration
chahiye hoga — yeh humne khud documentation mein likha hai, chhupaya nahi."

**4. "Internet slow ho ya na ho — tab app kaise kaam karegi?"**
→ "Abhi genuinely yeh ek real gap hai jo humne khud identify kiya — app har baar fresh network
call karta hai, offline cache nahi hai. Isko fix karne ka plan hai: Firestore ka built-in offline
cache enable karna, taaki repeat visits turant load ho cache se, aur ek clear 'slow network' banner
dikhana instead of ek infinite spinner."

**5. "Agar ek farmer ki processing mein delay ho jaye, agle farmer ka wait-time kaise update
hota hai?"**
→ "Abhi wait-time ek fixed 8-minute-per-person formula se calculate hota hai, jo delay se update
nahi hota — yeh ek genuine limitation hai jo humne khud identify ki. Fix: ek rolling average —
jaise hi koi farmer process hota hai, uska actual time record hota hai, aur agle logon ka estimate
us real average se live update hota hai, na ki ek fixed number se."

**6. "Farmer apne slot pe time pe nahi aaya to uska kya hota hai?"**
→ "Achhi baat — queue position booking-time pe nahi, **check-in-time** pe assign hoti hai. Matlab
late aane pe farmer apna spot nahi khota, bas jab pahunchega tab jo position free hai wahi milegi.
Lekin agar woh poora din hi nahi aata, uska slot abhi bhi 'booked' hi dikhta reh jaata hai — iske
liye ek 'Mark No-Show' operator action plan mein hai, jo uska slot doosre ke liye free kar dega."

**7. "Agar main apni booking cancel karna chahu to kya hota hai?"**
→ "Yeh already poora bana hua hai. Cancel karte hi slot turant free ho jaata hai doosre farmer ke
liye — ek confirm-dialog ke saath, taaki galti se cancel na ho jaye."

**8. "Yeh Daily Buying Capacity feature kya hai, kaise kaam karta hai?"**
→ "Har centre, har fasal ke liye alag limit set kar sakta hai — jaise Karnal mein aaj sirf 500
quintal wheat aur 300 quintal paddy khareeda jayega. Jab operator ek booking Accept karta hai, yeh
number khud transaction mein ghatta hai. Khatam hone pe sirf **naye** bookings block hote hain —
jo already book kar chuke hain unko kuch nahi hota."

**9. "Agar ek hi phone do log (jaise pita-putra) use karein to kya hoga?"**
→ "Yeh ek honest gap hai jo humne khud socha — identity abhi device ke session se judi hai, person
se nahi. Agar do farmer ek phone share karte hain bina logout kiye, unka data overlap ho sakta hai.
Yeh aage improve karna hai — shayad Aadhaar-linked identity jo device badalne pe bhi continue rahe."

**10. "Payment kaise hota hai, kisan ko kab milega?"**
→ "Abhi payment poori tarah simulated hai, koi asli paisa transfer nahi hota — yeh jaanbujhke hai,
jab tak Ministry ka official payment integration na ho. Procurement Status screen mein payment ka
status track hota hai, taaki farmer ko pata rahe process kahan tak pahuncha, bina real payment ke."

---

## Before you present — quick checklist

- [ ] Phone/laptop pe **kisanq-farmer.web.app** khula ho, Operator/Admin login taiyar (Staff ID
      `staff-op-1`, PIN `1234`; Admin: `staff-admin-1` / `9999`)
- [ ] Agar Farmer APK dikhani hai, phone pe pehle se installed ho
- [ ] Script 2-3 baar zor se bol ke practice karo — apne shabdon mein feel karo, robotic mat lagna
- [ ] Slide 3 (Technical Approach) pe sabse zyada time do — yahin sabse zyada sawaal aayenge
