// apps/web/scripts/generatePerfReport.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const input = path.join(root, "perf_samples.json");

if (!fs.existsSync(input)) {
  console.error("Missing perf_samples.json in apps/web/");
  process.exit(1);
}

const samples = JSON.parse(fs.readFileSync(input, "utf8"));

function percentile(values, p) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = (p / 100) * (sorted.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  const w = idx - lo;
  return sorted[lo] * (1 - w) + sorted[hi] * w;
}
function avg(values) {
  if (!values.length) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}
function safeNum(n) {
  return typeof n === "number" && isFinite(n) ? n : 0;
}

const groups = new Map();
for (const s of samples) {
  const hook = String(s.hook ?? "unknown");
  const step = String(s.step ?? "unknown");
  const key = `${hook}::${step}`;
  if (!groups.has(key)) groups.set(key, []);
  groups.get(key).push(s);
}

const rows = Array.from(groups.entries()).map(([key, list]) => {
  const durs = list.map((x) => safeNum(x.duration_ms));
  const rowsVals = list.map((x) => safeNum(x.rows));
  const payloadVals = list.map((x) => safeNum(x.payload_size));
  const [hook, step] = key.split("::");
  return {
    hook,
    step,
    count: list.length,
    p50: Math.round(percentile(durs, 50)),
    p95: Math.round(percentile(durs, 95)),
    max: Math.round(Math.max(...durs)),
    avg: Math.round(avg(durs)),
    rows_avg: Math.round(avg(rowsVals)),
    payload_avg: Math.round(avg(payloadVals)),
  };
});

rows.sort((a, b) => b.p95 - a.p95);

const mdTable = [
  "# PERF_BASELINE_FRONTEND",
  "",
  "| hook | step | count | p50_ms | p95_ms | max_ms | avg_ms | rows_avg | payload_avg |",
  "|---|---:|---:|---:|---:|---:|---:|---:|---:|",
  ...rows.map(
    (r) =>
      `| ${r.hook} | ${r.step} | ${r.count} | ${r.p50} | ${r.p95} | ${r.max} | ${r.avg} | ${r.rows_avg} | ${r.payload_avg} |`
  ),
  "",
].join("\n");

const slowTop10 = rows.slice(0, 10);
const mdSlow = [
  "# SLOW_QUERIES (Top 10 por p95)",
  "",
  ...slowTop10.flatMap((r, i) => [
    `## Query #${i + 1}`,
    `- hook: ${r.hook}`,
    `- step: ${r.step}`,
    `- count: ${r.count}`,
    `- p50_ms: ${r.p50}`,
    `- p95_ms: ${r.p95}`,
    `- max_ms: ${r.max}`,
    `- avg_ms: ${r.avg}`,
    `- rows_avg: ${r.rows_avg}`,
    `- payload_avg: ${r.payload_avg}`,
    "",
    "Hipótesis (llenar en ETAPA 2):",
    "- (pendiente)",
    "",
  ]),
].join("\n");

fs.writeFileSync(path.join(root, "PERF_BASELINE_FRONTEND.md"), mdTable, "utf8");
fs.writeFileSync(path.join(root, "SLOW_QUERIES.md"), mdSlow, "utf8");

console.log("Generated PERF_BASELINE_FRONTEND.md and SLOW_QUERIES.md");
