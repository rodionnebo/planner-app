import React from 'react'

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Uncaught error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg-main)',
          color: 'var(--text-main)',
          textAlign: 'center',
          padding: 20
        }}>
          <h1 style={{ fontSize: 48 }}>Oops!</h1>
          <p style={{ color: 'var(--text-dim)', marginBottom: 20 }}>Произошла непредвиденная ошибка.</p>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: 'var(--accent)',
              color: '#000',
              border: 'none',
              padding: '10px 20px',
              borderRadius: 8,
              cursor: 'pointer'
            }}
          >
            Обновить страницу
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
