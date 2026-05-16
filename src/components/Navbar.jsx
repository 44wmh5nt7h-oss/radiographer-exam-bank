import { Link } from 'react-router-dom'
import Button from './Button'

function Navbar({ title, subtitle, actions }) {
  return (
    <div className="flex flex-col gap-4 rounded-[1.5rem] border border-slate-200 bg-white px-6 py-5 text-slate-950 shadow-[0_22px_50px_rgba(15,23,42,0.08)] md:flex-row md:items-center md:justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.26em] text-slate-500">{subtitle}</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight">{title}</h1>
      </div>

      <div className="flex flex-wrap gap-3">
        {actions}
        <Button as={Link} to="/" variant="secondary">
          回首頁
        </Button>
      </div>
    </div>
  )
}

export default Navbar
