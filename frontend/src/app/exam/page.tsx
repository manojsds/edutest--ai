'use client';

import { useState } from 'react';
import { useExamStore } from '@/lib/examStore';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ExamInterface } from '@/components/ExamInterface';
import { Results } from '@/components/Results';

const examTypes = ['UPSC', 'KPSC', 'TNPSC', 'Other'];
const subjects = {
  UPSC: ['History', 'Geography', 'Polity', 'Economics', 'Science'],
  KPSC: ['Karnataka History', 'Indian History', 'Geography', 'Current Affairs'],
  TNPSC: ['Tamil Nadu History', 'Indian History', 'Geography', 'Current Affairs'],
  Other: ['General Knowledge', 'Current Affairs', 'Aptitude'],
};

export default function ExamPage() {
  const [examType, setExamType] = useState('');
  const [subject, setSubject] = useState('');
  const [paymentComplete, setPaymentComplete] = useState(false);
  const { isStarted, isFinished, startExam } = useExamStore();

  const handleStartExam = async () => {
    // Initialize Razorpay payment
    try {
      const response = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const order = await response.json();
      
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: 'EduTest AI',
        description: `${examType} - ${subject} Test`,
        order_id: order.id,
        handler: function (response: any) {
          // Verify payment and start exam
          verifyPayment(response);
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error('Payment error:', error);
      alert('Failed to initialize payment. Please try again.');
    }
  };

  const verifyPayment = async (paymentResponse: any) => {
    try {
      const response = await fetch('/api/payment/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentResponse),
      });

      if (response.ok) {
        setPaymentComplete(true);
        startExam(examType, subject);
      }
    } catch (error) {
      console.error('Payment verification error:', error);
      alert('Payment verification failed. Please contact support.');
    }
  };

  if (isFinished) {
    return (
      <Results
        onNewExam={() => {
          setExamType('');
          setSubject('');
          setPaymentComplete(false);
        }}
      />
    );
  }

  if (isStarted) {
    return <ExamInterface />;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card className="p-6">
        <h1 className="text-2xl font-bold mb-6">Start New Exam</h1>

        <div className="space-y-6">
          <div>
            <Label>Select Exam Type</Label>
            <RadioGroup
              value={examType}
              onValueChange={setExamType}
              className="grid grid-cols-2 gap-4 mt-2"
            >
              {examTypes.map((type) => (
                <div key={type} className="flex items-center space-x-2">
                  <RadioGroupItem value={type} id={type} />
                  <Label htmlFor={type}>{type}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {examType && (
            <div>
              <Label>Select Subject</Label>
              <RadioGroup
                value={subject}
                onValueChange={setSubject}
                className="grid grid-cols-2 gap-4 mt-2"
              >
                {subjects[examType as keyof typeof subjects].map((sub) => (
                  <div key={sub} className="flex items-center space-x-2">
                    <RadioGroupItem value={sub} id={sub} />
                    <Label htmlFor={sub}>{sub}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          )}

          {examType && subject && (
            <Button
              onClick={handleStartExam}
              className="w-full"
              size="lg"
            >
              Pay ₹10 and Start Exam
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}