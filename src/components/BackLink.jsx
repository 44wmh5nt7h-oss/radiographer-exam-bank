import { useLocation, useNavigate } from 'react-router-dom'

function BackLink({ label = '返回上一頁', fallbackTo = '/', className = '' }) {
  const navigate = useNavigate()
  const location = useLocation()
  const fallback = location.state?.fallbackTo || fallbackTo

  const handleClick = () => {
    if (window.history.length > 1) {
      navigate(-1)
      return
    }

    navigate(fallback)
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`inline-flex items-center text-sm font-semibold text-slate-600 transition hover:text-slate-950 ${className}`}
    >
      ← {label}
    </button>
  )
}

export default BackLink
