import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

import { supabase } from "@/integrations/supabase/client";

export const LANGUAGES = [
  { code: "en", label: "English", native: "English", speech: "en-IN" },
  { code: "hi", label: "Hindi", native: "हिन्दी", speech: "hi-IN" },
  { code: "bn", label: "Bengali", native: "বাংলা", speech: "bn-IN" },
  { code: "ta", label: "Tamil", native: "தமிழ்", speech: "ta-IN" },
] as const;

export type LangCode = (typeof LANGUAGES)[number]["code"];

export const DEFAULT_LANG: LangCode = "en";
const STORAGE_KEY = "mitra.language";

export function languageName(code: string): string {
  return LANGUAGES.find((l) => l.code === code)?.label ?? "English";
}

export function speechLocale(code: string): string {
  return LANGUAGES.find((l) => l.code === code)?.speech ?? "en-IN";
}

/* -------------------------------- dictionary ------------------------------- */

type Dict = Record<string, string>;

const en: Dict = {
  "brand.tagline": "Care is better together.",

  "nav.today": "Today's Care",
  "nav.messages": "Messages",
    "nav.carePlan": "Care Plan",
  "nav.assistant": "Assistant",
  "nav.profile": "Profile",
  "nav.home": "Home",
  "nav.careCircle": "Care Circle",
  "nav.careRequest": "Care request",
  "nav.matches": "Matches",
  "nav.myProfile": "My profile",
  "nav.groupCaregiver": "Caregiver",
  "nav.groupFamily": "Family",
  "nav.groupFindCare": "Find care",

  "action.signIn": "Sign in",
  "action.signOut": "Sign out",
  "action.getStarted": "Get started",
  "action.continue": "Continue",
  "action.save": "Save",
  "action.cancel": "Cancel",
  "action.complete": "Complete",
  "action.postpone": "Postpone",
  "action.addNote": "Add note",
  "action.editNote": "Edit note",
  "action.openProfile": "Open profile",
  "action.keepSchedule": "Keep current time",

  "lang.label": "Language",
  "lang.hint": "Mitra will use this language across the app.",

  "landing.headline": "Looking after someone you love, without carrying it alone.",
  "landing.sub":
    "Mitra connects families with caregivers and keeps everyone on the same, gentle page — the plan for the day, how it actually went, and what comes next.",
  "landing.ctaFamily": "Find care for my family",
  "landing.ctaCaregiver": "I'm a caregiver",

  "role.title": "Welcome. Who are you here for?",
  "role.sub": "This just helps us set things up. You can always change it later.",
  "role.family": "I'm a family member",
  "role.familyText":
    "Arrange care for a parent or relative, share the plan with siblings, and stay close to their day.",
  "role.caregiver": "I'm a caregiver",
  "role.caregiverText":
    "Build a profile, find families nearby, and keep your day organised with a plan that travels with you.",

  "auth.createTitle": "Create your account",
  "auth.signInTitle": "Welcome back",
  "auth.createSub": "Care is better together — let's set you up.",
  "auth.signInSub": "Sign in to pick up where you left off.",
  "auth.joiningAs": "I'm joining as",
  "auth.changeRole": "Change role",
  "auth.name": "Your name",
  "auth.email": "Email",
  "auth.password": "Password",
  "auth.createAccount": "Create account",
  "auth.haveAccount": "Already have an account?",
  "auth.noAccount": "New to Mitra?",
  "auth.createOne": "Create one",

  "status.pending": "This task hasn't been marked complete yet.",
  "status.doneAt": "Completed at {time}",
  "status.done": "Marked complete",
  "status.postponedAt": "Postponed — new time {time}",
  "status.postponed": "Postponed for now",

  "suggest.title": "Schedule suggestions",
  "suggest.hint": "Nothing changes until you confirm",
  "suggest.intro":
    "Mitra can look at what has actually been recorded over recent days and suggest gentle timing changes. You decide whether to apply them.",
  "suggest.look": "Look for suggestions",
  "suggest.needMore":
    "There aren't enough records yet to spot a pattern. Come back after a few days of task records.",
  "suggest.basedOn": "Based on",
  "suggest.moveTo": "Move to {time}",
};

const hi: Dict = {
  "brand.tagline": "देखभाल साथ मिलकर बेहतर होती है।",

  "nav.today": "आज की देखभाल",
  "nav.messages": "Messages",
    "nav.carePlan": "देखभाल योजना",
  "nav.assistant": "सहायक",
  "nav.profile": "प्रोफ़ाइल",
  "nav.home": "होम",
  "nav.careCircle": "देखभाल मंडल",
  "nav.careRequest": "देखभाल अनुरोध",
  "nav.matches": "सुझाव",
  "nav.myProfile": "मेरी प्रोफ़ाइल",
  "nav.groupCaregiver": "देखभालकर्ता",
  "nav.groupFamily": "परिवार",
  "nav.groupFindCare": "देखभाल खोजें",

  "action.signIn": "साइन इन",
  "action.signOut": "साइन आउट",
  "action.getStarted": "शुरू करें",
  "action.continue": "आगे बढ़ें",
  "action.save": "सहेजें",
  "action.cancel": "रद्द करें",
  "action.complete": "पूरा हुआ",
  "action.postpone": "बाद में",
  "action.addNote": "टिप्पणी जोड़ें",
  "action.editNote": "टिप्पणी बदलें",
  "action.openProfile": "प्रोफ़ाइल खोलें",
  "action.keepSchedule": "समय वैसा ही रखें",

  "lang.label": "भाषा",
  "lang.hint": "मित्र पूरे ऐप में यही भाषा उपयोग करेगा।",

  "landing.headline": "अपनों की देखभाल कीजिए, अकेले बोझ उठाए बिना।",
  "landing.sub":
    "मित्र परिवारों और देखभालकर्ताओं को एक ही शांत जगह पर लाता है — दिन की योजना, दिन कैसा बीता, और आगे क्या है।",
  "landing.ctaFamily": "अपने परिवार के लिए देखभाल खोजें",
  "landing.ctaCaregiver": "मैं देखभालकर्ता हूँ",

  "role.title": "स्वागत है। आप किसके लिए आए हैं?",
  "role.sub": "यह सिर्फ़ शुरुआत के लिए है। आप इसे बाद में बदल सकते हैं।",
  "role.family": "मैं परिवार से हूँ",
  "role.familyText":
    "माता-पिता या रिश्तेदार की देखभाल की व्यवस्था करें, योजना साझा करें और उनके दिन से जुड़े रहें।",
  "role.caregiver": "मैं देखभालकर्ता हूँ",
  "role.caregiverText":
    "अपनी प्रोफ़ाइल बनाएँ, आस-पास के परिवार खोजें और अपने दिन को व्यवस्थित रखें।",

  "auth.createTitle": "अपना खाता बनाएँ",
  "auth.signInTitle": "फिर से स्वागत है",
  "auth.createSub": "देखभाल साथ मिलकर बेहतर होती है — चलिए शुरू करते हैं।",
  "auth.signInSub": "जहाँ छोड़ा था वहीं से जारी रखने के लिए साइन इन करें।",
  "auth.joiningAs": "मैं जुड़ रहा/रही हूँ",
  "auth.changeRole": "भूमिका बदलें",
  "auth.name": "आपका नाम",
  "auth.email": "ईमेल",
  "auth.password": "पासवर्ड",
  "auth.createAccount": "खाता बनाएँ",
  "auth.haveAccount": "पहले से खाता है?",
  "auth.noAccount": "मित्र पर नए हैं?",
  "auth.createOne": "खाता बनाएँ",

  "status.pending": "यह काम अभी पूरा चिह्नित नहीं हुआ है।",
  "status.doneAt": "{time} बजे पूरा हुआ",
  "status.done": "पूरा चिह्नित",
  "status.postponedAt": "आगे बढ़ाया गया — नया समय {time}",
  "status.postponed": "अभी के लिए आगे बढ़ाया गया",

  "suggest.title": "समय-सारणी सुझाव",
  "suggest.hint": "आपकी पुष्टि के बिना कुछ नहीं बदलेगा",
  "suggest.intro":
    "मित्र पिछले दिनों के दर्ज रिकॉर्ड देखकर समय में छोटे बदलाव सुझा सकता है। लागू करना आपके हाथ में है।",
  "suggest.look": "सुझाव देखें",
  "suggest.needMore":
    "अभी पैटर्न देखने के लिए पर्याप्त रिकॉर्ड नहीं हैं। कुछ दिनों के रिकॉर्ड के बाद फिर देखें।",
  "suggest.basedOn": "किस आधार पर",
  "suggest.moveTo": "{time} पर करें",
};

const bn: Dict = {
  "brand.tagline": "একসাথে যত্ন নেওয়া সহজ।",

  "nav.today": "আজকের যত্ন",
  "nav.messages": "Messages",
    "nav.carePlan": "যত্ন পরিকল্পনা",
  "nav.assistant": "সহায়ক",
  "nav.profile": "প্রোফাইল",
  "nav.home": "হোম",
  "nav.careCircle": "যত্ন বৃত্ত",
  "nav.careRequest": "যত্নের অনুরোধ",
  "nav.matches": "মিল",
  "nav.myProfile": "আমার প্রোফাইল",
  "nav.groupCaregiver": "যত্নদাতা",
  "nav.groupFamily": "পরিবার",
  "nav.groupFindCare": "যত্ন খুঁজুন",

  "action.signIn": "সাইন ইন",
  "action.signOut": "সাইন আউট",
  "action.getStarted": "শুরু করুন",
  "action.continue": "এগিয়ে যান",
  "action.save": "সংরক্ষণ",
  "action.cancel": "বাতিল",
  "action.complete": "সম্পন্ন",
  "action.postpone": "পরে",
  "action.addNote": "নোট যোগ করুন",
  "action.editNote": "নোট সম্পাদনা",
  "action.openProfile": "প্রোফাইল খুলুন",
  "action.keepSchedule": "সময় একই রাখুন",

  "lang.label": "ভাষা",
  "lang.hint": "মিত্র পুরো অ্যাপে এই ভাষা ব্যবহার করবে।",

  "landing.headline": "প্রিয়জনের যত্ন নিন, একা বোঝা না বয়ে।",
  "landing.sub":
    "মিত্র পরিবার ও যত্নদাতাদের এক শান্ত জায়গায় নিয়ে আসে — দিনের পরিকল্পনা, দিনটি কেমন গেল, আর সামনে কী আছে।",
  "landing.ctaFamily": "আমার পরিবারের জন্য যত্ন খুঁজুন",
  "landing.ctaCaregiver": "আমি একজন যত্নদাতা",

  "role.title": "স্বাগতম। আপনি কার জন্য এসেছেন?",
  "role.sub": "এটি শুধু শুরু করার জন্য। পরে বদলাতে পারবেন।",
  "role.family": "আমি পরিবারের সদস্য",
  "role.familyText":
    "বাবা-মা বা আত্মীয়ের যত্নের ব্যবস্থা করুন, পরিকল্পনা ভাগ করুন এবং তাঁদের দিনের কাছে থাকুন।",
  "role.caregiver": "আমি একজন যত্নদাতা",
  "role.caregiverText":
    "প্রোফাইল তৈরি করুন, কাছের পরিবার খুঁজুন এবং দিনটি গুছিয়ে রাখুন।",

  "auth.createTitle": "আপনার অ্যাকাউন্ট তৈরি করুন",
  "auth.signInTitle": "আবার স্বাগতম",
  "auth.createSub": "একসাথে যত্ন নেওয়া সহজ — চলুন শুরু করি।",
  "auth.signInSub": "যেখানে ছেড়েছিলেন সেখান থেকে শুরু করতে সাইন ইন করুন।",
  "auth.joiningAs": "আমি যোগ দিচ্ছি",
  "auth.changeRole": "ভূমিকা বদলান",
  "auth.name": "আপনার নাম",
  "auth.email": "ইমেইল",
  "auth.password": "পাসওয়ার্ড",
  "auth.createAccount": "অ্যাকাউন্ট তৈরি করুন",
  "auth.haveAccount": "আগে থেকেই অ্যাকাউন্ট আছে?",
  "auth.noAccount": "মিত্রে নতুন?",
  "auth.createOne": "তৈরি করুন",

  "status.pending": "এই কাজটি এখনও সম্পন্ন চিহ্নিত হয়নি।",
  "status.doneAt": "{time}-এ সম্পন্ন",
  "status.done": "সম্পন্ন চিহ্নিত",
  "status.postponedAt": "পিছিয়ে দেওয়া হয়েছে — নতুন সময় {time}",
  "status.postponed": "আপাতত পিছিয়ে দেওয়া হয়েছে",

  "suggest.title": "সময়সূচির পরামর্শ",
  "suggest.hint": "আপনি নিশ্চিত না করলে কিছুই বদলাবে না",
  "suggest.intro":
    "মিত্র সাম্প্রতিক দিনের রেকর্ড দেখে সময়ের ছোট পরিবর্তনের পরামর্শ দিতে পারে। প্রয়োগ করবেন কি না, সিদ্ধান্ত আপনার।",
  "suggest.look": "পরামর্শ দেখুন",
  "suggest.needMore":
    "প্যাটার্ন বোঝার মতো যথেষ্ট রেকর্ড এখনও নেই। কয়েক দিনের রেকর্ডের পরে আবার দেখুন।",
  "suggest.basedOn": "কীসের ভিত্তিতে",
  "suggest.moveTo": "{time}-এ সরান",
};

const ta: Dict = {
  "brand.tagline": "ஒன்றாக இருந்தால் பராமரிப்பு எளிது.",

  "nav.today": "இன்றைய பராமரிப்பு",
  "nav.messages": "Messages",
    "nav.carePlan": "பராமரிப்புத் திட்டம்",
  "nav.assistant": "உதவியாளர்",
  "nav.profile": "சுயவிவரம்",
  "nav.home": "முகப்பு",
  "nav.careCircle": "பராமரிப்பு வட்டம்",
  "nav.careRequest": "பராமரிப்பு கோரிக்கை",
  "nav.matches": "பொருத்தங்கள்",
  "nav.myProfile": "என் சுயவிவரம்",
  "nav.groupCaregiver": "பராமரிப்பாளர்",
  "nav.groupFamily": "குடும்பம்",
  "nav.groupFindCare": "பராமரிப்பு தேடு",

  "action.signIn": "உள்நுழை",
  "action.signOut": "வெளியேறு",
  "action.getStarted": "தொடங்கு",
  "action.continue": "தொடரவும்",
  "action.save": "சேமி",
  "action.cancel": "ரத்து",
  "action.complete": "முடிந்தது",
  "action.postpone": "பிறகு",
  "action.addNote": "குறிப்பு சேர்",
  "action.editNote": "குறிப்பை மாற்று",
  "action.openProfile": "சுயவிவரம் திற",
  "action.keepSchedule": "நேரத்தை அப்படியே வை",

  "lang.label": "மொழி",
  "lang.hint": "மித்ரா செயலி முழுவதும் இந்த மொழியைப் பயன்படுத்தும்.",

  "landing.headline": "நேசிப்பவரை கவனியுங்கள், சுமையை தனியாக சுமக்காமல்.",
  "landing.sub":
    "மித்ரா குடும்பங்களையும் பராமரிப்பாளர்களையும் ஒரே அமைதியான இடத்தில் இணைக்கிறது — நாளின் திட்டம், நாள் எப்படி சென்றது, அடுத்து என்ன.",
  "landing.ctaFamily": "என் குடும்பத்திற்கு பராமரிப்பு தேடு",
  "landing.ctaCaregiver": "நான் ஒரு பராமரிப்பாளர்",

  "role.title": "வரவேற்கிறோம். நீங்கள் யாருக்காக வந்தீர்கள்?",
  "role.sub": "இது தொடங்குவதற்கு மட்டுமே. பிறகு மாற்றலாம்.",
  "role.family": "நான் குடும்ப உறுப்பினர்",
  "role.familyText":
    "பெற்றோர் அல்லது உறவினருக்கு பராமரிப்பை ஏற்பாடு செய்யுங்கள், திட்டத்தைப் பகிருங்கள், அவர்களின் நாளுடன் நெருக்கமாக இருங்கள்.",
  "role.caregiver": "நான் ஒரு பராமரிப்பாளர்",
  "role.caregiverText":
    "சுயவிவரத்தை உருவாக்குங்கள், அருகிலுள்ள குடும்பங்களைக் கண்டறியுங்கள், உங்கள் நாளை ஒழுங்காக வைத்திருங்கள்.",

  "auth.createTitle": "உங்கள் கணக்கை உருவாக்குங்கள்",
  "auth.signInTitle": "மீண்டும் வரவேற்கிறோம்",
  "auth.createSub": "ஒன்றாக இருந்தால் பராமரிப்பு எளிது — தொடங்குவோம்.",
  "auth.signInSub": "நிறுத்திய இடத்திலிருந்து தொடர உள்நுழையுங்கள்.",
  "auth.joiningAs": "நான் இணைவது",
  "auth.changeRole": "பங்கை மாற்று",
  "auth.name": "உங்கள் பெயர்",
  "auth.email": "மின்னஞ்சல்",
  "auth.password": "கடவுச்சொல்",
  "auth.createAccount": "கணக்கை உருவாக்கு",
  "auth.haveAccount": "ஏற்கனவே கணக்கு உள்ளதா?",
  "auth.noAccount": "மித்ராவிற்கு புதியவரா?",
  "auth.createOne": "உருவாக்கு",

  "status.pending": "இந்தப் பணி இன்னும் முடிந்ததாகக் குறிக்கப்படவில்லை.",
  "status.doneAt": "{time} மணிக்கு முடிந்தது",
  "status.done": "முடிந்ததாகக் குறிக்கப்பட்டது",
  "status.postponedAt": "ஒத்திவைக்கப்பட்டது — புதிய நேரம் {time}",
  "status.postponed": "தற்போதைக்கு ஒத்திவைக்கப்பட்டது",

  "suggest.title": "நேர அட்டவணை பரிந்துரைகள்",
  "suggest.hint": "நீங்கள் உறுதி செய்யும் வரை எதுவும் மாறாது",
  "suggest.intro":
    "சமீபத்திய நாட்களின் பதிவுகளைப் பார்த்து மித்ரா சிறிய நேர மாற்றங்களைப் பரிந்துரைக்கலாம். பயன்படுத்துவது உங்கள் முடிவு.",
  "suggest.look": "பரிந்துரைகளைப் பார்",
  "suggest.needMore":
    "வடிவத்தைக் காண போதிய பதிவுகள் இன்னும் இல்லை. சில நாட்கள் பதிவுகளுக்குப் பிறகு பாருங்கள்.",
  "suggest.basedOn": "எதன் அடிப்படையில்",
  "suggest.moveTo": "{time}-க்கு மாற்று",
};

const DICTS: Record<LangCode, Dict> = { en, hi, bn, ta };

export type Translate = (key: string, vars?: Record<string, string>) => string;

/* --------------------------------- context -------------------------------- */

type LanguageContextValue = {
  lang: LangCode;
  setLang: (next: LangCode) => void;
  t: Translate;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

function isLang(value: unknown): value is LangCode {
  return LANGUAGES.some((l) => l.code === value);
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<LangCode>(DEFAULT_LANG);

  // Read the stored choice after hydration so SSR and client markup agree.
  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (isLang(stored)) {
      setLangState(stored);
      return;
    }
    let cancelled = false;
    void (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user || cancelled) return;
      const { data } = await supabase
        .from("profiles")
        .select("ui_language")
        .eq("id", auth.user.id)
        .maybeSingle();
      const saved = (data as { ui_language?: string } | null)?.ui_language;
      if (!cancelled && isLang(saved)) setLangState(saved);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const setLang = useCallback((next: LangCode) => {
    setLangState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
    void (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return;
      await supabase.from("profiles").update({ ui_language: next }).eq("id", auth.user.id);
    })();
  }, []);

  const value = useMemo<LanguageContextValue>(() => {
    const dict = DICTS[lang] ?? en;
    const t: Translate = (key, vars) => {
      let text = dict[key] ?? en[key] ?? key;
      if (vars) {
        for (const [name, replacement] of Object.entries(vars)) {
          text = text.replaceAll(`{${name}}`, replacement);
        }
      }
      return text;
    };
    return { lang, setLang, t };
  }, [lang, setLang]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  const context = useContext(LanguageContext);
  if (context) return context;
  // Safe fallback so components never crash outside the provider.
  return {
    lang: DEFAULT_LANG,
    setLang: () => undefined,
    t: (key, vars) => {
      let text = en[key] ?? key;
      if (vars) for (const [n, v] of Object.entries(vars)) text = text.replaceAll(`{${n}}`, v);
      return text;
    },
  };
}

export function useT(): Translate {
  return useLanguage().t;
}
