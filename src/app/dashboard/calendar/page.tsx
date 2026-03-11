"use client";

import { useState, useEffect } from "react";
import { Calendar as CalendarIcon, Filter, Layers, Users, Trash2 } from "lucide-react";
import Link from "next/link";

export default function EditorialCalendar() {
    const [posts, setPosts] = useState<any[]>([]);
    const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
    const [viewDate, setViewDate] = useState(new Date());
    const [viewMode, setViewMode] = useState<'month' | 'week' | 'list'>('month');

    useEffect(() => {
        const activeBrandId = localStorage.getItem('active_brand_id');
        if (!activeBrandId) return;

        fetch(`/api/calendar/posts?brandId=${activeBrandId}`)
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setPosts(data.posts);
                }
            })
            .catch(console.error);
    }, []);

    const handlePrevMonth = () => {
        setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
    };

    const handleDeletePost = async (e: React.MouseEvent, postId: string) => {
        e.preventDefault();
        e.stopPropagation();

        if (!confirm("Tem certeza que deseja apagar essa ideia/post para sempre?")) return;

        setDeletingIds(prev => new Set(prev).add(postId));
        try {
            const res = await fetch(`/api/content/${postId}`, {
                method: 'DELETE'
            });
            const data = await res.json();
            if (data.success) {
                setPosts(posts.filter(p => p.id !== postId));
            }
        } catch (error) {
            console.error("Failed to delete", error);
        } finally {
            setDeletingIds(prev => {
                const next = new Set(prev);
                next.delete(postId);
                return next;
            });
        }
    };

    const handleDragStart = (e: React.DragEvent, postId: string) => {
        e.dataTransfer.setData('postId', postId);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault(); // Necessary to allow dropping
    };

    const handleDrop = async (e: React.DragEvent, targetDay: number, month: number, year: number) => {
        e.preventDefault();
        const postId = e.dataTransfer.getData('postId');
        if (!postId) return;

        // Optimistic UI update
        const currentPost = posts.find(p => p.id === postId);
        if (!currentPost) return;

        // Update local state temporarily
        setPosts(posts.map(p => p.id === postId ? { ...p, day: targetDay, month: month, year: year } : p));

        // Create new target date 
        // Simple logic for the current display year/month
        const newDate = new Date(year, month, targetDay, 12, 0, 0).toISOString();

        try {
            const res = await fetch(`/api/calendar/posts/${postId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ newDate })
            });
            const data = await res.json();
            if (!data.success) {
                alert(`Erro ao regendar: ${data.error}`);
            }
        } catch (error) {
            console.error("Move item error:", error);
            alert("Erro fatal ao mover arquivo");
        }
    };

    const getDaysInMonth = (month: number, year: number) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (month: number, year: number) => new Date(year, month, 1).getDay();

    const renderMonthDays = () => {
        const month = viewDate.getMonth();
        const year = viewDate.getFullYear();
        const daysInMonth = getDaysInMonth(month, year);
        const firstDay = getFirstDayOfMonth(month, year);
        
        const calendarDays = [];
        
        // Prev month days
        const prevMonth = month === 0 ? 11 : month - 1;
        const prevYear = month === 0 ? year - 1 : year;
        const daysInPrevMonth = getDaysInMonth(prevMonth, prevYear);
        for (let i = firstDay - 1; i >= 0; i--) {
            calendarDays.push({ day: daysInPrevMonth - i, month: prevMonth, year: prevYear, isCurrentMonth: false });
        }
        
        // Current month days
        for (let i = 1; i <= daysInMonth; i++) {
            calendarDays.push({ day: i, month, year, isCurrentMonth: true });
        }
        
        // Next month days
        const nextMonth = month === 11 ? 0 : month + 1;
        const nextYear = month === 11 ? year + 1 : year;
        const remainingSlots = 35 - calendarDays.length;
        // If more slots needed to complete 6 rows or just 5 rows? 7*5=35, 7*6=42. Most calendars use 42 to be safe.
        const totalSlots = calendarDays.length > 35 ? 42 : 35;
        const needed = totalSlots - calendarDays.length;

        for (let i = 1; i <= needed; i++) {
            calendarDays.push({ day: i, month: nextMonth, year: nextYear, isCurrentMonth: false });
        }
        
        return calendarDays;
    };

    const calendarWeeks = renderMonthDays();
    const today = new Date();
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
                        <h2 className="text-xl font-bold text-gray-900">{months[viewDate.getMonth()]} {viewDate.getFullYear()}</h2>
                        <div className="flex border border-gray-100 rounded-lg overflow-hidden shadow-sm">
                            <button 
                                onClick={handlePrevMonth}
                                className="px-3 py-1 bg-white border-r border-gray-100 text-gray-400 hover:text-gray-900 transition-colors">{"<"}</button>
                            <button 
                                onClick={handleNextMonth}
                                className="px-3 py-1 bg-white text-gray-400 hover:text-gray-900 transition-colors">{">"}</button>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2 bg-gray-50 p-1 rounded-xl border border-gray-100">
                        <button 
                            onClick={() => setViewMode('month')}
                            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${viewMode === 'month' ? 'text-gray-900 bg-white shadow-sm ring-1 ring-gray-900/5' : 'text-gray-500 hover:text-gray-900'}`}>Month</button>
                        <button 
                            onClick={() => setViewMode('week')}
                            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${viewMode === 'week' ? 'text-gray-900 bg-white shadow-sm ring-1 ring-gray-900/5' : 'text-gray-500 hover:text-gray-900'}`}>Week</button>
                        <button 
                            onClick={() => setViewMode('list')}
                            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${viewMode === 'list' ? 'text-gray-900 bg-white shadow-sm ring-1 ring-gray-900/5' : 'text-gray-500 hover:text-gray-900'}`}>List</button>
                    </div>
                </div>

                {/* Content based on View Mode */}
                {viewMode === 'month' && (
                    <>
                        {/* Grid Week Days */}
                        <div className="grid grid-cols-7 border-b border-gray-50 bg-gray-50/30">
                            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
                                <div key={day} className="px-4 py-3 text-xs font-bold text-gray-400 text-center uppercase tracking-wider">{day}</div>
                            ))}
                        </div>

                        {/* Grid Days */}
                        <div className="grid grid-cols-7 gap-px bg-gray-100">
                            {calendarWeeks.map((dateObj, i) => {
                                const { day, month, year, isCurrentMonth } = dateObj;
                                const isToday = today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;

                                return (
                                    <div
                                        key={i}
                                        onDragOver={handleDragOver}
                                        onDrop={(e) => handleDrop(e, day, month, year)}
                                        className={`min-h-[160px] bg-white p-4 transition-all hover:bg-gray-200/20 group ${!isCurrentMonth ? 'bg-gray-50/50' : ''}`}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <span className={`text-sm font-bold ${isToday ? 'text-primary-600 bg-primary-50 ring-4 ring-primary-50 rounded-full h-7 w-7 flex items-center justify-center' : 'text-gray-400'}`}>
                                                {day}
                                            </span>
                                            {isToday && <div className="h-1.5 w-1.5 rounded-full bg-primary-600 shadow-sm" />}
                                        </div>

                                        <div className="space-y-2 mt-2">
                                            {/* Actual Database Posts */}
                                            {posts.filter(p => p.day === day && p.month === month && p.year === year).map(post => (
                                                <div
                                                    draggable
                                                    onDragStart={(e) => handleDragStart(e, post.id)}
                                                    key={post.id}
                                                    className="transform transition-transform hover:scale-[1.02] active:scale-95 z-10 relative cursor-grab active:cursor-grabbing"
                                                >
                                                    <Link href={`/dashboard/content/${post.id}`}>
                                                        <div className={`p-2.5 rounded-xl border-l-[3px] group-hover:shadow-md transition-all ${
                                                            deletingIds.has(post.id) ? 'opacity-20 pointer-events-none' : ''
                                                        } ${post.platform.toLowerCase() === 'instagram' ? 'border-primary-500 bg-primary-50/50 hover:bg-primary-50' :
                                                            post.platform.toLowerCase() === 'linkedin' ? 'border-blue-500 bg-blue-50/50 hover:bg-blue-50' :
                                                                'border-gray-500 bg-gray-50 hover:bg-gray-100'
                                                            }`}>
                                                            <div className="flex justify-between items-start">
                                                                <p className={`text-[10px] font-black uppercase tracking-wide ${post.platform.toLowerCase() === 'instagram' ? 'text-primary-600' :
                                                                    post.platform.toLowerCase() === 'linkedin' ? 'text-blue-600' :
                                                                        'text-gray-600'
                                                                    }`}>
                                                                    {post.platform}
                                                                </p>
                                                                <button onClick={(e) => handleDeletePost(e, post.id)} className="text-gray-400 hover:text-red-500 transition-colors p-1">
                                                                    <Trash2 className="w-3 h-3" />
                                                                </button>
                                                            </div>

                                                            {post.image ? (
                                                                <div className="w-full h-16 mt-2 mb-2 rounded-lg bg-gray-200 overflow-hidden relative border border-black/5">
                                                                    <img
                                                                        src={post.image}
                                                                        alt="Post thumbnail"
                                                                        className="absolute inset-0 w-full h-full object-cover"
                                                                    />
                                                                </div>
                                                            ) : (
                                                                <div className="w-full h-1 mt-2 mb-2 bg-gray-100 rounded-lg" />
                                                            )}

                                                            <p className="mt-1 text-[11px] font-black text-gray-900 line-clamp-2 leading-tight" title={post.title}>{post.title}</p>
                                                            
                                                            <div className="mt-2 flex items-center justify-between">
                                                                <span className={`text-[8px] font-black uppercase tracking-tighter px-1.5 py-0.5 rounded-md ${
                                                                    post.status === 'scheduled' ? 'bg-green-500 text-white' :
                                                                    post.status === 'approved' ? 'bg-primary-500 text-white' :
                                                                    'bg-gray-200 text-gray-500'
                                                                }`}>
                                                                    {post.status === 'idea' ? 'Rascunho' : 
                                                                     post.status === 'draft' ? 'Cópia' :
                                                                     post.status === 'approved' ? 'Pronto' : post.status}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </Link>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}

                {(viewMode === 'week' || viewMode === 'list') && (
                    <div className="p-20 text-center space-y-4 bg-gray-50/30">
                        <CalendarIcon className="h-12 w-12 mx-auto text-gray-200" />
                        <h3 className="text-lg font-black text-gray-900 uppercase tracking-tighter">Modo {viewMode.toUpperCase()} será ativado no Beta 2</h3>
                        <p className="text-sm text-gray-400 font-bold">Por enquanto, use a Visão Mensal para orquestrar sua esteira de conteúdo.</p>
                        <button onClick={() => setViewMode('month')} className="text-primary-500 font-black text-xs underline underline-offset-4">VOLTAR PARA MENSAL</button>
                    </div>
                )}
            </div>
        </div>
    );
}
