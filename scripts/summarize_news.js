import "dotenv/config";
import fs from "fs";
import path from "path";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const rawPath = "data/raw/news.json";
const dailyDir = "data/daily";

function getJstDateString() {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
  return formatter.format(now);
}

const today = getJstDateString();

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

function ensureEnv() {
  if (!process.env.OPENAI_API_KEY) {
    console.error("OPENAI_API_KEY が未設定です。");
    process.exit(1);
  }
}

function loadNews() {
  if (!fs.existsSync(rawPath)) {
    console.error("data/raw/news.json がありません。先に fetch を実行してください。");
    process.exit(1);
  }

  const rawText = fs.readFileSync(rawPath, "utf-8").trim();

  if (!rawText) {
    console.error("data/raw/news.json が空です。");
    process.exit(1);
  }

  try {
    const parsed = JSON.parse(rawText);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      console.error("news.json の形式が不正、またはニュース件数が0件です。");
      process.exit(1);
    }
    return parsed;
  } catch (error) {
    console.error("data/raw/news.json のJSON解析に失敗しました。");
    console.error(error);
    process.exit(1);
  }
}

function normalizeCategory(category) {
  return String(category ?? "").trim().toLowerCase();
}

function pickFxNews(news) {
  const fxCategories = new Set(["fx", "macro", "fx_analysis"]);
  return news.filter((item) => fxCategories.has(normalizeCategory(item.category)));
}

function pickCryptoNews(news) {
  const cryptoCategories = new Set(["crypto"]);
  return news.filter((item) => cryptoCategories.has(normalizeCategory(item.category)));
}

function dedupeNews(items) {
  const seen = new Set();
  const result = [];

  for (const item of items) {
    const key = [
      String(item.title ?? "").trim().toLowerCase(),
      String(item.source ?? "").trim().toLowerCase(),
      String(item.link ?? "").trim().toLowerCase()
    ].join("||");

    if (seen.has(key)) continue;
    seen.add(key);
    result.push(item);
  }

  return result;
}

function limitNews(items, limit) {
  return dedupeNews(items).slice(0, limit);
}

function buildNewsListForPrompt(newsItems) {
  return newsItems
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
}

function buildFxPrompt(newsListForPrompt) {
  return `
あなたはプロトレーダー兼マクロアナリストです。
ニュースを要約するのではなく、「相場構造の解釈」を日本語で提供してください。

目的：
初心者でも理解できるが、中級者以上が“気づき”を得られる、トレーダー向けの濃い日刊記事を作成すること。

【最重要ルール】
- 売買指示（エントリー・損切り・利確）は絶対に書かない
- 必ず事実ベースで書く
- 抽象表現は禁止（例：「上昇圧力」「注意が必要」「可能性があります」など）
- 因果関係を1段で終わらせず、2〜3段で説明する
- 単なる要約で終わらず、「なぜその動きが起きたのか」「継続性があるのか」を解釈する
- source/category の偏りがあれば本文で自然に触れる
- 初心者にも読めるが、中身は薄くしない
- 価格の断定予想はしない
- 見出しはMarkdownの ## を使う
- 最後は「今日の結論」で締める
- 断定ベースで書く
- 曖昧な一般論で逃げない

【数値ルール】
- 価格、為替レート、変動率、金額、時価総額、指数水準は推定禁止
- 数値はニュース一覧に明記されたものだけを使う
- 数値の裏付けがない場合は、具体的な価格帯や為替水準を書かない
- 数字を書きたくても根拠が無ければ、方向性や構造だけを書く
- 過去の一般知識や記憶で数値を補完しない
- 1ドル=○円のような直接的な為替水準は、ニュース一覧に根拠がある場合のみ書く

【記事構成】
1. 1分で読める結論
2. 今日の主要ドライバー3つ
3. 市場構造の解釈
4. USD/JPY分析
5. BTCへの波及
6. 強気・弱気の分岐条件
7. 今日の示唆
8. 今日の結論

【各セクションの要件】

### 1. 1分で読める結論
- 今日の相場の本質を一言で示す
- 何がトリガーで動いたかを書く
- USD/JPYを中心に方向感を簡潔に書く
- 必要ならBTCへの波及も短く触れる
- 数値は根拠がある場合のみ使う

### 2. 今日の主要ドライバー3つ
- 必ず「原因 → 結果」の形で書く
- 例：
  - 原油上昇 → インフレ懸念 → 米金利上昇 → ドル買い
  - 地政学リスク上昇 → リスク回避 → 安全資産選好 → 通貨・商品に波及
- 3つに絞る
- それぞれ2〜4文で、相場への接続まで書く
- 数値は根拠がある場合のみ使う

### 3. 市場構造の解釈
- 今回の動きは何主導かを明示する（金利 / 地政学 / 流動性 / ポジション調整 など）
- 一時的な動きか、継続性がある動きかを判断する
- 機関・短期筋・個人など、どのプレイヤーが主導していそうか仮説を書く
- 「ニュースが出た」ではなく、「なぜ今その反応になったか」を論理的に説明する
- この記事全体を貫く仮説を1つ提示する

### 4. USD/JPY分析
- 現在の相場観を明示する
- 短期（当日〜翌日）の方向性を書く
- 中期（数日〜1週間）の見方を書く
- 上に抜けたら意味が変わる水準を書く場合は、ニュース一覧に根拠があるときだけにする
- 下に割れたらシナリオが崩れる水準を書く場合は、ニュース一覧に根拠があるときだけにする
- 水準根拠がない場合は、価格ではなく構造変化の条件で書く
- 今回の動きが「継続型」か「ノイズ型」かを明示する
- 売買指示は書かない

### 5. BTCへの波及
- 為替・金利・リスクオンオフがBTCへどう波及しうるかを書く
- BTC自体の詳しい市場分析はしない
- 相関や資金の逃避先としての見られ方に絞る
- 2〜4文で簡潔にまとめる
- 数値は根拠がある場合のみ使う

### 6. 強気・弱気の分岐条件
- どの条件で現行シナリオが維持されるかを書く
- どの条件で見方が変わるかを書く
- 条件は価格・材料・イベントベースの両方を織り交ぜる
- 価格条件はニュース一覧に根拠がある場合のみ使う
- 根拠がない場合は、イベント・材料・反応ベースで書く
- 箇条書きでもよい

### 7. 今日の示唆
- 売買指示は禁止
- 今の相場で意識すべきことを書く
- 見るべき指標・イベント・市場反応を書く
- 勝っている人が注目する視点を簡潔に示す
- 「何を見るべき日か」が伝わるように書く

### 8. 今日の結論
- 最後を1〜3文で締める
- 今日の相場を一言で定義する
- 投資助言にはしない

【SEOも同時に作成】
以下のJSONだけを返してください。コードブロックは不要です。

{
  "seoTitle": "32文字前後のSEOタイトル",
  "seoDescription": "90〜140文字前後のメタディスクリプション",
  "article": "Markdown形式の記事本文"
}

【SEOルール】
- seoTitle は検索で意味が伝わる具体的なタイトルにする
- seoDescription は抽象的にせず、USD/JPY、マクロ、地政学、金利などの主要論点を自然に入れる
- 煽りすぎない
- ニュースまとめではなく、分析記事だと伝わる表現にする
- 数値は根拠がある場合のみ入れる

【出力ルール】
- article はMarkdown形式
- 各見出しは必ず ## を使う
- 内容は具体的に
- 不要な前置きや免責文は不要
- JSON以外は返さない

【ニュース一覧】
${newsListForPrompt}
`;
}

function buildCryptoPrompt(newsListForPrompt) {
  return `
あなたは暗号資産市場を分析するリサーチャー兼マーケットアナリストです。
ニュースを要約するだけではなく、「市場全体の地合い」「主要コインの状態」「個別プロジェクトの進捗」「その後に確認すべきこと」を整理してください。

目的：
初心者でも流れを理解でき、中級者以上が次に何を調べるべきか分かる、価値のある暗号資産デイリー記事を作ること。

【最重要ルール】
- 売買指示（買い、売り、エントリー、利確、損切り）は絶対に書かない
- 単なる価格要約で終わらせない
- BTCだけに寄せず、主要コイン全体と注目プロジェクトの動きも扱う
- 必ず「何が起きたか」と「その後に何を見るべきか」を分けて書く
- 抽象表現は禁止（例：「注目されている」「期待される」だけで終わらない）
- 可能な限り、対象銘柄、テーマ、プロジェクト名、進捗内容を具体的に書く
- 短命な話題か、継続ウォッチに値するテーマかを判断する
- 断定ベースで書く
- 見出しはMarkdownの ## を使う
- 「〜可能性があります」は使わない

【数値ルール】
- 価格、変動率、金額、時価総額、TVL、資金流入額は推定禁止
- 数値はニュース一覧に明記されたものだけを使う
- 数値の裏付けがない場合は、具体的な価格や金額を書かない
- 過去の一般知識や記憶で数値を補完しない
- 数字を書けない場合は、地合い、テーマ、進捗、資金の向き先を文章で整理する

【記事構成】
1. 1分で読める結論
2. 今日の暗号資産市場の地合い
3. 今日の主要トピック3つ
4. メインコインの整理
5. 個別プロジェクトの進捗
6. 今日の要約から見える示唆
7. 次に確認すべきこと
8. 今日の結論

【各セクションの要件】

### 1. 1分で読める結論
- 今日の市場の本質を一言で示す
- 何が市場を動かしたかを書く
- メインコイン全体の方向感を短く整理する
- 数値は根拠がある場合のみ使う

### 2. 今日の暗号資産市場の地合い
- BTC、ETH、SOLなど主要コインの強弱感を書く
- BTC主導か、ETH主導か、アルト循環か、選別相場かを判断する
- 市場全体がリスクオンなのか、テーマ物色なのか、守りの姿勢なのかを明示する
- 数値は根拠がある場合のみ使う

### 3. 今日の主要トピック3つ
- 材料を3つに絞る
- それぞれ「何が起きたか → なぜ重要か → どこに波及するか」で説明する
- ETF、規制、アップデート、提携、資金流入、ハッキング、トークンアンロックなどを適切に整理する
- 数値は根拠がある場合のみ使う

### 4. メインコインの整理
- BTC、ETH、SOL、XRPなど主要コインの状態を簡潔に整理する
- 価格だけでなく、資金の集まり方やテーマ性を書く
- 「市場の軸になっている銘柄」と「存在感が落ちている銘柄」を分けて書く
- 数値は根拠がある場合のみ使う

### 5. 個別プロジェクトの進捗
- メインコイン以外でニュースに出てきた重要プロジェクトを整理する
- 価格ではなく、進捗に重点を置く
- 例：
  - 開発進捗
  - 提携
  - 新機能リリース
  - エコシステム拡大
  - 利用者増減
  - 規制対応
  - 資金調達
- 単発の話題か、継続して追う価値があるかを判断する
- 数値は根拠がある場合のみ使う

### 6. 今日の要約から見える示唆
- ニュース全体から見える市場テーマをまとめる
- いま資金が向かっているのは何かを書く
- 表面的に盛り上がっているだけか、中身のある進展かを判断する
- 今日の市場の空気感を一言で定義する

### 7. 次に確認すべきこと
- 売買ではなく、情報収集アクションを書く
- 例：
  - 明日以降も追うべきテーマ
  - 追加で確認すべきプロジェクト
  - 開発や提携の続報を待つべき案件
  - オンチェーンや資金流入を見て判断すべき話題
  - 短命なので深追い不要なニュース
- 読者が「この後どこを見るべきか」が分かる内容にする

### 8. 今日の結論
- 1〜3文で締める
- 今日の暗号資産市場を一言で定義する
- 投資助言にはしない

【SEOも同時に作成】
以下のJSONだけを返してください。コードブロックは不要です。

{
  "seoTitle": "32文字前後のSEOタイトル",
  "seoDescription": "90〜140文字前後のメタディスクリプション",
  "article": "Markdown形式の記事本文"
}

【SEOルール】
- 暗号資産、主要コイン、プロジェクト進捗、市場テーマが伝わるタイトルにする
- 単なるニュースまとめではなく、整理・分析記事だと分かる表現にする
- 煽りすぎない
- 数値は根拠がある場合のみ入れる

【出力ルール】
- article はMarkdown形式
- 各見出しは必ず ## を使う
- JSON以外は返さない

【ニュース一覧】
${newsListForPrompt}
`;
}

function collectValidationErrors(type, article) {
  const errors = [];
  const text = String(article ?? "");

  if (!text.trim()) {
    errors.push("article が空です。");
    return errors;
  }

  const usdJpyPatterns = [
    /\bUSD\/JPY\b[^\n\r]{0,30}?(\d{2,3}(?:\.\d+)?)/gi,
    /\bドル円\b[^\n\r]{0,30}?(\d{2,3}(?:\.\d+)?)/gi,
    /1ドル\s*=\s*(\d{2,3}(?:\.\d+)?)\s*円/gi,
    /\$(\d{2,3}(?:\.\d+)?)\s*=\s*(\d{2,3}(?:\.\d+)?)\s*円/gi
  ];

  for (const pattern of usdJpyPatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const value = Number(match[1]);
      if (Number.isNaN(value)) continue;

      if (value < 130 || value > 170) {
        errors.push(`USD/JPY と見られる数値が異常です: ${match[0]}`);
      }
    }
  }

  const btcPatterns = [
    /\bBTC\b[^\n\r]{0,30}?(\d{3,6}(?:,\d{3})*(?:\.\d+)?)/gi,
    /\bビットコイン\b[^\n\r]{0,30}?(\d{3,6}(?:,\d{3})*(?:\.\d+)?)/gi
  ];

  for (const pattern of btcPatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const raw = String(match[1]).replace(/,/g, "");
      const value = Number(raw);
      if (Number.isNaN(value)) continue;

      if (value > 0 && value < 1000) {
        errors.push(`BTC と見られる数値が小さすぎます: ${match[0]}`);
      }
    }
  }

  const percentPattern = /(-?\d+(?:\.\d+)?)\s*%/g;
  let percentMatch;
  while ((percentMatch = percentPattern.exec(text)) !== null) {
    const value = Number(percentMatch[1]);
    if (Number.isNaN(value)) continue;

    if (Math.abs(value) > 100) {
      errors.push(`変動率と見られる数値が異常です: ${percentMatch[0]}`);
    }
  }

  const marketCapPatterns = [
    /時価総額[^\n\r]{0,20}?(\d+(?:\.\d+)?)\s*(兆|億)?\s*ドル/gi,
    /market cap[^\n\r]{0,20}?(\d+(?:\.\d+)?)\s*(trillion|billion|million)?/gi
  ];

  for (const pattern of marketCapPatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const value = Number(match[1]);
      if (Number.isNaN(value)) continue;

      if (value <= 0) {
        errors.push(`時価総額と見られる数値が不正です: ${match[0]}`);
      }
    }
  }

  if (type === "fx") {
    const suspiciousFxTerms = [
      /1ドル\s*=\s*1[01]\d(?:\.\d+)?円/gi,
      /\bUSD\/JPY\b[^\n\r]{0,30}?11\d(?:\.\d+)?/gi,
      /\bドル円\b[^\n\r]{0,30}?11\d(?:\.\d+)?/gi
    ];

    for (const pattern of suspiciousFxTerms) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        errors.push(`USD/JPY の不自然な水準を検出しました: ${match[0]}`);
      }
    }
  }

  return errors;
}

function validateGeneratedArticle({ type, article, seoTitle, seoDescription }) {
  const errors = [];

  if (!article || !String(article).trim()) {
    errors.push("article が空です。");
  }

  if (!seoTitle || !String(seoTitle).trim()) {
    errors.push("seoTitle が空です。");
  }

  if (!seoDescription || !String(seoDescription).trim()) {
    errors.push("seoDescription が空です。");
  }

  errors.push(...collectValidationErrors(type, article));

  if (errors.length > 0) {
    const message = [
      `${type}: 生成後バリデーションで異常を検出しました。`,
      ...errors.map((item) => `- ${item}`)
    ].join("\n");
    throw new Error(message);
  }
}

async function callOpenAI(prompt) {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7
  });

  const content = response.choices?.[0]?.message?.content?.trim();

  if (!content) {
    throw new Error("OpenAIから応答を取得できませんでした。");
  }

  try {
    return JSON.parse(extractJson(content));
  } catch (error) {
    console.error("OpenAI raw output:");
    console.error(content);
    throw error;
  }
}

async function generateArticle({ type, selectedNews, promptBuilder, fallbackTitle, fallbackDescription }) {
  if (!Array.isArray(selectedNews) || selectedNews.length === 0) {
    console.log(`Skip ${type}: 対象ニュースが0件です。`);
    return;
  }

  const newsListForPrompt = buildNewsListForPrompt(selectedNews);
  const prompt = promptBuilder(newsListForPrompt);

  console.log(`Starting OpenAI summarize... type=${type} date=${today} items=${selectedNews.length}`);

  const parsed = await callOpenAI(prompt);

  const article = parsed.article?.trim();
  const seoTitle = parsed.seoTitle?.trim();
  const seoDescription = parsed.seoDescription?.trim();

  validateGeneratedArticle({
    type,
    article,
    seoTitle: seoTitle || fallbackTitle,
    seoDescription: seoDescription || fallbackDescription
  });

  const uniqueSources = [...new Set(selectedNews.map((item) => item.source).filter(Boolean))];
  const uniqueCategories = [...new Set(selectedNews.map((item) => item.category).filter(Boolean))];

  if (!fs.existsSync(dailyDir)) {
    fs.mkdirSync(dailyDir, { recursive: true });
  }

  const outputPath = path.join(dailyDir, `${type}-${today}.json`);

  fs.writeFileSync(
    outputPath,
    JSON.stringify(
      {
        type,
        date: today,
        seoTitle: seoTitle || fallbackTitle,
        seoDescription: seoDescription || fallbackDescription,
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

async function main() {
  ensureEnv();

  const news = loadNews();

  const fxNews = limitNews(pickFxNews(news), 15);
  const cryptoNews = limitNews(pickCryptoNews(news), 15);

  await generateArticle({
    type: "fx",
    selectedNews: fxNews,
    promptBuilder: buildFxPrompt,
    fallbackTitle: `Macro Daily FX ${today}｜USD/JPY・マクロ市場分析`,
    fallbackDescription:
      "USD/JPYを中心に、金利・地政学・マクロ材料が為替市場へどう波及しているかを整理したデイリー分析記事です。"
  });

  await generateArticle({
    type: "crypto",
    selectedNews: cryptoNews,
    promptBuilder: buildCryptoPrompt,
    fallbackTitle: `Macro Daily Crypto ${today}｜暗号資産市場整理`,
    fallbackDescription:
      "BTC・ETH・SOLなど主要コインの地合いと、個別プロジェクトの進捗、次に確認すべきテーマを整理した暗号資産デイリー記事です。"
  });
}

main().catch((error) => {
  console.error("Summarize failed:");
  console.error(error);
  process.exit(1);
});
