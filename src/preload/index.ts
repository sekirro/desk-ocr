import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron'
import type { RegionSelection, RegionSelectionConfig } from '../shared/capture'
import type { AppLanguage } from '../shared/language'
import type { ScreenshotPayload } from '../renderer/src/types/ocr'

contextBridge.exposeInMainWorld('deskOCR', {
  captureCurrentScreen: (language: AppLanguage): Promise<ScreenshotPayload | null> =>
    ipcRenderer.invoke('capture-current-screen', language),
  openImage: (language: AppLanguage): Promise<ScreenshotPayload | null> =>
    ipcRenderer.invoke('open-image', language),
  onCaptureShortcut: (callback: () => void): (() => void) => {
    const listener = (): void => callback()
    ipcRenderer.on('capture-shortcut', listener)
    return () => {
      ipcRenderer.removeListener('capture-shortcut', listener)
    }
  },
  onRegionSelectionConfig: (
    callback: (config: RegionSelectionConfig) => void
  ): (() => void) => {
    const listener = (_event: IpcRendererEvent, config: RegionSelectionConfig): void =>
      callback(config)
    ipcRenderer.on('region-selection-config', listener)
    return () => {
      ipcRenderer.removeListener('region-selection-config', listener)
    }
  },
  completeRegionSelection: (selection: RegionSelection): Promise<boolean> =>
    ipcRenderer.invoke('complete-region-selection', selection),
  cancelRegionSelection: (): Promise<boolean> =>
    ipcRenderer.invoke('cancel-region-selection')
})
