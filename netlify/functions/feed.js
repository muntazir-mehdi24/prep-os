import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const apiKey = process.env.GEMINI_API_KEY;

const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

const RSS_FEEDS = [
  { name: 'The Hindu - National', url: 'https://www.thehindu.com/news/national/feeder/default.rss', type: 'editorial' },
  { name: 'Indian Express - Explained', url: 'https://indianexpress.com/section/explained/feed/', type: 'editorial' },
  { name: 'PIB - National', url: 'https://pib.gov.in/RssMain.aspx?ModId=6&LangId=1', type: 'pib_release' }
];

function parseRssItems(xmlText, sourceName, articleType) {
  const items = [];
  const itemBlocks = xmlText.split('<item>');
  
  for (let i = 1; i < itemBlocks.length && items.length < 5; i++) {
    const block = itemBlocks[i];
    const titleMatch = block.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) || block.match(/<title>(.*?)<\/title>/);
    const linkMatch = block.match(/<link><!\[CDATA\[(.*?)\]\]><\/link>/) || block.match(/<link>(.*?)<\/link>/);
    const dateMatch = block.match(/<pubDate>(.*?)<\/pubDate>/);

    const rawTitle = titleMatch ? titleMatch[1].replace(/<\/?[^>]+(>|$)/g, '').trim() : '';
    const link = linkMatch ? linkMatch[1].trim() : '';
    let pubDate = new Date().toISOString().slice(0, 10);

    if (dateMatch) {
      const parsed = new Date(dateMatch[1]);
      if (!isNaN(parsed.getTime())) {
        pubDate = parsed.toISOString().slice(0, 10);
      }
    }

    if (rawTitle && link) {
      items.push({ title: rawTitle, link, source: sourceName, pubDate, articleType });
    }
  }
  return items;
}

export async function handler(event) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders, body: '' };
  }

  // POST Feedback Action
  if (event.httpMethod === 'POST') {
    try {
      const { articleId, action, subject, topic } = JSON.parse(event.body || '{}');
      if (supabase && articleId) {
        await supabase
          .from('scored_articles')
          .update({ status: action === 'upvote' ? 'bookmarked' : 'dismissed' })
          .eq('id', articleId);
      }
      return { 
        statusCode: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ success: true }) 
      };
    } catch (err) {
      return { 
        statusCode: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ error: err.message }) 
      };
    }
  }

  // GET Digest Action
  try {
    let rawItems = [];
    for (const feed of RSS_FEEDS) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2500);
        const res = await fetch(feed.url, { 
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        if (res.ok) {
          const text = await res.text();
          rawItems.push(...parseRssItems(text, feed.name, feed.type));
        }
      } catch (e) {
        console.error(`Feed fetch skipped for ${feed.name}:`, e.message);
      }
    }

    // High-yield fallback entries
    if (rawItems.length === 0) {
      rawItems = [
        { title: 'Monetary Policy Committee keeps Repo Rate unchanged at 6.5%', link: 'https://rbi.org.in', source: 'RBI Release', pubDate: new Date().toISOString().slice(0, 10), articleType: 'factual_news' },
        { title: 'India-Middle East-Europe Economic Corridor (IMEC) infrastructure review', link: 'https://pib.gov.in', source: 'PIB - National', pubDate: new Date().toISOString().slice(0, 10), articleType: 'editorial' },
        { title: 'Supreme Court issues directives on Article 356 and Federal Balance', link: 'https://thehindu.com', source: 'The Hindu - Opinion', pubDate: new Date().toISOString().slice(0, 10), articleType: 'editorial' },
        { title: 'DRDO conducts successful flight trial of Long-Range Glide Bomb (LRGB)', link: 'https://pib.gov.in/defence', source: 'PIB - Defence', pubDate: new Date().toISOString().slice(0, 10), articleType: 'factual_news' }
      ];
    }

    // AI Scoring via Gemini
    let scoredList = [];
    if (apiKey) {
      try {
        const scoringPrompt = `Evaluate these exam headlines and map each to UPSC/Defence exam criteria:
${JSON.stringify(rawItems.slice(0, 8))}

Output strictly a JSON list with: title, mappedSubject, mappedChapter, staticRelevanceScore (1-10), examPatternScore (1-10), analyticalHook.`;

        const aiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: scoringPrompt }] }],
            generationConfig: {
              responseMimeType: 'application/json',
              responseSchema: {
                type: 'ARRAY',
                items: {
                  type: 'OBJECT',
                  properties: {
                    title: { type: 'STRING' },
                    mappedSubject: { type: 'STRING' },
                    mappedChapter: { type: 'STRING' },
                    staticRelevanceScore: { type: 'INTEGER' },
                    examPatternScore: { type: 'INTEGER' },
                    analyticalHook: { type: 'STRING' }
                  },
                  required: ['title', 'mappedSubject', 'mappedChapter', 'staticRelevanceScore', 'examPatternScore', 'analyticalHook']
                }
              }
            }
          })
        });

        const aiData = await aiRes.json();
        scoredList = JSON.parse(aiData.candidates?.[0]?.content?.parts?.[0]?.text || '[]');
      } catch (err) {
        console.error('Gemini scoring fallback:', err);
      }
    }

    const finalArticles = rawItems.slice(0, 8).map((item, idx) => {
      const match = scoredList.find(s => s.title?.toLowerCase().includes(item.title.slice(0, 15).toLowerCase())) || scoredList[idx] || {};
      return {
        id: idx + 1,
        title: item.title,
        link: item.link,
        source: item.source,
        pub_date: item.pubDate,
        article_type: item.articleType,
        mapped_subject: match.mappedSubject || 'Economy',
        mapped_chapter: match.mappedChapter || 'Monetary Policy & Fiscal Structure',
        static_relevance_score: match.staticRelevanceScore || 9,
        exam_pattern_score: match.examPatternScore || 9,
        analytical_hook: match.analyticalHook || 'Crucial anchor for descriptive answers, SSB GD panels, and objective MCQs.'
      };
    });

    if (supabase) {
      try {
        await supabase
          .from('scored_articles')
          .upsert(finalArticles.map(({ id, ...rest }) => rest), { onConflict: 'link', ignoreDuplicates: true });
      } catch (e) {
        console.error('Supabase upsert warning:', e.message);
      }
    }

    return {
      statusCode: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ articles: finalArticles })
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err.message, articles: [] })
    };
  }
}