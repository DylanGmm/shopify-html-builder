import type { Project } from '../types'
import {
  renderProject,
  renderStandaloneDocument,
  type StandaloneDocumentMode,
} from '../utils/renderer'
import { buildShopifySectionLiquidFile } from '../utils/shopifySectionExport'

/**
 * Shopify description fragment (inline `<style>` + scoped root).
 * Shopify 商品描述用 HTML 片段。
 *
 * @param project — Active SKU project / 当前 SKU 工程
 */
export function getShopifyFragmentHtml(project: Project): string {
  if (project.sections.length === 0) return ''
  return renderProject(project)
}

/**
 * Full HTML document for download or clipboard.
 * 完整 HTML 文档（下载或剪贴板）。
 *
 * @param project — Active SKU project / 当前 SKU 工程
 * @param mode — `preview` loads theme CSS from project; `export` respects export-only theme flag / 预览注入主题；导出遵守导出开关
 */
export function getFullPageHtml(project: Project, mode: StandaloneDocumentMode): string {
  return renderStandaloneDocument(project, { mode })
}

/**
 * OS 2.0 section `.liquid` file (fragment inside `{% raw %}`).
 * OS 2.0 分区 `.liquid` 文件。
 *
 * @param project — Active SKU project / 当前 SKU 工程
 */
export function getShopifySectionLiquid(project: Project): string {
  return buildShopifySectionLiquidFile(project)
}
