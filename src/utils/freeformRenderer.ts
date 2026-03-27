/**
 * Freeform section renderer: substitutes `{{IMG:id}}` and `{{TEXT:id}}` tokens
 * in AI-generated HTML templates, producing final scoped HTML.
 * 自由排版区块渲染器：将 AI 生成的 HTML 模板中的占位符替换为实际内容。
 */

import type { FreeformSectionData, FreeformImageRef } from '../types/freeform'
import type { PlaceholderSource } from '../types'
import { resolvePlaceholderSrc } from './placeholder'

/**
 * Escape HTML special characters.
 * HTML 实体转义。
 */
function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
 * Build an `<img>` tag for a freeform image reference.
 * Uses placeholder when `src` is empty; locks dimensions and aspect ratio.
 */
function buildFreeformImgTag(
  img: FreeformImageRef,
  sectionIndex: number,
  placeholderSource: PlaceholderSource,
): string {
  const w = img.width || 1200
  const h = img.height || 800
  const src = img.src?.trim() || resolvePlaceholderSrc(w, h, img.tokenId, placeholderSource)
  const alt = esc(img.alt || '')
  const loading = sectionIndex === 0 ? 'eager' : 'lazy'
  const priority = sectionIndex === 0 ? '\n        fetchpriority="high"' : ''

  return `<img
        src="${src}"
        alt="${alt}"
        width="${w}"
        height="${h}"
        loading="${loading}"${priority}
        decoding="async"
      >`
}

/**
 * Render a freeform section to HTML by substituting template tokens.
 * `{{IMG:tokenId}}` → `<img>` tag with placeholder or user-provided src.
 * `{{TEXT:tokenId}}` → escaped text content.
 *
 * @returns HTML string for the section body (no wrapping `<section>` — that's in the template itself)
 */
export function renderFreeformSectionHtml(
  data: FreeformSectionData,
  sectionIndex: number,
  placeholderSource: PlaceholderSource,
): string {
  let html = data.htmlTemplate

  for (const img of data.images) {
    const token = `{{IMG:${img.tokenId}}}`
    const tag = buildFreeformImgTag(img, sectionIndex, placeholderSource)
    html = html.replaceAll(token, tag)
  }

  for (const txt of data.texts) {
    const token = `{{TEXT:${txt.tokenId}}}`
    html = html.replaceAll(token, esc(txt.content))
  }

  return html
}

/**
 * Resolve the scoped CSS for a freeform section.
 * Replaces `{{ROOT}}` with the project's root class.
 */
export function resolveFreeformCss(css: string, rootClass: string): string {
  return css.replaceAll('{{ROOT}}', rootClass)
}
