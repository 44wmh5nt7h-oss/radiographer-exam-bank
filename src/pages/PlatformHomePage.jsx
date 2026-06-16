import { Link } from 'react-router-dom'
import Button from '../components/Button'
import SeoMeta from '../components/SeoMeta'
import SideMenu from '../components/SideMenu'
import StudyStatusStrip from '../components/StudyStatusStrip'
import ThemeToggle from '../components/ThemeToggle'
import { getStudyActionRecommendation, getStudySettingsStatus } from '../utils/recommendationUtils'

const FLOW_STEPS = [
  ['選科目', '先選一科開始練習'],
  ['作答交卷', '完成限時測驗後看結果'],
  ['複習錯題', '把不熟的題目重做一次'],
]

const FEATURE_CARDS = [
  ['/exams', '正式作答', '依科目開始 80 題限時測驗。'],
  ['/wrong-review', '錯題複習', '答錯題會集中整理，可重新作答。'],
  ['/growth', '收藏與成長', '收藏重點題，追蹤自己的弱科。'],
]

function PlatformHomePage() {
  const recommendation = getStudyActionRecommendation()
  const settingsStatus = getStudySettingsStatus()

  return (
    <main className="min-h-screen px-4 py-6 md:px-6 md:py-8">
      <SeoMeta
        title="醫事國考刷題平台｜放射師國考刷題庫"
        description="醫事國考刷題平台提供選科刷題、錯題複習、收藏題與個人成長追蹤，目前支援放射師國考。"
        canonicalPath="/"
      />
      <div className="mx-auto flex max-w-5xl flex-col gap-5">
        <header className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <SideMenu />
          <ThemeToggle compact />
        </header>

        <StudyStatusStrip />

        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr] lg:items-center">
            <div>
              <h1 className="text-3xl font-black tracking-tight text-slate-950 md:text-5xl">
                醫事國考刷題平台
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
                選科刷題、複習錯題，追蹤自己的弱點。
              </p>
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <Button as={Link} to={recommendation.primaryActionPath} className="w-full">
                  {settingsStatus.isSetupComplete ? '開始今日任務' : '設定考試目標'}
                </Button>
                <Button as={Link} to="/exams" variant="secondary" className="w-full">
                  選擇國考科系
                </Button>
                <Button as={Link} to="/growth" variant="ghost" className="w-full">
                  查看成長
                </Button>
              </div>
            </div>

            <aside className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
              <h2 className="text-lg font-black text-slate-950">{recommendation.title}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-700">{recommendation.description}</p>
              <div className="mt-5 flex flex-col gap-2">
                <Button as={Link} to={recommendation.primaryActionPath}>
                  {recommendation.primaryActionLabel}
                </Button>
                {recommendation.secondaryActionLabel && recommendation.secondaryActionPath ? (
                  <Button as={Link} to={recommendation.secondaryActionPath} variant="secondary">
                    {recommendation.secondaryActionLabel}
                  </Button>
                ) : null}
              </div>
            </aside>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid gap-3 md:grid-cols-3">
          {FLOW_STEPS.map(([title, text], index) => (
            <div key={title} className="flex items-start gap-3 rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-black text-blue-700">0{index + 1}</p>
              <div>
                <h2 className="text-base font-black text-slate-950">{title}</h2>
                <p className="mt-1 text-sm text-slate-600">{text}</p>
              </div>
            </div>
          ))}
          </div>
        </section>

        <section className="grid gap-3 md:grid-cols-3">
          {FEATURE_CARDS.map(([to, title, text]) => (
            <Link key={title} to={to} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-200 hover:bg-blue-50">
              <h2 className="text-lg font-black text-slate-950">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
            </Link>
          ))}
        </section>
      </div>
    </main>
  )
}

export default PlatformHomePage
