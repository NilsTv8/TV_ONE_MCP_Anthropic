# TeamViewer MCP Server (DCR)

A [Model Context Protocol (MCP)](https://modelcontextprotocol.io) server that exposes the [TeamViewer Web API](https://webapi.teamviewer.com/api/v1/docs) as tools for AI assistants — Claude.ai and any other MCP client that supports Dynamic Client Registration (RFC 7591).

The server is an OAuth 2.0 **authorization server + resource server** that brokers access to TeamViewer. It never hands MCP clients a real TeamViewer token: it issues its own opaque, audience-bound tokens, holds TeamViewer credentials encrypted server-side, and resolves a live TeamViewer token internally on every tool call.

```
MCP client (Claude.ai)
    ↕ OAuth via /authorize, /token (this server)
MCP server (this repo)
    ↕ OAuth via account.teamviewer.com + webapi.teamviewer.com
TeamViewer
```

---

## Two deployment variants

This project ships as two parallel repos, because the target MCP clients speak OAuth client registration differently:

| Variant | Repo | Use for |
|---|---|---|
| **DCR (this repo)** | `NilsTv8/TV_ONE_MCP_Anthropic` | Clients that support Dynamic Client Registration (e.g. Claude.ai connectors) |
| **No-DCR** | `NilsTv8/TV_ONE_MCP_Anthropic_noDCR` | Clients that don't (e.g. Microsoft Copilot Studio / Power Platform) — accepts any `client_id`, validates `redirect_uri` against an allow-list instead |

This repo requires clients to register via `POST /register` before calling `/authorize` — standard DCR, no manual client setup needed on the MCP side.

---

## Requirements

- [Node.js](https://nodejs.org) 22 or later
- A TeamViewer account and an OAuth2 app registered in the [TeamViewer Management Console](https://login.teamviewer.com/nav#app/myapps) (Integrations → Apps)
- A publicly reachable HTTPS URL for local testing (TeamViewer's OAuth redirect requires one) — e.g. [Tailscale Funnel](https://tailscale.com/kb/1223/funnel) or [ngrok](https://ngrok.com)

---

## Setup

### 1. Register a TeamViewer OAuth app

1. Go to **[login.teamviewer.com → Integrations → Apps](https://login.teamviewer.com/nav#app/myapps)** and sign in.
2. Create an app and set its **Callback URL** to `{TEAMVIEWER_MCP_URL}/callback` (the public URL this server will run at, plus `/callback` — see Step 3).
3. Copy the **Client ID** and **Client Secret**.

### 2. Install and build

```bash
git clone https://github.com/NilsTv8/TV_ONE_MCP_Anthropic.git
cd TV_ONE_MCP_Anthropic
npm install
npm run build
```

### 3. Configure environment variables

| Variable | Required | Description |
|---|---|---|
| `TEAMVIEWER_CLIENT_ID` | Yes | TV OAuth app client ID (from Step 1) |
| `TEAMVIEWER_CLIENT_SECRET` | Yes | TV OAuth app client secret |
| `TEAMVIEWER_MCP_URL` | Yes | Public base URL of this server (no trailing slash) |
| `TEAMVIEWER_CALLBACK_URL` | No | OAuth callback URL — defaults to `{TEAMVIEWER_MCP_URL}/callback` |
| `PORT` | No | HTTP port (default `3000`) |

No encryption-key variable is needed — TeamViewer tokens are encrypted server-side with a key generated fresh in memory on every boot (see [Security design](#security-design) below).

### 4. Run

```bash
TEAMVIEWER_CLIENT_ID=<id> \
TEAMVIEWER_CLIENT_SECRET=<secret> \
TEAMVIEWER_MCP_URL=https://<your-public-domain> \
PORT=3000 node dist/index.js
```

### 5. Connect an MCP client

Point the client at `https://<your-public-domain>/mcp`. A DCR-capable client (like Claude.ai) will register itself automatically via `POST /register` and walk through the OAuth flow the first time it needs to call a tool — `tools/list` requires no authentication; only `tools/call` triggers the OAuth prompt.

---

## OAuth endpoints (auto-served)

| Endpoint | Purpose |
|---|---|
| `GET /.well-known/oauth-protected-resource` (and `/mcp` suffix) | RFC 9728 protected resource metadata |
| `GET /.well-known/oauth-authorization-server` | RFC 8414 authorization server metadata |
| `POST /register` | Dynamic Client Registration (RFC 7591) |
| `GET /authorize` | Starts the OAuth flow → redirects to TeamViewer |
| `POST /token` | Exchanges an authorization code or refresh token |
| `POST /revoke` | Revokes a token |
| `GET /callback` | TeamViewer redirects here after the user logs in |

---

## Available tools

27 action-based tools (each multi-action tool takes a single `action` parameter plus action-specific fields):

| Group | Tools |
|---|---|
| Account & Company | `tv_account`, `tv_company` |
| Users & Access Management | `tv_users`, `tv_deactivate_user_tfa`, `tv_get_user_effective_permissions`, `tv_get_user_roles`, `tv_respond_to_join_company_request`, `tv_user_roles`, `tv_user_role_assignments`, `tv_user_groups`, `tv_user_group_members` |
| Contacts | `tv_contacts` |
| Devices & Device Groups | `tv_device_groups`, `tv_managed_devices`, `tv_managed_device_managers`, `tv_managed_groups`, `tv_managed_group_managers` |
| Policies | `tv_teamviewer_policies`, `tv_monitoring_policies`, `tv_patch_policies` |
| Monitoring | `tv_monitoring` |
| Sessions & Remote Control | `tv_sessions`, `tv_connect_device` |
| Reports & Event Logs | `tv_connection_reports`, `tv_list_device_reports`, `tv_get_event_logs` |
| Tokens | `tv_tokens` (permanent, non-expiring TeamViewer API tokens — separate from this server's own OAuth tokens) |

Each tool's `description` (visible via `tools/list`) documents its exact `action` values and parameters.

### Available scopes

Requested during the OAuth flow; map to TeamViewer's own API permission scopes:

`UserInfo.View` · `Computers.View` · `Computers.Edit` · `Computers.Delete` · `Groups.View` · `Groups.Create` · `Groups.Edit` · `Groups.Delete` · `Contacts.View` · `Contacts.Create` · `Contacts.Edit` · `Contacts.Delete` · `Partners.View` · `Sessions.ManualCreation`

---

## Docker

```bash
docker build -t teamviewer-mcp .
docker run -p 3000:3000 \
  -e TEAMVIEWER_CLIENT_ID=<id> \
  -e TEAMVIEWER_CLIENT_SECRET=<secret> \
  -e TEAMVIEWER_MCP_URL=https://<your-public-domain> \
  teamviewer-mcp
```

The image is a pinned, multi-stage, non-root build (compiles with dev dependencies in a `build` stage, ships only `dist/` and production dependencies in the `runtime` stage) with a container `HEALTHCHECK` against `/.well-known/oauth-authorization-server`.

## Production

Hosted on Azure App Service with this Docker image. Azure terminates TLS; the server always runs plain HTTP internally. Deploys automatically on every push to `master`.

---

## Security design

- **No TeamViewer token pass-through** — this server issues its own opaque, audience-bound tokens; TeamViewer access/refresh tokens are held server-side, AES-256-GCM encrypted, and only ever resolved internally right before a WebAPI call.
- **Refresh-token rotation with reuse detection** — replaying a consumed refresh token revokes the whole session.
- **`redirect_uri` validated via Dynamic Client Registration** — the SDK checks it against what the client registered, with a direct (non-redirecting) rejection on mismatch.
- **No raw upstream error text in tool results** — a failed TeamViewer API call is logged in full server-side; only the HTTP status is surfaced to the calling tool/LLM.

See `CLAUDE.md` in this repo for full architectural detail, local dev setup, and environment specifics.

---

## License

MIT
