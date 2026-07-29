import { randomBytes } from "crypto";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { InvalidTokenError, InvalidGrantError } from "@modelcontextprotocol/sdk/server/auth/errors.js";
import { TokenStore } from "./token-store.js";

function newKey(): Buffer {
  return randomBytes(32);
}

describe("TokenStore — TeamViewer grant custody", () => {
  it("round-trips an encrypted TV grant", () => {
    const store = new TokenStore(newKey());
    store.saveTvGrant("user-1", {
      accessToken: "tv-access-token",
      refreshToken: "tv-refresh-token",
      expiresAt: 12345,
      scope: "Computers.View",
    });

    const grant = store.getTvGrant("user-1");
    expect(grant).toEqual({
      accessToken: "tv-access-token",
      refreshToken: "tv-refresh-token",
      expiresAt: 12345,
      scope: "Computers.View",
    });
  });

  it("returns undefined for an unknown subject", () => {
    const store = new TokenStore(newKey());
    expect(store.getTvGrant("nobody")).toBeUndefined();
  });

  it("deleteTvGrant removes the grant", () => {
    const store = new TokenStore(newKey());
    store.saveTvGrant("user-1", { accessToken: "tv-access-token" });
    store.deleteTvGrant("user-1");
    expect(store.getTvGrant("user-1")).toBeUndefined();
  });

  it("two stores with different keys don't interfere with each other", () => {
    const store1 = new TokenStore(newKey());
    const store2 = new TokenStore(newKey());
    store1.saveTvGrant("user-1", { accessToken: "store1-token" });
    store2.saveTvGrant("user-1", { accessToken: "store2-token" });

    expect(store1.getTvGrant("user-1")?.accessToken).toBe("store1-token");
    expect(store2.getTvGrant("user-1")?.accessToken).toBe("store2-token");
  });
});

describe("TokenStore — MCP token issuance and verification", () => {
  let store: TokenStore;

  beforeEach(() => {
    store = new TokenStore(newKey());
  });

  it("issues distinct access and refresh tokens", () => {
    const issued = store.issueMcpTokens("user-1", ["Computers.View"], "https://mcp.example/mcp");
    expect(issued.accessToken).not.toBe(issued.refreshToken);
    expect(issued.expiresIn).toBeGreaterThan(0);
  });

  it("verifyMcpAccessToken returns the subject/aud/scopes for a valid token", () => {
    const issued = store.issueMcpTokens("user-1", ["Computers.View", "Contacts.View"], "https://mcp.example/mcp");
    const meta = store.verifyMcpAccessToken(issued.accessToken);
    expect(meta.subject).toBe("user-1");
    expect(meta.aud).toBe("https://mcp.example/mcp");
    expect(meta.scopes).toEqual(["Computers.View", "Contacts.View"]);
  });

  it("verifyMcpAccessToken throws InvalidTokenError for an unknown token", () => {
    expect(() => store.verifyMcpAccessToken("not-a-real-token")).toThrow(InvalidTokenError);
  });

  it("verifyMcpAccessToken throws InvalidTokenError for an expired token", () => {
    vi.useFakeTimers();
    try {
      const issued = store.issueMcpTokens("user-1", [], "https://mcp.example/mcp");
      vi.advanceTimersByTime(16 * 60 * 1000); // past the 15-minute access TTL
      expect(() => store.verifyMcpAccessToken(issued.accessToken)).toThrow(InvalidTokenError);
    } finally {
      vi.useRealTimers();
    }
  });

  it("subjectForToken returns the subject for a valid token, undefined otherwise", () => {
    const issued = store.issueMcpTokens("user-1", [], "https://mcp.example/mcp");
    expect(store.subjectForToken(issued.accessToken)).toBe("user-1");
    expect(store.subjectForToken("garbage")).toBeUndefined();
  });
});

describe("TokenStore — refresh rotation and reuse detection", () => {
  let store: TokenStore;

  beforeEach(() => {
    store = new TokenStore(newKey());
  });

  it("rotates to a fresh access/refresh pair on normal use", () => {
    const first = store.issueMcpTokens("user-1", ["Computers.View"], "https://mcp.example/mcp");
    const rotated = store.rotateMcpRefreshToken(first.refreshToken);

    expect(rotated.subject).toBe("user-1");
    expect(rotated.scopes).toEqual(["Computers.View"]);
    expect(rotated.accessToken).not.toBe(first.accessToken);
    expect(rotated.refreshToken).not.toBe(first.refreshToken);

    // The new access token is valid.
    expect(store.verifyMcpAccessToken(rotated.accessToken).subject).toBe("user-1");
  });

  it("throws InvalidGrantError for an unknown refresh token", () => {
    expect(() => store.rotateMcpRefreshToken("not-a-real-refresh-token")).toThrow(InvalidGrantError);
  });

  it("replaying a consumed refresh token revokes the whole chain", () => {
    const first = store.issueMcpTokens("user-1", [], "https://mcp.example/mcp");
    const rotated = store.rotateMcpRefreshToken(first.refreshToken);

    // Replay the already-used first refresh token.
    expect(() => store.rotateMcpRefreshToken(first.refreshToken)).toThrow(InvalidGrantError);

    // The access token minted by the (now-detected-as-compromised) rotation
    // must also be revoked — not just the refresh token itself.
    expect(() => store.verifyMcpAccessToken(rotated.accessToken)).toThrow(InvalidTokenError);
    // And the rotated refresh token can no longer be used either.
    expect(() => store.rotateMcpRefreshToken(rotated.refreshToken)).toThrow(InvalidGrantError);
  });

  it("throws InvalidGrantError for an expired refresh token", () => {
    vi.useFakeTimers();
    try {
      const issued = store.issueMcpTokens("user-1", [], "https://mcp.example/mcp");
      vi.advanceTimersByTime(8 * 24 * 60 * 60 * 1000); // past the 7-day refresh TTL
      expect(() => store.rotateMcpRefreshToken(issued.refreshToken)).toThrow(InvalidGrantError);
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("TokenStore — revocation", () => {
  it("revokeSubject removes the TV grant and every MCP token for that subject", () => {
    const store = new TokenStore(newKey());
    store.saveTvGrant("user-1", { accessToken: "tv-access-token" });
    const issued = store.issueMcpTokens("user-1", [], "https://mcp.example/mcp");

    store.revokeSubject("user-1");

    expect(store.getTvGrant("user-1")).toBeUndefined();
    expect(() => store.verifyMcpAccessToken(issued.accessToken)).toThrow(InvalidTokenError);
    expect(() => store.rotateMcpRefreshToken(issued.refreshToken)).toThrow(InvalidGrantError);
    expect(store.subjectForToken(issued.accessToken)).toBeUndefined();
  });

  it("revoking one subject doesn't affect another", () => {
    const store = new TokenStore(newKey());
    const a = store.issueMcpTokens("user-a", [], "https://mcp.example/mcp");
    const b = store.issueMcpTokens("user-b", [], "https://mcp.example/mcp");

    store.revokeSubject("user-a");

    expect(() => store.verifyMcpAccessToken(a.accessToken)).toThrow(InvalidTokenError);
    expect(store.verifyMcpAccessToken(b.accessToken).subject).toBe("user-b");
  });
});
