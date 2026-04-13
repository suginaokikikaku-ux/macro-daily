// scripts/build_knowledge_pages.js

import fs from "fs";
import path from "path";
import { knowledgePages } from "./knowledge_pages_manifest.js";

const OUTPUT_PATH = "basics/index.html";

function groupBySection(pages) {
  return pages.reduce((acc, page) => {
    if (!acc[page.section]) acc[page.section] = [];
    acc[page.section].push(page);
    return acc;
  }, {});
}

function createCard(page) {
  return `
    <a class="card" href="./${page.path.replace("basics/", "")}">
      <h3>${page.title}</h3>
      <p>${page.description}</p>
    </a>
  `;
}

function buildHTML() {
  const grouped = groupBySection(knowledgePages);

  return `
<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<title>基礎知識一覧</title>
<style>
body { background:#0b1120;color:#fff;font-family:sans-serif;padding:20px;}
.section {margin-bottom:40px;}
.grid {display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:16px;}
.card {background:#111;padding:16px;border-radius:8px;}
</style>
</head>
<body>

<h1>基礎知識一覧</h1>

${Object.entries(grouped).map(([section, pages]) => {
  return `
  <div class="section">
    <h2>${section.toUpperCase()}</h2>
    <div class="grid">
      ${pages.map(createCard).join("")}
    </div>
  </div>
  `;
}).join("")}

</body>
</html>
`;
}

function main() {
  const html = buildHTML();
  fs.writeFileSync(OUTPUT_PATH, html);
  console.log("✅ basics/index.html generated");
}

main();
