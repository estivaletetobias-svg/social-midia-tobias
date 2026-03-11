"use client";

import { useEffect, useState } from "react";
import { 
    Users, 
    Plus, 
    Search, 
    Building2, 
    ArrowRight, 
    MoreVertical,
    CheckCircle2,
    Briefcase
} from "lucide-react";
import { useRouter } from "next/navigation";

interface Brand {
    id: string;
    name: string;
    description: string | null;
    avatarUrl: string | null;
}

export default function ClientsPage() {
    const [brands, setBrands] = useState<Brand[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    
    // Invite Modal State
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [clientEmail, setClientEmail] = useState("");
    const [brandName, setBrandName] = useState("");
    const [inviteResult, setInviteResult] = useState<any>(null);
    const [isInviting, setIsInviting] = useState(false);

    const router = useRouter();

    useEffect(() => {
        fetchBrands();
    }, []);

    const fetchBrands = async () => {
        try {
            const res = await fetch('/api/brand/list');
            const data = await res.json();
            if (data.success) {
                setBrands(data.brands);
            }
        } catch (error) {
            console.error("Erro ao buscar clientes:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleInviteClient = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsInviting(true);
        try {
            const res = await fetch('/api/clients/invite', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: clientEmail, brandName })
            });
            const data = await res.json();
            if (data.success) {
                setInviteResult(data.clientInfo);
                fetchBrands(); // Refresh list to show the new brand
            } else {
                alert(data.error);
            }
        } catch (error) {
            console.error(error);
            alert("Falha ao enviar convite.");
        } finally {
            setIsInviting(false);
        }
    };

    const handleSelectClient = (brandId: string) => {
        // Store selected client in localStorage for session-wide access
        localStorage.setItem('active_brand_id', brandId);
        router.push('/dashboard');
    };

    const filteredBrands = brands.filter(b => 
        b.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-1000">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-6 md:space-y-0 pb-10 border-b border-black/5">
                <div>
                    <div className="flex items-center space-x-3 mb-3 animate-fade-in">
                        <div className="h-1.5 w-8 bg-gray-900 rounded-full" />
                        <span className="text-xs font-black text-gray-400 uppercase tracking-[0.3em]">Client Architecture</span>
                    </div>
                    <h1 className="text-6xl lg:text-8xl font-black tracking-tighter text-gray-900 leading-[0.85] font-[family-name:var(--font-space)] uppercase">
                        Gestão de <span className="text-gray-400/30">Clientes</span>
                    </h1>
                    <p className="mt-8 text-xl text-gray-400 max-w-2xl font-medium leading-relaxed">
                        Gerencie os ecossistemas editoriais e a autoridade stelar de todos os seus assessorados.
                    </p>
                </div>
                <div className="flex items-center space-x-4">
                    <button
                        onClick={() => setIsInviteModalOpen(true)}
                        className="inline-flex items-center px-8 py-4 border-none text-xs font-black uppercase tracking-widest rounded-2xl shadow-2xl text-white bg-gray-900 hover:bg-black transition-all duration-300 transform hover:-translate-y-1">
                        <Plus className="-ml-1 mr-3 h-4 w-4" />
                        Convidar Arquiteto Social
                    </button>
                </div>
            </div>

            {/* Search & Stats */}
            <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
                <div className="relative w-full md:max-w-md group">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-gray-900 transition-colors" />
                    <input 
                        type="text"
                        placeholder="Buscar por nome ou nicho..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full h-16 pl-16 pr-6 bg-white/50 border border-white/60 rounded-[1.5rem] focus:outline-none focus:ring-4 focus:ring-gray-900/5 focus:border-gray-900/20 transition-all font-bold text-gray-900"
                    />
                </div>
                <div className="flex items-center gap-8 py-4 px-10 bg-white/40 rounded-[1.5rem] border border-white/60">
                    <div className="text-center border-r border-black/5 pr-8">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total</p>
                        <p className="text-2xl font-black text-gray-900">{brands.length}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Ativos</p>
                        <p className="text-2xl font-black text-green-600">{brands.length}</p>
                    </div>
                </div>
            </div>

            {/* Clients Grid */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-64 bg-white/20 rounded-[2.5rem] animate-pulse" />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredBrands.map((brand) => (
                        <div 
                            key={brand.id}
                            className="group relative bg-white/60 backdrop-blur-sm p-10 rounded-[2.5rem] border border-white/60 hover:shadow-2xl hover:shadow-black/5 transition-all duration-500 overflow-hidden cursor-pointer"
                            onClick={() => handleSelectClient(brand.id)}
                        >
                            {/* Decorative Grid */}
                            <div className="absolute inset-0 opacity-[0.02] bg-[radial-gradient(#000_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />
                            
                            <div className="relative z-10">
                                <div className="flex items-start justify-between mb-8">
                                    <div className="w-20 h-20 rounded-[1.5rem] bg-gray-900 flex items-center justify-center shadow-2xl overflow-hidden group-hover:scale-110 transition-transform duration-500">
                                        {brand.avatarUrl ? (
                                            <img src={brand.avatarUrl} alt={brand.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <Building2 className="h-10 w-10 text-white" />
                                        )}
                                    </div>
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-50 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <ArrowRight className="h-5 w-5" />
                                    </div>
                                </div>

                                <h3 className="text-2xl font-black text-gray-900 tracking-tighter mb-2 group-hover:text-primary-600 transition-colors">
                                    {brand.name}
                                </h3>
                                <p className="text-gray-400 font-medium text-sm line-clamp-2 leading-relaxed">
                                    {brand.description || "Sem descrição definida no DNA."}
                                </p>

                                <div className="mt-8 pt-8 border-t border-black/5 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">DNA Verificado</span>
                                    </div>
                                    <div className="px-3 py-1 bg-gray-900/5 rounded-lg text-gray-500 font-black text-[9px] uppercase tracking-widest">
                                        Active Profile
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Add New Client Card */}
                    <button 
                        onClick={() => setIsInviteModalOpen(true)}
                        className="group p-10 rounded-[2.5rem] border-2 border-dashed border-gray-300 hover:border-gray-900 hover:bg-white/40 transition-all duration-500 flex flex-col items-center justify-center gap-4 min-h-[300px]"
                    >
                        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-gray-900 group-hover:text-white transition-all">
                            <Plus className="h-8 w-8 text-gray-400 group-hover:text-white" />
                        </div>
                        <div className="text-center">
                            <p className="text-lg font-black text-gray-900">Provisionar Conta</p>
                            <p className="text-xs font-medium text-gray-400">Clique para convidar por email</p>
                        </div>
                    </button>
                </div>
            )}

            {/* Invite Modal */}
            {isInviteModalOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white rounded-[3rem] p-10 max-w-lg w-full shadow-2xl overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-8">
                            <button onClick={() => { setIsInviteModalOpen(false); setInviteResult(null); }} className="text-gray-400 hover:text-gray-900 transition-colors">
                                <Plus className="h-6 w-6 rotate-45" />
                            </button>
                        </div>

                        {!inviteResult ? (
                            <form onSubmit={handleInviteClient} className="space-y-8">
                                <div className="space-y-2 text-center">
                                    <h2 className="text-3xl font-black text-gray-900 tracking-tighter uppercase">Convidar Novo Cliente</h2>
                                    <p className="text-sm text-gray-400 font-medium">Provisione o espaço editorial para o seu novo assessorado.</p>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Email do Cliente</label>
                                        <input 
                                            type="email"
                                            required
                                            value={clientEmail}
                                            onChange={(e) => setClientEmail(e.target.value)}
                                            placeholder="exemplo@gmail.com"
                                            className="w-full h-16 px-6 bg-gray-50 border-none rounded-[1.5rem] focus:ring-2 focus:ring-gray-900/5 transition-all font-bold text-gray-900"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Nome da Marca / Perfil</label>
                                        <input 
                                            type="text"
                                            required
                                            value={brandName}
                                            onChange={(e) => setBrandName(e.target.value)}
                                            placeholder="Ex: João Performance"
                                            className="w-full h-16 px-6 bg-gray-50 border-none rounded-[1.5rem] focus:ring-2 focus:ring-gray-900/5 transition-all font-bold text-gray-900"
                                        />
                                    </div>
                                </div>

                                <button 
                                    disabled={isInviting}
                                    type="submit"
                                    className="w-full h-20 bg-gray-900 text-white font-black uppercase tracking-[0.2em] text-xs rounded-[1.5rem] hover:bg-black transition-all shadow-xl shadow-black/5 flex items-center justify-center disabled:opacity-50"
                                >
                                    {isInviting ? "Provisionando..." : "Enviar Acesso e Criar DNA"}
                                </button>
                            </form>
                        ) : (
                            <div className="space-y-8 py-4">
                                <div className="text-center space-y-2">
                                    <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <CheckCircle2 className="h-8 w-8 text-green-600" />
                                    </div>
                                    <h2 className="text-3xl font-black text-gray-900 tracking-tighter uppercase">Tudo Pronto!</h2>
                                    <p className="text-sm text-gray-400 font-medium">Passe as credenciais abaixo para o cliente iniciar o DNA.</p>
                                </div>

                                <div className="bg-gray-50 p-8 rounded-[2rem] space-y-4 border border-black/5">
                                    <div>
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Acesso:</p>
                                        <p className="font-bold text-gray-900">{inviteResult.email}</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Senha Provisória:</p>
                                        <p className="text-2xl font-black text-gray-900 tracking-tighter select-all">{inviteResult.tempPassword}</p>
                                    </div>
                                </div>

                                <button 
                                    onClick={() => { setIsInviteModalOpen(false); setInviteResult(null); setClientEmail(""); setBrandName(""); }}
                                    className="w-full h-16 bg-gray-900 text-white font-black uppercase tracking-widest text-xs rounded-[1.5rem] hover:bg-black transition-all"
                                >
                                    Concluído
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
