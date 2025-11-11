"use client"
import React, { useEffect, useState } from 'react'

export function Header({ onOpenSettings }: { onOpenSettings?: () => void }) {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      return (localStorage.getItem('theme') as 'light' | 'dark') || 'light'
    } catch (e) {
      return 'light'
    }
  })

  useEffect(() => {
    if (theme === 'dark') document.documentElement.classList.add('dark')
    else document.documentElement.classList.remove('dark')
    try { localStorage.setItem('theme', theme) } catch (e) {}
  }, [theme])

  return (
    <header className="bg-white dark:bg-gray-900 shadow-sm border-b dark:border-gray-700">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center gap-3">
            {/* Logo: place your image at /public/logo.png */}
            <img src="/logo.png" alt="EduTest AI logo" className="w-10 h-10 object-contain" />
            <div className="text-xl font-semibold text-gray-900 dark:text-gray-100">EduTest AI</div>
          </div>
          <nav className="hidden md:flex space-x-3 text-sm text-gray-600 dark:text-gray-300">
            <a href="/" className="hover:text-gray-800 dark:hover:text-gray-100">Home</a>
            <a href="/about" className="hover:text-gray-800 dark:hover:text-gray-100">About</a>
            <a href="/privacy" className="hover:text-gray-800 dark:hover:text-gray-100">Privacy</a>
            <a href="/contact" className="hover:text-gray-800 dark:hover:text-gray-100">Contact</a>
            <a href="/feedback" className="hover:text-gray-800 dark:hover:text-gray-100">Feedback</a>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <select aria-label="language" className="border rounded px-2 py-1 text-sm bg-white dark:bg-gray-800">
            <option>EN</option>
            <option>HI</option>
            <option>TA</option>
          </select>

          <button
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            className="text-sm px-3 py-1 border rounded bg-gray-100 dark:bg-gray-800"
          >
            {theme === 'light' ? 'Dark' : 'Light'}
          </button>

          <button
            onClick={onOpenSettings}
            className="text-sm px-3 py-1 border rounded bg-white dark:bg-gray-800"
          >
            Settings
          </button>
        </div>
      </div>
    </header>
  )
}
