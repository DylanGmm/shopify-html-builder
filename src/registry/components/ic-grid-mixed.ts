import type { ComponentDef, ImageSlotValue, TextSlotValue } from '../../types'
import { imgTag, txt } from '../helpers'

/**
 * Mixed grid: full-width top image plus bottom row tiles (`ic-sit-grid` family).
 * 混排网格：顶部通栏图与底部图块（`ic-sit-grid` 布局族）。
 */
export const icGridMixed: ComponentDef = {
  id: 'ic-grid-mixed',
  name: 'Mixed Image Grid',
  description: 'One hero image spanning full width plus two tiles below',
  icon: 'GM',
  slots: [
    {
      id: 'title',
      kind: 'text',
      label: 'Section Title',
      tag: 'h2' as const,
      placeholder: 'Section headline',
    } as const,
    {
      id: 'subtitle',
      kind: 'text',
      label: 'Subtitle',
      tag: 'p' as const,
      placeholder: 'Supporting line',
    } as const,
    {
      id: 'imgTop',
      kind: 'image',
      label: 'Top Full-Width Image',
      required: true,
      defaultAspectRatio: '21/9',
      defaultObjectFit: 'cover',
    } as const,
    {
      id: 'imgLeft',
      kind: 'image',
      label: 'Bottom Left Image',
      required: true,
      defaultAspectRatio: '16/9',
      defaultObjectFit: 'cover',
    } as const,
    {
      id: 'imgRight',
      kind: 'image',
      label: 'Bottom Right Image',
      required: true,
      defaultAspectRatio: '16/9',
      defaultObjectFit: 'cover',
    } as const,
  ],

  renderHtml(values, ctx) {
    const title = values.title as TextSlotValue | undefined
    const subtitle = values.subtitle as TextSlotValue | undefined
    const top = values.imgTop as ImageSlotValue | undefined
    const left = values.imgLeft as ImageSlotValue | undefined
    const right = values.imgRight as ImageSlotValue | undefined

    return `    <section class="ic-center">
      <h2 class="ic-title">${txt(title, 'Section Title')}</h2>
      <p class="ic-subtitle">${txt(subtitle, 'Subtitle')}</p>
      <div class="ic-sit-grid">
        ${imgTag(top, { className: 'ic-sit-top ic-ar-219', fallbackW: 1200, fallbackH: 514, fallbackText: 'Scene', sectionIndex: ctx.sectionIndex, placeholderSource: ctx.placeholderSource,
          includeSrcsetInExport: ctx.includeSrcsetInExport,
        })}
        ${imgTag(left, { className: 'ic-ar-169', fallbackW: 590, fallbackH: 332, fallbackText: 'Left', sectionIndex: ctx.sectionIndex, placeholderSource: ctx.placeholderSource,
          includeSrcsetInExport: ctx.includeSrcsetInExport,
        })}
        ${imgTag(right, { className: 'ic-ar-169', fallbackW: 590, fallbackH: 332, fallbackText: 'Right', sectionIndex: ctx.sectionIndex, placeholderSource: ctx.placeholderSource,
          includeSrcsetInExport: ctx.includeSrcsetInExport,
        })}
      </div>
    </section>`
  },

  css: `
.{{ROOT}} .ic-sit-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-top: 16px;
}
.{{ROOT}} .ic-sit-top { grid-column: 1 / -1; }
@media (max-width: 768px) {
  .{{ROOT}} .ic-sit-grid { grid-template-columns: 1fr; }
}`,
}
