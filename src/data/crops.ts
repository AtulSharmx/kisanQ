/**
 * Shared crop picker list — used by both StepCropScreen (registration) and AddCropScreen
 * (booking a new slot later), which must stay in sync since `key` becomes the Firestore
 * `Crop.cropType` value either way. MSP-covered non-perishable crops (CLAUDE.md rule 7) —
 * cereals, pulses, oilseeds, and commercial crops, none of them perishable produce.
 *
 * `labels` keys must stay a superset covering every `Lang` in i18n/strings.ts — kept as a
 * separate small per-crop map (not folded into strings.ts) since these are proper nouns, not
 * app UI copy.
 */
import type { Lang } from "../i18n/strings";

export interface CropOption {
  key: string;
  icon: string;
  labels: Record<Lang, string>;
}

export const CROPS: CropOption[] = [
  {
    key: "wheat",
    icon: "🌾",
    labels: {
      hi: "गेहूं", en: "Wheat", pa: "ਕਣਕ", bn: "গম", mr: "गहू", gu: "ઘઉં", te: "గోధుమ",
      ta: "கோதுமை", kn: "ಗೋಧಿ", ml: "ഗോതമ്പ്", or: "ଗହମ", ur: "گندم",
    },
  },
  {
    key: "paddy",
    icon: "🌾",
    labels: {
      hi: "धान", en: "Paddy", pa: "ਝੋਨਾ", bn: "ধান", mr: "भात", gu: "ડાંગર", te: "వరి",
      ta: "நெல்", kn: "ಭತ್ತ", ml: "നെല്ല്", or: "ଧାନ", ur: "دھان",
    },
  },
  {
    key: "mustard",
    icon: "🌻",
    labels: {
      hi: "सरसों", en: "Mustard", pa: "ਸਰੋਂ", bn: "সরিষা", mr: "मोहरी", gu: "રાઈ", te: "ఆవాలు",
      ta: "கடுகு", kn: "ಸಾಸಿವೆ", ml: "കടുക്", or: "ସୋରିଷ", ur: "سرسوں",
    },
  },
  {
    key: "chana",
    icon: "🫘",
    labels: {
      hi: "चना", en: "Chickpea", pa: "ਛੋਲੇ", bn: "ছোলা", mr: "हरभरा", gu: "ચણા", te: "శనగలు",
      ta: "கொண்டைக்கடலை", kn: "ಕಡಲೆ", ml: "കടല", or: "ଛୋଲା", ur: "چنا",
    },
  },
  {
    key: "bajra",
    icon: "🌾",
    labels: {
      hi: "बाजरा", en: "Pearl Millet", pa: "ਬਾਜਰਾ", bn: "বাজরা", mr: "बाजरी", gu: "બાજરી",
      te: "సజ్జలు", ta: "கம்பு", kn: "ಸಜ್ಜೆ", ml: "കമ്പം", or: "ବାଜରା", ur: "باجرا",
    },
  },
  {
    key: "jowar",
    icon: "🌾",
    labels: {
      hi: "ज्वार", en: "Sorghum", pa: "ਜਵਾਰ", bn: "জোয়ার", mr: "ज्वारी", gu: "જુવાર", te: "జొన్నలు",
      ta: "சோளம்", kn: "ಜೋಳ", ml: "ചോളം", or: "ଜହ୍ନା", ur: "جوار",
    },
  },
  {
    key: "makka",
    icon: "🌽",
    labels: {
      hi: "मक्का", en: "Maize", pa: "ਮੱਕੀ", bn: "ভুট্টা", mr: "मका", gu: "મકાઈ", te: "మొక్కజొన్న",
      ta: "மக்காச்சோளம்", kn: "ಮೆಕ್ಕೆಜೋಳ", ml: "ചോളം", or: "ମକା", ur: "مکئی",
    },
  },
  {
    key: "kapas",
    icon: "☁️",
    labels: {
      hi: "कपास", en: "Cotton", pa: "ਕਪਾਹ", bn: "তুলা", mr: "कापूस", gu: "કપાસ", te: "పత్తి",
      ta: "பருத்தி", kn: "ಹತ್ತಿ", ml: "പരുത്തി", or: "କପା", ur: "کپاس",
    },
  },
  {
    key: "ganna",
    icon: "🎋",
    labels: {
      hi: "गन्ना", en: "Sugarcane", pa: "ਗੰਨਾ", bn: "আখ", mr: "ऊस", gu: "શેરડી", te: "చెరకు",
      ta: "கரும்பு", kn: "ಕಬ್ಬು", ml: "കരിമ്പ്", or: "ଆଖୁ", ur: "گنا",
    },
  },
  {
    key: "moong",
    icon: "🫛",
    labels: {
      hi: "मूंग", en: "Green Gram", pa: "ਮੂੰਗ", bn: "মুগ", mr: "मूग", gu: "મગ", te: "పెసలు",
      ta: "பாசிப்பயறு", kn: "ಹೆಸರುಕಾಳು", ml: "ചെറുപയർ", or: "ମୁଗ", ur: "مونگ",
    },
  },
  // Barley and lentil were added with the RMS 2026-27 MSP config (src/config/msp.ts) — both are
  // Rabi MSP crops with a verified price. No bundled photo yet, so CropThumb shows the emoji.
  {
    key: "barley",
    icon: "🌾",
    labels: {
      hi: "जौ", en: "Barley", pa: "ਜੌਂ", bn: "যব", mr: "जव", gu: "જવ", te: "బార్లీ",
      ta: "வாற்கோதுமை", kn: "ಬಾರ್ಲಿ", ml: "ബാർലി", or: "ଯବ", ur: "جو",
    },
  },
  {
    key: "masur",
    icon: "🫘",
    labels: {
      hi: "मसूर", en: "Lentil (Masur)", pa: "ਮਸਰ", bn: "মসুর", mr: "मसूर", gu: "મસૂર",
      te: "మసూర్ పప్పు", ta: "மசூர் பருப்பு", kn: "ಮಸೂರ್ ಬೇಳೆ", ml: "മസൂർ പരിപ്പ്", or: "ମସୁର",
      ur: "مسور",
    },
  },
];
