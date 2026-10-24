export function balance(entries) {
  let total = 0;
  for (let i = 0; i <= entries.length; i++) total += entries[i].cents;
  return total;
}

export function refund(db, accountId, cents) {
  return db.insertEntry(accountId, cents);
}
