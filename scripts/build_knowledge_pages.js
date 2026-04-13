import fs from "fs";
import path from "path";

const basicsDir = path.join("basics");
const siteUrlBase = process.env.SITE_URL || "https://YOUR_USERNAME.github.io/macro-daily";

const pages = [
  {
    slug: "fx/what-is-fx",
    title: "FXとは？初心者向け基礎ガイド",
    description: "FXの基本、為替、ドル円、レバレッジの考え方を初心者向けに整理します。",
    category: "FX基礎",
    content: `
## FXとは
FXは、異なる通貨の交換レートの変化を見ていく市場です。日本では特にドル円がよく見られます。

## まず理解するべきこと
- 通貨は2つで1組で動く
- 金利差や経済指標で動きやすい
- レバレッジがあるため、値動きの影響を受けやすい

## 初心者が最初に見るべきポイント
- ドル円とは何か
- 金利と為替の関係
- 重要指標の種類
- リスクオン / リスクオフの意味

## 次に読むページ
- なぜ為替は動くのか
- ドル円とは何か
- 経済指標とは何か
`
  },
  {
    slug: "fx/what-moves-fx",
    title: "なぜ為替は動くのか",
    description: "金利、雇用統計、CPI、地政学など、為替が動く主因を整理します。",
    category: "FX基礎",
    content: `
## 為替が動く主な理由
為替は、単純に上がる下がるではなく、材料の種類で動き方が変わります。

## 主な材料
- 金利
- CPIや雇用統計などの経済指標
- 中央銀行の発言
- 地政学リスク
- 株式市場や原油の動き

## 大事な見方
同じニュースでも、市場が何を気にしているかで反応は変わります。だから「ニュース内容」だけでなく、「市場が何をテーマにしているか」を見る必要があります。

## 次に読むページ
- ドル円とは何か
- リスクオン / リスクオフとは
`
  },
  {
    slug: "fx/what-is-usdjpy",
    title: "ドル円とは？USD/JPYの見方",
    description: "USD/JPYの基本、なぜ多くの人がドル円を見るのかを解説します。",
    category: "FX基礎",
    content: `
## ドル円とは
USD/JPY は米ドルと日本円の通貨ペアです。日本人にとって一番馴染みがあり、ニュースとの接続も分かりやすい通貨ペアです。

## 見るべき理由
- 日本語情報が多い
- 米金利や日銀政策の影響を受けやすい
- マクロニュースとの接続が分かりやすい

## 初心者が混乱しやすい点
- ドルが強いのか、円が弱いのかを分けて考える
- 「ドル円上昇 = ドル買い / 円売り」の両面で考える
`
  },
  {
    slug: "crypto/what-is-crypto",
    title: "暗号通貨とは？初心者向け基礎ガイド",
    description: "暗号通貨、ビットコイン、アルトコイン、ブロックチェーンの基本を整理します。",
    category: "暗号資産基礎",
    content: `
## 暗号通貨とは
暗号通貨は、ブロックチェーンを基盤にしたデジタル資産です。ビットコインだけでなく、多くの用途別プロジェクトがあります。

## 基本の分類
- ビットコイン
- イーサリアム
- アルトコイン
- ステーブルコイン

## 初心者が最初に理解すべきこと
- 価格だけでなく、プロジェクトの目的を見る
- 市場テーマごとに資金が動く
- 同じ暗号資産でも役割が違う
`
  },
  {
    slug: "crypto/what-is-blockchain",
    title: "ブロックチェーンとは？",
    description: "ブロックチェーンの役割と、暗号資産プロジェクトで重要な理由を整理します。",
    category: "暗号資産基礎",
    content: `
## ブロックチェーンとは
ブロックチェーンは、取引履歴や状態を分散管理する仕組みです。暗号資産の土台になっています。

## なぜ重要か
- 中央管理者がいなくても記録を維持できる
- 改ざん耐性が高い
- プロジェクトごとに用途が違う

## 見るべきポイント
- 何を解決するチェーンなのか
- 利用者がいるのか
- 開発が継続しているのか
`
  },
  {
    slug: "crypto/how-to-read-projects",
    title: "暗号資産プロジェクトの見方",
    description: "価格だけでなく、進捗や利用状況からプロジェクトを見る基本を整理します。",
    category: "暗号資産基礎",
    content: `
## プロジェクトを見るときの基本
価格だけを見ても中身は分かりません。重要なのは、何が進んでいるのかです。

## 見るべき要素
- 開発進捗
- 提携
- エコシステム拡大
- ユーザー数
- TVLや利用状況
- 規制対応

## 大事な考え方
単発ニュースか、継続して追うべき進捗かを分けて考えることが重要です。
`
  },
  {
    slug: "crypto/major-vs-alt",
    title: "メインコインとアルトコインの違い",
    description: "BTC・ETHなどの主要コインと、その他のアルトコインの違いを整理します。",
    category: "暗号資産基礎",
    content: `
## メインコインとは
市場全体の軸になるコインです。BTC、ETH、SOL などは市場テーマの中心になりやすいです。

## アルトコインとは
主要コイン以外のプロジェクト群です。テーマや個別材料で大きく動きやすいです。

## 見方の違い
- メインコインは市場全体の方向感を見る
- アルトコインはテーマ・進捗・資金循環を見る
`
  },
  {
    slug: "start/how-to-start",
    title: "学習から導入までの流れ",
    description: "初心者が情報収集から学習、比較、導入まで進む流れを整理します。",
    category: "導入",
    content: `
## 全体の流れ
初心者がいきなりサービスや口座選びに行くと失敗しやすいです。順番が大事です。

## おすすめの流れ
1. 基礎知識を学ぶ
2. ニュースの見方を学ぶ
3. FX / 暗号資産の違いを理解する
4. 必要なサービスを比較する
5. 導入を検討する

## このサイトでやるべきこと
- 毎日の記事で市場の空気感を掴む
- 基礎ページでわからない用語を埋める
- 比較ページで自分に合う導線を選ぶ
`
  },
  {
    slug: "start/how-to-read-news",
    title: "相場ニュースの読み方",
    description: "ニュースをそのまま信じるのではなく、どう解釈するかを整理します。",
    category: "導入",
    content: `
## ニュースを見るときの基本
重要なのはニュースそのものではなく、そのニュースで市場が何を反応材料にしているかです。

## 見る順番
- 何が起きたか
- 市場はどう反応したか
- それは一時的か継続的か
- 次に何を確認すべきか

## 読者が身につけるべき視点
- 事実と解釈を分ける
- 価格とテーマを分ける
- 単発材料と継続テーマを分ける
`
  }
];

function ensureDir(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function escapeHtml(str = "") {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function markdownToHtml(markdown = "") {
  let html = escapeHtml(markdown);
  html = html.replace(/^## (.*)$/gm, "<h2>$1</h2>");
  html = html.replace(/^\- (.*)$/gm, "<li>$1</li>");
  html = html.replace(/^(\d+)\. (.*)$/gm, "<li>$1. $2</li>");
  html = html.replace(/(<li>.*<\/li>)/gs, (match) => `<ul>${match}</ul>`);
  html = html.replace(/\n\n/g, "</p><p>");
  html = `<p>${html}</p>`;
  html = html.replace(/<p><h2>/g, "<h2>").replace(/<\/h2><\/p>/g, "</h2>");
  html = html.replace(/<p><ul>/g, "<ul>").replace(/<\/ul><\/p>/g, "</ul>");
  html = html.replace(/<\/ul><ul>/g, "");
  return html;
}

function buildPage(page) {
  const canonical = `${siteUrlBase.replace(/\/$/, "")}/basics/${page.slug}.html`;
  const contentHtml = markdownToHtml(page.content);

  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(page.title)}｜Macro Daily</title>
  <meta name="description" content="${escapeHtml(page.description)}" />
  <link rel="canonical" href="${canonical}" />
  <meta name="robots" content="index,follow" />
  <style>
    body {
      margin: 0;
      padding: 32px 16px 64px;
      font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      line-height: 1.8;
      background: #0b1120;
      color: #e5e7eb;
    }
    .container {
      max-width: 860px;
      margin: 0 auto;
    }
    a {
      color: #7dd3fc;
      text-decoration: none;
    }
    .back {
      display: inline-block;
      margin-bottom: 18px;
      font-weight: 700;
    }
    .card {
      background: rgba(15, 23, 42, 0.92);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 18px;
      padding: 28px;
    }
    .badge {
      display: inline-block;
      margin-bottom: 12px;
      padding: 4px 10px;
      border-radius: 999px;
      background: rgba(255,255,255,0.08);
      font-size: 12px;
      font-weight: 700;
    }
    h1 {
      margin: 0 0 12px;
      font-size: 36px;
      line-height: 1.2;
    }
    h2 {
      margin-top: 28px;
      font-size: 24px;
      color: #f8fafc;
      border-left: 4px solid #38bdf8;
      padding-left: 12px;
    }
    p, li {
      color: #d1d5db;
      font-size: 16px;
    }
    ul {
      padding-left: 22px;
    }
  </style>
</head>
<body>
  <div class="container">
    <a class="back" href="../index.html">← 基礎知識一覧へ戻る</a>
    <div class="card">
      <div class="badge">${escapeHtml(page.category)}</div>
      <h1>${escapeHtml(page.title)}</h1>
      <p>${escapeHtml(page.description)}</p>
      ${contentHtml}
    </div>
  </div>
</body>
</html>`;
}

for (const page of pages) {
  const outputPath = path.join(basicsDir, `${page.slug}.html`);
  ensureDir(outputPath);
  fs.writeFileSync(outputPath, buildPage(page), "utf-8");
  console.log(`Saved ${outputPath}`);
}

const basicsIndexPath = path.join(basicsDir, "index.html");
const grouped = pages.reduce((acc, page) => {
  if (!acc[page.category]) acc[page.category] = [];
  acc[page.category].push(page);
  return acc;
}, {});

const basicsIndexHtml = `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>基礎知識一覧｜Macro Daily</title>
  <meta name="description" content="FXと暗号資産の初心者向け基礎知識ページ一覧です。" />
  <style>
    body {
      margin: 0;
      padding: 32px 16px 64px;
      font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      line-height: 1.8;
      background: #0b1120;
      color: #e5e7eb;
    }
    .container {
      max-width: 980px;
      margin: 0 auto;
    }
    a {
      color: inherit;
      text-decoration: none;
    }
    .back {
      display: inline-block;
      margin-bottom: 18px;
      color: #7dd3fc;
      font-weight: 700;
    }
    .hero, .section {
      background: rgba(15, 23, 42, 0.92);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 18px;
      padding: 28px;
      margin-bottom: 24px;
    }
    h1 {
      margin: 0 0 12px;
      font-size: 38px;
    }
    h2 {
      margin: 0 0 14px;
      font-size: 26px;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 16px;
    }
    .card {
      display: block;
      padding: 18px;
      border-radius: 14px;
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.08);
    }
    .card h3 {
      margin: 0 0 8px;
      font-size: 20px;
    }
    .card p {
      margin: 0;
      color: #cbd5e1;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <a class="back" href="../index.html">← トップへ戻る</a>

    <div class="hero">
      <h1>基礎知識一覧</h1>
      <p>FXと暗号資産をこれから学ぶ人向けに、最初に読むべきページをまとめています。</p>
    </div>

    ${Object.entries(grouped)
      .map(
        ([category, items]) => `
      <section class="section">
        <h2>${escapeHtml(category)}</h2>
        <div class="grid">
          ${items
            .map(
              (item) => `
            <a class="card" href="./${item.slug}.html">
              <h3>${escapeHtml(item.title)}</h3>
              <p>${escapeHtml(item.description)}</p>
            </a>`
            )
            .join("")}
        </div>
      </section>`
      )
      .join("")}
  </div>
</body>
</html>`;

ensureDir(basicsIndexPath);
fs.writeFileSync(basicsIndexPath, basicsIndexHtml, "utf-8");
console.log(`Saved ${basicsIndexPath}`);
