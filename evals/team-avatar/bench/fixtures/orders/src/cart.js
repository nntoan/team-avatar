export function cartTotalCents(items) {
  return items.reduce((sum, item) => sum + item.priceCents * item.qty, 0);
}
