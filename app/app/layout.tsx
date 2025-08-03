import '@rainbow-me/rainbowkit/styles.css';
import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

import { ThemeProvider } from '../components/theme-provider';
import { Navbar } from '../components/navbar';
import { Footer } from '../components/footer';
import { Providers } from './components/wagmi-config-provider'; // ✅ Rename to match your component
import { ProjectRefreshProvider } from '@/context/ProjectRefreshContext';
import { FarcasterConnectionProvider } from '@/context/FarcasterConnectionContext';
import { ConnectionDebug } from '@/components/connection-debug';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Arrow Starter - Provide early stage support for ambitious creative projects',
  description:
    'A lightweight Kickstarter-style launchpad for ambitious creative projects—designed for early-stage support, with built-in trust and upside.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <Providers> {/* ✅ updated to match your wagmi-config-provider component */}
            <FarcasterConnectionProvider>
              <ProjectRefreshProvider>
                <Navbar />
                <main>{children}</main>
                <Footer />
                <ConnectionDebug />
              </ProjectRefreshProvider>
            </FarcasterConnectionProvider>
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
