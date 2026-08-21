import { afterEach, describe, expect, it, vi } from 'vitest'
import { runOCR } from './ocrClient'

describe('OCR client', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns a clear error when the local service is unavailable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('connection refused')))

    await expect(runOCR(new Blob(['image'], { type: 'image/png' }))).rejects.toThrow(
      '无法连接本地 OCR 服务'
    )
  })

  it('uses the API error detail', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ detail: '图片尺寸过大' }), {
          status: 413,
          headers: { 'content-type': 'application/json' }
        })
      )
    )

    await expect(runOCR(new Blob(['image'], { type: 'image/png' }))).rejects.toThrow(
      '图片尺寸过大'
    )
  })

  it('returns the normalized OCR response', async () => {
    const payload = {
      image: { width: 100, height: 50 },
      lines: [],
      words: []
    }
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify(payload), {
          status: 200,
          headers: { 'content-type': 'application/json' }
        })
      )
    )

    await expect(runOCR(new Blob(['image'], { type: 'image/png' }))).resolves.toEqual(payload)
  })
})
