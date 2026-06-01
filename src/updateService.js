const DEFAULT_UPDATE_URL = 'https://raw.githubusercontent.com/nanayaD/cst-update/main/latest.json';
const TEST_UPDATE_URL = 'https://raw.githubusercontent.com/nanayaD/cst-update/main/latest-test.json';
const REQUEST_TIMEOUT_MS = 8000;

function parseVersion(version) {
  const parts = String(version || '').trim().split('.');
  if (parts.length !== 3) return null;
  const numbers = parts.map((part) => {
    if (!/^\d+$/.test(part)) return NaN;
    return Number(part);
  });
  if (numbers.some((num) => !Number.isInteger(num) || num < 0)) return null;
  return numbers;
}

function compareVersions(a, b) {
  const left = parseVersion(a);
  const right = parseVersion(b);
  if (!left || !right) {
    throw new Error('버전 형식은 major.minor.patch 형식이어야 합니다.');
  }
  for (let i = 0; i < 3; i += 1) {
    if (left[i] > right[i]) return 1;
    if (left[i] < right[i]) return -1;
  }
  return 0;
}

function ensureHttpsUrl(value, fieldName) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  let parsed;
  try {
    parsed = new URL(raw);
  } catch {
    throw new Error(`${fieldName} 주소 형식이 올바르지 않습니다.`);
  }
  if (parsed.protocol !== 'https:') {
    throw new Error(`${fieldName} 주소는 HTTPS만 사용할 수 있습니다.`);
  }
  return parsed.toString();
}

function sanitizeText(value, maxLength = 500) {
  return String(value || '').replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, maxLength);
}

function normalizeLatestInfo(raw) {
  const data = raw && typeof raw === 'object' ? raw : {};
  const version = sanitizeText(data.version, 32);
  if (!parseVersion(version)) {
    throw new Error('업데이트 정보의 version 형식이 올바르지 않습니다.');
  }

  const packageType = ['portable', 'installer'].includes(data.packageType)
    ? data.packageType
    : 'portable';

  const notes = Array.isArray(data.notes)
    ? data.notes.map((item) => sanitizeText(item, 240)).filter(Boolean).slice(0, 20)
    : [];

  return {
    version,
    releaseDate: sanitizeText(data.releaseDate, 32),
    downloadUrl: ensureHttpsUrl(data.downloadUrl, 'downloadUrl'),
    packageType,
    required: Boolean(data.required),
    migrationMessage: sanitizeText(data.migrationMessage, 500),
    notes
  };
}

async function fetchJson(url) {
  const updateUrl = ensureHttpsUrl(url || DEFAULT_UPDATE_URL, '업데이트 정보');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(updateUrl, {
      method: 'GET',
      cache: 'no-store',
      signal: controller.signal
    });
    if (!response.ok) {
      throw new Error(`업데이트 정보를 가져오지 못했습니다. (${response.status})`);
    }
    return await response.json();
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('업데이트 확인 시간이 초과되었습니다.');
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

async function checkForUpdates({ currentVersion, url = DEFAULT_UPDATE_URL } = {}) {
  const latest = normalizeLatestInfo(await fetchJson(url));
  const comparison = compareVersions(latest.version, currentVersion);
  return {
    currentVersion,
    checkedAt: new Date().toISOString(),
    updateUrl: ensureHttpsUrl(url || DEFAULT_UPDATE_URL, '업데이트 정보'),
    available: comparison > 0,
    latest
  };
}

module.exports = {
  DEFAULT_UPDATE_URL,
  TEST_UPDATE_URL,
  compareVersions,
  checkForUpdates,
  ensureHttpsUrl,
  normalizeLatestInfo
};
