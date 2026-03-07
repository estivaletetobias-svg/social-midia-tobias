import { Search, Plus, Sparkles, Zap, ArrowUpRight, CheckCircle2, XCircle } from "lucide-react";

export default function IdeasLibrary() {
    const categories = ["All Topics", "Trends", "Viral Hooks", "Evergreen", "Product Updates"];
    const topics = [
        { title: "The Death of Generic AI Copy", summary: "Why brand voice is the only moat left in content marketing.", score: 0.94, pillar: "AI Automation", platform: "LinkedIn" },
        { title: "3 Prompt Hacks for DALL-E 3", summary: "Strategic ways to get consistent brand imagery.", score: 0.88, pillar: "Visual Strategy", platform: "Instagram" },
        { title: "Modular Architecture for Teams", summary: "How to scale content production systems in 2026.", score: 0.91, pillar: "Productivity", platform: "LinkedIn" },
    ];

    return (
        <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-1000">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-6 md:space-y-0 pb-8 border-b border-gray-100">
                <div>
                    <div className="flex items-center space-x-3 mb-2">
                        <Sparkles className="h-6 w-6 text-primary-500 fill-primary-500" />
                        <span className="text-sm font-black text-primary-600 uppercase tracking-widest">Topic Discovery Engin</span>
                    </div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight sm:text-5xl">Ideas Library</h1>
                    <p className="mt-4 text-xl text-gray-500 max-w-3xl font-medium leading-relaxed">
                        AI-driven topic suggestions based on your brand DNA and recent industry trends.
                    </p>
                </div>
                <div className="flex items-center space-x-3">
                    <button className="h-14 px-8 bg-black text-white text-sm font-black rounded-2xl shadow-2xl hover:bg-gray-800 transition-all flex items-center transform hover:scale-[1.02] active:scale-100">
                        <Plus className="mr-3 h-5 w-5" />
                        New Manual Idea
                    </button>
                </div>
            </div>

            {/* Tabs & Search */}
            <div className="flex flex-col xl:flex-row items-center justify-between gap-6 pb-2">
                <div className="flex items-center space-x-2 bg-gray-100 p-1.5 rounded-2xl border border-gray-200 shadow-sm w-full xl:w-auto overflow-x-auto no-scrollbar">
                    {categories.map((cat, i) => (
                        <button
                            key={cat}
                            className={`px-6 py-2.5 text-xs font-black rounded-xl transition-all uppercase tracking-wider ${i === 0 ? "bg-white text-gray-900 shadow-xl shadow-gray-200/50" : "text-gray-500 hover:text-gray-800 hover:bg-white/50"}`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
                <div className="relative w-full xl:w-96 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
                    <input
                        className="w-full h-14 pl-12 pr-4 bg-white border border-gray-200 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all font-medium text-gray-900"
                        placeholder="Search topics, keywords, tags..."
                    />
                </div>
            </div>

            {/* Topics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-12">
                {topics.map((item, i) => (
                    <div key={i} className="group relative bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 hover:shadow-2xl hover:shadow-primary-100/50 hover:-translate-y-2 transition-all duration-500 flex flex-col h-full">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center space-x-2 bg-primary-50 text-primary-600 px-4 py-2 rounded-2xl">
                                <Zap className="h-4 w-4 fill-primary-600" />
                                <span className="text-xs font-black tracking-widest uppercase truncate">{item.score * 100}% Relevance</span>
                            </div>
                            <span className="text-[10px] font-black tracking-[0.2em] text-gray-400 bg-gray-50 px-3 py-1.5 rounded-full uppercase">
                                {item.platform}
                            </span>
                        </div>

                        <h3 className="text-2xl font-black text-gray-900 leading-tight group-hover:text-primary-600 transition-colors">{item.title}</h3>
                        <p className="mt-4 text-gray-500 font-medium leading-relaxed flex-grow">{item.summary}</p>

                        <div className="mt-10 flex items-center pt-8 border-t border-gray-50 space-x-3">
                            <button className="flex-1 h-14 bg-gray-50 text-gray-900 text-sm font-black rounded-2xl hover:bg-primary-600 hover:text-white transition-all flex items-center justify-center group/btn shadow-sm">
                                <CheckCircle2 className="mr-2 h-5 w-5 group-hover/btn:scale-110 transition-transform" />
                                Approve
                            </button>
                            <button className="h-14 w-14 bg-white border border-gray-200 text-gray-400 hover:text-red-500 hover:bg-red-50 hover:border-red-100 rounded-2xl transition-all flex items-center justify-center">
                                <XCircle className="h-6 w-6" />
                            </button>
                        </div>
                    </div>
                ))}

                {/* Create Card */}
                <button className="group relative p-8 rounded-[40px] border-4 border-dashed border-gray-100 hover:border-primary-200 hover:bg-primary-50/20 transition-all duration-500 flex flex-col items-center justify-center text-center space-y-4">
                    <div className="h-16 w-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 group-hover:bg-primary-100 group-hover:text-primary-600 transition-all">
                        <Plus className="h-8 w-8" />
                    </div>
                    <div>
                        <p className="text-lg font-black text-gray-900">Custom Idea</p>
                        <p className="text-sm font-bold text-gray-400 mt-1">Add your own creative spark</p>
                    </div>
                </button>
            </div>
        </div>
    );
}
