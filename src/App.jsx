import { useState, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, Sparkles, LayoutGrid, Calendar } from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';
import { supabase } from './supabaseClient';
import Auth from './Auth';
import TaskCard from './components/TaskCard';
import Sidebar from './components/Sidebar';
import AISuggestPanel from './components/AISuggestPanel';
import TaskModal from './components/TaskModal';

// ── Helpers ──────────────────────────────────────────────────────────────────
function todayStr() { return new Date().toISOString().split("T")[0]; }
function dateToStr(d) { return d.toISOString().split("T")[0]; }
function strToDate(s) { const [y,m,d]=s.split("-").map(Number); return new Date(y,m-1,d); }
function uid() { return Math.random().toString(36).slice(2)+Date.now().toString(36); }
function addDays(s,n) { const d=strToDate(s); d.setDate(d.getDate()+n); return dateToStr(d); }
function relLabel(s) {
  const t=todayStr();
  if(s===t) return "Сегодня";
  if(s===addDays(t,1)) return "Завтра";
  if(s===addDays(t,-1)) return "Вчера";
  return null;
}

const MONTHS_GEN = ["января","февраля","марта","апреля","мая","июня","июля","августа","сентября","октября","ноября","декабря"];
const DAYS_FULL  = ["воскресенье","понедельник","вторник","среда","четверг","пятница","суббота"];
const DAYS_SHORT = ["Пн","Вт","Ср","Чт","Пт","Сб","Вс"];
const EMPTY_FORM = { title:"", note:"", time:"", priority:"medium", category: "personal" };
const PO = {deadline:0,high:1,medium:2,low:3};

export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [tasks, setTasks] = useState({});
  const [selected, setSelected] = useState(todayStr());
  const [calMonth, setCalMonth] = useState(()=>{ const n=new Date(); return{y:n.getFullYear(),m:n.getMonth()}; });
  const [loaded, setLoaded] = useState(false);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [showAI, setShowAI] = useState(false);
  const [showMobileCal, setShowMobileCal] = useState(false);
  const [newTaskId, setNewTaskId] = useState(null);

  const today = todayStr();
  const isPast = selected < today;

  // 1. Initial Auth
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // 2. Load Tasks
  useEffect(() => {
    async function load() {
      try {
        const saved = localStorage.getItem("planner_v3");
        if (saved) setTasks(JSON.parse(saved));
      } catch {}

      if (user && user.id !== 'guest') {
        const { data, error } = await supabase.from('tasks').select('*').eq('user_id', user.id);
        if (error) {
           console.error("Supabase load error:", error);
        } else if (data) {
          const grouped = {};
          data.forEach(row => {
            if (!grouped[row.date_str]) grouped[row.date_str] = [];
            grouped[row.date_str].push({
              id: row.task_id, title: row.title, note: row.note, time: row.time,
              priority: row.priority, category: row.category || 'personal',
              completed: row.completed, createdAt: row.created_at
            });
          });
          setTasks(grouped);
          localStorage.setItem("planner_v3", JSON.stringify(grouped));
        }
      }
      setLoaded(true);
    }
    load();
  }, [user]);

  // 3. Sync with Error Handling
  const syncTask = async (dateStr, task, isDelete = false) => {
    if (!user || user.id === 'guest') return;

    try {
      if (isDelete) {
        const { error } = await supabase.from('tasks').delete().eq('user_id', user.id).eq('task_id', task.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('tasks').upsert({
          user_id: user.id,
          task_id: task.id,
          date_str: dateStr,
          title: task.title,
          note: task.note || '',
          time: task.time || '',
          priority: task.priority,
          category: task.category || 'personal',
          completed: task.completed,
          created_at: task.createdAt || new Date().toISOString()
        }, { onConflict: 'user_id,task_id' });
        if (error) throw error;
      }
    } catch (e) {
      console.error("Sync error:", e);
      toast.error("Ошибка синхронизации. Проверьте базу данных (Шаг 1 из инструкции).", { duration: 5000 });
    }
  };

  const saveState = (newTasks) => {
    setTasks(newTasks);
    localStorage.setItem("planner_v3", JSON.stringify(newTasks));
  };

  // Actions
  const toggleTask = (id) => {
    const all = { ...tasks };
    const list = [...(all[selected] || [])];
    const idx = list.findIndex(t => t.id === id);
    if (idx >= 0) {
      list[idx] = { ...list[idx], completed: !list[idx].completed };
      all[selected] = list;
      saveState(all);
      syncTask(selected, list[idx]);
    }
  };

  const deleteTask = (id) => {
    const all = { ...tasks };
    const taskToDelete = (all[selected] || []).find(t => t.id === id);
    if (taskToDelete) {
      all[selected] = (all[selected] || []).filter(t => t.id !== id);
      saveState(all);
      syncTask(selected, taskToDelete, true);
      toast.success("Задача удалена");
    }
  };

  const handleFormSubmit = () => {
    const title = form.title.trim();
    if (!title) {
       toast.error("Введите название задачи");
       return;
    }

    const all = { ...tasks }, list = [...(all[selected] || [])];
    let updatedTask;

    if (editing) {
      const i = list.findIndex(t => t.id === editing.id);
      if (i >= 0) {
        list[i] = { ...list[i], ...form, title };
        updatedTask = list[i];
      }
    } else {
      updatedTask = {
        id: uid(), ...form, title,
        completed: false, createdAt: new Date().toISOString()
      };
      list.push(updatedTask);
      setNewTaskId(updatedTask.id);
      setTimeout(() => setNewTaskId(null), 1000);
    }

    all[selected] = list;
    saveState(all);
    syncTask(selected, updatedTask);
    setModal(false);
    toast.success(editing ? "Обновлено" : "Добавлено");
  };

  const addAIItems = (items) => {
    const all = { ...tasks }, list = [...(all[selected] || [])];
    items.forEach(s => {
      const nt = {
        id: uid(), title: s.title, note: s.note || "", time: "",
        priority: s.priority || "medium", category: "personal",
        completed: false, createdAt: new Date().toISOString()
      };
      list.push(nt);
      syncTask(selected, nt);
    });
    all[selected] = list;
    saveState(all);
    toast.success(`Добавлено задач: ${items.length}`);
  };

  // Keyboard
  useEffect(() => {
    const onKey = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
      if (e.key === "n" || e.key === "N") { setForm(EMPTY_FORM); setEditing(null); setModal(true); }
      if (e.key === "ArrowLeft") setSelected(s => addDays(s, -1));
      if (e.key === "ArrowRight") setSelected(s => addDays(s, 1));
      if (e.key === "Escape") { setModal(false); setShowAI(false); setShowMobileCal(false); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (authLoading || !loaded) return <LoadingScreen />;
  if (!user) return <Auth onAuthSuccess={setUser} />;

  const dayTasks = tasks[selected] || [];
  const sorted = [...dayTasks].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    return PO[a.priority] - PO[b.priority];
  });
  const d = strToDate(selected);
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(today, -3 + i));

  return (
    <div className="app-container">
      <Toaster position="top-center" toastOptions={{ style: { background: '#181818', color: '#fff', border: '1px solid #222' } }} />

      <header className="main-header">
         <div className="header-left">
            <LayoutGrid className="logo-icon" />
            <span className="logo-text">Planner Pro</span>
         </div>
         <div className="header-right">
            <button className="mobile-cal-toggle" onClick={() => setShowMobileCal(!showMobileCal)}><Calendar size={20} /></button>
            {selected !== today && <button className="today-btn" onClick={() => setSelected(today)}>Сегодня</button>}
            <div className="kb-info">
               <span><strong>N</strong> новый</span>
               <span><strong>← →</strong> навигация</span>
            </div>
         </div>
      </header>

      <main className="main-layout">
        <Sidebar {...{ calMonth, setCalMonth, selected, setSelected, tasks, today }} />

        <AnimatePresence>
          {showMobileCal && (
            <motion.div
              initial={{ y: "-100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "-100%", opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="mobile-calendar-overlay"
            >
               <Sidebar {...{ calMonth, setCalMonth, selected, setSelected, tasks, today, onClose: () => setShowMobileCal(false), isMobile: true }} />
            </motion.div>
          )}
        </AnimatePresence>

        <section className="content-area">
          <div className="date-header">
            <div className="date-title">
               <h1>{d.getDate()} {MONTHS_GEN[d.getMonth()]}</h1>
               {relLabel(selected) && <span className="badge-rel">{relLabel(selected)}</span>}
            </div>
            <p className="date-subtitle">{DAYS_FULL[d.getDay()]}, {d.getFullYear()}</p>
          </div>

          <div className="week-strip">
             {weekDays.map(ds => {
                const dd = strToDate(ds);
                const isSel = ds === selected;
                const isT = ds === today;
                const hasTasks = (tasks[ds] || []).length > 0;
                return (
                  <button key={ds} onClick={() => setSelected(ds)} className={`week-day ${isSel?'active':''} ${isT?'today':''}`}>
                    <span className="wd-label">{DAYS_SHORT[(dd.getDay()+6)%7]}</span>
                    <span className="wd-num">{dd.getDate()}</span>
                    {hasTasks && <div className="wd-dot" />}
                  </button>
                );
             })}
          </div>

          <div className="toolbar">
             <div className="stats">{dayTasks.length} задач · {dayTasks.filter(t=>t.completed).length} готово</div>
             <div className="actions">
                <button onClick={() => setShowAI(true)} className="ai-btn"><Sparkles size={16} /> ✨ AI</button>
                <button onClick={() => { setForm(EMPTY_FORM); setEditing(null); setModal(true); }} className="add-btn"><Plus size={18} /> Задача</button>
             </div>
          </div>

          <div className="task-list">
             <AnimatePresence mode="popLayout">
               {sorted.length === 0 ? (
                 <motion.div initial={{opacity:0}} animate={{opacity:1}} key="empty" className="empty-state">
                   <div className="empty-icon">✦</div>
                   <h3>{isPast ? "День завершен" : "Задач пока нет"}</h3>
                   <p>{isPast ? "Всё успели — отличная работа!" : "Начните планировать прямо сейчас"}</p>
                 </motion.div>
               ) : sorted.map(t => (
                 <TaskCard key={t.id} task={t}
                   isNew={t.id === newTaskId}
                   onToggle={() => toggleTask(t.id)}
                   onDelete={() => deleteTask(t.id)}
                   onEdit={() => { setForm({title:t.title,note:t.note||"",time:t.time||"",priority:t.priority,category:t.category||"personal"}); setEditing(t); setModal(true); }}
                 />
               ))}
             </AnimatePresence>
          </div>
        </section>
      </main>

      <AnimatePresence>
        {modal && <TaskModal {...{ editing, form, setForm, selectedDate: selected, onClose: () => setModal(false), onSubmit: handleFormSubmit }} />}
        {showAI && <AISuggestPanel {...{ dateStr: selected, existingTasks: dayTasks, onClose: () => setShowAI(false), onAdd: addAIItems }} />}
      </AnimatePresence>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="loading-screen">
       <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 2 }} className="loading-logo">✦</motion.div>
       <p>Загрузка планировщика...</p>
    </div>
  );
}
