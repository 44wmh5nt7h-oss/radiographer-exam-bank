import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Button from '../components/Button'
import Navbar from '../components/Navbar'
import {
  getBookmarkIds,
  getQuestionKey,
  getWrongBookIds,
  toggleBookmark,
  updateWrongQuestionStatus,
} from '../utils/storageUtils'
import { loadQuestionsByKeys } from '../utils/questionDataLoader'

function WrongBookPage() {
  const [wrongQuestionIds, setWrongQuestionIds] = useState(() => getWrongBookIds())
  const [bookmarkIds, setBookmarkIds] = useState(() => getBookmarkIds())
  const [wrongQuestions, setWrongQuestions] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isCancelled = false

    async function loadWrongQuestions() {
      try {
        setIsLoading(true)
        const nextQuestions = await loadQuestionsByKeys(wrongQuestionIds)

        if (!isCancelled) {
          setWrongQuestions(nextQuestions)
        }
      } catch {
        if (!isCancelled) {
          setWrongQuestions([])
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false)
        }
      }
    }

    loadWrongQuestions()

    return () => {
      isCancelled = true
    }
  }, [wrongQuestionIds])

  const handleResolveQuestion = (question) => {
    setWrongQuestionIds(updateWrongQuestionStatus(getQuestionKey(question), 'resolved'))
  }

  const handleAddBookmark = (question) => {
    if (bookmarkIds.includes(getQuestionKey(question))) {
      return
    }

    setBookmarkIds(toggleBookmark(question))
  }

  return (
    <main className="min-h-screen px-4 py-8 md:px-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <Navbar subtitle="Wrong Book" title="錯題本" />

        <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_24px_60px_rgba(15,23,42,0.08)] md:p-8">
          <p className="text-sm text-slate-500">目前累積錯題數：{wrongQuestions.length}</p>

          <div className="mt-6 grid gap-4">
            {isLoading && (
              <p className="rounded-2xl bg-slate-50 p-5 text-slate-600">正在載入錯題資料...</p>
            )}

            {!isLoading && wrongQuestions.length === 0 && (
              <p className="rounded-2xl bg-slate-50 p-5 text-slate-600">目前沒有待修復題目</p>
            )}

            {wrongQuestions.map((question) => (
              <article key={getQuestionKey(question)} className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm font-semibold text-slate-700">
                  民國 {question.year} 年 {question.exam_round}｜{question.subject}｜第 {question.question_number} 題
                </p>
                <h2 className="mt-2 text-lg font-bold leading-relaxed text-slate-900">
                  {question.question}
                </h2>
                <p className="mt-3 text-sm text-slate-600">正確答案：{question.answer}</p>
                <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                  <Button
                    as={Link}
                    to={`/questions/${encodeURIComponent(getQuestionKey(question))}`}
                    state={{ from: 'wrong-book' }}
                    variant="secondary"
                  >
                    查看完整題目
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => handleResolveQuestion(question)}>
                    我已經會了
                  </Button>
                  <Button type="button" onClick={() => handleAddBookmark(question)}>
                    {bookmarkIds.includes(getQuestionKey(question)) ? '已加入收藏題' : '加入收藏題'}
                  </Button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}

export default WrongBookPage
