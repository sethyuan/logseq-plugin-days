export function dashToCamel(str) {
  return str.replace(/(?:-|_)([a-z])/g, (m, c) => c.toUpperCase())
}
