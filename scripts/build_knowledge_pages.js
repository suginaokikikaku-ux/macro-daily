import fs from "fs";
import path from "path";
import { knowledgePages } from "./knowledge_pages_manifest.js";
import { knowledgePageSpecs } from "./knowledge_page_specs.js";

const SITE_URL = (process.env.SITE_URL || "https://YOUR_USERNAME.github.io/macro-daily").replace(/\/$/, "");
const OUTPUT_ROOT = ".";
const BASICS_INDEX_PATH = path.join(OUTPUT_ROOT, "basics", "index.html");

const SECTION_META = {
  fx: {
    title: "FXエリア",
    description: "為替の基本から、ドル円、金利、経済指標、相場構造、ニュースの読み方までを段階的に学べる構成です。",
    badgeClass: "fx",
    badgeLabel: "FX"
  },
  crypto: {
    title: "暗号通貨エリア",
    description: "暗号資産の基礎、ブロックチェーン、主要銘柄、市場テーマ、プロジェクト分析、ニュースの読み方まで体系的に学べる構成です。",
    badgeClass: "crypto",
    badgeLabel: "CRYPTO"
  },
  common: {
    title: "共通知識",
    description: "FXと暗号通貨の両方に共通する考え方、ニュースの読み方、比較、リスク管理、情報整理の基礎をまとめています。",
    badgeClass: "common",
    badgeLabel: "COMMON"
  },
  guide: {
    title: "実用ガイド",
    description: "理解だけで終わらず、学習を継続するための実務的なガイドをまとめています。",
    badgeClass: "guide",
    badgeLabel: "GUIDE"
  }
};

const BADGE_CLASS_BY_CATEGORY = {
  "FX基礎": "fx",
  "ドル円": "fx",
  "為替の仕組み": "fx",
  "相場構造": "fx",
  "FXニュース": "fx",
  "暗号資産基礎": "crypto",
  "ブロックチェーン": "crypto",
  "主要銘柄": "crypto",
  "市場テーマ": "crypto",
  "プロジェクト分析": "crypto",
  "暗号資産ニュース": "crypto",
  "共通知識": "common",
  "実用ガイド": "guide",
  "導入": "guide",
  "基礎": "crypto",
  "技術": "crypto",
  "テーマ": "crypto",
  "ニュース": "fx",
  "共通": "common"
};

function ensureDir(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function escapeHtml(str = "") {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function filePathToCanonical(relativePath) {
  return `${SITE_URL}/${relativePath.replace(/\\/g, "/")}`;
}

function toPosix(p) {
  return String(p).replace(/\\/g, "/");
}

function getRelativeLink(fromFilePath, toFilePath) {
  const fromDir = path.dirname(fromFilePath);
  return toPosix(path.relative(fromDir, toFilePath));
}

function normalizeArrayExport(value, exportName) {
  if (!Array.isArray(value)) {
    throw new Error(`${exportName} は配列である必要があります。`);
  }
  return value;
}

function indexBy(arr, keyName) {
  const map = new Map();
  for (const item of arr) {
    const key = item?.[keyName];
    if (!key) {
      throw new Error(`${keyName} が未設定の項目があります。`);
    }
    if (map.has(key)) {
      throw new Error(`${keyName} が重複しています: ${key}`);
    }
    map.set(key, item);
  }
  return map;
}

function getBadgeClass(page) {
  return BADGE_CLASS_BY_CATEGORY[page.category] || SECTION_META[page.section]?.badgeClass || "common";
}

function getBadgeLabel(page) {
  return page.category || SECTION_META[page.section]?.badgeLabel || "学習ページ";
}

function getParentPage(page, pageMap) {
  if (!page.parentId) return null;
  return pageMap.get(page.parentId) || null;
}

function validateData(pages, specs) {
  const pageMap = indexBy(pages, "id");
  const specMap = indexBy(specs, "id");

  for (const page of pages) {
    if (!page.title) throw new Error(`title が未設定です: ${page.id}`);
    if (!page.path) throw new Error(`path が未設定です: ${page.id}`);
    if (!page.section) throw new Error(`section が未設定です: ${page.id}`);
    if (!page.category) throw new Error(`category が未設定です: ${page.id}`);
    if (!page.type) throw new Error(`type が未設定です: ${page.id}`);

    if (page.parentId && !pageMap.has(page.parentId)) {
      throw new Error(`parentId が存在しません: ${page.id} -> ${page.parentId}`);
    }

    if (!specMap.has(page.id)) {
      throw new Error(`spec が存在しません: ${page.id}`);
    }
  }

  for (const spec of specs) {
    if (!pageMap.has(spec.id)) {
      throw new Error(`manifest に存在しない spec があります: ${spec.id}`);
    }

    const relatedPageIds = Array.isArray(spec.relatedPageIds) ? spec.relatedPageIds : [];
    for (const relatedId of relatedPageIds) {
      if (!pageMap.has(relatedId)) {
        throw new Error(`relatedPageIds に存在しない id があります: ${spec.id} -> ${relatedId}`);
      }
    }

    const mustSections = Array.isArray(spec.mustSections) ? spec.mustSections : [];
    if (mustSections.length === 0) {
      throw new Error(`mustSections が空です: ${spec.id}`);
    }
  }

  const pathSet = new Set();
  for (const page of pages) {
    if (pathSet.has(page.path)) {
      throw new Error(`path が重複しています: ${page.path}`);
    }
    pathSet.add(page.path);
  }

  return { pageMap, specMap };
}

function normalizeSpecs(spec) {
  return {
    id: spec.id,
    summary: spec.summary || spec.description || "",
    learningGoal: spec.learningGoal || "",
    lead: spec.lead || spec.summary || spec.description || "",
    mustSections: Array.isArray(spec.mustSections) ? spec.mustSections : [],
    sectionBodies: spec.sectionBodies && typeof spec.sectionBodies === "object" ? spec.sectionBodies : {},
    keyPoints: Array.isArray(spec.keyPoints) ? spec.keyPoints : [],
    commonMistakes: Array.isArray(spec.commonMistakes) ? spec.commonMistakes : [],
    risks: Array.isArray(spec.risks) ? spec.risks : [],
    examples: Array.isArray(spec.examples) ? spec.examples : [],
    relatedPageIds: Array.isArray(spec.relatedPageIds) ? spec.relatedPageIds : [],
    affiliateStage: spec.affiliateStage || "none"
  };
}

function buildPageContentHtml(page, spec, pageMap) {
  const normalized = normalizeSpecs(spec);
  const sections = [];

  for (const heading of normalized.mustSections) {
    const body = normalized.sectionBodies[heading];
    if (body) {
      sections.push(`
        <h2>${escapeHtml(heading)}</h2>
        ${Array.isArray(body)
          ? body.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("")
          : `<p>${escapeHtml(body)}</p>`}
      `);
    } else {
      sections.push(`
        <h2>${escapeHtml(heading)}</h2>
        <p>${escapeHtml(`${page.title}について理解するうえで重要なポイントを整理するセクションです。`)}</p>
      `);
    }
  }

  if (normalized.keyPoints.length > 0) {
    sections.push(`
      <h2>押さえるべきポイント</h2>
      <ul>
        ${normalized.keyPoints.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
      </ul>
    `);
  }

  if (normalized.examples.length > 0) {
    sections.push(`
      <h2>具体例で理解する</h2>
      ${normalized.examples.map((item) => `<p>${escapeHtml(item)}</p>`).join("")}
    `);
  }

  if (normalized.commonMistakes.length > 0) {
    sections.push(`
      <h2>よくある誤解</h2>
      <ul>
        ${normalized.commonMistakes.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
      </ul>
    `);
  }

  if (normalized.risks.length > 0) {
    sections.push(`
      <h2>注意点とリスク</h2>
      <ul>
        ${normalized.risks.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
      </ul>
    `);
  }

  if (normalized.learningGoal) {
    sections.push(`
      <h2>このページで目指す理解</h2>
      <p>${escapeHtml(normalized.learningGoal)}</p>
    `);
  }

  const relatedPages = normalized.relatedPageIds
    .map((id) => pageMap.get(id))
    .filter(Boolean);

  const currentFilePath = page.path;
  const nextLinksHtml = relatedPages.length > 0
    ? `
      <div class="next-links">
        <h2>次に読むページ</h2>
        <ul>
          ${relatedPages.map((relatedPage) => {
            const relativeHref = getRelativeLink(currentFilePath, relatedPage.path);
            return `<li><a href="${relativeHref}">${escapeHtml(relatedPage.title)}</a></li>`;
          }).join("")}
        </ul>
      </div>
    `
    : "";

  return {
    lead: normalized.lead || page.description || "",
    bodyHtml: sections.join(""),
    nextLinksHtml
  };
}

function buildBreadcrumbHtml(page, pageMap) {
  const crumbs = [
    { title: "トップ", href: getRelativeLink(page.path, "index.html") },
    { title: "基礎知識", href: getRelativeLink(page.path, "basics/index.html") }
  ];

  const parentPage = getParentPage(page, pageMap);
  if (parentPage) {
    crumbs.push({
      title: parentPage.title,
      href: getRelativeLink(page.path, parentPage.path)
    });
  }

  const currentTitle = page.title;

  return `
    <nav class="breadcrumb">
      ${crumbs
        .map((crumb, index) => {
          if (index === 0) return `<a href="${crumb.href}">${escapeHtml(crumb.title)}</a>`;
          return `<span><a href="${crumb.href}">${escapeHtml(crumb.title)}</a></span>`;
        })
        .join("")}
      <span>${escapeHtml(currentTitle)}</span>
    </nav>
  `;
}

function renderPageHtml(page, spec, pageMap) {
  const { lead, bodyHtml, nextLinksHtml } = buildPageContentHtml(page, spec, pageMap);
  const parentPage = getParentPage(page, pageMap);
  const breadcrumbHtml = buildBreadcrumbHtml(page, pageMap);
  const canonical = filePathToCanonical(page.path);
  const badgeLabel = getBadgeLabel(page);

  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(page.title)}｜Macro Daily</title>
  <meta name="description" content="${escapeHtml((spec.summary || page.description || "").slice(0, 120))}" />
  <link rel="canonical" href="${canonical}" />
  <meta name="robots" content="index,follow" />
  <meta property="og:type" content="article" />
  <meta property="og:title" content="${escapeHtml(page.title)}｜Macro Daily" />
  <meta property="og:description" content="${escapeHtml((spec.summary || page.description || "").slice(0, 120))}" />
  <meta property="og:url" content="${canonical}" />
  <meta property="og:site_name" content="Macro Daily" />
  <meta name="twitter:card" content="summary" />
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    body {
      margin: 0;
      padding: 32px 16px 64px;
      font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      line-height: 1.8;
      background: #0b1120;
      color: #e5e7eb;
    }
    .container { max-width: 860px; margin: 0 auto; }
    a { color: #7dd3fc; text-decoration: none; }
    a:hover { text-decoration: underline; }
    .card-wrapper {
      background: rgba(15, 23, 42, 0.92);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 18px;
      padding: 28px;
    }
    .badge {
      display: inline-block;
      margin-bottom: 12px;
      padding: 4px 10px;
      border-radius: 999px;
      background: rgba(255,255,255,0.08);
      font-size: 12px;
      font-weight: 700;
      color: #94a3b8;
    }
    h1 { margin: 0 0 12px; font-size: 36px; line-height: 1.2; color: #f8fafc; }
    .lead { color: #94a3b8; font-size: 16px; margin-bottom: 24px; }
    h2 {
      margin-top: 32px; margin-bottom: 12px;
      font-size: 22px; color: #f8fafc;
      border-left: 4px solid #38bdf8; padding-left: 12px;
    }
    h3 { margin-top: 24px; margin-bottom: 8px; font-size: 18px; color: #e2e8f0; }
    p, li { color: #d1d5db; font-size: 16px; }
    ul { padding-left: 22px; }
    li { margin-bottom: 6px; }
    .next-links {
      margin-top: 40px; padding-top: 24px;
      border-top: 1px solid rgba(255,255,255,0.08);
    }
    .next-links h2 { border-left: 4px solid #a78bfa; }
    .next-links ul { list-style: none; padding: 0; }
    .next-links li { margin-bottom: 10px; }
    .next-links li::before { content: "→ "; color: #a78bfa; }
    .breadcrumb {
      display: flex; flex-wrap: wrap; gap: 6px;
      margin-bottom: 18px; font-size: 13px; color: #64748b;
    }
    .breadcrumb a { color: #7dd3fc; }
    .breadcrumb span::before { content: "/"; margin-right: 6px; }
  </style>
</head>
<body>
  <div class="container">
    ${breadcrumbHtml}
    <div class="card-wrapper">
      <div class="badge">${escapeHtml(badgeLabel)}</div>
      <h1>${escapeHtml(page.title)}</h1>
      <p class="lead">${escapeHtml(lead)}</p>
      ${bodyHtml}
      ${nextLinksHtml}
    </div>
  </div>
</body>
</html>`;
}

function renderKnowledgeIndex(pages) {
  const groupedBySection = {};
  for (const page of pages) {
    if (!groupedBySection[page.section]) groupedBySection[page.section] = [];
    groupedBySection[page.section].push(page);
  }

  const sectionOrder = ["fx", "crypto", "common", "guide"];

  const sectionHtml = sectionOrder
    .filter((section) => groupedBySection[section]?.length)
    .map((section) => {
      const meta = SECTION_META[section];
      const pagesInSection = groupedBySection[section];
      const parentPages = pagesInSection.filter((page) => page.type === "parent");
      const childPages = pagesInSection.filter((page) => page.type !== "parent").slice(0, 8);

      return `
        <section class="section" id="${section}-area">
          <div class="section-head">
            <div>
              <h2>${escapeHtml(meta.title)}</h2>
              <p>${escapeHtml(meta.description)}</p>
            </div>
            <div class="count">${pagesInSection.length}ページ</div>
          </div>

          <div class="parent-grid">
            ${parentPages
              .map((page) => `
                <a class="parent-card" href="./${escapeHtml(page.path.replace(/^basics\//, ""))}">
                  <div class="badge ${escapeHtml(meta.badgeClass)}">${escapeHtml(getBadgeLabel(page))}</div>
                  <h3>${escapeHtml(page.title)}</h3>
                  <p>${escapeHtml(page.description || "")}</p>
                </a>
              `)
              .join("")}
          </div>

          ${
            childPages.length > 0
              ? `
                <div class="child-group">
                  <h3>主要ページ</h3>
                  <div class="child-grid">
                    ${childPages
                      .map((page) => `
                        <a class="child-card" href="./${escapeHtml(page.path.replace(/^basics\//, ""))}">
                          <h3>${escapeHtml(page.title)}</h3>
                          <p>${escapeHtml(page.description || "")}</p>
                        </a>
                      `)
                      .join("")}
                  </div>
                </div>
              `
              : ""
          }
        </section>
      `;
    })
    .join("");

  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>基礎知識一覧｜Macro Daily</title>
  <meta name="description" content="FX・暗号通貨・共通知識・実用ガイドを体系的に学べる基礎知識一覧ページです。" />
  <link rel="canonical" href="${filePathToCanonical("basics/index.html")}" />
  <meta name="robots" content="index,follow" />
  <meta property="og:type" content="website" />
  <meta property="og:title" content="基礎知識一覧｜Macro Daily" />
  <meta property="og:description" content="FX・暗号通貨・共通知識・実用ガイドを体系的に学べる基礎知識一覧ページです。" />
  <meta property="og:url" content="${filePathToCanonical("basics/index.html")}" />
  <meta property="og:site_name" content="Macro Daily" />
  <meta name="twitter:card" content="summary" />
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #0b1120;
      --panel: rgba(15, 23, 42, 0.92);
      --panel-soft: rgba(255,255,255,0.04);
      --panel-border: rgba(255,255,255,0.08);
      --text: #e5e7eb;
      --text-soft: #94a3b8;
      --heading: #f8fafc;
      --accent: #7dd3fc;
      --accent-fx: #38bdf8;
      --accent-crypto: #a78bfa;
      --accent-common: #34d399;
      --accent-guide: #f59e0b;
    }

    * { box-sizing: border-box; }

    body {
      margin: 0;
      padding: 32px 16px 72px;
      font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      line-height: 1.8;
      background:
        radial-gradient(circle at top left, rgba(56, 189, 248, 0.10), transparent 28%),
        radial-gradient(circle at top right, rgba(167, 139, 250, 0.10), transparent 30%),
        linear-gradient(180deg, #020617 0%, #0b1120 100%);
        color: var(--text);
    }

    .container {
      max-width: 1180px;
      margin: 0 auto;
    }

    a {
      color: inherit;
      text-decoration: none;
    }

    .back {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 18px;
      color: var(--accent);
      font-weight: 700;
      font-size: 14px;
    }

    .hero,
    .section,
    .toc {
      background: var(--panel);
      border: 1px solid var(--panel-border);
      border-radius: 20px;
      padding: 28px;
      margin-bottom: 24px;
      box-shadow: 0 10px 28px rgba(0,0,0,0.20);
    }

    .hero {
      padding: 34px 28px;
    }

    .eyebrow {
      display: inline-block;
      margin-bottom: 12px;
      padding: 4px 10px;
      border-radius: 999px;
      background: rgba(255,255,255,0.08);
      color: var(--text-soft);
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    h1 {
      margin: 0 0 12px;
      font-size: clamp(34px, 5vw, 46px);
      line-height: 1.15;
      color: var(--heading);
      letter-spacing: -0.03em;
    }

    .hero p {
      margin: 0;
      color: var(--text-soft);
      font-size: 16px;
      max-width: 820px;
    }

    .hero-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-top: 22px;
    }

    .hero-actions a {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 10px 14px;
      border-radius: 999px;
      font-size: 14px;
      font-weight: 700;
      background: rgba(255,255,255,0.05);
      border: 1px solid var(--panel-border);
      color: var(--heading);
    }

    h2 {
      margin: 0 0 12px;
      font-size: 28px;
      color: var(--heading);
      letter-spacing: -0.02em;
    }

    .section-head {
      display: flex;
      flex-wrap: wrap;
      align-items: flex-start;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 18px;
    }

    .section-head p {
      margin: 0;
      color: var(--text-soft);
      font-size: 15px;
      max-width: 760px;
    }

    .count {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 72px;
      padding: 6px 10px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 800;
      letter-spacing: 0.04em;
      background: rgba(255,255,255,0.06);
      color: var(--text-soft);
    }

    .toc-grid,
    .parent-grid,
    .child-grid {
      display: grid;
      gap: 16px;
    }

    .toc-grid {
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    }

    .toc a {
      display: block;
      padding: 16px 18px;
      border-radius: 14px;
      background: var(--panel-soft);
      border: 1px solid var(--panel-border);
      transition: background 0.2s ease, transform 0.2s ease;
    }

    .toc strong {
      display: block;
      font-size: 16px;
      color: var(--heading);
      margin-bottom: 4px;
    }

    .toc span {
      color: var(--text-soft);
      font-size: 13px;
    }

    .parent-grid {
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      margin-bottom: 18px;
    }

    .parent-card,
    .child-card {
      display: block;
      padding: 18px;
      border-radius: 16px;
      background: var(--panel-soft);
      border: 1px solid var(--panel-border);
      transition: background 0.2s ease, transform 0.2s ease;
    }

    .parent-card h3,
    .child-card h3 {
      margin: 0 0 8px;
      color: var(--heading);
      line-height: 1.35;
      letter-spacing: -0.01em;
    }

    .parent-card p,
    .child-card p {
      margin: 0;
      color: var(--text-soft);
      font-size: 14px;
      line-height: 1.7;
    }

    .parent-card h3 {
      font-size: 20px;
    }

    .child-group {
      margin-top: 18px;
    }

    .child-group h3 {
      margin: 0 0 12px;
      font-size: 18px;
      color: var(--heading);
    }

    .child-grid {
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    }

    .badge {
      display: inline-block;
      margin-bottom: 10px;
      padding: 4px 10px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      border: 1px solid var(--panel-border);
    }

    .fx { color: var(--accent-fx); background: rgba(56, 189, 248, 0.12); }
    .crypto { color: var(--accent-crypto); background: rgba(167, 139, 250, 0.14); }
    .common { color: var(--accent-common); background: rgba(52, 211, 153, 0.12); }
    .guide { color: var(--accent-guide); background: rgba(245, 158, 11, 0.14); }

    .note {
      margin-top: 20px;
      padding: 14px 16px;
      border-radius: 14px;
      background: rgba(125, 211, 252, 0.08);
      border: 1px solid rgba(125, 211, 252, 0.16);
      color: #cbd5e1;
      font-size: 14px;
    }

    @media (max-width: 640px) {
      .hero, .section, .toc {
        padding: 22px;
      }

      h2 {
        font-size: 24px;
      }

      .parent-card h3 {
        font-size: 18px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <a class="back" href="../index.html">← トップへ戻る</a>

    <section class="hero">
      <div class="eyebrow">Knowledge Map</div>
      <h1>基礎知識一覧</h1>
      <p>
        Macro Daily の学習ページを、FX・暗号通貨・共通知識・実用ガイドに分けて整理しています。
        まずは親ページで全体像をつかみ、そのあと個別テーマへ進む流れがおすすめです。
      </p>
      <div class="hero-actions">
        <a href="#fx-area">FXエリアを見る</a>
        <a href="#crypto-area">暗号通貨エリアを見る</a>
        <a href="#common-area">共通知識を見る</a>
        <a href="#guide-area">実用ガイドを見る</a>
      </div>
    </section>

    <section class="toc">
      <div class="section-head">
        <div>
          <h2>学習マップ</h2>
          <p>最初に全体像を見てから、気になる分野へ進めるように整理しています。</p>
        </div>
      </div>
      <div class="toc-grid">
        <a href="#fx-area">
          <strong>FXエリア</strong>
          <span>基礎 / ドル円 / 為替の仕組み / 相場構造 / FXニュース</span>
        </a>
        <a href="#crypto-area">
          <strong>暗号通貨エリア</strong>
          <span>基礎 / ブロックチェーン / 主要銘柄 / 市場テーマ / プロジェクト分析</span>
        </a>
        <a href="#common-area">
          <strong>共通知識</strong>
          <span>ニュースの読み方 / 比較 / リスク管理 / 情報整理</span>
        </a>
        <a href="#guide-area">
          <strong>実用ガイド</strong>
          <span>口座・取引所選び / ウォレット / 学習習慣 / ニュース学習ルーティン</span>
        </a>
      </div>
      <div class="note">
        この一覧は manifest をもとに自動生成しています。ページ名・ファイル名・導線をズレにくくするため、今後は manifest を正本として管理します。
      </div>
    </section>

    ${sectionHtml}
  </div>
</body>
</html>`;
}

function writeFile(filePath, content) {
  ensureDir(filePath);
  fs.writeFileSync(filePath, content, "utf-8");
}

function main() {
  const pages = normalizeArrayExport(knowledgePages, "knowledgePages");
  const specs = normalizeArrayExport(knowledgePageSpecs, "knowledgePageSpecs");

  const { pageMap, specMap } = validateData(pages, specs);

  const basicsIndexHtml = renderKnowledgeIndex(pages);
  writeFile(BASICS_INDEX_PATH, basicsIndexHtml);
  console.log(`Saved ${BASICS_INDEX_PATH}`);

  for (const page of pages) {
    const spec = specMap.get(page.id);
    const html = renderPageHtml(page, spec, pageMap);
    writeFile(page.path, html);
    console.log(`Saved ${page.path}`);
  }

  console.log("Knowledge pages build completed.");
}

main();
