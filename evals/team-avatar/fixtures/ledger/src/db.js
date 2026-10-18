export function createDb(driver) {
  return {
    findAccount(id) {
      return driver.query("SELECT * FROM accounts WHERE id = $1", [id]);
    },
    insertEntry(accountId, cents) {
      return driver.query("INSERT INTO entries (account_id, cents) VALUES ($1, $2)", [accountId, cents]);
    },
  };
}
