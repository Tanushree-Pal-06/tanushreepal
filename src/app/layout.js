/**
 * DeskFlow - Support Ticket System
 * Root Layout
 *
 * Author: Tanushree Pal
 * Roll No: 0827AL231132
 * Email: tanushreepal230408@acropolis.in
 * DOB: 06/10/2005
 */

import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata = {
  title: "DeskFlow — Support Ticket System",
  description:
    "DeskFlow: A modern Kanban-style support ticket management system. Built by Tanushree Pal (0827AL231132).",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
