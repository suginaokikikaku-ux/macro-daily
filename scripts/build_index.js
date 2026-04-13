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

function getPostTypeClass(type) {
  if (type === "fx") return "fx";
  if (type === "crypto") return "crypto";
  return "other";
}

function readPostMeta(file) {
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
    typeClass: getPostTypeClass(type),
    date,
    file,
    relativeUrl: `./site/posts/${file}`,
    fullUrl: `${siteUrl}/site/posts/${file}`,
    title: seoTitle,
    description: seoDescription
  };
}

function buildCard(post) {
  return `
    <article class="article-card">
      <div class="card-meta-row">
        <span class="card-badge card-badge-${post.typeClass}">${escapeHtml(post.typeLabel)}</span>
        <span class="card-meta">${escapeHtml(post.date)}</span>
      </div>
      <a href="${post.relativeUrl}" class="card-title">${escapeHtml(post.title)}</a>
      <p class="card-description">${escapeHtml(post.description)}</p>
      <div class="card-link-wrap">
        <a href="${post.relativeUrl}" class="card-link">記事を読む →</a>
      </div>
    </article>`;
}

function buildSection(title, subtitle, posts, emptyText) {
  const content = posts.length
    ? `<div class="card-grid">${posts.map(buildCard).join("")}</div>`
    : `<div class="empty-state">${escapeHtml(emptyText)}</div>`;

  return `
    <section class="content-section">
      <div class="section-header">
        <div>
          <h2 class="section-title">${escapeHtml(title)}</h2>
          <p class="section-subtitle">${escapeHtml(subtitle)}</p>
        </div>
      </div>
      ${content}
    </section>
  `;
}

const postFiles = fs
  .readdirSync(postsDir)
  .filter((file) => file.endsWith(".html"))
  .sort()
  .reverse();

const posts = postFiles.map(readPostMeta);
const fxPosts = posts.filter((post) => post.type === "fx");
const cryptoPosts = posts.filter((post) => post.type === "crypto");

const latestFx = fxPosts[0] || null;
const latestCrypto = cryptoPosts[0] || null;
const latestPost = posts[0] || null;

const heroImageExists = fs.existsSync(heroImageFsPath);

const heroImageHtml = heroImageExists
  ? `<div class="hero-image" aria-label="サイトヘッダー画像"></div>`
  : `<div class="hero-image hero-image-fallback">
       <div class="hero-image-fallback-text">Macro Daily</div>
     </div>`;

const heroActions = `
  <div class="hero-actions">
    <a class="hero-button" href="./fx.html">FXを見る</a>
    <a class="hero-button hero-button-secondary" href="./crypto.html">暗号資産を見る</a>
    <a class="hero-link" href="./basics/index.html">初心者向けガイドを見る</a>
  </div>
`;

const latestDescription =
  latestPost?.description ||
  "FX・暗号資産・マクロ市場の整理記事と初心者向け基礎知識をまとめたサイトです。";

const basicsCards = `
  <section class="content-section">
    <div class="section-header">
      <div>
        <h2 class="section-title">初心者向けガイド</h2>
        <p class="section-subtitle">基礎知識がない人向けに、最初に読むべきページをまとめています。</p>
      </div>
    </div>

    <div class="guide-grid">
      <a class="guide-card" href="./basics/fx/what-is-fx.html">
        <span class="guide-badge">FX基礎</span>
        <h3>FXとは？</h3>
        <p>為替、ドル円、レバレッジの基本を初心者向けに整理。</p>
      </a>

      <a class="guide-card" href="./basics/fx/what-moves-fx.html">
        <span class="guide-badge">FX基礎</span>
        <h3>なぜ為替は動くのか</h3>
        <p>金利、経済指標、リスクオンオフの基本を理解するページ。</p>
      </a>

      <a class="guide-card" href="./basics/crypto/what-is-crypto.html">
        <span class="guide-badge">暗号資産基礎</span>
        <h3>暗号通貨とは？</h3>
        <p>ビットコイン、アルトコイン、ブロックチェーンの入口。</p>
      </a>

      <a class="guide-card" href="./basics/crypto/how-to-read-projects.html">
        <span class="guide-badge">暗号資産基礎</span>
        <h3>プロジェクトの見方</h3>
        <p>進捗、提携、ユーザー数、テーマ性の読み方を整理。</p>
      </a>

      <a class="guide-card" href="./basics/start/how-to-start.html">
        <span class="guide-badge">導入</span>
        <h3>学習から導入までの流れ</h3>
        <p>基礎学習 → 情報収集 → 比較 → 導入までの全体像を整理。</p>
      </a>

      <a class="guide-card" href="./basics/index.html">
        <span class="guide-badge">一覧</span>
        <h3>基礎知識ページ一覧</h3>
        <p>初心者向けの固定ページをまとめて確認できます。</p>
      </a>
    </div>
  </section>
`;

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
      --accent-purple: #a855f7;
      --shadow: 0 16px 40px rgba(0, 0, 0, 0.28);
      --radius-lg: 22px;
      --radius-md: 16px;
      --radius-sm: 12px;
    }

    * { box-sizing: border-box; }
    html { scroll-behavior: smooth; }

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
      max-width: 1180px;
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
      margin-bottom: 32px;
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
      font-size: clamp(36px, 6vw, 56px);
      line-height: 1.08;
      font-weight: 800;
      color: var(--heading);
      letter-spacing: -0.03em;
    }

    .hero p {
      margin: 0;
      font-size: 17px;
      color: #cbd5e1;
      max-width: 760px;
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
      box-shadow: 0 10px 24px rgba(14, 165, 233, 0.28);
    }

    .hero-button-secondary {
      background: linear-gradient(135deg, #c084fc, var(--accent-purple));
      color: #240046;
      box-shadow: 0 10px 24px rgba(168, 85, 247, 0.28);
    }

    .hero-link {
      font-size: 14px;
      font-weight: 700;
      color: #cbd5e1;
    }

    .content-section {
      margin-bottom: 32px;
    }

    .section-header {
      display: flex;
      align-items: end;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 18px;
    }

    .section-title {
      margin: 0;
      font-size: 28px;
      line-height: 1.2;
      color: var(--heading);
      letter-spacing: -0.02em;
    }

    .section-subtitle {
      margin: 6px 0 0;
      color: var(--text-soft);
      font-size: 14px;
    }

    .split-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 20px;
    }

    .panel {
      background: linear-gradient(180deg, rgba(17,24,39,0.92), rgba(15,23,42,0.92));
      border: 1px solid var(--panel-border);
      border-radius: var(--radius-md);
      padding: 22px 20px 20px;
      box-shadow: 0 10px 28px rgba(0, 0, 0, 0.2);
    }

    .panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 10px;
      margin-bottom: 16px;
    }

    .panel-title {
      margin: 0;
      font-size: 22px;
      color: var(--heading);
    }

    .panel-link {
      font-size: 14px;
      font-weight: 700;
      color: var(--accent);
    }

    .card-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(290px, 1fr));
      gap: 20px;
    }

    .article-card, .guide-card {
      background: linear-gradient(180deg, rgba(17,24,39,0.92), rgba(15,23,42,0.92));
      border: 1px solid var(--panel-border);
      border-radius: var(--radius-md);
      padding: 22px 20px 20px;
      box-shadow: 0 10px 28px rgba(0, 0, 0, 0.2);
      transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
      display: block;
    }

    .article-card:hover, .guide-card:hover {
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

    .card-badge, .guide-badge {
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

    .card-title, .guide-card h3 {
      display: block;
      font-size: 22px;
      font-weight: 800;
      line-height: 1.35;
      color: var(--heading);
      margin: 0 0 12px;
      letter-spacing: -0.02em;
    }

    .card-description, .guide-card p {
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

    .guide-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 20px;
    }

    .guide-badge {
      margin-bottom: 12px;
      background: rgba(255,255,255,0.08);
      color: #e2e8f0;
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

    @media (max-width: 900px) {
      .split-grid {
        grid-template-columns: 1fr;
      }
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

      .card-title, .guide-card h3 {
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
        ${heroActions}
      </div>
    </section>

    <section class="content-section">
      <div class="section-header">
        <div>
          <h2 class="section-title">カテゴリ別の最新記事</h2>
          <p class="section-subtitle">FX と CRYPTO を分けて見やすく整理しています。</p>
        </div>
      </div>

      <div class="split-grid">
        <div class="panel">
          <div class="panel-header">
            <h3 class="panel-title">FX</h3>
            <a class="panel-link" href="./fx.html">一覧を見る →</a>
          </div>
          ${latestFx ? buildCard(latestFx) : `<div class="empty-state">FX記事がまだありません。</div>`}
        </div>

        <div class="panel">
          <div class="panel-header">
            <h3 class="panel-title">CRYPTO</h3>
            <a class="panel-link" href="./crypto.html">一覧を見る →</a>
          </div>
          ${latestCrypto ? buildCard(latestCrypto) : `<div class="empty-state">暗号資産記事がまだありません。</div>`}
        </div>
      </div>
    </section>

    ${buildSection("最新FX記事一覧", "為替・マクロを中心に整理した記事です。", fxPosts.slice(0, 6), "FX記事がまだありません。")}
    ${buildSection("最新Crypto記事一覧", "主要コインとプロジェクト動向を整理した記事です。", cryptoPosts.slice(0, 6), "暗号資産記事がまだありません。")}
    ${basicsCards}

    <footer class="footer">
      <p><strong>Macro Daily</strong>｜FX・暗号資産・マクロ市場のデイリーまとめ</p>
    </footer>
  </div>
</body>
</html>`;

const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${siteUrl}/index.html</loc></url>
  <url><loc>${siteUrl}/fx.html</loc></url>
  <url><loc>${siteUrl}/crypto.html</loc></url>
  <url><loc>${siteUrl}/basics/index.html</loc></url>
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
