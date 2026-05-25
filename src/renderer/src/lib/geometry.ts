import type { Box, OCRWord, Polygon } from '../types/ocr'

export function polygonToBBox(points: Polygon): Box {
  const xs = points.map((point) => point[0])
  const ys = points.map((point) => point[1])

  return {
    x: Math.min(...xs),
    y: Math.min(...ys),
    width: Math.max(...xs) - Math.min(...xs),
    height: Math.max(...ys) - Math.min(...ys)
  }
}

export function scaleBox(box: Box, scaleX: number, scaleY: number): Box {
  return {
    x: box.x * scaleX,
    y: box.y * scaleY,
    width: box.width * scaleX,
    height: box.height * scaleY
  }
}

export function sortWordsForReadingOrder(words: OCRWord[]): OCRWord[] {
  return [...words].sort((a, b) => {
    const yDelta = a.bbox.y - b.bbox.y
    if (Math.abs(yDelta) > 8) {
      return yDelta
    }
    return a.bbox.x - b.bbox.x
  })
}
