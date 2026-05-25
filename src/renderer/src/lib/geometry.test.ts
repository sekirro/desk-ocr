import { describe, expect, it } from 'vitest'
import { polygonToBBox, scaleBox, sortWordsForReadingOrder } from './geometry'
import type { OCRWord } from '../types/ocr'

describe('geometry helpers', () => {
  it('converts a polygon to a bounding box', () => {
    expect(
      polygonToBBox([
        [120, 80],
        [180, 75],
        [185, 110],
        [118, 115]
      ])
    ).toEqual({
      x: 118,
      y: 75,
      width: 67,
      height: 40
    })
  })

  it('scales boxes with independent axes', () => {
    expect(scaleBox({ x: 20, y: 10, width: 80, height: 30 }, 0.5, 2)).toEqual({
      x: 10,
      y: 20,
      width: 40,
      height: 60
    })
  })

  it('sorts words in reading order', () => {
    const words: OCRWord[] = [
      makeWord('b', 80, 40),
      makeWord('c', 10, 90),
      makeWord('a', 10, 42)
    ]

    expect(sortWordsForReadingOrder(words).map((word) => word.id)).toEqual(['a', 'b', 'c'])
  })
})

function makeWord(id: string, x: number, y: number): OCRWord {
  return {
    id,
    lineId: 'line',
    text: id,
    confidence: 1,
    bbox: { x, y, width: 20, height: 10 }
  }
}
