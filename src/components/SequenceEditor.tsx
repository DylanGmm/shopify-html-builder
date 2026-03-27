import { localizedComponentName } from '../locales/componentZh'
import { getComponent } from '../registry'
import { useEditorStore } from '../store/editorStore'
import { useUiStrings } from '../hooks/useUiStrings'
import { FREEFORM_COMPONENT_ID } from '../types/freeform'
import { ComponentTypeBadge } from './ComponentTypeBadge'
import { IconChevronDown, IconChevronUp, IconDocumentStack, IconDuplicate, IconX } from './EditorialIcons'

/**
 * Ordered list of section instances in the user's sequence.
 * Supports select, reorder (up/down buttons), duplicate, and remove.
 */
export function SequenceEditor() {
  const { t, locale } = useUiStrings()
  const sections = useEditorStore((s) => s.projects[s.activeProjectId]?.sections ?? [])
  const selectedUid = useEditorStore((s) => s.selectedUid)
  const selectSection = useEditorStore((s) => s.selectSection)
  const removeSection = useEditorStore((s) => s.removeSection)
  const moveSection = useEditorStore((s) => s.moveSection)
  const duplicateSection = useEditorStore((s) => s.duplicateSection)

  if (sections.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-14 text-ink/50">
        <IconDocumentStack className="mb-3 text-ink/35" />
        <p className="text-sm font-medium text-ink/70">{t('sequenceEmptyTitle')}</p>
        <p className="mt-1 text-center font-mono text-[10px] uppercase tracking-wider text-ink/40">
          {t('sequenceEmptySub')}
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1.5">
      <h2 className="chrome-heading mb-1 px-1">{t('sectionsTitle', { count: sections.length })}</h2>
      {sections.map((section, idx) => {
        const isFreeform = section.componentId === FREEFORM_COMPONENT_ID
        const comp = isFreeform ? null : getComponent(section.componentId)
        const isSelected = section.uid === selectedUid
        const label = isFreeform
          ? section.freeform?.name || 'Freeform'
          : comp
            ? localizedComponentName(locale, comp.id, comp.name)
            : section.componentId

        return (
          <div
            key={section.uid}
            role="button"
            tabIndex={0}
            onClick={() => selectSection(section.uid)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                selectSection(section.uid)
              }
            }}
            className={`group flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 transition-colors ${
              isSelected
                ? 'border-terracotta/60 bg-terracotta/10'
                : 'border-warm-gray/50 bg-white/20 hover:border-warm-gray/80 hover:bg-white/35'
            }`}
          >
            <span className="w-5 shrink-0 text-right font-mono text-[10px] text-ink/40">{idx + 1}</span>
            {isFreeform ? <ComponentTypeBadge code="FF" /> : comp ? <ComponentTypeBadge code={comp.icon} /> : null}
            <span className="flex-1 truncate text-sm text-ink/90">{label}</span>

            <div className="flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  if (idx > 0) moveSection(idx, idx - 1)
                }}
                disabled={idx === 0}
                className="rounded p-1 text-ink/45 hover:bg-ink/5 hover:text-ink disabled:cursor-not-allowed disabled:opacity-25"
                title={t('moveUp')}
              >
                <IconChevronUp className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  if (idx < sections.length - 1) moveSection(idx, idx + 1)
                }}
                disabled={idx === sections.length - 1}
                className="rounded p-1 text-ink/45 hover:bg-ink/5 hover:text-ink disabled:cursor-not-allowed disabled:opacity-25"
                title={t('moveDown')}
              >
                <IconChevronDown className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  duplicateSection(section.uid)
                }}
                className="rounded p-1 text-ink/45 hover:bg-ink/5 hover:text-ink"
                title={t('duplicate')}
              >
                <IconDuplicate className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  removeSection(section.uid)
                }}
                className="rounded p-1 text-ink/45 hover:bg-terracotta/15 hover:text-terracotta"
                title={t('remove')}
              >
                <IconX className="h-4 w-4" />
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
