export type RegionSelection = {
  x: number
  y: number
  width: number
  height: number
  viewportWidth: number
  viewportHeight: number
}

export type RegionSelectionConfig = {
  instruction: string
  cancelHint: string
  language: 'zh-CN' | 'en'
}
