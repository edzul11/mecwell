import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { apiFetch } from '../supabaseClient'
import { Users, Wallet, Package, TrendingUp, MapPin, ArrowLeft, ChevronRight } from 'lucide-react'
import { PageWrapper, StatusBadge, Card, MwTable, MwTr, MwTd } from '../components/MecwellUI'

const TABS = [
  { id: 'overview',  label: 'Resumen',           Icon: TrendingUp },
  { id: 'personnel', label: 'Personal Asignado', Icon: Users      },
  { id: 'inventory', label: 'Inventario',        Icon: Package    },
  { id: 'expenses',  label: 'Gastos',            Icon: Wallet     },
]

export default function SiteProfile() {
  const { id } = useParams()
  const [site, setSite]           = useState(null)
  const [workers, setWorkers]     = useState([])
  const [allWorkers, setAllWorkers] = useState([])
  const [loading, setLoading]     = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [addingWorker, setAddingWorker] = useState(false)
  const [selectedWorkerId, setSelectedWorkerId] = useState('')
  const [assigning, setAssigning] = useState(false)

  const fetchData = async () => {
    try {
      const [siteRes, workersRes, allRes] = await Promise.all([
        apiFetch(`http://127.0.0.1:8000/api/v1/sites/${id}`),
        apiFetch(`http://127.0.0.1:8000/api/v1/workers/?site_id=${id}`),
        apiFetch(`http://127.0.0.1:8000/api/v1/workers/`)
      ])
      if (siteRes.ok) setSite(await siteRes.json())
      if (workersRes.ok) setWorkers(await workersRes.json())
      if (allRes.ok) setAllWorkers(await allRes.json())
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [id])

  const handleAssignWorker = async () => {
    if (!selectedWorkerId) return
    setAssigning(true)
    try {
      const res = await apiFetch(`http://127.0.0.1:8000/api/v1/workers/${selectedWorkerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ site_id: id })
      })
      if (!res.ok) throw new Error()
      setSelectedWorkerId('')
      setAddingWorker(false)
      // Refresh lists
      const [wRes, aRes] = await Promise.all([
        apiFetch(`http://127.0.0.1:8000/api/v1/workers/?site_id=${id}`),
        apiFetch(`http://127.0.0.1:8000/api/v1/workers/`)
      ])
      if (wRes.ok) setWorkers(await wRes.json())
      if (aRes.ok) setAllWorkers(await aRes.json())
    } catch { alert('Error al asignar el trabajador.') }
    finally { setAssigning(false) }
  }

  if (loading) return <PageWrapper><p style={{ color: '#94A3B8' }}>Cargando faena...</p></PageWrapper>
  if (!site)   return <PageWrapper><p style={{ color: '#DC2626' }}>Faena no encontrada.</p></PageWrapper>

  const totalBaseSalary = workers.reduce((acc, w) => acc + (w.base_salary || 0), 0)
  // Workers not assigned to this site (available to add)
  const availableWorkers = allWorkers.filter(w => w.site_id !== id)


  const metrics = [
    { label: 'Trabajadores',       value: workers.length,                                    accent: '#1E4D8C', accentLight: '#EFF6FF', Icon: Users      },
    { label: 'Costo Nómina Base',  value: `$${totalBaseSalary.toLocaleString('es-CL')}`,     accent: '#7C3AED', accentLight: '#EDE9FE', Icon: Wallet     },
    { label: 'Gastos Operativos',  value: '$0',                                              accent: '#D97706', accentLight: '#FEF3C7', Icon: TrendingUp },
  ]

  return (
    <PageWrapper>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, fontSize: 13 }}>
        <Link to="/sites" style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#64748B', textDecoration: 'none', fontWeight: 500 }}>
          <ArrowLeft style={{ width: 14, height: 14 }} /> Faenas
        </Link>
        <ChevronRight style={{ width: 14, height: 14, color: '#CBD5E1' }} />
        <span style={{ color: '#1A1C20', fontWeight: 600 }}>{site.name}</span>
      </div>

      {/* Header card with tabs */}
      <Card style={{ padding: '20px 24px', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: '#1A1C20', marginBottom: 4 }}>{site.name}</h1>
            {site.location && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 13, color: '#64748B' }}>
                <MapPin style={{ width: 13, height: 13 }} /> {site.location}
              </span>
            )}
          </div>
          <StatusBadge status={site.status || 'active'} />
        </div>
        <div style={{ display: 'flex', gap: 4, borderTop: '1px solid #F1F5F9', paddingTop: 14 }}>
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: activeTab === tab.id ? 600 : 500,
              backgroundColor: activeTab === tab.id ? '#EFF6FF' : 'transparent',
              color: activeTab === tab.id ? '#1E4D8C' : '#64748B',
            }}>
              <tab.Icon style={{ width: 14, height: 14 }} /> {tab.label}
            </button>
          ))}
        </div>
      </Card>

      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
          {metrics.map(m => (
            <div key={m.label} style={{ backgroundColor: '#fff', borderRadius: 12, padding: '20px 24px', boxShadow: '0 1px 3px rgba(30,77,140,0.06)', borderTop: `4px solid ${m.accent}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <p style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>{m.label}</p>
                  <p style={{ fontSize: 26, fontWeight: 700, color: m.accent }}>{m.value}</p>
                </div>
                <div style={{ backgroundColor: m.accentLight, padding: 10, borderRadius: 10 }}>
                  <m.Icon style={{ width: 18, height: 18, color: m.accent }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'personnel' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: '#1A1C20' }}>
              Personal asignado a {site.name} ({workers.length})
            </p>
            <button
              onClick={() => setAddingWorker(!addingWorker)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '7px 14px', borderRadius: 8, border: 'none',
                backgroundColor: addingWorker ? '#F1F5F9' : '#1E4D8C',
                color: addingWorker ? '#64748B' : '#fff',
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}
            >
              {addingWorker ? '✕ Cancelar' : '+ Añadir Trabajador'}
            </button>
          </div>

          {/* Panel de añadir trabajador */}
          {addingWorker && (
            <Card style={{ padding: '16px 20px', marginBottom: 16, border: '1px solid #BFDBFE', backgroundColor: '#F0F7FF' }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#1E4D8C', marginBottom: 10 }}>
                Selecciona un trabajador para añadir a {site.name}:
              </p>
              {availableWorkers.length === 0 ? (
                <p style={{ fontSize: 13, color: '#64748B' }}>Todos los trabajadores ya están en esta faena.</p>
              ) : (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <select
                    value={selectedWorkerId}
                    onChange={e => setSelectedWorkerId(e.target.value)}
                    style={{ flex: 1, minWidth: 200, padding: '8px 10px', borderRadius: 7, border: '1px solid #BFDBFE', fontSize: 13, color: '#1A1C20', backgroundColor: '#fff' }}
                  >
                    <option value="">-- Seleccionar trabajador --</option>
                    {availableWorkers.map(w => (
                      <option key={w.id} value={w.id}>
                        {w.first_name} {w.last_name} — {w.position || 'Sin cargo'}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleAssignWorker}
                    disabled={!selectedWorkerId || assigning}
                    style={{
                      padding: '8px 18px', borderRadius: 7, border: 'none',
                      backgroundColor: selectedWorkerId && !assigning ? '#1E4D8C' : '#CBD5E1',
                      color: '#fff', fontSize: 13, fontWeight: 600,
                      cursor: selectedWorkerId && !assigning ? 'pointer' : 'not-allowed',
                    }}
                  >
                    {assigning ? 'Asignando...' : 'Confirmar'}
                  </button>
                </div>
              )}
            </Card>
          )}

          <MwTable loading={false} headers={['Trabajador', 'Cargo', 'Sueldo Base', '']}>
            {workers.length === 0 ? (
              <tr><td colSpan={4} style={{ padding: '40px', textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>Sin personal asignado. Usa el botón "Añadir Trabajador" para asignar uno.</td></tr>
            ) : workers.map(w => (
              <MwTr key={w.id}>
                <MwTd><Link to={`/workers/${w.id}`} style={{ fontSize: 13, fontWeight: 600, color: '#1E4D8C', textDecoration: 'none' }}>{w.first_name} {w.last_name}</Link></MwTd>
                <MwTd muted>{w.position}</MwTd>
                <MwTd><span style={{ fontWeight: 700, color: '#1E4D8C' }}>${w.base_salary?.toLocaleString('es-CL')}</span></MwTd>
                <MwTd right>
                  <Link to={`/workers/${w.id}`} style={{ fontSize: 12, color: '#64748B', textDecoration: 'none' }}>Ver perfil →</Link>
                </MwTd>
              </MwTr>
            ))}
          </MwTable>
        </>
      )}


      {(activeTab === 'inventory' || activeTab === 'expenses') && (
        <Card style={{ padding: '60px 20px', textAlign: 'center' }}>
          {activeTab === 'inventory' ? <Package style={{ width: 36, height: 36, color: '#E2E8F0', margin: '0 auto 12px' }} /> : <Wallet style={{ width: 36, height: 36, color: '#E2E8F0', margin: '0 auto 12px' }} />}
          <p style={{ fontSize: 14, fontWeight: 600, color: '#64748B', marginBottom: 4 }}>
            {activeTab === 'inventory' ? 'Inventario en Terreno' : 'Control de Gastos'}
          </p>
          <p style={{ fontSize: 13, color: '#94A3B8' }}>Próximamente disponible.</p>
        </Card>
      )}
    </PageWrapper>
  )
}
