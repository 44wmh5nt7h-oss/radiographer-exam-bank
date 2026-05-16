const IMAGE_PLACEHOLDER_PATTERN = /\{\{image:([^}]+)\}\}/g

export function resolveQuestionImagePath(rawPath = '') {
  const normalizedPath = String(rawPath).replace(/\\/g, '/').trim()

  if (!normalizedPath) {
    return ''
  }

  const fileName = normalizedPath.split('/').pop()

  if (!fileName) {
    return normalizedPath
  }

  if (
    normalizedPath.startsWith('/uploads/') ||
    normalizedPath.startsWith('http://') ||
    normalizedPath.startsWith('https://') ||
    normalizedPath.startsWith('data:')
  ) {
    return normalizedPath
  }

  return `/uploads/${fileName}`
}

function buildImageTextSegments(text = '') {
  const sourceText = String(text)
  const segments = []
  let lastIndex = 0

  sourceText.replaceAll(IMAGE_PLACEHOLDER_PATTERN, (match, imagePath, offset) => {
    if (offset > lastIndex) {
      segments.push({
        type: 'text',
        value: sourceText.slice(lastIndex, offset),
      })
    }

    segments.push({
      type: 'image',
      src: resolveQuestionImagePath(imagePath),
      rawPath: imagePath,
    })

    lastIndex = offset + match.length
    return match
  })

  if (lastIndex < sourceText.length) {
    segments.push({
      type: 'text',
      value: sourceText.slice(lastIndex),
    })
  }

  return segments.length > 0 ? segments : [{ type: 'text', value: sourceText }]
}

export function QuestionRichText({
  text,
  alt,
  textClassName = 'whitespace-pre-line leading-relaxed text-slate-900',
  imageClassName = 'w-full object-contain',
}) {
  const segments = buildImageTextSegments(text)

  return (
    <div className="space-y-3">
      {segments.map((segment, index) => {
        if (segment.type === 'image') {
          return (
            <figure
              key={`${alt}-image-${index}`}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
            >
              <img src={segment.src} alt={alt} className={imageClassName} />
            </figure>
          )
        }

        if (!segment.value.trim()) {
          return null
        }

        return (
          <p key={`${alt}-text-${index}`} className={textClassName}>
            {segment.value}
          </p>
        )
      })}
    </div>
  )
}

function QuestionContent({ question }) {
  return (
    <div className="space-y-5">
      <div className="text-xl font-bold md:text-2xl">
        <QuestionRichText text={question.question} alt={question.question} />
      </div>

      {question.image && (
        <figure className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <img
            src={resolveQuestionImagePath(question.image.src)}
            alt={question.image.alt || question.question}
            className="w-full object-contain"
          />
          {question.image.caption && (
            <figcaption className="border-t border-slate-200 px-4 py-3 text-sm text-slate-500">
              {question.image.caption}
            </figcaption>
          )}
        </figure>
      )}

      {question.table && (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-sm text-slate-700">
              {question.table.caption && (
                <caption className="border-b border-slate-200 px-4 py-3 text-left font-medium text-slate-500">
                  {question.table.caption}
                </caption>
              )}
              <thead className="bg-slate-50">
                <tr>
                  {question.table.headers.map((header) => (
                    <th
                      key={header}
                      className="border-b border-slate-200 px-4 py-3 text-left font-semibold text-slate-700"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {question.table.rows.map((row, rowIndex) => (
                  <tr key={`${question.id}-row-${rowIndex}`} className="odd:bg-white even:bg-slate-50/60">
                    {row.map((cell, cellIndex) => (
                      <td
                        key={`${question.id}-cell-${rowIndex}-${cellIndex}`}
                        className="border-t border-slate-100 px-4 py-3 align-top"
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default QuestionContent
