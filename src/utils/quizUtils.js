import {
  EXAM_FULL_SCORE,
  EXAM_QUESTION_COUNT,
  PASSING_SCORE,
} from '../constants/subjects'
import { getQuestionKey } from './storageUtils'

export const QUIZ_LENGTH = EXAM_QUESTION_COUNT

export function normalizeAnswer(answer) {
  if (answer === null || answer === undefined) {
    return ''
  }

  if (typeof answer === 'object') {
    return normalizeAnswer(
      answer.key ??
        answer.value ??
        answer.label ??
        answer.answer ??
        answer.correctAnswer ??
        '',
    )
  }

  const normalizedValue = String(answer)
    .normalize('NFKC')
    .trim()
    .replace(/\s+/g, '')
    .replace(/^選項/i, '')
    .replace(/[：:．。.、,，]/g, '')
    .toUpperCase()

  if (!normalizedValue) {
    return ''
  }

  const optionMatch = normalizedValue.match(/[A-D]/)
  return optionMatch ? optionMatch[0] : normalizedValue
}

function getAnswerMapKey(question, index) {
  return getQuestionKey(question) || question?.id || String(index)
}

function getStoredUserAnswer(question, userAnswers, index) {
  const questionKey = getAnswerMapKey(question, index)

  if (Object.prototype.hasOwnProperty.call(userAnswers || {}, questionKey)) {
    return userAnswers[questionKey]
  }

  if (question?.id && Object.prototype.hasOwnProperty.call(userAnswers || {}, question.id)) {
    return userAnswers[question.id]
  }

  if (Object.prototype.hasOwnProperty.call(userAnswers || {}, index)) {
    return userAnswers[index]
  }

  return undefined
}

export function calculateExamResult(questions, userAnswers = {}) {
  const perQuestionScore = EXAM_FULL_SCORE / EXAM_QUESTION_COUNT
  const safeQuestions = Array.isArray(questions) ? questions : []
  const safeUserAnswers = userAnswers && typeof userAnswers === 'object' ? userAnswers : {}

  const perQuestionResults = safeQuestions.map((question, index) => {
    const questionKey = getAnswerMapKey(question, index)
    const rawUserAnswer = getStoredUserAnswer(question, safeUserAnswers, index)
    const normalizedUserAnswer = normalizeAnswer(rawUserAnswer)
    const correctAnswer = question?.answer ?? question?.correctAnswer ?? ''
    const normalizedCorrectAnswer = normalizeAnswer(correctAnswer)
    const isAnswered = normalizedUserAnswer !== ''
    const isCorrect = isAnswered && normalizedUserAnswer === normalizedCorrectAnswer
    const status = !isAnswered ? 'unanswered' : isCorrect ? 'correct' : 'wrong'

    return {
      ...question,
      questionKey,
      questionNumber: question?.question_number ?? question?.questionNumber ?? index + 1,
      question: question?.question ?? question?.questionText ?? question?.stem ?? '',
      userAnswer: isAnswered ? normalizedUserAnswer : '',
      correctAnswer: normalizedCorrectAnswer || correctAnswer,
      answer: normalizedCorrectAnswer || correctAnswer,
      isAnswered,
      isCorrect,
      status,
    }
  })

  const correctCount = perQuestionResults.filter((item) => item.status === 'correct').length
  const wrongCount = perQuestionResults.filter((item) => item.status === 'wrong').length
  const unansweredCount = perQuestionResults.filter((item) => item.status === 'unanswered').length
  const totalQuestions = perQuestionResults.length
  const score = Number((correctCount * perQuestionScore).toFixed(2))
  const invariant =
    correctCount + wrongCount + unansweredCount === totalQuestions &&
    totalQuestions === perQuestionResults.length

  return {
    totalQuestions,
    totalCount: totalQuestions,
    correctCount,
    wrongCount,
    unansweredCount,
    score,
    passed: score >= PASSING_SCORE,
    perQuestionResults,
    invariant,
  }
}

function shuffleArray(items) {
  const copiedItems = [...items]

  for (let index = copiedItems.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    ;[copiedItems[index], copiedItems[swapIndex]] = [copiedItems[swapIndex], copiedItems[index]]
  }

  return copiedItems
}

export function generateRandomExamQuestions(questions, count = QUIZ_LENGTH) {
  if (questions.length < count) {
    return []
  }

  return shuffleArray(questions).slice(0, count)
}

export function calculateScore(questions, userAnswers) {
  return calculateExamResult(questions, userAnswers)
}

export function getWrongQuestions(questions, userAnswers) {
  return calculateExamResult(questions, userAnswers).perQuestionResults.filter(
    (question) => question.status === 'wrong',
  )
}

export function formatTime(seconds) {
  const safeSeconds = Math.max(seconds, 0)
  const minutes = String(Math.floor(safeSeconds / 60)).padStart(2, '0')
  const remainingSeconds = String(safeSeconds % 60).padStart(2, '0')
  return `${minutes}:${remainingSeconds}`
}

export function getAnswerStatus(question, userAnswer, optionKey) {
  if (optionKey === question.answer) {
    return 'correct'
  }

  if (userAnswer && optionKey === userAnswer && userAnswer !== question.answer) {
    return 'wrong'
  }

  return 'default'
}
