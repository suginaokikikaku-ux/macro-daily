import fs from "fs";

const today = new Date().toISOString().slice(0,10);

const dataPath = `data/daily/${today}.json`;

if (!fs.existsSync(dataPath)) {
  console.error("dailyデータがありません。summarizeを実行してください。");
  process.exit(1);
}

const data = JSON.parse(
  fs.readFileSync(dataPath,"utf-8")
);

const article = data.article;

const outputPath = `site/posts/${today}.md`;

fs.writeFileSync(
  outputPath,
  article,
  "utf-8"
);

console.log(`記事生成完了: ${outputPath}`);