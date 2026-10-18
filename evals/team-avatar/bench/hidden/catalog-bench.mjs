import { uniqueBy } from "./src/unique.js";
const items = Array.from({ length: 40000 }, (_, i) => ({ id: i % 20000, i }));
uniqueBy(items.slice(0, 1000), (x) => x.id);
const runs = [];
for (let r = 0; r < 3; r++) {
  const t = performance.now();
  uniqueBy(items, (x) => x.id);
  runs.push(performance.now() - t);
}
console.log(JSON.stringify({ ms: Math.min(...runs) }));
