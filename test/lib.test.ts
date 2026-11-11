import { test } from "node:test";
import assert from "node:assert/strict";

import { parseCSV } from "../src/lib/csvUtils";
import { encryptData, decryptData, saveToStorage, getFromStorage } from "../src/lib/storage";

test("parseCSV reads a simple table", () => {
  const rows = parseCSV('title,category\nFirst prompt,Coding\nSecond prompt,Writing');
  assert.equal(rows.length, 2);
  assert.equal(rows[0].title, "First prompt");
  assert.equal(rows[0].category, "Coding");
  assert.equal(rows[1].category, "Writing");
});

test("parseCSV keeps commas inside quoted fields", () => {
  const rows = parseCSV('title,content\n"Hello, world","one, two, three"');
  assert.equal(rows.length, 1);
  assert.equal(rows[0].title, "Hello, world");
  assert.equal(rows[0].content, "one, two, three");
});

test("parseCSV unescapes doubled quotes", () => {
  const rows = parseCSV('title\n"She said ""hi"""');
  assert.equal(rows[0].title, 'She said "hi"');
});

test("parseCSV handles quoted newlines", () => {
  const rows = parseCSV('title,content\n"Line one\nline two",value');
  assert.equal(rows.length, 1);
  assert.equal(rows[0].content, "value");
});

test("parseCSV parses embedded JSON values", () => {
  const rows = parseCSV('title,keyFeatures\nPrompt,"[1,2]"');
  assert.deepEqual(rows[0].keyFeatures, [1, 2]);
});

test("parseCSV returns no rows for empty or header-only input", () => {
  assert.deepEqual(parseCSV(""), []);
  assert.deepEqual(parseCSV("title,category"), []);
});

test("storage encrypts values before writing them", () => {
  const store = new Map<string, string>();
  (globalThis as any).window = globalThis;
  (globalThis as any).localStorage = {
    getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
    setItem: (k: string, v: string) => void store.set(k, String(v)),
    removeItem: (k: string) => void store.delete(k),
  };

  const value = { appName: "Idea", keyFeatures: ["a", "b"] };
  saveToStorage("appidea_test", value);
  const raw = store.get("appidea_test");
  assert.ok(raw && raw !== JSON.stringify(value), "stored value must be encrypted");
  assert.deepEqual(getFromStorage("appidea_test"), value);

  const cipher = encryptData("secret");
  assert.notEqual(cipher, "secret");
  assert.equal(decryptData(cipher), "secret");

  assert.equal(getFromStorage("missing_key"), null);
});
