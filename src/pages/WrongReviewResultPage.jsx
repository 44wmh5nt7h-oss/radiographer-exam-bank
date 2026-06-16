import { Link, Navigate, useLocation, useParams } from 'react-router-dom'
import BackLink from '../components/BackLink'
import Button from '../components/Button'
import Navbar from '../components/Navbar'
import SeoMeta from '../components/SeoMeta'
import { formatQuestionMetadata } from '../utils/subjectUtils'

function WrongReviewResultPage() {
  const location = useLocation()
  const { subject: subjectParam } = useParams()
  const subject = decodeURIComponent(subjectParam || location.state?.subject || '')
  const payload = location.state

  if (!payload?.calculatedResult) {
    return <Navigate to="/wrong-review" replace />
  }

  const result = payload.calculatedResult
  const removedCount = Number(payload.wrongReviewUpdate?.removedCount || 0)
  const retainedCount = Number(payload.wrongReviewUpdate?.retainedCount || 0)

  return (
    <main className="min-h-screen px-4 py-6 md:px-6 md:py-8">
      <SeoMeta
        title={`${subject || '錯題複習'}結果｜放射師國考刷題庫`}
        description="錯題複習結果會顯示本次答對、答錯、已移除錯題與仍需加強題數。"
        canonicalPath={`/wrong-review/${encodeURIComponent(subject || '')}/result`}
        robots="noindex,nofollow"
      />
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <BackLink label="返回錯題複習" fallbackTo="/wrong-review" />
        <Navbar subtitle="Wrong Review Result" title={`${subject} 錯題複習結果`} />

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {[
            ['總題數', `${result.totalCount} 題`, 'slate'],
            ['答對題數', `${result.correctCount} 題`, 'emerald'],
            ['答錯題數', `${result.wrongCount} 題`, 'rose'],
            ['已移除錯題', `${removedCount} 題`, 'blue'],
            ['仍需加強', `${retainedCount} 題`, 'amber'],
          ].map(([label, value, tone]) => (
            <article
              key={label}
              className={`rounded-[1.5rem] border p-5 shadow-sm ${
                tone === 'emerald'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                  : tone === 'rose'
                    ? 'border-rose-200 bg-rose-50 text-rose-800'
                    : tone === 'blue'
                      ? 'border-blue-200 bg-blue-50 text-blue-800'
                      : tone === 'amber'
                        ? 'border-amber-200 bg-amber-50 text-amber-800'
                        : 'border-slate-200 bg-white text-slate-900'
              }`}
            >
              <p className="text-xs font-bold uppercase tracking-[0.16em] opacity-75">{label}</p>
              <p className="mt-3 text-2xl font-black">{value}</p>
            </article>
          ))}
        </section>

        <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Button as={Link} to="/wrong-review">繼續複習錯題</Button>
            <Button as={Link} to="/wrong-book" variant="secondary">查看錯題本</Button>
            <Button as={Link} to="/growth" variant="ghost">查看我的成長</Button>
          </div>

          <div className="mt-6 grid gap-4">
            {result.perQuestionResults.map((question, index) => {
              const isCorrect = question.status === 'correct'

              return (
                <article key={question.questionKey || index} className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-600">
                        第 {index + 1} 題｜{formatQuestionMetadata(question)}
                      </p>
                      <h2 className="mt-2 text-lg font-black leading-relaxed text-slate-950">
                        {question.question || question.questionText || question.stem}
                      </h2>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-sm font-bold ${
                        isCorrect ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {isCorrect ? '答對，已移除錯題' : question.status === 'wrong' ? '答錯，保留錯題' : '未作答'}
                    </span>
                  </div>
                  <div className="mt-4 grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
                    <p>你的答案：<span className="font-bold text-slate-950">{question.userAnswer || '未作答'}</span></p>
                    <p>正確答案：<span className="font-bold text-slate-950">{question.correctAnswer || question.answer}</span></p>
                  </div>
                  {question.explanation ? (
                    <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
                      <p className="text-sm font-bold text-slate-900">詳解</p>
                      <p className="mt-2 whitespace-pre-line text-sm leading-7 text-slate-600">
                        {typeof question.explanation === 'string' ? question.explanation : JSON.stringify(question.explanation)}
                      </p>
                    </div>
                  ) : null}
                </article>
              )
            })}
          </div>
        </section>
      </div>
    </main>
  )
}

export default WrongReviewResultPage
