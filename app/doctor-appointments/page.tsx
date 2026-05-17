"use client";
import { Suspense } from 'react';
import Component from "@/components/layout/Admin/Doctor/DoctorAppointments";

export default function Page() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    }>
      <Component />
    </Suspense>
  );
}
