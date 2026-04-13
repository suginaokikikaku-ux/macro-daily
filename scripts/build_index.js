import "dotenv/config";
import fs from "fs";
import path from "path";

const siteDir = "site";
const postsDir = path.join(siteDir, "posts");
const indexPath = "index.html";
const sitemapPath = "sitemap.xml";
const robotsPath = "robots.txt";

const heroImageRelativePath = "site/assets/img/hero.jpg";
const heroImageFsPath = path.join(siteDir, "assets", "img", "hero.jpg");

const siteUrl = (process.env.SITE_URL || "https://YOUR_USERNAME.github.io/macro-daily").replace(/\/$/, "");

if (!fs.existsSync(postsDir)) {
  console.error("site/posts がありません。先に build を実行してください。");
  process.exit(1);
}

function escapeHtml(str = "") {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function getPostTypeLabel(type) {
  if (type === "fx") return "FX";
  if (type === "crypto") return "CRYPTO";
  return "OTHER";
}

const postFiles = fs
  .readdirSync(postsDir)
  .filter((file) => file.endsWith(".html"))
  .sort()
  .reverse();

const posts = postFiles.map((file) => {
  const name = file.replace(".html", "");
  const [type, date] = name.split(/-(.+)/);

  const dailyPath = path.join("data", "daily", `${name}.json`);

  let seoTitle = `Macro Daily ${name}`;
  let seoDescription = "デイリーまとめ記事です。";

  if (fs.existsSync(dailyPath)) {
    try {
      const daily = JSON.parse(fs.readFileSync(dailyPath, "utf-8"));
      seoTitle = daily.seoTitle || seoTitle;
      seoDescription = daily.seoDescription || seoDescription;
    } catch (error) {
      console.error(`Failed to parse ${dailyPath}`);
      console.error(error);
    }
  }

  return {
    type,
    typeLabel: getPostTypeLabel(type),
    date,
    file,
    relativeUrl: `./site/posts/${file}`,
    fullUrl: `${siteUrl}/site/posts/${file}`,
    title: seoTitle,
    description: seoDescription
  };
});

const latestPost = posts[0] || null;
const heroImageExists = fs.existsSync(heroImageFsPath);

const heroButton = latestPost
  ? `<a class="hero-button" href="${latestPost.relativeUrl}">最新記事を読む</a>`
  : "";

const heroImageHtml = heroImageExists
  ? `<div class="hero-image" aria-label="サイトヘッダー画像"></div>`
  : `<div class="hero-image hero-image-fallback">
       <div class="hero-image-fallback-text">Macro Daily</div>
     </div>`;

const listHtml = posts.length
  ? `<div class="card-grid">
      ${posts
        .map(
          (post) => `
        <article class="article-card">
          <div class="card-meta-row">
            <span class="card-badge card-badge-${post.type}">${escapeHtml(post.typeLabel)}</span>
            <span class="card-meta">${escapeHtml(post.date)}</span>
          </div>
          <a href="${post.relativeUrl}" class="card-title">${escapeHtml(post.title)}</a>
          <p class="card-description">${escapeHtml(post.description)}</p>
          <div class="card-link-wrap">
            <a href="${post.relativeUrl}" class="card-link">記事を読む →</a>
          </div>
        </article>`
        )
        .join("")}
    </div>`
  : `<div class="empty-state">記事がまだありません。</div>`;

const latestDescription =
  latestPost?.description ||
  "FX・暗号資産・マクロ市場のデイリー要約と相場への影響をまとめるニュースサイトです。";

const indexHtml = `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Macro Daily｜FX・暗号資産・マクロ市場のデイリーまとめ</title>
  <meta name="description" content="${escapeHtml(latestDescription)}" />
  <link rel="canonical" href="${siteUrl}/index.html" />
  <meta name="robots" content="index,follow" />
  <meta property="og:type" content="website" />
  <meta property="og:title" content="Macro Daily｜FX・暗号資産・マクロ市場のデイリーまとめ" />
  <meta property="og:description" content="${escapeHtml(latestDescription)}" />
  <meta property="og:url" content="${siteUrl}/index.html" />
  <meta property="og:site_name" content="Macro Daily" />
  <meta name="twitter:card" content="summary_large_image" />

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

    .hero {
      position: relative;
      overflow: hidden;
      background: linear-gradient(135deg, rgba(15,23,42,0.96), rgba(30,41,59,0.96));
      border: 1px solid var(--panel-border);
      border-radius: var(--radius-lg);
      padding: 32px;
      box-shadow: var(--shadow);
      margin-bottom: 40px;
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

    .hero-button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, var(--accent), var(--accent-strong));
      color: #082f49;
      padding: 12px 18px;
      border-radius: 999px;
      font-weight: 800;
      font-size: 14px;
      transition: transform 0.18s ease, box-shadow 0.18s ease;
      box-shadow: 0 10px 24px rgba(14, 165, 233, 0.28);
    }

    .hero-button:hover {
      transform: translateY(-1px);
      box-shadow: 0 14px 28px rgba(14, 165, 233, 0.34);
    }

    .hero-note {
      font-size: 14px;
      color: var(--text-soft);
    }

    .section-header {
      display: flex;
      align-items: end;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 20px;
    }

    .section-title {
      margin: 0;
      font-size: 28px;
      line-height: 1.2;
      color: var(--heading);
      letter-spacing: -0.02em;
    }

    .section-subtitle {
      margin: 0;
      color: var(--text-soft);
      font-size: 14px;
    }

    .card-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(290px, 1fr));
      gap: 20px;
    }

    .article-card {
      background: linear-gradient(180deg, rgba(17,24,39,0.92), rgba(15,23,42,0.92));
      border: 1px solid var(--panel-border);
      border-radius: var(--radius-md);
      padding: 22px 20px 20px;
      box-shadow: 0 10px 28px rgba(0, 0, 0, 0.2);
      transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
    }

    .article-card:hover {
      transform: translateY(-4px);
      border-color: rgba(56, 189, 248, 0.28);
      box-shadow: 0 16px 32px rgba(0, 0, 0, 0.28);
    }

    .card-meta-row {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 12px;
      flex-wrap: wrap;
    }

    .card-meta {
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--accent);
    }

    .card-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 4px 10px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      border: 1px solid rgba(255,255,255,0.12);
    }

    .card-badge-fx {
      background: rgba(14, 165, 233, 0.14);
      color: #7dd3fc;
    }

    .card-badge-crypto {
      background: rgba(168, 85, 247, 0.16);
      color: #d8b4fe;
    }

    .card-title {
      display: block;
      font-size: 22px;
      font-weight: 800;
      line-height: 1.35;
      color: var(--heading);
      margin-bottom: 12px;
      letter-spacing: -0.02em;
    }

    .card-description {
      margin: 0;
      font-size: 15px;
      color: #cbd5e1;
    }

    .card-link-wrap {
      margin-top: 16px;
    }

    .card-link {
      font-size: 14px;
      font-weight: 700;
      color: var(--accent);
    }

    .empty-state {
      background: var(--panel);
      border: 1px solid var(--panel-border);
      border-radius: var(--radius-md);
      padding: 24px;
      color: var(--text-soft);
    }

    .footer {
      margin-top: 56px;
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

      .section-header {
        flex-direction: column;
        align-items: flex-start;
      }

      .card-title {
        font-size: 20px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <section class="hero">
      <div class="hero-inner">
        ${heroImageHtml}
        <div class="eyebrow">AI MARKET DIGEST</div>
        <h1>Macro Daily</h1>
        <p>
          FX・暗号資産・マクロ市場の注目ニュースを毎日整理し、
          市場構造やテーマ性、次に見るべき論点をわかりやすくまとめるデイリーサイトです。
        </p>
        <div class="hero-actions">
          ${heroButton}
          <span class="hero-note">毎日更新 / AI要約 / 市場整理</span>
        </div>
      </div>
    </section>

    <section>
      <div class="section-header">
        <div>
          <h2 class="section-title">最新記事一覧</h2>
          <p class="section-subtitle">FX と CRYPTO の記事を新しい順に表示しています。</p>
        </div>
      </div>
      ${listHtml}
    </section>

    <footer class="footer">
      <p><strong>Macro Daily</strong>｜FX・暗号資産・マクロ市場のデイリーまとめ</p>
    </footer>
  </div>
</body>
</html>`;

const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${siteUrl}/index.html</loc>
  </url>
  ${posts
    .map(
      (post) => `
  <url>
    <loc>${post.fullUrl}</loc>
    <lastmod>${post.date}</lastmod>
  </url>`
    )
    .join("")}
</urlset>`;

const robotsTxt = `User-agent: *
Allow: /

Sitemap: ${siteUrl}/sitemap.xml
`;

fs.writeFileSync(indexPath, indexHtml, "utf-8");
fs.writeFileSync(sitemapPath, sitemapXml, "utf-8");
fs.writeFileSync(robotsPath, robotsTxt, "utf-8");

console.log(`Saved ${indexPath}`);
console.log(`Saved ${sitemapPath}`);
console.log(`Saved ${robotsPath}`);

if (!heroImageExists) {
  console.log("NOTE: site/assets/img/hero.jpg が見つからなかったため、代替表示を出しています。");
}
