import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'FOR THE KIDS - Transparency Dashboard',
  description: 'Real-time transparency dashboard for FOR THE KIDS charitable distributions. Track every donation to verified pediatric charities on Base blockchain.',
  keywords: ['charity', 'blockchain', 'transparency', 'pediatric', 'donations', 'Base', 'crypto'],
  authors: [{ name: 'FOR THE KIDS Foundation' }],
  openGraph: {
    title: 'FOR THE KIDS - Transparency Dashboard',
    description: 'Track charitable distributions in real-time on Base blockchain',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FOR THE KIDS - Transparency Dashboard',
    description: 'Track charitable distributions in real-time on Base blockchain',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen bg-slate-50 dark:bg-slate-900`}>
        <div className="min-h-screen flex flex-col">
          {/* Header */}
          <header className="bg-white dark:bg-slate-800 shadow-sm border-b border-slate-200 dark:border-slate-700">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-ftk-primary to-ftk-secondary flex items-center justify-center">
                    <span className="text-white font-bold text-lg">FK</span>
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                      FOR THE KIDS
                    </h1>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Gospel V1.4.1 SURVIVAL MODE
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    <span className="w-2 h-2 mr-1.5 rounded-full bg-green-500 live-pulse"></span>
                    Live on Base
                  </span>
                </div>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-grow">
            {children}
          </main>

          {/* Footer */}
          <footer className="bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 mt-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  <span className="font-semibold gradient-text">&quot;Until no kid is in need&quot;</span>
                </p>
                <div className="flex items-center space-x-4 text-sm text-slate-500 dark:text-slate-400">
                  <a
                    href="https://basescan.org/address/0x9855B75061D4c841791382998f0CE8B2BCC965A4"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-ftk-primary transition-colors"
                  >
                    View Contract
                  </a>
                  <span>|</span>
                  <a
                    href="/legal"
                    className="hover:text-ftk-primary transition-colors"
                  >
                    Legal &amp; Disclaimer
                  </a>
                  <span>|</span>
                  <span>100% Transparent</span>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
