import { create } from 'zustand';

interface ExamState {
  questions: Question[];
  currentQuestion: number;
  answers: { [key: number]: number };
  timeRemaining: number;
  examType: string;
  subject: string;
  isStarted: boolean;
  isFinished: boolean;
}

interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
}

interface ExamStore extends ExamState {
  setQuestions: (questions: Question[]) => void;
  setCurrentQuestion: (index: number) => void;
  setAnswer: (questionId: number, answerIndex: number) => void;
  startExam: (examType: string, subject: string) => void;
  finishExam: () => void;
  updateTimer: () => void;
}

export const useExamStore = create<ExamStore>((set) => ({
  questions: [],
  currentQuestion: 0,
  answers: {},
  timeRemaining: 60 * 60, // 60 minutes in seconds
  examType: '',
  subject: '',
  isStarted: false,
  isFinished: false,

  setQuestions: (questions) => set({ questions }),
  setCurrentQuestion: (index) => set({ currentQuestion: index }),
  setAnswer: (questionId, answerIndex) => 
    set((state) => ({
      answers: { ...state.answers, [questionId]: answerIndex }
    })),
  startExam: (examType, subject) => 
    set({ examType, subject, isStarted: true }),
  finishExam: () => set({ isFinished: true }),
  updateTimer: () => 
    set((state) => ({
      timeRemaining: Math.max(0, state.timeRemaining - 1),
      isFinished: state.timeRemaining <= 1
    })),
}));