"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
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
    BrainCircuit,
    LogOut,
    Users,
    Search, LayoutTemplate, MessageSquare, FastForward, Play, Activity, Sparkles, TrendingUp, FileText
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

const navigation = [
    { name: "DNA da Marca", href: "/dashboard/brand", icon: BrainCircuit },
    { name: "Base de Conhecimento", href: "/dashboard/knowledge", icon: BookOpen },
    { name: "Biblioteca de Ideias", href: "/dashboard/ideas", icon: Zap },
    { name: "Esteira de Produção", href: "/dashboard/content", icon: PenTool },
    { name: "Calendário Editorial", href: "/dashboard/calendar", icon: Calendar },
    { name: "Visão Geral", href: "/dashboard", icon: Home },
    { name: "Métricas", href: "/dashboard/analytics", icon: BarChart2 },
    { name: "Central de Ajuda", href: "/dashboard/help", icon: Settings },
    { name: "Gestão de Clientes", href: "/dashboard/clients", icon: Users },
];

interface SidebarProps {
    isMobile?: boolean;
    onClose?: () => void;
}

export function Sidebar({ isMobile, onClose }: SidebarProps) {
    const { data: session } = useSession();
    const pathname = usePathname();
    const [brands, setBrands] = useState<any[]>([]);
    const [activeBrandId, setActiveBrandId] = useState<string>("");
    const [profileImg, setProfileImg] = useState<string>("https://ui-avatars.com/api/?name=User&background=f3f4f6&color=111827&bold=true");

    const isClient = (session?.user as any)?.role === 'client';
    const isAdmin = (session?.user as any)?.role === 'admin';

    // Filter navigation based on role
    const filteredNavigation = navigation.filter(item => {
        if (isClient && item.name === "Gestão de Clientes") return false;
        return true;
    });

    useEffect(() => {
        if (!session) return;

        const isClient = (session?.user as any)?.role === 'client';
        const isAdmin = (session?.user as any)?.role === 'admin';
        const userEmail = session?.user?.email;

        // Set default generic avatar
        if (session?.user?.name) {
            setProfileImg(`https://ui-avatars.com/api/?name=${encodeURIComponent(session.user.name)}&background=f3f4f6&color=111827&bold=true`);
        }

        if (isClient && (session?.user as any)?.brandId) {
            const clientBrandId = (session?.user as any).brandId;
            setActiveBrandId(clientBrandId);
            localStorage.setItem('active_brand_id', clientBrandId);
        } else if (isAdmin) {
            // Load active brand for admin
            const savedBrandId = localStorage.getItem('active_brand_id');
            if (savedBrandId) setActiveBrandId(savedBrandId);

            // Fetch brands (only needed for admin to switch)
            fetch('/api/brand/list')
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        setBrands(data.brands);
                        const currentActive = localStorage.getItem('active_brand_id');
                        if (!currentActive && data.brands.length > 0) {
                            setActiveBrandId(data.brands[0].id);
                            localStorage.setItem('active_brand_id', data.brands[0].id);
                        }
                    }
                });
        }

        // Handle Avatar
        if (userEmail) {
            const saved = localStorage.getItem(`user_profile_img_${userEmail}`);
            if (saved) setProfileImg(saved);

            fetch('/api/user/profile')
                .then(res => res.json())
                .then(data => {
                    if (data.success && data.avatarUrl) {
                        setProfileImg(data.avatarUrl);
                        localStorage.setItem(`user_profile_img_${userEmail}`, data.avatarUrl);
                    }
                });
        }
    }, [session]);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64 = reader.result as string;
            setProfileImg(base64);
            const userEmail = session?.user?.email;
            if (userEmail) localStorage.setItem(`user_profile_img_${userEmail}`, base64);

            // Persistir no banco de dados (Individual User Profile)
            try {
                await fetch('/api/user/profile', {
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

    const sidebarContent = (
        <div className={cn(
            "flex flex-col flex-1 overflow-hidden",
            !isMobile ? "bg-white border border-gray-200 rounded-3xl h-[calc(100vh-48px)] sticky top-6 shadow-sm" : "h-full"
        )}>
            <div className="flex flex-col flex-shrink-0 px-8 py-10 border-b border-gray-100 bg-gray-50/50">
                <span className="text-3xl font-black text-[#2B3440] tracking-tighter mb-1 font-[family-name:var(--font-space)] uppercase">
                    STELAR
                </span>
                <span className="text-[10px] font-bold text-gray-500 tracking-[0.2em] uppercase">
                    System Architecture
                </span>
                
                <p className="mt-4 text-[9px] font-black text-[#2B3440]/60 uppercase tracking-widest leading-relaxed italic">
                    "Consistência sem estrutura não gera autoridade."
                </p>

                {/* Brand Switcher UI - Hidden for Clients */}
                {isAdmin && (
                    <div className="mt-8 space-y-4">
                        <div className="bg-white rounded-2xl p-4 border border-gray-100 flex items-center gap-3 overflow-hidden shadow-sm">
                            <div className="w-8 h-8 rounded-lg bg-[#2B3440] flex items-center justify-center text-white shrink-0 shadow-sm">
                                <Users className="h-4 w-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Ecossistema Ativo:</p>
                                <p className="text-xs font-black text-[#2B3440] truncate tracking-tight">
                                    {brands.find(b => b.id === activeBrandId)?.name || 'Nenhum Cliente'}
                                </p>
                            </div>
                        </div>
                        
                        <div className="space-y-1.5 px-1">
                            <label className="text-[8px] font-black text-gray-400 uppercase tracking-[0.2em] block">Trocar de Ecossistema</label>
                            <div className="relative group">
                                <select
                                    value={activeBrandId}
                                    onChange={(e) => {
                                        setActiveBrandId(e.target.value);
                                        localStorage.setItem('active_brand_id', e.target.value);
                                        window.location.reload(); 
                                    }}
                                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-[10px] font-black text-gray-700 focus:outline-none focus:ring-4 focus:ring-[#2B3440]/5 transition-all appearance-none cursor-pointer shadow-sm hover:border-gray-300 truncate pr-8"
                                >
                                    <option value="" disabled>Selecione um cliente...</option>
                                    {brands.map(brand => (
                                        <option key={brand.id} value={brand.id} className="text-sm font-medium py-2">
                                            {brand.name}
                                        </option>
                                    ))}
                                </select>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                    <Plus className="h-3 w-3 rotate-45" />
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            
            <div className="flex-1 flex flex-col overflow-y-auto no-scrollbar">
                <nav className="flex-1 px-4 py-8 space-y-1.5">
                    {filteredNavigation.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                onClick={onClose}
                                className={cn(
                                    "flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-300 group",
                                    isActive
                                        ? "bg-[#2B3440] text-white shadow-lg shadow-[#2B3440]/20 translate-x-1"
                                        : "text-gray-400 hover:text-gray-900 hover:bg-gray-100/80"
                                )}
                            >
                                <item.icon className={cn(
                                    "h-5 w-5 transition-transform duration-500 group-hover:scale-110",
                                    isActive ? "text-white" : "text-gray-400 group-hover:text-[#2B3440]"
                                )} />
                                <span className={cn(
                                    "text-[10px] font-black uppercase tracking-[0.2em] transition-colors",
                                    isActive ? "text-white" : "text-gray-400 group-hover:text-gray-900"
                                )}>
                                    {item.name}
                                </span>
                                {isActive && (
                                    <div className="ml-auto w-1 h-4 bg-white/40 rounded-full" />
                                )}
                            </Link>
                        );
                    })}
                </nav>
            </div>

            <div className="flex-shrink-0 flex flex-col border-t border-gray-100 p-5 bg-gray-50/30">
                <div className="flex items-center w-full group mb-6">
                    <label className="flex items-center group cursor-pointer p-1 rounded-2xl transition-all">
                        <input type="file" className="hidden" accept="image/*" onChange={handleUpload} />
                        <div className="relative">
                            <img
                                className="inline-block h-12 w-12 rounded-full border border-gray-200 shadow-sm object-cover"
                                src={profileImg}
                                alt="Perfil"
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                <Plus className="h-4 w-4 text-white" />
                            </div>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm font-black text-[#2B3440]">
                                {session?.user?.name || "Usuário STELAR"}
                            </p>
                            <p className="text-[10px] font-black text-gray-400 tracking-widest uppercase">
                                {isAdmin ? "Arquiteto Chefe" : "Assessorado"}
                            </p>
                        </div>
                    </label>
                    <button
                        onClick={() => signOut({ callbackUrl: '/login' })}
                        className="ml-auto p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                        title="Sair do Sistema"
                    >
                        <LogOut className="h-4 w-4" />
                    </button>
                </div>

                <div className="border-t border-gray-100 pt-5 pb-2 text-center">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-relaxed">
                        Desenvolvido por <Link href="https://www.tobiasestivalete.com.br" target="_blank" className="text-[#2B3440] hover:underline whitespace-nowrap">Tobias Estivalete</Link>
                    </p>
                </div>
            </div>
        </div>
    );

    if (isMobile) return sidebarContent;

    return (
        <div className="hidden lg:flex lg:w-80 lg:flex-col lg:relative p-6">
            {sidebarContent}
        </div>
    );
}

