// Categorized feeds
const SECTIONS = {
  'Geopolitics & Foreign Policy': [
    { url: 'https://www.orfonline.org/feed/', source: 'ORF' },
    { url: 'https://thediplomat.com/feed/', source: 'The Diplomat' },
    { url: 'https://carnegieindia.org/rss/solr/?fa=rss', source: 'Carnegie India' }
  ],
  'National Security & Defence': [
    { url: 'https://idsa.in/rss.xml', source: 'MP-IDSA' },
    { url: 'https://www.thehindu.com/news/national/feeder/default.rss', source: 'The Hindu National' }
  ],
  'Governance, Policy & Economy': [
    { url: 'https://www.thehindu.com/opinion/editorial/feeder/default.rss', source: 'The Hindu Editorial' },
    { url: 'https://www.pib.gov.in/ViewRss.aspx?reg=1&lang=1', source: 'PIB National' }
  ],
  'Frontier Tech, AI & R&D': [
    { url: 'https://deepmind.google/blog/rss.xml', source: 'DeepMind Research' },
    { url: 'https://openai.com/news/rss.xml', source: 'OpenAI Blog' },
    { url: 'https://karpathy.bearblog.dev/feed/', source: 'Andrej Karpathy' },
    { url: 'https://blog.samaltman.com/posts.atom', source: 'Sam Altman' }
  ],
  'Science, Environment & Space': [
    { url: 'https://www.technologyreview.com/feed/', source: 'MIT Tech Review' }
  ]
};

const EXCLUDE_KEYWORDS = [
  'cricket', 'bollywood', 'celebrity', 'box office', 'actor', 'actress',
  'murder', 'robbery', 'horoscope', 'cinema', 'ipl', 'match', 'entertainment'
];

function cleanText(str) {
  return (str || '')
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, '$1')
    .replace(/<[^>]+>/g, '')
    .trim();
}

function parseFeed(xml, source, sectionName) {
  const items = [];
  const now = Date.now();
  const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

  const isAtom = xml.includes('<entry>');
  const itemMatches = isAtom 
    ? xml.match(/<entry[\s\S]*?<\/entry>/gi) || []
    : xml.match(/<item[\s\S]*?<\/item>/gi) || [];

  for (const raw of itemMatches) {
    const titleMatch = raw.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const linkMatch = isAtom
      ? raw.match(/<link[^>]*href=["']([^"']+)["']/i) || raw.match(/<link[^>]*>([\s\S]*?)<\/link>/i)
      : raw.match(/<link[^>]*>([\s\S]*?)<\/link>/i);
    const dateMatch = raw.match(/<(?:pubDate|updated|published|dc:date)[^>]*>([\s\S]*?)<\/(?:pubDate|updated|published|dc:date)>/i);

    const rawTitle = titleMatch ? titleMatch[1] : '';
    const rawLink = linkMatch ? (linkMatch[1] || linkMatch[0]) : '';
    const rawDate = dateMatch ? dateMatch[1] : '';

    const title = cleanText(rawTitle);
    let link = cleanText(rawLink);

    if (!title || !link || title.length < 5) continue;
    if (!link.startsWith('http')) continue;

    const lowerTitle = title.toLowerCase();
    if (EXCLUDE_KEYWORDS.some(k => lowerTitle.includes(k))) continue;

    // Flexible timestamp parsing
    let parsedTime = Date.parse(cleanText(rawDate));
    if (isNaN(parsedTime) || !parsedTime) {
      parsedTime = now; // Fallback to current timestamp if header date is missing
    }

    // 30-day filter
    if (now - parsedTime > THIRTY_DAYS_MS) {
      continue;
    }

    items.push({
      title,
      link,
      source,
      section: sectionName,
      timestamp: parsedTime,
      date: new Date(parsedTime).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
    });
  }
  return items;
}

async function fetchSingleFeed(feed, sectionName) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500); // 3.5s per feed

    const res = await fetch(feed.url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!res.ok) return [];
    const text = await res.text();
    return parseFeed(text, feed.source, sectionName);
  } catch (err) {
    return [];
  }
}

export async function handler() {
  const categorized = {};

  for (const [sectionName, feeds] of Object.entries(SECTIONS)) {
    // Run all feeds for this category in parallel
    const promises = feeds.map(feed => fetchSingleFeed(feed, sectionName));
    const results = await Promise.allSettled(promises);

    let sectionArticles = [];
    results.forEach(res => {
      if (res.status === 'fulfilled' && Array.isArray(res.value)) {
        sectionArticles = sectionArticles.concat(res.value);
      }
    });

    // Sort newest first & take top 5
    sectionArticles.sort((a, b) => b.timestamp - a.timestamp);
    categorized[sectionName] = sectionArticles.slice(0, 5);
  }

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=1800',
    },
    body: JSON.stringify({ sections: categorized }),
  };
}