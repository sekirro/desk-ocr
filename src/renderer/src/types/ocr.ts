import type { AppLanguage } from '../../../shared/language'
import type { RegionSelection, RegionSelectionConfig } from '../../../shared/capture'

export type Box = {
  x: number
  y: number
  width: number
  height: number
}

export type Polygon = [number, number][]

export type ScreenshotPayload = {
  dataUrl: string
  width: number
  height: number
  displayId: string
}

export type OCRWord = {
  id: string
  lineId: string
  text: string
  confidence: number
  bbox: Box
  polygon?: Polygon
}

export type OCRLine = {
  id: string
  text: string
  confidence: number
  bbox: Box
  polygon?: Polygon
  wordIds: string[]
}

export type OCRResponse = {
  image: {
    width: number
    height: number
  }
  lines: OCRLine[]
  words: OCRWord[]
}

declare global {
  interface Window {
    deskOCR?: {
      captureCurrentScreen: (language: AppLanguage) => Promise<ScreenshotPayload | null>
      openImage: (language: AppLanguage) => Promise<ScreenshotPayload | null>
      onCaptureShortcut: (callback: () => void) => () => void
      onRegionSelectionConfig: (
        callback: (config: RegionSelectionConfig) => void
      ) => () => void
      completeRegionSelection: (selection: RegionSelection) => Promise<boolean>
      cancelRegionSelection: () => Promise<boolean>
    }
  }
}
