import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const apiKey = process.env.GEMINI_API_KEY;

const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

export async function handler(event) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: corsHeaders, body: 'Method Not Allowed' };
  }

  let body = {};
  try {
    body = JSON.parse(event.body || '{}');
  } catch (err) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Invalid JSON payload' })
    };
  }

  const { action, payload } = body;

  // Tool 1: Direct Bulk PYQ Batch Ingestion
  if (action === 'bulk_ingest_pyq') {
    const { questions } = payload || {};
    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'No question batch provided' }) };
    }

    if (!supabase) {
      return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: 'Supabase credentials missing on Netlify' }) };
    }

    try {
      const { data, error } = await supabase.from('pyq_bank').insert(questions);
      if (error) throw error;
      return {
        statusCode: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: true, count: questions.length })
      };
    } catch (err) {
      return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: err.message }) };
    }
  }

  // Tool 2: High-Yield Elevated-Difficulty Mock Set Generator
  if (action === 'generate_mock_set') {
    const { exam, subject, topic, count = 20, mode = 'chapterwise', testSlot = 1 } = payload || {};

    if (!apiKey) {
      return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: 'GEMINI_API_KEY missing on Netlify' }) };
    }

    const prompt = `You are a premier examiner designing questions for ${exam} (${subject} - ${topic}).
Test Slot: Slot ${testSlot} (${mode.toUpperCase()})
Question Count Needed: Exactly ${count} questions.
Target Difficulty: Strict UPSC/SSC Tier-1/Tier-2 level (+15% above standard cutoff edge-cases).

Requirements:
1. Provide authentic 4-option MCQs.
2. Ensure options are clever distractors testing conceptual traps, formula exceptions, or elimination tricks.
3. Provide an authoritative 1-sentence solution anchor for every question.

Return strictly valid JSON adhering to the specified schema.`;

    const requestBody = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'OBJECT',
          properties: {
            questions: {
              type: 'ARRAY',
              items: {
                type: 'OBJECT',
                properties: {
                  question: { type: 'STRING' },
                  options: { type: 'ARRAY', items: { type: 'STRING' } },
                  correctIndex: { type: 'INTEGER' },
                  explanation: { type: 'STRING' }
                },
                required: ['question', 'options', 'correctIndex', 'explanation']
              }
            }
          },
          required: ['questions']
        }
      }
    };

    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      const data = await res.json();
      const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      const parsedOutput = JSON.parse(generatedText || '{}');

      return {
        statusCode: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify(parsedOutput)
      };
    } catch (err) {
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({ error: err.message })
      };
    }
  }

  // Tool 3: Diagnostic 5-Trap Drill
  if (action === 'generate_trap_drill') {
    const { subject, topic, errorType, memoryTrap } = payload || {};

    const prompt = `You are a strict UPSC/Defence/SSC competitive examination coach.
Subject: "${subject}", Topic: "${topic}", Error: "${errorType}", Trap: "${memoryTrap || 'None'}"
Generate 5 diagnostic multiple-choice questions testing the subtlest edge-cases.`;

    const requestBody = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'OBJECT',
          properties: {
            topicDiagnostic: { type: 'STRING' },
            recommendedChapterReRead: { type: 'STRING' },
            questions: {
              type: 'ARRAY',
              items: {
                type: 'OBJECT',
                properties: {
                  question: { type: 'STRING' },
                  options: { type: 'ARRAY', items: { type: 'STRING' } },
                  correctIndex: { type: 'INTEGER' },
                  trapExplanation: { type: 'STRING' }
                },
                required: ['question', 'options', 'correctIndex', 'trapExplanation']
              }
            }
          },
          required: ['topicDiagnostic', 'recommendedChapterReRead', 'questions']
        }
      }
    };

    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });
      const data = await res.json();
      const parsedOutput = JSON.parse(data.candidates?.[0]?.content?.parts?.[0]?.text || '{}');
      return { statusCode: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }, body: JSON.stringify(parsedOutput) };
    } catch (err) {
      return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: err.message }) };
    }
  }

  // Tool 4: Socratic Sparring
  if (action === 'spar_argument') {
    const { topic, userPosition, currentPoints } = payload || {};
    const prompt = `SSB IO & CAPF Examiner Sparring on "${topic}". Candidate Stance: "${userPosition}". Notes: "${currentPoints}".`;

    const requestBody = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'OBJECT',
          properties: {
            counterArguments: { type: 'ARRAY', items: { type: 'STRING' } },
            dataOrConstitutionalCitationMissed: { type: 'STRING' },
            lecturetteSkeleton: {
              type: 'OBJECT',
              properties: {
                introHook: { type: 'STRING' },
                keyDrivers: { type: 'STRING' },
                criticalChallenges: { type: 'STRING' },
                strategicWayForward: { type: 'STRING' }
              },
              required: ['introHook', 'keyDrivers', 'criticalChallenges', 'strategicWayForward']
            }
          },
          required: ['counterArguments', 'dataOrConstitutionalCitationMissed', 'lecturetteSkeleton']
        }
      }
    };

    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });
      const data = await res.json();
      const parsedOutput = JSON.parse(data.candidates?.[0]?.content?.parts?.[0]?.text || '{}');
      return { statusCode: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }, body: JSON.stringify(parsedOutput) };
    } catch (err) {
      return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: err.message }) };
    }
  }

  return { statusCode: 400, headers: corsHeaders, body: 'Invalid Action' };
}