"use client";

import { useState } from "react";
import { Search, Plus, Sparkles, Zap, CheckCircle2, XCircle, RefreshCcw } from "lucide-react";

export default function IdeasLibrary() {
    const [isSyncing, setIsSyncing] = useState(false);

    const handleSyncRSS = async () => {
        setIsSyncing(true);
        try {
            const res = await fetch('/api/discovery/sync-rss', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ feedUrl: 'https://techcrunch.com/feed/' })
            });
            const data = await res.json();
            if (data.success) {
                alert(`Success! Found ${data.data.scraped} news and generated ${data.data.savedToLibrary} new Custom Topic Ideas.`);
            } else {
                alert(`Error: ${data.error}`);
            }
        } catch (error) {
            console.error(error);
            alert('Failed to trigger background RSS sync.');
        } finally {
            setIsSyncing(false);
        }
    };

    const categories = ["All Topics", "Trends", "Viral Hooks", "Evergreen", "Product Updates"];
    const topics = [
        { title: "The Death of Generic AI Copy", summary: "Why brand voice is the only moat left in content marketing.", score: 0.94, pillar: "AI Automation", platform: "LinkedIn" },
        { title: "3 Prompt Hacks for DALL-E 3", summary: "Strategic ways to get consistent brand imagery.", score: 0.88, pillar: "Visual Strategy", platform: "Instagram" },
        { title: "Modular Architecture for Teams", summary: "How to scale content production systems in 2026.", score: 0.91, pillar: "Productivity", platform: "LinkedIn" },
    ];

    return (
        <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-1000">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-6 md:space-y-0 pb-10 border-b border-black/5">
                <div>
                    <div className="flex items-center space-x-3 mb-3 animate-fade-in">
                        <Sparkles className="h-5 w-5 text-primary-500 fill-primary-500/20" />
                        <span className="text-sm font-black text-primary-600/80 uppercase tracking-[0.2em] shadow-sm">Topic Discovery Engine</span>
                    </div>
                    <h1 className="text-5xl lg:text-6xl font-black tracking-tighter text-gradient animate-slide-up">
                        Ideas Library
                    </h1>
                    <p className="mt-5 text-xl text-gray-500/80 max-w-3xl font-medium leading-relaxed">
                        AI-driven topic suggestions based on your brand DNA and recent industry trends.
                    </p>
                </div>
                <div className="flex items-center space-x-4">
                    <button
                        onClick={handleSyncRSS}
                        disabled={isSyncing}
                        className={`h-14 px-6 glass-panel text-gray-700 text-sm font-black rounded-[20px] hover:bg-white/80 transition-all flex items-center hover:shadow-xl hover:shadow-black/5 disabled:opacity-50 hover:-translate-y-1 duration-300`}
                    >
                        <RefreshCcw className={`mr-3 h-5 w-5 ${isSyncing ? "animate-spin text-primary-500" : ""}`} />
                        {isSyncing ? "Scraping..." : "Force RSS Sync"}
                    </button>
                    <button className="h-14 px-8 bg-gray-900 text-white text-sm font-black rounded-[20px] shadow-2xl hover:bg-black transition-all flex items-center transform hover:-translate-y-1 hover:shadow-primary-500/25 duration-300">
                        <Plus className="mr-3 h-5 w-5" />
                        New Manual Idea
                    </button>
                </div>
            </div>

            {/* Tabs & Search */}
            <div className="flex flex-col xl:flex-row items-center justify-between gap-6 pb-4">
                <div className="flex items-center space-x-2 glass-panel p-2 rounded-[24px] w-full xl:w-auto overflow-x-auto no-scrollbar">
                    {categories.map((cat, i) => (
                        <button
                            key={cat}
                            className={`px-6 py-3 text-xs font-black rounded-[16px] transition-all uppercase tracking-wider ${i === 0 ? "bg-white text-gray-900 shadow-md shadow-black/5 border border-white/60" : "text-gray-500 hover:text-gray-900 hover:bg-white/40 border border-transparent"}`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
                <div className="relative w-full xl:w-96 group">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
                    <input
                        className="w-full h-16 pl-14 pr-6 glass-panel rounded-[24px] focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500/50 transition-all font-bold text-gray-700 placeholder:text-gray-400/70"
                        placeholder="Search topics, keywords, tags..."
                    />
                </div>
            </div>

            {/* Topics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-20">
                {topics.map((item, i) => (
                    <div key={i} className="group relative glass-panel p-8 rounded-[40px] hover:shadow-2xl hover:shadow-primary-500/10 hover:-translate-y-2 transition-all duration-500 flex flex-col h-full overflow-hidden border-white/60">
                        {/* Glow effect on hover */}
                        <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                        <div className="relative z-10 flex items-center justify-between mb-8">
                            <div className="flex items-center space-x-2 bg-white/80 backdrop-blur-md text-primary-600 px-4 py-2 rounded-2xl border border-primary-100/50 shadow-sm shadow-primary-500/5">
                                <Zap className="h-4 w-4 fill-primary-600/20" />
                                <span className="text-xs font-black tracking-widest uppercase truncate">{item.score * 100}% Relevance</span>
                            </div>
                            <span className="text-[10px] font-black tracking-[0.2em] text-gray-400/80 bg-black/5 px-4 py-2 rounded-full uppercase border border-white/50">
                                {item.platform}
                            </span>
                        </div>

                        <h3 className="relative z-10 text-2xl font-black text-gray-900 leading-tight group-hover:text-primary-600 transition-colors tracking-tight">{item.title}</h3>
                        <p className="relative z-10 mt-5 text-gray-500/80 font-medium leading-relaxed flex-grow text-lg">{item.summary}</p>

                        <div className="relative z-10 mt-10 flex items-center pt-8 border-t border-black/5 space-x-3">
                            <button className="flex-1 h-16 bg-white border border-white/60 shadow-sm shadow-black/5 text-gray-900 text-sm font-black rounded-2xl hover:bg-primary-500 hover:border-primary-500 hover:text-white hover:shadow-lg hover:shadow-primary-500/25 transition-all duration-300 flex items-center justify-center group/btn">
                                <CheckCircle2 className="mr-2 h-5 w-5 group-hover/btn:scale-110 transition-transform" />
                                Approve
                            </button>
                            <button className="h-16 w-16 bg-white border border-white/60 shadow-sm shadow-black/5 text-gray-400 hover:text-red-500 hover:bg-red-50 hover:border-red-100 rounded-2xl transition-all duration-300 flex items-center justify-center">
                                <XCircle className="h-6 w-6" />
                            </button>
                        </div>
                    </div>
                ))}

                {/* Create Card */}
                <button className="group relative p-8 rounded-[40px] border-4 border-dashed border-primary-500/10 hover:border-primary-400/30 hover:bg-white/40 transition-all duration-500 flex flex-col items-center justify-center text-center space-y-5 h-full min-h-[400px]">
                    <div className="h-20 w-20 bg-white shadow-xl shadow-black/5 rounded-full flex items-center justify-center text-gray-300 group-hover:bg-primary-500 group-hover:text-white group-hover:scale-110 transition-all duration-500">
                        <Plus className="h-8 w-8" />
                    </div>
                    <div>
                        <p className="text-xl font-black text-gray-900">Custom Idea</p>
                        <p className="text-sm font-bold text-gray-400/80 mt-2 tracking-wide">Add your own creative spark</p>
                    </div>
                </button>
            </div>
        </div>
    );
}
