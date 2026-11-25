import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { checkPrerenderArtifact } from "../apps/web/scripts/check-prerender.mjs";

const artifactDir = fileURLToPath(
  new URL("../apps/web/dist/", import.meta.url),
);
const requiredFiles = [
  "index.html",
  "about/index.html",
  "404.html",
  "robots.txt",
  "sitemap.xml",
  "google0602f969983537ca.html",
  "og/paste-to-markdown-social.png",
  "og/paste-to-markdown-social.svg",
];

await Promise.all(
  requiredFiles.map(async (file) => {
    await access(resolve(artifactDir, file));
  }),
);

const [main, about, sitemap, verification] = await Promise.all([
  readFile(resolve(artifactDir, "index.html"), "utf8"),
  readFile(resolve(artifactDir, "about/index.html"), "utf8"),
  readFile(resolve(artifactDir, "sitemap.xml"), "utf8"),
  readFile(resolve(artifactDir, "google0602f969983537ca.html"), "utf8"),
]);

const applicationId = "https://sbolel.github.io/paste-to-markdown/#webapp";
const personId = "https://sinanbolel.com/#person";
const aboutPageId = "https://sbolel.github.io/paste-to-markdown/about/#webpage";
const supportedFeatures = [
  "Convert pasted HTML from documents, web pages, email clients, and editors into Markdown.",
  "Edit raw Markdown and display a sanitized rendered preview.",
  "Copy Markdown to the clipboard or download a Markdown file.",
  "Clear and restore the current document during the browser session.",
  "Choose GitHub Flavored Markdown, CommonMark, Strict Markdown, or Custom Style and remember formatting preferences in this browser.",
  "Run conversion locally in the browser without sending pasted content to an application server.",
];

function structuredDataEntities(page) {
  return [
    ...page.matchAll(
      /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g,
    ),
  ].flatMap((match) => {
    const data = JSON.parse(match[1]);
    return data["@graph"] ?? [data];
  });
}

function assertStructuredEntity(entities, type, id, pageName) {
  const entity = entities.find(
    (candidate) => candidate["@type"] === type && candidate["@id"] === id,
  );

  if (!entity) {
    throw new Error(`${pageName} is missing ${type} JSON-LD identity ${id}.`);
  }

  return entity;
}

function containsMeta(page, name, content) {
  return (page.match(/<meta\s+[^>]*>/g) ?? []).some(
    (tag) =>
      tag.includes(`name="${name}"`) && tag.includes(`content="${content}"`),
  );
}

function assertFeatureList(entity, pageName) {
  if (!Array.isArray(entity.featureList)) {
    throw new Error(`${pageName} WebApplication JSON-LD has no feature list.`);
  }

  for (const feature of supportedFeatures) {
    if (!entity.featureList.includes(feature)) {
      throw new Error(
        `${pageName} WebApplication JSON-LD is missing: ${feature}`,
      );
    }
  }
}

function assertMetadata(page, pageName) {
  if (!page.includes('<link rel="author" href="https://sinanbolel.com/"')) {
    throw new Error(`${pageName} is missing author attribution metadata.`);
  }

  for (const property of [
    "og:image:width",
    "og:image:height",
    "og:image:alt",
  ]) {
    if (!page.includes(`property="${property}"`)) {
      throw new Error(`${pageName} is missing ${property} metadata.`);
    }
  }

  if (!page.includes('name="twitter:image:alt"')) {
    throw new Error(
      `${pageName} is missing Twitter social-image alt metadata.`,
    );
  }

  if (!page.includes('content="Paste to Markdown social preview card"')) {
    throw new Error(`${pageName} has an incorrect social-image alt value.`);
  }
}

function assertAboutTwitterMetadata(page) {
  if (
    !containsMeta(
      page,
      "twitter:title",
      "About Paste to Markdown | Sinan Bolel",
    )
  ) {
    throw new Error("About page is missing its Twitter title metadata.");
  }

  if (
    !containsMeta(
      page,
      "twitter:description",
      "Learn about the tool, its privacy model, and how it relates to Sinan Bolel's website, GitHub, and LinkedIn.",
    )
  ) {
    throw new Error("About page is missing its Twitter description metadata.");
  }
}

const mainEntities = structuredDataEntities(main);
const aboutEntities = structuredDataEntities(about);

const mainApplication = assertStructuredEntity(
  mainEntities,
  "WebApplication",
  applicationId,
  "Home page",
);
assertStructuredEntity(mainEntities, "Person", personId, "Home page");
assertStructuredEntity(aboutEntities, "AboutPage", aboutPageId, "About page");
const aboutApplication = assertStructuredEntity(
  aboutEntities,
  "WebApplication",
  applicationId,
  "About page",
);
assertStructuredEntity(aboutEntities, "Person", personId, "About page");
assertFeatureList(mainApplication, "Home page");
assertFeatureList(aboutApplication, "About page");
assertMetadata(main, "Home page");
assertMetadata(about, "About page");
assertAboutTwitterMetadata(about);

if (
  !about.includes("About Paste to Markdown") ||
  about.includes('src="/src/about.ts"')
) {
  throw new Error("About page was not made standalone in the Pages artifact.");
}

if (!sitemap.includes("/paste-to-markdown/about/")) {
  throw new Error("Sitemap does not contain the About page.");
}

if (!verification.includes("google-site-verification")) {
  throw new Error(
    "Google verification file is not present in the Pages artifact.",
  );
}

await checkPrerenderArtifact(artifactDir);
console.log(`Verified prerendered Pages artifact: ${requiredFiles.join(", ")}`);
