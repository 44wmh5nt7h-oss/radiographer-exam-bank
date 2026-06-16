import { readUserScopedStorageValue, writeUserScopedStorageValue } from './storageUtils'

const THEME_PREFERENCE_KEY = 'radiographer_exam_bank_theme_preference'
export const THEME_PREFERENCES = ['auto', 'light', 'dark']

function normalizeThemePreference(value) {
  return THEME_PREFERENCES.includes(value) ? value : 'auto'
}

export function getThemePreference() {
  return normalizeThemePreference(readUserScopedStorageValue(THEME_PREFERENCE_KEY, 'auto'))
}

export function saveThemePreference(preference) {
  const normalizedPreference = normalizeThemePreference(preference)
  writeUserScopedStorageValue(THEME_PREFERENCE_KEY, normalizedPreference)
  return normalizedPreference
}

export function resolveTheme(preference = getThemePreference(), date = new Date()) {
  const normalizedPreference = normalizeThemePreference(preference)

  if (normalizedPreference === 'light' || normalizedPreference === 'dark') {
    return normalizedPreference
  }

  const hour = date.getHours()
  return hour >= 6 && hour < 18 ? 'light' : 'dark'
}

export function applyResolvedTheme(resolvedTheme) {
  if (typeof document === 'undefined') {
    return
  }

  const nextTheme = resolvedTheme === 'dark' ? 'dark' : 'light'
  document.documentElement.classList.toggle('theme-dark', nextTheme === 'dark')
  document.documentElement.classList.toggle('theme-light', nextTheme === 'light')
  document.documentElement.dataset.theme = nextTheme
}

export function applyCurrentTheme() {
  const preference = getThemePreference()
  const resolvedTheme = resolveTheme(preference)
  applyResolvedTheme(resolvedTheme)

  return {
    preference,
    resolvedTheme,
  }
}
