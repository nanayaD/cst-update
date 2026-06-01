# Security Policy

## Supported Versions

The currently supported public release is `v0.2.0`.

## Reporting A Vulnerability

Please report suspected security issues through GitHub Issues, or contact the maintainer directly if the report contains sensitive details that should not be public.

Do not include real API keys, passwords, private scenario text, or other secrets in public issue bodies, screenshots, or logs.

## API Key Handling

CST asks users to provide their own OpenAI or Gemini API key. The app is designed so that:

- API keys are stored locally on the user's PC.
- API keys are not committed to this repository.
- API keys are not bundled into release executables.
- Error logs mask known key patterns such as `sk-...`, `AIza...`, `Bearer ...`, and `x-goog-api-key`.
- Logs are stored locally and are not automatically transmitted.

## Release Safety Checklist

Before publishing a release, the maintainer should verify:

- `npm run check` passes.
- The portable executable starts successfully.
- `.env` files, logs, local settings, user data, and credentials are not included in the build.
- `latest.json` points only to an existing GitHub Release asset.
- Release notes do not contain private user data or credentials.
