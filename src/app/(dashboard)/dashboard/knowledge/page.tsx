"use client";

import { useState, useEffect } from "react";
import { Plus, Search, FileText, Zap, HelpCircle, Trash2, Link as LinkIcon, UploadCloud, CopyPlus, Youtube, BrainCircuit } from "lucide-react";
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
            const formData = new FormData();
            formData.append('file', file);

            const res = await fetch('/api/knowledge/upload', {
                method: 'POST',
                body: formData
            });

            const data = await res.json();
            if (data.success) {
                setNewContent(data.text);
            } else {
                alert(`Erro no Servidor: ${data.error || 'Erro desconhecido'}`);
            }
        } catch (error: any) {
            console.error(error);
            alert(`Falha no upload do arquivo: ${error.message || 'Erro de conexão'}`);
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
        } catch (err) {
            console.error(err);
            alert("Erro de conexão ao conversar com a IA.");
        } finally {
            setIsChatLoading(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-1000 pb-32">
            {/* Dark Banner */}
            <div className="bg-gray-900 rounded-[40px] p-10 md:p-14 text-white relative overflow-hidden shadow-2xl flex flex-col justify-center min-h-[300px]">
                <div className="absolute top-0 right-0 w-1/2 h-full opacity-10 pointer-events-none flex items-center justify-end pr-10">
                    <FileText className="w-80 h-80 text-white" />
                </div>

                <div className="relative z-10 max-w-2xl space-y-6">
                    <h1 className="text-5xl font-black tracking-tighter">
                        Brand Intelligence Hub
                    </h1>
                    <p className="text-xl text-gray-300 font-medium tracking-wide leading-relaxed">
                        O núcleo semântico da sua Inteligência Artificial. Alimente o seu cérebro com visões, transcrições e documentos reais. O robô vai cruzar isso tudo antes de escrever cada post.
                    </p>

                    <div className="flex items-center space-x-4 pt-4">
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="h-14 px-8 bg-primary-500 text-white text-sm font-black rounded-[20px] shadow-lg hover:bg-primary-600 transition-all flex items-center transform hover:-translate-y-1 duration-300">
                            <Plus className="mr-3 h-5 w-5" />
                            Importar Fonte Manual
                        </button>
                        <button
                            onClick={() => setIsChatOpen(true)}
                            className="h-14 px-8 bg-white/10 backdrop-blur-sm border border-white/20 text-white text-sm font-black rounded-[20px] hover:bg-white/20 transition-all flex items-center transform hover:-translate-y-1 duration-300">
                            <Zap className="mr-3 h-5 w-5" />
                            Pesquisa AI / Chat
                        </button>
                    </div>
                </div>
            </div>

            {/* List & Filters Section */}
            <div className="space-y-6">
                {/* Tabs & Search */}
                <div className="flex flex-col xl:flex-row items-center justify-between gap-6 pb-4">
                    <div className="flex items-center space-x-2 glass-panel p-2 rounded-[24px] w-full xl:w-auto overflow-x-auto no-scrollbar">
                        <button className="px-6 py-3 text-xs font-black rounded-[16px] transition-all uppercase tracking-wider bg-white text-gray-900 shadow-md shadow-black/5 border border-white/60">
                            Todas as Fontes
                        </button>
                    </div>
                    <div className="relative w-full xl:w-96 group">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
                        <input
                            className="w-full h-14 pl-14 pr-6 glass-panel rounded-[24px] focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500/50 transition-all font-bold text-gray-700 placeholder:text-gray-400/70"
                            placeholder="Buscar na base de conhecimento..."
                        />
                    </div>
                </div>

                {/* Data Table */}
                <div className="glass-panel rounded-[40px] overflow-hidden border border-white/60 shadow-xl shadow-black/5 pb-10">
                    <div className="hidden lg:grid grid-cols-12 gap-4 p-6 border-b border-gray-100 bg-white/50 text-xs font-black tracking-widest uppercase text-gray-400 items-center">
                        <div className="col-span-1 flex items-center justify-center">
                            <input 
                                type="checkbox" 
                                checked={selectedIds.length === items.length && items.length > 0} 
                                onChange={toggleSelectAll}
                                className="w-5 h-5 rounded-lg border-gray-300 text-primary-500 focus:ring-primary-500 cursor-pointer" 
                            />
                        </div>
                        <div className="col-span-4">Documento de Conhecimento</div>
                        <div className="col-span-2">Tipo</div>
                        <div className="col-span-3">Tags & Eixo</div>
                        <div className="col-span-2 text-right">Ações Rápidas</div>
                    </div>

                    <div className="divide-y divide-gray-50">
                        {isLoading && (
                            <div className="p-10 text-center animate-pulse text-gray-500 font-bold">
                                Carregando cérebro semântico...
                            </div>
                        )}

                        {!isLoading && items.length === 0 && (
                            <div className="p-16 text-center text-gray-500 font-bold bg-white/30 rounded-3xl m-6">
                                Nenhuma fonte importada ainda. Clique no botão verde para adicionar textos e começar a treinar seu Avatar.
                            </div>
                        )}

                        {!isLoading && items.map((item, index) => (
                            <div key={item.id || index} className={`flex flex-col lg:grid lg:grid-cols-12 gap-4 p-6 items-center hover:bg-white/60 transition-colors group ${selectedIds.includes(item.id) ? 'bg-primary-50/30' : ''}`}>
                                <div className="col-span-1 flex items-center justify-center">
                                    <input 
                                        type="checkbox" 
                                        checked={selectedIds.includes(item.id)} 
                                        onChange={() => toggleSelect(item.id)}
                                        className="w-5 h-5 rounded-lg border-gray-300 text-primary-500 focus:ring-primary-500 cursor-pointer" 
                                    />
                                </div>
                                <div className="col-span-4 flex items-center space-x-4 w-full">
                                    <div className="w-12 h-12 rounded-2xl bg-primary-50 flex-shrink-0 flex items-center justify-center text-primary-500 group-hover:bg-primary-500 group-hover:text-white transition-colors">
                                        <FileText className="w-5 h-5" />
                                    </div>
                                    <span className="font-bold text-gray-900 truncate text-base">
                                        {item.title}
                                    </span>
                                </div>
                                <div className="col-span-2 w-full lg:w-auto mt-2 lg:mt-0 px-16 lg:px-0">
                                    <span className="text-sm font-bold text-gray-500">{item.type}</span>
                                </div>
                                <div className="col-span-3 flex gap-2 flex-wrap w-full lg:w-auto px-16 lg:px-0">
                                    {(item.tags && item.tags.length > 0 ? item.tags : ['ESTRATÉGIA']).map((tag: string, i: number) => (
                                        <span key={i} className="text-[10px] font-black tracking-widest uppercase bg-gray-100 text-gray-600 px-3 py-1 rounded-full border border-gray-200">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                                <div className="col-span-2 flex flex-col items-start lg:items-end justify-center px-16 lg:px-0 mt-4 lg:mt-0 space-y-2">
                                    <button
                                        onClick={() => handleMultiplex(item.id)}
                                        disabled={isMultiplexing === item.id}
                                        className="text-[10px] font-black uppercase tracking-wider text-primary-600 bg-primary-50 px-3 py-1.5 rounded-xl hover:bg-primary-500 hover:text-white transition-all flex items-center shadow-sm disabled:opacity-50"
                                    >
                                        {isMultiplexing === item.id ? "Gerando..." : "Multiplicar"}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Selection Action Bar (Floating) */}
            {selectedIds.length > 0 && (
                <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-10 duration-500">
                    <div className="bg-gray-900 text-white rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.5)] p-4 pl-8 flex items-center space-x-8 border border-white/10 backdrop-blur-xl">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-primary-500 uppercase tracking-widest">Base de Conhecimento</span>
                            <span className="text-sm font-black">{selectedIds.length} Itens Selecionados</span>
                        </div>
                        <div className="h-8 w-px bg-white/10" />
                        <div className="flex items-center space-x-3">
                            <button
                                onClick={handleIntegrateToDNA}
                                disabled={isIntegrating}
                                className="h-12 px-6 bg-primary-500 hover:bg-primary-600 text-white text-[11px] font-black rounded-2xl flex items-center space-x-2 transition-all shadow-lg active:scale-95"
                            >
                                <BrainCircuit className="w-4 h-4" />
                                <span>{isIntegrating ? "Processando..." : "SINTONIZAR NO DNA / ESTRATÉGIA"}</span>
                            </button>
                            <button
                                onClick={() => setSelectedIds([])}
                                className="h-12 px-4 bg-white/5 hover:bg-white/10 text-gray-400 text-[11px] font-black rounded-2xl transition-all"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Criação */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300 p-4">
                    <div className="bg-white rounded-[40px] w-full max-w-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
                        <div className="p-8 border-b border-gray-100 flex items-center justify-between">
                            <h2 className="text-2xl font-black text-gray-900">Novo Insumo Semântico</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-900">
                                Fechar
                            </button>
                        </div>

                        <div className="p-8 space-y-6 overflow-y-auto flex-1 bg-gray-50/50">
                            <div>
                                <label className="text-xs font-black tracking-widest uppercase text-gray-400 mb-2 block">Título da Fonte</label>
                                <input
                                    value={newTitle}
                                    onChange={e => setNewTitle(e.target.value)}
                                    placeholder="Ex: Roteiro da Palestra em SP 2025"
                                    className="w-full h-14 px-4 bg-white border border-gray-200 rounded-[20px] focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all font-bold text-gray-700 shadow-sm"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="text-xs font-black tracking-widest uppercase text-gray-400 mb-2 block">Tipo de Fonte</label>
                                    <select
                                        value={newType}
                                        onChange={e => setNewType(e.target.value)}
                                        className="w-full h-14 px-4 bg-white border border-gray-200 rounded-[20px] focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all font-bold text-gray-700 shadow-sm"
                                    >
                                        <option value="Nota Rápida">Nota Rápida (Estudo/Livro)</option>
                                        <option value="Transcrição">Transcrição (Reunião/Podcast)</option>
                                        <option value="Artigo/Blog">Artigo (Blog Técnico)</option>
                                        <option value="Estratégia">Visão da Empresa</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-black tracking-widest uppercase text-gray-400 mb-2 block">Tags <span className="text-gray-300 font-medium normal-case">(ex: AI, TREINO)</span></label>
                                    <input
                                        value={newTags}
                                        onChange={e => setNewTags(e.target.value)}
                                        placeholder="AI, HIPERTROFIA, TREINO"
                                        className="w-full h-14 px-4 bg-white border border-gray-200 rounded-[20px] focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all font-bold text-gray-700 uppercase shadow-sm"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-black tracking-widest uppercase text-gray-400 mb-2 flex justify-between items-center">
                                    <span>Conteúdo Base</span>
                                    <div className="flex items-center space-x-3 text-sm normal-case font-bold">
                                        <button
                                            onClick={handleYouTubeSync}
                                            disabled={isUploading}
                                            className="cursor-pointer flex items-center text-red-500 hover:text-red-600 border border-red-500 hover:bg-red-50 px-3 py-1 rounded-full transition-all">
                                            <Youtube className="w-4 h-4 mr-2" />
                                            Extrair do YouTube
                                        </button>
                                        <label className="cursor-pointer flex items-center text-primary-500 hover:text-primary-600 border border-primary-500 hover:bg-primary-50 px-3 py-1 rounded-full transition-all">
                                            <UploadCloud className="w-4 h-4 mr-2" />
                                            Fazer upload de PDF
                                            <input type="file" accept="application/pdf" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
                                        </label>
                                    </div>
                                </label>
                                {isUploading && (
                                    <div className="mb-3 text-primary-500 animate-pulse font-bold text-sm bg-primary-50 p-3 rounded-xl border border-primary-100 flex items-center">
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-primary-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Conectando... Baixando texto e processando na nuvem.
                                    </div>
                                )}
                                <textarea
                                    value={newContent}
                                    onChange={e => setNewContent(e.target.value)}
                                    placeholder="Comece digitando, cole um texto ou suba um PDF no botão acima..."
                                    className="w-full h-64 p-5 bg-white border border-gray-200 rounded-[24px] focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all font-medium text-gray-700 resize-none shadow-sm leading-relaxed"
                                />
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-100 flex justify-end bg-white">
                            <button
                                onClick={handleSaveItem}
                                disabled={isSubmitting}
                                className="h-14 px-10 bg-gray-900 text-white text-sm font-black rounded-2xl shadow-xl hover:bg-black transition-all flex items-center hover:-translate-y-1 duration-300 disabled:opacity-50">
                                {isSubmitting ? "Memorizando Base..." : "Salvar no Cérebro da Marca"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* AI Chat Drawer */}
            {isChatOpen && (
                <div className="fixed inset-0 z-50 flex justify-end bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="w-full max-w-xl h-full bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-500 overflow-hidden">

                        {/* Header do Chat */}
                        <div className="h-20 bg-gray-900 flex items-center justify-between px-8 shrink-0">
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 rounded-full bg-primary-500/20 flex items-center justify-center">
                                    <Zap className="h-5 w-5 text-primary-500" />
                                </div>
                                <div>
                                    <h2 className="text-white font-black">Avatar IA</h2>
                                    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Baseado no seu cérebro</p>
                                </div>
                            </div>
                            <button onClick={() => setIsChatOpen(false)} className="text-gray-400 hover:text-white transition-colors">Fechar</button>
                        </div>

                        {/* Mensagens */}
                        <div className="flex-1 p-8 space-y-6 overflow-y-auto bg-gray-50 flex flex-col no-scrollbar">
                            {chatMessages.length === 0 && (
                                <div className="my-auto text-center space-y-4">
                                    <div className="w-20 h-20 bg-gray-200 rounded-full mx-auto flex items-center justify-center">
                                        <Zap className="h-8 w-8 text-gray-400" />
                                    </div>
                                    <h3 className="text-xl font-black text-gray-900">Olá! Eu sou sua cópia.</h3>
                                    <p className="text-sm font-medium text-gray-500 max-w-sm mx-auto">
                                        Estou escaneando os {items.length} itens do seu cérebro de marca. Pergunte sobre uma ideia ou me force a cruzar informações das suas notas.
                                    </p>
                                </div>
                            )}

                            {chatMessages.map((msg, i) => (
                                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[85%] p-4 rounded-2xl text-sm font-medium leading-relaxed ${msg.role === 'user'
                                        ? 'bg-gray-900 text-white rounded-tr-sm'
                                        : 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm shadow-sm'
                                        }`}>
                                        {msg.content}
                                    </div>
                                </div>
                            ))}

                            {isChatLoading && (
                                <div className="flex justify-start">
                                    <div className="px-5 py-4 bg-white border border-gray-200 rounded-2xl rounded-tl-sm shadow-sm flex space-x-2">
                                        <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" />
                                        <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce delay-100" />
                                        <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce delay-200" />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Input Area */}
                        <div className="p-6 bg-white border-t border-gray-100 shrink-0">
                            <form onSubmit={handleChatSubmit} className="relative">
                                <input
                                    value={currentMsg}
                                    onChange={e => setCurrentMsg(e.target.value)}
                                    placeholder="Pergunte sobre seus arquivos..."
                                    className="w-full h-14 pl-6 pr-14 bg-gray-50 border border-transparent rounded-full focus:outline-none focus:bg-white focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all font-bold text-gray-700 placeholder:text-gray-400"
                                    disabled={isChatLoading}
                                />
                                <button
                                    type="submit"
                                    disabled={!currentMsg.trim() || isChatLoading}
                                    className="absolute right-2 top-2 bottom-2 w-10 bg-gray-900 rounded-full flex items-center justify-center text-white hover:bg-black transition-colors disabled:opacity-50">
                                    <Zap className="h-4 w-4" />
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
