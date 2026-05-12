import type { ApiResponse } from "./types";

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

export class ApiClientError extends Error {
  code?: string;
  status?: number;

  constructor(message: string, opts?: { code?: string; status?: number }) {
    super(message);
    this.code = opts?.code;
    this.status = opts?.status;
  }
}

export async function apiFetch<T>(
  path: string,
  opts?: { method?: string; token?: string | null; body?: unknown; query?: Record<string, string | undefined> },
): Promise<T> {
  if (!baseUrl) throw new ApiClientError("Missing NEXT_PUBLIC_API_BASE_URL");

  const url = new URL(path, baseUrl);
  if (opts?.query) {
    for (const [k, v] of Object.entries(opts.query)) {
      if (v !== undefined && v !== "") url.searchParams.set(k, v);
    }
  }

  const res = await fetch(url.toString(), {
    method: opts?.method ?? (opts?.body ? "POST" : "GET"),
    headers: {
      ...(opts?.token ? { Authorization: `Bearer ${opts.token}` } : {}),
      ...(opts?.body ? { "Content-Type": "application/json" } : {}),
    },
    body: opts?.body ? JSON.stringify(opts.body) : undefined,
  });

  if (res.status === 204) return undefined as T;

  const json = (await res.json().catch(() => null)) as ApiResponse<T> | null;
  if (!json || typeof json !== "object") {
    throw new ApiClientError("Unexpected API response", { status: res.status });
  }

  if (json.ok) return json.data;
  throw new ApiClientError(json.error.message, { code: json.error.code, status: res.status });
}

