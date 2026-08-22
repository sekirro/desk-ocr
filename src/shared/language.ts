export const APP_LANGUAGES = ['zh-CN', 'en'] as const

export type AppLanguage = (typeof APP_LANGUAGES)[number]

export const DEFAULT_APP_LANGUAGE: AppLanguage = 'zh-CN'

export function normalizeAppLanguage(value: unknown): AppLanguage {
  return value === 'en' ? 'en' : DEFAULT_APP_LANGUAGE
}
