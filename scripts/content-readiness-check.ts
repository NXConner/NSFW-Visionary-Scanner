import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

type Level = "ok" | "warn" | "fail";
type Check = { level: Level; message: string };

const warnOnly = process.argv.includes("--warn-only");

function envString(name: string): string {
  const v = process.env[name];
  return typeof v === "string" ? v.trim() : "";
}

function inferAppVersion(): "sfw" | "nsfw" | "hybrid" {
  const raw = (
    envString("VITE_APP_VERSION") ||
    envString("VITE_CONTENT_POLICY") ||
    ""
  ).toLowerCase();
  if (raw === "sfw") return "sfw";
  if (raw === "nsfw") return "nsfw";
  return "hybrid";
}

function pad(label: string, width: number): string {
  return (label + " ".repeat(width)).slice(0, width);
}

async function main(): Promise<void> {
  const appEnv = envString("VITE_APP_ENV") || "development";
  const appVersion = inferAppVersion();

  const supabaseUrl = envString("SUPABASE_URL") || envString("VITE_SUPABASE_URL");
  const serviceRole = envString("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRole) {
    console.error(
      "[content-readiness] Missing SUPABASE_URL/VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.\n" +
        "This script is intentionally server-key only (read-only checks across gated tables).\n",
    );
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceRole, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const checks: Check[] = [];

  async function countExact(table: string, selectColumn: string, where?: (q: any) => any) {
    let q = supabase.from(table).select(selectColumn, { count: "exact", head: true });
    if (where) q = where(q);
    const { count, error } = (await q) as {
      count: number | null;
      error: { message: string } | null;
    };
    if (error) throw new Error(`${table}: ${error.message}`);
    return Number(count ?? 0);
  }

  // ------------------------------------------------------------
  // DLC catalog baseline
  // ------------------------------------------------------------
  const expectedPackages = [
    "dlc-positions",
    "dlc-videos",
    "dlc-intimate",
    "dlc-creator",
    "dlc-advanced",
    "dlc-complete",
    "dlc-subscription",
  ];

  try {
    const { data, error } = await supabase
      .from("dlc_packages")
      .select("package_id,is_active,stripe_price_id,price_type,price_usd");

    if (error) throw new Error(error.message);

    const active = (Array.isArray(data) ? data : []).filter((r: any) => r?.is_active !== false);
    const activeIds = new Set(active.map((r: any) => String(r.package_id)));

    const missing = expectedPackages.filter(id => !activeIds.has(id));
    if (missing.length > 0) {
      checks.push({
        level: "fail",
        message: `Missing expected dlc_packages rows: ${missing.join(", ")}`,
      });
    } else {
      checks.push({
        level: "ok",
        message: `DLC catalog present (${expectedPackages.length} canonical packages)`,
      });
    }

    if (appEnv === "production") {
      const needStripe = active.filter((r: any) => {
        const priceType = String(r.price_type || "").toLowerCase();
        const usd = Number(r.price_usd ?? 0);
        // Only enforce Stripe mapping for non-free packages.
        return usd > 0 || priceType === "subscription" || priceType === "one_time";
      });
      const missingStripe = needStripe
        .filter((r: any) => !String(r.stripe_price_id || "").trim())
        .map((r: any) => String(r.package_id));

      if (missingStripe.length > 0) {
        checks.push({
          level: warnOnly ? "warn" : "fail",
          message:
            `dlc_packages missing stripe_price_id for production: ${missingStripe.join(", ")}` +
            " (required for clean Stripe catalog mapping)",
        });
      } else {
        checks.push({
          level: "ok",
          message: "DLC packages have stripe_price_id set (production mapping)",
        });
      }
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    checks.push({ level: "fail", message: `DLC catalog check failed: ${msg}` });
  }

  // ------------------------------------------------------------
  // NSFW content tables (required for nsfw/hybrid builds)
  // ------------------------------------------------------------
  const needsNsfwContent = appVersion === "nsfw" || appVersion === "hybrid";

  if (needsNsfwContent) {
    try {
      const positionsCount = await countExact("nsfw_positions_gallery", "id", q =>
        q.eq("is_active", true),
      );
      if (positionsCount > 0) {
        checks.push({
          level: "ok",
          message: `nsfw_positions_gallery populated (${positionsCount} active rows)`,
        });
      } else {
        checks.push({
          level: warnOnly ? "warn" : "fail",
          message:
            "nsfw_positions_gallery has 0 active rows. Import real content via Admin → /admin/nsfw (DLC Content Import).",
        });
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      checks.push({
        level: warnOnly ? "warn" : "fail",
        message: `nsfw_positions_gallery check failed: ${msg}`,
      });
    }

    try {
      const videoCount = await countExact("nsfw_video_content", "id", q => q.eq("is_active", true));
      if (videoCount > 0) {
        checks.push({
          level: "ok",
          message: `nsfw_video_content populated (${videoCount} active rows)`,
        });
      } else {
        checks.push({
          level: warnOnly ? "warn" : "fail",
          message:
            "nsfw_video_content has 0 active rows. Import/upload real media + metadata before shipping NSFW/Hybrid builds.",
        });
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      checks.push({
        level: warnOnly ? "warn" : "fail",
        message: `nsfw_video_content check failed: ${msg}`,
      });
    }
  } else {
    checks.push({
      level: "ok",
      message: `App version '${appVersion}' (skipping NSFW content checks)`,
    });
  }

  // ------------------------------------------------------------
  // Education + learning baseline (applies to all builds)
  // ------------------------------------------------------------
  try {
    const modulesTotal = await countExact("sexual_health_education_modules", "id");
    if (modulesTotal > 0) {
      checks.push({
        level: "ok",
        message: `sexual_health_education_modules present (${modulesTotal} rows)`,
      });
    } else {
      checks.push({
        level: warnOnly ? "warn" : appEnv === "production" ? "fail" : "warn",
        message:
          "sexual_health_education_modules has 0 rows. Publish real module content or hide the education hub in production.",
      });
    }

    // Modules that would render an empty-state (no html/text/video). This is allowed, but should be intentional.
    const modulesEmpty = await countExact("sexual_health_education_modules", "id", q =>
      q.is("content_html", null).is("content_text", null).is("video_url", null),
    );
    if (modulesEmpty > 0) {
      checks.push({
        level: warnOnly ? "warn" : "warn",
        message: `sexual_health_education_modules: ${modulesEmpty} modules have no content_html/content_text/video_url`,
      });
    } else if (modulesTotal > 0) {
      checks.push({
        level: "ok",
        message: "sexual_health_education_modules: all modules have content or video_url",
      });
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    checks.push({
      level: warnOnly ? "warn" : appEnv === "production" ? "fail" : "warn",
      message: `Education modules check failed: ${msg}`,
    });
  }

  try {
    const publishedCourses = await countExact("learning_courses", "id", q =>
      q.eq("is_published", true),
    );
    const modules = await countExact("learning_modules", "id");
    const lessons = await countExact("learning_lessons", "id");

    if (publishedCourses > 0) {
      checks.push({
        level: "ok",
        message: `learning_courses published (${publishedCourses} rows)`,
      });
    } else {
      checks.push({
        level: warnOnly ? "warn" : appEnv === "production" ? "fail" : "warn",
        message:
          "learning_courses has 0 published rows (is_published=true). Publish at least one course for production.",
      });
    }

    checks.push({
      level: modules > 0 ? "ok" : warnOnly ? "warn" : appEnv === "production" ? "fail" : "warn",
      message: `learning_modules count=${modules}`,
    });
    checks.push({
      level: lessons > 0 ? "ok" : warnOnly ? "warn" : appEnv === "production" ? "fail" : "warn",
      message: `learning_lessons count=${lessons}`,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    checks.push({
      level: warnOnly ? "warn" : appEnv === "production" ? "fail" : "warn",
      message: `Interactive learning check failed: ${msg}`,
    });
  }

  // ------------------------------------------------------------
  // Storage bucket presence (best-effort)
  // ------------------------------------------------------------
  try {
    const { data: buckets, error } = await supabase.storage.listBuckets();
    if (error) throw new Error(error.message);
    const names = new Set((buckets || []).map(b => String((b as any).name)));
    const hasBucket = names.has(envString("NSFW_CONTENT_BUCKET") || "nsfw-content");
    if (needsNsfwContent && !hasBucket) {
      checks.push({
        level: warnOnly ? "warn" : "fail",
        message:
          "NSFW content storage bucket not found (expected NSFW_CONTENT_BUCKET or 'nsfw-content'). Apply migrations + verify bucket exists.",
      });
    } else {
      checks.push({
        level: "ok",
        message: `Storage buckets reachable (nsfw bucket ${hasBucket ? "present" : "not required"})`,
      });
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    checks.push({
      level: warnOnly ? "warn" : "fail",
      message: `Storage bucket check failed: ${msg}`,
    });
  }

  // ------------------------------------------------------------
  // Print summary + exit
  // ------------------------------------------------------------
  const maxLabel = 6;
  const icon = (lvl: Level) => (lvl === "ok" ? "✅" : lvl === "warn" ? "⚠️" : "❌");

  console.log("");
  console.log("📦 Content & Data Readiness Check");
  console.log(`   env=${appEnv} version=${appVersion} warnOnly=${warnOnly ? "true" : "false"}`);
  console.log("");

  for (const c of checks) {
    console.log(`${icon(c.level)} ${pad(c.level.toUpperCase(), maxLabel)} ${c.message}`);
  }

  const failures = checks.filter(c => c.level === "fail").length;
  const warnings = checks.filter(c => c.level === "warn").length;

  console.log("");
  console.log(`Summary: ${checks.length} checks, ${failures} failures, ${warnings} warnings`);

  if (failures > 0 && !warnOnly) process.exit(1);
  process.exit(0);
}

main().catch(err => {
  console.error("[content-readiness] Unhandled error:", err);
  process.exit(1);
});
