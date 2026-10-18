export function uniqueBy(items, key) {
  const result = [];
  for (const item of items) {
    const k = key(item);
    if (!result.some((kept) => key(kept) === k)) result.push(item);
  }
  return result;
}
