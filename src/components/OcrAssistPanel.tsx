import { useRef, useState } from 'react'
import { useUiStrings } from '../hooks/useUiStrings'
import { resolveSlotLabel } from '../locales/componentZh'
import { useEditorStore } from '../store/editorStore'
import { getComponent } from '../registry'
import { runOcrOnImageFile } from '../services/ocrService'
import { logger } from '../utils/logger'
import type { TextSlotValue } from '../types'

/**
 * Weak OCR: run Tesseract locally on an image; copy or apply to a text slot (user confirms).
 * 弱 OCR：本地 Tesseract；复制或写入选定文本槽（需用户确认）。
 */
export function OcrAssistPanel() {
  const { t, locale } = useUiStrings()
  const fileRef = useRef<HTMLInputElement>(null)
  const selectedUid = useEditorStore((s) => s.selectedUid)
  const sections = useEditorStore((s) => s.projects[s.activeProjectId]?.sections ?? [])
  const updateSlot = useEditorStore((s) => s.updateSlot)

  const section = sections.find((sec) => sec.uid === selectedUid)
  const comp = section ? getComponent(section.componentId) : null
  const textSlots = comp?.slots.filter((sl) => sl.kind === 'text') ?? []

  const [targetSlotId, setTargetSlotId] = useState('')
  const [resultText, setResultText] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const firstTextId = textSlots[0]?.id ?? ''
  const effectiveTarget =
    targetSlotId && textSlots.some((s) => s.id === targetSlotId) ? targetSlotId : firstTextId

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setBusy(true)
    setError(null)
    setResultText('')
    const ocr = await runOcrOnImageFile(file)
    setBusy(false)
    if (ocr.ok) {
      setResultText(ocr.value)
    } else {
      setError(ocr.error.message)
      logger.error('OCR error', ocr.error.message)
    }
  }

  const handleCopy = async () => {
    if (!resultText) return
    try {
      await navigator.clipboard.writeText(resultText)
    } catch (err) {
      logger.error('Clipboard copy failed', err)
    }
  }

  const handleApply = () => {
    if (!section || !effectiveTarget || !resultText) return
    updateSlot(section.uid, effectiveTarget, { content: resultText } as TextSlotValue)
  }

  const INPUT_CLASS =
    'w-full rounded-md border border-warm-gray/60 bg-white/40 px-2 py-1.5 text-xs text-ink focus:border-terracotta/50 focus:outline-none'

  return (
    <div className="flex flex-col gap-3">
      <h2 className="chrome-heading px-1">{t('ocrTitle')}</h2>
      <p className="px-1 text-[10px] leading-snug text-ink/50">{t('ocrHint')}</p>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      <button
        type="button"
        disabled={busy}
        onClick={() => fileRef.current?.click()}
        className="w-full rounded-lg border border-warm-gray/55 bg-white/25 px-3 py-2 text-xs font-medium text-ink transition hover:bg-white/40 disabled:opacity-50"
      >
        {busy ? t('ocrChooseBusy') : t('ocrChooseIdle')}
      </button>
      {error && (
        <div className="rounded-lg border border-terracotta/35 bg-terracotta/10 px-2 py-1.5 text-[11px] text-ink">
          {error}
        </div>
      )}
      {textSlots.length > 0 && (
        <label className="flex flex-col gap-1 px-1">
          <span className="text-[10px] text-ink/50">{t('ocrApplyTarget')}</span>
          <select
            key={selectedUid ?? 'none'}
            value={effectiveTarget}
            onChange={(e) => setTargetSlotId(e.target.value)}
            className={INPUT_CLASS}
          >
            {textSlots.map((s) => (
              <option key={s.id} value={s.id}>
                {comp
                  ? resolveSlotLabel(locale, comp.id, s.id, s.label)
                  : s.label}
              </option>
            ))}
          </select>
        </label>
      )}
      {section && textSlots.length === 0 && (
        <p className="px-1 text-[10px] text-mustard/90">{t('ocrNoTextSlots')}</p>
      )}
      {!section && (
        <p className="px-1 text-[10px] text-ink/50">{t('ocrSelectSectionHint')}</p>
      )}
      <textarea
        readOnly
        value={resultText}
        placeholder={t('ocrOutputPh')}
        rows={5}
        className="w-full rounded-md border border-warm-gray/60 bg-white/50 px-2 py-1.5 font-mono text-xs text-ink"
      />
      <div className="flex gap-2">
        <button
          type="button"
          disabled={!resultText}
          onClick={handleCopy}
          className="flex-1 rounded-lg border border-warm-gray/55 px-2 py-1.5 text-[11px] text-ink/75 transition hover:bg-white/35 disabled:opacity-40"
        >
          {t('ocrCopy')}
        </button>
        <button
          type="button"
          disabled={!resultText || !section || !effectiveTarget}
          onClick={handleApply}
          className="flex-1 rounded-lg border border-ink/20 bg-ink px-2 py-1.5 text-[11px] font-medium text-mustard transition hover:opacity-90 disabled:opacity-40"
        >
          {t('ocrApply')}
        </button>
      </div>
    </div>
  )
}
