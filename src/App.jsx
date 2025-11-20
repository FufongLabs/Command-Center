import React, { useState, useEffect } from 'react';
import { db, auth } from './firebaseConfig'; 
import { 
  collection, addDoc, onSnapshot, updateDoc, deleteDoc, doc, 
  query, orderBy, writeBatch, setDoc, getDoc, serverTimestamp 
} from 'firebase/firestore';
import { 
  onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, updateProfile 
} from 'firebase/auth';

import { 
  LayoutDashboard, Megaphone, Map, Zap, Database, Users, Menu, X, Activity, 
  Calendar, CheckCircle2, Circle, Clock, ExternalLink, Eye, FileText, Share2, Plus, 
  Minus, Link as LinkIcon, Trash2, Edit2, ChevronDown, ChevronUp, Filter, RefreshCw, Save, Phone, LogOut, User, Lock, Camera, Mail, AlertTriangle, Smartphone, MessageCircle, Globe, Loader2, CheckSquare, Tag
} from 'lucide-react';

// --- PREDEFINED DATA (FIXED MISSING SOP) ---
const PRESET_TAGS = [
  "Visual Storytelling", "Viral", "Tradition", "Knowledge", "Urgent", "Report", "System", "Event", "Crisis"
];

const DEFAULT_SOP = [
  { text: "1. ทีม Monitor สรุปประเด็น (ใคร? ทำอะไร? กระทบเรายังไง?)", done: false },
  { text: "2. ร่าง Message สั้นๆ (เน้น Fact + จุดยืน)", done: false },
  { text: "3. ขอ Approved ด่วน (Line/โทร)", done: false },
  { text: "4. ผลิตสื่อด่วน (Graphic Quote หรือ คลิปสัมภาษณ์สั้น)", done: false },
  { text: "5. กระจายลง Social Media & ส่งกลุ่มนักข่าว", done: false }
];

const SOP_GUIDE = [
  "1. ทีม Monitor สรุปประเด็น (ใคร? ทำอะไร? กระทบเรายังไง?)",
  "2. ร่าง Message สั้นๆ (เน้น Fact + จุดยืน)",
  "3. ขอ Approved ด่วน (Line/โทร)",
  "4. ผลิตสื่อด่วน (Graphic Quote หรือ คลิปสัมภาษณ์สั้น)",
  "5. กระจายลง Social Media & ส่งกลุ่มนักข่าว"
];

// --- COMPONENTS ---

const LoadingOverlay = ({ isOpen, message = "กำลังบันทึกข้อมูล..." }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center z-[100] animate-fadeIn">
      <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-3" />
      <p className="text-slate-600 font-bold animate-pulse">{message}</p>
    </div>
  );
};

const FormModal = ({ isOpen, onClose, title, fields, onSave, submitText = "บันทึก" }) => {
  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (isOpen) {
      const initialData = {};
      fields.forEach(f => initialData[f.key] = f.defaultValue || '');
      setFormData(initialData);
    }
  }, [isOpen, fields]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 transform transition-all scale-100">
        <div className="flex justify-between items-center mb-6">
           <h3 className="text-xl font-bold text-slate-800">{title}</h3>
           <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-full"><X className="w-6 h-6 text-slate-400" /></button>
        </div>
        <div className="space-y-4">
           {fields.map((field) => (
             <div key={field.key}>
                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase flex items-center gap-2">
                    {field.label}
                    {field.key === 'tag' && <Tag className="w-3 h-3 text-blue-500" />}
                </label>
                {field.type === 'select' ? (
                   <select 
                      value={formData[field.key]} 
                      onChange={(e) => setFormData({...formData, [field.key]: e.target.value})}
                      className="w-full border-2 border-slate-200 rounded-lg p-2.5 text-sm bg-white focus:border-blue-500 outline-none"
                   >
                      {field.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                   </select>
                ) : field.type === 'datalist' ? (
                    <div className="relative">
                      <input 
                        list={`list-${field.key}`}
                        value={formData[field.key]}
                        onChange={(e) => setFormData({...formData, [field.key]: e.target.value})}
                        className="w-full border-2 border-slate-200 rounded-lg p-2.5 text-sm focus:border-blue-500 outline-none pl-9"
                        placeholder={field.placeholder || ''}
                      />
                      <Tag className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <datalist id={`list-${field.key}`}>
                        {field.options.map(opt => <option key={opt} value={opt} />)}
                      </datalist>
                    </div>
                ) : (
                   <input 
                      type={field.type || 'text'}
                      value={formData[field.key]}
                      onChange={(e) => setFormData({...formData, [field.key]: e.target.value})}
                      className="w-full border-2 border-slate-200 rounded-lg p-2.5 text-sm focus:border-blue-500 outline-none"
                      placeholder={field.placeholder || ''}
                   />
                )}
             </div>
           ))}
        </div>
        <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-slate-100">
          <button onClick={onClose} className="px-5 py-2.5 text-slate-500 font-bold hover:bg-slate-100 rounded-lg transition-colors">ยกเลิก</button>
          <button onClick={() => onSave(formData)} className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all">{submitText}</button>
        </div>
      </div>
    </div>
  );
};

const PageHeader = ({ title, subtitle, action }) => (
  <div className="flex justify-between items-center mb-6">
    <div><h2 className="text-2xl font-bold text-slate-800 tracking-tight">{title}</h2><p className="text-slate-500 text-sm mt-1">{subtitle}</p></div>
    {action}
  </div>
);

const StatusBadge = ({ status }) => {
  const colors = { "To Do": "bg-slate-100 text-slate-600", "In Progress": "bg-blue-100 text-blue-600", "In Review": "bg-yellow-100 text-yellow-700", "Done": "bg-green-100 text-green-700", "Urgent": "bg-red-100 text-red-600 font-bold" };
  return <span className={`px-2 py-0.5 rounded text-[10px] uppercase tracking-wide font-semibold ${colors[status] || "bg-gray-100"}`}>{status}</span>;
};

const StatusDonutChart = ({ stats }) => {
  const total = stats.total || 1; 
  const donePercent = (stats.done / total) * 100;
  const progressPercent = (stats.progress / total) * 100;
  const radius = 16;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="relative w-40 h-40 flex items-center justify-center">
      <svg className="transform -rotate-90 w-full h-full" viewBox="0 0 36 36">
        <circle cx="18" cy="18" r="16" fill="none" className="stroke-slate-100" strokeWidth="3.8" />
        <circle cx="18" cy="18" r="16" fill="none" className="stroke-slate-300" strokeWidth="3.8" strokeDasharray={`${circumference} ${circumference}`} />
        <circle cx="18" cy="18" r="16" fill="none" className="stroke-blue-500 transition-all duration-1000" strokeWidth="3.8" strokeDasharray={`${(donePercent + progressPercent) / 100 * circumference} ${circumference}`} />
        <circle cx="18" cy="18" r="16" fill="none" className="stroke-green-500 transition-all duration-1000" strokeWidth="3.8" strokeDasharray={`${(donePercent / 100) * circumference} ${circumference}`} />
      </svg>
      <div className="absolute text-center">
        <span className="text-3xl font-black text-slate-800">{stats.total}</span>
        <span className="block text-[10px] text-slate-400 font-bold uppercase">TASKS</span>
      </div>
    </div>
  );
};

// --- LOGIN SCREEN ---
const LoginScreen = () => {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const handleGoogleLogin = async () => {
    setError(''); setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const docRef = doc(db, "user_profiles", user.uid);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) await setDoc(docRef, { phone: "", role: "Member", email: user.email });
    } catch (err) { setError("เข้าสู่ระบบไม่สำเร็จ: " + err.message); }
    setLoading(false);
  };
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 font-sans p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-200 text-center">
         <div className="mb-8"><h1 className="text-3xl font-black text-slate-900">TEAM TAWEE</h1><p className="text-blue-600 font-bold tracking-widest text-xs uppercase mt-2">Stand Together</p></div>
         <h2 className="text-xl font-bold text-slate-800 mb-2">ยินดีต้อนรับ</h2><p className="text-slate-500 text-sm mb-8">กรุณาเข้าสู่ระบบด้วยบัญชี Google ของบริษัท</p>
         {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4">{error}</div>}
         <button onClick={handleGoogleLogin} disabled={loading} className="w-full bg-white border-2 border-slate-200 text-slate-700 font-bold py-3 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center justify-center gap-3">
            {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Mail className="w-5 h-5 text-red-500" />}
            {loading ? 'กำลังเชื่อมต่อ...' : 'เข้าสู่ระบบด้วย Google'}
         </button>
      </div>
    </div>
  );
};

// --- EDIT PROFILE MODAL ---
const ProfileModal = ({ isOpen, onClose, user, userProfile, onUpdate }) => {
  const [name, setName] = useState(user?.displayName || '');
  const [photo, setPhoto] = useState(user?.photoURL || '');
  const [phone, setPhone] = useState(userProfile?.phone || '');
  useEffect(() => { if(user) { setName(user.displayName||''); setPhoto(user.photoURL||''); setPhone(userProfile?.phone||''); } }, [user, userProfile]);
  const handleSave = async () => { await onUpdate(name, photo, phone); onClose(); };
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-6"><h3 className="text-lg font-bold text-slate-800">แก้ไขข้อมูลส่วนตัว</h3><button onClick={onClose}><X className="w-6 h-6 text-slate-400" /></button></div>
        <div className="space-y-4">
            <div><label className="block text-xs font-bold text-slate-500 mb-1">ชื่อแสดงผล</label><input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full border border-slate-200 rounded-lg p-2.5 text-sm" /></div>
            <div><label className="block text-xs font-bold text-slate-500 mb-1">เบอร์โทรศัพท์</label><input type="text" value={phone} onChange={e => setPhone(e.target.value)} className="w-full border border-slate-200 rounded-lg p-2.5 text-sm" /></div>
            <div><label className="block text-xs font-bold text-slate-500 mb-1">Link รูปโปรไฟล์</label><input type="text" value={photo} onChange={e => setPhoto(e.target.value)} className="w-full border border-slate-200 rounded-lg p-2.5 text-sm" /></div>
        </div>
        <button onClick={handleSave} className="w-full mt-6 bg-blue-600 text-white font-bold py-2.5 rounded-lg hover:bg-blue-700 shadow-lg">บันทึกข้อมูล</button>
        <button onClick={() => signOut(auth)} className="w-full mt-3 border border-red-200 text-red-500 font-bold py-2.5 rounded-lg hover:bg-red-50 flex items-center justify-center gap-2"><LogOut className="w-4 h-4" /> ออกจากระบบ</button>
      </div>
    </div>
  );
};

export default function TeamTaweeApp() {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const [tasks, setTasks] = useState([]);
  const [plans, setPlans] = useState([]);
  const [media, setMedia] = useState([]);
  const [channels, setChannels] = useState([]); 
  const [publishedLinks, setPublishedLinks] = useState([]); 

  const [hideDone, setHideDone] = useState(false);
  const [filterTag, setFilterTag] = useState('All');
  const [isGlobalLoading, setIsGlobalLoading] = useState(false); 
  const [isDataLoading, setIsDataLoading] = useState(true); 
  
  const [editingTask, setEditingTask] = useState(null);
  const [urgentModal, setUrgentModal] = useState(null); 
  const [formModalConfig, setFormModalConfig] = useState({ isOpen: false, title: '', fields: [], onSave: () => {} });
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isDistOpen, setIsDistOpen] = useState(false); 

  useEffect(() => {
    const titles = { dashboard: 'ภาพรวม', strategy: 'ยุทธศาสตร์', masterplan: 'แผนงานหลัก', rapidresponse: 'ปฏิบัติการด่วน', assets: 'คลังอาวุธ' };
    document.title = `${titles[activeTab]} | TEAM TAWEE`;
  }, [activeTab]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        const docRef = doc(db, "user_profiles", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) setUserProfile(docSnap.data());
      } else setUserProfile(null);
      setAuthLoading(false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    const unsubTasks = onSnapshot(collection(db, "tasks"), (s) => setTasks(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubPlans = onSnapshot(collection(db, "plans"), (s) => setPlans(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubMedia = onSnapshot(collection(db, "media"), (s) => setMedia(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubChannels = onSnapshot(collection(db, "channels"), (s) => setChannels(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubLinks = onSnapshot(query(collection(db, "published_links"), orderBy("createdAt", "desc")), (s) => setPublishedLinks(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    
    setIsDataLoading(false);
    return () => { unsubTasks(); unsubPlans(); unsubMedia(); unsubChannels(); unsubLinks(); };
  }, [currentUser]);

  const handleUpdateProfile = async (newName, newPhoto, newPhone) => {
      if(!currentUser) return;
      setIsGlobalLoading(true);
      try {
          await updateProfile(currentUser, { displayName: newName, photoURL: newPhoto });
          await setDoc(doc(db, "user_profiles", currentUser.uid), { phone: newPhone }, { merge: true });
          const updatedUser = { ...currentUser, displayName: newName, photoURL: newPhoto };
          setCurrentUser(updatedUser); setUserProfile(prev => ({ ...prev, phone: newPhone }));
      } catch (err) { alert("Error: " + err.message); }
      setIsGlobalLoading(false);
  };

  const openFormModal = (title, fields, onSave) => {
    setFormModalConfig({ 
      isOpen: true, title, fields, 
      onSave: async (data) => { 
         setIsGlobalLoading(true);
         try { await onSave(data); setFormModalConfig(prev => ({ ...prev, isOpen: false })); } 
         catch(e) { alert("Error: " + e.message); }
         setIsGlobalLoading(false);
      } 
    });
  };

  // --- ACTIONS ---
  const saveTaskChange = async (task) => {
    if (!task.id) return;
    setIsGlobalLoading(true);
    try {
        await updateDoc(doc(db, "tasks", task.id), { 
            title: task.title || "", 
            status: task.status || "To Do",
            tag: task.tag || "", 
            link: task.link || "", 
            deadline: task.deadline || "", 
            updatedBy: currentUser.displayName, 
            updatedAt: new Date().toISOString()
        });
        setEditingTask(null);
    } catch (e) { alert("บันทึกไม่สำเร็จ: " + e.message); }
    setIsGlobalLoading(false);
  };

  const saveUrgentCase = async (task) => {
    if (!task.id) return;
    setIsGlobalLoading(true);
    try {
        await updateDoc(doc(db, "tasks", task.id), { 
            title: task.title || "", 
            status: task.status || "To Do",
            link: task.link || "", 
            sop: task.sop || [],
            updatedBy: currentUser.displayName, 
            updatedAt: new Date().toISOString()
        });
        setUrgentModal(null);
    } catch (e) { alert("บันทึกไม่สำเร็จ: " + e.message); }
    setIsGlobalLoading(false);
  };

  const addNewTask = (columnKey) => {
    openFormModal("เพิ่มงานใหม่", [
        { key: 'title', label: 'ชื่องาน', placeholder: 'ระบุชื่องาน...' },
        { key: 'tag', label: 'Tag (เลือกหรือพิมพ์ใหม่)', type: 'datalist', options: PRESET_TAGS, placeholder: 'เช่น Viral, ลงพื้นที่' },
        { key: 'role', label: 'ผู้รับผิดชอบ', placeholder: 'เช่น Chef, Hunter' },
        { key: 'deadline', label: 'กำหนดส่ง', type: 'date' }
    ], async (data) => {
        await addDoc(collection(db, "tasks"), { 
            ...data, status: "To Do", link: "", columnKey,
            createdBy: currentUser.displayName, createdAt: new Date().toISOString()
        });
    });
  };

  // --- ASSET ACTIONS ---
  const addChannel = () => {
    openFormModal("เพิ่มช่องทางเผยแพร่", [
        { key: 'name', label: 'ชื่อช่องทาง', placeholder: 'เช่น Facebook Page' },
        { key: 'type', label: 'ประเภท', type: 'select', options: ['Own Media', 'Partner', 'Influencer', 'Web'], defaultValue: 'Own Media' },
        { key: 'url', label: 'ลิงก์ URL', placeholder: 'https://...' }
    ], async (data) => {
        await addDoc(collection(db, "channels"), { ...data, count: 0 });
    });
  };
  const updateChannel = (channel) => {
      openFormModal("แก้ไขช่องทาง", [
        { key: 'name', label: 'ชื่อช่องทาง', defaultValue: channel.name },
        { key: 'type', label: 'ประเภท', type: 'select', options: ['Own Media', 'Partner', 'Influencer', 'Web'], defaultValue: channel.type },
        { key: 'url', label: 'ลิงก์ URL', defaultValue: channel.url }
      ], async (data) => await updateDoc(doc(db, "channels", channel.id), data));
  };

  const addMedia = () => {
    openFormModal("เพิ่มรายชื่อสื่อใหม่", [
        { key: 'name', label: 'ชื่อ/สังกัด', placeholder: 'เช่น คุณส้ม (Ch 3)' },
        { key: 'type', label: 'ประเภทสื่อ', type: 'select', options: ['TV', 'Online', 'Newspaper', 'Influencer', 'Group'], defaultValue: 'Online' },
        { key: 'phone', label: 'เบอร์โทร', placeholder: '-' },
        { key: 'line', label: 'Line ID', placeholder: '-' }
    ], async (data) => {
        await addDoc(collection(db, "media"), { ...data, active: true });
    });
  };

  const addPublishedLink = () => {
    openFormModal("แปะลิงก์ข่าวที่ลงแล้ว", [
        { key: 'title', label: 'หัวข้อข่าว/โพสต์', placeholder: 'เช่น ข่าวสดลงข่าวท่านทวี...' },
        { key: 'url', label: 'ลิงก์ URL', placeholder: 'https://...' },
        { key: 'platform', label: 'แพลตฟอร์ม', placeholder: 'Facebook, Web...' }
    ], async (data) => {
        await addDoc(collection(db, "published_links"), { 
            ...data, createdBy: currentUser.displayName, createdAt: serverTimestamp() 
        });
    });
  };
  const deleteLink = async (id) => { if(confirm("ลบลิงก์นี้?")) await deleteDoc(doc(db, "published_links", id)); };
  
  // Fix NaN issue
  const updateDist = async (id, count) => updateDoc(doc(db, "channels", id), { count: Math.max(0, count || 0) });
  
  const deleteChannel = async (id) => { if(confirm("ลบช่องทางนี้?")) await deleteDoc(doc(db, "channels", id)); };
  const toggleMediaActive = async (contact) => await updateDoc(doc(db, "media", contact.id), { active: !contact.active });
  const deleteMedia = async (id) => { if(confirm("ลบรายชื่อนี้?")) await deleteDoc(doc(db, "media", id)); };

  const togglePlanItem = async (planId, itemIndex, currentItems) => {
    const newItems = [...currentItems];
    newItems[itemIndex].completed = !newItems[itemIndex].completed;
    const progress = Math.round((newItems.filter(i=>i.completed).length / newItems.length) * 100);
    await updateDoc(doc(db, "plans", planId), { items: newItems, progress });
  };
  const editPlanTitle = (plan) => openFormModal("แก้ไขชื่อแผนงาน", [{key:'title', label:'ชื่อแผนงาน', defaultValue: plan.title}], async(d)=> updateDoc(doc(db,"plans",plan.id), d));
  const addPlan = () => openFormModal("สร้างแผนงานใหม่", [{key:'title', label:'ชื่อแผนงาน'}], async(d)=> addDoc(collection(db,"plans"), { ...d, progress:0, items:[] }));

  const createUrgentCase = async () => {
    openFormModal("เปิดเคสด่วน (New Urgent Case)", [
        { key: 'title', label: 'หัวข้อประเด็น', placeholder: 'เช่น ชี้แจงข่าวบิดเบือนเรื่อง...' },
        { key: 'deadline', label: 'ต้องเสร็จภายใน', type: 'date' }
    ], async (data) => {
        await addDoc(collection(db, "tasks"), { 
            ...data, 
            status: "To Do", role: "Hunter", tag: "Urgent", 
            link: "", columnKey: "defender",
            sop: DEFAULT_SOP, // Fixed undefined error
            createdBy: currentUser.displayName, createdAt: new Date().toISOString()
        });
        alert("เปิดเคสเรียบร้อย! จัดการได้ในหน้านี้ทันที");
    });
  };

  const groupedTasks = {
    solver: tasks.filter(t => t.columnKey === 'solver'),
    principles: tasks.filter(t => t.columnKey === 'principles'),
    defender: tasks.filter(t => t.columnKey === 'defender'),
    expert: tasks.filter(t => t.columnKey === 'expert'),
    backoffice: tasks.filter(t => t.columnKey === 'backoffice')
  };
  
  const urgentTasks = tasks.filter(t => t.tag === 'Urgent');
  const allTags = ['All', ...new Set([...PRESET_TAGS, ...tasks.map(t => t.tag)].filter(Boolean))];
  
  const navItems = [
    { id: 'dashboard', title: 'ภาพรวม', subtitle: 'Dashboard', icon: LayoutDashboard },
    { id: 'strategy', title: 'กระดาน 4 แกน', subtitle: 'Strategy', icon: Megaphone },
    { id: 'masterplan', title: 'แผนงานหลัก', subtitle: 'Master Plan', icon: Map },
    { id: 'rapidresponse', title: 'ปฏิบัติการด่วน', subtitle: 'Rapid Response', icon: Zap, color: 'text-red-500' },
    { id: 'assets', title: 'คลังอาวุธ', subtitle: 'Assets', icon: Database },
  ];

  if (authLoading) return <div className="flex h-screen items-center justify-center bg-slate-50"><RefreshCw className="w-8 h-8 animate-spin text-blue-600" /></div>;
  if (!currentUser) return <LoginScreen />;

  const renderContent = () => {
    if (isDataLoading) return <div className="flex h-64 items-center justify-center text-slate-400"><RefreshCw className="w-6 h-6 animate-spin mr-2"/> Loading Database...</div>;

    switch (activeTab) {
      case 'dashboard':
        const taskStats = { done: 0, pending: 0, total: 0, progress: 0, todo: 0 };
        tasks.forEach(t => { 
            if(t.status==='Done') { taskStats.done++; }
            else if(t.status==='In Progress') { taskStats.progress++; taskStats.pending++; }
            else { taskStats.todo++; taskStats.pending++; }
            taskStats.total++; 
        });

        return (
          <div className="space-y-6 animate-fadeIn">
            <PageHeader title="ภาพรวมสถานการณ์" subtitle="Overview & Statistics" />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* 1. Status Chart */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center">
                 <p className="text-slate-500 text-xs font-bold uppercase mb-6 w-full text-left">Task Status</p>
                 <StatusDonutChart stats={taskStats} />
                 <div className="flex justify-center gap-4 mt-6 text-xs font-bold">
                    <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-500"></div> เสร็จ {taskStats.done}</div>
                    <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500"></div> ทำ {taskStats.progress}</div>
                    <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-slate-300"></div> รอ {taskStats.todo}</div>
                 </div>
              </div>

              {/* 2. Distribution Hub */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
                 <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-slate-800">Distribution Hub</h3>
                    <button onClick={() => setActiveTab('assets')} className="text-xs text-blue-600 hover:underline">จัดการ →</button>
                 </div>
                 <div className="grid grid-cols-2 gap-3 flex-1 content-start">
                    {channels.slice(0,4).map(item => (
                        <div key={item.id} className="bg-slate-50 p-3 rounded border border-slate-100 text-center relative group">
                            <h4 className="font-bold text-slate-700 text-xs truncate">{item.name}</h4>
                            <span className="text-2xl font-black text-blue-600 block">{item.count || 0}</span>
                            <div className="flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition absolute -top-2 inset-x-0">
                                <button onClick={() => updateDist(item.id, (item.count || 0) - 1)} className="bg-white shadow border rounded-full p-0.5 hover:text-red-600"><Minus className="w-3 h-3" /></button>
                                <button onClick={() => updateDist(item.id, (item.count || 0) + 1)} className="bg-white shadow border rounded-full p-0.5 hover:text-blue-600"><Plus className="w-3 h-3" /></button>
                            </div>
                        </div>
                    ))}
                 </div>
              </div>

              {/* 3. Master Plan Preview */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
                 <div className="flex justify-between items-center mb-4"><p className="text-slate-500 text-xs font-bold uppercase">Master Plan</p><button onClick={() => setActiveTab('masterplan')} className="text-xs text-blue-600 font-bold hover:underline">ดูทั้งหมด →</button></div>
                 <div className="space-y-4 flex-1">
                    {plans.slice(0, 3).map(plan => (
                        <div key={plan.id}>
                            <div className="flex justify-between text-sm mb-1"><span className="font-bold text-slate-700 truncate w-40">{plan.title}</span><span className="text-slate-500 text-xs">{plan.progress}%</span></div>
                            <div className="w-full bg-slate-100 rounded-full h-1.5"><div className="bg-indigo-600 h-1.5 rounded-full transition-all duration-500" style={{ width: `${plan.progress}%` }}></div></div>
                        </div>
                    ))}
                 </div>
              </div>
            </div>

            {/* Collapsible News Links */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 flex justify-between items-center bg-slate-50 cursor-pointer hover:bg-slate-100 transition" onClick={() => setIsDistOpen(!isDistOpen)}>
                   <div className="flex items-center gap-2"><LinkIcon className="w-4 h-4 text-slate-500" /><h3 className="font-bold text-sm text-slate-700">ลิงก์ข่าวที่ลงแล้ว (News Links)</h3></div>
                   {isDistOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </div>
                {isDistOpen && (
                    <div className="p-4 max-h-60 overflow-y-auto custom-scrollbar bg-white">
                        <button onClick={addPublishedLink} className="w-full text-xs bg-blue-50 text-blue-600 py-2 rounded border border-blue-100 font-bold mb-3 hover:bg-blue-100">+ เพิ่มลิงก์</button>
                        <div className="space-y-2">
                            {publishedLinks.map(link => (
                                <div key={link.id} className="flex justify-between items-start p-2 border rounded hover:bg-slate-50 group">
                                    <a href={link.url} target="_blank" rel="noreferrer" className="text-xs text-blue-700 hover:underline truncate w-full font-medium block">{link.title}</a>
                                    <button onClick={() => deleteLink(link.id)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100"><Trash2 className="w-3 h-3" /></button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Strategy Preview (Full Width) */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                 <div className="flex justify-between items-center mb-3">
                    <p className="text-slate-500 text-xs font-bold uppercase">Strategy Board Preview</p>
                    <button onClick={() => setActiveTab('strategy')} className="text-xs text-blue-600 font-bold hover:underline">ไปที่กระดาน →</button>
                 </div>
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {['solver', 'principles', 'defender', 'expert'].map((key) => {
                        const items = groupedTasks[key] || [];
                        return (
                            <div key={key} className="bg-slate-50 p-3 rounded border border-slate-100 h-40 overflow-hidden relative">
                                <div className="flex justify-between mb-2 border-b border-slate-100 pb-1">
                                    <span className="text-[10px] font-bold uppercase text-slate-400">{key}</span>
                                    <span className="text-[10px] font-bold bg-white px-1.5 rounded border border-slate-200">{items.length}</span>
                                </div>
                                {items.length > 0 ? (
                                    <div className="space-y-1.5">
                                        {items.slice(0, 4).map(t => (
                                            <div key={t.id} className="flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${t.status === 'Done' ? 'bg-green-400' : 'bg-blue-400'}`}></div>
                                                <p className="text-xs text-slate-600 truncate">{t.title}</p>
                                            </div>
                                        ))}
                                    </div>
                                ) : <p className="text-[10px] text-slate-300 text-center mt-4">- ว่าง -</p>}
                            </div>
                        )
                    })}
                 </div>
            </div>
          </div>
        );

      case 'strategy':
        return (
          <div className="h-full flex flex-col">
            <PageHeader title="กระดานยุทธศาสตร์ 4 แกน" subtitle="Strategy Board & Tasks" action={
                    <div className="flex gap-3">
                        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200">
                             <Filter className="w-4 h-4 text-slate-500" />
                             <select value={filterTag} onChange={(e) => setFilterTag(e.target.value)} className="bg-transparent text-sm border-none focus:ring-0 cursor-pointer outline-none"><option value="All">All Tags</option>{allTags.filter(t=>t!=='All').map(tag => <option key={tag} value={tag}>{tag}</option>)}</select>
                        </div>
                        <button onClick={() => setHideDone(!hideDone)} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold border transition ${hideDone ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-white text-slate-600 border-slate-300'}`}>{hideDone ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />} {hideDone ? "Show Done" : "Hide Done"}</button>
                    </div>
            } />
            <div className="overflow-x-auto pb-4 flex-1">
              <div className="flex gap-4 min-w-[1200px] h-full">
                {[
                  { key: 'solver', title: '1. ผลงาน (Solver)', color: 'blue' },
                  { key: 'principles', title: '2. จุดยืน (Principles)', color: 'purple' },
                  { key: 'defender', title: '3. ตอบโต้ (Defender)', color: 'red' },
                  { key: 'expert', title: '4. ผู้เชี่ยวชาญ (Expert)', color: 'indigo' },
                  { key: 'backoffice', title: '5. หลังบ้าน (Back Office)', color: 'slate' }
                ].map((col) => (
                  <div key={col.key} className={`w-1/5 bg-${col.color}-50 rounded-xl p-4 border border-${col.color}-100 flex flex-col`}>
                    <div className={`mb-3 pb-2 border-b border-${col.color}-200`}><h3 className={`font-bold text-${col.color}-900 truncate`}>{col.title}</h3></div>
                    <div className="space-y-3 overflow-y-auto max-h-[600px] pr-1 custom-scrollbar">
                      {groupedTasks[col.key]?.filter(t => (!hideDone || t.status !== 'Done') && (filterTag === 'All' || t.tag === filterTag)).map(task => (
                        <div key={task.id} onClick={() => setEditingTask(task)} className={`bg-white p-3 rounded-lg shadow-sm border border-slate-200 hover:shadow-md transition cursor-pointer group relative ${task.status === 'Done' ? 'opacity-60 grayscale-[0.5]' : ''}`}>
                          <div className="flex justify-between items-start mb-2"><span className={`text-[10px] font-bold text-${col.color}-600 bg-${col.color}-50 px-1.5 py-0.5 rounded`}>{task.tag}</span><StatusBadge status={task.status} /></div>
                          <h4 className="text-sm font-medium text-slate-800 mb-2 group-hover:text-blue-600 leading-snug">{task.title}</h4>
                          {task.deadline && <div className="flex items-center gap-1 text-[10px] text-red-500 font-bold mt-2"><Clock className="w-3 h-3" /> {task.deadline}</div>}
                          {(task.updatedBy || task.createdBy) && <div className="mt-2 pt-2 border-t border-slate-50 text-[9px] text-slate-400 flex items-center gap-1"><User className="w-3 h-3" /> {task.updatedBy || task.createdBy}</div>}
                        </div>
                      ))}
                      <button onClick={() => addNewTask(col.key)} className="w-full py-2 text-sm text-slate-400 hover:text-slate-600 border border-dashed border-slate-300 rounded-lg hover:bg-white transition flex items-center justify-center gap-1"><Plus className="w-4 h-4" /> เพิ่มงาน</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* EDIT TASK MODAL */}
            {editingTask && (
               <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
                  <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 transform transition-all">
                     <div className="flex justify-between items-center mb-6"><h3 className="font-bold text-xl text-slate-800">แก้ไขรายละเอียดงาน</h3><button onClick={() => setEditingTask(null)}><X className="w-6 h-6 text-slate-400" /></button></div>
                     <div className="space-y-5">
                        <div><label className="block text-xs font-bold text-slate-500 mb-1 uppercase">ชื่องาน</label><input type="text" value={editingTask.title} onChange={e => setEditingTask({...editingTask, title: e.target.value})} className="w-full border-2 border-slate-200 rounded-lg p-2.5 text-sm focus:border-blue-500 outline-none" /></div>
                        <div className="grid grid-cols-2 gap-4">
                           <div>
                             <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Tag (เลือก/พิมพ์)</label>
                             <div className="relative">
                                <input list="edit-tag-options" type="text" value={editingTask.tag} onChange={e => setEditingTask({...editingTask, tag: e.target.value})} className="w-full border-2 border-slate-200 rounded-lg p-2.5 text-sm focus:border-blue-500 outline-none pl-9" />
                                <Tag className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                                <datalist id="edit-tag-options">{PRESET_TAGS.map(t=><option key={t} value={t}/>)}</datalist>
                             </div>
                           </div>
                           <div><label className="block text-xs font-bold text-slate-500 mb-1 uppercase">สถานะ</label><select value={editingTask.status} onChange={e => setEditingTask({...editingTask, status: e.target.value})} className="w-full border-2 border-slate-200 rounded-lg p-2.5 text-sm bg-white focus:border-blue-500 outline-none"><option value="To Do">To Do</option><option value="In Progress">In Progress</option><option value="In Review">In Review</option><option value="Done">Done</option></select></div>
                        </div>
                        <div><label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Deadline</label><input type="date" value={editingTask.deadline || ""} onChange={e => setEditingTask({...editingTask, deadline: e.target.value})} className="w-full border-2 border-slate-200 rounded-lg p-2.5 text-sm focus:border-blue-500 outline-none" /></div>
                        <div><label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Link ผลงาน</label><div className="flex gap-2"><input type="text" value={editingTask.link || ""} onChange={e => setEditingTask({...editingTask, link: e.target.value})} className="w-full border-2 border-slate-200 rounded-lg p-2.5 text-sm focus:border-blue-500 outline-none" placeholder="https://..." />{editingTask.link && <a href={editingTask.link} target="_blank" rel="noreferrer" className="p-2.5 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200"><ExternalLink className="w-5 h-5" /></a>}</div></div>
                        
                        <div className="text-[10px] text-slate-400 bg-slate-50 p-2 rounded border border-slate-100">
                            <p>Created: {editingTask.createdBy}</p>
                            {editingTask.updatedBy && <p>Last Update: {editingTask.updatedBy}</p>}
                        </div>

                        <div className="flex justify-between pt-4 border-t border-slate-100">
                             <button onClick={async () => { if(confirm("ลบงานนี้?")) { setIsGlobalLoading(true); await deleteDoc(doc(db, "tasks", editingTask.id)); setIsGlobalLoading(false); setEditingTask(null); }}} className="text-red-500 text-sm font-bold hover:bg-red-50 px-3 py-2 rounded-lg transition-colors flex items-center gap-1"><Trash2 className="w-4 h-4"/> ลบงาน</button>
                             <button onClick={() => saveTaskChange(editingTask)} className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all flex items-center gap-2"><Save className="w-4 h-4" /> บันทึก</button>
                        </div>
                     </div>
                  </div>
               </div>
            )}
          </div>
        );

      case 'masterplan':
        return (
          <div className="space-y-6">
            <PageHeader title="แผนงานหลัก (Master Plan)" subtitle="Long-term Strategic Roadmap" action={<button onClick={addPlan} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 transition flex items-center gap-2"><Plus className="w-4 h-4" /> สร้างแผนใหม่</button>} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {plans.map((plan) => {
                const sortedItems = [...(plan.items || [])].sort((a, b) => Number(a.completed) - Number(b.completed));
                return (
                <div key={plan.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition group">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-2 group/title cursor-pointer" onClick={() => editPlanTitle(plan)}><h3 className="font-bold text-lg text-slate-800">{plan.title}</h3><Edit2 className="w-4 h-4 text-slate-300 opacity-0 group-hover/title:opacity-100 hover:text-blue-600" /></div>
                    <button onClick={async () => { if(confirm("ลบแผนนี้?")) await deleteDoc(doc(db, "plans", plan.id)); }} className="text-slate-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                  </div>
                  <div className="mb-4"><div className="flex justify-between text-xs text-slate-500 mb-1"><span>ความคืบหน้า</span><span>{plan.progress || 0}%</span></div><div className="w-full bg-slate-100 rounded-full h-2"><div className="bg-blue-600 h-2 rounded-full transition-all duration-500" style={{ width: `${plan.progress || 0}%` }}></div></div></div>
                  <div className="bg-slate-50 rounded-lg p-4">
                    <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Action Items:</h4>
                    <ul className="space-y-2">
                      {sortedItems.map((item, idx) => {
                         const originalIndex = plan.items.indexOf(item); 
                         return (
                          <li key={idx} className={`flex items-center justify-between gap-2 text-sm p-1 rounded transition group/item hover:bg-white ${item.completed ? 'opacity-40 order-last' : ''}`}>
                            <div className="flex items-center gap-2 cursor-pointer flex-1" onClick={() => togglePlanItem(plan.id, originalIndex, plan.items)}>
                              {item.completed ? <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" /> : <Circle className="w-5 h-5 text-slate-300 hover:text-blue-400 flex-shrink-0" />}
                              <span className={item.completed ? "" : "text-slate-700"}>{item.text}</span>
                            </div>
                             {/* FIX: Separate buttons to avoid overlap issues */}
                             <div className="flex gap-2 opacity-100 z-10">
                                <button onClick={(e) => { e.stopPropagation(); editPlanItem(plan.id, originalIndex, plan.items); }} className="text-slate-400 hover:text-blue-600 p-1.5 rounded hover:bg-blue-50"><Edit2 className="w-3.5 h-3.5" /></button>
                                <button onClick={(e) => { e.stopPropagation(); removePlanItem(plan.id, originalIndex, plan.items); }} className="text-slate-400 hover:text-red-500 p-1.5 rounded hover:bg-red-50"><Trash2 className="w-3.5 h-3.5" /></button>
                            </div>
                          </li>
                         );
                      })}
                      <li className="pt-2"><button onClick={() => openFormModal("เพิ่มรายการ", [{key:'text', label:'ชื่อรายการ'}], async(d)=> { const newItems=[...(plan.items||[]), {text:d.text, completed:false}]; await updateDoc(doc(db,"plans",plan.id), {items:newItems, progress:Math.round((newItems.filter(i=>i.completed).length/newItems.length)*100)}) })} className="text-xs text-blue-600 font-bold hover:underline flex items-center gap-1">+ เพิ่มรายการ</button></li>
                    </ul>
                  </div>
                </div>
              )})}
            </div>
          </div>
        );
        
      case 'rapidresponse': 
        return (
            <div className="space-y-6">
                <PageHeader title="ปฏิบัติการด่วน (Rapid Response)" subtitle="Agile Response Unit" action={<button onClick={createUrgentCase} className="bg-red-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-red-700 shadow-lg transition whitespace-nowrap flex items-center gap-2"><AlertTriangle className="w-5 h-5" /> เปิดเคสด่วน (New Case)</button>} />
                
                <div className="flex gap-6">
                    {/* Left: SOP Guide (Static) */}
                    <div className="w-1/3 bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-fit">
                        <h3 className="font-bold text-slate-800 mb-4 border-b pb-2 flex items-center gap-2"><FileText className="w-5 h-5 text-slate-500" /> SOP Guide (คู่มือ)</h3>
                        <div className="space-y-3 text-sm text-slate-600">
                            {SOP_GUIDE.map((step, i) => (
                                <p key={i} className="leading-relaxed">{step}</p>
                            ))}
                        </div>
                    </div>

                    {/* Right: Urgent Cases Grid */}
                    <div className="w-2/3 space-y-6">
                        {urgentTasks.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {urgentTasks.map(task => (
                                <div key={task.id} className="bg-white p-4 rounded-xl border-l-4 border-red-500 shadow-sm hover:shadow-md transition cursor-pointer" onClick={() => setUrgentModal(task)}>
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded">URGENT</span>
                                        <StatusBadge status={task.status} />
                                    </div>
                                    <h3 className="font-bold text-slate-800 mb-2 leading-tight">{task.title}</h3>
                                    {task.deadline && <p className="text-xs text-slate-500 mb-2 flex items-center gap-1"><Clock className="w-3 h-3"/> Deadline: {task.deadline}</p>}
                                    <div className="mt-3 pt-3 border-t border-slate-100">
                                        <p className="text-xs font-bold text-slate-500 mb-1">Checklist:</p>
                                        <div className="flex gap-1">
                                            {(task.sop || []).map((s, i) => (
                                            <div key={i} className={`h-1.5 flex-1 rounded-full ${s.done ? 'bg-green-500' : 'bg-slate-200'}`}></div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            </div>
                        ) : (
                            <div className="p-10 text-center border-2 border-dashed border-slate-200 rounded-xl text-slate-400 bg-slate-50">
                                ยังไม่มีเคสด่วนขณะนี้
                            </div>
                        )}
                    </div>
                </div>
                
                {/* Urgent Modal (SOP Manager) */}
                {urgentModal && (
                   <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
                      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
                         <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-red-600 flex items-center gap-2"><AlertTriangle className="w-6 h-6"/> จัดการเคสด่วน</h3>
                            <button onClick={() => setUrgentModal(null)}><X className="w-6 h-6 text-slate-400" /></button>
                         </div>
                         
                         <div className="space-y-4 mb-6">
                            <div><label className="text-xs font-bold text-slate-500 uppercase">หัวข้อ</label><input type="text" value={urgentModal.title} onChange={(e)=>setUrgentModal({...urgentModal, title:e.target.value})} className="w-full border-b-2 border-slate-100 focus:border-red-500 outline-none py-1 font-bold text-slate-800" /></div>
                            <div className="grid grid-cols-2 gap-4">
                               <div><label className="text-xs font-bold text-slate-500 uppercase">สถานะ</label><select value={urgentModal.status} onChange={(e)=>setUrgentModal({...urgentModal, status:e.target.value})} className="w-full border rounded p-2 text-sm"><option>To Do</option><option>In Progress</option><option>Done</option></select></div>
                               <div><label className="text-xs font-bold text-slate-500 uppercase">Link ผลงาน</label><input type="text" value={urgentModal.link} onChange={(e)=>setUrgentModal({...urgentModal, link:e.target.value})} className="w-full border rounded p-2 text-sm" /></div>
                            </div>
                         </div>

                         <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <h4 className="font-bold text-slate-700 mb-3 flex items-center gap-2"><CheckSquare className="w-4 h-4"/> SOP Checklist</h4>
                            <div className="space-y-2">
                               {(urgentModal.sop || []).map((step, idx) => (
                                  <div key={idx} className="flex items-start gap-3 p-2 hover:bg-white rounded cursor-pointer transition" onClick={() => {
                                      const newSop = [...urgentModal.sop];
                                      newSop[idx].done = !newSop[idx].done;
                                      setUrgentModal({...urgentModal, sop: newSop});
                                  }}>
                                     <div className={`w-5 h-5 rounded border flex items-center justify-center ${step.done ? 'bg-green-500 border-green-500 text-white' : 'border-slate-300 bg-white'}`}>
                                        {step.done && <CheckCircle2 className="w-3.5 h-3.5" />}
                                     </div>
                                     <span className={`text-sm ${step.done ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{step.text}</span>
                                  </div>
                               ))}
                            </div>
                         </div>
                         
                         <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                             <button onClick={async () => { if(confirm("ปิดเคสและลบงานนี้?")) { setIsGlobalLoading(true); await deleteDoc(doc(db, "tasks", urgentModal.id)); setIsGlobalLoading(false); setUrgentModal(null); }}} className="text-red-500 text-sm font-bold hover:bg-red-50 px-3 py-2 rounded">ลบเคส</button>
                             <button onClick={() => saveUrgentCase(urgentModal)} className="bg-red-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-red-700 shadow">บันทึกความคืบหน้า</button>
                         </div>
                      </div>
                   </div>
                )}
            </div>
        );

      case 'assets': 
        return (
            <div className="space-y-6">
                <PageHeader title="คลังอาวุธ (Assets)" subtitle="Media Database & Channels" />
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div><h3 className="text-lg font-bold text-blue-900 flex items-center gap-2"><Database className="w-5 h-5" /> Team Tawee's Google Drive</h3><p className="text-sm text-blue-700/80">พื้นที่เก็บไฟล์ต้นฉบับ รูปภาพ คลิปดิบ และเอกสารราชการ</p></div>
                    <a href="https://drive.google.com/drive/folders/0AHTNNQ96Wgq-Uk9PVA" target="_blank" rel="noreferrer" className="bg-white text-blue-600 border border-blue-200 px-4 py-2 rounded-lg font-bold shadow-sm flex items-center gap-2"><ExternalLink className="w-4 h-4" /> เปิด Drive</a>
                </div>
                
                <div className="grid grid-cols-1 gap-8">
                    {/* Channels Management */}
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex justify-between items-center mb-4"><h3 className="font-bold text-slate-800">จัดการช่องทางเผยแพร่ (Channels)</h3><button onClick={addChannel} className="text-xs bg-blue-600 text-white px-3 py-1 rounded-full hover:bg-blue-700">+ เพิ่มช่องทาง</button></div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {channels.map(c => (
                                <div key={c.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50 group cursor-pointer" onClick={() => updateChannel(c)}>
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className="bg-blue-50 p-2 rounded text-blue-600"><Globe className="w-4 h-4" /></div>
                                        <div className="truncate"><p className="text-sm font-bold text-slate-700 truncate">{c.name}</p><span className="text-[10px] text-slate-400">{c.type}</span></div>
                                    </div>
                                    <button onClick={(e) => { e.stopPropagation(); deleteChannel(c.id); }} className="text-slate-300 hover:text-red-500 p-1"><Trash2 className="w-4 h-4" /></button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Media List */}
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex justify-between items-center mb-4"><h3 className="font-bold text-slate-800">ฐานข้อมูลสื่อมวลชน (Media List)</h3><button onClick={addMedia} className="text-xs bg-blue-600 text-white px-3 py-1 rounded-full hover:bg-blue-700">+ เพิ่มรายชื่อ</button></div>
                        <div className="overflow-x-auto max-h-96 custom-scrollbar">
                            <table className="w-full text-sm text-left"><thead className="text-xs text-slate-500 uppercase bg-slate-50"><tr><th className="px-3 py-2">ชื่อ/สังกัด</th><th className="px-3 py-2">ติดต่อ</th><th className="px-3 py-2 text-center">Quick Contact</th><th className="px-3 py-2"></th></tr></thead>
                                <tbody className="divide-y divide-slate-100">{media.map(c => (<tr key={c.id} className="hover:bg-slate-50"><td className="px-3 py-3 font-medium text-slate-700">{c.name}<span className="block text-[10px] text-slate-400">{c.type}</span></td><td className="px-3 py-3 text-xs text-slate-500"><div><Phone className="w-3 h-3 inline"/> {c.phone}</div><div><MessageCircle className="w-3 h-3 inline text-green-600"/> {c.line}</div></td><td className="px-3 py-3 text-center"><input type="checkbox" checked={c.active} onChange={() => toggleMediaActive(c)} className="cursor-pointer" /></td><td className="px-3 py-3 text-right"><button onClick={() => deleteMedia(c.id)} className="text-slate-300 hover:text-red-500"><Trash2 className="w-4 h-4" /></button></td></tr>))}</tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        );

      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col md:flex-row">
      <LoadingOverlay isOpen={isGlobalLoading} />
      <FormModal {...formModalConfig} onClose={() => setFormModalConfig(prev => ({ ...prev, isOpen: false }))} />
      <ProfileModal isOpen={showProfileModal} onClose={() => setShowProfileModal(false)} user={currentUser} userProfile={userProfile} onUpdate={handleUpdateProfile} />
      
      <aside className={`bg-slate-900 text-white w-full md:w-64 flex-shrink-0 transition-all duration-300 fixed md:sticky top-0 z-30 h-screen ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} flex flex-col`}>
        <div className="p-6 border-b border-slate-700 flex justify-between items-center"><div><h1 className="text-xl font-black tracking-wider text-white">TEAM TAWEE</h1><p className="text-[10px] text-blue-400 font-bold tracking-widest uppercase mt-1">Stand Together</p></div><button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden text-slate-400"><X /></button></div>
        <nav className="p-4 space-y-2 overflow-y-auto flex-1">
          {navItems.map(item => (
            <button key={item.id} onClick={() => { setActiveTab(item.id); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-left ${activeTab === item.id ? 'bg-blue-600 text-white shadow-lg translate-x-1' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
              <item.icon className={`w-5 h-5 flex-shrink-0 ${item.color || ''}`} /><div className="flex flex-col"><span className="font-bold text-sm leading-tight">{item.title}</span><span className="text-[10px] opacity-80 font-medium">({item.subtitle})</span></div>
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-800 cursor-pointer hover:bg-slate-800 transition-colors" onClick={() => setShowProfileModal(true)}>
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center overflow-hidden border-2 border-slate-700">
                    {currentUser?.photoURL ? <img src={currentUser.photoURL} alt="User" className="w-full h-full object-cover" /> : <span className="font-bold text-white">{currentUser?.displayName?.[0] || "U"}</span>}
                </div>
                <div className="overflow-hidden"><p className="text-sm font-bold truncate">{currentUser?.displayName || "User"}</p><p className="text-[10px] text-slate-400">Edit Profile</p></div>
            </div>
        </div>
      </aside>
      <main className="flex-1 md:ml-0 min-h-screen overflow-y-auto w-full">
        <div className="md:hidden bg-white p-4 flex justify-between items-center shadow-sm sticky top-0 z-20 border-b border-slate-100"><div><h2 className="font-black text-slate-900">TEAM TAWEE</h2><p className="text-[10px] text-slate-500">Stand Together</p></div><button onClick={() => setIsMobileMenuOpen(true)} className="p-2 bg-slate-100 rounded-lg"><Menu className="text-slate-600 w-5 h-5" /></button></div>
        <div className="p-4 md:p-8 max-w-7xl mx-auto">{renderContent()}</div>
      </main>
    </div>
  );
}