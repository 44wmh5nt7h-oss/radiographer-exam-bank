import { useMemo, useState } from 'react'
import BackLink from '../components/BackLink'
import Navbar from '../components/Navbar'
import SeoMeta from '../components/SeoMeta'
import StudyStatusStrip from '../components/StudyStatusStrip'
import ThemeToggle from '../components/ThemeToggle'
import {
  getDailyGoal,
  getExamDate,
  getPracticeYearRange,
  setDailyGoal,
  setExamDate,
  setPracticeYearRange,
} from '../utils/storageUtils'

const YEAR_OPTIONS = Array.from({ length: 16 }, (_, index) => 100 + index)
const DAILY_GOAL_OPTIONS = [20, 40, 80]
const MIN_DAILY_GOAL = 1
const MAX_DAILY_GOAL = 480

function SettingsPage() {
  const initialYearRange = useMemo(() => getPracticeYearRange(), [])
  const [examDate, setExamDateState] = useState(() => getExamDate())
  const [dailyGoal, setDailyGoalState] = useState(() => getDailyGoal())
  const [dailyGoalInput, setDailyGoalInput] = useState(() => String(getDailyGoal()))
  const [dailyGoalError, setDailyGoalError] = useState('')
  const [startYear, setStartYear] = useState(initialYearRange.startYear)
  const [endYear, setEndYear] = useState(initialYearRange.endYear)
  const [savedMessage, setSavedMessage] = useState('')

  const markSaved = (message = '設定已自動儲存') => {
    setSavedMessage(message)
  }

  const commitDailyGoal = (value) => {
    const parsed = Number(value)

    if (!Number.isFinite(parsed) || parsed < MIN_DAILY_GOAL || parsed > MAX_DAILY_GOAL) {
      setDailyGoalError(`請輸入 ${MIN_DAILY_GOAL} 到 ${MAX_DAILY_GOAL} 之間的題數`)
      return
    }

    const normalized = setDailyGoal(parsed)
    setDailyGoalState(normalized)
    setDailyGoalInput(String(normalized))
    setDailyGoalError('')
    markSaved()
  }

  const handleStartYearChange = (event) => {
    const nextStartYear = Number(event.target.value)
    const nextEndYear = Math.max(nextStartYear, endYear)
    setStartYear(nextStartYear)
    setEndYear(nextEndYear)
    setPracticeYearRange({ startYear: nextStartYear, endYear: nextEndYear })
    markSaved()
  }

  const handleEndYearChange = (event) => {
    const nextEndYear = Number(event.target.value)
    setEndYear(nextEndYear)
    setPracticeYearRange({ startYear, endYear: nextEndYear })
    markSaved()
  }

  return (
    <main className="min-h-screen px-4 py-6 md:px-6 md:py-8">
      <SeoMeta
        title="學習設定｜放射師國考刷題庫"
        description="設定考試日期、每日目標、練習年份範圍與外觀模式。"
        canonicalPath="/settings"
        robots="noindex,nofollow"
      />
      <div className="mx-auto flex max-w-4xl flex-col gap-5">
        <BackLink label="返回首頁" fallbackTo="/" />
        <Navbar subtitle="學習設定" title="調整考試日期與每日目標" />
        <StudyStatusStrip compact />

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
          <div className="mb-5 flex flex-col gap-2 border-b border-slate-100 pb-5 md:flex-row md:items-start md:justify-between">
            <div>
              <h1 className="text-xl font-black text-slate-950">設定你的今日刷題節奏</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                考試日期會用來計算倒數與任務優先順序；每日目標會用來判斷今天是否該繼續刷題、改複習錯題，或查看成長紀錄。
              </p>
            </div>
            {savedMessage ? (
              <span className="inline-flex w-fit rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                {savedMessage}
              </span>
            ) : null}
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <label className="grid gap-2 text-sm text-slate-600">
              <span className="font-semibold text-slate-800">考試日期</span>
              <span className="text-xs leading-5 text-slate-500">用來顯示考試倒數，並在考前自動提高錯題複習優先度。</span>
              <input
                type="date"
                value={examDate}
                onChange={(event) => {
                  setExamDate(event.target.value)
                  setExamDateState(event.target.value)
                  markSaved()
                }}
                className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-slate-900 outline-none focus:border-blue-400"
              />
            </label>

            <div className="grid gap-2 text-sm text-slate-600">
              <span className="font-semibold text-slate-800">每日目標題數</span>
              <span className="text-xs leading-5 text-slate-500">首頁會依照這個目標顯示今日完成數與下一步建議。</span>
              <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50">
                <input
                  type="number"
                  min={MIN_DAILY_GOAL}
                  max={MAX_DAILY_GOAL}
                  value={dailyGoalInput}
                  onChange={(event) => {
                    setDailyGoalInput(event.target.value)
                    setDailyGoalError('')
                  }}
                  onBlur={() => commitDailyGoal(dailyGoalInput)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault()
                      commitDailyGoal(dailyGoalInput)
                    }
                  }}
                  className="h-11 w-full rounded-xl bg-transparent px-3 text-slate-900 outline-none"
                  inputMode="numeric"
                />
                <span className="px-3 text-sm font-semibold text-slate-500">題</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {DAILY_GOAL_OPTIONS.map((goal) => (
                  <button
                    key={goal}
                    type="button"
                    onClick={() => commitDailyGoal(goal)}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${
                      Number(dailyGoal) === goal
                        ? 'border-blue-200 bg-blue-50 text-blue-700'
                        : 'border-slate-200 bg-white text-slate-600'
                    }`}
                  >
                    {goal} 題
                  </button>
                ))}
              </div>
              {dailyGoalError ? <span className="text-xs text-rose-600">{dailyGoalError}</span> : null}
            </div>

            <label className="grid gap-2 text-sm text-slate-600">
              <span className="font-semibold text-slate-800">練習起始年份</span>
              <span className="text-xs leading-5 text-slate-500">限制抽題時可使用的歷屆試題年份範圍。</span>
              <select
                value={startYear}
                onChange={handleStartYearChange}
                className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-slate-900 outline-none"
              >
                {YEAR_OPTIONS.map((year) => (
                  <option key={year} value={year}>
                    民國 {year} 年
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 text-sm text-slate-600">
              <span className="font-semibold text-slate-800">練習終止年份</span>
              <span className="text-xs leading-5 text-slate-500">建議保留完整年份，考前再依需要縮小範圍。</span>
              <select
                value={endYear}
                onChange={handleEndYearChange}
                className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-slate-900 outline-none"
              >
                {YEAR_OPTIONS.filter((year) => year >= startYear).map((year) => (
                  <option key={year} value={year}>
                    民國 {year} 年
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <ThemeToggle />
          </div>
        </section>
      </div>
    </main>
  )
}

export default SettingsPage
