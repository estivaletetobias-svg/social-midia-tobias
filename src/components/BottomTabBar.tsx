"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Home,
    Zap,
    PenTool,
    BrainCircuit,
    BarChart2,
    BookOpen
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

const tabs = [
    { name: "Visão", href: "/dashboard", icon: Home },
    { name: "Base", href: "/dashboard/knowledge", icon: BookOpen },
    { name: "Ideias", href: "/dashboard/ideas", icon: Zap },
    { name: "Esteira", href: "/dashboard/content", icon: PenTool },
    { name: "DNA", href: "/dashboard/brand", icon: BrainCircuit },
    { name: "Métricas", href: "/dashboard/analytics", icon: BarChart2 },
];

export function BottomTabBar() {
    const pathname = usePathname();

    return (
        <nav
            className="lg:hidden fixed bottom-0 left-0 right-0 z-50"
            style={{
                background: "rgba(255,255,255,0.92)",
                backdropFilter: "saturate(180%) blur(20px)",
                WebkitBackdropFilter: "saturate(180%) blur(20px)",
                borderTop: "1px solid rgba(0,0,0,0.08)",
                paddingBottom: "env(safe-area-inset-bottom, 0px)",
            }}
        >
            <div className="flex items-stretch justify-around h-[62px]">
                {tabs.map((tab) => {
                    // Active if exact match or starts with (for sub-routes), except dashboard root
                    const isActive =
                        tab.href === "/dashboard"
                            ? pathname === "/dashboard"
                            : pathname.startsWith(tab.href);

                    return (
                        <Link
                            key={tab.href}
                            href={tab.href}
                            className={cn(
                                "flex flex-col items-center justify-center flex-1 gap-1 min-w-0 transition-all duration-200 active:scale-95",
                                isActive ? "text-[#2B3440]" : "text-gray-400"
                            )}
                        >
                            <div className="relative">
                                <tab.icon
                                    className={cn(
                                        "h-[22px] w-[22px] transition-all duration-200",
                                        isActive
                                            ? "stroke-[2.5px]"
                                            : "stroke-[1.5px]"
                                    )}
                                />
                                {isActive && (
                                    <span
                                        className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-[3px] w-[3px] rounded-full bg-[#2B3440]"
                                    />
                                )}
                            </div>
                            <span
                                className={cn(
                                    "text-[9px] font-black uppercase tracking-[0.08em] leading-none transition-all duration-200",
                                    isActive ? "opacity-100" : "opacity-60"
                                )}
                            >
                                {tab.name}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
