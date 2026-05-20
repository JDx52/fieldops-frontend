/* eslint-disable */
// v4.0 — work order autofill, saved work orders, job notes/invoices
import { useState, useContext, createContext, useCallback, useEffect } from "react";
import WorkOrder405 from "./WorkOrder405";
import Pricebook from "./Pricebook";

const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Epilogue:ital,wght@0,300;0,400;0,500;0,600;1,400&family=DM+Mono:wght@400;500;600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --nav-bg:#0C1220; --nav-border:#1A2340; --nav-text:#8899BB; --nav-active:#FFFFFF; --nav-hover:#1E2D4A; --nav-accent:#3B82F6;
    --bg:#F1F3F7; --surface:#FFFFFF; --surface2:#F8F9FB; --border:#E4E8EF; --border2:#CDD3DE;
    --text1:#0D1117; --text2:#4A5568; --text3:#8A94A6; --text4:#B8C2CC;
    --blue:#2563EB; --blue-lt:#EFF6FF; --blue-bd:#BFDBFE;
    --green:#0D7B4E; --green-lt:#ECFDF5; --green-bd:#A7F3D0;
    --amber:#B45309; --amber-lt:#FFFBEB; --amber-bd:#FCD34D;
    --red:#DC2626; --red-lt:#FEF2F2; --red-bd:#FECACA;
    --display:'Syne',sans-serif; --sans:'Epilogue',-apple-system,sans-serif; --mono:'DM Mono',monospace;
  }
  html,body,#root{height:100%}
  body{font-family:var(--sans);background:var(--bg);color:var(--text1);font-size:14px;line-height:1.5}
  button{font-family:var(--sans);cursor:pointer}
  input,textarea,select{font-family:var(--sans)}
  ::-webkit-scrollbar{width:4px;height:4px}
  ::-webkit-scrollbar-track{background:transparent}
  ::-webkit-scrollbar-thumb{background:var(--border2);border-radius:8px}
  @keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
  @keyframes spin{to{transform:rotate(360deg)}}
  .fade-in{animation:fadeIn .2s ease both}
  .s1{animation-delay:.05s}.s2{animation-delay:.10s}.s3{animation-delay:.15s}
`;

// ── WORK ORDER API ──
const WO_KEY = "fieldops_workorders_cache"; // keep cache as fallback
function loadWorkOrders() { try { return JSON.parse(localStorage.getItem(WO_KEY)||"[]"); } catch { return []; } }
function cacheWorkOrders(list) { try { localStorage.setItem(WO_KEY, JSON.stringify(list)); } catch {} }

async function fetchWorkOrders(params = "") {
  try {
    const data = await apiFetch(`/work-orders?limit=200${params}`);
    const list = Array.isArray(data) ? data.map(normalizeWO) : [];
    cacheWorkOrders(list);
    return list;
  } catch { return loadWorkOrders(); }
}

async function saveWorkOrder(wo) {
  try {
    const payload = {
      wo_number: wo.wo || wo.wo_number || String(Date.now()),
      job_id: wo.jobId || null,
      customer_id: wo.customerId || null,
      date: wo.date || null,
      customer: wo.customer || null,
      billing_address: wo.billingAddress || null,
      phone: wo.phone || null,
      cell: wo.cell || null,
      email: wo.email || null,
      complaint: wo.complaint || null,
      worked_by: wo.workedBy || null,
      unit_address: wo.unitAddress || null,
      unit_phone: wo.unitPhone || null,
      unit_cell: wo.unitCell || null,
      job_types: wo.jobTypes || [],
      equipment: wo.equipment || [],
      technician: wo.technician || null,
      time_in: wo.timeIn || null,
      time_out: wo.timeOut || null,
      travel_time: wo.travelTime || null,
      reg_hrs: wo.regHrs || null,
      ot_hrs: wo.otHrs || null,
      rate: wo.rate || null,
      amount: wo.amount || null,
      checklist: wo.checklist || [],
      description_of_work: wo.descriptionOfWork || null,
      recommendations: wo.recommendations || null,
      materials: wo.materials || [],
      service_type: wo.serviceType || [],
      total_amount: wo.totalAmount || null,
      print_name: wo.printName || null,
      signature: wo.signature || null,
      sign_date: wo.signDate || null,
    };
    const saved = await apiFetch("/work-orders", { method: "POST", body: JSON.stringify(payload) });
    return normalizeWO(saved);
  } catch(e) {
    console.error("WO save failed, using cache:", e);
    // fallback: save to localStorage
    const list = loadWorkOrders();
    const idx = list.findIndex(w => w.wo === wo.wo);
    if (idx >= 0) list[idx] = wo; else list.unshift(wo);
    cacheWorkOrders(list);
    return wo;
  }
}

async function deleteWorkOrder(id) {
  try { await apiFetch(`/work-orders/${id}`, { method: "DELETE" }); } catch(e) { console.error(e); }
}

function normalizeWO(w) {
  // Map snake_case API fields back to camelCase used in the frontend
  return {
    id: w.id,
    wo: w.wo_number || w.wo,
    date: w.date,
    customer: w.customer,
    customerId: w.customer_id || w.customerId,
    jobId: w.job_id || w.jobId,
    billingAddress: w.billing_address || w.billingAddress,
    phone: w.phone,
    cell: w.cell,
    email: w.email,
    complaint: w.complaint,
    workedBy: w.worked_by || w.workedBy,
    unitAddress: w.unit_address || w.unitAddress,
    unitPhone: w.unit_phone || w.unitPhone,
    unitCell: w.unit_cell || w.unitCell,
    jobTypes: w.job_types || w.jobTypes || [],
    equipment: w.equipment || [],
    technician: w.technician,
    timeIn: w.time_in || w.timeIn,
    timeOut: w.time_out || w.timeOut,
    travelTime: w.travel_time || w.travelTime,
    regHrs: w.reg_hrs || w.regHrs,
    otHrs: w.ot_hrs || w.otHrs,
    rate: w.rate,
    amount: w.amount,
    checklist: w.checklist || [],
    descriptionOfWork: w.description_of_work || w.descriptionOfWork,
    recommendations: w.recommendations,
    materials: w.materials || [],
    serviceType: w.service_type || w.serviceType || [],
    totalAmount: w.total_amount || w.totalAmount,
    printName: w.print_name || w.printName,
    signature: w.signature,
    signDate: w.sign_date || w.signDate,
    savedAt: w.created_at || w.savedAt,
  };
}

// ── CURRENT JOB CONTEXT (for autofill) ──
const JobContext = createContext(null);
const useJobContext = () => useContext(JobContext);

// ── API ──
const API_URL = process.env.REACT_APP_API_URL || "https://fieldops-api-production-b341.up.railway.app/v1";
function getToken() { return localStorage.getItem("fieldops_token"); }
async function apiFetch(path, options = {}) {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message || "Request failed");
  return data.data;
}

// ── AUTH ──
const AuthContext = createContext(null);
function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    const saved = localStorage.getItem("fsm_user");
    const token = localStorage.getItem("fieldops_token");
    if (saved && token) try { setUser(JSON.parse(saved)); } catch {}
  }, []);
  async function login(email, password) {
    setLoading(true);
    try {
      const data = await apiFetch("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
      localStorage.setItem("fieldops_token", data.token);
      const u = { ...data.user, company: data.company || data.user.company || { name: "405 Heating & Air Conditioning" } };
      localStorage.setItem("fsm_user", JSON.stringify(u));
      setUser(u); setLoading(false); return { ok: true };
    } catch (err) { setLoading(false); return { ok: false, error: err.message || "Invalid email or password" }; }
  }
  function logout() { setUser(null); localStorage.removeItem("fsm_user"); localStorage.removeItem("fieldops_token"); }
  return <AuthContext.Provider value={{ user, login, logout, loading }}>{children}</AuthContext.Provider>;
}
const useAuth = () => useContext(AuthContext);

// ── ROUTER ──
const RouterContext = createContext(null);
function RouterProvider({ children }) {
  const [route, setRoute] = useState(() => {
    if (!window.location.hash) { window.location.hash = "/"; return "/"; }
    return window.location.hash.slice(1) || "/";
  });
  const navigate = useCallback(path => { window.location.hash = path; setRoute(path); }, []);
  useEffect(() => {
    const handler = () => setRoute(window.location.hash.slice(1) || "/");
    window.addEventListener("hashchange", handler);
    return () => window.removeEventListener("hashchange", handler);
  }, []);
  return <RouterContext.Provider value={{ route, navigate }}>{children}</RouterContext.Provider>;
}
const useRouter = () => useContext(RouterContext);

// ── SHARED UI ──
const STATUS_CFG = {
  scheduled:{label:"Scheduled",color:"#2563EB",bg:"#EFF6FF",bd:"#BFDBFE"},
  in_progress:{label:"In Progress",color:"#D97706",bg:"#FFFBEB",bd:"#FCD34D"},
  en_route:{label:"En Route",color:"#7C3AED",bg:"#F5F3FF",bd:"#DDD6FE"},
  completed:{label:"Completed",color:"#0D7B4E",bg:"#ECFDF5",bd:"#A7F3D0"},
  cancelled:{label:"Cancelled",color:"#6B7280",bg:"#F9FAFB",bd:"#E5E7EB"},
  on_hold:{label:"On Hold",color:"#DC2626",bg:"#FEF2F2",bd:"#FECACA"},
  unscheduled:{label:"Unscheduled",color:"#6B7280",bg:"#F9FAFB",bd:"#E5E7EB"},
  draft:{label:"Draft",color:"#6B7280",bg:"#F9FAFB",bd:"#E5E7EB"},
  sent:{label:"Sent",color:"#2563EB",bg:"#EFF6FF",bd:"#BFDBFE"},
  paid:{label:"Paid",color:"#0D7B4E",bg:"#ECFDF5",bd:"#A7F3D0"},
  overdue:{label:"Overdue",color:"#DC2626",bg:"#FEF2F2",bd:"#FECACA"},
  partial:{label:"Partial",color:"#D97706",bg:"#FFFBEB",bd:"#FCD34D"},
};

function Chip({ status }) {
  const c = STATUS_CFG[status] || STATUS_CFG.draft;
  return <span style={{ display:"inline-flex",alignItems:"center",gap:5,background:c.bg,color:c.color,border:`1px solid ${c.bd}`,borderRadius:4,padding:"2px 8px",fontSize:11,fontWeight:600,fontFamily:"var(--display)",letterSpacing:"0.04em",whiteSpace:"nowrap" }}><span style={{ width:5,height:5,borderRadius:"50%",background:c.color }} />{c.label}</span>;
}

function Btn({ children, variant="primary", onClick, small, disabled, full, style:sx={} }) {
  const variants = { primary:{background:"var(--blue)",color:"#fff",border:"1px solid transparent"}, secondary:{background:"var(--surface)",color:"var(--text2)",border:"1px solid var(--border)"}, ghost:{background:"transparent",color:"var(--text3)",border:"1px solid transparent"}, danger:{background:"var(--red-lt)",color:"var(--red)",border:"1px solid var(--red-bd)"} };
  return <button onClick={disabled?undefined:onClick} style={{ ...variants[variant],borderRadius:8,fontWeight:500,padding:small?"5px 12px":"9px 18px",fontSize:small?12:13,opacity:disabled?.5:1,cursor:disabled?"not-allowed":"pointer",transition:"all .12s",width:full?"100%":"auto",...sx }} onMouseEnter={e=>{if(!disabled)e.currentTarget.style.filter="brightness(.9)"}} onMouseLeave={e=>e.currentTarget.style.filter=""}>{children}</button>;
}

function Card({ children, style:sx={}, className="", onClick }) {
  return <div className={className} onClick={onClick} style={{ background:"var(--surface)",border:"1px solid var(--border)",borderRadius:12,...sx }}>{children}</div>;
}

function Spinner() {
  return <div style={{ width:20,height:20,border:"2px solid var(--border)",borderTopColor:"var(--blue)",borderRadius:"50%",animation:"spin .7s linear infinite",margin:"40px auto" }} />;
}

function EmptyState({ icon, title, desc, action }) {
  return <div style={{ textAlign:"center",padding:"60px 20px",color:"var(--text3)" }}><div style={{ fontSize:48,marginBottom:12 }}>{icon}</div><div style={{ fontSize:18,fontFamily:"var(--display)",fontWeight:700,color:"var(--text1)",marginBottom:8 }}>{title}</div><div style={{ fontSize:14,marginBottom:20,maxWidth:300,margin:"0 auto 20px" }}>{desc}</div>{action}</div>;
}

function Modal({ title, onClose, children, width=520 }) {
  return <div style={{ position:"fixed",inset:0,background:"#00000060",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center",padding:20 }} onClick={e=>e.target===e.currentTarget&&onClose()}><div className="fade-in" style={{ background:"var(--surface)",borderRadius:16,width:"100%",maxWidth:width,maxHeight:"90vh",overflowY:"auto",border:"1px solid var(--border)",boxShadow:"0 24px 64px #00000030" }}><div style={{ padding:"20px 24px",borderBottom:"1px solid var(--border)",display:"flex",justifyContent:"space-between",alignItems:"center" }}><h3 style={{ fontSize:18,fontFamily:"var(--display)",fontWeight:700 }}>{title}</h3><button onClick={onClose} style={{ background:"none",border:"none",fontSize:20,color:"var(--text3)",cursor:"pointer" }}>×</button></div>{children}</div></div>;
}

function FormField({ label, children }) {
  return <div><label style={{ fontSize:11,fontWeight:600,color:"var(--text2)",letterSpacing:"0.05em",textTransform:"uppercase",display:"block",marginBottom:6,fontFamily:"var(--display)" }}>{label}</label>{children}</div>;
}

const inputStyle = { width:"100%",padding:"9px 12px",borderRadius:7,fontSize:13,border:"1px solid var(--border)",outline:"none",transition:"border-color .15s" };
function fmt$(n) { return n==null?"—":"$"+Number(n).toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2}); }
function fmtDate(s) { if(!s)return"—"; return new Date(s).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}); }

// ── LOGIN ──
function LoginScreen() {
  const { login, loading } = useAuth();
  const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [error, setError] = useState("");
  async function handleSubmit(e) { e?.preventDefault(); setError(""); const res = await login(email, password); if (!res.ok) setError(res.error); }
  return (
    <div style={{ minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"linear-gradient(135deg,#0C1220 0%,#1A2340 100%)",padding:24 }}>
      <div style={{ width:"100%",maxWidth:420 }}>
        <div style={{ textAlign:"center",marginBottom:40 }}>
          <div style={{ width:56,height:56,borderRadius:14,background:"linear-gradient(135deg,#3B82F6,#1D4ED8)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,margin:"0 auto 16px",boxShadow:"0 12px 40px #3B82F640" }}>⚡</div>
          <div style={{ fontSize:28,fontFamily:"var(--display)",fontWeight:800,color:"#fff",letterSpacing:"-0.02em" }}>FieldOps</div>
          <div style={{ fontSize:13,color:"#8899BB",marginTop:4 }}>Sign in to your workspace</div>
        </div>
        <div style={{ background:"rgba(255,255,255,.05)",backdropFilter:"blur(20px)",border:"1px solid rgba(255,255,255,.10)",borderRadius:16,padding:"32px",boxShadow:"0 24px 64px rgba(0,0,0,.4)" }}>
          {error && <div style={{ background:"var(--red-lt)",border:"1px solid var(--red-bd)",borderRadius:8,padding:"10px 14px",fontSize:13,color:"var(--red)",marginBottom:16 }}>{error}</div>}
          <form onSubmit={handleSubmit} style={{ display:"flex",flexDirection:"column",gap:14 }}>
            <input value={email} onChange={e=>setEmail(e.target.value)} type="email" placeholder="Email address" style={{ padding:"14px 16px",borderRadius:10,background:"rgba(255,255,255,.08)",border:"1px solid rgba(255,255,255,.15)",color:"#fff",fontSize:14,outline:"none" }} />
            <input value={password} onChange={e=>setPassword(e.target.value)} type="password" placeholder="Password" style={{ padding:"14px 16px",borderRadius:10,background:"rgba(255,255,255,.08)",border:"1px solid rgba(255,255,255,.15)",color:"#fff",fontSize:14,outline:"none" }} onKeyDown={e=>e.key==="Enter"&&handleSubmit()} />
            <button type="submit" disabled={loading} style={{ padding:"14px",background:"linear-gradient(135deg,#3B82F6,#1D4ED8)",border:"none",borderRadius:10,color:"#fff",fontSize:15,fontWeight:700,cursor:"pointer",fontFamily:"var(--display)",boxShadow:"0 4px 16px #3B82F640",opacity:loading?.7:1 }}>{loading?"Signing in…":"Sign In →"}</button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ── SIDEBAR ──
const NAV_ITEMS = [
  {id:"/",icon:"⊞",label:"Dashboard"},
  {id:"/dispatch",icon:"📡",label:"Dispatch"},
  {id:"/customers",icon:"👥",label:"Customers"},
  {id:"/invoices",icon:"📄",label:"Work Orders"},
  {id:"/jobs",icon:"🔧",label:"Jobs"},
  {id:"/team",icon:"👷",label:"Team"},
  {id:"/workorder",icon:"📋",label:"Work Order"},
  {id:"/pricebook",icon:"💲",label:"Pricebook"},
  {id:"/reports",icon:"📊",label:"Reports"},
];

function Sidebar({ collapsed, setCollapsed }) {
  const { route, navigate } = useRouter();
  const { user, logout } = useAuth();
  return (
    <div style={{ width:collapsed?56:220,flexShrink:0,background:"var(--nav-bg)",borderRight:"1px solid var(--nav-border)",display:"flex",flexDirection:"column",transition:"width .2s ease",overflow:"hidden" }}>
      <div style={{ height:56,display:"flex",alignItems:"center",padding:collapsed?"0":"0 16px",justifyContent:collapsed?"center":"space-between",borderBottom:"1px solid var(--nav-border)",flexShrink:0 }}>
        {!collapsed&&<div style={{ display:"flex",alignItems:"center",gap:9 }}><div style={{ width:28,height:28,borderRadius:7,background:"linear-gradient(135deg,#3B82F6,#1D4ED8)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0 }}>⚡</div><span style={{ fontSize:15,fontFamily:"var(--display)",fontWeight:800,color:"#fff",letterSpacing:"-0.01em",whiteSpace:"nowrap" }}>FieldOps</span></div>}
        {collapsed&&<span style={{ fontSize:16 }}>⚡</span>}
        {!collapsed&&<button onClick={()=>setCollapsed(true)} style={{ background:"none",border:"none",color:"var(--nav-text)",cursor:"pointer",fontSize:14,padding:"4px",borderRadius:4 }}>◀</button>}
      </div>
      {collapsed&&<button onClick={()=>setCollapsed(false)} style={{ margin:"8px auto 0",background:"none",border:"none",color:"var(--nav-text)",cursor:"pointer",fontSize:13,padding:"4px 0",width:"100%",textAlign:"center" }}>▶</button>}
      {!collapsed&&<div style={{ margin:"10px 10px 4px",padding:"8px 10px",background:"rgba(59,130,246,.08)",border:"1px solid rgba(59,130,246,.15)",borderRadius:7 }}><div style={{ fontSize:10,color:"var(--nav-text)",fontFamily:"var(--display)",letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:2 }}>Workspace</div><div style={{ fontSize:12,color:"#fff",fontWeight:600,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>{user?.company?.name||"My Company"}</div></div>}
      <nav style={{ flex:1,padding:collapsed?"8px 6px":"8px 10px",display:"flex",flexDirection:"column",gap:2,overflowY:"auto" }}>
        {NAV_ITEMS.map(item=>{
          const active=route===item.id;
          return <button key={item.id} onClick={()=>navigate(item.id)} title={collapsed?item.label:""} style={{ display:"flex",alignItems:"center",gap:10,padding:collapsed?"10px 0":"9px 14px",justifyContent:collapsed?"center":"flex-start",width:"100%",background:active?"rgba(59,130,246,.15)":"transparent",border:active?"1px solid rgba(59,130,246,.25)":"1px solid transparent",borderRadius:8,color:active?"#fff":"var(--nav-text)",cursor:"pointer",transition:"all .12s",textAlign:"left",fontSize:13,fontWeight:active?600:400 }} onMouseEnter={e=>{if(!active){e.currentTarget.style.background="var(--nav-hover)";e.currentTarget.style.color="#fff";}}} onMouseLeave={e=>{if(!active){e.currentTarget.style.background="transparent";e.currentTarget.style.color="var(--nav-text)";}}}>
            <span style={{ fontSize:15,flexShrink:0,lineHeight:1 }}>{item.icon}</span>
            {!collapsed&&<span>{item.label}</span>}
            {active&&!collapsed&&<span style={{ marginLeft:"auto",width:5,height:5,borderRadius:"50%",background:"var(--nav-accent)" }} />}
          </button>;
        })}
      </nav>
      <div style={{ padding:collapsed?"8px 6px":"8px 10px",borderTop:"1px solid var(--nav-border)" }}>
        <div style={{ padding:collapsed?"8px 0":"8px 10px",display:"flex",alignItems:"center",gap:9,justifyContent:collapsed?"center":"flex-start",borderRadius:8,cursor:"pointer" }} onClick={logout} onMouseEnter={e=>e.currentTarget.style.background="var(--nav-hover)"} onMouseLeave={e=>e.currentTarget.style.background="transparent"} title={collapsed?`${user?.name} · Sign out`:""}>
          <div style={{ width:28,height:28,borderRadius:"50%",background:"#3B82F620",border:"1px solid #3B82F660",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:"#3B82F6",flexShrink:0,fontFamily:"var(--display)" }}>{user?.name?.split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase()}</div>
          {!collapsed&&<div style={{ flex:1,minWidth:0 }}><div style={{ fontSize:12,fontWeight:600,color:"#fff",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>{user?.name}</div><div style={{ fontSize:10,color:"var(--nav-text)" }}>Sign out</div></div>}
        </div>
      </div>
    </div>
  );
}

// ── TOP BAR ──
const PAGE_TITLES = {"/":"Dashboard","/dispatch":"Dispatch","/customers":"Customers","/invoices":"Work Orders","/jobs":"Jobs","/team":"Team","/workorder":"Work Order","/pricebook":"Pricebook","/reports":"Reports"};
function TopBar() {
  const { route } = useRouter();
  return <div style={{ height:56,background:"var(--surface)",borderBottom:"1px solid var(--border)",display:"flex",alignItems:"center",padding:"0 24px",gap:16,flexShrink:0 }}><h1 style={{ flex:1,fontSize:18,fontFamily:"var(--display)",fontWeight:700,letterSpacing:"-0.01em" }}>{PAGE_TITLES[route]||"FieldOps"}</h1><div style={{ fontSize:11,color:"var(--text3)",fontFamily:"var(--mono)",whiteSpace:"nowrap" }}>{new Date().toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"})}</div></div>;
}

// ── DASHBOARD ──
function Dashboard() {
  const { user } = useAuth();
  const { navigate } = useRouter();
  const [stats, setStats] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    async function load() {
      try {
        const [s,j,wo] = await Promise.all([
          apiFetch("/company/stats"),
          apiFetch("/jobs?limit=5"),
          apiFetch("/work-orders?limit=500").catch(()=>({total:0,data:[]}))
        ]);
        const woList = Array.isArray(wo?.data) ? wo.data : [];
        const now = new Date();
        const revenueThisMonth = woList
          .filter(w => { const d = new Date(w.created_at || w.saved_at || w.savedAt); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); })
          .reduce((sum, w) => sum + (parseFloat(w.total_amount || w.totalAmount) || 0), 0);
        setStats({...s, work_orders_count: wo?.total || woList.length, revenue_this_month: revenueThisMonth});
        setJobs(Array.isArray(j)?j:[]);
      } catch(e) { console.error(e); }
      setLoading(false);
    }
    load();
  }, []);
  if (loading) return <div style={{ flex:1,display:"flex",alignItems:"center",justifyContent:"center" }}><Spinner /></div>;
  return (
    <div style={{ padding:24,overflowY:"auto",flex:1 }}>
      <div className="fade-in" style={{ marginBottom:24 }}><h2 style={{ fontSize:22,fontFamily:"var(--display)",fontWeight:700,marginBottom:4 }}>Good morning, {user?.name?.split(" ")[0]} 👋</h2><p style={{ fontSize:13,color:"var(--text3)" }}>Here's what's happening at {user?.company?.name} today.</p></div>
      <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:20 }}>
        {[{label:"Jobs Today",val:stats?.jobs_today??0,icon:"📅",color:"var(--blue)"},{label:"This Week",val:stats?.jobs_this_week??0,icon:"📆",color:"#7C3AED"},{label:"Revenue / Month",val:fmt$(stats?.revenue_this_month??0),icon:"💰",color:"var(--green)"},{label:"Work Orders",val:stats?.work_orders_count??0,icon:"📋",color:"var(--amber)"}].map((k,i)=>(
          <Card key={i} className={`fade-in s${Math.min(i+1,3)}`} style={{ padding:"16px 18px" }}><div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10 }}><span style={{ fontSize:11,color:"var(--text3)",fontWeight:600,fontFamily:"var(--display)",letterSpacing:"0.06em",textTransform:"uppercase" }}>{k.label}</span><span style={{ fontSize:18 }}>{k.icon}</span></div><div style={{ fontSize:26,fontFamily:"var(--mono)",fontWeight:600,color:k.color,lineHeight:1 }}>{k.val}</div></Card>
        ))}
      </div>
      <Card>
        <div style={{ padding:"18px 20px 0",display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16 }}><h3 style={{ fontSize:14,fontWeight:700,fontFamily:"var(--display)" }}>Recent Jobs</h3><Btn small variant="secondary" onClick={()=>navigate("/jobs")}>View all →</Btn></div>
        {jobs.length===0?<EmptyState icon="🔧" title="No jobs yet" desc="Create your first job to get started" action={<Btn onClick={()=>navigate("/jobs")}>+ New Job</Btn>} />:(
          <table style={{ width:"100%",borderCollapse:"collapse" }}>
            <thead><tr style={{ background:"var(--surface2)" }}>{["Job #","Title","Customer","Status","Date"].map(h=><th key={h} style={{ padding:"8px 16px",textAlign:"left",fontSize:11,fontWeight:600,color:"var(--text3)",fontFamily:"var(--display)",letterSpacing:"0.06em",textTransform:"uppercase",borderTop:"1px solid var(--border)",borderBottom:"1px solid var(--border)" }}>{h}</th>)}</tr></thead>
            <tbody>{jobs.map(job=><tr key={job.id} style={{ borderBottom:"1px solid var(--border)",cursor:"pointer",transition:"background .1s" }} onMouseEnter={e=>e.currentTarget.style.background="var(--surface2)"} onMouseLeave={e=>e.currentTarget.style.background=""} onClick={()=>navigate("/jobs")}><td style={{ padding:"12px 16px",fontSize:12,fontFamily:"var(--mono)",color:"var(--text3)" }}>{job.job_number}</td><td style={{ padding:"12px 16px",fontSize:13,fontWeight:500 }}>{job.title}</td><td style={{ padding:"12px 16px",fontSize:13,color:"var(--text2)" }}>{job.customer_name}</td><td style={{ padding:"12px 16px" }}><Chip status={job.status} /></td></tr>)}</tbody>
          </table>
        )}
      </Card>
    </div>
  );
}

// ── CUSTOMER DETAIL ──
function CustomerDetail({ customer, onBack, onDelete }) {
  const { navigate } = useRouter();
  const { setCurrentJob } = useJobContext();
  const [jobs, setJobs] = useState([]);
  const [notes, setNotes] = useState(customer.notes||"");
  const [editingNotes, setEditingNotes] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [tab, setTab] = useState("info");
  const [workOrders, setWorkOrders] = useState([]);
  const [viewWO, setViewWO] = useState(null);
  const [detailJob, setDetailJob] = useState(null);

  useEffect(() => {
    apiFetch(`/customers/${customer.id}/jobs`).then(d=>setJobs(Array.isArray(d)?d:[])).catch(()=>setJobs([])).finally(()=>setLoadingJobs(false));
    const name = `${customer.first_name} ${customer.last_name}`;
    fetchWorkOrders(`&customer_id=${customer.id}`).then(all => {
      // also match by name in case customer_id wasn't saved
      const matched = all.filter(w => w.customerId === customer.id || w.customer === name);
      setWorkOrders(matched);
    });
  }, [customer.id]);

  async function saveNotes() {
    setSavingNotes(true);
    try { await apiFetch(`/customers/${customer.id}`,{method:"PATCH",body:JSON.stringify({notes})}); setEditingNotes(false); } catch(e) { alert(e.message); }
    setSavingNotes(false);
  }

  const tabStyle = t => ({ flex:1,padding:"10px 0",background:"none",border:"none",borderBottom:tab===t?"2px solid var(--blue)":"2px solid transparent",color:tab===t?"var(--blue)":"var(--text3)",fontSize:13,fontWeight:tab===t?700:400,cursor:"pointer",transition:"all .15s" });

  return (
    <div style={{ flex:1,display:"flex",flexDirection:"column",overflow:"hidden",background:"var(--bg)",position:"relative" }}>
      {detailJob && <JobDetailModal job={detailJob} onClose={()=>setDetailJob(null)} />}
      {viewWO && (
        <div style={{ position:"absolute",inset:0,background:"var(--bg)",zIndex:50,display:"flex",flexDirection:"column",overflow:"hidden" }}>
          <div style={{ background:"var(--surface)",borderBottom:"1px solid var(--border)",padding:"12px 16px",display:"flex",justifyContent:"space-between",alignItems:"center",flexShrink:0 }}>
            <button onClick={()=>setViewWO(null)} style={{ background:"none",border:"none",color:"var(--blue)",fontSize:14,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:4,padding:0 }}>← Back</button>
            <div style={{ fontSize:14,fontWeight:700,fontFamily:"var(--display)" }}>Work Order — {viewWO.customer||"Customer"}</div>
            <div style={{ width:60 }} />
          </div>
          <div style={{ flex:1,overflowY:"auto",padding:16,display:"flex",flexDirection:"column",gap:12 }}>
            {/* Header info */}
            <Card style={{ padding:"14px 16px" }}>
              <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10 }}>
                {[["WO#",viewWO.wo],["Date",viewWO.date],["Customer",viewWO.customer],["Phone",viewWO.phone],["Address",viewWO.billingAddress],["Email",viewWO.email],["Complaint",viewWO.complaint],["Technician",viewWO.technician],["Time In",viewWO.timeIn],["Time Out",viewWO.timeOut]].filter(([,v])=>v).map(([l,v])=>(
                  <div key={l}><div style={{ fontSize:10,fontWeight:700,color:"var(--text3)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:2 }}>{l}</div><div style={{ fontSize:13 }}>{v}</div></div>
                ))}
              </div>
            </Card>
            {/* Job types */}
            {viewWO.jobTypes?.length>0 && <Card style={{ padding:"14px 16px" }}><div style={{ fontSize:10,fontWeight:700,color:"var(--text3)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:8 }}>Job Type</div><div style={{ display:"flex",flexWrap:"wrap",gap:6 }}>{viewWO.jobTypes.map(t=><span key={t} style={{ background:"var(--blue-lt)",color:"var(--blue)",border:"1px solid var(--blue-bd)",fontSize:11,fontWeight:600,padding:"3px 10px",borderRadius:100 }}>{t}</span>)}</div></Card>}
            {/* Checklist */}
            {viewWO.checklist?.length>0 && <Card style={{ padding:"14px 16px" }}><div style={{ fontSize:10,fontWeight:700,color:"var(--text3)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:8 }}>Service Checklist</div><div style={{ display:"flex",flexWrap:"wrap",gap:6 }}>{viewWO.checklist.map(item=><span key={item} style={{ background:"var(--green-lt)",color:"var(--green)",border:"1px solid var(--green-bd)",fontSize:11,fontWeight:600,padding:"3px 10px",borderRadius:100 }}>✓ {item}</span>)}</div></Card>}
            {/* Description */}
            {viewWO.descriptionOfWork && <Card style={{ padding:"14px 16px" }}><div style={{ fontSize:10,fontWeight:700,color:"var(--text3)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:8 }}>Description of Work</div><div style={{ fontSize:13,lineHeight:1.7,whiteSpace:"pre-wrap" }}>{viewWO.descriptionOfWork}</div></Card>}
            {/* Recommendations */}
            {viewWO.recommendations && <Card style={{ padding:"14px 16px" }}><div style={{ fontSize:10,fontWeight:700,color:"var(--text3)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:8 }}>Recommendations</div><div style={{ fontSize:13,lineHeight:1.7,whiteSpace:"pre-wrap" }}>{viewWO.recommendations}</div></Card>}
            {/* Materials */}
            {viewWO.materials?.some(m=>m.description) && (
              <Card style={{ padding:"14px 16px" }}>
                <div style={{ fontSize:10,fontWeight:700,color:"var(--text3)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:10 }}>Materials</div>
                <table style={{ width:"100%",borderCollapse:"collapse",fontSize:13 }}>
                  <thead><tr style={{ background:"var(--surface2)" }}>{["Qty","Description","Unit Price","Amount"].map(h=><th key={h} style={{ padding:"6px 10px",textAlign:"left",fontSize:11,fontWeight:600,color:"var(--text3)",borderBottom:"1px solid var(--border)" }}>{h}</th>)}</tr></thead>
                  <tbody>{viewWO.materials.filter(m=>m.description).map((m,i)=><tr key={i} style={{ borderBottom:"1px solid var(--border)" }}><td style={{ padding:"8px 10px" }}>{m.qty||"1"}</td><td style={{ padding:"8px 10px" }}>{m.description}</td><td style={{ padding:"8px 10px" }}>{m.unitPrice?`$${m.unitPrice}`:""}</td><td style={{ padding:"8px 10px",fontWeight:600,color:"var(--green)" }}>{m.amount?`$${m.amount}`:""}</td></tr>)}</tbody>
                </table>
              </Card>
            )}
            {/* Total */}
            <div style={{ display:"flex",justifyContent:"flex-end" }}>
              <div style={{ background:"var(--blue-lt)",border:"1px solid var(--blue-bd)",borderRadius:10,padding:"14px 24px",textAlign:"right" }}>
                <div style={{ fontSize:11,color:"var(--text3)",marginBottom:4,textTransform:"uppercase",letterSpacing:"0.08em" }}>Total Due</div>
                <div style={{ fontSize:28,fontFamily:"var(--mono)",fontWeight:700,color:"var(--blue)" }}>{viewWO.totalAmount?`$${viewWO.totalAmount}`:"—"}</div>
              </div>
            </div>
            {/* Signature */}
            {viewWO.signature && <Card style={{ padding:"14px 16px" }}><div style={{ fontSize:10,fontWeight:700,color:"var(--text3)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:8 }}>Signature</div><img src={viewWO.signature} alt="Signature" style={{ maxWidth:"100%",height:80,objectFit:"contain",border:"1px solid var(--border)",borderRadius:6,background:"#fff" }} />{viewWO.printName&&<div style={{ fontSize:13,marginTop:6 }}>{viewWO.printName} · {viewWO.signDate||""}</div>}</Card>}
          </div>
        </div>
      )}
      <div style={{ background:"var(--surface)",borderBottom:"1px solid var(--border)",flexShrink:0 }}>
        <div style={{ padding:"12px 16px" }}><button onClick={onBack} style={{ background:"none",border:"none",color:"var(--blue)",fontSize:14,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:4,padding:0 }}>← Customers</button></div>
        <div style={{ padding:"0 16px 16px",display:"flex",justifyContent:"space-between",alignItems:"flex-end" }}>
          <div><h2 style={{ fontSize:22,fontFamily:"var(--display)",fontWeight:800,marginBottom:4 }}>{customer.first_name} {customer.last_name}</h2><div style={{ display:"flex",flexDirection:"column",gap:3 }}>{customer.phone&&<span style={{ fontSize:13,color:"var(--text3)" }}>📞 {customer.phone}</span>}{customer.email&&<span style={{ fontSize:13,color:"var(--text3)" }}>✉ {customer.email}</span>}</div></div>
          <Btn small variant="danger" onClick={()=>onDelete(customer.id)}>Archive</Btn>
        </div>
        <div style={{ display:"flex",borderTop:"1px solid var(--border)" }}>
          <button style={tabStyle("info")} onClick={()=>setTab("info")}>Info</button>
          <button style={tabStyle("notes")} onClick={()=>setTab("notes")}>📋 Notes</button>
          <button style={tabStyle("jobs")} onClick={()=>setTab("jobs")}>Jobs ({jobs.length})</button>
          <button style={tabStyle("workorders")} onClick={()=>setTab("workorders")}>Work Orders ({workOrders.length})</button>
        </div>
      </div>
      <div style={{ flex:1,overflowY:"auto",padding:16 }}>
        {tab==="info" && (
          <div style={{ display:"flex",flexDirection:"column",gap:12 }}>
            <Card style={{ padding:"14px 16px" }}><div style={{ fontSize:10,fontWeight:700,color:"var(--text3)",letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:12,fontFamily:"var(--display)" }}>Contact Information</div>{[["Phone",customer.phone],["Email",customer.email],["Source",customer.source]].filter(([,v])=>v).map(([l,v])=><div key={l} style={{ display:"flex",gap:12,marginBottom:10,alignItems:"center" }}><span style={{ fontSize:12,color:"var(--text3)",width:60,flexShrink:0 }}>{l}</span><span style={{ fontSize:13,fontWeight:500 }}>{v}</span></div>)}</Card>
            <Card style={{ padding:"14px 16px" }}><div style={{ fontSize:10,fontWeight:700,color:"var(--text3)",letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:8,fontFamily:"var(--display)" }}>Stats</div><div style={{ display:"flex",gap:24 }}><div><div style={{ fontSize:28,fontFamily:"var(--mono)",fontWeight:700,color:"var(--blue)" }}>{customer.job_count||0}</div><div style={{ fontSize:11,color:"var(--text3)" }}>Total jobs</div></div></div></Card>
          </div>
        )}
        {tab==="notes" && (
          <div style={{ display:"flex",flexDirection:"column",gap:12 }}>
            <Card style={{ padding:"14px 16px" }}>
              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12 }}><div><div style={{ fontSize:10,fontWeight:700,color:"var(--text3)",letterSpacing:"0.08em",textTransform:"uppercase",fontFamily:"var(--display)" }}>Internal Notes</div><div style={{ fontSize:11,color:"var(--text3)",marginTop:2 }}>Visible to all techs</div></div>{!editingNotes&&<Btn small variant="secondary" onClick={()=>setEditingNotes(true)}>Edit</Btn>}</div>
              {editingNotes?(<><textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Gate code, dogs, access notes..." style={{ ...inputStyle,height:180,resize:"vertical",marginBottom:10 }} autoFocus /><div style={{ display:"flex",gap:8 }}><Btn small onClick={saveNotes} disabled={savingNotes}>{savingNotes?"Saving…":"Save Notes"}</Btn><Btn small variant="secondary" onClick={()=>{setEditingNotes(false);setNotes(customer.notes||"");}}>Cancel</Btn></div></>):notes?<p style={{ fontSize:14,color:"var(--text1)",lineHeight:1.7,whiteSpace:"pre-wrap" }}>{notes}</p>:<div style={{ fontSize:13,color:"var(--text4)",fontStyle:"italic",padding:"8px 0" }}>No notes yet.</div>}
            </Card>
          </div>
        )}
        {tab==="jobs" && (
          <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
            {loadingJobs?<Spinner />:jobs.length===0?<EmptyState icon="🔧" title="No jobs yet" desc="No jobs found for this customer" />:jobs.map(job=>(
              <Card key={job.id} style={{ padding:"14px 16px" }}>
                <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6 }}><div><div style={{ fontSize:11,fontFamily:"var(--mono)",color:"var(--text3)",marginBottom:3 }}>{job.job_number}</div><div style={{ fontSize:15,fontWeight:700 }}>{job.title}</div></div><Chip status={job.status} /></div>
                <div style={{ fontSize:12,color:"var(--text3)",marginBottom:10 }}>{job.scheduled_start?fmtDate(job.scheduled_start):"Not scheduled"}</div>
                <div style={{ display:"flex",gap:6,flexWrap:"wrap" }}>
                  <Btn small variant="secondary" onClick={()=>setDetailJob(job)}>📝 Notes & Photos</Btn>
                  <Btn small variant="secondary" onClick={()=>{ setCurrentJob({ customer:`${customer.first_name} ${customer.last_name}`, customerId:customer.id, phone:customer.phone||"", cell:"", email:customer.email||"", billingAddress:job.address_line1?`${job.address_line1}, ${job.city}, ${job.state} ${job.zip||""}`.trim():`${job.city||""}, ${job.state||""}`.trim(), complaint:job.title||"", workedBy:"", unitAddress:"" }); navigate("/workorder"); }}>📋 Work Order</Btn>
                </div>
              </Card>
            ))}
          </div>
        )}
        {tab==="workorders" && (
          <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
            {workOrders.length===0?<EmptyState icon="📋" title="No work orders yet" desc="Work orders created for this customer will appear here" />:workOrders.map(wo=>(
              <Card key={wo.id} style={{ padding:"14px 16px",cursor:"pointer" }} onClick={()=>setViewWO(wo)}>
                <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:4 }}>
                  <div><div style={{ fontSize:11,fontFamily:"var(--mono)",color:"var(--text3)",marginBottom:2 }}>WO# {wo.wo||"—"}</div><div style={{ fontSize:14,fontWeight:600 }}>{wo.complaint||"Work Order"}</div></div>
                  <div style={{ fontSize:16,fontFamily:"var(--mono)",fontWeight:700,color:"var(--green)" }}>{wo.totalAmount?`$${wo.totalAmount}`:"—"}</div>
                </div>
                <div style={{ fontSize:12,color:"var(--text3)" }}>{wo.date||"No date"} · {wo.technician||"No tech assigned"}</div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CustomersScreen() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [showNew, setShowNew] = useState(false);
  async function load() {
    setLoading(true);
    try { const d=await apiFetch(`/customers?limit=100${search?`&search=${encodeURIComponent(search)}`:""}`); setList(Array.isArray(d)?d:[]); } catch(e) { console.error(e); }
    setLoading(false);
  }
  useEffect(()=>{load();},[search]);
  async function handleDelete(id) {
    if (!window.confirm("Archive this customer?")) return;
    try { await apiFetch(`/customers/${id}`,{method:"DELETE"}); setList(p=>p.filter(c=>c.id!==id)); setSelected(null); } catch(e) { alert(e.message); }
  }
  if (selected) return <CustomerDetail customer={selected} onBack={()=>setSelected(null)} onDelete={handleDelete} />;
  return (
    <div style={{ flex:1,display:"flex",flexDirection:"column",overflow:"hidden" }}>
      {showNew&&<NewCustomerModal onClose={()=>setShowNew(false)} onSave={async c=>{setList(p=>[c,...p]);setSelected(c);setShowNew(false);}} />}
      <div style={{ padding:"12px 16px",borderBottom:"1px solid var(--border)",background:"var(--surface)",flexShrink:0 }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10 }}><span style={{ fontSize:16,fontFamily:"var(--display)",fontWeight:700 }}>Customers</span><Btn small onClick={()=>setShowNew(true)}>+ New</Btn></div>
        <div style={{ position:"relative" }}><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search name, phone…" style={{ ...inputStyle,paddingLeft:28 }} /><span style={{ position:"absolute",left:9,top:"50%",transform:"translateY(-50%)",color:"var(--text3)",fontSize:12 }}>⌕</span></div>
      </div>
      <div style={{ flex:1,overflowY:"auto" }}>
        {loading?<Spinner />:list.length===0?<EmptyState icon="👥" title="No customers yet" desc="Add your first customer" action={<Btn onClick={()=>setShowNew(true)}>+ New Customer</Btn>} />:list.map(c=><div key={c.id} onClick={()=>setSelected(c)} style={{ padding:"14px 16px",borderBottom:"1px solid var(--border)",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,transition:"background .1s" }} onMouseEnter={e=>e.currentTarget.style.background="var(--surface2)"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}><div><div style={{ fontSize:14,fontWeight:600,marginBottom:2 }}>{c.first_name} {c.last_name}</div><div style={{ fontSize:12,color:"var(--text3)" }}>{c.phone||c.email||"No contact"} · {c.job_count||0} job{c.job_count!==1?"s":""}</div></div><span style={{ color:"var(--text4)",fontSize:16 }}>›</span></div>)}
      </div>
    </div>
  );
}

function NewCustomerModal({ onClose, onSave }) {
  const [form, setForm] = useState({ first_name:"",last_name:"",email:"",phone:"",notes:"",source:"",location:{address_line1:"",city:"",state:"OK",zip:"",access_notes:""} });
  function set(k,v) { setForm(p=>({...p,[k]:v})); }
  function setLoc(k,v) { setForm(p=>({...p,location:{...p.location,[k]:v}})); }
  return (
    <Modal title="New Customer" onClose={onClose}>
      <div style={{ padding:"20px 24px",display:"flex",flexDirection:"column",gap:14 }}>
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12 }}><FormField label="First name *"><input style={inputStyle} value={form.first_name} onChange={e=>set("first_name",e.target.value)} placeholder="Sarah" /></FormField><FormField label="Last name *"><input style={inputStyle} value={form.last_name} onChange={e=>set("last_name",e.target.value)} placeholder="Johnson" /></FormField></div>
        <FormField label="Phone"><input style={inputStyle} value={form.phone} onChange={e=>set("phone",e.target.value)} placeholder="405-555-0177" /></FormField>
        <FormField label="Email"><input style={inputStyle} type="email" value={form.email} onChange={e=>set("email",e.target.value)} placeholder="sarah@email.com" /></FormField>
        <FormField label="How did they find you?"><select style={inputStyle} value={form.source} onChange={e=>set("source",e.target.value)}><option value="">Select source</option>{["Referral","Google","Yelp","Facebook","Door hanger","Repeat customer","Other"].map(s=><option key={s}>{s}</option>)}</select></FormField>
        <div style={{ borderTop:"1px solid var(--border)",paddingTop:14 }}><div style={{ fontSize:11,fontWeight:600,color:"var(--text3)",letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:10 }}>Service Location (optional)</div><div style={{ display:"flex",flexDirection:"column",gap:10 }}><input style={inputStyle} value={form.location.address_line1} onChange={e=>setLoc("address_line1",e.target.value)} placeholder="Street address" /><div style={{ display:"grid",gridTemplateColumns:"2fr 1fr 1fr",gap:10 }}><input style={inputStyle} value={form.location.city} onChange={e=>setLoc("city",e.target.value)} placeholder="City" /><input style={inputStyle} value={form.location.state} onChange={e=>setLoc("state",e.target.value)} placeholder="State" /><input style={inputStyle} value={form.location.zip} onChange={e=>setLoc("zip",e.target.value)} placeholder="Zip" /></div><input style={inputStyle} value={form.location.access_notes} onChange={e=>setLoc("access_notes",e.target.value)} placeholder="Access notes (gate code, dogs, etc.)" /></div></div>
        <FormField label="Notes"><textarea style={{ ...inputStyle,height:80,resize:"vertical" }} value={form.notes} onChange={e=>set("notes",e.target.value)} placeholder="Preferences, anything to remember…" /></FormField>
      </div>
      <div style={{ padding:"16px 24px",borderTop:"1px solid var(--border)",display:"flex",justifyContent:"flex-end",gap:10 }}><Btn variant="secondary" onClick={onClose}>Cancel</Btn><Btn onClick={()=>{ if(!form.first_name||!form.last_name){alert("First and last name required");return;} const loc=form.location.address_line1?form.location:undefined; onSave({...form,location:loc}); }}>Save Customer</Btn></div>
    </Modal>
  );
}

// ── JOBS ──
function JobsScreen() {
  const { navigate } = useRouter();
  const { setCurrentJob } = useJobContext();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [showNew, setShowNew] = useState(false);
  const [detailJob, setDetailJob] = useState(null);

  async function load() {
    setLoading(true);
    try { const data=await apiFetch(`/jobs?limit=100${filterStatus!=="all"?`&status=${filterStatus}`:""}`); setJobs(Array.isArray(data)?data:[]); } catch(e) { console.error(e); }
    setLoading(false);
  }
  useEffect(()=>{load();},[filterStatus]);

  async function handleStatusChange(jobId, newStatus) {
    try { await apiFetch(`/jobs/${jobId}/status`,{method:"PATCH",body:JSON.stringify({status:newStatus})}); setJobs(p=>p.map(j=>j.id===jobId?{...j,status:newStatus}:j)); } catch(e) { alert(e.message); }
  }

  function openWorkOrder(job) {
    setCurrentJob({
      customer: job.customer_name||"",
      customerId: job.customer_id||"",
      phone: job.customer_phone||"",
      cell: "",
      email: job.customer_email||"",
      billingAddress: job.address_line1 ? `${job.address_line1}, ${job.city}, ${job.state}`.trim() : `${job.city||""}, ${job.state||""}`.trim(),
      complaint: job.title||"",
      workedBy: "",
      unitAddress: job.address_line1 ? `${job.address_line1}, ${job.city}, ${job.state}`.trim() : "",
      jobId: job.id,
      jobNumber: job.job_number,
    });
    navigate("/workorder");
  }

  return (
    <div style={{ flex:1,display:"flex",flexDirection:"column",overflow:"hidden" }}>
      {showNew&&<NewJobModal onClose={()=>setShowNew(false)} onSave={async(job)=>{setJobs(p=>[job,...p]);setShowNew(false);}} />}
      {detailJob&&<JobDetailModal job={detailJob} onClose={()=>setDetailJob(null)} />}
      <div style={{ padding:"12px 20px",background:"var(--surface)",borderBottom:"1px solid var(--border)",display:"flex",gap:8,alignItems:"center" }}>
        <div style={{ display:"flex",gap:4 }}>{["all","scheduled","in_progress","en_route","completed"].map(s=><button key={s} onClick={()=>setFilterStatus(s)} style={{ fontSize:11,padding:"4px 10px",borderRadius:100,background:filterStatus===s?"var(--blue)":"var(--surface2)",color:filterStatus===s?"#fff":"var(--text3)",border:filterStatus===s?"none":"1px solid var(--border)",cursor:"pointer",textTransform:"capitalize",fontWeight:filterStatus===s?600:400 }}>{s==="all"?"All":STATUS_CFG[s]?.label||s}</button>)}</div>
        <div style={{ marginLeft:"auto" }}><Btn small onClick={()=>setShowNew(true)}>+ New Job</Btn></div>
      </div>
      <div style={{ flex:1,overflowY:"auto",padding:16 }}>
        {loading?<Spinner />:jobs.length===0?<EmptyState icon="🔧" title="No jobs yet" desc="Create your first job to get started" action={<Btn onClick={()=>setShowNew(true)}>+ New Job</Btn>} />:(
          <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
            {jobs.map(job=>(
              <Card key={job.id} style={{ padding:"14px 18px" }}>
                <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8 }}><div><div style={{ fontSize:11,fontFamily:"var(--mono)",color:"var(--text3)",marginBottom:3 }}>{job.job_number}</div><div style={{ fontSize:16,fontWeight:700,fontFamily:"var(--display)" }}>{job.title}</div></div><Chip status={job.status} /></div>
                <div style={{ display:"flex",gap:16,fontSize:13,color:"var(--text2)",flexWrap:"wrap",marginBottom:10 }}>
                  <span>👤 {job.customer_name}</span>
                  <span style={{ cursor:"pointer",color:"var(--blue)" }} onClick={e=>{e.stopPropagation();window.open(`https://maps.google.com/?q=${encodeURIComponent(job.address_line1?`${job.address_line1}, ${job.city}, ${job.state}`:`${job.city}, ${job.state}`)}`)}}>📍 {job.address_line1?`${job.address_line1}, ${job.city}, ${job.state}`:`${job.city}, ${job.state}`}</span>
                  {job.scheduled_start&&<span>🕐 {new Date(job.scheduled_start).toLocaleDateString("en-US",{month:"short",day:"numeric"})}</span>}
                </div>
                <div style={{ display:"flex",gap:6,flexWrap:"wrap" }}>
                  {job.status==="scheduled"&&<Btn small variant="secondary" onClick={()=>handleStatusChange(job.id,"en_route")}>→ En Route</Btn>}
                  {job.status==="en_route"&&<Btn small variant="secondary" onClick={()=>handleStatusChange(job.id,"in_progress")}>→ Start Job</Btn>}
                  {job.status==="in_progress"&&<Btn small onClick={()=>handleStatusChange(job.id,"completed")}>✓ Complete</Btn>}
                  <Btn small variant="secondary" onClick={()=>setDetailJob(job)}>📝 Notes & Photos</Btn>
                  <Btn small variant="secondary" onClick={()=>openWorkOrder(job)}>📋 Work Order</Btn>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function NewJobModal({ onClose, onSave }) {
  const [customers, setCustomers] = useState([]);
  const [form, setForm] = useState({ customer_id:"",location_id:"",title:"",description:"",priority:"normal",scheduled_start:"",scheduled_end:"" });
  const [locations, setLocations] = useState([]);
  useEffect(()=>{apiFetch("/customers?limit=100").then(d=>setCustomers(Array.isArray(d)?d:[])).catch(()=>{});},[]);
  async function handleCustomerChange(id) {
    setForm(p=>({...p,customer_id:id,location_id:""}));
    if(id){try{const cust=await apiFetch(`/customers/${id}`);setLocations(cust.locations||[]);if(cust.locations?.length===1)setForm(p=>({...p,location_id:cust.locations[0].id}));}catch(e){}}
  }
  async function handleSave() {
    if(!form.customer_id||!form.location_id||!form.title){alert("Customer, location and title required");return;}
    try {
      const payload={customer_id:form.customer_id,location_id:form.location_id,title:form.title,description:form.description||"",priority:form.priority||"normal",technician_ids:[]};
      if(form.scheduled_start)payload.scheduled_start=new Date(form.scheduled_start).toISOString();
      if(form.scheduled_end)payload.scheduled_end=new Date(form.scheduled_end).toISOString();
      const job=await apiFetch("/jobs",{method:"POST",body:JSON.stringify(payload)});
      onSave(job);
    }catch(e){alert(e.message);}
  }
  return (
    <Modal title="New Job" onClose={onClose}>
      <div style={{ padding:"20px 24px",display:"flex",flexDirection:"column",gap:14 }}>
        <FormField label="Customer *"><select style={inputStyle} value={form.customer_id} onChange={e=>handleCustomerChange(e.target.value)}><option value="">Select customer…</option>{customers.map(c=><option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>)}</select></FormField>
        {locations.length>0&&<FormField label="Location *"><select style={inputStyle} value={form.location_id} onChange={e=>setForm(p=>({...p,location_id:e.target.value}))}><option value="">Select location…</option>{locations.map(l=><option key={l.id} value={l.id}>{l.address_line1}, {l.city}</option>)}</select></FormField>}
        <FormField label="Job Title *"><input style={inputStyle} value={form.title} onChange={e=>setForm(p=>({...p,title:e.target.value}))} placeholder="e.g. AC Not Cooling" /></FormField>
        <FormField label="Description"><textarea style={{...inputStyle,height:80,resize:"vertical"}} value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))} placeholder="Describe the issue…" /></FormField>
        <FormField label="Priority"><select style={inputStyle} value={form.priority} onChange={e=>setForm(p=>({...p,priority:e.target.value}))}>{["low","normal","high","urgent"].map(p=><option key={p} value={p}>{p.charAt(0).toUpperCase()+p.slice(1)}</option>)}</select></FormField>
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12 }}><FormField label="Start Time"><input style={inputStyle} type="datetime-local" value={form.scheduled_start} onChange={e=>setForm(p=>({...p,scheduled_start:e.target.value}))} /></FormField><FormField label="End Time"><input style={inputStyle} type="datetime-local" value={form.scheduled_end} onChange={e=>setForm(p=>({...p,scheduled_end:e.target.value}))} /></FormField></div>
      </div>
      <div style={{ padding:"16px 24px",borderTop:"1px solid var(--border)",display:"flex",justifyContent:"flex-end",gap:10 }}><Btn variant="secondary" onClick={onClose}>Cancel</Btn><Btn onClick={handleSave}>Create Job</Btn></div>
    </Modal>
  );
}

// ── DISPATCH ──
function DispatchScreen() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(new Date().toISOString().slice(0,10));
  const [techs, setTechs] = useState([]);
  const [assigning, setAssigning] = useState({});
  const [view, setView] = useState("list"); // "list" | "calendar"
  const [weekJobs, setWeekJobs] = useState([]);
  const [weekLoading, setWeekLoading] = useState(false);

  useEffect(()=>{apiFetch("/users?limit=100").then(d=>setTechs(Array.isArray(d)?d:[])).catch(()=>{});},[]);

  useEffect(()=>{
    setLoading(true);
    apiFetch(`/dispatch?date=${date}`).then(d=>setData(d)).catch(()=>setData({technicians:[],unassigned:[]})).finally(()=>setLoading(false));
  },[date]);

  // Load full week of jobs for calendar view
  useEffect(()=>{
    if(view!=="calendar") return;
    setWeekLoading(true);
    const mon = getWeekStart(date);
    const days = Array.from({length:7},(_,i)=>{ const d=new Date(mon); d.setDate(d.getDate()+i); return d.toISOString().slice(0,10); });
    Promise.all(days.map(d=>apiFetch(`/dispatch?date=${d}`).catch(()=>({technicians:[],unassigned:[]}))))
      .then(results=>{
        const all = [];
        results.forEach((r,i)=>{
          const d = days[i];
          (r.technicians||[]).forEach(tech=>(tech.jobs||[]).forEach(job=>all.push({...job,_date:d,_tech:tech.name})));
          (r.unassigned||[]).forEach(job=>all.push({...job,_date:d,_tech:null}));
        });
        setWeekJobs(all);
      }).finally(()=>setWeekLoading(false));
  },[view, date]);

  function getWeekStart(dateStr) {
    const d = new Date(dateStr);
    const day = d.getDay();
    const diff = d.getDate() - day + (day===0?-6:1); // Monday
    return new Date(d.setDate(diff));
  }

  function getWeekDays() {
    const mon = getWeekStart(date);
    return Array.from({length:7},(_,i)=>{
      const d = new Date(mon);
      d.setDate(d.getDate()+i);
      return { date: d.toISOString().slice(0,10), label: d.toLocaleDateString("en-US",{weekday:"short"}), day: d.getDate(), isToday: d.toISOString().slice(0,10)===new Date().toISOString().slice(0,10) };
    });
  }

  function prevWeek() {
    const d = new Date(date); d.setDate(d.getDate()-7); setDate(d.toISOString().slice(0,10));
  }
  function nextWeek() {
    const d = new Date(date); d.setDate(d.getDate()+7); setDate(d.toISOString().slice(0,10));
  }

  async function assignTech(jobId, techId) {
    if(!techId)return;
    setAssigning(p=>({...p,[jobId]:true}));
    try{await apiFetch(`/jobs/${jobId}`,{method:"PATCH",body:JSON.stringify({technician_ids:[techId]})});const d=await apiFetch(`/dispatch?date=${date}`);setData(d);}catch(e){alert(e.message);}
    setAssigning(p=>({...p,[jobId]:false}));
  }

  const dispatchTechs=data?.technicians||[];
  const unassigned=data?.unassigned||[];
  const weekDays = getWeekDays();

  const STATUS_COLORS = {
    scheduled:"#2563EB", in_progress:"#D97706", en_route:"#7C3AED",
    completed:"#0D7B4E", cancelled:"#6B7280", on_hold:"#DC2626",
  };

  return (
    <div style={{ flex:1,display:"flex",flexDirection:"column",overflow:"hidden" }}>
      {/* Header */}
      <div style={{ padding:"12px 20px",background:"var(--surface)",borderBottom:"1px solid var(--border)",display:"flex",gap:12,alignItems:"center",flexWrap:"wrap" }}>
        {view==="calendar" ? (
          <div style={{ display:"flex",alignItems:"center",gap:8 }}>
            <button onClick={prevWeek} style={{ background:"var(--surface2)",border:"1px solid var(--border)",borderRadius:6,padding:"5px 10px",cursor:"pointer",fontSize:14 }}>‹</button>
            <span style={{ fontSize:13,fontWeight:600,minWidth:160,textAlign:"center" }}>
              {weekDays[0] && new Date(weekDays[0].date+"T12:00:00").toLocaleDateString("en-US",{month:"short",day:"numeric"})} — {weekDays[6] && new Date(weekDays[6].date+"T12:00:00").toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}
            </span>
            <button onClick={nextWeek} style={{ background:"var(--surface2)",border:"1px solid var(--border)",borderRadius:6,padding:"5px 10px",cursor:"pointer",fontSize:14 }}>›</button>
            <button onClick={()=>setDate(new Date().toISOString().slice(0,10))} style={{ background:"none",border:"1px solid var(--border)",borderRadius:6,padding:"5px 10px",cursor:"pointer",fontSize:12,color:"var(--blue)" }}>Today</button>
          </div>
        ) : (
          <>
            <input type="date" value={date} onChange={e=>setDate(e.target.value)} style={{ ...inputStyle,width:"auto",padding:"6px 10px" }} />
            {!loading && <span style={{ fontSize:13,color:"var(--text3)" }}>{dispatchTechs.length} tech{dispatchTechs.length!==1?"s":""} · {unassigned.length} unassigned</span>}
          </>
        )}
        <div style={{ marginLeft:"auto",display:"flex",gap:4 }}>
          {["list","calendar"].map(v=>(
            <button key={v} onClick={()=>setView(v)} style={{ padding:"6px 14px",borderRadius:7,border:"1px solid var(--border)",background:view===v?"var(--blue)":"var(--surface2)",color:view===v?"#fff":"var(--text3)",fontSize:12,fontWeight:view===v?600:400,cursor:"pointer" }}>
              {v==="list"?"📋 List":"📅 Calendar"}
            </button>
          ))}
        </div>
      </div>

      {/* CALENDAR VIEW */}
      {view==="calendar" && (
        <div style={{ flex:1,overflowY:"auto",padding:16 }}>
          {weekLoading ? <Spinner /> : (
            <div style={{ display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:8,minWidth:700 }}>
              {/* Day headers */}
              {weekDays.map(day=>(
                <div key={day.date} onClick={()=>{setDate(day.date);setView("list");}}
                  style={{ padding:"8px 10px",borderRadius:8,background:day.isToday?"var(--blue)":"var(--surface)",border:`1px solid ${day.isToday?"var(--blue)":"var(--border)"}`,cursor:"pointer",textAlign:"center",marginBottom:4 }}>
                  <div style={{ fontSize:11,fontWeight:600,color:day.isToday?"#fff":"var(--text3)",textTransform:"uppercase",letterSpacing:"0.06em" }}>{day.label}</div>
                  <div style={{ fontSize:20,fontWeight:700,color:day.isToday?"#fff":"var(--text1)",fontFamily:"var(--display)" }}>{day.day}</div>
                </div>
              ))}
              {/* Job cards per day */}
              {weekDays.map(day=>{
                const dayJobs = weekJobs.filter(j=>j._date===day.date);
                return (
                  <div key={day.date} style={{ display:"flex",flexDirection:"column",gap:6,minHeight:120 }}>
                    {dayJobs.length===0 ? (
                      <div style={{ fontSize:11,color:"var(--text4)",textAlign:"center",padding:"12px 0",fontStyle:"italic" }}>—</div>
                    ) : dayJobs.map(job=>{
                      const color = STATUS_COLORS[job.status]||"#6B7280";
                      return (
                        <div key={job.id+day.date} style={{ background:"var(--surface)",border:`1px solid var(--border)`,borderLeft:`3px solid ${color}`,borderRadius:6,padding:"7px 9px",fontSize:11 }}>
                          <div style={{ fontWeight:700,marginBottom:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{job.title}</div>
                          <div style={{ color:"var(--text3)",marginBottom:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{job.customer_name}</div>
                          {job._tech ? <div style={{ color:color,fontWeight:600 }}>👷 {job._tech}</div> : <div style={{ color:"var(--red)",fontWeight:600 }}>⚠ Unassigned</div>}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* LIST VIEW */}
      {view==="list" && (
        <div style={{ flex:1,overflowY:"auto",padding:16,display:"flex",flexDirection:"column",gap:10 }}>
          {loading ? <Spinner /> : (
            <>
              {dispatchTechs.length===0&&unassigned.length===0&&<EmptyState icon="📡" title="No jobs scheduled" desc={`No jobs found for ${fmtDate(date)}`} />}
              {unassigned.length>0&&(
                <Card style={{ border:"1px solid var(--red-bd)",overflow:"hidden" }}>
                  <div style={{ padding:"10px 16px",background:"var(--red-lt)",borderBottom:"1px solid var(--red-bd)",fontSize:13,fontWeight:600,color:"var(--red)" }}>● Unassigned ({unassigned.length})</div>
                  <div style={{ display:"flex",flexDirection:"column",gap:8,padding:10 }}>
                    {unassigned.map(job=>(
                      <div key={job.id} style={{ background:"var(--surface2)",border:"1px solid var(--border)",borderLeft:"3px solid var(--red)",borderRadius:8,padding:"10px 12px" }}>
                        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12,flexWrap:"wrap" }}>
                          <div><div style={{ fontSize:11,fontFamily:"var(--mono)",color:"var(--text3)",marginBottom:3 }}>{job.job_number}</div><div style={{ fontSize:13,fontWeight:600,marginBottom:3 }}>{job.title}</div><div style={{ fontSize:11,color:"var(--text3)" }}>{job.customer_name}</div></div>
                          <div style={{ display:"flex",alignItems:"center",gap:8,flexShrink:0 }}>
                            <select defaultValue="" disabled={assigning[job.id]} onChange={e=>assignTech(job.id,e.target.value)} style={{ ...inputStyle,width:"auto",padding:"5px 10px",fontSize:12,cursor:"pointer" }}>
                              <option value="" disabled>Assign to…</option>
                              {techs.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                            {assigning[job.id]&&<span style={{ fontSize:11,color:"var(--text3)" }}>Saving…</span>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
              {dispatchTechs.map(tech=>(
                <Card key={tech.id} style={{ overflow:"hidden" }}>
                  <div style={{ padding:"10px 16px",background:"var(--surface2)",borderBottom:tech.jobs?.length?"1px solid var(--border)":"none",display:"flex",alignItems:"center",gap:10 }}>
                    <div style={{ width:32,height:32,borderRadius:"50%",background:"var(--blue-lt)",border:"1px solid var(--blue-bd)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:"var(--blue)",flexShrink:0 }}>{tech.name?.split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase()}</div>
                    <span style={{ fontSize:13,fontWeight:600 }}>{tech.name}</span>
                    <span style={{ fontSize:11,color:"var(--text3)",marginLeft:4 }}>{tech.jobs?.length||0} job{tech.jobs?.length!==1?"s":""}</span>
                  </div>
                  {tech.jobs?.length>0 ? (
                    <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:8,padding:10 }}>
                      {tech.jobs.map(job=>{
                        const sc=STATUS_CFG[job.status]||STATUS_CFG.scheduled;
                        return <div key={job.id} style={{ background:"var(--surface2)",border:`1px solid ${sc.bd}`,borderLeft:`3px solid ${sc.color}`,borderRadius:8,padding:"10px 12px" }}><div style={{ display:"flex",justifyContent:"space-between",marginBottom:5 }}><span style={{ fontSize:11,fontFamily:"var(--mono)",color:"var(--text3)" }}>{job.job_number}</span><Chip status={job.status} /></div><div style={{ fontSize:13,fontWeight:600,marginBottom:3 }}>{job.title}</div><div style={{ fontSize:11,color:"var(--text3)" }}>{job.customer_name}</div></div>;
                      })}
                    </div>
                  ) : <div style={{ padding:"12px 18px",fontSize:12,color:"var(--text4)",fontStyle:"italic" }}>No jobs scheduled</div>}
                </Card>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ── INVOICES ──

function printWorkOrder(wo) {
  const logo = "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";
  const materials = (wo.materials || []).filter(m => m.description);
  const checklist = wo.checklist || [];
  const jobTypes = wo.jobTypes || [];
  const serviceType = wo.serviceType || [];

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Work Order ${wo.wo || ""}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; font-size: 10px; color: #111; background: #fff; }
    .page { max-width: 900px; margin: 0 auto; padding: 8px; border: 2px solid #1a3a6b; }
    .header { display: flex; align-items: center; border-bottom: 2px solid #1a3a6b; padding-bottom: 6px; margin-bottom: 6px; }
    .header img { height: 55px; width: auto; margin-right: 12px; }
    .header-info { flex: 1; text-align: center; }
    .header-info h1 { font-size: 18px; color: #1a3a6b; font-weight: 900; }
    .header-info p { font-size: 11px; color: #444; }
    .wo-num { text-align: right; }
    .wo-num .label { font-size: 9px; color: #666; }
    .wo-num .num { font-size: 20px; font-weight: 900; color: #1a3a6b; border: 2px solid #1a3a6b; padding: 3px 8px; }
    .section { margin-top: 6px; }
    .section-title { background: #1a3a6b; color: #fff; font-size: 9px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; padding: 4px 8px; margin-bottom: 6px; }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 8px; }
    .field { border-bottom: 1px solid #1a3a6b; padding-bottom: 2px; margin-bottom: 6px; }
    .field .label { font-size: 8px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #555; }
    .field .value { font-size: 12px; min-height: 16px; }
    .checkbox-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2px; border: 1px solid #ccc; padding: 5px; margin-bottom: 6px; }
    .checkbox-item { display: flex; align-items: center; gap: 6px; font-size: 10px; font-weight: 600; }
    .checkbox-item .box { width: 12px; height: 12px; border: 1px solid #333; display: flex; align-items: center; justify-content: center; font-size: 9px; flex-shrink: 0; }
    .checkbox-item .box.checked { background: #1a3a6b; color: #fff; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; }
    th { background: #1a3a6b; color: #fff; font-size: 9px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; padding: 5px 6px; text-align: left; }
    td { padding: 5px 6px; border-bottom: 1px solid #ddd; }
    .total-box { display: flex; justify-content: flex-end; margin-top: 8px; }
    .total-inner { border: 2px solid #1a3a6b; padding: 10px 20px; text-align: right; }
    .total-inner .label { font-size: 9px; color: #666; text-transform: uppercase; letter-spacing: 0.08em; }
    .total-inner .amount { font-size: 24px; font-weight: 900; color: #1a3a6b; }
    .sig-img { max-width: 100%; height: 60px; object-fit: contain; border: 1px solid #ccc; }
    .checklist-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1px; }
    .bottom-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin-top: 6px; }
    .bottom-card { border: 1px solid #ccc; padding: 6px; font-size: 8.5px; line-height: 1.4; }
    .bottom-card .title { font-weight: 700; font-size: 10px; margin-bottom: 4px; }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      @page { margin: 0.4cm; size: A4 portrait; }
    }
    html, body { height: auto !important; }
    .page { transform-origin: top left; }
  </style>
</head>
<body>
<div class="page">
  <div class="header">
    <img src="data:image/png;base64,${logo}" alt="405 Heating & Air" />
    <div class="header-info">
      <h1>405 Heating and Air Conditioning</h1>
      <p>426 West Boomer Street · Lexington, Oklahoma 73051</p>
      <p>405-215-7685</p>
      <p style="color:#888;font-size:10px">Service, Maintenance, Installation</p>
    </div>
    <div class="wo-num">
      <div class="label">WO #</div>
      <div class="num">${wo.wo || "—"}</div>
    </div>
  </div>

  <div class="checkbox-grid">
    ${["PM INSPECTION","AFTER HOURS EMERGENCY SERVICE","CONSTRUCTION","FOLLOW UP","SERVICE CALL","START UP","SHUT DOWN","MISCELLANEOUS"].map(t =>
      `<div class="checkbox-item"><div class="box ${jobTypes.includes(t)?"checked":""}">${jobTypes.includes(t)?"✓":""}</div><span>${t}</span></div>`
    ).join("")}
  </div>

  <div class="grid-2">
    <div><div class="field"><div class="label">Customer</div><div class="value">${wo.customer||""}</div></div></div>
    <div><div class="field"><div class="label">Date</div><div class="value">${wo.date||""}</div></div></div>
    <div style="grid-column:1/-1"><div class="field"><div class="label">Billing Address</div><div class="value">${wo.billingAddress||""}</div></div></div>
    <div><div class="field"><div class="label">Phone</div><div class="value">${wo.phone||""}</div></div></div>
    <div><div class="field"><div class="label">Cell</div><div class="value">${wo.cell||""}</div></div></div>
    <div style="grid-column:1/-1"><div class="field"><div class="label">Email</div><div class="value">${wo.email||""}</div></div></div>
    <div style="grid-column:1/-1"><div class="field"><div class="label">Complaint</div><div class="value">${wo.complaint||""}</div></div></div>
    <div><div class="field"><div class="label">Work Ordered By</div><div class="value">${wo.workedBy||""}</div></div></div>
    <div><div class="field"><div class="label">Address of Unit</div><div class="value">${wo.unitAddress||""}</div></div></div>
    <div><div class="field"><div class="label">Unit Phone</div><div class="value">${wo.unitPhone||""}</div></div></div>
    <div><div class="field"><div class="label">Unit Cell</div><div class="value">${wo.unitCell||""}</div></div></div>
  </div>

  <div class="section">
    <table>
      <thead><tr><th>Make</th><th>Model No.</th><th>Serial No.</th><th>Location of Unit</th><th>Area Served</th></tr></thead>
      <tbody>${(wo.equipment||[]).map(e => `<tr><td>${e.make||""}</td><td>${e.model||""}</td><td>${e.serial||""}</td><td>${e.location||""}</td><td>${e.area||""}</td></tr>`).join("") || "<tr><td colspan='5'>&nbsp;</td></tr>"}</tbody>
    </table>
  </div>

  <div class="section">
    <table>
      <thead><tr><th colspan="8" style="background:#333">LABOR</th></tr><tr><th style="background:#555">Technician</th><th style="background:#555">Time In</th><th style="background:#555">Time Out</th><th style="background:#555">Travel</th><th style="background:#555">Reg/Hrs</th><th style="background:#555">OT/Hrs</th><th style="background:#555">Rate</th><th style="background:#555">Amount</th></tr></thead>
      <tbody><tr><td>${wo.technician||""}</td><td>${wo.timeIn||""}</td><td>${wo.timeOut||""}</td><td>${wo.travelTime||""}</td><td>${wo.regHrs||""}</td><td>${wo.otHrs||""}</td><td>${wo.rate||""}</td><td>${wo.amount||""}</td></tr></tbody>
    </table>
  </div>

  <div class="section">
    <div class="section-title">Service Checklist</div>
    <div class="checklist-grid">
      ${["CLEAN CONDENSER","CHECK RELAY","CHECK HI-LO CONTROL","PUNCH CONDENSER TUBES","PRESSURE WASH COIL","CHECK REF. CHARGE","CLEAN EVAP. COIL","BACKFLUSH CONDENSER","CHECK BELT & PULLEY","CHECK ELECTRICAL","CHECK FAN MOTOR","CHECK & CLEAN STRAINER","CHECK COND. FAN MOTOR","CLEAN DRAIN PAN","REPLACE FILTERS","LUBRICATE BEARINGS","CLEAN MAIN DRAIN","ADJUST SET POINT","CHECK CONTACTOR","CHECK CONDENSATE PUMP","CHEMICALLY CLEAN COND."].map(item =>
        `<div class="checkbox-item"><div class="box ${checklist.includes(item)?"checked":""}">${checklist.includes(item)?"✓":""}</div><span style="font-size:9px">${item}</span></div>`
      ).join("")}
    </div>
  </div>

  ${wo.descriptionOfWork ? `<div class="section"><div class="section-title">Description of Work</div><div style="padding:4px 6px;border:1px solid #ccc;min-height:40px;font-size:10px;line-height:1.5;white-space:pre-wrap">${wo.descriptionOfWork}</div></div>` : ""}
  ${wo.recommendations ? `<div class="section"><div class="section-title">Recommendations</div><div style="padding:6px 8px;border:1px solid #ccc;min-height:40px;font-size:11px;line-height:1.6;white-space:pre-wrap">${wo.recommendations}</div></div>` : ""}

  ${materials.length > 0 ? `
  <div class="section">
    <table>
      <thead><tr><th colspan="8">MATERIALS</th></tr><tr><th style="background:#555">Qty</th><th style="background:#555">Description</th><th style="background:#555">Unit Price</th><th style="background:#555">Amount</th><th style="background:#555">Qty</th><th style="background:#555">Description</th><th style="background:#555">Unit Price</th><th style="background:#555">Amount</th></tr></thead>
      <tbody>${[0,2,4,6].map(i => `<tr><td>${materials[i]?.qty||""}</td><td>${materials[i]?.description||""}</td><td>${materials[i]?.unitPrice?"$"+materials[i].unitPrice:""}</td><td>${materials[i]?.amount?"$"+materials[i].amount:""}</td><td>${materials[i+1]?.qty||""}</td><td>${materials[i+1]?.description||""}</td><td>${materials[i+1]?.unitPrice?"$"+materials[i+1].unitPrice:""}</td><td>${materials[i+1]?.amount?"$"+materials[i+1].amount:""}</td></tr>`).join("")}</tbody>
    </table>
  </div>` : ""}

  <div class="bottom-grid">
    <div class="bottom-card">
      <div class="title">Acknowledgment of Work Performed</div>
      I have authority to order the work outlined above which has been satisfactorily completed. I agree that Seller retains title to equipment/materials furnished until final payment is made.
      <div style="margin-top:8px"><div class="field"><div class="label">Print Name</div><div class="value">${wo.printName||""}</div></div></div>
      ${wo.signature ? `<div style="margin-top:6px"><div class="label" style="font-size:8px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#555">Signature</div><img class="sig-img" src="${wo.signature}" /></div>` : '<div class="field" style="margin-top:6px"><div class="label">Signature</div><div class="value" style="min-height:40px"></div></div>'}
      <div class="field" style="margin-top:6px"><div class="label">Date</div><div class="value">${wo.signDate||""}</div></div>
    </div>
    <div class="bottom-card">
      <div class="title">Limited Warranty</div>
      All materials, parts and equipment are warranted by the manufactures' or suppliers' written warranty only. All labor performed is warranted for 30 days or as otherwise indicated in writing.
      <div style="margin-top:10px">${["REGULAR","WARRANTY","SERVICE CONTRACT"].map(t => `<div class="checkbox-item" style="margin-bottom:6px"><div class="box ${serviceType.includes(t)?"checked":""}">${serviceType.includes(t)?"✓":""}</div><span>${t}</span></div>`).join("")}</div>
    </div>
    <div class="bottom-card" style="text-align:center;display:flex;flex-direction:column;justify-content:center;align-items:center">
      <div class="title">TOTAL DUE</div>
      <div style="font-size:28px;font-weight:900;color:#1a3a6b;margin-top:8px">${wo.totalAmount?"$"+wo.totalAmount:"—"}</div>
    </div>
  </div>
</div>
<script>window.onload = function() { window.print(); }</script>
</body>
</html>`;

  const win = window.open("", "_blank");
  win.document.write(html);
  win.document.close();
}

function InvoicesScreen() {
  const [list, setList] = useState([]);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchWorkOrders().then(setList);
  }, []);

  async function deleteWO(id) {
    if (!window.confirm("Delete this work order?")) return;
    await deleteWorkOrder(id);
    setList(p => p.filter(w => w.id !== id));
    setSelected(null);
  }

  const filtered = list.filter(w =>
    !search ||
    (w.customer||"").toLowerCase().includes(search.toLowerCase()) ||
    (w.wo||"").includes(search) ||
    (w.complaint||"").toLowerCase().includes(search.toLowerCase())
  );

  if (selected) {
    return (
      <div style={{ flex:1,display:"flex",flexDirection:"column",overflow:"hidden",background:"var(--surface)" }}>
        <div style={{ padding:"12px 16px",borderBottom:"1px solid var(--border)",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0 }}>
          <button onClick={()=>setSelected(null)} style={{ background:"none",border:"none",color:"var(--blue)",fontSize:14,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:4,padding:0 }}>← Work Orders</button>
          <div style={{ display:"flex",gap:8 }}>
            <Btn small variant="secondary" onClick={()=>printWorkOrder(selected)}>🖨️ Print</Btn>
            {selected.email&&<Btn small variant="secondary" onClick={()=>{const sub=encodeURIComponent(`Work Order ${selected.wo||""} - 405 Heating & Air`);const bod=encodeURIComponent(`Hello ${selected.customer||""},\n\nWork Order #: ${selected.wo||"—"}\nDate: ${selected.date||"—"}\nTechnician: ${selected.technician||"—"}\nComplaint: ${selected.complaint||"—"}\nDescription: ${selected.descriptionOfWork||"—"}\nTotal Due: ${selected.totalAmount?"$"+selected.totalAmount:"—"}\n\nThank you for choosing 405 Heating & Air Conditioning.\n405-215-7685\n426 W Boomer St, Lexington, OK 73051`);window.open(`mailto:${selected.email}?subject=${sub}&body=${bod}`);}}>✉️ Email</Btn>}
            <Btn small variant="danger" onClick={()=>deleteWO(selected.id)}>Delete</Btn>
          </div>
        </div>
        <div style={{ flex:1,overflowY:"auto",padding:20 }}>
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20 }}>
            <div>
              <div style={{ fontSize:12,fontFamily:"var(--mono)",color:"var(--text3)",marginBottom:4 }}>WO# {selected.wo||"—"}</div>
              <div style={{ fontSize:22,fontFamily:"var(--display)",fontWeight:800,marginBottom:4 }}>{selected.customer||"—"}</div>
              <div style={{ fontSize:13,color:"var(--text3)" }}>{selected.date||"No date"}</div>
            </div>
            <div style={{ textAlign:"right" }}>
              <div style={{ fontSize:10,color:"var(--text3)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:4 }}>Total Due</div>
              <div style={{ fontSize:32,fontFamily:"var(--mono)",fontWeight:700,color:"var(--blue)" }}>{selected.totalAmount?`$${selected.totalAmount}`:"—"}</div>
            </div>
          </div>

          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16 }}>
            {[["Phone",selected.phone],["Cell",selected.cell],["Email",selected.email],["Address",selected.billingAddress],["Complaint",selected.complaint],["Technician",selected.technician],["Time In",selected.timeIn],["Time Out",selected.timeOut]].filter(([,v])=>v).map(([l,v])=>(
              <div key={l} style={{ background:"var(--surface2)",borderRadius:8,padding:"10px 12px" }}>
                <div style={{ fontSize:10,fontWeight:700,color:"var(--text3)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:3 }}>{l}</div>
                <div style={{ fontSize:13 }}>{v}</div>
              </div>
            ))}
          </div>

          {selected.checklist?.length > 0 && (
            <Card style={{ padding:"14px 16px",marginBottom:12 }}>
              <div style={{ fontSize:10,fontWeight:700,color:"var(--text3)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:10 }}>Service Checklist</div>
              <div style={{ display:"flex",flexWrap:"wrap",gap:6 }}>
                {selected.checklist.map(item=><span key={item} style={{ background:"var(--green-lt)",color:"var(--green)",border:"1px solid var(--green-bd)",fontSize:11,fontWeight:600,padding:"3px 10px",borderRadius:100 }}>✓ {item}</span>)}
              </div>
            </Card>
          )}

          {selected.descriptionOfWork && (
            <Card style={{ padding:"14px 16px",marginBottom:12 }}>
              <div style={{ fontSize:10,fontWeight:700,color:"var(--text3)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:8 }}>Description of Work</div>
              <div style={{ fontSize:13,lineHeight:1.7,whiteSpace:"pre-wrap" }}>{selected.descriptionOfWork}</div>
            </Card>
          )}

          {selected.recommendations && (
            <Card style={{ padding:"14px 16px",marginBottom:12 }}>
              <div style={{ fontSize:10,fontWeight:700,color:"var(--text3)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:8 }}>Recommendations</div>
              <div style={{ fontSize:13,lineHeight:1.7,whiteSpace:"pre-wrap" }}>{selected.recommendations}</div>
            </Card>
          )}

          {selected.materials?.some(m=>m.description) && (
            <Card style={{ padding:"14px 16px",marginBottom:12 }}>
              <div style={{ fontSize:10,fontWeight:700,color:"var(--text3)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:10 }}>Materials</div>
              <table style={{ width:"100%",borderCollapse:"collapse",fontSize:13 }}>
                <thead><tr style={{ background:"var(--surface2)" }}>{["Qty","Description","Unit Price","Amount"].map(h=><th key={h} style={{ padding:"6px 10px",textAlign:"left",fontSize:11,fontWeight:600,color:"var(--text3)",borderBottom:"1px solid var(--border)" }}>{h}</th>)}</tr></thead>
                <tbody>{selected.materials.filter(m=>m.description).map((m,i)=><tr key={i} style={{ borderBottom:"1px solid var(--border)" }}><td style={{ padding:"8px 10px" }}>{m.qty||"1"}</td><td style={{ padding:"8px 10px" }}>{m.description}</td><td style={{ padding:"8px 10px" }}>{m.unitPrice?`$${m.unitPrice}`:""}</td><td style={{ padding:"8px 10px",fontWeight:600,color:"var(--green)" }}>{m.amount?`$${m.amount}`:""}</td></tr>)}</tbody>
              </table>
              <div style={{ display:"flex",justifyContent:"flex-end",marginTop:12 }}>
                <div style={{ background:"var(--blue-lt)",border:"1px solid var(--blue-bd)",borderRadius:8,padding:"10px 20px",textAlign:"right" }}>
                  <div style={{ fontSize:11,color:"var(--text3)",marginBottom:2 }}>TOTAL DUE</div>
                  <div style={{ fontSize:22,fontFamily:"var(--mono)",fontWeight:700,color:"var(--blue)" }}>{selected.totalAmount?`$${selected.totalAmount}`:"—"}</div>
                </div>
              </div>
            </Card>
          )}

          {selected.printName && (
            <Card style={{ padding:"14px 16px" }}>
              <div style={{ fontSize:10,fontWeight:700,color:"var(--text3)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:8 }}>Signature</div>
              <div style={{ fontSize:13 }}>{selected.printName} · {selected.signDate||""}</div>
            </Card>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ flex:1,display:"flex",flexDirection:"column",overflow:"hidden" }}>
      <div style={{ padding:"12px 16px",borderBottom:"1px solid var(--border)",background:"var(--surface)",flexShrink:0 }}>
        <div style={{ fontSize:16,fontFamily:"var(--display)",fontWeight:700,marginBottom:10 }}>Work Orders</div>
        <div style={{ position:"relative" }}>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search customer, WO#, complaint…" style={{ ...inputStyle,paddingLeft:28 }} />
          <span style={{ position:"absolute",left:9,top:"50%",transform:"translateY(-50%)",color:"var(--text3)",fontSize:12 }}>⌕</span>
        </div>
      </div>
      <div style={{ flex:1,overflowY:"auto" }}>
        {filtered.length===0
          ? <EmptyState icon="📋" title="No work orders yet" desc="Submit a work order from the Jobs tab to see it here" />
          : filtered.map(wo=>(
            <div key={wo.id} onClick={()=>setSelected(wo)} style={{ padding:"14px 16px",borderBottom:"1px solid var(--border)",cursor:"pointer",transition:"background .1s" }} onMouseEnter={e=>e.currentTarget.style.background="var(--surface2)"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:4 }}>
                <div>
                  <div style={{ fontSize:11,fontFamily:"var(--mono)",color:"var(--text3)",marginBottom:2 }}>WO# {wo.wo||"—"}</div>
                  <div style={{ fontSize:14,fontWeight:600 }}>{wo.customer||"Unknown Customer"}</div>
                  <div style={{ fontSize:12,color:"var(--text3)",marginTop:2 }}>{wo.complaint||"No description"}</div>
                </div>
                <div style={{ textAlign:"right",flexShrink:0 }}>
                  <div style={{ fontSize:16,fontFamily:"var(--mono)",fontWeight:700,color:"var(--green)" }}>{wo.totalAmount?`$${wo.totalAmount}`:"—"}</div>
                  <div style={{ fontSize:11,color:"var(--text3)",marginTop:2 }}>{wo.date||"No date"}</div>
                </div>
              </div>
            </div>
          ))
        }
      </div>
    </div>
  );
}

// ── JOB DETAIL MODAL ──
function JobDetailModal({ job, onClose }) {
  const [notes, setNotes] = useState([]); const [photos, setPhotos] = useState([]); const [newNote, setNewNote] = useState(""); const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false); const [tab, setTab] = useState("notes");
  useEffect(()=>{
    async function load() {
      try{const [nd,pd]=await Promise.all([apiFetch(`/jobs/${job.id}/notes`).catch(()=>[]),apiFetch(`/jobs/${job.id}/photos`).catch(()=>[])]);setNotes(Array.isArray(nd)?nd:[]);setPhotos(Array.isArray(pd)?pd:[]);}catch(e){console.error(e);}
      setLoading(false);
    }
    load();
  },[job.id]);
  async function addNote() {
    if(!newNote.trim())return;setSaving(true);
    try{const note=await apiFetch(`/jobs/${job.id}/notes`,{method:"POST",body:JSON.stringify({content:newNote.trim(),note_type:"general"})});setNotes(p=>[note,...p]);setNewNote("");}catch(e){alert(e.message);}
    setSaving(false);
  }
  async function handlePhotoUpload(e) {
    const file=e.target.files[0];if(!file)return;
    const reader=new FileReader();
    reader.onload=async(ev)=>{try{const photo=await apiFetch(`/jobs/${job.id}/photos`,{method:"POST",body:JSON.stringify({url:ev.target.result,caption:file.name,photo_type:"before"})});setPhotos(p=>[photo,...p]);}catch(e){setPhotos(p=>[{id:Date.now(),url:ev.target.result,caption:file.name,created_at:new Date().toISOString()},...p]);}};
    reader.readAsDataURL(file);
  }
  const tabStyle=t=>({padding:"8px 16px",border:"none",background:tab===t?"var(--blue)":"transparent",color:tab===t?"#fff":"var(--text3)",borderRadius:6,cursor:"pointer",fontSize:13,fontWeight:tab===t?600:400,transition:"all .12s"});
  return (
    <Modal title={`${job.job_number} — ${job.title}`} onClose={onClose} width={600}>
      <div style={{ padding:"0 24px 8px",borderBottom:"1px solid var(--border)",display:"flex",gap:6 }}><button style={tabStyle("notes")} onClick={()=>setTab("notes")}>📝 Notes ({notes.length})</button><button style={tabStyle("photos")} onClick={()=>setTab("photos")}>📷 Photos ({photos.length})</button></div>
      {loading?<Spinner />:<div style={{ padding:"16px 24px" }}>
        {tab==="notes"&&(<><div style={{ marginBottom:16 }}><textarea value={newNote} onChange={e=>setNewNote(e.target.value)} placeholder="Add a job note…" style={{ ...inputStyle,height:100,resize:"vertical",marginBottom:8 }} /><Btn onClick={addNote} disabled={saving||!newNote.trim()} small>{saving?"Saving…":"+ Add Note"}</Btn></div>{notes.length===0?<div style={{ textAlign:"center",padding:"24px",color:"var(--text3)",fontSize:13 }}>No notes yet.</div>:<div style={{ display:"flex",flexDirection:"column",gap:10 }}>{notes.map(n=><div key={n.id} style={{ background:"var(--surface2)",border:"1px solid var(--border)",borderRadius:8,padding:"12px 14px" }}><div style={{ fontSize:13,color:"var(--text1)",lineHeight:1.6,marginBottom:6 }}>{n.content}</div><div style={{ fontSize:11,color:"var(--text3)" }}>{n.author_name||"Tech"} · {new Date(n.created_at).toLocaleDateString("en-US",{month:"short",day:"numeric",hour:"numeric",minute:"2-digit"})}</div></div>)}</div>}</>)}
        {tab==="photos"&&(<><div style={{ marginBottom:16 }}><label style={{ display:"inline-block",cursor:"pointer" }}><div style={{ background:"var(--blue)",color:"#fff",padding:"9px 18px",borderRadius:8,fontSize:13,fontWeight:500,display:"inline-flex",alignItems:"center",gap:6 }}>📷 Upload Photo</div><input type="file" accept="image/*" capture="environment" onChange={handlePhotoUpload} style={{ display:"none" }} /></label></div>{photos.length===0?<div style={{ textAlign:"center",padding:"24px",color:"var(--text3)",fontSize:13 }}>No photos yet.</div>:<div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:10 }}>{photos.map(p=><div key={p.id} style={{ borderRadius:8,overflow:"hidden",border:"1px solid var(--border)",background:"var(--surface2)" }}><img src={p.url} alt={p.caption||"Job photo"} style={{ width:"100%",aspectRatio:"1",objectFit:"cover",display:"block" }} /><div style={{ padding:"6px 8px",fontSize:11,color:"var(--text3)" }}>{p.caption||"Photo"}</div></div>)}</div>}</>)}
      </div>}
      <div style={{ padding:"12px 24px",borderTop:"1px solid var(--border)",display:"flex",justifyContent:"flex-end" }}><Btn variant="secondary" onClick={onClose}>Close</Btn></div>
    </Modal>
  );
}

// ── TEAM ──
function TeamScreen() {
  const [members, setMembers] = useState([]); const [loading, setLoading] = useState(true); const [showNew, setShowNew] = useState(false);
  async function load() { setLoading(true); try{const d=await apiFetch("/users?limit=100");setMembers(Array.isArray(d)?d:[]);}catch(e){console.error(e);} setLoading(false); }
  useEffect(()=>{load();},[]);
  return (
    <div style={{ flex:1,display:"flex",flexDirection:"column",overflow:"hidden" }}>
      {showNew&&<NewMemberModal onClose={()=>setShowNew(false)} onSave={async m=>{setMembers(p=>[m,...p]);setShowNew(false);}} />}
      <div style={{ padding:"14px 16px",background:"var(--surface)",borderBottom:"1px solid var(--border)",display:"flex",justifyContent:"space-between",alignItems:"center",flexShrink:0 }}><span style={{ fontSize:16,fontFamily:"var(--display)",fontWeight:700 }}>Team Members</span><Btn small onClick={()=>setShowNew(true)}>+ Add Member</Btn></div>
      <div style={{ flex:1,overflowY:"auto",padding:16 }}>
        {loading?<Spinner />:members.length===0?<EmptyState icon="👷" title="No team members yet" desc="Add your first technician" action={<Btn onClick={()=>setShowNew(true)}>+ Add Member</Btn>} />:<div style={{ display:"flex",flexDirection:"column",gap:10 }}>{members.map(m=><Card key={m.id} style={{ padding:"14px 16px" }}><div style={{ display:"flex",alignItems:"center",gap:14 }}><div style={{ width:44,height:44,borderRadius:"50%",background:"var(--blue-lt)",border:"1px solid var(--blue-bd)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:700,color:"var(--blue)",flexShrink:0 }}>{(m.name||"?").split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase()}</div><div style={{ flex:1,minWidth:0 }}><div style={{ fontSize:15,fontWeight:700,marginBottom:2 }}>{m.name}</div><div style={{ fontSize:12,color:"var(--text3)",marginBottom:4 }}>{m.email}{m.phone?` · ${m.phone}`:""}</div><span style={{ background:"var(--blue-lt)",color:"var(--blue)",fontSize:11,fontWeight:600,padding:"2px 10px",borderRadius:100 }}>{m.role}</span></div><div style={{ width:10,height:10,borderRadius:"50%",background:m.is_active!==false?"#22C55E":"#9CA3AF",flexShrink:0 }} /></div></Card>)}</div>}
      </div>
    </div>
  );
}

function NewMemberModal({ onClose, onSave }) {
  const [f, setF] = useState({ name:"",email:"",phone:"",password:"",role:"technician" }); const [saving, setSaving] = useState(false);
  async function save() {
    if(!f.name||!f.email||!f.password){alert("Name, email and password required");return;}
    if(f.password.length<6){alert("Password must be at least 6 characters");return;}
    setSaving(true);
    try{const m=await apiFetch("/users",{method:"POST",body:JSON.stringify(f)});onSave(m);}catch(e){alert(e.message);}
    setSaving(false);
  }
  return (
    <Modal title="Add Team Member" onClose={onClose}>
      <div style={{ padding:"18px 24px",display:"flex",flexDirection:"column",gap:14 }}>
        <FormField label="Full Name *"><input style={inputStyle} value={f.name} onChange={e=>setF(p=>({...p,name:e.target.value}))} placeholder="John Smith" /></FormField>
        <FormField label="Email *"><input style={inputStyle} type="email" value={f.email} onChange={e=>setF(p=>({...p,email:e.target.value}))} placeholder="john@email.com" /></FormField>
        <FormField label="Phone"><input style={inputStyle} value={f.phone} onChange={e=>setF(p=>({...p,phone:e.target.value}))} placeholder="405-555-0100" /></FormField>
        <FormField label="Role"><select style={inputStyle} value={f.role} onChange={e=>setF(p=>({...p,role:e.target.value}))}><option value="technician">Technician</option><option value="dispatcher">Dispatcher</option><option value="admin">Admin</option></select></FormField>
        <FormField label="Password *"><input style={inputStyle} type="password" value={f.password} onChange={e=>setF(p=>({...p,password:e.target.value}))} placeholder="Min 6 characters" /></FormField>
        <div style={{ background:"var(--blue-lt)",border:"1px solid var(--blue-bd)",borderRadius:8,padding:"10px 14px",fontSize:12,color:"var(--blue)" }}>💡 Share these login details with your tech. They log in at <strong>fieldops-api-uuem.vercel.app</strong></div>
      </div>
      <div style={{ padding:"14px 24px",borderTop:"1px solid var(--border)",display:"flex",justifyContent:"flex-end",gap:10 }}><Btn variant="secondary" onClick={onClose}>Cancel</Btn><Btn onClick={save} disabled={saving}>{saving?"Adding…":"Add Member"}</Btn></div>
    </Modal>
  );
}

// ── APP SHELL ──
const PAGE_TITLES_MAP = {"/":"Dashboard","/dispatch":"Dispatch","/customers":"Customers","/jobs":"Jobs","/invoices":"Work Orders","/team":"Team","/workorder":"Work Order","/pricebook":"Pricebook","/reports":"Reports"};
const MOBILE_NAV = [
  {id:"/",icon:"⊞",label:"Home"},
  {id:"/jobs",icon:"🔧",label:"Jobs"},
  {id:"/customers",icon:"👥",label:"Customers"},
  {id:"/invoices",icon:"📄",label:"Work Orders"},
  {id:"/workorder",icon:"📋",label:"Work Order"},
];

function ReportsScreen() {
  const [jobs, setJobs] = useState([]);
  const [workOrders, setWorkOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [j, wo] = await Promise.all([
          apiFetch("/jobs?limit=500").catch(() => []),
          apiFetch("/work-orders?limit=500").catch(() => ({ data: [] })),
        ]);
        setJobs(Array.isArray(j) ? j : []);
        setWorkOrders(Array.isArray(wo?.data) ? wo.data : Array.isArray(wo) ? wo : []);
      } catch(e) { console.error(e); }
      setLoading(false);
    }
    load();
  }, []);

  // Build last 6 months revenue from work orders totalAmount
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    months.push({ label: d.toLocaleString("default", { month: "short", year: "2-digit" }), month: d.getMonth(), year: d.getFullYear(), revenue: 0, count: 0 });
  }
  workOrders.forEach(wo => {
    const amt = parseFloat(wo.total_amount || wo.totalAmount || 0);
    if (!amt) return;
    const d = new Date(wo.created_at || wo.saved_at || wo.savedAt || wo.createdAt);
    if (isNaN(d)) return;
    const m = months.find(x => x.month === d.getMonth() && x.year === d.getFullYear());
    if (m) { m.revenue += amt; m.count++; }
  });

  // Also pull from jobs that have a total
  jobs.forEach(job => {
    const amt = parseFloat(job.total_amount || job.totalAmount || 0);
    if (!amt) return;
    const d = new Date(job.scheduled_at || job.created_at);
    if (isNaN(d)) return;
    const m = months.find(x => x.month === d.getMonth() && x.year === d.getFullYear());
    if (m) { m.revenue += amt; m.count++; }
  });

  const maxRev = Math.max(...months.map(m => m.revenue), 1);
  const totalRev = months.reduce((s, m) => s + m.revenue, 0);
  const totalJobs = jobs.length;
  const completedJobs = jobs.filter(j => j.status === "completed").length;
  const fmt$ = v => "$" + Number(v).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // Job status breakdown
  const statusCounts = {};
  jobs.forEach(j => { statusCounts[j.status] = (statusCounts[j.status] || 0) + 1; });
  const statusColors = { completed: "#10B981", scheduled: "#3B82F6", pending: "#F59E0B", cancelled: "#EF4444", "in-progress": "#8B5CF6" };

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: 24, background: "var(--bg)" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Revenue Reports</h2>
          <div style={{ fontSize: 13, color: "var(--text3)", marginTop: 4 }}>Last 6 months overview</div>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: 60, color: "var(--text3)" }}>Loading...</div>
        ) : (
          <>
            {/* Summary Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
              {[
                { label: "6-Month Revenue", val: fmt$(totalRev), icon: "💰", color: "#10B981" },
                { label: "Total Jobs", val: totalJobs, icon: "🔧", color: "#3B82F6" },
                { label: "Completed Jobs", val: completedJobs, icon: "✅", color: "#7C3AED" },
              ].map(c => (
                <div key={c.label} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "20px 24px" }}>
                  <div style={{ fontSize: 11, color: "var(--text3)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>{c.label}</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: c.color }}>{c.val}</div>
                </div>
              ))}
            </div>

            {/* Bar Chart */}
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 24, marginBottom: 24 }}>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 20 }}>Revenue by Month</div>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 12, height: 180 }}>
                {months.map(m => (
                  <div key={m.label} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                    <div style={{ fontSize: 11, color: "var(--text3)", fontWeight: 600 }}>
                      {m.revenue > 0 ? fmt$(m.revenue) : "—"}
                    </div>
                    <div style={{
                      width: "100%", borderRadius: "6px 6px 0 0",
                      background: m.revenue > 0 ? "linear-gradient(180deg, #3B82F6, #1D4ED8)" : "var(--border)",
                      height: m.revenue > 0 ? `${Math.max((m.revenue / maxRev) * 140, 4)}px` : "4px",
                      transition: "height .3s"
                    }} />
                    <div style={{ fontSize: 11, color: "var(--text3)", fontWeight: 500 }}>{m.label}</div>
                    {m.count > 0 && <div style={{ fontSize: 10, color: "var(--text3)" }}>{m.count} WO</div>}
                  </div>
                ))}
              </div>
              {totalRev === 0 && (
                <div style={{ textAlign: "center", color: "var(--text3)", fontSize: 13, marginTop: 12 }}>
                  No revenue data yet — submit work orders with a total amount to see data here.
                </div>
              )}
            </div>

            {/* Job Status Breakdown */}
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 24 }}>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Job Status Breakdown</div>
              {Object.keys(statusCounts).length === 0 ? (
                <div style={{ color: "var(--text3)", fontSize: 13 }}>No jobs yet.</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {Object.entries(statusCounts).map(([status, count]) => (
                    <div key={status} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 10, height: 10, borderRadius: "50%", background: statusColors[status] || "#8899BB", flexShrink: 0 }} />
                      <div style={{ width: 110, fontSize: 13, fontWeight: 600, textTransform: "capitalize" }}>{status}</div>
                      <div style={{ flex: 1, background: "var(--border)", borderRadius: 4, height: 8, overflow: "hidden" }}>
                        <div style={{ width: `${(count / totalJobs) * 100}%`, height: "100%", background: statusColors[status] || "#8899BB", borderRadius: 4 }} />
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 700, width: 30, textAlign: "right" }}>{count}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function AppShell() {
  const { route, navigate } = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [currentJob, setCurrentJob] = useState(null);

  useEffect(()=>{const h=()=>setIsMobile(window.innerWidth<768);window.addEventListener('resize',h);return()=>window.removeEventListener('resize',h);},[]);

  const screens = {
    "/": <Dashboard />,
    "/dispatch": <DispatchScreen />,
    "/customers": <CustomersScreen />,
    "/invoices": <InvoicesScreen />,
    "/jobs": <JobsScreen />,
    "/team": <TeamScreen />,
    "/workorder": <WorkOrder405 prefill={currentJob} onSave={async wo=>{
      await saveWorkOrder({...wo,customerId:currentJob?.customerId});
      if (wo.jobId || currentJob?.jobId) {
        const jobId = wo.jobId || currentJob?.jobId;
        fetch(`${API_URL}/jobs/${jobId}/status`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
          body: JSON.stringify({ status: "completed" })
        }).catch(()=>{});
      }
      setCurrentJob(null);
    }} />,
    "/pricebook": <Pricebook />,
    "/reports": <ReportsScreen />,
  };

  const content = (
    <JobContext.Provider value={{ currentJob, setCurrentJob }}>
      {screens[route]||screens["/"]}
    </JobContext.Provider>
  );

  if (isMobile) {
    return (
      <div style={{ display:"flex",flexDirection:"column",height:"100vh",overflow:"hidden",background:"var(--bg)" }}>
        <div style={{ height:52,background:"var(--nav-bg)",borderBottom:"1px solid var(--nav-border)",display:"flex",alignItems:"center",padding:"0 16px",flexShrink:0 }}>
          <div style={{ display:"flex",alignItems:"center",gap:8,flex:1 }}><div style={{ width:28,height:28,borderRadius:7,background:"linear-gradient(135deg,#3B82F6,#1D4ED8)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0 }}>⚡</div><span style={{ fontSize:15,fontFamily:"var(--display)",fontWeight:800,color:"#fff" }}>FieldOps</span></div>
          <span style={{ fontSize:12,fontFamily:"var(--display)",fontWeight:600,color:"#8899BB",whiteSpace:"nowrap" }}>{PAGE_TITLES_MAP[route]||""}</span>
        </div>
        <div style={{ flex:1,overflow:"auto",display:"flex",flexDirection:"column",paddingBottom:60 }}>{content}</div>
        <div style={{ position:"fixed",bottom:0,left:0,right:0,height:60,background:"var(--nav-bg)",borderTop:"1px solid var(--nav-border)",display:"flex",alignItems:"center",justifyContent:"space-around",zIndex:1000 }}>
          {MOBILE_NAV.map(item=><button key={item.id} onClick={()=>navigate(item.id)} style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:2,background:"none",border:"none",color:route===item.id?"#fff":"var(--nav-text)",cursor:"pointer",padding:"4px 8px",borderRadius:8,minWidth:52,transition:"color .15s" }}><span style={{ fontSize:22,lineHeight:1 }}>{item.icon}</span><span style={{ fontSize:9,fontWeight:route===item.id?700:400,letterSpacing:"0.04em",textTransform:"uppercase" }}>{item.label}</span></button>)}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display:"flex",height:"100vh",overflow:"hidden" }}>
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <div style={{ flex:1,display:"flex",flexDirection:"column",overflow:"hidden",minWidth:0 }}>
        <TopBar />
        <div style={{ flex:1,display:"flex",overflow:"hidden" }}>{content}</div>
      </div>
    </div>
  );
}

function AppWithProviders() {
  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <RouterProvider><AuthProvider><AppInner /></AuthProvider></RouterProvider>
    </>
  );
}
function AppInner() { const { user } = useAuth(); return user ? <AppShell /> : <LoginScreen />; }
export default AppWithProviders;
