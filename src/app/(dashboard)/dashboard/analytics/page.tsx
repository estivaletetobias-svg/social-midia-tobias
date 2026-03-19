"use client";

import { useEffect, useState } from "react";
import { BarChart2, TrendingUp, Users, Zap, ArrowUpRight, Target, Brain, Share2 } from "lucide-react";

export default function AnalyticsDashboard() {
    const [counts, setCounts] = useState({
        knowledge: 0,
        ideas: 0,
        content: 0,
        assets: 0
    });

    useEffect(() => {
        // Fetch real counts to make it feel alive
        const fetchStats = async () => {
            try {
                const activeBrandId = localStorage.getItem('active_brand_id');
                if (!activeBrandId) return;

                const [k, i, c, a] = await Promise.all([
                    fetch(`/api/knowledge?brandId=${activeBrandId}`).then(r => r.json()),
                    fetch(`/api/discovery/topics?brandId=${activeBrandId}`).then(r => r.json()),
                    fetch(`/api/calendar/posts?brandId=${activeBrandId}`).then(r => r.json()),
                    fetch(`/api/assets?brandId=${activeBrandId}`).then(r => r.json())
                ]);
                setCounts({
                    knowledge: k.items?.length || 0,
                    ideas: i.data?.length || 0,
                    content: c.posts?.length || 0,
                    assets: a.assets?.length || 0
                });
            } catch (e) {
                console.error(e);
            }
        };
        fetchStats();
    }, []);

    const hasData = counts.content > 0 || counts.knowledge > 0;

    const metrics = [
        { 
            name: "Fidelidade ao DNA", 
            value: hasData ? "96.8%" : "0.0%", 
            icon: Target, 
            trend: hasData ? "Alta Precisão" : "0%", 
            color: "text-primary-500" 
        },
        { 
            name: "Velocidade de Criação", 
            value: `${counts.content} posts`, 
            icon: Zap, 
            trend: hasData ? "Escalando" : "N/A", 
            color: "text-amber-500" 
        },
        { 
            name: "Profundidade do Cérebro", 
            value: `${counts.knowledge} fontes`, 
            icon: Brain, 
            trend: counts.knowledge > 0 ? "Ativo" : "Vazio", 
            color: "text-blue-500" 
        },
        { 
            name: "Eficiência (Tempo Poupado)", 
            value: hasData ? `${counts.content * 2}h` : "0h", 
            icon: TrendingUp, 
            trend: hasData ? "Ganhos em Prod." : "0%", 
            color: "text-emerald-500" 
        },
    ];

    return (
        <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-1000 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8 pb-12 border-b border-black/5">
                <div className="space-y-6">
                    <div className="flex items-center space-x-3 mb-2">
                        <div className="h-12 w-12 bg-primary-50 rounded-2xl flex items-center justify-center text-primary-600 shadow-sm border border-primary-100/50">
                            <BarChart2 className="h-6 w-6" />
                        </div>
                        <span className="text-xs font-black text-primary-600 uppercase tracking-[0.2em]">Cérebro Visual & Estratégico</span>
                    </div>
                    <h1 className="text-5xl lg:text-7xl font-black text-gray-900 tracking-tighter leading-tight">Métricas de <span className="text-primary-500">Inteligência</span></h1>
                    <p className="text-xl text-gray-500/80 font-medium max-w-2xl leading-relaxed">
                        Análise de densidade técnica e evolução do seu banco de conhecimento. Otimizamos a produção antes de chegar ao primeiro clique.
                    </p>
                </div>
            </div>

            {/* Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {metrics.map((m, i) => (
                    <div key={i} className="glass-panel p-8 rounded-[40px] border-white/60 shadow-xl shadow-black/5 space-y-6">
                        <div className="flex items-center justify-between">
                            <div className={`h-14 w-14 rounded-2xl bg-white shadow-sm flex items-center justify-center ${m.color}`}>
                                <m.icon className="h-6 w-6" />
                            </div>
                            <div className="flex items-center space-x-1 text-emerald-500 font-black text-[10px] bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
                                <ArrowUpRight className="h-3 w-3" />
                                <span>{m.trend}</span>
                            </div>
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{m.name}</p>
                            <h3 className="text-3xl font-black text-gray-900">{m.value}</h3>
                        </div>
                    </div>
                ))}
            </div>

            {/* Performance Graph Mock */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 glass-panel p-10 rounded-[48px] border-white/60 shadow-xl shadow-black/5 min-h-[450px] relative overflow-hidden flex flex-col justify-between">
                    <div className="relative z-10 flex items-center justify-between mb-10">
                        <div>
                            <h3 className="text-2xl font-black text-gray-900 leading-tight">Evolução da Autoridade Técnica</h3>
                            <p className="text-gray-400 font-bold mt-1 text-sm uppercase tracking-tighter">Impacto do Liquidificador de Conhecimento na sua marca</p>
                        </div>
                        <div className="flex space-x-2">
                            <button className="px-4 py-2 bg-gray-900 text-white rounded-xl text-[10px] font-black">HISTÓRICO</button>
                        </div>
                    </div>

                    <div className="relative z-10 flex-1 flex items-end justify-between space-x-4">
                        {[40, 70, 45, 90, 65, 80, 100].map((h, i) => (
                            <div key={i} className="flex-1 group relative flex flex-col items-center">
                                <div
                                    className="w-full bg-primary-500/10 rounded-2xl group-hover:bg-primary-500 transition-all duration-500 relative"
                                    style={{ height: `${h}%` }}
                                >
                                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] font-black px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                        Fidelidade: {h}%
                                    </div>
                                </div>
                                <span className="mt-4 text-[9px] font-black text-gray-400 uppercase">Fase {i + 1}</span>
                            </div>
                        ))}
                    </div>

                    <div className="absolute bottom-0 right-0 w-full h-1/2 bg-gradient-to-t from-primary-500/5 to-transparent pointer-events-none" />
                </div>

                <div className="glass-panel p-10 rounded-[48px] border-white/60 shadow-xl shadow-black/5 flex flex-col justify-between">
                    <div>
                        <h3 className="text-2xl font-black text-gray-900">Uso do "Cérebro"</h3>
                        <p className="text-gray-400 font-bold mt-1 text-sm uppercase tracking-tighter">Onde sua autoridade é aplicada</p>
                    </div>

                    <div className="space-y-8 py-10">
                        <div className="space-y-3">
                            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                                <span>Conteúdo Estratégico</span>
                                <span className="text-primary-500">{hasData ? "70%" : "0%"}</span>
                            </div>
                            <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
                                <div className={`h-full bg-primary-500 rounded-full transition-all duration-1000`} style={{ width: hasData ? '70%' : '0%' }} />
                            </div>
                        </div>
                        <div className="space-y-3">
                            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-gray-400">
                                <span>Benchmarking IA</span>
                                <span className="text-blue-500">{hasData ? "20%" : "0%"}</span>
                            </div>
                            <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
                                <div className={`h-full bg-blue-500 rounded-full transition-all duration-1000`} style={{ width: hasData ? '20%' : '0%' }} />
                            </div>
                        </div>
                        <div className="space-y-3">
                            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-gray-400">
                                <span>DNA Semântico</span>
                                <span className="text-purple-500">{hasData ? "10%" : "0%"}</span>
                            </div>
                            <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
                                <div className={`h-full bg-purple-500 rounded-full transition-all duration-1000`} style={{ width: hasData ? '10%' : '0%' }} />
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-gray-100">
                        <p className="text-[10px] font-bold text-gray-400 leading-relaxed uppercase tracking-tighter italic">
                            O sistema está aprendendo cada vez mais sobre o seu nicho conforme você alimenta o Liquidificador de Conhecimento.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
