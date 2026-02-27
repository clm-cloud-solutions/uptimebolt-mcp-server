const BASE_URL = process.env.UPTIMEBOLT_API_URL || "http://localhost:3200";
const API_KEY = process.env.UPTIMEBOLT_API_KEY || "";
const API_PREFIX = "/api/v1";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public body?: any
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T = any>(
  method: string,
  path: string,
  options?: { params?: Record<string, string | number | boolean | undefined>; body?: any; timeout?: number; authToken?: string }
): Promise<T> {
  const url = new URL(`${API_PREFIX}${path}`, BASE_URL);

  if (options?.params) {
    for (const [key, value] of Object.entries(options.params)) {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    }
  }

  const controller = new AbortController();
  const timeoutMs = options?.timeout || 30000;
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const resp = await fetch(url.toString(), {
      method,
      headers: {
        ...(options?.authToken
          ? { Authorization: `Bearer ${options.authToken}` }
          : { "x-api-key": API_KEY }),
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: options?.body ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    });

    const json: any = await resp.json().catch(() => null);

    if (!resp.ok) {
      const message = json?.message || json?.error || `HTTP ${resp.status} ${resp.statusText}`;
      throw new ApiError(message, resp.status, json);
    }

    return json?.data !== undefined ? json.data : json;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    if ((err as any)?.name === "AbortError") {
      throw new ApiError(`Request timed out after ${timeoutMs}ms`, 408);
    }
    throw new ApiError((err as Error).message, 0);
  } finally {
    clearTimeout(timer);
  }
}

export const apiClient = {
  get<T = any>(path: string, params?: Record<string, string | number | boolean | undefined>, timeout?: number, authToken?: string): Promise<T> {
    return request<T>("GET", path, { params, timeout, authToken });
  },

  post<T = any>(path: string, body?: any, timeout?: number, authToken?: string): Promise<T> {
    return request<T>("POST", path, { body, timeout, authToken });
  },
};

export function validateApiKey(): void {
  if (!API_KEY) {
    process.stderr.write(
      "Error: UPTIMEBOLT_API_KEY environment variable is required (stdio mode).\n" +
        "Set it to your UptimeBolt API key.\n\n" +
        "Usage:\n" +
        "  UPTIMEBOLT_API_KEY=your-key UPTIMEBOLT_API_URL=https://api.uptimebolt.io node dist/server.js\n\n"
    );
    process.exit(1);
  }
}
