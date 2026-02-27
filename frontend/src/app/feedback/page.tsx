"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/label'
import { ArrowLeft, Send, CheckCircle, XCircle, Loader2, MessageSquare, Star } from 'lucide-react'
import Link from 'next/link'

export default function FeedbackPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    rating: 0
  })
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleRating = (rating: number) => {
    setFormData(prev => ({ ...prev, rating }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')
    setErrorMessage('')

    try {
      // Create feedback email content
      const feedbackContent = `
New Feedback Received:

Name: ${formData.name}
Email: ${formData.email}
Rating: ${formData.rating}/5 stars
Subject: ${formData.subject}

Message:
${formData.message}

---
Sent from EduTest AI Feedback Form
Timestamp: ${new Date().toLocaleString()}
      `.trim()

      // For now, we'll simulate sending feedback
      // In production, this would send to your email service
      console.log('Feedback to send:', feedbackContent)

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Here you would integrate with an email service like:
      // - SendGrid
      // - Mailgun
      // - EmailJS
      // - Or your backend API

      setStatus('success')
      setFormData({ name: '', email: '', subject: '', message: '', rating: 0 })
    } catch (error) {
      setStatus('error')
      setErrorMessage('Failed to send feedback. Please try again.')
    }
  }

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

        {/* Title */}
        <Card className="mb-8">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl flex items-center justify-center gap-2">
              <MessageSquare className="w-8 h-8 text-blue-600" />
              Share Your Feedback
            </CardTitle>
            <p className="text-gray-600 mt-2">
              Help us improve EduTest AI by sharing your thoughts and suggestions
            </p>
          </CardHeader>
        </Card>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Feedback Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Your Feedback Matters</CardTitle>
              </CardHeader>
              <CardContent>
                {status === 'success' ? (
                  <div className="text-center py-8">
                    <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-green-700 mb-2">Thank You!</h3>
                    <p className="text-gray-600 mb-4">
                      Your feedback has been sent successfully. We appreciate you taking the time to help us improve EduTest AI.
                    </p>
                    <Link href="/">
                      <Button>Back to Home</Button>
                    </Link>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Rating */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        How would you rate your experience? (Optional)
                      </label>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => handleRating(star)}
                            className="focus:outline-none"
                          >
                            <Star
                              className={`w-6 h-6 ${
                                star <= formData.rating
                                  ? 'text-yellow-400 fill-current'
                                  : 'text-gray-300'
                              }`}
                            />
                          </button>
                        ))}
                        <span className="ml-2 text-sm text-gray-500">
                          {formData.rating > 0 && `${formData.rating} star${formData.rating > 1 ? 's' : ''}`}
                        </span>
                      </div>
                    </div>

                    {/* Name */}
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                        Name *
                      </label>
                      <Input
                        id="name"
                        name="name"
                        type="text"
                        required
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Your full name"
                        className="w-full"
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                        Email *
                      </label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="your.email@example.com"
                        className="w-full"
                      />
                    </div>

                    {/* Subject */}
                    <div>
                      <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                        Subject *
                      </label>
                      <Input
                        id="subject"
                        name="subject"
                        type="text"
                        required
                        value={formData.subject}
                        onChange={handleInputChange}
                        placeholder="Brief description of your feedback"
                        className="w-full"
                      />
                    </div>

                    {/* Message */}
                    <div>
                      <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                        Message *
                      </label>
                      <textarea
                        id="message"
                        name="message"
                        required
                        value={formData.message}
                        onChange={handleInputChange}
                        placeholder="Please share your detailed feedback, suggestions, or report any issues you've encountered..."
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[120px] resize-vertical"
                        rows={5}
                      />
                    </div>

                    {/* Error Message */}
                    {status === 'error' && (
                      <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-md">
                        <XCircle className="w-5 h-5" />
                        <span>{errorMessage}</span>
                      </div>
                    )}

                    {/* Submit Button */}
                    <Button
                      type="submit"
                      disabled={status === 'loading'}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                      {status === 'loading' ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Sending Feedback...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Send Feedback
                        </>
                      )}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-semibold text-sm">📧</span>
                  </div>
                  <div>
                    <p className="font-medium">Email</p>
                    <p className="text-sm text-gray-600">9901356445@airtel.com</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 font-semibold text-sm">📱</span>
                  </div>
                  <div>
                    <p className="font-medium">Phone</p>
                    <p className="text-sm text-gray-600">+91 9901356445</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-purple-600 font-semibold text-sm">📍</span>
                  </div>
                  <div>
                    <p className="font-medium">Location</p>
                    <p className="text-sm text-gray-600">Karnataka, India</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Response Time */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Response Time</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm">
                  We typically respond to feedback within 24-48 hours. Your input helps us improve EduTest AI for everyone!
                </p>
              </CardContent>
            </Card>

            {/* What We Do With Feedback */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">How We Use Your Feedback</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• Improve question quality and accuracy</li>
                  <li>• Add new features and exam types</li>
                  <li>• Fix bugs and technical issues</li>
                  <li>• Enhance user experience</li>
                  <li>• Develop new learning tools</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
