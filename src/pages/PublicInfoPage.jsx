import { Link } from 'react-router-dom'
import Button from '../components/Button'
import Navbar from '../components/Navbar'
import SeoMeta from '../components/SeoMeta'

function PublicInfoPage({
  title,
  subtitle,
  seoTitle,
  seoDescription,
  canonicalPath,
  intro,
  sections = [],
  primaryAction = { label: '開始刷題', to: '/' },
  secondaryAction = { label: '回到首頁', to: '/' },
}) {
  return (
    <main className="min-h-screen px-4 py-6 md:px-6 md:py-8">
      <SeoMeta title={seoTitle} description={seoDescription} canonicalPath={canonicalPath} />

      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <Navbar
          subtitle="Public Overview"
          title={title}
          actions={
            <>
              {primaryAction?.to && primaryAction?.label ? (
                <Button as={Link} to={primaryAction.to}>
                  {primaryAction.label}
                </Button>
              ) : null}
            </>
          }
        />

        <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="max-w-4xl">
            <h2 className="text-2xl font-black text-slate-950">{subtitle}</h2>
            <p className="mt-4 text-sm leading-7 text-slate-600">{intro}</p>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            {primaryAction?.to && primaryAction?.label ? (
              <Button as={Link} to={primaryAction.to}>
                {primaryAction.label}
              </Button>
            ) : null}
            {secondaryAction?.to && secondaryAction?.label ? (
              <Button as={Link} to={secondaryAction.to} variant="secondary">
                {secondaryAction.label}
              </Button>
            ) : null}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          {sections.map((section) => (
            <article
              key={section.heading}
              className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm md:p-8"
            >
              <h2 className="text-xl font-black text-slate-950">{section.heading}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">{section.description}</p>
              {section.items?.length ? (
                <ul className="mt-5 space-y-3 text-sm leading-6 text-slate-700">
                  {section.items.map((item) => (
                    <li key={item} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                      {item}
                    </li>
                  ))}
                </ul>
              ) : null}
            </article>
          ))}
        </section>
      </div>
    </main>
  )
}

export default PublicInfoPage
