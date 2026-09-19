import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

const IMPORT_PROVIDER_TIMEOUT_MS = 45_000;
const supportedImportLanguages = ["ar", "en", "es", "fr", "de", "pt", "ja", "zh"] as const;
type ImportLanguage = (typeof supportedImportLanguages)[number];

const importLanguageNames: Record<ImportLanguage, string> = {
  ar: "Arabic",
  en: "English",
  es: "Spanish",
  fr: "French",
  de: "German",
  pt: "Portuguese",
  ja: "Japanese",
  zh: "Chinese",
};

type ImportedOpportunityData = {
  title: string;
  shortDescription?: string | null;
  description: string;
  directUrl: string;
  category?: string | null;
  countries?: string[] | null;
  devices?: string[] | null;
  paymentMethods?: string[] | null;
  requirements?: string[] | null;
  earningsText?: string | null;
  status: "pending" | "rejected";
  reason?: string;
};

function sanitizeUrl(input: string): string | null {
  try {
    const url = new URL(input);
    if (!['http:', 'https:'].includes(url.protocol)) return null;
    return url.toString();
  } catch {
    return null;
  }
}

function normalizeOpportunityUrl(input: string): string {
  const parsed = new URL(input);
  parsed.hostname = parsed.hostname.toLowerCase().replace(/^www\./, "");
  parsed.hash = "";
  parsed.search = "";
  parsed.pathname = parsed.pathname.replace(/\/+$/, "") || "/";
  return parsed.toString().replace(/\/$/, "");
}

function normalizeSimilarityText(value: unknown): string {
  return typeof value === "string"
    ? value.toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").replace(/\s+/g, " ").trim()
    : "";
}

function textSimilarity(left: unknown, right: unknown): number {
  const leftTokens = new Set(normalizeSimilarityText(left).split(" ").filter(Boolean));
  const rightTokens = new Set(normalizeSimilarityText(right).split(" ").filter(Boolean));
  if (leftTokens.size === 0 || rightTokens.size === 0) return 0;

  const intersection = [...leftTokens].filter((token) => rightTokens.has(token)).length;
  return intersection / new Set([...leftTokens, ...rightTokens]).size;
}

function listSimilarity(left: unknown, right: unknown): number {
  const leftText = Array.isArray(left) ? left.join(" ") : left;
  const rightText = Array.isArray(right) ? right.join(" ") : right;
  return textSimilarity(leftText, rightText);
}

function containsOpportunityText(pageText: string, value: unknown, minimumCoverage: number): boolean {
  const pageTokens = new Set(normalizeSimilarityText(pageText).split(" ").filter(Boolean));
  const valueTokens = new Set(normalizeSimilarityText(value).split(" ").filter(Boolean));
  if (pageTokens.size === 0 || valueTokens.size === 0) return false;

  const matchedTokens = [...valueTokens].filter((token) => pageTokens.has(token)).length;
  return matchedTokens / valueTokens.size >= minimumCoverage;
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, " & ")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchPageText(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; opportunities-platform/1.0)",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
    redirect: "follow",
  });

  if (!response.ok) {
    throw new Error(`Page fetch failed with status ${response.status}`);
  }

  const html = await response.text();
  return stripHtml(html);
}

function parseJsonObject(content: string): unknown {
  const cleaned = content
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start < 0 || end <= start) throw new Error("No JSON object in AI response");
    return JSON.parse(cleaned.slice(start, end + 1));
  }
}

function normalizeList(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;
  const normalized = value
    .map((item) => typeof item === "string" ? item.trim() : "")
    .filter(Boolean);
  return normalized.length > 0 ? normalized : null;
}

function normalizeString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed || null;
}

function isValidImportedOpportunity(value: unknown): value is ImportedOpportunityData {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  const title = normalizeString(record.title);
  const description = normalizeString(record.description);
  const directUrl = normalizeString(record.directUrl);
  const category = normalizeString(record.category);

  if (!title || !description || !directUrl || !category) return false;

  return true;
}

function buildImportRejectionMessage(missing: string[]): string {
  if (missing.length === 0) {
    return "تعذر قبول الرابط لأن الصفحة لا تحتوي على بيانات كافية.";
  }

  return `تعذر قبول الرابط لأن بعض الحقول الأساسية مفقودة: ${missing.join("، ")}. يرجى التحقق من أن الصفحة تحتوي على عنوان الفرصة والتصنيف ورابط واضح.`;
}

function normalizeForMatch(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

function inferCategoryFromText(pageText: string, categoryNames: string[]): string | null {
  const normalizedPageText = normalizeForMatch(pageText);
  if (!normalizedPageText) return null;

  const candidates = categoryNames
    .map((categoryName) => {
      const normalizedCategory = normalizeForMatch(categoryName);
      if (!normalizedCategory) return null;
      const exactScore = normalizedPageText.includes(normalizedCategory) ? 4 : 0;
      const partialScore = normalizedCategory.split(" ").filter(Boolean).every((token) => normalizedPageText.includes(token)) ? 2 : 0;
      return { categoryName, score: exactScore + partialScore };
    })
    .filter((entry): entry is { categoryName: string; score: number } => entry !== null && entry.score > 0)
    .sort((left, right) => right.score - left.score);

  return candidates[0]?.categoryName ?? null;
}

export async function POST(request: Request) {
  const requestBody = await request.json().catch(() => null) as { url?: string; language?: string } | null;
  const rawUrl = requestBody?.url?.trim();
  const requestedLanguage = supportedImportLanguages.includes(requestBody?.language as ImportLanguage)
    ? requestBody?.language as ImportLanguage
    : "en";

  if (!rawUrl) {
    return NextResponse.json({ error: "A source URL is required." }, { status: 400 });
  }

  const directUrl = sanitizeUrl(rawUrl);
  if (!directUrl) {
    return NextResponse.json({ error: "The URL must use http or https." }, { status: 400 });
  }

  let pageText: string;
  try {
    pageText = await fetchPageText(directUrl);
  } catch (error) {
    console.error("Opportunity import page fetch failed", error);
    return NextResponse.json({ error: "The source page could not be reached." }, { status: 400 });
  }

  if (!pageText || pageText.length < 80) {
    return NextResponse.json({ error: "The page does not provide enough text to analyze." }, { status: 422 });
  }

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

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return NextResponse.json({ error: "Authentication is required." }, { status: 401 });
  }

  const { data: existingSourceOpportunities } = await supabase
    .from("opportunities")
    .select("id, title, description, direct_url, status")
    .in("status", ["pending", "published"])
    .not("direct_url", "is", null);
  const normalizedSourceUrl = normalizeOpportunityUrl(directUrl);
  const sourceDuplicate = (existingSourceOpportunities ?? []).find((opportunity) => {
    if (!opportunity.direct_url) return false;
    try {
      if (normalizeOpportunityUrl(opportunity.direct_url) !== normalizedSourceUrl) return false;
    } catch {
      return false;
    }

    return containsOpportunityText(pageText, opportunity.title, 0.85)
      && containsOpportunityText(pageText, opportunity.description, 0.7);
  });

  if (sourceDuplicate) {
    return NextResponse.json({
      accepted: false,
      status: "rejected",
      reasonCode: "duplicate",
      message: "This opportunity already exists in the review queue or has already been published.",
    }, { status: 409 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "AI import is not configured on the server." }, { status: 503 });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), IMPORT_PROVIDER_TIMEOUT_MS);

  let providerResponse: Response;
  try {
    providerResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(process.env.GEMINI_IMPORT_MODEL?.trim() || "gemini-flash-lite-latest")}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 2000,
            responseMimeType: "application/json",
          },
          contents: [{
            parts: [{
              text: [
                "Analyze the source page and extract a likely opportunity listing for this website.",
                "Return valid JSON only. Use keys: title, shortDescription, description, directUrl, category, countries, devices, paymentMethods, requirements, earningsText, status, reason.",
                "If the page is not a real opportunity listing or the needed fields are missing, set status to 'rejected' and provide a brief reason.",
                "If it looks like a real opportunity, set status to 'pending' and fill only the fields you can infer accurately.",
                "Do not invent facts. Keep text natural and concise.",
                `Write title, shortDescription, description, earningsText, countries, devices, paymentMethods, requirements, and reason in ${importLanguageNames[requestedLanguage]} (${requestedLanguage}).`,
                "Keep directUrl unchanged. Use the website's category wording when possible; the user will select the matching platform category.",
                "Use the exact directUrl value as the opportunity URL.",
                "Return arrays as JSON arrays, including null values only for earningsText or shortDescription.",
                `SOURCE_PAGE_TEXT: ${pageText.slice(0, 12000)}`,
              ].join("\n"),
            }],
          }],
        }),
        signal: controller.signal,
      },
    );
  } catch (error) {
    clearTimeout(timeout);
    const message = error instanceof Error && error.name === "AbortError"
      ? "AI analysis timed out."
      : "Could not connect to the AI provider.";
    return NextResponse.json({ error: message }, { status: 504 });
  } finally {
    clearTimeout(timeout);
  }

  if (!providerResponse.ok) {
    const errorPayload = await providerResponse.json().catch(() => null) as { error?: { message?: string; status?: string } } | null;
    const message = errorPayload?.error?.message ?? "AI analysis request failed.";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  const providerPayload = await providerResponse.json() as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };

  const rawContent = providerPayload.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("").trim();
  if (!rawContent) {
    return NextResponse.json({ error: "AI returned no analysis for the source page." }, { status: 502 });
  }

  let parsed: unknown;
  try {
    parsed = parseJsonObject(rawContent);
  } catch (error) {
    console.error("Invalid AI import payload", error);
    return NextResponse.json({ error: "AI returned invalid JSON for the source page." }, { status: 502 });
  }

  if (!parsed || typeof parsed !== "object") {
    return NextResponse.json({ error: "AI analysis did not return a valid object." }, { status: 502 });
  }

  const record = parsed as Record<string, unknown>;
  const status = record.status === "pending" ? "pending" : "rejected";

  if (status === "rejected") {
    return NextResponse.json({
      accepted: false,
      status: "rejected",
      message: normalizeString(record.reason) ?? "لم يتم العثور على بيانات كافية في الصفحة لتأكيد الفرصة.",
    }, { status: 422 });
  }

  const fallbackDescription = pageText.slice(0, 400).trim() || "Opportunity details were extracted automatically from the source page.";

  const candidate: ImportedOpportunityData = {
    title: normalizeString(record.title) ?? "Untitled opportunity",
    shortDescription: normalizeString(record.shortDescription),
    description: normalizeString(record.description) ?? fallbackDescription,
    directUrl: sanitizeUrl(normalizeString(record.directUrl) ?? directUrl) ?? directUrl,
    category: normalizeString(record.category),
    countries: normalizeList(record.countries),
    devices: normalizeList(record.devices),
    paymentMethods: normalizeList(record.paymentMethods),
    requirements: normalizeList(record.requirements),
    earningsText: normalizeString(record.earningsText),
    status: "pending",
  };

  if (!candidate.category) {
    const { data: categoryRows } = await supabase
      .from("categories")
      .select("name")
      .limit(200);

    const categoryNames = (categoryRows ?? []).map((row) => String(row.name ?? "")).filter(Boolean);
    candidate.category = inferCategoryFromText(pageText, categoryNames) ?? null;
  }

  const missingFields = [
    !candidate.title ? "عنوان الفرصة" : null,
    !candidate.directUrl ? "رابط الفرصة" : null,
    !candidate.category ? "التصنيف" : null,
    !candidate.description ? "تفاصيل الفرصة" : null,
  ].filter(Boolean) as string[];

  if (missingFields.length > 0) {
    return NextResponse.json({
      accepted: false,
      status: "rejected",
      message: buildImportRejectionMessage(missingFields),
    }, { status: 422 });
  }

  if (!isValidImportedOpportunity(candidate)) {
    return NextResponse.json({
      accepted: false,
      status: "rejected",
      message: "الصفحة لا تحتوي على بيانات كافية لإرسال فرصة للمراجعة البشرية.",
    }, { status: 422 });
  }

  const { data: existingOpportunities } = await supabase
    .from("opportunities")
    .select("id, title, description, direct_url, earnings_text, countries, devices, payment_methods, requirements, status")
    .in("status", ["pending", "published"]);
  const normalizedCandidateUrl = normalizeOpportunityUrl(candidate.directUrl);
  const duplicate = (existingOpportunities ?? []).find((opportunity) => {
    const titleSimilarity = textSimilarity(candidate.title, opportunity.title);
    const descriptionSimilarity = textSimilarity(candidate.description, opportunity.description);
    if (titleSimilarity < 0.8 || descriptionSimilarity < 0.65) return false;

    let sameUrl = false;
    if (opportunity.direct_url) {
      try {
        sameUrl = normalizeOpportunityUrl(opportunity.direct_url) === normalizedCandidateUrl;
      } catch {
        sameUrl = false;
      }
    }

    const metadataSimilarities = [
      textSimilarity(candidate.earningsText, opportunity.earnings_text),
      listSimilarity(candidate.countries, opportunity.countries),
      listSimilarity(candidate.devices, opportunity.devices),
      listSimilarity(candidate.paymentMethods, opportunity.payment_methods),
      listSimilarity(candidate.requirements, opportunity.requirements),
    ].filter((similarity) => similarity >= 0.65).length;

    return sameUrl || metadataSimilarities >= 2;
  });

  if (duplicate) {
    return NextResponse.json({
      accepted: false,
      status: "rejected",
      reasonCode: "duplicate",
      message: "This opportunity is too similar to an opportunity already pending review or published.",
    }, { status: 409 });
  }

  return NextResponse.json({
    accepted: true,
    status: "pending",
    message: "تم تحليل الرابط. راجع البيانات ثم أرسل النموذج لإضافتها إلى قائمة المراجعة البشرية.",
    preview: {
      title: candidate.title,
      description: candidate.description,
      directUrl: candidate.directUrl,
      category: candidate.category ?? "",
      countries: candidate.countries ?? [],
      devices: candidate.devices ?? [],
      paymentMethods: candidate.paymentMethods ?? [],
      requirements: candidate.requirements ?? [],
      earnings: candidate.earningsText ?? "",
    },
  });
}
