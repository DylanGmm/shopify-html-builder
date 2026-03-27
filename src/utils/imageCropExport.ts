import { logger } from './logger'

/**
 * Crop a rectangular region from a loaded HTMLImageElement into a Blob.
 * 从已解码的 `<img>` 上裁切矩形区域并导出为 Blob。
 *
 * @param img - decoded image element
 * @param sx - source X in **natural** pixels
 * @param sy - source Y in natural pixels
 * @param sw - source width (clamped ≥ 1)
 * @param sh - source height (clamped ≥ 1)
 * @param mime - `image/png` or `image/webp`
 * @param quality - optional quality for webp/jpeg (0–1)
 */
export function cropImageElementToBlob(
  img: HTMLImageElement,
  sx: number,
  sy: number,
  sw: number,
  sh: number,
  mime: 'image/png' | 'image/webp',
  quality = 0.92,
): Promise<Blob | null> {
  const iw = img.naturalWidth
  const ih = img.naturalHeight
  if (!iw || !ih) return Promise.resolve(null)

  const x = Math.max(0, Math.floor(sx))
  const y = Math.max(0, Math.floor(sy))
  let w = Math.max(1, Math.round(sw))
  let h = Math.max(1, Math.round(sh))
  if (x + w > iw) w = iw - x
  if (y + h > ih) h = ih - y
  if (w < 1 || h < 1) return Promise.resolve(null)

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) return Promise.resolve(null)

  try {
    ctx.drawImage(img, x, y, w, h, 0, 0, w, h)
  } catch (e) {
    logger.error('drawImage failed', e)
    return Promise.resolve(null)
  }

  return new Promise((resolve) => {
    canvas.toBlob(
      (b) => resolve(b),
      mime,
      mime === 'image/webp' ? quality : undefined,
    )
  })
}

/**
 * Trigger a browser download for a Blob.
 * 触发浏览器下载 Blob 文件。
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

/**
 * Read Blob as a data URL for embedding in slot `src`.
 * 将 Blob 读成 data URL，用于写入槽位 `src`。
 */
export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const fr = new FileReader()
    fr.onload = () => {
      const s = fr.result
      if (typeof s === 'string') resolve(s)
      else reject(new Error('Unexpected read result'))
    }
    fr.onerror = () => reject(fr.error ?? new Error('read failed'))
    fr.readAsDataURL(blob)
  })
}
