import { apiClient, ApiError, type ApiClient } from "./api-client.ts";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatar?: string | null;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

export interface RegistrationPayload {
  email: string;
  password: string;
  name: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export function register(
  payload: RegistrationPayload,
  client: ApiClient = apiClient,
): Promise<AuthResponse> {
  return client.post<AuthResponse>("/auth/register", payload, { auth: "public" });
}

export function login(payload: LoginPayload, client: ApiClient = apiClient): Promise<AuthResponse> {
  return client.post<AuthResponse>("/auth/login", payload, { auth: "public" });
}

export function authErrorMessage(error: unknown, action: "register" | "login"): string {
  if (!(error instanceof ApiError)) {
    return "Не удалось выполнить запрос. Попробуйте ещё раз.";
  }

  if (error.kind === "network") {
    return "Не удалось связаться с сервером. Проверьте подключение и попробуйте ещё раз.";
  }

  if (error.status === 400) {
    return "Проверьте имя, почту и пароль в форме.";
  }
  if (error.status === 401 && action === "login") {
    return "Неверная почта или пароль.";
  }
  if (error.status === 409 && action === "register") {
    return "Аккаунт с такой почтой уже существует.";
  }

  return error.message || "Не удалось выполнить запрос. Попробуйте ещё раз.";
}
