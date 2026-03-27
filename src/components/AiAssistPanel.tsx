import { useCallback, useMemo, useState } from 'react'
import { nanoid } from 'nanoid'
import { useUiStrings } from '../hooks/useUiStrings'
import { getActiveProject, selectActiveProject, useEditorStore } from '../store/editorStore'
import { useAiSettingsStore, type AiProviderPreset } from '../store/aiSettingsStore'
import { requestVisionTemplateSuggestion } from '../services/visionSuggest'
import { requestVisionLayoutReproduce } from '../services/visionLayoutReproduce'
import { compressImageToJpegDataUrl } from '../utils/imageCompress'
import { filterKnownComponentPayloads, visionPayloadsToSections } from '../utils/applyVisionPayload'
import { FREEFORM_COMPONENT_ID } from '../types/freeform'
import type { FreeformSectionData } from '../types/freeform'
import { logger } from '../utils/logger'
import type { AiConnectionConfig } from '../types/ai'
import type { SectionInstance } from '../types'

type UiPhase = 'idle' | 'compressing' | 'requesting' | 'ready' | 'error'
type AiMode = 'template' | 'reproduce'

const MAX_WIDTH_OPTIONS = [960, 1080, 1200, 1440, 1600] as const

/**
 * Rough UI-only heuristics for a vision data URL (prefix + base64).
 * Not suitable for billing or exact byte counts.
 */
function estimateVisionDataUrlPayloadK(dataUrl: string): {
  imageBytesK: number
  tokensK: number
} {
  const imageBytesK = Math.ceil((dataUrl.length * 3) / 4 / 1000)
  const tokensK = Math.ceil(dataUrl.length / 4 / 1000)
  return { imageBytesK, tokensK }
}

/**
 * AI assist: long-image upload -> vision template suggestion OR layout reproduce.
 * AI 辅助：长图上传 -> 模板建议 或 布局还原。
 */
export function AiAssistPanel() {
  const { t } = useUiStrings()
  const replaceProject = useEditorStore((s) => s.replaceProject)
  const updateProject = useEditorStore((s) => s.updateProject)
  const productName = useEditorStore((s) => selectActiveProject(s).productName)
  const projectMaxWidth = useEditorStore((s) => selectActiveProject(s).maxContentWidth ?? 1200)

  const providerPreset = useAiSettingsStore((s) => s.providerPreset)
  const apiBaseUrl = useAiSettingsStore((s) => s.apiBaseUrl)
  const apiKey = useAiSettingsStore((s) => s.apiKey)
  const model = useAiSettingsStore((s) => s.model)
  const maxImageEdgePx = useAiSettingsStore((s) => s.maxImageEdgePx)
  const openrouterHttpReferer = useAiSettingsStore((s) => s.openrouterHttpReferer)
  const openrouterSiteTitle = useAiSettingsStore((s) => s.openrouterSiteTitle)
  const jsonResponseFormat = useAiSettingsStore((s) => s.jsonResponseFormat)
  const setProviderPreset = useAiSettingsStore((s) => s.setProviderPreset)
  const setApiBaseUrl = useAiSettingsStore((s) => s.setApiBaseUrl)
  const setApiKey = useAiSettingsStore((s) => s.setApiKey)
  const setModel = useAiSettingsStore((s) => s.setModel)
  const setMaxImageEdgePx = useAiSettingsStore((s) => s.setMaxImageEdgePx)
  const setOpenrouterHttpReferer = useAiSettingsStore((s) => s.setOpenrouterHttpReferer)
  const setOpenrouterSiteTitle = useAiSettingsStore((s) => s.setOpenrouterSiteTitle)
  const setJsonResponseFormat = useAiSettingsStore((s) => s.setJsonResponseFormat)

  const extraHeaders = useMemo(() => {
    const ex: Record<string, string> = {}
    const ref = openrouterHttpReferer.trim()
    const title = openrouterSiteTitle.trim()
    if (ref) ex['HTTP-Referer'] = ref
    if (title) ex['X-Title'] = title
    return Object.keys(ex).length ? ex : undefined
  }, [openrouterHttpReferer, openrouterSiteTitle])

  const [showSettings, setShowSettings] = useState(false)
  const [aiMode, setAiMode] = useState<AiMode>('reproduce')
  const [phase, setPhase] = useState<UiPhase>('idle')
  const [message, setMessage] = useState<string>('')
  const [pendingFileName, setPendingFileName] = useState<string | null>(null)
  const [pendingSections, setPendingSections] = useState<SectionInstance[] | null>(null)
  const [payloadEstimate, setPayloadEstimate] = useState<{
    imageBytesK: number
    tokensK: number
  } | null>(null)

  const buildConnection = useCallback((): AiConnectionConfig => ({
    apiBaseUrl,
    apiKey: apiKey.trim(),
    model: model.trim(),
    maxImageEdgePx,
    extraHeaders,
    jsonResponseFormat,
  }), [apiBaseUrl, apiKey, extraHeaders, jsonResponseFormat, maxImageEdgePx, model])

  const runTemplateSuggestion = useCallback(
    async (file: File) => {
      setPendingSections(null)
      setPayloadEstimate(null)
      if (!apiKey.trim()) {
        setPhase('error')
        setMessage(t('aiErrNoKey'))
        return
      }

      setPhase('compressing')
      setMessage(t('aiBusyCompress'))
      const compressed = await compressImageToJpegDataUrl(file, maxImageEdgePx)
      if (!compressed.ok) {
        setPhase('error')
        setMessage(compressed.error)
        return
      }

      setPayloadEstimate(estimateVisionDataUrlPayloadK(compressed.value.dataUrl))
      setPhase('requesting')
      setMessage(t('aiBusyRequest'))

      const result = await requestVisionTemplateSuggestion(
        buildConnection(),
        compressed.value.dataUrl,
        productName,
      )

      if (!result.ok) {
        setPhase('error')
        setMessage(result.error)
        setPayloadEstimate(null)
        logger.error('Vision suggestion failed', result.error)
        return
      }

      const known = filterKnownComponentPayloads(result.value.sections)
      if (known.length === 0) {
        setPhase('error')
        setMessage(t('aiErrNoKnown'))
        setPayloadEstimate(null)
        return
      }

      const sections = visionPayloadsToSections(known)
      setPendingSections(sections)
      setPayloadEstimate(null)
      setPhase('ready')
      setMessage(
        known.length < result.value.sections.length
          ? t('aiReadySkipped', {
              known: known.length,
              skipped: result.value.sections.length - known.length,
            })
          : t('aiReadyAll', { count: sections.length }),
      )
      logger.debug('Vision suggestion received', { count: sections.length })
    },
    [apiKey, buildConnection, maxImageEdgePx, productName, t],
  )

  const runLayoutReproduce = useCallback(
    async (file: File) => {
      setPendingSections(null)
      setPayloadEstimate(null)
      if (!apiKey.trim()) {
        setPhase('error')
        setMessage(t('aiErrNoKey'))
        return
      }

      setPhase('compressing')
      setMessage(t('aiBusyCompress'))
      const compressed = await compressImageToJpegDataUrl(file, maxImageEdgePx)
      if (!compressed.ok) {
        setPhase('error')
        setMessage(compressed.error)
        return
      }

      setPayloadEstimate(estimateVisionDataUrlPayloadK(compressed.value.dataUrl))
      setPhase('requesting')
      setMessage(t('aiBusyReproducing'))

      const result = await requestVisionLayoutReproduce(
        buildConnection(),
        compressed.value.dataUrl,
        productName,
        projectMaxWidth,
      )

      if (!result.ok) {
        setPhase('error')
        setMessage(result.error)
        setPayloadEstimate(null)
        logger.error('Layout reproduce failed', result.error)
        return
      }

      if (result.value.sections.length === 0) {
        setPhase('error')
        setMessage(t('aiReproduceNone'))
        setPayloadEstimate(null)
        return
      }

      const sections: SectionInstance[] = result.value.sections.map((s) => {
        const freeform: FreeformSectionData = {
          name: s.name,
          htmlTemplate: s.htmlTemplate,
          css: s.css,
          images: s.images.map((img) => ({ ...img, src: '' })),
          texts: s.texts.map((txt) => ({ ...txt })),
        }
        return {
          uid: nanoid(8),
          componentId: FREEFORM_COMPONENT_ID,
          values: {},
          freeform,
        }
      })

      if (result.value.extractedColors) {
        const c = result.value.extractedColors
        const patch: Record<string, string> = {}
        if (c.primary) patch['--ic-blue'] = c.primary
        if (c.dark) patch['--ic-dark'] = c.dark
        if (c.gray) patch['--ic-gray'] = c.gray
        if (c.accent) patch['--ic-green'] = c.accent
        if (c.background) patch['--ic-white'] = c.background
        const latest = getActiveProject(useEditorStore.getState())
        const mergedVars = { ...latest.cssVars, ...patch }
        updateProject({ ...latest, cssVars: mergedVars } as never)
      }

      setPendingSections(sections)
      setPayloadEstimate(null)
      setPhase('ready')
      setMessage(t('aiReproduceReady', { count: sections.length }))
      logger.debug('Layout reproduce received', { count: sections.length })
    },
    [apiKey, buildConnection, maxImageEdgePx, productName, projectMaxWidth, t, updateProject],
  )

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f || !f.type.startsWith('image/')) {
      setPhase('error')
      setMessage(t('aiChooseImage'))
      return
    }
    setPendingFileName(f.name)
    setPendingSections(null)
    setPayloadEstimate(null)
    if (aiMode === 'reproduce') {
      void runLayoutReproduce(f)
    } else {
      void runTemplateSuggestion(f)
    }
  }

  const applyPending = () => {
    if (!pendingSections?.length) return
    const latest = getActiveProject(useEditorStore.getState())
    replaceProject({
      ...latest,
      sections: pendingSections,
    })
    setPendingSections(null)
    setPayloadEstimate(null)
    setPhase('idle')
    setMessage(t('aiSequenceUpdated'))
  }

  const discardPending = () => {
    setPendingSections(null)
    setPayloadEstimate(null)
    setPhase('idle')
    setMessage('')
  }

  const busy = phase === 'compressing' || phase === 'requesting'

  const CHROME_INPUT =
    'w-full rounded-md border border-warm-gray/60 bg-white/40 px-2 py-1 text-[11px] text-ink placeholder:text-ink/35 focus:border-terracotta/50 focus:outline-none'

  return (
    <div className="space-y-3 rounded-lg border border-terracotta/30 bg-white/20 p-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="chrome-heading">{t('aiAssistTitle')}</h2>
          <p className="mt-0.5 text-[10px] leading-snug text-ink/50">{t('aiAssistHint')}</p>
        </div>
        <button
          type="button"
          onClick={() => setShowSettings(!showSettings)}
          className="shrink-0 font-mono text-[10px] uppercase tracking-wider text-terracotta hover:text-terracotta/80"
        >
          {showSettings ? t('aiSettingsHide') : t('aiSettingsShowApi')} {t('aiSettingsSuffix')}
        </button>
      </div>

      {/* Mode toggle */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-ink/50">{t('aiModeLabel')}</span>
        <div className="flex overflow-hidden rounded-md border border-warm-gray/60 text-[10px]">
          <button
            type="button"
            onClick={() => setAiMode('template')}
            className={`px-2 py-1 transition ${
              aiMode === 'template'
                ? 'bg-ink text-mustard'
                : 'bg-white/25 text-ink/55 hover:bg-white/40'
            }`}
          >
            {t('aiModeTemplateSuggest')}
          </button>
          <button
            type="button"
            onClick={() => setAiMode('reproduce')}
            className={`px-2 py-1 transition ${
              aiMode === 'reproduce'
                ? 'bg-ink text-mustard'
                : 'bg-white/25 text-ink/55 hover:bg-white/40'
            }`}
          >
            {t('aiModeLayoutReproduce')}
          </button>
        </div>
      </div>

      {/* Max width selector (shown in reproduce mode) */}
      {aiMode === 'reproduce' && (
        <label className="flex items-center gap-2">
          <span className="shrink-0 text-[10px] text-ink/50">{t('aiMaxWidthLabel')}</span>
          <select
            value={projectMaxWidth}
            onChange={(e) => updateProject({ maxContentWidth: Number(e.target.value) })}
            className={`${CHROME_INPUT} flex-1`}
          >
            {MAX_WIDTH_OPTIONS.map((w) => (
              <option key={w} value={w}>{w}px</option>
            ))}
          </select>
        </label>
      )}

      {showSettings && (
        <div className="space-y-2 text-xs">
          <label className="block space-y-0.5">
            <span className="text-ink/50">{t('aiProvider')}</span>
            <select
              value={providerPreset}
              onChange={(e) => setProviderPreset(e.target.value as AiProviderPreset)}
              className={CHROME_INPUT}
            >
              <option value="openai">OpenAI</option>
              <option value="openrouter">OpenRouter</option>
              <option value="custom">Custom base URL</option>
            </select>
          </label>
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={jsonResponseFormat}
              onChange={(e) => setJsonResponseFormat(e.target.checked)}
              className="rounded border-warm-gray/70 text-terracotta focus:ring-terracotta/30"
            />
            <span className="text-ink/50">{t('aiJsonMode')}</span>
          </label>
          <label className="block space-y-0.5">
            <span className="text-ink/50">{t('aiBaseUrl')}</span>
            <input
              value={apiBaseUrl}
              onChange={(e) => {
                setApiBaseUrl(e.target.value)
                setProviderPreset('custom')
              }}
              className={CHROME_INPUT}
              autoComplete="off"
            />
          </label>
          <label className="block space-y-0.5">
            <span className="text-ink/50">{t('aiApiKey')}</span>
            <input
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              type="password"
              className={CHROME_INPUT}
              autoComplete="off"
            />
          </label>
          <label className="block space-y-0.5">
            <span className="text-ink/50">{t('aiModel')}</span>
            <input
              value={model}
              onChange={(e) => {
                setModel(e.target.value)
                setProviderPreset('custom')
              }}
              className={CHROME_INPUT}
              autoComplete="off"
            />
          </label>
          <div className="space-y-1 rounded border border-warm-gray/50 bg-white/25 p-2">
            <p className="text-[10px] text-ink/50">{t('aiOpenrouterHint')}</p>
            <input
              value={openrouterHttpReferer}
              onChange={(e) => setOpenrouterHttpReferer(e.target.value)}
              placeholder={t('aiOpenrouterRefererPh')}
              className={CHROME_INPUT}
              autoComplete="off"
            />
            <input
              value={openrouterSiteTitle}
              onChange={(e) => setOpenrouterSiteTitle(e.target.value)}
              placeholder={t('aiOpenrouterTitlePh')}
              className={CHROME_INPUT}
              autoComplete="off"
            />
          </div>
          <label className="block space-y-0.5">
            <span className="text-ink/50">{t('aiMaxEdge')}</span>
            <input
              type="number"
              min={512}
              max={4096}
              value={maxImageEdgePx}
              onChange={(e) => setMaxImageEdgePx(Number(e.target.value))}
              className={CHROME_INPUT}
            />
          </label>
        </div>
      )}

      <label className="block">
        <span className="sr-only">{t('aiUploadSrOnly')}</span>
        <input
          type="file"
          accept="image/*"
          disabled={busy}
          onChange={onFile}
          className="block w-full text-[11px] text-ink/55 file:mr-2 file:rounded-md file:border-0 file:bg-ink file:px-2 file:py-1 file:font-mono file:text-[10px] file:uppercase file:tracking-wider file:text-mustard hover:file:opacity-90 disabled:opacity-50"
        />
      </label>

      {pendingFileName && (
        <p className="truncate font-mono text-[10px] text-ink/45" title={pendingFileName}>
          {t('aiFilePrefix')} {pendingFileName}
        </p>
      )}

      {busy && (
        <div className="space-y-1">
          <p className="animate-pulse text-xs text-terracotta">{message}</p>
          {payloadEstimate && (
            <div className="space-y-0.5 text-[10px] leading-snug text-ink/50">
              <p>{t('aiPayloadBytes', { k: payloadEstimate.imageBytesK })}</p>
              <p>{t('aiPayloadTokens', { k: payloadEstimate.tokensK })}</p>
            </div>
          )}
        </div>
      )}

      {!busy && phase === 'error' && message && (
        <p className="text-xs text-terracotta">{message}</p>
      )}

      {!busy && phase === 'ready' && pendingSections && pendingSections.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-ink/75">{message}</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={applyPending}
              className="flex-1 rounded-lg bg-ink px-2 py-1.5 text-xs font-semibold text-mustard transition hover:opacity-90"
            >
              {t('aiReplaceSequence', { count: pendingSections.length })}
            </button>
            <button
              type="button"
              onClick={discardPending}
              className="rounded-lg border border-warm-gray/55 px-2 py-1.5 text-xs text-ink/70 transition hover:bg-white/30"
            >
              {t('aiDiscard')}
            </button>
          </div>
        </div>
      )}

      {!busy && phase === 'idle' && message && !pendingSections && (
        <p className="text-xs text-ink/60">{message}</p>
      )}

      <p className="text-[10px] leading-snug text-ink/50">{t('aiFooterHint')}</p>
    </div>
  )
}
