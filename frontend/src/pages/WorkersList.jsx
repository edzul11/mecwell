import { apiFetch } from '../supabaseClient'
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { PageWrapper, PageHeader, MwTable, MwTr, MwTd, StatusBadge } from '../components/MecwellUI'

function getInitials(first, last) {
  return `${(first || '').charAt(0)}${(last || '').charAt(0)}`.toUpperCase()
}

const AVATAR_COLORS = ['#1E4D8C', '#059669', '#7C3AED', '#D97706', '#0891B2']

export default function WorkersList() {
  const [workers, setWorkers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showInactive, setShowInactive] = useState(false)

  useEffect(() => {
    apiFetch('http://127.0.0.1:8000/api/v1/workers/')
      .then(r => r.json())
      .then(data => { setWorkers(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(err => { console.error(err); setLoading(false) })
  }, [])

  const filteredWorkers = workers.filter(w => {
    if (showInactive) return true
    const status = (w.status || '').toLowerCase()
    return status === 'active' || status === 'activo'
  })

  return (
    <PageWrapper>
      <PageHeader
        title="Trabajadores"
        subtitle={`${workers.length} personas registradas en el sistema`}
        action={
          <div className="flex gap-3">
            <button
              onClick={() => setShowInactive(!showInactive)}
              style={{
                padding: '9px 15px', borderRadius: 8, border: '1px solid #E2E8F0',
                backgroundColor: showInactive ? '#F1F5F9' : '#fff',
                fontSize: 12, fontWeight: 600, color: '#64748B', cursor: 'pointer'
              }}
            >
              {showInactive ? 'Ocultar Inactivos' : 'Ver Inactivos'}
            </button>
          </div>
        }
      />

      <MwTable
        loading={loading}
        headers={['Trabajador', 'RUT', 'Cargo', 'Faena', 'Turno', 'Estado', { label: '', right: true }]}
      >
        {filteredWorkers.length === 0 ? (
          <tr>
            <td colSpan={6} style={{ padding: '48px 20px', textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>
              No hay trabajadores {showInactive ? '' : 'activos'} registrados.
            </td>
          </tr>
        ) : filteredWorkers.map((w, i) => (
          <MwTr key={w.id}>
            <MwTd>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                  backgroundColor: AVATAR_COLORS[i % AVATAR_COLORS.length],
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 700, color: '#fff',
                }}>
                  {getInitials(w.first_name, w.last_name)}
                </div>
                <div>
                  <Link to={`/workers/${w.id}`} style={{ fontSize: 13, fontWeight: 600, color: '#1A1C20', textDecoration: 'none' }}
                    onMouseEnter={e => e.target.style.color = '#1E4D8C'}
                    onMouseLeave={e => e.target.style.color = '#1A1C20'}
                  >
                    {w.first_name} {w.last_name}
                  </Link>
                  <p style={{ fontSize: 12, color: '#94A3B8', marginTop: 1 }}>{w.email || 'Sin correo'}</p>
                </div>
              </div>
            </MwTd>
            <MwTd muted>{w.rut}</MwTd>
            <MwTd muted>{w.position}</MwTd>
            <MwTd>
              <span style={{ fontSize: 12, fontWeight: 500, color: '#475569' }}>
                {w.site?.name || 'Sin Faena'}
              </span>
            </MwTd>
            <MwTd>
              <span style={{
                padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 500,
                backgroundColor: '#F1F5F9', color: '#475569',
              }}>
                {w.shift || 'No definido'}
              </span>
            </MwTd>
            <MwTd>
              <StatusBadge status={w.blacklisted ? 'blacklisted' : (!w.site_id && w.status !== 'inactive' ? 'sin faena' : (w.status || 'active'))} />
            </MwTd>
            <MwTd right>
              <Link to={`/workers/${w.id}`} style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                fontSize: 12, fontWeight: 600, color: '#1E4D8C', textDecoration: 'none',
              }}>
                Ver Perfil <ChevronRight style={{ width: 14, height: 14 }} />
              </Link>
            </MwTd>
          </MwTr>
        ))}
      </MwTable>
    </PageWrapper>
  )
}
