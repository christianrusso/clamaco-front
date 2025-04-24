'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  
  useEffect(() => {
    // Redireccionar a Obras en lugar de login
    const token = localStorage.getItem('jwt');
    if (token) {
      router.push('/obras');
    } else {
      router.push('/login');
    }
  }, [router]);
  
  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );
}