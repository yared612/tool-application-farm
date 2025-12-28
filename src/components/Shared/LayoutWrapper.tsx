'use client';
import { Moon, Sun } from 'lucide-react';
import React from 'react';

interface Props { children: React.ReactNode; darkMode: boolean; toggleDarkMode: () => void; }

export default function LayoutWrapper({ children, darkMode, toggleDarkMode }: Props) {
    return (
        <div className={`${darkMode ? 'dark' : ''} h-screen w-full transition-colors duration-500`}>
            <div className="bg-[#f2f4e6] dark:bg-[#1a1c29] text-[#5e5a52] dark:text-[#dfd7c3] h-full w-full relative overflow-hidden font-sans selection:bg-[#68c9bc] selection:text-white flex flex-col md:flex-row">
                <div className="absolute inset-0 opacity-10 pointer-events-none z-0" style={{ backgroundImage: `radial-gradient(${darkMode ? '#4a5568' : '#88c9a1'} 2px, transparent 2px)`, backgroundSize: '30px 30px' }} />
                <div className="relative z-10 w-full h-full flex flex-col md:flex-row">{children}</div>
                <button onClick={toggleDarkMode} className="fixed top-3 right-3 md:top-4 md:right-4 z-50 p-2 md:p-3 rounded-full bg-white dark:bg-[#2d3748] shadow-lg border-2 border-[#68c9bc] hover:scale-110 transition-transform active:scale-95">
                    {darkMode ? <Sun size={20} className="text-yellow-400" /> : <Moon size={20} className="text-[#68c9bc]" />}
                </button>
            </div>
        </div>
    );
}