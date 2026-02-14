import type { ParsedCsvRow } from "./types";

export function parseCsv(text: string): ParsedCsvRow[] {
  const rows: string[][] = [];
  let cur: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]!;
    const next = text[i + 1];
    if (inQuotes) {
      if (ch === '"' && next === '"') {
        field += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        field += ch;
      }
    } else {
      if (ch === '"') inQuotes = true;
      else if (ch === ",") {
        cur.push(field);
        field = "";
      } else if (ch === "\n") {
        cur.push(field);
        rows.push(cur);
        cur = [];
        field = "";
      } else if (ch === "\r") {
        // ignore
      } else {
        field += ch;
      }
    }
  }

  cur.push(field);
  rows.push(cur);

  const header = (rows.shift() || []).map(h => h.trim());
  const out: ParsedCsvRow[] = [];

  for (const r of rows) {
    if (r.every(c => !String(c || "").trim())) continue;
    const obj: ParsedCsvRow = {};
    for (let i = 0; i < header.length; i++) {
      const key = header[i] || "";
      if (!key) continue;
      obj[key] = String(r[i] ?? "").trim();
    }
    out.push(obj);
  }

  return out;
}
