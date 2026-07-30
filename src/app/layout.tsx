import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'TukTuk Meter & GPS Navigation - Mobile Landscape HUD',
  description: '1:1 Scale Google Map & Real-time Live TukTuk Fare Meter Dashboard with AI Antigravity suggestions',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1.0,
  maximumScale: 1.0,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark h-full">
      <body className="h-full bg-[#07090e] text-slate-100 antialiased overflow-hidden selection:bg-cyan-500 selection:text-slate-950">
        {children}
      </body>
    </html>
  );
}
