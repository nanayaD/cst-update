// 텍스트 레이어가 있는 가로쓰기 PDF에서 본문 텍스트를 추출한다.
// - 이미지(스캔) PDF, 세로쓰기 PDF는 대상이 아니다(추출이 비거나 순서가 어긋날 수 있음).
// - 루비/후리가나는 글꼴 크기·위치로 역추정해 `한자(루비)` 형태로 합칠 수 있다(휴리스틱).
// - 일본어 글자 사이에 끼는 불필요한 공백은 제거할 수 있다.
//
// 레이아웃 재구성 로직은 순수 함수(assemblePage)로 분리해 PDF 없이도 단위 테스트할 수 있게 했다.
// pdfjs 연결부(extractText)는 얇게 유지하고 실제 PDF 스모크 테스트로 검증한다.

const path = require('node:path');
const fs = require('node:fs/promises');

// pdfjs-dist 4.x는 ESM(.mjs)만 제공한다. CommonJS인 메인 프로세스에서는 동적 import로 불러온다.
let pdfjsPromise = null;
function loadPdfjs() {
  if (!pdfjsPromise) {
    pdfjsPromise = import('pdfjs-dist/legacy/build/pdf.mjs');
  }
  return pdfjsPromise;
}

// node_modules/pdfjs-dist/<name>/ 경로. dev와 패키징(asar) 모두에서 동작한다.
// pdfjs의 NodeCMapReaderFactory가 fs.promises.readFile로 읽으며, Electron은 asar 내부도 투명하게 읽는다.
function pdfjsAssetDir(name) {
  const base = path.dirname(require.resolve('pdfjs-dist/package.json'));
  return path.join(base, name) + path.sep;
}

// --- 순수 레이아웃 재구성 ----------------------------------------------------

// CJK(한자·가나·전각 문자) 판정용 문자 클래스.
const CJK_CLASS =
  '\\u3040-\\u30FF\\u3005\\u3006\\u30FC\\u3400-\\u4DBF\\u4E00-\\u9FFF\\uF900-\\uFAFF\\uFF00-\\uFFEF';
const CJK_SPACE_RE = new RegExp(`([${CJK_CLASS}])[ \\t\\u3000]+(?=[${CJK_CLASS}])`, 'g');
const KANA_RE = /[぀-ヿー]/g;

// 일본어 글자 사이에 끼는 공백만 제거한다(라틴·숫자 주변 공백은 보존).
function stripCjkSpaces(text) {
  // 한 번의 replace로는 "あ あ あ"의 연속 공백이 한 칸씩만 처리되므로 변화가 없을 때까지 반복한다.
  let prev;
  let out = text;
  do {
    prev = out;
    out = out.replace(CJK_SPACE_RE, '$1');
  } while (out !== prev);
  return out;
}

// 루비 후보 판정: 대부분 가나로 이루어진 짧은 텍스트.
function isMostlyKana(str) {
  const compact = str.replace(/\s+/g, '');
  if (!compact) return false;
  const kana = compact.match(KANA_RE);
  return kana ? kana.length / compact.length >= 0.5 : false;
}

// pdfjs 텍스트 조각 → {str, x, y, w, size, rotated}
function normalizeItem(item) {
  const t = item.transform || [1, 0, 0, 1, 0, 0];
  const size = Math.hypot(t[2], t[3]) || Math.hypot(t[0], t[1]) || 0;
  const skew = Math.hypot(t[1], t[2]);
  return {
    str: typeof item.str === 'string' ? item.str : '',
    x: t[4],
    y: t[5],
    w: typeof item.width === 'number' ? item.width : 0,
    size,
    rotated: size > 0 && skew > size * 0.2
  };
}

// 본문 글꼴 크기(최빈값)를 글자 수 가중으로 추정한다.
function estimateBodySize(items) {
  const weights = new Map();
  for (const it of items) {
    const visible = it.str.replace(/\s+/g, '').length;
    if (!visible || it.size <= 0) continue;
    const key = Math.round(it.size * 2) / 2; // 0.5pt 단위로 버킷
    weights.set(key, (weights.get(key) || 0) + visible);
  }
  let bestSize = 0;
  let bestWeight = -1;
  for (const [size, weight] of weights) {
    if (weight > bestWeight) {
      bestWeight = weight;
      bestSize = size;
    }
  }
  return bestSize;
}

// 같은 베이스라인의 조각들을 한 줄로 묶는다. 위(큰 y)에서 아래로 정렬.
function groupLines(items, tolerance) {
  const sorted = items.slice().sort((a, b) => b.y - a.y);
  const lines = [];
  let current = null;
  for (const it of sorted) {
    if (!current || Math.abs(it.y - current.anchorY) > tolerance) {
      current = { anchorY: it.y, items: [it], maxSize: it.size };
      lines.push(current);
    } else {
      current.items.push(it);
      if (it.size > current.maxSize) current.maxSize = it.size;
    }
  }
  for (const line of lines) {
    line.items.sort((a, b) => a.x - b.x);
    line.y = line.items.reduce((sum, it) => sum + it.y, 0) / line.items.length;
  }
  return lines;
}

// 루비 줄을 바로 아래 본문 줄에 x겹침 기준으로 붙인다.
function attachRuby(bodyLine, rubyLine) {
  for (const ruby of rubyLine.items) {
    if (!ruby.str.trim()) continue;
    const rubyCenter = ruby.x + ruby.w / 2;
    let target = null;
    let bestDist = Infinity;
    for (const base of bodyLine.items) {
      const start = base.x;
      const end = base.x + (base.w || base.size);
      if (rubyCenter >= start && rubyCenter <= end) {
        target = base;
        break;
      }
      const center = (start + end) / 2;
      const dist = Math.abs(center - rubyCenter);
      if (dist < bestDist) {
        bestDist = dist;
        target = base;
      }
    }
    if (target) target.ruby = (target.ruby || '') + ruby.str;
  }
}

// 한 줄을 문자열로. 가로 간격이 크면 공백을 넣어 단어 구분을 복원한다.
function lineToString(line, { spaceGap }) {
  let out = '';
  let prevEnd = null;
  let prevHadWidth = false;
  for (const it of line.items) {
    if (prevEnd !== null && prevHadWidth && it.x - prevEnd > spaceGap) {
      out += ' ';
    }
    out += it.str + (it.ruby ? `(${it.ruby})` : '');
    prevEnd = it.x + it.w;
    prevHadWidth = it.w > 0;
  }
  return out.replace(/[ \t]+$/g, '');
}

function percentile(sortedAsc, p) {
  if (!sortedAsc.length) return 0;
  const idx = Math.min(sortedAsc.length - 1, Math.max(0, Math.round((sortedAsc.length - 1) * p)));
  return sortedAsc[idx];
}

const CJK_CHAR_RE = new RegExp(`[${CJK_CLASS}]`);

// 두 줄을 이어 붙일 때의 연결 문자. CJK 경계면 공백 없이, 그 외에는 공백 한 칸.
function joinGlue(prev, next) {
  const a = prev.slice(-1);
  const b = next.slice(0, 1);
  if (!a || !b) return '';
  if (CJK_CHAR_RE.test(a) || CJK_CHAR_RE.test(b)) return '';
  if (/\s$/.test(prev) || /^\s/.test(next)) return '';
  return ' ';
}

// 페이지 모양대로 끊긴 줄바꿈을 문단 단위로 합친다(가로쓰기·단일 단 가정).
// lineObjs: [{ text, startX, endX, y }] (위 → 아래 순서)
function reflowParagraphs(lineObjs, bodySize) {
  const lines = lineObjs.filter((l) => l.text.length > 0);
  if (!lines.length) return [];

  const lefts = lines.map((l) => l.startX).sort((a, b) => a - b);
  const rights = lines.map((l) => l.endX).sort((a, b) => a - b);
  const leftMargin = percentile(lefts, 0.15);
  const rightMargin = percentile(rights, 0.85);
  const fullTol = bodySize * 1.6; // 우측 여백 근처면 워드랩(이어 붙임)
  const indentTol = bodySize * 0.8; // 들여쓰기 = 새 문단
  const paraGap = bodySize * 1.9; // 세로 간격이 크면 문단 분리

  const isFull = (l) => l.endX >= rightMargin - fullTol;
  const isIndented = (l) => l.startX > leftMargin + indentTol;

  const out = [];
  let buf = '';
  let prevFull = false;
  for (let i = 0; i < lines.length; i += 1) {
    const cur = lines[i];
    if (buf === '') {
      buf = cur.text;
    } else if (prevFull && !isIndented(cur)) {
      buf += joinGlue(buf, cur.text) + cur.text;
    } else {
      out.push(buf);
      buf = cur.text;
    }
    prevFull = isFull(cur);

    const next = lines[i + 1];
    const gap = next ? cur.y - next.y : Infinity;
    if (!next || gap > paraGap) {
      out.push(buf);
      buf = '';
      if (next) out.push(''); // 문단 사이 빈 줄
    }
  }
  if (buf) out.push(buf);
  return out;
}

// 페이지 텍스트 조각 배열을 사람이 읽는 텍스트로 재구성한다.
// rawItems: pdfjs getTextContent().items (또는 동일 형태의 {str, transform, width})
function assemblePage(rawItems, options = {}) {
  const { ruby = true, stripSpaces = true, reflow = true } = options;
  const items = (rawItems || []).map(normalizeItem).filter((it) => it.str.length);
  if (!items.length) return '';

  const bodySize = estimateBodySize(items) || items[0].size || 1;
  const lineTol = bodySize * 0.5;
  const rubyMaxGap = bodySize * 2;
  const spaceGap = bodySize * 0.3;

  let lines = groupLines(items, lineTol);

  if (ruby) {
    for (const line of lines) {
      const text = line.items.map((it) => it.str).join('');
      line.isRuby = line.maxSize < bodySize * 0.78 && isMostlyKana(text);
    }
    const merged = [];
    let pending = [];
    for (const line of lines) {
      if (line.isRuby) {
        pending.push(line);
        continue;
      }
      for (const rubyLine of pending) {
        if (rubyLine.y - line.y > 0 && rubyLine.y - line.y <= rubyMaxGap) {
          attachRuby(line, rubyLine);
        } else {
          merged.push(rubyLine); // 본문과 멀리 떨어진 작은 줄은 일반 텍스트로 출력
        }
      }
      pending = [];
      merged.push(line);
    }
    for (const rubyLine of pending) merged.push(rubyLine);
    lines = merged;
  }

  const lineObjs = lines.map((line) => ({
    text: lineToString(line, { spaceGap }),
    startX: line.items.length ? line.items[0].x : 0,
    endX: line.items.reduce((max, it) => Math.max(max, it.x + (it.w || it.size)), 0),
    y: line.y
  }));

  const outLines = reflow ? reflowParagraphs(lineObjs, bodySize) : lineObjs.map((l) => l.text);

  let text = outLines.join('\n');
  if (stripSpaces) text = stripCjkSpaces(text);
  return text;
}

// --- pdfjs 연결 --------------------------------------------------------------

class PdfCancelledError extends Error {
  constructor() {
    super('cancelled');
    this.name = 'PdfCancelledError';
    this.cancelled = true;
  }
}

// filePath의 PDF에서 텍스트를 추출한다.
// options: { ruby, stripSpaces, reflow }
// hooks: { isCancelled(): boolean, onProgress(page, total): void }
async function extractText(filePath, options = {}, hooks = {}) {
  const { ruby = true, stripSpaces = true, reflow = true } = options;
  const data = new Uint8Array(await fs.readFile(filePath));

  const pdfjs = await loadPdfjs();
  const loadingTask = pdfjs.getDocument({
    data,
    cMapUrl: pdfjsAssetDir('cmaps'),
    cMapPacked: true,
    standardFontDataUrl: pdfjsAssetDir('standard_fonts'),
    isEvalSupported: false,
    useSystemFonts: false,
    verbosity: 0
  });

  let doc;
  try {
    doc = await loadingTask.promise;
  } catch (error) {
    if (error && error.name === 'PasswordException') {
      const e = new Error('암호가 걸린 PDF는 추출할 수 없습니다.');
      e.code = 'PDF_PASSWORD';
      throw e;
    }
    const e = new Error('PDF를 여는 데 실패했습니다. 손상되었거나 지원하지 않는 형식일 수 있습니다.');
    e.code = 'PDF_OPEN_FAILED';
    throw e;
  }

  const pageCount = doc.numPages;
  const pages = [];
  let totalItems = 0;
  let rotatedItems = 0;

  try {
    for (let n = 1; n <= pageCount; n += 1) {
      if (hooks.isCancelled && hooks.isCancelled()) throw new PdfCancelledError();
      const page = await doc.getPage(n);
      const content = await page.getTextContent();
      const items = content.items.filter((it) => typeof it.str === 'string');
      totalItems += items.length;
      for (const it of items) {
        const t = it.transform;
        if (t && Math.hypot(t[1], t[2]) > Math.hypot(t[2], t[3]) * 0.2) rotatedItems += 1;
      }
      pages.push(assemblePage(items, { ruby, stripSpaces, reflow }));
      page.cleanup();
      if (hooks.onProgress) hooks.onProgress(n, pageCount);
    }
  } finally {
    await doc.cleanup().catch(() => {});
    loadingTask.destroy().catch(() => {});
  }

  const text = pages.join('\n\n').replace(/\n{3,}/g, '\n\n').trim();
  const verticalSuspected = totalItems > 0 && rotatedItems / totalItems > 0.3;

  return {
    text,
    pageCount,
    charCount: text.length,
    empty: text.length === 0,
    verticalSuspected
  };
}

module.exports = {
  extractText,
  PdfCancelledError,
  // 테스트용 내부 함수
  _assemblePage: assemblePage,
  _stripCjkSpaces: stripCjkSpaces,
  _isMostlyKana: isMostlyKana
};
