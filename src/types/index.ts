/**
 * Core domain types for the Shopify HTML Builder.
 * Defines the component registry schema, slot system, and editor state.
 */

/** Supported slot kinds */
export type SlotKind = 'image' | 'text' | 'iconGroup' | 'badge' | 'legend' | 'optionCards'

/** Base slot definition in a component schema */
export interface SlotDef {
  id: string
  kind: SlotKind
  label: string
  required?: boolean
}

export interface ImageSlotDef extends SlotDef {
  kind: 'image'
  defaultAspectRatio?: string
  defaultObjectFit?: 'cover' | 'contain'
  isHero?: boolean
}

export interface TextSlotDef extends SlotDef {
  kind: 'text'
  tag: 'h2' | 'h3' | 'p' | 'span'
  placeholder?: string
  multiline?: boolean
}

export interface IconGroupSlotDef extends SlotDef {
  kind: 'iconGroup'
  maxItems: number
}

export interface BadgeSlotDef extends SlotDef {
  kind: 'badge'
}

export interface LegendSlotDef extends SlotDef {
  kind: 'legend'
}

/** 选项卡行：每卡含徽章文案、主图、标题、副标题 / Option row cards for mounting-style layouts */
export interface OptionCardsSlotDef extends SlotDef {
  kind: 'optionCards'
  maxItems: number
  minItems?: number
}

export type AnySlotDef =
  | ImageSlotDef
  | TextSlotDef
  | IconGroupSlotDef
  | BadgeSlotDef
  | LegendSlotDef
  | OptionCardsSlotDef

/** Runtime slot values filled by the user */
export interface ImageSlotValue {
  src: string
  alt: string
  width: number
  height: number
}

export interface TextSlotValue {
  content: string
}

export interface IconGroupItem {
  iconSrc: string
  iconAlt: string
  label: string
}

export interface IconGroupSlotValue {
  items: IconGroupItem[]
}

export interface BadgeSlotValue {
  iconSrc?: string
  number: string
  label: string
}

export interface LegendDot {
  color: string
  label?: string
}

export interface LegendSlotValue {
  label: string
  dots: LegendDot[]
}

/** 单个选项卡槽位 / One option card (badge + image + titles) */
export interface OptionCardItem {
  badge: string
  image: ImageSlotValue
  title: string
  subtitle: string
}

export interface OptionCardsSlotValue {
  items: OptionCardItem[]
}

export type AnySlotValue =
  | ImageSlotValue
  | TextSlotValue
  | IconGroupSlotValue
  | BadgeSlotValue
  | LegendSlotValue
  | OptionCardsSlotValue

/** Component definition in the registry */
export interface ComponentDef {
  id: string
  name: string
  description: string
  icon: string
  slots: AnySlotDef[]
  /** Handlebars-like template; renderer uses slot IDs */
  renderHtml: (values: Record<string, AnySlotValue>, ctx: RenderContext) => string
  css: string
}

/** Context passed to the renderer */
export interface RenderContext {
  rootClass: string
  sectionIndex: number
  totalSections: number
  placeholderSource: PlaceholderSource
  /**
   * When true, `imgTag` emits placeholder multi-resolution `srcset` + default `sizes` (non-data URLs only).
   * 为 true 时，主图 `imgTag` 输出占位多分辨率 `srcset` 与默认 `sizes`（跳过 data: URL）。
   */
  includeSrcsetInExport: boolean
}

/** A component instance in the user's sequence */
export interface SectionInstance {
  uid: string
  componentId: string
  values: Record<string, AnySlotValue>
  /**
   * Present when `componentId === '__freeform__'` (AI Layout Reproduce).
   * AI 布局还原模式生成的自由排版数据。
   */
  freeform?: import('./freeform').FreeformSectionData
}

/** 占位图来源 / Where empty image slots resolve (placehold.co vs embedded SVG). */
export type PlaceholderSource = 'remote' | 'local'

/** Editor project state */
export interface Project {
  name: string
  rootClass: string
  productName: string
  sections: SectionInstance[]
  cssVars: Record<string, string>
  /** Default `remote` when omitted (placehold.co). */
  placeholderSource?: PlaceholderSource
  /**
   * When true, full-page export / preview include minimal Product JSON-LD in `<head>`.
   * 为 true 时，完整 HTML 与预览在 `<head>` 注入精简 Product JSON-LD（不含 Shopify 片段）。
   */
  includeProductJsonLd?: boolean
  /**
   * When true, exported `<img>` include suggested `srcset` / `sizes` (placeholder filenames; skip `data:` src).
   * 为 true 时，导出 `<img>` 附带建议的 `srcset`/`sizes`（占位文件名；`data:` 地址跳过）。
   */
  includeSrcsetInExport?: boolean
  /**
   * Optional HTTPS stylesheet URLs loaded in preview (and in full HTML export when {@link includeThemeStylesheetUrlsInExport} is true).
   * 预览时加载的主题 CSS URL（可选）；导出整页时仅在对应开关开启时写入 `<link>`。
   */
  previewThemeStylesheetUrls?: string[]
  /**
   * When true, full HTML download/copy includes {@link previewThemeStylesheetUrls} as `<link rel="stylesheet">` in `<head>`.
   * 为 true 时，完整 HTML 下载/复制在 `<head>` 写入主题样式 `<link>`。
   */
  includeThemeStylesheetUrlsInExport?: boolean
  /**
   * Max width of `.ic-wrap` container in px (default 1200).
   * 页面内容最大宽度（影响 `.ic-wrap max-width`）。
   */
  maxContentWidth?: number
}

/** Machine-readable SEO finding code (UI layer maps to localized copy). */
export type SeoIssueCode =
  | 'HEADING_FIRST_H3'
  | 'HEADING_JUMP'
  | 'IMAGE_MISSING_ALT'
  | 'ALT_TOO_SHORT'
  | 'ALT_DUPLICATE'
  | 'ALT_GENERIC'
  | 'ALT_FILENAME'
  | 'ALT_MATCHES_SRC'
  | 'IMAGE_MISSING_DIMS'
  | 'IMAGE_EDGE_TOO_LARGE'

/** Interpolation values for {@link SeoIssueCode} templates */
export interface SeoIssueParams {
  /** Localized or registry slot label */
  label?: string
  prev?: number
  next?: number
  charCount?: number
  alt?: string
  maxPx?: number
}

/** SEO check result */
export interface SeoIssue {
  sectionIndex: number
  /** 文档级检查使用 `__document__` / Use `__document__` for document-wide checks */
  slotId: string
  severity: 'error' | 'warning'
  code: SeoIssueCode
  params: SeoIssueParams
}
