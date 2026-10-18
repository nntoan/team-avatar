export function dayOfMonth(isoDate) {
  const [, , day] = isoDate.split("-").map(Number);
  return day;
}
