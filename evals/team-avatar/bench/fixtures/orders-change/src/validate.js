export function isValidName(name) {
  return typeof name === "string" && /^([A-Za-z]+\s?)*$/.test(name);
}
