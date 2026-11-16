import assert from "node:assert/strict";
import { test } from "node:test";

import { ApiError, buildApiUrl, createApiClient } from "./api-client.ts";

test("builds URLs with exactly one /api prefix", () => {
  assert.equal(
    buildApiUrl("http://localhost:8081", "/auth/login"),
    "http://localhost:8081/api/auth/login",
  );
  assert.equal(buildApiUrl("http://localhost:8081/", "/api/me"), "http://localhost:8081/api/me");
});

test("public JSON requests omit Authorization", async () => {
  let capturedUrl = "";
  let capturedInit: RequestInit | undefined;
  const client = createApiClient({
    baseUrl: "http://localhost:8081",
    fetch: async (input, init) => {
      capturedUrl = input.toString();
      capturedInit = init;
      return Response.json({
        token: "response-value",
        user: { id: "id", email: "a@b.test", name: "A" },
      });
    },
  });

  await client.post(
    "/auth/login",
    { email: "a@b.test", password: "not-a-real-password" },
    { auth: "public" },
  );

  const headers = new Headers(capturedInit?.headers);
  assert.equal(capturedUrl, "http://localhost:8081/api/auth/login");
  assert.equal(headers.get("Authorization"), null);
  assert.equal(headers.get("Content-Type"), "application/json");
});

test("protected requests attach the current token without a JSON content type on GET", async () => {
  let capturedInit: RequestInit | undefined;
  const client = createApiClient({
    baseUrl: "http://localhost:8081",
    getAccessToken: () => "test-token",
    fetch: async (_input, init) => {
      capturedInit = init;
      return Response.json({ id: "id", name: "A", email: "a@b.test", avatar: null });
    },
  });

  await client.get("/me", { auth: "required" });

  const headers = new Headers(capturedInit?.headers);
  assert.equal(headers.get("Authorization"), "Bearer test-token");
  assert.equal(headers.get("Content-Type"), null);
});

test("preserves status and message from backend JSON errors", async () => {
  const client = createApiClient({
    baseUrl: "http://localhost:8081",
    fetch: async () =>
      Response.json({ status: 409, message: "Email уже зарегистрирован" }, { status: 409 }),
  });

  await assert.rejects(
    client.post("/auth/register", {}, { auth: "public" }),
    (error: unknown) =>
      error instanceof ApiError &&
      error.kind === "http" &&
      error.status === 409 &&
      error.message === "Email уже зарегистрирован",
  );
});

test("uses a safe fallback for unexpected error bodies", async () => {
  const client = createApiClient({
    baseUrl: "http://localhost:8081",
    fetch: async () => new Response("proxy failure", { status: 502 }),
  });

  await assert.rejects(
    client.get("/health", { auth: "public" }),
    (error: unknown) =>
      error instanceof ApiError &&
      error.status === 502 &&
      error.message === "Сервер не смог выполнить запрос",
  );
});

test("normalizes network failures without exposing the underlying exception", async () => {
  const client = createApiClient({
    baseUrl: "http://localhost:8081",
    fetch: async () => {
      throw new Error("internal connection detail");
    },
  });

  await assert.rejects(
    client.get("/me", { auth: "public" }),
    (error: unknown) =>
      error instanceof ApiError &&
      error.kind === "network" &&
      error.status === null &&
      error.message === "Не удалось связаться с сервером" &&
      !error.message.includes("internal connection detail"),
  );
});

test("uses a clear fallback for an unexpected successful response", async () => {
  const client = createApiClient({
    baseUrl: "http://localhost:8081",
    fetch: async () => new Response("not JSON", { status: 200 }),
  });

  await assert.rejects(
    client.get("/me", { auth: "public" }),
    (error: unknown) =>
      error instanceof ApiError &&
      error.kind === "response" &&
      error.status === null &&
      error.message === "Сервер вернул неожиданный ответ",
  );
});
test("returns undefined for 204 responses", async () => {
  const client = createApiClient({
    baseUrl: "http://localhost:8081",
    getAccessToken: () => "test-token",
    fetch: async () => new Response(null, { status: 204 }),
  });

  const result = await client.patch<void>(
    "/me/password",
    { currentPassword: "current-value", newPassword: "replacement-value" },
    { auth: "required" },
  );

  assert.equal(result, undefined);
});
