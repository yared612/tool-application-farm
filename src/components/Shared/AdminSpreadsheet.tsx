'use client';
import { BaseEntity, Column } from '@/types';
import { ArrowDown, ArrowUp, Edit, Filter, Plus, Trash2 } from 'lucide-react';
import React, { useMemo, useState } from 'react';

interface Props<T extends BaseEntity> {
    data: T[]; columns: Column<T>[]; onEdit: (item: T) => void; onDelete: (id: string) => void; onAdd: () => void; title: string; icon: React.ElementType;
}

const AdminSpreadsheet = <T extends BaseEntity>({ data, columns, onEdit, onDelete, onAdd, title, icon: Icon }: Props<T>) => {
    const [activeFilterCol, setActiveFilterCol] = useState<string | null>(null);
    const [filters, setFilters] = useState<Record<string, string[]>>({});
    const [sortConfig, setSortConfig] = useState<{ label: string; direction: 'ascending' | 'descending' } | null>(null);

    const getVal = (item: T, col: Column<T>): string | string[] => {
        if (col.getValue) {
            return col.getValue(item[col.key], item);
        }
        // This fallback is problematic for arrays, but getValue should be provided for them.
        return String(item[col.key]);
    };

    const getUnique = (label: string) => {
        const col = columns.find(c => c.label === label)!;
        const allValues = data.map(i => getVal(i, col));

        if (col.filterType === 'any') {
            const flatValues = (allValues as string[][]).flat();
            return Array.from(new Set(flatValues)).sort((a, b) => a.localeCompare(b, 'zh-TW'));
        }

        return Array.from(new Set(allValues as string[])).sort((a, b) => a.localeCompare(b, 'zh-TW'));
    }

    const filteredData = useMemo(() => data.filter(item => Object.entries(filters).every(([label, values]) => {
        if (!values?.length) return true;
        const col = columns.find(c => c.label === label)!;
        const itemValue = getVal(item, col);

        if (col.filterType === 'any' && Array.isArray(itemValue)) {
            return values.every(v => itemValue.includes(v));
        }

        return values.includes(itemValue as string);
    })), [data, filters, columns]);

    const sortedData = useMemo(() => {
        let sortableItems = [...filteredData];
        if (sortConfig !== null) {
            const sortColumn = columns.find(c => c.label === sortConfig.label);
            if (sortColumn) {
                sortableItems.sort((a, b) => {
                    const valA = getVal(a, sortColumn);
                    const valB = getVal(b, sortColumn);
                    const comparison = valA.localeCompare(valB, 'zh-TW', { numeric: true });
                    return sortConfig.direction === 'ascending' ? comparison : -comparison;
                });
            }
        }
        return sortableItems;
    }, [filteredData, sortConfig, columns]);

    const requestSort = (label: string) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig && sortConfig.label === label && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ label, direction });
    };

    const toggleFilter = (label: string, val: string) => {
        setFilters(p => ({ ...p, [label]: p[label]?.includes(val) ? p[label].filter(v => v !== val) : [...(p[label] || []), val] }));
    };

    return (
        <div className="bg-white dark:bg-[#2d3748] rounded-3xl shadow-lg border-2 md:border-4 border-[#e0ddc8] dark:border-gray-600 overflow-hidden flex flex-col h-full">
            <div className="bg-[#68c9bc] p-3 flex justify-between items-center shrink-0">
                <h3 className="text-white font-bold flex items-center gap-2"><Icon size={20} /> {title} <span className="text-xs bg-white/20 px-2 rounded-full">{sortedData.length}</span></h3>
                <button onClick={onAdd} className="bg-[#e8b15d] text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"><Plus size={16} /> 新增</button>
            </div>
            <div className="flex-1 overflow-auto p-0">
                <table className="min-w-full text-sm text-left">
                    <thead className="bg-[#f2f4e6] dark:bg-[#1a202c] sticky top-0 z-10">
                        <tr>
                            {columns.map((col, idx) => (
                                <th key={idx} className="p-3 font-bold text-[#7f7a6d] dark:text-gray-300 border-b-2 border-[#e0ddc8] relative">
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => setActiveFilterCol(activeFilterCol === col.label ? null : col.label)}><Filter size={14} /></button>
                                        <div className="flex items-center gap-1 cursor-pointer" onClick={() => requestSort(col.label)}>
                                            {col.label}
                                            {sortConfig?.label === col.label && (
                                                sortConfig.direction === 'ascending' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                                            )}
                                        </div>
                                    </div>
                                    {activeFilterCol === col.label && (
                                        <div className="absolute top-full left-0 mt-1 w-48 bg-white dark:bg-[#374151] shadow-xl border z-50 p-2 max-h-48 overflow-y-auto">
                                            <button onClick={() => setFilters(p => { const { [col.label]: _, ...r } = p; return r; })} className="text-xs text-red-500 mb-2 block">清除篩選</button>
                                            {getUnique(col.label).map(v => (
                                                <label key={v} className="flex items-center gap-2 p-1 hover:bg-gray-50 cursor-pointer">
                                                    <input type="checkbox" checked={filters[col.label]?.includes(v) ?? false} onChange={() => toggleFilter(col.label, v)} />
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
                        {sortedData.map(item => (
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