import { getQuestionKey } from './storageUtils'
import { EXAM_SUBJECTS, QUESTION_BANK_YEAR_RANGE } from '../constants/subjects'

const SUBJECT_ALIAS_MAP = new Map(
  EXAM_SUBJECTS.flatMap((subject) => [subject.name, ...subject.sourceSubjects].map((alias) => [normalizeText(alias), subject.name])),
)

function normalizeText(value) {
  return String(value || '')
    .normalize('NFKC')
    .replace(/[（）]/g, (char) => (char === '（' ? '(' : ')'))
    .replace(/\s+/g, '')
    .trim()
}

function extractYear(value) {
  const normalizedValue = normalizeText(value).replace(/^民國/, '').replace(/年/g, '')
  const match = normalizedValue.match(/\d{2,3}/)
  return match ? String(Number(match[0])) : ''
}

function normalizeRoundValue(value) {
  const normalizedValue = normalizeText(value)

  if (!normalizedValue) {
    return ''
  }

  if (/^(1|01|第一次|第1次|第一梯次|第一回)$/.test(normalizedValue)) {
    return '1'
  }

  if (/^(2|02|第二次|第2次|第二梯次|第二回)$/.test(normalizedValue)) {
    return '2'
  }

  const numericMatch = normalizedValue.match(/\d+/)
  return numericMatch ? String(Number(numericMatch[0])) : normalizedValue
}

function extractQuestionNumber(value) {
  const normalizedValue = normalizeText(value)

  if (!normalizedValue) {
    return ''
  }

  const match = normalizedValue.match(/\d+/)
  return match ? String(Number(match[0])) : ''
}

function normalizeSubjectValue(value) {
  const normalizedValue = normalizeText(value)

  if (!normalizedValue) {
    return ''
  }

  if (SUBJECT_ALIAS_MAP.has(normalizedValue)) {
    return SUBJECT_ALIAS_MAP.get(normalizedValue)
  }

  const compactValue = normalizedValue.replace(/\(.+\)/, '')

  for (const [alias, canonicalName] of SUBJECT_ALIAS_MAP.entries()) {
    const compactAlias = alias.replace(/\(.+\)/, '')

    if (
      normalizedValue === alias ||
      normalizedValue.includes(alias) ||
      alias.includes(normalizedValue) ||
      compactValue === compactAlias ||
      compactValue.includes(compactAlias) ||
      compactAlias.includes(compactValue)
    ) {
      return canonicalName
    }
  }

  return compactValue || normalizedValue
}

export function getCanonicalSubjectName(value) {
  return normalizeSubjectValue(value)
}

function parseKeyLikeValue(value) {
  const decodedValue = typeof value === 'string' ? decodeURIComponent(value) : ''
  const trimmedValue = decodedValue.trim()

  if (!trimmedValue) {
    return {
      rawKey: '',
      normalizedKey: '',
      year: '',
      round: '',
      subject: '',
      questionNumber: '',
    }
  }

  const keyMatch = trimmedValue.match(/^(\d{2,3})-(\d+)-(.+)-(\d{1,3})$/)

  if (keyMatch) {
    const [, year, round, subject, questionNumber] = keyMatch
    const normalizedSubject = normalizeSubjectValue(subject)
    const normalizedQuestionNumber = extractQuestionNumber(questionNumber)

    return {
      rawKey: trimmedValue,
      normalizedKey: `${extractYear(year)}-${normalizeRoundValue(round)}-${normalizeSubjectValue(subject)}-${normalizedQuestionNumber}`,
      year: extractYear(year),
      round: normalizeRoundValue(round),
      subject: normalizedSubject,
      questionNumber: normalizedQuestionNumber,
    }
  }

  return {
    rawKey: trimmedValue,
    normalizedKey: normalizeText(trimmedValue),
    year: extractYear(trimmedValue),
    round: normalizeRoundValue(trimmedValue),
    subject: normalizeSubjectValue(trimmedValue),
    questionNumber: extractQuestionNumber(trimmedValue),
  }
}

function buildQuestionDescriptor(questionLike) {
  if (typeof questionLike === 'string') {
    return parseKeyLikeValue(questionLike)
  }

  if (!questionLike || typeof questionLike !== 'object') {
    return parseKeyLikeValue('')
  }

  const rawKey =
    questionLike.id ||
    questionLike.questionId ||
    questionLike.key ||
    questionLike.questionKey ||
    getQuestionKey(questionLike)

  const year = extractYear(questionLike.year || rawKey)
  const round = normalizeRoundValue(
    questionLike.exam_round || questionLike.examRound || questionLike.session || questionLike.exam_session || rawKey,
  )
  const subject = normalizeSubjectValue(questionLike.subject || rawKey)
  const questionNumber = extractQuestionNumber(
    questionLike.question_number ?? questionLike.questionNumber ?? questionLike.no ?? rawKey,
  )

  return {
    rawKey,
    normalizedKey: [year, round, subject, questionNumber].filter(Boolean).join('-'),
    year,
    round,
    subject,
    questionNumber,
  }
}

function hasCompleteQuestionData(questionLike) {
  if (!questionLike || typeof questionLike !== 'object') {
    return false
  }

  const questionText = questionLike.questionText || questionLike.question || questionLike.stem
  const options = questionLike.options
  const correctAnswer = questionLike.correctAnswer || questionLike.answer

  return Boolean(
    questionText &&
      options &&
      typeof options === 'object' &&
      Object.keys(options).length > 0 &&
      correctAnswer,
  )
}

function pickPreferredValue(...values) {
  for (const value of values) {
    if (value === null || value === undefined) {
      continue
    }

    if (typeof value === 'string') {
      if (value.trim() !== '') {
        return value
      }

      continue
    }

    if (Array.isArray(value)) {
      if (value.length > 0) {
        return value
      }

      continue
    }

    if (typeof value === 'object') {
      if (Object.keys(value).length > 0) {
        return value
      }

      continue
    }

    return value
  }

  return ''
}

function mergeWrongItemWithQuestionData(sourceQuestion, wrongItem, matchMethod) {
  if (!sourceQuestion && !wrongItem) {
    return null
  }

  return {
    ...(sourceQuestion || {}),
    ...(wrongItem || {}),
    question: pickPreferredValue(
      wrongItem?.questionText,
      wrongItem?.question,
      wrongItem?.stem,
      sourceQuestion?.question,
      sourceQuestion?.questionText,
      sourceQuestion?.stem,
    ),
    questionText: pickPreferredValue(
      wrongItem?.questionText,
      wrongItem?.question,
      wrongItem?.stem,
      sourceQuestion?.questionText,
      sourceQuestion?.question,
      sourceQuestion?.stem,
    ),
    stem: pickPreferredValue(
      wrongItem?.stem,
      wrongItem?.question,
      wrongItem?.questionText,
      sourceQuestion?.stem,
      sourceQuestion?.question,
      sourceQuestion?.questionText,
    ),
    options: pickPreferredValue(wrongItem?.options, sourceQuestion?.options, {}),
    answer: pickPreferredValue(
      wrongItem?.correctAnswer,
      wrongItem?.answer,
      sourceQuestion?.answer,
      sourceQuestion?.correctAnswer,
    ),
    correctAnswer: pickPreferredValue(
      wrongItem?.correctAnswer,
      wrongItem?.answer,
      sourceQuestion?.correctAnswer,
      sourceQuestion?.answer,
    ),
    userAnswer: wrongItem?.userAnswer || sourceQuestion?.userAnswer || '',
    explanation: pickPreferredValue(
      sourceQuestion?.explanation,
      wrongItem?.explanation,
      sourceQuestion?.detailedExplanation,
      wrongItem?.detailedExplanation,
      sourceQuestion?.aiExplanation,
      wrongItem?.aiExplanation,
      sourceQuestion?.solution,
      wrongItem?.solution,
      sourceQuestion?.analysis,
      wrongItem?.analysis,
    ),
    detailedExplanation: pickPreferredValue(sourceQuestion?.detailedExplanation, wrongItem?.detailedExplanation, null),
    aiExplanation: pickPreferredValue(sourceQuestion?.aiExplanation, wrongItem?.aiExplanation, null),
    solution: pickPreferredValue(sourceQuestion?.solution, wrongItem?.solution, null),
    analysis: pickPreferredValue(sourceQuestion?.analysis, wrongItem?.analysis, null),
    tags: pickPreferredValue(sourceQuestion?.tags, wrongItem?.tags, []),
    tag: pickPreferredValue(sourceQuestion?.tag, wrongItem?.tag, ''),
    categories: pickPreferredValue(sourceQuestion?.categories, wrongItem?.categories, []),
    knowledgePoints: pickPreferredValue(sourceQuestion?.knowledgePoints, wrongItem?.knowledgePoints, []),
    wrongQuestionKey:
      wrongItem?.key || wrongItem?.questionKey || sourceQuestion?.id || sourceQuestion?.questionId || '',
    _matchMethod: matchMethod,
    _usedCachedWrongItem: Boolean(wrongItem && hasCompleteQuestionData(wrongItem) && !sourceQuestion),
  }
}

function scoreSubjectSimilarity(leftSubject, rightSubject) {
  const left = normalizeSubjectValue(leftSubject)
  const right = normalizeSubjectValue(rightSubject)

  if (!left || !right) {
    return 0
  }

  if (left === right) {
    return 3
  }

  if (left.includes(right) || right.includes(left)) {
    return 2
  }

  return 0
}

export function getAvailableYears(questions) {
  return [...new Set(questions.map((question) => Number(question.year)).filter(Boolean))].sort(
    (left, right) => left - right,
  )
}

export function getAvailableYearsFromIndex(indexEntries) {
  return [...new Set((indexEntries || []).map((entry) => Number(entry.year)).filter(Boolean))].sort(
    (left, right) => left - right,
  )
}

export function filterQuestionsByYearRange(questions, startYear, endYear) {
  return questions.filter((question) => {
    const year = Number(question.year)
    return year >= startYear && year <= endYear
  })
}

export function getQuestionsByExamSubject(questions, examSubject) {
  const subjectConfig = EXAM_SUBJECTS.find((item) => item.name === examSubject)

  if (!subjectConfig) {
    return []
  }

  const sourceSubjects = new Set(subjectConfig.sourceSubjects)
  return questions.filter((question) => sourceSubjects.has(question.subject))
}

export function getSubjectSummaries(questions) {
  return EXAM_SUBJECTS.map((subject) => ({
    subject: subject.name,
    totalQuestions: getQuestionsByExamSubject(questions, subject.name).length,
    yearRange: QUESTION_BANK_YEAR_RANGE,
  }))
}

export function getSubjectSummariesFromIndex(indexEntries = []) {
  return EXAM_SUBJECTS.map((subject) => {
    const matchedEntries = indexEntries.filter(
      (entry) => normalizeSubjectValue(entry.subject) === subject.name,
    )

    return {
      subject: subject.name,
      totalQuestions: matchedEntries.reduce((total, entry) => total + Number(entry.questionCount || 0), 0),
      yearRange: QUESTION_BANK_YEAR_RANGE,
    }
  })
}

export function normalizeQuestionKey(questionLike) {
  return buildQuestionDescriptor(questionLike).normalizedKey
}

export function getQuestionsByIds(questions, ids) {
  const normalizedIdSet = new Set(ids.map((id) => normalizeQuestionKey(id) || String(id)))

  return questions.filter((question) => {
    const questionId = question.id || getQuestionKey(question)
    return normalizedIdSet.has(questionId) || normalizedIdSet.has(normalizeQuestionKey(question))
  })
}

export function getQuestionById(questions, questionId) {
  const normalizedQuestionId = normalizeQuestionKey(questionId)
  return (
    questions.find(
      (question) =>
        question.id === questionId ||
        getQuestionKey(question) === questionId ||
        normalizeQuestionKey(question) === normalizedQuestionId,
    ) || null
  )
}

export function findQuestionByKey(questionKey, questions) {
  return getQuestionById(questions, questionKey)
}

export function findQuestionForWrongItem(wrongItem, allQuestions, routeParams = {}) {
  const questionList = Array.isArray(allQuestions) ? allQuestions : []
  const wrongDescriptor = buildQuestionDescriptor(wrongItem)
  const routeDescriptor = buildQuestionDescriptor(routeParams.questionId || routeParams.decodedQuestionId || routeParams.routeKey || '')

  if (wrongItem?.id || wrongItem?.questionId) {
    const exactIdMatch =
      questionList.find(
        (question) =>
          question.id === wrongItem.id ||
          question.id === wrongItem.questionId ||
          question.questionId === wrongItem.id ||
          question.questionId === wrongItem.questionId,
      ) || null

    if (exactIdMatch) {
      return {
        question: exactIdMatch,
        matchMethod: 'exact_id_match',
      }
    }
  }

  if (wrongDescriptor.normalizedKey) {
    const stableKeyMatch =
      questionList.find((question) => normalizeQuestionKey(question) === wrongDescriptor.normalizedKey) || null

    if (stableKeyMatch) {
      return {
        question: stableKeyMatch,
        matchMethod: 'stable_key_match',
      }
    }
  }

  if (routeDescriptor.normalizedKey) {
    const routeKeyMatch =
      questionList.find((question) => normalizeQuestionKey(question) === routeDescriptor.normalizedKey) || null

    if (routeKeyMatch) {
      return {
        question: routeKeyMatch,
        matchMethod: 'route_key_match',
      }
    }
  }

  const fieldCombinationMatches = questionList
    .map((question) => {
      const descriptor = buildQuestionDescriptor(question)
      const sameYear = wrongDescriptor.year && descriptor.year === wrongDescriptor.year
      const sameQuestionNumber =
        wrongDescriptor.questionNumber && descriptor.questionNumber === wrongDescriptor.questionNumber
      const subjectScore = scoreSubjectSimilarity(descriptor.subject, wrongDescriptor.subject || routeDescriptor.subject)
      const sameRound =
        !wrongDescriptor.round ||
        !descriptor.round ||
        descriptor.round === wrongDescriptor.round ||
        descriptor.round === routeDescriptor.round

      return {
        question,
        sameYear,
        sameQuestionNumber,
        subjectScore,
        sameRound,
      }
    })
    .filter((item) => item.sameYear && item.sameQuestionNumber && item.subjectScore > 0 && item.sameRound)
    .sort((left, right) => right.subjectScore - left.subjectScore)

  if (fieldCombinationMatches.length > 0) {
    return {
      question: fieldCombinationMatches[0].question,
      matchMethod: 'field_combination_match',
    }
  }

  const sameYearNumberMatches = questionList
    .map((question) => ({
      question,
      descriptor: buildQuestionDescriptor(question),
    }))
    .filter(
      ({ descriptor }) =>
        descriptor.year &&
        descriptor.questionNumber &&
        descriptor.year === wrongDescriptor.year &&
        descriptor.questionNumber === wrongDescriptor.questionNumber,
    )
    .sort((left, right) => {
      const rightScore = scoreSubjectSimilarity(
        right.descriptor.subject,
        wrongDescriptor.subject || routeDescriptor.subject,
      )
      const leftScore = scoreSubjectSimilarity(
        left.descriptor.subject,
        wrongDescriptor.subject || routeDescriptor.subject,
      )
      return rightScore - leftScore
    })

  if (sameYearNumberMatches.length === 1) {
    return {
      question: sameYearNumberMatches[0].question,
      matchMethod: 'same_year_number_single_match',
    }
  }

  if (sameYearNumberMatches.length > 1) {
    return {
      question: sameYearNumberMatches[0].question,
      matchMethod: 'same_year_number_subject_priority_match',
    }
  }

  return {
    question: null,
    matchMethod: 'not_found',
  }
}

export function getWrongQuestionDetail(wrongItem, questions, routeParams = {}) {
  if (!wrongItem && !routeParams?.questionId) {
    return null
  }

  const { question: fullQuestion, matchMethod } = findQuestionForWrongItem(wrongItem, questions, routeParams)

  if (fullQuestion) {
    return mergeWrongItemWithQuestionData(fullQuestion, wrongItem, matchMethod)
  }

  if (wrongItem && hasCompleteQuestionData(wrongItem)) {
    return mergeWrongItemWithQuestionData(null, wrongItem, 'cached_wrong_item_fallback')
  }

  return null
}
