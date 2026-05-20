'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/authContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, BookOpen, Target, ArrowLeft, RefreshCw } from 'lucide-react';

interface TopicStat {
  topic: string;
  testsAttempted: number;
  totalQuestions: number;
  correctAnswers: number;
  averageScore: number;
  totalTimeSpent: number;
}

interface PerformanceData {
  topicPerformance: TopicStat[];
  weakTopics: TopicStat[];
  strongTopics: TopicStat[];
}

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 70 ? 'bg-green-100 text-green-700' :
    score >= 50 ? 'bg-yellow-100 text-yellow-700' :
    'bg-red-100 text-red-700';
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${color}`}>
      {score}%
    </span>
  );
}

export default function PerformancePage() {
  const router = useRouter();
  const { token } = useAuth();
  const [data, setData] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://edutest-ai.onrender.com';

  const fetchPerformance = async () => {
    setLoading(true);
    setError(null);
    try {
      const activeToken = token || localStorage.getItem('edutest_auth_token');
      if (!activeToken) { router.push('/login'); return; }

      const res = await fetch(`${API_URL}/api/tests/performance`, {
        headers: { Authorization: `Bearer ${activeToken}` },
      });

      if (!res.ok) throw new Error('Failed to load performance data');
      const json = await res.json();
      setData(json);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPerformance(); }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto" />
          <p className="mt-3 text-gray-500 text-sm">Analyzing your performance...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => router.back()} className="gap-1">
              <ArrowLeft className="w-4 h-4" /> Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Your Performance</h1>
              <p className="text-sm text-gray-500">Topic-wise analysis and weak areas</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={fetchPerformance} className="gap-1">
            <RefreshCw className="w-4 h-4" /> Refresh
          </Button>
        </div>

        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="pt-4 text-red-600 text-sm">{error}</CardContent>
          </Card>
        )}

        {(!data || data.topicPerformance.length === 0) ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700">No data yet</h3>
              <p className="text-gray-500 mt-2 mb-6">Take a few tests to see your topic-wise performance here.</p>
              <Button onClick={() => router.push('/')} className="bg-indigo-600 hover:bg-indigo-700">
                Start a Test
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">

            {/* Weak Topics — most important */}
            {data.weakTopics.length > 0 && (
              <Card className="border-red-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-700">
                    <TrendingDown className="w-5 h-5" />
                    Weak Areas — Focus Here
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {data.weakTopics.map(topic => (
                      <div key={topic.topic} className="flex items-center justify-between gap-4 p-3 bg-red-50 rounded-lg">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">{topic.topic}</p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {topic.testsAttempted} test{topic.testsAttempted !== 1 ? 's' : ''} · {topic.totalQuestions} questions
                          </p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <ScoreBadge score={topic.averageScore} />
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs border-red-300 text-red-700 hover:bg-red-100"
                            onClick={() => router.push(`/?topic=${encodeURIComponent(topic.topic)}`)}
                          >
                            Practice
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Strong Topics */}
            {data.strongTopics.length > 0 && (
              <Card className="border-green-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-700">
                    <TrendingUp className="w-5 h-5" />
                    Strong Areas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {data.strongTopics.map(topic => (
                      <div key={topic.topic} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <p className="font-medium text-gray-900 text-sm truncate flex-1">{topic.topic}</p>
                        <ScoreBadge score={topic.averageScore} />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Full topic breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <BookOpen className="w-4 h-4 text-indigo-600" />
                  All Topics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-gray-500">
                        <th className="pb-3 pr-4 font-medium">Topic</th>
                        <th className="pb-3 pr-4 font-medium text-right">Tests</th>
                        <th className="pb-3 pr-4 font-medium text-right">Questions</th>
                        <th className="pb-3 font-medium text-right">Score</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {data.topicPerformance.map(topic => (
                        <tr key={topic.topic} className="hover:bg-gray-50">
                          <td className="py-3 pr-4">
                            <div className="flex items-center gap-2">
                              <div
                                className="w-2 h-2 rounded-full shrink-0"
                                style={{
                                  backgroundColor:
                                    topic.averageScore >= 70 ? '#22c55e' :
                                    topic.averageScore >= 50 ? '#eab308' : '#ef4444',
                                }}
                              />
                              <span className="font-medium text-gray-900">{topic.topic}</span>
                            </div>
                          </td>
                          <td className="py-3 pr-4 text-right text-gray-600">{topic.testsAttempted}</td>
                          <td className="py-3 pr-4 text-right text-gray-600">{topic.totalQuestions}</td>
                          <td className="py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full"
                                  style={{
                                    width: `${topic.averageScore}%`,
                                    backgroundColor:
                                      topic.averageScore >= 70 ? '#22c55e' :
                                      topic.averageScore >= 50 ? '#eab308' : '#ef4444',
                                  }}
                                />
                              </div>
                              <ScoreBadge score={topic.averageScore} />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

          </div>
        )}
      </div>
    </div>
  );
}
