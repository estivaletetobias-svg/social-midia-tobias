"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ChefHat, Lock, Mail, ArrowRight, Sparkles } from "lucide-react";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        try {
            const result = await signIn("credentials", {
                email,
                password,
                redirect: false,
            });

            if (result?.error) {
                setError("Acesso negado. Verifique suas credenciais.");
            } else {
                router.push("/dashboard");
                router.refresh();
            }
        } catch (err) {
            setError("Erro na comunicação com o STELAR Core.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#EAEAE5] overflow-hidden">
            {/* Background Architectural Grid (Subtle) */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: `linear-gradient(#000 1px, transparent 1px), linear-gradient(90(#000 1px, transparent 1px)`, backgroundSize: '100px 100px' }}></div>
            
            <div className="relative w-full max-w-md p-8 animate-in fade-in slide-in-from-bottom-10 duration-1000">
                {/* Brand Identity */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-900 rounded-[2.5rem] mb-8 shadow-2xl transform hover:rotate-12 transition-transform duration-500">
                        <Sparkles className="h-10 w-10 text-white" />
                    </div>
                    <h1 className="text-6xl font-black text-gray-900 tracking-tighter font-[family-name:var(--font-space)] uppercase leading-none">
                        STELAR
                    </h1>
                    <p className="mt-4 text-[11px] font-medium text-gray-400 font-serif italic tracking-[0.3em] uppercase">
                        The Social Architect System
                    </p>
                    <div className="mt-2 h-0.5 w-12 bg-gray-900/10 mx-auto"></div>
                </div>

                {/* Login Card */}
                <div className="bg-white/40 backdrop-blur-xl rounded-[3rem] p-10 border border-white/60 shadow-2xl shadow-black/5">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Identidade (Email)</label>
                            <div className="relative group">
                                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-gray-900 transition-colors" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full h-16 pl-14 pr-6 bg-white border border-transparent rounded-[1.5rem] focus:outline-none focus:ring-2 focus:ring-gray-900/5 focus:border-gray-900/20 transition-all font-bold text-gray-900 placeholder:text-gray-300"
                                    placeholder="seu@email.com"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Chave de Acesso</label>
                            <div className="relative group">
                                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-gray-900 transition-colors" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full h-16 pl-14 pr-6 bg-white border border-transparent rounded-[1.5rem] focus:outline-none focus:ring-2 focus:ring-gray-900/5 focus:border-gray-900/20 transition-all font-bold text-gray-900 placeholder:text-gray-300"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        {error && (
                            <p className="text-xs font-bold text-red-500 text-center animate-shake">{error}</p>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full h-20 bg-gray-900 text-white font-black uppercase tracking-[0.2em] text-xs rounded-[1.5rem] hover:bg-black transition-all flex items-center justify-center shadow-xl shadow-gray-900/20 active:scale-95 disabled:opacity-50"
                        >
                            {isLoading ? (
                                <div className="h-5 w-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    Autenticar Entrada
                                    <ArrowRight className="ml-3 h-4 w-4" />
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* Footer Signature */}
                <div className="mt-12 text-center">
                    <p className="text-[10px] font-black text-gray-400/50 uppercase tracking-[0.4em]">
                        Handcrafted by Tobias Estivalete
                    </p>
                </div>
            </div>
        </div>
    );
}
