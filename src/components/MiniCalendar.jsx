import React from 'react';

const MONTHS = ["Январь","Февраль","Март","Апрель","Май","Июнь","Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь"];
const DAYS_SHORT = ["Пн","Вт","Ср","Чт","Пт","Сб","Вс"];

function getFirstDayMon(y,m) { const d=new Date(y,m,1).getDay(); return d===0?6:d-1; }
function getDaysInMonth(y,m) { return new Date(y,m+1,0).getDate(); }

const navBtnStyle = {background:"transparent",border:"none",color:"#555",fontSize:18,cursor:"pointer",padding:"2px 8px",lineHeight:1};

export default function MiniCalendar({ calMonth, setCalMonth, selected, setSelected, tasks, today, onClose }) {
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
