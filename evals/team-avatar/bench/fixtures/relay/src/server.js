import { createServer } from "node:http";
import { loadConfig } from "./config.js";

export function start(env = process.env) {
  const { port, host } = loadConfig(env);
  const server = createServer((req, res) => res.end("ok"));
  server.listen(port || 3000, host);
  return server;
}
