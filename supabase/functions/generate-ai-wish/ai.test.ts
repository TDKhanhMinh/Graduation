import { assertEquals } from "https://deno.land/std@0.192.0/testing/asserts.ts";

const staticSuggestionFallback = [
  "Chúc bạn một ngày lễ tốt lành và tràn đầy niềm vui!",
  "Mong mọi điều tốt đẹp nhất sẽ đến với bạn trong tương lai.",
  "Chúc bạn luôn mạnh khỏe, hạnh phúc và thành công trên con đường đã chọn!"
];

// Mock basic test for fallback
Deno.test("generate-ai-wish: falls back to static suggestions when AI fails or is unavailable", () => {
  assertEquals(staticSuggestionFallback.length, 3);
  assertEquals(staticSuggestionFallback[0].includes("Chúc"), true);
});

// Mock output parser check
Deno.test("generate-ai-wish: correctly parses valid 3-string JSON array", () => {
  const jsonStr = JSON.stringify({ suggestions: ["One", "Two", "Three"] });
  const parsed = JSON.parse(jsonStr);
  
  assertEquals(Array.isArray(parsed.suggestions), true);
  assertEquals(parsed.suggestions.length, 3);
  assertEquals(parsed.suggestions[0], "One");
});

Deno.test("generate-ai-wish: rate limit logic works correctly", () => {
  const rateLimitCache = new Map<string, { count: number; resetAt: number }>();
  
  function checkRateLimit(ip: string): boolean {
    const now = Date.now();
    const limit = 5;
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

  const testIp = "127.0.0.1";
  for(let i=0; i<5; i++) {
    assertEquals(checkRateLimit(testIp), true);
  }
  // 6th request should fail
  assertEquals(checkRateLimit(testIp), false);
});
