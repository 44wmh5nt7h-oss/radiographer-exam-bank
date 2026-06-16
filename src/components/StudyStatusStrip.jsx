import { Link } from 'react-router-dom'
import Button from './Button'
import { getStudySettingsStatus } from '../utils/recommendationUtils'

function StudyStatusStrip({ compact = false }) {
  const status = getStudySettingsStatus()
  const progressWidth = Math.min(100, Math.max(0, status.todayProgressPercent))
  const progressLabel = status.isGoalReached
    ? status.todayAnsweredCount > status.dailyGoal
      ? '已超過目標'
      : '今日已達標'
    : `還差 ${status.remainingTodayCount} 題`

  if (!status.isSetupComplete) {
    return (
      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-black text-slate-950">
              {status.isExamDateExpired ? '考試日期已過' : '尚未完成學習設定'}
            </p>
            <p className="mt-1 text-sm leading-6 text-slate-700">
              {status.isExamDateExpired
                ? '請重新設定考試日期，首頁才會顯示正確倒數與今日任務。'
                : '設定考試日期與每日目標後，首頁會顯示倒數、今日進度與複習建議。'}
            </p>
          </div>
          <Button as={Link} to="/settings" variant="secondary" className="shrink-0">
            {status.isExamDateExpired ? '重新設定' : '去設定'}
          </Button>
        </div>
      </section>
    )
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className={`grid gap-3 ${compact ? 'md:grid-cols-2' : 'md:grid-cols-[0.9fr_1.1fr_auto] md:items-center'}`}>
        <div>
          <p className="text-xs font-semibold text-slate-500">考前狀態</p>
          <p className="mt-1 text-lg font-black text-slate-950">{status.examDateLabel}</p>
        </div>
        <div>
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="font-semibold text-slate-700">今日完成</span>
            <span className="font-black text-slate-950">
              {status.todayAnsweredCount} / {status.dailyGoal} 題
            </span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
            <div className="h-full rounded-full bg-emerald-500" style={{ width: `${progressWidth}%` }} />
          </div>
          <p className="mt-1 text-xs font-semibold text-slate-500">{progressLabel}</p>
        </div>
        {!compact ? (
          <Button as={Link} to="/settings" variant="ghost" className="md:justify-self-end">
            調整設定
          </Button>
        ) : null}
      </div>
    </section>
  )
}

export default StudyStatusStrip
