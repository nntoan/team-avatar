export async function reserveIfAvailable(inventory, sku, qty) {
  return inventory.reserveAtomically(sku, qty);
}
