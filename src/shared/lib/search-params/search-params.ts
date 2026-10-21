/** Drops empty values so the address bar only carries active filters. */
export function compactParams(values: Record<string, string | undefined>): Record<string, string> {
  return Object.fromEntries(Object.entries(values).filter((entry): entry is [string, string] => Boolean(entry[1])))
}
