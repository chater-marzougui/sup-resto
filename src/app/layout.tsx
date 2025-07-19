import { TRPCProvider } from '@/components/providers/trpc-provider';
import { AuthProvider } from '@/components/auth/use-auth';
import { Navbar } from '@/components/elements/navBar';

import './globals.css';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'SUP-RESTO - Smart Meal Ticketing System',
  description: 'Digital meal ticketing system for university canteens',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <TRPCProvider>
          <AuthProvider>
            <div className="min-h-screen bg-gray-50">
              <Navbar />
              {children}
            </div>
          </AuthProvider>
        </TRPCProvider>
      </body>
    </html>
  );
}