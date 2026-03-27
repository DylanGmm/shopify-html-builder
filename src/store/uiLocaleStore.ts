import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { UiLocale } from '../types/locale'

/**
 * Persisted UI language (browser localStorage). Default English.
 * 界面语言持久化，默认英文。
 */
interface UiLocaleState {
  locale: UiLocale
  setLocale: (locale: UiLocale) => void
}

export const useUiLocaleStore = create<UiLocaleState>()(
  persist(
    (set) => ({
      locale: 'en',
      setLocale: (locale) => set({ locale }),
    }),
    {
      name: 'shopify-html-builder-ui-locale-v1',
      version: 1,
    },
  ),
)
