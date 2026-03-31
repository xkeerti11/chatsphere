import test from "node:test";
import assert from "node:assert/strict";
import { messageSendSchema, registerSchema, resetPasswordSchema } from "../../lib/validations.ts";

test("register schema accepts valid payloads", () => {
  const result = registerSchema.safeParse({
    email: "hello@example.com",
    username: "hello_123",
    password: "Password123",
  });

  assert.equal(result.success, true);
});

test("message schema rejects empty payloads", () => {
  const result = messageSendSchema.safeParse({
    receiverId: "user_2",
    text: "",
    fileUrl: null,
  });

  assert.equal(result.success, false);
});

test("reset password schema requires 6 digit otp", () => {
  const result = resetPasswordSchema.safeParse({
    email: "hello@example.com",
    otp: "123",
    newPassword: "Password123",
  });

  assert.equal(result.success, false);
});
