"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
    Plus,
    ArrowUpRight,
    Clock,
    CheckCircle2,
    PenTool,
    Sparkles,
    Activity
} from "lucide-react";
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
    const { data: session } = useSession();
    const router = useRouter();
    const [statsData, setStatsData] = useState({ draftsCount: 0, approvedCount: 0, topicsCount: 0, hoursSaved: 0 });
    const [recentPieces, setRecentPieces] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const activeBrandId = localStorage.getItem('active_brand_id');
        if (!activeBrandId) {
            setIsLoading(false);
            return;
        }

        const fetchDashboard = async () => {
            try {
                const res = await fetch(`/api/dashboard?id=${activeBrandId}`);
                const data = await res.json();
                if (data.success) {
                    setStatsData(data.stats);
                    setRecentPieces(data.recentPieces);
                }
            } catch (error) {
                console.error("Failed to load dashboard data", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchDashboard();
    }, []);

    const statusLabels: Record<string, string> = {
        "idea": "Novas Pautas",
        "draft": "Em Produção",
        "review": "Aprovação",
        "approved": "Prontos",
        "published": "Publicados"
    };

    const stats = [
        { name: "Painel de Rascunhos", value: statsData.draftsCount, icon: PenTool, change: "+3", changeType: "increase" },
        { name: "Conteúdos Prontos", value: statsData.approvedCount, icon: CheckCircle2, change: "+1", changeType: "increase" },
        { name: "Pautas de IA Novas", value: statsData.topicsCount, icon: Sparkles, change: "+5", changeType: "increase" },
        { name: "Horas Poupadas", value: statsData.hoursSaved + "h", icon: Clock, change: "+4.2", changeType: "increase" },
    ];

    return (
        <div className="max-w-7xl mx-auto space-y-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                <div>
                    <h1 className="text-5xl font-black text-gray-900 tracking-tighter font-[family-name:var(--font-space)] uppercase mb-2">STELAR Architecture</h1>
                    <p className="text-lg text-gray-400 max-w-2xl font-medium tracking-tight">
                        Bem-vindo, {session?.user?.name || 'Arquiteto'}. Seu motor editorial identificou <span className="text-gray-900 font-bold">{statsData.topicsCount} novos insights</span> para sua audiência hoje.
                    </p>
                </div>
                <div className="flex items-center space-x-4">
                    <button
                        onClick={() => router.push('/dashboard/ideas')}
                        className="inline-flex items-center px-8 py-4 border-none text-xs font-black uppercase tracking-widest rounded-2xl shadow-2xl text-white bg-gray-900 hover:bg-black transition-all duration-300 transform hover:-translate-y-1">
                        <Plus className="-ml-1 mr-3 h-4 w-4" />
                        Ver Novas Pautas
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {stats.map((item) => (
                    <div key={item.name} className="relative group bg-white p-8 rounded-3xl shadow-sm border border-gray-100/50 hover:shadow-xl hover:shadow-gray-200/50 transition-all duration-300 overflow-hidden">
                        <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform duration-500">
                            <item.icon className="h-12 w-12 text-primary-600" />
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center justify-center h-12 w-12 rounded-2xl bg-primary-50 text-primary-600 group-hover:bg-primary-600 group-hover:text-white transition-colors duration-300">
                                <item.icon className="h-6 w-6" aria-hidden="true" />
                            </div>
                            <span className="flex items-center text-xs font-bold text-green-600 bg-green-50 px-3 py-1.5 rounded-full ring-1 ring-inset ring-green-600/10">
                                <ArrowUpRight className="h-4 w-4 mr-1" />
                                {item.change}
                            </span>
                        </div>
                        <div className="mt-6">
                            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{item.name}</p>
                            <h3 className="text-4xl font-black text-gray-900 mt-2">{item.value}</h3>
                        </div>
                    </div>
                ))}
            </div>

            {/* Grid for main sections */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Pipeline */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-8 py-6 border-b border-gray-50 flex items-center justify-between">
                            <h3 className="text-xl font-bold text-gray-900 flex items-center"><Activity className="mr-3 h-5 w-5 text-primary-500" />Esteira de Produção Ativa</h3>
                            <Link href="/dashboard/content" className="text-primary-600 text-sm font-bold hover:text-primary-700 transition-colors">Ver Todas</Link>
                        </div>
                        <div className="divide-y divide-gray-50">
                            {isLoading ? (
                                <div className="p-8 text-center text-gray-400 font-bold animate-pulse">Carregando Esteira...</div>
                            ) : recentPieces.length === 0 ? (
                                <div className="p-8 text-center text-gray-400 font-bold">Nenhum post na esteira de produção.</div>
                            ) : (
                                recentPieces.map((piece) => (
                                    <div key={piece.id} className="px-8 py-6 flex flex-col md:flex-row md:items-center group hover:bg-gray-50/50 transition-colors gap-4 md:gap-0">
                                        <div className="flex-shrink-0 h-12 w-12 bg-primary-50 rounded-2xl flex items-center justify-center text-primary-600 group-hover:bg-primary-600 group-hover:text-white transition-all hidden md:flex">
                                            <PenTool className="h-6 w-6" />
                                        </div>
                                        <div className="md:ml-6 flex-1">
                                            <h4 className="text-base font-bold text-gray-900 line-clamp-1">{piece.title}</h4>
                                            <div className="mt-1 flex items-center space-x-4">
                                                <span className="text-xs font-black tracking-widest uppercase text-gray-400">{piece.platform} {piece.format}</span>
                                                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md uppercase tracking-wide">{statusLabels[piece.status] || piece.status}</span>
                                            </div>
                                        </div>
                                        <div className="md:ml-4 flex items-center space-x-3 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity mt-4 md:mt-0">
                                            <button
                                                onClick={() => piece.status === 'idea' ? router.push('/dashboard/content') : router.push(`/dashboard/content/${piece.id}`)}
                                                className="w-full md:w-auto px-5 py-2.5 text-sm font-bold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all flex justify-center items-center">
                                                {piece.status === 'idea' ? 'Gerar pela Esteira' : 'Editar Cópia'}
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Sidebar widgets */}
                <div className="space-y-8">
                    <div className="bg-[#1C1C1C] rounded-[40px] shadow-2xl p-10 text-white relative overflow-hidden group border border-white/5">
                        <div className="absolute top-0 right-0 p-10 opacity-5 transform translate-x-4 translate-y-4 group-hover:scale-125 transition-transform duration-700">
                            <Sparkles className="h-40 w-40" />
                        </div>
                        <h3 className="text-3xl font-black relative font-[family-name:var(--font-space)] uppercase tracking-tighter">Insights do Vault</h3>
                        <p className="mt-6 text-gray-400 font-medium leading-relaxed relative text-lg">
                            Nosso motor semântico cruzou feed de notícias e encontrou <strong>{statsData.topicsCount} ganchos magnéticos</strong> para as suas redes sociais.
                        </p>
                        <button
                            onClick={() => router.push('/dashboard/ideas')}
                            className="mt-10 w-full flex items-center justify-center py-5 px-8 bg-white text-gray-900 font-black uppercase tracking-widest text-xs rounded-2xl shadow-lg hover:bg-gray-100 transition-all transform hover:scale-[1.02] active:scale-100 relative">
                            Explorar Ideias
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
