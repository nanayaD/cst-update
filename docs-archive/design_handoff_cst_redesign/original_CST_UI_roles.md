# CST UI 역할 설명서 (디자인 핸드오프용)

이 문서는 **CST**(CoC 일본어 시나리오 번역 + 문맥 교정 도구)의 현재 UI를 디자인 AI/디자이너에게 전달하기 위한 설명서입니다.
함께 제공되는 `CST_UI_design_handoff.html`은 현재 화면을 브라우저에서 그대로 볼 수 있는 단일 파일 스냅샷입니다.

> **읽는 법**: 실제 동작 로직은 `renderer.js`(바닐라 JS)에 있고, 마크업/스타일은 `index.html` + `styles.css`입니다. 아래 표의 `ID`는 실제 코드와 1:1로 일치하므로, **구조와 ID를 유지한 채 시각 디자인만 바꿔 주시면** 코드에 그대로 반영됩니다.

---

## 0. 앱 개요

- **플랫폼**: Electron 데스크톱 앱 (Windows), 단일 창.
- **기술 스택**: 순수 HTML + CSS + 바닐라 JS. **React/JSX 아님.**
- **두 개의 도구**가 한 창 안에서 상단 탭으로 전환됩니다.
  1. **번역기** (`#translatorTool`) — 일본어 CoC 시나리오 → 한국어 번역.
  2. **문맥교정기** (`#editorTool`) — 한국어 시나리오 문장 정리/교정.
- **테마 4종**: 블루(기본), 핑크, 그린, 다크. `body[data-theme="pink|green|dark"]`로 전환하며, 기본(블루)은 `:root` 변수를 사용합니다. 색은 전부 CSS 변수(`--bg`, `--panel`, `--text`, `--line`, `--accent` 등)로 관리됩니다.

### 공통 레이아웃
- 최상단 **topbar**(`.topbar`): 좌측 타이틀(`CST` + 부제), 우측 도구 전환 탭(`.tool-switch`) + 테마 선택(`#themeSelect`).
- 그 아래 작업 영역. 한 번에 한 도구(`.tool-view.active`)만 표시됩니다.

---

## 1. 번역기 화면 (`#translatorTool`)

좌측 **설정 패널**(`.settings-panel`) + 우측 **작업 패널**(`.main-panel`) 2단 구성입니다.

### 1-1. 설정 패널 (`#settingsPanel`) — 접기 가능

| 요소 / ID | 역할 | 동적 상태 |
|---|---|---|
| `#toggleSettings` (`<` 버튼) | 설정 패널 접기/펼치기 | 접으면 `.workspace`에 `settings-collapsed` 부여 → 패널이 48px 폭으로 축소 |
| `#modeHelpTitle` / `#modeHelpText` | 현재 선택된 번역 모드의 이름·설명 카드 | 모드 라디오를 바꾸면 내용이 갱신됨 |
| `#provider` | API 제공사 선택 (OpenAI / Gemini) | 바꾸면 해당 제공사의 키·모델로 전환 |
| `#apiKey` | API 키 입력 (`type=password`) | |
| `#model` | 모델 드롭다운 | **비어 있음 → 새로고침 전까지 placeholder** "API 키를 입력하고 모델 새로고침을 누르세요" → 새로고침 후 "모델을 선택해주세요" + (추천/전체) 그룹. JS가 동적으로 채움 |
| `#refreshModels` (↻) | 제공사에서 모델 목록 새로고침 | |
| `#modelHint` | 모델 입력 보조 안내 | 단종된 모델 재선택 안내 등으로 문구가 바뀜 |
| `#charLimit` | 1회 번역 글자수 제한 (숫자) | |
| `#includeCocNotes` | "CoC 7판 참고 메모 사용" 체크박스 | |
| `#saveSettings` / `#saveStatus` | 설정 저장 버튼 + 상태 pill | 저장 상태 텍스트가 pill에 표시됨 |
| **오류 로그 영역** (`.log-tools`) | `#openLogFolder`(폴더 열기) · `#copyLogs`(복사) · `#clearLogs`(삭제) + `#logStatus`(결과 줄) | 작업 결과/오류가 `#logStatus`에 표시(오류 시 `.is-error`) |

### 1-2. 작업 패널 (`.main-panel`)

| 요소 / ID | 역할 | 동적 상태 |
|---|---|---|
| `.mode-row` 라디오 4개 | 번역 모드: 원문 충실(`faithful`) / 자연스러운(`natural`) / 핸드아웃 보존(`handout`) / CoC 7판 메모 중심(`coc7`) | 선택 시 좌측 모드 도움말 갱신 |
| `#sourceText` | 일본어 원문 입력 textarea | |
| `#charCounter` | "현재 글자수: N / 제한" | 입력에 따라 실시간 갱신 |
| `#limitWarning` | 글자수 초과 경고 | 평소 `hidden`, 제한 초과 시 표시 |
| `#contextMemo` | 보조 메모(인물명·KPC·호칭 처리 등) textarea | |
| `#translateBtn` | 번역 실행 | **모델 미선택/글자수 초과/실행 중이면 비활성** |
| `#clearBtn` | 입력 비우기 | |
| `#cancelBtn` | 번역 중지 | **실행 중에만 활성**, 평소 `disabled` |
| `#runStatus` | 실행 상태 메시지(우측) | "번역 중…", "복사 완료" 등 |
| `#copyAll` | 결과 전체 복사 | |
| **결과 4섹션** | `#translation`(번역문) · `#cocNotes`(CoC 7판 참고 메모) · `#reviewItems`(검토 필요 항목) · `#nameNotes`(고유명사/호칭 메모) — 각 `<pre>` + 개별 복사 버튼(`data-copy-target`) | JS가 번역 결과를 섹션별로 채움 |

---

## 2. 문맥교정기 화면 (`#editorTool`)

상단 API 패널 + 도구 버튼 패널 + 하단 3분할(원문/출력/미리보기) 구성입니다.
**API 설정은 번역기와 공유**됩니다(같은 제공사/키/모델).

### 2-1. API 패널 (`.editor-api-panel`)
| ID | 역할 |
|---|---|
| `#editorProvider` / `#editorApiKey` / `#editorModel` / `#editorRefreshModels` | 번역기와 동일한 제공사·키·모델 컨트롤(동기화됨) |
| `#editorSaveSettings` | API 설정 저장 |
| `#editorModelHint` | 모델 안내 문구 |

### 2-2. 도구 패널 (`.editor-tools-panel`)
| 섹션 | 요소 / 속성 | 역할 |
|---|---|---|
| 탐사자 지칭 설정 | `#editorTargetName` | 탐사자 호칭(예: 당신 / PC 이름 / 형사) |
| | `#editorTargetDialogue` | "대사 안 지칭도 변경" 체크 |
| | `#editorTargetOmit` | "반복 지칭 생략 허용" 체크(기본 on) |
| | `#editorApplyTarget` | 호칭만 로컬 적용(API 미사용) |
| 문장·문맥 정리 | `data-editor-clean-mode="preserve|natural|remove_narrator"` | 원문 유지 정리 / 자연 서술 정리 / 화자 개입 제거 |
| | `data-editor-narration-mode="preserve|natural"` | 대사 유지 + 서술 보존/자연 |
| | `#editorCancelBtn` | 교정 중지(**실행 중에만 활성**) |
| 형식 정리 | `#editorLinebreak` | 줄바꿈만(로컬) |
| | `data-editor-split-action="split|dialogue_only|narration_only"` | 대사/서술 분리 · 대사만 · 서술만 추출(로컬) |
| | `#editorSendTranslation` | 번역기 결과를 교정 원문으로 가져오기 |
| | `#editorStatus` | 교정 상태 메시지 |

### 2-3. 하단 3분할 (`.context-editor-layout`)
| ID | 역할 |
|---|---|
| `#editorSourceText` (+ `#editorClearSource`) | 교정 원문 textarea |
| `#editorOutputText` (+ `#editorCopyOutput` / `#editorClearOutput`) | 출력문 textarea(직접 수정 가능) |
| `#editorPreview` / `#editorPreviewCount` | 출력문을 대사/서술 블록 카드로 미리보기 |

---

## 3. 반응형 / 상태 클래스 (디자인 시 고려)

- **`.tool-view`**: 평소 `display:none`, `.active`일 때만 표시. (한 번에 한 도구)
- **설정 패널 접힘**: `.workspace.settings-collapsed` → 설정 폭 48px.
- **브레이크포인트**
  - **≥1500px**: 번역기 결과 패널이 우측 별도 열로 분리(2단), 보조 메모가 원문 아래로 쌓임.
  - **≤1100px**: 워크스페이스/에디터가 1단으로, 모드 라디오 2×2.
  - **≤720px**: topbar 세로 스택, 액션 1열, 탭 전체폭.
- **버튼 종류**: `.primary-btn`(주요) / `.secondary-btn`(보조) / `.ghost-btn`(약한 보조) / `.danger-btn`(위험·취소·삭제). 비활성은 `opacity` 낮춤.

---

## 4. 디자인 변경 시 부탁

1. **ID와 DOM 구조(중첩 관계)는 유지**해 주세요. 동작 로직(`renderer.js`)이 ID로 요소를 찾습니다.
2. 색은 가능하면 **CSS 변수(`:root` + `body[data-theme=...]`)**로 유지해 4개 테마가 함께 갱신되게 해 주세요.
3. 첨부 HTML의 모델 드롭다운 옵션·결과 텍스트·예시 문구는 **데모용 더미**입니다(실제 앱은 JS가 채움). 시각 확인용으로만 봐 주세요.
