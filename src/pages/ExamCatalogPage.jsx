import { Link } from 'react-router-dom'
import BackLink from '../components/BackLink'
import Button from '../components/Button'
import Navbar from '../components/Navbar'
import SeoMeta from '../components/SeoMeta'

function ExamCatalogPage() {
  return (
    <main className="min-h-screen px-4 py-6 md:px-6 md:py-8">
      <SeoMeta
        title="選擇國考題庫｜醫事國考刷題平台"
        description="選擇要練習的醫事國考題庫。目前平台先支援放射師國考，未來可擴充其他科系國考。"
        canonicalPath="/exams"
      />
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <BackLink label="返回首頁" fallbackTo="/" />
        <Navbar subtitle="國考科系選擇" title="選擇國考科系" />

        <section className="grid gap-4 md:grid-cols-2">
          <article className="rounded-2xl border border-blue-200 bg-[linear-gradient(135deg,#ffffff_0%,#eff6ff_100%)] p-6 shadow-sm md:p-8">
            <span className="inline-flex rounded-full bg-blue-600 px-3 py-1 text-xs font-bold text-white">
              已開放
            </span>
            <h2 className="mt-4 text-3xl font-black text-slate-950">放射師國考</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              以歷屆試題為核心，提供六大考科、單科限時測驗、錯題本、收藏題與我的成長追蹤。
            </p>
            <div className="mt-6">
              <Button as={Link} to="/radiographer">
                進入放射師國考
              </Button>
            </div>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
            <h2 className="text-xl font-black text-slate-950">其他科系國考</h2>
            <p className="mt-3 text-sm leading-7 text-slate-500">其他科系題庫陸續加入中。</p>
          </article>
        </section>
      </div>
    </main>
  )
}

export default ExamCatalogPage
