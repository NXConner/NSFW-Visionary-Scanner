export const mergeClasses = (
  ...classes: Array<string | undefined | null | false>
): string => classes.filter(Boolean).join(" ");
