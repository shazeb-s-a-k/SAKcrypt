export async function generateGeminiText({
  systemInstruction,
  prompt,
  messages,
  model,
  temperature,
  maxOutputTokens,
  googleSearch = false,
  signal
}) {
  const response = await fetch('/api/gemini', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal,
    body: JSON.stringify({
      systemInstruction,
      prompt,
      messages,
      model,
      temperature,
      maxOutputTokens,
      googleSearch
    })
  });

  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error(`Gemini API returned an invalid response (HTTP ${response.status}).`);
  }
  if (!response.ok) throw new Error(data.error || `Gemini request failed (HTTP ${response.status}).`);
  if (typeof data.text !== 'string' || !data.text.trim()) {
    throw new Error('Gemini returned an empty response.');
  }
  return data.text;
}

export async function searchGeminiWeb({ prompt, history = [], signal }) {
  const response = await fetch('/api/gemini', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal,
    body: JSON.stringify({
      systemInstruction: 'Answer using Google Search grounding. Prioritize current and authoritative sources. Be clear about uncertainty and dates. Do not invent facts or citations. Keep the answer focused and explicitly cite sources using their exact HTTPS URLs.',
      prompt,
      messages: history,
      googleSearch: true,
      maxOutputTokens: 1800
    })
  });

  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error(`Web search returned an invalid response (HTTP ${response.status}).`);
  }
  if (!response.ok) throw new Error(data.error || `Web search failed (HTTP ${response.status}).`);
  if (typeof data.text !== 'string' || !data.text.trim()) throw new Error('Web search returned an empty response.');
  return { text: data.text, sources: Array.isArray(data.sources) ? data.sources : [] };
}
