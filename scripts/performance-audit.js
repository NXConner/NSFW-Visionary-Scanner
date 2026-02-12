#!/usr/bin/env node

/**
 * Comprehensive Performance Audit Script
 *
 * Analyzes bundle size, performance metrics, and provides optimization recommendations.
 * Part of Phase 8: Polish & Optimization
 */

import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PERFORMANCE_BUDGETS = {
  initialJS: 200 * 1024, // 200 KB
  totalJS: 1000 * 1024, // 1 MB
  totalCSS: 100 * 1024, // 100 KB
  chunkSize: 500 * 1024, // 500 KB per chunk
  totalAssets: 5 * 1024 * 1024, // 5 MB
};

const COLORS = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

function log(message, color = COLORS.reset) {
  console.log(`${color}${message}${COLORS.reset}`);
}

function formatBytes(bytes) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

function analyzeBundle() {
  log("\n🔍 PERFORMANCE AUDIT - Bundle Analysis", COLORS.bright);
  log("=".repeat(60), COLORS.cyan);

  const distPath = path.join(__dirname, "..", "dist");
  if (!fs.existsSync(distPath)) {
    log("❌ Build directory not found. Running build...", COLORS.yellow);
    try {
      execSync("npm run build", { stdio: "inherit" });
    } catch (error) {
      log("❌ Build failed", COLORS.red);
      process.exit(1);
    }
  }

  const assetsPath = path.join(distPath, "assets");
  if (!fs.existsSync(assetsPath)) {
    log("❌ Assets directory not found", COLORS.red);
    process.exit(1);
  }

  const files = fs.readdirSync(assetsPath, { recursive: true });
  const jsFiles = [];
  const cssFiles = [];
  const imageFiles = [];
  const fontFiles = [];
  const otherFiles = [];

  files.forEach(file => {
    const filePath = path.join(assetsPath, file);
    if (fs.statSync(filePath).isFile()) {
      const ext = path.extname(file).toLowerCase();
      if (ext === ".js") jsFiles.push({ name: file, path: filePath });
      else if (ext === ".css") cssFiles.push({ name: file, path: filePath });
      else if ([".png", ".jpg", ".jpeg", ".svg", ".gif", ".webp"].includes(ext))
        imageFiles.push({ name: file, path: filePath });
      else if ([".woff", ".woff2", ".ttf", ".eot", ".otf"].includes(ext))
        fontFiles.push({ name: file, path: filePath });
      else otherFiles.push({ name: file, path: filePath });
    }
  });

  // Analyze JavaScript bundles
  log("\n📦 JavaScript Bundles:", COLORS.bright);
  let totalJS = 0;
  let initialJS = 0;
  const jsSizes = [];

  jsFiles.forEach(file => {
    const stats = fs.statSync(file.path);
    const size = stats.size;
    totalJS += size;
    jsSizes.push({ name: file.name, size });

    // Identify initial/entry chunks
    if (file.name.includes("index") || file.name.includes("main")) {
      initialJS += size;
    }

    const sizeFormatted = formatBytes(size);
    const status =
      size > PERFORMANCE_BUDGETS.chunkSize
        ? COLORS.red
        : size > PERFORMANCE_BUDGETS.chunkSize * 0.8
          ? COLORS.yellow
          : COLORS.green;
    log(`  ${file.name}: ${sizeFormatted}`, status);
  });

  // Sort by size
  jsSizes.sort((a, b) => b.size - a.size);

  log("\n📊 Top 10 Largest JS Chunks:", COLORS.bright);
  jsSizes.slice(0, 10).forEach((file, index) => {
    log(`  ${index + 1}. ${file.name}: ${formatBytes(file.size)}`, COLORS.cyan);
  });

  // Analyze CSS
  log("\n🎨 CSS Bundles:", COLORS.bright);
  let totalCSS = 0;
  cssFiles.forEach(file => {
    const stats = fs.statSync(file.path);
    const size = stats.size;
    totalCSS += size;
    log(`  ${file.name}: ${formatBytes(size)}`, COLORS.cyan);
  });

  // Analyze images
  log("\n🖼️  Images:", COLORS.bright);
  let totalImages = 0;
  imageFiles.forEach(file => {
    const stats = fs.statSync(file.path);
    totalImages += stats.size;
  });
  log(`  Total: ${formatBytes(totalImages)} (${imageFiles.length} files)`, COLORS.cyan);

  // Analyze fonts
  log("\n🔤 Fonts:", COLORS.bright);
  let totalFonts = 0;
  fontFiles.forEach(file => {
    const stats = fs.statSync(file.path);
    totalFonts += stats.size;
  });
  log(`  Total: ${formatBytes(totalFonts)} (${fontFiles.length} files)`, COLORS.cyan);

  // Summary
  log("\n📈 Bundle Summary:", COLORS.bright);
  log(
    `  Initial JS: ${formatBytes(initialJS)}`,
    initialJS > PERFORMANCE_BUDGETS.initialJS ? COLORS.red : COLORS.green,
  );
  log(
    `  Total JS: ${formatBytes(totalJS)}`,
    totalJS > PERFORMANCE_BUDGETS.totalJS ? COLORS.red : COLORS.green,
  );
  log(
    `  Total CSS: ${formatBytes(totalCSS)}`,
    totalCSS > PERFORMANCE_BUDGETS.totalCSS ? COLORS.red : COLORS.green,
  );
  log(`  Total Images: ${formatBytes(totalImages)}`, COLORS.cyan);
  log(`  Total Fonts: ${formatBytes(totalFonts)}`, COLORS.cyan);
  const totalAssets = totalJS + totalCSS + totalImages + totalFonts;
  log(
    `  Total Assets: ${formatBytes(totalAssets)}`,
    totalAssets > PERFORMANCE_BUDGETS.totalAssets ? COLORS.yellow : COLORS.green,
  );

  // Recommendations
  log("\n💡 Optimization Recommendations:", COLORS.bright);
  const recommendations = [];

  if (initialJS > PERFORMANCE_BUDGETS.initialJS) {
    recommendations.push(
      "⚠️  Initial JS bundle exceeds 200 KB - consider more aggressive code splitting",
    );
  }

  if (totalJS > PERFORMANCE_BUDGETS.totalJS) {
    recommendations.push("⚠️  Total JS exceeds 1 MB - review large dependencies");
  }

  const largeChunks = jsSizes.filter(f => f.size > PERFORMANCE_BUDGETS.chunkSize);
  if (largeChunks.length > 0) {
    recommendations.push(`⚠️  ${largeChunks.length} chunks exceed 500 KB - consider lazy loading`);
    largeChunks.forEach(chunk => {
      recommendations.push(`   - ${chunk.name}: ${formatBytes(chunk.size)}`);
    });
  }

  if (totalCSS > PERFORMANCE_BUDGETS.totalCSS) {
    recommendations.push("⚠️  CSS bundle exceeds 100 KB - consider CSS code splitting");
  }

  if (recommendations.length === 0) {
    log("  ✅ All metrics within performance budgets!", COLORS.green);
  } else {
    recommendations.forEach(rec => log(rec, COLORS.yellow));
  }

  // Check for tree-shaking opportunities
  log("\n🌳 Tree-Shaking Analysis:", COLORS.bright);
  try {
    const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8"));
    const heavyDeps = [
      "three",
      "@react-three/fiber",
      "@react-three/drei",
      "@tensorflow/tfjs",
      "recharts",
      "framer-motion",
      "jspdf",
    ];

    const foundHeavy = heavyDeps.filter(dep => {
      return packageJson.dependencies?.[dep] || packageJson.devDependencies?.[dep];
    });

    if (foundHeavy.length > 0) {
      log("  Large dependencies detected:", COLORS.yellow);
      foundHeavy.forEach(dep => {
        log(`    - ${dep}`, COLORS.cyan);
      });
      log("  💡 Ensure these are lazy-loaded or dynamically imported", COLORS.yellow);
    } else {
      log("  ✅ No heavy dependencies detected", COLORS.green);
    }
  } catch (error) {
    log("  ⚠️  Could not analyze dependencies", COLORS.yellow);
  }

  return {
    initialJS,
    totalJS,
    totalCSS,
    totalImages,
    totalFonts,
    totalAssets,
    jsSizes,
    recommendations,
  };
}

function analyzeBuildTime() {
  log("\n⏱️  Build Performance:", COLORS.bright);
  log("=".repeat(60), COLORS.cyan);

  try {
    const startTime = Date.now();
    execSync("npm run build", { stdio: "pipe" });
    const buildTime = (Date.now() - startTime) / 1000;

    log(`  Build Time: ${buildTime.toFixed(2)}s`, buildTime > 60 ? COLORS.yellow : COLORS.green);

    if (buildTime > 60) {
      log("  💡 Consider optimizing build process or using build cache", COLORS.yellow);
    }
  } catch (error) {
    log("  ⚠️  Could not measure build time", COLORS.yellow);
  }
}

// Main execution
try {
  log("\n🚀 Starting Performance Audit...", COLORS.bright);
  const results = analyzeBundle();
  analyzeBuildTime();

  log("\n✅ Performance Audit Complete!", COLORS.green);
  log("=".repeat(60), COLORS.cyan);

  // By default this is informational; use `--strict` (or PERF_AUDIT_STRICT=true) to fail CI.
  const strict = process.argv.includes("--strict") || process.env.PERF_AUDIT_STRICT === "true";
  if (strict && results.recommendations.length > 0) process.exit(1);
} catch (error) {
  log(`\n❌ Performance audit failed: ${error.message}`, COLORS.red);
  process.exit(1);
}
