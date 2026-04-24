import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ClockMate | Enterprise Workforce Management & Automated Payroll",
  description: "Revolutionize your team management with geofenced attendance tracking, automated fortnightly payroll, and professional payslip generation. The high-performance solution for modern companies.",
  keywords: ["Workforce Management", "Attendance Tracking", "Payroll Automation", "Geofencing", "Enterprise Payroll", "ClockMate", "Payslip Generator"],
  manifest: "/manifest.json",
  icons: {
    icon: '/a.png',
  },
  themeColor: "#4f46e5",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0",
  openGraph: {
    type: 'website',
    locale: 'en_AU',
    url: 'https://clockmate.com.au',
    siteName: 'ClockMate',
    title: 'ClockMate | Workforce Management Reimagined',
    description: 'Geofenced attendance and automated payroll for modern enterprise teams.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ClockMate | Workforce Management',
    description: 'Precision time tracking and automated payroll sequences.',
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-[#F8FAFC]`}>{children}</body>
    </html>
  );
}
