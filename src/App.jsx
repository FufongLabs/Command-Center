import React, { useState, useEffect } from 'react';
import { db } from './firebaseConfig'; 
import { 
  collection, addDoc, onSnapshot, updateDoc, deleteDoc, doc, 
  query, orderBy, writeBatch 
} from 'firebase/firestore';

import { 
  LayoutDashboard, Megaphone, Map, Zap, Database, Users, Menu, X, Activity, 
  Calendar, CheckCircle2, Circle, Clock, ExternalLink, Eye, FileText, Share2, Plus, 
  Minus, Link as LinkIcon, Trash2, Edit2, ChevronDown, ChevronUp, Filter, RefreshCw, Save
} from 'lucide-react';

// --- MOCK DATA (โครงสร้างใหม่ รองรับ Checkbox) ---
const initialMockData = {
  tasks: [
    { title: "อัลบั้มภาพ: ลงพื้นที่น้ำท่วมเชียงราย", role: "Chef", status: "In Progress", tag: "Visual Storytelling", link: "", columnKey: "solver" },
    { title: "ร่วมงานบุญบั้งไฟ จ.ยโสธร", role: "Hunter", status: "To Do", tag: "Tradition", link: "", columnKey: "solver" },
    { title: "Quote: ความยุติธรรมที่มาช้า...", role: "Distributor", status: "Done", tag: "Viral", link: "", columnKey: "principles" },
    { title: "ชี้แจงประเด็น พ.ร.บ. งบประมาณ", role: "Hunter", status: "To Do", tag: "Urgent", link: "", columnKey: "defender" },
    { title: "Deep Dive: วิเคราะห์ปัญหายาเสพติด", role: "Chef", status: "In Review", tag: "Knowledge", link: "", columnKey: "expert" },
    { title: "สรุปยอดค่าใช้จ่ายยิง Ads", role: "Admin", status: "Done", tag: "Report", link: "", columnKey: "backoffice" }
  ],
  distribution: [
    { name: "Facebook Page (Official)", count: 5, type: "Own Media" },
    { name: "TikTok Team Tawee", count: 3, type: "Own Media" },
    { name: "Twitter (X)", count: 8, type: "Own Media" },
    { name: "ข่าวสดออนไลน์", count: 1, type: "Media" },
    { name: "เพจ FC คนรักทวี", count: 12, type: "FC" }
  ],
  plans: [
    { 
      title: "Roadmap สู่การเลือกตั้ง (Election)", 
      progress: 60, 
      items: [
        { text: "เปิดตัวผู้สมัครครบทุกเขต", completed: true },
        { text: "Grand Opening นโยบายหลัก", completed: false }
      ] 
    },
    { 
      title: "แผนนำเสนอ 'ผู้เชี่ยวชาญ' (Expert Plan)", 
      progress: 30, 
      items: [
        { text: "รายการ YouTube Weekly", completed: false }, 
        { text: "หนังสือ Pocket book", completed: false }
      ] 
    },
    { 
      title: "แผนลงพื้นที่เชิงรุก (Solver Plan)", 
      progress: 80, 
      items: [
        { text: "คาราวานแก้หนี้ 4 ภาค", completed: true }
      ] 
    }
  ]
};

// --- COMPONENTS ---

// 1. Modal สวยๆ สำหรับแก้ไขข้อความ (แทน window.prompt)
const InputModal = ({ isOpen, onClose, onSave, title, initialValue, placeholder }) => {
  const [value, setValue] = useState(initialValue);
  
  useEffect(() => { setValue(initialValue); }, [initialValue, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 transform transition-all scale-100">
        <h3 className="text-lg font-bold text-slate-800 mb-4">{title}</h3>
        <input 
          autoFocus
          type="text" 
          value={value} 
          onChange={(e) => setValue(e.target.value)}
          className="w-full border-2 border-slate-200 rounded-xl p-3 text-slate-700 focus:border-blue-500 focus:outline-none transition-colors"
          placeholder={placeholder}
          onKeyDown={(e) => { if(e.key === 'Enter') onSave(value); }}
        />
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-5 py-2.5 text-slate-500 font-bold hover:bg-slate-100 rounded-lg transition-colors">ยกเลิก</button>
          <button onClick={() => onSave(value)} className="px-5 py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all">บันทึก</button>
        </div>
      </div>
    </div>
  );
};

const StatusBadge = ({ status }) => {
  const colors = {
    "To Do": "bg-slate-100 text-slate-600",
    "In Progress": "bg-blue-100 text-blue-600",
    "In Review": "bg-yellow-100 text-yellow-700",
    "Done": "bg-green-100 text-green-700",
    "Urgent": "bg-red-100 text-red-600 font-bold"
  };
  return <span className={`px-2 py-0.5 rounded text-[10px] uppercase tracking-wide font-semibold ${colors[status] || "bg-gray-100"}`}>{status}</span>;
};

const SimplePieChart = ({ done, total }) => {
  const percentage = total === 0 ? 0 : (done / total) * 100;
  const circumference = 2 * Math.PI * 16;
  return (
    <div className="relative w-32 h-32 flex items-center justify-center">
      <svg className="transform -rotate-90 w-full h-full" viewBox="0 0 36 36">
        <path className="text-slate-100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
        <path className="text-blue-600 transition-all duration-1000 ease-out" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray={`${(percentage / 100) * circumference} ${circumference}`} />
      </svg>
      <div className="absolute text-center">
        <span className="text-2xl font-bold text-slate-800">{Math.round(percentage)}%</span>
        <span className="block text-[10px] text-slate-400">COMPLETED</span>
      </div>
    </div>
  );
};

export default function TeamTaweeApp() {
  // --- STATE ---
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState('week3-nov');
  
  // Data State
  const [tasks, setTasks] = useState([]);
  const [distribution, setDistribution] = useState([]);
  const [plans, setPlans] = useState([]);
  
  // UI State
  const [hideDone, setHideDone] = useState(false);
  const [filterTag, setFilterTag] = useState('All'); // Filter State
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [editingTask, setEditingTask] = useState(null);
  const [modalConfig, setModalConfig] = useState({ isOpen: false, title: '', initialValue: '', onSave: () => {} });

  // --- EFFECTS ---
  
  // Dynamic Head Title
  useEffect(() => {
    const titles = {
      dashboard: 'ภาพรวม', strategy: 'ยุทธศาสตร์', masterplan: 'แผนงานหลัก', 
      rapidresponse: 'ปฏิบัติการด่วน', assets: 'คลังอาวุธ'
    };
    document.title = `${titles[activeTab]} | TEAM TAWEE`;
  }, [activeTab]);

  // Firebase Listeners
  useEffect(() => {
    const unsubTasks = onSnapshot(collection(db, "tasks"), (s) => setTasks(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubDist = onSnapshot(query(collection(db, "distribution"), orderBy("name")), (s) => setDistribution(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubPlans = onSnapshot(collection(db, "plans"), (s) => {
      setPlans(s.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => { unsubTasks(); unsubDist(); unsubPlans(); };
  }, []);

  // --- ACTIONS ---
  
  const openModal = (title, initialValue, onSave) => {
    setModalConfig({ isOpen: true, title, initialValue, onSave: (val) => { onSave(val); setModalConfig(prev => ({ ...prev, isOpen: false })); } });
  };

  const seedData = async () => {
    if (!window.confirm("ล้างข้อมูลเก่าและลงข้อมูลตัวอย่างใหม่?")) return;
    setLoading(true);
    try {
      const batch = writeBatch(db);
      initialMockData.tasks.forEach(i => batch.set(doc(collection(db, "tasks")), i));
      initialMockData.distribution.forEach(i => batch.set(doc(collection(db, "distribution")), i));
      initialMockData.plans.forEach(i => batch.set(doc(collection(db, "plans")), i));
      await batch.commit();
      alert("รีเซ็ตข้อมูลเรียบร้อย!");
    } catch (e) { alert("Error: " + e.message); }
    setLoading(false);
  };

  // Task Actions
  const updateTask = async (task) => {
    if (!task.id) return;
    await updateDoc(doc(db, "tasks", task.id), { title: task.title, status: task.status, tag: task.tag, link: task.link });
    setEditingTask(null);
  };
  const addNewTask = (columnKey) => {
    openModal("เพิ่มงานใหม่", "", async (val) => {
      if(val) await addDoc(collection(db, "tasks"), { title: val, status: "To Do", role: "Admin", tag: "General", link: "", columnKey });
    });
  };

  // Plan Actions (Updated for Checkboxes)
  const togglePlanItem = async (planId, itemIndex, currentItems) => {
    const newItems = [...currentItems];
    newItems[itemIndex].completed = !newItems[itemIndex].completed;
    await updateDoc(doc(db, "plans", planId), { items: newItems });
  };
  
  const addPlanItem = (planId, currentItems) => {
    openModal("เพิ่ม Action Item", "", async (val) => {
      if(val) await updateDoc(doc(db, "plans", planId), { items: [...(currentItems || []), { text: val, completed: false }] });
    });
  };

  const editPlanItem = (planId, itemIndex, currentItems) => {
    openModal("แก้ไขรายการ", currentItems[itemIndex].text, async (val) => {
      if(val) {
        const newItems = [...currentItems];
        newItems[itemIndex].text = val;
        await updateDoc(doc(db, "plans", planId), { items: newItems });
      }
    });
  };

  const editPlanTitle = (plan) => {
    openModal("แก้ไขชื่อแผนงาน", plan.title, async (val) => {
      if(val) await updateDoc(doc(db, "plans", plan.id), { title: val });
    });
  };

  const addPlan = () => {
    openModal("สร้างแผนงานหลักใหม่", "", async (val) => {
      if(val) await addDoc(collection(db, "plans"), { title: val, progress: 0, items: [] });
    });
  };

  // Distribution Actions
  const addDistChannel = () => {
    openModal("เพิ่มช่องทางเผยแพร่", "", async (val) => {
      if(val) await addDoc(collection(db, "distribution"), { name: val, count: 0, type: "Manual" });
    });
  };
  const updateDist = async (id, count) => updateDoc(doc(db, "distribution", id), { count: Math.max(0, count) });
  const deleteDist = async (id) => { if(window.confirm("ลบช่องทางนี้?")) await deleteDoc(doc(db, "distribution", id)); };

  // --- RENDER HELPERS ---
  const groupedTasks = {
    solver: tasks.filter(t => t.columnKey === 'solver'),
    principles: tasks.filter(t => t.columnKey === 'principles'),
    defender: tasks.filter(t => t.columnKey === 'defender'),
    expert: tasks.filter(t => t.columnKey === 'expert'),
    backoffice: tasks.filter(t => t.columnKey === 'backoffice')
  };
  
  // Unique Tags for Filter
  const allTags = ['All', ...new Set(tasks.map(t => t.tag))];

  const navItems = [
    { id: 'dashboard', title: 'ภาพรวม', subtitle: 'Dashboard', icon: LayoutDashboard },
    { id: 'strategy', title: 'กระดาน 4 แกน', subtitle: 'Strategy', icon: Megaphone },
    { id: 'masterplan', title: 'แผนงานหลัก', subtitle: 'Master Plan', icon: Map },
    { id: 'rapidresponse', title: 'ปฏิบัติการด่วน', subtitle: 'Rapid Response', icon: Zap, color: 'text-red-500' },
    { id: 'assets', title: 'คลังอาวุธ', subtitle: 'Assets', icon: Database },
  ];

  const renderContent = () => {
    if (loading) return <div className="flex h-64 items-center justify-center text-slate-400"><RefreshCw className="w-6 h-6 animate-spin mr-2"/> Loading Database...</div>;

    switch (activeTab) {
      case 'dashboard':
        const taskStats = { done: 0, pending: 0, total: 0 };
        tasks.forEach(t => { t.status === 'Done' ? taskStats.done++ : taskStats.pending++; taskStats.total++; });

        return (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-2 rounded-lg text-blue-600"><Calendar className="w-5 h-5" /></div>
                <div>
                  <p className="text-xs text-slate-500 uppercase font-bold">Select Period</p>
                  <select value={selectedWeek} onChange={(e) => setSelectedWeek(e.target.value)} className="text-sm font-bold text-slate-700 bg-transparent border-none focus:ring-0 outline-none cursor-pointer">
                    <option value="week3-nov">18 พ.ย. - 24 พ.ย. 2568</option>
                    <option value="week4-nov">25 พ.ย. - 01 ธ.ค. 2568</option>
                  </select>
                </div>
              </div>
              {tasks.length === 0 && (
                 <button onClick={seedData} className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-xs font-bold shadow hover:bg-green-700 transition">
                    <RefreshCw className="w-4 h-4" /> ลงข้อมูลตัวอย่าง (Reset Data)
                 </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center">
                 <p className="text-slate-500 text-xs font-bold uppercase mb-4 w-full text-left">Work Progress</p>
                 <SimplePieChart done={taskStats.done} total={taskStats.total} />
                 <div className="flex gap-4 mt-4 text-xs font-bold">
                    <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-600"></span> เสร็จ {taskStats.done}</div>
                    <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-200"></span> ค้าง {taskStats.pending}</div>
                 </div>
              </div>

              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm col-span-1 md:col-span-2 overflow-hidden">
                 <div className="flex justify-between items-center mb-3">
                    <p className="text-slate-500 text-xs font-bold uppercase">Strategy Board Preview</p>
                    <button onClick={() => setActiveTab('strategy')} className="text-xs text-blue-600 font-bold hover:underline">ดูทั้งหมด →</button>
                 </div>
                 <div className="grid grid-cols-2 gap-3">
                    {Object.entries(groupedTasks).slice(0, 4).map(([key, taskList]) => {
                        const topTask = taskList[0];
                        if(!topTask) return null;
                        return (
                            <div key={key} className="bg-slate-50 p-3 rounded border border-slate-100">
                                <div className="flex justify-between mb-1">
                                    <span className="text-[10px] font-bold uppercase text-slate-400">{key}</span>
                                    <StatusBadge status={topTask.status} />
                                </div>
                                <p className="text-sm font-bold text-slate-700 truncate">{topTask.title}</p>
                            </div>
                        )
                    })}
                 </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                   <div><p className="text-slate-500 text-xs font-bold uppercase mb-1">Distribution Hub</p><h3 className="text-xl font-bold text-slate-800">เผยแพร่แล้ว (Published Counter)</h3></div>
                   <button onClick={addDistChannel} className="text-xs text-blue-600 font-bold border border-blue-200 px-2 py-1 rounded hover:bg-blue-50">+ เพิ่มช่องทาง</button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                  {distribution.map(item => (
                    <div key={item.id} className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex flex-col items-center text-center relative group">
                       <span className="text-[10px] text-slate-400 mb-1">{item.type}</span>
                       <h4 className="font-bold text-slate-700 text-sm leading-tight h-8 flex items-center justify-center px-1">{item.name}</h4>
                       <span className="text-3xl font-black text-blue-600 my-2">{item.count}</span>
                       <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition absolute -top-2 -right-2 bg-white shadow rounded-full p-1">
                           <button onClick={() => updateDist(item.id, item.count - 1)} className="p-1 hover:text-red-600"><Minus className="w-3 h-3" /></button>
                           <button onClick={() => updateDist(item.id, item.count + 1)} className="p-1 hover:text-blue-600"><Plus className="w-3 h-3" /></button>
                           <button onClick={() => deleteDist(item.id)} className="p-1 hover:text-red-600 text-slate-300"><Trash2 className="w-3 h-3" /></button>
                       </div>
                    </div>
                  ))}
                </div>
            </div>
          </div>
        );

      case 'strategy':
        return (
          <div className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-4 bg-white p-2 rounded-xl border border-slate-200">
               {/* --- Filter ใช้งานได้จริง --- */}
               <div className="flex items-center gap-3 px-2">
                  <div className="flex items-center gap-2 text-slate-500 text-sm font-bold">
                    <Filter className="w-4 h-4" />
                    <span>ตัวกรอง:</span>
                  </div>
                  <select 
                    value={filterTag} 
                    onChange={(e) => setFilterTag(e.target.value)}
                    className="bg-slate-100 text-sm rounded-lg px-3 py-1.5 border-none focus:ring-2 focus:ring-blue-200 cursor-pointer"
                  >
                    {allTags.map(tag => <option key={tag} value={tag}>{tag}</option>)}
                  </select>
               </div>

               <button onClick={() => setHideDone(!hideDone)} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold border transition ${hideDone ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-white text-slate-600 border-slate-300'}`}>
                  {hideDone ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />} {hideDone ? "แสดงงานที่เสร็จแล้ว" : "ซ่อนงานที่เสร็จแล้ว"}
               </button>
            </div>

            <div className="overflow-x-auto pb-4 flex-1">
              <div className="flex gap-4 min-w-[1200px] h-full">
                {[
                  { key: 'solver', title: '1. ผลงาน (Solver)', color: 'blue', desc: 'งานรูทีน, ลงพื้นที่, ประเพณี' },
                  { key: 'principles', title: '2. จุดยืน (Principles)', color: 'purple', desc: 'Quote, อุดมการณ์, Viral' },
                  { key: 'defender', title: '3. ตอบโต้ (Defender)', color: 'red', desc: 'ชี้แจงข่าว, ประเด็นร้อน' },
                  { key: 'expert', title: '4. ผู้เชี่ยวชาญ (Expert)', color: 'indigo', desc: 'วิเคราะห์ลึก, Knowledge' },
                  { key: 'backoffice', title: '5. หลังบ้าน (Back Office)', color: 'slate', desc: 'เอกสาร, งบประมาณ' }
                ].map((col) => (
                  <div key={col.key} className={`w-1/5 bg-${col.color}-50 rounded-xl p-4 border border-${col.color}-100 flex flex-col`}>
                    <div className={`mb-3 pb-2 border-b border-${col.color}-200`}>
                      <h3 className={`font-bold text-${col.color}-900 truncate`}>{col.title}</h3>
                      <p className="text-[10px] text-slate-500 mt-1 leading-tight min-h-[2.5em]">{col.desc}</p>
                    </div>
                    <div className="space-y-3 overflow-y-auto max-h-[600px] pr-1 custom-scrollbar">
                      {groupedTasks[col.key]
                        ?.filter(t => (!hideDone || t.status !== 'Done') && (filterTag === 'All' || t.tag === filterTag))
                        .map(task => (
                        <div key={task.id} onClick={() => setEditingTask(task)} className={`bg-white p-3 rounded-lg shadow-sm border border-slate-200 hover:shadow-md transition cursor-pointer group relative ${task.status === 'Done' ? 'opacity-60 grayscale-[0.5]' : ''}`}>
                          <div className="flex justify-between items-start mb-2">
                            <span className={`text-[10px] font-bold text-${col.color}-600 bg-${col.color}-50 px-1.5 py-0.5 rounded`}>{task.tag}</span>
                            <StatusBadge status={task.status} />
                          </div>
                          <h4 className="text-sm font-medium text-slate-800 mb-2 group-hover:text-blue-600 leading-snug">{task.title}</h4>
                        </div>
                      ))}
                      <button onClick={() => addNewTask(col.key)} className="w-full py-2 text-sm text-slate-400 hover:text-slate-600 border border-dashed border-slate-300 rounded-lg hover:bg-white transition flex items-center justify-center gap-1">
                        <Plus className="w-4 h-4" /> เพิ่มงาน
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* EDIT TASK MODAL */}
            {editingTask && (
               <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
                  <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 transform transition-all">
                     <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-xl text-slate-800">แก้ไขรายละเอียดงาน</h3>
                        <button onClick={() => setEditingTask(null)} className="p-1 hover:bg-slate-100 rounded-full"><X className="w-6 h-6 text-slate-400" /></button>
                     </div>
                     <div className="space-y-5">
                        <div>
                           <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">ชื่องาน</label>
                           <input type="text" value={editingTask.title} onChange={e => setEditingTask({...editingTask, title: e.target.value})} className="w-full border-2 border-slate-200 rounded-lg p-2.5 text-sm focus:border-blue-500 outline-none" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                           <div>
                             <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Tag</label>
                             <input type="text" value={editingTask.tag} onChange={e => setEditingTask({...editingTask, tag: e.target.value})} className="w-full border-2 border-slate-200 rounded-lg p-2.5 text-sm focus:border-blue-500 outline-none" />
                           </div>
                           <div>
                             <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">สถานะ</label>
                             <select value={editingTask.status} onChange={e => setEditingTask({...editingTask, status: e.target.value})} className="w-full border-2 border-slate-200 rounded-lg p-2.5 text-sm bg-white focus:border-blue-500 outline-none">
                                <option value="To Do">To Do</option><option value="In Progress">In Progress</option><option value="In Review">In Review</option><option value="Done">Done</option>
                             </select>
                           </div>
                        </div>
                        <div>
                           <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Link ผลงาน</label>
                           <div className="flex gap-2">
                             <input type="text" value={editingTask.link || ""} onChange={e => setEditingTask({...editingTask, link: e.target.value})} className="w-full border-2 border-slate-200 rounded-lg p-2.5 text-sm focus:border-blue-500 outline-none" placeholder="https://..." />
                             {editingTask.link && <a href={editingTask.link} target="_blank" rel="noreferrer" className="p-2.5 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200"><ExternalLink className="w-5 h-5" /></a>}
                           </div>
                        </div>
                        <div className="flex justify-between pt-4 border-t border-slate-100">
                             <button onClick={async () => { if(window.confirm("ลบงานนี้?")) { await deleteDoc(doc(db, "tasks", editingTask.id)); setEditingTask(null); }}} className="text-red-500 text-sm font-bold hover:bg-red-50 px-3 py-2 rounded-lg transition-colors flex items-center gap-1"><Trash2 className="w-4 h-4"/> ลบงาน</button>
                             <button onClick={() => updateTask(editingTask)} className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all flex items-center gap-2"><Save className="w-4 h-4" /> บันทึก</button>
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
            <div className="flex justify-between items-center">
               <div><h2 className="text-xl font-bold text-slate-800">แผนงานหลัก (Master Plan)</h2><p className="text-slate-500 text-sm">ภาพรวมยุทธศาสตร์ระยะยาว</p></div>
               <button onClick={addPlan} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 transition flex items-center gap-2"><Plus className="w-4 h-4" /> สร้างแผนใหม่</button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {plans.map((plan) => (
                <div key={plan.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition group">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-2 group/title cursor-pointer" onClick={() => editPlanTitle(plan)}>
                       <h3 className="font-bold text-lg text-slate-800">{plan.title}</h3>
                       <Edit2 className="w-4 h-4 text-slate-300 opacity-0 group-hover/title:opacity-100 hover:text-blue-600" />
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => openModal("แก้ไข % ความคืบหน้า", plan.progress, async (val) => { if(val!==null) await updateDoc(doc(db, "plans", plan.id), { progress: parseInt(val) }) })} className="text-slate-400 hover:text-blue-600"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={async () => { if(window.confirm("ลบแผนนี้?")) await deleteDoc(doc(db, "plans", plan.id)); }} className="text-slate-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                  <div className="mb-4">
                    <div className="flex justify-between text-xs text-slate-500 mb-1"><span>ความคืบหน้า</span><span>{plan.progress}%</span></div>
                    <div className="w-full bg-slate-100 rounded-full h-2"><div className="bg-blue-600 h-2 rounded-full transition-all duration-500" style={{ width: `${plan.progress}%` }}></div></div>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-4">
                    <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Action Items:</h4>
                    <ul className="space-y-2">
                      {/* รองรับทั้งแบบ Object และ String เก่า */}
                      {plan.items?.map((item, idx) => {
                        const isObj = typeof item === 'object';
                        const text = isObj ? item.text : item;
                        const isDone = isObj ? item.completed : false;

                        return (
                          <li key={idx} className="flex items-start justify-between gap-2 text-sm text-slate-700 group/item hover:bg-white p-1 rounded transition">
                            <div className="flex items-center gap-2 cursor-pointer" onClick={() => isObj && togglePlanItem(plan.id, idx, plan.items)}>
                              {isDone ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <Circle className="w-5 h-5 text-slate-300 hover:text-blue-400" />}
                              <span className={isDone ? "text-slate-400 line-through decoration-slate-400" : ""}>{text}</span>
                            </div>
                            <div className="flex gap-1 opacity-0 group-hover/item:opacity-100 transition">
                                <button onClick={() => editPlanItem(plan.id, idx, plan.items)} className="text-slate-400 hover:text-blue-600"><Edit2 className="w-3 h-3" /></button>
                                <button onClick={async () => {
                                    const newItems = plan.items.filter((_, i) => i !== idx); 
                                    await updateDoc(doc(db, "plans", plan.id), { items: newItems });
                                }} className="text-slate-400 hover:text-red-500"><Trash2 className="w-3 h-3" /></button>
                            </div>
                          </li>
                        );
                      })}
                      <li className="pt-2"><button onClick={() => addPlanItem(plan.id, plan.items)} className="text-xs text-blue-600 font-bold hover:underline flex items-center gap-1">+ เพิ่มรายการ</button></li>
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
        
      case 'rapidresponse': return <div className="p-10 text-center border-2 border-dashed rounded-xl">Rapid Response Area</div>;
      case 'assets': return <div className="p-10 text-center border-2 border-dashed rounded-xl">Assets Area</div>;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col md:flex-row">
      {/* Global Edit Modal */}
      <InputModal {...modalConfig} onClose={() => setModalConfig(prev => ({ ...prev, isOpen: false }))} />

      <aside className={`bg-slate-900 text-white w-full md:w-64 flex-shrink-0 transition-all duration-300 fixed md:sticky top-0 z-30 h-screen ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="p-6 border-b border-slate-700 flex justify-between items-center">
          <div><h1 className="text-xl font-black tracking-wider text-white">TEAM TAWEE</h1><p className="text-[10px] text-blue-400 font-bold tracking-widest uppercase mt-1">Stand Together</p></div>
          <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden text-slate-400"><X /></button>
        </div>
        <nav className="p-4 space-y-2 overflow-y-auto max-h-[calc(100vh-140px)]">
          {navItems.map(item => (
            <button key={item.id} onClick={() => { setActiveTab(item.id); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-left ${activeTab === item.id ? 'bg-blue-600 text-white shadow-lg translate-x-1' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
              <item.icon className={`w-5 h-5 flex-shrink-0 ${item.color || ''}`} />
              <div className="flex flex-col"><span className="font-bold text-sm leading-tight">{item.title}</span><span className="text-[10px] opacity-80 font-medium">({item.subtitle})</span></div>
            </button>
          ))}
        </nav>
      </aside>
      <main className="flex-1 md:ml-0 min-h-screen overflow-y-auto w-full">
        <div className="md:hidden bg-white p-4 flex justify-between items-center shadow-sm sticky top-0 z-20 border-b border-slate-100">
          <div><h2 className="font-black text-slate-900">TEAM TAWEE</h2><p className="text-[10px] text-slate-500">Stand Together</p></div>
          <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 bg-slate-100 rounded-lg"><Menu className="text-slate-600 w-5 h-5" /></button>
        </div>
        <div className="p-4 md:p-8 max-w-7xl mx-auto">{renderContent()}</div>
      </main>
    </div>
  );
}