#!/usr/bin/env node
/**
 * Ensures src/ui/theme/** and src/ui/components/** have >= 90% line coverage.
 * Run after: pnpm test (which runs vitest with --coverage).
 * Reads coverage/coverage-final.json (v8/Istanbul format).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const coveragePath = path.join(__dirname, "..", "coverage", "coverage-final.json");

const UI_GLOBS = ["src/ui/theme", "src/ui/components"];
const MIN_LINE_COVERAGE = 90;

function normalizePath(p) {
  return path.sep === "\\" ? p.replace(/\\/g, "/") : p;
}

function fileMatchesGlobs(filePath) {
  const normalized = normalizePath(filePath);
  return UI_GLOBS.some((g) => normalized.includes(g));
}

function isSourceFile(filePath) {
  return /\.(ts|tsx)$/.test(filePath) && !/\.(test|spec)\.(ts|tsx)$/.test(filePath);
}

function lineCoverageFromIstanbul(fileCoverage) {
  const statementMap = fileCoverage.statementMap || {};
  const s = fileCoverage.s || {};
  const lines = new Set();
  const coveredLines = new Set();
  for (const [id, map] of Object.entries(statementMap)) {
    const line = map.start?.line;
    if (line == null) continue;
    lines.add(line);
    if (s[id] > 0) coveredLines.add(line);
  }
  if (lines.size === 0) return 100;
  return (coveredLines.size / lines.size) * 100;
}

if (!fs.existsSync(coveragePath)) {
  console.error("Missing coverage/coverage-final.json. Run: pnpm test");
  process.exit(1);
}

const raw = fs.readFileSync(coveragePath, "utf8");
const coverage = JSON.parse(raw);

const entries = Object.entries(coverage).filter(
  ([file]) => fileMatchesGlobs(file) && isSourceFile(file)
);

if (entries.length === 0) {
  console.log("No src/ui/theme or src/ui/components files in coverage (ok if no such files).");
  process.exit(0);
}

const failures = [];
for (const [file, data] of entries) {
  const pct = lineCoverageFromIstanbul(data);
  const short = path.relative(process.cwd(), file);
  if (pct < MIN_LINE_COVERAGE) {
    failures.push({ file: short, pct });
  } else {
    console.log(`  ${short}: ${pct.toFixed(1)}%`);
  }
}

if (failures.length > 0) {
  console.error("\nUI coverage below 90%:");
  failures.forEach(({ file, pct }) => console.error(`  ${file}: ${pct.toFixed(1)}%`));
  process.exit(1);
}

console.log(`\nAll ${entries.length} UI files meet ${MIN_LINE_COVERAGE}% line coverage.`);
