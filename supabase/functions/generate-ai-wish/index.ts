import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "npm:openai";
import { corsHeaders } from "../_shared/cors.ts";
import { handleApiError, createError } from "../_shared/error.ts";
import { getClientIp } from "../_shared/security.ts";
import { logger, createRequestContext, requestDurationMs } from "../_shared/logger.ts";


const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY || "dummy", // Fallback to prevent crash on init if missing
});

interface GenerateAiWishRequest {
  event_id: string;
  prompt?: string;
  sender_name?: string;
  relationship?: string;
}

const rateLimitCache = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const limit = 5; // 5 requests per minute
  const windowMs = 60 * 1000;

  const record = rateLimitCache.get(ip);
  if (!record || record.resetAt < now) {
    rateLimitCache.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (record.count >= limit) {
    return false;
  }

  record.count += 1;
  return true;
}

const staticSuggestionFallback = [
  "Chúc bạn một ngày lễ tốt lành và tràn đầy niềm vui!",
  "Mong mọi điều tốt đẹp nhất sẽ đến với bạn trong tương lai.",
  "Chúc bạn luôn mạnh khỏe, hạnh phúc và thành công trên con đường đã chọn!"
];

async function generateAiWish(req: Request) {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const reqContext = createRequestContext(req);

  try {
    const ip = getClientIp(req);
    if (!checkRateLimit(ip)) {
      throw createError("RATE_LIMITED", "Too many requests. Please try again later.");
    }

    const { event_id, prompt, sender_name, relationship } = await req.json() as GenerateAiWishRequest;

    if (!event_id) {
      throw createError("BAD_REQUEST", "event_id is required");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("allow_ai")
      .eq("id", event_id)
      .single();

    if (eventError || !event) {
      throw createError("NOT_FOUND", "Event not found");
    }

    if (!event.allow_ai) {
      throw createError("FORBIDDEN", "AI generation is not allowed for this event");
    }

    if (!OPENAI_API_KEY) {
      // Return fallback if no key
      return new Response(
        JSON.stringify({ suggestions: staticSuggestionFallback }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let userPrompt = "Hãy viết 3 lời chúc. ";
    if (prompt) userPrompt += `Chủ đề hoặc ý chính: "${prompt}". `;
    if (sender_name) userPrompt += `Người gửi là: "${sender_name}". `;
    if (relationship) userPrompt += `Mối quan hệ với người nhận: "${relationship}". `;
    userPrompt += "Yêu cầu: Viết đúng 3 lời chúc tiếng Việt, mỗi lời chúc tối đa 80 từ. Không giải thích thêm. Format JSON: { \"suggestions\": [\"lời chúc 1\", \"lời chúc 2\", \"lời chúc 3\"] }";

      // Call OpenAI with timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000); // 8 seconds timeout
    const apiStart = Date.now();

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "Bạn là một trợ lý viết lời chúc chuyên nghiệp. Bạn chỉ được phép trả về duy nhất một object JSON chứa thuộc tính 'suggestions' là mảng gồm đúng 3 chuỗi. Không thêm bất kỳ text nào bên ngoài JSON."
          },
          {
            role: "user",
            content: userPrompt
          }
        ],
        temperature: 0.7,
        max_tokens: 400,
        response_format: { type: "json_object" }
      }, { signal: controller.signal });

      clearTimeout(timeout);
      const apiDuration = Date.now() - apiStart;

      const content = response.choices[0].message.content;
      if (!content) throw new Error("Empty response");

      const parsed = JSON.parse(content);
      if (!parsed.suggestions || !Array.isArray(parsed.suggestions) || parsed.suggestions.length !== 3) {
        throw new Error("Invalid output format");
      }
      
      logger.request("generate-ai-wish success", {
        ...reqContext,
        surface: "function",
        function: "generate-ai-wish",
        resultCode: 200,
        durationMs: requestDurationMs(reqContext),
        latency: apiDuration,
      });

      // Validated output
      return new Response(
        JSON.stringify({ suggestions: parsed.suggestions }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (err: unknown) {
      clearTimeout(timeout);
      const apiDuration = Date.now() - apiStart;
      logger.error("generate-ai-wish OpenAI fallback", err, {
        ...reqContext,
        latency: apiDuration,
        surface: "function",
        function: "generate-ai-wish",
      });
      // Fallback
      return new Response(
        JSON.stringify({ suggestions: staticSuggestionFallback, fallback: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (err: unknown) {
    logger.error("generate-ai-wish error", err, { ...reqContext, surface: "function", function: "generate-ai-wish" });
    return handleApiError(err, reqContext.requestId);
  }
}

serve(generateAiWish);
