const openaiProvider = require('./providers/openaiProvider');
const geminiProvider = require('./providers/geminiProvider');

const PROVIDERS = {
  openai: openaiProvider,
  gemini: geminiProvider
};

const DEFAULT_TARGET_TERMS = ['탐사자님', '탐사자', 'PC', '플레이어'];
const MAX_OUTPUT_TOKENS = 8192;
const MAX_BLOCK_OUTPUT_TOKENS = 16000;

const COMMON_RULES = `역할:
TRPG 시나리오 한국어 문장 편집자입니다.

공통 규칙:
- 결과문만 출력합니다.
- 원문의 사건, 정보량, 장면 순서, 행동 주체, 장소, 상태, 단서, 핵심 어휘를 유지합니다.
- 원문의 추측, 유보, 정정, 반박, 불확실성은 정보로 취급해 보존합니다. 가능성을 확정 사실로 바꾸지 않습니다.
- 원문에 없는 설정, 감정, 심리 해석, 비유, 분위기어를 추가하지 않습니다.
- 서술 영역은 한국어 GM 지문형 문장으로 정리합니다.
- 서술 영역의 종결은 기본적으로 "~다", "~한다", "~했다" 체를 사용합니다. 안내문처럼 "~습니다" 체로 끝내지 않습니다.
- 원문 보존은 정보 보존이지, 직역투·요체·화자체 보존이 아닙니다.
- 일본어 번역체 어순, 어색한 조사, 부자연스러운 피동/사동, 과한 명사화, 직역투 연결은 자연스러운 한국어 문법으로 정리합니다.
- 서술 영역의 "~요", "~죠", "~군요", "~네요", "~일까요?", "~겠죠?", "~아니에요", "~니까요"는 GM 지문형으로 바꿉니다.
- "아, 물론", "자,", "뭐,", "그렇지 않나요?" 같은 화자 추임새는 삭제하거나 중립 지문으로 바꿉니다.
- "아니", "모두가 ~는 아니겠지만", "~였을지도 모른다"처럼 앞 내용을 정정하거나 유보하는 문장은 삭제하지 말고 중립 지문으로 보존합니다.
- 한 문장마다 줄바꿈하지 않습니다. 장면, 행동, 정보 단위가 바뀔 때만 문단을 나눕니다.
- 코코포리아 채팅창에 붙여넣기 좋게 줄바꿈을 정리합니다.`;

const EDIT_MODES = {
  preserve: {
    label: 'GM 지문 정리',
    temperature: 0.16,
    instruction: `${COMMON_RULES}

현재 모드: GM 지문 정리

- 정보 보존형 기본 정리입니다.
- 원문의 사건, 정보량, 장면 순서, 행동 주체, 핵심 표현은 유지합니다.
- 문장을 요약하거나 새로 쓰지 않습니다.
- 단, 번역체와 화자체는 원문 보존 대상이 아니므로 한국어 GM 지문으로 정리합니다.
- 직역투·요체·화자체가 남아 있으면 보존하지 말고 반드시 한국어 GM 지문으로 고칩니다.
- 명백한 오탈자, 조사 오류, 어색한 어미는 고치되, 원문 자체가 다소 비문이어도 문장 구조를 크게 재작성하지 않습니다.
- 문장 연결과 문단 호흡은 필요한 범위에서만 다듬습니다.
- 원문에 없는 감정, 분위기어, 심리 해석, 비유를 추가하지 않습니다.
- 한 서술 블록 안에 3문장 이상이 있어도 문장마다 줄바꿈하지 말고, 의미 단위가 바뀔 때만 빈 줄을 넣습니다.`
  },
  natural: {
    label: '대사 유지 자연화',
    temperature: 0.28,
    instruction: `${COMMON_RULES}

현재 모드: 대사 유지 자연화

- GM 낭독용 자연 정리입니다. 약간 부드러운 소설식 호흡을 허용하되, 시나리오 지문으로 바로 읽을 수 있는 선을 넘지 않습니다.
- 사건, 정보, 장면 순서는 유지합니다.
- 문장 분리와 결합, 어순 조정, 문단 호흡 조정을 허용합니다.
- 번역체와 화자체를 제거하고 자연스러운 한국어 지문으로 정리합니다.
- 단조로운 직역문은 장면 흐름이 이어지도록 부드럽게 다듬을 수 있습니다.
- 감각 표현은 원문에 근거가 있을 때만 담백하게 정리합니다.
- 원문에 없는 감정, 분위기, 해석은 추가하지 않습니다.
- 한 문단은 보통 1~3문장으로 유지하되, 한 문장마다 줄바꿈하지 않습니다.`
  },
  remove_narrator: {
    label: '화자 개입 제거',
    temperature: 0.18,
    instruction: `${COMMON_RULES}

현재 모드: 화자 개입 제거

- 작가가 독자, 플레이어, 탐사자에게 직접 말하는 흔적을 제거하는 모드입니다.
- 질문형, 감탄형, 농담형, 수사적 질문, 작가 추임새를 GM 지문으로 바꿉니다.
- 자연 윤문이 목적이 아니므로 문장을 과하게 꾸미지 않습니다.
- NPC 대사처럼 명확한 문장은 임의로 지문으로 바꾸지 않습니다.
- 장면이나 판단이 바뀔 때만 빈 줄을 넣습니다. 문장마다 빈 줄을 넣지 않습니다.`
  }
};

const GEMINI_COMMON_RULES = `${COMMON_RULES}
- 설명, 제목, 주석, 마크다운을 쓰지 않습니다.
- 원문 유지는 정보 보존이며, 번역체·요체 보존이 아닙니다.`;

const GEMINI_MODE_INSTRUCTIONS = {
  preserve: `${GEMINI_COMMON_RULES}

현재 모드: GM 지문 정리

- 정보 보존형 기본 정리입니다.
- 원문의 사건, 정보량, 장면 순서, 행동 주체, 핵심 표현은 유지합니다.
- 문장을 요약하거나 새로 쓰지 않습니다.
- 단, 번역체와 화자체는 원문 보존 대상이 아니므로 한국어 GM 지문으로 정리합니다.
- 직역투·요체·화자체가 남아 있으면 보존하지 말고 반드시 한국어 GM 지문으로 고칩니다.
- 명백한 오탈자, 조사 오류, 어색한 어미는 고치되, 원문 자체가 다소 비문이어도 문장 구조를 크게 재작성하지 않습니다.
- 문장 연결과 문단 호흡은 필요한 범위에서만 다듬습니다.
- 원문에 없는 감정, 분위기어, 심리 해석, 비유를 추가하지 않습니다.`,

  natural: `${GEMINI_COMMON_RULES}

현재 모드: 대사 유지 자연화

- GM 낭독용 자연 정리입니다. 약간 부드러운 소설식 호흡을 허용하되, 시나리오 지문으로 바로 읽을 수 있는 선을 넘지 않습니다.
- 사건, 정보, 장면 순서는 유지합니다.
- 문장 분리와 결합, 어순 조정, 문단 호흡 조정을 허용합니다.
- 번역체와 화자체를 제거하고 자연스러운 한국어 지문으로 정리합니다.
- 단조로운 직역문은 장면 흐름이 이어지도록 부드럽게 다듬을 수 있습니다.
- 감각 표현은 원문에 근거가 있을 때만 담백하게 정리합니다.
- 원문에 없는 감정, 분위기, 해석은 추가하지 않습니다.`,

  remove_narrator: `${GEMINI_COMMON_RULES}

현재 모드: 화자 개입 제거

- 작가가 독자, 플레이어, 탐사자에게 직접 말하는 흔적을 제거하는 모드입니다.
- 질문형, 감탄형, 농담형, 수사적 질문, 작가 추임새를 GM 지문으로 바꿉니다.
- 자연 윤문이 목적이 아니므로 문장을 과하게 꾸미지 않습니다.
- NPC 대사처럼 명확한 문장은 임의로 지문으로 바꾸지 않습니다.`
};

const GEMINI_BLOCK_RESPONSE_CONFIG = {
  responseMimeType: 'application/json',
  responseSchema: {
    type: 'object',
    properties: {
      blocks: {
        type: 'array',
        items: { type: 'string' }
      }
    },
    required: ['blocks']
  }
};

const ENHANCE_TEMPERATURES = {
  off: null,
  normal: 0.3,
  strong: 0.42
};

const ENHANCE_NARRATION_RULES = {
  normal: `서술 보강(보통):
- 이 옵션이 켜지면 기본 GM 지문 정리보다 편집 강도를 한 단계 높입니다.
- 끊긴 문장, 번역체 어순, 반복되는 지칭, 생략되어 어색한 주어, 갑작스러운 장면 전환을 GM이 읽기 좋은 흐름으로 보완합니다.
- 단문이 기계적으로 이어진 부분은 자연스럽게 연결하거나, 필요하면 문단을 나누어 호흡을 만듭니다.
- 문장마다 줄바꿈하는 방식은 피하고, 같은 행동·묘사·정보는 한 문단 안에 묶습니다.
- 원문의 행동 주체가 분명한데 문장이 떠 있으면 주어를 보완합니다.
- 비문 교정은 의미가 흔들리지 않는 범위에서 수행합니다. 문장 전체를 과하게 새로 쓰지는 않습니다.
- 같은 정보를 반복하는 직역문은 정보량을 유지한 채 더 매끄러운 한두 문장으로 정리할 수 있습니다.
- 묘사는 원문에 있는 감각·행동·상태를 바탕으로만 담백하게 다듬습니다.
- 원문에 암시되지 않은 설정, 단서, 감정, NPC 의도, 분위기어는 추가하지 않습니다.`,
  strong: `서술 보강(강하게):
- 기본 GM 지문 정리보다 편집 강도를 두 단계 높입니다.
- 원문의 사건, 단서, 행동 주체, 장면 순서는 유지하되 문장 재배열, 결합, 분리를 적극 허용합니다.
- 비문, 어색한 접속, 꼬인 수식, 부자연스러운 피동/사동, 주어-서술어 불일치, 조사 오류를 적극적으로 교정합니다.
- 단절된 직역문은 GM이 바로 낭독할 수 있도록 자연스러운 장면 흐름으로 다시 엮습니다.
- 생략된 주어, 불명확한 행동 연결, 갑작스러운 장면 전환은 원문 근거 안에서 분명하게 보완합니다.
- 같은 의미가 반복되는 문장은 정보량을 유지하면서 더 매끄러운 문단으로 압축할 수 있습니다.
- 문장마다 줄바꿈하는 방식은 피하고, 같은 행동·묘사·정보는 한 문단 안에 묶습니다.
- 묘사는 원문에 있는 감각·행동·상태를 바탕으로만 담백하게 확장합니다.
- 원문에 없는 설정, 단서, 감정 단정, NPC 의도, 복선, 분위기어는 만들지 않습니다.`
};

function getProvider(name) {
  return PROVIDERS[name] || PROVIDERS.openai;
}

function getModeInstruction(mode, provider) {
  const modeConfig = EDIT_MODES[mode] || EDIT_MODES.preserve;
  if (provider === 'gemini') {
    return GEMINI_MODE_INSTRUCTIONS[mode] || GEMINI_MODE_INSTRUCTIONS.preserve;
  }
  return modeConfig.instruction;
}

function normalizeEnhanceLevel(value) {
  return ['normal', 'strong'].includes(value) ? value : 'off';
}

async function cleanText({ provider, apiKey, model, mode, text, enhanceLevel = 'off', targetTerms, targetName, applyTargetToDialogue, allowOmitRepeatedTarget, signal }) {
  const source = String(text || '').trim();
  const modeConfig = EDIT_MODES[mode] || EDIT_MODES.preserve;
  const normalizedEnhanceLevel = normalizeEnhanceLevel(enhanceLevel);
  const temperature = mode === 'preserve' && normalizedEnhanceLevel !== 'off'
    ? ENHANCE_TEMPERATURES[normalizedEnhanceLevel]
    : modeConfig.temperature;
  const modeInstruction = getModeInstruction(mode, provider);
  const baseInstructions = instructionWithTarget(mode === 'preserve' && normalizedEnhanceLevel !== 'off'
    ? `${modeInstruction}\n\n${ENHANCE_NARRATION_RULES[normalizedEnhanceLevel]}`
    : modeInstruction, {
    targetTerms,
    targetName,
    applyTargetToDialogue,
    allowOmitRepeatedTarget,
    provider
  });
  // 전체 정리 경로는 서술+대사가 모두 입력되므로 대사 보수 정리 규칙을 덧붙인다.
  const instructions = `${baseInstructions}\n\n${fullCleanDialogueRules(mode, provider)}`;

  const result = await getProvider(provider).translate({
    apiKey,
    model,
    instructions,
    input: `원문:\n${source}`,
    prompt: `${instructions}\n\n원문:\n${source}`,
    temperature,
    maxOutputTokens: MAX_OUTPUT_TOKENS,
    signal
  });

  let cleaned = stabilizeCleanedText(result.text, { mode, targetTerms, targetName, applyTargetToDialogue });
  const findings = detectNarrationPolicyIssues(cleaned);
  if (findings.length) {
    const retryInstructions = buildRetryInstructions(instructions, findings);
    const retryInput = `원문:\n${source}\n\n이전 출력:\n${cleaned}`;
    const retryResult = await getProvider(provider).translate({
      apiKey,
      model,
      instructions: retryInstructions,
      input: retryInput,
      prompt: `${retryInstructions}\n\n${retryInput}`,
      temperature,
      maxOutputTokens: MAX_OUTPUT_TOKENS,
      signal
    });
    cleaned = stabilizeCleanedText(retryResult.text, { mode, targetTerms, targetName, applyTargetToDialogue });
  }

  return cleaned;
}

async function cleanNarrationBlocks({ provider, apiKey, model, mode, blocks, enhanceLevel = 'off', targetTerms, targetName, applyTargetToDialogue, allowOmitRepeatedTarget, signal }) {
  const modeConfig = EDIT_MODES[mode] || EDIT_MODES.preserve;
  const normalizedEnhanceLevel = normalizeEnhanceLevel(enhanceLevel);
  const temperature = normalizedEnhanceLevel !== 'off'
    ? ENHANCE_TEMPERATURES[normalizedEnhanceLevel]
    : modeConfig.temperature;
  const nonEmptyBlocks = (Array.isArray(blocks) ? blocks : [])
    .map((item) => String(item || '').trim())
    .filter(Boolean);

  const modeInstruction = getModeInstruction(mode, provider);
  const baseInstructions = instructionWithTarget(normalizedEnhanceLevel !== 'off'
    ? `${modeInstruction}\n\n${ENHANCE_NARRATION_RULES[normalizedEnhanceLevel]}`
    : modeInstruction, {
    targetTerms,
    targetName,
    applyTargetToDialogue,
    allowOmitRepeatedTarget,
    provider
  });
  const instructions = buildBlockInstructions(baseInstructions, provider, mode);

  const input = JSON.stringify(nonEmptyBlocks, null, 2);
  const result = await getProvider(provider).translate({
    apiKey,
    model,
    instructions,
    input,
    prompt: `${instructions}\n\n${input}`,
    temperature,
    maxOutputTokens: Math.min(Math.max(MAX_OUTPUT_TOKENS, 1600 * nonEmptyBlocks.length), MAX_BLOCK_OUTPUT_TOKENS),
    ...(provider === 'gemini' ? GEMINI_BLOCK_RESPONSE_CONFIG : {}),
    signal
  });

  let parsed = parseJsonObject(result.text);
  if (!Array.isArray(parsed.blocks)) {
    throw new Error('모델 응답에 blocks 배열이 없습니다.');
  }
  if (parsed.blocks.length !== nonEmptyBlocks.length) {
    throw new Error(`모델 응답 블록 수가 맞지 않습니다. 요청 ${nonEmptyBlocks.length}개 / 응답 ${parsed.blocks.length}개`);
  }

  const stabilizedBlocks = parsed.blocks.map((item) => stabilizeCleanedText(item, {
    mode,
    targetTerms,
    targetName,
    applyTargetToDialogue: true
  }));
  const findings = unique(stabilizedBlocks.flatMap(detectNarrationPolicyIssues));
  if (findings.length) {
    const retryInstructions = `${buildRetryInstructions(instructions, findings)}

이전 출력 blocks:
${JSON.stringify(stabilizedBlocks, null, 2)}`;
    const retryInput = JSON.stringify(nonEmptyBlocks, null, 2);
    const retryResult = await getProvider(provider).translate({
      apiKey,
      model,
      instructions: retryInstructions,
      input: retryInput,
      prompt: `${retryInstructions}\n\n${retryInput}`,
      temperature,
      maxOutputTokens: Math.min(Math.max(MAX_OUTPUT_TOKENS, 1600 * nonEmptyBlocks.length), MAX_BLOCK_OUTPUT_TOKENS),
      ...(provider === 'gemini' ? GEMINI_BLOCK_RESPONSE_CONFIG : {}),
      signal
    });
    parsed = parseJsonObject(retryResult.text);
    if (!Array.isArray(parsed.blocks)) {
      throw new Error('모델 응답에 blocks 배열이 없습니다.');
    }
    if (parsed.blocks.length !== nonEmptyBlocks.length) {
      throw new Error(`모델 응답 블록 수가 맞지 않습니다. 요청 ${nonEmptyBlocks.length}개 / 응답 ${parsed.blocks.length}개`);
    }
  }

  return parsed.blocks.map((item) => stabilizeCleanedText(item, {
    mode,
    targetTerms,
    targetName,
    applyTargetToDialogue: true
  }));
}

function buildBlockInstructions(baseInstructions, provider, mode) {
  if (provider === 'gemini') {
    const modeName = mode === 'natural' ? '대사 유지 자연화' : mode === 'remove_narrator' ? '화자 개입 제거' : '대사 유지 정리';
    return `${baseInstructions}

JSON 블록 작업:
- 입력은 JSON 문자열 배열입니다.
- 배열 원소 개수와 순서를 반드시 유지합니다.
- 응답 blocks 배열 길이는 입력 배열 길이와 반드시 같아야 합니다.
- 각 원소는 서로 다른 서술 블록입니다.
- 블록을 합치거나 나누지 않습니다.
- 빈 블록도 삭제하지 않습니다.
- 새 대사를 만들지 않습니다.
- 대사 블록은 입력에 포함되지 않으며 결과 조합 시 원문 그대로 유지됩니다.
- 작업 모드: ${modeName}
- 응답은 반드시 JSON 객체 하나입니다.
- 형식: {"blocks":["정리된 서술 1","정리된 서술 2"]}`;
  }

  return `${baseInstructions}

추가 작업 형식:
- 입력은 JSON 배열입니다.
- 배열의 각 원소는 서로 다른 서술 블록입니다.
- 대사 블록은 입력에 포함되지 않습니다.
- 대사 블록은 API에 전송되지 않았으므로 새 대사를 만들지 않습니다.
- 결과 조합 시 대사는 원문 그대로 유지됩니다.
- 각 블록을 개별적으로 정리하되, 배열의 순서와 개수를 반드시 유지합니다.
- 입력 배열의 길이와 응답 blocks 배열의 길이는 반드시 같아야 합니다.
- 빈 문자열 또는 짧은 블록도 삭제하지 않습니다.
- 각 blocks 원소는 반드시 문자열이어야 합니다.
- 블록을 합치거나 나누거나 순서를 바꾸지 않습니다.
- preserve 모드에서는 각 블록의 주어와 정보량을 임의로 줄이지 않습니다.
- preserve 모드에서도 지칭 치환 규칙은 반드시 적용합니다. 첫 서술 블록의 PC 행동·위치 문장은 주어를 생략하지 않습니다.
- preserve 모드에서도 한 블록이 3문장 이상이면 가독성을 위해 블록 내부에 빈 줄을 넣습니다. 단, 문장 자체는 보수적으로 유지합니다.
- natural 모드에서는 각 블록 안에서 문단 호흡을 자연스럽게 조정할 수 있지만, 블록을 합치거나 나누어 응답 개수를 바꾸지 않습니다.
- natural 모드에서 한 블록이 3문장 이상이면 반드시 블록 내부에 빈 줄을 넣습니다. 문자열 안의 줄바꿈(\\n\\n)을 그대로 사용합니다.
- 응답은 반드시 아래 JSON 객체 하나만 출력합니다.
- 마크다운 코드블록, 설명문, 번호 매기기는 출력하지 않습니다.

응답 형식:
{"blocks":["정리된 서술 1","정리된 서술 2"]}`;
}

function buildRetryInstructions(instructions, findings) {
  return `${instructions}

재정리 요청:
- 이전 출력의 서술 영역에 제거 대상 화자체 또는 번역체가 남아 있습니다.
- 원문 정보는 유지하고, 아래 표현만 한국어 GM 지문형으로 정리해 다시 출력합니다.
- 대사 안 캐릭터 말투는 대사 처리 규칙과 옵션을 우선합니다.

검출된 표현:
${findings.map((item) => `- ${item}`).join('\n')}`;
}

// 전체 정리(cleanText) 경로에만 붙는 대사 처리 규칙. (서술만 경로에는 붙지 않는다)
function fullCleanDialogueRules(mode, provider) {
  if (provider === 'gemini') {
    return `전체 원문 처리:
- 입력은 서술과 대사가 섞인 전체 원문입니다.
- 서술과 대사를 모두 결과에 포함합니다.
- 서술은 한국어 GM 지문형으로 정리합니다.
- 서술 영역은 기본적으로 "~다", "~한다", "~했다" 체로 끝냅니다. 안내문처럼 "~습니다" 체로 끝내지 않습니다.
- 서술 영역은 따옴표 밖 지문을 뜻합니다. 따옴표 안 문장은 명백한 작가 안내문이 아닌 한 대사로 취급합니다.
- 나열 뒤에 "모두가 그런 것은 아니다", "아닐 수도 있다" 같은 유보가 붙으면, 나열 대상을 확정된 사실로 단정하지 않습니다.
- 따옴표 안 대사는 보수적으로 정리합니다.
- 대사의 의미, 말투, 캐릭터성, 호칭, 감정선, 정보량은 유지합니다.
- 명백한 오탈자, 조사 오류, 어색한 번역체 어미, 읽기 어려운 줄바꿈만 최소 수정합니다.
- 대사를 서술문으로 바꾸거나 원문에 없는 감정, 의도, 설정을 추가하지 않습니다.`;
  }

  let rules = `전체 원문 처리 규칙:
- 입력은 서술과 대사가 섞인 전체 원문입니다.
- 서술과 대사를 모두 결과에 포함합니다.
- 서술은 한국어 GM 지문형으로 정리합니다.
- 서술 영역은 기본적으로 "~다", "~한다", "~했다" 체로 끝냅니다. 안내문처럼 "~습니다" 체로 끝내지 않습니다.
- 서술 영역은 따옴표 밖 지문을 뜻합니다. 따옴표 안 문장은 명백한 작가 안내문이 아닌 한 대사로 취급합니다.
- 나열 뒤에 "모두가 그런 것은 아니다", "아닐 수도 있다" 같은 유보가 붙으면, 나열 대상을 확정된 사실로 단정하지 않습니다.
- 따옴표 안 대사는 보수적으로 정리합니다.
- 대사의 의미, 말투, 캐릭터성, 호칭, 감정선, 정보량은 유지합니다.
- 명백한 오탈자, 조사 오류, 어색한 번역체 어미, 읽기 어려운 줄바꿈만 최소한으로 수정합니다.
- 대사를 서술문으로 바꾸거나, 원문에 없는 감정·의도·설정을 추가하지 않습니다.
- 대사와 서술의 경계를 임의로 바꾸지 않습니다.

짧은 예시:
입력: 웬만한 범죄자는 단 한 번의 실수로도 감옥에 들어가기 일쑤죠.
출력: 웬만한 범죄자는 단 한 번의 실수로도 감옥에 들어가기 일쑤다.
입력: 아, 물론 동정하는 건 아니에요.
출력: 물론, 동정할 필요는 없다.
입력: 누군가에 의해 찢겨진 듯한 종이가 존재합니다.
출력: 누군가 찢은 듯한 종이가 있다.
입력: 그런 기류를 감지하고 친해지고 싶어 하는 걸까요?
출력: 그런 기류를 감지하고 가까워지려 하는 듯하다.
입력: 할아버지로 변장하거나, 아이로 변장하거나. 아니, 모두가 그 사람은 아니겠지만요.
출력: 할아버지나 아이로 변장한 사람도 있었을 수 있다. 다만 모두가 그 사람이라고 단정할 수는 없다.

실패 조건:
- 서술 영역에 "~요", "~죠", "~니까요", "~일까요?"가 남으면 실패입니다.
- "아, 물론" 같은 화자 추임새가 그대로 남으면 실패입니다.
- 원문에 없는 감정, 분위기어, 심리 해석이 추가되면 실패입니다.`;

  if (mode === 'natural') {
    rules += `

자연화 대사 제한:
- 자연화에서도 대사는 전체 문맥상 필요한 경우에만 가볍게 정리합니다.
- 대사를 더 세련되게 만들기 위해 캐릭터의 성격, 의도, 감정선을 새로 해석하지 않습니다.`;
  } else if (mode === 'remove_narrator') {
    rules += `

화자 개입 제거 대사 제한:
- NPC 대사처럼 명확한 문장은 임의로 바꾸지 않습니다.
- 따옴표 안에 있더라도 실제 NPC 대사가 아니라 작가의 안내문, 독자 호명, 메타 발화가 명확한 경우에는 GM 지문형으로 정리할 수 있습니다.`;
  }

  return rules;
}

function instructionWithTarget(base, { targetTerms, targetName = '당신', applyTargetToDialogue = false, allowOmitRepeatedTarget = true, provider = 'openai' } = {}) {
  const name = safeTargetName(targetName);
  const terms = parseTargetTerms(targetTerms);
  const listedTerms = terms.map((term) => `"${term}"`).join(', ');

  let block = `${base}

지칭 치환:
- 변환 대상: ${listedTerms}
- 변환 결과: ${name}
- 서술 영역의 변환 대상 지칭은 ${name} 기준으로 정리합니다.
- 대상 캐릭터의 행동, 위치, 선택이 명확한 경우에만 주어를 보완합니다.
- 배경 설명, NPC 행동, 일반 상황 설명에 ${name}을 잘못 추가하지 않습니다.
- 조사 이/가, 은/는, 을/를, 와/과, 으로/로는 자연스럽게 맞춥니다.
- 직업명, 세계관 용어, 고유명사의 일부는 억지로 바꾸지 않습니다.
- KPC는 기본 변환 대상에 포함하지 않습니다. 사용자가 변환 대상에 KPC를 직접 추가한 경우에만 적용합니다.`;

  if (!allowOmitRepeatedTarget) {
    block += `
- 필요한 지칭을 생략하지 않습니다.`;
  }

  block += applyTargetToDialogue
    ? `
- 대사 안 지칭 변경 옵션이 켜져 있으면 말투와 관계성을 해치지 않는 범위에서만 바꿉니다.`
    : `
- 대사 안 지칭 변경 옵션이 꺼져 있으면 대사 내부 지칭은 바꾸지 않습니다.`;

  return block;
}

function safeTargetName(value) {
  const name = String(value || '').trim();
  return name || '당신';
}

function parseTargetTerms(value) {
  const raw = Array.isArray(value)
    ? value
    : String(value || '').split(/[,，、/\n]+/);
  const seen = new Set();
  const terms = [];
  raw.forEach((item) => {
    const term = String(item || '').trim();
    if (!term || seen.has(term)) return;
    seen.add(term);
    terms.push(term);
  });
  return terms.length ? terms.sort((a, b) => b.length - a.length) : [...DEFAULT_TARGET_TERMS];
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function parseJsonObject(raw) {
  const text = String(raw || '').trim();
  if (!text) throw new Error('빈 JSON 응답입니다.');
  try {
    return JSON.parse(text);
  } catch {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start >= 0 && end > start) {
      return JSON.parse(text.slice(start, end + 1));
    }
    throw new Error('JSON 응답을 해석하지 못했습니다.');
  }
}

function lastMeaningfulChar(value) {
  const compact = String(value || '').trim().replace(/[\s'"“”‘’「」『』()[\]{}.,!?。？！…]/g, '');
  return compact ? compact[compact.length - 1] : '';
}

function hasFinalConsonant(value) {
  const char = lastMeaningfulChar(value);
  if (!char) return false;
  const code = char.charCodeAt(0);
  if (code >= 0xac00 && code <= 0xd7a3) {
    return ((code - 0xac00) % 28) !== 0;
  }
  return false;
}

function chooseJosa(name, pair) {
  const final = hasFinalConsonant(name);
  const table = {
    '이/가': final ? '이' : '가',
    '은/는': final ? '은' : '는',
    '을/를': final ? '을' : '를',
    '와/과': final ? '과' : '와',
    '으로/로': final ? '으로' : '로'
  };
  return table[pair] || '';
}

function normalizeTargetParticle(targetName, particle = '') {
  const name = safeTargetName(targetName);
  switch (particle) {
    case '이':
    case '가':
      return name + chooseJosa(name, '이/가');
    case '은':
    case '는':
      return name + chooseJosa(name, '은/는');
    case '을':
    case '를':
      return name + chooseJosa(name, '을/를');
    case '와':
    case '과':
      return name + chooseJosa(name, '와/과');
    case '으로':
    case '로':
      return name + chooseJosa(name, '으로/로');
    case '':
    case undefined:
    case null:
      return name;
    default:
      return name + particle;
  }
}

function replaceMetaTargetWords(segment, targetTerms, targetName) {
  const name = safeTargetName(targetName);
  const terms = parseTargetTerms(targetTerms);
  const particle = '에게서|에게|께서|께|으로|로|와|과|은|는|이|가|을|를|의|도|만|또한|조차|까지|부터|처럼|마다|보다';
  const pattern = terms.map(escapeRegExp).join('|');
  let result = String(segment || '');
  result = result.replace(new RegExp(`(^|[^A-Za-z가-힣])(${pattern})(${particle})?(?=$|[^A-Za-z가-힣])`, 'g'), (_, prefix = '', _term, p = '') => `${prefix}${normalizeTargetParticle(name, p)}`);
  return result;
}

function applyOutsideDialogueOnly(text, targetTerms, targetName, applyToDialogue = false) {
  const source = String(text || '');
  if (applyToDialogue) return replaceMetaTargetWords(source, targetTerms, targetName);

  const pairs = { '"': '"', '“': '”', '「': '」', '『': '』' };
  const openers = new Set(Object.keys(pairs));
  let output = '';
  let buffer = '';
  let closeQuote = null;

  const flushNarration = () => {
    if (buffer) {
      output += replaceMetaTargetWords(buffer, targetTerms, targetName);
      buffer = '';
    }
  };

  const flushDialogue = () => {
    if (buffer) {
      output += buffer;
      buffer = '';
    }
  };

  for (const ch of source) {
    if (closeQuote) {
      buffer += ch;
      if (ch === closeQuote) {
        flushDialogue();
        closeQuote = null;
      }
      continue;
    }
    if (openers.has(ch)) {
      flushNarration();
      closeQuote = pairs[ch];
      buffer += ch;
      continue;
    }
    buffer += ch;
  }

  if (closeQuote) flushDialogue();
  else flushNarration();
  return output;
}

function narrationOnlyText(text) {
  const source = String(text || '');
  const pairs = { '"': '"', '“': '”', '「': '」', '『': '』' };
  const openers = new Set(Object.keys(pairs));
  let output = '';
  let closeQuote = null;

  for (const ch of source) {
    if (closeQuote) {
      if (ch === closeQuote) closeQuote = null;
      continue;
    }
    if (openers.has(ch)) {
      closeQuote = pairs[ch];
      continue;
    }
    output += ch;
  }

  return output;
}

function detectNarrationPolicyIssues(text) {
  const narration = narrationOnlyText(text);
  const checks = [
    ['~요', /(?:해|되|돼|어|아|예|이에|있어|없어|봐|가|와|나|군|네|까)요(?:[.!?。！？]|$)/],
    ['~죠', /죠(?:[.!?。！？]|$)/],
    ['~군요', /군요(?:[.!?。！？]|$)/],
    ['~네요', /네요(?:[.!?。！？]|$)/],
    ['~일까요?', /일까요\??/],
    ['~겠죠?', /겠죠\??/],
    ['~아니에요', /아니에요(?:[.!?。！？]|$)/],
    ['~니까요', /니까요(?:[.!?。！？]|$)/],
    ['~습니다체', /(습니다|합니다|됩니다|있습니다|없습니다)(?:[.!?。！？]|$)/],
    ['아, 물론', /아,\s*물론/],
    ['그렇지 않나요?', /그렇지\s+않나요\??/],
    ['~존재합니다', /(종이|흔적|물건|문서|기록|메모|글씨|파일|사진|열쇠|문|창문|시체|사체|자국|얼룩|단서)(?:이|가|은|는)?\s*존재합니다(?:[.!?。！？]|$)/]
  ];

  return checks
    .filter(([, pattern]) => pattern.test(narration))
    .map(([label]) => label);
}

function unique(items) {
  return [...new Set(items.filter(Boolean))];
}

function splitKoreanSentences(text) {
  const source = String(text || '').replace(/\s+/g, ' ').trim();
  if (!source) return [];
  const pieces = source.match(/[^.!?。？！]+[.!?。？！]+(?:[”"』」])?|[^.!?。？！]+$/g) || [source];
  return pieces.map((item) => item.trim()).filter(Boolean);
}

function normalizeSpacing(text) {
  const source = String(text || '').trim();
  const paragraphs = source.split(/\n{2,}/).map((item) => item.trim()).filter(Boolean);
  if (paragraphs.length >= 3 && paragraphs.every((item) => splitKoreanSentences(item).length <= 1)) {
    const sentences = paragraphs.flatMap(splitKoreanSentences);
    if (sentences.length === paragraphs.length) {
      return groupSentencesForParagraphs(sentences);
    }
  }
  if (!source || source.includes('\n\n')) return source;
  const sentences = splitKoreanSentences(source);
  if (sentences.length < 3) return source;
  return groupSentencesForParagraphs(sentences);
}

function groupSentencesForParagraphs(sentences) {
  if (sentences.length < 3) return sentences.join(' ');
  if (sentences.length === 3) return `${sentences.slice(0, 2).join(' ')}\n\n${sentences[2]}`;
  if (sentences.length === 4) return `${sentences.slice(0, 2).join(' ')}\n\n${sentences.slice(2).join(' ')}`;
  return `${sentences.slice(0, 2).join(' ')}\n\n${sentences.slice(2, 4).join(' ')}\n\n${sentences.slice(4).join(' ')}`;
}

function stabilizeCleanedText(text, { mode = 'preserve', targetTerms, targetName = '당신', applyTargetToDialogue = false } = {}) {
  let result = String(text || '').trim();
  if (!result) return result;
  result = applyOutsideDialogueOnly(result, targetTerms, targetName, applyTargetToDialogue);
  if (mode === 'natural' || mode === 'preserve') {
    result = normalizeSpacing(result);
  }
  return result.trim();
}

module.exports = {
  EDIT_MODES,
  cleanText,
  cleanNarrationBlocks
};
