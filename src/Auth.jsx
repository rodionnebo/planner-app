import { useState } from 'react'
import { supabase } from './supabaseClient'

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
        setMessage('Регистрация успешна! Теперь войди.')
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
      justifyContent: 'center', background: '#0C0C0C', fontFamily: "'DM Sans',sans-serif"
    }}>
      <div style={{
        background: '#111', border: '1px solid #272727', borderRadius: 22,
        padding: '32px 28px', width: '100%', maxWidth: 400,
        boxShadow: '0 28px 80px rgba(0,0,0,0.65)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <span style={{ fontSize: 24 }}>✦</span>
          <h2 style={{
            fontFamily: "'Cormorant Garamond',serif", fontSize: 24,
            color: '#E8A87C', fontWeight: 600, marginTop: 8
          }}>
            {isLogin ? 'Вход в Планер' : 'Регистрация'}
          </h2>
        </div>

        <form onSubmit={handleSubmit}>
          <input
            type="email" placeholder="Email" required
            value={email} onChange={e => setEmail(e.target.value)}
            style={{
              width: '100%', background: '#0C0C0C', border: '1px solid #222',
              borderRadius: 10, padding: '11px 13px', color: '#DDD5CB',
              fontSize: 14, fontFamily: "'DM Sans',sans-serif", marginBottom: 12,
              outline: 'none', transition: 'border-color 0.2s'
            }}
            onFocus={e => e.target.style.borderColor = '#333'}
            onBlur={e => e.target.style.borderColor = '#222'}
          />
          <input
            type="password" placeholder="Пароль (мин. 6 символов)" required
            value={password} onChange={e => setPassword(e.target.value)}
            style={{
              width: '100%', background: '#0C0C0C', border: '1px solid #222',
              borderRadius: 10, padding: '11px 13px', color: '#DDD5CB',
              fontSize: 14, fontFamily: "'DM Sans',sans-serif", marginBottom: 16,
              outline: 'none', transition: 'border-color 0.2s'
            }}
            onFocus={e => e.target.style.borderColor = '#333'}
            onBlur={e => e.target.style.borderColor = '#222'}
          />

          <button type="submit" disabled={loading}
            style={{
              width: '100%', padding: '12px', borderRadius: 11,
              background: loading ? '#1e1e1e' : '#E8A87C',
              color: loading ? '#444' : '#0C0C0C',
              border: 'none', fontWeight: 600, fontSize: 13.5,
              cursor: loading ? 'default' : 'pointer',
              fontFamily: "'DM Sans',sans-serif", transition: 'all 0.2s',
              marginBottom: 12
            }}>
            {loading ? 'Загрузка...' : isLogin ? 'Войти' : 'Зарегистрироваться'}
          </button>
        </form>

        {message && (
          <div style={{
            padding: '10px 12px', borderRadius: 8,
            background: message.includes('успешна') ? 'rgba(109,191,126,0.1)' : 'rgba(255,112,112,0.1)',
            color: message.includes('успешна') ? '#6DBF7E' : '#FF7070',
            fontSize: 12, marginBottom: 12, textAlign: 'center'
          }}>
            {message}
          </div>
        )}

        <div style={{ textAlign: 'center' }}>
          <button onClick={() => { setIsLogin(!isLogin); setMessage('') }}
            style={{
              background: 'none', border: 'none', color: '#7CA8E8',
              cursor: 'pointer', fontSize: 12, fontFamily: "'DM Sans',sans-serif"
            }}>
            {isLogin ? 'Нет аккаунта? Зарегистрироваться' : 'Уже есть аккаунт? Войти'}
          </button>
        </div>
      </div>
    </div>
  )
}