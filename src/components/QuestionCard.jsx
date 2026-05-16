import Button from './Button'
import QuestionContent, { QuestionRichText } from './QuestionContent'

function QuestionCard({
  questionNumber,
  totalQuestions,
  question,
  selectedAnswer,
  isBookmarked,
  onSelectAnswer,
  onToggleBookmark,
}) {
  return (
    <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_24px_60px_rgba(15,23,42,0.08)] md:p-8">
      <div className="mb-6 flex items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">單科限時測驗</p>
          <span className="mt-2 inline-flex rounded-xl border border-slate-300 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-800">
            第 {questionNumber} 題 / 共 {totalQuestions} 題
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-500">單選題</span>
          <Button type="button" variant="secondary" className="px-4 py-2" onClick={onToggleBookmark}>
            {isBookmarked ? '已收藏' : '加入收藏'}
          </Button>
        </div>
      </div>

      <div className="mb-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-medium text-slate-700">
        <div className="flex flex-wrap items-center gap-2">
          <span>來源：民國 {question.year} 年</span>
          <span className="text-slate-300">|</span>
          <span>{question.exam_round}</span>
          <span className="text-slate-300">|</span>
          <span>{question.subject}</span>
          <span className="text-slate-300">|</span>
          <span>第 {question.question_number} 題</span>
        </div>
      </div>

      <QuestionContent question={question} />

      <div className="mt-6 grid gap-3">
        {Object.entries(question.options).map(([key, value]) => {
          const isSelected = selectedAnswer === key
          const buttonClass = isSelected
            ? 'border-sky-500 bg-sky-50 text-sky-900'
            : 'border-slate-200 bg-white hover:border-sky-300 hover:bg-sky-50'

          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelectAnswer(key)}
              className={`rounded-2xl border px-4 py-4 text-left text-base font-medium transition ${buttonClass}`}
            >
              <div className="flex items-start gap-3">
                <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white">
                  {key}
                </span>
                <div className="min-w-0 flex-1">
                  <QuestionRichText
                    text={value}
                    alt={`${question.id}-${key}`}
                    textClassName="whitespace-pre-line leading-relaxed text-slate-800"
                    imageClassName="max-h-[24rem] w-full object-contain"
                  />
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </section>
  )
}

export default QuestionCard
