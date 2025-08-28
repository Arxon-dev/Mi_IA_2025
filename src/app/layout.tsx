import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { Toaster } from 'react-hot-toast';
import { StoreProvider } from '@/redux/StoreProvider';
import '@/lib/init'; // Inicializar base de datos

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Generador GIFT',
  description: 'Generador de preguntas tipo test en formato GIFT',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning className="bg-background" style={{ backgroundColor: 'hsl(var(--background))' }}>
      <body className={`${inter.className} bg-background text-foreground`} suppressHydrationWarning>
        <StoreProvider>
          <ThemeProvider>
            <div className="min-h-screen bg-background">
              <Header />
              <div className="flex h-[calc(100vh-64px)] pt-16">
                <Sidebar />
                <main className="flex-1 w-full backdrop-blur-md flex flex-col overflow-auto">
                  {children}
                </main>
              </div>
            </div>
          </ThemeProvider>
        </StoreProvider>
        <Toaster position="top-right" />
      </body>
    </html>
  );
} 