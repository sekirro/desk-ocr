import { useEffect, useMemo, useRef, useState } from 'react'
import { Camera, Loader2 } from 'lucide-react'
import { ScreenshotViewer } from './components/ScreenshotViewer'
import { SearchPanel } from './components/SearchPanel'
import { runOCR } from './lib/ocrClient'
import { dataUrlToBlob, getMatchedWordIds, moveActiveIndex } from './lib/search'
import { sortWordsForReadingOrder } from './lib/geometry'
import type { OCRResponse, OCRWord, ScreenshotPayload } from './types/ocr'

type AppStatus = 'idle' | 'capturing' | 'ocr' | 'ready' | 'error'

export function App(): JSX.Element {
  const [screenshot, setScreenshot] = useState<ScreenshotPayload | null>(null)
  const [ocr, setOcr] = useState<OCRResponse | null>(null)
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(-1)
  const [status, setStatus] = useState<AppStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const captureInFlightRef = useRef(false)

  const words = useMemo(() => sortWordsForReadingOrder(ocr?.words ?? []), [ocr])
  const matchedIds = useMemo(() => getMatchedWordIds(query, words), [query, words])
  const matchedWords = useMemo<OCRWord[]>(() => {
    const matchedSet = new Set(matchedIds)
    return words.filter((word) => matchedSet.has(word.id))
  }, [matchedIds, words])

  const activeWordId =
    activeIndex >= 0 && activeIndex < matchedIds.length ? matchedIds[activeIndex] : null

  useEffect(() => {
    setActiveIndex(matchedIds.length > 0 ? 0 : -1)
  }, [query, matchedIds.length])

  useEffect(() => {
    return window.deskOCR?.onCaptureShortcut(() => {
      void captureAndOCR()
    })
  }, [])

  async function captureAndOCR(): Promise<void> {
    if (captureInFlightRef.current) {
      return
    }

    captureInFlightRef.current = true
    setStatus('capturing')
    setError(null)

    try {
      if (!window.deskOCR) {
        throw new Error('截图功能只能在 Electron 桌面窗口中使用，请不要在普通浏览器里打开 localhost 页面操作。')
      }

      const nextScreenshot = await window.deskOCR.captureCurrentScreen()
      setScreenshot(nextScreenshot)
      setOcr(null)
      setQuery('')
      setStatus('ocr')

      const response = await runOCR(dataUrlToBlob(nextScreenshot.dataUrl))
      setOcr(response)
      setStatus('ready')
    } catch (unknownError) {
      setStatus('error')
      setError(unknownError instanceof Error ? unknownError.message : String(unknownError))
    } finally {
      captureInFlightRef.current = false
    }
  }

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

  const busy = status === 'capturing' || status === 'ocr'
  const statusText =
    status === 'capturing'
      ? '正在截图'
      : status === 'ocr'
        ? '正在 OCR'
        : status === 'ready'
          ? `已识别 ${ocr?.words.length ?? 0} 个词块`
          : status === 'error'
            ? '处理失败'
            : '等待截图'

  return (
    <div className="app-shell">
      <header className="toolbar">
        <div className="brand-block">
          <div className="app-title">Desk OCR</div>
          <div className="app-subtitle">截图、识别、定位、复制</div>
        </div>
        <div className="toolbar-actions">
          <button className="primary-button" type="button" onClick={captureAndOCR} disabled={busy}>
            {busy ? <Loader2 className="spin" size={18} /> : <Camera size={18} />}
            截图并 OCR
          </button>
          <div className={status === 'error' ? 'status error' : 'status'}>{statusText}</div>
        </div>
      </header>

      {error ? <div className="error-banner">{error}</div> : null}

      <main className="workspace">
        <section className="viewer-panel">
          <ScreenshotViewer
            screenshot={screenshot}
            ocr={ocr}
            matchedIds={matchedIds}
            activeWordId={activeWordId}
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
          onCopyAll={copyAllText}
        />
      </main>
    </div>
  )
}
