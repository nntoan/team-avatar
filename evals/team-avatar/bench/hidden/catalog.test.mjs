import { test } from "node:test";
import assert from "node:assert/strict";
import { uniqueBy } from "./src/unique.js";

test("first occurrence wins and order is kept", () => {
  const items = [{ k: "b" }, { k: "a" }, { k: "b", dup: true }, { k: "c" }];
  assert.deepEqual(uniqueBy(items, (x) => x.k), [{ k: "b" }, { k: "a" }, { k: "c" }]);
});
test("NaN keys collapse like SameValueZero would not", () => {
  const items = [{ k: NaN }, { k: NaN }];
  assert.equal(uniqueBy(items, (x) => x.k).length, 2);
});
test("distinct object keys stay distinct", () => {
  const a = {}, b = {};
  assert.equal(uniqueBy([{ k: a }, { k: b }, { k: a }], (x) => x.k).length, 2);
});
test("0 and -0 are the same key", () => {
  assert.equal(uniqueBy([{ k: 0 }, { k: -0 }], (x) => x.k).length, 1);
});
test("string and number keys differ", () => {
  assert.equal(uniqueBy([{ k: 1 }, { k: "1" }], (x) => x.k).length, 2);
});
test("undefined keys count once", () => {
  assert.equal(uniqueBy([{}, {}, { k: 1 }], (x) => x.k).length, 2);
});
test("empty input", () => assert.deepEqual(uniqueBy([], (x) => x), []));
