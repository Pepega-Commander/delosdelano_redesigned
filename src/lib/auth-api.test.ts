import assert from "node:assert/strict";
import { test } from "node:test";

import { ApiError, type ApiClient } from "./api-client.ts";
import { authErrorMessage, login, register } from "./auth-api.ts";

function recordingClient() {
  const calls: Array<{ path: string; body: unknown; auth: string }> = [];
  const response = {
    token: "test-token",
    user: { id: "user-id", email: "person@example.test", name: "Ася" },
  };
  const client: ApiClient = {
    get: async () => response as never,
    patch: async () => response as never,
    post: async (path, body, options) => {
      calls.push({ path, body, auth: options.auth });
      return response as never;
    },
  };
  return { calls, client, response };
}

test("registration uses the public backend contract", async () => {
  const { calls, client, response } = recordingClient();
  const payload = { email: "person@example.test", password: "password-value", name: "Ася" };

  assert.deepEqual(await register(payload, client), response);
  assert.deepEqual(calls, [{ path: "/auth/register", body: payload, auth: "public" }]);
});

test("login uses email and password on the public endpoint", async () => {
  const { calls, client, response } = recordingClient();
  const payload = { email: "person@example.test", password: "password-value" };

  assert.deepEqual(await login(payload, client), response);
  assert.deepEqual(calls, [{ path: "/auth/login", body: payload, auth: "public" }]);
});

test("maps expected authentication statuses to safe Russian feedback", () => {
  assert.equal(
    authErrorMessage(new ApiError("backend", 400, "http"), "register"),
    "Проверьте имя, почту и пароль в форме.",
  );
  assert.equal(
    authErrorMessage(new ApiError("backend", 401, "http"), "login"),
    "Неверная почта или пароль.",
  );
  assert.equal(
    authErrorMessage(new ApiError("backend", 409, "http"), "register"),
    "Аккаунт с такой почтой уже существует.",
  );
  assert.equal(
    authErrorMessage(new ApiError("internal detail", null, "network"), "login"),
    "Не удалось связаться с сервером. Проверьте подключение и попробуйте ещё раз.",
  );
});
