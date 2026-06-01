// 모델 목록은 기본값을 미리 채우지 않는다. 저장된 모델이 없으면 API 키 입력 + 새로고침
// 전까지 드롭다운을 비워 두고, 새로고침으로 불러온 모델만 표시한다.
const state = {
  settings: null,
  isRunning: false,
  isEditorRunning: false,
  activeTool: 'translator',
  currentRequestId: null,
  currentEditorRequestId: null,
  editorLastRun: null,
  contentFontDelta: 0,
  provider: 'openai',
  availableModels: {
    openai: [],
    gemini: []
  }
};

const recommendedModels = {
  openai: [
    { id: 'gpt-5.5', label: '추천: 품질 우선' },
    { id: 'gpt-5.4', label: '추천: 균형' },
    { id: 'gpt-5.2', label: '추천: 안정적 고품질' },
    { id: 'gpt-4.1', label: '추천: 비추론 빠른 번역' }
  ],
  gemini: [
    { id: 'gemini-2.5-flash', label: '추천: 무료 균형(품질/한도)' },
    { id: 'gemini-2.5-pro', label: '추천: 무료 품질 우선(한도 적음)' },
    { id: 'gemini-2.5-flash-lite', label: '추천: 무료 한도 넉넉' }
  ]
};

// 문맥 교정기용 추천 라벨(id -> 라벨). 번역기와 추천 모델은 같지만 문구만 교정 맥락으로 바꾼다.
// 여기에 없는 제공사/모델은 위의 번역기 라벨을 그대로 사용한다.
const editorRecommendedLabels = {
  openai: {
    'gpt-5.5': '추천: 교정 품질 우선',
    'gpt-5.4': '추천: 균형',
    'gpt-5.2': '추천: 안정적 고품질',
    'gpt-4.1': '추천: 빠른 교정(비추론)'
  }
};

const modelHints = {
  openai: 'OpenAI Platform에서 만든 API 키를 입력한 뒤 새로고침하면 사용 가능한 모델을 불러옵니다.',
  gemini: 'Google AI Studio에서 만든 API 키를 입력한 뒤 새로고침하면 generateContent 지원 모델을 불러옵니다.'
};

const modeHelp = {
  faithful: {
    title: '원문 충실 번역',
    text: '조건문, 단서, 판정문처럼 정보 순서가 중요한 문단에 적합합니다. 문장 구조와 원문 표기 단위를 최대한 보존합니다.'
  },
  natural: {
    title: '자연스러운 한국어 번역',
    text: '묘사문과 장면 서술처럼 읽는 흐름이 중요한 문단에 적합합니다. 단, 대사는 말투와 호칭을 살리기 위해 직역에 조금 더 가깝게 번역합니다.'
  },
  handout: {
    title: '단서/핸드아웃 보존 번역',
    text: '편지, 일기, 신문 기사, 조사 자료에 적합합니다. 고유명사와 특수 표현은 가능한 원문을 함께 남깁니다.'
  },
  coc7: {
    title: 'CoC 7판 참고 메모 중심 번역',
    text: '번역문보다 룰 메모 확인을 더 적극적으로 하는 모드입니다. 6판식 기능명, 특성치, 대항 판정, 강행 판정, 명백한 단서, 전투 표현을 테스트할 때 적합합니다.'
  }
};

const elements = {
  showTranslator: document.querySelector('#showTranslator'),
  showEditor: document.querySelector('#showEditor'),
  translatorTool: document.querySelector('#translatorTool'),
  editorTool: document.querySelector('#editorTool'),
  provider: document.querySelector('#provider'),
  apiKey: document.querySelector('#apiKey'),
  model: document.querySelector('#model'),
  refreshModels: document.querySelector('#refreshModels'),
  modelHint: document.querySelector('#modelHint'),
  charLimit: document.querySelector('#charLimit'),
  themeSelect: document.querySelector('#themeSelect'),
  fontSizeDown: document.querySelector('#fontSizeDown'),
  fontSizeUp: document.querySelector('#fontSizeUp'),
  fontSizeValue: document.querySelector('#fontSizeValue'),
  includeCocNotes: document.querySelector('#includeCocNotes'),
  settingsPanel: document.querySelector('#settingsPanel'),
  toggleSettings: document.querySelector('#toggleSettings'),
  saveSettings: document.querySelector('#saveSettings'),
  clearApiKeys: document.querySelector('#clearApiKeys'),
  saveStatus: document.querySelector('#saveStatus'),
  editorSaveStatus: document.querySelector('#editorSaveStatus'),
  openLogFolder: document.querySelector('#openLogFolder'),
  copyLogs: document.querySelector('#copyLogs'),
  clearLogs: document.querySelector('#clearLogs'),
  logStatus: document.querySelector('#logStatus'),
  checkUpdates: document.querySelector('#checkUpdates'),
  updateStatus: document.querySelector('#updateStatus'),
  modeHelpTitle: document.querySelector('#modeHelpTitle'),
  modeHelpText: document.querySelector('#modeHelpText'),
  sourceText: document.querySelector('#sourceText'),
  contextMemo: document.querySelector('#contextMemo'),
  charCounter: document.querySelector('#charCounter'),
  limitWarning: document.querySelector('#limitWarning'),
  translateBtn: document.querySelector('#translateBtn'),
  cancelBtn: document.querySelector('#cancelBtn'),
  clearBtn: document.querySelector('#clearBtn'),
  runStatus: document.querySelector('#runStatus'),
  copyAll: document.querySelector('#copyAll'),
  translation: document.querySelector('#translation'),
  cocNotes: document.querySelector('#cocNotes'),
  reviewItems: document.querySelector('#reviewItems'),
  nameNotes: document.querySelector('#nameNotes'),
  editorProvider: document.querySelector('#editorProvider'),
  editorApiKey: document.querySelector('#editorApiKey'),
  editorModel: document.querySelector('#editorModel'),
  editorRefreshModels: document.querySelector('#editorRefreshModels'),
  editorSaveSettings: document.querySelector('#editorSaveSettings'),
  editorClearApiKeys: document.querySelector('#editorClearApiKeys'),
  editorModelHint: document.querySelector('#editorModelHint'),
  editorTargetTerms: document.querySelector('#editorTargetTerms'),
  editorTargetName: document.querySelector('#editorTargetName'),
  editorTargetDialogue: document.querySelector('#editorTargetDialogue'),
  editorTargetOmit: document.querySelector('#editorTargetOmit'),
  editorApplyTarget: document.querySelector('#editorApplyTarget'),
  editorCancelBtn: document.querySelector('#editorCancelBtn'),
  editorLinebreak: document.querySelector('#editorLinebreak'),
  editorSendTranslation: document.querySelector('#editorSendTranslation'),
  editorStatus: document.querySelector('#editorStatus'),
  editorSourceText: document.querySelector('#editorSourceText'),
  editorOutputText: document.querySelector('#editorOutputText'),
  editorClearSource: document.querySelector('#editorClearSource'),
  editorCopyOutput: document.querySelector('#editorCopyOutput'),
  editorClearOutput: document.querySelector('#editorClearOutput'),
  editorCopyPreviewAll: document.querySelector('#editorCopyPreviewAll'),
  editorPreview: document.querySelector('#editorPreview'),
  editorPreviewCount: document.querySelector('#editorPreviewCount'),
  copyToast: document.querySelector('#copyToast'),
  copyToastText: document.querySelector('#copyToastText'),
  confirmModal: document.querySelector('#confirmModal'),
  confirmModalTitle: document.querySelector('#confirmModalTitle'),
  confirmModalMessage: document.querySelector('#confirmModalMessage'),
  confirmCancel: document.querySelector('#confirmCancel'),
  confirmOk: document.querySelector('#confirmOk'),
  openManual: document.querySelector('#openManual'),
  manualModal: document.querySelector('#manualModal'),
  closeManual: document.querySelector('#closeManual'),
  manualToc: document.querySelector('#manualToc'),
  manualContent: document.querySelector('#manualContent'),
  updateModal: document.querySelector('#updateModal'),
  updateModalBadge: document.querySelector('#updateModalBadge'),
  updateModalTitle: document.querySelector('#updateModalTitle'),
  closeUpdateModal: document.querySelector('#closeUpdateModal'),
  dismissUpdateModal: document.querySelector('#dismissUpdateModal'),
  openUpdateDownload: document.querySelector('#openUpdateDownload'),
  currentVersionText: document.querySelector('#currentVersionText'),
  latestVersionText: document.querySelector('#latestVersionText'),
  releaseDateText: document.querySelector('#releaseDateText'),
  updateGuideText: document.querySelector('#updateGuideText'),
  migrationMessageText: document.querySelector('#migrationMessageText'),
  updateNotesList: document.querySelector('#updateNotesList')
};

const resultTargets = ['translation', 'cocNotes', 'reviewItems', 'nameNotes'];

registerGlobalErrorHooks();
init();

// 렌더러(UI)에서 발생한 예외를 메인 프로세스 오류 로그로 전달한다.
function registerGlobalErrorHooks() {
  const report = (event, message, stack) => {
    try {
      window.translatorApp?.reportError?.({ event, message: String(message || ''), stack: String(stack || '') });
    } catch {
      // 오류 보고 실패는 무시한다.
    }
  };
  window.addEventListener('error', (e) => {
    report('renderer_error', e.message, e.error && e.error.stack);
  });
  window.addEventListener('unhandledrejection', (e) => {
    const reason = e.reason;
    report('renderer_unhandled_rejection', reason && reason.message ? reason.message : reason, reason && reason.stack);
  });
}

async function init() {
  state.settings = await window.translatorApp.getSettings();
  state.provider = state.settings.provider || 'openai';
  applySettingsToForm(state.settings);
  loadContentFontSize();
  loadEditorDraft();
  setSelectedMode(state.settings.defaultMode);
  updateCounter();
  bindEvents();
  scheduleAutomaticUpdateCheck();
}

function bindEvents() {
  elements.showTranslator.addEventListener('click', () => switchTool('translator'));
  elements.showEditor.addEventListener('click', () => switchTool('editor'));
  elements.saveSettings.addEventListener('click', saveSettings);
  if (elements.clearApiKeys) elements.clearApiKeys.addEventListener('click', clearSavedApiKeys);
  elements.refreshModels.addEventListener('click', refreshModels);
  elements.apiKey.addEventListener('input', updateCounter);
  elements.provider.addEventListener('change', onProviderChange);
  elements.model.addEventListener('change', updateCounter);
  elements.editorSaveSettings.addEventListener('click', saveSettings);
  if (elements.editorClearApiKeys) elements.editorClearApiKeys.addEventListener('click', clearSavedApiKeys);
  elements.editorRefreshModels.addEventListener('click', refreshModels);
  elements.editorApiKey.addEventListener('input', updateCounter);
  elements.editorProvider.addEventListener('change', onProviderChange);
  elements.editorModel.addEventListener('change', updateCounter);
  elements.themeSelect.addEventListener('change', saveTheme);
  elements.fontSizeDown.addEventListener('click', () => changeContentFontSize(-1));
  elements.fontSizeUp.addEventListener('click', () => changeContentFontSize(1));
  elements.toggleSettings.addEventListener('click', toggleSettingsPanel);
  elements.openLogFolder.addEventListener('click', openLogFolder);
  elements.copyLogs.addEventListener('click', copyLogs);
  elements.clearLogs.addEventListener('click', clearLogs);
  elements.checkUpdates.addEventListener('click', () => checkForUpdates({ manual: true }));
  elements.closeUpdateModal.addEventListener('click', hideUpdateModal);
  elements.dismissUpdateModal.addEventListener('click', hideUpdateModal);
  elements.openUpdateDownload.addEventListener('click', openUpdateDownload);
  elements.updateModal.addEventListener('click', (event) => {
    if (event.target === elements.updateModal) hideUpdateModal();
  });
  if (elements.openManual) elements.openManual.addEventListener('click', openManual);
  if (elements.closeManual) elements.closeManual.addEventListener('click', hideManual);
  if (elements.manualModal) {
    elements.manualModal.addEventListener('click', (event) => {
      if (event.target === elements.manualModal) hideManual();
    });
  }
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && elements.manualModal && !elements.manualModal.hidden) {
      hideManual();
    }
  });
  window.translatorApp?.onOpenManual?.(() => openManual());
  elements.sourceText.addEventListener('input', updateCounter);
  elements.translateBtn.addEventListener('click', runTranslation);
  elements.cancelBtn.addEventListener('click', cancelTranslation);
  elements.clearBtn.addEventListener('click', clearInput);
  elements.copyAll.addEventListener('click', copyAllResults);
  elements.editorApplyTarget.addEventListener('click', applyTargetLocal);
  elements.editorCancelBtn.addEventListener('click', cancelEditor);
  elements.editorLinebreak.addEventListener('click', applyLocalLinebreak);
  elements.editorSendTranslation.addEventListener('click', sendTranslationToEditor);
  elements.editorSourceText.addEventListener('input', saveEditorDraft);
  elements.editorTargetTerms.addEventListener('input', saveEditorDraft);
  elements.editorTargetName.addEventListener('input', saveEditorDraft);
  elements.editorTargetDialogue.addEventListener('change', saveEditorDraft);
  elements.editorTargetOmit.addEventListener('change', saveEditorDraft);
  document.querySelectorAll('input[name="editorEnhanceLevel"]').forEach((input) => {
    input.addEventListener('change', saveEditorDraft);
  });
  elements.editorOutputText.addEventListener('input', () => {
    renderEditorPreview();
    saveEditorDraft();
  });
  elements.editorClearSource.addEventListener('click', clearEditorSource);
  elements.editorClearOutput.addEventListener('click', clearEditorOutput);
  elements.editorCopyOutput.addEventListener('click', () => copyText(elements.editorOutputText.value, '출력문을 복사했습니다'));
  elements.editorCopyPreviewAll.addEventListener('click', () => copyText(previewPlainText(), '미리보기 전체를 복사했습니다'));
  bindConfirmModal();

  document.querySelectorAll('[data-editor-run]').forEach((button) => {
    button.addEventListener('click', () => runEditorAction(button.dataset.editorRun, button));
  });

  document.querySelectorAll('[data-editor-split-action]').forEach((button) => {
    button.addEventListener('click', () => splitEditorSource(button.dataset.editorSplitAction));
  });

  document.querySelectorAll('input[name="mode"]').forEach((input) => {
    input.addEventListener('change', () => updateModeHelp(input.value));
  });

  document.querySelectorAll('[data-copy-target]').forEach((button) => {
    button.addEventListener('click', () => copyText(elements[button.dataset.copyTarget].textContent, '복사되었습니다'));
  });

  bindCollapsibles();
  bindPreviewCardActions();
}

let pendingConfirm = null;

function bindConfirmModal() {
  if (!elements.confirmModal || !elements.confirmCancel || !elements.confirmOk) return;

  elements.confirmCancel.addEventListener('click', () => resolveConfirm(false));
  elements.confirmOk.addEventListener('click', () => resolveConfirm(true));
  elements.confirmModal.addEventListener('click', (event) => {
    if (event.target === elements.confirmModal) resolveConfirm(false);
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !elements.confirmModal.hidden) {
      resolveConfirm(false);
    }
  });
}

function confirmOverwrite(message, options = {}) {
  if (!elements.confirmModal || !elements.confirmModalMessage || !elements.confirmOk) {
    return Promise.resolve(confirm(message));
  }

  if (pendingConfirm) resolveConfirm(false);
  elements.confirmModalTitle.textContent = options.title || '출력문 바꾸기';
  elements.confirmModalMessage.textContent = message;
  elements.confirmOk.textContent = options.okText || '바꾸기';
  elements.confirmOk.classList.toggle('danger-btn', Boolean(options.danger));
  elements.confirmModal.hidden = false;
  elements.confirmOk.focus();

  return new Promise((resolve) => {
    pendingConfirm = resolve;
  });
}

function resolveConfirm(value) {
  if (!pendingConfirm) return;
  const resolve = pendingConfirm;
  pendingConfirm = null;
  elements.confirmModal.hidden = true;
  elements.confirmOk.textContent = '바꾸기';
  elements.confirmOk.classList.remove('danger-btn');
  if (elements.confirmModalTitle) elements.confirmModalTitle.textContent = '출력문 바꾸기';
  resolve(value);
}

// 접기 가능한 영역: 번역기 설정 레일(가로) + 교정기 그룹/도구 섹션(세로).
function bindCollapsibles() {
  // 접힌 설정 레일을 아무 곳이나 클릭해도 펼쳐진다.
  if (elements.settingsPanel) {
    elements.settingsPanel.addEventListener('click', (event) => {
      if (!elements.settingsPanel.classList.contains('collapsed')) return;
      if (event.target.closest('#toggleSettings')) return;
      toggleSettingsPanel();
    });
  }

  // 교정기 "API 연결" 그룹 + 도구 섹션 ①②③ 개별 접기.
  document.querySelectorAll('#editorApiToggle, .tool-section.collapse-group .tool-toggle').forEach((btn) => {
    btn.addEventListener('click', () => {
      const group = btn.id === 'editorApiToggle'
        ? document.querySelector('#editorApiGroup')
        : btn.closest('.collapse-group');
      if (!group) return;
      const collapsed = group.classList.toggle('collapsed');
      btn.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
    });
  });
}

function switchTool(tool) {
  stashActiveApiControls();
  state.activeTool = tool === 'editor' ? 'editor' : 'translator';
  applySettingsToForm(state.settings || collectSettingsFromForm());
  const isEditor = state.activeTool === 'editor';
  elements.translatorTool.classList.toggle('active', !isEditor);
  elements.editorTool.classList.toggle('active', isEditor);
  elements.showTranslator.classList.toggle('active', !isEditor);
  elements.showEditor.classList.toggle('active', isEditor);
  elements.showTranslator.setAttribute('aria-selected', String(!isEditor));
  elements.showEditor.setAttribute('aria-selected', String(isEditor));
  updateModelHint();
  updateCounter();
}

function stashActiveApiControls() {
  if (!state.settings) return;
  const controls = activeApiControls();
  const provider = controls.provider.value || state.provider;
  const apiKeys = { ...(state.settings.apiKeys || {}) };
  const modelByProvider = { ...(state.settings.modelByProvider || {}) };
  apiKeys[provider] = controls.apiKey.value;
  modelByProvider[provider] = controls.model.value;
  state.settings = { ...state.settings, provider, apiKeys, modelByProvider };
  state.provider = provider;
}

function activeApiControls() {
  if (state.activeTool === 'editor') {
    return {
      provider: elements.editorProvider,
      apiKey: elements.editorApiKey,
      model: elements.editorModel,
      refreshModels: elements.editorRefreshModels,
      modelHint: elements.editorModelHint
    };
  }

  return {
    provider: elements.provider,
    apiKey: elements.apiKey,
    model: elements.model,
    refreshModels: elements.refreshModels,
    modelHint: elements.modelHint
  };
}

function toggleSettingsPanel() {
  // 설정 패널을 세로 레일로 접는다. 컬럼 폭/화살표 회전은 CSS(.collapsed + :has())가 처리한다.
  const isCollapsed = elements.settingsPanel.classList.toggle('collapsed');
  elements.toggleSettings.title = isCollapsed ? '설정 열기' : '설정 접기';
  elements.toggleSettings.setAttribute('aria-expanded', String(!isCollapsed));
}

function applySettingsToForm(settings) {
  state.provider = settings.provider || 'openai';
  elements.provider.value = state.provider;
  elements.apiKey.value = settings.apiKeys?.[state.provider] || '';
  elements.editorProvider.value = state.provider;
  elements.editorApiKey.value = settings.apiKeys?.[state.provider] || '';
  renderModelOptions(currentModel(settings), {
    provider: elements.provider,
    apiKey: elements.apiKey,
    model: elements.model,
    refreshModels: elements.refreshModels,
    modelHint: elements.modelHint
  });
  renderModelOptions(currentModel(settings), {
    provider: elements.editorProvider,
    apiKey: elements.editorApiKey,
    model: elements.editorModel,
    refreshModels: elements.editorRefreshModels,
    modelHint: elements.editorModelHint
  });
  elements.charLimit.value = settings.charLimit || 3000;
  elements.themeSelect.value = settings.theme || 'lilac';
  applyTheme(elements.themeSelect.value);
  elements.includeCocNotes.checked = Boolean(settings.includeCocNotes);
  updateModelHint();
}

function currentModel(settings) {
  return settings?.modelByProvider?.[state.provider] || '';
}

function collectSettingsFromForm() {
  const base = state.settings || {};
  const controls = activeApiControls();
  const provider = controls.provider.value;
  const apiKeys = { ...(base.apiKeys || {}) };
  const modelByProvider = { ...(base.modelByProvider || {}) };
  apiKeys[provider] = controls.apiKey.value;
  modelByProvider[provider] = controls.model.value;

  return {
    provider,
    apiKeys,
    modelByProvider,
    charLimit: Number(elements.charLimit.value),
    defaultMode: getSelectedMode(),
    includeCocNotes: elements.includeCocNotes.checked,
    theme: elements.themeSelect.value
  };
}

function onProviderChange() {
  const previous = state.provider;
  const controls = activeApiControls();
  const next = controls.provider.value;

  // Stash the values currently shown into the provider we are leaving.
  const apiKeys = { ...(state.settings?.apiKeys || {}) };
  const modelByProvider = { ...(state.settings?.modelByProvider || {}) };
  apiKeys[previous] = controls.apiKey.value;
  modelByProvider[previous] = controls.model.value;

  state.settings = { ...state.settings, apiKeys, modelByProvider, provider: next };
  state.provider = next;

  controls.apiKey.value = apiKeys[next] || '';
  renderModelOptions(modelByProvider[next] || '', controls);
  syncApiControlsFromActive();
  updateModelHint();
  updateCounter();
}

function updateModelHint() {
  activeApiControls().modelHint.textContent = modelHints[state.provider] || modelHints.openai;
  const passiveHint = state.activeTool === 'editor' ? elements.modelHint : elements.editorModelHint;
  passiveHint.textContent = modelHints[state.provider] || modelHints.openai;
}

function syncApiControlsFromActive() {
  const source = activeApiControls();
  const targets = [
    {
      provider: elements.provider,
      apiKey: elements.apiKey,
      model: elements.model,
      refreshModels: elements.refreshModels,
      modelHint: elements.modelHint
    },
    {
      provider: elements.editorProvider,
      apiKey: elements.editorApiKey,
      model: elements.editorModel,
      refreshModels: elements.editorRefreshModels,
      modelHint: elements.editorModelHint
    }
  ];

  state.provider = source.provider.value || state.provider;
  for (const target of targets) {
    if (target === source) continue;
    target.provider.value = state.provider;
    target.apiKey.value = source.apiKey.value;
    renderModelOptions(source.model.value || currentModel(state.settings), target);
  }
}

async function saveTheme() {
  applyTheme(elements.themeSelect.value);

  try {
    state.settings = await window.translatorApp.saveSettings(collectSettingsFromForm());
    setStatus('테마 저장됨');
  } catch (error) {
    setStatus(error.message || '테마 저장 실패');
  }
}

function applyTheme(theme) {
  document.body.dataset.theme = ['lilac', 'sky', 'pink', 'green', 'dark'].includes(theme) ? theme : 'lilac';
}

async function refreshModels() {
  const controls = activeApiControls();
  const provider = controls.provider.value;
  const apiKey = controls.apiKey.value.trim();
  const previousModel = controls.model.value || currentModel(state.settings);

  controls.refreshModels.disabled = true;
  controls.modelHint.textContent = '모델 목록을 불러오는 중...';

  try {
    const models = await window.translatorApp.listModels(provider, apiKey);
    const fetchedIds = models.map((model) => model.id);
    // 이전에 선택/저장한 모델이 새로 받은 목록에 더는 없으면(단종 등) 재선택을 안내한다.
    const staleSelection = models.length > 0 && previousModel && !fetchedIds.includes(previousModel);

    if (models.length) {
      state.availableModels[provider] = models;
    }

    if (staleSelection) {
      if (state.settings?.modelByProvider) {
        state.settings.modelByProvider[provider] = '';
      }
      renderModelOptions('', controls);
      updateCounter();
      controls.modelHint.textContent = `이전에 선택한 모델 '${previousModel}'은(는) 현재 제공 목록에 없습니다. 모델을 다시 선택해주세요. (${state.availableModels[provider].length.toLocaleString('ko-KR')}개 불러옴)`;
    } else {
      renderModelOptions(controls.model.value || currentModel(state.settings), controls);
      updateCounter();
      controls.modelHint.textContent = `${state.availableModels[provider].length.toLocaleString('ko-KR')}개 모델을 불러왔습니다. 추천 모델은 위쪽에 표시됩니다.`;
    }
    syncApiControlsFromActive();
  } catch (error) {
    controls.modelHint.textContent = error.message || '모델 목록을 불러오지 못했습니다.';
  } finally {
    controls.refreshModels.disabled = false;
  }
}

function renderModelOptions(selectedModel, controls = activeApiControls()) {
  const provider = controls.provider.value || state.provider;
  const available = state.availableModels[provider] || [];
  // 저장/선택된 모델만 기준으로 삼는다. 없으면 기본 모델을 끼워넣지 않는다.
  const selected = selectedModel || currentModel(state.settings) || '';

  const merged = [];
  const seen = new Set();
  for (const model of [...(selected ? [{ id: selected, label: selected }] : []), ...available]) {
    if (model.id && !seen.has(model.id)) {
      seen.add(model.id);
      merged.push(model);
    }
  }

  controls.model.innerHTML = '';

  // 선택된 모델이 없으면 안내용 플레이스홀더를 표시한다.
  if (!selected) {
    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.disabled = true;
    placeholder.selected = true;
    placeholder.textContent = available.length
      ? '모델을 선택해주세요'
      : 'API 키를 입력하고 모델 새로고침을 누르세요';
    controls.model.append(placeholder);
  }

  // 교정기 드롭다운이면 추천 라벨 문구를 교정 맥락으로 바꿔 표시한다(추천 모델 목록 자체는 동일).
  const isEditor = controls.model === elements.editorModel;
  const editorLabels = isEditor ? (editorRecommendedLabels[provider] || {}) : null;
  const recommendedIds = new Set((recommendedModels[provider] || []).map((model) => model.id));
  const recommended = (recommendedModels[provider] || [])
    .filter((model) => seen.has(model.id))
    .map((model) => (editorLabels && editorLabels[model.id]
      ? { id: model.id, label: editorLabels[model.id] }
      : model));
  const others = merged.filter((model) => !recommendedIds.has(model.id));

  appendModelGroup('추천 모델', recommended, true, controls.model);
  appendModelGroup('사용 가능한 모델', others, false, controls.model);

  controls.model.value = selected || '';
}

function appendModelGroup(label, models, isRecommended, selectElement = elements.model) {
  if (!models.length) return;

  const header = document.createElement('option');
  header.value = '';
  header.disabled = true;
  header.className = 'model-group-option';
  header.textContent = `-- ${label} --`;
  selectElement.append(header);

  for (const model of models) {
    const option = document.createElement('option');
    const id = typeof model === 'string' ? model : model.id;
    option.value = id;
    option.className = isRecommended ? 'model-option recommended' : 'model-option';

    if (isRecommended) {
      option.textContent = `${id} (${model.label})`;
    } else {
      option.textContent = model.label && model.label !== id ? `${model.label} (${id})` : id;
    }

    selectElement.append(option);
  }
}

async function saveSettings() {
  setStatus('설정 저장 중...');
  try {
    state.settings = await window.translatorApp.saveSettings(collectSettingsFromForm());
    applySettingsToForm(state.settings);
    updateCounter();
    setStatus('설정 저장됨');
  } catch (error) {
    setStatus(error.message || '설정 저장 실패');
  }
}

async function clearSavedApiKeys() {
  const confirmed = await confirmOverwrite(
    '저장된 OpenAI/Gemini API 키를 삭제합니다.\n\nAPI 키는 발급 사이트에서 다시 전체 값을 확인할 수 없는 경우가 있습니다. 따로 보관하지 않았다면 새 API 키를 발급해야 할 수 있습니다.\n\n삭제 후에는 번역/교정 기능을 사용하려면 API 키를 다시 입력해야 합니다.',
    { title: 'API 키 삭제', okText: '삭제', danger: true }
  );
  if (!confirmed) return;

  setStatus('API 키 삭제 중...');
  try {
    stashActiveApiControls();
    const nextSettings = {
      ...(state.settings || collectSettingsFromForm()),
      apiKeys: {
        openai: '',
        gemini: ''
      }
    };
    elements.apiKey.value = '';
    elements.editorApiKey.value = '';
    state.settings = await window.translatorApp.saveSettings(nextSettings);
    applySettingsToForm(state.settings);
    updateCounter();
    setStatus('저장된 API 키 삭제됨');
  } catch (error) {
    setStatus(error.message || 'API 키 삭제 실패');
  }
}

function updateCounter() {
  const limit = Number(elements.charLimit.value || state.settings?.charLimit || 3000);
  const count = elements.sourceText.value.length;
  const isOverLimit = count > limit;
  const hasModel = Boolean(elements.model.value);
  const hasApiKey = Boolean(elements.apiKey.value.trim());
  elements.charCounter.textContent = `현재 글자수: ${count.toLocaleString('ko-KR')} / ${limit.toLocaleString('ko-KR')}`;
  elements.limitWarning.hidden = !isOverLimit;
  elements.translateBtn.disabled = isOverLimit || state.isRunning || !hasModel || !hasApiKey;
  elements.translateBtn.title = !hasApiKey
    ? '먼저 API 키를 입력하고 설정을 저장하세요.'
    : hasModel
      ? ''
      : '먼저 모델을 선택하세요 (API 키 입력 후 모델 새로고침).';
  updateEditorButtons();
}

async function runTranslation() {
  const settings = collectSettingsFromForm();
  const mode = getSelectedMode();
  const requestId = createRequestId();

  setRunning(true);
  state.currentRequestId = requestId;
  setRunStatus('번역 중...');
  clearResults();

  try {
    state.settings = await window.translatorApp.saveSettings(settings);
    const result = await window.translatorApp.translate({
      settings: state.settings,
      sourceText: elements.sourceText.value,
      contextMemo: elements.contextMemo.value,
      mode,
      requestId
    });
    if (result.cancelled) {
      setRunStatus('번역을 중지했습니다.');
      return;
    }

    const rendered = renderResult(result.content, result.localNotes);
    setRunStatus(rendered.hasUntranslatedJapanese
      ? '번역 완료 — 일부 문장이 일본어로 남아 있을 수 있습니다. 재번역을 권장합니다.'
      : '번역 완료');
  } catch (error) {
    setRunStatus(toPlainErrorMessage(error));
  } finally {
    state.currentRequestId = null;
    setRunning(false);
  }
}

async function cancelTranslation() {
  if (!state.currentRequestId) return;

  elements.cancelBtn.disabled = true;
  setRunStatus('번역 중지 중...');

  try {
    await window.translatorApp.cancelTranslation(state.currentRequestId);
  } catch {
    setRunStatus('번역 중지 요청에 실패했습니다.');
  }
}

function renderResult(content, localNotes) {
  const notes = localNotes || { referenceNotes: [], reviewNeeded: [] };
  const sections = parseSections(content);
  const translation = sections['번역문'] || content;
  elements.translation.textContent = translation;
  elements.cocNotes.textContent = mergeSectionWithLocal(
    sections['CoC 7판 참고 메모'],
    notes.referenceNotes
  );
  elements.reviewItems.textContent = mergeSectionWithLocal(sections['검토 필요'], notes.reviewNeeded);
  elements.nameNotes.textContent = cleanNameNotes(sections['고유명사/호칭 메모'] || '');
  return { hasUntranslatedJapanese: hasUntranslatedJapanese(translation) };
}

// 번역문에 일본어 가나(히라가나/가타카나)가 남아 있는지 검사한다.
// 원문 병기 괄호 안(예: 푸른 파일(ブルーファイル))은 정상이므로 괄호 구간을 먼저 제거하고 본다.
function hasUntranslatedJapanese(text) {
  const withoutParens = String(text || '')
    .replace(/（[^）]*）/g, '')
    .replace(/\([^)]*\)/g, '');
  return /[぀-ゟ゠-ヿ]/.test(withoutParens);
}

function parseSections(content) {
  const sections = {};
  // 마크다운 장식(**[번역문]**, ## [검토 필요]:)을 허용하고, 대괄호로 감싼 한 줄 머리말을 받는다.
  // 머리말 단어 일부가 일본어로 깨져도(예: 메모 -> メモ) 키워드로 분류한다.
  const headerRegex = /^[\s*#>_-]*\[\s*([^\]\n]+?)\s*\][\s*#:_-]*$/;
  const canonical = (raw) => {
    const name = raw.replace(/\s+/g, '');
    if (name.includes('번역문') || name === '번역') return '번역문';
    if (name.includes('검토')) return '검토 필요';
    if (name.includes('고유명사') || name.includes('호칭')) return '고유명사/호칭 메모';
    if (name.includes('CoC') || name.includes('7판') || name.includes('참고')) return 'CoC 7판 참고 메모';
    return null;
  };

  let currentKey = null;
  let buffer = [];
  const preamble = [];

  const flush = () => {
    if (currentKey) sections[currentKey] = buffer.join('\n').trim();
  };

  for (const line of content.split('\n')) {
    const match = line.match(headerRegex);
    const key = match ? canonical(match[1]) : null;

    if (key) {
      flush();
      currentKey = key;
      buffer = [];
    } else if (currentKey) {
      buffer.push(line);
    } else {
      preamble.push(line);
    }
  }
  flush();

  // If the model omitted the [번역문] header, treat the leading text as the translation.
  if (!sections['번역문'] && preamble.join('\n').trim()) {
    sections['번역문'] = preamble.join('\n').trim();
  }

  return sections;
}

function mergeSectionWithLocal(sectionText, localItems) {
  const hasLocalItems = Boolean(localItems?.length);
  const cleanedSection = hasLocalItems ? removeEmptyPlaceholderLines(sectionText) : sectionText;
  const localText = (localItems || []).map((item) => `- ${item}`).join('\n');
  return [cleanedSection, localText].filter(Boolean).join('\n');
}

function removeEmptyPlaceholderLines(text = '') {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !isEmptyPlaceholderLine(line))
    .join('\n');
}

function isEmptyPlaceholderLine(line) {
  return /^(없음|없습니다|해당 없음|특이사항 없음|없음\.)$/.test(line);
}

function cleanNameNotes(text) {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !/(KPC|探索者|탐사자).*(본문|원문).*(없음|없습니다|해당 없음|미등장)/.test(line))
    .filter((line) => !/(본문|원문).*(없음|없습니다|해당 없음|미등장).*(KPC|探索者|탐사자)/.test(line))
    .filter((line) => !isEmptyPlaceholderLine(line))
    .join('\n');
}

function getSelectedMode() {
  return document.querySelector('input[name="mode"]:checked')?.value || state.settings?.defaultMode || 'faithful';
}

function setSelectedMode(mode) {
  const target = document.querySelector(`input[name="mode"][value="${mode}"]`);
  if (target) target.checked = true;
  updateModeHelp(mode);
}

function updateModeHelp(mode) {
  const help = modeHelp[mode] || modeHelp.faithful;
  elements.modeHelpTitle.textContent = help.title;
  elements.modeHelpText.textContent = help.text;
}

function setRunning(isRunning) {
  state.isRunning = isRunning;
  elements.translateBtn.disabled = isRunning;
  elements.cancelBtn.disabled = !isRunning;
  elements.translateBtn.textContent = isRunning ? '번역 중...' : '번역 실행';
  updateCounter();
}

function createRequestId() {
  if (window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function toPlainErrorMessage(error) {
  const message = error?.message || '번역 요청 중 오류가 발생했습니다.';
  return message.replace(/^Error invoking remote method '[^']+': Error:\s*/, '');
}

function clearInput() {
  elements.sourceText.value = '';
  elements.contextMemo.value = '';
  clearResults();
  updateCounter();
  setRunStatus('');
}

function clearResults() {
  for (const key of resultTargets) {
    elements[key].textContent = '';
  }
}

function copyAllResults() {
  const text = [
    '[번역문]',
    elements.translation.textContent,
    '',
    '[CoC 7판 참고 메모]',
    elements.cocNotes.textContent,
    '',
    '[검토 필요]',
    elements.reviewItems.textContent,
    '',
    '[고유명사/호칭 메모]',
    elements.nameNotes.textContent
  ].join('\n');
  copyText(text.trim(), '전체 결과를 복사했습니다');
}

async function copyText(text, toastMessage) {
  if (!text) return;
  await navigator.clipboard.writeText(text);
  showToast(toastMessage || '복사되었습니다');
}

let toastTimer = null;
function showToast(message) {
  if (!elements.copyToast) return;
  if (elements.copyToastText) elements.copyToastText.textContent = message || '복사되었습니다';
  elements.copyToast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => elements.copyToast.classList.remove('show'), 1800);
}

let saveStatusTimer;
function setStatus(message) {
  // 번역기·교정기 양쪽 설정 제목 옆 칩을 함께 갱신한다. 화면은 한 번에 하나만 보이므로
  // 둘 다 갱신해도 보이는 쪽만 노출된다.
  const pills = [elements.saveStatus, elements.editorSaveStatus].filter(Boolean);
  if (!pills.length) return;
  for (const pill of pills) {
    pill.textContent = message;
    pill.hidden = false;
    // 재생성 트릭: 같은 메시지가 연속으로 와도 나타나는 애니메이션을 다시 재생한다.
    pill.style.animation = 'none';
    void pill.offsetWidth;
    pill.style.animation = '';
  }
  clearTimeout(saveStatusTimer);
  saveStatusTimer = setTimeout(() => {
    for (const pill of pills) pill.hidden = true;
  }, 2600);
}

function setLogStatus(message, isError = false) {
  if (!elements.logStatus) return;
  elements.logStatus.textContent = message;
  elements.logStatus.classList.toggle('is-error', Boolean(isError));
}

function setUpdateStatus(message, isError = false) {
  if (!elements.updateStatus) return;
  elements.updateStatus.textContent = message;
  elements.updateStatus.classList.toggle('is-error', Boolean(isError));
}

async function openLogFolder() {
  try {
    await window.translatorApp.openLogFolder();
    setLogStatus('로그 폴더를 열었습니다.');
  } catch (error) {
    setLogStatus(toPlainErrorMessage(error), true);
  }
}

async function copyLogs() {
  try {
    const result = await window.translatorApp.copyLogs();
    setLogStatus(result && result.copied ? '오류 로그를 클립보드에 복사했습니다.' : '복사할 오류 로그가 없습니다.');
  } catch (error) {
    setLogStatus(toPlainErrorMessage(error), true);
  }
}

async function clearLogs() {
  if (!confirm('오류 로그 파일을 모두 삭제할까요?')) return;
  try {
    await window.translatorApp.clearLogs();
    setLogStatus('오류 로그를 삭제했습니다.');
  } catch (error) {
    setLogStatus(toPlainErrorMessage(error), true);
  }
}

const UPDATE_CHECK_KEY = 'cst_last_update_check_at_v1';
const UPDATE_CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000;
let latestUpdateInfo = null;

function scheduleAutomaticUpdateCheck() {
  const lastChecked = Number(localStorage.getItem(UPDATE_CHECK_KEY) || '0');
  if (Number.isFinite(lastChecked) && Date.now() - lastChecked < UPDATE_CHECK_INTERVAL_MS) return;
  setTimeout(() => checkForUpdates({ manual: false }), 1200);
}

async function checkForUpdates({ manual = false } = {}) {
  if (manual) {
    elements.checkUpdates.disabled = true;
    setUpdateStatus('업데이트 정보를 확인하는 중...');
  }

  try {
    const result = await window.translatorApp.checkForUpdates({ silent: !manual });
    localStorage.setItem(UPDATE_CHECK_KEY, String(Date.now()));

    if (result?.failed) {
      if (manual) setUpdateStatus(result.message || '업데이트 확인에 실패했습니다.', true);
      return;
    }

    if (result?.available) {
      latestUpdateInfo = result;
      setUpdateStatus(`새 버전 ${result.latest.version}이 있습니다.`);
      showUpdateModal(result);
      return;
    }

    if (manual) {
      const current = result?.currentVersion || '-';
      setUpdateStatus(`현재 최신 버전입니다. (${current})`);
    }
  } catch (error) {
    if (manual) {
      setUpdateStatus(toPlainErrorMessage(error), true);
    }
  } finally {
    if (manual) elements.checkUpdates.disabled = false;
  }
}

function showUpdateModal(info) {
  const latest = info.latest || {};
  elements.updateModalBadge.textContent = latest.required ? '중요 업데이트' : '업데이트';
  elements.updateModalTitle.textContent = latest.required ? '중요 업데이트가 있습니다' : '새 버전이 있습니다';
  elements.currentVersionText.textContent = info.currentVersion || '-';
  elements.latestVersionText.textContent = latest.version || '-';
  elements.releaseDateText.textContent = latest.releaseDate || '-';

  const isInstaller = latest.packageType === 'installer';
  elements.updateGuideText.textContent = isInstaller
    ? '새 설치형 버전이 있습니다. 설치 완료 후 기존 무설치 exe는 삭제해도 됩니다. API 키와 사용자 설정은 유지됩니다.'
    : '새 버전을 다운로드한 뒤, 현재 실행 중인 프로그램을 종료하고 기존 exe를 새 exe로 교체해 주세요. API 키와 사용자 설정은 유지됩니다.';

  elements.migrationMessageText.hidden = !latest.migrationMessage;
  elements.migrationMessageText.textContent = latest.migrationMessage || '';

  elements.updateNotesList.innerHTML = '';
  const notes = Array.isArray(latest.notes) && latest.notes.length ? latest.notes : ['변경점 정보가 없습니다.'];
  notes.forEach((note) => {
    const item = document.createElement('li');
    item.textContent = note;
    elements.updateNotesList.append(item);
  });

  elements.openUpdateDownload.disabled = !latest.downloadUrl;
  elements.updateModal.hidden = false;
}

function hideUpdateModal() {
  elements.updateModal.hidden = true;
}

let manualBuilt = false;
let manualSections = [];
let currentManualIndex = 0;

function buildManual() {
  if (manualBuilt || !elements.manualToc || !elements.manualContent) return;
  manualSections = Array.isArray(window.CST_MANUAL) ? window.CST_MANUAL : [];
  elements.manualToc.innerHTML = '';
  elements.manualContent.innerHTML = '';

  manualSections.forEach((section, index) => {
    const tocButton = document.createElement('button');
    tocButton.type = 'button';
    tocButton.textContent = section.title;
    tocButton.dataset.target = section.id;
    tocButton.addEventListener('click', () => showManualSection(index));
    elements.manualToc.append(tocButton);

    const article = document.createElement('section');
    article.className = 'manual-page';
    article.dataset.section = section.id;
    article.innerHTML = `<h3>${section.title}</h3>${section.html}`;
    elements.manualContent.append(article);
  });

  // 페이지 이동(이전/다음) 푸터
  const nav = document.createElement('div');
  nav.className = 'manual-nav';
  nav.innerHTML =
    '<button type="button" id="manualPrev" class="secondary-btn small">← 이전</button>' +
    '<span id="manualNavLabel"></span>' +
    '<button type="button" id="manualNext" class="secondary-btn small">다음 →</button>';
  elements.manualContent.append(nav);
  nav.querySelector('#manualPrev').addEventListener('click', () => showManualSection(currentManualIndex - 1));
  nav.querySelector('#manualNext').addEventListener('click', () => showManualSection(currentManualIndex + 1));

  manualBuilt = true;
}

function showManualSection(index) {
  if (!elements.manualContent || !manualSections.length) return;
  const clamped = Math.max(0, Math.min(index, manualSections.length - 1));
  currentManualIndex = clamped;
  const activeId = manualSections[clamped].id;

  elements.manualContent.querySelectorAll('.manual-page').forEach((page) => {
    const isActive = page.dataset.section === activeId;
    page.classList.toggle('is-active', isActive);
    page.hidden = !isActive;
  });
  elements.manualToc.querySelectorAll('button').forEach((button) => {
    const isActive = button.dataset.target === activeId;
    button.classList.toggle('active', isActive);
    button.setAttribute('aria-current', isActive ? 'page' : 'false');
  });

  const prev = elements.manualContent.querySelector('#manualPrev');
  const next = elements.manualContent.querySelector('#manualNext');
  const label = elements.manualContent.querySelector('#manualNavLabel');
  if (prev) prev.disabled = clamped === 0;
  if (next) next.disabled = clamped === manualSections.length - 1;
  if (label) label.textContent = `${clamped + 1} / ${manualSections.length}`;

  // 페이지를 바꾸면 본문 맨 위로 올린다.
  elements.manualContent.scrollTop = 0;
  // 좁은 화면에서 클릭한 목차 항목이 보이도록 한다.
  const activeToc = elements.manualToc.querySelector('button.active');
  if (activeToc) activeToc.scrollIntoView({ block: 'nearest', inline: 'nearest' });
}

function openManual() {
  if (!elements.manualModal) return;
  buildManual();
  elements.manualModal.hidden = false;
  showManualSection(0);
  elements.closeManual?.focus();
}

function hideManual() {
  if (elements.manualModal) elements.manualModal.hidden = true;
}

async function openUpdateDownload() {
  const url = latestUpdateInfo?.latest?.downloadUrl;
  if (!url) return;
  try {
    await window.translatorApp.openUpdateDownload(url);
    hideUpdateModal();
  } catch (error) {
    setUpdateStatus(toPlainErrorMessage(error), true);
  }
}

function setRunStatus(message) {
  elements.runStatus.textContent = message;
}

const EDITOR_DRAFT_KEY = 'cst_context_editor_draft_v1';
const CONTENT_FONT_KEY = 'cst_content_font_delta_v1';

function loadEditorDraft() {
  try {
    const draft = JSON.parse(localStorage.getItem(EDITOR_DRAFT_KEY) || '{}');
    elements.editorSourceText.value = draft.sourceText || '';
    elements.editorOutputText.value = draft.outputText || '';
    elements.editorTargetTerms.value = draft.targetTerms || '탐사자님, 탐사자, PC, 플레이어';
    elements.editorTargetName.value = draft.targetName || '당신';
    elements.editorTargetDialogue.checked = Boolean(draft.targetDialogue);
    elements.editorTargetOmit.checked = draft.targetOmit === undefined ? true : Boolean(draft.targetOmit);
    setEditorEnhanceLevel(draft.enhanceLevel || (draft.enhanceNarration ? 'normal' : 'off'));
    renderEditorPreview();
  } catch {
    renderEditorPreview();
  }
}

function saveEditorDraft() {
  const draft = {
    sourceText: elements.editorSourceText.value,
    outputText: elements.editorOutputText.value,
    targetTerms: elements.editorTargetTerms.value,
    targetName: elements.editorTargetName.value,
    targetDialogue: elements.editorTargetDialogue.checked,
    targetOmit: elements.editorTargetOmit.checked,
    enhanceLevel: getEditorEnhanceLevel()
  };
  localStorage.setItem(EDITOR_DRAFT_KEY, JSON.stringify(draft));
}

function loadContentFontSize() {
  const stored = Number(localStorage.getItem(CONTENT_FONT_KEY));
  state.contentFontDelta = Number.isFinite(stored) ? Math.max(-5, Math.min(5, Math.trunc(stored))) : 0;
  applyContentFontSize();
}

function changeContentFontSize(delta) {
  state.contentFontDelta = Math.max(-5, Math.min(5, state.contentFontDelta + delta));
  localStorage.setItem(CONTENT_FONT_KEY, String(state.contentFontDelta));
  applyContentFontSize();
}

function applyContentFontSize() {
  document.documentElement.style.setProperty('--content-font-delta', `${state.contentFontDelta}pt`);
  elements.fontSizeValue.textContent = `${state.contentFontDelta > 0 ? '+' : ''}${state.contentFontDelta}pt`;
  elements.fontSizeDown.disabled = state.contentFontDelta <= -5;
  elements.fontSizeUp.disabled = state.contentFontDelta >= 5;
}

function setEditorStatus(message, isError = false) {
  elements.editorStatus.textContent = message || '';
  elements.editorStatus.classList.toggle('error', Boolean(isError));
}

function updateEditorButtons() {
  const hasModel = Boolean(elements.editorModel.value);
  const hasApiKey = Boolean(elements.editorApiKey.value.trim());
  document.querySelectorAll('[data-editor-run]').forEach((button) => {
    button.disabled = state.isEditorRunning || !hasModel || !hasApiKey;
    // 모델이 없으면 안내 문구, 있으면 버튼 설명 툴팁(data-tooltip)을 유지한다.
    button.title = !hasApiKey
      ? '먼저 API 키를 입력하고 설정을 저장하세요.'
      : hasModel
        ? (button.dataset.tooltip || '')
        : '먼저 모델을 선택하세요 (API 키 입력 후 모델 새로고침).';
  });
  elements.editorCancelBtn.disabled = !state.isEditorRunning;
}

function getEditorEnhanceLevel() {
  return document.querySelector('input[name="editorEnhanceLevel"]:checked')?.value || 'off';
}

function setEditorEnhanceLevel(value) {
  const allowed = ['off', 'normal', 'strong'];
  const selected = allowed.includes(value) ? value : 'off';
  const input = document.querySelector(`input[name="editorEnhanceLevel"][value="${selected}"]`);
  if (input) input.checked = true;
}

function getEditorTargetSettings() {
  return {
    targetTerms: parseTargetTerms(elements.editorTargetTerms.value),
    targetName: elements.editorTargetName.value.trim() || '당신',
    applyTargetToDialogue: elements.editorTargetDialogue.checked,
    allowOmitRepeatedTarget: elements.editorTargetOmit.checked
  };
}

function getEditorInput() {
  const output = elements.editorOutputText.value.trim();
  if (output) return { text: output, sourceName: '출력문' };
  const source = elements.editorSourceText.value.trim();
  if (source) return { text: source, sourceName: '교정 원문' };
  return { text: '', sourceName: '' };
}

async function setEditorOutput(text, statusMessage, options = {}) {
  if (!options.skipConfirm && elements.editorOutputText.value.trim() && !(await confirmOverwrite('현재 출력문을 새 결과로 바꿀까요?'))) {
    return false;
  }
  elements.editorOutputText.value = String(text || '').trim();
  renderEditorPreview();
  saveEditorDraft();
  setEditorStatus(statusMessage || '결과를 출력문에 반영했습니다.');
  return true;
}

async function runEditorAction(action, button) {
  if (action === 'dialogue_keep') {
    await cleanEditorNarration(button);
    return;
  }
  await cleanEditorText(action === 'remove_narrator' ? 'remove_narrator' : 'preserve', button);
}

async function cleanEditorText(mode, button) {
  const text = elements.editorSourceText.value.trim();
  if (!text) {
    setEditorStatus('교정 원문에 정리할 문장을 넣어 주세요.', true);
    return;
  }
  if (elements.editorOutputText.value.trim() && !(await confirmOverwrite('현재 출력문을 새 정리 결과로 바꿀까요?'))) return;

  const originalLabel = button.textContent;
  const requestId = createRequestId();
  state.currentEditorRequestId = requestId;
  state.isEditorRunning = true;
  updateEditorButtons();
  button.textContent = '정리 중...';
  setEditorStatus('문장을 정리하는 중...');

  try {
    state.settings = await window.translatorApp.saveSettings(collectSettingsFromForm());
    const result = await window.translatorApp.cleanText({
      requestId,
      settings: state.settings,
      mode,
      text,
      enhanceLevel: mode === 'preserve' ? getEditorEnhanceLevel() : 'off',
      ...getEditorTargetSettings()
    });
    if (result.cancelled) {
      setEditorStatus('교정을 중지했습니다.');
      return;
    }
    if (!String(result.text || '').trim()) {
      throw new Error('모델 응답에 출력할 결과가 없습니다. 입력을 나누어 다시 시도해 주세요.');
    }
    state.editorLastRun = { kind: 'clean', mode, enhanceLevel: mode === 'preserve' ? getEditorEnhanceLevel() : 'off' };
    // 전체 정리는 대사까지 손질한 정리문을 받는다. 미리보기가 서술/대사 블록으로 나뉘도록
    // 로컬에서 화자 인식 분리 후 라벨을 직접 붙인다(프롬프트가 아니라 결정론적 후처리).
    const { segments } = splitDialogueSegments(result.text, { detectSpeaker: true });
    const labeled = segments.length ? formatSplitResult(segments) : result.text;
    await setEditorOutput(labeled, '정리 결과를 출력문에 반영했습니다.', { skipConfirm: true });
  } catch (error) {
    setEditorStatus(toPlainErrorMessage(error), true);
  } finally {
    button.textContent = originalLabel;
    state.currentEditorRequestId = null;
    state.isEditorRunning = false;
    updateEditorButtons();
  }
}

async function cleanEditorNarration(button) {
  const enhanceLevel = getEditorEnhanceLevel();
  const mode = enhanceLevel === 'off' ? 'preserve' : 'natural';
  const text = elements.editorSourceText.value.trim();
  if (!text) {
    setEditorStatus('교정 원문에 정리할 문장을 넣어 주세요.', true);
    return;
  }
  if (elements.editorOutputText.value.trim() && !(await confirmOverwrite('현재 출력문을 새 결과로 바꿀까요?'))) return;

  const { segments, unclosedQuote } = splitDialogueSegments(text, { detectSpeaker: true });
  const narrationSegments = segments.filter((segment) => segment.type === 'narration' && segment.text.trim());
  if (!narrationSegments.length) {
    await setEditorOutput(formatSplitResult(segments), '정리할 서술이 없어 대사만 분리했습니다.', { skipConfirm: true });
    return;
  }

  const originalLabel = button.textContent;
  const requestId = createRequestId();
  state.currentEditorRequestId = requestId;
  state.isEditorRunning = true;
  updateEditorButtons();
  button.textContent = '정리 중...';
  setEditorStatus(`대사는 보존하고 서술 ${narrationSegments.length}개를 정리하는 중...`);

  try {
    state.settings = await window.translatorApp.saveSettings(collectSettingsFromForm());
    const result = await window.translatorApp.cleanNarrationBlocks({
      requestId,
      settings: state.settings,
      mode,
      enhanceLevel,
      blocks: narrationSegments.map((segment) => segment.text),
      ...getEditorTargetSettings()
    });
    if (result.cancelled) {
      setEditorStatus('교정을 중지했습니다.');
      return;
    }

    let narrationIndex = 0;
    const cleanedSegments = segments.map((segment) => {
      if (segment.type === 'dialogue') return { ...segment };
      return { type: 'narration', text: result.blocks[narrationIndex++] || segment.text };
    });

    state.editorLastRun = { kind: 'narration', mode, enhanceLevel };
    await setEditorOutput(
      formatSplitResult(cleanedSegments),
      unclosedQuote ? '서술을 정리했습니다. 닫히지 않은 따옴표가 있습니다.' : '대사는 보존하고 서술만 정리했습니다.',
      { skipConfirm: true }
    );
  } catch (error) {
    setEditorStatus(toPlainErrorMessage(error), true);
  } finally {
    button.textContent = originalLabel;
    state.currentEditorRequestId = null;
    state.isEditorRunning = false;
    updateEditorButtons();
  }
}

async function cancelEditor() {
  if (!state.currentEditorRequestId) return;
  elements.editorCancelBtn.disabled = true;
  setEditorStatus('교정 중지 중...');
  try {
    await window.translatorApp.cancelEditor(state.currentEditorRequestId);
  } catch {
    setEditorStatus('교정 중지 요청에 실패했습니다.', true);
  }
}

function clearEditorSource() {
  elements.editorSourceText.value = '';
  saveEditorDraft();
  setEditorStatus('교정 원문을 비웠습니다.');
}

function clearEditorOutput() {
  elements.editorOutputText.value = '';
  renderEditorPreview();
  saveEditorDraft();
  setEditorStatus('출력문을 비웠습니다.');
}

function sendTranslationToEditor() {
  const text = elements.translation.textContent.trim();
  if (!text) {
    setEditorStatus('가져올 번역문이 없습니다.', true);
    return;
  }
  switchTool('editor');
  elements.editorSourceText.value = text;
  saveEditorDraft();
  setEditorStatus('번역문을 교정 원문으로 가져왔습니다.');
}

function normalizeExtractedBlock(text) {
  return String(text || '')
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function stripWrappingDialogueQuote(text) {
  let cleaned = normalizeExtractedBlock(text);
  const pairs = [['"', '"'], ['“', '”'], ['「', '」'], ['『', '』']];
  for (const [open, close] of pairs) {
    if (cleaned.startsWith(open)) {
      cleaned = cleaned.endsWith(close) && cleaned.length > open.length + close.length
        ? cleaned.slice(open.length, -close.length)
        : cleaned.slice(open.length);
      break;
    }
  }
  return normalizeExtractedBlock(cleaned);
}

function isSeparatorOnlyNarration(text) {
  const cleaned = String(text || '').trim();
  if (!cleaned) return true;
  return /^[,，、.。·ㆍ;；:：!?！？…⋯\-—~\s]+$/.test(cleaned);
}

// 큰따옴표 바로 앞에 오는 단어를 화자명으로 인식한다.
// 오탐 방지: (a) 공백·문장부호 없는 단일 토큰(≤16자), 또는 (b) 콜론으로 끝나는 짧은 라벨만 인정.
function detectSpeakerName(narrationText) {
  const text = String(narrationText || '');
  if (!text.trim()) return { speaker: '', rest: text };
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  const candidate = (lines[lines.length - 1] || '').trim();
  if (!candidate) return { speaker: '', rest: text };

  // (b) "신입 경찰:" 처럼 콜론으로 끝나는 화자 라벨
  const colon = /^(.{1,16})\s*[:：]$/.exec(candidate);
  if (colon && !/[.!?。！？…]/.test(colon[1])) {
    return { speaker: colon[1].trim(), rest: lines.slice(0, -1).join('\n') };
  }
  // (a) "KPC" 처럼 공백·문장부호 없는 단일 토큰
  if (/^[^\s.!?。！？…,，、:：'"“”「」『』()[\]{}]{1,16}$/.test(candidate)) {
    return { speaker: candidate, rest: lines.slice(0, -1).join('\n') };
  }
  return { speaker: '', rest: text };
}

function splitDialogueSegments(text, { keepDialogueQuotes = false, detectSpeaker = false } = {}) {
  const openToClose = { '"': '"', '“': '”', '「': '」', '『': '』' };
  const openers = new Set(Object.keys(openToClose));
  const segments = [];
  let buffer = '';
  let mode = 'narration';
  let closeQuote = null;
  let unclosedQuote = false;
  let pendingSpeaker = '';

  // beforeDialogue=true 일 때만(=바로 뒤에 대사가 이어질 때) 화자명을 떼어낸다.
  function flushNarration(beforeDialogue) {
    let cleaned = normalizeExtractedBlock(buffer);
    buffer = '';
    if (detectSpeaker && beforeDialogue) {
      const detected = detectSpeakerName(cleaned);
      pendingSpeaker = detected.speaker;
      cleaned = normalizeExtractedBlock(detected.rest);
    }
    if (isSeparatorOnlyNarration(cleaned)) return;
    if (cleaned) segments.push({ type: 'narration', text: cleaned });
  }

  function flushDialogue() {
    let cleaned = normalizeExtractedBlock(buffer);
    buffer = '';
    if (!keepDialogueQuotes) cleaned = stripWrappingDialogueQuote(cleaned);
    if (cleaned) {
      const segment = { type: 'dialogue', text: cleaned };
      if (pendingSpeaker) segment.speaker = pendingSpeaker;
      segments.push(segment);
    }
    pendingSpeaker = '';
  }

  for (const ch of String(text || '')) {
    if (mode === 'narration') {
      if (openers.has(ch)) {
        flushNarration(true);
        mode = 'dialogue';
        closeQuote = openToClose[ch];
        buffer = ch;
      } else {
        buffer += ch;
      }
      continue;
    }

    buffer += ch;
    if (ch === closeQuote) {
      flushDialogue();
      mode = 'narration';
      closeQuote = null;
    }
  }

  if (mode === 'dialogue') {
    unclosedQuote = true;
    flushDialogue();
  } else {
    flushNarration(false);
  }
  return { segments, unclosedQuote };
}

function splitDialogueSegmentsForLinebreak(text) {
  const openToClose = { '"': '"', '“': '”', '「': '」', '『': '』' };
  const openers = new Set(Object.keys(openToClose));
  const segments = [];
  let buffer = '';
  let mode = 'narration';
  let closeQuote = null;

  function pushBuffer(type) {
    let cleaned = normalizeExtractedBlock(buffer);
    if (type === 'narration' && isSeparatorOnlyNarration(cleaned)) {
      buffer = '';
      return;
    }
    if (cleaned) segments.push({ type, text: cleaned });
    buffer = '';
  }

  for (const ch of String(text || '')) {
    if (mode === 'narration') {
      if (openers.has(ch)) {
        pushBuffer('narration');
        mode = 'dialogue';
        closeQuote = openToClose[ch];
        buffer = ch;
      } else {
        buffer += ch;
      }
      continue;
    }

    buffer += ch;
    if (ch === closeQuote) {
      pushBuffer('dialogue');
      mode = 'narration';
      closeQuote = null;
    }
  }

  pushBuffer(mode);
  return segments;
}

function formatSplitResult(segments) {
  let narrationNo = 0;
  let dialogueNo = 0;
  return segments.map((segment) => {
    if (segment.type === 'dialogue') {
      dialogueNo += 1;
      const label = segment.speaker ? segment.speaker : '대사';
      return `【${label} ${String(dialogueNo).padStart(2, '0')}】\n${segment.text}`;
    }
    narrationNo += 1;
    return `【서술 ${String(narrationNo).padStart(2, '0')}】\n${segment.text}`;
  }).join('\n\n');
}

// 라벨 줄을 해석한다. `【서술 01】` `【대사 02】` 외에 `【KPC 01】` 같은 화자명 라벨도 인식한다.
function matchSplitLabelLine(line) {
  const matched = /^(?:【\s*(.+?)\s*】|\[\s*(.+?)\s*\])$/.exec(String(line || '').trim());
  if (!matched) return null;
  const inner = (matched[1] || matched[2] || '').trim();
  if (!inner || inner.length > 20 || /\n/.test(inner)) return null;
  const parsed = /^(.*?)\s*([0-9０-９]+)?$/.exec(inner);
  const name = (parsed[1] || '').trim();
  const number = parsed[2] || '';
  if (!name) return null;
  const kind = name === '서술' ? 'narration' : 'dialogue';
  const speaker = name === '서술' || name === '대사' ? '' : name;
  return { kind, number, name, speaker };
}

function parseLabeledSplitSegments(text) {
  const normalized = String(text || '').replace(/\r\n/g, '\n').trim();
  if (!normalized) return { hasLabels: false, segments: [], unclosedQuote: false };

  const lines = normalized.split('\n');
  const hasLabels = lines.some((line) => matchSplitLabelLine(line));
  if (!hasLabels) return { hasLabels: false, segments: [], unclosedQuote: false };

  const segments = [];
  let unclosedQuote = false;
  let current = null;
  let leadingLines = [];

  function pushLeadingLines() {
    const body = normalizeExtractedBlock(leadingLines.join('\n'));
    leadingLines = [];
    if (!body) return;
    const parsed = splitDialogueSegments(body, { detectSpeaker: true });
    segments.push(...parsed.segments);
    unclosedQuote = unclosedQuote || parsed.unclosedQuote;
  }

  function pushCurrent() {
    if (!current) return;
    const body = normalizeExtractedBlock(current.lines.join('\n'));
    if (body) {
      const segment = { type: current.type, text: body };
      if (current.speaker) segment.speaker = current.speaker;
      segments.push(segment);
    }
    current = null;
  }

  lines.forEach((line) => {
    const matched = matchSplitLabelLine(line);
    if (matched) {
      if (current) pushCurrent();
      else pushLeadingLines();
      current = {
        type: matched.kind,
        speaker: matched.speaker,
        lines: []
      };
      return;
    }

    if (current) current.lines.push(line);
    else leadingLines.push(line);
  });

  if (current) pushCurrent();
  else pushLeadingLines();

  return { hasLabels, segments, unclosedQuote };
}

function getSplitSegmentsForEditor(text) {
  const labeled = parseLabeledSplitSegments(text);
  if (labeled.hasLabels) return labeled;
  return { hasLabels: false, ...splitDialogueSegments(text, { detectSpeaker: true }) };
}

async function splitEditorSource(action) {
  const input = getEditorInput();
  if (!input.text) {
    setEditorStatus('원문 또는 출력문에 분리할 문장을 넣어 주세요.', true);
    return;
  }
  const { segments, unclosedQuote } = getSplitSegmentsForEditor(input.text);
  if (!segments.length) {
    setEditorStatus('분리할 내용이 없습니다.', true);
    return;
  }

  let resultSegments = segments;
  if (action === 'dialogue_only') {
    resultSegments = segments.filter((segment) => segment.type === 'dialogue');
    if (!resultSegments.length) {
      setEditorStatus('추출된 대사가 없습니다. 지원 따옴표: " ", “ ”, 「 」, 『 』', true);
      return;
    }
  }
  if (action === 'narration_only') {
    resultSegments = segments.filter((segment) => segment.type === 'narration');
    if (!resultSegments.length) {
      setEditorStatus('추출된 서술이 없습니다.', true);
      return;
    }
  }

  const suffix = unclosedQuote ? ' 닫히지 않은 따옴표가 있습니다.' : '';
  await setEditorOutput(formatSplitResult(resultSegments), `${input.sourceName} 기준으로 분리했습니다.${suffix}`);
}

function normalizeDialogueForLinebreak(text) {
  return String(text || '')
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.replace(/[ \t]+/g, ' ').trim())
    .filter(Boolean)
    .join('\n');
}

function formatNarrationForLinebreak(text) {
  const normalized = String(text || '')
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .trim();
  if (!normalized) return '';
  const sentenceBreakPattern = /([.!?。！？]|다\.|요\.|죠\.|니다\.|습니다\.|였다\.|이었다\.|한다\.|했다\.|된다\.|있다\.|없다\.)\s+/g;
  return normalized
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .flatMap((line) => line.replace(sentenceBreakPattern, '$1\n').split('\n'))
    .map((line) => line.trim())
    .filter(Boolean)
    .join('\n\n');
}

function localLinebreakOnly(text) {
  const normalized = String(text || '').replace(/\r\n/g, '\n').trim();
  if (!normalized) return '';
  return normalized
    .split(/\n{2,}/)
    .map((part) => {
      const lines = part.split('\n');
      const firstLine = lines[0]?.trim() || '';
      const matchedLabel = matchSplitLabelLine(firstLine);
      if (lines.length > 1 && matchedLabel) {
        const bodyText = lines.slice(1).join('\n');
        const body = matchedLabel.kind === 'dialogue'
          ? normalizeDialogueForLinebreak(bodyText)
          : formatNarrationForLinebreak(bodyText);
        return body ? `${firstLine}\n${body}` : firstLine;
      }

      const segments = splitDialogueSegmentsForLinebreak(part);
      if (segments.length > 1 || segments.some((segment) => segment.type === 'dialogue')) {
        return segments
          .map((segment) => segment.type === 'dialogue'
            ? normalizeDialogueForLinebreak(segment.text)
            : formatNarrationForLinebreak(segment.text))
          .filter(Boolean)
          .join('\n\n');
      }

      return formatNarrationForLinebreak(part);
    })
    .filter(Boolean)
    .join('\n\n');
}

async function applyLocalLinebreak() {
  const input = getEditorInput();
  if (!input.text) {
    setEditorStatus('줄바꿈을 정리할 문장을 원문이나 출력문에 넣어 주세요.', true);
    return;
  }
  await setEditorOutput(localLinebreakOnly(input.text), `${input.sourceName || '입력문'} 기준으로 API를 사용하지 않고 줄바꿈만 정리했습니다.`);
}

function hasFinalConsonant(value) {
  const chars = Array.from(String(value || '').trim());
  if (!chars.length) return false;
  const code = chars[chars.length - 1].charCodeAt(0);
  if (code < 0xac00 || code > 0xd7a3) return false;
  return ((code - 0xac00) % 28) !== 0;
}

function josaFor(name, type) {
  const final = hasFinalConsonant(name);
  const table = {
    subject: final ? '이' : '가',
    topic: final ? '은' : '는',
    object: final ? '을' : '를',
    with: final ? '과' : '와',
    direction: final ? '으로' : '로'
  };
  return table[type] || '';
}

function parseTargetTerms(value) {
  const terms = String(value || '')
    .split(/[,，、/\n]+/)
    .map((item) => item.trim())
    .filter(Boolean);
  const seen = new Set();
  const unique = [];
  terms.forEach((term) => {
    if (seen.has(term)) return;
    seen.add(term);
    unique.push(term);
  });
  return unique.length ? unique.sort((a, b) => b.length - a.length) : ['탐사자님', '탐사자', 'PC', '플레이어'];
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeReplacementWithSuffix(target, suffix = '') {
  if (suffix === '가' || suffix === '이') return target + josaFor(target, 'subject');
  if (suffix === '는' || suffix === '은') return target + josaFor(target, 'topic');
  if (suffix === '를' || suffix === '을') return target + josaFor(target, 'object');
  if (suffix === '와' || suffix === '과') return target + josaFor(target, 'with');
  if (suffix === '으로' || suffix === '로') return target + josaFor(target, 'direction');
  return target + suffix;
}

function replaceTargetTerms(text, terms, name) {
  const target = String(name || '당신').trim() || '당신';
  const targetTerms = parseTargetTerms(Array.isArray(terms) ? terms.join(',') : terms);
  const pattern = targetTerms.map(escapeRegExp).join('|');
  const suffix = '에게서|에게|께서|께|으로|로|와|과|은|는|이|가|을|를|의|도|만|또한|조차|까지|부터|처럼|마다|보다|마저|라도|라면';
  return String(text || '').replace(new RegExp(`(^|[^A-Za-z가-힣])(${pattern})(${suffix})?(?=$|[^A-Za-z가-힣])`, 'g'), (_, prefix = '', _term, particle = '') => {
    return `${prefix}${normalizeReplacementWithSuffix(target, particle)}`;
  });
}

function applyTargetToText(text) {
  const { targetTerms, targetName, applyTargetToDialogue } = getEditorTargetSettings();
  const normalized = String(text || '').replace(/\r\n/g, '\n').trim();
  if (!normalized) return '';
  return normalized.split(/\n{2,}/).map((part) => {
    const lines = part.split('\n');
    const firstLine = lines[0]?.trim() || '';
    const matched = matchSplitLabelLine(firstLine);
    if (matched) {
      if (matched.kind === 'dialogue' && !applyTargetToDialogue) return part;
      const body = lines.slice(1).join('\n');
      return body ? `${firstLine}\n${replaceTargetTerms(body, targetTerms, targetName)}` : firstLine;
    }

    const { segments } = splitDialogueSegments(part);
    if (segments.length > 1 || segments.some((segment) => segment.type === 'dialogue')) {
      return segments.map((segment) => {
        if (segment.type === 'dialogue' && !applyTargetToDialogue) return segment.text;
        return replaceTargetTerms(segment.text, targetTerms, targetName);
      }).filter(Boolean).join('\n\n');
    }

    return replaceTargetTerms(part, targetTerms, targetName);
  }).join('\n\n').trim();
}

async function applyTargetLocal() {
  const input = getEditorInput();
  if (!input.text) {
    setEditorStatus('호칭을 적용할 문장을 원문이나 출력문에 넣어 주세요.', true);
    return;
  }
  await setEditorOutput(applyTargetToText(input.text), `${input.sourceName || '입력문'} 기준으로 지칭 변환을 적용했습니다.`);
}

function previewBlocksFromOutput(text) {
  const normalized = String(text || '').replace(/\r\n/g, '\n').trim();
  if (!normalized) return [];
  const quoteStart = (line) => /^[“"「『]/.test(line.trim());
  const lines = normalized.split('\n');
  const hasLabels = lines.some((line) => matchSplitLabelLine(line));

  if (!hasLabels) {
    const isDialogue = quoteStart(normalized);
    return [{
      label: isDialogue ? '대사' : '서술',
      kind: isDialogue ? 'dialogue' : 'narration',
      labelLine: '',
      text: normalized
    }];
  }

  const blocks = [];
  let current = null;

  function pushCurrent() {
    if (!current) return;
    const textValue = normalizeExtractedBlock(current.lines.join('\n'));
    if (textValue) {
      blocks.push({
        label: current.label,
        kind: current.kind,
        labelLine: current.labelLine,
        text: textValue
      });
    }
    current = null;
  }

  lines.forEach((line) => {
    const matched = matchSplitLabelLine(line);
    if (matched) {
      pushCurrent();
      current = {
        label: matched.number ? `${matched.name} ${matched.number}` : matched.name,
        kind: matched.kind,
        labelLine: line.trim(),
        lines: []
      };
      return;
    }

    if (!current && line.trim()) {
      const isDialogue = quoteStart(line);
      current = {
        label: isDialogue ? '대사' : '서술',
        kind: isDialogue ? 'dialogue' : 'narration',
        labelLine: '',
        lines: []
      };
    }
    if (current) current.lines.push(line);
  });

  pushCurrent();
  return blocks;
}

// 미리보기 "전체 복사": 라벨(【서술/대사/화자 NN】)을 빼고 본문만 이어 붙인다.
function previewPlainText() {
  return previewBlocksFromOutput(elements.editorOutputText.value)
    .map((block) => block.text)
    .filter((part) => part && part.trim())
    .join('\n\n');
}

// 미리보기 카드의 출처 블록(라벨/본문)을 보관해 "수정 → 출력문 반영"에 사용한다.
let currentPreviewBlocks = [];

const COPY_ICON_SVG =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2"></rect><path d="M5 15V5a2 2 0 0 1 2-2h10"></path></svg>';

function renderEditorPreview() {
  const blocks = previewBlocksFromOutput(elements.editorOutputText.value);
  currentPreviewBlocks = blocks;
  elements.editorPreviewCount.textContent = `${blocks.length.toLocaleString('ko-KR')}개 블록`;

  // 비었을 때는 CSS(.editor-preview:empty::before)가 안내문을 표시하므로 비워 둔다.
  elements.editorPreview.innerHTML = '';
  blocks.forEach((block, index) => {
    const card = document.createElement('article');
    card.className = 'preview-card';
    card.dataset.kind = block.kind;
    card.dataset.index = String(index);

    const title = document.createElement('div');
    title.className = 'preview-card-title';

    const label = document.createElement('span');
    label.className = 'pc-label';
    label.textContent = block.label;

    const actions = document.createElement('div');
    actions.className = 'pc-actions';

    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.className = 'pc-btn pc-edit';
    editBtn.textContent = '수정';

    const copyBtn = document.createElement('button');
    copyBtn.type = 'button';
    copyBtn.className = 'pc-btn pc-copy';
    copyBtn.innerHTML = `${COPY_ICON_SVG}복사`;

    actions.append(editBtn, copyBtn);
    title.append(label, actions);

    const body = document.createElement('div');
    body.className = 'preview-card-body';
    body.textContent = block.text;

    card.append(title, body);
    elements.editorPreview.append(card);
  });
}

// 미리보기 카드의 수정/복사 (이벤트 위임).
function bindPreviewCardActions() {
  if (!elements.editorPreview) return;
  elements.editorPreview.addEventListener('click', async (event) => {
    const card = event.target.closest('.preview-card');
    if (!card) return;
    const body = card.querySelector('.preview-card-body');

    if (event.target.closest('.pc-copy')) {
      await copyText(body ? body.textContent : '', '블록을 복사했습니다');
      return;
    }

    const editBtn = event.target.closest('.pc-edit');
    if (!editBtn || !body) return;

    const editing = card.classList.toggle('is-editing');
    body.setAttribute('contenteditable', editing ? 'true' : 'false');
    editBtn.textContent = editing ? '완료' : '수정';

    if (editing) {
      body.focus();
      const sel = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(body);
      range.collapse(false);
      sel.removeAllRanges();
      sel.addRange(range);
    } else {
      commitPreviewEdit(card, body);
    }
  });
}

// 수정한 카드 본문을 출력문(textarea)에 반영하고 미리보기를 다시 그린다.
function commitPreviewEdit(card, body) {
  const index = Number(card.dataset.index);
  if (!Number.isInteger(index) || !currentPreviewBlocks[index]) return;

  const newText = String(body.innerText || '').replace(/ /g, ' ').trim();
  currentPreviewBlocks[index].text = newText;

  const rebuilt = currentPreviewBlocks
    .map((block) => (block.labelLine ? `${block.labelLine}\n${block.text}` : block.text))
    .filter((part) => part && part.trim())
    .join('\n\n');

  elements.editorOutputText.value = rebuilt;
  saveEditorDraft();
  renderEditorPreview();
  showToast('수정 내용을 적용했습니다');
}
