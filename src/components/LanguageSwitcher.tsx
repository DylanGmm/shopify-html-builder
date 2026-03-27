import { useUiStrings } from '../hooks/useUiStrings'
import type { UiLocale } from '../types/locale'

const SELECT_CLASS =
  'mt-1 w-full rounded-md border border-warm-gray/60 bg-white/40 px-2 py-1 text-[11px] text-ink focus:border-terracotta/50 focus:outline-none'

/**
 * UI language selector (English default, persisted).
 * 界面语言选择（默认英文，可持久化）。
 */
export function LanguageSwitcher() {
  const { t, locale, setLocale } = useUiStrings()

  return (
    <div className="rounded-lg border border-warm-gray/50 bg-white/25 px-3 py-2">
      <label className="chrome-heading block text-[10px]">
        {t('langUi')}
      </label>
      <select
        value={locale}
        onChange={(e) => setLocale(e.target.value as UiLocale)}
        className={SELECT_CLASS}
        aria-label={t('langUi')}
      >
        <option value="en">{t('langEnglish')}</option>
        <option value="zh">{t('langChinese')}</option>
      </select>
    </div>
  )
}
