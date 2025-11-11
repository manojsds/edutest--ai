import { useEffect } from 'react';
import { useExamStore } from '@/lib/examStore';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

export function ExamInterface() {
  const {
    questions,
    currentQuestion,
    answers,
    timeRemaining,
    setCurrentQuestion,
    setAnswer,
    finishExam,
    updateTimer,
  } = useExamStore();

  useEffect(() => {
    const timer = setInterval(() => {
      updateTimer();
    }, 1000);

    return () => clearInterval(timer);
  }, [updateTimer]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const question = questions[currentQuestion];

  if (!question) return null;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6 flex justify-between items-center">
        <div className="text-xl font-semibold">
          Question {currentQuestion + 1} of {questions.length}
        </div>
        <div className="text-xl font-bold text-primary">
          Time Remaining: {formatTime(timeRemaining)}
        </div>
      </div>

      <Progress
        value={(currentQuestion + 1) / questions.length * 100}
        className="mb-6"
      />

      <Card className="p-6 mb-6">
        <div className="text-lg mb-4">{question.question}</div>

        <RadioGroup
          value={answers[question.id]?.toString()}
          onValueChange={(value) => setAnswer(question.id, parseInt(value))}
        >
          {question.options.map((option, index) => (
            <div key={index} className="flex items-center space-x-2 mb-2">
              <RadioGroupItem value={index.toString()} id={`option-${index}`} />
              <Label htmlFor={`option-${index}`}>{option}</Label>
            </div>
          ))}
        </RadioGroup>
      </Card>

      <div className="flex justify-between">
        <Button
          variant="outline"
          disabled={currentQuestion === 0}
          onClick={() => setCurrentQuestion(currentQuestion - 1)}
        >
          Previous
        </Button>

        {currentQuestion === questions.length - 1 ? (
          <Button onClick={finishExam}>Finish Exam</Button>
        ) : (
          <Button onClick={() => setCurrentQuestion(currentQuestion + 1)}>
            Next
          </Button>
        )}
      </div>
    </div>
  );
}