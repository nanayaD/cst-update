# Handoff: CST UI 리디자인 (라일락 민트 테마 + 글래스/카드 레이아웃)

## Overview
**CST** = CoC(크툴루의 부름) 일본어 시나리오를 한국어로 **번역**하고, 한국어 문장을 **문맥 교정**하는 Electron 데스크톱 앱입니다.
이 핸드오프는 기존 CST UI를 최신 트렌드(은은한 그라데이션/글래스, 넉넉한 여백·큰 라운드, 섹션이 분명한 카드형 레이아웃)로 개선한 **리디자인 결과**입니다.
주요 변경: ① 신규 **라일락 민트** 테마 추가, ② 번역기 화면 카드형 재구성, ③ 문맥교정기를 번역기와 동일한 **좌(설정)/우(작업) 2단**으로 재구성 + 버튼 그룹 정리, ④ 접기(collapse) UX, ⑤ 복사/수정 **토스트 알림**.

## About the Design Files
이 번들의 `CST UI Redesign.html`은 **HTML로 만든 디자인 레퍼런스**입니다 — 의도한 모양과 동작을 보여주는 프로토타입이며, 그대로 복사해 출시하는 production 코드가 아닙니다.
실제 앱은 **Electron + 순수 HTML/CSS/바닐라 JS (React/JSX 아님)** 이고 마크업은 `index.html`, 스타일은 `styles.css`, 동작 로직은 `renderer.js`에 있습니다.
**할 일**: 이 디자인을 기존 CST 코드베이스의 `index.html` / `styles.css`에 반영하는 것입니다. 색·간격·라운드·그림자 등 시각 토큰과 레이아웃 구조를 아래 명세대로 옮기되, **모든 기능 요소의 `id`와 DOM 중첩 관계는 보존**해야 `renderer.js`가 그대로 동작합니다. (프로토타입의 하단 `<script>`는 탭/테마/접기/복사 토스트만 보여주는 데모 스텁이며 실제 로직이 아닙니다.)

## Fidelity
**High-fidelity (hifi).** 최종 색상(hex), 타이포 스케일, 간격, 라운드, 그림자, hover/focus 상태, 인터랙션까지 확정된 픽셀 단위 목업입니다. 아래 토큰/측정값을 그대로 사용해 픽셀에 가깝게 재현하세요. 단, 모델 드롭다운 옵션·결과 텍스트·미리보기 예시 문구는 **데모용 더미**이며 실제 앱은 JS가 채웁니다(시각 확인용).

---

## Design Tokens

모든 색은 **CSS 변수**로 정의되어 있고, 테마는 `:root`(블루 기본) + `body[data-theme="..."]`로 전환됩니다. 테마 5종: **블루(기본 `:root`)**, **라일락 민트(`lilac`, 신규 · 기본 표시 테마)**, 핑크(`pink`), 그린(`green`), 다크(`dark`).

### 공통 토큰 (테마 무관)
| 토큰 | 값 |
|---|---|
| `--radius-lg` (카드/패널) | `20px` |
| `--radius-md` (입력/버튼) | `12px` |
| `--radius-sm` (작은 버튼/칩) | `9px` |
| Font family | `"Segoe UI", "Malgun Gothic", system-ui, sans-serif` |
| 글래스 효과 | `backdrop-filter: blur(16px) saturate(1.3)` (패널/topbar/토스트) |
| 배경 그라데이션 워시 | `body::before` 고정 레이어: `radial-gradient(58% 52% at 10% 4%, var(--wash-a), transparent 62%)`, `radial-gradient(54% 50% at 94% 98%, var(--wash-b), transparent 62%)` |
| 체크박스/라디오 | `accent-color: var(--control)`, 17px |

### 라일락 민트 (`body[data-theme="lilac"]`) — 기본 표시 테마, 테마컬러 #CBB8FB / #A6E5EE
| 변수 | 값 | 용도 |
|---|---|---|
| `--bg` | `#f7f4ff` | 페이지 배경 |
| `--wash-a` | `rgba(203,184,251,0.34)` | 배경 워시(라일락) |
| `--wash-b` | `rgba(166,229,238,0.30)` | 배경 워시(민트) |
| `--panel` | `rgba(255,255,255,0.72)` | 글래스 패널 |
| `--panel-soft` | `rgba(255,255,255,0.50)` | 약한 글래스(소섹션) |
| `--text` | `#3c3357` | 본문 |
| `--muted` | `#7c7397` | 보조 텍스트 |
| `--line` | `rgba(170,150,230,0.26)` | 보더/구분선 |
| `--accent` | `#ece4fe` | 약한 강조 배경 |
| `--accent-strong` | `#e0d4fc` | 강조 배경(선택 칩, 복귀 버튼) |
| `--accent-text` | `#4a3d72` | 강조 영역 텍스트 |
| `--accent-border` | `#dccdfb` | 강조 보더 |
| `--accent-grad` | `linear-gradient(135deg, #cbb8fb, #a6e5ee)` | **주요 액션/선택 탭** 그라데이션 |
| `--on-accent` | `#322a52` | 그라데이션 위 텍스트 |
| `--control` | `#a98ef0` | 폼 컨트롤 틴트, focus 보더 |
| `--focus-ring` | `rgba(170,140,250,0.30)` | focus 링(3px) |
| `--danger` | `#c2456b` | 위험/취소/삭제 |
| `--shadow` | `0 18px 40px rgba(130,95,210,0.16)` | 패널 그림자 |
| `--shadow-sm` | `0 4px 18px rgba(130,95,210,0.12)` | 작은 그림자 |
| `--input-bg` | `rgba(255,255,255,0.70)` | 입력 배경 |
| `--button-bg` | `rgba(255,255,255,0.52)` | 보조 버튼 배경 |
| `--pre-bg` | `rgba(255,255,255,0.56)` | 결과 `<pre>` 배경 |

> **블루(기본 `:root`)** 와 핑크/그린/다크 전체 변수 세트는 `CST UI Redesign.html` 상단 `<style>`의 `:root` 및 각 `body[data-theme=...]` 블록에 그대로 정의되어 있습니다. 같은 변수명·구조로 옮기면 5개 테마가 한 번에 적용됩니다. (참고: 테마 셀렉트의 "블루" 옵션 값은 `sky`이며, 매칭 규칙이 없어 `:root` 기본값으로 폴백됩니다 — 의도된 동작.)

---

## Screens / Views

앱은 한 창에서 상단 탭으로 두 도구를 전환합니다. `.tool-view`는 평소 `display:none`, `.active`일 때만 `display:grid`.

### Topbar (`.topbar`)
- 글래스 패널(라운드 20px), 좌우 양끝 정렬, 하단 마진 22px.
- **좌측 브랜드**: 46×46 라운드 13px 로고(라일락→민트 그라데이션 타일 위 흰색 토끼 SVG, 인라인) + 타이틀 `CST`(23px/800) + 부제 `시나리오 번역과 문맥 교정 도구`(13px, muted).
- **우측 액션**: 
  - **도구 전환 탭**(`.tool-switch`): 알약형(pill) 컨테이너, 버튼 2개 `#showTranslator` / `#showEditor`. 활성 탭은 `--accent-grad` 배경 + `--on-accent` 텍스트 + 작은 그림자. 비활성은 투명 배경 muted.
  - **테마 선택**(`#themeSelect`): "테마" 라벨 + `<select>`(높이 40px, min-width 152px, 커스텀 쉐브론). 옵션: 라일락 민트(`lilac`) / 블루(`sky`) / 핑크(`pink`) / 그린(`green`) / 다크 모드(`dark`).

---

### 1) 번역기 (`#translatorTool`, `.workspace`)
좌측 **설정 패널**(좁음) / 우측 **작업 패널**(넓음) 2단 그리드.
`grid-template-columns: var(--settings-width, 340px) minmax(0,1fr); gap:20px;` — 컬럼 폭 전환에 `transition: grid-template-columns 180ms ease`.

#### 1-1. 설정 패널 (`#settingsPanel.settings-panel`) — **세로 레일로 접힘**
글래스 패널(라운드 20px, 패딩 20px, `align-self:start`).

- **헤더**(`.settings-header`): 좌측 `<h2>설정</h2>`(18px/700), 우측 접기 버튼 `#toggleSettings`.
  - 접기 버튼: 32×32, 라운드 9px, 보더 `--line`, 배경 `--button-bg`, 안에 **좌측 화살표 `‹`**(SVG `.settings-arrow`, 9×13). 펼침 상태 = `‹`(왼쪽으로 접기 의미).
- **본문**(`#settingsBody.collapse-body`) — 접힘 대상. 내부 순서:
  1. **모드 도움말 카드**(`.mode-help`): `--accent` 배경 + `--accent-border` 보더. `현재 번역 모드`(라벨) / `#modeHelpTitle`(16px) / `#modeHelpText`(13.5px). 모드 라디오 변경 시 JS가 갱신.
  2. **그룹 라벨** `API 연결`(`.group-label`: 11px/700, uppercase, letter-spacing .07em, muted).
  3. `#provider`(제공사 select) → `#apiKey`(password input) → `#model`(select) + `#refreshModels`(↻ 아이콘 버튼, 새로고침 SVG) — 모델 행은 `.select-with-button`(`grid-template-columns: minmax(0,1fr) 44px`). 보조문 `#modelHint`(small).
  4. **그룹 라벨** `번역 옵션`.
  5. `#charLimit`(number) → `#includeCocNotes`(체크박스 `.toggle-row`).
  6. **저장 액션**(`.settings-actions`): `#saveSettings`(primary) + `#saveStatus`(상태 pill, 알약형).
  7. **오류 로그**(`.log-tools`, 상단 구분선): 제목 + 설명 + 버튼 3개(`#openLogFolder`, `#copyLogs`, `#clearLogs` ← danger) + `#logStatus`(오류 시 `.is-error` → `--danger`).
- **필드 공통**: 라벨 span(13.5px/600 muted) + 컨트롤(높이 42px, 라운드 12px, `--input-bg`). focus 시 `border-color:var(--control)` + `box-shadow:0 0 0 3px var(--focus-ring)`.

##### 접힘 동작 (핵심 인터랙션 — "오른쪽→왼쪽으로 닫히는 세로 레일")
- `#toggleSettings` 클릭 → `#settingsPanel`에 `.collapsed` 토글 (+ `aria-expanded` 갱신).
- `.workspace:has(#settingsPanel.collapsed)` → `--settings-width: 50px` (컬럼 폭이 340→50px로 **가로 애니메이션**하며 닫힘 → 우측 작업 영역이 넓어짐).
- 접힌 패널 = **전체 높이의 얇은 세로 레일**: `align-self:stretch`, `overflow:hidden`, `padding:16px 0`, 배경 `linear-gradient(var(--accent), var(--panel))`, `cursor:pointer`.
  - 본문(`#settingsBody`)은 `display:none`.
  - 헤더는 레일 **위쪽**에 배치(`settings-content`가 `align-items:flex-start; justify-content:center`), 세로 방향 `column-reverse`로 **복귀 버튼이 맨 위**, 그 아래 세로쓰기 `설정` 라벨(`writing-mode:vertical-rl`, 14px/700, letter-spacing .18em, muted).
  - **복귀 버튼**: 34×34, 배경 `--accent-strong`(접힌 블록과 같은 라일락 계열), 보더 `--accent-border`, 텍스트 `--accent-text`. 화살표는 `.settings-arrow`를 `rotate(180deg)` → **`›`**(오른쪽으로 펼치기). transition 220ms.
  - **레일 아무 곳이나 클릭**해도 펼쳐짐(패널 클릭 핸들러; 버튼 클릭과 중복 방지).

#### 1-2. 작업 패널 (`.main-panel`, 패딩 22px)
- **`번역 모드`**(`.panel-title` 16px/700) + **모드 카드 4개**(`.mode-row`, `grid-template-columns: repeat(4,1fr); gap:10px`). 각 카드(`<label>`): 라디오 숨김, 제목 `.m-name`(14px/700) + 설명 `.m-desc`(11.5px muted), 최소높이 64px, 보더 1.5px.
  - 선택 시(`label:has(input:checked)`): `--accent` 배경 + `box-shadow: 0 0 0 2px var(--accent-border) inset` + 작은 그림자, 제목 색 `--accent-text`.
  - 모드: `faithful`(원문 충실/구조·정보 순서 보존), `natural`(자연스러운 번역/읽기 쉽게 의역), `handout`(핸드아웃 보존/HO·비밀 정보 유지), `coc7`(CoC 7판 메모 중심/룰 용어 변환 강조).
- **`.translation-layout`** → **`.editor-grid`**(`grid-template-columns: minmax(0,1.3fr) minmax(280px,0.7fr); gap:16px`):
  - 좌: `일본어 원문` 섹션 — `.section-heading`(h2 15px + `#charCounter`: "현재 글자수: 0 / 3,000") + `#sourceText`(textarea, min-height 240px) + `#limitWarning`(평소 `hidden`, 초과 시 `--danger`).
  - 우: `보조 메모` 섹션 — `#contextMemo`(textarea).
- **액션 행**(`.action-row`, `grid-template-columns: auto minmax(180px,1fr)`):
  - 버튼: `#translateBtn`(primary large, "번역 실행") / `#clearBtn`(secondary, "입력 비우기") / `#cancelBtn`(secondary+danger, "번역 중지", 평소 `disabled`).
  - `#runStatus`(우측 정렬 상태 메시지).
- **결과 패널**(`.result-panel`, 상단 구분선):
  - `.section-heading`: `결과`(h2) + `#copyAll`(secondary small, 복사 아이콘 + "전체 복사").
  - **결과 4섹션**(`.result-section`: 헤더줄(제목 + `.ghost-btn` "복사", `data-copy-target=...`) + `<pre>`): `#translation`(번역문) / `#cocNotes`(CoC 7판 참고 메모) / `#reviewItems`(검토 필요 항목) / `#nameNotes`(고유명사·호칭 메모). `<pre>` max-height 260px, `--pre-bg`.

---

### 2) 문맥교정기 (`#editorTool`, `.editor-workspace`)
번역기와 **동일한 좌(설정)/우(작업) 2단** 그리드(`grid-template-columns: var(--editor-settings-width,380px) minmax(0,1fr); gap:20px; align-items:start`). API 설정은 번역기와 공유.

#### 2-1. 좌측 설정 패널 (`.editor-settings-panel`, 패딩 20px, 좁음)
세로로 쌓인 설정 + 도구. **각 그룹이 개별로 접힘**(collapse-group 패턴).

- **헤더**: `<h2>교정 설정</h2>`.
- **① API 연결 그룹**(`#editorApiGroup.collapse-group`) — 접힘 가능:
  - 토글 버튼 `#editorApiToggle.group-toggle`: 좌측 `API 연결` 라벨 + 우측 **다운 쉐브론**(`.group-chevron`, 12×8). 접히면 쉐브론 `rotate(-90deg)`(→ `›`).
  - 본문 `#editorApiBody.collapse-body`: `#editorProvider` / `#editorApiKey` / `#editorModel` + `#editorRefreshModels` / `#editorSaveSettings`(primary, 전체폭) / `#editorModelHint`.
- **범례**(`.tools-legend`): 작은 카드. `채워진 버튼 = AI 호출(시간·비용)` (스와치 `--accent-grad`) / `외곽선 버튼 = 즉시 처리(로컬, API 미사용)` (스와치 `--button-bg`+보더). **버튼 위계를 직관화하는 핵심 요소.**
- **② / ③ 도구 섹션**(각 `section.tool-section.collapse-group`) — 개별 접힘:
  - 토글 `button.tool-toggle`: 좌측 머리(`.tool-section-head`: h2 14.5px/700 + `.hint` 12px muted) + 우측 다운 쉐브론.
  - 본문 `.collapse-body`(`display:grid; gap:10px; margin-top:11px`).
  - **① 탐사자 지칭 설정**(로컬): `#editorTargetName`(텍스트, 기본값 "당신") / `#editorTargetDialogue`(체크) / `#editorTargetOmit`(체크, 기본 on) / `#editorApplyTarget`(secondary "호칭만 적용"). *(번호 ①②③는 위→아래 순서이며, ①은 API 그룹이 아니라 첫 도구 섹션을 의미 — 코드 라벨 그대로 사용)*
  - **② 문장·문맥 정리 (AI)**: 하위 라벨 `전체 정리` → `data-editor-clean-mode="preserve|natural|remove_narrator"` 3버튼(primary). 하위 라벨 `대사는 그대로 두고 서술만` → `data-editor-narration-mode="preserve|natural"` 2버튼(primary) + `#editorCancelBtn`(secondary+danger "교정 중지", 평소 `disabled`).
  - **③ 형식 정리 (즉시)**: `#editorLinebreak`("줄바꿈만") / `data-editor-split-action="split|dialogue_only|narration_only"`("대사/서술 분리" · "대사만 추출" · "서술만 추출") / `#editorSendTranslation`("번역문 가져오기") — 모두 secondary(외곽선=로컬).
  - 좁은 컬럼이라 버튼 행(`.target-row`, `.editor-button-row`)은 `display:grid; gap:8px`로 **세로 풀폭 정렬**(primary/secondary `width:100%`).
- **상태**: `#editorStatus`(`.editor-status`, 좌측 정렬).

#### 2-2. 우측 작업 패널 (`.editor-main-panel`, 패딩 22px, 넓음)
- **입출력 그리드**(`.editor-io-grid`, `repeat(2,1fr); gap:18px`), 각 카드 패딩 18px:
  - `교정 원문` 섹션: `.section-heading`(h2 + `#editorClearSource` secondary small) + `#editorSourceText`(textarea, min-height 300px).
  - `출력문` 섹션: `.section-heading`(h2 + 액션 `#editorCopyOutput`("전체 복사") + `#editorClearOutput`("출력문 비우기")) + `#editorOutputText`(textarea, 직접 수정 가능).
- **미리보기 블록**(`.preview-block`, 전체폭, 카드):
  - `.section-heading`: `미리보기`(h2) + `#editorPreviewCount`("N개 블록").
  - `#editorPreview.editor-preview`(`display:grid; gap:12px`): **단일 컨테이너 안에 카드가 순차 게시**. 비었을 때 `:empty::before`로 안내문 표시.
  - 각 카드 `article.preview-card[data-kind="narration|dialogue"]`:
    - 헤더줄(`.preview-card-title`): 좌측 `.pc-label`(앞에 점 표식; 대사는 `--control` 점 + 카드 좌측 3px `--control` 보더) + 우측 `.pc-actions` 버튼 2개.
    - **`.pc-edit`("수정")**: 클릭 시 본문 `contenteditable` 토글, 라벨 "수정"↔"완료", 편집 중 카드 `.is-editing`(버튼 `--accent-grad`), 본문에 inset focus 링. 완료 시 "수정 내용을 적용했습니다" 토스트.
    - **`.pc-copy`("복사", 복사 아이콘)**: 본문 텍스트 복사 + "블록을 복사했습니다" 토스트.
    - 본문 `.preview-card-body`(13.5px, line-height 1.6).

---

### 토스트 알림 (`#copyToast`) — 신규, 전역
- `<body>` 직하 고정 요소. 위치 `position:fixed; left:50%; bottom:30px`, 알약형, 글래스(blur), 보더 `--accent-border`, 그림자 `--shadow`, 좌측 체크 아이콘(`--control`) + `#copyToastText`.
- 표시: `.show` 클래스로 `opacity 0→1` + `translateY(14px→0)`, 200ms. 1800ms 후 자동 숨김.
- 트리거: 번역기 `[data-copy-target]` 개별 복사, `#copyAll`("전체 결과를 복사했습니다"), 교정기 `#editorCopyOutput`("출력문을 복사했습니다"), 미리보기 `.pc-copy`/`.pc-edit`.

---

## Interactions & Behavior (요약)
- **탭 전환**: `#showTranslator`/`#showEditor` → 해당 `.tool-view`에 `.active`, 버튼 `.active` 동기화.
- **테마 전환**: `#themeSelect` change → `document.body.dataset.theme = value`.
- **설정 레일 접기(번역기)**: `#toggleSettings` → `#settingsPanel.collapsed` 토글 + `:has()`로 컬럼 폭 50px. 레일 클릭으로 펼침.
- **그룹 접기(교정기)**: `#editorApiToggle` → `#editorApiGroup.collapsed`; 각 `.tool-section .tool-toggle` → 자신의 `.collapse-group.collapsed` 토글. 쉐브론 `rotate(-90deg)`.
- **접힘 애니메이션**: `.collapse-body { overflow:hidden; max-height:640px → 0; opacity:1→0; transition 260ms }`. (번역기 본문은 flex min-height 충돌을 피해 `display:none`로 처리.)
- **복사/수정 알림**: 위 토스트 규칙.
- **버튼 위계**: `.primary-btn`(그라데이션 채움, 주요/AI 호출) / `.secondary-btn`(외곽선, 보조/로컬) / `.ghost-btn`(약한 보조) / `.danger-btn`(위험·취소·삭제, `color-mix`로 danger 틴트). 비활성은 `opacity:.45~.5` + `cursor:not-allowed`.
- **hover**: primary `translateY(-1px)` + 그림자 강화; secondary `--accent` 배경 + accent 보더; 탭/토글 hover muted→text.
- **focus**: 입력/셀렉트/textarea `border-color:var(--control)` + 3px `--focus-ring`.

## State Management (renderer.js가 채우는 동적 상태)
- `#model`/`#editorModel`: 비어 있음 → 키 입력 후 `#refreshModels`로 채움. `#modelHint`/`#editorModelHint` 문구 변동.
- `#translateBtn`: 모델 미선택/글자수 초과/실행 중 → `disabled`. `#cancelBtn`/`#editorCancelBtn`: 실행 중에만 활성.
- `#charCounter` 실시간, `#limitWarning` 초과 시 노출.
- 결과 4섹션/`#editorOutputText`/`#editorPreview`: JS가 채움. `#editorProvider/ApiKey/Model`은 번역기와 동기화.
- 접힘 상태(`collapsed`)는 UI 로컬 상태 — 필요 시 `localStorage`로 영속화 권장.

## Responsive
- **≥1500px**: `.translation-layout`이 원문/결과 2열로 분리(결과가 좌측 보더 가진 별도 열), 보조 메모가 원문 아래로 스택.
- **≤1100px**: `.workspace`/`.editor-workspace`/`.editor-grid` 1열, 모드 카드 2×2, `.editor-io-grid` 1열, `.editor-button-row` 2열. (이 폭에서 레일 폭 변수는 무시되고 패널이 전체폭.)
- **≤720px**: topbar 세로 스택, `.topbar-actions` 풀폭 세로, 액션 1열, 탭 풀폭.

## Assets
- **로고**: topbar에 인라인 SVG(라일락→민트 그라데이션 라운드 타일 + 흰색 토끼). 외부 파일 의존 없음. (원본 프로젝트의 `icons/pastel-b.svg` 계열과 동일 콘셉트.)
- **아이콘**: 새로고침(↻)·복사·체크 등은 인라인 stroke SVG(`stroke="currentColor"`). 외부 아이콘 폰트/라이브러리 불필요.
- 외부 폰트 import 없음(시스템 폰트 스택 사용).

## Files
- `CST UI Redesign.html` — 리디자인 단일 파일 스냅샷(인라인 `<style>` + 데모 `<script>`). **시각/토큰의 단일 진실 소스.**
- `original_CST_UI_roles.md` — 원본 앱의 ID·역할 명세(기능 계약 참고용). 리디자인에서 모든 기능 ID는 보존됨. 단, 레이아웃 클래스 일부가 변경됨:
  - (변경) 교정기: 기존 `.editor-api-panel` / `.editor-tools-panel` / `.context-editor-layout` → 신규 `.editor-settings-panel`(좌) / `.editor-main-panel`(우) / `.editor-io-grid`.
  - (변경) 번역기 설정 접기: 기존 `.workspace.settings-collapsed`(48px 가로 축소) → 신규 `#settingsPanel.collapsed` + `.workspace:has(...)`로 세로 레일(50px).
  - (신규 래퍼/요소, 기능 ID 아님): `#settingsBody`, `#editorApiGroup`/`#editorApiToggle`/`#editorApiBody`, `.tool-toggle`, `.collapse-body`, `#copyToast`/`#copyToastText`, 미리보기 `.pc-edit`/`.pc-copy`.

## 구현 시 부탁
1. **모든 기능 `id`와 DOM 중첩 구조 보존** — `renderer.js`가 id로 요소를 찾습니다. (신규 래퍼는 자유롭게 추가 가능)
2. 색은 **CSS 변수(`:root` + `body[data-theme=...]`)** 로 유지 — 5개 테마가 함께 갱신됩니다.
3. `:has()` 셀렉터 사용(번역기 레일·모드 카드 선택) — Electron(Chromium) 최신 버전 OK. 만약 매우 구버전 타깃이면 `:has()` 대신 토글 시 `.workspace`에도 클래스를 부여하는 방식으로 대체하세요.
4. 프로토타입의 더미 텍스트/옵션은 무시하고 실제 JS 바인딩을 유지하세요.
