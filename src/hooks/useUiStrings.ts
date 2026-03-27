import { useCallback, useMemo } from 'react'
import {
  UI_MESSAGES_EN,
  UI_MESSAGES_ZH,
  interpolateUi,
  type UiMessageKey,
} from '../locales/uiMessages'
import { useUiLocaleStore } from '../store/uiLocaleStore'

/**
 * Returns the active locale, setter, and `t(key, vars)` for UI copy.
 * 返回当前语言、`setLocale` 与文案函数 `t`。
 */
export function useUiStrings() {
  const locale = useUiLocaleStore((s) => s.locale)
  const setLocale = useUiLocaleStore((s) => s.setLocale)

  const table = useMemo(() => (locale === 'zh' ? UI_MESSAGES_ZH : UI_MESSAGES_EN), [locale])

  const t = useCallback(
    (key: UiMessageKey, vars?: Record<string, string | number>) => {
      const raw = table[key] ?? UI_MESSAGES_EN[key] ?? String(key)
      return vars ? interpolateUi(raw, vars) : raw
    },
    [table],
  )

  return { t, locale, setLocale }
}
