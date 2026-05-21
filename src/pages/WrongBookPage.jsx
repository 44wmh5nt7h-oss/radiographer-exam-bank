import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Button from '../components/Button'
import Navbar from '../components/Navbar'
import { EXAM_SUBJECTS } from '../constants/subjects'
import {
  clearWrongBook,
  extractQuestionTags,
  getBookmarkIds,
  getQuestionKey,
  getTodayWrongQuestions,
  getWrongBookIds,
  getWrongBookItems,
  toggleBookmark,
  updateWrongQuestionStatus,
} from '../utils/storageUtils'
import { getCanonicalSubjectName, getWrongQuestionDetail } from '../utils/subjectUtils'
import { loadQuestionsByKeys } from '../utils/questionDataLoader'

const ALL_SUBJECTS_LABEL = '全部'

function getReadableExplanation(question) {
  const explanation =
    question?.explanation ??
    question?.detailedExplanation ??
    question?.aiExplanation ??
    question?.solution ??
    question?.analysis ??
    ''

  if (!explanation) {
    return ''
  }

  if (typeof explanation === 'string') {
    return explanation
  }

  if (typeof explanation === 'object') {
    const sections = [
      explanation.coreConcept,
      explanation.whyCorrect,
      explanation.memoryTip,
    ].filter(Boolean)

    if (sections.length > 0) {
      return sections.join('\n\n')
    }

    return Object.entries(explanation)
      .filter(([, value]) => value)
      .map(([key, value]) => `${key}：${typeof value === 'string' ? value : JSON.stringify(value)}`)
      .join('\n')
  }

  return String(explanation)
}

function pickValue(...values) {
  for (const value of values) {
    if (value === null || value === undefined) {
      continue
    }

    if (typeof value === 'string') {
      if (value.trim() !== '') {
        return value.trim()
      }
      continue
    }

    if (typeof value === 'number' && Number.isFinite(value)) {
      return String(value)
    }
  }

  return ''
}

function normalizeQuestionSubject(question) {
  const rawSubject = pickValue(question?.subject, question?.category, question?.subjectName)
  return rawSubject ? getCanonicalSubjectName(rawSubject) : ''
}

function getDisplaySubject(question) {
  return pickValue(question?.subject, question?.subjectName, question?.category)
}

function parseMetadataFromId(id) {
  const rawId = pickValue(id)

  if (!rawId) {
    return {}
  }

  const match = String(rawId).match(/^(\d{2,3})-(\d+)-(.+)-(\d{1,3})$/)

  if (!match) {
    return {}
  }

  const [, year, examRound, subject, questionNumber] = match

  return {
    year,
    examRound,
    subject,
    questionNumber,
  }
}

function formatExamRound(examRound) {
  const value = pickValue(examRound)

  if (!value) {
    return ''
  }

  if (value === '1') {
    return '第一次'
  }

  if (value === '2') {
    return '第二次'
  }

  return value
}

function normalizeQuestionNumber(questionNumber) {
  const value = pickValue(questionNumber)

  if (!value) {
    return ''
  }

  const numericValue = Number(value)
  return Number.isFinite(numericValue) ? String(numericValue) : value
}

function formatQuestionMetadata(question) {
  const fallback = parseMetadataFromId(question?.id)
  const year = pickValue(question?.year, question?.examYear, question?.rocYear, question?.questionYear, fallback.year)
  const roundValue = pickValue(
    question?.exam_round,
    question?.examRound,
    question?.session,
    question?.examSession,
    question?.round,
    question?.time,
    fallback.examRound,
  )
  const round = formatExamRound(roundValue)
  const subject = getCanonicalSubjectName(
    pickValue(question?.subject, question?.subjectName, question?.category, fallback.subject),
  )
  const questionNumber = normalizeQuestionNumber(
    question?.question_number,
    question?.questionNumber,
    question?.number,
    question?.index,
    question?.questionIndex,
    question?.originalIndex,
    fallback.questionNumber,
  )

  const parts = []

  if (year) {
    parts.push(`民國 ${year} 年`)
  }

  if (round) {
    parts.push(round)
  }

  if (subject) {
    parts.push(subject)
  }

  if (questionNumber) {
    parts.push(`第 ${questionNumber} 題`)
  }

  return parts.length > 0 ? `歷屆來源：${parts.join('｜')}` : '歷屆來源：未標記'
}

function WrongBookPage() {
  const [wrongQuestionIds, setWrongQuestionIds] = useState(() => getWrongBookIds())
  const [bookmarkIds, setBookmarkIds] = useState(() => getBookmarkIds())
  const [wrongQuestions, setWrongQuestions] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedSubject, setSelectedSubject] = useState(ALL_SUBJECTS_LABEL)

  useEffect(() => {
    let isCancelled = false

    async function loadWrongQuestions() {
      try {
        setIsLoading(true)
        const wrongItems = getWrongBookItems()
        const nextQuestions = await loadQuestionsByKeys(wrongQuestionIds)
        const mergedQuestions = wrongQuestionIds
          .map((questionId) => {
            const wrongItem =
              wrongItems.find((item) => item.key === questionId || getQuestionKey(item) === questionId) || null

            if (!wrongItem) {
              return null
            }

            return getWrongQuestionDetail(wrongItem, nextQuestions, { questionId })
          })
          .filter(Boolean)

        if (!isCancelled) {
          setWrongQuestions(mergedQuestions)
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

  const todayReviewedCount = getTodayWrongQuestions().length
  const recentAddedCount = useMemo(
    () =>
      getWrongBookItems().filter((item) => {
        const rawValue = item.createdAt || item.answeredAt || item.savedAt

        if (!rawValue) {
          return false
        }

        const date = new Date(rawValue)
        return Number.isFinite(date.getTime()) && Date.now() - date.getTime() <= 7 * 24 * 60 * 60 * 1000
      }).length,
    [wrongQuestionIds],
  )
  const topSubjects = useMemo(() => {
    const counts = new Map()

    wrongQuestions.forEach((question) => {
      const subject = normalizeQuestionSubject(question)

      if (!subject) {
        return
      }

      counts.set(subject, (counts.get(subject) || 0) + 1)
    })

    return [...counts.entries()]
      .sort((left, right) => right[1] - left[1])
      .slice(0, 3)
  }, [wrongQuestions])
  const subjectCounts = useMemo(() => {
    const counts = new Map(EXAM_SUBJECTS.map((subject) => [subject.name, 0]))

    wrongQuestions.forEach((question) => {
      const subject = normalizeQuestionSubject(question)

      if (!subject || !counts.has(subject)) {
        return
      }

      counts.set(subject, (counts.get(subject) || 0) + 1)
    })

    return counts
  }, [wrongQuestions])
  const filteredWrongQuestions = useMemo(() => {
    if (selectedSubject === ALL_SUBJECTS_LABEL) {
      return wrongQuestions
    }

    return wrongQuestions.filter((question) => normalizeQuestionSubject(question) === selectedSubject)
  }, [wrongQuestions, selectedSubject])

  const handleResolveQuestion = (question) => {
    setWrongQuestionIds(updateWrongQuestionStatus(getQuestionKey(question), 'resolved'))
  }

  const handleAddBookmark = (question) => {
    setBookmarkIds(toggleBookmark(question))
  }

  const handleClearWrongBook = () => {
    const confirmed = window.confirm('確定要清空錯題本嗎？\n\n這會刪除目前錯題本內累積的所有題目，此操作無法復原。')

    if (!confirmed) {
      return
    }

    setWrongQuestionIds(clearWrongBook())
    setWrongQuestions([])
  }

  return (
    <main className="min-h-screen px-4 py-6 md:px-6 md:py-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <Navbar subtitle="Wrong Answer Book" title="錯題本" />

        <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-2xl font-black text-slate-950">集中複習曾經答錯的題目，優先補強弱點。</h2>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600">
                先處理高風險題，再回頭重做同類型題目，會比平均用力更有效率。
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button as={Link} to="/">
                開始單科測驗
              </Button>
              <Button type="button" variant="ghost" className="border-rose-200 bg-white text-rose-700 hover:border-rose-300 hover:bg-rose-50" onClick={handleClearWrongBook}>
                全部刪除
              </Button>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">錯題總數</p>
              <p className="mt-2 text-2xl font-black text-slate-950">{wrongQuestions.length}</p>
            </div>
            <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">依科目分布</p>
              <p className="mt-2 text-sm font-semibold leading-relaxed text-slate-900">
                {topSubjects.length > 0
                  ? topSubjects.map(([subject, count]) => `${subject} ${count} 題`).join('｜')
                  : '尚無資料'}
              </p>
            </div>
            <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">今日已複習</p>
              <p className="mt-2 text-2xl font-black text-slate-950">{todayReviewedCount}</p>
            </div>
            <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">最近新增</p>
              <p className="mt-2 text-2xl font-black text-slate-950">{recentAddedCount}</p>
            </div>
          </div>

          <div className="mt-8 rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-col gap-3">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">依考科篩選</h3>
                <p className="mt-1 text-sm text-slate-600">選擇考科後，下方只會顯示該科目的題目。</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {[ALL_SUBJECTS_LABEL, ...EXAM_SUBJECTS.map((subject) => subject.name)].map((subject) => {
                  const isActive = selectedSubject === subject
                  const count =
                    subject === ALL_SUBJECTS_LABEL ? wrongQuestions.length : Number(subjectCounts.get(subject) || 0)

                  return (
                    <button
                      key={subject}
                      type="button"
                      onClick={() => setSelectedSubject(subject)}
                      className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                        isActive
                          ? 'border-slate-900 bg-slate-900 text-white'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {subject} {count > 0 ? count : ''}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-4">
            {isLoading && (
              <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5 text-slate-600">
                正在載入錯題資料...
              </div>
            )}

            {!isLoading && wrongQuestions.length === 0 && (
              <div className="rounded-[1.75rem] border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
                <h3 className="text-xl font-bold text-slate-950">目前沒有錯題</h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">
                  完成測驗後，答錯的題目會自動出現在這裡。
                </p>
                <div className="mt-6">
                  <Button as={Link} to="/">
                    開始單科測驗
                  </Button>
                </div>
              </div>
            )}

            {!isLoading && wrongQuestions.length > 0 && filteredWrongQuestions.length === 0 && (
              <div className="rounded-[1.75rem] border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
                <h3 className="text-xl font-bold text-slate-950">這個科目目前沒有錯題</h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">
                  選擇其他科目，或完成測驗後答錯的題目會自動出現在這裡。
                </p>
              </div>
            )}

            {filteredWrongQuestions.map((question) => {
              const questionKey = getQuestionKey(question)
              const userAnswer = question.userAnswer || ''
              const correctAnswer = question.correctAnswer || question.answer || ''
              const explanation = getReadableExplanation(question)
              const tags = extractQuestionTags(question).slice(0, 6)
              const displaySubject = getDisplaySubject(question) || normalizeQuestionSubject(question)
              const metadataLabel = formatQuestionMetadata(question)

              return (
                <article
                  key={questionKey}
                  className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm md:p-6"
                >
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-600">
                      {displaySubject ? (
                        <span className="rounded-full bg-rose-50 px-3 py-1 text-rose-700">{displaySubject}</span>
                      ) : null}
                      <span className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-600">
                        {metadataLabel}
                      </span>
                    </div>

                    <div className="space-y-3">
                      <h2 className="text-xl font-bold leading-relaxed text-slate-950">{question.question}</h2>

                      <div className="grid gap-3">
                        {Object.entries(question.options || {}).map(([optionKey, optionText]) => {
                          const isCorrect = optionKey === correctAnswer
                          const isWrongSelected = userAnswer && optionKey === userAnswer && userAnswer !== correctAnswer
                          const toneClassName = isCorrect
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                            : isWrongSelected
                              ? 'border-rose-200 bg-rose-50 text-rose-900'
                              : 'border-slate-200 bg-slate-50 text-slate-700'

                          return (
                            <div key={optionKey} className={`rounded-2xl border px-4 py-3 ${toneClassName}`}>
                              <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                                <p className="text-sm leading-relaxed">
                                  <span className="mr-2 font-semibold">{optionKey}.</span>
                                  {optionText}
                                </p>
                                <div className="flex flex-wrap gap-2 text-xs font-semibold">
                                  {isWrongSelected && (
                                    <span className="rounded-full bg-white/70 px-2 py-1 text-rose-700">你的答案</span>
                                  )}
                                  {isCorrect && (
                                    <span className="rounded-full bg-white/70 px-2 py-1 text-emerald-700">正確答案</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {explanation && (
                      <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4">
                        <p className="text-sm font-semibold text-slate-900">詳解</p>
                        <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-600">
                          {explanation}
                        </p>
                      </div>
                    )}

                    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                      <Button
                        as={Link}
                        to={`/questions/${encodeURIComponent(questionKey)}`}
                        state={{ from: 'wrong-book' }}
                        variant="secondary"
                      >
                        查看完整題目
                      </Button>
                      <Button type="button" variant="ghost" onClick={() => handleResolveQuestion(question)}>
                        我已經會了
                      </Button>
                      <Button type="button" onClick={() => handleAddBookmark(question)}>
                        {bookmarkIds.includes(questionKey) ? '取消收藏' : '加入收藏題'}
                      </Button>
                    </div>
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

export default WrongBookPage
