export default async function handler(req, res) {
  // 1. 디버깅을 위한 로그 출력 (Vercel 로그에서 확인 가능)
  console.log("API 요청 시작: Method =", req.method);

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  
  // 2. 키가 진짜로 있는지 확인 (키 값은 보안상 출력하지 않고 유무만 확인)
  console.log("API Key 존재 여부:", !!apiKey);

  if (!apiKey) {
    console.error("오류: 환경변수 GEMINI_API_KEY가 없음");
    return res.status(500).json({ error: 'Vercel 환경변수에 GEMINI_API_KEY가 설정되지 않았거나, 설정 후 재배포(Redeploy)하지 않았습니다.' });
  }

  const { message, systemPrompt } = req.body;

  try {
    // 3. Google API 호출
    // ⭐ 최종 수정: 'gemini-pro' (구형) 대신 현재 표준인 'gemini-1.5-flash' 사용
    // 이 모델 이름은 가장 안정적이며 systemInstruction 기능도 지원합니다.
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

    // 4. 응답 상태가 정상이 아닐 경우 에러 내용을 상세히 읽어옴
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
            // JSON 파싱 실패 시 원본 텍스트 사용
            errorMsg = errorText; 
        }
        throw new Error(errorMsg);
    }

    const data = await response.json();
    return res.status(200).json(data);

  } catch (error) {
    console.error("최종 에러 발생:", error);
    // 클라이언트에게 에러 내용을 그대로 전달
    return res.status(500).json({ error: error.message });
  }
}