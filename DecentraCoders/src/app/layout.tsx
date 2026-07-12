import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/Providers';

export const metadata: Metadata = {
  title: 'LaunchNest — Powered by Cardano',
  description: 'LaunchNest connects students with mentors, developers and startup resources while Cardano provides tamper-resistant proof of idea submission.',
  keywords: ['Cardano', 'Startup', 'Student ecosystem', 'Blockchain proof', 'IP protection', 'Mesh SDK', 'Aiken'],
  authors: [{ name: 'DecentraCoders' }],
  viewport: 'width=device-width, initial-scale=1',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-background text-gray-100 min-h-screen">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
