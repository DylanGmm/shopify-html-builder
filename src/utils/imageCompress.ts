import { ok, err, type Result } from '../types/result'
import { logger } from './logger'

/**
 * Load an image file into HTMLImageElement.
 * 将文件加载为 HTMLImageElement。
 */
function loadImageFromFile(file: File): Promise<Result<HTMLImageElement, string>> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(ok(img))
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      resolve(err('Failed to load image'))
    }
    img.src = url
  })
}

/**
 * Draw scaled image to canvas and export JPEG data URL (for vision APIs).
 * 缩放绘制到 canvas 并导出 JPEG data URL（控制体积与 token）。
 *
 * @param file - source image file
 * @param maxEdge - maximum width or height in pixels
 */
export async function compressImageToJpegDataUrl(
  file: File,
  maxEdge: number,
): Promise<Result<{ dataUrl: string; width: number; height: number }, string>> {
  const loaded = await loadImageFromFile(file)
  if (!loaded.ok) return loaded

  const img = loaded.value
  const nw = img.naturalWidth
  const nh = img.naturalHeight
  if (!nw || !nh) return err('Invalid image dimensions')

  const scale = Math.min(1, maxEdge / Math.max(nw, nh))
  const cw = Math.max(1, Math.round(nw * scale))
  const ch = Math.max(1, Math.round(nh * scale))

  const canvas = document.createElement('canvas')
  canvas.width = cw
  canvas.height = ch
  const ctx = canvas.getContext('2d')
  if (!ctx) return err('Canvas unsupported')

  ctx.drawImage(img, 0, 0, cw, ch)
  try {
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
    logger.debug('Compressed image', { cw, ch, bytesApprox: dataUrl.length })
    return ok({ dataUrl, width: cw, height: ch })
  } catch (e) {
    logger.error('toDataURL failed', e)
    return err('Could not encode image (tainted canvas?)')
  }
}
