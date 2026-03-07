import "dotenv/config";
import fs from "fs";
import path from "path";

const today = new Date().toISOString().slice(0, 10);
const dailyPath = path.join("data", "daily", `${today}.json`);
const postsDir = path.join("site", "posts");
const postMdPath = path.join(postsDir, `${today}.md`);
const postHtmlPath = path.join(postsDir, `${today}.html`);

const siteUrl = (process.env.SITE_URL || "https://YOUR_USERNAME.github.io/macro-daily").replace(/\/$/, "");
const pageUrl = `${siteUrl}/posts/${today}.html`;

function escapeHtml(str = "") {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function markdownToHtml(markdown = "") {
  let html = escapeHtml(markdown);

  html = html.replace(/^## (.*)$/gm, "<h2>$1</h2>");
  html = html.replace(/^### (.*)$/gm, "<h3>$1</h3>");
  html = html.replace(/^\- (.*)$/gm, "<li>$1</li>");

  html = html.replace(/(<li>.*<\/li>)/gs, (match) => `<ul>${match}</ul>`);
  html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\n\n/g, "</p><p>");
  html = `<p>${html}</p>`;
  html = html.replace(/<p><h2>/g, "<h2>").replace(/<\/h2><\/p>/g, "</h2>");
  html = html.replace(/<p><h3>/g, "<h3>").replace(/<\/h3><\/p>/g, "</h3>");
  html = html.replace(/<p><ul>/g, "<ul>").replace(/<\/ul><\/p>/g, "</ul>");
  html = html.replace(/<\/ul><ul>/g, "");

  return html;
}

if (!fs.existsSync(dailyPath)) {
  console.error(`${dailyPath} がありません。先に summarize を実行してください。`);
  process.exit(1);
}

const raw = fs.readFileSync(dailyPath, "utf-8").trim();

if (!raw) {
  console.error(`${dailyPath} が空です。`);
  process.exit(1);
}

let daily;
try {
  daily = JSON.parse(raw);
} catch (error) {
  console.error(`${dailyPath} のJSON解析に失敗しました。`);
  console.error(error);
  process.exit(1);
}

const article = daily.article ?? "";
const seoTitle = daily.seoTitle ?? `Macro Daily ${today}｜FX・BTC・マクロ市場まとめ`;
const seoDescription =
  daily.seoDescription ??
  "FX・BTC・マクロ市場の注目ニュースを整理。USD/JPYとビットコインへの影響、監視ポイント、今日の結論までまとめています。";

const meta = daily.meta ?? {};
const news = Array.isArray(daily.news) ? daily.news : [];

const sources = Array.isArray(meta.sources) ? meta.sources : [];
const categories = Array.isArray(meta.categories) ? meta.categories : [];

if (!article) {
  console.error("article が空です。");
  process.exit(1);
}

if (!fs.existsSync(postsDir)) {
  fs.mkdirSync(postsDir, { recursive: true });
}

const sourceText = sources.length > 0 ? sources.join(" / ") : "不明";
const categoryText = categories.length > 0 ? categories.join("・") : "other";

const introLine = `この記事は${categoryText}を中心に、${sourceText}のニュースをもとに整理しています。`;

const references = news
  .map((item, index) => {
    const title = item.title || "タイトルなし";
    const source = item.source || "unknown";
    const category = item.category || "other";
    const link = item.link || "";
    return `- [${index + 1}] ${title}（${source} / ${category}）${link ? ` - ${link}` : ""}`;
  })
  .join("\n");

const markdown = `---
title: "${seoTitle}"
date: "${today}"
sources: "${sourceText}"
categories: "${categoryText}"
description: "${seoDescription}"
canonical: "${pageUrl}"
---

# Macro Daily ${today}

${introLine}

${article}

---

## 今日の取得元
${sourceText}

## 今日のカテゴリ
${categoryText}

## 参照ニュース一覧
${references || "- 参照ニュースなし"}
`;

const articleHtml = markdownToHtml(`${introLine}\n\n${article}`);

const referencesHtml = news.length
  ? `<ul>${news
      .map((item, index) => {
        const title = escapeHtml(item.title || "タイトルなし");
        const source = escapeHtml(item.source || "unknown");
        const category = escapeHtml(item.category || "other");
        const link = item.link || "";
        return `<li>[${index + 1}] ${title}（${source} / ${category}）${
          link ? ` - <a href="${link}" target="_blank" rel="noopener noreferrer">元記事</a>` : ""
        }</li>`;
      })
      .join("")}</ul>`
  : "<p>参照ニュースなし</p>";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: seoTitle,
  description: seoDescription,
  datePublished: today,
  dateModified: today,
  author: {
    "@type": "Organization",
    name: "Macro Daily"
  },
  publisher: {
    "@type": "Organization",
    name: "Macro Daily"
  },
  mainEntityOfPage: pageUrl
};

const html = `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(seoTitle)}</title>
  <meta name="description" content="${escapeHtml(seoDescription)}" />
  <link rel="canonical" href="${pageUrl}" />
  <meta name="robots" content="index,follow" />
  <meta property="og:type" content="article" />
  <meta property="og:title" content="${escapeHtml(seoTitle)}" />
  <meta property="og:description" content="${escapeHtml(seoDescription)}" />
  <meta property="og:url" content="${pageUrl}" />
  <meta property="og:site_name" content="Macro Daily" />
  <meta name="twitter:card" content="summary_large_image" />
  <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; line-height: 1.8; max-width: 860px; margin: 40px auto; padding: 0 16px; color: #111; }
    h1, h2, h3 { line-height: 1.4; }
    .meta { color: #666; font-size: 14px; margin-bottom: 24px; }
    .box { background: #f7f7f7; border-radius: 12px; padding: 16px; margin: 24px 0; }
    a { color: #0a58ca; text-decoration: none; }
    a:hover { text-decoration: underline; }
    ul { padding-left: 20px; }
  </style>
</head>
<body>
  <p><a href="../index.html">← 記事一覧へ戻る</a></p>
  <h1>${escapeHtml(seoTitle)}</h1>
  <div class="meta">${today}</div>

  ${articleHtml}

  <div class="box">
    <h2>今日の取得元</h2>
    <p>${escapeHtml(sourceText)}</p>
    <h2>今日のカテゴリ</h2>
    <p>${escapeHtml(categoryText)}</p>
  </div>

  <h2>参照ニュース一覧</h2>
  ${referencesHtml}
</body>
</html>`;

fs.writeFileSync(postMdPath, markdown, "utf-8");
fs.writeFileSync(postHtmlPath, html, "utf-8");

console.log(`Saved ${postMdPath}`);
console.log(`Saved ${postHtmlPath}`);