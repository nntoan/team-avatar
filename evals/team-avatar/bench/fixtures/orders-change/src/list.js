const MAX_LIMIT = 100;

export function pageWindow(query) {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.max(1, Number(query.limit) || 20);
  return { offset: page * limit, limit };
}
