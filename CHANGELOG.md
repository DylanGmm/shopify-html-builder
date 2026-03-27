# Changelog

All notable changes to this project are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html) for **package** releases. The **PRD document version** in `memory-bank/PRD.md` may be bumped independently; when it does, this file notes it under the same product pre-release line when changes ship together.

## [Unreleased]

### Added

- **Docs**: `docs/images/demo-snapshot.png` UI screenshot embedded in root `README.md` and `docs/README.zh-CN.md`.

### Changed

- **Distribution**: Apache-2.0 `LICENSE` + `NOTICE`, `package.json` `license` field, drop `private` flag for public clones.
- **Docs**: English root `README.md`, `docs/README.zh-CN.md`, `docs/README.md` index; remove legacy standalone `img2shopify.html` from the tree (pattern in `.gitignore`); PRD/project brief aligned with registry-first references.
- **Positioning**: AI + SEO described as signature capabilities in README, PRD, project brief, and UI strings (`uiMessages`).

## [0.3.0-rc.1] - 2026-03-27

### Added

- **F-19 (export)**: Optional `srcset` / `sizes` on exported `<img>` when enabled (placeholder multi-resolution names; skips `data:` URLs).
- **F-22**: Up to five HTTPS theme stylesheet URLs in Project Settings; injected in **preview** full document; optional inclusion in downloaded/copied full HTML.
- **F-21**: **Export all SKUs (ZIP)** — one full `.html` per non-empty SKU using each project’s export flags.
- **F-20**: **OCR (local)** panel — Tesseract.js in-browser; copy or apply text to a selected section’s text slot.
- **F-24**: Download / copy **Shopify OS 2.0** section `.liquid` wrapping the fragment in `{% raw %}` (static HTML; re-export after edits).
- **`exportService`**, **`bulkExportService`**, **`ocrService`**, **`themeUrls`**, **`shopifySectionExport`** utilities for a single export entry point and batch ZIP.

### Security / audit

- See [docs/audit/2026-03-27-m3-rc-audit.md](docs/audit/2026-03-27-m3-rc-audit.md) for the M3 RC review (XSS surface, secrets, dependencies).

## [0.2.0-beta.1] - 2026-03-27

### Changed

- **Documentation**: `memory-bank/PRD.md` revised to **0.2.2** — status line, §2.1 shipped capabilities, F-19 (partial), M3 milestone row, vision API risk note; `progress.md`, `techContext.md`, `projectbrief.md`, and `version-rules.md` cross-references updated; root `README.md` feature list aligned with current SPA behavior (multi-SKU, cross-SKU sequence copy, AI retry and payload hints, image slicer, JSON-LD, srcset editor hint vs export).
