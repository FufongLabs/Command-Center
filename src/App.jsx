import React, { useState, useEffect } from 'react';
import { db, auth } from './firebaseConfig'; 
import { 
  collection, addDoc, onSnapshot, updateDoc, deleteDoc, doc, 
  query, orderBy, writeBatch, setDoc, getDoc, serverTimestamp, where 
} from 'firebase/firestore';
import { 
  onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, updateProfile 
} from 'firebase/auth';

import { 
  LayoutDashboard, Megaphone, Map, Zap, Database, Users, Menu, X, Activity, 
  Calendar, CheckCircle2, Circle, Clock, ExternalLink, Eye, FileText, Share2, Plus, 
  Minus, Link as LinkIcon, Trash2, Edit2, ChevronDown, ChevronUp, Filter, RefreshCw, Save, Phone, LogOut, User, Lock, Camera, Mail, AlertTriangle, Smartphone, MessageCircle, Globe, Loader2, CheckSquare, Tag, Search, Shield, FileClock, Check, ArrowDownWideNarrow
} from 'lucide-react';

// --- GLOBAL CONSTANTS ---
const PRESET_TAGS = [
  "Visual Storytelling", "Viral", "Tradition", "Knowledge", "Urgent", "Report", "System", "Event", "Crisis",
  "Quote", "Infographic", "Single Photo"
];

const ASSET_TYPES = ["Own media", "Partner", "NEWS Paper", "NEWS Website", "Fan Club (own)"];
const TASK_STATUSES = ["To Do", "In Progress", "In Review", "Done", "Idea", "Waiting list", "Canceled"];

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

const COL_DESCRIPTIONS = {
    solver: "งานรูทีน, ลงพื้นที่, แก้ปัญหาชาวบ้าน",
    principles: "Quote คำคม, อุดมการณ์, Viral, Brand",
    defender: "ชี้แจงข่าวบิดเบือน, ประเด็นร้อน, Agile",
    expert: "วิเคราะห์เชิงลึก, กฎหมาย, Knowledge",
    backoffice: "เอกสาร, งบประมาณ, ระบบ IT"
};

const COLUMN_LABELS = {
    solver: "1. ผลงาน (Solver)",
    principles: "2. จุดยืน (Principles)",
    defender: "3. ตอบโต้ (Defender)",
    expert: "4. ผู้เชี่ยวชาญ (Expert)",
    backoffice: "5. หลังบ้าน (Back Office)"
};

const formatDate = (val) => {
  if (!val) return "-";
  try {
    // 🟢 บรรทัดนี้สำคัญ: มันจะเช็คเองว่าต้องใช้ .toDate() ไหม
    const d = val.toDate ? val.toDate() : new Date(val);
    if (isNaN(d.getTime())) return "-";
    
    return d.toLocaleString('th-TH', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  } catch (e) { return "-"; }
};
// ฟังก์ชันดึงชื่อเว็บ (Domain)
const getDomain = (url) => {
  try { return new URL(url).hostname.replace('www.', ''); } catch (e) { return 'External'; }
};

// ตัวช่วยแปลงวันที่สำหรับใส่ในช่อง Input
const formatForInput = (timestamp) => {
  if (!timestamp) return '';
  // เช็คว่าเป็น Firestore Timestamp หรือ Date object ปกติ
  const d = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const pad = (n) => n < 10 ? '0' + n : n;
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

// ฟังก์ชันดึงข้อมูลอัตโนมัติ (Title + Image + Date)
const fetchLinkMetadata = async (url) => {
  if (!url) return null;
  try {
    const response = await fetch(`https://api.microlink.io?url=${encodeURIComponent(url)}`);
    const data = await response.json();
    if (data.status === 'success') {
      return {
        title: data.data.title,
        image: data.data.image?.url,
        date: data.data.date, // ดึงวันที่มาด้วย
      };
    }
  } catch (error) { console.error("Error fetching metadata:", error); }
  return null;
};

// --- COMPONENTS ---

const LoadingOverlay = ({ isOpen, message = "กำลังทำงาน..." }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center z-[2000] animate-fadeIn">
      <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-3" />
      <p className="text-slate-600 font-bold animate-pulse">{message}</p>
    </div>
  );
};

const SearchModal = ({ isOpen, onClose, data, onNavigate }) => {
  const [query, setQuery] = useState("");
  if (!isOpen) return null;

  const results = query.length < 2 ? [] : [
    ...data.tasks.filter(t => t.title?.toLowerCase().includes(query.toLowerCase())).map(t => ({ ...t, type: 'Task', label: t.title, sub: t.status })),
    ...data.media.filter(m => m.name?.toLowerCase().includes(query.toLowerCase())).map(m => ({ ...m, type: 'Media', label: m.name, sub: m.phone })),
    ...data.channels.filter(c => c.name?.toLowerCase().includes(query.toLowerCase())).map(c => ({ ...c, type: 'Channel', label: c.name, sub: c.url })),
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center z-[1500] p-4 pt-20 animate-fadeIn" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-slate-100 flex items-center gap-3">
           <Search className="w-6 h-6 text-slate-400" />
           <input 
              autoFocus
              className="flex-1 text-lg outline-none text-slate-700 placeholder:text-slate-300"
              placeholder="ค้นหางาน, เบอร์โทร, หรือช่องทาง..."
              value={query}
              onChange={e => setQuery(e.target.value)}
           />
           <button onClick={onClose} className="p-1 bg-slate-100 rounded-md text-xs text-slate-500">ESC</button>
        </div>
        <div className="max-h-[60vh] overflow-y-auto bg-slate-50/50">
           {results.length > 0 ? (
               <div className="p-2">
                   {results.map((res, idx) => (
                       <div key={idx} className="p-3 hover:bg-blue-50 rounded-lg cursor-pointer flex items-center justify-between group transition" onClick={() => {
                           if(res.type === 'Task') onNavigate('strategy');
                           if(res.type === 'Media' || res.type === 'Channel') onNavigate('assets');
                           onClose();
                       }}>
                           <div>
                               <p className="font-bold text-slate-800 text-sm">{res.label}</p>
                               <p className="text-xs text-slate-500">{res.type} • {res.sub}</p>
                           </div>
                           <span className="text-xs text-blue-600 opacity-0 group-hover:opacity-100">ไปที่หน้า →</span>
                       </div>
                   ))}
               </div>
           ) : query.length > 0 ? (
               <div className="p-10 text-center text-slate-400">ไม่พบข้อมูล "{query}"</div>
           ) : (
               <div className="p-10 text-center text-slate-400 text-sm">พิมพ์คำค้นหาเพื่อเริ่มใช้งาน...</div>
           )}
        </div>
      </div>
    </div>
  );
};

const FormModal = ({ isOpen, onClose, title, fields, onSave, submitText = "บันทึก" }) => {
  const [formData, setFormData] = useState({});
  useEffect(() => {
    if (isOpen) {
      const initialData = {};
      fields.forEach(f => initialData[f.key] = f.defaultValue !== undefined ? f.defaultValue : '');
      setFormData(initialData);
    }
  }, [isOpen, fields]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[1200] p-4 animate-fadeIn overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 transform transition-all scale-100 relative max-h-[90vh] overflow-y-auto custom-scrollbar">
        <button onClick={onClose} className="absolute top-4 right-4 p-1 hover:bg-slate-100 rounded-full transition"><X className="w-5 h-5 text-slate-400" /></button>
        <h3 className="text-xl font-bold text-slate-800 mb-6 pr-8">{title}</h3>
        <div className="space-y-5">
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
                {field.type === 'datalist' && <datalist id={`list-${field.key}`}>{field.options.map(opt => <option key={opt} value={opt} />)}</datalist>}
                {field.key === 'tag' && <div className="mt-3 flex flex-wrap gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100"><p className="text-[10px] text-slate-400 w-full mb-1">เลือก Tag ที่ใช้บ่อย:</p>{PRESET_TAGS.map(tag => <button key={tag} onClick={() => setFormData({...formData, tag: tag})} className={`text-[10px] px-2.5 py-1.5 rounded-full border font-medium transition-all active:scale-95 ${formData.tag === tag ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white text-slate-500 border-slate-200 hover:border-blue-300'}`}>{tag}</button>)}</div>}
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
    <div><h2 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">{title}</h2><p className="text-slate-500 text-sm mt-1 font-medium">{subtitle}</p></div>
    <div className="w-full md:w-auto">{action}</div>
  </div>
);

const StatusBadge = ({ status }) => {
  const styles = {
    "To Do": "bg-slate-100 text-slate-600 border-slate-200",
    "In Progress": "bg-blue-50 text-blue-600 border-blue-100", 
    "In Review": "bg-purple-50 text-purple-600 border-purple-100", 
    "Done": "bg-emerald-50 text-emerald-600 border-emerald-100", 
    "Idea": "bg-yellow-50 text-yellow-600 border-yellow-100",
    "Waiting list": "bg-orange-50 text-orange-600 border-orange-100",
    "Canceled": "bg-gray-50 text-gray-400 border-gray-200 line-through"
  };
  return <span className={`px-2.5 py-1 rounded-md text-[10px] uppercase tracking-wide font-bold border ${styles[status] || "bg-gray-100"}`}>{status}</span>;
};

// --- DONUT CHART LOGIC ---
const StatusDonutChart = ({ stats }) => {
  const total = stats.total || 1; 
  const donePercent = (stats.done / total) * 100;
  const doingPercent = (stats.doing / total) * 100;
  const circumference = 2 * Math.PI * 40;

  return (
    <div className="relative w-48 h-48 flex items-center justify-center">
      <svg className="transform -rotate-90 w-full h-full" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="40" fill="none" className="stroke-slate-200" strokeWidth="12" strokeLinecap="round" />
        <circle cx="50" cy="50" r="40" fill="none" className="stroke-blue-500 transition-all duration-1000 ease-out" strokeWidth="12" 
          strokeDasharray={`${(donePercent + doingPercent) / 100 * circumference} ${circumference}`} strokeLinecap="round" />
        <circle cx="50" cy="50" r="40" fill="none" className="stroke-emerald-500 transition-all duration-1000 ease-out" strokeWidth="12" 
          strokeDasharray={`${(donePercent / 100) * circumference} ${circumference}`} strokeLinecap="round" />
      </svg>
      <div className="absolute text-center">
        <span className="text-4xl font-black text-slate-800">{stats.total}</span>
        <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">ACTIVE TASKS</span>
      </div>
    </div>
  );
};

// --- LOGIN & PROFILE ---
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
      if (!docSnap.exists()) {
         await setDoc(docRef, { phone: "", role: "Member", status: "Active", email: user.email, displayName: user.displayName, photoURL: user.photoURL, createdAt: serverTimestamp() });
      }
    } catch (err) { setError("เข้าสู่ระบบไม่สำเร็จ: " + err.message); }
    setLoading(false);
  };
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 font-sans p-4">
      <div className="bg-white p-10 rounded-3xl shadow-2xl w-full max-w-md border border-white/50 backdrop-blur-sm text-center relative overflow-hidden">
         <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
         <div className="mb-8"><h1 className="text-4xl font-black text-slate-900 tracking-tight">TEAM TAWEE</h1><p className="text-blue-600 font-bold tracking-widest text-xs uppercase mt-2 bg-blue-50 inline-block px-3 py-1 rounded-full">Stand Together</p></div>
         <h2 className="text-xl font-bold text-slate-800 mb-2">ยินดีต้อนรับสู่ระบบ</h2>
         <p className="text-slate-500 text-sm mb-8">ศูนย์ปฏิบัติการและบริหารงานยุทธศาสตร์</p>
         {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4 font-medium border border-red-100">{error}</div>}
         <button onClick={handleGoogleLogin} disabled={loading} className="w-full bg-white border-2 border-slate-200 text-slate-700 font-bold py-3.5 rounded-xl hover:bg-slate-50 hover:border-blue-300 hover:shadow-md transition-all flex items-center justify-center gap-3 group">
            {loading ? <RefreshCw className="w-5 h-5 animate-spin text-blue-600" /> : <svg className="w-5 h-5 transition-transform group-hover:scale-110" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>}
            {loading ? 'กำลังเชื่อมต่อ...' : 'เข้าสู่ระบบด้วย Google'}
         </button>
      </div>
    </div>
  );
};

const PendingScreen = ({ onLogout }) => (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 font-sans p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md text-center">
            <div className="mx-auto bg-amber-100 w-16 h-16 rounded-full flex items-center justify-center mb-4"><Lock className="w-8 h-8 text-amber-600"/></div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">รอการอนุมัติสิทธิ์</h2>
            <p className="text-slate-500 text-sm mb-6">บัญชีของคุณกำลังรอการตรวจสอบจาก Admin</p>
            <button onClick={onLogout} className="text-red-500 font-bold hover:underline text-sm">ออกจากระบบ</button>
        </div>
    </div>
);

const ProfileModal = ({ isOpen, onClose, user, userProfile, onUpdate }) => {
  const [name, setName] = useState(user?.displayName || '');
  const [photo, setPhoto] = useState(user?.photoURL || '');
  const [phone, setPhone] = useState(userProfile?.phone || '');
  useEffect(() => { if(user) { setName(user.displayName||''); setPhoto(user.photoURL||''); setPhone(userProfile?.phone||''); } }, [user, userProfile]);
  const handleSave = async () => { await onUpdate(name, photo, phone); onClose(); };
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[1200] p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-6"><h3 className="text-lg font-bold text-slate-800">แก้ไขข้อมูลส่วนตัว</h3><button onClick={onClose}><X className="w-6 h-6 text-slate-400" /></button></div>
        <div className="space-y-4">
            <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full border p-2.5 rounded-lg" placeholder="ชื่อแสดงผล" />
            <input type="text" value={phone} onChange={e => setPhone(e.target.value)} className="w-full border p-2.5 rounded-lg" placeholder="เบอร์โทรศัพท์" />
            <input type="text" value={photo} onChange={e => setPhoto(e.target.value)} className="w-full border p-2.5 rounded-lg" placeholder="Link รูปโปรไฟล์" />
        </div>
        <button onClick={handleSave} className="w-full mt-6 bg-blue-600 text-white font-bold py-2.5 rounded-lg hover:bg-blue-700">บันทึกข้อมูล</button>
        <button onClick={() => signOut(auth)} className="w-full mt-3 text-red-500 font-bold text-sm hover:underline flex items-center justify-center gap-2"><LogOut className="w-4 h-4" /> ออกจากระบบ</button>
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
  const [usersList, setUsersList] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);

  const [hideDone, setHideDone] = useState(false);
  const [filterTag, setFilterTag] = useState('All');
  const [sortOrder, setSortOrder] = useState('newest'); 
  const [isGlobalLoading, setIsGlobalLoading] = useState(false); 
  const [isDataLoading, setIsDataLoading] = useState(true); 
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const [newsStartDate, setNewsStartDate] = useState('');
  const [newsEndDate, setNewsEndDate] = useState('');
  
  const [editingTask, setEditingTask] = useState(null);
  const [urgentModal, setUrgentModal] = useState(null); 
  const [formModalConfig, setFormModalConfig] = useState({ isOpen: false, title: '', fields: [], onSave: () => {} });
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isDistOpen, setIsDistOpen] = useState(false); 
  const [isSopOpen, setIsSopOpen] = useState(false); 

  // BACK BUTTON FIX & HISTORY
  useEffect(() => {
    const handlePopState = (event) => { if (event.state?.tab) setActiveTab(event.state.tab); else setActiveTab('dashboard'); };
    window.addEventListener('popstate', handlePopState);
    window.history.replaceState({ tab: 'dashboard' }, '', '#dashboard');
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);
  const navigateTo = (tabId) => { if (activeTab === tabId) return; setActiveTab(tabId); window.history.pushState({ tab: tabId }, '', `#${tabId}`); setIsMobileMenuOpen(false); };

  useEffect(() => { document.title = `TEAM TAWEE`; }, [activeTab]);

  // AUTH & DATA
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
    try {
      const unsubLinks = onSnapshot(query(collection(db, "published_links"), orderBy("createdAt", "desc")), (s) => setPublishedLinks(s.docs.map(d => ({ id: d.id, ...d.data() }))));
      let unsubUsers = () => {}, unsubLogs = () => {};
      if (userProfile?.role === 'Admin') {
          unsubUsers = onSnapshot(collection(db, "user_profiles"), (s) => setUsersList(s.docs.map(d => ({ id: d.id, ...d.data() }))));
          unsubLogs = onSnapshot(query(collection(db, "logs"), orderBy("createdAt", "desc")), (s) => setActivityLogs(s.docs.map(d => ({ id: d.id, ...d.data() }))));
      }
      setIsDataLoading(false);
      return () => { unsubTasks(); unsubPlans(); unsubMedia(); unsubChannels(); unsubLinks(); unsubUsers(); unsubLogs(); };
    } catch(e) {
      setIsDataLoading(false);
      return () => { unsubTasks(); unsubPlans(); unsubMedia(); unsubChannels(); };
    }
  }, [currentUser, userProfile]);

  const logActivity = async (action, details) => { try { await addDoc(collection(db, "logs"), { action, details, user: currentUser.displayName || currentUser.email, createdAt: serverTimestamp() }); } catch(e) {} };

  // --- ACTIONS ---
  const handleUpdateProfile = async (n, p, ph) => { if(!currentUser)return; setIsGlobalLoading(true); try{ await updateProfile(currentUser, {displayName:n, photoURL:p}); await setDoc(doc(db,"user_profiles",currentUser.uid), {phone:ph}, {merge:true}); setCurrentUser({...currentUser, displayName:n, photoURL:p}); setUserProfile(prev=>({...prev, phone:ph})); }catch(e){alert(e.message);} setIsGlobalLoading(false); };
  const openFormModal = (title, fields, onSave) => setFormModalConfig({ isOpen:true, title, fields, onSave: async(d)=>{ setIsGlobalLoading(true); try{await onSave(d); setFormModalConfig(prev=>({...prev, isOpen:false}));}catch(e){alert(e.message);} setIsGlobalLoading(false); } });

  const saveTaskChange = async (task) => { if(!task.id)return; setIsGlobalLoading(true); try{ await updateDoc(doc(db,"tasks",task.id), {title:task.title||"", status:task.status||"To Do", tag:task.tag||"", role:task.role||"", link:task.link||"", deadline:task.deadline||"", updatedBy:currentUser.displayName, updatedAt:new Date().toISOString()}); logActivity("Edit Task", task.title); setEditingTask(null); }catch(e){alert(e.message);} setIsGlobalLoading(false); };
  const saveUrgentCase = async (task) => { if(!task.id)return; setIsGlobalLoading(true); try{ await updateDoc(doc(db,"tasks",task.id), {title:task.title||"", status:task.status||"To Do", link:task.link||"", sop:task.sop||[], updatedBy:currentUser.displayName, updatedAt:new Date().toISOString()}); logActivity("Update Urgent", task.title); setUrgentModal(null); }catch(e){alert(e.message);} setIsGlobalLoading(false); };
  
  const addNewTask = (key) => openFormModal("เพิ่มงานใหม่", [{key:'title', label:'ชื่องาน'}, {key:'tag', label:'Tag'}, {key:'role', label:'ผู้รับผิดชอบ'}, {key:'status', label:'สถานะ', type:'select', options: TASK_STATUSES}, {key:'deadline', label:'กำหนดส่ง', type:'date'}, {key:'link', label:'Link ผลงาน'}], async(d)=>{ await addDoc(collection(db,"tasks"), {...d, status:d.status||"To Do", link:d.link||"", columnKey:key, createdBy:currentUser.displayName, createdAt:new Date().toISOString()}); logActivity("Add Task", d.title); });
  const addChannel = () => openFormModal("เพิ่มช่องทาง", [{key:'name', label:'ชื่อ'}, {key:'type', label:'ประเภท', type:'select', options: ASSET_TYPES, defaultValue:'Own media'}, {key:'url', label:'URL'}], async(d)=>{ await addDoc(collection(db,"channels"), {...d, count:0}); logActivity("Add Channel", d.name); });
  const updateChannel = (c) => openFormModal("แก้ไขช่องทาง", [{key:'name', label:'ชื่อ', defaultValue:c.name}, {key:'type', label:'ประเภท', type:'select', options: ASSET_TYPES, defaultValue:c.type}, {key:'url', label:'URL', defaultValue:c.url}], async(d)=>{ await updateDoc(doc(db,"channels",c.id), d); logActivity("Edit Channel", c.name); });
  const addMedia = () => openFormModal("เพิ่มสื่อ", [{key:'name', label:'ชื่อ'}, {key:'type', label:'ประเภท', type:'select', options: ASSET_TYPES, defaultValue:'NEWS Website'}, {key:'phone', label:'เบอร์'}, {key:'line', label:'Line'}], async(d)=>{ await addDoc(collection(db,"media"), {...d, active:true}); logActivity("Add Media", d.name); });
  const editMedia = (c) => openFormModal("แก้ไขสื่อ", [{key:'name', label:'ชื่อ', defaultValue:c.name}, {key:'type', label:'ประเภท', type:'select', options: ASSET_TYPES, defaultValue:c.type}, {key:'phone', label:'เบอร์', defaultValue:c.phone}, {key:'line', label:'Line', defaultValue:c.line}], async(d)=>{ await updateDoc(doc(db,"media",c.id), d); logActivity("Edit Media", c.name); });
  
  // --- ADDED: Auto-Fetch Image/Title Logic in addPublishedLink ---
// ตัวช่วยแปลงวันที่ให้ใส่ในช่องกรอกได้
const formatForInput = (timestamp) => {
  if (!timestamp) return '';
  const d = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const pad = (n) => n < 10 ? '0' + n : n;
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

  const addPublishedLink = () => openFormModal("เพิ่มลิงก์ข่าว", [
    {key:'url', label:'URL ข่าว (วางลิงก์ที่นี่)'},
    {key:'title', label:'หัวข้อข่าว (ว่างไว้เพื่อดึงออโต้)', placeholder: 'ดึงจากลิงก์อัตโนมัติ...'},
    {key:'imageUrl', label:'Link รูปภาพ (ว่างไว้เพื่อดึงออโต้)', placeholder: 'ดึงจากลิงก์อัตโนมัติ...'}, 
    // เพิ่มช่องวันที่ (ถ้าดึงไม่ได้ จะใช้วันปัจจุบัน)
    {key:'customDate', label:'วันที่ลงข่าว', type:'datetime-local', defaultValue: formatForInput(new Date())},
    {key:'platform', label:'Platform', type:'select', options: ['Website', 'Facebook', 'YouTube', 'TikTok', 'Twitter'], defaultValue: 'Website'}
  ], async(d)=>{ 
    let finalData = { ...d };
    let fetchedDate = null;

    // ถ้ามี URL แต่ไม่มี Title หรือ Image -> ให้วิ่งไปดึงข้อมูล
    if (d.url && (!d.title || !d.imageUrl)) {
        const meta = await fetchLinkMetadata(d.url);
        if (meta) {
            if (!finalData.title) finalData.title = meta.title;
            if (!finalData.imageUrl) finalData.imageUrl = meta.image;
            if (meta.date) fetchedDate = new Date(meta.date); // เก็บวันที่ที่ดึงได้
        }
    }
    
    // Logic วันที่: 1.ใช้วันที่ที่ดึงมาได้ -> 2.ถ้าไม่มีใช้วันที่เลือกเอง -> 3.ถ้าไม่มีใช้วันปัจจุบัน
    const createdDate = fetchedDate || (d.customDate ? new Date(d.customDate) : new Date());

    await addDoc(collection(db,"published_links"), {
      title: finalData.title || "No Title",
      url: finalData.url || "",
      imageUrl: finalData.imageUrl || "", 
      platform: finalData.platform || "Website",
      createdBy:currentUser.displayName, 
      createdAt: createdDate // บันทึกวันที่ที่ถูกต้องลงฐานข้อมูล
    }); 
    logActivity("Add Link", finalData.title); 
  });
  
  // --- วางต่อจาก addPublishedLink เดิม ---
  const editPublishedLink = (link) => openFormModal("แก้ไขข่าว", [
    {key:'title', label:'หัวข้อข่าว', defaultValue: link.title},
    {key:'url', label:'URL ข่าว', defaultValue: link.url},
    {key:'imageUrl', label:'Link รูปภาพ', defaultValue: link.imageUrl}, 
    // 🟢 ช่องนี้จะดึงเวลาเดิมมาแสดงให้แก้ง่ายๆ
    {key:'customDate', label:'วันที่ลงข่าว', type:'datetime-local', defaultValue: formatForInput(link.createdAt)},
    {key:'platform', label:'Platform', type:'select', options: ['Website', 'Facebook', 'YouTube', 'TikTok', 'Twitter'], defaultValue: link.platform}
  ], async(d)=>{ 
    
    // แปลงค่าจากช่องกรอกกลับเป็น Date Object
    const newDate = d.customDate ? new Date(d.customDate) : null;

    await updateDoc(doc(db,"published_links",link.id), {
      ...d,
      createdAt: newDate || link.createdAt, // อัปเดตวันที่ใหม่
      updatedAt:serverTimestamp() 
    }); 
    logActivity("Edit Link", d.title); 
  });

  const deleteLink = async (id) => { if(confirm("ลบ?")) { await deleteDoc(doc(db,"published_links",id)); logActivity("Delete Link", id); }};
  const updateDist = async (id, c) => updateDoc(doc(db,"channels",id), {count:Math.max(0,c||0)});
  const deleteChannel = async (id) => { if(confirm("ลบ?")) { await deleteDoc(doc(db,"channels",id)); logActivity("Delete Channel", id); }};
  const toggleMediaActive = async (c) => updateDoc(doc(db,"media",c.id), {active:!c.active});
  const deleteMedia = async (id) => { if(confirm("ลบ?")) { await deleteDoc(doc(db,"media",id)); logActivity("Delete Media", id); }};

  const togglePlanItem = async (pid, idx, items) => { const newItems = [...items]; newItems[idx].completed = !newItems[idx].completed; const progress = Math.round((newItems.filter(i=>i.completed).length/newItems.length)*100); await updateDoc(doc(db,"plans",pid), {items:newItems, progress}); };
  const removePlanItem = async (pid, idx, items) => { if(confirm("ลบ?")) { const newItems = items.filter((_,i)=>i!==idx); const p = Math.round((newItems.filter(i=>i.completed).length/newItems.length)*100)||0; await updateDoc(doc(db,"plans",pid), {items:newItems, progress:p}); }};
  const editPlanItem = (pid, idx, items) => openFormModal("แก้รายการ", [{key:'text', label:'ข้อความ', defaultValue:items[idx].text}], async(d)=> { const newItems=[...items]; newItems[idx].text=d.text; await updateDoc(doc(db,"plans",pid), {items:newItems}); });
  const editPlanTitle = (p) => openFormModal("แก้ชื่อแผน", [{key:'title', label:'ชื่อ', defaultValue:p.title}], async(d)=> updateDoc(doc(db,"plans",p.id), d));
  const addPlan = () => openFormModal("สร้างแผนใหม่", [{key:'title', label:'ชื่อแผน'}], async(d)=> { await addDoc(collection(db,"plans"), {...d, progress:0, items:[]}); logActivity("Create Plan", d.title); });
  const createUrgentCase = () => openFormModal("เปิดเคสด่วน", [{key:'title', label:'หัวข้อ'}, {key:'deadline', label:'เสร็จภายใน', type:'date'}], async(d) => { await addDoc(collection(db,"tasks"), { ...d, status:"To Do", role:"Hunter", tag:"Urgent", link:"", columnKey:"defender", sop:DEFAULT_SOP, createdBy:currentUser.displayName, createdAt:new Date().toISOString() }); alert("เปิดเคสแล้ว!"); logActivity("Open Urgent", d.title); });

  const updateUserStatus = (uid, status, role) => { updateDoc(doc(db, "user_profiles", uid), { status, role }); logActivity("Admin Update", `${uid} -> ${status}`); };

  // --- Sorting Logic ---
  const sortTasks = (taskList) => {
    if(!taskList) return [];
    return [...taskList].sort((a, b) => {
       const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
       const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);

       if(sortOrder === 'newest') return dateB - dateA;
       if(sortOrder === 'oldest') return dateA - dateB;
       if(sortOrder === 'deadline') {
           if(!a.deadline && !b.deadline) return 0;
           if(!a.deadline) return 1; 
           if(!b.deadline) return -1;
           return a.deadline.localeCompare(b.deadline); 
       }
       return 0;
    });
  };

  // Render Data
  const groupedTasks = { solver: sortTasks(tasks.filter(t => t.columnKey === 'solver')), principles: sortTasks(tasks.filter(t => t.columnKey === 'principles')), defender: sortTasks(tasks.filter(t => t.columnKey === 'defender')), expert: sortTasks(tasks.filter(t => t.columnKey === 'expert')), backoffice: sortTasks(tasks.filter(t => t.columnKey === 'backoffice')) };
  const urgentTasks = tasks.filter(t => t.tag === 'Urgent');
  const allTags = ['All', ...new Set([...PRESET_TAGS, ...tasks.map(t => t.tag)].filter(Boolean))];

  const navItems = [
    { id: 'dashboard', title: 'ภาพรวม', subtitle: 'Dashboard', icon: LayoutDashboard },
    { id: 'newsroom', title: 'ห้องข่าว & สื่อ', subtitle: 'Newsroom', icon: Globe, color: 'text-indigo-500' }, 
    { id: 'strategy', title: 'กระดาน 4 แกน', subtitle: 'Strategy', icon: Megaphone },
    { id: 'masterplan', title: 'แผนงานหลัก', subtitle: 'Master Plan', icon: Map },
    { id: 'rapidresponse', title: 'ปฏิบัติการด่วน', subtitle: 'Rapid Response', icon: Zap, color: 'text-red-500' },
    { id: 'assets', title: 'คลังข้อมูลสื่อ', subtitle: 'Media Assets', icon: Database },
  ];
  if(userProfile?.role === 'Admin') navItems.push({ id: 'admin', title: 'ผู้ดูแลระบบ', subtitle: 'Admin & Logs', icon: Shield });

  if (authLoading) return <div className="flex h-screen items-center justify-center bg-slate-50"><RefreshCw className="w-8 h-8 animate-spin text-blue-600" /></div>;
  if (!currentUser) return <LoginScreen />;
  if (userProfile?.status === 'Pending') return <PendingScreen onLogout={() => signOut(auth)} />;

  // --- DASHBOARD: Classic Style (Donut + 3 Columns) ---
  const renderDashboard = () => {
    // 1. Logic การคำนวณ
    const taskStats = { done: 0, doing: 0, waiting: 0, total: 0 };
    tasks.forEach(t => {
      if (t.status !== 'Canceled') {
        taskStats.total++;
        if (t.status === 'Done') taskStats.done++;
        else if (t.status === 'In Progress' || t.status === 'In Review') taskStats.doing++;
        else taskStats.waiting++;
      }
    });

    // 2. ส่วนแสดงผล
    return (
      <div className="space-y-6 animate-fadeIn">
        <PageHeader title="ภาพรวมสถานการณ์" subtitle="Overview & Statistics" action={
          <div className="flex gap-2">
            <button onClick={() => setIsSearchOpen(true)} className="p-2 bg-white border rounded-lg text-slate-500 hover:bg-slate-50">
               <Search className="w-5 h-5"/>
            </button>
            <button onClick={() => addNewTask('solver')} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm hover:bg-blue-700 transition-colors">
              + งานทั่วไป
            </button>
            <button onClick={createUrgentCase} className="bg-red-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-red-700 transition-colors">
              แจ้งเหตุด่วน!
            </button>
          </div>
        } />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Col 1: Donut Chart */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center relative overflow-hidden">
            <p className="text-slate-500 text-xs font-bold uppercase mb-6 w-full text-left">Task Status</p>
            <StatusDonutChart stats={taskStats} />
            <div className="flex justify-center gap-4 mt-6 text-[10px] font-bold w-full flex-wrap">
               <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500"></div>เสร็จ ({taskStats.done})</div>
               <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500"></div>กำลังทำ ({taskStats.doing})</div>
               <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-slate-300"></div>รอ ({taskStats.waiting})</div>
            </div>
          </div>

          {/* Col 2 & 3: Recent Tasks */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col">
             <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-500"/> ความเคลื่อนไหวล่าสุด
             </h3>
             <div className="space-y-3 overflow-y-auto max-h-[300px] custom-scrollbar pr-2">
                {tasks.sort((a,b) => {
    const timeA = a.updatedAt?.seconds || a.createdAt?.seconds || 0;
    const timeB = b.updatedAt?.seconds || b.createdAt?.seconds || 0;
    return timeB - timeA;
}).slice(0, 10).map(t => (
                   <div key={t.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-50 hover:bg-slate-50 transition cursor-pointer" onClick={() => setEditingTask(t)}>
                      <div className="flex items-center gap-3">
                         <div className={`w-2 h-10 rounded-full ${t.status === 'Done' ? 'bg-emerald-500' : t.status === 'In Progress' ? 'bg-blue-500' : 'bg-slate-300'}`}></div>
                         <div>
                            <p className="font-bold text-sm text-slate-700 line-clamp-1">{t.title}</p>
                            <p className="text-[10px] text-slate-400 flex gap-2">
                               <span>{t.role || 'ไม่ระบุผู้รับผิดชอบ'}</span>
                               <span>• {t.updatedAt ? formatDate(t.updatedAt) : 'New'}</span>
                            </p>
                         </div>
                      </div>
                      <StatusBadge status={t.status} />
                   </div>
                ))}
             </div>
          </div>
        </div>

        {/* --- ส่วน Newsroom Preview --- */}
        <div className="pt-6 border-t border-slate-200">
           <div className="flex justify-between items-center mb-4">
               <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <Globe className="w-5 h-5 text-indigo-500"/> ข่าวประชาสัมพันธ์ล่าสุด
               </h3>
               <button onClick={() => navigateTo('newsroom')} className="text-sm text-indigo-600 font-bold hover:underline">
                  ดูทั้งหมด &rarr;
               </button>
           </div>

           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {publishedLinks
                .sort((a,b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
                .slice(0, 4)
                .map(link => (
                  <a key={link.id} href={link.url} target="_blank" rel="noreferrer" className="group bg-white rounded-xl overflow-hidden border border-slate-200 hover:border-indigo-400 hover:shadow-lg transition-all flex flex-col">
                      <div className="aspect-video bg-slate-100 relative overflow-hidden">
                          {link.imageUrl ? (
                             <img src={link.imageUrl} alt={link.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                          ) : (
                             <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                                <FileText className="w-8 h-8 mb-1"/>
                                <span className="text-[10px]">No Image</span>
                             </div>
                          )}
                      </div>
                      <div className="p-3 flex flex-col flex-1">
                          <span className="text-[9px] font-bold text-indigo-500 uppercase mb-1">{link.platform || 'News'}</span>
                          <h4 className="font-bold text-slate-800 text-xs line-clamp-2 mb-2 group-hover:text-indigo-600 transition">
                             {link.title}
                          </h4>
                          <div className="text-[9px] text-slate-400 font-medium mb-2 flex items-center gap-1">
                              <LinkIcon className="w-2.5 h-2.5" />
                              {getDomain(link.url)}
                          </div>
                          <div className="mt-auto flex items-center gap-1 text-[9px] text-slate-400">
                             <Clock className="w-3 h-3"/> {link.createdAt ? formatDate(link.createdAt).split(' ')[0] : '-'}
                          </div>
                      </div>
                  </a>
              ))}
              {publishedLinks.length === 0 && (
                  <div className="col-span-4 p-8 text-center border-2 border-dashed border-slate-200 rounded-xl text-slate-400">
                      ยังไม่มีข่าวประชาสัมพันธ์
                  </div>
              )}
           </div>
        </div>

        {/* 🟢 ส่วนที่เพิ่มเข้ามา: หน้าต่าง Popup แก้ไขงาน */}
        {editingTask && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[1200] p-4 animate-fadeIn">
                <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative">
                    <button onClick={() => setEditingTask(null)} className="absolute top-4 right-4 p-1 hover:bg-slate-100 rounded-full"><X className="w-5 h-5 text-slate-400" /></button>
                    <h3 className="font-bold text-xl text-slate-800 mb-6">แก้ไขงาน</h3>
                    <div className="space-y-4">
                        <input type="text" value={editingTask.title} onChange={e=>setEditingTask({...editingTask, title:e.target.value})} className="w-full border-2 border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:border-blue-500" />
                        <div>
                            <input type="text" value={editingTask.tag} onChange={e=>setEditingTask({...editingTask, tag:e.target.value})} className="w-full border-2 border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:border-blue-500" placeholder="Tag..." />
                            <div className="mt-2 flex flex-wrap gap-2">{PRESET_TAGS.slice(0,5).map(t=><button key={t} onClick={()=>setEditingTask({...editingTask, tag:t})} className="text-[10px] bg-slate-100 px-2 py-1 rounded border hover:bg-blue-100">{t}</button>)}</div>
                        </div>
                        <input type="text" value={editingTask.role||""} onChange={e=>setEditingTask({...editingTask, role:e.target.value})} className="w-full border-2 border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:border-blue-500" placeholder="ผู้รับผิดชอบ" />
                        <div className="grid grid-cols-2 gap-4">
                            <select value={editingTask.status} onChange={e=>setEditingTask({...editingTask, status:e.target.value})} className="w-full border-2 border-slate-200 rounded-lg p-2.5 text-sm"><option>To Do</option><option>In Progress</option><option>In Review</option><option>Done</option><option>Idea</option><option>Waiting list</option><option>Canceled</option></select>
                            <input type="date" value={editingTask.deadline} onChange={e=>setEditingTask({...editingTask, deadline:e.target.value})} className="w-full border-2 border-slate-200 rounded-lg p-2.5 text-sm" />
                        </div>
                        <input type="text" value={editingTask.link} onChange={e=>setEditingTask({...editingTask, link:e.target.value})} className="w-full border-2 border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:border-blue-500" placeholder="Link..." />
                        <div className="flex justify-between pt-4">
                            <button onClick={async()=>{if(confirm("ลบ?")){setIsGlobalLoading(true); await deleteDoc(doc(db,"tasks",editingTask.id)); logActivity("Delete Task", editingTask.title); setIsGlobalLoading(false); setEditingTask(null);}}} className="text-red-500 text-sm font-bold flex items-center gap-1"><Trash2 className="w-4 h-4"/> ลบ</button>
                            <button onClick={()=>saveTaskChange(editingTask)} className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold shadow hover:bg-blue-700">บันทึก</button>
                        </div>
                    </div>
                </div>
            </div>
        )}

      </div>
    );
  };

  const renderContent = () => {
    if (isDataLoading) return <div className="flex h-64 items-center justify-center text-slate-400"><RefreshCw className="w-6 h-6 animate-spin mr-2"/> Loading Database...</div>;

    switch (activeTab) {
      case 'dashboard': return renderDashboard();
      case 'admin':
        if(userProfile?.role !== 'Admin') return <div className="p-10 text-center text-red-500">Access Denied</div>;
        return (
          <div className="space-y-6 animate-fadeIn">
              <PageHeader title="ผู้ดูแลระบบ (Admin)" subtitle="User Management & System Logs" />
              <div className="flex flex-col lg:flex-row gap-6">
                 <div className="w-full lg:w-1/2 space-y-6">
                     <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                         <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Users className="w-5 h-5"/> สมาชิก ({usersList.length})</h3>
                         <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
                             {usersList.map(u => (
                                 <div key={u.id} className="flex items-center justify-between p-3 border rounded-lg bg-slate-50">
                                     <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-600">{u.displayName?.[0] || "U"}</div><div><p className="text-sm font-bold">{u.displayName || u.email}</p><p className="text-xs text-slate-500">{u.email} • {u.role}</p></div></div>
                                     <div className="flex gap-2">{u.status === 'Pending' && <button onClick={()=>updateUserStatus(u.id, 'Active', 'Member')} className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded font-bold hover:bg-green-200">อนุมัติ</button>}{u.role !== 'Admin' && <button onClick={()=>updateUserStatus(u.id, 'Active', 'Admin')} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded font-bold hover:bg-blue-200">ตั้งเป็น Admin</button>}</div>
                                 </div>
                             ))}
                         </div>
                     </div>
                 </div>
                 <div className="w-full lg:w-1/2 bg-slate-900 text-slate-300 p-6 rounded-xl border border-slate-800 shadow-sm h-fit">
                     <h3 className="font-bold text-white mb-4 flex items-center gap-2"><FileClock className="w-5 h-5"/> Activity Logs</h3>
                     <div className="space-y-2 text-xs font-mono max-h-96 overflow-y-auto custom-scrollbar">
                         {activityLogs.map(log => (
                             <div key={log.id} className="border-b border-slate-800 pb-2 mb-2 last:border-0">
                                 <span className="text-slate-500">{log.createdAt ? formatDate(log.createdAt) : '-'}</span>
                                 <p className="text-white font-bold mt-0.5">[{log.user}] {log.action}</p>
                                 <p className="opacity-70">{log.details}</p>
                             </div>
                         ))}
                     </div>
                 </div>
              </div>
          </div>
        );

      case 'strategy': return renderStrategy();
      case 'masterplan': return renderMasterPlan();
      case 'rapidresponse': return renderRapidResponse();
      case 'assets': return renderAssets();
      case 'newsroom': return renderNewsroom();
      default: return null;
    }
  };

  // --- SUB-RENDERERS ---
  const renderStrategy = () => (
      <div className="h-full flex flex-col">
        <PageHeader title="กระดานยุทธศาสตร์ 4 แกน" subtitle="Strategy Board & Tasks" action={<div className="flex gap-3"><div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200"><ArrowDownWideNarrow className="w-4 h-4 text-slate-500" /><select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} className="bg-transparent text-sm border-none focus:ring-0 cursor-pointer outline-none"><option value="newest">ล่าสุด (Newest)</option><option value="oldest">เก่าสุด (Oldest)</option><option value="deadline">ใกล้กำหนดส่ง (Deadline)</option></select></div><div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200"><Filter className="w-4 h-4 text-slate-500" /><select value={filterTag} onChange={(e) => setFilterTag(e.target.value)} className="bg-transparent text-sm border-none focus:ring-0 cursor-pointer outline-none"><option value="All">All Tags</option>{allTags.filter(t=>t!=='All').map(tag => <option key={tag} value={tag}>{tag}</option>)}</select></div><button onClick={() => setHideDone(!hideDone)} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold border transition ${hideDone ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-white text-slate-600 border-slate-300'}`}>{hideDone ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />} {hideDone ? "Show Done" : "Hide Done"}</button></div>} />
        <div className="overflow-x-auto pb-4 flex-1 custom-scrollbar"><div className="flex flex-col md:flex-row gap-4 min-w-full md:min-w-[1200px] h-full">{['solver', 'principles', 'defender', 'expert', 'backoffice'].map((key) => (<div key={key} className={`w-full md:w-1/5 bg-white rounded-2xl p-4 border border-slate-200 flex flex-col shadow-sm`}><div className="mb-3 pb-2 border-b border-slate-100"><h3 className="font-black text-slate-800 text-sm uppercase tracking-wide truncate">{COLUMN_LABELS[key]}</h3><p className="text-[10px] text-slate-500 line-clamp-1">{COL_DESCRIPTIONS[key]}</p></div><div className="space-y-3 overflow-y-auto max-h-[60vh] pr-1 custom-scrollbar flex-1">{groupedTasks[key]?.filter(t => (!hideDone || t.status !== 'Done') && (filterTag === 'All' || t.tag === filterTag)).map(task => (<div key={task.id} onClick={() => setEditingTask(task)} className={`bg-white p-4 rounded-xl shadow-sm border border-slate-100 hover:shadow-md hover:border-blue-400 transition-all cursor-pointer relative`}><div className="flex justify-between items-start mb-3"><span className={`text-[9px] font-bold uppercase text-blue-600 bg-blue-50 px-2 py-1 rounded-md`}>{task.tag}</span><StatusBadge status={task.status} /></div><h4 className="text-sm font-bold text-slate-800 mb-2 leading-snug">{task.title}</h4>{task.deadline && <div className="flex items-center gap-1.5 text-[10px] text-red-500 font-bold mt-3"><Clock className="w-3 h-3" /> {task.deadline}</div>}<div className="mt-2 pt-2 border-t border-slate-50 text-[9px] text-slate-400 flex flex-col gap-0.5"><span className="flex items-center gap-1"><User className="w-3 h-3" /> {task.role || task.createdBy}</span>{task.updatedBy && <span className="flex items-center gap-1 text-blue-400"><Edit2 className="w-3 h-3" /> {formatDate(task.updatedAt)}</span>}</div></div>))}<button onClick={() => addNewTask(key)} className="w-full py-3 text-sm text-slate-400 border-2 border-dashed border-slate-200 hover:border-blue-300 rounded-xl hover:bg-blue-50 transition-all flex items-center justify-center gap-2 font-bold"><Plus className="w-4 h-4" /> เพิ่มงาน</button></div></div>))}</div></div>
        {editingTask && <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[1200] p-4 animate-fadeIn"><div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative"><button onClick={() => setEditingTask(null)} className="absolute top-4 right-4 p-1 hover:bg-slate-100 rounded-full"><X className="w-5 h-5 text-slate-400" /></button><h3 className="font-bold text-xl text-slate-800 mb-6">แก้ไขงาน</h3><div className="space-y-4"><input type="text" value={editingTask.title} onChange={e=>setEditingTask({...editingTask, title:e.target.value})} className="w-full border-2 border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:border-blue-500" /><div><input type="text" value={editingTask.tag} onChange={e=>setEditingTask({...editingTask, tag:e.target.value})} className="w-full border-2 border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:border-blue-500" placeholder="Tag..." /><div className="mt-2 flex flex-wrap gap-2">{PRESET_TAGS.slice(0,5).map(t=><button key={t} onClick={()=>setEditingTask({...editingTask, tag:t})} className="text-[10px] bg-slate-100 px-2 py-1 rounded border hover:bg-blue-100">{t}</button>)}</div></div><input type="text" value={editingTask.role||""} onChange={e=>setEditingTask({...editingTask, role:e.target.value})} className="w-full border-2 border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:border-blue-500" placeholder="ผู้รับผิดชอบ" /><div className="grid grid-cols-2 gap-4"><select value={editingTask.status} onChange={e=>setEditingTask({...editingTask, status:e.target.value})} className="w-full border-2 border-slate-200 rounded-lg p-2.5 text-sm"><option>To Do</option><option>In Progress</option><option>In Review</option><option>Done</option><option>Idea</option><option>Waiting list</option><option>Canceled</option></select><input type="date" value={editingTask.deadline} onChange={e=>setEditingTask({...editingTask, deadline:e.target.value})} className="w-full border-2 border-slate-200 rounded-lg p-2.5 text-sm" /></div><input type="text" value={editingTask.link} onChange={e=>setEditingTask({...editingTask, link:e.target.value})} className="w-full border-2 border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:border-blue-500" placeholder="Link..." /><div className="flex justify-between pt-4"><button onClick={async()=>{if(confirm("ลบ?")){setIsGlobalLoading(true); await deleteDoc(doc(db,"tasks",editingTask.id)); logActivity("Delete Task", editingTask.title); setIsGlobalLoading(false); setEditingTask(null);}}} className="text-red-500 text-sm font-bold flex items-center gap-1"><Trash2 className="w-4 h-4"/> ลบ</button><button onClick={()=>saveTaskChange(editingTask)} className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold shadow hover:bg-blue-700">บันทึก</button></div></div></div></div>}
      </div>
  );

  const renderMasterPlan = () => (
    <div className="space-y-6">
        <PageHeader title="แผนงานหลัก (Master Plan)" subtitle="Long-term Roadmap" action={<button onClick={addPlan} className="bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-700 transition flex items-center gap-2"><Plus className="w-4 h-4" /> สร้างแผนใหม่</button>} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {plans.map((plan) => {
                const sortedItems = [...(plan.items || [])].map((item, idx) => ({ ...item, originalIndex: idx })).sort((a, b) => Number(a.completed) - Number(b.completed));
                return (
                    <div key={plan.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition">
                        <div className="flex justify-between items-start mb-6">
                            <div className="flex items-center gap-2 cursor-pointer" onClick={() => editPlanTitle(plan)}><h3 className="font-bold text-lg text-slate-800">{plan.title}</h3><Edit2 className="w-4 h-4 text-slate-300 hover:text-blue-600" /></div>
                            <button onClick={async () => { if(confirm("ลบแผนนี้?")) { await deleteDoc(doc(db, "plans", plan.id)); logActivity("Delete Plan", plan.title); }}} className="text-slate-300 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                        </div>
                        <div className="mb-6"><div className="w-full bg-slate-100 rounded-full h-2.5"><div className="bg-blue-600 h-2.5 rounded-full transition-all duration-1000" style={{ width: `${plan.progress || 0}%` }}></div></div></div>
                        <ul className="space-y-1">
                            {sortedItems.map((item, idx) => (
                                <li key={idx} className={`flex items-center justify-between gap-3 text-sm p-2 rounded-lg hover:bg-slate-50 transition ${item.completed ? 'opacity-50' : ''}`}>
                                    <div className="flex items-center gap-3 cursor-pointer flex-1" onClick={() => togglePlanItem(plan.id, item.originalIndex, plan.items)}>
                                        {item.completed ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <Circle className="w-5 h-5 text-slate-300" />}
                                        <span className={item.completed ? "line-through" : ""}>{item.text}</span>
                                    </div>
                                    <div className="flex gap-2 relative z-10">
                                        <button onClick={(e) => { e.stopPropagation(); editPlanItem(plan.id, item.originalIndex, plan.items); }}><Edit2 className="w-3.5 h-3.5 text-slate-400 hover:text-blue-600" /></button>
                                        <button onClick={(e) => { e.stopPropagation(); removePlanItem(plan.id, item.originalIndex, plan.items); }}><Trash2 className="w-3.5 h-3.5 text-slate-400 hover:text-red-600" /></button>
                                    </div>
                                </li>
                            ))}
                            <li className="pt-2"><button onClick={() => openFormModal("เพิ่มรายการ", [{key:'text', label:'รายการ'}], async(d)=> { const newItems=[...(plan.items||[]), {text:d.text, completed:false}]; await updateDoc(doc(db,"plans",plan.id), {items:newItems, progress:Math.round((newItems.filter(i=>i.completed).length/newItems.length)*100)}); logActivity("Add Plan Item", d.text); })} className="w-full text-center text-xs text-blue-600 font-bold hover:bg-blue-50 py-2 rounded-lg transition border border-dashed border-blue-200">+ เพิ่มรายการ</button></li>
                        </ul>
                    </div>
                )
            })}
        </div>
    </div>
  );

  const renderRapidResponse = () => (
    <div className="space-y-6">
        <PageHeader title="ปฏิบัติการด่วน" subtitle="Agile Response Unit" action={<button onClick={createUrgentCase} className="bg-red-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-red-700 shadow-lg flex items-center gap-2"><AlertTriangle className="w-5 h-5" /> เปิดเคสด่วน</button>} />
        <div className="flex flex-col lg:flex-row gap-6">
            <div className={`lg:w-1/3 bg-white rounded-2xl border border-slate-200 shadow-sm h-fit overflow-hidden`}>
                <div className="p-4 bg-slate-50 font-bold text-slate-800 flex items-center gap-2 cursor-pointer" onClick={()=>setIsSopOpen(!isSopOpen)}><FileText className="w-5 h-5"/> SOP Guide (คู่มือ) <ChevronDown className={`ml-auto transform ${isSopOpen?'rotate-180':''}`}/></div>
                {isSopOpen && <div className="p-6 space-y-3 text-sm text-slate-600">{SOP_GUIDE.map((s,i)=><p key={i}>{s}</p>)}</div>}
            </div>
            <div className="lg:w-2/3 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {urgentTasks.map(task => (
                        <div key={task.id} className="bg-white p-5 rounded-2xl border-l-[6px] border-red-500 shadow-sm hover:shadow-md cursor-pointer" onClick={() => setUrgentModal(task)}>
                            <div className="flex justify-between mb-3"><span className="text-[10px] font-bold text-white bg-red-500 px-2 py-0.5 rounded animate-pulse">URGENT</span><StatusBadge status={task.status} /></div>
                            <h3 className="font-bold text-slate-800 mb-3 text-lg">{task.title}</h3>
                            {task.deadline && <p className="text-xs text-slate-500 mb-4 flex gap-1"><Clock className="w-3.5 h-3.5"/> {task.deadline}</p>}
                            <div className="pt-3 border-t border-slate-100">
                                <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Progress Checklist</p>
                                <div className="flex gap-1.5 h-2">
                                    {(task.sop && task.sop.length > 0 ? task.sop : Array(5).fill({done:false})).map((s, i) => (
                                    <div key={i} className={`flex-1 rounded-full transition-all ${s.done ? 'bg-green-500 shadow-sm' : 'bg-slate-200'}`}></div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mt-4">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">Quick Contacts</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{media.filter(c=>c.active).map((c,i)=><div key={i} className="p-4 border rounded-xl flex justify-between group"><div className="flex flex-col"><p className="font-bold text-sm">{c.name}</p><div className="text-xs text-slate-500 flex flex-col gap-1 mt-1"><span>📞 {c.phone}</span><span>LINE: {c.line}</span></div></div><button onClick={(e)=>{e.stopPropagation(); editMedia(c)}} className="text-slate-300 hover:text-blue-600"><Edit2 className="w-4 h-4"/></button></div>)}</div>
                    <button onClick={() => navigateTo('assets')} className="text-xs text-blue-600 font-bold hover:underline mt-4 block w-full text-center border-t border-slate-100 pt-3">ดูรายชื่อทั้งหมด</button>
                </div>
            </div>
        </div>
        {urgentModal && <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg p-6 relative">
                <button onClick={()=>setUrgentModal(null)} className="absolute top-4 right-4"><X className="w-6 h-6 text-slate-400"/></button>
                <h3 className="text-xl font-bold text-red-600 mb-6">จัดการเคสด่วน</h3>
                <div className="space-y-4">
                    <input type="text" value={urgentModal.title} onChange={e=>setUrgentModal({...urgentModal, title:e.target.value})} className="w-full border-2 border-slate-200 rounded-xl p-3 font-bold" />
                    <div className="bg-slate-50 p-4 rounded-xl border"><h4 className="font-bold mb-3">Checklist</h4>{(urgentModal.sop || DEFAULT_SOP).map((s,i)=><div key={i} className="flex gap-3 p-2 cursor-pointer" onClick={()=>{const newSop=[...(urgentModal.sop || DEFAULT_SOP)]; newSop[i] = { ...newSop[i], done: !newSop[i].done }; setUrgentModal({...urgentModal, sop:newSop})}}><div className={`w-5 h-5 rounded border flex items-center justify-center ${s.done?'bg-green-500 text-white':'bg-white'}`}>{s.done&&<CheckCircle2 className="w-3.5 h-3.5"/>}</div><span className={s.done?'line-through text-slate-400':''}>{s.text}</span></div>)}</div>
                    <div className="flex justify-between mt-6"><button onClick={async()=>{if(confirm("ปิดเคส?")){await deleteDoc(doc(db,"tasks",urgentModal.id)); logActivity("Close Case", urgentModal.title); setUrgentModal(null);}}} className="text-red-500 font-bold">ลบเคส</button><button onClick={()=>saveUrgentCase(urgentModal)} className="bg-red-600 text-white px-6 py-2 rounded-lg font-bold">บันทึก</button></div>
                </div>
            </div>
        </div>}
    </div>
  );

  const renderAssets = () => (
      <div className="space-y-6">
          <PageHeader title="คลังข้อมูลสื่อ" subtitle="Media Assets" />
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-8 rounded-2xl shadow-lg text-white flex justify-between items-center">
              <div><h3 className="text-2xl font-black mb-2">Google Drive</h3><p className="text-blue-100">พื้นที่เก็บไฟล์ต้นฉบับ</p></div>
              <a href="https://drive.google.com/drive/folders/0AHTNNQ96Wgq-Uk9PVA" target="_blank" rel="noreferrer" className="bg-white text-blue-700 px-6 py-3 rounded-xl font-bold shadow-xl flex items-center gap-2"><ExternalLink className="w-5 h-5"/> เปิด Drive</a>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex justify-between mb-6"><h3 className="font-bold text-lg">Channels</h3><button onClick={addChannel} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-bold">+ เพิ่ม</button></div>
                  <div className="space-y-3">{channels.map(c=><div key={c.id} className="flex justify-between p-4 border rounded-xl hover:shadow-md cursor-pointer" onClick={()=>updateChannel(c)}><div><p className="font-bold text-slate-700">{c.name}</p><span className="text-xs bg-slate-100 px-2 py-0.5 rounded">{c.type}</span></div><button onClick={(e)=>{e.stopPropagation(); deleteChannel(c.id)}}><Trash2 className="w-5 h-5 text-slate-300 hover:text-red-500"/></button></div>)}</div>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex justify-between mb-6"><h3 className="font-bold text-lg">Media List</h3><button onClick={addMedia} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-bold">+ เพิ่ม</button></div>
                  <div className="space-y-3 overflow-y-auto max-h-[500px]">{media.map(c=><div key={c.id} className="flex justify-between p-4 border rounded-xl hover:shadow-md"><div><p className="font-bold text-slate-700">{c.name}</p><div className="text-xs text-slate-500 mt-1 flex gap-2"><span>📞 {c.phone}</span><span>LINE: {c.line}</span></div></div><div className="flex gap-2"><button onClick={()=>editMedia(c)}><Edit2 className="w-4 h-4 text-slate-300 hover:text-blue-600"/></button><button onClick={()=>deleteMedia(c.id)}><Trash2 className="w-4 h-4 text-slate-300 hover:text-red-500"/></button></div></div>)}</div>
              </div>
          </div>
      </div>
  );

  const renderNewsroom = () => {
    // 1. Filter ข้อมูลตามวันที่เลือก
    let filteredLinks = publishedLinks;
    if (newsStartDate && newsEndDate) {
      const start = new Date(newsStartDate).setHours(0,0,0,0);
      const end = new Date(newsEndDate).setHours(23,59,59,999);
      filteredLinks = publishedLinks.filter(l => {
        if(!l.createdAt) return false;
        const d = l.createdAt.getTime();
        return d >= start && d <= end;
      });
    }

    // 2. Group ข้อมูลตาม Week -> Day
    const groupedData = {};
    filteredLinks.forEach(link => {
        if (!link.createdAt) return;
        const dateObj = link.createdAt;
        const weekKey = `${getWeekNumber(dateObj)} (${dateObj.getFullYear()})`;
        const dayKey = dateObj.toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long' });

        if (!groupedData[weekKey]) groupedData[weekKey] = {};
        if (!groupedData[weekKey][dayKey]) groupedData[weekKey][dayKey] = [];
        groupedData[weekKey][dayKey].push(link);
    });

    return (
      <div className="space-y-6 animate-fadeIn pb-20">
        <PageHeader title="ห้องข่าว & สื่อประชาสัมพันธ์" subtitle="Newsroom & Public Relations" 
          action={
            <div className="flex flex-wrap items-end gap-3 bg-white p-2 rounded-xl border shadow-sm">
                <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400 font-bold ml-1">ตั้งแต่วันที่</span>
                    <input type="date" value={newsStartDate} onChange={e=>setNewsStartDate(e.target.value)} className="text-xs border rounded-lg p-1.5 outline-none focus:border-blue-500 text-slate-600"/>
                </div>
                <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400 font-bold ml-1">ถึงวันที่</span>
                    <input type="date" value={newsEndDate} onChange={e=>setNewsEndDate(e.target.value)} className="text-xs border rounded-lg p-1.5 outline-none focus:border-blue-500 text-slate-600"/>
                </div>
                <button onClick={() => {setNewsStartDate(''); setNewsEndDate('');}} className="p-2 text-slate-400 hover:text-red-500" title="ล้างค่า"><RefreshCw className="w-4 h-4"/></button>
                <div className="w-px h-8 bg-slate-200 mx-1"></div>
                <button onClick={addPublishedLink} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-blue-700 shadow-md flex items-center gap-2 h-fit mb-0.5"><Plus className="w-4 h-4" /> เพิ่มข่าว</button>
            </div>
          } 
        />

        {Object.keys(groupedData).length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 bg-white rounded-2xl border border-dashed border-slate-300 text-slate-400">
                <Globe className="w-12 h-12 mb-3 opacity-20"/>
                <p>ไม่พบข้อมูลข่าวในช่วงเวลาที่เลือก</p>
                <button onClick={addPublishedLink} className="mt-4 text-blue-600 font-bold hover:underline text-sm">+ เพิ่มข่าวแรกของคุณ</button>
            </div>
        ) : (
            Object.keys(groupedData).sort((a,b) => b.localeCompare(a)).map(week => ( 
                <div key={week} className="bg-white/50 rounded-3xl p-6 border border-slate-200/60 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 bg-blue-600 text-white text-xs font-black px-4 py-1.5 rounded-br-2xl shadow-sm z-10">
                        {week}
                    </div>
                    
                    <div className="space-y-8 mt-4">
                        {Object.keys(groupedData[week]).sort((a,b) => b.localeCompare(a)).map(day => (
                            <div key={day}>
                                <h3 className="flex items-center gap-2 text-slate-700 font-bold mb-4 pb-2 border-b border-slate-200">
                                    <Calendar className="w-4 h-4 text-blue-500"/> {day}
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {groupedData[week][day].map(link => (
                                        <div key={link.id} className="group bg-white rounded-xl overflow-hidden border border-slate-100 hover:border-blue-300 hover:shadow-xl transition-all duration-300 flex flex-col h-full">
                                            <div className="aspect-video bg-slate-100 relative overflow-hidden">
                                                {link.imageUrl ? (
                                                    <img src={link.imageUrl} alt={link.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                                ) : (
                                                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                                                        <FileText className="w-10 h-10 mb-1"/>
                                                        <span className="text-[10px]">No Image</span>
                                                    </div>
                                                )}
                                                <a href={link.url} target="_blank" rel="noreferrer" className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                                    <ExternalLink className="w-8 h-8 text-white drop-shadow-md"/>
                                                </a>
                                            </div>
                                            
                                            <div className="p-4 flex flex-col flex-1">
                                                <div className="flex justify-between items-start mb-2">
    <span className="bg-blue-50 text-blue-600 text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wide">{link.platform || 'News'}</span>
    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition">
        {/* ปุ่มแก้ไข (ใหม่) */}
        <button onClick={()=>editPublishedLink(link)} className="text-slate-300 hover:text-blue-500" title="แก้ไข">
            <Edit2 className="w-3.5 h-3.5"/>
        </button>
        {/* ปุ่มลบ (เดิม) */}
        <button onClick={()=>deleteLink(link.id)} className="text-slate-300 hover:text-red-500" title="ลบ">
            <Trash2 className="w-3.5 h-3.5"/>
        </button>
    </div>
</div>
                                                <a href={link.url} target="_blank" rel="noreferrer" className="font-bold text-slate-800 text-sm leading-snug line-clamp-2 hover:text-blue-600 transition mb-2">
                                                    {link.title}
                                                </a>

                                                {/* 🟢 (ส่วนที่เพิ่มใหม่: แสดงชื่อเว็บ) */}
                                                <div className="text-[10px] text-slate-400 font-medium mb-3 flex items-center gap-1">
                                                    <LinkIcon className="w-3 h-3" />
                                                    {getDomain(link.url)}
                                                </div>

                                                <div className="mt-auto pt-3 border-t border-slate-50 flex justify-between items-center text-[10px] text-slate-400">
                                                    <span>{formatDate(link.createdAt)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col md:flex-row">
      <LoadingOverlay isOpen={isGlobalLoading} />
      <FormModal {...formModalConfig} onClose={() => setFormModalConfig(prev => ({ ...prev, isOpen: false }))} />
      <SearchModal isOpen={isSearchOpen} onClose={()=>setIsSearchOpen(false)} data={{tasks, media, channels}} onNavigate={navigateTo} />
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