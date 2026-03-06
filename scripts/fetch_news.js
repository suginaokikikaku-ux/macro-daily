import Parser from "rss-parser";
import fs from "fs";

const parser = new Parser({
  timeout: 30
});

const feeds = [
  "https://feeds.reuters.com/reuters/businessNews",
  "https://www.coindesk.com/arc/outboundfeeds/rss/"
];

async function fetchNews() {

  const articles = [];

  for (const url of feeds) {

    try {

      console.log(`fetching: ${url}`);

      const feed = await parser.parseURL(url);

      if (feed.items) {

        feed.items.slice(0,5).forEach(item => {

          articles.push({
            title: item.title,
            link: item.link,
            pubDate: item.pubDate
          });

        });

      }

    } catch (err) {

      console.log(`skip feed: ${url}`);

    }

  }

  fs.writeFileSync(
    "data/raw/news.json",
    JSON.stringify(articles,null,2)
  );

  console.log("news.json created");

}

fetchNews();