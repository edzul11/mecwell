import { apiFetch, API_BASE_URL } from '../supabaseClient'
import { useState, useEffect } from 'react'
import { useFaena } from '../context/FaenaContext'
import { PageWrapper, PageHeader, MwTable, MwTr, MwTd, StatusBadge } from '../components/MecwellUI'
import { Banknote, Plus, Download, FileDown, Search, Filter } from 'lucide-react'
import AdvanceModal from '../components/AdvanceModal'

export default function AdvancesList() {
  const { activeFaenaId, activeFaena } = useFaena()
  const [advances, setAdvances] = useState([])
  const [workers, setWorkers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [advRes, wRes] = await Promise.all([
        apiFetch('http://127.0.0.1:8000/api/v1/advances/').then(r => r.json()),
        apiFetch('http://127.0.0.1:8000/api/v1/workers/').then(r => r.json())
      ])
      setAdvances(Array.isArray(advRes) ? advRes : [])
      setWorkers(Array.isArray(wRes) ? wRes : [])
    } catch (err) {
      console.error("Error loading advances list:", err)
    } finally {
      setLoading(false)
    }
  }

  // Filter advances by faena, search term, and status
  const filteredAdvances = advances.filter(adv => {
    const worker = workers.find(w => w.id === adv.worker_id)
    if (!worker) return false

    // 1. Filter by Faena Activa
    if (activeFaenaId && worker.site_id !== activeFaenaId) {
      return false
    }

    // 2. Filter by Search Term (Worker name, RUT)
    const nameMatch = `${worker.first_name} ${worker.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
    const rutMatch = (worker.rut || '').toLowerCase().includes(searchTerm.toLowerCase())
    if (searchTerm && !nameMatch && !rutMatch) {
      return false
    }

    // 3. Filter by Status
    if (statusFilter !== 'all') {
      if (statusFilter === 'deducted' && adv.status !== 'deducted') return false
      if (statusFilter === 'approved' && adv.status === 'deducted') return false
    }

    return true
  })

  // Calculate statistics
  const totalApprovedAmount = filteredAdvances.reduce((acc, curr) => acc + curr.amount, 0)
  const pendingAdvancesCount = filteredAdvances.filter(a => a.status !== 'deducted').length
  const deductedAdvancesCount = filteredAdvances.filter(a => a.status === 'deducted').length

  return (
    <PageWrapper>
      <PageHeader
        title="Anticipos de Sueldo"
        subtitle={activeFaena ? `Anticipos registrados en la faena: ${activeFaena.name}` : "Listado global de todos los anticipos solicitados"}
        action={
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-emerald-700 transition-colors"
          >
            <Plus className="w-4 h-4" /> Registrar Anticipo
          </button>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 mb-6">
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200" style={{ borderLeft: '4px solid #10B981' }}>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Entregado</p>
          <p className="text-2xl font-black text-gray-900 mt-2">${totalApprovedAmount.toLocaleString('es-CL')}</p>
          <span className="text-xs text-gray-500 mt-1 block">Acumulado en anticipos</span>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200" style={{ borderLeft: '4px solid #F59E0B' }}>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Pendientes de Cobro</p>
          <p className="text-2xl font-black text-gray-900 mt-2">{pendingAdvancesCount}</p>
          <span className="text-xs text-gray-500 mt-1 block">Por descontar en liquidación</span>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200" style={{ borderLeft: '4px solid #6B7280' }}>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider font-semibold">Descontados</p>
          <p className="text-2xl font-black text-gray-900 mt-2">{deductedAdvancesCount}</p>
          <span className="text-xs text-gray-500 mt-1 block">Ya cobrados en liquidaciones</span>
        </div>
      </div>

      {/* Filters bar */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6 bg-white p-4 rounded-2xl ring-1 ring-gray-200 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar trabajador por nombre o RUT..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none"
          />
        </div>
        <div className="flex gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none bg-white text-gray-700"
          >
            <option value="all">Todos los estados</option>
            <option value="approved">Pendiente (Aprobado)</option>
            <option value="deducted">Descontado</option>
          </select>
          <button 
            onClick={fetchData}
            className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-500"
            title="Recargar datos"
          >
            🔄
          </button>
        </div>
      </div>

      {/* Table */}
      <MwTable
        loading={loading}
        headers={['Trabajador', 'RUT', 'Faena', 'Fecha', 'Monto', 'Estado', 'Motivo', { label: '', right: true }]}
      >
        {filteredAdvances.length === 0 ? (
          <tr>
            <td colSpan={8} style={{ padding: '48px 20px', textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>
              No se registran anticipos con los filtros aplicados.
            </td>
          </tr>
        ) : filteredAdvances.map((adv) => {
          const worker = workers.find(w => w.id === adv.worker_id)
          return (
            <MwTr key={adv.id}>
              <MwTd>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#1A1C20' }}>
                  {worker ? `${worker.first_name} ${worker.last_name}` : 'Cargando...'}
                </div>
                <div style={{ fontSize: 11, color: '#94A3B8' }}>{worker?.position || 'Sin cargo'}</div>
              </MwTd>
              <MwTd muted>{worker?.rut || '-'}</MwTd>
              <MwTd muted>{worker?.site?.name || 'Sin Faena'}</MwTd>
              <MwTd muted>{adv.date}</MwTd>
              <MwTd>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#1E293B' }}>
                  ${adv.amount.toLocaleString('es-CL')}
                </span>
              </MwTd>
              <MwTd>
                {adv.status === 'deducted' ? (
                  <span className="inline-flex items-center rounded-md bg-gray-50 px-2.5 py-1 text-xs font-semibold text-gray-600 ring-1 ring-inset ring-gray-500/10">
                    Descontado
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-md bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700 ring-1 ring-inset ring-green-600/20">
                    Pendiente
                  </span>
                )}
              </MwTd>
              <MwTd muted className="truncate max-w-[200px]" title={adv.reason}>{adv.reason || '-'}</MwTd>
              <MwTd right>
                <a
                  href={`${API_BASE_URL}/api/v1/advances/comprobante/${adv.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-indigo-600 hover:text-indigo-900 font-bold text-xs border border-indigo-200 rounded-lg px-2.5 py-1.5 hover:bg-indigo-50 transition-colors"
                >
                  <FileDown className="w-3.5 h-3.5" /> Comprobante
                </a>
              </MwTd>
            </MwTr>
          )
        })}
      </MwTable>

      {/* Registrar Anticipo Modal */}
      {isModalOpen && (
        <AdvanceModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSaved={() => {
            fetchData()
            setIsModalOpen(false)
          }}
          workersList={workers.filter(w => !activeFaenaId || w.site_id === activeFaenaId)}
        />
      )}
    </PageWrapper>
  )
}
