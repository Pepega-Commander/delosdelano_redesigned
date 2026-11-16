import { useSyncExternalStore } from "react";

import { clearAccessToken, setAccessToken } from "./api-client.ts";
import type { AuthResponse, AuthUser } from "./auth-api.ts";

const LEGACY_AUTH_STORAGE_KEY = "ap.user";

let authenticatedUser: AuthUser | null = null;
const listeners = new Set<() => void>();

function emitChange(): void {
  listeners.forEach((listener) => listener());
}

export function removeLegacyAuthStorage(storage?: Pick<Storage, "removeItem"> | null): void {
  try {
    const target =
      storage === undefined
        ? typeof window === "undefined"
          ? null
          : window.localStorage
        : storage;
    target?.removeItem(LEGACY_AUTH_STORAGE_KEY);
  } catch {
    // Storage can be unavailable in privacy-restricted browser contexts.
  }
}

export function startAuthSession(response: AuthResponse): void {
  setAccessToken(response.token);
  authenticatedUser = { ...response.user };
  removeLegacyAuthStorage();
  emitChange();
}

export function updateAuthUser(changes: Partial<Omit<AuthUser, "id">>): void {
  if (!authenticatedUser) return;
  authenticatedUser = { ...authenticatedUser, ...changes };
  emitChange();
}

export function endAuthSession(): void {
  clearAccessToken();
  authenticatedUser = null;
  removeLegacyAuthStorage();
  emitChange();
}

export function getAuthUser(): AuthUser | null {
  return authenticatedUser;
}

export function subscribeToAuthSession(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useAuthUser(): AuthUser | null {
  return useSyncExternalStore(subscribeToAuthSession, getAuthUser, () => null);
}

removeLegacyAuthStorage();
