import { posix, win32 } from 'node:path'

export function getBundledOCRExecutablePath(
  resourcesPath: string,
  platform: NodeJS.Platform = process.platform
): string {
  const executableName = platform === 'win32' ? 'desk-ocr-service.exe' : 'desk-ocr-service'
  const pathImplementation = platform === 'win32' ? win32 : posix
  return pathImplementation.join(resourcesPath, 'ocr', executableName)
}

export function isDeskOCRHealthPayload(value: unknown): boolean {
  if (!value || typeof value !== 'object') {
    return false
  }

  const payload = value as Record<string, unknown>
  return payload.status === 'ok' && payload.service === 'desk-ocr'
}
