export async function reserveAll(inventory, items) {
  items.forEach(async (item) => {
    await inventory.reserve(item.sku, item.qty);
  });
  return "reserved";
}

export async function getOrder(db, user, orderId) {
  const order = await db.orders.find(orderId);
  return order ?? null;
}
