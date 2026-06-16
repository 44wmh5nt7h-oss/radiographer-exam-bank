import { Link } from 'react-router-dom'
import BackLink from '../components/BackLink'
import Button from '../components/Button'
import Navbar from '../components/Navbar'
import SeoMeta from '../components/SeoMeta'
import StudyStatusStrip from '../components/StudyStatusStrip'
import { EXAM_SUBJECTS } from '../constants/subjects'
import {
  getSevenDayGrowthData,
  getSubjectPowerStats,
} from '../utils/growthUtils'
import {
  getStudyActionRecommendation,
  getTodayFeedbackSummary,
  getWrongQuestionStatusSummary,
} from '../utils/recommendationUtils'

function CoreMetric({ label, value, hint }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-black text-slate-950">{value}</p>
      {hint ? <p className="mt-2 text-sm text-slate-500">{hint}</p> : null}
    </article>
  )
}

function GrowthPage() {
  const sevenDayTrend = getSevenDayGrowthData()
  const subjectPower = getSubjectPowerStats()
  const wrongSummary = getWrongQuestionStatusSummary()
  const recommendation = getStudyActionRecommendation()
  const todayFeedback = getTodayFeedbackSummary()
  const weakestSubject = subjectPower.weakestSubject
  const subjectRows = EXAM_SUBJECTS.map((subject) => {
    const row = subjectPower.rows.find((item) => item.subject === subject.name)
    return {
      name: subject.name,
      accuracy: row?.accuracy ?? null,
      answeredCount: row?.answeredCount ?? 0,
      needsFocus: Boolean(weakestSubject && weakestSubject.subject === subject.name),
    }
  })

  return (
    <main className="min-h-screen px-4 py-6 md:px-6 md:py-8">
      <SeoMeta
        title="我的成長｜刷題紀錄、科目戰力與錯題清除"
        description="我的成長頁呈現本週作答、目前正確率、待複習錯題與下一步學習建議。"
        canonicalPath="/growth"
      />
      <div className="mx-auto flex max-w-6xl flex-col gap-5">
        <BackLink label="返回首頁" fallbackTo="/" />
        <Navbar subtitle="我的成長" title="下一步該練什麼？" />
        <StudyStatusStrip compact />

        <section className="grid gap-3 md:grid-cols-3">
          <CoreMetric label="本週作答" value={`${sevenDayTrend.totalAnswered} 題`} hint="最近 7 天累積" />
          <CoreMetric
            label="目前正確率"
            value={sevenDayTrend.totalAnswered > 0 ? `${sevenDayTrend.averageAccuracy}%` : '—'}
            hint={sevenDayTrend.totalAnswered > 0 ? '最近 7 天平均' : '完成作答後顯示'}
          />
          <CoreMetric label="待複習錯題" value={`${wrongSummary.dueWrongCount} 題`} hint="今天建議先處理" />
        </section>

        <section className="rounded-2xl border border-blue-200 bg-blue-50 p-5 shadow-sm md:p-6">
          <h2 className="text-xl font-black text-slate-950">下一步建議</h2>
          <p className="mt-3 text-sm leading-7 text-slate-700">{recommendation.description}</p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Button as={Link} to={recommendation.primaryActionPath}>
              {recommendation.primaryActionLabel}
            </Button>
            {recommendation.secondaryActionPath && recommendation.secondaryActionLabel ? (
              <Button as={Link} to={recommendation.secondaryActionPath} variant="secondary">
                {recommendation.secondaryActionLabel}
              </Button>
            ) : null}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-black text-slate-950">今日作答回饋</h2>
          <p className="mt-3 text-sm leading-7 text-slate-700">{todayFeedback.summary}</p>
          {todayFeedback.focusItems.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {todayFeedback.focusItems.map((item) => (
                <span key={item} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
                  {item}
                </span>
              ))}
            </div>
          ) : null}
          <p className="mt-3 text-sm font-semibold text-slate-700">{todayFeedback.nextStep}</p>
        </section>

        <section className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-black text-slate-950">錯題狀態</h2>
                <Button as={Link} to="/wrong-review" variant="secondary">
                  複習錯題
                </Button>
              </div>
            <p className="mt-3 text-sm leading-7 text-slate-700">{wrongSummary.conclusion}</p>
            <div className="mt-4 grid gap-3">
              <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                <span className="text-sm font-semibold text-slate-600">待複習</span>
                <span className="text-lg font-black text-slate-950">{wrongSummary.dueWrongCount} 題</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                <span className="text-sm font-semibold text-slate-600">高風險</span>
                <span className="text-lg font-black text-slate-950">{wrongSummary.highRiskCount} 題</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                <span className="text-sm font-semibold text-slate-600">已清除</span>
                <span className="text-lg font-black text-slate-950">{wrongSummary.clearedCount} 題</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                <span className="text-sm font-semibold text-slate-600">今日新增 / 已複習</span>
                <span className="text-lg font-black text-slate-950">{wrongSummary.todayWrongCount} / {wrongSummary.todayReviewedCount}</span>
              </div>
            </div>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-black text-slate-950">各科狀況</h2>
            <div className="mt-4 space-y-3">
              {subjectRows.map((row) => (
                <Link
                  key={row.name}
                  to={`/quiz/${encodeURIComponent(row.name)}`}
                  className="block rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 transition hover:bg-white"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-slate-900">{row.name}</p>
                        {row.needsFocus ? (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800">
                            需加強
                          </span>
                        ) : null}
                      </div>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
                        <div
                          className={`h-full rounded-full ${row.needsFocus ? 'bg-amber-500' : 'bg-blue-600'}`}
                          style={{ width: `${row.accuracy === null ? 0 : Math.max(8, row.accuracy)}%` }}
                        />
                      </div>
                    </div>
                    <div className="w-20 text-right">
                      <p className="text-lg font-black text-slate-950">{row.accuracy === null ? '--' : `${row.accuracy}%`}</p>
                      <p className="text-xs text-slate-500">{row.answeredCount > 0 ? `${row.answeredCount} 題` : '尚無資料'}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </article>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-950">最近 7 天</h2>
              <p className="mt-1 text-sm text-slate-500">{sevenDayTrend.insight}</p>
            </div>
            {sevenDayTrend.totalAnswered === 0 ? (
              <Button as={Link} to="/radiographer" variant="secondary">
                開始刷題
              </Button>
            ) : null}
          </div>
          {sevenDayTrend.totalAnswered > 0 ? (
            <div className="mt-4 grid grid-cols-7 gap-2">
              {sevenDayTrend.days.map((day) => (
                <div key={day.dateKey} className="text-center">
                  <div className="flex h-20 items-end justify-center rounded-lg bg-slate-50 px-1 py-2">
                    <div
                      className="w-5 rounded-t bg-blue-600"
                      style={{
                        height: `${sevenDayTrend.maxAnsweredCount > 0
                          ? Math.max(6, Math.round((day.answeredCount / sevenDayTrend.maxAnsweredCount) * 56))
                          : 0}px`,
                      }}
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500">{day.label}</p>
                  <p className="text-xs font-bold text-slate-700">{day.answeredCount}</p>
                </div>
              ))}
            </div>
          ) : null}
        </section>
      </div>
    </main>
  )
}

export default GrowthPage
