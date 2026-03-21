import { access, mkdir, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

const repoRoot = process.cwd();
const slidesDir = path.join(repoRoot, "slides");
const outputFile = path.join(slidesDir, "index.html");

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function toDisplayName(folderName) {
  return folderName.replaceAll(/[._-]+/g, " ").replaceAll(/\s+/g, " ").trim();
}

const entries = await readdir(slidesDir, { withFileTypes: true });

const slideFolders = [];
for (const entry of entries) {
  if (!entry.isDirectory()) continue;
  if (entry.name.startsWith(".")) continue;

  const childIndex = path.join(slidesDir, entry.name, "index.html");
  if (await exists(childIndex)) {
    slideFolders.push(entry.name);
  }
}

slideFolders.sort((a, b) => a.localeCompare(b, "pt-BR"));

const links = slideFolders
  .map((name) => {
    const href = `./${encodeURIComponent(name)}/`;
    const label = escapeHtml(toDisplayName(name));
    return `      <li><a href="${href}">${label}</a></li>`;
  })
  .join("\n");

const emptyState =
  slideFolders.length === 0
    ? "    <p>No slide decks were found.</p>"
    : `    <ul>\n${links}\n    </ul>`;

const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Slides</title>
    <style>
      :root {
        color-scheme: light;
      }

      body {
        font-family: system-ui, sans-serif;
        max-width: 800px;
        margin: 40px auto;
        padding: 0 16px;
        line-height: 1.6;
      }

      h1 {
        margin-bottom: 0.5rem;
      }

      ul {
        padding-left: 1.25rem;
      }

      li + li {
        margin-top: 0.35rem;
      }

      a {
        color: inherit;
      }
    </style>
  </head>
  <body>
    <h1>Slides</h1>
    <p>Select a deck:</p>
${emptyState}
  </body>
</html>
`;

await mkdir(slidesDir, { recursive: true });
await writeFile(outputFile, html, "utf8");

console.log(`Generated ${path.relative(repoRoot, outputFile)} with ${slideFolders.length} entr${slideFolders.length === 1 ? "y" : "ies"}.`);
