'use client';
import { BaseEntity, Column } from '@/types';
import { Edit, Filter, Plus, Trash2 } from 'lucide-react';
import React, { useMemo, useState } from 'react';

interface Props<T extends BaseEntity> {
    data: T[]; columns: Column<T>[]; onEdit: (item: T) => void; onDelete: (id: string) => void; onAdd: () => void; title: string; icon: React.ElementType;
}

const AdminSpreadsheet = <T extends BaseEntity>({ data, columns, onEdit, onDelete, onAdd, title, icon: Icon }: Props<T>) => {
    const [activeFilterCol, setActiveFilterCol] = useState<keyof T | null>(null);
    const [filters, setFilters] = useState<Record<string, string[]>>({});

    const getVal = (item: T, col: Column<T>) => String(item[col.key]);
    const getUnique = (key: keyof T) => Array.from(new Set(data.map(i => getVal(i, columns.find(c => c.key === key)!)))).sort();

    const filteredData = useMemo(() => data.filter(item => Object.keys(filters).every(k => {
        if (!filters[k]?.length) return true;
        return filters[k].includes(getVal(item, columns.find(c => c.key === k as keyof T)!));
    })), [data, filters, columns]);

    const toggleFilter = (key: string, val: string) => {
        setFilters(p => ({ ...p, [key]: p[key]?.includes(val) ? p[key].filter(v => v !== val) : [...(p[key] || []), val] }));
    };

    return (
        <div className="bg-white dark:bg-[#2d3748] rounded-3xl shadow-lg border-2 md:border-4 border-[#e0ddc8] dark:border-gray-600 overflow-hidden flex flex-col h-full">
            <div className="bg-[#68c9bc] p-3 flex justify-between items-center shrink-0">
                <h3 className="text-white font-bold flex items-center gap-2"><Icon size={20} /> {title} <span className="text-xs bg-white/20 px-2 rounded-full">{filteredData.length}</span></h3>
                <button onClick={onAdd} className="bg-[#e8b15d] text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"><Plus size={16} /> 新增</button>
            </div>
            <div className="flex-1 overflow-auto p-0">
                <table className="min-w-full text-sm text-left">
                    <thead className="bg-[#f2f4e6] dark:bg-[#1a202c] sticky top-0 z-10">
                        <tr>
                            {columns.map((col, idx) => (
                                <th key={idx} className="p-3 font-bold text-[#7f7a6d] dark:text-gray-300 border-b-2 border-[#e0ddc8] relative">
                                    <div className="flex justify-between items-center">{col.label}
                                        <button onClick={() => setActiveFilterCol(activeFilterCol === col.key ? null : col.key)}><Filter size={14} /></button>
                                    </div>
                                    {activeFilterCol === col.key && (
                                        <div className="absolute top-full left-0 mt-1 w-48 bg-white dark:bg-[#374151] shadow-xl border z-50 p-2 max-h-48 overflow-y-auto">
                                            <button onClick={() => setFilters(p => { const { [String(col.key)]: _, ...r } = p; return r; })} className="text-xs text-red-500 mb-2 block">清除篩選</button>
                                            {getUnique(col.key).map(v => (
                                                <label key={v} className="flex items-center gap-2 p-1 hover:bg-gray-50 cursor-pointer">
                                                    <input type="checkbox" checked={filters[String(col.key)]?.includes(v) ?? false} onChange={() => toggleFilter(String(col.key), v)} />
                                                    <span className="truncate">{v}</span>
                                                </label>
                                            ))}
                                        </div>
                                    )}
                                </th>
                            ))}
                            <th className="p-3 border-b-2 border-[#e0ddc8] w-24 text-center sticky right-0 bg-[#f2f4e6] dark:bg-[#1a202c]">操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredData.map(item => (
                            <tr key={item.id} className="border-b border-[#f0f0f0] dark:border-gray-700 hover:bg-[#fcfdf9] dark:hover:bg-[#3d4a61] group">
                                {columns.map((col, idx) => <td key={idx} className="p-3 max-w-[200px] truncate">{col.render ? col.render(item[col.key], item) : String(item[col.key])}</td>)}
                                <td className="p-2 flex gap-1 justify-center sticky right-0 bg-white dark:bg-[#2d3748] group-hover:bg-[#fcfdf9]">
                                    <button onClick={() => onEdit(item)} className="p-1.5 bg-blue-100 text-blue-600 rounded-lg"><Edit size={14} /></button>
                                    <button onClick={() => onDelete(item.id)} className="p-1.5 bg-red-100 text-red-600 rounded-lg"><Trash2 size={14} /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
export default AdminSpreadsheet;