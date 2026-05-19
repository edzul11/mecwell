import { apiFetch } from '../supabaseClient'
import { useState, useEffect } from 'react'
import { Users, Building2, FileWarning, Wallet, Clock, UserPlus, FileText, Shield, TrendingUp } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { useFaena } from '../context/FaenaContext'

const STEEL_BLUE = '#1E4D8C'

// Badge de estado reutilizable
function StatusBadge({ status }) {
  const config = {
    vigente:        { bg: '#D1FAE5', text: '#065F46', label: 'Vigente' },
    'por vencer':   { bg: '#FEF3C7', text: '#92400E', label: 'Por Vencer' },
    vencido:        { bg: '#FEE2E2', text: '#991B1B', label: 'Vencido' },
  }
  const c = config[status] || config['vigente']
  return (
    <span style={{ backgroundColor: c.bg, color: c.text }}
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium">
      {c.label}
    </span>
  )
}

export default function Dashboard() {
  const { activeFaenaId, activeFaena } = useFaena()
  const [workers, setWorkers] = useState([])
  const [sites, setSites] = useState([])
  const [docs, setDocs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [workersRes, sitesRes, docsRes] = await Promise.all([
          apiFetch('http://127.0.0.1:8000/api/v1/workers/'),
          apiFetch('http://127.0.0.1:8000/api/v1/sites/'),
          apiFetch('http://127.0.0.1:8000/api/v1/documents/')
        ])
        const w = await workersRes.json()
        const s = await sitesRes.json()
        const d = await docsRes.json()
        setWorkers(Array.isArray(w) ? w : [])
        setSites(Array.isArray(s) ? s : [])
        setDocs(Array.isArray(d) ? d : [])
      } catch (err) {
        console.error("Failed to load dashboard data", err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // Data Filtering
  const filteredWorkers = activeFaenaId ? workers.filter(w => w.site_id === activeFaenaId) : workers
  const filteredSites = activeFaenaId ? sites.filter(s => s.id === activeFaenaId) : sites
  const filteredDocs = activeFaenaId 
    ? docs.filter(d => {
        const w = workers.find(x => x.id === d.worker_id)
        return w?.site_id === activeFaenaId
      })
    : docs

  // Compute stats dynamically
  const totalWorkers = filteredWorkers.length
  const totalSites = filteredSites.length
  const totalPayroll = filteredWorkers.reduce((acc, x) => acc + (x.base_salary || 0), 0)

  const today = new Date()
  const expiringDocs = filteredDocs.filter(doc => {
    if (!doc.expiration_date) return false
    const diffDays = Math.ceil((new Date(doc.expiration_date) - today) / 86400000)
    return diffDays <= 30
  }).length

  // Trabajadores por faena para el gráfico
  const workersBySite = filteredSites.map(site => ({
    name: site.name?.split(' ')[0] || site.name,
    fullName: site.name,
    count: filteredWorkers.filter(w => w.site_id === site.id).length
  })).filter(s => s.count > 0).sort((a, b) => b.count - a.count)

  // Próximos vencimientos
  const upcomingDocs = filteredDocs
    .filter(d => d.expiration_date)
    .map(d => {
      const diffDays = Math.ceil((new Date(d.expiration_date) - today) / 86400000)
      const w = workers.find(x => x.id === d.worker_id)
      const site = sites.find(s => s.id === w?.site_id)
      return { ...d, diffDays, workerName: w ? `${w.first_name} ${w.last_name}` : '—', siteName: site?.name || 'Sin faena' }
    })
    .sort((a, b) => a.diffDays - b.diffDays)
    .slice(0, 5)

  const getDocStatus = (diffDays) => {
    if (diffDays < 0) return 'vencido'
    if (diffDays <= 15) return 'por vencer'
    return 'vigente'
  }

  const metricCards = [
    {
      label: 'Trabajadores Activos',
      value: loading ? '—' : totalWorkers,
      sub: activeFaenaId ? 'En esta faena' : 'En todas las faenas',
      icon: Users,
      accent: STEEL_BLUE,
      accentLight: '#EFF6FF',
    },
    {
      label: 'Faenas Activas',
      value: loading ? '—' : totalSites,
      sub: activeFaenaId ? 'Faena seleccionada' : `${totalSites} en ejecución`,
      icon: Building2,
      accent: '#059669',
      accentLight: '#D1FAE5',
    },
    {
      label: 'Nómina Estimada',
      value: loading ? '—' : `$${totalPayroll.toLocaleString('es-CL')}`,
      sub: 'Sueldos base totales',
      icon: Wallet,
      accent: '#7C3AED',
      accentLight: '#EDE9FE',
    },
    {
      label: 'Documentos por Vencer',
      value: loading ? '—' : expiringDocs,
      sub: 'Próximos 30 días',
      icon: FileWarning,
      accent: expiringDocs > 0 ? '#DC2626' : '#059669',
      accentLight: expiringDocs > 0 ? '#FEE2E2' : '#D1FAE5',
    },
  ]

  const [activities, setActivities] = useState([])
  const [loadingActivities, setLoadingActivities] = useState(true)

  useEffect(() => {
    const fetchActivities = async () => {
      setLoadingActivities(true)
      try {
        const url = activeFaenaId 
          ? `http://127.0.0.1:8000/api/v1/dashboard/activities?site_id=${activeFaenaId}`
          : 'http://127.0.0.1:8000/api/v1/dashboard/activities'
        const res = await apiFetch(url)
        const data = await res.json()
        setActivities(Array.isArray(data) ? data : [])
      } catch (err) {
        console.error("Error al cargar actividades dinámicas:", err)
      } finally {
        setLoadingActivities(false)
      }
    }
    fetchActivities()
  }, [activeFaenaId, workers])

  const ICON_MAP = {
    UserPlus: UserPlus,
    FileText: FileText,
    Wallet: Wallet,
    Shield: Shield,
    TrendingUp: TrendingUp,
  }

  const getBgColor = (color) => {
    if (color === '#1E4D8C' || color === STEEL_BLUE) return '#EFF6FF'
    if (color === '#7C3AED') return '#EDE9FE'
    if (color === '#059669') return '#D1FAE5'
    if (color === '#D97706') return '#FEF3C7'
    return '#F1F5F9'
  }

  function formatRelativeTime(dateString) {
    if (!dateString) return '—'
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffSecs = Math.floor(diffMs / 1000)
    const diffMins = Math.floor(diffSecs / 60)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffSecs < 10) return 'Ahora mismo'
    if (diffMins < 1) return 'hace unos segundos'
    if (diffMins < 60) return `hace ${diffMins}m`
    if (diffHours < 24) return `hace ${diffHours}h`
    if (diffDays === 1) return 'hace 1 día'
    return `hace ${diffDays}d`
  }

  return (
    <div className="p-8 space-y-8" style={{ backgroundColor: '#F4F6F9', minHeight: '100%' }}>

      {/* Header */}
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1A1C20', marginBottom: 4 }}>
          Resumen General
        </h1>
        <p style={{ fontSize: 14, color: '#64748B' }}>
          {activeFaena ? `Vista Filtrada · ${activeFaena.name}` : 'Vista Global · Todas las Faenas'}
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-4 gap-6">
        {metricCards.map((card) => (
          <div
            key={card.label}
            style={{
              backgroundColor: '#fff',
              borderRadius: 12,
              boxShadow: '0 1px 3px rgba(30,77,140,0.06)',
              overflow: 'hidden',
              borderTop: `4px solid ${card.accent}`,
              padding: '20px 24px',
            }}
          >
            <div className="flex items-start justify-between">
              <div>
                <p style={{ fontSize: 12, fontWeight: 500, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                  {card.label}
                </p>
                <p style={{ fontSize: 32, fontWeight: 700, color: card.accent, lineHeight: 1, marginBottom: 6 }}>
                  {card.value}
                </p>
                <p style={{ fontSize: 12, color: '#94A3B8' }}>{card.sub}</p>
              </div>
              <div style={{ backgroundColor: card.accentLight, padding: 10, borderRadius: 10 }}>
                <card.icon style={{ width: 20, height: 20, color: card.accent }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Middle row */}
      <div className="grid grid-cols-5 gap-6">

        {/* Bar chart */}
        <div style={{ gridColumn: 'span 3', backgroundColor: '#fff', borderRadius: 12, boxShadow: '0 1px 3px rgba(30,77,140,0.06)', padding: '24px' }}>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 style={{ fontSize: 15, fontWeight: 600, color: '#1A1C20' }}>Trabajadores por Faena</h2>
              <p style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>Distribución actual del personal</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <TrendingUp style={{ width: 16, height: 16, color: STEEL_BLUE }} />
              <span style={{ fontSize: 12, color: STEEL_BLUE, fontWeight: 600 }}>{totalWorkers} total</span>
            </div>
          </div>
          <div style={{ height: 200 }}>
            {workersBySite.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={workersBySite} layout="vertical" barSize={20}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94A3B8' }} />
                  <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B', fontWeight: 500 }} width={80} />
                  <Tooltip
                    formatter={(v) => [`${v} trabajadores`, '']}
                    contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', fontSize: 13 }}
                  />
                  <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                    {workersBySite.map((_, i) => (
                      <Cell key={i} fill={i === 0 ? STEEL_BLUE : i === 1 ? '#3B82F6' : '#93C5FD'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full">
                <Building2 style={{ width: 32, height: 32, color: '#E2E8F0', marginBottom: 8 }} />
                <p style={{ fontSize: 13, color: '#94A3B8' }}>Sin datos de faenas activas</p>
              </div>
            )}
          </div>
        </div>

        {/* Activity feed */}
        <div style={{ gridColumn: 'span 2', backgroundColor: '#fff', borderRadius: 12, boxShadow: '0 1px 3px rgba(30,77,140,0.06)', padding: '24px' }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: '#1A1C20', marginBottom: 20 }}>Últimas Actividades</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {loadingActivities ? (
              <div className="flex flex-col items-center justify-center py-8">
                <Clock className="animate-spin text-slate-400" style={{ width: 24, height: 24, marginBottom: 8 }} />
                <p style={{ fontSize: 12, color: '#94A3B8' }}>Cargando actividades...</p>
              </div>
            ) : activities.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8">
                <Clock style={{ width: 24, height: 24, color: '#CBD5E1', marginBottom: 8 }} />
                <p style={{ fontSize: 12, color: '#94A3B8' }}>No hay actividades recientes</p>
              </div>
            ) : (
              activities.map((item, i) => {
                const IconComponent = ICON_MAP[item.icon] || Clock
                const bg = getBgColor(item.color)
                return (
                  <div key={i} className="flex items-start gap-3">
                    <div style={{ backgroundColor: bg, padding: 8, borderRadius: 8, flexShrink: 0 }}>
                      <IconComponent style={{ width: 16, height: 16, color: item.color }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 500, color: '#1A1C20', marginBottom: 2 }}>{item.title}</p>
                      <p style={{ fontSize: 12, color: '#94A3B8' }}>{item.subtitle}</p>
                    </div>
                    <span style={{ fontSize: 11, color: '#CBD5E1', flexShrink: 0 }}>{formatRelativeTime(item.time)}</span>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* Vencimientos table */}
      <div style={{ backgroundColor: '#fff', borderRadius: 12, boxShadow: '0 1px 3px rgba(30,77,140,0.06)', overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #F1F5F9' }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: '#1A1C20' }}>Próximos Vencimientos de Documentos</h2>
          <p style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>Documentos que vencen en los próximos 30 días o ya vencidos</p>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#F8FAFC' }}>
              {['Trabajador', 'Tipo Documento', 'Faena', 'Vencimiento', 'Estado'].map(h => (
                <th key={h} style={{ padding: '12px 24px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #F1F5F9' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {upcomingDocs.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '40px 24px', textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>
                  No hay documentos próximos a vencer.
                </td>
              </tr>
            ) : upcomingDocs.map((doc, i) => (
              <tr key={doc.id} style={{ borderBottom: '1px solid #F8FAFC' }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F8FAFC'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <td style={{ padding: '14px 24px', fontSize: 13, fontWeight: 500, color: '#1A1C20' }}>{doc.workerName}</td>
                <td style={{ padding: '14px 24px', fontSize: 13, color: '#64748B' }}>{doc.document_type}</td>
                <td style={{ padding: '14px 24px', fontSize: 13, color: '#64748B' }}>{doc.siteName}</td>
                <td style={{ padding: '14px 24px', fontSize: 13, color: '#64748B' }}>
                  {new Date(doc.expiration_date).toLocaleDateString('es-CL')}
                  <span style={{ marginLeft: 6, fontSize: 11, color: doc.diffDays < 0 ? '#DC2626' : '#D97706' }}>
                    {doc.diffDays < 0 ? `(hace ${Math.abs(doc.diffDays)}d)` : `(en ${doc.diffDays}d)`}
                  </span>
                </td>
                <td style={{ padding: '14px 24px' }}>
                  <StatusBadge status={getDocStatus(doc.diffDays)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  )
}
