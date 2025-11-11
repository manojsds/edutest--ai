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

const API_CANDIDATES = [
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001',
  'http://localhost:5000'
]

interface Question {
  id: number
  question: string
  options: string[]
  correctAnswer: number
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
  
  const examTypes = [
    'UPSC',
    'KPSC',
    'SSC CGL',
    'Bank PO',
    'RRB',
    'GATE',
    'NET'
  ]

  // Resolve backend base (probe 5001 then 5000)
  const [apiBase, setApiBase] = useState<string | null>(null)
  useEffect(() => {
    let mounted = true
    const probe = async () => {
      for (const url of API_CANDIDATES) {
        try {
          const res = await fetch(`${url}/api/test`, { method: 'GET' })
          if (res.ok) {
            if (mounted) setApiBase(url)
            console.log('Using backend:', url)
            return
          }
        } catch (e) {
          // ignore and try next
        }
      }
      if (mounted) setApiBase(API_CANDIDATES[0])
    }
    probe()
    return () => { mounted = false }
  }, [])

  useEffect(() => {
    // intentionally empty; fetch triggered by setup submit
  }, [])

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

      const body = {
        subject: subject,
        topic: topic,
        count: questionCount // use selected question count
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
        console.error('Server Error:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        })
        throw new Error(errorText || `Failed to fetch questions: ${response.status} ${response.statusText}`)
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

  const handleSubmit = () => {
    setIsTestComplete(true)
    setShowResults(true)
  }

  const calculateScore = () => {
    let correct = 0
    answers.forEach((answer, index) => {
      if (answer === questions[index].correctAnswer) correct++
    })
    return correct
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
                'Unable to connect to the server. Please make sure the backend is running on port 5001.' :
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
    const score = calculateScore()
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle className="text-center text-2xl">Test Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <div className="text-6xl font-bold text-blue-600">{score}/{questions.length}</div>
              <p className="text-lg text-gray-600 mt-2">
                You scored {Math.round((score / questions.length) * 100)}%
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
  // Main UI flow: Input -> Review -> Test -> Results
  return (
    <div className="min-h-screen bg-gray-50">
      {step === 'input' && (
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Card className="p-6">
            <CardHeader>
              <CardTitle className="text-2xl text-center">EduTest AI - Your Personal Test Generator</CardTitle>
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
                // Set timer based on question count: 50 -> 30min, 100 -> 60min
                const secs = questionCount <= 50 ? 30 * 60 : 60 * 60
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
