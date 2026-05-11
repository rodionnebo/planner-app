import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from './supabaseClient'
import Auth from './Auth'

const PRIORITY = {
  deadline: { label: "Дедлайн", color: "#FF7070", bg: "rgba(255,112,112,0.12)", icon: "🔥" },
  high:     { label: "Важное",   color: "#E8A87C", bg: "rgba(232,168,124,0.13)", icon: "⚡" },
  medium:   { label: "Обычное",  color: "#7CA8E8", bg: "rgba(124,168,232,0.12)", icon: "📌" },
  low:      { label: "Потом",    color: "#888",    bg: "rgba(140,140,140,0.10)", icon: "🌱" },
};

const MONTHS     = ["Январь","Февраль","Март","Апрель","Май","Июнь","Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь"];
const MONTHS_GEN = ["января","февраля","марта","апреля","мая","июня","июля","августа","сентября","октября","ноября","декабря"];
const DAYS_SHORT = ["Пн","Вт","Ср","Чт","Пт","Сб","Вс"];
const DAYS_FULL  = ["воскресенье","понедельник","вторник","среда","четверг","пятница","суббота"];

function todayStr() { return new Date().toISOString().split("T")[0]; }
function dateToStr(d) { return d.toISOString().split("T")[0]; }
function strToDate(s) { const [y,m,d]=s.split("-").map(Number); return new Date(y,m-1,d); }
function uid() { return Math.random().toString(36).slice(2)+Date.now().toString(36); }
function addDays(s,n) { const d=strToDate(s); d.setDate(d.getDate()+n); return dateToStr(d); }
function getFirstDayMon(y,m) { const d=new Date(y,m,1).getDay(); return d===0?6:d-1; }
function getDaysInMonth(y,m) { return new Date(y,m+1,0).getDate(); }
function relLabel(s) {
  const t=todayStr();
  if(s===t) return "Сегодня";
  if(s===addDays(t,1)) return "Завтра";
  if(s===addDays(t,-1)) return "Вчера";
  return null;
}

const EMPTY_FORM = { title:"", note:"", time:"", priority:"medium" };
const PO = {deadline:0,high:1,medium:2,low:3};
const [user, setUser] = useState(null)
const [authLoading, setAuthLoading] = useState(true)

// ── AI Suggest ────────────────────────────────────────────────────────────────
async function fetchAISuggestions(dateStr, existingTasks) {
  const d = strToDate(dateStr);
  const dayName = DAYS_FULL[d.getDay()];
  const dateLabel = `${d.getDate()} ${MONTHS_GEN[d.getMonth()]} ${d.getFullYear()}`;
  const existing = existingTasks.map(t=>t.title).join(", ") || "пусто";

  const prompt = `Ты умный планировщик задач. Предложи 4 конкретные задачи на ${dateLabel} (${dayName}).
Уже есть задачи: ${existing}.
Верни ТОЛЬКО JSON массив из 4 объектов: [{"title":"...","priority":"medium|high|low|deadline","note":"..."}]
Задачи должны быть практичными, разнообразными (работа, здоровье, быт, саморазвитие). Не повторяй существующие. Без markdown, без пояснений.`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  const data = await response.json();
  const text = data.content?.map(i=>i.text||"").join("") || "[]";
  const clean = text.replace(/```json|```/g,"").trim();
  return JSON.parse(clean);
}

// ── TaskCard ──────────────────────────────────────────────────────────────────
function TaskCard({ task, onToggle, onEdit, onDelete, isNew }) {
  const p = PRIORITY[task.priority];
  return (
    <div className={`task-card${isNew?" task-new":""}`} style={{
      background: task.completed ? "rgba(255,255,255,0.015)" : "#141414",
      border: `1px solid ${task.completed ? "#1e1e1e" : "#252525"}`,
      borderLeft: `3px solid ${task.completed ? "#252525" : p.color}`,
      borderRadius: 14,
      padding: "13px 13px 13px 15px",
      display: "flex",
      alignItems: "flex-start",
      gap: 11,
      opacity: task.completed ? 0.5 : 1,
      transition: "opacity 0.25s, border-color 0.25s, background 0.25s, transform 0.2s",
    }}>
      <button onClick={onToggle} className="check-btn" style={{
        width: 22, height: 22, borderRadius: 7, flexShrink: 0, marginTop: 1,
        border: `2px solid ${task.completed ? "#6DBF7E" : p.color}`,
        background: task.completed ? "rgba(109,191,126,0.18)" : "transparent",
        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
        transition: "all 0.2s", padding: 0,
      }}>
        {task.completed && <svg width="12" height="10" viewBox="0 0 12 10" fill="none"><path d="M1 5L4.5 8.5L11 1" stroke="#6DBF7E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
      </button>

      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:"flex", flexWrap:"wrap", alignItems:"center", gap:6, marginBottom: task.note?4:0 }}>
          <span style={{
            fontSize:14.5, fontWeight:500, lineHeight:1.35,
            textDecoration: task.completed?"line-through":"none",
            color: task.completed?"#484848":"#DDD5CB",
            wordBreak:"break-word",
          }}>{task.title}</span>
          <span style={{
            fontSize:10.5, padding:"2px 8px", borderRadius:99,
            background:p.bg, color:p.color, whiteSpace:"nowrap", flexShrink:0, letterSpacing:0.2,
          }}>{p.icon} {p.label}</span>
          {task.time && <span style={{fontSize:11,opacity:0.35,whiteSpace:"nowrap"}}>🕐 {task.time}</span>}
        </div>
        {task.note && <div style={{fontSize:12.5,color:"#555",lineHeight:1.5,wordBreak:"break-word"}}>{task.note}</div>}
      </div>

      <div style={{ display:"flex", gap:1, flexShrink:0 }}>
        <button onClick={onEdit}   className="act-btn" title="Редактировать">✏️</button>
        <button onClick={onDelete} className="act-btn" title="Удалить">🗑</button>
      </div>
    </div>
  );
}

// ── AISuggestPanel ────────────────────────────────────────────────────────────
function AISuggestPanel({ dateStr, existingTasks, onAdd, onClose }) {
  const [loading, setLoading] = useState(true);
  const [suggestions, setSuggestions] = useState([]);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(new Set());

  useEffect(()=>{
    fetchAISuggestions(dateStr, existingTasks)
      .then(s=>{ setSuggestions(s); setLoading(false); })
      .catch(()=>{ setError("Не удалось получить подсказки."); setLoading(false); });
  },[]);

  function toggleSel(i) {
    setSelected(s=>{ const n=new Set(s); n.has(i)?n.delete(i):n.add(i); return n; });
  }

  function addSelected() {
    suggestions.filter((_,i)=>selected.has(i)).forEach(s=>onAdd(s));
    onClose();
  }

  return (
    <div style={{
      position:"fixed",inset:0,background:"rgba(0,0,0,0.8)",backdropFilter:"blur(8px)",
      display:"flex",alignItems:"center",justifyContent:"center",zIndex:300,padding:16,
    }} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={{
        background:"#131313",borderRadius:22,padding:"24px",width:"100%",maxWidth:460,
        border:"1px solid #2a2a2a",boxShadow:"0 32px 80px rgba(0,0,0,0.7)",
      }}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18}}>
          <div>
            <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,color:"#F0E8DE",fontWeight:600}}>
              ✨ AI-подсказки
            </h2>
            <p style={{fontSize:12,color:"#555",marginTop:2}}>Выбери задачи для добавления</p>
          </div>
          <button onClick={onClose} style={{background:"transparent",border:"none",color:"#444",fontSize:20,cursor:"pointer"}}>×</button>
        </div>

        {loading && (
          <div style={{padding:"32px 0",textAlign:"center"}}>
            <div className="ai-spinner"/>
            <p style={{color:"#555",fontSize:13,marginTop:12}}>Думаю...</p>
          </div>
        )}
        {error && <p style={{color:"#FF7070",fontSize:13,padding:"16px 0"}}>{error}</p>}
        {!loading && !error && (
          <>
            <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:18}}>
              {suggestions.map((s,i)=>{
                const p=PRIORITY[s.priority]||PRIORITY.medium;
                const isSel=selected.has(i);
                return (
                  <div key={i} onClick={()=>toggleSel(i)} style={{
                    padding:"11px 14px",borderRadius:12,cursor:"pointer",
                    background:isSel?"rgba(232,168,124,0.1)":"#0E0E0E",
                    border:`1px solid ${isSel?"rgba(232,168,124,0.4)":"#222"}`,
                    transition:"all 0.15s",
                  }}>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <div style={{
                        width:18,height:18,borderRadius:5,border:`2px solid ${isSel?"#E8A87C":"#333"}`,
                        background:isSel?"rgba(232,168,124,0.25)":"transparent",
                        display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all 0.15s",
                      }}>
                        {isSel&&<svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="#E8A87C" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                      </div>
                      <span style={{fontSize:13.5,color:isSel?"#DDD5CB":"#888",fontWeight:500,flex:1}}>{s.title}</span>
                      <span style={{fontSize:10,padding:"1px 7px",borderRadius:99,background:p.bg,color:p.color,whiteSpace:"nowrap"}}>
                        {p.icon} {p.label}
                      </span>
                    </div>
                    {s.note&&<p style={{fontSize:11.5,color:"#444",marginTop:5,paddingLeft:26}}>{s.note}</p>}
                  </div>
                );
              })}
            </div>
            <div style={{display:"flex",gap:8}}>
              <button onClick={onClose} style={{
                flex:1,padding:"11px",borderRadius:10,background:"transparent",
                border:"1px solid #252525",color:"#555",cursor:"pointer",
                fontFamily:"'DM Sans',sans-serif",fontSize:13,
              }}>Отмена</button>
              <button onClick={addSelected} disabled={selected.size===0} style={{
                flex:2,padding:"11px",borderRadius:10,fontWeight:600,
                background:selected.size>0?"rgba(232,168,124,0.15)":"#1a1a1a",
                color:selected.size>0?"#E8A87C":"#444",
                border:`1px solid ${selected.size>0?"rgba(232,168,124,0.35)":"#222"}`,
                cursor:selected.size>0?"pointer":"default",
                fontFamily:"'DM Sans',sans-serif",fontSize:13,transition:"all 0.2s",
              }}>
                {selected.size>0?`Добавить (${selected.size})`:"Ничего не выбрано"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── MiniCalendar ──────────────────────────────────────────────────────────────
function MiniCalendar({ calMonth, setCalMonth, selected, setSelected, tasks, today, onClose }) {
  const { y, m } = calMonth;
  const firstDay = getFirstDayMon(y, m);
  const days = getDaysInMonth(y, m);
  const cells = Array(firstDay).fill(null);
  for(let i=1;i<=days;i++) cells.push(i);

  function nav(delta) {
    let nm=m+delta, ny=y;
    if(nm<0){nm=11;ny--;} if(nm>11){nm=0;ny++;}
    setCalMonth({y:ny,m:nm});
  }

  return (
    <div style={{padding:"16px 14px 10px"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
        <button onClick={()=>nav(-1)} style={navBtnStyle}>‹</button>
        <span style={{fontSize:12.5,fontWeight:600,opacity:0.7,letterSpacing:0.5}}>
          {MONTHS[m]} {y}
        </span>
        <button onClick={()=>nav(1)} style={navBtnStyle}>›</button>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:"1px"}}>
        {DAYS_SHORT.map(d=>(
          <div key={d} style={{textAlign:"center",fontSize:9.5,opacity:0.3,padding:"4px 0",fontWeight:700,letterSpacing:0.5}}>
            {d}
          </div>
        ))}
        {cells.map((day,i)=>{
          if(!day) return <div key={`e${i}`}/>;
          const ds=`${y}-${String(m+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
          const isSel=ds===selected, isT=ds===today, isPast=ds<today&&ds!==today;
          const dayTasks=tasks[ds]||[];
          const hasTasks=dayTasks.length>0;
          const allDone=hasTasks&&dayTasks.every(t=>t.completed);
          const hasDeadline=dayTasks.some(t=>t.priority==="deadline"&&!t.completed);
          const hasOverdue=isPast&&hasTasks&&!allDone;
          return (
            <div key={day} onClick={()=>{setSelected(ds);onClose&&onClose();}} style={{
              textAlign:"center", padding:"6px 0", cursor:"pointer", borderRadius:7,
              fontSize:11.5, fontWeight:isT||isSel?700:400,
              background: isSel?"#E8A87C": isT?"rgba(232,168,124,0.13)":"transparent",
              color: isSel?"#0C0C0C": isT?"#E8A87C": hasOverdue?"#FF7070": isPast?"#3a3a3a":"#B8B0A8",
              transition:"background 0.15s",
            }}>
              {day}
              {hasTasks&&!isSel&&(
                <div style={{
                  width:3,height:3,borderRadius:"50%",margin:"2px auto 0",
                  background: hasDeadline?"#FF7070": allDone?"#6DBF7E": hasOverdue?"#FF7070":"#E8A87C",
                }}/>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Modal ─────────────────────────────────────────────────────────────────────
function Modal({ editing, form, setForm, onSubmit, onClose, selectedDate }) {
  const d = strToDate(selectedDate);
  const title = editing ? "Редактировать задачу" : `Задача на ${d.getDate()} ${MONTHS_GEN[d.getMonth()]}`;
  const inputRef = useRef(null);

  useEffect(()=>{ setTimeout(()=>inputRef.current?.focus(),60); },[]);

  return (
    <div className="modal-overlay" style={{
      position:"fixed",inset:0,background:"rgba(0,0,0,0.78)",backdropFilter:"blur(8px)",
      display:"flex",alignItems:"center",justifyContent:"center",zIndex:200,padding:"16px",
    }} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div className="modal-box" style={{
        background:"#111",borderRadius:22,padding:"24px 22px",width:"100%",maxWidth:480,
        border:"1px solid #272727",boxShadow:"0 28px 80px rgba(0,0,0,0.65)",
      }}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
          <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:21,color:"#F0E8DE",fontWeight:600}}>{title}</h2>
          <button onClick={onClose} style={{background:"transparent",border:"none",color:"#444",fontSize:22,cursor:"pointer",lineHeight:1,padding:"2px 6px"}}>×</button>
        </div>

        <input ref={inputRef} placeholder="Название задачи *"
          value={form.title} onChange={e=>setForm({...form,title:e.target.value})}
          onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey)onSubmit();if(e.key==="Escape")onClose();}}
          style={inputSt}/>

        <textarea placeholder="Заметка (необязательно)..."
          value={form.note} onChange={e=>setForm({...form,note:e.target.value})}
          rows={3} style={{...inputSt,resize:"vertical",minHeight:76}}/>

        <div style={{marginBottom:14}}>
          <div style={labelSt}>Время</div>
          <input type="time" value={form.time} onChange={e=>setForm({...form,time:e.target.value})} style={{...inputSt,marginBottom:0,width:"auto"}}/>
        </div>

        <div style={{marginBottom:22}}>
          <div style={labelSt}>Приоритет</div>
          <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
            {Object.entries(PRIORITY).map(([key,p])=>(
              <button key={key} onClick={()=>setForm({...form,priority:key})} style={{
                padding:"5px 13px",borderRadius:20,cursor:"pointer",fontSize:12.5,
                fontFamily:"'DM Sans',sans-serif",transition:"all 0.15s",
                border:`1px solid ${form.priority===key?p.color:"#252525"}`,
                background:form.priority===key?p.bg:"transparent",
                color:form.priority===key?p.color:"#555",
              }}>{p.icon} {p.label}</button>
            ))}
          </div>
        </div>

        <div style={{display:"flex",gap:9}}>
          <button onClick={onClose} style={{
            flex:1,padding:"11px",borderRadius:11,background:"transparent",
            border:"1px solid #252525",color:"#555",cursor:"pointer",
            fontFamily:"'DM Sans',sans-serif",fontSize:13.5,
          }}>Отмена</button>
          <button onClick={onSubmit} disabled={!form.title.trim()} style={{
            flex:2,padding:"11px",borderRadius:11,
            background:form.title.trim()?"#E8A87C":"#1e1e1e",
            color:form.title.trim()?"#0C0C0C":"#444",
            border:"none",cursor:form.title.trim()?"pointer":"default",
            fontWeight:600,fontFamily:"'DM Sans',sans-serif",fontSize:13.5,transition:"all 0.2s",
          }}>{editing?"Сохранить":"Добавить задачу"}</button>
        </div>
      </div>
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [tasks,    setTasks]    = useState({});
  const [selected, setSelected] = useState(todayStr());
  const [calMonth, setCalMonth] = useState(()=>{ const n=new Date(); return{y:n.getFullYear(),m:n.getMonth()}; });
  const [loaded,   setLoaded]   = useState(false);
  const [modal,    setModal]    = useState(false);
  const [editing,  setEditing]  = useState(null);
  const [form,     setForm]     = useState(EMPTY_FORM);
  const [showCal,  setShowCal]  = useState(false);
  const [showAI,   setShowAI]   = useState(false);
  const [newTaskId,setNewTaskId]= useState(null);

  const today = todayStr();
  const isPast = selected < today;

  // Load
  useEffect(()=>{
    (async()=>{
      try{ const r=await window.storage.get("planner_v2"); if(r) setTasks(JSON.parse(r.value)); }catch{}
      setLoaded(true);
    })();
  },[]);

  // Auth check
useEffect(() => {
  supabase.auth.getSession().then(({ data: { session } }) => {
    setUser(session?.user ?? null)
    setAuthLoading(false)
  })
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (_event, session) => {
      setUser(session?.user ?? null)
    }
  )
  return () => subscription.unsubscribe()
}, [])

// Load tasks from Supabase when user logs in
useEffect(() => {
  if (!user) return
  async function loadTasks() {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
    if (error) return
    const grouped = {}
    data.forEach(row => {
      if (!grouped[row.date_str]) grouped[row.date_str] = []
      grouped[row.date_str].push({
        id: row.task_id,
        title: row.title,
        note: row.note,
        time: row.time,
        priority: row.priority,
        completed: row.completed,
        createdAt: row.created_at
      })
    })
    setTasks(grouped)
  }
  loadTasks()
}, [user])

  // Keyboard shortcuts
  useEffect(()=>{
    function onKey(e) {
      if(e.target.tagName==="INPUT"||e.target.tagName==="TEXTAREA") return;
      if((e.key==="n"||e.key==="N")&&!modal&&!showAI) openAdd();
      if(e.key==="ArrowLeft") setSelected(s=>addDays(s,-1));
      if(e.key==="ArrowRight") setSelected(s=>addDays(s,1));
      if(e.key==="Escape") { setModal(false); setShowAI(false); setShowCal(false); }
    }
    window.addEventListener("keydown",onKey);
    return ()=>window.removeEventListener("keydown",onKey);
  },[modal,showAI]);

const save = useCallback(async (newTasks) => {
  setTasks(newTasks)
  // Save to localStorage as fallback
  try { await window.storage.set("planner_v2", JSON.stringify(newTasks)) } catch {}
  // Save to Supabase if logged in
  if (!user) return
  try {
    const allRows = []
    Object.entries(newTasks).forEach(([date, list]) => {
      list.forEach(t => {
        allRows.push({
          user_id: user.id,
          task_id: t.id,
          date_str: date,
          title: t.title,
          note: t.note || '',
          time: t.time || '',
          priority: t.priority,
          completed: t.completed,
          created_at: t.createdAt || new Date().toISOString()
        })
      })
    })
    // Delete old tasks for this user
    await supabase.from('tasks').delete().eq('user_id', user.id)
    // Insert new tasks (batch insert in chunks of 100)
    if (allRows.length > 0) {
      for (let i = 0; i < allRows.length; i += 100) {
        const chunk = allRows.slice(i, i + 100)
        await supabase.from('tasks').insert(chunk)
      }
    }
  } catch {}
}, [user])

  // Sync cal month when selected changes
  useEffect(()=>{
    const d=strToDate(selected);
    setCalMonth({y:d.getFullYear(),m:d.getMonth()});
  },[selected]);

  const dayTasks = tasks[selected]||[];
  const done  = dayTasks.filter(t=>t.completed).length;
  const total = dayTasks.length;
  const rel   = relLabel(selected);
  const d     = strToDate(selected);
  const sorted = [...dayTasks].sort((a,b)=>{
    if(a.completed!==b.completed) return a.completed?1:-1;
    return PO[a.priority]-PO[b.priority];
  });

  // Overdue count (past days with incomplete tasks)
  const overdueCount = Object.entries(tasks).filter(([date,list])=>
    date<today && list.some(t=>!t.completed)
  ).length;

  function openAdd()  { setForm(EMPTY_FORM); setEditing(null); setModal(true); }
  function openEdit(t){ setForm({title:t.title,note:t.note||"",time:t.time||"",priority:t.priority}); setEditing(t); setModal(true); }

  function submit() {
    if(!form.title.trim()) return;
    const all={...tasks}, list=[...(all[selected]||[])];
    if(editing){ const i=list.findIndex(t=>t.id===editing.id); if(i>=0) list[i]={...list[i],...form,title:form.title.trim()}; }
    else {
      const newId=uid();
      list.push({id:newId,...form,title:form.title.trim(),completed:false,createdAt:new Date().toISOString()});
      setNewTaskId(newId);
      setTimeout(()=>setNewTaskId(null),800);
    }
    all[selected]=list; save(all); setModal(false);
  }

  function addAISuggestion(s) {
    const all={...tasks}, list=[...(all[selected]||[])];
    const newId=uid();
    list.push({id:newId,title:s.title,note:s.note||"",time:"",priority:s.priority||"medium",completed:false,createdAt:new Date().toISOString()});
    all[selected]=list; save(all);
  }

  function toggle(id){ const all={...tasks}; all[selected]=(all[selected]||[]).map(t=>t.id===id?{...t,completed:!t.completed}:t); save(all); }
  function remove(id){ const all={...tasks}; all[selected]=(all[selected]||[]).filter(t=>t.id!==id); save(all); }
  function clearDone(){ const all={...tasks}; all[selected]=(all[selected]||[]).filter(t=>!t.completed); save(all); }

  const weekDays = Array.from({length:7},(_,i)=>addDays(today,-3+i));

  if(!loaded) return (
    <div style={{background:"#0C0C0C",minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{textAlign:"center"}}>
        <div style={{fontSize:28,marginBottom:12,opacity:0.6}}>✦</div>
        <div style={{color:"#555",fontFamily:"'DM Sans',sans-serif",fontSize:13}}>Загрузка...</div>
      </div>
    </div>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        body{background:#0C0C0C;overscroll-behavior:none;}
        ::-webkit-scrollbar{width:4px;}
        ::-webkit-scrollbar-track{background:transparent;}
        ::-webkit-scrollbar-thumb{background:#252525;border-radius:2px;}
        .act-btn{background:transparent;border:none;cursor:pointer;font-size:13px;padding:4px 5px;border-radius:6px;opacity:0.3;transition:opacity 0.15s,transform 0.15s;}
        .act-btn:hover{opacity:1;transform:scale(1.15);}
        .check-btn:hover{transform:scale(1.12);}
        input[type=time]{color-scheme:dark;}
        input:focus,textarea:focus{outline:none;border-color:#333!important;box-shadow:0 0 0 2px rgba(232,168,124,0.1);}
        .task-card:hover .act-btn{opacity:0.5;}
        .task-new{animation:taskIn 0.35s cubic-bezier(0.34,1.56,0.64,1);}
        @keyframes taskIn{from{opacity:0;transform:translateY(-8px) scale(0.97);}to{opacity:1;transform:none;}}
        .modal-box{animation:modalIn 0.25s cubic-bezier(0.34,1.3,0.64,1);}
        @keyframes modalIn{from{opacity:0;transform:scale(0.95) translateY(10px);}to{opacity:1;transform:none;}}
        .week-btn:hover{background:rgba(232,168,124,0.07)!important;border-color:#333!important;}
        .ai-spinner{width:32px;height:32px;border:2px solid #252525;border-top-color:#E8A87C;border-radius:50%;animation:spin 0.8s linear infinite;margin:0 auto;}
        @keyframes spin{to{transform:rotate(360deg);}}
        .sidebar-desktop{display:block;}
        .fab-btn:hover{transform:scale(1.1);box-shadow:0 6px 30px rgba(232,168,124,0.55)!important;}
        @media(max-width:680px){
          .layout{flex-direction:column!important;}
          .sidebar-desktop{display:none;}
          .sidebar-mobile{display:block;}
          .main-area{padding:16px 14px!important;}
          .week-label{display:none!important;}
        }
        @media(min-width:681px){
          .sidebar-mobile{display:none!important;}
          .cal-toggle{display:none!important;}
        }
      `}</style>

      <div style={{background:"#0C0C0C",minHeight:"100vh",color:"#C8C0B8",fontFamily:"'DM Sans',sans-serif",display:"flex",flexDirection:"column"}}>

        {/* ── Header ── */}
        <header style={{borderBottom:"1px solid #191919",padding:"12px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",background:"#0D0D0D",position:"sticky",top:0,zIndex:10}}>
          <div style={{display:"flex",alignItems:"center",gap:9}}>
            <span style={{fontSize:18}}>✦</span>
            <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:21,fontWeight:700,color:"#E8A87C",letterSpacing:0.3}}>
              Планер
            </span>
            {overdueCount>0&&(
              <span style={{
                fontSize:10,padding:"2px 8px",borderRadius:99,
                background:"rgba(255,112,112,0.12)",color:"#FF7070",
                border:"1px solid rgba(255,112,112,0.2)",
              }}>{overdueCount} просрочено</span>
            )}
          </div>
          <div style={{display:"flex",gap:7,alignItems:"center"}}>
            {selected!==today&&(
              <button onClick={()=>setSelected(today)} style={{
                background:"rgba(232,168,124,0.08)",color:"#E8A87C",
                border:"1px solid rgba(232,168,124,0.2)",borderRadius:20,
                padding:"5px 13px",fontSize:12,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",
                transition:"background 0.15s",
              }}>Сегодня</button>
            )}
            <button className="cal-toggle" onClick={()=>setShowCal(v=>!v)} style={{
              background:showCal?"rgba(232,168,124,0.12)":"transparent",
              border:"1px solid #242424",borderRadius:8,padding:"5px 9px",
              color:showCal?"#E8A87C":"#555",cursor:"pointer",fontSize:15,lineHeight:1,
              transition:"all 0.15s",
            }}>📅</button>
            <div style={{fontSize:11,color:"#333",display:"flex",flexDirection:"column",alignItems:"flex-end",gap:1}}>
              <span style={{letterSpacing:0.5}}>N — добавить</span>
              <span style={{letterSpacing:0.5}}>← → — навигация</span>
            </div>
          </div>
        </header>

        {/* ── Body ── */}
        <div className="layout" style={{display:"flex",flex:1,minHeight:0}}>

          {/* ── Sidebar Desktop ── */}
          <div className="sidebar-desktop" style={{
            width:252,borderRight:"1px solid #191919",background:"#0D0D0D",flexShrink:0,overflowY:"auto",
          }}>
            <SidebarContent {...{calMonth,setCalMonth,selected,setSelected,tasks,today,done,total,onClose:null}} />
          </div>

          {/* ── Sidebar Mobile (dropdown) ── */}
          {showCal&&(
            <div className="sidebar-mobile" style={{
              borderBottom:"1px solid #191919",background:"#0D0D0D",
            }}>
              <SidebarContent {...{calMonth,setCalMonth,selected,setSelected,tasks,today,done,total,onClose:()=>setShowCal(false)}} />
            </div>
          )}

          {/* ── Main ── */}
          <div className="main-area" style={{flex:1,padding:"22px 26px",overflowY:"auto",minWidth:0}}>

            {/* Date header */}
            <div style={{marginBottom:20}}>
              <div style={{display:"flex",alignItems:"baseline",gap:10,flexWrap:"wrap",marginBottom:3}}>
                <h1 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:38,fontWeight:700,color:"#F0E8DE",lineHeight:1}}>
                  {d.getDate()} {MONTHS_GEN[d.getMonth()]}
                </h1>
                {rel&&(
                  <span style={{
                    padding:"3px 12px",borderRadius:20,fontSize:11.5,fontWeight:500,
                    background:rel==="Сегодня"?"rgba(232,168,124,0.13)":"rgba(255,255,255,0.04)",
                    color:rel==="Сегодня"?"#E8A87C":"#555",
                    border:`1px solid ${rel==="Сегодня"?"rgba(232,168,124,0.28)":"#222"}`,
                  }}>{rel}</span>
                )}
                {isPast && dayTasks.some(t=>!t.completed) && (
                  <span style={{
                    padding:"3px 12px",borderRadius:20,fontSize:11.5,
                    background:"rgba(255,112,112,0.1)",color:"#FF7070",
                    border:"1px solid rgba(255,112,112,0.2)",
                  }}>⚠ Есть незавершённые</span>
                )}
              </div>
              <div style={{fontSize:12.5,color:"#333",textTransform:"capitalize"}}>
                {DAYS_FULL[d.getDay()]}, {d.getFullYear()} г.
              </div>
            </div>

            {/* Week strip */}
            <div style={{display:"flex",gap:5,marginBottom:22,overflowX:"auto",paddingBottom:2}}>
              {weekDays.map(ds=>{
                const dd=strToDate(ds);
                const isSel=ds===selected, isT=ds===today;
                const wTasks=tasks[ds]||[];
                const wDone=wTasks.filter(t=>t.completed).length;
                const wOverdue=ds<today&&wTasks.length>0&&wDone<wTasks.length;
                return (
                  <button key={ds} onClick={()=>setSelected(ds)} className="week-btn" style={{
                    display:"flex",flexDirection:"column",alignItems:"center",gap:3,
                    padding:"9px 12px",borderRadius:12,cursor:"pointer",flexShrink:0,
                    border:`1px solid ${isSel?"rgba(232,168,124,0.6)":isT?"rgba(232,168,124,0.18)":"#1e1e1e"}`,
                    background:isSel?"rgba(232,168,124,0.1)":isT?"rgba(232,168,124,0.04)":"transparent",
                    transition:"all 0.15s",
                  }}>
                    <span className="week-label" style={{fontSize:9.5,color:"#3a3a3a",letterSpacing:0.5,fontWeight:700}}>
                      {DAYS_SHORT[(dd.getDay()+6)%7]}
                    </span>
                    <span style={{fontSize:15,fontWeight:700,color:isSel?"#E8A87C":isT?"#E8A87C":wOverdue?"#FF7070":"#555"}}>
                      {dd.getDate()}
                    </span>
                    {wTasks.length>0?(
                      <div style={{
                        width:5,height:5,borderRadius:"50%",
                        background:wOverdue?"#FF7070":wDone===wTasks.length?"#6DBF7E":"#E8A87C",
                      }}/>
                    ):<div style={{width:5,height:5}}/>}
                  </button>
                );
              })}
            </div>

            {/* Toolbar */}
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14,gap:8,flexWrap:"wrap"}}>
              <span style={{fontSize:12.5,color:"#383838"}}>
                {total===0?"Задач нет":`${total} ${total===1?"задача":total<5?"задачи":"задач"}`}
                {done>0&&` · ${done} выполнено`}
              </span>
              <div style={{display:"flex",gap:7,alignItems:"center"}}>
                {done>0&&(
                  <button onClick={clearDone} style={{
                    background:"transparent",color:"#444",border:"1px solid #242424",
                    borderRadius:20,padding:"5px 12px",fontSize:12,cursor:"pointer",
                    fontFamily:"'DM Sans',sans-serif",transition:"all 0.15s",
                  }}>Очистить выполненные</button>
                )}
                <button onClick={()=>setShowAI(true)} style={{
                  background:"rgba(124,168,232,0.08)",color:"#7CA8E8",
                  border:"1px solid rgba(124,168,232,0.2)",borderRadius:20,
                  padding:"5px 13px",fontSize:12,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",
                  display:"flex",alignItems:"center",gap:5,transition:"all 0.15s",
                }}>✨ AI</button>
                <button onClick={openAdd} style={{
                  background:"rgba(232,168,124,0.1)",color:"#E8A87C",
                  border:"1px solid rgba(232,168,124,0.22)",borderRadius:20,
                  padding:"5px 14px",fontSize:12,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",
                  display:"flex",alignItems:"center",gap:5,transition:"all 0.15s",
                }}>
                  <span style={{fontSize:16,lineHeight:1,marginTop:-1}}>+</span> Задача
                </button>
              </div>
            </div>

            {/* Task list */}
            <div style={{display:"flex",flexDirection:"column",gap:7,paddingBottom:90}}>
              {sorted.length===0?(
                <div style={{textAlign:"center",padding:"56px 20px",opacity:0.25}}>
                  <div style={{fontSize:32,marginBottom:12}}>✦</div>
                  <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:19,marginBottom:5}}>
                    {isPast?"День прошёл чисто":"Задач нет"}
                  </div>
                  <div style={{fontSize:12.5}}>
                    {isPast?"Нечего переносить — отличная работа":"Нажми + или N чтобы добавить задачу"}
                  </div>
                </div>
              ):sorted.map(task=>(
                <TaskCard key={task.id} task={task}
                  isNew={task.id===newTaskId}
                  onToggle={()=>toggle(task.id)}
                  onEdit={()=>openEdit(task)}
                  onDelete={()=>remove(task.id)}/>
              ))}
            </div>

            {/* FAB */}
            <button onClick={openAdd} title="Добавить задачу (N)" className="fab-btn" style={{
              position:"fixed",bottom:26,right:26,width:52,height:52,borderRadius:"50%",
              background:"#E8A87C",color:"#0C0C0C",border:"none",fontSize:26,
              cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",
              boxShadow:"0 4px 22px rgba(232,168,124,0.35)",transition:"transform 0.15s,box-shadow 0.15s",
              fontWeight:300,lineHeight:1,
            }}>+</button>
          </div>
        </div>

        {modal&&(
          <Modal editing={editing} form={form} setForm={setForm}
            onSubmit={submit} onClose={()=>setModal(false)} selectedDate={selected}/>
        )}
        {showAI&&(
          <AISuggestPanel dateStr={selected} existingTasks={dayTasks}
            onAdd={addAISuggestion} onClose={()=>setShowAI(false)}/>
        )}
      </div>
    </>
  );
}

// ── SidebarContent ────────────────────────────────────────────────────────────
function SidebarContent({ calMonth,setCalMonth,selected,setSelected,tasks,today,done,total,onClose }) {
  const dayTasks=tasks[selected]||[];
  const d=done, t=total;
  return (
    <div>
      <MiniCalendar {...{calMonth,setCalMonth,selected,setSelected,tasks,today,onClose}}/>

      <div style={{display:"flex",gap:7,padding:"0 14px 14px"}}>
        <button onClick={()=>setSelected(s=>addDays(s,-1))} style={dayNavSt}>‹ Пред.</button>
        <button onClick={()=>setSelected(s=>addDays(s,1))}  style={dayNavSt}>След. ›</button>
      </div>

      <div style={{margin:"0 14px 18px",background:"#111",border:"1px solid #1e1e1e",borderRadius:13,padding:"14px 15px"}}>
        <div style={secLabelSt}>Прогресс дня</div>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:12.5,marginBottom:5}}>
          <span style={{color:"#3a3a3a"}}>Всего</span>
          <span style={{fontWeight:600,color:"#888"}}>{t}</span>
        </div>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:12.5,marginBottom:11}}>
          <span style={{color:"#3a3a3a"}}>Выполнено</span>
          <span style={{fontWeight:600,color:"#6DBF7E"}}>{d}</span>
        </div>
        <div style={{background:"#1a1a1a",borderRadius:99,height:4,overflow:"hidden"}}>
          <div style={{
            width:`${t>0?(d/t)*100:0}%`,height:"100%",
            background:"linear-gradient(90deg,#E8A87C,#6DBF7E)",borderRadius:99,transition:"width 0.5s ease",
          }}/>
        </div>
        {t>0&&d===t&&(
          <div style={{textAlign:"center",marginTop:9,fontSize:11.5,color:"#6DBF7E",opacity:0.7}}>
            ✓ Всё выполнено!
          </div>
        )}
      </div>

      {/* Upcoming deadlines */}
      {(()=>{
        const upcoming=[];
        for(let i=1;i<=7;i++){
          const ds=addDays(today,i);
          (tasks[ds]||[]).filter(t=>t.priority==="deadline"&&!t.completed).forEach(t=>upcoming.push({date:ds,task:t}));
        }
        if(!upcoming.length) return null;
        return (
          <div style={{margin:"0 14px 18px"}}>
            <div style={secLabelSt}>Ближайшие дедлайны</div>
            {upcoming.slice(0,3).map(({date,task})=>{
              const dd=strToDate(date);
              return (
                <div key={task.id} onClick={()=>setSelected(date)} style={{
                  padding:"8px 12px",background:"rgba(255,112,112,0.06)",
                  border:"1px solid rgba(255,112,112,0.13)",borderRadius:10,marginBottom:5,cursor:"pointer",
                  transition:"background 0.15s",
                }}>
                  <div style={{fontSize:12,color:"#FF8A8A",marginBottom:1}}>{task.title}</div>
                  <div style={{fontSize:10.5,color:"#3a3a3a"}}>{dd.getDate()} {MONTHS_GEN[dd.getMonth()]}</div>
                </div>
              );
            })}
          </div>
        );
      })()}

      {/* Overdue days */}
      {(()=>{
        const overdue=Object.entries(tasks)
          .filter(([date,list])=>date<today&&list.some(t=>!t.completed))
          .sort(([a],[b])=>b.localeCompare(a))
          .slice(0,3);
        if(!overdue.length) return null;
        return (
          <div style={{margin:"0 14px 18px"}}>
            <div style={secLabelSt}>Просроченные</div>
            {overdue.map(([date,list])=>{
              const dd=strToDate(date);
              const cnt=list.filter(t=>!t.completed).length;
              return (
                <div key={date} onClick={()=>setSelected(date)} style={{
                  padding:"8px 12px",background:"rgba(255,112,112,0.05)",
                  border:"1px solid rgba(255,112,112,0.1)",borderRadius:10,marginBottom:5,cursor:"pointer",
                  display:"flex",alignItems:"center",justifyContent:"space-between",
                }}>
                  <span style={{fontSize:12,color:"#666"}}>{dd.getDate()} {MONTHS_GEN[dd.getMonth()]}</span>
                  <span style={{fontSize:10.5,color:"#FF7070"}}>{cnt} не выполн.</span>
                </div>
              );
            })}
          </div>
        );
      })()}
    </div>
  );
}

// Shared styles
const navBtnStyle = {background:"transparent",border:"none",color:"#555",fontSize:18,cursor:"pointer",padding:"2px 8px",lineHeight:1};
const dayNavSt = {flex:1,padding:"7px",background:"#111",border:"1px solid #1e1e1e",borderRadius:8,color:"#555",cursor:"pointer",fontSize:11.5,fontFamily:"'DM Sans',sans-serif",transition:"color 0.15s"};
const inputSt = {width:"100%",background:"#0C0C0C",border:"1px solid #222",borderRadius:10,padding:"11px 13px",color:"#DDD5CB",fontSize:14.5,fontFamily:"'DM Sans',sans-serif",marginBottom:11,transition:"border-color 0.2s,box-shadow 0.2s"};
const labelSt = {fontSize:10.5,color:"#333",marginBottom:6,letterSpacing:1.2,textTransform:"uppercase"};
const secLabelSt = {fontSize:9.5,color:"#2e2e2e",letterSpacing:1.5,textTransform:"uppercase",marginBottom:8,fontWeight:700};
