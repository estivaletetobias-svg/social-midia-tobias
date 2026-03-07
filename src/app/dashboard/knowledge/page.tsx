import { BookOpen, FileText, Link, MessageSquare, Plus, Search, Tag, Trash2, Zap } from "lucide-react";

export default function KnowledgeBase() {
    const categories = ["All Sources", "AI Insights", "Digital Strategy", "Market Trends", "Team Notes"];
    const items = [
        { title: "Strategic Roadmap 2026", type: "Document", date: "2 days ago", tags: ["Strategy", "AI"], color: "bg-blue-50 text-blue-600" },
        { title: "Podcast Transcript: Future of SMM", type: "Transcript", date: "5 days ago", tags: ["Marketing"], color: "bg-purple-50 text-purple-600" },
        { title: "NotebookLM Export: Content Automation", type: "Note", date: "1 week ago", tags: ["Research", "Workflow"], color: "bg-green-50 text-green-600" },
        { title: "Industry Report: The Human Moat", type: "Article", date: "2 weeks ago", tags: ["Trend", "AI"], color: "bg-orange-50 text-orange-600" },
    ];

    return (
        <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in duration-1000">
            {/* Hero Header */}
            <div className="relative rounded-[48px] bg-gradient-to-br from-gray-900 to-black p-12 overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 p-12 opacity-10 transform translate-x-8 -translate-y-8">
                    <BookOpen className="h-64 w-64 text-white" />
                </div>
                <div className="relative z-10 max-w-2xl">
                    <h1 className="text-5xl font-black text-white tracking-tight leading-tight">Brand Intelligence Hub</h1>
                    <p className="mt-6 text-xl text-gray-400 font-medium leading-relaxed">
                        The semantic core of your engine. Ground your AI in original insights, research, and technical documentation.
                    </p>
                    <div className="mt-10 flex flex-wrap gap-4">
                        <button className="h-14 px-8 bg-primary-600 text-white text-sm font-black rounded-2xl shadow-xl shadow-primary-600/30 hover:bg-primary-700 transition-all flex items-center">
                            <Plus className="mr-3 h-5 w-5" /> Import Source
                        </button>
                        <button className="h-14 px-8 bg-white/10 backdrop-blur-md text-white text-sm font-black rounded-2xl hover:bg-white/20 transition-all border border-white/10 flex items-center">
                            <Zap className="mr-3 h-5 w-5 fill-white" /> AI Search
                        </button>
                    </div>
                </div>
            </div>

            {/* Grid Explorer */}
            <div className="space-y-8">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-4">
                    <div className="flex items-center space-x-2 bg-white p-1.5 rounded-2xl border border-gray-100 shadow-sm overflow-x-auto no-scrollbar">
                        {categories.map((cat, i) => (
                            <button key={cat} className={`px-5 py-2.5 text-xs font-black rounded-xl transition-all uppercase tracking-wider ${i === 0 ? "bg-gray-900 text-white shadow-lg" : "text-gray-500 hover:text-gray-900 hover:bg-gray-50 uppercase"}`}>{cat}</button>
                        ))}
                    </div>
                    <div className="relative w-full lg:w-80">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input className="w-full h-14 pl-12 pr-4 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all font-medium" placeholder="Search knowledge..." />
                    </div>
                </div>

                <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50/50">
                            <tr>
                                <th className="px-10 py-6 text-xs font-black text-gray-400 uppercase tracking-widest">Knowledge Item</th>
                                <th className="px-8 py-6 text-xs font-black text-gray-400 uppercase tracking-widest hidden md:table-cell">Type</th>
                                <th className="px-8 py-6 text-xs font-black text-gray-400 uppercase tracking-widest hidden xl:table-cell">Tags</th>
                                <th className="px-8 py-6 text-xs font-black text-gray-400 uppercase tracking-widest hidden lg:table-cell">Added</th>
                                <th className="px-10 py-6 text-xs font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {items.map((item, i) => (
                                <tr key={i} className="group hover:bg-gray-50/50 transition-colors">
                                    <td className="px-10 py-8">
                                        <div className="flex items-center">
                                            <div className={`h-12 w-12 rounded-2xl flex items-center justify-center mr-6 ${item.color} shadow-sm group-hover:scale-110 transition-transform`}>
                                                <FileText className="h-6 w-6" />
                                            </div>
                                            <span className="text-lg font-bold text-gray-900 tracking-tight">{item.title}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-8 hidden md:table-cell">
                                        <span className="text-sm font-bold text-gray-500">{item.type}</span>
                                    </td>
                                    <td className="px-8 py-8 hidden xl:table-cell">
                                        <div className="flex gap-2">
                                            {item.tags.map(tag => (
                                                <span key={tag} className="px-3 py-1 bg-gray-50 text-gray-400 text-[10px] font-black uppercase tracking-widest rounded-lg transition-colors group-hover:bg-white group-hover:text-gray-900 border border-gray-100">{tag}</span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-8 py-8 hidden lg:table-cell">
                                        <span className="text-sm font-medium text-gray-400">{item.date}</span>
                                    </td>
                                    <td className="px-10 py-8">
                                        <div className="flex items-center justify-end space-x-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button className="h-10 w-10 flex items-center justify-center bg-white border border-gray-200 text-gray-400 hover:text-primary-600 hover:border-primary-100 rounded-xl transition-all shadow-sm"><MessageSquare className="h-4 w-4" /></button>
                                            <button className="h-10 w-10 flex items-center justify-center bg-white border border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-100 rounded-xl transition-all shadow-sm"><Trash2 className="h-4 w-4" /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
