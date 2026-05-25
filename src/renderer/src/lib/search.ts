import type { OCRWord } from '../types/ocr'

export function normalizeQuery(value: string): string {
  return value.trim().toLocaleLowerCase()
}

export function getMatchedWordIds(query: string, words: OCRWord[]): string[] {
  const normalized = normalizeQuery(query)

  if (!normalized) {
    return []
  }

  return words
    .filter((word) => word.text.toLocaleLowerCase().includes(normalized))
    .map((word) => word.id)
}

export function moveActiveIndex(
  currentIndex: number,
  total: number,
  direction: 1 | -1
): number {
  if (total <= 0) {
    return -1
  }

  if (currentIndex < 0) {
    return direction === 1 ? 0 : total - 1
  }

  return (currentIndex + direction + total) % total
}

export function dataUrlToBlob(dataUrl: string): Blob {
  const [metadata, encoded] = dataUrl.split(',')
  const mimeMatch = metadata.match(/data:(.*);base64/)
  const mime = mimeMatch?.[1] ?? 'image/png'
  const binary = atob(encoded)
  const bytes = new Uint8Array(binary.length)

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }

  return new Blob([bytes], { type: mime })
}
