import { useEffect, useMemo, useRef, useState } from 'react'
import { scaleBox, sortWordsForReadingOrder } from '../lib/geometry'
import type { OCRResponse, ScreenshotPayload } from '../types/ocr'

type ScreenshotViewerProps = {
  screenshot: ScreenshotPayload | null
  ocr: OCRResponse | null
  matchedIds: string[]
  activeWordId: string | null
}

type DisplaySize = {
  width: number
  height: number
}

export function ScreenshotViewer({
  screenshot,
  ocr,
  matchedIds,
  activeWordId
}: ScreenshotViewerProps): JSX.Element {
  const imageRef = useRef<HTMLImageElement | null>(null)
  const [displaySize, setDisplaySize] = useState<DisplaySize>({ width: 0, height: 0 })
  const matchedSet = useMemo(() => new Set(matchedIds), [matchedIds])
  const words = useMemo(() => sortWordsForReadingOrder(ocr?.words ?? []), [ocr])

  useEffect(() => {
    const image = imageRef.current
    if (!image) {
      return
    }

    const updateSize = (): void => {
      const rect = image.getBoundingClientRect()
      setDisplaySize({ width: rect.width, height: rect.height })
    }

    updateSize()

    const resizeObserver = new ResizeObserver(updateSize)
    resizeObserver.observe(image)

    return () => resizeObserver.disconnect()
  }, [screenshot?.dataUrl])

  useEffect(() => {
    if (!activeWordId) {
      return
    }

    const element = document.querySelector(`[data-word-id="${activeWordId}"]`)
    element?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
      inline: 'center'
    })
  }, [activeWordId])

  if (!screenshot) {
    return (
      <div className="empty-view">
        <div className="empty-title">还没有截图</div>
        <div className="empty-copy">截取鼠标所在屏幕，或导入已有图片并开始 OCR。</div>
      </div>
    )
  }

  const scaleX = displaySize.width > 0 ? displaySize.width / screenshot.width : 1
  const scaleY = displaySize.height > 0 ? displaySize.height / screenshot.height : 1

  return (
    <div className="viewer-scroll">
      <div className="image-stack">
        <img
          ref={imageRef}
          className="screenshot-image"
          src={screenshot.dataUrl}
          alt="当前屏幕截图"
          draggable={false}
        />

        {ocr ? (
          <svg
            className="box-layer"
            width={displaySize.width}
            height={displaySize.height}
            aria-hidden="true"
          >
            {ocr.lines.map((line) => {
              const box = scaleBox(line.bbox, scaleX, scaleY)
              return (
                <rect
                  key={line.id}
                  x={box.x}
                  y={box.y}
                  width={box.width}
                  height={box.height}
                  fill="none"
                  stroke="rgba(220, 38, 38, 0.95)"
                  strokeWidth="1.5"
                  vectorEffect="non-scaling-stroke"
                />
              )
            })}
          </svg>
        ) : null}

        {ocr ? (
          <div className="highlight-layer" aria-hidden="true">
            {words.map((word) => {
              if (!matchedSet.has(word.id)) {
                return null
              }

              const box = scaleBox(word.bbox, scaleX, scaleY)
              const isActive = word.id === activeWordId
              return (
                <div
                  key={word.id}
                  className={isActive ? 'word-highlight active' : 'word-highlight'}
                  style={{
                    left: box.x,
                    top: box.y,
                    width: box.width,
                    height: box.height
                  }}
                />
              )
            })}
          </div>
        ) : null}

        {ocr ? (
          <div className="text-layer">
            {words.map((word) => {
              const box = scaleBox(word.bbox, scaleX, scaleY)
              const fontSize = Math.max(4, box.height * 0.82)
              return (
                <span
                  key={word.id}
                  data-word-id={word.id}
                  className="ocr-word"
                  title={`${word.text} (${Math.round(word.confidence * 100)}%)`}
                  style={{
                    left: box.x,
                    top: box.y,
                    width: box.width,
                    height: box.height,
                    fontSize,
                    lineHeight: `${Math.max(4, box.height)}px`
                  }}
                >
                  {word.text}
                </span>
              )
            })}
          </div>
        ) : null}
      </div>
    </div>
  )
}
