export async function generateGeminiText({
  systemInstruction,
  prompt,
  messages,
  model,
  temperature,
  maxOutputTokens,
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
      maxOutputTokens
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
