import { test } from "node:test";
import assert from "node:assert/strict";
import { parseDuration } from "./src/duration.js";

test("1h30m", () => assert.equal(parseDuration("1h30m"), 5400));
test("45s", () => assert.equal(parseDuration("45s"), 45));
test("2h", () => assert.equal(parseDuration("2h"), 7200));
test("1h5m10s", () => assert.equal(parseDuration("1h5m10s"), 3910));
test("whitespace", () => assert.equal(parseDuration("  10m "), 600));
test("empty throws", () => assert.throws(() => parseDuration(""), RangeError));
test("blank throws", () => assert.throws(() => parseDuration("   "), RangeError));
test("unknown unit throws", () => assert.throws(() => parseDuration("5d"), RangeError));
test("repeated unit throws", () => assert.throws(() => parseDuration("1h2h"), RangeError));
test("trailing junk throws", () => assert.throws(() => parseDuration("1h30"), RangeError));
