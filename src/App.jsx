import { Route, Routes } from 'react-router-dom'
import HomePage from './pages/HomePage'
import QuizPage from './pages/QuizPage'
import ResultPage from './pages/ResultPage'
import WrongBookPage from './pages/WrongBookPage'
import BookmarkPage from './pages/BookmarkPage'
import QuestionDetailPage from './pages/QuestionDetailPage'
import GrowthPage from './pages/GrowthPage'
import PublicInfoPage from './pages/PublicInfoPage'

const publicPageConfigs = {
  features: {
    canonicalPath: '/features',
    title: '功能介紹',
    subtitle: '了解這個刷題網站如何協助醫事放射師國考準備。',
    seoTitle: '功能介紹｜放射師國考刷題庫',
    seoDescription:
      '了解放射師國考刷題庫提供的歷屆試題練習、錯題本、收藏題、模擬考、個人成長追蹤與弱科分析功能。',
    intro:
      '放射師國考刷題庫是一個以醫事放射師國考為主軸的線上刷題工具，重點在於讓考生透過歷屆試題、錯題整理與成長追蹤，更有效率地安排考前複習。',
    sections: [
      {
        heading: '歷屆試題與科目分類',
        description: '網站會依照考科整理歷屆題目，並支援科目分類刷題與年份範圍設定。',
        items: ['歷屆試題練習', '科目分類刷題', '年份範圍設定', '答題結果檢視'],
      },
      {
        heading: '個人複習工具',
        description: '作答後可持續回到高風險題目與重點題目，建立自己的考前複習清單。',
        items: ['錯題本', '收藏題', '弱科分析', '最近作答紀錄'],
      },
      {
        heading: '模擬考與成長追蹤',
        description: '網站也支援單科限時測驗與個人成長頁，協助你掌握近期刷題狀況。',
        items: ['模擬考', '我的成長', '最近 7 天作答概況', '科目戰力'],
      },
    ],
  },
  radiographerExam: {
    canonicalPath: '/radiographer-exam',
    title: '放射師國考準備',
    subtitle: '協助醫事放射師考生以歷屆試題與錯題複習方式安排考前準備。',
    seoTitle: '放射師國考準備｜歷屆試題與錯題複習',
    seoDescription:
      '放射師國考刷題庫適合準備醫事放射師國考的考生，可透過歷屆試題、錯題本、收藏題與成長分析提升複習效率。',
    intro:
      '如果你正在準備醫事放射師國考，這個網站的重點不是單純看題，而是把歷屆試題練習、錯題回顧與成長追蹤整合在同一個刷題工具中。',
    sections: [
      {
        heading: '適合國考準備的練習方式',
        description: '題目可依照考科與年份範圍載入，並以單科限時測驗模式進行練習。',
        items: ['依考科練習', '歷屆試題刷題', '考前限時測驗', '答題結果檢視'],
      },
      {
        heading: '提高複習效率的輔助功能',
        description: '除了作答本身，也能透過錯題與弱科追蹤知道自己接下來要補強哪裡。',
        items: ['錯題本重複複習', '收藏題快速回顧', '弱科提醒', '我的成長頁'],
      },
    ],
  },
  questionBank: {
    canonicalPath: '/question-bank',
    title: '題庫練習功能',
    subtitle: '以歷屆試題為核心，提供可篩選、可記錄作答狀態的刷題流程。',
    seoTitle: '題庫練習｜放射師國考歷屆試題刷題',
    seoDescription:
      '放射師國考刷題庫提供歷屆試題練習、科目篩選、作答結果檢視與答題狀態記錄，協助考生安排日常刷題。',
    intro:
      '題庫練習功能是網站最核心的入口。使用者可以依照考科與年份設定載入歷屆試題，完成作答後查看結果並延伸到錯題本或收藏題。',
    sections: [
      {
        heading: '題庫整理方式',
        description: '網站依照醫事放射師國考主要考科分類，並支援年份範圍設定。',
        items: ['依科目篩選', '依年份範圍載入', '歷屆試題練習', '單科限時測驗'],
      },
      {
        heading: '作答後可以做什麼',
        description: '完成一輪練習後，可以接續查看結果、整理錯題與標記重點題目。',
        items: ['記錄作答狀態', '檢視答題結果', '加入錯題本', '加入收藏題'],
      },
    ],
  },
  wrongNotebook: {
    canonicalPath: '/wrong-notebook',
    title: '錯題本功能',
    subtitle: '自動整理答錯題目，協助考生重複複習高風險題型。',
    seoTitle: '錯題本｜自動整理答錯題目與複習重點',
    seoDescription:
      '放射師國考刷題庫的錯題本功能會整理答錯題目，幫助考生回頭複習高風險題型與弱科觀念。',
    intro:
      '錯題本的目標不是單純保留錯誤，而是幫助考生把高風險題目集中起來，回頭進行重複複習與觀念整理。',
    sections: [
      {
        heading: '錯題整理方式',
        description: '作答後答錯的題目會被整理到錯題本中，方便後續回顧。',
        items: ['自動整理答錯題目', '依考科篩選錯題', '高風險題目回顧', '逐題檢視詳解'],
      },
      {
        heading: '考前複習用途',
        description: '錯題本可以用來追蹤還不熟的題目，提升考前回顧效率。',
        items: ['重複複習弱點', '集中查看題目來源', '搭配收藏題使用', '減少遺漏高風險題'],
      },
    ],
  },
  mockExam: {
    canonicalPath: '/mock-exam',
    title: '模擬考功能',
    subtitle: '以單科限時測驗模式模擬正式考試情境，掌握考前作答狀態。',
    seoTitle: '模擬考｜放射師國考考前練習',
    seoDescription:
      '放射師國考刷題庫支援單科限時測驗，協助考生模擬正式考試情境、檢視單次測驗成績並掌握考前狀態。',
    intro:
      '模擬考功能以單科限時測驗為主，讓考生在固定題數與時間限制下練習作答，並透過結果頁掌握當次表現。',
    sections: [
      {
        heading: '考前練習重點',
        description: '在有限時間內完成作答，可更接近正式國考時的節奏與壓力。',
        items: ['單科限時測驗', '固定題數與時間', '立即計算成績', '查看測驗結果'],
      },
      {
        heading: '測驗後延伸',
        description: '測驗結束後，可以接著整理錯題與分析近期刷題狀態。',
        items: ['檢視錯題', '加入收藏題', '追蹤最近表現', '我的成長頁'],
      },
    ],
  },
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/features" element={<PublicInfoPage {...publicPageConfigs.features} />} />
      <Route path="/radiographer-exam" element={<PublicInfoPage {...publicPageConfigs.radiographerExam} />} />
      <Route path="/question-bank" element={<PublicInfoPage {...publicPageConfigs.questionBank} />} />
      <Route path="/wrong-notebook" element={<PublicInfoPage {...publicPageConfigs.wrongNotebook} />} />
      <Route path="/mock-exam" element={<PublicInfoPage {...publicPageConfigs.mockExam} />} />
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
