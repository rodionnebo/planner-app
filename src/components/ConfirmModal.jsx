
export const ConfirmModal = ({ title, message, onConfirm, onCancel }) => {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.8)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 500,
        padding: 20,
      }}
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div
        style={{
          background: 'var(--bg-modal)',
          borderRadius: 20,
          padding: 24,
          width: '100%',
          maxWidth: 400,
          border: '1px solid var(--border-modal)',
          boxShadow: '0 32px 80px rgba(0,0,0,0.7)',
          textAlign: 'center',
        }}
      >
        <h3
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 20,
            color: 'var(--text-bright)',
            marginBottom: 12,
          }}
        >
          {title}
        </h3>
        <p style={{ color: 'var(--text-dim)', fontSize: 14, marginBottom: 24 }}>{message}</p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: 12,
              background: 'transparent',
              border: '1px solid var(--border-light)',
              color: 'var(--text-dim)',
              cursor: 'pointer',
              fontFamily: 'var(--font-main)',
              fontSize: 14,
            }}
          >
            Отмена
          </button>
          <button
            onClick={onConfirm}
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: 12,
              background: 'var(--error)',
              border: 'none',
              color: '#000',
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'var(--font-main)',
              fontSize: 14,
            }}
          >
            Удалить
          </button>
        </div>
      </div>
    </div>
  )
}
