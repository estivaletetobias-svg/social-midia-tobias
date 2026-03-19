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
            <div className="bg-[#0A0D14] rounded-[60px] p-10 lg:p-16 text-white relative overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.5)] border border-white/5 ring-1 ring-white/10">
                {/* Visual Glows */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 blur-[130px] -mr-40 -mt-40 rounded-full" />
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-orange-500/5 blur-[120px] -ml-20 -mb-20 rounded-full" />
                
                <div className="relative z-10 space-y-12">
                    {/* TOP LINE: TITLE & RADAR */}
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                        <div className="space-y-3">
                            <div className="flex items-center space-x-3">
                                <div className="h-1.5 w-10 bg-gradient-to-r from-orange-500 to-amber-400 rounded-full" />
                                <span className="text-[11px] font-black text-orange-500 uppercase tracking-[0.5em]">Creative Engine</span>
                            </div>
                            <h1 className="text-5xl lg:text-7xl font-black tracking-tighter leading-none uppercase font-[family-name:var(--font-space)]">
                                Biblioteca de <span className="text-white/20">Pautas</span>
                            </h1>
                        </div>

                        {/* PATH: AUTOMATIC RADAR (GLOBAL) */}
                        <button 
                            onClick={handleDailyNews}
                            disabled={isSyncing}
                            className="group relative flex items-center gap-6 p-6 lg:p-8 bg-indigo-500/10 border border-indigo-500/30 hover:border-indigo-500/60 rounded-[35px] transition-all hover:-translate-y-1 hover:shadow-2xl hover:shadow-indigo-500/20 disabled:opacity-40"
                        >
                            <div className="p-4 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-600/30 group-hover:scale-110 transition-transform">
                                <RefreshCcw className={`h-6 w-6 text-white ${isSyncing ? 'animate-spin' : ''}`} />
                            </div>
                            <div className="text-left">
                                <h3 className="text-lg font-black uppercase tracking-tight text-white mb-1">Radar do DNA</h3>
                                <p className="text-xs text-gray-300 font-bold uppercase tracking-widest leading-tight">Varredura automática <br/> nos seus pilares fixos</p>
                            </div>
                        </button>
                    </div>

                    {/* MIDDLE LINE: INPUT COMMAND */}
                    <div className="relative space-y-6">
                        <div className="flex items-center gap-3 ml-8 text-gray-500">
                            <Sparkles className="h-4 w-4" />
                            <span className="text-[10px] font-black uppercase tracking-[0.3em]">No que você está pensando agora?</span>
                        </div>
                        <div className="relative group/input">
                            <input 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Digite um tema, ideia ou cole uma URL aqui..."
                                className="w-full h-24 pl-12 pr-12 bg-white/5 border border-white/10 rounded-[40px] focus:outline-none focus:ring-8 focus:ring-white/5 focus:border-white/30 transition-all text-white text-3xl font-bold placeholder:text-gray-800 shadow-inner"
                            />
                            {/* Connection Visuals */}
                            <div className="absolute -bottom-12 left-1/4 w-[2px] h-12 bg-gradient-to-b from-white/10 to-orange-500/30" />
                            <div className="absolute -bottom-12 right-1/4 w-[2px] h-12 bg-gradient-to-b from-white/10 to-emerald-500/30" />
                        </div>
                    </div>

                    {/* BOTTOM LINE: DEPENDENT ACTIONS */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6">
                        {/* PATH 1: MANUAL/AI CREATION */}
                        <button 
                            onClick={handleCommandSubmit}
                            disabled={!searchQuery.trim() || isGeneratingManual}
                            className="group relative flex items-center gap-8 p-10 bg-white/5 border border-white/10 hover:border-orange-500/50 rounded-[40px] transition-all hover:-translate-y-1 hover:shadow-2xl hover:shadow-orange-500/10 disabled:opacity-20"
                        >
                            <div className="p-5 bg-orange-500 rounded-3xl shadow-xl shadow-orange-500/20 group-hover:rotate-12 transition-transform">
                                <Zap className="h-8 w-8 text-white fill-white" />
                            </div>
                            <div className="text-left space-y-1">
                                <div className="flex items-center gap-3">
                                    <h3 className="text-xl font-black uppercase tracking-tight text-white italic">Lapidar Ideia</h3>
                                    <Plus className="h-5 w-5 text-orange-500 animate-pulse" />
                                </div>
                                <p className="text-sm text-gray-300 font-bold leading-relaxed max-w-[280px]">Transforma seu comando em uma pauta estratégica de autoridade.</p>
                            </div>
                        </button>

                        {/* PATH 2: WEB RESEARCH */}
                        <button 
                            onClick={handleSyncRSS}
                            disabled={!searchQuery.trim() || isSyncing}
                            className="group relative flex items-center gap-8 p-10 bg-white/5 border border-white/10 hover:border-emerald-500/50 rounded-[40px] transition-all hover:-translate-y-1 hover:shadow-2xl hover:shadow-emerald-500/10 disabled:opacity-20"
                        >
                            <div className="p-5 bg-emerald-500 rounded-3xl shadow-xl shadow-emerald-500/20 group-hover:scale-110 transition-transform">
                                <Globe className="h-8 w-8 text-white" />
                            </div>
                            <div className="text-left space-y-1">
                                <h3 className="text-xl font-black uppercase tracking-tight text-white italic">Explorar na Web</h3>
                                <p className="text-sm text-gray-300 font-bold leading-relaxed max-w-[280px]">Busca referências atuais e cria 5+ ganchos magnéticos.</p>
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
                {isLoading && (
                    <div className="col-span-1 md:col-span-2 lg:col-span-3 text-center py-20 animate-pulse text-gray-400 font-black uppercase tracking-widest text-xs">
                        Sincronizando com o cérebro da marca...
                    </div>
                )}

                {!isLoading && topics.length === 0 && (
                    <div className="col-span-1 md:col-span-2 lg:col-span-3 text-center py-32 text-gray-300 font-black uppercase tracking-[0.2em] text-xs glass-panel rounded-[48px]">
                        O cofre está vazio. Use os caminhos acima para começar.
                    </div>
                )}

                {!isLoading && filteredTopics.map((item, i) => {
                    const isNew = item.isNew;
                    return (
                        <div key={item.id || i} className="group relative glass-panel p-10 rounded-[48px] hover:shadow-2xl hover:shadow-black/5 hover:-translate-y-2 transition-all duration-700 flex flex-col h-full overflow-hidden border-white/60 ring-1 ring-black/[0.02]">
                            {isNew && (
                                <div className="absolute -right-12 top-8 rotate-45 bg-orange-500 text-white text-[9px] font-black px-12 py-1.5 shadow-xl z-20 uppercase tracking-[0.2em] flex items-center justify-center">
                                    <Sparkles className="w-3 h-3 mr-1.5 fill-white" /> Novo
                                </div>
                            )}

                            <div className="relative z-10 flex items-center justify-between mb-8">
                                <div className="flex items-center space-x-2 bg-gray-50 text-gray-900 px-4 py-2 rounded-2xl border border-gray-100">
                                    <Zap className="h-4 w-4 fill-orange-500 text-orange-500" />
                                    <span className="text-[10px] font-black tracking-widest uppercase">{item.relevanceScore ? (item.relevanceScore * 100).toFixed(0) : '95'}%</span>
                                </div>
                                <span className="text-[10px] font-black tracking-[0.2em] text-gray-400 bg-gray-50 px-4 py-2 rounded-full uppercase border border-gray-100">
                                    {item.platform}
                                </span>
                            </div>

                            <h3 className="relative z-10 text-2xl font-black text-gray-900 leading-tight group-hover:text-orange-600 transition-colors tracking-tight">{item.title}</h3>
                            <p className="relative z-10 mt-6 text-gray-500 font-medium leading-relaxed flex-grow text-lg line-clamp-4">{item.summary}</p>

                            <div className="relative z-10 mt-10 flex items-center pt-8 border-t border-black/[0.03] space-x-3">
                                <button
                                    onClick={() => initiateApprove(item)}
                                    disabled={isApproveLoading[item.id]}
                                    className="flex-1 h-16 bg-white border border-gray-100 shadow-sm text-gray-900 text-[10px] font-black rounded-[20px] hover:bg-orange-500 hover:border-orange-500 hover:text-white hover:shadow-xl hover:shadow-orange-500/20 transition-all duration-500 flex items-center justify-center uppercase tracking-widest disabled:opacity-50"
                                >
                                    {isApproveLoading[item.id] ? (
                                        <RefreshCcw className="h-5 w-5 animate-spin" />
                                    ) : (
                                        <>
                                            <CheckCircle2 className="mr-2.5 h-5 w-5" />
                                            Aprovar
                                        </>
                                    )}
                                </button>
                                <button
                                    onClick={() => handleReject(item.id)}
                                    className="h-16 w-16 bg-white border border-gray-100 shadow-sm text-gray-300 hover:text-red-500 hover:bg-red-50 hover:border-red-100 rounded-[20px] transition-all duration-500 flex items-center justify-center"
                                >
                                    <XCircle className="h-6 w-6" />
                                </button>
                            </div>
                        </div>
                    );
                })}
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
