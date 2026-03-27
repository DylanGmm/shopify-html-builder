/**
 * Batch ZIP export for multi-SKU full HTML documents.
 * 多 SKU 完整 HTML 批量 ZIP 导出。
 */
import JSZip from 'jszip'
import type { Project } from '../types'
import { err, ok, type Result } from '../types/result'
import { renderStandaloneDocument } from '../utils/renderer'

export type BulkExportError = { message: string }

/**
 * Zip one full `.html` file per non-empty SKU project (export mode — theme links only if each project enables it).
 * 每个非空 SKU 导出一份完整 HTML 打 ZIP（按各项目的导出选项）。
 */
export async function zipAllProjectsHtml(
  projects: Record<string, Project>,
): Promise<Result<Blob, BulkExportError>> {
  try {
    const zip = new JSZip()
    let count = 0
    for (const [id, proj] of Object.entries(projects)) {
      if (proj.sections.length === 0) continue
      const html = renderStandaloneDocument(proj, { mode: 'export' })
      const base = (proj.name || id).replace(/[/\\?%*:|"<>]/g, '-').slice(0, 80) || 'export'
      let name = `${base}.html`
      let n = 1
      while (zip.file(name)) {
        name = `${base}-${n}.html`
        n += 1
      }
      zip.file(name, html)
      count += 1
    }
    if (count === 0) {
      return err({ message: 'No SKU with sections to export.' })
    }
    const blob = await zip.generateAsync({ type: 'blob' })
    return ok(blob)
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Zip generation failed'
    return err({ message })
  }
}
