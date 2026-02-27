import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Shield, Eye, Lock, Database } from 'lucide-react'
import Link from 'next/link'

export default function PrivacyPage() {
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
              <Shield className="w-8 h-8 text-blue-600" />
              Privacy Policy
            </CardTitle>
            <p className="text-gray-600 mt-2">Last updated: December 2024</p>
          </CardHeader>
        </Card>

        {/* Introduction */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <p className="text-gray-700 leading-relaxed">
              At EduTest AI, we are committed to protecting your privacy and ensuring the security of your personal information.
              This Privacy Policy explains how we collect, use, and safeguard your data when you use our AI-powered exam preparation platform.
            </p>
          </CardContent>
        </Card>

        {/* Information We Collect */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-green-600" />
              Information We Collect
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Personal Information</h4>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                <li>Email address (for account creation and communication)</li>
                <li>Name and profile information</li>
                <li>Payment information (processed securely through third-party providers)</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Usage Data</h4>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                <li>Test performance and progress tracking</li>
                <li>Questions attempted and time spent</li>
                <li>Device and browser information</li>
                <li>IP address and location data</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* How We Use Your Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5 text-purple-600" />
              How We Use Your Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Service Provision</h4>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                <li>To provide and maintain our AI-powered testing platform</li>
                <li>To generate personalized questions and explanations</li>
                <li>To track your learning progress and provide insights</li>
                <li>To process payments and manage subscriptions</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Improvement and Analytics</h4>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                <li>To analyze usage patterns and improve our services</li>
                <li>To develop new features and enhance user experience</li>
                <li>To conduct research on learning effectiveness</li>
                <li>To provide aggregated, anonymized analytics</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Data Security */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-red-600" />
              Data Security
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 leading-relaxed mb-4">
              We implement industry-standard security measures to protect your personal information:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li><strong>Encryption:</strong> All data transmission is encrypted using SSL/TLS protocols</li>
              <li><strong>Secure Storage:</strong> Personal data is stored in encrypted databases with access controls</li>
              <li><strong>Regular Audits:</strong> We conduct regular security audits and vulnerability assessments</li>
              <li><strong>Access Control:</strong> Only authorized personnel have access to personal data</li>
              <li><strong>Data Minimization:</strong> We only collect and retain data necessary for service provision</li>
            </ul>
          </CardContent>
        </Card>

        {/* Data Sharing */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Information Sharing and Disclosure</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 leading-relaxed mb-4">
              We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li><strong>Service Providers:</strong> With trusted third-party service providers who help us operate our platform (payment processors, cloud hosting)</li>
              <li><strong>Legal Requirements:</strong> When required by law or to protect our rights and safety</li>
              <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
              <li><strong>Consent:</strong> With your explicit consent for specific purposes</li>
            </ul>
          </CardContent>
        </Card>

        {/* Your Rights */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Your Rights and Choices</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 leading-relaxed mb-4">
              You have the following rights regarding your personal information:
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2">Access and Portability</h4>
                <ul className="list-disc list-inside text-gray-700 text-sm space-y-1">
                  <li>Request a copy of your personal data</li>
                  <li>Download your data in a portable format</li>
                  <li>Access your test history and progress</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Control and Deletion</h4>
                <ul className="list-disc list-inside text-gray-700 text-sm space-y-1">
                  <li>Update or correct your information</li>
                  <li>Delete your account and associated data</li>
                  <li>Opt-out of marketing communications</li>
                  <li>Restrict processing of your data</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cookies */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Cookies and Tracking</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 leading-relaxed mb-4">
              We use cookies and similar technologies to enhance your experience:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li><strong>Essential Cookies:</strong> Required for basic platform functionality</li>
              <li><strong>Analytics Cookies:</strong> Help us understand how you use our service</li>
              <li><strong>Preference Cookies:</strong> Remember your settings and preferences</li>
              <li><strong>Marketing Cookies:</strong> Used only with your consent for personalized content</li>
            </ul>
            <p className="text-gray-700 mt-4">
              You can control cookie settings through your browser preferences.
            </p>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Contact Us</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 mb-4">
              If you have any questions about this Privacy Policy or our data practices, please contact us:
            </p>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="font-medium">EduTest AI Support</p>
              <p>Email: privacy@edutestai.com</p>
              <p>Phone: +91 9901356445</p>
              <p>Address: Karnataka, India</p>
            </div>
          </CardContent>
        </Card>

        {/* Updates */}
        <Card>
          <CardContent className="pt-6">
            <h4 className="font-semibold mb-2">Policy Updates</h4>
            <p className="text-gray-700">
              We may update this Privacy Policy from time to time. We will notify you of any material changes
              by posting the new policy on this page and updating the "Last updated" date. Your continued use
              of our service after such changes constitutes acceptance of the updated policy.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
