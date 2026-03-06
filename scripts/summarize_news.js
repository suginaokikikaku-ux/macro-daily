import "dotenv/config";
import OpenAI from "openai";
import fs from "fs";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const rawPath = "data/raw/news.json";

const raw = fs.readFileSync(rawPath, "utf-8");
const news = JSON.parse(raw);

const headlines = news.slice(0,5).map(n => n.title).join("\n");

async function generate() {

const prompt = `
以下のニュースをもとに
FXとBTCのトレーダー向けに
市場分析記事を書いてください。

ニュース
${headlines}

構成

1 今日の結論
2 重要ニュース
3 ニュースの背景
4 市場の反応
5 USDJPYへの影響
6 BTCへの影響
7 トレーダーの注目ポイント
`;

const response = await openai.chat.completions.create({
model: "gpt-4o-mini",
messages: [{ role: "user", content: prompt }]
});

const article = response.choices[0].message.content;

const today = new Date().toISOString().slice(0,10);

fs.writeFileSync(
`data/daily/${today}.json`,
JSON.stringify({article}, null, 2)
);

}

generate();