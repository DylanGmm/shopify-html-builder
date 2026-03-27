/**
 * Browser-only OCR via lazy-loaded Tesseract.js (`Result` API).
 * 懒加载 Tesseract.js 的浏览器内 OCR（`Result` 风格 API）。
 */
import { err, ok, type Result } from '../types/result'
import { logger } from '../utils/logger'

export type OcrError = { message: string }

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('Could not read file'))
    reader.readAsDataURL(file)
  })
}

/**
 * Run Tesseract OCR on an image file in the browser (no cloud upload).
 * 在浏览器内对图片运行 Tesseract OCR（不上传云端）。
 */
export async function runOcrOnImageFile(file: File): Promise<Result<string, OcrError>> {
  if (!file.type.startsWith('image/')) {
    return err({ message: 'Choose an image file (PNG, JPEG, WebP, …).' })
  }
  try {
    const dataUrl = await readFileAsDataUrl(file)
    return runOcrOnDataUrl(dataUrl)
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Read failed'
    logger.error('OCR file read failed', e)
    return err({ message })
  }
}

/**
 * Run Tesseract OCR on a data URL or remote-readable image string.
 * 对 data URL 等图片字符串运行 OCR。
 */
export async function runOcrOnDataUrl(dataUrl: string): Promise<Result<string, OcrError>> {
  const trimmed = dataUrl.trim()
  if (!trimmed.startsWith('data:image/')) {
    return err({ message: 'OCR input must be a data:image/… URL.' })
  }
  try {
    const { createWorker } = await import('tesseract.js')
    const worker = await createWorker('eng', undefined, {
      logger: (m) => {
        logger.debug('tesseract', m.status, m.progress)
      },
    })
    const {
      data: { text },
    } = await worker.recognize(trimmed)
    await worker.terminate()
    return ok(text.trim())
  } catch (e) {
    logger.error('OCR recognize failed', e)
    const message = e instanceof Error ? e.message : 'OCR failed'
    return err({ message })
  }
}
