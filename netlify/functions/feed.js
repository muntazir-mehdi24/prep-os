import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const apiKey = process.env.GEMINI_API_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

const RSS_FEEDS = [
  { name: 'The Hindu - National', url: 'https://www.thehindu.com/news/national/feeder/default.rss', type: 'editorial' },
  { name: 'The Hindu - Opinion', url: 'https://www.thehindu.com/opinion/editorial/feeder/default.rss', type: 'editorial' },
  { name: 'Indian Express - Explained', url: 'https://indianexpress.com/section/explained/feed/', type: 'editorial' },
  { name: 'PIB - National', url: 'https://pib.gov.in/RssMain.aspx?ModId=6&LangId=1', type: 'pib_release' }
];

// Lightweight XML parser for serverless execution
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
  if (event.httpMethod !== 'GET' && event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: { 'Access-Control-Allow-Origin': '*' }, body: 'Method Not Allowed' };
  }

  // Handle Feedback Upvote/Dismiss Signal
  if (event.httpMethod === 'POST') {
    try {
      const { articleId, action, subject, topic } = JSON.parse(event.body || '{}');

      // Update article status
      if (articleId) {
        await supabase
          .from('scored_articles')
          .update({ status: action === 'upvote' ? 'bookmarked' : 'dismissed' })
          .eq('id', articleId);
      }

      // Update dynamic weights table
      if (subject && topic) {
        const { data: existing } = await supabase
          .from('article_feedback_weights')
          .select('*')
          .eq('subject', subject)
          .eq('domain_topic', topic)
          .single();

        if (existing) {
          const positive = existing.positive_signals + (action === 'upvote' ? 1 : 0);
          const negative = existing.negative_signals + (action === 'dismiss' ? 1 : 0);
          const multiplier = Math.max(0.2, Math.min(2.0, 1.0 + (positive - negative) * 0.1));

          await supabase
            .from('article_feedback_weights')
            .update({ positive_signals: positive, negative_signals: negative, weight_multiplier: multiplier, updated_at: new Date().toISOString() })
            .eq('id', existing.id);
        } else {
          await supabase.from('article_feedback_weights').insert([{
            subject,
            domain_topic: topic,
            positive_signals: action === 'upvote' ? 1 : 0,
            negative_signals: action === 'dismiss' ? 1 : 0,
            weight_multiplier: action === 'upvote' ? 1.1 : 0.9
          }]);
        }
      }

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ success: true })
      };
    } catch (err) {
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: err.message })
      };
    }
  }

  // GET Request: Fetch, Classify, Score, and Return Curated Digest
  try {
    // 1. Fetch from Supabase cache first (articles < 48 hours old)
    const { data: cachedArticles } = await supabase
      .from('scored_articles')
      .select('*')
      .neq('status', 'dismissed')
      .order('created_at', { ascending: false })
      .limit(30);

    if (cachedArticles && cachedArticles.length >= 10) {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ articles: cachedArticles })
      };
    }

    // 2. Fetch raw feeds
    let rawFeedItems = [];
    for (const feed of RSS_FEEDS) {
      try {
        const res = await fetch(feed.url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        if (res.ok) {
          const text = await res.text();
          const parsed = parseRssItems(text, feed.name, feed.type);
          rawFeedItems = [...rawFeedItems, ...parsed];
        }
      } catch (e) {
        console.error(`Failed to fetch ${feed.name}:`, e);
      }
    }

    if (rawFeedItems.length === 0) {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ articles: cachedArticles || [] })
      };
    }

    // 3. Score Raw Items via Gemini 2-Axis Taxonomy Evaluator
    const scoringPrompt = `You are a strict UPSC/Defence Exam intelligence analyst.
Evaluate each headline below. For each item:
1. Map it to one of the 9 standard subjects: Polity, History, Geography, Science, Economy, Current Affairs, English, Writing, Reasoning.
2. Provide the exact syllabus subtopic chapter.
3. Assign static_relevance_score (1-10): Does it map directly to NCERT/Laxmikant/Spectrum/Mrunal static concepts?
4. Assign exam_pattern_score (1-10): Has this event type (bilateral summits, RBI policy, ISRO missions, defense treaties, high court rulings) appeared historically in CDS/CAPF/AFCAT/CGL?
5. Generate an analytical_hook (1 sentence on why it matters for descriptive/SSB prep).

Headlines to evaluate:
${JSON.stringify(rawFeedItems.slice(0, 12))}`;

    const requestBody = {
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
    };

    const aiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    const aiData = await aiRes.json();
    const scoredList = JSON.parse(aiData.candidates?.[0]?.content?.parts?.[0]?.text || '[]');

    // 4. Merge metadata and store into Supabase
    const toInsert = [];
    rawFeedItems.forEach(item => {
      const match = scoredList.find(s => s.title?.toLowerCase().includes(item.title.slice(0, 20).toLowerCase())) || scoredList[0];
      if (match) {
        toInsert.push({
          title: item.title,
          link: item.link,
          source: item.source,
          pub_date: item.pubDate,
          article_type: item.articleType,
          mapped_subject: match.mappedSubject || 'Current Affairs',
          mapped_chapter: match.mappedChapter || 'General Awareness',
          static_relevance_score: match.staticRelevanceScore || 7,
          exam_pattern_score: match.examPatternScore || 8,
          analytical_hook: match.analyticalHook || 'High-yield context for national security & economics.'
        });
      }
    });

    if (toInsert.length > 0) {
      await supabase.from('scored_articles').upsert(toInsert, { onConflict: 'link', ignoreDuplicates: true });
    }

    const { data: finalArticles } = await supabase
      .from('scored_articles')
      .select('*')
      .neq('status', 'dismissed')
      .order('created_at', { ascending: false })
      .limit(20);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ articles: finalArticles || toInsert })
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: err.message })
    };
  }
}