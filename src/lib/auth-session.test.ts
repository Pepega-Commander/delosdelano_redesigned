import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

import { getAccessToken } from "./api-client.ts";
import {
  endAuthSession,
  getAuthUser,
  removeLegacyAuthStorage,
  startAuthSession,
} from "./auth-session.ts";

afterEach(() => {
  endAuthSession();
  Reflect.deleteProperty(globalThis, "window");
});

test("starts and ends an in-memory session without persisting user data", () => {
  const removedKeys: string[] = [];
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: { localStorage: { removeItem: (key: string) => removedKeys.push(key) } },
  });

  startAuthSession({
    token: "test-token",
    user: { id: "user-id", email: "person@example.test", name: "Ася" },
  });

  assert.deepEqual(getAuthUser(), {
    id: "user-id",
    email: "person@example.test",
    name: "Ася",
  });
  assert.equal(getAccessToken(), "test-token");
  assert.deepEqual(removedKeys, ["ap.user"]);

  endAuthSession();
  assert.equal(getAuthUser(), null);
  assert.equal(getAccessToken(), null);
});

test("legacy cleanup removes only the obsolete auth key", () => {
  const removedKeys: string[] = [];
  removeLegacyAuthStorage({ removeItem: (key) => removedKeys.push(key) });
  assert.deepEqual(removedKeys, ["ap.user"]);
});
