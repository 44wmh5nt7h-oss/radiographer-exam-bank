import { Route, Routes } from 'react-router-dom'
import HomePage from './pages/HomePage'
import QuizPage from './pages/QuizPage'
import ResultPage from './pages/ResultPage'
import WrongBookPage from './pages/WrongBookPage'
import BookmarkPage from './pages/BookmarkPage'
import QuestionDetailPage from './pages/QuestionDetailPage'
import GrowthPage from './pages/GrowthPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/growth" element={<GrowthPage />} />
      <Route path="/quiz/:subject" element={<QuizPage />} />
      <Route path="/results/:subject" element={<ResultPage />} />
      <Route path="/results/:subject/question/:questionId" element={<QuestionDetailPage />} />
      <Route path="/wrong-book" element={<WrongBookPage />} />
      <Route path="/bookmarks" element={<BookmarkPage />} />
      <Route path="/questions/:questionId" element={<QuestionDetailPage />} />
    </Routes>
  )
}

export default App
