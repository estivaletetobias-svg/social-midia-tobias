import {
    Plus,
    ArrowUpRight,
    Clock,
    CheckCircle2,
    PenTool,
    Sparkles
} from "lucide-react";

export default function DashboardOverview() {
    const stats = [
        { name: "Drafts in Pipeline", value: "12", icon: PenTool, change: "+2", changeType: "increase" },
        { name: "Approved Content", value: "4", icon: CheckCircle2, change: "+1", changeType: "increase" },
        { name: "AI Topics Proposed", value: "24", icon: Sparkles, change: "+5", changeType: "increase" },
        { name: "Hours Saved", value: "18.5", icon: Clock, change: "+4.2", changeType: "increase" },
    ];

    return (
        <div className="max-w-7xl mx-auto space-y-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl tracking-tight">Editorial Hub</h1>
                    <p className="mt-2 text-lg text-gray-500 max-w-2xl font-medium">
                        Welcome back, Tobias. Your automated editorial engine has 3 new topics for you to review.
                    </p>
                </div>
                <div className="flex items-center space-x-4">
                    <button className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-bold rounded-xl shadow-lg shadow-primary-500/20 text-white bg-primary-600 hover:bg-primary-700 transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                        <Plus className="-ml-1 mr-2 h-5 w-5" />
                        New Content
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {stats.map((item) => (
                    <div key={item.name} className="relative group bg-white p-8 rounded-3xl shadow-sm border border-gray-100/50 hover:shadow-xl hover:shadow-gray-200/50 transition-all duration-300 overflow-hidden">
                        <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform duration-500">
                            <item.icon className="h-12 w-12 text-primary-600" />
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center justify-center h-12 w-12 rounded-2xl bg-primary-50 text-primary-600 group-hover:bg-primary-600 group-hover:text-white transition-colors duration-300">
                                <item.icon className="h-6 w-6" aria-hidden="true" />
                            </div>
                            <span className="flex items-center text-xs font-bold text-green-600 bg-green-50 px-3 py-1.5 rounded-full ring-1 ring-inset ring-green-600/10">
                                <ArrowUpRight className="h-4 w-4 mr-1" />
                                {item.change}
                            </span>
                        </div>
                        <div className="mt-6">
                            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{item.name}</p>
                            <h3 className="text-4xl font-black text-gray-900 mt-2">{item.value}</h3>
                        </div>
                    </div>
                ))}
            </div>

            {/* Grid for main sections */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Pipeline */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-8 py-6 border-b border-gray-50 flex items-center justify-between">
                            <h3 className="text-xl font-bold text-gray-900">Active Content Pipeline</h3>
                            <button className="text-primary-600 text-sm font-bold hover:text-primary-700 transition-colors">View All</button>
                        </div>
                        <div className="divide-y divide-gray-50">
                            {/* Example row */}
                            <div className="px-8 py-6 flex items-center group hover:bg-gray-50/50 transition-colors">
                                <div className="flex-shrink-0 h-12 w-12 bg-primary-50 rounded-2xl flex items-center justify-center text-primary-600 group-hover:bg-primary-600 group-hover:text-white transition-all">
                                    <PenTool className="h-6 w-6" />
                                </div>
                                <div className="ml-6 flex-1">
                                    <h4 className="text-base font-bold text-gray-900">Future of AI in Content Marketing</h4>
                                    <div className="mt-1 flex items-center space-x-4">
                                        <span className="text-sm font-medium text-gray-500">Instagram Carousel</span>
                                        <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md uppercase tracking-wide">Draft</span>
                                    </div>
                                </div>
                                <div className="ml-4 flex items-center space-x-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button className="px-5 py-2.5 text-sm font-bold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all">Review</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar widgets */}
                <div className="space-y-8">
                    <div className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-3xl shadow-2xl p-8 text-white relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-20 transform translate-x-4 translate-y-4 group-hover:scale-125 transition-transform duration-700">
                            <Sparkles className="h-32 w-32" />
                        </div>
                        <h3 className="text-2xl font-black relative">Topic Discovery</h3>
                        <p className="mt-4 text-primary-100 font-medium leading-relaxed relative">
                            Our semantic engine found 5 new trends relevant to your "Professional Productivity" pillar.
                        </p>
                        <button className="mt-8 w-full py-4 px-6 bg-white text-primary-700 font-black rounded-2xl shadow-lg hover:bg-primary-50 transition-all transform hover:scale-[1.02] active:scale-100 relative">
                            Explore Now
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
