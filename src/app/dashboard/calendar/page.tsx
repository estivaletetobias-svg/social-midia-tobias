"use client";

import { useState, useEffect } from "react";
import { Calendar as CalendarIcon, Filter, Layers, Users, Trash2 } from "lucide-react";
import Link from "next/link";

export default function EditorialCalendar() {
    const [posts, setPosts] = useState<any[]>([]);

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

    const handleDeletePost = async (e: React.MouseEvent, postId: string) => {
        e.preventDefault();
        e.stopPropagation();

        if (!confirm("Tem certeza que deseja apagar essa ideia/post para sempre?")) return;

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

    const days = Array.from({ length: 35 }, (_, i) => i - 3); // Previous month trailing days
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
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
                    {days.map((day, i) => {
                        const cellDay = day < 1 ? 31 + day : (day > 31 ? day - 31 : day);
                        const isCurrentMonth = day >= 1 && day <= 31;

                        return (
                            <div
                                key={i}
                                onDragOver={handleDragOver}
                                onDrop={(e) => isCurrentMonth && handleDrop(e, cellDay, currentMonth, currentYear)}
                                className={`min-h-[160px] bg-white p-4 transition-all hover:bg-gray-200/20 group ${!isCurrentMonth ? 'bg-gray-50/50' : ''}`}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <span className={`text-sm font-bold ${day === today.getDate() && isCurrentMonth ? 'text-primary-600 bg-primary-50 ring-4 ring-primary-50 rounded-full h-7 w-7 flex items-center justify-center' : 'text-gray-400'}`}>
                                        {cellDay}
                                    </span>
                                    {day === today.getDate() && isCurrentMonth && <div className="h-1.5 w-1.5 rounded-full bg-primary-600 shadow-sm" />}
                                </div>

                                <div className="space-y-2 mt-2">
                                    {/* Actual Database Posts */}
                                    {posts.filter(p => p.day === cellDay && p.month === currentMonth && isCurrentMonth).map(post => (
                                        <div
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, post.id)}
                                            key={post.id}
                                            className="transform transition-transform hover:scale-[1.02] active:scale-95 z-10 relative cursor-grab active:cursor-grabbing"
                                        >
                                            <Link href={`/dashboard/content/${post.id}`}>
                                                <div className={`p-2.5 rounded-xl border-l-[3px] group-hover:shadow-md transition-all ${post.platform.toLowerCase() === 'instagram' ? 'border-primary-500 bg-primary-50/50 hover:bg-primary-50' :
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
                                                        <button onClick={(e) => handleDeletePost(e, post.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                                                            <Trash2 className="w-3 h-3" />
                                                        </button>
                                                    </div>

                                                    {post.image && (
                                                        <div className="w-full h-16 mt-2 mb-2 rounded-lg bg-gray-200 overflow-hidden relative border border-black/5">
                                                            <img
                                                                src={post.image}
                                                                alt="Post thumbnail"
                                                                className="absolute inset-0 w-full h-full object-cover"
                                                            />
                                                        </div>
                                                    )}

                                                    <p className="mt-1 text-xs font-bold text-gray-900 line-clamp-2" title={post.title}>{post.title}</p>
                                                </div>
                                            </Link>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
