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
        backgroundColor: disabled ? '#93B4D4' : '#1E4D8C',
        color: '#fff',
        border: 'none',
        borderRadius: 8,
        fontSize: 13, fontWeight: 600,
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'background-color 0.15s',
        whiteSpace: 'nowrap',
        ...style
      }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.backgroundColor = '#163d6f' }}
      onMouseLeave={e => { if (!disabled) e.currentTarget.style.backgroundColor = '#1E4D8C' }}
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
        backgroundColor: '#fff',
        borderRadius: 12,
        boxShadow: '0 1px 3px rgba(30,77,140,0.06)',
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
            <tr style={{ backgroundColor: '#F8FAFC' }}>
              {headers.map((h, i) => (
                <th key={i} style={{
                  padding: '12px 20px',
                  textAlign: (typeof h === 'object' && h.right) ? 'right' : 'left',
                  fontSize: 11, fontWeight: 600, color: '#64748B',
                  textTransform: 'uppercase', letterSpacing: '0.05em',
                  borderBottom: '1px solid #F1F5F9', whiteSpace: 'nowrap',
                }}>
                  {typeof h === 'string' ? h : (h.label ?? '')}
                </th>
              ))}

            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={headers.length} style={{ padding: '40px 20px', textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>
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
      style={{ borderBottom: '1px solid #F8FAFC', cursor: onClick ? 'pointer' : 'default' }}
      onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F8FAFC'}
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
        color: muted ? '#64748B' : '#1A1C20',
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
    active:      { bg: '#D1FAE5', text: '#065F46', label: 'Activo' },
    activo:      { bg: '#D1FAE5', text: '#065F46', label: 'Activo' },
    inactive:    { bg: '#F1F5F9', text: '#64748B', label: 'Inactivo' },
    inactivo:    { bg: '#F1F5F9', text: '#64748B', label: 'Inactivo' },
    pending:     { bg: '#FEF3C7', text: '#92400E', label: 'Pendiente' },
    pendiente:   { bg: '#FEF3C7', text: '#92400E', label: 'Pendiente' },
    vencido:     { bg: '#FEE2E2', text: '#991B1B', label: 'Vencido' },
    'por vencer':{ bg: '#FEF3C7', text: '#92400E', label: 'Por Vencer' },
    vigente:     { bg: '#D1FAE5', text: '#065F46', label: 'Vigente' },
    retornable:  { bg: '#DBEAFE', text: '#1E40AF', label: 'Retornable' },
    consumible:  { bg: '#F0FDF4', text: '#166534', label: 'Consumible' },
    blacklisted: { bg: '#111827', text: '#FFFFFF', label: 'Lista Negra' },
  }
  const key = (status || '').toLowerCase()
  const c = map[key] || { bg: '#F1F5F9', text: '#64748B', label: status || '—' }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '3px 10px', borderRadius: 99,
      fontSize: 11, fontWeight: 600,
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
