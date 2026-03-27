import type { SeoIssue, SectionInstance } from '../types'
import type { UiLocale } from '../types/locale'
import { getComponent } from '../registry'
import { resolveSlotLabel } from '../locales/componentZh'
import type { UiMessageKey } from '../locales/uiMessages'

/**
 * Build a localized label for an SEO issue (handles option-card image paths like `cards[0]`).
 * 为 SEO 问题生成本地化槽位标签（支持 `cards[0]` 等复合 id）。
 */
export function getIssueSlotLabel(
  locale: UiLocale,
  sections: SectionInstance[],
  issue: SeoIssue,
): string {
  const sec = sections[issue.sectionIndex]
  if (!sec) return issue.params.label ?? ''
  const comp = getComponent(sec.componentId)
  if (!comp) return issue.params.label ?? ''
  const m = /^([^[]+)\[(\d+)]$/.exec(issue.slotId)
  if (m) {
    const baseId = m[1]
    const idx = Number(m[2])
    const slot = comp.slots.find((s) => s.id === baseId)
    const base = resolveSlotLabel(
      locale,
      comp.id,
      baseId,
      slot?.label ?? issue.params.label ?? '',
    )
    return `${base} #${idx + 1}`
  }
  const slot = comp.slots.find((s) => s.id === issue.slotId)
  return resolveSlotLabel(
    locale,
    comp.id,
    issue.slotId,
    slot?.label ?? issue.params.label ?? '',
  )
}

type TFn = (key: UiMessageKey, vars?: Record<string, string | number>) => string

/**
 * Render a localized sentence for a structured SEO issue.
 * 将结构化 SEO 问题渲染为当前界面语言的句子。
 */
export function formatSeoIssueMessage(
  t: TFn,
  sections: SectionInstance[],
  issue: SeoIssue,
  locale: UiLocale,
): string {
  const label = getIssueSlotLabel(locale, sections, issue)
  const p = issue.params

  switch (issue.code) {
    case 'HEADING_FIRST_H3':
      return t('seoHeadingFirstH3')
    case 'HEADING_JUMP':
      return t('seoHeadingJump', { prev: p.prev ?? 0, next: p.next ?? 0 })
    case 'IMAGE_MISSING_ALT':
      return t('seoImageMissingAlt', { label })
    case 'ALT_TOO_SHORT':
      return t('seoAltTooShort', { label, count: p.charCount ?? 0 })
    case 'ALT_DUPLICATE':
      return t('seoAltDuplicate', { alt: p.alt ?? '' })
    case 'ALT_GENERIC':
      return t('seoAltGeneric', { label })
    case 'ALT_FILENAME':
      return t('seoAltFilename', { label })
    case 'ALT_MATCHES_SRC':
      return t('seoAltMatchesSrc', { label })
    case 'IMAGE_MISSING_DIMS':
      return t('seoImageMissingDims', { label })
    case 'IMAGE_EDGE_TOO_LARGE':
      return t('seoImageEdgeTooLarge', { label, maxPx: p.maxPx ?? 0 })
    default:
      return label || String(issue.code)
  }
}
