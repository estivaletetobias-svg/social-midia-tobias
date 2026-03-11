"use client";

import { useState, useEffect } from "react";
import { Search, Plus, Sparkles, Zap, CheckCircle2, XCircle, RefreshCcw, Instagram, Linkedin, Youtube, Twitter, Globe } from "lucide-react";

export default function IdeasLibrary() {
    const [isSyncing, setIsSyncing] = useState(false);
    const [rssUrl, setRssUrl] = useState("Hipertrofia e Performance");
    const [topics, setTopics] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isApproveLoading, setIsApproveLoading] = useState<Record<string, boolean>>({});
    const [socialProfiles, setSocialProfiles] = useState<any[]>([]);

    // Modal Aprovação
    const [topicToApprove, setTopicToApprove] = useState<any>(null);
    const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
    const [selectedFormat, setSelectedFormat] = useState<string>('carousel');

    // Filtros e Pesquisa
    const [searchQuery, setSearchQuery] = useState("");
    const [activeCategory, setActiveCategory] = useState("Todos os Tópicos");

    // Modal definitions
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [manualIdea, setManualIdea] = useState("");
    const [isGeneratingManual, setIsGeneratingManual] = useState(false);

    const loadTopics = async () => {
        setIsLoading(true);
        try {
            // Load Topics
            const topicsRes = await fetch('/api/discovery/topics');
            const topicsData = await topicsRes.json();
            if (topicsData.success) setTopics(topicsData.data);

            // Load Social Profiles
            const dnaRes = await fetch('/api/brand/dna');
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
        // Default to the original platform and format of the topic
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

    const handleReject = (topicId: string) => {
        setTopics(topics.filter(t => t.id !== topicId));
    };

    const handleManualIdeaSubmit = async () => {
        if (!manualIdea.trim()) return;
        setIsGeneratingManual(true);
        try {
            const res = await fetch('/api/discovery/manual-idea', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: manualIdea })
            });
            const data = await res.json();
            if (data.success) {
                setIsModalOpen(false);
                setManualIdea("");
                loadTopics(); // Atualiza a tela com o card da nova ideia formatada pela IA
            } else {
                alert(`Erro: ${data.error}`);
            }
        } catch (error) {
            console.error(error);
            alert('Falha ao acionar Inteligência Artificial para refinar o pedido.');
        } finally {
            setIsGeneratingManual(false);
        }
    };

    const handleDailyNews = async () => {
        setIsSyncing(true);
        try {
            const res = await fetch('/api/discovery/daily-trends', { method: 'POST' });
            const data = await res.json();
            if (data.success) {
                alert(`Motor Diário: Analisei as principais notícias dos seus pilares e gerei ${data.data.savedToLibrary} novas pautas quentes para você hoje.`);
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
        setIsSyncing(true);
        try {
            const res = await fetch('/api/discovery/sync-rss', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ feedUrl: rssUrl })
            });
            const data = await res.json();
            if (data.success) {
                alert(`Sucesso! Li ${data.data.scraped} notícias e gerei ${data.data.savedToLibrary} novas Ideias Customizadas no formato da sua marca.`);
                loadTopics();
            } else {
                alert(`Erro: ${data.error}`);
            }
        } catch (error) {
            console.error(error);
            alert('Falha ao acionar a sincronização em segundo plano.');
        } finally {
            setIsSyncing(false);
        }
    };

    const categories = ["Todos os Tópicos", "Tendências", "Ganchos Virais", "Atemporal", "Novidades do Produto"];

    const filteredTopics = topics.filter(t => {
        const titleMatch = t.title ? t.title.toLowerCase().includes(searchQuery.toLowerCase()) : false;
        const summaryMatch = t.summary ? t.summary.toLowerCase().includes(searchQuery.toLowerCase()) : false;
        const matchesSearch = titleMatch || summaryMatch;

        if (!matchesSearch) return false;

        if (activeCategory === "Todos os Tópicos") return true;
        if (activeCategory === "Tendências") return (t.relevanceScore || 0) >= 0.8;
        if (activeCategory === "Ganchos Virais") return t.format === 'video script' || t.format === 'short post' || t.format === 'short video script';
        if (activeCategory === "Atemporal") return (t.alignmentScore || 0) >= 0.8;
        if (activeCategory === "Novidades do Produto") return t.platform === 'LinkedIn';

        return true;
    });

    return (
        <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-1000">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-6 md:space-y-0 pb-10 border-b border-black/5">
                <div>
                    <div className="flex items-center space-x-3 mb-3 animate-fade-in">
                        <Sparkles className="h-5 w-5 text-primary-500 fill-primary-500/20" />
                        <span className="text-sm font-black text-primary-600/80 uppercase tracking-[0.2em] shadow-sm">Business Intelligence & Trends</span>
                    </div>
                    <h1 className="text-5xl lg:text-7xl font-black tracking-tighter text-gray-900 leading-tight">
                        Ideas <span className="text-primary-500">Library</span>
                    </h1>
                    <p className="mt-5 text-xl text-gray-500/80 max-w-3xl font-medium leading-relaxed">
                        Curadoria inteligente de pautas baseadas no seu DNA e tendências em tempo real.
                    </p>
                </div>
                <div className="flex items-center space-x-4">
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="h-16 px-10 bg-gray-900 text-white text-sm font-black rounded-3xl shadow-2xl hover:bg-black transition-all flex items-center transform hover:-translate-y-1 hover:shadow-primary-500/25 duration-300"
                    >
                        <Plus className="mr-3 h-5 w-5" />
                        Ideia Manual
                    </button>
                    <button
                        onClick={handleDailyNews}
                        disabled={isSyncing}
                        className="h-16 px-10 bg-primary-500 text-white text-sm font-black rounded-3xl shadow-2xl hover:bg-primary-600 transition-all flex items-center transform hover:-translate-y-1 hover:shadow-primary-500/30 duration-300 disabled:opacity-50"
                    >
                        {isSyncing ? (
                            <RefreshCcw className="mr-3 h-5 w-5 animate-spin" />
                        ) : (
                            <Zap className="mr-3 h-5 w-5 fill-white/20" />
                        )}
                        Pautas do Dia
                    </button>
                </div>
            </div>

            {/* Ingestion Bar (Advanced) */}
            <div className="glass-panel p-2 rounded-[32px] border-white/60 shadow-lg shadow-black/5 flex flex-col md:flex-row items-center gap-2">
                <div className="flex-1 flex items-center px-6 space-x-4 w-full">
                    <Search className="h-5 w-5 text-gray-400" />
                    <input
                        value={rssUrl}
                        onChange={(e) => setRssUrl(e.target.value)}
                        placeholder="Pesquisar por Tópico ou URL RSS customizada..."
                        className="bg-transparent border-none focus:outline-none w-full h-12 text-sm font-bold text-gray-700 placeholder:text-gray-400"
                    />
                </div>
                <button
                    onClick={handleSyncRSS}
                    disabled={isSyncing}
                    className="h-14 px-8 bg-white border border-gray-100 text-gray-700 text-xs font-black rounded-[24px] hover:bg-gray-50 transition-all flex items-center uppercase tracking-widest disabled:opacity-50"
                >
                    Explorar Tópico
                </button>
            </div>

            {/* Tabs & Search */}
            <div className="flex flex-col xl:flex-row items-center justify-between gap-6 pb-4">
                <div className="flex items-center space-x-2 glass-panel p-2 rounded-[24px] w-full xl:w-auto overflow-x-auto no-scrollbar">
                    {categories.map((cat, i) => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={`px-6 py-3 text-xs font-black rounded-[16px] transition-all uppercase tracking-wider ${activeCategory === cat ? "bg-white text-gray-900 shadow-md shadow-black/5 border border-white/60" : "text-gray-500 hover:text-gray-900 hover:bg-white/40 border border-transparent"}`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
                <div className="relative w-full xl:w-96 group">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
                    <input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-16 pl-14 pr-6 glass-panel rounded-[24px] focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500/50 transition-all font-bold text-gray-700 placeholder:text-gray-400/70"
                        placeholder="Buscar tópicos, palavras-chave..."
                    />
                </div>
            </div>

            {/* Topics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-20">

                {isLoading && (
                    <div className="col-span-1 md:col-span-2 lg:col-span-3 text-center py-20 animate-pulse text-gray-500 font-bold">
                        Buscando o cérebro da Inteligência Artificial...
                    </div>
                )}

                {!isLoading && topics.length === 0 && (
                    <div className="col-span-1 md:col-span-2 lg:col-span-3 text-center py-20 text-gray-500 font-bold glass-panel rounded-[40px]">
                        O cofre está vazio. Clique em "Forçar Leitura RSS" ou adicione uma Ideia Manual.
                    </div>
                )}

                {!isLoading && topics.length > 0 && filteredTopics.length === 0 && (
                    <div className="col-span-1 md:col-span-2 lg:col-span-3 text-center py-20 text-gray-500 font-bold glass-panel rounded-[40px]">
                        Nenhuma ideia encontrada com esses filtros.
                    </div>
                )}

                {!isLoading && filteredTopics.map((item, i) => (
                    <div key={item.id || i} className="group relative glass-panel p-8 rounded-[40px] hover:shadow-2xl hover:shadow-primary-500/10 hover:-translate-y-2 transition-all duration-500 flex flex-col h-full overflow-hidden border-white/60">
                        {/* Glow effect on hover */}
                        <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                        <div className="relative z-10 flex items-center justify-between mb-8">
                            <div className="flex items-center space-x-2 bg-white/80 backdrop-blur-md text-primary-600 px-4 py-2 rounded-2xl border border-primary-100/50 shadow-sm shadow-primary-500/5">
                                <Zap className="h-4 w-4 fill-primary-600/20" />
                                <span className="text-xs font-black tracking-widest uppercase truncate">{item.relevanceScore ? (item.relevanceScore * 100).toFixed(0) : '95'}% Relevância</span>
                            </div>
                            <span className="text-[10px] font-black tracking-[0.2em] text-gray-400/80 bg-black/5 px-4 py-2 rounded-full uppercase border border-white/50">
                                {item.platform}
                            </span>
                        </div>

                        <h3 className="relative z-10 text-2xl font-black text-gray-900 leading-tight group-hover:text-primary-600 transition-colors tracking-tight">{item.title}</h3>
                        <p className="relative z-10 mt-5 text-gray-500/80 font-medium leading-relaxed flex-grow text-lg">{item.summary}</p>

                        <div className="relative z-10 mt-10 flex items-center pt-8 border-t border-black/5 space-x-3">
                            <button
                                onClick={() => initiateApprove(item)}
                                disabled={isApproveLoading[item.id]}
                                className="flex-1 h-16 bg-white border border-white/60 shadow-sm shadow-black/5 text-gray-900 text-sm font-black rounded-2xl hover:bg-primary-500 hover:border-primary-500 hover:text-white hover:shadow-lg hover:shadow-primary-500/25 transition-all duration-300 flex items-center justify-center group/btn disabled:opacity-50"
                            >
                                <CheckCircle2 className={`mr-2 h-5 w-5 ${isApproveLoading[item.id] ? "animate-pulse" : "group-hover/btn:scale-110 transition-transform"}`} />
                                {isApproveLoading[item.id] ? "Movendo..." : "Aprovar Ideia"}
                            </button>
                            <button
                                onClick={() => handleReject(item.id)}
                                className="h-16 w-16 bg-white border border-white/60 shadow-sm shadow-black/5 text-gray-400 hover:text-red-500 hover:bg-red-50 hover:border-red-100 rounded-2xl transition-all duration-300 flex items-center justify-center"
                            >
                                <XCircle className="h-6 w-6" />
                            </button>
                        </div>
                    </div>
                ))}

                {/* Create Card */}
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="group relative p-8 rounded-[40px] border-4 border-dashed border-primary-500/10 hover:border-primary-400/30 hover:bg-white/40 transition-all duration-500 flex flex-col items-center justify-center text-center space-y-5 h-full min-h-[400px]">
                    <div className="h-20 w-20 bg-white shadow-xl shadow-black/5 rounded-full flex items-center justify-center text-gray-300 group-hover:bg-primary-500 group-hover:text-white group-hover:scale-110 transition-all duration-500">
                        <Plus className="h-8 w-8" />
                    </div>
                    <div>
                        <p className="text-xl font-black text-gray-900">Ideia Customizada</p>
                        <p className="text-sm font-bold text-gray-400/80 mt-2 tracking-wide">Adicione sua própria faísca criativa</p>
                    </div>
                </button>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-2xl overflow-hidden transform animate-in fade-in slide-in-from-bottom-10">
                        <div className="p-8 border-b border-gray-100 flex justify-between items-center">
                            <div>
                                <h3 className="text-2xl font-black text-gray-900">Nova Ideia</h3>
                                <p className="text-sm text-gray-500 font-medium mt-1">Acione o filtro da Inteligência Artificial sobre o seu prompt</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-900 transition-colors">
                                <XCircle className="w-8 h-8" />
                            </button>
                        </div>
                        <div className="p-8 space-y-6">
                            <textarea
                                value={manualIdea}
                                onChange={(e) => setManualIdea(e.target.value)}
                                placeholder="Coloque aqui um link de youtube, de post de concorrente, ou apenas escreva: 'Quero falar sobre os 3 piores erros ao correr em jejum'."
                                className="w-full h-40 p-5 rounded-3xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all text-gray-900 resize-none font-medium leading-relaxed"
                            ></textarea>

                            <div className="flex justify-end pt-4">
                                <button
                                    onClick={handleManualIdeaSubmit}
                                    disabled={!manualIdea.trim() || isGeneratingManual}
                                    className="h-14 px-8 bg-primary-600 text-white text-sm font-black rounded-2xl hover:bg-primary-700 transition-all flex items-center shadow-lg shadow-primary-500/25 disabled:opacity-50"
                                >
                                    {isGeneratingManual ? (
                                        <>
                                            <RefreshCcw className="mr-3 h-5 w-5 animate-spin" />
                                            Analisando DNA...
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="mr-3 h-5 w-5" />
                                            Gerar Cartão de Ideia
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Aprovação com Escolha de Redes */}
            {topicToApprove && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
                    <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-xl overflow-hidden transform animate-in zoom-in duration-300">
                        <div className="p-10 border-b border-gray-100 items-start flex justify-between">
                            <div>
                                <span className="inline-block px-4 py-1.5 rounded-full bg-primary-50 text-primary-600 text-[10px] font-black uppercase tracking-widest mb-4">Escolha os Canais</span>
                                <h3 className="text-3xl font-black text-gray-900 leading-tight">Para onde vamos <span className="text-primary-500 italic">produzir</span>?</h3>
                                <p className="text-gray-500 font-medium mt-3 leading-relaxed">Selecione as redes sociais cadastradas no seu DNA que devem receber este conteúdo.</p>
                            </div>
                            <button onClick={() => setTopicToApprove(null)} className="text-gray-300 hover:text-gray-900 transition-colors">
                                <XCircle className="w-10 h-10" />
                            </button>
                        </div>
                        
                        <div className="p-10">
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
                                            className={`flex items-center gap-4 p-6 rounded-3xl border-2 transition-all text-left ${isSelected ? 'border-primary-500 bg-primary-50 shadow-inner' : 'border-gray-100 hover:border-gray-200'}`}
                                        >
                                            <div className={`p-3 rounded-2xl ${isSelected ? 'bg-primary-500 text-white' : 'bg-gray-50 text-gray-400'}`}>
                                                <Icon className="w-6 h-6" />
                                            </div>
                                            <span className={`font-black uppercase tracking-widest text-xs ${isSelected ? 'text-primary-700' : 'text-gray-400'}`}>
                                                {platform}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="mt-10">
                                <span className="inline-block px-4 py-1.5 rounded-full bg-gray-50 text-gray-500 text-[10px] font-black uppercase tracking-widest mb-4">Formato da Entrega</span>
                                <div className="grid grid-cols-3 gap-3">
                                    {[
                                        { id: 'carousel', label: 'Carrossel', icon: Sparkles },
                                        { id: 'short post', label: 'Post Estático', icon: Zap },
                                        { id: 'video script', label: 'Roteiro Vídeo', icon: Youtube },
                                    ].map((f) => (
                                        <button
                                            key={f.id}
                                            onClick={() => setSelectedFormat(f.id)}
                                            className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all gap-2 ${selectedFormat === f.id ? 'border-primary-500 bg-primary-50' : 'border-gray-50 bg-gray-50/50 hover:bg-gray-100'}`}
                                        >
                                            <f.icon className={`w-5 h-5 ${selectedFormat === f.id ? 'text-primary-500' : 'text-gray-400'}`} />
                                            <span className={`text-[9px] font-black uppercase tracking-tight ${selectedFormat === f.id ? 'text-primary-700' : 'text-gray-400'}`}>
                                                {f.label}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button
                                onClick={handleConfirmApprove}
                                disabled={selectedPlatforms.length === 0 || isApproveLoading[topicToApprove.id]}
                                className="w-full h-20 bg-gray-900 text-white font-black rounded-[2rem] mt-10 hover:bg-black transition-all flex items-center justify-center shadow-2xl shadow-black/20 disabled:opacity-50 active:scale-95"
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
