export function cartTotalCents(items) {
  const dollars = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  return dollars * 100;
}
