/**
 * Freeform section types for AI Layout Reproduce mode.
 * AI 布局还原模式下的自由排版区块类型。
 */

/** Semantic tag for freeform text references */
export type FreeformTextTag = 'h2' | 'h3' | 'p' | 'span'

/**
 * Image reference within a freeform section HTML template.
 * Tokens in HTML: `{{IMG:tokenId}}` are substituted at render time.
 */
export interface FreeformImageRef {
  /** Unique token identifier used in `{{IMG:tokenId}}` */
  tokenId: string
  width: number
  height: number
  /** CSS aspect-ratio value, e.g. '16/9' */
  aspectRatio: string
  alt: string
  /** Empty string = placeholder; user fills with real URL later */
  src: string
}

/**
 * Editable text reference within a freeform section HTML template.
 * Tokens in HTML: `{{TEXT:tokenId}}` are substituted at render time.
 */
export interface FreeformTextRef {
  /** Unique token identifier used in `{{TEXT:tokenId}}` */
  tokenId: string
  tag: FreeformTextTag
  content: string
}

/**
 * Complete data for one AI-generated freeform section.
 * Stored on `SectionInstance.freeform` when `componentId === '__freeform__'`.
 */
export interface FreeformSectionData {
  /** Display name for the section in the editor */
  name: string
  /** HTML body with `{{IMG:tokenId}}` and `{{TEXT:tokenId}}` placeholder tokens */
  htmlTemplate: string
  /** Scoped CSS with `{{ROOT}}` prefix, including responsive `@media` rules */
  css: string
  images: FreeformImageRef[]
  texts: FreeformTextRef[]
}

/**
 * Color palette extracted from the source image by the vision model.
 * Applied as CSS variable overrides when creating the project.
 */
export interface ExtractedColorPalette {
  primary?: string
  dark?: string
  gray?: string
  accent?: string
  background?: string
}

/** Sentinel componentId for freeform sections (not in the component registry). */
export const FREEFORM_COMPONENT_ID = '__freeform__'
