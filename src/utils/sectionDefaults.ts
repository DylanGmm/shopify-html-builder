import type { AnySlotValue, OptionCardItem } from '../types'
import { getComponent } from '../registry'

/**
 * 单个空选项卡 / Empty option card row.
 */
function emptyOptionCard(): OptionCardItem {
  return {
    badge: '',
    image: { src: '', alt: '', width: 0, height: 0 },
    title: '',
    subtitle: '',
  }
}

/**
 * 按组件 ID 生成默认槽位值（与编辑器新建节一致）。
 * Build default slot values for a component (same as adding a new section).
 */
export function createDefaultSlotValues(componentId: string): Record<string, AnySlotValue> {
  const comp = getComponent(componentId)
  if (!comp) return {}

  const values: Record<string, AnySlotValue> = {}
  for (const slot of comp.slots) {
    switch (slot.kind) {
      case 'image':
        values[slot.id] = { src: '', alt: '', width: 0, height: 0 }
        break
      case 'text':
        values[slot.id] = { content: '' }
        break
      case 'iconGroup':
        values[slot.id] = { items: [] }
        break
      case 'badge':
        values[slot.id] = { number: '', label: '' }
        break
      case 'legend':
        values[slot.id] = { label: '', dots: [] }
        break
      case 'optionCards': {
        const min = Math.max(1, slot.minItems ?? 2)
        const count = Math.min(slot.maxItems, min)
        values[slot.id] = {
          items: Array.from({ length: count }, () => emptyOptionCard()),
        }
        break
      }
    }
  }
  return values
}
