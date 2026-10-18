export function searchCustomers(db, name) {
  const term = name.trim();
  return db.query(`SELECT id, name FROM customers WHERE name LIKE '%${term}%'`);
}
