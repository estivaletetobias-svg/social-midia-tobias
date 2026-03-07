"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Save, Play, CheckCircle2, Image as ImageIcon, MessageSquare, Edit3, Wand2, Search, UploadCloud } from "lucide-react";
import Link from "next/link";
import TextareaAutosize from 'react-textarea-autosize';

export default function ContentEditor() {
    const params = useParams();
    const router = useRouter();
    const { id } = params as { id: string };

    const [piece, setPiece] = useState<any>(null);
    const [version, setVersion] = useState<any>(null);
    const [asset, setAsset] = useState<any>(null); // Store generated or existing image
    const [isLoading, setIsLoading] = useState(true);
    const [isGeneratingImg, setIsGeneratingImg] = useState(false);

    // Google Image states
    const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);
    const [googleQuery, setGoogleQuery] = useState("");
    const [googleResults, setGoogleResults] = useState<any[]>([]);
    const [isSearchingGoogle, setIsSearchingGoogle] = useState(false);
    const [isSavingGoogle, setIsSavingGoogle] = useState(false);

    useEffect(() => {
        const fetchContent = async () => {
            try {
                const res = await fetch(`/api/content/${id}`);
                const data = await res.json();
                if (data.success && data.piece) {
                    setPiece(data.piece);
                    if (data.piece.versions && data.piece.versions.length > 0) {
                        setVersion(data.piece.versions[0]);
                    }
                    if (data.piece.assets && data.piece.assets.length > 0) {
                        // For MVP, just get the first generated image for this piece
                        setAsset(data.piece.assets[0]);
                    }
                }
            } catch (e) {
                console.error("Failed to load content", e);
            } finally {
                setIsLoading(false);
            }
        };
        fetchContent();
    }, [id]);

    const handleGenerateImage = async () => {
        setIsGeneratingImg(true);
        try {
            const res = await fetch(`/api/content/${id}/generate-image`, { method: "POST" });
            const data = await res.json();
            if (data.success) {
                setAsset(data.asset);
            } else {
                alert(`Erro: ${data.error}`);
            }
        } catch (error) {
            console.error("Failed to generate image", error);
            alert("Falha ao se conectar com o Estúdio Visual.");
        } finally {
            setIsGeneratingImg(false);
        }
    };

    const handleSearchGoogle = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!googleQuery.trim()) return;
        setIsSearchingGoogle(true);
        try {
            const res = await fetch(`/api/content/${id}/search-image`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "search", query: googleQuery })
            });
            const data = await res.json();
            if (data.success) {
                setGoogleResults(data.results || []);
            } else {
                alert(`Erro: ${data.error}`);
            }
        } catch (error) {
            console.error("Failed to search google", error);
            alert("Falha ao buscar imagens.");
        } finally {
            setIsSearchingGoogle(false);
        }
    };

    const handleSaveGoogleImage = async (url: string) => {
        setIsSavingGoogle(true);
        try {
            const res = await fetch(`/api/content/${id}/search-image`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "save", imageUrl: url, query: googleQuery })
            });
            const data = await res.json();
            if (data.success) {
                setAsset(data.asset);
                setIsGoogleModalOpen(false);
            } else {
                alert(`Erro: ${data.error}`);
            }
        } catch (error) {
            console.error("Failed to save google image", error);
            alert("Falha ao salvar a imagem.");
        } finally {
            setIsSavingGoogle(false);
        }
    };

    const handleManualImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            alert("Apenas imagens são permitidas.");
            return;
        }

        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64Data = reader.result as string;
            setIsSavingGoogle(true);
            try {
                const res = await fetch(`/api/content/${id}/search-image`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ action: "save", imageUrl: base64Data, query: "Manual Upload" })
                });
                const data = await res.json();
                if (data.success) {
                    setAsset(data.asset);
                } else {
                    alert(`Erro: ${data.error}`);
                }
            } catch (error) {
                console.error("Failed to upload manual image", error);
                alert("Falha ao salvar a imagem.");
            } finally {
                setIsSavingGoogle(false);
            }
        };
        reader.readAsDataURL(file);
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-[60vh] text-primary-500 animate-pulse font-black text-xl">
                Carregando o Cérebro Visual...
            </div>
        );
    }

    if (!piece || !version) {
        return (
            <div className="flex justify-center items-center h-[60vh] text-gray-400 font-bold">
                Rascunho não encontrado ou ainda não gerado.
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-1000 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between pb-8 border-b border-black/5 gap-6">
                <div>
                    <Link href="/dashboard/content" className="flex items-center space-x-2 text-gray-500 hover:text-primary-600 transition-colors mb-4 font-bold text-sm w-fit">
                        <ArrowLeft className="h-4 w-4" />
                        <span>Voltar para Esteira</span>
                    </Link>
                    <div className="flex items-center space-x-3 mb-2">
                        <span className="bg-primary-500 text-white text-[10px] font-black tracking-widest uppercase px-3 py-1.5 rounded-full shadow-sm">
                            {piece.platform}
                        </span>
                        <span className="text-gray-500 text-xs font-bold uppercase tracking-wider">
                            {piece.format}
                        </span>
                    </div>
                    <h1 className="text-3xl lg:text-5xl font-black tracking-tighter text-gray-900 leading-tight">
                        {piece.title}
                    </h1>
                </div>

                <div className="flex items-center space-x-4">
                    <button
                        onClick={() => alert("Texto salvo na nuvem com sucesso!")}
                        className="h-12 px-6 glass-panel border border-white/60 shadow-sm shadow-black/5 text-gray-700 text-sm font-black rounded-xl hover:bg-white transition-all flex items-center">
                        <Save className="mr-2 h-4 w-4" />
                        Salvar
                    </button>
                    <button
                        onClick={() => alert("Aprovado! Na próxima versão esse texto irá direto para as Redes Sociais.")}
                        className="h-12 px-8 bg-gray-900 text-white text-sm font-black rounded-xl shadow-2xl hover:bg-black transition-all flex items-center transform hover:-translate-y-1 hover:shadow-primary-500/25 duration-300">
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Aprovar e Avançar
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Left Column: Visual AI Prompt & Image Preview */}
                <div className="col-span-1 lg:col-span-5 space-y-8">
                    <div className="glass-panel p-8 rounded-[40px] border-white/60 hover:shadow-2xl transition-all duration-500 group relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                        <div className="relative z-10 flex items-center justify-between mb-6">
                            <h3 className="text-xl font-black text-gray-900 flex items-center">
                                <ImageIcon className="mr-3 h-6 w-6 text-primary-500" />
                                Estúdio Visual IA
                            </h3>
                            <div className="flex space-x-2">
                                <label className="cursor-pointer h-10 px-4 bg-white border border-gray-200 text-gray-700 text-xs font-black rounded-lg hover:bg-gray-50 transition-colors flex items-center shadow-sm">
                                    <UploadCloud className="mr-2 h-3 w-3" />
                                    Upload
                                    <input type="file" accept="image/*" className="hidden" onChange={handleManualImageUpload} />
                                </label>
                                <button
                                    onClick={() => setIsGoogleModalOpen(true)}
                                    className="h-10 px-4 bg-white border border-gray-200 text-gray-700 text-xs font-black rounded-lg hover:bg-gray-50 transition-colors flex items-center shadow-sm">
                                    <Search className="mr-2 h-3 w-3" />
                                    Google Imagens
                                </button>
                                <button
                                    onClick={handleGenerateImage}
                                    disabled={isGeneratingImg}
                                    className="h-10 px-4 bg-primary-50 text-primary-600 text-xs font-black rounded-lg hover:bg-primary-500 hover:text-white transition-colors flex items-center disabled:opacity-50">
                                    {isGeneratingImg ? (
                                        <>
                                            <Wand2 className="mr-2 h-3 w-3 animate-spin" />
                                            Gerando...
                                        </>
                                    ) : (
                                        <>
                                            <Wand2 className="mr-2 h-3 w-3" />
                                            DALL-E 3
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-4 relative z-10">
                            <div>
                                <label className="text-xs font-black tracking-widest uppercase text-gray-400 mb-2 block">Conceito Visual</label>
                                <p className="text-sm font-bold text-gray-700 bg-white/50 p-4 rounded-2xl border border-white/60">
                                    {version.visualConcept || "Em breve..."}
                                </p>
                            </div>
                            <div>
                                <label className="text-xs font-black tracking-widest uppercase text-gray-400 mb-2 block">Prompt do DALL-E / Midjourney</label>
                                <textarea
                                    readOnly
                                    className="w-full text-xs font-mono text-gray-500 bg-black/5 p-4 rounded-2xl border border-transparent focus:outline-none resize-none h-32"
                                    value={version.imagePrompt || "Em breve..."}
                                />
                            </div>
                        </div>

                        <div className="mt-8 aspect-square bg-gray-100 rounded-3xl border border-gray-200 flex flex-col items-center justify-center text-gray-400 space-y-3 relative z-10 overflow-hidden shadow-inner">
                            {asset ? (
                                <img src={asset.url} alt="Generated visual" className="w-full h-full object-cover" />
                            ) : isGeneratingImg ? (
                                <div className="flex flex-col items-center justify-center animate-pulse">
                                    <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mb-4" />
                                    <span className="text-sm font-bold text-primary-600">Pintando sua obra de arte...</span>
                                </div>
                            ) : (
                                <>
                                    <ImageIcon className="h-10 w-10 opacity-50" />
                                    <span className="text-sm font-bold">Nenhuma imagem gerada ainda</span>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column: Copywriting Editor */}
                <div className="col-span-1 lg:col-span-7 space-y-8">
                    <div className="glass-panel p-8 rounded-[40px] border-white/60 hover:shadow-2xl transition-all duration-500 relative">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-xl font-black text-gray-900 flex items-center">
                                <Edit3 className="mr-3 h-6 w-6 text-primary-500" />
                                Cópia & Texto (Copywriting)
                            </h3>
                            <div className="text-xs font-bold tracking-widest uppercase text-primary-500 bg-primary-50 px-3 py-1 rounded-full">
                                Tom Autoritário
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="text-xs font-black tracking-widest uppercase text-gray-400 mb-2 flex items-center">
                                    <MessageSquare className="mr-2 h-3 w-3" />
                                    Gancho (Primeira Linha)
                                </label>
                                <TextareaAutosize
                                    defaultValue={version.hook}
                                    minRows={2}
                                    className="w-full text-lg font-black text-gray-900 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all resize-none"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-black tracking-widest uppercase text-gray-400 mb-2 block">
                                    Corpo Principal do Post
                                </label>
                                <TextareaAutosize
                                    defaultValue={version.body}
                                    minRows={8}
                                    className="w-full text-base font-medium leading-relaxed text-gray-700 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all resize-none"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-black tracking-widest uppercase text-gray-400 mb-2 block">
                                    Chamada para Ação (CTA)
                                </label>
                                <TextareaAutosize
                                    defaultValue={version.cta}
                                    minRows={1}
                                    className="w-full text-sm font-bold text-gray-900 bg-white p-4 rounded-xl border border-gray-100 shadow-sm focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all resize-none"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-black tracking-widest uppercase text-gray-400 mb-2 block">
                                    Legenda Completa (Agregada)
                                </label>
                                <TextareaAutosize
                                    defaultValue={version.caption}
                                    minRows={4}
                                    className="w-full text-sm font-medium text-gray-600 bg-gray-50 p-5 rounded-2xl border border-gray-100 focus:outline-none resize-none"
                                    readOnly // Usually the user edits the components above and this generates, or they edit this. We'll leave editable for freedom
                                />
                            </div>

                            <div>
                                <label className="text-xs font-black tracking-widest uppercase text-gray-400 mb-2 block">
                                    Hashtags
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {version.hashtags?.map((tag: string, i: number) => (
                                        <span key={i} className="text-xs font-bold text-primary-600 bg-primary-50 px-3 py-1.5 rounded-lg border border-primary-100">
                                            {tag.startsWith('#') ? tag : `#${tag}`}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* Google Image Search Modal */}
            {isGoogleModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300 p-4">
                    <div className="bg-white rounded-[40px] w-full max-w-4xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
                        <div className="p-8 border-b border-gray-100 flex items-center justify-between">
                            <h2 className="text-2xl font-black text-gray-900 flex items-center">
                                <Search className="mr-3 h-6 w-6 text-primary-500" />
                                Buscar Foto Real (Google Images)
                            </h2>
                            <button onClick={() => setIsGoogleModalOpen(false)} className="text-gray-400 hover:text-gray-900">
                                Fechar
                            </button>
                        </div>

                        <div className="p-8 space-y-6 overflow-y-auto flex-1 bg-gray-50/50">
                            <form onSubmit={handleSearchGoogle} className="flex gap-4">
                                <input
                                    value={googleQuery}
                                    onChange={(e) => setGoogleQuery(e.target.value)}
                                    placeholder="Ex: mulher treinando academia hipertrofia"
                                    className="flex-1 h-14 px-5 bg-white border border-gray-200 rounded-[20px] focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all font-bold text-gray-700 shadow-sm"
                                    autoFocus
                                />
                                <button
                                    type="submit"
                                    disabled={isSearchingGoogle}
                                    className="h-14 px-8 bg-gray-900 text-white text-sm font-black rounded-2xl shadow-xl hover:bg-black transition-all flex items-center disabled:opacity-50">
                                    {isSearchingGoogle ? "Buscando..." : "Buscar Imagens"}
                                </button>
                            </form>

                            {googleResults.length > 0 && (
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-6">
                                    {googleResults.map((img, i) => (
                                        <div
                                            key={i}
                                            onClick={() => handleSaveGoogleImage(img.url)}
                                            className="relative aspect-square rounded-2xl overflow-hidden group cursor-pointer border border-gray-200 bg-white"
                                        >
                                            <img src={img.url} alt="Result" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <span className="text-white text-xs font-bold uppercase tracking-widest border border-white px-3 py-1 rounded-full">
                                                    Selecionar
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {!isSearchingGoogle && googleResults.length === 0 && googleQuery && (
                                <div className="text-center text-gray-500 font-medium py-10">
                                    Nenhuma imagem encontrada.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
