import { useState, useEffect, useRef, createContext, useContext, useCallback } from "react";

// ════════════════════════════════════════════════════════════════
//  GLOBAL STYLES — mobile-first, thumb-friendly
// ════════════════════════════════════════════════════════════════
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Barlow:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,700&family=Barlow+Condensed:wght@500;600;700;800&family=DM+Mono:wght@400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg:        #111318;
    --bg2:       #181B22;
    --bg3:       #1E222C;
    --card:      #1E222C;
    --border:    #2A2F3D;
    --border2:   #363C4E;
    --text1:     #F0F2F7;
    --text2:     #9BA3B8;
    --text3:     #5C6478;
    --blue:      #3B82F6;
    --blue-lt:   #1E3A5F;
    --green:     #22C55E;
    --green-lt:  #14392A;
    --amber:     #F59E0B;
    --amber-lt:  #3D2E0A;
    --red:       #EF4444;
    --red-lt:    #3D1010;
    --purple:    #A78BFA;
    --purple-lt: #2E1F5E;
    --display:   'Barlow Condensed', sans-serif;
    --sans:      'Barlow', sans-serif;
    --mono:      'DM Mono', monospace;
    --radius:    14px;
    --tab-h:     64px;
  }

  html { font-size: 16px; }
  body {
    font-family: var(--sans);
    background: var(--bg);
    color: var(--text1);
    min-height: 100vh;
    max-width: 430px;
    margin: 0 auto;
    position: relative;
    overflow-x: hidden;
    -webkit-tap-highlight-color: transparent;
    user-select: none;
  }

  button { font-family: var(--sans); cursor: pointer; border: none; background: none; }
  input, textarea { font-family: var(--sans); }

  ::-webkit-scrollbar { display: none; }
  * { -ms-overflow-style: none; scrollbar-width: none; }

  @keyframes fadeUp   { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:none } }
  @keyframes fadeIn   { from { opacity:0 } to { opacity:1 } }
  @keyframes slideUp  { from { transform:translateY(100%) } to { transform:translateY(0) } }
  @keyframes slideIn  { from { transform:translateX(100%) } to { transform:translateX(0) } }
  @keyframes pulse    { 0%,100%{opacity:1} 50%{opacity:.4} }
  @keyframes spin     { to { transform:rotate(360deg) } }
  @keyframes bounce   { 0%,100%{transform:scale(1)} 50%{transform:scale(1.06)} }
  @keyframes checkIn  { from{transform:scale(0) rotate(-20deg);opacity:0} 60%{transform:scale(1.2) rotate(5deg)} to{transform:scale(1) rotate(0);opacity:1} }

  .fade-up  { animation: fadeUp  .2s ease both; }
  .fade-in  { animation: fadeIn  .15s ease both; }
  .slide-up { animation: slideUp .25s cubic-bezier(.22,1,.36,1) both; }
  .slide-in { animation: slideIn .25s cubic-bezier(.22,1,.36,1) both; }
  .s1{animation-delay:.05s} .s2{animation-delay:.10s} .s3{animation-delay:.15s} .s4{animation-delay:.20s}

  .tap-scale { transition: transform .1s, opacity .1s; }
  .tap-scale:active { transform: scale(.96); opacity: .85; }
`;

// ════════════════════════════════════════════════════════════════
//  MOCK DATA
// ════════════════════════════════════════════════════════════════
const TECH = { id:"t1", name:"Mike Torres", avatar:"MT", role:"technician", company:"Acme HVAC" };

const INITIAL_JOBS = [
  {
    id:"j1", job_number:"JOB-00156", title:"AC Not Cooling",
    customer_name:"Sarah Johnson", customer_phone:"405-555-0177",
    address:"123 Oak Street", city:"Norman", state:"OK", zip:"73069",
    access_notes:"Gate code 1234. Large dogs — call ahead.",
    scheduled_start:"08:00", scheduled_end:"10:00",
    priority:"high", status:"in_progress",
    description:"Unit runs but won't cool below 80°F. Customer reports issue since yesterday.",
    notes:"", photos:[], clocked_in_at: new Date(Date.now()-72*60000).toISOString(),
    equipment:[{ name:"Carrier 3-Ton AC", model:"24ACC636A003", serial:"1234XYZ" }],
  },
  {
    id:"j2", job_number:"JOB-00157", title:"Furnace Tune-Up",
    customer_name:"Robert Kim", customer_phone:"405-555-0143",
    address:"456 Elm Avenue", city:"Moore", state:"OK", zip:"73160",
    access_notes:"Check in at front desk. Park in visitor lot.",
    scheduled_start:"11:00", scheduled_end:"12:30",
    priority:"normal", status:"scheduled",
    description:"Annual maintenance visit. Check all components, replace filter, clean burners.",
    notes:"", photos:[], clocked_in_at:null,
    equipment:[{ name:"Lennox Furnace", model:"ML195E060P36B", serial:"5678ABC" }],
  },
  {
    id:"j3", job_number:"JOB-00158", title:"Thermostat Replacement",
    customer_name:"Amy Foster", customer_phone:"405-555-0399",
    address:"159 Spruce Way", city:"Norman", state:"OK", zip:"73072",
    access_notes:"Side entrance. Knock loud.",
    scheduled_start:"13:30", scheduled_end:"14:30",
    priority:"low", status:"scheduled",
    description:"Customer wants smart thermostat upgrade. Ecobee SmartThermostat Premium.",
    notes:"", photos:[], clocked_in_at:null,
    equipment:[],
  },
  {
    id:"j4", job_number:"JOB-00153", title:"Filter Replacement",
    customer_name:"Dave Wilson", customer_phone:"405-555-0277",
    address:"987 Birch Blvd", city:"Midwest City", state:"OK", zip:"73110",
    access_notes:"",
    scheduled_start:"07:00", scheduled_end:"07:45",
    priority:"low", status:"completed",
    description:"Monthly filter swap under service agreement.",
    notes:"Replaced 20x25x4 filter. System running clean.", photos:[], clocked_in_at:null,
    equipment:[],
  },
];

const STATUS_CFG = {
  scheduled:   { label:"Scheduled",   color:"#3B82F6", bg:"#1E3A5F", icon:"📅" },
  en_route:    { label:"En Route",    color:"#A78BFA", bg:"#2E1F5E", icon:"🚗" },
  in_progress: { label:"In Progress", color:"#F59E0B", bg:"#3D2E0A", icon:"🔧" },
  on_hold:     { label:"On Hold",     color:"#EF4444", bg:"#3D1010", icon:"⏸" },
  completed:   { label:"Completed",   color:"#22C55E", bg:"#14392A", icon:"✅" },
};

const PRIORITY_CFG = {
  low:    { color:"#5C6478", dot:"#5C6478" },
  normal: { color:"#3B82F6", dot:"#3B82F6" },
  high:   { color:"#F59E0B", dot:"#F59E0B" },
  urgent: { color:"#EF4444", dot:"#EF4444" },
};

// ════════════════════════════════════════════════════════════════
//  CONTEXT
// ════════════════════════════════════════════════════════════════
const AppCtx = createContext(null);
function useApp() { return useContext(AppCtx); }

// ════════════════════════════════════════════════════════════════
//  SHARED ATOMS
// ════════════════════════════════════════════════════════════════
function StatusBadge({ status, large }) {
  const c = STATUS_CFG[status] || STATUS_CFG.scheduled;
  return (
    <span style={{
      display:"inline-flex", alignItems:"center", gap:5,
      background:c.bg, color:c.color,
      border:`1px solid ${c.color}40`,
      borderRadius:6, padding: large ? "5px 12px" : "3px 9px",
      fontSize: large ? 13 : 11, fontWeight:700,
      fontFamily:"var(--display)", letterSpacing:"0.05em",
      textTransform:"uppercase", whiteSpace:"nowrap",
    }}>
      {large && <span style={{fontSize:14}}>{c.icon}</span>}
      {c.label}
    </span>
  );
}

function BigBtn({ children, color="#3B82F6", bg, onClick, icon, disabled, style:sx={} }) {
  return (
    <button onClick={disabled?undefined:onClick} className="tap-scale" style={{
      width:"100%", padding:"16px 20px",
      background: bg || color+"22",
      border:`1.5px solid ${color}50`,
      borderRadius:14, color,
      fontSize:16, fontWeight:700,
      fontFamily:"var(--display)", letterSpacing:"0.04em",
      display:"flex", alignItems:"center", justifyContent:"center", gap:10,
      opacity: disabled ? .4 : 1,
      cursor: disabled?"not-allowed":"pointer",
      transition:"all .12s",
      ...sx,
    }}>
      {icon && <span style={{fontSize:20}}>{icon}</span>}
      {children}
    </button>
  );
}

function SmallBtn({ children, onClick, color="var(--text2)", style:sx={} }) {
  return (
    <button onClick={onClick} className="tap-scale" style={{
      padding:"8px 16px", borderRadius:10,
      background:"var(--bg3)", border:"1px solid var(--border)",
      color, fontSize:13, fontWeight:600,
      fontFamily:"var(--sans)", ...sx,
    }}>{children}</button>
  );
}

function Card({ children, style:sx={}, className="" }) {
  return (
    <div className={className} style={{
      background:"var(--card)", border:"1px solid var(--border)",
      borderRadius:"var(--radius)", ...sx,
    }}>{children}</div>
  );
}

function SectionLabel({ children }) {
  return (
    <div style={{ fontSize:11, fontWeight:700, color:"var(--text3)", letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:10, fontFamily:"var(--display)" }}>
      {children}
    </div>
  );
}

function Divider() {
  return <div style={{ height:1, background:"var(--border)", margin:"0 -18px" }} />;
}

// Elapsed time hook
function useElapsed(startISO) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!startISO) return;
    const tick = () => setElapsed(Math.floor((Date.now() - new Date(startISO).getTime()) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startISO]);
  const h = Math.floor(elapsed/3600);
  const m = Math.floor((elapsed%3600)/60);
  const s = elapsed%60;
  return h>0 ? `${h}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}` : `${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
}

// ════════════════════════════════════════════════════════════════
//  LOGIN
// ════════════════════════════════════════════════════════════════
function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState("mike@acmehvac.com");
  const [password, setPassword] = useState("demo123");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function submit() {
    setLoading(true); setErr("");
    await new Promise(r=>setTimeout(r,900));
    if (password.length >= 6) { onLogin(); }
    else { setErr("Invalid credentials"); setLoading(false); }
  }

  return (
    <div style={{ minHeight:"100vh", background:"linear-gradient(160deg,#0D1117 0%,#1A2340 100%)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:24 }}>
      <div className="scale-up" style={{ width:"100%", maxWidth:380 }}>
        {/* Logo */}
        <div style={{ textAlign:"center", marginBottom:48 }}>
          <div style={{ width:68, height:68, borderRadius:20, background:"linear-gradient(135deg,#3B82F6,#1D4ED8)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:32, margin:"0 auto 16px", boxShadow:"0 12px 40px #3B82F650" }}>⚡</div>
          <div style={{ fontSize:32, fontFamily:"var(--display)", fontWeight:800, color:"#fff", letterSpacing:"-0.01em" }}>FieldOps</div>
          <div style={{ fontSize:14, color:"#6B7FA8", marginTop:4 }}>Technician App</div>
        </div>

        {err && <div style={{ background:"#3D1010", border:"1px solid #EF444440", borderRadius:10, padding:"12px 16px", fontSize:14, color:"#EF4444", marginBottom:16, textAlign:"center" }}>{err}</div>}

        <div style={{ display:"flex", flexDirection:"column", gap:12, marginBottom:20 }}>
          <input value={email} onChange={e=>setEmail(e.target.value)}
            placeholder="Email" type="email"
            style={{ padding:"16px 18px", borderRadius:12, background:"rgba(255,255,255,.06)", border:"1px solid rgba(255,255,255,.12)", color:"#fff", fontSize:16, outline:"none" }}
          />
          <input value={password} onChange={e=>setPassword(e.target.value)}
            placeholder="Password" type="password"
            style={{ padding:"16px 18px", borderRadius:12, background:"rgba(255,255,255,.06)", border:"1px solid rgba(255,255,255,.12)", color:"#fff", fontSize:16, outline:"none" }}
            onKeyDown={e=>e.key==="Enter"&&submit()}
          />
        </div>

        <button onClick={submit} disabled={loading} className="tap-scale" style={{
          width:"100%", padding:"17px", background:"linear-gradient(135deg,#3B82F6,#1D4ED8)",
          border:"none", borderRadius:14, color:"#fff",
          fontSize:17, fontWeight:800, fontFamily:"var(--display)", letterSpacing:"0.04em",
          boxShadow:"0 8px 24px #3B82F640", cursor:"pointer",
        }}>
          {loading ? "Signing in…" : "Sign In →"}
        </button>

        <div style={{ marginTop:20, padding:"12px", background:"rgba(59,130,246,.08)", border:"1px solid rgba(59,130,246,.2)", borderRadius:10, textAlign:"center" }}>
          <p style={{ fontSize:12, color:"#6B7FA8" }}>Demo: any email, password 6+ chars</p>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
//  JOB LIST (Home tab)
// ════════════════════════════════════════════════════════════════
function JobListScreen() {
  const { jobs, setCurrentJob, setScreen } = useApp();
  const today = new Date().toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"});

  const active = jobs.filter(j=>["en_route","in_progress","on_hold"].includes(j.status));
  const upcoming = jobs.filter(j=>j.status==="scheduled");
  const done = jobs.filter(j=>j.status==="completed");

  function openJob(job) { setCurrentJob(job); setScreen("job"); }

  function JobRow({ job, animDelay=0 }) {
    const pc = PRIORITY_CFG[job.priority];
    const sc = STATUS_CFG[job.status];
    const isActive = ["en_route","in_progress"].includes(job.status);
    return (
      <div onClick={()=>openJob(job)} className="tap-scale fade-up" style={{
        background:"var(--card)", border:`1px solid ${isActive ? sc.color+"40" : "var(--border)"}`,
        borderLeft:`4px solid ${isActive ? sc.color : pc.dot}`,
        borderRadius:14, padding:"16px 16px", marginBottom:10,
        animationDelay:`${animDelay*0.06}s`,
      }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
          <div>
            <div style={{ fontSize:11, color:"var(--text3)", fontFamily:"var(--mono)", marginBottom:3 }}>{job.job_number}</div>
            <div style={{ fontSize:18, fontWeight:800, fontFamily:"var(--display)", lineHeight:1.1 }}>{job.title}</div>
          </div>
          <StatusBadge status={job.status} />
        </div>
        <div style={{ fontSize:14, color:"var(--text2)", marginBottom:8 }}>{job.customer_name}</div>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ fontSize:13, color:"var(--text3)", display:"flex", alignItems:"center", gap:5 }}>
            <span>📍</span>{job.city}, {job.state}
          </div>
          {job.scheduled_start && (
            <div style={{ fontSize:13, fontFamily:"var(--mono)", color: isActive ? sc.color : "var(--text2)", fontWeight:600 }}>
              {job.scheduled_start}–{job.scheduled_end}
            </div>
          )}
        </div>
        {isActive && job.clocked_in_at && (
          <div style={{ marginTop:10, padding:"6px 10px", background:sc.bg, borderRadius:8, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <span style={{ fontSize:12, color:sc.color, fontWeight:600 }}>⏱ Currently clocked in</span>
            <ElapsedBadge start={job.clocked_in_at} color={sc.color} />
          </div>
        )}
      </div>
    );
  }

  function ElapsedBadge({ start, color }) {
    const elapsed = useElapsed(start);
    return <span style={{ fontSize:13, fontFamily:"var(--mono)", fontWeight:700, color }}>{elapsed}</span>;
  }

  return (
    <div style={{ padding:"16px 16px 80px" }}>
      {/* Header */}
      <div className="fade-up" style={{ marginBottom:20, paddingTop:8 }}>
        <div style={{ fontSize:12, color:"var(--text3)", marginBottom:2 }}>{today}</div>
        <div style={{ fontSize:28, fontFamily:"var(--display)", fontWeight:800, letterSpacing:"-0.01em" }}>
          My Jobs
        </div>
      </div>

      {/* Summary pills */}
      <div className="fade-up s1" style={{ display:"flex", gap:8, marginBottom:20 }}>
        {[
          { label:`${active.length} Active`,   color:"var(--amber)", bg:"var(--amber-lt)" },
          { label:`${upcoming.length} Upcoming`,color:"var(--blue)",  bg:"var(--blue-lt)"  },
          { label:`${done.length} Done`,        color:"var(--green)", bg:"var(--green-lt)" },
        ].map((p,i)=>(
          <div key={i} style={{ flex:1, textAlign:"center", padding:"8px 6px", background:p.bg, border:`1px solid ${p.color}30`, borderRadius:10 }}>
            <div style={{ fontSize:14, fontWeight:800, color:p.color, fontFamily:"var(--display)" }}>{p.label}</div>
          </div>
        ))}
      </div>

      {/* Active jobs */}
      {active.length > 0 && (
        <>
          <SectionLabel>Active</SectionLabel>
          {active.map((j,i)=><JobRow key={j.id} job={j} animDelay={i} />)}
        </>
      )}

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <>
          <SectionLabel>Upcoming Today</SectionLabel>
          {upcoming.map((j,i)=><JobRow key={j.id} job={j} animDelay={i} />)}
        </>
      )}

      {/* Completed */}
      {done.length > 0 && (
        <>
          <SectionLabel>Completed</SectionLabel>
          {done.map((j,i)=><JobRow key={j.id} job={j} animDelay={i} />)}
        </>
      )}

      {jobs.length===0 && (
        <div style={{ textAlign:"center", padding:"60px 20px", color:"var(--text3)" }}>
          <div style={{ fontSize:48, marginBottom:12 }}>🎉</div>
          <div style={{ fontSize:18, fontFamily:"var(--display)", fontWeight:700 }}>All done for today!</div>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
//  JOB DETAIL SCREEN
// ════════════════════════════════════════════════════════════════
function JobDetailScreen() {
  const { currentJob, updateJob, setScreen } = useApp();
  const [tab, setTab] = useState("details");
  const [showStatusSheet, setShowStatusSheet] = useState(false);
  const [showClockConfirm, setShowClockConfirm] = useState(false);
  const [noteText, setNoteText] = useState(currentJob?.notes||"");
  const [savingNote, setSavingNote] = useState(false);
  const [toast, setToast] = useState(null);

  const job = currentJob;
  if (!job) return null;

  const sc = STATUS_CFG[job.status];
  const isActive = ["en_route","in_progress"].includes(job.status);
  const isClockedIn = !!job.clocked_in_at && job.status === "in_progress";
  const elapsed = useElapsed(isClockedIn ? job.clocked_in_at : null);

  function showToast(msg, type="success") {
    setToast({msg,type});
    setTimeout(()=>setToast(null),2200);
  }

  function handleStatusChange(newStatus) {
    const updates = { status:newStatus };
    if (newStatus==="in_progress" && !job.clocked_in_at) updates.clocked_in_at = new Date().toISOString();
    if (newStatus==="completed") updates.clocked_in_at = null;
    updateJob(job.id, updates);
    setShowStatusSheet(false);
    showToast(`Status → ${STATUS_CFG[newStatus]?.label}`);
  }

  function handleClockOut() {
    updateJob(job.id, { clocked_in_at:null, status:"on_hold" });
    setShowClockConfirm(false);
    showToast("Clocked out");
  }

  function saveNote() {
    setSavingNote(true);
    setTimeout(()=>{
      updateJob(job.id, { notes:noteText });
      setSavingNote(false);
      showToast("Note saved");
    },600);
  }

  function addPhoto() {
    // In production: triggers camera or file picker
    const fakePhoto = { id:Date.now(), url:`https://picsum.photos/seed/${Date.now()}/400/300`, caption:"Site photo", taken_at:new Date().toISOString() };
    updateJob(job.id, { photos:[...(job.photos||[]), fakePhoto] });
    showToast("Photo added");
  }

  // Next valid statuses
  const TRANSITIONS = {
    scheduled:   ["en_route","cancelled"],
    en_route:    ["in_progress","scheduled"],
    in_progress: ["completed","on_hold"],
    on_hold:     ["in_progress","completed"],
    completed:   [],
  };
  const nextStatuses = TRANSITIONS[job.status] || [];

  const tabs = ["details","notes","photos"];

  return (
    <div style={{ minHeight:"100vh", display:"flex", flexDirection:"column", paddingBottom:80 }}>
      {/* Toast */}
      {toast && (
        <div style={{ position:"fixed", top:20, left:"50%", transform:"translateX(-50%)", zIndex:999, background:toast.type==="error"?"var(--red-lt)":"var(--green-lt)", border:`1px solid ${toast.type==="error"?"var(--red)":"var(--green)"}40`, borderRadius:100, padding:"10px 20px", fontSize:13, fontWeight:600, color:toast.type==="error"?"var(--red)":"var(--green)", whiteSpace:"nowrap", animation:"fadeIn .15s ease", boxShadow:"0 8px 24px rgba(0,0,0,.3)" }}>
          {toast.msg}
        </div>
      )}

      {/* Status bottom sheet */}
      {showStatusSheet && (
        <div style={{ position:"fixed", inset:0, zIndex:100, background:"rgba(0,0,0,.7)" }} onClick={()=>setShowStatusSheet(false)}>
          <div className="slide-up" onClick={e=>e.stopPropagation()} style={{ position:"absolute", bottom:0, left:0, right:0, background:"var(--bg2)", borderRadius:"20px 20px 0 0", padding:"20px 16px 40px" }}>
            <div style={{ width:40, height:4, background:"var(--border2)", borderRadius:2, margin:"0 auto 20px" }} />
            <div style={{ fontSize:16, fontWeight:800, fontFamily:"var(--display)", marginBottom:16, textAlign:"center", color:"var(--text2)", letterSpacing:"0.04em", textTransform:"uppercase" }}>Update Status</div>
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {nextStatuses.map(s=>{
                const c=STATUS_CFG[s];
                return (
                  <button key={s} onClick={()=>handleStatusChange(s)} className="tap-scale" style={{
                    padding:"16px 20px", borderRadius:14, textAlign:"left",
                    background:c.bg, border:`1px solid ${c.color}40`,
                    display:"flex", alignItems:"center", gap:14, cursor:"pointer",
                  }}>
                    <span style={{ fontSize:24 }}>{c.icon}</span>
                    <div>
                      <div style={{ fontSize:17, fontWeight:800, color:c.color, fontFamily:"var(--display)", letterSpacing:"0.03em" }}>{c.label}</div>
                      <div style={{ fontSize:12, color:"var(--text3)", marginTop:1 }}>
                        {{en_route:"Start heading to job site",in_progress:"Begin work — starts timer",completed:"Mark job finished",on_hold:"Pause — waiting on parts/customer",scheduled:"Return to scheduled",cancelled:"Cancel this job"}[s]}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Clock out confirm */}
      {showClockConfirm && (
        <div style={{ position:"fixed", inset:0, zIndex:100, background:"rgba(0,0,0,.7)", display:"flex", alignItems:"flex-end" }}>
          <div className="slide-up" style={{ width:"100%", background:"var(--bg2)", borderRadius:"20px 20px 0 0", padding:"20px 16px 40px" }}>
            <div style={{ width:40, height:4, background:"var(--border2)", borderRadius:2, margin:"0 auto 20px" }} />
            <div style={{ fontSize:18, fontWeight:800, fontFamily:"var(--display)", marginBottom:8, textAlign:"center" }}>Clock Out?</div>
            <div style={{ fontSize:14, color:"var(--text2)", textAlign:"center", marginBottom:24 }}>This will pause the timer and set status to On Hold.</div>
            <div style={{ display:"flex", gap:10 }}>
              <SmallBtn onClick={()=>setShowClockConfirm(false)} style={{ flex:1, padding:"14px" }}>Cancel</SmallBtn>
              <button onClick={handleClockOut} className="tap-scale" style={{ flex:1, padding:"14px", background:"var(--red-lt)", border:"1px solid var(--red)40", borderRadius:12, color:"var(--red)", fontSize:15, fontWeight:700, fontFamily:"var(--display)", cursor:"pointer" }}>
                Clock Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ background:"var(--bg2)", borderBottom:"1px solid var(--border)", padding:"12px 16px 0", position:"sticky", top:0, zIndex:10 }}>
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:12 }}>
          <button onClick={()=>setScreen("home")} className="tap-scale" style={{ width:36, height:36, borderRadius:10, background:"var(--bg3)", border:"1px solid var(--border)", color:"var(--text2)", fontSize:18, display:"flex", alignItems:"center", justifyContent:"center" }}>←</button>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:11, color:"var(--text3)", fontFamily:"var(--mono)" }}>{job.job_number}</div>
            <div style={{ fontSize:19, fontWeight:800, fontFamily:"var(--display)", lineHeight:1.1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{job.title}</div>
          </div>
          <StatusBadge status={job.status} />
        </div>

        {/* Clock strip */}
        {isClockedIn && (
          <div style={{ margin:"0 0 12px", padding:"10px 14px", background:"var(--amber-lt)", border:"1px solid var(--amber)40", borderRadius:10, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div>
              <div style={{ fontSize:11, color:"var(--amber)", fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:2 }}>⏱ On the clock</div>
              <div style={{ fontSize:24, fontFamily:"var(--mono)", fontWeight:700, color:"var(--amber)", lineHeight:1 }}>{elapsed}</div>
            </div>
            <button onClick={()=>setShowClockConfirm(true)} className="tap-scale" style={{ padding:"8px 16px", background:"var(--amber)20", border:"1px solid var(--amber)50", borderRadius:9, color:"var(--amber)", fontSize:13, fontWeight:700, fontFamily:"var(--display)" }}>
              Clock Out
            </button>
          </div>
        )}

        {/* Tabs */}
        <div style={{ display:"flex", gap:0 }}>
          {tabs.map(t=>(
            <button key={t} onClick={()=>setTab(t)} style={{
              flex:1, padding:"10px 4px", background:"none", border:"none",
              borderBottom: tab===t ? "2px solid var(--blue)" : "2px solid transparent",
              color: tab===t ? "var(--blue)" : "var(--text3)",
              fontSize:13, fontWeight:700, fontFamily:"var(--display)",
              letterSpacing:"0.04em", textTransform:"capitalize", cursor:"pointer",
              transition:"color .12s",
            }}>{t}</button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div style={{ flex:1, padding:"16px", overflowY:"auto" }}>

        {tab==="details" && (
          <div>
            {/* CTA row */}
            {nextStatuses.length>0 && (
              <div className="fade-up" style={{ marginBottom:16 }}>
                <BigBtn onClick={()=>setShowStatusSheet(true)} color={sc.color} icon={sc.icon}>
                  Update Status
                </BigBtn>
              </div>
            )}
            {job.status==="scheduled" && (
              <div className="fade-up s1" style={{ marginBottom:16 }}>
                <a href={`https://maps.google.com/?q=${encodeURIComponent(job.address+", "+job.city+", "+job.state)}`} target="_blank" rel="noopener noreferrer" style={{ textDecoration:"none", display:"block" }}>
                  <BigBtn color="var(--purple)" icon="🗺">Open in Maps</BigBtn>
                </a>
              </div>
            )}

            {/* Customer card */}
            <Card className="fade-up s1" style={{ padding:"16px 18px", marginBottom:12 }}>
              <SectionLabel>Customer</SectionLabel>
              <div style={{ fontSize:18, fontWeight:700, marginBottom:6 }}>{job.customer_name}</div>
              <a href={`tel:${job.customer_phone}`} style={{ display:"flex", alignItems:"center", gap:8, color:"var(--blue)", fontSize:15, fontWeight:600, textDecoration:"none", marginBottom:4 }}>
                <span style={{ fontSize:18 }}>📞</span>{job.customer_phone}
              </a>
            </Card>

            {/* Address card */}
            <Card className="fade-up s2" style={{ padding:"16px 18px", marginBottom:12 }}>
              <SectionLabel>Job Site</SectionLabel>
              <div style={{ fontSize:15, fontWeight:600, marginBottom:2 }}>{job.address}</div>
              <div style={{ fontSize:14, color:"var(--text2)", marginBottom:12 }}>{job.city}, {job.state} {job.zip}</div>
              {job.access_notes && (
                <div style={{ padding:"10px 12px", background:"var(--amber-lt)", border:"1px solid var(--amber)30", borderRadius:9 }}>
                  <div style={{ fontSize:11, color:"var(--amber)", fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:4 }}>🔑 Access Notes</div>
                  <div style={{ fontSize:13, color:"var(--text1)", lineHeight:1.5 }}>{job.access_notes}</div>
                </div>
              )}
            </Card>

            {/* Job description */}
            <Card className="fade-up s3" style={{ padding:"16px 18px", marginBottom:12 }}>
              <SectionLabel>Description</SectionLabel>
              <div style={{ fontSize:14, color:"var(--text2)", lineHeight:1.6 }}>{job.description}</div>
            </Card>

            {/* Equipment */}
            {job.equipment?.length>0 && (
              <Card className="fade-up s4" style={{ padding:"16px 18px", marginBottom:12 }}>
                <SectionLabel>Equipment on Site</SectionLabel>
                {job.equipment.map((eq,i)=>(
                  <div key={i} style={{ borderBottom: i<job.equipment.length-1?"1px solid var(--border)":"none", paddingBottom:i<job.equipment.length-1?10:0, marginBottom:i<job.equipment.length-1?10:0 }}>
                    <div style={{ fontSize:15, fontWeight:600, marginBottom:3 }}>{eq.name}</div>
                    <div style={{ fontSize:12, color:"var(--text3)", fontFamily:"var(--mono)" }}>Model: {eq.model}</div>
                    <div style={{ fontSize:12, color:"var(--text3)", fontFamily:"var(--mono)" }}>S/N: {eq.serial}</div>
                  </div>
                ))}
              </Card>
            )}
          </div>
        )}

        {tab==="notes" && (
          <div className="fade-in">
            <SectionLabel>Job Notes</SectionLabel>
            <textarea
              value={noteText}
              onChange={e=>setNoteText(e.target.value)}
              placeholder="Add notes about the work performed, parts used, findings, anything the office should know…"
              style={{
                width:"100%", minHeight:180, padding:"14px 16px",
                background:"var(--card)", border:"1px solid var(--border)",
                borderRadius:14, color:"var(--text1)", fontSize:15,
                lineHeight:1.6, resize:"none", outline:"none",
                transition:"border-color .15s",
              }}
              onFocus={e=>e.target.style.borderColor="var(--blue)"}
              onBlur={e=>e.target.style.borderColor="var(--border)"}
            />
            <div style={{ marginTop:10 }}>
              <BigBtn onClick={saveNote} color="var(--blue)" icon={savingNote?"⏳":"💾"} disabled={savingNote}>
                {savingNote ? "Saving…" : "Save Notes"}
              </BigBtn>
            </div>

            {job.notes && noteText===job.notes && (
              <Card style={{ marginTop:16, padding:"14px 16px" }}>
                <SectionLabel>Saved</SectionLabel>
                <div style={{ fontSize:14, color:"var(--text2)", lineHeight:1.6, fontStyle:"italic" }}>"{job.notes}"</div>
              </Card>
            )}
          </div>
        )}

        {tab==="photos" && (
          <div className="fade-in">
            <div style={{ marginBottom:16 }}>
              <BigBtn onClick={addPhoto} color="var(--blue)" icon="📷">
                Take / Add Photo
              </BigBtn>
            </div>

            {job.photos?.length>0 ? (
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                {job.photos.map((photo,i)=>(
                  <div key={photo.id} className="fade-up" style={{ borderRadius:12, overflow:"hidden", border:"1px solid var(--border)", animationDelay:`${i*0.06}s` }}>
                    <img src={photo.url} alt={photo.caption} style={{ width:"100%", aspectRatio:"4/3", objectFit:"cover", display:"block" }} />
                    <div style={{ padding:"8px 10px", background:"var(--card)" }}>
                      <div style={{ fontSize:11, color:"var(--text3)", fontFamily:"var(--mono)" }}>
                        {new Date(photo.taken_at).toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit"})}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign:"center", padding:"48px 20px", color:"var(--text3)" }}>
                <div style={{ fontSize:48, marginBottom:12 }}>📷</div>
                <div style={{ fontSize:16, fontFamily:"var(--display)", fontWeight:700, marginBottom:6 }}>No photos yet</div>
                <div style={{ fontSize:13 }}>Document your work — before & after shots</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Signature CTA for in-progress */}
      {job.status==="in_progress" && (
        <div style={{ position:"fixed", bottom:80, left:0, right:0, maxWidth:430, margin:"0 auto", padding:"0 16px" }}>
          <button onClick={()=>setScreen("signature")} className="tap-scale" style={{
            width:"100%", padding:"15px", background:"var(--green-lt)",
            border:"1px solid var(--green)40", borderRadius:14,
            color:"var(--green)", fontSize:15, fontWeight:800,
            fontFamily:"var(--display)", letterSpacing:"0.04em",
            display:"flex", alignItems:"center", justifyContent:"center", gap:10,
            cursor:"pointer",
          }}>
            <span style={{fontSize:20}}>✍️</span> Collect Customer Signature
          </button>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
//  SIGNATURE SCREEN
// ════════════════════════════════════════════════════════════════
function SignatureScreen() {
  const { currentJob, updateJob, setScreen } = useApp();
  const canvasRef = useRef(null);
  const [drawing, setDrawing] = useState(false);
  const [hasSig, setHasSig] = useState(false);
  const [saved, setSaved] = useState(false);
  const lastPos = useRef(null);

  function getPos(e, canvas) {
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches?.[0] || e;
    return { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
  }

  function startDraw(e) {
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const pos = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    lastPos.current = pos;
    setDrawing(true);
    setHasSig(true);
  }

  function draw(e) {
    e.preventDefault();
    if (!drawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const pos = getPos(e, canvas);
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#F0F2F7";
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    lastPos.current = pos;
  }

  function endDraw(e) { e.preventDefault(); setDrawing(false); }

  function clearSig() {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0,0,canvas.width,canvas.height);
    setHasSig(false);
  }

  function saveSig() {
    const canvas = canvasRef.current;
    const sig = canvas.toDataURL("image/png");
    updateJob(currentJob.id, { customer_signature:sig, status:"completed" });
    setSaved(true);
    setTimeout(()=>setScreen("home"),1800);
  }

  if (saved) return (
    <div style={{ minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:16, padding:32 }}>
      <div style={{ fontSize:80, animation:"checkIn .5s cubic-bezier(.22,1,.36,1) both" }}>✅</div>
      <div style={{ fontSize:28, fontFamily:"var(--display)", fontWeight:800, textAlign:"center" }}>Job Complete!</div>
      <div style={{ fontSize:15, color:"var(--text2)", textAlign:"center" }}>Signature captured. Returning to jobs…</div>
    </div>
  );

  return (
    <div style={{ minHeight:"100vh", display:"flex", flexDirection:"column", padding:16 }}>
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20, paddingTop:8 }}>
        <button onClick={()=>setScreen("job")} className="tap-scale" style={{ width:36, height:36, borderRadius:10, background:"var(--bg3)", border:"1px solid var(--border)", color:"var(--text2)", fontSize:18, display:"flex", alignItems:"center", justifyContent:"center" }}>←</button>
        <div>
          <div style={{ fontSize:20, fontWeight:800, fontFamily:"var(--display)" }}>Customer Signature</div>
          <div style={{ fontSize:13, color:"var(--text3)" }}>{currentJob?.job_number} · {currentJob?.customer_name}</div>
        </div>
      </div>

      <Card style={{ padding:"16px 18px", marginBottom:16 }}>
        <div style={{ fontSize:14, color:"var(--text2)", lineHeight:1.6 }}>
          By signing below, <strong style={{color:"var(--text1)"}}>{currentJob?.customer_name}</strong> confirms the work described in <strong style={{color:"var(--text1)"}}>{currentJob?.job_number}</strong> has been completed to their satisfaction.
        </div>
      </Card>

      {/* Canvas */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", marginBottom:16 }}>
        <div style={{ fontSize:12, color:"var(--text3)", marginBottom:8, textAlign:"center" }}>Sign in the box below</div>
        <div style={{ flex:1, background:"var(--card)", border:"2px dashed var(--border2)", borderRadius:16, overflow:"hidden", position:"relative", minHeight:220 }}>
          <canvas ref={canvasRef} width={390} height={280}
            style={{ display:"block", width:"100%", height:"100%", touchAction:"none" }}
            onMouseDown={startDraw} onMouseMove={draw} onMouseUp={endDraw} onMouseLeave={endDraw}
            onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={endDraw}
          />
          {!hasSig && (
            <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", pointerEvents:"none" }}>
              <div style={{ textAlign:"center", color:"var(--text3)" }}>
                <div style={{ fontSize:32, marginBottom:8 }}>✍️</div>
                <div style={{ fontSize:14 }}>Sign here</div>
              </div>
            </div>
          )}
        </div>
        {hasSig && (
          <button onClick={clearSig} className="tap-scale" style={{ alignSelf:"flex-end", marginTop:8, padding:"6px 14px", background:"none", border:"1px solid var(--border)", borderRadius:8, color:"var(--text3)", fontSize:13 }}>
            Clear
          </button>
        )}
      </div>

      <BigBtn onClick={saveSig} color="var(--green)" icon="✅" disabled={!hasSig} sx={{ background:hasSig?"var(--green-lt)":"var(--bg3)" }}>
        Complete Job & Save Signature
      </BigBtn>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
//  PROFILE TAB
// ════════════════════════════════════════════════════════════════
function ProfileScreen({ onLogout }) {
  const { jobs } = useApp();
  const completed = jobs.filter(j=>j.status==="completed").length;
  const active = jobs.filter(j=>["in_progress","en_route"].includes(j.status)).length;

  return (
    <div style={{ padding:"16px 16px 80px" }}>
      <div className="fade-up" style={{ paddingTop:8, marginBottom:24 }}>
        <div style={{ fontSize:12, color:"var(--text3)", marginBottom:2 }}>Account</div>
        <div style={{ fontSize:28, fontFamily:"var(--display)", fontWeight:800 }}>Profile</div>
      </div>

      {/* Avatar card */}
      <Card className="fade-up s1" style={{ padding:"20px 18px", marginBottom:16, display:"flex", alignItems:"center", gap:16 }}>
        <div style={{ width:60, height:60, borderRadius:"50%", background:"var(--blue-lt)", border:"2px solid var(--blue)40", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, fontWeight:800, color:"var(--blue)", fontFamily:"var(--display)", flexShrink:0 }}>
          {TECH.avatar}
        </div>
        <div>
          <div style={{ fontSize:20, fontWeight:800, fontFamily:"var(--display)", marginBottom:2 }}>{TECH.name}</div>
          <div style={{ fontSize:13, color:"var(--text2)", marginBottom:2 }}>Technician · {TECH.company}</div>
          <div style={{ fontSize:12, color:"var(--blue)", fontFamily:"var(--mono)" }}>mike@acmehvac.com</div>
        </div>
      </Card>

      {/* Today's stats */}
      <Card className="fade-up s2" style={{ padding:"16px 18px", marginBottom:16 }}>
        <SectionLabel>Today's Summary</SectionLabel>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10 }}>
          {[
            { label:"Total", val:jobs.length, color:"var(--text1)" },
            { label:"Active", val:active, color:"var(--amber)" },
            { label:"Done", val:completed, color:"var(--green)" },
          ].map((s,i)=>(
            <div key={i} style={{ textAlign:"center", padding:"12px 8px", background:"var(--bg3)", borderRadius:10 }}>
              <div style={{ fontSize:28, fontWeight:800, fontFamily:"var(--display)", color:s.color, lineHeight:1 }}>{s.val}</div>
              <div style={{ fontSize:11, color:"var(--text3)", marginTop:4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Settings list */}
      <Card className="fade-up s3" style={{ marginBottom:16, overflow:"hidden" }}>
        {[
          { icon:"🔔", label:"Notifications", val:"On" },
          { icon:"📍", label:"Location sharing", val:"On" },
          { icon:"📱", label:"App version", val:"1.0.0 (PWA)" },
        ].map((item,i,arr)=>(
          <div key={i} style={{ display:"flex", alignItems:"center", gap:14, padding:"15px 18px", borderBottom:i<arr.length-1?"1px solid var(--border)":"none" }}>
            <span style={{ fontSize:20 }}>{item.icon}</span>
            <span style={{ flex:1, fontSize:15, fontWeight:500 }}>{item.label}</span>
            <span style={{ fontSize:13, color:"var(--text3)" }}>{item.val}</span>
            <span style={{ color:"var(--text3)", fontSize:16 }}>›</span>
          </div>
        ))}
      </Card>

      <button onClick={onLogout} className="tap-scale" style={{
        width:"100%", padding:"16px", background:"var(--red-lt)",
        border:"1px solid var(--red)40", borderRadius:14,
        color:"var(--red)", fontSize:16, fontWeight:800,
        fontFamily:"var(--display)", cursor:"pointer",
        display:"flex", alignItems:"center", justifyContent:"center", gap:10,
      }}>
        <span>🚪</span> Sign Out
      </button>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
//  BOTTOM TAB BAR
// ════════════════════════════════════════════════════════════════
function TabBar({ tab, setTab }) {
  const TABS = [
    { id:"home",    icon:"⊞",  label:"Jobs" },
    { id:"profile", icon:"👤", label:"Profile" },
  ];
  return (
    <div style={{
      position:"fixed", bottom:0, left:0, right:0, maxWidth:430, margin:"0 auto",
      height:"var(--tab-h)", background:"var(--bg2)", borderTop:"1px solid var(--border)",
      display:"flex", alignItems:"center", zIndex:50,
      paddingBottom:"env(safe-area-inset-bottom)",
    }}>
      {TABS.map(t=>{
        const active = tab===t.id;
        return (
          <button key={t.id} onClick={()=>setTab(t.id)} style={{
            flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:3,
            padding:"8px 0", background:"none", border:"none", cursor:"pointer",
          }}>
            <span style={{ fontSize:22, lineHeight:1 }}>{t.icon}</span>
            <span style={{ fontSize:10, fontWeight:700, fontFamily:"var(--display)", letterSpacing:"0.05em", textTransform:"uppercase", color: active ? "var(--blue)" : "var(--text3)", transition:"color .12s" }}>
              {t.label}
            </span>
            {active && <div style={{ width:20, height:2, background:"var(--blue)", borderRadius:1 }} />}
          </button>
        );
      })}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
//  ROOT APP
// ════════════════════════════════════════════════════════════════
export default function TechApp() {
  const [authed, setAuthed] = useState(false);
  const [tab, setTab] = useState("home");
  const [screen, setScreen] = useState("home"); // home | job | signature
  const [jobs, setJobs] = useState(INITIAL_JOBS);
  const [currentJob, setCurrentJob] = useState(null);

  function updateJob(id, updates) {
    setJobs(prev => prev.map(j => j.id===id ? {...j,...updates} : j));
    if (currentJob?.id===id) setCurrentJob(prev => ({...prev,...updates}));
  }

  function handleSetCurrentJob(job) {
    setCurrentJob(job);
    setScreen("job");
  }

  const ctx = { jobs, updateJob, currentJob, setCurrentJob:handleSetCurrentJob, screen, setScreen };

  if (!authed) return (
    <>
      <style>{CSS}</style>
      <LoginScreen onLogin={()=>setAuthed(true)} />
    </>
  );

  // Non-tab full screens
  if (screen==="job") return (
    <>
      <style>{CSS}</style>
      <AppCtx.Provider value={ctx}>
        <JobDetailScreen />
      </AppCtx.Provider>
    </>
  );

  if (screen==="signature") return (
    <>
      <style>{CSS}</style>
      <AppCtx.Provider value={ctx}>
        <SignatureScreen />
      </AppCtx.Provider>
    </>
  );

  return (
    <>
      <style>{CSS}</style>
      <AppCtx.Provider value={ctx}>
        <div style={{ minHeight:"100vh" }}>
          {tab==="home"    && <JobListScreen />}
          {tab==="profile" && <ProfileScreen onLogout={()=>setAuthed(false)} />}
          <TabBar tab={tab} setTab={t=>{setTab(t);setScreen("home");}} />
        </div>
      </AppCtx.Provider>
    </>
  );
}
