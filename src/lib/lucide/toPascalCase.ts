export const toPascalCase = (value: string): string =>
  value.replace(/(^|[-_\s]+)([a-zA-Z0-9])/g, (_, __, chr: string) => chr.toUpperCase());
