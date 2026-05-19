/* eslint-disable */
// v3.2 — work order integrated
import { useState, useContext, createContext, useCallback, useEffect } from "react";
import WorkOrder405 from "./WorkOrder405";
import Pricebook from "./Pricebook";

// ════════════════════════════════════════════════════════════════
//  GLOBAL STYLES
// ════════════════════════════════════════════════════════════════
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
  @media (max-width: 768px) {
    .desktop-detail { display: flex !important; position: fixed !important; top: 52px !important; bottom: 60px !important; left: 0 !important; right: 0 !important; z-index: 50 !important; }
    .desktop-only-detail { display: none !important; }
  }
  @media (max-width: 768px) {
    .desktop-only { display: none !important; }
    .mobile-only { display: flex !important; }
  }
  @media (min-width: 769px) {
    .mobile-only { display: none !important; }
    .desktop-only { display: flex !important; }
  }
  .bottom-nav {
    position: fixed; bottom: 0; left: 0; right: 0; height: 60px;
    background: var(--nav-bg); border-top: 1px solid var(--nav-border);
    display: none; align-items: center; justify-content: space-around;
    z-index: 1000; padding-bottom: env(safe-area-inset-bottom);
  }
  .bottom-nav-btn {
    display: flex; flex-direction: column; align-items: center; gap: 2px;
    background: none; border: none; color: var(--nav-text); font-size: 10px;
    cursor: pointer; padding: 6px 12px; border-radius: 8px; transition: color .15s; min-width: 52px;
  }
  .bottom-nav-btn.active { color: #fff; }
  .bottom-nav-btn .nav-icon { font-size: 20px; line-height: 1; }
  .mobile-content { padding-bottom: 70px !important; }
  @keyframes spin{to{transform:rotate(360deg)}}
  .fade-in{animation:fadeIn .2s ease both}
  .s1{animation-delay:.05s}.s2{animation-delay:.10s}.s3{animation-delay:.15s}
`;

// ════════════════════════════════════════════════════════════════
//  API
// ════════════════════════════════════════════════════════════════
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

// ════════════════════════════════════════════════════════════════
//  AUTH CONTEXT
// ════════════════════════════════════════════════════════════════
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

// ════════════════════════════════════════════════════════════════
//  ROUTER
// ════════════════════════════════════════════════════════════════
const RouterContext = createContext(null);
function RouterProvider({ children }) {
  const [route, setRoute] = useState(() => {
    const hash = window.location.hash.slice(1);
    return hash && hash !== "/" ? hash : "/";
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

// ════════════════════════════════════════════════════════════════
//  SHARED UI
// ════════════════════════════════════════════════════════════════
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
  return (
    <span style={{ display:"inline-flex",alignItems:"center",gap:5,background:c.bg,color:c.color,border:`1px solid ${c.bd}`,borderRadius:4,padding:"2px 8px",fontSize:11,fontWeight:600,fontFamily:"var(--display)",letterSpacing:"0.04em",whiteSpace:"nowrap" }}>
      <span style={{ width:5,height:5,borderRadius:"50%",background:c.color }} />{c.label}
    </span>
  );
}

function Btn({ children, variant="primary", onClick, small, disabled, full, style:sx={} }) {
  const variants = {
    primary:{background:"var(--blue)",color:"#fff",border:"1px solid transparent"},
    secondary:{background:"var(--surface)",color:"var(--text2)",border:"1px solid var(--border)"},
    ghost:{background:"transparent",color:"var(--text3)",border:"1px solid transparent"},
    danger:{background:"var(--red-lt)",color:"var(--red)",border:"1px solid var(--red-bd)"},
  };
  return (
    <button onClick={disabled?undefined:onClick} style={{ ...variants[variant],borderRadius:8,fontWeight:500,padding:small?"5px 12px":"9px 18px",fontSize:small?12:13,opacity:disabled?.5:1,cursor:disabled?"not-allowed":"pointer",transition:"all .12s",width:full?"100%":"auto",...sx }}
      onMouseEnter={e=>{if(!disabled)e.currentTarget.style.filter="brightness(.9)"}}
      onMouseLeave={e=>e.currentTarget.style.filter=""}
    >{children}</button>
  );
}

function Card({ children, style:sx={}, className="" }) {
  return <div className={className} style={{ background:"var(--surface)",border:"1px solid var(--border)",borderRadius:12,...sx }}>{children}</div>;
}

function Spinner() {
  return <div style={{ width:20,height:20,border:"2px solid var(--border)",borderTopColor:"var(--blue)",borderRadius:"50%",animation:"spin .7s linear infinite",margin:"40px auto" }} />;
}

function EmptyState({ icon, title, desc, action }) {
  return (
    <div style={{ textAlign:"center",padding:"60px 20px",color:"var(--text3)" }}>
      <div style={{ fontSize:48,marginBottom:12 }}>{icon}</div>
      <div style={{ fontSize:18,fontFamily:"var(--display)",fontWeight:700,color:"var(--text1)",marginBottom:8 }}>{title}</div>
      <div style={{ fontSize:14,marginBottom:20,maxWidth:300,margin:"0 auto 20px" }}>{desc}</div>
      {action}
    </div>
  );
}

function Modal({ title, onClose, children, width=520 }) {
  return (
    <div style={{ position:"fixed",inset:0,background:"#00000060",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center",padding:20 }} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="fade-in" style={{ background:"var(--surface)",borderRadius:16,width:"100%",maxWidth:width,maxHeight:"90vh",overflowY:"auto",border:"1px solid var(--border)",boxShadow:"0 24px 64px #00000030" }}>
        <div style={{ padding:"20px 24px",borderBottom:"1px solid var(--border)",display:"flex",justifyContent:"space-between",alignItems:"center" }}>
          <h3 style={{ fontSize:18,fontFamily:"var(--display)",fontWeight:700 }}>{title}</h3>
          <button onClick={onClose} style={{ background:"none",border:"none",fontSize:20,color:"var(--text3)",cursor:"pointer" }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function FormField({ label, children }) {
  return (
    <div>
      <label style={{ fontSize:11,fontWeight:600,color:"var(--text2)",letterSpacing:"0.05em",textTransform:"uppercase",display:"block",marginBottom:6,fontFamily:"var(--display)" }}>{label}</label>
      {children}
    </div>
  );
}

const inputStyle = { width:"100%",padding:"9px 12px",borderRadius:7,fontSize:13,border:"1px solid var(--border)",outline:"none",transition:"border-color .15s" };
function fmt$(n) { return n==null?"—":"$"+Number(n).toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2}); }
function fmtDate(s) { if(!s)return"—"; return new Date(s).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}); }

// ════════════════════════════════════════════════════════════════
//  LOGIN
// ════════════════════════════════════════════════════════════════
function LoginScreen() {
  const { login, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  async function handleSubmit(e) {
    e?.preventDefault(); setError("");
    const res = await login(email, password);
    if (!res.ok) setError(res.error);
  }
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
            <button type="submit" disabled={loading} style={{ padding:"14px",background:"linear-gradient(135deg,#3B82F6,#1D4ED8)",border:"none",borderRadius:10,color:"#fff",fontSize:15,fontWeight:700,cursor:"pointer",fontFamily:"var(--display)",boxShadow:"0 4px 16px #3B82F640",opacity:loading?.7:1 }}>
              {loading ? "Signing in…" : "Sign In →"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
//  SIDEBAR
// ════════════════════════════════════════════════════════════════
const NAV_ITEMS = [
  {id:"/",icon:"⊞",label:"Dashboard"},
  {id:"/dispatch",icon:"📡",label:"Dispatch"},
  {id:"/customers",icon:"👥",label:"Customers"},
  {id:"/invoices",icon:"📄",label:"Invoices"},
  {id:"/jobs",icon:"🔧",label:"Jobs"},
  {id:"/team",icon:"👷",label:"Team"},
  {id:"/workorder",icon:"📋",label:"Work Order"},
  {id:"/pricebook",icon:"💲",label:"Pricebook"},
];

function Sidebar({ collapsed, setCollapsed }) {
  const { route, navigate } = useRouter();
  const { user, logout } = useAuth();
  return (
    <div style={{ width:collapsed?56:220,flexShrink:0,background:"var(--nav-bg)",borderRight:"1px solid var(--nav-border)",display:"flex",flexDirection:"column",transition:"width .2s ease",overflow:"hidden" }}>
      <div style={{ height:56,display:"flex",alignItems:"center",padding:collapsed?"0":"0 16px",justifyContent:collapsed?"center":"space-between",borderBottom:"1px solid var(--nav-border)",flexShrink:0 }}>
        {!collapsed && (<div style={{ display:"flex",alignItems:"center",gap:9 }}><div style={{ width:28,height:28,borderRadius:7,background:"linear-gradient(135deg,#3B82F6,#1D4ED8)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0 }}>⚡</div><span style={{ fontSize:15,fontFamily:"var(--display)",fontWeight:800,color:"#fff",letterSpacing:"-0.01em",whiteSpace:"nowrap" }}>FieldOps</span></div>)}
        {collapsed && <span style={{ fontSize:16 }}>⚡</span>}
        {!collapsed && <button onClick={()=>setCollapsed(true)} style={{ background:"none",border:"none",color:"var(--nav-text)",cursor:"pointer",fontSize:14,padding:"4px",borderRadius:4 }}>◀</button>}
      </div>
      {collapsed && <button onClick={()=>setCollapsed(false)} style={{ margin:"8px auto 0",background:"none",border:"none",color:"var(--nav-text)",cursor:"pointer",fontSize:13,padding:"4px 0",width:"100%",textAlign:"center" }}>▶</button>}
      {!collapsed && (<div style={{ margin:"10px 10px 4px",padding:"8px 10px",background:"rgba(59,130,246,.08)",border:"1px solid rgba(59,130,246,.15)",borderRadius:7 }}><div style={{ fontSize:10,color:"var(--nav-text)",fontFamily:"var(--display)",letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:2 }}>Workspace</div><div style={{ fontSize:12,color:"#fff",fontWeight:600,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>{user?.company?.name || "My Company"}</div></div>)}
      <nav style={{ flex:1,padding:collapsed?"8px 6px":"8px 10px",display:"flex",flexDirection:"column",gap:2,overflowY:"auto" }}>
        {NAV_ITEMS.map(item => {
          const active = route===item.id;
          return (
            <button key={item.id} onClick={()=>navigate(item.id)} title={collapsed?item.label:""} style={{ display:"flex",alignItems:"center",gap:10,padding:collapsed?"10px 0":"9px 14px",justifyContent:collapsed?"center":"flex-start",width:"100%",background:active?"rgba(59,130,246,.15)":"transparent",border:active?"1px solid rgba(59,130,246,.25)":"1px solid transparent",borderRadius:8,color:active?"#fff":"var(--nav-text)",cursor:"pointer",transition:"all .12s",textAlign:"left",fontSize:13,fontWeight:active?600:400 }}
              onMouseEnter={e=>{if(!active){e.currentTarget.style.background="var(--nav-hover)";e.currentTarget.style.color="#fff";}}}
              onMouseLeave={e=>{if(!active){e.currentTarget.style.background="transparent";e.currentTarget.style.color="var(--nav-text)";}}}
            >
              <span style={{ fontSize:15,flexShrink:0,lineHeight:1 }}>{item.icon}</span>
              {!collapsed && <span>{item.label}</span>}
              {active && !collapsed && <span style={{ marginLeft:"auto",width:5,height:5,borderRadius:"50%",background:"var(--nav-accent)" }} />}
            </button>
          );
        })}
      </nav>
      <div style={{ padding:collapsed?"8px 6px":"8px 10px",borderTop:"1px solid var(--nav-border)" }}>
        <div style={{ padding:collapsed?"8px 0":"8px 10px",display:"flex",alignItems:"center",gap:9,justifyContent:collapsed?"center":"flex-start",borderRadius:8,cursor:"pointer" }}
          onClick={logout} onMouseEnter={e=>e.currentTarget.style.background="var(--nav-hover)"} onMouseLeave={e=>e.currentTarget.style.background="transparent"} title={collapsed?`${user?.name} · Sign out`:""}>
          <div style={{ width:28,height:28,borderRadius:"50%",background:"#3B82F620",border:"1px solid #3B82F660",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:"#3B82F6",flexShrink:0,fontFamily:"var(--display)" }}>{user?.name?.split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase()}</div>
          {!collapsed && (<div style={{ flex:1,minWidth:0 }}><div style={{ fontSize:12,fontWeight:600,color:"#fff",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>{user?.name}</div><div style={{ fontSize:10,color:"var(--nav-text)" }}>Sign out</div></div>)}
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
//  TOP BAR
// ════════════════════════════════════════════════════════════════
const PAGE_TITLES = {"/":"Dashboard","/dispatch":"Dispatch","/customers":"Customers","/invoices":"Invoices","/jobs":"Jobs","/team":"Team","/workorder":"Work Order","/pricebook":"Pricebook"};
function TopBar() {
  const { route } = useRouter();
  return (
    <div style={{ height:56,background:"var(--surface)",borderBottom:"1px solid var(--border)",display:"flex",alignItems:"center",padding:"0 24px",gap:16,flexShrink:0 }}>
      <h1 style={{ flex:1,fontSize:18,fontFamily:"var(--display)",fontWeight:700,letterSpacing:"-0.01em" }}>{PAGE_TITLES[route]||"FieldOps"}</h1>
      <div style={{ fontSize:11,color:"var(--text3)",fontFamily:"var(--mono)",whiteSpace:"nowrap" }}>{new Date().toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"})}</div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
//  DASHBOARD
// ════════════════════════════════════════════════════════════════
function Dashboard() {
  const { user } = useAuth();
  const { navigate } = useRouter();
  const [stats, setStats] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    async function load() {
      try { const [s, j] = await Promise.all([apiFetch("/company/stats"), apiFetch("/jobs?limit=5")]); setStats(s); setJobs(Array.isArray(j) ? j : []); } catch(e) { console.error(e); }
      setLoading(false);
    }
    load();
  }, []);
  if (loading) return <div style={{ flex:1,display:"flex",alignItems:"center",justifyContent:"center" }}><Spinner /></div>;
  return (
    <div style={{ padding:24,overflowY:"auto",flex:1 }}>
      <div className="fade-in" style={{ marginBottom:24 }}>
        <h2 style={{ fontSize:22,fontFamily:"var(--display)",fontWeight:700,marginBottom:4 }}>Good morning, {user?.name?.split(" ")[0]} 👋</h2>
        <p style={{ fontSize:13,color:"var(--text3)" }}>Here's what's happening at {user?.company?.name} today.</p>
      </div>
      <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:20 }}>
        {[{label:"Jobs Today",val:stats?.jobs_today??0,icon:"📅",color:"var(--blue)"},{label:"This Week",val:stats?.jobs_this_week??0,icon:"📆",color:"#7C3AED"},{label:"Revenue / Month",val:fmt$(stats?.revenue_this_month??0),icon:"💰",color:"var(--green)"},{label:"Open Invoices",val:fmt$(stats?.open_invoices_total??0),icon:"📄",color:"var(--amber)"}].map((k,i) => (
          <Card key={i} className={`fade-in s${Math.min(i+1,3)}`} style={{ padding:"16px 18px" }}>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10 }}><span style={{ fontSize:11,color:"var(--text3)",fontWeight:600,fontFamily:"var(--display)",letterSpacing:"0.06em",textTransform:"uppercase" }}>{k.label}</span><span style={{ fontSize:18 }}>{k.icon}</span></div>
            <div style={{ fontSize:26,fontFamily:"var(--mono)",fontWeight:600,color:k.color,lineHeight:1 }}>{k.val}</div>
          </Card>
        ))}
      </div>
      <Card>
        <div style={{ padding:"18px 20px 0",display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16 }}>
          <h3 style={{ fontSize:14,fontWeight:700,fontFamily:"var(--display)" }}>Recent Jobs</h3>
          <Btn small variant="secondary" onClick={()=>navigate("/jobs")}>View all →</Btn>
        </div>
        {jobs.length === 0 ? <EmptyState icon="🔧" title="No jobs yet" desc="Create your first job to get started" action={<Btn onClick={()=>navigate("/jobs")}>+ New Job</Btn>} /> : (
          <table style={{ width:"100%",borderCollapse:"collapse" }}>
            <thead><tr style={{ background:"var(--surface2)" }}>{["Job #","Title","Customer","Status"].map(h=>(<th key={h} style={{ padding:"8px 16px",textAlign:"left",fontSize:11,fontWeight:600,color:"var(--text3)",fontFamily:"var(--display)",letterSpacing:"0.06em",textTransform:"uppercase",borderTop:"1px solid var(--border)",borderBottom:"1px solid var(--border)" }}>{h}</th>))}</tr></thead>
            <tbody>{jobs.map((job,i) => (<tr key={job.id} style={{ borderBottom:"1px solid var(--border)",cursor:"pointer",transition:"background .1s" }} onMouseEnter={e=>e.currentTarget.style.background="var(--surface2)"} onMouseLeave={e=>e.currentTarget.style.background=""} onClick={()=>navigate("/jobs")}><td style={{ padding:"12px 16px",fontSize:12,fontFamily:"var(--mono)",color:"var(--text3)" }}>{job.job_number}</td><td style={{ padding:"12px 16px",fontSize:13,fontWeight:500 }}>{job.title}</td><td style={{ padding:"12px 16px",fontSize:13,color:"var(--text2)" }}>{job.customer_name}</td><td style={{ padding:"12px 16px" }}><Chip status={job.status} /></td></tr>))}</tbody>
          </table>
        )}
      </Card>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
//  CUSTOMER DETAIL
// ════════════════════════════════════════════════════════════════
function CustomerDetail({ customer, onBack, onDelete }) {
  const [jobs, setJobs] = useState([]);
  const [notes, setNotes] = useState(customer.notes || "");
  const [editingNotes, setEditingNotes] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [tab, setTab] = useState("info");
  useEffect(() => {
    apiFetch(`/customers/${customer.id}/jobs`).then(d=>setJobs(Array.isArray(d)?d:[])).catch(()=>setJobs([])).finally(()=>setLoadingJobs(false));
  }, [customer.id]);
  async function saveNotes() {
    setSavingNotes(true);
    try { await apiFetch(`/customers/${customer.id}`,{method:"PATCH",body:JSON.stringify({notes})}); setEditingNotes(false); } catch(e) { alert(e.message); }
    setSavingNotes(false);
  }
  const tabStyle = (t) => ({ flex:1,padding:"10px 0",background:"none",border:"none",borderBottom:tab===t?"2px solid var(--blue)":"2px solid transparent",color:tab===t?"var(--blue)":"var(--text3)",fontSize:13,fontWeight:tab===t?700:400,cursor:"pointer",transition:"all .15s" });
  return (
    <div style={{ flex:1,display:"flex",flexDirection:"column",overflow:"hidden",background:"var(--bg)" }}>
      <div style={{ background:"var(--surface)",borderBottom:"1px solid var(--border)",flexShrink:0 }}>
        <div style={{ padding:"12px 16px",display:"flex",alignItems:"center",gap:12 }}><button onClick={onBack} style={{ background:"none",border:"none",color:"var(--blue)",fontSize:14,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:4,padding:0 }}>← Customers</button></div>
        <div style={{ padding:"0 16px 16px",display:"flex",justifyContent:"space-between",alignItems:"flex-end" }}>
          <div><h2 style={{ fontSize:22,fontFamily:"var(--display)",fontWeight:800,marginBottom:4 }}>{customer.first_name} {customer.last_name}</h2><div style={{ display:"flex",flexDirection:"column",gap:3 }}>{customer.phone && <span style={{ fontSize:13,color:"var(--text3)" }}>📞 {customer.phone}</span>}{customer.email && <span style={{ fontSize:13,color:"var(--text3)" }}>✉ {customer.email}</span>}</div></div>
          <Btn small variant="danger" onClick={()=>onDelete(customer.id)}>Archive</Btn>
        </div>
        <div style={{ display:"flex",borderTop:"1px solid var(--border)" }}><button style={tabStyle("info")} onClick={()=>setTab("info")}>Info</button><button style={tabStyle("notes")} onClick={()=>setTab("notes")}>📋 Notes</button><button style={tabStyle("jobs")} onClick={()=>setTab("jobs")}>Jobs ({jobs.length})</button></div>
      </div>
      <div style={{ flex:1,overflowY:"auto",padding:16 }}>
        {tab==="info" && (<div style={{ display:"flex",flexDirection:"column",gap:12 }}><Card style={{ padding:"14px 16px" }}><div style={{ fontSize:10,fontWeight:700,color:"var(--text3)",letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:12,fontFamily:"var(--display)" }}>Contact Information</div>{[["Phone",customer.phone],["Email",customer.email],["Source",customer.source]].filter(([,v])=>v).map(([l,v])=>(<div key={l} style={{ display:"flex",gap:12,marginBottom:10,alignItems:"center" }}><span style={{ fontSize:12,color:"var(--text3)",width:60,flexShrink:0 }}>{l}</span><span style={{ fontSize:13,fontWeight:500 }}>{v}</span></div>))}</Card><Card style={{ padding:"14px 16px" }}><div style={{ fontSize:10,fontWeight:700,color:"var(--text3)",letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:8,fontFamily:"var(--display)" }}>Stats</div><div style={{ display:"flex",gap:24 }}><div><div style={{ fontSize:28,fontFamily:"var(--mono)",fontWeight:700,color:"var(--blue)" }}>{customer.job_count||0}</div><div style={{ fontSize:11,color:"var(--text3)" }}>Total jobs</div></div></div></Card></div>)}
        {tab==="notes" && (<div style={{ display:"flex",flexDirection:"column",gap:12 }}><Card style={{ padding:"14px 16px" }}><div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12 }}><div><div style={{ fontSize:10,fontWeight:700,color:"var(--text3)",letterSpacing:"0.08em",textTransform:"uppercase",fontFamily:"var(--display)" }}>Internal Notes</div><div style={{ fontSize:11,color:"var(--text3)",marginTop:2 }}>Visible to all techs</div></div>{!editingNotes && <Btn small variant="secondary" onClick={()=>setEditingNotes(true)}>Edit</Btn>}</div>{editingNotes?(<><textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Gate code, dogs, disability access..." style={{ ...inputStyle,height:180,resize:"vertical",marginBottom:10 }} autoFocus /><div style={{ display:"flex",gap:8 }}><Btn small onClick={saveNotes} disabled={savingNotes}>{savingNotes?"Saving…":"Save Notes"}</Btn><Btn small variant="secondary" onClick={()=>{setEditingNotes(false);setNotes(customer.notes||"");}}>Cancel</Btn></div></>):(notes?<p style={{ fontSize:14,color:"var(--text1)",lineHeight:1.7,whiteSpace:"pre-wrap" }}>{notes}</p>:<div style={{ fontSize:13,color:"var(--text4)",fontStyle:"italic",padding:"8px 0" }}>No notes yet.</div>)}</Card></div>)}
        {tab==="jobs" && (<div style={{ display:"flex",flexDirection:"column",gap:10 }}>{loadingJobs?<Spinner />:jobs.length===0?<EmptyState icon="🔧" title="No jobs yet" desc="No jobs found for this customer" />:jobs.map(job=>(<Card key={job.id} style={{ padding:"14px 16px" }}><div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6 }}><div><div style={{ fontSize:11,fontFamily:"var(--mono)",color:"var(--text3)",marginBottom:3 }}>{job.job_number}</div><div style={{ fontSize:15,fontWeight:700 }}>{job.title}</div></div><Chip status={job.status} /></div><div style={{ fontSize:12,color:"var(--text3)" }}>{job.scheduled_start?fmtDate(job.scheduled_start):"Not scheduled"}</div></Card>))}</div>)}
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
    try { const d = await apiFetch(`/customers?limit=100${search?`&search=${encodeURIComponent(search)}`:""}`); setList(Array.isArray(d)?d:[]); } catch(e) { console.error(e); }
    setLoading(false);
  }
  useEffect(() => { load(); }, [search]);
  async function handleDelete(id) {
    if (!window.confirm("Archive this customer?")) return;
    try { await apiFetch(`/customers/${id}`,{method:"DELETE"}); setList(p=>p.filter(c=>c.id!==id)); setSelected(null); } catch(e) { alert(e.message); }
  }
  if (selected) return <CustomerDetail customer={selected} onBack={()=>setSelected(null)} onDelete={handleDelete} />;
  return (
    <div style={{ flex:1,display:"flex",flexDirection:"column",overflow:"hidden" }}>
      {showNew && <NewCustomerModal onClose={()=>setShowNew(false)} onSave={async c=>{setList(p=>[c,...p]);setSelected(c);setShowNew(false);}} />}
      <div style={{ padding:"12px 16px",borderBottom:"1px solid var(--border)",background:"var(--surface)",flexShrink:0 }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10 }}><span style={{ fontSize:16,fontFamily:"var(--display)",fontWeight:700 }}>Customers</span><Btn small onClick={()=>setShowNew(true)}>+ New</Btn></div>
        <div style={{ position:"relative" }}><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search name, phone…" style={{ ...inputStyle,paddingLeft:28 }} /><span style={{ position:"absolute",left:9,top:"50%",transform:"translateY(-50%)",color:"var(--text3)",fontSize:12 }}>⌕</span></div>
      </div>
      <div style={{ flex:1,overflowY:"auto" }}>
        {loading?<Spinner />:list.length===0?<EmptyState icon="👥" title="No customers yet" desc="Add your first customer" action={<Btn onClick={()=>setShowNew(true)}>+ New Customer</Btn>} />:list.map(c=>(<div key={c.id} onClick={()=>setSelected(c)} style={{ padding:"14px 16px",borderBottom:"1px solid var(--border)",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,transition:"background .1s" }} onMouseEnter={e=>e.currentTarget.style.background="var(--surface2)"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}><div><div style={{ fontSize:14,fontWeight:600,marginBottom:2 }}>{c.first_name} {c.last_name}</div><div style={{ fontSize:12,color:"var(--text3)" }}>{c.phone||c.email||"No contact"} · {c.job_count||0} job{c.job_count!==1?"s":""}</div></div><span style={{ color:"var(--text4)",fontSize:16 }}>›</span></div>))}
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
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12 }}>
          <FormField label="First name *"><input style={inputStyle} value={form.first_name} onChange={e=>set("first_name",e.target.value)} placeholder="Sarah" /></FormField>
          <FormField label="Last name *"><input style={inputStyle} value={form.last_name} onChange={e=>set("last_name",e.target.value)} placeholder="Johnson" /></FormField>
        </div>
        <FormField label="Phone"><input style={inputStyle} value={form.phone} onChange={e=>set("phone",e.target.value)} placeholder="405-555-0177" /></FormField>
        <FormField label="Email"><input style={inputStyle} type="email" value={form.email} onChange={e=>set("email",e.target.value)} placeholder="sarah@email.com" /></FormField>
        <FormField label="How did they find you?"><select style={inputStyle} value={form.source} onChange={e=>set("source",e.target.value)}><option value="">Select source</option>{["Referral","Google","Yelp","Facebook","Door hanger","Repeat customer","Other"].map(s=><option key={s}>{s}</option>)}</select></FormField>
        <div style={{ borderTop:"1px solid var(--border)",paddingTop:14 }}>
          <div style={{ fontSize:11,fontWeight:600,color:"var(--text3)",letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:10 }}>Service Location (optional)</div>
          <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
            <input style={inputStyle} value={form.location.address_line1} onChange={e=>setLoc("address_line1",e.target.value)} placeholder="Street address" />
            <div style={{ display:"grid",gridTemplateColumns:"2fr 1fr 1fr",gap:10 }}><input style={inputStyle} value={form.location.city} onChange={e=>setLoc("city",e.target.value)} placeholder="City" /><input style={inputStyle} value={form.location.state} onChange={e=>setLoc("state",e.target.value)} placeholder="State" /><input style={inputStyle} value={form.location.zip} onChange={e=>setLoc("zip",e.target.value)} placeholder="Zip" /></div>
            <input style={inputStyle} value={form.location.access_notes} onChange={e=>setLoc("access_notes",e.target.value)} placeholder="Access notes (gate code, dogs, etc.)" />
          </div>
        </div>
        <FormField label="Notes"><textarea style={{ ...inputStyle,height:80,resize:"vertical" }} value={form.notes} onChange={e=>set("notes",e.target.value)} placeholder="Preferences, anything to remember…" /></FormField>
      </div>
      <div style={{ padding:"16px 24px",borderTop:"1px solid var(--border)",display:"flex",justifyContent:"flex-end",gap:10 }}>
        <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
        <Btn onClick={()=>{ if(!form.first_name||!form.last_name){alert("First and last name required");return;} const loc=form.location.address_line1?form.location:undefined; onSave({...form,location:loc}); }}>Save Customer</Btn>
      </div>
    </Modal>
  );
}

// ════════════════════════════════════════════════════════════════
//  JOBS
// ════════════════════════════════════════════════════════════════
function JobsScreen() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [showNew, setShowNew] = useState(false);
  const [detailJob, setDetailJob] = useState(null);
  async function load() {
    setLoading(true);
    try { const data = await apiFetch(`/jobs?limit=100${filterStatus!=="all"?`&status=${filterStatus}`:""}`); setJobs(Array.isArray(data)?data:[]); } catch(e) { console.error(e); }
    setLoading(false);
  }
  useEffect(() => { load(); }, [filterStatus]);
  async function handleStatusChange(jobId, newStatus) {
    try { await apiFetch(`/jobs/${jobId}/status`,{method:"PATCH",body:JSON.stringify({status:newStatus})}); setJobs(p=>p.map(j=>j.id===jobId?{...j,status:newStatus}:j)); } catch(e) { alert(e.message); }
  }
  return (
    <div style={{ flex:1,display:"flex",flexDirection:"column",overflow:"hidden" }}>
      {showNew && <NewJobModal onClose={()=>setShowNew(false)} onSave={async(job)=>{setJobs(p=>[job,...p]);setShowNew(false);}} />}
      {detailJob && <JobDetailModal job={detailJob} onClose={()=>setDetailJob(null)} />}
      <div style={{ padding:"12px 20px",background:"var(--surface)",borderBottom:"1px solid var(--border)",display:"flex",gap:8,alignItems:"center" }}>
        <div style={{ display:"flex",gap:4 }}>{["all","scheduled","in_progress","en_route","completed"].map(s=>(<button key={s} onClick={()=>setFilterStatus(s)} style={{ fontSize:11,padding:"4px 10px",borderRadius:100,background:filterStatus===s?"var(--blue)":"var(--surface2)",color:filterStatus===s?"#fff":"var(--text3)",border:filterStatus===s?"none":"1px solid var(--border)",cursor:"pointer",textTransform:"capitalize",fontWeight:filterStatus===s?600:400 }}>{s==="all"?"All":STATUS_CFG[s]?.label||s}</button>))}</div>
        <div style={{ marginLeft:"auto" }}><Btn small onClick={()=>setShowNew(true)}>+ New Job</Btn></div>
      </div>
      <div style={{ flex:1,overflowY:"auto",padding:16 }}>
        {loading?<Spinner />:jobs.length===0?<EmptyState icon="🔧" title="No jobs yet" desc="Create your first job to get started" action={<Btn onClick={()=>setShowNew(true)}>+ New Job</Btn>} />:(
          <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
            {jobs.map(job=>(
              <Card key={job.id} style={{ padding:"14px 18px" }}>
                <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8 }}>
                  <div><div style={{ fontSize:11,fontFamily:"var(--mono)",color:"var(--text3)",marginBottom:3 }}>{job.job_number}</div><div style={{ fontSize:16,fontWeight:700,fontFamily:"var(--display)" }}>{job.title}</div></div>
                  <Chip status={job.status} />
                </div>
                <div style={{ display:"flex",gap:16,fontSize:13,color:"var(--text2)",flexWrap:"wrap" }}>
                  <span>👤 {job.customer_name}</span>
                  <span style={{ cursor:"pointer",color:"var(--blue)" }} onClick={e=>{e.stopPropagation();window.open(`https://maps.google.com/?q=${encodeURIComponent(job.address_line1?`${job.address_line1}, ${job.city}, ${job.state}`:`${job.city}, ${job.state}`)}`)}}>📍 {job.address_line1?`${job.address_line1}, ${job.city}, ${job.state}`:`${job.city}, ${job.state}`}</span>
                  {job.scheduled_start && <span>🕐 {new Date(job.scheduled_start).toLocaleDateString("en-US",{month:"short",day:"numeric"})}</span>}
                </div>
                <div style={{ marginTop:10,display:"flex",gap:6,flexWrap:"wrap" }}>
                  {job.status==="scheduled" && <Btn small variant="secondary" onClick={()=>handleStatusChange(job.id,"en_route")}>→ En Route</Btn>}
                  {job.status==="en_route" && <Btn small variant="secondary" onClick={()=>handleStatusChange(job.id,"in_progress")}>→ Start Job</Btn>}
                  {job.status==="in_progress" && <Btn small onClick={()=>handleStatusChange(job.id,"completed")}>✓ Complete</Btn>}
                  <Btn small variant="secondary" onClick={()=>navigate("/workorder")}>📋 Work Order</Btn>
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
  useEffect(() => { apiFetch("/customers?limit=100").then(d=>setCustomers(Array.isArray(d)?d:[])).catch(()=>{}); }, []);
  async function handleCustomerChange(id) {
    setForm(p=>({...p,customer_id:id,location_id:""}));
    if(id) { try { const cust = await apiFetch(`/customers/${id}`); setLocations(cust.locations||[]); if(cust.locations?.length===1) setForm(p=>({...p,location_id:cust.locations[0].id})); } catch(e) {} }
  }
  async function handleSave() {
    if(!form.customer_id||!form.location_id||!form.title){alert("Customer, location and title required");return;}
    try {
      const payload = { customer_id:form.customer_id,location_id:form.location_id,title:form.title,description:form.description||"",priority:form.priority||"normal",technician_ids:[] };
      if(form.scheduled_start) payload.scheduled_start=new Date(form.scheduled_start).toISOString();
      if(form.scheduled_end) payload.scheduled_end=new Date(form.scheduled_end).toISOString();
      const job = await apiFetch("/jobs",{method:"POST",body:JSON.stringify(payload)});
      onSave(job);
    } catch(e){alert(e.message);}
  }
  return (
    <Modal title="New Job" onClose={onClose}>
      <div style={{ padding:"20px 24px",display:"flex",flexDirection:"column",gap:14 }}>
        <FormField label="Customer *"><select style={inputStyle} value={form.customer_id} onChange={e=>handleCustomerChange(e.target.value)}><option value="">Select customer…</option>{customers.map(c=><option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>)}</select></FormField>
        {locations.length>0 && <FormField label="Location *"><select style={inputStyle} value={form.location_id} onChange={e=>setForm(p=>({...p,location_id:e.target.value}))}><option value="">Select location…</option>{locations.map(l=><option key={l.id} value={l.id}>{l.address_line1}, {l.city}</option>)}</select></FormField>}
        <FormField label="Job Title *"><input style={inputStyle} value={form.title} onChange={e=>setForm(p=>({...p,title:e.target.value}))} placeholder="e.g. AC Not Cooling" /></FormField>
        <FormField label="Description"><textarea style={{...inputStyle,height:80,resize:"vertical"}} value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))} placeholder="Describe the issue…" /></FormField>
        <FormField label="Priority"><select style={inputStyle} value={form.priority} onChange={e=>setForm(p=>({...p,priority:e.target.value}))}>{["low","normal","high","urgent"].map(p=><option key={p} value={p}>{p.charAt(0).toUpperCase()+p.slice(1)}</option>)}</select></FormField>
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12 }}>
          <FormField label="Start Time"><input style={inputStyle} type="datetime-local" value={form.scheduled_start} onChange={e=>setForm(p=>({...p,scheduled_start:e.target.value}))} /></FormField>
          <FormField label="End Time"><input style={inputStyle} type="datetime-local" value={form.scheduled_end} onChange={e=>setForm(p=>({...p,scheduled_end:e.target.value}))} /></FormField>
        </div>
      </div>
      <div style={{ padding:"16px 24px",borderTop:"1px solid var(--border)",display:"flex",justifyContent:"flex-end",gap:10 }}>
        <Btn variant="secondary" onClick={onClose}>Cancel</Btn><Btn onClick={handleSave}>Create Job</Btn>
      </div>
    </Modal>
  );
}

// ════════════════════════════════════════════════════════════════
//  DISPATCH
// ════════════════════════════════════════════════════════════════
function DispatchScreen() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(new Date().toISOString().slice(0,10));
  const [techs, setTechs] = useState([]);
  const [assigning, setAssigning] = useState({});
  useEffect(() => { apiFetch("/users?limit=100").then(d=>setTechs(Array.isArray(d)?d:[])).catch(()=>{}); }, []);
  useEffect(() => {
    setLoading(true);
    apiFetch(`/dispatch?date=${date}`).then(d=>setData(d)).catch(()=>setData({technicians:[],unassigned:[]})).finally(()=>setLoading(false));
  }, [date]);
  async function assignTech(jobId, techId) {
    if (!techId) return;
    setAssigning(p=>({...p,[jobId]:true}));
    try { await apiFetch(`/jobs/${jobId}`,{method:"PATCH",body:JSON.stringify({technician_ids:[techId]})}); const d=await apiFetch(`/dispatch?date=${date}`); setData(d); } catch(e) { alert(e.message); }
    setAssigning(p=>({...p,[jobId]:false}));
  }
  if(loading) return <div style={{ flex:1,display:"flex",alignItems:"center",justifyContent:"center" }}><Spinner /></div>;
  const dispatchTechs = data?.technicians||[];
  const unassigned = data?.unassigned||[];
  return (
    <div style={{ flex:1,display:"flex",flexDirection:"column",overflow:"hidden" }}>
      <div style={{ padding:"12px 20px",background:"var(--surface)",borderBottom:"1px solid var(--border)",display:"flex",gap:12,alignItems:"center" }}>
        <input type="date" value={date} onChange={e=>setDate(e.target.value)} style={{ ...inputStyle,width:"auto",padding:"6px 10px" }} />
        <span style={{ fontSize:13,color:"var(--text3)" }}>{dispatchTechs.length} technician{dispatchTechs.length!==1?"s":""} · {unassigned.length} unassigned</span>
      </div>
      <div style={{ flex:1,overflowY:"auto",padding:16,display:"flex",flexDirection:"column",gap:10 }}>
        {dispatchTechs.length===0&&unassigned.length===0&&<EmptyState icon="📡" title="No jobs scheduled" desc={`No jobs found for ${fmtDate(date)}`} />}
        {unassigned.length>0&&(<Card style={{ border:"1px solid var(--red-bd)",overflow:"hidden" }}><div style={{ padding:"10px 16px",background:"var(--red-lt)",borderBottom:"1px solid var(--red-bd)",fontSize:13,fontWeight:600,color:"var(--red)" }}>● Unassigned ({unassigned.length})</div><div style={{ display:"flex",flexDirection:"column",gap:8,padding:10 }}>{unassigned.map(job=>(<div key={job.id} style={{ background:"var(--surface2)",border:"1px solid var(--border)",borderLeft:"3px solid var(--red)",borderRadius:8,padding:"10px 12px" }}><div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12,flexWrap:"wrap" }}><div><div style={{ fontSize:11,fontFamily:"var(--mono)",color:"var(--text3)",marginBottom:3 }}>{job.job_number}</div><div style={{ fontSize:13,fontWeight:600,marginBottom:3 }}>{job.title}</div><div style={{ fontSize:11,color:"var(--text3)" }}>{job.customer_name}</div></div><div style={{ display:"flex",alignItems:"center",gap:8,flexShrink:0 }}><select defaultValue="" disabled={assigning[job.id]} onChange={e=>assignTech(job.id,e.target.value)} style={{ ...inputStyle,width:"auto",padding:"5px 10px",fontSize:12,cursor:"pointer" }}><option value="" disabled>Assign to…</option>{techs.map(t=>(<option key={t.id} value={t.id}>{t.name}</option>))}</select>{assigning[job.id]&&<span style={{ fontSize:11,color:"var(--text3)" }}>Saving…</span>}</div></div></div>))}</div></Card>)}
        {dispatchTechs.map(tech=>(<Card key={tech.id} style={{ overflow:"hidden" }}><div style={{ padding:"10px 16px",background:"var(--surface2)",borderBottom:tech.jobs?.length?"1px solid var(--border)":"none",display:"flex",alignItems:"center",gap:10 }}><div style={{ width:32,height:32,borderRadius:"50%",background:"var(--blue-lt)",border:"1px solid var(--blue-bd)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:"var(--blue)",flexShrink:0 }}>{tech.name?.split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase()}</div><span style={{ fontSize:13,fontWeight:600 }}>{tech.name}</span><span style={{ fontSize:11,color:"var(--text3)",marginLeft:4 }}>{tech.jobs?.length||0} job{tech.jobs?.length!==1?"s":""}</span></div>{tech.jobs?.length>0?(<div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:8,padding:10 }}>{tech.jobs.map(job=>{const sc=STATUS_CFG[job.status]||STATUS_CFG.scheduled;return(<div key={job.id} style={{ background:"var(--surface2)",border:`1px solid ${sc.bd}`,borderLeft:`3px solid ${sc.color}`,borderRadius:8,padding:"10px 12px" }}><div style={{ display:"flex",justifyContent:"space-between",marginBottom:5 }}><span style={{ fontSize:11,fontFamily:"var(--mono)",color:"var(--text3)" }}>{job.job_number}</span><Chip status={job.status} /></div><div style={{ fontSize:13,fontWeight:600,marginBottom:3 }}>{job.title}</div><div style={{ fontSize:11,color:"var(--text3)" }}>{job.customer_name}</div></div>);})}</div>):(<div style={{ padding:"12px 18px",fontSize:12,color:"var(--text4)",fontStyle:"italic" }}>No jobs scheduled</div>)}</Card>))}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
//  INVOICES
// ════════════════════════════════════════════════════════════════
function InvoicesScreen() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState(null);
  useEffect(() => {
    setLoading(true);
    apiFetch(`/invoices?limit=100${filter!=="all"?`&status=${filter}`:""}`).then(d=>setList(Array.isArray(d)?d:[])).catch(()=>{}).finally(()=>setLoading(false));
  }, [filter]);
  async function sendInvoice(id) {
    try { await apiFetch(`/invoices/${id}/send`,{method:"POST"}); setList(p=>p.map(i=>i.id===id?{...i,status:"sent"}:i)); alert("Invoice sent!"); } catch(e) { alert(e.message); }
  }
  if (selected) {
    const balance = Math.round(((selected.total||0)-(selected.amount_paid||0))*100)/100;
    return (
      <div style={{ flex:1,display:"flex",flexDirection:"column",overflow:"hidden",background:"var(--surface)" }}>
        <div style={{ padding:"12px 16px",borderBottom:"1px solid var(--border)",display:"flex",alignItems:"center",gap:12,flexShrink:0 }}><button onClick={()=>setSelected(null)} style={{ background:"none",border:"none",color:"var(--blue)",fontSize:14,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:4,padding:0 }}>← Invoices</button></div>
        <div style={{ flex:1,overflowY:"auto",padding:20 }}>
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16 }}><div><div style={{ fontSize:12,fontFamily:"var(--mono)",color:"var(--text3)",marginBottom:4 }}>{selected.invoice_number}</div><div style={{ fontSize:18,fontFamily:"var(--display)",fontWeight:800,marginBottom:4 }}>{selected.customer_name}</div><Chip status={selected.status} /></div><div style={{ textAlign:"right" }}><div style={{ fontSize:10,color:"var(--text3)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:2 }}>{selected.status==="paid"?"Paid":"Balance"}</div><div style={{ fontSize:28,fontFamily:"var(--mono)",fontWeight:700,color:selected.status==="paid"?"var(--green)":balance>0?"var(--red)":"var(--green)" }}>{selected.status==="paid"?fmt$(selected.amount_paid):fmt$(balance)}</div></div></div>
          <div style={{ display:"flex",gap:8,marginBottom:20,flexWrap:"wrap" }}>{selected.status==="draft"&&<Btn onClick={()=>sendInvoice(selected.id)}>✉ Send</Btn>}<Btn variant="secondary">⬇ Download</Btn></div>
          <div style={{ display:"flex",flexDirection:"column",gap:10 }}>{[{label:"Invoice Total",val:fmt$(selected.total),color:"var(--text1)"},{label:"Amount Paid",val:fmt$(selected.amount_paid),color:"var(--green)"},{label:"Balance Due",val:fmt$(balance),color:balance>0?"var(--red)":"var(--green)"}].map((s,i)=>(<Card key={i} style={{ padding:"14px 16px",display:"flex",justifyContent:"space-between",alignItems:"center" }}><span style={{ fontSize:13,color:"var(--text2)" }}>{s.label}</span><span style={{ fontSize:18,fontFamily:"var(--mono)",fontWeight:700,color:s.color }}>{s.val}</span></Card>))}</div>
        </div>
      </div>
    );
  }
  return (
    <div style={{ flex:1,display:"flex",flexDirection:"column",overflow:"hidden" }}>
      <div style={{ padding:"12px 16px",borderBottom:"1px solid var(--border)",background:"var(--surface)",flexShrink:0 }}>
        <div style={{ fontSize:16,fontFamily:"var(--display)",fontWeight:700,marginBottom:10 }}>Invoices</div>
        <div style={{ display:"flex",gap:4,flexWrap:"wrap" }}>{["all","draft","sent","partial","overdue","paid"].map(s=>(<button key={s} onClick={()=>setFilter(s)} style={{ fontSize:11,padding:"4px 10px",borderRadius:100,background:filter===s?"var(--blue)":"var(--surface2)",color:filter===s?"#fff":"var(--text3)",border:filter===s?"none":"1px solid var(--border)",cursor:"pointer",textTransform:"capitalize",fontWeight:filter===s?600:400 }}>{s}</button>))}</div>
      </div>
      <div style={{ flex:1,overflowY:"auto" }}>
        {loading?<Spinner />:list.length===0?<EmptyState icon="📄" title="No invoices" desc="Create estimates from the Jobs tab to generate invoices" />:list.map(inv=>{const balance=Math.round(((inv.total||0)-(inv.amount_paid||0))*100)/100;return(<div key={inv.id} onClick={()=>setSelected(inv)} style={{ padding:"14px 16px",borderBottom:"1px solid var(--border)",cursor:"pointer",transition:"background .1s" }} onMouseEnter={e=>e.currentTarget.style.background="var(--surface2)"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}><div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6 }}><div><div style={{ fontSize:12,fontFamily:"var(--mono)",color:"var(--text3)",marginBottom:2 }}>{inv.invoice_number}</div><div style={{ fontSize:14,fontWeight:600 }}>{inv.customer_name}</div></div><div style={{ fontSize:16,fontFamily:"var(--mono)",fontWeight:700,color:inv.status==="paid"?"var(--green)":inv.status==="overdue"?"var(--red)":"var(--text1)" }}>{inv.status==="paid"?fmt$(inv.amount_paid):fmt$(balance)}</div></div><div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}><span style={{ fontSize:11,color:"var(--text3)" }}>Due {fmtDate(inv.due_date)}</span><Chip status={inv.status} /></div></div>);})}
      </div>
    </div>
  );
}

function NewEstimateModal({ job, onClose, onSave }) {
  const [items, setItems] = useState([{id:1,name:"Diagnostic Fee",description:"System inspection and diagnostics",qty:1,unit_price:89,total:89}]);
  const [taxRate, setTaxRate] = useState(8.75);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  function addItem() { setItems(p=>[...p,{id:Date.now(),name:"",description:"",qty:1,unit_price:0,total:0}]); }
  function removeItem(id) { setItems(p=>p.filter(i=>i.id!==id)); }
  function updateItem(id,key,val) { setItems(p=>p.map(i=>{ if(i.id!==id)return i; const updated={...i,[key]:parseFloat(val)||val}; if(["qty","unit_price"].includes(key)){const q=key==="qty"?(parseFloat(val)||0):i.qty;const p=key==="unit_price"?(parseFloat(val)||0):i.unit_price;updated.total=Math.round(q*p*100)/100;} return updated; })); }
  const subtotal=items.reduce((s,i)=>s+(i.total||0),0);
  const taxAmt=subtotal*(taxRate/100);
  const total=subtotal+taxAmt;
  async function handleSave() {
    setSaving(true);
    try { const payload={notes:notes||"",tax_rate:parseFloat(taxRate)/100||0,line_items:items.filter(i=>i.name).map(i=>({name:String(i.name),description:String(i.description||""),quantity:parseFloat(i.qty)||1,unit_price:parseFloat(i.unit_price)||0,discount_pct:0,sort_order:0}))}; const est=await apiFetch(`/jobs/${job.id}/estimates`,{method:"POST",body:JSON.stringify(payload)}); onSave(est); onClose(); } catch(e) { alert(e.message); }
    setSaving(false);
  }
  const cellStyle={padding:"6px 8px",fontSize:12,border:"1px solid var(--border)",borderRadius:6,width:"100%",outline:"none"};
  return (
    <Modal title={`New Estimate — ${job.job_number}`} onClose={onClose} width={720}>
      <div style={{ padding:"16px 24px" }}>
        <div style={{ fontSize:12,color:"var(--text3)",marginBottom:16 }}>{job.title} · {job.customer_name}</div>
        <table style={{ width:"100%",borderCollapse:"collapse",marginBottom:12 }}>
          <thead><tr style={{ background:"var(--surface2)" }}>{["Item","Description","Qty","Unit Price","Total",""].map(h=>(<th key={h} style={{ padding:"8px",textAlign:"left",fontSize:11,fontWeight:600,color:"var(--text3)",borderBottom:"1px solid var(--border)",fontFamily:"var(--display)",letterSpacing:"0.06em",textTransform:"uppercase" }}>{h}</th>))}</tr></thead>
          <tbody>{items.map(item=>(<tr key={item.id}><td style={{ padding:"6px 4px",width:"25%" }}><input style={cellStyle} value={item.name} onChange={e=>updateItem(item.id,"name",e.target.value)} placeholder="Item name" /></td><td style={{ padding:"6px 4px",width:"30%" }}><input style={cellStyle} value={item.description} onChange={e=>updateItem(item.id,"description",e.target.value)} placeholder="Optional" /></td><td style={{ padding:"6px 4px",width:"8%" }}><input style={{...cellStyle,textAlign:"right"}} type="number" min="0" step="0.5" value={item.qty} onChange={e=>updateItem(item.id,"qty",e.target.value)} /></td><td style={{ padding:"6px 4px",width:"15%" }}><div style={{ position:"relative" }}><span style={{ position:"absolute",left:8,top:"50%",transform:"translateY(-50%)",fontSize:11,color:"var(--text3)" }}>$</span><input style={{...cellStyle,paddingLeft:18,textAlign:"right"}} type="number" min="0" step="0.01" value={item.unit_price} onChange={e=>updateItem(item.id,"unit_price",e.target.value)} /></div></td><td style={{ padding:"6px 8px",width:"12%",textAlign:"right",fontSize:13,fontFamily:"var(--mono)",fontWeight:600 }}>{fmt$(item.total)}</td><td style={{ padding:"6px 4px",width:"5%",textAlign:"center" }}><button onClick={()=>removeItem(item.id)} style={{ background:"none",border:"none",color:"var(--text4)",cursor:"pointer",fontSize:16 }} onMouseEnter={e=>e.currentTarget.style.color="var(--red)"} onMouseLeave={e=>e.currentTarget.style.color="var(--text4)"}>×</button></td></tr>))}</tbody>
        </table>
        <button onClick={addItem} style={{ width:"100%",padding:"8px",background:"none",border:"1px dashed var(--border2)",borderRadius:7,fontSize:12,color:"var(--text3)",cursor:"pointer",marginBottom:16 }} onMouseEnter={e=>{e.currentTarget.style.borderColor="var(--blue)";e.currentTarget.style.color="var(--blue)";}} onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--border2)";e.currentTarget.style.color="var(--text3)";}}>+ Add line item</button>
        <div style={{ display:"flex",gap:20,alignItems:"flex-end" }}>
          <div style={{ flex:1 }}><FormField label="Notes (visible to customer)"><textarea style={{...inputStyle,height:70,resize:"vertical"}} value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Thank you for your business…" /></FormField></div>
          <div style={{ width:220 }}>
            <div style={{ display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:"1px solid var(--border)" }}><span style={{ fontSize:12,color:"var(--text3)" }}>Subtotal</span><span style={{ fontSize:12,fontFamily:"var(--mono)" }}>{fmt$(subtotal)}</span></div>
            <div style={{ display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:"1px solid var(--border)",alignItems:"center" }}><span style={{ fontSize:12,color:"var(--text3)" }}>Tax %</span><input type="number" min="0" max="20" step="0.125" value={taxRate} onChange={e=>setTaxRate(parseFloat(e.target.value)||0)} style={{ width:60,padding:"2px 6px",borderRadius:5,border:"1px solid var(--border)",fontSize:12,textAlign:"right",fontFamily:"var(--mono)" }} /></div>
            <div style={{ display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:"1px solid var(--border)" }}><span style={{ fontSize:12,color:"var(--text3)" }}>Tax</span><span style={{ fontSize:12,fontFamily:"var(--mono)" }}>{fmt$(taxAmt)}</span></div>
            <div style={{ display:"flex",justifyContent:"space-between",padding:"8px 0 0" }}><span style={{ fontSize:15,fontWeight:700,fontFamily:"var(--display)" }}>Total</span><span style={{ fontSize:18,fontFamily:"var(--mono)",fontWeight:700,color:"var(--blue)" }}>{fmt$(total)}</span></div>
          </div>
        </div>
      </div>
      <div style={{ padding:"16px 24px",borderTop:"1px solid var(--border)",display:"flex",justifyContent:"flex-end",gap:10 }}><Btn variant="secondary" onClick={onClose}>Cancel</Btn><Btn onClick={handleSave} disabled={saving}>{saving?"Saving…":"Save Estimate"}</Btn></div>
    </Modal>
  );
}

function EstimateActions({ estimate, onConverted }) {
  const [converting, setConverting] = useState(false);
  async function handleApprove() { try { await apiFetch(`/estimates/${estimate.id}/approve`,{method:"POST"}); alert("Estimate approved!"); } catch(e) { alert(e.message); } }
  async function handleConvert() { setConverting(true); try { await apiFetch(`/estimates/${estimate.id}/convert`,{method:"POST"}); alert("Invoice created! Check the Invoices tab."); onConverted?.(); } catch(e) { alert(e.message); } setConverting(false); }
  return (<div style={{ display:"flex",gap:6,alignItems:"center",flexWrap:"wrap" }}><span style={{ fontSize:11,fontFamily:"var(--mono)",color:"var(--text3)" }}>{estimate.estimate_number}</span><span style={{ fontSize:12,fontFamily:"var(--mono)",fontWeight:600,color:"var(--blue)" }}>{fmt$(estimate.total)}</span><Chip status={estimate.status} />{estimate.status==="draft"&&<Btn small variant="secondary" onClick={handleApprove}>✓ Approve</Btn>}{estimate.status==="approved"&&<Btn small onClick={handleConvert} disabled={converting}>{converting?"Converting…":"→ Create Invoice"}</Btn>}</div>);
}

function JobDetailModal({ job, onClose }) {
  const [notes, setNotes] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [newNote, setNewNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState("notes");
  useEffect(() => {
    async function load() {
      try { const [notesData,photosData]=await Promise.all([apiFetch(`/jobs/${job.id}/notes`).catch(()=>[]),apiFetch(`/jobs/${job.id}/photos`).catch(()=>[])]); setNotes(Array.isArray(notesData)?notesData:[]); setPhotos(Array.isArray(photosData)?photosData:[]); } catch(e) { console.error(e); }
      setLoading(false);
    }
    load();
  }, [job.id]);
  async function addNote() {
    if (!newNote.trim()) return; setSaving(true);
    try { const note=await apiFetch(`/jobs/${job.id}/notes`,{method:"POST",body:JSON.stringify({content:newNote.trim(),note_type:"general"})}); setNotes(p=>[note,...p]); setNewNote(""); } catch(e) { alert(e.message); }
    setSaving(false);
  }
  async function handlePhotoUpload(e) {
    const file=e.target.files[0]; if(!file)return;
    const reader=new FileReader();
    reader.onload=async(ev)=>{try{const photo=await apiFetch(`/jobs/${job.id}/photos`,{method:"POST",body:JSON.stringify({url:ev.target.result,caption:file.name,photo_type:"before"})}); setPhotos(p=>[photo,...p]);}catch(e){setPhotos(p=>[{id:Date.now(),url:ev.target.result,caption:file.name,created_at:new Date().toISOString()},...p]);}};
    reader.readAsDataURL(file);
  }
  const tabStyle=(t)=>({padding:"8px 16px",border:"none",background:tab===t?"var(--blue)":"transparent",color:tab===t?"#fff":"var(--text3)",borderRadius:6,cursor:"pointer",fontSize:13,fontWeight:tab===t?600:400,transition:"all .12s"});
  return (
    <Modal title={`${job.job_number} — ${job.title}`} onClose={onClose} width={600}>
      <div style={{ padding:"0 24px 8px",borderBottom:"1px solid var(--border)",display:"flex",gap:6 }}><button style={tabStyle("notes")} onClick={()=>setTab("notes")}>📝 Notes ({notes.length})</button><button style={tabStyle("photos")} onClick={()=>setTab("photos")}>📷 Photos ({photos.length})</button></div>
      {loading?<Spinner />:(<div style={{ padding:"16px 24px" }}>
        {tab==="notes"&&(<><div style={{ marginBottom:16 }}><textarea value={newNote} onChange={e=>setNewNote(e.target.value)} placeholder="Add a job note…" style={{ ...inputStyle,height:100,resize:"vertical",marginBottom:8 }} /><Btn onClick={addNote} disabled={saving||!newNote.trim()} small>{saving?"Saving…":"+ Add Note"}</Btn></div>{notes.length===0?<div style={{ textAlign:"center",padding:"24px",color:"var(--text3)",fontSize:13 }}>No notes yet.</div>:(<div style={{ display:"flex",flexDirection:"column",gap:10 }}>{notes.map(n=>(<div key={n.id} style={{ background:"var(--surface2)",border:"1px solid var(--border)",borderRadius:8,padding:"12px 14px" }}><div style={{ fontSize:13,color:"var(--text1)",lineHeight:1.6,marginBottom:6 }}>{n.content}</div><div style={{ fontSize:11,color:"var(--text3)" }}>{n.author_name||"Tech"} · {new Date(n.created_at).toLocaleDateString("en-US",{month:"short",day:"numeric",hour:"numeric",minute:"2-digit"})}</div></div>))}</div>)}</>)}
        {tab==="photos"&&(<><div style={{ marginBottom:16 }}><label style={{ display:"inline-block",cursor:"pointer" }}><div style={{ background:"var(--blue)",color:"#fff",padding:"9px 18px",borderRadius:8,fontSize:13,fontWeight:500,display:"inline-flex",alignItems:"center",gap:6 }}>📷 Upload Photo</div><input type="file" accept="image/*" capture="environment" onChange={handlePhotoUpload} style={{ display:"none" }} /></label></div>{photos.length===0?<div style={{ textAlign:"center",padding:"24px",color:"var(--text3)",fontSize:13 }}>No photos yet.</div>:(<div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:10 }}>{photos.map(p=>(<div key={p.id} style={{ borderRadius:8,overflow:"hidden",border:"1px solid var(--border)",background:"var(--surface2)" }}><img src={p.url} alt={p.caption||"Job photo"} style={{ width:"100%",aspectRatio:"1",objectFit:"cover",display:"block" }} /><div style={{ padding:"6px 8px",fontSize:11,color:"var(--text3)" }}>{p.caption||"Photo"}</div></div>))}</div>)}</>)}
      </div>)}
      <div style={{ padding:"12px 24px",borderTop:"1px solid var(--border)",display:"flex",justifyContent:"flex-end" }}><Btn variant="secondary" onClick={onClose}>Close</Btn></div>
    </Modal>
  );
}

// ════════════════════════════════════════════════════════════════
//  TEAM
// ════════════════════════════════════════════════════════════════
function TeamScreen() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  async function load() {
    setLoading(true);
    try { const d=await apiFetch("/users?limit=100"); setMembers(Array.isArray(d)?d:[]); } catch(e) { console.error(e); }
    setLoading(false);
  }
  useEffect(() => { load(); }, []);
  return (
    <div style={{ flex:1,display:"flex",flexDirection:"column",overflow:"hidden" }}>
      {showNew && <NewMemberModal onClose={()=>setShowNew(false)} onSave={async m=>{setMembers(p=>[m,...p]);setShowNew(false);}} />}
      <div style={{ padding:"14px 16px",background:"var(--surface)",borderBottom:"1px solid var(--border)",display:"flex",justifyContent:"space-between",alignItems:"center",flexShrink:0 }}><span style={{ fontSize:16,fontFamily:"var(--display)",fontWeight:700 }}>Team Members</span><Btn small onClick={()=>setShowNew(true)}>+ Add Member</Btn></div>
      <div style={{ flex:1,overflowY:"auto",padding:16 }}>
        {loading?<Spinner />:members.length===0?<EmptyState icon="👷" title="No team members yet" desc="Add your first technician" action={<Btn onClick={()=>setShowNew(true)}>+ Add Member</Btn>} />:(<div style={{ display:"flex",flexDirection:"column",gap:10 }}>{members.map(m=>(<Card key={m.id} style={{ padding:"14px 16px" }}><div style={{ display:"flex",alignItems:"center",gap:14 }}><div style={{ width:44,height:44,borderRadius:"50%",background:"var(--blue-lt)",border:"1px solid var(--blue-bd)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:700,color:"var(--blue)",flexShrink:0 }}>{(m.name||"?").split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase()}</div><div style={{ flex:1,minWidth:0 }}><div style={{ fontSize:15,fontWeight:700,marginBottom:2 }}>{m.name}</div><div style={{ fontSize:12,color:"var(--text3)",marginBottom:4 }}>{m.email}{m.phone?` · ${m.phone}`:""}</div><span style={{ background:"var(--blue-lt)",color:"var(--blue)",fontSize:11,fontWeight:600,padding:"2px 10px",borderRadius:100 }}>{m.role}</span></div><div style={{ width:10,height:10,borderRadius:"50%",background:m.is_active!==false?"#22C55E":"#9CA3AF",flexShrink:0 }} /></div></Card>))}</div>)}
      </div>
    </div>
  );
}

function NewMemberModal({ onClose, onSave }) {
  const [f, setF] = useState({ name:"",email:"",phone:"",password:"",role:"technician" });
  const [saving, setSaving] = useState(false);
  async function save() {
    if (!f.name||!f.email||!f.password){alert("Name, email and password required");return;}
    if (f.password.length<6){alert("Password must be at least 6 characters");return;}
    setSaving(true);
    try { const m=await apiFetch("/users",{method:"POST",body:JSON.stringify(f)}); onSave(m); } catch(e) { alert(e.message); }
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

// ════════════════════════════════════════════════════════════════
//  APP SHELL
// ════════════════════════════════════════════════════════════════
const PAGE_TITLES_MAP = {"/":"Dashboard","/dispatch":"Dispatch","/customers":"Customers","/jobs":"Jobs","/invoices":"Invoices","/team":"Team","/workorder":"Work Order","/pricebook":"Pricebook"};

const MOBILE_NAV = [
  { id:"/",          icon:"⊞",  label:"Home"       },
  { id:"/jobs",      icon:"🔧", label:"Jobs"       },
  { id:"/customers", icon:"👥", label:"Customers"  },
  { id:"/invoices",  icon:"📄", label:"Invoices"   },
  { id:"/workorder", icon:"📋", label:"Work Order" },
];

function AppShell() {
  const { route, navigate } = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  useEffect(() => { const h=()=>setIsMobile(window.innerWidth<1024); window.addEventListener('resize',h); return ()=>window.removeEventListener('resize',h); }, []);

  const screens = {
    "/": <Dashboard />,
    "/dispatch": <DispatchScreen />,
    "/customers": <CustomersScreen />,
    "/invoices": <InvoicesScreen />,
    "/jobs": <JobsScreen />,
    "/team": <TeamScreen />,
    "/workorder": <WorkOrder405 />,
    "/pricebook": <Pricebook />,
  };

  if (isMobile) {
    return (
      <div style={{ display:"flex",flexDirection:"column",height:"100vh",overflow:"hidden",background:"var(--bg)" }}>
        <div style={{ height:52,background:"var(--nav-bg)",borderBottom:"1px solid var(--nav-border)",display:"flex",alignItems:"center",padding:"0 16px",flexShrink:0 }}>
          <div style={{ display:"flex",alignItems:"center",gap:8,flex:1 }}><div style={{ width:28,height:28,borderRadius:7,background:"linear-gradient(135deg,#3B82F6,#1D4ED8)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0 }}>⚡</div><span style={{ fontSize:15,fontFamily:"var(--display)",fontWeight:800,color:"#fff" }}>FieldOps</span></div>
          <span style={{ fontSize:12,fontFamily:"var(--display)",fontWeight:600,color:"#8899BB",whiteSpace:"nowrap" }}>{PAGE_TITLES_MAP[route]||""}</span>
        </div>
        <div style={{ flex:1,overflow:"auto",display:"flex",flexDirection:"column",paddingBottom:60 }}>{screens[route]||screens["/"]}</div>
        <div style={{ position:"fixed",bottom:0,left:0,right:0,height:60,background:"var(--nav-bg)",borderTop:"1px solid var(--nav-border)",display:"flex",alignItems:"center",justifyContent:"space-around",zIndex:1000 }}>
          {MOBILE_NAV.map(item=>(<button key={item.id} onClick={()=>navigate(item.id)} style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:2,background:"none",border:"none",color:route===item.id?"#fff":"var(--nav-text)",cursor:"pointer",padding:"4px 8px",borderRadius:8,minWidth:52,transition:"color .15s" }}><span style={{ fontSize:22,lineHeight:1 }}>{item.icon}</span><span style={{ fontSize:9,fontWeight:route===item.id?700:400,letterSpacing:"0.04em",textTransform:"uppercase" }}>{item.label}</span></button>))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display:"flex",height:"100vh",overflow:"hidden" }}>
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <div style={{ flex:1,display:"flex",flexDirection:"column",overflow:"hidden",minWidth:0 }}>
        <TopBar />
        <div style={{ flex:1,display:"flex",overflow:"hidden" }}>{screens[route]||screens["/"]}</div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
//  ROOT
// ════════════════════════════════════════════════════════════════
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
