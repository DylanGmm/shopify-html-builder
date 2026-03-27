import type { Project } from '../types'

/**
 * Build a minimal schema.org Product JSON-LD string for `<script type="application/ld+json">`.
 * 生成精简的 Product JSON-LD 字符串（用于独立页 SEO 提示）。
 */
export function buildProductJsonLdString(project: Project): string {
  const name = (project.productName || project.name || 'Product').trim() || 'Product'
  const payload = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
  }
  return JSON.stringify(payload).replace(/</g, '\\u003c')
}
