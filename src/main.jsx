import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { clearCurrentUserProgress, getCurrentEffectiveUserId } from './utils/storageUtils'
import { applyCurrentTheme } from './utils/themeUtils'
import './index.css'

applyCurrentTheme()

if (import.meta.env.DEV && typeof window !== 'undefined') {
  window.clearCurrentUserProgress = () => clearCurrentUserProgress()
  window.getCurrentEffectiveUserId = () => getCurrentEffectiveUserId()
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
