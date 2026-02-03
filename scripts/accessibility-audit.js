#!/usr/bin/env node

/**
 * Accessibility Audit Script
 *
 * Checks for common accessibility issues in the codebase.
 * Part of Phase 8: Polish & Optimization
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

const issues = [];

// Accessibility patterns to check
const a11yChecks = [
  {
    name: "Missing heading hierarchy",
    pattern: /<h([1-6])[^>]*>.*<\/h\1>/gi,
    severity: "info",
    fix: "Ensure heading hierarchy is logical (h1 -> h2 -> h3, etc.)",
  },
  {
    name: "Color contrast (inline styles)",
    pattern: /style=["'][^"']*color:\s*#[0-9a-fA-F]{3,6}[^"']*["']/gi,
    severity: "info",
    fix: "Verify color contrast meets WCAG AA standards (4.5:1 for text)",
  },
  {
    name: "Missing focus indicators",
    pattern: /:focus\s*\{[^}]*outline:\s*none[^}]*\}/gi,
    severity: "warning",
    fix: "Ensure focus indicators are visible for keyboard navigation",
  },
  {
    name: "Missing skip links",
    pattern: /<a[^>]*href=["']#main["'][^>]*>/gi,
    severity: "info",
    fix: "Consider adding skip navigation links for keyboard users",
  },
  {
    name: "Missing ARIA landmarks",
    pattern: /<(main|nav|aside|header|footer)[^>]*>/gi,
    severity: "info",
    fix: "Use semantic HTML5 landmarks or ARIA landmarks",
  },
];

function lineForIndex(content, index) {
  return content.slice(0, index).split("\n").length;
}

function addIssue({ file, line, check, severity, fix, match }) {
  issues.push({ file, line, check, severity, fix, match });
}

function extractJsxTag(content, startIndex) {
  let inSingle = false;
  let inDouble = false;
  let inTemplate = false;
  let braceDepth = 0;
  for (let i = startIndex; i < content.length; i++) {
    const ch = content[i];
    const prev = content[i - 1];
    if (!inDouble && !inTemplate && ch === "'" && prev !== "\\") {
      inSingle = !inSingle;
    } else if (!inSingle && !inTemplate && ch === '"' && prev !== "\\") {
      inDouble = !inDouble;
    } else if (!inSingle && !inDouble && ch === "`" && prev !== "\\") {
      inTemplate = !inTemplate;
    } else if (!inSingle && !inDouble && !inTemplate) {
      if (ch === "{") braceDepth += 1;
      if (ch === "}" && braceDepth > 0) braceDepth -= 1;
      if (ch === ">" && braceDepth === 0) {
        return content.slice(startIndex, i + 1);
      }
    }
  }
  return "";
}

function checkImages(content, file) {
  const regex = /<img\b/g;
  let match;
  while ((match = regex.exec(content))) {
    const tag = extractJsxTag(content, match.index);
    if (!tag) continue;
    const hasAlt = /\balt\s*=/i.test(tag);
    if (!hasAlt) {
      addIssue({
        file,
        line: lineForIndex(content, match.index),
        check: "Missing alt text on images",
        severity: "error",
        fix: "Add alt attribute to all <img> tags",
        match: tag.substring(0, 100),
      });
      continue;
    }
    const emptyAltMatch = tag.match(/\balt\s*=\s*["']\s*["']/i);
    if (emptyAltMatch) {
      addIssue({
        file,
        line: lineForIndex(content, match.index),
        check: "Images with empty alt text",
        severity: "warning",
        fix: "Provide descriptive alt text or use alt='' for decorative images",
        match: tag.substring(0, 100),
      });
    }
  }
}

function checkHtmlLang(content, file) {
  const regex = /<html\b[^>]*>/g;
  let match;
  while ((match = regex.exec(content))) {
    const tag = match[0];
    if (!/\blang\s*=/.test(tag)) {
      addIssue({
        file,
        line: lineForIndex(content, match.index),
        check: "Missing lang attribute",
        severity: "error",
        fix: "Add lang attribute to <html> tag",
        match: tag.substring(0, 100),
      });
    }
  }
}

function checkInteractiveLabels(content, file) {
  const regex = /<(button|a)\b/g;
  let match;
  while ((match = regex.exec(content))) {
    const tagName = match[1];
    const openTag = extractJsxTag(content, match.index);
    if (!openTag) continue;
    const startIndex = match.index + openTag.length;
    const closeIndex = content.indexOf(`</${tagName}>`, startIndex);
    if (closeIndex === -1) continue;
    const inner = content.slice(startIndex, closeIndex);
    if (/\b(aria-label|aria-labelledby)\s*=/.test(openTag)) continue;
    const text = inner.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
    if (text.length > 0) continue;
    addIssue({
      file,
      line: lineForIndex(content, match.index),
      check: "Missing aria-label on interactive elements",
      severity: "warning",
      fix: "Add aria-label or aria-labelledby to interactive elements without visible text",
      match: openTag.substring(0, 100),
    });
  }
}

function checkInputLabels(content, file) {
  const regex = /<input\b/g;
  let match;
  while ((match = regex.exec(content))) {
    const tag = extractJsxTag(content, match.index);
    if (!tag) continue;
    if (/\bid\s*=/.test(tag)) continue;
    if (/\b(aria-label|aria-labelledby)\s*=/.test(tag)) continue;
    addIssue({
      file,
      line: lineForIndex(content, match.index),
      check: "Missing form labels",
      severity: "warning",
      fix: "Associate inputs with labels using id/for or aria-label",
      match: tag.substring(0, 100),
    });
  }
}

async function checkFile(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  const relativePath = path.relative(process.cwd(), filePath);

  checkImages(content, relativePath);
  checkHtmlLang(content, relativePath);
  checkInteractiveLabels(content, relativePath);
  checkInputLabels(content, relativePath);

  a11yChecks.forEach(check => {
    const matches = content.match(check.pattern);
    if (matches) {
      matches.forEach(match => {
        const lines = content.substring(0, content.indexOf(match)).split("\n");
        const lineNumber = lines.length;

        issues.push({
          file: relativePath,
          line: lineNumber,
          check: check.name,
          severity: check.severity,
          fix: check.fix,
          match: match.substring(0, 100), // Truncate long matches
        });
      });
    }
  });
}

function findFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      // Skip node_modules, dist, and test directories
      if (!file.includes("node_modules") && !file.includes("dist") && !file.includes("__tests__")) {
        findFiles(filePath, fileList);
      }
    } else if (file.endsWith(".tsx") || file.endsWith(".jsx")) {
      // Skip test files
      if (!file.includes(".test.")) {
        fileList.push(filePath);
      }
    }
  });
  return fileList;
}

async function auditAccessibility() {
  log("\n♿ ACCESSIBILITY AUDIT", COLORS.bright);
  log("=".repeat(60), COLORS.cyan);

  // Find all TSX/JSX files
  const srcPath = path.join(__dirname, "..", "src");
  const files = findFiles(srcPath);

  log(`\n📁 Scanning ${files.length} component files...`, COLORS.cyan);

  for (const file of files) {
    await checkFile(file);
  }

  // Group issues by severity
  const errors = issues.filter(i => i.severity === "error");
  const warnings = issues.filter(i => i.severity === "warning");
  const info = issues.filter(i => i.severity === "info");

  // Report results
  log("\n📊 Audit Results:", COLORS.bright);
  log(`  Total Issues: ${issues.length}`, COLORS.cyan);
  log(`  Errors: ${errors.length}`, errors.length > 0 ? COLORS.red : COLORS.green);
  log(`  Warnings: ${warnings.length}`, warnings.length > 0 ? COLORS.yellow : COLORS.green);
  log(`  Info: ${info.length}`, COLORS.blue);

  // Show errors
  if (errors.length > 0) {
    log("\n❌ Errors:", COLORS.red);
    errors.slice(0, 10).forEach(issue => {
      log(`  ${issue.file}:${issue.line}`, COLORS.red);
      log(`    ${issue.check}`, COLORS.yellow);
      log(`    Fix: ${issue.fix}`, COLORS.cyan);
    });
    if (errors.length > 10) {
      log(`  ... and ${errors.length - 10} more errors`, COLORS.yellow);
    }
  }

  // Show warnings
  if (warnings.length > 0) {
    log("\n⚠️  Warnings:", COLORS.yellow);
    warnings.slice(0, 10).forEach(issue => {
      log(`  ${issue.file}:${issue.line}`, COLORS.yellow);
      log(`    ${issue.check}`, COLORS.cyan);
      log(`    Fix: ${issue.fix}`, COLORS.blue);
    });
    if (warnings.length > 10) {
      log(`  ... and ${warnings.length - 10} more warnings`, COLORS.yellow);
    }
  }

  // Recommendations
  log("\n💡 Accessibility Recommendations:", COLORS.bright);
  log("  1. Run automated accessibility testing with axe-core or Lighthouse", COLORS.cyan);
  log("  2. Test with screen readers (NVDA, JAWS, VoiceOver)", COLORS.cyan);
  log("  3. Test keyboard navigation (Tab, Enter, Space, Arrow keys)", COLORS.cyan);
  log("  4. Verify color contrast with tools like WebAIM Contrast Checker", COLORS.cyan);
  log("  5. Test with reduced motion preferences", COLORS.cyan);
  log("  6. Ensure all interactive elements are focusable", COLORS.cyan);
  log("  7. Add ARIA labels where semantic HTML is insufficient", COLORS.cyan);
  log("  8. Test with high contrast mode enabled", COLORS.cyan);

  // Summary
  log("\n✅ Accessibility Audit Complete!", COLORS.green);
  log("=".repeat(60), COLORS.cyan);

  if (errors.length > 0) {
    log(`\n⚠️  Found ${errors.length} accessibility errors that should be fixed`, COLORS.red);
    process.exit(1);
  } else if (warnings.length > 0) {
    log(`\n⚠️  Found ${warnings.length} accessibility warnings to review`, COLORS.yellow);
  } else {
    log("\n✅ No critical accessibility issues found!", COLORS.green);
  }
}

// Main execution
auditAccessibility().catch(error => {
  log(`\n❌ Accessibility audit failed: ${error.message}`, COLORS.red);
  process.exit(1);
});
