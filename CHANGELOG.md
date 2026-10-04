# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Versions are driven by a single source of truth, `desktop/src-tauri/tauri.conf.json`.
Use `npm run version:set -- <version>` to bump every manifest at once, then tag
`v<version>`. A tag whose number does not match the app version fails CI.

## [Unreleased]

### Changed

- Backend dependencies are installed with bun instead of npm (`bun.lock` replaces
  `package-lock.json`), both locally, in Docker and in CI. The runtime stays on
  node, so only the install step changed.

## [0.1.0] - Unreleased

First release. Ships the web app, the desktop app and the release pipeline.

### Added

- Multi-currency accounts (bank, cash, savings, crypto, custom) with icons and
  per-category grouping in the sidebar.
- Income, expense and transfer tracking with hierarchical categories, dates and
  descriptions.
- Spending analytics via donut charts with period filtering.
- JWT authentication: bearer access tokens plus refresh tokens in httpOnly
  cookies, email verification and password recovery.
- Desktop application built on Tauri 2 with an offline-first local SQLite
  database, so the app is fully usable without the backend.
- Single-instance support and a scoped CSP for the desktop webview.
- Release artifacts: MSI, DMG, AppImage and a portable Windows zip.
- Release pipeline: tags `v*` now trigger CI before `release.yml` is allowed to
  build, and the release is published automatically instead of staying a draft.
- Version is shown in the desktop sidebar via the Tauri `getVersion()` API.

### Changed

- Version is defined once in `tauri.conf.json` and propagated to `Cargo.toml`
  and all `package.json` manifests by `npm run version`.
- CI verifies that all version files stay in sync and that the pushed tag
  matches the app version.

[Unreleased]: https://github.com/zoom1fy/mymoney/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/zoom1fy/mymoney/releases/tag/v0.1.0