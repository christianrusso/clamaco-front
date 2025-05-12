'use client';

import { Suspense } from 'react';
import CambiarPasswordPage from '@/components/CambiarPasswordPage';

export default function CambiarPassword() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#fdf8f1] flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#D9862A]"></div>
    </div>}>
      <CambiarPasswordPage />
    </Suspense>
  );
}

// Evitar el prerenderizado estático
export const dynamic = 'force-dynamic';