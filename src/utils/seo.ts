import type {
  SectionInstance,
  SeoIssue,
  ImageSlotValue,
  AnySlotDef,
  OptionCardsSlotValue,
  TextSlotValue,
} from '../types'
import { getComponent } from '../registry'

const MAX_IMAGE_EDGE_PX = 4000
const DOC_SLOT = '__document__'
const IMG_FILE_EXT = /\.(jpe?g|png|webp|gif|svg|avif|bmp|heic)$/i

/**
 * Alt looks like a bare filename ( poor for SEO ).
 * Alt 像纯文件名，对 SEO 不友好。
 */
function altLooksLikeFileName(alt: string): boolean {
  const t = alt.trim()
  if (t.length < 5) return false
  if (IMG_FILE_EXT.test(t)) return true
  if (/^(img[-_]?|dsc|photo[-_]?)\d+/i.test(t)) return true
  return false
}

/**
 * Alt is a generic filler word.
 * Alt 为泛化词。
 */
function altIsGeneric(alt: string): boolean {
  const t = alt.trim().toLowerCase()
  const bad = new Set([
    'image',
    'img',
    'photo',
    'picture',
    'pic',
    'screenshot',
    '图',
    '图片',
    '图像',
    '照片',
  ])
  return bad.has(t)
}

/**
 * Alt exactly matches the URL path basename (lazy copy from filename).
 * Alt 与图片 URL 的文件名一致。
 */
function altMatchesSrcBasename(src: string, alt: string): boolean {
  const a = alt.trim()
  if (a.length < 2 || !src.trim().startsWith('http')) return false
  try {
    const path = new URL(src).pathname
    const base = decodeURIComponent(path.split('/').pop() || '')
    return base.length > 0 && base === a
  } catch {
    return false
  }
}

/**
 * Collect ordered heading levels (h2=2, h3=3) as emitted in templates.
 * 按槽位顺序收集导出后的标题层级（optionCards 每项对应一个 h3）。
 */
function flattenHeadingLevels(sections: SectionInstance[]): number[] {
  const levels: number[] = []
  for (const section of sections) {
    const comp = getComponent(section.componentId)
    if (!comp) continue
    for (const slot of comp.slots) {
      if (slot.kind === 'text') {
        if (slot.tag === 'h2' || slot.tag === 'h3') {
          const val = section.values[slot.id] as TextSlotValue | undefined
          if (!val?.content?.trim()) continue
          levels.push(slot.tag === 'h2' ? 2 : 3)
        }
      } else if (slot.kind === 'optionCards') {
        const val = section.values[slot.id] as OptionCardsSlotValue | undefined
        const n = val?.items?.length ?? 0
        for (let i = 0; i < n; i++) levels.push(3)
      }
    }
  }
  return levels
}

/**
 * Validate heading level sequence (no skipped levels).
 * 校验标题层级不出现跳级（如 h2 直接接 h4——当前仅有 h2/h3）。
 */
function checkHeadingHierarchy(sections: SectionInstance[]): SeoIssue[] {
  const issues: SeoIssue[] = []
  const levels = flattenHeadingLevels(sections)
  let prev = 0
  for (const L of levels) {
    if (prev === 0 && L === 3) {
      issues.push({
        sectionIndex: 0,
        slotId: DOC_SLOT,
        severity: 'warning',
        code: 'HEADING_FIRST_H3',
        params: {},
      })
    }
    if (prev > 0 && L > prev + 1) {
      issues.push({
        sectionIndex: 0,
        slotId: DOC_SLOT,
        severity: 'error',
        code: 'HEADING_JUMP',
        params: { prev, next: L },
      })
    }
    prev = L
  }
  return issues
}

function pushImageIssues(
  issues: SeoIssue[],
  sectionIndex: number,
  slotId: string,
  label: string,
  val: ImageSlotValue | undefined,
  allAlts: Set<string>,
): void {
  if (!val) return
  const alt = val.alt?.trim() ?? ''

  if (!alt) {
    issues.push({
      sectionIndex,
      slotId,
      severity: 'error',
      code: 'IMAGE_MISSING_ALT',
      params: { label },
    })
  } else {
    if (alt.length < 5) {
      issues.push({
        sectionIndex,
        slotId,
        severity: 'warning',
        code: 'ALT_TOO_SHORT',
        params: { label, charCount: alt.length },
      })
    }
    if (allAlts.has(alt)) {
      issues.push({
        sectionIndex,
        slotId,
        severity: 'warning',
        code: 'ALT_DUPLICATE',
        params: { alt },
      })
    }
    if (altIsGeneric(alt)) {
      issues.push({
        sectionIndex,
        slotId,
        severity: 'warning',
        code: 'ALT_GENERIC',
        params: { label },
      })
    }
    if (altLooksLikeFileName(alt)) {
      issues.push({
        sectionIndex,
        slotId,
        severity: 'warning',
        code: 'ALT_FILENAME',
        params: { label },
      })
    }
    if (val.src?.trim() && altMatchesSrcBasename(val.src, alt)) {
      issues.push({
        sectionIndex,
        slotId,
        severity: 'warning',
        code: 'ALT_MATCHES_SRC',
        params: { label },
      })
    }
  }

  if (alt) allAlts.add(alt)

  if (!val.width || !val.height) {
    issues.push({
      sectionIndex,
      slotId,
      severity: 'warning',
      code: 'IMAGE_MISSING_DIMS',
      params: { label },
    })
  }

  if (val.width > MAX_IMAGE_EDGE_PX || val.height > MAX_IMAGE_EDGE_PX) {
    issues.push({
      sectionIndex,
      slotId,
      severity: 'warning',
      code: 'IMAGE_EDGE_TOO_LARGE',
      params: { label, maxPx: MAX_IMAGE_EDGE_PX },
    })
  }
}

/**
 * Run SEO compliance checks on the current section sequence.
 * Returns a list of issues sorted by severity.
 */
export function checkSeo(sections: SectionInstance[]): SeoIssue[] {
  const issues: SeoIssue[] = [...checkHeadingHierarchy(sections)]
  const allAlts = new Set<string>()

  sections.forEach((section, idx) => {
    const comp = getComponent(section.componentId)
    if (!comp) return

    comp.slots.forEach((slotDef: AnySlotDef) => {
      if (slotDef.kind === 'image') {
        const val = section.values[slotDef.id] as ImageSlotValue | undefined
        pushImageIssues(issues, idx, slotDef.id, slotDef.label, val, allAlts)
      } else if (slotDef.kind === 'optionCards') {
        const pack = section.values[slotDef.id] as OptionCardsSlotValue | undefined
        pack?.items?.forEach((card, cIdx) => {
          pushImageIssues(
            issues,
            idx,
            `${slotDef.id}[${cIdx}]`,
            `${slotDef.label} #${cIdx + 1}`,
            card.image,
            allAlts,
          )
        })
      }
    })
  })

  return issues.sort((a, b) => {
    if (a.severity === 'error' && b.severity !== 'error') return -1
    if (a.severity !== 'error' && b.severity === 'error') return 1
    if (a.sectionIndex !== b.sectionIndex) return a.sectionIndex - b.sectionIndex
    return a.slotId.localeCompare(b.slotId)
  })
}
