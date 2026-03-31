import test from "node:test";
import assert from "node:assert/strict";
import { buildUploadFolder, inferFileType, normalizeUsername } from "../../lib/utils.ts";

test("normalizeUsername lowercases and trims", () => {
  assert.equal(normalizeUsername("  Keerti_01 "), "keerti_01");
});

test("buildUploadFolder maps each upload purpose to a stable folder", () => {
  assert.equal(buildUploadFolder("chat_attachment"), "chatsphere/messages");
  assert.equal(buildUploadFolder("story_media"), "chatsphere/stories");
  assert.equal(buildUploadFolder("profile_image"), "chatsphere/profiles");
});

test("inferFileType classifies media and document types", () => {
  assert.equal(inferFileType("image/png"), "image");
  assert.equal(inferFileType("video/mp4"), "video");
  assert.equal(inferFileType("application/pdf"), "document");
});
