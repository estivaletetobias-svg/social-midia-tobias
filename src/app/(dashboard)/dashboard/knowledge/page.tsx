"use client";

import { useState, useEffect } from "react";
import { Plus, Search, FileText, Zap, HelpCircle, Trash2, Link as LinkIcon, UploadCloud, CopyPlus, Youtube, BrainCircuit, CheckCircle2, X, Save, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function KnowledgeBase() {
    const router = useRouter();
    const [items, setItems] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isIntegrating, setIsIntegrating] = useState(false);

    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [newTitle, setNewTitle] = useState("");
    const [newContent, setNewContent] = useState("");
    const [newType, setNewType] = useState("Nota Rápida");
    const [newTags, setNewTags] = useState("");
    const [isUploading, setIsUploading] = useState(false);
    const [isMultiplexing, setIsMultiplexing] = useState<string | null>(null);

    // Chat states
    const [chatMessages, setChatMessages] = useState<{ role: string, content: string }[]>([]);
    const [currentMsg, setCurrentMsg] = useState("");
    const [isChatLoading, setIsChatLoading] = useState(false);

    const toggleSelect = (id: string) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === items.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(items.map(i => i.id));
        }
    };

    const handleIntegrateToDNA = async () => {
        if (selectedIds.length === 0) return;
        setIsIntegrating(true);
        
        try {
            // Store selected IDs to be processed on the Brand page
            localStorage.setItem('dna_sync_source_ids', JSON.stringify(selectedIds));
            router.push('/dashboard/brand?refine=true');
        } catch (e) {
            console.error(e);
            alert("Erro ao preparar integração.");
        } finally {
            setIsIntegrating(false);
        }
    };

    const loadItems = async () => {
        const activeBrandId = localStorage.getItem('active_brand_id');
        if (!activeBrandId) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        try {
            const res = await fetch(`/api/knowledge?brandId=${activeBrandId}`);
            const data = await res.json();
            if (data.success) {
                setItems(data.items);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadItems();
    }, []);

    const handleSaveItem = async () => {
        if (!newTitle.trim() || !newContent.trim()) {
            alert("Título e Conteúdo são obrigatórios.");
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await fetch('/api/knowledge', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: newTitle,
                    content: newContent,
                    type: newType,
                    tags: newTags.split(',').map(t => t.trim()).filter(Boolean),
                    brandId: localStorage.getItem('active_brand_id')
                })
            });
            const data = await res.json();

            if (data.success) {
                // Fechar modal e recarregar
                setIsModalOpen(false);
                setNewTitle("");
                setNewContent("");
                setNewTags("");
                loadItems();
            } else {
                alert(`Erro: ${data.error}`);
            }
        } catch (error) {
            console.error(error);
            alert("Erro de conexão ao salvar.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const arrayBuffer = await file.arrayBuffer();
            
            // Carregar PDF.js dinamicamente se não existir
            if (!(window as any).pdfjsLib) {
                const script = document.createElement('script');
                script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
                document.head.appendChild(script);
                await new Promise((resolve) => { script.onload = resolve; });
            }

            const pdfjsLib = (window as any).pdfjsLib;
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

            const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
            const pdf = await loadingTask.promise;
            
            let fullText = "";
            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                const pageText = textContent.items.map((item: any) => item.str).join(" ");
                fullText += pageText + "\n\n";
            }

            if (fullText.trim()) {
                setNewContent(fullText);
                setNewTitle(file.name.replace('.pdf', ''));
                setNewType("Artigo/Blog");
            } else {
                alert("Não foi possível extrair texto deste PDF. Ele pode ser uma imagem protegida.");
            }
        } catch (error: any) {
            console.error(error);
            alert(`Falha ao ler PDF localmente: ${error.message || 'Erro deconhecido'}`);
        } finally {
            setIsUploading(false);
        }
    };

    const handleYouTubeSync = async () => {
        const url = prompt("Cole o Link completo do Vídeo do YouTube publico:");
        if (!url) return;

        setIsUploading(true);
        try {
            const res = await fetch('/api/knowledge/youtube', {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    url,
                    title: newTitle || "Transcrição YT Temporária",
                    type: newType || "Vídeo Transcrito",
                    tags: newTags || "YOUTUBE",
                    brandId: localStorage.getItem('active_brand_id')
                })
            });
            const data = await res.json();
            if (data.success) {
                alert("YouTube Transcrito e Salvo no Cérebro com sucesso! Feche este modal e veja na lista.");
                setItems([data.item, ...items]);
                setIsModalOpen(false); // fechar pois ele ja salvou no banco direto no endpoint
            } else {
                const diag = data.details ? `\n\nDiagnóstico: ${data.details}` : '';
                const rec = data.recommendation ? `\n\nSugestão: ${data.recommendation}` : '';
                alert(`Erro: ${data.error}${diag}${rec}`);
            }
        } catch (error) {
            console.error(error);
            alert("Falha na sincronização com YouTube.");
        } finally {
            setIsUploading(false);
        }
    };

    const handleMultiplex = async (itemId: string) => {
        setIsMultiplexing(itemId);
        try {
            const res = await fetch(`/api/knowledge/${itemId}/multiplex`, {
                method: "POST"
            });
            const data = await res.json();
            if (data.success) {
                alert("Mágica Concluída! Suas peças derivadas (Carrossel, Post e Roteiro) estão te esperando na Esteira de Produção.");
                router.push('/dashboard/content');
            } else {
                alert(`Erro: ${data.error}`);
            }
        } catch (error) {
            console.error(error);
            alert("Erro fatal de conexão com a máquina de clonagem.");
        } finally {
            setIsMultiplexing(null);
        }
    };

    const handleChatSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!currentMsg.trim()) return;

        const newUserMsg = { role: 'user', content: currentMsg };
        const updatedHistory = [...chatMessages, newUserMsg];
        setChatMessages(updatedHistory);
        setCurrentMsg("");
        setIsChatLoading(true);

        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: updatedHistory })
            });

            const data = await res.json();
            if (data.success) {
                setChatMessages([...updatedHistory, { role: 'assistant', content: data.reply }]);
            } else {
                alert(`Erro: ${data.error}`);
            }
        } finally {
            setIsChatLoading(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-16 py-10 animate-in fade-in slide-in-from-bottom-6 duration-1000 pb-32">
            
            {/* Header - Proprietary Intelligence level */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-12 border-b border-gray-100 pb-16">
                <div className="space-y-6 flex-1">
                    <div className="flex items-center gap-3">
                        <div className="pulse-indicator" />
                        <span className="text-[10px] font-black text-[#2B3440] uppercase tracking-[0.4em]">Cérebro Semântico Ativo</span>
                    </div>
                    <h1 className="text-6xl lg:text-8xl font-black tracking-tight text-gray-900 leading-[0.85] uppercase">
                        Lab de <br />
                        <span className="text-gradient">Inteligência</span>
                    </h1>
                    <p className="text-xl text-gray-400 font-medium max-w-xl leading-relaxed">
                        Gerencie o repertório estratégico da sua marca. O STELAR processa estes documentos para garantir que toda comunicação tenha profundidade e fundamento real.
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-4 shrink-0">
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="button-primary h-22 px-14 rounded-[2.5rem] text-[11px] flex items-center group relative overflow-hidden shadow-2xl shadow-[#2B3440]/20"
                    >
                        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <UploadCloud className="mr-5 h-6 w-6 fill-white" />
                        <span className="uppercase tracking-[0.2em] text-xs font-black">Importar Fonte</span>
                    </button>
                    <button
                        onClick={() => setIsChatOpen(true)}
                        className="h-22 px-10 border-2 border-gray-100 hover:border-[#2B3440] text-[#2B3440] font-black rounded-[2.5rem] text-[11px] uppercase tracking-[0.2em] flex items-center gap-4 transition-all hover:bg-gray-50 bg-white shadow-sm"
                    >
                        <Zap className="h-6 w-6" />
                        Discussão IA
                    </button>
                </div>
            </div>

            {/* Omni Search & Control Hub */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 pb-4">
                <div className="flex items-center p-2 bg-gray-50 border-2 border-gray-100 rounded-[2.5rem] w-full lg:w-auto overflow-x-auto no-scrollbar shadow-inner">
                    <button className="px-10 py-5 text-[10px] font-black rounded-[2rem] bg-[#2B3440] text-white shadow-2xl uppercase tracking-[0.2em] whitespace-nowrap">
                        Repositório Completo
                    </button>
                    <button className="px-10 py-5 text-[10px] font-black rounded-[2rem] text-gray-400 hover:text-gray-900 uppercase tracking-[0.2em] whitespace-nowrap">
                        Análises Recentes
                    </button>
                </div>
                <div className="relative w-full lg:w-[450px] group">
                    <Search className="absolute left-8 top-1/2 -translate-y-1/2 h-6 w-6 text-gray-400 group-focus-within:text-[#2B3440] transition-colors" />
                    <input
                        className="w-full h-20 pl-20 pr-10 bg-white border-2 border-gray-100 rounded-[2.5rem] focus:outline-none focus:border-[#2B3440] transition-all font-black text-xl text-gray-900 placeholder:text-gray-300 shadow-sm"
                        placeholder="Pesquisar no sistema..."
                    />
                </div>
            </div>

            {/* Semantic Data Grid */}
            <div className="stelar-card overflow-hidden shadow-3xl">
                <div className="hidden lg:grid grid-cols-12 gap-10 p-10 border-b-2 border-gray-50 bg-gray-50/30">
                    <div className="col-span-1 flex items-center justify-center">
                        <button 
                            onClick={toggleSelectAll}
                            className={`h-7 w-7 rounded-lg border-2 flex items-center justify-center transition-all ${selectedIds.length === items.length && items.length > 0 ? 'bg-[#2B3440] border-[#2B3440]' : 'border-gray-200 bg-white'}`}
                        >
                            {selectedIds.length === items.length && items.length > 0 && <CheckCircle2 className="h-4 w-4 text-white" />}
                        </button>
                    </div>
                    <div className="col-span-5 text-[11px] font-black text-gray-400 uppercase tracking-[0.3em]">Documentação de Base</div>
                    <div className="col-span-2 text-[11px] font-black text-gray-400 uppercase tracking-[0.3em]">Protocolo</div>
                    <div className="col-span-4 text-right text-[11px] font-black text-gray-400 uppercase tracking-[0.3em]">Eixo Estratégico</div>
                </div>

                <div className="divide-y-2 divide-gray-50">
                    {isLoading && (
                        <div className="p-32 text-center space-y-6">
                            <div className="h-16 w-16 border-4 border-[#2B3440]/10 border-t-[#2B3440] rounded-full animate-spin mx-auto" />
                            <p className="text-sm font-black text-gray-400 uppercase tracking-[0.4em]">Decodificando Cérebro Semântico...</p>
                        </div>
                    )}

                    {!isLoading && items.length === 0 && (
                        <div className="p-32 text-center">
                            <h3 className="text-3xl font-black text-gray-900 uppercase tracking-tighter mb-4">Cérebro Disponível</h3>
                            <p className="text-gray-400 font-medium text-lg max-w-md mx-auto leading-relaxed">
                                Nenhuma fonte de inteligência foi importada ainda. Adicione textos ou PDFs para começar.
                            </p>
                        </div>
                    )}

                    {!isLoading && items.map((item) => (
                        <div key={item.id} className={`grid grid-cols-1 lg:grid-cols-12 gap-10 p-10 items-center transition-all group ${selectedIds.includes(item.id) ? 'bg-[#2B3440]/5' : 'hover:bg-gray-50/50'}`}>
                            <div className="col-span-1 flex items-center justify-center">
                                <button 
                                    onClick={() => toggleSelect(item.id)}
                                    className={`h-7 w-7 rounded-lg border-2 flex items-center justify-center transition-all ${selectedIds.includes(item.id) ? 'bg-[#2B3440] border-[#2B3440]' : 'border-gray-200 bg-white group-hover:border-gray-300'}`}
                                >
                                    {selectedIds.includes(item.id) && <CheckCircle2 className="h-4 w-4 text-white" />}
                                </button>
                            </div>
                            <div className="col-span-5 flex items-center gap-6">
                                <div className="h-14 w-14 rounded-2xl bg-gray-50 border-2 border-gray-100 flex items-center justify-center text-[#2B3440] group-hover:bg-white group-hover:border-[#2B3440] group-hover:shadow-lg transition-all duration-500">
                                    <FileText className="h-6 w-6" />
                                </div>
                                <div>
                                    <h4 className="text-xl font-black text-gray-900 uppercase tracking-tighter group-hover:text-[#2B3440] transition-colors line-clamp-1">{item.title}</h4>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Ref ID: {item.id?.substring(0,8)}</p>
                                </div>
                            </div>
                            <div className="col-span-2">
                                <span className="premium-badge text-[9px] bg-white border-2 border-gray-100">{item.type}</span>
                            </div>
                            <div className="col-span-4 flex items-center justify-end gap-3">
                                {(item.tags && item.tags.length > 0 ? item.tags : ['ESTRATÉGIA']).map((tag: string, i: number) => (
                                    <span key={i} className="px-4 py-2 bg-gray-50 border-2 border-gray-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover:border-gray-200 transition-all">{tag}</span>
                                ))}
                                <button
                                    onClick={() => handleMultiplex(item.id)}
                                    disabled={isMultiplexing === item.id}
                                    className="ml-4 h-12 px-6 bg-[#2B3440]/5 text-[#2B3440] text-[10px] font-black rounded-xl hover:bg-[#2B3440] hover:text-white transition-all flex items-center gap-3 uppercase tracking-widest disabled:opacity-50"
                                >
                                    {isMultiplexing === item.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <BrainCircuit className="h-4 w-4" />}
                                    Multiplicar
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Selection Engine Panel (Floating) */}
            {selectedIds.length > 0 && (
                <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-50 w-full max-w-4xl px-4 animate-in slide-in-from-bottom-12 duration-700">
                    <div className="bg-[#2B3440] text-white rounded-[3rem] shadow-[0_40px_100px_rgba(0,0,0,0.4)] p-6 pl-12 flex items-center justify-between border-t-2 border-white/10 backdrop-blur-2xl">
                        <div className="flex items-center gap-10">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.4em] mb-1">Status de Operação</span>
                                <span className="text-2xl font-black uppercase tracking-tighter">{selectedIds.length} Fontes Selecionadas</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <button
                                onClick={handleIntegrateToDNA}
                                disabled={isIntegrating}
                                className="h-18 px-12 bg-white text-[#2B3440] text-[11px] font-black rounded-[2rem] flex items-center gap-4 transition-all shadow-xl active:scale-95 group overflow-hidden relative"
                            >
                                <BrainCircuit className="h-6 w-6" />
                                <span className="uppercase tracking-[0.2em]">{isIntegrating ? "Sincronizando..." : "Sintonizar no DNA"}</span>
                            </button>
                            <button
                                onClick={() => setSelectedIds([])}
                                className="h-18 w-18 flex items-center justify-center text-white/40 hover:text-white transition-colors"
                            >
                                <X className="h-8 w-8" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Arquitetura (Creation) */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-gray-900/60 backdrop-blur-xl animate-in fade-in duration-500">
                    <div className="bg-white rounded-[3.5rem] w-full max-w-4xl shadow-[0_50px_200px_rgba(0,0,0,0.3)] overflow-hidden animate-in zoom-in-95 duration-500 flex flex-col max-h-[90vh] border-2 border-gray-100">
                        <div className="p-12 border-b-2 border-gray-50 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-2xl bg-[#2B3440] flex items-center justify-center text-white shadow-lg">
                                    <Plus className="h-6 w-6" />
                                </div>
                                <div>
                                    <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tighter">Nuvem de Insumos</h2>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Configuração de fonte estratégica</p>
                                </div>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="h-14 w-14 rounded-2xl border-2 border-gray-100 flex items-center justify-center text-gray-300 hover:text-red-500 hover:border-red-100 transition-all">
                                <X className="h-8 w-8" />
                            </button>
                        </div>

                        <div className="p-12 space-y-10 overflow-y-auto flex-1 bg-gray-50/20">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                <div className="space-y-4">
                                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] ml-2">Nomenclatura da Fonte</label>
                                    <input
                                        value={newTitle}
                                        onChange={e => setNewTitle(e.target.value)}
                                        className="w-full h-18 px-8 bg-white border-2 border-gray-100 rounded-2xl focus:outline-none focus:border-[#2B3440] transition-all font-black text-lg text-gray-900 shadow-sm"
                                        placeholder="Ex: Roteiro da Mentoria X"
                                    />
                                </div>
                                <div className="space-y-4">
                                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] ml-2">Protocolo de Categoria</label>
                                    <select
                                        value={newType}
                                        onChange={e => setNewType(e.target.value)}
                                        className="w-full h-18 px-8 bg-white border-2 border-gray-100 rounded-2xl focus:outline-none focus:border-[#2B3440] transition-all font-black text-lg text-gray-900 shadow-sm appearance-none"
                                    >
                                        <option value="Nota Rápida">Nota Rápida</option>
                                        <option value="Transcrição">Transcrição</option>
                                        <option value="Artigo/Blog">Artigo</option>
                                        <option value="Estratégia">Visão da Empresa</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="flex items-center justify-between px-2">
                                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em]">Manuscrito Semântico</label>
                                    <div className="flex items-center gap-4">
                                        <button
                                            onClick={handleYouTubeSync}
                                            disabled={isUploading}
                                            className="px-6 py-2 bg-red-50 text-red-600 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 border-red-100 hover:bg-red-600 hover:text-white transition-all flex items-center gap-3">
                                            <Youtube className="w-5 h-5" />
                                            Sync Youtube
                                        </button>
                                        <label className="px-6 py-2 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 border-blue-100 hover:bg-blue-600 hover:text-white transition-all flex items-center gap-3 cursor-pointer">
                                            <UploadCloud className="w-5 h-5" />
                                            Upload PDF
                                            <input type="file" accept="application/pdf" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
                                        </label>
                                    </div>
                                </div>
                                {isUploading && (
                                    <div className="p-8 bg-blue-600 text-white rounded-3xl animate-pulse flex items-center gap-6 shadow-2xl shadow-blue-500/20">
                                        <Loader2 className="h-8 w-8 animate-spin" />
                                        <p className="font-black uppercase tracking-widest text-sm">Escaneando Arquivo e Processando Cérebro...</p>
                                    </div>
                                )}
                                <textarea
                                    value={newContent}
                                    onChange={e => setNewContent(e.target.value)}
                                    rows={10}
                                    className="w-full p-10 bg-white border-2 border-gray-100 rounded-[2.5rem] focus:outline-none focus:border-[#2B3440] transition-all font-medium text-lg text-gray-700 leading-relaxed shadow-inner resize-none"
                                    placeholder="Comece o input de dados aqui..."
                                />
                            </div>
                        </div>

                        <div className="p-10 border-t-2 border-gray-50 bg-white">
                            <button
                                onClick={handleSaveItem}
                                disabled={isSubmitting}
                                className="button-primary w-full h-20 rounded-[2rem] shadow-2xl shadow-[#2B3440]/20 flex items-center justify-center gap-6 group disabled:opacity-50"
                            >
                                {isSubmitting ? <Loader2 className="h-7 w-7 animate-spin" /> : <Save className="h-7 w-7" />}
                                <span className="text-sm font-black uppercase tracking-[0.3em]">{isSubmitting ? "Memorizando..." : "Integrar ao Sistema da Marca"}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* AI Control Center (Drawer) */}
            {isChatOpen && (
                <div className="fixed inset-0 z-50 flex justify-end bg-gray-900/60 backdrop-blur-xl animate-in fade-in duration-500">
                    <div className="w-full max-w-2xl h-full bg-white shadow-[0_0_150px_rgba(0,0,0,0.5)] flex flex-col animate-in slide-in-from-right duration-700 border-l-2 border-gray-100">

                        {/* Control Header */}
                        <div className="h-32 bg-[#2B3440] flex items-center justify-between px-12 shrink-0 border-b border-white/10">
                            <div className="flex items-center gap-6">
                                <div className="h-14 w-14 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center shadow-2xl shadow-black/20">
                                    <BrainCircuit className="h-8 w-8 text-white animate-pulse" />
                                </div>
                                <div>
                                    <h2 className="text-white text-2xl font-black uppercase tracking-tighter">Motor Cognitivo</h2>
                                    <p className="text-blue-400 text-[10px] font-black uppercase tracking-[0.3em] mt-1">Cross-Data Intelligence</p>
                                </div>
                            </div>
                            <button onClick={() => setIsChatOpen(false)} className="h-14 w-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all">
                                <X className="h-8 w-8" />
                            </button>
                        </div>

                        {/* Neural Feed */}
                        <div className="flex-1 p-12 space-y-10 overflow-y-auto bg-gray-50/50 flex flex-col no-scrollbar">
                            {chatMessages.length === 0 && (
                                <div className="my-auto text-center space-y-10 p-12">
                                    <div className="h-24 w-24 bg-white rounded-full mx-auto flex items-center justify-center shadow-xl border-2 border-gray-50">
                                        <Zap className="h-10 w-10 text-[#2B3440]" />
                                    </div>
                                    <div className="space-y-4">
                                        <h3 className="text-3xl font-black text-gray-900 uppercase tracking-tighter">Análise Semântica Ativa</h3>
                                        <p className="text-lg font-medium text-gray-400 max-w-sm mx-auto leading-relaxed">
                                            Estou processando as {items.length} fontes do seu cérebro. O que deseja cruzar ou criar agora?
                                        </p>
                                    </div>
                                    <div className="grid grid-cols-1 gap-3 max-w-xs mx-auto">
                                        <button className="p-4 bg-white border border-gray-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-[#2B3440] hover:border-[#2B3440] transition-all text-left">Resumir meu tom vocal</button>
                                        <button className="p-4 bg-white border border-gray-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-[#2B3440] hover:border-[#2B3440] transition-all text-left">Pautas do documento X</button>
                                    </div>
                                </div>
                            )}

                            {chatMessages.map((msg, i) => (
                                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[85%] p-8 rounded-[2rem] text-lg font-medium leading-relaxed shadow-3xl ${msg.role === 'user'
                                        ? 'bg-[#2B3440] text-white rounded-tr-md'
                                        : 'bg-white border-2 border-gray-100 text-gray-800 rounded-tl-md'
                                        }`}>
                                        {msg.content}
                                    </div>
                                </div>
                            ))}

                            {isChatLoading && (
                                <div className="flex justify-start">
                                    <div className="px-8 py-5 bg-white border-2 border-gray-100 rounded-3xl rounded-tl-md shadow-xl flex items-center gap-4">
                                        <div className="h-2 w-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                        <div className="h-2 w-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                        <div className="h-2 w-2 bg-blue-500 rounded-full animate-bounce" />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Command Input Area */}
                        <div className="p-10 bg-white border-t border-gray-100 shrink-0 shadow-[0_-20px_50px_rgba(0,0,0,0.02)]">
                            <form onSubmit={handleChatSubmit} className="relative group">
                                <input
                                    value={currentMsg}
                                    onChange={e => setCurrentMsg(e.target.value)}
                                    placeholder="Enviar comando para o motor cognitivo..."
                                    className="w-full h-20 pl-8 pr-20 bg-gray-50 border-2 border-transparent rounded-[1.5rem] focus:outline-none focus:bg-white focus:border-[#2B3440] transition-all font-black text-lg text-gray-900 placeholder:text-gray-300"
                                    disabled={isChatLoading}
                                />
                                <button
                                    type="submit"
                                    disabled={!currentMsg.trim() || isChatLoading}
                                    className="absolute right-4 top-4 h-12 w-12 bg-[#2B3440] rounded-xl flex items-center justify-center text-white hover:bg-black transition-all shadow-lg disabled:opacity-50 active:scale-95 group-focus-within:scale-105">
                                    <Zap className="h-5 w-5" />
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
