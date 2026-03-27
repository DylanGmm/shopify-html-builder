import type { ComponentDef, ImageSlotValue, TextSlotValue, BadgeSlotValue } from '../../types'
import { imgTag, txt, esc } from '../helpers'

/**
 * Split layout: text content on the left, image on the right.
 * Supports optional badge and footnote.
 * 分栏：左文右图，可选角标与脚注。
 */
export const icSplitLeft: ComponentDef = {
  id: 'ic-split-left',
  name: 'Split — Text Left',
  description: 'Left column: title, bullet, description, badge. Right column: image',
  icon: 'SL',
  slots: [
    { id: 'title', kind: 'text', label: 'Title', tag: 'h2' as const, placeholder: 'Feature headline' } as const,
    { id: 'bullet', kind: 'text', label: 'Bullet Point', tag: 'p' as const, placeholder: '• Key selling point' } as const,
    { id: 'body', kind: 'text', label: 'Body Text', tag: 'p' as const, placeholder: 'Detailed description...', multiline: true } as const,
    { id: 'badge', kind: 'badge', label: 'Badge (optional)' } as const,
    { id: 'image', kind: 'image', label: 'Feature Image', required: true, defaultAspectRatio: '1/1', defaultObjectFit: 'contain' } as const,
    { id: 'footnote', kind: 'text', label: 'Footnote (optional)', tag: 'p' as const, placeholder: '' } as const,
  ],

  renderHtml(values, ctx) {
    const title = values.title as TextSlotValue | undefined
    const bullet = values.bullet as TextSlotValue | undefined
    const body = values.body as TextSlotValue | undefined
    const badge = values.badge as BadgeSlotValue | undefined
    const image = values.image as ImageSlotValue | undefined
    const footnote = values.footnote as TextSlotValue | undefined

    let badgeHtml = ''
    if (badge?.number) {
      const badgeIcon = badge.iconSrc
        ? `<img src="${esc(badge.iconSrc)}" class="ic-icon" style="width:26px;height:26px;" alt="" aria-hidden="true" width="26" height="26" decoding="async">\n              `
        : ''
      badgeHtml = `
          <div class="ic-badge">
            ${badgeIcon}<div>
              <div class="ic-badge-num">${esc(badge.number)}</div>
              <div class="ic-badge-label">${esc(badge.label)}</div>
            </div>
          </div>`
    }

    const footnoteHtml = footnote?.content?.trim()
      ? `\n          <p class="ic-footnote">${txt(footnote)}</p>`
      : ''

    return `    <section class="ic-gas">
      <div class="ic-gas-content">
        <h2 class="ic-title">${txt(title, 'Feature Title')}</h2>
        <p class="ic-bullet">${txt(bullet, '• Highlight')}</p>
        <p class="ic-gas-desc">${txt(body, 'Description text')}</p>${badgeHtml}
      </div>
      <div class="ic-gas-img">
        ${imgTag(image, { className: 'ic-ar-11 ic-contain', fallbackW: 600, fallbackH: 600, fallbackText: 'Feature', sectionIndex: ctx.sectionIndex, placeholderSource: ctx.placeholderSource,
        includeSrcsetInExport: ctx.includeSrcsetInExport,
      })}${footnoteHtml}
      </div>
    </section>`
  },

  css: `
.{{ROOT}} .ic-gas {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 60px;
}
.{{ROOT}} .ic-gas-content { width: 45%; }
.{{ROOT}} .ic-gas-content .ic-title { font-size: 34px; }
.{{ROOT}} .ic-bullet {
  color: var(--ic-blue);
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 16px;
}
.{{ROOT}} .ic-gas-desc {
  font-size: 14px;
  color: var(--ic-gray);
  line-height: 1.7;
  margin-bottom: 32px;
}
.{{ROOT}} .ic-badge {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  border: 1.5px solid var(--ic-green);
  padding: 10px 20px;
  border-radius: 12px;
  margin-bottom: 24px;
}
.{{ROOT}} .ic-badge-num {
  color: var(--ic-green);
  font-weight: 800;
  font-size: 20px;
  line-height: 1.2;
}
.{{ROOT}} .ic-badge-label {
  color: var(--ic-green);
  font-size: 12px;
  font-weight: 700;
}
.{{ROOT}} .ic-gas-img { width: 50%; }
.{{ROOT}} .ic-footnote {
  font-size: 11px;
  color: #aaa;
  text-align: right;
  margin-top: 10px;
}
@media (max-width: 768px) {
  .{{ROOT}} .ic-gas { flex-direction: column-reverse; gap: 24px; }
  .{{ROOT}} .ic-gas-content,
  .{{ROOT}} .ic-gas-img { width: 100%; text-align: center; }
  .{{ROOT}} .ic-badge { margin: 0 auto 20px; }
}`,
}
