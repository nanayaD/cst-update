// 오류 로그 모듈
//
// 프로그램 실행 중 발생한 예외를 사용자 PC 안에만 로컬 기록한다.
// 설계 원칙:
//   - 민감정보(API 키, Authorization, 사용자 입력 원문/번역·교정 결과 전문)는 기록하지 않는다.
//   - 외부 서버로 자동 전송하지 않는다.
//   - 로그 기록 자체의 실패가 다시 앱 오류로 이어지지 않도록, 모든 동작은 실패를 조용히 삼킨다.
//   - 로그 폴더는 설정 파일과 같은 userData 하위(logs)에 둔다(Roaming\CST\logs).
//
// 외부 의존(app, os 등)은 init()으로 주입해 단위 점검을 쉽게 한다.

const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const MAX_LOG_BYTES = 5 * 1024 * 1024; // 개별 로그 파일 최대 5MB
const MAX_BACKUPS = 5; // error.1.log ~ error.5.log
const LOG_FILE = 'error.log';

let logDir = null;
let getVersion = () => 'unknown';

function init({ userDataPath, appGetVersion } = {}) {
  if (userDataPath) {
    logDir = path.join(userDataPath, 'logs');
  }
  if (typeof appGetVersion === 'function') {
    getVersion = appGetVersion;
  }
}

function getLogDir() {
  return logDir;
}

function getLogFilePath() {
  return logDir ? path.join(logDir, LOG_FILE) : null;
}

function ensureLogDir() {
  if (!logDir) return false;
  try {
    fs.mkdirSync(logDir, { recursive: true });
    return true;
  } catch {
    return false;
  }
}

// 민감정보 마스킹: API 키/토큰/Authorization/긴 연속 문자열을 제거하거나 일부만 남긴다.
function maskSensitive(text) {
  let out = String(text == null ? '' : text);
  try {
    // Authorization 헤더 (Bearer 포함)
    out = out.replace(/Authorization\s*:\s*\S+/gi, 'Authorization: [REDACTED]');
    out = out.replace(/Bearer\s+[A-Za-z0-9._\-]+/g, 'Bearer [REDACTED]');
    // OpenAI 키 (sk-..., sk-proj-... 등)
    out = out.replace(/\bsk-[A-Za-z0-9._\-]{8,}/g, 'sk-[REDACTED]');
    // Google/Gemini 키 (AIza...)
    out = out.replace(/\bAIza[A-Za-z0-9._\-]{8,}/g, 'AIza[REDACTED]');
    // x-goog-api-key 헤더
    out = out.replace(/x-goog-api-key\s*:\s*\S+/gi, 'x-goog-api-key: [REDACTED]');
    // 그 외 40자 이상 연속 토큰(키로 추정)
    out = out.replace(/[A-Za-z0-9._\-]{40,}/g, '[REDACTED_LONG_TOKEN]');
  } catch {
    return '[REDACTED]';
  }
  return out;
}

function rotateIfNeeded() {
  const filePath = getLogFilePath();
  if (!filePath) return;
  try {
    const stat = fs.statSync(filePath);
    if (stat.size < MAX_LOG_BYTES) return;
  } catch {
    return; // 파일이 아직 없으면 회전 불필요
  }
  try {
    // 가장 오래된 백업 삭제
    const oldest = `${filePath}.${MAX_BACKUPS}`;
    if (fs.existsSync(oldest)) fs.rmSync(oldest, { force: true });
    // error.(n).log -> error.(n+1).log 로 한 칸씩 민다.
    for (let i = MAX_BACKUPS - 1; i >= 1; i -= 1) {
      const src = `${filePath}.${i}`;
      const dst = `${filePath}.${i + 1}`;
      if (fs.existsSync(src)) fs.renameSync(src, dst);
    }
    // error.log -> error.1.log
    fs.renameSync(filePath, `${filePath}.1`);
  } catch {
    // 회전 실패는 무시한다.
  }
}

function formatBlock({ event, level, message, details, stack }) {
  const lines = [];
  lines.push('============================================================');
  lines.push(`Time: ${new Date().toISOString()}`);
  lines.push(`App Version: ${maskSensitive(getVersion())}`);
  lines.push(`OS: ${os.platform()} ${os.release()}`);
  lines.push(`Event: ${event || 'unknown'}`);
  lines.push(`Level: ${level || 'ERROR'}`);
  lines.push('');
  lines.push('Message:');
  lines.push(maskSensitive(message || ''));
  if (details && typeof details === 'object') {
    const detailLines = Object.entries(details)
      .filter(([, v]) => v !== undefined && v !== null && v !== '')
      .map(([k, v]) => `${k}=${maskSensitive(String(v))}`);
    if (detailLines.length) {
      lines.push('');
      lines.push('Details:');
      lines.push(...detailLines);
    }
  }
  if (stack) {
    lines.push('');
    lines.push('Traceback:');
    lines.push(maskSensitive(stack));
  }
  lines.push('============================================================');
  lines.push('');
  return lines.join('\n');
}

// 핵심 진입점. 절대 throw 하지 않는다.
function logError(event, error, meta = {}) {
  try {
    if (!ensureLogDir()) return;
    rotateIfNeeded();

    let message = '';
    let stack = '';
    let level = meta.level || 'ERROR';
    if (error instanceof Error) {
      message = `${error.name}: ${error.message}`;
      stack = error.stack || '';
    } else if (typeof error === 'string') {
      message = error;
    } else if (error && typeof error === 'object') {
      message = error.message ? String(error.message) : JSON.stringify(error);
      stack = error.stack || '';
    }

    const block = formatBlock({
      event,
      level,
      message: meta.message || message,
      details: meta.details,
      stack
    });

    const filePath = getLogFilePath();
    if (filePath) fs.appendFileSync(filePath, block, 'utf8');
  } catch {
    // 로그 기록 실패는 조용히 무시한다.
  }
}

// 최근 로그 내용을 마스킹해 문자열로 반환(복사 기능용). 실패 시 빈 문자열.
function readRecentLog(maxBytes = 200 * 1024) {
  const filePath = getLogFilePath();
  if (!filePath) return '';
  try {
    const stat = fs.statSync(filePath);
    const start = Math.max(0, stat.size - maxBytes);
    const fd = fs.openSync(filePath, 'r');
    try {
      const length = stat.size - start;
      const buffer = Buffer.alloc(length);
      fs.readSync(fd, buffer, 0, length, start);
      return maskSensitive(buffer.toString('utf8'));
    } finally {
      fs.closeSync(fd);
    }
  } catch {
    return '';
  }
}

// logs 폴더 안의 로그 파일만 삭제한다(폴더 밖 파일은 절대 건드리지 않는다).
function clearLogs() {
  if (!logDir) return false;
  try {
    if (!fs.existsSync(logDir)) return true;
    const files = fs.readdirSync(logDir);
    for (const name of files) {
      if (/^(app|error)\.log(\.\d+)?$/i.test(name)) {
        fs.rmSync(path.join(logDir, name), { force: true });
      }
    }
    return true;
  } catch {
    return false;
  }
}

module.exports = {
  init,
  getLogDir,
  getLogFilePath,
  maskSensitive,
  logError,
  readRecentLog,
  clearLogs
};
