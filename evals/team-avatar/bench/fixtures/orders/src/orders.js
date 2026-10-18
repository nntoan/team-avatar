export async function reserveAll(inventory, items) {
  for (const item of items) {
    await inventory.reserve(item.sku, item.qty);
  }
  return "reserved";
}

export async function getOrder(db, user, id) {
  const order = await db.orders.find(id);
  if (!order || order.userId !== user.id) return null;
  return order;
}
