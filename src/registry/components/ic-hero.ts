import type { ComponentDef, ImageSlotValue, TextSlotValue } from '../../types'
import { imgTag, txt, esc } from '../helpers'

/**
 * Hero section: full-bleed image with optional watermark text overlay.
 * 主视觉横幅：大图 + 标题/副文案与可选角标。
 */
export const icHero: ComponentDef = {
  id: 'ic-hero',
  name: 'Hero Banner',
  description: 'Full-width hero image with title, subtitle, and optional watermark overlay',
  icon: 'HR',
  slots: [
    { id: 'title', kind: 'text', label: 'Title', tag: 'h2' as const, placeholder: 'Ergonomic monitor arm' } as const,
    { id: 'subtitle', kind: 'text', label: 'Subtitle', tag: 'p' as const, placeholder: 'Freedom to move. Freedom to work.' } as const,
    { id: 'image', kind: 'image', label: 'Hero Image', required: true, defaultAspectRatio: '21/9', defaultObjectFit: 'cover' } as const,
    { id: 'watermark', kind: 'text', label: 'Watermark Text (optional)', tag: 'span' as const, placeholder: '' } as const,
  ],

  renderHtml(values, ctx) {
    const title = values.title as TextSlotValue | undefined
    const subtitle = values.subtitle as TextSlotValue | undefined
    const image = values.image as ImageSlotValue | undefined
    const watermark = values.watermark as TextSlotValue | undefined
    const wmText = watermark?.content?.trim()

    const wmHtml = wmText
      ? `\n          <div class="ic-watermark" aria-hidden="true">${esc(wmText)}</div>`
      : ''

    const wrapClass = wmText ? ' ic-watermark-wrap' : ''

    return `    <section>
      <h2 class="ic-title">${txt(title, 'Section Title')}</h2>
      <p class="ic-subtitle">${txt(subtitle, 'Subtitle text')}</p>
      <div class="${wrapClass.trim()}">${wmHtml}
        ${imgTag(image, { className: 'ic-ar-219', fallbackW: 1200, fallbackH: 514, fallbackText: 'Hero', sectionIndex: ctx.sectionIndex, placeholderSource: ctx.placeholderSource,
        includeSrcsetInExport: ctx.includeSrcsetInExport,
      })}
      </div>
    </section>`
  },

  css: `
.{{ROOT}} .ic-watermark-wrap { position: relative; }
.{{ROOT}} .ic-watermark {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 180px;
  font-weight: 900;
  color: #f0f0f2;
  z-index: 0;
  white-space: nowrap;
  pointer-events: none;
  user-select: none;
}
.{{ROOT}} .ic-watermark-wrap img { position: relative; z-index: 1; }
@media (max-width: 768px) {
  .{{ROOT}} .ic-watermark { font-size: 52px; }
}`,
}
