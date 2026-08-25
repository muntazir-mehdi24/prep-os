export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return { 
      statusCode: 405, 
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: 'Method Not Allowed' 
    };
  }

  let body = {};
  try {
    body = JSON.parse(event.body || '{}');
  } catch (err) {
    return {
      statusCode: 400,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Invalid JSON payload' })
    };
  }

  const { action, payload } = body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'GEMINI_API_KEY is not configured on Netlify.' })
    };
  }

  // Action 1: 5-Question Trap Drill Generator for Weak Areas
  if (action === 'generate_trap_drill') {
    const { subject, topic, errorType, memoryTrap } = payload || {};

    const prompt = `You are a strict UPSC/Defence/SSC competitive examination coach.
The candidate struggled with:
Subject: "${subject}"
Topic: "${topic}"
Observed Error Pattern: "${errorType}"
Mistake Trap / Hook: "${memoryTrap || 'General Conceptual Confusion'}"

Task:
1. Provide a 1-sentence forensic summary of the underlying cognitive bias or conceptual failure.
2. Recommend the exact textbook and chapter to re-read.
3. Formulate exactly 5 multiple-choice questions testing the subtlest edge cases, exceptions, and common distractor traps of this exact topic.

Return strictly valid JSON adhering to the specified schema.`;

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
      const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      const parsedOutput = JSON.parse(generatedText || '{}');

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify(parsedOutput)
      };
    } catch (err) {
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: err.message })
      };
    }
  }

  // Action 2: SSB & CAPF Socratic Argument / Lecturette Sparring
  if (action === 'spar_argument') {
    const { topic, userPosition, currentPoints } = payload || {};

    const prompt = `You are an assertive Services Selection Board (SSB) Interviewing Officer and CAPF Paper-2 Examiner.
Current Theme / Topic: "${topic}"
Candidate's Position: "${userPosition}"
Candidate's Notes: "${currentPoints}"

Task:
1. Provide 3 powerful counter-arguments challenging the candidate's thesis.
2. Identify 1 constitutional article, statutory body, or economic survey metric the candidate omitted.
3. Formulate a structured 3-minute Lecturette delivery structure (Intro Hook, Core Drivers, Strategic Challenges, Reasoned Way Forward).

Return strictly valid JSON adhering to the specified schema.`;

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
      const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      const parsedOutput = JSON.parse(generatedText || '{}');

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify(parsedOutput)
      };
    } catch (err) {
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: err.message })
      };
    }
  }

  return { 
    statusCode: 400, 
    headers: { 'Access-Control-Allow-Origin': '*' },
    body: 'Invalid Action' 
  };
}