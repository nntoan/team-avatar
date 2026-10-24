import { test } from "node:test";
import assert from "node:assert/strict";
import { uniqueBy } from "../src/unique.js";

test("keeps the first item for each key", () => {
  const items = [{ id: 1, v: "a" }, { id: 2, v: "b" }, { id: 1, v: "c" }];
  assert.deepEqual(uniqueBy(items, (x) => x.id), [{ id: 1, v: "a" }, { id: 2, v: "b" }]);
});
