import { nanoid } from 'nanoid'
import type { AnySlotValue, SectionInstance } from '../types'

/**
 * Deep-clone section instances with fresh UIDs (cross-SKU template copy).
 * 深拷贝区块并分配新 uid，用于跨 SKU 套用模板序列。
 */
export function cloneSectionsWithNewUids(sections: SectionInstance[]): SectionInstance[] {
  return sections.map((s) => {
    const clone: SectionInstance = {
      uid: nanoid(8),
      componentId: s.componentId,
      values: JSON.parse(JSON.stringify(s.values)) as Record<string, AnySlotValue>,
    }
    if (s.freeform) {
      clone.freeform = JSON.parse(JSON.stringify(s.freeform))
    }
    return clone
  })
}
