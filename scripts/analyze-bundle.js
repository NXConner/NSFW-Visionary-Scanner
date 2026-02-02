#!/usr/bin/env node

import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("🔍 Analyzing bundle size and performance...");

try {
  // Run build with analysis
  console.log("📦 Building application with bundle analyzer...");
  execSync("npm run build", { stdio: "inherit" });

  // Check if dist directory exists
  const distPath = path.join(__dirname, "..", "dist");
  if (!fs.existsSync(distPath)) {
    console.error("❌ Build failed - dist directory not found");
    process.exit(1);
  }

  // Analyze bundle size
  console.log("📊 Analyzing bundle composition...");

  const assetsPath = path.join(distPath, "assets");
  if (fs.existsSync(assetsPath)) {
    const files = fs.readdirSync(assetsPath);
    const jsFiles = files.filter(file => file.endsWith(".js"));
    const cssFiles = files.filter(file => file.endsWith(".css"));

    console.log("\n📄 JavaScript Bundles:");
    let totalJS = 0;
    jsFiles.forEach(file => {
      const filePath = path.join(assetsPath, file);
      const stats = fs.statSync(filePath);
      const sizeKB = (stats.size / 1024).toFixed(2);
      totalJS += stats.size;
      console.log(`  ${file}: ${sizeKB} KB`);
    });

    console.log("\n🎨 CSS Bundles:");
    let totalCSS = 0;
    cssFiles.forEach(file => {
      const filePath = path.join(assetsPath, file);
      const stats = fs.statSync(filePath);
      const sizeKB = (stats.size / 1024).toFixed(2);
      totalCSS += stats.size;
      console.log(`  ${file}: ${sizeKB} KB`);
    });

    console.log("\n📈 Bundle Size Summary:");
    console.log(`  Total JavaScript: ${(totalJS / 1024).toFixed(2)} KB`);
    console.log(`  Total CSS: ${(totalCSS / 1024).toFixed(2)} KB`);
    console.log(`  Total Bundle: ${((totalJS + totalCSS) / 1024).toFixed(2)} KB`);

    // Recommendations based on size
    const totalSizeKB = (totalJS + totalCSS) / 1024;
    if (totalSizeKB > 500) {
      console.log("\n⚠️  WARNING: Bundle size exceeds 500KB");
      console.log("💡 Recommendations:");
      console.log("   - Implement code splitting");
      console.log("   - Use dynamic imports for large components");
      console.log("   - Optimize images and assets");
      console.log("   - Consider lazy loading");
    } else if (totalSizeKB > 200) {
      console.log("\n⚠️  NOTICE: Bundle size is moderate");
      console.log("💡 Consider optimizing for better performance");
    } else {
      console.log("\n✅ Bundle size is within acceptable limits");
    }
  }

  // Check for large dependencies
  console.log("\n🔍 Analyzing dependencies...");
  try {
    const packageLock = JSON.parse(fs.readFileSync("package-lock.json", "utf8"));

    // Simple dependency analysis
    const dependencies = Object.keys(packageLock.packages || {})
      .filter(dep => dep !== "")
      .map(dep => dep.replace("node_modules/", ""));

    console.log(`📦 Total dependencies: ${dependencies.length}`);

    // Check for potentially heavy dependencies
    const heavyDeps = ["three", "react-three-fiber", "@react-three/drei", "framer-motion"];
    const foundHeavy = heavyDeps.filter(dep => dependencies.some(d => d.includes(dep)));

    if (foundHeavy.length > 0) {
      console.log("⚠️  Large dependencies detected:");
      foundHeavy.forEach(dep => console.log(`   - ${dep}`));
      console.log("💡 Consider lazy loading or dynamic imports for these");
    }
  } catch (error) {
    console.log("⚠️  Could not analyze package-lock.json");
  }

  console.log("\n✅ Bundle analysis complete!");
} catch (error) {
  console.error("❌ Bundle analysis failed:", error.message);
  process.exit(1);
}
