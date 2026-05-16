import { Suspense } from 'react';
import Component from "@/components/layout/Patient/Appointment";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Component />
    </Suspense>
  );
}
