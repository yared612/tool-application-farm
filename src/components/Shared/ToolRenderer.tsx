'use client';
import { Tool } from '@/types';
import { Code, Globe, LogOut } from 'lucide-react';
import React from 'react';

interface ToolRendererProps {
    tool: Tool;
    onBack: () => void;
}

const ToolRenderer: React.FC<ToolRendererProps> = ({ tool, onBack }) => {
    const isUrlMode = tool.type === 'url';

    return (
        <div className="h-full w-full flex flex-col bg-white dark:bg-black">
            <div className="bg-[#68c9bc] p-3 md:p-4 flex items-center gap-3 text-white shadow-md z-10 shrink-0 safe-area-pt">
                <button onClick={onBack} className="p-1.5 hover:bg-white/20 rounded-full transition-colors active:scale-90">
                    <LogOut className="transform rotate-180" size={20} />
                </button>
                {/* 顯示對應的 icon */}
                {isUrlMode ? <Globe size={20} className="opacity-70" /> : <Code size={20} className="opacity-70" />}
                <span className="font-bold text-lg truncate flex-1">{tool.name}</span>
                <div className="md:hidden text-xs opacity-70 bg-white/20 px-2 py-1 rounded">Mobile</div>
            </div>

            <div className="flex-1 w-full h-full bg-white dark:bg-[#121212] relative overflow-hidden">
                <iframe
                    // 關鍵修改：根據模式切換 src 或 srcDoc
                    src={isUrlMode ? tool.url : undefined}
                    srcDoc={!isUrlMode ? (tool.code || '') : undefined}

                    title={tool.name}
                    className="w-full h-full border-0 block"
                    // 注意：對於外部 URL，可能需要 allow-same-origin 才能正常運作某些功能
                    // 但這會降低安全性，請確保只允許信任的 URL
                    sandbox="allow-scripts allow-forms allow-popups allow-modals allow-same-origin allow-presentation"
                    allow="accelerometer; camera; encrypted-media; geolocation; gyroscope; microphone; midi; clipboard-read; clipboard-write"
                    style={{ width: '100%', height: '100%' }}
                />
            </div>
        </div>
    );
};

export default ToolRenderer;