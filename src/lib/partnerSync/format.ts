export function formatDate(value: string | null | undefined, locale: string) {
  if (!value) return "";
  const date = new Date(value);
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(date);
}

export function formatTime(value: string | null | undefined, locale: string) {
  if (!value) return "";
  const date = new Date(`1970-01-01T${value}`);
  return new Intl.DateTimeFormat(locale, { timeStyle: "short" }).format(date);
}

export function formatDateTime(value: string | null | undefined, locale: string) {
  if (!value) return "";
  const date = new Date(value);
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
