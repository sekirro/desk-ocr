import {
  DEFAULT_APP_LANGUAGE,
  type AppLanguage
} from '../../../shared/language'
import { getMessages } from './i18n'
import type { OCRResponse } from '../types/ocr'

const ENGLISH_API_ERRORS: Record<string, string> = {
  '请上传图片文件': 'Please upload an image file.',
  '图片为空': 'The image file is empty.',
  '无法解析图片文件': 'Could not decode the image file.',
  '图片像素尺寸过大': 'The image dimensions exceed the allowed limit.'
}

function localizedAPIError(detail: string, status: number, language: AppLanguage): string {
  const messages = getMessages(language)
  if (language === 'zh-CN') {
    return detail || messages.ocrServiceReturned(status)
  }

  const knownError = ENGLISH_API_ERRORS[detail]
  if (knownError) {
    return knownError
  }

  const uploadLimit = /^图片超过 (\d+) MB 上传限制$/.exec(detail)
  if (uploadLimit) {
    return `The image exceeds the ${uploadLimit[1]} MB upload limit.`
  }

  if (detail.startsWith('OCR 失败:')) {
    return `OCR failed:${detail.slice('OCR 失败:'.length)}`
  }

  return messages.ocrRequestFailed(status)
}

export async function runOCR(
  image: Blob,
  language: AppLanguage = DEFAULT_APP_LANGUAGE
): Promise<OCRResponse> {
  const formData = new FormData()
  formData.append('file', image, 'screenshot.png')

  let response: Response
  try {
    response = await fetch('http://127.0.0.1:8787/ocr', {
      method: 'POST',
      body: formData
    })
  } catch {
    throw new Error(getMessages(language).ocrServiceUnavailable)
  }

  if (!response.ok) {
    const rawPayload = await response.text()
    let detail = rawPayload
    try {
      const parsed = JSON.parse(rawPayload) as { detail?: unknown }
      detail = typeof parsed.detail === 'string' ? parsed.detail : ''
    } catch {
      // Plain-text service responses are already stored in rawPayload.
    }
    throw new Error(localizedAPIError(detail, response.status, language))
  }

  return response.json() as Promise<OCRResponse>
}
