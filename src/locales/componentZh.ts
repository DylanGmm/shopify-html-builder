import type { UiLocale } from '../types/locale'

/**
 * Chinese display names for registered components (app UI only).
 * 组件中文名称（仅编辑器界面）。
 */
export const COMPONENT_ZH: Record<
  string,
  {
    name: string
    description: string
  }
> = {
  'ic-header': {
    name: '页头',
    description: '左右分栏：左侧商品图，右侧型号与规格图标',
  },
  'ic-hero': {
    name: '主视觉横幅',
    description: '大标题、副标题与宽屏主图，可选水印文字',
  },
  'ic-grid-mixed': {
    name: '混合图片网格',
    description: '上方通栏大图 + 下方两列小图',
  },
  'ic-split-left': {
    name: '左文右图',
    description: '左侧文案与徽章，右侧功能图',
  },
  'ic-split-right': {
    name: '左图右文',
    description: '左侧大图，右侧标题与说明',
  },
  'ic-grid-3col': {
    name: '三列卡片',
    description: '标题与三列图文卡片',
  },
  'ic-center-copy': {
    name: '居中文案区',
    description: '居中标题、高亮段落、正文与宽图，可选图例',
  },
  'ic-options-row': {
    name: '选项卡横排',
    description: '横向排列的选项卡片（如安装方式）',
  },
  'ic-blueprint': {
    name: '蓝图网格',
    description: '两张技术图 + 一张宽图与叠加说明',
  },
}

/**
 * Chinese slot labels keyed by component id then slot id.
 * 槽位中文标签：组件 id → 槽位 id → 文案。
 */
export const SLOT_LABELS_ZH: Record<string, Record<string, string>> = {
  'ic-header': {
    image: '商品主图',
    model: '型号 / 品牌',
    productTitle: '商品标题',
    specs: '规格图标',
  },
  'ic-hero': {
    title: '标题',
    subtitle: '副标题',
    image: '主视觉图',
    watermark: '水印文字（可选）',
  },
  'ic-grid-mixed': {
    title: '区块标题',
    subtitle: '副标题',
    imgTop: '顶部通栏图',
    imgLeft: '左下图',
    imgRight: '右下图',
  },
  'ic-split-left': {
    title: '标题',
    bullet: '要点',
    body: '正文',
    badge: '徽章（可选）',
    image: '功能配图',
    footnote: '脚注（可选）',
  },
  'ic-split-right': {
    image: '功能配图',
    title: '标题',
    subtitle: '副标题',
    caption: '说明文字',
  },
  'ic-grid-3col': {
    title: '区块标题',
    desc: '区块描述',
    img1: '卡片 1 图片',
    cap1: '卡片 1 说明',
    img2: '卡片 2 图片',
    cap2: '卡片 2 说明',
    img3: '卡片 3 图片',
    cap3: '卡片 3 说明',
  },
  'ic-center-copy': {
    title: '标题',
    highlight: '高亮文案',
    body: '正文',
    image: '区块配图',
    legend: '图例（可选）',
  },
  'ic-options-row': {
    title: '区块标题',
    cards: '选项卡片',
  },
  'ic-blueprint': {
    title: '区块标题（可选）',
    imgA: '图纸 A',
    imgB: '图纸 B',
    imgWide: '宽屏示意图',
    overlay: '叠加说明',
  },
}

/**
 * Resolve slot label for the active UI locale.
 * 按界面语言解析槽位标签。
 */
export function resolveSlotLabel(
  locale: UiLocale,
  componentId: string,
  slotId: string,
  fallbackEn: string,
): string {
  if (locale === 'en') return fallbackEn
  return SLOT_LABELS_ZH[componentId]?.[slotId] ?? fallbackEn
}

/**
 * Resolve component title / description for the app catalogue.
 * 解析组件在目录中的名称与描述。
 */
export function localizedComponentName(
  locale: UiLocale,
  componentId: string,
  fallbackEn: string,
): string {
  if (locale === 'en') return fallbackEn
  return COMPONENT_ZH[componentId]?.name ?? fallbackEn
}

/**
 * Localized component description for the app catalogue.
 * 组件描述（界面语言）。
 */
export function localizedComponentDescription(
  locale: UiLocale,
  componentId: string,
  fallbackEn: string,
): string {
  if (locale === 'en') return fallbackEn
  return COMPONENT_ZH[componentId]?.description ?? fallbackEn
}
