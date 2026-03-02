#!/usr/bin/env node
/**
 * Phase 2B coverage gate: fails if line coverage for loot files is below 90%.
 * Run after `pnpm test` (which writes coverage/coverage-final.json).
 *
 * Files checked:
 *   - src/domain/loot/lootTables.ts
 *   - src/domain/loot/selectDropItem.ts
 */

import fs from "node:fs";
import path from "node:path";

const COVERAGE_DIR = "coverage";
const COVERAGE_FILE = path.join(COVERAGE_DIR, "coverage-final.json");
const MIN_LINE_PCT = 90;

const PHASE2B_FILES = [
  "src/domain/loot/lootTables.ts",
  "src/domain/loot/selectDropItem.ts",
];

function getLineCoveragePct(fileCoverage) {
  const statementMap = fileCoverage.statementMap || {};
  const counts = fileCoverage.s || {};
  const linesWithCode = new Set();
  const linesCovered = new Set();
  for (const [id, stmt] of Object.entries(statementMap)) {
    const start = stmt.start?.line;
    const end = stmt.end?.line ?? start;
    if (start == null) continue;
    for (let line = start; line <= end; line++) {
      linesWithCode.add(line);
      if ((counts[id] ?? 0) > 0) linesCovered.add(line);
    }
  }
  if (linesWithCode.size === 0) return 100;
  return (linesCovered.size / linesWithCode.size) * 100;
}

function main() {
  if (!fs.existsSync(COVERAGE_FILE)) {
    console.error("check-phase2b-coverage: coverage file not found. Run: pnpm test");
    process.exit(1);
  }

  const raw = fs.readFileSync(COVERAGE_FILE, "utf8");
  const data = JSON.parse(raw);

  const cwd = process.cwd();
  let failed = false;

  for (const relPath of PHASE2B_FILES) {
    const absPath = path.resolve(cwd, relPath);
    const key =
      data[absPath] !== undefined
        ? absPath
        : Object.keys(data).find(
            (k) => k.includes("domain/loot") && k.endsWith(path.basename(relPath))
          );
    const fileCoverage = key ? data[key] : null;

    if (!fileCoverage) {
      console.error(`check-phase2b-coverage: no coverage data for ${relPath}`);
      failed = true;
      continue;
    }

    const pct = getLineCoveragePct(fileCoverage);
    const ok = pct >= MIN_LINE_PCT;
    const status = ok ? "OK" : "FAIL";
    console.log(`${relPath}: ${pct.toFixed(1)}% lines (${status}, min ${MIN_LINE_PCT}%)`);
    if (!ok) failed = true;
  }

  if (failed) {
    console.error("check-phase2b-coverage: Phase 2B coverage gate failed.");
    process.exit(1);
  }
  console.log("check-phase2b-coverage: Phase 2B coverage gate passed.");
}

main();
