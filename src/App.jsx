import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Megaphone, 
  Map, 
  Zap, 
  Database, 
  Users, 
  Menu,
  X,
  Activity,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  Eye,
  FileText,
  Share2,
  Plus,
  Minus,
  Link as LinkIcon,
  Trash2,
  Edit2,
  ChevronDown,
  ChevronUp,
  Filter,
  PieChart,
  BarChart3
} from 'lucide-react';

// --- MOCK DATA ---

const initialTasks = {
  solver: [
    { id: 101, title: "อัลบั้มภาพ: ลงพื้นที่น้ำท่วมเชียงราย", role: "Chef", status: "In Progress", tag: "Visual Storytelling", link: "https://facebook.com/post/123" },
    { id: 102, title: "ร่วมงานบุญบั้งไฟ จ.ยโสธร", role: "Hunter", status: "To Do", tag: "Tradition" }, 
  ],
  principles: [
    { id: 201, title: "Quote: ความยุติธรรมที่มาช้า...", role: "Distributor", status: "Done", tag: "Viral", link: "https://twitter.com/post/456" },
  ],
  defender: [
    { id: 301, title: "ชี้แจงประเด็น พ.ร.บ. งบประมาณ", role: "Hunter", status: "To Do", tag: "Urgent", link: "" }
  ],
  expert: [
    { id: 401, title: "Deep Dive: วิเคราะห์ปัญหายาเสพติด", role: "Chef", status: "In Review", tag: "Knowledge", link: "" }
  ],
  backoffice: [
    { id: 501, title: "สรุปยอดค่าใช้จ่ายยิง Ads", role: "Admin", status: "Done", tag: "Report", link: "" },
    { id: 502, title: "ต่ออายุ Domain Name เว็บพรรค", role: "IT", status: "To Do", tag: "System", link: "" }
  ]
};

const initialDistribution = [
  { id: 1, name: "Facebook Page (Official)", count: 5, type: "Own Media" },
  { id: 2, name: "TikTok Team Tawee", count: 3, type: "Own Media" },
  { id: 3, name: "Twitter (X)", count: 8, type: "Own Media" },
  { id: 4, name: "ข่าวสดออนไลน์", count: 1, type: "Media" },
  { id: 5, name: "เพจ FC คนรักทวี", count: 12, type: "FC" },
];

const recentLinks = [
  { id: 1, title: "ข่าวลงพื้นที่ - Khaosod", url: "https://khaosod.co.th/..." },
  { id: 2, title: "คลิป TikTok ไวรัล", url: "https://tiktok.com/..." },
];

const mediaContacts = [
  { id: 1, name: "คุณส้ม (Ch 3)", type: "TV", phone: "081-xxx-xxxx", active: true },
  { id: 2, name: "คุณหนุ่ม (News Portal)", type: "Online", phone: "-", active: true },
  { id: 3, name: "กลุ่มไลน์ข่าวการเมือง", type: "Group", phone: "-", active: true },
];

// --- COMPONENTS ---

const StatusBadge = ({ status }) => {
  const colors = {
    "To Do": "bg-slate-100 text-slate-600",
    "In Progress": "bg-blue-100 text-blue-600",
    "In Review": "bg-yellow-100 text-yellow-700",
    "Done": "bg-green-100 text-green-700",
    "Urgent": "bg-red-100 text-red-600 font-bold"
  };
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] uppercase tracking-wide font-semibold ${colors[status] || "bg-gray-100"}`}>
      {status}
    </span>
  );
};

// Simple SVG Pie Chart Component
const SimplePieChart = ({ done, total }) => {
  const radius = 16;
  const circumference = 2 * Math.PI * radius;
  const percentage = total === 0 ? 0 : (done / total) * 100;
  const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;

  return (
    <div className="relative w-32 h-32 flex items-center justify-center">
      <svg className="transform -rotate-90 w-full h-full" viewBox="0 0 36 36">
        <path
          className="text-slate-100"
          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
        />
        <path
          className="text-blue-600 transition-all duration-1000 ease-out"
          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeDasharray={strokeDasharray}
        />
      </svg>
      <div className="absolute text-center">
        <span className="text-2xl font-bold text-slate-800">{Math.round(percentage)}%</span>
        <span className="block text-[10px] text-slate-400">COMPLETED</span>
      </div>
    </div>
  );
};

export default function TeamTaweeApp() {
  // เปลี่ยน Title Browser Tab
  useEffect(() => {
    document.title = "TEAM TAWEE | Stand Together";
  }, []);

  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState('week3-nov');
  
  const [tasks, setTasks] = useState(initialTasks);
  const [hideDone, setHideDone] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [distributionStats, setDistributionStats] = useState(initialDistribution);

  const [plans, setPlans] = useState([
    { id: 1, title: "Roadmap สู่การเลือกตั้ง (Election)", progress: 60, items: ["เปิดตัวผู้สมัครครบทุกเขต", "Grand Opening นโยบายหลัก", "Caravan หาเสียงทั่วประเทศ"] },
    { id: 2, title: "แผนนำเสนอ 'ผู้เชี่ยวชาญ' (Expert Plan)", progress: 30, items: ["รายการ YouTube Weekly", "หนังสือ Pocket book ความยุติธรรม"] },
    { id: 3, title: "แผนลงพื้นที่เชิงรุก (Solver Plan)", progress: 80, items: ["คาราวานแก้หนี้ 4 ภาค", "ตั้งศูนย์รับเรื่องร้องเรียนออนไลน์"] }
  ]);

  const navItems = [
    { id: 'dashboard', label: 'ภาพรวม (Dashboard)', icon: LayoutDashboard },
    { id: 'strategy', label: 'กระดาน 4 แกน (Strategy)', icon: Megaphone },
    { id: 'masterplan', label: 'แผนงานหลัก (Master Plan)', icon: Map },
    { id: 'rapidresponse', label: 'ปฏิบัติการด่วน (Rapid Response)', icon: Zap, color: 'text-red-500' },
    { id: 'assets', label: 'คลังอาวุธ (Assets)', icon: Database },
  ];

  const incrementDist = (id) => setDistributionStats(prev => prev.map(item => item.id === id ? { ...item, count: item.count + 1 } : item));
  const decrementDist = (id) => setDistributionStats(prev => prev.map(item => item.id === id ? { ...item, count: Math.max(0, item.count - 1) } : item));

  const saveTask = (columnKey, updatedTask) => {
    setTasks(prev => ({
      ...prev,
      [columnKey]: prev[columnKey].map(t => t.id === updatedTask.id ? updatedTask : t)
    }));
    setEditingTask(null);
  };

  const addPlanItem = (planId) => {
    const text = prompt("ระบุรายการใหม่:");
    if (text) setPlans(prev => prev.map(p => p.id === planId ? { ...p, items: [...p.items, text] } : p));
  };

  const editPlanItem = (planId, itemIndex) => {
    const oldText = plans.find(p => p.id === planId).items[itemIndex];
    const newText = prompt("แก้ไขรายการ:", oldText);
    if (newText) {
      setPlans(prev => prev.map(p => p.id === planId ? {
        ...p,
        items: p.items.map((item, idx) => idx === itemIndex ? newText : item)
      } : p));
    }
  };

  const removePlanItem = (planId, itemIndex) => {
    if(window.confirm("ต้องการลบรายการนี้ใช่หรือไม่?")) {
        setPlans(prev => prev.map(p => p.id === planId ? { ...p, items: p.items.filter((_, idx) => idx !== itemIndex) } : p));
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        const taskStats = { done: 0, pending: 0, total: 0 };
        Object.values(tasks).flat().forEach(t => {
            t.status === 'Done' ? taskStats.done++ : taskStats.pending++;
            taskStats.total++;
        });

        return (
          <div className="space-y-6 animate-fadeIn">
            {/* Period Selector */}
            <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase font-bold">Select Period</p>
                  <select 
                    value={selectedWeek} 
                    onChange={(e) => setSelectedWeek(e.target.value)}
                    className="text-sm font-bold text-slate-700 bg-transparent border-none focus:ring-0 cursor-pointer outline-none"
                  >
                    <optgroup label="รายสัปดาห์ (Weekly)">
                      <option value="week3-nov">18 พ.ย. - 24 พ.ย. 2568</option>
                      <option value="week4-nov">25 พ.ย. - 01 ธ.ค. 2568</option>
                    </optgroup>
                    <optgroup label="รายเดือน (Monthly)">
                      <option value="month-nov">พฤศจิกายน 2568</option>
                      <option value="month-dec">ธันวาคม 2568</option>
                    </optgroup>
                  </select>
                </div>
              </div>
            </div>

            {/* Top Section: Stats & Graphs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Graph Card */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center">
                 <p className="text-slate-500 text-xs font-bold uppercase mb-4 w-full text-left">Work Progress</p>
                 <SimplePieChart done={taskStats.done} total={taskStats.total} />
                 <div className="flex gap-4 mt-4 text-xs font-bold">
                    <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-600"></span> เสร็จ {taskStats.done}</div>
                    <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-200"></span> ค้าง {taskStats.pending}</div>
                 </div>
              </div>

              {/* Strategy Preview */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm col-span-1 md:col-span-2 overflow-hidden">
                 <div className="flex justify-between items-center mb-3">
                    <p className="text-slate-500 text-xs font-bold uppercase">Strategy Board Preview</p>
                    <button onClick={() => setActiveTab('strategy')} className="text-xs text-blue-600 font-bold hover:underline">ดูทั้งหมด →</button>
                 </div>
                 <div className="grid grid-cols-2 gap-3">
                    {Object.entries(tasks).slice(0, 4).map(([key, taskList]) => {
                        const topTask = taskList[0];
                        if(!topTask) return null;
                        return (
                            <div key={key} className="bg-slate-50 p-3 rounded border border-slate-100">
                                <div className="flex justify-between mb-1">
                                    <span className="text-[10px] font-bold uppercase text-slate-400">{key}</span>
                                    <StatusBadge status={topTask.status} />
                                </div>
                                <p className="text-sm font-bold text-slate-700 truncate">{topTask.title}</p>
                                <p className="text-[10px] text-slate-500">{topTask.role}</p>
                            </div>
                        )
                    })}
                 </div>
              </div>
            </div>

            {/* Middle Section: Master Plan Preview */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                   <div className="flex items-center gap-2">
                      <Map className="w-5 h-5 text-slate-400" />
                      <h3 className="font-bold text-slate-800">Master Plan Status</h3>
                   </div>
                   <button onClick={() => setActiveTab('masterplan')} className="text-xs text-blue-600 font-bold hover:underline">ดูรายละเอียด →</button>
                </div>
                <div className="space-y-4">
                    {plans.map(plan => (
                        <div key={plan.id}>
                            <div className="flex justify-between text-sm mb-1">
                                <span className="font-bold text-slate-700">{plan.title}</span>
                                <span className="text-slate-500">{plan.progress}%</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-2">
                                <div className="bg-indigo-600 h-2 rounded-full" style={{ width: `${plan.progress}%` }}></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Bottom Section: Distribution Hub */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                   <div>
                      <p className="text-slate-500 text-xs font-bold uppercase mb-1">Distribution Hub</p>
                      <h3 className="text-xl font-bold text-slate-800">เผยแพร่แล้ว (Published Counter)</h3>
                   </div>
                   <button className="text-xs text-blue-600 font-bold border border-blue-200 px-2 py-1 rounded hover:bg-blue-50">
                      + เพิ่มช่องทาง
                   </button>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                  {distributionStats.map(item => (
                    <div key={item.id} className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex flex-col items-center text-center relative group">
                       <span className="text-[10px] text-slate-400 mb-1">{item.type}</span>
                       <h4 className="font-bold text-slate-700 text-sm leading-tight h-8 flex items-center justify-center">{item.name}</h4>
                       <span className="text-3xl font-black text-blue-600 my-2">{item.count}</span>
                       
                       <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                           <button 
                              onClick={() => decrementDist(item.id)}
                              className="bg-white shadow border border-slate-200 rounded-full p-1 hover:text-red-600"
                           >
                              <Minus className="w-3 h-3" />
                           </button>
                           <button 
                              onClick={() => incrementDist(item.id)}
                              className="bg-white shadow border border-slate-200 rounded-full p-1 hover:text-blue-600"
                           >
                              <Plus className="w-3 h-3" />
                           </button>
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
            {/* Controls */}
            <div className="flex justify-between items-center mb-4">
               <div className="flex items-center gap-2 text-slate-500 text-sm">
                  <Filter className="w-4 h-4" />
                  <span>ตัวกรอง:</span>
               </div>
               <button 
                  onClick={() => setHideDone(!hideDone)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold border transition ${hideDone ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-white text-slate-600 border-slate-300'}`}
               >
                  {hideDone ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                  {hideDone ? "แสดงงานที่เสร็จแล้ว" : "ซ่อนงานที่เสร็จแล้ว"}
               </button>
            </div>

            <div className="overflow-x-auto pb-4 flex-1">
              <div className="flex gap-4 min-w-[1200px] h-full">
                {[
                  { key: 'solver', title: '1. ผลงาน (Solver)', color: 'blue', desc: 'งานรูทีน, ลงพื้นที่, ประเพณี, แก้ปัญหา' },
                  { key: 'principles', title: '2. จุดยืน (Principles)', color: 'purple', desc: 'Quote, อุดมการณ์, Viral, Brand' },
                  { key: 'defender', title: '3. ตอบโต้ (Defender)', color: 'red', desc: 'ชี้แจงข่าว, ประเด็นร้อน, Agile' },
                  { key: 'expert', title: '4. ผู้เชี่ยวชาญ (Expert)', color: 'indigo', desc: 'วิเคราะห์ลึก, Knowledge, กฎหมาย' },
                  { key: 'backoffice', title: '5. หลังบ้าน (Back Office)', color: 'slate', desc: 'เอกสาร, งบประมาณ, ระบบ IT' }
                ].map((col) => (
                  <div key={col.key} className={`w-1/5 bg-${col.color}-50 rounded-xl p-4 border border-${col.color}-100 flex flex-col`}>
                    <div className={`mb-3 pb-2 border-b border-${col.color}-200`}>
                      <h3 className={`font-bold text-${col.color}-900 truncate`}>{col.title}</h3>
                      <p className="text-[10px] text-slate-500 mt-1 leading-tight min-h-[2.5em]">{col.desc}</p>
                    </div>
                    
                    <div className="space-y-3 overflow-y-auto max-h-[600px] pr-1 custom-scrollbar">
                      {tasks[col.key]
                        ?.filter(t => !hideDone || t.status !== 'Done')
                        .map(task => (
                        <div 
                           key={task.id} 
                           onClick={() => setEditingTask({ ...task, colKey: col.key })}
                           className={`bg-white p-3 rounded-lg shadow-sm border border-slate-200 hover:shadow-md transition cursor-pointer group relative ${task.status === 'Done' ? 'opacity-60 grayscale-[0.5]' : ''}`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <span className={`text-[10px] font-bold text-${col.color}-600 bg-${col.color}-50 px-1.5 py-0.5 rounded`}>{task.tag}</span>
                            <StatusBadge status={task.status} />
                          </div>
                          <h4 className="text-sm font-medium text-slate-800 mb-2 group-hover:text-blue-600 leading-snug">{task.title}</h4>
                          <div className="flex items-center justify-between mt-2">
                             <div className="flex items-center gap-1 text-xs text-slate-400">
                                <Users className="w-3 h-3" /> {task.role}
                             </div>
                             {task.link && <LinkIcon className="w-3 h-3 text-blue-400" />}
                          </div>
                        </div>
                      ))}
                      <button className="w-full py-2 text-sm text-slate-400 hover:text-slate-600 border border-dashed border-slate-300 rounded-lg hover:bg-white transition flex items-center justify-center gap-1">
                        <Plus className="w-4 h-4" /> เพิ่มงาน
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* MODAL EDIT TASK */}
            {editingTask && (
               <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                  <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
                     <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-lg">แก้ไขรายละเอียดงาน</h3>
                        <button onClick={() => setEditingTask(null)}><X className="w-5 h-5 text-slate-400" /></button>
                     </div>
                     
                     <div className="space-y-4">
                        <div>
                           <label className="block text-xs font-bold text-slate-500 mb-1">ชื่องาน / หัวข้อ</label>
                           <input 
                              type="text" 
                              value={editingTask.title} 
                              onChange={e => setEditingTask({...editingTask, title: e.target.value})}
                              className="w-full border border-slate-300 rounded p-2 text-sm"
                           />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                           <div>
                              <label className="block text-xs font-bold text-slate-500 mb-1">Tag (ประเภท)</label>
                              <input 
                                 type="text" 
                                 value={editingTask.tag} 
                                 onChange={e => setEditingTask({...editingTask, tag: e.target.value})}
                                 className="w-full border border-slate-300 rounded p-2 text-sm"
                                 placeholder="เช่น Viral, Tradition"
                              />
                           </div>
                           <div>
                              <label className="block text-xs font-bold text-slate-500 mb-1">สถานะ</label>
                              <select 
                                 value={editingTask.status}
                                 onChange={e => setEditingTask({...editingTask, status: e.target.value})}
                                 className="w-full border border-slate-300 rounded p-2 text-sm bg-white"
                              >
                                 <option value="To Do">To Do</option>
                                 <option value="In Progress">In Progress</option>
                                 <option value="In Review">In Review</option>
                                 <option value="Done">Done</option>
                              </select>
                           </div>
                        </div>
                        <div>
                           <label className="block text-xs font-bold text-slate-500 mb-1">Link ผลงาน (URL)</label>
                           <input 
                              type="text" 
                              value={editingTask.link || ""} 
                              onChange={e => setEditingTask({...editingTask, link: e.target.value})}
                              className="w-full border border-slate-300 rounded p-2 text-sm"
                              placeholder="https://..."
                           />
                        </div>
                     </div>

                     <div className="mt-6 flex justify-end gap-2">
                        <button onClick={() => setEditingTask(null)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded font-bold text-sm">ยกเลิก</button>
                        <button onClick={() => saveTask(editingTask.colKey, editingTask)} className="px-4 py-2 bg-blue-600 text-white rounded font-bold text-sm hover:bg-blue-700">บันทึก</button>
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
               <div>
                  <h2 className="text-xl font-bold text-slate-800">Master Plan (แผนงานหลัก)</h2>
                  <p className="text-slate-500 text-sm">ภาพรวมยุทธศาสตร์ระยะยาว</p>
               </div>
               <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 transition flex items-center gap-2">
                  <Plus className="w-4 h-4" /> สร้างแผนใหม่
               </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {plans.map((plan) => (
                <div key={plan.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition group">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-bold text-lg text-slate-800">{plan.title}</h3>
                    <button className="text-slate-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition"><FileText className="w-5 h-5" /></button>
                  </div>
                  
                  <div className="mb-4">
                    <div className="flex justify-between text-xs text-slate-500 mb-1">
                      <span>ความคืบหน้า</span>
                      <span>{plan.progress}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full transition-all duration-500" style={{ width: `${plan.progress}%` }}></div>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-lg p-4">
                    <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Action Items:</h4>
                    <ul className="space-y-2">
                      {plan.items.map((item, idx) => (
                        <li key={idx} className="flex items-start justify-between gap-2 text-sm text-slate-700 group/item hover:bg-white p-1 rounded transition">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-slate-300" />
                            {item}
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover/item:opacity-100 transition">
                              <button 
                                onClick={() => editPlanItem(plan.id, idx)}
                                className="text-slate-400 hover:text-blue-600"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                              <button 
                                onClick={() => removePlanItem(plan.id, idx)}
                                className="text-slate-400 hover:text-red-500"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                          </div>
                        </li>
                      ))}
                      <li className="pt-2">
                         <button 
                            onClick={() => addPlanItem(plan.id)}
                            className="text-xs text-blue-600 font-bold hover:underline flex items-center gap-1"
                         >
                            + เพิ่มรายการ
                         </button>
                      </li>
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'rapidresponse':
        return (
          <div className="space-y-6">
            <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-r-xl flex flex-col md:flex-row justify-between items-center gap-4">
              <div>
                <h2 className="text-2xl font-bold text-red-700 flex items-center gap-2">
                  <Zap className="w-6 h-6" /> Rapid Response Unit
                </h2>
                <p className="text-red-600/80 mt-1">
                   พื้นที่ปฏิบัติการด่วน! สำหรับประเด็นที่ต้องชี้แจง
                </p>
              </div>
              <button className="bg-red-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-red-700 shadow-lg transition whitespace-nowrap">
                + เปิดเคสด่วน (New Case)
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* SOP Checklist */}
              <div className="md:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="font-bold text-slate-800 mb-4 border-b pb-2 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-slate-500" /> Standard Operating Procedure (SOP)
                </h3>
                <div className="space-y-4">
                  {[
                    "1. ทีม Monitor สรุปประเด็น (ใคร? ทำอะไร? กระทบเรายังไง?)",
                    "2. ร่าง Message สั้นๆ (เน้น Fact + จุดยืน)",
                    "3. ส่งให้ท่านทวีดูผ่าน Line (หรือโทรสายตรง)",
                    "4. ผลิตสื่อด่วน (Graphic Quote หรือ คลิปสัมภาษณ์สั้น)",
                    "5. กระจายลง Twitter/TikTok และส่งเข้ากลุ่มนักข่าว"
                  ].map((step, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition">
                      <input type="checkbox" className="mt-1 w-5 h-5 text-red-600 rounded border-slate-300 focus:ring-red-500" />
                      <span className="text-sm text-slate-700">{step}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Media Contacts (View Only) */}
              <div className="space-y-6">
                 <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="font-bold text-slate-800 mb-4">รายชื่อสื่อมวลชน (Selected)</h3>
                    <div className="space-y-3">
                       {mediaContacts.filter(c => c.active).map(contact => (
                          <div key={contact.id} className="flex justify-between items-center p-2 bg-slate-50 rounded border border-slate-100">
                             <div>
                                <p className="text-sm font-bold text-slate-700">{contact.name}</p>
                                <p className="text-xs text-slate-500">{contact.type}</p>
                             </div>
                             <button className="text-xs bg-white border border-slate-200 px-2 py-1 rounded text-slate-600 hover:text-blue-600 flex items-center gap-1">
                                <Eye className="w-3 h-3" /> View
                             </button>
                          </div>
                       ))}
                       <button onClick={() => setActiveTab('assets')} className="w-full text-center text-xs text-blue-600 font-bold hover:underline mt-2">
                          จัดการรายชื่อใน Assets
                       </button>
                    </div>
                 </div>
              </div>
            </div>
          </div>
        );

      case 'assets':
        return (
          <div className="space-y-8">
             <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div>
                   <h3 className="text-lg font-bold text-blue-900 flex items-center gap-2">
                      <Database className="w-5 h-5" /> Team Tawee's Google Drive
                   </h3>
                   <p className="text-sm text-blue-700/80 mt-1">
                      พื้นที่เก็บไฟล์ต้นฉบับ รูปภาพ คลิปดิบ และเอกสารราชการทั้งหมด
                   </p>
                </div>
                <a 
                  href="https://drive.google.com" 
                  target="_blank" 
                  rel="noreferrer"
                  className="bg-white text-blue-600 border border-blue-200 px-6 py-3 rounded-lg font-bold hover:bg-blue-50 shadow-sm transition flex items-center gap-2 whitespace-nowrap"
                >
                   <ExternalLink className="w-4 h-4" /> เปิด Google Drive
                </a>
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                   <div className="flex justify-between items-center mb-4">
                      <h3 className="font-bold text-slate-800">ฐานข้อมูลสื่อมวลชน (Media List)</h3>
                      <button className="text-xs bg-blue-600 text-white px-3 py-1 rounded-full hover:bg-blue-700">+ เพิ่มรายชื่อ</button>
                   </div>
                   <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                         <thead className="text-xs text-slate-500 uppercase bg-slate-50">
                            <tr>
                               <th className="px-3 py-2 rounded-l-lg">ชื่อ/สังกัด</th>
                               <th className="px-3 py-2">เบอร์โทร</th>
                               <th className="px-3 py-2 text-center">Show in Rapid</th>
                               <th className="px-3 py-2 rounded-r-lg"></th>
                            </tr>
                         </thead>
                         <tbody className="divide-y divide-slate-100">
                            {mediaContacts.map(contact => (
                               <tr key={contact.id} className="hover:bg-slate-50">
                                  <td className="px-3 py-3 font-medium text-slate-700">{contact.name} <span className="text-xs text-slate-400 block">{contact.type}</span></td>
                                  <td className="px-3 py-3 text-slate-500">{contact.phone}</td>
                                  <td className="px-3 py-3 text-center">
                                     <input type="checkbox" checked={contact.active} className="rounded text-blue-600 focus:ring-blue-500" readOnly />
                                  </td>
                                  <td className="px-3 py-3 text-right">
                                     <button className="text-slate-400 hover:text-blue-600"><Share2 className="w-4 h-4" /></button>
                                  </td>
                               </tr>
                            ))}
                         </tbody>
                      </table>
                   </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                   <h3 className="font-bold text-slate-800 mb-4">Brand Assets & Templates</h3>
                   <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 border border-slate-200 rounded-lg hover:border-blue-300 cursor-pointer group">
                         <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-3 text-purple-600 group-hover:scale-110 transition">
                            <FileText className="w-6 h-6" />
                         </div>
                         <h4 className="font-bold text-slate-700 text-sm">Quote Template</h4>
                         <p className="text-xs text-slate-400 mt-1">PSD / AI / Canva Link</p>
                      </div>
                      <div className="p-4 border border-slate-200 rounded-lg hover:border-blue-300 cursor-pointer group">
                         <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-3 text-blue-600 group-hover:scale-110 transition">
                            <Zap className="w-6 h-6" />
                         </div>
                         <h4 className="font-bold text-slate-700 text-sm">Logo & CI</h4>
                         <p className="text-xs text-slate-400 mt-1">Official Vector Files</p>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        );
        
      default:
        return <div className="p-10 text-center text-slate-500">อยู่ระหว่างการพัฒนาส่วนนี้...</div>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col md:flex-row">
      <aside className={`bg-slate-900 text-white w-full md:w-64 flex-shrink-0 transition-all duration-300 fixed md:sticky top-0 z-30 h-screen ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="p-6 border-b border-slate-700 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-black tracking-wider text-white">TEAM TAWEE</h1>
            <p className="text-[10px] text-blue-400 font-bold tracking-widest uppercase mt-1">Stand Together</p>
          </div>
          <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden text-slate-400">
            <X />
          </button>
        </div>
        <nav className="p-4 space-y-2 overflow-y-auto max-h-[calc(100vh-140px)]">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                activeTab === item.id 
                  ? 'bg-blue-600 text-white shadow-lg translate-x-1' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <item.icon className={`w-5 h-5 ${item.color || ''}`} />
              <span className="font-medium text-sm">{item.label}</span>
            </button>
          ))}
        </nav>
        
        <div className="absolute bottom-0 left-0 w-full p-4 border-t border-slate-800 bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center font-bold text-white shadow-lg">
              CK
            </div>
            <div>
              <p className="text-sm font-bold">Admin</p>
              <p className="text-[10px] text-slate-400">Central Kitchen</p>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 md:ml-0 min-h-screen overflow-y-auto w-full">
        <div className="md:hidden bg-white p-4 flex justify-between items-center shadow-sm sticky top-0 z-20 border-b border-slate-100">
          <div>
            <h2 className="font-black text-slate-900">TEAM TAWEE</h2>
            <p className="text-[10px] text-slate-500">Stand Together</p>
          </div>
          <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 bg-slate-100 rounded-lg">
            <Menu className="text-slate-600 w-5 h-5" />
          </button>
        </div>

        <div className="p-4 md:p-8 max-w-7xl mx-auto">
           <div className="mb-8 flex flex-col sm:flex-row justify-between sm:items-end gap-4">
              <div>
                 <h2 className="text-2xl md:text-3xl font-bold text-slate-800 tracking-tight">
                  {navItems.find(i => i.id === activeTab)?.label}
                 </h2>
                 <p className="text-slate-500 mt-1 text-sm">
                   ระบบบริหารจัดการงานสื่อสารและยุทธศาสตร์
                 </p>
              </div>
              <div className="hidden sm:block text-right">
                 <div className="inline-flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-slate-200 text-xs font-medium text-slate-600 shadow-sm">
                    <Clock className="w-3 h-3" />
                    {new Date().toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long' })}
                 </div>
              </div>
           </div>
           {renderContent()}
        </div>
      </main>
    </div>
  );
}