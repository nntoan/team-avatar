import { toCents } from "./money.js";

export function invoiceTotal(lines) {
  return lines.reduce((sum, line) => sum + toCents(line.price) * line.qty, 0);
}
