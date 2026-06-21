import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Arch Linux Pro Max Dashboard',
  description: 'Web-based system telemetry dashboard and intelligent file manager for Arch Linux. Deployable to Vercel and fully self-hostable.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body>{children}</body>
    </html>
  );
}
