import { nanoid } from 'nanoid'
import type {
  AnySlotValue,
  BadgeSlotValue,
  IconGroupItem,
  IconGroupSlotValue,
  ImageSlotValue,
  LegendDot,
  LegendSlotValue,
  OptionCardItem,
  OptionCardsSlotValue,
  SectionInstance,
  TextSlotValue,
} from '../types'
import type { VisionSectionPayload } from '../types/ai'
import { getComponent } from '../registry'
import { createDefaultSlotValues } from './sectionDefaults'
import { dimensionsFromRatio } from './placeholder'

/**
 * Normalise arbitrary model output to string.
 * 将模型输出的文本归一为 string。
 */
function asString(v: unknown): string {
  if (typeof v === 'string') return v
  if (v && typeof v === 'object' && 'content' in v) {
    const c = (v as { content?: unknown }).content
    if (typeof c === 'string') return c
  }
  return ''
}

/**
 * Parse image partial from model (alt + optional dimensions).
 * 解析图像槽部分字段。
 */
function asImagePatch(v: unknown): Partial<ImageSlotValue> | null {
  if (!v || typeof v !== 'object') return null
  const o = v as Record<string, unknown>
  const alt = typeof o.alt === 'string' ? o.alt : ''
  const width = typeof o.width === 'number' && o.width > 0 ? Math.round(o.width) : undefined
  const height = typeof o.height === 'number' && o.height > 0 ? Math.round(o.height) : undefined
  return { alt, width, height }
}

/**
 * Merge vision `values` into defaults using slot definitions.
 * 按槽位定义把 vision 返回值合并进默认值。
 */
function mergeSlotValues(
  componentId: string,
  partial: Record<string, unknown> | undefined,
): Record<string, AnySlotValue> {
  const comp = getComponent(componentId)
  const base = createDefaultSlotValues(componentId)
  if (!comp || !partial) return base

  for (const slot of comp.slots) {
    const raw = partial[slot.id]
    if (raw === undefined) continue

    switch (slot.kind) {
      case 'text': {
        const content = asString(raw)
        base[slot.id] = { content } as TextSlotValue
        break
      }
      case 'image': {
        const patch =
          typeof raw === 'string'
            ? { alt: raw, width: undefined as number | undefined, height: undefined as number | undefined }
            : asImagePatch(raw)
        const cur = base[slot.id] as ImageSlotValue
        if (patch) {
          let w = patch.width ?? cur.width
          let h = patch.height ?? cur.height
          if ((!w || !h) && slot.defaultAspectRatio) {
            const dim = dimensionsFromRatio(slot.defaultAspectRatio)
            w = w || dim.width
            h = h || dim.height
          }
          w = w || 1200
          h = h || 800
          base[slot.id] = {
            src: '',
            alt: patch.alt ?? cur.alt,
            width: w,
            height: h,
          }
        }
        break
      }
      case 'iconGroup': {
        if (!raw || typeof raw !== 'object' || !('items' in raw)) break
        const itemsRaw = (raw as { items?: unknown }).items
        if (!Array.isArray(itemsRaw)) break
        const items: IconGroupItem[] = itemsRaw.slice(0, slot.maxItems).map((it) => {
          if (!it || typeof it !== 'object') {
            return { iconSrc: '', iconAlt: '', label: '' }
          }
          const o = it as Record<string, unknown>
          return {
            iconSrc: typeof o.iconSrc === 'string' ? o.iconSrc : '',
            iconAlt: typeof o.iconAlt === 'string' ? o.iconAlt : '',
            label: typeof o.label === 'string' ? o.label : '',
          }
        })
        base[slot.id] = { items } as IconGroupSlotValue
        break
      }
      case 'badge': {
        if (!raw || typeof raw !== 'object') break
        const o = raw as Record<string, unknown>
        base[slot.id] = {
          iconSrc: typeof o.iconSrc === 'string' ? o.iconSrc : undefined,
          number: typeof o.number === 'string' ? o.number : String(o.number ?? ''),
          label: typeof o.label === 'string' ? o.label : '',
        } as BadgeSlotValue
        break
      }
      case 'legend': {
        if (!raw || typeof raw !== 'object') break
        const o = raw as Record<string, unknown>
        const dotsRaw = o.dots
        const dots: LegendDot[] = Array.isArray(dotsRaw)
          ? dotsRaw.slice(0, 12).map((d) => {
              if (!d || typeof d !== 'object') return { color: '#999', label: '' }
              const x = d as Record<string, unknown>
              return {
                color: typeof x.color === 'string' ? x.color : '#999999',
                label: typeof x.label === 'string' ? x.label : '',
              }
            })
          : []
        base[slot.id] = {
          label: typeof o.label === 'string' ? o.label : '',
          dots,
        } as LegendSlotValue
        break
      }
      case 'optionCards': {
        if (!raw || typeof raw !== 'object' || !('items' in raw)) break
        const itemsRaw = (raw as { items?: unknown }).items
        if (!Array.isArray(itemsRaw)) break
        const max = slot.maxItems
        const items: OptionCardItem[] = itemsRaw.slice(0, max).map((it) => {
          if (!it || typeof it !== 'object') {
            return {
              badge: '',
              image: { src: '', alt: '', width: 480, height: 360 },
              title: '',
              subtitle: '',
            }
          }
          const o = it as Record<string, unknown>
          const imgPatch = asImagePatch(o.image)
          const img: ImageSlotValue = {
            src: '',
            alt: imgPatch?.alt ?? '',
            width: imgPatch?.width ?? 480,
            height: imgPatch?.height ?? 360,
          }
          return {
            badge: typeof o.badge === 'string' ? o.badge : '',
            image: img,
            title: typeof o.title === 'string' ? o.title : '',
            subtitle: typeof o.subtitle === 'string' ? o.subtitle : '',
          }
        })
        const minItems = Math.max(1, slot.minItems ?? 1)
        while (items.length < minItems) {
          items.push({
            badge: '',
            image: { src: '', alt: '', width: 480, height: 360 },
            title: '',
            subtitle: '',
          })
        }
        base[slot.id] = { items } as OptionCardsSlotValue
        break
      }
      default:
        break
    }
  }

  return base
}

/**
 * Convert validated vision payloads into editor section instances.
 * 将 vision JSON 转为编辑器可用的 SectionInstance 列表。
 */
export function visionPayloadsToSections(payloads: VisionSectionPayload[]): SectionInstance[] {
  return payloads.map((p) => ({
    uid: nanoid(8),
    componentId: p.componentId,
    values: mergeSlotValues(p.componentId, p.values),
  }))
}

/** Return only payloads whose componentId exists in registry. */
export function filterKnownComponentPayloads(payloads: VisionSectionPayload[]): VisionSectionPayload[] {
  return payloads.filter((p) => Boolean(getComponent(p.componentId)))
}
