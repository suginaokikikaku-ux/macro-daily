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

function extractJson(text) {
  const trimmed = text.trim();

  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    return trimmed;
  }

  const fenced = trimmed.match(/```json\s*([\s\S]*?)\s*```/i);
  if (fenced) return fenced[1];

  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    return trimmed.slice(firstBrace, lastBrace + 1);
  }

  throw new Error("JSON部分を抽出できませんでした。");
}

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

if (!Array.isArray(news) || news.length === 0) {
  console.error("news.json の形式が不正、またはニュース件数が0件です。");
  process.exit(1);
}

const selectedNews = news.slice(0, 15);

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
あなたはFX・BTC・マクロ市場を毎日整理するプロのニュースレター編集者です。
以下のニュース一覧をもとに、日本語で「トレーダー向けの濃い日刊記事」を作成してください。

【重要ルール】
- 必ず事実ベース
- 煽りすぎない
- 初心者にも読めるが、中身は薄くしない
- 単なる要約で終わらず、「なぜ相場が反応したのか」「USD/JPYとBTCにどう波及するか」を書く
- source/category の偏りがあれば本文で自然に触れる
- 短期視点とやや中期視点の違いも軽く触れる
- 見出しはMarkdownの ## を使う
- 価格を断定予想しすぎない
- 最後は「今日の結論」で締める

【記事構成】 ※1と8は入れ替え済み
1. 1分で読める要約
2. 今日の主要材料3つ
3. ニュースの背景
4. 市場の反応
5. USD/JPYへの影響
6. BTCへの影響
7. 強気・弱気の分岐条件と監視ポイント
8. 今日の結論

【SEOも同時に作成】
以下のJSONだけを返してください。コードブロックは不要です。

{
  "seoTitle": "32文字前後のSEOタイトル",
  "seoDescription": "90〜140文字前後のメタディスクリプション",
  "article": "Markdown形式の記事本文"
}

【ニュース一覧】
${newsListForPrompt}
`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7
  });

  const content = response.choices?.[0]?.message?.content?.trim();

  if (!content) {
    throw new Error("OpenAIから応答を取得できませんでした。");
  }

  let parsed;
  try {
    parsed = JSON.parse(extractJson(content));
  } catch (error) {
    console.error("OpenAI raw output:");
    console.error(content);
    throw error;
  }

  const article = parsed.article?.trim();
  const seoTitle = parsed.seoTitle?.trim();
  const seoDescription = parsed.seoDescription?.trim();

  if (!article) {
    throw new Error("article が空です。");
  }

  const uniqueSources = [...new Set(selectedNews.map((item) => item.source).filter(Boolean))];
  const uniqueCategories = [...new Set(selectedNews.map((item) => item.category).filter(Boolean))];

  if (!fs.existsSync(dailyDir)) {
    fs.mkdirSync(dailyDir, { recursive: true });
  }

  fs.writeFileSync(
    outputPath,
    JSON.stringify(
      {
        date: today,
        seoTitle: seoTitle || `Macro Daily ${today}｜FX・BTC・マクロ市場まとめ`,
        seoDescription:
          seoDescription ||
          `FX・BTC・マクロ市場の注目ニュースを整理。USD/JPYとビットコインへの影響、監視ポイント、今日の結論までまとめています。`,
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