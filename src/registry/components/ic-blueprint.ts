import type { ComponentDef, ImageSlotValue, TextSlotValue } from '../../types'
import { imgTag, txt, txtBr } from '../helpers'

/**
 * Technical drawings: two-up grid plus full-width diagram with overlay label (`ic-bp-*`).
 * 技术示意：双格小图与通栏大图及浮层标题（`ic-bp-*`）。
 */
export const icBlueprint: ComponentDef = {
  id: 'ic-blueprint',
  name: 'Blueprint Grid',
  description: 'Two technical drawings plus a wide diagram with caption overlay',
  icon: 'BP',
  slots: [
    {
      id: 'title',
      kind: 'text',
      label: 'Section Title (optional)',
      tag: 'h2' as const,
      placeholder: 'Technical blueprints',
    } as const,
    {
      id: 'imgA',
      kind: 'image',
      label: 'Drawing A',
      required: true,
      defaultAspectRatio: '4/3',
      defaultObjectFit: 'contain',
    } as const,
    {
      id: 'imgB',
      kind: 'image',
      label: 'Drawing B',
      required: true,
      defaultAspectRatio: '4/3',
      defaultObjectFit: 'contain',
    } as const,
    {
      id: 'imgWide',
      kind: 'image',
      label: 'Wide Diagram',
      required: true,
      defaultAspectRatio: '21/9',
      defaultObjectFit: 'contain',
    } as const,
    {
      id: 'overlay',
      kind: 'text',
      label: 'Overlay Label',
      tag: 'p' as const,
      placeholder: 'Line 1\nLine 2',
      multiline: true,
    } as const,
  ],

  renderHtml(values, ctx) {
    const title = values.title as TextSlotValue | undefined
    const a = values.imgA as ImageSlotValue | undefined
    const b = values.imgB as ImageSlotValue | undefined
    const wide = values.imgWide as ImageSlotValue | undefined
    const overlay = values.overlay as TextSlotValue | undefined

    const titleLine = title?.content?.trim()
      ? `      <h2 class="ic-title">${txt(title, '')}</h2>\n`
      : ''

    return `    <section>
${titleLine}      <div class="ic-bp-grid">
        ${imgTag(a, { className: 'ic-ar-43 ic-contain', fallbackW: 560, fallbackH: 420, fallbackText: 'A', sectionIndex: ctx.sectionIndex, placeholderSource: ctx.placeholderSource,
          includeSrcsetInExport: ctx.includeSrcsetInExport,
        })}
        ${imgTag(b, { className: 'ic-ar-43 ic-contain', fallbackW: 560, fallbackH: 420, fallbackText: 'B', sectionIndex: ctx.sectionIndex, placeholderSource: ctx.placeholderSource,
          includeSrcsetInExport: ctx.includeSrcsetInExport,
        })}
      </div>
      <div class="ic-bp-full">
        ${imgTag(wide, { className: 'ic-ar-219 ic-contain', fallbackW: 1200, fallbackH: 514, fallbackText: 'Wide', sectionIndex: ctx.sectionIndex, placeholderSource: ctx.placeholderSource,
          includeSrcsetInExport: ctx.includeSrcsetInExport,
        })}
        <div class="ic-bp-label">
          ${txtBr(overlay, 'Technical notes')}
        </div>
      </div>
    </section>`
  },

  css: `
.{{ROOT}} .ic-bp-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;
  margin-bottom: 32px;
}
.{{ROOT}} .ic-bp-full {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  background: #f8f8fa;
  padding: 20px;
}
.{{ROOT}} .ic-bp-label {
  position: absolute;
  bottom: 32px;
  left: 32px;
  font-size: 18px;
  font-weight: 700;
  line-height: 1.5;
  background: rgba(255,255,255,0.85);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  padding: 16px 20px;
  border-radius: 10px;
  color: var(--ic-dark);
}
@media (max-width: 768px) {
  .{{ROOT}} .ic-bp-grid { grid-template-columns: 1fr; }
  .{{ROOT}} .ic-bp-label {
    position: static;
    text-align: center;
    margin-top: 16px;
    background: none;
    font-size: 15px;
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
  }
}`,
}
