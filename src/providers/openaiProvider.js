const RECOMMENDED_TRANSLATION_MODELS = [
  'gpt-5.5',
  'gpt-5.4',
  'gpt-5.2',
  'gpt-5-mini',
  'gpt-4.1'
];

const FALLBACK_TEXT_MODELS = [
  'gpt-5.5',
  'gpt-5.4',
  'gpt-5-mini',
  'gpt-5.2',
  'gpt-5.1',
  'gpt-5',
  'gpt-4.1-mini',
  'gpt-4.1',
  'gpt-4o-mini',
  'gpt-4o'
];

async function listModels({ apiKey }) {
  const key = String(apiKey || '').trim();

  if (!key) {
    throw new Error('OpenAI API 키를 확인하세요.');
  }

  const response = await fetch('https://api.openai.com/v1/models', {
    headers: {
      Authorization: `Bearer ${key}`
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(toUserFacingApiError(response.status, errorText, 'list'));
  }

  const data = await response.json();
  return (data.data || [])
    .map((model) => model.id)
    .filter(isLikelyTextGenerationModel)
    .sort(sortModelIds)
    .map((id) => ({ id, label: id }));
}

async function translate({ apiKey, model, instructions, input, temperature, maxOutputTokens, signal }) {
  const body = {
    model,
    instructions,
    input
  };

  if (Number.isFinite(temperature)) {
    body.temperature = temperature;
  }
  if (Number.isFinite(maxOutputTokens) && maxOutputTokens > 0) {
    body.max_output_tokens = Math.trunc(maxOutputTokens);
  }
  if (usesReasoningTokens(model)) {
    body.reasoning = { effort: 'low' };
  }

  let response;
  let lastErrorText = '';
  for (let attempt = 0; attempt < 3; attempt += 1) {
    response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body),
      signal
    });
    if (response.ok) break;

    lastErrorText = await response.text();
    if (body.temperature !== undefined && /temperature/i.test(lastErrorText)) {
      delete body.temperature;
      continue;
    }
    if (body.reasoning !== undefined && /reasoning|effort/i.test(lastErrorText)) {
      delete body.reasoning;
      continue;
    }
    throw new Error(toUserFacingApiError(response.status, lastErrorText, 'translate'));
  }

  if (!response.ok) {
    throw new Error(toUserFacingApiError(response.status, lastErrorText, 'translate'));
  }

  const data = await response.json();
  const text = extractResponseText(data);

  if (data.status === 'incomplete') {
    const reason = data.incomplete_details?.reason || 'unknown';
    if (reason === 'max_output_tokens') {
      throw new Error('OpenAI 응답이 길이 제한에 도달해 중단되었습니다. 입력을 나누어 보내거나 더 짧게 정리해 주세요.');
    }
    throw new Error(`OpenAI 응답이 완료되지 않았습니다. 중단 사유: ${reason}`);
  }
  if (!text) {
    throw new Error('OpenAI 응답에 결과 텍스트가 없습니다. 모델이 출력 토큰을 모두 사용했을 수 있습니다.');
  }

  return {
    provider: 'openai',
    model,
    text,
    usage: data.usage || null
  };
}

function toUserFacingApiError(status, errorText, kind = 'request') {
  if (status === 401) return 'OpenAI API 키가 올바르지 않습니다.';
  if (status === 404) return '모델명을 확인하세요.';
  if (status === 429) {
    return 'OpenAI API 사용 한도 또는 크레딧을 확인하세요. OpenAI Platform의 Billing에서 결제 상태와 남은 크레딧을 확인할 수 있습니다.';
  }
  if (status >= 500) return 'OpenAI API 서버 응답이 불안정합니다. 잠시 후 다시 시도하세요.';

  try {
    const parsed = JSON.parse(errorText);
    return parsed.error?.message || '번역 요청 중 오류가 발생했습니다.';
  } catch {
    return kind === 'list'
      ? 'OpenAI 모델 목록을 불러오는 중 문제가 발생했습니다.'
      : '번역 요청 중 오류가 발생했습니다.';
  }
}

function extractResponseText(data) {
  if (data.output_text) {
    return data.output_text;
  }

  const textParts = [];
  for (const item of data.output || []) {
    for (const content of item.content || []) {
      if (content.type === 'output_text' && content.text) {
        textParts.push(content.text);
      }
    }
  }

  return textParts.join('\n').trim();
}

function usesReasoningTokens(modelId) {
  return /^(gpt-5|o\d)/i.test(String(modelId || ''));
}

function isLikelyTextGenerationModel(modelId) {
  if (!modelId) return false;

  const excluded = [
    'audio',
    'tts',
    'transcribe',
    'whisper',
    'embedding',
    'moderation',
    'image',
    'dall-e',
    'sora',
    'realtime',
    'search',
    'computer-use',
    'babbage',
    'davinci'
  ];

  if (excluded.some((term) => modelId.toLowerCase().includes(term))) {
    return false;
  }

  return /^(gpt-|o\d|chatgpt-|ft:)/.test(modelId);
}

function sortModelIds(a, b) {
  const recommendedA = RECOMMENDED_TRANSLATION_MODELS.indexOf(a);
  const recommendedB = RECOMMENDED_TRANSLATION_MODELS.indexOf(b);

  if (recommendedA !== -1 || recommendedB !== -1) {
    if (recommendedA === -1) return 1;
    if (recommendedB === -1) return -1;
    return recommendedA - recommendedB;
  }

  const fallbackA = FALLBACK_TEXT_MODELS.indexOf(a);
  const fallbackB = FALLBACK_TEXT_MODELS.indexOf(b);

  if (fallbackA !== -1 || fallbackB !== -1) {
    if (fallbackA === -1) return 1;
    if (fallbackB === -1) return -1;
    return fallbackA - fallbackB;
  }

  return a.localeCompare(b);
}

module.exports = {
  listModels,
  translate
};
