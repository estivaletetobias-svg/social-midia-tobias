"use client";

import { useState, useEffect } from "react";
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
    Plus,
    Zap,
    BrainCircuit
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

const navigation = [
    { name: "Visão Geral", href: "/dashboard", icon: Home },
    { name: "Calendário Editorial", href: "/dashboard/calendar", icon: Calendar },
    { name: "Biblioteca de Ideias", href: "/dashboard/ideas", icon: Zap },
    { name: "Esteira de Produção", href: "/dashboard/content", icon: PenTool },
    { name: "Ativos Visuais", href: "/dashboard/assets", icon: ImageIcon },
    { name: "DNA da Marca", href: "/dashboard/brand", icon: BrainCircuit },
    { name: "Base de Conhecimento", href: "/dashboard/knowledge", icon: BookOpen },
    { name: "Automações", href: "/dashboard/automations", icon: Zap },
    { name: "Métricas", href: "/dashboard/analytics", icon: BarChart2 },
];

export function Sidebar() {
    const pathname = usePathname();
    const defaultAvatar = "https://images.unsplash.com/photo-1594381898411-846e7d193883?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80";
    const [profileImg, setProfileImg] = useState<string>(defaultAvatar);

    useEffect(() => {
        const saved = localStorage.getItem('user_profile_img');
        if (saved) setProfileImg(saved);

        // Sincronizar com o banco de dados para persistência real em outros dispositivos
        fetch('/api/brand/avatar')
            .then(res => res.json())
            .then(data => {
                if (data.success && data.avatarUrl) {
                    setProfileImg(data.avatarUrl);
                    localStorage.setItem('user_profile_img', data.avatarUrl);
                }
            });
    }, []);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64 = reader.result as string;
            setProfileImg(base64);
            localStorage.setItem('user_profile_img', base64);

            // Persistir no banco de dados
            try {
                await fetch('/api/brand/avatar', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ avatarUrl: base64 })
                });
            } catch (err) {
                console.error("Falha ao salvar avatar no banco:", err);
            }
        };
        reader.readAsDataURL(file);
    };

    return (
        <div className="hidden lg:flex lg:w-72 lg:flex-col lg:relative p-6">
            <div className="flex flex-col flex-1 glass-panel rounded-3xl h-[calc(100vh-48px)] sticky top-6 overflow-hidden border-white/20 shadow-none">
                <div className="flex flex-col flex-shrink-0 px-8 py-10 border-b border-black/5">
                    <span className="text-3xl font-black text-gray-900 tracking-tighter mb-1 font-[family-name:var(--font-space)] uppercase">
                        STELAR
                    </span>
                    <span className="text-[10px] font-medium text-gray-500 font-serif italic tracking-widest uppercase">
                        The Social Architect System
                    </span>
                    <span className="text-[10px] font-black text-gray-800/80 mt-3 uppercase tracking-[0.25em] border-t border-black/5 pt-3 w-fit">
                        by Tobias Estivalete
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
                        <label className="flex items-center group cursor-pointer hover:bg-white/40 p-2 rounded-2xl transition-all">
                            <input type="file" className="hidden" accept="image/*" onChange={handleUpload} />
                            <div className="relative">
                                <img
                                    className="inline-block h-14 w-14 rounded-full border-2 border-white shadow-sm object-cover"
                                    src={profileImg}
                                    alt="Tobias Estivalete"
                                />
                                <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Plus className="h-6 w-6 text-white" />
                                </div>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm font-black text-gray-900">
                                    Tobias Estivalete
                                </p>
                                <p className="text-xs font-bold text-primary-600/70 tracking-wide uppercase">
                                    Administrador
                                </p>
                            </div>
                        </label>
                    </div>
                </div>
            </div>
        </div>
    );
}
