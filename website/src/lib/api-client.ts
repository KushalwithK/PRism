import { BACKEND_URL } from "./constants";

interface FetchOptions extends RequestInit {
  accessToken?: string;
}

export async function apiFetch<T>(
  path: string,
  options: FetchOptions = {}
): Promise<T> {
  const { accessToken, headers: customHeaders, ...rest } = options;

  const headers: Record<string, string> = {
    ...((customHeaders as Record<string, string>) || {}),
  };

  // Only set Content-Type for requests that have a body
  if (rest.body) {
    headers["Content-Type"] = headers["Content-Type"] || "application/json";
  }

  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  const res = await fetch(`${BACKEND_URL}${path}`, {
    ...rest,
    headers,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiClientError(
      body.message || `Request failed with status ${res.status}`,
      res.status,
      body
    );
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export class ApiClientError extends Error {
  constructor(
    message: string,
    public status: number,
    public body: unknown
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}
