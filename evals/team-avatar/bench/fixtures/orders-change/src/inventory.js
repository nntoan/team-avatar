export async function reserveIfAvailable(inventory, sku, qty) {
  const available = await inventory.available(sku);
  if (available >= qty) {
    await inventory.reserve(sku, qty);
    return true;
  }
  return false;
}
