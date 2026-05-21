import { useState } from "react";

export const CATEGORIES = [
  "Blower Motor & Wheel",
  "Burners",
  "Circuit Board",
  "Electric Heat",
  "Fan Belt",
  "Fan/Limit Switch",
  "Flue/Intake Pipe",
  "Gas Valve",
  "Heat Exchanger",
  "Ignition",
  "Inducer",
  "Low Voltage",
  "Accumulator/Muffler",
  "Capacitor",
  "Compressor",
  "Condenser: Air Restriction",
  "Condenser: Fan Motor",
  "Contactor",
  "Defrost Control",
  "Driers",
  "Evaporator: Air Restriction",
  "Evaporator: Coil Leak",
  "Leak Search & Lineset",
  "Metering Device",
  "Pressure Switch",
  "Refrigerant",
  "Reversing Valve",
  "Air Cleaner",
  "Filters",
  "Humidifier",
  "Thermostat",
  "UV Light",
  "Breaker/Fuse",
  "Water Leak",
  "Wiring",
];

const DEFAULT_ITEMS = [
  // Blower Motor & Wheel
  {id:"p1",category:"Blower Motor & Wheel",name:"Replace Indoor Blower Motor (STD) PSC",price:345,description:"Regular price"},
  {id:"p2",category:"Blower Motor & Wheel",name:"Replace Blower Motor (OEM)",price:367},
  {id:"p3",category:"Blower Motor & Wheel",name:"Replace Blower Motor (Warranty)",price:204},
  {id:"p4",category:"Blower Motor & Wheel",name:"Replace Blower Motor & Wheel (STD)",price:451},
  {id:"p5",category:"Blower Motor & Wheel",name:"Replace Blower Motor & Wheel (OEM)",price:477},
  {id:"p6",category:"Blower Motor & Wheel",name:"Replace Blower Motor & Wheel (Warranty)",price:272},
  {id:"p7",category:"Blower Motor & Wheel",name:"Replace Variable Speed Blower Motor & Wheel",price:1133},
  {id:"p8",category:"Blower Motor & Wheel",name:"Replace Variable Speed Blower Motor & Wheel (Warranty)",price:271},
  {id:"p9",category:"Blower Motor & Wheel",name:"Replace ECM Blower Motor Universal 1/2-1/3 120/240V",price:670},
  {id:"p10",category:"Blower Motor & Wheel",name:"Replace ECM Blower Motor Universal 3/4 HP 120/240V",price:785},
  {id:"p11",category:"Blower Motor & Wheel",name:"Replace Blower Wheel",price:295},
  {id:"p12",category:"Blower Motor & Wheel",name:"Replace Blower Wheel (Warranty)",price:210},
  {id:"p13",category:"Blower Motor & Wheel",name:"Pull & Clean Blower Wheel",price:195},
  {id:"p14",category:"Blower Motor & Wheel",name:"Adjust Blower Wheel",price:68},
  {id:"p15",category:"Blower Motor & Wheel",name:"Replace Shaft & Bearing Up to 1\" Diameter",price:394},
  // Burners
  {id:"p16",category:"Burners",name:"Replace Burner",price:207},
  {id:"p17",category:"Burners",name:"Replace Burner (Warranty)",price:105},
  {id:"p18",category:"Burners",name:"Pull & Clean Burner",price:135},
  // Circuit Board
  {id:"p19",category:"Circuit Board",name:"Replace Circuit Board (Standard Gas Furnace)",price:370},
  {id:"p20",category:"Circuit Board",name:"Replace Circuit Board (Standard Air Handler)",price:370},
  {id:"p21",category:"Circuit Board",name:"Replace Circuit Board (Variable Speed Furnace)",price:492},
  {id:"p22",category:"Circuit Board",name:"Replace Circuit Board (Warranty)",price:135},
  {id:"p23",category:"Circuit Board",name:"Replace Circuit Board (Carrier/Lennox)",price:435},
  {id:"p24",category:"Circuit Board",name:"Replace Ignition Control Board",price:314},
  {id:"p25",category:"Circuit Board",name:"Replace Fan Relay",price:135},
  // Electric Heat
  {id:"p26",category:"Electric Heat",name:"Replace Fusible Link",price:98},
  {id:"p27",category:"Electric Heat",name:"Replace High Limit (Main Limit)",price:140},
  {id:"p28",category:"Electric Heat",name:"Replace High Limit (Warranty)",price:69},
  {id:"p29",category:"Electric Heat",name:"Replace Electric Heat Package",price:427},
  {id:"p30",category:"Electric Heat",name:"Replace Sequencer/Heat Relay",price:140},
  {id:"p31",category:"Electric Heat",name:"Replace Sequencer/Heat Relay (Warranty)",price:78},
  {id:"p32",category:"Electric Heat",name:"Replace Electric Heat Element",price:358},
  {id:"p33",category:"Electric Heat",name:"Replace Electric Heat Element (Warranty)",price:267},
  // Fan Belt
  {id:"p34",category:"Fan Belt",name:"Replace Fan Belt",price:153},
  {id:"p35",category:"Fan Belt",name:"Replace Fan Belt and Pulley",price:232},
  {id:"p36",category:"Fan Belt",name:"Replace Fan Belt and Motor Pulley",price:232},
  {id:"p37",category:"Fan Belt",name:"Replace Fan Belt, Fan Pulley and Motor Pulley",price:364},
  // Fan/Limit Switch
  {id:"p38",category:"Fan/Limit Switch",name:"Replace Fan Limit (Dial Type)",price:222},
  {id:"p39",category:"Fan/Limit Switch",name:"Replace Fan Relay/Time Delay",price:86},
  {id:"p40",category:"Fan/Limit Switch",name:"Replace Fan Relay/Time Delay (Warranty)",price:69},
  {id:"p41",category:"Fan/Limit Switch",name:"Replace Fan Center Control",price:281},
  {id:"p42",category:"Fan/Limit Switch",name:"Replace Limit Snapdisk/Flexed/Fusable/Rollout",price:128},
  {id:"p43",category:"Fan/Limit Switch",name:"Replace Limit Snapdisk/Flexed/Fusable/Rollout (Warranty)",price:69},
  {id:"p44",category:"Fan/Limit Switch",name:"Replace Door Switch",price:101},
  // Flue/Intake Pipe
  {id:"p45",category:"Flue/Intake Pipe",name:"Replace Flue Cap or Elbow",price:154},
  {id:"p46",category:"Flue/Intake Pipe",name:"Replace Flue Vent (Up to 5')",price:162},
  {id:"p47",category:"Flue/Intake Pipe",name:"Replace Flue Vent (Up to 15')",price:204},
  {id:"p48",category:"Flue/Intake Pipe",name:"Clean Obstruction",price:168},
  // Gas Valve
  {id:"p49",category:"Gas Valve",name:"Replace Single Stage Gas Valve",price:360},
  {id:"p50",category:"Gas Valve",name:"Replace Single Stage Gas Valve (Warranty)",price:135},
  {id:"p51",category:"Gas Valve",name:"Replace 2 Stage Gas Valve",price:367},
  {id:"p52",category:"Gas Valve",name:"Replace 2 Stage Gas Valve (Warranty)",price:135},
  {id:"p53",category:"Gas Valve",name:"Replace Gas Shut Off/Union/Gas Flex/Up to 6\" Pipe",price:182},
  {id:"p54",category:"Gas Valve",name:"Adjust Gas Pressure",price:68},
  // Heat Exchanger
  {id:"p55",category:"Heat Exchanger",name:"Clean Heat Exchanger",price:226},
  {id:"p56",category:"Heat Exchanger",name:"Carbon Monoxide Test",price:101},
  {id:"p57",category:"Heat Exchanger",name:"Replace Heat Exchanger Non Attic (Warranty)",price:860},
  {id:"p58",category:"Heat Exchanger",name:"Replace Heat Exchanger Attic (Warranty)",price:1132},
  // Ignition
  {id:"p59",category:"Ignition",name:"Replace Hot Surface Ignitor",price:145},
  {id:"p60",category:"Ignition",name:"Replace Hot Surface Ignitor/Flame Sensor (Warranty)",price:69},
  {id:"p61",category:"Ignition",name:"Replace Thermocouple",price:135},
  {id:"p62",category:"Ignition",name:"Clean and Adjust Pilot Assembly",price:162},
  {id:"p63",category:"Ignition",name:"Replace Flame Sensor",price:125},
  {id:"p64",category:"Ignition",name:"Replace Hot Surface Ignitor/Flame Sensor 90AFUR",price:217},
  // Inducer
  {id:"p65",category:"Inducer",name:"Replace Inducer Assembly",price:367},
  {id:"p66",category:"Inducer",name:"Replace Inducer Motor Assembly & Wheel (Warranty)",price:162},
  {id:"p67",category:"Inducer",name:"Replace Inducer Wheel",price:184},
  {id:"p68",category:"Inducer",name:"Replace Inducer Wheel (Warranty)",price:94},
  {id:"p69",category:"Inducer",name:"Replace Inducer Motor",price:338},
  {id:"p70",category:"Inducer",name:"Replace Pressure Switch",price:110},
  {id:"p71",category:"Inducer",name:"Replace Pressure Switch (Warranty)",price:90},
  {id:"p72",category:"Inducer",name:"Clean and Adjust Inducer",price:121},
  // Low Voltage
  {id:"p73",category:"Low Voltage",name:"Replace Transformer",price:145},
  {id:"p74",category:"Low Voltage",name:"Replace Transformer (Warranty)",price:69},
  {id:"p75",category:"Low Voltage",name:"Replace Fuse",price:15},
  // Accumulator/Muffler
  {id:"p76",category:"Accumulator/Muffler",name:"Replace Accumulator or Muffler (Warranty)",price:590},
  // Capacitor
  {id:"p77",category:"Capacitor",name:"Replace Single Capacitor 1 Pole",price:105},
  {id:"p78",category:"Capacitor",name:"Replace Single Capacitor 1 Pole (Warranty)",price:69},
  {id:"p79",category:"Capacitor",name:"Replace Dual Capacitor",price:125},
  {id:"p80",category:"Capacitor",name:"Replace Dual Capacitor (Warranty)",price:65},
  // Compressor
  {id:"p81",category:"Compressor",name:"Replace Compressor (Warranty)",price:1085},
  {id:"p82",category:"Compressor",name:"Replace Sound Blanket",price:163},
  {id:"p83",category:"Compressor",name:"Replace Crankcase Heater",price:149},
  {id:"p84",category:"Compressor",name:"Replace Crankcase Heater (Warranty)",price:116},
  {id:"p85",category:"Compressor",name:"Repair Terminal",price:156},
  {id:"p86",category:"Compressor",name:"Replace Start Assist Assembly",price:165},
  {id:"p87",category:"Compressor",name:"Replace Start Assist Assembly (Warranty)",price:69},
  // Condenser: Air Restriction
  {id:"p88",category:"Condenser: Air Restriction",name:"Clean Condenser Coil",price:75},
  {id:"p89",category:"Condenser: Air Restriction",name:"Straighten Fins (Minor)",price:68},
  {id:"p90",category:"Condenser: Air Restriction",name:"Straighten Fins (Major)",price:204},
  {id:"p91",category:"Condenser: Air Restriction",name:"Replace Condenser Coil",price:1569},
  {id:"p92",category:"Condenser: Air Restriction",name:"Replace Condenser Coil (Warranty)",price:613},
  // Condenser: Fan Motor
  {id:"p93",category:"Condenser: Fan Motor",name:"Replace Condenser Fan Blade",price:335},
  {id:"p94",category:"Condenser: Fan Motor",name:"Replace Condenser Fan Blade (Warranty)",price:225},
  {id:"p95",category:"Condenser: Fan Motor",name:"Replace Condenser Fan Motor",price:345},
  {id:"p96",category:"Condenser: Fan Motor",name:"Replace 2 Speed Condenser Fan Motor",price:474},
  {id:"p97",category:"Condenser: Fan Motor",name:"Replace Condenser Fan Blade and Motor",price:487},
  {id:"p98",category:"Condenser: Fan Motor",name:"Replace Condenser Fan Blade and Motor (Warranty)",price:285},
  // Contactor
  {id:"p99",category:"Contactor",name:"Replace Contactor",price:145},
  {id:"p100",category:"Contactor",name:"Replace Contactor (Warranty)",price:105},
  // Defrost Control
  {id:"p101",category:"Defrost Control",name:"Replace Circuit Board/Timer",price:198},
  {id:"p102",category:"Defrost Control",name:"Replace Circuit Board/Timer (Warranty)",price:135},
  {id:"p103",category:"Defrost Control",name:"Replace 2 Speed Circuit Board",price:199},
  {id:"p104",category:"Defrost Control",name:"Replace 2 Speed Circuit Board (Warranty)",price:135},
  {id:"p105",category:"Defrost Control",name:"Replace Relay",price:212},
  {id:"p106",category:"Defrost Control",name:"Replace Defrost Thermostat",price:248},
  {id:"p107",category:"Defrost Control",name:"Replace Defrost Thermostat (Warranty)",price:135},
  // Driers
  {id:"p108",category:"Driers",name:"Replace Filter Drier - Pump Down",price:385},
  {id:"p109",category:"Driers",name:"Replace Filter Drier - Recovery",price:542},
  // Evaporator: Air Restriction
  {id:"p110",category:"Evaporator: Air Restriction",name:"Clean In Place With Access Door",price:142},
  {id:"p111",category:"Evaporator: Air Restriction",name:"Clean In Place Without Access Door",price:243},
  {id:"p112",category:"Evaporator: Air Restriction",name:"Remove and Clean - Pump Down",price:477},
  {id:"p113",category:"Evaporator: Air Restriction",name:"Remove and Clean - Recovery",price:613},
  // Evaporator: Coil Leak
  {id:"p114",category:"Evaporator: Coil Leak",name:"Simple Leak Repair - Pump Down",price:341},
  {id:"p115",category:"Evaporator: Coil Leak",name:"Simple Leak Repair - Recovery",price:513},
  {id:"p116",category:"Evaporator: Coil Leak",name:"Replace Evaporator Coil Attic (Warranty)",price:585},
  {id:"p117",category:"Evaporator: Coil Leak",name:"Replace Evaporator Coil Non-Attic (Warranty)",price:495},
  // Leak Search & Lineset
  {id:"p118",category:"Leak Search & Lineset",name:"Electronic Leak Search",price:85},
  {id:"p119",category:"Leak Search & Lineset",name:"Electronic Leak Search with Nitrogen",price:216},
  {id:"p120",category:"Leak Search & Lineset",name:"Lineset Repair - Accessible (Pump Down)",price:477},
  {id:"p121",category:"Leak Search & Lineset",name:"Lineset Repair - Accessible (Recovery)",price:748},
  // Metering Device
  {id:"p122",category:"Metering Device",name:"Replace TXV Pump Down",price:679},
  {id:"p123",category:"Metering Device",name:"Replace TXV Pump Down (Warranty)",price:542},
  {id:"p124",category:"Metering Device",name:"Replace TXV Recovery",price:814},
  {id:"p125",category:"Metering Device",name:"Replace TXV Recovery (Warranty)",price:678},
  {id:"p126",category:"Metering Device",name:"Repair Piston Blockage Pump Down",price:416},
  {id:"p127",category:"Metering Device",name:"Repair Piston Blockage Recovery",price:551},
  {id:"p128",category:"Metering Device",name:"Replace Schrader/Tighten Flare - No Refrigerant",price:81},
  {id:"p129",category:"Metering Device",name:"Replace Service Valve - Recovery",price:653},
  {id:"p130",category:"Metering Device",name:"Replace Access Valve - No Refrigerant",price:367},
  // Pressure Switch
  {id:"p131",category:"Pressure Switch",name:"Replace Threaded Hi/Lo Pressure Switch Schrader",price:221},
  {id:"p132",category:"Pressure Switch",name:"Replace Hi/Lo Pressure Switch Recovery",price:665},
  {id:"p133",category:"Pressure Switch",name:"Replace Hi/Lo Pressure Switch Recovery (Warranty)",price:542},
  // Refrigerant
  {id:"p134",category:"Refrigerant",name:"R22 & Drop In Equivalent 1 LB",price:78},
  {id:"p135",category:"Refrigerant",name:"R410 1 LB",price:70},
  {id:"p136",category:"Refrigerant",name:"R32 1 LB",price:70},
  {id:"p137",category:"Refrigerant",name:"R454B 1 LB",price:80},
  {id:"p138",category:"Refrigerant",name:"Remove Refrigerant Overcharge",price:80},
  {id:"p139",category:"Refrigerant",name:"Recovery of Refrigerant (Entire Charge)",price:160},
  // Reversing Valve
  {id:"p140",category:"Reversing Valve",name:"Replace Reversing Valve (Warranty)",price:542},
  {id:"p141",category:"Reversing Valve",name:"Replace Reversing Valve (Secondary Repair)",price:639},
  {id:"p142",category:"Reversing Valve",name:"Replace Electrical Coil",price:180},
  {id:"p143",category:"Reversing Valve",name:"Replace Electrical Coil (Warranty)",price:113},
  // Air Cleaner
  {id:"p144",category:"Air Cleaner",name:"Replace Air Pressure Switch",price:222},
  {id:"p145",category:"Air Cleaner",name:"Replace Air Pressure Switch (Warranty)",price:135},
  {id:"p146",category:"Air Cleaner",name:"Clean Cells and Pre Filters",price:68},
  {id:"p147",category:"Air Cleaner",name:"Replace Cells",price:667},
  {id:"p148",category:"Air Cleaner",name:"Replace Cells (Warranty)",price:68},
  {id:"p149",category:"Air Cleaner",name:"Replace Cells Handle",price:154},
  {id:"p150",category:"Air Cleaner",name:"Replace Current Sensing Relay",price:154},
  {id:"p151",category:"Air Cleaner",name:"Replace Ionizing Wire",price:169},
  {id:"p152",category:"Air Cleaner",name:"Replace Power Pack",price:833},
  {id:"p153",category:"Air Cleaner",name:"Replace Power Pack (Warranty)",price:101},
  {id:"p154",category:"Air Cleaner",name:"Replace Pre Filter",price:187},
  // Filters
  {id:"p155",category:"Filters",name:"Replace 1\" Pleated Filter",price:30},
  {id:"p156",category:"Filters",name:"Replace 2\" Pleated Filter",price:48},
  {id:"p157",category:"Filters",name:"Replace 4\" Pleated Filter",price:73},
  {id:"p158",category:"Filters",name:"Replace Customer Provided Filter",price:29},
  // Humidifier
  {id:"p159",category:"Humidifier",name:"Replace Current Sensing Delay",price:163},
  {id:"p160",category:"Humidifier",name:"Replace Orifice",price:92},
  {id:"p161",category:"Humidifier",name:"Replace Humidistat",price:127},
  {id:"p162",category:"Humidifier",name:"Replace Humidistat (Warranty)",price:68},
  {id:"p163",category:"Humidifier",name:"Replace Humidifier Pad - Primary",price:68},
  {id:"p164",category:"Humidifier",name:"Replace Saddle Valve",price:107},
  {id:"p165",category:"Humidifier",name:"Replace Solenoid Valve",price:199},
  {id:"p166",category:"Humidifier",name:"Replace Solenoid Valve (Warranty)",price:68},
  {id:"p167",category:"Humidifier",name:"Replace Canister",price:134},
  // Thermostat
  {id:"p168",category:"Thermostat",name:"Install Customer Provided Thermostat",price:89},
  {id:"p169",category:"Thermostat",name:"Install Digital Thermostat Pro T701 & T721",price:115},
  {id:"p170",category:"Thermostat",name:"Install Programmable Thermostat or Ecobee",price:275},
  {id:"p171",category:"Thermostat",name:"Wireless Room Sensor",price:212},
  {id:"p172",category:"Thermostat",name:"Wall Trim Plate",price:68},
  {id:"p173",category:"Thermostat",name:"Outdoor Temperature Sensor",price:299},
  {id:"p174",category:"Thermostat",name:"Replace Thermostat Wire 2 Men Up to 50 ft",price:295},
  {id:"p175",category:"Thermostat",name:"Thermostat Guard Lock Box",price:110},
  // UV Light
  {id:"p176",category:"UV Light",name:"UV Germicidal Light",price:385},
  {id:"p177",category:"UV Light",name:"UV Light Lennox/Goodman/Carrier/Bryant",price:198},
  {id:"p178",category:"UV Light",name:"Replace UV Bulb (Warranty)",price:68},
  // Breaker/Fuse
  {id:"p179",category:"Breaker/Fuse",name:"Replace Low Voltage Fuse",price:15},
  {id:"p180",category:"Breaker/Fuse",name:"Replace High Voltage Fuse",price:80},
  {id:"p181",category:"Breaker/Fuse",name:"Reset and Test/Tighten",price:34},
  {id:"p182",category:"Breaker/Fuse",name:"Replace Switch/Plug/Cord/Receptacle",price:127},
  {id:"p183",category:"Breaker/Fuse",name:"Replace Circuit Breaker",price:155},
  // Water Leak
  {id:"p184",category:"Water Leak",name:"Clean/Blowout Drain",price:78},
  {id:"p185",category:"Water Leak",name:"Replace Condensate Drain Up to 20 Feet",price:204},
  {id:"p186",category:"Water Leak",name:"Install Condensate Kill Switch",price:140},
  {id:"p187",category:"Water Leak",name:"Insulate Condensate Drain Up to 25'",price:187},
  {id:"p188",category:"Water Leak",name:"Misc Condensate Repair",price:65},
  {id:"p189",category:"Water Leak",name:"Replace Drain Pan W/O Opening Refrigerant System",price:378},
  {id:"p190",category:"Water Leak",name:"Replace Drain Pan W/O Opening Refrigerant System (Warranty)",price:297},
  {id:"p191",category:"Water Leak",name:"Replace Auxiliary Drain Pan",price:383},
  {id:"p192",category:"Water Leak",name:"Replace Condensate Pump",price:222},
  {id:"p193",category:"Water Leak",name:"Replace Condensate Pump with 50 Feet of Tubing",price:381},
  // Wiring
  {id:"p194",category:"Wiring",name:"Minor Repair",price:68},
  {id:"p195",category:"Wiring",name:"Minor Repair Locate Short",price:135},
  {id:"p196",category:"Wiring",name:"Replace Thermostat Wire 1 Man Up to 50 ft",price:299},
  {id:"p197",category:"Wiring",name:"Replace Thermostat Wire 2 Men Up to 50 ft",price:435},
  {id:"p198",category:"Wiring",name:"Replace A/C Whip Up to 6' 1/2\" to 3/4\"",price:155},
  {id:"p199",category:"Wiring",name:"Replace Fuse Disconnect Box",price:187},
];

const PRICEBOOK_KEY = "fieldops_pricebook_405_v3";

export function loadPricebook() {
  try {
    // Clear any old cache keys that might have empty data
    ["fieldops_pricebook_cache","fieldops_pricebook_v2","fieldops_pricebook"].forEach(k => {
      try { localStorage.removeItem(k); } catch {}
    });
    const saved = localStorage.getItem(PRICEBOOK_KEY);
    if(saved) {
      const parsed = JSON.parse(saved);
      if(Array.isArray(parsed) && parsed.length > 10) return parsed;
    }
    localStorage.setItem(PRICEBOOK_KEY, JSON.stringify(DEFAULT_ITEMS));
    return DEFAULT_ITEMS;
  } catch {
    return DEFAULT_ITEMS;
  }
}

function savePricebook(items) {
  try { localStorage.setItem(PRICEBOOK_KEY, JSON.stringify(items)); } catch {}
}

export default function Pricebook() {
  const [items, setItems] = useState(loadPricebook);
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState("all");
  const [editing, setEditing] = useState(null);
  const [showNew, setShowNew] = useState(false);

  const filtered = items
    .filter(i => cat === "all" || i.category === cat)
    .filter(i => !search || i.name.toLowerCase().includes(search.toLowerCase()) || i.category.toLowerCase().includes(search.toLowerCase()));

  function save(item) {
    const updated = item.id && items.find(x => x.id === item.id)
      ? items.map(x => x.id === item.id ? item : x)
      : [...items, { ...item, id: "p" + Date.now() }];
    savePricebook(updated);
    setItems(updated);
    setEditing(null);
    setShowNew(false);
  }

  function remove(id) {
    if(!window.confirm("Delete this item?")) return;
    const updated = items.filter(x => x.id !== id);
    savePricebook(updated);
    setItems(updated);
  }

  function reset() {
    if(!window.confirm("Reset to default 405 pricebook? This will overwrite any changes.")) return;
    savePricebook(DEFAULT_ITEMS);
    setItems(DEFAULT_ITEMS);
  }

  const inp = { width:"100%", padding:"9px 12px", borderRadius:8, fontSize:13, border:"1px solid rgba(255,255,255,0.12)", outline:"none", fontFamily:"inherit", boxSizing:"border-box", background:"rgba(255,255,255,0.05)", color:"#F0F4FF" };

  return (
    <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden", background:"var(--bg,#0F1320)" }}>
      {/* Header */}
      <div style={{ padding:"14px 20px", background:"var(--surface,#161B2E)", borderBottom:"1px solid rgba(255,255,255,0.07)", flexShrink:0 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
          <div>
            <div style={{ fontSize:16, fontWeight:700, color:"#F0F4FF" }}>Pricebook</div>
            <div style={{ fontSize:12, color:"#6B7A99", marginTop:2 }}>{items.length} items · Regular pricing</div>
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <button onClick={reset} style={{ fontSize:12, background:"rgba(255,255,255,0.05)", color:"#6B7A99", border:"1px solid rgba(255,255,255,0.12)", borderRadius:7, padding:"6px 12px", cursor:"pointer" }}>Reset</button>
            <button onClick={()=>setShowNew(true)} style={{ fontSize:12, background:"#3B6FFF", color:"#fff", border:"none", borderRadius:7, padding:"6px 14px", cursor:"pointer", fontWeight:600 }}>+ Add Item</button>
          </div>
        </div>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
          <div style={{ position:"relative", flex:1, minWidth:160 }}>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search items…" style={{ ...inp, paddingLeft:28 }} />
            <span style={{ position:"absolute", left:9, top:"50%", transform:"translateY(-50%)", color:"#6B7A99", fontSize:13 }}>⌕</span>
          </div>
          <select value={cat} onChange={e=>setCat(e.target.value)} style={{ ...inp, width:"auto", minWidth:140 }}>
            <option value="all">All Categories</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* Item list */}
      <div style={{ flex:1, overflowY:"auto", background:"#0F1320" }}>
        {filtered.length === 0
          ? <div style={{ textAlign:"center", padding:"60px 20px", color:"#6B7A99" }}><div style={{ fontSize:40, marginBottom:12 }}>💲</div><div style={{ fontSize:16, fontWeight:700, color:"#F0F4FF", marginBottom:8 }}>No items found</div></div>
          : filtered.map(item => (
            <div key={item.id} style={{ padding:"12px 20px", borderBottom:"1px solid rgba(255,255,255,0.07)", display:"flex", justifyContent:"space-between", alignItems:"center", gap:12, background:"#0F1320" }}>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:13, fontWeight:600, color:"#F0F4FF", marginBottom:2 }}>{item.name}</div>
                <div style={{ fontSize:11, color:"#6B7A99" }}>{item.category}{item.description ? ` · ${item.description}` : ""}</div>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:10, flexShrink:0 }}>
                <span style={{ fontSize:15, fontWeight:700, color:"#00C48C", fontFamily:"monospace" }}>${parseFloat(item.price).toFixed(2)}</span>
                <button onClick={()=>setEditing(item)} style={{ fontSize:11, background:"rgba(255,255,255,0.08)", color:"#F0F4FF", border:"1px solid rgba(255,255,255,0.15)", borderRadius:5, padding:"3px 10px", cursor:"pointer" }}>Edit</button>
                <button onClick={()=>remove(item.id)} style={{ fontSize:11, background:"rgba(255,77,77,0.1)", color:"#FF4D4D", border:"1px solid rgba(255,77,77,0.25)", borderRadius:5, padding:"3px 8px", cursor:"pointer" }}>✕</button>
              </div>
            </div>
          ))
        }
      </div>

      {/* Edit/New Modal */}
      {(editing || showNew) && (
        <PricebookItemModal
          item={editing || { name:"", category:CATEGORIES[0], price:"", description:"" }}
          onClose={() => { setEditing(null); setShowNew(false); }}
          onSave={save}
        />
      )}
    </div>
  );
}

function PricebookItemModal({ item, onClose, onSave }) {
  const [f, setF] = useState({ ...item });
  const inp = { width:"100%", padding:"9px 12px", borderRadius:8, fontSize:13, border:"1px solid rgba(255,255,255,0.12)", outline:"none", fontFamily:"inherit", boxSizing:"border-box", background:"rgba(255,255,255,0.05)", color:"#F0F4FF" };
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", zIndex:100, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{ background:"#161B2E", border:"1px solid rgba(255,255,255,0.12)", borderRadius:16, width:"100%", maxWidth:480, boxShadow:"0 24px 80px rgba(0,0,0,0.8)" }}>
        <div style={{ padding:"18px 24px", borderBottom:"1px solid rgba(255,255,255,0.07)", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <span style={{ fontSize:15, fontWeight:700, color:"#F0F4FF" }}>{f.id ? "Edit Item" : "New Item"}</span>
          <button onClick={onClose} style={{ background:"none", border:"none", color:"#6B7A99", fontSize:20, cursor:"pointer" }}>×</button>
        </div>
        <div style={{ padding:"20px 24px", display:"flex", flexDirection:"column", gap:14 }}>
          <div><label style={{ fontSize:11, fontWeight:600, color:"#6B7A99", textTransform:"uppercase", letterSpacing:"0.06em", display:"block", marginBottom:6 }}>Item Name *</label><input style={inp} value={f.name} onChange={e=>setF(p=>({...p,name:e.target.value}))} placeholder="e.g. Replace Dual Capacitor" /></div>
          <div><label style={{ fontSize:11, fontWeight:600, color:"#6B7A99", textTransform:"uppercase", letterSpacing:"0.06em", display:"block", marginBottom:6 }}>Category *</label><select style={inp} value={f.category} onChange={e=>setF(p=>({...p,category:e.target.value}))}>{CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}</select></div>
          <div><label style={{ fontSize:11, fontWeight:600, color:"#6B7A99", textTransform:"uppercase", letterSpacing:"0.06em", display:"block", marginBottom:6 }}>Price *</label><input style={inp} type="number" min="0" step="0.01" value={f.price} onChange={e=>setF(p=>({...p,price:e.target.value}))} placeholder="0.00" /></div>
          <div><label style={{ fontSize:11, fontWeight:600, color:"#6B7A99", textTransform:"uppercase", letterSpacing:"0.06em", display:"block", marginBottom:6 }}>Notes</label><input style={inp} value={f.description||""} onChange={e=>setF(p=>({...p,description:e.target.value}))} placeholder="Optional notes" /></div>
        </div>
        <div style={{ padding:"14px 24px", borderTop:"1px solid rgba(255,255,255,0.07)", display:"flex", justifyContent:"flex-end", gap:10 }}>
          <button onClick={onClose} style={{ padding:"8px 16px", borderRadius:8, border:"1px solid rgba(255,255,255,0.12)", background:"rgba(255,255,255,0.05)", color:"#A8B4CC", cursor:"pointer", fontSize:13 }}>Cancel</button>
          <button onClick={()=>{ if(!f.name||!f.price){alert("Name and price required");return;} onSave(f); }} style={{ padding:"8px 16px", borderRadius:8, border:"none", background:"#3B6FFF", color:"#fff", cursor:"pointer", fontSize:13, fontWeight:600 }}>{f.id ? "Save Changes" : "Add Item"}</button>
        </div>
      </div>
    </div>
  );
}
