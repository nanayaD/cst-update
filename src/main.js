const { app, BrowserWindow, Menu, dialog, ipcMain, shell, clipboard } = require('electron');
const path = require('node:path');
const fs = require('node:fs/promises');
const translatorService = require('./translatorService');
const editorService = require('./editorService');
const errorLogger = require('./errorLogger');
const updateService = require('./updateService');

const { MODES, getProviderLabel } = translatorService;

// userData(설정·로그) 폴더 이름은 app.getName()이 결정한다. 최상위 productName이 없으면
// package.json의 name("coc-jp-scenario-translator")으로 떨어지므로, 폴더명을 CST로 고정하려면
// userData 경로가 처음 해석되기 전(= whenReady 이전, 모듈 로드 시점)에 이름을 지정해야 한다.
app.setName('CST');

// 0.2.0까지는 폴더가 'coc-jp-scenario-translator'로 만들어졌다. CST로 바꾸면서 기존 사용자의
// 저장된 키/설정을 잃지 않도록, 새 폴더가 비어 있고 옛 폴더에 설정이 있으면 1회 복사한다.
const LEGACY_USERDATA_DIR_NAME = 'coc-jp-scenario-translator';

// 기본 모델은 비워 둔다. 사용자가 API 키를 입력하고 모델 목록을 새로고침해 직접 선택해야 한다.
const DEFAULT_SETTINGS = {
  provider: 'openai',
  apiKeys: {
    openai: '',
    gemini: ''
  },
  modelByProvider: {
    openai: '',
    gemini: ''
  },
  charLimit: 3000,
  defaultMode: 'faithful',
  includeCocNotes: true,
  theme: 'lilac'
};

const SUPPORTED_PROVIDERS = ['openai', 'gemini'];

const activeTranslationRequests = new Map();
const activeEditorRequests = new Map();

let mainWindow = null;
let pendingMigrationError = null;

function getSettingsPath() {
  return path.join(app.getPath('userData'), 'settings.json');
}

// 옛 폴더(coc-jp-scenario-translator) → 새 폴더(CST) 1회 이전. 실패해도 앱 실행을 막지 않는다.
async function migrateLegacyUserDataIfNeeded() {
  const newDir = app.getPath('userData');
  const oldDir = path.join(app.getPath('appData'), LEGACY_USERDATA_DIR_NAME);
  if (path.resolve(newDir) === path.resolve(oldDir)) return;

  // 새 폴더에 이미 설정이 있으면 건너뛴다(덮어쓰기 방지).
  try {
    await fs.access(path.join(newDir, 'settings.json'));
    return;
  } catch {}

  // 옛 폴더에 설정이 없으면 신규 사용자이므로 이전할 게 없다.
  try {
    await fs.access(path.join(oldDir, 'settings.json'));
  } catch {
    return;
  }

  // 옛 폴더 내용(settings.json, logs 등)을 새 폴더로 복사. 기존 파일은 건드리지 않는다.
  await fs.mkdir(newDir, { recursive: true });
  await fs.cp(oldDir, newDir, { recursive: true, force: false, errorOnExist: false });
}

async function readSettings() {
  try {
    const raw = await fs.readFile(getSettingsPath(), 'utf8');
    return normalizeSettings(JSON.parse(raw));
  } catch {
    return normalizeSettings({});
  }
}

async function writeSettings(settings) {
  const normalized = normalizeSettings(settings);
  await fs.mkdir(app.getPath('userData'), { recursive: true });
  await fs.writeFile(getSettingsPath(), JSON.stringify(normalized, null, 2), 'utf8');
  return normalized;
}

function normalizeSettings(input) {
  const settings = input && typeof input === 'object' ? input : {};

  const provider = SUPPORTED_PROVIDERS.includes(settings.provider)
    ? settings.provider
    : DEFAULT_SETTINGS.provider;

  const apiKeysSource =
    settings.apiKeys && typeof settings.apiKeys === 'object' ? settings.apiKeys : {};
  const modelsSource =
    settings.modelByProvider && typeof settings.modelByProvider === 'object'
      ? settings.modelByProvider
      : {};

  const apiKeys = {
    openai: String(apiKeysSource.openai || '').trim(),
    gemini: String(apiKeysSource.gemini || '').trim()
  };

  const modelByProvider = {
    openai: String(modelsSource.openai || '').trim(),
    gemini: String(modelsSource.gemini || '').trim()
  };

  // Migrate legacy flat fields (apiKey / model) into the OpenAI provider slot.
  if (!settings.apiKeys && settings.apiKey) {
    apiKeys.openai = String(settings.apiKey).trim();
  }
  if (!settings.modelByProvider && settings.model) {
    modelByProvider.openai = String(settings.model).trim();
  }

  return {
    provider,
    apiKeys,
    modelByProvider,
    charLimit: Number(settings.charLimit) > 0 ? Number(settings.charLimit) : DEFAULT_SETTINGS.charLimit,
    defaultMode: MODES[settings.defaultMode] ? settings.defaultMode : DEFAULT_SETTINGS.defaultMode,
    includeCocNotes:
      settings.includeCocNotes === undefined
        ? DEFAULT_SETTINGS.includeCocNotes
        : Boolean(settings.includeCocNotes),
    theme: ['lilac', 'sky', 'pink', 'green', 'dark'].includes(settings.theme)
      ? settings.theme
      : DEFAULT_SETTINGS.theme
  };
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 980,
    minHeight: 700,
    title: 'CST',
    icon: path.join(__dirname, '..', 'assets', 'CoC-Scenario-Translator.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function openManualWindow() {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('menu:open-manual');
  }
}

function createApplicationMenu() {
  const template = [
    {
      label: '파일',
      submenu: [
        { role: 'quit', label: '종료' }
      ]
    },
    {
      label: '편집',
      submenu: [
        { role: 'undo', label: '실행 취소' },
        { role: 'redo', label: '다시 실행' },
        { type: 'separator' },
        { role: 'cut', label: '잘라내기' },
        { role: 'copy', label: '복사' },
        { role: 'paste', label: '붙여넣기' },
        { role: 'selectAll', label: '전체 선택' }
      ]
    },
    {
      label: '보기',
      submenu: [
        { role: 'reload', label: '새로고침' },
        { role: 'forceReload', label: '강력 새로고침' },
        { type: 'separator' },
        { role: 'resetZoom', label: '실제 크기' },
        { role: 'zoomIn', label: '확대' },
        { role: 'zoomOut', label: '축소' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: '전체 화면' }
      ]
    },
    {
      label: '창',
      submenu: [
        { role: 'minimize', label: '최소화' },
        { role: 'close', label: '닫기' }
      ]
    },
    {
      label: '도움말',
      submenu: [
        {
          label: '사용설명서',
          accelerator: 'F1',
          click: () => openManualWindow()
        },
        { type: 'separator' },
        {
          label: 'CST 정보',
          click: () => {
            const version = app.getVersion();
            dialog.showMessageBox({
              type: 'info',
              title: 'CST 정보',
              message: `CST ${version}`,
              detail: `버전: ${version}\n일본어 CoC 시나리오 부분 번역 도구`
            });
          }
        }
      ]
    }
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// 전역 예외도 로그에 남기되, 앱이 즉시 종료되지 않도록 한다.
process.on('uncaughtException', (error) => {
  errorLogger.logError('uncaught_exception', error);
});
process.on('unhandledRejection', (reason) => {
  errorLogger.logError('unhandled_rejection', reason instanceof Error ? reason : new Error(String(reason)));
});

app.whenReady().then(async () => {
  try {
    await migrateLegacyUserDataIfNeeded();
  } catch (error) {
    // 마이그레이션 실패는 치명적이지 않다. 로거 초기화 후 기록만 남긴다.
    pendingMigrationError = error;
  }
  errorLogger.init({ userDataPath: app.getPath('userData'), appGetVersion: () => app.getVersion() });
  if (pendingMigrationError) {
    errorLogger.logError('userdata_migration_failed', pendingMigrationError);
    pendingMigrationError = null;
  }
  createApplicationMenu();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

ipcMain.handle('settings:get', async () => {
  return readSettings();
});

ipcMain.handle('settings:save', async (_event, settings) => {
  try {
    return await writeSettings(settings);
  } catch (error) {
    errorLogger.logError('settings_save_failed', error);
    throw error;
  }
});

ipcMain.handle('models:list', async (_event, payload) => {
  const provider = SUPPORTED_PROVIDERS.includes(payload?.provider) ? payload.provider : 'openai';
  const apiKey = String(payload?.apiKey || '').trim();

  if (!apiKey) {
    throw new Error(`${getProviderLabel(provider)} API 키를 확인하세요.`);
  }

  try {
    return await translatorService.listModels({ provider, apiKey });
  } catch (error) {
    errorLogger.logError('models_list_failed', error, { details: { provider } });
    throw error;
  }
});

ipcMain.handle('translate:run', async (_event, payload) => {
  const requestId = String(payload.requestId || '');
  const abortController = new AbortController();

  if (requestId) {
    activeTranslationRequests.set(requestId, abortController);
  }

  const settings = normalizeSettings(payload.settings || (await readSettings()));
  const provider = settings.provider;
  const apiKey = settings.apiKeys[provider];
  const model = settings.modelByProvider[provider];
  const sourceText = String(payload.sourceText || '').trim();
  const contextMemo = String(payload.contextMemo || '').trim();
  const mode = MODES[payload.mode] ? payload.mode : settings.defaultMode;

  if (!apiKey) {
    throw new Error(`${getProviderLabel(provider)} API 키를 확인하세요.`);
  }

  if (!model) {
    throw new Error('모델명을 확인하세요.');
  }

  if (!sourceText) {
    throw new Error('번역할 일본어 원문을 입력하세요.');
  }

  if (sourceText.length > settings.charLimit) {
    throw new Error('입력 글자수가 제한을 초과했습니다.');
  }

  try {
    const result = await translatorService.translate({
      provider,
      apiKey,
      model,
      mode,
      sourceText,
      contextMemo,
      useCocMemo: settings.includeCocNotes,
      requestId,
      signal: abortController.signal
    });

    if (!result.text) {
      throw new Error('번역 결과를 받지 못했습니다.');
    }

    return {
      content: result.text,
      localNotes: result.localNotes,
      provider: result.provider,
      model: result.model
    };
  } catch (error) {
    if (error.name === 'AbortError') {
      return {
        cancelled: true,
        content: '',
        localNotes: { referenceNotes: [], reviewNeeded: [] }
      };
    }

    errorLogger.logError('translate_failed', error, {
      details: { provider, status: error.status }
    });
    throw error;
  } finally {
    if (requestId) {
      activeTranslationRequests.delete(requestId);
    }
  }
});

ipcMain.handle('translate:cancel', async (_event, requestId) => {
  const controller = activeTranslationRequests.get(String(requestId || ''));

  if (!controller) {
    return false;
  }

  controller.abort();
  return true;
});

ipcMain.handle('editor:clean-text', async (_event, payload) => {
  const requestId = String(payload.requestId || '');
  const abortController = new AbortController();

  if (requestId) {
    activeEditorRequests.set(requestId, abortController);
  }

  const settings = normalizeSettings(payload.settings || (await readSettings()));
  const provider = settings.provider;
  const apiKey = settings.apiKeys[provider];
  const model = settings.modelByProvider[provider];
  const text = String(payload.text || '').trim();

  if (!apiKey) {
    throw new Error(`${getProviderLabel(provider)} API 키를 확인하세요.`);
  }
  if (!model) {
    throw new Error('모델명을 확인하세요.');
  }
  if (!text) {
    throw new Error('교정할 문장을 입력하세요.');
  }
  if (text.length > settings.charLimit * 2) {
    throw new Error(`교정 원문은 한 번에 ${(settings.charLimit * 2).toLocaleString('ko-KR')}자까지 보낼 수 있습니다.`);
  }

  try {
    const cleaned = await editorService.cleanText({
      provider,
      apiKey,
      model,
      mode: payload.mode,
      text,
      enhanceLevel: payload.enhanceLevel,
      targetTerms: payload.targetTerms,
      targetName: payload.targetName,
      applyTargetToDialogue: payload.applyTargetToDialogue,
      allowOmitRepeatedTarget: payload.allowOmitRepeatedTarget,
      signal: abortController.signal
    });

    return { text: cleaned, provider, model };
  } catch (error) {
    if (error.name === 'AbortError') {
      return { cancelled: true, text: '' };
    }
    errorLogger.logError('editor_clean_failed', error, {
      details: { provider, status: error.status }
    });
    throw error;
  } finally {
    if (requestId) {
      activeEditorRequests.delete(requestId);
    }
  }
});

ipcMain.handle('editor:clean-narration-blocks', async (_event, payload) => {
  const requestId = String(payload.requestId || '');
  const abortController = new AbortController();

  if (requestId) {
    activeEditorRequests.set(requestId, abortController);
  }

  const settings = normalizeSettings(payload.settings || (await readSettings()));
  const provider = settings.provider;
  const apiKey = settings.apiKeys[provider];
  const model = settings.modelByProvider[provider];
  const blocks = Array.isArray(payload.blocks) ? payload.blocks : [];
  const totalChars = blocks.reduce((sum, item) => sum + String(item || '').length, 0);

  if (!apiKey) {
    throw new Error(`${getProviderLabel(provider)} API 키를 확인하세요.`);
  }
  if (!model) {
    throw new Error('모델명을 확인하세요.');
  }
  if (!blocks.some((item) => String(item || '').trim())) {
    throw new Error('정리할 서술 블록이 없습니다.');
  }
  if (totalChars > settings.charLimit * 2) {
    throw new Error(`서술 블록은 한 번에 ${(settings.charLimit * 2).toLocaleString('ko-KR')}자까지 보낼 수 있습니다.`);
  }

  try {
    const cleanedBlocks = await editorService.cleanNarrationBlocks({
      provider,
      apiKey,
      model,
      mode: payload.mode,
      blocks,
      enhanceLevel: payload.enhanceLevel,
      targetTerms: payload.targetTerms,
      targetName: payload.targetName,
      applyTargetToDialogue: payload.applyTargetToDialogue,
      allowOmitRepeatedTarget: payload.allowOmitRepeatedTarget,
      signal: abortController.signal
    });

    return { blocks: cleanedBlocks, provider, model };
  } catch (error) {
    if (error.name === 'AbortError') {
      return { cancelled: true, blocks: [] };
    }
    errorLogger.logError('editor_clean_blocks_failed', error, {
      details: { provider, status: error.status }
    });
    throw error;
  } finally {
    if (requestId) {
      activeEditorRequests.delete(requestId);
    }
  }
});

ipcMain.handle('editor:cancel', async (_event, requestId) => {
  const controller = activeEditorRequests.get(String(requestId || ''));

  if (!controller) {
    return false;
  }

  controller.abort();
  return true;
});

// 렌더러(UI)에서 발생한 오류를 메인 프로세스 로그로 전달받는다.
ipcMain.handle('log:report', async (_event, payload) => {
  const event = String(payload?.event || 'renderer_error');
  const error = new Error(String(payload?.message || 'Renderer error'));
  error.stack = String(payload?.stack || '');
  errorLogger.logError(event, error, { level: 'ERROR' });
  return true;
});

ipcMain.handle('log:open-folder', async () => {
  const dir = errorLogger.getLogDir();
  if (!dir) {
    throw new Error('로그 폴더 경로를 확인할 수 없습니다.');
  }
  // 폴더가 아직 없으면 빈 로그라도 열 수 있게 만들어 둔다.
  await fs.mkdir(dir, { recursive: true }).catch(() => {});
  const result = await shell.openPath(dir);
  if (result) {
    throw new Error(`로그 폴더를 열지 못했습니다: ${result}`);
  }
  return true;
});

ipcMain.handle('log:copy', async () => {
  const content = errorLogger.readRecentLog();
  if (!content) {
    return { copied: false };
  }
  clipboard.writeText(content);
  return { copied: true };
});

ipcMain.handle('log:clear', async () => {
  const ok = errorLogger.clearLogs();
  if (!ok) {
    throw new Error('오류 로그를 삭제하지 못했습니다.');
  }
  return true;
});

ipcMain.handle('updates:check', async (_event, payload) => {
  const useTestFeed = Boolean(payload?.useTestFeed);
  const feedUrl = useTestFeed ? updateService.TEST_UPDATE_URL : updateService.DEFAULT_UPDATE_URL;
  try {
    return await updateService.checkForUpdates({
      currentVersion: app.getVersion(),
      url: feedUrl
    });
  } catch (error) {
    errorLogger.logError('update_check_failed', error, {
      details: {
        feed: useTestFeed ? 'test' : 'production'
      }
    });
    if (payload?.silent) {
      return { failed: true, message: error.message || '업데이트 확인에 실패했습니다.' };
    }
    throw error;
  }
});

ipcMain.handle('updates:open-download', async (_event, url) => {
  const safeUrl = updateService.ensureHttpsUrl(url, '다운로드');
  await shell.openExternal(safeUrl);
  return true;
});
