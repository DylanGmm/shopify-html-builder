import type { PlaceholderSource, Project, SectionInstance } from '../types'
import { getComponent } from '../registry'
import { esc } from '../registry/helpers'
import { buildProductJsonLdString } from './productJsonLd'
import { renderFreeformSectionHtml, resolveFreeformCss } from './freeformRenderer'
import { FREEFORM_COMPONENT_ID } from '../types/freeform'

/** Default theme CSS custom properties (override per project via `Project.cssVars`). */
export const DEFAULT_CSS_VARS: Record<string, string> = {
  '--ic-blue': '#1c5e9a',
  '--ic-dark': '#1d1d1f',
  '--ic-gray': '#86868b',
  '--ic-green': '#159b60',
  '--ic-white': '#ffffff',
  '--ic-grad': 'linear-gradient(135deg, #000000 30%, #434343 60%, #1c5e9a 100%)',
  '--ic-font':
    '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", Helvetica, Arial, sans-serif',
}

/**
 * Base CSS shared by all components — reset, root container, images, typography, responsive.
 * 全组件共享的基础 CSS：重置、根容器、图片、排版与响应式规则。
 */
function baseCSS(rc: string, cssVars: Record<string, string>, maxContentWidth = 1200): string {
  const vars = { ...DEFAULT_CSS_VARS, ...cssVars }
  const mw = Math.max(320, Math.min(2400, Math.round(maxContentWidth) || 1200))
  return `
.${rc} {
  ${Object.entries(vars)
    .map(([k, v]) => `${k}: ${v};`)
    .join('\n')}
  font-family: var(--ic-font);
  color: var(--ic-dark);
  background-color: var(--ic-white);
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
  overflow-x: hidden;
}
.${rc} *, .${rc} *::before, .${rc} *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}
.${rc} .ic-wrap {
  max-width: ${mw}px;
  margin: 0 auto;
  padding: 60px 40px;
}
.${rc} section {
  margin-bottom: 90px;
}
.${rc} img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
  object-position: center;
  border-radius: 8px;
}
.${rc} .ic-contain { object-fit: contain; }
.${rc} .ic-ar-11  { aspect-ratio: 1 / 1; }
.${rc} .ic-ar-169 { aspect-ratio: 16 / 9; }
.${rc} .ic-ar-219 { aspect-ratio: 21 / 9; }
.${rc} .ic-ar-34  { aspect-ratio: 3 / 4; }
.${rc} .ic-ar-43  { aspect-ratio: 4 / 3; }
.${rc} .ic-ar-31  { aspect-ratio: 3 / 1; }
.${rc} .ic-icon   { height: auto; object-fit: contain; border-radius: 0; background: transparent; }
.${rc} .ic-title {
  background: var(--ic-grad);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-size: 38px;
  font-weight: 700;
  margin-bottom: 12px;
  letter-spacing: -0.02em;
}
.${rc} .ic-subtitle {
  font-size: 20px;
  font-weight: 600;
  color: var(--ic-dark);
  margin-bottom: 24px;
  letter-spacing: -0.01em;
}
.${rc} .ic-desc {
  font-size: 15px;
  color: var(--ic-gray);
  line-height: 1.7;
  margin-bottom: 36px;
}
.${rc} .ic-center { text-align: center; }
@media (max-width: 768px) {
  .${rc} .ic-wrap { padding: 36px 18px; }
  .${rc} section { margin-bottom: 60px; }
  .${rc} .ic-title { font-size: 26px !important; text-align: center; }
  .${rc} .ic-subtitle { font-size: 15px; text-align: center; }
  .${rc} .ic-desc { font-size: 13px; text-align: center; }
}`.trim()
}

/**
 * Render a full project to an HTML string (style + body).
 */
export function renderProject(project: Project): string {
  const rc = project.rootClass || 'ic-page'
  const mergedVars = project.cssVars ?? {}
  const maxContentWidth = project.maxContentWidth ?? 1200

  const componentCssSet = new Set<string>()
  const freeformCssParts: string[] = []
  const sectionHtmlParts: string[] = []

  const placeholderSource = project.placeholderSource ?? 'remote'
  const includeSrcsetInExport = project.includeSrcsetInExport === true

  project.sections.forEach((section, idx) => {
    if (section.componentId === FREEFORM_COMPONENT_ID && section.freeform) {
      const freeformCss = resolveFreeformCss(section.freeform.css, rc)
      freeformCssParts.push(freeformCss)
      const html = renderFreeformSectionHtml(section.freeform, idx, placeholderSource)
      sectionHtmlParts.push(html)
      return
    }

    const comp = getComponent(section.componentId)
    if (!comp) return

    componentCssSet.add(comp.css.replaceAll('{{ROOT}}', rc))

    const html = comp.renderHtml(section.values, {
      rootClass: rc,
      sectionIndex: idx,
      totalSections: project.sections.length,
      placeholderSource,
      includeSrcsetInExport,
    })
    sectionHtmlParts.push(html)
  })

  const allCss = [baseCSS(rc, mergedVars, maxContentWidth), ...componentCssSet, ...freeformCssParts].join('\n\n')

  return `<style>\n${allCss}\n</style>\n\n<div class="${rc}">\n  <div class="ic-wrap">\n\n${sectionHtmlParts.join('\n\n')}\n\n  </div>\n</div>`
}

export type StandaloneDocumentMode = 'export' | 'preview'

/**
 * Build `<link rel="stylesheet">` tags for validated HTTPS theme URLs (max 5).
 */
function themeStylesheetLinkTags(urls: string[] | undefined): string {
  if (!urls?.length) return ''
  const seen = new Set<string>()
  const lines: string[] = []
  for (const raw of urls.slice(0, 5)) {
    const u = raw.trim()
    if (!u.startsWith('https://')) continue
    try {
      const parsed = new URL(u)
      if (parsed.protocol !== 'https:') continue
      if (seen.has(parsed.href)) continue
      seen.add(parsed.href)
      lines.push(`  <link rel="stylesheet" href="${esc(parsed.href)}">`)
    } catch {
      /* skip invalid */
    }
  }
  return lines.length ? `\n${lines.join('\n')}` : ''
}

/**
 * Full HTML5 document for download, local preview, or hosting (not just a Shopify fragment).
 * 完整可双击打开的单文件 HTML（含 DOCTYPE / head / body），用于一键导出。
 *
 * @param project — Active project
 * @param options.mode — `preview`: inject theme CSS URLs when set; `export`: inject only if `includeThemeStylesheetUrlsInExport`
 */
export function renderStandaloneDocument(
  project: Project,
  options?: { mode?: StandaloneDocumentMode },
): string {
  if (project.sections.length === 0) return ''
  const fragment = renderProject(project)
  const title = esc((project.name || 'Product page').trim() || 'Product page')
  const jsonLd =
    project.includeProductJsonLd === true
      ? `\n  <script type="application/ld+json">\n  ${buildProductJsonLdString(project)}\n  </script>`
      : ''
  const mode = options?.mode ?? 'export'
  const themeUrls = project.previewThemeStylesheetUrls
  const injectTheme =
    mode === 'preview' ||
    (mode === 'export' && project.includeThemeStylesheetUrlsInExport === true)
  const themeLinks = injectTheme ? themeStylesheetLinkTags(themeUrls) : ''

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>${themeLinks}
  <style>
    body { margin: 0; background: #fff; }
  </style>${jsonLd}
</head>
<body>
${fragment}
</body>
</html>`
}

/**
 * Render just a single section for preview (includes base CSS).
 */
export function renderSection(
  section: SectionInstance,
  rc: string,
  idx: number,
  cssVars: Record<string, string> = {},
  placeholderSource: PlaceholderSource = 'remote',
  maxContentWidth = 1200,
): string {
  if (section.componentId === FREEFORM_COMPONENT_ID && section.freeform) {
    const css = [baseCSS(rc, cssVars, maxContentWidth), resolveFreeformCss(section.freeform.css, rc)].join('\n\n')
    const html = renderFreeformSectionHtml(section.freeform, idx, placeholderSource)
    return `<style>${css}</style><div class="${rc}"><div class="ic-wrap">${html}</div></div>`
  }

  const comp = getComponent(section.componentId)
  if (!comp) return ''

  const css = [baseCSS(rc, cssVars, maxContentWidth), comp.css.replaceAll('{{ROOT}}', rc)].join('\n\n')
  const html = comp.renderHtml(section.values, {
    rootClass: rc,
    sectionIndex: idx,
    totalSections: 1,
    placeholderSource,
    includeSrcsetInExport: false,
  })

  return `<style>${css}</style><div class="${rc}"><div class="ic-wrap">${html}</div></div>`
}
