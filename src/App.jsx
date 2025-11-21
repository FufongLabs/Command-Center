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

// --- GLOBAL CONSTANTS ---
const PRESET_TAGS = [
  "Visual Storytelling", "Viral", "Tradition", "Knowledge", "Urgent", "Report", "System", "Event", "Crisis"
];

const SOP_GUIDE = [
  "1. ทีม Monitor สรุปประเด็น (ใคร? ทำอะไร? กระทบเรายังไง?)",
  "2. ร่าง Message สั้นๆ (เน้น Fact + จุดยืน)",
  "3. ขอ Approved ด่วน (Line/โทร)",
  "4. ผลิตสื่อด่วน (Graphic Quote หรือ คลิปสัมภาษณ์สั้น)",
  "5. กระจายลง Social Media & ส่งกลุ่มนักข่าว"
];

const COL_DESCRIPTIONS = {
    solver: "งานรูทีน, ลงพื้นที่, แก้ปัญหาชาวบ้าน",
    principles: "Quote คำคม, อุดมการณ์, Viral, Brand",
    defender: "ชี้แจงข่าวบิดเบือน, ประเด็นร้อน, Agile",
    expert: "วิเคราะห์เชิงลึก, กฎหมาย, Knowledge",
    backoffice: "เอกสาร, งบประมาณ, ระบบ IT"
};

const formatDate = (isoString) => {
  if (!isoString) return "-";
  try {
    return new Date(isoString).toLocaleString('th-TH', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  } catch (e) { return "-"; }
};

// --- COMPONENTS ---

const LoadingOverlay = ({ isOpen, message = "กำลังบันทึกข้อมูล..." }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center z-[100] animate-fadeIn">
      <div className="relative">
        <div className="absolute inset-0 bg-blue-200 rounded-full animate-ping opacity-75"></div>
        <div className="relative bg-white p-4 rounded-full shadow-xl">
            <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
        </div>
      </div>
      <p className="text-slate-600 font-bold mt-4 animate-pulse">{message}</p>
    </div>
  );
};

// Form Modal (Updated: Tag Buttons)
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 transform transition-all scale-100 relative">
        <button onClick={onClose} className="absolute top-4 right-4 p-1 hover:bg-slate-100 rounded-full transition"><X className="w-5 h-5 text-slate-400" /></button>
        <h3 className="text-xl font-bold text-slate-800 mb-6 pr-8">{title}</h3>
        <div className="space-y-5 max-h-[70vh] overflow-y-auto custom-scrollbar pr-1">
           {fields.map((field) => (
             <div key={field.key}>
                <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase flex items-center gap-2">
                    {field.label}
                    {field.key === 'tag' && <Tag className="w-3 h-3 text-blue-500" />}
                </label>
                
                {field.type === 'select' ? (
                   <div className="relative">
                       <select 
                          value={formData[field.key]} 
                          onChange={(e) => setFormData({...formData, [field.key]: e.target.value})}
                          className="w-full border-2 border-slate-200 rounded-xl p-3 text-sm bg-slate-50 focus:bg-white focus:border-blue-500 outline-none appearance-none font-medium text-slate-700 transition-all"
                       >
                          {field.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                       </select>
                       <ChevronDown className="absolute right-3 top-3.5 w-4 h-4 text-slate-400 pointer-events-none"/>
                   </div>
                ) : (
                   <input 
                      type={field.type || 'text'}
                      value={formData[field.key]}
                      onChange={(e) => setFormData({...formData, [field.key]: e.target.value})}
                      className="w-full border-2 border-slate-200 rounded-xl p-3 text-sm focus:bg-white focus:border-blue-500 outline-none font-medium text-slate-700 transition-all placeholder:text-slate-300"
                      placeholder={field.placeholder || ''}
                      list={field.type === 'datalist' ? `list-${field.key}` : undefined}
                   />
                )}

                {/* Quick Tags Chips (Click to Fill) */}
                {field.key === 'tag' && (
                    <div className="mt-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <p className="text-[10px] text-slate-400 w-full mb-2">เลือก Tag ที่ใช้บ่อย:</p>
                        <div className="flex flex-wrap gap-2">
                            {PRESET_TAGS.map(tag => (
                                <button 
                                    key={tag}
                                    onClick={() => setFormData({...formData, tag: tag})}
                                    className={`text-[10px] px-2.5 py-1.5 rounded-lg border font-medium transition-all active:scale-95 ${formData.tag === tag ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white text-slate-500 border-slate-200 hover:border-blue-400 hover:text-blue-600'}`}
                                >
                                    {tag}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
             </div>
           ))}
        </div>
        <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-slate-100">
          <button onClick={onClose} className="px-5 py-2.5 text-slate-500 font-bold hover:bg-slate-100 rounded-xl transition-colors text-sm">ยกเลิก</button>
          <button onClick={() => onSave(formData)} className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-95 text-sm">{submitText}</button>
        </div>
      </div>
    </div>
  );
};

const PageHeader = ({ title, subtitle, action }) => (
  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
    <div>
        <h2 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">{title}</h2>
        <p className="text-slate-500 text-sm mt-1 font-medium">{subtitle}</p>
    </div>
    <div className="w-full md:w-auto">{action}</div>
  </div>
);

const StatusBadge = ({ status }) => {
  const styles = {
    "To Do": "bg-slate-100 text-slate-600 border-slate-200",
    "In Progress": "bg-blue-50 text-blue-600 border-blue-100", 
    "In Review": "bg-amber-50 text-amber-600 border-amber-100", 
    "Done": "bg-emerald-50 text-emerald-600 border-emerald-100", 
    "Urgent": "bg-red-50 text-red-600 border-red-100"
  };
  return <span className={`px-2.5 py-1 rounded-md text-[10px] uppercase tracking-wide font-bold border ${styles[status] || "bg-gray-100"}`}>{status}</span>;
};

const StatusDonutChart = ({ stats }) => {
  const total = stats.total || 1; 
  const donePercent = (stats.done / total) * 100;
  const progressPercent = (stats.progress / total) * 100;
  const radius = 40;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="relative w-48 h-48 flex items-center justify-center">
      <svg className="transform -rotate-90 w-full h-full" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="40" fill="none" className="stroke-slate-100" strokeWidth="12" strokeLinecap="round" />
        <circle cx="50" cy="50" r="40" fill="none" className="stroke-slate-300" strokeWidth="12" strokeDasharray={`${circumference} ${circumference}`} strokeLinecap="round" />
        <circle cx="50" cy="50" r="40" fill="none" className="stroke-blue-500 transition-all duration-1000 ease-out" strokeWidth="12" strokeDasharray={`${(donePercent + progressPercent) / 100 * circumference} ${circumference}`} strokeLinecap="round" />
        <circle cx="50" cy="50" r="40" fill="none" className="stroke-emerald-500 transition-all duration-1000 ease-out" strokeWidth="12" strokeDasharray={`${(donePercent / 100) * circumference} ${circumference}`} strokeLinecap="round" />
      </svg>
      <div className="absolute text-center">
        <span className="text-4xl font-black text-slate-800">{stats.total}</span>
        <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">TASKS</span>
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 font-sans p-4">
      <div className="bg-white p-10 rounded-3xl shadow-2xl w-full max-w-md border border-white/50 backdrop-blur-sm text-center relative overflow-hidden">
         <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
         <div className="mb-8">
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">TEAM TAWEE</h1>
            <p className="text-blue-600 font-bold tracking-widest text-xs uppercase mt-2 bg-blue-50 inline-block px-3 py-1 rounded-full">Stand Together</p>
         </div>
         
         <h2 className="text-xl font-bold text-slate-800 mb-2">ยินดีต้อนรับสู่ระบบ</h2>
         <p className="text-slate-500 text-sm mb-8">ศูนย์ปฏิบัติการและบริหารงานยุทธศาสตร์</p>
         
         {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4 font-medium border border-red-100">{error}</div>}

         <button onClick={handleGoogleLogin} disabled={loading} className="w-full bg-white border-2 border-slate-200 text-slate-700 font-bold py-3.5 rounded-xl hover:bg-slate-50 hover:border-blue-300 hover:shadow-md transition-all flex items-center justify-center gap-3 group">
            {loading ? <RefreshCw className="w-5 h-5 animate-spin text-blue-600" /> : (
                <svg className="w-5 h-5 transition-transform group-hover:scale-110" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
            )}
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
  const [isSopOpen, setIsSopOpen] = useState(false); 

  // --- BACK BUTTON FIX ---
  useEffect(() => {
    const handlePopState = (event) => {
      if (event.state && event.state.tab) {
        setActiveTab(event.state.tab);
      } else {
        setActiveTab('dashboard');
      }
    };
    window.addEventListener('popstate', handlePopState);
    window.history.replaceState({ tab: 'dashboard' }, '', '#dashboard');
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (tabId) => {
    if (activeTab === tabId) return;
    setActiveTab(tabId);
    window.history.pushState({ tab: tabId }, '', `#${tabId}`);
    setIsMobileMenuOpen(false);
  };

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
        { key: 'tag', label: 'Tag', placeholder: 'เลือกหรือพิมพ์ใหม่...', type: 'text' },
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

  const removePlanItem = async (planId, originalIndex, currentItems) => {
    if (confirm("ลบรายการนี้?")) {
      const newItems = currentItems.filter((_, idx) => idx !== originalIndex);
      const progress = Math.round((newItems.filter(i => i.completed).length / newItems.length) * 100) || 0;
      await updateDoc(doc(db, "plans", planId), { items: newItems, progress });
    }
  };

  const editPlanItem = (planId, originalIndex, currentItems) => {
    openFormModal("แก้ไขรายการ", [{key: 'text', label: 'ข้อความ', defaultValue: currentItems[originalIndex].text}], async(data) => {
      const newItems = [...currentItems];
      newItems[originalIndex].text = data.text;
      await updateDoc(doc(db, "plans", planId), { items: newItems });
    });
  };

  const createUrgentCase = async () => {
    openFormModal("เปิดเคสด่วน (New Urgent Case)", [
        { key: 'title', label: 'หัวข้อประเด็น', placeholder: 'เช่น ชี้แจงข่าวบิดเบือนเรื่อง...' },
        { key: 'deadline', label: 'ต้องเสร็จภายใน', type: 'date' }
    ], async (data) => {
        await addDoc(collection(db, "tasks"), { 
            ...data, 
            status: "To Do", role: "Hunter", tag: "Urgent", 
            link: "", columnKey: "defender",
            sop: DEFAULT_SOP, 
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
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex flex-col items-center justify-center relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none"><Activity className="w-24 h-24 text-blue-600" /></div>
                 <p className="text-slate-500 text-xs font-bold uppercase mb-6 w-full text-left z-10">Real-time Status</p>
                 <StatusDonutChart stats={taskStats} />
                 <div className="flex justify-center gap-6 mt-6 text-xs font-bold w-full">
                    <div className="text-center"><div className="w-3 h-3 rounded-full bg-emerald-500 mx-auto mb-1 shadow-sm"></div> เสร็จ {taskStats.done}</div>
                    <div className="text-center"><div className="w-3 h-3 rounded-full bg-blue-500 mx-auto mb-1 shadow-sm"></div> ทำ {taskStats.progress}</div>
                    <div className="text-center"><div className="w-3 h-3 rounded-full bg-slate-300 mx-auto mb-1 shadow-sm"></div> รอ {taskStats.todo}</div>
                 </div>
              </div>

              {/* 2. Distribution Hub (Updated) */}
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col">
                 <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-slate-800">Distribution Hub</h3>
                    <button onClick={() => navigateTo('assets')} className="text-xs text-blue-600 hover:underline">จัดการ →</button>
                 </div>
                 <div className="grid grid-cols-2 gap-3 flex-1 content-start">
                    {channels.slice(0,4).map(item => (
                        <div key={item.id} className="bg-slate-50 p-3 rounded border border-slate-100 text-center relative group">
                            <h4 className="font-bold text-slate-700 text-xs truncate">{item.name}</h4>
                            <span className="text-2xl font-black text-blue-600 block">{item.count || 0}</span>
                            <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition absolute -top-2 inset-x-0">
                                <button onClick={() => updateDist(item.id, (item.count || 0) - 1)} className="bg-white shadow border rounded-full p-0.5 hover:text-red-600 z-10"><Minus className="w-3 h-3" /></button>
                                <button onClick={() => updateDist(item.id, (item.count || 0) + 1)} className="bg-white shadow border rounded-full p-0.5 hover:text-blue-600 z-10"><Plus className="w-3 h-3" /></button>
                            </div>
                        </div>
                    ))}
                 </div>
              </div>

              {/* 3. Master Plan Preview */}
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col">
                 <div className="flex justify-between items-center mb-4"><p className="text-slate-500 text-xs font-bold uppercase">Master Plan</p><button onClick={() => navigateTo('masterplan')} className="text-xs text-blue-600 font-bold hover:underline">ดูทั้งหมด →</button></div>
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
                    <button onClick={() => navigateTo('strategy')} className="text-xs text-blue-600 font-bold hover:underline">ไปที่กระดาน →</button>
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
            <div className="overflow-x-auto pb-4 flex-1 custom-scrollbar">
              <div className="flex flex-col md:flex-row gap-4 min-w-full md:min-w-[1200px] h-full">
                {[
                  { key: 'solver', title: '1. ผลงาน (Solver)', color: 'blue' },
                  { key: 'principles', title: '2. จุดยืน (Principles)', color: 'purple' },
                  { key: 'defender', title: '3. ตอบโต้ (Defender)', color: 'red' },
                  { key: 'expert', title: '4. ผู้เชี่ยวชาญ (Expert)', color: 'indigo' },
                  { key: 'backoffice', title: '5. หลังบ้าน (Back Office)', color: 'slate' }
                ].map((col) => (
                  <div key={col.key} className={`w-full md:w-1/5 bg-${col.color}-50/50 rounded-2xl p-4 border border-${col.color}-100 flex flex-col shadow-sm`}>
                    <div className={`mb-3 pb-2 border-b border-${col.color}-200/50`}>
                        <h3 className={`font-black text-${col.color}-900 text-sm uppercase tracking-wide truncate`}>{col.title}</h3>
                        <p className="text-[10px] text-slate-500 line-clamp-2 leading-tight mt-1 h-6">{COL_DESCRIPTIONS[col.key]}</p>
                    </div>
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
                             <input type="text" value={editingTask.tag} onChange={e => setEditingTask({...editingTask, tag: e.target.value})} className="w-full border-2 border-slate-200 rounded-lg p-2.5 text-sm focus:border-blue-500 outline-none" />
                             <div className="mt-2 flex flex-wrap gap-1.5">{PRESET_TAGS.slice(0,4).map(t=><button key={t} onClick={()=>setEditingTask({...editingTask, tag: t})} className="text-[9px] border px-2 py-0.5 rounded-full hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 transition">{t}</button>)}</div>
                           </div>
                           <div><label className="block text-xs font-bold text-slate-500 mb-1 uppercase">สถานะ</label><select value={editingTask.status} onChange={e => setEditingTask({...editingTask, status: e.target.value})} className="w-full border-2 border-slate-200 rounded-lg p-2.5 text-sm bg-white focus:border-blue-500 outline-none"><option value="To Do">To Do</option><option value="In Progress">In Progress</option><option value="In Review">In Review</option><option value="Done">Done</option></select></div>
                        </div>
                        <div><label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Deadline</label><input type="date" value={editingTask.deadline || ""} onChange={e => setEditingTask({...editingTask, deadline: e.target.value})} className="w-full border-2 border-slate-200 rounded-lg p-2.5 text-sm focus:border-blue-500 outline-none" /></div>
                        <div><label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Link ผลงาน</label><div className="flex gap-2"><input type="text" value={editingTask.link || ""} onChange={e => setEditingTask({...editingTask, link: e.target.value})} className="w-full border-2 border-slate-200 rounded-lg p-2.5 text-sm focus:border-blue-500 outline-none" placeholder="https://..." />{editingTask.link && <a href={editingTask.link} target="_blank" rel="noreferrer" className="p-2.5 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200"><ExternalLink className="w-5 h-5" /></a>}</div></div>
                        
                        <div className="text-[10px] text-slate-400 bg-slate-50 p-2 rounded border border-slate-100">
                            <p>Created: {editingTask.createdBy} ({formatDate(editingTask.createdAt)})</p>
                            {editingTask.updatedBy && <p>Last Update: {editingTask.updatedBy} ({formatDate(editingTask.updatedAt)})</p>}
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
            <PageHeader title="แผนงานหลัก (Master Plan)" subtitle="Long-term Strategic Roadmap" action={<button onClick={addPlan} className="bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-700 transition flex items-center gap-2 shadow-lg shadow-blue-200"><Plus className="w-4 h-4" /> สร้างแผนใหม่</button>} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {plans.map((plan) => {
                const sortedItems = [...(plan.items || [])].map((item, idx) => ({ ...item, originalIndex: idx })).sort((a, b) => Number(a.completed) - Number(b.completed));
                return (
                <div key={plan.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition group">
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-2 group/title cursor-pointer hover:bg-slate-50 px-2 py-1 -ml-2 rounded-lg transition" onClick={() => editPlanTitle(plan)}><h3 className="font-bold text-lg text-slate-800">{plan.title}</h3><Edit2 className="w-4 h-4 text-slate-300 opacity-0 group-hover/title:opacity-100 hover:text-blue-600" /></div>
                    <button onClick={async () => { if(confirm("ลบแผนนี้?")) await deleteDoc(doc(db, "plans", plan.id)); }} className="text-slate-300 hover:text-red-600 p-2 hover:bg-red-50 rounded-full transition"><Trash2 className="w-4 h-4" /></button>
                  </div>
                  <div className="mb-6"><div className="flex justify-between text-xs text-slate-500 mb-1 font-bold"><span>PROGRESS</span><span>{plan.progress || 0}%</span></div><div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden"><div className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2.5 rounded-full transition-all duration-1000 shadow-sm" style={{ width: `${plan.progress || 0}%` }}></div></div></div>
                  <div className="bg-slate-50/50 rounded-xl p-1 border border-slate-100">
                    <ul className="space-y-1">
                      {sortedItems.map((item, idx) => {
                         const originalIndex = item.originalIndex; 
                         return (
                          <li key={idx} className={`flex items-center justify-between gap-3 text-sm p-2 rounded-lg transition group/item hover:bg-white hover:shadow-sm ${item.completed ? 'opacity-50' : ''}`}>
                            <div className="flex items-center gap-3 cursor-pointer flex-1" onClick={() => togglePlanItem(plan.id, originalIndex, plan.items)}>
                              {item.completed ? <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-white shadow-sm"><CheckCircle2 className="w-3.5 h-3.5" /></div> : <div className="w-5 h-5 border-2 border-slate-300 rounded-full hover:border-blue-400 transition"></div>}
                              <span className={`font-medium ${item.completed ? "text-slate-400" : "text-slate-700"}`}>{item.text}</span>
                            </div>
                            <div className="flex gap-1 opacity-100">
                                <button onClick={(e) => { e.stopPropagation(); editPlanItem(plan.id, originalIndex, plan.items); }} className="text-slate-400 hover:text-blue-600 p-1.5 rounded-md hover:bg-blue-50 transition"><Edit2 className="w-3.5 h-3.5" /></button>
                                <button onClick={(e) => { e.stopPropagation(); removePlanItem(plan.id, originalIndex, plan.items); }} className="text-slate-400 hover:text-red-500 p-1.5 rounded-md hover:bg-red-50 transition"><Trash2 className="w-3.5 h-3.5" /></button>
                            </div>
                          </li>
                         );
                      })}
                      <li className="pt-2"><button onClick={() => openFormModal("เพิ่มรายการ", [{key:'text', label:'ชื่อรายการ'}], async(d)=> { const newItems=[...(plan.items||[]), {text:d.text, completed:false}]; await updateDoc(doc(db,"plans",plan.id), {items:newItems, progress:Math.round((newItems.filter(i=>i.completed).length/newItems.length)*100)}) })} className="w-full text-center text-xs text-blue-600 font-bold hover:bg-blue-50 py-2 rounded-lg transition border border-dashed border-blue-200">+ เพิ่มรายการ</button></li>
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
                <PageHeader title="ปฏิบัติการด่วน (Rapid Response)" subtitle="Agile Response Unit" action={<button onClick={createUrgentCase} className="bg-red-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-red-700 shadow-lg shadow-red-200 transition whitespace-nowrap flex items-center gap-2 active:scale-95"><AlertTriangle className="w-5 h-5" /> เปิดเคสด่วน (New Case)</button>} />
                
                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Left: SOP Guide (Mobile Accordion / Desktop Fixed) */}
                    <div className={`lg:w-1/3 bg-white rounded-2xl border border-slate-200 shadow-sm h-fit overflow-hidden transition-all ${isSopOpen ? 'max-h-96' : 'max-h-16 lg:max-h-full'}`}>
                        <div className="p-4 lg:p-6 flex justify-between items-center cursor-pointer lg:cursor-default bg-slate-50 lg:bg-white" onClick={() => setIsSopOpen(!isSopOpen)}>
                            <h3 className="font-bold text-slate-800 flex items-center gap-2"><FileText className="w-5 h-5 text-slate-500" /> SOP Guide (คู่มือ)</h3>
                            <ChevronDown className={`w-5 h-5 text-slate-400 lg:hidden transform transition ${isSopOpen ? 'rotate-180' : ''}`} />
                        </div>
                        <div className="p-6 pt-0 space-y-4 text-sm text-slate-600 border-t border-slate-100 lg:border-none">
                            {SOP_GUIDE.map((step, i) => (
                                <div key={i} className="flex gap-3">
                                    <span className="font-bold text-blue-600 bg-blue-50 w-6 h-6 flex items-center justify-center rounded-full text-xs flex-shrink-0">{i+1}</span>
                                    <p className="leading-relaxed">{step.substring(3)}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right: Urgent Cases Grid */}
                    <div className="lg:w-2/3 space-y-6">
                        <div className="grid grid-cols-1 gap-4">
                            {urgentTasks.length > 0 ? urgentTasks.map(task => (
                                <div key={task.id} className="bg-white p-5 rounded-2xl border-l-[6px] border-red-500 shadow-sm hover:shadow-md hover:translate-y-[-2px] transition-all cursor-pointer group" onClick={() => setUrgentModal(task)}>
                                    <div className="flex justify-between items-start mb-3">
                                        <span className="text-[10px] font-bold text-white bg-red-500 px-2 py-0.5 rounded shadow-sm animate-pulse">URGENT CASE</span>
                                        <StatusBadge status={task.status} />
                                    </div>
                                    <h3 className="font-bold text-slate-800 mb-3 leading-tight text-lg group-hover:text-red-600 transition">{task.title}</h3>
                                    {task.deadline && <p className="text-xs text-slate-500 mb-4 flex items-center gap-1.5 bg-slate-50 inline-block px-2 py-1 rounded"><Clock className="w-3.5 h-3.5"/> Deadline: {task.deadline}</p>}
                                    <div className="pt-3 border-t border-slate-100">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Progress Checklist</p>
                                        <div className="flex gap-1.5 h-2">
                                            {(task.sop || []).map((s, i) => (
                                            <div key={i} className={`flex-1 rounded-full transition-all ${s.done ? 'bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]' : 'bg-slate-100'}`}></div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )) : (
                                <div className="p-16 text-center border-2 border-dashed border-slate-200 rounded-3xl text-slate-400 bg-slate-50/50 flex flex-col items-center justify-center">
                                    <div className="bg-white p-4 rounded-full shadow-sm mb-3"><CheckCircle2 className="w-8 h-8 text-green-500" /></div>
                                    <p className="font-medium">สถานการณ์ปกติ</p>
                                    <p className="text-xs mt-1 opacity-70">ยังไม่มีเคสด่วนที่ต้องดำเนินการ</p>
                                </div>
                            )}
                        </div>

                        {/* Quick Contacts (Restored) */}
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mt-8">
                            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Phone className="w-5 h-5 text-slate-500"/> Quick Contacts</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {media.filter(c => c.active).map((c,i) => (
                                    <div key={i} className="p-4 border border-slate-100 rounded-xl bg-slate-50/50 hover:bg-white hover:shadow-md transition group">
                                        <p className="font-bold text-sm text-slate-800">{c.name}</p>
                                        <span className="text-[10px] text-slate-400 uppercase font-bold mb-2 block">{c.type}</span>
                                        <div className="flex flex-col gap-1.5 text-xs text-slate-600">
                                            <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-slate-400"/> {c.phone}</div>
                                            <div className="flex items-center gap-2"><MessageCircle className="w-3.5 h-3.5 text-green-500"/> {c.line}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <button onClick={() => navigateTo('assets')} className="text-xs text-blue-600 font-bold hover:underline mt-4 block w-full text-center border-t border-slate-100 pt-3">ดูรายชื่อทั้งหมด</button>
                        </div>
                    </div>
                </div>
                
                {/* Urgent Modal (SOP Manager) */}
                {urgentModal && (
                   <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
                      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 relative">
                         <button onClick={() => setUrgentModal(null)} className="absolute top-4 right-4 p-1 hover:bg-slate-100 rounded-full"><X className="w-6 h-6 text-slate-400" /></button>
                         <div className="flex justify-between items-center mb-6 pt-2">
                            <h3 className="text-xl font-bold text-red-600 flex items-center gap-2"><AlertTriangle className="w-6 h-6"/> จัดการเคสด่วน</h3>
                         </div>
                         
                         <div className="space-y-5 mb-8">
                            <div><label className="text-xs font-bold text-slate-500 uppercase mb-1 block">หัวข้อ</label><input type="text" value={urgentModal.title} onChange={(e)=>setUrgentModal({...urgentModal, title:e.target.value})} className="w-full border-2 border-slate-200 rounded-xl p-3 font-bold text-slate-800 focus:border-red-500 outline-none" /></div>
                            <div className="grid grid-cols-2 gap-4">
                               <div><label className="text-xs font-bold text-slate-500 uppercase mb-1 block">สถานะ</label><select value={urgentModal.status} onChange={(e)=>setUrgentModal({...urgentModal, status:e.target.value})} className="w-full border-2 border-slate-200 rounded-xl p-2.5 text-sm bg-white focus:border-red-500 outline-none"><option>To Do</option><option>In Progress</option><option>Done</option></select></div>
                               <div><label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Link ผลงาน</label><input type="text" value={urgentModal.link} onChange={(e)=>setUrgentModal({...urgentModal, link:e.target.value})} className="w-full border-2 border-slate-200 rounded-xl p-2.5 text-sm focus:border-red-500 outline-none" /></div>
                            </div>
                         </div>

                         <div className="bg-slate-50 p-5 rounded-xl border border-slate-100">
                            <h4 className="font-bold text-slate-700 mb-4 flex items-center gap-2 text-sm uppercase tracking-wide"><CheckSquare className="w-4 h-4 text-blue-500"/> SOP Checklist</h4>
                            <div className="space-y-3">
                               {(urgentModal.sop || []).map((step, idx) => (
                                  <div key={idx} className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition border ${step.done ? 'bg-green-50 border-green-200' : 'bg-white border-slate-100 hover:border-blue-200'}`} onClick={() => {
                                      const newSop = [...urgentModal.sop];
                                      newSop[idx].done = !newSop[idx].done;
                                      setUrgentModal({...urgentModal, sop: newSop});
                                  }}>
                                     <div className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 mt-0.5 transition ${step.done ? 'bg-green-500 border-green-500 text-white' : 'border-slate-300 bg-white'}`}>
                                        {step.done && <CheckCircle2 className="w-3.5 h-3.5" />}
                                     </div>
                                     <span className={`text-sm font-medium ${step.done ? 'text-green-700 line-through opacity-70' : 'text-slate-700'}`}>{step.text}</span>
                                  </div>
                               ))}
                            </div>
                         </div>
                         
                         <div className="flex justify-between mt-8 pt-4 border-t border-slate-100">
                             <button onClick={async () => { if(confirm("ปิดเคสและลบงานนี้?")) { setIsGlobalLoading(true); await deleteDoc(doc(db, "tasks", urgentModal.id)); setIsGlobalLoading(false); setUrgentModal(null); }}} className="text-red-500 text-sm font-bold hover:bg-red-50 px-4 py-3 rounded-xl transition flex items-center gap-2"><Trash2 className="w-4 h-4"/> ลบเคส</button>
                             <button onClick={() => saveUrgentCase(urgentModal)} className="bg-red-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-red-700 shadow-lg shadow-red-100 transition transform active:scale-95">บันทึกความคืบหน้า</button>
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
                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-8 rounded-2xl shadow-lg text-white flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-10"><Database className="w-64 h-64" /></div>
                    <div className="relative z-10">
                        <h3 className="text-2xl font-black flex items-center gap-3 mb-2"><Database className="w-8 h-8" /> Team Tawee's Google Drive</h3>
                        <p className="text-blue-100 font-medium">พื้นที่เก็บไฟล์ต้นฉบับ รูปภาพ คลิปดิบ และเอกสารราชการทั้งหมด</p>
                    </div>
                    <a href="https://drive.google.com/drive/folders/0AHTNNQ96Wgq-Uk9PVA" target="_blank" rel="noreferrer" className="relative z-10 bg-white text-blue-700 border-none px-6 py-3 rounded-xl font-bold shadow-xl hover:bg-blue-50 transition flex items-center gap-2 active:scale-95"><ExternalLink className="w-5 h-5" /> เปิด Google Drive</a>
                </div>
                
                <div className="grid grid-cols-1 gap-8">
                    {/* Channels Management */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <div className="flex justify-between items-center mb-6"><h3 className="font-bold text-slate-800 text-lg">จัดการช่องทางเผยแพร่ (Channels)</h3><button onClick={addChannel} className="text-xs bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-bold transition">+ เพิ่มช่องทาง</button></div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {channels.map(c => (
                                <div key={c.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:border-blue-400 hover:shadow-md transition group cursor-pointer bg-white" onClick={() => updateChannel(c)}>
                                    <div className="flex items-center gap-4 overflow-hidden">
                                        <div className="bg-slate-50 p-3 rounded-lg text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-600 transition"><Globe className="w-6 h-6" /></div>
                                        <div className="truncate">
                                            <p className="font-bold text-slate-700 truncate group-hover:text-blue-700 transition">{c.name}</p>
                                            <span className="text-xs font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-500">{c.type}</span>
                                        </div>
                                    </div>
                                    <button onClick={(e) => { e.stopPropagation(); deleteChannel(c.id); }} className="text-slate-300 hover:text-red-500 p-2 hover:bg-red-50 rounded-lg transition opacity-0 group-hover:opacity-100"><Trash2 className="w-5 h-5" /></button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Media List */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <div className="flex justify-between items-center mb-6"><h3 className="font-bold text-slate-800 text-lg">ฐานข้อมูลสื่อมวลชน (Media List)</h3><button onClick={addMedia} className="text-xs bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-bold transition">+ เพิ่มรายชื่อ</button></div>
                        <div className="overflow-x-auto max-h-[500px] custom-scrollbar rounded-xl border border-slate-200">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-slate-500 uppercase bg-slate-50 sticky top-0 z-10">
                                    <tr>
                                        <th className="px-6 py-4 font-bold">ชื่อ/สังกัด</th>
                                        <th className="px-6 py-4 font-bold">ติดต่อ</th>
                                        <th className="px-6 py-4 font-bold text-center">Quick Contact</th>
                                        <th className="px-6 py-4 font-bold text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {media.map(c => (
                                        <tr key={c.id} className="hover:bg-slate-50 transition bg-white">
                                            <td className="px-6 py-4 font-medium text-slate-700">
                                                {c.name}
                                                <span className="block text-[10px] font-bold text-blue-600 bg-blue-50 inline-block px-1.5 rounded mt-1 w-fit">{c.type}</span>
                                            </td>
                                            <td className="px-6 py-4 text-xs text-slate-500 space-y-1">
                                                <div className="flex items-center gap-2"><Phone className="w-3 h-3"/> {c.phone}</div>
                                                <div className="flex items-center gap-2 text-green-600"><MessageCircle className="w-3 h-3"/> {c.line}</div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="relative inline-block w-10 h-5 align-middle select-none transition duration-200 ease-in">
                                                    <input type="checkbox" checked={c.active} onChange={() => toggleMediaActive(c)} className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer transition-all duration-300 ease-in-out transform checked:translate-x-5 checked:border-blue-600" />
                                                    <label className={`toggle-label block overflow-hidden h-5 rounded-full cursor-pointer transition-colors duration-300 ${c.active ? 'bg-blue-600' : 'bg-slate-300'}`}></label>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button onClick={() => deleteMedia(c.id)} className="text-slate-300 hover:text-red-500 p-2 hover:bg-red-50 rounded-lg transition"><Trash2 className="w-4 h-4" /></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
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
            <button key={item.id} onClick={() => navigateTo(item.id)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-left ${activeTab === item.id ? 'bg-blue-600 text-white shadow-lg translate-x-1' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
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