import type { ComponentDef, ImageSlotValue, TextSlotValue } from '../../types'
import { imgTag, txt } from '../helpers'

/**
 * Three-column grid: section title plus three image + caption cards.
 * 三列网格：区块标题与三列「图 + 说明」卡片。
 */
export const icGrid3col: ComponentDef = {
  id: 'ic-grid-3col',
  name: '3-Column Grid',
  description: 'Three image cards with captions, ideal for features or options',
  icon: 'G3',
  slots: [
    { id: 'title', kind: 'text', label: 'Section Title', tag: 'h2' as const, placeholder: 'Feature highlights' } as const,
    { id: 'desc', kind: 'text', label: 'Section Description', tag: 'p' as const, placeholder: 'Brief overview' } as const,
    { id: 'img1', kind: 'image', label: 'Card 1 Image', required: true, defaultAspectRatio: '3/4', defaultObjectFit: 'cover' } as const,
    { id: 'cap1', kind: 'text', label: 'Card 1 Caption', tag: 'p' as const, placeholder: 'Caption 1' } as const,
    { id: 'img2', kind: 'image', label: 'Card 2 Image', required: true, defaultAspectRatio: '3/4', defaultObjectFit: 'cover' } as const,
    { id: 'cap2', kind: 'text', label: 'Card 2 Caption', tag: 'p' as const, placeholder: 'Caption 2' } as const,
    { id: 'img3', kind: 'image', label: 'Card 3 Image', required: true, defaultAspectRatio: '3/4', defaultObjectFit: 'cover' } as const,
    { id: 'cap3', kind: 'text', label: 'Card 3 Caption', tag: 'p' as const, placeholder: 'Caption 3' } as const,
  ],

  renderHtml(values, ctx) {
    const title = values.title as TextSlotValue | undefined
    const desc = values.desc as TextSlotValue | undefined

    const cards = [1, 2, 3]
      .map((n) => {
        const img = values[`img${n}`] as ImageSlotValue | undefined
        const cap = values[`cap${n}`] as TextSlotValue | undefined
        return `        <div class="ic-opt-item">
          ${imgTag(img, { className: 'ic-ar-34', fallbackW: 380, fallbackH: 507, fallbackText: `Card ${n}`, sectionIndex: ctx.sectionIndex, placeholderSource: ctx.placeholderSource,
            includeSrcsetInExport: ctx.includeSrcsetInExport,
          })}
          <p>${txt(cap, `Card ${n} caption`)}</p>
        </div>`
      })
      .join('\n')

    return `    <section>
      <h2 class="ic-title ic-center">${txt(title, 'Section Title')}</h2>
      <p class="ic-desc ic-center">${txt(desc, 'Description')}</p>
      <div class="ic-opt-grid">
${cards}
      </div>
    </section>`
  },

  css: `
.{{ROOT}} .ic-opt-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 28px;
  margin-top: 16px;
}
.{{ROOT}} .ic-opt-item p {
  font-size: 14px;
  margin-top: 16px;
  font-weight: 600;
  color: var(--ic-dark);
}
@media (max-width: 768px) {
  .{{ROOT}} .ic-opt-grid { grid-template-columns: 1fr; gap: 40px; }
  .{{ROOT}} .ic-opt-item { max-width: 360px; margin: 0 auto; }
}`,
}
