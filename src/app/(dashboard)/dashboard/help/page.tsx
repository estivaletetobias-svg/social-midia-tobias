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
            title: "1. DNA da Marca",
            icon: <BrainCircuit className="w-8 h-8 text-primary-500" />,
            summary: "O alicerce da sua inteligência artificial. Se o DNA estiver vago, os posts serão genéricos. Se o DNA estiver profundo e detalhado, o sistema escreverá exatamente como você falaria.",
            details: [
                {
                    subtitle: "Essência e Autoridade",
                    text: "No campo de Bio profissional, coloque sua história, os termos técnicos que você usa no dia a dia e suas maiores conquistas. Isso dá 'corpo' para a fala da IA."
                },
                {
                    subtitle: "Tom de Voz Definido",
                    text: "Escolha se sua persona no digital deve ser Formal (ex: corporativo), Acolhedor (ex: médico/terapeuta) ou focado em resultados rápidos (ex: coach/performance)."
                },
                {
                    subtitle: "Os 3 Pilares de Autoridade",
                    text: "Defina os assuntos que você domina. A IA sempre tentará trazer o conteúdo de volta para um desses 3 eixos, garantindo que você não perca seu posicionamento."
                },
                {
                    subtitle: "Mapeamento de Público",
                    text: "Descreva seu seguidor ideal: o que ele teme? O que ele deseja? Posts que resolvem dores reais geram 10x mais conexão do que postagens genéricas."
                }
            ]
        },
        {
            id: 'brain',
            title: "2. Cérebro Semântico",
            icon: <BookOpen className="w-8 h-8 text-primary-500" />,
            summary: "É a sua biblioteca particular. Aqui você ensina à IA o que você sabe, suas opiniões técnicas e o seu 'jeito' de explicar as coisas.",
            details: [
                {
                    subtitle: "Alimentando com Arquivos",
                    text: "Suba PDFs de estudos, transcrições de reuniões ou roteiros de aulas. O sistema lerá todo o conteúdo e passará a usá-lo como base de dados para escrever."
                },
                {
                    subtitle: "Sincronização com YouTube",
                    text: "Cole o link de um vídeo seu e o STELAR fará a transcrição total, aprendendo o ritmo da sua voz e as palavras específicas que você costuma usar."
                },
                {
                    subtitle: "Pesquisa por Contexto",
                    text: "Use o Chat na base de conhecimento para perguntar: 'O que eu falei sobre [Assunto X] no meu roteiro de 2024?'. A IA buscará a resposta exata em segundos."
                }
            ]
        },
        {
            id: 'ideas',
            title: "3. Biblioteca de Ideias",
            icon: <Zap className="w-8 h-8 text-primary-500" />,
            summary: "A faísca inicial. O STELAR busca tendências e cruza com seu conhecimento para sugerir temas que estão 'quentes' no momento.",
            details: [
                {
                    subtitle: "Descoberta de Tendências",
                    text: "O robô de notícias traz o que está sendo falado no mundo e sugere como VOCÊ pode comentar aquele assunto sob a sua ótica profissional."
                },
                {
                    subtitle: "Filtro de Relevância",
                    text: "Nem tudo que é 'hype' serve para você. Avalie as sugestões e selecione apenas o que faz sentido para o seu posicionamento atual."
                }
            ]
        },
        {
            id: 'execution',
            title: "4. Esteira de Produção",
            icon: <PenTool className="w-8 h-8 text-primary-500" />,
            summary: "Onde o rascunho vira post final. Revisão técnica e ajuste de tom ocorrem nesta etapa crucial.",
            details: [
                {
                    subtitle: "Refinamento Assistido",
                    text: "Não gostou de uma legenda? Use o botão 'Ajustar' e peça para a IA ser mais curta, mais profunda ou mudar a chamada final (CTA)."
                },
                {
                    subtitle: "Imagens e Design",
                    text: "Visualize o conceito visual sugerido e aprove o post para que ele seja automaticamente formatado para a rede social definitiva."
                },
                {
                    subtitle: "Aprovação Final",
                    text: "Ao clicar em 'Aprovar', o post sai da esteira e 'viaja' direto para o seu Calendário Editorial estrategicamente."
                }
            ]
        },
        {
            id: 'strategy',
            title: "5. Calendário Editorial",
            icon: <Calendar className="w-8 h-8 text-primary-500" />,
            summary: "Sua visão de águia. Onde você planeja o futuro e garante que não haja furos na sua presença digital.",
            details: [
                {
                    subtitle: "Planejamento Semanal",
                    text: "Veja todos os posts aprovados distribuídos no tempo. Isso ajuda a entender se você está variando os assuntos de forma equilibrada."
                },
                {
                    subtitle: "Status de Postagem",
                    text: "Acompanhe o que está pronto e o que ainda está em fase de rascunho. Tenha o controle total do seu ecossistema digital."
                }
            ]
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
                        <div className="h-1 w-6 bg-primary-500 rounded-full" />
                        <span className="text-xs font-black uppercase tracking-[0.3em] scroll-px-10">Manual Operacional</span>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-none uppercase">
                        Central de <span className="text-primary-500 italic">Comandos</span>
                    </h1>
                    <p className="text-lg md:text-xl text-gray-400 font-medium tracking-wide leading-relaxed max-w-xl">
                        Aprenda a orquestrar seu Sistema de Arquitetura Social e escalar sua autoridade técnica com auxílio do STELAR.
                    </p>
                </div>
            </div>

            {/* Steps / Guide List */}
            <div className="space-y-24 px-4">
                {topics.map((topic, index) => (
                    <div key={topic.id} className="grid grid-cols-1 lg:grid-cols-12 gap-12 group">
                        
                        {/* Summary Column */}
                        <div className="lg:col-span-5 space-y-6">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gray-50 text-primary-500 shadow-sm border border-gray-100 group-hover:bg-primary-500 group-hover:text-white transition-all duration-500">
                                {topic.icon}
                            </div>
                            <h2 className="text-4xl font-black text-gray-900 tracking-tight leading-none uppercase italic">
                                {topic.title}
                            </h2>
                            <p className="text-lg font-medium text-gray-500 leading-relaxed border-l-4 border-gray-100 pl-6 group-hover:border-primary-500 transition-colors">
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
                                            <div className="w-2 h-2 rounded-full bg-primary-500 ring-4 ring-primary-500/10 group-hover/item:scale-125 transition-transform" />
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

            {/* FAQ / Final Tip */}
            <div className="bg-primary-500 rounded-[40px] p-10 md:p-14 text-white shadow-2xl shadow-primary-500/20 relative overflow-hidden">
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
                        Bom Onboarding!
                    </p>
                </div>
            </div>
        </div>
    );
}

