/* eslint-disable */
import { useState, useContext, createContext, useCallback, useEffect } from "react";

// ─── STYLES ──────────────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Epilogue:wght@300;400;500;600&family=DM+Mono:wght@400;500;600&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  :root{
    --nav-bg:#0C1220;--nav-border:#1A2340;--nav-text:#8899BB;--nav-hover:#1E2D4A;--nav-accent:#3B82F6;
    --bg:#F1F3F7;--surface:#FFFFFF;--surface2:#F8F9FB;--border:#E4E8EF;--border2:#CDD3DE;
    --text1:#0D1117;--text2:#4A5568;--text3:#8A94A6;--text4:#B8C2CC;
    --blue:#2563EB;--blue-lt:#EFF6FF;--blue-bd:#BFDBFE;
    --green:#0D7B4E;--green-lt:#ECFDF5;--green-bd:#A7F3D0;
    --amber:#B45309;--amber-lt:#FFFBEB;--amber-bd:#FCD34D;
    --red:#DC2626;--red-lt:#FEF2F2;--red-bd:#FECACA;
    --display:'Syne',sans-serif;--sans:'Epilogue',-apple-system,sans-serif;--mono:'DM Mono',monospace;
  }
  html,body,#root{height:100%}
  body{font-family:var(--sans);background:var(--bg);color:var(--text1);font-size:14px;line-height:1.5}
  button{font-family:var(--sans);cursor:pointer}
  input,textarea,select{font-family:var(--sans);color:var(--text1)}
  ::-webkit-scrollbar{width:4px;height:4px}
  ::-webkit-scrollbar-track{background:transparent}
  ::-webkit-scrollbar-thumb{background:var(--border2);border-radius:8px}
  @keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
  @keyframes spin{to{transform:rotate(360deg)}}
  .fade-in{animation:fadeIn .2s ease both}
  .s1{animation-delay:.05s}.s2{animation-delay:.10s}.s3{animation-delay:.15s}
`;

// ─── API ─────────────────────────────────────────────────────────────────────
const API = process.env.REACT_APP_API_URL || "https://fieldops-api-production-b341.up.railway.app/v1";

const getToken = () => localStorage.getItem("fieldops_token");

async function api(path, opts = {}) {
  const token = getToken();
  const res = await fetch(`${API}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...opts.headers,
    },
    ...opts,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message || "Request failed");
  return data.data;
}

// ─── AUTH ─────────────────────────────────────────────────────────────────────
const AuthCtx = createContext(null);
const useAuth = () => useContext(AuthCtx);

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const u = localStorage.getItem("fsm_user");
    const t = localStorage.getItem("fieldops_token");
    if (u && t) try { setUser(JSON.parse(u)); } catch {}
  }, []);

  async function login(email, password) {
    setLoading(true);
    try {
      const data = await api("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
      localStorage.setItem("fieldops_token", data.token);
      const u = { ...data.user, company: data.company || data.user?.company || { name: "405 Heating & Air Conditioning" } };
      localStorage.setItem("fsm_user", JSON.stringify(u));
      setUser(u);
      setLoading(false);
      return { ok: true };
    } catch (e) {
      setLoading(false);
      return { ok: false, error: e.message };
    }
  }

  function logout() {
    setUser(null);
    localStorage.removeItem("fsm_user");
    localStorage.removeItem("fieldops_token");
  }

  return <AuthCtx.Provider value={{ user, login, logout, loading }}>{children}</AuthCtx.Provider>;
}

// ─── ROUTER ───────────────────────────────────────────────────────────────────
const RouterCtx = createContext(null);
const useRouter = () => useContext(RouterCtx);

function RouterProvider({ children }) {
  const [route, setRoute] = useState(() => window.location.hash.slice(1) || "/");
  const navigate = useCallback(p => { window.location.hash = p; setRoute(p); }, []);
  useEffect(() => {
    const h = () => setRoute(window.location.hash.slice(1) || "/");
    window.addEventListener("hashchange", h);
    return () => window.removeEventListener("hashchange", h);
  }, []);
  return <RouterCtx.Provider value={{ route, navigate }}>{children}</RouterCtx.Provider>;
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const fmt$ = n => n == null ? "—" : "$" + Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtDate = s => s ? new Date(s).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";
const round2 = n => Math.round(n * 100) / 100;

const STATUS = {
  scheduled:   { label:"Scheduled",   color:"#2563EB", bg:"#EFF6FF", bd:"#BFDBFE" },
  in_progress: { label:"In Progress", color:"#D97706", bg:"#FFFBEB", bd:"#FCD34D" },
  en_route:    { label:"En Route",    color:"#7C3AED", bg:"#F5F3FF", bd:"#DDD6FE" },
  completed:   { label:"Completed",   color:"#0D7B4E", bg:"#ECFDF5", bd:"#A7F3D0" },
  cancelled:   { label:"Cancelled",   color:"#6B7280", bg:"#F9FAFB", bd:"#E5E7EB" },
  on_hold:     { label:"On Hold",     color:"#DC2626", bg:"#FEF2F2", bd:"#FECACA" },
  unscheduled: { label:"Unscheduled", color:"#6B7280", bg:"#F9FAFB", bd:"#E5E7EB" },
  draft:       { label:"Draft",       color:"#6B7280", bg:"#F9FAFB", bd:"#E5E7EB" },
  sent:        { label:"Sent",        color:"#2563EB", bg:"#EFF6FF", bd:"#BFDBFE" },
  paid:        { label:"Paid",        color:"#0D7B4E", bg:"#ECFDF5", bd:"#A7F3D0" },
  overdue:     { label:"Overdue",     color:"#DC2626", bg:"#FEF2F2", bd:"#FECACA" },
  partial:     { label:"Partial",     color:"#D97706", bg:"#FFFBEB", bd:"#FCD34D" },
  approved:    { label:"Approved",    color:"#0D7B4E", bg:"#ECFDF5", bd:"#A7F3D0" },
  declined:    { label:"Declined",    color:"#DC2626", bg:"#FEF2F2", bd:"#FECACA" },
};

// ─── UI ATOMS ─────────────────────────────────────────────────────────────────
function Chip({ status }) {
  const c = STATUS[status] || STATUS.draft;
  return (
    <span style={{ display:"inline-flex",alignItems:"center",gap:5,background:c.bg,color:c.color,border:`1px solid ${c.bd}`,borderRadius:4,padding:"2px 8px",fontSize:11,fontWeight:600,fontFamily:"var(--display)",letterSpacing:"0.04em",whiteSpace:"nowrap" }}>
      <span style={{ width:5,height:5,borderRadius:"50%",background:c.color,flexShrink:0 }} />{c.label}
    </span>
  );
}

function Btn({ children, variant="primary", onClick, small, disabled, style:sx={} }) {
  const v = {
    primary:   { background:"var(--blue)",   color:"#fff",            border:"1px solid transparent" },
    secondary: { background:"var(--surface)", color:"var(--text2)",   border:"1px solid var(--border)" },
    ghost:     { background:"transparent",    color:"var(--text3)",   border:"1px solid transparent" },
    danger:    { background:"var(--red-lt)",  color:"var(--red)",     border:"1px solid var(--red-bd)" },
    green:     { background:"var(--green-lt)",color:"var(--green)",   border:"1px solid var(--green-bd)" },
  };
  return (
    <button onClick={disabled ? undefined : onClick} style={{ ...v[variant],borderRadius:8,fontWeight:500,padding:small?"5px 12px":"9px 18px",fontSize:small?12:13,opacity:disabled?.5:1,cursor:disabled?"not-allowed":"pointer",transition:"all .12s",...sx }}
      onMouseEnter={e=>{ if(!disabled) e.currentTarget.style.filter="brightness(.9)"; }}
      onMouseLeave={e=>e.currentTarget.style.filter=""}
    >{children}</button>
  );
}

function Card({ children, style:sx={}, className="" }) {
  return <div className={className} style={{ background:"var(--surface)",border:"1px solid var(--border)",borderRadius:12,...sx }}>{children}</div>;
}

function Spinner() {
  return <div style={{ width:24,height:24,border:"2px solid var(--border)",borderTopColor:"var(--blue)",borderRadius:"50%",animation:"spin .7s linear infinite",margin:"60px auto" }} />;
}

function Empty({ icon, title, desc, action }) {
  return (
    <div style={{ textAlign:"center",padding:"60px 20px" }}>
      <div style={{ fontSize:48,marginBottom:12 }}>{icon}</div>
      <div style={{ fontSize:18,fontFamily:"var(--display)",fontWeight:700,color:"var(--text1)",marginBottom:8 }}>{title}</div>
      <div style={{ fontSize:13,color:"var(--text3)",marginBottom:20,maxWidth:280,margin:"0 auto 20px" }}>{desc}</div>
      {action}
    </div>
  );
}

const INP = { width:"100%",padding:"9px 12px",borderRadius:7,fontSize:13,border:"1px solid var(--border)",outline:"none",background:"var(--surface)",transition:"border-color .15s" };

function Field({ label, children }) {
  return (
    <div>
      <label style={{ fontSize:11,fontWeight:600,color:"var(--text2)",letterSpacing:"0.05em",textTransform:"uppercase",display:"block",marginBottom:6,fontFamily:"var(--display)" }}>{label}</label>
      {children}
    </div>
  );
}

function Modal({ title, children, onClose, width=520 }) {
  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,.55)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:16 }} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="fade-in" style={{ background:"var(--surface)",borderRadius:16,width:"100%",maxWidth:width,maxHeight:"92vh",overflowY:"auto",border:"1px solid var(--border)",boxShadow:"0 24px 64px rgba(0,0,0,.25)" }}>
        <div style={{ padding:"18px 24px",borderBottom:"1px solid var(--border)",display:"flex",justifyContent:"space-between",alignItems:"center",position:"sticky",top:0,background:"var(--surface)",zIndex:1 }}>
          <h3 style={{ fontSize:17,fontFamily:"var(--display)",fontWeight:700 }}>{title}</h3>
          <button onClick={onClose} style={{ background:"none",border:"none",fontSize:22,color:"var(--text3)",cursor:"pointer",lineHeight:1 }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── LOGIN ────────────────────────────────────────────────────────────────────
function Login() {
  const { login, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");

  async function submit(e) {
    e?.preventDefault();
    setErr("");
    const r = await login(email, pw);
    if (!r.ok) setErr(r.error);
  }

  return (
    <div style={{ minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"linear-gradient(135deg,#0C1220,#1A2340)",padding:20 }}>
      <div style={{ width:"100%",maxWidth:400 }}>
        <div style={{ textAlign:"center",marginBottom:36 }}>
          <div style={{ width:56,height:56,borderRadius:14,background:"linear-gradient(135deg,#3B82F6,#1D4ED8)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,margin:"0 auto 14px",boxShadow:"0 12px 40px #3B82F640" }}>⚡</div>
          <div style={{ fontSize:26,fontFamily:"var(--display)",fontWeight:800,color:"#fff" }}>FieldOps</div>
          <div style={{ fontSize:13,color:"#8899BB",marginTop:4 }}>Sign in to your workspace</div>
        </div>
        <div style={{ background:"rgba(255,255,255,.05)",border:"1px solid rgba(255,255,255,.1)",borderRadius:16,padding:28,boxShadow:"0 24px 64px rgba(0,0,0,.4)" }}>
          {err && <div style={{ background:"var(--red-lt)",border:"1px solid var(--red-bd)",borderRadius:8,padding:"10px 14px",fontSize:13,color:"var(--red)",marginBottom:14 }}>{err}</div>}
          <form onSubmit={submit} style={{ display:"flex",flexDirection:"column",gap:12 }}>
            <input value={email} onChange={e=>setEmail(e.target.value)} type="email" placeholder="Email address" required
              style={{ padding:"13px 16px",borderRadius:10,background:"rgba(255,255,255,.08)",border:"1px solid rgba(255,255,255,.15)",color:"#fff",fontSize:14,outline:"none" }} />
            <input value={pw} onChange={e=>setPw(e.target.value)} type="password" placeholder="Password" required
              style={{ padding:"13px 16px",borderRadius:10,background:"rgba(255,255,255,.08)",border:"1px solid rgba(255,255,255,.15)",color:"#fff",fontSize:14,outline:"none" }} />
            <button type="submit" disabled={loading} style={{ padding:"13px",background:"linear-gradient(135deg,#3B82F6,#1D4ED8)",border:"none",borderRadius:10,color:"#fff",fontSize:15,fontWeight:700,cursor:"pointer",fontFamily:"var(--display)",boxShadow:"0 4px 16px #3B82F640",opacity:loading?.7:1,marginTop:4 }}>
              {loading ? "Signing in…" : "Sign In →"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ─── SIDEBAR ──────────────────────────────────────────────────────────────────
const NAV = [
  { id:"/",         icon:"⊞",  label:"Dashboard" },
  { id:"/dispatch", icon:"📡", label:"Dispatch"  },
  { id:"/customers",icon:"👥", label:"Customers" },
  { id:"/jobs",     icon:"🔧", label:"Jobs"      },
  { id:"/invoices", icon:"📄", label:"Invoices"  },
];

function Sidebar({ collapsed, setCollapsed }) {
  const { route, navigate } = useRouter();
  const { user, logout } = useAuth();

  return (
    <div style={{ width:collapsed?56:220,flexShrink:0,background:"var(--nav-bg)",borderRight:"1px solid var(--nav-border)",display:"flex",flexDirection:"column",transition:"width .2s",overflow:"hidden" }}>
      {/* Logo */}
      <div style={{ height:56,display:"flex",alignItems:"center",padding:collapsed?"0":"0 14px",justifyContent:collapsed?"center":"space-between",borderBottom:"1px solid var(--nav-border)",flexShrink:0 }}>
        {collapsed
          ? <span style={{ fontSize:18 }}>⚡</span>
          : <>
              <div style={{ display:"flex",alignItems:"center",gap:9 }}>
                <div style={{ width:28,height:28,borderRadius:7,background:"linear-gradient(135deg,#3B82F6,#1D4ED8)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14 }}>⚡</div>
                <span style={{ fontSize:15,fontFamily:"var(--display)",fontWeight:800,color:"#fff",letterSpacing:"-0.01em" }}>FieldOps</span>
              </div>
              <button onClick={()=>setCollapsed(true)} style={{ background:"none",border:"none",color:"var(--nav-text)",cursor:"pointer",fontSize:14,padding:4,borderRadius:4 }}>◀</button>
            </>
        }
      </div>
      {collapsed && <button onClick={()=>setCollapsed(false)} style={{ margin:"8px auto 0",background:"none",border:"none",color:"var(--nav-text)",cursor:"pointer",fontSize:13,width:"100%",textAlign:"center",padding:"4px 0" }}>▶</button>}

      {/* Company badge */}
      {!collapsed && (
        <div style={{ margin:"10px 10px 4px",padding:"8px 10px",background:"rgba(59,130,246,.08)",border:"1px solid rgba(59,130,246,.15)",borderRadius:7 }}>
          <div style={{ fontSize:10,color:"var(--nav-text)",letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:2,fontFamily:"var(--display)",fontWeight:600 }}>Workspace</div>
          <div style={{ fontSize:12,color:"#fff",fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{user?.company?.name || "My Company"}</div>
        </div>
      )}

      {/* Nav links */}
      <nav style={{ flex:1,padding:collapsed?"8px 6px":"8px 10px",display:"flex",flexDirection:"column",gap:2,overflowY:"auto" }}>
        {NAV.map(item => {
          const active = route === item.id;
          return (
            <button key={item.id} onClick={()=>navigate(item.id)} title={collapsed?item.label:""} style={{ display:"flex",alignItems:"center",gap:10,padding:collapsed?"10px 0":"9px 14px",justifyContent:collapsed?"center":"flex-start",width:"100%",background:active?"rgba(59,130,246,.15)":"transparent",border:active?"1px solid rgba(59,130,246,.25)":"1px solid transparent",borderRadius:8,color:active?"#fff":"var(--nav-text)",cursor:"pointer",transition:"all .12s",fontSize:13,fontWeight:active?600:400 }}
              onMouseEnter={e=>{ if(!active){e.currentTarget.style.background="var(--nav-hover)";e.currentTarget.style.color="#fff";} }}
              onMouseLeave={e=>{ if(!active){e.currentTarget.style.background="transparent";e.currentTarget.style.color="var(--nav-text)";} }}
            >
              <span style={{ fontSize:15,flexShrink:0 }}>{item.icon}</span>
              {!collapsed && <span>{item.label}</span>}
              {active && !collapsed && <span style={{ marginLeft:"auto",width:5,height:5,borderRadius:"50%",background:"var(--nav-accent)" }} />}
            </button>
          );
        })}
      </nav>

      {/* User / logout */}
      <div style={{ padding:collapsed?"8px 6px":"8px 10px",borderTop:"1px solid var(--nav-border)" }}>
        <div onClick={logout} title={collapsed?`${user?.name} · Sign out`:""} style={{ padding:collapsed?"8px 0":"8px 10px",display:"flex",alignItems:"center",gap:9,justifyContent:collapsed?"center":"flex-start",borderRadius:8,cursor:"pointer",transition:"background .12s" }}
          onMouseEnter={e=>e.currentTarget.style.background="var(--nav-hover)"}
          onMouseLeave={e=>e.currentTarget.style.background="transparent"}
        >
          <div style={{ width:28,height:28,borderRadius:"50%",background:"#3B82F620",border:"1px solid #3B82F660",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:"#3B82F6",flexShrink:0 }}>
            {(user?.name||"?").split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase()}
          </div>
          {!collapsed && (
            <div style={{ flex:1,minWidth:0 }}>
              <div style={{ fontSize:12,fontWeight:600,color:"#fff",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{user?.name}</div>
              <div style={{ fontSize:10,color:"var(--nav-text)" }}>Sign out</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── TOP BAR ──────────────────────────────────────────────────────────────────
const TITLES = { "/":"Dashboard","/dispatch":"Dispatch","/customers":"Customers","/jobs":"Jobs","/invoices":"Invoices" };

function TopBar() {
  const { route } = useRouter();
  return (
    <div style={{ height:56,background:"var(--surface)",borderBottom:"1px solid var(--border)",display:"flex",alignItems:"center",padding:"0 24px",flexShrink:0 }}>
      <h1 style={{ flex:1,fontSize:18,fontFamily:"var(--display)",fontWeight:700 }}>{TITLES[route]||"FieldOps"}</h1>
      <span style={{ fontSize:11,color:"var(--text3)",fontFamily:"var(--mono)" }}>{new Date().toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"})}</span>
    </div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function Dashboard() {
  const { user } = useAuth();
  const { navigate } = useRouter();
  const [stats, setStats] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api("/company/stats"), api("/jobs?limit=5")])
      .then(([s,j]) => { setStats(s); setJobs(Array.isArray(j)?j:[]); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ flex:1 }}><Spinner /></div>;

  return (
    <div style={{ padding:24,overflowY:"auto",flex:1 }}>
      <div className="fade-in" style={{ marginBottom:22 }}>
        <h2 style={{ fontSize:22,fontFamily:"var(--display)",fontWeight:700,marginBottom:4 }}>Good morning, {(user?.name||"").split(" ")[0]} 👋</h2>
        <p style={{ fontSize:13,color:"var(--text3)" }}>Here's what's happening at {user?.company?.name} today.</p>
      </div>

      {/* KPI cards */}
      <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:12,marginBottom:20 }}>
        {[
          { label:"Jobs Today",      val:stats?.jobs_today??0,                     icon:"📅", color:"var(--blue)"  },
          { label:"This Week",       val:stats?.jobs_this_week??0,                  icon:"📆", color:"#7C3AED"      },
          { label:"Revenue / Month", val:fmt$(stats?.revenue_this_month??0),        icon:"💰", color:"var(--green)" },
          { label:"Open Invoices",   val:fmt$(stats?.open_invoices_total??0),        icon:"📄", color:"var(--amber)" },
        ].map((k,i) => (
          <Card key={i} className={`fade-in s${Math.min(i+1,3)}`} style={{ padding:"16px 18px" }}>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10 }}>
              <span style={{ fontSize:10,color:"var(--text3)",fontWeight:600,fontFamily:"var(--display)",letterSpacing:"0.06em",textTransform:"uppercase" }}>{k.label}</span>
              <span style={{ fontSize:18 }}>{k.icon}</span>
            </div>
            <div style={{ fontSize:24,fontFamily:"var(--mono)",fontWeight:600,color:k.color,lineHeight:1 }}>{k.val}</div>
          </Card>
        ))}
      </div>

      {/* Recent jobs */}
      <Card>
        <div style={{ padding:"16px 20px 0",display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14 }}>
          <h3 style={{ fontSize:14,fontWeight:700,fontFamily:"var(--display)" }}>Recent Jobs</h3>
          <Btn small variant="secondary" onClick={()=>navigate("/jobs")}>View all →</Btn>
        </div>
        {jobs.length === 0
          ? <Empty icon="🔧" title="No jobs yet" desc="Create your first job to get started" action={<Btn onClick={()=>navigate("/jobs")}>+ New Job</Btn>} />
          : (
            <table style={{ width:"100%",borderCollapse:"collapse" }}>
              <thead>
                <tr style={{ background:"var(--surface2)" }}>
                  {["Job #","Title","Customer","Status"].map(h=>(
                    <th key={h} style={{ padding:"8px 16px",textAlign:"left",fontSize:11,fontWeight:600,color:"var(--text3)",fontFamily:"var(--display)",letterSpacing:"0.06em",textTransform:"uppercase",borderTop:"1px solid var(--border)",borderBottom:"1px solid var(--border)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {jobs.map(j => (
                  <tr key={j.id} style={{ borderBottom:"1px solid var(--border)",cursor:"pointer" }}
                    onMouseEnter={e=>e.currentTarget.style.background="var(--surface2)"}
                    onMouseLeave={e=>e.currentTarget.style.background=""}
                    onClick={()=>navigate("/jobs")}
                  >
                    <td style={{ padding:"11px 16px",fontSize:12,fontFamily:"var(--mono)",color:"var(--text3)" }}>{j.job_number}</td>
                    <td style={{ padding:"11px 16px",fontSize:13,fontWeight:500 }}>{j.title}</td>
                    <td style={{ padding:"11px 16px",fontSize:13,color:"var(--text2)" }}>{j.customer_name}</td>
                    <td style={{ padding:"11px 16px" }}><Chip status={j.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        }
      </Card>
    </div>
  );
}

// ─── CUSTOMERS ────────────────────────────────────────────────────────────────
function Customers() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [showNew, setShowNew] = useState(false);

  async function load() {
    setLoading(true);
    try { const d = await api(`/customers?limit=100${search?`&search=${encodeURIComponent(search)}`:""}`); setList(Array.isArray(d)?d:[]); }
    catch(e) { console.error(e); }
    setLoading(false);
  }
  useEffect(() => { load(); }, [search]);

  async function handleDelete(id) {
    if (!window.confirm("Archive this customer?")) return;
    try { await api(`/customers/${id}`, { method:"DELETE" }); setList(p=>p.filter(c=>c.id!==id)); if(selected?.id===id) setSelected(null); }
    catch(e) { alert(e.message); }
  }

  return (
    <div style={{ flex:1,display:"flex",overflow:"hidden" }}>
      {showNew && <NewCustomerModal onClose={()=>setShowNew(false)} onSave={async c=>{ setList(p=>[c,...p]); setSelected(c); setShowNew(false); }} />}

      {/* List */}
      <div style={{ width:300,flexShrink:0,borderRight:"1px solid var(--border)",background:"var(--surface)",display:"flex",flexDirection:"column" }}>
        <div style={{ padding:"14px 14px 10px",borderBottom:"1px solid var(--border)" }}>
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10 }}>
            <span style={{ fontSize:15,fontFamily:"var(--display)",fontWeight:700 }}>Customers</span>
            <Btn small onClick={()=>setShowNew(true)}>+ New</Btn>
          </div>
          <div style={{ position:"relative" }}>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search name, phone…" style={{ ...INP,paddingLeft:28 }} />
            <span style={{ position:"absolute",left:9,top:"50%",transform:"translateY(-50%)",color:"var(--text3)",fontSize:12 }}>⌕</span>
          </div>
        </div>
        <div style={{ flex:1,overflowY:"auto" }}>
          {loading ? <Spinner /> : list.length===0
            ? <div style={{ padding:24,textAlign:"center",color:"var(--text3)",fontSize:13 }}>{search?"No results":"No customers yet"}</div>
            : list.map(c => (
              <div key={c.id} onClick={()=>setSelected(c)} style={{ padding:"11px 14px",borderBottom:"1px solid var(--border)",cursor:"pointer",background:selected?.id===c.id?"var(--blue-lt)":"transparent",borderLeft:selected?.id===c.id?"3px solid var(--blue)":"3px solid transparent",transition:"background .1s" }}
                onMouseEnter={e=>{ if(selected?.id!==c.id) e.currentTarget.style.background="var(--surface2)"; }}
                onMouseLeave={e=>{ if(selected?.id!==c.id) e.currentTarget.style.background="transparent"; }}
              >
                <div style={{ fontSize:13,fontWeight:600,marginBottom:2 }}>{c.first_name} {c.last_name}</div>
                <div style={{ fontSize:11,color:"var(--text3)" }}>{c.phone||c.email||"No contact"} · {c.job_count||0} job{c.job_count!==1?"s":""}</div>
              </div>
            ))
          }
        </div>
      </div>

      {/* Detail */}
      <div style={{ flex:1,overflowY:"auto",padding:28 }}>
        {selected ? (
          <div className="fade-in">
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:24 }}>
              <div>
                <h2 style={{ fontSize:24,fontFamily:"var(--display)",fontWeight:800,marginBottom:6 }}>{selected.first_name} {selected.last_name}</h2>
                <div style={{ display:"flex",gap:16,fontSize:13,color:"var(--text3)",flexWrap:"wrap" }}>
                  {selected.phone && <span>📞 {selected.phone}</span>}
                  {selected.email && <span>✉ {selected.email}</span>}
                </div>
              </div>
              <div style={{ display:"flex",gap:8 }}>
                <Btn small variant="danger" onClick={()=>handleDelete(selected.id)}>Archive</Btn>
              </div>
            </div>
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12 }}>
              <Card style={{ padding:"16px 18px" }}>
                <div style={{ fontSize:10,fontWeight:600,color:"var(--text3)",letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:10,fontFamily:"var(--display)" }}>Contact</div>
                {[["Phone",selected.phone],["Email",selected.email],["Source",selected.source],["Tags",(selected.tags||[]).join(", ")]].filter(([,v])=>v).map(([l,v])=>(
                  <div key={l} style={{ display:"flex",gap:12,marginBottom:8 }}>
                    <span style={{ fontSize:12,color:"var(--text3)",width:60,flexShrink:0 }}>{l}</span>
                    <span style={{ fontSize:13 }}>{v}</span>
                  </div>
                ))}
              </Card>
              <Card style={{ padding:"16px 18px" }}>
                <div style={{ fontSize:10,fontWeight:600,color:"var(--text3)",letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:10,fontFamily:"var(--display)" }}>Stats</div>
                <div style={{ fontSize:28,fontFamily:"var(--mono)",fontWeight:700,color:"var(--blue)",marginBottom:4 }}>{selected.job_count||0}</div>
                <div style={{ fontSize:12,color:"var(--text3)" }}>Total jobs</div>
              </Card>
              {selected.notes && (
                <Card style={{ padding:"16px 18px",gridColumn:"1/-1" }}>
                  <div style={{ fontSize:10,fontWeight:600,color:"var(--text3)",letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:8,fontFamily:"var(--display)" }}>Notes</div>
                  <p style={{ fontSize:13,color:"var(--text2)",lineHeight:1.6,fontStyle:"italic" }}>"{selected.notes}"</p>
                </Card>
              )}
            </div>
          </div>
        ) : (
          <Empty icon="👥" title="Select a customer" desc="Click a customer to view their details, or add a new one" action={<Btn onClick={()=>setShowNew(true)}>+ New Customer</Btn>} />
        )}
      </div>
    </div>
  );
}

function NewCustomerModal({ onClose, onSave }) {
  const [f, setF] = useState({ first_name:"",last_name:"",email:"",phone:"",notes:"",source:"" });
  const [loc, setLoc] = useState({ address_line1:"",city:"",state:"OK",zip:"",access_notes:"" });
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!f.first_name||!f.last_name) { alert("First and last name required"); return; }
    setSaving(true);
    try {
      const payload = { ...f, tags:[] };
      if (loc.address_line1 && loc.city) payload.location = loc;
      const c = await api("/customers",{ method:"POST", body:JSON.stringify(payload) });
      onSave(c);
    } catch(e) { alert(e.message); }
    setSaving(false);
  }

  return (
    <Modal title="New Customer" onClose={onClose}>
      <div style={{ padding:"18px 24px",display:"flex",flexDirection:"column",gap:14 }}>
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12 }}>
          <Field label="First Name *"><input style={INP} value={f.first_name} onChange={e=>setF(p=>({...p,first_name:e.target.value}))} placeholder="Sarah" /></Field>
          <Field label="Last Name *"><input style={INP} value={f.last_name} onChange={e=>setF(p=>({...p,last_name:e.target.value}))} placeholder="Johnson" /></Field>
        </div>
        <Field label="Phone"><input style={INP} value={f.phone} onChange={e=>setF(p=>({...p,phone:e.target.value}))} placeholder="405-555-0177" /></Field>
        <Field label="Email"><input style={INP} type="email" value={f.email} onChange={e=>setF(p=>({...p,email:e.target.value}))} placeholder="sarah@email.com" /></Field>
        <Field label="How they found you">
          <select style={INP} value={f.source} onChange={e=>setF(p=>({...p,source:e.target.value}))}>
            <option value="">Select…</option>
            {["Referral","Google","Yelp","Facebook","Door hanger","Repeat customer","Other"].map(s=><option key={s}>{s}</option>)}
          </select>
        </Field>
        <div style={{ borderTop:"1px solid var(--border)",paddingTop:14 }}>
          <div style={{ fontSize:11,fontWeight:600,color:"var(--text3)",letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:10 }}>Service Location (optional)</div>
          <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
            <input style={INP} value={loc.address_line1} onChange={e=>setLoc(p=>({...p,address_line1:e.target.value}))} placeholder="Street address" />
            <div style={{ display:"grid",gridTemplateColumns:"2fr 1fr 1fr",gap:10 }}>
              <input style={INP} value={loc.city} onChange={e=>setLoc(p=>({...p,city:e.target.value}))} placeholder="City" />
              <input style={INP} value={loc.state} onChange={e=>setLoc(p=>({...p,state:e.target.value}))} placeholder="State" />
              <input style={INP} value={loc.zip} onChange={e=>setLoc(p=>({...p,zip:e.target.value}))} placeholder="ZIP" />
            </div>
            <input style={INP} value={loc.access_notes} onChange={e=>setLoc(p=>({...p,access_notes:e.target.value}))} placeholder="Gate code, dogs, access notes…" />
          </div>
        </div>
        <Field label="Notes"><textarea style={{...INP,height:80,resize:"vertical"}} value={f.notes} onChange={e=>setF(p=>({...p,notes:e.target.value}))} placeholder="Preferences, details to remember…" /></Field>
      </div>
      <div style={{ padding:"14px 24px",borderTop:"1px solid var(--border)",display:"flex",justifyContent:"flex-end",gap:10 }}>
        <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
        <Btn onClick={save} disabled={saving}>{saving?"Saving…":"Save Customer"}</Btn>
      </div>
    </Modal>
  );
}

// ─── JOBS ─────────────────────────────────────────────────────────────────────
function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [showNew, setShowNew] = useState(false);
  const [estimateJob, setEstimateJob] = useState(null);

  async function load() {
    setLoading(true);
    try { const d = await api(`/jobs?limit=100${filter!=="all"?`&status=${filter}`:""}`); setJobs(Array.isArray(d)?d:[]); }
    catch(e) { console.error(e); }
    setLoading(false);
  }
  useEffect(() => { load(); }, [filter]);

  async function updateStatus(id, status) {
    try { await api(`/jobs/${id}/status`,{ method:"PATCH", body:JSON.stringify({status}) }); setJobs(p=>p.map(j=>j.id===id?{...j,status}:j)); }
    catch(e) { alert(e.message); }
  }

  async function deleteJob(id) {
    if (!window.confirm("Cancel this job?")) return;
    try { await api(`/jobs/${id}/status`,{ method:"PATCH", body:JSON.stringify({status:"cancelled"}) }); setJobs(p=>p.map(j=>j.id===id?{...j,status:"cancelled"}:j)); }
    catch(e) { alert(e.message); }
  }

  const FILTERS = ["all","unscheduled","scheduled","en_route","in_progress","completed"];

  return (
    <div style={{ flex:1,display:"flex",flexDirection:"column",overflow:"hidden" }}>
      {showNew && <NewJobModal onClose={()=>setShowNew(false)} onSave={j=>{ setJobs(p=>[j,...p]); setShowNew(false); }} />}
      {estimateJob && <EstimateModal job={estimateJob} onClose={()=>setEstimateJob(null)} />}

      {/* Toolbar */}
      <div style={{ padding:"10px 16px",background:"var(--surface)",borderBottom:"1px solid var(--border)",display:"flex",gap:6,alignItems:"center",flexWrap:"wrap" }}>
        {FILTERS.map(s=>(
          <button key={s} onClick={()=>setFilter(s)} style={{ fontSize:11,padding:"4px 10px",borderRadius:100,background:filter===s?"var(--blue)":"var(--surface2)",color:filter===s?"#fff":"var(--text3)",border:filter===s?"none":"1px solid var(--border)",cursor:"pointer",textTransform:"capitalize",fontWeight:filter===s?600:400,whiteSpace:"nowrap" }}>
            {s==="all"?"All Jobs":STATUS[s]?.label||s}
          </button>
        ))}
        <div style={{ marginLeft:"auto" }}><Btn small onClick={()=>setShowNew(true)}>+ New Job</Btn></div>
      </div>

      {/* List */}
      <div style={{ flex:1,overflowY:"auto",padding:16 }}>
        {loading ? <Spinner /> : jobs.length===0
          ? <Empty icon="🔧" title="No jobs found" desc="Create your first job to get started" action={<Btn onClick={()=>setShowNew(true)}>+ New Job</Btn>} />
          : (
            <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
              {jobs.map(job=>(
                <Card key={job.id} style={{ padding:"14px 18px" }}>
                  <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8 }}>
                    <div>
                      <div style={{ fontSize:11,fontFamily:"var(--mono)",color:"var(--text3)",marginBottom:3 }}>{job.job_number}</div>
                      <div style={{ fontSize:16,fontWeight:700,fontFamily:"var(--display)" }}>{job.title}</div>
                    </div>
                    <Chip status={job.status} />
                  </div>
                  <div style={{ display:"flex",gap:14,fontSize:13,color:"var(--text2)",flexWrap:"wrap",marginBottom:10 }}>
                    <span>👤 {job.customer_name}</span>
                    <span>📍 {[job.address_line1,job.city,job.state].filter(Boolean).join(", ")||"No address"}</span>
                    {job.scheduled_start && <span>🕐 {fmtDate(job.scheduled_start)}</span>}
                  </div>
                  <div style={{ display:"flex",gap:6,flexWrap:"wrap" }}>
                    {job.status==="scheduled"    && <Btn small variant="secondary" onClick={()=>updateStatus(job.id,"en_route")}>→ En Route</Btn>}
                    {job.status==="en_route"     && <Btn small variant="secondary" onClick={()=>updateStatus(job.id,"in_progress")}>→ Start Job</Btn>}
                    {job.status==="in_progress"  && <Btn small variant="green"     onClick={()=>updateStatus(job.id,"completed")}>✓ Complete</Btn>}
                    {job.status==="unscheduled"  && <Btn small variant="secondary" onClick={()=>updateStatus(job.id,"scheduled")}>Schedule</Btn>}
                    {!["completed","cancelled"].includes(job.status) && (
                      <Btn small variant="secondary" onClick={()=>setEstimateJob(job)}>📋 Estimate</Btn>
                    )}
                    {!["completed","cancelled"].includes(job.status) && (
                      <Btn small variant="danger" onClick={()=>deleteJob(job.id)}>Cancel</Btn>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )
        }
      </div>
    </div>
  );
}

function NewJobModal({ onClose, onSave }) {
  const [customers, setCustomers] = useState([]);
  const [locations, setLocations] = useState([]);
  const [f, setF] = useState({ customer_id:"",location_id:"",title:"",description:"",priority:"normal",scheduled_start:"",scheduled_end:"" });
  const [saving, setSaving] = useState(false);

  useEffect(() => { api("/customers?limit=100").then(d=>setCustomers(Array.isArray(d)?d:[])).catch(()=>{}); }, []);

  async function onCustomer(id) {
    setF(p=>({...p,customer_id:id,location_id:""}));
    setLocations([]);
    if (id) {
      try {
        const c = await api(`/customers/${id}`);
        const locs = c.locations || [];
        setLocations(locs);
        if (locs.length===1) setF(p=>({...p,location_id:locs[0].id}));
      } catch(e) {}
    }
  }

  async function save() {
    if (!f.customer_id||!f.location_id||!f.title) { alert("Customer, location and title are required"); return; }
    setSaving(true);
    try {
      const payload = {
        customer_id: f.customer_id,
        location_id: f.location_id,
        title: f.title.trim(),
        description: f.description.trim()||undefined,
        priority: f.priority||"normal",
        technician_ids: [],
      };
      if (f.scheduled_start) payload.scheduled_start = new Date(f.scheduled_start).toISOString();
      if (f.scheduled_end)   payload.scheduled_end   = new Date(f.scheduled_end).toISOString();
      const job = await api("/jobs",{ method:"POST", body:JSON.stringify(payload) });
      onSave(job);
    } catch(e) { alert(e.message); }
    setSaving(false);
  }

  return (
    <Modal title="New Job" onClose={onClose}>
      <div style={{ padding:"18px 24px",display:"flex",flexDirection:"column",gap:14 }}>
        <Field label="Customer *">
          <select style={INP} value={f.customer_id} onChange={e=>onCustomer(e.target.value)}>
            <option value="">Select customer…</option>
            {customers.map(c=><option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>)}
          </select>
        </Field>
        {locations.length>0 && (
          <Field label="Service Location *">
            <select style={INP} value={f.location_id} onChange={e=>setF(p=>({...p,location_id:e.target.value}))}>
              <option value="">Select location…</option>
              {locations.map(l=><option key={l.id} value={l.id}>{l.address_line1}, {l.city}</option>)}
            </select>
          </Field>
        )}
        {f.customer_id && locations.length===0 && (
          <div style={{ fontSize:12,color:"var(--red)",padding:"8px 12px",background:"var(--red-lt)",borderRadius:7,border:"1px solid var(--red-bd)" }}>
            This customer has no service locations. Add a location to their profile first.
          </div>
        )}
        <Field label="Job Title *"><input style={INP} value={f.title} onChange={e=>setF(p=>({...p,title:e.target.value}))} placeholder="e.g. AC Not Cooling" /></Field>
        <Field label="Description"><textarea style={{...INP,height:80,resize:"vertical"}} value={f.description} onChange={e=>setF(p=>({...p,description:e.target.value}))} placeholder="Describe the issue…" /></Field>
        <Field label="Priority">
          <select style={INP} value={f.priority} onChange={e=>setF(p=>({...p,priority:e.target.value}))}>
            {["low","normal","high","urgent"].map(p=><option key={p} value={p}>{p.charAt(0).toUpperCase()+p.slice(1)}</option>)}
          </select>
        </Field>
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12 }}>
          <Field label="Scheduled Start"><input style={INP} type="datetime-local" value={f.scheduled_start} onChange={e=>setF(p=>({...p,scheduled_start:e.target.value}))} /></Field>
          <Field label="Scheduled End"><input style={INP} type="datetime-local" value={f.scheduled_end} onChange={e=>setF(p=>({...p,scheduled_end:e.target.value}))} /></Field>
        </div>
      </div>
      <div style={{ padding:"14px 24px",borderTop:"1px solid var(--border)",display:"flex",justifyContent:"flex-end",gap:10 }}>
        <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
        <Btn onClick={save} disabled={saving||!f.customer_id||!f.location_id||!f.title}>{saving?"Creating…":"Create Job"}</Btn>
      </div>
    </Modal>
  );
}

// ─── ESTIMATE MODAL ───────────────────────────────────────────────────────────
function EstimateModal({ job, onClose }) {
  const [items, setItems] = useState([
    { id:1, name:"Diagnostic Fee", description:"System inspection and diagnostics", qty:1, unit_price:89 },
  ]);
  const [taxRate, setTaxRate] = useState(8.75);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(null);

  function addItem() { setItems(p=>[...p,{ id:Date.now(), name:"", description:"", qty:1, unit_price:0 }]); }
  function removeItem(id) { setItems(p=>p.filter(i=>i.id!==id)); }
  function updateItem(id, key, raw) {
    setItems(p=>p.map(i=>i.id!==id ? i : { ...i, [key]: ["qty","unit_price"].includes(key) ? (parseFloat(raw)||0) : raw }));
  }

  const subtotal = items.reduce((s,i)=>s+round2((i.qty||0)*(i.unit_price||0)), 0);
  const taxAmt   = round2(subtotal * (parseFloat(taxRate)||0) / 100);
  const total    = round2(subtotal + taxAmt);

  async function save() {
    const valid = items.filter(i=>i.name.trim());
    if (!valid.length) { alert("Add at least one line item with a name"); return; }
    setSaving(true);
    try {
      const payload = {
        notes: notes.trim(),
        tax_rate: round2((parseFloat(taxRate)||0)/100),
        line_items: valid.map((i,idx)=>({
          name: String(i.name).trim(),
          description: String(i.description||"").trim(),
          quantity: parseFloat(i.qty)||1,
          unit_price: parseFloat(i.unit_price)||0,
          discount_pct: 0,
          sort_order: idx,
        })),
      };
      const est = await api(`/jobs/${job.id}/estimates`,{ method:"POST", body:JSON.stringify(payload) });
      setSaved(est);
    } catch(e) { alert(e.message); }
    setSaving(false);
  }

  async function approve() {
    try { await api(`/estimates/${saved.id}/approve`,{ method:"POST" }); setSaved(p=>({...p,status:"approved"})); }
    catch(e) { alert(e.message); }
  }

  async function convert() {
    try {
      await api(`/estimates/${saved.id}/convert`,{ method:"POST" });
      alert("Invoice created! Check the Invoices tab.");
      onClose();
    } catch(e) { alert(e.message); }
  }

  const C = { padding:"6px 8px",fontSize:12,border:"1px solid var(--border)",borderRadius:6,width:"100%",outline:"none",background:"var(--surface)" };

  if (saved) return (
    <Modal title="Estimate Saved" onClose={onClose}>
      <div style={{ padding:"24px",textAlign:"center" }}>
        <div style={{ fontSize:48,marginBottom:12 }}>✅</div>
        <div style={{ fontSize:18,fontFamily:"var(--display)",fontWeight:700,marginBottom:8 }}>{saved.estimate_number}</div>
        <div style={{ fontSize:24,fontFamily:"var(--mono)",fontWeight:700,color:"var(--blue)",marginBottom:20 }}>{fmt$(saved.total)}</div>
        <Chip status={saved.status} />
        <div style={{ display:"flex",gap:10,justifyContent:"center",marginTop:20,flexWrap:"wrap" }}>
          {saved.status==="draft"    && <Btn onClick={approve}>✓ Approve Estimate</Btn>}
          {saved.status==="approved" && <Btn variant="green" onClick={convert}>→ Convert to Invoice</Btn>}
          <Btn variant="secondary" onClick={onClose}>Close</Btn>
        </div>
      </div>
    </Modal>
  );

  return (
    <Modal title={`New Estimate — ${job.job_number}: ${job.title}`} onClose={onClose} width={760}>
      <div style={{ padding:"16px 20px" }}>
        <div style={{ fontSize:12,color:"var(--text3)",marginBottom:14 }}>👤 {job.customer_name}</div>

        {/* Line items */}
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%",borderCollapse:"collapse",minWidth:500 }}>
            <thead>
              <tr style={{ background:"var(--surface2)" }}>
                {["Item *","Description","Qty","Unit Price ($)","Total",""].map(h=>(
                  <th key={h} style={{ padding:"8px 6px",textAlign:"left",fontSize:10,fontWeight:700,color:"var(--text3)",borderBottom:"1px solid var(--border)",fontFamily:"var(--display)",letterSpacing:"0.06em",textTransform:"uppercase",whiteSpace:"nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map(item=>(
                <tr key={item.id} style={{ borderBottom:"1px solid var(--border)" }}>
                  <td style={{ padding:"5px 4px",width:"28%" }}><input style={C} value={item.name} onChange={e=>updateItem(item.id,"name",e.target.value)} placeholder="Item name" /></td>
                  <td style={{ padding:"5px 4px",width:"28%" }}><input style={C} value={item.description} onChange={e=>updateItem(item.id,"description",e.target.value)} placeholder="Optional" /></td>
                  <td style={{ padding:"5px 4px",width:"8%" }}><input style={{...C,textAlign:"right"}} type="number" min="0.5" step="0.5" value={item.qty} onChange={e=>updateItem(item.id,"qty",e.target.value)} /></td>
                  <td style={{ padding:"5px 4px",width:"16%" }}><input style={{...C,textAlign:"right"}} type="number" min="0" step="0.01" value={item.unit_price} onChange={e=>updateItem(item.id,"unit_price",e.target.value)} /></td>
                  <td style={{ padding:"5px 8px",width:"14%",textAlign:"right",fontSize:13,fontFamily:"var(--mono)",fontWeight:600,color:"var(--text1)",whiteSpace:"nowrap" }}>{fmt$(round2((item.qty||0)*(item.unit_price||0)))}</td>
                  <td style={{ padding:"5px 4px",width:"6%",textAlign:"center" }}>
                    <button onClick={()=>removeItem(item.id)} style={{ background:"none",border:"none",cursor:"pointer",color:"var(--text4)",fontSize:18,lineHeight:1 }}
                      onMouseEnter={e=>e.currentTarget.style.color="var(--red)"}
                      onMouseLeave={e=>e.currentTarget.style.color="var(--text4)"}
                    >×</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <button onClick={addItem} style={{ width:"100%",margin:"8px 0 16px",padding:"8px",background:"none",border:"1px dashed var(--border2)",borderRadius:7,fontSize:12,color:"var(--text3)",cursor:"pointer",transition:"all .12s" }}
          onMouseEnter={e=>{e.currentTarget.style.borderColor="var(--blue)";e.currentTarget.style.color="var(--blue)";}}
          onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--border2)";e.currentTarget.style.color="var(--text3)";}}
        >+ Add line item</button>

        <div style={{ display:"flex",gap:20,alignItems:"flex-start" }}>
          <div style={{ flex:1 }}>
            <Field label="Notes (visible to customer)">
              <textarea style={{...INP,height:80,resize:"vertical"}} value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Thank you for your business!" />
            </Field>
          </div>
          <div style={{ width:220,flexShrink:0 }}>
            {[["Subtotal",fmt$(subtotal)],["Tax %",null],["Tax Amount",fmt$(taxAmt)]].map(([l,v],i)=>(
              <div key={l} style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 0",borderBottom:"1px solid var(--border)" }}>
                <span style={{ fontSize:12,color:"var(--text3)" }}>{l}</span>
                {v ? <span style={{ fontSize:12,fontFamily:"var(--mono)" }}>{v}</span>
                   : <input type="number" min="0" max="30" step="0.125" value={taxRate} onChange={e=>setTaxRate(e.target.value)} style={{ width:64,padding:"3px 6px",borderRadius:5,border:"1px solid var(--border)",fontSize:12,textAlign:"right",fontFamily:"var(--mono)",outline:"none" }} />
                }
              </div>
            ))}
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0 0" }}>
              <span style={{ fontSize:15,fontWeight:700,fontFamily:"var(--display)" }}>Total</span>
              <span style={{ fontSize:20,fontFamily:"var(--mono)",fontWeight:700,color:"var(--blue)" }}>{fmt$(total)}</span>
            </div>
          </div>
        </div>
      </div>
      <div style={{ padding:"14px 20px",borderTop:"1px solid var(--border)",display:"flex",justifyContent:"flex-end",gap:10 }}>
        <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
        <Btn onClick={save} disabled={saving}>{saving?"Saving…":"Save Estimate"}</Btn>
      </div>
    </Modal>
  );
}

// ─── DISPATCH ─────────────────────────────────────────────────────────────────
function Dispatch() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(new Date().toISOString().slice(0,10));

  useEffect(() => {
    setLoading(true);
    api(`/dispatch?date=${date}`)
      .then(d=>setData(d))
      .catch(()=>setData({ technicians:[], unassigned:[] }))
      .finally(()=>setLoading(false));
  }, [date]);

  if (loading) return <div style={{ flex:1 }}><Spinner /></div>;

  const techs     = data?.technicians||[];
  const unassigned= data?.unassigned||[];

  return (
    <div style={{ flex:1,display:"flex",flexDirection:"column",overflow:"hidden" }}>
      <div style={{ padding:"10px 16px",background:"var(--surface)",borderBottom:"1px solid var(--border)",display:"flex",gap:12,alignItems:"center" }}>
        <input type="date" value={date} onChange={e=>setDate(e.target.value)} style={{...INP,width:"auto",padding:"6px 10px"}} />
        <span style={{ fontSize:13,color:"var(--text3)" }}>{techs.length} tech{techs.length!==1?"s":""} · {unassigned.length} unassigned</span>
      </div>
      <div style={{ flex:1,overflowY:"auto",padding:16,display:"flex",flexDirection:"column",gap:10 }}>
        {techs.length===0 && unassigned.length===0 && (
          <Empty icon="📡" title="No jobs scheduled" desc={`Add technicians and schedule jobs for ${fmtDate(date)}`} />
        )}
        {unassigned.length>0 && (
          <Card style={{ border:"1px solid var(--red-bd)",overflow:"hidden" }}>
            <div style={{ padding:"10px 16px",background:"var(--red-lt)",borderBottom:"1px solid var(--red-bd)",fontSize:13,fontWeight:600,color:"var(--red)",display:"flex",alignItems:"center",gap:8 }}>
              <span style={{ width:8,height:8,borderRadius:"50%",background:"var(--red)",display:"inline-block" }}/>
              Unassigned ({unassigned.length}) — assign techs from the Jobs tab
            </div>
            <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:8,padding:10 }}>
              {unassigned.map(j=>(
                <div key={j.id} style={{ background:"var(--surface2)",border:"1px solid var(--border)",borderLeft:"3px solid var(--red)",borderRadius:8,padding:"10px 12px" }}>
                  <div style={{ fontSize:11,fontFamily:"var(--mono)",color:"var(--text3)",marginBottom:3 }}>{j.job_number}</div>
                  <div style={{ fontSize:13,fontWeight:600,marginBottom:3 }}>{j.title}</div>
                  <div style={{ fontSize:11,color:"var(--text3)" }}>{j.customer_name}</div>
                </div>
              ))}
            </div>
          </Card>
        )}
        {techs.map(tech=>{
          const sc = STATUS[tech.jobs?.[0]?.status]||STATUS.scheduled;
          return (
            <Card key={tech.id} style={{ overflow:"hidden" }}>
              <div style={{ padding:"10px 16px",background:"var(--surface2)",borderBottom:tech.jobs?.length?"1px solid var(--border)":"none",display:"flex",alignItems:"center",gap:10 }}>
                <div style={{ width:32,height:32,borderRadius:"50%",background:"var(--blue-lt)",border:"1px solid var(--blue-bd)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:"var(--blue)" }}>
                  {(tech.name||"?").split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase()}
                </div>
                <span style={{ fontSize:13,fontWeight:600 }}>{tech.name}</span>
                <span style={{ fontSize:11,color:"var(--text3)",marginLeft:4 }}>{tech.jobs?.length||0} job{tech.jobs?.length!==1?"s":""}</span>
              </div>
              {tech.jobs?.length>0 ? (
                <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:8,padding:10 }}>
                  {tech.jobs.map(j=>{
                    const c=STATUS[j.status]||STATUS.scheduled;
                    return (
                      <div key={j.id} style={{ background:"var(--surface2)",border:`1px solid ${c.bd}`,borderLeft:`3px solid ${c.color}`,borderRadius:8,padding:"10px 12px" }}>
                        <div style={{ display:"flex",justifyContent:"space-between",marginBottom:5 }}>
                          <span style={{ fontSize:11,fontFamily:"var(--mono)",color:"var(--text3)" }}>{j.job_number}</span>
                          <Chip status={j.status} />
                        </div>
                        <div style={{ fontSize:13,fontWeight:600,marginBottom:3 }}>{j.title}</div>
                        <div style={{ fontSize:11,color:"var(--text3)",marginBottom:j.scheduled_start?4:0 }}>{j.customer_name}</div>
                        {j.scheduled_start && <div style={{ fontSize:11,fontFamily:"var(--mono)",color:c.color }}>{new Date(j.scheduled_start).toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit"})}</div>}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ padding:"12px 18px",fontSize:12,color:"var(--text4)",fontStyle:"italic" }}>No jobs scheduled</div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ─── INVOICES ─────────────────────────────────────────────────────────────────
function Invoices() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    setLoading(true);
    api(`/invoices?limit=100${filter!=="all"?`&status=${filter}`:""}`)
      .then(d=>setList(Array.isArray(d)?d:[]))
      .catch(()=>{})
      .finally(()=>setLoading(false));
  }, [filter]);

  async function sendInvoice(id) {
    try { await api(`/invoices/${id}/send`,{method:"POST"}); setList(p=>p.map(i=>i.id===id?{...i,status:"sent"}:i)); alert("Invoice sent!"); }
    catch(e) { alert(e.message); }
  }

  return (
    <div style={{ flex:1,display:"flex",overflow:"hidden" }}>
      {/* List */}
      <div style={{ width:310,flexShrink:0,borderRight:"1px solid var(--border)",background:"var(--surface)",display:"flex",flexDirection:"column" }}>
        <div style={{ padding:"14px 14px 10px",borderBottom:"1px solid var(--border)" }}>
          <div style={{ fontSize:15,fontFamily:"var(--display)",fontWeight:700,marginBottom:10 }}>Invoices</div>
          <div style={{ display:"flex",gap:4,flexWrap:"wrap" }}>
            {["all","draft","sent","partial","overdue","paid"].map(s=>(
              <button key={s} onClick={()=>setFilter(s)} style={{ fontSize:11,padding:"3px 9px",borderRadius:100,background:filter===s?"var(--blue)":"var(--surface2)",color:filter===s?"#fff":"var(--text3)",border:filter===s?"none":"1px solid var(--border)",cursor:"pointer",textTransform:"capitalize",fontWeight:filter===s?600:400 }}>
                {s}
              </button>
            ))}
          </div>
        </div>
        <div style={{ flex:1,overflowY:"auto" }}>
          {loading ? <Spinner /> : list.length===0
            ? <div style={{ padding:24,textAlign:"center",color:"var(--text3)",fontSize:13 }}>No invoices found.<br/>Create estimates from the Jobs tab.</div>
            : list.map(inv=>{
              const sel=selected?.id===inv.id;
              const balance=round2((inv.total||0)-(inv.amount_paid||0));
              return (
                <div key={inv.id} onClick={()=>setSelected(inv)} style={{ padding:"12px 14px",borderBottom:"1px solid var(--border)",cursor:"pointer",background:sel?"var(--blue-lt)":"transparent",borderLeft:sel?"3px solid var(--blue)":"3px solid transparent",transition:"background .1s" }}
                  onMouseEnter={e=>{ if(!sel) e.currentTarget.style.background="var(--surface2)"; }}
                  onMouseLeave={e=>{ if(!sel) e.currentTarget.style.background="transparent"; }}
                >
                  <div style={{ display:"flex",justifyContent:"space-between",marginBottom:4 }}>
                    <span style={{ fontSize:12,fontFamily:"var(--mono)",fontWeight:600,color:sel?"var(--blue)":"var(--text2)" }}>{inv.invoice_number}</span>
                    <Chip status={inv.status} />
                  </div>
                  <div style={{ fontSize:13,fontWeight:500,marginBottom:2 }}>{inv.customer_name}</div>
                  <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
                    <span style={{ fontSize:11,color:"var(--text3)" }}>Due {fmtDate(inv.due_date)}</span>
                    <span style={{ fontSize:14,fontFamily:"var(--mono)",fontWeight:700,color:inv.status==="paid"?"var(--green)":inv.status==="overdue"?"var(--red)":"var(--text1)" }}>
                      {inv.status==="paid"?fmt$(inv.amount_paid):fmt$(balance)}
                    </span>
                  </div>
                </div>
              );
            })
          }
        </div>
      </div>

      {/* Detail */}
      <div style={{ flex:1,overflowY:"auto",padding:28 }}>
        {selected ? (
          <div className="fade-in">
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:22 }}>
              <div>
                <div style={{ fontSize:12,fontFamily:"var(--mono)",color:"var(--text3)",marginBottom:4 }}>{selected.job_number}</div>
                <div style={{ display:"flex",alignItems:"center",gap:12,marginBottom:6 }}>
                  <h2 style={{ fontSize:24,fontFamily:"var(--display)",fontWeight:800 }}>{selected.invoice_number}</h2>
                  <Chip status={selected.status} />
                </div>
                <div style={{ fontSize:13,color:"var(--text3)" }}>{selected.customer_name} · Due {fmtDate(selected.due_date)}</div>
              </div>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontSize:10,color:"var(--text3)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:4 }}>{selected.status==="paid"?"Amount Paid":"Balance Due"}</div>
                <div style={{ fontSize:32,fontFamily:"var(--mono)",fontWeight:700,color:selected.status==="paid"?"var(--green)":selected.status==="overdue"?"var(--red)":"var(--text1)" }}>
                  {selected.status==="paid"?fmt$(selected.amount_paid):fmt$(round2((selected.total||0)-(selected.amount_paid||0)))}
                </div>
              </div>
            </div>
            <div style={{ display:"flex",gap:8,marginBottom:22,flexWrap:"wrap" }}>
              {selected.status==="draft"   && <Btn onClick={()=>sendInvoice(selected.id)}>✉ Send to Customer</Btn>}
              {["sent","partial","overdue"].includes(selected.status) && <Btn variant="green">💳 Collect Payment</Btn>}
              <Btn variant="secondary">⬇ Download PDF</Btn>
            </div>
            <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12 }}>
              {[
                { label:"Invoice Total", val:fmt$(selected.total),                                               color:"var(--text1)" },
                { label:"Amount Paid",   val:fmt$(selected.amount_paid),                                         color:"var(--green)" },
                { label:"Balance Due",   val:fmt$(round2((selected.total||0)-(selected.amount_paid||0))),         color:round2((selected.total||0)-(selected.amount_paid||0))>0?"var(--red)":"var(--green)" },
              ].map((s,i)=>(
                <Card key={i} style={{ padding:"14px 18px" }}>
                  <div style={{ fontSize:10,color:"var(--text3)",letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:6,fontFamily:"var(--display)",fontWeight:600 }}>{s.label}</div>
                  <div style={{ fontSize:20,fontFamily:"var(--mono)",fontWeight:700,color:s.color }}>{s.val}</div>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          <Empty icon="📄" title="Select an invoice" desc="Invoices are created from approved estimates on the Jobs tab" />
        )}
      </div>
    </div>
  );
}

// ─── APP SHELL ────────────────────────────────────────────────────────────────
function Shell() {
  const { route } = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  const screens = { "/": <Dashboard />, "/dispatch":<Dispatch />, "/customers":<Customers />, "/jobs":<Jobs />, "/invoices":<Invoices /> };

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

// ─── ROOT ─────────────────────────────────────────────────────────────────────
function App() {
  const { user } = useAuth();
  return user ? <Shell /> : <Login />;
}

export default function Root() {
  return (
    <>
      <style>{CSS}</style>
      <RouterProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </RouterProvider>
    </>
  );
}
