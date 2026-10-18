#!/usr/bin/env node
import { readFileSync } from "node:fs";

const flags = new Set(process.argv.slice(2).filter((a) => a.startsWith("-")));
const files = process.argv.slice(2).filter((a) => !a.startsWith("-"));
const input = files.length ? files.map((f) => readFileSync(f, "utf8")).join("") : readFileSync(0, "utf8");
const counts = { l: input.split("\n").length - 1, w: input.split(/\s+/).filter(Boolean).length, c: Buffer.byteLength(input) };
const wanted = flags.size ? [...flags].map((f) => f.slice(1)) : ["l", "w", "c"];
console.log(wanted.map((k) => counts[k]).join(" "));
