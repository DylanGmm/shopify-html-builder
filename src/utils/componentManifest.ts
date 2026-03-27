import { getAllComponents } from '../registry'
import type { AnySlotDef } from '../types'

/**
 * Summarise slot definitions for LLM prompts.
 * 将各组件槽位摘要为模型可读的说明文本。
 */
function describeSlot(slot: AnySlotDef): string {
  switch (slot.kind) {
    case 'image':
      return `${slot.id}(image)`
    case 'text':
      return `${slot.id}(text, tag=${slot.tag})`
    case 'iconGroup':
      return `${slot.id}(iconGroup, max=${slot.maxItems})`
    case 'badge':
      return `${slot.id}(badge)`
    case 'legend':
      return `${slot.id}(legend)`
    case 'optionCards':
      return `${slot.id}(optionCards, max=${slot.maxItems})`
    default:
      return `${(slot as AnySlotDef).id}`
  }
}

/**
 * Build a compact catalogue string of all components and slot ids for vision prompts.
 * 为视觉模型构建组件 ID + 槽位 ID 目录字符串。
 */
export function buildComponentManifestForPrompt(): string {
  const lines: string[] = []
  for (const c of getAllComponents()) {
    const slots = c.slots.map(describeSlot).join(', ')
    lines.push(`- ${c.id}: ${c.name}. Slots: ${slots}`)
  }
  return lines.join('\n')
}
