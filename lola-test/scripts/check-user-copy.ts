/* eslint-disable max-depth, no-console, simple-import-sort/imports */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const TARGET_DIRS = ['src', 'supabase/functions'];
const ENFORCE = isTruthy(process.env.AGENT_COPY_ENFORCEMENT_ENABLED);
const WAIVER_MARKER = 'copy-ok';

const ALLOWLIST = new Set([
  "I couldn't finish that request just now. Please try again.",
  'I made a household update.',
  'There is a new household update waiting.',
  'Lola update',
]);

const PATTERNS = [
  /\bcontent:\s*(['"`])([^\1\n]*?)\1/g,
  /\bbody:\s*(['"`])([^\1\n]*?)\1/g,
  /\btitle:\s*(['"`])([^\1\n]*?)\1/g,
  /\blabel:\s*(['"`])([^\1\n]*?)\1/g,
  /\bmessage:\s*(['"`])([^\1\n]*?)\1/g,
  /toAppError\([^,]+,\s*(['"`])([^\1\n]*?)\1/g,
];

const violations = [];
for (const target of TARGET_DIRS) {
  for (const filePath of walk(path.join(ROOT, target))) {
    if (!filePath.endsWith('.ts')) {
      continue;
    }
    const source = readFileSync(filePath, 'utf8');
    if (source.includes(WAIVER_MARKER)) {
      continue;
    }

    for (const pattern of PATTERNS) {
      pattern.lastIndex = 0;
      let match: RegExpExecArray | null = null;
      while ((match = pattern.exec(source)) !== null) {
        const literal = match[2].trim();
        if (literal.length === 0 || ALLOWLIST.has(literal)) {
          continue;
        }
        const line = source.slice(0, match.index).split('\n').length;
        violations.push(`${path.relative(ROOT, filePath)}:${line} -> ${literal}`);
      }
    }
  }
}

if (violations.length === 0) {
  console.log('copy-check: clean');
  process.exit(0);
}

const report = ['copy-check: found non-allowlisted user-facing literals', ...violations].join('\n');
if (ENFORCE) {
  console.error(report);
  process.exit(1);
}
console.warn(report);
process.exit(0);

function walk(dirPath) {
  const output = [];
  for (const entry of readdirSync(dirPath)) {
    const absolute = path.join(dirPath, entry);
    const stats = statSync(absolute);
    if (stats.isDirectory()) {
      output.push(...walk(absolute));
      continue;
    }
    output.push(absolute);
  }
  return output;
}

function isTruthy(value) {
  if (value === undefined) {
    return false;
  }
  return ['1', 'on', 'true', 'yes'].includes(value.toLowerCase());
}
