/**
 * AI / Vision assist types (M2).
 * AI 视觉辅助相关类型。
 */

/** User-configurable connection (OpenAI-compatible servers). */
export interface AiConnectionConfig {
  /** Base URL with /v1 suffix, e.g. https://api.openai.com/v1 */
  apiBaseUrl: string
  apiKey: string
  model: string
  /** Max longest edge when resizing before API (px) */
  maxImageEdgePx: number
  /**
   * Extra fetch headers (OpenRouter: `HTTP-Referer`, `X-Title`).
   * 额外请求头（如 OpenRouter 排名用的 Referer / Title）。
   */
  extraHeaders?: Record<string, string>
  /**
   * When false, skip `response_format: json_object` for models that reject it.
   * 为 false 时不发送 json_object 模式（兼容旧模型）。
   */
  jsonResponseFormat?: boolean
}

/** One section as returned by the vision model (before merge with defaults). */
export interface VisionSectionPayload {
  componentId: string
  /**
   * Partial slot values keyed by slot id.
   * 图像槽可为 `{ alt, width?, height? }`；文本槽可为 string 或 `{ content }`。
   */
  values?: Record<string, unknown>
}

/** Parsed response from vision suggestion service. */
export interface VisionSuggestResult {
  sections: VisionSectionPayload[]
  /** Optional raw assistant message for debugging */
  rawContent?: string
}

/** One freeform section as returned by the Layout Reproduce vision model. */
export interface VisionFreeformSectionPayload {
  name: string
  htmlTemplate: string
  css: string
  images: Array<{
    tokenId: string
    width: number
    height: number
    aspectRatio: string
    alt: string
  }>
  texts: Array<{
    tokenId: string
    tag: 'h2' | 'h3' | 'p' | 'span'
    content: string
  }>
}

/** Full response from Layout Reproduce vision service. */
export interface VisionLayoutReproduceResult {
  sections: VisionFreeformSectionPayload[]
  extractedColors?: {
    primary?: string
    dark?: string
    gray?: string
    accent?: string
    background?: string
  }
  rawContent?: string
}
