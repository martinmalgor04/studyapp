import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
// Validar variables de entorno al inicio de la app (falla con error descriptivo si faltan)
import '@/lib/env';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'StudyApp - Sistema de Repetición Espaciada',
  description: 'Organiza tu estudio con repetición espaciada automatizada',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
