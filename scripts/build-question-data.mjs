import { mkdir, readFile, writeFile, cp } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '..')

const sourceQuestionsPath = path.join(projectRoot, 'src', 'data', 'fiinal_enriched_questions.json')
const sourceUploadsDir = path.join(projectRoot, 'src', 'uploads')
const publicDataDir = path.join(projectRoot, 'public', 'data')
const publicQuestionsDir = path.join(publicDataDir, 'questions')
const publicUploadsDir = path.join(projectRoot, 'public', 'uploads')

const subjects = [
  {
    name: '基礎醫學',
    slug: 'basic',
    sourceSubjects: ['基礎醫學（包括解剖學、生理學與病理學）', '解剖生理'],
  },
  {
    name: '醫學物理學與輻射安全',
    slug: 'physics-safety',
    sourceSubjects: ['醫學物理學與輻射安全', '放射物理', '輻射防護'],
  },
  {
    name: '放射線器材學',
    slug: 'equipment',
    sourceSubjects: ['放射線器材學（包括磁振學與超音波學）', '放射線器材學'],
  },
  {
    name: '放射線診斷原理與技術學',
    slug: 'diagnostic-techniques',
    sourceSubjects: ['放射線診斷原理與技術學', '放射診斷技術'],
  },
  {
    name: '放射線治療原理與技術學',
    slug: 'radiation-therapy',
    sourceSubjects: ['放射線治療原理與技術學', '放射治療'],
  },
  {
    name: '核子醫學診療原理與技術學',
    slug: 'nuclear-medicine',
    sourceSubjects: ['核子醫學診療原理與技術學', '核子醫學'],
  },
]

const subjectAliasMap = new Map(
  subjects.flatMap((subject) =>
    [subject.name, ...subject.sourceSubjects].map((alias) => [normalizeText(alias), subject]),
  ),
)

function normalizeText(value) {
  return String(value || '')
    .normalize('NFKC')
    .replace(/[（）]/g, (char) => (char === '（' ? '(' : ')'))
    .replace(/\s+/g, '')
    .trim()
}

function getCanonicalSubject(subjectName = '') {
  const normalizedValue = normalizeText(subjectName)

  if (subjectAliasMap.has(normalizedValue)) {
    return subjectAliasMap.get(normalizedValue)
  }

  for (const [alias, subject] of subjectAliasMap.entries()) {
    const compactAlias = alias.replace(/\(.+\)/, '')
    const compactValue = normalizedValue.replace(/\(.+\)/, '')

    if (
      normalizedValue === alias ||
      normalizedValue.includes(alias) ||
      alias.includes(normalizedValue) ||
      compactValue === compactAlias ||
      compactValue.includes(compactAlias) ||
      compactAlias.includes(compactValue)
    ) {
      return subject
    }
  }

  return null
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
  const match = normalizedValue.match(/\d+/)
  return match ? String(Number(match[0])) : ''
}

function buildNormalizedQuestionKey(question) {
  const subject = getCanonicalSubject(question.subject)?.name || question.subject || ''
  const year = String(Number(question.year || 0) || '')
  const round = normalizeRoundValue(question.exam_round || question.examRound || question.session || '')
  const questionNumber = extractQuestionNumber(question.question_number ?? question.questionNumber ?? '')
  return [year, round, subject, questionNumber].filter(Boolean).join('-')
}

function rewriteImagePath(rawPath = '') {
  const normalizedPath = String(rawPath || '').replace(/\\/g, '/').trim()

  if (!normalizedPath) {
    return normalizedPath
  }

  const fileName = normalizedPath.split('/').pop()
  return fileName ? `/uploads/${fileName}` : normalizedPath
}

function rewriteImagePlaceholders(text = '') {
  return String(text || '').replace(/\{\{image:([^}]+)\}\}/g, (_, rawPath) => {
    return `{{image:${rewriteImagePath(rawPath)}}}`
  })
}

function normalizeQuestionRecord(question) {
  const normalizedQuestion = {
    ...question,
    question: rewriteImagePlaceholders(question.question),
  }

  if (normalizedQuestion.options && typeof normalizedQuestion.options === 'object') {
    normalizedQuestion.options = Object.fromEntries(
      Object.entries(normalizedQuestion.options).map(([key, value]) => [key, rewriteImagePlaceholders(value)]),
    )
  }

  if (normalizedQuestion.image?.src) {
    normalizedQuestion.image = {
      ...normalizedQuestion.image,
      src: rewriteImagePath(normalizedQuestion.image.src),
    }
  }

  if (Array.isArray(normalizedQuestion.images)) {
    normalizedQuestion.images = normalizedQuestion.images.map((image) => ({
      ...image,
      path: rewriteImagePath(image.path),
      placeholder: image.placeholder
        ? `{{image:${rewriteImagePath(image.path)}}}`
        : image.placeholder,
    }))
  }

  return normalizedQuestion
}

function hasExplanation(question) {
  return Boolean(
    question.explanation ||
      question.detailedExplanation ||
      question.aiExplanation ||
      question.solution ||
      question.analysis,
  )
}

async function ensureDir(dirPath) {
  await mkdir(dirPath, { recursive: true })
}

async function main() {
  const rawQuestions = JSON.parse(await readFile(sourceQuestionsPath, 'utf8'))
  const groupedQuestions = new Map()
  const questionIndex = []
  const questionKeyMap = {}
  const updatedAt = new Date().toISOString()

  for (const rawQuestion of rawQuestions) {
    const canonicalSubject = getCanonicalSubject(rawQuestion.subject)

    if (!canonicalSubject) {
      continue
    }

    const normalizedQuestion = normalizeQuestionRecord(rawQuestion)
    const year = Number(normalizedQuestion.year)
    const filePath = `/data/questions/${canonicalSubject.slug}/${year}.json`
    const mapKey = normalizedQuestion.id || buildNormalizedQuestionKey(normalizedQuestion)
    const normalizedMapKey = buildNormalizedQuestionKey(normalizedQuestion)

    if (!groupedQuestions.has(filePath)) {
      groupedQuestions.set(filePath, {
        subject: canonicalSubject.name,
        subjectSlug: canonicalSubject.slug,
        year,
        filePath,
        questions: [],
      })
    }

    groupedQuestions.get(filePath).questions.push(normalizedQuestion)

    if (mapKey) {
      questionKeyMap[mapKey] = filePath
    }

    if (normalizedMapKey) {
      questionKeyMap[normalizedMapKey] = filePath
    }
  }

  await ensureDir(publicQuestionsDir)

  const groupedEntries = [...groupedQuestions.values()].sort((left, right) => {
    if (left.subject === right.subject) {
      return left.year - right.year
    }

    return left.subject.localeCompare(right.subject, 'zh-Hant')
  })

  for (const entry of groupedEntries) {
    const targetDir = path.join(publicQuestionsDir, entry.subjectSlug)
    const targetFile = path.join(targetDir, `${entry.year}.json`)

    await ensureDir(targetDir)
    await writeFile(targetFile, JSON.stringify(entry.questions), 'utf8')

    questionIndex.push({
      subject: entry.subject,
      subjectSlug: entry.subjectSlug,
      year: entry.year,
      questionCount: entry.questions.length,
      filePath: entry.filePath,
      hasExplanation: entry.questions.some(hasExplanation),
      updatedAt,
    })
  }

  await writeFile(
    path.join(publicDataDir, 'question-index.json'),
    JSON.stringify(questionIndex, null, 2),
    'utf8',
  )
  await writeFile(
    path.join(publicDataDir, 'question-key-map.json'),
    JSON.stringify(questionKeyMap),
    'utf8',
  )

  await cp(sourceUploadsDir, publicUploadsDir, {
    recursive: true,
    force: true,
  })

  console.log(`[build:data] wrote ${questionIndex.length} data files to public/data/questions`)
  console.log(`[build:data] question index entries: ${questionIndex.length}`)
  console.log(`[build:data] question key map entries: ${Object.keys(questionKeyMap).length}`)
  console.log('[build:data] uploads synced to public/uploads')
}

main().catch((error) => {
  console.error('[build:data] failed', error)
  process.exit(1)
})
