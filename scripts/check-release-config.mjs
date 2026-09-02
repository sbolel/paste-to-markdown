import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";

const { release: config } = JSON.parse(
  await readFile(new URL("../package.json", import.meta.url), "utf8"),
);

// Exercise the release plugins without invoking publish hooks or push checks.
// Credentials and repository permissions are checked by the main release job.
assert.deepEqual(config.branches, ["main"]);
assert.equal(config.tagFormat, "v${version}");
assert.equal(
  config.repositoryUrl,
  "https://github.com/sbolel/paste-to-markdown.git",
);

const lifecycleHooks = [
  "verifyConditions",
  "analyzeCommits",
  "generateNotes",
  "prepare",
  "publish",
  "success",
  "fail",
];
const plugins = new Map();
for (const entry of config.plugins) {
  const [name, options = {}] = Array.isArray(entry) ? entry : [entry, {}];
  const plugin = await import(name);
  assert.ok(
    lifecycleHooks.some((hook) => typeof plugin[hook] === "function"),
    `No release lifecycle hook found in ${name}`,
  );
  plugins.set(name, { plugin, options: { ...config, ...options } });
}
assert.equal(plugins.get("@semantic-release/npm").options.npmPublish, false);

const git = (...args) => execFileSync("git", args, { encoding: "utf8" }).trim();
const base = process.env.RELEASE_BASE_SHA || git("rev-parse", "HEAD^");
const head = process.env.RELEASE_HEAD_SHA || git("rev-parse", "HEAD");
for (const sha of [base, head]) {
  assert.match(sha, /^[a-f0-9]{40}$/, "Expected a full Git commit SHA");
  git("cat-file", "-e", `${sha}^{commit}`);
}
const commits = git("rev-list", `${base}..${head}`)
  .split("\n")
  .filter(Boolean)
  .map((hash) => ({ hash, message: git("show", "-s", "--format=%B", hash) }));
const context = {
  cwd: process.cwd(),
  env: process.env,
  logger: console,
  options: config,
  commits,
};
const analyzer = plugins.get("@semantic-release/commit-analyzer");
const releaseType = await analyzer.plugin.analyzeCommits(
  analyzer.options,
  context,
);
assert.ok(
  releaseType === null || ["patch", "minor", "major"].includes(releaseType),
);

const generator = plugins.get("@semantic-release/release-notes-generator");
const notes = await generator.plugin.generateNotes(generator.options, {
  ...context,
  lastRelease: { gitHead: base },
  nextRelease: { gitHead: head, version: "0.0.0-validation" },
});
assert.equal(typeof notes, "string");
console.log(
  `Release configuration valid; analyzed ${commits.length} commits and rendered release notes.`,
);
