import { useState, useMemo } from 'react'
import { useUiStrings } from '../hooks/useUiStrings'
import { selectActiveProject, useEditorStore } from '../store/editorStore'
import {
  getFullPageHtml,
  getShopifyFragmentHtml,
  getShopifySectionLiquid,
} from '../services/exportService'
import { zipAllProjectsHtml } from '../services/bulkExportService'
import { checkSeo } from '../utils/seo'
import { formatSeoIssueMessage } from '../utils/seoIssueFormat'
import type { UiMessageKey } from '../locales/uiMessages'
import type { UiLocale } from '../types/locale'
import type { SeoIssue, SectionInstance } from '../types'
import { logger } from '../utils/logger'

type TFn = (key: UiMessageKey, vars?: Record<string, string | number>) => string

function SeoReport({
  errors,
  warnings,
  sections,
  locale,
  t,
}: {
  errors: SeoIssue[]
  warnings: SeoIssue[]
  sections: SectionInstance[]
  locale: UiLocale
  t: TFn
}) {
  if (errors.length === 0 && warnings.length === 0) {
    return (
      <div className="rounded-lg border border-warm-gray/50 bg-white/30 px-3 py-2 text-xs text-ink/75">
        {t('seoPassed')}
      </div>
    )
  }

  const prefix = (issue: SeoIssue) =>
    issue.slotId === '__document__'
      ? t('seoDocument')
      : t('seoSection', { n: issue.sectionIndex + 1 })

  return (
    <div className="space-y-1">
      {errors.map((issue, i) => (
        <div
          key={`e-${i}`}
          className="rounded-lg border border-terracotta/35 bg-terracotta/10 px-3 py-1.5 text-xs text-ink"
        >
          <span className="font-mono text-[9px] uppercase tracking-wider text-terracotta">Err</span>{' '}
          {prefix(issue)}: {formatSeoIssueMessage(t, sections, issue, locale)}
        </div>
      ))}
      {warnings.map((issue, i) => (
        <div
          key={`w-${i}`}
          className="rounded-lg border border-mustard/50 bg-mustard/15 px-3 py-1.5 text-xs text-ink"
        >
          <span className="font-mono text-[9px] uppercase tracking-wider text-ink/55">Warn</span>{' '}
          {prefix(issue)}: {formatSeoIssueMessage(t, sections, issue, locale)}
        </div>
      ))}
    </div>
  )
}

/**
 * Export panel: SEO report, export toggles, copy/download, bulk ZIP, Shopify section file.
 */
export function ExportPanel() {
  const { t, locale } = useUiStrings()
  const project = useEditorStore(selectActiveProject)
  const projects = useEditorStore((s) => s.projects)
  const updateProject = useEditorStore((s) => s.updateProject)
  const [copiedTarget, setCopiedTarget] = useState<null | 'full' | 'shopify' | 'liquid'>(null)
  const [showCode, setShowCode] = useState(false)
  const [zipBusy, setZipBusy] = useState(false)

  const fullHtml = useMemo(() => getFullPageHtml(project, 'export'), [project])
  const shopifyFragment = useMemo(() => getShopifyFragmentHtml(project), [project])
  const liquidSection = useMemo(() => getShopifySectionLiquid(project), [project])
  const canSectionExport = project.sections.length > 0

  const seoIssues = useMemo(() => checkSeo(project.sections), [project.sections])
  const errors = seoIssues.filter((i) => i.severity === 'error')
  const warnings = seoIssues.filter((i) => i.severity === 'warning')

  const handleCopyFull = async () => {
    if (!fullHtml) return
    await navigator.clipboard.writeText(fullHtml)
    setCopiedTarget('full')
    setTimeout(() => setCopiedTarget(null), 2000)
  }

  const handleCopyShopifyFragment = async () => {
    if (!shopifyFragment) return
    await navigator.clipboard.writeText(shopifyFragment)
    setCopiedTarget('shopify')
    setTimeout(() => setCopiedTarget(null), 2000)
  }

  const handleCopyLiquid = async () => {
    if (!canSectionExport) return
    await navigator.clipboard.writeText(liquidSection)
    setCopiedTarget('liquid')
    setTimeout(() => setCopiedTarget(null), 2000)
  }

  const handleExportHtml = () => {
    if (!fullHtml) return
    const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const safeBase = (project.name || 'export').replace(/[/\\?%*:|"<>]/g, '-').slice(0, 80)
    a.download = `${safeBase || 'export'}.html`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleExportLiquid = () => {
    if (!canSectionExport) return
    const blob = new Blob([liquidSection], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const safeBase = (project.name || 'ic-export').replace(/[/\\?%*:|"<>]/g, '-').slice(0, 80)
    a.download = `${safeBase || 'ic-export'}.liquid`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleExportAllZip = async () => {
    setZipBusy(true)
    const result = await zipAllProjectsHtml(projects)
    setZipBusy(false)
    if (!result.ok) {
      logger.error('Bulk export failed', result.error.message)
      window.alert(`${t('bulkExportFailed')}: ${result.error.message}`)
      return
    }
    const url = URL.createObjectURL(result.value)
    const a = document.createElement('a')
    a.href = url
    a.download = 'shopify-html-builder-all-skus.zip'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="chrome-heading px-1">{t('exportHeading')}</h2>

      <label className="flex cursor-pointer items-start gap-2 px-1">
        <input
          type="checkbox"
          checked={project.includeProductJsonLd === true}
          onChange={(e) => updateProject({ includeProductJsonLd: e.target.checked })}
          className="mt-0.5 rounded border-warm-gray/70 text-terracotta focus:ring-terracotta/30"
        />
        <span className="text-xs leading-snug text-ink/65">{t('exportJsonLd')}</span>
      </label>

      <label className="flex cursor-pointer items-start gap-2 px-1">
        <input
          type="checkbox"
          checked={project.includeSrcsetInExport === true}
          onChange={(e) => updateProject({ includeSrcsetInExport: e.target.checked })}
          className="mt-0.5 rounded border-warm-gray/70 text-terracotta focus:ring-terracotta/30"
        />
        <span className="text-xs leading-snug text-ink/65">{t('exportSrcset')}</span>
      </label>

      <label className="flex cursor-pointer items-start gap-2 px-1">
        <input
          type="checkbox"
          checked={project.includeThemeStylesheetUrlsInExport === true}
          onChange={(e) => updateProject({ includeThemeStylesheetUrlsInExport: e.target.checked })}
          className="mt-0.5 rounded border-warm-gray/70 text-terracotta focus:ring-terracotta/30"
        />
        <span className="text-xs leading-snug text-ink/65">{t('exportThemeUrls')}</span>
      </label>

      <SeoReport
        errors={errors}
        warnings={warnings}
        sections={project.sections}
        locale={locale}
        t={t}
      />

      <button
        type="button"
        onClick={handleExportHtml}
        disabled={!fullHtml}
        className="w-full rounded-lg bg-ink px-4 py-2.5 text-sm font-semibold text-mustard transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {t('exportFullHtml')}
      </button>
      <p className="-mt-1 px-0.5 font-mono text-[10px] leading-snug text-ink/45">{t('exportFullHtmlHint')}</p>

      <button
        type="button"
        onClick={handleCopyFull}
        disabled={!fullHtml}
        className="w-full rounded-lg border border-warm-gray/60 bg-white/25 px-4 py-2 text-sm font-medium text-ink transition hover:border-terracotta/40 hover:bg-white/40 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {copiedTarget === 'full' ? t('exportCopyFullDone') : t('exportCopyFullIdle')}
      </button>

      <button
        type="button"
        onClick={handleCopyShopifyFragment}
        disabled={!shopifyFragment}
        className="w-full rounded-lg border border-warm-gray/50 bg-white/15 px-4 py-2 text-xs font-medium text-ink/80 transition hover:border-warm-gray/80 hover:bg-white/30 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {copiedTarget === 'shopify' ? t('exportCopyShopifyDone') : t('exportCopyShopifyIdle')}
      </button>
      <p className="-mt-2 px-0.5 font-mono text-[10px] leading-snug text-ink/45">{t('exportShopifyFragmentHint')}</p>

      <button
        type="button"
        onClick={handleExportAllZip}
        disabled={zipBusy}
        className="w-full rounded-lg border border-ink/15 bg-mustard/25 px-4 py-2 text-xs font-semibold text-ink transition hover:bg-mustard/40 disabled:opacity-40"
      >
        {zipBusy ? t('exportZipBusy') : t('exportZipIdle')}
      </button>
      <p className="-mt-2 px-0.5 font-mono text-[10px] leading-snug text-ink/45">{t('exportZipHint')}</p>

      <div className="space-y-2 rounded-lg border border-warm-gray/50 bg-white/20 p-3">
        <h3 className="chrome-heading">{t('exportLiquidHeading')}</h3>
        <p className="text-[10px] leading-snug text-ink/55">
          {t('exportLiquidHint')}{' '}
          <code className="font-mono text-ink/45">{'{% raw %}'}</code> /{' '}
          <code className="font-mono text-ink/45">{'{% endraw %}'}</code>
        </p>
        <button
          type="button"
          onClick={handleExportLiquid}
          disabled={!canSectionExport}
          className="w-full rounded-lg border border-terracotta/40 bg-terracotta/10 px-3 py-2 text-xs font-medium text-ink transition hover:bg-terracotta/18 disabled:opacity-40"
        >
          {t('exportLiquidDownload')}
        </button>
        <button
          type="button"
          onClick={handleCopyLiquid}
          disabled={!canSectionExport}
          className="w-full rounded-lg border border-warm-gray/55 px-3 py-1.5 text-[11px] text-ink/70 transition hover:bg-white/30 disabled:opacity-40"
        >
          {copiedTarget === 'liquid' ? t('exportCopyLiquidDone') : t('exportCopyLiquidIdle')}
        </button>
      </div>

      {fullHtml && (
        <button
          type="button"
          onClick={() => setShowCode(!showCode)}
          className="text-left font-mono text-[10px] uppercase tracking-wider text-ink/45 hover:text-terracotta"
        >
          {showCode ? t('exportShowCodeOpen') : t('exportShowCodeClosed')}
        </button>
      )}

      {showCode && fullHtml && (
        <pre className="max-h-64 overflow-auto whitespace-pre-wrap break-all rounded-lg border border-warm-gray/50 bg-white/40 p-3 font-mono text-[11px] text-ink/70">
          {fullHtml}
        </pre>
      )}
    </div>
  )
}
