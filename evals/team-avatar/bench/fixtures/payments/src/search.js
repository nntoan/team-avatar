export function searchCustomers(db, name) {
  return db.query("SELECT id, name FROM customers WHERE name = $1", [name]);
}
