"use client"
import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'

export function ExamSetup({ onStart }: { onStart: (opts: { subject: string; topic: string; count: number }) => void }) {
  const [exam, setExam] = useState('UPSC')
  const [topic, setTopic] = useState('Modern Indian History')
  const [count, setCount] = useState(20)

  return (
    <Card className="max-w-3xl mx-auto p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4">Create a Test</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <Label>Exam</Label>
          <select value={exam} onChange={(e) => setExam(e.target.value)} className="w-full p-2 border rounded">
            <option>UPSC</option>
            <option>KPSC</option>
            <option>TNPSC</option>
            <option>SSC CGL</option>
          </select>
        </div>

        <div>
          <Label>Topic / Chapter</Label>
          <input value={topic} onChange={(e) => setTopic(e.target.value)} className="w-full p-2 border rounded" />
        </div>

        <div>
          <Label>Number of Questions</Label>
          <input type="number" min={5} max={200} value={count} onChange={(e) => setCount(parseInt(e.target.value || '20'))} className="w-full p-2 border rounded" />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button onClick={() => onStart({ subject: exam, topic, count })}>Generate Questions</Button>
        <div className="text-sm text-gray-600">You will receive AI-generated questions. Payment will be required to start a timed test (coming soon).</div>
      </div>
    </Card>
  )
}
