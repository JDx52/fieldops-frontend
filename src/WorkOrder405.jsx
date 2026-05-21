import { useState, useRef, useEffect } from "react";
import { loadPricebook, CATEGORIES } from "./Pricebook";

function SignaturePad({ value, onChange }) {
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const lastPos = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (value) {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0);
      img.src = value;
    }
  }, []);

  function getPos(e, canvas) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const src = e.touches ? e.touches[0] : e;
    return { x: (src.clientX - rect.left) * scaleX, y: (src.clientY - rect.top) * scaleY };
  }

  function startDraw(e) { e.preventDefault(); drawing.current = true; lastPos.current = getPos(e, canvasRef.current); }
  function draw(e) {
    e.preventDefault();
    if (!drawing.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const pos = getPos(e, canvas);
    ctx.beginPath(); ctx.moveTo(lastPos.current.x, lastPos.current.y); ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = "#1a3a6b"; ctx.lineWidth = 2.5; ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.stroke();
    lastPos.current = pos;
  }
  function stopDraw() { if (!drawing.current) return; drawing.current = false; onChange(canvasRef.current.toDataURL()); }
  function clear() {
    const canvas = canvasRef.current; const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, canvas.width, canvas.height); onChange("");
  }

  return (
    <div>
      <div style={{ position: "relative", border: "1.5px solid #1a3a6b", borderRadius: 4, background: "#fff", touchAction: "none" }}>
        <canvas ref={canvasRef} width={500} height={120}
          style={{ display: "block", width: "100%", height: 120, cursor: "crosshair", borderRadius: 4 }}
          onMouseDown={startDraw} onMouseMove={draw} onMouseUp={stopDraw} onMouseLeave={stopDraw}
          onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={stopDraw} />
        {!value && <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", fontSize: 12, color: "#aaa", pointerEvents: "none", whiteSpace: "nowrap" }}>Sign here</div>}
      </div>
      <button onClick={clear} style={{ marginTop: 4, fontSize: 10, color: "#e03030", background: "none", border: "none", cursor: "pointer", padding: 0 }}>✕ Clear</button>
    </div>
  );
}

const LOGO_B64 = "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";

const CHECKLIST_ITEMS = [
  ["CLEAN CONDENSER", "CHECK RELAY", "CHECK HI-LO CONTROL", "PUNCH CONDENSER TUBES"],
  ["PRESSURE WASH COIL", "CHECK REF. CHARGE", "CLEAN EVAP. COIL", "BACKFLUSH CONDENSER"],
  ["CHECK BELT & PULLEY", "CHECK ELECTRICAL", "CHECK FAN MOTOR", "CHECK & CLEAN STRAINER"],
  ["CHECK COND. FAN MOTOR", "CLEAN DRAIN PAN", "REPLACE FILTERS", ""],
  ["LUBRICATE BEARINGS", "CLEAN MAIN DRAIN", "ADJUST SET POINT", ""],
  ["CHECK CONTACTOR", "CHECK CONDENSATE PUMP", "CHEMICALLY CLEAN COND.", ""],
];

const JOB_TYPES = [
  "PM INSPECTION", "AFTER HOURS EMERGENCY SERVICE", "CONSTRUCTION",
  "FOLLOW UP", "SERVICE CALL", "START UP", "SHUT DOWN", "MISCELLANEOUS"
];

const SERVICE_TYPES = ["REGULAR", "WARRANTY", "SERVICE CONTRACT"];

function PricebookPicker({ onClose, onSelect }) {
  const allItems = loadPricebook();
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState("all");
  const filtered = allItems.filter(i => cat === "all" || i.category === cat).filter(i => !search || i.name.toLowerCase().includes(search.toLowerCase()));
  const inp = { width: "100%", padding: "8px 12px", borderRadius: 7, fontSize: 13, border: "1px solid #E4E8EF", outline: "none", fontFamily: "inherit", boxSizing: "border-box" };
  return (
    <div style={{ position: "fixed", inset: 0, background: "#00000070", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 540, maxHeight: "80vh", display: "flex", flexDirection: "column", boxShadow: "0 24px 64px #00000040" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #E4E8EF", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div><div style={{ fontSize: 17, fontWeight: 700 }}>Pricebook</div><div style={{ fontSize: 12, color: "#8A94A6", marginTop: 2 }}>Tap an item to add it to materials</div></div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 22, color: "#8A94A6", cursor: "pointer" }}>×</button>
        </div>
        <div style={{ padding: "12px 20px", borderBottom: "1px solid #E4E8EF", display: "flex", gap: 8 }}>
          <div style={{ position: "relative", flex: 1 }}>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…" style={{ ...inp, paddingLeft: 26 }} autoFocus />
            <span style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", color: "#8A94A6", fontSize: 13 }}>⌕</span>
          </div>
          <select value={cat} onChange={e => setCat(e.target.value)} style={{ ...inp, width: "auto" }}>
            <option value="all">All</option>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
          {allItems.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 20px", color: "#8A94A6" }}><div style={{ fontSize: 36, marginBottom: 10 }}>📋</div><div style={{ fontWeight: 700, marginBottom: 6 }}>Pricebook is empty</div><div style={{ fontSize: 13 }}>Add items in the Pricebook screen first</div></div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 20px", color: "#8A94A6", fontSize: 13 }}>No items match your search</div>
          ) : filtered.map(item => (
            <div key={item.id} onClick={() => onSelect(item)}
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 20px", cursor: "pointer", borderBottom: "1px solid #F1F3F7", transition: "background .1s" }}
              onMouseEnter={e => e.currentTarget.style.background = "#F8F9FB"} onMouseLeave={e => e.currentTarget.style.background = ""}>
              <div><div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>{item.name}</div><div style={{ fontSize: 11, color: "#8A94A6" }}>{item.category}{item.description ? ` · ${item.description}` : ""}</div></div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#0D7B4E", flexShrink: 0, marginLeft: 16 }}>${parseFloat(item.price).toFixed(2)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function WorkOrder405({ prefill, onSave, readOnly }) {
  const savedData = readOnly || null;
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => { const h = () => setIsMobile(window.innerWidth < 768); window.addEventListener('resize', h); return () => window.removeEventListener('resize', h); }, []);

  function generateWO() {
    const API = process.env.REACT_APP_API_URL || "https://fieldops-api-production-b341.up.railway.app/v1";
    const token = localStorage.getItem("fieldops_token");
    return fetch(`${API}/work-orders?limit=200`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => {
        const list = Array.isArray(d.data) ? d.data : [];
        let max = 0;
        list.forEach(w => { const n = parseInt((w.wo_number || "").replace(/\D/g, "")); if (!isNaN(n) && n > max) max = n; });
        return `WO-${String(max + 1).padStart(4, "0")}`;
      })
      .catch(() => `WO-${String(Date.now()).slice(-4)}`);
  }

  const [users, setUsers] = useState([]);
  const [customers, setCustomers] = useState([]);

  useEffect(() => {
    const API = process.env.REACT_APP_API_URL || "https://fieldops-api-production-b341.up.railway.app/v1";
    const hdrs = { Authorization: `Bearer ${localStorage.getItem("fieldops_token")}` };
    fetch(`${API}/users?limit=100`, { headers: hdrs }).then(r => r.json()).then(d => setUsers(Array.isArray(d.data) ? d.data : [])).catch(() => {});
    fetch(`${API}/customers?limit=100`, { headers: hdrs }).then(r => r.json()).then(d => setCustomers(Array.isArray(d.data) ? d.data : [])).catch(() => {});
  }, []);

  const [form, setForm] = useState({
    wo: savedData?.wo || "", date: savedData?.date || new Date().toISOString().slice(0, 10),
    customer: savedData?.customer || prefill?.customer || "", billingAddress: savedData?.billingAddress || prefill?.billingAddress || "",
    phone: savedData?.phone || prefill?.phone || "", cell: savedData?.cell || prefill?.cell || "", email: savedData?.email || prefill?.email || "",
    complaint: savedData?.complaint || prefill?.complaint || "", workedBy: savedData?.workedBy || prefill?.workedBy || "",
    unitAddress: savedData?.unitAddress || prefill?.unitAddress || prefill?.billingAddress || "",
    unitPhone: savedData?.unitPhone || "", unitCell: savedData?.unitCell || "",
    jobId: prefill?.jobId || savedData?.jobId || "",
    customerId: prefill?.customerId || savedData?.customerId || "",
    jobTypes: savedData?.jobTypes || [],
    equipment: savedData?.equipment || [{ make: "", model: "", serial: "", location: "", area: "" }],
    technician: savedData?.technician || "", timeIn: savedData?.timeIn || "8:00 AM", timeOut: savedData?.timeOut || "",
    travelTime: savedData?.travelTime || "", regHrs: savedData?.regHrs || "", otHrs: savedData?.otHrs || "",
    rate: savedData?.rate || "", amount: savedData?.amount || "",
    checklist: savedData?.checklist || [],
    descriptionOfWork: savedData?.descriptionOfWork || "",
    recommendations: savedData?.recommendations || "",
    materials: savedData?.materials || Array(8).fill(null).map(() => ({ qty: "", description: "", unitPrice: "", amount: "" })),
    serviceType: savedData?.serviceType || [],
    totalAmount: savedData?.totalAmount || "",
    printName: savedData?.printName || "", signature: savedData?.signature || "", signDate: savedData?.signDate || "",
  });

  const isReadOnly = !!readOnly;

  useEffect(() => { if (!isReadOnly && !savedData?.wo) { generateWO().then(wo => setForm(p => ({ ...p, wo }))); } }, []);
  useEffect(() => {
    if (prefill && !readOnly) {
      setForm(p => ({ ...p, customer: prefill.customer || "", billingAddress: prefill.billingAddress || "", phone: prefill.phone || "", cell: prefill.cell || "", email: prefill.email || "", complaint: prefill.complaint || "", workedBy: prefill.workedBy || "", unitAddress: prefill.unitAddress || prefill.billingAddress || "", jobId: prefill.jobId || p.jobId || "", customerId: prefill.customerId || p.customerId || "" }));
    }
  }, [prefill]);

  const [submitted, setSubmitted] = useState(false);
  const [showPricebook, setShowPricebook] = useState(false);

  function set(key, val) { setForm(p => ({ ...p, [key]: val })); }
  function toggleJobType(t) { set("jobTypes", form.jobTypes.includes(t) ? form.jobTypes.filter(x => x !== t) : [...form.jobTypes, t]); }
  function toggleChecklist(item) { set("checklist", form.checklist.includes(item) ? form.checklist.filter(x => x !== item) : [...form.checklist, item]); }
  function toggleServiceType(t) { set("serviceType", form.serviceType.includes(t) ? form.serviceType.filter(x => x !== t) : [...form.serviceType, t]); }
  function updateEquipment(i, key, val) { const eq = [...form.equipment]; eq[i] = { ...eq[i], [key]: val }; set("equipment", eq); }
  function updateMaterial(i, key, val) {
    const mats = [...form.materials]; mats[i] = { ...mats[i], [key]: val };
    const qty = parseFloat(key === "qty" ? val : mats[i].qty) || 0;
    const price = parseFloat(key === "unitPrice" ? val : mats[i].unitPrice) || 0;
    mats[i].amount = (qty * price).toFixed(2);
    const total = mats.reduce((sum, m) => sum + (parseFloat(m.amount) || 0), 0);
    setForm(p => ({ ...p, materials: mats, totalAmount: total.toFixed(2) }));
  }

  function resetForm() {
    generateWO().then(wo => setForm({ wo, date: new Date().toISOString().slice(0, 10), customer: "", billingAddress: "", phone: "", cell: "", email: "", complaint: "", workedBy: "", unitAddress: "", unitPhone: "", unitCell: "", jobTypes: [], equipment: [{ make: "", model: "", serial: "", location: "", area: "" }], technician: "", timeIn: "8:00 AM", timeOut: "", travelTime: "", regHrs: "", otHrs: "", rate: "", amount: "", checklist: [], descriptionOfWork: "", recommendations: "", materials: Array(8).fill(null).map(() => ({ qty: "", description: "", unitPrice: "", amount: "" })), serviceType: [], totalAmount: "", printName: "", signature: "", signDate: "" }));
    setSubmitted(false);
  }

  // ── STYLES ──
  const s = {
    // FIX: increased font sizes and darkened text for readability
    label: { fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "#1a3a6b", display: "block", marginBottom: 3 },
    input: { width: "100%", border: "none", borderBottom: "1.5px solid #1a3a6b", outline: "none", fontSize: 13, padding: "3px 0", background: "transparent", fontFamily: "inherit", boxSizing: "border-box", color: "#111" },
    cell: { padding: "4px 6px", verticalAlign: "top" },
    th: { background: "#1a3a6b", color: "#fff", fontSize: 10, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", padding: "6px 8px", textAlign: "left" },
    section: { borderTop: "2px solid #1a3a6b", marginTop: 12, paddingTop: 8 },
    // FIX: checkItem now uses larger font and dark color
    checkItem: { display: "flex", alignItems: "center", gap: 8, cursor: "pointer", marginBottom: 5, padding: "2px 0" },
    checkLabel: { fontSize: 12, fontWeight: 600, color: "#111", userSelect: "none", lineHeight: 1.3 },
    checkbox: { width: 15, height: 15, accentColor: "#1a3a6b", flexShrink: 0, cursor: "pointer" },
    sectionHeader: { background: "#1a3a6b", color: "#fff", fontSize: 11, fontWeight: 700, letterSpacing: "0.07em", padding: "5px 10px", marginBottom: 8, textTransform: "uppercase", borderRadius: 3 },
  };

  if (submitted && !isReadOnly) {
    return (
      <div style={{ flex: 1, background: "#f0f4f8", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ background: "#fff", borderRadius: 16, padding: 48, textAlign: "center", maxWidth: 480, boxShadow: "0 4px 32px #0002" }}>
          <h2 style={{ fontSize: 22, marginBottom: 12, color: "#1a3a6b" }}>Work Order Submitted</h2>
          <p style={{ color: "#555", marginBottom: 8 }}>WO# <strong>{form.wo || "—"}</strong></p>
          <p style={{ color: "#555", marginBottom: 24 }}>Customer: {form.customer || "—"}</p>
          <button onClick={resetForm} style={{ background: "#1a3a6b", color: "#fff", border: "none", borderRadius: 8, padding: "12px 32px", fontSize: 15, cursor: "pointer", fontWeight: 600 }}>New Work Order</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, overflowY: "auto", background: "#e8edf2", fontFamily: "'Arial', sans-serif" }}>
      <div style={{ maxWidth: 900, margin: "0 auto", background: "#fff", border: "2px solid #1a3a6b", boxShadow: "0 8px 40px #0003", minHeight: "100%" }}>

        {/* HEADER */}
        <div style={{ display: "flex", alignItems: "center", padding: "10px 16px", borderBottom: "2px solid #1a3a6b", gap: 16, background: "#fff" }}>
          <div style={{ flexShrink: 0 }}>
            <img src={`data:image/png;base64,${LOGO_B64}`} alt="405 Heating & Air Conditioning" style={{ height: 72, width: "auto", display: "block" }} />
          </div>
          <div style={{ flex: 1, textAlign: "center" }}>
            <div style={{ fontWeight: 900, fontSize: 18, color: "#1a3a6b", letterSpacing: "-0.02em" }}>405 Heating and Air Conditioning</div>
            <div style={{ fontSize: 11, color: "#444" }}>426 West Boomer Street · Lexington, Oklahoma 73051</div>
            <div style={{ fontSize: 11, color: "#444" }}>405-215-7685</div>
            <div style={{ fontSize: 10, color: "#888" }}>Service, Maintenance, Installation</div>
          </div>
          <div style={{ flexShrink: 0, textAlign: "right" }}>
            <div style={{ fontSize: 10, color: "#666", marginBottom: 2 }}>WO #</div>
            <div style={{ minWidth: 110, border: "2px solid #1a3a6b", borderRadius: 4, fontSize: 16, fontWeight: 900, textAlign: "center", color: "#1a3a6b", padding: "5px 8px", background: "#f0f4f8", fontFamily: "monospace" }}>{form.wo}</div>
          </div>
        </div>

        <div style={{ padding: "10px 16px" }}>

          {/* JOB TYPE — FIX: dark text, larger font */}
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 4, marginBottom: 12, border: "1.5px solid #1a3a6b", padding: "8px 12px", borderRadius: 6, background: "#f8f9fb" }}>
            <div style={{ gridColumn: "1/-1", fontSize: 10, fontWeight: 700, color: "#1a3a6b", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Job Type</div>
            {JOB_TYPES.map(t => (
              <label key={t} style={s.checkItem}>
                <input type="checkbox" style={s.checkbox} checked={form.jobTypes.includes(t)} onChange={() => toggleJobType(t)} />
                <span style={s.checkLabel}>{t}</span>
              </label>
            ))}
          </div>

          {/* CUSTOMER INFO */}
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 10 }}>
            <div>
              <label style={s.label}>Customer</label>
              {customers.length > 0 && !prefill?.customer ? (
                <select style={{ ...s.input, background: "transparent" }} value={form.customer} onChange={e => {
                  const c = customers.find(x => `${x.first_name} ${x.last_name}` === e.target.value);
                  set("customer", e.target.value);
                  if (c) { if (c.phone) set("phone", c.phone); if (c.email) set("email", c.email); }
                }}>
                  <option value="">Select customer…</option>
                  {customers.map(c => <option key={c.id}>{c.first_name} {c.last_name}</option>)}
                </select>
              ) : (
                <input style={s.input} value={form.customer} onChange={e => set("customer", e.target.value)} placeholder="Full name" />
              )}
            </div>
            <div>
              <label style={s.label}>Date</label>
              <input type="date" style={s.input} value={form.date} onChange={e => set("date", e.target.value)} />
            </div>
            <div style={{ gridColumn: "1/-1" }}>
              <label style={s.label}>Billing Address</label>
              <input style={s.input} value={form.billingAddress} onChange={e => set("billingAddress", e.target.value)} placeholder="Street, City, State, ZIP" />
            </div>
            <div><label style={s.label}>Phone</label><input style={s.input} value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="405-555-0100" /></div>
            <div><label style={s.label}>Cell</label><input style={s.input} value={form.cell} onChange={e => set("cell", e.target.value)} placeholder="405-555-0101" /></div>
            <div style={{ gridColumn: "1/-1" }}><label style={s.label}>Email</label><input type="email" style={s.input} value={form.email} onChange={e => set("email", e.target.value)} placeholder="customer@email.com" /></div>
            <div style={{ gridColumn: "1/-1" }}><label style={s.label}>Complaint</label><input style={s.input} value={form.complaint} onChange={e => set("complaint", e.target.value)} placeholder="Describe the issue" /></div>
            <div><label style={s.label}>Work Ordered By</label><input style={s.input} value={form.workedBy} onChange={e => set("workedBy", e.target.value)} /></div>
            <div><label style={s.label}>Address of Unit</label><input style={s.input} value={form.unitAddress} onChange={e => set("unitAddress", e.target.value)} /></div>
            <div><label style={s.label}>Unit Phone</label><input style={s.input} value={form.unitPhone} onChange={e => set("unitPhone", e.target.value)} /></div>
            <div><label style={s.label}>Unit Cell</label><input style={s.input} value={form.unitCell} onChange={e => set("unitCell", e.target.value)} /></div>
          </div>

          {/* EQUIPMENT */}
          <div style={s.section}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead><tr>{["Make", "Model No.", "Serial No.", "Location of Unit", "Area Served"].map(h => <th key={h} style={s.th}>{h}</th>)}</tr></thead>
              <tbody>
                {form.equipment.map((eq, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #ddd" }}>
                    {["make", "model", "serial", "location", "area"].map(k => (
                      <td key={k} style={s.cell}><input style={s.input} value={eq[k]} onChange={e => updateEquipment(i, k, e.target.value)} /></td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <button onClick={() => set("equipment", [...form.equipment, { make: "", model: "", serial: "", location: "", area: "" }])}
              style={{ marginTop: 6, fontSize: 11, color: "#1a3a6b", background: "none", border: "1px dashed #1a3a6b", borderRadius: 4, padding: "3px 10px", cursor: "pointer" }}>
              + Add Unit
            </button>
          </div>

          {/* LABOR */}
          <div style={s.section}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr><th style={{ ...s.th, background: "#222" }} colSpan={8}>LABOR</th></tr>
                <tr>{["Technician", "Time In", "Time Out", "Travel Time", "Reg/Hrs", "OT/Hrs", "Rate", "Amount"].map(h => <th key={h} style={s.th}>{h}</th>)}</tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: "1px solid #ddd" }}>
                  <td style={s.cell}>
                    {users.length > 0 ? (
                      <select style={{ ...s.input, background: "transparent" }} value={form.technician} onChange={e => set("technician", e.target.value)}>
                        <option value="">Select tech…</option>
                        {users.map(u => <option key={u.id}>{u.name}</option>)}
                      </select>
                    ) : (
                      <input style={s.input} value={form.technician} onChange={e => set("technician", e.target.value)} />
                    )}
                  </td>
                  {[["timeIn", "8:00 AM"], ["timeOut", ""], ["travelTime", ""], ["regHrs", ""], ["otHrs", ""], ["rate", ""], ["amount", ""]].map(([k, ph]) => (
                    <td key={k} style={s.cell}><input style={s.input} value={form[k]} onChange={e => set(k, e.target.value)} placeholder={ph} /></td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>

          {/* CHECKLIST — FIX: white bg, large readable labels */}
          <div style={s.section}>
            <div style={s.sectionHeader}>Service Checklist</div>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: 2, background: "#f8f9fb", padding: "8px 10px", borderRadius: 4, border: "1px solid #dde" }}>
              {CHECKLIST_ITEMS.map((row, ri) => row.map((item, ci) => item ? (
                <label key={`${ri}-${ci}`} style={s.checkItem}>
                  <input type="checkbox" style={s.checkbox} checked={form.checklist.includes(item)} onChange={() => toggleChecklist(item)} />
                  <span style={{ ...s.checkLabel, fontSize: 11 }}>{item}</span>
                </label>
              ) : null))}
            </div>
          </div>

          {/* DESCRIPTION */}
          <div style={s.section}>
            <div style={s.sectionHeader}>Description of Work</div>
            <textarea value={form.descriptionOfWork} onChange={e => set("descriptionOfWork", e.target.value)}
              placeholder="Describe all work performed..."
              style={{ width: "100%", border: "1px solid #ccc", borderRadius: 4, fontSize: 13, padding: 8, fontFamily: "inherit", resize: "vertical", minHeight: 80, boxSizing: "border-box", color: "#111" }} />
          </div>

          {/* RECOMMENDATIONS */}
          <div style={{ marginTop: 8 }}>
            <label style={s.label}>Recommendations</label>
            <textarea value={form.recommendations} onChange={e => set("recommendations", e.target.value)}
              style={{ width: "100%", border: "1px solid #ccc", borderRadius: 4, fontSize: 13, padding: 8, fontFamily: "inherit", resize: "vertical", minHeight: 50, boxSizing: "border-box", color: "#111" }} />
          </div>

          {/* PRICEBOOK MODAL */}
          {showPricebook && !isReadOnly && (
            <PricebookPicker onClose={() => setShowPricebook(false)} onSelect={item => {
              const mats = [...form.materials];
              const emptyIdx = mats.findIndex(m => !m.description && !m.qty);
              const idx = emptyIdx >= 0 ? emptyIdx : mats.length;
              const newRow = { qty: "1", description: item.name, unitPrice: String(item.price), amount: String(item.price) };
              if (idx >= mats.length) mats.push(newRow); else mats[idx] = newRow;
              const total = mats.reduce((sum, m) => sum + (parseFloat(m.amount) || 0), 0);
              setForm(p => ({ ...p, materials: mats, totalAmount: total.toFixed(2) }));
              setShowPricebook(false);
            }} />
          )}

          {/* MATERIALS */}
          <div style={s.section}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div style={{ ...s.sectionHeader, margin: 0 }}>Materials</div>
              {!isReadOnly && <button onClick={() => setShowPricebook(true)} style={{ fontSize: 12, background: "#1a3a6b", color: "#fff", border: "none", borderRadius: 6, padding: "5px 14px", cursor: "pointer", fontWeight: 600 }}>📋 Browse Pricebook</button>}
            </div>
            {isMobile ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {form.materials.map((m, i) => (
                  <div key={i} style={{ border: "1px solid #ddd", borderRadius: 8, padding: 10, background: "#fafafa" }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#1a3a6b", marginBottom: 6 }}>Item {i + 1}</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 6 }}>
                      <div><div style={{ fontSize: 9, color: "#888", marginBottom: 2 }}>QTY</div><input style={{ ...s.input, padding: "6px 8px" }} value={m?.qty || ""} onChange={e => updateMaterial(i, "qty", e.target.value)} placeholder="1" /></div>
                      <div><div style={{ fontSize: 9, color: "#888", marginBottom: 2 }}>DESCRIPTION</div><input style={{ ...s.input, padding: "6px 8px" }} value={m?.description || ""} onChange={e => updateMaterial(i, "description", e.target.value)} placeholder="Part or service" /></div>
                      <div><div style={{ fontSize: 9, color: "#888", marginBottom: 2 }}>UNIT PRICE</div><input style={{ ...s.input, padding: "6px 8px" }} value={m?.unitPrice || ""} onChange={e => updateMaterial(i, "unitPrice", e.target.value)} placeholder="0.00" /></div>
                      <div><div style={{ fontSize: 9, color: "#888", marginBottom: 2 }}>AMOUNT</div><input style={{ ...s.input, padding: "6px 8px" }} value={m?.amount || ""} onChange={e => updateMaterial(i, "amount", e.target.value)} placeholder="0.00" /></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr><th style={s.th} colSpan={8}>MATERIALS</th></tr>
                  <tr>{["Qty", "Description", "Unit Price", "Amount", "Qty", "Description", "Unit Price", "Amount"].map((h, i) => <th key={i} style={{ ...s.th, background: "#2a5a9b", fontSize: 10 }}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {[0, 2, 4, 6].map(startIdx => (
                    <tr key={startIdx} style={{ borderBottom: "1px solid #eee" }}>
                      {[startIdx, startIdx + 1].map(i => [
                        <td key={`${i}q`} style={{ ...s.cell, width: "5%" }}><input style={s.input} value={form.materials[i]?.qty || ""} onChange={e => updateMaterial(i, "qty", e.target.value)} /></td>,
                        <td key={`${i}d`} style={{ ...s.cell, width: "25%" }}><input style={s.input} value={form.materials[i]?.description || ""} onChange={e => updateMaterial(i, "description", e.target.value)} /></td>,
                        <td key={`${i}u`} style={{ ...s.cell, width: "10%" }}><input style={s.input} value={form.materials[i]?.unitPrice || ""} onChange={e => updateMaterial(i, "unitPrice", e.target.value)} /></td>,
                        <td key={`${i}a`} style={{ ...s.cell, width: "10%" }}><input style={s.input} value={form.materials[i]?.amount || ""} onChange={e => updateMaterial(i, "amount", e.target.value)} /></td>,
                      ])}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* BOTTOM SECTION */}
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr", gap: 12, marginTop: 12 }}>
            {/* Acknowledgment */}
            <div style={{ border: "1.5px solid #1a3a6b", borderRadius: 6, padding: 10 }}>
              <div style={{ fontWeight: 700, fontSize: 11, color: "#1a3a6b", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.04em" }}>Acknowledgment of Work Performed</div>
              <div style={{ fontSize: 9, color: "#555", lineHeight: 1.5, marginBottom: 10 }}>I have authority to order the work outlined above which has been satisfactorily completed. I agree that Seller retains title to equipment/materials furnished until final payment is made.</div>
              <label style={s.label}>Print Name</label>
              <input style={s.input} value={form.printName} onChange={e => set("printName", e.target.value)} />
              <div style={{ marginTop: 8 }}>
                <label style={s.label}>Signature</label>
                {isReadOnly && form.signature
                  ? <img src={form.signature} alt="Signature" style={{ width: "100%", height: 80, objectFit: "contain", border: "1.5px solid #1a3a6b", borderRadius: 4, background: "#fff" }} />
                  : <SignaturePad value={form.signature} onChange={v => set("signature", v)} />}
              </div>
              <div style={{ marginTop: 8 }}><label style={s.label}>Date</label><input type="date" style={s.input} value={form.signDate} onChange={e => set("signDate", e.target.value)} /></div>
            </div>

            {/* Warranty + Service Type — FIX: readable labels */}
            <div style={{ border: "1.5px solid #1a3a6b", borderRadius: 6, padding: 10 }}>
              <div style={{ fontWeight: 700, fontSize: 11, color: "#1a3a6b", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.04em" }}>Limited Warranty</div>
              <div style={{ fontSize: 9, color: "#555", lineHeight: 1.5, marginBottom: 10 }}>All materials, parts and equipment are warranted by the manufactures' or suppliers' written warranty only. All labor performed is warranted for 30 days.</div>
              {SERVICE_TYPES.map(t => (
                <label key={t} style={{ ...s.checkItem, marginBottom: 8 }}>
                  <input type="checkbox" style={s.checkbox} checked={form.serviceType.includes(t)} onChange={() => toggleServiceType(t)} />
                  <span style={s.checkLabel}>{t}</span>
                </label>
              ))}
            </div>

            {/* Total */}
            <div style={{ border: "1.5px solid #1a3a6b", borderRadius: 6, padding: 10, display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <div style={{ background: "#1a3a6b", color: "#fff", fontSize: 11, fontWeight: 700, padding: "5px 10px", marginBottom: 12, borderRadius: 4, textAlign: "center", letterSpacing: "0.06em" }}>TOTAL SUMMARY</div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: "#1a3a6b" }}>TOTAL DUE</span>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: 4, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: "#555" }}>$</span>
                  <input value={form.totalAmount} readOnly style={{ ...s.input, width: 110, paddingLeft: 16, textAlign: "right", fontWeight: 700, fontSize: 22, color: "#1a3a6b", background: "#f0f4f8" }} />
                </div>
              </div>
            </div>
          </div>

          {/* SUBMIT */}
          {!isReadOnly && (
            <div style={{ display: "flex", justifyContent: "center", marginTop: 20, paddingBottom: 20 }}>
              <button onClick={async () => {
                const wo = { ...form, savedAt: new Date().toISOString() };
                if (onSave) await onSave(wo);
                setSubmitted(true);
              }} style={{ background: "#1a3a6b", color: "#fff", border: "none", borderRadius: 10, padding: "14px 48px", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>
                Submit Work Order
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
