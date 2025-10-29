const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const { URL } = require('url');

const app = express();
app.use(express.json());

async function crawlPage(url, depth, visited, results) {
  if (depth <= 0 || visited.has(url)) return;
  visited.add(url);

  try {
    const response = await axios.get(url, { timeout: 20000 });
    const html = response.data;
    const $ = cheerio.load(html);

    // Extract data
    const emails = [...new Set(html.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) || [])];
    const phones = [...new Set(html.match(/\+?\d[\d\s().-]{7,}/g) || [])];
    const title = $('title').text().trim();
    const links = $('a[href]')
      .map((i, el) => new URL($(el).attr('href'), url).href)
      .get()
      .filter(href => href.startsWith(new URL(url).origin));

    results.push({ url, title, emails, phones });

    // Crawl sub-links recursively
    for (const link of links.slice(0, 10)) {
      await crawlPage(link, depth - 1, visited, results);
    }

  } catch (err) {
    console.error(`Error fetching ${url}: ${err.message}`);
  }
}

app.post('/crawl', async (req, res) => {
  const { url, depth = 1 } = req.body;
  if (!url) return res.status(400).json({ error: 'url required' });

  const visited = new Set();
  const results = [];

  await crawlPage(url, depth, visited, results);
  res.json({ results });
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`✅ Crawler running on port ${port}`));
