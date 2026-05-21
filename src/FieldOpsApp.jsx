/* eslint-disable */
// v4.1 — scheduling overhaul: schedule/reschedule buttons, time display, no end time
import { useState, useContext, createContext, useCallback, useEffect, useRef } from "react";
import WorkOrder405 from "./WorkOrder405";

const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --nav-bg:#0A0E1A; --nav-border:rgba(255,255,255,0.06); --nav-text:#6B7A99; --nav-active:#F0F4FF; --nav-hover:rgba(255,255,255,0.05); --nav-accent:#3B6FFF;
    --bg:#0F1320; --surface:#161B2E; --surface2:#1C2238; --surface3:#222840; --border:rgba(255,255,255,0.07); --border2:rgba(255,255,255,0.12);
    --text1:#F0F4FF; --text2:#A8B4CC; --text3:#6B7A99; --text4:#3D4D66;
    --blue:#3B6FFF; --blue-lt:rgba(59,111,255,0.12); --blue-bd:rgba(59,111,255,0.3);
    --green:#00C48C; --green-lt:rgba(0,196,140,0.1); --green-bd:rgba(0,196,140,0.25);
    --amber:#F59E0B; --amber-lt:rgba(245,158,11,0.1); --amber-bd:rgba(245,158,11,0.25);
    --red:#FF4D4D; --red-lt:rgba(255,77,77,0.1); --red-bd:rgba(255,77,77,0.25);
    --purple:#8B5CF6; --purple-lt:rgba(139,92,246,0.1); --purple-bd:rgba(139,92,246,0.25);
    --display:'Plus Jakarta Sans',sans-serif; --sans:'Inter',-apple-system,sans-serif; --mono:'JetBrains Mono',monospace;
    --radius-sm:6px; --radius:10px; --radius-lg:14px; --radius-xl:18px;
    --shadow-sm:0 1px 3px rgba(0,0,0,0.4); --shadow:0 4px 16px rgba(0,0,0,0.5); --shadow-lg:0 12px 40px rgba(0,0,0,0.6);
  }
  html,body,#root{height:100%}
  body{font-family:var(--sans);background:var(--bg);color:var(--text1);font-size:13.5px;line-height:1.6;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}
  button{font-family:var(--sans);cursor:pointer}
  input,textarea,select{font-family:var(--sans);-webkit-font-smoothing:antialiased}
  ::placeholder{color:var(--text4)}
  ::-webkit-scrollbar{width:4px;height:4px}
  ::-webkit-scrollbar-track{background:transparent}
  ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:8px}
  ::-webkit-scrollbar-thumb:hover{background:rgba(255,255,255,0.2)}
  @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
  @keyframes spin{to{transform:rotate(360deg)}}
  .fade-in{animation:fadeIn .25s cubic-bezier(0.16,1,0.3,1) both}
  .s1{animation-delay:.04s}.s2{animation-delay:.08s}.s3{animation-delay:.12s}.s4{animation-delay:.16s}
`;

const WO_KEY = "fieldops_workorders_cache";
function loadWorkOrders() { try { return JSON.parse(localStorage.getItem(WO_KEY)||"[]"); } catch { return []; } }
function cacheWorkOrders(list) { try { localStorage.setItem(WO_KEY, JSON.stringify(list)); } catch {} }
async function fetchWorkOrders(params = "") {
  try { const data = await apiFetch(`/work-orders?limit=200${params}`); const list = Array.isArray(data) ? data.map(normalizeWO) : []; cacheWorkOrders(list); return list; } catch { return loadWorkOrders(); }
}
async function saveWorkOrder(wo) {
  try {
    const payload = { wo_number:wo.wo||wo.wo_number||String(Date.now()), job_id:wo.jobId||null, customer_id:wo.customerId||null, date:wo.date||null, customer:wo.customer||null, billing_address:wo.billingAddress||null, phone:wo.phone||null, cell:wo.cell||null, email:wo.email||null, complaint:wo.complaint||null, worked_by:wo.workedBy||null, unit_address:wo.unitAddress||null, unit_phone:wo.unitPhone||null, unit_cell:wo.unitCell||null, job_types:wo.jobTypes||[], equipment:wo.equipment||[], technician:wo.technician||null, time_in:wo.timeIn||null, time_out:wo.timeOut||null, travel_time:wo.travelTime||null, reg_hrs:wo.regHrs||null, ot_hrs:wo.otHrs||null, rate:wo.rate||null, amount:wo.amount||null, checklist:wo.checklist||[], description_of_work:wo.descriptionOfWork||null, recommendations:wo.recommendations||null, materials:wo.materials||[], service_type:wo.serviceType||[], total_amount:wo.totalAmount||null, print_name:wo.printName||null, signature:wo.signature||null, sign_date:wo.signDate||null };
    const saved = await apiFetch("/work-orders", { method:"POST", body:JSON.stringify(payload) });
    return normalizeWO(saved);
  } catch(e) { console.error("WO save failed:", e); const list=loadWorkOrders(); const idx=list.findIndex(w=>w.wo===wo.wo); if(idx>=0)list[idx]=wo;else list.unshift(wo); cacheWorkOrders(list); return wo; }
}
async function deleteWorkOrder(id) { try { await apiFetch(`/work-orders/${id}`, { method:"DELETE" }); } catch(e) { console.error(e); } }
function normalizeWO(w) {
  return { id:w.id, wo:w.wo_number||w.wo, date:w.date, customer:w.customer, customerId:w.customer_id||w.customerId, jobId:w.job_id||w.jobId, billingAddress:w.billing_address||w.billingAddress, phone:w.phone, cell:w.cell, email:w.email, complaint:w.complaint, workedBy:w.worked_by||w.workedBy, unitAddress:w.unit_address||w.unitAddress, unitPhone:w.unit_phone||w.unitPhone, unitCell:w.unit_cell||w.unitCell, jobTypes:w.job_types||w.jobTypes||[], equipment:w.equipment||[], technician:w.technician, timeIn:w.time_in||w.timeIn, timeOut:w.time_out||w.timeOut, travelTime:w.travel_time||w.travelTime, regHrs:w.reg_hrs||w.regHrs, otHrs:w.ot_hrs||w.otHrs, rate:w.rate, amount:w.amount, checklist:w.checklist||[], descriptionOfWork:w.description_of_work||w.descriptionOfWork, recommendations:w.recommendations, materials:w.materials||[], serviceType:w.service_type||w.serviceType||[], totalAmount:w.total_amount||w.totalAmount, printName:w.print_name||w.printName, signature:w.signature, signDate:w.sign_date||w.signDate, savedAt:w.created_at||w.savedAt };
}

const JobContext = createContext(null);
const useJobContext = () => useContext(JobContext);

const API_URL = process.env.REACT_APP_API_URL || "https://fieldops-api-production-b341.up.railway.app/v1";
function getToken() { return localStorage.getItem("fieldops_token"); }
async function apiFetch(path, options = {}) {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, { headers:{"Content-Type":"application/json",...(token?{Authorization:`Bearer ${token}`}:{}), ...options.headers}, ...options });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message || "Request failed");
  return data.data;
}

const AuthContext = createContext(null);
function AuthProvider({ children }) {
  const [user, setUser] = useState(null); const [loading, setLoading] = useState(false);
  useEffect(() => { const saved=localStorage.getItem("fsm_user"); const token=localStorage.getItem("fieldops_token"); if(saved&&token)try{setUser(JSON.parse(saved));}catch{} }, []);
  async function login(email, password) {
    setLoading(true);
    try { const data=await apiFetch("/auth/login",{method:"POST",body:JSON.stringify({email,password})}); localStorage.setItem("fieldops_token",data.token); const u={...data.user,company:data.company||data.user.company||{name:"405 Heating & Air Conditioning"}}; localStorage.setItem("fsm_user",JSON.stringify(u)); setUser(u); setLoading(false); return {ok:true}; }
    catch(err) { setLoading(false); return {ok:false,error:err.message||"Invalid email or password"}; }
  }
  function logout() { setUser(null); localStorage.removeItem("fsm_user"); localStorage.removeItem("fieldops_token"); }
  return <AuthContext.Provider value={{ user, login, logout, loading }}>{children}</AuthContext.Provider>;
}
const useAuth = () => useContext(AuthContext);

const RouterContext = createContext(null);
function RouterProvider({ children }) {
  const [route, setRoute] = useState(() => { if(!window.location.hash){window.location.hash="/";return"/";} return window.location.hash.slice(1)||"/"; });
  const navigate = useCallback(path => { window.location.hash=path; setRoute(path); }, []);
  useEffect(() => { const handler=()=>setRoute(window.location.hash.slice(1)||"/"); window.addEventListener("hashchange",handler); return()=>window.removeEventListener("hashchange",handler); }, []);
  return <RouterContext.Provider value={{ route, navigate }}>{children}</RouterContext.Provider>;
}
const useRouter = () => useContext(RouterContext);

const STATUS_CFG = {
  scheduled:{label:"Scheduled",color:"#3B6FFF",bg:"rgba(59,111,255,0.12)",bd:"rgba(59,111,255,0.3)"},
  in_progress:{label:"In Progress",color:"#F59E0B",bg:"rgba(245,158,11,0.12)",bd:"rgba(245,158,11,0.3)"},
  en_route:{label:"En Route",color:"#8B5CF6",bg:"rgba(139,92,246,0.12)",bd:"rgba(139,92,246,0.3)"},
  completed:{label:"Completed",color:"#00C48C",bg:"rgba(0,196,140,0.12)",bd:"rgba(0,196,140,0.3)"},
  cancelled:{label:"Cancelled",color:"#6B7A99",bg:"rgba(107,122,153,0.1)",bd:"rgba(107,122,153,0.2)"},
  on_hold:{label:"On Hold",color:"#FF4D4D",bg:"rgba(255,77,77,0.12)",bd:"rgba(255,77,77,0.3)"},
  unscheduled:{label:"Unscheduled",color:"#6B7A99",bg:"rgba(107,122,153,0.1)",bd:"rgba(107,122,153,0.2)"},
  draft:{label:"Draft",color:"#6B7A99",bg:"rgba(107,122,153,0.1)",bd:"rgba(107,122,153,0.2)"},
  sent:{label:"Sent",color:"#3B6FFF",bg:"rgba(59,111,255,0.12)",bd:"rgba(59,111,255,0.3)"},
  paid:{label:"Paid",color:"#00C48C",bg:"rgba(0,196,140,0.12)",bd:"rgba(0,196,140,0.3)"},
  overdue:{label:"Overdue",color:"#FF4D4D",bg:"rgba(255,77,77,0.12)",bd:"rgba(255,77,77,0.3)"},
  partial:{label:"Partial",color:"#F59E0B",bg:"rgba(245,158,11,0.12)",bd:"rgba(245,158,11,0.3)"},
};
function Chip({ status }) {
  const c=STATUS_CFG[status]||STATUS_CFG.draft;
  return <span style={{ display:"inline-flex",alignItems:"center",gap:5,background:c.bg,color:c.color,border:`1px solid ${c.bd}`,borderRadius:20,padding:"3px 10px",fontSize:10.5,fontWeight:600,fontFamily:"var(--sans)",letterSpacing:"0.04em",whiteSpace:"nowrap" }}><span style={{ width:5,height:5,borderRadius:"50%",background:c.color,boxShadow:`0 0 6px ${c.color}` }} />{c.label}</span>;
}
function Btn({ children, variant="primary", onClick, small, disabled, full, style:sx={} }) {
  const variants={
    primary:{background:"var(--blue)",color:"#fff",border:"1px solid transparent",boxShadow:"0 0 0 0 rgba(59,111,255,0)"},
    secondary:{background:"var(--surface2)",color:"var(--text2)",border:"1px solid var(--border2)"},
    ghost:{background:"transparent",color:"var(--text3)",border:"1px solid transparent"},
    danger:{background:"var(--red-lt)",color:"var(--red)",border:"1px solid var(--red-bd)"}
  };
  return <button onClick={disabled?undefined:onClick} style={{ ...variants[variant],borderRadius:8,fontWeight:500,padding:small?"4px 12px":"8px 16px",fontSize:small?12:13,opacity:disabled?.4:1,cursor:disabled?"not-allowed":"pointer",transition:"all .15s",width:full?"100%":"auto",letterSpacing:"0.01em",...sx }} onMouseEnter={e=>{if(!disabled){e.currentTarget.style.filter="brightness(1.15)";e.currentTarget.style.transform="translateY(-1px)";}}} onMouseLeave={e=>{e.currentTarget.style.filter="";e.currentTarget.style.transform="";}}>{children}</button>;
}
function Card({ children, style:sx={}, className="", onClick }) {
  return <div className={className} onClick={onClick} style={{ background:"var(--surface)",border:"1px solid var(--border)",borderRadius:12,...sx }}>{children}</div>;
}
function Spinner() {
  return <div style={{ width:20,height:20,border:"2px solid var(--border2)",borderTopColor:"var(--blue)",borderRadius:"50%",animation:"spin .7s linear infinite",margin:"48px auto" }} />;
}
function EmptyState({ icon, title, desc, action }) {
  return <div style={{ textAlign:"center",padding:"64px 20px",color:"var(--text3)" }}><div style={{ fontSize:44,marginBottom:14,filter:"grayscale(0.3)" }}>{icon}</div><div style={{ fontSize:17,fontFamily:"var(--display)",fontWeight:700,color:"var(--text1)",marginBottom:8,letterSpacing:"-0.02em" }}>{title}</div><div style={{ fontSize:13,marginBottom:24,maxWidth:280,margin:"0 auto 24px",lineHeight:1.7,color:"var(--text3)" }}>{desc}</div>{action}</div>;
}
function Modal({ title, onClose, children, width=520 }) {
  return <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",backdropFilter:"blur(8px)",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center",padding:20 }} onClick={e=>e.target===e.currentTarget&&onClose()}><div className="fade-in" style={{ background:"var(--surface)",borderRadius:16,width:"100%",maxWidth:width,maxHeight:"90vh",overflowY:"auto",border:"1px solid var(--border2)",boxShadow:"0 24px 80px rgba(0,0,0,0.8)" }}><div style={{ padding:"20px 24px",borderBottom:"1px solid var(--border)",display:"flex",justifyContent:"space-between",alignItems:"center" }}><h3 style={{ fontSize:16,fontFamily:"var(--display)",fontWeight:700,letterSpacing:"-0.01em",color:"var(--text1)" }}>{title}</h3><button onClick={onClose} style={{ background:"var(--surface2)",border:"1px solid var(--border)",width:28,height:28,borderRadius:6,fontSize:16,color:"var(--text3)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",transition:"all .15s" }} onMouseEnter={e=>{e.currentTarget.style.background="var(--surface3)";e.currentTarget.style.color="var(--text1)";}} onMouseLeave={e=>{e.currentTarget.style.background="var(--surface2)";e.currentTarget.style.color="var(--text3)";}}>×</button></div>{children}</div></div>;
}
function FormField({ label, children }) {
  return <div><label style={{ fontSize:11,fontWeight:600,color:"var(--text3)",letterSpacing:"0.06em",textTransform:"uppercase",display:"block",marginBottom:6,fontFamily:"var(--sans)" }}>{label}</label>{children}</div>;
}
const inputStyle = { width:"100%",padding:"9px 12px",borderRadius:8,fontSize:13,border:"1px solid var(--border2)",outline:"none",transition:"border-color .15s, box-shadow .15s",background:"var(--surface2)",color:"var(--text1)" };
function fmt$(n) { return n==null?"—":"$"+Number(n).toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2}); }
function fmtDate(s) { if(!s)return"—"; return new Date(s).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}); }

function LoginScreen() {
  const { login, loading } = useAuth();
  const [email,setEmail]=useState(""); const [password,setPassword]=useState(""); const [error,setError]=useState("");
  async function handleSubmit(e) { e?.preventDefault(); setError(""); const res=await login(email,password); if(!res.ok)setError(res.error); }
  return (
    <div style={{ minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"var(--bg)",padding:24,position:"relative",overflow:"hidden" }}>
      {/* Background glow effects */}
      <div style={{ position:"absolute",top:"20%",left:"30%",width:600,height:600,background:"radial-gradient(circle,rgba(59,111,255,0.06) 0%,transparent 70%)",pointerEvents:"none" }} />
      <div style={{ position:"absolute",bottom:"10%",right:"20%",width:400,height:400,background:"radial-gradient(circle,rgba(107,95,255,0.05) 0%,transparent 70%)",pointerEvents:"none" }} />
      <div style={{ width:"100%",maxWidth:400,position:"relative" }}>
        <div style={{ textAlign:"center",marginBottom:40 }}>
          <div style={{ width:52,height:52,borderRadius:14,background:"linear-gradient(135deg,#3B6FFF,#6B5FFF)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,margin:"0 auto 18px",boxShadow:"0 0 32px rgba(59,111,255,0.4)" }}>⚡</div>
          <div style={{ fontSize:26,fontFamily:"var(--display)",fontWeight:800,color:"var(--text1)",letterSpacing:"-0.03em",marginBottom:6 }}>FieldOps</div>
          <div style={{ fontSize:13,color:"var(--text3)" }}>Sign in to your workspace</div>
        </div>
        <div style={{ background:"var(--surface)",border:"1px solid var(--border2)",borderRadius:16,padding:"32px",boxShadow:"0 24px 64px rgba(0,0,0,0.5)" }}>
          {error&&<div style={{ background:"var(--red-lt)",border:"1px solid var(--red-bd)",borderRadius:8,padding:"10px 14px",fontSize:13,color:"var(--red)",marginBottom:16 }}>{error}</div>}
          <form onSubmit={handleSubmit} style={{ display:"flex",flexDirection:"column",gap:14 }}>
            <input value={email} onChange={e=>setEmail(e.target.value)} type="email" placeholder="Email address" style={{ ...inputStyle,padding:"12px 14px",fontSize:13.5 }} />
            <input value={password} onChange={e=>setPassword(e.target.value)} type="password" placeholder="Password" style={{ ...inputStyle,padding:"12px 14px",fontSize:13.5 }} onKeyDown={e=>e.key==="Enter"&&handleSubmit()} />
            <button type="submit" disabled={loading} style={{ padding:"13px",background:"linear-gradient(135deg,#3B6FFF,#6B5FFF)",border:"none",borderRadius:10,color:"#fff",fontSize:14,fontWeight:600,cursor:"pointer",fontFamily:"var(--sans)",boxShadow:"0 4px 20px rgba(59,111,255,0.4)",opacity:loading?.7:1,letterSpacing:"-0.01em",marginTop:4 }}>{loading?"Signing in…":"Sign In →"}</button>
          </form>
        </div>
      </div>
    </div>
  );
}

const NAV_ITEMS = [
  {id:"/",icon:"⊞",label:"Dashboard"},{id:"/dispatch",icon:"📡",label:"Dispatch"},{id:"/customers",icon:"👥",label:"Customers"},
  {id:"/invoices",icon:"📄",label:"Work Orders"},{id:"/jobs",icon:"🔧",label:"Jobs"},{id:"/team",icon:"👷",label:"Team"},
  {id:"/workorder",icon:"📋",label:"Work Order"},{id:"/pricebook",icon:"💲",label:"Pricebook"},{id:"/templates",icon:"📌",label:"Templates"},{id:"/estimates",icon:"📝",label:"Estimates"},{id:"/reports",icon:"📊",label:"Reports"},
];
function Sidebar({ collapsed, setCollapsed }) {
  const { route, navigate } = useRouter(); const { user, logout } = useAuth();
  return (
    <div style={{ width:collapsed?60:228,flexShrink:0,background:"var(--nav-bg)",borderRight:"1px solid var(--nav-border)",display:"flex",flexDirection:"column",transition:"width .2s cubic-bezier(0.16,1,0.3,1)",overflow:"hidden" }}>
      {/* Logo */}
      <div style={{ height:60,display:"flex",alignItems:"center",padding:collapsed?"0 18px":"0 20px",justifyContent:collapsed?"center":"space-between",borderBottom:"1px solid var(--nav-border)",flexShrink:0 }}>
        {!collapsed&&<div style={{ display:"flex",alignItems:"center",gap:10 }}>
          <div style={{ width:30,height:30,borderRadius:8,background:"linear-gradient(135deg,#3B6FFF,#6B5FFF)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,flexShrink:0,boxShadow:"0 0 16px rgba(59,111,255,0.4)" }}>⚡</div>
          <span style={{ fontSize:15,fontFamily:"var(--display)",fontWeight:700,color:"var(--text1)",letterSpacing:"-0.02em",whiteSpace:"nowrap" }}>FieldOps</span>
        </div>}
        {collapsed&&<div style={{ width:30,height:30,borderRadius:8,background:"linear-gradient(135deg,#3B6FFF,#6B5FFF)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,boxShadow:"0 0 16px rgba(59,111,255,0.4)" }}>⚡</div>}
        {!collapsed&&<button onClick={()=>setCollapsed(true)} style={{ background:"none",border:"none",color:"var(--nav-text)",cursor:"pointer",fontSize:13,padding:"4px",borderRadius:4,opacity:0.6 }}>◀</button>}
      </div>
      {collapsed&&<button onClick={()=>setCollapsed(false)} style={{ margin:"10px auto 0",background:"none",border:"none",color:"var(--nav-text)",cursor:"pointer",fontSize:12,padding:"4px 0",width:"100%",textAlign:"center",opacity:0.5 }}>▶</button>}
      {/* Workspace pill */}
      {!collapsed&&<div style={{ margin:"12px 12px 4px",padding:"8px 12px",background:"rgba(59,111,255,0.08)",border:"1px solid rgba(59,111,255,0.15)",borderRadius:8 }}>
        <div style={{ fontSize:9.5,color:"var(--nav-text)",letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:2,fontWeight:600 }}>Workspace</div>
        <div style={{ fontSize:12,color:"var(--text1)",fontWeight:600,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>{user?.company?.name||"My Company"}</div>
      </div>}
      {/* Nav items */}
      <nav style={{ flex:1,padding:collapsed?"8px 8px":"8px 10px",display:"flex",flexDirection:"column",gap:2,overflowY:"auto" }}>
        {NAV_ITEMS.map(item=>{ const active=route===item.id; return (
          <button key={item.id} onClick={()=>navigate(item.id)} title={collapsed?item.label:""} style={{ display:"flex",alignItems:"center",gap:10,padding:collapsed?"10px 0":"8px 12px",justifyContent:collapsed?"center":"flex-start",width:"100%",background:active?"rgba(59,111,255,0.12)":"transparent",border:active?"1px solid rgba(59,111,255,0.2)":"1px solid transparent",borderRadius:8,color:active?"var(--text1)":"var(--nav-text)",cursor:"pointer",transition:"all .15s",textAlign:"left",fontSize:13,fontWeight:active?600:400 }}
          onMouseEnter={e=>{if(!active){e.currentTarget.style.background="var(--nav-hover)";e.currentTarget.style.color="var(--text2)";}}}
          onMouseLeave={e=>{if(!active){e.currentTarget.style.background="transparent";e.currentTarget.style.color="var(--nav-text)";}}}
          >
            <span style={{ fontSize:15,flexShrink:0,lineHeight:1,opacity:active?1:0.7 }}>{item.icon}</span>
            {!collapsed&&<span style={{ letterSpacing:"-0.01em" }}>{item.label}</span>}
            {active&&!collapsed&&<span style={{ marginLeft:"auto",width:4,height:4,borderRadius:"50%",background:"var(--blue)",boxShadow:"0 0 8px var(--blue)" }} />}
          </button>
        ); })}
      </nav>
      {/* User */}
      <div style={{ padding:collapsed?"8px":"8px 10px",borderTop:"1px solid var(--nav-border)" }}>
        <div style={{ padding:collapsed?"8px 0":"8px 10px",display:"flex",alignItems:"center",gap:10,justifyContent:collapsed?"center":"flex-start",borderRadius:8,cursor:"pointer",transition:"all .15s" }}
          onClick={logout}
          onMouseEnter={e=>e.currentTarget.style.background="var(--nav-hover)"}
          onMouseLeave={e=>e.currentTarget.style.background="transparent"}
          title={collapsed?`${user?.name} · Sign out`:""}
        >
          <div style={{ width:28,height:28,borderRadius:"50%",background:"linear-gradient(135deg,rgba(59,111,255,0.3),rgba(107,95,255,0.3))",border:"1px solid rgba(59,111,255,0.3)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:"var(--blue)",flexShrink:0,fontFamily:"var(--display)" }}>{user?.name?.split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase()}</div>
          {!collapsed&&<div style={{ flex:1,minWidth:0 }}><div style={{ fontSize:12,fontWeight:600,color:"var(--text1)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>{user?.name}</div><div style={{ fontSize:10.5,color:"var(--nav-text)" }}>Sign out</div></div>}
        </div>
      </div>
    </div>
  );
}

const PAGE_TITLES = {"/":"Dashboard","/dispatch":"Dispatch","/customers":"Customers","/invoices":"Work Orders","/jobs":"Jobs","/team":"Team","/workorder":"Work Order","/pricebook":"Pricebook","/reports":"Reports","/estimates":"Estimates","/templates":"Job Templates"};
function TopBar() {
  const { route, navigate } = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClick(e) { if(ref.current && !ref.current.contains(e.target)) { setOpen(false); setResults(null); setQuery(""); } }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    if(!query.trim()) { setResults(null); return; }
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const q = encodeURIComponent(query.trim());
        const [jobs, customers, wos] = await Promise.all([
          apiFetch(`/jobs?limit=5&search=${q}`).catch(()=>[]),
          apiFetch(`/customers?limit=5&search=${q}`).catch(()=>[]),
          fetchWorkOrders(`&search=${q}`).catch(()=>[]),
        ]);
        setResults({
          jobs: Array.isArray(jobs) ? jobs.slice(0,5) : [],
          customers: Array.isArray(customers) ? customers.slice(0,5) : [],
          wos: Array.isArray(wos) ? wos.slice(0,4) : [],
        });
      } catch(e) { console.error(e); }
      setSearching(false);
    }, 280);
    return () => clearTimeout(t);
  }, [query]);

  const hasResults = results && (results.jobs.length>0 || results.customers.length>0 || results.wos.length>0);

  return (
    <div style={{ height:60,background:"var(--surface)",borderBottom:"1px solid var(--border)",display:"flex",alignItems:"center",padding:"0 24px",gap:16,flexShrink:0 }}>
      <h1 style={{ flex:"none",fontSize:17,fontFamily:"var(--display)",fontWeight:700,letterSpacing:"-0.02em",color:"var(--text1)",minWidth:120 }}>{PAGE_TITLES[route]||"FieldOps"}</h1>
      {/* Global Search */}
      <div ref={ref} style={{ flex:1,maxWidth:480,position:"relative" }}>
        <div style={{ position:"relative" }}>
          <span style={{ position:"absolute",left:11,top:"50%",transform:"translateY(-50%)",fontSize:13,color:"var(--text4)",pointerEvents:"none" }}>⌕</span>
          <input
            value={query}
            onChange={e=>{setQuery(e.target.value);setOpen(true);}}
            onFocus={()=>setOpen(true)}
            placeholder="Search jobs, customers, work orders…"
            style={{ ...inputStyle,paddingLeft:32,paddingRight:12,background:"var(--surface2)",border:"1px solid var(--border)",fontSize:13,borderRadius:8 }}
          />
          {searching&&<span style={{ position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",fontSize:11,color:"var(--text4)" }}>…</span>}
        </div>
        {open && query.trim() && (
          <div style={{ position:"absolute",top:"calc(100% + 6px)",left:0,right:0,background:"var(--surface)",border:"1px solid var(--border2)",borderRadius:12,boxShadow:"0 16px 40px rgba(0,0,0,0.5)",zIndex:500,maxHeight:420,overflowY:"auto" }}>
            {!hasResults && !searching && <div style={{ padding:"20px 16px",textAlign:"center",fontSize:13,color:"var(--text4)" }}>No results for "{query}"</div>}
            {results?.jobs.length>0&&(<><div style={{ padding:"8px 14px 4px",fontSize:10,fontWeight:700,color:"var(--text4)",textTransform:"uppercase",letterSpacing:"0.08em" }}>Jobs</div>{results.jobs.map(j=><div key={j.id} onClick={()=>{navigate("/jobs");setOpen(false);setQuery("");}} style={{ padding:"9px 14px",cursor:"pointer",borderBottom:"1px solid var(--border)",display:"flex",justifyContent:"space-between",alignItems:"center" }} onMouseEnter={e=>e.currentTarget.style.background="var(--surface2)"} onMouseLeave={e=>e.currentTarget.style.background=""}><div><div style={{ fontSize:13,fontWeight:600 }}>{j.title}</div><div style={{ fontSize:11,color:"var(--text3)" }}>{j.customer_name} · {j.job_number}</div></div><Chip status={j.status} /></div>)}</>)}
            {results?.customers.length>0&&(<><div style={{ padding:"8px 14px 4px",fontSize:10,fontWeight:700,color:"var(--text4)",textTransform:"uppercase",letterSpacing:"0.08em" }}>Customers</div>{results.customers.map(c=><div key={c.id} onClick={()=>{navigate("/customers");setOpen(false);setQuery("");}} style={{ padding:"9px 14px",cursor:"pointer",borderBottom:"1px solid var(--border)",display:"flex",alignItems:"center",gap:10 }} onMouseEnter={e=>e.currentTarget.style.background="var(--surface2)"} onMouseLeave={e=>e.currentTarget.style.background=""}><div style={{ width:28,height:28,borderRadius:"50%",background:"var(--blue-lt)",border:"1px solid var(--blue-bd)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color:"var(--blue)",flexShrink:0 }}>{(c.first_name||"?")[0]}{(c.last_name||"")[0]}</div><div><div style={{ fontSize:13,fontWeight:600 }}>{c.first_name} {c.last_name}</div><div style={{ fontSize:11,color:"var(--text3)" }}>{c.phone||c.email||"No contact"}</div></div></div>)}</>)}
            {results?.wos.length>0&&(<><div style={{ padding:"8px 14px 4px",fontSize:10,fontWeight:700,color:"var(--text4)",textTransform:"uppercase",letterSpacing:"0.08em" }}>Work Orders</div>{results.wos.map(w=><div key={w.id} onClick={()=>{navigate("/invoices");setOpen(false);setQuery("");}} style={{ padding:"9px 14px",cursor:"pointer",borderBottom:"1px solid var(--border)",display:"flex",justifyContent:"space-between",alignItems:"center" }} onMouseEnter={e=>e.currentTarget.style.background="var(--surface2)"} onMouseLeave={e=>e.currentTarget.style.background=""}><div><div style={{ fontSize:13,fontWeight:600 }}>{w.complaint||"Work Order"}</div><div style={{ fontSize:11,color:"var(--text3)" }}>{w.customer} · WO#{w.wo}</div></div><span style={{ fontSize:13,fontWeight:700,color:"var(--green)" }}>{w.totalAmount?`$${w.totalAmount}`:""}</span></div>)}</>)}
          </div>
        )}
      </div>
      <div style={{ fontSize:11.5,color:"var(--text4)",fontFamily:"var(--mono)",whiteSpace:"nowrap",background:"var(--surface2)",padding:"4px 10px",borderRadius:6,border:"1px solid var(--border)",flexShrink:0 }}>{new Date().toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"})}</div>
    </div>
  );
}

function Dashboard() {
  const { user } = useAuth(); const { navigate } = useRouter(); const [stats,setStats]=useState(null); const [jobs,setJobs]=useState([]); const [loading,setLoading]=useState(true);
  async function load() {
    try { const [s,j,wo]=await Promise.all([apiFetch("/company/stats"),apiFetch("/jobs?limit=5"),apiFetch("/work-orders?limit=500").catch(()=>[])]); const woList=Array.isArray(wo)?wo:Array.isArray(wo?.data)?wo.data:[]; const now=new Date(); const revenueThisMonth=woList.filter(w=>{const d=new Date(w.created_at||w.saved_at||w.savedAt);return d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear();}).reduce((sum,w)=>sum+(parseFloat(w.total_amount||w.totalAmount)||0),0); setStats({...s,work_orders_count:woList.length,revenue_this_month:revenueThisMonth}); setJobs(Array.isArray(j)?j:[]); } catch(e){console.error(e);}
    setLoading(false);
  }
  useEffect(()=>{ load(); const interval=setInterval(load,60000); return()=>clearInterval(interval); },[]);
  if(loading) return <div style={{ flex:1,display:"flex",alignItems:"center",justifyContent:"center" }}><Spinner /></div>;
  const statCards=[{label:"Jobs Today",val:stats?.jobs_today??0,icon:"📅",color:"#3B6FFF",glow:"rgba(59,111,255,0.15)"},{label:"This Week",val:stats?.jobs_this_week??0,icon:"📆",color:"#8B5CF6",glow:"rgba(139,92,246,0.15)"},{label:"Revenue / Month",val:fmt$(stats?.revenue_this_month??0),icon:"💰",color:"#00C48C",glow:"rgba(0,196,140,0.15)"},{label:"Work Orders",val:stats?.work_orders_count??0,icon:"📋",color:"#F59E0B",glow:"rgba(245,158,11,0.15)"}];
  return (
    <div style={{ padding:"28px 28px",overflowY:"auto",flex:1,background:"var(--bg)" }}>
      <div className="fade-in" style={{ marginBottom:28 }}>
        <h2 style={{ fontSize:22,fontFamily:"var(--display)",fontWeight:700,marginBottom:4,letterSpacing:"-0.03em",color:"var(--text1)" }}>Good morning, {user?.name?.split(" ")[0]} 👋</h2>
        <p style={{ fontSize:13,color:"var(--text3)" }}>Here's what's happening at {user?.company?.name} today.</p>
      </div>
      <div style={{ display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:12,marginBottom:24 }}>
        {statCards.map((k,i)=>(
          <div key={i} className={`fade-in s${i+1}`} style={{ background:"var(--surface)",border:"1px solid var(--border)",borderRadius:14,padding:"16px 18px",position:"relative",overflow:"hidden" }}>
            <div style={{ position:"absolute",top:0,right:0,width:60,height:60,background:`radial-gradient(circle at top right,${k.glow},transparent 70%)`,pointerEvents:"none" }} />
            <div style={{ fontSize:10,color:"var(--text3)",fontWeight:600,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:10,fontFamily:"var(--sans)" }}>{k.label}</div>
            <div style={{ fontSize:22,fontFamily:"var(--mono)",fontWeight:600,color:k.color,lineHeight:1,letterSpacing:"-0.02em",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{k.val}</div>
          </div>
        ))}
      </div>
      <Card>
        <div style={{ padding:"18px 22px",display:"flex",justifyContent:"space-between",alignItems:"center",borderBottom:"1px solid var(--border)" }}>
          <h3 style={{ fontSize:14,fontWeight:600,fontFamily:"var(--display)",letterSpacing:"-0.01em" }}>Recent Jobs</h3>
          <Btn small variant="secondary" onClick={()=>navigate("/jobs")}>View all →</Btn>
        </div>
        {jobs.length===0?<EmptyState icon="🔧" title="No jobs yet" desc="Create your first job to get started" action={<Btn onClick={()=>navigate("/jobs")}>+ New Job</Btn>} />:(
          <table style={{ width:"100%",borderCollapse:"collapse" }}>
            <thead><tr>{["Job #","Title","Customer","Status"].map(h=><th key={h} style={{ padding:"10px 22px",textAlign:"left",fontSize:11,fontWeight:600,color:"var(--text4)",letterSpacing:"0.06em",textTransform:"uppercase",borderBottom:"1px solid var(--border)",background:"var(--surface2)" }}>{h}</th>)}</tr></thead>
            <tbody>{jobs.map(job=><tr key={job.id} style={{ borderBottom:"1px solid var(--border)",cursor:"pointer",transition:"background .1s" }} onMouseEnter={e=>e.currentTarget.style.background="var(--surface2)"} onMouseLeave={e=>e.currentTarget.style.background=""} onClick={()=>navigate("/jobs")}><td style={{ padding:"13px 22px",fontSize:12,fontFamily:"var(--mono)",color:"var(--text4)" }}>{job.job_number}</td><td style={{ padding:"13px 22px",fontSize:13,fontWeight:500,color:"var(--text1)" }}>{job.title}</td><td style={{ padding:"13px 22px",fontSize:13,color:"var(--text2)" }}>{job.customer_name}</td><td style={{ padding:"13px 22px" }}><Chip status={job.status} /></td></tr>)}</tbody>
          </table>
        )}
      </Card>
    </div>
  );
}

// ── MAINTENANCE CUSTOMERS ──
const MAINT_KEY = "fieldops_maintenance_customers";
function loadMaintenance() { try { return JSON.parse(localStorage.getItem(MAINT_KEY)||"[]"); } catch { return []; } }
function toggleMaintenance(id) {
  const list = loadMaintenance();
  const updated = list.includes(id) ? list.filter(x=>x!==id) : [...list, id];
  localStorage.setItem(MAINT_KEY, JSON.stringify(updated));
  return updated.includes(id);
}
function isMaintenance(id) { return loadMaintenance().includes(id); }

function CustomerDetail({ customer, onBack, onDelete }) {
  const { navigate } = useRouter(); const { setCurrentJob } = useJobContext();
  const [jobs,setJobs]=useState([]); const [notes,setNotes]=useState(customer.notes||""); const [editingNotes,setEditingNotes]=useState(false); const [savingNotes,setSavingNotes]=useState(false); const [loadingJobs,setLoadingJobs]=useState(true); const [tab,setTab]=useState("info"); const [workOrders,setWorkOrders]=useState([]); const [viewWO,setViewWO]=useState(null); const [detailJob,setDetailJob]=useState(null);
  const [maintenance,setMaintenance]=useState(()=>isMaintenance(customer.id));

  // Build equipment history from work orders
  const equipment = (() => {
    const units = {};
    workOrders.forEach(wo => {
      (wo.equipment||[]).filter(e=>e.make||e.model||e.serial).forEach(e => {
        const key = e.serial || `${e.make}-${e.model}-${e.location}`;
        if(!units[key]) units[key] = { ...e, services:[] };
        if(wo.complaint||wo.descriptionOfWork||wo.date) {
          units[key].services.push({ date:wo.date||wo.savedAt, complaint:wo.complaint, work:wo.descriptionOfWork, wo:wo.wo, tech:wo.technician, total:wo.totalAmount });
        }
      });
    });
    return Object.values(units).sort((a,b)=>(b.services.length)-(a.services.length));
  })();
  useEffect(()=>{ apiFetch(`/customers/${customer.id}/jobs`).then(d=>setJobs(Array.isArray(d)?d:[])).catch(()=>setJobs([])).finally(()=>setLoadingJobs(false)); const name=`${customer.first_name} ${customer.last_name}`; fetchWorkOrders(`&customer_id=${customer.id}`).then(all=>{const matched=all.filter(w=>w.customerId===customer.id||w.customer===name);setWorkOrders(matched);}); },[customer.id]);
  async function saveNotes(){setSavingNotes(true);try{await apiFetch(`/customers/${customer.id}`,{method:"PATCH",body:JSON.stringify({notes})});setEditingNotes(false);}catch(e){alert(e.message);}setSavingNotes(false);}
  const tabStyle=t=>({flex:1,padding:"10px 0",background:"none",border:"none",borderBottom:tab===t?"2px solid var(--blue)":"2px solid transparent",color:tab===t?"var(--blue)":"var(--text3)",fontSize:13,fontWeight:tab===t?700:400,cursor:"pointer",transition:"all .15s"});
  return (
    <div style={{ flex:1,display:"flex",flexDirection:"column",overflow:"hidden",background:"var(--bg)",position:"relative" }}>
      {detailJob&&<JobDetailModal job={detailJob} onClose={()=>setDetailJob(null)} />}
      {viewWO&&(
        <div style={{ position:"absolute",inset:0,background:"var(--bg)",zIndex:50,display:"flex",flexDirection:"column",overflow:"hidden" }}>
          <div style={{ background:"var(--surface)",borderBottom:"1px solid var(--border)",padding:"12px 16px",display:"flex",justifyContent:"space-between",alignItems:"center",flexShrink:0 }}>
            <button onClick={()=>setViewWO(null)} style={{ background:"none",border:"none",color:"var(--blue)",fontSize:14,fontWeight:600,cursor:"pointer",padding:0 }}>← Back</button>
            <div style={{ fontSize:14,fontWeight:700,fontFamily:"var(--display)" }}>Work Order — {viewWO.customer||"Customer"}</div>
            <div style={{ width:60 }} />
          </div>
          <div style={{ flex:1,overflowY:"auto",padding:16,display:"flex",flexDirection:"column",gap:12 }}>
            <Card style={{ padding:"14px 16px" }}><div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10 }}>{[["WO#",viewWO.wo],["Date",viewWO.date],["Customer",viewWO.customer],["Phone",viewWO.phone],["Complaint",viewWO.complaint],["Technician",viewWO.technician]].filter(([,v])=>v).map(([l,v])=>(<div key={l}><div style={{ fontSize:10,fontWeight:700,color:"var(--text3)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:2 }}>{l}</div><div style={{ fontSize:13 }}>{v}</div></div>))}</div></Card>
            {viewWO.descriptionOfWork&&<Card style={{ padding:"14px 16px" }}><div style={{ fontSize:10,fontWeight:700,color:"var(--text3)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:8 }}>Description of Work</div><div style={{ fontSize:13,lineHeight:1.7,whiteSpace:"pre-wrap" }}>{viewWO.descriptionOfWork}</div></Card>}
            {viewWO.materials?.some(m=>m.description)&&<Card style={{ padding:"14px 16px" }}><div style={{ fontSize:10,fontWeight:700,color:"var(--text3)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:10 }}>Materials</div><table style={{ width:"100%",borderCollapse:"collapse",fontSize:13 }}><thead><tr style={{ background:"var(--surface2)" }}>{["Qty","Description","Unit Price","Amount"].map(h=><th key={h} style={{ padding:"6px 10px",textAlign:"left",fontSize:11,fontWeight:600,color:"var(--text3)",borderBottom:"1px solid var(--border)" }}>{h}</th>)}</tr></thead><tbody>{viewWO.materials.filter(m=>m.description).map((m,i)=><tr key={i} style={{ borderBottom:"1px solid var(--border)" }}><td style={{ padding:"8px 10px" }}>{m.qty||"1"}</td><td style={{ padding:"8px 10px" }}>{m.description}</td><td style={{ padding:"8px 10px" }}>{m.unitPrice?`$${m.unitPrice}`:""}</td><td style={{ padding:"8px 10px",fontWeight:600,color:"var(--green)" }}>{m.amount?`$${m.amount}`:""}</td></tr>)}</tbody></table></Card>}
            <div style={{ display:"flex",justifyContent:"flex-end" }}><div style={{ background:"var(--blue-lt)",border:"1px solid var(--blue-bd)",borderRadius:10,padding:"14px 24px",textAlign:"right" }}><div style={{ fontSize:11,color:"var(--text3)",marginBottom:4,textTransform:"uppercase",letterSpacing:"0.08em" }}>Total Due</div><div style={{ fontSize:28,fontFamily:"var(--mono)",fontWeight:700,color:"var(--blue)" }}>{viewWO.totalAmount?`$${viewWO.totalAmount}`:"—"}</div></div></div>
          </div>
        </div>
      )}
      <div style={{ background:"var(--surface)",borderBottom:"1px solid var(--border)",flexShrink:0 }}>
        <div style={{ padding:"12px 16px" }}><button onClick={onBack} style={{ background:"none",border:"none",color:"var(--blue)",fontSize:14,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:4,padding:0 }}>← Customers</button></div>
        <div style={{ padding:"0 16px 16px",display:"flex",justifyContent:"space-between",alignItems:"flex-end" }}>
          <div>
            <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:4 }}>
              <h2 style={{ fontSize:22,fontFamily:"var(--display)",fontWeight:800 }}>{customer.first_name} {customer.last_name}</h2>
              {maintenance&&<span style={{ fontSize:11,fontWeight:700,background:"var(--green-lt)",color:"var(--green)",border:"1px solid var(--green-bd)",borderRadius:100,padding:"3px 10px",whiteSpace:"nowrap" }}>🔧 Maintenance</span>}
            </div>
            <div style={{ display:"flex",flexDirection:"column",gap:3 }}>{customer.phone&&<a href={`tel:${customer.phone}`} style={{ fontSize:13,color:"var(--blue)",textDecoration:"none",display:"flex",alignItems:"center",gap:5 }}>📞 {customer.phone}</a>}{customer.email&&<span style={{ fontSize:13,color:"var(--text3)" }}>✉ {customer.email}</span>}</div>
          </div>
          <div style={{ display:"flex",gap:8 }}>
            <button onClick={()=>{ const now=toggleMaintenance(customer.id); setMaintenance(now); }} style={{ fontSize:12,fontWeight:600,background:maintenance?"var(--green-lt)":"var(--surface2)",color:maintenance?"var(--green)":"var(--text3)",border:`1px solid ${maintenance?"var(--green-bd)":"var(--border)"}`,borderRadius:7,padding:"7px 14px",cursor:"pointer",transition:"all .15s" }}>{maintenance?"🔧 Maintenance ✓":"🔧 Add Maintenance"}</button>
            <button onClick={()=>{ const msg=encodeURIComponent(`Jayson is trying to get his Google reviews up. If you have time, would you mind leaving a Google review he would really appreciate it. Thanks - 405 Heating and Air Conditioning https://g.page/r/CVTRHVvrhBTBEBM/review`); const phone=(customer.phone||customer.cell||"").replace(/\D/g,""); if(phone){window.open(`sms:${phone}?body=${msg}`);}else{alert("No phone number for this customer.");} }} style={{ fontSize:12,fontWeight:600,background:"var(--green-lt)",color:"var(--green)",border:"1px solid var(--green-bd)",borderRadius:7,padding:"7px 14px",cursor:"pointer" }}>⭐ Request Review</button>
            <Btn small variant="danger" onClick={()=>onDelete(customer.id)}>Archive</Btn>
          </div>
        </div>
        <div style={{ display:"flex",borderTop:"1px solid var(--border)" }}>
          <button style={tabStyle("info")} onClick={()=>setTab("info")}>Info</button>
          <button style={tabStyle("notes")} onClick={()=>setTab("notes")}>📋 Notes</button>
          <button style={tabStyle("jobs")} onClick={()=>setTab("jobs")}>Jobs ({jobs.length})</button>
          <button style={tabStyle("equipment")} onClick={()=>setTab("equipment")}>🔩 Equipment ({equipment.length})</button>
          <button style={tabStyle("workorders")} onClick={()=>setTab("workorders")}>Work Orders ({workOrders.length})</button>
        </div>
      </div>
      <div style={{ flex:1,overflowY:"auto",padding:16 }}>
        {tab==="info"&&(<div style={{ display:"flex",flexDirection:"column",gap:12 }}><Card style={{ padding:"14px 16px" }}><div style={{ fontSize:10,fontWeight:700,color:"var(--text3)",letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:12,fontFamily:"var(--display)" }}>Contact Information</div>{[["Phone",customer.phone],["Email",customer.email],["Source",customer.source]].filter(([,v])=>v).map(([l,v])=><div key={l} style={{ display:"flex",gap:12,marginBottom:10,alignItems:"center" }}><span style={{ fontSize:12,color:"var(--text3)",width:60,flexShrink:0 }}>{l}</span>{l==="Phone"?<a href={`tel:${v}`} style={{ fontSize:13,fontWeight:500,color:"var(--blue)",textDecoration:"none" }}>{v}</a>:<span style={{ fontSize:13,fontWeight:500 }}>{v}</span>}</div>)}</Card><Card style={{ padding:"14px 16px" }}><div style={{ fontSize:10,fontWeight:700,color:"var(--text3)",letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:8,fontFamily:"var(--display)" }}>Stats</div><div style={{ display:"flex",gap:24 }}><div><div style={{ fontSize:28,fontFamily:"var(--mono)",fontWeight:700,color:"var(--blue)" }}>{customer.job_count||0}</div><div style={{ fontSize:11,color:"var(--text3)" }}>Total jobs</div></div></div></Card></div>)}
        {tab==="notes"&&(<div style={{ display:"flex",flexDirection:"column",gap:12 }}><Card style={{ padding:"14px 16px" }}><div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12 }}><div><div style={{ fontSize:10,fontWeight:700,color:"var(--text3)",letterSpacing:"0.08em",textTransform:"uppercase",fontFamily:"var(--display)" }}>Internal Notes</div><div style={{ fontSize:11,color:"var(--text3)",marginTop:2 }}>Visible to all techs</div></div>{!editingNotes&&<Btn small variant="secondary" onClick={()=>setEditingNotes(true)}>Edit</Btn>}</div>{editingNotes?(<><textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Gate code, dogs, access notes..." style={{ ...inputStyle,height:180,resize:"vertical",marginBottom:10 }} autoFocus /><div style={{ display:"flex",gap:8 }}><Btn small onClick={saveNotes} disabled={savingNotes}>{savingNotes?"Saving…":"Save Notes"}</Btn><Btn small variant="secondary" onClick={()=>{setEditingNotes(false);setNotes(customer.notes||"");}}>Cancel</Btn></div></>):notes?<p style={{ fontSize:14,color:"var(--text1)",lineHeight:1.7,whiteSpace:"pre-wrap" }}>{notes}</p>:<div style={{ fontSize:13,color:"var(--text4)",fontStyle:"italic",padding:"8px 0" }}>No notes yet.</div>}</Card></div>)}
        {tab==="jobs"&&(<div style={{ display:"flex",flexDirection:"column",gap:10 }}>{loadingJobs?<Spinner />:jobs.length===0?<EmptyState icon="🔧" title="No jobs yet" desc="No jobs found for this customer" />:jobs.map(job=>(<Card key={job.id} style={{ padding:"14px 16px" }}><div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6 }}><div><div style={{ fontSize:11,fontFamily:"var(--mono)",color:"var(--text3)",marginBottom:3 }}>{job.job_number}</div><div style={{ fontSize:15,fontWeight:700 }}>{job.title}</div></div><Chip status={job.status} /></div><div style={{ fontSize:12,color:"var(--text3)",marginBottom:10 }}>{job.scheduled_start?fmtDate(job.scheduled_start):"Not scheduled"}</div><div style={{ display:"flex",gap:6,flexWrap:"wrap" }}><Btn small variant="secondary" onClick={()=>setDetailJob(job)}>📝 Notes & Photos</Btn><Btn small variant="secondary" onClick={()=>{ setCurrentJob({customer:`${customer.first_name} ${customer.last_name}`,customerId:customer.id,jobId:job.id,phone:customer.phone||"",cell:"",email:customer.email||"",billingAddress:job.address_line1?`${job.address_line1}, ${job.city}, ${job.state} ${job.zip||""}`.trim():`${job.city||""}, ${job.state||""}`.trim(),complaint:job.title||"",workedBy:"",unitAddress:""}); navigate("/workorder"); }}>📋 Work Order</Btn></div></Card>))}</div>)}
        {tab==="workorders"&&(<div style={{ display:"flex",flexDirection:"column",gap:10 }}>{workOrders.length===0?<EmptyState icon="📋" title="No work orders yet" desc="Work orders created for this customer will appear here" />:workOrders.map(wo=>(<Card key={wo.id} style={{ padding:"14px 16px",cursor:"pointer" }} onClick={()=>setViewWO(wo)}><div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:4 }}><div><div style={{ fontSize:11,fontFamily:"var(--mono)",color:"var(--text3)",marginBottom:2 }}>WO# {wo.wo||"—"}</div><div style={{ fontSize:14,fontWeight:600 }}>{wo.complaint||"Work Order"}</div></div><div style={{ fontSize:16,fontFamily:"var(--mono)",fontWeight:700,color:"var(--green)" }}>{wo.totalAmount?`$${wo.totalAmount}`:"—"}</div></div><div style={{ fontSize:12,color:"var(--text3)" }}>{wo.date||"No date"} · {wo.technician||"No tech assigned"}</div></Card>))}</div>)}
        {tab==="equipment"&&(
          <div style={{ display:"flex",flexDirection:"column",gap:12 }}>
            {equipment.length===0?(
              <EmptyState icon="🔩" title="No equipment on file" desc="Equipment is pulled from submitted work orders. Complete a work order for this customer with unit details to see history here." />
            ):equipment.map((unit,i)=>(
              <Card key={i} style={{ overflow:"hidden" }}>
                {/* Unit header */}
                <div style={{ padding:"14px 16px",background:"var(--surface2)",borderBottom:"1px solid var(--border)",display:"flex",justifyContent:"space-between",alignItems:"flex-start" }}>
                  <div>
                    <div style={{ fontSize:15,fontWeight:700,fontFamily:"var(--display)",marginBottom:4 }}>
                      {[unit.make,unit.model].filter(Boolean).join(" ") || "Unknown Unit"}
                    </div>
                    <div style={{ display:"flex",gap:10,flexWrap:"wrap" }}>
                      {unit.serial&&<span style={{ fontSize:11,fontFamily:"var(--mono)",background:"var(--surface3)",border:"1px solid var(--border2)",borderRadius:4,padding:"2px 8px",color:"var(--text2)" }}>S/N: {unit.serial}</span>}
                      {unit.location&&<span style={{ fontSize:11,color:"var(--text3)" }}>📍 {unit.location}</span>}
                      {unit.area&&<span style={{ fontSize:11,color:"var(--text3)" }}>🏠 {unit.area}</span>}
                    </div>
                  </div>
                  <div style={{ textAlign:"right",flexShrink:0 }}>
                    <div style={{ fontSize:11,color:"var(--text3)",marginBottom:2 }}>Service calls</div>
                    <div style={{ fontSize:22,fontFamily:"var(--mono)",fontWeight:700,color:"var(--blue)" }}>{unit.services.length}</div>
                  </div>
                </div>
                {/* Service history */}
                {unit.services.length>0&&(
                  <div style={{ padding:"10px 16px",display:"flex",flexDirection:"column",gap:8 }}>
                    <div style={{ fontSize:10,fontWeight:700,color:"var(--text4)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:2 }}>Service History</div>
                    {unit.services.sort((a,b)=>new Date(b.date||0)-new Date(a.date||0)).map((svc,j)=>(
                      <div key={j} style={{ background:"var(--surface2)",border:"1px solid var(--border)",borderRadius:8,padding:"10px 12px",display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12 }}>
                        <div style={{ flex:1,minWidth:0 }}>
                          <div style={{ fontSize:13,fontWeight:600,marginBottom:3 }}>{svc.complaint||svc.work||"Service"}</div>
                          {svc.work&&svc.complaint&&<div style={{ fontSize:12,color:"var(--text3)",marginBottom:3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{svc.work}</div>}
                          <div style={{ display:"flex",gap:10,fontSize:11,color:"var(--text3)",flexWrap:"wrap" }}>
                            {svc.date&&<span>📅 {fmtDate(svc.date)}</span>}
                            {svc.tech&&<span>👷 {svc.tech}</span>}
                            {svc.wo&&<span style={{ fontFamily:"var(--mono)" }}>WO#{svc.wo}</span>}
                          </div>
                        </div>
                        {svc.total&&<div style={{ fontSize:14,fontFamily:"var(--mono)",fontWeight:700,color:"var(--green)",flexShrink:0 }}>${svc.total}</div>}
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CustomersScreen() {
  const [list,setList]=useState([]); const [loading,setLoading]=useState(true); const [search,setSearch]=useState(""); const [selected,setSelected]=useState(null); const [showNew,setShowNew]=useState(false);
  async function load(){setLoading(true);try{const d=await apiFetch(`/customers?limit=100${search?`&search=${encodeURIComponent(search)}`:""}`);setList(Array.isArray(d)?d:[]);}catch(e){console.error(e);}setLoading(false);}
  useEffect(()=>{load();},[search]);
  async function handleDelete(id){if(!window.confirm("Archive this customer?"))return;try{await apiFetch(`/customers/${id}`,{method:"DELETE"});setList(p=>p.filter(c=>c.id!==id));setSelected(null);}catch(e){alert(e.message);}}
  if(selected) return <CustomerDetail customer={selected} onBack={()=>setSelected(null)} onDelete={handleDelete} />;
  return (
    <div style={{ flex:1,display:"flex",flexDirection:"column",overflow:"hidden" }}>
      {showNew&&<NewCustomerModal onClose={()=>setShowNew(false)} onSave={async c=>{setList(p=>[c,...p]);setSelected(c);setShowNew(false);}} />}
      <div style={{ padding:"12px 16px",borderBottom:"1px solid var(--border)",background:"var(--surface)",flexShrink:0 }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10 }}><span style={{ fontSize:16,fontFamily:"var(--display)",fontWeight:700 }}>Customers</span><Btn small onClick={()=>setShowNew(true)}>+ New</Btn></div>
        <div style={{ position:"relative" }}><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search name, phone…" style={{ ...inputStyle,paddingLeft:28 }} /><span style={{ position:"absolute",left:9,top:"50%",transform:"translateY(-50%)",color:"var(--text3)",fontSize:12 }}>⌕</span></div>
      </div>
      <div style={{ flex:1,overflowY:"auto" }}>
        {loading?<Spinner />:list.length===0?<EmptyState icon="👥" title="No customers yet" desc="Add your first customer" action={<Btn onClick={()=>setShowNew(true)}>+ New Customer</Btn>} />:list.map(c=><div key={c.id} style={{ padding:"14px 16px",borderBottom:"1px solid var(--border)",display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,transition:"background .1s" }} onMouseEnter={e=>e.currentTarget.style.background="var(--surface2)"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
          <div onClick={()=>setSelected(c)} style={{ flex:1,cursor:"pointer",minWidth:0 }}>
            <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:3,flexWrap:"wrap" }}>
              <span style={{ fontSize:14,fontWeight:600 }}>{c.first_name} {c.last_name}</span>
              {isMaintenance(c.id)&&<span style={{ fontSize:10,fontWeight:700,background:"var(--green-lt)",color:"var(--green)",border:"1px solid var(--green-bd)",borderRadius:100,padding:"1px 8px",whiteSpace:"nowrap" }}>🔧 Maintenance</span>}
            </div>
            <div style={{ display:"flex",alignItems:"center",gap:8,flexWrap:"wrap" }}>
              {c.phone&&<a href={`tel:${c.phone}`} onClick={e=>e.stopPropagation()} style={{ fontSize:12,color:"var(--blue)",textDecoration:"none",display:"flex",alignItems:"center",gap:3 }}>📞 {c.phone}</a>}
              {!c.phone&&c.email&&<span style={{ fontSize:12,color:"var(--text3)" }}>{c.email}</span>}
              {(c.job_count||0)>0&&<span style={{ fontSize:11,fontWeight:600,background:"var(--blue-lt)",color:"var(--blue)",border:"1px solid var(--blue-bd)",borderRadius:100,padding:"1px 8px" }}>{c.job_count} job{c.job_count!==1?"s":""}</span>}
            </div>
          </div>
          <div style={{ display:"flex",gap:8,alignItems:"center",flexShrink:0 }}>
            <button onClick={e=>{e.stopPropagation();const msg=encodeURIComponent(`Jayson is trying to get his Google reviews up. If you have time, would you mind leaving a Google review he would really appreciate it. Thanks - 405 Heating and Air Conditioning https://g.page/r/CVTRHVvrhBTBEBM/review`);const phone=(c.phone||c.cell||"").replace(/\D/g,"");if(phone){window.open(`sms:${phone}?body=${msg}`);}else{alert("No phone number for this customer.");}}} style={{ fontSize:11,fontWeight:600,background:"var(--green-lt)",color:"var(--green)",border:"1px solid var(--green-bd)",borderRadius:6,padding:"4px 10px",cursor:"pointer",whiteSpace:"nowrap" }}>⭐ Review</button>
            <span onClick={()=>setSelected(c)} style={{ color:"var(--text4)",fontSize:16,cursor:"pointer" }}>›</span>
          </div>
        </div>)}
      </div>
    </div>
  );
}

function NewCustomerModal({ onClose, onSave }) {
  const [form,setForm]=useState({first_name:"",last_name:"",email:"",phone:"",notes:"",source:"",location:{address_line1:"",city:"",state:"OK",zip:"",access_notes:""}});
  function set(k,v){setForm(p=>({...p,[k]:v}));} function setLoc(k,v){setForm(p=>({...p,location:{...p.location,[k]:v}}));}
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
      <div style={{ padding:"16px 24px",borderTop:"1px solid var(--border)",display:"flex",justifyContent:"flex-end",gap:10 }}><Btn variant="secondary" onClick={onClose}>Cancel</Btn><Btn onClick={()=>{if(!form.first_name||!form.last_name){alert("First and last name required");return;}const loc=form.location.address_line1?form.location:undefined;onSave({...form,location:loc});}}>Save Customer</Btn></div>
    </Modal>
  );
}

// ── SCHEDULE JOB MODAL ──
function ScheduleJobModal({ job, onClose, onScheduled }) {
  // Pre-fill with existing scheduled time if rescheduling
  const existing = job.scheduled_start
    ? new Date(job.scheduled_start).toISOString().slice(0,16)
    : (() => {
        // default to tomorrow 8am
        const d = new Date();
        d.setDate(d.getDate()+1);
        d.setHours(8,0,0,0);
        return d.toISOString().slice(0,16);
      })();

  const [dateTime, setDateTime] = useState(existing);
  const [saving, setSaving] = useState(false);
  const isReschedule = !!job.scheduled_start;

  async function handleSave() {
    if (!dateTime) { alert("Please pick a date and time"); return; }
    setSaving(true);
    try {
      await apiFetch(`/jobs/${job.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          scheduled_start: new Date(dateTime).toISOString(),
          status: job.status === "unscheduled" || !job.status ? "scheduled" : job.status,
        })
      });
      onScheduled({ ...job, scheduled_start: new Date(dateTime).toISOString(), status: job.status === "unscheduled" || !job.status ? "scheduled" : job.status });
    } catch(e) { alert(e.message); }
    setSaving(false);
  }

  // Format preview
  const preview = dateTime
    ? new Date(dateTime).toLocaleString("en-US", { weekday:"long", month:"long", day:"numeric", year:"numeric", hour:"numeric", minute:"2-digit" })
    : null;

  return (
    <Modal title={isReschedule ? "Reschedule Job" : "Schedule Job"} onClose={onClose} width={420}>
      <div style={{ padding:"24px" }}>
        {/* Job info */}
        <div style={{ background:"var(--surface2)",border:"1px solid var(--border)",borderRadius:10,padding:"12px 14px",marginBottom:20 }}>
          <div style={{ fontSize:11,fontFamily:"var(--mono)",color:"var(--text3)",marginBottom:3 }}>{job.job_number}</div>
          <div style={{ fontSize:15,fontWeight:700,marginBottom:2 }}>{job.title}</div>
          <div style={{ fontSize:13,color:"var(--text3)" }}>{job.customer_name}</div>
        </div>

        <FormField label="Date & Time">
          <input
            style={{ ...inputStyle, fontSize:14, padding:"11px 14px" }}
            type="datetime-local"
            value={dateTime}
            onChange={e=>setDateTime(e.target.value)}
          />
        </FormField>

        {preview && (
          <div style={{ marginTop:12,background:"var(--blue-lt)",border:"1px solid var(--blue-bd)",borderRadius:8,padding:"10px 14px",fontSize:13,color:"var(--blue)",fontWeight:600,display:"flex",alignItems:"center",gap:8 }}>
            <span>📅</span> {preview}
          </div>
        )}

        {isReschedule && (
          <div style={{ marginTop:10,fontSize:12,color:"var(--text3)" }}>
            Currently: {new Date(job.scheduled_start).toLocaleString("en-US",{weekday:"short",month:"short",day:"numeric",hour:"numeric",minute:"2-digit"})}
          </div>
        )}
      </div>
      <div style={{ padding:"16px 24px",borderTop:"1px solid var(--border)",display:"flex",justifyContent:"flex-end",gap:10 }}>
        <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
        <Btn onClick={handleSave} disabled={saving || !dateTime}>
          {saving ? "Saving…" : isReschedule ? "Reschedule" : "Schedule Job"}
        </Btn>
      </div>
    </Modal>
  );
}function JobsScreen() {
  const { navigate } = useRouter();
  const { setCurrentJob } = useJobContext();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [showNew, setShowNew] = useState(false);
  const [detailJob, setDetailJob] = useState(null);
  const [scheduleJob, setScheduleJob] = useState(null); // NEW: job being scheduled

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

  // Format scheduled time nicely: "Mon Jan 6 · 2:00 PM"
  function fmtScheduled(iso) {
    if (!iso) return null;
    const d = new Date(iso);
    const date = d.toLocaleDateString("en-US", { weekday:"short", month:"short", day:"numeric" });
    const time = d.toLocaleTimeString("en-US", { hour:"numeric", minute:"2-digit" });
    return `${date} · ${time}`;
  }

  const isUnscheduled = (job) => !job.scheduled_start || job.status === "unscheduled";
  const isOverdue = (job) => {
    if(job.status==="completed"||job.status==="cancelled") return false;
    if(!job.scheduled_start) return false;
    return new Date(job.scheduled_start) < new Date() && job.status!=="in_progress" && job.status!=="en_route";
  };

  return (
    <div style={{ flex:1,display:"flex",flexDirection:"column",overflow:"hidden" }}>
      {showNew&&<NewJobModal onClose={()=>setShowNew(false)} onSave={async(job)=>{setJobs(p=>[job,...p]);setShowNew(false);}} />}
      {detailJob&&<JobDetailModal job={detailJob} onClose={()=>setDetailJob(null)} />}
      {scheduleJob&&(
        <ScheduleJobModal
          job={scheduleJob}
          onClose={()=>setScheduleJob(null)}
          onScheduled={updatedJob=>{
            setJobs(p=>p.map(j=>j.id===updatedJob.id?{...j,...updatedJob}:j));
            setScheduleJob(null);
          }}
        />
      )}
      <div style={{ padding:"12px 20px",background:"var(--surface)",borderBottom:"1px solid var(--border)",display:"flex",gap:8,alignItems:"center" }}>
        <div style={{ display:"flex",gap:4,flexWrap:"wrap" }}>{["all","unscheduled","scheduled","in_progress","en_route","completed"].map(s=><button key={s} onClick={()=>setFilterStatus(s)} style={{ fontSize:11,padding:"4px 10px",borderRadius:100,background:filterStatus===s?"var(--blue)":"var(--surface2)",color:filterStatus===s?"#fff":"var(--text3)",border:filterStatus===s?"none":"1px solid var(--border)",cursor:"pointer",textTransform:"capitalize",fontWeight:filterStatus===s?600:400 }}>{s==="all"?"All":STATUS_CFG[s]?.label||s}</button>)}</div>
        <div style={{ marginLeft:"auto" }}><Btn small onClick={()=>setShowNew(true)}>+ New Job</Btn></div>
      </div>
      <div style={{ flex:1,overflowY:"auto",padding:16 }}>
        {loading?<Spinner />:jobs.length===0?<EmptyState icon="🔧" title="No jobs yet" desc="Create your first job to get started" action={<Btn onClick={()=>setShowNew(true)}>+ New Job</Btn>} />:(
          <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
            {jobs.map(job=>{
              const scheduled = fmtScheduled(job.scheduled_start);
              const unscheduled = isUnscheduled(job);
              const overdue = isOverdue(job);
              return (
                <Card key={job.id} style={{ padding:"14px 18px",borderLeft:overdue?"3px solid var(--red)":undefined }}>
                  <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8 }}>
                    <div>
                      <div style={{ fontSize:11,fontFamily:"var(--mono)",color:"var(--text3)",marginBottom:3 }}>{job.job_number}</div>
                      <div style={{ fontSize:16,fontWeight:700,fontFamily:"var(--display)" }}>{job.title}</div>
                    </div>
                    <div style={{ display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4 }}>
                      <Chip status={job.status} />
                      {overdue&&<span style={{ fontSize:10,fontWeight:700,color:"var(--red)",background:"var(--red-lt)",border:"1px solid var(--red-bd)",borderRadius:4,padding:"2px 7px",letterSpacing:"0.04em" }}>⚠ OVERDUE</span>}
                    </div>
                  </div>

                  <div style={{ display:"flex",gap:16,fontSize:13,color:"var(--text2)",flexWrap:"wrap",marginBottom:6 }}>
                    <span>👤 {job.customer_name}{job.customer_job_count>1?<span style={{ marginLeft:6,fontSize:11,background:"var(--surface2)",border:"1px solid var(--border2)",borderRadius:100,padding:"1px 7px",color:"var(--text3)",fontWeight:600 }}>{job.customer_job_count} visits</span>:null}</span>
                    {job.customer_phone&&<a href={`tel:${job.customer_phone}`} onClick={e=>e.stopPropagation()} style={{ color:"var(--blue)",textDecoration:"none",fontSize:13,display:"flex",alignItems:"center",gap:3 }}>📞 {job.customer_phone}</a>}
                    <span style={{ cursor:"pointer",color:"var(--blue)" }} onClick={e=>{e.stopPropagation();window.open(`https://maps.google.com/?q=${encodeURIComponent(job.address_line1?`${job.address_line1}, ${job.city}, ${job.state}`:`${job.city}, ${job.state}`)}`)}}>
                      📍 {job.address_line1?`${job.address_line1}, ${job.city}, ${job.state}`:`${job.city}, ${job.state}`}
                    </span>
                  </div>
                  {job.priority&&job.priority!=="normal"&&<div style={{ display:"inline-flex",alignItems:"center",gap:5,background:job.priority==="urgent"?"var(--red-lt)":job.priority==="high"?"var(--amber-lt)":"var(--surface2)",border:`1px solid ${job.priority==="urgent"?"var(--red-bd)":job.priority==="high"?"var(--amber-bd)":"var(--border)"}`,borderRadius:6,padding:"2px 8px",fontSize:11,fontWeight:600,color:job.priority==="urgent"?"var(--red)":job.priority==="high"?"var(--amber)":"var(--text3)",marginBottom:6 }}>{job.priority==="urgent"?"🔴":job.priority==="high"?"🟡":"⚪"} {job.priority.charAt(0).toUpperCase()+job.priority.slice(1)} Priority</div>}

                  {/* Scheduled time display */}
                  {scheduled ? (
                    <div style={{ display:"inline-flex",alignItems:"center",gap:6,background:"var(--blue-lt)",border:"1px solid var(--blue-bd)",borderRadius:6,padding:"4px 10px",fontSize:12,fontWeight:600,color:"var(--blue)",marginBottom:10 }}>
                      <span>📅</span> {scheduled}
                    </div>
                  ) : (
                    <div style={{ display:"inline-flex",alignItems:"center",gap:6,background:"var(--amber-lt)",border:"1px solid var(--amber-bd)",borderRadius:6,padding:"4px 10px",fontSize:12,fontWeight:600,color:"var(--amber)",marginBottom:10 }}>
                      <span>⏳</span> Not scheduled
                    </div>
                  )}

                  <div style={{ display:"flex",gap:6,flexWrap:"wrap" }}>
                    {/* Schedule / Reschedule button */}
                    {job.status!=="completed"&&job.status!=="cancelled"&&(
                      unscheduled
                        ? <Btn small variant="secondary" onClick={()=>setScheduleJob(job)}>📅 Schedule</Btn>
                        : <Btn small variant="secondary" onClick={()=>setScheduleJob(job)}>🕐 Reschedule</Btn>
                    )}

                    {job.status==="scheduled"&&<Btn small variant="secondary" onClick={()=>handleStatusChange(job.id,"en_route")}>→ En Route</Btn>}
                    {job.status==="scheduled"&&<Btn small variant="secondary" onClick={async()=>{
                      try {
                        const c = await apiFetch(`/customers/${job.customer_id}`);
                        const phone = c?.phone || c?.cell;
                        if (!phone) { alert("No phone number on file for this customer."); return; }
                        window.open(`sms:${phone}?body=${encodeURIComponent(`Hi ${job.customer_name}, your 405 Heating & Air technician is on the way! They should arrive shortly. Call us at 405-215-7685 with any questions.`)}`);
                      } catch { alert("Could not load customer phone."); }
                    }}>📱 Notify</Btn>}
                    {job.status==="en_route"&&<Btn small variant="secondary" onClick={()=>handleStatusChange(job.id,"in_progress")}>→ Start Job</Btn>}
                    {job.status==="in_progress"&&<Btn small onClick={()=>handleStatusChange(job.id,"completed")}>✓ Complete</Btn>}
                    <Btn small variant="secondary" onClick={()=>setDetailJob(job)}>📝 Notes & Photos</Btn>
                    <Btn small variant="secondary" onClick={()=>openWorkOrder(job)}>📋 Work Order</Btn>
                    {job.status!=="completed"&&job.status!=="cancelled"&&<AssignTechBtn job={job} onAssigned={load} />}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── JOB TEMPLATES ──
const TEMPLATES_KEY = "fieldops_job_templates";
const DEFAULT_TEMPLATES = [
  { id:"t1", name:"AC Tune-Up", icon:"❄️", title:"AC Tune-Up & Inspection", description:"Annual air conditioning tune-up and inspection. Check refrigerant, clean coils, inspect electrical components.", priority:"normal" },
  { id:"t2", name:"Heating Tune-Up", icon:"🔥", title:"Heating Tune-Up & Inspection", description:"Annual heating system tune-up and inspection. Check heat exchanger, burners, igniter, safety controls, and filter.", priority:"normal" },
  { id:"t3", name:"AC Not Cooling", icon:"🌡️", title:"AC Not Cooling", description:"Customer reports AC unit is running but not cooling. Check refrigerant charge, airflow, and thermostat.", priority:"high" },
  { id:"t4", name:"No Heat", icon:"🧊", title:"No Heat — Furnace Not Working", description:"Customer has no heat. Diagnose furnace failure — check igniter, gas valve, pressure switches, and control board.", priority:"urgent" },
  { id:"t5", name:"New Install", icon:"🏗️", title:"New System Installation", description:"New HVAC system installation. Includes equipment delivery, installation, startup, and customer walkthrough.", priority:"normal" },
  { id:"t6", name:"Service Call", icon:"🔧", title:"Service Call", description:"General service call. Diagnose and repair reported issue.", priority:"normal" },
];
function loadTemplates() {
  try { const saved = JSON.parse(localStorage.getItem(TEMPLATES_KEY)||"null"); return saved || DEFAULT_TEMPLATES; } catch { return DEFAULT_TEMPLATES; }
}
function saveTemplates(list) { try { localStorage.setItem(TEMPLATES_KEY, JSON.stringify(list)); } catch {} }

function NewJobModal({ onClose, onSave }) {
  const [customers, setCustomers] = useState([]);
  const [form, setForm] = useState({ customer_id:"", location_id:"", title:"", description:"", priority:"normal", scheduled_start:"" });
  const [locations, setLocations] = useState([]);
  const [step, setStep] = useState("template"); // "template" | "form"
  const templates = loadTemplates();

  useEffect(()=>{apiFetch("/customers?limit=100").then(d=>setCustomers(Array.isArray(d)?d:[])).catch(()=>{});},[]);

  async function handleCustomerChange(id) {
    setForm(p=>({...p,customer_id:id,location_id:""}));
    if(id){try{const cust=await apiFetch(`/customers/${id}`);setLocations(cust.locations||[]);if(cust.locations?.length===1)setForm(p=>({...p,location_id:cust.locations[0].id}));}catch(e){}}
  }

  function applyTemplate(t) {
    setForm(p=>({...p, title:t.title, description:t.description, priority:t.priority}));
    setStep("form");
  }

  async function handleSave() {
    if(!form.customer_id||!form.location_id||!form.title){alert("Customer, location and title required");return;}
    try {
      const payload={customer_id:form.customer_id,location_id:form.location_id,title:form.title,description:form.description||"",priority:form.priority||"normal",technician_ids:[]};
      if(form.scheduled_start) payload.scheduled_start=new Date(form.scheduled_start).toISOString();
      const job=await apiFetch("/jobs",{method:"POST",body:JSON.stringify(payload)});
      onSave(job);
    }catch(e){alert(e.message);}
  }

  if(step==="template") return (
    <Modal title="New Job" onClose={onClose} width={560}>
      <div style={{ padding:"16px 24px 8px" }}>
        <div style={{ fontSize:13,color:"var(--text3)",marginBottom:14 }}>Start from a template or create from scratch:</div>
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12 }}>
          {templates.map(t=>(
            <button key={t.id} onClick={()=>applyTemplate(t)} style={{ background:"var(--surface2)",border:"1px solid var(--border2)",borderRadius:10,padding:"12px 14px",cursor:"pointer",textAlign:"left",transition:"all .15s",display:"flex",gap:10,alignItems:"center" }}
              onMouseEnter={e=>{e.currentTarget.style.background="var(--surface3)";e.currentTarget.style.borderColor="var(--blue-bd)";}}
              onMouseLeave={e=>{e.currentTarget.style.background="var(--surface2)";e.currentTarget.style.borderColor="var(--border2)";}}>
              <span style={{ fontSize:22,lineHeight:1,flexShrink:0 }}>{t.icon}</span>
              <span style={{ fontSize:13,fontWeight:600,color:"var(--text1)" }}>{t.name}</span>
            </button>
          ))}
        </div>
      </div>
      <div style={{ padding:"12px 24px",borderTop:"1px solid var(--border)",display:"flex",justifyContent:"space-between",alignItems:"center" }}>
        <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
        <Btn variant="secondary" onClick={()=>setStep("form")}>✏️ Blank Job</Btn>
      </div>
    </Modal>
  );

  return (
    <Modal title="New Job" onClose={onClose}>
      <div style={{ padding:"8px 24px 0",borderBottom:"1px solid var(--border)",marginBottom:0 }}>
        <button onClick={()=>setStep("template")} style={{ background:"none",border:"none",color:"var(--blue)",fontSize:12,cursor:"pointer",padding:"4px 0 10px",display:"flex",alignItems:"center",gap:4 }}>← Templates</button>
      </div>
      <div style={{ padding:"16px 24px",display:"flex",flexDirection:"column",gap:14 }}>
        <FormField label="Customer *"><select style={inputStyle} value={form.customer_id} onChange={e=>handleCustomerChange(e.target.value)}><option value="">Select customer…</option>{customers.map(c=><option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>)}</select></FormField>
        {locations.length>0&&<FormField label="Location *"><select style={inputStyle} value={form.location_id} onChange={e=>setForm(p=>({...p,location_id:e.target.value}))}><option value="">Select location…</option>{locations.map(l=><option key={l.id} value={l.id}>{l.address_line1}, {l.city}</option>)}</select></FormField>}
        <FormField label="Job Title *"><input style={inputStyle} value={form.title} onChange={e=>setForm(p=>({...p,title:e.target.value}))} placeholder="e.g. AC Not Cooling" /></FormField>
        <FormField label="Description"><textarea style={{...inputStyle,height:80,resize:"vertical"}} value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))} placeholder="Describe the issue…" /></FormField>
        <FormField label="Priority"><select style={inputStyle} value={form.priority} onChange={e=>setForm(p=>({...p,priority:e.target.value}))}>{["low","normal","high","urgent"].map(p=><option key={p} value={p}>{p.charAt(0).toUpperCase()+p.slice(1)}</option>)}</select></FormField>
        <FormField label="Scheduled Time (optional)">
          <input style={inputStyle} type="datetime-local" value={form.scheduled_start} onChange={e=>setForm(p=>({...p,scheduled_start:e.target.value}))} />
        </FormField>
      </div>
      <div style={{ padding:"16px 24px",borderTop:"1px solid var(--border)",display:"flex",justifyContent:"flex-end",gap:10 }}><Btn variant="secondary" onClick={onClose}>Cancel</Btn><Btn onClick={handleSave}>Create Job</Btn></div>
    </Modal>
  );
}

// ── QUICK NOTE MODAL ──
function QuickNoteModal({ job, onClose, onSaved }) {
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  async function handleSave() {
    if(!note.trim()) return;
    setSaving(true);
    try {
      await apiFetch(`/jobs/${job.id}/notes`, { method:"POST", body:JSON.stringify({ content:note.trim(), note_type:"general" }) });
      if(onSaved) onSaved();
      onClose();
    } catch(e) { alert(e.message); }
    setSaving(false);
  }
  return (
    <Modal title={`Quick Note — ${job.title}`} onClose={onClose} width={460}>
      <div style={{ padding:"18px 24px",display:"flex",flexDirection:"column",gap:12 }}>
        <div style={{ fontSize:12,color:"var(--text3)" }}>{job.customer_name}</div>
        <textarea autoFocus value={note} onChange={e=>setNote(e.target.value)} placeholder="Add a note…" style={{ ...inputStyle,height:110,resize:"vertical" }} onKeyDown={e=>{ if(e.key==="Enter"&&e.metaKey) handleSave(); }} />
        <div style={{ fontSize:11,color:"var(--text4)" }}>⌘↩ to save</div>
      </div>
      <div style={{ padding:"14px 24px",borderTop:"1px solid var(--border)",display:"flex",justifyContent:"flex-end",gap:10 }}>
        <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
        <Btn onClick={handleSave} disabled={saving||!note.trim()}>{saving?"Saving…":"Add Note"}</Btn>
      </div>
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
  const [view, setView] = useState("list");
  const [weekJobs, setWeekJobs] = useState([]);
  const [weekLoading, setWeekLoading] = useState(false);
  const [quickNoteJob, setQuickNoteJob] = useState(null);

  useEffect(()=>{apiFetch("/users?limit=100").then(d=>setTechs(Array.isArray(d)?d:[])).catch(()=>{});},[]);
  useEffect(()=>{ setLoading(true); apiFetch(`/dispatch?date=${date}`).then(d=>setData(d)).catch(()=>setData({technicians:[],unassigned:[]})).finally(()=>setLoading(false)); },[date]);
  useEffect(()=>{
    if(view!=="calendar") return;
    setWeekLoading(true);
    const mon = getWeekStart(date);
    const days = Array.from({length:7},(_,i)=>{ const d=new Date(mon); d.setDate(d.getDate()+i); return d.toISOString().slice(0,10); });
    Promise.all(days.map(d=>apiFetch(`/dispatch?date=${d}`).catch(()=>({technicians:[],unassigned:[]}))))
      .then(results=>{ const all=[]; results.forEach((r,i)=>{ const d=days[i]; (r.technicians||[]).forEach(tech=>(tech.jobs||[]).forEach(job=>all.push({...job,_date:d,_tech:tech.name}))); (r.unassigned||[]).forEach(job=>all.push({...job,_date:d,_tech:null})); }); setWeekJobs(all); }).finally(()=>setWeekLoading(false));
  },[view, date]);

  function getWeekStart(dateStr) { const d=new Date(dateStr); const day=d.getDay(); const diff=d.getDate()-day+(day===0?-6:1); return new Date(d.setDate(diff)); }
  function getWeekDays() { const mon=getWeekStart(date); return Array.from({length:7},(_,i)=>{ const d=new Date(mon); d.setDate(d.getDate()+i); return { date:d.toISOString().slice(0,10), label:d.toLocaleDateString("en-US",{weekday:"short"}), day:d.getDate(), isToday:d.toISOString().slice(0,10)===new Date().toISOString().slice(0,10) }; }); }
  function prevWeek() { const d=new Date(date); d.setDate(d.getDate()-7); setDate(d.toISOString().slice(0,10)); }
  function nextWeek() { const d=new Date(date); d.setDate(d.getDate()+7); setDate(d.toISOString().slice(0,10)); }
  async function assignTech(jobId, techId) {
    if(!techId)return; setAssigning(p=>({...p,[jobId]:true}));
    try{await apiFetch(`/jobs/${jobId}`,{method:"PATCH",body:JSON.stringify({technician_ids:[techId]})});const d=await apiFetch(`/dispatch?date=${date}`);setData(d);}catch(e){alert(e.message);}
    setAssigning(p=>({...p,[jobId]:false}));
  }

  const dispatchTechs=data?.technicians||[], unassigned=data?.unassigned||[], weekDays=getWeekDays();
  const STATUS_COLORS={scheduled:"#2563EB",in_progress:"#D97706",en_route:"#7C3AED",completed:"#0D7B4E",cancelled:"#6B7280",on_hold:"#DC2626"};

  return (
    <div style={{ flex:1,display:"flex",flexDirection:"column",overflow:"hidden" }}>
      {quickNoteJob&&<QuickNoteModal job={quickNoteJob} onClose={()=>setQuickNoteJob(null)} onSaved={()=>setQuickNoteJob(null)} />}
      <div style={{ padding:"12px 20px",background:"var(--surface)",borderBottom:"1px solid var(--border)",display:"flex",gap:12,alignItems:"center",flexWrap:"wrap" }}>
        {view==="calendar" ? (
          <div style={{ display:"flex",alignItems:"center",gap:8 }}>
            <button onClick={prevWeek} style={{ background:"var(--surface2)",border:"1px solid var(--border)",borderRadius:6,padding:"5px 10px",cursor:"pointer",fontSize:14 }}>‹</button>
            <span style={{ fontSize:13,fontWeight:600,minWidth:160,textAlign:"center" }}>{weekDays[0]&&new Date(weekDays[0].date+"T12:00:00").toLocaleDateString("en-US",{month:"short",day:"numeric"})} — {weekDays[6]&&new Date(weekDays[6].date+"T12:00:00").toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}</span>
            <button onClick={nextWeek} style={{ background:"var(--surface2)",border:"1px solid var(--border)",borderRadius:6,padding:"5px 10px",cursor:"pointer",fontSize:14 }}>›</button>
            <button onClick={()=>setDate(new Date().toISOString().slice(0,10))} style={{ background:"none",border:"1px solid var(--border)",borderRadius:6,padding:"5px 10px",cursor:"pointer",fontSize:12,color:"var(--blue)" }}>Today</button>
          </div>
        ) : (<><input type="date" value={date} onChange={e=>setDate(e.target.value)} style={{ ...inputStyle,width:"auto",padding:"6px 10px" }} />{!loading&&<span style={{ fontSize:13,color:"var(--text3)" }}>{dispatchTechs.length} tech{dispatchTechs.length!==1?"s":""} · {unassigned.length} unassigned</span>}</>)}
        <div style={{ marginLeft:"auto",display:"flex",gap:4 }}>{["list","calendar"].map(v=><button key={v} onClick={()=>setView(v)} style={{ padding:"6px 14px",borderRadius:7,border:"1px solid var(--border)",background:view===v?"var(--blue)":"var(--surface2)",color:view===v?"#fff":"var(--text3)",fontSize:12,fontWeight:view===v?600:400,cursor:"pointer" }}>{v==="list"?"📋 List":"📅 Calendar"}</button>)}</div>
      </div>
      {view==="calendar"&&(
        <div style={{ flex:1,overflowY:"auto",padding:16 }}>
          {weekLoading?<Spinner />:(
            <div style={{ display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:8,minWidth:700 }}>
              {weekDays.map(day=><div key={day.date} onClick={()=>{setDate(day.date);setView("list");}} style={{ padding:"8px 10px",borderRadius:8,background:day.isToday?"var(--blue)":"var(--surface)",border:`1px solid ${day.isToday?"var(--blue)":"var(--border)"}`,cursor:"pointer",textAlign:"center",marginBottom:4 }}><div style={{ fontSize:11,fontWeight:600,color:day.isToday?"#fff":"var(--text3)",textTransform:"uppercase",letterSpacing:"0.06em" }}>{day.label}</div><div style={{ fontSize:20,fontWeight:700,color:day.isToday?"#fff":"var(--text1)",fontFamily:"var(--display)" }}>{day.day}</div></div>)}
              {weekDays.map(day=>{ const dayJobs=weekJobs.filter(j=>j._date===day.date).sort((a,b)=>{ if(!a.scheduled_start&&!b.scheduled_start)return 0; if(!a.scheduled_start)return 1; if(!b.scheduled_start)return -1; return new Date(a.scheduled_start)-new Date(b.scheduled_start); }); return (<div key={day.date} style={{ display:"flex",flexDirection:"column",gap:6,minHeight:120 }}>{dayJobs.length===0?<div style={{ fontSize:11,color:"var(--text4)",textAlign:"center",padding:"12px 0",fontStyle:"italic" }}>—</div>:dayJobs.map(job=>{ const color=STATUS_COLORS[job.status]||"#6B7280"; const timeStr=job.scheduled_start?new Date(job.scheduled_start).toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit"}):null; return (<div key={job.id+day.date} style={{ background:"var(--surface)",border:"1px solid var(--border)",borderLeft:`3px solid ${color}`,borderRadius:6,padding:"7px 9px",fontSize:11 }}>{timeStr&&<div style={{ fontSize:10,fontWeight:700,color:color,marginBottom:2 }}>🕐 {timeStr}</div>}<div style={{ fontWeight:700,marginBottom:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{job.title}</div><div style={{ color:"var(--text3)",marginBottom:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{job.customer_name}</div>{job._tech?<div style={{ color:color,fontWeight:600 }}>👷 {job._tech}</div>:<div style={{ color:"var(--red)",fontWeight:600 }}>⚠ Unassigned</div>}</div>); })}</div>); })}
            </div>
          )}
        </div>
      )}
      {view==="list"&&(
        <div style={{ flex:1,overflowY:"auto",padding:16,display:"flex",flexDirection:"column",gap:10 }}>
          {loading?<Spinner />:(<>
            {dispatchTechs.length===0&&unassigned.length===0&&<EmptyState icon="📡" title="No jobs scheduled" desc={`No jobs found for ${fmtDate(date)}`} />}
            {unassigned.length>0&&(<Card style={{ border:"1px solid var(--red-bd)",overflow:"hidden" }}><div style={{ padding:"10px 16px",background:"var(--red-lt)",borderBottom:"1px solid var(--red-bd)",fontSize:13,fontWeight:600,color:"var(--red)" }}>● Unassigned ({unassigned.length})</div><div style={{ display:"flex",flexDirection:"column",gap:8,padding:10 }}>{unassigned.map(job=>(<div key={job.id} style={{ background:"var(--surface2)",border:"1px solid var(--border)",borderLeft:"3px solid var(--red)",borderRadius:8,padding:"10px 12px" }}><div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12,flexWrap:"wrap" }}><div><div style={{ fontSize:11,fontFamily:"var(--mono)",color:"var(--text3)",marginBottom:3 }}>{job.job_number}</div><div style={{ fontSize:13,fontWeight:600,marginBottom:3 }}>{job.title}</div><div style={{ fontSize:11,color:"var(--text3)" }}>{job.customer_name}</div></div><div style={{ display:"flex",alignItems:"center",gap:8,flexShrink:0 }}><select defaultValue="" disabled={assigning[job.id]} onChange={e=>assignTech(job.id,e.target.value)} style={{ ...inputStyle,width:"auto",padding:"5px 10px",fontSize:12,cursor:"pointer" }}><option value="" disabled>Assign to…</option>{techs.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select>{assigning[job.id]&&<span style={{ fontSize:11,color:"var(--text3)" }}>Saving…</span>}</div></div></div>))}</div></Card>)}
            {dispatchTechs.map(tech=>(<Card key={tech.id} style={{ overflow:"hidden" }}><div style={{ padding:"10px 16px",background:"var(--surface2)",borderBottom:tech.jobs?.length?"1px solid var(--border)":"none",display:"flex",alignItems:"center",gap:10 }}><div style={{ width:32,height:32,borderRadius:"50%",background:"var(--blue-lt)",border:"1px solid var(--blue-bd)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:"var(--blue)",flexShrink:0 }}>{tech.name?.split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase()}</div><span style={{ fontSize:13,fontWeight:600 }}>{tech.name}</span><span style={{ fontSize:11,color:"var(--text3)",marginLeft:4 }}>{tech.jobs?.length||0} job{tech.jobs?.length!==1?"s":""}</span></div>{tech.jobs?.length>0?<div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:8,padding:10 }}>{[...tech.jobs].sort((a,b)=>{ if(!a.scheduled_start&&!b.scheduled_start)return 0; if(!a.scheduled_start)return 1; if(!b.scheduled_start)return -1; return new Date(a.scheduled_start)-new Date(b.scheduled_start); }).map(job=>{ const sc=STATUS_CFG[job.status]||STATUS_CFG.scheduled; const timeStr=job.scheduled_start?new Date(job.scheduled_start).toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit"}):null; return <div key={job.id} style={{ background:"var(--surface2)",border:`1px solid ${sc.bd}`,borderLeft:`3px solid ${sc.color}`,borderRadius:8,padding:"10px 12px" }}><div style={{ display:"flex",justifyContent:"space-between",marginBottom:4 }}><span style={{ fontSize:11,fontFamily:"var(--mono)",color:"var(--text3)" }}>{job.job_number}</span><Chip status={job.status} /></div>{timeStr&&<div style={{ fontSize:11,fontWeight:700,color:sc.color,marginBottom:3 }}>🕐 {timeStr}</div>}<div style={{ fontSize:13,fontWeight:600,marginBottom:3 }}>{job.title}</div><div style={{ fontSize:11,color:"var(--text3)",marginBottom:8 }}>{job.customer_name}</div><button onClick={()=>setQuickNoteJob(job)} style={{ fontSize:11,background:"var(--surface3)",border:"1px solid var(--border)",borderRadius:6,padding:"3px 10px",cursor:"pointer",color:"var(--text2)",width:"100%" }}>📝 Add Note</button></div>; })}</div>:<div style={{ padding:"12px 18px",fontSize:12,color:"var(--text4)",fontStyle:"italic" }}>No jobs scheduled</div>}</Card>))}
          </>)}
        </div>
      )}
    </div>
  );
}

// ── INVOICES ──
function printWorkOrder(wo) {
  const logo = "iVBORw0KGgoAAAANSUhEUgAAAZAAAAC5CAYAAAAGa2mGAAABCGlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGD8z8BQDwADhQF9";
  const materials=(wo.materials||[]).filter(m=>m.description), checklist=wo.checklist||[], jobTypes=wo.jobTypes||[], serviceType=wo.serviceType||[];
  const html=`<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Work Order ${wo.wo||""}</title><style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:Arial,sans-serif;font-size:10px;color:#111;background:#fff}.page{max-width:900px;margin:0 auto;padding:8px;border:2px solid #1a3a6b}.header{display:flex;align-items:center;border-bottom:2px solid #1a3a6b;padding-bottom:6px;margin-bottom:6px}.header-info{flex:1;text-align:center}.header-info h1{font-size:18px;color:#1a3a6b;font-weight:900}.wo-num .num{font-size:20px;font-weight:900;color:#1a3a6b;border:2px solid #1a3a6b;padding:3px 8px}.field{border-bottom:1px solid #1a3a6b;padding-bottom:2px;margin-bottom:6px}.field .label{font-size:8px;font-weight:700;text-transform:uppercase;color:#555}.field .value{font-size:12px;min-height:16px}.checkbox-grid{display:grid;grid-template-columns:1fr 1fr;gap:2px;border:1px solid #ccc;padding:5px;margin-bottom:6px}.checkbox-item{display:flex;align-items:center;gap:6px;font-size:10px;font-weight:600}.checkbox-item .box{width:12px;height:12px;border:1px solid #333;display:flex;align-items:center;justify-content:center;font-size:9px;flex-shrink:0}.checkbox-item .box.checked{background:#1a3a6b;color:#fff}table{width:100%;border-collapse:collapse;font-size:11px}th{background:#1a3a6b;color:#fff;font-size:9px;font-weight:700;text-transform:uppercase;padding:5px 6px;text-align:left}td{padding:5px 6px;border-bottom:1px solid #ddd}.section-title{background:#1a3a6b;color:#fff;font-size:9px;font-weight:700;text-transform:uppercase;padding:4px 8px;margin-bottom:6px}.checklist-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:1px}.bottom-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-top:6px}.bottom-card{border:1px solid #ccc;padding:6px;font-size:8.5px;line-height:1.4}.bottom-card .title{font-weight:700;font-size:10px;margin-bottom:4px}@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}@page{margin:0.4cm;size:A4 portrait}}</style></head><body><div class="page">
  <div class="header"><div class="header-info"><h1>405 Heating and Air Conditioning</h1><p>426 West Boomer Street · Lexington, Oklahoma 73051</p><p>405-215-7685</p></div><div class="wo-num"><div class="num">${wo.wo||"—"}</div></div></div>
  <div class="checkbox-grid">${["PM INSPECTION","AFTER HOURS EMERGENCY SERVICE","CONSTRUCTION","FOLLOW UP","SERVICE CALL","START UP","SHUT DOWN","MISCELLANEOUS"].map(t=>`<div class="checkbox-item"><div class="box ${jobTypes.includes(t)?"checked":""}">${jobTypes.includes(t)?"✓":""}</div><span>${t}</span></div>`).join("")}</div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px">
    <div><div class="field"><div class="label">Customer</div><div class="value">${wo.customer||""}</div></div></div>
    <div><div class="field"><div class="label">Date</div><div class="value">${wo.date||""}</div></div></div>
    <div style="grid-column:1/-1"><div class="field"><div class="label">Billing Address</div><div class="value">${wo.billingAddress||""}</div></div></div>
    <div><div class="field"><div class="label">Phone</div><div class="value">${wo.phone||""}</div></div></div>
    <div><div class="field"><div class="label">Cell</div><div class="value">${wo.cell||""}</div></div></div>
    <div style="grid-column:1/-1"><div class="field"><div class="label">Complaint</div><div class="value">${wo.complaint||""}</div></div></div>
    <div><div class="field"><div class="label">Technician</div><div class="value">${wo.technician||""}</div></div></div>
    <div><div class="field"><div class="label">Address of Unit</div><div class="value">${wo.unitAddress||""}</div></div></div>
  </div>
  <div><table><thead><tr><th>Make</th><th>Model No.</th><th>Serial No.</th><th>Location of Unit</th><th>Area Served</th></tr></thead><tbody>${(wo.equipment||[]).map(e=>`<tr><td>${e.make||""}</td><td>${e.model||""}</td><td>${e.serial||""}</td><td>${e.location||""}</td><td>${e.area||""}</td></tr>`).join("")||"<tr><td colspan='5'>&nbsp;</td></tr>"}</tbody></table></div>
  <div style="margin-top:6px"><table><thead><tr><th colspan="8" style="background:#333">LABOR</th></tr><tr><th style="background:#555">Technician</th><th style="background:#555">Time In</th><th style="background:#555">Time Out</th><th style="background:#555">Travel</th><th style="background:#555">Reg/Hrs</th><th style="background:#555">OT/Hrs</th><th style="background:#555">Rate</th><th style="background:#555">Amount</th></tr></thead><tbody><tr><td>${wo.technician||""}</td><td>${wo.timeIn||""}</td><td>${wo.timeOut||""}</td><td>${wo.travelTime||""}</td><td>${wo.regHrs||""}</td><td>${wo.otHrs||""}</td><td>${wo.rate||""}</td><td>${wo.amount||""}</td></tr></tbody></table></div>
  <div style="margin-top:6px"><div class="section-title">Service Checklist</div><div class="checklist-grid">${["CLEAN CONDENSER","CHECK RELAY","CHECK HI-LO CONTROL","PUNCH CONDENSER TUBES","PRESSURE WASH COIL","CHECK REF. CHARGE","CLEAN EVAP. COIL","BACKFLUSH CONDENSER","CHECK BELT & PULLEY","CHECK ELECTRICAL","CHECK FAN MOTOR","CHECK & CLEAN STRAINER","CHECK COND. FAN MOTOR","CLEAN DRAIN PAN","REPLACE FILTERS","LUBRICATE BEARINGS","CLEAN MAIN DRAIN","ADJUST SET POINT","CHECK CONTACTOR","CHECK CONDENSATE PUMP","CHEMICALLY CLEAN COND."].map(item=>`<div class="checkbox-item"><div class="box ${checklist.includes(item)?"checked":""}">${checklist.includes(item)?"✓":""}</div><span style="font-size:9px">${item}</span></div>`).join("")}</div></div>
  ${wo.descriptionOfWork?`<div style="margin-top:6px"><div class="section-title">Description of Work</div><div style="padding:4px 6px;border:1px solid #ccc;min-height:40px;font-size:10px;line-height:1.5;white-space:pre-wrap">${wo.descriptionOfWork}</div></div>`:""}
  ${wo.recommendations?`<div style="margin-top:6px"><div class="section-title">Recommendations</div><div style="padding:6px 8px;border:1px solid #ccc;min-height:40px;font-size:11px;line-height:1.6;white-space:pre-wrap">${wo.recommendations}</div></div>`:""}
  ${materials.length>0?`<div style="margin-top:6px"><table><thead><tr><th colspan="8">MATERIALS</th></tr><tr><th style="background:#555">Qty</th><th style="background:#555">Description</th><th style="background:#555">Unit Price</th><th style="background:#555">Amount</th><th style="background:#555">Qty</th><th style="background:#555">Description</th><th style="background:#555">Unit Price</th><th style="background:#555">Amount</th></tr></thead><tbody>${[0,2,4,6].map(i=>`<tr><td>${materials[i]?.qty||""}</td><td>${materials[i]?.description||""}</td><td>${materials[i]?.unitPrice?"$"+materials[i].unitPrice:""}</td><td>${materials[i]?.amount?"$"+materials[i].amount:""}</td><td>${materials[i+1]?.qty||""}</td><td>${materials[i+1]?.description||""}</td><td>${materials[i+1]?.unitPrice?"$"+materials[i+1].unitPrice:""}</td><td>${materials[i+1]?.amount?"$"+materials[i+1].amount:""}</td></tr>`).join("")}</tbody></table></div>`:""}
  <div class="bottom-grid">
    <div class="bottom-card"><div class="title">Acknowledgment of Work Performed</div>I have authority to order the work outlined above which has been satisfactorily completed.<div style="margin-top:8px"><div class="field"><div class="label">Print Name</div><div class="value">${wo.printName||""}</div></div></div>${wo.signature?`<div style="margin-top:6px"><img src="${wo.signature}" style="max-width:100%;height:60px;object-fit:contain;border:1px solid #ccc" /></div>`:'<div class="field" style="margin-top:6px"><div class="label">Signature</div><div class="value" style="min-height:40px"></div></div>'}<div class="field" style="margin-top:6px"><div class="label">Date</div><div class="value">${wo.signDate||""}</div></div></div>
    <div class="bottom-card"><div class="title">Limited Warranty</div>All materials, parts and equipment are warranted by the manufactures' or suppliers' written warranty only. All labor performed is warranted for 30 days.<div style="margin-top:10px">${["REGULAR","WARRANTY","SERVICE CONTRACT"].map(t=>`<div class="checkbox-item" style="margin-bottom:6px"><div class="box ${serviceType.includes(t)?"checked":""}">${serviceType.includes(t)?"✓":""}</div><span>${t}</span></div>`).join("")}</div></div>
    <div class="bottom-card" style="text-align:center;display:flex;flex-direction:column;justify-content:center;align-items:center"><div class="title">TOTAL DUE</div><div style="font-size:28px;font-weight:900;color:#1a3a6b;margin-top:8px">${wo.totalAmount?"$"+wo.totalAmount:"—"}</div></div>
  </div>
</div><script>window.onload=function(){window.print()}</script></body></html>`;
  const win=window.open("","_blank"); win.document.write(html); win.document.close();
}

function printInvoice(wo) {
  const materials=(wo.materials||[]).filter(m=>m.description);
  const html=`<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Invoice ${wo.wo||""}</title><style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:Arial,sans-serif;font-size:11px;color:#111}.page{max-width:800px;margin:0 auto;padding:32px}.header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #1a3a6b;padding-bottom:20px;margin-bottom:24px}.company h1{font-size:22px;color:#1a3a6b;font-weight:900}.company p{font-size:12px;color:#666;margin-top:4px}.invoice-info{text-align:right}.invoice-info .inv-num{font-size:28px;font-weight:900;color:#1a3a6b}.bill-to{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:24px;padding:16px;background:#f8f9fb;border-radius:8px}.bill-to h3{font-size:10px;text-transform:uppercase;color:#666;margin-bottom:8px}.bill-to p{font-size:13px;line-height:1.6}table{width:100%;border-collapse:collapse;margin-bottom:24px}th{background:#1a3a6b;color:#fff;padding:10px 12px;text-align:left;font-size:11px;font-weight:700;text-transform:uppercase}td{padding:10px 12px;border-bottom:1px solid #e4e8ef;font-size:13px}.totals-total{display:flex;justify-content:space-between;padding:12px 0;font-size:20px;font-weight:900;color:#1a3a6b;border-top:2px solid #1a3a6b}.notes{margin-top:24px;padding:16px;background:#f8f9fb;border-radius:8px;font-size:12px;color:#555}.footer{margin-top:32px;text-align:center;font-size:11px;color:#888;border-top:1px solid #e4e8ef;padding-top:16px}@media print{@page{margin:0.5cm}body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}</style></head><body><div class="page">
  <div class="header"><div class="company"><h1>405 Heating and Air Conditioning</h1><p>426 West Boomer Street · Lexington, Oklahoma 73051</p><p>405-215-7685 · jaycedunaway5212@gmail.com</p></div><div class="invoice-info"><div style="font-size:11px;color:#888;text-transform:uppercase">Invoice</div><div class="inv-num">${wo.wo||"—"}</div><div style="font-size:12px;color:#666;margin-top:6px">Date: ${wo.date||new Date().toLocaleDateString()}</div><div style="font-size:12px;color:#666">Due: Upon Receipt</div></div></div>
  <div class="bill-to"><div><h3>Bill To</h3><p><strong>${wo.customer||"—"}</strong></p>${wo.billingAddress?`<p>${wo.billingAddress}</p>`:""}${wo.phone?`<p>📞 ${wo.phone}</p>`:""}${wo.email?`<p>✉ ${wo.email}</p>`:""}</div><div><h3>Service Details</h3>${wo.technician?`<p><strong>Technician:</strong> ${wo.technician}</p>`:""}${wo.complaint?`<p><strong>Issue:</strong> ${wo.complaint}</p>`:""}</div></div>
  ${materials.length>0?`<table><thead><tr><th>Description</th><th>Qty</th><th style="text-align:right">Unit Price</th><th style="text-align:right">Amount</th></tr></thead><tbody>${materials.map(m=>`<tr><td>${m.description}</td><td>${m.qty||1}</td><td style="text-align:right">${m.unitPrice?"$"+m.unitPrice:""}</td><td style="text-align:right;font-weight:600">${m.amount?"$"+m.amount:""}</td></tr>`).join("")}</tbody></table>`:`<table><thead><tr><th>Description</th><th style="text-align:right">Amount</th></tr></thead><tbody><tr><td>${wo.complaint||wo.descriptionOfWork||"Service"}</td><td style="text-align:right;font-weight:600">${wo.totalAmount?"$"+wo.totalAmount:"—"}</td></tr></tbody></table>`}
  <div style="display:flex;justify-content:flex-end"><div style="width:280px"><div class="totals-total"><span>Total Due</span><span>${wo.totalAmount?"$"+wo.totalAmount:"$0.00"}</span></div></div></div>
  ${wo.descriptionOfWork?`<div class="notes"><strong>Work Performed:</strong> ${wo.descriptionOfWork}</div>`:""}
  ${wo.recommendations?`<div class="notes" style="margin-top:12px"><strong>Recommendations:</strong> ${wo.recommendations}</div>`:""}
  <div class="footer"><p>Thank you for choosing 405 Heating and Air Conditioning!</p><p style="margin-top:4px">Payment due upon receipt · 405-215-7685 · 426 W Boomer St, Lexington, OK 73051</p></div>
</div><script>window.onload=function(){window.print()}</script></body></html>`;
  const win=window.open("","_blank"); win.document.write(html); win.document.close();
}

// ── PAYMENT HELPERS ──
const PAYMENTS_KEY = "fieldops_payments";
function loadPayments() { try { return JSON.parse(localStorage.getItem(PAYMENTS_KEY)||"{}"); } catch { return {}; } }
function savePayment(woId, data) { const p=loadPayments(); p[woId]=data; localStorage.setItem(PAYMENTS_KEY,JSON.stringify(p)); }
function getPayment(woId) { return loadPayments()[woId]||null; }

function InvoicesScreen() {
  const [list, setList] = useState([]);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all"); // all | unpaid | paid | partial
  const [payments, setPayments] = useState(loadPayments());

  useEffect(()=>{ fetchWorkOrders().then(setList); }, []);

  function refreshPayments() { setPayments(loadPayments()); }

  async function deleteWO(id) {
    if(!window.confirm("Delete this work order?"))return;
    await deleteWorkOrder(id);
    setList(p=>p.filter(w=>w.id!==id)); setSelected(null);
  }

  function getStatus(wo) {
    const p = payments[wo.id];
    if(!p) return "unpaid";
    return p.status||"unpaid";
  }

  const filtered = list
    .filter(w=>!search||(w.customer||"").toLowerCase().includes(search.toLowerCase())||(w.wo||"").includes(search)||(w.complaint||"").toLowerCase().includes(search.toLowerCase()))
    .filter(w=>filterStatus==="all"||getStatus(w)===filterStatus);

  // Summary stats
  const totalRevenue = list.reduce((s,w)=>s+(parseFloat(w.totalAmount)||0),0);
  const totalPaid = list.filter(w=>getStatus(w)==="paid").reduce((s,w)=>s+(parseFloat(w.totalAmount)||0),0);
  const totalOutstanding = list.filter(w=>getStatus(w)!=="paid").reduce((s,w)=>s+(parseFloat(w.totalAmount)||0),0);
  const unpaidCount = list.filter(w=>getStatus(w)==="unpaid").length;

  const statusColor = { paid:"var(--green)", unpaid:"var(--red)", partial:"var(--amber)" };
  const statusBg = { paid:"var(--green-lt)", unpaid:"var(--red-lt)", partial:"var(--amber-lt)" };
  const statusBd = { paid:"var(--green-bd)", unpaid:"var(--red-bd)", partial:"var(--amber-bd)" };
  const statusLabel = { paid:"Paid", unpaid:"Unpaid", partial:"Partial" };

  if(selected) {
    const pmt = payments[selected.id]||{};
    const pmtStatus = pmt.status||"unpaid";
    return (
      <div style={{ flex:1,display:"flex",flexDirection:"column",overflow:"hidden",background:"var(--bg)" }}>
        <div style={{ padding:"12px 16px",borderBottom:"1px solid var(--border)",background:"var(--surface)",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0 }}>
          <button onClick={()=>setSelected(null)} style={{ background:"none",border:"none",color:"var(--blue)",fontSize:14,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:4,padding:0 }}>← Work Orders</button>
          <div style={{ display:"flex",gap:8 }}>
            <Btn small variant="secondary" onClick={()=>printWorkOrder(selected)}>🖨️ Print</Btn>
            <Btn small variant="secondary" onClick={()=>{ const email=selected.email||prompt("Enter customer email:"); if(!email)return; const sub=encodeURIComponent(`Work Order ${selected.wo||""} - 405 Heating & Air`); const bod=encodeURIComponent(`Hello ${selected.customer||""},\n\nWork Order #: ${selected.wo||"—"}\nDate: ${selected.date||"—"}\nTotal Due: ${selected.totalAmount?"$"+selected.totalAmount:"—"}\n\nThank you for choosing 405 Heating & Air.\n405-215-7685`); window.open(`mailto:${email}?subject=${sub}&body=${bod}`); }}>✉️ Email</Btn>
            <Btn small variant="secondary" onClick={()=>printInvoice(selected)}>🧾 Invoice</Btn>
            {selected.totalAmount&&<SquareBtn amount={selected.totalAmount} small />}
            <Btn small variant="danger" onClick={()=>deleteWO(selected.id)}>Delete</Btn>
          </div>
        </div>
        <div style={{ flex:1,overflowY:"auto",padding:20 }}>
          {/* Header */}
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20,flexWrap:"wrap",gap:12 }}>
            <div>
              <div style={{ fontSize:12,fontFamily:"var(--mono)",color:"var(--text3)",marginBottom:4 }}>WO# {selected.wo||"—"}</div>
              <div style={{ fontSize:22,fontFamily:"var(--display)",fontWeight:800,marginBottom:4 }}>{selected.customer||"—"}</div>
              <div style={{ fontSize:13,color:"var(--text3)" }}>{selected.date||"No date"}</div>
            </div>
            <div style={{ textAlign:"right" }}>
              <div style={{ fontSize:10,color:"var(--text3)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:4 }}>Total</div>
              <div style={{ fontSize:32,fontFamily:"var(--mono)",fontWeight:700,color:"var(--text1)",marginBottom:8 }}>{selected.totalAmount?`$${selected.totalAmount}`:"—"}</div>
              <span style={{ fontSize:12,fontWeight:700,color:statusColor[pmtStatus],background:statusBg[pmtStatus],border:`1px solid ${statusBd[pmtStatus]}`,borderRadius:6,padding:"4px 12px" }}>{pmtStatus==="paid"?"✓ Paid":pmtStatus==="partial"?"◐ Partial":"● Unpaid"}</span>
            </div>
          </div>

          {/* Payment Panel */}
          <PaymentPanel wo={selected} pmt={pmt} onUpdate={()=>{ refreshPayments(); setSelected(p=>({...p})); }} />

          {/* Details */}
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16,marginTop:16 }}>
            {[["Phone",selected.phone],["Cell",selected.cell],["Email",selected.email],["Address",selected.billingAddress],["Complaint",selected.complaint],["Technician",selected.technician],["Time In",selected.timeIn],["Time Out",selected.timeOut]].filter(([,v])=>v).map(([l,v])=>(
              <div key={l} style={{ background:"var(--surface2)",borderRadius:8,padding:"10px 12px" }}><div style={{ fontSize:10,fontWeight:700,color:"var(--text3)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:3 }}>{l}</div><div style={{ fontSize:13 }}>{v}</div></div>
            ))}
          </div>
          {selected.descriptionOfWork&&<Card style={{ padding:"14px 16px",marginBottom:12 }}><div style={{ fontSize:10,fontWeight:700,color:"var(--text3)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:8 }}>Description of Work</div><div style={{ fontSize:13,lineHeight:1.7,whiteSpace:"pre-wrap" }}>{selected.descriptionOfWork}</div></Card>}
          {selected.materials?.some(m=>m.description)&&<Card style={{ padding:"14px 16px",marginBottom:12 }}><div style={{ fontSize:10,fontWeight:700,color:"var(--text3)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:10 }}>Materials</div><table style={{ width:"100%",borderCollapse:"collapse",fontSize:13 }}><thead><tr style={{ background:"var(--surface2)" }}>{["Qty","Description","Unit Price","Amount"].map(h=><th key={h} style={{ padding:"6px 10px",textAlign:"left",fontSize:11,fontWeight:600,color:"var(--text3)",borderBottom:"1px solid var(--border)" }}>{h}</th>)}</tr></thead><tbody>{selected.materials.filter(m=>m.description).map((m,i)=><tr key={i} style={{ borderBottom:"1px solid var(--border)" }}><td style={{ padding:"8px 10px" }}>{m.qty||"1"}</td><td style={{ padding:"8px 10px" }}>{m.description}</td><td style={{ padding:"8px 10px" }}>{m.unitPrice?`$${m.unitPrice}`:""}</td><td style={{ padding:"8px 10px",fontWeight:600,color:"var(--green)" }}>{m.amount?`$${m.amount}`:""}</td></tr>)}</tbody></table></Card>}
          {selected.printName&&<Card style={{ padding:"14px 16px" }}><div style={{ fontSize:10,fontWeight:700,color:"var(--text3)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:8 }}>Signature</div><div style={{ fontSize:13 }}>{selected.printName} · {selected.signDate||""}</div></Card>}
        </div>
      </div>
    );
  }

  return (
    <div style={{ flex:1,display:"flex",flexDirection:"column",overflow:"hidden" }}>
      {/* Revenue summary bar */}
      <div style={{ padding:"14px 20px",background:"var(--surface)",borderBottom:"1px solid var(--border)",flexShrink:0 }}>
        <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:14 }}>
          {[
            {label:"Total Revenue",val:`$${totalRevenue.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})}`,color:"var(--text1)"},
            {label:"Collected",val:`$${totalPaid.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})}`,color:"var(--green)"},
            {label:"Outstanding",val:`$${totalOutstanding.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})}`,color:totalOutstanding>0?"var(--red)":"var(--text3)"},
          ].map(s=>(
            <div key={s.label} style={{ background:"var(--surface2)",border:"1px solid var(--border)",borderRadius:10,padding:"12px 14px" }}>
              <div style={{ fontSize:10,fontWeight:600,color:"var(--text3)",textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:6 }}>{s.label}</div>
              <div style={{ fontSize:20,fontFamily:"var(--mono)",fontWeight:700,color:s.color }}>{s.val}</div>
            </div>
          ))}
        </div>
        {/* Filters + search */}
        <div style={{ display:"flex",gap:8,flexWrap:"wrap",alignItems:"center" }}>
          <div style={{ position:"relative",flex:1,minWidth:160 }}>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search customer, WO#…" style={{ ...inputStyle,paddingLeft:28 }} />
            <span style={{ position:"absolute",left:9,top:"50%",transform:"translateY(-50%)",color:"var(--text3)",fontSize:12 }}>⌕</span>
          </div>
          <div style={{ display:"flex",gap:4 }}>
            {["all","unpaid","partial","paid"].map(s=>(
              <button key={s} onClick={()=>setFilterStatus(s)} style={{ fontSize:11,padding:"5px 12px",borderRadius:100,background:filterStatus===s?(s==="paid"?"var(--green)":s==="unpaid"?"var(--red)":s==="partial"?"var(--amber)":"var(--blue)"):"var(--surface2)",color:filterStatus===s?"#fff":"var(--text3)",border:"1px solid var(--border)",cursor:"pointer",fontWeight:filterStatus===s?600:400,transition:"all .15s" }}>
                {s==="all"?`All (${list.length})`:s==="unpaid"?`Unpaid (${list.filter(w=>getStatus(w)==="unpaid").length})`:s==="partial"?`Partial (${list.filter(w=>getStatus(w)==="partial").length})`:`Paid (${list.filter(w=>getStatus(w)==="paid").length})`}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div style={{ flex:1,overflowY:"auto" }}>
        {filtered.length===0?<EmptyState icon="📋" title="No work orders found" desc={filterStatus!=="all"?"Try a different filter":"Submit a work order from the Jobs tab"} />:filtered.map(wo=>{
          const pmtStatus = getStatus(wo);
          return (
            <div key={wo.id} onClick={()=>setSelected(wo)} style={{ padding:"14px 16px",borderBottom:"1px solid var(--border)",cursor:"pointer",transition:"background .1s",display:"flex",justifyContent:"space-between",alignItems:"center",gap:12 }} onMouseEnter={e=>e.currentTarget.style.background="var(--surface2)"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
              <div style={{ flex:1,minWidth:0 }}>
                <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:3 }}>
                  <span style={{ fontSize:11,fontFamily:"var(--mono)",color:"var(--text3)" }}>WO#{wo.wo||"—"}</span>
                  <span style={{ fontSize:10,fontWeight:700,color:statusColor[pmtStatus],background:statusBg[pmtStatus],border:`1px solid ${statusBd[pmtStatus]}`,borderRadius:4,padding:"1px 7px" }}>{statusLabel[pmtStatus]}</span>
                </div>
                <div style={{ fontSize:14,fontWeight:600,marginBottom:2 }}>{wo.customer||"Unknown"}</div>
                <div style={{ fontSize:12,color:"var(--text3)" }}>{wo.complaint||"No description"} · {wo.date||"No date"}</div>
              </div>
              <div style={{ textAlign:"right",flexShrink:0 }}>
                <div style={{ fontSize:18,fontFamily:"var(--mono)",fontWeight:700,color:pmtStatus==="paid"?"var(--green)":pmtStatus==="partial"?"var(--amber)":"var(--text1)" }}>{wo.totalAmount?`$${wo.totalAmount}`:"—"}</div>
                {pmtStatus==="partial"&&payments[wo.id]?.amountPaid&&<div style={{ fontSize:11,color:"var(--text3)" }}>${payments[wo.id].amountPaid} paid</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── SQUARE HELPER ──
function openSquare(amount) {
  const cents = Math.round((parseFloat(amount)||0) * 100);
  // Square Point of Sale deep link — opens Square POS app with amount pre-filled
  // Works on iOS and Android with Square app installed
  const callbackUrl = encodeURIComponent(window.location.href);
  const squareUrl = `square-commerce-v1://payment/create?data=${encodeURIComponent(JSON.stringify({
    amount_money: { amount: cents, currency_code: "USD" },
    callback_url: decodeURIComponent(callbackUrl),
    client_id: "fieldops-405-hvac",
    version: "1.3",
    notes: "405 Heating & Air Conditioning",
  }))}`;
  // Try deep link first; if Square isn't installed, fall back to Square web dashboard
  const fallback = setTimeout(() => {
    window.open("https://squareup.com/dashboard/sales", "_blank");
  }, 1200);
  window.location.href = squareUrl;
  // Clear fallback if app opened
  window.addEventListener("blur", () => clearTimeout(fallback), { once: true });
}

function SquareBtn({ amount, small }) {
  return (
    <button onClick={()=>openSquare(amount)} style={{ display:"inline-flex",alignItems:"center",gap:7,background:"#006AFF",color:"#fff",border:"none",borderRadius:8,padding:small?"5px 12px":"9px 16px",fontSize:small?12:13,fontWeight:600,cursor:"pointer",transition:"filter .15s",fontFamily:"var(--sans)" }}
      onMouseEnter={e=>e.currentTarget.style.filter="brightness(1.1)"}
      onMouseLeave={e=>e.currentTarget.style.filter=""}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><rect x="1" y="1" width="22" height="22" rx="5" fill="#fff"/><rect x="6" y="6" width="12" height="12" rx="2" fill="#006AFF"/></svg>
      {amount?`Charge $${parseFloat(amount).toFixed(2)} via Square`:"Charge via Square"}
    </button>
  );
}

function PaymentPanel({ wo, pmt, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ status: pmt.status||"unpaid", method: pmt.method||"", amountPaid: pmt.amountPaid||"", note: pmt.note||"", paidDate: pmt.paidDate||new Date().toISOString().slice(0,10) });
  const METHODS = ["Cash","Check","Card","Zelle","Venmo","CashApp","ACH","Other"];
  const total = parseFloat(wo.totalAmount)||0;
  const paid = parseFloat(form.amountPaid)||0;
  const remaining = Math.max(0, total - paid);

  function handleSave() {
    const data = { ...form, amountPaid: form.amountPaid, updatedAt: new Date().toISOString() };
    if(form.status==="partial" && paid >= total && total > 0) data.status = "paid";
    savePayment(wo.id, data);
    setEditing(false);
    onUpdate();
  }

  function markPaid() {
    const data = { status:"paid", method: form.method||"Cash", amountPaid: wo.totalAmount, paidDate: new Date().toISOString().slice(0,10), note: form.note, updatedAt: new Date().toISOString() };
    savePayment(wo.id, data);
    setForm(p=>({...p,...data}));
    onUpdate();
  }

  function markUnpaid() {
    const data = { status:"unpaid", method:"", amountPaid:"", paidDate:"", note:"", updatedAt: new Date().toISOString() };
    savePayment(wo.id, data);
    setForm(p=>({...p,...data}));
    onUpdate();
  }

  const pmtStatus = pmt.status||"unpaid";
  const statusColor = { paid:"var(--green)", unpaid:"var(--red)", partial:"var(--amber)" };
  const statusBg = { paid:"var(--green-lt)", unpaid:"var(--red-lt)", partial:"var(--amber-lt)" };
  const statusBd = { paid:"var(--green-bd)", unpaid:"var(--red-bd)", partial:"var(--amber-bd)" };

  return (
    <Card style={{ padding:"16px 18px",border:`1px solid ${statusBd[pmtStatus]}`,background:`${statusBg[pmtStatus]}` }}>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:editing?16:0,flexWrap:"wrap",gap:8 }}>
        <div style={{ fontSize:13,fontWeight:700,fontFamily:"var(--display)" }}>
          {pmtStatus==="paid"?"✅ Payment Received":pmtStatus==="partial"?"◐ Partial Payment":"💳 Payment"}
        </div>
        {!editing&&(
          <div style={{ display:"flex",gap:8,flexWrap:"wrap" }}>
            {pmtStatus!=="paid"&&<Btn small onClick={markPaid}>✓ Mark Paid</Btn>}
            {pmtStatus!=="paid"&&wo.totalAmount&&<SquareBtn amount={wo.totalAmount} small />}
            {pmtStatus==="paid"&&<Btn small variant="secondary" onClick={markUnpaid}>Mark Unpaid</Btn>}
            <Btn small variant="secondary" onClick={()=>setEditing(true)}>Edit</Btn>
          </div>
        )}
      </div>
      {!editing&&pmtStatus!=="unpaid"&&(
        <div style={{ display:"flex",gap:16,flexWrap:"wrap",marginTop:10 }}>
          {pmt.amountPaid&&<div><div style={{ fontSize:10,color:"var(--text3)",textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:2 }}>Amount Paid</div><div style={{ fontSize:16,fontFamily:"var(--mono)",fontWeight:700,color:"var(--green)" }}>${pmt.amountPaid}</div></div>}
          {remaining>0&&<div><div style={{ fontSize:10,color:"var(--text3)",textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:2 }}>Remaining</div><div style={{ fontSize:16,fontFamily:"var(--mono)",fontWeight:700,color:"var(--red)" }}>${remaining.toFixed(2)}</div></div>}
          {pmt.method&&<div><div style={{ fontSize:10,color:"var(--text3)",textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:2 }}>Method</div><div style={{ fontSize:14,fontWeight:600 }}>{pmt.method}</div></div>}
          {pmt.paidDate&&<div><div style={{ fontSize:10,color:"var(--text3)",textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:2 }}>Date Paid</div><div style={{ fontSize:14,fontWeight:600 }}>{fmtDate(pmt.paidDate)}</div></div>}
          {pmt.note&&<div style={{ width:"100%" }}><div style={{ fontSize:10,color:"var(--text3)",textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:2 }}>Note</div><div style={{ fontSize:13,color:"var(--text2)" }}>{pmt.note}</div></div>}
        </div>
      )}
      {editing&&(
        <div style={{ display:"flex",flexDirection:"column",gap:12 }}>
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10 }}>
            <FormField label="Status"><select style={inputStyle} value={form.status} onChange={e=>setForm(p=>({...p,status:e.target.value}))}><option value="unpaid">Unpaid</option><option value="partial">Partial Payment</option><option value="paid">Paid in Full</option></select></FormField>
            <FormField label="Payment Method"><select style={inputStyle} value={form.method} onChange={e=>setForm(p=>({...p,method:e.target.value}))}><option value="">Select…</option>{METHODS.map(m=><option key={m}>{m}</option>)}</select></FormField>
            <FormField label="Amount Paid"><input style={inputStyle} type="number" min="0" step="0.01" value={form.amountPaid} onChange={e=>setForm(p=>({...p,amountPaid:e.target.value}))} placeholder={wo.totalAmount||"0.00"} /></FormField>
            <FormField label="Date Paid"><input style={inputStyle} type="date" value={form.paidDate} onChange={e=>setForm(p=>({...p,paidDate:e.target.value}))} /></FormField>
          </div>
          <FormField label="Note (optional)"><input style={inputStyle} value={form.note} onChange={e=>setForm(p=>({...p,note:e.target.value}))} placeholder="e.g. Check #1042" /></FormField>
          <div style={{ display:"flex",gap:8,justifyContent:"flex-end" }}>
            <Btn small variant="secondary" onClick={()=>setEditing(false)}>Cancel</Btn>
            <Btn small onClick={handleSave}>Save Payment</Btn>
          </div>
        </div>
      )}
    </Card>
  );
}

// ── JOB DETAIL MODAL ──
function JobDetailModal({ job, onClose }) {
  const [notes,setNotes]=useState([]); const [photos,setPhotos]=useState([]); const [newNote,setNewNote]=useState(""); const [loading,setLoading]=useState(true); const [saving,setSaving]=useState(false); const [tab,setTab]=useState("notes");
  useEffect(()=>{ async function load(){try{const [nd,pd]=await Promise.all([apiFetch(`/jobs/${job.id}/notes`).catch(()=>[]),apiFetch(`/jobs/${job.id}/photos`).catch(()=>[])]);setNotes(Array.isArray(nd)?nd:[]);setPhotos(Array.isArray(pd)?pd:[]);}catch(e){console.error(e);}setLoading(false);}load();},[job.id]);
  async function addNote(){if(!newNote.trim())return;setSaving(true);try{const note=await apiFetch(`/jobs/${job.id}/notes`,{method:"POST",body:JSON.stringify({content:newNote.trim(),note_type:"general"})});setNotes(p=>[note,...p]);setNewNote("");}catch(e){alert(e.message);}setSaving(false);}
  async function handlePhotoUpload(e){const file=e.target.files[0];if(!file)return;const reader=new FileReader();reader.onload=async(ev)=>{try{const photo=await apiFetch(`/jobs/${job.id}/photos`,{method:"POST",body:JSON.stringify({url:ev.target.result,caption:file.name,photo_type:"before"})});setPhotos(p=>[photo,...p]);}catch(e){setPhotos(p=>[{id:Date.now(),url:ev.target.result,caption:file.name,created_at:new Date().toISOString()},...p]);}};reader.readAsDataURL(file);}
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
  const [members,setMembers]=useState([]); const [loading,setLoading]=useState(true); const [showNew,setShowNew]=useState(false);
  async function load(){setLoading(true);try{const d=await apiFetch("/users?limit=100");setMembers(Array.isArray(d)?d:[]);}catch(e){console.error(e);}setLoading(false);}
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
  const [f,setF]=useState({name:"",email:"",phone:"",password:"",role:"technician"}); const [saving,setSaving]=useState(false);
  async function save(){if(!f.name||!f.email||!f.password){alert("Name, email and password required");return;}if(f.password.length<6){alert("Password must be at least 6 characters");return;}setSaving(true);try{const m=await apiFetch("/users",{method:"POST",body:JSON.stringify(f)});onSave(m);}catch(e){alert(e.message);}setSaving(false);}
  return (
    <Modal title="Add Team Member" onClose={onClose}>
      <div style={{ padding:"18px 24px",display:"flex",flexDirection:"column",gap:14 }}>
        <FormField label="Full Name *"><input style={inputStyle} value={f.name} onChange={e=>setF(p=>({...p,name:e.target.value}))} placeholder="John Smith" /></FormField>
        <FormField label="Email *"><input style={inputStyle} type="email" value={f.email} onChange={e=>setF(p=>({...p,email:e.target.value}))} placeholder="john@email.com" /></FormField>
        <FormField label="Phone"><input style={inputStyle} value={f.phone} onChange={e=>setF(p=>({...p,phone:e.target.value}))} placeholder="405-555-0100" /></FormField>
        <FormField label="Role"><select style={inputStyle} value={f.role} onChange={e=>setF(p=>({...p,role:e.target.value}))}><option value="technician">Technician</option><option value="dispatcher">Dispatcher</option><option value="admin">Admin</option></select></FormField>
        <FormField label="Password *"><input style={inputStyle} type="password" value={f.password} onChange={e=>setF(p=>({...p,password:e.target.value}))} placeholder="Min 6 characters" /></FormField>
        <div style={{ background:"var(--blue-lt)",border:"1px solid var(--blue-bd)",borderRadius:8,padding:"10px 14px",fontSize:12,color:"var(--blue)" }}>💡 Share these login details with your tech.</div>
      </div>
      <div style={{ padding:"14px 24px",borderTop:"1px solid var(--border)",display:"flex",justifyContent:"flex-end",gap:10 }}><Btn variant="secondary" onClick={onClose}>Cancel</Btn><Btn onClick={save} disabled={saving}>{saving?"Adding…":"Add Member"}</Btn></div>
    </Modal>
  );
}

// ── PRICEBOOK ──
export const CATEGORIES = ["Diagnostic Fee","Blower Motor & Wheel","Burners","Circuit Board","Electric Heat","Fan Belt","Fan/Limit Switch","Flue/Intake Pipe","Gas Valve","Heat Exchanger","Ignition","Inducer","Low Voltage","Accumulator/Muffler","Capacitor","Compressor","Condenser: Air Restriction","Condenser: Fan Motor","Contactor","Defrost Control","Driers","Evaporator: Air Restriction","Evaporator: Coil Leak","Leak Search & Lineset","Metering Device","Pressure Switch","Refrigerant","Reversing Valve","Air Cleaner","Filters","Humidifier","Thermostat","UV Light","Breaker/Fuse","Water Leak","Wiring"];
const PB_DEFAULTS = [
  {id:"d1",category:"Diagnostic Fee",name:"Diagnostic Fee",price:79,description:"Standard diagnostic fee"},
  {id:"d2",category:"Diagnostic Fee",name:"Diagnostic Fee (Premium)",price:89,description:"Premium diagnostic fee"},
  {id:"p1",category:"Blower Motor & Wheel",name:"Replace Indoor Blower Motor (STD) PSC",price:345},{id:"p2",category:"Blower Motor & Wheel",name:"Replace Blower Motor (OEM)",price:367},{id:"p3",category:"Blower Motor & Wheel",name:"Replace Blower Motor (Warranty)",price:204},{id:"p4",category:"Blower Motor & Wheel",name:"Replace Blower Motor & Wheel (STD)",price:451},{id:"p5",category:"Blower Motor & Wheel",name:"Replace Blower Motor & Wheel (OEM)",price:477},{id:"p6",category:"Blower Motor & Wheel",name:"Replace Blower Motor & Wheel (Warranty)",price:272},{id:"p7",category:"Blower Motor & Wheel",name:"Replace Variable Speed Blower Motor & Wheel",price:1133},{id:"p8",category:"Blower Motor & Wheel",name:"Replace Variable Speed Blower Motor & Wheel (Warranty)",price:271},{id:"p9",category:"Blower Motor & Wheel",name:"Replace ECM Blower Motor Universal 1/2-1/3 120/240V",price:670},{id:"p10",category:"Blower Motor & Wheel",name:"Replace ECM Blower Motor Universal 3/4 HP 120/240V",price:785},{id:"p11",category:"Blower Motor & Wheel",name:"Replace Blower Wheel",price:295},{id:"p12",category:"Blower Motor & Wheel",name:"Replace Blower Wheel (Warranty)",price:210},{id:"p13",category:"Blower Motor & Wheel",name:"Pull & Clean Blower Wheel",price:195},{id:"p14",category:"Blower Motor & Wheel",name:"Adjust Blower Wheel",price:68},{id:"p15",category:"Blower Motor & Wheel",name:"Replace Shaft & Bearing Up to 1\" Diameter",price:394},
  {id:"p16",category:"Burners",name:"Replace Burner",price:207},{id:"p17",category:"Burners",name:"Replace Burner (Warranty)",price:105},{id:"p18",category:"Burners",name:"Pull & Clean Burner",price:135},
  {id:"p19",category:"Circuit Board",name:"Replace Circuit Board (Standard Gas Furnace)",price:370},{id:"p20",category:"Circuit Board",name:"Replace Circuit Board (Standard Air Handler)",price:370},{id:"p21",category:"Circuit Board",name:"Replace Circuit Board (Variable Speed Furnace)",price:492},{id:"p22",category:"Circuit Board",name:"Replace Circuit Board (Warranty)",price:135},{id:"p23",category:"Circuit Board",name:"Replace Circuit Board (Carrier/Lennox)",price:435},{id:"p24",category:"Circuit Board",name:"Replace Ignition Control Board",price:314},{id:"p25",category:"Circuit Board",name:"Replace Fan Relay",price:135},
  {id:"p26",category:"Electric Heat",name:"Replace Fusible Link",price:98},{id:"p27",category:"Electric Heat",name:"Replace High Limit (Main Limit)",price:140},{id:"p28",category:"Electric Heat",name:"Replace High Limit (Warranty)",price:69},{id:"p29",category:"Electric Heat",name:"Replace Electric Heat Package",price:427},{id:"p30",category:"Electric Heat",name:"Replace Sequencer/Heat Relay",price:140},{id:"p31",category:"Electric Heat",name:"Replace Sequencer/Heat Relay (Warranty)",price:78},{id:"p32",category:"Electric Heat",name:"Replace Electric Heat Element",price:358},{id:"p33",category:"Electric Heat",name:"Replace Electric Heat Element (Warranty)",price:267},
  {id:"p34",category:"Fan Belt",name:"Replace Fan Belt",price:153},{id:"p35",category:"Fan Belt",name:"Replace Fan Belt and Pulley",price:232},{id:"p36",category:"Fan Belt",name:"Replace Fan Belt and Motor Pulley",price:232},{id:"p37",category:"Fan Belt",name:"Replace Fan Belt, Fan Pulley and Motor Pulley",price:364},
  {id:"p38",category:"Fan/Limit Switch",name:"Replace Fan Limit (Dial Type)",price:222},{id:"p39",category:"Fan/Limit Switch",name:"Replace Fan Relay/Time Delay",price:86},{id:"p40",category:"Fan/Limit Switch",name:"Replace Fan Relay/Time Delay (Warranty)",price:69},{id:"p41",category:"Fan/Limit Switch",name:"Replace Fan Center Control",price:281},{id:"p42",category:"Fan/Limit Switch",name:"Replace Limit Snapdisk/Flexed/Fusable/Rollout",price:128},{id:"p43",category:"Fan/Limit Switch",name:"Replace Limit Snapdisk/Flexed/Fusable/Rollout (Warranty)",price:69},{id:"p44",category:"Fan/Limit Switch",name:"Replace Door Switch",price:101},
  {id:"p45",category:"Flue/Intake Pipe",name:"Replace Flue Cap or Elbow",price:154},{id:"p46",category:"Flue/Intake Pipe",name:"Replace Flue Vent (Up to 5')",price:162},{id:"p47",category:"Flue/Intake Pipe",name:"Replace Flue Vent (Up to 15')",price:204},{id:"p48",category:"Flue/Intake Pipe",name:"Clean Obstruction",price:168},
  {id:"p49",category:"Gas Valve",name:"Replace Single Stage Gas Valve",price:360},{id:"p50",category:"Gas Valve",name:"Replace Single Stage Gas Valve (Warranty)",price:135},{id:"p51",category:"Gas Valve",name:"Replace 2 Stage Gas Valve",price:367},{id:"p52",category:"Gas Valve",name:"Replace 2 Stage Gas Valve (Warranty)",price:135},{id:"p53",category:"Gas Valve",name:"Replace Gas Shut Off/Union/Gas Flex/Up to 6\" Pipe",price:182},{id:"p54",category:"Gas Valve",name:"Adjust Gas Pressure",price:68},
  {id:"p55",category:"Heat Exchanger",name:"Clean Heat Exchanger",price:226},{id:"p56",category:"Heat Exchanger",name:"Carbon Monoxide Test",price:101},{id:"p57",category:"Heat Exchanger",name:"Replace Heat Exchanger Non Attic (Warranty)",price:860},{id:"p58",category:"Heat Exchanger",name:"Replace Heat Exchanger Attic (Warranty)",price:1132},
  {id:"p59",category:"Ignition",name:"Replace Hot Surface Ignitor",price:145},{id:"p60",category:"Ignition",name:"Replace Hot Surface Ignitor/Flame Sensor (Warranty)",price:69},{id:"p61",category:"Ignition",name:"Replace Thermocouple",price:135},{id:"p62",category:"Ignition",name:"Clean and Adjust Pilot Assembly",price:162},{id:"p63",category:"Ignition",name:"Replace Flame Sensor",price:125},{id:"p64",category:"Ignition",name:"Replace Hot Surface Ignitor/Flame Sensor 90AFUR",price:217},
  {id:"p65",category:"Inducer",name:"Replace Inducer Assembly",price:367},{id:"p66",category:"Inducer",name:"Replace Inducer Motor Assembly & Wheel (Warranty)",price:162},{id:"p67",category:"Inducer",name:"Replace Inducer Wheel",price:184},{id:"p68",category:"Inducer",name:"Replace Inducer Wheel (Warranty)",price:94},{id:"p69",category:"Inducer",name:"Replace Inducer Motor",price:338},{id:"p70",category:"Inducer",name:"Replace Pressure Switch",price:110},{id:"p71",category:"Inducer",name:"Replace Pressure Switch (Warranty)",price:90},{id:"p72",category:"Inducer",name:"Clean and Adjust Inducer",price:121},
  {id:"p73",category:"Low Voltage",name:"Replace Transformer",price:145},{id:"p74",category:"Low Voltage",name:"Replace Transformer (Warranty)",price:69},{id:"p75",category:"Low Voltage",name:"Replace Fuse",price:15},
  {id:"p76",category:"Accumulator/Muffler",name:"Replace Accumulator or Muffler (Warranty)",price:590},
  {id:"p77",category:"Capacitor",name:"Replace Single Capacitor 1 Pole",price:105},{id:"p78",category:"Capacitor",name:"Replace Single Capacitor 1 Pole (Warranty)",price:69},{id:"p79",category:"Capacitor",name:"Replace Dual Capacitor",price:125},{id:"p80",category:"Capacitor",name:"Replace Dual Capacitor (Warranty)",price:65},
  {id:"p81",category:"Compressor",name:"Replace Compressor (Warranty)",price:1085},{id:"p82",category:"Compressor",name:"Replace Sound Blanket",price:163},{id:"p83",category:"Compressor",name:"Replace Crankcase Heater",price:149},{id:"p84",category:"Compressor",name:"Replace Crankcase Heater (Warranty)",price:116},{id:"p85",category:"Compressor",name:"Repair Terminal",price:156},{id:"p86",category:"Compressor",name:"Replace Start Assist Assembly",price:165},{id:"p87",category:"Compressor",name:"Replace Start Assist Assembly (Warranty)",price:69},
  {id:"p88",category:"Condenser: Air Restriction",name:"Clean Condenser Coil",price:75},{id:"p89",category:"Condenser: Air Restriction",name:"Straighten Fins (Minor)",price:68},{id:"p90",category:"Condenser: Air Restriction",name:"Straighten Fins (Major)",price:204},{id:"p91",category:"Condenser: Air Restriction",name:"Replace Condenser Coil",price:1569},{id:"p92",category:"Condenser: Air Restriction",name:"Replace Condenser Coil (Warranty)",price:613},
  {id:"p93",category:"Condenser: Fan Motor",name:"Replace Condenser Fan Blade",price:335},{id:"p94",category:"Condenser: Fan Motor",name:"Replace Condenser Fan Blade (Warranty)",price:225},{id:"p95",category:"Condenser: Fan Motor",name:"Replace Condenser Fan Motor",price:345},{id:"p96",category:"Condenser: Fan Motor",name:"Replace 2 Speed Condenser Fan Motor",price:474},{id:"p97",category:"Condenser: Fan Motor",name:"Replace Condenser Fan Blade and Motor",price:487},{id:"p98",category:"Condenser: Fan Motor",name:"Replace Condenser Fan Blade and Motor (Warranty)",price:285},
  {id:"p99",category:"Contactor",name:"Replace Contactor",price:145},{id:"p100",category:"Contactor",name:"Replace Contactor (Warranty)",price:105},
  {id:"p101",category:"Defrost Control",name:"Replace Circuit Board/Timer",price:198},{id:"p102",category:"Defrost Control",name:"Replace Circuit Board/Timer (Warranty)",price:135},{id:"p103",category:"Defrost Control",name:"Replace 2 Speed Circuit Board",price:199},{id:"p104",category:"Defrost Control",name:"Replace 2 Speed Circuit Board (Warranty)",price:135},{id:"p105",category:"Defrost Control",name:"Replace Relay",price:212},{id:"p106",category:"Defrost Control",name:"Replace Defrost Thermostat",price:248},{id:"p107",category:"Defrost Control",name:"Replace Defrost Thermostat (Warranty)",price:135},
  {id:"p108",category:"Driers",name:"Replace Filter Drier - Pump Down",price:385},{id:"p109",category:"Driers",name:"Replace Filter Drier - Recovery",price:542},
  {id:"p110",category:"Evaporator: Air Restriction",name:"Clean In Place With Access Door",price:142},{id:"p111",category:"Evaporator: Air Restriction",name:"Clean In Place Without Access Door",price:243},{id:"p112",category:"Evaporator: Air Restriction",name:"Remove and Clean - Pump Down",price:477},{id:"p113",category:"Evaporator: Air Restriction",name:"Remove and Clean - Recovery",price:613},
  {id:"p114",category:"Evaporator: Coil Leak",name:"Simple Leak Repair - Pump Down",price:341},{id:"p115",category:"Evaporator: Coil Leak",name:"Simple Leak Repair - Recovery",price:513},{id:"p116",category:"Evaporator: Coil Leak",name:"Replace Evaporator Coil Attic (Warranty)",price:585},{id:"p117",category:"Evaporator: Coil Leak",name:"Replace Evaporator Coil Non-Attic (Warranty)",price:495},
  {id:"p118",category:"Leak Search & Lineset",name:"Electronic Leak Search",price:85},{id:"p119",category:"Leak Search & Lineset",name:"Electronic Leak Search with Nitrogen",price:216},{id:"p120",category:"Leak Search & Lineset",name:"Lineset Repair - Accessible (Pump Down)",price:477},{id:"p121",category:"Leak Search & Lineset",name:"Lineset Repair - Accessible (Recovery)",price:748},
  {id:"p122",category:"Metering Device",name:"Replace TXV Pump Down",price:679},{id:"p123",category:"Metering Device",name:"Replace TXV Pump Down (Warranty)",price:542},{id:"p124",category:"Metering Device",name:"Replace TXV Recovery",price:814},{id:"p125",category:"Metering Device",name:"Replace TXV Recovery (Warranty)",price:678},{id:"p126",category:"Metering Device",name:"Repair Piston Blockage Pump Down",price:416},{id:"p127",category:"Metering Device",name:"Repair Piston Blockage Recovery",price:551},{id:"p128",category:"Metering Device",name:"Replace Schrader/Tighten Flare - No Refrigerant",price:81},{id:"p129",category:"Metering Device",name:"Replace Service Valve - Recovery",price:653},{id:"p130",category:"Metering Device",name:"Replace Access Valve - No Refrigerant",price:367},
  {id:"p131",category:"Pressure Switch",name:"Replace Threaded Hi/Lo Pressure Switch Schrader",price:221},{id:"p132",category:"Pressure Switch",name:"Replace Hi/Lo Pressure Switch Recovery",price:665},{id:"p133",category:"Pressure Switch",name:"Replace Hi/Lo Pressure Switch Recovery (Warranty)",price:542},
  {id:"p134",category:"Refrigerant",name:"R22 & Drop In Equivalent 1 LB",price:78},{id:"p135",category:"Refrigerant",name:"R410 1 LB",price:70},{id:"p136",category:"Refrigerant",name:"R32 1 LB",price:70},{id:"p137",category:"Refrigerant",name:"R454B 1 LB",price:80},{id:"p138",category:"Refrigerant",name:"Remove Refrigerant Overcharge",price:80},{id:"p139",category:"Refrigerant",name:"Recovery of Refrigerant (Entire Charge)",price:160},
  {id:"p140",category:"Reversing Valve",name:"Replace Reversing Valve (Warranty)",price:542},{id:"p141",category:"Reversing Valve",name:"Replace Reversing Valve (Secondary Repair)",price:639},{id:"p142",category:"Reversing Valve",name:"Replace Electrical Coil",price:180},{id:"p143",category:"Reversing Valve",name:"Replace Electrical Coil (Warranty)",price:113},
  {id:"p144",category:"Air Cleaner",name:"Replace Air Pressure Switch",price:222},{id:"p145",category:"Air Cleaner",name:"Replace Air Pressure Switch (Warranty)",price:135},{id:"p146",category:"Air Cleaner",name:"Clean Cells and Pre Filters",price:68},{id:"p147",category:"Air Cleaner",name:"Replace Cells",price:667},{id:"p148",category:"Air Cleaner",name:"Replace Cells (Warranty)",price:68},{id:"p149",category:"Air Cleaner",name:"Replace Cells Handle",price:154},{id:"p150",category:"Air Cleaner",name:"Replace Current Sensing Relay",price:154},{id:"p151",category:"Air Cleaner",name:"Replace Ionizing Wire",price:169},{id:"p152",category:"Air Cleaner",name:"Replace Power Pack",price:833},{id:"p153",category:"Air Cleaner",name:"Replace Power Pack (Warranty)",price:101},{id:"p154",category:"Air Cleaner",name:"Replace Pre Filter",price:187},
  {id:"p155",category:"Filters",name:"Replace 1\" Pleated Filter",price:30},{id:"p156",category:"Filters",name:"Replace 2\" Pleated Filter",price:48},{id:"p157",category:"Filters",name:"Replace 4\" Pleated Filter",price:73},{id:"p158",category:"Filters",name:"Replace Customer Provided Filter",price:29},
  {id:"p159",category:"Humidifier",name:"Replace Current Sensing Delay",price:163},{id:"p160",category:"Humidifier",name:"Replace Orifice",price:92},{id:"p161",category:"Humidifier",name:"Replace Humidistat",price:127},{id:"p162",category:"Humidifier",name:"Replace Humidistat (Warranty)",price:68},{id:"p163",category:"Humidifier",name:"Replace Humidifier Pad - Primary",price:68},{id:"p164",category:"Humidifier",name:"Replace Saddle Valve",price:107},{id:"p165",category:"Humidifier",name:"Replace Solenoid Valve",price:199},{id:"p166",category:"Humidifier",name:"Replace Solenoid Valve (Warranty)",price:68},{id:"p167",category:"Humidifier",name:"Replace Canister",price:134},
  {id:"p168",category:"Thermostat",name:"Install Customer Provided Thermostat",price:89},{id:"p169",category:"Thermostat",name:"Install Digital Thermostat Pro T701 & T721",price:115},{id:"p170",category:"Thermostat",name:"Install Programmable Thermostat or Ecobee",price:275},{id:"p171",category:"Thermostat",name:"Wireless Room Sensor",price:212},{id:"p172",category:"Thermostat",name:"Wall Trim Plate",price:68},{id:"p173",category:"Thermostat",name:"Outdoor Temperature Sensor",price:299},{id:"p174",category:"Thermostat",name:"Replace Thermostat Wire 2 Men Up to 50 ft",price:295},{id:"p175",category:"Thermostat",name:"Thermostat Guard Lock Box",price:110},
  {id:"p176",category:"UV Light",name:"UV Germicidal Light",price:385},{id:"p177",category:"UV Light",name:"UV Light Lennox/Goodman/Carrier/Bryant",price:198},{id:"p178",category:"UV Light",name:"Replace UV Bulb (Warranty)",price:68},
  {id:"p179",category:"Breaker/Fuse",name:"Replace Low Voltage Fuse",price:15},{id:"p180",category:"Breaker/Fuse",name:"Replace High Voltage Fuse",price:80},{id:"p181",category:"Breaker/Fuse",name:"Reset and Test/Tighten",price:34},{id:"p182",category:"Breaker/Fuse",name:"Replace Switch/Plug/Cord/Receptacle",price:127},{id:"p183",category:"Breaker/Fuse",name:"Replace Circuit Breaker",price:155},
  {id:"p184",category:"Water Leak",name:"Clean/Blowout Drain",price:78},{id:"p185",category:"Water Leak",name:"Replace Condensate Drain Up to 20 Feet",price:204},{id:"p186",category:"Water Leak",name:"Install Condensate Kill Switch",price:140},{id:"p187",category:"Water Leak",name:"Insulate Condensate Drain Up to 25'",price:187},{id:"p188",category:"Water Leak",name:"Misc Condensate Repair",price:65},{id:"p189",category:"Water Leak",name:"Replace Drain Pan W/O Opening Refrigerant System",price:378},{id:"p190",category:"Water Leak",name:"Replace Drain Pan W/O Opening Refrigerant System (Warranty)",price:297},{id:"p191",category:"Water Leak",name:"Replace Auxiliary Drain Pan",price:383},{id:"p192",category:"Water Leak",name:"Replace Condensate Pump",price:222},{id:"p193",category:"Water Leak",name:"Replace Condensate Pump with 50 Feet of Tubing",price:381},
  {id:"p194",category:"Wiring",name:"Minor Repair",price:68},{id:"p195",category:"Wiring",name:"Minor Repair Locate Short",price:135},{id:"p196",category:"Wiring",name:"Replace Thermostat Wire 1 Man Up to 50 ft",price:299},{id:"p197",category:"Wiring",name:"Replace Thermostat Wire 2 Men Up to 50 ft",price:435},{id:"p198",category:"Wiring",name:"Replace A/C Whip Up to 6' 1/2\" to 3/4\"",price:155},{id:"p199",category:"Wiring",name:"Replace Fuse Disconnect Box",price:187},
];
const PB_KEY = "fieldops_pb_405_v5";
export function loadPricebook() {
  try {
    const saved = localStorage.getItem(PB_KEY);
    if(saved){ const p=JSON.parse(saved); if(Array.isArray(p)&&p.length>10) return p; }
    localStorage.setItem(PB_KEY, JSON.stringify(PB_DEFAULTS));
    return PB_DEFAULTS;
  } catch { return PB_DEFAULTS; }
}
function savePricebook(items){ try{ localStorage.setItem(PB_KEY,JSON.stringify(items)); }catch{} }

function Pricebook() {
  const [items,setItems]=useState(()=>loadPricebook());
  const [search,setSearch]=useState("");
  const [cat,setCat]=useState("all");
  const [editing,setEditing]=useState(null);
  const [showNew,setShowNew]=useState(false);
  const [discount,setDiscount]=useState(false);
  const filtered=items.filter(i=>cat==="all"||i.category===cat).filter(i=>!search||i.name.toLowerCase().includes(search.toLowerCase())||i.category.toLowerCase().includes(search.toLowerCase()));
  function save(item){ const updated=item.id&&items.find(x=>x.id===item.id)?items.map(x=>x.id===item.id?item:x):[...items,{...item,id:"p"+Date.now()}]; savePricebook(updated); setItems(updated); setEditing(null); setShowNew(false); }
  function remove(id){ if(!window.confirm("Delete this item?"))return; const updated=items.filter(x=>x.id!==id); savePricebook(updated); setItems(updated); }
  function reset(){ if(!window.confirm("Reset to 405 default pricebook?"))return; savePricebook(PB_DEFAULTS); setItems(PB_DEFAULTS); }
  function displayPrice(price){ const p=parseFloat(price); return discount?(p*0.85).toFixed(2):p.toFixed(2); }
  const pbInp={width:"100%",padding:"9px 12px",borderRadius:8,fontSize:13,border:"1px solid var(--border2)",outline:"none",fontFamily:"var(--sans)",boxSizing:"border-box",background:"var(--surface2)",color:"var(--text1)"};
  return (
    <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
      <div style={{padding:"14px 20px",background:"var(--surface)",borderBottom:"1px solid var(--border)",flexShrink:0}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <div><div style={{fontSize:16,fontWeight:700,fontFamily:"var(--display)",color:"var(--text1)"}}>Pricebook</div><div style={{fontSize:12,color:"var(--text3)",marginTop:2}}>{items.length} items · {discount?"15% discount applied":"Regular pricing"}</div></div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            <button onClick={()=>setDiscount(p=>!p)} style={{fontSize:12,fontWeight:600,padding:"5px 12px",borderRadius:8,border:`1px solid ${discount?"var(--amber-bd)":"var(--border)"}`,background:discount?"var(--amber-lt)":"var(--surface2)",color:discount?"var(--amber)":"var(--text3)",cursor:"pointer",transition:"all .15s"}}>
              {discount?"✓ 15% OFF":"% 15% Discount"}
            </button>
            <Btn small variant="secondary" onClick={reset}>Reset</Btn>
            <Btn small onClick={()=>setShowNew(true)}>+ Add Item</Btn>
          </div>
        </div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          <div style={{position:"relative",flex:1,minWidth:160}}>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search items…" style={{...pbInp,paddingLeft:28}}/>
            <span style={{position:"absolute",left:9,top:"50%",transform:"translateY(-50%)",color:"var(--text3)",fontSize:13}}>⌕</span>
          </div>
          <select value={cat} onChange={e=>setCat(e.target.value)} style={{...pbInp,width:"auto",minWidth:140}}>
            <option value="all">All Categories</option>
            {CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>
      <div style={{flex:1,overflowY:"auto"}}>
        {filtered.length===0
          ?<EmptyState icon="💲" title="No items found" desc="Try a different search or category" />
          :filtered.map(item=>(
            <div key={item.id} style={{padding:"12px 20px",borderBottom:"1px solid var(--border)",display:"flex",justifyContent:"space-between",alignItems:"center",gap:12}} onMouseEnter={e=>e.currentTarget.style.background="var(--surface2)"} onMouseLeave={e=>e.currentTarget.style.background=""}>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:13,fontWeight:600,color:"var(--text1)",marginBottom:2}}>{item.name}</div>
                <div style={{fontSize:11,color:"var(--text3)"}}>{item.category}{item.description?` · ${item.description}`:""}</div>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
                {discount&&<span style={{fontSize:11,color:"var(--text4)",textDecoration:"line-through",fontFamily:"var(--mono)"}}>${parseFloat(item.price).toFixed(2)}</span>}
                <span style={{fontSize:15,fontWeight:700,color:discount?"var(--amber)":"var(--green)",fontFamily:"var(--mono)"}}>${displayPrice(item.price)}</span>
                <Btn small variant="secondary" onClick={()=>setEditing(item)}>Edit</Btn>
                <Btn small variant="danger" onClick={()=>remove(item.id)}>✕</Btn>
              </div>
            </div>
          ))
        }
      </div>
      {(editing||showNew)&&(
        <Modal title={editing?"Edit Item":"New Item"} onClose={()=>{setEditing(null);setShowNew(false);}}>
          <PbItemForm item={editing||{name:"",category:CATEGORIES[0],price:"",description:""}} onSave={save} onClose={()=>{setEditing(null);setShowNew(false);}}/>
        </Modal>
      )}
    </div>
  );
}
function PbItemForm({item,onSave,onClose}){
  const [f,setF]=useState({...item});
  return(
    <div>
      <div style={{padding:"18px 24px",display:"flex",flexDirection:"column",gap:14}}>
        <FormField label="Item Name *"><input style={inputStyle} value={f.name} onChange={e=>setF(p=>({...p,name:e.target.value}))} placeholder="e.g. Replace Dual Capacitor"/></FormField>
        <FormField label="Category *"><select style={inputStyle} value={f.category} onChange={e=>setF(p=>({...p,category:e.target.value}))}>{CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}</select></FormField>
        <FormField label="Price *"><input style={inputStyle} type="number" min="0" step="0.01" value={f.price} onChange={e=>setF(p=>({...p,price:e.target.value}))} placeholder="0.00"/></FormField>
        <FormField label="Notes"><input style={inputStyle} value={f.description||""} onChange={e=>setF(p=>({...p,description:e.target.value}))} placeholder="Optional notes"/></FormField>
      </div>
      <div style={{padding:"14px 24px",borderTop:"1px solid var(--border)",display:"flex",justifyContent:"flex-end",gap:10}}>
        <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
        <Btn onClick={()=>{if(!f.name||!f.price){alert("Name and price required");return;}onSave(f);}}>{f.id?"Save Changes":"Add Item"}</Btn>
      </div>
    </div>
  );
}

// ── APP SHELL ──
const PAGE_TITLES_MAP = {"/":"Dashboard","/dispatch":"Dispatch","/customers":"Customers","/jobs":"Jobs","/invoices":"Work Orders","/team":"Team","/workorder":"Work Order","/pricebook":"Pricebook","/reports":"Reports","/estimates":"Estimates","/templates":"Job Templates"};
const MOBILE_NAV = [
  {id:"/",icon:"⊞",label:"Home"},
  {id:"/jobs",icon:"🔧",label:"Jobs"},
  {id:"/customers",icon:"👥",label:"Customers"},
  {id:"/dispatch",icon:"📡",label:"Dispatch"},
  {id:"/invoices",icon:"📄",label:"Work Orders"},
  {id:"/estimates",icon:"📝",label:"Estimates"},
  {id:"/pricebook",icon:"💲",label:"Pricebook"},
  {id:"/templates",icon:"📌",label:"Templates"},
  {id:"/team",icon:"👷",label:"Team"},
  {id:"/reports",icon:"📊",label:"Reports"},
];

function ReportsScreen() {
  const { navigate } = useRouter();
  const [jobs,setJobs]=useState([]); const [workOrders,setWorkOrders]=useState([]); const [loading,setLoading]=useState(true);
  const [paymentFilter,setPaymentFilter]=useState(null); // null | 'Cash' | 'Check' | 'Square'
  useEffect(()=>{ async function load(){try{const [j,wo]=await Promise.all([apiFetch("/jobs?limit=500").catch(()=>[]),apiFetch("/work-orders?limit=500").catch(()=>({data:[]}))]); setJobs(Array.isArray(j)?j:[]); setWorkOrders(Array.isArray(wo)?wo:Array.isArray(wo?.data)?wo.data:[]);} catch(e){console.error(e);} setLoading(false);} load();},[]);
  const months=[];
  for(let i=5;i>=0;i--){const d=new Date();d.setMonth(d.getMonth()-i);months.push({label:d.toLocaleString("default",{month:"short",year:"2-digit"}),month:d.getMonth(),year:d.getFullYear(),revenue:0,count:0});}
  workOrders.forEach(wo=>{const amt=parseFloat(wo.total_amount||wo.totalAmount||0);if(!amt)return;const d=new Date(wo.created_at||wo.saved_at||wo.savedAt||wo.createdAt);if(isNaN(d))return;const m=months.find(x=>x.month===d.getMonth()&&x.year===d.getFullYear());if(m){m.revenue+=amt;m.count++;}});
  const maxRev=Math.max(...months.map(m=>m.revenue),1), totalRev=months.reduce((s,m)=>s+m.revenue,0), totalJobs=jobs.length, completedJobs=jobs.filter(j=>j.status==="completed").length;
  const fmt$=v=>"$"+Number(v).toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2});
  const statusCounts={};jobs.forEach(j=>{statusCounts[j.status]=(statusCounts[j.status]||0)+1;});
  const statusColors={completed:"#10B981",scheduled:"#3B82F6",pending:"#F59E0B",cancelled:"#EF4444","in-progress":"#8B5CF6"};

  // Payment breakdown using localStorage payments
  const payments = loadPayments();
  const cashWOs = workOrders.filter(wo=>{ const p=payments[wo.id]; return p?.method==="Cash"; });
  const checkWOs = workOrders.filter(wo=>{ const p=payments[wo.id]; return p?.method==="Check"; });
  const squareWOs = workOrders.filter(wo=>{ const p=payments[wo.id]; return p?.method==="Square" || wo.paymentMethod==="Square"; });

  const filteredWOs = paymentFilter==="Cash"?cashWOs:paymentFilter==="Check"?checkWOs:paymentFilter==="Square"?squareWOs:[];

  return (
    <div style={{ flex:1,overflowY:"auto",padding:24,background:"var(--bg)" }}>
      <div style={{ maxWidth:900,margin:"0 auto" }}>
        <div style={{ marginBottom:24 }}><h2 style={{ fontSize:22,fontWeight:700,margin:0 }}>Revenue Reports</h2><div style={{ fontSize:13,color:"var(--text3)",marginTop:4 }}>Last 6 months overview</div></div>
        {loading?<div style={{ textAlign:"center",padding:60,color:"var(--text3)" }}>Loading...</div>:(<>
          <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:16,marginBottom:24 }}>
            {[{label:"6-Month Revenue",val:fmt$(totalRev),icon:"💰",color:"#10B981"},{label:"Total Jobs",val:totalJobs,icon:"🔧",color:"#3B82F6"},{label:"Completed Jobs",val:completedJobs,icon:"✅",color:"#7C3AED"}].map(c=>(
              <div key={c.label} style={{ background:"var(--surface)",border:"1px solid var(--border)",borderRadius:12,padding:"20px 24px" }}><div style={{ fontSize:11,color:"var(--text3)",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:8 }}>{c.label}</div><div style={{ fontSize:28,fontWeight:800,color:c.color }}>{c.val}</div></div>
            ))}
          </div>

          {/* Payment Method Breakdown */}
          <div style={{ background:"var(--surface)",border:"1px solid var(--border)",borderRadius:12,padding:24,marginBottom:24 }}>
            <div style={{ fontSize:15,fontWeight:700,marginBottom:16 }}>Payments by Method</div>
            <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:paymentFilter?16:0 }}>
              {[
                {key:"Cash",icon:"💵",count:cashWOs.length,total:cashWOs.reduce((s,w)=>s+(parseFloat(w.total_amount||w.totalAmount)||0),0),color:"#10B981"},
                {key:"Check",icon:"📝",count:checkWOs.length,total:checkWOs.reduce((s,w)=>s+(parseFloat(w.total_amount||w.totalAmount)||0),0),color:"#3B82F6"},
                {key:"Square",icon:"🟦",count:squareWOs.length,total:squareWOs.reduce((s,w)=>s+(parseFloat(w.total_amount||w.totalAmount)||0),0),color:"#7C3AED"},
              ].map(m=>(
                <button key={m.key} onClick={()=>setPaymentFilter(p=>p===m.key?null:m.key)} style={{ background:paymentFilter===m.key?"var(--surface3)":"var(--surface2)",border:`1px solid ${paymentFilter===m.key?"var(--border2)":"var(--border)"}`,borderRadius:10,padding:"14px",textAlign:"left",cursor:"pointer",transition:"all .15s" }}>
                  <div style={{ fontSize:20,marginBottom:8 }}>{m.icon}</div>
                  <div style={{ fontSize:13,fontWeight:700,color:"var(--text1)",marginBottom:2 }}>{m.key}</div>
                  <div style={{ fontSize:11,color:"var(--text3)",marginBottom:6 }}>{m.count} work order{m.count!==1?"s":""}</div>
                  <div style={{ fontSize:16,fontFamily:"var(--mono)",fontWeight:700,color:m.color }}>{fmt$(m.total)}</div>
                </button>
              ))}
            </div>
            {paymentFilter&&(
              <div style={{ borderTop:"1px solid var(--border)",paddingTop:16 }}>
                <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10 }}>
                  <div style={{ fontSize:13,fontWeight:600 }}>{paymentFilter} Payments ({filteredWOs.length})</div>
                  <button onClick={()=>setPaymentFilter(null)} style={{ fontSize:11,background:"none",border:"none",color:"var(--text3)",cursor:"pointer" }}>✕ Clear</button>
                </div>
                {filteredWOs.length===0?<div style={{ fontSize:13,color:"var(--text3)",fontStyle:"italic" }}>No {paymentFilter} payments recorded yet.</div>:
                  <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
                    {filteredWOs.map(wo=>(
                      <div key={wo.id} style={{ background:"var(--surface2)",border:"1px solid var(--border)",borderRadius:8,padding:"10px 14px",display:"flex",justifyContent:"space-between",alignItems:"center" }}>
                        <div>
                          <div style={{ fontSize:13,fontWeight:600 }}>{wo.customer||wo.customer_name||"—"}</div>
                          <div style={{ fontSize:11,color:"var(--text3)" }}>WO#{wo.wo_number||wo.wo||"—"} · {wo.date||fmtDate(wo.created_at)||"—"}{payments[wo.id]?.checkNumber?` · Check #${payments[wo.id].checkNumber}`:""}</div>
                        </div>
                        <div style={{ fontSize:15,fontFamily:"var(--mono)",fontWeight:700,color:"var(--green)" }}>{fmt$(parseFloat(wo.total_amount||wo.totalAmount)||0)}</div>
                      </div>
                    ))}
                  </div>
                }
              </div>
            )}
          </div>

          <div style={{ background:"var(--surface)",border:"1px solid var(--border)",borderRadius:12,padding:24,marginBottom:24 }}>
            <div style={{ fontSize:15,fontWeight:700,marginBottom:20 }}>Revenue by Month</div>
            <div style={{ display:"flex",alignItems:"flex-end",gap:12,height:180 }}>
              {months.map(m=>(<div key={m.label} style={{ flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:6 }}><div style={{ fontSize:11,color:"var(--text3)",fontWeight:600 }}>{m.revenue>0?fmt$(m.revenue):"—"}</div><div style={{ width:"100%",borderRadius:"6px 6px 0 0",background:m.revenue>0?"linear-gradient(180deg,#3B82F6,#1D4ED8)":"var(--border)",height:m.revenue>0?`${Math.max((m.revenue/maxRev)*140,4)}px`:"4px",transition:"height .3s" }} /><div style={{ fontSize:11,color:"var(--text3)",fontWeight:500 }}>{m.label}</div>{m.count>0&&<div style={{ fontSize:10,color:"var(--text3)" }}>{m.count} WO</div>}</div>))}
            </div>
            {totalRev===0&&<div style={{ textAlign:"center",color:"var(--text3)",fontSize:13,marginTop:12 }}>No revenue data yet.</div>}
          </div>
          <div style={{ background:"var(--surface)",border:"1px solid var(--border)",borderRadius:12,padding:24 }}>
            <div style={{ fontSize:15,fontWeight:700,marginBottom:16 }}>Job Status Breakdown</div>
            {Object.keys(statusCounts).length===0?<div style={{ color:"var(--text3)",fontSize:13 }}>No jobs yet.</div>:(
              <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
                {Object.entries(statusCounts).map(([status,count])=>(<div key={status} style={{ display:"flex",alignItems:"center",gap:12 }}><div style={{ width:10,height:10,borderRadius:"50%",background:statusColors[status]||"#8899BB",flexShrink:0 }} /><div style={{ width:110,fontSize:13,fontWeight:600,textTransform:"capitalize" }}>{status}</div><div style={{ flex:1,background:"var(--border)",borderRadius:4,height:8,overflow:"hidden" }}><div style={{ width:`${(count/totalJobs)*100}%`,height:"100%",background:statusColors[status]||"#8899BB",borderRadius:4 }} /></div><div style={{ fontSize:13,fontWeight:700,width:30,textAlign:"right" }}>{count}</div></div>))}
              </div>
            )}
          </div>
        </>)}
      </div>
    </div>
  );
}

function CustomerPortalScreen() {
  const wo=(()=>{try{const params=new URLSearchParams(window.location.hash.split("?")[1]);const data=params.get("wo");return data?JSON.parse(decodeURIComponent(data)):null;}catch{return null;}})();
  if(!wo) return (<div style={{ minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#f1f3f7",padding:24 }}><div style={{ textAlign:"center",color:"#666" }}><div style={{ fontSize:48,marginBottom:12 }}>🔍</div><div style={{ fontSize:18,fontWeight:700,marginBottom:8 }}>Work Order Not Found</div><div style={{ fontSize:14 }}>This link may have expired or is invalid.</div></div></div>);
  const materials=(wo.materials||[]).filter(m=>m.description);
  return (
    <div style={{ minHeight:"100vh",background:"#f1f3f7",padding:16 }}>
      <div style={{ maxWidth:600,margin:"0 auto" }}>
        <div style={{ background:"#1a3a6b",borderRadius:"12px 12px 0 0",padding:"20px 24px",display:"flex",justifyContent:"space-between",alignItems:"center" }}>
          <div><div style={{ fontSize:20,fontWeight:900,color:"#fff" }}>405 Heating & Air</div><div style={{ fontSize:12,color:"#8bb4e8",marginTop:2 }}>Work Order Summary</div></div>
          <div style={{ textAlign:"right" }}><div style={{ fontSize:11,color:"#8bb4e8",textTransform:"uppercase",letterSpacing:"0.08em" }}>WO#</div><div style={{ fontSize:22,fontWeight:900,color:"#fff" }}>{wo.wo||"—"}</div></div>
        </div>
        <div style={{ background:"#fff",padding:20,borderRadius:"0 0 12px 12px",boxShadow:"0 4px 20px #00000015" }}>
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16 }}>
            {[["Customer",wo.customer],["Date",wo.date],["Technician",wo.technician],["Phone","405-215-7685"]].filter(([,v])=>v).map(([l,v])=>(<div key={l}><div style={{ fontSize:10,fontWeight:700,color:"#888",textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:4 }}>{l}</div><div style={{ fontSize:14,fontWeight:500 }}>{v}</div></div>))}
          </div>
          {wo.complaint&&<div style={{ background:"#f8f9fb",borderRadius:8,padding:14,marginBottom:16 }}><div style={{ fontSize:10,fontWeight:700,color:"#888",textTransform:"uppercase",marginBottom:6 }}>Issue</div><div style={{ fontSize:14 }}>{wo.complaint}</div></div>}
          {wo.descriptionOfWork&&<div style={{ background:"#f8f9fb",borderRadius:8,padding:14,marginBottom:16 }}><div style={{ fontSize:10,fontWeight:700,color:"#888",textTransform:"uppercase",marginBottom:6 }}>Work Performed</div><div style={{ fontSize:14,lineHeight:1.6,whiteSpace:"pre-wrap" }}>{wo.descriptionOfWork}</div></div>}
          {materials.length>0&&<div style={{ marginBottom:16 }}><div style={{ fontSize:10,fontWeight:700,color:"#888",textTransform:"uppercase",marginBottom:8 }}>Materials</div>{materials.map((m,i)=><div key={i} style={{ display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:"1px solid #e4e8ef",fontSize:13 }}><span>{m.qty&&m.qty!=="1"?`${m.qty}x `:""}{m.description}</span><span style={{ fontWeight:600,color:"#0d7b4e" }}>{m.amount?"$"+m.amount:""}</span></div>)}</div>}
          <div style={{ background:"#1a3a6b",borderRadius:10,padding:"16px 20px",display:"flex",justifyContent:"space-between",alignItems:"center" }}><div style={{ fontSize:13,color:"#8bb4e8",fontWeight:600 }}>Total Due</div><div style={{ fontSize:28,fontWeight:900,color:"#fff" }}>{wo.totalAmount?"$"+wo.totalAmount:"$0.00"}</div></div>
          {wo.recommendations&&<div style={{ marginTop:16,background:"#fffbeb",border:"1px solid #fcd34d",borderRadius:8,padding:14 }}><div style={{ fontSize:10,fontWeight:700,color:"#b45309",textTransform:"uppercase",marginBottom:6 }}>Recommendations</div><div style={{ fontSize:13,lineHeight:1.6 }}>{wo.recommendations}</div></div>}
          <div style={{ marginTop:20,textAlign:"center",fontSize:12,color:"#888",borderTop:"1px solid #e4e8ef",paddingTop:16 }}><div style={{ fontWeight:600,color:"#333",marginBottom:4 }}>405 Heating and Air Conditioning</div><div>426 W Boomer St, Lexington, OK · 405-215-7685</div></div>
        </div>
      </div>
    </div>
  );
}

function AssignTechBtn({ job, onAssigned }) {
  const [techs,setTechs]=useState([]); const [open,setOpen]=useState(false); const [saving,setSaving]=useState(false);
  async function loadTechs(){if(techs.length){setOpen(true);return;}try{const d=await apiFetch("/users?limit=100");setTechs(Array.isArray(d)?d.filter(u=>u.role==="technician"||u.role==="admin"):[]);}catch{}setOpen(true);}
  async function assign(techId){setSaving(true);try{await apiFetch(`/jobs/${job.id}`,{method:"PATCH",body:JSON.stringify({technician_ids:[techId]})});setOpen(false);if(onAssigned)onAssigned();}catch(e){alert(e.message);}setSaving(false);}
  return (
    <div style={{ position:"relative",display:"inline-block" }}>
      <Btn small variant="secondary" onClick={loadTechs}>👷 Assign</Btn>
      {open&&(<div style={{ position:"fixed",inset:0,zIndex:200 }} onClick={()=>setOpen(false)}><div style={{ position:"absolute",background:"var(--surface2)",border:"1px solid var(--border2)",borderRadius:10,boxShadow:"0 8px 32px rgba(0,0,0,0.5)",minWidth:200,zIndex:201,padding:8 }} onClick={e=>e.stopPropagation()}><div style={{ fontSize:10,fontWeight:700,color:"var(--text4)",padding:"4px 8px 8px",textTransform:"uppercase",letterSpacing:"0.08em" }}>Assign Technician</div>{techs.length===0?<div style={{ padding:"8px",fontSize:13,color:"var(--text3)" }}>No technicians found</div>:techs.map(t=>(<button key={t.id} onClick={()=>assign(t.id)} disabled={saving} style={{ display:"block",width:"100%",textAlign:"left",padding:"9px 12px",background:"none",border:"none",fontSize:13,cursor:"pointer",borderRadius:6,fontFamily:"var(--sans)",color:"var(--text1)",fontWeight:500 }} onMouseEnter={e=>{e.currentTarget.style.background="var(--surface3)";e.currentTarget.style.color="var(--text1)";}} onMouseLeave={e=>{e.currentTarget.style.background="none";}}>{t.name}</button>))}</div></div>)}
    </div>
  );
}

// ── ESTIMATES SCREEN ──
function TemplatesScreen() {
  const [templates, setTemplates] = useState(loadTemplates());
  const [editing, setEditing] = useState(null); // null | template object
  const [showNew, setShowNew] = useState(false);
  const ICONS = ["🔧","❄️","🔥","🌡️","🧊","🏗️","⚡","💧","📋","🛠️","🔩","✅"];

  function save(t) {
    const updated = editing?.id
      ? templates.map(x => x.id===editing.id ? t : x)
      : [...templates, { ...t, id: "t"+Date.now() }];
    saveTemplates(updated); setTemplates(updated); setEditing(null); setShowNew(false);
  }
  function remove(id) {
    if(!window.confirm("Delete this template?")) return;
    const updated = templates.filter(x=>x.id!==id);
    saveTemplates(updated); setTemplates(updated);
  }
  function reset() {
    if(!window.confirm("Reset to default templates? This will remove any custom templates.")) return;
    saveTemplates(DEFAULT_TEMPLATES); setTemplates(DEFAULT_TEMPLATES);
  }

  return (
    <div style={{ flex:1,display:"flex",flexDirection:"column",overflow:"hidden" }}>
      {(editing||showNew)&&<TemplateEditModal template={editing||{icon:"🔧",name:"",title:"",description:"",priority:"normal"}} icons={ICONS} onClose={()=>{setEditing(null);setShowNew(false);}} onSave={save} />}
      <div style={{ padding:"14px 20px",background:"var(--surface)",borderBottom:"1px solid var(--border)",display:"flex",justifyContent:"space-between",alignItems:"center",flexShrink:0 }}>
        <div>
          <div style={{ fontSize:16,fontFamily:"var(--display)",fontWeight:700 }}>Job Templates</div>
          <div style={{ fontSize:12,color:"var(--text3)",marginTop:2 }}>Quick-start templates for common job types</div>
        </div>
        <div style={{ display:"flex",gap:8 }}>
          <Btn small variant="secondary" onClick={reset}>Reset defaults</Btn>
          <Btn small onClick={()=>setShowNew(true)}>+ New Template</Btn>
        </div>
      </div>
      <div style={{ flex:1,overflowY:"auto",padding:16 }}>
        <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:12 }}>
          {templates.map(t=>(
            <Card key={t.id} style={{ padding:"16px 18px" }}>
              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10 }}>
                <div style={{ display:"flex",alignItems:"center",gap:10 }}>
                  <span style={{ fontSize:24 }}>{t.icon}</span>
                  <div>
                    <div style={{ fontSize:14,fontWeight:700,fontFamily:"var(--display)" }}>{t.name}</div>
                    <span style={{ fontSize:10,fontWeight:600,color:t.priority==="urgent"?"var(--red)":t.priority==="high"?"var(--amber)":"var(--text4)",background:t.priority==="urgent"?"var(--red-lt)":t.priority==="high"?"var(--amber-lt)":"var(--surface2)",border:`1px solid ${t.priority==="urgent"?"var(--red-bd)":t.priority==="high"?"var(--amber-bd)":"var(--border)"}`,borderRadius:4,padding:"1px 7px" }}>{t.priority.charAt(0).toUpperCase()+t.priority.slice(1)}</span>
                  </div>
                </div>
                <div style={{ display:"flex",gap:6 }}>
                  <Btn small variant="secondary" onClick={()=>setEditing(t)}>Edit</Btn>
                  <Btn small variant="danger" onClick={()=>remove(t.id)}>✕</Btn>
                </div>
              </div>
              <div style={{ fontSize:13,fontWeight:600,color:"var(--text1)",marginBottom:4 }}>{t.title}</div>
              {t.description&&<div style={{ fontSize:12,color:"var(--text3)",lineHeight:1.5 }}>{t.description}</div>}
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

function TemplateEditModal({ template, icons, onClose, onSave }) {
  const [f, setF] = useState({ ...template });
  function set(k,v) { setF(p=>({...p,[k]:v})); }
  return (
    <Modal title={f.id ? "Edit Template" : "New Template"} onClose={onClose}>
      <div style={{ padding:"18px 24px",display:"flex",flexDirection:"column",gap:14 }}>
        <div>
          <div style={{ fontSize:11,fontWeight:600,color:"var(--text3)",textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:8 }}>Icon</div>
          <div style={{ display:"flex",flexWrap:"wrap",gap:6 }}>
            {icons.map(ic=><button key={ic} onClick={()=>set("icon",ic)} style={{ fontSize:20,width:36,height:36,borderRadius:8,border:f.icon===ic?"2px solid var(--blue)":"1px solid var(--border)",background:f.icon===ic?"var(--blue-lt)":"var(--surface2)",cursor:"pointer" }}>{ic}</button>)}
          </div>
        </div>
        <FormField label="Template Name *"><input style={inputStyle} value={f.name} onChange={e=>set("name",e.target.value)} placeholder="e.g. AC Tune-Up" /></FormField>
        <FormField label="Job Title *"><input style={inputStyle} value={f.title} onChange={e=>set("title",e.target.value)} placeholder="Title that appears on the job" /></FormField>
        <FormField label="Default Description"><textarea style={{...inputStyle,height:80,resize:"vertical"}} value={f.description} onChange={e=>set("description",e.target.value)} placeholder="Pre-filled description…" /></FormField>
        <FormField label="Default Priority"><select style={inputStyle} value={f.priority} onChange={e=>set("priority",e.target.value)}>{["low","normal","high","urgent"].map(p=><option key={p} value={p}>{p.charAt(0).toUpperCase()+p.slice(1)}</option>)}</select></FormField>
      </div>
      <div style={{ padding:"14px 24px",borderTop:"1px solid var(--border)",display:"flex",justifyContent:"flex-end",gap:10 }}>
        <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
        <Btn onClick={()=>{ if(!f.name||!f.title){alert("Name and title required");return;} onSave(f); }}>{f.id?"Save Changes":"Create Template"}</Btn>
      </div>
    </Modal>
  );
}

function EstimatesScreen() {
  const [estimates,setEstimates]=useState([]); const [loading,setLoading]=useState(true); const [showNew,setShowNew]=useState(false); const [customers,setCustomers]=useState([]);
  useEffect(()=>{Promise.all([apiFetch("/estimates?limit=100").catch(()=>[]),apiFetch("/customers?limit=100").catch(()=>[])]).then(([e,c])=>{setEstimates(Array.isArray(e)?e:[]);setCustomers(Array.isArray(c)?c:[]);}).finally(()=>setLoading(false));},[]);
  return (
    <div style={{ flex:1,display:"flex",flexDirection:"column",overflow:"hidden" }}>
      {showNew&&<NewEstimateModal customers={customers} onClose={()=>setShowNew(false)} onSave={e=>{setEstimates(p=>[e,...p]);setShowNew(false);}} />}
      <div style={{ padding:"14px 20px",background:"var(--surface)",borderBottom:"1px solid var(--border)",display:"flex",justifyContent:"space-between",alignItems:"center",flexShrink:0 }}>
        <div><div style={{ fontSize:16,fontFamily:"var(--display)",fontWeight:700 }}>Estimates</div><div style={{ fontSize:12,color:"var(--text3)",marginTop:2 }}>{estimates.length} estimate{estimates.length!==1?"s":""}</div></div>
        <Btn small onClick={()=>setShowNew(true)}>+ New Estimate</Btn>
      </div>
      <div style={{ flex:1,overflowY:"auto",padding:16 }}>
        {loading?<Spinner />:estimates.length===0?<EmptyState icon="📝" title="No estimates yet" desc="Create your first estimate to send to a customer" action={<Btn onClick={()=>setShowNew(true)}>+ New Estimate</Btn>} />:(
          <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
            {estimates.map(est=>(<Card key={est.id} style={{ padding:"14px 18px" }}><div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6 }}><div><div style={{ fontSize:11,fontFamily:"var(--mono)",color:"var(--text3)",marginBottom:3 }}>{est.estimate_number||est.id?.slice(0,8)}</div><div style={{ fontSize:15,fontWeight:700 }}>{est.title||"Estimate"}</div><div style={{ fontSize:13,color:"var(--text3)",marginTop:2 }}>{est.customer_name||"Customer"}</div></div><div style={{ textAlign:"right" }}><div style={{ fontSize:18,fontFamily:"var(--mono)",fontWeight:700,color:"var(--green)" }}>${parseFloat(est.total||est.subtotal||0).toFixed(2)}</div><Chip status={est.status||"draft"} /></div></div><div style={{ fontSize:12,color:"var(--text3)" }}>{fmtDate(est.created_at)}</div></Card>))}
          </div>
        )}
      </div>
    </div>
  );
}

function NewEstimateModal({ customers, onClose, onSave }) {
  const [form,setForm]=useState({customer_id:"",title:"",notes:"",tax_rate:8.75});
  const [lines,setLines]=useState([{description:"",qty:1,unit_price:""}]);
  const [saving,setSaving]=useState(false);
  function addLine(){setLines(p=>[...p,{description:"",qty:1,unit_price:""}]);}
  function removeLine(i){setLines(p=>p.filter((_,idx)=>idx!==i));}
  function updateLine(i,field,val){setLines(p=>p.map((l,idx)=>idx===i?{...l,[field]:val}:l));}
  const subtotal=lines.reduce((s,l)=>s+(parseFloat(l.unit_price)||0)*(parseInt(l.qty)||1),0);
  const tax=subtotal*(parseFloat(form.tax_rate)||0)/100, total=subtotal+tax;
  async function handleSave(){
    if(!form.customer_id){alert("Please select a customer");return;}
    if(!form.title.trim()){alert("Please enter a title");return;}
    setSaving(true);
    try{const payload={customer_id:form.customer_id,title:form.title,notes:form.notes,tax_rate:parseFloat(form.tax_rate)||0,line_items:lines.filter(l=>l.description).map(l=>({description:l.description,qty:parseInt(l.qty)||1,unit_price:parseFloat(l.unit_price)||0,total:(parseFloat(l.unit_price)||0)*(parseInt(l.qty)||1)})),subtotal,tax,total,status:"draft"};let saved;try{saved=await apiFetch("/estimates",{method:"POST",body:JSON.stringify(payload)});}catch{}onSave(saved||{...payload,id:Date.now().toString(),created_at:new Date().toISOString()});}finally{setSaving(false);}
  }
  const inp={width:"100%",padding:"9px 12px",borderRadius:7,fontSize:13,border:"1px solid var(--border)",outline:"none",fontFamily:"var(--sans)",boxSizing:"border-box"};
  return (
    <Modal title="New Estimate" onClose={onClose} width={640}>
      <div style={{ padding:"20px 24px",display:"flex",flexDirection:"column",gap:14,maxHeight:"70vh",overflowY:"auto" }}>
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12 }}>
          <FormField label="Customer *"><select style={inp} value={form.customer_id} onChange={e=>setForm(p=>({...p,customer_id:e.target.value}))}><option value="">Select customer…</option>{customers.map(c=><option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>)}</select></FormField>
          <FormField label="Title *"><input style={inp} value={form.title} onChange={e=>setForm(p=>({...p,title:e.target.value}))} placeholder="e.g. AC Tune-Up & Repair" /></FormField>
        </div>
        <div>
          <div style={{ fontSize:11,fontWeight:700,color:"var(--text2)",letterSpacing:"0.05em",textTransform:"uppercase",marginBottom:8,fontFamily:"var(--display)" }}>Line Items</div>
          <table style={{ width:"100%",borderCollapse:"collapse",fontSize:13 }}>
            <thead><tr style={{ background:"var(--surface2)" }}><th style={{ padding:"6px 10px",textAlign:"left",fontSize:11,fontWeight:600,color:"var(--text3)",borderBottom:"1px solid var(--border)" }}>Description</th><th style={{ padding:"6px 10px",textAlign:"center",fontSize:11,fontWeight:600,color:"var(--text3)",borderBottom:"1px solid var(--border)",width:60 }}>Qty</th><th style={{ padding:"6px 10px",textAlign:"right",fontSize:11,fontWeight:600,color:"var(--text3)",borderBottom:"1px solid var(--border)",width:100 }}>Unit Price</th><th style={{ padding:"6px 10px",textAlign:"right",fontSize:11,fontWeight:600,color:"var(--text3)",borderBottom:"1px solid var(--border)",width:90 }}>Total</th><th style={{ width:30,borderBottom:"1px solid var(--border)" }}></th></tr></thead>
            <tbody>{lines.map((l,i)=>(<tr key={i} style={{ borderBottom:"1px solid var(--border)" }}><td style={{ padding:"6px 8px" }}><input style={{...inp,padding:"6px 8px"}} value={l.description} onChange={e=>updateLine(i,"description",e.target.value)} placeholder="Description" /></td><td style={{ padding:"6px 8px" }}><input type="number" min="1" style={{...inp,padding:"6px 8px",textAlign:"center"}} value={l.qty} onChange={e=>updateLine(i,"qty",e.target.value)} /></td><td style={{ padding:"6px 8px" }}><input type="number" min="0" step="0.01" style={{...inp,padding:"6px 8px",textAlign:"right"}} value={l.unit_price} onChange={e=>updateLine(i,"unit_price",e.target.value)} placeholder="0.00" /></td><td style={{ padding:"6px 8px",textAlign:"right",fontWeight:600,color:"var(--green)" }}>${((parseFloat(l.unit_price)||0)*(parseInt(l.qty)||1)).toFixed(2)}</td><td style={{ padding:"6px 8px",textAlign:"center" }}>{lines.length>1&&<button onClick={()=>removeLine(i)} style={{ background:"none",border:"none",color:"var(--red)",cursor:"pointer",fontSize:16 }}>×</button>}</td></tr>))}</tbody>
          </table>
          <button onClick={addLine} style={{ marginTop:8,background:"none",border:"1px dashed var(--border)",borderRadius:6,padding:"6px 14px",fontSize:12,color:"var(--text3)",cursor:"pointer",width:"100%" }}>+ Add line item</button>
        </div>
        <div style={{ display:"flex",justifyContent:"flex-end" }}>
          <div style={{ background:"var(--surface2)",border:"1px solid var(--border)",borderRadius:10,padding:"14px 20px",minWidth:200 }}>
            <div style={{ display:"flex",justifyContent:"space-between",fontSize:13,marginBottom:6 }}><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
            <div style={{ display:"flex",justifyContent:"space-between",fontSize:13,marginBottom:6,alignItems:"center" }}><span>Tax %</span><input type="number" min="0" step="0.01" style={{ width:60,padding:"3px 6px",border:"1px solid var(--border)",borderRadius:4,fontSize:12,textAlign:"right" }} value={form.tax_rate} onChange={e=>setForm(p=>({...p,tax_rate:e.target.value}))} /></div>
            <div style={{ display:"flex",justifyContent:"space-between",fontSize:13,marginBottom:8 }}><span>Tax</span><span>${tax.toFixed(2)}</span></div>
            <div style={{ display:"flex",justifyContent:"space-between",fontSize:17,fontWeight:800,color:"var(--blue)",borderTop:"1px solid var(--border)",paddingTop:8 }}><span>Total</span><span>${total.toFixed(2)}</span></div>
          </div>
        </div>
        <FormField label="Notes (visible to customer)"><textarea style={{...inp,height:80,resize:"vertical"}} value={form.notes} onChange={e=>setForm(p=>({...p,notes:e.target.value}))} placeholder="Thank you for your business…" /></FormField>
      </div>
      <div style={{ padding:"16px 24px",borderTop:"1px solid var(--border)",display:"flex",justifyContent:"flex-end",gap:10 }}><Btn variant="secondary" onClick={onClose}>Cancel</Btn><Btn onClick={handleSave} disabled={saving}>{saving?"Saving…":"Save Estimate"}</Btn></div>
    </Modal>
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
      const jobId = wo.jobId||currentJob?.jobId;
      if(jobId){
        try {
          const token = getToken();
          await fetch(`${API_URL}/jobs/${jobId}/status`,{method:"PATCH",headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`},body:JSON.stringify({status:"completed"})});
        } catch(e){ console.error("Auto-complete failed:",e); }
      }
      setCurrentJob(null);
    }} />,
    "/pricebook": <Pricebook />,
    "/templates": <TemplatesScreen />,
    "/estimates": <EstimatesScreen />,
    "/reports": <ReportsScreen />,
  };

  const content = (
    <JobContext.Provider value={{ currentJob, setCurrentJob }}>
      {screens[route]||screens["/"]}
    </JobContext.Provider>
  );

  if(isMobile) {
    return (
      <div style={{ display:"flex",flexDirection:"column",height:"100vh",overflow:"hidden",background:"var(--bg)" }}>
        <div style={{ height:52,background:"var(--nav-bg)",borderBottom:"1px solid var(--nav-border)",display:"flex",alignItems:"center",padding:"0 16px",flexShrink:0 }}>
          <div style={{ display:"flex",alignItems:"center",gap:8,flex:1 }}><div style={{ width:28,height:28,borderRadius:7,background:"linear-gradient(135deg,#3B82F6,#1D4ED8)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0 }}>⚡</div><span style={{ fontSize:15,fontFamily:"var(--display)",fontWeight:800,color:"#fff" }}>FieldOps</span></div>
          <span style={{ fontSize:12,fontFamily:"var(--display)",fontWeight:600,color:"#8899BB",whiteSpace:"nowrap" }}>{PAGE_TITLES_MAP[route]||""}</span>
        </div>
        <div style={{ flex:1,overflow:"auto",display:"flex",flexDirection:"column",paddingBottom:60 }}>{content}</div>
        <div style={{ position:"fixed",bottom:0,left:0,right:0,background:"var(--nav-bg)",borderTop:"1px solid var(--nav-border)",display:"flex",alignItems:"center",overflowX:"auto",zIndex:1000,WebkitOverflowScrolling:"touch",scrollbarWidth:"none" }}>
          {MOBILE_NAV.map(item=><button key={item.id} onClick={()=>navigate(item.id)} style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:2,background:"none",border:"none",color:route===item.id?"#fff":"var(--nav-text)",cursor:"pointer",padding:"10px 14px",borderRadius:0,minWidth:60,flexShrink:0,transition:"color .15s",borderTop:route===item.id?"2px solid var(--blue)":"2px solid transparent" }}><span style={{ fontSize:20,lineHeight:1 }}>{item.icon}</span><span style={{ fontSize:9,fontWeight:route===item.id?700:400,letterSpacing:"0.04em",textTransform:"uppercase",whiteSpace:"nowrap" }}>{item.label}</span></button>)}
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
function AppInner() {
  const { user } = useAuth();
  if(window.location.hash.startsWith("#/portal")) return <CustomerPortalScreen />;
  return user ? <AppShell /> : <LoginScreen />;
}
export default AppWithProviders;
