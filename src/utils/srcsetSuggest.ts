/**
 * Default `sizes` for full-width images inside `.ic-wrap` (max 1200px content).
 * 与 `.ic-wrap` 最大宽度一致的全宽图默认 `sizes`。
 */
export const DEFAULT_EXPORT_IMAGE_SIZES = '(max-width: 768px) 100vw, min(100vw, 1200px)'

/**
 * Derive a safe basename for placeholder `srcset` filenames from an image URL.
 * Returns `null` when `srcset` should be omitted (`data:` or empty).
 *
 * 从图片 URL 推导用于占位 `srcset` 文件名的 basename；`data:` 或空则返回 `null`。
 */
export function deriveSrcsetBasenameFromSrc(src: string): string | null {
  const t = src.trim()
  if (!t || t.startsWith('data:')) {
    return null
  }
  if (t.includes('placehold.co')) {
    return 'image'
  }
  try {
    const u = new URL(t, 'https://placeholder.invalid/')
    const seg = u.pathname.split('/').filter(Boolean).pop() ?? ''
    const withoutExt = seg.replace(/\.[a-z0-9]+$/i, '')
    const safe = withoutExt.replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/^-+|-+$/g, '')
    return safe.length > 0 ? safe.slice(0, 80) : 'image'
  } catch {
    return 'image'
  }
}

/**
 * Build export `srcset` string (1× and 2× width descriptors, `.webp` placeholder names).
 *
 * @param width — Logical 1× width in CSS pixels.
 * @param baseNameForDocs — Basename for filenames (default `image`).
 * @returns Comma-separated `srcset` or empty if `width` is invalid.
 */
export function buildExportSrcsetString(width: number, baseNameForDocs = 'image'): string {
  const w1 = Math.round(Number(width))
  if (!Number.isFinite(w1) || w1 <= 0) {
    return ''
  }
  const w2 = w1 * 2
  const base = baseNameForDocs.trim() || 'image'
  return `${base}-${w1}w.webp ${w1}w, ${base}-${w2}w.webp ${w2}w`
}

/**
 * Build a placeholder `srcset` suggestion from a logical display width.
 *
 * Returns two candidates: the given width and its 2× variant, using a
 * `{basename}-{N}w.webp` filename pattern. **URLs are illustrative only** —
 * replace with your CDN or asset pipeline naming (Shopify CDN, Imgix, etc.).
 *
 * @param width — Logical 1× width in CSS pixels (must be finite and greater than 0).
 * @param baseNameForDocs — Basename for placeholder filenames (default `image`).
 * @returns Comma-separated `srcset` entries, or empty string if `width` is invalid.
 */
export function suggestSrcsetFromWidth(width: number, baseNameForDocs = 'image'): string {
  return buildExportSrcsetString(width, baseNameForDocs)
}
