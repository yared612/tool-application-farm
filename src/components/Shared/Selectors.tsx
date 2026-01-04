'use client';
import { Group, User } from '@/types';
import { Check, Globe, Lock, Users } from 'lucide-react';
import React, { useState } from 'react';

// --- Permission Selector ---
interface PermissionSelectorProps {
    users: User[];
    groups: Group[];
    selectedUsers: string[];
    selectedGroups: string[];
    onUserChange: (ids: string[]) => void;
    onGroupChange: (ids: string[]) => void;
}

export const PermissionSelector: React.FC<PermissionSelectorProps> = ({
    users, groups, selectedUsers = [], selectedGroups = [], onUserChange, onGroupChange
}) => {
    const isPublic = selectedUsers.includes('PUBLIC');
    const [activeTab, setActiveTab] = useState<'groups' | 'users'>('groups');

    const togglePublic = () => {
        if (isPublic) {
            onUserChange([]);
        } else {
            onUserChange(['PUBLIC']);
            onGroupChange([]);
        }
    };

    const toggleUser = (uid: string) => {
        if (isPublic) return;
        const newSelection = selectedUsers.includes(uid)
            ? selectedUsers.filter(id => id !== uid)
            : [...selectedUsers, uid];
        onUserChange(newSelection);
    };

    const toggleGroup = (gid: string) => {
        if (isPublic) return;
        const newSelection = selectedGroups.includes(gid)
            ? selectedGroups.filter(id => id !== gid)
            : [...selectedGroups, gid];
        onGroupChange(newSelection);
    };

    return (
        <div className="space-y-3 border-2 border-dashed border-gray-200 dark:border-gray-600 p-3 rounded-xl">
            <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 flex items-center gap-2">
                <Lock size={16} /> 可見權限設定
            </label>

            <div
                onClick={togglePublic}
                className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${isPublic ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
            >
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isPublic ? 'border-green-600 bg-green-600' : 'border-gray-400 bg-white'}`}>
                    {isPublic && <Check size={12} className="text-white" />}
                </div>
                <div className="flex flex-col">
                    <span className="font-bold text-sm flex items-center"><Globe size={14} className="mr-1" /> 公開</span>
                    <span className="text-xs opacity-70">所有人員皆可看到此項目</span>
                </div>
            </div>

            <div className={`transition-opacity ${isPublic ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
                <div className="flex gap-2 mb-2 border-b border-gray-200 dark:border-gray-600 pb-1">
                    <button type="button" onClick={() => setActiveTab('groups')} className={`flex-1 pb-2 text-sm font-bold border-b-2 ${activeTab === 'groups' ? 'border-[#68c9bc] text-[#68c9bc]' : 'border-transparent text-gray-400'}`}>群組選擇</button>
                    <button type="button" onClick={() => setActiveTab('users')} className={`flex-1 pb-2 text-sm font-bold border-b-2 ${activeTab === 'users' ? 'border-[#68c9bc] text-[#68c9bc]' : 'border-transparent text-gray-400'}`}>個別島民</button>
                </div>

                <div className="h-40 overflow-y-auto custom-scrollbar p-1">
                    {activeTab === 'groups' && (
                        <div className="grid grid-cols-2 gap-2">
                            {groups.map(group => {
                                const isSelected = selectedGroups.includes(group.id);
                                return (
                                    <div key={group.id} onClick={() => toggleGroup(group.id)} className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer text-sm border ${isSelected ? 'bg-purple-50 border-purple-200 text-purple-700' : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 dark:text-gray-300'}`}>
                                        <div className={`w-4 h-4 rounded border flex items-center justify-center ${isSelected ? 'bg-purple-500 border-purple-500' : 'bg-white border-gray-300'}`}>{isSelected && <Check size={10} className="text-white" />}</div>
                                        <span className="truncate flex-1">{group.name}</span>
                                        <Users size={12} className="opacity-50" />
                                    </div>
                                )
                            })}
                            {groups.length === 0 && <div className="text-xs text-gray-400 col-span-2 text-center py-4">尚無群組</div>}
                        </div>
                    )}

                    {activeTab === 'users' && (
                        <div className="grid grid-cols-2 gap-2">
                            {users.filter(u => u.role !== 'admin').map(user => {
                                const isSelected = selectedUsers.includes(user.id);
                                return (
                                    <div key={user.id} onClick={() => toggleUser(user.id)} className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer text-sm border ${isSelected ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 dark:text-gray-300'}`}>
                                        <div className={`w-4 h-4 rounded border flex items-center justify-center ${isSelected ? 'bg-blue-500 border-blue-500' : 'bg-white border-gray-300'}`}>{isSelected && <Check size={10} className="text-white" />}</div>
                                        <span className="truncate">{user.username}</span>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- Member Selector ---
interface MemberSelectorProps {
    users: User[];
    selectedIds: string[];
    onChange: (ids: string[]) => void;
}

export const MemberSelector: React.FC<MemberSelectorProps> = ({ users, selectedIds = [], onChange }) => {
    const toggle = (uid: string) => {
        const newSelection = selectedIds.includes(uid) ? selectedIds.filter(id => id !== uid) : [...selectedIds, uid];
        onChange(newSelection);
    };

    return (
        <div className="border border-gray-200 dark:border-gray-600 rounded-xl p-3">
            <div className="text-xs font-bold text-gray-400 mb-2 uppercase">選擇群組成員</div>
            <div className="grid grid-cols-2 gap-2 h-32 overflow-y-auto custom-scrollbar">
                {users.filter(u => u.role !== 'admin').map(user => {
                    const isSelected = selectedIds.includes(user.id);
                    return (
                        <div key={user.id} onClick={() => toggle(user.id)} className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer text-sm border ${isSelected ? 'bg-green-50 border-green-200 text-green-700' : 'bg-white dark:bg-gray-700 border-gray-200 dark:text-gray-300'}`}>
                            <div className={`w-4 h-4 rounded border flex items-center justify-center ${isSelected ? 'bg-green-500 border-green-500' : 'bg-white border-gray-300'}`}>{isSelected && <Check size={10} className="text-white" />}</div>
                            <span>{user.username}</span>
                        </div>
                    )
                })}
            </div>
        </div>
    );
};