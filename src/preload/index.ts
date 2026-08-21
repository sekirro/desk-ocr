import { contextBridge, ipcRenderer } from 'electron'
import type { ScreenshotPayload } from '../renderer/src/types/ocr'

contextBridge.exposeInMainWorld('deskOCR', {
  captureCurrentScreen: (): Promise<ScreenshotPayload> =>
    ipcRenderer.invoke('capture-current-screen'),
  openImage: (): Promise<ScreenshotPayload | null> => ipcRenderer.invoke('open-image'),
  onCaptureShortcut: (callback: () => void): (() => void) => {
    const listener = (): void => callback()
    ipcRenderer.on('capture-shortcut', listener)
    return () => {
      ipcRenderer.removeListener('capture-shortcut', listener)
    }
  }
})
