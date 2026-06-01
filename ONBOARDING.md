# CoC JP Scenario Translator Onboarding

## Project Goal

Build a Windows-friendly Electron desktop app that helps users partially translate Japanese Call of Cthulhu scenario text into Korean.

The app is not a full-document translator. It is a focused helper for pasted paragraphs, scene descriptions, handouts, NPC dialogue, judgment text, and similar scenario fragments.

Core output should preserve:

- Original meaning and information order
- Scenario clues and conditions
- Proper nouns and honorifics
- TRPG scenario tone
- CoC 6th edition expressions with CoC 7th edition reference notes

Primary source document:

- `docs-archive/coc_jp_scenario_translator_dev_instructions.md` (moved to `docs-archive/` during the 2026-06-01 doc cleanup)

## Development Principles

- **⚠️ BUILD/RELEASE RULE: Always get explicit user approval BEFORE building a portable exe package (`npm run build:portable`) or any release artifact.** Do not package or rebuild the exe on your own initiative — make the source/code changes, run `npm run check`, report what changed, and wait for the user to approve packaging. Building/releasing reaches end users and must be the user's decision.
- Complete the MVP before adding advanced features.
- Keep the UI simple, direct, and usable for repeated translation work.
- Never hardcode an OpenAI API key.
- Store user settings only on the local PC.
- Treat translation history as optional and off by default.
- Make API, network, input limit, and model errors understandable to non-technical users.
- Keep CoC 7th edition notes separate from the translated text.
- Mark uncertain rule conversions as review-needed instead of deciding automatically.

## MVP Scope

1. Electron app launch
2. API key settings UI
3. Japanese source input area
4. Character counter and input limit warning
5. Translation mode selection
6. Translation execution
7. Structured result output
8. Copy result buttons
9. CoC 7th edition reference notes
10. Review-needed section

## Later Scope

- Editable glossary
- Translation history
- Prompt template editor
- Per-model settings
- Dark mode
- Output format customization
- Windows installer build
- Full CST saved-data reset: delete the app `userData` folder contents (settings, logs, cache/local storage) after a strong warning, then quit the app. This is intentionally later-scope; the first release only deletes stored API key values.

## Planned Build Order

### Phase 1: Project Scaffold

- Create `package.json`.
- Add Electron entry point.
- Add renderer HTML, CSS, and JavaScript files.
- Add a preload bridge for safe app-to-renderer communication.
- Add local settings storage.

### Phase 2: MVP UI

- Build a single-window app.
- Add settings panel for API key, model, character limit, default mode, and CoC memo toggle.
- Add source text area and context memo area.
- Add translation mode selector.
- Add result sections and copy buttons.
- Add clear loading and error states.

### Phase 3: Prompt and API Flow

- Build prompt templates for each translation mode.
- Include user context memo and glossary data in requests.
- Call the OpenAI API from the main process.
- Return structured text sections to the renderer.
- Prevent repeated clicks while translating.

### Phase 4: Local Rule Helpers

- Add lightweight local detectors for CoC terms.
- Surface likely CoC 7th edition notes.
- Surface review-needed items for uncertain conversions.
- Keep local detection as a supplement to model output, not a replacement.

### Phase 5: Verification

- Run the app locally.
- Test settings save/load.
- Test input limit behavior.
- Test copy buttons.
- Test translation error handling.
- Test at least one sample Japanese CoC fragment.

## Current Status

- Source instruction Markdown has been read.
- Workspace initially contained only the instruction Markdown.
- No Git repository is initialized yet.
- Electron MVP scaffold has been created.
- Dependencies have been installed with npm.
- JavaScript syntax check passes.
- MVP UI, local settings save/load, prompt construction, OpenAI request flow, result section parsing, copy buttons, and local CoC note detectors are in place.
- Model selection now uses a dropdown with an OpenAI model-list refresh button instead of manual text entry.
- Translation requests now use the OpenAI Responses API to better match current text-generation models.
- The duplicated default translation mode control was removed from the settings panel. The top translation mode selector is now the single visible mode control and its selected value is saved.
- The settings panel now includes contextual help for the currently selected translation mode.
- Prompt rules treat `KPC` and `探索者 -> 탐사자` as absolute internal translation rules, not as output notes.
- The renderer filters no-occurrence notes about `KPC`, `探索者`, or `탐사자` from the proper-noun/honorific note section.
- Proper nouns from context notes must use the provided Korean reading/transliteration only when the source usage is actually a proper noun/person-name context. If the same kanji is used as a common word or description, translate by meaning instead.
- Natural translation mode now keeps dialogue closer to literal translation to preserve speech style, honorifics, and relationship nuance.
- Theme switching is available in the top bar with four saved themes: blue, pink, green, and dark mode.
- Blue theme uses the same soft system as the pink theme: near-white blue surfaces, a slightly darker blue primary button, and calm blue-gray text.
- Blue line color is slightly darker and a touch more saturated for clearer block separation.
- Blue line color was softened to `#C8EBFA`.
- Green theme was added with warm sage/mint colors and the same low-contrast layout approach.
- Model dropdown separates translation-recommended OpenAI models from the rest of the available model list.
- Translation requests can now be cancelled from the UI while they are running.
- Translation cancellation is treated as a normal cancelled result in the renderer, so the user sees only `번역을 중지했습니다.`
- Translation action buttons are arranged together in one action row, with a stable status message area on the right.
- On wide screens, the work area splits into two columns: source/context/actions on the left and results on the right. In this layout, the context memo stacks below the Japanese source input.
- Spellcheck is disabled on source and context text areas to prevent red underlines on Japanese/scenario terms.
- The CoC 7th memo mode is labeled as a memo-centered mode, distinct from the output section named `CoC 7판 참고 메모`.
- The settings status pill (`설정 대기`) is hidden by default and appears briefly beside the settings *title* after 설정 저장 / API 키 삭제, then auto-hides. It is wired in both the translator (`#saveStatus`) and the context editor (`#editorSaveStatus`). (Updated 2026-06-01; it used to sit beside the save button.)
- The settings panel can collapse into a compact arrow button on wider layouts to give the work area more horizontal space.
- A development shortcut was created on the Windows desktop and is currently named `CST.lnk`.
- App icon assets were added under `assets/`, including a Windows `.ico` file and PNG sizes.
- Windows build config uses `assets/CoC-Scenario-Translator.ico`.
- End-user TXT manual exists at `사용설명서.txt`.
- API 429 errors use a clearer Korean message that mentions usage limits, credits, and OpenAI Billing.
- The app display name has been shortened to `CST`, and the native Electron menu is explicitly localized into Korean.
- Development desktop shortcut is now `CST.lnk`.
- PDF-to-text extraction is a deferred idea. Start with text-based PDF extraction only if it is revisited; OCR should remain a later optional feature.
- Electron app smoke test passes: app starts and stays running.
- API provider selection now supports OpenAI and Gemini.
- Gemini model-list refresh uses the Gemini models API and shows models that support generateContent.
- Gemini translation requests use the Gemini generateContent API.
- API keys and selected models are stored per provider in local settings.
- The existing structured result output is preserved across OpenAI and Gemini providers.
- Translation cancellation works across supported providers.
- End-user manual (`사용설명서.txt`) covers OpenAI/Gemini provider selection, the model-selection UX, and the built-in Mythos/TRPG auto term conversion.
- API call code is split into `src/providers/openaiProvider.js`, `src/providers/geminiProvider.js`, and a shared `src/translatorService.js` entry point that builds the common prompt and detects local CoC notes.
- Legacy flat `apiKey`/`model` settings migrate into the OpenAI provider slot on load.
- A CoC book DB (`src/data/cocBooks.js`) maps Japanese book abbreviations (e.g. マレモン, ルルブ, 怪物図鑑) to full titles; the translator expands abbreviations, keeps Japanese-only books in Japanese, and shows both Korean+Japanese titles when a Korean release exists.
- A local error-logging feature (`src/errorLogger.js`) writes errors to `userData/logs/error.log` (Roaming\CST\logs), with sensitive-data masking, size-based rotation (5MB × 5 backups), and folder-scoped clearing. Settings panel has 오류 로그 buttons (폴더 열기 / 복사 / 삭제). No data is auto-transmitted; API keys, input source, and translation/edit results are never logged.
- The UI was redesigned (glass/card "라일락 민트" look) from a design handoff in `design_handoff_cst_redesign/`. `index.html` + `styles.css` were rebuilt to the handoff (5 themes incl. new default `lilac`, collapsible settings rail, collapsible editor groups, copy/edit toast, redesigned preview cards). All functional element IDs and DOM nesting were preserved so `renderer.js`/IPC keep working.
- Manual UI testing with real OpenAI/Gemini API keys has been done by the user multiple times and reported working (translation, editor, model refresh, save/restore). The core flows are user-verified; only the newly added error-log buttons are still unverified in the live UI.
- Context editor target replacement now uses a user-editable "find target terms -> replacement label" model instead of a fixed 탐사자-only replacement. The default find terms are 탐사자님, 탐사자, PC, 플레이어; users can type KPC or any specific term when needed.
- Context editor prompt strength was restored closer to the pre-merge `D:\ORPG\coc-gm-tool-api` version, with provider-neutral wording that forbids generic AI-style decorative additions rather than mentioning a specific model family.
- Context editor preview has a top-level "전체 복사" button. The output textarea remains directly editable, so no separate edit button was added.
- Body font size controls were added to the top bar. They affect source/output text areas, translation result output, and context-editor preview/output text only, from -5pt to +5pt, saved in localStorage.
- Dark-mode select dropdown options now force dark option backgrounds with light text. Scrollbar space is reserved to reduce layout jump when switching tools, and scrollbars use low-contrast theme-colored styling. Tool switching has a short fade/slide transition.
- Model dropdown category headers now render as disabled header options instead of native `optgroup` labels so "추천 모델" and "사용 가능한 모델" rows can receive theme/dark-mode background colors reliably.
- GitHub MCP is connected for update metadata management. The public update metadata repository is `nanayaD/cst-update`; `latest.json` and `latest-test.json` have been initialized on its `main` branch.
- Update checking is implemented as detection-only: the app reads GitHub `latest.json`, shows an update modal when the remote semver is newer, and opens the download page in the system browser. It never downloads, installs, replaces, or runs update files.
- Build scripts now distinguish portable and installer releases: `npm run build:portable` creates `dist/CST-<version>-portable.exe`, and `npm run build:installer` creates `dist/CST-Setup-<version>.exe`. Both keep `productName: CST` and the same Electron `userData` settings folder.
- DONE (2026-06-01): the long `사용설명서.txt` content is now also available as an in-app help/manual popup with a book-like table-of-contents UI (`src/manualContent.js` → `#manualModal`), opened from a topbar 사용설명서 button or the 도움말 menu (F1). The TXT file remains as the distributable copy.
- Context editor API prompts now prioritize the pre-merge `D:\ORPG\coc-gm-tool-api` behavior more strictly. Preserve/natural/remove-narrator modes include the old examples/output-format constraints again, while using provider-neutral wording instead of model-specific phrasing. OpenAI/Gemini provider calls now receive editor mode temperature/max-output settings.
- Context editor split/extract tools now recognize existing `【서술 NN】` / `【대사 NN】` output labels before reprocessing, so pressing "서술만 추출" or related buttons repeatedly does not duplicate labels.
- Context editor API cleanup now uses a larger output-token budget and detects provider token-limit stops. OpenAI GPT-5/o-series requests set low reasoning effort where supported, and empty/incomplete provider responses no longer clear the output textarea silently.
- Context editor preview now groups blocks by explicit `【서술 NN】` / `【대사 NN】` labels, not by blank lines. Blank lines inside a labeled block stay inside that same preview block.
- Context editor prompts are now provider-specific. OpenAI keeps the richer pre-merge-style prompt with detailed examples for paid-quality use, while Gemini uses shorter button-specific prompts for free-tier stability. Gemini narration-block cleanup also requests `application/json` with a simple response schema and falls back to plain prompting if a model rejects schema options.
- Stored API key deletion is available from the settings/API areas. It clears saved OpenAI/Gemini API key values from `settings.json` and warns that API keys may not be viewable again on the issuing service. Full CST folder deletion remains a future onboarding item only.

### Release status (2026-06-01)

- **First public release shipped: version `0.2.0`.** `package.json` is at `0.2.0`; `dist/CST-0.2.0-portable.exe` is the distributed artifact (size 72,734,013 bytes, SHA256 `8532168FBAABBC65029CFF52E9817AEF38F52925D4A80AC47E4605E7F13F507B`).
- GitHub Release `v0.2.0` is published on `nanayaD/cst-update` with the portable exe attached as an asset. `latest.json` on `main` points to version `0.2.0`, releaseDate `2026-06-01`, the real release-asset `downloadUrl`, `packageType: portable`, and **array-form** `notes`.
- The in-app auto update check (startup + manual button) reads that `latest.json`; with installed = remote = 0.2.0 it stays silent (correct). The next version bump is what will trigger the update modal for existing 0.2.0 users.
- **0.2.1 built but HELD — not being released now (user decision 2026-06-01).** `package.json` is at `0.2.1` and `dist/CST-0.2.1-portable.exe` (size 72,734,582 bytes, SHA256 `957A8C996C589F584E993D9A5556E8180D101314F62AB67B8F8FADD9B16CB182`) exists locally, but the user is **batching more feature work into the next release** and will not publish 0.2.1 on its own. So: no GitHub Release, no `latest.json` bump yet. The currently distributed version stays 0.2.0. Draft files for the eventual release exist (`릴리스노트_0.2.1.md`, `cst-update-draft/latest.json`); the version number may be re-bumped (e.g. 0.3.0) when the batched release actually ships. When published, existing 0.2.0 users get the update modal and their keys auto-migrate to `Roaming\CST`.
- **New installs** (no prior CST folder): the app uses `Roaming\CST` from the start, and `migrateLegacyUserDataIfNeeded()` is a no-op (nothing to copy). Only existing 0.2.0 users trigger the one-time old→new copy. Both paths are correct.
- **userData folder name — fixed in 0.2.1.** In 0.2.0 the Electron settings/log folder was actually `Roaming\coc-jp-scenario-translator`, not `Roaming\CST` (no top-level `productName`; `app.setName('CST')` ran inside `whenReady`, too late to change the path, so `app.getName()` fell back to the package.json `name`). 0.2.1 moves `app.setName('CST')` to the very top of `main.js` (before `whenReady`/first `getPath`), so the folder is now `Roaming\CST` for both dev and packaged builds. A one-time migration (`migrateLegacyUserDataIfNeeded`) copies the old folder's contents into `CST` on first run if `CST` has no `settings.json` yet, so existing 0.2.0 users keep their saved API keys without re-entering them. Verified: dev-mode and packaged-exe both create/use `Roaming\CST`, and the migrated `settings.json` is byte-identical (SHA256) to the old one with both provider keys intact. (Settings/keys are NOT bundled in the exe — `build.files` = `src/**/*` + `package.json` only.)

## Progress Log

### 2026-06-01 (0.2.1: userData folder rename + migration)

- The "Roaming\CST" expectation from an earlier (other-AI) plan was never actually applied in code — 0.2.0 shipped writing to `Roaming\coc-jp-scenario-translator`. Fixed it properly in **0.2.1**: moved `app.setName('CST')` to the top of `main.js` (module load, before `whenReady`/first `getPath('userData')`) so the folder resolves to `Roaming\CST` in both dev and packaged builds. Added `LEGACY_USERDATA_DIR_NAME` + `migrateLegacyUserDataIfNeeded()`: on startup (awaited before `errorLogger.init`/window create), if `CST` has no `settings.json` but the old folder does, it `fs.cp`-copies the old folder's contents into `CST` (force:false, errorOnExist:false). Migration failure is non-fatal (captured in `pendingMigrationError`, logged after logger init).
- Removed the now-unnecessary "folder name differs" note (오류 로그 area `.folder-name-hint` + manual §10 + `사용설명서.txt`) since program name and folder name now match (CST).
- Verified end-to-end: (1) `npm run check` passes; (2) dev-mode launch created `Roaming\CST` with `settings.json` + `logs` migrated, old vs new `settings.json` SHA256 identical, both OpenAI+Gemini keys present; (3) **packaged** `CST-0.2.1-portable.exe` test — temporarily moved `CST` aside, launched the exe, confirmed it recreated `Roaming\CST` and re-migrated `settings.json` (hash-identical), then restored the original folder. So the folder rename + key migration work in the real distributable, not just dev.
- Bumped `package.json` to `0.2.1`, built `dist/CST-0.2.1-portable.exe` (72,734,582 bytes, SHA256 `957A8C99…6CB182`). Wrote `릴리스노트_0.2.1.md` and a `cst-update-draft/latest.json` (version 0.2.1, array notes) for publishing. GitHub Release `v0.2.1` + `latest.json` bump remain the user's manual publish step.

### 2026-06-01 (release + cleanup session)

- **Shipped the first public release (0.2.0).** Bumped `package.json` to `0.2.0`, rebuilt `dist/CST-0.2.0-portable.exe`, and published GitHub Release `v0.2.0` on `nanayaD/cst-update` with the portable exe as an asset. Updated `latest.json` on `main` to version 0.2.0 + real `downloadUrl` + array `notes`. Fixed the `notes` field from a plain string to an **array**, because `updateService.normalizeLatestInfo` only accepts `Array.isArray(notes)` — a string renders as "변경점 정보가 없습니다." in the update modal. Verified release/asset (GitHub API: size 72,734,013) and the live `latest.json` (raw was CDN-cached for ~5 min; confirmed actual content via the contents API).
- Rewrote the in-app manual's API-key section (`manualContent.js` §2 → "API 키 발급 따라하기") and the `사용설명서.txt` copy into a practical, follow-along guide: **A. Gemini (free start) → B. OpenAI (incl. billing setup) → C. enter in app + short test**, based on two user-supplied API guide drafts (since deleted). Distinguishes provider subscription vs. API key, key prefixes (`AIza…`/`sk-…`), key restriction, and a short-sentence test.
- Settings status pill UX: the `설정 대기` pill is now **hidden by default**, appears beside the settings *title* briefly after 설정 저장 / API 키 삭제, then auto-hides (~2.6s, fade-in via `setStatus`). Applied to BOTH translator (`#saveStatus`) and editor (`#editorSaveStatus`); `setStatus` updates both pills. `API 키 삭제` was separated from the save button (`margin-left:auto`) in both panels to reduce mis-clicks. Editor settings title unified from "교정 설정" → "설정" to match the translator.
- Added a small corner note (오류 로그 area `+ .folder-name-hint`, manual §10, and `사용설명서.txt`) that the program name is **CST** but the settings/log folder is `coc-jp-scenario-translator` (visible via 폴더 열기). Source-only; ships next build.
- Investigated the userData folder name on the user's machine: it is `Roaming\coc-jp-scenario-translator`, not `CST` (see Release status above for the root cause). Decided to keep it as-is for 0.2.0 (renaming would orphan existing users' saved keys); a future version can add top-level `productName: "CST"` (or early `setName`) **with an old→new folder migration**.
- Doc cleanup: deleted obsolete working docs (`api설명서1.txt`, `api설명서2.txt`, `CST 문맥교정기 버튼 구조 및 프롬프트 개편 지시문.txt`, `문맥 교정기 프롬프트 최종 수정안.md`, `design-handoff/`, local `cst-update-draft/`). Moved reference docs into `docs-archive/` (`교정기_AI프롬프트_검토용.md`, `문맥교정기_프롬프트_정리.md`, `TRPG_번역교정도구_배포_업데이트_보안_계획.md`, `배포전_보안품질_최종체크리스트.md`, `coc_jp_scenario_translator_dev_instructions.md`, `design_handoff_cst_redesign/`). Project root now has only `ONBOARDING.md`, `릴리스노트_0.2.0.md`, and `사용설명서.txt` for docs. `npm run check` passes after all edits.

### 2026-06-01 (earlier: pre-distribution feature work)

- Added a stored API key deletion flow before first distribution: `API 키 삭제` buttons in both the translator settings panel and context editor API group, a themed warning modal explaining that API keys may not be recoverable from the provider site, and a save path that clears OpenAI/Gemini key values from the local `settings.json` while preserving non-secret settings. Updated the in-app/manual TXT guidance. Deferred full CST saved-data/userData folder deletion as later-scope only.

- Added an in-app user manual (the long-standing "future UX idea" from this onboarding). New `src/manualContent.js` exposes `window.CST_MANUAL` (13 TOC sections, browser-script not CommonJS since the renderer is contextIsolated and cannot `require`). `index.html` got a 사용설명서 `?` button in the topbar (beside 테마) and a `#manualModal` (book-like layout: left TOC nav + right scrollable content, reusing the existing modal-backdrop). `styles.css` added `.help-btn` + `.manual-*` styles (theme-var driven, responsive TOC). `renderer.js` builds the TOC/content from `CST_MANUAL`, wires open/close (topbar button, ×, backdrop click, Esc), and a scroll-spy that highlights the active TOC item. `main.js` keeps a module-level `mainWindow`, adds a 도움말 → `사용설명서` menu item (F1) that sends `menu:open-manual`; `preload.js` exposes `onOpenManual`. Entry points: topbar button (primary) + native 도움말 menu (secondary), per user decision.
- Reviewed `사용설명서.txt` before embedding and filled gaps: the manual had **no 문맥 교정기 coverage at all** (translator-only). Added a new "## 9. 문맥 교정기 사용법" section (지칭 변환 / 전체 정리·서술만 AI / 형식 정리 즉시 / AI vs 로컬 버튼 구분), renumbered 오류→10 / 보안→11 / 링크→12, added the two-tool overview to §1, and added 라일락 민트(기본) theme + 본문 크기 controls to the display/first-run text. The in-app `manualContent.js` mirrors this updated structure.
- Verified: `npm run check` (now includes `manualContent.js`) passes; Electron smoke launch ran clean (empty stderr). Modal click/scroll interactions are wired but not yet visually clicked-through in a live UI session.
- Gave the 문맥 교정기 recommended-model dropdown its own OpenAI labels. `renderModelOptions` now detects the editor dropdown (`controls.model === elements.editorModel`) and, for OpenAI, swaps the recommended-group label text via a new `editorRecommendedLabels` map (e.g. `gpt-4.1` shows "추천: 빠른 교정(비추론)" instead of the translator's "비추론 빠른 번역", `gpt-5.5` "추천: 교정 품질 우선"). The recommended model *set* stays identical to the translator; only the displayed wording changes. Gemini labels (quota-based) are tool-neutral and fall back to the translator labels. Verified with `npm run check` and a vm-loaded label test (translator shows "번역" wording, editor shows "교정" wording with no "번역").
- Reviewed `TRPG_번역교정도구_배포_업데이트_보안_계획.md` against the current code/build and added a "0-1. 현행 점검 (2026-06-01)" subsection: confirmed productName/version/userData/build-scripts/unsigned/NSIS/update-detection all match the plan; flagged drift — the app currently supports OpenAI+Gemini only (Claude API in §12 is not implemented; marked as future), no GitHub Release has been published yet so `latest.json` `downloadUrl` isn't real, and the next release should bump to 0.2.0 (minor) per §9. Recorded a concrete "다음 세션 계획 (배포·업데이트 마무리)" in this onboarding (version bump → build → GitHub Release → latest.json update → update-modal end-to-end test → error-log button live test).
- Reviewed the user's requested functional changes before implementation. Confirmed that the context editor prompt had been shortened during integration compared with `D:\ORPG\coc-gm-tool-api\server.js`, especially in the preserve/natural/remove-narrator mode constraints and examples.
- Expanded `src/editorService.js` using the pre-merge prompt as the baseline: restored stronger goal/allowed/limited/output-format rules for preserve, natural, remove-narrator, and narration-block JSON cleanup. Replaced the model-specific "GPT식" wording with provider-neutral rules against generic AI-style decorative wording, moralizing sentences, exaggerated exclamations, and unsupported atmosphere words so the prompt applies equally to OpenAI and Gemini.
- Reworked context-editor target replacement from a fixed `탐사자 -> targetName` flow into a configurable target-term list plus replacement label. Added `editorTargetTerms` in the UI, persisted it in the local editor draft, passed it through IPC to `editorService.js`, and applied the same target-term list to local "호칭만 적용" replacement.
- Target replacement now supports comma/newline-separated terms such as `탐사자`, `PC`, `KPC`, `플레이어`, sorts longer terms first, applies Korean particles where possible, and respects the existing "대사 안 지칭도 변경" option.
- Added a context-editor preview "전체 복사" button. Skipped a separate output edit button because the output textarea was already directly editable and live-updates the preview.
- Added top-bar body font controls (`-` / current delta / `+`) for source/output areas only: translator source/result output, editor source/output, and editor preview body. The range is -5pt to +5pt and is saved locally in `localStorage`.
- Fixed dark-mode dropdown option contrast by styling `select option`, reserved scrollbar gutter and forced the body scrollbar space to avoid width jumps when switching between translator and editor, added low-contrast themed scrollbar styling, and added a short fade/slide transition when switching tools.
- Replaced model dropdown `optgroup` category labels with disabled header options and styled them with theme-aware backgrounds, including dark mode, because native `optgroup` label styling was not reliably applied in Electron/Windows dropdowns.
- Initialized the GitHub update metadata repository `nanayaD/cst-update` via GitHub MCP with `latest.json` (production, version 0.1.0), `latest-test.json` (test, version 0.1.1), and `README.md`. Production raw URL: `https://raw.githubusercontent.com/nanayaD/cst-update/main/latest.json`; test raw URL: `https://raw.githubusercontent.com/nanayaD/cst-update/main/latest-test.json`.
- Updated `TRPG_번역교정도구_배포_업데이트_보안_계획.md` so the plan uses the current CST app name, `Roaming\CST` settings/log paths, and the `nanayaD/cst-update` GitHub URLs instead of placeholder `TRPGTranslatorProofreader` / `example.com` update references.
- Added `src/updateService.js` for HTTPS-only GitHub update metadata checks, semver comparison, field whitelisting/sanitizing, timeout handling, and download URL validation. Added main-process IPC handlers `updates:check` and `updates:open-download`, plus preload bridge methods.
- Added an 업데이트 section to the settings panel with a manual check button and status line. The renderer also performs a quiet automatic check at most once every 24 hours after the UI loads. If a newer version exists, it shows an in-app update modal with current/latest version, release date, notes, installer migration message, and download-page button.
- Updated `사용설명서.txt` security/distribution guidance with GitHub update-check behavior, no automatic download/install, and folder re-compression warning.
- Added `updateService.js` to `npm run check`.
- Added release build scripts and artifact names in `package.json`: `build:portable` (`electron-builder --win portable`) and `build:installer` (`electron-builder --win nsis`), with portable output `CST-<version>-portable.exe` and installer output `CST-Setup-<version>.exe`. NSIS is configured as assisted install, per-user by default, and does not delete AppData on uninstall.
- Updated the deployment/security plan and user manual with the new build commands and portable/installer replacement guidance.
- Windows build config sets `win.signAndEditExecutable: false` for unsigned private distribution. This avoids electron-builder's Windows code-signing helper symlink extraction failure on machines without symlink/developer-mode permission; actual signing can be revisited if a certificate is introduced.
- Verified both release builds: `dist/CST-0.1.0-portable.exe` and `dist/CST-Setup-0.1.0.exe` were generated. The portable exe smoke test launched successfully and was closed cleanly.
- Restored the context editor prompts closer to the old `coc-gm-tool-api` version after preserve mode was found to behave like raw linebreak preservation. Re-added few-shot examples for preserve/natural/remove_narrator, restored missing output-format and limitation rules, passed `temperature` and `maxOutputTokens` through OpenAI/Gemini provider calls, and reintroduced the old linebreak-only dialogue splitting helper path in `renderer.js`.
- Verified with `npm run check` and a short Electron launch smoke test. The app started successfully and the test process was closed cleanly.
- Fixed a repeated extraction issue in the context editor: `splitEditorSource` now parses existing formatted labels before filtering or reformatting segments, preserving `서술`/`대사` type information and preventing nested labels such as duplicate `【서술 01】`. Verified with `npm run check` and a targeted label-idempotency test.
- Investigated API cleanup failures after prompt restoration. The restored prompts made the previous 900-token output cap too small: OpenAI reasoning models could spend the cap on hidden reasoning and return no visible text, while Gemini could stop with `MAX_TOKENS` and partial or missing text. Increased editor output budgets, added OpenAI low reasoning effort where supported, and added explicit incomplete/MAX_TOKENS handling for both providers. Also guarded the renderer against applying empty API results.
- Changed preview parsing so only explicit labels start preview blocks. A labeled block can now contain internal blank lines without creating stray `서술` cards. Verified with `npm run check`, a targeted preview label-grouping test, and provider token-limit handling tests using mocked responses.
- Split context-editor prompt management by provider and button. `editorService.js` now selects OpenAI's detailed preserve/natural/remove-narrator instructions or Gemini's concise equivalents at runtime. Narration-block cleanup builds provider-specific JSON instructions; Gemini additionally sends `responseMimeType: application/json` and a simple `blocks` schema. `geminiProvider.js` retries once without schema options if a model rejects structured JSON generation. Verified with `npm run check`, provider-specific prompt tests, Gemini JSON config tests, and Gemini schema-fallback tests.
- Applied the user-authored "문맥 교정기 프롬프트 최종 수정안" to `src/editorService.js` (OpenAI detailed + Gemini concise) and added button tooltips. Key changes: (1) Per-path dialogue handling is now explicit — `cleanText`(전체 정리: preserve/natural/remove_narrator) appends a new `fullCleanDialogueRules(mode, provider)` block ("전체 원문 처리 규칙": 서술+대사 모두 출력, 대사는 보수 정리하되 의미·말투·캐릭터성·정보량 유지; natural/remove_narrator get extra dialogue limits), while `cleanNarrationBlocks`(서술만) keeps the JSON-block rules with stronger length-equality/no-deletion/string-type constraints and "대사는 API 미전송·원문 보존" wording. (2) `instructionWithTarget` was restructured into conditional blocks for both providers, adding anti-over-application rules ("배경 설명·NPC 행동·일반 상황 설명에 targetName을 잘못 추가하지 않는다") and a "KPC는 기본 변환 대상에서 제외, 사용자가 직접 추가한 경우에만 적용" rule. (3) The OpenAI mode bodies (preserve/natural/remove_narrator) were rewritten per the spec, which **removed the embedded few-shot 예시 blocks** in favor of rule-only guidance (flagged to the user as a change vs. the previously-restored examples). (4) Added hover/focus tooltips (`title` + `data-tooltip`) to the 5 AI editor buttons; `updateEditorButtons` now restores `data-tooltip` instead of clearing `title` when a model is selected. Verified with `npm run check` and a 15-case provider-stub assembly test (전체정리=대사규칙 포함·JSON규칙 미포함, 서술만=반대, KPC/과적용 방지 문구, 토글 분기) and an Electron smoke launch.
- Post-spec refinements after live OpenAI/Gemini testing: (1) `화자 개입 제거`(remove_narrator) was inserting blank lines far more often than other modes because its 출력 형식 had no paragraph-grouping cap (unlike preserve's "3문장 이상" / natural's "1~3문장"). Aligned it (OpenAI + Gemini) to "관련된 지문은 1~3문장으로 묶고, 장면/판단이 바뀔 때만 빈 줄". (2) Translator now translates substitution placeholders like `{KPC三人称}`, `{探索者名}`: added a rule to translate Japanese inside `{ } [ ] < >` while keeping the braces and force-kept labels (KPC/PC/HO) — e.g. `{KPC三人称}` → `{KPC 삼인칭}`. (3) Added a translation-completeness guard ("모든 일본어를 빠짐없이 번역, 「」 대사 포함; 명시 예외만 원문 유지"). The first version included a "스스로 확인한다" self-check clause that pushed GPT-5 mini into a visible self-correction/repetition loop (dumping "원문 -> 번역 / 사과 / 반복" into output); replaced it with "각 줄은 최종 번역 한 가지만 출력, 과정·자기점검·수정설명·사과·대조표기·반복 금지". (4) Hardened result parsing in `renderer.js`: section-header regex now accepts any bracketed single line and classifies by keyword (번역/검토/고유명사·호칭/CoC·7판·참고), so a header garbled into Japanese (e.g. `[CoC 7판 참고 メモ]`) is still split out instead of leaking into the translation box; added `hasUntranslatedJapanese()` (kana detection outside 병기 괄호) that shows a "일부 문장이 일본어로 남아 있을 수 있습니다 — 재번역 권장" status when residual kana is found. (5) Prompt slimming: consolidated four redundant "원문 병기" rules into one. (6) Removed `gpt-5-mini` from the OpenAI 추천 목록 (`recommendedModels`) — it loops/code-switches on this long JP→KO prompt and quality is weak; still selectable from the live 사용 가능한 모델 list. User-verified: mini loop gone, other GPT recommended models and all Gemini recommended models translate cleanly. Verified each step with `npm run check`, provider-stub assembly tests, a vm-loaded renderer parser/kana test, and Electron smoke launches.
- Context-editor labeling/preview/copy/speaker fixes (renderer-side only; prompts unchanged): (1) "전체 정리"(preserve/natural/remove_narrator) results are now locally split and re-labeled with `【서술 NN】`/`【대사 NN】` after the API returns, so the preview separates 서술/대사 blocks instead of dumping one 서술 block. Labels are applied by deterministic post-processing, never requested from the model (avoids the earlier regression where prompt-driven labels vanished). (2) Preview "전체 복사"(`editorCopyPreviewAll`) now copies label-stripped body text only via a new `previewPlainText()`; the 출력문 "전체 복사" still copies the raw labeled working text (user decision). (3) Speaker labels: `splitDialogueSegments` gained `{ detectSpeaker }` + a `detectSpeakerName` helper that treats a bare token (≤16 chars, no whitespace/sentence punctuation) or a short `이름:` label right before an opening quote as the speaker; the name is stripped from narration and the dialogue is labeled `【KPC 01】`. Dialogue numbering is a single global counter. (4) `matchSplitLabelLine` was broadened to parse `【<name> NN】` (서술/대사/speaker) and now returns `{ kind:'narration'|'dialogue', number, name, speaker }`; `parseLabeledSplitSegments`, `previewBlocksFromOutput`, `applyTargetToText`, and `localLinebreakOnly` were updated to the new shape and preserve `speaker` so split/extract stays idempotent. Verified with `npm run check`, a 17-case vm-loaded unit test of the pure functions (speaker detection, label round-trip idempotency, preview label/body, global counter), and an Electron smoke launch.

### 2026-05-31

- Added Gemini API provider support alongside the existing OpenAI provider.
- Created `src/providers/openaiProvider.js` (moved Responses API translate + `/v1/models` listing and OpenAI error mapping out of `main.js`).
- Created `src/providers/geminiProvider.js` using `x-goog-api-key`, `models.list` (filtered to `generateContent`-capable models, `displayName` shown, request ID from `name` without the `models/` prefix), and `:generateContent` with `temperature 0.2`; response text joined from `candidates[0].content.parts`.
- Created `src/translatorService.js` as the shared entry point: holds `MODES`, the common prompt builder, and local CoC detection; routes `listModels`/`translate` to the selected provider and combines instructions+input into a single prompt string for Gemini while keeping OpenAI's instructions/input split.
- Changed settings schema to `{ provider, apiKeys{openai,gemini}, modelByProvider{openai,gemini}, ... }` with migration of legacy flat `apiKey`/`model` into the OpenAI slot; existing users default to `openai`.
- Updated `index.html`: added `API 제공사` dropdown and relabeled the key field to `API Key`.
- Updated `renderer.js`: per-provider available/recommended models, provider-switch handler that stashes the current key/model before swapping, and provider-specific model hints. Gemini recommended models are gemini-2.5-flash (default), gemini-2.5-pro, gemini-2.5-flash-lite, filtered against the live model list.
- Updated `preload.js` `listModels` to pass the provider, and the main-process `models:list`/`translate:run` handlers to read provider/apiKey/model per provider and emit provider-named error messages.
- Gemini 429 message points to free-tier per-minute/per-day limits and Google AI Studio usage rather than billing.
- Updated `사용설명서.txt` for OpenAI/Gemini provider selection: overview, API key prep (both providers), free-tier note, first-run steps, error messages, and added Google AI Studio / Gemini API reference links.
- Added all new files to the `npm run check` syntax check; check passes.
- Smoke-tested app launch successfully after the provider refactor.
- Fixed result parsing for Gemini: the renderer section parser now tolerates markdown-decorated headers (e.g. `**[번역문]**`, `## [검토 필요]:`) and falls back to treating leading text as `[번역문]` when the header is omitted, so output no longer dumps everything into the translation box.
- Prompt now explicitly forbids markdown decoration and requires each `[섹션]` header on its own line.
- Narrowed the local stat-review detector so narrative `狂気` no longer triggers the HP/MP/이동력 note; madness(SAN)/chase/spell now have their own context-specific detectors with matching messages.
- Prompt now limits source-original parenthetical annotation to the first occurrence of each proper noun/term (e.g. `푸른 파일(ブルーファイル)` once, then `푸른 파일`), applied across all modes and providers, to stop repeated `(원문)` clutter.
- Added a Mythos name glossary (`src/data/mythosGlossary.js`) mapping Japanese/English creature & deity names to Korean terms. It began with 56 Keeper Rulebook-derived entries and was later expanded from `deep-research-report.md` to 70 entries. Confirmed entries are force-applied; report-only uncertain entries are placed in a separate temporary table and must produce a "정발 명칭 확인 필요" note.
- Added a TRPG/CoC scenario-term glossary (`src/data/trpgTerms.js`, 25 entries) for Japanese scenario jargon, force-applied via the prompt. Covers session formats (ボイセ/テキセ/完テキ/半テキ/オンセ/オフセ), roles (KP/KPC/PL/PC/探索者), handouts (HO/秘匿HO/共通HO), investigator states (ロスト/発狂/継続探索者), scenario types (クローズド/シティ/ソロ/タイマン), なりきり, and header meta (推定時間/所要時間/推奨技能). Unfamiliar terms may get a one-time parenthetical gloss on first use; the source list was grounded in a web search of Japanese CoC community usage.
- The former hardcoded absolute rules (KPC kept verbatim, 探索者 -> 탐사자) were absorbed into the `trpgTerms.js` glossary as force-applied entries; the prompt no longer carries them as separate lines.
- Added a prompt rule for the 秘匿(secret) handout numbering convention: HO1/HO2/HO3 etc. are per-player handouts that also denote the player/investigator themselves, so the labels are kept verbatim and not expanded/translated.
- Model dropdown UX: no models are pre-populated anymore. Fresh installs (no saved model) show a disabled placeholder "API 키를 입력하고 모델 새로고침을 누르세요"; after a successful refresh it becomes "모델을 선택해주세요" with the loaded recommended/available groups; a previously-saved model is shown selected even before refresh. Default model in settings is now empty (`modelByProvider` defaults to '', renderer no longer seeds DEFAULT_MODELS/FALLBACK_MODEL).
- The Translate button is now disabled until a model is selected (in addition to the over-limit/running conditions), with a tooltip prompting to pick a model. The model list itself is fetched live from the provider on each "refresh", so deprecated models drop off and new ones appear on refresh (recommended-label list stays hardcoded but degrades gracefully).
- On refresh, if the previously selected/saved model is no longer in the freshly fetched list (e.g. deprecated), the renderer clears the stale selection in memory and shows a hint ("이전에 선택한 모델 'X'은(는) 현재 제공 목록에 없습니다. 모델을 다시 선택해주세요."), forcing a reselect rather than failing later at translate time.
- Refreshed `사용설명서.txt` for this session's changes: the model-selection flow (empty list until refresh, deprecated models auto-dropping so no update package is needed, Translate disabled until a model is chosen, stale-model reselect notice) and the auto term conversion (Mythos names -> 초여명 official terms, TRPG/session jargon, first-occurrence-only original annotation).
- Corrected the Korean rendering of 秘匿HO from "비닉 핸드아웃" to "은닉 핸드아웃" (Korean TRPG community standard) across `trpgTerms.js`, the HO-numbering prompt rule, and the manual; 秘匿 scenario is now "은닉 시나리오".
- Added a CoC book DB (`src/data/cocBooks.js`, 33 entries) built from `deep-research-report2.md`: Japanese KADOKAWA/新紀元社 6th-edition-line books and Korean 초여명 7th-edition books, each with `ja`/`ko` full titles, an `aka` list of in-scenario abbreviations (マレモン, ルルブ, 怪物図鑑, etc.), and a correspondence note. `translatorService.js` force-applies only the books that have a Japanese title + abbreviations. Prompt rules: expand abbreviations to the full title; Japanese-only books (no Korean release) are output verbatim in Japanese (no translation/transliteration); books with both a Korean release and a Japanese original are shown as "한국 정발명(일본 원제)"; page references stay on the cited (Japanese) edition and are not converted to the Korean pagination; book-title annotation also follows the first-occurrence-only rule. Updated `사용설명서.txt` section 8 and the `npm run check` script; check passes.
- Updated `src/data/mythosGlossary.js` using only `deep-research-report.md` as the new source: added verified/common entries such as Atlach-Nacha -> 아틀락 나챠, Cthylla -> 크틸라, Dagon and Hydra -> 다곤과 하이드라, and many Japanese alias variants for existing names.
- Added `review: true` support for report-only uncertain Mythos names (e.g. Nyarlathotep avatars, Quachil Uttaus, Iod, Zoth-Ommog, Moon-Beasts, Voormis). `translatorService.js` now separates confirmed forced entries from temporary review entries in the prompt.
- Mythos glossary count after this update: 70 total entries (23 forced deity, 32 forced creature, 4 forced mundane, 6 review deity, 5 review creature).
- Added the user-provided Nyarlathotep avatar list as `review: true` Mythos entries. Temporary Mythos entries now instruct the model to put "정발 명칭 확인 필요" in the `[검토 필요]` section rather than treating them as confirmed names.
- Mythos glossary count after the Nyarlathotep avatar update: 116 total entries (23 forced deity, 32 forced creature, 4 forced mundane, 52 review deity, 5 review creature).
- Tightened temporary Mythos prompt behavior: review entries still produce a `[검토 필요]` note, but the translation should use the listed Korean temporary term first instead of freely transliterating. Added extra Tick-Tock Man Japanese variants so `チクタクマン` maps to `틱톡맨`.
- Result rendering now removes model-produced empty placeholders such as `없음` from a section when local detector notes are appended, so `[검토 필요]` no longer displays `없음` and a real note together.
- Split local CoC detector notes into user-facing reference/review notes and prompt-only `internalHints`. Generic HP/MP/DB/MOV preservation guidance is now internal-only, so it can guide the model without appearing in the user's `[검토 필요]` panel.
- Added a two-workspace structure inside CST: top switch buttons now toggle between the existing Japanese scenario translator and a new context/paragraph editor workspace. The tools are not merged; they are separate screens in one Electron app.
- Added `src/editorService.js` for Korean TRPG scenario editing. It supports preserve/natural/remove-narrator cleanup, narration-only cleanup while preserving dialogue, target-name normalization, and uses the same OpenAI/Gemini provider/model settings as the translator.
- Added editor IPC handlers (`editor:clean-text`, `editor:clean-narration-blocks`, `editor:cancel`) and preload bridge methods. The context editor has its own top API controls, synced with the translator settings.
- Added local editor tools in `renderer.js`: linebreak-only formatting, dialogue/narration splitting, dialogue-only extraction, narration-only extraction, target-name-only replacement, translation-result import, output preview, and local draft persistence.
- Verified the merged-but-separate tool structure: one Electron app holds both the translator (`translatorService.js`) and the editor (`editorService.js`), sharing `main.js`/`preload.js`/`renderer.js`/`index.html`/`styles.css`/`providers/*` and the same per-provider API settings. Confirmed (by user decision) that the three glossaries (`mythosGlossary.js`, `trpgTerms.js`, `cocBooks.js`) stay translator-only and are intentionally not wired into the editor, since the editor's core rule is to preserve original Korean vocabulary and not invent proper nouns.
- Audited the Mythos glossary for integrity: 116 entries, no missing fields, no duplicate Korean names. Found and fixed one Japanese-token collision — `黒い悪魔` was listed under both Dark Demon (어둠의 악마) and Black Demon (검은 악마). Removed it from the Dark Demon entry (which keeps `暗黒の悪魔`/`ダーク・デーモン`) so each forced Japanese token maps to a single Korean term; entry count stays 116. `npm run check` passes.
- Implemented the local error-logging feature from `오류로그_기능_구현_계획.md` (plan reviewed against the codebase, then deleted after implementation per request). Revisions applied to the plan before building: (1) the plan's Python-flavored examples were adapted to Electron/Node (JS `Error`/`error.stack`, `.js` modules); (2) the log folder was reconciled from the plan's `Local\TRPGTranslatorProofreader\logs` to `app.getPath('userData')/logs` (Roaming\CST\logs), matching where `settings.json` already lives; (3) update-check / `latest.json` error logging was dropped from scope because the app has no auto-updater (one-time build); (4) app version is read via `app.getVersion()` instead of a hardcoded value; (5) added a renderer→main IPC path for UI errors since the app is split across two processes.
- New module `src/errorLogger.js`: `init({userDataPath, appGetVersion})`, `logError(event, error, meta)` (never throws), `maskSensitive` (redacts `sk-…`, `AIza…`, `Authorization`/`Bearer`, `x-goog-api-key`, and 40+ char tokens), size-based `rotateIfNeeded` (5MB, error.1.log…error.5.log), `readRecentLog` (masked, for copy), and `clearLogs` (only deletes `app.log`/`error.log[.N]` inside the logs folder).
- `main.js`: registers `process.on('uncaughtException'|'unhandledRejection')`, calls `errorLogger.init` on app ready, logs failures in the settings-save/models-list/translate/editor handlers (AbortError/cancel excluded; no source text or keys passed in), and adds IPC handlers `log:report` (renderer errors), `log:open-folder` (shell.openPath), `log:copy` (clipboard), `log:clear`.
- `preload.js`: exposes `reportError`, `openLogFolder`, `copyLogs`, `clearLogs`. `renderer.js`: registers `window` error/unhandledrejection hooks that forward to `log:report`, and wires the three settings-panel buttons with a `logStatus` line. `index.html` + `styles.css`: added the 오류 로그 section (폴더 열기 / 복사 / 삭제) to the translator settings panel.
- Verified: `npm run check` (now includes `errorLogger.js`) passes; a standalone logger test confirmed masking, that API keys/source are not leaked, rotation, and folder-scoped clearing; Electron smoke test launches clean with empty stderr. Updated `사용설명서.txt` section 9 with the error-log buttons and privacy note.
- User confirmed that manual UI testing with real OpenAI and Gemini API keys has been performed many times and worked correctly, so the long-standing "manual test with real keys" follow-up is considered satisfied for the existing translator/editor flows. Remaining unverified-in-live-UI item: the new error-log buttons (folder open / copy / clear).
- Expanded `src/data/trpgTerms.js` with the `継続`(continuation) term family from `CoC TRPG 일본어 용어 번역 DB.md`. Corrected the existing `継続探索者` from "계속 탐사자" to "기존 탐사자" (the doc's standard; 継続 means prior-use history, not literal "계속") and added 15 force-apply entries (継続PC, 新規探索者/新規PC, 新規・継続可, 新規継続不問, 継続可, 継続推奨, 継続限定, 継続向け, 継続タイマン, 継続KPC, 継続シナリオ, 同HO継続, 同シナリオ同HO限定; entries now 39). タイマン kept as the app's existing "타이맨" spelling for consistency.
- Added a `contextNotes` export to `trpgTerms.js` for context-dependent terms that cannot be a single forced mapping (継続, 継続不可, 継続可能): scenario entry-condition context → "기존(탐사자)"; ending/aftermath/lost context (後遺症·ロスト·生還·END·クリア後) → "이후 사용". `translatorService.js` renders these as a separate "문맥 의존 번역 규칙" prompt block with a matching instruction line, so the model selects by context instead of literal "계속". `npm run check` passes; no duplicate `ja`, no leftover "계속 탐사자".
- Added a precedence rule to the prompt so the user-provided DBs (Mythos names, TRPG/session terms, CoC books, context-dependent rules) are the top-priority translation authority and override the model's own knowledge, generic translation habits, or mode instructions when they conflict. Confirmed no remaining conflicting `継続`/"계속 탐사자" references exist anywhere in `src` or the manual.
- Largely expanded `trpgTerms.js` from `일본_TRPG_용어_기본_번역규칙.md` at the same top priority (scope: core force-apply + ambiguous→contextNotes, to avoid bloating every prompt with ~250 terms). Force-apply entries went 39 → 103, covering scenario structure/genre (반클로즈드, 오픈, 레일로드, 일직선형, RP 중심, 협력형/대립형, 버디, 군상극…), party/structure (다인원, 소인원, 인원 고정, 가변), handouts/info (공개 HO, 개별 HO, 동일 HO, HO제, 비공개/공개 정보), results/SAN (후유증, 로스트율/高·低/확정/구제, 생환, 일시적·부정의 광기, SAN치/SAN 체크, 기능/준추천/필수 기능), relationships (관계성, 기존 관계, 초면, 소꿉친구, 에모), spoilers (스포일러, 통과 완료, 미통과(자 열람 금지)), rule editions (룰북/기본 룰북, 서플, 룰북 미소지, 컨버트, 6판 기준/7판 대응), distribution (개변, 자작 발언/무단 전재/2차 배포 금지, 방송 가능, 스탠딩), 독자 해석/하우스 룰, and info headers (추천 인원/탐사자, 주의사항, 난이도). contextNotes 3 → 10, adding 직역-지양/문맥-의존 terms (胸糞, うちよそ, 人を選ぶ, 地雷要素, 茶番, ご都合主義, 継続卓).
- Applied this doc's overrides per user "prioritize this file": タイマン "타이맨" → "타이만" (incl. 継続タイマン and its gloss), 推奨技能 "권장 기능" → "추천 기능", 発狂 "발광" → "광기 발생". One deliberate exception: 秘匿HO stays "은닉 핸드아웃" (user's earlier explicit Korean-standard choice) rather than the doc's "비밀 HO". `npm run check` passes; no duplicate `ja`, no leftover "타이맨"/"권장 기능".
- Implemented the full UI redesign from `design_handoff_cst_redesign/` (hi-fi glass/card "라일락 민트" handoff). Method: extracted the handoff's `<style>` → `src/styles.css` and its `<body>` → `src/index.html` verbatim (stripping demo dummy content: model options, result `<pre>` text, preview cards), then re-pointed the head to `./styles.css` and the script to `./renderer.js`. All functional IDs + DOM nesting preserved (verified all 60+ IDs and the data-copy-target/data-editor-* attributes still present). New wrapper elements added by the design: `#settingsBody`, `#editorApiGroup`/`#editorApiToggle`/`#editorApiBody`, `.tool-toggle` sections, `.tools-legend`, `#copyToast`/`#copyToastText`, brand logo SVG, preview `.pc-edit`/`.pc-copy`.
- `renderer.js` updated for the redesign's new behaviors: (1) `toggleSettingsPanel` now toggles `#settingsPanel.collapsed` (vertical rail via CSS `:has()`) instead of the old `.workspace.settings-collapsed`, and clicking the collapsed rail re-expands it; (2) new `bindCollapsibles` wires the editor `#editorApiToggle` + `.tool-toggle` section collapses; (3) `applyTheme` accepts `lilac` (and `lilac` is the fallback); (4) copy actions now show a toast (`showToast`) — `copyText(text, message)` gained a message arg, wired through result copies / 전체 복사 / 출력문 복사; (5) `renderEditorPreview` rebuilt to the new card markup (`.pc-label` + `.pc-actions` 수정/복사, `data-kind`), with `bindPreviewCardActions` handling per-card copy (→toast) and edit (contenteditable → on 완료, `commitPreviewEdit` writes the edited block back into `#editorOutputText` and re-renders).
- `main.js`: theme validation list + `DEFAULT_SETTINGS.theme` now include/default to `lilac` (new installs show 라일락 민트; users with a saved theme keep it). Verified: `npm run check` passes, Electron smoke test launches clean (empty stderr), all functional IDs/attributes present, styles.css carries all redesign mechanics (`:has()` rail, `.collapse-body`, toast, `:empty::before`, `.is-editing`).
- Next step: manual test with real OpenAI and Gemini keys — provider save/restore, model refresh per provider, generateContent-only Gemini list, a short Japanese sample translation, section split, cancel, char-limit, and copy buttons.

### 2026-05-30

- Created this onboarding document from the instruction Markdown.
- Created the Electron project scaffold.
- Added `package.json`, `package-lock.json`, and npm scripts.
- Added Electron main process, preload bridge, renderer UI, CSS, and renderer behavior.
- Added local settings storage under Electron `userData`.
- Added OpenAI Chat Completions request flow using `fetch`.
- Added local CoC reference-note and review-needed detectors.
- Added `.gitignore`.
- Ran JavaScript syntax check successfully.
- Fixed local Electron binary installation after the first launch failed due to a missing `electron.exe` in `node_modules/electron/dist`.
- Smoke-tested app launch successfully.
- Confirmed production dependency audit reports 0 vulnerabilities.
- Replaced manual model-name input with a model dropdown and refresh button.
- Added `GET /v1/models` model-list loading through the main process.
- Switched translation generation from Chat Completions to Responses API.
- Ran JavaScript syntax check successfully after the model-selection change.
- Smoke-tested app launch successfully after the model-selection change.
- Removed the duplicate default-mode dropdown from the settings panel; the top mode selector now also acts as the saved default.
- Added a translation mode help card to the settings panel. It updates when the top mode selector changes.
- Updated prompt behavior: keep `KPC` as-is and make dialogue slightly more literal even in natural translation mode.
- Added a top-bar theme selector with blue, pink, green, and dark mode themes.
- Refined the pink theme around `#F2B0CD`, using only one or two lightness steps to keep contrast soft.
- Replaced leftover sky-blue focus/button border values with theme variables so the pink theme visibly uses pink accents throughout.
- Simplified the pink theme so the background uses `#FEF9FA`; primary buttons use `#FDE3EB` with `#F7D1E1` hover.
- Raised pink theme block/input/result surfaces closer to white with subtle pink values `#FFFDFD` and `#FFFAFB`.
- Pink theme text color is `#855F70`, with muted text in the same color family.
- Renamed the sky theme to blue and refined the palette to match the pink theme's low-contrast layout approach.
- Matched the theme selector focus state to the model selector style, removing the default orange outline.
- Added a warm green theme.
- Desaturated dark mode into a near-neutral charcoal palette.
- Added a recommended-model group in the model dropdown for translation work.
- Updated prompt behavior: translate `探索者` as `탐사자`.
- Clarified that `KPC` and `探索者 -> 탐사자` are absolute internal rules only; absence notes for those terms should not be output.
- Added renderer cleanup for no-occurrence notes about `KPC`, `探索者`, and `탐사자`.
- Updated prompt rules for partial proper-name mentions: use provided readings from the context memo only in proper-name contexts, but do not expand beyond the source's displayed name part. Example: `灯 春乃（토모리 하루노）` means source `灯` can become `토모리` when it is a person-name reference, while common usage such as `灯がともる` should be translated by meaning.
- Moved the settings status pill from the top bar to the settings panel beside the save button.
- Revised the collapsible settings panel UX into a bare arrow control near the settings header, without a visible button box.
- Added a translation cancel button. The renderer sends a request ID, and the main process aborts the active Responses API request through `AbortController`.
- Adjusted cancellation UX so stopping a translation does not show Electron's remote-method error prefix.
- Reworked the translation action row so Translate, Clear, and Cancel are aligned together, with the status text in a stable right-side area.
- Added a wide-screen layout breakpoint where the result panel moves to a right-side column and the context memo stacks under the source text.
- Disabled spellcheck/autocomplete/autocapitalize on the main text areas.
- Clarified the CoC 7th memo mode wording in the UI and manual, including a test sample for rule-note detection.
- Created a Windows desktop shortcut that launches the development Electron app directly.
- Wired the Windows app icon to `assets/CoC-Scenario-Translator.ico`.
- Added `사용설명서.txt` covering API key creation, billing/cost notes, basic usage, translation modes, safety, troubleshooting, and official OpenAI links.
- Updated the 429/API limit error message and manual troubleshooting text to clearly mention credits and billing status.
- Updated `CoC_JP_Scenario_Translator_사용설명서_간결판.txt` section 9 to match the clearer 429/API credit error wording.
- Renamed visible app/window/product labels to `CST` and added Korean native app menus.
- Renamed the desktop development shortcut to `CST.lnk`.
- Noted PDF-to-text extraction as deferred; recommended scope is text PDFs first, OCR later.
- Next step: manually test settings save/load, model refresh with a real API key, input limit behavior, copy buttons, and one real translation request.

## 다음 세션 계획

**0.2.0 첫 공개 배포가 완료**되었다(GitHub Release `v0.2.0` + `latest.json` 0.2.0, 앱 자동 업데이트 감지 경로 정상). 이전 계획의 1~4번(버전 상향·빌드·릴리스 게시·메타데이터 갱신)은 모두 끝났다. 남은 항목은 다음과 같다.

1. **0.2.1은 배포 보류**: 폴더명 수정은 0.2.1 소스/빌드에 들어가 있으나, 사용자가 **추가 기능을 더 모아서 한 번에 배포**하기로 함. 그때까지 GitHub Release·`latest.json`은 0.2.0 그대로 둔다. 다음 실제 배포 시: ① (필요하면) 버전 재상향 → ② **사용자 승인 후** 포터블 exe 빌드 → ③ Release 게시 + `latest.json` 갱신(`cst-update-draft/latest.json` 초안 활용) → ④ 링크/해시 확인.
2. **업데이트 모달 end-to-end 라이브 검증(부분 완료 → 0.2.1로 자연 검증)**: `latest.json`·다운로드 경로·해시는 확인됨. 0.2.1을 실제 게시하면, 설치된 0.2.0 exe가 모달을 띄우고 다운로드 버튼이 브라우저를 여는지 실사용에서 확인할 수 있다.
3. **오류 로그 버튼 라이브 검증(미완)**: 설정 패널 폴더 열기 / 복사 / 삭제 동작 확인.
4. **(완료) userData 폴더명을 `CST`로 정리**: 0.2.1에서 `app.setName('CST')`(모듈 최상위) + 옛 폴더→새 폴더 마이그레이션으로 처리함. dev/패키지 모두 검증 완료.
5. **(향후)**: Claude API 제공사 추가 여부 결정(추가 시 endpoint·키 슬롯·모델 목록·프롬프트 분기 작업 필요), Windows 코드서명 도입, 동작 확인 후 옛 `coc-jp-scenario-translator` 폴더 자동 정리 여부 검토(현재는 보존).

> 배포·업데이트·보안 상세 계획 원문은 `docs-archive/TRPG_번역교정도구_배포_업데이트_보안_계획.md` 참고. 다음 버전 배포 절차 체크리스트는 `릴리스노트_0.2.0.md` 하단 또는 위 "Release status" 절을 참고한다.

## Handoff Notes

When resuming work:

1. Read this file first, especially `Release status (2026-06-01)` and `다음 세션 계획`.
2. Check the latest `Progress Log` entry.
3. Check the current file tree (note: reference/working docs now live in `docs-archive/`).
4. The MVP `Planned Build Order` is fully complete; continue from the first unfinished item in `다음 세션 계획`.
5. Update `Current Status` and `Progress Log` after each meaningful chunk of work.
6. **Never build a portable exe / release artifact without explicit user approval** (see the Build/Release rule at the top of Development Principles).
