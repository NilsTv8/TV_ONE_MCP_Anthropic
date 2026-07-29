import { describe, it, expect } from "vitest";
import { handleRemoteControlTool } from "./remote-control.js";

describe("tv_connect_device", () => {
  it("returns a teamviewerapi:// deep link for a numeric ID", async () => {
    const result = await handleRemoteControlTool("tv_connect_device", { teamviewer_id: "123456789" });
    expect(result).toEqual({
      message: "Remote control link generated for device 123456789. Open this link on your machine to start the session.",
      url: "teamviewerapi://remotecontrol/?remotecontrolid=123456789&thirdpartyname=tv_claude",
    });
  });

  it("strips whitespace from a spaced-out numeric ID", async () => {
    const result = await handleRemoteControlTool("tv_connect_device", { teamviewer_id: "123 456 789" });
    expect(result).toMatchObject({ url: expect.stringContaining("remotecontrolid=123456789") });
  });

  it("rejects a non-numeric teamviewer_id", async () => {
    await expect(
      handleRemoteControlTool("tv_connect_device", { teamviewer_id: "not-a-number" })
    ).rejects.toThrow("teamviewer_id must be a numeric TeamViewer ID");
  });

  it("rejects an empty teamviewer_id", async () => {
    await expect(handleRemoteControlTool("tv_connect_device", { teamviewer_id: "" })).rejects.toThrow(
      "teamviewer_id must be a numeric TeamViewer ID"
    );
  });

  it("throws for an unknown tool name", async () => {
    await expect(handleRemoteControlTool("tv_something_else", {})).rejects.toThrow("Unknown remote control tool");
  });
});
