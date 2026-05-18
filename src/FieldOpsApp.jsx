/* eslint-disable */
import { useState, useContext, createContext, useCallback, useEffect } from "react";

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
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
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
      const data = await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      localStorage.setItem("fieldops_token", data.token);
      const u = { ...data.user, company: data.company || data.user.company || { name: "My Company" } };
      localStorage.setItem("fsm_user", JSON.stringify(u));
      setUser(u);
      setLoading(false);
      return { ok: true };
    } catch (err) {
      setLoading(false);
      return { ok: false, error: err.message || "Invalid email or password" };
    }
  }

  function logout() {
    setUser(null);
    localStorage.removeItem("fsm_user");
    localStorage.removeItem("fieldops_token");
  }

  return <AuthContext.Provider value={{ user, login, logout, loading }}>{children}</AuthContext.Provider>;
}
const useAuth = () => useContext(AuthContext);

// ════════════════════════════════════════════════════════════════
//  ROUTER
// ════════════════════════════════════════════════════════════════
const RouterContext = createContext(null);
function RouterProvider({ children }) {
  const [route, setRoute] = useState(() => window.location.hash.slice(1) || "/");
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
    e?.preventDefault();
    setError("");
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
            <input value={email} onChange={e=>setEmail(e.target.value)} type="email" placeholder="Email address"
              style={{ padding:"14px 16px",borderRadius:10,background:"rgba(255,255,255,.08)",border:"1px solid rgba(255,255,255,.15)",color:"#fff",fontSize:14,outline:"none" }} />
            <input value={password} onChange={e=>setPassword(e.target.value)} type="password" placeholder="Password"
              style={{ padding:"14px 16px",borderRadius:10,background:"rgba(255,255,255,.08)",border:"1px solid rgba(255,255,255,.15)",color:"#fff",fontSize:14,outline:"none" }}
              onKeyDown={e=>e.key==="Enter"&&handleSubmit()} />
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
];

function Sidebar({ collapsed, setCollapsed }) {
  const { route, navigate } = useRouter();
  const { user, logout } = useAuth();

  return (
    <div style={{ width:collapsed?56:220,flexShrink:0,background:"var(--nav-bg)",borderRight:"1px solid var(--nav-border)",display:"flex",flexDirection:"column",transition:"width .2s ease",overflow:"hidden" }}>
      <div style={{ height:56,display:"flex",alignItems:"center",padding:collapsed?"0":"0 16px",justifyContent:collapsed?"center":"space-between",borderBottom:"1px solid var(--nav-border)",flexShrink:0 }}>
        {!collapsed && (
          <div style={{ display:"flex",alignItems:"center",gap:9 }}>
            <div style={{ width:28,height:28,borderRadius:7,background:"linear-gradient(135deg,#3B82F6,#1D4ED8)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0 }}>⚡</div>
            <span style={{ fontSize:15,fontFamily:"var(--display)",fontWeight:800,color:"#fff",letterSpacing:"-0.01em",whiteSpace:"nowrap" }}>FieldOps</span>
          </div>
        )}
        {collapsed && <span style={{ fontSize:16 }}>⚡</span>}
        {!collapsed && <button onClick={()=>setCollapsed(true)} style={{ background:"none",border:"none",color:"var(--nav-text)",cursor:"pointer",fontSize:14,padding:"4px",borderRadius:4 }}>◀</button>}
      </div>
      {collapsed && <button onClick={()=>setCollapsed(false)} style={{ margin:"8px auto 0",background:"none",border:"none",color:"var(--nav-text)",cursor:"pointer",fontSize:13,padding:"4px 0",width:"100%",textAlign:"center" }}>▶</button>}
      {!collapsed && (
        <div style={{ margin:"10px 10px 4px",padding:"8px 10px",background:"rgba(59,130,246,.08)",border:"1px solid rgba(59,130,246,.15)",borderRadius:7 }}>
          <div style={{ fontSize:10,color:"var(--nav-text)",fontFamily:"var(--display)",letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:2 }}>Workspace</div>
          <div style={{ fontSize:12,color:"#fff",fontWeight:600,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>{user?.company?.name || "My Company"}</div>
        </div>
      )}
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
          onClick={logout}
          onMouseEnter={e=>e.currentTarget.style.background="var(--nav-hover)"}
          onMouseLeave={e=>e.currentTarget.style.background="transparent"}
          title={collapsed?`${user?.name} · Sign out`:""}
        >
          <div style={{ width:28,height:28,borderRadius:"50%",background:"#3B82F620",border:"1px solid #3B82F660",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:"#3B82F6",flexShrink:0,fontFamily:"var(--display)" }}>
            {user?.name?.split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase()}
          </div>
          {!collapsed && (
            <div style={{ flex:1,minWidth:0 }}>
              <div style={{ fontSize:12,fontWeight:600,color:"#fff",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>{user?.name}</div>
              <div style={{ fontSize:10,color:"var(--nav-text)" }}>Sign out</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
//  TOP BAR
// ════════════════════════════════════════════════════════════════
const PAGE_TITLES = {"/":"Dashboard","/dispatch":"Dispatch","/customers":"Customers","/invoices":"Invoices","/jobs":"Jobs"};

function TopBar() {
  const { route } = useRouter();
  return (
    <div style={{ height:56,background:"var(--surface)",borderBottom:"1px solid var(--border)",display:"flex",alignItems:"center",padding:"0 24px",gap:16,flexShrink:0 }}>
      <h1 style={{ flex:1,fontSize:18,fontFamily:"var(--display)",fontWeight:700,letterSpacing:"-0.01em" }}>{PAGE_TITLES[route]||"FieldOps"}</h1>
      <div style={{ fontSize:11,color:"var(--text3)",fontFamily:"var(--mono)",whiteSpace:"nowrap" }}>
        {new Date().toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"})}
      </div>
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
      try {
        const [s, j] = await Promise.all([
          apiFetch("/company/stats"),
          apiFetch("/jobs?limit=5"),
        ]);
        setStats(s);
        setJobs(Array.isArray(j) ? j : []);
      } catch(e) { console.error(e); }
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
        {[
          {label:"Jobs Today",val:stats?.jobs_today??0,icon:"📅",color:"var(--blue)"},
          {label:"This Week",val:stats?.jobs_this_week??0,icon:"📆",color:"var(--purple,#7C3AED)"},
          {label:"Revenue / Month",val:fmt$(stats?.revenue_this_month??0),icon:"💰",color:"var(--green)"},
          {label:"Open Invoices",val:fmt$(stats?.open_invoices_total??0),icon:"📄",color:"var(--amber)"},
        ].map((k,i) => (
          <Card key={i} className={`fade-in s${Math.min(i+1,3)}`} style={{ padding:"16px 18px" }}>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10 }}>
              <span style={{ fontSize:11,color:"var(--text3)",fontWeight:600,fontFamily:"var(--display)",letterSpacing:"0.06em",textTransform:"uppercase" }}>{k.label}</span>
              <span style={{ fontSize:18 }}>{k.icon}</span>
            </div>
            <div style={{ fontSize:26,fontFamily:"var(--mono)",fontWeight:600,color:k.color,lineHeight:1 }}>{k.val}</div>
          </Card>
        ))}
      </div>
      <Card>
        <div style={{ padding:"18px 20px 0",display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16 }}>
          <h3 style={{ fontSize:14,fontWeight:700,fontFamily:"var(--display)" }}>Recent Jobs</h3>
          <Btn small variant="secondary" onClick={()=>navigate("/jobs")}>View all →</Btn>
        </div>
        {jobs.length === 0 ? (
          <EmptyState icon="🔧" title="No jobs yet" desc="Create your first job to get started" action={<Btn onClick={()=>navigate("/jobs")}>+ New Job</Btn>} />
        ) : (
          <table style={{ width:"100%",borderCollapse:"collapse" }}>
            <thead>
              <tr style={{ background:"var(--surface2)" }}>
                {["Job #","Title","Customer","Status"].map(h=>(
                  <th key={h} style={{ padding:"8px 16px",textAlign:"left",fontSize:11,fontWeight:600,color:"var(--text3)",fontFamily:"var(--display)",letterSpacing:"0.06em",textTransform:"uppercase",borderTop:"1px solid var(--border)",borderBottom:"1px solid var(--border)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {jobs.map((job,i) => (
                <tr key={job.id} style={{ borderBottom:"1px solid var(--border)",cursor:"pointer",transition:"background .1s" }}
                  onMouseEnter={e=>e.currentTarget.style.background="var(--surface2)"}
                  onMouseLeave={e=>e.currentTarget.style.background=""}
                  onClick={()=>navigate("/jobs")}
                >
                  <td style={{ padding:"12px 16px",fontSize:12,fontFamily:"var(--mono)",color:"var(--text3)" }}>{job.job_number}</td>
                  <td style={{ padding:"12px 16px",fontSize:13,fontWeight:500 }}>{job.title}</td>
                  <td style={{ padding:"12px 16px",fontSize:13,color:"var(--text2)" }}>{job.customer_name}</td>
                  <td style={{ padding:"12px 16px" }}><Chip status={job.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
//  CUSTOMERS
// ════════════════════════════════════════════════════════════════
function CustomersScreen() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [showNew, setShowNew] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const data = await apiFetch(`/customers?limit=100${search?`&search=${search}`:""}`);
      setCustomers(Array.isArray(data) ? data : []);
    } catch(e) { console.error(e); }
    setLoading(false);
  }

  useEffect(() => { load(); }, [search]);

  async function handleCreate(form) {
    try {
      const newCust = await apiFetch("/customers", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setCustomers(p => [newCust, ...p]);
      setSelected(newCust);
      setShowNew(false);
    } catch(e) { alert(e.message); }
  }

  return (
    <div style={{ flex:1,display:"flex",overflow:"hidden" }}>
      {showNew && <NewCustomerModal onClose={()=>setShowNew(false)} onSave={handleCreate} />}
      <div style={{ width:300,flexShrink:0,borderRight:"1px solid var(--border)",background:"var(--surface)",display:"flex",flexDirection:"column" }}>
        <div style={{ padding:"14px 14px 10px",borderBottom:"1px solid var(--border)" }}>
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10 }}>
            <span style={{ fontSize:15,fontFamily:"var(--display)",fontWeight:700 }}>Customers</span>
            <Btn small onClick={()=>setShowNew(true)}>+ New</Btn>
          </div>
          <div style={{ position:"relative" }}>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search…" style={{ ...inputStyle,paddingLeft:28 }} />
            <span style={{ position:"absolute",left:9,top:"50%",transform:"translateY(-50%)",color:"var(--text3)",fontSize:12 }}>⌕</span>
          </div>
        </div>
        <div style={{ flex:1,overflowY:"auto" }}>
          {loading ? <Spinner /> : customers.length === 0 ? (
            <div style={{ padding:24,textAlign:"center",color:"var(--text3)",fontSize:13 }}>
              {search ? "No customers found" : "No customers yet — add your first one!"}
            </div>
          ) : customers.map(c => (
            <div key={c.id} onClick={()=>setSelected(c)} style={{ padding:"11px 14px",borderBottom:"1px solid var(--border)",cursor:"pointer",background:selected?.id===c.id?"var(--blue-lt)":"transparent",borderLeft:selected?.id===c.id?"3px solid var(--blue)":"3px solid transparent",transition:"background .1s" }}
              onMouseEnter={e=>{if(selected?.id!==c.id)e.currentTarget.style.background="var(--surface2)"}}
              onMouseLeave={e=>{if(selected?.id!==c.id)e.currentTarget.style.background="transparent"}}
            >
              <div style={{ fontSize:13,fontWeight:600,marginBottom:2 }}>{c.first_name} {c.last_name}</div>
              <div style={{ fontSize:11,color:"var(--text3)" }}>{c.phone} · {c.job_count||0} jobs</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ flex:1,overflowY:"auto",padding:28 }}>
        {selected ? (
          <div className="fade-in">
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:24 }}>
              <div>
                <h2 style={{ fontSize:24,fontFamily:"var(--display)",fontWeight:800,marginBottom:4 }}>{selected.first_name} {selected.last_name}</h2>
                <div style={{ display:"flex",gap:12,color:"var(--text3)",fontSize:13 }}>
                  {selected.phone && <span>📞 {selected.phone}</span>}
                  {selected.email && <span>✉ {selected.email}</span>}
                </div>
              </div>
              <Btn small>+ New Job</Btn>
            </div>
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12 }}>
              <Card style={{ padding:"16px 18px" }}>
                <div style={{ fontSize:11,fontWeight:600,color:"var(--text3)",letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:10,fontFamily:"var(--display)" }}>Contact Info</div>
                {[["Phone",selected.phone],["Email",selected.email],["Source",selected.source]].map(([l,v])=>v&&(
                  <div key={l} style={{ display:"flex",gap:12,marginBottom:8 }}>
                    <span style={{ fontSize:12,color:"var(--text3)",width:60,flexShrink:0 }}>{l}</span>
                    <span style={{ fontSize:13 }}>{v}</span>
                  </div>
                ))}
              </Card>
              <Card style={{ padding:"16px 18px" }}>
                <div style={{ fontSize:11,fontWeight:600,color:"var(--text3)",letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:10,fontFamily:"var(--display)" }}>Stats</div>
                <div style={{ fontSize:24,fontFamily:"var(--mono)",fontWeight:700,color:"var(--blue)" }}>{selected.job_count||0}</div>
                <div style={{ fontSize:12,color:"var(--text3)" }}>Total jobs</div>
              </Card>
              {selected.notes && (
                <Card style={{ padding:"16px 18px",gridColumn:"1/-1" }}>
                  <div style={{ fontSize:11,fontWeight:600,color:"var(--text3)",letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:8,fontFamily:"var(--display)" }}>Notes</div>
                  <p style={{ fontSize:13,color:"var(--text2)",lineHeight:1.6,fontStyle:"italic" }}>"{selected.notes}"</p>
                </Card>
              )}
            </div>
          </div>
        ) : (
          <EmptyState icon="👥" title="Select a customer" desc="Click a customer on the left to view their details" />
        )}
      </div>
    </div>
  );
}

function NewCustomerModal({ onClose, onSave }) {
  const [form, setForm] = useState({ first_name:"",last_name:"",email:"",phone:"",notes:"",source:"",location:{ address_line1:"",city:"",state:"OK",zip:"",access_notes:"" } });
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
        <FormField label="How did they find you?">
          <select style={inputStyle} value={form.source} onChange={e=>set("source",e.target.value)}>
            <option value="">Select source</option>
            {["Referral","Google","Yelp","Facebook","Door hanger","Repeat customer","Other"].map(s=><option key={s}>{s}</option>)}
          </select>
        </FormField>
        <div style={{ borderTop:"1px solid var(--border)",paddingTop:14 }}>
          <div style={{ fontSize:11,fontWeight:600,color:"var(--text3)",letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:10 }}>Service Location (optional)</div>
          <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
            <input style={inputStyle} value={form.location.address_line1} onChange={e=>setLoc("address_line1",e.target.value)} placeholder="Street address" />
            <div style={{ display:"grid",gridTemplateColumns:"2fr 1fr 1fr",gap:10 }}>
              <input style={inputStyle} value={form.location.city} onChange={e=>setLoc("city",e.target.value)} placeholder="City" />
              <input style={inputStyle} value={form.location.state} onChange={e=>setLoc("state",e.target.value)} placeholder="State" />
              <input style={inputStyle} value={form.location.zip} onChange={e=>setLoc("zip",e.target.value)} placeholder="Zip" />
            </div>
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

  async function load() {
    setLoading(true);
    try {
      const data = await apiFetch(`/jobs?limit=100${filterStatus!=="all"?`&status=${filterStatus}`:""}`);
      setJobs(Array.isArray(data) ? data : []);
    } catch(e) { console.error(e); }
    setLoading(false);
  }

  useEffect(() => { load(); }, [filterStatus]);

  async function handleStatusChange(jobId, newStatus) {
    try {
      await apiFetch(`/jobs/${jobId}/status`, { method:"PATCH", body:JSON.stringify({status:newStatus}) });
      setJobs(p => p.map(j => j.id===jobId ? {...j,status:newStatus} : j));
    } catch(e) { alert(e.message); }
  }

  return (
    <div style={{ flex:1,display:"flex",flexDirection:"column",overflow:"hidden" }}>
      {showNew && <NewJobModal onClose={()=>setShowNew(false)} onSave={async(job)=>{ setJobs(p=>[job,...p]); setShowNew(false); }} />}
      <div style={{ padding:"12px 20px",background:"var(--surface)",borderBottom:"1px solid var(--border)",display:"flex",gap:8,alignItems:"center" }}>
        <div style={{ display:"flex",gap:4 }}>
          {["all","scheduled","in_progress","en_route","completed"].map(s=>(
            <button key={s} onClick={()=>setFilterStatus(s)} style={{ fontSize:11,padding:"4px 10px",borderRadius:100,background:filterStatus===s?"var(--blue)":"var(--surface2)",color:filterStatus===s?"#fff":"var(--text3)",border:filterStatus===s?"none":"1px solid var(--border)",cursor:"pointer",textTransform:"capitalize",fontWeight:filterStatus===s?600:400 }}>
              {s==="all"?"All":STATUS_CFG[s]?.label||s}
            </button>
          ))}
        </div>
        <div style={{ marginLeft:"auto" }}><Btn small onClick={()=>setShowNew(true)}>+ New Job</Btn></div>
      </div>
      <div style={{ flex:1,overflowY:"auto",padding:16 }}>
        {loading ? <Spinner /> : jobs.length===0 ? (
          <EmptyState icon="🔧" title="No jobs yet" desc="Create your first job to get started" action={<Btn onClick={()=>setShowNew(true)}>+ New Job</Btn>} />
        ) : (
          <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
            {jobs.map(job => (
              <Card key={job.id} style={{ padding:"14px 18px" }}>
                <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8 }}>
                  <div>
                    <div style={{ fontSize:11,fontFamily:"var(--mono)",color:"var(--text3)",marginBottom:3 }}>{job.job_number}</div>
                    <div style={{ fontSize:16,fontWeight:700,fontFamily:"var(--display)" }}>{job.title}</div>
                  </div>
                  <Chip status={job.status} />
                </div>
                <div style={{ display:"flex",gap:16,fontSize:13,color:"var(--text2)" }}>
                  <span>👤 {job.customer_name}</span>
                  <span>📍 {job.city}, {job.state}</span>
                  {job.scheduled_start && <span>🕐 {new Date(job.scheduled_start).toLocaleDateString("en-US",{month:"short",day:"numeric"})}</span>}
                </div>
                {["scheduled","in_progress","en_route"].includes(job.status) && (
                  <div style={{ marginTop:10,display:"flex",gap:6 }}>
                    {job.status==="scheduled" && <Btn small variant="secondary" onClick={()=>handleStatusChange(job.id,"en_route")}>→ En Route</Btn>}
                    {job.status==="en_route" && <Btn small variant="secondary" onClick={()=>handleStatusChange(job.id,"in_progress")}>→ Start Job</Btn>}
                    {job.status==="in_progress" && <Btn small onClick={()=>handleStatusChange(job.id,"completed")}>✓ Complete</Btn>}
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

function NewJobModal({ onClose, onSave }) {
  const [customers, setCustomers] = useState([]);
  const [form, setForm] = useState({ customer_id:"",location_id:"",title:"",description:"",priority:"normal",scheduled_start:"",scheduled_end:"" });
  const [locations, setLocations] = useState([]);

  useEffect(() => {
    apiFetch("/customers?limit=100").then(d=>setCustomers(Array.isArray(d)?d:[])).catch(()=>{});
  }, []);

  async function handleCustomerChange(id) {
    setForm(p=>({...p,customer_id:id,location_id:""}));
    if(id) {
      try {
        const cust = await apiFetch(`/customers/${id}`);
        setLocations(cust.locations||[]);
        if(cust.locations?.length===1) setForm(p=>({...p,location_id:cust.locations[0].id}));
      } catch(e) {}
    }
  }

  async function handleSave() {
    if(!form.customer_id||!form.location_id||!form.title){alert("Customer, location and title required");return;}
    try {
      const job = await apiFetch("/jobs",{method:"POST",body:JSON.stringify(form)});
      onSave(job);
    } catch(e){alert(e.message);}
  }

  return (
    <Modal title="New Job" onClose={onClose}>
      <div style={{ padding:"20px 24px",display:"flex",flexDirection:"column",gap:14 }}>
        <FormField label="Customer *">
          <select style={inputStyle} value={form.customer_id} onChange={e=>handleCustomerChange(e.target.value)}>
            <option value="">Select customer…</option>
            {customers.map(c=><option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>)}
          </select>
        </FormField>
        {locations.length>0 && (
          <FormField label="Location *">
            <select style={inputStyle} value={form.location_id} onChange={e=>setForm(p=>({...p,location_id:e.target.value}))}>
              <option value="">Select location…</option>
              {locations.map(l=><option key={l.id} value={l.id}>{l.address_line1}, {l.city}</option>)}
            </select>
          </FormField>
        )}
        <FormField label="Job Title *"><input style={inputStyle} value={form.title} onChange={e=>setForm(p=>({...p,title:e.target.value}))} placeholder="e.g. AC Not Cooling" /></FormField>
        <FormField label="Description"><textarea style={{...inputStyle,height:80,resize:"vertical"}} value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))} placeholder="Describe the issue…" /></FormField>
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12 }}>
          <FormField label="Priority">
            <select style={inputStyle} value={form.priority} onChange={e=>setForm(p=>({...p,priority:e.target.value}))}>
              {["low","normal","high","urgent"].map(p=><option key={p} value={p}>{p.charAt(0).toUpperCase()+p.slice(1)}</option>)}
            </select>
          </FormField>
        </div>
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12 }}>
          <FormField label="Start Time"><input style={inputStyle} type="datetime-local" value={form.scheduled_start} onChange={e=>setForm(p=>({...p,scheduled_start:e.target.value}))} /></FormField>
          <FormField label="End Time"><input style={inputStyle} type="datetime-local" value={form.scheduled_end} onChange={e=>setForm(p=>({...p,scheduled_end:e.target.value}))} /></FormField>
        </div>
      </div>
      <div style={{ padding:"16px 24px",borderTop:"1px solid var(--border)",display:"flex",justifyContent:"flex-end",gap:10 }}>
        <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
        <Btn onClick={handleSave}>Create Job</Btn>
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

  useEffect(() => {
    setLoading(true);
    apiFetch(`/dispatch?date=${date}`)
      .then(d=>setData(d))
      .catch(()=>setData({technicians:[],unassigned:[]}))
      .finally(()=>setLoading(false));
  }, [date]);

  if(loading) return <div style={{ flex:1,display:"flex",alignItems:"center",justifyContent:"center" }}><Spinner /></div>;

  const techs = data?.technicians||[];
  const unassigned = data?.unassigned||[];

  return (
    <div style={{ flex:1,display:"flex",flexDirection:"column",overflow:"hidden" }}>
      <div style={{ padding:"12px 20px",background:"var(--surface)",borderBottom:"1px solid var(--border)",display:"flex",gap:12,alignItems:"center" }}>
        <input type="date" value={date} onChange={e=>setDate(e.target.value)} style={{ ...inputStyle,width:"auto",padding:"6px 10px" }} />
        <span style={{ fontSize:13,color:"var(--text3)" }}>{techs.length} technician{techs.length!==1?"s":""} · {unassigned.length} unassigned</span>
      </div>
      <div style={{ flex:1,overflowY:"auto",padding:16,display:"flex",flexDirection:"column",gap:10 }}>
        {techs.length===0 && unassigned.length===0 && (
          <EmptyState icon="📡" title="No jobs scheduled" desc={`No jobs found for ${fmtDate(date)}`} />
        )}
        {unassigned.length>0 && (
          <Card style={{ border:"1px solid var(--red-bd)",overflow:"hidden" }}>
            <div style={{ padding:"10px 16px",background:"var(--red-lt)",borderBottom:"1px solid var(--red-bd)",fontSize:13,fontWeight:600,color:"var(--red)" }}>
              ● Unassigned ({unassigned.length})
            </div>
            <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:8,padding:10 }}>
              {unassigned.map(job=>(
                <div key={job.id} style={{ background:"var(--surface2)",border:"1px solid var(--border)",borderLeft:"3px solid var(--red)",borderRadius:8,padding:"10px 12px" }}>
                  <div style={{ fontSize:11,fontFamily:"var(--mono)",color:"var(--text3)",marginBottom:3 }}>{job.job_number}</div>
                  <div style={{ fontSize:13,fontWeight:600,marginBottom:3 }}>{job.title}</div>
                  <div style={{ fontSize:11,color:"var(--text3)" }}>{job.customer_name}</div>
                </div>
              ))}
            </div>
          </Card>
        )}
        {techs.map(tech=>(
          <Card key={tech.id} style={{ overflow:"hidden" }}>
            <div style={{ padding:"10px 16px",background:"var(--surface2)",borderBottom:tech.jobs?.length?"1px solid var(--border)":"none",display:"flex",alignItems:"center",gap:10 }}>
              <div style={{ width:32,height:32,borderRadius:"50%",background:"var(--blue-lt)",border:"1px solid var(--blue-bd)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:"var(--blue)",flexShrink:0 }}>
                {tech.name?.split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase()}
              </div>
              <span style={{ fontSize:13,fontWeight:600 }}>{tech.name}</span>
              <span style={{ fontSize:11,color:"var(--text3)",marginLeft:4 }}>{tech.jobs?.length||0} job{tech.jobs?.length!==1?"s":""}</span>
            </div>
            {tech.jobs?.length>0 ? (
              <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:8,padding:10 }}>
                {tech.jobs.map(job=>{
                  const sc=STATUS_CFG[job.status]||STATUS_CFG.scheduled;
                  return (
                    <div key={job.id} style={{ background:"var(--surface2)",border:`1px solid ${sc.bd}`,borderLeft:`3px solid ${sc.color}`,borderRadius:8,padding:"10px 12px" }}>
                      <div style={{ display:"flex",justifyContent:"space-between",marginBottom:5 }}>
                        <span style={{ fontSize:11,fontFamily:"var(--mono)",color:"var(--text3)" }}>{job.job_number}</span>
                        <Chip status={job.status} />
                      </div>
                      <div style={{ fontSize:13,fontWeight:600,marginBottom:3 }}>{job.title}</div>
                      <div style={{ fontSize:11,color:"var(--text3)" }}>{job.customer_name}</div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ padding:"12px 18px",fontSize:12,color:"var(--text4)",fontStyle:"italic" }}>No jobs scheduled</div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
//  INVOICES
// ════════════════════════════════════════════════════════════════
function InvoicesScreen() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    setLoading(true);
    apiFetch(`/invoices?limit=100${filterStatus!=="all"?`&status=${filterStatus}`:""}`)
      .then(d=>setInvoices(Array.isArray(d)?d:[]))
      .catch(()=>{})
      .finally(()=>setLoading(false));
  }, [filterStatus]);

  return (
    <div style={{ flex:1,display:"flex",overflow:"hidden" }}>
      <div style={{ width:310,flexShrink:0,borderRight:"1px solid var(--border)",background:"var(--surface)",display:"flex",flexDirection:"column" }}>
        <div style={{ padding:"14px 14px 10px",borderBottom:"1px solid var(--border)" }}>
          <div style={{ fontSize:15,fontFamily:"var(--display)",fontWeight:700,marginBottom:10 }}>Invoices</div>
          <div style={{ display:"flex",gap:4,flexWrap:"wrap" }}>
            {["all","draft","sent","partial","overdue","paid"].map(s=>(
              <button key={s} onClick={()=>setFilterStatus(s)} style={{ fontSize:11,padding:"3px 9px",borderRadius:100,background:filterStatus===s?"var(--blue)":"var(--surface2)",color:filterStatus===s?"#fff":"var(--text3)",border:filterStatus===s?"none":"1px solid var(--border)",cursor:"pointer",textTransform:"capitalize",fontWeight:filterStatus===s?600:400 }}>
                {s}
              </button>
            ))}
          </div>
        </div>
        <div style={{ flex:1,overflowY:"auto" }}>
          {loading ? <Spinner /> : invoices.length===0 ? (
            <div style={{ padding:24,textAlign:"center",color:"var(--text3)",fontSize:13 }}>No invoices found</div>
          ) : invoices.map(inv=>{
            const sel=selected?.id===inv.id;
            const balance=inv.total-inv.amount_paid;
            return (
              <div key={inv.id} onClick={()=>setSelected(inv)} style={{ padding:"12px 14px",borderBottom:"1px solid var(--border)",cursor:"pointer",background:sel?"var(--blue-lt)":"transparent",borderLeft:sel?"3px solid var(--blue)":"3px solid transparent",transition:"background .1s" }}
                onMouseEnter={e=>{if(!sel)e.currentTarget.style.background="var(--surface2)"}}
                onMouseLeave={e=>{if(!sel)e.currentTarget.style.background="transparent"}}
              >
                <div style={{ display:"flex",justifyContent:"space-between",marginBottom:4 }}>
                  <span style={{ fontSize:12,fontFamily:"var(--mono)",fontWeight:600,color:sel?"var(--blue)":"var(--text2)" }}>{inv.invoice_number}</span>
                  <Chip status={inv.status} />
                </div>
                <div style={{ fontSize:13,fontWeight:500,marginBottom:2 }}>{inv.customer_name}</div>
                <div style={{ display:"flex",justifyContent:"space-between" }}>
                  <span style={{ fontSize:11,color:"var(--text3)" }}>Due {fmtDate(inv.due_date)}</span>
                  <span style={{ fontSize:14,fontFamily:"var(--mono)",fontWeight:700,color:inv.status==="paid"?"var(--green)":inv.status==="overdue"?"var(--red)":"var(--text1)" }}>
                    {inv.status==="paid"?fmt$(inv.amount_paid):fmt$(balance)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div style={{ flex:1,overflowY:"auto",padding:28 }}>
        {selected ? (
          <div className="fade-in">
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:24 }}>
              <div>
                <div style={{ fontSize:12,fontFamily:"var(--mono)",color:"var(--text3)",marginBottom:4 }}>{selected.job_number}</div>
                <div style={{ display:"flex",alignItems:"center",gap:12,marginBottom:6 }}>
                  <h2 style={{ fontSize:24,fontFamily:"var(--display)",fontWeight:800 }}>{selected.invoice_number}</h2>
                  <Chip status={selected.status} />
                </div>
                <div style={{ fontSize:13,color:"var(--text3)" }}>{selected.customer_name} · Due {fmtDate(selected.due_date)}</div>
              </div>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontSize:10,color:"var(--text3)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:4 }}>{selected.status==="paid"?"Paid":"Balance Due"}</div>
                <div style={{ fontSize:32,fontFamily:"var(--mono)",fontWeight:700,color:selected.status==="paid"?"var(--green)":selected.status==="overdue"?"var(--red)":"var(--text1)" }}>
                  {selected.status==="paid"?fmt$(selected.amount_paid):fmt$(selected.total-selected.amount_paid)}
                </div>
              </div>
            </div>
            <div style={{ display:"flex",gap:8,marginBottom:24 }}>
              {["sent","partial","overdue"].includes(selected.status) && <Btn>💳 Collect Payment</Btn>}
              <Btn variant="secondary">⬇ Download PDF</Btn>
              <Btn variant="secondary">✉ Email</Btn>
            </div>
            <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12 }}>
              {[
                {label:"Invoice Total",val:fmt$(selected.total),color:"var(--text1)"},
                {label:"Amount Paid",val:fmt$(selected.amount_paid),color:"var(--green)"},
                {label:"Balance",val:fmt$(selected.total-selected.amount_paid),color:selected.total-selected.amount_paid>0?"var(--red)":"var(--green)"},
              ].map((s,i)=>(
                <Card key={i} style={{ padding:"14px 18px" }}>
                  <div style={{ fontSize:10,color:"var(--text3)",letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:6,fontFamily:"var(--display)",fontWeight:600 }}>{s.label}</div>
                  <div style={{ fontSize:20,fontFamily:"var(--mono)",fontWeight:700,color:s.color }}>{s.val}</div>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          <EmptyState icon="📄" title="Select an invoice" desc="Click an invoice on the left to view details" />
        )}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
//  APP SHELL
// ════════════════════════════════════════════════════════════════
function AppShell() {
  const { route } = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  const screens = {
    "/": <Dashboard />,
    "/dispatch": <DispatchScreen />,
    "/customers": <CustomersScreen />,
    "/invoices": <InvoicesScreen />,
    "/jobs": <JobsScreen />,
  };

  return (
    <div style={{ display:"flex",height:"100vh",overflow:"hidden" }}>
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <div style={{ flex:1,display:"flex",flexDirection:"column",overflow:"hidden",minWidth:0 }}>
        <TopBar />
        <div style={{ flex:1,display:"flex",overflow:"hidden" }}>
          {screens[route] || screens["/"]}
        </div>
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
      <RouterProvider>
        <AuthProvider>
          <AppInner />
        </AuthProvider>
      </RouterProvider>
    </>
  );
}

function AppInner() {
  const { user } = useAuth();
  return user ? <AppShell /> : <LoginScreen />;
}

export default AppWithProviders;
