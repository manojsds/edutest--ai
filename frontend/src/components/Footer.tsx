import React from 'react'

export function Footer() {
  return (
    <footer className="bg-gray-50 border-t mt-12">
      <div className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <h3 className="font-semibold">EduTest AI</h3>
          <p className="text-sm text-gray-600 mt-2">AI-powered mock tests and explanations for competitive exams.</p>
        </div>

        <div>
          <h4 className="font-medium">Company</h4>
          <ul className="text-sm text-gray-600 mt-2 space-y-1">
            <li><a href="/about" className="hover:underline">About</a></li>
            <li><a href="/privacy" className="hover:underline">Privacy</a></li>
            <li><a href="/contact" className="hover:underline">Contact</a></li>
          </ul>
        </div>

        <div>
          <h4 className="font-medium">Help</h4>
          <ul className="text-sm text-gray-600 mt-2 space-y-1">
            <li><a href="/feedback" className="hover:underline">Send Feedback</a></li>
            <li><a href="/faq" className="hover:underline">FAQ</a></li>
          </ul>
        </div>
      </div>

      <div className="border-t pt-4 text-center text-sm text-gray-500">© {new Date().getFullYear()} EduTest AI. All rights reserved.</div>
    </footer>
  )
}
