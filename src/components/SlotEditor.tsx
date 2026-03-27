import { useState } from 'react'
import { localizedComponentName, resolveSlotLabel } from '../locales/componentZh'
import { getComponent } from '../registry'
import { useEditorStore } from '../store/editorStore'
import { useUiStrings } from '../hooks/useUiStrings'
import { logger } from '../utils/logger'
import { suggestSrcsetFromWidth } from '../utils/srcsetSuggest'
import { FREEFORM_COMPONENT_ID } from '../types/freeform'
import { FreeformSlotEditor } from './FreeformSlotEditor'
import { ComponentTypeBadge } from './ComponentTypeBadge'
import { IconDocumentStack, IconX } from './EditorialIcons'
import type {
  AnySlotDef,
  ImageSlotValue,
  TextSlotValue,
  BadgeSlotValue,
  IconGroupSlotValue,
  IconGroupItem,
  LegendSlotValue,
  LegendDot,
  OptionCardsSlotValue,
  OptionCardItem,
  OptionCardsSlotDef,
} from '../types'
import type { UiMessageKey } from '../locales/uiMessages'

type TFn = (key: UiMessageKey, vars?: Record<string, string | number>) => string

/**
 * Slot editor: displays input fields for the selected section's slots.
 * Renders different form controls based on slot kind.
 */
export function SlotEditor() {
  const { t, locale } = useUiStrings()
  const selectedUid = useEditorStore((s) => s.selectedUid)
  const sections = useEditorStore((s) => s.projects[s.activeProjectId]?.sections ?? [])
  const updateSlot = useEditorStore((s) => s.updateSlot)

  const section = sections.find((s) => s.uid === selectedUid)

  if (!section) {
    return (
      <div className="flex h-full flex-col items-center justify-center py-16 text-ink/50">
        <IconDocumentStack className="mb-3 text-ink/30" />
        <p className="text-sm text-ink/65">{t('slotSelectSection')}</p>
      </div>
    )
  }

  if (section.componentId === FREEFORM_COMPONENT_ID && section.freeform) {
    return <FreeformSlotEditor section={section} />
  }

  const comp = getComponent(section.componentId)
  if (!comp) {
    return (
      <div className="flex h-full flex-col items-center justify-center py-16 text-ink/50">
        <IconDocumentStack className="mb-3 text-ink/30" />
        <p className="text-sm text-ink/65">{t('slotSelectSection')}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="chrome-divider flex items-center gap-2 pb-3">
        <ComponentTypeBadge code={comp.icon} />
        <h2 className="font-serif text-lg font-medium text-ink">
          {localizedComponentName(locale, comp.id, comp.name)}
        </h2>
      </div>

      {comp.slots.map((slotDef) => (
        <SlotField
          key={slotDef.id}
          slotDef={slotDef}
          slotLabel={resolveSlotLabel(locale, comp.id, slotDef.id, slotDef.label)}
          value={section.values[slotDef.id]}
          onChange={(val) => updateSlot(section.uid, slotDef.id, val)}
          t={t}
        />
      ))}
    </div>
  )
}

function SlotField({
  slotDef,
  slotLabel,
  value,
  onChange,
  t,
}: {
  slotDef: AnySlotDef
  slotLabel: string
  value: unknown
  onChange: (val: never) => void
  t: TFn
}) {
  switch (slotDef.kind) {
    case 'image':
      return (
        <ImageField
          slotDef={slotDef}
          slotLabel={slotLabel}
          value={value as ImageSlotValue}
          onChange={onChange}
          t={t}
        />
      )
    case 'text':
      return (
        <TextField
          slotDef={slotDef}
          slotLabel={slotLabel}
          value={value as TextSlotValue}
          onChange={onChange}
        />
      )
    case 'badge':
      return (
        <BadgeField
          slotLabel={slotLabel}
          value={value as BadgeSlotValue}
          onChange={onChange}
          t={t}
        />
      )
    case 'iconGroup':
      return (
        <IconGroupField
          slotDef={slotDef}
          slotLabel={slotLabel}
          value={value as IconGroupSlotValue}
          onChange={onChange}
          t={t}
        />
      )
    case 'legend':
      return (
        <LegendField
          slotLabel={slotLabel}
          value={value as LegendSlotValue}
          onChange={onChange}
          t={t}
        />
      )
    case 'optionCards':
      return (
        <OptionCardsField
          slotDef={slotDef as OptionCardsSlotDef}
          slotLabel={slotLabel}
          value={value as OptionCardsSlotValue}
          onChange={onChange}
          t={t}
        />
      )
    default:
      return null
  }
}

const INPUT_CLASS =
  'w-full rounded-md border border-warm-gray/60 bg-white/40 px-3 py-1.5 text-sm text-ink placeholder:text-ink/35 focus:border-terracotta/50 focus:outline-none'

function ImageField({
  slotDef,
  slotLabel,
  value,
  onChange,
  t,
}: {
  slotDef: AnySlotDef
  slotLabel: string
  value: ImageSlotValue
  onChange: (val: never) => void
  t: TFn
}) {
  const v = value || { src: '', alt: '', width: 0, height: 0 }
  const update = (patch: Partial<ImageSlotValue>) =>
    (onChange as (val: ImageSlotValue) => void)({ ...v, ...patch })
  const [srcsetCopied, setSrcsetCopied] = useState(false)
  const suggestedSrcset = v.width > 0 ? suggestSrcsetFromWidth(v.width) : ''

  const copySuggestedSrcset = async () => {
    if (!suggestedSrcset) return
    try {
      await navigator.clipboard.writeText(suggestedSrcset)
      setSrcsetCopied(true)
      window.setTimeout(() => setSrcsetCopied(false), 2000)
    } catch (err) {
      logger.error('Failed to copy srcset to clipboard', err)
    }
  }

  return (
    <fieldset className="space-y-2">
      <legend className="chrome-heading flex items-center gap-2">
        <span className="text-[9px] text-ink/35">IMG</span>
        {slotLabel}
        {slotDef.required && <span className="text-terracotta">*</span>}
      </legend>
      <input
        type="url"
        placeholder={t('slotImageUrlPh')}
        value={v.src}
        onChange={(e) => update({ src: e.target.value })}
        className={INPUT_CLASS}
      />
      <input
        type="text"
        placeholder={t('slotAltPh')}
        value={v.alt}
        onChange={(e) => update({ alt: e.target.value })}
        className={`${INPUT_CLASS} ${!v.alt ? 'border-mustard/60' : ''}`}
      />
      <div className="flex gap-2">
        <input
          type="number"
          placeholder={t('slotWidth')}
          value={v.width || ''}
          onChange={(e) => update({ width: parseInt(e.target.value) || 0 })}
          className={`${INPUT_CLASS} w-1/2`}
        />
        <input
          type="number"
          placeholder={t('slotHeight')}
          value={v.height || ''}
          onChange={(e) => update({ height: parseInt(e.target.value) || 0 })}
          className={`${INPUT_CLASS} w-1/2`}
        />
      </div>
      {v.width > 0 && suggestedSrcset && (
        <div className="flex items-center gap-2 min-w-0">
          <p
            className="min-w-0 flex-1 truncate text-xs text-ink/45"
            title={suggestedSrcset}
          >
            {t('slotSuggestedSrcset', { text: suggestedSrcset })}
          </p>
          <button
            type="button"
            onClick={() => void copySuggestedSrcset()}
            className="shrink-0 text-xs text-ink/45 underline-offset-2 hover:text-terracotta"
          >
            {srcsetCopied ? t('slotCopied') : t('slotCopy')}
          </button>
        </div>
      )}
      {!v.alt && <p className="text-xs text-terracotta/90">{t('slotSeoAltWarn')}</p>}
    </fieldset>
  )
}

function TextField({
  slotDef,
  slotLabel,
  value,
  onChange,
}: {
  slotDef: AnySlotDef
  slotLabel: string
  value: TextSlotValue
  onChange: (val: never) => void
}) {
  const v = value || { content: '' }
  const multiline = 'multiline' in slotDef && slotDef.multiline
  const placeholder = ('placeholder' in slotDef && slotDef.placeholder) || ''

  return (
    <fieldset className="space-y-1">
      <legend className="chrome-heading">
        {'tag' in slotDef ? `<${slotDef.tag}>` : ''} {slotLabel}
      </legend>
      {multiline ? (
        <textarea
          rows={3}
          placeholder={placeholder as string}
          value={v.content}
          onChange={(e) =>
            (onChange as (val: TextSlotValue) => void)({ content: e.target.value })
          }
          className={`${INPUT_CLASS} resize-y`}
        />
      ) : (
        <input
          type="text"
          placeholder={placeholder as string}
          value={v.content}
          onChange={(e) =>
            (onChange as (val: TextSlotValue) => void)({ content: e.target.value })
          }
          className={INPUT_CLASS}
        />
      )}
    </fieldset>
  )
}

function BadgeField({
  slotLabel,
  value,
  onChange,
  t,
}: {
  slotLabel: string
  value: BadgeSlotValue
  onChange: (val: never) => void
  t: TFn
}) {
  const v = value || { number: '', label: '' }
  const update = (patch: Partial<BadgeSlotValue>) =>
    (onChange as (val: BadgeSlotValue) => void)({ ...v, ...patch })

  return (
    <fieldset className="space-y-2">
      <legend className="chrome-heading">
        <span className="text-[9px] text-ink/35">BDG</span> {slotLabel}
      </legend>
      <input
        type="text"
        placeholder={t('slotBadgeNumPh')}
        value={v.number}
        onChange={(e) => update({ number: e.target.value })}
        className={INPUT_CLASS}
      />
      <input
        type="text"
        placeholder={t('slotBadgeLabelPh')}
        value={v.label}
        onChange={(e) => update({ label: e.target.value })}
        className={INPUT_CLASS}
      />
      <input
        type="url"
        placeholder={t('slotIconUrlPh')}
        value={v.iconSrc || ''}
        onChange={(e) => update({ iconSrc: e.target.value })}
        className={INPUT_CLASS}
      />
    </fieldset>
  )
}

function IconGroupField({
  slotDef,
  slotLabel,
  value,
  onChange,
  t,
}: {
  slotDef: AnySlotDef
  slotLabel: string
  value: IconGroupSlotValue
  onChange: (val: never) => void
  t: TFn
}) {
  const v = value || { items: [] }
  const items = v.items || []
  const maxItems = 'maxItems' in slotDef ? (slotDef.maxItems as number) : 8

  const updateItem = (idx: number, patch: Partial<IconGroupItem>) => {
    const newItems = items.map((item, i) => (i === idx ? { ...item, ...patch } : item))
    ;(onChange as (val: IconGroupSlotValue) => void)({ items: newItems })
  }

  const addItem = () => {
    if (items.length >= maxItems) return
    ;(onChange as (val: IconGroupSlotValue) => void)({
      items: [...items, { iconSrc: '', iconAlt: '', label: '' }],
    })
  }

  const removeItem = (idx: number) => {
    ;(onChange as (val: IconGroupSlotValue) => void)({
      items: items.filter((_, i) => i !== idx),
    })
  }

  return (
    <fieldset className="space-y-2">
      <legend className="chrome-heading">
        <span className="text-[9px] text-ink/35">LST</span> {slotLabel} ({items.length}/{maxItems})
      </legend>

      {items.map((item, idx) => (
        <div
          key={idx}
          className="flex items-start gap-2 rounded-md border border-warm-gray/45 bg-white/25 p-2"
        >
          <div className="flex-1 space-y-1">
            <input
              type="url"
              placeholder={t('slotIconUrl')}
              value={item.iconSrc}
              onChange={(e) => updateItem(idx, { iconSrc: e.target.value })}
              className={`${INPUT_CLASS} text-xs`}
            />
            <input
              type="text"
              placeholder={t('slotLabelPh')}
              value={item.label}
              onChange={(e) => updateItem(idx, { label: e.target.value })}
              className={`${INPUT_CLASS} text-xs`}
            />
          </div>
          <button
            type="button"
            onClick={() => removeItem(idx)}
            className="p-1 text-ink/40 hover:text-terracotta"
            aria-label={t('slotRemove')}
          >
            <IconX className="h-4 w-4" />
          </button>
        </div>
      ))}

      {items.length < maxItems && (
        <button
          type="button"
          onClick={addItem}
          className="text-xs text-terracotta hover:text-terracotta/80"
        >
          {t('slotAddItem')}
        </button>
      )}
    </fieldset>
  )
}

function LegendField({
  slotLabel,
  value,
  onChange,
  t,
}: {
  slotLabel: string
  value: LegendSlotValue
  onChange: (val: never) => void
  t: TFn
}) {
  const v = value || { label: '', dots: [] }
  const dots = v.dots || []

  const setLabel = (label: string) => {
    ;(onChange as (val: LegendSlotValue) => void)({ ...v, label })
  }

  const updateDot = (idx: number, patch: Partial<LegendDot>) => {
    const next = dots.map((d, i) => (i === idx ? { ...d, ...patch } : d))
    ;(onChange as (val: LegendSlotValue) => void)({ ...v, dots: next })
  }

  const addDot = () => {
    ;(onChange as (val: LegendSlotValue) => void)({
      ...v,
      dots: [...dots, { color: '#d94848', label: '' }],
    })
  }

  const removeDot = (idx: number) => {
    ;(onChange as (val: LegendSlotValue) => void)({
      ...v,
      dots: dots.filter((_, i) => i !== idx),
    })
  }

  return (
    <fieldset className="space-y-2">
      <legend className="chrome-heading">
        <span className="text-[9px] text-ink/35">LEG</span> {slotLabel}
      </legend>
      <input
        type="text"
        placeholder={t('slotLegendCaptionPh')}
        value={v.label}
        onChange={(e) => setLabel(e.target.value)}
        className={INPUT_CLASS}
      />
      <div className="space-y-1.5">
        {dots.map((dot, idx) => (
          <div key={idx} className="flex gap-2 items-center">
            <input
              type="color"
              value={dot.color?.startsWith('#') ? dot.color : '#d94848'}
              onChange={(e) => updateDot(idx, { color: e.target.value })}
              className="h-8 w-10 shrink-0 cursor-pointer rounded border border-warm-gray/70 bg-white/50"
              title={t('slotSwatchColor')}
            />
            <input
              type="text"
              placeholder={t('slotDotLabelPh')}
              value={dot.label || ''}
              onChange={(e) => updateDot(idx, { label: e.target.value })}
              className={`${INPUT_CLASS} flex-1 text-xs`}
            />
            <button
              type="button"
              onClick={() => removeDot(idx)}
              className="shrink-0 p-1 text-ink/40 hover:text-terracotta"
              aria-label={t('slotRemove')}
            >
              <IconX className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
      <button type="button" onClick={addDot} className="text-xs text-terracotta hover:text-terracotta/80">
        {t('slotAddSwatch')}
      </button>
    </fieldset>
  )
}

function OptionCardsField({
  slotDef,
  slotLabel,
  value,
  onChange,
  t,
}: {
  slotDef: OptionCardsSlotDef
  slotLabel: string
  value: OptionCardsSlotValue
  onChange: (val: never) => void
  t: TFn
}) {
  const v = value || { items: [] }
  const items = v.items || []
  const maxItems = slotDef.maxItems
  const minItems = slotDef.minItems ?? 1

  const patchItems = (next: OptionCardItem[]) => {
    ;(onChange as (val: OptionCardsSlotValue) => void)({ items: next })
  }

  const updateCard = (idx: number, patch: Partial<OptionCardItem>) => {
    const next = items.map((card, i) => (i === idx ? { ...card, ...patch } : card))
    patchItems(next)
  }

  const updateCardImage = (idx: number, patch: Partial<ImageSlotValue>) => {
    const card = items[idx]
    if (!card) return
    const img = { ...card.image, ...patch }
    updateCard(idx, { image: img })
  }

  const addCard = () => {
    if (items.length >= maxItems) return
    patchItems([
      ...items,
      {
        badge: '',
        image: { src: '', alt: '', width: 0, height: 0 },
        title: '',
        subtitle: '',
      },
    ])
  }

  const removeCard = (idx: number) => {
    if (items.length <= minItems) return
    patchItems(items.filter((_, i) => i !== idx))
  }

  return (
    <fieldset className="space-y-3">
      <legend className="chrome-heading">
        <span className="text-[9px] text-ink/35">CRD</span> {slotLabel} ({items.length}/{maxItems})
      </legend>
      {items.map((card, idx) => (
        <div
          key={idx}
          className="space-y-2 rounded-lg border border-warm-gray/45 bg-white/25 p-3"
        >
          <div className="flex justify-between items-center">
            <span className="font-mono text-[10px] uppercase tracking-wider text-ink/40">
              {t('slotCardN', { n: idx + 1 })}
            </span>
            {items.length > minItems && (
              <button
                type="button"
                onClick={() => removeCard(idx)}
                className="text-xs text-ink/45 hover:text-terracotta"
              >
                {t('slotRemove')}
              </button>
            )}
          </div>
          <input
            type="text"
            placeholder={t('slotBadgePh')}
            value={card.badge}
            onChange={(e) => updateCard(idx, { badge: e.target.value })}
            className={INPUT_CLASS}
          />
          <input
            type="url"
            placeholder={t('slotImageUrlPh')}
            value={card.image?.src ?? ''}
            onChange={(e) => updateCardImage(idx, { src: e.target.value })}
            className={INPUT_CLASS}
          />
          <input
            type="text"
            placeholder={t('slotAltShort')}
            value={card.image?.alt ?? ''}
            onChange={(e) => updateCardImage(idx, { alt: e.target.value })}
            className={INPUT_CLASS}
          />
          <div className="flex gap-2">
            <input
              type="number"
              placeholder={t('slotWidth')}
              value={card.image?.width || ''}
              onChange={(e) => updateCardImage(idx, { width: parseInt(e.target.value) || 0 })}
              className={`${INPUT_CLASS} w-1/2`}
            />
            <input
              type="number"
              placeholder={t('slotHeight')}
              value={card.image?.height || ''}
              onChange={(e) => updateCardImage(idx, { height: parseInt(e.target.value) || 0 })}
              className={`${INPUT_CLASS} w-1/2`}
            />
          </div>
          <input
            type="text"
            placeholder={t('slotCardTitlePh')}
            value={card.title}
            onChange={(e) => updateCard(idx, { title: e.target.value })}
            className={INPUT_CLASS}
          />
          <input
            type="text"
            placeholder={t('slotSubtitlePh')}
            value={card.subtitle}
            onChange={(e) => updateCard(idx, { subtitle: e.target.value })}
            className={INPUT_CLASS}
          />
        </div>
      ))}
      {items.length < maxItems && (
        <button type="button" onClick={addCard} className="text-xs text-terracotta hover:text-terracotta/80">
          {t('slotAddCard')}
        </button>
      )}
    </fieldset>
  )
}
