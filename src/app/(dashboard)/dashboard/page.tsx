"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
    Plus,
    ArrowUpRight,
    Clock,
    CheckCircle2,
    PenTool,
    Sparkles,
    Activity
} from "lucide-react";
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
    const { data: session } = useSession();
    const router = useRouter();
    const [statsData, setStatsData] = useState({ draftsCount: 0, approvedCount: 0, topicsCount: 0, hoursSaved: 0 });
    const [recentPieces, setRecentPieces] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const activeBrandId = localStorage.getItem('active_brand_id');
        if (!activeBrandId) {
            setIsLoading(false);
            return;
        }

        const fetchDashboard = async () => {
            try {
                const res = await fetch(`/api/dashboard?id=${activeBrandId}`);
                const data = await res.json();
                if (data.success) {
                    setStatsData(data.stats);
                    setRecentPieces(data.recentPieces);
                }
            } catch (error) {
                console.error("Failed to load dashboard data", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchDashboard();
    }, []);

    const statusLabels: Record<string, string> = {
        "idea": "Novas Pautas",
        "draft": "Em Produção",
        "review": "Aprovação",
        "approved": "Prontos",
        "published": "Publicados"
    };

    const stats = [
        { name: "Painel de Rascunhos", value: statsData.draftsCount, icon: PenTool, change: "+3", changeType: "increase" },
        { name: "Conteúdos Prontos", value: statsData.approvedCount, icon: CheckCircle2, change: "+1", changeType: "increase" },
        { name: "Pautas de IA Novas", value: statsData.topicsCount, icon: Sparkles, change: "+5", changeType: "increase" },
        { name: "Horas Poupadas", value: statsData.hoursSaved + "h", icon: Clock, change: "+4.2", changeType: "increase" },
    ];

    return (
        <div className="max-w-6xl mx-auto space-y-16 py-10 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            {/* Structural Header */}
            <div className="space-y-10 text-center md:text-left border-b border-gray-200 pb-16">
                <div className="inline-flex items-center space-x-3 px-4 py-2 bg-[#2B3440]/5 rounded-full border border-[#2B3440]/10 mb-6">
                    <div className="h-2 w-2 bg-[#2B3440] rounded-full animate-pulse" />
                    <span className="text-[10px] font-black text-[#2B3440] uppercase tracking-[0.2em]">O Sistema está Ativo</span>
                </div>
                
                <div className="max-w-4xl">
                    <h1 className="text-5xl lg:text-7xl font-black text-[#2B3440] tracking-tighter leading-[0.95] uppercase mb-8">
                        Estruture sua <span className="text-gray-400">inteligência.</span>
                    </h1>
                    <p className="text-xl lg:text-3xl text-gray-500 font-medium tracking-tight leading-snug">
                        O STELAR organiza sua presença digital com base no seu <span className="text-[#2B3440] font-bold">próprio repertório</span> e não em conteúdo genérico.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-6 pt-6">
                    <button
                        onClick={() => router.push('/dashboard/brand')}
                        className="w-full sm:w-auto h-20 px-12 bg-[#2B3440] text-white text-xs font-black uppercase tracking-[0.3em] rounded-2xl hover:bg-[#3a4655] transition-all shadow-xl shadow-[#2B3440]/20 flex items-center justify-center group transform active:scale-95"
                    >
                        Começar pelo DNA da Marca
                        <Plus className="ml-4 h-5 w-5 group-hover:rotate-90 transition-transform duration-500" />
                    </button>
                    <Link href="/dashboard/knowledge" className="text-xs font-black text-gray-400 uppercase tracking-widest hover:text-[#2B3440] transition-colors border-b-2 border-transparent hover:border-[#2B3440] pb-1">
                        Carregar Repertório
                    </Link>
                </div>
            </div>

            {/* System Status Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
                {stats.map((item) => (
                    <div key={item.name} className="stelar-card p-8 rounded-3xl relative overflow-hidden group">
                        <div className="flex items-center justify-between mb-6">
                            <div className="h-10 w-10 bg-gray-50 rounded-xl flex items-center justify-center text-[#2B3440]">
                                <item.icon className="h-5 w-5" />
                            </div>
                            <span className="text-[10px] font-black text-green-600 bg-green-50 px-2.5 py-1 rounded-lg">
                                +{item.change}
                            </span>
                        </div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] mb-1">{item.name}</p>
                        <h3 className="text-3xl font-black text-[#2B3440] tracking-tighter">{item.value}</h3>
                    </div>
                ))}
            </div>

            {/* Core Operation Row */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                <div className="lg:col-span-8 space-y-8">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-6">
                        <h2 className="text-2xl font-black text-[#2B3440] tracking-tighter uppercase flex items-center gap-3">
                            <Activity className="h-6 w-6" />
                            Arquitetura de Conteúdo
                        </h2>
                        <Link href="/dashboard/content" className="text-[10px] font-black text-gray-400 hover:text-[#2B3440] uppercase tracking-widest transition-colors">
                            Ver Esteira Completa
                        </Link>
                    </div>

                    <div className="space-y-4">
                        {isLoading ? (
                            <div className="p-20 text-center text-gray-400 uppercase font-black text-xs tracking-widest bg-gray-50/50 rounded-3xl border border-dashed border-gray-200 animate-pulse">
                                Sincronizando Arquitetura...
                            </div>
                        ) : recentPieces.length === 0 ? (
                            <div className="p-20 text-center text-gray-400 uppercase font-black text-xs tracking-widest bg-gray-50/50 rounded-3xl border border-dashed border-gray-200 font-serif italic text-base">
                                Nenhuma narrativa estruturada na esteira no momento.
                            </div>
                        ) : (
                            recentPieces.map((piece) => (
                                <button 
                                    key={piece.id}
                                    onClick={() => piece.status === 'idea' ? router.push('/dashboard/content') : router.push(`/dashboard/content/${piece.id}`)}
                                    className="w-full text-left p-6 stelar-card stelar-card-hover rounded-[2.5rem] flex items-center justify-between group transition-all"
                                >
                                    <div className="flex items-center gap-6">
                                        <div className="h-14 w-14 bg-gray-50 rounded-2xl flex items-center justify-center text-[#2B3440] group-hover:bg-[#2B3440] group-hover:text-white transition-all shadow-sm">
                                            <PenTool className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <h4 className="text-lg font-black text-[#2B3440] tracking-tight mb-1">{piece.title}</h4>
                                            <div className="flex items-center gap-4">
                                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{piece.platform} {piece.format}</span>
                                                <div className="h-1 w-1 bg-gray-300 rounded-full" />
                                                <span className="text-[10px] font-bold text-[#2B3440] px-2 py-0.5 bg-gray-100 rounded-md uppercase tracking-wider">{statusLabels[piece.status] || piece.status}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <ArrowUpRight className="h-6 w-6 text-gray-300 group-hover:text-[#2B3440] transition-colors" />
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* Side Intelligence Widget */}
                <div className="lg:col-span-4">
                    <div className="bg-[#2B3440] rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden group">
                        <div className="absolute -top-10 -right-10 opacity-5 group-hover:scale-110 transition-transform duration-700">
                            <Sparkles className="h-40 w-40" />
                        </div>
                        <h3 className="text-3xl font-black uppercase tracking-tighter mb-8 leading-[0.9]">Insights de Decisão</h3>
                        <p className="text-gray-300 font-medium leading-relaxed mb-10 text-lg italic">
                            O motor do sistema cruzou sua base de conhecimento com as tendências e identificou <span className="text-white font-bold">{statsData.topicsCount} novas oportunidades</span> estratégicas.
                        </p>
                        <button
                            onClick={() => router.push('/dashboard/ideas')}
                            className="w-full h-18 bg-white text-[#2B3440] font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-gray-100 transition-all shadow-xl active:scale-95"
                        >
                            Estruturar Narrativas
                        </button>
                    </div>
                    
                    <div className="mt-8 p-10 bg-gray-900 rounded-[3rem] shadow-2xl relative overflow-hidden group border border-white/5">
                        <div className="absolute top-0 right-0 p-10 opacity-5 transform translate-x-4 translate-y-4 group-hover:scale-125 transition-transform duration-700">
                            <Sparkles className="h-40 w-40" />
                        </div>
                        <h3 className="text-2xl font-black relative text-white uppercase tracking-tighter">Ativação do Sistema</h3>
                        <div className="mt-8 space-y-6 relative">
                            {[
                                { step: "1", title: "Configure seu DNA", desc: "A base de toda a arquitetura." },
                                { step: "2", title: "Estruture sua base", desc: "Alimente com seu repertório." },
                                { step: "3", title: "Ative o sistema", desc: "Gere narrativas de autoridade." }
                            ].map((s) => (
                                <div key={s.step} className="flex items-start gap-4">
                                    <div className="h-6 w-6 rounded-full bg-white text-gray-900 flex items-center justify-center text-[10px] font-black shrink-0">
                                        {s.step}
                                    </div>
                                    <div>
                                        <p className="text-xs font-black text-white uppercase tracking-widest">{s.title}</p>
                                        <p className="text-[10px] text-gray-400 font-medium">{s.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
