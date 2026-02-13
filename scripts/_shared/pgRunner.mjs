import { shouldUseSsl } from "./supabaseDb.mjs";
import { statementPreview } from "./sqlSplit.mjs";

export async function connectPgClient({
  dbUrl,
  connectTimeoutMs = 15000,
  statementTimeoutMs = 30000,
  noSsl = false,
  applicationName = "run-sql-file",
} = {}) {
  const pg = await import("pg");
  const { Client } = pg.default ?? pg;

  const ssl = shouldUseSsl({ dbUrl, noSsl }) ? { rejectUnauthorized: false } : false;
  const client = new Client({
    connectionString: dbUrl,
    ssl,
    connectionTimeoutMillis: connectTimeoutMs,
    application_name: applicationName,
  });

  await client.connect();
  if (Number(statementTimeoutMs) > 0) {
    await client.query(`SET statement_timeout = ${Number(statementTimeoutMs)};`);
  }

  return client;
}

export async function runSqlStatements({
  client,
  statements,
  maxRows = 200,
  format = "pretty",
  continueOnError = false,
} = {}) {
  const results = [];
  let hadError = false;

  for (let idx = 0; idx < statements.length; idx += 1) {
    const statement = statements[idx];
    const label = `#${idx + 1}/${statements.length}: ${statementPreview(statement)}`;

    if (format === "pretty") {
      console.log(`\n[sql] ${label}`);
    }

    try {
      const res = await client.query(statement);
      const entry = {
        index: idx + 1,
        statement,
        command: res.command,
        rowCount: res.rowCount ?? 0,
        fields: (res.fields || []).map(f => f.name),
        rows: res.rows || [],
      };
      results.push(entry);

      if (format === "pretty") {
        const total = entry.rows.length;
        const shown = Math.min(total, maxRows);
        if (entry.command === "SELECT" || entry.rows.length > 0) {
          console.log(`[sql] ${entry.command} rows=${total}`);
          if (shown > 0) {
            console.table(entry.rows.slice(0, shown));
          }
          if (total > shown) {
            console.log(
              `[sql] (truncated) showing ${shown}/${total} rows (use --max-rows to adjust)`,
            );
          }
        } else {
          console.log(`[sql] ${entry.command} rowCount=${entry.rowCount ?? 0}`);
        }
      }
    } catch (err) {
      hadError = true;
      const message = String(err?.message || err || "Unknown error");
      if (format === "pretty") {
        console.error(`[sql] ERROR in statement ${idx + 1}: ${message}`);
      }
      results.push({
        index: idx + 1,
        statement,
        error: { message, code: err?.code, detail: err?.detail, where: err?.where },
      });
      if (!continueOnError) break;
    }
  }

  return { results, hadError };
}
