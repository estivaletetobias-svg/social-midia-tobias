"use client";

import { useState, useEffect } from "react";
import { Search, PenTool, LayoutTemplate, MessageSquare, FastForward, Play, Activity, Loader2 } from "lucide-react";
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
        <div className="max-w-7xl mx-auto space-y-16 py-10 animate-in fade-in slide-in-from-bottom-6 duration-1000 pb-32">
            
            {/* Header - Proprietary Engine Level */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-12 border-b border-gray-100 pb-16">
                <div className="space-y-6 flex-1">
                    <div className="flex items-center gap-3">
                        <div className="pulse-indicator" />
                        <span className="text-[10px] font-black text-[#2B3440] uppercase tracking-[0.4em]">Motor de Produção Ativo</span>
                    </div>
                    <h1 className="text-6xl lg:text-8xl font-black tracking-tight text-gray-900 leading-[0.85] uppercase">
                        Esteira <br />
                        <span className="text-gradient">de Produção</span>
                    </h1>
                    <p className="text-xl text-gray-400 font-medium max-w-xl leading-relaxed">
                        Transforme pautas brutas em narrativas de alta autoridade. O sistema STELAR processa cada peça cruzando seu DNA com o repertório do cérebro.
                    </p>
                </div>
                <div className="shrink-0">
                    <button
                        onClick={() => alert("Em breve! Por enquanto deixe a Inteligência Artificial trabalhar por você aprovando ideias!")}
                        className="button-primary h-22 px-14 rounded-[2.5rem] text-[11px] flex items-center group relative overflow-hidden shadow-2xl shadow-[#2B3440]/20"
                    >
                        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <PenTool className="mr-5 h-6 w-6 fill-white" />
                        <span className="uppercase tracking-[0.2em] text-xs font-black">Arquitetar Conteúdo</span>
                        <FastForward className="ml-5 h-6 w-6 transform group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </div>

            {/* Omni Filters & Control Center */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                <div className="flex items-center p-2 bg-gray-50 border-2 border-gray-100 rounded-[2.5rem] w-full lg:w-auto overflow-x-auto no-scrollbar shadow-inner">
                    {tabs.map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-10 py-5 text-[10px] font-black rounded-[2rem] transition-all uppercase tracking-[0.2em] whitespace-nowrap ${activeTab === tab
                                ? "bg-[#2B3440] text-white shadow-2xl"
                                : "text-gray-400 hover:text-gray-900"
                                }`}
                        >
                            {statusLabels[tab]}
                        </button>
                    ))}
                </div>
                <div className="relative w-full lg:w-[450px] group">
                    <Search className="absolute left-8 top-1/2 -translate-y-1/2 h-6 w-6 text-gray-400 group-focus-within:text-[#2B3440] transition-colors" />
                    <input
                        className="w-full h-20 pl-20 pr-10 bg-white border-2 border-gray-100 rounded-[2.5rem] focus:outline-none focus:border-[#2B3440] transition-all font-black text-xl text-gray-900 placeholder:text-gray-300 shadow-sm"
                        placeholder="Rastrear produção..."
                    />
                </div>
            </div>

            {/* Industrial Pipeline Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
                {isLoading ? (
                    <div className="col-span-full py-32 text-center space-y-6">
                        <div className="h-16 w-16 border-4 border-[#2B3440]/10 border-t-[#2B3440] rounded-full animate-spin mx-auto" />
                        <p className="text-sm font-black text-gray-400 uppercase tracking-[0.4em]">Sincronizando Esteira Industrial...</p>
                    </div>
                ) : pieces.length === 0 ? (
                    <div className="col-span-full p-24 text-center bg-gray-50 border-4 border-dashed border-gray-100 rounded-[4rem]">
                         <div className="h-24 w-24 bg-white rounded-full flex items-center justify-center mx-auto mb-10 shadow-xl">
                            <PenTool className="h-10 w-10 text-gray-200" />
                         </div>
                         <h3 className="text-3xl font-black text-gray-900 uppercase tracking-tighter mb-4">Nenhuma Pauta em Produção</h3>
                         <p className="text-gray-400 font-medium text-lg max-w-md mx-auto leading-relaxed">
                            Vá em "Biblioteca de Ideias" e aprove alguma pauta estratégica para iniciar a máquina de produção.
                         </p>
                    </div>
                ) : (
                    pieces.map((piece) => (
                        <div key={piece.id} className="stelar-card p-12 group hover:translate-y-[-8px] transition-all duration-700 shadow-3xl flex flex-col gap-10 border-2 border-transparent hover:border-[#2B3440]/10">
                            
                            <div className="flex items-start justify-between">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-4">
                                        <div className="px-5 py-2.5 bg-[#2B3440] text-white text-[9px] font-black tracking-[0.3em] uppercase rounded-xl flex items-center gap-2 shadow-lg">
                                            <div className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
                                            {piece.platform}
                                        </div>
                                        <span className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">{piece.format}</span>
                                    </div>
                                    <h3 className="text-3xl font-black text-gray-900 leading-[1.1] uppercase tracking-tighter group-hover:text-[#2B3440] transition-colors">
                                        {piece.title}
                                    </h3>
                                </div>
                                <div className="h-16 w-16 bg-gray-50 rounded-2xl flex items-center justify-center group-hover:bg-[#2B3440] group-hover:text-white transition-all duration-500 shadow-inner">
                                    <LayoutTemplate className="h-7 w-7" />
                                </div>
                            </div>

                            <p className="text-lg text-gray-400 font-medium leading-relaxed line-clamp-2">
                                {piece.goal}
                            </p>

                            <div className="pt-10 border-t border-gray-100 flex items-center justify-between mt-auto">
                                <div className="flex items-center gap-3">
                                    <div className={`h-3 w-3 rounded-full ${piece.status === 'idea' ? 'bg-amber-400' : 'bg-green-500'} shadow-lg shadow-current/20`} />
                                    <span className="text-[11px] font-black text-gray-900 uppercase tracking-[0.2em]">
                                        {statusLabels[piece.status] || piece.status}
                                    </span>
                                </div>

                                <button
                                    onClick={() => piece.status === 'idea' ? handleGenerate(piece.id) : router.push(`/dashboard/content/${piece.id}`)}
                                    disabled={isGenerating[piece.id]}
                                    className="h-16 px-8 bg-gray-50 text-[#2B3440] text-[11px] font-black rounded-2xl hover:bg-[#2B3440] hover:text-white transition-all duration-500 flex items-center gap-4 border-2 border-transparent hover:border-[#2B3440] shadow-sm disabled:opacity-50 group/action"
                                >
                                    {isGenerating[piece.id] ? (
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                    ) : (
                                        <Play className="h-5 w-5 fill-current opacity-30 group-hover/action:opacity-100 transition-opacity" />
                                    )}
                                    <span className="uppercase tracking-[0.2em]">
                                        {isGenerating[piece.id]
                                            ? 'Arquitetando Narrativa...'
                                            : piece.status === 'idea' ? 'Estruturar Agora' : 'Editar Refinamento'}
                                    </span>
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
