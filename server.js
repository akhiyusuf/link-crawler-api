import express from "express";
import axios from "axios";
import * as cheerio from "cheerio";
import { URL } from "url";

const app = express();
app.use(express.json());

async function fetchPage(url) {
  const { data } = await axios.get(url, { timeout: 20000 });
  const $ = cheerio.load(data);
  const text = $("body").text().replace(/\s+/g, " ").trim();
  const title = $("title").text() || "";
  const links = [];
  $("a").each((_, el) => {
    const href = $(el).attr("href");
    if (href && !href.startsWith("mailto:") && !href.startsWith("tel:")) {
      try {
        const abs = new URL(href, url).href;
        links.push(abs);
      } catch {}
    }
  });
  const emails = [...new Set(text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) || [])];
  const phones = [...new Set(text.match(/(\+?\d[\d\s\-()]{6,}\d)/g) || [])]
    .filter(n => n.length >= 8 && /\d{7,}/.test(n));

  return { url, title, emails, phones, text: text.slice(0, 1000), links };
}

async function crawlSite(startUrl, depth, visited = new Set()) {
  if (depth <= 0 || visited.has(startUrl)) return [];
  visited.add(startUrl);

  try {
    const pageData = await fetchPage(startUrl);
    const childResults = [];

    if (depth > 1) {
      const sameDomainLinks = pageData.links.filter(link => link.startsWith(new URL(startUrl).origin));
      for (const link of sameDomainLinks.slice(0, 10)) {
        const children = await crawlSite(link, depth - 1, visited);
        childResults.push(...children);
      }
    }

    return [pageData, ...childResults];
  } catch {
    return [];
  }
}

app.post("/crawl", async (req, res) => {
  const { url, depth = 1 } = req.body;
  if (!url) return res.status(400).json({ error: "Missing URL" });

  const results = await crawlSite(url, depth);
  res.json({ results });
});

app.listen(10000, () => console.log("Crawler running on port 10000"));
