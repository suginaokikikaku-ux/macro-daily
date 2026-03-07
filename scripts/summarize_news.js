import "dotenv/config";
import fs from "fs";
import path from "path";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const rawPath = "data/raw/news.json";
const dailyDir = "data/daily";
const today = new Date().toISOString().slice(0, 10);
const outputPath = path.join(dailyDir, `${today}.json`);

if (!fs.existsSync(rawPath)) {
  console.error("data/raw/news.json がありません。先に fetch を実行してください。");
  process.exit(1);
}

const rawText = fs.readFileSync(rawPath, "utf-8").trim();

if (!rawText) {
  console.error("data/raw/news.json が空です。");
  process.exit(1);
}

let news;
try {
  news = JSON.parse(rawText);
} catch (error) {
  console.error("data/raw/news.json のJSON解析に失敗しました。");
  console.error(error);
  process.exit(1);
}

if (!Array.isArray(news)) {
  console.error("data/raw/news.json の形式が想定外です。配列である必要があります。");
  process.exit(1);
}

if (news.length === 0) {
  console.error("ニュース件数が0件です。");
  process.exit(1);
}

const selectedNews = news.slice(0, 12);

const newsListForPrompt = selectedNews
  .map((item, index) => {
    return [
      `${index + 1}. タイトル: ${item.title ?? "タイトルなし"}`,
      `   取得元: ${item.source ?? "unknown"}`,
      `   カテゴリ: ${item.category ?? "other"}`,
      `   公開日: ${item.pubDate ?? ""}`,
      `   URL: ${item.link ?? ""}`
    ].join("\n");
  })
  .join("\n\n");

async function generate() {
  console.log("Starting OpenAI summarize...");

  const prompt = `
以下のニュースをもとに、FXとBTCのトレーダー向けの日刊記事を書いてください。

ニュース一覧:
${newsListForPrompt}

条件:
- 日本語で書く
- 事実ベースで簡潔に書く
- 煽りすぎない
- 初心者でも読みやすい
- 「取得元」や「カテゴリ」の偏りがあれば自然に文中へ反映する
- 例えば「本日はcrypto系ソースが多め」「FX/macro関連が中心」など、全体傾向を簡潔に触れてよい
- 見出しごとに整理する

構成:
1. 今日の結論
2. 重要ニュース
3. ニュースの背景
4. 市場の反応
5. USD/JPYへの影響
6. BTCへの影響
7. トレーダーの注目ポイント
`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }]
  });

  console.log("OpenAI summarize done.");

  const article = response.choices?.[0]?.message?.content?.trim();

  if (!article) {
    throw new Error("OpenAIから記事本文を取得できませんでした。");
  }

  if (!fs.existsSync(dailyDir)) {
    fs.mkdirSync(dailyDir, { recursive: true });
  }

  const uniqueSources = [...new Set(selectedNews.map((item) => item.source).filter(Boolean))];
  const uniqueCategories = [...new Set(selectedNews.map((item) => item.category).filter(Boolean))];

  fs.writeFileSync(
    outputPath,
    JSON.stringify(
      {
        date: today,
        article,
        meta: {
          sources: uniqueSources,
          categories: uniqueCategories,
          newsCount: selectedNews.length
        },
        news: selectedNews
      },
      null,
      2
    ),
    "utf-8"
  );

  console.log(`Saved ${outputPath}`);
}

generate().catch((error) => {
  console.error("Summarize failed:");
  console.error(error);
  process.exit(1);
});