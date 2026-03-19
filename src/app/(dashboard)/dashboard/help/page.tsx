"use client";

import { 
    BrainCircuit, 
    BookOpen, 
    Zap, 
    PenTool, 
    Calendar, 
    Settings, 
    HelpCircle, 
    ArrowRight, 
    Sparkles,
    CheckCircle2
} from "lucide-react";

export default function HelpCenterPage() {
    const topics = [
        {
            id: 'dna',
            title: "1. DNA da Marca (A Fundação)",
            icon: <BrainCircuit className="w-8 h-8 text-indigo-400" />,
            summary: "O alicerce da sua inteligência artificial. Se o DNA estiver vago, os posts serão genéricos. Se o DNA estiver profundo e detalhado, o sistema escreverá exatamente como você falaria.",
            details: [
                {
                    subtitle: "Essência e Autoridade Professional",
                    text: "No campo de 'Bio profissional', não tenha medo de colar sua história completa, conquistas e até transcrições de como você explicaria seu negócio para um amigo. Isso dá o 'recheio' que a IA precisa para soar autêntica."
                },
                {
                    subtitle: "Tom de Voz e Personalidade",
                    text: "Defina se você é Amigável, Técnico, Ácido ou Visionário. A IA usará os adjetivos que você colocar lá para escolher quais palavras e jargões usar em cada legenda."
                },
                {
                    subtitle: "Pilares Editoriais Estratégicos",
                    text: "Escolha 3 temas principais que você domina. Ex: Atleta pode ter 'Treino', 'Nutrição' e 'Mentalidade'. Isso impede que o sistema fale de coisas que não agregam ao seu posicionamento."
                },
                {
                    subtitle: "Mapeamento Dores do Público",
                    text: "Descreva quem é seu cliente ideal. O que tira o sono dele? Quais são as 3 maiores dificuldades que ele enfrenta? Isso ensina a IA a criar conteúdos que geram 'conexão real'."
                }
            ]
        },
        {
            id: 'brain',
            title: "2. Cérebro Semântico (Hub de Conhecimento)",
            icon: <BookOpen className="w-8 h-8 text-indigo-400" />,
            summary: "Sua biblioteca particular digital. Aqui você ensina à IA o que você sabe, suas opiniões técnicas e o seu 'jeito' de explicar as coisas.",
            details: [
                {
                    subtitle: "Importação de PDFs e Documentos",
                    text: "O STELAR lê quase qualquer PDF técnico. Clique em 'Adicionar Fonte' e suba estudos científicos, roteiros ou ebooks. A IA absorve esses dados em segundos."
                },
                {
                    subtitle: "Extração de Texto do YouTube",
                    text: "Cole o link de um vídeo seu e o sistema transcreverá todo o áudio. É a melhor forma de a IA aprender as gírias e o ritmo natural da sua voz."
                },
                {
                    subtitle: "Chat com Seus Arquivos",
                    text: "Use o Chat na base de conhecimento para 'perguntar' aos seus arquivos. Ex: 'O que eu disse sobre creatina no meu PDF de estudos?'. A IA buscará o trecho exato."
                }
            ]
        },
        {
            id: 'execution',
            title: "3. Esteira de Produção (Workflow Diário)",
            icon: <PenTool className="w-8 h-8 text-indigo-400" />,
            summary: "O campo de batalha onde as estratégias se tornam posts. Da sugestão inicial à aprovação final, tudo é gerenciado aqui.",
            details: [
                {
                    subtitle: "Refinamento Manual Assistido",
                    text: "Não gostou de um trecho? Clique em 'Ajustar' e use os botões rápidos para 'Aprofundar', 'Encurtar' ou 'Mudar CTA'. Você também pode digitar um comando livre."
                },
                {
                    subtitle: "Conceito Visual Sugerido",
                    text: "Cada post traz um conceito visual para imagem ou vídeo. Você pode pedir para a IA mudar o estilo (ex: 'Quero um visual mais futurista') clicando no botão de refinamento."
                },
                {
                    subtitle: "Aprovação para o Calendário",
                    text: "Ao clicar em 'Aprovar e Avançar', o post recebe uma 'passagem só de ida' para o seu Calendário Editorial estrategicamente."
                }
            ]
        },
        {
            id: 'strategy',
            title: "4. Calendário Editorial (Sua Visão Áerea)",
            icon: <Calendar className="w-8 h-8 text-indigo-400" />,
            summary: "Sua visão estratégica do tempo. Aqui você garante que a sua autoridade está sendo construída dia após dia, sem furos na programação.",
            details: [
                {
                    subtitle: "Planejamento Estratégico Temporal",
                    text: "Veja todos os posts aprovados distribuídos na semana. Isso ajuda a entender se você está variando os assuntos de forma equilibrada no feed."
                },
                {
                    subtitle: "Status e Organização",
                    text: "Acompanhe o que já está provisoriamente agendado e o que ainda precisa de uma revisão técnica sua antes da publicação final."
                }
            ]
        }
    ];

    const faqItems = [
        {
            q: "Como troco minha foto de perfil ou senha?",
            a: "No canto inferior esquerdo do menu lateral, clique na sua foto atual. Lá você pode fazer upload de uma nova imagem ou alterar seus dados de acesso."
        },
        {
            q: "A IA não está usando o meu tom de voz, o que eu faço?",
            a: "Vá em 'DNA da Marca' e refine o campo 'Tom de Voz'. Use adjetivos fortes como: 'Direto, sem gírias, focado em ciência' ou 'Acolhedor, piadista e motivacional'. O sistema se adapta instantaneamente."
        },
        {
            q: "Qual o limite de tamanho para arquivos PDF?",
            a: "O STELAR processa PDFs de até 20MB. Recomendamos arquivos de texto puro para uma leitura mais rápida da IA."
        },
        {
            q: "Como o STELAR sabe o que está sendo falado no mercado?",
            a: "Nossa 'Biblioteca de Ideias' usa um robô rastreador que monitora tendências e cruzamento de nichos em tempo real, sugerindo pautas que ainda não estão saturadas."
        },
        {
            q: "O sistema posta direto no meu Instagram?",
            a: "Atualmente, o STELAR é seu Arquiteto e Redator. Ele prepara os posts (texto e imagem) no calendário. Você copia o conteúdo finalizado e faz a postagem na rede social desejada."
        }
    ];

    return (
        <div className="max-w-6xl mx-auto space-y-16 animate-in fade-in slide-in-from-bottom-6 duration-1000 pb-32">
            
            {/* Dark Banner Header */}
            <div className="bg-gray-900 rounded-[40px] p-10 md:p-16 text-white relative overflow-hidden shadow-2xl flex flex-col justify-center min-h-[350px]">
                <div className="absolute top-0 right-0 w-1/2 h-full opacity-5 pointer-events-none flex items-center justify-end pr-10">
                    <HelpCircle className="w-96 h-96 text-white" />
                </div>

                <div className="relative z-10 max-w-3xl space-y-6">
                    <div className="flex items-center space-x-3 mb-4 animate-fade-in opacity-80">
                        <div className="h-1 w-6 bg-indigo-400 rounded-full" />
                        <span className="text-xs font-black uppercase tracking-[0.3em] scroll-px-10">Guia de Onboarding Oficial</span>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-none uppercase">
                        Central de <span className="text-indigo-400 italic">Comandos</span>
                    </h1>
                    <p className="text-lg md:text-xl text-gray-400 font-medium tracking-wide leading-relaxed max-w-xl">
                        Tudo o que você precisa saber para operar seu sistema de arquitetura social com autonomia total.
                    </p>
                </div>
            </div>

            {/* Steps / Guide List */}
            <div className="space-y-32 px-4">
                {topics.map((topic, index) => (
                    <div key={topic.id} className="grid grid-cols-1 lg:grid-cols-12 gap-12 group border-b border-gray-100 pb-20 last:border-none">
                        
                        {/* Summary Column */}
                        <div className="lg:col-span-5 space-y-6">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gray-50 text-primary-500 shadow-sm border border-gray-100 group-hover:bg-primary-500 group-hover:text-white transition-all duration-500">
                                {topic.icon}
                            </div>
                            <h2 className="text-4xl font-black text-gray-900 tracking-tight leading-none uppercase italic">
                                {topic.title}
                            </h2>
                            <p className="text-lg font-medium text-gray-500 leading-relaxed border-l-4 border-gray-100 pl-6 group-hover:border-indigo-400 transition-colors">
                                {topic.summary}
                            </p>
                        </div>

                        {/* Details List Column */}
                        <div className="lg:col-span-1 hidden lg:flex items-center justify-center opacity-10">
                            <ArrowRight className="w-12 h-12" />
                        </div>

                        <div className="lg:col-span-6 space-y-4">
                            <div className="bg-white/40 glass-panel rounded-[32px] p-8 space-y-8 border border-white/60 shadow-xl shadow-black/[0.02]">
                                {topic.details.map((detail, dIndex) => (
                                    <div key={dIndex} className="space-y-2 group/item">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-2 h-2 rounded-full bg-indigo-400 ring-4 ring-indigo-400/10 group-hover/item:scale-125 transition-transform" />
                                            <h4 className="text-xs font-black uppercase tracking-[0.2em] text-gray-900">{detail.subtitle}</h4>
                                        </div>
                                        <p className="text-sm font-medium text-gray-500 leading-relaxed pl-5 tracking-tight">
                                            {detail.text}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* FAQ Section */}
            <div className="pt-24 space-y-12">
                <div className="text-center space-y-4">
                    <h2 className="text-4xl font-black text-gray-900 uppercase tracking-tighter italic">Dúvidas Frequentes (FAQ)</h2>
                    <p className="text-gray-500 font-medium">Respostas rápidas para os problemas do dia-a-dia.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 px-4">
                    {faqItems.map((item, i) => (
                        <div key={i} className="bg-white p-8 rounded-[32px] shadow-lg shadow-black/[0.03] border border-gray-50 hover:-translate-y-1 transition-all">
                            <h4 className="text-md font-black text-gray-900 mb-4 flex items-start gap-3 uppercase tracking-tight">
                                <HelpCircle className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                                {item.q}
                            </h4>
                            <p className="text-gray-500 text-sm font-medium leading-relaxed pl-8">
                                {item.a}
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Final Tip Card */}
            <div className="bg-indigo-400 rounded-[40px] p-10 md:p-14 text-white shadow-2xl shadow-indigo-400/20 relative overflow-hidden">
                <div className="absolute -bottom-20 -right-20 opacity-10 rotate-12">
                   <Sparkles className="w-80 h-80" />
                </div>
                
                <div className="relative z-10 text-center space-y-8 max-w-2xl mx-auto">
                    <CheckCircle2 className="w-16 h-16 mx-auto mb-4 animate-bounce" />
                    <h3 className="text-3xl font-black uppercase tracking-tighter leading-none italic">
                        Dica de Arquiteto Master
                    </h3>
                    <p className="text-lg font-bold text-primary-50 leading-relaxed italic">
                        "O segredo da IA não é o comando que você dá hoje, mas o DNA que você construiu ontem. Quanto mais autêntico for o seu DNA, mais impossível de copiar será o seu conteúdo."
                    </p>
                    <div className="h-px w-24 bg-white/20 mx-auto" />
                    <p className="text-xs font-black uppercase tracking-[0.3em] opacity-80">
                        Bom Onboarding e boas postagens!
                    </p>
                </div>
            </div>
        </div>
    );
}

