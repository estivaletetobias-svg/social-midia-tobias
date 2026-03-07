import { Calendar as CalendarIcon, Filter, Layers, Users } from "lucide-react";

export default function EditorialCalendar() {
    const days = Array.from({ length: 35 }, (_, i) => i - 3); // Previous month trailing days
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Editorial Calendar</h1>
                    <p className="mt-2 text-lg text-gray-500 font-medium">Plan and orchestrate your content distribution across all platforms.</p>
                </div>
                <div className="flex items-center space-x-3">
                    <button className="inline-flex items-center px-4 py-2 text-sm font-bold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all shadow-sm">
                        <Filter className="mr-2 h-4 w-4" />
                        Filters
                    </button>
                    <button className="inline-flex items-center px-4 py-2 text-sm font-bold text-white bg-primary-600 rounded-xl hover:bg-primary-700 transition-all shadow-lg shadow-primary-500/20">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        Schedule Post
                    </button>
                </div>
            </div>

            {/* Calendar Header */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-8 py-6 border-b border-gray-50">
                    <div className="flex items-center space-x-4">
                        <h2 className="text-xl font-bold text-gray-900">{months[new Date().getMonth()]} 2026</h2>
                        <div className="flex border border-gray-100 rounded-lg overflow-hidden shadow-sm">
                            <button className="px-3 py-1 bg-white border-r border-gray-100 text-gray-400 hover:text-gray-900 transition-colors">{"<"}</button>
                            <button className="px-3 py-1 bg-white text-gray-400 hover:text-gray-900 transition-colors">{">"}</button>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2 bg-gray-50 p-1 rounded-xl border border-gray-100">
                        <button className="px-4 py-1.5 text-xs font-bold text-gray-900 bg-white rounded-lg shadow-sm ring-1 ring-gray-900/5 transition-all">Month</button>
                        <button className="px-4 py-1.5 text-xs font-bold text-gray-500 hover:text-gray-900 transition-all">Week</button>
                        <button className="px-4 py-1.5 text-xs font-bold text-gray-500 hover:text-gray-900 transition-all">List</button>
                    </div>
                </div>

                {/* Grid Week Days */}
                <div className="grid grid-cols-7 border-b border-gray-50 bg-gray-50/30">
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
                        <div key={day} className="px-4 py-3 text-xs font-bold text-gray-400 text-center uppercase tracking-wider">{day}</div>
                    ))}
                </div>

                {/* Grid Days */}
                <div className="grid grid-cols-7 gap-px bg-gray-100">
                    {days.map((day, i) => (
                        <div key={i} className={`min-h-[160px] bg-white p-4 transition-all hover:bg-gray-200/20 group ${day < 1 || day > 31 ? 'bg-gray-50/50' : ''}`}>
                            <div className="flex items-center justify-between mb-2">
                                <span className={`text-sm font-bold ${day === 6 ? 'text-primary-600 bg-primary-50 ring-4 ring-primary-50 rounded-full h-7 w-7 flex items-center justify-center' : 'text-gray-400'}`}>
                                    {day < 1 ? 31 + day : (day > 31 ? day - 31 : day)}
                                </span>
                                {day === 6 && <div className="h-1.5 w-1.5 rounded-full bg-primary-600 shadow-sm" />}
                            </div>

                            {/* Sample Post Entry */}
                            {day === 6 && (
                                <div className="mt-2 p-2.5 rounded-xl border-l-[3px] border-primary-500 bg-primary-50/50 group-hover:shadow-md transition-all cursor-pointer">
                                    <p className="text-[10px] font-black text-primary-600 uppercase tracking-wide">Instagram</p>
                                    <p className="mt-1 text-xs font-bold text-gray-900 truncate">AI Strategies for 2026</p>
                                </div>
                            )}

                            {day === 8 && (
                                <div className="mt-2 p-2.5 rounded-xl border-l-[3px] border-blue-500 bg-blue-50/50 group-hover:shadow-md transition-all cursor-pointer">
                                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-wide">LinkedIn</p>
                                    <p className="mt-1 text-xs font-bold text-gray-900 truncate">Future of Workflow</p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
