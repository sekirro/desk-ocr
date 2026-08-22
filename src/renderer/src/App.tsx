import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Camera, ImagePlus, Loader2, Settings2 } from 'lucide-react'
import { ScreenshotViewer } from './components/ScreenshotViewer'
import { SearchPanel } from './components/SearchPanel'
import { SettingsDialog } from './components/SettingsDialog'
import { runOCR } from './lib/ocrClient'
import { getMessages } from './lib/i18n'
import {
  loadLanguagePreference,
  saveLanguagePreference
} from './lib/languagePreference'
import { dataUrlToBlob, getMatchedWordIds, moveActiveIndex } from './lib/search'
import { sortWordsForReadingOrder } from './lib/geometry'
import type { AppLanguage } from '../../shared/language'
import type { OCRResponse, OCRWord, ScreenshotPayload } from './types/ocr'

type AppStatus = 'idle' | 'capturing' | 'selecting' | 'ocr' | 'ready' | 'error'

function getLocalStorage(): Storage | null {
  try {
    return window.localStorage
  } catch {
    return null
  }
}

export function App(): JSX.Element {
  const [screenshot, setScreenshot] = useState<ScreenshotPayload | null>(null)
  const [ocr, setOcr] = useState<OCRResponse | null>(null)
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(-1)
  const [status, setStatus] = useState<AppStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [language, setLanguage] = useState<AppLanguage>(() =>
    loadLanguagePreference(getLocalStorage())
  )
  const captureInFlightRef = useRef(false)
  const messages = useMemo(() => getMessages(language), [language])

  const words = useMemo(() => sortWordsForReadingOrder(ocr?.words ?? []), [ocr])
  const matchedIds = useMemo(() => getMatchedWordIds(query, words), [query, words])
  const matchedWords = useMemo<OCRWord[]>(() => {
    const matchedSet = new Set(matchedIds)
    return words.filter((word) => matchedSet.has(word.id))
  }, [matchedIds, words])

  const activeWordId =
    activeIndex >= 0 && activeIndex < matchedIds.length ? matchedIds[activeIndex] : null

  const acquireAndOCR = useCallback(
    async (
      initialStatus: 'capturing' | 'selecting',
      acquire: () => Promise<ScreenshotPayload | null>
    ): Promise<void> => {
      if (captureInFlightRef.current) {
        return
      }

      captureInFlightRef.current = true
      setStatus(initialStatus)
      setError(null)

      try {
        if (!window.deskOCR) {
          throw new Error(messages.electronOnly)
        }

        const nextScreenshot = await acquire()
        if (!nextScreenshot) {
          setStatus(ocr ? 'ready' : 'idle')
          return
        }

        setScreenshot(nextScreenshot)
        setOcr(null)
        setQuery('')
        setStatus('ocr')

        const response = await runOCR(dataUrlToBlob(nextScreenshot.dataUrl), language)
        setOcr(response)
        setStatus('ready')
      } catch (unknownError) {
        setStatus('error')
        setError(unknownError instanceof Error ? unknownError.message : String(unknownError))
      } finally {
        captureInFlightRef.current = false
      }
    },
    [language, messages.electronOnly, ocr]
  )

  const captureAndOCR = useCallback(async (): Promise<void> => {
    await acquireAndOCR('capturing', async () => {
      if (!window.deskOCR) {
        return null
      }
      return window.deskOCR.captureCurrentScreen(language)
    })
  }, [acquireAndOCR, language])

  const importAndOCR = useCallback(async (): Promise<void> => {
    await acquireAndOCR('selecting', async () => {
      if (!window.deskOCR) {
        return null
      }
      return window.deskOCR.openImage(language)
    })
  }, [acquireAndOCR, language])

  const closeSettings = useCallback((): void => {
    setSettingsOpen(false)
  }, [])

  const changeLanguage = useCallback(
    (nextLanguage: AppLanguage): void => {
      setLanguage(nextLanguage)
      saveLanguagePreference(getLocalStorage(), nextLanguage)
      setError(null)
      setStatus((current) => (current === 'error' ? (ocr ? 'ready' : 'idle') : current))
    },
    [ocr]
  )

  useEffect(() => {
    document.documentElement.lang = language
  }, [language])

  useEffect(() => {
    setActiveIndex(matchedIds.length > 0 ? 0 : -1)
  }, [query, matchedIds.length])

  useEffect(() => {
    return window.deskOCR?.onCaptureShortcut(() => {
      void captureAndOCR()
    })
  }, [captureAndOCR])

  function moveMatch(direction: 1 | -1): void {
    setActiveIndex((current) => moveActiveIndex(current, matchedIds.length, direction))
  }

  async function copyAllText(): Promise<void> {
    const text = (ocr?.lines ?? []).map((line) => line.text).join('\n')
    if (!text) {
      return
    }
    await navigator.clipboard.writeText(text)
  }

  const busy = status === 'capturing' || status === 'selecting' || status === 'ocr'
  const statusText =
    status === 'capturing'
      ? messages.statusCapturing
      : status === 'selecting'
        ? messages.statusSelecting
        : status === 'ocr'
          ? messages.statusOCR
          : status === 'ready'
            ? messages.statusReady(ocr?.words.length ?? 0)
            : status === 'error'
              ? messages.statusError
              : messages.statusIdle

  return (
    <div className="app-shell">
      <header className="toolbar">
        <div className="brand-block">
          <div className="app-title">Desk OCR</div>
          <div className="app-subtitle">{messages.appSubtitle}</div>
        </div>
        <div className="toolbar-actions">
          <button
            className="secondary-button settings-trigger"
            type="button"
            onClick={() => setSettingsOpen(true)}
          >
            <Settings2 size={18} />
            {messages.settings}
          </button>
          <button className="secondary-button" type="button" onClick={importAndOCR} disabled={busy}>
            <ImagePlus size={18} />
            {messages.importImage}
          </button>
          <button className="primary-button" type="button" onClick={captureAndOCR} disabled={busy}>
            {busy ? <Loader2 className="spin" size={18} /> : <Camera size={18} />}
            {messages.captureAndOCR}
          </button>
          <div
            className={status === 'error' ? 'status error' : 'status'}
            role="status"
            aria-live="polite"
          >
            {statusText}
          </div>
        </div>
      </header>

      {error ? (
        <div className="error-banner" role="alert">
          {error}
        </div>
      ) : null}

      <main className="workspace">
        <section className="viewer-panel">
          <ScreenshotViewer
            screenshot={screenshot}
            ocr={ocr}
            matchedIds={matchedIds}
            activeWordId={activeWordId}
            messages={messages}
          />
        </section>
        <SearchPanel
          query={query}
          onQueryChange={setQuery}
          matchedWords={matchedWords}
          activeIndex={activeIndex}
          lines={ocr?.lines ?? []}
          onNext={() => moveMatch(1)}
          onPrevious={() => moveMatch(-1)}
          onSelectMatch={setActiveIndex}
          onCopyAll={copyAllText}
          messages={messages}
        />
      </main>

      {settingsOpen ? (
        <SettingsDialog
          language={language}
          messages={messages}
          onLanguageChange={changeLanguage}
          onClose={closeSettings}
        />
      ) : null}
    </div>
  )
}
