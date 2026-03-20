"use client";

import { useEffect, useState } from "react";
import { 
  Save, 
  Trash2, 
  Plus, 
  BrainCircuit,
  Sparkles,
  Instagram,
  Linkedin,
  Twitter,
  Youtube,
  Globe,
  CheckCircle2,
  ShieldCheck,
  Target,
  Info,
  Loader2,
  PenTool,
  ArrowUpRight,
  Users
} from "lucide-react";
import Link from "next/link";


interface Pillar {
  id?: string;
  title: string;
  description: string;
}

interface Audience {
  id?: string;
  name: string;
  painPoints: string[];
}

interface SocialProfile {
  id?: string;
  platform: string;
  handle: string;
  url: string;
  isActive: boolean;
  metadata?: any;
}

export default function BrandDnaPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [hasPendingRefine, setHasPendingRefine] = useState(false);
  const [refineApplied, setRefineApplied] = useState(false);
  
  // Perfil Base
  const [brandId, setBrandId] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [toneOfVoice, setToneOfVoice] = useState("");
  
  // Listas
  const [pillars, setPillars] = useState<Pillar[]>([]);
  const [audience, setAudience] = useState<Audience[]>([]);
  const [socialProfiles, setSocialProfiles] = useState<SocialProfile[]>([]);

  const platforms = [
    { id: 'instagram', label: 'Instagram', icon: Instagram, color: 'text-pink-600' },
    { id: 'linkedin', label: 'LinkedIn', icon: Linkedin, color: 'text-blue-700' },
    { id: 'youtube', label: 'YouTube', icon: Youtube, color: 'text-red-600' },
    { id: 'twitter', label: 'Twitter/X', icon: Twitter, color: 'text-slate-900' },
    { id: 'tiktok', label: 'TikTok', icon: Globe, color: 'text-black' },
    { id: 'site', label: 'WebSite', icon: Globe, color: 'text-green-600' },
  ];

  useEffect(() => {
    const activeId = localStorage.getItem('active_brand_id');
    const pendingIds = localStorage.getItem('dna_sync_source_ids');
    if (pendingIds) setHasPendingRefine(true);

    if (!activeId) {
      setLoading(false);
      return;
    }

    fetch(`/api/brand/dna?id=${activeId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data) {
          const b = data.data;
          setBrandId(b.id);
          setName(b.name || "");
          setDescription(b.description || "");
          setToneOfVoice(b.toneOfVoice || "");
          setPillars(b.editorialPillars || []);
          setAudience(b.audienceSegments || []);
          setSocialProfiles(b.socialProfiles || []);
        }
        setLoading(false);
      });
  }, []);

  const handleAiRefine = async () => {
    const pendingIdsString = localStorage.getItem('dna_sync_source_ids');
    if (!pendingIdsString) return;
    const pendingIds = JSON.parse(pendingIdsString);
    if (pendingIds.length === 0) return;

    setIsRefining(true);
    try {
      const res = await fetch('/api/brand/dna/refine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
           brandId,
           knowledgeItemIds: pendingIds
        })
      });
      const data = await res.json();
      if (data.success && data.suggestions) {
        const s = data.suggestions;
        setDescription(s.description);
        setToneOfVoice(s.toneOfVoice);
        setPillars(s.editorialPillars);
        setAudience(s.audienceSegments);
        setRefineApplied(true);
        setHasPendingRefine(false);
      }
    } catch (e) {
      console.error(e);
      alert("Erro ao sintonizar com o Sistema.");
    } finally {
      setIsRefining(false);
    }
  };

  const handleClearRefine = () => {
    localStorage.removeItem('dna_sync_source_ids');
    setHasPendingRefine(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const resp = await fetch('/api/brand/dna', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: brandId,
          name,
          description,
          toneOfVoice,
          editorialPillars: pillars,
          audienceSegments: audience,
          socialProfiles: socialProfiles
        })
      });
      const data = await resp.json();
      if (data.success) {
        if (data.brandId) {
            setBrandId(data.brandId);
            localStorage.setItem('active_brand_id', data.brandId);
        }
        setRefineApplied(false);
        localStorage.removeItem('dna_sync_source_ids');
        alert("DNA da Marca atualizado com sucesso!");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const addPillar = () => {
    setPillars([...pillars, { title: "", description: "" }]);
  };

  const removePillar = (idx: number) => {
    setPillars(pillars.filter((_, i) => i !== idx));
  };

  const addAudience = () => {
    setAudience([...audience, { name: "", painPoints: [] }]);
  };

  const removeAudience = (idx: number) => {
    setAudience(audience.filter((_, i) => i !== idx));
  };

  if (loading) return <div className="p-12 animate-pulse text-gray-500 font-bold uppercase tracking-widest text-sm">Carregando DNA da Marca...</div>;

  return (
    <div className="max-w-7xl mx-auto space-y-16 py-10 animate-in fade-in slide-in-from-bottom-6 duration-1000 pb-20">
      {/* Header - Authority Level */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-12 border-b border-gray-100 pb-16">
        <div className="space-y-6 flex-1">
          <div className="flex items-center gap-3">
            <div className="pulse-indicator" />
            <span className="text-[10px] font-black text-[#2B3440] uppercase tracking-[0.4em]">Núcleo de Identidade Ativo</span>
          </div>
          <h1 className="text-6xl lg:text-8xl font-black tracking-tight text-gray-900 leading-[0.85] uppercase">
            Arquitetura <br />
            <span className="text-gradient">de Marca</span>
          </h1>
          <p className="text-xl text-gray-400 font-medium max-w-xl leading-relaxed">
            Configure os parâmetros profundos do seu DNA. O sistema STELAR calibra toda a produção narrativa com base nestas definições estratégicas.
          </p>
        </div>
        <div className="shrink-0">
          <button
            onClick={handleSave}
            disabled={saving}
            className="button-primary h-22 px-14 rounded-[2.5rem] text-[11px] flex items-center group relative overflow-hidden disabled:opacity-50"
          >
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            {saving ? (
              <Loader2 className="mr-5 h-6 w-6 animate-spin" />
            ) : (
              <Save className="mr-5 h-6 w-6 fill-white" />
            )}
            <span className="uppercase tracking-[0.2em] text-xs font-black">{saving ? "Consolidando..." : "Consolidar DNA"}</span>
            <ArrowUpRight className="ml-5 h-6 w-6 transform group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
          </button>
        </div>
      </div>

      {/* DNA SYNC ALERT - Premium High Tech */}
      {hasPendingRefine && (
        <div className="relative group overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-500 opacity-5 group-hover:opacity-10 transition-opacity rounded-[3rem]" />
          <div className="relative border-2 border-blue-100 p-12 rounded-[3.5rem] flex flex-col lg:flex-row items-center justify-between gap-10 bg-white/40 backdrop-blur-sm shadow-2xl shadow-blue-500/5">
            <div className="flex items-center gap-8 text-center lg:text-left">
              <div className="h-24 w-24 bg-blue-600 rounded-[2rem] flex items-center justify-center text-white shadow-2xl shadow-blue-500/30">
                <BrainCircuit className="h-12 w-12 animate-pulse" />
              </div>
              <div className="space-y-2">
                <h3 className="text-3xl font-black text-gray-900 uppercase tracking-tighter">Sincronização de Conhecimento Detectada</h3>
                <p className="text-gray-500 font-medium text-xl leading-relaxed max-w-xl">
                  Novos dados estratégicos foram coletados. O motor IA está pronto para sintonizar seu DNA com o repertório atual.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={handleAiRefine}
                disabled={isRefining}
                className="h-18 px-12 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 transition-all flex items-center gap-4 uppercase tracking-[0.2em] text-xs shadow-xl shadow-blue-500/20"
              >
                {isRefining ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5 fill-white" />}
                Sintonizar DNA Agora
              </button>
              <button
                onClick={handleClearRefine}
                className="h-18 w-18 border-2 border-gray-100 text-gray-400 hover:text-red-500 hover:border-red-100 rounded-2xl transition-all flex items-center justify-center bg-white"
              >
                <Trash2 className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Configuration Hub */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left: Identity & Core Logic */}
        <div className="lg:col-span-8 space-y-12">
          
          {/* Core Definitions Module */}
          <div className="stelar-card p-14 shadow-3xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-12 opacity-5 transform group-hover:scale-110 transition-transform duration-1000 rotate-12">
              <PenTool className="h-64 w-64 text-[#2B3440]" />
            </div>
            
            <div className="relative z-10 space-y-14">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-gray-50 flex items-center justify-center text-[#2B3440] shadow-sm">
                  <Target className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tighter">Parâmetros Nucleares</h2>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Definição de base e posicionamento</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-4">
                  <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] ml-2">Nomenclatura Estratégica</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full h-20 px-8 bg-gray-50/50 border-2 border-gray-100 rounded-[1.5rem] focus:outline-none focus:border-[#2B3440] focus:bg-white transition-all font-black text-xl text-[#2B3440] shadow-inner"
                    placeholder="Nome da Marca / Especialista"
                  />
                </div>
                <div className="space-y-4">
                  <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] ml-2">Frequência Vocal (Tom)</label>
                  <input
                    value={toneOfVoice}
                    onChange={(e) => setToneOfVoice(e.target.value)}
                    className="w-full h-20 px-8 bg-gray-50/50 border-2 border-gray-100 rounded-[1.5rem] focus:outline-none focus:border-[#2B3440] focus:bg-white transition-all font-black text-xl text-[#2B3440] shadow-inner"
                    placeholder="Ex: Técnico, Provocativo, Minimalista"
                  />
                </div>
                <div className="md:col-span-2 space-y-4">
                  <div className="flex items-center justify-between px-2">
                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em]">Essência Operacional</label>
                    <span className="premium-badge text-[9px]">AI Enabled Module</span>
                  </div>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={8}
                    className="w-full p-10 bg-gray-50/50 border-2 border-gray-100 rounded-[2.5rem] focus:outline-none focus:border-[#2B3440] focus:bg-white transition-all font-medium text-lg text-gray-700 leading-relaxed shadow-inner resize-none"
                    placeholder="Cole aqui a história da sua marca ou bio estratégica..."
                  />
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest ml-10 flex items-center gap-2">
                    <Info className="h-3 w-3" />
                    O STELAR absorve sua história para criar peças com autoridade real.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Social Sync Grid */}
          <div className="stelar-card p-14 shadow-3xl">
            <div className="flex items-center gap-4 mb-14">
              <div className="h-12 w-12 rounded-2xl bg-gray-50 flex items-center justify-center text-[#2B3440] shadow-sm">
                <Globe className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tighter">Canais de Sincronia</h2>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Mapeamento de presença digital</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {platforms.map((platform) => {
                const savedProfile = socialProfiles.find(p => p.platform === platform.id);
                const isActive = savedProfile?.isActive ?? false;

                return (
                  <div 
                    key={platform.id} 
                    className={`p-10 rounded-[2.5rem] border-2 transition-all cursor-pointer group relative overflow-hidden ${isActive ? 'bg-white border-[#2B3440] shadow-2xl' : 'bg-gray-50 border-transparent opacity-40 grayscale hover:opacity-100 hover:grayscale-0'}`}
                    onClick={() => {
                      const newProfiles = [...socialProfiles];
                      const idx = newProfiles.findIndex(p => p.platform === platform.id);
                      if (idx >= 0) {
                        newProfiles[idx].isActive = !newProfiles[idx].isActive;
                      } else {
                        newProfiles.push({ platform: platform.id, handle: '', url: '', isActive: true });
                      }
                      setSocialProfiles(newProfiles);
                    }}
                  >
                    <div className="flex items-center justify-between relative z-10">
                      <div className="flex items-center gap-5">
                        <div className={`p-4 rounded-2xl bg-gray-50 ${platform.color} group-hover:scale-110 transition-transform`}>
                          <platform.icon className="h-7 w-7" />
                        </div>
                        <div>
                          <p className="text-lg font-black text-gray-900 uppercase tracking-tighter">{platform.label}</p>
                          {isActive && savedProfile?.handle && <p className="text-[11px] font-black text-[#2B3440]/60 uppercase tracking-widest">@{savedProfile.handle}</p>}
                        </div>
                      </div>
                      <div className={`h-8 w-8 rounded-full border-2 flex items-center justify-center transition-all ${isActive ? 'bg-[#2B3440] border-[#2B3440]' : 'border-gray-200'}`}>
                        {isActive && <CheckCircle2 className="h-5 w-5 text-white" />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Strategy & Pillars */}
        <div className="lg:col-span-4 space-y-12">
          
          {/* Editorial Pillars Module */}
          <div className="stelar-card p-12 shadow-3xl">
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-gray-50 flex items-center justify-center text-[#2B3440] shadow-sm">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">Pilares</h2>
              </div>
              <button 
                onClick={addPillar}
                className="h-10 w-10 rounded-xl bg-[#2B3440] text-white flex items-center justify-center hover:bg-black transition-all shadow-lg"
              >
                <Plus className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-6">
              {pillars.map((pillar, idx) => (
                <div key={idx} className="p-8 bg-gray-50/50 border border-gray-100 rounded-[2rem] group relative">
                  <button 
                    onClick={() => removePillar(idx)}
                    className="absolute top-4 right-4 p-1 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <input 
                    value={pillar.title}
                    onChange={e => {
                      const newPil = [...pillars];
                      newPil[idx].title = e.target.value;
                      setPillars(newPil);
                    }}
                    placeholder="Nome do Pilar"
                    className="w-full bg-transparent border-none p-0 text-lg font-black text-gray-900 placeholder:text-gray-300 focus:ring-0 mb-2"
                  />
                  <textarea 
                    value={pillar.description}
                    onChange={e => {
                      const newPil = [...pillars];
                      newPil[idx].description = e.target.value;
                      setPillars(newPil);
                    }}
                    placeholder="O que este pilar cobre?"
                    className="w-full bg-transparent border-none p-0 text-xs font-medium text-gray-400 placeholder:text-gray-200 focus:ring-0 resize-none"
                    rows={2}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Audience Summary */}
          <div className="stelar-card p-12 shadow-3xl">
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-gray-50 flex items-center justify-center text-[#2B3440] shadow-sm">
                  <Users className="h-5 w-5" />
                </div>
                <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">Segmentos</h2>
              </div>
              <button 
                onClick={addAudience}
                className="h-10 w-10 rounded-xl bg-gray-50 text-[#2B3440] flex items-center justify-center hover:bg-gray-100 transition-all border border-gray-100"
              >
                <Plus className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-6">
              {audience.map((aud, idx) => (
                <div key={idx} className="p-8 bg-gray-900 text-white rounded-[2rem] shadow-2xl relative group overflow-hidden">
                  <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform">
                    <Sparkles className="h-20 w-20" />
                  </div>
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                      <input 
                        value={aud.name}
                        onChange={e => {
                          const newAud = [...audience];
                          newAud[idx].name = e.target.value;
                          setAudience(newAud);
                        }}
                        placeholder="Nome do Segmento"
                        className="bg-transparent border-none p-0 text-xl font-black text-white placeholder:text-gray-700 focus:ring-0"
                      />
                      <button onClick={() => removeAudience(idx)} className="text-white/20 hover:text-red-400">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                       {aud.painPoints?.map((p, pi) => (
                         <span key={pi} className="px-3 py-1 bg-white/10 rounded-lg text-[9px] font-black uppercase tracking-widest text-white/60">{p}</span>
                       ))}
                       <button className="h-6 w-6 rounded-lg bg-white/5 flex items-center justify-center text-white/20 hover:bg-white/10">
                          <Plus className="h-3 w-3" />
                       </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pro Context Indicator */}
          <div className="p-10 bg-gray-50 border-2 border-gray-100 rounded-[3rem] text-center space-y-6">
             <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center mx-auto text-[#2B3440] shadow-sm border border-gray-100">
                <ShieldCheck className="h-6 w-6" />
             </div>
             <div className="space-y-2">
               <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest">Protocolo de Autoridade</h4>
               <p className="text-xs text-gray-400 font-medium leading-relaxed">
                 O DNA consolidado protege sua comunicação contra conteúdo genérico e ruído de mercado.
               </p>
             </div>
             <Link href="/dashboard/knowledge" className="block w-full py-4 text-[10px] font-black text-[#2B3440] uppercase tracking-[0.2em] border-b-2 border-transparent hover:border-[#2B3440] transition-all">
                Expandir Repertório Base
             </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
