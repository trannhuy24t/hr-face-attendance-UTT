export function initialsOf(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
}
