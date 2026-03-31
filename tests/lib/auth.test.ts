import test from "node:test";
import assert from "node:assert/strict";
import { generateToken, verifyToken } from "../../lib/jwt.ts";
import { hashOtp, sanitizeText } from "../../lib/auth.ts";

process.env.JWT_SECRET = process.env.JWT_SECRET ?? "test-secret-key-1234567890";
process.env.JWT_EXPIRES_IN = "1h";

test("jwt roundtrip preserves user id", () => {
  const token = generateToken("user_123");
  const decoded = verifyToken(token);
  assert.equal(decoded?.userId, "user_123");
});

test("hashOtp is deterministic and sanitizeText strips angle brackets", () => {
  assert.equal(hashOtp("123456"), hashOtp("123456"));
  assert.equal(sanitizeText("<b>Hello</b>"), "bHello/b");
});
