import { useExamStore } from '@/lib/examStore';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface ResultsProps {
  onNewExam: () => void;
}

export function Results({ onNewExam }: ResultsProps) {
  const { questions, answers } = useExamStore();
  const [selectedQuestion, setSelectedQuestion] = useState<number | null>(null);

  const calculateResults = () => {
    let correct = 0;
    questions.forEach((q) => {
      if (answers[q.id] === q.correctAnswer) {
        correct++;
      }
    });
    return {
      correct,
      total: questions.length,
      percentage: (correct / questions.length) * 100,
    };
  };

  const results = calculateResults();

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card className="p-6 mb-6">
        <h2 className="text-2xl font-bold mb-4">Exam Results</h2>
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary">
              {results.correct}/{results.total}
            </div>
            <div className="text-sm text-gray-600">Correct Answers</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary">
              {results.percentage.toFixed(1)}%
            </div>
            <div className="text-sm text-gray-600">Score</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary">
              {results.total - results.correct}
            </div>
            <div className="text-sm text-gray-600">Incorrect Answers</div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Review Answers</h3>
          {questions.map((q, index) => {
            const isCorrect = answers[q.id] === q.correctAnswer;
            return (
              <div
                key={q.id}
                className={`p-4 rounded-lg cursor-pointer ${
                  isCorrect ? 'bg-green-50' : 'bg-red-50'
                } ${selectedQuestion === index ? 'ring-2 ring-primary' : ''}`}
                onClick={() => setSelectedQuestion(index)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-medium">Question {index + 1}:</span>
                    <div className="mt-1">{q.question}</div>
                  </div>
                  <div className={isCorrect ? 'text-green-600' : 'text-red-600'}>
                    {isCorrect ? '✓' : '✗'}
                  </div>
                </div>
                
                {selectedQuestion === index && (
                  <div className="mt-4">
                    <div className="font-medium text-gray-700">Explanation:</div>
                    <div className="mt-1 text-gray-600">
                      The correct answer is: {q.options[q.correctAnswer]}
                    </div>
                    {!isCorrect && (
                      <div className="mt-2 text-red-600">
                        You selected: {q.options[answers[q.id]]}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      <div className="flex justify-center">
        <Button onClick={onNewExam}>Start New Exam</Button>
      </div>
    </div>
  );
}