// node render.mjs <recording.json> <out.png> <seconds|end> <title>
import { readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
const [rec, out, at, title] = process.argv.slice(2);
const r = JSON.parse(readFileSync(rec, "utf8"));
const upto = at === "end" ? Infinity : Number(at);
const data = r.chunks.filter(([t]) => t <= upto).map(([, d]) => d).join("");
const html = `<!doctype html><meta charset="utf-8">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@xterm/xterm@5.5.0/css/xterm.css">
<script src="https://cdn.jsdelivr.net/npm/@xterm/xterm@5.5.0/lib/xterm.js"></script>
<style>body{margin:0;background:#1e1e2e;font-family:Menlo,monospace}.bar{background:#313244;color:#bac2de;padding:8px 14px;font:600 14px Menlo}#t{padding:10px}</style>
<div class="bar">${title}</div><div id="t"></div>
<script>
const term = new Terminal({cols:${r.cols},rows:${r.rows},fontFamily:'Menlo, monospace',fontSize:14,theme:{background:'#1e1e2e',foreground:'#cdd6f4'},allowProposedApi:true});
term.open(document.getElementById('t'));
term.write(${JSON.stringify(data)});
</script>`;
const page = out.replace(/\.png$/, ".html");
writeFileSync(page, html);
execFileSync("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", ["--headless=new", "--disable-gpu", "--hide-scrollbars", "--virtual-time-budget=8000", `--window-size=${Math.ceil(r.cols * 8.43 + 40)},${r.rows * 17 + 70}`, `--screenshot=${out}`, `file://${page}`], { stdio: "ignore" });
console.log(out);
