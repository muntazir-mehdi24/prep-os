// Netlify serverless function — fetches RSS feeds server-side (browsers block this via CORS)
// Runs at /.netlify/functions/feed once deployed.

const FEEDS = [
  { url: 'https://www.pib.gov.in/ViewRss.aspx?reg=1&lang=1', source: 'PIB' },
  { url: 'https://www.thehindu.com/opinion/editorial/feeder/default.rss', source: 'The Hindu — Editorial' },
];

function parseRss(xml, source) {
  const items = [];
  const itemMatches = xml.match(/<item>([\s\S]*?)<\/item>/g) || [];
  for (const raw of itemMatches.slice(0, 8)) {
    const titleMatch = raw.match(/<title>([\s\S]*?)<\/title>/);
    const linkMatch = raw.match(/<link>([\s\S]*?)<\/link>/);
    const title = titleMatch ? titleMatch[1] : '';
    const link = linkMatch ? linkMatch[1] : '';
    const clean = (s) => s.replace('<![CDATA[', '').replace(']]>', '').trim();
    if (title) items.push({ title: clean(title), link: clean(link), source });
  }
  return items;
}

export async function handler(event, context) {
  let allItems = [];
  for (const feed of FEEDS) {
    try {
      const res = await fetch(feed.url, { 
        headers: { 
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' 
        } 
      });
      if (res.ok) {
        const xml = await res.text();
        allItems = allItems.concat(parseRss(xml, feed.source));
      }
    } catch (e) {
      // skip a feed that fails, don't fail the whole response
    }
  }

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Cache-Control': 'public, max-age=1800'
    },
    body: JSON.stringify({ items: allItems }),
  };
}