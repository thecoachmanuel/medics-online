import { Suspense } from 'react';
import Component from "@/components/layout/Meet/Meeting/[id]/page";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading meeting...</div>}>
      <Component />
    </Suspense>
  );
}
