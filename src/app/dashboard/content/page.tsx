"use client";

import { useState, useEffect } from "react";
import { Search, PenTool, LayoutTemplate, MessageSquare, FastForward, Play, Activity } from "lucide-react";

export default function ContentPipeline() {
    const [pieces, setPieces] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("All");

    const tabs = ["All", "idea", "draft", "review", "approved", "published"];
    const statusLabels: Record<string, string> = {
        "idea": "Criar Rascunho",
        "draft": "Revisar Texto",
        "review": "Aprovação Final",
        "approved": "Pronto",
        "published": "Publicado"
    };

    const loadContent = async () => {
        setIsLoading(true);
        try {
            const url = activeTab === "All" ? '/api/content' : `/api/content?status=${activeTab}`;
            const res = await fetch(url);
            const data = await res.json();
            if (data.success) {
                setPieces(data.pieces);
            }
        } catch (error) {
            console.error("Failed to load pipeline:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadContent();
    }, [activeTab]);

    return (
        <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-1000">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-6 md:space-y-0 pb-10 border-b border-black/5">
                <div>
                    <div className="flex items-center space-x-3 mb-3 animate-fade-in">
                        <Activity className="h-5 w-5 text-primary-500" />
                        <span className="text-sm font-black text-primary-600/80 uppercase tracking-widest shadow-sm">AI Copilot</span>
                    </div>
                    <h1 className="text-5xl lg:text-6xl font-black tracking-tighter text-gradient animate-slide-up">
                        Esteira de Produção
                    </h1>
                    <p className="mt-5 text-xl text-gray-500/80 max-w-3xl font-medium leading-relaxed">
                        Transforme Ideias em Cópias Magnéticas e Imagens de Alta Performance.
                    </p>
                </div>
                <div className="flex items-center space-x-4">
                    <button className="h-14 px-8 bg-gray-900 text-white text-sm font-black rounded-[20px] shadow-2xl hover:bg-black transition-all flex items-center transform hover:-translate-y-1 hover:shadow-primary-500/25 duration-300">
                        <PenTool className="mr-3 h-5 w-5" />
                        Escrever Post do Zero
                    </button>
                </div>
            </div>

            {/* Tabs & Search */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-4">
                <div className="flex items-center space-x-2 glass-panel p-2 rounded-[24px] w-full lg:w-auto overflow-x-auto no-scrollbar">
                    {tabs.map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-6 py-3 text-xs font-black rounded-2xl transition-all uppercase tracking-wider ${activeTab === tab
                                    ? "bg-white text-gray-900 shadow-md shadow-black/5 border border-white/60 scale-105"
                                    : "text-gray-500 hover:text-gray-900 hover:bg-white/40 border border-transparent"
                                }`}
                        >
                            {tab === "All" ? "Todos" : tab}
                        </button>
                    ))}
                </div>
                <div className="relative w-full lg:w-96 group">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
                    <input
                        className="w-full h-16 pl-14 pr-6 glass-panel rounded-[24px] focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500/50 transition-all font-bold text-gray-700 placeholder:text-gray-400/70"
                        placeholder="Buscar rascunhos, tópicos..."
                    />
                </div>
            </div>

            {/* Pipeline Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 pb-20">
                {isLoading ? (
                    <div className="col-span-1 xl:col-span-2 text-center py-20 text-gray-500 font-bold animate-pulse">
                        Sincronizando Esteira Industrial...
                    </div>
                ) : pieces.length === 0 ? (
                    <div className="col-span-1 xl:col-span-2 text-center py-20 text-gray-500 font-bold glass-panel rounded-[40px]">
                        Nenhum rascunho na fila. Vá em "Biblioteca de Ideias" e aprove alguma pauta para iniciar a produção!
                    </div>
                ) : (
                    pieces.map((piece) => (
                        <div key={piece.id} className="group relative glass-panel p-8 rounded-[40px] hover:shadow-2xl hover:shadow-primary-500/10 transition-all duration-500 border-white/60 flex flex-col md:flex-row gap-8">

                            <div className="flex-1 flex flex-col">
                                <div className="flex items-center space-x-3 mb-6">
                                    <span className="bg-primary-500 text-white text-[10px] font-black tracking-widest uppercase px-3 py-1.5 rounded-full shadow-sm">
                                        {piece.platform}
                                    </span>
                                    <span className="text-gray-500 text-xs font-bold uppercase tracking-wider">
                                        {piece.format}
                                    </span>
                                </div>

                                <h3 className="text-2xl font-black text-gray-900 leading-tight mb-4 group-hover:text-primary-600 transition-colors">
                                    {piece.title}
                                </h3>

                                <p className="text-gray-500 font-medium leading-relaxed line-clamp-2 mb-8 flex-grow">
                                    {piece.goal}
                                </p>

                                <div className="flex items-center justify-between pt-6 border-t border-black/5 mt-auto">
                                    <div className="flex items-center space-x-2 text-sm font-bold text-gray-400">
                                        <div className={`h-2.5 w-2.5 rounded-full ${piece.status === 'idea' ? 'bg-amber-400' : 'bg-primary-500'}`}></div>
                                        <span className="uppercase tracking-wider">{statusLabels[piece.status] || piece.status}</span>
                                    </div>
                                    <button className="h-12 px-6 bg-white border border-white/60 shadow-sm shadow-black/5 text-primary-600 text-sm font-black rounded-xl hover:bg-primary-50 hover:border-primary-100 transition-all duration-300 flex items-center justify-center group/btn">
                                        <Play className="mr-2 h-4 w-4 fill-primary-600/20 group-hover/btn:scale-110 transition-transform" />
                                        {piece.status === 'idea' ? 'Gerar IA' : 'Editar'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
