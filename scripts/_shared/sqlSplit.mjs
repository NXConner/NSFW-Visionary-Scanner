export function splitSqlStatements(sql) {
  const s = String(sql || "").replace(/^\uFEFF/, "");
  const statements = [];

  let start = 0;
  let i = 0;
  let inSingle = false;
  let inDouble = false;
  let inLineComment = false;
  let inBlockComment = false;
  let dollarTag = "";

  while (i < s.length) {
    const ch = s[i];
    const next = i + 1 < s.length ? s[i + 1] : "";

    if (inLineComment) {
      if (ch === "\n") inLineComment = false;
      i += 1;
      continue;
    }

    if (inBlockComment) {
      if (ch === "*" && next === "/") {
        inBlockComment = false;
        i += 2;
        continue;
      }
      i += 1;
      continue;
    }

    if (dollarTag) {
      if (ch === "$" && s.startsWith(dollarTag, i)) {
        i += dollarTag.length;
        dollarTag = "";
        continue;
      }
      i += 1;
      continue;
    }

    if (inSingle) {
      if (ch === "'" && next === "'") {
        // Escaped single quote by doubling.
        i += 2;
        continue;
      }
      if (ch === "'") inSingle = false;
      i += 1;
      continue;
    }

    if (inDouble) {
      if (ch === '"' && next === '"') {
        i += 2;
        continue;
      }
      if (ch === '"') inDouble = false;
      i += 1;
      continue;
    }

    // Not in any string/comment/dollar-quote.
    if (ch === "-" && next === "-") {
      inLineComment = true;
      i += 2;
      continue;
    }
    if (ch === "/" && next === "*") {
      inBlockComment = true;
      i += 2;
      continue;
    }
    if (ch === "'") {
      inSingle = true;
      i += 1;
      continue;
    }
    if (ch === '"') {
      inDouble = true;
      i += 1;
      continue;
    }
    if (ch === "$") {
      // Dollar-quoted string: $tag$...$tag$ or $$...$$
      const m = s.slice(i).match(/^\$[a-zA-Z_][a-zA-Z0-9_]*\$/) || s.slice(i).match(/^\$\$/);
      if (m) {
        dollarTag = m[0];
        i += dollarTag.length;
        continue;
      }
    }

    if (ch === ";") {
      const stmt = s.slice(start, i).trim();
      if (stmt) statements.push(stmt);
      start = i + 1;
      i += 1;
      continue;
    }

    i += 1;
  }

  const tail = s.slice(start).trim();
  if (tail) statements.push(tail);
  return statements;
}

export function statementPreview(statement, { maxLen = 120 } = {}) {
  const lines = String(statement)
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(Boolean);
  const first = lines[0] || "";
  if (first.length <= maxLen) return first;
  return `${first.slice(0, Math.max(0, maxLen - 3))}...`;
}
