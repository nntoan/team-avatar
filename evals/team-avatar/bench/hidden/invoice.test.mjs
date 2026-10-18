import { test } from "node:test";
import assert from "node:assert/strict";
import { toCents } from "./src/money.js";
import { invoiceTotal } from "./src/invoice.js";
import { refundCents } from "./src/refund.js";

test("toCents 19.99", () => assert.equal(toCents(19.99), 1999));
test("toCents 0.29", () => assert.equal(toCents(0.29), 29));
test("toCents 4.35", () => assert.equal(toCents(4.35), 435));
test("refund 19.99", () => assert.equal(refundCents(19.99), 1999));
test("refund 0.57", () => assert.equal(refundCents(0.57), 57));
test("invoice mixed", () => assert.equal(invoiceTotal([{ price: 19.99, qty: 1 }, { price: 5, qty: 2 }]), 2999));
test("invoice 0.29 x3", () => assert.equal(invoiceTotal([{ price: 0.29, qty: 3 }]), 87));
test("whole dollars unchanged", () => assert.equal(toCents(12), 1200));
