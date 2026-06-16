import SideMenu from './SideMenu'
import ThemeToggle from './ThemeToggle'

function Navbar({ title, subtitle, actions }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 shadow-sm md:px-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <SideMenu />
          <div>
            {subtitle ? <p className="text-xs font-semibold text-slate-500">{subtitle}</p> : null}
            <h1 className="text-xl font-black tracking-tight sm:text-2xl">{title}</h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <ThemeToggle compact />
          {actions}
        </div>
      </div>
    </div>
  )
}

export default Navbar
