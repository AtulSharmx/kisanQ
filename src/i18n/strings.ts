/**
 * Bilingual strings — Hindi is default (docs/KisanQ_UIUX_Spec.md principle 6).
 * Exact copy from docs/KisanQ_UIUX_Spec.md and docs/KisanQ_Missing_Details_Polish.md is used
 * verbatim where the spec gives it, rather than inventing new wording (CLAUDE.md rule 4).
 */
export type Lang = "hi" | "en";

export const strings = {
  appName: { hi: "KisanQ", en: "KisanQ" },
  langSelectTitle: { hi: "अपनी भाषा चुनें", en: "Choose your language" },
  langHindi: { hi: "हिंदी", en: "हिंदी" },
  langEnglish: { hi: "English", en: "English" },

  aadhaarTitle: { hi: "आधार से लॉगिन करें", en: "Login with Aadhaar" },
  aadhaarHint: {
    hi: "आपकी जानकारी सिर्फ पंजीकरण के लिए इस्तेमाल होगी, सुरक्षित रखी जाएगी।",
    en: "Your information will only be used for registration and kept secure.",
  },
  aadhaarPlaceholder: { hi: "12 अंकों का आधार नंबर", en: "12-digit Aadhaar number" },
  continueBtn: { hi: "आगे बढ़ें", en: "Continue" },
  alreadyRegistered: {
    hi: "पहले से रजिस्टर हैं? Login करें",
    en: "Already registered? Log in",
  },
  mockNotice: {
    hi: "(डेमो) यह Aadhaar सत्यापन प्रोटोटाइप के लिए नकली है",
    en: "(Demo) This Aadhaar verification is mocked for the prototype",
  },
  invalidAadhaar: {
    hi: "कृपया 12 अंकों का सही आधार नंबर डालें",
    en: "Please enter a valid 12-digit Aadhaar number",
  },

  otpTitle: { hi: "OTP दर्ज करें", en: "Enter OTP" },
  otpSentTo: { hi: "OTP भेजा गया", en: "OTP sent" },
  otpDemoValue: { hi: "(डेमो) OTP: 123456", en: "(Demo) OTP: 123456" },
  resendOtp: { hi: "OTP दोबारा भेजें", en: "Resend OTP" },
  otpFailFallback: {
    hi: "Operator के पास फिंगरप्रिंट से वेरिफाई करें",
    en: "Verify by fingerprint with operator",
  },
  invalidOtp: { hi: "गलत OTP, दोबारा कोशिश करें", en: "Incorrect OTP, try again" },
  verifyingFingerprint: {
    hi: "ऑपरेटर द्वारा फिंगरप्रिंट सत्यापन... (डेमो)",
    en: "Operator fingerprint verification... (demo)",
  },

  profileConfirmTitle: { hi: "प्रोफ़ाइल की पुष्टि करें", en: "Confirm your profile" },
  profileName: { hi: "नाम", en: "Name" },
  profileState: { hi: "राज्य", en: "State" },
  profileDistrict: { hi: "ज़िला", en: "District" },
  profileAddress: { hi: "पता", en: "Address" },
  profileMobile: { hi: "मोबाइल", en: "Mobile" },
  profileConfirmBtn: { hi: "यह सही है, आगे बढ़ें", en: "This is correct, continue" },
  wrongInfoLink: {
    hi: "गलत जानकारी? Operator को बताएं",
    en: "Wrong info? Tell the operator",
  },

  stepVillageTitle: { hi: "गांव चुनें", en: "Choose your village" },
  villagePlaceholder: { hi: "गांव खोजें", en: "Search village" },

  stepCropTitle: { hi: "फसल और मात्रा", en: "Crop & quantity" },
  cropQuantityLabel: { hi: "अनुमानित मात्रा (क्विंटल)", en: "Expected quantity (quintals)" },

  stepCentreTitle: { hi: "पसंदीदा केंद्र", en: "Preferred centre" },

  homeBookSlot: { hi: "स्लॉट बुक करें", en: "Book Slot" },
  homeMyToken: { hi: "मेरा टोकन", en: "My Token" },
  homeLiveQueue: { hi: "लाइव कतार", en: "Live Queue" },
  homeMyProduce: { hi: "मेरी फसल", en: "My Produce" },
  homeProcurementStatus: { hi: "प्रक्रिया स्थिति", en: "Procurement Status" },
  homePayment: { hi: "भुगतान", en: "Payment" },
  homeNotifications: { hi: "सूचनाएं", en: "Notifications" },
  homeHelp: { hi: "सहायता", en: "Help/Call" },
  comingSoon: { hi: "यह सुविधा जल्द आ रही है", en: "This feature is coming soon" },
  emptyMyProduce: { hi: "अभी कोई फसल जोड़ी नहीं गई", en: "No crops added yet" },
  emptyNotifications: { hi: "अभी कोई सूचना नहीं", en: "No notifications yet" },
  emptyLiveQueue: { hi: "आपकी कोई बुकिंग नहीं है", en: "You have no active booking" },
  emptyPayment: { hi: "अभी कोई भुगतान नहीं", en: "No payment yet" },

  liveQueuePeopleAhead: { hi: "आपसे पहले {n} लोग", en: "{n} people ahead of you" },
  liveQueueEstWait: { hi: "अनुमानित प्रतीक्षा", en: "Estimated wait" },
  liveQueueAwaitingCheckin: {
    hi: "चेक-इन का इंतज़ार है — केंद्र पर पहुंचकर QR स्कैन करवाएं",
    en: "Waiting for check-in — scan your QR at the centre",
  },
  liveQueueYourTurn: { hi: "आपकी बारी आ गई है — काउंटर पर पहुंचें", en: "It's your turn — please go to the counter" },
  liveQueueDone: { hi: "प्रक्रिया पूरी हुई", en: "Processing complete" },

  procStepBooked: { hi: "स्लॉट बुक हुआ", en: "Slot booked" },
  procStepArrived: { hi: "पहुंच गए", en: "Arrived" },
  procStepWeighed: { hi: "तौल हुई", en: "Weighed" },
  procStepQualityChecked: { hi: "जांच हुई", en: "Quality checked" },
  procStepAccepted: { hi: "स्वीकार हुआ", en: "Accepted" },
  procStepPayment: { hi: "भुगतान", en: "Payment" },
  procRejected: { hi: "अस्वीकार किया गया", en: "Rejected" },

  addCropTitle: { hi: "फसल जोड़ें", en: "Add crop / produce" },
  checkSlotsBtn: { hi: "उपलब्ध स्लॉट देखें", en: "Check Available Slots" },

  centreSelectionTitle: { hi: "केंद्र चुनें", en: "Select a centre" },
  slotsAvailable: { hi: "🟢 स्लॉट उपलब्ध", en: "🟢 Slots available" },
  slotsFull: { hi: "🔴 भरा हुआ", en: "🔴 Full" },
  shortestWait: { hi: "सबसे कम इंतज़ार", en: "Shortest wait" },
  kmAway: { hi: "किमी दूर", en: "km away" },
  estWait: { hi: "अनुमानित प्रतीक्षा", en: "Est. wait" },
  minutes: { hi: "मिनट", en: "min" },

  slotBookingTitle: { hi: "समय स्लॉट चुनें", en: "Choose a time slot" },
  confirmBookingBtn: { hi: "बुकिंग की पुष्टि करें", en: "Confirm booking" },

  tokenScreenTitle: { hi: "आपका टोकन", en: "Your token" },
  downloadShare: { hi: "डाउनलोड / शेयर करें", en: "Download / Share" },
  goHome: { hi: "होम पर जाएं", en: "Go to home" },

  cancelConfirmTitle: {
    hi: "क्या आप वाकई अपनी स्लॉट रद्द करना चाहते हैं?",
    en: "Are you sure you want to cancel your slot?",
  },
  cancelConfirmYes: { hi: "हाँ, रद्द करें", en: "Yes, cancel" },
  cancelConfirmNo: { hi: "नहीं", en: "No" },

  noInternet: { hi: "इंटरनेट कनेक्शन जांचें", en: "Check your internet connection" },
  retry: { hi: "पुनः प्रयास करें", en: "Retry" },
  saveFailed: { hi: "सेव नहीं हुआ, दोबारा कोशिश करें", en: "Save failed, please try again" },

  loading: { hi: "लोड हो रहा है...", en: "Loading..." },
  back: { hi: "वापस", en: "Back" },
} as const;

export type StringKey = keyof typeof strings;

export function t(key: StringKey, lang: Lang): string {
  return strings[key][lang];
}
