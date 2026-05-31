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
- Size: `72,734,432` bytes
- SHA256: `2F67F2F3A8196D709607E4C27CCA2311322C6A7CFAD73C96C709A20E1BD36968`

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

## CST 0.2.0 Notes

- Added the built-in user manual and Help menu access.
- Improved the sentence/context cleanup API controls and prose enhancement options.
- Adjusted translator and context editor prompts for Korean readability.
- Improved theme styling, preview sizing, and overwrite confirmation behavior.
- Reduced raw provider response exposure in error logs.
