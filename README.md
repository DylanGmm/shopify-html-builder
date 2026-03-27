# shopify-html-builder

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

Browser-based **Shopify HTML Builder** for assembling **scoped, production-ready product-detail markup**. The product is built around two headline capabilities:

**Repository**: [github.com/DylanGmm/shopify-html-builder](https://github.com/DylanGmm/shopify-html-builder)

1. **SEO-native workflow** — alt text, semantic heading outlines, image performance hints, and pre-export compliance checks so every fragment ships with guardrails, not guesswork.
2. **AI layout intelligence** — OpenAI-compatible vision APIs suggest section sequences, reproduce layouts from screenshots, and accelerate alt/copy drafts (you supply keys; images never leave endpoints you configure).

**Status**: `0.3.0-rc.1` (release candidate).

**Docs**: [简体中文说明](docs/README.zh-CN.md)

## Features

- **Nine section components** (header, hero, mixed grid, splits, 3-column grid, center copy + optional legend, options row, blueprint) with typed slots.
- **Live preview** in a sandboxed iframe (matches exported full-document HTML).
- **SEO compliance panel** — alt coverage, heading jumps, duplicate alts, dimensions, and oversized image warnings before export.
- **AI assist** — template suggest + layout reproduce modes, payload hints, single automatic retry on transient API failures.
- **Theme system** — per-project overrides for scoped `--ic-*` CSS variables; optional HTTPS theme stylesheets in preview / full HTML export.
- **Multi-SKU** — several drafts per browser profile, JSON export/import per SKU, copy section sequences between SKUs (replace or append).
- **Persistence** — Zustand `persist` key `shopify-html-builder-v1`.
- **Image slicer** — manual regions on long screenshots → slices or data URLs in slots.
- **Local OCR** — Tesseract.js in-browser for headline-style text extraction.
- **Exports** — full HTML download/copy, Shopify fragment copy, optional Product JSON-LD, optional `srcset`/`sizes`, ZIP of all SKUs, Shopify section `.liquid` with `{% raw %}` wrapper.

## Export modes

| Action | Output | Typical use |
|--------|--------|-------------|
| **Export full HTML file** | Complete HTML5 document | Local preview, archives, static hosting |
| **Copy full HTML** | Same payload as the file | Tools that expect a full document |
| **Copy Shopify fragment** | Inline `<style>` + scoped root markup only | Shopify Admin → product → description → HTML |

## Quick start

```bash
npm install
npm run dev
```

```bash
npm run build
npm run lint
npm run preview
```

## Stack

- React 19, TypeScript (strict), Vite 8  
- Tailwind CSS 4 (editor UI only; exported HTML uses scoped custom CSS)  
- Zustand, JSZip, Tesseract.js

## Security

Optional AI features and theme CSS injection involve **user-controlled URLs and API secrets in the browser**. Review [docs/audit/2026-03-27-m3-rc-audit.md](docs/audit/2026-03-27-m3-rc-audit.md) before exposing untrusted users.

## Contributing & planning

Product requirements for maintainers live under [`memory-bank/`](memory-bank/) in local clones (often gitignored). Mirror anything you need on Git remotes into `docs/` if collaborators lack that folder.

## License

Licensed under the **Apache License, Version 2.0**. See [LICENSE](LICENSE) and [NOTICE](NOTICE).
