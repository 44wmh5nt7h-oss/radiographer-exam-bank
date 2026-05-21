import { Link } from 'react-router-dom'

const SUBJECT_BADGE_MAP = {
  基礎醫學: { label: '基', tone: 'bg-blue-50 text-blue-700 ring-blue-100' },
  醫學物理學與輻射安全: { label: '物', tone: 'bg-emerald-50 text-emerald-700 ring-emerald-100' },
  放射線器材學: { label: '器', tone: 'bg-violet-50 text-violet-700 ring-violet-100' },
  放射線診斷原理與技術學: { label: '診', tone: 'bg-sky-50 text-sky-700 ring-sky-100' },
  放射線治療原理與技術學: { label: '療', tone: 'bg-amber-50 text-amber-700 ring-amber-100' },
  核子醫學診療原理與技術學: { label: '核', tone: 'bg-rose-50 text-rose-700 ring-rose-100' },
}

function SubjectCard({ subject, totalQuestions, yearRange, search = '' }) {
  const badge = SUBJECT_BADGE_MAP[subject] || {
    label: subject.slice(0, 1),
    tone: 'bg-slate-100 text-slate-700 ring-slate-200',
  }

  return (
    <Link
      to={`/quiz/${encodeURIComponent(subject)}${search}`}
      className="group rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-4">
          <span
            className={`inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-base font-black ring-1 ${badge.tone}`}
          >
            {badge.label}
          </span>

          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-bold leading-snug text-slate-950 sm:text-xl">{subject}</h2>
            <p className="mt-2 text-sm text-slate-500">
              {yearRange}｜{Number(totalQuestions || 0).toLocaleString('zh-TW')} 題
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end">
          <span className="inline-flex shrink-0 items-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition group-hover:bg-blue-700">
            開始測驗
          </span>
        </div>
      </div>
    </Link>
  )
}

export default SubjectCard
