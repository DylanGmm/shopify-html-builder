/**
 * Vision Layout Reproduce service: sends a product page screenshot to an
 * OpenAI-compatible vision model and receives per-section HTML+CSS that
 * faithfully recreates the layout using scoped `ic-page` patterns and editor constraints.
 * AI 布局还原服务：在作用域样式与编辑器约束下，用视觉模型还原截图中的逐段 HTML+CSS。
 */

import type { AiConnectionConfig, VisionFreeformSectionPayload, VisionLayoutReproduceResult } from '../types/ai'
import { ok, err, type Result } from '../types/result'
import { logger } from '../utils/logger'

const RETRY_DELAY_MS = 800
const RETRYABLE_STATUSES = new Set<number>([429, 502, 503, 504])

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function fetchWithRetry(url: string, init: RequestInit): Promise<Response> {
  let firstRes: Response | undefined
  try {
    firstRes = await fetch(url, init)
  } catch (e) {
    logger.error('Layout reproduce fetch error', e)
    await delay(RETRY_DELAY_MS)
    return fetch(url, init)
  }
  if (firstRes.ok) return firstRes
  if (RETRYABLE_STATUSES.has(firstRes.status)) {
    logger.debug('Layout reproduce retrying after', firstRes.status)
    await delay(RETRY_DELAY_MS)
    return fetch(url, init)
  }
  return firstRes
}

interface ChatCompletionResponse {
  choices?: Array<{ message?: { content?: string | null } }>
  error?: { message?: string }
}

/**
 * Build the system prompt for layout reproduction.
 * Instructs the model to generate scoped HTML+CSS per section.
 */
function buildSystemPrompt(maxWidth: number): string {
  return `You are an expert front-end developer who converts product page screenshots into structured, scoped HTML + CSS sections.

Given a vertical composite screenshot of a product detail page, identify each distinct visual section (hero, features, specs, grids, etc.) from top to bottom and reproduce its layout as HTML + CSS.

You MUST respond with a single JSON object (no markdown fences) following this exact schema:

{
  "sections": [
    {
      "name": "Human-readable section name",
      "htmlTemplate": "<section class=\\"ai-s1\\">...{{IMG:hero_img}}...{{TEXT:title}}...</section>",
      "css": ".{{ROOT}} .ai-s1 { ... } @media (max-width: 768px) { .{{ROOT}} .ai-s1 { ... } }",
      "images": [
        { "tokenId": "hero_img", "width": 1200, "height": 600, "aspectRatio": "2/1", "alt": "descriptive alt text" }
      ],
      "texts": [
        { "tokenId": "title", "tag": "h2", "content": "Extracted heading text" }
      ]
    }
  ],
  "extractedColors": {
    "primary": "#hex",
    "dark": "#hex",
    "gray": "#hex",
    "accent": "#hex",
    "background": "#hex"
  }
}

CRITICAL RULES:

1. CSS SCOPING: Every CSS selector MUST start with \`.{{ROOT}}\` (e.g. \`.{{ROOT}} .ai-s1 { ... }\`). Use unique class prefixes per section (\`ai-s1\`, \`ai-s2\`, etc.) to avoid collisions.

2. IMAGE TOKENS: Use \`{{IMG:tokenId}}\` where images appear. The app will substitute these with \`<img>\` tags. Do NOT write \`<img>\` tags yourself. Each image must have a corresponding entry in the \`images\` array with accurate dimensions and aspect ratio.

3. TEXT TOKENS: Use \`{{TEXT:tokenId}}\` where editable text appears. The app will substitute with escaped text. Each text must have a corresponding entry in the \`texts\` array. Use the correct semantic tag (h2, h3, p, span).

4. LAYOUT FIDELITY: Faithfully reproduce the layout structure using CSS flexbox and grid. Match:
   - EXACT text alignment (left, center, right)
   - Column ratios and gap spacing
   - Font sizes, weights (use 700/800 for bold), letter-spacing, line-height
   - Colors (text, background, borders, gradients)
   - Border radius, padding, margin proportions
   - Image placement and aspect ratios

5. ASPECT RATIOS: Use CSS \`aspect-ratio\` on image containers to lock proportions. Report accurate \`width\`, \`height\`, and \`aspectRatio\` for each image.

6. RESPONSIVE: Include \`@media (max-width: 768px)\` rules in each section's CSS:
   - Stack multi-column layouts vertically
   - Reduce font sizes proportionally
   - Center-align text on mobile
   - Maintain image aspect ratios

7. CSS VARIABLES: Use the inherited CSS variables where appropriate:
   - \`var(--ic-font)\` for font-family
   - \`var(--ic-dark)\` for primary text color
   - \`var(--ic-gray)\` for secondary text
   - \`var(--ic-blue)\`, \`var(--ic-green)\` for brand colors
   - \`var(--ic-grad)\` for gradient text effects
   - \`var(--ic-white)\` for backgrounds

8. CODING STYLE & SPACING:
   - Our base CSS applies \`margin-bottom: 90px;\` to all \`section\` elements. IF sections need to touch seamlessly (e.g. continuous dark background), explicitly set \`margin-bottom: 0;\` on the \`<section>\` element in your CSS to remove the gap.
   - Use \`object-fit: cover\` or \`contain\` on images.
   - Clean, readable CSS with logical grouping.

9. ABSOLUTE POSITIONING & SPECIAL EFFECTS:
   - If text or icons float over an image, use \`position: relative\` on the container and \`position: absolute\` on the floating elements. Use precise % or px values to match the screenshot.
   - If text has a gradient or special glow, reproduce it exactly using CSS \`background: linear-gradient(...); -webkit-background-clip: text; -webkit-text-fill-color: transparent;\` or \`text-shadow\`.

10. EXACT COLORS: Extract and use the EXACT hex colors seen in the screenshot for text, backgrounds, and borders. Do not just fall back to CSS variables if they don't match.

11. TEXT EXTRACTION: Extract ALL visible text from the image accurately. Preserve the original language.

12. MAX CONTENT WIDTH: The container max-width is ${maxWidth}px. Design proportions relative to this width.

13. Return between 1 and 20 sections. Order them top-to-bottom as they appear in the image.

14. Do NOT include \`<style>\` tags in htmlTemplate. CSS goes in the \`css\` field only.`
}

/**
 * Call the vision model with the Layout Reproduce prompt.
 * 调用视觉模型进行布局还原。
 */
export async function requestVisionLayoutReproduce(
  config: AiConnectionConfig,
  imageDataUrl: string,
  productName: string,
  maxWidth: number,
): Promise<Result<VisionLayoutReproduceResult, string>> {
  const base = config.apiBaseUrl.replace(/\/$/, '')
  const url = `${base}/chat/completions`

  const userText = productName.trim()
    ? `Product: "${productName.trim()}". Analyse the screenshot and reproduce each section as HTML+CSS. Output JSON only.`
    : 'Analyse the screenshot and reproduce each section as HTML+CSS. Output JSON only.'

  const useJsonFormat = config.jsonResponseFormat !== false
  const body: Record<string, unknown> = {
    model: config.model,
    temperature: 0.15,
    max_tokens: 16000,
    messages: [
      { role: 'system' as const, content: buildSystemPrompt(maxWidth) },
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
    res = await fetchWithRetry(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    })
  } catch {
    return err('Network error calling the API')
  }

  const rawText = await res.text()
  if (!res.ok) {
    logger.error('Layout reproduce API error', res.status, rawText.slice(0, 500))
    let msg = `API ${res.status}`
    try {
      const j = JSON.parse(rawText) as ChatCompletionResponse
      if (j.error?.message) msg = j.error.message
    } catch { /* ignore */ }
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
    logger.error('Model returned non-JSON content', content.slice(0, 300))
    return err('Model did not return parseable JSON')
  }

  return parseLayoutReproduceResponse(parsed, content)
}

/**
 * Validate and parse the model's Layout Reproduce response.
 * 校验并解析布局还原响应。
 */
function parseLayoutReproduceResponse(
  data: unknown,
  rawContent: string,
): Result<VisionLayoutReproduceResult, string> {
  if (!data || typeof data !== 'object') return err('Invalid JSON root')
  const root = data as Record<string, unknown>
  const sec = root.sections
  if (!Array.isArray(sec)) return err('Missing sections array')

  const sections: VisionFreeformSectionPayload[] = []

  for (const item of sec) {
    if (!item || typeof item !== 'object') continue
    const o = item as Record<string, unknown>

    const name = typeof o.name === 'string' ? o.name : `Section ${sections.length + 1}`
    const htmlTemplate = typeof o.htmlTemplate === 'string' ? o.htmlTemplate : ''
    const css = typeof o.css === 'string' ? o.css : ''

    if (!htmlTemplate.trim()) continue

    const images: VisionFreeformSectionPayload['images'] = []
    if (Array.isArray(o.images)) {
      for (const img of o.images) {
        if (!img || typeof img !== 'object') continue
        const im = img as Record<string, unknown>
        images.push({
          tokenId: typeof im.tokenId === 'string' ? im.tokenId : `img_${images.length}`,
          width: typeof im.width === 'number' && im.width > 0 ? Math.round(im.width) : 1200,
          height: typeof im.height === 'number' && im.height > 0 ? Math.round(im.height) : 800,
          aspectRatio: typeof im.aspectRatio === 'string' ? im.aspectRatio : '3/2',
          alt: typeof im.alt === 'string' ? im.alt : '',
        })
      }
    }

    const texts: VisionFreeformSectionPayload['texts'] = []
    if (Array.isArray(o.texts)) {
      for (const txt of o.texts) {
        if (!txt || typeof txt !== 'object') continue
        const tx = txt as Record<string, unknown>
        const tag = typeof tx.tag === 'string' && ['h2', 'h3', 'p', 'span'].includes(tx.tag)
          ? (tx.tag as 'h2' | 'h3' | 'p' | 'span')
          : 'p'
        texts.push({
          tokenId: typeof tx.tokenId === 'string' ? tx.tokenId : `text_${texts.length}`,
          tag,
          content: typeof tx.content === 'string' ? tx.content : '',
        })
      }
    }

    sections.push({ name, htmlTemplate, css, images, texts })
  }

  if (sections.length === 0) return err('No valid sections in model output')

  const colors = root.extractedColors as VisionLayoutReproduceResult['extractedColors'] | undefined

  return ok({
    sections: sections.slice(0, 20),
    extractedColors: colors && typeof colors === 'object' ? {
      primary: typeof colors.primary === 'string' ? colors.primary : undefined,
      dark: typeof colors.dark === 'string' ? colors.dark : undefined,
      gray: typeof colors.gray === 'string' ? colors.gray : undefined,
      accent: typeof colors.accent === 'string' ? colors.accent : undefined,
      background: typeof colors.background === 'string' ? colors.background : undefined,
    } : undefined,
    rawContent,
  })
}
