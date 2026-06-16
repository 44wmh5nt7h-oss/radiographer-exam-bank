import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import BackLink from '../components/BackLink'
import Button from '../components/Button'
import Navbar from '../components/Navbar'
import QuestionContent, { QuestionRichText } from '../components/QuestionContent'
import SeoMeta from '../components/SeoMeta'
import {
  extractQuestionTags,
  getBookmarkIds,
  getExamResult,
  getQuestionKey,
  getWrongBookItems,
  toggleBookmark,
  updateWrongQuestionStatus,
} from '../utils/storageUtils'
import { getAnswerStatus } from '../utils/quizUtils'
import { formatQuestionMetadata, getWrongQuestionDetail, normalizeQuestionKey } from '../utils/subjectUtils'
import { getQuestionByKey } from '../utils/questionDataLoader'

function getExplanationSource(question) {
  return (
    question.explanation ??
    question.detailedExplanation ??
    question.aiExplanation ??
    question.solution ??
    question.analysis ??
    null
  )
}

function formatExplanationLabel(key) {
  return key
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .trim()
}

function formatWhyOthersWrong(value) {
  if (!value) {
    return []
  }

  if (typeof value === 'string') {
    return [{ label: '', value }]
  }

  if (typeof value === 'object' && !Array.isArray(value)) {
    return ['A', 'B', 'C', 'D']
      .filter((key) => value[key])
      .map((key) => ({
        label: key,
        value: typeof value[key] === 'string' ? value[key] : String(value[key]),
      }))
  }

  return [{ label: '', value: String(value) }]
}

function formatUnknownExplanationEntries(rawExplanation) {
  return Object.entries(rawExplanation)
    .filter(([, value]) => value !== null && value !== undefined && value !== '')
    .map(([key, value]) => ({
      title: formatExplanationLabel(key),
      value:
        typeof value === 'string'
          ? value
          : Array.isArray(value)
            ? value.filter(Boolean).join('、')
            : Object.entries(value)
                .map(([nestedKey, nestedValue]) => `${nestedKey}：${nestedValue}`)
                .join('\n'),
    }))
}

function formatExplanation(question) {
  const rawExplanation = getExplanationSource(question)

  if (!rawExplanation) {
    return { type: 'empty' }
  }

  if (typeof rawExplanation === 'string') {
    return { type: 'text', content: rawExplanation }
  }

  if (typeof rawExplanation === 'object') {
    const sections = []
    const otherOptionRows = formatWhyOthersWrong(rawExplanation.whyOthersWrong)
    const relatedTags = Array.isArray(rawExplanation.tags)
      ? rawExplanation.tags.filter(Boolean).map(String)
      : typeof rawExplanation.tags === 'string'
        ? rawExplanation.tags.split(/[、,]/).map((item) => item.trim()).filter(Boolean)
        : []

    if (rawExplanation.coreConcept) {
      sections.push({ title: '核心觀念', value: rawExplanation.coreConcept })
    }

    if (rawExplanation.whyCorrect) {
      sections.push({ title: '為什麼正確', value: rawExplanation.whyCorrect })
    }

    if (otherOptionRows.length > 0) {
      sections.push({ title: '其他選項解析', rows: otherOptionRows })
    }

    if (rawExplanation.memoryTip) {
      sections.push({ title: '記憶提示', value: rawExplanation.memoryTip })
    }

    if (sections.length > 0 || relatedTags.length > 0) {
      return {
        type: 'structured',
        sections,
        tags: relatedTags,
      }
    }

    return {
      type: 'fallback',
      sections: formatUnknownExplanationEntries(rawExplanation),
    }
  }

  return { type: 'text', content: String(rawExplanation) }
}

function formatTags(question) {
  return extractQuestionTags(question)
}

function QuestionDetailPage() {
  const { subject, questionId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const decodedQuestionId = decodeURIComponent(questionId || '')
  const examResult = subject ? getExamResult(decodeURIComponent(subject)) : null
  const normalizedRouteKey = normalizeQuestionKey(decodedQuestionId)
  const wrongBookItems = getWrongBookItems()
  const resultQuestionItems = [
    ...(Array.isArray(examResult?.perQuestionResults) ? examResult.perQuestionResults : []),
    ...(Array.isArray(examResult?.calculatedResult?.perQuestionResults)
      ? examResult.calculatedResult.perQuestionResults
      : []),
    ...(Array.isArray(examResult?.wrongQuestions) ? examResult.wrongQuestions : []),
  ]
  const reviewedQuestion =
    resultQuestionItems.find((item) => normalizeQuestionKey(item) === normalizedRouteKey) || null
  const wrongBookItem =
    wrongBookItems.find(
      (item) =>
        item.key === decodedQuestionId ||
        item.questionKey === decodedQuestionId ||
        normalizeQuestionKey(item) === normalizedRouteKey,
    ) || null
  const [resolvedQuestion, setResolvedQuestion] = useState(null)
  const [isLoadingQuestion, setIsLoadingQuestion] = useState(true)
  const [bookmarkIds, setBookmarkIds] = useState(() => getBookmarkIds())

  useEffect(() => {
    let isCancelled = false

    async function resolveQuestion() {
      try {
        setIsLoadingQuestion(true)
        const loadedQuestion = await getQuestionByKey(decodedQuestionId)
        const mergedQuestion = getWrongQuestionDetail(
          reviewedQuestion || wrongBookItem || loadedQuestion || { id: decodedQuestionId },
          loadedQuestion ? [loadedQuestion] : [],
          {
            questionId,
            decodedQuestionId,
            routeKey: decodedQuestionId,
          },
        )

        if (!isCancelled) {
          setResolvedQuestion(mergedQuestion || loadedQuestion || wrongBookItem || reviewedQuestion || null)
        }
      } catch {
        if (!isCancelled) {
          const mergedQuestion = getWrongQuestionDetail(
            reviewedQuestion || wrongBookItem || { id: decodedQuestionId },
            [],
            {
              questionId,
              decodedQuestionId,
              routeKey: decodedQuestionId,
            },
          )

          setResolvedQuestion(mergedQuestion || wrongBookItem || reviewedQuestion || null)
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingQuestion(false)
        }
      }
    }

    resolveQuestion()

    return () => {
      isCancelled = true
    }
  }, [decodedQuestionId, questionId, reviewedQuestion, wrongBookItem])

  const question = resolvedQuestion
  const userAnswer = question?.userAnswer || reviewedQuestion?.userAnswer || wrongBookItem?.userAnswer || ''
  const questionKey = question ? getQuestionKey(question) : decodedQuestionId
  const explanationContent = question ? formatExplanation(question) : { type: 'empty' }
  const tags = question ? formatTags(question) : []
  const isUsingCachedWrongItem = Boolean(question?._usedCachedWrongItem)
  const questionMetadataLabel = formatQuestionMetadata(
    question || wrongBookItem || reviewedQuestion || { id: decodedQuestionId },
    {
      prefix: '歷屆來源：',
      fallback: '歷屆來源：未標記',
    },
  )
  const returnTarget =
    location.state?.from === 'bookmarks'
      ? { to: '/bookmarks', label: '返回收藏題' }
      : location.state?.from === 'results'
        ? { to: `/results/${encodeURIComponent(location.state?.subject || subject || '')}`, label: '返回測驗結果' }
        : { to: '/wrong-book', label: '返回錯題本' }

  useEffect(() => {
    if (!import.meta.env.DEV) {
      return
    }

    console.log('[wrong-question-detail] route params', { subject, questionId })
    console.log('[wrong-question-detail] decoded key', decodedQuestionId)
    console.log('[wrong-question-detail] wrongItems count', wrongBookItems.length)
    console.log('[wrong-question-detail] matched wrongItem', reviewedQuestion || wrongBookItem || null)
    console.log('[wrong-question-detail] allQuestions count', question ? 1 : 0)
    console.log('[wrong-question-detail] match method', question?._matchMethod || 'not_found')
    console.log('[wrong-question-detail] final question object', question || null)
  }, [subject, questionId, decodedQuestionId, wrongBookItems.length, reviewedQuestion, wrongBookItem, question])

  const handleResolveQuestion = () => {
    updateWrongQuestionStatus(questionKey, 'resolved')
    navigate(returnTarget.to)
  }

  const handleAddBookmark = () => {
    setBookmarkIds(toggleBookmark(question || questionKey))
  }

  if (isLoadingQuestion) {
    return (
      <main className="min-h-screen px-4 py-8 md:px-6">
        <SeoMeta
          title="題目詳情｜放射師國考刷題庫"
          description="題目詳情頁可查看完整題目內容、答案與詳解。"
          canonicalPath={`/questions/${encodeURIComponent(questionKey || decodedQuestionId || '')}`}
          robots="noindex,nofollow"
        />
        <div className="mx-auto flex max-w-4xl flex-col gap-6">
          <BackLink label={returnTarget.label} fallbackTo={returnTarget.to} />
          <Navbar subtitle="Question Review" title="錯題詳情" />
          <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_24px_60px_rgba(15,23,42,0.08)] md:p-8">
            <p className="text-slate-700">正在載入題目資料...</p>
          </section>
        </div>
      </main>
    )
  }

  if (!question) {
    return (
      <main className="min-h-screen px-4 py-8 md:px-6">
        <SeoMeta
          title="題目詳情｜放射師國考刷題庫"
          description="題目詳情頁可查看完整題目內容、答案與詳解。"
          canonicalPath={`/questions/${encodeURIComponent(questionKey || decodedQuestionId || '')}`}
          robots="noindex,nofollow"
        />
        <div className="mx-auto flex max-w-4xl flex-col gap-6">
          <BackLink label={returnTarget.label} fallbackTo={returnTarget.to} />
          <Navbar subtitle="Question Review" title="錯題詳情" />
          <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_24px_60px_rgba(15,23,42,0.08)] md:p-8">
            <p className="text-slate-700">找不到原始題目資料，請確認題庫資料是否已載入</p>
            <div className="mt-4">
              <Button as={Link} to={returnTarget.to} variant="secondary">
                {returnTarget.label}
              </Button>
            </div>
          </section>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen px-4 py-8 md:px-6">
      <SeoMeta
        title="題目詳情｜放射師國考刷題庫"
        description="題目詳情頁可查看完整題目內容、答案與詳解。"
        canonicalPath={`/questions/${encodeURIComponent(questionKey || decodedQuestionId || '')}`}
        robots="noindex,nofollow"
      />
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <BackLink label={returnTarget.label} fallbackTo={returnTarget.to} />
        <Navbar
          subtitle="Question Review"
          title="錯題詳情"
          actions={
            <>
              <Button as={Link} to={returnTarget.to} variant="secondary">
                {returnTarget.label}
              </Button>
              <Button type="button" variant="ghost" onClick={handleResolveQuestion}>
                我已經會了
              </Button>
              <Button type="button" onClick={handleAddBookmark}>
                {bookmarkIds.includes(questionKey) ? '取消收藏' : '加入收藏題'}
              </Button>
            </>
          }
        />

        <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_24px_60px_rgba(15,23,42,0.08)] md:p-8">
          <div className="mb-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-medium text-slate-700">
            <div className="flex flex-wrap items-center gap-2">{questionMetadataLabel}</div>
          </div>

          <QuestionContent question={question} />

          {isUsingCachedWrongItem && (
            <p className="mt-4 text-sm text-slate-500">此題使用錯題紀錄中的快取資料顯示。</p>
          )}

          {tags.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-slate-300 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="mt-6 grid gap-3">
            {Object.entries(question.options).map(([key, value]) => {
              const answerStatus = getAnswerStatus(question, userAnswer, key)
              const className =
                answerStatus === 'correct'
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
                  : answerStatus === 'wrong'
                    ? 'border-rose-300 bg-rose-50 text-rose-900'
                    : 'border-slate-200 bg-white text-slate-800'

              return (
                <div
                  key={key}
                  className={`rounded-2xl border px-4 py-4 text-base font-medium ${className}`}
                >
                  <div className="flex items-start gap-3">
                    <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white">
                      {key}
                    </span>
                    <div className="min-w-0 flex-1">
                      <QuestionRichText
                        text={value}
                        alt={`${question.id}-${key}`}
                        textClassName="whitespace-pre-line leading-relaxed"
                        imageClassName="max-h-[24rem] w-full object-contain"
                      />
                      <div className="mt-3 flex flex-wrap gap-2">
                        {answerStatus === 'wrong' && (
                          <span className="rounded-full border border-rose-300 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700">
                            你的答案
                          </span>
                        )}
                        {answerStatus === 'correct' && (
                          <span className="rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                            正確答案
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="mt-6 space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-slate-700">
              使用者作答：
              <span className="ml-2 font-semibold text-slate-900">
                {userAnswer || '使用者未作答'}
              </span>
            </p>
            <p className="text-slate-700">
              正確答案：
              <span className="ml-2 inline-block align-top font-semibold text-slate-900">
                {question.answer}.
              </span>
            </p>
            <QuestionRichText
              text={question.options[question.answer]}
              alt={`${question.id}-answer`}
              textClassName="whitespace-pre-line leading-relaxed text-slate-700"
              imageClassName="max-h-[20rem] w-full object-contain"
            />
          </div>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="text-lg font-bold text-slate-950">詳解</h2>
            {explanationContent.type === 'empty' && (
              <p className="mt-3 whitespace-pre-line leading-relaxed text-slate-700">此題目前尚無詳解</p>
            )}

            {explanationContent.type === 'text' && (
              <QuestionRichText
                text={explanationContent.content}
                alt={`${question.id}-explanation`}
                textClassName="mt-3 whitespace-pre-line leading-relaxed text-slate-700"
                imageClassName="max-h-[20rem] w-full object-contain"
              />
            )}

            {(explanationContent.type === 'structured' || explanationContent.type === 'fallback') && (
              <div className="mt-4 space-y-5">
                {explanationContent.sections.map((section) => (
                  <div key={section.title} className="space-y-2">
                    <h3 className="text-sm font-semibold text-slate-900">{section.title}</h3>
                    {section.value && (
                      <QuestionRichText
                        text={section.value}
                        alt={`${question.id}-explanation-${section.title}`}
                        textClassName="whitespace-pre-line leading-relaxed text-slate-700"
                        imageClassName="max-h-[20rem] w-full object-contain"
                      />
                    )}
                    {section.rows && (
                      <div className="space-y-2">
                        {section.rows.map((row, index) => (
                          <div key={`${section.title}-${row.label || index}`} className="rounded-xl bg-slate-50 px-4 py-3">
                            {row.label && <p className="text-sm font-semibold text-slate-900">{row.label}：</p>}
                            <QuestionRichText
                              text={row.value}
                              alt={`${question.id}-explanation-${section.title}-${row.label || index}`}
                              textClassName="whitespace-pre-line leading-relaxed text-slate-700"
                              imageClassName="max-h-[20rem] w-full object-contain"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {explanationContent.type === 'structured' && explanationContent.tags?.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-slate-900">相關標籤</h3>
                    <div className="flex flex-wrap gap-2">
                      {explanationContent.tags.map((tag) => (
                        <span
                          key={`explanation-tag-${tag}`}
                          className="rounded-full border border-slate-300 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}

export default QuestionDetailPage
