const openaiProvider = require('./providers/openaiProvider');
const geminiProvider = require('./providers/geminiProvider');
const mythosGlossary = require('./data/mythosGlossary');
const trpgTerms = require('./data/trpgTerms');
const cocBooks = require('./data/cocBooks');

const MYTHOS_GLOSSARY_TEXT = mythosGlossary.entries
  .filter((entry) => !entry.review)
  .map((entry) => `- ${entry.ja} / ${entry.en} -> ${entry.ko}`)
  .join('\n');

const MYTHOS_REVIEW_TEXT = mythosGlossary.entries
  .filter((entry) => entry.review)
  .map((entry) => `- ${entry.ja} / ${entry.en} -> ${entry.ko} (정발 명칭 확인 필요)`)
  .join('\n');

const TRPG_TERMS_TEXT = trpgTerms.entries
  .map((entry) => {
    const source = entry.aka ? `${entry.ja}(${entry.aka})` : entry.ja;
    const gloss = entry.gloss ? ` [${entry.gloss}]` : '';
    return `- ${source} -> ${entry.ko}${gloss}`;
  })
  .join('\n');

const TRPG_CONTEXT_TEXT = (trpgTerms.contextNotes || [])
  .map((note) => `- ${note.term}: ${note.rule}`)
  .join('\n');

// 일본어 시나리오에 등장할 수 있는(=일본어 약칭이 있는) 서적만 강제 대응표에 싣는다.
const COC_BOOKS_TEXT = cocBooks.entries
  .filter((entry) => entry.ja && Array.isArray(entry.aka) && entry.aka.length > 0)
  .map((entry) => {
    const aliases = entry.aka.join(' / ');
    const target = entry.ko
      ? `한국 정발 "${entry.ko}" + 일본 원제 "${entry.ja}" 둘 다 표기`
      : `한국 미정발 -> 일본어 "${entry.ja}" 그대로 표기`;
    return `- 약칭 ${aliases} -> ${target}`;
  })
  .join('\n');

const PROVIDERS = {
  openai: openaiProvider,
  gemini: geminiProvider
};

const PROVIDER_LABELS = {
  openai: 'OpenAI',
  gemini: 'Gemini'
};

const MODES = {
  faithful: {
    label: '원문 충실 번역',
    instruction:
      '원문의 정보 순서, 조건문, 단서 표현을 최대한 보존하고 의역을 최소화한다. 단, 일본어 문장 구조를 한국어에 기계적으로 베끼지 말고 명백한 직역투만 최소 정리한다.'
  },
  natural: {
    label: '자연스러운 한국어 번역',
    instruction:
      '한국어로 읽히는 정도의 어순 조정과 직역투 정리를 허용하되, 문맥교정기처럼 문단 호흡을 크게 재작성하지 않는다. 원문의 정보와 단서성을 누락하지 않는다. 단, 대사는 말투, 호칭, 뉘앙스를 보존하기 위해 직역에 조금 더 가깝게 번역한다.'
  },
  handout: {
    label: '단서/핸드아웃 보존 번역',
    instruction:
      '암호, 편지, 일기, 신문 기사, 조사 자료, 핸드아웃의 정보 순서, 문서 형식, 고유명사를 최대한 보존한다. 명백한 직역투와 조사 오류만 최소 정리한다.'
  },
  coc7: {
    label: 'CoC 7판 참고 메모 중심 번역',
    instruction:
      '번역문과 별도로 CoC 6판 표현을 적극적으로 감지해 CoC 7판 기준 참고 메모와 검토 필요 항목을 자세히 분리해 출력한다. 기능명, 특성치, 대항 판정, 강행 판정, 명백한 단서, 전투 관련 표현 테스트에 적합하다.'
  }
};

function getProvider(name) {
  return PROVIDERS[name] || PROVIDERS.openai;
}

function getProviderLabel(name) {
  return PROVIDER_LABELS[name] || PROVIDER_LABELS.openai;
}

async function listModels({ provider, apiKey }) {
  return getProvider(provider).listModels({ apiKey });
}

async function translate({
  provider,
  apiKey,
  model,
  mode,
  sourceText,
  contextMemo,
  useCocMemo,
  signal
}) {
  const localNotes = detectCocNotes(sourceText);
  const { instructions, input } = buildPromptParts({
    sourceText,
    contextMemo,
    mode,
    includeCocNotes: useCocMemo,
    localNotes
  });

  const result = await getProvider(provider).translate({
    apiKey,
    model,
    instructions,
    input,
    prompt: `${instructions}\n\n${input}`,
    signal
  });

  return { ...result, localNotes };
}

function buildPromptParts({ sourceText, contextMemo, mode, includeCocNotes, localNotes }) {
  const modeConfig = MODES[mode] || MODES.faithful;
  const noteInstruction = includeCocNotes
    ? 'CoC 6판 표현이 감지되면 CoC 7판 기준 참고 메모를 별도 섹션에 작성한다.'
    : 'CoC 7판 참고 메모는 꼭 필요한 경우에만 아주 간략히 작성한다.';

  const detectedNotes = [
    ...localNotes.referenceNotes.map((note) => `- ${note}`),
    ...localNotes.reviewNeeded.map((note) => `- [검토 필요] ${note}`),
    ...(localNotes.internalHints || []).map((note) => `- [내부 참고] ${note}`)
  ].join('\n');

  return {
    instructions: [
      '입력된 일본어 TRPG 시나리오 텍스트를 한국어로 번역한다.',
      '대상은 일본어 Call of Cthulhu 시나리오다.',
      '원문의 정보 구조, 문체, 조건문, 단서성, 호칭을 보존한다.',
      '원문에 없는 정보를 임의로 추가하지 않는다.',
      '한국어화 기준: 번역기는 초벌 번역 도구이므로 문맥교정기처럼 문장을 크게 윤문하지 않는다. 다만 일본어 어순과 문말을 한국어에 기계적으로 옮기지 않고, 한국어로 명백히 어색한 직역투만 최소한 정리한다.',
      '과한 피동, 과한 명사화, "~하는 것이 가능하다", "존재한다"식 직역 표현은 문맥에 맞는 한국어 표현으로 옮긴다. 단, 원문에 없는 감정, 분위기, 단서, 설정, NPC 의도는 추가하지 않는다.',
      '서술문은 한국어 TRPG GM 지문으로 읽을 수 있을 정도까지만 정리한다. 낭독용으로 더 자연스럽게 다듬는 작업은 문맥교정기에서 처리할 수 있으므로, 번역 단계에서는 정보 보존을 우선한다.',
      '입력의 모든 일본어 문장과 대사는 한 줄도 빠짐없이 한국어로 번역한다. 위에서 "그대로 유지"로 명시한 항목(KPC, HO 라벨, 한국 미정발 일본어 서적명, 치환 변수의 라벨·숫자 등)만 예외이며, 그 외에는 일본어 원문을 번역하지 않은 채 그대로 남기지 않는다. 「」, 『』, " " 안의 대사도 반드시 한국어로 번역한다.',
      '각 줄은 최종 한국어 번역 한 가지만 출력한다. 번역 과정, 자기 점검, 수정 설명, 사과문, "원문 -> 번역" 같은 대조 표기, 같은 문장의 반복을 절대 출력하지 않는다. 어떤 줄을 어떻게 번역할지 고민이 되더라도 그 고민 과정을 적지 말고 결과 한 줄만 남긴다.',
      '아래 대응표의 강제 적용은 KPC(항상 KPC로 유지), 探索者(항상 탐사자) 등 모든 항목에 동일하게 적용된다.',
      'HO 뒤에 숫자가 붙은 HO1, HO2, HO3 등은 은닉(秘匿) 시나리오에서 각 플레이어/탐사자에게 배정된 개별 핸드아웃이자, 그 핸드아웃을 받은 플레이어/탐사자 본인을 가리키는 호칭으로도 쓰인다. HO1, HO2 같은 라벨은 그대로 유지하고 임의로 풀어쓰거나 번역하지 않는다.',
      '중괄호 { }, 대괄호 [ ], 부등호 < >로 감싼 치환 변수·플레이스홀더(예: {KPC三人称}, {KPC一人称}, {探索者名}, {PC1の名前}) 안에 일본어가 들어 있으면, 괄호와 변수 구조는 그대로 두고 안쪽의 일본어만 한국어로 번역한다. KPC, PC, HO처럼 강제로 유지하는 라벨·숫자는 번역하지 않고 그대로 둔다. 예: {KPC三人称} -> {KPC 삼인칭}, {KPC一人称} -> {KPC 일인칭}, {KPC二人称} -> {KPC 이인칭}, {探索者名} -> {탐사자 이름}, {PC1の名前} -> {PC1의 이름}. 변수를 삭제하거나 괄호 밖으로 풀어쓰지 않고, 괄호 개수와 위치도 원문 그대로 유지한다.',
      '대응표 용어(KPC, 探索者 등 포함)가 원문에 등장하지 않으면, 그 용어가 없다는 확인 메모를 출력하지 않는다.',
      '대사는 자연스럽게 다듬더라도 말투, 호칭, 관계성이 바뀌지 않도록 직역에 조금 더 가깝게 번역한다.',
      '아래 "TRPG 진행/세션 용어 대응표"를 강제 적용한다. 원문에 해당 용어나 약어가 나오면 표의 한국어 표기로 번역한다(KPC는 그대로 유지). 대괄호 안 보충 설명이 있는 생소한 용어(예: 반텍스트 세션)는 처음 등장할 때 한 번만 괄호로 짧게 보충 설명을 달 수 있다.',
      '아래 "문맥 의존 번역 규칙"의 용어(継続, 継続不可, 継続可能 등)는 단일 표기로 못 박지 말고, 규칙에 따라 문맥(시나리오 참가 조건 vs 엔딩·후유증·로스트 설명)을 보고 번역을 고른다. 특히 継続을 무조건 "계속"으로 직역하지 않는다.',
      '위의 모든 대응표·규칙(신화 명칭, TRPG 진행/세션 용어, CoC 서적, 문맥 의존 번역 규칙)은 번역의 최우선 기준이다. 모델 자체 지식이나 일반적인 번역 관습, 모드 지시와 충돌할 경우 항상 이 대응표·규칙을 우선 적용한다.',
      '아래 "신화 명칭 대응표"를 강제 적용한다. 원문에 표의 일본어/영어 표기 또는 그에 해당하는 크툴루 신화의 생물·신격이 나오면, 임의로 음역하지 말고 반드시 표의 한국어 공식 표기로 번역한다.',
      '아래 "신화 명칭 임시 대응표"는 deep-research-report.md 또는 사용자 제공 목록에서 한국어 정발명 공개 검증 미상으로 분류된 항목이다. 원문에 나오면 임의 음역하지 말고 우선 표의 한국어 임시 표기로 번역하되, 반드시 [검토 필요] 섹션에 "정발 명칭 확인 필요"를 짧게 표시한다.',
      '두 표 모두에 없는 신화 생물·신격 명칭은 음역하되, [검토 필요] 섹션에 "정발 명칭 확인 필요"로 짧게 표시한다.',
      '아래 "CoC 서적 대응표"를 강제 적용한다. 원문에 표의 서적 약칭(예: マレモン, ルルブ, 怪物図鑑)이 나오면 임의로 줄여 쓰지 말고 정식 서적명으로 펼쳐 표기한다.',
      '서적이 한국 정발본이 없으면(표에 "한국 미정발"로 표시) 일본어 서적명을 그대로 출력한다. 한국어로 번역하거나 음역하지 않는다. 예: クトゥルフ2015 -> クトゥルフ2015.',
      '서적이 한국 정발본과 일본 원제를 둘 다 가지면, 한국 정발명과 일본 원제를 함께 표기한다. 예: マレモン -> 말레우스 몬스트로룸(マレウス・モンストロルム).',
      '서적과 함께 적힌 페이지 표기(예: p.212, p212-213)는 원문이 가리키는 판(일본판)의 페이지이므로 한국판 기준으로 바꾸지 말고 그대로 둔다.',
      '고유명사·용어·서적명·신화 명칭의 원문 병기(원문 또는 한일 병기)는 같은 표기가 번역문에 처음 등장할 때 딱 한 번만 한다. 예: 첫 등장 푸른 파일(ブルーファイル), 이후에는 괄호 없이 푸른 파일로만 쓴다. 인물명·시설명·시나리오 용어 등 모든 고유명사/용어에 동일하게 적용하고, 같은 용어가 여러 번 나와도 두 번째부터는 한국어 표기만 사용한다.',
      '보조 메모에 일본어 이름과 한국어 표기/독음이 제시되면, 그 표기가 원문에서 고유명사/인물명으로 쓰인 문맥일 때만 해당 독음을 우선 적용한다.',
      '보조 메모에 있는 한자라도 일반 명사, 묘사어, 사물명, 관용 표현으로 쓰인 문맥이면 독음을 적용하지 말고 의미를 번역한다.',
      '한 글자 이름은 조사, 호칭, 행동 주체, 다른 인물명과의 병렬, 인물 관계 문맥 등으로 고유명사임이 자연스러울 때만 이름 독음을 적용한다.',
      '보조 메모의 전체 이름 중 원문에 성 또는 이름 일부만 등장하고 그 일부가 인물명 문맥이면, 전체 이름으로 확장하지 말고 해당 부분의 한국어 표기/독음만 적용한다.',
      '예: 보조 메모에 灯 春乃（토모리 하루노）가 있고 원문에 인물명으로 灯만 등장하면 토모리로 번역한다. 원문에 灯 春乃 전체가 등장할 때만 토모리 하루노로 번역한다. 그러나 灯がともる처럼 일반어로 쓰이면 불빛이 켜지다 등 의미로 번역한다.',
      '고유명사의 병기는 원문에 실제로 등장한 표기 단위를 기준으로 한다. 필요 시 토모리(灯)처럼 병기하되, 원문에 없는 春乃/하루노를 임의로 붙이지 않는다.',
      '고유명사인지 일반어인지 애매하면 번역문에서는 원문 표기를 병기하고, 고유명사/호칭 메모 또는 검토 필요에 짧게 표시한다.',
      '고유명사/호칭 메모에는 실제 원문에 등장하고 번역 판단이 필요한 항목만 적는다.',
      '본문에 없거나 등장하지 않은 용어에 대한 메모는 쓰지 않는다.',
      '불확실한 룰 변환은 확정하지 말고 검토 필요로 표시한다.',
      '로컬 감지 참고 항목 중 [내부 참고]는 번역 판단에만 사용하고 결과 섹션에는 출력하지 않는다.',
      noteInstruction,
      '마크다운 서식을 사용하지 않는다. 별표(**, *), 우물 정자(#), 인용(>) 같은 강조 기호로 섹션 머리말이나 본문을 감싸지 말고 일반 텍스트로만 출력한다.',
      '섹션 머리말은 정확히 [번역문], [CoC 7판 참고 메모], [검토 필요], [고유명사/호칭 메모] 형태로만 쓰고, 각 머리말은 한 줄에 단독으로 둔다. 머리말 글자에 일본어를 섞지 않는다(예: 메모를 メモ로 쓰지 않는다).',
      '반드시 다음 형식으로 출력한다:\n[번역문]\n...\n\n[CoC 7판 참고 메모]\n...\n\n[검토 필요]\n...\n\n[고유명사/호칭 메모]\n...'
    ].join('\n'),
    input: [
      `번역 모드: ${modeConfig.label}`,
      `모드 지시: ${modeConfig.instruction}`,
      contextMemo ? `추가 문맥 메모:\n${contextMemo}` : '추가 문맥 메모: 없음',
      `TRPG 진행/세션 용어 대응표 (강제 적용):\n${TRPG_TERMS_TEXT}`,
      TRPG_CONTEXT_TEXT ? `문맥 의존 번역 규칙 (문맥 보고 선택):\n${TRPG_CONTEXT_TEXT}` : '',
      `신화 명칭 대응표 (강제 적용, 한국 정발 기준):\n${MYTHOS_GLOSSARY_TEXT}`,
      MYTHOS_REVIEW_TEXT ? `신화 명칭 임시 대응표 (정발 명칭 확인 필요):\n${MYTHOS_REVIEW_TEXT}` : '',
      `CoC 서적 대응표 (강제 적용, 약칭 -> 정식 서적명):\n${COC_BOOKS_TEXT}`,
      detectedNotes ? `로컬 감지 참고 항목:\n${detectedNotes}` : '로컬 감지 참고 항목: 없음',
      `일본어 원문:\n${sourceText}`
    ].join('\n\n')
  };
}

function detectCocNotes(text) {
  const referenceNotes = [];
  const reviewNeeded = [];
  const internalHints = [];
  const addReference = (note) => {
    if (!referenceNotes.includes(note)) referenceNotes.push(note);
  };
  const addReview = (note) => {
    if (!reviewNeeded.includes(note)) reviewNeeded.push(note);
  };
  const addInternalHint = (note) => {
    if (!internalHints.includes(note)) internalHints.push(note);
  };

  const skillTerms = [
    ['目星', '目星 -> 관찰력'],
    ['聞き耳', '聞き耳 -> 듣기'],
    ['図書館', '図書館 -> 자료조사'],
    ['アイデア', 'アイデア -> 지능 판정'],
    ['幸運', '幸運 -> 행운'],
    ['心理学', '心理学 -> 심리학'],
    ['説得', '説得 -> 설득'],
    ['信用', '信用 -> 신용'],
    ['言いくるめ', '言いくるめ -> 말재주'],
    ['回避', '回避 -> 회피'],
    ['応急手当', '応急手当 -> 응급처치'],
    ['医学', '医学 -> 의학'],
    ['オカルト', 'オカルト -> 오컬트'],
    ['歴史', '歴史 -> 역사'],
    ['博物学', '博物学 -> 자연']
  ];

  for (const [term, note] of skillTerms) {
    if (text.includes(term)) {
      addReference(`기능명 참고 변환: ${note}`);
    }
  }

  if (/隠れる|忍び歩き/.test(text)) {
    addReview('隠れる/忍び歩き은 7판 기준 은밀행동 계열로 통합할지 확인이 필요합니다.');
  }

  if (/こぶし|パンチ|キック|頭突き|組み付き/.test(text)) {
    addReference('6판식 세부 전투 기능이 감지되었습니다. 7판에서는 근접전 계열로 통합 검토할 수 있습니다.');
    addReview('전투 기능, 피해량, 피해 보너스는 7판 기준으로 수동 확인이 필요합니다.');
  }

  if (/普通の成功|ハード成功|イクストリーム成功|困難な成功|極限の成功|クリティカル|ファンブル|大成功|大失敗/.test(text)) {
    addReference('판정 난이도 표현이 감지되었습니다. 7판 기준 보통 성공/어려운 성공/극단적 성공으로 구분할 수 있습니다.');
  }

  if (/ボーナス・ダイス|ボーナスダイス|ペナルティ・ダイス|ペナルティダイス|ボーナス|ペナルティ/.test(text)) {
    addReference('보너스/패널티 주사위 표현이 감지되었습니다. 7판에서는 십의 자리 주사위를 추가로 굴립니다.');
  }

  if (/プッシュ・ロール|プッシュロール|押し込みロール|再挑戦|もう一度判定/.test(text)) {
    addReference('강행 판정에 해당할 수 있는 표현이 감지되었습니다.');
    addReview('단순 재시도인지 7판 강행 판정인지 문맥 확인이 필요합니다.');
  }

  if (/幸運を消費|幸運ポイントを使う|幸運を使う|ラックを使う/.test(text)) {
    addReference('행운 소비 관련 표현이 감지되었습니다. 7판에서는 행운 소비로 주사위 결과를 조정할 수 있습니다.');
  }

  if (/重要な手がかり|必ず見つかる|探索者は気づく|判定なしで分かる|自動的に分かる|明らかな手がかり/.test(text)) {
    addReference('진행 필수 단서로 보이는 정보가 감지되었습니다. 명백한 단서 처리 가능성을 검토할 수 있습니다.');
  }

  if (/抵抗表|対抗ロール|対抗判定|STR対SIZ|POW対POW/.test(text)) {
    addReference('6판식 저항표 또는 대항 판정 표현이 감지되었습니다. 7판에서는 성공 수준 비교를 검토합니다.');
    addReview('대항 판정은 7판 성공 수준 비교 방식으로 재검토하세요.');
  }

  const statMatches = text.match(/\b(STR|CON|POW|DEX|APP|SIZ|INT|EDU)\s*(\d{1,2})\b/g);
  if (statMatches) {
    for (const match of statMatches) {
      const [, stat, value] = match.match(/\b(STR|CON|POW|DEX|APP|SIZ|INT|EDU)\s*(\d{1,2})\b/);
      addReference(`특성치 참고 변환: ${stat} ${value} -> ${Number(value) * 5}`);
    }
  }

  if (/\b(HP|MP)\s*\d+|ダメージボーナス|\bDB\b|ビルド|MOV|移動率/.test(text)) {
    addInternalHint('HP, MP, 피해 보너스, 체구, 이동력 같은 전투/수치 항목은 7판 기준으로 자동 변환하지 말고 원문 수치를 보존한다.');
  }

  // 단순 서사의 「狂気」에는 반응하지 않도록 규칙 맥락 표현만 감지한다.
  if (/一時的(?:な)?狂気|不定の狂気|不定狂気|狂気の発作|狂気点|SANチェック|SAN値|正気度|サニティ/.test(text)) {
    addReview('광기/이성치(SAN) 관련 규칙 표현이 감지되었습니다. 7판 기준 처리 방식을 확인하세요.');
  }

  if (/追跡(?:ルール|判定)/.test(text)) {
    addReview('추격 규칙 표현이 감지되었습니다. 7판 추격 규칙으로 재검토가 필요합니다.');
  }

  if (/呪文|スペル/.test(text)) {
    addReview('주문 관련 표현이 감지되었습니다. 7판 기준 주문 처리는 수동 확인이 필요합니다.');
  }

  return { referenceNotes, reviewNeeded, internalHints };
}

module.exports = {
  MODES,
  PROVIDER_LABELS,
  getProviderLabel,
  listModels,
  translate,
  detectCocNotes
};
