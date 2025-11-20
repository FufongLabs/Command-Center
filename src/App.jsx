import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Megaphone, 
  Map, 
  AlertTriangle, 
  FileText, 
  Users, 
  Menu,
  X,
  Activity
} from 'lucide-react';

// --- ข้อมูลจำลอง (Mock Data) ---
const roadmapPhases = [
  { id: 1, title: "ระยะที่ 1: ปูพื้นฐาน (Foundation)", status: "completed", progress: 100, desc: "สะสมคลังคอนเทนต์ 'ผู้ใหญ่ใจดี' และสร้างฐานข้อมูลสื่อ" },
  { id: 2, title: "ระยะที่ 2: สร้างจุดต่าง (Differentiation)", status: "active", progress: 45, desc: "วิพากษ์โครงสร้างสังคม & เปรียบเทียบผลงาน (ปัจจุบัน)" },
  { id: 3, title: "ระยะที่ 3: ระดมพล (Mobilization)", status: "pending", progress: 0, desc: "War Room 24 ชม. / ตอบโต้ทันที / ปลุกใจโค้งสุดท้าย" }
];

const kanbanTasks = {
  solver: [
    { id: 101, title: "อัลบั้มภาพ: ลงพื้นที่น้ำท่วมเชียงราย", role: "Chef", status: "In Progress", tag: "Visual Storytelling" },
    { id: 102, title: "Vlog: 1 วันกับงานแก้หนี้", role: "Hunter", status: "To Do", tag: "Show Don't Tell" }
  ],
  principles: [
    { id: 201, title: "Quote: ความยุติธรรมที่มาช้า...", role: "Distributor", status: "Done", tag: "Viral" },
    { id: 202, title: "Template กราฟิกชุดใหม่ (Dark Theme)", role: "Chef", status: "In Progress", tag: "Asset" }
  ],
  defender: [
    { id: 301, title: "คลิปแก้ข่าว: ประเด็นบิดเบือน พ.ร.บ.", role: "Hunter", status: "To Do", tag: "Urgent" }
  ],
  expert: [
    { id: 401, title: "Deep Dive: วิเคราะห์ปัญหายาเสพติด", role: "Chef", status: "In Review", tag: "Knowledge" }
  ]
};

const quickStats = [
  { label: "Engagement สัปดาห์นี้", value: "+12%", trend: "up" },
  { label: "คลิปส่งให้นักข่าว", value: "5", trend: "neutral" },
  { label: "โพสต์ที่เป็น Viral", value: "2", trend: "up" }
];

// --- ส่วนประกอบย่อย (Components) ---

const StatusBadge = ({ status }) => {
  const colors = {
    "To Do": "bg-gray-100 text-gray-600",
    "In Progress": "bg-blue-100 text-blue-600",
    "In Review": "bg-yellow-100 text-yellow-600",
    "Done": "bg-green-100 text-green-600",
    "Urgent": "bg-red-100 text-red-600 font-bold"
  };
  return (
    <span className={`px-2 py-1 rounded-full text-xs ${colors[status] || "bg-gray-100"}`}>
      {status}
    </span>
  );
};

export default function ThaweeCommandCenter() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'ภาพรวม (Dashboard)', icon: LayoutDashboard },
    { id: 'strategy', label: 'กระดาน 4 แกน (Strategy)', icon: Megaphone },
    { id: 'roadmap', label: 'โรดแมป (Roadmap)', icon: Map },
    { id: 'warroom', label: 'WAR ROOM (ตอบโต้ด่วน)', icon: AlertTriangle, color: 'text-red-500' },
    { id: 'assets', label: 'คลังอาวุธ (Assets)', icon: FileText },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-6 animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {quickStats.map((stat, idx) => (
                <div key={idx} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                  <p className="text-slate-500 text-sm">{stat.label}</p>
                  <h3 className="text-3xl font-bold text-slate-800 mt-2">{stat.value}</h3>
                  <span className={`text-xs ${stat.trend === 'up' ? 'text-green-500' : 'text-gray-400'}`}>
                    {stat.trend === 'up' ? '▲ แนวโน้มดี' : '● คงที่'}
                  </span>
                </div>
              ))}
            </div>

            <div className="bg-gradient-to-r from-blue-900 to-slate-800 rounded-xl p-6 text-white shadow-lg">
              <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                <div>
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <Activity className="w-5 h-5 text-green-400" /> 
                    ภารกิจวันนี้ (Daily Mission)
                  </h2>
                  <p className="mt-2 text-blue-100">
                    สถานการณ์ปกติ: ให้เน้น <span className="font-bold text-yellow-300">แกนที่ 1 (ผลงาน)</span> และ <span className="font-bold text-yellow-300">แกนที่ 4 (ความรู้)</span> 
                  </p>
                </div>
                <button className="bg-white text-blue-900 px-4 py-2 rounded-lg font-bold text-sm hover:bg-blue-50 transition whitespace-nowrap">
                  ดูบรีฟงาน
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="font-bold text-slate-800 mb-4">ความเคลื่อนไหวล่าสุด</h3>
              <ul className="space-y-4">
                <li className="flex items-center gap-3 text-sm text-slate-600">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <b>Distributor:</b> ส่งคลิปดิบ "สัมภาษณ์เรื่องยาเสพติด" เข้ากลุ่มไลน์นักข่าวแล้ว
                </li>
                <li className="flex items-center gap-3 text-sm text-slate-600">
                  <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                  <b>Chef:</b> กำลังตัดต่อคลิป TikTok แกน Expert (เสร็จ 80%)
                </li>
              </ul>
            </div>
          </div>
        );

      case 'strategy':
        return (
          <div className="overflow-x-auto pb-4">
            <div className="flex gap-4 min-w-[1000px]">
              {/* Column 1: Solver */}
              <div className="w-1/4 bg-slate-50 rounded-xl p-4 border border-slate-200">
                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-200">
                  <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                  <h3 className="font-bold text-slate-700">1. ผลงาน (Solver)</h3>
                </div>
                <div className="space-y-3">
                  {kanbanTasks.solver.map(task => (
                    <div key={task.id} className="bg-white p-3 rounded-lg shadow-sm border border-slate-200 hover:shadow-md transition cursor-pointer">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-bold text-slate-500">{task.tag}</span>
                        <StatusBadge status={task.status} />
                      </div>
                      <h4 className="text-sm font-medium text-slate-800 mb-2">{task.title}</h4>
                      <div className="flex items-center gap-1 text-xs text-slate-400">
                        <Users className="w-3 h-3" /> {task.role}
                      </div>
                    </div>
                  ))}
                  <button className="w-full py-2 text-sm text-slate-400 hover:text-slate-600 border border-dashed border-slate-300 rounded-lg hover:bg-slate-100 transition">
                    + เพิ่มงานใหม่
                  </button>
                </div>
              </div>

              {/* Column 2: Principles */}
              <div className="w-1/4 bg-slate-50 rounded-xl p-4 border border-slate-200">
                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-200">
                  <div className="w-3 h-3 rounded-full bg-purple-600"></div>
                  <h3 className="font-bold text-slate-700">2. จุดยืน (Principles)</h3>
                </div>
                <div className="space-y-3">
                  {kanbanTasks.principles.map(task => (
                    <div key={task.id} className="bg-white p-3 rounded-lg shadow-sm border border-slate-200 hover:shadow-md transition cursor-pointer">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-bold text-slate-500">{task.tag}</span>
                        <StatusBadge status={task.status} />
                      </div>
                      <h4 className="text-sm font-medium text-slate-800 mb-2">{task.title}</h4>
                      <div className="flex items-center gap-1 text-xs text-slate-400">
                        <Users className="w-3 h-3" /> {task.role}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Column 3: Defender */}
              <div className="w-1/4 bg-red-50 rounded-xl p-4 border border-red-100">
                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-red-200">
                  <div className="w-3 h-3 rounded-full bg-red-600"></div>
                  <h3 className="font-bold text-red-700">3. ตอบโต้ (Defender)</h3>
                </div>
                <div className="space-y-3">
                  {kanbanTasks.defender.map(task => (
                    <div key={task.id} className="bg-white p-3 rounded-lg shadow-sm border-l-4 border-l-red-500 hover:shadow-md transition cursor-pointer">
                       <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-bold text-red-500">{task.tag}</span>
                        <StatusBadge status={task.status} />
                      </div>
                      <h4 className="text-sm font-medium text-slate-800 mb-2">{task.title}</h4>
                      <div className="flex items-center gap-1 text-xs text-slate-400">
                        <Users className="w-3 h-3" /> {task.role}
                      </div>
                    </div>
                  ))}
                  <button className="w-full py-2 text-sm text-red-500 hover:text-red-700 bg-red-100 rounded-lg hover:bg-red-200 transition font-bold">
                    + แจ้งเตือนข่าวด่วน
                  </button>
                </div>
              </div>

              {/* Column 4: Expert */}
              <div className="w-1/4 bg-slate-50 rounded-xl p-4 border border-slate-200">
                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-200">
                  <div className="w-3 h-3 rounded-full bg-indigo-600"></div>
                  <h3 className="font-bold text-slate-700">4. ผู้เชี่ยวชาญ (Expert)</h3>
                </div>
                <div className="space-y-3">
                  {kanbanTasks.expert.map(task => (
                    <div key={task.id} className="bg-white p-3 rounded-lg shadow-sm border border-slate-200 hover:shadow-md transition cursor-pointer">
                       <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-bold text-slate-500">{task.tag}</span>
                        <StatusBadge status={task.status} />
                      </div>
                      <h4 className="text-sm font-medium text-slate-800 mb-2">{task.title}</h4>
                      <div className="flex items-center gap-1 text-xs text-slate-400">
                        <Users className="w-3 h-3" /> {task.role}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 'roadmap':
        return (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <h2 className="text-xl font-bold text-slate-800 mb-6">Roadmap สู่การเลือกตั้ง</h2>
              <div className="relative border-l-4 border-slate-200 ml-4 space-y-12">
                {roadmapPhases.map((phase, idx) => (
                  <div key={phase.id} className="relative pl-8">
                    <div className={`absolute -left-[13px] top-0 w-6 h-6 rounded-full border-4 border-white ${
                      phase.status === 'active' ? 'bg-blue-600 shadow-lg shadow-blue-300' : 
                      phase.status === 'completed' ? 'bg-green-500' : 'bg-slate-300'
                    }`}></div>
                    
                    <div className={`p-4 rounded-lg ${phase.status === 'active' ? 'bg-blue-50 border border-blue-200' : 'bg-white border border-slate-100'}`}>
                      <div className="flex justify-between items-center mb-2">
                        <h3 className={`font-bold text-lg ${phase.status === 'active' ? 'text-blue-800' : 'text-slate-700'}`}>
                          {phase.title}
                        </h3>
                        {phase.status === 'active' && <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded">Current Phase</span>}
                      </div>
                      <p className="text-slate-600 mb-3">{phase.desc}</p>
                      
                      <div className="w-full bg-slate-200 rounded-full h-2.5">
                        <div className={`h-2.5 rounded-full ${phase.status === 'completed' ? 'bg-green-500' : 'bg-blue-600'}`} style={{ width: `${phase.progress}%` }}></div>
                      </div>
                      <p className="text-right text-xs text-slate-500 mt-1">{phase.progress}% เสร็จสิ้น</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'warroom':
        return (
          <div className="space-y-6">
            <div className="bg-red-600 text-white p-8 rounded-xl shadow-lg text-center animate-pulse">
              <AlertTriangle className="w-16 h-16 mx-auto mb-4" />
              <h1 className="text-3xl font-bold mb-2">WAR ROOM MODE</h1>
              <p className="text-red-100 mb-6">สำหรับจัดการข่าวด่วนและประเด็นโจมตี (Agile Response)</p>
              <button className="bg-white text-red-600 font-bold py-3 px-8 rounded-full hover:bg-red-50 transition shadow-lg transform hover:scale-105">
                + สร้างเคสด่วน (New Incident)
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-xl border border-slate-200">
                <h3 className="font-bold text-slate-800 mb-4 border-b pb-2">Checklist ตอบโต้ (SOP)</h3>
                <ul className="space-y-3">
                  <li className="flex items-center gap-2 text-slate-700">
                    <input type="checkbox" className="w-5 h-5 text-red-600" />
                    1. ทีม Monitor สรุปประเด็นส่งเข้า Line
                  </li>
                  <li className="flex items-center gap-2 text-slate-700">
                    <input type="checkbox" className="w-5 h-5 text-red-600" />
                    2. ท่านทวีอัดคลิปมือถือ (แนวตั้ง) &lt; 1 นาที
                  </li>
                  <li className="flex items-center gap-2 text-slate-700">
                    <input type="checkbox" className="w-5 h-5 text-red-600" />
                    3. ส่งไฟล์ Clean Feed เข้ากลุ่มนักข่าว
                  </li>
                  <li className="flex items-center gap-2 text-slate-700">
                    <input type="checkbox" className="w-5 h-5 text-red-600" />
                    4. ทีม Distributor โพสต์ TikTok/Twitter
                  </li>
                </ul>
              </div>

              <div className="bg-white p-6 rounded-xl border border-slate-200">
                <h3 className="font-bold text-slate-800 mb-4 border-b pb-2">รายชื่อสื่อมวลชน (Quick Contact)</h3>
                 <div className="space-y-2">
                    <div className="flex justify-between items-center p-3 bg-slate-50 rounded hover:bg-slate-100">
                        <span>กลุ่มไลน์: ข่าวการเมือง (Official)</span>
                        <button className="text-blue-600 text-sm font-bold hover:underline">ส่งไฟล์</button>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-slate-50 rounded hover:bg-slate-100">
                        <span>กลุ่มไลน์: นักข่าวภาคสนาม</span>
                        <button className="text-blue-600 text-sm font-bold hover:underline">ส่งไฟล์</button>
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
    <div className="min-h-screen bg-slate-100 font-sans text-slate-900 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className={`bg-slate-900 text-white w-full md:w-64 flex-shrink-0 transition-all duration-300 ${isMobileMenuOpen ? 'block' : 'hidden md:block'}`}>
        <div className="p-6 border-b border-slate-700 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold tracking-wide">TEAM THAWEE</h1>
            <p className="text-xs text-slate-400 mt-1">Command Center v1.2</p>
          </div>
          <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden text-slate-400">
            <X />
          </button>
        </div>
        <nav className="p-4 space-y-2">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === item.id 
                  ? 'bg-blue-600 text-white shadow-lg' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <item.icon className={`w-5 h-5 ${item.color || ''}`} />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>
        
        <div className="p-4 mt-auto border-t border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center font-bold text-slate-900">
              CK
            </div>
            <div>
              <p className="text-sm font-bold">Admin</p>
              <p className="text-xs text-slate-400">Role: Central Kitchen</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 h-screen overflow-y-auto">
        <div className="md:hidden bg-white p-4 flex justify-between items-center shadow-sm sticky top-0 z-10">
          <h2 className="font-bold text-slate-800">TEAM THAWEE</h2>
          <button onClick={() => setIsMobileMenuOpen(true)}>
            <Menu className="text-slate-600" />
          </button>
        </div>

        <div className="p-6 md:p-8 max-w-7xl mx-auto">
           <div className="mb-8 flex flex-col md:flex-row justify-between md:items-center gap-4">
              <div>
                 <h2 className="text-2xl md:text-3xl font-bold text-slate-800">
                  {navItems.find(i => i.id === activeTab)?.label}
                 </h2>
                 <p className="text-slate-500 mt-1">
                   "เดินทางไกล ที่ต้องไปเป็นทีม" (To Travel Far... We Must Go as a Team)
                 </p>
              </div>
              <div className="hidden md:block text-right">
                 <p className="text-sm text-slate-400">วันที่</p>
                 <p className="font-bold text-slate-700">{new Date().toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
              </div>
           </div>

           {renderContent()}
        </div>
      </main>
    </div>
  );
}