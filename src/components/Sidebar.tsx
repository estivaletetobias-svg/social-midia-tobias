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
        <div className="hidden lg:flex lg:w-72 lg:flex-col lg:fixed lg:inset-y-0 bg-white border-r border-gray-200">
            <div className="flex flex-col flex-1 min-h-0">
                <div className="flex items-center h-16 flex-shrink-0 px-6 border-b border-gray-100">
                    <span className="text-xl font-bold text-primary-600 tracking-tight">AI Content Engine</span>
                </div>
                <div className="flex-1 flex flex-col overflow-y-auto">
                    <nav className="flex-1 px-4 py-6 space-y-1">
                        {navigation.map((item) => {
                            const active = pathname === item.href;
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={cn(
                                        active
                                            ? "bg-primary-50 text-primary-700"
                                            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                                        "group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200"
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
                <div className="flex-shrink-0 flex border-t border-gray-100 p-4">
                    <div className="flex-shrink-0 w-full group block">
                        <div className="flex items-center group">
                            <div>
                                <img
                                    className="inline-block h-9 w-9 rounded-full ring-2 ring-white"
                                    src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                                    alt=""
                                />
                            </div>
                            <div className="ml-3">
                                <p className="text-sm font-semibold text-gray-700 group-hover:text-gray-900">
                                    Tobias Estivalete
                                </p>
                                <p className="text-xs font-medium text-gray-400 group-hover:text-gray-500">
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
