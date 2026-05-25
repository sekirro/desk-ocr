import { describe, expect, it } from 'vitest'
import { getMatchedWordIds, moveActiveIndex, normalizeQuery } from './search'
import type { OCRWord } from '../types/ocr'

describe('search helpers', () => {
  const words: OCRWord[] = [
    makeWord('a', '设置'),
    makeWord('b', 'Preferences'),
    makeWord('c', '高级设置')
  ]

  it('normalizes search text', () => {
    expect(normalizeQuery('  Pref  ')).toBe('pref')
  })

  it('matches Chinese and case-insensitive English text', () => {
    expect(getMatchedWordIds('设置', words)).toEqual(['a', 'c'])
    expect(getMatchedWordIds('pref', words)).toEqual(['b'])
  })

  it('returns no matches for empty search text', () => {
    expect(getMatchedWordIds('   ', words)).toEqual([])
  })

  it('moves active result index in a cycle', () => {
    expect(moveActiveIndex(-1, 3, 1)).toBe(0)
    expect(moveActiveIndex(2, 3, 1)).toBe(0)
    expect(moveActiveIndex(0, 3, -1)).toBe(2)
    expect(moveActiveIndex(0, 0, 1)).toBe(-1)
  })
})

function makeWord(id: string, text: string): OCRWord {
  return {
    id,
    lineId: 'line',
    text,
    confidence: 1,
    bbox: { x: 0, y: 0, width: 10, height: 10 }
  }
}
