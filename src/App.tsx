import { useEffect } from 'react'
import { ComponentPanel } from './components/ComponentPanel'
import { SequenceEditor } from './components/SequenceEditor'
import { SlotEditor } from './components/SlotEditor'
import { Preview } from './components/Preview'
import { ExportPanel } from './components/ExportPanel'
import { ProjectSettings } from './components/ProjectSettings'
import { AiAssistPanel } from './components/AiAssistPanel'
import { ImageSlicerPanel } from './components/ImageSlicerPanel'
import { OcrAssistPanel } from './components/OcrAssistPanel'
import { LanguageSwitcher } from './components/LanguageSwitcher'
import { useUiStrings } from './hooks/useUiStrings'

/**
 * Main application layout.
 * Editorial paper chrome: left tools | center preview | right editor.
 * 主布局：纸质暖色编辑台，三栏结构。
 */
export default function App() {
  const { t, locale } = useUiStrings()

  useEffect(() => {
    document.documentElement.lang = locale === 'zh' ? 'zh-CN' : 'en'
  }, [locale])

  return (
    <div className="app-shell flex h-screen flex-col overflow-hidden lg:flex-row">
      <div className="app-grain-overlay" aria-hidden />

      <aside className="relative z-10 flex h-auto max-h-[42vh] w-full shrink-0 flex-col overflow-hidden border-b border-warm-gray/50 bg-paper/95 lg:h-screen lg:max-h-none lg:w-72 lg:border-b-0 lg:border-r">
        <header className="chrome-divider space-y-3 px-4 py-4">
          <div>
            <h1 className="font-serif text-2xl font-medium leading-tight tracking-tight text-ink lg:text-3xl">
              {t('appTitle')}
            </h1>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-ink/50">
              {t('appSubtitle')}
            </p>
          </div>
          <LanguageSwitcher />
        </header>

        <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-3 py-4">
          <ComponentPanel />
          <div className="chrome-divider pt-4">
            <SequenceEditor />
          </div>
          <div className="chrome-divider pt-4">
            <AiAssistPanel />
          </div>
          <div className="chrome-divider pt-4">
            <ImageSlicerPanel />
          </div>
          <div className="chrome-divider pt-4">
            <OcrAssistPanel />
          </div>
        </div>
      </aside>

      <main className="relative z-10 flex min-h-0 flex-1 flex-col overflow-hidden bg-paper/40">
        <div className="chrome-divider flex items-center justify-between gap-4 px-4 py-2.5">
          <span className="chrome-heading">{t('livePreview')}</span>
          <span className="max-w-[14rem] text-right font-mono text-[9px] uppercase leading-snug tracking-wider text-ink/40 lg:max-w-none">
            {t('livePreviewHint')}
          </span>
        </div>
        <div className="relative flex-1 overflow-hidden p-4">
          <div
            className="pointer-events-none absolute right-6 top-4 hidden opacity-[0.08] lg:block"
            aria-hidden
          >
            <svg className="spin-slow h-56 w-56 text-ink" viewBox="0 0 200 200">
              <circle cx="100" cy="100" r="78" fill="none" stroke="currentColor" strokeWidth="0.45" />
              <circle
                cx="100"
                cy="100"
                r="62"
                fill="none"
                stroke="currentColor"
                strokeWidth="0.3"
                strokeDasharray="3 8"
                opacity="0.6"
              />
            </svg>
          </div>
          <Preview />
        </div>
      </main>

      <aside className="relative z-10 flex h-auto max-h-[50vh] w-full shrink-0 flex-col overflow-hidden border-t border-warm-gray/50 bg-paper/95 lg:h-screen lg:max-h-none lg:w-80 lg:border-l lg:border-t-0">
        <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-4 py-4">
          <SlotEditor />
          <div className="chrome-divider pt-4">
            <ProjectSettings />
          </div>
          <div className="chrome-divider pt-4">
            <ExportPanel />
          </div>
        </div>
      </aside>
    </div>
  )
}
