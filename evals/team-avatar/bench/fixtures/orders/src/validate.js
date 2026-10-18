export function isValidName(name) {
  return typeof name === "string" && /^[A-Za-z][A-Za-z ]{0,63}$/.test(name);
}
