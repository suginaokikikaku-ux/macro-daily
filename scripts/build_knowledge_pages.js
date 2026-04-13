// scripts/build_knowledge_pages.js

import fs from "fs";
import path from "path";
import { knowledgePages } from "./knowledge_pages_manifest.js";
import { knowledgePageSpecs } from "./knowledge_page_specs.js";

const SITE_URL = (
  process.env.SITE_URL ||
  "https://suginaokikikaku-ux.github.io/fx-crypto-news"
).replace(/\/$/, "");

const OUTPUT_ROOT = ".";
const BASICS_INDEX_PATH = path.join(OUTPUT_ROOT, "basics", "index.html");

const SECTION_META = {
  fx: {
    title: "FXエリア",
    description:
      "為替の基本から、ドル円、金利、経済指標、相場構造、ニュースの読み方までを段階的に学べる構成です。",
    badgeClass: "fx",
    badgeLabel: "FX",
  },
  crypto: {
    title: "暗号通貨エリア",
    description:
      "暗号資産の基礎、ブロックチェーン、主要銘柄、市場テーマ、プロジェクト分析、ニュースの読み方まで体系的に学べる構成です。",
    badgeClass: "crypto",
    badgeLabel: "CRYPTO",
  },
  common: {
    title: "共通知識",
    description:
      "FXと暗号通貨の両方に共通する考え方、ニュースの読み方、比較、リスク管理、情報整理の基礎をまとめています。",
    badgeClass: "common",
    badgeLabel: "COMMON",
  },
  guide: {
    title: "実用ガイド",
    description:
      "理解だけで終わらず、学習を継続するための実務的なガイドをまとめています。",
    badgeClass: "guide",
    badgeLabel: "GUIDE",
  },
};

const BADGE_CLASS_BY_CATEGORY = {
  FX基礎: "fx",
  ドル円: "fx",
  為替の仕組み: "fx",
  相場構造: "fx",
  FXニュース: "fx",
  暗号資産基礎: "crypto",
  ブロックチェーン: "crypto",
  主要銘柄: "crypto",
  市場テーマ: "crypto",
  プロジェクト分析: "crypto",
  暗号資産ニュース: "crypto",
  共通知識: "common",
  実用ガイド: "guide",
  導入: "guide",
  基礎: "crypto",
  技術: "crypto",
  テーマ: "crypto",
  ニュース: "fx",
  共通: "common",
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

function toPosix(p) {
  return String(p).replace(/\\/g, "/");
}

function filePathToCanonical(relativePath) {
  return `${SITE_URL}/${toPosix(relativePath)}`;
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
  return (
    BADGE_CLASS_BY_CATEGORY[page.category] ||
    SECTION_META[page.section]?.badgeClass ||
    "common"
  );
}

function getBadgeLabel(page) {
  return page.category || SECTION_META[page.section]?.badgeLabel || "学習ページ";
}

function getParentPage(page, pageMap) {
  if (!page.parentId) return null;
  return pageMap.get(page.parentId) || null;
}

function getChildren(pageId, pages) {
  return pages.filter((page) => page.parentId === pageId);
}

function getGrandChildren(childId, pages) {
  return pages.filter((page) => page.parentId === childId);
}

function normalizeSpec(spec = {}) {
  return {
    id: spec.id || "",
    summary: spec.summary || spec.description || "",
    lead: spec.lead || spec.summary || spec.description || "",
    learningGoal: spec.learningGoal || "",
    mustSections: Array.isArray(spec.mustSections) ? spec.mustSections : [],
    sectionBodies:
      spec.sectionBodies && typeof spec.sectionBodies === "object"
        ? spec.sectionBodies
        : {},
    keyPoints: Array.isArray(spec.keyPoints) ? spec.keyPoints : [],
    commonMistakes: Array.isArray(spec.commonMistakes) ? spec.commonMistakes : [],
    risks: Array.isArray(spec.risks) ? spec.risks : [],
    examples: Array.isArray(spec.examples) ? spec.examples : [],
    relatedPageIds: Array.isArray(spec.relatedPageIds) ? spec.relatedPageIds : [],
    diagram:
      spec.diagram && typeof spec.diagram === "object"
        ? spec.diagram
        : null,
  };
}

function buildAutoSpec(page, pageMap) {
  const parentPage = page.parentId ? pageMap.get(page.parentId) : null;

  const baseSummary =
    page.description ||
    `${page.title}について初心者向けに整理する学習ページです。`;

  const lead = parentPage
    ? `${page.title}は、${parentPage.title}の中で理解しておきたい基本テーマです。このページでは、初心者が全体像をつかめるように、意味・背景・具体例・注意点の順で整理します。`
    : `${page.title}の全体像を初心者向けに整理するページです。まず結論を押さえたうえで、仕組み・見方・具体例・注意点を順番に確認できる構成にしています。`;

  return {
    id: page.id,
    summary: baseSummary,
    lead,
    learningGoal: `${page.title}の基本を説明できる状態にする。`,
    mustSections:
      page.type === "parent"
        ? [
            `${page.title}の全体像`,
            "最初に押さえるべきポイント",
            "よくある誤解",
            "次に学ぶべきこと",
          ]
        : page.type === "child"
          ? [
              `${page.title}とは何か`,
              "なぜ重要なのか",
              "具体例で理解する",
              "注意点",
            ]
          : [
              `${page.title}の基本`,
              "具体例",
              "注意点と見方",
            ],
    sectionBodies:
      page.type === "parent"
        ? {
            [`${page.title}の全体像`]: [
              `${page.title}は、このカテゴリ全体を理解するための入口です。まずは個別の用語を暗記するよりも、どんな論点がつながっているのかを全体でつかむことが大切です。`,
              "つまり、このページは学習の地図として使うのが適しています。",
            ],
            "最初に押さえるべきポイント": [
              "初心者は、細かい例外よりも基本構造を先に理解した方が整理しやすくなります。",
              "つまり、最初は意味・背景・使われ方の3つを押さえるのが近道です。",
            ],
            "よくある誤解": [
              "最初から細部だけを追いかけると、全体像が見えにくくなります。",
              "つまり、親ページでは細かさより流れを優先して理解するのが重要です。",
            ],
            "次に学ぶべきこと": [
              "このページで全体像をつかんだら、次は関連する子ページで個別テーマを順番に確認していくのが自然です。",
              "つまり、親ページは入口であり、子ページで理解を深める設計です。",
            ],
          }
        : page.type === "child"
          ? {
              [`${page.title}とは何か`]: [
                `${page.title}は、このカテゴリの中でも基礎となるテーマです。まずは用語の意味と、どんな場面で使われるかを整理することが大切です。`,
                "つまり、定義と役割をセットで理解すると整理しやすくなります。",
              ],
              "なぜ重要なのか": [
                "このテーマを理解しておくと、ニュースや関連ページの意味がつながりやすくなります。",
                "つまり、単独の知識ではなく、他の概念を理解する土台になります。",
              ],
              "具体例で理解する": [
                "抽象的な説明だけではイメージしにくいため、実際のニュースや市場の文脈に当てはめて考えることが有効です。",
                "つまり、具体例に置き換えると理解が定着しやすくなります。",
              ],
              "注意点": [
                "言葉だけを覚えても、背景や文脈を見ないと誤解しやすくなります。",
                "つまり、意味と使われ方を一緒に確認することが重要です。",
              ],
            }
          : {
              [`${page.title}の基本`]: [
                `${page.title}は、親テーマを細かく理解するための詳細トピックです。まずは定義と位置づけを押さえると整理しやすくなります。`,
                "つまり、孫ページでは用語を深掘りして理解するのが目的です。",
              ],
              "具体例": [
                "具体的な場面に当てはめて考えると、用語の意味が抽象論で終わりにくくなります。",
                "つまり、実例と一緒に覚えると理解しやすくなります。",
              ],
              "注意点と見方": [
                "細かい言葉ほど単独で覚えると誤解しやすいため、必ず親テーマとのつながりで見ることが大切です。",
                "つまり、孫ページは単体ではなく流れの中で読むのが基本です。",
              ],
            },
    keyPoints: [
      `${page.title}はカテゴリ理解の一部として見る`,
      "意味だけでなく背景も一緒に押さえる",
      "具体例で理解する",
      "関連ページとつなげて読む",
    ],
    commonMistakes: [
      "言葉だけ覚えて背景を見ない",
      "単独ページとして見て流れを意識しない",
    ],
    risks: [
      "定義だけで理解した気になると、ニュースや関連テーマで誤読しやすくなります。",
    ],
    examples: [
      `${page.title}を実際のニュースや市場文脈に当てはめて考えると理解しやすくなります。`,
    ],
    relatedPageIds: parentPage ? [parentPage.id] : [],
    diagram: null,
  };
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

    if (!["parent", "child", "grandchild"].includes(page.type)) {
      throw new Error(`type が不正です: ${page.id} -> ${page.type}`);
    }

    if ((page.type === "child" || page.type === "grandchild") && !page.parentId) {
      throw new Error(`parentId が必要です: ${page.id}`);
    }

    if (page.parentId && !pageMap.has(page.parentId)) {
      throw new Error(`parentId が存在しません: ${page.id} -> ${page.parentId}`);
    }
  }

  const pathSet = new Set();
  for (const page of pages) {
    if (pathSet.has(page.path)) {
      throw new Error(`path が重複しています: ${page.path}`);
    }
    pathSet.add(page.path);
  }

  for (const spec of specs) {
    if (!pageMap.has(spec.id)) {
      throw new Error(`manifest に存在しない spec があります: ${spec.id}`);
    }

    const relatedPageIds = Array.isArray(spec.relatedPageIds)
      ? spec.relatedPageIds
      : [];

    for (const relatedId of relatedPageIds) {
      if (!pageMap.has(relatedId)) {
        throw new Error(
          `relatedPageIds に存在しない id があります: ${spec.id} -> ${relatedId}`
        );
      }
    }
  }

  return { pageMap, specMap };
}

function buildBreadcrumbHtml(page, pageMap) {
  const crumbs = [
    { title: "トップ", href: getRelativeLink(page.path, "index.html") },
    { title: "基礎知識", href: getRelativeLink(page.path, "basics/index.html") },
  ];

  const parentPage = getParentPage(page, pageMap);
  if (parentPage) {
    crumbs.push({
      title: parentPage.title,
      href: getRelativeLink(page.path, parentPage.path),
    });

    const grandParent = getParentPage(parentPage, pageMap);
    if (grandParent) {
      crumbs.splice(2, 0, {
        title: grandParent.title,
        href: getRelativeLink(page.path, grandParent.path),
      });
    }
  }

  return `
    <nav class="breadcrumb">
      ${crumbs
        .map((crumb, index) =>
          index === 0
            ? `<a href="${crumb.href}">${escapeHtml(crumb.title)}</a>`
            : `<span><a href="${crumb.href}">${escapeHtml(crumb.title)}</a></span>`
        )
        .join("")}
      <span>${escapeHtml(page.title)}</span>
    </nav>
  `;
}

function renderParagraphBlock(body, fallback = "") {
  if (!body) return `<p>${escapeHtml(fallback)}</p>`;

  if (Array.isArray(body)) {
    return body.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("");
  }

  return `<p>${escapeHtml(body)}</p>`;
}

function buildBaseSections(page, spec) {
  const normalized = normalizeSpec(spec);
  const sections = [];

  for (const heading of normalized.mustSections) {
    const body = normalized.sectionBodies[heading];
    sections.push(`
      <h2>${escapeHtml(heading)}</h2>
      ${renderParagraphBlock(
        body,
        `${page.title}について理解するうえで重要なポイントを整理するセクションです。`
      )}
    `);
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

  return {
    lead: normalized.lead || page.description || "",
    bodyHtml: sections.join(""),
    normalized,
  };
}

function buildCardGridHtml(currentPage, pages) {
  if (!pages.length) return "";

  return `
    <div class="grid">
      ${pages
        .map((page) => {
          const href = getRelativeLink(currentPage.path, page.path);
          return `
            <a href="${href}">
              <h3>${escapeHtml(page.title)}</h3>
              <p>${escapeHtml(page.description || "")}</p>
            </a>
          `;
        })
        .join("")}
    </div>
  `;
}

function uniquePagesById(pages) {
  const seen = new Set();
  return pages.filter((page) => {
    if (!page || seen.has(page.id)) return false;
    seen.add(page.id);
    return true;
  });
}

function buildNextLinksHtml(currentPage, candidates) {
  const pages = uniquePagesById(candidates).filter(
    (page) => page.id !== currentPage.id
  );

  if (!pages.length) return "";

  return `
    <div class="next-links">
      <h2>次に読むページ</h2>
      <ul>
        ${pages
          .map((page) => {
            const href = getRelativeLink(currentPage.path, page.path);
            return `<li><a href="${href}">${escapeHtml(page.title)}</a></li>`;
          })
          .join("")}
      </ul>
    </div>
  `;
}

function renderDiagramTitle(diagram) {
  if (!diagram?.title) return "";
  return `<div class="diagram-title">${escapeHtml(diagram.title)}</div>`;
}

function renderDiagramNote(diagram) {
  if (!diagram?.note) return "";
  return `<p class="diagram-note">${escapeHtml(diagram.note)}</p>`;
}

function renderFlowDiagram(diagram) {
  const items = Array.isArray(diagram.items) ? diagram.items : [];
  if (!items.length) return "";

  return `
    <div class="diagram-flow-row">
      ${items
        .map((item, index) => {
          const label =
            typeof item === "string" ? item : item?.label || "";
          const sublabel =
            typeof item === "string" ? "" : item?.sublabel || "";
          const accent =
            typeof item === "string" ? "" : item?.accent || "";
          const arrow =
            index < items.length - 1
              ? `<div class="diagram-flow-arrow">→</div>`
              : "";

          return `
            <div class="diagram-flow-group">
              <div class="diagram-flow-card ${escapeHtml(accent)}">
                <div class="diagram-flow-label">${escapeHtml(label)}</div>
                ${
                  sublabel
                    ? `<div class="diagram-flow-sublabel">${escapeHtml(sublabel)}</div>`
                    : ""
                }
              </div>
              ${arrow}
            </div>
          `;
        })
        .join("")}
    </div>
  `;
}

function renderComparisonDiagram(diagram) {
  const columns = Array.isArray(diagram.columns) ? diagram.columns : [];
  if (!columns.length) return "";

  return `
    <div class="diagram-compare-grid">
      ${columns
        .map((col) => {
          const title = col?.title || "";
          const points = Array.isArray(col?.points) ? col.points : [];
          const accent = col?.accent || "";
          return `
            <div class="diagram-compare-card ${escapeHtml(accent)}">
              <div class="diagram-compare-title">${escapeHtml(title)}</div>
              <ul class="diagram-compare-list">
                ${points.map((point) => `<li>${escapeHtml(point)}</li>`).join("")}
              </ul>
            </div>
          `;
        })
        .join("")}
    </div>
  `;
}

function renderStepsDiagram(diagram) {
  const steps = Array.isArray(diagram.steps) ? diagram.steps : [];
  if (!steps.length) return "";

  return `
    <div class="diagram-steps">
      ${steps
        .map((step, index) => {
          const title =
            typeof step === "string" ? step : step?.title || "";
          const desc =
            typeof step === "string" ? "" : step?.desc || "";
          return `
            <div class="diagram-step">
              <div class="diagram-step-number">${index + 1}</div>
              <div class="diagram-step-body">
                <div class="diagram-step-title">${escapeHtml(title)}</div>
                ${
                  desc
                    ? `<div class="diagram-step-desc">${escapeHtml(desc)}</div>`
                    : ""
                }
              </div>
            </div>
          `;
        })
        .join("")}
    </div>
  `;
}

function renderCurrencyPairSvg(diagram) {
  const left = diagram?.left || "USD";
  const right = diagram?.right || "JPY";
  const leftLabel = diagram?.leftLabel || "ベース通貨";
  const rightLabel = diagram?.rightLabel || "クオート通貨";

  return `
    <svg viewBox="0 0 640 150" width="100%" role="img" aria-label="${escapeHtml(
      `${left}/${right} の構造図`
    )}" class="diagram-svg">
      <rect x="40" y="34" width="210" height="64" rx="14" fill="rgba(56,189,248,0.15)" stroke="rgba(56,189,248,0.40)" />
      <text x="145" y="72" text-anchor="middle" fill="#f8fafc" font-size="24" font-weight="700">${escapeHtml(left)}</text>
      <text x="145" y="120" text-anchor="middle" fill="#94a3b8" font-size="14">${escapeHtml(leftLabel)}</text>

      <text x="320" y="80" text-anchor="middle" fill="#7dd3fc" font-size="30" font-weight="800">/</text>

      <rect x="390" y="34" width="210" height="64" rx="14" fill="rgba(167,139,250,0.15)" stroke="rgba(167,139,250,0.40)" />
      <text x="495" y="72" text-anchor="middle" fill="#f8fafc" font-size="24" font-weight="700">${escapeHtml(right)}</text>
      <text x="495" y="120" text-anchor="middle" fill="#94a3b8" font-size="14">${escapeHtml(rightLabel)}</text>
    </svg>
  `;
}

function renderLeverageSvg() {
  return `
    <svg viewBox="0 0 720 200" width="100%" role="img" aria-label="レバレッジのイメージ図" class="diagram-svg">
      <rect x="40" y="60" width="180" height="80" rx="16" fill="rgba(56,189,248,0.14)" stroke="rgba(56,189,248,0.40)" />
      <text x="130" y="98" text-anchor="middle" fill="#f8fafc" font-size="24" font-weight="700">自己資金</text>
      <text x="130" y="126" text-anchor="middle" fill="#94a3b8" font-size="14">手元の資金</text>

      <text x="290" y="108" text-anchor="middle" fill="#7dd3fc" font-size="36" font-weight="800">→</text>

      <rect x="370" y="40" width="300" height="120" rx="16" fill="rgba(167,139,250,0.14)" stroke="rgba(167,139,250,0.40)" />
      <text x="520" y="94" text-anchor="middle" fill="#f8fafc" font-size="24" font-weight="700">より大きな取引金額</text>
      <text x="520" y="124" text-anchor="middle" fill="#94a3b8" font-size="14">値動きの影響も大きくなる</text>
    </svg>
  `;
}

function renderRateImpactSvg() {
  return `
    <svg viewBox="0 0 760 220" width="100%" role="img" aria-label="金利と為替の関係図" class="diagram-svg">
      <rect x="40" y="70" width="180" height="72" rx="16" fill="rgba(56,189,248,0.14)" stroke="rgba(56,189,248,0.40)" />
      <text x="130" y="108" text-anchor="middle" fill="#f8fafc" font-size="24" font-weight="700">利上げ観測</text>
      <text x="130" y="134" text-anchor="middle" fill="#94a3b8" font-size="14">金利が高くなる期待</text>

      <text x="286" y="110" text-anchor="middle" fill="#7dd3fc" font-size="34" font-weight="800">→</text>

      <rect x="320" y="70" width="180" height="72" rx="16" fill="rgba(56,189,248,0.10)" stroke="rgba(56,189,248,0.28)" />
      <text x="410" y="108" text-anchor="middle" fill="#f8fafc" font-size="22" font-weight="700">通貨が意識される</text>
      <text x="410" y="134" text-anchor="middle" fill="#94a3b8" font-size="14">魅力が相対的に上がる</text>

      <text x="566" y="110" text-anchor="middle" fill="#7dd3fc" font-size="34" font-weight="800">→</text>

      <rect x="580" y="70" width="140" height="72" rx="16" fill="rgba(16,185,129,0.14)" stroke="rgba(16,185,129,0.35)" />
      <text x="650" y="108" text-anchor="middle" fill="#f8fafc" font-size="22" font-weight="700">通貨高</text>
      <text x="650" y="134" text-anchor="middle" fill="#94a3b8" font-size="14">買われやすい</text>
    </svg>
  `;
}

function renderBlockchainSvg() {
  return `
    <svg viewBox="0 0 760 180" width="100%" role="img" aria-label="ブロックチェーンの基本図" class="diagram-svg">
      <rect x="30" y="60" width="150" height="60" rx="14" fill="rgba(56,189,248,0.14)" stroke="rgba(56,189,248,0.38)" />
      <text x="105" y="96" text-anchor="middle" fill="#f8fafc" font-size="20" font-weight="700">Block 1</text>

      <line x1="180" y1="90" x2="260" y2="90" stroke="rgba(125,211,252,0.7)" stroke-width="4" />
      <polygon points="260,90 248,82 248,98" fill="rgba(125,211,252,0.9)" />

      <rect x="280" y="60" width="150" height="60" rx="14" fill="rgba(167,139,250,0.14)" stroke="rgba(167,139,250,0.38)" />
      <text x="355" y="96" text-anchor="middle" fill="#f8fafc" font-size="20" font-weight="700">Block 2</text>

      <line x1="430" y1="90" x2="510" y2="90" stroke="rgba(125,211,252,0.7)" stroke-width="4" />
      <polygon points="510,90 498,82 498,98" fill="rgba(125,211,252,0.9)" />

      <rect x="530" y="60" width="150" height="60" rx="14" fill="rgba(52,211,153,0.14)" stroke="rgba(52,211,153,0.35)" />
      <text x="605" y="96" text-anchor="middle" fill="#f8fafc" font-size="20" font-weight="700">Block 3</text>
    </svg>
  `;
}

function renderDefiSvg() {
  return `
    <svg viewBox="0 0 760 240" width="100%" role="img" aria-label="DeFiの構造図" class="diagram-svg">
      <rect x="60" y="90" width="160" height="64" rx="16" fill="rgba(56,189,248,0.14)" stroke="rgba(56,189,248,0.38)" />
      <text x="140" y="126" text-anchor="middle" fill="#f8fafc" font-size="22" font-weight="700">ユーザー</text>

      <line x1="220" y1="122" x2="320" y2="122" stroke="rgba(125,211,252,0.7)" stroke-width="4" />
      <polygon points="320,122 308,114 308,130" fill="rgba(125,211,252,0.9)" />

      <rect x="330" y="60" width="180" height="124" rx="16" fill="rgba(167,139,250,0.14)" stroke="rgba(167,139,250,0.38)" />
      <text x="420" y="108" text-anchor="middle" fill="#f8fafc" font-size="22" font-weight="700">スマート</text>
      <text x="420" y="136" text-anchor="middle" fill="#f8fafc" font-size="22" font-weight="700">コントラクト</text>

      <line x1="510" y1="122" x2="610" y2="122" stroke="rgba(125,211,252,0.7)" stroke-width="4" />
      <polygon points="610,122 598,114 598,130" fill="rgba(125,211,252,0.9)" />

      <rect x="620" y="90" width="100" height="64" rx="16" fill="rgba(52,211,153,0.14)" stroke="rgba(52,211,153,0.35)" />
      <text x="670" y="126" text-anchor="middle" fill="#f8fafc" font-size="20" font-weight="700">DEX</text>
    </svg>
  `;
}

function renderDiagramHtml(diagram) {
  if (!diagram || typeof diagram !== "object") return "";

  const type = diagram.type || "";
  let inner = "";

  switch (type) {
    case "flow":
    case "currency-flow":
      inner = renderFlowDiagram(diagram);
      break;
    case "comparison":
      inner = renderComparisonDiagram(diagram);
      break;
    case "steps":
      inner = renderStepsDiagram(diagram);
      break;
    case "pair-structure":
      inner = renderCurrencyPairSvg(diagram);
      break;
    case "leverage-basic":
      inner = renderLeverageSvg();
      break;
    case "rate-impact":
      inner = renderRateImpactSvg();
      break;
    case "blockchain-basic":
      inner = renderBlockchainSvg();
      break;
    case "defi-basic":
      inner = renderDefiSvg();
      break;
    default:
      return "";
  }

  if (!inner) return "";

  return `
    <div class="diagram-box">
      ${renderDiagramTitle(diagram)}
      ${inner}
      ${renderDiagramNote(diagram)}
    </div>
  `;
}

function renderParentPageBody(page, spec, pages, pageMap) {
  const { lead, bodyHtml, normalized } = buildBaseSections(page, spec);
  const children = getChildren(page.id, pages);
  const childCards = buildCardGridHtml(page, children);

  const nextCandidates = [
    ...children,
    ...normalized.relatedPageIds.map((id) => pageMap.get(id)).filter(Boolean),
  ];

  return {
    lead,
    diagramHtml: renderDiagramHtml(normalized.diagram),
    bodyHtml: `
      ${bodyHtml}
      ${children.length ? `<h2>このカテゴリで読めるページ</h2>${childCards}` : ""}
    `,
    nextLinksHtml: buildNextLinksHtml(page, nextCandidates),
  };
}

function renderChildPageBody(page, spec, pages, pageMap) {
  const { lead, bodyHtml, normalized } = buildBaseSections(page, spec);
  const grandChildren = getGrandChildren(page.id, pages);
  const parentPage = getParentPage(page, pageMap);

  const grandChildListHtml = grandChildren.length
    ? `
      <h2>関連する詳細ページ</h2>
      <ul>
        ${grandChildren
          .map((child) => {
            const href = getRelativeLink(page.path, child.path);
            return `<li><a href="${href}">${escapeHtml(child.title)}</a></li>`;
          })
          .join("")}
      </ul>
    `
    : "";

  const nextCandidates = [
    ...grandChildren,
    parentPage,
    ...normalized.relatedPageIds.map((id) => pageMap.get(id)).filter(Boolean),
  ];

  return {
    lead,
    diagramHtml: renderDiagramHtml(normalized.diagram),
    bodyHtml: `${bodyHtml}${grandChildListHtml}`,
    nextLinksHtml: buildNextLinksHtml(page, nextCandidates),
  };
}

function renderGrandChildPageBody(page, spec, pages, pageMap) {
  const { lead, bodyHtml, normalized } = buildBaseSections(page, spec);
  const parentPage = getParentPage(page, pageMap);
  const siblingGrandChildren = parentPage
    ? getGrandChildren(parentPage.id, pages).filter((item) => item.id !== page.id)
    : [];

  const nextCandidates = [
    parentPage,
    ...siblingGrandChildren,
    ...normalized.relatedPageIds.map((id) => pageMap.get(id)).filter(Boolean),
  ];

  return {
    lead,
    diagramHtml: renderDiagramHtml(normalized.diagram),
    bodyHtml,
    nextLinksHtml: buildNextLinksHtml(page, nextCandidates),
  };
}

function getPageRenderPayload(page, spec, pages, pageMap) {
  if (page.type === "parent") {
    return renderParentPageBody(page, spec, pages, pageMap);
  }

  if (page.type === "child") {
    return renderChildPageBody(page, spec, pages, pageMap);
  }

  return renderGrandChildPageBody(page, spec, pages, pageMap);
}

function renderPageHtml(page, spec, pages, pageMap) {
  const { lead, diagramHtml, bodyHtml, nextLinksHtml } = getPageRenderPayload(
    page,
    spec,
    pages,
    pageMap
  );
  const canonical = filePathToCanonical(page.path);
  const badgeLabel = getBadgeLabel(page);
  const badgeClass = getBadgeClass(page);
  const breadcrumbHtml = buildBreadcrumbHtml(page, pageMap);
  const description = (spec.summary || page.description || "").slice(0, 120);

  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(page.title)}｜Macro Daily</title>
  <meta name="description" content="${escapeHtml(description)}" />
  <link rel="canonical" href="${canonical}" />
  <meta name="robots" content="index,follow" />
  <meta property="og:type" content="article" />
  <meta property="og:title" content="${escapeHtml(page.title)}｜Macro Daily" />
  <meta property="og:description" content="${escapeHtml(description)}" />
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
      border: 1px solid rgba(255,255,255,0.08);
    }
    .badge.fx { color: #7dd3fc; }
    .badge.crypto { color: #c4b5fd; }
    .badge.common { color: #6ee7b7; }
    .badge.guide { color: #fbbf24; }

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

    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 16px;
      margin-top: 20px;
    }
    .grid a {
      display: block;
      padding: 18px;
      border-radius: 14px;
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.08);
      color: inherit;
      transition: background 0.2s ease;
    }
    .grid a:hover {
      background: rgba(255,255,255,0.08);
      text-decoration: none;
    }
    .grid a h3 {
      margin: 0 0 8px;
      font-size: 18px;
      color: #f8fafc;
    }
    .grid a p {
      margin: 0;
      color: #94a3b8;
      font-size: 14px;
    }

    .diagram-box {
      margin: 28px 0 8px;
      padding: 20px;
      border-radius: 16px;
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.08);
      overflow-x: auto;
    }
    .diagram-title {
      font-size: 14px;
      font-weight: 700;
      color: #94a3b8;
      margin-bottom: 14px;
      letter-spacing: 0.02em;
    }
    .diagram-note {
      margin: 14px 0 0;
      font-size: 14px;
      color: #94a3b8;
    }
    .diagram-flow-row {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 14px;
      flex-wrap: wrap;
    }
    .diagram-flow-group {
      display: flex;
      align-items: center;
      gap: 14px;
    }
    .diagram-flow-card {
      min-width: 140px;
      padding: 14px 18px;
      border-radius: 12px;
      background: rgba(56,189,248,0.10);
      border: 1px solid rgba(56,189,248,0.25);
      text-align: center;
    }
    .diagram-flow-card.purple {
      background: rgba(167,139,250,0.12);
      border-color: rgba(167,139,250,0.30);
    }
    .diagram-flow-card.green {
      background: rgba(16,185,129,0.12);
      border-color: rgba(16,185,129,0.28);
    }
    .diagram-flow-card.orange {
      background: rgba(245,158,11,0.12);
      border-color: rgba(245,158,11,0.28);
    }
    .diagram-flow-label {
      font-size: 17px;
      font-weight: 700;
      color: #f8fafc;
      line-height: 1.3;
    }
    .diagram-flow-sublabel {
      margin-top: 6px;
      font-size: 13px;
      color: #94a3b8;
      line-height: 1.5;
    }
    .diagram-flow-arrow {
      font-size: 26px;
      font-weight: 800;
      color: #7dd3fc;
      line-height: 1;
    }

    .diagram-compare-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
    }
    .diagram-compare-card {
      padding: 16px;
      border-radius: 14px;
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.08);
    }
    .diagram-compare-card.blue {
      background: rgba(56,189,248,0.08);
      border-color: rgba(56,189,248,0.24);
    }
    .diagram-compare-card.purple {
      background: rgba(167,139,250,0.08);
      border-color: rgba(167,139,250,0.24);
    }
    .diagram-compare-card.green {
      background: rgba(16,185,129,0.08);
      border-color: rgba(16,185,129,0.22);
    }
    .diagram-compare-title {
      font-size: 16px;
      font-weight: 800;
      color: #f8fafc;
      margin-bottom: 10px;
    }
    .diagram-compare-list {
      margin: 0;
      padding-left: 18px;
    }
    .diagram-compare-list li {
      font-size: 14px;
      color: #cbd5e1;
      margin-bottom: 6px;
    }

    .diagram-steps {
      display: grid;
      gap: 14px;
    }
    .diagram-step {
      display: grid;
      grid-template-columns: 44px 1fr;
      gap: 12px;
      align-items: start;
    }
    .diagram-step-number {
      width: 44px;
      height: 44px;
      border-radius: 999px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(56,189,248,0.14);
      border: 1px solid rgba(56,189,248,0.28);
      color: #f8fafc;
      font-weight: 800;
    }
    .diagram-step-body {
      padding: 10px 12px;
      border-radius: 12px;
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.06);
    }
    .diagram-step-title {
      font-size: 15px;
      font-weight: 700;
      color: #f8fafc;
    }
    .diagram-step-desc {
      margin-top: 4px;
      font-size: 14px;
      color: #94a3b8;
    }

    .diagram-svg {
      min-width: 640px;
      max-width: 100%;
      height: auto;
      display: block;
    }

    .next-links {
      margin-top: 40px;
      padding-top: 24px;
      border-top: 1px solid rgba(255,255,255,0.08);
    }
    .next-links h2 { border-left: 4px solid #a78bfa; }
    .next-links ul { list-style: none; padding: 0; }
    .next-links li { margin-bottom: 10px; }
    .next-links li::before { content: "→ "; color: #a78bfa; }

    .breadcrumb {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-bottom: 18px;
      font-size: 13px;
      color: #64748b;
    }
    .breadcrumb a { color: #7dd3fc; }
    .breadcrumb span::before { content: "/"; margin-right: 6px; }

    @media (max-width: 640px) {
      .card-wrapper {
        padding: 22px;
      }
      h1 {
        font-size: 30px;
      }
      .diagram-flow-row {
        justify-content: flex-start;
      }
      .diagram-flow-group {
        flex-wrap: wrap;
      }
      .diagram-flow-arrow {
        transform: rotate(90deg);
      }
    }
  </style>
</head>
<body>
  <div class="container">
    ${breadcrumbHtml}
    <div class="card-wrapper">
      <div class="badge ${escapeHtml(badgeClass)}">${escapeHtml(badgeLabel)}</div>
      <h1>${escapeHtml(page.title)}</h1>
      <p class="lead">${escapeHtml(lead)}</p>
      ${diagramHtml || ""}
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
      const childPages = pagesInSection
        .filter((page) => page.type !== "parent")
        .slice(0, 8);

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
              .map(
                (page) => `
                <a class="parent-card" href="./${escapeHtml(page.path.replace(/^basics\//, ""))}">
                  <div class="badge ${escapeHtml(meta.badgeClass)}">${escapeHtml(getBadgeLabel(page))}</div>
                  <h3>${escapeHtml(page.title)}</h3>
                  <p>${escapeHtml(page.description || "")}</p>
                </a>
              `
              )
              .join("")}
          </div>

          ${
            childPages.length
              ? `
                <div class="child-group">
                  <h3>主要ページ</h3>
                  <div class="child-grid">
                    ${childPages
                      .map(
                        (page) => `
                        <a class="child-card" href="./${escapeHtml(page.path.replace(/^basics\//, ""))}">
                          <h3>${escapeHtml(page.title)}</h3>
                          <p>${escapeHtml(page.description || "")}</p>
                        </a>
                      `
                      )
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

    .container { max-width: 1180px; margin: 0 auto; }

    a { color: inherit; text-decoration: none; }

    .back {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 18px;
      color: var(--accent);
      font-weight: 700;
      font-size: 14px;
    }

    .hero, .section, .toc {
      background: var(--panel);
      border: 1px solid var(--panel-border);
      border-radius: 20px;
      padding: 28px;
      margin-bottom: 24px;
      box-shadow: 0 10px 28px rgba(0,0,0,0.20);
    }

    .hero { padding: 34px 28px; }

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

    .toc-grid, .parent-grid, .child-grid {
      display: grid;
      gap: 16px;
    }

    .toc-grid { grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); }

    .toc a {
      display: block;
      padding: 16px 18px;
      border-radius: 14px;
      background: var(--panel-soft);
      border: 1px solid var(--panel-border);
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

    .parent-card, .child-card {
      display: block;
      padding: 18px;
      border-radius: 16px;
      background: var(--panel-soft);
      border: 1px solid var(--panel-border);
    }

    .parent-card h3, .child-card h3 {
      margin: 0 0 8px;
      color: var(--heading);
      line-height: 1.35;
    }

    .parent-card p, .child-card p {
      margin: 0;
      color: var(--text-soft);
      font-size: 14px;
      line-height: 1.7;
    }

    .parent-card h3 { font-size: 20px; }

    .child-group { margin-top: 18px; }

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

    @media (max-width: 640px) {
      .hero, .section, .toc { padding: 22px; }
      h2 { font-size: 24px; }
      .parent-card h3 { font-size: 18px; }
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
    const spec = specMap.get(page.id) || buildAutoSpec(page, pageMap);
    const html = renderPageHtml(page, spec, pages, pageMap);
    writeFile(page.path, html);
    console.log(`Saved ${page.path}`);
  }

  console.log("Knowledge pages build completed.");
}

main();
