import type { ComponentDef, ImageSlotValue, TextSlotValue, IconGroupSlotValue } from '../../types'
import { imgTag, txt, esc } from '../helpers'
import { resolvePlaceholderSrc } from '../../utils/placeholder'

/**
 * Header section: left product image + right title/model/spec-icon-group.
 * 页头区块：左侧商品图 + 右侧型号、标题与规格图标组。
 */
export const icHeader: ComponentDef = {
  id: 'ic-header',
  name: 'Header',
  description: 'Split layout: product image left, model name and spec icons right',
  icon: 'HH',
  slots: [
    { id: 'image', kind: 'image', label: 'Product Image', required: true, defaultAspectRatio: '1/1', defaultObjectFit: 'cover', isHero: true } as const,
    { id: 'model', kind: 'text', label: 'Model / Brand', tag: 'h2' as const, placeholder: 'INNOCN' } as const,
    { id: 'productTitle', kind: 'text', label: 'Product Title', tag: 'p' as const, placeholder: 'Adjustable Dual Monitor Arm' } as const,
    { id: 'specs', kind: 'iconGroup', label: 'Spec Icons', maxItems: 8 } as const,
  ],

  renderHtml(values, ctx) {
    const image = values.image as ImageSlotValue | undefined
    const model = values.model as TextSlotValue | undefined
    const title = values.productTitle as TextSlotValue | undefined
    const specs = values.specs as IconGroupSlotValue | undefined

    const specItems = (specs?.items || [])
      .map(
        (item) => `
          <div class="ic-spec">
            <img src="${esc(item.iconSrc) || resolvePlaceholderSrc(42, 42, 'icon', ctx.placeholderSource)}" class="ic-icon" alt="${esc(item.iconAlt)}" aria-hidden="true" width="42" height="42" decoding="async">
            <span>${esc(item.label)}</span>
          </div>`,
      )
      .join('')

    return `    <section class="ic-header">
      <div class="ic-header-left">
        ${imgTag(image, { className: 'ic-ar-11', fallbackW: 600, fallbackH: 600, fallbackText: 'Product', isHero: true, sectionIndex: ctx.sectionIndex, placeholderSource: ctx.placeholderSource,
        includeSrcsetInExport: ctx.includeSrcsetInExport,
      })}
      </div>
      <div class="ic-header-right">
        <h2 class="ic-model">${txt(model, 'Brand')}</h2>
        <p class="ic-product-title">${txt(title, 'Product Name')}</p>
        <div class="ic-specs">${specItems}</div>
      </div>
    </section>`
  },

  css: `
.{{ROOT}} .ic-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 60px;
  margin-bottom: 70px;
}
.{{ROOT}} .ic-header-left  { width: 50%; }
.{{ROOT}} .ic-header-right {
  width: 50%;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  text-align: right;
}
.{{ROOT}} .ic-model {
  background: var(--ic-grad);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-size: 62px;
  font-weight: 800;
  line-height: 1.1;
  letter-spacing: -0.03em;
  margin-bottom: 8px;
}
.{{ROOT}} .ic-product-title {
  font-size: 22px;
  font-weight: 600;
  color: var(--ic-gray);
  margin-bottom: 36px;
}
.{{ROOT}} .ic-specs {
  display: flex;
  gap: 18px;
  justify-content: flex-end;
  flex-wrap: wrap;
}
.{{ROOT}} .ic-spec {
  text-align: center;
  font-size: 12px;
  font-weight: 600;
  width: 72px;
  color: var(--ic-dark);
}
.{{ROOT}} .ic-spec img {
  width: 42px;
  height: 42px;
  margin: 0 auto 6px;
  object-fit: contain;
  border-radius: 0;
}
@media (max-width: 768px) {
  .{{ROOT}} .ic-header { flex-direction: column; gap: 24px; margin-bottom: 40px; }
  .{{ROOT}} .ic-header-left,
  .{{ROOT}} .ic-header-right { width: 100%; text-align: center; align-items: center; }
  .{{ROOT}} .ic-specs { justify-content: center; gap: 12px; }
  .{{ROOT}} .ic-spec { width: 56px; font-size: 10px; }
  .{{ROOT}} .ic-model { font-size: 38px; }
  .{{ROOT}} .ic-product-title { font-size: 17px; margin-bottom: 22px; }
}`,
}
