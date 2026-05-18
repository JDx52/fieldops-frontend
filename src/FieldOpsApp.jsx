/* eslint-disable */
import { useState, useContext, createContext, useCallback, useEffect, useRef } from "react";

// ════════════════════════════════════════════════════════════════
//  GLOBAL STYLES
// ════════════════════════════════════════════════════════════════
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Epilogue:ital,wght@0,300;0,400;0,500;0,600;1,400&family=DM+Mono:wght@400;500;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    /* Sidebar - deep navy */
    --nav-bg:      #0C1220;
    --nav-border:  #1A2340;
    --nav-text:    #8899BB;
    --nav-active:  #FFFFFF;
    --nav-hover:   #1E2D4A;
    --nav-accent:  #3B82F6;

    /* App chrome */
    --bg:          #F1F3F7;
    --surface:     #FFFFFF;
    --surface2:    #F8F9FB;
    --border:      #E4E8EF;
    --border2:     #CDD3DE;

    /* Typography */
    --text1:       #0D1117;
    --text2:       #4A5568;
    --text3:       #8A94A6;
    --text4:       #B8C2CC;

    /* Status */
    --blue:        #2563EB;
    --blue-lt:     #EFF6FF;
    --blue-bd:     #BFDBFE;
    --green:       #0D7B4E;
    --green-lt:    #ECFDF5;
    --green-bd:    #A7F3D0;
    --amber:       #B45309;
    --amber-lt:    #FFFBEB;
    --amber-bd:    #FCD34D;
    --red:         #DC2626;
    --red-lt:      #FEF2F2;
    --red-bd:      #FECACA;
    --purple:      #7C3AED;
    --purple-lt:   #F5F3FF;
    --purple-bd:   #DDD6FE;

    /* Fonts */
    --display:     'Syne', sans-serif;
    --sans:        'Epilogue', -apple-system, sans-serif;
    --mono:        'DM Mono', monospace;
  }

  html, body, #root { height: 100%; }
  body { font-family: var(--sans); background: var(--bg); color: var(--text1); font-size: 14px; line-height: 1.5; }
  button { font-family: var(--sans); cursor: pointer; }
  input, textarea, select { font-family: var(--sans); }

  ::-webkit-scrollbar { width: 4px; height: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 8px; }

  @keyframes fadeIn    { from { opacity:0; transform:translateY(6px) } to { opacity:1; transform:none } }
  @keyframes slideLeft { from { opacity:0; transform:translateX(-12px) } to { opacity:1; transform:none } }
  @keyframes scaleUp   { from { opacity:0; transform:scale(0.96) } to { opacity:1; transform:scale(1) } }
  @keyframes spin      { to { transform: rotate(360deg) } }
  @keyframes pulse     { 0%,100% { opacity:1 } 50% { opacity:.4 } }

  .fade-in    { animation: fadeIn    .22s ease both; }
  .slide-left { animation: slideLeft .22s ease both; }
  .scale-up   { animation: scaleUp   .18s ease both; }
  .s1 { animation-delay:.05s } .s2 { animation-delay:.10s }
  .s3 { animation-delay:.15s } .s4 { animation-delay:.20s }
`;

// ════════════════════════════════════════════════════════════════
//  AUTH CONTEXT
// ════════════════════════════════════════════════════════════════
const AuthContext = createContext(null);

const DEMO_USER = {
  id: "u1", name: "Jordan Ellis", email: "jordan@acmehvac.com",
  role: "admin", company_id: "c1",
  company: { id:"c1", name:"Acme HVAC & Plumbing", slug:"acme-hvac" },
  avatar: "JE",
};

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  async function login(email, password) {
    setLoading(true);
    try {
      const API = process.env.REACT_APP_API_URL || "https://fieldops-api-production-a1b2.com/v1";
      const res = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message || "Login failed");
      localStorage.setItem("fieldops_token", data.data.token);
      const u = { ...data.data.user, company: data.data.user.company || { name: "My Company" } };
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

  useEffect(() => {
    const saved = localStorage.getItem("fsm_user");
    const token = localStorage.getItem("fieldops_token");
    if (saved && token) try { setUser(JSON.parse(saved)); } catch {}
  }, []);

  return <AuthContext.Provider value={{ user, login, logout, loading }}>{children}</AuthContext.Provider>;
}
const useAuth = () => useContext(AuthContext);

// ════════════════════════════════════════════════════════════════
//  ROUTER (hash-based, no dependencies)
// ════════════════════════════════════════════════════════════════
const RouterContext = createContext(null);

function RouterProvider({ children }) {
  const [route, setRoute] = useState(() => window.location.hash.slice(1) || "/");
  const navigate = useCallback(path => {
    window.location.hash = path;
    setRoute(path);
  }, []);
  useEffect(() => {
    const handler = () => setRoute(window.location.hash.slice(1) || "/");
    window.addEventListener("hashchange", handler);
    return () => window.removeEventListener("hashchange", handler);
  }, []);
  return <RouterContext.Provider value={{ route, navigate }}>{children}</RouterContext.Provider>;
}
const useRouter = () => useContext(RouterContext);

// ════════════════════════════════════════════════════════════════
//  MOCK DATA
// ════════════════════════════════════════════════════════════════
const MOCK = {
  stats: { jobs_today:8, jobs_week:34, revenue_month:38200, open_invoices:12450, techs_active:4 },
  recentJobs: [
    { id:"j1", job_number:"JOB-00156", title:"AC Not Cooling", customer:"Sarah Johnson", status:"in_progress", scheduled:"Today 9:00 AM", tech:"Mike Torres" },
    { id:"j2", job_number:"JOB-00155", title:"Furnace Tune-Up", customer:"Robert Kim", status:"scheduled", scheduled:"Today 11:00 AM", tech:"Dana Reyes" },
    { id:"j3", job_number:"JOB-00154", title:"Leak Repair", customer:"Maria Garcia", status:"en_route", scheduled:"Today 8:30 AM", tech:"Chris Park" },
    { id:"j4", job_number:"JOB-00153", title:"Panel Inspection", customer:"Lisa Chen", status:"completed", scheduled:"Yesterday", tech:"Sam Wright" },
    { id:"j5", job_number:"JOB-00152", title:"Water Heater Install", customer:"Tom Bradley", status:"completed", scheduled:"Yesterday", tech:"Mike Torres" },
  ],
  revenueChart: [
    { month:"Dec", val:28400 }, { month:"Jan", val:31200 }, { month:"Feb", val:26800 },
    { month:"Mar", val:35600 }, { month:"Apr", val:33100 }, { month:"May", val:38200 },
  ],
  invoiceAging: [
    { label:"0-30 days", val:7200, color:"var(--blue)" },
    { label:"31-60 days", val:3100, color:"var(--amber)" },
    { label:"61-90 days", val:1500, color:"var(--red)" },
    { label:"90+ days", val:650, color:"#991B1B" },
  ],
};

// ════════════════════════════════════════════════════════════════
//  SHARED UI ATOMS
// ════════════════════════════════════════════════════════════════
const STATUS_CFG = {
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
};

function Chip({ status }) {
  const c = STATUS_CFG[status] || STATUS_CFG.draft;
  return (
    <span style={{
      display:"inline-flex", alignItems:"center", gap:5,
      background:c.bg, color:c.color, border:`1px solid ${c.bd}`,
      borderRadius:4, padding:"2px 8px",
      fontSize:11, fontWeight:600, fontFamily:"var(--display)",
      letterSpacing:"0.04em", whiteSpace:"nowrap",
    }}>
      <span style={{ width:5, height:5, borderRadius:"50%", background:c.color, flexShrink:0 }} />
      {c.label}
    </span>
  );
}

function Btn({ children, variant="primary", onClick, small, disabled, full, style:sx={} }) {
  const variants = {
    primary:   { background:"var(--blue)", color:"#fff", border:"1px solid transparent" },
    secondary: { background:"var(--surface)", color:"var(--text2)", border:"1px solid var(--border)" },
    ghost:     { background:"transparent", color:"var(--text3)", border:"1px solid transparent" },
    danger:    { background:"var(--red-lt)", color:"var(--red)", border:"1px solid var(--red-bd)" },
    dark:      { background:"var(--text1)", color:"#fff", border:"1px solid transparent" },
  };
  return (
    <button onClick={disabled ? undefined : onClick} style={{
      ...variants[variant], borderRadius:8, fontWeight:500,
      padding: small ? "5px 12px" : "9px 18px",
      fontSize: small ? 12 : 13,
      opacity: disabled ? .5 : 1,
      cursor: disabled ? "not-allowed" : "pointer",
      transition:"all .12s", width: full ? "100%" : "auto",
      ...sx,
    }}
    onMouseEnter={e => { if(!disabled) e.currentTarget.style.filter="brightness(.9)"; }}
    onMouseLeave={e => e.currentTarget.style.filter=""}
    >{children}</button>
  );
}

function Card({ children, style:sx={}, className="" }) {
  return (
    <div className={className} style={{
      background:"var(--surface)", border:"1px solid var(--border)",
      borderRadius:12, ...sx,
    }}>
      {children}
    </div>
  );
}

function SectionHead({ children, action }) {
  return (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
      <h3 style={{ fontSize:14, fontWeight:700, fontFamily:"var(--display)", letterSpacing:"0.01em" }}>{children}</h3>
      {action}
    </div>
  );
}

function fmt$(n) { return "$"+Number(n).toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2}); }

// ════════════════════════════════════════════════════════════════
//  LOGIN SCREEN
// ════════════════════════════════════════════════════════════════
function LoginScreen() {
  const { login, loading } = useAuth();
  const [email, setEmail] = useState("jordan@acmehvac.com");
  const [password, setPassword] = useState("demo123");
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e?.preventDefault();
    setError("");
    const res = await login(email, password);
    if (!res.ok) setError(res.error);
  }

  const inp = { padding:"11px 14px", borderRadius:8, fontSize:14, border:"1px solid var(--border2)", width:"100%", outline:"none", transition:"border-color .15s, box-shadow .15s" };

  return (
    <div style={{
      minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center",
      background: "linear-gradient(135deg, #0C1220 0%, #1A2A4A 50%, #0C1220 100%)",
      position:"relative", overflow:"hidden",
    }}>
      {/* Background grid */}
      <div style={{
        position:"absolute", inset:0, opacity:.07,
        backgroundImage:`linear-gradient(#3B82F6 1px, transparent 1px), linear-gradient(90deg, #3B82F6 1px, transparent 1px)`,
        backgroundSize:"40px 40px",
      }} />
      {/* Glow */}
      <div style={{ position:"absolute", top:"30%", left:"50%", transform:"translate(-50%,-50%)", width:600, height:600, borderRadius:"50%", background:"#3B82F620", filter:"blur(100px)", pointerEvents:"none" }} />

      <div className="scale-up" style={{ position:"relative", zIndex:1, width:"100%", maxWidth:420, padding:20 }}>
        {/* Logo */}
        <div style={{ textAlign:"center", marginBottom:40 }}>
          <div style={{
            display:"inline-flex", alignItems:"center", gap:12, marginBottom:10,
          }}>
            <div style={{
              width:44, height:44, borderRadius:12,
              background:"linear-gradient(135deg, #3B82F6, #1D4ED8)",
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:22, boxShadow:"0 8px 24px #3B82F640",
            }}>⚡</div>
            <span style={{ fontSize:26, fontFamily:"var(--display)", fontWeight:800, color:"#fff", letterSpacing:"-0.02em" }}>
              FieldOps
            </span>
          </div>
          <p style={{ color:"#8899BB", fontSize:13 }}>Field Service Management</p>
        </div>

        {/* Card */}
        <div style={{
          background:"rgba(255,255,255,.04)", backdropFilter:"blur(20px)",
          border:"1px solid rgba(255,255,255,.10)", borderRadius:16,
          padding:"32px 32px 28px", boxShadow:"0 24px 64px rgba(0,0,0,.4)",
        }}>
          <h2 style={{ fontSize:20, fontFamily:"var(--display)", fontWeight:700, color:"#fff", marginBottom:6 }}>Welcome back</h2>
          <p style={{ fontSize:13, color:"#8899BB", marginBottom:28 }}>Sign in to your workspace</p>

          {error && (
            <div style={{ background:"var(--red-lt)", border:"1px solid var(--red-bd)", borderRadius:8, padding:"10px 14px", fontSize:13, color:"var(--red)", marginBottom:16 }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display:"flex", flexDirection:"column", gap:14 }}>
            <div>
              <label style={{ fontSize:12, fontWeight:600, color:"#8899BB", display:"block", marginBottom:6, letterSpacing:"0.05em", textTransform:"uppercase", fontFamily:"var(--display)" }}>Email</label>
              <input value={email} onChange={e=>setEmail(e.target.value)} type="email" placeholder="you@company.com"
                style={{ ...inp, background:"rgba(255,255,255,.06)", color:"#fff", borderColor:"rgba(255,255,255,.12)" }}
                onFocus={e=>{e.target.style.borderColor="#3B82F6";e.target.style.boxShadow="0 0 0 3px #3B82F620";}}
                onBlur={e=>{e.target.style.borderColor="rgba(255,255,255,.12)";e.target.style.boxShadow="none";}}
              />
            </div>
            <div>
              <label style={{ fontSize:12, fontWeight:600, color:"#8899BB", display:"block", marginBottom:6, letterSpacing:"0.05em", textTransform:"uppercase", fontFamily:"var(--display)" }}>Password</label>
              <input value={password} onChange={e=>setPassword(e.target.value)} type="password" placeholder="••••••••"
                style={{ ...inp, background:"rgba(255,255,255,.06)", color:"#fff", borderColor:"rgba(255,255,255,.12)" }}
                onFocus={e=>{e.target.style.borderColor="#3B82F6";e.target.style.boxShadow="0 0 0 3px #3B82F620";}}
                onBlur={e=>{e.target.style.borderColor="rgba(255,255,255,.12)";e.target.style.boxShadow="none";}}
              />
            </div>
            <button type="submit" disabled={loading} style={{
              marginTop:6, padding:"12px", background:"linear-gradient(135deg, #3B82F6, #1D4ED8)",
              color:"#fff", border:"none", borderRadius:9, fontSize:14, fontWeight:600,
              cursor: loading ? "wait" : "pointer", transition:"opacity .15s",
              fontFamily:"var(--display)", letterSpacing:"0.02em",
              boxShadow:"0 4px 16px #3B82F640",
              opacity: loading ? .7 : 1,
            }}>
              {loading ? "Signing in…" : "Sign In →"}
            </button>
          </form>

          <div style={{ marginTop:20, padding:"12px 14px", background:"rgba(59,130,246,.08)", border:"1px solid rgba(59,130,246,.2)", borderRadius:8 }}>
            <p style={{ fontSize:11, color:"#8899BB", textAlign:"center" }}>
              Demo credentials pre-filled · any password (6+ chars) works
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
//  SIDEBAR NAV
// ════════════════════════════════════════════════════════════════
const NAV_ITEMS = [
  { id:"/",          icon:"⊞",  label:"Dashboard" },
  { id:"/dispatch",  icon:"📡", label:"Dispatch" },
  { id:"/customers", icon:"👥", label:"Customers" },
  { id:"/invoices",  icon:"📄", label:"Invoices" },
  { id:"/jobs",      icon:"🔧", label:"Jobs" },
  { id:"/reports",   icon:"📊", label:"Reports" },
];
const NAV_BOTTOM = [
  { id:"/settings",  icon:"⚙",  label:"Settings" },
];

function Sidebar({ collapsed, setCollapsed }) {
  const { route, navigate } = useRouter();
  const { user, logout } = useAuth();

  function NavLink({ item }) {
    const active = route === item.id;
    return (
      <button onClick={() => navigate(item.id)} title={collapsed ? item.label : ""} style={{
        display:"flex", alignItems:"center", gap:10,
        padding: collapsed ? "10px 0" : "9px 14px",
        justifyContent: collapsed ? "center" : "flex-start",
        width:"100%", background: active ? "rgba(59,130,246,.15)" : "transparent",
        border: active ? "1px solid rgba(59,130,246,.25)" : "1px solid transparent",
        borderRadius:8, color: active ? "#fff" : "var(--nav-text)",
        cursor:"pointer", transition:"all .12s", textAlign:"left",
        fontSize:13, fontWeight: active ? 600 : 400,
      }}
      onMouseEnter={e => { if(!active) { e.currentTarget.style.background="var(--nav-hover)"; e.currentTarget.style.color="#fff"; } }}
      onMouseLeave={e => { if(!active) { e.currentTarget.style.background="transparent"; e.currentTarget.style.color="var(--nav-text)"; } }}
      >
        <span style={{ fontSize:15, flexShrink:0, lineHeight:1 }}>{item.icon}</span>
        {!collapsed && <span>{item.label}</span>}
        {active && !collapsed && (
          <span style={{ marginLeft:"auto", width:5, height:5, borderRadius:"50%", background:"var(--nav-accent)" }} />
        )}
      </button>
    );
  }

  return (
    <div style={{
      width: collapsed ? 56 : 220, flexShrink:0,
      background:"var(--nav-bg)", borderRight:"1px solid var(--nav-border)",
      display:"flex", flexDirection:"column", transition:"width .2s ease",
      overflow:"hidden",
    }}>
      {/* Logo */}
      <div style={{
        height:56, display:"flex", alignItems:"center",
        padding: collapsed ? "0" : "0 16px",
        justifyContent: collapsed ? "center" : "space-between",
        borderBottom:"1px solid var(--nav-border)", flexShrink:0,
      }}>
        {!collapsed && (
          <div style={{ display:"flex", alignItems:"center", gap:9 }}>
            <div style={{
              width:28, height:28, borderRadius:7,
              background:"linear-gradient(135deg,#3B82F6,#1D4ED8)",
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:14, flexShrink:0,
            }}>⚡</div>
            <span style={{ fontSize:15, fontFamily:"var(--display)", fontWeight:800, color:"#fff", letterSpacing:"-0.01em", whiteSpace:"nowrap" }}>
              FieldOps
            </span>
          </div>
        )}
        {collapsed && <span style={{ fontSize:16 }}>⚡</span>}
        {!collapsed && (
          <button onClick={() => setCollapsed(true)} style={{
            background:"none", border:"none", color:"var(--nav-text)", cursor:"pointer", fontSize:14, padding:"4px", borderRadius:4,
          }}>◀</button>
        )}
      </div>

      {/* Expand btn when collapsed */}
      {collapsed && (
        <button onClick={() => setCollapsed(false)} style={{
          margin:"8px auto 0", background:"none", border:"none",
          color:"var(--nav-text)", cursor:"pointer", fontSize:13, padding:"4px 0", width:"100%", textAlign:"center",
        }}>▶</button>
      )}

      {/* Company badge */}
      {!collapsed && (
        <div style={{ margin:"10px 10px 4px", padding:"8px 10px", background:"rgba(59,130,246,.08)", border:"1px solid rgba(59,130,246,.15)", borderRadius:7 }}>
          <div style={{ fontSize:10, color:"var(--nav-text)", fontFamily:"var(--display)", letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:2 }}>Workspace</div>
          <div style={{ fontSize:12, color:"#fff", fontWeight:600, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
            {user?.company?.name}
          </div>
        </div>
      )}

      {/* Nav links */}
      <nav style={{ flex:1, padding: collapsed ? "8px 6px" : "8px 10px", display:"flex", flexDirection:"column", gap:2, overflowY:"auto" }}>
        {NAV_ITEMS.map(item => <NavLink key={item.id} item={item} />)}
      </nav>

      {/* Bottom */}
      <div style={{ padding: collapsed ? "8px 6px" : "8px 10px", borderTop:"1px solid var(--nav-border)", display:"flex", flexDirection:"column", gap:2 }}>
        {NAV_BOTTOM.map(item => <NavLink key={item.id} item={item} />)}

        {/* User */}
        <div style={{
          marginTop:4, padding: collapsed ? "8px 0" : "8px 10px",
          display:"flex", alignItems:"center", gap:9,
          justifyContent: collapsed ? "center" : "flex-start",
          borderRadius:8, cursor:"pointer",
        }}
        onClick={logout}
        onMouseEnter={e => e.currentTarget.style.background="var(--nav-hover)"}
        onMouseLeave={e => e.currentTarget.style.background="transparent"}
        title={collapsed ? `${user?.name} · Sign out` : ""}
        >
          <div style={{
            width:28, height:28, borderRadius:"50%", background:"#3B82F620",
            border:"1px solid #3B82F660", display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:11, fontWeight:700, color:"#3B82F6", flexShrink:0, fontFamily:"var(--display)",
          }}>{user?.avatar}</div>
          {!collapsed && (
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:12, fontWeight:600, color:"#fff", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{user?.name}</div>
              <div style={{ fontSize:10, color:"var(--nav-text)" }}>Sign out</div>
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
const PAGE_TITLES = { "/":"Dashboard", "/dispatch":"Dispatch Board", "/customers":"Customers", "/invoices":"Invoices", "/jobs":"Jobs", "/reports":"Reports", "/settings":"Settings" };

function TopBar({ notifs, setNotifs }) {
  const { route } = useRouter();
  const { user } = useAuth();
  const [showNotifs, setShowNotifs] = useState(false);
  const unread = notifs.filter(n => !n.read).length;

  return (
    <div style={{
      height:56, background:"var(--surface)", borderBottom:"1px solid var(--border)",
      display:"flex", alignItems:"center", padding:"0 24px", gap:16, flexShrink:0,
    }}>
      <div style={{ flex:1 }}>
        <h1 style={{ fontSize:18, fontFamily:"var(--display)", fontWeight:700, letterSpacing:"-0.01em" }}>
          {PAGE_TITLES[route] || "FieldOps"}
        </h1>
      </div>

      {/* Search */}
      <div style={{ position:"relative" }}>
        <input placeholder="Search anything… (⌘K)" style={{
          background:"var(--surface2)", border:"1px solid var(--border)",
          borderRadius:8, padding:"7px 14px 7px 32px", fontSize:12,
          width:240, color:"var(--text2)",
        }} />
        <span style={{ position:"absolute", left:11, top:"50%", transform:"translateY(-50%)", color:"var(--text3)", fontSize:13 }}>⌕</span>
      </div>

      {/* Notif bell */}
      <div style={{ position:"relative" }}>
        <button onClick={() => { setShowNotifs(p=>!p); setNotifs(p=>p.map(n=>({...n,read:true}))); }} style={{
          background:"var(--surface2)", border:"1px solid var(--border)",
          borderRadius:8, width:36, height:36, display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:16, cursor:"pointer", position:"relative",
        }}>
          🔔
          {unread > 0 && (
            <span style={{
              position:"absolute", top:4, right:4, width:8, height:8,
              background:"var(--red)", borderRadius:"50%", border:"1.5px solid var(--surface)",
              animation:"pulse 2s infinite",
            }} />
          )}
        </button>
        {showNotifs && (
          <div style={{
            position:"absolute", top:44, right:0, width:300,
            background:"var(--surface)", border:"1px solid var(--border)",
            borderRadius:12, boxShadow:"0 16px 48px rgba(0,0,0,.12)", zIndex:100,
            overflow:"hidden",
          }}>
            <div style={{ padding:"12px 16px", borderBottom:"1px solid var(--border)", fontSize:13, fontWeight:700, fontFamily:"var(--display)" }}>Notifications</div>
            {notifs.map(n => (
              <div key={n.id} style={{ padding:"10px 16px", borderBottom:"1px solid var(--border)", fontSize:12, color:"var(--text2)", background: n.read ? "transparent" : "var(--blue-lt)" }}>
                <div style={{ fontWeight:500, marginBottom:2, color:"var(--text1)" }}>{n.title}</div>
                <div style={{ color:"var(--text3)" }}>{n.body}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Today's date */}
      <div style={{ fontSize:11, color:"var(--text3)", fontFamily:"var(--mono)", whiteSpace:"nowrap" }}>
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
  const maxRev = Math.max(...MOCK.revenueChart.map(r=>r.val));

  return (
    <div style={{ padding:24, overflowY:"auto", flex:1 }}>
      {/* Greeting */}
      <div className="fade-in" style={{ marginBottom:24 }}>
        <h2 style={{ fontSize:22, fontFamily:"var(--display)", fontWeight:700, marginBottom:4 }}>
          Good morning, {user?.name.split(" ")[0]} 👋
        </h2>
        <p style={{ fontSize:13, color:"var(--text3)" }}>
          Here's what's happening at {user?.company?.name} today.
        </p>
      </div>

      {/* KPI cards */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:12, marginBottom:20 }}>
        {[
          { label:"Jobs Today",       val:MOCK.stats.jobs_today,              suffix:"",  icon:"📅", color:"var(--blue)" },
          { label:"This Week",        val:MOCK.stats.jobs_week,               suffix:"",  icon:"📆", color:"var(--purple)" },
          { label:"Revenue / Month",  val:"$"+Math.round(MOCK.stats.revenue_month/1000)+"k", suffix:"", icon:"💰", color:"var(--green)" },
          { label:"Open Invoices",    val:fmt$(MOCK.stats.open_invoices),     suffix:"",  icon:"📄", color:"var(--amber)" },
          { label:"Techs Active",     val:MOCK.stats.techs_active,            suffix:"/4", icon:"👷", color:"var(--blue)" },
        ].map((k,i) => (
          <Card key={i} className={`fade-in s${Math.min(i+1,4)}`} style={{ padding:"16px 18px" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
              <span style={{ fontSize:11, color:"var(--text3)", fontWeight:600, fontFamily:"var(--display)", letterSpacing:"0.06em", textTransform:"uppercase" }}>{k.label}</span>
              <span style={{ fontSize:18 }}>{k.icon}</span>
            </div>
            <div style={{ fontSize:26, fontFamily:"var(--mono)", fontWeight:600, color:k.color, lineHeight:1 }}>
              {k.val}<span style={{ fontSize:14, color:"var(--text3)" }}>{k.suffix}</span>
            </div>
          </Card>
        ))}
      </div>

      {/* Charts row */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 300px", gap:16, marginBottom:20 }}>
        {/* Revenue bar chart */}
        <Card className="fade-in s2" style={{ padding:"20px 22px" }}>
          <SectionHead>Revenue — Last 6 Months</SectionHead>
          <div style={{ display:"flex", alignItems:"flex-end", gap:10, height:140 }}>
            {MOCK.revenueChart.map((r,i) => {
              const h = Math.round((r.val/maxRev)*100);
              const isLast = i === MOCK.revenueChart.length-1;
              return (
                <div key={r.month} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:5 }}>
                  <div style={{ fontSize:11, color:isLast?"var(--blue)":"var(--text3)", fontFamily:"var(--mono)", fontWeight:isLast?600:400 }}>
                    ${Math.round(r.val/1000)}k
                  </div>
                  <div style={{
                    width:"100%", borderRadius:"5px 5px 0 0",
                    background: isLast ? "var(--blue)" : "var(--border)",
                    height:`${h}%`, minHeight:4,
                    transition:"height .3s ease", position:"relative",
                    overflow:"hidden",
                  }}>
                    {isLast && <div style={{ position:"absolute", inset:0, background:"linear-gradient(180deg,rgba(255,255,255,.2),transparent)" }} />}
                  </div>
                  <div style={{ fontSize:10, color:"var(--text3)", fontFamily:"var(--display)", fontWeight:600 }}>{r.month}</div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Invoice aging */}
        <Card className="fade-in s3" style={{ padding:"20px 22px" }}>
          <SectionHead>Invoice Aging</SectionHead>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {MOCK.invoiceAging.map((a,i) => {
              const total = MOCK.invoiceAging.reduce((s,x)=>s+x.val,0);
              const pct = (a.val/total)*100;
              return (
                <div key={i}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                    <span style={{ fontSize:11, color:"var(--text2)" }}>{a.label}</span>
                    <span style={{ fontSize:12, fontFamily:"var(--mono)", fontWeight:600, color:a.color }}>{fmt$(a.val)}</span>
                  </div>
                  <div style={{ height:6, background:"var(--border)", borderRadius:3, overflow:"hidden" }}>
                    <div style={{ height:"100%", width:`${pct}%`, background:a.color, borderRadius:3 }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ marginTop:16, paddingTop:12, borderTop:"1px solid var(--border)", display:"flex", justifyContent:"space-between" }}>
            <span style={{ fontSize:12, color:"var(--text3)" }}>Total outstanding</span>
            <span style={{ fontSize:14, fontFamily:"var(--mono)", fontWeight:700, color:"var(--red)" }}>
              {fmt$(MOCK.invoiceAging.reduce((s,a)=>s+a.val,0))}
            </span>
          </div>
        </Card>
      </div>

      {/* Recent Jobs */}
      <Card className="fade-in s3">
        <div style={{ padding:"18px 20px 0" }}>
          <SectionHead action={<Btn small variant="secondary" onClick={()=>navigate("/jobs")}>View all →</Btn>}>
            Recent Jobs
          </SectionHead>
        </div>
        <table style={{ width:"100%", borderCollapse:"collapse" }}>
          <thead>
            <tr style={{ background:"var(--surface2)" }}>
              {["Job #","Title","Customer","Technician","Status"].map(h => (
                <th key={h} style={{ padding:"8px 16px", textAlign:"left", fontSize:11, fontWeight:600, color:"var(--text3)", fontFamily:"var(--display)", letterSpacing:"0.06em", textTransform:"uppercase", borderTop:"1px solid var(--border)", borderBottom:"1px solid var(--border)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MOCK.recentJobs.map((job,i) => (
              <tr key={job.id} style={{ borderBottom:"1px solid var(--border)", cursor:"pointer", transition:"background .1s" }}
                onMouseEnter={e=>e.currentTarget.style.background="var(--surface2)"}
                onMouseLeave={e=>e.currentTarget.style.background=""}
                onClick={()=>navigate("/jobs")}
              >
                <td style={{ padding:"12px 16px", fontSize:12, fontFamily:"var(--mono)", color:"var(--text3)" }}>{job.job_number}</td>
                <td style={{ padding:"12px 16px", fontSize:13, fontWeight:500 }}>{job.title}</td>
                <td style={{ padding:"12px 16px", fontSize:13, color:"var(--text2)" }}>{job.customer}</td>
                <td style={{ padding:"12px 16px", fontSize:12, color:"var(--text3)" }}>{job.tech}</td>
                <td style={{ padding:"12px 16px" }}><Chip status={job.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
//  PLACEHOLDER SCREENS (Jobs, Reports, Settings)
// ════════════════════════════════════════════════════════════════
function Placeholder({ icon, title, desc, cta, onCta }) {
  return (
    <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:16, padding:40 }}>
      <div style={{ fontSize:56 }}>{icon}</div>
      <h2 style={{ fontSize:22, fontFamily:"var(--display)", fontWeight:700 }}>{title}</h2>
      <p style={{ fontSize:14, color:"var(--text3)", maxWidth:360, textAlign:"center", lineHeight:1.7 }}>{desc}</p>
      {cta && <Btn onClick={onCta}>{cta}</Btn>}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
//  EMBEDDED SCREENS (trimmed for the shell — key UX preserved)
// ════════════════════════════════════════════════════════════════

/* ─── Dispatch (condensed) ─────────────────────────────────── */
const TECHS = [
  { id:"t1", name:"Mike Torres", avatar:"MT", color:"#3B82F6" },
  { id:"t2", name:"Dana Reyes",  avatar:"DR", color:"#F97316" },
  { id:"t3", name:"Chris Park",  avatar:"CP", color:"#10B981" },
  { id:"t4", name:"Sam Wright",  avatar:"SW", color:"#F59E0B" },
];
const DISPATCH_JOBS = [
  { id:"j1", job_number:"JOB-00156", title:"AC Not Cooling",       customer:"Sarah Johnson", address:"123 Oak St, Norman",     tech_id:"t1", status:"in_progress", priority:"high",   start:"08:00",end:"10:00" },
  { id:"j2", job_number:"JOB-00157", title:"Furnace Tune-Up",      customer:"Robert Kim",   address:"456 Elm Ave, Moore",     tech_id:"t1", status:"scheduled",   priority:"normal", start:"11:00",end:"12:30" },
  { id:"j3", job_number:"JOB-00158", title:"Leak Repair",          customer:"Maria Garcia", address:"789 Pine Rd, Norman",    tech_id:"t2", status:"en_route",    priority:"urgent", start:"08:30",end:"10:30" },
  { id:"j4", job_number:"JOB-00159", title:"Duct Cleaning",        customer:"Lisa Chen",    address:"654 Maple Dr, OKC",      tech_id:"t3", status:"scheduled",   priority:"normal", start:"09:00",end:"11:00" },
  { id:"j5", job_number:"JOB-00160", title:"Panel Inspection",     customer:"Tom Bradley",  address:"321 Cedar Ln, Edmond",   tech_id:"t4", status:"completed",   priority:"low",    start:"07:00",end:"09:00" },
  { id:"j6", job_number:"JOB-00161", title:"Emergency Gas Line",   customer:"Nancy Owens",  address:"246 Ash St, Yukon",      tech_id:null, status:"unscheduled", priority:"urgent", start:null,   end:null },
];

function DispatchScreen() {
  const [jobs, setJobs] = useState(DISPATCH_JOBS);
  const [selected, setSelected] = useState(null);
  const [dragging, setDragging] = useState(null);
  const [dragOver, setDragOver] = useState(null);
  const [notif, setNotif] = useState(null);

  function toast(msg) { setNotif(msg); setTimeout(()=>setNotif(null),2500); }
  function drop(techId) {
    if (!dragging) return;
    setJobs(p=>p.map(j=>j.id===dragging?{...j,tech_id:techId,status:j.status==="unscheduled"?"scheduled":j.status}:j));
    toast("Job reassigned to "+TECHS.find(t=>t.id===techId)?.name);
    setDragging(null); setDragOver(null);
  }
  const unassigned = jobs.filter(j=>!j.tech_id);

  return (
    <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
      {notif && <div style={{ position:"fixed",top:20,right:20,zIndex:999,background:"#064E3B",border:"1px solid #34D39940",borderRadius:8,padding:"10px 16px",color:"#34D399",fontSize:13,fontWeight:500 }}>{notif}</div>}

      {/* Toolbar */}
      <div style={{ padding:"12px 20px", background:"var(--surface)", borderBottom:"1px solid var(--border)", display:"flex", gap:12, alignItems:"center" }}>
        <input placeholder="Search jobs…" style={{ padding:"7px 12px",borderRadius:7,fontSize:12,border:"1px solid var(--border)",width:220 }} />
        <span style={{ fontSize:13, color:"var(--text3)" }}>Today — {new Date().toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"})}</span>
        <span style={{ marginLeft:"auto", fontSize:12, color:"var(--text3)" }}>{unassigned.length} unassigned</span>
        <Btn small>+ New Job</Btn>
      </div>

      <div style={{ flex:1, overflowY:"auto", padding:16, display:"flex", flexDirection:"column", gap:10 }}>
        {TECHS.map(tech => {
          const techJobs = jobs.filter(j=>j.tech_id===tech.id);
          const over = dragOver===tech.id;
          return (
            <div key={tech.id}
              onDragOver={e=>{e.preventDefault();setDragOver(tech.id);}}
              onDragLeave={()=>setDragOver(null)}
              onDrop={()=>drop(tech.id)}
              style={{ background:over?"#EFF6FF":"var(--surface)", border:`1px solid ${over?"var(--blue-bd)":"var(--border)"}`, borderRadius:10, overflow:"hidden", transition:"all .15s" }}
            >
              <div style={{ padding:"11px 16px", background:"var(--surface2)", borderBottom:techJobs.length?"1px solid var(--border)":"none", display:"flex", alignItems:"center", gap:10 }}>
                <div style={{ width:32,height:32,borderRadius:"50%",background:tech.color+"20",border:`1.5px solid ${tech.color}50`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:tech.color,fontFamily:"var(--display)" }}>{tech.avatar}</div>
                <span style={{ fontSize:13, fontWeight:600 }}>{tech.name}</span>
                <span style={{ fontSize:11, color:"var(--text3)", marginLeft:4 }}>{techJobs.length} job{techJobs.length!==1?"s":""}</span>
                <div style={{ marginLeft:"auto", display:"flex", gap:4 }}>
                  {["in_progress","en_route","scheduled"].map(s=>{
                    const cnt=techJobs.filter(j=>j.status===s).length;
                    if(!cnt)return null;
                    const c=STATUS_CFG[s];
                    return <span key={s} style={{ fontSize:10,background:c.bg,color:c.color,border:`1px solid ${c.bd}`,borderRadius:4,padding:"1px 6px",fontWeight:600 }}>{cnt}</span>;
                  })}
                </div>
              </div>
              {techJobs.length>0 && (
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))", gap:8, padding:10 }}>
                  {techJobs.map(job=>(
                    <div key={job.id} draggable onDragStart={()=>setDragging(job.id)} onClick={()=>setSelected(job)}
                      style={{ background:"var(--surface2)",border:`1px solid ${STATUS_CFG[job.status]?.bd||"var(--border)"}`,borderLeft:`3px solid ${STATUS_CFG[job.status]?.color||"var(--border2)"}`,borderRadius:7,padding:"10px 12px",cursor:"grab",opacity:dragging===job.id?.4:1,transition:"opacity .15s" }}
                      onMouseEnter={e=>e.currentTarget.style.filter="brightness(.97)"}
                      onMouseLeave={e=>e.currentTarget.style.filter=""}
                    >
                      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5 }}>
                        <span style={{ fontSize:10,fontFamily:"var(--mono)",color:"var(--text3)" }}>{job.job_number}</span>
                        <Chip status={job.status} />
                      </div>
                      <div style={{ fontSize:13,fontWeight:600,marginBottom:3 }}>{job.title}</div>
                      <div style={{ fontSize:11,color:"var(--text3)" }}>{job.customer}</div>
                      {job.start&&<div style={{ marginTop:5,fontSize:11,fontFamily:"var(--mono)",color:STATUS_CFG[job.status]?.color }}>{job.start}–{job.end}</div>}
                    </div>
                  ))}
                </div>
              )}
              {!techJobs.length && <div style={{ padding:"12px 18px",fontSize:12,color:"var(--text4)",fontStyle:"italic" }}>Drop jobs here</div>}
            </div>
          );
        })}

        {unassigned.length>0&&(
          <div style={{ background:"var(--surface)",border:"1px solid var(--red-bd)",borderRadius:10,overflow:"hidden" }}>
            <div style={{ padding:"11px 16px",background:"var(--red-lt)",display:"flex",alignItems:"center",gap:8 }}>
              <span style={{ width:8,height:8,borderRadius:"50%",background:"var(--red)",animation:"pulse 2s infinite",display:"inline-block" }}/>
              <span style={{ fontSize:13,fontWeight:600,color:"var(--red)" }}>Unassigned ({unassigned.length})</span>
            </div>
            <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:8,padding:10 }}>
              {unassigned.map(job=>(
                <div key={job.id} draggable onDragStart={()=>setDragging(job.id)} onClick={()=>setSelected(job)}
                  style={{ background:"var(--surface2)",border:"1px solid var(--border)",borderLeft:"3px solid var(--red)",borderRadius:7,padding:"10px 12px",cursor:"grab" }}
                >
                  <div style={{ fontSize:10,fontFamily:"var(--mono)",color:"var(--text3)",marginBottom:4 }}>{job.job_number}</div>
                  <div style={{ fontSize:13,fontWeight:600,marginBottom:3 }}>{job.title}</div>
                  <div style={{ fontSize:11,color:"var(--text3)" }}>{job.customer}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Customers (condensed shell) ──────────────────────────── */
const CUSTOMERS_DATA = [
  { id:"c1",first_name:"Sarah",last_name:"Johnson",email:"sarah.j@gmail.com",phone:"405-555-0177",tags:["VIP","Residential"],city:"Norman",state:"OK",jobs:3,ltv:254,agreement:true,overdue:false },
  { id:"c2",first_name:"Robert",last_name:"Kim",email:"rob.kim@outlook.com",phone:"405-555-0143",tags:["Commercial"],city:"Moore",state:"OK",jobs:2,ltv:890,agreement:false,overdue:true },
  { id:"c3",first_name:"Maria",last_name:"Garcia",email:"mgarcia@yahoo.com",phone:"405-555-0261",tags:["Residential","Emergency"],city:"Norman",state:"OK",jobs:2,ltv:540,agreement:false,overdue:false },
  { id:"c4",first_name:"Tom",last_name:"Bradley",email:"tbradley@email.com",phone:"405-555-0388",tags:["New Install"],city:"Edmond",state:"OK",jobs:2,ltv:4800,agreement:true,overdue:false },
  { id:"c5",first_name:"Lisa",last_name:"Chen",email:"lisachen@proton.me",phone:"405-555-0512",tags:["Residential"],city:"OKC",state:"OK",jobs:1,ltv:0,agreement:false,overdue:false },
];
const AVATAR_COLORS = ["#3B82F6","#10B981","#F97316","#7C3AED","#EC4899"];

function CustomersScreen() {
  const [search,setSearch]=useState("");
  const [selected,setSelected]=useState(CUSTOMERS_DATA[0]);

  const filtered=CUSTOMERS_DATA.filter(c=>{
    if(!search)return true;
    const q=search.toLowerCase();
    return `${c.first_name} ${c.last_name}`.toLowerCase().includes(q)||c.phone.includes(q)||(c.email||"").toLowerCase().includes(q);
  });

  function avatarColor(id){return AVATAR_COLORS[id.charCodeAt(1)%AVATAR_COLORS.length];}
  function ini(c){return(c.first_name[0]+c.last_name[0]).toUpperCase();}

  return (
    <div style={{ flex:1, display:"flex", overflow:"hidden" }}>
      {/* Sidebar */}
      <div style={{ width:300,flexShrink:0,borderRight:"1px solid var(--border)",background:"var(--surface)",display:"flex",flexDirection:"column" }}>
        <div style={{ padding:"14px 14px 10px",borderBottom:"1px solid var(--border)" }}>
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10 }}>
            <span style={{ fontSize:15,fontFamily:"var(--display)",fontWeight:700 }}>All Customers</span>
            <Btn small>+ New</Btn>
          </div>
          <div style={{ position:"relative" }}>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search…" style={{ width:"100%",padding:"7px 12px 7px 28px",borderRadius:7,fontSize:12,border:"1px solid var(--border)" }} />
            <span style={{ position:"absolute",left:9,top:"50%",transform:"translateY(-50%)",color:"var(--text3)",fontSize:12 }}>⌕</span>
          </div>
        </div>
        <div style={{ flex:1,overflowY:"auto" }}>
          {filtered.map((c,i)=>{
            const sel=selected?.id===c.id;
            const color=avatarColor(c.id);
            return (
              <div key={c.id} onClick={()=>setSelected(c)} style={{ padding:"11px 14px",borderBottom:"1px solid var(--border)",cursor:"pointer",background:sel?"var(--blue-lt)":"transparent",borderLeft:sel?"3px solid var(--blue)":"3px solid transparent",display:"flex",gap:10,alignItems:"center",transition:"background .1s" }}
                onMouseEnter={e=>{if(!sel)e.currentTarget.style.background="var(--surface2)";}}
                onMouseLeave={e=>{if(!sel)e.currentTarget.style.background="transparent";}}
              >
                <div style={{ width:36,height:36,borderRadius:"50%",background:color+"18",border:`1.5px solid ${color}40`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color,flexShrink:0 }}>{ini(c)}</div>
                <div style={{ flex:1,minWidth:0 }}>
                  <div style={{ display:"flex",alignItems:"center",gap:5,marginBottom:2 }}>
                    <span style={{ fontSize:13,fontWeight:600 }}>{c.first_name} {c.last_name}</span>
                    {c.overdue&&<span style={{ fontSize:9,background:"var(--red-lt)",color:"var(--red)",border:"1px solid var(--red-bd)",borderRadius:100,padding:"1px 5px",fontWeight:700 }}>OVERDUE</span>}
                    {c.agreement&&<span style={{ fontSize:9,background:"var(--green-lt)",color:"var(--green)",border:"1px solid var(--green-bd)",borderRadius:100,padding:"1px 5px",fontWeight:700 }}>PLAN</span>}
                  </div>
                  <div style={{ fontSize:11,color:"var(--text3)" }}>{c.phone} · {c.city}, {c.state}</div>
                </div>
                <div style={{ textAlign:"right",flexShrink:0 }}>
                  <div style={{ fontSize:12,fontFamily:"var(--mono)",color:"var(--text2)",fontWeight:500 }}>${c.ltv.toLocaleString()}</div>
                  <div style={{ fontSize:10,color:"var(--text3)" }}>{c.jobs} jobs</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detail */}
      {selected&&(
        <div style={{ flex:1,overflowY:"auto",padding:28 }}>
          <div className="fade-in" style={{ display:"flex",gap:16,alignItems:"flex-start",marginBottom:24 }}>
            <div style={{ width:56,height:56,borderRadius:"50%",background:avatarColor(selected.id)+"18",border:`2px solid ${avatarColor(selected.id)}40`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,fontWeight:700,color:avatarColor(selected.id),fontFamily:"var(--display)" }}>{ini(selected)}</div>
            <div style={{ flex:1 }}>
              <h2 style={{ fontSize:24,fontFamily:"var(--display)",fontWeight:800,marginBottom:4 }}>{selected.first_name} {selected.last_name}</h2>
              <div style={{ display:"flex",gap:12,color:"var(--text3)",fontSize:13 }}>
                <span>📞 {selected.phone}</span>
                <span>✉ {selected.email}</span>
                <span>📍 {selected.city}, {selected.state}</span>
              </div>
            </div>
            <div style={{ display:"flex",gap:8 }}>
              <Btn variant="secondary" small>✏ Edit</Btn>
              <Btn small>+ New Job</Btn>
            </div>
          </div>

          <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:20 }}>
            {[
              { label:"Lifetime Value", val:"$"+selected.ltv.toLocaleString(), color:"var(--blue)" },
              { label:"Total Jobs",     val:selected.jobs, color:"var(--text1)" },
              { label:"Service Plan",   val:selected.agreement?"Active":"None", color:selected.agreement?"var(--green)":"var(--text3)" },
              { label:"Status",         val:selected.overdue?"Overdue":"Good standing", color:selected.overdue?"var(--red)":"var(--green)" },
            ].map((s,i)=>(
              <Card key={i} style={{ padding:"14px 16px" }}>
                <div style={{ fontSize:10,color:"var(--text3)",letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:6,fontFamily:"var(--display)",fontWeight:600 }}>{s.label}</div>
                <div style={{ fontSize:18,fontFamily:"var(--mono)",fontWeight:700,color:s.color }}>{s.val}</div>
              </Card>
            ))}
          </div>

          <Card style={{ padding:"18px 20px" }}>
            <SectionHead>Tags</SectionHead>
            <div style={{ display:"flex",gap:6,flexWrap:"wrap" }}>
              {selected.tags.map(t=>(
                <span key={t} style={{ background:"var(--surface2)",border:"1px solid var(--border)",borderRadius:100,padding:"3px 12px",fontSize:12,color:"var(--text2)" }}>{t}</span>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

/* ─── Invoices (condensed shell) ───────────────────────────── */
const INVOICES_DATA = [
  { id:"i1",invoice_number:"INV-00156",customer:"Sarah Johnson",job:"JOB-00141",status:"sent",   total:406.73, paid:0,      due:"2026-05-29" },
  { id:"i2",invoice_number:"INV-00155",customer:"Tom Bradley",  job:"JOB-00139",status:"paid",   total:5001.50,paid:5001.50,due:"2026-05-24" },
  { id:"i3",invoice_number:"INV-00154",customer:"Robert Kim",   job:"JOB-00137",status:"overdue",total:967.88, paid:0,      due:"2026-05-05" },
  { id:"i4",invoice_number:"INV-00153",customer:"Maria Garcia", job:"JOB-00135",status:"partial", total:587.25, paid:300,    due:"2026-05-15" },
  { id:"i5",invoice_number:"INV-00152",customer:"Lisa Chen",    job:"JOB-00133",status:"draft",   total:244.69, paid:0,      due:"2026-05-31" },
];

function InvoicesScreen() {
  const [selected,setSelected]=useState(INVOICES_DATA[0]);
  const [filterStatus,setFilterStatus]=useState("all");
  const filtered=filterStatus==="all"?INVOICES_DATA:INVOICES_DATA.filter(i=>i.status===filterStatus);
  const balance=selected?selected.total-selected.paid:0;

  return (
    <div style={{ flex:1,display:"flex",overflow:"hidden" }}>
      {/* Sidebar */}
      <div style={{ width:310,flexShrink:0,borderRight:"1px solid var(--border)",background:"var(--surface)",display:"flex",flexDirection:"column" }}>
        <div style={{ padding:"14px 14px 10px",borderBottom:"1px solid var(--border)" }}>
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10 }}>
            <span style={{ fontSize:15,fontFamily:"var(--display)",fontWeight:700 }}>Invoices</span>
            <Btn small>+ New</Btn>
          </div>
          <div style={{ display:"flex",gap:4,flexWrap:"wrap" }}>
            {["all","draft","sent","partial","overdue","paid"].map(s=>(
              <button key={s} onClick={()=>setFilterStatus(s)} style={{ fontSize:11,padding:"3px 9px",borderRadius:100,background:filterStatus===s?"var(--blue)":"var(--surface2)",color:filterStatus===s?"#fff":"var(--text3)",border:filterStatus===s?"none":"1px solid var(--border)",fontWeight:filterStatus===s?600:400,cursor:"pointer",textTransform:"capitalize" }}>
                {s}
              </button>
            ))}
          </div>
        </div>
        <div style={{ flex:1,overflowY:"auto" }}>
          {filtered.map((inv,i)=>{
            const sel=selected?.id===inv.id;
            const sc=STATUS_CFG[inv.status];
            const bal=inv.total-inv.paid;
            return (
              <div key={inv.id} onClick={()=>setSelected(inv)} style={{ padding:"12px 14px",borderBottom:"1px solid var(--border)",cursor:"pointer",background:sel?"var(--blue-lt)":"transparent",borderLeft:sel?"3px solid var(--blue)":"3px solid transparent",transition:"background .1s" }}
                onMouseEnter={e=>{if(!sel)e.currentTarget.style.background="var(--surface2)";}}
                onMouseLeave={e=>{if(!sel)e.currentTarget.style.background="transparent";}}
              >
                <div style={{ display:"flex",justifyContent:"space-between",marginBottom:4 }}>
                  <span style={{ fontSize:12,fontFamily:"var(--mono)",fontWeight:600,color:sel?"var(--blue)":"var(--text2)" }}>{inv.invoice_number}</span>
                  <Chip status={inv.status} />
                </div>
                <div style={{ fontSize:13,fontWeight:500,marginBottom:2 }}>{inv.customer}</div>
                <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
                  <span style={{ fontSize:11,color:"var(--text3)" }}>Due {new Date(inv.due).toLocaleDateString("en-US",{month:"short",day:"numeric"})}</span>
                  <span style={{ fontSize:14,fontFamily:"var(--mono)",fontWeight:700,color:inv.status==="paid"?"var(--green)":inv.status==="overdue"?"var(--red)":"var(--text1)" }}>
                    {inv.status==="paid"?"$"+inv.paid.toLocaleString("en-US",{minimumFractionDigits:2}):"$"+bal.toLocaleString("en-US",{minimumFractionDigits:2})}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detail */}
      {selected&&(
        <div className="fade-in" style={{ flex:1,overflowY:"auto",padding:28 }}>
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:24 }}>
            <div>
              <div style={{ fontSize:12,fontFamily:"var(--mono)",color:"var(--text3)",marginBottom:4 }}>{selected.job}</div>
              <div style={{ display:"flex",alignItems:"center",gap:12,marginBottom:6 }}>
                <h2 style={{ fontSize:26,fontFamily:"var(--display)",fontWeight:800,letterSpacing:"-0.02em" }}>{selected.invoice_number}</h2>
                <Chip status={selected.status} />
              </div>
              <div style={{ fontSize:13,color:"var(--text3)" }}>{selected.customer} · Due {new Date(selected.due).toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"})}</div>
            </div>
            <div style={{ textAlign:"right" }}>
              <div style={{ fontSize:10,color:"var(--text3)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:4,fontFamily:"var(--display)",fontWeight:600 }}>{selected.status==="paid"?"Paid":"Balance Due"}</div>
              <div style={{ fontSize:36,fontFamily:"var(--mono)",fontWeight:700,color:selected.status==="paid"?"var(--green)":selected.status==="overdue"?"var(--red)":"var(--text1)" }}>
                ${(selected.status==="paid"?selected.paid:balance).toLocaleString("en-US",{minimumFractionDigits:2})}
              </div>
            </div>
          </div>

          <div style={{ display:"flex",gap:8,marginBottom:24 }}>
            {["sent","partial","overdue"].includes(selected.status)&&<Btn variant="dark">💳 Collect Payment</Btn>}
            {selected.status==="draft"&&<Btn>Send to Customer</Btn>}
            <Btn variant="secondary">✏ Edit</Btn>
            <Btn variant="secondary">⬇ Download PDF</Btn>
            <Btn variant="secondary">✉ Email</Btn>
          </div>

          <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:20 }}>
            {[
              { label:"Invoice Total", val:"$"+selected.total.toLocaleString("en-US",{minimumFractionDigits:2}), color:"var(--text1)" },
              { label:"Amount Paid",   val:"$"+selected.paid.toLocaleString("en-US",{minimumFractionDigits:2}),  color:"var(--green)" },
              { label:"Balance",       val:"$"+balance.toLocaleString("en-US",{minimumFractionDigits:2}),         color:balance>0?"var(--red)":"var(--green)" },
            ].map((s,i)=>(
              <Card key={i} style={{ padding:"14px 18px" }}>
                <div style={{ fontSize:10,color:"var(--text3)",letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:6,fontFamily:"var(--display)",fontWeight:600 }}>{s.label}</div>
                <div style={{ fontSize:22,fontFamily:"var(--mono)",fontWeight:700,color:s.color }}>{s.val}</div>
              </Card>
            ))}
          </div>

          <Card style={{ padding:"18px 20px" }}>
            <SectionHead>Invoice Timeline</SectionHead>
            <div style={{ display:"flex",gap:0 }}>
              {[
                { label:"Created",  done:true },
                { label:"Sent",     done:selected.status!=="draft" },
                { label:"Partial",  done:selected.paid>0 },
                { label:"Paid",     done:selected.status==="paid" },
              ].map((step,i,arr)=>(
                <div key={i} style={{ flex:1,display:"flex",flexDirection:"column",alignItems:"center",position:"relative" }}>
                  {i<arr.length-1&&<div style={{ position:"absolute",top:10,left:"50%",width:"100%",height:2,background:step.done?"var(--blue)":"var(--border)",zIndex:0 }}/>}
                  <div style={{ width:20,height:20,borderRadius:"50%",background:step.done?"var(--blue)":"var(--border)",border:"2px solid var(--surface)",zIndex:1,marginBottom:6 }}/>
                  <span style={{ fontSize:11,color:step.done?"var(--blue)":"var(--text3)",fontWeight:step.done?600:400 }}>{step.label}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
//  APP SHELL
// ════════════════════════════════════════════════════════════════
const INIT_NOTIFS = [
  { id:1, title:"JOB-00158 — En Route", body:"Chris Park is heading to Maria Garcia", read:false },
  { id:2, title:"Invoice overdue — INV-00154", body:"Robert Kim — $967.88 — 13 days overdue", read:false },
  { id:3, title:"New job booked", body:"Emergency gas line — Nancy Owens — Yukon", read:false },
];

function AppShell() {
  const { route, navigate } = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [notifs, setNotifs] = useState(INIT_NOTIFS);

  const screens = {
    "/":          <Dashboard />,
    "/dispatch":  <DispatchScreen />,
    "/customers": <CustomersScreen />,
    "/invoices":  <InvoicesScreen />,
    "/jobs":      <Placeholder icon="🔧" title="Jobs" desc="Full job management coming — built alongside the Dispatch board. Click Dispatch to see jobs in action." cta="Go to Dispatch" onCta={()=>navigate("/dispatch")} />,
    "/reports":   <Placeholder icon="📊" title="Reports & Analytics" desc="Revenue trends, technician performance, invoice aging, and job completion metrics." />,
    "/settings":  <Placeholder icon="⚙" title="Settings" desc="Company profile, team management, integrations, billing, and notification preferences." />,
  };

  return (
    <div style={{ display:"flex", height:"100vh", overflow:"hidden" }}>
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden", minWidth:0 }}>
        <TopBar notifs={notifs} setNotifs={setNotifs} />
        <div style={{ flex:1, display:"flex", overflow:"hidden" }}>
          {screens[route] || screens["/"]}
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
//  ROOT
// ════════════════════════════════════════════════════════════════
export default function App() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <RouterProvider>
        <AuthProvider>
          <AppInner mounted={mounted} />
        </AuthProvider>
      </RouterProvider>
    </>
  );
}

function AppInner({ mounted }) {
  const { user } = useAuth();
  if (!mounted) return null;
  return user ? <AppShell /> : <LoginScreen />;
}
