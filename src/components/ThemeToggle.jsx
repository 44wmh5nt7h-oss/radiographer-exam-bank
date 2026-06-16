import { useEffect, useState } from 'react'
import {
  applyResolvedTheme,
  getThemePreference,
  resolveTheme,
  saveThemePreference,
  THEME_PREFERENCES,
} from '../utils/themeUtils'

const THEME_LABELS = {
  auto: '跟隨時間',
  light: '白天',
  dark: '夜晚',
}

function ThemeToggle({ compact = false }) {
  const [preference, setPreference] = useState(() => getThemePreference())
  const resolvedTheme = resolveTheme(preference)

  useEffect(() => {
    applyResolvedTheme(resolvedTheme)
  }, [resolvedTheme])

  const handleChange = (event) => {
    const nextPreference = saveThemePreference(event.target.value)
    setPreference(nextPreference)
  }

  return (
    <label className={`flex ${compact ? 'items-center gap-2' : 'flex-col gap-2'}`}>
      <span className="text-xs font-semibold text-slate-500">{compact ? '外觀：' : '外觀'}</span>
      <select
        value={preference}
        onChange={handleChange}
        className={`rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 transition hover:border-slate-300 ${
          compact ? 'px-2 py-1.5' : 'px-3 py-2 shadow-sm'
        }`}
      >
        {THEME_PREFERENCES.map((item) => (
          <option key={item} value={item}>
            {THEME_LABELS[item]}
          </option>
        ))}
      </select>
      {!compact ? (
        <span className="text-xs text-slate-500">
          目前套用：{resolvedTheme === 'dark' ? '夜晚模式' : '白天模式'}
        </span>
      ) : null}
    </label>
  )
}

export default ThemeToggle
