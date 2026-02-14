import "./globals.css";
import { Inter } from "next/font/google";
import ClientLayout from "./client-layout";

const inter = Inter({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-inter",
  display: "swap",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans h-screen bg-gray-50 overflow-hidden antialiased">
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
