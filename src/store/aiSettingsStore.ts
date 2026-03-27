import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const DEFAULT_BASE = 'https://api.openai.com/v1'
const OPENROUTER_BASE = 'https://openrouter.ai/api/v1'
const DEFAULT_MODEL = 'gpt-4o-mini'
const OPENROUTER_DEFAULT_MODEL = 'openai/gpt-4o-mini'

/**
 * UI preset for API base URL defaults (F-13).
 * 服务商预设，用于快速切换 OpenAI / OpenRouter。
 */
export type AiProviderPreset = 'openai' | 'openrouter' | 'custom'

/**
 * Persisted AI provider settings (browser localStorage).
 * AI 服务商配置（持久化；密钥仅限本地浏览器）。
 */
interface AiSettingsState {
  providerPreset: AiProviderPreset
  apiBaseUrl: string
  apiKey: string
  model: string
  maxImageEdgePx: number
  /** OpenRouter optional ranking headers */
  openrouterHttpReferer: string
  openrouterSiteTitle: string
  /** Send `response_format: { type: 'json_object' }` when supported */
  jsonResponseFormat: boolean

  setProviderPreset: (p: AiProviderPreset) => void
  setApiBaseUrl: (v: string) => void
  setApiKey: (v: string) => void
  setModel: (v: string) => void
  setMaxImageEdgePx: (v: number) => void
  setOpenrouterHttpReferer: (v: string) => void
  setOpenrouterSiteTitle: (v: string) => void
  setJsonResponseFormat: (v: boolean) => void
  reset: () => void
}

const initial = {
  providerPreset: 'openai' as AiProviderPreset,
  apiBaseUrl: DEFAULT_BASE,
  apiKey: '',
  model: DEFAULT_MODEL,
  maxImageEdgePx: 2048,
  openrouterHttpReferer: '',
  openrouterSiteTitle: 'Shopify HTML Builder',
  jsonResponseFormat: true,
}

export const useAiSettingsStore = create<AiSettingsState>()(
  persist(
    (set) => ({
      ...initial,
      setProviderPreset: (preset) =>
        set(() => {
          if (preset === 'openai') {
            return {
              providerPreset: 'openai',
              apiBaseUrl: DEFAULT_BASE,
            }
          }
          if (preset === 'openrouter') {
            return {
              providerPreset: 'openrouter',
              apiBaseUrl: OPENROUTER_BASE,
              model: OPENROUTER_DEFAULT_MODEL,
            }
          }
          return { providerPreset: 'custom' }
        }),
      setApiBaseUrl: (v) => set({ apiBaseUrl: v.trim() || DEFAULT_BASE }),
      setApiKey: (v) => set({ apiKey: v }),
      setModel: (v) => set({ model: v.trim() || DEFAULT_MODEL }),
      setMaxImageEdgePx: (v) =>
        set({
          maxImageEdgePx: Math.max(512, Math.min(4096, Math.round(v) || 2048)),
        }),
      setOpenrouterHttpReferer: (v) => set({ openrouterHttpReferer: v }),
      setOpenrouterSiteTitle: (v) =>
        set({ openrouterSiteTitle: v.trim() || 'Shopify HTML Builder' }),
      setJsonResponseFormat: (v) => set({ jsonResponseFormat: v }),
      reset: () => set({ ...initial }),
    }),
    { name: 'shopify-html-builder-ai-v1' },
  ),
)

export { DEFAULT_BASE, OPENROUTER_BASE, OPENROUTER_DEFAULT_MODEL }
