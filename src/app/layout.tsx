import type { Metadata } from 'next';
import { Inter } from 'next/font/google'; // ✅ 用 Inter 字體
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { StateProvider } from '@/lib/state-context';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Design Genie - Interior Design Assistant',
  description: 'Get personalized interior design recommendations',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased`}>
        <StateProvider>
          {children}
          <Toaster />
        </StateProvider>
      </body>
    </html>
  );
}
