import { Link, NavLink, useLocation } from 'react-router-dom'
import Button from './Button'

function Navbar({ title, subtitle, actions }) {
  const location = useLocation()
  const quickNavItems = [
    { to: '/', label: '首頁' },
    { to: '/growth', label: '我的成長' },
    { to: '/wrong-book', label: '錯題本' },
    { to: '/bookmarks', label: '收藏題' },
  ]

  return (
    <div className="rounded-[1.75rem] border border-slate-200 bg-white px-6 py-5 text-slate-950 shadow-sm md:px-7">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.26em] text-slate-500">{subtitle}</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight">{title}</h1>
          </div>

          <div className="flex flex-wrap gap-2">
            {quickNavItems.map((item) => {
              const isActive =
                item.to === '/'
                  ? location.pathname === '/'
                  : location.pathname === item.to || location.pathname.startsWith(`${item.to}/`)

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={`inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold transition ${
                    isActive
                      ? 'bg-slate-900 text-white'
                      : 'border border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-white'
                  }`}
                >
                  {item.label}
                </NavLink>
              )
            })}
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          {actions}
          <Button as={Link} to="/" variant="secondary">
            回首頁
          </Button>
        </div>
      </div>
    </div>
  )
}

export default Navbar
