import {
  DEFAULT_APP_LANGUAGE,
  normalizeAppLanguage,
  type AppLanguage
} from '../../../shared/language'

export const LANGUAGE_STORAGE_KEY = 'desk-ocr.interface-language'

type LanguageStorage = Pick<Storage, 'getItem' | 'setItem'>

export function loadLanguagePreference(
  storage: Pick<LanguageStorage, 'getItem'> | null | undefined
): AppLanguage {
  if (!storage) {
    return DEFAULT_APP_LANGUAGE
  }

  try {
    return normalizeAppLanguage(storage.getItem(LANGUAGE_STORAGE_KEY))
  } catch {
    return DEFAULT_APP_LANGUAGE
  }
}

export function saveLanguagePreference(
  storage: Pick<LanguageStorage, 'setItem'> | null | undefined,
  language: AppLanguage
): boolean {
  if (!storage) {
    return false
  }

  try {
    storage.setItem(LANGUAGE_STORAGE_KEY, language)
    return true
  } catch {
    return false
  }
}
