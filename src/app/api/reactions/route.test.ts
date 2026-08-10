import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const {
  rateLimit,
  toggleReaction,
  getReactionActor,
  getReactionTargetEventId,
  loggerRequest,
} = vi.hoisted(() => ({
  rateLimit: vi.fn(),
  toggleReaction: vi.fn(),
  getReactionActor: vi.fn(),
  getReactionTargetEventId: vi.fn(),
  loggerRequest: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/rate-limit", () => ({ rateLimit }));
vi.mock("@/features/reactions/actor", () => ({ getReactionActor }));
vi.mock("@/features/reactions/dal", () => ({
  getReactionTargetEventId,
  toggleReaction,
}));
vi.mock("@/lib/observability/logger", () => ({
  logger: { request: loggerRequest },
  createRequestContext: () => ({
    requestId: "request",
    correlationId: "request",
    startedAt: 0,
  }),
  requestDurationMs: () => 1,
}));

import { POST } from "./route";

describe("POST /api/reactions", () => {
  beforeEach(() => {
    vi.stubEnv("REACTION_SECRET_KEY", "reaction-route-secret-for-unit-tests");
    vi.stubEnv("NODE_ENV", "test");
    rateLimit.mockResolvedValue({ success: true });
    toggleReaction.mockResolvedValue(true);
    getReactionActor.mockResolvedValue({
      actorId: "user-1",
      actorKeyHash: null,
    });
    getReactionTargetEventId.mockResolvedValue("event-1");
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  it("rejects an invalid emoji before calling the reaction command", async () => {
    const response = await POST(
      new NextRequest("http://localhost/api/reactions", {
        method: "POST",
        body: JSON.stringify({ wishId: "wish-1", emoji: "❤" }),
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Yêu cầu phản ứng không hợp lệ.",
    });
    expect(rateLimit).not.toHaveBeenCalled();
    expect(toggleReaction).not.toHaveBeenCalled();
  });

  it("fails closed with a sanitized response when the server-only secret is absent", async () => {
    vi.unstubAllEnvs();
    vi.stubEnv("NODE_ENV", "production");

    const response = await POST(
      new NextRequest("http://localhost/api/reactions", {
        method: "POST",
        body: JSON.stringify({ wishId: "wish-1", emoji: "👍" }),
      }),
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: "Không thể xử lý phản ứng lúc này.",
    });
    expect(rateLimit).not.toHaveBeenCalled();
    expect(toggleReaction).not.toHaveBeenCalled();
  });

  it("uses an opaque durable scope before the reaction command", async () => {
    const response = await POST(
      new NextRequest("http://localhost/api/reactions", {
        method: "POST",
        headers: { "x-forwarded-for": "203.0.113.42" },
        body: JSON.stringify({ wishId: "wish-1", emoji: "\u{1F44D}" }),
      }),
    );

    expect(response.status).toBe(200);
    expect(rateLimit).toHaveBeenCalledWith(
      expect.stringMatching(/^[a-f0-9]{64}$/),
      10,
      60,
    );
    expect(rateLimit.mock.calls[0][0]).not.toContain("203.0.113.42");
    expect(toggleReaction).toHaveBeenCalledWith("wish-1", "\u{1F44D}", {
      actorId: "user-1",
      actorKeyHash: null,
    });
  });

  it("does not call the reaction command when the durable limit is exhausted", async () => {
    rateLimit.mockResolvedValue({ success: false, remaining: 0 });

    const response = await POST(
      new NextRequest("http://localhost/api/reactions", {
        method: "POST",
        body: JSON.stringify({ wishId: "wish-1", emoji: "\u{1F44D}" }),
      }),
    );

    expect(response.status).toBe(429);
    expect(toggleReaction).not.toHaveBeenCalled();
  });
});
