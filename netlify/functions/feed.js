// Categorized feeds with balanced coverage
const FEEDS = [
  // 1. National Governance & Policy (Target: 3 items)
  { url: 'https://www.thehindu.com/opinion/editorial/feeder/default.rss', source: 'The Hindu Editorial', category: 'Governance & Society' },
  { url: 'https://www.pib.gov.in/ViewRss.aspx?reg=1&lang=1', source: 'PIB National', category: 'Schemes & Policy' },
  
  // 2. Geopolitics & Foreign Relations (Target: 3 items)
  { url: 'https://www.orfonline.org/feed/', source: 'ORF India', category: 'Geopolitics & Foreign Policy' },
  { url: 'https://thediplomat.com/feed/', source: 'The Diplomat', category: 'Indo-Pacific & IR' },

  // 3. National Security & Defence (Target: 2 items)
  { url: 'https://idsa.in/rss.xml', source: 'MP-IDSA Defence', category: 'National Security & Defence' },

  // 4. Frontier Tech, R&D & AI (Target: 2 items)
  { url: 'https://deepmind.google/blog/rss.xml', source: 'DeepMind Research', category: 'Deep Tech & AI' },
  { url: 'https://karpathy.bearblog.dev/feed/', source: 'Andrej Karpathy', category: 'Deep Tech & AI' }
];

const EXCLUDE_KEYWORDS = [
  'cricket', 'bollywood', 'celebrity', 'box office', 'actor', 'actress',
  'murder', 'robbery', 'horoscope', 'cinema', 'ipl', 'match', 'entertainment'
];

function parseFeed(xml, feedMeta) {
  const items = [];
  const isAtom = xml.includes('<entry>');
  const itemMatches = isAtom 
    ? xml.match(/<entry[\s\S]*?<\/entry>/g) || []
    : xml.match(/<item[\s\S]*?<\/item>/g) || [];

  for (const raw of itemMatches) {
    const titleMatch = raw.match(/<title[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i);
    const linkMatch = isAtom
      ? raw.match(/<link[^>]*href=["']([^"']+)["']/i) || raw.match(/<link>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/link>/i)
      : raw.match(/<link>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/link>/i);
    const dateMatch = raw.match(/<(?:pubDate|updated|published)>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/(?:pubDate|updated|published)>/i);

    const title = titleMatch ? titleMatch[1].replace(/<!\[CDATA\[|\]\]>/g, '').trim() : '';
    const link = linkMatch ? (linkMatch[1] || '').replace(/<!\[CDATA\[|\]\]>/g, '').trim() : '';
    const rawDate = dateMatch ? dateMatch[1].trim() : '';

    if (!title || !link) continue;

    const lowerTitle = title.toLowerCase();
    if (EXCLUDE_KEYWORDS.some(k => lowerTitle.includes(k))) continue;

    items.push({
      title,
      link,
      source: feedMeta.source,
      category: feedMeta.category,
      date: rawDate ? new Date(rawDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }) : 'Today'
    });

    // Enforce 2 items max per source to ensure no single topic crowds out others
    if (items.length >= 2) break;
  }
  return items;
}

export async function handler() {
  let allItems = [];

  for (const feed of FEEDS) {
    try {
      const res = await fetch(feed.url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
        signal: AbortSignal.timeout(3500)
      });
      if (res.ok) {
        const text = await res.text();
        allItems = allItems.concat(parseFeed(text, feed));
      }
    } catch (e) {
      // Gracefully continue if an individual feed times out
    }
  }

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=1800',
    },
    body: JSON.stringify({ items: allItems }),
  };
}