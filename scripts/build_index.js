import "dotenv/config";
import fs from "fs";
import path from "path";

const siteDir = "site";
const postsDir = path.join(siteDir, "posts");
const indexPath = path.join(siteDir, "index.html");
const sitemapPath = path.join(siteDir, "sitemap.xml");
const robotsPath = path.join(siteDir, "robots.txt");

const siteUrl = (process.env.SITE_URL || "https://YOUR_USERNAME.github.io/macro-daily").replace(/\/$/, "");

if (!fs.existsSync(postsDir)) {
  console.error("site/posts がありません。先に build を実行してください。");
  process.exit(1);
}

const postFiles = fs
  .readdirSync(postsDir)
  .filter((file) => file.endsWith(".html"))
  .sort()
  .reverse();

const posts = postFiles.map((file) => {
  const date = file.replace(".html", "");
  const dailyPath = path.join("data", "daily", `${date}.json`);

  let seoTitle = `Macro Daily ${date}`;
  let seoDescription = "FX・BTC・マクロ市場のデイリーまとめ記事です。";

  if (fs.existsSync(dailyPath)) {
    try {
      const daily = JSON.parse(fs.readFileSync(dailyPath, "utf-8"));
      seoTitle = daily.seoTitle || seoTitle;
      seoDescription = daily.seoDescription || seoDescription;
    } catch {}
  }

  return {
    date,
    file,
    url: `${siteUrl}/posts/${file}`,
    title: seoTitle,
    description: seoDescription
  };
});

const listHtml = posts.length
  ? `<ul>${posts
      .map(
        (post) => `
      <li style="margin-bottom: 24px;">
        <a href="./posts/${post.file}" style="font-size: 20px; font-weight: 700;">${post.title}</a>
        <div style="color:#666; font-size:14px; margin: 4px 0;">${post.date}</div>
        <div>${post.description}</div>
      </li>`
      )
      .join("")}</ul>`
  : "<p>記事がまだありません。</p>";

const latestDescription =
  posts[0]?.description || "FX・BTC・マクロ市場のデイリー要約と相場への影響をまとめるニュースサイトです。";

const indexHtml = `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Macro Daily｜FX・BTC・マクロ市場のデイリーまとめ</title>
  <meta name="description" content="${latestDescription.replace(/"/g, "&quot;")}" />
  <link rel="canonical" href="${siteUrl}/index.html" />
  <meta name="robots" content="index,follow" />
  <meta property="og:type" content="website" />
  <meta property="og:title" content="Macro Daily｜FX・BTC・マクロ市場のデイリーまとめ" />
  <meta property="og:description" content="${latestDescription.replace(/"/g, "&quot;")}" />
  <meta property="og:url" content="${siteUrl}/index.html" />
  <meta property="og:site_name" content="Macro Daily" />
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; line-height: 1.8; max-width: 960px; margin: 40px auto; padding: 0 16px; color: #111; }
    h1 { margin-bottom: 8px; }
    .lead { color: #444; margin-bottom: 32px; }
    ul { list-style: none; padding: 0; }
    a { color: #0a58ca; text-decoration: none; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <h1>Macro Daily</h1>
  <p class="lead">FX・BTC・マクロ市場の注目ニュースを毎日整理し、USD/JPYやビットコインへの影響をまとめるデイリーサイトです。</p>
  ${listHtml}
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
    <loc>${post.url}</loc>
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