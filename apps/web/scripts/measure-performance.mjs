import { createServer } from "node:http";
import { readFile, stat, writeFile, mkdir } from "node:fs/promises";
import { dirname, extname, join, normalize, resolve } from "node:path";
import { execFileSync } from "node:child_process";
import { chromium } from "@playwright/test";

const baselineSha = "19941f909aecb80b3608637a01dd8832f72bcdfc";
const profiles = [
  { name: "desktop", viewport: { width: 1550, height: 964 }, isMobile: false },
  { name: "mobile", viewport: { width: 390, height: 844 }, isMobile: true },
];
const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".png": "image/png",
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
};

function readOption(name, fallback) {
  const argument = `--${name}`;
  const position = process.argv.indexOf(argument);
  return position === -1 ? fallback : process.argv[position + 1];
}

function median(values) {
  const ordered = [...values].sort((left, right) => left - right);
  const center = Math.floor(ordered.length / 2);
  return ordered.length % 2
    ? ordered[center]
    : (ordered[center - 1] + ordered[center]) / 2;
}

function range(values) {
  return { min: Math.min(...values), max: Math.max(...values) };
}

function summarize(runs) {
  const values = (selector) => runs.map(selector);
  const lcpValues = values((run) => run.lcp.startTime);
  const clsValues = values((run) => run.cls);
  const encodedValues = values((run) => run.encodedJavaScriptBytes);
  const transferValues = values((run) => run.transferJavaScriptBytes);
  return {
    runs: runs.length,
    lcpMs: { median: median(lcpValues), range: range(lcpValues) },
    cls: { median: median(clsValues), range: range(clsValues) },
    encodedJavaScriptBytes: {
      median: median(encodedValues),
      range: range(encodedValues),
    },
    transferJavaScriptBytes: {
      median: median(transferValues),
      range: range(transferValues),
    },
    lcpElements: [...new Set(runs.map((run) => run.lcp?.element ?? null))],
  };
}

function assess(baseline, candidate) {
  const lcpIncrease = candidate.lcpMs.median - baseline.lcpMs.median;
  const clsIncrease = candidate.cls.median - baseline.cls.median;
  const jsIncrease =
    candidate.encodedJavaScriptBytes.median -
    baseline.encodedJavaScriptBytes.median;
  const lcpThreshold = Math.max(100, baseline.lcpMs.median * 0.1);
  const jsThreshold = Math.max(
    10 * 1024,
    baseline.encodedJavaScriptBytes.median * 0.05,
  );
  const findings = [];
  if (lcpIncrease > lcpThreshold)
    findings.push({
      metric: "LCP",
      increase: lcpIncrease,
      threshold: lcpThreshold,
    });
  if (candidate.cls.median > 0.1 || clsIncrease > 0.01)
    findings.push({
      metric: "CLS",
      candidate: candidate.cls.median,
      increase: clsIncrease,
      threshold: ">0.10 absolute or >0.01 increase",
    });
  if (jsIncrease > jsThreshold)
    findings.push({
      metric: "encoded JavaScript",
      increase: jsIncrease,
      threshold: jsThreshold,
    });
  return {
    status: findings.length
      ? "regression-investigation-required"
      : "within-investigation-thresholds",
    lcpIncreaseMs: lcpIncrease,
    clsIncrease,
    encodedJavaScriptIncreaseBytes: jsIncrease,
    findings,
  };
}

function artifactServer(directory) {
  const root = resolve(directory);
  return createServer(async (request, response) => {
    const pathname = new URL(request.url, "http://localhost").pathname;
    if (!pathname.startsWith("/paste-to-markdown/"))
      return response.writeHead(404).end();
    const suffix = pathname.slice("/paste-to-markdown/".length) || "index.html";
    const candidate = normalize(
      join(root, suffix.endsWith("/") ? `${suffix}index.html` : suffix),
    );
    if (!candidate.startsWith(`${root}/`) && candidate !== root)
      return response.writeHead(400).end();
    try {
      const info = await stat(candidate);
      const file = info.isDirectory()
        ? join(candidate, "index.html")
        : candidate;
      response.writeHead(200, {
        "cache-control": "no-store",
        "content-type": mimeTypes[extname(file)] ?? "application/octet-stream",
        "timing-allow-origin": "http://127.0.0.1",
      });
      response.end(await readFile(file));
    } catch {
      response.writeHead(404).end();
    }
  });
}

async function startServer(directory) {
  const server = artifactServer(directory);
  await new Promise((resolveServer) =>
    server.listen(0, "127.0.0.1", resolveServer),
  );
  const address = server.address();
  return { server, origin: `http://127.0.0.1:${address.port}` };
}

async function measure(browser, origin, profile, run) {
  const context = await browser.newContext({
    viewport: profile.viewport,
    isMobile: profile.isMobile,
    deviceScaleFactor: 1,
    serviceWorkers: "block",
  });
  const page = await context.newPage();
  const contentEncodings = new Map();
  const pageErrors = [];
  const unsuccessfulResponses = [];
  page.on("response", (response) => {
    if (response.request().resourceType() === "script") {
      contentEncodings.set(
        new URL(response.url()).pathname,
        response.headers()["content-encoding"] ?? "identity",
      );
    }
    if (response.url().startsWith(origin) && response.status() >= 400) {
      unsuccessfulResponses.push({
        path: new URL(response.url()).pathname,
        status: response.status(),
      });
    }
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.addInitScript(() => {
    window.__issue89Performance = { lcp: [], shifts: [] };
    new PerformanceObserver((list) => {
      window.__issue89Performance.lcp.push(
        ...list.getEntries().map((entry) => ({
          startTime: entry.startTime,
          element: entry.element?.tagName ?? null,
          url: entry.url ?? null,
        })),
      );
    }).observe({ type: "largest-contentful-paint", buffered: true });
    new PerformanceObserver((list) => {
      window.__issue89Performance.shifts.push(
        ...list
          .getEntries()
          .filter((entry) => !entry.hadRecentInput)
          .map((entry) => ({
            startTime: entry.startTime,
            value: entry.value,
          })),
      );
    }).observe({ type: "layout-shift", buffered: true });
  });
  await page.route("**/*", (route) =>
    route.request().url().startsWith(origin) ? route.continue() : route.abort(),
  );
  try {
    const startedAt = performance.now();
    await page.goto(`${origin}/paste-to-markdown/`, {
      waitUntil: "domcontentloaded",
    });
    await page.waitForTimeout(5000);
    const metrics = await page.evaluate(() => {
      const observed = window.__issue89Performance;
      const shifts = observed.shifts.toSorted(
        (left, right) => left.startTime - right.startTime,
      );
      let sessionValue = 0;
      let largestSessionValue = 0;
      let previousStartTime = -Infinity;
      let sessionStartTime = 0;
      for (const shift of shifts) {
        if (
          sessionValue === 0 ||
          shift.startTime - previousStartTime >= 1000 ||
          shift.startTime - sessionStartTime >= 5000
        ) {
          sessionValue = 0;
          sessionStartTime = shift.startTime;
        }
        sessionValue += shift.value;
        largestSessionValue = Math.max(largestSessionValue, sessionValue);
        previousStartTime = shift.startTime;
      }
      const recordedScripts = new Set();
      const scripts = performance
        .getEntriesByType("resource")
        .filter((entry) => new URL(entry.name).pathname.endsWith(".js"))
        .filter((entry) => {
          if (recordedScripts.has(entry.name)) return false;
          recordedScripts.add(entry.name);
          return true;
        })
        .map((entry) => ({
          path: new URL(entry.name).pathname,
          encodedBodySize: entry.encodedBodySize,
          transferSize: entry.transferSize,
        }));
      return {
        lcp: observed.lcp.at(-1) ?? null,
        cls: largestSessionValue,
        scripts,
        devicePixelRatio: devicePixelRatio,
        navigationDurationMs:
          performance.getEntriesByType("navigation")[0]?.duration ?? null,
      };
    });
    if (!metrics.lcp)
      throw new Error(`Missing LCP for ${profile.name} run ${run}.`);
    if (metrics.scripts.length === 0)
      throw new Error(
        `Missing initial JavaScript resource timings for ${profile.name} run ${run}.`,
      );
    if (pageErrors.length || unsuccessfulResponses.length) {
      throw new Error(
        `Broken load for ${profile.name} run ${run}: ${JSON.stringify({ pageErrors, unsuccessfulResponses })}`,
      );
    }
    const scripts = metrics.scripts.map((script) => ({
      ...script,
      contentEncoding: contentEncodings.get(script.path) ?? "identity",
    }));
    return {
      run,
      elapsedMs: Math.round(performance.now() - startedAt),
      lcp: metrics.lcp,
      cls: metrics.cls,
      scripts,
      encodedJavaScriptBytes: scripts.reduce(
        (total, script) => total + script.encodedBodySize,
        0,
      ),
      transferJavaScriptBytes: scripts.reduce(
        (total, script) => total + script.transferSize,
        0,
      ),
      devicePixelRatio: metrics.devicePixelRatio,
      navigationDurationMs: metrics.navigationDurationMs,
      pageErrors,
      unsuccessfulResponses,
    };
  } finally {
    await context.close();
  }
}

function workingTreeDescription() {
  const revision = execFileSync("git", ["rev-parse", "--short", "HEAD"], {
    encoding: "utf8",
  }).trim();
  const changes = execFileSync("git", ["status", "--porcelain"], {
    encoding: "utf8",
  })
    .trim()
    .split("\n")
    .filter(Boolean);
  return changes.length
    ? `${revision} with ${changes.length} working-tree change(s)`
    : `${revision} clean working tree`;
}

function markdownReport(report) {
  const rows = report.profiles.map((profile) => {
    const result = profile.assessment;
    return `| ${profile.name} | ${profile.baseline.lcpMs.median} | ${profile.candidate.lcpMs.median} | ${profile.baseline.cls.median} | ${profile.candidate.cls.median} | ${profile.baseline.encodedJavaScriptBytes.median} | ${profile.candidate.encodedJavaScriptBytes.median} | ${result.status} |`;
  });
  const findings = report.profiles.flatMap((profile) =>
    profile.assessment.findings.map(
      (finding) =>
        `- ${profile.name}: ${finding.metric} crossed its investigation threshold.`,
    ),
  );
  return `# Issue #89 performance measurement\n\nFive alternating baseline/candidate cold-load pairs were collected for each Chromium profile. Each load used a fresh browser context, disabled service workers, no-store responses, identity encoding, local loopback, no CPU or network throttling, and a five-second no-interaction observation. Requests outside the local artifact origin were blocked. CLS uses the [web-vitals session-window calculation](https://github.com/GoogleChrome/web-vitals/blob/main/src/lib/LayoutShiftManager.ts).\n\n| Profile | Baseline LCP ms | Candidate LCP ms | Baseline CLS | Candidate CLS | Baseline encoded JS bytes | Candidate encoded JS bytes | Assessment |\n| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |\n${rows.join("\n")}\n\nBaseline artifact: ${report.baseline.sha}. Candidate: ${report.candidate.description}. Chromium ${report.browser.version}; DPR 1. The pre-change one-load capture in \`issue-89-baseline-initial.json\` is retained as context and is excluded from this five-pair comparison. Raw paired runs, LCP elements, resource encodings, ranges, and conditions are in the JSON evidence.\n\n${findings.length ? `## Investigation required\n\n${findings.join("\n")}` : "All measured medians were within the agreed investigation thresholds."}\n`;
}

function validateReport(report) {
  if (report.profiles.length !== profiles.length) {
    throw new Error(
      `Expected ${profiles.length} profiles, received ${report.profiles.length}.`,
    );
  }
  for (const profile of report.profiles) {
    for (const variant of ["baseline", "candidate"]) {
      const runs = profile.rawRuns[variant];
      if (runs.length !== 5) {
        throw new Error(
          `${profile.name} ${variant} must contain five cold-load runs.`,
        );
      }
      for (const run of runs) {
        if (!run.lcp || run.scripts.length === 0) {
          throw new Error(
            `${profile.name} ${variant} run ${run.run} lacks required performance metrics.`,
          );
        }
        if (
          new Set(run.scripts.map((script) => script.path)).size !==
          run.scripts.length
        ) {
          throw new Error(
            `${profile.name} ${variant} run ${run.run} double-counts a JavaScript resource.`,
          );
        }
      }
    }
    const expectedAssessment = assess(profile.baseline, profile.candidate);
    if (
      JSON.stringify(profile.assessment) !== JSON.stringify(expectedAssessment)
    ) {
      throw new Error(
        `${profile.name} threshold assessment does not match its medians.`,
      );
    }
  }
}

const baselineDirectory = readOption("baseline", ".cache/baseline-dist");
const candidateDirectory = readOption("candidate", "apps/web/dist");
const outputPath = readOption(
  "output",
  "docs/evidence/issue-89-performance.json",
);
if (!outputPath.endsWith(".json"))
  throw new Error("The output filename must end in .json.");
let baseline;
let candidate;
let browser;
let browserVersion;
const profileResults = [];

try {
  baseline = await startServer(baselineDirectory);
  candidate = await startServer(candidateDirectory);
  browser = await chromium.launch({ headless: true });
  browserVersion = browser.version();
  for (const profile of profiles) {
    const baselineRuns = [];
    const candidateRuns = [];
    for (let pair = 1; pair <= 5; pair += 1) {
      baselineRuns.push(await measure(browser, baseline.origin, profile, pair));
      candidateRuns.push(
        await measure(browser, candidate.origin, profile, pair),
      );
    }
    const baselineSummary = summarize(baselineRuns);
    const candidateSummary = summarize(candidateRuns);
    profileResults.push({
      name: profile.name,
      viewport: profile.viewport,
      isMobile: profile.isMobile,
      baseline: baselineSummary,
      candidate: candidateSummary,
      assessment: assess(baselineSummary, candidateSummary),
      rawRuns: { baseline: baselineRuns, candidate: candidateRuns },
    });
  }
} finally {
  if (browser) await browser.close();
  await Promise.all(
    [baseline, candidate]
      .filter(Boolean)
      .map(
        ({ server }) =>
          new Promise((resolveServer) => server.close(resolveServer)),
      ),
  );
}

const report = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  baseline: { sha: baselineSha, artifact: ".cache/baseline-dist" },
  candidate: {
    description: workingTreeDescription(),
    artifact: "apps/web/dist",
  },
  browser: { name: "Chromium", version: browserVersion },
  conditions: {
    cache: "fresh browser context; Cache-Control: no-store",
    serviceWorkers: "blocked",
    cpu: "unthrottled",
    network: "unthrottled local loopback",
    compression: "identity",
    observationMs: 5000,
    interaction: "none",
    externalRequests: "blocked",
    resourceMeasurement:
      "Resource Timing encodedBodySize and transferSize for initial script resources including module preloads/imports",
  },
  thresholds: {
    lcpIncrease: "greater than max(100 ms, 10% of baseline median)",
    cls: "candidate greater than 0.10 or increase greater than 0.01",
    encodedJavaScriptIncrease:
      "greater than max(10240 bytes, 5% of baseline median)",
  },
  profiles: profileResults,
};

validateReport(report);
await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`);
await writeFile(outputPath.replace(/\.json$/, ".md"), markdownReport(report));
console.log(
  JSON.stringify({
    output: outputPath,
    profiles: report.profiles.map((profile) => ({
      name: profile.name,
      status: profile.assessment.status,
    })),
  }),
);
