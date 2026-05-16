"use client";

import Link from 'next/link';
import { CalendarIcon, Video } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function App() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="container flex h-16 items-center px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <Video className="h-6 w-6 text-emerald-500" />
            <span>MeetNow</span>
          </Link>
          <nav className="ml-auto flex gap-4">
            <Link href="/join">
              <Button variant="ghost">Join Meeting</Button>
            </Link>
            <Link href="/new">
              <Button>New Meeting</Button>
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1">
        <section className="container grid items-center gap-6 py-12 md:py-24 lg:grid-cols-2 lg:gap-12">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">
              Video meetings for everyone
            </h1>
            <p className="text-muted-foreground md:text-xl">
              Secure, easy-to-use video calls with screen sharing and calendar integration.
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Link href="/new">
                <Button size="lg" className="gap-2">
                  <Video className="h-4 w-4" />
                  New Meeting
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <Input placeholder="Enter invite code" className="max-w-[200px]" />
                <Button variant="outline" size="lg">
                  Join
                </Button>
              </div>
            </div>
          </div>
          <div className="flex justify-center">
            <div className="relative w-full max-w-[500px] overflow-hidden rounded-xl border bg-background shadow-xl">
              <div className="aspect-video bg-muted">
                <div className="grid h-full place-items-center">
                  <div className="flex flex-col items-center gap-2">
                    <Video className="h-12 w-12 text-emerald-500" />
                    <p className="text-center text-sm text-muted-foreground">
                      Start or join a meeting with a single click
                    </p>
                  </div>
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-2 p-4">
                <div className="rounded-full bg-background p-2 shadow-sm">
                  <Video className="h-5 w-5 text-emerald-500" />
                </div>
                <div className="rounded-full bg-background p-2 shadow-sm">
                  <CalendarIcon className="h-5 w-5 text-emerald-500" />
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t py-6">
        <div className="container flex flex-col items-center justify-between gap-4 px-4 text-center md:flex-row md:text-left">
          <p className="text-sm text-muted-foreground">© 2025 MeetNow. All rights reserved.</p>
          <nav className="flex gap-4 text-sm text-muted-foreground">
            <Link href="#" className="hover:underline">
              Privacy
            </Link>
            <Link href="#" className="hover:underline">
              Terms
            </Link>
            <Link href="#" className="hover:underline">
              Help
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
