import { describe, expect, it } from 'vitest'
import { getBundledOCRExecutablePath, isDeskOCRHealthPayload } from './ocrRuntime'

describe('bundled OCR runtime', () => {
  it('uses the Windows executable name', () => {
    expect(getBundledOCRExecutablePath('C:\\DeskOCR\\resources', 'win32')).toBe(
      'C:\\DeskOCR\\resources\\ocr\\desk-ocr-service.exe'
    )
  })

  it('uses an extensionless executable on macOS and Linux', () => {
    expect(getBundledOCRExecutablePath('/opt/desk-ocr/resources', 'linux')).toBe(
      '/opt/desk-ocr/resources/ocr/desk-ocr-service'
    )
  })

  it('accepts only the Desk OCR health response', () => {
    expect(isDeskOCRHealthPayload({ status: 'ok', service: 'desk-ocr' })).toBe(true)
    expect(isDeskOCRHealthPayload({ status: 'ok', service: 'another-service' })).toBe(false)
    expect(isDeskOCRHealthPayload(null)).toBe(false)
  })
})
