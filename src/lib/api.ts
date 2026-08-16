export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

let getAuthToken: () => string | null = () => null;
let onUnauthorized: () => void = () => {};
// Attempts a silent token refresh; resolves false if there's no refresh token or the
// backend rejects it. Concurrent 401s should share one in-flight attempt — that
// dedup lives in the auth store, which is the one that knows about refresh tokens.
let refreshAccessToken: () => Promise<boolean> = async () => false;

// Set by the auth store, which apiFetch cannot import directly without a circular dependency.
export function configureApiAuth(deps: {
  getToken: () => string | null;
  onUnauthorized: () => void;
  refreshAccessToken: () => Promise<boolean>;
}): void {
  getAuthToken = deps.getToken;
  onUnauthorized = deps.onUnauthorized;
  refreshAccessToken = deps.refreshAccessToken;
}

async function parseErrorDetail(res: Response): Promise<string> {
  try {
    const body = await res.json();
    if (body?.detail) {
      return typeof body.detail === "string" ? body.detail : JSON.stringify(body.detail);
    }
  } catch {
    // response had no JSON body — fall back to statusText
  }
  return res.statusText;
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  let token = getAuthToken();
  let res = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      // Skips ngrok's browser-warning interstitial (an HTML page in place of the
      // real response) when /api is rewritten to an ngrok tunnel in production.
      "ngrok-skip-browser-warning": "true",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
  });

  if (res.status === 401 && token && (await refreshAccessToken())) {
    token = getAuthToken();
    res = await fetch(path, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(init?.headers ?? {}),
      },
    });
  }

  if (!res.ok) {
    if (res.status === 401) onUnauthorized();
    throw new ApiError(await parseErrorDetail(res), res.status);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

/** Fetches a file endpoint and triggers a browser download, reading the
 * filename from Content-Disposition when the server sets one. Pass `init`
 * for a POST/body request (e.g. bulk export filters); omit for a plain GET. */
export async function apiDownload(path: string, fallbackFilename: string, init?: RequestInit): Promise<void> {
  function buildHeaders(token: string | null): HeadersInit {
    return {
      "ngrok-skip-browser-warning": "true",
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    };
  }

  let token = getAuthToken();
  let res = await fetch(path, { ...init, headers: buildHeaders(token) });

  if (res.status === 401 && token && (await refreshAccessToken())) {
    token = getAuthToken();
    res = await fetch(path, { ...init, headers: buildHeaders(token) });
  }

  if (!res.ok) {
    if (res.status === 401) onUnauthorized();
    throw new ApiError(await parseErrorDetail(res), res.status);
  }

  const disposition = res.headers.get("Content-Disposition");
  const filename = disposition?.match(/filename\*?=(?:UTF-8'')?"?([^";\n]+)"?/i)?.[1] ?? fallbackFilename;

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = decodeURIComponent(filename);
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
