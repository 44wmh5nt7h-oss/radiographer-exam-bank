import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import BackLink from '../components/BackLink'
import Button from '../components/Button'
import Navbar from '../components/Navbar'
import SeoMeta from '../components/SeoMeta'
import { EXAM_SUBJECTS } from '../constants/subjects'
import {
  extractQuestionTags,
  getBookmarkIds,
  getLatestBookmarkedQuestionKey,
  getQuestionKey,
  removeFavoriteQuestion,
} from '../utils/storageUtils'
import { formatQuestionMetadata, getCanonicalSubjectName } from '../utils/subjectUtils'
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

function BookmarkPage() {
  const [bookmarkIds, setBookmarkIds] = useState(() => getBookmarkIds())
  const [bookmarkedQuestions, setBookmarkedQuestions] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedSubject, setSelectedSubject] = useState(ALL_SUBJECTS_LABEL)

  useEffect(() => {
    let isCancelled = false

    async function loadBookmarkedQuestions() {
      try {
        setIsLoading(true)
        const nextQuestions = await loadQuestionsByKeys(bookmarkIds)

        if (!isCancelled) {
          setBookmarkedQuestions(nextQuestions)
        }
      } catch {
        if (!isCancelled) {
          setBookmarkedQuestions([])
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false)
        }
      }
    }

    loadBookmarkedQuestions()

    return () => {
      isCancelled = true
    }
  }, [bookmarkIds])

  const topSubjects = useMemo(() => {
    const counts = new Map()

    bookmarkedQuestions.forEach((question) => {
      const subject = normalizeQuestionSubject(question)

      if (!subject) {
        return
      }

      counts.set(subject, (counts.get(subject) || 0) + 1)
    })

    return [...counts.entries()]
      .sort((left, right) => right[1] - left[1])
      .slice(0, 3)
  }, [bookmarkedQuestions])
  const subjectCounts = useMemo(() => {
    const counts = new Map(EXAM_SUBJECTS.map((subject) => [subject.name, 0]))

    bookmarkedQuestions.forEach((question) => {
      const subject = normalizeQuestionSubject(question)

      if (!subject || !counts.has(subject)) {
        return
      }

      counts.set(subject, (counts.get(subject) || 0) + 1)
    })

    return counts
  }, [bookmarkedQuestions])
  const filteredBookmarkedQuestions = useMemo(() => {
    if (selectedSubject === ALL_SUBJECTS_LABEL) {
      return bookmarkedQuestions
    }

    return bookmarkedQuestions.filter((question) => normalizeQuestionSubject(question) === selectedSubject)
  }, [bookmarkedQuestions, selectedSubject])
  const latestBookmarkKey = useMemo(() => getLatestBookmarkedQuestionKey(), [bookmarkIds])
  const latestBookmark = useMemo(() => {
    if (bookmarkedQuestions.length === 0) {
      return null
    }

    if (latestBookmarkKey) {
      const matchedQuestion = bookmarkedQuestions.find((question) => getQuestionKey(question) === latestBookmarkKey)

      if (matchedQuestion) {
        return matchedQuestion
      }
    }

    return bookmarkedQuestions[bookmarkedQuestions.length - 1] || null
  }, [bookmarkedQuestions, latestBookmarkKey])

  const handleRemoveBookmark = (question) => {
    const removedQuestionKey = getQuestionKey(question)
    setBookmarkIds(removeFavoriteQuestion(removedQuestionKey))
    setBookmarkedQuestions((prev) =>
      prev.filter((item) => getQuestionKey(item) !== removedQuestionKey),
    )
  }

  return (
    <main className="min-h-screen px-4 py-6 md:px-6 md:py-8">
      <SeoMeta
        title="收藏題｜放射師國考刷題庫"
        description="收藏題頁面會集中管理使用者標記的重要題目，方便後續複習。"
        canonicalPath="/bookmarks"
        robots="noindex,nofollow"
      />
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <BackLink label="返回首頁" fallbackTo="/" />
        <Navbar subtitle="Bookmarks" title="收藏題" />

        <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-2xl font-black text-slate-950">把重要題目集中管理，考前快速回顧。</h2>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600">
                把常回頭看的重點題先集中起來，考前會比重新翻整份題庫更有效率。
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button as={Link} to="/radiographer" variant="secondary">
                前往刷題
              </Button>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">收藏總數</p>
              <p className="mt-2 text-2xl font-black text-slate-950">{bookmarkedQuestions.length}</p>
            </div>
            <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">科目分布</p>
              <p className="mt-2 text-sm font-semibold leading-relaxed text-slate-900">
                {topSubjects.length > 0
                  ? topSubjects.map(([subject, count]) => `${subject} ${count} 題`).join('｜')
                  : '尚無資料'}
              </p>
            </div>
            <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">最近收藏</p>
              <p className="mt-2 text-sm font-semibold leading-relaxed text-slate-900">
                {latestBookmark
                  ? formatQuestionMetadata(latestBookmark, {
                      fallback: '尚無資料',
                    })
                  : '尚無資料'}
              </p>
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
                    subject === ALL_SUBJECTS_LABEL
                      ? bookmarkedQuestions.length
                      : Number(subjectCounts.get(subject) || 0)

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
                正在載入收藏題資料...
              </div>
            )}

            {!isLoading && bookmarkedQuestions.length === 0 && (
              <div className="rounded-[1.75rem] border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
                <h3 className="text-xl font-bold text-slate-950">尚未收藏題目</h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">
                  在作答或檢討時點選收藏，即可在這裡快速複習。
                </p>
                <div className="mt-6">
                  <Button as={Link} to="/radiographer">
                    前往刷題
                  </Button>
                </div>
              </div>
            )}

            {!isLoading && bookmarkedQuestions.length > 0 && filteredBookmarkedQuestions.length === 0 && (
              <div className="rounded-[1.75rem] border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
                <h3 className="text-xl font-bold text-slate-950">這個科目目前沒有收藏題</h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">
                  選擇其他科目，或在作答檢討時點選收藏。
                </p>
              </div>
            )}

            {filteredBookmarkedQuestions.map((question) => {
              const questionKey = getQuestionKey(question)
              const correctAnswer = question.correctAnswer || question.answer || ''
              const explanation = getReadableExplanation(question)
              const tags = extractQuestionTags(question).slice(0, 6)
              const displaySubject = getDisplaySubject(question) || normalizeQuestionSubject(question)
              const metadataLabel = formatQuestionMetadata(question, {
                prefix: '歷屆來源：',
                fallback: '歷屆來源：未標記',
              })

              return (
                <article
                  key={questionKey}
                  className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm md:p-6"
                >
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-600">
                      {displaySubject ? (
                        <span className="rounded-full bg-violet-50 px-3 py-1 text-violet-700">{displaySubject}</span>
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

                          return (
                            <div
                              key={optionKey}
                              className={`rounded-2xl border px-4 py-3 ${
                                isCorrect
                                  ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                                  : 'border-slate-200 bg-slate-50 text-slate-700'
                              }`}
                            >
                              <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                                <p className="text-sm leading-relaxed">
                                  <span className="mr-2 font-semibold">{optionKey}.</span>
                                  {optionText}
                                </p>
                                {isCorrect && (
                                  <span className="rounded-full bg-white/70 px-2 py-1 text-xs font-semibold text-emerald-700">
                                    正確答案
                                  </span>
                                )}
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
                            className="rounded-full border border-violet-100 bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700"
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
                        state={{ from: 'bookmarks' }}
                        variant="secondary"
                      >
                        查看完整題目
                      </Button>
                      <Button type="button" variant="ghost" onClick={() => handleRemoveBookmark(question)}>
                        取消收藏
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

export default BookmarkPage
