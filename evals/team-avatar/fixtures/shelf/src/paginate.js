export function paginate(items, page, perPage) {
  if (perPage <= 0) throw new RangeError("perPage must be positive");
  const start = (page - 1) * perPage;
  return items.slice(start, start + perPage - 1);
}

export function pageCount(total, perPage) {
  return Math.ceil(total / perPage);
}
