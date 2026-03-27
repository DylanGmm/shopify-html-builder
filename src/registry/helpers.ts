import type { ImageSlotValue, PlaceholderSource, TextSlotValue } from '../types'
import { resolvePlaceholderSrc } from '../utils/placeholder'
import {
  buildExportSrcsetString,
  DEFAULT_EXPORT_IMAGE_SIZES,
  deriveSrcsetBasenameFromSrc,
} from '../utils/srcsetSuggest'

/** Escape HTML entities */
export function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** Escape double-quoted HTML attribute values */
function escAttr(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;')
}

/** Render an <img> tag from an ImageSlotValue with SEO attributes */
export function imgTag(
  val: ImageSlotValue | undefined,
  opts: {
    className?: string
    fallbackW?: number
    fallbackH?: number
    fallbackText?: string
    isHero?: boolean
    sectionIndex?: number
    /** When `src` is empty, use placehold.co or embedded SVG (from project). */
    placeholderSource?: PlaceholderSource
    /** Emit `srcset`/`sizes` when true (skips `data:` URLs). */
    includeSrcsetInExport?: boolean
  } = {},
): string {
  const w = val?.width || opts.fallbackW || 1200
  const h = val?.height || opts.fallbackH || 800
  const ph = opts.placeholderSource ?? 'remote'
  const src = val?.src || resolvePlaceholderSrc(w, h, opts.fallbackText, ph)
  const alt = esc(val?.alt || '')
  const cls = opts.className ? ` class="${opts.className}"` : ''
  const loading =
    opts.isHero || (opts.sectionIndex !== undefined && opts.sectionIndex === 0)
      ? 'eager'
      : 'lazy'
  const priority =
    opts.isHero || (opts.sectionIndex !== undefined && opts.sectionIndex === 0)
      ? '\n        fetchpriority="high"'
      : ''

  let responsiveAttrs = ''
  if (opts.includeSrcsetInExport) {
    const rawForBase = (val?.src || '').trim()
    if (!rawForBase.startsWith('data:')) {
      const base = deriveSrcsetBasenameFromSrc(rawForBase || src) ?? 'image'
      const srcset = buildExportSrcsetString(w, base)
      if (srcset) {
        responsiveAttrs = `\n        srcset="${escAttr(srcset)}"\n        sizes="${escAttr(DEFAULT_EXPORT_IMAGE_SIZES)}"`
      }
    }
  }

  return `<img
        src="${src}"${cls}
        alt="${alt}"
        width="${w}"
        height="${h}"
        loading="${loading}"${priority}
        decoding="async"${responsiveAttrs}
      >`
}

/** Get text content, with fallback */
export function txt(val: TextSlotValue | undefined, fallback = ''): string {
  return esc(val?.content || fallback)
}

/** Multiline text → HTML with `<br />` between lines (each line escaped). */
export function txtBr(val: TextSlotValue | undefined, fallback: string): string {
  const raw = (val?.content?.trim() ? val.content : fallback).replace(/\r\n/g, '\n')
  return raw
    .split('\n')
    .map((line) => esc(line))
    .join('<br>\n')
}
