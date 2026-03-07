import fs from "fs";
import path from "path";

const today = new Date().toISOString().slice(0, 10);
const dailyPath = path.join("data", "daily", `${today}.json`);
const postsDir = path.join("site", "posts");
const postPath = path.join(postsDir, `${today}.md`);

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
const categoryText = categories.length > 0 ? categories.join(" / ") : "other";

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
title: "Macro Daily ${today}"
date: "${today}"
sources: "${sourceText}"
categories: "${categoryText}"
---

# Macro Daily ${today}

${article}

---

## 今日の取得元
${sourceText}

## 今日のカテゴリ
${categoryText}

## 参照ニュース一覧
${references || "- 参照ニュースなし"}
`;

fs.writeFileSync(postPath, markdown, "utf-8");

console.log(`Saved ${postPath}`);