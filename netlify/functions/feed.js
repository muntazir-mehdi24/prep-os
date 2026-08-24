// High-yield sources: Geopolitics, Defence, Policy, Foundational AI & Pioneer Blogs
const FEEDS = [
  // --- Strategic Affairs & Governance ---
  { url: 'https://www.thehindu.com/opinion/editorial/feeder/default.rss', source: 'The Hindu — Editorial', category: 'Editorial' },
  { url: 'https://www.pib.gov.in/ViewRss.aspx?reg=1&lang=1', source: 'PIB — National', category: 'Policy & Schemes' },
  { url: 'https://www.orfonline.org/feed/', source: 'Observer Research Foundation (ORF)', category: 'Geopolitics & Strategy' },
  { url: 'https://thediplomat.com/feed/', source: 'The Diplomat', category: 'Indo-Pacific Affairs' },
  { url: 'https://carnegieindia.org/rss/solr/?fa=rss', source: 'Carnegie India', category: 'Strategic Studies' },

  // --- Frontier AI, Tech Research & Frontier Thinkers ---
  { url: 'https://karpathy.bearblog.dev/feed/', source: 'Andrej Karpathy', category: 'AI & Deep Tech' },
  { url: 'https://blog.samaltman.com/posts.atom', source: 'Sam Altman', category: 'Tech Strategy & Future' },
  { url: 'https://deepmind.google/blog/rss.xml', source: 'Google DeepMind Research', category: 'AI Research' },
  { url: 'https://openai.com/news/rss.xml', source: 'OpenAI Blog', category: 'AI Research' },
  { url: 'https://www.technologyreview.com/feed/', source: 'MIT Tech Review', category: 'Frontier Tech & R&D' }
];

// Topic filter anchors across Polity, Foreign Affairs, Defence, and Deep Tech
const TOPIC_KEYWORDS = [
  // Geopolitics & Foreign Affairs
  'bilateral', 'multilateral', 'diplomacy', 'treaty', 'mou', 'summit', 'foreign policy',
  'indo-pacific', 'quad', 'brics', 'g20', 'asean', 'unsc', 'global south', 'sanctions',
  // Defence & Security
  'defense', 'defence', 'missile', 'drdo', 'navy', 'army', 'iaf', 'air force',
  'maritime', 'border', 'loc', 'lac', 'frigate', 'corvette', 'counter-terrorism', 'cyber',
  // Technology, AI & R&D
  'ai', 'artificial intelligence', 'llm', 'neural', 'deep learning', 'semiconductor',
  'quantum', 'supercomputer', 'biotech', 'robotics', 'space', 'isro', 'agi', 'scaling laws',
  // Governance, Polity & Economy
  'cabinet', 'parliament', 'bill', 'act', 'supreme court', 'judgement', 'constitution',
  'rbi', 'inflation', 'gdp', 'fiscal', 'monetary', 'yojana', 'infrastructure'
];

const EXCLUDE_KEYWORDS = [
  'cricket', 'bollywood', 'celebrity', 'box office', 'actor', 'actress',
  'murder', 'robbery', 'horoscope', 'cinema', 'ipl', 'match', 'entertainment'
];

function parseFeed(xml, feedMeta) {
  const items = [];
  
  // Normalize RSS <item> and Atom <entry> tags
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

    // Noise filtering
    if (EXCLUDE_KEYWORDS.some(k => lowerTitle.includes(k))) continue;

    // Categorized evaluation
    const isHighPrioritySource = [
      'Editorial', 
      'Geopolitics & Strategy', 
      'Strategic Studies', 
      'AI & Deep Tech', 
      'Tech Strategy & Future', 
      'AI Research'
    ].includes(feedMeta.category);

    const isRelevant = isHighPrioritySource || TOPIC_KEYWORDS.some(k => lowerTitle.includes(k));

    if (isRelevant) {
      items.push({
        title,
        link,
        source: feedMeta.source,
        category: feedMeta.category,
        date: rawDate ? new Date(rawDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }) : 'Today'
      });
    }

    // Strict cap: Fetch only the top 5 high-yielding topics per source
    if (items.length >= 5) break;
  }
  return items;
}

export async function handler() {
  let allItems = [];

  for (const feed of FEEDS) {
    try {
      const res = await fetch(feed.url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
        signal: AbortSignal.timeout(4000)
      });
      if (res.ok) {
        const text = await res.text();
        allItems = allItems.concat(parseFeed(text, feed));
      }
    } catch (e) {
      // Continue if an individual endpoint has a network delay
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