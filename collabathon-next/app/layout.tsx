import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/layout/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import { GA4 } from '@/lib/ga';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Collabathon | Student Teaming Platform',
  description: 'Match students, form hackathon teams, and collaborate with clients using Firebase-powered Collabathon.',
  metadataBase: new URL('https://collabathon.local')
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className + ' bg-slate-50 dark:bg-slate-950'}>
        <ThemeProvider>
          {children}
          <Toaster />
          <GA4 measurementId={process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID} />
        </ThemeProvider>
      </body>
    </html>
  );
}
