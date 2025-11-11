import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useExamStore } from '@/lib/examStore';

const API_CANDIDATES = ['http://localhost:5001', 'http://localhost:5000'];
let _cachedApiBase: string | null = null;

async function resolveApiBase() {
  if (_cachedApiBase) return _cachedApiBase;
  for (const url of API_CANDIDATES) {
    try {
      const res = await fetch(`${url}/api/test`, { method: 'GET' });
      if (res.ok) {
        _cachedApiBase = url;
        return url;
      }
    } catch (e) {
      // ignore
    }
  }
  _cachedApiBase = API_CANDIDATES[0];
  return _cachedApiBase;
}

export function DoubtBox() {
  const [questionNumber, setQuestionNumber] = useState('');
  const [explanation, setExplanation] = useState('');
  const [loading, setLoading] = useState(false);
  const { questions } = useExamStore();

  const handleAskDoubt = async () => {
    const qNum = parseInt(questionNumber);
    if (isNaN(qNum) || qNum < 1 || qNum > questions.length) {
      alert('Please enter a valid question number');
      return;
    }

    setLoading(true);
    try {
      const question = questions[qNum - 1];
      const prompt = customPrompt && customPrompt.trim().length > 0 ? customPrompt : `I have a doubt about this UPSC Modern History question:\nQuestion: ${question.question}\nCorrect Answer: ${question.options[question.correctAnswer]}\nPlease explain in detail why this is the correct answer and provide historical context.`;

      const base = await resolveApiBase();
      const response = await fetch(`${base}/api/explain`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt,
          questionId: qNum
        }),
      });

      const data = await response.json();
      setExplanation(data.explanation || data.error || 'No explanation returned');
    } catch (error) {
      console.error('Error getting explanation:', error);
      setExplanation('Failed to get explanation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const [customPrompt, setCustomPrompt] = useState('');

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4">Doubt Box</h2>
      
      <div className="space-y-4">
        <div>
          <Label htmlFor="questionNumber">Question Number</Label>
          <input
            id="questionNumber"
            type="number"
            min="1"
            max={questions.length}
            value={questionNumber}
            onChange={(e) => setQuestionNumber(e.target.value)}
            className="w-full p-2 border rounded-md"
          />
        </div>

        <div>
          <Label htmlFor="customPrompt">Or type your own doubt (optional)</Label>
          <textarea id="customPrompt" value={customPrompt} onChange={(e) => setCustomPrompt(e.target.value)} className="w-full p-2 border rounded-md mt-1" rows={3} />
        </div>

        <Button
          onClick={handleAskDoubt}
          disabled={loading}
          className="w-full"
        >
          {loading ? 'Getting Explanation...' : 'Ask for Explanation'}
        </Button>

        {explanation && (
          <div className="mt-4">
            <Label>Explanation</Label>
            <div className="p-4 bg-gray-50 rounded-md mt-2">
              {explanation}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}