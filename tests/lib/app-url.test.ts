import assert from "node:assert/strict";
import test from "node:test";
import { buildAppUrl, getAppUrl } from "../../lib/app-url.ts";

test("getAppUrl prefers the current request origin", () => {
  process.env.APP_URL = "https://stale.example.com";
  process.env.NEXT_PUBLIC_APP_URL = "https://another-stale.example.com";

  const headers = new Headers({
    origin: "https://chatsphere.vercel.app",
  });

  assert.equal(getAppUrl(headers), "https://chatsphere.vercel.app");
  assert.equal(buildAppUrl("/verify-email?token=abc", headers), "https://chatsphere.vercel.app/verify-email?token=abc");
});

test("getAppUrl falls back to forwarded headers when origin is absent", () => {
  delete process.env.APP_URL;
  delete process.env.NEXT_PUBLIC_APP_URL;

  const headers = new Headers({
    "x-forwarded-proto": "https",
    "x-forwarded-host": "chat.example.com",
  });

  assert.equal(getAppUrl(headers), "https://chat.example.com");
});

test("getAppUrl falls back to configured env vars without request headers", () => {
  process.env.APP_URL = "https://app.example.com/";
  delete process.env.NEXT_PUBLIC_APP_URL;

  assert.equal(getAppUrl(), "https://app.example.com");
});
