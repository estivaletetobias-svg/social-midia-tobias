"use client";

import { useState, useEffect } from "react";
import { Plus, Search, FileText, Zap, HelpCircle, Trash2, Link as LinkIcon } from "lucide-react";

export default function KnowledgeBase() {
    const [items, setItems] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isChatAlertOpen, setIsChatAlertOpen] = useState(false);
    const [newTitle, setNewTitle] = useState("");
    const [newContent, setNewContent] = useState("");
    const [newType, setNewType] = useState("Nota Rápida");
    const [newTags, setNewTags] = useState("");

    const loadItems = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/knowledge');
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
                    tags: newTags.split(',').map(t => t.trim()).filter(Boolean)
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

    return (
        <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-1000">
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
                            onClick={() => setIsChatAlertOpen(true)}
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
                        <button className="px-6 py-3 text-xs font-black rounded-[16px] transition-all uppercase tracking-wider text-gray-500 hover:text-gray-900 hover:bg-white/40 border border-transparent">
                            Estratégia
                        </button>
                        <button className="px-6 py-3 text-xs font-black rounded-[16px] transition-all uppercase tracking-wider text-gray-500 hover:text-gray-900 hover:bg-white/40 border border-transparent">
                            Tendências de Mercado
                        </button>
                        <button className="px-6 py-3 text-xs font-black rounded-[16px] transition-all uppercase tracking-wider text-gray-500 hover:text-gray-900 hover:bg-white/40 border border-transparent">
                            Notas Pessoais
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
                    <div className="hidden lg:grid grid-cols-12 gap-4 p-6 border-b border-gray-100 bg-white/50 text-xs font-black tracking-widest uppercase text-gray-400">
                        <div className="col-span-5">Documento de Conhecimento</div>
                        <div className="col-span-2">Tipo</div>
                        <div className="col-span-3">Tags & Eixo</div>
                        <div className="col-span-2 text-right">Adicionado em</div>
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
                            <div key={item.id || index} className="flex flex-col lg:grid lg:grid-cols-12 gap-4 p-6 items-center hover:bg-white/60 transition-colors group">
                                <div className="col-span-5 flex items-center space-x-4 w-full">
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
                                <div className="col-span-2 text-left lg:text-right w-full lg:w-auto px-16 lg:px-0 mt-4 lg:mt-0">
                                    <span className="text-sm font-bold text-gray-400">
                                        {new Date(item.createdAt).toLocaleDateString('pt-BR')}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

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
                                <label className="text-xs font-black tracking-widest uppercase text-gray-400 mb-2 flex justify-between">
                                    <span>Conteúdo Base</span>
                                    <span className="font-normal normal-case text-gray-300">Cole o texto bruto aqui</span>
                                </label>
                                <textarea
                                    value={newContent}
                                    onChange={e => setNewContent(e.target.value)}
                                    placeholder="Cole aqui a transcrição inteira do seu áudio, do vídeo do YouTube que você gostou ou seu texto autoral..."
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

            {/* Chat Alert Modal */}
            {isChatAlertOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300 p-4">
                    <div className="bg-white rounded-[40px] w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col items-center p-12 text-center text-gray-900 space-y-6">
                        <div className="w-20 h-20 rounded-full bg-primary-50 flex items-center justify-center text-primary-500 mb-2">
                            <Zap className="w-10 h-10" />
                        </div>
                        <h2 className="text-3xl font-black">Em Evolução</h2>
                        <p className="text-gray-500 font-medium text-lg leading-relaxed">
                            Em breve, nesta tela, você poderá conversar diretamente com o seu Avatar. Ele vasculhará sua base de conhecimento para responder às suas perguntas de maneira idêntica ao que o NotebookLM faz hoje!
                        </p>
                        <button
                            onClick={() => setIsChatAlertOpen(false)}
                            className="mt-4 h-14 px-10 bg-gray-900 text-white text-sm font-black rounded-2xl shadow-xl hover:bg-black transition-all transform hover:-translate-y-1 duration-300">
                            Entendi!
                        </button>
                    </div>
                </div>
            )}

        </div>
    );
}
