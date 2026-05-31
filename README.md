# CST Update Metadata

This repository hosts public update metadata for CST.

- `latest.json`: production update metadata
- `latest-test.json`: test metadata for update-check verification

Do not place API keys, passwords, private notes, or user data in these files.

## Release procedure

1. Build the portable Windows executable in the CST app repository.
2. Verify the build before publishing:
   - `npm run check` passes.
   - Portable exe starts without stderr errors.
   - No `.env`, logs, tokens, credentials, or private user data are included in the distribution folder.
   - Record the SHA256 hash of the final exe.
3. Create a GitHub Release in this repository.
   - Tag format: `vX.Y.Z`.
   - Release title format: `CST X.Y.Z`.
   - Upload the portable exe file as a release asset.
4. After the release asset is available, update `latest.json`.
   - `version`: released app version.
   - `downloadUrl`: direct release asset URL, or the release page URL if the app should open the release page.
   - `sha256`: SHA256 hash of the exact uploaded exe.
   - `notes`: short Korean release notes suitable for users.
5. Use `latest-test.json` first when testing update-check behavior.
6. Only promote the same metadata to `latest.json` after the release page and download link have been checked.

## CST 0.2.0 build record

Local artifact prepared on 2026-06-01:

- File: `CST-0.2.0-portable.exe`
- Size: `72,733,722` bytes
- SHA256: `3B5009F9ED296754BCC70EA3372EF5110F0D060C957E247D5CAE79A734EF5958`

Publishing note: the release asset still needs to be uploaded to GitHub Releases before `latest.json` is changed to `0.2.0`.
