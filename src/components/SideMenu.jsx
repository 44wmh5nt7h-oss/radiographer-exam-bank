import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import ThemeToggle from './ThemeToggle'

const MENU_ITEMS = [
  { to: '/', icon: '⌂', label: '首頁', description: '平台入口' },
  { to: '/exams', icon: '科', label: '國考科系選擇', description: '選擇題庫' },
  { to: '/wrong-review', icon: '練', label: '複習錯題', description: '重新作答錯題' },
  { to: '/growth', icon: '長', label: '我的成長', description: '查看弱點' },
  { to: '/wrong-book', icon: '錯', label: '錯題本', description: '整理錯題' },
  { to: '/bookmarks', icon: '藏', label: '收藏題', description: '重點回顧' },
  { to: '/settings', icon: '設', label: '學習設定', description: '考試日期與每日目標' },
]

function MenuLink({ item, onNavigate }) {
  return (
    <NavLink
      to={item.to}
      onClick={onNavigate}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-xl px-3 py-3 transition ${
          isActive
            ? 'bg-slate-900 text-white'
            : 'text-slate-700 hover:bg-slate-100'
        }`
      }
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-current/10 bg-current/5 text-sm font-black">
        {item.icon}
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-black">{item.label}</span>
        <span className="mt-0.5 block text-xs opacity-70">{item.description}</span>
      </span>
    </NavLink>
  )
}

function SideMenu({ buttonClassName = '' }) {
  const [isOpen, setIsOpen] = useState(false)
  const closeMenu = () => setIsOpen(false)

  useEffect(() => {
    if (!isOpen) {
      return undefined
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        closeMenu()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-800 transition hover:bg-slate-50 ${buttonClassName}`}
        aria-label="打開主選單"
      >
        ☰ 主選單
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            aria-label="關閉主選單"
            className="absolute inset-0 bg-slate-950/35"
            onClick={closeMenu}
          />
          <aside className="absolute inset-y-0 left-0 flex w-[min(92vw,320px)] flex-col border-r border-slate-200 bg-white p-4 shadow-xl">
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-4">
              <div>
                <p className="text-xs font-semibold text-slate-500">快速選單</p>
                <h2 className="mt-1 text-lg font-black text-slate-950">國考刷題</h2>
              </div>
              <button
                type="button"
                onClick={closeMenu}
                className="rounded-lg px-3 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100"
              >
                關閉
              </button>
            </div>

            <nav className="mt-4 space-y-1">
              {MENU_ITEMS.map((item) => (
                <MenuLink key={item.to} item={item} onNavigate={closeMenu} />
              ))}
            </nav>

            <div className="mt-auto border-t border-slate-200 pt-4">
              <ThemeToggle compact />
              <p className="mt-3 text-xs text-slate-500">其他科系題庫陸續加入中</p>
            </div>
          </aside>
        </div>
      ) : null}
    </>
  )
}

export default SideMenu
