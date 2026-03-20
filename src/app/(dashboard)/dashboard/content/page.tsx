"use client";

import { useState, useEffect } from "react";
import { Search, PenTool, LayoutTemplate, MessageSquare, FastForward, Play, Activity } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ContentPipeline() {
    const router = useRouter();
    const [pieces, setPieces] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("All");
    const [isGenerating, setIsGenerating] = useState<Record<string, boolean>>({});

    const tabs = ["All", "idea", "draft", "review", "approved", "published"];
    const statusLabels: Record<string, string> = {
        "All": "Todos",
        "idea": "Novas Pautas",
        "draft": "Em Produção",
        "review": "Aprovação",
        "approved": "Prontos",
        "published": "Publicados"
    };

    const loadContent = async () => {
        const activeBrandId = localStorage.getItem('active_brand_id');
        if (!activeBrandId) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        try {
            const baseUrl = '/api/content';
            const params = new URLSearchParams();
            if (activeTab !== "All") params.append('status', activeTab);
            params.append('brandId', activeBrandId);

            const res = await fetch(`${baseUrl}?${params.toString()}`);
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

    const handleGenerate = async (pieceId: string) => {
        setIsGenerating(prev => ({ ...prev, [pieceId]: true }));
        try {
            const res = await fetch(`/api/content/${pieceId}/generate`, { method: 'POST' });
            const data = await res.json();
            if (data.success) {
                alert('Mágica feita! IA acabou de criar sua imagem, copy e ganchos!');
                loadContent(); // Refresh the pipeline
            } else {
                alert(`Erro: ${data.error}`);
            }
        } catch (error) {
            console.error(error);
            alert('Falha ao conectar com o motor de Inteligência Artificial.');
        } finally {
            setIsGenerating(prev => ({ ...prev, [pieceId]: false }));
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
                        <Activity className="h-5 w-5 text-[#2B3440]" />
                        <span className="text-[10px] font-black text-[#2B3440]/80 uppercase tracking-[0.2em]">Sistema Estratégico</span>
                    </div>
                    <h1 className="text-5xl lg:text-6xl font-black tracking-tighter text-gradient animate-slide-up">
                        Esteira de Produção
                    </h1>
                    <p className="mt-5 text-xl text-gray-500/80 max-w-3xl font-medium leading-relaxed">
                        Transforme Ideias em Cópias Magnéticas e Imagens de Alta Performance.
                    </p>
                </div>
                <div className="flex items-center space-x-4">
                    <button
                        onClick={() => alert("Em breve! Por enquanto deixe a Inteligência Artificial trabalhar por você aprovando ideias!")}
                        className="h-16 px-10 bg-[#2B3440] text-white text-[11px] font-black rounded-3xl shadow-2xl hover:bg-black transition-all flex items-center transform hover:-translate-y-1 hover:shadow-[#2B3440]/25 duration-300 uppercase tracking-widest">
                        <PenTool className="mr-3 h-5 w-5" />
                        Arquitetar Conteúdo
                    </button>
                </div>
            </div>

            {/* Tabs & Search */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-4">
                <div className="flex items-center space-x-2 bg-white border-2 border-gray-200 p-2 rounded-[28px] w-full lg:w-auto overflow-x-auto no-scrollbar shadow-sm">
                    {tabs.map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-8 py-4 text-[10px] font-black rounded-2xl transition-all uppercase tracking-widest whitespace-nowrap ${activeTab === tab
                                ? "bg-[#2B3440] text-white shadow-xl translate-y-[-2px]"
                                : "text-gray-400 hover:text-gray-900 hover:bg-gray-50"
                                }`}
                        >
                            {statusLabels[tab]}
                        </button>
                    ))}
                </div>
                <div className="relative w-full lg:w-[400px] group">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-[#2B3440] transition-colors" />
                    <input
                        className="w-full h-18 pl-16 pr-8 bg-white border-2 border-gray-200 rounded-[28px] focus:outline-none focus:border-[#2B3440] transition-all font-black text-gray-900 placeholder:text-gray-300 shadow-sm"
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
                        <div key={piece.id} className="group relative bg-white border border-gray-200 p-8 rounded-[40px] hover:shadow-xl hover:border-gray-300 transition-all duration-500 flex flex-col md:flex-row gap-8 shadow-sm">

                            <div className="flex-1 flex flex-col">
                                <div className="flex items-center space-x-4 mb-8">
                                    <span className="bg-[#2B3440] text-white text-[9px] font-black tracking-widest uppercase px-4 py-2 rounded-xl shadow-lg">
                                        {piece.platform}
                                    </span>
                                    <span className="text-gray-400 text-[9px] font-black uppercase tracking-[0.2em]">
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
                                    <button
                                        onClick={() => piece.status === 'idea' ? handleGenerate(piece.id) : router.push(`/dashboard/content/${piece.id}`)}
                                        disabled={isGenerating[piece.id]}
                                        className="h-12 px-6 bg-white border border-white/60 shadow-sm shadow-black/5 text-primary-600 text-sm font-black rounded-xl hover:bg-primary-50 hover:border-primary-100 transition-all duration-300 flex items-center justify-center group/btn disabled:opacity-50">

                                        {isGenerating[piece.id] ? (
                                            <Activity className="mr-2 h-4 w-4 animate-spin text-primary-500" />
                                        ) : (
                                            <Play className="mr-2 h-4 w-4 fill-primary-600/20 group-hover/btn:scale-110 transition-transform" />
                                        )}

                                        {isGenerating[piece.id]
                                            ? 'Estruturando...'
                                            : piece.status === 'idea' ? 'Estruturar Narrativa' : 'Editar'}
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
