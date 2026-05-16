function ResultSummary({ label, value, unit, tone = 'slate' }) {
  const valueClassName = {
    slate: 'text-slate-950',
    emerald: 'text-emerald-700',
    rose: 'text-rose-700',
    sky: 'text-sky-700',
  }[tone]

  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className={`mt-3 text-4xl font-black ${valueClassName}`}>{value}</p>
      <p className="mt-1 text-sm text-slate-500">{unit}</p>
    </div>
  )
}

export default ResultSummary
