"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Home,
    Calendar,
    BookOpen,
    PenTool,
    Image as ImageIcon,
    Settings,
    BarChart2,
    PlusCircle,
    Zap
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

const navigation = [
    { name: "Overview", href: "/dashboard", icon: Home },
    { name: "Editorial Calendar", href: "/dashboard/calendar", icon: Calendar },
    { name: "Ideas Library", href: "/dashboard/ideas", icon: Zap },
    { name: "Content Pipeline", href: "/dashboard/content", icon: PenTool },
    { name: "Visual Assets", href: "/dashboard/assets", icon: ImageIcon },
    { name: "Knowledge Base", href: "/dashboard/knowledge", icon: BookOpen },
    { name: "Automations", href: "/dashboard/automations", icon: Zap },
    { name: "Analytics", href: "/dashboard/analytics", icon: BarChart2 },
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <div className="hidden lg:flex lg:w-72 lg:flex-col lg:relative p-6">
            <div className="flex flex-col flex-1 glass-panel rounded-3xl h-[calc(100vh-48px)] sticky top-6 overflow-hidden">
                <div className="flex items-center h-20 flex-shrink-0 px-8 border-b border-white/40">
                    <span className="text-xl font-black text-gray-900 tracking-tighter">
                        AI Content<span className="text-primary-500">.</span>Engine
                    </span>
                </div>
                <div className="flex-1 flex flex-col overflow-y-auto no-scrollbar">
                    <nav className="flex-1 px-4 py-8 space-y-2">
                        {navigation.map((item) => {
                            const active = pathname === item.href;
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={cn(
                                        active
                                            ? "bg-white/60 text-primary-700 shadow-sm border border-white/50"
                                            : "text-gray-500 hover:bg-white/40 hover:text-gray-900 border border-transparent",
                                        "group flex items-center px-4 py-3.5 text-sm font-bold rounded-2xl transition-all duration-300"
                                    )}
                                >
                                    <item.icon
                                        className={cn(
                                            active ? "text-primary-700" : "text-gray-400 group-hover:text-gray-500",
                                            "mr-3 flex-shrink-0 h-5 w-5"
                                        )}
                                        aria-hidden="true"
                                    />
                                    {item.name}
                                </Link>
                            );
                        })}
                    </nav>
                </div>
                <div className="flex-shrink-0 flex border-t border-white/40 p-5 bg-white/20">
                    <div className="flex-shrink-0 w-full group block">
                        <div className="flex items-center group cursor-pointer hover:bg-white/40 p-2 rounded-2xl transition-all">
                            <div>
                                <img
                                    className="inline-block h-10 w-10 rounded-full border-2 border-white shadow-sm"
                                    src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                                    alt=""
                                />
                            </div>
                            <div className="ml-3">
                                <p className="text-sm font-black text-gray-900">
                                    Tobias Estivalete
                                </p>
                                <p className="text-xs font-bold text-primary-600/70 tracking-wide uppercase">
                                    Administrator
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
