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
        <div className="max-w-7xl mx-auto space-y-16 py-10 animate-in fade-in slide-in-from-bottom-6 duration-1000 pb-20">
            {/* Header - Dominant Level */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-12 border-b border-gray-100 pb-16">
                <div className="space-y-6 flex-1">
                    <div className="flex items-center gap-3">
                        <div className="pulse-indicator" />
                        <span className="text-[10px] font-black text-[#2B3440] uppercase tracking-[0.4em]">STELAR Engine Active</span>
                    </div>
                    <h1 className="text-6xl lg:text-8xl font-black tracking-tight text-gray-900 leading-[0.85] uppercase">
                        Sua Marca <br />
                        <span className="text-gradient">Codificada.</span>
                    </h1>
                    <p className="text-xl text-gray-400 font-medium max-w-xl leading-relaxed">
                        Arquitetura de autoridade construída com inteligência proprietária. O sistema opera 100% sobre o seu repertório estratégico.
                    </p>
                </div>
                <div className="shrink-0">
                    <button 
                        onClick={() => router.push('/dashboard/brand')}
                        className="button-primary h-22 px-14 rounded-[2.5rem] text-[11px] flex items-center group relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <Zap className="mr-5 h-6 w-6 fill-white" />
                        Começar pelo DNA da Marca
                        <ArrowUpRight className="ml-5 h-6 w-6 transform group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    </button>
                </div>
            </div>

            {/* System Status Stats - Support Level */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {stats.map((item, i) => (
                    <div key={i} className="stelar-card stelar-card-hover p-10 group overflow-hidden relative">
                        <div className="absolute -right-4 -top-4 w-32 h-32 bg-gray-50 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-700 -z-0" />
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-10">
                                <div className="h-16 w-16 rounded-[2rem] bg-gray-50 flex items-center justify-center text-[#2B3440] group-hover:bg-[#2B3440] group-hover:text-white transition-all duration-500 shadow-sm">
                                    <item.icon className="h-7 w-7" />
                                </div>
                                <div className="flex items-center gap-2 px-4 py-1.5 bg-gray-50 rounded-full border border-gray-100">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{item.change}</span>
                                </div>
                            </div>
                            <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">{item.name}</p>
                            <h3 className="text-5xl font-black text-gray-900 tracking-tighter">{item.value}</h3>
                        </div>
                    </div>
                ))}
            </div>

            {/* Core Operation Row - Action Oriented */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                <div className="lg:col-span-7 space-y-10">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">Esteira de Produção Ativa</h3>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Acompanhamento de fluxo industrial</p>
                        </div>
                        <Link href="/dashboard/content" className="button-primary h-12 px-6 rounded-2xl text-[9px] flex items-center">
                            Ver Máquina Completa
                        </Link>
                    </div>

                    <div className="space-y-6">
                        {isLoading ? (
                            <div className="p-24 text-center text-gray-400 uppercase font-black text-[10px] tracking-[0.3em] bg-white border-2 border-dashed border-gray-100 rounded-[3rem] animate-pulse">
                                Sincronizando Arquitetura Estelar...
                            </div>
                        ) : recentPieces.length === 0 ? (
                            <div className="p-24 text-center text-gray-400 uppercase font-black text-[10px] tracking-[0.3em] bg-white border-2 border-gray-200 rounded-[3rem]">
                                Nenhuma narrativa estruturada. <br/><span className="mt-4 inline-block text-[9px] opacity-60">Comece aprovando ideias na biblioteca.</span>
                            </div>
                        ) : (
                            recentPieces.map((piece) => (
                                <button 
                                    key={piece.id}
                                    onClick={() => piece.status === 'idea' ? router.push('/dashboard/content') : router.push(`/dashboard/content/${piece.id}`)}
                                    className="w-full text-left p-8 stelar-card stelar-card-hover rounded-[3rem] flex items-center justify-between group"
                                >
                                    <div className="flex items-center gap-8">
                                        <div className="h-16 w-16 bg-gray-50 rounded-[1.5rem] flex items-center justify-center text-[#2B3440] group-hover:bg-[#2B3440] group-hover:text-white transition-all shadow-sm">
                                            <PenTool className="h-7 w-7" />
                                        </div>
                                        <div>
                                            <h4 className="text-xl font-black text-gray-900 tracking-tight mb-2 group-hover:text-[#2B3440] transition-colors">{piece.title}</h4>
                                            <div className="flex items-center gap-5">
                                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{piece.platform} · {piece.format}</span>
                                                <div className="h-2 w-2 rounded-full bg-blue-500/20 group-hover:bg-blue-500 transition-colors" />
                                                <span className="text-[10px] font-black text-[#2B3440] uppercase tracking-widest">{statusLabels[piece.status] || piece.status}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="h-12 w-12 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-[#2B3440] group-hover:text-white transition-all transform group-hover:rotate-45">
                                        <ArrowUpRight className="h-5 w-5" />
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>

                <div className="lg:col-span-5 space-y-8">
                    {/* Activation Card - PREMIUM DESIGN */}
                    <div className="p-14 bg-gray-900 rounded-[4rem] shadow-3xl relative overflow-hidden group border border-white/5">
                        <div className="absolute top-0 right-0 p-12 opacity-10 transform translate-x-8 translate-y-8 group-hover:rotate-12 transition-transform duration-1000">
                            <Sparkles className="h-56 w-56 text-white" />
                        </div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                                <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em]">Ambiente Propriatário de IA</span>
                            </div>
                            <h3 className="text-4xl lg:text-5xl font-black text-white uppercase tracking-tighter leading-[0.9] mb-4">ATIVAÇÃO DO <br/> SISTEMA</h3>
                            <p className="text-gray-400 font-medium text-lg max-w-xs leading-relaxed mb-12">Escalabilidade industrial com fidelidade máxima ao repertório da marca.</p>
                            
                            <div className="space-y-10">
                                {[
                                    { step: "01", title: "Mapeamento Estático", desc: "Decodificamos sua essência técnica." },
                                    { step: "02", title: "Expansão de Cérebro", desc: "Alimentação de repertório estratégica." },
                                    { step: "03", title: "Produção Ativa", desc: "Execução com dominância de mercado." }
                                ].map((s) => (
                                    <div key={s.step} className="flex items-start gap-6">
                                        <div className="h-10 w-10 rounded-2xl bg-white/5 text-blue-400 flex items-center justify-center text-[12px] font-black border border-white/10 shrink-0">
                                            {s.step}
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-white uppercase tracking-widest mb-1">{s.title}</p>
                                            <p className="text-xs text-gray-500 font-medium leading-tight">{s.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <button className="w-full mt-14 h-18 bg-white text-gray-900 text-xs font-black rounded-3xl hover:bg-blue-50 transition-all flex items-center justify-center gap-4 uppercase tracking-[0.2em] shadow-2xl">
                                <Zap className="h-5 w-5 fill-gray-900" />
                                Energizar Ecossistema
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
