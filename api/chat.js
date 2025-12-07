export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'API Key가 설정되지 않았습니다.' });
  }

  const { message, systemPrompt } = req.body;

  try {
    // ⭐ 여기를 수정했어요! (2.5 -> 1.5-flash)
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: message }] }],
          systemInstruction: { parts: [{ text: systemPrompt }] },
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'API 요청 실패');
    }

    return res.status(200).json(data);

  } catch (error) {
    console.error("Serverless Function Error:", error);
    return res.status(500).json({ error: 'AI 응답 실패: ' + error.message });
  }
}