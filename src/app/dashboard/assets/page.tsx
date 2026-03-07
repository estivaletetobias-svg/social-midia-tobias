import { Download, ExternalLink, Image as ImageIcon, Layers, MoreHorizontal, Plus, Search, Sparkles } from "lucide-react";

export default function VisualAssets() {
    const assets = [
        { title: "Futuristic Office - Sunset", model: "DALL-E 3", size: "1024x1024", date: "1h ago", url: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=400&q=80" },
        { title: "Abstract Data Visualization", model: "Flux.1", size: "1024x1024", date: "4h ago", url: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=400&q=80" },
        { title: "Cyberpunk Workspace", model: "DALL-E 3", size: "1024x1024", date: "Yesterday", url: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=400&q=80" },
        { title: "Minimalist Brand Pattern", model: "Midjourney", size: "1024x1024", date: "2 days ago", url: "https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&w=400&q=80" },
    ];

    return (
        <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in slide-in-from-right-8 duration-1000">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 pb-12 border-b border-gray-100">
                <div className="space-y-4">
                    <div className="h-14 w-14 bg-primary-50 rounded-2xl flex items-center justify-center text-primary-600 shadow-sm border border-primary-100">
                        <ImageIcon className="h-7 w-7" />
                    </div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight">Visual Library</h1>
                    <p className="text-lg text-gray-500 font-medium max-w-xl">
                        Curated AI-generated assets and high-fidelity prompts for your content pieces.
                    </p>
                </div>
                <div className="flex items-center space-x-3">
                    <button className="h-14 px-8 bg-white border-2 border-gray-900 text-gray-900 text-sm font-black rounded-2xl hover:bg-gray-50 transition-all flex items-center shadow-lg transform hover:-translate-y-1 active:translate-y-0">
                        <Layers className="mr-3 h-5 w-5" /> All Collections
                    </button>
                    <button className="h-14 px-8 bg-primary-600 text-white text-sm font-black rounded-2xl shadow-xl shadow-primary-500/20 hover:bg-primary-700 transition-all transform hover:-translate-y-1 active:translate-y-0 flex items-center">
                        <Sparkles className="mr-3 h-5 w-5 fill-white" /> Generate New
                    </button>
                </div>
            </div>

            {/* Grid Explorer */}
            <div className="space-y-10">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-black text-gray-900 flex items-center">
                        Recent Generations <span className="ml-4 px-3 py-1 bg-gray-100 text-gray-400 text-xs font-black rounded-lg uppercase tracking-widest">{assets.length}</span>
                    </h2>
                    <div className="relative w-72">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input className="w-full h-11 pl-10 pr-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all font-medium text-sm" placeholder="Search prompts..." />
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
                    {assets.map((asset, i) => (
                        <div key={i} className="group relative bg-white rounded-[32px] overflow-hidden shadow-sm border border-gray-100 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500">
                            <div className="aspect-square relative overflow-hidden bg-gray-100">
                                <img
                                    src={asset.url}
                                    alt={asset.title}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-3 backdrop-blur-[2px]">
                                    <button className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center text-gray-900 hover:bg-primary-600 hover:text-white transition-all transform hover:scale-110"><Download className="h-5 w-5" /></button>
                                    <button className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center text-gray-900 hover:bg-primary-600 hover:text-white transition-all transform hover:scale-110"><ExternalLink className="h-5 w-5" /></button>
                                </div>
                            </div>
                            <div className="p-6">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[10px] font-black text-primary-600 uppercase tracking-widest">{asset.model}</span>
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{asset.size}</span>
                                </div>
                                <h3 className="text-base font-black text-gray-900 truncate tracking-tight">{asset.title}</h3>
                                <p className="mt-1 text-xs font-bold text-gray-400">{asset.date}</p>

                                <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button className="text-xs font-black text-primary-600 hover:text-primary-700 flex items-center">View Prompt <MoreHorizontal className="ml-1 h-3 w-3" /></button>
                                    <button className="p-2 text-gray-400 hover:text-red-500 transition-colors"><Download className="h-4 w-4" /></button>
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Template Generator Card */}
                    <div className="group relative bg-gray-50 border-2 border-dashed border-gray-200 rounded-[32px] aspect-square flex flex-col items-center justify-center p-8 text-center space-y-4 hover:bg-primary-50 hover:border-primary-100 transition-all cursor-pointer">
                        <div className="h-16 w-16 bg-white rounded-full shadow-sm flex items-center justify-center text-gray-400 group-hover:text-primary-600 group-hover:scale-110 transition-all">
                            <Plus className="h-8 w-8" />
                        </div>
                        <div>
                            <p className="text-base font-black text-gray-900">New Visual</p>
                            <p className="text-xs font-bold text-gray-400 mt-1">Start from content, draft, or concept</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
