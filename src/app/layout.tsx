import type { Metadata } from "next";
import { Inter, Space_Grotesk, Libre_Baskerville } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

const inter = Inter({ subsets: ["latin"], variable: '--font-inter' });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: '--font-space' });
const libreBaskerville = Libre_Baskerville({ weight: ['400', '700'], subsets: ["latin"], variable: '--font-baskerville' });

export const metadata: Metadata = {
    title: "STELAR | The Social Architect System",
    description: "Personal Social Midia by Tobias Estivalete",
    icons: {
        icon: "/icon.png",
        apple: "/apple-icon.png",
    },
    manifest: "/manifest.json",
    themeColor: "#000000",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className={`h-full antialiased ${inter.variable} ${spaceGrotesk.variable} ${libreBaskerville.variable}`}>
            <body className="h-full bg-[#EAEAE5] font-sans">
                <Providers>
                    {children}
                </Providers>
            </body>
        </html>
    );
}
