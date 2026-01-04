'use client';
import { signInAnonymously } from 'firebase/auth';
import { addDoc, collection, deleteDoc, doc, getDocs, onSnapshot, orderBy, query, serverTimestamp, updateDoc, where } from 'firebase/firestore';
import { AlertCircle, CheckCircle, ChevronDown, ChevronRight, Code, Globe, Grid, Key, Layout, Leaf, LogOut, Save, User as UserIcon, Users } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

// Imports
import AdminSpreadsheet from '@/components/Shared/AdminSpreadsheet';
import LayoutWrapper from '@/components/Shared/LayoutWrapper';
import { appId, auth, db } from '@/lib/firebase';
// 假設你已經建立了以下組件，若無請將原程式碼貼回或建立對應檔案
import LoginScreen from '@/components/Shared/LoginScreen';
import Modal from '@/components/Shared/Modal';
import ToolRenderer from '@/components/Shared/ToolRenderer';
import { Category, Group, Role, Tool, User } from '@/types';
import { MemberSelector, PermissionSelector } from './Shared/Selectors';

type ActiveTab = 'dashboard' | 'admin-cats' | 'admin-tools' | 'admin-groups' | 'admin-users';

// Nav Button Component
const NavButton = ({ active, onClick, icon: Icon, label }: any) => (
    <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all font-bold text-left ${active ? 'bg-[#68c9bc] text-white shadow-md transform scale-105' : 'hover:bg-white dark:hover:bg-gray-700 text-[#7f7a6d] dark:text-gray-400'}`}>
        <Icon size={20} className="shrink-0" /><span>{label}</span>
    </button>
);

export default function MainApp() {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
    const [darkMode, setDarkMode] = useState(false);
    const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
    const [loading, setLoading] = useState(true);

    // Data
    const [categories, setCategories] = useState<Category[]>([]);
    const [tools, setTools] = useState<Tool[]>([]);
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [allGroups, setAllGroups] = useState<Group[]>([]);
    const [expandedCats, setExpandedCats] = useState<string[]>([]);

    // Editing State
    const [isCatModalOpen, setIsCatModalOpen] = useState(false);
    const [isToolModalOpen, setIsToolModalOpen] = useState(false);
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);
    // Password Change State
    const [isPwdModalOpen, setIsPwdModalOpen] = useState(false);
    const [pwdForm, setPwdForm] = useState({ old: '', new: '', confirm: '' });
    // Alert Dialog State
    const [alertState, setAlertState] = useState<{ isOpen: boolean; title: string; message: string; type: 'success' | 'error' | 'confirm'; onConfirm?: () => void }>({ isOpen: false, title: '', message: '', type: 'success' });

    // Forms
    const [catForm, setCatForm] = useState<Partial<Category>>({ name: '', description: '', allowedUsers: ['PUBLIC'], allowedGroups: [] });
    const [toolForm, setToolForm] = useState<Partial<Tool>>({ name: '', categoryId: '', type: 'code', code: '', url: '', allowedUsers: ['PUBLIC'], allowedGroups: [] });
    const [userForm, setUserForm] = useState<Partial<User>>({ username: '', password: '', role: 'user' });
    const [groupForm, setGroupForm] = useState<Partial<Group>>({ name: '', memberIds: [] });

    const currentUserGroupIds = useMemo(() => {
        if (!currentUser || !allGroups) return [];
        return allGroups.filter(g => g.memberIds?.includes(currentUser.id)).map(g => g.id);
    }, [currentUser, allGroups]);

    // Init
    useEffect(() => {
        const init = async () => {
            try {
                await signInAnonymously(auth);
                const usersRef = collection(db, 'artifacts', appId, 'public', 'data', 'users');
                const snap = await getDocs(usersRef);
                if (snap.empty) await addDoc(usersRef, { username: 'admin', password: 'admin', role: 'admin', createdAt: serverTimestamp() });
            } catch (e) { console.error(e); }
            setLoading(false);
        };
        init();
    }, []);

    // init dark mode
    useEffect(() => {
        const savedTheme = localStorage.getItem('nook-theme');
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

        if (savedTheme === 'dark') {
            setDarkMode(true);
        } else if (savedTheme === 'light') {
            setDarkMode(false);
        } else if (systemPrefersDark) {
            setDarkMode(true);
        }
    }, []);

    // Listeners
    useEffect(() => {
        if (!currentUser) return;
        const sub = (c: string, set: any, o: string) => onSnapshot(query(collection(db, 'artifacts', appId, 'public', 'data', c), orderBy(o, o === 'createdAt' ? 'desc' : 'asc')), s => set(s.docs.map(d => ({ id: d.id, ...d.data() }))));
        const unsubCat = onSnapshot(query(collection(db, 'artifacts', appId, 'public', 'data', 'categories'), orderBy('createdAt', 'desc')), s => {
            const d = s.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
            setCategories(d);
            if (d.length > 0 && expandedCats.length === 0) setExpandedCats([d[0].id]);
        });
        const u1 = sub('tools', setTools, 'createdAt');
        const u2 = sub('users', setAllUsers, 'username');
        const u3 = sub('groups', setAllGroups, 'name');
        return () => { unsubCat(); u1(); u2(); u3(); };
    }, [currentUser]);

    const handleLogin = async (u: string, p: string, err: any) => {
        setLoading(true);
        const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'users'), where('username', '==', u), where('password', '==', p));
        const snap = await getDocs(q);
        if (!snap.empty) { setCurrentUser({ id: snap.docs[0].id, ...snap.docs[0].data() } as User); setActiveTab('dashboard'); }
        else { err("帳號或密碼錯誤"); }
        setLoading(false);
    };

    const handleSave = async (colName: string, data: any, setModal: any, reset: any) => {
        const colRef = collection(db, 'artifacts', appId, 'public', 'data', colName);
        if (editingItem) await updateDoc(doc(colRef, editingItem.id), data);
        else await addDoc(colRef, { ...data, createdAt: serverTimestamp() });
        setModal(false); setEditingItem(null); reset();
    };

    const handleDelete = (colName: string, id: string) => {
        setAlertState({
            isOpen: true,
            title: '確認刪除',
            message: '確定要刪除此項目嗎？此動作無法復原。',
            type: 'confirm',
            onConfirm: async () => {
                await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', colName, id));
                setAlertState(prev => ({ ...prev, isOpen: false }));
            }
        });
    };

    const canSee = (item: any) => {
        if (currentUser?.role === 'admin') return true;
        const u = item.allowedUsers || ['PUBLIC'];
        if (u.includes('PUBLIC') || u.includes(currentUser?.id)) return true;
        return item.allowedGroups?.some((gid: string) => currentUserGroupIds.includes(gid));
    };

    const toggleDarkMode = () => {
        const newMode = !darkMode;
        setDarkMode(newMode);
        localStorage.setItem('nook-theme', newMode ? 'dark' : 'light');
    };

    const handleChangePassword = async () => {
        try {
            if (!currentUser) return;
            if (pwdForm.old !== currentUser.password) return setAlertState({ isOpen: true, title: '驗證錯誤', message: '舊密碼不正確', type: 'error' });
            if (pwdForm.new !== pwdForm.confirm) return setAlertState({ isOpen: true, title: '驗證錯誤', message: '新密碼與確認密碼不符', type: 'error' });
            if (!pwdForm.new) return setAlertState({ isOpen: true, title: '驗證錯誤', message: '密碼不能為空', type: 'error' });
            setLoading(true);
            await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'users', currentUser.id), { password: pwdForm.new });
            setCurrentUser({ ...currentUser, password: pwdForm.new });
            setAlertState({ isOpen: true, title: '修改成功', message: '密碼修改成功', type: 'success' });
        } catch (e) {
            console.error(e); setAlertState({ isOpen: true, title: '系統錯誤', message: '修改失敗', type: 'error' });
        } finally {
            setPwdForm({ old: '', new: '', confirm: '' });
            setIsPwdModalOpen(false);
            setLoading(false);
        }
    };

    const handleToolClick = (tool: Tool) => {
        if (tool.type === 'url_new_tab') {
            if (tool.url) {
                window.open(tool.url, '_blank', 'noopener,noreferrer');
            }
        } else {
            setSelectedTool(tool);
        }
    };

    if (!currentUser) return <LayoutWrapper darkMode={darkMode} toggleDarkMode={toggleDarkMode}><LoginScreen onLogin={handleLogin} loading={loading} /></LayoutWrapper>;
    if (selectedTool) return <LayoutWrapper darkMode={darkMode} toggleDarkMode={toggleDarkMode}><ToolRenderer tool={selectedTool} onBack={() => setSelectedTool(null)} /></LayoutWrapper>;

    return (
        <LayoutWrapper darkMode={darkMode} toggleDarkMode={toggleDarkMode}>
            {/* Sidebar */}
            <div className="hidden md:flex w-64 flex-col p-4 gap-4 border-r border-[#e0ddc8] dark:border-gray-700 bg-[#f9faef]/80 dark:bg-[#1a202c]/80 backdrop-blur-md">
                <div className="flex items-center gap-3 px-2 mb-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xl ${currentUser.role === 'admin' ? 'bg-[#e8b15d]' : 'bg-[#68c9bc]'}`}>{currentUser.role === 'admin' ? '管理' : '用戶'}</div>
                    <div><div className="font-bold text-[#5e5a52] dark:text-white">{currentUser.username}</div><div className="text-xs text-gray-500 uppercase">{currentUser.role}</div></div>
                </div>
                <nav className="flex-1 space-y-2">
                    <NavButton active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={Grid} label="App 商店" />
                    {currentUser.role === 'admin' && <>
                        <div className="text-xs font-bold text-gray-400 mt-6 mb-2 px-4 uppercase">後台管理</div>
                        <NavButton active={activeTab === 'admin-cats'} onClick={() => setActiveTab('admin-cats')} icon={Layout} label="類別管理" />
                        <NavButton active={activeTab === 'admin-tools'} onClick={() => setActiveTab('admin-tools')} icon={Code} label="工具上架" />
                        <NavButton active={activeTab === 'admin-groups'} onClick={() => setActiveTab('admin-groups')} icon={Users} label="群組管理" />
                        <NavButton active={activeTab === 'admin-users'} onClick={() => setActiveTab('admin-users')} icon={UserIcon} label="人員名冊" />
                    </>}
                </nav>
                <button onClick={() => setIsPwdModalOpen(true)} className="mt-auto flex items-center gap-3 p-3 rounded-2xl hover:bg-white dark:hover:bg-gray-700 text-[#7f7a6d] dark:text-gray-400 font-bold"><Key size={20} /> 變更密碼</button>
                <button onClick={() => setCurrentUser(null)} className="flex items-center gap-3 p-3 rounded-2xl hover:bg-red-100 text-red-500 font-bold"><LogOut size={20} /> 登出</button>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col h-full overflow-hidden p-4 md:p-8">
                <h1 className="text-2xl md:text-3xl font-bold mb-6 text-[#5e5a52] dark:text-white">
                    {activeTab === 'dashboard' ? 'Nook App Store' : '管理後台'}
                </h1>

                {activeTab === 'dashboard' && (
                    <div className="space-y-4 overflow-y-auto custom-scrollbar pb-20">
                        {categories.filter(canSee).map(cat => {
                            const visibleTools = tools.filter(t => t.categoryId === cat.id && canSee(t));
                            if (!visibleTools.length && currentUser.role !== 'admin') return null;
                            const isExp = expandedCats.includes(cat.id);
                            return (
                                <div key={cat.id} className="bg-white/60 dark:bg-[#2d3748]/60 rounded-3xl shadow-sm">
                                    <div onClick={() => setExpandedCats(p => p.includes(cat.id) ? p.filter(i => i !== cat.id) : [...p, cat.id])} className="p-4 flex justify-between items-center cursor-pointer">
                                        <div className="flex items-center gap-3"><Leaf size={18} className="text-[#68c9bc]" /> <span className="font-bold text-lg dark:text-white">{cat.name}</span></div>
                                        <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full">{isExp ? <ChevronDown size={20} /> : <ChevronRight size={20} />}</div>
                                    </div>
                                    {isExp && (
                                        <div className="p-4 pt-0 grid grid-cols-2 md:grid-cols-4 gap-4">
                                            {visibleTools.map(t => (
                                                <div key={t.id} onClick={() => handleToolClick(t)} className="bg-white dark:bg-[#1a202c] p-4 rounded-xl shadow cursor-pointer hover:scale-105 transition flex flex-col items-center">
                                                    <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center mb-2">
                                                        {t.type === 'url' || t.type === 'url_new_tab'
                                                            ? <Globe className="text-[#68c9bc]" />
                                                            : <Code className="text-[#68c9bc]" />}
                                                    </div>
                                                    <span className="font-bold text-sm dark:text-gray-200">{t.name}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                )}

                {/* Admin Views */}
                {activeTab === 'admin-users' && (
                    <AdminSpreadsheet<User> title="人員帳號" icon={UserIcon} data={allUsers}
                        onAdd={() => { setEditingItem(null); setUserForm({ username: '', password: '', role: 'user' }); setIsUserModalOpen(true); }}
                        onEdit={i => { setEditingItem(i); setUserForm(i); setIsUserModalOpen(true); }}
                        onDelete={id => handleDelete('users', id)}
                        columns={[{ label: '帳號', key: 'username' }, { label: '密碼', key: 'password' }, { label: '角色', key: 'role' }]}
                    />
                )}

                {/* Admin: Categories */}
                {activeTab === 'admin-cats' && (
                    <div className="h-full">
                        <AdminSpreadsheet<Category>
                            title="類別資料庫"
                            icon={Layout}
                            data={categories}
                            onAdd={() => { setEditingItem(null); setCatForm({ name: '', description: '', allowedUsers: ['PUBLIC'], allowedGroups: [] }); setIsCatModalOpen(true); }}
                            onEdit={(item) => { setEditingItem(item); setCatForm(item); setIsCatModalOpen(true); }}
                            onDelete={(id) => handleDelete('categories', id)}
                            columns={[
                                { label: '類別名稱', key: 'name' },
                                { label: '描述', key: 'description' },
                                {
                                    label: '權限',
                                    key: 'allowedUsers',
                                    render: (u, item) => u?.includes('PUBLIC') ?
                                        <span className="text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded">公開</span> :
                                        <div className="flex flex-col text-xs text-gray-500">
                                            <span>{item.allowedGroups?.length || 0} 群組</span>
                                            <span>{u?.length || 0} 個人</span>
                                        </div>
                                },
                            ]}
                        />
                    </div>
                )}

                {/* Admin: Tools */}
                {activeTab === 'admin-tools' && (
                    <div className="h-full">
                        <AdminSpreadsheet<Tool>
                            title="程式碼倉庫"
                            icon={Code}
                            data={tools}
                            // 重置 Form 時記得把 type 設回 code
                            onAdd={() => {
                                setEditingItem(null);
                                setToolForm({ name: '', categoryId: categories[0]?.id || '', type: 'code', code: '', url: '', allowedUsers: ['PUBLIC'], allowedGroups: [] });
                                setIsToolModalOpen(true);
                            }}
                            onEdit={(item) => { setEditingItem(item); setToolForm(item); setIsToolModalOpen(true); }}
                            onDelete={(id) => handleDelete('tools', id)}
                            columns={[
                                { label: '工具名稱', key: 'name' },
                                {
                                    label: '類型',
                                    key: 'type',
                                    render: (t) => {
                                        switch (t) {
                                            case 'url':
                                                return <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-bold flex w-fit items-center gap-1"><Globe size={12} /> 網頁鑲嵌</span>;
                                            case 'url_new_tab':
                                                return <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-xs font-bold flex w-fit items-center gap-1"><Globe size={12} /> 新分頁開啟</span>;
                                            default:
                                                return <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs font-bold flex w-fit items-center gap-1"><Code size={12} /> 自訂代碼</span>;
                                        }
                                    }
                                },
                                { label: '分類', key: 'categoryId', render: (id) => categories.find(c => c.id === id)?.name || <span className="text-red-400">未分類</span> },
                                // ... (權限欄位保持不變)
                                {
                                    label: '權限',
                                    key: 'allowedUsers',
                                    render: (u, item) => u?.includes('PUBLIC') ?
                                        <span className="text-green-600 font-bold">公開</span> :
                                        <div className="flex gap-1 text-xs">
                                            <span className="bg-purple-100 text-purple-700 px-1 rounded">{item.allowedGroups?.length || 0} 群組</span>
                                            <span className="bg-blue-100 text-blue-700 px-1 rounded">{u?.length || 0} 人</span>
                                        </div>
                                },
                            ]}
                        />
                    </div>
                )}

                {/* Admin: Groups */}
                {activeTab === 'admin-groups' && (
                    <div className="h-full">
                        <AdminSpreadsheet<Group>
                            title="群組管理"
                            icon={Users}
                            data={allGroups}
                            onAdd={() => { setEditingItem(null); setGroupForm({ name: '', memberIds: [] }); setIsGroupModalOpen(true); }}
                            onEdit={(item) => { setEditingItem(item); setGroupForm(item); setIsGroupModalOpen(true); }}
                            onDelete={(id) => handleDelete('groups', id)}
                            columns={[
                                { label: '群組名稱', key: 'name' },
                                { label: '人數', key: 'memberIds', render: (ids) => <span className="font-bold text-purple-600">{ids?.length || 0} 人</span> },
                                {
                                    label: '成員預覽',
                                    key: 'memberIds',
                                    render: (ids) => {
                                        const names = ids?.map((uid: string) => allUsers.find(u => u.id === uid)?.username).filter(Boolean).join(', ');
                                        return <span className="text-xs text-gray-400 truncate max-w-[200px] inline-block">{names}</span>
                                    }
                                },
                            ]}
                        />
                    </div>
                )}
            </div>

            {/* Modals - Example User Modal */}
            <Modal isOpen={isUserModalOpen} onClose={() => setIsUserModalOpen(false)} title={editingItem ? "編輯" : "新增"}>
                <div className="space-y-4">
                    <div><label className="text-sm font-bold">帳號</label><input value={userForm.username} onChange={e => setUserForm({ ...userForm, username: e.target.value })} className="input-field" /></div>
                    <div><label className="text-sm font-bold">密碼</label><input value={userForm.password} onChange={e => setUserForm({ ...userForm, password: e.target.value })} className="input-field" /></div>
                    <div><label className="text-sm font-bold">角色</label><select value={userForm.role} onChange={e => setUserForm({ ...userForm, role: e.target.value as Role })} className="input-field"><option value="user">User</option><option value="admin">Admin</option></select></div>
                    <button onClick={() => handleSave('users', userForm, setIsUserModalOpen, () => { })} className="action-btn">儲存</button>
                </div>
            </Modal>

            {/* Alert Dialog */}
            <Modal isOpen={alertState.isOpen} onClose={() => setAlertState(prev => ({ ...prev, isOpen: false }))} title={alertState.title}>
                <div className="flex flex-col items-center gap-4 p-4">
                    {alertState.type === 'error' && <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center"><AlertCircle size={32} /></div>}
                    {alertState.type === 'success' && <div className="w-16 h-16 bg-green-100 text-green-500 rounded-full flex items-center justify-center"><CheckCircle size={32} /></div>}
                    {alertState.type === 'confirm' && <div className="w-16 h-16 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center"><AlertCircle size={32} /></div>}

                    <p className="text-center text-gray-600 dark:text-gray-300 font-medium">{alertState.message}</p>

                    <div className="flex gap-3 mt-2 w-full justify-center">
                        {alertState.type === 'confirm' ? (
                            <>
                                <button onClick={() => setAlertState(prev => ({ ...prev, isOpen: false }))} className="px-5 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold transition">取消</button>
                                <button onClick={() => alertState.onConfirm && alertState.onConfirm()} className="px-5 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold transition shadow-lg shadow-red-200">確認刪除</button>
                            </>
                        ) : (
                            <button onClick={() => setAlertState(prev => ({ ...prev, isOpen: false }))} className="px-8 py-2.5 rounded-xl bg-[#68c9bc] hover:bg-[#5ab8ac] text-white font-bold transition shadow-lg shadow-teal-100">確定</button>
                        )}
                    </div>
                </div>
            </Modal>

            {/* Modal: Change Password */}
            <Modal isOpen={isPwdModalOpen} onClose={() => setIsPwdModalOpen(false)} title="變更密碼">
                <div className="space-y-4">
                    <div><label className="text-sm font-bold block mb-1">舊密碼</label><input type="password" value={pwdForm.old} onChange={e => setPwdForm({ ...pwdForm, old: e.target.value })} className="input-field" /></div>
                    <div><label className="text-sm font-bold block mb-1">新密碼</label><input type="password" value={pwdForm.new} onChange={e => setPwdForm({ ...pwdForm, new: e.target.value })} className="input-field" /></div>
                    <div><label className="text-sm font-bold block mb-1">確認新密碼</label><input type="password" value={pwdForm.confirm} onChange={e => setPwdForm({ ...pwdForm, confirm: e.target.value })} className="input-field" /></div>
                    <button onClick={handleChangePassword} className="action-btn"><Save className="inline mr-2" size={18} /> 確認修改</button>
                </div>
            </Modal>

            {/* Modal: Category */}
            <Modal isOpen={isCatModalOpen} onClose={() => setIsCatModalOpen(false)} title={editingItem ? "編輯類別" : "新增類別"}>
                <div className="space-y-4">
                    <div><label className="text-sm font-bold block mb-1">類別名稱</label><input value={catForm.name} onChange={e => setCatForm({ ...catForm, name: e.target.value })} className="input-field" /></div>
                    <div><label className="text-sm font-bold block mb-1">描述</label><textarea value={catForm.description} onChange={e => setCatForm({ ...catForm, description: e.target.value })} className="input-field h-24" /></div>
                    <PermissionSelector
                        users={allUsers} groups={allGroups}
                        selectedUsers={catForm.allowedUsers || []} selectedGroups={catForm.allowedGroups || []}
                        onUserChange={ids => setCatForm(prev => ({ ...prev, allowedUsers: ids }))}
                        onGroupChange={ids => setCatForm(prev => ({ ...prev, allowedGroups: ids }))}
                    />
                    <button onClick={() => handleSave('categories', catForm, setIsCatModalOpen, () => setCatForm({ name: '', description: '', allowedUsers: ['PUBLIC'], allowedGroups: [] }))} className="action-btn"><Save className="inline mr-2" size={18} /> 儲存</button>
                </div>
            </Modal>

            {/* Modal: Tool */}
            <Modal isOpen={isToolModalOpen} onClose={() => setIsToolModalOpen(false)} title={editingItem ? "編輯工具" : "上架工具"}>
                <div className="space-y-4">
                    {/* 工具名稱 */}
                    <div>
                        <label className="text-sm font-bold block mb-1">工具名稱</label>
                        <input value={toolForm.name} onChange={e => setToolForm({ ...toolForm, name: e.target.value })} className="input-field" placeholder="例如：匯率計算機" />
                    </div>

                    {/* 分類選擇 */}
                    <div>
                        <label className="text-sm font-bold block mb-1">分類</label>
                        <select value={toolForm.categoryId} onChange={e => setToolForm({ ...toolForm, categoryId: e.target.value })} className="input-field">
                            <option value="">請選擇分類</option>
                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>

                    {/* 權限設定 */}
                    <PermissionSelector
                        users={allUsers} groups={allGroups}
                        selectedUsers={toolForm.allowedUsers || []} selectedGroups={toolForm.allowedGroups || []}
                        onUserChange={ids => setToolForm(prev => ({ ...prev, allowedUsers: ids }))}
                        onGroupChange={ids => setToolForm(prev => ({ ...prev, allowedGroups: ids }))}
                    />

                    {/* --- 新增：工具類型切換 --- */}
                    <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600">
                        <label className="text-sm font-bold block mb-2 text-gray-500">工具來源類型</label>
                        <div className="flex gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="toolType"
                                    checked={toolForm.type === 'code'}
                                    onChange={() => setToolForm({ ...toolForm, type: 'code' })}
                                    className="w-4 h-4 text-[#68c9bc] focus:ring-[#68c9bc]"
                                />
                                <span className="font-bold flex items-center gap-1"><Code size={16} /> HTML/JS 代碼</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="toolType"
                                    checked={toolForm.type === 'url'}
                                    onChange={() => setToolForm({ ...toolForm, type: 'url' })}
                                    className="w-4 h-4 text-[#68c9bc] focus:ring-[#68c9bc]"
                                />
                                <span className="font-bold flex items-center gap-1"><Globe size={16} /> 網頁鑲嵌</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="toolType"
                                    checked={toolForm.type === 'url_new_tab'}
                                    onChange={() => setToolForm({ ...toolForm, type: 'url_new_tab' })}
                                    className="w-4 h-4 text-[#68c9bc] focus:ring-[#68c9bc]"
                                />
                                <span className="font-bold flex items-center gap-1"><Globe size={16} /> 新分頁</span>
                            </label>
                        </div>
                    </div>

                    {/* 根據類型顯示對應輸入框 */}
                    {toolForm.type === 'url' || toolForm.type === 'url_new_tab' ? (
                        <div className="animate-in fade-in slide-in-from-top-2">
                            <label className="text-sm font-bold block mb-1">目標網址 (URL)</label>
                            <input
                                type="url"
                                value={toolForm.url || ''}
                                onChange={e => setToolForm({ ...toolForm, url: e.target.value })}
                                className="input-field"
                                placeholder="https://example.com/my-tool"
                            />
                            {toolForm.type === 'url' && <p className="text-xs text-gray-400 mt-1">請確保該網站允許被 Iframe 嵌入 (無 X-Frame-Options 限制)。</p>}
                            {toolForm.type === 'url_new_tab' && <p className="text-xs text-gray-400 mt-1">點擊工具將會直接開啟一個新的分頁前往此URL。</p>}
                        </div>
                    ) : (
                        <div className="animate-in fade-in slide-in-from-top-2">
                            <label className="text-sm font-bold block mb-1">程式碼 (HTML/JS)</label>
                            <textarea
                                value={toolForm.code || ''}
                                onChange={e => setToolForm({ ...toolForm, code: e.target.value })}
                                className="input-field h-40 font-mono text-xs"
                                placeholder={'<style>body { color: red; }</style>\n<h1>Hello World</h1>'}
                            />
                        </div>
                    )}

                    <button onClick={() => handleSave('tools', toolForm, setIsToolModalOpen, () => setToolForm({ name: '', categoryId: '', type: 'code', code: '', url: '', allowedUsers: ['PUBLIC'], allowedGroups: [] }))} className="action-btn">
                        <Save className="inline mr-2" size={18} /> {editingItem ? '儲存變更' : '上架工具'}
                    </button>
                </div>
            </Modal>

            {/* Modal: Group */}
            <Modal isOpen={isGroupModalOpen} onClose={() => setIsGroupModalOpen(false)} title={editingItem ? "編輯群組" : "新增群組"}>
                <div className="space-y-4">
                    <div><label className="text-sm font-bold block mb-1">群組名稱</label><input value={groupForm.name} onChange={e => setGroupForm({ ...groupForm, name: e.target.value })} className="input-field" placeholder="例如：行銷部" /></div>
                    <MemberSelector users={allUsers} selectedIds={groupForm.memberIds || []} onChange={ids => setGroupForm({ ...groupForm, memberIds: ids })} />
                    <button onClick={() => handleSave('groups', groupForm, setIsGroupModalOpen, () => setGroupForm({ name: '', memberIds: [] }))} className="action-btn"><Save className="inline mr-2" size={18} /> 儲存</button>
                </div>
            </Modal>

        </LayoutWrapper>
    );
}