import {
  analyzeTodayWrongTags,
  getDailyGoal,
  getDaysToExam,
  getExamDate,
  getPracticeYearRange,
  getTodayStats,
  getTodayWrongAnalysisItems,
  getTodayWrongQuestions,
  getTodayReviewedQuestionCount,
  getWrongBookItems,
} from './storageUtils'
import { getDueForReview, getSubjectPowerStats, getWrongClearanceSummary } from './growthUtils'
import { getWrongReviewStats } from './wrongReviewUtils'

function getItemKey(item) {
  return item?.questionKey || item?.key || item?.id || item?.questionId || ''
}

function getTopSubjectLabel(items = []) {
  const counts = new Map()

  items.forEach((item) => {
    const subject = item?.subject || item?.question?.subject || ''
    if (!subject) return
    counts.set(subject, (counts.get(subject) || 0) + 1)
  })

  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || ''
}

export function getStudySettingsStatus() {
  const examDate = getExamDate()
  const daysUntilExam = getDaysToExam()
  const dailyGoal = getDailyGoal()
  const todayStats = getTodayStats()
  const yearRange = getPracticeYearRange()
  const todayAnsweredCount = Number(todayStats.answeredCount || 0)
  const todayProgressPercent = dailyGoal > 0 ? Math.round((todayAnsweredCount / dailyGoal) * 100) : 0
  const hasExamDate = Boolean(examDate)
  const hasDailyGoal = Number(dailyGoal || 0) > 0
  const hasYearRange = Boolean(yearRange.startYear && yearRange.endYear)
  const isExamDateExpired = hasExamDate && daysUntilExam !== null && daysUntilExam < 0
  const isSetupComplete = hasExamDate && !isExamDateExpired && hasDailyGoal && hasYearRange

  let examDateLabel = '尚未設定考試日期'

  if (hasExamDate && daysUntilExam === 0) {
    examDateLabel = '今天就是考試日'
  } else if (hasExamDate && daysUntilExam !== null && daysUntilExam > 0) {
    examDateLabel = `距離考試 ${daysUntilExam} 天`
  } else if (isExamDateExpired) {
    examDateLabel = '考試日期已過'
  }

  return {
    hasExamDate,
    examDate: examDate || null,
    daysUntilExam,
    hasDailyGoal,
    dailyGoal,
    todayAnsweredCount,
    todayProgressPercent,
    hasYearRange,
    yearRange,
    isExamDateExpired,
    isSetupComplete,
    examDateLabel,
    isGoalReached: hasDailyGoal && todayAnsweredCount >= dailyGoal,
    remainingTodayCount: Math.max(0, dailyGoal - todayAnsweredCount),
  }
}

export function getTodayFeedbackSummary() {
  const todayStats = getTodayStats()
  const todayWrongInput = getTodayWrongAnalysisItems()
  const wrongAnalysis = analyzeTodayWrongTags(todayWrongInput.wrongItems, {
    hasActivity: todayWrongInput.hasActivity,
  })
  const answeredCount = Number(todayStats.answeredCount || 0)
  const correctCount = Number(todayStats.correctCount || 0)
  const wrongCount = Number(todayStats.wrongCount || 0)
  const accuracy = answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0
  const focusSubject = getTopSubjectLabel(todayWrongInput.wrongItems)
  const topTags = wrongAnalysis.topTags.slice(0, 3).map((tag) => tag.value)
  const fallbackSubjects = wrongAnalysis.topSubjects.slice(0, 3).map((subject) => subject.value)
  const focusItems = topTags.length > 0 ? topTags : fallbackSubjects

  if (answeredCount <= 0 && !todayWrongInput.hasActivity) {
    return {
      hasData: false,
      answeredCount: 0,
      accuracy: 0,
      wrongCount: 0,
      focusSubject: '',
      focusItems: [],
      title: '今日作答回饋',
      summary: '目前資料還不夠，完成一回測驗後會產生回饋。',
      nextStep: '先選一科完成正式作答。',
    }
  }

  return {
    hasData: true,
    answeredCount,
    accuracy,
    wrongCount,
    focusSubject,
    focusItems,
    title: '今日作答回饋',
    summary:
      wrongCount > 0
        ? `你今天完成 ${answeredCount} 題，正確率 ${accuracy}%。錯題主要集中在：${focusSubject || focusItems[0] || '尚待整理'}。`
        : `你今天完成 ${answeredCount} 題，正確率 ${accuracy}%。目前沒有明顯錯題集中。`,
    nextStep:
      wrongCount > 0
        ? `建議先複習今天錯的 ${wrongCount} 題${focusItems.length > 0 ? `，特別是 ${focusItems.join('、')}` : ''}。`
        : '可以繼續完成一回正式作答，或回顧收藏題保持手感。',
  }
}

export function getWrongQuestionStatusSummary() {
  const wrongItems = getWrongBookItems()
  const dueItems = getDueForReview()
  const reviewStats = getWrongReviewStats()
  const wrongClearance = getWrongClearanceSummary()
  const todayWrongCount = getTodayWrongQuestions().length
  const todayReviewedCount = getTodayReviewedQuestionCount()
  const highRiskCount = wrongItems.filter((item) => {
    const key = getItemKey(item)
    const stats = key ? reviewStats[key] : null
    return Number(stats?.wrongCount || 0) >= 1 || Number(stats?.weight || 1) > 1
  }).length

  let conclusion = '目前沒有錯題，完成一回測驗後，這裡會整理需要複習的題目。'

  if (dueItems.length > 0) {
    conclusion = `你目前有 ${dueItems.length} 題需要回頭複習，其中 ${highRiskCount} 題曾在錯題複習中答錯。`
  } else if (wrongItems.length > 0) {
    conclusion = `目前沒有今天到期的錯題，但錯題本仍有 ${wrongItems.length} 題，建議固定整理。`
  }

  return {
    totalWrongCount: wrongItems.length,
    dueWrongCount: dueItems.length,
    highRiskCount,
    clearedCount: wrongClearance.clearedCount,
    todayWrongCount,
    todayReviewedCount,
    conclusion,
  }
}

export function getStudyActionRecommendation() {
  const settingsStatus = getStudySettingsStatus()
  const dailyGoal = settingsStatus.dailyGoal
  const todayStats = getTodayStats()
  const subjectPower = getSubjectPowerStats()
  const wrongSummary = getWrongQuestionStatusSummary()
  const todayFeedback = getTodayFeedbackSummary()
  const weakestSubject = subjectPower.weakestSubject
  const answeredCount = Number(todayStats.answeredCount || 0)
  const reachedGoal = settingsStatus.isGoalReached

  if (!settingsStatus.isSetupComplete) {
    const title = settingsStatus.isExamDateExpired
      ? '考試日期已過，請重新設定'
      : '先設定考試日期與每日目標'

    return {
      title,
      description: '設定後，系統會依照倒數天數與每日進度提醒你今天該做什麼。',
      primaryActionLabel: '前往學習設定',
      primaryActionPath: '/settings',
      secondaryActionLabel: '選擇國考科系',
      secondaryActionPath: '/exams',
      reason: settingsStatus.isExamDateExpired ? 'expired_exam_date' : 'setup_required',
      dueWrongCount: wrongSummary.dueWrongCount,
      weakSubject: weakestSubject?.subject || '',
      todayWrongTags: todayFeedback.focusItems,
    }
  }

  if (
    settingsStatus.daysUntilExam !== null &&
    settingsStatus.daysUntilExam <= 7 &&
    wrongSummary.totalWrongCount > 0
  ) {
    const isExamDay = settingsStatus.daysUntilExam === 0
    const countdownText = isExamDay ? '今天就是考試日' : `考前 ${settingsStatus.daysUntilExam} 天`

    return {
      title: `${countdownText}，優先清錯題`,
      description: isExamDay
        ? '今天以錯題、收藏題與低正確率科目做最後確認，避免再開太大的新範圍。'
        : `距離考試只剩 ${settingsStatus.daysUntilExam} 天，建議先複習錯題與低正確率科目。`,
      primaryActionLabel: '複習錯題',
      primaryActionPath: '/wrong-review',
      secondaryActionLabel: weakestSubject ? `開始${weakestSubject.subject}` : '查看成長',
      secondaryActionPath: weakestSubject ? `/quiz/${encodeURIComponent(weakestSubject.subject)}` : '/growth',
      reason: 'exam_close',
      dueWrongCount: wrongSummary.dueWrongCount,
      weakSubject: weakestSubject?.subject || '',
      todayWrongTags: todayFeedback.focusItems,
    }
  }

  if (wrongSummary.dueWrongCount > 0) {
    return {
      title: '今天建議先複習錯題',
      description: `你目前有 ${wrongSummary.dueWrongCount} 題需要回頭練習，先處理錯題會比直接刷新題更有效。`,
      primaryActionLabel: '複習錯題',
      primaryActionPath: '/wrong-review',
      secondaryActionLabel: '查看成長',
      secondaryActionPath: '/growth',
      reason: 'due_wrong',
      dueWrongCount: wrongSummary.dueWrongCount,
      weakSubject: weakestSubject?.subject || '',
      todayWrongTags: todayFeedback.focusItems,
    }
  }

  if (!reachedGoal) {
    const remainingCount = Math.max(0, dailyGoal - answeredCount)
    const targetPath = weakestSubject ? `/quiz/${encodeURIComponent(weakestSubject.subject)}` : '/radiographer'

    return {
      title: '先完成今天的刷題目標',
      description: `今日已完成 ${answeredCount} / ${dailyGoal} 題，還差 ${remainingCount} 題達成目標。`,
      primaryActionLabel: weakestSubject ? `開始${weakestSubject.subject}` : '開始刷題',
      primaryActionPath: targetPath,
      secondaryActionLabel: '選擇國考科系',
      secondaryActionPath: '/exams',
      reason: 'daily_goal_pending',
      dueWrongCount: wrongSummary.dueWrongCount,
      weakSubject: weakestSubject?.subject || '',
      todayWrongTags: todayFeedback.focusItems,
    }
  }

  if (reachedGoal) {
    return {
      title: todayFeedback.wrongCount > 0 || wrongSummary.totalWrongCount > 0
        ? '今天已達標，建議回顧錯題'
        : '今天目標已完成',
      description:
        todayFeedback.wrongCount > 0 && todayFeedback.focusItems.length > 0
          ? `建議回顧今天錯的題目，特別是：${todayFeedback.focusItems.join('、')}。`
          : todayFeedback.wrongCount > 0 || wrongSummary.totalWrongCount > 0
            ? '你已完成今日目標，接著可以複習今天錯的題目，鞏固弱點。'
            : '可以休息，或再挑一科做短回合練習保持手感。',
      primaryActionLabel: todayFeedback.wrongCount > 0 || wrongSummary.totalWrongCount > 0 ? '複習錯題' : '查看成長',
      primaryActionPath: todayFeedback.wrongCount > 0 || wrongSummary.totalWrongCount > 0 ? '/wrong-review' : '/growth',
      secondaryActionLabel: '再做一回',
      secondaryActionPath: '/radiographer',
      reason: 'goal_done',
      weakSubject: weakestSubject?.subject || '',
      todayWrongTags: todayFeedback.focusItems,
    }
  }

  if (weakestSubject) {
    return {
      title: `建議加強：${weakestSubject.subject}`,
      description: `最近作答中，${weakestSubject.subject} 正確率偏低，建議先完成一回練習或複習相關錯題。`,
      primaryActionLabel: `開始${weakestSubject.subject}`,
      primaryActionPath: `/quiz/${encodeURIComponent(weakestSubject.subject)}`,
      secondaryActionLabel: '複習錯題',
      secondaryActionPath: '/wrong-review',
      reason: 'weak_subject',
      weakSubject: weakestSubject.subject,
      todayWrongTags: todayFeedback.focusItems,
    }
  }

  return {
    title: '先完成第一回練習',
    description: '完成一次測驗後，系統會幫你整理錯題、弱科與複習方向。',
    primaryActionLabel: '選擇國考科系',
    primaryActionPath: '/exams',
    secondaryActionLabel: '查看成長',
    secondaryActionPath: '/growth',
    reason: 'new_user',
    weakSubject: '',
    todayWrongTags: [],
  }
}
