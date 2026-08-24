import { afterEach, expect, test } from "@effect/vitest";

import executorConfig from "../executor.config";

const ENV_NAME = "EXECUTOR_SECRET_PROVIDER";
const originalValue = process.env[ENV_NAME];

afterEach(() => {
  if (originalValue === undefined) {
    delete process.env[ENV_NAME];
  } else {
    process.env[ENV_NAME] = originalValue;
  }
});

const secretStoreOrder = (): string[] =>
  executorConfig
    .plugins()
    .map((plugin) => plugin.id)
    .filter((id) => id === "keychain" || id === "fileSecrets");

test("auto (default) registers keychain before the file store", () => {
  delete process.env[ENV_NAME];
  expect(secretStoreOrder()).toEqual(["keychain", "fileSecrets"]);
});

test("unknown values behave like auto; matching is case-insensitive", () => {
  process.env[ENV_NAME] = "wat";
  expect(secretStoreOrder()).toEqual(["keychain", "fileSecrets"]);

  // Case-insensitive match means this is STRICT keychain mode.
  process.env[ENV_NAME] = "KEYCHAIN";
  expect(secretStoreOrder()).toEqual(["keychain"]);
});

test("file restores the upstream order", () => {
  process.env[ENV_NAME] = "file";
  expect(secretStoreOrder()).toEqual(["fileSecrets", "keychain"]);
});

test("keychain omits the file store entirely so failures stay loud", () => {
  process.env[ENV_NAME] = "keychain";
  expect(secretStoreOrder()).toEqual(["keychain"]);
});
