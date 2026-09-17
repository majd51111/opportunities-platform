import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

const supportedLanguages = ["ar", "en", "es", "fr", "de", "pt", "ja", "zh"] as const;
const TRANSLATION_PROVIDER_TIMEOUT_MS = 45_000;
type SupportedLanguage = (typeof supportedLanguages)[number];

type TranslationInput = {
  title: string;
  shortDescription: string;
  description: string;
  earningsText: string | null;
  countries: string[];
  devices: string[];
  paymentMethods: string[];
  requirements: string[];
};

type TranslationOutput = Record<SupportedLanguage, TranslationInput>;

function isTranslationOutput(value: unknown): value is TranslationOutput {
  if (!value || typeof value !== "object") return false;
  return supportedLanguages.every((language) => {
    const item = (value as Record<string, unknown>)[language];
    if (!item || typeof item !== "object") return false;
    const record = item as Record<string, unknown>;
    return typeof record.title === "string"
      && typeof record.shortDescription === "string"
      && typeof record.description === "string"
      && (record.earningsText === null || typeof record.earningsText === "string")
      && Array.isArray(record.countries) && record.countries.every((item) => typeof item === "string")
      && Array.isArray(record.devices) && record.devices.every((item) => typeof item === "string")
      && Array.isArray(record.paymentMethods) && record.paymentMethods.every((item) => typeof item === "string")
      && Array.isArray(record.requirements) && record.requirements.every((item) => typeof item === "string");
  });
}

function parseTranslationJson(content: string): unknown {
  const cleaned = content
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start < 0 || end <= start) throw new Error("No JSON object in translation response");
    return JSON.parse(cleaned.slice(start, end + 1));
  }
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    },
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication is required." }, { status: 401 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "GEMINI_API_KEY is not configured." }, { status: 503 });
  }

  let input: TranslationInput;
  try {
    input = (await request.json()) as TranslationInput;
  } catch {
    return NextResponse.json({ error: "Invalid translation request." }, { status: 400 });
  }

  if (!input.title?.trim() || (!input.shortDescription?.trim() && !input.description?.trim())) {
    return NextResponse.json({ error: "Translation content is incomplete." }, { status: 400 });
  }

  const sourceDescription = input.description?.trim() || input.shortDescription.trim();

  const languageNames: Record<SupportedLanguage, string> = {
    ar: "Arabic",
    en: "English",
    es: "Spanish",
    fr: "French",
    de: "German",
    pt: "Portuguese",
    ja: "Japanese",
    zh: "Simplified Chinese",
  };

  const configuredModel = process.env.GEMINI_TRANSLATION_MODEL?.trim();
  const model = configuredModel && /^gemini-[a-z0-9.-]+$/i.test(configuredModel)
    ? configuredModel
    : "gemini-3-flash-preview";
  const providerController = new AbortController();
  const providerTimeout = setTimeout(() => providerController.abort(), TRANSLATION_PROVIDER_TIMEOUT_MS);
  let response: Response;

  try {
    response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      generationConfig: {
        temperature: 0.2,
        responseMimeType: "application/json",
      },
      contents: [
        {
          parts: [{
            text: [
              "Translate opportunity listing content naturally and accurately.",
              "Return only valid JSON with language keys and fields title, shortDescription, description, earningsText, countries, devices, paymentMethods, requirements.",
              "Preserve URLs, numbers, product names, and meaning. Use null for a missing earningsText.",
              JSON.stringify({
            targetLanguages: Object.fromEntries(supportedLanguages.map((language) => [language, languageNames[language]])),
            source: { ...input, description: sourceDescription },
              }),
            ].join("\n"),
          }],
        },
      ],
    }),
        signal: providerController.signal,
      },
    );
  } catch (providerError) {
    const message = providerError instanceof Error && providerError.name === "AbortError"
      ? "Translation provider timed out."
      : "Could not connect to the translation provider.";
    console.error("Gemini translation request failed", message);
    return NextResponse.json({ error: message }, { status: 504 });
  } finally {
    clearTimeout(providerTimeout);
  }

  if (!response.ok) {
    const providerPayload = await response.json().catch(() => null) as {
      error?: { message?: string; status?: string };
    } | null;
    const providerMessage = providerPayload?.error?.message ?? "Translation provider request failed.";
    const providerCode = providerPayload?.error?.status ? ` (${providerPayload.error.status})` : "";
    console.error("Gemini translation request failed", response.status, providerMessage);
    return NextResponse.json(
      { error: `Gemini رفض طلب الترجمة: ${providerMessage}${providerCode}` },
      { status: 502 },
    );
  }

  const payload = await response.json() as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const content = payload.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("").trim();
  if (!content) {
    return NextResponse.json({ error: "Translation provider returned no content." }, { status: 502 });
  }

  try {
    const translations: unknown = parseTranslationJson(content);
    if (!isTranslationOutput(translations)) throw new Error("Invalid translation shape");
    return NextResponse.json({ translations });
  } catch {
    return NextResponse.json({ error: "Translation provider returned invalid JSON." }, { status: 502 });
  }
}
