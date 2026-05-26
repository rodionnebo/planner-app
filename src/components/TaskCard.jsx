import React from 'react';
import { Check, Trash2, Edit3, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

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

export default function TaskCard({ task, onToggle, onEdit, onDelete, isNew }) {
  const p = PRIORITY[task.priority] || PRIORITY.medium;
  const cat = CATEGORIES[task.category] || CATEGORIES.personal;

  return (
    <motion.div
      layout
      initial={isNew ? { opacity: 0, scale: 0.9 } : false}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`task-card ${task.completed ? 'completed' : ''}`}
      style={{
        background: task.completed ? "rgba(255,255,255,0.01)" : "#141414",
        border: `1px solid ${task.completed ? "#1a1a1a" : "#222"}`,
        borderLeft: `3px solid ${task.completed ? "#252525" : p.color}`,
        borderRadius: 16,
        padding: "14px 14px 14px 16px",
        display: "flex",
        alignItems: "center", /* Fix for Bug 3 */
        justifyContent: "space-between",
        gap: 12,
        opacity: task.completed ? 0.4 : 1,
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        marginBottom: 10,
      }}
    >
      <button
        onClick={onToggle}
        style={{
          width: 24, height: 24, borderRadius: 8, flexShrink: 0, marginTop: 1,
          border: `2px solid ${task.completed ? "#6DBF7E" : p.color}`,
          background: task.completed ? "rgba(109,191,126,0.15)" : "transparent",
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          transition: "all 0.2s", padding: 0,
        }}
      >
        {task.completed && <Check size={16} color="#6DBF7E" strokeWidth={3} />}
      </button>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, marginBottom: task.note ? 6 : 0 }}>
          <span style={{
            fontSize: 15, fontWeight: 600, lineHeight: 1.4,
            textDecoration: task.completed ? "line-through" : "none",
            color: task.completed ? "#444" : "#F0E8DE",
            wordBreak: "break-word",
          }}>{task.title}</span>

          <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
            <span style={{
              fontSize: 10, padding: "2px 8px", borderRadius: 99, fontWeight: 700,
              background: p.bg, color: p.color, whiteSpace: "nowrap", letterSpacing: 0.5,
            }}>{p.icon} {p.label}</span>
            <span style={{
              fontSize: 10, padding: "2px 8px", borderRadius: 99, fontWeight: 700,
              background: "rgba(255,255,255,0.03)", color: cat.color, whiteSpace: "nowrap", border: `1px solid ${cat.color}33`
            }}>{cat.icon} {cat.label}</span>
          </div>

          {task.time && (
            <span style={{ fontSize: 11, color: "#555", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 4 }}>
              <Clock size={12} /> {task.time}
            </span>
          )}
        </div>
        {task.note && <div style={{ fontSize: 13, color: "#666", lineHeight: 1.5, wordBreak: "break-word" }}>{task.note}</div>}
      </div>

      <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
        <button onClick={onEdit} className="act-btn" title="Редактировать" style={{ width: 36, height: 36, minWidth: 36, flexShrink: 0 }}><Edit3 size={16} /></button>
        <button onClick={onDelete} className="act-btn" title="Удалить" style={{ width: 36, height: 36, minWidth: 36, flexShrink: 0 }}><Trash2 size={16} /></button>
      </div>
    </motion.div>
  );
}
