const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';
const GENERATE_CONTENT_METHOD = 'generateContent';

async function listModels({ apiKey }) {
  const key = String(apiKey || '').trim();

  if (!key) {
    throw new Error('Gemini API 키를 확인하세요.');
  }

  const response = await fetch(`${GEMINI_BASE_URL}/models`, {
    headers: {
      'x-goog-api-key': key
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(toUserFacingApiError(response.status, errorText, 'list'));
  }

  const data = await response.json();
  return (data.models || [])
    .filter(
      (model) =>
        Array.isArray(model.supportedGenerationMethods) &&
        model.supportedGenerationMethods.includes(GENERATE_CONTENT_METHOD)
    )
    .map((model) => {
      const id = stripModelsPrefix(model.name);
      return { id, label: model.displayName || id };
    });
}

async function translate({ apiKey, model, prompt, temperature, maxOutputTokens, responseMimeType, responseSchema, signal }) {
  const id = stripModelsPrefix(model);
  const generationConfig = {};
  if (Number.isFinite(temperature)) {
    generationConfig.temperature = temperature;
  } else {
    generationConfig.temperature = 0.2;
  }
  if (Number.isFinite(maxOutputTokens) && maxOutputTokens > 0) {
    generationConfig.maxOutputTokens = Math.trunc(maxOutputTokens);
  }
  if (responseMimeType) {
    generationConfig.responseMimeType = responseMimeType;
  }
  if (responseSchema) {
    generationConfig.responseSchema = responseSchema;
  }

  let response = await requestGenerateContent({ apiKey, id, prompt, generationConfig, signal });

  if (!response.ok) {
    const errorText = await response.text();
    if (
      (generationConfig.responseMimeType || generationConfig.responseSchema) &&
      /responseMimeType|responseSchema|schema|mime|generationConfig/i.test(errorText)
    ) {
      delete generationConfig.responseMimeType;
      delete generationConfig.responseSchema;
      response = await requestGenerateContent({ apiKey, id, prompt, generationConfig, signal });
      if (response.ok) {
        const data = await response.json();
        return resultFromGeminiData(data, id);
      }
      const retryErrorText = await response.text();
      throw new Error(toUserFacingApiError(response.status, retryErrorText, 'translate'));
    }
    throw new Error(toUserFacingApiError(response.status, errorText, 'translate'));
  }

  const data = await response.json();
  return resultFromGeminiData(data, id);
}

async function requestGenerateContent({ apiKey, id, prompt, generationConfig, signal }) {
  return fetch(`${GEMINI_BASE_URL}/models/${id}:${GENERATE_CONTENT_METHOD}`, {
    method: 'POST',
    headers: {
      'x-goog-api-key': apiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: prompt
            }
          ]
        }
      ],
      generationConfig
    }),
    signal
  });
}

function resultFromGeminiData(data, id) {
  const text = extractText(data);
  const finishReason = data?.candidates?.[0]?.finishReason || '';

  if (finishReason === 'MAX_TOKENS') {
    throw new Error('Gemini 응답이 길이 제한에 도달해 중단되었습니다. 입력을 나누어 보내거나 더 짧게 정리해 주세요.');
  }
  if (['SAFETY', 'RECITATION', 'LANGUAGE', 'BLOCKLIST', 'PROHIBITED_CONTENT', 'SPII'].includes(finishReason)) {
    throw new Error(`Gemini 응답이 생성 중단되었습니다. 중단 사유: ${finishReason}`);
  }
  if (!text) {
    throw new Error(finishReason ? `Gemini 응답 형식을 확인하세요. 중단 사유: ${finishReason}` : 'Gemini 응답 형식을 확인하세요.');
  }

  return {
    provider: 'gemini',
    model: id,
    text,
    usage: data.usageMetadata || null
  };
}

function stripModelsPrefix(name) {
  return String(name || '').replace(/^models\//, '');
}

function extractText(data) {
  const parts = data?.candidates?.[0]?.content?.parts || [];
  return parts
    .map((part) => part.text || '')
    .join('')
    .trim();
}

function toUserFacingApiError(status, errorText, kind = 'request') {
  if (status === 400 || status === 401 || status === 403) {
    return 'Gemini API 키를 확인하세요.';
  }
  if (status === 404) return '모델명을 확인하세요.';
  if (status === 429) {
    return 'Gemini 무료 사용 한도(분당/일일 요청)를 초과했을 수 있습니다. 잠시 후 다시 시도하거나 Google AI Studio에서 사용량을 확인하세요.';
  }
  if (status >= 500) return 'Gemini API 서버 응답이 불안정합니다. 잠시 후 다시 시도하세요.';

  return kind === 'list'
    ? 'Gemini 모델 목록을 불러오는 중 문제가 발생했습니다.'
    : '번역 요청 중 오류가 발생했습니다.';
}

module.exports = {
  listModels,
  translate
};
