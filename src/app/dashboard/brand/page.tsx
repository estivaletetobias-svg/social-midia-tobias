"use client";

import { useEffect, useState } from "react";
import { 
  Save, 
  Trash2, 
  Plus, 
  BrainCircuit,
  Sparkles,
  ExternalLink,
  Instagram,
  Linkedin,
  Twitter,
  Youtube,
  Globe,
  CheckCircle2,
  ShieldCheck,
  Target,
  MessageSquare,
  Info
} from "lucide-react";
import { useDebounce } from "use-debounce";

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
}

export default function BrandDnaPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
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
    fetch('/api/brand/dna')
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
        alert("DNA da Marca salvo com sucesso!");
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
    <div className="max-w-6xl mx-auto py-8 px-6 pb-24">
      {/* Header */}
      <header className="flex items-center justify-between mb-12">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight flex items-center gap-3">
            <BrainCircuit className="h-10 w-10 text-primary-600" />
            DNA da <span className="text-primary-600 italic">Marca</span>
          </h1>
          <p className="max-w-2xl text-gray-500 mt-2 font-medium text-lg leading-relaxed">
            Aqui vive o cérebro da sua IA. Quanto mais detalhado for o seu DNA, mais precisas serão as sugestões de conteúdo e o robô de notícias.
          </p>
        </div>
        <button 
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-8 py-4 bg-primary-600 hover:bg-primary-700 text-white font-black rounded-2xl shadow-[0_8px_30px_rgb(29,78,216,0.15)] transition-all active:scale-95 disabled:opacity-50"
        >
          {saving ? "Salvando..." : <><Save className="h-5 w-5" /> Salvar Configurações</>}
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Lado Esquerdo: Identidade */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Card: Essência */}
          <section className="glass-panel p-10 rounded-[2.5rem] border border-white/60 relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
               <Sparkles className="h-40 w-40" />
             </div>
             
             <h2 className="text-xl font-black text-gray-900 mb-8 flex items-center gap-3 uppercase tracking-tighter">
               <Info className="h-6 w-6 text-primary-500" />
               Essência & Propósito
             </h2>
             
             <div className="space-y-6">
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Nome da Marca</label>
                  <input 
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Ex: SinSalarial"
                    className="w-full bg-white/40 border border-white/60 rounded-2xl px-6 py-4 text-lg font-bold text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Descrição do Negócio (Para a IA)</label>
                  <textarea 
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Descreva o que a marca faz, qual seu diferencial e o que ela resolve no mundo."
                    rows={4}
                    className="w-full bg-white/40 border border-white/60 rounded-2xl px-10 py-4 text-lg font-medium text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all resize-none"
                  />
                </div>
             </div>
          </section>

          {/* Card: Canais & Redes Sociais */}
          <section className="glass-panel p-10 rounded-[2.5rem] border border-white/60">
             <div className="flex items-center justify-between mb-10">
               <h2 className="text-xl font-black text-gray-900 flex items-center gap-3 uppercase tracking-tighter">
                 <ExternalLink className="h-6 w-6 text-primary-500" />
                 Canais & Redes Sociais
               </h2>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {platforms.map((platform) => {
                  const savedProfile = socialProfiles.find(p => p.platform === platform.id);
                  const isActive = savedProfile?.isActive ?? false;

                  return (
                    <div key={platform.id} className={`p-6 rounded-[1.5rem] border transition-all ${isActive ? 'bg-white/60 border-primary-200 ring-1 ring-primary-100' : 'bg-white/20 border-white/40 grayscale opacity-60'}`}>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-xl bg-white shadow-sm ${platform.color}`}>
                            <platform.icon className="h-5 w-5" />
                          </div>
                          <span className="font-black text-gray-900">{platform.label}</span>
                        </div>
                        <button 
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
                          className={`w-12 h-6 rounded-full relative transition-colors ${isActive ? 'bg-primary-600' : 'bg-gray-300'}`}
                        >
                          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isActive ? 'right-1' : 'left-1'}`} />
                        </button>
                      </div>

                      {isActive && (
                        <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                          <input 
                            value={savedProfile?.handle || ""}
                            onChange={e => {
                              const newProfiles = [...socialProfiles];
                              const idx = newProfiles.findIndex(p => p.platform === platform.id);
                              newProfiles[idx].handle = e.target.value;
                              setSocialProfiles(newProfiles);
                            }}
                            placeholder="@usuario ou handle"
                            className="w-full bg-white/50 border border-white/60 rounded-xl px-4 py-2 text-sm font-bold text-gray-900 focus:outline-none"
                          />
                          <input 
                            value={savedProfile?.url || ""}
                            onChange={e => {
                              const newProfiles = [...socialProfiles];
                              const idx = newProfiles.findIndex(p => p.platform === platform.id);
                              newProfiles[idx].url = e.target.value;
                              setSocialProfiles(newProfiles);
                            }}
                            placeholder="Link do perfil"
                            className="w-full bg-white/50 border border-white/60 rounded-xl px-4 py-2 text-sm font-medium text-gray-500 focus:outline-none"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
             </div>
          </section>

          {/* Card: Pilares Editoriais */}
          <section className="glass-panel p-10 rounded-[2.5rem] border border-white/60">
             <div className="flex items-center justify-between mb-10">
               <h2 className="text-xl font-black text-gray-900 flex items-center gap-3 uppercase tracking-tighter">
                 <ShieldCheck className="h-6 w-6 text-primary-500" />
                 Pilares Editoriais (Temas de Post)
               </h2>
               <button 
                 onClick={addPillar}
                 className="p-3 bg-white/50 hover:bg-white text-primary-600 rounded-xl transition-all shadow-sm flex items-center gap-2 font-bold text-sm"
               >
                 <Plus className="h-4 w-4" /> Adicionar Pilar
               </button>
             </div>

             <div className="space-y-4">
                {pillars.map((pillar, idx) => (
                  <div key={idx} className="bg-white/30 p-6 rounded-[1.5rem] border border-white/40 flex items-start gap-4 group transition-all hover:bg-white/50">
                    <div className="flex-1 space-y-3">
                      <input 
                        value={pillar.title}
                        onChange={e => {
                          const newPillars = [...pillars];
                          newPillars[idx].title = e.target.value;
                          setPillars(newPillars);
                        }}
                        placeholder="Título do Pilar (ex: Gestão de RH)"
                        className="w-full bg-transparent border-none p-0 text-gray-900 font-bold placeholder:text-gray-400 focus:ring-0"
                      />
                      <input 
                        value={pillar.description}
                        onChange={e => {
                          const newPillars = [...pillars];
                          newPillars[idx].description = e.target.value;
                          setPillars(newPillars);
                        }}
                        placeholder="Breve descrição do que cobre"
                        className="w-full bg-transparent border-none p-0 text-sm text-gray-500 placeholder:text-gray-400 focus:ring-0"
                      />
                    </div>
                    <button 
                      onClick={() => removePillar(idx)}
                      className="p-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
             </div>
          </section>

        </div>

        {/* Lado Direito: Público e Tom */}
        <div className="lg:col-span-4 space-y-8">
          
          {/* Card: Tom de Voz */}
          <section className="glass-panel p-10 rounded-[2.5rem] border border-white/60">
             <h2 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-3 uppercase tracking-tighter">
               <MessageSquare className="h-6 w-6 text-primary-500" />
               Tom de Voz
             </h2>
             <textarea 
                value={toneOfVoice}
                onChange={e => setToneOfVoice(e.target.value)}
                placeholder="Ex: Profissional, acolhedor e focado em resultados. Sempre chama o cliente pelo nome."
                rows={4}
                className="w-full bg-white/40 border border-white/60 rounded-2xl px-6 py-4 text-md font-medium text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all resize-none"
             />
          </section>

          {/* Card: Público Alvo */}
          <section className="glass-panel p-10 rounded-[2.5rem] border border-white/60">
             <div className="flex items-center justify-between mb-6">
               <h2 className="text-lg font-black text-gray-900 flex items-center gap-2 uppercase tracking-tighter">
                 <Target className="h-6 w-6 text-primary-500" />
                 Público-Alvo
               </h2>
               <button 
                 onClick={addAudience}
                 className="p-2 bg-primary-50 hover:bg-primary-100 text-primary-600 rounded-lg transition-all"
               >
                 <Plus className="h-4 w-4" />
               </button>
             </div>

             <div className="space-y-4">
                {audience.map((aud, idx) => (
                  <div key={idx} className="bg-white/40 p-5 rounded-2xl border border-white/60 group">
                    <div className="flex items-center justify-between mb-2">
                       <input 
                         value={aud.name}
                         onChange={e => {
                           const newAud = [...audience];
                           newAud[idx].name = e.target.value;
                           setAudience(newAud);
                         }}
                         placeholder="Nome do segmento"
                         className="bg-transparent border-none p-0 text-sm font-black text-gray-800 placeholder:text-gray-300 focus:ring-0"
                       />
                       <button onClick={() => removeAudience(idx)} className="text-gray-300 hover:text-red-500">
                         <Trash2 className="h-3 w-3" />
                       </button>
                    </div>
                  </div>
                ))}
             </div>
          </section>

          {/* Dica do Especialista */}
          <div className="p-8 bg-black/5 rounded-[2rem] border border-white/10">
            <h4 className="flex items-center gap-2 text-sm font-black text-gray-900 uppercase tracking-widest mb-3">
              <Sparkles className="h-4 w-4 text-primary-600" />
              Dica Pro
            </h4>
            <p className="text-sm font-medium text-gray-500 leading-relaxed italic">
              "Um DNA bem configurado permite que o Robô de Notícias descarte notícias 'lixo' e traga apenas o que gera autoridade de verdade para o seu cliente."
            </p>
          </div>

        </div>

      </div>
    </div>
  );
}
