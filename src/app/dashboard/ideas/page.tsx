"use client";

import { useState, useEffect } from "react";
import { Search, Plus, Sparkles, Zap, CheckCircle2, XCircle, RefreshCcw } from "lucide-react";

export default function IdeasLibrary() {
    const [isSyncing, setIsSyncing] = useState(false);
    const [rssUrl, setRssUrl] = useState("https://techcrunch.com/feed/");
    const [topics, setTopics] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isApproveLoading, setIsApproveLoading] = useState<Record<string, boolean>>({});

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
            const res = await fetch('/api/discovery/topics');
            const data = await res.json();
            if (data.success) {
                setTopics(data.data);
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

    const handleApprove = async (topicId: string) => {
        setIsApproveLoading(prev => ({ ...prev, [topicId]: true }));
        try {
            const res = await fetch(`/api/discovery/topics/${topicId}/approve`, { method: 'POST' });
            const data = await res.json();
            if (data.success) {
                // remove from UI instantly
                setTopics(topics.filter(t => t.id !== topicId));
                alert(`Ideia "${data.piece.title}" enviada para Produção! Vá para "Esteira de Produção" para gerá-la.`);
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
                // Refresh the list after the AI finishes creating new concepts!
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
        if (activeCategory === "Tendências") return t.relevanceScore >= 0.8;
        if (activeCategory === "Ganchos Virais") return t.format === 'short video script' || t.format === 'short post';
        if (activeCategory === "Atemporal") return t.alignmentScore >= 0.8;
        if (activeCategory === "Novidades do Produto") return t.platform === 'LinkedIn'; // Mock condition

        return true;
    });

    return (
        <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-1000">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-6 md:space-y-0 pb-10 border-b border-black/5">
                <div>
                    <div className="flex items-center space-x-3 mb-3 animate-fade-in">
                        <Sparkles className="h-5 w-5 text-primary-500 fill-primary-500/20" />
                        <span className="text-sm font-black text-primary-600/80 uppercase tracking-[0.2em] shadow-sm">Motor de Descoberta de Notícias</span>
                    </div>
                    <h1 className="text-5xl lg:text-6xl font-black tracking-tighter text-gradient animate-slide-up">
                        Biblioteca de Ideias
                    </h1>
                    <p className="mt-5 text-xl text-gray-500/80 max-w-3xl font-medium leading-relaxed">
                        Sugestões de tópicos conduzidas por Inteligência Artificial, baseadas no DNA da sua marca e nas tendências do mercado.
                    </p>
                </div>
                <div className="flex flex-col md:flex-row items-center gap-4">
                    <div className="flex items-center space-x-2">
                        <input
                            value={rssUrl}
                            onChange={(e) => setRssUrl(e.target.value)}
                            placeholder="URL do RSS (ex: g1.globo...)"
                            className="h-14 px-4 w-52 glass-panel border border-white/60 text-sm font-bold text-gray-700 rounded-[20px] focus:outline-none focus:ring-2 focus:ring-primary-500/20 shadow-sm"
                        />
                        <button
                            onClick={handleSyncRSS}
                            disabled={isSyncing}
                            className={`h-14 px-6 glass-panel text-gray-700 text-sm font-black rounded-[20px] hover:bg-white/80 transition-all flex items-center hover:shadow-xl hover:shadow-black/5 disabled:opacity-50 hover:-translate-y-1 duration-300`}
                        >
                            <RefreshCcw className={`mr-3 h-5 w-5 ${isSyncing ? "animate-spin text-primary-500" : ""}`} />
                            {isSyncing ? "Lendo Notícias..." : "Forçar Leitura RSS"}
                        </button>
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="h-14 px-8 bg-gray-900 text-white text-sm font-black rounded-[20px] shadow-2xl hover:bg-black transition-all flex items-center transform hover:-translate-y-1 hover:shadow-primary-500/25 duration-300"
                    >
                        <Plus className="mr-3 h-5 w-5" />
                        Nova Ideia Manual
                    </button>
                </div>
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
                                onClick={() => handleApprove(item.id)}
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
        </div>
    );
}
