import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BookOpen, Target, Users, Award, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>

        {/* Hero Section */}
        <Card className="mb-8">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl mb-4">About EduTest AI</CardTitle>
            <p className="text-lg text-gray-600">
              Revolutionizing exam preparation with AI-powered personalized testing
            </p>
          </CardHeader>
        </Card>

        {/* Mission */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-6 h-6 text-blue-600" />
              Our Mission
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 leading-relaxed">
              EduTest AI is dedicated to transforming the way students prepare for competitive examinations.
              We believe that personalized, adaptive learning powered by artificial intelligence can help
              students achieve their academic goals more effectively and efficiently.
            </p>
          </CardContent>
        </Card>

        {/* Features */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-green-600" />
                Smart Question Generation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">
                Our AI generates high-quality, exam-relevant questions tailored to your specific needs,
                covering topics from UPSC, SSC, Banking, and other competitive exams.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-600" />
                Personalized Learning
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">
                Get customized test experiences based on your performance, learning style, and target exam.
                Our system adapts to help you focus on areas that need improvement.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5 text-orange-600" />
                Real-time Feedback
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">
                Receive instant explanations and detailed feedback on your answers, helping you understand
                concepts better and learn from your mistakes.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-red-600" />
                Current Affairs Integration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">
                Stay updated with the latest current affairs through our integrated web search functionality,
                ensuring your preparation includes the most recent developments.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* What Makes Us Different */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>What Makes EduTest AI Different?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-lg mb-2">AI-Powered Generation</h4>
                <p className="text-gray-700">
                  Unlike traditional question banks, our AI creates fresh, relevant questions
                  that adapt to current exam patterns and recent developments.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-lg mb-2">Comprehensive Coverage</h4>
                <p className="text-gray-700">
                  From ancient history to current affairs, we cover all major exam topics
                  with questions that match the difficulty level of actual exams.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-lg mb-2">Instant Explanations</h4>
                <p className="text-gray-700">
                  Get detailed explanations for every answer, helping you understand not just
                  what the correct answer is, but why it's correct.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-lg mb-2">Progress Tracking</h4>
                <p className="text-gray-700">
                  Monitor your performance across different topics and track your improvement
                  over time with detailed analytics.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Call to Action */}
        <Card>
          <CardContent className="text-center py-8">
            <h3 className="text-2xl font-semibold mb-4">Ready to Transform Your Exam Preparation?</h3>
            <p className="text-gray-600 mb-6">
              Join thousands of students who are already using EduTest AI to achieve their goals.
            </p>
            <Link href="/">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                Start Your Test Now
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
