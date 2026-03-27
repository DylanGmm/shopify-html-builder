/**
 * Theme preview stylesheet URL parsing for Project Settings.
 * 工程设置里「主题预览 CSS」URL 的解析与校验。
 */

const MAX_THEME_URLS = 5

/**
 * @param raw — Newline- or comma-separated URLs from user input
 * @returns Normalized unique `https://` URLs (max {@link MAX_THEME_URLS})
 */
export function parseThemeStylesheetUrlsInput(raw: string): string[] {
  const parts = raw
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean)
  const seen = new Set<string>()
  const out: string[] = []
  for (const line of parts) {
    if (out.length >= MAX_THEME_URLS) break
    if (!line.startsWith('https://')) continue
    try {
      const u = new URL(line)
      if (u.protocol !== 'https:') continue
      if (seen.has(u.href)) continue
      seen.add(u.href)
      out.push(u.href)
    } catch {
      /* skip invalid */
    }
  }
  return out
}
