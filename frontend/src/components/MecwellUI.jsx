// Mecwell Design System — Shared UI Components

// Componente reutilizable para el header de cada página — Mecwell Design System
export function PageHeader({ title, subtitle, action }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
      marginBottom: 24,
    }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1A1C20', marginBottom: 4, lineHeight: 1.2 }}>{title}</h1>
        {subtitle && <p style={{ fontSize: 13, color: '#64748B' }}>{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

// Botón primario Mecwell
export function PrimaryButton({ children, onClick, type = 'button', disabled = false, className = '', style = {}, ...props }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={className}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        justifyContent: 'center',
        padding: '9px 18px',
        backgroundColor: disabled ? 'var(--color-border)' : 'var(--color-secondary)',
        color: '#ffffff',
        border: 'none',
        borderRadius: 'var(--radius-button)',
        fontSize: 13, fontWeight: 600,
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.15s',
        whiteSpace: 'nowrap',
        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
        ...style
      }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.backgroundColor = '#163d6f' }}
      onMouseLeave={e => { if (!disabled) e.currentTarget.style.backgroundColor = 'var(--color-secondary)' }}
      {...props}
    >
      {children}
    </button>
  )
}

// Card blanca con sombra sutil
export function Card({ children, style = {}, className = '', ...props }) {
  return (
    <div 
      className={className}
      style={{
        backgroundColor: 'var(--color-surface)',
        borderRadius: 'var(--radius-card)',
        boxShadow: 'var(--shadow-md)',
        border: '1px solid var(--color-border)',
        overflow: 'hidden',
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  )
}

// Tabla reutilizable estilizada
export function MwTable({ headers, children, loading, emptyMessage = 'Sin datos registrados.', className = '', ...props }) {
  return (
    <Card className={className} {...props}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--color-primary-dark)' }}>
              {headers.map((h, i) => (
                <th key={i} style={{
                  padding: '12px 20px',
                  textAlign: (typeof h === 'object' && h.right) ? 'right' : 'left',
                  fontSize: 11, fontWeight: 700, color: 'var(--color-text-secondary)',
                  textTransform: 'uppercase', letterSpacing: '0.05em',
                  borderBottom: '1px solid var(--color-border)', whiteSpace: 'nowrap',
                }}>
                  {typeof h === 'string' ? h : (h.label ?? '')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={headers.length} style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 13 }}>
                  Cargando...
                </td>
              </tr>
            ) : children}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

export function MwTr({ children, onClick, className = '', ...props }) {
  return (
    <tr
      onClick={onClick}
      className={className}
      style={{ borderBottom: '1px solid var(--color-border-light)', cursor: onClick ? 'pointer' : 'default', transition: 'background-color 0.15s' }}
      onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-primary-light)'}
      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
      {...props}
    >
      {children}
    </tr>
  )
}

export function MwTd({ children, bold, right, muted, style = {}, className = '', ...props }) {
  return (
    <td 
      className={className}
      style={{
        padding: '13px 20px', fontSize: 13, whiteSpace: 'nowrap',
        fontWeight: bold ? 600 : 400,
        color: muted ? 'var(--color-text-secondary)' : 'var(--color-text)',
        textAlign: right ? 'right' : 'left',
        ...style,
      }}
      {...props}
    >
      {children}
    </td>
  )
}

// Badge de estado
export function StatusBadge({ status }) {
  const map = {
    active:      { bg: 'var(--color-success-light)', text: '#155724', label: 'Activo' },
    activo:      { bg: 'var(--color-success-light)', text: '#155724', label: 'Activo' },
    inactive:    { bg: 'var(--color-primary-dark)', text: 'var(--color-text-secondary)', label: 'Inactivo' },
    inactivo:    { bg: 'var(--color-primary-dark)', text: 'var(--color-text-secondary)', label: 'Inactivo' },
    pending:     { bg: 'var(--color-warning-light)', text: '#856404', label: 'Pendiente' },
    pendiente:   { bg: 'var(--color-warning-light)', text: '#856404', label: 'Pendiente' },
    vencido:     { bg: 'var(--color-error-light)', text: '#721c24', label: 'Vencido' },
    'por vencer':{ bg: 'var(--color-warning-light)', text: '#856404', label: 'Por Vencer' },
    vigente:     { bg: 'var(--color-success-light)', text: '#155724', label: 'Vigente' },
    retornable:  { bg: 'var(--color-primary-dark)', text: 'var(--color-secondary)', label: 'Retornable' },
    consumible:  { bg: 'var(--color-success-light)', text: '#155724', label: 'Consumible' },
    blacklisted: { bg: 'var(--color-text)', text: '#FFFFFF', label: 'Lista Negra' },
  }
  const key = (status || '').toLowerCase()
  const c = map[key] || { bg: 'var(--color-primary-dark)', text: 'var(--color-text-secondary)', label: status || '—' }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '3px 10px', borderRadius: 99,
      fontSize: 11, fontWeight: 700,
      backgroundColor: c.bg, color: c.text,
    }}>
      {c.label}
    </span>
  )
}

// Wrapper de página — fondo + padding
export function PageWrapper({ children }) {
  return (
    <div style={{ padding: '32px', backgroundColor: '#F4F6F9', minHeight: '100%' }}>
      {children}
    </div>
  )
}

// Export aliases for compatibility
export { PageWrapper as MwPage, Card as MwCard, PrimaryButton as MwButton };
