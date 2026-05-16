"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CalendarIcon, Copy, Video } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DatePicker } from '@/components/common/date-picker';
import { TimePicker } from '@/components/common/time-picker';

export default function NewMeetingPage() {
  const router = useRouter();
  const [meetingCode, setMeetingCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [meetingTitle, setMeetingTitle] = useState('');

  const generateMeetingCode = () => {
    // Generate a random 10-character alphanumeric code
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 10; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    setMeetingCode(result);
    return result;
  };

  const startInstantMeeting = () => {
    const code = generateMeetingCode();
    router.push(`/meeting/${code}`);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(meetingCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const scheduleMeeting = (e: React.FormEvent) => {
    e.preventDefault();
    const code = generateMeetingCode();
    // In a real app, you would save this to a database
    alert(`Meeting "${meetingTitle}" scheduled with code: ${code}`);
  };

  return (
    <div className="container max-w-4xl py-12">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">New Meeting</h1>
          <p className="text-muted-foreground">Create an instant meeting or schedule for later</p>
        </div>
        <Link href="/">
          <Button variant="outline">Back to Home</Button>
        </Link>
      </div>

      <Tabs defaultValue="instant" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="instant">Instant Meeting</TabsTrigger>
          <TabsTrigger value="schedule">Schedule Meeting</TabsTrigger>
        </TabsList>
        <TabsContent value="instant">
          <Card>
            <CardHeader>
              <CardTitle>Start an Instant Meeting</CardTitle>
              <CardDescription>
                Create a meeting and share the invite code with participants
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Button onClick={startInstantMeeting} className="gap-2">
                  <Video className="h-4 w-4" />
                  Start Meeting Now
                </Button>
                <p className="text-sm text-muted-foreground">
                  You'll get a shareable link after starting
                </p>
              </div>

              {meetingCode && (
                <div className="mt-6 rounded-lg border p-4">
                  <div className="mb-2 text-sm font-medium">Your meeting code:</div>
                  <div className="flex items-center gap-2">
                    <Input value={meetingCode} readOnly className="font-mono" />
                    <Button variant="outline" size="icon" onClick={copyToClipboard}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  {copied && <p className="mt-2 text-xs text-emerald-500">Copied to clipboard!</p>}
                  <div className="mt-4">
                    <Link href={`/meeting/${meetingCode}`}>
                      <Button variant="link" className="p-0">
                        Join this meeting
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="schedule">
          <Card>
            <CardHeader>
              <CardTitle>Schedule a Meeting</CardTitle>
              <CardDescription>Plan ahead and add the meeting to your calendar</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={scheduleMeeting} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Meeting Title</Label>
                  <Input
                    id="title"
                    placeholder="Weekly Team Sync"
                    value={meetingTitle}
                    onChange={(e) => setMeetingTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <DatePicker />
                  </div>
                  <div className="space-y-2">
                    <Label>Time</Label>
                    <TimePicker />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <textarea
                    id="description"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Meeting agenda and notes"
                    rows={3}
                  />
                </div>

                <Button type="submit" className="gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  Schedule Meeting
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
