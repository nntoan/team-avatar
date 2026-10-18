import { readFileSync } from "node:fs";

const DEFAULTS = { port: 3000, logLevel: "info", region: "us-east-1" };

function fromFile(path) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return {};
    throw error;
  }
}

function fromEnv(env) {
  const out = {};
  if (env.SHELF_PORT) out.port = Number(env.SHELF_PORT);
  if (env.SHELF_LOG_LEVEL) out.logLevel = env.SHELF_LOG_LEVEL;
  if (env.SHELF_REGION) out.region = env.SHELF_REGION;
  return out;
}

export function loadConfig({ path = "shelf.json", env = process.env } = {}) {
  return { ...DEFAULTS, ...fromFile(path), ...fromEnv(env) };
}
