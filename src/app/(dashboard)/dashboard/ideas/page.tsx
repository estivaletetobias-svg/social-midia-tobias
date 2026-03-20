"use client";

import { useState, useEffect } from "react";
import { Search, Sparkles, Zap, CheckCircle2, XCircle, RefreshCcw, Instagram, Linkedin, Youtube, Twitter, Globe, Info, Plus } from "lucide-react";

export default function IdeasLibrary() {
    const [isSyncing, setIsSyncing] = useState(false);
    const [topics, setTopics] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isApproveLoading, setIsApproveLoading] = useState<Record<string, boolean>>({});
    const [socialProfiles, setSocialProfiles] = useState<any[]>([]);

    // Modal Aprovação
    const [topicToApprove, setTopicToApprove] = useState<any>(null);
    const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
    const [selectedFormat, setSelectedFormat] = useState<string>('carousel');

    // Filtros e Pesquisa Única (Omni)
    const [searchQuery, setSearchQuery] = useState("");
    const [activeCategory, setActiveCategory] = useState("Todos os Tópicos");

    const [isGeneratingManual, setIsGeneratingManual] = useState(false);

    const loadTopics = async () => {
        const activeBrandId = localStorage.getItem('active_brand_id');
        if (!activeBrandId) {
            setIsLoading(false);
            return;
        }

        try {
            const topicsRes = await fetch(`/api/discovery/topics?brandId=${activeBrandId}`);
            const topicsData = await topicsRes.json();
            if (topicsData.success) setTopics(topicsData.data);

            const dnaRes = await fetch(`/api/brand/dna?id=${activeBrandId}`);
            const dnaData = await dnaRes.json();
            if (dnaData.success && dnaData.data.socialProfiles) {
                setSocialProfiles(dnaData.data.socialProfiles.filter((p: any) => p.isActive));
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadTopics();
    }, []);

    const initiateApprove = (topic: any) => {
        setTopicToApprove(topic);
        setSelectedPlatforms([topic.platform]);
        setSelectedFormat(topic.format || 'carousel');
    };

    const handleConfirmApprove = async () => {
        if (!topicToApprove) return;
        const topicId = topicToApprove.id;
        
        setIsApproveLoading(prev => ({ ...prev, [topicId]: true }));
        try {
            const res = await fetch(`/api/discovery/topics/${topicId}/approve`, { 
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    platforms: selectedPlatforms,
                    format: selectedFormat
                })
            });
            const data = await res.json();
            if (data.success) {
                setTopics(topics.filter(t => t.id !== topicId));
                setTopicToApprove(null);
                alert(`Sucesso! Criamos ${selectedPlatforms.length} peças na sua esteira de produção.`);
            } else {
                alert(`Erro ao aprovar: ${data.error}`);
            }
        } catch (e) {
            console.error(e);
            alert('Falha na comunicação.');
        } finally {
            setIsApproveLoading(prev => ({ ...prev, [topicId]: false }));
        }
    };

    const handleReject = async (topicId: string) => {
        try {
            const res = await fetch(`/api/discovery/topics/${topicId}`, {
                method: 'DELETE'
            });
            const data = await res.json();
            if (data.success) {
                setTopics(topics.filter(t => t.id !== topicId));
            } else {
                alert(`Erro ao excluir: ${data.error}`);
            }
        } catch (error) {
            console.error(error);
            alert('Falha ao excluir ideia.');
        }
    };

    const handleCommandSubmit = async () => {
        const activeBrandId = localStorage.getItem('active_brand_id');
        if (!activeBrandId) return;
        if (!searchQuery.trim()) {
            alert("Escreva uma ideia ou palavra-chave na barra para começar.");
            return;
        }

        setIsGeneratingManual(true);
        try {
            const res = await fetch('/api/discovery/manual-idea', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    text: searchQuery,
                    brandId: activeBrandId
                })
            });
            const data = await res.json();
            if (data.success) {
                setSearchQuery("");
                loadTopics();
            } else {
                alert(`Erro: ${data.error}`);
            }
        } catch (error) {
            console.error(error);
            alert('Falha ao acionar Inteligência Artificial.');
        } finally {
            setIsGeneratingManual(false);
        }
    };

    const handleDailyNews = async () => {
        const activeBrandId = localStorage.getItem('active_brand_id');
        if (!activeBrandId) return;

        setIsSyncing(true);
        try {
            const res = await fetch('/api/discovery/daily-trends', { 
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ brandId: activeBrandId })
            });
            const data = await res.json();
            if (data.success) {
                alert(`Radar Ativo: Analisei as principais notícias dos seus pilares e gerei ${data.data.savedToLibrary} novas pautas quentes.`);
                loadTopics();
            } else {
                alert(`Aviso: Algumas fontes podem estar fora do ar. (${data.error})`);
            }
        } catch (error) {
            console.error(error);
            alert('Falha na comunicação com o Motor de Notícias.');
        } finally {
            setIsSyncing(false);
        }
    };

    const handleSyncRSS = async () => {
        const activeBrandId = localStorage.getItem('active_brand_id');
        if (!activeBrandId) return;
        
        const termToUse = searchQuery || "";
        if (!termToUse) {
            alert("Escreva um tema ou URL na barra antes de pesquisar na web.");
            return;
        }

        setIsSyncing(true);
        try {
            const res = await fetch('/api/discovery/sync-rss', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    feedUrl: termToUse,
                    brandId: activeBrandId
                })
            });
            const data = await res.json();
            if (data.success) {
                alert(`Pesquisa Web Concluída! Encontrei ${data.data.savedToLibrary} notícias e gerei pautas exclusivas.`);
                loadTopics();
            } else {
                alert(`Erro: ${data.error}`);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsSyncing(false);
        }
    };

    const categories = ["Todos os Tópicos", "Tendências", "Ganchos Virais", "Atemporal", "Novidades"];

    const filteredTopics = topics.filter(t => {
        const titleMatch = t.title ? t.title.toLowerCase().includes(searchQuery.toLowerCase()) : false;
        const summaryMatch = t.summary ? t.summary.toLowerCase().includes(searchQuery.toLowerCase()) : false;
        const matchesSearch = titleMatch || summaryMatch;

        if (!matchesSearch) return false;

        if (activeCategory === "Todos os Tópicos") return true;
        if (activeCategory === "Tendências") return (t.relevanceScore || 0) >= 0.7;
        if (activeCategory === "Ganchos Virais") return t.format?.toLowerCase().includes('script') || t.format?.toLowerCase().includes('short');
        if (activeCategory === "Atemporal") return (t.alignmentScore || 0) >= 0.7;
        if (activeCategory === "Novidades") return t.isNew === true;

        return true;
    });

    return (
        <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-1000">
            {/* 3-PATH INTELLIGENCE HUB HEADER */}
            {/* 3-PATH INTELLIGENCE HUB HEADER */}
            <div className="bg-white border border-gray-200 rounded-[3rem] p-10 lg:p-16 shadow-sm relative overflow-hidden">
                <div className="relative z-10 space-y-16">
                    {/* TOP LINE: TITLE & RADAR */}
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 border-b border-gray-100 pb-12">
                        <div className="space-y-4">
                            <div className="flex items-center space-x-3">
                                <div className="h-1.5 w-10 bg-[#2B3440] rounded-full" />
                                <span className="text-[10px] font-black text-[#2B3440] uppercase tracking-[0.4em]">Arquitetura Narrativa</span>
                            </div>
                            <h1 className="text-5xl lg:text-7xl font-black tracking-tighter leading-none uppercase text-[#2B3440]">
                                Biblioteca de <span className="text-gray-300">Pautas</span>
                            </h1>
                        </div>

                        {/* PATH: AUTOMATIC RADAR (GLOBAL) */}
                        <button 
                            onClick={handleDailyNews}
                            disabled={isSyncing}
                            className="group relative flex items-center gap-6 p-6 lg:p-8 bg-gray-50 border border-gray-200 rounded-[35px] transition-all hover:bg-white hover:border-[#2B3440] hover:shadow-xl hover:shadow-[#2B3440]/5 disabled:opacity-50"
                        >
                            <div className="p-4 bg-[#2B3440] rounded-2xl shadow-lg">
                                <RefreshCcw className={`h-6 w-6 text-white ${isSyncing ? 'animate-spin' : ''}`} />
                            </div>
                            <div className="text-left">
                                <h3 className="text-lg font-black uppercase tracking-tight text-[#2B3440] mb-1">Radar Estratégico</h3>
                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-tight">Varredura automática <br/> vinculada ao seu DNA</p>
                            </div>
                        </button>
                    </div>

                    {/* MIDDLE LINE: INPUT COMMAND */}
                    <div className="relative space-y-6">
                        <div className="flex items-center gap-3 ml-4 text-gray-400">
                            <Sparkles className="h-4 w-4 text-[#2B3440]" />
                            <span className="text-[10px] font-black uppercase tracking-[0.3em]">Qual o tema da próxima narrativa?</span>
                        </div>
                        <div className="relative group/input">
                            <input 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Digite um tema, ideia ou URL estratégica aqui..."
                                className="w-full h-24 pl-10 pr-10 bg-gray-50 border border-gray-100 rounded-[40px] focus:outline-none focus:ring-8 focus:ring-[#2B3440]/5 focus:border-[#2B3440]/30 transition-all text-[#2B3440] text-3xl font-black placeholder:text-gray-300 shadow-inner"
                            />
                        </div>
                    </div>

                    {/* BOTTOM LINE: DEPENDENT ACTIONS */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6">
                        {/* PATH 1: MANUAL/AI CREATION */}
                        <button 
                            onClick={handleCommandSubmit}
                            disabled={!searchQuery.trim() || isGeneratingManual}
                            className="group relative flex items-center gap-8 p-10 bg-white border border-gray-200 rounded-[40px] transition-all hover:border-[#2B3440] hover:shadow-2xl hover:shadow-[#2B3440]/10 disabled:opacity-50"
                        >
                            <div className="p-4 bg-gray-100 group-hover:bg-[#2B3440] text-gray-400 group-hover:text-white rounded-2xl transition-colors">
                                <Zap className="h-6 w-6 fill-current" />
                            </div>
                            <div className="text-left">
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className="text-lg font-black uppercase tracking-tight text-[#2B3440]">Lapidar Ideia</h3>
                                    <Plus className="h-4 w-4 text-gray-300" />
                                </div>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-tight">Converte seu comando em <br/> pauta de alta autoridade</p>
                            </div>
                        </button>

                        {/* PATH 2: WEB RESEARCH */}
                        <button 
                            onClick={handleSyncRSS}
                            disabled={!searchQuery.trim() || isSyncing}
                            className="group relative flex items-center gap-8 p-10 bg-white border border-gray-200 rounded-[40px] transition-all hover:border-[#2B3440] hover:shadow-2xl hover:shadow-[#2B3440]/10 disabled:opacity-50"
                        >
                            <div className="p-4 bg-gray-100 group-hover:bg-[#2B3440] text-gray-400 group-hover:text-white rounded-2xl transition-colors">
                                <Globe className="h-6 w-6" />
                            </div>
                            <div className="text-left">
                                <h3 className="text-lg font-black uppercase tracking-tight text-[#2B3440] mb-1">Explorar Repertório Web</h3>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-tight">Busca referências atuais <br/> e estrutura novas abordagens</p>
                            </div>
                        </button>
                    </div>
                </div>
            </div>


            {/* Filter Bar */}
            <div className="flex items-center justify-between gap-6">
                <div className="flex items-center space-x-2 bg-gray-50 p-2 rounded-[24px] border border-gray-100 shadow-sm">
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={`px-6 py-3 text-[10px] font-black rounded-[18px] transition-all uppercase tracking-widest ${activeCategory === cat ? "bg-white text-gray-900 shadow-sm border border-gray-200" : "text-gray-400 hover:text-gray-900 border border-transparent"}`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    {filteredTopics.length} Tópicos Encontrados
                </div>
            </div>

            {/* Topics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-20">
                {isLoading ? (
                    <div className="col-span-1 md:col-span-2 lg:col-span-3 text-center py-20 animate-pulse text-gray-400 font-black uppercase tracking-widest text-xs">
                        Sincronizando com o cérebro da marca...
                    </div>
                ) : topics.length === 0 ? (
                    <div className="col-span-1 md:col-span-2 lg:col-span-3 text-center py-32 text-gray-300 font-black uppercase tracking-[0.2em] text-xs bg-gray-50 border border-gray-100 rounded-[48px]">
                        O cofre está vazio. Use os caminhos acima para começar.
                    </div>
                ) : (
                    filteredTopics.map((item, i) => {
                        const isNew = item.isNew;
                        return (
                            <div key={item.id || i} className="group relative bg-white border border-gray-200 p-10 rounded-[48px] hover:shadow-xl hover:border-[#2B3440]/30 transition-all duration-700 flex flex-col h-full overflow-hidden shadow-sm">
                                {isNew && (
                                    <div className="absolute -right-12 top-8 rotate-45 bg-[#2B3440] text-white text-[9px] font-black px-12 py-1.5 shadow-xl z-20 uppercase tracking-[0.2em] flex items-center justify-center">
                                        <Sparkles className="w-3 h-3 mr-1.5 fill-white" /> Novo
                                    </div>
                                )}

                                <div className="relative z-10 flex items-center justify-between mb-8">
                                    <div className="flex items-center space-x-2 bg-gray-50 text-[#2B3440] px-4 py-2 rounded-2xl border border-gray-100">
                                        <Zap className="h-4 w-4 fill-[#2B3440]/20 text-[#2B3440]" />
                                        <span className="text-[10px] font-black tracking-widest uppercase">{item.relevanceScore ? (item.relevanceScore * 100).toFixed(0) : '95'}% Sincronia</span>
                                    </div>
                                </div>

                                <h3 className="relative z-10 text-2xl font-black text-[#2B3440] leading-[1.1] mb-4 tracking-tight uppercase">{item.title}</h3>
                                <p className="relative z-10 mt-6 text-gray-500 font-medium leading-relaxed flex-grow text-[15px] line-clamp-4 font-serif italic">{item.summary}</p>

                                <div className="relative z-10 mt-10 flex items-center pt-8 border-t border-gray-100 space-x-3">
                                    <button
                                        onClick={() => initiateApprove(item)}
                                        disabled={isApproveLoading[item.id]}
                                        className="flex-1 h-16 bg-[#2B3440] text-white text-[10px] font-black rounded-[20px] hover:bg-[#3a4655] transition-all duration-500 flex items-center justify-center uppercase tracking-widest disabled:opacity-50"
                                    >
                                        {isApproveLoading[item.id] ? (
                                            <RefreshCcw className="h-5 w-5 animate-spin" />
                                        ) : (
                                            <>
                                                <CheckCircle2 className="mr-2.5 h-5 w-5" />
                                                Aprovar Pauta
                                            </>
                                        )}
                                    </button>
                                    <button
                                        onClick={() => handleReject(item.id)}
                                        className="h-16 w-16 bg-white border border-gray-100 text-gray-300 hover:text-red-500 hover:bg-red-50 hover:border-red-100 rounded-[20px] transition-all duration-500 flex items-center justify-center"
                                    >
                                        <XCircle className="h-6 w-6" />
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>


            {/* Modal Aprovação */}
            {topicToApprove && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[48px] shadow-2xl w-full max-w-xl overflow-hidden transform animate-in zoom-in duration-500">
                        <div className="p-12 border-b border-gray-100 items-start flex justify-between">
                            <div>
                                <span className="inline-block px-4 py-1.5 rounded-full bg-orange-50 text-orange-600 text-[10px] font-black uppercase tracking-widest mb-6 border border-orange-100">Workflow de Produção</span>
                                <h3 className="text-4xl font-black text-gray-900 leading-tight tracking-tighter">Para onde vamos <span className="text-orange-500 italic">produzir</span>?</h3>
                            </div>
                            <button onClick={() => setTopicToApprove(null)} className="text-gray-300 hover:text-gray-900 transition-colors">
                                <XCircle className="w-10 h-10" />
                            </button>
                        </div>
                        
                        <div className="p-12 space-y-10">
                            <div className="grid grid-cols-2 gap-4">
                                {(socialProfiles.length > 0 ? socialProfiles : [
                                    { platform: 'instagram' }, { platform: 'linkedin' }, { platform: 'youtube' }, { platform: 'tiktok' }
                                ]).map((profile) => {
                                    const platform = profile.platform.toLowerCase();
                                    const isSelected = selectedPlatforms.some(p => p.toLowerCase() === platform);
                                    
                                    const icons: Record<string, any> = {
                                        instagram: Instagram,
                                        linkedin: Linkedin,
                                        youtube: Youtube,
                                        twitter: Twitter,
                                        tiktok: Globe,
                                        site: Globe
                                    };
                                    const Icon = icons[platform] || Globe;

                                    return (
                                        <button
                                            key={platform}
                                            onClick={() => {
                                                if (isSelected) setSelectedPlatforms(selectedPlatforms.filter(p => p.toLowerCase() !== platform));
                                                else setSelectedPlatforms([...selectedPlatforms, profile.platform]);
                                            }}
                                            className={`flex items-center gap-4 p-6 rounded-3xl border-2 transition-all text-left ${isSelected ? 'border-orange-500 bg-orange-50 shadow-inner' : 'border-gray-50 hover:border-gray-100 hover:bg-gray-50'}`}
                                        >
                                            <div className={`p-3 rounded-2xl ${isSelected ? 'bg-orange-500 text-white' : 'bg-white text-gray-300 border border-gray-100'}`}>
                                                <Icon className="w-6 h-6" />
                                            </div>
                                            <span className={`font-black uppercase tracking-widest text-[10px] ${isSelected ? 'text-orange-700' : 'text-gray-400'}`}>
                                                {platform}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="space-y-6">
                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Formato da Entrega</span>
                                <div className="grid grid-cols-3 gap-4">
                                    {[
                                        { id: 'carousel', label: 'Carrossel', icon: Sparkles },
                                        { id: 'short post', label: 'Post Estático', icon: Zap },
                                        { id: 'video script', label: 'Roteiro Vídeo', icon: Youtube },
                                    ].map((f) => (
                                        <button
                                            key={f.id}
                                            onClick={() => setSelectedFormat(f.id)}
                                            className={`flex flex-col items-center justify-center p-5 rounded-[24px] border-2 transition-all gap-3 ${selectedFormat === f.id ? 'border-orange-500 bg-orange-50' : 'border-gray-50 bg-gray-50/50 hover:bg-gray-100'}`}
                                        >
                                            <f.icon className={`w-6 h-6 ${selectedFormat === f.id ? 'text-orange-500' : 'text-gray-300'}`} />
                                            <span className={`text-[10px] font-black uppercase tracking-tight ${selectedFormat === f.id ? 'text-orange-700' : 'text-gray-400'}`}>
                                                {f.label}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button
                                onClick={handleConfirmApprove}
                                disabled={selectedPlatforms.length === 0 || isApproveLoading[topicToApprove.id]}
                                className="w-full h-24 bg-gray-900 text-white font-black rounded-[30px] mt-6 hover:bg-black transition-all flex items-center justify-center shadow-2xl shadow-black/20 disabled:opacity-50 active:scale-95 uppercase tracking-[0.2em] text-[10px]"
                            >
                                {isApproveLoading[topicToApprove.id] ? (
                                    <RefreshCcw className="h-6 w-6 animate-spin" />
                                ) : (
                                    <>Criar {selectedPlatforms.length} Peças em {selectedFormat}</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
