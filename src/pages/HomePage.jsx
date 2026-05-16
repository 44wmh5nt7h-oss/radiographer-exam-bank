import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Button from '../components/Button'
import SubjectCard from '../components/SubjectCard'
import { QUIZ_LENGTH, formatTime } from '../utils/quizUtils'
import {
  analyzeTodayWrongTags,
  calculateStreak,
  extractQuestionTags,
  getDailyGoal,
  getExamDate,
  getTodayWrongAnalysisItems,
  getTodayPerformanceSummary,
  getRecentFullMockExamResults,
  getRecentSingleSubjectExamResults,
  getSingleSubjectScoreTrend,
  getFullMockExamScoreTrend,
  getTodayStats,
  setDailyGoal,
  setExamDate,
} from '../utils/storageUtils'
import {
  getAvailableYearsFromIndex,
  getSubjectSummariesFromIndex,
} from '../utils/subjectUtils'
import { getQuestionByKey, getQuestionIndex } from '../utils/questionDataLoader'

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
      label: `距離國考還有 ${diffDays} 天`,
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

function formatDurationLabel(seconds) {
  if (!Number.isFinite(Number(seconds)) || Number(seconds) <= 0) {
    return '00:00'
  }

  return formatTime(Number(seconds))
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
  const [recentFullMockResults, setRecentFullMockResults] = useState(() =>
    getRecentFullMockExamResults(5),
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
  const hasMetDailyGoal = todayAnsweredCount >= dailyGoal
  const remainingQuestionCount = Math.max(0, dailyGoal - todayAnsweredCount)
  const recentSingleSubjectPreview = recentSingleSubjectResults.slice(0, 3)
  const recentFullMockPreview = recentFullMockResults.slice(0, 3)
  const hasStartedToday = todayAnsweredCount > 0
  const singleSubjectTrend = getSingleSubjectScoreTrend(5)
  const fullMockTrend = getFullMockExamScoreTrend(5)
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
  const shouldSplitGoal = dailyGoal > 80

  useEffect(() => {
    setTodayStatsState(getTodayStats())
    setStreak(calculateStreak())
    setRecentSingleSubjectResults(getRecentSingleSubjectExamResults(5))
    setRecentFullMockResults(getRecentFullMockExamResults(5))
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
    <main className="px-4 py-10">
      <section className="mx-auto w-full max-w-7xl overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_30px_80px_rgba(15,23,42,0.08)]">
        <div className="grid gap-10 p-5 sm:p-8 xl:grid-cols-[1.15fr_0.95fr] xl:p-12">
          <div className="space-y-6 xl:pr-4">
            <span className="inline-flex rounded-xl border border-slate-300 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700">
              醫事放射師國考單科限時測驗
            </span>
            <div className="space-y-4">
              <h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl md:text-5xl">
                放射師國考刷題庫
              </h1>
              <p className="max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
                依單科限時測驗模式提供作答入口。每次從指定考科隨機抽出 {QUIZ_LENGTH} 題，採 60 分鐘倒數、可切換題目與統一繳交的考試流程。
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <div className="rounded-[1.5rem] border border-slate-900 bg-slate-900 p-5 text-white md:col-span-2 xl:col-span-1 xl:p-6">
                <p className="text-sm uppercase tracking-[0.2em] text-slate-300">目前篩選題數</p>
                <p className="mt-4 text-5xl font-black">{totalQuestions}</p>
                <p className="mt-3 text-sm leading-relaxed text-slate-300">
                  已套用所選年份範圍內的結構化歷屆題庫資料。
                </p>
              </div>

              <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5 xl:p-6">
                <p className="text-sm uppercase tracking-[0.2em] text-slate-600">題庫年份</p>
                <p className="mt-4 text-4xl font-black text-slate-950">{activeYearRangeLabel}</p>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">
                  UI 年份顯示已統一為民國 100 年至 115 年。
                </p>
              </div>

              <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 xl:p-6">
                <p className="text-sm uppercase tracking-[0.2em] text-slate-600">作答規則</p>
                <p className="mt-4 text-4xl font-black text-slate-950">80 / 60</p>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">
                  每科 80 題，作答時間 60 分鐘，作答方式與計分規則維持不變。
                </p>
              </div>
            </div>

            <section className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5 shadow-[0_16px_38px_rgba(15,23,42,0.05)] sm:p-6">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
                    國考備考戰情中心
                  </p>
                  <h2 className="mt-2 text-2xl font-black text-slate-950">每日進度與測驗追蹤</h2>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    先用本地紀錄建立備考節奏，後續再串接 AI 詳解與更完整的學習分析。
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-left shadow-[0_10px_24px_rgba(15,23,42,0.04)] lg:text-right">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">國考倒數日</p>
                  <p className="mt-2 text-2xl font-black text-slate-950">{countdown.label}</p>
                  <p className="mt-1 text-sm text-slate-500">{countdown.detail}</p>
                </div>
              </div>

              <div className="mt-6 grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
                <div className="grid gap-4">
                  <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
                    <p className="text-sm font-semibold text-slate-900">備考設定</p>
                    <div className="mt-4 grid gap-4">
                      <label className="grid min-w-0 gap-2 text-sm text-slate-600">
                        <span>考試日期</span>
                        <input
                          type="date"
                          value={examDate}
                          onChange={handleExamDateChange}
                          className="rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-500"
                        />
                      </label>
                      <div className="grid min-w-0 gap-2 text-sm text-slate-600">
                        <span>今日刷題目標</span>
                        <div className="grid gap-2">
                          <div className="flex min-w-0 items-center rounded-xl border border-slate-300 bg-slate-50">
                            <input
                              type="number"
                              min={MIN_DAILY_GOAL}
                              max={MAX_DAILY_GOAL}
                              value={dailyGoalInput}
                              onChange={handleDailyGoalInputChange}
                              onBlur={handleDailyGoalBlur}
                              onKeyDown={handleDailyGoalKeyDown}
                              className="w-full min-w-0 rounded-xl bg-transparent px-4 py-3 text-slate-900 outline-none"
                              inputMode="numeric"
                            />
                            <span className="shrink-0 px-4 text-sm font-semibold text-slate-500">題</span>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {DAILY_GOAL_OPTIONS.map((goal) => (
                            <button
                              key={goal}
                              type="button"
                              onClick={() => commitDailyGoal(goal)}
                              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-500 hover:bg-slate-50"
                            >
                              {goal} 題
                            </button>
                          ))}
                        </div>
                        <p className={`text-xs ${dailyGoalError ? 'text-rose-600' : 'text-slate-500'}`}>
                          {dailyGoalError || '可自訂目標題數'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">今日刷題進度</p>
                        <p className="mt-2 text-3xl font-black text-slate-950">
                          {todayAnsweredCount} / {dailyGoal}
                        </p>
                        <p className="mt-2 text-sm text-slate-600">
                          今日答對 {todayStats.correctCount} 題，答錯 {todayStats.wrongCount} 題
                        </p>
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-center">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                          連續學習
                        </p>
                        <p className="mt-2 text-3xl font-black text-slate-950">{streak} 天</p>
                        <p className="mt-2 text-sm text-slate-600">
                          {hasStartedToday ? '今天已開始作答，繼續保持節奏。' : '今天還沒開始刷題'}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5">
                      <div className="h-3 overflow-hidden rounded-full bg-slate-200">
                        <div
                          className="h-full rounded-full bg-slate-900 transition-[width] duration-300"
                          style={{ width: `${dailyGoalProgress}%` }}
                        />
                      </div>
                      <div className="mt-3 flex items-center justify-between text-sm text-slate-500">
                        <span>完成度 {dailyGoalProgress}%</span>
                        <span>{hasMetDailyGoal ? '今日目標已達成，做得很好。' : '持續作答即可累積進度。'}</span>
                      </div>
                    </div>

                    <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                      <p className="text-sm font-semibold text-slate-900">今日進度表</p>
                      <div className="mt-3 grid gap-2 text-sm text-slate-600">
                        <div className="flex items-center justify-between gap-4">
                          <span>今日目標題數</span>
                          <span className="font-semibold text-slate-900">{dailyGoal} 題</span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span>已完成題數</span>
                          <span className="font-semibold text-slate-900">{todayAnsweredCount} 題</span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span>剩餘題數</span>
                          <span className="font-semibold text-slate-900">{remainingQuestionCount} 題</span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span>完成率</span>
                          <span className="font-semibold text-slate-900">{dailyGoalProgress}%</span>
                        </div>
                      </div>
                      <p className="mt-3 text-sm leading-relaxed text-slate-600">{performanceSummary.nextStep}</p>
                      {shouldSplitGoal && (
                        <p className="mt-2 text-xs leading-relaxed text-slate-500">
                          建議分成 2～3 回合完成，避免疲勞。
                        </p>
                      )}
                    </div>

                    <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                      <div className="flex flex-col gap-4">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">今日建議</p>
                          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                            AI 國考教練
                          </p>
                        </div>

                        <div className="space-y-3">
                          <p className="text-sm leading-relaxed text-slate-700">
                            {performanceSummary.encouragement}
                          </p>
                          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
                            <p className="font-semibold text-slate-900">{performanceSummary.targetStatus}</p>
                            <p className="mt-2 leading-relaxed">{performanceSummary.nextStep}</p>
                            {performanceSummary.extraNote && (
                              <p className="mt-2 leading-relaxed text-slate-500">{performanceSummary.extraNote}</p>
                            )}
                          </div>
                        </div>

                        <Button
                          type="button"
                          variant="secondary"
                          className="self-start border-slate-900 text-slate-900"
                          onClick={() => setShowTodayAnalysis((prev) => !prev)}
                        >
                          分析今日答題狀況
                        </Button>

                        {showTodayAnalysis && (
                          <div className="space-y-4 rounded-xl border border-slate-200 bg-white px-4 py-4">
                            <div>
                              <h3 className="text-sm font-semibold text-slate-900">今日弱點摘要</h3>
                              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                                {todayAnalysis.summary}
                              </p>
                            </div>

                            {todayAnalysis.hasData && todayAnalysis.hasTagData && todayAnalysis.topTags.length > 0 && (
                              <div>
                                <h3 className="text-sm font-semibold text-slate-900">高頻錯題標籤</h3>
                                <div className="mt-2 flex flex-wrap gap-2">
                                  {todayAnalysis.topTags.map((tag) => (
                                    <span
                                      key={tag.value}
                                      className="rounded-full border border-slate-300 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700"
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
                                <div className="mt-2 flex flex-wrap gap-2">
                                  {todayAnalysis.topSubjects.map((subject) => (
                                    <span
                                      key={subject.value}
                                      className="rounded-full border border-slate-300 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700"
                                    >
                                      {subject.value}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            <div>
                              <h3 className="text-sm font-semibold text-slate-900">建議接下來複習方向</h3>
                              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                                {todayAnalysis.reviewSuggestion}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4">
                  <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">最近 3 次單科測驗紀錄</p>
                        <p className="mt-2 text-sm text-slate-600">
                          交卷後會自動保存最近的單科限時測驗結果。
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 space-y-3">
                      {recentSingleSubjectPreview.length > 0 ? (
                        recentSingleSubjectPreview.map((result) => (
                          <div
                            key={`${result.savedAt}-${result.subject}`}
                            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4"
                          >
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                              <div>
                                <p className="text-sm font-semibold text-slate-900">{result.subject}</p>
                                <p className="mt-1 text-xs text-slate-500">
                                  {result.date}｜{result.totalQuestions} 題｜{result.yearRange || '未設定年份範圍'}｜作答時間 {formatDurationLabel(result.elapsedTime)}
                                </p>
                              </div>
                              <div className="text-left lg:text-right">
                                <p className="text-2xl font-black text-slate-950">
                                  {Number(result.score || 0).toFixed(2)}
                                </p>
                                <p className="text-xs text-slate-500">
                                  答對 {result.correctCount}｜答錯 {result.wrongCount}｜未作答 {result.unansweredCount}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                          尚無單科測驗紀錄。完成單科限時測驗後，這裡會顯示最近成績。
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
                    <p className="text-sm font-semibold text-slate-900">最近 5 次單科測驗分數趨勢</p>
                    <p className="mt-2 text-sm text-slate-600">
                      先以精簡趨勢條顯示近期單科測驗分數，避免額外引入大型圖表套件。
                    </p>
                    <div className="mt-4 space-y-3">
                      {singleSubjectTrend.length > 0 ? (
                        singleSubjectTrend.map((result, index) => {
                          const score = Number(result.score || 0)
                          const width = Math.max(8, Math.min(100, score))

                          return (
                            <div key={`${result.savedAt}-${index}`} className="grid gap-2">
                              <div className="flex items-center justify-between gap-4 text-sm">
                                <span className="font-medium text-slate-700">
                                  {result.date}｜{result.subject}
                                </span>
                                <span className="font-semibold text-slate-900">{score.toFixed(2)} 分</span>
                              </div>
                              <div className="h-3 overflow-hidden rounded-full bg-slate-200">
                                <div
                                  className="h-full rounded-full bg-slate-800 transition-[width] duration-300"
                                  style={{ width: `${width}%` }}
                                />
                              </div>
                            </div>
                          )
                        })
                      ) : (
                        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                          尚無可用分數趨勢資料。
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">完整六科模擬考紀錄</p>
                        <p className="mt-2 text-sm text-slate-600">
                          完整六科流程上線後，這裡會獨立保存完整模考成績。
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 space-y-3">
                      {recentFullMockPreview.length > 0 ? (
                        recentFullMockPreview.map((result) => (
                          <div
                            key={`${result.savedAt}-${result.date}`}
                            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4"
                          >
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                              <div>
                                <p className="text-sm font-semibold text-slate-900">{result.date}</p>
                                <p className="mt-1 text-xs text-slate-500">
                                  {result.totalQuestions} 題｜作答時間 {formatDurationLabel(result.elapsedTime)}
                                </p>
                              </div>
                              <div className="text-left lg:text-right">
                                <p className="text-2xl font-black text-slate-950">
                                  {Number(result.totalScore || 0).toFixed(2)}
                                </p>
                                <p className="text-xs text-slate-500">
                                  答對 {result.totalCorrectCount}｜答錯 {result.totalWrongCount}｜未作答 {result.totalUnansweredCount}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                          目前尚無完整六科模擬考紀錄。
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
                    <p className="text-sm font-semibold text-slate-900">完整六科模擬考分數趨勢</p>
                    <p className="mt-2 text-sm text-slate-600">
                      單科測驗趨勢與完整模考趨勢分開呈現，避免混用。
                    </p>
                    <div className="mt-4 space-y-3">
                      {fullMockTrend.length > 0 ? (
                        fullMockTrend.map((result, index) => {
                          const score = Number(result.totalScore || 0)
                          const width = Math.max(8, Math.min(100, score))

                          return (
                            <div key={`${result.savedAt}-${index}`} className="grid gap-2">
                              <div className="flex items-center justify-between gap-4 text-sm">
                                <span className="font-medium text-slate-700">{result.date}</span>
                                <span className="font-semibold text-slate-900">{score.toFixed(2)} 分</span>
                              </div>
                              <div className="h-3 overflow-hidden rounded-full bg-slate-200">
                                <div
                                  className="h-full rounded-full bg-slate-800 transition-[width] duration-300"
                                  style={{ width: `${width}%` }}
                                />
                              </div>
                            </div>
                          )
                        })
                      ) : (
                        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                          完成完整六科模擬考後，這裡會顯示總分趨勢。
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>

          <div className="space-y-4">
            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
                科目入口
              </p>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                請選擇應試科目進入單科限時測驗。若題庫不足 80 題，系統將保留現有規則並顯示提示訊息。
              </p>
            </div>

            <section className="rounded-[1.5rem] border border-slate-200 bg-slate-950 p-5 text-white shadow-[0_12px_30px_rgba(15,23,42,0.08)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                    Coming Soon
                  </p>
                  <h2 className="mt-2 text-xl font-bold">完整六科模擬考</h2>
                  <div className="mt-4 grid gap-2 text-sm text-slate-300">
                    <p>預留完整六科串接後的正式模考入口。</p>
                    <p>未來將與單科測驗紀錄分開儲存與顯示。</p>
                  </div>
                </div>
                <span className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-300">
                  即將推出
                </span>
              </div>
            </section>

            <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.04)]">
              <p className="text-sm font-semibold text-slate-800">選擇題目年份範圍</p>
              {metadataError && (
                <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {metadataError}
                </p>
              )}
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <label className="grid gap-2 text-sm text-slate-600">
                  <span>起始年份</span>
                  <select
                    value={startYear}
                    onChange={handleStartYearChange}
                    disabled={isMetadataLoading || availableYears.length === 0}
                    className="rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-500"
                  >
                    {availableYears.map((year) => (
                      <option key={`start-${year}`} value={year}>
                        民國 {year} 年
                      </option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-2 text-sm text-slate-600">
                  <span>終止年份</span>
                  <select
                    value={endYear}
                    onChange={handleEndYearChange}
                    disabled={isMetadataLoading || endYearOptions.length === 0}
                    className="rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-500"
                  >
                    {endYearOptions.map((year) => (
                      <option key={`end-${year}`} value={year}>
                        民國 {year} 年
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <p className="mt-3 text-sm text-slate-500">
                {isMetadataLoading
                  ? '正在載入題庫索引...'
                  : `目前套用範圍：民國 ${startYear} 年至 ${endYear} 年`}
              </p>
            </section>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Button as={Link} to="/wrong-book" variant="secondary">
                錯題本
              </Button>
              <Button as={Link} to="/bookmarks" variant="secondary">
                收藏題
              </Button>
            </div>

            <div className="grid gap-4">
              {isMetadataLoading ? (
                <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
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
          </div>
        </div>
      </section>
    </main>
  )
}

export default HomePage
