import { useState, useEffect, useRef } from "react";
import { X, Sparkles, Check, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const PRIORITY = {
  deadline: { label: "Дедлайн", color: "#FF7070", bg: "rgba(255,112,112,0.12)", icon: "🔥" },
  high:     { label: "Важное",   color: "#E8A87C", bg: "rgba(232,168,124,0.13)", icon: "⚡" },
  medium:   { label: "Обычное",  color: "#7CA8E8", bg: "rgba(124,168,232,0.12)", icon: "📌" },
  low:      { label: "Потом",    color: "#888",    bg: "rgba(140,140,140,0.10)", icon: "🌱" },
};

async function fetchAISuggestions(dateStr, existingTasks) {
  await new Promise(r => setTimeout(r, 1500));
  const suggestions = [
    { title: "Прогулка на свежем воздухе 🌿", priority: "medium", note: "Минимум 30 минут для ясности ума." },
    { title: "Заняться самообразованием 📚", priority: "high", note: "Прочитать главу книги или посмотреть урок." },
    { title: "Планирование следующей недели 🗓️", priority: "medium", note: "Записать ключевые цели и встречи." },
    { title: "Вечерний детокс 📵", priority: "low", note: "Без гаджетов за час до сна." },
    { title: "Сделать зарядку 🤸", priority: "high", note: "Разминка на 10-15 минут." },
    { title: "Уборка рабочего места ✨", priority: "medium", note: "Чистота вокруг — чистота в мыслях." }
  ];
  const existingTitles = new Set(existingTasks.map(t => t.title));
  return suggestions
    .filter(s => !existingTitles.has(s.title))
    .sort(() => 0.5 - Math.random())
    .slice(0, 4);
}

export default function AISuggestPanel({ dateStr, existingTasks, onAdd, onClose }) {
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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",backdropFilter:"blur(12px)",
        display:"flex",alignItems:"center",justifyContent:"center",zIndex:300,padding:16,
      }}
      onClick={e=>{if(e.target===e.currentTarget)onClose();}}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        style={{
          background:"#131313",borderRadius:28,padding:"28px",width:"100%",maxWidth:480,
          border:"1px solid #2a2a2a",boxShadow:"0 32px 80px rgba(0,0,0,0.8)",
        }}
      >
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:24}}>
          <div>
            <div style={{display:"flex",alignItems:"center",gap:8,color:"#E8A87C",marginBottom:4}}>
              <Sparkles size={20} />
              <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,fontWeight:700,letterSpacing:0.5}}>AI-подсказки</h2>
            </div>
            <p style={{fontSize:13,color:"#555"}}>Интеллектуальные идеи для вашего дня</p>
          </div>
          <button onClick={onClose} style={{background:"#1a1a1a",border:"none",color:"#555",width:32,height:32,borderRadius:"50%",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><X size={18} /></button>
        </div>

        {loading && (
          <div style={{padding:"48px 0",textAlign:"center"}}>
            <div className="ai-spinner" style={{width:40,height:40,border:"3px solid #222",borderTopColor:"#E8A87C",borderRadius:"50%",animation:"spin 1s linear infinite",margin:"0 auto"}} />
            <p style={{color:"#444",fontSize:14,marginTop:16,letterSpacing:0.5}}>Анализирую ваш график...</p>
          </div>
        )}

        {error && <p style={{color:"#FF7070",fontSize:13,padding:"16px 0",textAlign:"center"}}>{error}</p>}

        {!loading && !error && (
          <>
            <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:24}}>
              {suggestions.map((s,i)=>{
                const p=PRIORITY[s.priority]||PRIORITY.medium;
                const isSel=selected.has(i);
                return (
                  <motion.div
                    key={i}
                    whileTap={{ scale: 0.98 }}
                    onClick={()=>toggleSel(i)}
                    style={{
                      padding:"14px 16px",borderRadius:16,cursor:"pointer",
                      background:isSel?"rgba(232,168,124,0.08)":"#0E0E0E",
                      border:`1px solid ${isSel?"rgba(232,168,124,0.4)":"#1e1e1e"}`,
                      transition:"all 0.2s ease",
                    }}
                  >
                    <div style={{display:"flex",alignItems:"center",gap:12}}>
                      <div style={{
                        width:20,height:20,borderRadius:6,border:`2px solid ${isSel?"#E8A87C":"#333"}`,
                        background:isSel?"#E8A87C":"transparent",
                        display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all 0.2s",
                      }}>
                        {isSel && <Check size={14} color="#000" strokeWidth={4} />}
                      </div>
                      <div style={{flex:1}}>
                        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:2}}>
                           <span style={{fontSize:14.5,color:isSel?"#DDD5CB":"#888",fontWeight:600}}>{s.title}</span>
                           <span style={{fontSize:10,padding:"1px 7px",borderRadius:99,background:p.bg,color:p.color}}>{p.label}</span>
                        </div>
                        {s.note&&<p style={{fontSize:12,color:"#444"}}>{s.note}</p>}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
            <div style={{display:"flex",gap:12}}>
              <button onClick={onClose} style={{
                flex:1,padding:"13px",borderRadius:14,background:"transparent",
                border:"1px solid #252525",color:"#666",cursor:"pointer",
                fontFamily:"'DM Sans',sans-serif",fontSize:14,fontWeight:500
              }}>Отмена</button>
              <button onClick={addSelected} disabled={selected.size===0} style={{
                flex:2,padding:"13px",borderRadius:14,fontWeight:700,
                background:selected.size>0?"#E8A87C":"#1a1a1a",
                color:selected.size>0?"#000":"#444",
                border:"none",
                cursor:selected.size>0?"pointer":"default",
                fontFamily:"'DM Sans',sans-serif",fontSize:14,transition:"all 0.2s",
                display:"flex",alignItems:"center",justifyContent:"center",gap:8
              }}>
                {selected.size>0 ? (
                  <>Добавить ({selected.size}) <ChevronRight size={16} /></>
                ) : "Выберите задачи"}
              </button>
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}
