import { createHmac } from "node:crypto";

export function verifySignature(secret, body, signature) {
  const expected = createHmac("sha256", secret).update(body).digest("hex");
  return signature === expected;
}
