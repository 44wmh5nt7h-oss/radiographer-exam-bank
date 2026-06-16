import { Link } from 'react-router-dom'
import BackLink from '../components/BackLink'
import Button from '../components/Button'
import Navbar from '../components/Navbar'
import SeoMeta from '../components/SeoMeta'
import StudyStatusStrip from '../components/StudyStatusStrip'
import { EXAM_SUBJECTS } from '../constants/subjects'
import { getWrongReviewSubjectCounts } from '../utils/wrongReviewUtils'

function WrongReviewSelectPage() {
  const subjectCounts = getWrongReviewSubjectCounts()
  const totalWrongCount = [...subjectCounts.values()].reduce((total, count) => total + count, 0)

  return (
    <main className="min-h-screen px-4 py-6 md:px-6 md:py-8">
      <SeoMeta
        title="錯題複習｜放射師國考刷題庫"
        description="選擇考科後，以作答模式重新練習目前錯題。答對會移出錯題本，答錯會保留並提高下次出現機率。"
        canonicalPath="/wrong-review"
        robots="noindex,nofollow"
      />
      <div className="mx-auto flex max-w-5xl flex-col gap-5">
        <BackLink label="返回我的成長" fallbackTo="/growth" />
        <Navbar subtitle="錯題複習" title="選擇要複習的科目" />
        <StudyStatusStrip compact />

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-2xl font-black text-slate-950">複習錯題</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                選一科重新作答。答對會移出錯題本，答錯會保留。
              </p>
            </div>
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-800">
              <p className="text-xs font-bold">目前錯題</p>
              <p className="mt-1 text-2xl font-black">{totalWrongCount} 題</p>
            </div>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {EXAM_SUBJECTS.map((subject) => {
              const count = Number(subjectCounts.get(subject.name) || 0)
              const isDisabled = count === 0

              return (
                <article
                  key={subject.name}
                  className={`rounded-2xl border p-4 shadow-sm ${
                    isDisabled ? 'border-slate-200 bg-slate-50 text-slate-400' : 'border-slate-200 bg-white'
                  }`}
                >
                  <h3 className="text-base font-black text-slate-950">{subject.name}</h3>
                  <p className="mt-2 text-sm text-slate-600">
                    {count > 0 ? `${count} 題錯題可複習` : '目前沒有錯題'}
                  </p>
                  <div className="mt-4">
                    {isDisabled ? (
                      <button
                        type="button"
                        disabled
                        className="inline-flex cursor-not-allowed rounded-xl border border-slate-200 bg-slate-100 px-4 py-2 text-sm font-bold text-slate-400"
                      >
                        無錯題
                      </button>
                    ) : (
                      <Button as={Link} to={`/wrong-review/${encodeURIComponent(subject.name)}`}>
                        開始複習
                      </Button>
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        </section>
      </div>
    </main>
  )
}

export default WrongReviewSelectPage
