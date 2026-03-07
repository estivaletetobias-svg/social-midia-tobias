import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "AI Content Engine | Tobias Estivalete",
    description: "Automated editorial operating system for social media.",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className="h-full bg-white">
            <body className={`${inter.className} h-full`}>
                <div className="flex h-full min-h-screen">
                    <Sidebar />
                    <main className="flex-1 overflow-y-auto bg-gray-50 pt-16 lg:pt-0">
                        <div className="p-4 sm:p-6 lg:p-8">
                            {children}
                        </div>
                    </main>
                </div>
            </body>
        </html>
    );
}
