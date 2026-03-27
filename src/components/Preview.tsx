import { useRef, useEffect, useMemo } from 'react'
import { useUiStrings } from '../hooks/useUiStrings'
import { selectActiveProject, useEditorStore } from '../store/editorStore'
import { renderStandaloneDocument } from '../utils/renderer'
import { IconFrameEmpty } from './EditorialIcons'

/**
 * Live preview: renders the assembled HTML inside an iframe for true style isolation.
 * Updates on every project state change.
 */
export function Preview() {
  const { t } = useUiStrings()
  const project = useEditorStore(selectActiveProject)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const fullDoc = useMemo(
    () => renderStandaloneDocument(project, { mode: 'preview' }),
    [project],
  )

  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe) return

    const doc = iframe.contentDocument
    if (!doc) return
    doc.open()
    doc.write(fullDoc)
    doc.close()
  }, [fullDoc])

  if (project.sections.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-ink/45">
        <IconFrameEmpty className="mb-3 text-ink/30" />
        <p className="text-sm font-medium text-ink/70">{t('previewEmptyTitle')}</p>
        <p className="mt-1 text-center font-mono text-[10px] uppercase tracking-wider text-ink/40">
          {t('previewEmptySub')}
        </p>
      </div>
    )
  }

  return (
    <iframe
      ref={iframeRef}
      title={t('previewIframeTitle')}
      className="h-full w-full rounded-lg border border-warm-gray/40 bg-paper shadow-sm"
      sandbox="allow-same-origin"
    />
  )
}
