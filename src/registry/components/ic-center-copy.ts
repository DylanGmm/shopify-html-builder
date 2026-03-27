import type { ComponentDef, ImageSlotValue, LegendSlotValue, TextSlotValue } from '../../types'
import { esc, imgTag, txt } from '../helpers'

/**
 * Centred copy block: title, body, full-width image, and optional legend / swatches.
 * 居中文案区：标题、正文、通栏图，可选图例与色块条。
 */
export const icCenterCopy: ComponentDef = {
  id: 'ic-center-copy',
  name: 'Center Copy + Image',
  description: 'Centred title and body text with a full-width image below',
  icon: 'CC',
  slots: [
    { id: 'title', kind: 'text', label: 'Title', tag: 'h2' as const, placeholder: 'Section headline' } as const,
    { id: 'highlight', kind: 'text', label: 'Highlight Text', tag: 'p' as const, placeholder: 'Key statement in bold' } as const,
    { id: 'body', kind: 'text', label: 'Body Text', tag: 'p' as const, placeholder: 'Detailed paragraph...', multiline: true } as const,
    { id: 'image', kind: 'image', label: 'Section Image', required: true, defaultAspectRatio: '3/1', defaultObjectFit: 'contain' } as const,
    { id: 'legend', kind: 'legend', label: 'Legend (optional)', required: false } as const,
  ],

  renderHtml(values, ctx) {
    const title = values.title as TextSlotValue | undefined
    const highlight = values.highlight as TextSlotValue | undefined
    const body = values.body as TextSlotValue | undefined
    const image = values.image as ImageSlotValue | undefined
    const legend = values.legend as LegendSlotValue | undefined
    const legendLabel = legend?.label?.trim() ?? ''
    const dots = legend?.dots?.filter((d) => d.color?.trim()) ?? []

    const legendHtml =
      legendLabel || dots.length > 0
        ? `      <div class="ic-legend" role="img" aria-label="${esc(legendLabel || 'Legend')}">
        ${legendLabel ? `<span>${esc(legendLabel)}</span>` : ''}
        <div class="ic-dots" aria-hidden="true">
${dots.map((d) => `          <div class="ic-dot" style="background:${esc(d.color)};box-shadow:0 0 0 1px ${esc(d.color)}"></div>`).join('\n')}
        </div>
      </div>`
        : ''

    return `    <section class="ic-spine">
      <h2 class="ic-title">${txt(title, 'Section Title')}</h2>
      <div class="ic-spine-desc">
        <p class="ic-bold">${txt(highlight, 'Key statement')}</p>
        <p>${txt(body, 'Body text')}</p>
      </div>
      ${imgTag(image, { className: 'ic-ar-31 ic-contain', fallbackW: 1200, fallbackH: 400, fallbackText: 'Infographic', sectionIndex: ctx.sectionIndex, placeholderSource: ctx.placeholderSource,
        includeSrcsetInExport: ctx.includeSrcsetInExport,
      })}
${legendHtml ? `${legendHtml}\n` : ''}    </section>`
  },

  css: `
.{{ROOT}} .ic-spine { text-align: center; }
.{{ROOT}} .ic-spine-desc {
  max-width: 860px;
  margin: 0 auto 32px;
}
.{{ROOT}} .ic-spine-desc p {
  font-size: 14px;
  margin-bottom: 12px;
  color: var(--ic-gray);
}
.{{ROOT}} .ic-spine-desc .ic-bold {
  font-weight: 700;
  color: var(--ic-dark);
  font-size: 17px;
}
.{{ROOT}} .ic-legend {
  margin-top: 24px;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  font-size: 14px;
  font-weight: 700;
  color: var(--ic-dark);
}
.{{ROOT}} .ic-dots { display: flex; gap: 6px; }
.{{ROOT}} .ic-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid #fff;
}`,
}
