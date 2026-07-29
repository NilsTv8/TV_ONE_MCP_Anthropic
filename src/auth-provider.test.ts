import { createHash, randomBytes } from "crypto";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import type { OAuthClientInformationFull } from "@modelcontextprotocol/sdk/shared/auth.js";
import { InvalidGrantError, InvalidTargetError } from "@modelcontextprotocol/sdk/server/auth/errors.js";
import { TeamViewerOAuthProvider, UserFacingError } from "./auth-provider.js";
import { TokenStore } from "./token-store.js";

const ISSUER_URL = new URL("https://mcp.example");
const RESOURCE_URI = "https://mcp.example/mcp";
const CLIENT_REDIRECT_URI = "https://client.example/callback";

function pkcePair(): { verifier: string; challenge: string } {
  const verifier = randomBytes(32).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  return { verifier, challenge };
}

function jsonResponse(body: unknown, init: { status?: number; statusText?: string } = {}): Response {
  return new Response(JSON.stringify(body), {
    status: init.status ?? 200,
    statusText: init.statusText,
    headers: { "content-type": "application/json" },
  });
}

// authorize()/challengeForAuthorizationCode() don't use the client argument.
const UNUSED_CLIENT = {} as OAuthClientInformationFull;

function captureRedirect() {
  let location: string | undefined;
  const res = { redirect: (url: string) => { location = url; } };
  return { res, getLocation: () => location };
}

describe("TeamViewerOAuthProvider (DCR)", () => {
  let tokenStore: TokenStore;
  let provider: TeamViewerOAuthProvider;
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
    tokenStore = new TokenStore(randomBytes(32));
    provider = new TeamViewerOAuthProvider(
      "tv-client-id",
      "tv-client-secret",
      ISSUER_URL,
      RESOURCE_URI,
      tokenStore
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("clientsStore (Dynamic Client Registration)", () => {
    it("registerClient issues a client_id that getClient can then retrieve", async () => {
      const registered = await provider.clientsStore.registerClient({
        redirect_uris: [CLIENT_REDIRECT_URI],
      } as OAuthClientInformationFull);

      expect(registered.client_id).toBeTruthy();
      const fetched = await provider.clientsStore.getClient(registered.client_id);
      expect(fetched?.redirect_uris).toEqual([CLIENT_REDIRECT_URI]);
    });

    it("getClient returns undefined for an unregistered client_id", async () => {
      await expect(provider.clientsStore.getClient("never-registered")).resolves.toBeUndefined();
    });
  });

  describe("authorize()", () => {
    it("redirects to TeamViewer's authorize endpoint", async () => {
      const { codeChallenge } = { codeChallenge: pkcePair().challenge };
      const { res, getLocation } = captureRedirect();

      await provider.authorize(UNUSED_CLIENT, {
        redirectUri: CLIENT_REDIRECT_URI,
        codeChallenge,
        state: "test-state",
      }, res);

      const location = getLocation();
      expect(location).toBeDefined();
      expect(location).toContain("account.teamviewer.com/oauth2/authorize");
      expect(location).toContain("client_id=tv-client-id");
      expect(location).toContain("state=test-state");
    });

    it("rejects a resource that doesn't match this server's resource URI", async () => {
      const { res } = captureRedirect();
      await expect(
        provider.authorize(UNUSED_CLIENT, {
          redirectUri: CLIENT_REDIRECT_URI,
          codeChallenge: pkcePair().challenge,
          resource: new URL("https://not-this-server.example"),
        }, res)
      ).rejects.toThrow(InvalidTargetError);
    });
  });

  describe("full authorization-code flow", () => {
    async function runToAuthCode(state: string, codeChallenge: string) {
      const { res, getLocation } = captureRedirect();
      await provider.authorize(UNUSED_CLIENT, { redirectUri: CLIENT_REDIRECT_URI, codeChallenge, state }, res);
      expect(getLocation()).toBeDefined();

      fetchMock
        .mockResolvedValueOnce(jsonResponse({ access_token: "tv-access", refresh_token: "tv-refresh", expires_in: 3600, scope: "Computers.View" }))
        .mockResolvedValueOnce(jsonResponse({ userid: "user-123" }));

      const redirectUrl = await provider.handleCallback("tv-auth-code", state);
      const code = new URL(redirectUrl).searchParams.get("code");
      expect(code).toBeTruthy();
      return code!;
    }

    it("issues MCP tokens after a valid PKCE exchange, never the raw TV tokens", async () => {
      const { verifier, challenge } = pkcePair();
      const code = await runToAuthCode("state-1", challenge);

      const tokens = await provider.exchangeAuthorizationCode(UNUSED_CLIENT, code, verifier);

      expect(tokens.access_token).toBeTruthy();
      expect(tokens.access_token).not.toBe("tv-access");
      expect(tokens.refresh_token).not.toBe("tv-refresh");
      expect(tokens.scope).toBe("Computers.View");

      const authInfo = await provider.verifyAccessToken(tokens.access_token);
      expect(authInfo.extra?.subject).toBe("user-123");
      expect(authInfo.scopes).toEqual(["Computers.View"]);
    });

    it("rejects the wrong code_verifier", async () => {
      const { challenge } = pkcePair();
      const code = await runToAuthCode("state-2", challenge);

      await expect(
        provider.exchangeAuthorizationCode(UNUSED_CLIENT, code, "wrong-verifier")
      ).rejects.toThrow(InvalidGrantError);
    });

    it("rejects a resource mismatch at exchange time", async () => {
      const { verifier, challenge } = pkcePair();
      const code = await runToAuthCode("state-3", challenge);

      await expect(
        provider.exchangeAuthorizationCode(UNUSED_CLIENT, code, verifier, undefined, new URL("https://not-this-server.example"))
      ).rejects.toThrow(InvalidTargetError);
    });

    it("rotates refresh tokens and detects reuse", async () => {
      const { verifier, challenge } = pkcePair();
      const code = await runToAuthCode("state-4", challenge);
      const tokens = await provider.exchangeAuthorizationCode(UNUSED_CLIENT, code, verifier);

      const rotated = await provider.exchangeRefreshToken(UNUSED_CLIENT, tokens.refresh_token!);
      expect(rotated.access_token).not.toBe(tokens.access_token);

      // Replaying the original (already-rotated) refresh token must fail.
      await expect(
        provider.exchangeRefreshToken(UNUSED_CLIENT, tokens.refresh_token!)
      ).rejects.toThrow(InvalidGrantError);
    });
  });

  describe("handleCallback() error handling", () => {
    it("throws a 400 UserFacingError for an invalid/expired state", async () => {
      await expect(provider.handleCallback("some-code", "never-issued-state")).rejects.toMatchObject({
        status: 400,
      });
      await expect(provider.handleCallback("some-code", "never-issued-state")).rejects.toBeInstanceOf(UserFacingError);
    });

    it("throws a 502 UserFacingError when the TV token exchange fails", async () => {
      const { res, getLocation } = captureRedirect();
      await provider.authorize(UNUSED_CLIENT, {
        redirectUri: CLIENT_REDIRECT_URI,
        codeChallenge: pkcePair().challenge,
        state: "state-tv-fail",
      }, res);
      expect(getLocation()).toBeDefined();

      fetchMock.mockResolvedValueOnce(new Response("upstream failure detail", { status: 500, statusText: "Internal Server Error" }));

      await expect(provider.handleCallback("tv-auth-code", "state-tv-fail")).rejects.toMatchObject({ status: 502 });
    });

    it("throws a 502 UserFacingError when the account lookup fails", async () => {
      const { res, getLocation } = captureRedirect();
      await provider.authorize(UNUSED_CLIENT, {
        redirectUri: CLIENT_REDIRECT_URI,
        codeChallenge: pkcePair().challenge,
        state: "state-account-fail",
      }, res);
      expect(getLocation()).toBeDefined();

      fetchMock
        .mockResolvedValueOnce(jsonResponse({ access_token: "tv-access", expires_in: 3600 }))
        .mockResolvedValueOnce(new Response("account lookup failed", { status: 401, statusText: "Unauthorized" }));

      await expect(provider.handleCallback("tv-auth-code", "state-account-fail")).rejects.toMatchObject({ status: 502 });
    });
  });
});
