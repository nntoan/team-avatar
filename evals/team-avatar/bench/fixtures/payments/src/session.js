export function isSessionValid(session, now = Date.now()) {
  return session.expiresAtMs > now;
}
