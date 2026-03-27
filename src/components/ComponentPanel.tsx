import {
  localizedComponentDescription,
  localizedComponentName,
} from '../locales/componentZh'
import { getAllComponents } from '../registry'
import { useEditorStore } from '../store/editorStore'
import { useUiStrings } from '../hooks/useUiStrings'
import { ComponentTypeBadge } from './ComponentTypeBadge'

/**
 * Browsable catalogue of available section components.
 * User clicks to add a component to the sequence.
 */
export function ComponentPanel() {
  const { t, locale } = useUiStrings()
  const addSection = useEditorStore((s) => s.addSection)
  const components = getAllComponents()

  return (
    <div className="flex flex-col gap-2">
      <h2 className="chrome-heading mb-1 px-1">{t('components')}</h2>
      {components.map((comp) => (
        <button
          key={comp.id}
          type="button"
          onClick={() => addSection(comp.id)}
          className="chrome-interactive flex items-start gap-3 rounded-lg border border-warm-gray/50 bg-white/25 px-3 py-2.5 text-left hover:border-terracotta/50 hover:bg-white/45"
        >
          <ComponentTypeBadge code={comp.icon} />
          <div className="min-w-0">
            <div className="text-sm font-medium text-ink">{localizedComponentName(locale, comp.id, comp.name)}</div>
            <div className="mt-0.5 text-xs leading-snug text-ink/50">
              {localizedComponentDescription(locale, comp.id, comp.description)}
            </div>
          </div>
        </button>
      ))}
    </div>
  )
}
