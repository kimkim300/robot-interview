export default async function handler(req, res) {
  console.log("API 요청 시작: Method =", req.method);

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const apiKey = (process.env.GEMINI_API_KEY || "").trim();
  console.log("API Key 존재 여부:", !!apiKey);

  if (!apiKey) {
    return res.status(500).json({ error: 'API Key가 설정되지 않았습니다.' });
  }

  const { message, systemPrompt } = req.body;

  // 🛡️ [오뚝이 전략] 시도할 모델 목록 (순서대로 도전합니다)
  // 1순위: 1.5-flash (빠르고 똑똑함)
  // 2순위: 1.5-flash-001 (구체적 버전명)
  // 3순위: gemini-pro (가장 많이 쓰이는 표준형)
  const modelsToTry = [
    "gemini-1.5-flash",
    "gemini-1.5-flash-001",
    "gemini-pro"
  ];

  let lastError = null;

  // 반복문을 돌면서 하나씩 시도해봅니다.
  for (const modelName of modelsToTry) {
    try {
      console.log(`[도전] 모델 시도 중: ${modelName}`);
      
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: message }] }],
            systemInstruction: { parts: [{ text: systemPrompt }] },
          }),
        }
      );

      // 성공하면(200 OK) 바로 결과를 반환하고 끝냅니다.
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ [성공] ${modelName} 모델로 답변을 받았습니다!`);
        return res.status(200).json(data);
      }

      // 실패하면 에러를 기록하고 다음 모델로 넘어갑니다.
      const errorText = await response.text();
      console.warn(`⚠️ [실패] ${modelName} 응답 에러: ${response.status}`);
      lastError = `모델(${modelName}) 오류: ${response.status} - ${errorText}`;

      // 404(모델 없음)가 아니면 다른 문제일 수 있으니 계속 시도
      
    } catch (error) {
      console.error(`❌ [오류] ${modelName} 호출 중 예외 발생:`, error);
      lastError = error.message;
    }
  }

  // 모든 모델이 다 실패했을 때만 여기로 옵니다.
  console.error("🚨 모든 모델 시도 실패. 최후의 에러:", lastError);
  return res.status(500).json({ error: "모든 AI 모델 연결에 실패했습니다. (API 키 권한을 확인해주세요) " + lastError });
}