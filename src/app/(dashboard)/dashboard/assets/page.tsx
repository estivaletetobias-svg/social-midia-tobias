"use client";

import { useEffect, useState } from "react";
import { Download, ExternalLink, Image as ImageIcon, Layers, MoreHorizontal, Plus, Search, Sparkles, Trash2, Calendar } from "lucide-react";
import Link from "next/link";

export default function VisualAssets() {
    const [assets, setAssets] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    const loadAssets = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/assets");
            const data = await res.json();
            if (data.success) {
                setAssets(data.assets);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadAssets();
    }, []);

    const filteredAssets = assets.filter(a =>
        (a.prompt?.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (a.contentPiece?.title?.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in slide-in-from-right-8 duration-1000 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8 pb-12 border-b border-black/5">
                <div className="space-y-6">
                    <div className="flex items-center space-x-3 mb-2">
                        <div className="h-12 w-12 bg-primary-50 rounded-2xl flex items-center justify-center text-primary-600 shadow-sm border border-primary-100/50">
                            <ImageIcon className="h-6 w-6" />
                        </div>
                        <span className="text-xs font-black text-primary-600 uppercase tracking-[0.2em]">Asset Management</span>
                    </div>
                    <h1 className="text-5xl lg:text-6xl font-black text-gray-900 tracking-tighter leading-tight">Visual <span className="text-primary-500">Library</span></h1>
                    <p className="text-xl text-gray-500/80 font-medium max-w-2xl leading-relaxed">
                        Seu repositório de elite para todas as imagens e mídias geradas pela Inteligência Artificial. Totalmente treinado no DNA da sua marca.
                    </p>
                </div>
                <div className="flex items-center space-x-4">
                    <button className="h-16 px-10 bg-white border border-gray-100 text-gray-900 text-sm font-black rounded-3xl hover:bg-gray-50 transition-all flex items-center shadow-xl shadow-black/5 transform hover:-translate-y-1">
                        <Layers className="mr-3 h-5 w-5" /> Coleções
                    </button>
                    <Link href="/dashboard/content" className="h-16 px-10 bg-gray-900 text-white text-sm font-black rounded-3xl shadow-2xl hover:bg-black transition-all transform hover:-translate-y-1 flex items-center">
                        <Sparkles className="mr-3 h-5 w-5 text-primary-400" /> Criar Novo Visual
                    </Link>
                </div>
            </div>

            {/* Grid Explorer */}
            <div className="space-y-10">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <h2 className="text-2xl font-black text-gray-900 flex items-center tracking-tight">
                        Gerações Recentes <span className="ml-4 px-4 py-1.5 bg-primary-50 text-primary-600 text-[10px] font-black rounded-full uppercase tracking-widest border border-primary-100">{filteredAssets.length} Gerados</span>
                    </h2>
                    <div className="relative w-full md:w-96 group">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-300 group-focus-within:text-primary-500 transition-colors" />
                        <input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full h-14 pl-14 pr-6 bg-white border border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all font-bold text-gray-700 placeholder:text-gray-300"
                            placeholder="Buscar por prompt ou título..."
                        />
                    </div>
                </div>

                {isLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="aspect-square rounded-[40px] bg-gray-100 animate-pulse border border-gray-200" />
                        ))}
                    </div>
                ) : filteredAssets.length === 0 ? (
                    <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-[40px] py-32 text-center space-y-6">
                        <div className="h-20 w-20 bg-white shadow-xl shadow-black/5 rounded-full mx-auto flex items-center justify-center text-gray-300">
                            <ImageIcon className="h-8 w-8" />
                        </div>
                        <div>
                            <p className="text-2xl font-black text-gray-900">Biblioteca Vazia</p>
                            <p className="text-gray-400 font-bold max-w-sm mx-auto mt-2">Gere sua primeira imagem dentro da Esteira de Produção para vê-la brilhar aqui.</p>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
                        {filteredAssets.map((asset, i) => (
                            <div key={asset.id} className="group relative bg-white rounded-[40px] overflow-hidden shadow-sm border border-gray-100 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500">
                                <div className="aspect-[4/5] relative overflow-hidden bg-gray-100">
                                    <img
                                        src={asset.url}
                                        alt={asset.type}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                    />
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-3 backdrop-blur-[2px]">
                                        <a href={asset.url} target="_blank" className="h-14 w-14 bg-white rounded-2xl flex items-center justify-center text-gray-900 hover:bg-primary-500 hover:text-white transition-all transform hover:scale-110 shadow-xl">
                                            <Download className="h-6 w-6" />
                                        </a>
                                        {asset.contentPieceId && (
                                            <Link href={`/dashboard/content/${asset.contentPieceId}`} className="h-14 w-14 bg-white rounded-2xl flex items-center justify-center text-gray-900 hover:bg-primary-500 hover:text-white transition-all transform hover:scale-110 shadow-xl">
                                                <ExternalLink className="h-6 w-6" />
                                            </Link>
                                        )}
                                    </div>
                                    <div className="absolute top-4 left-4">
                                        <span className="bg-white/80 backdrop-blur-md px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest text-gray-900 shadow-sm border border-white/50">
                                            {asset.model || "MODELO IA"}
                                        </span>
                                    </div>
                                </div>
                                <div className="p-6 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-2 text-gray-400">
                                            <Calendar className="h-3 w-3" />
                                            <span className="text-[10px] font-black uppercase tracking-widest">{new Date(asset.createdAt).toLocaleDateString('pt-BR')}</span>
                                        </div>
                                    </div>
                                    <h3 className="text-base font-black text-gray-900 line-clamp-2 tracking-tight">
                                        {asset.contentPiece?.title || "Asset Isolado"}
                                    </h3>

                                    <div className="pt-4 border-t border-gray-50 space-y-3">
                                        <p className="text-[11px] font-medium text-gray-400 line-clamp-2 italic leading-relaxed">
                                            "{asset.prompt || "Sem prompt disponível."}"
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
