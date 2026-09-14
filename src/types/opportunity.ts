import type { LanguageCode } from "@/languages";
import { arabicCountries, countriesByLanguage } from "@/lib/countries";

export type OpportunityId = string | number;

export type OpportunityStatus =
  | "draft"
  | "pending"
  | "published"
  | "archived"
  | "rejected"
  | (string & {});

export type OpportunityCategory = {
  id: OpportunityId;
  name: string;
};

const supportedLanguageOrder: LanguageCode[] = [
  "ar",
  "en",
  "es",
  "fr",
  "de",
  "pt",
  "ja",
  "zh",
];

const supportedLanguageSet = new Set<LanguageCode>(supportedLanguageOrder);

function normalizeLocaleKey(value: string): string {
  return value.toLowerCase().replace(/[-_]/g, "");
}

function isLanguageKey(key: string): boolean {
  const normalized = normalizeLocaleKey(key);
  return supportedLanguageSet.has(normalized as LanguageCode) || supportedLanguageOrder.some((language) => normalized === language || normalized.endsWith(language));
}

function isLanguageMap(record: Record<string, unknown>): boolean {
  return Object.keys(record).some((key) => isLanguageKey(key));
}

export function getLocalizedText(
  value: unknown,
  language: LanguageCode = "en",
  fallbackLanguage: LanguageCode = "en"
): string | null {
  if (typeof value === "string") {
    return value.trim() || null;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const localized = getLocalizedText(item, language, fallbackLanguage);
      if (localized) {
        return localized;
      }
    }
    return null;
  }

  if (value == null || typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;
  const isMap = isLanguageMap(record);
  const orderedCandidates: LanguageCode[] = [
    language,
    fallbackLanguage,
    ...supportedLanguageOrder.filter((candidate) => candidate !== language && candidate !== fallbackLanguage),
  ];

  for (const candidate of orderedCandidates) {
    const directValue = record[candidate];
    const directText = getLocalizedText(directValue, language, fallbackLanguage);
    if (directText) {
      return directText;
    }

    const localeMatches = Object.entries(record).filter(([key]) => {
      const normalizedKey = normalizeLocaleKey(key);
      return (
        normalizedKey === candidate ||
        normalizedKey.endsWith(candidate) ||
        normalizedKey.startsWith(`${candidate}value`) ||
        normalizedKey.startsWith(`${candidate}text`) ||
        normalizedKey.startsWith(`${candidate}label`) ||
        normalizedKey.endsWith(`${candidate}value`) ||
        normalizedKey.endsWith(`${candidate}text`) ||
        normalizedKey.endsWith(`${candidate}label`)
      );
    });

    for (const [, nestedValue] of localeMatches) {
      const nestedText = getLocalizedText(nestedValue, language, fallbackLanguage);
      if (nestedText) {
        return nestedText;
      }
    }
  }

  if (isMap) {
    return null;
  }

  for (const key of [
    "translations",
    "translation",
    "localized",
    "locales",
    "labels",
    "label",
    "text",
    "value",
    "name",
    "title",
    "short_description",
    "description",
  ]) {
    const nested = record[key];
    const localized = getLocalizedText(nested, language, fallbackLanguage);
    if (localized) {
      return localized;
    }
  }

  for (const nested of Object.values(record)) {
    const localized = getLocalizedText(nested, language, fallbackLanguage);
    if (localized) {
      return localized;
    }
  }

  return null;
}

export function joinLocalizedList(
  values: Array<string | Record<string, unknown> | null | undefined> | null | undefined,
  language: LanguageCode = "en"
): string {
  const normalized = (values ?? [])
    .map((value) => getLocalizedText(value, language, "en"))
    .filter((value): value is string => Boolean(value));

  if (normalized.length === 0) {
    return "";
  }

  return normalized.join(language === "ar" ? "، " : ", ");
}

const countryTranslations: Record<string, Record<LanguageCode, string>> = {
  "saudi arabia": { ar: "السعودية", en: "Saudi Arabia", es: "Arabia Saudita", fr: "Arabie saoudite", de: "Saudi-Arabien", pt: "Arábia Saudita", ja: "サウジアラビア", zh: "沙特阿拉伯" },
  "united arab emirates": { ar: "الإمارات", en: "United Arab Emirates", es: "Emiratos Árabes Unidos", fr: "Émirats arabes unis", de: "Vereinigte Arabische Emirate", pt: "Emirados Árabes Unidos", ja: "アラブ首長国連邦", zh: "阿拉伯联合酋长国" },
  "united states": { ar: "الولايات المتحدة", en: "United States", es: "Estados Unidos", fr: "États-Unis", de: "Vereinigte Staaten", pt: "Estados Unidos", ja: "アメリカ合衆国", zh: "美国" },
  "united kingdom": { ar: "المملكة المتحدة", en: "United Kingdom", es: "Reino Unido", fr: "Royaume-Uni", de: "Vereinigtes Königreich", pt: "Reino Unido", ja: "イギリス", zh: "英国" },
  "south korea": { ar: "كوريا الجنوبية", en: "South Korea", es: "Corea del Sur", fr: "Corée du Sud", de: "Südkorea", pt: "Coreia do Sul", ja: "韓国", zh: "韩国" },
  "south africa": { ar: "جنوب أفريقيا", en: "South Africa", es: "Sudáfrica", fr: "Afrique du Sud", de: "Südafrika", pt: "África do Sul", ja: "南アフリカ", zh: "南非" },
  "new zealand": { ar: "نيوزيلندا", en: "New Zealand", es: "Nueva Zelanda", fr: "Nouvelle-Zélande", de: "Neuseeland", pt: "Nova Zelândia", ja: "ニュージーランド", zh: "新西兰" },
};

const allCountriesTranslations: Record<LanguageCode, string> = {
  ar: "الجميع",
  en: "All countries",
  es: "Todos los países",
  fr: "Tous les pays",
  de: "Alle Länder",
  pt: "Todos os países",
  ja: "すべての国",
  zh: "所有国家",
};

export function localizeCountry(value: unknown, language: LanguageCode = "en"): string | null {
  const text = getLocalizedText(value, language, "en");
  if (!text) return null;

  const normalized = text.trim().toLowerCase();
  if (["الجميع", "كل الدول", "جميع الدول", "all countries"].includes(normalized)) {
    return allCountriesTranslations[language];
  }
  const legacyTranslation = countryTranslations[normalized]?.[language];
  if (legacyTranslation) return legacyTranslation;

  const arabicCountryIndex = arabicCountries.findIndex((country) => country.toLowerCase() === normalized);
  if (arabicCountryIndex >= 0) return countriesByLanguage[language][arabicCountryIndex] ?? text;

  const sourceCountries = Object.values(countriesByLanguage).find((countries) =>
    countries.some((country) => country.toLowerCase() === normalized),
  );
  const countryIndex = sourceCountries?.findIndex((country) => country.toLowerCase() === normalized) ?? -1;
  return countryIndex >= 0 ? countriesByLanguage[language][countryIndex] ?? text : text;
}

const paymentMethodTranslations: Record<string, Record<LanguageCode, string>> = {
  bank_account: { ar: "الحساب البنكي", en: "Bank account", es: "Cuenta bancaria", fr: "Compte bancaire", de: "Bankkonto", pt: "Conta bancária", ja: "銀行口座", zh: "银行账户" },
  paypal: { ar: "PayPal", en: "PayPal", es: "PayPal", fr: "PayPal", de: "PayPal", pt: "PayPal", ja: "PayPal", zh: "PayPal" },
  payoneer: { ar: "Payoneer", en: "Payoneer", es: "Payoneer", fr: "Payoneer", de: "Payoneer", pt: "Payoneer", ja: "Payoneer", zh: "Payoneer" },
  cryptocurrency: { ar: "العملات الرقمية", en: "Cryptocurrency", es: "Criptomoneda", fr: "Cryptomonnaie", de: "Kryptowährung", pt: "Criptomoeda", ja: "暗号資産", zh: "加密货币" },
};

export function localizePaymentMethod(value: unknown, language: LanguageCode = "en"): string | null {
  const text = getLocalizedText(value, language, "en");
  if (!text) return null;
  const key = text.trim().toLowerCase().replace(/[-\s]/g, "_");
  const arabicPaymentAliases: Record<string, string> = {
    "تحويل": "bank_account",
    "تحويل_بنكي": "bank_account",
    "تحويل_مصرفي": "bank_account",
    "حساب_بنكي": "bank_account",
    "حساب_مصرفي": "bank_account",
    bank_transfer: "bank_account",
    wire_transfer: "bank_account",
    "عملات": "cryptocurrency",
    "عملة": "cryptocurrency",
    "عملات_رقمية": "cryptocurrency",
    "العملات_الرقمية": "cryptocurrency",
  };
  const normalizedKey = arabicPaymentAliases[key] ?? key;
  return paymentMethodTranslations[normalizedKey]?.[language] ?? text;
}

const requirementTranslations: Record<string, Record<LanguageCode, string>> = {
  "حساب مستخدم": { ar: "حساب مستخدم", en: "User account", es: "Cuenta de usuario", fr: "Compte utilisateur", de: "Benutzerkonto", pt: "Conta de usuário", ja: "ユーザーアカウント", zh: "用户账户" },
  "اتصال بالإنترنت": { ar: "اتصال بالإنترنت", en: "Internet connection", es: "Conexión a Internet", fr: "Connexion Internet", de: "Internetverbindung", pt: "Conexão à Internet", ja: "インターネット接続", zh: "互联网连接" },
  "هاتف ذكي": { ar: "هاتف ذكي", en: "Smartphone", es: "Teléfono inteligente", fr: "Smartphone", de: "Smartphone", pt: "Smartphone", ja: "スマートフォン", zh: "智能手机" },
  "بدون": { ar: "بدون", en: "None", es: "Ninguno", fr: "Aucun", de: "Keine", pt: "Nenhum", ja: "なし", zh: "无" },
  "لا يوجد": { ar: "لا يوجد", en: "None", es: "Ninguno", fr: "Aucun", de: "Keine", pt: "Nenhum", ja: "なし", zh: "无" },
};

export function localizeRequirement(value: unknown, language: LanguageCode = "en"): string | null {
  const text = getLocalizedText(value, language, "en");
  if (!text) return null;
  return requirementTranslations[text.trim()]?.[language] ?? text;
}

export function joinLocalizedOpportunityList(
  values: Array<string | Record<string, unknown> | null | undefined> | null | undefined,
  language: LanguageCode = "en",
  localize: (value: unknown, language: LanguageCode) => string | null,
): string {
  const normalized = (values ?? [])
    .flatMap((value) => String(localize(value, language) ?? "").split(","))
    .map((value) => value.trim())
    .filter(Boolean);
  return normalized.join(language === "ar" ? "، " : ", ");
}

const categoryTranslations: Record<string, Record<LanguageCode, string>> = {
  "العمل الحر": {
    ar: "العمل الحر",
    en: "Freelancing",
    es: "Trabajo freelance",
    fr: "Travail indépendant",
    de: "Freiberufliche Arbeit",
    pt: "Trabalho freelance",
    ja: "フリーランス",
    zh: "自由职业",
  },
  الاستبيانات: {
    ar: "الاستبيانات",
    en: "Surveys",
    es: "Encuestas",
    fr: "Sondages",
    de: "Umfragen",
    pt: "Pesquisas",
    ja: "アンケート",
    zh: "问卷调查",
  },
  "التطبيقات والمواقع": {
    ar: "التطبيقات والمواقع",
    en: "Apps and websites",
    es: "Aplicaciones y sitios web",
    fr: "Applications et sites web",
    de: "Apps und Websites",
    pt: "Aplicativos e sites",
    ja: "アプリとウェブサイト",
    zh: "应用和网站",
  },
  التسويق: {
    ar: "التسويق",
    en: "Marketing",
    es: "Marketing",
    fr: "Marketing",
    de: "Marketing",
    pt: "Marketing",
    ja: "マーケティング",
    zh: "营销",
  },
  "العمل عن بعد": {
    ar: "العمل عن بعد",
    en: "Remote work",
    es: "Trabajo remoto",
    fr: "Travail à distance",
    de: "Remote-Arbeit",
    pt: "Trabalho remoto",
    ja: "リモートワーク",
    zh: "远程工作",
  },
};

export function localizeCategory(value: unknown, language: LanguageCode = "en"): string | null {
  const text = getLocalizedText(value, language, "en");
  if (!text) return null;

  return categoryTranslations[text.trim()]?.[language] ?? text;
}

const deviceTranslations: Record<string, Record<LanguageCode, string>> = {
  computer: {
    ar: "كمبيوتر",
    en: "Computer",
    es: "Ordenador",
    fr: "Ordinateur",
    de: "Computer",
    pt: "Computador",
    ja: "コンピューター",
    zh: "电脑",
  },
  android: {
    ar: "أندرويد",
    en: "Android",
    es: "Android",
    fr: "Android",
    de: "Android",
    pt: "Android",
    ja: "Android",
    zh: "Android",
  },
  iphone: {
    ar: "آيفون",
    en: "iPhone",
    es: "iPhone",
    fr: "iPhone",
    de: "iPhone",
    pt: "iPhone",
    ja: "iPhone",
    zh: "iPhone",
  },
};

const deviceAliases: Record<string, string> = {
  "كل الأجهزة": "all_devices",
  "جميع الأجهزة": "all_devices",
  "الجميع": "all_devices",
  "all devices": "all_devices",
  all: "all_devices",
  "all_device": "all_devices",
  "كمبيوتر": "computer",
  computer: "computer",
  pc: "computer",
  "ايفون": "iphone",
  "آيفون": "iphone",
};

const allDevicesTranslations: Record<LanguageCode, string> = {
  ar: "كل الأجهزة",
  en: "All devices",
  es: "Todos los dispositivos",
  fr: "Tous les appareils",
  de: "Alle Geräte",
  pt: "Todos os dispositivos",
  ja: "すべてのデバイス",
  zh: "所有设备",
};

export function localizeDevice(
  raw: unknown,
  language: LanguageCode = "en"
): string | null {
  const items: string[] = [];

  if (Array.isArray(raw)) {
    for (const item of raw) {
      const t = getLocalizedText(item, language, "en");
      if (t) items.push(t);
    }
  } else {
    const t = getLocalizedText(raw, language, "en");
    if (t) items.push(t);
  }

  if (items.length === 0) return null;

  const parts = items
    .flatMap((text) => String(text).split(","))
    .flatMap((p) => p.split("/"))
    .map((p) => p.trim())
    .filter(Boolean);

  const mapped = parts.map((part) => {
    const normalized = part.toLowerCase().replace(/\s+/g, "");

    const deviceAlias = deviceAliases[part.trim().toLowerCase()];

    if (normalized === "computer" || normalized === "pc" || deviceAlias === "computer") {
      return deviceTranslations.computer[language] ?? deviceTranslations.computer.en;
    }

    if (normalized === "android" || normalized === "androiddevice") {
      return deviceTranslations.android[language] ?? deviceTranslations.android.en;
    }

    if (normalized === "iphone" || normalized === "ios" || deviceAliases[part.trim().toLowerCase()] === "iphone") {
      return deviceTranslations.iphone[language] ?? deviceTranslations.iphone.en;
    }

    if (deviceAlias === "all_devices") {
      return allDevicesTranslations[language];
    }

    return part;
  });

  if (mapped.length === 0) return null;

  return mapped.join(language === "ar" ? "، " : ", ");
}

const verificationTranslations: Record<string, Record<LanguageCode, string>> = {
  verified: {
    ar: "موثّق",
    en: "Verified",
    es: "Verificado",
    fr: "Vérifié",
    de: "Verifiziert",
    pt: "Verificado",
    ja: "認証済み",
    zh: "已验证",
  },
  pending: {
    ar: "قيد التحقق",
    en: "Pending",
    es: "Pendiente",
    fr: "En attente",
    de: "Ausstehend",
    pt: "Pendente",
    ja: "確認待ち",
    zh: "待验证",
  },
  rejected: {
    ar: "مرفوض",
    en: "Rejected",
    es: "Rechazado",
    fr: "Rejeté",
    de: "Abgelehnt",
    pt: "Rejeitado",
    ja: "却下",
    zh: "已拒绝",
  },
};

export function localizeVerification(
  raw: unknown,
  language: LanguageCode = "en"
): string | null {
  const text = getLocalizedText(raw, language, "en");
  if (!text) return null;

  const key = String(text).trim().toLowerCase();
  return verificationTranslations[key]?.[language] ?? text;
}

export type Opportunity = {
  id: OpportunityId;
  created_at?: string | null;
  title: string;
  slug: string;
  short_description: string | null;
  description?: string | null;
  status?: OpportunityStatus;
  verification_status: string | null;
  earnings_text: string | null;
  countries: string[] | null;
  devices: string[] | null;
  payment_methods?: string[] | null;
  requirements?: string[] | null;
  source_url?: string | null;
  direct_url?: string | null;
  image_url?: string | null;
  category_id?: OpportunityId | null;
  category?: OpportunityCategory | OpportunityCategory[] | null;
};

export type OpportunityFilters = {
  query?: string;
  status?: OpportunityStatus;
};

export function normalizeOpportunityCategory(
  category: Opportunity["category"],
  language: LanguageCode = "en"
): OpportunityCategory | null {
  const normalized = Array.isArray(category) ? category[0] ?? null : category ?? null;

  if (!normalized) {
    return null;
  }

  const resolvedName = getLocalizedText(
    (normalized as Record<string, unknown>).name ?? normalized,
    language,
    "en"
  );

  return {
    ...(normalized as Record<string, unknown>),
    name: resolvedName ?? "Opportunity",
  } as OpportunityCategory;
}

export function normalizeOpportunitySourceUrl(
  value?: string | null
): string | null {
  if (!value || typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  try {
    const parsed = new URL(trimmed);
    const hostname = parsed.hostname.toLowerCase();

    if (!["http:", "https:"].includes(parsed.protocol)) {
      return null;
    }

    const isPlaceholderDomain =
      hostname === "example.com" ||
      hostname === "www.example.com" ||
      hostname === "example.org" ||
      hostname === "www.example.org" ||
      hostname === "localhost" ||
      hostname === "127.0.0.1";

    if (isPlaceholderDomain) {
      return null;
    }

    return parsed.toString();
  } catch {
    return null;
  }
}

export function getOpportunitySourceUrl(
  opportunity: Pick<Opportunity, "source_url" | "direct_url">
): string | null {
  return normalizeOpportunitySourceUrl(opportunity.source_url ?? opportunity.direct_url ?? null);
}

export function getOpportunityStartUrl(
  opportunity: Pick<Opportunity, "source_url" | "direct_url">
): string | null {
  return normalizeOpportunitySourceUrl(opportunity.direct_url) ?? getOpportunitySourceUrl(opportunity);
}
