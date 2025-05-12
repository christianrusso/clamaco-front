'use client';

import CambiarPasswordPage from '@/components/CambiarPasswordPage';

// Evitar el prerenderizado estático
export const dynamic = 'force-dynamic';
// Alternativa: export const runtime = 'edge';

export default function CambiarPassword() {
  return <CambiarPasswordPage />;
}