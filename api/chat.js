export default async function handler(req, res) {
  // 1. 디버깅을 위한 로그 출력
  console.log("API 요청 시작: Method =", req.method);

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // 🛡️ 안전장치 추가: 키 앞뒤에 공백이 있으면 제거(.trim)
  const apiKey = (process.env.GEMINI_API_KEY || "").trim();
  
  // 2. 키 확인
  console.log("API Key 존재 여부:", !!apiKey);
  console.log("API Key 길이:", apiKey ? apiKey.length : 0); // 키 길이 확인 (로그로 확인용)

  if (!apiKey) {
    console.error("오류: 환경변수 GEMINI_API_KEY가 없음");
    return res.status(500).json({ error: 'Vercel 환경변수에 GEMINI_API_KEY가 없거나 비어 있습니다.' });
  }

  const { message, systemPrompt } = req.body;

  try {
    // 3. Google API 호출
    // ⭐ 모델명: gemini-1.5-flash (가장 안정적인 최신 버전)
    // 참고: systemInstruction 기능이 지원되는 모델입니다.
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

    // 4. 응답 에러 처리
    if (!response.ok) {
        const errorText = await response.text();
        console.error("Google API 응답 에러:", response.status, errorText);
        
        let errorMsg = `Google AI 오류 (${response.status})`;
        try {
            const errorJson = JSON.parse(errorText);
            if (errorJson.error && errorJson.error.message) {
                errorMsg = errorJson.error.message;
            }
        } catch (e) {
            errorMsg = errorText; 
        }
        throw new Error(errorMsg);
    }

    const data = await response.json();
    return res.status(200).json(data);

  } catch (error) {
    console.error("최종 에러 발생:", error);
    return res.status(500).json({ error: error.message });
  }
}