import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Button from '../components/Button'
import SubjectCard from '../components/SubjectCard'
import { QUIZ_LENGTH } from '../utils/quizUtils'
import {
  analyzeTodayWrongTags,
  calculateStreak,
  extractQuestionTags,
  getBookmarkIds,
  getDailyGoal,
  getExamDate,
  getTodayWrongAnalysisItems,
  getTodayPerformanceSummary,
  getRecentSingleSubjectExamResults,
  getTodayStats,
  getWrongBookIds,
  setDailyGoal,
  setExamDate,
} from '../utils/storageUtils'
import {
  getAvailableYearsFromIndex,
  getSubjectSummariesFromIndex,
} from '../utils/subjectUtils'
import { getQuestionByKey, getQuestionIndex } from '../utils/questionDataLoader'
import { getGrowthPreviewSummary } from '../utils/growthUtils'

const DAILY_GOAL_OPTIONS = [20, 40, 80]
const MIN_DAILY_GOAL = 1
const MAX_DAILY_GOAL = 480

function formatExamCountdown(dateString) {
  if (!dateString) {
    return {
      status: 'unset',
      label: '尚未設定考試日期',
      detail: '設定後將自動顯示距離國考剩餘天數。',
    }
  }

  const [year, month, day] = dateString.split('-').map(Number)

  if (!year || !month || !day) {
    return {
      status: 'invalid',
      label: '考試日期格式異常',
      detail: '請重新設定考試日期。',
    }
  }

  const today = new Date()
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const examDate = new Date(year, month - 1, day)
  const diffDays = Math.round((examDate.getTime() - todayStart.getTime()) / 86400000)

  if (diffDays > 0) {
    return {
      status: 'countdown',
      label: `${diffDays} 天`,
      detail: `目標日：${year} 年 ${month} 月 ${day} 日`,
    }
  }

  if (diffDays === 0) {
    return {
      status: 'today',
      label: '今天就是考試日',
      detail: `考試日期：${year} 年 ${month} 月 ${day} 日`,
    }
  }

  return {
    status: 'passed',
    label: '考試日期已過',
    detail: `原設定日期：${year} 年 ${month} 月 ${day} 日`,
  }
}

function formatDateLabel(dateString) {
  if (!dateString) {
    return '--'
  }

  return String(dateString).replaceAll('-', '/')
}

function getScoreBarWidth(score) {
  return Math.max(10, Math.min(100, Number(score || 0)))
}

function StatCard({ label, value, description, accent = 'light' }) {
  const toneClassName =
    accent === 'dark'
      ? 'border-slate-900/80 bg-[linear-gradient(135deg,#0f172a_0%,#1e293b_58%,#2563eb_100%)] text-white'
      : 'border-slate-200/90 bg-white/90 text-slate-900 backdrop-blur'

  const labelClassName = accent === 'dark' ? 'text-slate-300' : 'text-slate-500'
  const descriptionClassName = accent === 'dark' ? 'text-slate-300' : 'text-slate-600'

  return (
    <article className={`relative overflow-hidden rounded-[1.5rem] border p-5 shadow-sm ${toneClassName}`}>
      <div className={`absolute inset-x-0 top-0 h-px ${accent === 'dark' ? 'bg-white/20' : 'bg-slate-200'}`} />
      <p className={`text-xs font-semibold uppercase tracking-[0.22em] ${labelClassName}`}>{label}</p>
      <p className="mt-4 text-3xl font-black sm:text-4xl">{value}</p>
      <p className={`mt-3 text-sm leading-relaxed ${descriptionClassName}`}>{description}</p>
    </article>
  )
}

function QuickActionCard({ to, title, subtitle, count, countLabel, accentClassName, helperText }) {
  return (
    <Link
      to={to}
      className="group rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
    >
      <div className="flex items-start gap-4">
        <span
          className={`inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-sm font-black ring-1 ${accentClassName}`}
        >
          {title.slice(0, 2)}
        </span>
        <div className="min-w-0 flex-1">
          <div>
            <h3 className="text-lg font-bold text-slate-950">{title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{subtitle}</p>
          </div>
          {typeof count === 'number' && (
            <p className="mt-4 text-sm font-semibold text-slate-700">
              {countLabel} {count.toLocaleString('zh-TW')} 題
            </p>
          )}
          {!Number.isFinite(count) && helperText && (
            <p className="mt-4 text-sm font-semibold text-slate-700">{helperText}</p>
          )}
          <div className="mt-4 inline-flex items-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition group-hover:bg-blue-700">
            {title === '錯題本' ? '立即複習錯題' : title === '收藏題' ? '查看收藏題' : '查看成長'}
          </div>
        </div>
      </div>
    </Link>
  )
}

function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [questionIndex, setQuestionIndex] = useState([])
  const [isMetadataLoading, setIsMetadataLoading] = useState(true)
  const [metadataError, setMetadataError] = useState('')
  const [examDate, setExamDateState] = useState(() => getExamDate())
  const [dailyGoal, setDailyGoalState] = useState(() => getDailyGoal())
  const [dailyGoalInput, setDailyGoalInput] = useState(() => String(getDailyGoal()))
  const [dailyGoalError, setDailyGoalError] = useState('')
  const [todayStats, setTodayStatsState] = useState(() => getTodayStats())
  const [streak, setStreak] = useState(() => calculateStreak())
  const [recentSingleSubjectResults, setRecentSingleSubjectResults] = useState(() =>
    getRecentSingleSubjectExamResults(5),
  )
  const [showTodayAnalysis, setShowTodayAnalysis] = useState(false)
  const [resolvedTodayWrongQuestions, setResolvedTodayWrongQuestions] = useState([])

  const availableYears = useMemo(() => getAvailableYearsFromIndex(questionIndex), [questionIndex])
  const defaultStartYear = availableYears[0] ?? 100
  const defaultEndYear = availableYears[availableYears.length - 1] ?? 115
  const requestedStartYear = Number(searchParams.get('startYear')) || defaultStartYear
  const requestedEndYear = Number(searchParams.get('endYear')) || defaultEndYear
  const startYear = availableYears.includes(requestedStartYear) ? requestedStartYear : defaultStartYear
  const endYearCandidate = availableYears.includes(requestedEndYear) ? requestedEndYear : defaultEndYear
  const endYear = Math.max(startYear, endYearCandidate)
  const filteredIndex = useMemo(
    () =>
      (questionIndex || []).filter((entry) => {
        const year = Number(entry.year)
        return year >= startYear && year <= endYear
      }),
    [questionIndex, startYear, endYear],
  )
  const subjectSummaries = useMemo(() => getSubjectSummariesFromIndex(filteredIndex), [filteredIndex])
  const totalQuestions = filteredIndex.reduce((total, entry) => total + Number(entry.questionCount || 0), 0)
  const search = `?startYear=${startYear}&endYear=${endYear}`
  const endYearOptions = availableYears.filter((year) => year >= startYear)
  const activeYearRangeLabel = `${startYear}–${endYear} 年`
  const countdown = useMemo(() => formatExamCountdown(examDate), [examDate])
  const todayAnsweredCount = Number(todayStats.answeredCount || 0)
  const completionRate = dailyGoal > 0 ? todayAnsweredCount / dailyGoal : 0
  const dailyGoalProgress = Math.min(100, Math.round(completionRate * 100))
  const recentSingleSubjectPreview = recentSingleSubjectResults.slice(0, 5)
  const performanceSummary = useMemo(
    () =>
      getTodayPerformanceSummary({
        targetCount: dailyGoal,
        completedCount: todayAnsweredCount,
        wrongCount: todayStats.wrongCount,
      }),
    [dailyGoal, todayAnsweredCount, todayStats.wrongCount],
  )
  const todayWrongAnalysisInput = useMemo(
    () => getTodayWrongAnalysisItems(),
    [todayStats.answeredCount, todayStats.wrongCount, recentSingleSubjectResults],
  )
  const todayAnalysis = useMemo(
    () =>
      analyzeTodayWrongTags(resolvedTodayWrongQuestions, {
        hasActivity: todayWrongAnalysisInput.hasActivity,
      }),
    [resolvedTodayWrongQuestions, todayWrongAnalysisInput.hasActivity],
  )
  const wrongBookCount = getWrongBookIds().length
  const bookmarkCount = getBookmarkIds().length
  const growthPreview = getGrowthPreviewSummary()
  const growthPreviewBadge =
    growthPreview.streak > 0
      ? `連續 ${growthPreview.streak} 天`
      : growthPreview.todayXp > 0
        ? `今日 +${growthPreview.todayXp} XP`
        : '查看成長分析'

  useEffect(() => {
    setTodayStatsState(getTodayStats())
    setStreak(calculateStreak())
    setRecentSingleSubjectResults(getRecentSingleSubjectExamResults(5))
  }, [])

  useEffect(() => {
    let isCancelled = false

    async function loadMetadata() {
      try {
        setIsMetadataLoading(true)
        setMetadataError('')
        const nextIndex = await getQuestionIndex()

        if (!isCancelled) {
          setQuestionIndex(nextIndex)
        }
      } catch {
        if (!isCancelled) {
          setMetadataError('題庫索引載入失敗，請重新整理頁面後再試。')
        }
      } finally {
        if (!isCancelled) {
          setIsMetadataLoading(false)
        }
      }
    }

    loadMetadata()

    return () => {
      isCancelled = true
    }
  }, [])

  useEffect(() => {
    let isCancelled = false

    async function resolveTodayWrongQuestions() {
      const resolvedItems = await Promise.all(
        todayWrongAnalysisInput.wrongItems.map(async (wrongItem) => {
          const hasLocalTags = extractQuestionTags(wrongItem).length > 0
          const hasQuestionText = Boolean(wrongItem.question || wrongItem.questionText || wrongItem.stem)

          if (hasLocalTags && hasQuestionText) {
            return wrongItem
          }

          try {
            const fullQuestion = await getQuestionByKey(
              wrongItem.key || wrongItem.questionKey || wrongItem.id || '',
            )

            return fullQuestion
              ? {
                  ...fullQuestion,
                  ...wrongItem,
                  userAnswer: wrongItem.userAnswer || fullQuestion.userAnswer || '',
                }
              : wrongItem
          } catch {
            return wrongItem
          }
        }),
      )

      if (!isCancelled) {
        setResolvedTodayWrongQuestions(resolvedItems)
      }
    }

    resolveTodayWrongQuestions()

    return () => {
      isCancelled = true
    }
  }, [todayWrongAnalysisInput.wrongItems])

  useEffect(() => {
    if (!import.meta.env.DEV) {
      return
    }

    console.log('[today-analysis] todayStats', todayStats)
    console.log('[today-analysis] wrongItems source', todayWrongAnalysisInput.sourceItems)
    console.log('[today-analysis] wrongItems count', todayWrongAnalysisInput.wrongItems.length)
    console.log('[today-analysis] resolved fullQuestions count', resolvedTodayWrongQuestions.length)
    console.log(
      '[today-analysis] extracted tags',
      resolvedTodayWrongQuestions.map((question) => ({
        key: question.key || question.id,
        tags: extractQuestionTags(question),
      })),
    )
    console.log('[today-analysis] topTags', todayAnalysis.topTags)
  }, [todayStats, todayWrongAnalysisInput, resolvedTodayWrongQuestions, todayAnalysis])

  const handleStartYearChange = (event) => {
    const nextStartYear = Number(event.target.value)
    const nextEndYear = Math.max(nextStartYear, endYear)
    setSearchParams({
      startYear: String(nextStartYear),
      endYear: String(nextEndYear),
    })
  }

  const handleEndYearChange = (event) => {
    const nextEndYear = Number(event.target.value)
    setSearchParams({
      startYear: String(startYear),
      endYear: String(nextEndYear),
    })
  }

  const handleExamDateChange = (event) => {
    const nextDate = event.target.value
    setExamDate(nextDate)
    setExamDateState(nextDate)
  }

  const commitDailyGoal = (rawValue) => {
    const parsedGoal = Number(rawValue)

    if (!Number.isFinite(parsedGoal) || parsedGoal < MIN_DAILY_GOAL || parsedGoal > MAX_DAILY_GOAL) {
      setDailyGoalError(`請輸入 ${MIN_DAILY_GOAL} 到 ${MAX_DAILY_GOAL} 之間的題數`)
      return
    }

    const normalizedGoal = setDailyGoal(parsedGoal)
    setDailyGoalState(normalizedGoal)
    setDailyGoalInput(String(normalizedGoal))
    setDailyGoalError('')
  }

  const handleDailyGoalInputChange = (event) => {
    const nextValue = event.target.value
    setDailyGoalInput(nextValue)

    if (nextValue === '') {
      setDailyGoalError(`請輸入 ${MIN_DAILY_GOAL} 到 ${MAX_DAILY_GOAL} 之間的題數`)
      return
    }

    const parsedGoal = Number(nextValue)

    if (!Number.isFinite(parsedGoal) || parsedGoal < MIN_DAILY_GOAL || parsedGoal > MAX_DAILY_GOAL) {
      setDailyGoalError(`請輸入 ${MIN_DAILY_GOAL} 到 ${MAX_DAILY_GOAL} 之間的題數`)
      return
    }

    setDailyGoalError('')
  }

  const handleDailyGoalBlur = () => {
    commitDailyGoal(dailyGoalInput)
  }

  const handleDailyGoalKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      commitDailyGoal(dailyGoalInput)
    }
  }

  return (
    <main className="min-h-screen px-4 py-6 md:px-6 md:py-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <section className="relative overflow-hidden rounded-[2.2rem] border border-slate-200 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.16),transparent_34%),linear-gradient(135deg,#ffffff_0%,#ffffff_56%,#eff6ff_100%)] p-6 shadow-sm md:p-8">
          <div className="pointer-events-none absolute -left-16 bottom-0 h-40 w-40 rounded-full bg-blue-100/50 blur-3xl" />
          <div className="pointer-events-none absolute -right-12 -top-16 h-48 w-48 rounded-full bg-sky-200/30 blur-3xl" />
          <div className="grid gap-6 xl:grid-cols-[1.4fr_0.95fr] xl:items-start">
            <div className="space-y-5">
              <div className="space-y-3">
                <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold tracking-[0.18em] text-blue-700">
                  單科限時測驗 Dashboard
                </span>
                <h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl xl:text-[2.8rem]">
                  放射師國考刷題庫
                </h1>
                <p className="max-w-3xl text-base leading-relaxed text-slate-600">
                  選擇科目後立即開始 80 題限時測驗，錯題與收藏題可用於考前快速複習。
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <StatCard
                  label="總題數"
                  value={`${Number(totalQuestions || 0).toLocaleString('zh-TW')} 題`}
                  description="可用題庫量"
                  accent="dark"
                />
                <StatCard label="題庫年份" value={activeYearRangeLabel} description="可隨時調整年份範圍" />
                <StatCard label="每次測驗" value={`${QUIZ_LENGTH} 題 / 60 分鐘`} description="單科限時測驗規則" />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <article className="rounded-[1.6rem] border border-slate-200 bg-white/92 p-5 shadow-sm backdrop-blur">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-500">今日進度</p>
                    <p className="mt-3 text-3xl font-black text-slate-950">
                      {todayAnsweredCount} / {dailyGoal} 題
                    </p>
                    <p className="mt-1 text-sm font-semibold text-blue-700">完成率 {dailyGoalProgress}%</p>
                  </div>
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-right">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600">連續學習</p>
                    <p className="mt-2 text-2xl font-black text-emerald-700">{streak} 天</p>
                  </div>
                </div>
                <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-[width] duration-300"
                    style={{ width: `${dailyGoalProgress}%` }}
                  />
                </div>
              </article>

              <article className="rounded-[1.6rem] border border-slate-200 bg-white/88 p-5 shadow-sm backdrop-blur">
                <p className="text-sm font-semibold text-slate-500">
                  {countdown.status === 'countdown' ? '距離國考還有' : countdown.status === 'passed' ? '考試日期已過' : '考試日期'}
                </p>
                <p className="mt-3 text-3xl font-black tracking-tight text-slate-950">{countdown.label}</p>
                <p className="mt-2 text-sm text-slate-500">{countdown.detail}</p>
              </article>
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.84fr_1.86fr]">
          <div className="order-2 space-y-6 xl:order-1">
            <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">高頻複習入口</p>
                <h2 className="mt-2 text-2xl font-black text-slate-950">快速回到最常用的複習功能</h2>
              </div>

              <div className="mt-5 grid gap-4">
                <QuickActionCard
                  to="/wrong-book"
                  title="錯題本"
                  subtitle="複習答錯題目，優先補強弱點"
                  count={wrongBookCount}
                  countLabel="目前待修復"
                  accentClassName="bg-rose-50 text-rose-700 ring-rose-100"
                />
                <QuickActionCard
                  to="/bookmarks"
                  title="收藏題"
                  subtitle="考前快速回顧已標記題目"
                  count={bookmarkCount}
                  countLabel="目前收藏"
                  accentClassName="bg-violet-50 text-violet-700 ring-violet-100"
                />
                <QuickActionCard
                  to="/growth"
                  title="我的成長"
                  subtitle="查看最近 7 天作答節奏與弱點"
                  accentClassName="bg-sky-50 text-sky-700 ring-sky-100"
                  helperText={growthPreviewBadge}
                />
              </div>
            </section>

            <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">作答條件與目標</p>
                  <h2 className="mt-2 text-2xl font-black text-slate-950">設定今日目標與抽題年份範圍</h2>
                </div>
                <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">
                  民國 {startYear}–{endYear} 年
                </div>
              </div>

              <div className="mt-6 grid gap-5">
                <label className="grid gap-2 text-sm text-slate-600">
                  <span className="font-semibold text-slate-800">考試日期</span>
                  <input
                    type="date"
                    value={examDate}
                    onChange={handleExamDateChange}
                    className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-slate-900 outline-none transition focus:border-blue-400"
                  />
                </label>

                <div className="grid gap-2 text-sm text-slate-600">
                  <span className="font-semibold text-slate-800">今日刷題目標</span>
                  <div className="flex min-w-0 items-center rounded-xl border border-slate-200 bg-slate-50">
                    <input
                      type="number"
                      min={MIN_DAILY_GOAL}
                      max={MAX_DAILY_GOAL}
                      value={dailyGoalInput}
                      onChange={handleDailyGoalInputChange}
                      onBlur={handleDailyGoalBlur}
                      onKeyDown={handleDailyGoalKeyDown}
                      className="h-12 w-full min-w-0 rounded-xl bg-transparent px-4 text-slate-900 outline-none"
                      inputMode="numeric"
                    />
                    <span className="px-4 text-sm font-semibold text-slate-500">題</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {DAILY_GOAL_OPTIONS.map((goal) => (
                      <button
                        key={goal}
                        type="button"
                        onClick={() => commitDailyGoal(goal)}
                        className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                          Number(dailyGoal) === goal
                            ? 'border-blue-200 bg-blue-50 text-blue-700'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        {goal} 題
                      </button>
                    ))}
                  </div>
                  <p className={`text-xs ${dailyGoalError ? 'text-rose-600' : 'text-slate-500'}`}>
                    {dailyGoalError || '可自訂目標題數'}
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="grid gap-2 text-sm text-slate-600">
                    <span className="font-semibold text-slate-800">起始年份</span>
                    <select
                      value={startYear}
                      onChange={handleStartYearChange}
                      disabled={isMetadataLoading || availableYears.length === 0}
                      className="h-12 rounded-xl border border-slate-200 bg-slate-50 px-4 text-slate-900 outline-none transition focus:border-blue-400"
                    >
                      {availableYears.map((year) => (
                        <option key={`start-${year}`} value={year}>
                          民國 {year} 年
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="grid gap-2 text-sm text-slate-600">
                    <span className="font-semibold text-slate-800">終止年份</span>
                    <select
                      value={endYear}
                      onChange={handleEndYearChange}
                      disabled={isMetadataLoading || endYearOptions.length === 0}
                      className="h-12 rounded-xl border border-slate-200 bg-slate-50 px-4 text-slate-900 outline-none transition focus:border-blue-400"
                    >
                      {endYearOptions.map((year) => (
                        <option key={`end-${year}`} value={year}>
                          民國 {year} 年
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="text-sm text-slate-600">
                      <p className="font-semibold text-slate-900">今日建議</p>
                      <p className="mt-1">{performanceSummary.encouragement}</p>
                    </div>
                    <Button type="button" variant="secondary" onClick={() => setShowTodayAnalysis((prev) => !prev)}>
                      分析今日答題狀況
                    </Button>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">{performanceSummary.nextStep}</p>
                  {performanceSummary.extraNote && (
                    <p className="mt-2 text-sm leading-relaxed text-slate-500">{performanceSummary.extraNote}</p>
                  )}

                  {showTodayAnalysis && (
                    <div className="mt-4 space-y-4 rounded-xl border border-slate-200 bg-white p-4">
                      <div>
                        <h3 className="text-sm font-semibold text-slate-900">今日弱點摘要</h3>
                        <p className="mt-2 text-sm leading-relaxed text-slate-600">{todayAnalysis.summary}</p>
                      </div>

                      {todayAnalysis.hasData && todayAnalysis.hasTagData && todayAnalysis.topTags.length > 0 && (
                        <div>
                          <h3 className="text-sm font-semibold text-slate-900">高頻錯題標籤</h3>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {todayAnalysis.topTags.map((tag) => (
                              <span
                                key={tag.value}
                                className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700"
                              >
                                {tag.value} × {tag.count}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {todayAnalysis.hasData && !todayAnalysis.hasTagData && todayAnalysis.topSubjects.length > 0 && (
                        <div>
                          <h3 className="text-sm font-semibold text-slate-900">主要集中科目</h3>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {todayAnalysis.topSubjects.map((subject) => (
                              <span
                                key={subject.value}
                                className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700"
                              >
                                {subject.value}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      <div>
                        <h3 className="text-sm font-semibold text-slate-900">建議接下來複習方向</h3>
                        <p className="mt-2 text-sm leading-relaxed text-slate-600">{todayAnalysis.reviewSuggestion}</p>
                      </div>
                    </div>
                  )}
                </div>

                <p className="text-xs text-slate-500">
                  {isMetadataLoading
                    ? '正在載入題庫索引...'
                    : `目前套用範圍：民國 ${startYear} 年至 ${endYear} 年`}
                </p>
              </div>
            </section>
          </div>

          <div className="order-1 space-y-6 xl:order-2">
            <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="h-10 w-1 rounded-full bg-blue-600" />
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">單科限時測驗</p>
                      <h2 className="mt-1 text-2xl font-black text-slate-950">選擇科目開始作答</h2>
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-slate-600">
                    目前設定：{activeYearRangeLabel}｜每次 {QUIZ_LENGTH} 題｜60 分鐘
                  </p>
                </div>
              </div>

              {metadataError && (
                <div className="mt-5 rounded-[1.25rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {metadataError}
                </div>
              )}

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {isMetadataLoading ? (
                  <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600 md:col-span-2">
                    正在載入科目題庫資訊...
                  </div>
                ) : (
                  subjectSummaries.map((item) => (
                    <SubjectCard
                      key={item.subject}
                      subject={item.subject}
                      totalQuestions={item.totalQuestions}
                      yearRange={activeYearRangeLabel}
                      search={search}
                    />
                  ))
                )}
              </div>
            </section>

            <section className="rounded-[1.5rem] border border-slate-800 bg-[linear-gradient(135deg,#0f172a_0%,#172554_65%,#1d4ed8_100%)] p-5 text-white shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="max-w-2xl">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-xl font-black tracking-tight">完整六科模擬考</h2>
                    <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold tracking-[0.18em] text-blue-100">
                      COMING SOON
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-slate-200">
                    正式模考入口預留中，未來將與單科測驗紀錄分開儲存與顯示。
                  </p>
                </div>

                <Button
                  type="button"
                  variant="secondary"
                  className="border-white/20 bg-white/10 text-white hover:bg-white/15"
                  disabled
                >
                  即將推出
                </Button>
              </div>
            </section>

            <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">最近 5 次單科測驗</p>
                  <p className="mt-1 text-sm text-slate-600">近期作答紀錄保留在首頁下方，避免干擾主要刷題入口。</p>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                {recentSingleSubjectPreview.length > 0 ? (
                  recentSingleSubjectPreview.map((result) => {
                    const score = Number(result.score || 0)

                    return (
                      <article
                        key={`${result.savedAt}-${result.subject}`}
                        className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4"
                      >
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2 text-sm">
                              <span className="font-semibold text-slate-900">{formatDateLabel(result.date)}</span>
                              <span className="text-slate-300">•</span>
                              <span className="text-slate-700">{result.subject}</span>
                            </div>
                            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
                              <div
                                className="h-full rounded-full bg-blue-600 transition-[width] duration-300"
                                style={{ width: `${getScoreBarWidth(score)}%` }}
                              />
                            </div>
                          </div>
                          <div className="text-left lg:min-w-[120px] lg:text-right">
                            <p className="text-lg font-black text-slate-950">{score.toFixed(2)} 分</p>
                            <p className="mt-1 text-xs text-slate-500">
                              {result.correctCount} 對 / {result.wrongCount} 錯 / {result.unansweredCount} 未作答
                            </p>
                          </div>
                        </div>
                      </article>
                    )
                  })
                ) : (
                  <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-sm text-slate-500">
                    完成單科限時測驗後，這裡會顯示最近 5 次測驗紀錄。
                  </div>
                )}
              </div>
            </section>
          </div>
        </section>
      </div>
    </main>
  )
}

export default HomePage
