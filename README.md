# CST Update Metadata

This repository hosts public update metadata and release files for CST.

- `latest.json`: production update metadata used by the CST app.
- GitHub Releases: portable Windows executable downloads.

Do not place API keys, passwords, private notes, or user data in this repository.

## Current Release

- Version: `0.2.0`
- Release date: `2026-06-01`
- Package type: `portable`
- Download: https://github.com/nanayaD/cst-update/releases/download/v0.2.0/CST-0.2.0-portable.exe
- Release page: https://github.com/nanayaD/cst-update/releases/tag/v0.2.0
- Size: `72,734,013` bytes
- SHA256: `8532168FBAABBC65029CFF52E9817AEF38F52925D4A80AC47E4605E7F13F507B`

## Update Metadata

`latest.json` should contain only public release information:

- `version`: released app version.
- `releaseDate`: release date in `YYYY-MM-DD` format.
- `downloadUrl`: direct release asset URL, or a release page URL.
- `packageType`: `portable` or `installer`.
- `required`: `true` only for urgent updates.
- `notes`: short Korean release notes suitable for users.

The CST app reads `latest.json` from:

```text
https://raw.githubusercontent.com/nanayaD/cst-update/main/latest.json
```

## Release Procedure

1. Build the portable Windows executable in the CST app repository.
2. Verify the build before publishing:
   - `npm run check` passes.
   - Portable exe starts without stderr errors.
   - No `.env`, logs, tokens, credentials, or private user data are included in the distribution folder.
   - SHA256 hash is recorded.
3. Create a GitHub Release in this repository.
   - Tag format: `vX.Y.Z`.
   - Release title format: `CST X.Y.Z`.
   - Upload the portable exe file as a release asset.
4. Update `latest.json` after the release asset is available.
5. Check the raw `latest.json` URL and the download link before announcing the release.

## CST 0.2.0 Notes (initial release)

First public build of CST. Highlights:

- Japanese -> Korean CoC scenario translator. Output is split into translation, CoC 7th edition notes, review items, and proper-noun / honorific notes.
- Four translation modes (faithful, natural, handout-preserving, CoC 7e note-focused) and an auxiliary memo for names, honorifics, and proper-noun spellings.
- Context editor for cleaning up Korean scenarios: reference swap (local), sentence/context cleanup with prose-enhancement levels, narrator-intrusion removal, and dialogue/narration split preview.
- CoC auto-conversion for mythos names (Korean official 7e), TRPG session terms, and CoC sourcebook abbreviations; uncertain items are collected under review.
- OpenAI / Gemini provider selection with per-provider key storage and live model refresh.
- Built-in user manual with a step-by-step API key issuance guide.
- Local-only error logs (API keys and source text are not recorded) and GitHub-based update check (no auto download or install).
