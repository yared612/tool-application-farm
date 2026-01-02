'use client';
import { Leaf } from 'lucide-react';
import React, { useState } from 'react';

interface LoginScreenProps {
    onLogin: (u: string, p: string, onError: (msg: string) => void) => void;
    loading: boolean;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, loading }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (username.trim()) {
            onLogin(username, password, setError);
        }
    };

    return (
        <div className="flex-1 flex items-center justify-center p-4 w-full h-full overflow-y-auto">
            <div className="bg-[#fffdf2] dark:bg-[#2d3748] p-6 md:p-8 rounded-[32px] shadow-xl w-full max-w-sm md:max-w-md border-4 md:border-8 border-[#68c9bc] transform md:rotate-1 my-auto">
                <div className="text-center mb-6">
                    <div className="inline-block bg-[#68c9bc] text-white px-4 py-1.5 md:px-6 md:py-2 rounded-full text-lg md:text-xl font-bold transform -rotate-2 mb-4 shadow-md">
                        Apo Platform
                    </div>
                    <h2 className="text-xl md:text-2xl font-bold text-[#5e5a52] dark:text-white flex items-center justify-center gap-2">
                        <Leaf className="text-[#68c9bc]" size={24} />
                        Tool Application Farm
                    </h2>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-1.5">
                        <label className="block text-sm font-bold ml-2 text-[#7f7a6d] dark:text-gray-300">Account</label>
                        <input
                            type="text"
                            required
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full bg-[#f6f7eb] dark:bg-[#1a202c] border-2 border-[#e0ddc8] dark:border-gray-600 rounded-2xl px-4 py-3 focus:outline-none focus:border-[#68c9bc] transition-colors"
                            placeholder="帳號"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="block text-sm font-bold ml-2 text-[#7f7a6d] dark:text-gray-300">Password</label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-[#f6f7eb] dark:bg-[#1a202c] border-2 border-[#e0ddc8] dark:border-gray-600 rounded-2xl px-4 py-3 focus:outline-none focus:border-[#68c9bc] transition-colors"
                            placeholder="密碼"
                        />
                    </div>

                    {error && (
                        <div className="bg-red-100 text-red-600 p-3 rounded-xl text-sm font-bold text-center animate-pulse">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[#e8b15d] hover:bg-[#d69e48] text-white font-bold py-3.5 rounded-3xl shadow-lg transform transition active:scale-95 flex items-center justify-center gap-2 mt-6"
                    >
                        {loading ? '連線中...' : '登入'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default LoginScreen;