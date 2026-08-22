import { contextBridge, ipcRenderer } from 'electron'
import type { AppLanguage } from '../shared/language'
import type { ScreenshotPayload } from '../renderer/src/types/ocr'

contextBridge.exposeInMainWorld('deskOCR', {
  captureCurrentScreen: (language: AppLanguage): Promise<ScreenshotPayload> =>
    ipcRenderer.invoke('capture-current-screen', language),
  openImage: (language: AppLanguage): Promise<ScreenshotPayload | null> =>
    ipcRenderer.invoke('open-image', language),
  onCaptureShortcut: (callback: () => void): (() => void) => {
    const listener = (): void => callback()
    ipcRenderer.on('capture-shortcut', listener)
    return () => {
      ipcRenderer.removeListener('capture-shortcut', listener)
    }
  }
})
