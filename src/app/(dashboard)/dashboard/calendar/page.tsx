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

    const handlePrev = () => {
        if (viewMode === 'month') {
            setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
        } else if (viewMode === 'week') {
            const d = new Date(viewDate);
            d.setDate(d.getDate() - 7);
            setViewDate(d);
        }
    };

    const handleNext = () => {
        if (viewMode === 'month') {
            setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
        } else if (viewMode === 'week') {
            const d = new Date(viewDate);
            d.setDate(d.getDate() + 7);
            setViewDate(d);
        }
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
                <div className="flex items-center space-x-4">
                    <button className="h-14 px-8 text-xs font-black text-gray-700 bg-white border-2 border-gray-200 rounded-2xl hover:bg-gray-50 hover:border-gray-900 transition-all shadow-sm uppercase tracking-widest">
                        <Filter className="mr-2 h-4 w-4 inline" />
                        Filtros
                    </button>
                    <button className="h-14 px-8 text-xs font-black text-white bg-[#2B3440] rounded-2xl hover:bg-black transition-all shadow-xl shadow-[#2B3440]/20 uppercase tracking-widest">
                        <CalendarIcon className="mr-2 h-4 w-4 inline" />
                        Agendar Peça
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
                                onClick={handlePrev}
                                className="px-3 py-1 bg-white border-r border-gray-100 text-gray-400 hover:text-gray-900 transition-colors">{"<"}</button>
                            <button 
                                onClick={handleNext}
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
                                        className={`min-h-[160px] bg-white p-4 transition-all hover:bg-gray-50 group border border-gray-200 ${!isCurrentMonth ? 'opacity-30' : ''} ${isToday ? 'bg-gray-50 ring-2 ring-inset ring-[#2B3440]/10' : ''}`}
                                    >
                                        <div className="flex items-center justify-between mb-4">
                                            <span className={`text-sm font-black ${isToday ? 'text-white bg-[#2B3440] h-8 w-8 flex items-center justify-center rounded-xl shadow-lg' : 'text-gray-400'}`}>
                                                {day}
                                            </span>
                                            {isToday && <div className="h-2 w-2 rounded-full bg-[#2B3440] animate-pulse" />}
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
                                                        <div className={`p-4 rounded-2xl border-2 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ${
                                                            deletingIds.has(post.id) ? 'opacity-20 pointer-events-none' : ''
                                                        } ${post.platform.toLowerCase() === 'instagram' ? 'border-[#2B3440]/10 bg-white hover:border-[#2B3440]' :
                                                            post.platform.toLowerCase() === 'linkedin' ? 'border-blue-100 bg-white hover:border-blue-500' :
                                                                'border-gray-100 bg-white hover:border-gray-500'
                                                            }`}>
                                                            <div className="flex justify-between items-start mb-3">
                                                                <p className={`text-[9px] font-black uppercase tracking-widest ${post.platform.toLowerCase() === 'instagram' ? 'text-[#2B3440]' :
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

                {/* Weekly View */}
                {viewMode === 'week' && (
                    <div className="grid grid-cols-7 gap-px bg-gray-100">
                        {(() => {
                            const days = renderMonthDays();
                            // Find the week containing viewDate
                            const viewDateTime = new Date(viewDate.getFullYear(), viewDate.getMonth(), viewDate.getDate()).getTime();
                            let weekDays: any[] = [];
                            
                            // Find which week index our viewDate falls into
                            for(let i=0; i < days.length; i += 7) {
                                const week = days.slice(i, i+7);
                                const isInWeek = week.some(d => {
                                    const dTime = new Date(d.year, d.month, d.day).getTime();
                                    return dTime === viewDateTime;
                                });
                                if (isInWeek) {
                                    weekDays = week;
                                    break;
                                }
                            }

                            if (weekDays.length === 0) weekDays = days.slice(0, 7);

                            return (
                                <>
                                    {/* Week Column Headers */}
                                    <div className="col-span-7 grid grid-cols-7 border-b border-gray-50 bg-gray-50/30">
                                        {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map(day => (
                                            <div key={day} className="px-4 py-3 text-[10px] font-black text-gray-400 text-center uppercase tracking-widest">{day}</div>
                                        ))}
                                    </div>
                                    
                                    {weekDays.map((dateObj, i) => {
                                        const { day, month, year } = dateObj;
                                        const isToday = today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
                                        
                                        return (
                                            <div 
                                                key={i} 
                                                onDragOver={handleDragOver}
                                                onDrop={(e) => handleDrop(e, day, month, year)}
                                                className="min-h-[400px] bg-white p-4 hover:bg-gray-50 transition-colors"
                                            >
                                                <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-50">
                                                    <span className={`text-lg font-black ${isToday ? 'text-primary-600' : 'text-gray-900'}`}>{day}</span>
                                                    {isToday && <span className="text-[8px] font-black text-white bg-primary-600 px-1.5 py-0.5 rounded-full uppercase">Hoje</span>}
                                                </div>
                                                <div className="space-y-3">
                                                    {posts.filter(p => p.day === day && p.month === month && p.year === year).map(post => (
                                                        <div
                                                            key={post.id}
                                                            draggable
                                                            onDragStart={(e) => handleDragStart(e, post.id)}
                                                            className="cursor-grab active:cursor-grabbing transform transition-all hover:scale-[1.02]"
                                                        >
                                                            <div className={`p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:border-primary-200 hover:bg-white transition-all hover:shadow-lg hover:shadow-black/5 group ${deletingIds.has(post.id) ? 'opacity-20 pointer-events-none' : ''}`}>
                                                                <div className="flex justify-between items-start mb-2">
                                                                    <p className="text-[8px] font-black text-primary-500 uppercase">{post.platform}</p>
                                                                    <button 
                                                                        onClick={(e) => handleDeletePost(e, post.id)} 
                                                                        className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-all"
                                                                    >
                                                                        <Trash2 className="h-3 w-3" />
                                                                    </button>
                                                                </div>
                                                                
                                                                <Link href={`/dashboard/content/${post.id}`}>
                                                                    <p className="text-xs font-bold text-gray-900 line-clamp-3 leading-tight mb-2 group-hover:text-primary-600 transition-colors">{post.title}</p>
                                                                </Link>
                                                                
                                                                <div className="flex items-center gap-1.5 mt-2">
                                                                    <div className={`h-1.5 w-1.5 rounded-full ${post.status === 'approved' ? 'bg-green-500' : 'bg-gray-300'}`} />
                                                                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">{post.status}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </>
                            );
                        })()}
                    </div>
                )}

                {/* List View */}
                {viewMode === 'list' && (
                    <div className="bg-white">
                        <div className="grid grid-cols-12 gap-4 px-8 py-4 border-b border-gray-50 bg-gray-50/50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            <div className="col-span-2">Data</div>
                            <div className="col-span-2">Plataforma</div>
                            <div className="col-span-5">Título do Conteúdo</div>
                            <div className="col-span-2 text-center">Status</div>
                            <div className="col-span-1 text-right">Ações</div>
                        </div>
                        <div className="divide-y divide-gray-50">
                            {[...posts].sort((a,b) => {
                                const da = new Date(a.year, a.month, a.day);
                                const db = new Date(b.year, b.month, b.day);
                                return da.getTime() - db.getTime();
                            }).map(post => {
                                const date = new Date(post.year, post.month, post.day);
                                return (
                                    <Link 
                                        key={post.id} 
                                        href={`/dashboard/content/${post.id}`}
                                        className="grid grid-cols-12 gap-4 px-8 py-5 items-center hover:bg-gray-50 transition-colors group"
                                    >
                                        <div className="col-span-2 text-xs font-bold text-gray-500">
                                            {date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                        </div>
                                        <div className="col-span-2">
                                            <span className={`text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-wider ${
                                                post.platform.toLowerCase() === 'instagram' ? 'bg-primary-50 text-primary-600' : 'bg-blue-50 text-blue-600'
                                            }`}>
                                                {post.platform}
                                            </span>
                                        </div>
                                        <div className="col-span-5 font-black text-gray-900 truncate pr-10 group-hover:text-primary-600 transition-colors">
                                            {post.title}
                                        </div>
                                        <div className="col-span-2 text-center">
                                            <span className={`text-[9px] font-black px-3 py-1.5 rounded-full border ${
                                                post.status === 'approved' ? 'bg-green-500 border-transparent text-white' : 'bg-white border-gray-200 text-gray-500'
                                            }`}>
                                                {post.status.toUpperCase()}
                                            </span>
                                        </div>
                                        <div className="col-span-1 text-right">
                                            <button 
                                                onClick={(e) => handleDeletePost(e, post.id)}
                                                className={`p-2 text-gray-400 hover:text-red-500 transition-all ${deletingIds.has(post.id) ? 'animate-pulse' : ''}`}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                        {posts.length === 0 && (
                            <div className="p-20 text-center text-gray-400 font-bold uppercase tracking-widest">
                                Nenhuma peça agendada para este perfil.
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
