import "dotenv/config";
import fs from "fs";
import path from "path";

function getJstDateString() {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
  return formatter.format(now);
}

const today = getJstDateString();
const postsDir = path.join("site", "posts");

const heroImageRelativePath = "../assets/img/hero.jpg";
const heroImageFsPath = path.join("site", "assets", "img", "hero.jpg");

const siteUrl = (process.env.SITE_URL || "https://YOUR_USERNAME.github.io/macro-daily").replace(/\/$/, "");

const articleTypes = [
  {
    type: "fx",
    label: "FX",
    defaultTitle: `Macro Daily FX ${today}｜USD/JPY・マクロ市場分析`,
    defaultDescription:
      "USD/JPYを中心に、金利・地政学・マクロ材料が為替市場へどう波及しているかを整理したデイリー分析記事です。"
  },
  {
    type: "crypto",
    label: "CRYPTO",
    defaultTitle: `Macro Daily Crypto ${today}｜暗号資産市場整理`,
    defaultDescription:
      "主要コインの地合いと、個別プロジェクトの進捗、次に確認すべきテーマを整理した暗号資産デイリー記事です。"
  }
];

function escapeHtml(str = "") {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
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

function buildOneArticle(config) {
  const { type, label, defaultTitle, defaultDescription } = config;

  const dailyPath = path.join("data", "daily", `${type}-${today}.json`);
  const postMdPath = path.join(postsDir, `${type}-${today}.md`);
  const postHtmlPath = path.join(postsDir, `${type}-${today}.html`);
  const pageUrl = `${siteUrl}/site/posts/${type}-${today}.html`;

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
  const seoTitle = daily.seoTitle ?? defaultTitle;
  const seoDescription = daily.seoDescription ?? defaultDescription;

  const meta = daily.meta ?? {};
  const news = Array.isArray(daily.news) ? daily.news : [];
  const sources = Array.isArray(meta.sources) ? meta.sources : [];
  const categories = Array.isArray(meta.categories) ? meta.categories : [];

  if (!article) {
    console.error(`${type}: article が空です。`);
    process.exit(1);
  }

  if (!fs.existsSync(postsDir)) {
    fs.mkdirSync(postsDir, { recursive: true });
  }

  const sourceText = sources.length > 0 ? sources.join(" / ") : "不明";
  const categoryText = categories.length > 0 ? categories.join("・") : "other";
  const introLine = `この記事は${categoryText}を中心に、${sourceText}のニュースをもとに整理しています。`;

  const heroImageExists = fs.existsSync(heroImageFsPath);

  const heroImageHtml = heroImageExists
    ? `<div class="hero-image" aria-label="記事ヘッダー画像"></div>`
    : `<div class="hero-image hero-image-fallback">
         <div class="hero-image-fallback-text">Macro Daily</div>
       </div>`;

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
type: "${type}"
sources: "${sourceText}"
categories: "${categoryText}"
description: "${seoDescription}"
canonical: "${pageUrl}"
---

# ${seoTitle}

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

  const articleHtml = markdownToHtml(article);

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

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">

  <style>
    :root {
      --bg: #0b1120;
      --bg-soft: #111827;
      --panel: rgba(15, 23, 42, 0.88);
      --panel-border: rgba(255, 255, 255, 0.08);
      --text: #e5e7eb;
      --text-soft: #94a3b8;
      --heading: #f8fafc;
      --accent: #38bdf8;
      --accent-strong: #0ea5e9;
      --shadow: 0 16px 40px rgba(0, 0, 0, 0.28);
      --radius-lg: 22px;
      --radius-md: 16px;
      --radius-sm: 12px;
    }

    * {
      box-sizing: border-box;
    }

    html {
      scroll-behavior: smooth;
    }

    body {
      margin: 0;
      font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      line-height: 1.75;
      background:
        radial-gradient(circle at top left, rgba(56, 189, 248, 0.14), transparent 30%),
        radial-gradient(circle at top right, rgba(59, 130, 246, 0.12), transparent 28%),
        linear-gradient(180deg, #020617 0%, #0b1120 100%);
      color: var(--text);
      padding: 32px 16px 64px;
    }

    .container {
      max-width: 1100px;
      margin: 0 auto;
    }

    a {
      color: inherit;
      text-decoration: none;
    }

    .back-link {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 18px;
      color: #93c5fd;
      font-size: 14px;
      font-weight: 700;
    }

    .hero {
      position: relative;
      overflow: hidden;
      background: linear-gradient(135deg, rgba(15,23,42,0.96), rgba(30,41,59,0.96));
      border: 1px solid var(--panel-border);
      border-radius: var(--radius-lg);
      padding: 32px;
      box-shadow: var(--shadow);
      margin-bottom: 28px;
    }

    .hero::before {
      content: "";
      position: absolute;
      inset: 0;
      background: linear-gradient(120deg, rgba(56,189,248,0.14), transparent 45%);
      pointer-events: none;
    }

    .hero-inner {
      position: relative;
      z-index: 1;
      max-width: 100%;
    }

    .hero-image {
      width: 100%;
      height: 340px;
      border-radius: 18px;
      margin-bottom: 28px;
      background-image: url("${heroImageRelativePath}");
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat;
      border: 1px solid rgba(255,255,255,0.08);
      box-shadow: 0 12px 28px rgba(0, 0, 0, 0.22);
    }

    .hero-image-fallback {
      display: flex;
      align-items: center;
      justify-content: center;
      background:
        radial-gradient(circle at center, rgba(56,189,248,0.22), transparent 35%),
        linear-gradient(135deg, #111827, #1e293b);
    }

    .hero-image-fallback-text {
      font-size: 32px;
      font-weight: 800;
      color: #f8fafc;
      letter-spacing: -0.03em;
    }

    .eyebrow {
      display: inline-block;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--accent);
      margin-bottom: 14px;
    }

    .hero h1 {
      margin: 0 0 16px;
      font-size: clamp(36px, 6vw, 54px);
      line-height: 1.1;
      font-weight: 800;
      color: var(--heading);
      letter-spacing: -0.03em;
    }

    .hero p {
      margin: 0;
      font-size: 17px;
      color: #cbd5e1;
      max-width: 680px;
    }

    .hero-actions {
      margin-top: 24px;
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      align-items: center;
    }

    .hero-note {
      font-size: 14px;
      color: var(--text-soft);
    }

    .content-card,
    .info-card,
    .references-card {
      background: linear-gradient(180deg, rgba(17,24,39,0.92), rgba(15,23,42,0.92));
      border: 1px solid var(--panel-border);
      border-radius: var(--radius-md);
      padding: 22px 20px 20px;
      box-shadow: 0 10px 28px rgba(0, 0, 0, 0.2);
    }

    .content-card {
      margin-bottom: 20px;
    }

    .intro-box {
      background: rgba(56, 189, 248, 0.08);
      border: 1px solid rgba(56, 189, 248, 0.18);
      border-radius: var(--radius-sm);
      padding: 16px 18px;
      margin-bottom: 20px;
      color: #dbeafe;
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(290px, 1fr));
      gap: 20px;
      margin-bottom: 20px;
    }

    h2 {
      color: var(--heading);
      margin-top: 34px;
      margin-bottom: 14px;
      font-size: 25px;
      line-height: 1.35;
      letter-spacing: -0.02em;
      border-left: 4px solid var(--accent);
      padding-left: 12px;
    }

    .content-card h2:first-child,
    .info-card h2:first-child,
    .references-card h2:first-child {
      margin-top: 0;
    }

    h3 {
      color: var(--heading);
      margin-top: 24px;
      margin-bottom: 10px;
      font-size: 20px;
      line-height: 1.45;
    }

    p {
      margin: 0 0 16px;
      color: #d1d5db;
      font-size: 16px;
    }

    strong {
      color: #f8fafc;
    }

    ul {
      padding-left: 22px;
      color: #d1d5db;
      margin: 0 0 18px;
    }

    li {
      margin-bottom: 8px;
    }

    .references-card a {
      color: var(--accent);
      text-decoration: none;
    }

    .references-card a:hover {
      text-decoration: underline;
    }

    .footer {
      margin-top: 40px;
      padding-top: 24px;
      border-top: 1px solid var(--panel-border);
      color: var(--text-soft);
      font-size: 14px;
    }

    .footer strong {
      color: var(--heading);
    }

    @media (max-width: 640px) {
      .hero {
        padding: 22px;
      }

      .hero-image {
        height: 220px;
        margin-bottom: 22px;
      }

      .hero h1 {
        font-size: 32px;
      }

      h2 {
        font-size: 22px;
      }

      p,
      li {
        font-size: 15px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <a class="back-link" href="../../index.html">← 記事一覧へ戻る</a>

    <section class="hero">
      <div class="hero-inner">
        ${heroImageHtml}
        <div class="eyebrow">${escapeHtml(label)} DAILY ARTICLE</div>
        <h1>${escapeHtml(seoTitle)}</h1>
        <p>${escapeHtml(seoDescription)}</p>
        <div class="hero-actions">
          <span class="hero-note">${today} / ${escapeHtml(categoryText)}</span>
        </div>
      </div>
    </section>

    <section class="content-card">
      <div class="intro-box">${escapeHtml(introLine)}</div>
      ${articleHtml}
    </section>

    <section class="info-grid">
      <div class="info-card">
        <h2>今日の取得元</h2>
        <p>${escapeHtml(sourceText)}</p>
      </div>

      <div class="info-card">
        <h2>今日のカテゴリ</h2>
        <p>${escapeHtml(categoryText)}</p>
      </div>
    </section>

    <section class="references-card">
      <h2>参照ニュース一覧</h2>
      ${referencesHtml}
    </section>

    <footer class="footer">
      <p><strong>Macro Daily</strong>｜${escapeHtml(label)} デイリー記事</p>
    </footer>
  </div>
</body>
</html>`;

  fs.writeFileSync(postMdPath, markdown, "utf-8");
  fs.writeFileSync(postHtmlPath, html, "utf-8");

  console.log(`Saved ${postMdPath}`);
  console.log(`Saved ${postHtmlPath}`);

  if (!heroImageExists) {
    console.log("NOTE: site/assets/img/hero.jpg が見つからなかったため、記事ページは代替表示を出しています。");
  }
}

for (const config of articleTypes) {
  buildOneArticle(config);
}
