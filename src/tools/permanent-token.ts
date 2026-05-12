import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { TeamViewerClient } from "../client.js";

export const permanentTokenTools: Tool[] = [
  {
    name: "tv_oauth_create_permanent_token",
    description:
      "Creates a permanent (non-expiring) access token for the authenticated TeamViewer account. " +
      "The returned token can be stored as TEAMVIEWER_API_TOKEN for use without OAuth.",
    inputSchema: {
      type: "object",
      required: ["name"],
      properties: {
        name: {
          type: "string",
          description: "Token name (5–20 characters)",
        },
        scope: {
          type: "string",
          description: "Comma-separated list of scopes for the permanent token (optional)",
        },
      },
    },
  },
  {
    name: "tv_oauth_delete_permanent_token",
    description: "Deletes the permanent access token associated with the current session.",
    inputSchema: { type: "object", properties: {} },
  },
];

export async function handlePermanentTokenTool(
  name: string,
  args: Record<string, unknown>,
  client: TeamViewerClient
): Promise<unknown> {
  switch (name) {
    case "tv_oauth_create_permanent_token": {
      const tokenName = args.name as string;
      const scope = args.scope as string | undefined;
      const result = await client.createPermanentToken(tokenName, scope);
      return {
        message: "Permanent access token created. Store it securely — it will not be shown again.",
        access_token: result.AccessToken,
      };
    }

    case "tv_oauth_delete_permanent_token": {
      await client.deletePermanentToken();
      return { message: "Permanent access token deleted." };
    }

    default:
      throw new Error(`Unknown permanent token tool: ${name}`);
  }
}
