import type { Metadata } from "next";
import { Inter, Space_Grotesk, Libre_Baskerville } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { Providers } from "@/components/Providers";

const inter = Inter({ subsets: ["latin"], variable: '--font-inter' });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: '--font-space' });
const libreBaskerville = Libre_Baskerville({ weight: ['400', '700'], subsets: ["latin"], variable: '--font-baskerville' });

export const metadata: Metadata = {
    title: "STELAR | The Social Architect System",
    description: "Personal Social Midia by Tobias Estivalete",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className={`h-full antialiased ${inter.variable} ${spaceGrotesk.variable} ${libreBaskerville.variable}`}>
            <body className="h-full bg-transparent font-sans">
                <Providers>
                    <div className="flex h-full min-h-screen">
                        <Sidebar />
                        <main className="flex-1 overflow-y-auto pt-16 lg:pt-0">
                            <div className="p-4 sm:p-6 lg:p-10 lg:pl-0 max-w-8xl mx-auto w-full">
                                {children}
                            </div>
                        </main>
                    </div>
                </Providers>
            </body>
        </html>
    );
}
