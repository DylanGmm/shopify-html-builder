import type { ComponentDef, ImageSlotValue, TextSlotValue } from '../../types'
import { imgTag, txt } from '../helpers'

/**
 * Split layout: image on the left, text on the right.
 * 分栏：左图右文。
 */
export const icSplitRight: ComponentDef = {
  id: 'ic-split-right',
  name: 'Split — Text Right',
  description: 'Left column: image. Right column: title, subtitle, caption',
  icon: 'SR',
  slots: [
    { id: 'image', kind: 'image', label: 'Feature Image', required: true, defaultAspectRatio: '4/3', defaultObjectFit: 'cover' } as const,
    { id: 'title', kind: 'text', label: 'Title', tag: 'h2' as const, placeholder: 'Feature headline' } as const,
    { id: 'subtitle', kind: 'text', label: 'Subtitle', tag: 'h3' as const, placeholder: 'Supporting headline' } as const,
    { id: 'caption', kind: 'text', label: 'Caption', tag: 'p' as const, placeholder: 'Additional details', multiline: true } as const,
  ],

  renderHtml(values, ctx) {
    const image = values.image as ImageSlotValue | undefined
    const title = values.title as TextSlotValue | undefined
    const subtitle = values.subtitle as TextSlotValue | undefined
    const caption = values.caption as TextSlotValue | undefined

    return `    <section class="ic-health">
      <div class="ic-health-img">
        ${imgTag(image, { className: 'ic-ar-43', fallbackW: 900, fallbackH: 675, fallbackText: 'Feature', sectionIndex: ctx.sectionIndex, placeholderSource: ctx.placeholderSource,
        includeSrcsetInExport: ctx.includeSrcsetInExport,
      })}
      </div>
      <div class="ic-health-text">
        <h2 class="ic-title">${txt(title, 'Feature Title')}</h2>
        <h3 class="ic-health-sub">${txt(subtitle, 'Subtitle')}</h3>
        <p class="ic-health-caption">${txt(caption, 'Caption text')}</p>
      </div>
    </section>`
  },

  css: `
.{{ROOT}} .ic-health {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 60px;
}
.{{ROOT}} .ic-health-img { width: 45%; }
.{{ROOT}} .ic-health-text { width: 50%; text-align: right; }
.{{ROOT}} .ic-health-sub {
  font-size: 20px;
  color: var(--ic-dark);
  margin-bottom: 10px;
  font-weight: 700;
}
.{{ROOT}} .ic-health-caption {
  font-size: 15px;
  color: var(--ic-gray);
  margin-bottom: 40px;
}
@media (max-width: 768px) {
  .{{ROOT}} .ic-health { flex-direction: column; gap: 24px; }
  .{{ROOT}} .ic-health-img,
  .{{ROOT}} .ic-health-text { width: 100%; text-align: center; }
}`,
}
