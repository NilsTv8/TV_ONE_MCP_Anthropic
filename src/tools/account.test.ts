import { describe, it, expect, vi } from "vitest";
import type { TeamViewerClient } from "../client.js";
import { handleAccountTool } from "./account.js";

function mockClient(): TeamViewerClient {
  return {
    get: vi.fn().mockResolvedValue({ ok: true }),
    post: vi.fn().mockResolvedValue({ ok: true }),
    put: vi.fn().mockResolvedValue({ ok: true }),
    patch: vi.fn().mockResolvedValue({ ok: true }),
    delete: vi.fn().mockResolvedValue({ ok: true }),
  } as unknown as TeamViewerClient;
}

describe("tv_account", () => {
  it("get calls GET /account", async () => {
    const client = mockClient();
    await handleAccountTool("tv_account", { action: "get" }, client);
    expect(client.get).toHaveBeenCalledWith("/account");
  });

  it("update calls PUT /account with the remaining fields", async () => {
    const client = mockClient();
    await handleAccountTool("tv_account", { action: "update", name: "New Name" }, client);
    expect(client.put).toHaveBeenCalledWith("/account", { name: "New Name" });
  });

  it("create calls POST /account with the remaining fields", async () => {
    const client = mockClient();
    await handleAccountTool("tv_account", { action: "create", email: "a@b.com", password: "pw", name: "A" }, client);
    expect(client.post).toHaveBeenCalledWith("/account", { email: "a@b.com", password: "pw", name: "A" });
  });

  it("get_tenant_ids calls GET /account/TenantIds", async () => {
    const client = mockClient();
    await handleAccountTool("tv_account", { action: "get_tenant_ids" }, client);
    expect(client.get).toHaveBeenCalledWith("/account/TenantIds");
  });

  it("throws for an unknown action", async () => {
    const client = mockClient();
    await expect(handleAccountTool("tv_account", { action: "delete_everything" }, client)).rejects.toThrow(
      "Unknown action for tv_account"
    );
  });
});
