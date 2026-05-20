import { AlertTriangle, X } from 'lucide-react'

export default function ConfirmModal({
  isOpen,
  title = '¿Estás seguro?',
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  onConfirm,
  onCancel,
  isDestructive = false
}) {
  if (!isOpen) return null

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(25, 28, 29, 0.65)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      animation: 'fadeIn 0.2s ease-out'
    }}>
      <div style={{
        width: '100%',
        maxWidth: 480,
        backgroundColor: '#ffffff',
        borderRadius: 'var(--radius-card)',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        overflow: 'hidden',
        borderTop: `4px solid ${isDestructive ? 'var(--color-error)' : 'var(--color-primary-accent)'}`,
        margin: '16px',
        animation: 'scaleIn 0.2s ease-out'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px 12px 24px',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 12
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              backgroundColor: isDestructive ? 'var(--color-error-light)' : 'var(--color-warning-light)',
              padding: 8,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <AlertTriangle style={{
                width: 20,
                height: 20,
                color: isDestructive ? 'var(--color-error)' : 'var(--color-secondary-container)'
              }} />
            </div>
            <h3 style={{
              fontSize: 16,
              fontWeight: 700,
              color: 'var(--color-text)',
              margin: 0
            }}>
              {title}
            </h3>
          </div>
          <button 
            onClick={onCancel}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-text-muted)',
              padding: 4,
              borderRadius: 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 0.15s'
            }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-primary-light)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <X style={{ width: 16, height: 16 }} />
          </button>
        </div>

        {/* Content */}
        <div style={{
          padding: '0 24px 24px 24px'
        }}>
          <p style={{
            fontSize: 13,
            color: 'var(--color-text-secondary)',
            lineHeight: 1.6,
            margin: 0,
            whiteSpace: 'pre-line'
          }}>
            {message}
          </p>
        </div>

        {/* Actions */}
        <div style={{
          backgroundColor: 'var(--color-surface-container)',
          padding: '16px 24px',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 12,
          borderTop: '1px solid var(--color-border-light)'
        }}>
          {cancelText && (
            <button
              onClick={onCancel}
              style={{
                padding: '8px 16px',
                backgroundColor: '#ffffff',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-button)',
                color: 'var(--color-text-secondary)',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.backgroundColor = 'var(--color-primary-light)'
                e.currentTarget.style.borderColor = 'var(--color-text-muted)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = '#ffffff'
                e.currentTarget.style.borderColor = 'var(--color-border)'
              }}
            >
              {cancelText}
            </button>
          )}
          <button
            onClick={onConfirm}
            style={{
              padding: '8px 16px',
              backgroundColor: isDestructive ? 'var(--color-error)' : 'var(--color-primary-accent)',
              border: 'none',
              borderRadius: 'var(--radius-button)',
              color: isDestructive ? '#ffffff' : '#1a1d20',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor = isDestructive ? '#b91c1c' : 'var(--color-secondary-container)'
              if (isDestructive) e.currentTarget.style.transform = 'translateY(-1px)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = isDestructive ? 'var(--color-error)' : 'var(--color-primary-accent)'
              if (isDestructive) e.currentTarget.style.transform = 'none'
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
      
      {/* Styles animation injected */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
