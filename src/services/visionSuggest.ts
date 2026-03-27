import type { AiConnectionConfig, VisionSectionPayload, VisionSuggestResult } from '../types/ai'
import { ok, err, type Result } from '../types/result'
import { buildComponentManifestForPrompt } from '../utils/componentManifest'
import { logger } from '../utils/logger'

/** Milliseconds to wait before a single automatic retry. */
const VISION_FETCH_RETRY_DELAY_MS = 800

/** HTTP statuses that warrant one retry (rate limit / transient gateway errors). */
const VISION_RETRYABLE_HTTP_STATUSES = new Set<number>([429, 502, 503, 504])

/**
 * Promise-based sleep for retry backoff.
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

/**
 * POST `fetch` with at most one retry after a network failure or a retryable HTTP status.
 * Other 4xx responses are returned as-is without retry.
 */
async function fetchVisionWithRetry(url: string, init: RequestInit): Promise<Response> {
  let firstRes: Response | undefined
  try {
    firstRes = await fetch(url, init)
  } catch (e) {
    logger.error('Vision fetch network error', e)
    await delay(VISION_FETCH_RETRY_DELAY_MS)
    try {
      return await fetch(url, init)
    } catch (e2) {
      logger.error('Vision fetch network error after retry', e2)
      throw e2
    }
  }

  if (firstRes.ok) return firstRes
  if (VISION_RETRYABLE_HTTP_STATUSES.has(firstRes.status)) {
    logger.debug('Vision fetch retrying after HTTP status', firstRes.status)
    await delay(VISION_FETCH_RETRY_DELAY_MS)
    try {
      return await fetch(url, init)
    } catch (e) {
      logger.error('Vision fetch network error on HTTP retry', e)
      throw e
    }
  }
  return firstRes
}

interface ChatCompletionResponse {
  choices?: Array<{
    message?: { content?: string | null }
  }>
  error?: { message?: string }
}

/**
 * Build JSON instruction for vision template suggestion.
 * 构造视觉分析用的系统提示（仅输出 JSON）。
 */
function systemPrompt(): string {
  const manifest = buildComponentManifestForPrompt()
  return `You are a layout analyst for e-commerce product detail pages. Given one long vertical composite screenshot (multiple sections stacked), propose an ordered list of HTML template sections.

You MUST respond with a single JSON object (no markdown) of this shape:
{
  "sections": [
    {
      "componentId": "<one of the ids below>",
      "values": {
        "<slotId>": "<for text slots: string content>",
        "<slotId>": { "alt": "<descriptive alt>", "width": <number>, "height": <number> },
        "<iconGroupSlotId>": { "items": [ { "label": "...", "iconAlt": "..." } ] },
        "<badgeSlotId>": { "number": "01", "label": "..." },
        "<legendSlotId>": { "label": "...", "dots": [ { "color": "#hex", "label": "..." } ] },
        "<optionCardsSlotId>": { "items": [ { "badge": "...", "title": "...", "subtitle": "...", "image": { "alt": "..." } } ] }
      }
    }
  ]
}

Rules:
- Use ONLY these component ids: ${manifest.replace(/\n/g, '\n  ')}
- Order sections top-to-bottom as they appear in the image.
- For every image slot, include a helpful alt text in English or Chinese as appropriate; width/height are optional hints.
- Leave copy concise; user will edit in the editor. Image src is always empty — placeholders are filled by the app.
- If unsure between similar layouts, prefer the closest matching component id.
- Return between 1 and 20 sections.`
}

/**
 * Call OpenAI-compatible Chat Completions with one vision image (data URL).
 * 调用带 vision 的 Chat Completions。
 */
export async function requestVisionTemplateSuggestion(
  config: AiConnectionConfig,
  imageDataUrl: string,
  productName: string,
): Promise<Result<VisionSuggestResult, string>> {
  const base = config.apiBaseUrl.replace(/\/$/, '')
  const url = `${base}/chat/completions`

  const userText = productName.trim()
    ? `Product name for context: "${productName.trim()}". Analyse the image and output JSON only.`
    : 'Analyse the image and output JSON only.'

  const useJsonFormat = config.jsonResponseFormat !== false
  const body: Record<string, unknown> = {
    model: config.model,
    temperature: 0.2,
    messages: [
      { role: 'system' as const, content: systemPrompt() },
      {
        role: 'user' as const,
        content: [
          { type: 'text', text: userText },
          { type: 'image_url', image_url: { url: imageDataUrl } },
        ],
      },
    ],
  }
  if (useJsonFormat) {
    body.response_format = { type: 'json_object' as const }
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${config.apiKey}`,
    ...(config.extraHeaders ?? {}),
  }

  let res: Response
  try {
    res = await fetchVisionWithRetry(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    })
  } catch {
    return err('Network error calling the API')
  }

  const rawText = await res.text()
  if (!res.ok) {
    logger.error('Vision API error', res.status, rawText.slice(0, 500))
    let msg = `API ${res.status}`
    try {
      const j = JSON.parse(rawText) as ChatCompletionResponse
      if (j.error?.message) msg = j.error.message
    } catch {
      /* ignore */
    }
    return err(msg)
  }

  let data: ChatCompletionResponse
  try {
    data = JSON.parse(rawText) as ChatCompletionResponse
  } catch {
    return err('Invalid JSON from API')
  }

  const content = data.choices?.[0]?.message?.content
  if (!content || typeof content !== 'string') {
    return err('Empty model response')
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(content)
  } catch {
    logger.error('Model returned non-JSON content', content.slice(0, 200))
    return err('Model did not return parseable JSON')
  }

  const sections = parseSectionsPayload(parsed)
  if (!sections.ok) return sections

  return ok({ sections: sections.value, rawContent: content })
}

/**
 * Validate top-level JSON shape.
 * 校验顶层的 sections 数组。
 */
function parseSectionsPayload(data: unknown): Result<VisionSectionPayload[], string> {
  if (!data || typeof data !== 'object') return err('Invalid JSON root')
  const root = data as Record<string, unknown>
  const sec = root.sections
  if (!Array.isArray(sec)) return err('Missing sections array')

  const out: VisionSectionPayload[] = []
  for (const item of sec) {
    if (!item || typeof item !== 'object') continue
    const o = item as Record<string, unknown>
    if (typeof o.componentId !== 'string') continue
    const values =
      o.values !== undefined && typeof o.values === 'object' && o.values !== null
        ? (o.values as Record<string, unknown>)
        : undefined
    out.push({ componentId: o.componentId, values })
  }

  if (out.length === 0) return err('No valid sections in model output')
  return ok(out.slice(0, 20))
}
