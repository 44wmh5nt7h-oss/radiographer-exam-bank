import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useLocation, useParams } from 'react-router-dom'
import BackLink from '../components/BackLink'
import Button from '../components/Button'
import Navbar from '../components/Navbar'
import ResultSummary from '../components/ResultSummary'
import SeoMeta from '../components/SeoMeta'
import { extractQuestionTags, getExamResult, getQuestionKey, saveExamResult } from '../utils/storageUtils'
import { calculateExamResult } from '../utils/quizUtils'
import { formatQuestionMetadata } from '../utils/subjectUtils'
import { getStudyActionRecommendation, getTodayFeedbackSummary } from '../utils/recommendationUtils'

function ResultPage() {
  const location = useLocation()
  const { subject: subjectParam } = useParams()
  const subject = decodeURIComponent(subjectParam || '')
  const resultPayload = location.state || getExamResult(subject)
  const [statusFilter, setStatusFilter] = useState('all')
  const retrySearch = resultPayload?.startYear && resultPayload?.endYear
    ? `?startYear=${resultPayload.startYear}&endYear=${resultPayload.endYear}`
    : location.search

  useEffect(() => {
    if (location.state) {
      saveExamResult(subject, location.state)
    }
  }, [location.state, subject])

  if (!resultPayload) {
    return <Navigate to="/" replace />
  }

  const calculatedResult = useMemo(() => {
    if (resultPayload?.calculatedResult?.perQuestionResults?.length) {
      return resultPayload.calculatedResult
    }

    const questionsSnapshot = resultPayload.questionsSnapshot || resultPayload.questions || []
    const userAnswersSnapshot = resultPayload.userAnswersSnapshot || resultPayload.answers || {}
    return calculateExamResult(questionsSnapshot, userAnswersSnapshot)
  }, [resultPayload])

  const summary = calculatedResult
  const invariantCheck =
    summary.correctCount + summary.wrongCount + summary.unansweredCount === summary.totalCount &&
    summary.totalCount === summary.perQuestionResults.length

  const perQuestionResults = useMemo(
    () =>
      (summary.perQuestionResults || []).map((question, index) => ({
        ...question,
        _examIndex: index + 1,
        _listKey: question.questionKey || getQuestionKey(question) || question.id || `${index}`,
        _metadataLabel: formatQuestionMetadata(
          {
            ...question,
            subject: question.subject || subject || '',
          },
          {
            fallback: '來源資訊未提供',
          },
        ),
        _displayQuestionText: question.question || question.questionText || question.stem || '',
        _displayAnswer: question.correctAnswer || question.answer || '',
      })),
    [summary.perQuestionResults, subject],
  )

  const visibleQuestions = useMemo(() => {
    if (statusFilter === 'all') {
      return perQuestionResults
    }

    return perQuestionResults.filter((question) => question.status === statusFilter)
  }, [perQuestionResults, statusFilter])

  useEffect(() => {
    if (!import.meta.env.DEV) {
      return
    }

    console.log('[result-page] questions.length', perQuestionResults.length)
    console.log(
      '[result-page] first 10 userAnswers',
      perQuestionResults.slice(0, 10).map((item) => [item.questionKey, item.userAnswer]),
    )
    console.log('[result-page] first 10 perQuestionResults', perQuestionResults.slice(0, 10))
    console.log('[result-page] counts', {
      correctCount: summary.correctCount,
      wrongCount: summary.wrongCount,
      unansweredCount: summary.unansweredCount,
    })
    console.log('[result-page] invariant', invariantCheck)

    if (!invariantCheck) {
      console.error('[result-page] invariant failed', {
        totalQuestions: summary.totalCount,
        correctCount: summary.correctCount,
        wrongCount: summary.wrongCount,
        unansweredCount: summary.unansweredCount,
      })
    }
  }, [perQuestionResults, summary, invariantCheck])

  if (!invariantCheck) {
    return (
      <main className="min-h-screen px-4 py-8 md:px-6">
        <SeoMeta
          title={`${subject || '測驗結果'}｜放射師國考刷題庫`}
          description="測驗結果頁會整理當次作答的答對、答錯與未作答狀態。"
          canonicalPath={`/results/${encodeURIComponent(subject || '')}`}
          robots="noindex,nofollow"
        />
        <div className="mx-auto flex max-w-4xl flex-col gap-6">
          <Navbar subtitle="Timed Subject Result" title="測驗結果" />
          <section className="rounded-[1.75rem] border border-rose-200 bg-white p-6 shadow-[0_24px_60px_rgba(15,23,42,0.08)] md:p-8">
            <p className="text-base font-semibold text-rose-700">本次測驗結果資料不一致，請重新作答或重新載入頁面。</p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <Button as={Link} to={`/quiz/${encodeURIComponent(subject)}${retrySearch}`}>
                再做一次單科測驗
              </Button>
              <Button as={Link} to="/" variant="secondary">
                回首頁
              </Button>
            </div>
          </section>
        </div>
      </main>
    )
  }

  const filterButtons = [
    { key: 'all', label: `全部 ${summary.totalCount}` },
    { key: 'correct', label: `答對 ${summary.correctCount}` },
    { key: 'wrong', label: `答錯 ${summary.wrongCount}` },
    { key: 'unanswered', label: `未作答 ${summary.unansweredCount}` },
  ]
  const wrongQuestionTags = [...new Set(
    perQuestionResults
      .filter((question) => question.status === 'wrong')
      .flatMap((question) => extractQuestionTags(question))
      .filter(Boolean),
  )].slice(0, 3)
  const wrongQuestionSubjects = [...new Set(
    perQuestionResults
      .filter((question) => question.status === 'wrong')
      .map((question) => question.subject)
      .filter(Boolean),
  )].slice(0, 3)
  const todayFeedback = getTodayFeedbackSummary()
  const recommendation = getStudyActionRecommendation()

  return (
    <main className="min-h-screen px-4 py-8 md:px-6">
      <SeoMeta
        title={`${subject || '測驗結果'}｜放射師國考刷題庫`}
        description="測驗結果頁會整理當次作答的答對、答錯與未作答狀態。"
        canonicalPath={`/results/${encodeURIComponent(subject || '')}`}
        robots="noindex,nofollow"
      />
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <BackLink label="返回放射師國考" fallbackTo="/radiographer" />
        <Navbar subtitle="Timed Subject Result" title={subject ? `${subject} 單科測驗結果` : '單科測驗結果'} />

        <section className="grid gap-4 md:grid-cols-4">
          <ResultSummary label="總題數" value={summary.totalCount} unit="題" />
          <ResultSummary label="答對" value={summary.correctCount} unit="題" tone="emerald" />
          <ResultSummary label="答錯" value={summary.wrongCount} unit="題" tone="rose" />
          <ResultSummary label="未作答" value={summary.unansweredCount} unit="題" tone="sky" />
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <ResultSummary label="本次得分" value={summary.score.toFixed(2)} unit="分" tone="sky" />
          <ResultSummary
            label="結果"
            value={summary.passed ? '及格' : '未及格'}
            unit="60 分以上及格"
            tone={summary.passed ? 'emerald' : 'rose'}
          />
          <ResultSummary label="計分方式" value="1.25" unit="每題 1.25 分" />
        </section>

        <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_24px_60px_rgba(15,23,42,0.08)] md:p-8">
          <div className="mb-6 rounded-2xl border border-blue-200 bg-blue-50 p-5">
            <h2 className="text-xl font-black text-slate-950">本次測驗後下一步</h2>
            <p className="mt-3 text-sm leading-7 text-slate-700">
              本次答錯 {summary.wrongCount} 題，未作答 {summary.unansweredCount} 題。
              {wrongQuestionTags.length > 0
                ? ` 建議先複習：${wrongQuestionTags.join('、')}。`
                : wrongQuestionSubjects.length > 0
                  ? ` 錯題主要集中在：${wrongQuestionSubjects.join('、')}。`
                  : ' 目前沒有足夠標籤資料，建議先查看錯題。'}
            </p>
            <p className="mt-2 text-sm text-slate-600">{todayFeedback.nextStep}</p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Button as={Link} to="/wrong-book" variant="secondary">
                查看錯題
              </Button>
              <Button as={Link} to="/wrong-review">
                複習錯題
              </Button>
              <Button as={Link} to="/growth" variant="ghost">
                查看成長
              </Button>
              <Button as={Link} to={recommendation.primaryActionPath} variant="secondary">
                {recommendation.primaryActionLabel}
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Button as={Link} to={`/quiz/${encodeURIComponent(subject)}${retrySearch}`} className="w-full sm:w-auto">
              再做一次單科測驗
            </Button>
            <Button as={Link} to="/radiographer" variant="secondary" className="w-full sm:w-auto">
              回到科目
            </Button>
          </div>

          <div className="mt-6 grid gap-4">
            <div className="flex flex-wrap gap-2">
              {filterButtons.map((filter) => (
                <Button
                  key={filter.key}
                  type="button"
                  variant={statusFilter === filter.key ? 'primary' : 'secondary'}
                  className="px-4 py-2"
                  onClick={() => setStatusFilter(filter.key)}
                >
                  {filter.label}
                </Button>
              ))}
            </div>

            {visibleQuestions.length === 0 && (
              <p className="rounded-[1.5rem] border border-emerald-200 bg-emerald-50 p-5 text-emerald-800">
                目前這個篩選條件下沒有題目可顯示。
              </p>
            )}

            {visibleQuestions.map((question, index) => (
              <article
                key={question._listKey}
                className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-700">
                      測驗第 {question._examIndex} 題｜{question._metadataLabel}
                    </p>
                    <h2 className="mt-2 text-lg font-bold leading-relaxed text-slate-900">
                      {question._displayQuestionText}
                    </h2>
                  </div>

                  <span
                    className={`inline-flex rounded-full px-4 py-2 text-sm font-semibold ${
                      question.status === 'correct'
                        ? 'bg-emerald-100 text-emerald-800'
                        : question.status === 'wrong'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {question.status === 'correct'
                      ? '答對'
                      : question.status === 'wrong'
                        ? '答錯'
                        : '未作答'}
                  </span>
                </div>

                <div className="mt-4 grid gap-3 text-sm text-slate-700 md:grid-cols-2">
                  <p>
                    使用者作答：
                    <span className="ml-2 font-semibold text-slate-950">
                      {question.userAnswer || '未作答'}
                    </span>
                  </p>
                  <p>
                    正確答案：
                    <span className="ml-2 font-semibold text-slate-950">{question._displayAnswer}</span>
                  </p>
                </div>

                <Button
                  as={Link}
                  to={`/results/${encodeURIComponent(subject)}/question/${encodeURIComponent(question.questionKey || getQuestionKey(question) || question.id)}`}
                  state={{ from: 'results', subject }}
                  variant="secondary"
                  className="mt-4"
                >
                  查看題目詳情
                </Button>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}

export default ResultPage
