import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "Motor de Conteúdo AI | Tobias Estivalete",
    description: "Sistema operacional editorial automatizado para redes sociais.",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className="h-full antialiased">
            <body className={`${inter.className} h-full bg-transparent`}>
                <div className="flex h-full min-h-screen">
                    <Sidebar />
                    <main className="flex-1 overflow-y-auto pt-16 lg:pt-0">
                        <div className="p-4 sm:p-6 lg:p-10 lg:pl-0 max-w-8xl mx-auto w-full">
                            {children}
                        </div>
                    </main>
                </div>
            </body>
        </html>
    );
}
