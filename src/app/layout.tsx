import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Intervue — AI Behavioral Interview Practice",
  description:
    "Practice behavioral interviews with an AI that thinks like a senior hiring manager. Get detailed feedback, track growth, and land your next role.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
