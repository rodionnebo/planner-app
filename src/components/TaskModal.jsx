import { useEffect, useRef } from "react";
import { X, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const PRIORITY = {
  deadline: { label: "Дедлайн", color: "#FF7070", bg: "rgba(255,112,112,0.12)", icon: "🔥" },
  high:     { label: "Важное",   color: "#E8A87C", bg: "rgba(232,168,124,0.13)", icon: "⚡" },
  medium:   { label: "Обычное",  color: "#7CA8E8", bg: "rgba(124,168,232,0.12)", icon: "📌" },
  low:      { label: "Потом",    color: "#888",    bg: "rgba(140,140,140,0.10)", icon: "🌱" },
};

const CATEGORIES = {
  personal: { label: "Личное", icon: "👤", color: "#A87CE8" },
  work:     { label: "Работа", icon: "💼", color: "#7CA8E8" },
  health:   { label: "Здоровье", icon: "🧘", color: "#6DBF7E" },
  finance:  { label: "Финансы", icon: "💰", color: "#E8C87C" }
};

const MONTHS_GEN = ["января","февраля","марта","апреля","мая","июня","июля","августа","сентября","октября","ноября","декабря"];
function strToDate(s) { const [y,m,d]=s.split("-").map(Number); return new Date(y,m-1,d); }

const inputSt = {width:"100%",background:"#0C0C0C",border:"1px solid #222",borderRadius:12,padding:"13px 15px",color:"#DDD5CB",fontSize:15,fontFamily:"'DM Sans',sans-serif",marginBottom:14,transition:"all 0.2s ease",outline:"none"};
const labelSt = {fontSize:11,color:"#444",marginBottom:8,letterSpacing:1.5,textTransform:"uppercase",fontWeight:700};

export default function TaskModal({ editing, form, setForm, onSubmit, onClose, selectedDate }) {
  const d = strToDate(selectedDate);
  const title = editing ? "Редактировать" : "Новая задача";
  const inputRef = useRef(null);

  useEffect(()=>{ setTimeout(()=>inputRef.current?.focus(),100); },[]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="modal-overlay"
      style={{
        position:"fixed",inset:0,background:"rgba(0,0,0,0.82)",backdropFilter:"blur(10px)",
        display:"flex",alignItems:"center",justifyContent:"center",zIndex:200,padding:"16px",
      }}
      onClick={e=>{if(e.target===e.currentTarget)onClose();}}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="modal-box"
        style={{
          background:"#111",borderRadius:28,padding:"32px 28px",width:"100%",maxWidth:480,
          border:"1px solid #2a2a2a",boxShadow:"0 28px 80px rgba(0,0,0,0.7)",
        }}
      >
        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:24}}>
          <div>
            <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:24,color:"#F0E8DE",fontWeight:700,marginBottom:4}}>{title}</h2>
            <div style={{display:"flex",alignItems:"center",gap:6,color:"#555",fontSize:13}}>
              <Calendar size={14} />
              <span>{d.getDate()} {MONTHS_GEN[d.getMonth()]} {d.getFullYear()}</span>
            </div>
          </div>
          <button onClick={onClose} style={{background:"#1a1a1a",border:"none",color:"#555",width:32,height:32,borderRadius:"50%",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><X size={18} /></button>
        </div>

        <div style={labelSt}>Название</div>
        <input ref={inputRef} placeholder="Что нужно сделать?"
          value={form.title} onChange={e=>setForm({...form,title:e.target.value})}
          onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey)onSubmit();if(e.key==="Escape")onClose();}}
          style={inputSt}/>

        <div style={labelSt}>Заметка</div>
        <textarea placeholder="Детали задачи..."
          value={form.note} onChange={e=>setForm({...form,note:e.target.value})}
          rows={3} style={{...inputSt,resize:"none",minHeight:90}}/>

        <div style={{display:"flex",gap:20,marginBottom:14}}>
           <div style={{flex:1}}>
              <div style={labelSt}>Время</div>
              <input type="time" value={form.time} onChange={e=>setForm({...form,time:e.target.value})} style={{...inputSt,marginBottom:0}}/>
           </div>
           <div style={{flex:2}}>
              <div style={labelSt}>Приоритет</div>
              <div style={{display:"flex",gap:6}}>
                {Object.entries(PRIORITY).map(([key,p])=>(
                  <button key={key} onClick={()=>setForm({...form,priority:key})} style={{
                    width:38, height:38, borderRadius:12, cursor:"pointer",
                    display:"flex", alignItems:"center", justifyContent:"center",
                    transition:"all 0.2s ease", fontSize:18,
                    border:`1px solid ${form.priority===key?p.color:"#222"}`,
                    background:form.priority===key?p.bg:"#0e0e0e",
                  }} title={p.label}>{p.icon}</button>
                ))}
              </div>
           </div>
        </div>

        <div style={labelSt}>Категория</div>
        <div style={{display:"flex",gap:8,marginBottom:24}}>
          {Object.entries(CATEGORIES).map(([key,c])=>(
            <button key={key} onClick={()=>setForm({...form,category:key})} style={{
              flex:1, padding:"10px", borderRadius:12, cursor:"pointer",
              display:"flex", flexDirection:"column", alignItems:"center", gap:4,
              transition:"all 0.2s ease", fontSize:11, fontWeight:600,
              border:`1px solid ${form.category===key?c.color:"#222"}`,
              background:form.category===key?"rgba(255,255,255,0.03)":"#0e0e0e",
              color:form.category===key?c.color:"#555"
            }}>
              <span style={{fontSize:16}}>{c.icon}</span>
              {c.label}
            </button>
          ))}
        </div>

        <div style={{display:"flex",gap:12}}>
          <button onClick={onClose} style={{
            flex:1,padding:"14px",borderRadius:14,background:"transparent",
            border:"1px solid #252525",color:"#666",cursor:"pointer",
            fontFamily:"'DM Sans',sans-serif",fontSize:14,fontWeight:600
          }}>Отмена</button>
          <button onClick={onSubmit} disabled={!form.title.trim()} style={{
            flex:2,padding:"14px",borderRadius:14,
            background:form.title.trim()?"#E8A87C":"#1a1a1a",
            color:form.title.trim()?"#000":"#444",
            border:"none",cursor:form.title.trim()?"pointer":"default",
            fontWeight:700,fontFamily:"'DM Sans',sans-serif",fontSize:14,transition:"all 0.2s",
          }}>{editing?"Сохранить изменения":"Создать задачу"}</button>
        </div>
      </motion.div>
    </motion.div>
  );
}
