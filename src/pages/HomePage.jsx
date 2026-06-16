import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Button from '../components/Button'
import BackLink from '../components/BackLink'
import Navbar from '../components/Navbar'
import StudyStatusStrip from '../components/StudyStatusStrip'
import SubjectCard from '../components/SubjectCard'
import SeoMeta from '../components/SeoMeta'
import { QUIZ_LENGTH } from '../utils/quizUtils'
import {
  getDailyGoal,
  getPracticeYearRange,
  getRecentSingleSubjectExamResults,
  getTodayStats,
} from '../utils/storageUtils'
import {
  getAvailableYearsFromIndex,
  getSubjectSummariesFromIndex,
} from '../utils/subjectUtils'
import { getQuestionIndex } from '../utils/questionDataLoader'

function formatDateLabel(dateString) {
  return dateString ? String(dateString).replaceAll('-', '/') : '--'
}

function getScoreBarWidth(score) {
  return Math.max(10, Math.min(100, Number(score || 0)))
}

function MiniStat({ label, value }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-black text-slate-950">{value}</p>
    </article>
  )
}

function HomePage() {
  const [searchParams] = useSearchParams()
  const [questionIndex, setQuestionIndex] = useState([])
  const [isMetadataLoading, setIsMetadataLoading] = useState(true)
  const [metadataError, setMetadataError] = useState('')
  const [todayStats, setTodayStatsState] = useState(() => getTodayStats())
  const [recentSingleSubjectResults, setRecentSingleSubjectResults] = useState(() =>
    getRecentSingleSubjectExamResults(5),
  )

  const availableYears = useMemo(() => getAvailableYearsFromIndex(questionIndex), [questionIndex])
  const savedYearRange = useMemo(() => getPracticeYearRange(), [])
  const defaultStartYear = availableYears.includes(savedYearRange.startYear)
    ? savedYearRange.startYear
    : availableYears[0] ?? 100
  const defaultEndYear = availableYears.includes(savedYearRange.endYear)
    ? savedYearRange.endYear
    : availableYears[availableYears.length - 1] ?? 115
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
  const search = `?startYear=${startYear}&endYear=${endYear}`
  const activeYearRangeLabel = `${startYear}–${endYear} 年`
  const todayAnsweredCount = Number(todayStats.answeredCount || 0)
  const dailyGoal = getDailyGoal()
  const recentSingleSubjectPreview = recentSingleSubjectResults.slice(0, 5)

  useEffect(() => {
    setTodayStatsState(getTodayStats())
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

  return (
    <main className="min-h-screen px-4 py-6 md:px-6 md:py-8">
      <SeoMeta
        title="放射師國考題庫｜六大科目歷屆試題練習"
        description="放射師國考題庫提供六大考科歷屆試題、單科限時測驗、錯題本、收藏題與成長追蹤。"
        canonicalPath="/radiographer"
      />
      <div className="mx-auto flex max-w-6xl flex-col gap-5">
        <BackLink label="返回國考科系選擇" fallbackTo="/exams" />
        <Navbar subtitle="放射師國考" title="選擇科目開始作答" />
        <StudyStatusStrip compact />

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-black text-slate-950 md:text-3xl">放射師國考</h1>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                選一科開始 {QUIZ_LENGTH} 題限時測驗。
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button as={Link} to="/wrong-review" variant="secondary">
                複習錯題
              </Button>
              <Button as={Link} to="/settings" variant="ghost">
                調整設定
              </Button>
            </div>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <MiniStat label="年份範圍" value={activeYearRangeLabel} />
            <MiniStat label="每日目標" value={`${dailyGoal} 題`} />
            <MiniStat label="今日進度" value={`${todayAnsweredCount} / ${dailyGoal} 題`} />
          </div>

          {metadataError && (
            <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {metadataError}
            </div>
          )}

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {isMetadataLoading ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600 md:col-span-2">
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

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-base font-black text-slate-950">最近 5 次單科測驗</h2>
            <p className="text-sm text-slate-500">作答後會自動更新</p>
          </div>
          <div className="mt-4 space-y-3">
            {recentSingleSubjectPreview.length > 0 ? (
              recentSingleSubjectPreview.map((result) => {
                const score = Number(result.score || 0)

                return (
                  <article key={`${result.savedAt}-${result.subject}`} className="rounded-xl bg-slate-50 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-900">
                          {formatDateLabel(result.date)}｜{result.subject}
                        </p>
                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
                          <div className="h-full rounded-full bg-blue-600" style={{ width: `${getScoreBarWidth(score)}%` }} />
                        </div>
                      </div>
                      <p className="text-sm font-black text-slate-950">{score.toFixed(2)} 分</p>
                    </div>
                  </article>
                )
              })
            ) : (
              <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm text-slate-500">
                完成測驗後，這裡會顯示最近紀錄。
              </p>
            )}
          </div>
        </section>

        <section aria-label="網站功能介紹" className="sr-only">
          <h1>放射師國考刷題庫</h1>
          <p>本網站提供醫事放射師國考歷屆試題練習、錯題本、收藏題、科目篩選、模擬考與個人成長追蹤。</p>
          <h2>主要功能</h2>
          <ul>
            <li>歷屆試題刷題</li>
            <li>科目分類練習</li>
            <li>錯題本</li>
            <li>收藏題</li>
            <li>模擬考</li>
            <li>最近作答紀錄</li>
            <li>個人成長分析</li>
            <li>弱科提醒</li>
          </ul>
        </section>
      </div>
    </main>
  )
}

export default HomePage
