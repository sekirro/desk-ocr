import { describe, expect, it } from 'vitest'
import { calculateImageCrop, isRegionSelection } from './regionCapture'

describe('region capture helpers', () => {
  it('maps display-independent coordinates to Retina image pixels', () => {
    expect(
      calculateImageCrop(
        {
          x: 120,
          y: 80,
          width: 640,
          height: 360,
          viewportWidth: 1512,
          viewportHeight: 982
        },
        { width: 3024, height: 1964 }
      )
    ).toEqual({ x: 240, y: 160, width: 1280, height: 720 })
  })

  it('normalizes reverse drags and clamps them to the captured display', () => {
    expect(
      calculateImageCrop(
        {
          x: 1100,
          y: 700,
          width: -1200,
          height: -800,
          viewportWidth: 1000,
          viewportHeight: 600
        },
        { width: 2000, height: 1200 }
      )
    ).toEqual({ x: 0, y: 0, width: 2000, height: 1200 })
  })

  it('rejects invalid or empty selections', () => {
    expect(
      isRegionSelection({
        x: 0,
        y: 0,
        width: Number.NaN,
        height: 10,
        viewportWidth: 100,
        viewportHeight: 100
      })
    ).toBe(false)
    expect(
      calculateImageCrop(
        { x: 100, y: 10, width: 10, height: 10, viewportWidth: 100, viewportHeight: 100 },
        { width: 200, height: 200 }
      )
    ).toBeNull()
  })
})
