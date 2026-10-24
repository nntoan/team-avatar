const DEFAULTS = { port: 8080, host: "0.0.0.0", workers: 4 };

function fromEnv(env) {
  const out = {};
  if (env.RELAY_HOST) out.host = env.RELAY_HOST;
  if (env.RELAY_PORT) out.port = Number(env.RELAY_PORT);
  if (env.RELAY_WORKERS) out.workers = parseInt(env.RELAY_WORKERS, 10);
  return out;
}

export function loadConfig(env = process.env) {
  return { ...DEFAULTS, ...fromEnv(env) };
}
