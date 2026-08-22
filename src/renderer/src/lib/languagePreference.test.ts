import { describe, expect, it } from 'vitest'
import { DEFAULT_APP_LANGUAGE } from '../../../shared/language'
import {
  LANGUAGE_STORAGE_KEY,
  loadLanguagePreference,
  saveLanguagePreference
} from './languagePreference'

describe('language preference', () => {
  it('defaults to Chinese when no valid preference exists', () => {
    expect(loadLanguagePreference(null)).toBe(DEFAULT_APP_LANGUAGE)
    expect(loadLanguagePreference({ getItem: () => null })).toBe('zh-CN')
    expect(loadLanguagePreference({ getItem: () => 'fr' })).toBe('zh-CN')
  })

  it('restores an explicitly selected English interface', () => {
    expect(loadLanguagePreference({ getItem: () => 'en' })).toBe('en')
  })

  it('saves only the interface language preference', () => {
    const writes: Array<[string, string]> = []
    const stored = saveLanguagePreference(
      {
        setItem: (key, value) => writes.push([key, value])
      },
      'en'
    )

    expect(stored).toBe(true)
    expect(writes).toEqual([[LANGUAGE_STORAGE_KEY, 'en']])
  })

  it('falls back safely when browser storage is unavailable', () => {
    expect(
      loadLanguagePreference({
        getItem: () => {
          throw new Error('storage blocked')
        }
      })
    ).toBe('zh-CN')
    expect(
      saveLanguagePreference(
        {
          setItem: () => {
            throw new Error('storage blocked')
          }
        },
        'en'
      )
    ).toBe(false)
  })
})
