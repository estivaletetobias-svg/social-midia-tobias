"use client";

import { useState, useEffect } from "react";
import { Search, Plus, Sparkles, Zap, CheckCircle2, XCircle, RefreshCcw, Instagram, Linkedin, Youtube, Twitter, Globe } from "lucide-react";

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
            // Load Topics
            const topicsRes = await fetch(`/api/discovery/topics?brandId=${activeBrandId}`);
            const topicsData = await topicsRes.json();
            if (topicsData.success) setTopics(topicsData.data);

            // Load Social Profiles
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
            alert("Escreva um tema ou URL na barra antes de monitorar.");
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
                alert(`Monitoramento Concluído! Gerei ${data.data.savedToLibrary} novas Ideais Customizadas.`);
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
            {/* Unified Creation Header - DARK PREMIUM WITH ORANGE ACCENTS */}
            <div className="bg-[#0A0D14] rounded-[48px] p-12 lg:p-20 text-white relative overflow-hidden shadow-2xl border border-white/5 ring-1 ring-white/10">
                {/* Visual Flair */}
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-orange-500/10 blur-[120px] -mr-40 -mt-40 rounded-full" />
                
                <div className="relative z-10 max-w-4xl space-y-10">
                    <div className="space-y-6">
                        <div className="flex items-center space-x-3">
                            <div className="h-1 w-12 bg-orange-500 rounded-full" />
                            <span className="text-[10px] font-black text-orange-500 uppercase tracking-[0.5em]">Creative Intelligence</span>
                        </div>
                        <h1 className="text-6xl lg:text-8xl font-black tracking-tighter leading-[0.85] uppercase -ml-1">
                            Biblioteca de <br />
                            <span className="text-white/20 hover:text-white transition-colors duration-700">Pautas</span>
                        </h1>
                        <p className="text-xl text-[rgba(255,255,255,0.4)] font-medium leading-relaxed max-w-2xl">
                            O hub onde seus pensamentos se tornam estratégicos. Use a barra abaixo para criar <span className="text-white">do zero</span> ou <span className="text-white">monitorar</span> fontes externas.
                        </p>
                    </div>

                    {/* Omni-Command Bar */}
                    <div className="flex flex-col lg:flex-row gap-6 items-stretch pt-4">
                        <div className="relative flex-1 group">
                            <div className="absolute left-7 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-orange-500 transition-colors">
                                <Sparkles className="h-6 w-6" />
                            </div>
                            <input 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleCommandSubmit()}
                                placeholder="Digite uma ideia, palavra-chave ou cole um Link..."
                                className="w-full h-20 pl-18 pr-6 bg-white/5 border border-white/10 rounded-[30px] focus:outline-none focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500/50 transition-all text-white text-lg font-bold placeholder:text-gray-600 shadow-inner"
                            />
                        </div>
                        <button 
                            onClick={handleCommandSubmit}
                            disabled={!searchQuery.trim() || isGeneratingManual}
                            className="h-20 px-12 bg-orange-500 text-white font-black rounded-[30px] hover:bg-orange-600 transition-all flex items-center justify-center shadow-2xl shadow-orange-500/20 disabled:opacity-50 transform hover:-translate-y-1 active:scale-95 shrink-0 uppercase tracking-widest text-xs"
                        >
                            {isGeneratingManual ? (
                                <RefreshCcw className="h-5 w-5 animate-spin" />
                            ) : (
                                <>
                                    <Zap className="mr-3 h-5 w-5 fill-white" />
                                    Gerar Pauta IA
                                </>
                            )}
                        </button>
                    </div>

                    {/* Quick Radar Actions */}
                    <div className="flex flex-wrap items-center gap-8 pt-8 border-t border-white/15">
                        <div className="flex items-center space-x-2">
                             <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                             <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Radar Ativo:</span>
                        </div>
                        
                        <button 
                            onClick={handleDailyNews}
                            disabled={isSyncing}
                            className="group flex items-center text-[10px] font-black text-white/60 hover:text-orange-500 transition-all uppercase tracking-widest disabled:opacity-50"
                        >
                            <RefreshCcw className={`mr-3 h-4 w-4 ${isSyncing ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
                            Varredura Automática (DNA)
                        </button>
                        
                        <button 
                            onClick={handleSyncRSS}
                            disabled={isSyncing}
                            className="group flex items-center text-[10px] font-black text-white/60 hover:text-orange-500 transition-all uppercase tracking-widest disabled:opacity-50"
                        >
                            <Globe className="mr-3 h-4 w-4 group-hover:scale-110 transition-transform" />
                            Explorar Link / Tópico
                        </button>
                    </div>
                </div>
            </div>

            {/* Selection & Filter Bar */}
            <div className="flex items-center justify-between gap-6 pb-6 pt-4">
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
                        O cofre está vazio. Use a barra acima para começar.
                    </div>
                )}

                {!isLoading && filteredTopics.map((item, i) => {
                    const isNew = item.isNew;
                    return (
                        <div key={item.id || i} className="group relative glass-panel p-10 rounded-[48px] hover:shadow-2xl hover:shadow-orange-500/5 hover:-translate-y-2 transition-all duration-700 flex flex-col h-full overflow-hidden border-white/60 ring-1 ring-black/[0.02]">
                            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/[0.02] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                            
                            {isNew && (
                                <div className="absolute -right-12 top-8 rotate-45 bg-orange-500 text-white text-[9px] font-black px-12 py-1.5 shadow-xl z-20 uppercase tracking-[0.2em] flex items-center justify-center">
                                    <Sparkles className="w-3 h-3 mr-1.5 fill-white" /> Novo
                                </div>
                            )}

                            <div className="relative z-10 flex items-center justify-between mb-8">
                                <div className="flex items-center space-x-2 bg-white/80 backdrop-blur-md text-orange-600 px-4 py-2 rounded-2xl border border-orange-100 shadow-sm">
                                    <Zap className="h-4 w-4 fill-orange-600" />
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
                                    className="flex-1 h-16 bg-white border border-gray-100 shadow-sm text-gray-900 text-xs font-black rounded-[20px] hover:bg-orange-500 hover:border-orange-500 hover:text-white hover:shadow-xl hover:shadow-orange-500/20 transition-all duration-500 flex items-center justify-center uppercase tracking-widest disabled:opacity-50"
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
                                    className="h-16 w-16 bg-white border border-gray-100 shadow-sm text-gray-400 hover:text-red-500 hover:bg-red-50 hover:border-red-100 rounded-[20px] transition-all duration-500 flex items-center justify-center"
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
                                className="w-full h-24 bg-gray-900 text-white font-black rounded-[30px] mt-6 hover:bg-black transition-all flex items-center justify-center shadow-2xl shadow-black/20 disabled:opacity-50 active:scale-95 uppercase tracking-[0.2em] text-xs"
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
