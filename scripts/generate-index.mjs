import { access, mkdir, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

const repoRoot = process.cwd();
const docsDir = path.join(repoRoot, "docs");
const outputFile = path.join(docsDir, "index.html");
const itemsPerSlide = 8;

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

const entries = await readdir(docsDir, { withFileTypes: true });

const slideFolders = [];
for (const entry of entries) {
  if (!entry.isDirectory()) continue;
  if (entry.name.startsWith(".")) continue;

  const childIndex = path.join(docsDir, entry.name, "index.html");
  if (await exists(childIndex)) {
    slideFolders.push(entry.name);
  }
}

slideFolders.sort((a, b) => a.localeCompare(b, "pt-BR"));

function chunk(list, size) {
  const groups = [];
  for (let index = 0; index < list.length; index += size) {
    groups.push(list.slice(index, index + size));
  }
  return groups;
}

const pages = chunk(slideFolders, itemsPerSlide);

const slidesMarkup =
  pages.length === 0
    ? `      <section>
        <h1>Slides</h1>
        <p>Nenhuma apresentação foi encontrada em <code>docs/</code>.</p>
      </section>`
    : pages
        .map((pageEntries, pageIndex) => {
          const links = pageEntries
            .map((name) => {
              const href = `./${encodeURIComponent(name)}/`;
              const label = escapeHtml(toDisplayName(name));
              return `              <li><a href="${href}">${label}</a></li>`;
            })
            .join("\n");

          const subtitle =
            pages.length === 1
              ? "Selecione uma apresentação:"
              : `Selecione uma apresentação. Página ${pageIndex + 1} de ${pages.length}.`;

          return `      <section>
        <h1>Slides</h1>
        <p class="deck-intro">${subtitle}</p>
        <ul class="deck-list">
${links}
        </ul>
      </section>`;
        })
        .join("\n");

const html = `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Slides</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/reveal.js@5/dist/reset.css">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/reveal.js@5/dist/reveal.css">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/reveal.js@5/dist/theme/beige.css" id="theme">
    <style>
      .reveal .slides {
        text-align: left;
      }

      .reveal section {
        box-sizing: border-box;
        padding: 0.6em 1.2em;
      }

      .reveal h1 {
        margin-bottom: 0.35em;
      }

      .reveal .deck-intro {
        margin-bottom: 1rem;
        font-size: 0.9em;
      }

      .reveal .deck-list {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 0.45em 1.4em;
        list-style: disc;
      }

      .reveal .deck-list li {
        margin-left: 1.15em;
        line-height: 1.4;
      }

      .reveal .deck-list a {
        text-decoration-thickness: 0.06em;
        text-underline-offset: 0.12em;
      }

      .reveal .deck-meta {
        margin-top: 1.5rem;
        font-size: 0.55em;
        opacity: 0.72;
      }

      @media (max-width: 900px) {
        .reveal .deck-list {
          grid-template-columns: 1fr;
        }
      }
    </style>
  </head>
  <body>
    <div class="reveal">
      <div class="slides">
${slidesMarkup}
      </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/reveal.js@5/dist/reveal.js"></script>
    <script>
      Reveal.initialize({
        hash: true,
        controls: true,
        progress: true,
        center: true,
        transition: "slide",
        backgroundTransition: "fade",
        navigationMode: "linear",
        width: 1280,
        height: 720,
        margin: 0.08
      });
    </script>
  </body>
</html>
`;

await mkdir(docsDir, { recursive: true });
await writeFile(outputFile, html, "utf8");

console.log(`Generated ${path.relative(repoRoot, outputFile)} with ${slideFolders.length} entr${slideFolders.length === 1 ? "y" : "ies"}.`);
