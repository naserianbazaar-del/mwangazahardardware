const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export function apiRootUrl(path: string): string {
  return new URL(path, `${new URL(API_BASE_URL).origin}/`).toString();
}

export function apiAssetUrl(path: string): string {
  if (!path || /^(data:|https?:\/\/)/i.test(path)) return path;
  return new URL(path, `${new URL(API_BASE_URL).origin}/`).toString();
}

function normalizeKeys(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(normalizeKeys);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [
        key.replace(/_([a-z])/g, (_, character: string) => character.toUpperCase()),
        normalizeKeys(entry),
      ])
    );
  }

  return value;
}

function getAuthToken(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("authToken") || "";
}

async function getApiError(response: Response): Promise<Error> {
  const body = await response.text();
  let message = `API request failed: ${response.status}`;
  if (body) {
    try {
      const errorData = JSON.parse(body) as { detail?: unknown };
      if (typeof errorData.detail === "string") message = errorData.detail;
    } catch (error) {
      if (!(error instanceof SyntaxError)) throw error;
    }
  }

  if (typeof window !== "undefined" && (response.status === 401 || response.status === 402)) {
    if (response.status === 402) {
      const token = localStorage.getItem("authToken");
      if (token) sessionStorage.setItem("subscriptionToken", token);
    } else {
      sessionStorage.removeItem("subscriptionToken");
    }
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    window.location.replace(response.status === 402 ? "/subscribe" : "/");
  }
  return new Error(message);
}

export async function apiGet<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getAuthToken()}`,
    },
  });

  if (!response.ok) {
    throw await getApiError(response);
  }

  return normalizeKeys(await response.json()) as T;
}

export async function apiPost<T>(endpoint: string, data: unknown): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getAuthToken()}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw await getApiError(response);
  }

  return normalizeKeys(await response.json()) as T;
}

export async function apiPut<T>(endpoint: string, data: unknown): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getAuthToken()}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw await getApiError(response);
  }

  return normalizeKeys(await response.json()) as T;
}

export async function apiDelete(endpoint: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
    },
  });

  if (!response.ok) {
    throw await getApiError(response);
  }
}

export async function publicApiGet<T>(
  path: string,
  authorizationToken?: string
): Promise<T> {
  const response = await fetch(apiRootUrl(path), {
    headers: authorizationToken
      ? { Authorization: `Bearer ${authorizationToken}` }
      : {},
  });
  if (!response.ok) throw await getApiError(response);
  return normalizeKeys(await response.json()) as T;
}

export async function publicApiPost<T>(
  path: string,
  data: unknown,
  authorizationToken?: string
): Promise<T> {
  const response = await fetch(apiRootUrl(path), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(authorizationToken
        ? { Authorization: `Bearer ${authorizationToken}` }
        : {}),
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw await getApiError(response);
  return normalizeKeys(await response.json()) as T;
}
