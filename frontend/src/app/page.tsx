"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Timer, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { ExamSetup } from '@/components/ExamSetup'
import { DoubtBox } from '@/components/DoubtBox'
import { Results } from '@/components/Results'
import referralBrandMap from '@/lib/referralBrandMap.json'

const API_CANDIDATES = [
  // Production: Use your deployed Render backend
  process.env.NEXT_PUBLIC_API_URL || 'https://edutest-ai.onrender.com',
  // Fallback: Try local development servers
  'http://localhost:5001',
  'http://localhost:5000'
]

interface Question {
  id: number
  question: string
  options: string[]
  correctAnswer: number
}

interface InstituteBranding {
  name?: string
  logoUrl?: string | null
}

interface ExamProfile {
  pattern: string
  difficulty: string
  focusAreas: string[]
}

interface DifficultyDistribution {
  easy: number
  medium: number
  hard: number
}

interface MarkingScheme {
  correct: number
  wrong: number
  unattempted: number
}

interface ExamBlueprint {
  sectionWeightage: Record<string, number>
  difficultyDistribution: DifficultyDistribution
  markingScheme: MarkingScheme
}

interface ExamTimerRule {
  secondsPerQuestion: number
  minimumSeconds: number
}

const EXAM_PROFILES: Record<string, ExamProfile> = {
  'UPSC': {
    pattern: 'UPSC CSE Prelims MCQ',
    difficulty: 'Medium to High',
    focusAreas: ['Current Affairs', 'Polity', 'History', 'Geography', 'Economy', 'Environment']
  },
  'SSC CGL': {
    pattern: 'Tier-style objective MCQ',
    difficulty: 'Easy to Medium',
    focusAreas: ['Quantitative Aptitude', 'Reasoning', 'English', 'General Awareness']
  },
  'NEET UG': {
    pattern: 'Single correct objective MCQ',
    difficulty: 'Medium to High',
    focusAreas: ['Physics', 'Chemistry', 'Biology (Botany and Zoology)']
  },
  'JEE Main': {
    pattern: 'Single correct objective MCQ',
    difficulty: 'Medium to High',
    focusAreas: ['Physics', 'Chemistry', 'Mathematics']
  },
  'JEE Advanced': {
    pattern: 'Advanced conceptual objective MCQ',
    difficulty: 'High',
    focusAreas: ['Advanced Physics', 'Advanced Chemistry', 'Advanced Mathematics']
  },
  'CAT': {
    pattern: 'Aptitude and verbal objective',
    difficulty: 'Medium to High',
    focusAreas: ['VARC', 'DILR', 'QA']
  },
  'GATE': {
    pattern: 'Technical objective MCQ',
    difficulty: 'Medium to High',
    focusAreas: ['Core Engineering', 'Aptitude', 'Mathematics']
  },
  'RRB NTPC': {
    pattern: 'Objective MCQ',
    difficulty: 'Easy to Medium',
    focusAreas: ['General Awareness', 'Mathematics', 'Reasoning']
  },
  'Bank PO': {
    pattern: 'Banking aptitude objective',
    difficulty: 'Medium',
    focusAreas: ['Quant', 'Reasoning', 'English', 'Banking Awareness']
  },
  'NET': {
    pattern: 'UGC NET style objective',
    difficulty: 'Medium to High',
    focusAreas: ['Teaching Aptitude', 'Research Aptitude', 'Subject Domain']
  },
  'KCET': {
    pattern: 'Objective single-correct MCQ',
    difficulty: 'Easy to Medium',
    focusAreas: ['Physics', 'Chemistry', 'Mathematics', 'Biology']
  },
  'DCET': {
    pattern: 'Diploma CET objective MCQ',
    difficulty: 'Medium',
    focusAreas: ['Applied Mathematics', 'Applied Science', 'Core Diploma Branch']
  },
  'COMEDK': {
    pattern: 'Engineering entrance objective MCQ',
    difficulty: 'Medium',
    focusAreas: ['Physics', 'Chemistry', 'Mathematics']
  },
  'CTET': {
    pattern: 'Teacher eligibility objective MCQ',
    difficulty: 'Easy to Medium',
    focusAreas: ['Child Development and Pedagogy', 'Language I', 'Language II', 'Mathematics', 'Environmental Studies']
  },
  'TET': {
    pattern: 'Teacher eligibility objective MCQ',
    difficulty: 'Easy to Medium',
    focusAreas: ['Pedagogy', 'Language', 'Mathematics', 'General Studies']
  }
}

const EXAM_BLUEPRINTS: Record<string, ExamBlueprint> = {
  'UPSC': {
    sectionWeightage: {
      'Polity and Governance': 22,
      'History and Culture': 18,
      'Geography': 16,
      'Economy': 16,
      'Environment and Ecology': 14,
      'Current Affairs': 14
    },
    difficultyDistribution: { easy: 20, medium: 55, hard: 25 },
    markingScheme: { correct: 2, wrong: -0.67, unattempted: 0 }
  },
  'NEET UG': {
    sectionWeightage: {
      'Biology': 50,
      'Chemistry': 25,
      'Physics': 25
    },
    difficultyDistribution: { easy: 25, medium: 50, hard: 25 },
    markingScheme: { correct: 4, wrong: -1, unattempted: 0 }
  },
  'JEE Main': {
    sectionWeightage: {
      'Physics': 34,
      'Chemistry': 33,
      'Mathematics': 33
    },
    difficultyDistribution: { easy: 20, medium: 55, hard: 25 },
    markingScheme: { correct: 4, wrong: -1, unattempted: 0 }
  },
  'JEE Advanced': {
    sectionWeightage: {
      'Physics': 34,
      'Chemistry': 33,
      'Mathematics': 33
    },
    difficultyDistribution: { easy: 10, medium: 45, hard: 45 },
    markingScheme: { correct: 3, wrong: -1, unattempted: 0 }
  },
  'SSC CGL': {
    sectionWeightage: {
      'Quantitative Aptitude': 25,
      'General Intelligence and Reasoning': 25,
      'General Awareness': 25,
      'English Comprehension': 25
    },
    difficultyDistribution: { easy: 35, medium: 50, hard: 15 },
    markingScheme: { correct: 2, wrong: -0.5, unattempted: 0 }
  },
  'Bank PO': {
    sectionWeightage: {
      'Quantitative Aptitude': 33,
      'Reasoning': 33,
      'English Language': 34
    },
    difficultyDistribution: { easy: 30, medium: 50, hard: 20 },
    markingScheme: { correct: 1, wrong: -0.25, unattempted: 0 }
  },
  'RRB NTPC': {
    sectionWeightage: {
      'General Awareness': 40,
      'Mathematics': 30,
      'General Intelligence and Reasoning': 30
    },
    difficultyDistribution: { easy: 40, medium: 45, hard: 15 },
    markingScheme: { correct: 1, wrong: -0.33, unattempted: 0 }
  },
  'CAT': {
    sectionWeightage: {
      'VARC': 34,
      'DILR': 33,
      'QA': 33
    },
    difficultyDistribution: { easy: 20, medium: 50, hard: 30 },
    markingScheme: { correct: 3, wrong: -1, unattempted: 0 }
  },
  'GATE': {
    sectionWeightage: {
      'General Aptitude': 15,
      'Engineering Mathematics': 13,
      'Core Subject': 72
    },
    difficultyDistribution: { easy: 20, medium: 55, hard: 25 },
    markingScheme: { correct: 1, wrong: -0.33, unattempted: 0 }
  },
  'KCET': {
    sectionWeightage: {
      'Physics': 25,
      'Chemistry': 25,
      'Mathematics/Biology': 50
    },
    difficultyDistribution: { easy: 35, medium: 50, hard: 15 },
    markingScheme: { correct: 1, wrong: 0, unattempted: 0 }
  },
  'DCET': {
    sectionWeightage: {
      'Applied Mathematics': 30,
      'Applied Science': 30,
      'Core Diploma Subject': 40
    },
    difficultyDistribution: { easy: 30, medium: 50, hard: 20 },
    markingScheme: { correct: 1, wrong: 0, unattempted: 0 }
  },
  'COMEDK': {
    sectionWeightage: {
      'Physics': 33,
      'Chemistry': 33,
      'Mathematics': 34
    },
    difficultyDistribution: { easy: 30, medium: 50, hard: 20 },
    markingScheme: { correct: 1, wrong: 0, unattempted: 0 }
  },
  'CTET': {
    sectionWeightage: {
      'Child Development and Pedagogy': 20,
      'Language I': 20,
      'Language II': 20,
      'Mathematics and Science': 20,
      'Social Studies/EVS': 20
    },
    difficultyDistribution: { easy: 40, medium: 45, hard: 15 },
    markingScheme: { correct: 1, wrong: 0, unattempted: 0 }
  },
  'TET': {
    sectionWeightage: {
      'Pedagogy': 25,
      'Language': 25,
      'Mathematics': 25,
      'General Studies': 25
    },
    difficultyDistribution: { easy: 40, medium: 45, hard: 15 },
    markingScheme: { correct: 1, wrong: 0, unattempted: 0 }
  }
}

const DEFAULT_EXAM_BLUEPRINT: ExamBlueprint = {
  sectionWeightage: {
    'Core Topic': 70,
    'Application and Analysis': 30
  },
  difficultyDistribution: { easy: 25, medium: 50, hard: 25 },
  markingScheme: { correct: 1, wrong: 0, unattempted: 0 }
}

const EXAM_TIMER_RULES: Record<string, ExamTimerRule> = {
  'UPSC': { secondsPerQuestion: 72, minimumSeconds: 30 * 60 },
  'NEET UG': { secondsPerQuestion: 60, minimumSeconds: 30 * 60 },
  'JEE Main': { secondsPerQuestion: 75, minimumSeconds: 30 * 60 },
  'JEE Advanced': { secondsPerQuestion: 90, minimumSeconds: 45 * 60 },
  'SSC CGL': { secondsPerQuestion: 60, minimumSeconds: 30 * 60 },
  'Bank PO': { secondsPerQuestion: 60, minimumSeconds: 30 * 60 },
  'RRB NTPC': { secondsPerQuestion: 54, minimumSeconds: 30 * 60 },
  'CAT': { secondsPerQuestion: 120, minimumSeconds: 40 * 60 },
  'GATE': { secondsPerQuestion: 108, minimumSeconds: 45 * 60 },
  'KCET': { secondsPerQuestion: 60, minimumSeconds: 30 * 60 },
  'DCET': { secondsPerQuestion: 72, minimumSeconds: 30 * 60 },
  'COMEDK': { secondsPerQuestion: 60, minimumSeconds: 30 * 60 },
  'CTET': { secondsPerQuestion: 60, minimumSeconds: 30 * 60 },
  'TET': { secondsPerQuestion: 60, minimumSeconds: 30 * 60 }
}

const getExamDurationSeconds = (exam: string, count: number) => {
  const rule = EXAM_TIMER_RULES[exam] || { secondsPerQuestion: 36, minimumSeconds: 30 * 60 }
  return Math.max(rule.minimumSeconds, count * rule.secondsPerQuestion)
}

export default function TestPage() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [answers, setAnswers] = useState<(number | null)[]>([])
  const [timeLeft, setTimeLeft] = useState(3600) // 1 hour in seconds
  const [isTestComplete, setIsTestComplete] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [userInput, setUserInput] = useState('')
  const [selectedExam, setSelectedExam] = useState<string>('')
  const [step, setStep] = useState<'input' | 'review' | 'test' | 'results'>('input')
  const [explanations, setExplanations] = useState<{[key: number]: string}>({})
  const [showExplanation, setShowExplanation] = useState<number | null>(null)
  const [questionCount, setQuestionCount] = useState<number>(50)
  const [followUps, setFollowUps] = useState<{[key:number]: string}>({})
  const [brand, setBrand] = useState<InstituteBranding | null>(null)
  
  const examTypes = [
    'UPSC',
    'KPSC',
    'SSC CGL',
    'Bank PO',
    'RRB NTPC',
    'GATE',
    'NET',
    'NEET UG',
    'JEE Main',
    'JEE Advanced',
    'KCET',
    'DCET',
    'COMEDK',
    'CUET UG',
    'CUET PG',
    'NDA',
    'CDS',
    'CAT',
    'XAT',
    'CLAT',
    'AFCAT',
    'CTET',
    'TET',
    'State PSC'
  ]

  // Resolve backend base (production first, then local fallbacks)
  const [apiBase, setApiBase] = useState<string | null>(null)
  useEffect(() => {
    let mounted = true
    const probe = async () => {
      for (const url of API_CANDIDATES) {
        try {
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 3000) // 3s timeout per candidate
          const res = await fetch(`${url}/api/test`, { method: 'GET', signal: controller.signal })
          clearTimeout(timeoutId)
          if (res.ok) {
            if (mounted) setApiBase(url)
            console.log('Using backend:', url)
            return
          }
        } catch (e) {
          // ignore and try next
        }
      }
      // All candidates failed — default to first (production URL) and let individual requests show errors
      if (mounted) setApiBase(API_CANDIDATES[0])
      console.warn('All backend candidates failed. Using default:', API_CANDIDATES[0])
    }
    probe()
    return () => { mounted = false }
  }, [])

  useEffect(() => {
    // intentionally empty; fetch triggered by setup submit
  }, [])

  useEffect(() => {
    const ref = typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('ref')
      : null

    if (!ref) return

    const localBrand = (referralBrandMap as Record<string, any>)[ref.trim().toUpperCase()]
    if (localBrand) {
      setBrand({
        name: localBrand.name,
        logoUrl: localBrand.logoUrl || null,
      })
      return
    }

    // Wait for apiBase to be resolved before hitting the network
    if (apiBase === null) return

    const loadBranding = async () => {
      try {
        const response = await fetch(`${apiBase}/api/auth/institute/${encodeURIComponent(ref)}`)
        if (!response.ok) return
        const data = await response.json()
        if (data?.institute) {
          setBrand({
            name: data.institute.name,
            logoUrl: data.institute.logoUrl || null,
          })
        }
      } catch (e) {
        // ignore branding load failures
      }
    }

    loadBranding()
  }, [apiBase])

  useEffect(() => {
    if (questions.length > 0) {
      setAnswers(new Array(questions.length).fill(null))
    }
  }, [questions])



  const fetchQuestions = async () => {
    if (!selectedExam || !userInput.trim()) {
      setError("Please select an exam type and enter your request")
      return
    }

    setLoading(true)
    setError(null)
    try {
      // Parse the user input to extract topic details
      const input = userInput.toLowerCase()
      let subject = selectedExam
      let topic = ''

      // Mapping common user inputs to proper topic names
      if (input.includes('modern history')) {
        topic = 'Modern Indian History (1857-1947)'
      } else if (input.includes('ancient history')) {
        topic = 'Ancient Indian History'
      } else if (input.includes('medieval history')) {
        topic = 'Medieval Indian History'
      } else if (input.includes('current affairs')) {
        topic = 'Current Affairs'
      } else if (input.includes('geography')) {
        topic = 'Indian Geography'
      } else if (input.includes('polity')) {
        topic = 'Indian Polity'
      } else if (input.includes('economy')) {
        topic = 'Indian Economy'
      } else {
        // If no specific topic found, use the entire input as topic
        topic = input.charAt(0).toUpperCase() + input.slice(1)
      }

      const useRecent = typeof topic === 'string' && topic.toLowerCase().includes('current')

      const examProfile = EXAM_PROFILES[selectedExam] || {
        pattern: 'Objective MCQ',
        difficulty: 'Medium',
        focusAreas: [topic]
      }

      const examBlueprint = EXAM_BLUEPRINTS[selectedExam] || DEFAULT_EXAM_BLUEPRINT

      const body = {
        subject: subject,
        topic: topic,
        count: questionCount, // use selected question count
        useRecent: useRecent,
        examPattern: examProfile.pattern,
        examDifficulty: examProfile.difficulty,
        examFocusAreas: examProfile.focusAreas,
        examBlueprint
      }

      const base = apiBase || API_CANDIDATES[0]
      console.log('Using backend base for questions:', base)
      console.log('Sending request with body:', body)

      const response = await fetch(`${base}/api/questions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const errorText = await response.text()
        let parsedMessage = ''
        try {
          const parsed = JSON.parse(errorText)
          parsedMessage = parsed?.message || parsed?.error || ''
        } catch {
          // Keep raw text fallback when response is not JSON.
        }

        console.error('Server Error:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        })
        throw new Error(parsedMessage || errorText || `Failed to fetch questions: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      
      if (!Array.isArray(data) || data.length === 0) {
        throw new Error('Invalid response format from server')
      }
      
      // Transform the data if needed
      const formattedQuestions = data.map((q, index) => ({
        id: index + 1,
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer
      }))

      setQuestions(formattedQuestions)
      setLoading(false)
      setStep('review')
    } catch (err) {
      console.error('Error fetching questions:', err)
      setError(err instanceof Error ? err.message : 'Failed to generate questions. Please try again.')
      setLoading(false)
    }
  }

  useEffect(() => {
    if (timeLeft > 0 && !isTestComplete) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    } else if (timeLeft === 0) {
      setIsTestComplete(true)
    }
  }, [timeLeft, isTestComplete])

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleAnswerSelect = (answerIndex: number) => {
    setSelectedAnswer(answerIndex)
    const newAnswers = [...answers]
    newAnswers[currentQuestion] = answerIndex
    setAnswers(newAnswers)
  }

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
      setSelectedAnswer(answers[currentQuestion + 1])
    } else {
      setIsTestComplete(true)
    }
  }

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1)
      setSelectedAnswer(answers[currentQuestion - 1])
    }
  }

  const handleSubmit = async () => {
    setIsTestComplete(true)
    setShowResults(true)

    // Save test result to backend (best-effort, don't block UI)
    try {
      const activeToken = typeof window !== 'undefined' ? localStorage.getItem('edutest_auth_token') : null
      if (activeToken && questions.length > 0) {
        const base = apiBase || API_CANDIDATES[0]
        const correctAnswersList = questions.map(q => q.correctAnswer)
        const correctCount = answers.filter((a, i) => a === questions[i]?.correctAnswer).length
        const wrongCount = answers.filter((a, i) => a !== null && a !== questions[i]?.correctAnswer).length
        const skippedCount = answers.filter(a => a === null).length
        const score = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0

        // Identify weak topics (questions answered wrong)
        const weakTopicSet = new Set<string>()
        answers.forEach((a, i) => {
          if (a !== null && a !== questions[i]?.correctAnswer) {
            weakTopicSet.add(userInput || 'General')
          }
        })

        await fetch(`${base}/api/tests/save`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${activeToken}`,
          },
          body: JSON.stringify({
            subject: selectedExam,
            topic: userInput || 'General',
            examType: 'practice',
            userAnswers: answers,
            correctAnswers: correctAnswersList,
            totalQuestions: questions.length,
            correctCount,
            wrongCount,
            skippedCount,
            score,
            timeSpent: getExamDurationSeconds(selectedExam, questionCount) - timeLeft,
            timeLimit: getExamDurationSeconds(selectedExam, questionCount),
            weakTopics: Array.from(weakTopicSet),
          }),
        })
      }
    } catch (e) {
      // Non-blocking — don't show error to user
      console.warn('Failed to save test result:', e)
    }
  }

  const calculateResultStats = () => {
    const blueprint = EXAM_BLUEPRINTS[selectedExam] || DEFAULT_EXAM_BLUEPRINT
    const marking = blueprint.markingScheme

    let correct = 0
    let wrong = 0
    let unattempted = 0

    answers.forEach((answer, index) => {
      if (answer === null || answer === undefined) {
        unattempted++
      } else if (answer === questions[index].correctAnswer) {
        correct++
      } else {
        wrong++
      }
    })

    const score = (correct * marking.correct) + (wrong * marking.wrong) + (unattempted * marking.unattempted)
    const attempted = correct + wrong
    const accuracy = attempted > 0 ? Math.round((correct / attempted) * 100) : 0

    return {
      score,
      correct,
      wrong,
      unattempted,
      attempted,
      accuracy,
      marking
    }
  }

  const calculateLivePreviewStats = () => {
    const blueprint = EXAM_BLUEPRINTS[selectedExam] || DEFAULT_EXAM_BLUEPRINT
    const marking = blueprint.markingScheme

    let correct = 0
    let wrong = 0
    let unattempted = 0

    answers.forEach((answer, index) => {
      if (answer === null || answer === undefined) {
        unattempted++
      } else if (answer === questions[index]?.correctAnswer) {
        correct++
      } else {
        wrong++
      }
    })

    const score = (correct * marking.correct) + (wrong * marking.wrong) + (unattempted * marking.unattempted)
    return {
      score,
      correct,
      wrong,
      unattempted,
      attempted: correct + wrong,
      marking
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-4" />
            <p className="text-lg text-gray-600">Loading questions...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <XCircle className="w-8 h-8 text-red-600 mb-4" />
            <p className="text-lg text-red-600 mb-4">Error Generating Questions</p>
            <p className="text-sm text-gray-600 text-center mb-4">
              {error.includes('Failed to fetch') ? 
                'Unable to connect to the backend server. Check NEXT_PUBLIC_API_URL and ensure your Render service is live.' :
                error
              }
            </p>
            <div className="text-sm text-gray-500 mb-4 text-center">
              <p>Troubleshooting steps:</p>
              <ul className="list-disc list-inside mt-2">
                <li>Check if backend server is running</li>
                <li>Verify you selected an exam type</li>
                <li>Make sure your topic is clearly specified</li>
                <li>Try refreshing the page</li>
              </ul>
            </div>
            <div className="flex gap-4">
              <Button onClick={() => setStep('input')} variant="outline">
                Change Request
              </Button>
              <Button onClick={() => {
                setError(null);
                setLoading(false);
                fetchQuestions();
              }}>
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (showResults) {
    const stats = calculateResultStats()
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle className="text-center text-2xl">Test Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <div className="text-6xl font-bold text-blue-600">{stats.score.toFixed(2)}</div>
              <p className="text-lg text-gray-600 mt-2">
                Correct: {stats.correct} | Wrong: {stats.wrong} | Unattempted: {stats.unattempted}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Accuracy: {stats.accuracy}% | Marking: +{stats.marking.correct} / {stats.marking.wrong}
              </p>
            </div>
            <div className="space-y-4">
              {questions.map((question, index) => (
                <div key={question.id} className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    {answers[index] === question.correctAnswer ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500" />
                    )}
                    <span className="font-medium">Question {index + 1}</span>
                  </div>
                  <p className="text-sm text-gray-600">{question.question}</p>
                  <p className="text-sm mt-1">
                    Your answer: {answers[index] !== null ? question.options[answers[index]] : 'Not answered'}
                  </p>
                  <p className="text-sm text-green-600">
                    Correct answer: {question.options[question.correctAnswer]}
                  </p>
                  {answers[index] !== question.correctAnswer && (
                    <div className="mt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          if (!explanations[index]) {
                            const base = apiBase || API_CANDIDATES[0]
                            const prompt = `Explain why the following is the correct answer.\nQuestion: ${question.question}\nCorrect Answer: ${question.options[question.correctAnswer]}\nUser Answer: ${question.options[answers[index] ?? 0]}\nProvide a clear, detailed explanation suitable for exam practice.`
                            const response = await fetch(`${base}/api/explain`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ prompt })
                            });
                            const data = await response.json();
                            setExplanations(prev => ({ ...prev, [index]: data.explanation || data.error || 'No explanation returned' }));
                          }
                          setShowExplanation(showExplanation === index ? null : index);
                        }}
                      >
                        {showExplanation === index ? 'Hide Explanation' : 'Show Explanation'}
                      </Button>
                      {showExplanation === index && explanations[index] && (
                        <div className="mt-2 p-3 bg-blue-50 rounded-md text-sm space-y-2">
                          <div>{explanations[index]}</div>
                          <div>
                            <Label>Ask a follow-up or clarify (optional)</Label>
                            <textarea
                              className="w-full p-2 border rounded-md mt-1"
                              rows={3}
                              value={followUps[index] || ''}
                              onChange={(e) => setFollowUps(prev => ({ ...prev, [index]: e.target.value }))}
                            />
                            <div className="mt-2 flex gap-2">
                              <Button size="sm" variant="outline" onClick={async () => {
                                const follow = followUps[index];
                                if (!follow || follow.trim().length === 0) return;
                                const base = apiBase || API_CANDIDATES[0];
                                const followPrompt = `Follow-up: ${follow}\n\nOriginal question: ${question.question}\nOriginal explanation: ${explanations[index]}\nPlease answer the follow-up clearly and concisely.`;
                                try {
                                  const resp = await fetch(`${base}/api/explain`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ prompt: followPrompt })
                                  });
                                  const d = await resp.json();
                                  // append follow-up answer to existing explanation
                                  setExplanations(prev => ({ ...prev, [index]: prev[index] + '\n\nFollow-up answer:\n' + (d.explanation || d.error || 'No answer') }));
                                  setFollowUps(prev => ({ ...prev, [index]: '' }));
                                } catch (e) {
                                  console.error('Follow-up error', e);
                                }
                              }}>Ask follow-up</Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const liveStats = calculateLivePreviewStats()

  // Main UI flow: Input -> Review -> Test -> Results
  return (
    <div className="min-h-screen bg-gray-50">
      {step === 'input' && (
        <>
          {/* Hero Entry Banner */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-6 px-4 mb-6">
            <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold mb-2">Welcome to EduTest AI</h2>
                <p className="text-blue-100">Practice smarter. Score higher.</p>
              </div>
              <div className="flex gap-3">
                <a href="/login" className="px-6 py-2 bg-white text-blue-600 font-semibold rounded hover:bg-blue-50 transition">
                  Sign In (Student)
                </a>
                <a href="/institute/register" className="px-6 py-2 bg-green-600 text-white font-semibold rounded hover:bg-green-700 transition">
                  Coaching Center Admin
                </a>
              </div>
            </div>
          </div>

          <div className="max-w-4xl mx-auto px-4 py-8">
          <Card className="p-6">
            <CardHeader>
              <CardTitle className="text-2xl text-center">
                {brand?.name || 'EduTest AI'} - Your Personal Test Generator
              </CardTitle>
              {brand?.logoUrl && (
                <div className="flex justify-center mt-3">
                  <img src={brand.logoUrl} alt={brand?.name || 'Brand logo'} className="h-12 object-contain" />
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Select Exam Type</Label>
                <select 
                  className="w-full p-2 border rounded-md"
                  value={selectedExam}
                  onChange={(e) => setSelectedExam(e.target.value)}
                >
                  <option value="">Select an exam...</option>
                  {examTypes.map(exam => (
                    <option key={exam} value={exam}>{exam}</option>
                  ))}
                </select>
              </div>
              
              <div className="space-y-2">
                <Label>What would you like to practice?</Label>
                <textarea
                  className="w-full p-3 border rounded-md min-h-[100px]"
                  placeholder="Example: I need questions for UPSC Modern History chapter, or Create a mixed test for UPSC prelims with current affairs and history"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-4">
                <div>
                  <Label>Number of questions</Label>
                  <select value={questionCount} onChange={(e) => setQuestionCount(parseInt(e.target.value))} className="p-2 border rounded-md">
                    <option value={50}>50 (30 minutes)</option>
                    <option value={100}>100 (60 minutes)</option>
                  </select>
                </div>
                <div className="flex-1">
                  <Button 
                    onClick={fetchQuestions}
                    className="w-full"
                    disabled={!selectedExam || !userInput.trim()}
                  >
                    Generate Test
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          </div>
        </>
      )}

      {step === 'review' && (
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Card className="p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Review Questions ({questions.length})</h2>
            <div className="space-y-4 max-h-96 overflow-auto">
              {questions.map((q, idx) => (
                <div key={q.id} className="border p-3 rounded">
                  <div className="font-medium">{idx + 1}. {q.question}</div>
                  <div className="text-sm text-gray-600 mt-2">Options: {q.options.join(' | ')}</div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center gap-4">
              <Button onClick={() => setStep('input')} variant="outline">Back</Button>
              <Button onClick={() => {
                // Use exam-aware timer defaults with fallback
                const secs = getExamDurationSeconds(selectedExam, questionCount)
                setTimeLeft(secs)
                setCurrentQuestion(0)
                setStep('test')
              }}>Start Timed Test</Button>
            </div>
          </Card>
        </div>
      )}

      {step === 'test' && (
        <>
          <div className="bg-white shadow-sm border-b">
            <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
              <h1 className="text-xl font-semibold">EduTest AI</h1>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Timer className="w-5 h-5" />
                  <span className="font-mono text-lg">{formatTime(timeLeft)}</span>
                </div>
                <div className="text-sm text-gray-600">
                  Question {currentQuestion + 1} of {questions.length}
                </div>
              </div>
            </div>
            <Progress value={(currentQuestion + 1) / Math.max(1, questions.length) * 100} className="h-2" />
          </div>

          <div className="max-w-4xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {questions[currentQuestion]?.question}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <RadioGroup
                    value={answers[currentQuestion]?.toString() || ''}
                    onValueChange={(value) => handleAnswerSelect(parseInt(value))}
                    className="space-y-4"
                  >
                    {questions[currentQuestion]?.options?.map((option, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                        <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                          {option}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>

                  <div className="flex justify-between mt-8">
                    <Button
                      variant="outline"
                      onClick={handlePrevious}
                      disabled={currentQuestion === 0}
                    >
                      Previous
                    </Button>
                    {currentQuestion === questions.length - 1 ? (
                      <Button onClick={handleSubmit} className="bg-green-600 hover:bg-green-700">
                        Submit Test
                      </Button>
                    ) : (
                      <Button onClick={handleNext}>
                        Next
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <aside>
              <DoubtBox />
              <div className="mt-4 rounded-lg border p-4 bg-white">
                <h3 className="font-semibold text-sm mb-2">Live Score Preview</h3>
                <div className="text-sm text-gray-700 space-y-1">
                  <p>Score: {liveStats.score.toFixed(2)}</p>
                  <p>Correct: {liveStats.correct}</p>
                  <p>Wrong: {liveStats.wrong}</p>
                  <p>Unattempted: {liveStats.unattempted}</p>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Marking: +{liveStats.marking.correct} / {liveStats.marking.wrong}
                </p>
              </div>
              <div className="mt-4">
                <Button variant="outline" onClick={() => { setStep('review') }}>Back to Review</Button>
              </div>
            </aside>
          </div>
        </>
      )}
    </div>
  )
}
