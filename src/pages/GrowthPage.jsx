import { Link } from 'react-router-dom'
import Button from '../components/Button'
import Navbar from '../components/Navbar'
import {
  getPersonalGrowthRecords,
  getSevenDayGrowthData,
  getSubjectPowerStats,
  getWrongClearanceSummary,
} from '../utils/growthUtils'

function EmptyState({ title, description, actionLabel, actionTo }) {
  return (
    <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center">
      <h3 className="text-lg font-bold text-slate-950">{title}</h3>
      <p className="mt-3 text-sm leading-relaxed text-slate-600">{description}</p>
      {actionLabel && actionTo && (
        <div className="mt-5">
          <Button as={Link} to={actionTo}>
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  )
}

function MetricBadge({ label, value, hint, tone = 'slate' }) {
  const toneMap = {
    slate: 'border-slate-200 bg-slate-50 text-slate-900',
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    blue: 'border-blue-200 bg-blue-50 text-blue-800',
    amber: 'border-amber-200 bg-amber-50 text-amber-800',
    rose: 'border-rose-200 bg-rose-50 text-rose-800',
  }

  return (
    <article className={`rounded-[1.25rem] border p-4 shadow-sm ${toneMap[tone]}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] opacity-75">{label}</p>
      <p className="mt-2 text-2xl font-black">{value}</p>
      {hint ? <p className="mt-1 text-xs opacity-75">{hint}</p> : null}
    </article>
  )
}

function GrowthPage() {
  const sevenDayTrend = getSevenDayGrowthData()
  const subjectPower = getSubjectPowerStats()
  const wrongClearance = getWrongClearanceSummary()
  const personalRecords = getPersonalGrowthRecords()
  const weakestSubjectLabel = subjectPower.weakestSubject?.subject || '尚待累積'
  const weakestSubjectHint = subjectPower.weakestSubject
    ? `${subjectPower.weakestSubject.accuracy}% 正確率`
    : '每科完成 10 題後顯示'

  return (
    <main className="min-h-screen px-4 py-6 md:px-6 md:py-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <Navbar subtitle="My Growth" title="我的成長" />

        <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="flex flex-col gap-6">
            <div>
              <h2 className="text-2xl font-black text-slate-950">追蹤最近作答節奏、正確率與弱點科目。</h2>
              <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-600">
                這裡只看自己的進步，不和其他人比較。重點是確認最近有沒有持續練習、哪些科目需要加強，以及錯題是否慢慢被清掉。
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <MetricBadge
                label="本週總刷題"
                value={`${sevenDayTrend.totalAnswered} 題`}
                hint="最近 7 天累積"
                tone="blue"
              />
              <MetricBadge
                label="連續刷題"
                value={`${sevenDayTrend.streak} 天`}
                hint={sevenDayTrend.streak > 0 ? '持續累積中' : '今天開始也算'}
                tone="emerald"
              />
              <MetricBadge
                label="高風險錯題"
                value={`${wrongClearance.highRiskCount} 題`}
                hint="仍需回頭複習"
                tone={wrongClearance.highRiskCount > 0 ? 'rose' : 'slate'}
              />
              <MetricBadge
                label="最需加強科目"
                value={weakestSubjectLabel}
                hint={weakestSubjectHint}
                tone={subjectPower.weakestSubject ? 'amber' : 'slate'}
              />
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <article className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">7 日趨勢</p>
                <h3 className="mt-2 text-2xl font-black text-slate-950">最近一週作答節奏</h3>
              </div>
              <div className="text-right text-sm text-slate-500">
                <p>本週 {sevenDayTrend.totalAnswered} 題</p>
                <p className="mt-1">連續 {sevenDayTrend.streak} 天</p>
              </div>
            </div>

            {!sevenDayTrend.hasEnoughData ? (
              <div className="mt-6">
                <EmptyState
                  title="累積 2 天後顯示趨勢"
                  description="開始作答後，這裡會整理最近 7 天的刷題量與正確率變化。"
                  actionLabel="開始刷題"
                  actionTo="/"
                />
              </div>
            ) : (
              <div className="mt-8">
                <div className="grid grid-cols-7 items-end gap-3">
                  {sevenDayTrend.days.map((day) => {
                    const barHeight =
                      sevenDayTrend.maxAnsweredCount > 0
                        ? Math.max(14, Math.round((day.answeredCount / sevenDayTrend.maxAnsweredCount) * 112))
                        : 14
                    const accuracyDotBottom = Math.max(8, Math.min(112, Math.round((day.accuracy / 100) * 112)))

                    return (
                      <div key={day.dateKey} className="flex flex-col items-center gap-3">
                        <div className="relative flex h-32 w-full items-end justify-center rounded-2xl bg-slate-50">
                          <div
                            className="w-8 rounded-t-2xl bg-blue-500 transition-all duration-700"
                            style={{ height: `${barHeight}px` }}
                          />
                          <span
                            className="absolute h-3 w-3 rounded-full border-2 border-white bg-emerald-500 shadow-sm"
                            style={{ bottom: `${accuracyDotBottom}px` }}
                            title={`正確率 ${day.accuracy}%`}
                          />
                        </div>
                        <div className="text-center text-xs text-slate-500">
                          <p>{day.label}</p>
                          <p className="mt-1 font-semibold text-slate-700">{day.answeredCount} 題</p>
                        </div>
                      </div>
                    )
                  })}
                </div>

                <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-slate-600">
                  <span className="inline-flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-blue-500" />
                    刷題量
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-emerald-500" />
                    正確率標記
                  </span>
                </div>
              </div>
            )}
          </article>

          <article className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">科目戰力</p>
                <h3 className="mt-2 text-2xl font-black text-slate-950">各科正確率概況</h3>
              </div>
              {subjectPower.weakestSubject ? (
                <div className="rounded-full border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">
                  最需加強：{subjectPower.weakestSubject.subject}
                </div>
              ) : null}
            </div>

            {!subjectPower.hasEnoughData ? (
              <div className="mt-6">
                <EmptyState
                  title="每科完成 10 題後顯示戰力"
                  description="累積足夠作答後，這裡會從高到低整理各科正確率與需要加強的科目。"
                  actionLabel="開始刷題"
                  actionTo="/"
                />
              </div>
            ) : (
              <div className="mt-6 space-y-4">
                {subjectPower.rows.map((row) => (
                  <Link
                    key={row.subject}
                    to={`/quiz/${encodeURIComponent(row.subject)}`}
                    className="block rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4 transition hover:border-slate-300 hover:bg-white"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-slate-900">{row.subject}</p>
                          {row.needsFocus ? (
                            <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700">
                              加強
                            </span>
                          ) : null}
                        </div>
                        <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-200">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ${
                              row.needsFocus ? 'bg-amber-500' : 'bg-blue-600'
                            }`}
                            style={{ width: `${Math.max(8, row.accuracy)}%` }}
                          />
                        </div>
                      </div>
                      <div className="text-left sm:min-w-[76px] sm:text-right">
                        <p className="text-lg font-black text-slate-950">{row.accuracy}%</p>
                        <p className="text-xs text-slate-500">{row.answeredCount} 題</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </article>

          <article className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">錯題清除</p>
                <h3 className="mt-2 text-2xl font-black text-slate-950">錯題變熟的進度</h3>
              </div>
              <Button as={Link} to="/wrong-book" variant="secondary">
                複習錯題
              </Button>
            </div>

            {!wrongClearance.hasData ? (
              <div className="mt-6">
                <EmptyState
                  title="產生錯題後可追蹤清除率"
                  description="當某題曾經答錯，後續連續答對 2 次後，這裡就會視為已清除。"
                  actionLabel="開始刷題"
                  actionTo="/"
                />
              </div>
            ) : (
              <div className="mt-8 grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
                <div className="flex items-center justify-center">
                  <div className="relative flex h-44 w-44 items-center justify-center rounded-full bg-slate-100">
                    <div
                      className="absolute inset-0 rounded-full"
                      style={{
                        background: `conic-gradient(#10b981 ${wrongClearance.clearanceRate * 3.6}deg, #fecaca ${wrongClearance.clearanceRate * 3.6}deg 360deg)`,
                      }}
                    />
                    <div className="absolute inset-4 rounded-full bg-white" />
                    <div className="relative text-center">
                      <p className="text-4xl font-black text-slate-950">{wrongClearance.clearanceRate}%</p>
                      <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">清除率</p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 content-start">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <MetricBadge label="本週已清除" value={`${wrongClearance.weeklyClearedCount}`} tone="emerald" />
                    <MetricBadge label="高風險錯題" value={`${wrongClearance.highRiskCount}`} tone="rose" />
                  </div>
                  <p className="text-sm leading-relaxed text-slate-600">
                    目前已清除 {wrongClearance.clearedCount} 題，仍有 {wrongClearance.highRiskCount} 題需要持續回頭練習。
                  </p>
                </div>
              </div>
            )}
          </article>

          <article className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">個人紀錄</p>
              <h3 className="mt-2 text-2xl font-black text-slate-950">自己的最佳表現</h3>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <MetricBadge
                label="單日最高刷題"
                value={personalRecords.bestDailyAnswered > 0 ? personalRecords.bestDailyAnswered : '—'}
                hint={personalRecords.bestDailyAnswered > 0 ? '單日最高' : '開始累積'}
                tone={personalRecords.bestDailyAnswered > 0 ? 'blue' : 'slate'}
              />
              <MetricBadge
                label="最高正確率"
                value={personalRecords.bestAccuracy > 0 ? `${personalRecords.bestAccuracy}%` : '—'}
                hint={personalRecords.bestAccuracy > 0 ? '單日最佳' : '開始累積'}
                tone={personalRecords.bestAccuracy > 0 ? 'emerald' : 'slate'}
              />
              <MetricBadge
                label="最長連續刷題"
                value={personalRecords.longestStreak > 0 ? `${personalRecords.longestStreak} 天` : '—'}
                hint={personalRecords.longestStreak > 0 ? '最長紀錄' : '開始累積'}
                tone={personalRecords.longestStreak > 0 ? 'amber' : 'slate'}
              />
              <MetricBadge
                label="累積清除錯題"
                value={personalRecords.totalClearedWrong > 0 ? personalRecords.totalClearedWrong : '—'}
                hint={personalRecords.totalClearedWrong > 0 ? '已掌握' : '開始累積'}
                tone={personalRecords.totalClearedWrong > 0 ? 'emerald' : 'slate'}
              />
              <MetricBadge
                label="最高模擬考分數"
                value={personalRecords.highestMockScore > 0 ? `${personalRecords.highestMockScore.toFixed(2)} 分` : '—'}
                hint={personalRecords.highestMockScore > 0 ? '單科最高' : '開始累積'}
                tone={personalRecords.highestMockScore > 0 ? 'blue' : 'slate'}
              />
            </div>
          </article>
        </section>
      </div>
    </main>
  )
}

export default GrowthPage
