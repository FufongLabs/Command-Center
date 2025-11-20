import React, { useState } from 'react';
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
  Plus
} from 'lucide-react';

// --- MOCK DATA (จำลองข้อมูล) ---

// 1. ข้อมูลงานในกระดาน (Strategy)
const initialTasks = {
  solver: [
    { id: 101, title: "อัลบั้มภาพ: ลงพื้นที่น้ำท่วมเชียงราย", role: "Chef", status: "In Progress", tag: "Visual Storytelling" },
  ],
  principles: [
    { id: 201, title: "Quote: ความยุติธรรมที่มาช้า...", role: "Distributor", status: "Done", tag: "Viral" },
  ],
  defender: [
    { id: 301, title: "ชี้แจงประเด็น พ.ร.บ. งบประมาณ", role: "Hunter", status: "To Do", tag: "Urgent" }
  ],
  expert: [
    { id: 401, title: "Deep Dive: วิเคราะห์ปัญหายาเสพติด", role: "Chef", status: "In Review", tag: "Knowledge" }
  ],
  backoffice: [
    { id: 501, title: "สรุปยอดค่าใช้จ่ายยิง Ads", role: "Admin", status: "Done", tag: "Report" },
    { id: 502, title: "ต่ออายุ Domain Name เว็บพรรค", role: "IT", status: "To Do", tag: "System" }
  ]
};

// 2. ข้อมูลแผนงานหลัก (Master Plan)
const masterPlans = [
  { 
    id: 1, 
    title: "Roadmap สู่การเลือกตั้ง (Election)", 
    progress: 60, 
    items: ["เปิดตัวผู้สมัครครบทุกเขต", "Grand Opening นโยบายหลัก", "Caravan หาเสียงทั่วประเทศ"]
  },
  { 
    id: 2, 
    title: "แผนปั้น 'ผู้เชี่ยวชาญ' (Expert Plan)", 
    progress: 30, 
    items: ["รายการ YouTube Weekly", "หนังสือ Pocket book ความยุติธรรม"] 
  },
  { 
    id: 3, 
    title: "แผนลงพื้นที่เชิงรุก (Solver Plan)", 
    progress: 80, 
    items: ["คาราวานแก้หนี้ 4 ภาค", "ตั้งศูนย์รับเรื่องร้องเรียนออนไลน์"] 
  }
];

// 3. ข้อมูลสื่อมวลชน (Assets)
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

export default function TeamTaweeApp() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState('week4-nov');

  // เมนูนำทาง
  const navItems = [
    { id: 'dashboard', label: 'ภาพรวม (Dashboard)', icon: LayoutDashboard },
    { id: 'strategy', label: 'กระดาน 4 แกน (Strategy)', icon: Megaphone },
    { id: 'masterplan', label: 'แผนงานหลัก (Master Plan)', icon: Map }, // เปลี่ยนชื่อ
    { id: 'rapidresponse', label: 'ปฏิบัติการด่วน (Rapid Response)', icon: Zap, color: 'text-red-500' }, // เปลี่ยนชื่อ
    { id: 'assets', label: 'คลังอาวุธ (Assets)', icon: Database },
  ];

  // ฟังก์ชันคำนวณงานเสร็จ/ค้าง (Logic ง่ายๆ)
  const calculateTaskStats = () => {
    let done = 0;
    let pending = 0;
    Object.values(initialTasks).flat().forEach(task => {
      if (task.status === 'Done') done++;
      else pending++;
    });
    return { done, pending, total: done + pending };
  };
  const taskStats = calculateTaskStats();

  // ส่วนแสดงผลหลัก
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-6 animate-fadeIn">
            {/* Week Selector */}
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
                    <option value="week4-nov">สัปดาห์ที่ 4 พฤศจิกายน 2568</option>
                    <option value="week3-nov">สัปดาห์ที่ 3 พฤศจิกายน 2568</option>
                  </select>
                </div>
              </div>
              <div className="text-right hidden sm:block">
                <p className="text-xs text-slate-400">Engagement Rate</p>
                <p className="text-lg font-bold text-green-600">+12.5% ↗</p>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Card 1: ความคืบหน้างาน */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-slate-500 text-xs font-bold uppercase mb-1">Overview</p>
                    <h3 className="text-xl font-bold text-slate-800">ความคืบหน้างาน</h3>
                  </div>
                  <Activity className="text-slate-300" />
                </div>
                <div className="mt-4 flex items-center gap-4">
                  <div className="text-center">
                    <span className="block text-2xl font-bold text-green-600">{taskStats.done}</span>
                    <span className="text-xs text-slate-500">เสร็จแล้ว</span>
                  </div>
                  <div className="h-8 w-px bg-slate-200"></div>
                  <div className="text-center">
                    <span className="block text-2xl font-bold text-orange-500">{taskStats.pending}</span>
                    <span className="text-xs text-slate-500">คงค้าง</span>
                  </div>
                </div>
                <button onClick={() => setActiveTab('strategy')} className="mt-4 text-xs text-blue-600 font-bold hover:underline">
                  ดูรายละเอียดในบอร์ด →
                </button>
              </div>

              {/* Card 2: Published Channels */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <p className="text-slate-500 text-xs font-bold uppercase mb-1">Distribution</p>
                <h3 className="text-xl font-bold text-slate-800 mb-4">เผยแพร่แล้ว (สัปดาห์นี้)</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-blue-600"></span> Facebook</span>
                    <span className="font-bold">5 โพสต์</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-black"></span> TikTok</span>
                    <span className="font-bold">3 คลิป</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-sky-500"></span> Twitter (X)</span>
                    <span className="font-bold">8 ทวีต</span>
                  </div>
                </div>
              </div>

               {/* Card 3: Engagement Breakdown */}
               <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <p className="text-slate-500 text-xs font-bold uppercase mb-1">Feedback</p>
                <h3 className="text-xl font-bold text-slate-800 mb-4">สัดส่วน Engagement</h3>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-full border-4 border-blue-100 border-t-blue-600 border-r-blue-600 flex items-center justify-center">
                    <span className="text-xs font-bold">75%</span>
                  </div>
                  <div className="text-sm text-slate-600 space-y-1">
                    <p>👍 <span className="font-bold text-slate-800">Positive:</span> ชื่นชม/เห็นด้วย</p>
                    <p>💬 <span className="font-bold text-slate-800">Neutral:</span> ถามข้อมูล/แจ้งเรื่อง</p>
                    <p>👎 <span className="font-bold text-slate-800">Negative:</span> โจมตี/ไม่พอใจ</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'strategy':
        return (
          <div className="overflow-x-auto pb-4">
            <div className="flex gap-4 min-w-[1200px]">
              {/* Column Renderer Function */}
              {[
                { key: 'solver', title: '1. ผลงาน (Solver)', color: 'blue', desc: 'งานรูทีน, ลงพื้นที่, แก้ปัญหาชาวบ้าน' },
                { key: 'principles', title: '2. จุดยืน (Principles)', color: 'purple', desc: 'Quote คำคม, อุดมการณ์, Brand' },
                { key: 'defender', title: '3. ตอบโต้ (Defender)', color: 'red', desc: 'ชี้แจงข่าวบิดเบือน, ประเด็นร้อน' },
                { key: 'expert', title: '4. ผู้เชี่ยวชาญ (Expert)', color: 'indigo', desc: 'วิเคราะห์เชิงลึก, กฎหมาย, Live' },
                { key: 'backoffice', title: '5. หลังบ้าน (Back Office)', color: 'slate', desc: 'เอกสาร, งบประมาณ, ระบบ IT' }
              ].map((col) => (
                <div key={col.key} className={`w-1/5 bg-${col.color}-50 rounded-xl p-4 border border-${col.color}-100 flex flex-col h-full`}>
                  <div className={`mb-3 pb-2 border-b border-${col.color}-200`}>
                    <h3 className={`font-bold text-${col.color}-900 truncate`}>{col.title}</h3>
                    <p className="text-[10px] text-slate-500 mt-1 leading-tight min-h-[2.5em]">{col.desc}</p>
                  </div>
                  
                  <div className="space-y-3 flex-1">
                    {initialTasks[col.key]?.map(task => (
                      <div key={task.id} className="bg-white p-3 rounded-lg shadow-sm border border-slate-200 hover:shadow-md transition cursor-pointer group">
                        <div className="flex justify-between items-start mb-2">
                          <span className={`text-[10px] font-bold text-${col.color}-600 bg-${col.color}-50 px-1.5 py-0.5 rounded`}>{task.tag}</span>
                          <StatusBadge status={task.status} />
                        </div>
                        <h4 className="text-sm font-medium text-slate-800 mb-2 group-hover:text-blue-600">{task.title}</h4>
                        <div className="flex items-center gap-1 text-xs text-slate-400">
                          <Users className="w-3 h-3" /> {task.role}
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
        );

      case 'masterplan':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
               <div>
                  <h2 className="text-xl font-bold text-slate-800">Master Plan (แผนงานหลัก)</h2>
                  <p className="text-slate-500 text-sm">ภาพรวมยุทธศาสตร์ระยะยาว แยกตามวัตถุประสงค์</p>
               </div>
               <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 transition flex items-center gap-2">
                  <Plus className="w-4 h-4" /> สร้างแผนใหม่
               </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {masterPlans.map((plan) => (
                <div key={plan.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-bold text-lg text-slate-800">{plan.title}</h3>
                    <button className="text-slate-400 hover:text-blue-600"><FileText className="w-5 h-5" /></button>
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
                        <li key={idx} className="flex items-center gap-2 text-sm text-slate-700">
                          <CheckCircle2 className="w-4 h-4 text-slate-300" />
                          {item}
                        </li>
                      ))}
                      <li className="pt-2">
                         <button className="text-xs text-blue-600 font-bold hover:underline flex items-center gap-1">
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
                  พื้นที่ปฏิบัติการด่วน! สำหรับประเด็นที่ต้องชี้แจงภายใน 1-2 ชั่วโมง
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

              {/* Quick Actions & Contacts */}
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
             {/* Google Drive Link */}
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
                {/* Media List Database */}
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

                {/* Brand Assets & Templates */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                   <h3 className="font-bold text-slate-800 mb-4">Brand Assets & Templates</h3>
                   <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 border border-slate-200 rounded-lg hover:border-blue-300 cursor-pointer group">
                         <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-3 text-purple-600 group-hover:scale-110 transition">
                            <FileText className="w-6 h-6" />
                         </div>
                         <h4 className="font-bold text-slate-700 text-sm">Quote Template</h4>
                         <p className="text-xs text-slate-400 mt-1">PSD / Canva Link</p>
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
      {/* Sidebar */}
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

      {/* Main Content */}
      <main className="flex-1 md:ml-0 min-h-screen overflow-y-auto w-full">
        {/* Mobile Header */}
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
           {/* Page Header */}
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

           {/* Dynamic Content */}
           {renderContent()}
        </div>
      </main>
    </div>
  );
}