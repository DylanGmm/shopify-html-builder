import type { PlaceholderSource } from '../types'

export type { PlaceholderSource }

/**
 * Generate a placehold.co URL for a given dimension.
 *
 * @param w - width in px (clamped 10–4000)
 * @param h - height in px (clamped 10–4000)
 * @param text - optional label shown on the placeholder
 */
export function placeholderUrl(w: number, h: number, text?: string): string {
  const cw = Math.max(10, Math.min(4000, Math.round(w)))
  const ch = Math.max(10, Math.min(4000, Math.round(h)))
  const base = `https://placehold.co/${cw}x${ch}/EEE/999/png`
  if (text) {
    return `${base}?text=${encodeURIComponent(text)}`
  }
  return base
}

/**
 * Escape text for SVG / XML content.
 * 对 SVG 文本内容做安全转义。
 */
function escSvgText(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
 * Offline-friendly placeholder as SVG data URI (no network).
 * 本地 SVG data URI 占位图，不依赖 placehold.co。
 */
export function svgPlaceholderDataUrl(w: number, h: number, text?: string): string {
  const cw = Math.max(10, Math.min(4000, Math.round(w)))
  const ch = Math.max(10, Math.min(4000, Math.round(h)))
  const labelRaw = (text?.trim() ? text : `${cw}×${ch}`).slice(0, 80)
  const label = escSvgText(labelRaw)
  const fs = Math.max(10, Math.min(48, Math.round(Math.min(cw, ch) / 8)))
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${cw}" height="${ch}" viewBox="0 0 ${cw} ${ch}"><rect fill="#eeeeee" width="100%" height="100%"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#777777" font-family="system-ui,sans-serif" font-size="${fs}">${label}</text></svg>`
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

/**
 * Resolve empty-slot image `src` from project placeholder preference.
 * 按项目设置解析占位图 URL 或 data URI。
 */
export function resolvePlaceholderSrc(
  w: number,
  h: number,
  text: string | undefined,
  source: PlaceholderSource,
): string {
  return source === 'local' ? svgPlaceholderDataUrl(w, h, text) : placeholderUrl(w, h, text)
}

/**
 * Compute default width/height from an aspect ratio string like "16/9".
 * Uses a base width of 1200 (matching the reference max-width).
 */
export function dimensionsFromRatio(
  ratio: string,
  baseWidth = 1200,
): { width: number; height: number } {
  const parts = ratio.split('/')
  const rw = parseInt(parts[0], 10) || 16
  const rh = parseInt(parts[1], 10) || 9
  const height = Math.round(baseWidth * (rh / rw))
  return { width: baseWidth, height }
}
