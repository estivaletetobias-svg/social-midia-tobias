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
    Activity,
    Zap,
    TrendingUp,
    Users,
    FileText
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
                
                <div>
                    <h1 className="text-6xl lg:text-7xl font-black tracking-tighter text-gray-900 leading-[0.9] animate-slide-up mb-6">
                        ESTRUTURE SUA <br/><span className="text-gray-300 italic">INTELIGÊNCIA.</span>
                    </h1>
                    <p className="text-xl text-gray-500 max-w-2xl font-medium leading-relaxed">
                        O STELAR organiza sua presença digital com base no seu <span className="text-gray-900 font-bold underline decoration-2 decoration-gray-900/10">próprio repertório</span> e não em conteúdo genérico.
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => router.push('/dashboard/brand')}
                        className="h-20 px-12 bg-[#2B3440] text-white text-xs font-black rounded-[2.5rem] shadow-2xl hover:bg-black transition-all flex items-center transform hover:-translate-y-1 active:scale-95 duration-300 uppercase tracking-[0.2em]"
                    >
                        <Zap className="mr-3 h-5 w-5 fill-white" />
                        Começar pelo DNA da Marca
                    </button>
                    <Link href="/dashboard/knowledge" className="text-xs font-black text-gray-400 uppercase tracking-widest hover:text-[#2B3440] transition-colors border-b-2 border-transparent hover:border-[#2B3440] pb-1">
                        Carregar Repertório
                    </Link>
                </div>
            </div>

            {/* System Status Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
                {stats.map((item) => {
                    const Icon = item.icon;
                    const label = item.name;
                    const value = item.value;
                    return (
                        <div key={label} className="stelar-card p-10 rounded-[3rem] group hover:border-[#2B3440] transition-all">
                            <div className="flex items-center justify-between mb-8">
                                <div className="p-3 bg-gray-50 rounded-2xl group-hover:bg-gray-100 transition-colors">
                                    <Icon className="h-6 w-6 text-[#2B3440]" />
                                </div>
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none bg-gray-50 px-3 py-1.5 rounded-full">Histórico</span>
                            </div>
                            <p className="text-5xl font-black text-gray-900 tracking-tighter mb-2">{value}</p>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{label}</p>
                        </div>
                    );
                })}
            </div>

            {/* Core Operation Row */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                <div className="lg:col-span-8 space-y-8">
                    <div className="bg-white border-2 border-gray-200 p-12 rounded-[4rem] shadow-sm relative overflow-hidden">
                        <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tighter mb-10 flex items-center gap-3">
                            <Activity className="h-6 w-6" />
                            Esteira de Produção Ativa
                        </h3>
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
                    {/* Insights Card - Support */}
                    <div className="bg-gray-50 border border-gray-200 p-10 rounded-[3rem] group transition-all hover:bg-white hover:border-[#2B3440] shadow-sm">
                        <div className="h-14 w-14 bg-white rounded-2xl flex items-center justify-center mb-8 border border-gray-100 shadow-sm group-hover:scale-110 transition-transform">
                            <Sparkles className="h-7 w-7 text-[#2B3440]" />
                        </div>
                        <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter mb-4">Insights de Decisão</h3>
                        <p className="text-sm text-gray-500 font-medium leading-relaxed mb-10">
                            Pautas detectadas com base no seu repertório estratégico atual.
                        </p>
                        <button 
                            onClick={() => router.push('/dashboard/ideas')}
                            className="w-full h-14 bg-white border-2 border-gray-200 text-[#2B3440] text-[10px] font-black rounded-2xl hover:border-[#2B3440] transition-all uppercase tracking-widest"
                        >
                            Estruturar Narrativas
                        </button>
                    </div>
                    
                    {/* Activation Card - PREMIUM */}
                    <div className="mt-8 p-12 bg-[#2B3440] rounded-[3.5rem] shadow-2xl relative overflow-hidden group border border-white/5">
                        <div className="absolute top-0 right-0 p-10 opacity-5 transform translate-x-4 translate-y-4 group-hover:rotate-12 transition-transform duration-1000">
                            <Sparkles className="h-48 w-48 text-white" />
                        </div>
                        <div className="relative">
                            <h3 className="text-3xl font-black text-white uppercase tracking-tighter leading-none mb-2">ATIVAÇÃO DO <br/> SISTEMA</h3>
                            <div className="h-1 w-12 bg-white/20 rounded-full mb-10" />
                            
                            <div className="space-y-8">
                                {[
                                    { step: "01", title: "Configure seu DNA", desc: "A base de toda a arquitetura." },
                                    { step: "02", title: "Estruture sua base", desc: "Alimente com seu repertório." },
                                    { step: "03", title: "Ativar Narrativas", desc: "Gere autoridade de verdade." }
                                ].map((s) => (
                                    <div key={s.step} className="flex items-start gap-5">
                                        <div className="h-8 w-8 rounded-xl bg-white/10 text-white flex items-center justify-center text-[11px] font-black border border-white/10">
                                            {s.step}
                                        </div>
                                        <div>
                                            <p className="text-xs font-black text-white uppercase tracking-widest mb-1">{s.title}</p>
                                            <p className="text-[10px] text-gray-300 font-medium leading-tight">{s.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
               </div>
            </div>
        </div>
    );
}
