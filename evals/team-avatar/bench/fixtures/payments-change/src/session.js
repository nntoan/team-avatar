export function isSessionValid(session, now = Date.now()) {
  const expiresAtSeconds = session.expiresAt;
  return expiresAtSeconds > now;
}
