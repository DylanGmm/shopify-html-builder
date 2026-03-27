import type { ComponentDef, ImageSlotValue, OptionCardsSlotValue, TextSlotValue } from '../../types'
import { imgTag, txt, esc } from '../helpers'

/**
 * Side-by-side option cards: badge, image, title, and subtitle (`ic-mount-wrap`).
 * 横向选项卡片行：角标、图、标题与副标题（`ic-mount-wrap`）。
 */
export const icOptionsRow: ComponentDef = {
  id: 'ic-options-row',
  name: 'Options Row',
  description: 'Horizontal row of option cards (e.g. installation methods)',
  icon: 'OR',
  slots: [
    {
      id: 'title',
      kind: 'text',
      label: 'Section Title',
      tag: 'h2' as const,
      placeholder: 'Mounting installation method',
    } as const,
    {
      id: 'cards',
      kind: 'optionCards',
      label: 'Option Cards',
      maxItems: 6,
      minItems: 1,
    } as const,
  ],

  renderHtml(values, ctx) {
    const title = values.title as TextSlotValue | undefined
    const pack = values.cards as OptionCardsSlotValue | undefined
    const items = pack?.items ?? []

    const cols = items
      .map((card, i) => {
        const img = card.image as ImageSlotValue | undefined
        return `        <div class="ic-mount-col">
          <span class="ic-opt-badge">${esc(card.badge || `Option ${i + 1}`)}</span>
          ${imgTag(img, { className: 'ic-ar-43 ic-contain', fallbackW: 480, fallbackH: 360, fallbackText: `Opt ${i + 1}`, sectionIndex: ctx.sectionIndex, placeholderSource: ctx.placeholderSource,
            includeSrcsetInExport: ctx.includeSrcsetInExport,
          })}
          <h3 class="ic-mount-title">${esc(card.title || 'Title')}</h3>
          <p class="ic-mount-size">${esc(card.subtitle || '')}</p>
        </div>`
      })
      .join('\n')

    return `    <section>
      <h2 class="ic-title ic-center">${txt(title, 'Options')}</h2>
      <div class="ic-mount-wrap">
${cols}
      </div>
    </section>`
  },

  css: `
.{{ROOT}} .ic-mount-wrap {
  display: flex;
  justify-content: center;
  gap: 80px;
  margin-top: 44px;
  flex-wrap: wrap;
}
.{{ROOT}} .ic-mount-col { text-align: center; width: 40%; min-width: 260px; }
.{{ROOT}} .ic-opt-badge {
  background-color: var(--ic-green);
  color: #fff;
  padding: 7px 28px;
  border-radius: 40px;
  font-size: 17px;
  font-weight: 700;
  display: inline-block;
  margin-bottom: 22px;
}
.{{ROOT}} .ic-mount-title {
  font-size: 20px;
  font-weight: 700;
  margin-top: 22px;
  margin-bottom: 6px;
}
.{{ROOT}} .ic-mount-size { font-size: 15px; color: var(--ic-gray); }
@media (max-width: 768px) {
  .{{ROOT}} .ic-mount-wrap { flex-direction: column; gap: 44px; align-items: center; }
  .{{ROOT}} .ic-mount-col { width: 100%; }
}`,
}
