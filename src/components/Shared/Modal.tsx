'use client';
import { Settings, X } from 'lucide-react';
import React from 'react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className="absolute inset-0" onClick={onClose}></div>
            <div className="bg-white dark:bg-[#2d3748] rounded-[24px] md:rounded-[30px] shadow-2xl w-full max-w-lg border-4 border-[#68c9bc] animate-in fade-in zoom-in duration-200 max-h-[85vh] flex flex-col relative z-10">
                <div className="p-4 border-b border-gray-100 dark:border-gray-600 flex justify-between items-center shrink-0">
                    <h3 className="font-bold text-lg md:text-xl text-[#68c9bc] flex items-center gap-2">
                        <Settings size={20} /> {title}
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-white p-1">
                        <X size={24} />
                    </button>
                </div>
                <div className="p-4 md:p-6 overflow-y-auto custom-scrollbar">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Modal;