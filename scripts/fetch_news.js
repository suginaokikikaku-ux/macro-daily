import Parser from "rss-parser";
import fs from "fs";
import path from "path";

const parser = new Parser({
  timeout: 10000,
});

const feeds = [
  // Crypto
  { source: "CoinDesk", category: "crypto", url: "https://www.coindesk.com/arc/outboundfeeds/rss/" },
  { source: "FXStreet", category: "crypto", url: "https://www.fxstreet.com/rss/crypto" },
  { source: "Investing", category: "crypto", url: "https://www.investing.com/rss/302.rss" },

  // FX / Macro
  { source: "FXStreet", category: "fx", url: "https://www.fxstreet.com/rss/news" },
  { source: "FXStreet", category: "fx_analysis", url: "https://www.fxstreet.com/rss/analysis" },
  { source: "Investing", category: "forex", url: "https://www.investing.com/rss/forex.rss" },
  { source: "Investing", category: "macro", url: "https://www.investing.com/rss/market_overview.rss" },
  { source: "Investing", category: "macro_fundamental", url: "https://www.investing.com/rss/market_overview_Fundamental.rss" },

  // Stocks / Risk sentiment
  { source: "FXStreet", category: "stocks", url: "https://www.fxstreet.com/rss/stocks" },
  { source: "Investing", category: "stocks", url: "https://www.investing.com/rss/stock.rss" },
];

const rawDir = "data/raw";
const outputPath = path.join(rawDir, "news.json");

// 1フィードあたり最大取得件数
const MAX_ITEMS_PER_FEED = 10;
// 最終的に保存する最大件数
const MAX_TOTAL_ITEMS = 100;

function normalizeText(text = "") {
  return text
    .replace(/\s+/g, " ")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .trim()
    .toLowerCase();
}

function parsePubDate(value) {
  const time = value ? new Date(value).getTime() : NaN;
  return Number.isNaN(time) ? 0 : time;
}

async function fetchOneFeed(feedConfig) {
  const { source, category, url } = feedConfig;

  try {
    console.log(`Fetching: [${source}/${category}] ${url}`);
    const feed = await parser.parseURL(url);

    const items = (feed.items || []).slice(0, MAX_ITEMS_PER_FEED).map((item) => ({
      source,
      category,
      title: item.title || "",
      link: item.link || "",
      pubDate: item.pubDate || item.isoDate || "",
    }));

    console.log(`Done: [${source}/${category}] ${items.length} items`);
    return items;
  } catch (error) {
    console.error(`Failed: [${source}/${category}] ${url}`);
    console.error(error?.message || error);
    return [];
  }
}

async function fetchNews() {
  const allItems = [];

  for (const feed of feeds) {
    const items = await fetchOneFeed(feed);
    allItems.push(...items);
  }

  // タイトル + リンクで重複除去
  const seen = new Set();
  const deduped = [];

  for (const item of allItems) {
    const key = `${normalizeText(item.title)}__${normalizeText(item.link)}`;
    if (!item.title || seen.has(key)) continue;
    seen.add(key);
    deduped.push(item);
  }

  // 日付の新しい順
  deduped.sort((a, b) => parsePubDate(b.pubDate) - parsePubDate(a.pubDate));

  const finalArticles = deduped.slice(0, MAX_TOTAL_ITEMS);

  if (!fs.existsSync(rawDir)) {
    fs.mkdirSync(rawDir, { recursive: true });
  }

  fs.writeFileSync(outputPath, JSON.stringify(finalArticles, null, 2), "utf-8");

  console.log(`Saved news.json (${finalArticles.length} items)`);

  if (finalArticles.length === 0) {
    throw new Error("ニュースを1件も取得できませんでした。");
  }
}

fetchNews().catch((error) => {
  console.error("Fetch failed:");
  console.error(error);
  process.exit(1);
});