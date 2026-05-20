// ═══════════════════════════════════════════════════════════════════
// SCHEDULING OVERHAUL PATCH — Drop-in replacements for FieldOpsApp.jsx
// 
// INSTRUCTIONS: Replace these 3 sections in your FieldOpsApp.jsx:
//   1. NewJobModal          → removes end time, cleans up scheduling UI
//   2. ScheduleJobModal     → NEW component (add before JobsScreen)
//   3. JobsScreen           → adds Schedule/Reschedule buttons + time display
// ═══════════════════════════════════════════════════════════════════


// ─── 1. REPLACE NewJobModal ──────────────────────────────────────────
// Find: `function NewJobModal({ onClose, onSave }) {`
// Replace the entire function with this:

function NewJobModal({ onClose, onSave }) {
  const [customers, setCustomers] = useState([]);
  const [form, setForm] = useState({ customer_id:"", location_id:"", title:"", description:"", priority:"normal", scheduled_start:"" });
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
      if(form.scheduled_start) payload.scheduled_start=new Date(form.scheduled_start).toISOString();
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
        <FormField label="Scheduled Time (optional)">
          <input style={inputStyle} type="datetime-local" value={form.scheduled_start} onChange={e=>setForm(p=>({...p,scheduled_start:e.target.value}))} />
        </FormField>
      </div>
      <div style={{ padding:"16px 24px",borderTop:"1px solid var(--border)",display:"flex",justifyContent:"flex-end",gap:10 }}><Btn variant="secondary" onClick={onClose}>Cancel</Btn><Btn onClick={handleSave}>Create Job</Btn></div>
    </Modal>
  );
}


// ─── 2. ADD ScheduleJobModal (NEW — paste before JobsScreen) ─────────
// This is a brand new component. Add it right before `function JobsScreen() {`

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
}


// ─── 3. REPLACE JobsScreen ───────────────────────────────────────────
// Find: `function JobsScreen() {`
// Replace the entire function with this:

function JobsScreen() {
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
              return (
                <Card key={job.id} style={{ padding:"14px 18px" }}>
                  <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8 }}>
                    <div>
                      <div style={{ fontSize:11,fontFamily:"var(--mono)",color:"var(--text3)",marginBottom:3 }}>{job.job_number}</div>
                      <div style={{ fontSize:16,fontWeight:700,fontFamily:"var(--display)" }}>{job.title}</div>
                    </div>
                    <Chip status={job.status} />
                  </div>

                  <div style={{ display:"flex",gap:16,fontSize:13,color:"var(--text2)",flexWrap:"wrap",marginBottom:10 }}>
                    <span>👤 {job.customer_name}</span>
                    <span style={{ cursor:"pointer",color:"var(--blue)" }} onClick={e=>{e.stopPropagation();window.open(`https://maps.google.com/?q=${encodeURIComponent(job.address_line1?`${job.address_line1}, ${job.city}, ${job.state}`:`${job.city}, ${job.state}`)}`)}}>
                      📍 {job.address_line1?`${job.address_line1}, ${job.city}, ${job.state}`:`${job.city}, ${job.state}`}
                    </span>
                  </div>

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
