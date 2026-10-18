export async function transfer(ledger, from, to, amount) {
  if (from === to) throw new Error("cannot transfer to the same account");
  if (!(amount > 0)) throw new RangeError("amount must be positive");
  await ledger.debit(from, amount);
  await ledger.credit(to, amount);
}
