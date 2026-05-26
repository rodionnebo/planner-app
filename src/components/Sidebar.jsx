import React from 'react';
import { X } from 'lucide-react';
import MiniCalendar from './MiniCalendar';

const MONTHS_GEN = ["января","февраля","марта","апреля","мая","июня","июля","августа","сентября","октября","ноября","декабря"];

function strToDate(s) { const [y,m,d]=s.split("-").map(Number); return new Date(y,m-1,d); }
function dateToStr(d) { return d.toISOString().split("T")[0]; }
function addDays(s,n) { const d=strToDate(s); d.setDate(d.getDate()+n); return dateToStr(d); }

const dayNavSt = {flex:1,padding:"7px",background:"#111",border:"1px solid #1e1e1e",borderRadius:8,color:"#555",cursor:"pointer",fontSize:11.5,fontFamily:"'DM Sans',sans-serif",transition:"color 0.15s"};
const secLabelSt = {fontSize:9.5,color:"#2e2e2e",letterSpacing:1.5,textTransform:"uppercase",marginBottom:8,fontWeight:700};

export default function Sidebar({ calMonth, setCalMonth, selected, setSelected, tasks, today, onClose, isMobile = false }) {
  const dayTasks = tasks[selected] || [];
  const total = dayTasks.length;
  const done = dayTasks.filter(t => t.completed).length;

  return (
    <aside className={isMobile ? "mobile-sidebar" : "desktop-sidebar"} style={{
      width: isMobile ? "100%" : 252,
      borderRight: isMobile ? "none" : "1px solid #191919",
      background: isMobile ? "transparent" : "#0D0D0D",
      flexShrink: 0,
      overflowY: "auto",
      height: "100%",
      position: "relative"
    }}>
      {isMobile && (
        <button
          onClick={onClose}
          style={{
            position: "absolute", top: 16, right: 16, zIndex: 10,
            background: "#1a1a1a", border: "none", color: "#555",
            width: 32, height: 32, borderRadius: "50%", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center"
          }}
        >
          <X size={18} />
        </button>
      )}
      <MiniCalendar {...{calMonth, setCalMonth, selected, setSelected, tasks, today, onClose}} />

      <div style={{display:"flex",gap:7,padding: isMobile ? "0 24px 24px" : "0 14px 14px"}}>
        <button onClick={()=>setSelected(s=>addDays(s,-1))} style={dayNavSt}>‹ Пред.</button>
        <button onClick={()=>setSelected(s=>addDays(s,1))}  style={dayNavSt}>След. ›</button>
      </div>

      <div style={{
        margin: isMobile ? "0 24px 24px" : "0 14px 18px",
        background: "#111", border: "1px solid #1e1e1e", borderRadius: 13, padding: "14px 15px"
      }}>
        <div style={secLabelSt}>Прогресс дня</div>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:12.5,marginBottom:5}}>
          <span style={{color:"#3a3a3a"}}>Всего</span>
          <span style={{fontWeight:600,color:"#888"}}>{total}</span>
        </div>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:12.5,marginBottom:11}}>
          <span style={{color:"#3a3a3a"}}>Выполнено</span>
          <span style={{fontWeight:600,color:"#6DBF7E"}}>{done}</span>
        </div>
        <div style={{background:"#1a1a1a",borderRadius:99,height:4,overflow:"hidden"}}>
          <div style={{
            width:`${total>0?(done/total)*100:0}%`,height:"100%",
            background:"linear-gradient(90deg,#E8A87C,#6DBF7E)",borderRadius:99,transition:"width 0.5s ease",
          }}/>
        </div>
      </div>

      {/* Overdue section */}
      {(() => {
        const overdue = Object.entries(tasks)
          .filter(([date, list]) => date < today && list.some(t => !t.completed))
          .sort(([a], [b]) => b.localeCompare(a))
          .slice(0, 3);
        if (!overdue.length) return null;
        return (
          <div style={{margin: isMobile ? "0 24px 24px" : "0 14px 18px"}}>
            <div style={secLabelSt}>Просроченные</div>
            {overdue.map(([date, list]) => {
              const dd = strToDate(date);
              const cnt = list.filter(t => !t.completed).length;
              return (
                <div key={date} onClick={() => setSelected(date)} style={{
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
    </aside>
  );
}
