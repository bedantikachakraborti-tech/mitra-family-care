// Server-only helper for talking to the Lovable AI Gateway.

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "openai/gpt-5.6-sol";

export class AiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export const SAFETY_RULES = `
You are Mitra, a warm and careful assistant that supports families and caregivers.

Hard rules you must never break:
- You assist people; you never replace their judgement. Phrase output as suggestions.
- Never assess or imply whether a caregiver is trustworthy, safe, honest or a risk.
- Never use or infer age, gender, caste, religion, ethnicity, nationality, marital status,
  disability or any other protected or sensitive characteristic when comparing caregivers.
- Never infer, name or suggest a medical diagnosis.
- Never invent medication names, dosages, frequencies or any medical instruction.
  Only repeat medication details exactly as the user wrote them.
- Never suggest monitoring or surveillance of a caregiver.
- When a task is not yet done, use neutral wording such as
  "hasn't been marked complete yet" — never imply neglect or blame.
`.trim();

const JSON_RULE = "Output valid JSON only, matching the requested shape. No markdown fences.";

export async function callAiJson<T>(params: {
  system: string;
  user: string;
}): Promise<T> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new AiError("AI is not configured yet.", 500);

  const response = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": apiKey,
    },
    body: JSON.stringify({
      model: MODEL,
      reasoning_effort: "none",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: `${SAFETY_RULES}\n${JSON_RULE}\n\n${params.system}` },
        { role: "user", content: params.user },
      ],
    }),
  });

  if (response.status === 429) {
    throw new AiError("Mitra's assistant is busy right now. Please try again in a moment.", 429);
  }
  if (response.status === 402) {
    throw new AiError("The AI workspace is out of credits. Please add credits to continue.", 402);
  }
  if (!response.ok) {
    const detail = await response.text();
    console.error("AI gateway error", response.status, detail);
    throw new AiError("The assistant couldn't respond just now. Please try again.", 500);
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = payload.choices?.[0]?.message?.content ?? "";
  return parseJson<T>(content);
}

export async function callAiText(params: { system: string; user: string }): Promise<string> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new AiError("AI is not configured yet.", 500);

  const response = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Lovable-API-Key": apiKey },
    body: JSON.stringify({
      model: MODEL,
      reasoning_effort: "none",
      messages: [
        { role: "system", content: `${SAFETY_RULES}\n\nReply in plain sentences. Do not output JSON or markdown.\n\n${params.system}` },
        { role: "user", content: params.user },
      ],
    }),
  });

  if (response.status === 429) {
    throw new AiError("Mitra's assistant is busy right now. Please try again in a moment.", 429);
  }
  if (response.status === 402) {
    throw new AiError("The AI workspace is out of credits. Please add credits to continue.", 402);
  }
  if (!response.ok) {
    const detail = await response.text();
    console.error("AI gateway error", response.status, detail);
    throw new AiError("The assistant couldn't respond just now. Please try again.", 500);
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  return payload.choices?.[0]?.message?.content?.trim() ?? "";
}

function parseJson<T>(raw: string): T {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start !== -1 && end > start) {
      return JSON.parse(cleaned.slice(start, end + 1)) as T;
    }
    console.error("Unparseable AI response", raw);
    throw new AiError("The assistant returned something unexpected. Please try again.", 500);
  }
}
