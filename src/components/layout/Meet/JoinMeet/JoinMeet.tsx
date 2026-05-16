"use client";

import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function JoinMeetingPage() {
  const router = useRouter();
  const [meetingCode, setMeetingCode] = useState('');
  const [name, setName] = useState('');

  const handleJoinMeeting = (e: React.FormEvent) => {
    e.preventDefault();
    if (meetingCode.trim()) {
      router.push(`/meeting/${meetingCode}?name=${encodeURIComponent(name)}`);
    }
  };

  return (
    <div className="container flex max-w-md flex-col items-center justify-center py-12">
      <Link
        href="/"
        className="mb-8 flex items-center gap-2 self-start text-sm text-muted-foreground hover:text-foreground cursor-pointer"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Home
      </Link>

      <Card className="w-full">
        <CardHeader>
          <CardTitle>Join a Meeting</CardTitle>
          <CardDescription>Enter the meeting code to join an existing call</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleJoinMeeting} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Your Name</Label>
              <Input
                id="name"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="code">Meeting Code</Label>
              <Input
                id="code"
                placeholder="Enter meeting code"
                value={meetingCode}
                onChange={(e) => setMeetingCode(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full">
              Join Meeting
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
