import { test } from "node:test";
import assert from "node:assert/strict";
import { invoiceTotal } from "../src/invoice.js";

test("invoice total in cents", () => {
  assert.equal(invoiceTotal([{ price: 19.99, qty: 1 }, { price: 5, qty: 2 }]), 2999);
});
