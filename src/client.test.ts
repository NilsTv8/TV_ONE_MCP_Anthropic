import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { TeamViewerClient } from "./client.js";

function jsonResponse(body: unknown, init: { status?: number; statusText?: string } = {}): Response {
  return new Response(JSON.stringify(body), {
    status: init.status ?? 200,
    statusText: init.statusText,
    headers: { "content-type": "application/json" },
  });
}

describe("TeamViewerClient", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("parses a successful JSON GET response", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ hello: "world" }));
    const client = new TeamViewerClient("tv-token");

    const result = await client.get<{ hello: string }>("/account");

    expect(result).toEqual({ hello: "world" });
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe("https://webapi.teamviewer.com/api/v1/account");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer tv-token");
  });

  it("returns {} for a 204 response", async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }));
    const client = new TeamViewerClient("tv-token");
    await expect(client.delete("/contacts/1")).resolves.toEqual({});
  });

  it("returns {} for a non-JSON content-type", async () => {
    fetchMock.mockResolvedValueOnce(new Response("plain text", { status: 200, headers: { "content-type": "text/plain" } }));
    const client = new TeamViewerClient("tv-token");
    await expect(client.get("/whatever")).resolves.toEqual({});
  });

  it("serializes query params, omitting undefined values", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({}));
    const client = new TeamViewerClient("tv-token");

    await client.get("/contacts", { online_state: "Online", groupid: undefined });

    const [url] = fetchMock.mock.calls[0];
    const parsed = new URL(String(url));
    expect(parsed.searchParams.get("online_state")).toBe("Online");
    expect(parsed.searchParams.has("groupid")).toBe(false);
  });

  it("never forwards the raw upstream error body in the thrown message (prompt-injection guard)", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response('{"error":"SECRET_UPSTREAM_BODY_MARKER"}', {
        status: 404,
        statusText: "Not Found",
      })
    );
    const client = new TeamViewerClient("tv-token");

    let caught: unknown;
    try {
      await client.get("/devices/does-not-exist");
    } catch (err) {
      caught = err;
    }

    // Exact equality, not just .toContain — the message must be *bounded* to
    // status/statusText, not merely "contain" that text with the leaked body
    // appended after it.
    expect(caught).toBeInstanceOf(Error);
    expect((caught as Error).message).toBe("TeamViewer API error: 404 Not Found");
    expect((caught as Error).message).not.toContain("SECRET_UPSTREAM_BODY_MARKER");
  });

  it("retries once on 401 using the refreshFn's new token", async () => {
    fetchMock
      .mockResolvedValueOnce(new Response(null, { status: 401, statusText: "Unauthorized" }))
      .mockResolvedValueOnce(jsonResponse({ ok: true }));
    const refreshFn = vi.fn().mockResolvedValue("fresh-token");
    const client = new TeamViewerClient("stale-token", refreshFn);

    const result = await client.get<{ ok: boolean }>("/account");

    expect(result).toEqual({ ok: true });
    expect(refreshFn).toHaveBeenCalledTimes(1);
    const secondCallInit = fetchMock.mock.calls[1][1];
    expect((secondCallInit.headers as Record<string, string>).Authorization).toBe("Bearer fresh-token");
  });

  it("propagates a 401 as a normal error when there is no refreshFn", async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 401, statusText: "Unauthorized" }));
    const client = new TeamViewerClient("stale-token");

    await expect(client.get("/account")).rejects.toThrow("TeamViewer API error: 401 Unauthorized");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("createPermanentToken posts to the OAuth2 access-token endpoint", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ AccessToken: "permanent-token-value" }));
    const client = new TeamViewerClient("tv-token");

    const result = await client.createPermanentToken("my-token", "Computers.View");

    expect(result).toEqual({ AccessToken: "permanent-token-value" });
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe("https://webapi.teamviewer.com/api/v1/OAuth2/accessToken");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({ name: "my-token", scope: "Computers.View" });
  });
});
