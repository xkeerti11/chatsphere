import test from "node:test";
import assert from "node:assert/strict";
import { useAuthStore } from "../../stores/useAuthStore.ts";

function mockLocalStorage() {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
  };
}

test("auth store persists and clears auth state", () => {
  const localStorage = mockLocalStorage();
  Object.assign(globalThis, {
    window: {
      localStorage,
    },
  });

  useAuthStore.setState({ hydrated: true, user: null, token: null });
  useAuthStore.getState().setAuth(
    {
      id: "user_1",
      email: "one@example.com",
      username: "one",
      displayName: "One",
      profilePic: null,
      bio: null,
      isVerified: true,
      isOnline: false,
      lastSeen: null,
    },
    "token-123",
  );

  assert.equal(useAuthStore.getState().token, "token-123");
  assert.equal(localStorage.getItem("chatsphere-auth") !== null, true);

  useAuthStore.getState().logout();
  assert.equal(useAuthStore.getState().token, null);
});
