const UNITS = { h: 3600, m: 60, s: 1 };

export function parseDuration(input) {
  const text = String(input).trim();
  if (text === "") throw new RangeError("empty duration");
  const pattern = /(\d+)([hms])/gy;
  const seen = new Set();
  let total = 0;
  let consumed = 0;
  let match;
  while ((match = pattern.exec(text)) !== null) {
    const [, digits, unit] = match;
    if (seen.has(unit)) throw new RangeError(`repeated unit ${unit}`);
    seen.add(unit);
    total += Number(digits) * UNITS[unit];
    consumed = pattern.lastIndex;
  }
  if (consumed !== text.length) throw new RangeError(`bad duration ${input}`);
  return total;
}
