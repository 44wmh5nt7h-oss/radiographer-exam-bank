import {
  calculateStreak,
  getQuestionKey,
  getRecentSingleSubjectExamResults,
  getStudyStats,
} from './storageUtils'

const ANSWER_LOG_KEY = 'radiographer_exam_bank_growth_answer_logs'
const DAILY_STATS_KEY = 'radiographer_exam_bank_growth_daily_stats'
const QUESTION_STATE_KEY = 'radiographer_exam_bank_growth_question_states'
const LOCAL_USER_ID = 'local-user'
const SUBJECT_FOCUS_THRESHOLD = 10

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function readStorageValue(key, fallbackValue) {
  if (!canUseStorage()) {
    return fallbackValue
  }

  try {
    const rawValue = window.localStorage.getItem(key)
    if (!rawValue) {
      return fallbackValue
    }

    return JSON.parse(rawValue)
  } catch {
    return fallbackValue
  }
}

function writeStorageValue(key, value) {
  if (!canUseStorage()) {
    return
  }

  window.localStorage.setItem(key, JSON.stringify(value))
}

function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getDateFromValue(value) {
  if (!value) {
    return null
  }

  const date = value instanceof Date ? value : new Date(value)
  return Number.isFinite(date.getTime()) ? date : null
}

function getDateKeyFromValue(value) {
  const date = getDateFromValue(value)
  return date ? getLocalDateKey(date) : ''
}

function getLastDays(count = 7) {
  return Array.from({ length: count }, (_, index) => {
    const date = new Date()
    date.setDate(date.getDate() - (count - index - 1))
    return getLocalDateKey(date)
  })
}

function formatShortDate(dateKey) {
  if (!dateKey) {
    return '--'
  }

  const [, month = '', day = ''] = dateKey.split('-')
  return `${month}/${day}`
}

function getAnswerLogs() {
  const parsed = readStorageValue(ANSWER_LOG_KEY, [])
  return Array.isArray(parsed) ? parsed.filter(Boolean) : []
}

function writeAnswerLogs(logs) {
  writeStorageValue(ANSWER_LOG_KEY, logs)
}

function getGrowthDailyStatsMap() {
  const parsed = readStorageValue(DAILY_STATS_KEY, {})
  return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}
}

function writeGrowthDailyStatsMap(value) {
  writeStorageValue(DAILY_STATS_KEY, value)
}

function getQuestionStateMap() {
  const parsed = readStorageValue(QUESTION_STATE_KEY, {})
  return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}
}

function writeQuestionStateMap(value) {
  writeStorageValue(QUESTION_STATE_KEY, value)
}

function buildQuestionState(previousState = {}, nextFields = {}) {
  return {
    userId: LOCAL_USER_ID,
    questionId: nextFields.questionId || previousState.questionId || '',
    subject: nextFields.subject || previousState.subject || '',
    wrongCount: Number(nextFields.wrongCount ?? previousState.wrongCount ?? 0),
    correctStreak: Number(nextFields.correctStreak ?? previousState.correctStreak ?? 0),
    masteryLevel: nextFields.masteryLevel || previousState.masteryLevel || 'new',
    lastAnsweredAt: Number(nextFields.lastAnsweredAt ?? previousState.lastAnsweredAt ?? 0) || null,
    nextReviewAt: nextFields.nextReviewAt ?? previousState.nextReviewAt ?? null,
    clearedAt: nextFields.clearedAt ?? previousState.clearedAt ?? null,
  }
}

function calculateGrowthXp({ answeredCount = 0, correctCount = 0, reviewedWrongCount = 0, clearedWrongCount = 0 }) {
  return (
    Number(answeredCount || 0) * 2 +
    Number(correctCount || 0) * 3 +
    Number(reviewedWrongCount || 0) * 4 +
    Number(clearedWrongCount || 0) * 10
  )
}

function updateDailyGrowthStats(dateKey, nextDelta = {}) {
  const dailyStatsMap = getGrowthDailyStatsMap()
  const currentStats = dailyStatsMap[dateKey] || {
    userId: LOCAL_USER_ID,
    date: dateKey,
    answeredCount: 0,
    correctCount: 0,
    wrongCount: 0,
    reviewedWrongCount: 0,
    clearedWrongCount: 0,
    accuracy: 0,
    xp: 0,
  }

  const answeredCount = Number(currentStats.answeredCount || 0) + Number(nextDelta.answeredCount || 0)
  const correctCount = Number(currentStats.correctCount || 0) + Number(nextDelta.correctCount || 0)
  const wrongCount = Number(currentStats.wrongCount || 0) + Number(nextDelta.wrongCount || 0)
  const reviewedWrongCount =
    Number(currentStats.reviewedWrongCount || 0) + Number(nextDelta.reviewedWrongCount || 0)
  const clearedWrongCount =
    Number(currentStats.clearedWrongCount || 0) + Number(nextDelta.clearedWrongCount || 0)
  const xp = Number(currentStats.xp || 0) + Number(nextDelta.xp || 0)

  dailyStatsMap[dateKey] = {
    userId: LOCAL_USER_ID,
    date: dateKey,
    answeredCount,
    correctCount,
    wrongCount,
    reviewedWrongCount,
    clearedWrongCount,
    accuracy: answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0,
    xp,
  }

  writeGrowthDailyStatsMap(dailyStatsMap)
  return dailyStatsMap[dateKey]
}

export function recordGrowthFromExamSubmission(resultPayload = {}) {
  const perQuestionResults = Array.isArray(resultPayload.perQuestionResults)
    ? resultPayload.perQuestionResults
    : []

  if (perQuestionResults.length === 0) {
    return null
  }

  const submittedAt = Number(resultPayload.submittedAt || Date.now())
  const dateKey = getDateKeyFromValue(submittedAt) || getLocalDateKey()
  const answerLogs = getAnswerLogs()
  const questionStateMap = getQuestionStateMap()
  const dailyDelta = {
    answeredCount: 0,
    correctCount: 0,
    wrongCount: 0,
    reviewedWrongCount: 0,
    clearedWrongCount: 0,
    xp: 0,
  }

  perQuestionResults.forEach((item) => {
    const questionId = item.questionKey || getQuestionKey(item) || item.id || ''

    if (!questionId || !item.isAnswered) {
      return
    }

    const previousState = questionStateMap[questionId] || buildQuestionState({}, { questionId, subject: item.subject })
    const wasWrongBefore = Number(previousState.wrongCount || 0) > 0
    const nextStateFields = {
      questionId,
      subject: item.subject || previousState.subject || '',
      lastAnsweredAt: submittedAt,
      nextReviewAt: null,
      clearedAt: previousState.clearedAt || null,
    }

    dailyDelta.answeredCount += 1
    dailyDelta.xp += 2

    if (wasWrongBefore) {
      dailyDelta.reviewedWrongCount += 1
      dailyDelta.xp += 4
    }

    if (item.status === 'correct') {
      dailyDelta.correctCount += 1
      dailyDelta.xp += 3
      nextStateFields.correctStreak = wasWrongBefore
        ? Number(previousState.correctStreak || 0) + 1
        : Number(previousState.correctStreak || 0)
      nextStateFields.wrongCount = Number(previousState.wrongCount || 0)

      if (wasWrongBefore && nextStateFields.correctStreak >= 2) {
        nextStateFields.masteryLevel = 'mastered'

        if (!previousState.clearedAt) {
          nextStateFields.clearedAt = submittedAt
          dailyDelta.clearedWrongCount += 1
          dailyDelta.xp += 10
        }
      } else if (wasWrongBefore) {
        nextStateFields.masteryLevel = 'reviewing'
      } else {
        nextStateFields.masteryLevel = 'new'
      }
    } else if (item.status === 'wrong') {
      dailyDelta.wrongCount += 1
      nextStateFields.wrongCount = Number(previousState.wrongCount || 0) + 1
      nextStateFields.correctStreak = 0
      nextStateFields.masteryLevel = 'weak'
      nextStateFields.clearedAt = null
    }

    questionStateMap[questionId] = buildQuestionState(previousState, nextStateFields)

    answerLogs.push({
      userId: LOCAL_USER_ID,
      questionId,
      subject: item.subject || '',
      isCorrect: item.status === 'correct',
      answeredAt: submittedAt,
      mode: 'mock',
    })
  })

  writeQuestionStateMap(questionStateMap)
  writeAnswerLogs(answerLogs.slice(-20000))
  return updateDailyGrowthStats(dateKey, dailyDelta)
}

function getMergedDailyStatsMap() {
  const baseStudyStats = getStudyStats()
  const growthDailyStats = getGrowthDailyStatsMap()
  const allDateKeys = [...new Set([...Object.keys(baseStudyStats), ...Object.keys(growthDailyStats)])]
  const mergedMap = {}

  allDateKeys.forEach((dateKey) => {
    const baseStats = baseStudyStats[dateKey] || {}
    const growthStats = growthDailyStats[dateKey] || {}
    const answeredCount = Number(growthStats.answeredCount ?? baseStats.answeredCount ?? 0)
    const correctCount = Number(growthStats.correctCount ?? baseStats.correctCount ?? 0)
    const wrongCount = Number(growthStats.wrongCount ?? baseStats.wrongCount ?? 0)
    const reviewedWrongCount = Number(growthStats.reviewedWrongCount ?? 0)
    const clearedWrongCount = Number(growthStats.clearedWrongCount ?? 0)
    const xp =
      Number(growthStats.xp ?? 0) ||
      calculateGrowthXp({
        answeredCount,
        correctCount,
        reviewedWrongCount,
        clearedWrongCount,
      })

    mergedMap[dateKey] = {
      userId: LOCAL_USER_ID,
      date: dateKey,
      answeredCount,
      correctCount,
      wrongCount,
      reviewedWrongCount,
      clearedWrongCount,
      accuracy: answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0,
      xp,
    }
  })

  return mergedMap
}

export function getGrowthPreviewSummary() {
  const streak = calculateStreak()
  const todayKey = getLocalDateKey()
  const mergedDailyStats = getMergedDailyStatsMap()
  const todayStats = mergedDailyStats[todayKey] || {
    xp: 0,
  }

  return {
    streak,
    todayXp: Number(todayStats.xp || 0),
  }
}

export function getSevenDayGrowthData() {
  const mergedDailyStats = getMergedDailyStatsMap()
  const days = getLastDays(7).map((dateKey) => {
    const stats = mergedDailyStats[dateKey] || {
      answeredCount: 0,
      correctCount: 0,
      wrongCount: 0,
      accuracy: 0,
      xp: 0,
    }

    return {
      dateKey,
      label: formatShortDate(dateKey),
      answeredCount: Number(stats.answeredCount || 0),
      correctCount: Number(stats.correctCount || 0),
      wrongCount: Number(stats.wrongCount || 0),
      accuracy: Number(stats.accuracy || 0),
      xp: Number(stats.xp || 0),
    }
  })

  const totalAnswered = days.reduce((total, day) => total + day.answeredCount, 0)

  return {
    days,
    totalAnswered,
    streak: calculateStreak(),
    hasEnoughData: days.filter((day) => day.answeredCount > 0).length >= 2,
    maxAnsweredCount: Math.max(...days.map((day) => day.answeredCount), 0),
  }
}

export function getSubjectPowerStats() {
  const results = getRecentSingleSubjectExamResults(Number.MAX_SAFE_INTEGER)
  const subjectMap = new Map()

  results.forEach((result) => {
    const subject = result.subject || ''
    const answeredCount = Number(result.correctCount || 0) + Number(result.wrongCount || 0)

    if (!subject || answeredCount <= 0) {
      return
    }

    const current = subjectMap.get(subject) || {
      subject,
      answeredCount: 0,
      correctCount: 0,
      wrongCount: 0,
    }

    subjectMap.set(subject, {
      subject,
      answeredCount: current.answeredCount + answeredCount,
      correctCount: current.correctCount + Number(result.correctCount || 0),
      wrongCount: current.wrongCount + Number(result.wrongCount || 0),
    })
  })

  const eligibleRows = [...subjectMap.values()]
    .map((row) => ({
      ...row,
      accuracy: row.answeredCount > 0 ? Math.round((row.correctCount / row.answeredCount) * 100) : 0,
      eligible: row.answeredCount >= SUBJECT_FOCUS_THRESHOLD,
    }))
    .filter((row) => row.eligible)
  const weakestSubject = [...eligibleRows].sort((left, right) => left.accuracy - right.accuracy)[0] || null
  const rows = [...eligibleRows]
    .sort((left, right) => right.accuracy - left.accuracy)
    .map((row) => ({
      ...row,
      needsFocus: Boolean(weakestSubject && weakestSubject.subject === row.subject),
    }))

  return {
    rows,
    weakestSubject,
    hasEnoughData: rows.length > 0,
  }
}

export function getWrongClearanceSummary() {
  const questionStateMap = getQuestionStateMap()
  const questionStates = Object.values(questionStateMap).filter(Boolean)
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 6)
  const weekAgoTime = weekAgo.getTime()

  const wrongQuestionStates = questionStates.filter((state) => Number(state.wrongCount || 0) > 0)
  const clearedStates = wrongQuestionStates.filter(
    (state) => state.masteryLevel === 'mastered' || Number(state.correctStreak || 0) >= 2,
  )
  const activeRiskStates = wrongQuestionStates.filter(
    (state) => !(state.masteryLevel === 'mastered' || Number(state.correctStreak || 0) >= 2),
  )
  const weeklyClearedCount = clearedStates.filter((state) => Number(state.clearedAt || 0) >= weekAgoTime).length
  const totalTracked = clearedStates.length + activeRiskStates.length
  const clearanceRate = totalTracked > 0 ? Math.round((clearedStates.length / totalTracked) * 100) : 0

  return {
    trackedWrongCount: wrongQuestionStates.length,
    clearedCount: clearedStates.length,
    weeklyClearedCount,
    highRiskCount: activeRiskStates.length,
    clearanceRate,
    hasData: wrongQuestionStates.length > 0,
  }
}

function getLongestStreakFromStudyStats() {
  const studyStats = getStudyStats()
  const activeDates = Object.entries(studyStats)
    .filter(([, stats]) => Number(stats?.answeredCount || 0) > 0)
    .map(([dateKey]) => dateKey)
    .sort()

  if (activeDates.length === 0) {
    return 0
  }

  let longest = 1
  let current = 1

  for (let index = 1; index < activeDates.length; index += 1) {
    const previous = getDateFromValue(activeDates[index - 1])
    const currentDate = getDateFromValue(activeDates[index])

    if (!previous || !currentDate) {
      continue
    }

    const diffDays = Math.round((currentDate.getTime() - previous.getTime()) / 86400000)

    if (diffDays === 1) {
      current += 1
      longest = Math.max(longest, current)
    } else {
      current = 1
    }
  }

  return longest
}

export function getPersonalGrowthRecords() {
  const mergedDailyStats = Object.values(getMergedDailyStatsMap())
  const wrongClearance = getWrongClearanceSummary()
  const mockResults = getRecentSingleSubjectExamResults(Number.MAX_SAFE_INTEGER)
  const bestDailyAnswered = mergedDailyStats.reduce(
    (best, stats) => Math.max(best, Number(stats.answeredCount || 0)),
    0,
  )
  const bestAccuracy = mergedDailyStats.reduce((best, stats) => {
    const answeredCount = Number(stats.answeredCount || 0)
    const accuracy = Number(stats.accuracy || 0)
    return answeredCount >= 10 ? Math.max(best, accuracy) : best
  }, 0)
  const highestMockScore = mockResults.reduce(
    (best, result) => Math.max(best, Number(result.score || 0)),
    0,
  )

  return {
    bestDailyAnswered,
    bestAccuracy,
    longestStreak: getLongestStreakFromStudyStats(),
    totalClearedWrong: wrongClearance.clearedCount,
    highestMockScore,
  }
}
