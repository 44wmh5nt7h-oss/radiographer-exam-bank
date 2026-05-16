import { Link } from 'react-router-dom'

function SubjectCard({ subject, totalQuestions, yearRange, search = '' }) {
  return (
    <Link
      to={`/quiz/${encodeURIComponent(subject)}${search}`}
      className="group rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.05)] transition hover:-translate-y-0.5 hover:border-slate-400 hover:shadow-[0_18px_42px_rgba(15,23,42,0.1)]"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">單科限時測驗</p>
          <h2 className="mt-2 text-xl font-bold text-slate-950">{subject}</h2>
          <div className="mt-4 grid gap-2 text-sm text-slate-600">
            <p>題庫年份範圍：{yearRange}</p>
            <p>該科目總題數：{totalQuestions}</p>
          </div>
        </div>
        <span className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition group-hover:border-slate-900 group-hover:bg-slate-900 group-hover:text-white">
          進入測驗
        </span>
      </div>
    </Link>
  )
}

export default SubjectCard
