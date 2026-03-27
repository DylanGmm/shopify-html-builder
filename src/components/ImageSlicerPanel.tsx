import { useEffect, useRef, useState } from 'react'
import { nanoid } from 'nanoid'
import { useUiStrings } from '../hooks/useUiStrings'
import { useEditorStore } from '../store/editorStore'
import type { ImageSlotValue, OptionCardsSlotValue } from '../types'
import {
  blobToDataUrl,
  cropImageElementToBlob,
  downloadBlob,
} from '../utils/imageCropExport'
import { listImageApplyTargets } from '../utils/imageSlicerTargets'
import { logger } from '../utils/logger'

const MIN_NATURAL_PX = 8

/**
 * Normalise drag rectangle (display px) and convert to natural image pixels.
 * 将拖拽矩形从显示坐标转为原图像素并夹紧在画布内。
 */
function displayDragToNaturalRect(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  dispW: number,
  dispH: number,
  natW: number,
  natH: number,
): { nx: number; ny: number; nw: number; nh: number } | null {
  const left = Math.min(x0, x1)
  const top = Math.min(y0, y1)
  const dw = Math.abs(x1 - x0)
  const dh = Math.abs(y1 - y0)
  if (dw < 2 || dh < 2) return null

  let nx = (left / dispW) * natW
  let ny = (top / dispH) * natH
  let nw = (dw / dispW) * natW
  let nh = (dh / dispH) * natH

  nx = Math.max(0, Math.min(nx, natW - MIN_NATURAL_PX))
  ny = Math.max(0, Math.min(ny, natH - MIN_NATURAL_PX))
  nw = Math.max(MIN_NATURAL_PX, Math.round(nw))
  nh = Math.max(MIN_NATURAL_PX, Math.round(nh))
  if (nx + nw > natW) nw = natW - nx
  if (ny + nh > natH) nh = natH - ny
  if (nw < MIN_NATURAL_PX || nh < MIN_NATURAL_PX) return null
  return { nx, ny, nw, nh }
}

interface SlicerRegion {
  id: string
  nx: number
  ny: number
  nw: number
  nh: number
}

/**
 * Long-image manual regions: draw boxes, export PNG/WebP slices, apply to a slot (F-15 + F-18).
 * 长图手动框选：导出切片 / 写入当前序列中的图片槽。
 */
export function ImageSlicerPanel() {
  const { t, locale } = useUiStrings()
  const sections = useEditorStore((s) => s.projects[s.activeProjectId]?.sections ?? [])
  const updateSlot = useEditorStore((s) => s.updateSlot)

  const imgRef = useRef<HTMLImageElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)

  const [objectUrl, setObjectUrl] = useState<string | null>(null)
  const [natural, setNatural] = useState({ w: 0, h: 0 })
  const [display, setDisplay] = useState({ w: 0, h: 0 })
  const [regions, setRegions] = useState<SlicerRegion[]>([])
  const [draft, setDraft] = useState<{ x0: number; y0: number; x1: number; y1: number } | null>(
    null,
  )
  const [applyKey, setApplyKey] = useState('')

  const targets = listImageApplyTargets(sections, locale)

  useEffect(() => {
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [objectUrl])

  const measureDisplay = () => {
    const el = imgRef.current
    if (!el) return
    setDisplay({ w: el.offsetWidth, h: el.offsetHeight })
    setNatural({ w: el.naturalWidth, h: el.naturalHeight })
  }

  useEffect(() => {
    if (!objectUrl) return
    const ro = new ResizeObserver(() => measureDisplay())
    const w = wrapRef.current
    if (w) ro.observe(w)
    return () => ro.disconnect()
  }, [objectUrl])

  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f || !f.type.startsWith('image/')) return
    setObjectUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return URL.createObjectURL(f)
    })
    setRegions([])
    setDraft(null)
    setNatural({ w: 0, h: 0 })
    setDisplay({ w: 0, h: 0 })
  }

  const removeImage = () => {
    setObjectUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return null
    })
    setRegions([])
    setDraft(null)
    setNatural({ w: 0, h: 0 })
    setDisplay({ w: 0, h: 0 })
  }

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 || !objectUrl) return
    const img = imgRef.current
    if (!img?.naturalWidth) return

    const rect = e.currentTarget.getBoundingClientRect()
    const x0 = e.clientX - rect.left
    const y0 = e.clientY - rect.top
    setDraft({ x0, y0, x1: x0, y1: y0 })

    const onMove = (ev: PointerEvent) => {
      const ol = overlayRef.current?.getBoundingClientRect()
      if (!ol) return
      setDraft((d) =>
        d
          ? {
              ...d,
              x1: ev.clientX - ol.left,
              y1: ev.clientY - ol.top,
            }
          : null,
      )
    }

    const onUp = (ev: PointerEvent) => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)

      const ol = overlayRef.current?.getBoundingClientRect()
      const imgEl = imgRef.current
      if (!ol || !imgEl?.naturalWidth) {
        setDraft(null)
        return
      }

      const dispW = ol.width
      const dispH = ol.height
      const x1 = ev.clientX - ol.left
      const y1 = ev.clientY - ol.top
      const nw = imgEl.naturalWidth
      const nh = imgEl.naturalHeight

      const norm = displayDragToNaturalRect(x0, y0, x1, y1, dispW, dispH, nw, nh)
      if (norm) {
        setRegions((prev) => [...prev, { id: nanoid(6), ...norm }])
      }
      setDraft(null)
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
  }

  const removeRegion = (id: string) => setRegions((r) => r.filter((x) => x.id !== id))

  const exportRegion = async (r: SlicerRegion, mime: 'image/png' | 'image/webp') => {
    const img = imgRef.current
    if (!img?.naturalWidth) return
    let blob = await cropImageElementToBlob(img, r.nx, r.ny, r.nw, r.nh, mime, 0.92)
    if (!blob && mime === 'image/webp') {
      logger.debug('WebP export unavailable, falling back to PNG')
      blob = await cropImageElementToBlob(img, r.nx, r.ny, r.nw, r.nh, 'image/png')
    }
    if (!blob) {
      logger.error('Crop export failed')
      return
    }
    const ext = mime === 'image/webp' ? 'webp' : 'png'
    const idx = regions.findIndex((x) => x.id === r.id) + 1
    downloadBlob(blob, `slice-${idx}.${ext}`)
  }

  const applyRegionToSlot = async (r: SlicerRegion) => {
    const img = imgRef.current
    if (!img?.naturalWidth || !applyKey) return
    const target = targets.find((t) => t.key === applyKey)
    if (!target) return

    const blob = await cropImageElementToBlob(img, r.nx, r.ny, r.nw, r.nh, 'image/png')
    if (!blob) {
      logger.error('Crop for apply failed')
      return
    }
    let dataUrl: string
    try {
      dataUrl = await blobToDataUrl(blob)
    } catch (e) {
      logger.error('dataURL read failed', e)
      return
    }

    const section = sections.find((s) => s.uid === target.sectionUid)
    if (!section) return

    const w = Math.round(r.nw)
    const h = Math.round(r.nh)

    if (target.optionCardIndex === undefined) {
      const cur = (section.values[target.slotId] as ImageSlotValue) ?? {
        src: '',
        alt: '',
        width: 0,
        height: 0,
      }
      updateSlot(target.sectionUid, target.slotId, {
        ...cur,
        src: dataUrl,
        width: w,
        height: h,
      })
    } else {
      const pack = section.values[target.slotId] as OptionCardsSlotValue
      if (!pack?.items?.[target.optionCardIndex]) return
      const items = pack.items.map((c, idx) =>
        idx === target.optionCardIndex
          ? {
              ...c,
              image: {
                ...c.image,
                src: dataUrl,
                width: w,
                height: h,
              },
            }
          : c,
      )
      updateSlot(target.sectionUid, target.slotId, { items })
    }
  }

  const draftStyle =
    draft && display.w > 0
      ? {
          left: `${(Math.min(draft.x0, draft.x1) / display.w) * 100}%`,
          top: `${(Math.min(draft.y0, draft.y1) / display.h) * 100}%`,
          width: `${(Math.abs(draft.x1 - draft.x0) / display.w) * 100}%`,
          height: `${(Math.abs(draft.y1 - draft.y0) / display.h) * 100}%`,
        }
      : null

  return (
    <div className="space-y-3 rounded-lg border border-warm-gray/50 bg-white/20 p-3">
      <div>
        <h2 className="chrome-heading">{t('imageSlicerTitle')}</h2>
        <p className="mt-0.5 text-[10px] leading-snug text-ink/50">{t('imageSlicerHint')}</p>
      </div>

      <input
        type="file"
        accept="image/*"
        onChange={onPickFile}
        className="block w-full text-[11px] text-ink/55 file:mr-2 file:rounded-md file:border-0 file:bg-ink file:px-2 file:py-1 file:font-mono file:text-[10px] file:uppercase file:tracking-wider file:text-mustard hover:file:opacity-90"
      />

      {objectUrl && (
        <button
          type="button"
          onClick={removeImage}
          className="font-mono text-[10px] uppercase tracking-wider text-terracotta hover:text-terracotta/80"
        >
          {t('imageSlicerRemove')}
        </button>
      )}

      {objectUrl && (
        <div
          ref={wrapRef}
          className="relative max-h-72 overflow-hidden rounded-md border border-warm-gray/60 bg-ink/[0.04]"
        >
          <img
            ref={imgRef}
            src={objectUrl}
            alt={t('imageSlicerSourceAlt')}
            draggable={false}
            className="max-w-full h-auto block select-none pointer-events-none"
            onLoad={measureDisplay}
          />
          <div
            ref={overlayRef}
            role="presentation"
            className="absolute inset-0 cursor-crosshair touch-none"
            onPointerDown={onPointerDown}
          >
            {natural.w > 0 &&
              regions.map((r) => (
                <div
                  key={r.id}
                  className="pointer-events-none absolute border-2 border-terracotta/80 shadow-sm"
                  style={{
                    left: `${(r.nx / natural.w) * 100}%`,
                    top: `${(r.ny / natural.h) * 100}%`,
                    width: `${(r.nw / natural.w) * 100}%`,
                    height: `${(r.nh / natural.h) * 100}%`,
                  }}
                />
              ))}
            {draftStyle && (
              <div
                className="pointer-events-none absolute border-2 border-dashed border-mustard/80"
                style={draftStyle}
              />
            )}
          </div>
        </div>
      )}

      {objectUrl && natural.w > 0 && (
        <p className="font-mono text-[10px] text-ink/45">
          {t('imageSlicerNatural', { w: natural.w, h: natural.h })}
        </p>
      )}

      {targets.length > 0 && (
        <label className="block space-y-0.5">
          <span className="text-[10px] text-ink/50">{t('imageSlicerApplyTarget')}</span>
          <select
            value={applyKey}
            onChange={(e) => setApplyKey(e.target.value)}
            className="w-full rounded-md border border-warm-gray/60 bg-white/40 px-2 py-1 text-xs text-ink"
          >
            <option value="">{t('imageSlicerChooseSlot')}</option>
            {targets.map((t) => (
              <option key={t.key} value={t.key}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
      )}

      {regions.length > 0 && (
        <ul className="space-y-2 max-h-48 overflow-y-auto">
          {regions.map((r, i) => (
            <li
              key={r.id}
              className="flex flex-col gap-1 rounded-md border border-warm-gray/40 bg-white/30 px-2 py-1.5 text-[11px]"
            >
              <div className="flex justify-between text-ink/55">
                <span>
                  #{i + 1} — {Math.round(r.nw)}×{Math.round(r.nh)}px
                </span>
                <button
                  type="button"
                  onClick={() => removeRegion(r.id)}
                  className="font-mono text-[10px] uppercase tracking-wider text-terracotta hover:text-terracotta/80"
                >
                  {t('slotRemove')}
                </button>
              </div>
              <div className="flex flex-wrap gap-1">
                <button
                  type="button"
                  onClick={() => void exportRegion(r, 'image/png')}
                  className="rounded border border-warm-gray/55 px-2 py-0.5 text-ink/75 hover:bg-white/40"
                >
                  PNG
                </button>
                <button
                  type="button"
                  onClick={() => void exportRegion(r, 'image/webp')}
                  className="rounded border border-warm-gray/55 px-2 py-0.5 text-ink/75 hover:bg-white/40"
                >
                  WebP
                </button>
                <button
                  type="button"
                  disabled={!applyKey}
                  onClick={() => void applyRegionToSlot(r)}
                  className="rounded border border-terracotta/45 bg-terracotta/10 px-2 py-0.5 text-ink hover:bg-terracotta/18 disabled:opacity-40"
                >
                  {t('imageSlicerApply')}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
