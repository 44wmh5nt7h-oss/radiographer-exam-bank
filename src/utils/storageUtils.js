const WRONG_BOOK_KEY = 'radiographer_exam_bank_wrong_book'
const BOOKMARK_KEY = 'radiographer_exam_bank_bookmarks'
const EXAM_RESULT_KEY_PREFIX = 'radiographer_exam_bank_exam_result'
const EXAM_DATE_KEY = 'radiographer_exam_bank_exam_date'
const DAILY_GOAL_KEY = 'radiographer_exam_bank_daily_goal'
const STUDY_STATS_KEY = 'radiographer_exam_bank_study_stats'
const DAILY_WRONG_QUESTIONS_KEY = 'radiographer_exam_bank_daily_wrong_questions'
const MOCK_EXAM_RESULTS_KEY = 'radiographer_exam_bank_mock_exam_results'
const FULL_MOCK_EXAM_RESULTS_KEY = 'radiographer_exam_bank_full_mock_exam_results'
const DEFAULT_DAILY_GOAL = 40
const MIN_DAILY_GOAL = 1
const MAX_DAILY_GOAL = 480

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

function readStorageArray(key) {
  const parsed = readStorageValue(key, [])
  return Array.isArray(parsed) ? parsed : []
}

function writeStorageArray(key, value) {
  writeStorageValue(key, value)
}

function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function isTodayDateValue(value, todayKey = getLocalDateKey()) {
  if (!value) {
    return false
  }

  if (typeof value === 'number') {
    return getLocalDateKey(new Date(value)) === todayKey
  }

  if (typeof value === 'string') {
    const trimmedValue = value.trim()

    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmedValue)) {
      return trimmedValue === todayKey
    }

    const parsedTime = Date.parse(trimmedValue)
    return Number.isFinite(parsedTime) ? getLocalDateKey(new Date(parsedTime)) === todayKey : false
  }

  return false
}

function getStudyStatsMap() {
  const parsed = readStorageValue(STUDY_STATS_KEY, {})
  return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}
}

function writeStudyStatsMap(value) {
  writeStorageValue(STUDY_STATS_KEY, value)
}

function getDailyWrongQuestionsMap() {
  const parsed = readStorageValue(DAILY_WRONG_QUESTIONS_KEY, {})
  return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}
}

function writeDailyWrongQuestionsMap(value) {
  writeStorageValue(DAILY_WRONG_QUESTIONS_KEY, value)
}

function clampDailyGoal(goal) {
  const numericGoal = Number(goal)

  if (!Number.isFinite(numericGoal)) {
    return DEFAULT_DAILY_GOAL
  }

  return Math.min(MAX_DAILY_GOAL, Math.max(MIN_DAILY_GOAL, Math.round(numericGoal)))
}

function normalizeQuestionNumber(value) {
  if (value === null || value === undefined || value === '') {
    return ''
  }

  const numericValue = Number(value)
  return Number.isFinite(numericValue) ? String(numericValue) : String(value)
}

function normalizeWrongBookEntry(entry) {
  if (typeof entry === 'string' && entry) {
    return { key: entry, status: 'active', userAnswer: '' }
  }

  if (entry && typeof entry === 'object') {
    const key = entry.key || entry.id || entry.questionId

    if (!key) {
      return null
    }

    return {
      key,
      status: entry.status || 'active',
      userAnswer: entry.userAnswer || '',
      subject: entry.subject || '',
      year: entry.year || '',
      session: entry.session || entry.exam_round || entry.examRound || '',
      createdAt: entry.createdAt || entry.savedAt || entry.answeredAt || null,
      answeredAt: entry.answeredAt || entry.createdAt || null,
      date: entry.date || '',
      savedAt: entry.savedAt || null,
      updatedAt: entry.updatedAt || null,
      exam_round: entry.exam_round || entry.examRound || entry.session || '',
      question_number: entry.question_number || entry.questionNumber || '',
      question: entry.question || entry.questionText || entry.stem || '',
      questionText: entry.questionText || entry.question || entry.stem || '',
      stem: entry.stem || entry.question || entry.questionText || '',
      options: entry.options && typeof entry.options === 'object' ? entry.options : {},
      answer: entry.answer || entry.correctAnswer || '',
      correctAnswer: entry.correctAnswer || entry.answer || '',
      explanation:
        entry.explanation ??
        entry.detailedExplanation ??
        entry.aiExplanation ??
        entry.solution ??
        entry.analysis ??
        '',
      detailedExplanation: entry.detailedExplanation ?? null,
      aiExplanation: entry.aiExplanation ?? null,
      solution: entry.solution ?? null,
      analysis: entry.analysis ?? null,
      tags: entry.tags || entry.tag || entry.topicTags || [],
      tag: entry.tag || '',
      categories: entry.categories || [],
      knowledgePoints: entry.knowledgePoints || [],
    }
  }

  return null
}

function getWrongBookEntries() {
  const entries = readStorageArray(WRONG_BOOK_KEY)
  const entryMap = new Map()

  entries.forEach((entry) => {
    const normalizedEntry = normalizeWrongBookEntry(entry)

    if (normalizedEntry) {
      entryMap.set(normalizedEntry.key, normalizedEntry)
    }
  })

  return Array.from(entryMap.values())
}

function writeWrongBookEntries(entries) {
  writeStorageArray(WRONG_BOOK_KEY, entries)
}

function normalizeBookmarkEntry(entry) {
  if (typeof entry === 'string' && entry) {
    return entry
  }

  if (entry && typeof entry === 'object') {
    return entry.key || entry.id || entry.questionId || ''
  }

  return ''
}

function normalizeYearRange(result) {
  if (result.yearRange) {
    return result.yearRange
  }

  if (result.startYear && result.endYear) {
    return `${result.startYear}–${result.endYear} 年`
  }

  return ''
}

function normalizeSingleSubjectResult(result) {
  if (!result || typeof result !== 'object') {
    return null
  }

  const totalQuestions = Number(result.totalQuestions ?? result.totalCount ?? 0)
  const correctCount = Number(result.correctCount ?? 0)
  const wrongCount = Number(result.wrongCount ?? 0)
  const unansweredCount = Number(
    result.unansweredCount ?? Math.max(0, totalQuestions - correctCount - wrongCount),
  )

  return {
    type: 'single_subject',
    subject: result.subject || '',
    date: result.date || getLocalDateKey(),
    totalQuestions,
    correctCount,
    wrongCount,
    unansweredCount,
    score: Number(result.score ?? 0),
    elapsedTime: Number(result.elapsedTime ?? result.elapsedSeconds ?? 0),
    yearRange: normalizeYearRange(result),
    wrongQuestions: Array.isArray(result.wrongQuestions) ? result.wrongQuestions.filter(Boolean) : [],
    savedAt: Number(result.savedAt ?? result.submittedAt ?? Date.now()),
  }
}

function normalizeFullMockExamResult(result) {
  if (!result || typeof result !== 'object') {
    return null
  }

  return {
    type: 'full_mock_exam',
    date: result.date || getLocalDateKey(),
    totalQuestions: Number(result.totalQuestions ?? 0),
    totalScore: Number(result.totalScore ?? result.score ?? 0),
    totalCorrectCount: Number(result.totalCorrectCount ?? result.correctCount ?? 0),
    totalWrongCount: Number(result.totalWrongCount ?? result.wrongCount ?? 0),
    totalUnansweredCount: Number(result.totalUnansweredCount ?? result.unansweredCount ?? 0),
    elapsedTime: Number(result.elapsedTime ?? result.elapsedSeconds ?? 0),
    subjects: Array.isArray(result.subjects) ? result.subjects : [],
    savedAt: Number(result.savedAt ?? result.submittedAt ?? Date.now()),
  }
}

function sortResultsBySavedAt(results) {
  return [...results].sort((left, right) => Number(right.savedAt || 0) - Number(left.savedAt || 0))
}

function normalizeTagList(rawTags) {
  if (!rawTags) {
    return []
  }

  if (Array.isArray(rawTags)) {
    return rawTags.flatMap((item) => normalizeTagList(item))
  }

  if (typeof rawTags === 'string') {
    return rawTags
      .split(/[、,，]/)
      .map((tag) => tag.trim())
      .filter(Boolean)
  }

  if (typeof rawTags === 'object') {
    const preferredKeys = ['name', 'label', 'value', 'tag', 'title']

    for (const key of preferredKeys) {
      if (rawTags[key]) {
        return normalizeTagList(rawTags[key])
      }
    }

    return Object.values(rawTags).flatMap((value) => normalizeTagList(value))
  }

  return []
}

const GENERIC_TAGS = new Set([
  '基礎醫學',
  '基礎醫學（包括解剖學、生理學與病理學）',
  '醫學物理學與輻射安全',
  '放射線診斷原理與技術學',
  '放射線治療原理與技術學',
  '放射線器材學',
  '放射線器材學（包括磁振學與超音波學）',
  '核子醫學診療原理與技術學',
  '解剖學',
  '生理學',
  '病理學',
  '藥理學',
  '神經系統',
  '消化系統',
  '循環系統',
  '呼吸系統',
  '泌尿系統',
  '內分泌系統',
  '影像品質',
  '磁振造影',
  '放射治療',
  '核子醫學',
])

const MEDIUM_SPECIFICITY_TAGS = new Set([
  '肌肉生理',
  '細胞生物學',
  '腦部血管',
  '神經解剖學',
  '胃腺',
  '胃生理',
  '劑量學',
  '輻射生物效應',
  'MRI',
  '影像參數',
  '超音波',
  '病灶定位',
  '血液循環',
  '骨骼系統',
  '呼吸生理',
])

function parsePossibleJsonObject(value) {
  if (!value) {
    return null
  }

  if (typeof value === 'object') {
    return value
  }

  if (typeof value !== 'string') {
    return null
  }

  const trimmedValue = value.trim()

  if (!trimmedValue.startsWith('{') && !trimmedValue.startsWith('[')) {
    return null
  }

  try {
    const parsed = JSON.parse(trimmedValue)
    return parsed && typeof parsed === 'object' ? parsed : null
  } catch {
    return null
  }
}

export function extractQuestionTags(question) {
  if (!question || typeof question !== 'object') {
    return []
  }

  const explanationObject = parsePossibleJsonObject(question.explanation)
  const detailedExplanationObject = parsePossibleJsonObject(question.detailedExplanation)
  const aiExplanationObject = parsePossibleJsonObject(question.aiExplanation)
  const solutionObject = parsePossibleJsonObject(question.solution)
  const analysisObject = parsePossibleJsonObject(question.analysis)

  return [...new Set([
    ...normalizeTagList(question.tags),
    ...normalizeTagList(question.tag),
    ...normalizeTagList(question.categories),
    ...normalizeTagList(question.knowledgePoints),
    ...normalizeTagList(question.topicTags),
    ...normalizeTagList(explanationObject?.tags),
    ...normalizeTagList(detailedExplanationObject?.tags),
    ...normalizeTagList(aiExplanationObject?.tags),
    ...normalizeTagList(solutionObject?.tags),
    ...normalizeTagList(analysisObject?.tags),
  ])].filter(Boolean)
}

export function scoreTagSpecificity(tag) {
  if (!tag || typeof tag !== 'string') {
    return 0
  }

  const normalizedTag = tag.trim()

  if (!normalizedTag) {
    return 0
  }

  if (GENERIC_TAGS.has(normalizedTag)) {
    return 1
  }

  let score = MEDIUM_SPECIFICITY_TAGS.has(normalizedTag) ? 4 : 7

  if (normalizedTag.length >= 4) {
    score += 1
  }

  if (normalizedTag.length >= 6) {
    score += 1
  }

  if (/[A-Za-z0-9/＋+\-]/.test(normalizedTag)) {
    score += 2
  }

  if (
    /(收縮|潛伏期|動脈|靜脈|血管|壁細胞|胃酸|參數|解析度|訊雜比|半衰期|劑量|換算|單位|受體|酵素|電位|灌流|代謝|病變|腫瘤|構造|徵象|影像|藥物|序列|週期|壓力|容積|基底|神經核|反射|定位|吸收|排泄)/.test(
      normalizedTag,
    )
  ) {
    score += 3
  }

  if (/(學|系統|造影|品質|治療|醫學)$/.test(normalizedTag)) {
    score -= 2
  }

  return Math.max(1, score)
}

function rankTagsBySpecificity(tags = []) {
  return [...new Set(tags.filter(Boolean))]
    .map((tag) => ({
      value: tag,
      specificityScore: scoreTagSpecificity(tag),
    }))
    .sort((left, right) => {
      if (right.specificityScore !== left.specificityScore) {
        return right.specificityScore - left.specificityScore
      }

      if (right.value.length !== left.value.length) {
        return right.value.length - left.value.length
      }

      return left.value.localeCompare(right.value, 'zh-Hant')
    })
}

function getQuestionAnalysisTags(question, limit = 3) {
  const rawTags = extractQuestionTags(question)
  const specificTags = rawTags.filter((tag) => tag && !GENERIC_TAGS.has(tag))
  const candidateTags = specificTags.length > 0 ? specificTags : rawTags.filter(Boolean)

  return rankTagsBySpecificity(candidateTags)
    .slice(0, limit)
    .map((item) => item.value)
}

function countItems(items) {
  const counts = new Map()

  items.forEach((item) => {
    if (!item) {
      return
    }

    counts.set(item, (counts.get(item) || 0) + 1)
  })

  return [...counts.entries()]
    .sort((left, right) => right[1] - left[1])
    .map(([value, count]) => ({ value, count }))
}

export function getQuestionKey(question) {
  if (typeof question === 'string') {
    return question
  }

  if (!question || typeof question !== 'object') {
    return ''
  }

  if (question.id) {
    return question.id
  }

  const subject = question.subject || 'unknown-subject'
  const year = question.year || 'unknown-year'
  const examRound =
    question.exam_round || question.examRound || question.session || question.exam_session || 'unknown-round'
  const questionNumber = normalizeQuestionNumber(
    question.question_number ?? question.questionNumber ?? question.no,
  )

  return `${subject}-${year}-${examRound}-${questionNumber}`
}

export function getWrongBookIds() {
  return getWrongBookEntries()
    .filter((entry) => entry.status !== 'resolved')
    .map((entry) => entry.key)
}

export function getWrongBookItems() {
  return getWrongBookEntries().filter((entry) => entry.status !== 'resolved')
}

export function getTodayWrongQuestions() {
  const todayKey = getLocalDateKey()
  return readStorageArray(DAILY_WRONG_QUESTIONS_KEY)
    .filter(Boolean)
    .filter((item) => item.dateKey === todayKey)
}

export function appendTodayWrongQuestions(questions) {
  const todayKey = getLocalDateKey()
  const now = Date.now()
  const currentItems = readStorageArray(DAILY_WRONG_QUESTIONS_KEY)
  const preservedItems = currentItems.filter((item) => item?.dateKey !== todayKey)
  const todayEntryMap = new Map(
    currentItems
      .filter((item) => item?.dateKey === todayKey)
      .filter(Boolean)
      .map((item) => [item.key || getQuestionKey(item), item]),
  )

  questions.forEach((question) => {
    const questionKey = getQuestionKey(question)

    if (!questionKey) {
      return
    }

    todayEntryMap.set(questionKey, {
      key: questionKey,
      dateKey: todayKey,
      createdAt: now,
      answeredAt: now,
      date: todayKey,
      subject: question.subject || '',
      year: question.year || '',
      session: question.session || question.exam_round || question.examRound || '',
      exam_round: question.exam_round || '',
      question_number: question.question_number || '',
      question: question.question || question.questionText || question.stem || '',
      questionText: question.questionText || question.question || question.stem || '',
      stem: question.stem || question.question || question.questionText || '',
      options: question.options && typeof question.options === 'object' ? question.options : {},
      answer: question.answer || question.correctAnswer || '',
      correctAnswer: question.correctAnswer || question.answer || '',
      explanation:
        question.explanation ??
        question.detailedExplanation ??
        question.aiExplanation ??
        question.solution ??
        question.analysis ??
        '',
      detailedExplanation: question.detailedExplanation ?? null,
      aiExplanation: question.aiExplanation ?? null,
      solution: question.solution ?? null,
      analysis: question.analysis ?? null,
      tags: extractQuestionTags(question),
      userAnswer: question.userAnswer || '',
      status: question.status || 'wrong',
    })
  })

  const nextItems = [...preservedItems, ...todayEntryMap.values()]

  writeStorageArray(DAILY_WRONG_QUESTIONS_KEY, nextItems)

  return nextItems.filter((item) => item?.dateKey === todayKey)
}

function formatTagSummary(topTags) {
  return topTags.slice(0, 3).map((item) => item.value).join('、')
}

function normalizeWrongAnalysisItem(item = {}) {
  const questionKey = getQuestionKey(item)

  return {
    ...item,
    key: item.key || item.questionKey || questionKey,
    questionKey: item.questionKey || item.key || questionKey,
    subject: item.subject || '',
    year: item.year || '',
    exam_round: item.exam_round || item.examRound || item.session || '',
    question_number: item.question_number || item.questionNumber || '',
  }
}

function getStoredExamResultPayloads() {
  if (!canUseStorage()) {
    return []
  }

  const prefix = `${EXAM_RESULT_KEY_PREFIX}:`

  return Object.keys(window.localStorage)
    .filter((key) => key.startsWith(prefix))
    .map((key) => {
      try {
        const parsed = JSON.parse(window.localStorage.getItem(key) || 'null')
        return parsed && typeof parsed === 'object' ? parsed : null
      } catch {
        return null
      }
    })
    .filter(Boolean)
}

function collectDatedWrongBookItems(todayKey) {
  return getWrongBookEntries()
    .filter((entry) =>
      [entry.createdAt, entry.answeredAt, entry.date, entry.savedAt, entry.updatedAt].some((value) =>
        isTodayDateValue(value, todayKey),
      ),
    )
    .map(normalizeWrongAnalysisItem)
}

function collectLatestSingleSubjectWrongItems(todayKey) {
  const latestTodayResult = getRecentSingleSubjectExamResults(Number.MAX_SAFE_INTEGER).find((result) =>
    [result.date, result.savedAt].some((value) => isTodayDateValue(value, todayKey)),
  )

  if (!latestTodayResult || !Array.isArray(latestTodayResult.wrongQuestions)) {
    return []
  }

  return latestTodayResult.wrongQuestions.map(normalizeWrongAnalysisItem)
}

function collectTodayExamPayloadWrongItems(todayKey) {
  return getStoredExamResultPayloads()
    .filter((result) =>
      [result.submittedAt, result.savedAt, result.date].some((value) => isTodayDateValue(value, todayKey)),
    )
    .sort((left, right) => Number(right.submittedAt || right.savedAt || 0) - Number(left.submittedAt || left.savedAt || 0))
    .flatMap((result) =>
      Array.isArray(result.wrongQuestions) ? result.wrongQuestions.map(normalizeWrongAnalysisItem) : [],
    )
}

export function getTodayWrongAnalysisItems() {
  const todayKey = getLocalDateKey()
  const todayStats = getTodayStats()
  const sourceItems = []
  const wrongItemMap = new Map()

  const addItems = (source, items) => {
    const normalizedItems = Array.isArray(items) ? items.map(normalizeWrongAnalysisItem).filter(Boolean) : []

    sourceItems.push({
      source,
      count: normalizedItems.length,
    })

    normalizedItems.forEach((item) => {
      const itemKey = item.key || item.questionKey || getQuestionKey(item)

      if (!itemKey) {
        return
      }

      wrongItemMap.set(itemKey, {
        ...wrongItemMap.get(itemKey),
        ...item,
      })
    })
  }

  addItems('today_session_wrong_questions', getTodayWrongQuestions())
  addItems('today_added_wrong_book_items', collectDatedWrongBookItems(todayKey))
  addItems('latest_single_subject_result', collectLatestSingleSubjectWrongItems(todayKey))
  addItems('today_exam_result_payloads', collectTodayExamPayloadWrongItems(todayKey))

  const hasActivity =
    Number(todayStats.answeredCount || 0) > 0 ||
    sourceItems.some((item) => item.count > 0) ||
    getRecentSingleSubjectExamResults(1).some((result) =>
      [result.date, result.savedAt].some((value) => isTodayDateValue(value, todayKey)),
    )

  return {
    todayKey,
    todayStats,
    hasActivity,
    sourceItems,
    wrongItems: Array.from(wrongItemMap.values()),
  }
}

export function getTopWrongTags(limit = 5, todayWrongQuestions = [], options = {}) {
  return analyzeTodayWrongTags(todayWrongQuestions, options).topTags.slice(0, limit)
}

export function generateReviewSuggestion(tags = [], subjects = []) {
  const tagValues = tags.map((item) => item.value)

  if (tagValues.some((tag) => ['腦幹', '腦血管', '基底動脈', 'Circle of Willis'].includes(tag))) {
    return '先複習腦部血管供應與 Circle of Willis，再重做相關錯題。'
  }

  if (tagValues.some((tag) => ['胃', '胃酸', '壁細胞', '胃腺'].includes(tag))) {
    return '先複習胃腺細胞種類與分泌物，再比較各選項差異。'
  }

  if (tagValues.some((tag) => ['劑量', '單位', '輻射防護', '劑量換算'].includes(tag))) {
    return '先整理常見劑量單位與換算，再練習計算題。'
  }

  if (tagValues.some((tag) => ['MRI', 'T1', 'T2', '影像參數'].includes(tag))) {
    return '先複習 MRI 基本原理、T1/T2 與常見影像參數，再回頭重做同類題。'
  }

  if (tagValues.length > 0) {
    return `先針對 ${tagValues.slice(0, 3).join('、')} 這幾個小觀念複習，再重做今日錯題。`
  }

  if (subjects.length > 0) {
    const primarySubjects = subjects.slice(0, 2).map((item) => item.value).join('、')
    return `目前題目標籤尚未完整建立，建議先回到 ${primarySubjects} 的錯題複習。`
  }

  return '今日尚未有足夠作答資料可供分析。'
}

export function analyzeTodayWrongTags(todayWrongQuestions = [], options = {}) {
  const wrongQuestions = Array.isArray(todayWrongQuestions) ? todayWrongQuestions.filter(Boolean) : []
  const { hasActivity = false } = options

  if (!hasActivity && wrongQuestions.length === 0) {
    return {
      hasData: false,
      status: 'no_activity',
      hasWrongQuestions: false,
      hasTagData: false,
      wrongCount: 0,
      topTags: [],
      topSubjects: [],
      summary: '今日尚未開始作答，完成一些題目後即可分析弱點。',
      reviewSuggestion: '完成一些題目後，這裡會提供今日弱點分析。',
    }
  }

  if (wrongQuestions.length === 0) {
    return {
      hasData: true,
      status: 'no_wrong_questions',
      hasWrongQuestions: false,
      hasTagData: false,
      wrongCount: 0,
      topTags: [],
      topSubjects: [],
      summary: '今日目前沒有錯題，整體表現穩定。',
      reviewSuggestion: '維持目前節奏即可，若有餘裕可進行單科限時測驗。',
    }
  }

  const perQuestionTags = wrongQuestions.map((question) => getQuestionAnalysisTags(question, 3))
  const allSpecificTags = perQuestionTags.flatMap((tags) => tags)
  const fallbackTags = wrongQuestions
    .flatMap((question) => rankTagsBySpecificity(extractQuestionTags(question)).slice(0, 3).map((item) => item.value))
    .filter(Boolean)
  const effectiveTags = allSpecificTags.length > 0 ? allSpecificTags : fallbackTags
  const tagAggregateMap = new Map()

  effectiveTags.forEach((tag) => {
    const specificityScore = scoreTagSpecificity(tag)
    const currentValue = tagAggregateMap.get(tag) || {
      value: tag,
      count: 0,
      specificityScore,
      finalScore: 0,
    }

    const nextCount = currentValue.count + 1
    const nextSpecificityScore = Math.max(currentValue.specificityScore, specificityScore)

    tagAggregateMap.set(tag, {
      value: tag,
      count: nextCount,
      specificityScore: nextSpecificityScore,
      finalScore: nextCount * 2 + nextSpecificityScore,
    })
  })

  const topTags = [...tagAggregateMap.values()]
    .sort((left, right) => {
      if (right.finalScore !== left.finalScore) {
        return right.finalScore - left.finalScore
      }

      if (right.count !== left.count) {
        return right.count - left.count
      }

      if (right.specificityScore !== left.specificityScore) {
        return right.specificityScore - left.specificityScore
      }

      return left.value.localeCompare(right.value, 'zh-Hant')
    })
    .slice(0, 5)
  const topSubjects = countItems(wrongQuestions.map((question) => question.subject).filter(Boolean)).slice(0, 3)
  const hasTagData = topTags.length > 0

  if (hasTagData) {
    return {
      hasData: true,
      status: 'has_tag_data',
      hasWrongQuestions: true,
      hasTagData: true,
      wrongCount: wrongQuestions.length,
      topTags,
      topSubjects,
      summary: `今日錯題較集中在：${formatTagSummary(topTags)}。建議先釐清這些小觀念，再回頭重做錯題。`,
      reviewSuggestion: generateReviewSuggestion(topTags, topSubjects),
    }
  }

  const summarySubjects = topSubjects.slice(0, 2).map((item) => item.value)

  return {
    hasData: true,
    status: 'missing_tags',
    hasWrongQuestions: true,
    hasTagData: false,
    wrongCount: wrongQuestions.length,
    topTags: [],
    topSubjects,
    summary:
      summarySubjects.length > 0
        ? `今日錯題主要集中在：${summarySubjects.join('、')}。目前題目標籤尚未完整，建議先回到該科錯題複習。`
        : '今日已有錯題，但目前題目標籤尚未完整，建議先回到錯題本逐題複習。',
    reviewSuggestion: generateReviewSuggestion([], topSubjects),
  }
}

export function analyzeTodayWrongQuestionTags() {
  const todayAnalysisInput = getTodayWrongAnalysisItems()
  return analyzeTodayWrongTags(todayAnalysisInput.wrongItems, {
    hasActivity: todayAnalysisInput.hasActivity,
  })
}

export function getTodayPerformanceSummary({ targetCount, completedCount, wrongCount }) {
  const safeTargetCount = Math.max(1, Number(targetCount || 0))
  const safeCompletedCount = Math.max(0, Number(completedCount || 0))
  const safeWrongCount = Math.max(0, Number(wrongCount || 0))
  const completionRate = safeCompletedCount / safeTargetCount
  const completionPercent = Math.round(completionRate * 100)
  const remainingCount = Math.max(0, safeTargetCount - safeCompletedCount)

  if (safeCompletedCount < safeTargetCount) {
    let nextStep = '建議再完成一組練習，穩定推進進度。'

    if (remainingCount > 60) {
      nextStep = '建議分成 2～3 回合完成，避免疲勞。'
    } else if (remainingCount < 20) {
      nextStep = '距離今日目標不遠，可以完成最後衝刺。'
    }

    return {
      completionPercent,
      remainingCount,
      encouragement:
        safeCompletedCount === 0
          ? '今天先從第一組題目開始，先把節奏建立起來。'
          : `今天已經開始累積進度，目前已完成 ${completionPercent}%，繼續保持節奏。`,
      nextStep,
      targetStatus: `距離今日目標還剩 ${remainingCount} 題`,
      extraNote:
        safeWrongCount > 0 ? `今天目前累積 ${safeWrongCount} 題錯題，完成進度後記得回頭修正。` : '',
      isComplete: false,
    }
  }

  return {
    completionPercent,
    remainingCount: 0,
    encouragement:
      safeCompletedCount > 100
        ? '今日目標已完成，而且今天的作答量相當高，維持得很好。'
        : '今日目標已完成，維持得很好。',
    nextStep:
      safeWrongCount > 0
        ? '建議接下來複習今日錯題與高風險題目。'
        : '今日表現穩定，可以進行單科限時測驗。',
    targetStatus: '今日目標已達成',
    extraNote: safeCompletedCount > 100 ? '今日作答量偏高，建議適度休息避免疲勞。' : '',
    isComplete: true,
  }
}

export function saveWrongQuestionIds(questionItems) {
  const entryMap = new Map(getWrongBookEntries().map((entry) => [entry.key, entry]))
  const now = Date.now()
  const todayKey = getLocalDateKey()

  questionItems.forEach((questionItem) => {
    const questionKey = getQuestionKey(questionItem)

    if (questionKey) {
      entryMap.set(questionKey, {
        key: questionKey,
        status: 'active',
        userAnswer: typeof questionItem === 'object' ? questionItem.userAnswer || '' : '',
        subject: typeof questionItem === 'object' ? questionItem.subject || '' : '',
        year: typeof questionItem === 'object' ? questionItem.year || '' : '',
        session:
          typeof questionItem === 'object'
            ? questionItem.session || questionItem.exam_round || questionItem.examRound || ''
            : '',
        createdAt:
          typeof questionItem === 'object' ? questionItem.createdAt || questionItem.answeredAt || now : now,
        answeredAt:
          typeof questionItem === 'object' ? questionItem.answeredAt || questionItem.createdAt || now : now,
        date: typeof questionItem === 'object' ? questionItem.date || todayKey : todayKey,
        exam_round:
          typeof questionItem === 'object'
            ? questionItem.exam_round || questionItem.examRound || questionItem.session || ''
            : '',
        question_number:
          typeof questionItem === 'object'
            ? questionItem.question_number || questionItem.questionNumber || ''
            : '',
        question:
          typeof questionItem === 'object'
            ? questionItem.question || questionItem.questionText || questionItem.stem || ''
            : '',
        questionText:
          typeof questionItem === 'object'
            ? questionItem.questionText || questionItem.question || questionItem.stem || ''
            : '',
        stem:
          typeof questionItem === 'object'
            ? questionItem.stem || questionItem.question || questionItem.questionText || ''
            : '',
        options:
          typeof questionItem === 'object' && questionItem.options && typeof questionItem.options === 'object'
            ? questionItem.options
            : {},
        answer:
          typeof questionItem === 'object'
            ? questionItem.answer || questionItem.correctAnswer || ''
            : '',
        correctAnswer:
          typeof questionItem === 'object'
            ? questionItem.correctAnswer || questionItem.answer || ''
            : '',
        explanation:
          typeof questionItem === 'object'
            ? questionItem.explanation ??
              questionItem.detailedExplanation ??
              questionItem.aiExplanation ??
              questionItem.solution ??
              questionItem.analysis ??
              ''
            : '',
        detailedExplanation: typeof questionItem === 'object' ? questionItem.detailedExplanation ?? null : null,
        aiExplanation: typeof questionItem === 'object' ? questionItem.aiExplanation ?? null : null,
        solution: typeof questionItem === 'object' ? questionItem.solution ?? null : null,
        analysis: typeof questionItem === 'object' ? questionItem.analysis ?? null : null,
        tags:
          typeof questionItem === 'object'
            ? questionItem.tags || questionItem.tag || questionItem.topicTags || []
            : [],
        tag: typeof questionItem === 'object' ? questionItem.tag || '' : '',
        categories: typeof questionItem === 'object' ? questionItem.categories || [] : [],
        knowledgePoints: typeof questionItem === 'object' ? questionItem.knowledgePoints || [] : [],
      })
    }
  })

  writeWrongBookEntries(Array.from(entryMap.values()))
}

export function removeWrongQuestion(questionKey) {
  writeWrongBookEntries(getWrongBookEntries().filter((entry) => entry.key !== questionKey))
  return getWrongBookIds()
}

export function updateWrongQuestionStatus(questionKey, status = 'resolved') {
  const entryMap = new Map(getWrongBookEntries().map((entry) => [entry.key, entry]))
  const currentEntry = entryMap.get(questionKey)

  if (!currentEntry) {
    return getWrongBookIds()
  }

  entryMap.set(questionKey, {
    ...currentEntry,
    status,
  })

  writeWrongBookEntries(Array.from(entryMap.values()))
  return getWrongBookIds()
}

export function getBookmarkIds() {
  const bookmarkIds = readStorageArray(BOOKMARK_KEY).map(normalizeBookmarkEntry).filter(Boolean)
  return [...new Set(bookmarkIds)]
}

export function removeFavoriteQuestion(questionKey) {
  const nextIds = getBookmarkIds().filter((id) => id !== questionKey)
  writeStorageArray(BOOKMARK_KEY, nextIds)
  return nextIds
}

export function toggleBookmark(questionId) {
  const currentIds = getBookmarkIds()
  const questionKey = getQuestionKey(questionId)
  const nextIds = currentIds.includes(questionKey)
    ? currentIds.filter((id) => id !== questionKey)
    : [...currentIds, questionKey]

  writeStorageArray(BOOKMARK_KEY, nextIds)

  return nextIds
}

function getExamResultKey(subject) {
  return `${EXAM_RESULT_KEY_PREFIX}:${subject}`
}

export function saveExamResult(subject, result) {
  if (!canUseStorage()) {
    return
  }

  window.localStorage.setItem(getExamResultKey(subject), JSON.stringify(result))
}

export function getExamResult(subject) {
  if (!canUseStorage()) {
    return null
  }

  try {
    const rawValue = window.localStorage.getItem(getExamResultKey(subject))
    return rawValue ? JSON.parse(rawValue) : null
  } catch {
    return null
  }
}

export function getExamDate() {
  const parsed = readStorageValue(EXAM_DATE_KEY, '')
  return typeof parsed === 'string' ? parsed : ''
}

export function setExamDate(dateString) {
  writeStorageValue(EXAM_DATE_KEY, dateString || '')
}

export function getDailyGoal() {
  return clampDailyGoal(readStorageValue(DAILY_GOAL_KEY, DEFAULT_DAILY_GOAL))
}

export function setDailyGoal(goal) {
  const normalizedGoal = clampDailyGoal(goal)
  writeStorageValue(DAILY_GOAL_KEY, normalizedGoal)
  return normalizedGoal
}

export function getStudyStats() {
  return getStudyStatsMap()
}

export function getTodayStats() {
  const todayKey = getLocalDateKey()
  const todayStats = getStudyStatsMap()[todayKey]

  return {
    answeredCount: Number(todayStats?.answeredCount || 0),
    correctCount: Number(todayStats?.correctCount || 0),
    wrongCount: Number(todayStats?.wrongCount || 0),
  }
}

export function updateTodayStats({
  answeredCountDelta = 0,
  correctCountDelta = 0,
  wrongCountDelta = 0,
} = {}) {
  const todayKey = getLocalDateKey()
  const studyStats = getStudyStatsMap()
  const currentStats = studyStats[todayKey] || {
    answeredCount: 0,
    correctCount: 0,
    wrongCount: 0,
  }

  studyStats[todayKey] = {
    answeredCount: Math.max(0, Number(currentStats.answeredCount || 0) + Number(answeredCountDelta || 0)),
    correctCount: Math.max(0, Number(currentStats.correctCount || 0) + Number(correctCountDelta || 0)),
    wrongCount: Math.max(0, Number(currentStats.wrongCount || 0) + Number(wrongCountDelta || 0)),
  }

  writeStudyStatsMap(studyStats)

  return studyStats[todayKey]
}

export function calculateStreak() {
  const studyStats = getStudyStatsMap()
  const activeDates = new Set(
    Object.entries(studyStats)
      .filter(([, stats]) => Number(stats?.answeredCount || 0) > 0)
      .map(([dateKey]) => dateKey),
  )

  if (activeDates.size === 0) {
    return 0
  }

  const today = new Date()
  const todayKey = getLocalDateKey(today)
  const cursor = new Date(today)

  if (!activeDates.has(todayKey)) {
    cursor.setDate(cursor.getDate() - 1)
  }

  let streak = 0

  while (activeDates.has(getLocalDateKey(cursor))) {
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }

  return streak
}

export function saveSingleSubjectExamResult(result) {
  const normalizedResult = normalizeSingleSubjectResult({
    ...result,
    type: 'single_subject',
  })

  if (!normalizedResult) {
    return getRecentSingleSubjectExamResults()
  }

  const nextResults = [normalizedResult, ...getRecentSingleSubjectExamResults(Number.MAX_SAFE_INTEGER)]
  writeStorageArray(MOCK_EXAM_RESULTS_KEY, nextResults)

  return nextResults
}

export function getRecentSingleSubjectExamResults(limit = 3) {
  const results = readStorageArray(MOCK_EXAM_RESULTS_KEY)
    .map((result) => {
      if (result?.type === 'full_mock_exam') {
        return null
      }

      return normalizeSingleSubjectResult(result)
    })
    .filter(Boolean)

  return sortResultsBySavedAt(results).slice(0, limit)
}

export function getSingleSubjectScoreTrend(limit = 5) {
  return getRecentSingleSubjectExamResults(limit)
}

export function saveFullMockExamResult(result) {
  const normalizedResult = normalizeFullMockExamResult(result)

  if (!normalizedResult) {
    return getRecentFullMockExamResults()
  }

  const nextResults = [normalizedResult, ...getRecentFullMockExamResults(Number.MAX_SAFE_INTEGER)]
  writeStorageArray(FULL_MOCK_EXAM_RESULTS_KEY, nextResults)

  return nextResults
}

export function getRecentFullMockExamResults(limit = 3) {
  const results = readStorageArray(FULL_MOCK_EXAM_RESULTS_KEY)
    .map(normalizeFullMockExamResult)
    .filter(Boolean)

  return sortResultsBySavedAt(results).slice(0, limit)
}

export function getFullMockExamScoreTrend(limit = 5) {
  return getRecentFullMockExamResults(limit)
}

export function saveMockExamResult(result) {
  return saveSingleSubjectExamResult(result)
}

export function getRecentMockExamResults(limit = 3) {
  return getRecentSingleSubjectExamResults(limit)
}
