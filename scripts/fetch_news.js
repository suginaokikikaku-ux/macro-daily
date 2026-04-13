import Parser from "rss-parser";
import fs from "fs";
import path from "path";

const parser = new Parser({
  timeout: 10000
});

const feeds = [
  // =========================
  // Global Crypto
  // =========================
  {
    source: "CoinDesk",
    category: "crypto",
    market: "global",
    lang: "en",
    url: "https://www.coindesk.com/arc/outboundfeeds/rss/"
  },
  {
    source: "FXStreet",
    category: "crypto",
    market: "global",
    lang: "en",
    url: "https://www.fxstreet.com/rss/crypto"
  },
  {
    source: "Investing",
    category: "crypto",
    market: "global",
    lang: "en",
    url: "https://www.investing.com/rss/302.rss"
  },

  // =========================
  // Global FX / Macro
  // =========================
  {
    source: "FXStreet",
    category: "fx",
    market: "global",
    lang: "en",
    url: "https://www.fxstreet.com/rss/news"
  },
  {
    source: "FXStreet",
    category: "fx_analysis",
    market: "global",
    lang: "en",
    url: "https://www.fxstreet.com/rss/analysis"
  },
  {
    source: "Investing",
    category: "fx",
    market: "global",
    lang: "en",
    url: "https://www.investing.com/rss/forex.rss"
  },
  {
    source: "Investing",
    category: "macro",
    market: "global",
    lang: "en",
    url: "https://www.investing.com/rss/market_overview.rss"
  },
  {
    source: "Investing",
    category: "macro",
    market: "global",
    lang: "en",
    url: "https://www.investing.com/rss/market_overview_Fundamental.rss"
  },

  // =========================
  // Global Stocks / Risk sentiment
  // =========================
  {
    source: "FXStreet",
    category: "stocks",
    market: "global",
    lang: "en",
    url: "https://www.fxstreet.com/rss/stocks"
  },
  {
    source: "Investing",
    category: "stocks",
    market: "global",
    lang: "en",
    url: "https://www.investing.com/rss/stock.rss"
  },

  // =========================
  // Japan supplement
  // =========================
  {
    source: "CoinPost",
    category: "crypto",
    market: "jp",
    lang: "ja",
    url: "https://coinpost.jp/?feed=rss2"
  },

  // あたらしい経済
  // WordPress系メディアの標準RSSを想定
  // 取得失敗しても全体は止めないので、安全に試せる
  {
    source: "あたらしい経済",
    category: "crypto",
    market: "jp",
    lang: "ja",
    url: "https://www.neweconomy.jp/feed"
  }
];

/*
  追加方針メモ
  - Nikkei系RSSは利用条件の観点から今回は入れない
  - Reuters日本語版は過去RSSの痕跡はあるが、現行の安定エンドポイント確認が弱いため固定追加しない
  - 日本語ソースは「毎日落ちずに回る」「利用条件で揉めにくい」ものだけ使う
*/

const rawDir = "data/raw";
const outputPath = path.join(rawDir, "news.json");

const MAX_ITEMS_PER_FEED = 10;
const MAX_TOTAL_ITEMS = 120;

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

function sourcePriority(item) {
  // global優先、ついで fx_analysis を少し優先
  const marketScore = item.market === "global" ? 0 : 1;
  const categoryScore = item.category === "fx_analysis" ? 0 : 1;
  return marketScore * 10 + categoryScore;
}

async function fetchOneFeed(feedConfig) {
  const { source, category, market, lang, url } = feedConfig;

  try {
    console.log(`Fetching: [${source}/${category}/${market}/${lang}] ${url}`);
    const feed = await parser.parseURL(url);

    const items = (feed.items || []).slice(0, MAX_ITEMS_PER_FEED).map((item) => ({
      source,
      category,
      market,
      lang,
      title: item.title || "",
      link: item.link || "",
      pubDate: item.pubDate || item.isoDate || ""
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

  const seen = new Set();
  const deduped = [];

  for (const item of allItems) {
    const key = `${normalizeText(item.title)}__${normalizeText(item.link)}`;
    if (!item.title || seen.has(key)) continue;
    seen.add(key);
    deduped.push(item);
  }

  deduped.sort((a, b) => {
    const dateDiff = parsePubDate(b.pubDate) - parsePubDate(a.pubDate);
    if (dateDiff !== 0) return dateDiff;
    return sourcePriority(a) - sourcePriority(b);
  });

  const finalArticles = deduped.slice(0, MAX_TOTAL_ITEMS);

  if (!fs.existsSync(rawDir)) {
    fs.mkdirSync(rawDir, { recursive: true });
  }

  fs.writeFileSync(outputPath, JSON.stringify(finalArticles, null, 2), "utf-8");

  const summary = finalArticles.reduce(
    (acc, item) => {
      acc.total += 1;
      acc.byMarket[item.market] = (acc.byMarket[item.market] || 0) + 1;
      acc.byLang[item.lang] = (acc.byLang[item.lang] || 0) + 1;
      acc.bySource[item.source] = (acc.bySource[item.source] || 0) + 1;
      return acc;
    },
    { total: 0, byMarket: {}, byLang: {}, bySource: {} }
  );

  console.log(`Saved news.json (${finalArticles.length} items)`);
  console.log("Summary:", JSON.stringify(summary, null, 2));

  if (finalArticles.length === 0) {
    throw new Error("ニュースを1件も取得できませんでした。");
  }
}

fetchNews().catch((error) => {
  console.error("Fetch failed:");
  console.error(error);
  process.exit(1);
});
