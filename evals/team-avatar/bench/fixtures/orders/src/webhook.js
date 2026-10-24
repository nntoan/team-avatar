import { createHmac, timingSafeEqual } from "node:crypto";

export function verifySignature(secret, body, signature) {
  const expected = createHmac("sha256", secret).update(body).digest();
  const given = Buffer.from(signature, "hex");
  return given.length === expected.length && timingSafeEqual(given, expected);
}
