import type { RegionSelection } from '../shared/capture'

export type ImageSize = {
  width: number
  height: number
}

export type ImageCrop = {
  x: number
  y: number
  width: number
  height: number
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

export function isRegionSelection(value: unknown): value is RegionSelection {
  if (!value || typeof value !== 'object') {
    return false
  }

  const selection = value as Record<string, unknown>
  return (
    isFiniteNumber(selection.x) &&
    isFiniteNumber(selection.y) &&
    isFiniteNumber(selection.width) &&
    isFiniteNumber(selection.height) &&
    isFiniteNumber(selection.viewportWidth) &&
    isFiniteNumber(selection.viewportHeight) &&
    selection.width !== 0 &&
    selection.height !== 0 &&
    selection.viewportWidth > 0 &&
    selection.viewportHeight > 0
  )
}

export function calculateImageCrop(
  selection: RegionSelection,
  image: ImageSize
): ImageCrop | null {
  if (
    !isRegionSelection(selection) ||
    !isFiniteNumber(image.width) ||
    !isFiniteNumber(image.height) ||
    image.width <= 0 ||
    image.height <= 0
  ) {
    return null
  }

  const left = Math.max(0, Math.min(selection.x, selection.x + selection.width))
  const top = Math.max(0, Math.min(selection.y, selection.y + selection.height))
  const right = Math.min(
    selection.viewportWidth,
    Math.max(selection.x, selection.x + selection.width)
  )
  const bottom = Math.min(
    selection.viewportHeight,
    Math.max(selection.y, selection.y + selection.height)
  )

  if (right <= left || bottom <= top) {
    return null
  }

  const scaleX = image.width / selection.viewportWidth
  const scaleY = image.height / selection.viewportHeight
  const x = Math.max(0, Math.min(image.width - 1, Math.floor(left * scaleX)))
  const y = Math.max(0, Math.min(image.height - 1, Math.floor(top * scaleY)))
  const rightPixel = Math.max(x + 1, Math.min(image.width, Math.ceil(right * scaleX)))
  const bottomPixel = Math.max(y + 1, Math.min(image.height, Math.ceil(bottom * scaleY)))

  return {
    x,
    y,
    width: rightPixel - x,
    height: bottomPixel - y
  }
}
