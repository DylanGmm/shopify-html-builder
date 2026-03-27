import type { OptionCardsSlotValue, SectionInstance } from '../types'
import type { UiLocale } from '../types/locale'
import {
  localizedComponentName,
  resolveSlotLabel,
} from '../locales/componentZh'
import { getComponent } from '../registry'

/**
 * Describes an image slot that can receive a sliced data URL.
 * 可被切片工具写入的图片槽位描述。
 */
export interface ImageApplyTarget {
  /** Stable key for React / `<select>` */
  key: string
  /** Human-readable path in the sequence */
  label: string
  sectionUid: string
  /** Registry slot id (e.g. `image`, `cards`) */
  slotId: string
  /** When set, patch `optionCards` item image at this index */
  optionCardIndex?: number
}

/**
 * List every image slot in the current sequence (including option card images).
 * 枚举序列中所有图片槽（含选项卡内图片）。
 */
export function listImageApplyTargets(
  sections: SectionInstance[],
  locale: UiLocale,
): ImageApplyTarget[] {
  const out: ImageApplyTarget[] = []
  sections.forEach((sec, si) => {
    const comp = getComponent(sec.componentId)
    if (!comp) return
    const compTitle = localizedComponentName(locale, comp.id, comp.name)
    const prefix = `§${si + 1} ${compTitle}`
    for (const slot of comp.slots) {
      if (slot.kind === 'image') {
        const slotTitle = resolveSlotLabel(locale, comp.id, slot.id, slot.label)
        out.push({
          key: `${sec.uid}::${slot.id}`,
          label: `${prefix} — ${slotTitle}`,
          sectionUid: sec.uid,
          slotId: slot.id,
        })
      }
      if (slot.kind === 'optionCards') {
        const pack = sec.values[slot.id] as OptionCardsSlotValue | undefined
        const n = pack?.items?.length ?? 0
        const slotTitle = resolveSlotLabel(locale, comp.id, slot.id, slot.label)
        for (let i = 0; i < n; i++) {
          out.push({
            key: `${sec.uid}::${slot.id}::${i}`,
            label: `${prefix} — ${slotTitle} #${i + 1}`,
            sectionUid: sec.uid,
            slotId: slot.id,
            optionCardIndex: i,
          })
        }
      }
    }
  })
  return out
}
