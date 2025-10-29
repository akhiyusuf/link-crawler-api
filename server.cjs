// server.cjs (CommonJS)
const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const { URL } = require('url');

const app = express();
app.use(express.json());

// --- small countryRules mapping (extendable) ---
const countryRules = {
  "1": {min: 7, max: 10}, // NANP (US, Canada, Caribbean)
  "7": {min: 10, max: 10}, // Kazakhstan, Russia
  "20": {min: 7, max: 9}, // Egypt
  "27": {min: 9, max: 9}, // South Africa
  "30": {min: 10, max: 10}, // Greece
  "31": {min: 9, max: 9}, // Netherlands
  "32": {min: 8, max: 9}, // Belgium
  "33": {min: 9, max: 9}, // France
  "34": {min: 9, max: 9}, // Spain
  "36": {min: 8, max: 9}, // Hungary
  "39": {min: 6, max: 11}, // Italy, Vatican City
  "40": {min: 9, max: 9}, // Romania
  "41": {min: 4, max: 12}, // Switzerland
  "43": {min: 4, max: 13}, // Austria
  "44": {min: 7, max: 10}, // United Kingdom
  "45": {min: 8, max: 8}, // Denmark
  "46": {min: 7, max: 13}, // Sweden
  "47": {min: 5, max: 8}, // Norway
  "48": {min: 9, max: 9}, // Poland
  "49": {min: 6, max: 13}, // Germany
  "51": {min: 8, max: 11}, // Peru
  "52": {min: 10, max: 10}, // Mexico
  "53": {min: 6, max: 8}, // Cuba
  "54": {min: 10, max: 10}, // Argentina
  "55": {min: 10, max: 10}, // Brazil
  "56": {min: 8, max: 9}, // Chile
  "57": {min: 8, max: 10}, // Colombia
  "58": {min: 10, max: 10}, // Venezuela
  "60": {min: 7, max: 9}, // Malaysia
  "61": {min: 5, max: 15}, // Australia
  "62": {min: 5, max: 10}, // Indonesia
  "63": {min: 8, max: 10}, // Philippines
  "64": {min: 3, max: 10}, // New Zealand
  "65": {min: 8, max: 12}, // Singapore
  "66": {min: 8, max: 9}, // Thailand
  "81": {min: 5, max: 13}, // Japan
  "82": {min: 8, max: 11}, // South Korea
  "84": {min: 7, max: 10}, // Vietnam
  "86": {min: 5, max: 12}, // China
  "90": {min: 10, max: 10}, // Turkey
  "91": {min: 7, max: 10}, // India
  "92": {min: 8, max: 11}, // Pakistan
  "93": {min: 9, max: 9}, // Afghanistan
  "94": {min: 9, max: 9}, // Sri Lanka
  "95": {min: 7, max: 9}, // Myanmar
  "98": {min: 6, max: 10}, // Iran
  "211": {min: 9, max: 9}, // South Sudan
  "212": {min: 9, max: 9}, // Morocco
  "213": {min: 8, max: 9}, // Algeria
  "216": {min: 8, max: 8}, // Tunisia
  "218": {min: 8, max: 9}, // Libya
  "220": {min: 7, max: 7}, // Gambia
  "221": {min: 9, max: 9}, // Senegal
  "222": {min: 7, max: 7}, // Mauritania
  "223": {min: 8, max: 8}, // Mali
  "224": {min: 8, max: 8}, // Guinea
  "225": {min: 8, max: 8}, // Côte d'Ivoire
  "226": {min: 8, max: 8}, // Burkina Faso
  "227": {min: 8, max: 8}, // Niger
  "228": {min: 8, max: 8}, // Togo
  "229": {min: 8, max: 8}, // Benin
  "230": {min: 7, max: 7}, // Mauritius
  "231": {min: 7, max: 8}, // Liberia
  "232": {min: 8, max: 8}, // Sierra Leone
  "233": {min: 5, max: 9}, // Ghana
  "234": {min: 7, max: 10}, // Nigeria
  "235": {min: 8, max: 8}, // Chad
  "236": {min: 8, max: 8}, // Central African Republic
  "237": {min: 8, max: 8}, // Cameroon
  "238": {min: 7, max: 7}, // Cape Verde
  "239": {min: 7, max: 7}, // São Tomé and Príncipe
  "240": {min: 9, max: 9}, // Equatorial Guinea
  "241": {min: 6, max: 7}, // Gabon
  "242": {min: 9, max: 9}, // Congo, Republic of the Congo
  "243": {min: 5, max: 9}, // Democratic Republic of the Congo
  "244": {min: 9, max: 9}, // Angola
  "245": {min: 7, max: 7}, // Guinea-Bissau
  "246": {min: 7, max: 7}, // Diego Garcia
  "247": {min: 4, max: 4}, // Saint Helena
  "248": {min: 7, max: 7}, // Seychelles
  "249": {min: 9, max: 9}, // Sudan
  "250": {min: 9, max: 9}, // Rwanda
  "251": {min: 9, max: 9}, // Ethiopia
  "252": {min: 5, max: 8}, // Somalia
  "253": {min: 6, max: 6}, // Djibouti
  "254": {min: 6, max: 10}, // Kenya
  "255": {min: 9, max: 9}, // Tanzania
  "256": {min: 9, max: 9}, // Uganda
  "257": {min: 8, max: 8}, // Burundi
  "258": {min: 8, max: 9}, // Mozambique
  "260": {min: 9, max: 9}, // Zambia
  "261": {min: 9, max: 10}, // Madagascar
  "263": {min: 5, max: 10}, // Zimbabwe
  "264": {min: 6, max: 10}, // Namibia
  "265": {min: 7, max: 8}, // Malawi
  "266": {min: 8, max: 8}, // Lesotho
  "267": {min: 7, max: 8}, // Botswana
  "268": {min: 7, max: 8}, // Swaziland
  "269": {min: 7, max: 7}, // Comoros
  "291": {min: 7, max: 7}, // Eritrea
  "297": {min: 7, max: 7}, // Aruba
  "298": {min: 6, max: 6}, // Faroe Islands
  "299": {min: 6, max: 6}, // Greenland
  "350": {min: 8, max: 8}, // Gibraltar
  "351": {min: 9, max: 11}, // Portugal
  "352": {min: 4, max: 11}, // Luxembourg
  "353": {min: 7, max: 11}, // Ireland
  "354": {min: 7, max: 9}, // Iceland
  "355": {min: 3, max: 9}, // Albania
  "356": {min: 8, max: 8}, // Malta
  "357": {min: 8, max: 11}, // Cyprus
  "358": {min: 5, max: 12}, // Finland
  "359": {min: 7, max: 9}, // Bulgaria
  "370": {min: 8, max: 8}, // Lithuania
  "371": {min: 7, max: 8}, // Latvia
  "372": {min: 7, max: 10}, // Estonia
  "373": {min: 8, max: 8}, // Moldova
  "374": {min: 8, max: 8}, // Armenia
  "375": {min: 9, max: 10}, // Belarus
  "376": {min: 6, max: 9}, // Andorra
  "377": {min: 5, max: 9}, // Monaco
  "378": {min: 6, max: 10}, // San Marino
  "380": {min: 9, max: 9}, // Ukraine
  "381": {min: 4, max: 12}, // Serbia
  "382": {min: 4, max: 12}, // Montenegro
  "385": {min: 8, max: 12}, // Croatia
  "386": {min: 8, max: 8}, // Slovenia
  "387": {min: 8, max: 8}, // Bosnia and Herzegovina
  "389": {min: 8, max: 8}, // North Macedonia
  "420": {min: 4, max: 12}, // Czech Republic
  "421": {min: 4, max: 9}, // Slovakia
  "423": {min: 7, max: 9}, // Liechtenstein
  "500": {min: 5, max: 5}, // Falkland Islands
  "501": {min: 7, max: 7}, // Belize
  "502": {min: 8, max: 8}, // Guatemala
  "503": {min: 7, max: 11}, // El Salvador
  "504": {min: 8, max: 8}, // Honduras
  "505": {min: 8, max: 8}, // Nicaragua
  "506": {min: 8, max: 8}, // Costa Rica
  "507": {min: 7, max: 8}, // Panama
  "508": {min: 6, max: 6}, // Saint Pierre and Miquelon
  "509": {min: 8, max: 8}, // Haiti
  "590": {min: 9, max: 9}, // Guadeloupe
  "591": {min: 8, max: 8}, // Bolivia
  "592": {min: 7, max: 7}, // Guyana
  "593": {min: 8, max: 8}, // Ecuador
  "594": {min: 9, max: 9}, // French Guiana
  "595": {min: 5, max: 9}, // Paraguay
  "596": {min: 9, max: 9}, // Martinique
  "597": {min: 6, max: 7}, // Suriname
  "598": {min: 4, max: 11}, // Uruguay
  "599": {min: 7, max: 8}, // Bonaire, Sint Eustatius and Saba, Curaçao
  "670": {min: 7, max: 7}, // Timor-Leste
  "672": {min: 6, max: 6}, // Australian External Territories
  "673": {min: 7, max: 7}, // Brunei
  "674": {min: 4, max: 7}, // Nauru
  "675": {min: 4, max: 11}, // Papua New Guinea
  "676": {min: 5, max: 7}, // Tonga
  "677": {min: 5, max: 5}, // Solomon Islands
  "678": {min: 5, max: 7}, // Vanuatu
  "679": {min: 7, max: 7}, // Fiji
  "680": {min: 7, max: 7}, // Palau
  "681": {min: 6, max: 6}, // Wallis and Futuna
  "682": {min: 5, max: 5}, // Cook Islands
  "683": {min: 4, max: 4}, // Niue
  "685": {min: 3, max: 7}, // Samoa
  "686": {min: 5, max: 5}, // Kiribati
  "687": {min: 6, max: 6}, // New Caledonia
  "688": {min: 5, max: 6}, // Tuvalu
  "689": {min: 6, max: 6}, // French Polynesia
  "690": {min: 4, max: 4}, // Tokelau
  "691": {min: 7, max: 7}, // Micronesia
  "692": {min: 7, max: 7}, // Marshall Islands
  "850": {min: 6, max: 17}, // Democratic People's Republic of Korea
  "852": {min: 4, max: 9}, // Hong Kong
  "853": {min: 7, max: 8}, // Macao
  "855": {min: 8, max: 8}, // Cambodia
  "856": {min: 8, max: 10}, // Laos
  "880": {min: 6, max: 10}, // Bangladesh
  "886": {min: 8, max: 9}, // Taiwan
  "960": {min: 7, max: 7}, // Maldives
  "961": {min: 7, max: 8}, // Lebanon
  "962": {min: 5, max: 9}, // Jordan
  "963": {min: 8, max: 10}, // Syria
  "964": {min: 8, max: 10}, // Iraq
  "965": {min: 7, max: 8}, // Kuwait
  "966": {min: 8, max: 9}, // Saudi Arabia
  "967": {min: 6, max: 9}, // Yemen
  "968": {min: 7, max: 8}, // Oman
  "971": {min: 8, max: 9}, // United Arab Emirates
  "972": {min: 8, max: 9}, // Israel
  "973": {min: 8, max: 8}, // Bahrain
  "974": {min: 3, max: 8}, // Qatar
  "975": {min: 7, max: 8}, // Bhutan
  "976": {min: 7, max: 8}, // Mongolia
  "977": {min: 8, max: 9}, // Nepal
  "992": {min: 9, max: 9}, // Tajikistan
  "993": {min: 8, max: 8}, // Turkmenistan
  "994": {min: 8, max: 9}, // Azerbaijan
  "995": {min: 9, max: 9}, // Georgia
  "996": {min: 9, max: 9}, // Kyrgyzstan
  "998": {min: 9, max: 9}, // Uzbekistan
};
const knownCountryCodes = Object.keys(countryRules).sort((a,b) => b.length - a.length);

// --- helpers ---
function cleanNumber(raw) {
  if (!raw || typeof raw !== 'string') return null;
  raw = raw.split(/ext|extension|x|#|ext\./i)[0];
  raw = raw.replace(/^tel:/i, '').trim();
  raw = raw.replace(/[()\s.\-]+/g, '');
  if (raw.startsWith('00')) raw = '+' + raw.slice(2);
  if (raw.startsWith('+')) return '+' + raw.slice(1).replace(/\D/g, '');
  if (/^\d+$/.test(raw)) return raw;
  return raw.replace(/[^\d+]/g, '');
}

function detectCountryCode(digits) {
  for (const cc of knownCountryCodes) if (digits.startsWith(cc)) return cc;
  return null;
}

function normalizeToE164(raw, defaultCountryCode=null) {
  let cleaned = cleanNumber(raw);
  if (!cleaned) return null;

  if (cleaned.startsWith('+')) {
    const digits = cleaned.slice(1);
    if (!/^\d+$/.test(digits) || digits.length > 15) return null;
    const cc = detectCountryCode(digits);
    if (!cc) return '+'+digits;
    const national = digits.slice(cc.length);
    const rule = countryRules[cc];
    if (!rule || (national.length >= rule.min && national.length <= rule.max)) return '+'+digits;
    if (digits.length <= 15) return '+'+digits;
    return null;
  }

  if (!/^\d+$/.test(cleaned)) return null;
  const digits = cleaned;
  for (const cc of knownCountryCodes) {
    if (digits.startsWith(cc)) {
      const national = digits.slice(cc.length);
      const rule = countryRules[cc];
      if (!rule || (national.length >= rule.min && national.length <= rule.max)) return '+'+cc+national;
      if ((cc+national).length <= 15) return '+'+cc+national;
    }
  }

  if (defaultCountryCode) {
    const dd = defaultCountryCode.replace(/^\+/, '');
    const rule = countryRules[dd];
    if (!rule || (digits.length >= rule.min && digits.length <= rule.max)) return '+'+dd+digits;
    if ((dd+digits).length <= 15) return '+'+dd+digits;
  }

  return null;
}

// --- fetch + parse page ---
async function fetchPage(url) {
  const res = await axios.get(url, { timeout: 20000, headers: { 'User-Agent': 'Mozilla/5.0 (crawler)' } });
  const $ = cheerio.load(res.data || '');
  const bodyText = $('body').text().replace(/\s+/g,' ').trim();
  const title = ($('title').text()||'').trim();
  const meta = ($('meta[name="description"]').attr('content')||'').trim();

  const html = $.html();
  const emailsInHtml = [...new Set((html.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) || []).map(e => e.toLowerCase()))];

  const telLinks = $('a[href^="tel:"]').map((i,a) => $(a).attr('href').replace(/^tel:/i,'')).get();
  const fuzzyPhones = Array.from(new Set((bodyText.match(/(\+?\d[\d\-\s().]{6,}\d)/g) || []).map(s => s.trim())));
  const phoneCandidates = [...new Set([...telLinks, ...fuzzyPhones])];

  const links = $('a[href]').map((i,el) => {
    const href = $(el).attr('href');
    try { return new URL(href, url).href; } catch(e) { return null; }
  }).get().filter(Boolean);

  const fullText = bodyText;
  return { url, title, metaDescription: meta, emails: emailsInHtml, phoneCandidates, fullText, links };
}

// --- crawl logic with depth and maxPages ---
async function crawlSite(startUrl, depth = 1, maxPages = 10, defaultCountryCode = null) {
  const origin = new URL(startUrl).origin;
  const visited = new Set();
  const results = [];
  const toVisit = [startUrl];

  while (toVisit.length && visited.size < maxPages) {
    const u = toVisit.shift();
    if (!u || visited.has(u)) continue;
    try {
      const page = await fetchPage(u);
      const normalizedPhones = [];
      for (const p of page.phoneCandidates) {
        const norm = normalizeToE164(p, defaultCountryCode);
        if (norm) normalizedPhones.push(norm);
      }
      const uniquePhones = [...new Set(normalizedPhones)];

      results.push({
        url: page.url,
        title: page.title,
        metaDescription: page.metaDescription,
        emails: page.emails,
        phones: uniquePhones,
        fullText: page.fullText,
        links: page.links,
        url: u,
        error: err.message
      });


      visited.add(u);

      if (depth > 1) {
        const sameOriginLinks = page.links.filter(l => {
          try { return new URL(l).origin === origin; } catch { return false; }
        });
        for (const l of sameOriginLinks) {
          if (!visited.has(l) && (toVisit.length + visited.size) < maxPages) toVisit.push(l);
        }
      }
    } catch (err) {
      console.error('fetch failed', u, err.message);
      visited.add(u);
    }
  }
  return results;
}

// --- CSV with multiple email/phone columns ---
function toCSV(rows, emailCols = 5, phoneCols = 5) {
  const header = ['url','title','metaDescription'];
  for (let i=1;i<=emailCols;i++) header.push(`email_${i}`);
  for (let i=1;i<=phoneCols;i++) header.push(`phone_${i}`);
  header.push('fullText');
  for (let i=1;i<=3;i++) header.push(`link_${i}`); // keep first 3 links in columns (others remain in JSON if needed)
  const out = [header.join(',')];

  for (const r of rows) {
    const row = [];
    row.push(`"${r.url.replace(/"/g,'""')}"`);
    row.push(`"${(r.title||'').replace(/"/g,'""')}"`);
    row.push(`"${(r.metaDescription||'').replace(/"/g,'""')}"`);

    const emails = r.emails || [];
    for (let i=0;i<emailCols;i++) row.push(`"${(emails[i]||'') .replace(/"/g,'""')}"`);

    const phones = r.phones || [];
    for (let i=0;i<phoneCols;i++) row.push(`"${(phones[i]||'') .replace(/"/g,'""')}"`);

    row.push(`"${(r.fullText||'').replace(/"/g,'""')}"`);

    const links = r.links || [];
    for (let i=0;i<3;i++) row.push(`"${(links[i]||'').replace(/"/g,'""')}"`);

    out.push(row.join(','));
  }
  return out.join('\n');
}

// --- API ---
app.post('/crawl', async (req, res) => {
  try {
    const { url, depth = 1, maxPages = 10, format = 'json', defaultCountryCode = null, emailColumns = 5, phoneColumns = 5 } = req.body;
    if (!url) return res.status(400).json({ error: 'url required' });

    const numericDepth = Math.max(1, parseInt(depth) || 1);
    const numericMax = Math.min(500, Math.max(1, parseInt(maxPages) || 10));
    const eCols = Math.min(20, Math.max(1, parseInt(emailColumns)||5));
    const pCols = Math.min(20, Math.max(1, parseInt(phoneColumns)||5));

    const results = await crawlSite(url, numericDepth, numericMax, defaultCountryCode);

    if (format === 'csv') {
      const csv = toCSV(results, eCols, pCols);
      res.setHeader('Content-Type', 'text/csv');
      res.send(csv);
    } else {
      res.json({ results });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`✅ Crawler running on port ${port}`));
