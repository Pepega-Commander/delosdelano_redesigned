export type RequestAuth = "public" | "required";

export interface RequestOptions {
  auth: RequestAuth;
}

export type ApiErrorKind = "http" | "network" | "response" | "authentication";

export class ApiError extends Error {
  readonly status: number | null;
  readonly kind: ApiErrorKind;

  constructor(message: string, status: number | null, kind: ApiErrorKind) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.kind = kind;
  }
}

interface BackendError {
  status: number;
  message: string;
}

interface ApiClientDependencies {
  baseUrl: string;
  fetch?: typeof globalThis.fetch;
  getAccessToken?: () => string | null;
}

export interface ApiClient {
  get<T>(path: string, options: RequestOptions): Promise<T>;
  post<T>(path: string, body: unknown, options: RequestOptions): Promise<T>;
  patch<T>(path: string, body: unknown, options: RequestOptions): Promise<T>;
}

let browserAccessToken: string | null = null;

/** Store a JWT only in this browser tab's JavaScript memory. */
export function setAccessToken(token: string): void {
  if (typeof window === "undefined") {
    throw new Error("Access tokens can only be stored in browser memory");
  }
  if (!token.trim()) {
    throw new Error("Access token must not be empty");
  }
  browserAccessToken = token;
}

export function clearAccessToken(): void {
  browserAccessToken = null;
}

export function getAccessToken(): string | null {
  return typeof window === "undefined" ? null : browserAccessToken;
}

function normalizeBaseUrl(value: string): string {
  try {
    const url = new URL(value);
    const originOnly =
      (url.protocol === "http:" || url.protocol === "https:") &&
      url.username === "" &&
      url.password === "" &&
      (url.pathname === "/" || url.pathname === "") &&
      url.search === "" &&
      url.hash === "";

    if (!originOnly) throw new Error();
    return url.origin;
  } catch {
    throw new Error("VITE_API_BASE_URL must be an http(s) origin without /api or another path");
  }
}

export function buildApiUrl(baseUrl: string, path: string): string {
  const base = normalizeBaseUrl(baseUrl);
  const trimmedPath = path.trim();

  if (!trimmedPath.startsWith("/") || trimmedPath.startsWith("//")) {
    throw new Error("API paths must start with a single slash");
  }

  const pathWithoutApi = trimmedPath === "/api" ? "" : trimmedPath.replace(/^\/api(?=\/)/, "");
  return `${base}/api${pathWithoutApi}`;
}

function isBackendError(value: unknown): value is BackendError {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Partial<BackendError>;
  return typeof candidate.status === "number" && typeof candidate.message === "string";
}

async function parseJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return undefined;
  }
}

export function createApiClient({
  baseUrl,
  fetch: fetchImplementation = globalThis.fetch,
  getAccessToken: readAccessToken = getAccessToken,
}: ApiClientDependencies): ApiClient {
  const normalizedBaseUrl = normalizeBaseUrl(baseUrl);

  async function request<T>(
    method: "GET" | "POST" | "PATCH",
    path: string,
    body: unknown,
    options: RequestOptions,
  ): Promise<T> {
    const headers = new Headers();

    if (options.auth === "required") {
      const token = readAccessToken();
      if (!token) {
        throw new ApiError("Требуется авторизация", 401, "authentication");
      }
      headers.set("Authorization", `Bearer ${token}`);
    }

    let requestBody: string | undefined;
    if (body !== undefined) {
      try {
        requestBody = JSON.stringify(body);
      } catch {
        throw new ApiError("Не удалось подготовить запрос", null, "response");
      }
      headers.set("Content-Type", "application/json");
    }

    let response: Response;
    try {
      response = await fetchImplementation(buildApiUrl(normalizedBaseUrl, path), {
        method,
        headers,
        body: requestBody,
      });
    } catch {
      throw new ApiError("Не удалось связаться с сервером", null, "network");
    }

    if (response.status === 204) return undefined as T;

    const payload = await parseJson(response);
    if (!response.ok) {
      const message = isBackendError(payload) ? payload.message : "Сервер не смог выполнить запрос";
      throw new ApiError(message, response.status, "http");
    }

    if (payload === undefined) {
      throw new ApiError("Сервер вернул неожиданный ответ", null, "response");
    }

    return payload as T;
  }

  return {
    get: <T>(path: string, options: RequestOptions) => request<T>("GET", path, undefined, options),
    post: <T>(path: string, body: unknown, options: RequestOptions) =>
      request<T>("POST", path, body, options),
    patch: <T>(path: string, body: unknown, options: RequestOptions) =>
      request<T>("PATCH", path, body, options),
  };
}

const configuredBaseUrl = import.meta.env?.VITE_API_BASE_URL ?? "http://localhost:8081";

export const apiClient = createApiClient({ baseUrl: configuredBaseUrl });
