import { useState } from 'react'
import { useUiStrings } from '../hooks/useUiStrings'
import { useEditorStore } from '../store/editorStore'
import type { SectionInstance } from '../types'
import type { FreeformSectionData, FreeformImageRef, FreeformTextRef } from '../types/freeform'
import { ComponentTypeBadge } from './ComponentTypeBadge'

const INPUT_CLASS =
  'w-full rounded-md border border-warm-gray/60 bg-white/40 px-3 py-1.5 text-sm text-ink placeholder:text-ink/35 focus:border-terracotta/50 focus:outline-none'

/**
 * Editor for freeform (AI Layout Reproduce) sections.
 * Shows image URL/alt/dims and text content fields derived from
 * the section's `freeform` data, plus an advanced raw HTML/CSS view.
 * 自由排版区块编辑器。
 */
export function FreeformSlotEditor({ section }: { section: SectionInstance }) {
  const { t } = useUiStrings()
  const updateSlot = useEditorStore((s) => s.updateSlot)
  const [showAdvanced, setShowAdvanced] = useState(false)

  const ff = section.freeform
  if (!ff) return null

  const patchFreeform = (patch: Partial<FreeformSectionData>) => {
    const next: FreeformSectionData = { ...ff, ...patch }
    updateSlot(section.uid, '__freeform__' as never, { ...section.values, __freeform: next } as never)

    const store = useEditorStore.getState()
    const activeId = store.activeProjectId
    const proj = store.projects[activeId]
    if (!proj) return
    const sections = proj.sections.map((s) =>
      s.uid === section.uid ? { ...s, freeform: next } : s,
    )
    store.replaceProject({ ...proj, sections })
  }

  const updateImage = (idx: number, patch: Partial<FreeformImageRef>) => {
    const images = ff.images.map((img, i) => (i === idx ? { ...img, ...patch } : img))
    patchFreeform({ images })
  }

  const updateText = (idx: number, patch: Partial<FreeformTextRef>) => {
    const texts = ff.texts.map((txt, i) => (i === idx ? { ...txt, ...patch } : txt))
    patchFreeform({ texts })
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="chrome-divider flex items-center gap-2 pb-3">
        <ComponentTypeBadge code="FF" />
        <h2 className="font-serif text-lg font-medium text-ink">{t('freeformEditorTitle')}</h2>
      </div>

      <fieldset className="space-y-1">
        <legend className="chrome-heading">{t('freeformSectionName')}</legend>
        <input
          type="text"
          value={ff.name}
          onChange={(e) => patchFreeform({ name: e.target.value })}
          className={INPUT_CLASS}
        />
      </fieldset>

      {ff.images.length > 0 && (
        <fieldset className="space-y-3">
          <legend className="chrome-heading">{t('freeformImagesHeading', { count: ff.images.length })}</legend>
          {ff.images.map((img, idx) => (
            <div
              key={img.tokenId}
              className="space-y-1.5 rounded-lg border border-warm-gray/45 bg-white/25 p-2.5"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] text-ink/45">{img.tokenId}</span>
                <span className="font-mono text-[10px] text-ink/35">
                  {t('freeformImageDims', { w: img.width, h: img.height, ar: img.aspectRatio })}
                </span>
              </div>
              <input
                type="url"
                placeholder={t('freeformImageUrl')}
                value={img.src}
                onChange={(e) => updateImage(idx, { src: e.target.value })}
                className={INPUT_CLASS}
              />
              <input
                type="text"
                placeholder={t('freeformImageAlt')}
                value={img.alt}
                onChange={(e) => updateImage(idx, { alt: e.target.value })}
                className={`${INPUT_CLASS} ${!img.alt ? 'border-mustard/60' : ''}`}
              />
            </div>
          ))}
        </fieldset>
      )}

      {ff.texts.length > 0 && (
        <fieldset className="space-y-3">
          <legend className="chrome-heading">{t('freeformTextsHeading', { count: ff.texts.length })}</legend>
          {ff.texts.map((txt, idx) => (
            <div
              key={txt.tokenId}
              className="space-y-1 rounded-lg border border-warm-gray/45 bg-white/25 p-2.5"
            >
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] text-ink/45">{txt.tokenId}</span>
                <span className="font-mono text-[10px] text-ink/35">&lt;{txt.tag}&gt;</span>
              </div>
              {txt.tag === 'p' ? (
                <textarea
                  rows={2}
                  value={txt.content}
                  onChange={(e) => updateText(idx, { content: e.target.value })}
                  className={`${INPUT_CLASS} resize-y`}
                />
              ) : (
                <input
                  type="text"
                  value={txt.content}
                  onChange={(e) => updateText(idx, { content: e.target.value })}
                  className={INPUT_CLASS}
                />
              )}
            </div>
          ))}
        </fieldset>
      )}

      <div className="chrome-divider pt-2">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="font-mono text-[10px] uppercase tracking-wider text-ink/45 hover:text-terracotta"
        >
          <span className="mr-1 inline-block w-3 tabular-nums">{showAdvanced ? '−' : '+'}</span>
          {t('freeformAdvancedToggle')}
        </button>
        {showAdvanced && (
          <div className="mt-2 space-y-3">
            <fieldset className="space-y-1">
              <legend className="chrome-heading">{t('freeformHtmlLabel')}</legend>
              <textarea
                rows={6}
                value={ff.htmlTemplate}
                onChange={(e) => patchFreeform({ htmlTemplate: e.target.value })}
                className={`${INPUT_CLASS} resize-y font-mono text-[10px]`}
              />
            </fieldset>
            <fieldset className="space-y-1">
              <legend className="chrome-heading">{t('freeformCssLabel')}</legend>
              <textarea
                rows={6}
                value={ff.css}
                onChange={(e) => patchFreeform({ css: e.target.value })}
                className={`${INPUT_CLASS} resize-y font-mono text-[10px]`}
              />
            </fieldset>
          </div>
        )}
      </div>
    </div>
  )
}
