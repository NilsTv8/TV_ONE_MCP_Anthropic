import { describe, it, expect, vi } from "vitest";
import type { TeamViewerClient } from "../client.js";
import { handleUserTool } from "./users.js";

function mockClient(): TeamViewerClient {
  return {
    get: vi.fn().mockResolvedValue({ ok: true }),
    post: vi.fn().mockResolvedValue({ ok: true }),
    put: vi.fn().mockResolvedValue({ ok: true }),
    patch: vi.fn().mockResolvedValue({ ok: true }),
    delete: vi.fn().mockResolvedValue({ ok: true }),
  } as unknown as TeamViewerClient;
}

describe("tv_users (single-action tool)", () => {
  it("list calls GET /users with filters", async () => {
    const client = mockClient();
    await handleUserTool("tv_users", { action: "list", email: "a@b.com" }, client);
    expect(client.get).toHaveBeenCalledWith("/users", {
      email: "a@b.com",
      name: undefined,
      permissions: undefined,
      full_list: undefined,
    });
  });

  it("get calls GET /users/:user_id", async () => {
    const client = mockClient();
    await handleUserTool("tv_users", { action: "get", user_id: "u123" }, client);
    expect(client.get).toHaveBeenCalledWith("/users/u123");
  });

  it("delete calls DELETE /users/:user_id with isPermanentDelete", async () => {
    const client = mockClient();
    await handleUserTool("tv_users", { action: "delete", user_id: "u123", is_permanent_delete: true }, client);
    expect(client.delete).toHaveBeenCalledWith("/users/u123", undefined, { isPermanentDelete: true });
  });

  it("throws for an unknown action", async () => {
    const client = mockClient();
    await expect(handleUserTool("tv_users", { action: "nuke" }, client)).rejects.toThrow("Unknown action for tv_users");
  });
});

describe("tv_users (name-dispatched single-purpose tools in the same file)", () => {
  it("tv_deactivate_user_tfa calls DELETE /users/:user_id/tfa", async () => {
    const client = mockClient();
    await handleUserTool("tv_deactivate_user_tfa", { user_id: "u123" }, client);
    expect(client.delete).toHaveBeenCalledWith("/users/u123/tfa");
  });

  it("tv_get_user_effective_permissions calls GET /users/effectivepermissions", async () => {
    const client = mockClient();
    await handleUserTool("tv_get_user_effective_permissions", {}, client);
    expect(client.get).toHaveBeenCalledWith("/users/effectivepermissions");
  });

  it("tv_respond_to_join_company_request posts userId/approve", async () => {
    const client = mockClient();
    await handleUserTool("tv_respond_to_join_company_request", { user_id: "u123", approve: true }, client);
    expect(client.post).toHaveBeenCalledWith("/users/respondtojointocompanyrequest", { userId: "u123", approve: true });
  });
});
