import { useState } from 'react'
import { supabase } from './supabaseClient'
import { motion, AnimatePresence } from 'framer-motion'
import { LogIn, UserPlus, ShieldCheck, Mail, Lock } from 'lucide-react'

export default function Auth({ onAuthSuccess }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLogin, setIsLogin] = useState(true)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email, password
        })
        if (error) throw error
        onAuthSuccess(data.user)
      } else {
        const { data, error } = await supabase.auth.signUp({
          email, password
        })
        if (error) throw error
        setMessage('Регистрация успешна! Загляните на почту для подтверждения аккаунта, затем войдите.')
        setIsLogin(true)
      }
    } catch (error) {
      setMessage(error.message === 'Invalid login credentials'
        ? 'Неверный email или пароль'
        : error.message === 'User already registered'
        ? 'Пользователь уже зарегистрирован'
        : error.message
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: '#080808', fontFamily: "'DM Sans',sans-serif"
    }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          background: '#121212', border: '1px solid #1e1e1e', borderRadius: 28,
          padding: '40px 32px', width: '100%', maxWidth: 420,
          boxShadow: '0 32px 80px rgba(0,0,0,0.7)'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
             width: 56, height: 56, background: 'rgba(232,168,124,0.1)',
             borderRadius: 16, display: 'flex', alignItems: 'center',
             justifyContent: 'center', margin: '0 auto 16px', color: '#E8A87C'
          }}>
             <ShieldCheck size={32} />
          </div>
          <h2 style={{
            fontFamily: "'Cormorant Garamond',serif", fontSize: 28,
            color: '#F0E8DE', fontWeight: 700, margin: 0
          }}>
            {isLogin ? 'Вход в Planner Pro' : 'Создать аккаунт'}
          </h2>
          <p style={{ color: '#555', fontSize: 14, marginTop: 8 }}>
             Управляйте задачами профессионально
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ position: 'relative' }}>
             <Mail size={18} style={{ position: 'absolute', left: 14, top: 14, color: '#444' }} />
             <input
               type="email" placeholder="Электронная почта" required
               value={email} onChange={e => setEmail(e.target.value)}
               style={{
                 width: '100%', background: '#000', border: '1px solid #222',
                 borderRadius: 12, padding: '13px 15px 13px 44px', color: '#DDD5CB',
                 fontSize: 15, fontFamily: "'DM Sans',sans-serif", outline: 'none',
                 transition: 'all 0.2s'
               }}
             />
          </div>

          <div style={{ position: 'relative' }}>
             <Lock size={18} style={{ position: 'absolute', left: 14, top: 14, color: '#444' }} />
             <input
               type="password" placeholder="Пароль" required
               value={password} onChange={e => setPassword(e.target.value)}
               style={{
                 width: '100%', background: '#000', border: '1px solid #222',
                 borderRadius: 12, padding: '13px 15px 13px 44px', color: '#DDD5CB',
                 fontSize: 15, fontFamily: "'DM Sans',sans-serif", outline: 'none',
                 transition: 'all 0.2s'
               }}
             />
          </div>

          <button type="submit" disabled={loading}
            style={{
              width: '100%', padding: '14px', borderRadius: 14,
              background: loading ? '#1a1a1a' : '#E8A87C',
              color: loading ? '#444' : '#000',
              border: 'none', fontWeight: 700, fontSize: 15,
              cursor: loading ? 'default' : 'pointer',
              fontFamily: "'DM Sans',sans-serif", transition: 'all 0.2s',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              marginTop: 8
            }}>
            {loading ? 'Загрузка...' : isLogin ? <><LogIn size={18} /> Войти</> : <><UserPlus size={18} /> Создать</>}
          </button>
        </form>

        <AnimatePresence>
          {message && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              style={{
                padding: '12px 14px', borderRadius: 12,
                background: message.includes('успешна') ? 'rgba(109,191,126,0.1)' : 'rgba(255,112,112,0.1)',
                color: message.includes('успешна') ? '#6DBF7E' : '#FF7070',
                fontSize: 13, marginTop: 20, textAlign: 'center', border: '1px solid rgba(255,255,255,0.05)'
              }}
            >
              {message}
            </motion.div>
          )}
        </AnimatePresence>

        <div style={{ textAlign: 'center', marginTop: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button onClick={() => { setIsLogin(!isLogin); setMessage('') }}
            style={{
              background: 'none', border: 'none', color: '#7CA8E8',
              cursor: 'pointer', fontSize: 13, fontFamily: "'DM Sans',sans-serif", fontWeight: 500
            }}>
            {isLogin ? 'Нет аккаунта? Зарегистрироваться' : 'Уже есть аккаунт? Войти'}
          </button>

          <div style={{ height: '1px', background: '#1e1e1e', margin: '8px 40px' }} />

          <button onClick={() => onAuthSuccess({ id: 'guest', email: 'guest@example.com' })}
            style={{
              background: 'rgba(255,255,255,0.03)', border: '1px solid #1e1e1e',
              borderRadius: 12, padding: '10px', color: '#888',
              cursor: 'pointer', fontSize: 13, fontFamily: "'DM Sans',sans-serif",
              transition: 'all 0.2s'
            }}
            onMouseOver={e => e.target.style.color = '#E8A87C'}
            onMouseOut={e => e.target.style.color = '#888'}
          >
            Продолжить как гость
          </button>
        </div>
      </motion.div>
    </div>
  )
}
