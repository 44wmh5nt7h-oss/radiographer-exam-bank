import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import BackLink from '../components/BackLink'
import Button from '../components/Button'
import Navbar from '../components/Navbar'
import QuestionCard from '../components/QuestionCard'
import SeoMeta from '../components/SeoMeta'
import { calculateExamResult } from '../utils/quizUtils'
import { getQuestionKey } from '../utils/storageUtils'
import { getWrongQuestionDetail } from '../utils/subjectUtils'
import { loadQuestionsByKeys } from '../utils/questionDataLoader'
import { getWrongItemsBySubject, pickWrongReviewItems, applyWrongReviewResults } from '../utils/wrongReviewUtils'

function WrongReviewQuizPage() {
  const navigate = useNavigate()
  const { subject: subjectParam } = useParams()
  const subject = decodeURIComponent(subjectParam || '')
  const [reviewQuestions, setReviewQuestions] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answerMap, setAnswerMap] = useState({})
  const [isNavigatorOpen, setIsNavigatorOpen] = useState(false)
  const currentQuestion = reviewQuestions[currentIndex]
  const currentQuestionKey = currentQuestion ? getQuestionKey(currentQuestion) : ''
  const selectedAnswer = currentQuestionKey ? answerMap[currentQuestionKey] || '' : ''
  const answeredCount = Object.keys(answerMap).length

  useEffect(() => {
    let isCancelled = false

    async function loadReviewQuestions() {
      try {
        setIsLoading(true)
        setLoadError('')
        const wrongItems = pickWrongReviewItems(getWrongItemsBySubject(subject))
        const wrongKeys = wrongItems.map((item) => item.questionKey || item.key || getQuestionKey(item)).filter(Boolean)
        const sourceQuestions = await loadQuestionsByKeys(wrongKeys)
        const mergedQuestions = wrongItems
          .map((wrongItem) =>
            getWrongQuestionDetail(wrongItem, sourceQuestions, {
              questionId: wrongItem.questionKey || wrongItem.key || getQuestionKey(wrongItem),
            }),
          )
          .filter(Boolean)

        if (!isCancelled) {
          setReviewQuestions(mergedQuestions)
          setCurrentIndex(0)
          setAnswerMap({})
        }
      } catch {
        if (!isCancelled) {
          setLoadError('錯題複習資料載入失敗，請稍後再試。')
          setReviewQuestions([])
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false)
        }
      }
    }

    loadReviewQuestions()

    return () => {
      isCancelled = true
    }
  }, [subject])

  const handleSelectAnswer = (answer) => {
    if (!currentQuestion) {
      return
    }

    const questionKey = getQuestionKey(currentQuestion)

    if (!questionKey) {
      return
    }

    setAnswerMap((prev) => ({
      ...prev,
      [questionKey]: answer,
    }))
  }

  const handleMoveQuestion = (nextIndex) => {
    if (nextIndex < 0 || nextIndex > reviewQuestions.length - 1) {
      return
    }

    setCurrentIndex(nextIndex)
    setIsNavigatorOpen(false)
  }

  const handleSubmit = () => {
    const unansweredCount = reviewQuestions.length - answeredCount
    const message =
      unansweredCount > 0
        ? `目前還有 ${unansweredCount} 題未作答，確定要交卷嗎？`
        : '確定要繳交本次錯題複習嗎？'

    if (!window.confirm(message)) {
      return
    }

    const calculatedResult = calculateExamResult(reviewQuestions, answerMap)
    const wrongReviewUpdate = applyWrongReviewResults(calculatedResult.perQuestionResults)

    navigate(`/wrong-review/${encodeURIComponent(subject)}/result`, {
      replace: true,
      state: {
        subject,
        submittedAt: Date.now(),
        questions: reviewQuestions,
        answers: answerMap,
        calculatedResult,
        wrongReviewUpdate,
      },
    })
  }

  const questionButtons = useMemo(
    () =>
      reviewQuestions.map((question, index) => {
        const questionKey = getQuestionKey(question)
        const isAnswered = Boolean(questionKey && answerMap[questionKey])
        const isCurrent = currentIndex === index
        const className = isCurrent
          ? 'border-slate-900 bg-slate-900 text-white shadow-[0_10px_20px_rgba(15,23,42,0.18)]'
          : isAnswered
            ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
            : 'border-slate-200 bg-white text-slate-600'

        return { questionKey, index, className }
      }),
    [answerMap, currentIndex, reviewQuestions],
  )

  return (
    <main className="min-h-screen px-4 py-8 pb-28 md:px-6 md:pb-8">
      <SeoMeta
        title={`${subject || '錯題複習'}｜放射師國考刷題庫`}
        description="錯題複習頁會以作答模式重新練習目前錯題，作答中不顯示答案與詳解。"
        canonicalPath={`/wrong-review/${encodeURIComponent(subject || '')}`}
        robots="noindex,nofollow"
      />
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <BackLink label="返回錯題複習選科" fallbackTo="/wrong-review" />
        <Navbar subtitle="Wrong Review Quiz" title={`${subject} 錯題複習`} />

        {isLoading ? (
          <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="font-bold text-slate-900">正在載入錯題複習題目...</p>
          </section>
        ) : null}

        {!isLoading && loadError ? (
          <section className="rounded-[1.75rem] border border-rose-200 bg-white p-6 shadow-sm">
            <p className="font-bold text-rose-700">{loadError}</p>
          </section>
        ) : null}

        {!isLoading && !loadError && reviewQuestions.length === 0 ? (
          <section className="rounded-[1.75rem] border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
            <h2 className="text-2xl font-black text-slate-950">這個科目目前沒有錯題</h2>
            <p className="mt-3 text-sm text-slate-600">完成正式測驗後，答錯題目會自動出現在錯題複習中。</p>
            <div className="mt-6">
              <Button onClick={() => navigate('/wrong-review')}>返回選科</Button>
            </div>
          </section>
        ) : null}

        {!isLoading && !loadError && currentQuestion ? (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-4">
              <section className="rounded-[1.5rem] border border-slate-200 bg-white px-5 py-4 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                      錯題複習模式
                    </p>
                    <h2 className="mt-2 text-lg font-bold text-slate-950">作答中不顯示答案與詳解</h2>
                    <p className="mt-2 text-sm text-slate-600">
                      科目：{subject}｜本次錯題複習：{reviewQuestions.length} 題
                    </p>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <p className="text-xs text-slate-500">目前題號</p>
                      <p className="mt-1 text-xl font-black text-slate-950">{currentIndex + 1}</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <p className="text-xs text-slate-500">已作答</p>
                      <p className="mt-1 text-xl font-black text-slate-950">{answeredCount}</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <p className="text-xs text-slate-500">未作答</p>
                      <p className="mt-1 text-xl font-black text-slate-950">{reviewQuestions.length - answeredCount}</p>
                    </div>
                  </div>
                </div>
                <div className="mt-4 md:hidden">
                  <Button type="button" variant="secondary" className="w-full" onClick={() => setIsNavigatorOpen(true)}>
                    題號導覽
                  </Button>
                </div>
              </section>

              <QuestionCard
                questionNumber={currentIndex + 1}
                totalQuestions={reviewQuestions.length}
                question={currentQuestion}
                selectedAnswer={selectedAnswer}
                onSelectAnswer={handleSelectAnswer}
                showBookmark={false}
                showFlag={false}
                modeLabel="錯題複習"
              />

              <div className="hidden md:sticky md:bottom-4 md:z-20 md:block">
                <div className="flex flex-wrap justify-end gap-3 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-sm backdrop-blur">
                  <Button type="button" variant="secondary" onClick={() => handleMoveQuestion(currentIndex - 1)} disabled={currentIndex === 0}>
                    上一題
                  </Button>
                  <Button type="button" variant="secondary" onClick={() => handleMoveQuestion(currentIndex + 1)} disabled={currentIndex === reviewQuestions.length - 1}>
                    下一題
                  </Button>
                  <Button type="button" onClick={handleSubmit}>交卷</Button>
                </div>
              </div>
            </div>

            <aside className="hidden rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm md:block">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">作答導覽</p>
              <p className="mt-2 text-sm font-semibold text-slate-800">已作答 {answeredCount} / {reviewQuestions.length}</p>
              <div className="mt-4 grid grid-cols-5 gap-2">
                {questionButtons.map(({ questionKey, index, className }) => (
                  <button
                    key={questionKey || index}
                    type="button"
                    onClick={() => handleMoveQuestion(index)}
                    className={`rounded-xl border px-3 py-3 text-sm font-semibold transition ${className}`}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
            </aside>
          </div>
        ) : null}
      </div>

      {currentQuestion ? (
        <>
          <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-4 py-3 shadow-[0_-10px_30px_rgba(15,23,42,0.08)] backdrop-blur md:hidden">
            <div className="mx-auto grid max-w-7xl grid-cols-4 gap-2">
              <Button type="button" variant="secondary" onClick={() => handleMoveQuestion(currentIndex - 1)} disabled={currentIndex === 0}>
                上一題
              </Button>
              <Button type="button" variant="secondary" onClick={() => setIsNavigatorOpen(true)}>
                題號
              </Button>
              <Button type="button" variant="secondary" onClick={() => handleMoveQuestion(currentIndex + 1)} disabled={currentIndex === reviewQuestions.length - 1}>
                下一題
              </Button>
              <Button type="button" onClick={handleSubmit}>交卷</Button>
            </div>
          </div>

          {isNavigatorOpen ? (
            <div className="fixed inset-0 z-50 bg-slate-950/40 md:hidden" onClick={() => setIsNavigatorOpen(false)}>
              <div
                className="absolute inset-x-0 bottom-0 max-h-[72vh] rounded-t-[2rem] border border-slate-200 bg-white p-5 shadow-[0_-20px_50px_rgba(15,23,42,0.16)]"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                  <p className="text-sm font-bold text-slate-900">題號導覽</p>
                  <Button type="button" variant="ghost" className="px-4 py-2" onClick={() => setIsNavigatorOpen(false)}>
                    關閉
                  </Button>
                </div>
                <div className="mt-4 grid max-h-[52vh] grid-cols-5 gap-2 overflow-y-auto pr-1">
                  {questionButtons.map(({ questionKey, index, className }) => (
                    <button
                      key={questionKey || index}
                      type="button"
                      onClick={() => handleMoveQuestion(index)}
                      className={`rounded-xl border px-3 py-3 text-sm font-semibold transition ${className}`}
                    >
                      {index + 1}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </>
      ) : null}
    </main>
  )
}

export default WrongReviewQuizPage
