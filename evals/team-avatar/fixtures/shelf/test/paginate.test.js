import { test } from "node:test";
import assert from "node:assert/strict";
import { paginate, pageCount } from "../src/paginate.js";

const items = Array.from({ length: 10 }, (_, i) => i + 1);

test("first page holds perPage items", () => {
  assert.deepEqual(paginate(items, 1, 3), [1, 2, 3]);
});

test("last page holds the remainder", () => {
  assert.deepEqual(paginate(items, 4, 3), [10]);
});

test("pageCount rounds up", () => {
  assert.equal(pageCount(10, 3), 4);
});
