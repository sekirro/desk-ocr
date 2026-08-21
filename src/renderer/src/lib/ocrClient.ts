import type { OCRResponse } from '../types/ocr'

export async function runOCR(image: Blob): Promise<OCRResponse> {
  const formData = new FormData()
  formData.append('file', image, 'screenshot.png')

  let response: Response
  try {
    response = await fetch('http://127.0.0.1:8787/ocr', {
      method: 'POST',
      body: formData
    })
  } catch {
    throw new Error('无法连接本地 OCR 服务，请确认 npm run dev 中的 OCR 进程仍在运行。')
  }

  if (!response.ok) {
    const payload = await response.json().catch(() => null)
    const message = payload?.detail ?? (await response.text())
    throw new Error(message || `OCR 服务返回 ${response.status}`)
  }

  return response.json() as Promise<OCRResponse>
}
