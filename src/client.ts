export type RefreshFn = () => Promise<string>;

export class TeamViewerClient {
  private readonly baseUrl = "https://webapi.teamviewer.com/api/v1";
  private token: string;
  private readonly refreshFn?: RefreshFn;

  constructor(token: string, refreshFn?: RefreshFn) {
    this.token = token;
    this.refreshFn = refreshFn;
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    query?: Record<string, string | number | boolean | undefined>,
    retries = 1
  ): Promise<T> {
    const url = new URL(`${this.baseUrl}${path}`);

    if (query) {
      for (const [key, value] of Object.entries(query)) {
        if (value !== undefined) {
          url.searchParams.set(key, String(value));
        }
      }
    }

    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.token}`,
      "Content-Type": "application/json",
    };

    const response = await fetch(url.toString(), {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    if (response.status === 401 && this.refreshFn && retries > 0) {
      this.token = await this.refreshFn();
      return this.request<T>(method, path, body, query, retries - 1);
    }

    if (!response.ok) {
      // The response body is attacker-influenceable (e.g. it can echo back
      // values the caller submitted) and flows into the calling LLM's context
      // as tool_result text — never forward it verbatim, that's a prompt
      // injection vector. Log it server-side only; the thrown message stays
      // bounded to the HTTP status, which we control.
      const errorBody = await response.text().catch(() => "");
      if (errorBody) {
        console.error(`[teamviewer-mcp] TeamViewer API error ${response.status} ${method} ${path}:`, errorBody);
      }
      throw new Error(`TeamViewer API error: ${response.status} ${response.statusText}`);
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (response.status === 204 || !contentType.includes("application/json")) {
      return {} as T;
    }

    return response.json() as Promise<T>;
  }

  get<T>(path: string, query?: Record<string, string | number | boolean | undefined>): Promise<T> {
    return this.request<T>("GET", path, undefined, query);
  }

  post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>("POST", path, body);
  }

  put<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>("PUT", path, body);
  }

  patch<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>("PATCH", path, body);
  }

  delete<T>(path: string, body?: unknown, query?: Record<string, string | number | boolean | undefined>): Promise<T> {
    return this.request<T>("DELETE", path, body, query);
  }

  createPermanentToken(name: string, scope?: string): Promise<{ AccessToken: string }> {
    return this.post<{ AccessToken: string }>("/OAuth2/accessToken", { name, scope });
  }

  deletePermanentToken(): Promise<void> {
    return this.delete<void>("/OAuth2/accessToken");
  }
}
