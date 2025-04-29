import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/auth'; // Aseguramos la importación correcta

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Clamaco',
  description: 'Plataforma de gestión para clientes',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}