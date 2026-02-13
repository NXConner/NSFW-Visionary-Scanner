export function calculateDailyStreak(dates: string[]) {
  if (dates.length === 0) return { current: 0, longest: 0 };
  const sorted = Array.from(
    new Set(
      dates
        .map(d => new Date(d).toISOString().slice(0, 10))
        .filter(Boolean),
    ),
  ).sort();
  let current = 1;
  let longest = 1;
  let running = 1;
  for (let i = 1; i < sorted.length; i += 1) {
    const prev = new Date(sorted[i - 1]);
    const next = new Date(sorted[i]);
    const diffDays = (next.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
    if (diffDays === 1) {
      running += 1;
      longest = Math.max(longest, running);
    } else {
      running = 1;
    }
  }
  const last = new Date(sorted[sorted.length - 1]);
  const today = new Date();
  const daysSince = Math.floor((today.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
  current = daysSince <= 1 ? running : 0;
  return { current, longest };
}
