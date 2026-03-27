import type { Project, SectionInstance } from '../types'
import { ok, err, type Result } from '../types/result'
import { getComponent } from '../registry'
import { FREEFORM_COMPONENT_ID } from '../types/freeform'
import { logger } from '../utils/logger'
import { parseThemeStylesheetUrlsInput } from '../utils/themeUrls'

/**
 * Parse and loosely validate imported project JSON.
 * 解析并校验导入的工程 JSON（宽松校验，便于版本演进）。
 */
export function parseProjectJson(raw: string): Result<Project, string> {
  try {
    const data = JSON.parse(raw) as unknown
    return validateProject(data)
  } catch (e) {
    logger.debug('parseProjectJson failed', e)
    return err('Invalid JSON')
  }
}

function validateProject(input: unknown): Result<Project, string> {
  if (typeof input !== 'object' || input === null) {
    return err('Root must be an object')
  }
  const o = input as Record<string, unknown>
  if (typeof o.name !== 'string') {
    return err('Missing or invalid "name"')
  }
  if (typeof o.sections !== 'object' || !Array.isArray(o.sections)) {
    return err('Missing or invalid "sections" array')
  }
  for (const item of o.sections) {
    if (typeof item !== 'object' || item === null) {
      return err('Invalid section entry')
    }
    const s = item as Record<string, unknown>
    if (typeof s.uid !== 'string' || typeof s.componentId !== 'string') {
      return err('Section missing uid or componentId')
    }
    if (s.componentId !== FREEFORM_COMPONENT_ID && !getComponent(s.componentId)) {
      return err(`Unknown component: ${s.componentId}`)
    }
    if (typeof s.values !== 'object' || s.values === null || Array.isArray(s.values)) {
      return err('Section "values" must be an object')
    }
  }
  let cssVars: Record<string, string> = {}
  if (o.cssVars !== undefined) {
    if (typeof o.cssVars !== 'object' || o.cssVars === null || Array.isArray(o.cssVars)) {
      return err('Invalid "cssVars"')
    }
    cssVars = o.cssVars as Record<string, string>
  }
  let placeholderSource: Project['placeholderSource'] = 'remote'
  if (o.placeholderSource === 'local' || o.placeholderSource === 'remote') {
    placeholderSource = o.placeholderSource
  }

  const includeProductJsonLd = o.includeProductJsonLd === true
  const includeSrcsetInExport = o.includeSrcsetInExport === true
  const includeThemeStylesheetUrlsInExport = o.includeThemeStylesheetUrlsInExport === true

  let previewThemeStylesheetUrls: string[] | undefined
  if (Array.isArray(o.previewThemeStylesheetUrls)) {
    const raw = o.previewThemeStylesheetUrls.filter((x): x is string => typeof x === 'string')
    previewThemeStylesheetUrls = parseThemeStylesheetUrlsInput(raw.join('\n'))
  } else if (typeof o.previewThemeStylesheetUrls === 'string') {
    previewThemeStylesheetUrls = parseThemeStylesheetUrlsInput(o.previewThemeStylesheetUrls)
  }

  const maxContentWidth =
    typeof o.maxContentWidth === 'number' && o.maxContentWidth >= 320 && o.maxContentWidth <= 2400
      ? Math.round(o.maxContentWidth)
      : 1200

  const project: Project = {
    name: o.name,
    rootClass: typeof o.rootClass === 'string' ? o.rootClass : 'ic-page',
    productName: typeof o.productName === 'string' ? o.productName : '',
    sections: o.sections as SectionInstance[],
    cssVars,
    placeholderSource,
    includeProductJsonLd,
    includeSrcsetInExport,
    previewThemeStylesheetUrls,
    includeThemeStylesheetUrlsInExport,
    maxContentWidth,
  }
  return ok(project)
}
