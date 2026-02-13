export function compactDate(d: string): string {
  try {
    return new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return d;
  }
}

export function avg(values: Array<number | null | undefined>): number | null {
  const nums = values.filter((v): v is number => typeof v === "number" && Number.isFinite(v));
  if (nums.length === 0) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

export function factorsToJson<K extends string>(
  keys: readonly K[],
  state: Partial<Record<K, boolean>>,
): Record<string, boolean> | null {
  const obj: Record<string, boolean> = {};
  for (const k of keys) {
    if (state[k] === true) obj[String(k)] = true;
  }
  return Object.keys(obj).length > 0 ? obj : null;
}
