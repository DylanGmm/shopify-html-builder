import { useRef, useState } from 'react'
import { useUiStrings } from '../hooks/useUiStrings'
import { selectActiveProject, useEditorStore } from '../store/editorStore'
import { DEFAULT_CSS_VARS } from '../utils/renderer'
import { parseProjectJson } from '../services/projectImport'
import { logger } from '../utils/logger'
import type { PlaceholderSource } from '../types'
import { parseThemeStylesheetUrlsInput } from '../utils/themeUrls'

const INPUT_CLASS =
  'w-full rounded-md border border-warm-gray/60 bg-white/40 px-3 py-1.5 text-sm text-ink placeholder:text-ink/35 focus:border-terracotta/50 focus:outline-none'

const THEME_KEYS = Object.keys(DEFAULT_CSS_VARS) as (keyof typeof DEFAULT_CSS_VARS)[]

/**
 * Project-level settings: name, product name, root CSS class, theme variables, persistence.
 */
export function ProjectSettings() {
  const { t } = useUiStrings()
  const project = useEditorStore(selectActiveProject)
  const projects = useEditorStore((s) => s.projects)
  const activeProjectId = useEditorStore((s) => s.activeProjectId)
  const updateProject = useEditorStore((s) => s.updateProject)
  const updateCssVar = useEditorStore((s) => s.updateCssVar)
  const replaceProject = useEditorStore((s) => s.replaceProject)
  const resetActiveProject = useEditorStore((s) => s.resetActiveProject)
  const createBlankProject = useEditorStore((s) => s.createBlankProject)
  const duplicateActiveProject = useEditorStore((s) => s.duplicateActiveProject)
  const switchToProject = useEditorStore((s) => s.switchToProject)
  const deleteProject = useEditorStore((s) => s.deleteProject)
  const copySequenceFromProject = useEditorStore((s) => s.copySequenceFromProject)
  const fileRef = useRef<HTMLInputElement>(null)
  const [templateSourcePick, setTemplateSourcePick] = useState('')

  const projectEntries = Object.entries(projects).sort(([, a], [, b]) =>
    (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' }),
  )

  const siblingEntries = projectEntries.filter(([id]) => id !== activeProjectId)
  const firstSiblingId = siblingEntries[0]?.[0] ?? ''
  const templateSourceId = siblingEntries.some(([id]) => id === templateSourcePick)
    ? templateSourcePick
    : firstSiblingId

  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${(project.name || 'project').replace(/[/\\?%*:|"<>]/g, '-')}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImportClick = () => fileRef.current?.click()

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      const raw = await file.text()
      const result = parseProjectJson(raw)
      if (result.ok) {
        replaceProject(result.value)
      } else {
        logger.error('Project import failed:', result.error)
        window.alert(t('importFailed', { error: result.error }))
      }
    } catch (err) {
      logger.error('Project import read error', err)
      window.alert(t('importReadError'))
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <h2 className="chrome-heading px-1">{t('projectSettings')}</h2>

      <div className="space-y-2 rounded-lg border border-warm-gray/50 bg-white/20 p-3">
        <h3 className="font-serif text-sm text-ink/80">{t('projectSkuLocal')}</h3>
        <p className="text-[10px] leading-snug text-ink/50">{t('projectSkuLocalHint')}</p>
        <ul className="max-h-40 overflow-y-auto space-y-1">
          {projectEntries.map(([id, p]) => (
            <li
              key={id}
              className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-xs ${
                id === activeProjectId
                  ? 'bg-mustard/20 ring-1 ring-terracotta/35'
                  : 'bg-white/30'
              }`}
            >
              <button
                type="button"
                onClick={() => switchToProject(id)}
                disabled={id === activeProjectId}
                className="min-w-0 flex-1 truncate text-left font-medium text-ink hover:text-ink disabled:cursor-default disabled:opacity-100"
                title={p.name}
              >
                {p.name || t('projectUntitled')}
                <span className="ml-1 font-normal text-ink/45">
                  {t('projectSectionsCount', { count: p.sections.length })}
                </span>
              </button>
              {projectEntries.length > 1 && (
                <button
                  type="button"
                  onClick={() => {
                    if (
                      window.confirm(
                        t('projectDeleteConfirm', {
                          name: p.name || t('projectUntitled'),
                        }),
                      )
                    ) {
                      deleteProject(id)
                    }
                  }}
                  className="shrink-0 px-1 font-mono text-[10px] uppercase tracking-wider text-terracotta hover:text-terracotta/80"
                >
                  {t('projectDelete')}
                </button>
              )}
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => createBlankProject()}
            className="min-w-[6rem] flex-1 rounded-lg border border-warm-gray/55 bg-white/20 px-2 py-1.5 text-[11px] font-medium text-ink transition hover:bg-white/40"
          >
            {t('projectNewSku')}
          </button>
          <button
            type="button"
            onClick={() => duplicateActiveProject()}
            className="min-w-[6rem] flex-1 rounded-lg border border-warm-gray/55 bg-white/20 px-2 py-1.5 text-[11px] font-medium text-ink transition hover:bg-white/40"
          >
            {t('projectDuplicateSku')}
          </button>
        </div>

        {siblingEntries.length > 0 && (
          <div className="space-y-2 border-t border-warm-gray/40 pt-2">
            <p className="text-[10px] leading-snug text-ink/50">{t('projectCopySequenceHint')}</p>
            <select
              value={templateSourceId}
              onChange={(e) => setTemplateSourcePick(e.target.value)}
              className="w-full rounded-md border border-warm-gray/60 bg-white/40 px-2 py-1.5 text-xs text-ink"
            >
              {siblingEntries.map(([id, p]) => (
                <option key={id} value={id}>
                  {p.name || t('projectUntitled')}{' '}
                  {t('projectSectionsCount', { count: p.sections.length })}
                </option>
              ))}
            </select>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  if (
                    !templateSourceId ||
                    !window.confirm(t('projectReplaceSequenceConfirm'))
                  ) {
                    return
                  }
                  copySequenceFromProject(templateSourceId, 'replace')
                }}
                className="min-w-[6rem] flex-1 rounded-lg border border-mustard/50 bg-mustard/20 px-2 py-1.5 text-[11px] font-medium text-ink hover:bg-mustard/35"
              >
                {t('projectReplaceSequence')}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!templateSourceId) return
                  copySequenceFromProject(templateSourceId, 'append')
                }}
                className="min-w-[6rem] flex-1 rounded-lg border border-warm-gray/55 bg-white/15 px-2 py-1.5 text-[11px] font-medium text-ink/80 hover:bg-white/30"
              >
                {t('projectAppendSections')}
              </button>
            </div>
          </div>
        )}
      </div>

      <fieldset className="space-y-1">
        <label className="chrome-heading">{t('projectName')}</label>
        <input
          type="text"
          value={project.name}
          onChange={(e) => updateProject({ name: e.target.value })}
          placeholder={t('projectNamePh')}
          className={INPUT_CLASS}
        />
      </fieldset>

      <fieldset className="space-y-1">
        <label className="chrome-heading">{t('projectProductName')}</label>
        <input
          type="text"
          value={project.productName}
          onChange={(e) => updateProject({ productName: e.target.value })}
          placeholder={t('projectProductNamePh')}
          className={INPUT_CLASS}
        />
      </fieldset>

      <fieldset className="space-y-1">
        <label className="chrome-heading">{t('projectRootClass')}</label>
        <input
          type="text"
          value={project.rootClass}
          onChange={(e) => updateProject({ rootClass: e.target.value.replace(/\s/g, '-') })}
          placeholder={t('projectRootClassPh')}
          className={INPUT_CLASS}
        />
      </fieldset>

      <fieldset className="space-y-1">
        <label className="chrome-heading">{t('projectMaxWidth')}</label>
        <select
          value={project.maxContentWidth ?? 1200}
          onChange={(e) => updateProject({ maxContentWidth: Number(e.target.value) })}
          className={INPUT_CLASS}
        >
          <option value={960}>960px</option>
          <option value={1080}>1080px</option>
          <option value={1200}>1200px</option>
          <option value={1440}>1440px</option>
          <option value={1600}>1600px</option>
        </select>
        <p className="text-[10px] leading-snug text-ink/50">{t('projectMaxWidthHint')}</p>
      </fieldset>

      <fieldset className="space-y-1">
        <label className="chrome-heading">{t('projectPlaceholder')}</label>
        <select
          value={project.placeholderSource ?? 'remote'}
          onChange={(e) =>
            updateProject({ placeholderSource: e.target.value as PlaceholderSource })
          }
          className={INPUT_CLASS}
        >
          <option value="remote">{t('projectPlaceholderRemote')}</option>
          <option value="local">{t('projectPlaceholderLocal')}</option>
        </select>
        <p className="text-[10px] leading-snug text-ink/50">{t('projectPlaceholderHint')}</p>
      </fieldset>

      <fieldset className="space-y-1">
        <label className="chrome-heading">{t('projectThemeCss')}</label>
        <textarea
          key={activeProjectId}
          rows={4}
          defaultValue={(project.previewThemeStylesheetUrls ?? []).join('\n')}
          onBlur={(e) =>
            updateProject({
              previewThemeStylesheetUrls: parseThemeStylesheetUrlsInput(e.target.value),
            })
          }
          placeholder={t('projectThemeUrlPh')}
          className={`${INPUT_CLASS} font-mono text-xs min-h-[5rem]`}
        />
        <p className="text-[10px] leading-snug text-ink/50">{t('projectThemeCssHint')}</p>
      </fieldset>

      <div className="space-y-2 rounded-lg border border-warm-gray/50 bg-white/15 p-3">
        <h3 className="font-serif text-sm text-ink/80">{t('projectThemeVars')}</h3>
        <p className="text-[10px] leading-snug text-ink/50">{t('projectThemeVarsHint')}</p>
        {THEME_KEYS.map((key) => (
          <fieldset key={key} className="space-y-0.5">
            <label className="font-mono text-[10px] text-ink/45">{key}</label>
            <input
              type="text"
              value={project.cssVars?.[key] ?? DEFAULT_CSS_VARS[key]}
              onChange={(e) => updateCssVar(key, e.target.value)}
              className={`${INPUT_CLASS} text-xs font-mono`}
            />
          </fieldset>
        ))}
      </div>

      <div className="space-y-2">
        <h3 className="chrome-heading px-1">{t('projectSaveLoad')}</h3>
        <p className="px-1 text-[10px] text-ink/50">{t('projectSaveLoadHint')}</p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleExportJson}
            className="min-w-[7rem] flex-1 rounded-lg border border-warm-gray/55 bg-white/25 px-3 py-1.5 text-xs font-medium text-ink hover:bg-white/40"
          >
            {t('projectExportJson')}
          </button>
          <button
            type="button"
            onClick={handleImportClick}
            className="min-w-[7rem] flex-1 rounded-lg border border-warm-gray/55 bg-white/25 px-3 py-1.5 text-xs font-medium text-ink hover:bg-white/40"
          >
            {t('projectImportJson')}
          </button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={handleFile}
        />
        <button
          type="button"
          onClick={() => {
            if (window.confirm(t('projectClearConfirm'))) {
              resetActiveProject()
            }
          }}
          className="w-full rounded-lg border border-terracotta/40 bg-terracotta/10 px-3 py-1.5 text-xs font-medium text-ink hover:bg-terracotta/18"
        >
          {t('projectClearSku')}
        </button>
      </div>
    </div>
  )
}
