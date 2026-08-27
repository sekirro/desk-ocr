import { describe, expect, it } from 'vitest'
import { clampPoint, createSelectionRectangle } from './regionSelection'

describe('region selection helpers', () => {
  it('creates the same rectangle for forward and reverse drags', () => {
    expect(createSelectionRectangle({ x: 20, y: 30 }, { x: 120, y: 90 })).toEqual({
      x: 20,
      y: 30,
      width: 100,
      height: 60
    })
    expect(createSelectionRectangle({ x: 120, y: 90 }, { x: 20, y: 30 })).toEqual({
      x: 20,
      y: 30,
      width: 100,
      height: 60
    })
  })

  it('clamps pointer coordinates to the overlay viewport', () => {
    expect(clampPoint({ x: -25, y: 725 }, 1280, 720)).toEqual({ x: 0, y: 720 })
  })
})
