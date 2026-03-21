# Macro Daily

Macro Daily は **FX / 仮想通貨トレーダー向けニュースメディア** を自動生成するプロジェクトです。

ニュース取得 → AI要約 → HTML生成 → GitHub Pages公開  
までを **完全自動化**しています。

---

# サイト目的

本サイトは以下を目的としています。

- FX / BTC トレーダー向け市場分析
- マクロニュースの整理
- 自動記事生成
- SEO流入
- アフィリエイト収益

---

# 技術スタック

|分野|技術|
|---|---|
|言語|Node.js (JavaScript)|
|AI|OpenAI API|
|データ取得|RSS|
|ホスティング|GitHub Pages|
|自動化|GitHub Actions|
|スタイル|HTML / CSS|

---

# ディレクトリ構造


macro-daily/
├ package.json
├ .env
├ .gitignore
├ README.md

├ data/
│ ├ raw/
│ │ ├ all-news.json
│ │ ├ fx-news.json
│ │ └ crypto-news.json
│ │
│ ├ daily/
│ │ ├ fx/
│ │ └ crypto/
│ │
│ ├ weekly/
│ │ ├ fx/
│ │ └ crypto/
│ │
│ └ monthly/

├ scripts/
│ ├ fetch_news.js
│ ├ split_news.js
│ ├ summarize_fx_daily.js
│ ├ summarize_crypto_daily.js
│ ├ summarize_fx_weekly.js
│ ├ summarize_crypto_weekly.js
│ ├ summarize_monthly.js
│ ├ build_article.js
│ ├ build_index.js
│ ├ build_category.js
│ ├ build_related.js
│
│ └ utils/
│ ├ date.js
│ ├ paths.js
│ ├ template.js
│ └ markdown.js

├ templates/
│ ├ article.html
│ ├ index.html
│ ├ category.html
│
│ └ partials/
│ ├ head.html
│ ├ hero.html
│ ├ footer.html
│ └ article-card.html

├ site/
│ ├ index.html
│ ├ sitemap.xml
│ ├ robots.txt
│
│ ├ assets/
│ │ ├ img/
│ │ │ └ hero.jpg
│ │ └ css/
│ │ └ style.css
│
│ ├ posts/
│ │ ├ fx/
│ │ ├ crypto/
│ │ ├ weekly/
│ │ └ monthly/
│
│ ├ category/
│ │ ├ fx.html
│ │ ├ crypto.html
│ │ └ macro.html
│
│ └ guides/
│ ├ best-chart-tools.html
│ ├ best-crypto-exchanges.html
│ └ best-prop-firms.html

└ .github/
└ workflows/
└ build.yml


---

# データフロー

ニュース生成は次の順序で行われます。


RSS取得
↓
rawニュース保存
↓
ニュース分類（FX / Crypto）
↓
AI要約
↓
Daily記事生成
↓
Weekly記事生成
↓
Monthly記事生成
↓
HTML生成
↓
GitHub Pages公開


---

# scripts の役割

## fetch_news.js

RSSからニュースを取得します。

出力


data/raw/all-news.json


---

## split_news.js

ニュースをカテゴリ分けします。


fx-news.json
crypto-news.json


---

## summarize_fx_daily.js

FXニュースを要約し、Daily記事データを生成。


data/daily/fx/YYYY-MM-DD.json


---

## summarize_crypto_daily.js

仮想通貨ニュースを要約。


data/daily/crypto/YYYY-MM-DD.json


---

## summarize_fx_weekly.js

1週間のFX記事をまとめます。

---

## summarize_crypto_weekly.js

仮想通貨の週まとめ記事を生成します。

---

## summarize_monthly.js

月次市場まとめを生成します。

---

## build_article.js

JSONデータからHTML記事を生成します。

出力


site/posts/


---

## build_index.js

トップページを生成します。

---

## build_category.js

カテゴリページを生成します。

---

## build_related.js

関連記事を生成します。

---

# site ディレクトリ

GitHub Pages に公開されるHTMLです。


site/


がそのまま公開サイトになります。

---

# テンプレート


templates/


にHTMLテンプレートを置きます。

記事HTMLはテンプレートから生成されます。

---

# GitHub Actions


.github/workflows/build.yml


で次を自動化します。

- ニュース取得
- AI要約
- HTML生成
- GitHub Pages公開

---

# 今後追加予定

- TradingViewチャート埋め込み
- SEO構造化データ
- 関連記事自動生成
- アフィリエイト導線
- Weekly / Monthly自動生成

---

# ライセンス

MIT