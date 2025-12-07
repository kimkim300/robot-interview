// Vercel Serverless Function
// 이 코드는 브라우저가 아닌 Vercel 서버에서만 실행되므로 안전합니다.

export default async function handler(req, res) {
  // 1. 오직 POST 요청만 받습니다 (보안)
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // 2. Vercel 환경변수(금고)에서 API 키를 꺼냅니다.
  // 주의: Vercel 사이트의 [Settings] -> [Environment Variables]에
  // GEMINI_API_KEY 라는 이름으로 키를 저장해야 작동합니다.
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'API Key가 설정되지 않았습니다.' });
  }

  // 3. 클라이언트(index.html)에서 보낸 메시지와 프롬프트를 받습니다.
  const { message, systemPrompt } = req.body;

  try {
    // 4. Google Gemini API에 대신 요청을 보냅니다.
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`,
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

    // 5. 결과를 다시 index.html로 돌려줍니다.
    if (!response.ok) {
      throw new Error(data.error?.message || 'API 요청 실패');
    }

    return res.status(200).json(data);

  } catch (error) {
    console.error("Serverless Function Error:", error);
    return res.status(500).json({ error: 'AI 응답을 가져오는데 실패했습니다.' });
  }
}