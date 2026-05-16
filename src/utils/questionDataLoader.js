import { EXAM_SUBJECTS } from '../constants/subjects'
import { getQuestionKey } from './storageUtils'
import { normalizeQuestionKey } from './subjectUtils'

const QUESTION_INDEX_PATH = '/data/question-index.json'
const QUESTION_KEY_MAP_PATH = '/data/question-key-map.json'
const QUESTION_INDEX_CACHE_KEY = 'radiographer_exam_bank_question_index_cache_v1'

const memoryCache = {
  questionIndex: null,
  questionIndexPromise: null,
  questionKeyMap: null,
  questionKeyMapPromise: null,
  fileMap: new Map(),
  filePromiseMap: new Map(),
}

const SUBJECT_ALIAS_MAP = new Map(
  EXAM_SUBJECTS.flatMap((subject) =>
    [subject.name, ...subject.sourceSubjects].map((alias) => [normalizeText(alias), subject.name]),
  ),
)

function normalizeText(value) {
  return String(value || '')
    .normalize('NFKC')
    .replace(/[（）]/g, (char) => (char === '（' ? '(' : ')'))
    .replace(/\s+/g, '')
    .trim()
}

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function readCachedQuestionIndex() {
  if (!canUseStorage()) {
    return null
  }

  try {
    const rawValue = window.localStorage.getItem(QUESTION_INDEX_CACHE_KEY)
    const parsed = rawValue ? JSON.parse(rawValue) : null
    return Array.isArray(parsed) ? parsed : null
  } catch {
    return null
  }
}

function writeCachedQuestionIndex(index) {
  if (!canUseStorage()) {
    return
  }

  try {
    window.localStorage.setItem(QUESTION_INDEX_CACHE_KEY, JSON.stringify(index))
  } catch {
    // Ignore storage write failures to avoid breaking runtime.
  }
}

async function fetchJson(path) {
  const response = await fetch(path, {
    headers: {
      Accept: 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch ${path}: ${response.status}`)
  }

  return response.json()
}

export function normalizeExamSubject(subject = '') {
  const normalizedValue = normalizeText(subject)

  if (!normalizedValue) {
    return ''
  }

  if (SUBJECT_ALIAS_MAP.has(normalizedValue)) {
    return SUBJECT_ALIAS_MAP.get(normalizedValue)
  }

  const compactValue = normalizedValue.replace(/\(.+\)/, '')

  for (const [alias, canonicalSubject] of SUBJECT_ALIAS_MAP.entries()) {
    const compactAlias = alias.replace(/\(.+\)/, '')

    if (
      normalizedValue === alias ||
      normalizedValue.includes(alias) ||
      alias.includes(normalizedValue) ||
      compactValue === compactAlias ||
      compactValue.includes(compactAlias) ||
      compactAlias.includes(compactValue)
    ) {
      return canonicalSubject
    }
  }

  return subject
}

export async function getQuestionIndex() {
  if (memoryCache.questionIndex) {
    return memoryCache.questionIndex
  }

  if (!memoryCache.questionIndexPromise) {
    memoryCache.questionIndexPromise = (async () => {
      const cachedIndex = readCachedQuestionIndex()

      if (cachedIndex) {
        memoryCache.questionIndex = cachedIndex
      }

      try {
        const fetchedIndex = await fetchJson(QUESTION_INDEX_PATH)
        memoryCache.questionIndex = Array.isArray(fetchedIndex) ? fetchedIndex : []
        writeCachedQuestionIndex(memoryCache.questionIndex)
      } catch (error) {
        if (!memoryCache.questionIndex) {
          throw error
        }
      }

      return memoryCache.questionIndex
    })().finally(() => {
      memoryCache.questionIndexPromise = null
    })
  }

  return memoryCache.questionIndexPromise
}

export async function preloadSubjectMetadata() {
  return getQuestionIndex()
}

async function getQuestionKeyMap() {
  if (memoryCache.questionKeyMap) {
    return memoryCache.questionKeyMap
  }

  if (!memoryCache.questionKeyMapPromise) {
    memoryCache.questionKeyMapPromise = fetchJson(QUESTION_KEY_MAP_PATH)
      .then((data) => {
        memoryCache.questionKeyMap = data && typeof data === 'object' ? data : {}
        return memoryCache.questionKeyMap
      })
      .finally(() => {
        memoryCache.questionKeyMapPromise = null
      })
  }

  return memoryCache.questionKeyMapPromise
}

export async function loadQuestionFile(filePath) {
  if (!filePath) {
    return []
  }

  if (memoryCache.fileMap.has(filePath)) {
    return memoryCache.fileMap.get(filePath)
  }

  if (!memoryCache.filePromiseMap.has(filePath)) {
    memoryCache.filePromiseMap.set(
      filePath,
      fetchJson(filePath)
        .then((data) => {
          const normalizedData = Array.isArray(data) ? data : []
          memoryCache.fileMap.set(filePath, normalizedData)
          return normalizedData
        })
        .catch((error) => {
          memoryCache.fileMap.set(filePath, [])
          throw error
        })
        .finally(() => {
          memoryCache.filePromiseMap.delete(filePath)
        }),
    )
  }

  return memoryCache.filePromiseMap.get(filePath)
}

export async function loadQuestionsBySubjectAndYearRange(subject, startYear, endYear) {
  const questionIndex = await getQuestionIndex()
  const normalizedSubject = normalizeExamSubject(subject)
  const safeStartYear = Number(startYear)
  const safeEndYear = Number(endYear)

  const fileEntries = questionIndex.filter((entry) => {
    const entryYear = Number(entry.year)
    return (
      normalizeExamSubject(entry.subject) === normalizedSubject &&
      (!Number.isFinite(safeStartYear) || entryYear >= safeStartYear) &&
      (!Number.isFinite(safeEndYear) || entryYear <= safeEndYear)
    )
  })

  const settledFiles = await Promise.allSettled(fileEntries.map((entry) => loadQuestionFile(entry.filePath)))

  return settledFiles.flatMap((result) => (result.status === 'fulfilled' ? result.value : []))
}

export async function loadQuestionsByKeys(questionKeys = []) {
  const keys = [...new Set(questionKeys.filter(Boolean))]

  if (keys.length === 0) {
    return []
  }

  const keyMap = await getQuestionKeyMap()
  const resolvedPaths = [...new Set(
    keys
      .map((key) => keyMap[key] || keyMap[decodeURIComponent(key)] || keyMap[normalizeQuestionKey(key)])
      .filter(Boolean),
  )]

  const settledFiles = await Promise.allSettled(resolvedPaths.map((filePath) => loadQuestionFile(filePath)))
  const allQuestions = settledFiles.flatMap((result) => (result.status === 'fulfilled' ? result.value : []))

  return keys
    .map((key) => {
      const normalizedKey = normalizeQuestionKey(key)

      return (
        allQuestions.find(
          (question) =>
            question.id === key ||
            getQuestionKey(question) === key ||
            normalizeQuestionKey(question) === normalizedKey,
        ) || null
      )
    })
    .filter(Boolean)
}

export async function getQuestionByKey(questionKey) {
  if (!questionKey) {
    return null
  }

  const [question] = await loadQuestionsByKeys([questionKey])
  return question || null
}
