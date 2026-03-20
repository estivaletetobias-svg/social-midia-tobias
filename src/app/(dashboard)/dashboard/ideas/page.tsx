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
            {/* Header - Authority & Context */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-8 md:space-y-0 pb-16 border-b border-gray-100">
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="pulse-indicator" />
                        <span className="text-[10px] font-black text-[#2B3440] uppercase tracking-[0.4em]">Arquitetura Narrativa Ativa</span>
                    </div>
                    <h1 className="text-5xl lg:text-7xl font-black tracking-tight text-gray-900 leading-[0.9] uppercase">
                        Biblioteca <br />
                        <span className="text-gradient">Estratégica</span>
                    </h1>
                    <p className="mt-4 text-xl text-gray-400 font-medium max-w-2xl leading-relaxed">
                        Detectamos as melhores oportunidades de narrativa cruzando o seu DNA com as tendências do mercado.
                    </p>
                </div>
                <div className="shrink-0">
                    <button
                        onClick={handleDailyNews}
                        disabled={isSyncing}
                        className="button-primary h-22 px-12 rounded-[2.5rem] flex items-center justify-center gap-4 group relative overflow-hidden disabled:opacity-50"
                    >
                        {isSyncing ? (
                            <RefreshCcw className="h-6 w-6 animate-spin" />
                        ) : (
                            <Sparkles className="h-6 w-6 fill-white" />
                        )}
                        <span className="text-[11px] font-black uppercase tracking-[0.2em]">{isSyncing ? "Sincronizando Cérebro..." : "Sincronizar Tendências"}</span>
                    </button>
                </div>
            </div>

            {/* Omni command center bar */}
            <div className="bg-white border-2 border-gray-100 p-8 rounded-[3.5rem] shadow-2xl relative">
                <div className="absolute top-0 right-10 -translate-y-1/2">
                    <span className="premium-badge text-[9px]">Command Center</span>
                </div>
                <div className="flex flex-col lg:flex-row items-center gap-6">
                    <div className="flex-1 relative w-full group">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-6 w-6 text-gray-300 group-focus-within:text-[#2B3440] group-focus-within:scale-110 transition-all" />
                        <input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleCommandSubmit()}
                            className="w-full h-20 pl-18 pr-8 bg-gray-50/50 border-2 border-gray-100 rounded-[2rem] focus:outline-none focus:border-[#2B3440] focus:bg-white transition-all font-black text-lg text-[#2B3440] placeholder:text-gray-300 shadow-inner"
                            placeholder="Comande uma nova ideia ou palavra-chave..."
                        />
                    </div>
                    <button
                        onClick={handleCommandSubmit}
                        disabled={isGeneratingManual}
                        className="h-20 px-10 bg-[#2B3440] text-white font-black rounded-[2rem] hover:bg-black transition-all flex items-center gap-3 disabled:opacity-50 shadow-xl hover:shadow-[#2B3440]/20 uppercase tracking-widest text-xs"
                    >
                        {isGeneratingManual ? (
                            <RefreshCcw className="h-5 w-5 animate-spin" />
                        ) : (
                            <Zap className="h-5 w-5 fill-white" />
                        )}
                        <span>Materializar Ideia</span>
                    </button>
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
                    filteredTopics.map((topic, i) => {
                        return (
                            <div key={topic.id || i} className="stelar-card stelar-card-hover p-10 group relative flex flex-col justify-between overflow-hidden">
                                    <div className="absolute -right-6 -top-6 w-24 h-24 bg-gray-50 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-700 pointer-events-none" />
                                    
                                    <div>
                                        <div className="flex items-center justify-between mb-8 relative z-10">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 bg-gray-50 rounded-xl flex items-center justify-center text-[#2B3440] group-hover:bg-[#2B3440] group-hover:text-white transition-all">
                                                    <Sparkles className="h-5 w-5" />
                                                </div>
                                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{topic.platform} {topic.format}</span>
                                            </div>
                                            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-full border border-gray-100 group-hover:bg-[#2B3440] group-hover:text-white transition-all duration-300">
                                                <Zap className="h-3 w-3 fill-amber-500" />
                                                <span className="text-[10px] font-black tracking-tighter">{topic.relevance}%</span>
                                            </div>
                                        </div>

                                        <h3 className="text-2xl font-black text-gray-900 leading-tight mb-4 group-hover:text-[#2B3440] transition-colors relative z-10">{topic.title}</h3>
                                        <p className="text-gray-500 font-medium leading-relaxed text-sm mb-10 opacity-80 group-hover:opacity-100 transition-opacity">
                                            {topic.summary}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-4 pt-10 border-t border-gray-100 relative z-10">
                                        <button
                                            onClick={() => initiateApprove(topic)}
                                            className="flex-1 h-14 bg-[#2B3440] text-white text-[10px] font-black rounded-2xl hover:bg-black transition-all uppercase tracking-widest shadow-lg"
                                        >
                                            Arquitetar
                                        </button>
                                        <button
                                            onClick={() => handleReject(topic.id)}
                                            className="h-14 w-14 border-2 border-gray-100 text-gray-400 hover:text-red-500 hover:border-red-100 rounded-2xl transition-all flex items-center justify-center bg-white"
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
