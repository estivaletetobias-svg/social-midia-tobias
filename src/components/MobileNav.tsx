"use client";

import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Menu, X } from "lucide-react";

export function MobileNav() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="lg:hidden">
            {/* Mobile HeaderBar */}
            <div className="fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-md border-b border-black/5 z-40 flex items-center justify-between px-6">
                <span className="text-xl font-black text-gray-900 tracking-[0.2em] uppercase font-[family-name:var(--font-space)]">
                    STE<span className="text-primary-600 italic">LAR</span>
                </span>
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="p-2 text-gray-500 hover:text-gray-900 transition-colors"
                >
                    {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </button>
            </div>

            {/* Mobile Sidebar Overlay */}
            {isOpen && (
                <div 
                    className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 animate-in fade-in duration-300"
                    onClick={() => setIsOpen(false)}
                >
                    <div 
                        className="w-72 h-full bg-[#f8f9fa] shadow-2xl animate-in slide-in-from-left duration-500 overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                         {/* We can reuse the Sidebar content but we need to pass a property to hide its container logic */}
                         <div className="h-full flex flex-col p-4">
                            <Sidebar isMobile onClose={() => setIsOpen(false)} />
                         </div>
                    </div>
                </div>
            )}
        </div>
    );
}
