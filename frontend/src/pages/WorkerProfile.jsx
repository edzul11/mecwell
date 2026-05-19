import { apiFetch, API_BASE_URL, supabase } from '../supabaseClient'
import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import DocumentModal from '../components/DocumentModal'
import WorkerEditModal from '../components/WorkerEditModal'
import DeactivateWorkerModal from '../components/DeactivateWorkerModal'
import AdvanceModal from '../components/AdvanceModal'
import { UserMinus, UserCheck, AlertOctagon, ArrowLeft, Briefcase, Download, Edit, User, HeartPulse, ShieldCheck, Wallet, FileText, FileDown, ClipboardList, Banknote, Trash2 } from 'lucide-react'

// Helper for avatars
function getInitials(firstName, lastName) {
  return `${(firstName || '').charAt(0)}${(lastName || '').charAt(0)}`.toUpperCase()
}

export default function WorkerProfile() {
  const { id } = useParams()
  const [worker, setWorker] = useState(null)
  const [ppes, setPpes] = useState([])
  const [documents, setDocuments] = useState([])
  const [advances, setAdvances] = useState([])
  const [sites, setSites] = useState([])
  const [loading, setLoading] = useState(true)
  const [assigningSite, setAssigningSite] = useState(false)
  const [selectedSiteId, setSelectedSiteId] = useState('')

  const [currentUser, setCurrentUser] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUser(user)
    })
  }, [])

  const isAuthorizedToDelete = currentUser && (
    currentUser.email === 'zedmundofrancisco@gmail.com' || 
    currentUser.id === 'b1cb200f-ae69-431a-90f6-fbc4d1bea827'
  )

  const handleDeleteWorker = async () => {
    const confirmed = window.confirm(
      `⚠️ ¿ESTÁS COMPLETAMENTE SEGURO DE ELIMINAR A ESTE TRABAJADOR?\n\n` +
      `Esta acción es IRREVERSIBLE y eliminará permanentemente al trabajador ` +
      `"${worker.first_name} ${worker.last_name}" junto con toda su información asociada ` +
      `(asistencia, epp, liquidaciones, finiquitos, contratos y documentos) del software.`
    )
    if (!confirmed) return
    
    setIsDeleting(true)
    try {
      const response = await apiFetch(`http://127.0.0.1:8000/api/v1/workers/${id}`, {
        method: 'DELETE'
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || "Error en el servidor al eliminar trabajador.")
      }
      alert("El trabajador y toda su información han sido eliminados de manera exitosa y permanente del software.")
      window.location.href = '/workers'
    } catch (err) {
      alert(`Error al eliminar trabajador: ${err.message}`)
    } finally {
      setIsDeleting(false)
    }
  }

  // Modals state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDocModalOpen, setIsDocModalOpen] = useState(false)
  const [isDeactivateModalOpen, setIsDeactivateModalOpen] = useState(false)
  const [isAdvanceModalOpen, setIsAdvanceModalOpen] = useState(false)

  useEffect(() => {
    fetchWorkerData()
    apiFetch('http://127.0.0.1:8000/api/v1/sites/')
      .then(r => r.json())
      .then(data => setSites(Array.isArray(data) ? data : []))
      .catch(console.error)
  }, [id])

  const fetchWorkerData = () => {
    setLoading(true)
    apiFetch(`http://127.0.0.1:8000/api/v1/workers/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setWorker(data)
        return apiFetch(`http://127.0.0.1:8000/api/v1/ppe/worker/${id}`)
      })
      .then((res) => res.json())
      .then((ppeData) => {
        setPpes(ppeData)
        return apiFetch(`http://127.0.0.1:8000/api/v1/documents/`)
      })
      .then(res => res.json())
      .then(docs => {
        setDocuments(docs.filter(d => d.worker_id === id))
        return apiFetch(`http://127.0.0.1:8000/api/v1/advances/?worker_id=${id}`)
      })
      .then(res => res.json())
      .then(advData => {
        setAdvances(Array.isArray(advData) ? advData : [])
        setLoading(false)
      })
      .catch((err) => {
        console.error("Error fetching worker profile:", err)
        setLoading(false)
      })
  }

  const handleDownloadContract = async () => {
    try {
      // Default payload for single contract generation
      const payload = {
        employer_company: "MECWELL LIMITADA",
        employer_rut: "78.349.631-3",
        employer_rep: "Sergio Hans Farías Anabalón",
        employer_rep_rut: "15.019.122-k",
        employer_address: "Uribe # 636 depto. 302",
        employer_city: "Antofagasta",
        employer_email: "mecwelllimitada@gmail.com",
        contract_date: "01 de marzo de 2026",
        contract_start_date: "01 de marzo de 2026",
        contract_duration: "60 DIAS",
        job_city: "Mejillones",
        job_site: "NORACID",
        job_site_address: "Tercera Industrial # 850",
        job_specific_task: "Levantamiento condiciones de riesgo",
        work_schedule: "44 horas semanales...",
        include_clause_13_14: false,
        old_employer_company: "",
        old_employer_rut: "",
        old_labor_start_date: "",
        custom_clauses: [],
        workers: [{
          worker_id: worker.id,
          worker_address: "",
          worker_commune: "Antofagasta",
          worker_region: "Antofagasta",
          worker_nationality: "chilena",
          worker_civil_status: "soltero(a)",
          worker_birth_date: worker.birth_date || "01 de enero de 1990",
          job_position: worker.position || "maestro mayor",
          base_salary: worker.base_salary || 539000
        }]
      }
      
      const response = await apiFetch(`http://127.0.0.1:8000/api/v1/contracts/generate-bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (!response.ok) throw new Error("Error generating contract")
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `contrato_${worker.rut}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
    } catch (err) {
      alert("Hubo un error al generar el contrato.")
      console.error(err)
    }
  }

  const handleReassignSite = async () => {
    if (!selectedSiteId) return
    try {
      const res = await apiFetch(`http://127.0.0.1:8000/api/v1/workers/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ site_id: selectedSiteId })
      })
      if (!res.ok) throw new Error()
      const updated = await res.json()
      setWorker(updated)
      setSelectedSiteId('')
      setAssigningSite(false)
    } catch {
      alert('Error al reasignar la faena.')
    }
  }

  const handleReactivate = async () => {
    if (!selectedSiteId) return
    try {
      const res = await apiFetch(`http://127.0.0.1:8000/api/v1/workers/${id}/reactivate?site_id=${selectedSiteId}`, {
        method: 'POST'
      })
      if (!res.ok) throw new Error()
      const updated = await res.json()
      setWorker(updated)
      setSelectedSiteId('')
      setAssigningSite(false)
    } catch {
      alert('Error al reactivar al trabajador.')
    }
  }

  if (loading && !worker) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-lg font-medium text-gray-500 animate-pulse">Cargando perfil...</div>
      </div>
    )
  }

  if (!worker) {
    return (
      <div className="flex h-64 flex-col items-center justify-center">
        <h2 className="text-xl font-bold text-gray-900">Trabajador no encontrado</h2>
        <Link to="/workers" className="mt-4 text-indigo-600 hover:text-indigo-500 flex items-center">
          <ArrowLeft className="mr-2 h-4 w-4" /> Volver a la lista
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Header Navigation */}
      <div>
        <Link to="/workers" className="text-sm font-medium text-gray-500 hover:text-indigo-600 flex items-center transition-colors">
          <ArrowLeft className="mr-1 h-4 w-4" /> Volver a Trabajadores
        </Link>
      </div>

      {/* Banner / Header Card */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-200">
        <div className="h-32 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600"></div>
        <div className="px-4 sm:px-6 lg:px-8 pb-6">
          <div className="relative flex flex-col sm:flex-row justify-between sm:items-end -mt-12 sm:-mt-16">
            <div className="flex items-end">
              <div className="h-24 w-24 sm:h-32 sm:w-32 rounded-full border-4 border-white bg-white shadow-md flex items-center justify-center overflow-hidden">
                <div className="h-full w-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-4xl font-bold text-indigo-700">
                  {getInitials(worker.first_name, worker.last_name)}
                </div>
              </div>
              <div className="ml-6 pb-2">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{worker.first_name} {worker.last_name}</h1>
                <p className="text-sm font-medium text-gray-500 mt-1 flex items-center">
                  <Briefcase className="mr-1.5 h-4 w-4" /> {worker.position || 'Sin cargo asignado'}
                </p>
                <div className="mt-2 flex gap-2">
                  <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                    ['active', 'activo'].includes((worker.status || '').toLowerCase()) ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' : 'bg-red-50 text-red-700 ring-red-600/20'
                  }`}>
                    {['active', 'activo'].includes((worker.status || '').toLowerCase()) ? 'Estado: Activo' : 'Estado: Inactivo'}
                  </span>
                  {worker.blacklisted && (
                    <span className="inline-flex items-center rounded-md bg-gray-900 px-2 py-1 text-xs font-medium text-white ring-1 ring-inset ring-gray-700">
                      <AlertOctagon className="mr-1 h-3 w-3 text-red-500" /> Lista Negra
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="pt-4 sm:pt-0 pb-2 flex flex-wrap gap-3">
              {isAuthorizedToDelete && (
                <button 
                  onClick={handleDeleteWorker}
                  disabled={isDeleting}
                  className="inline-flex items-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-700 disabled:opacity-50"
                >
                  <Trash2 className="mr-1.5 h-4 w-4 text-white" /> 
                  {isDeleting ? 'Eliminando...' : 'Eliminar Ficha'}
                </button>
              )}
              {['active', 'activo'].includes((worker.status || '').toLowerCase()) ? (
                <button 
                  onClick={() => setIsDeactivateModalOpen(true)}
                  className="inline-flex items-center rounded-md bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 shadow-sm ring-1 ring-inset ring-red-200 hover:bg-red-100"
                >
                  <UserMinus className="mr-1.5 h-4 w-4 text-red-600" /> Desvincular
                </button>
              ) : (
                <button 
                  onClick={() => setAssigningSite(true)} // Reactivation requires picking a site
                  className="inline-flex items-center rounded-md bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 shadow-sm ring-1 ring-inset ring-emerald-200 hover:bg-emerald-100"
                >
                  <UserCheck className="mr-1.5 h-4 w-4 text-emerald-600" /> Reactivar Trabajador
                </button>
              )}
              <button 
                onClick={handleDownloadContract}
                className="inline-flex items-center rounded-md bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-700 shadow-sm ring-1 ring-inset ring-indigo-200 hover:bg-indigo-100"
              >
                <Download className="mr-1.5 h-4 w-4 text-indigo-600" /> Contrato PDF
              </button>
              <button 
                onClick={() => setIsEditModalOpen(true)}
                className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
              >
                <Edit className="mr-1.5 h-4 w-4 text-gray-400" /> Editar Perfil
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Grid Layout for Info Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">

        {/* Card 0: Faena Asignada */}
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200 hover:shadow-md transition-shadow" style={{ borderTop: '4px solid #1E4D8C' }}>
          <h3 className="flex items-center text-base font-semibold leading-6 text-gray-900 border-b border-gray-100 pb-3 mb-4">
            <svg className="mr-2 h-5 w-5 text-blue-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
            Faena Asignada
          </h3>
          {(() => {
            const currentSite = sites.find(s => s.id === worker.site_id)
            return (
              <div className="space-y-3">
                <div style={{ padding: '10px 14px', borderRadius: 8, backgroundColor: worker.site_id ? '#EFF6FF' : '#FEF3C7', border: `1px solid ${worker.site_id ? '#BFDBFE' : '#FDE68A'}` }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: '#64748B', marginBottom: 2 }}>Faena actual</p>
                  <p style={{ fontSize: 15, fontWeight: 700, color: worker.site_id ? '#1E4D8C' : '#92400E' }}>
                    {currentSite ? currentSite.name : '⚠ Sin faena asignada'}
                  </p>
                  {currentSite?.location && <p style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>{currentSite.location}</p>}
                </div>
                {!assigningSite ? (
                  <button
                    onClick={() => { setAssigningSite(true); setSelectedSiteId(worker.site_id || '') }}
                    style={{ width: '100%', padding: '8px 0', borderRadius: 7, border: '1px solid #E2E8F0', backgroundColor: '#fff', fontSize: 13, fontWeight: 600, color: '#1E4D8C', cursor: 'pointer' }}
                  >
                    ↕ Reasignar Faena
                  </button>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <select
                      value={selectedSiteId}
                      onChange={e => setSelectedSiteId(e.target.value)}
                      style={{ padding: '7px 10px', borderRadius: 7, border: '1px solid #BFDBFE', fontSize: 13, color: '#1A1C20' }}
                    >
                      <option value="">-- Seleccionar faena --</option>
                      {sites.map(s => (
                        <option key={s.id} value={s.id}>{s.name}{s.location ? ` (${s.location})` : ''}</option>
                      ))}
                    </select>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        onClick={['active', 'activo'].includes((worker.status || '').toLowerCase()) ? handleReassignSite : handleReactivate}
                        disabled={!selectedSiteId}
                        style={{ flex: 1, padding: '7px 0', borderRadius: 7, border: 'none', backgroundColor: selectedSiteId ? (['active', 'activo'].includes((worker.status || '').toLowerCase()) ? '#1E4D8C' : '#059669') : '#CBD5E1', color: '#fff', fontSize: 13, fontWeight: 600, cursor: selectedSiteId ? 'pointer' : 'not-allowed' }}
                      >
                        {['active', 'activo'].includes((worker.status || '').toLowerCase()) ? 'Confirmar Reasignación' : 'Confirmar Reactivación'}
                      </button>
                      <button
                        onClick={() => setAssigningSite(false)}
                        style={{ flex: 1, padding: '7px 0', borderRadius: 7, border: '1px solid #E2E8F0', backgroundColor: '#fff', fontSize: 13, fontWeight: 500, color: '#64748B', cursor: 'pointer' }}
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })()}
        </div>

        {/* Card 1: Información Laboral */}

        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200 hover:shadow-md transition-shadow">
          <h3 className="flex items-center text-base font-semibold leading-6 text-gray-900 border-b border-gray-100 pb-3 mb-4">
            <Briefcase className="mr-2 h-5 w-5 text-indigo-500" /> Información Laboral
          </h3>
          <dl className="space-y-4 text-sm leading-6">
            <div className="flex justify-between">
              <dt className="text-gray-500">RUT</dt>
              <dd className="font-medium text-gray-900">{worker.rut}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Sueldo Base</dt>
              <dd className="font-medium text-gray-900">${worker.base_salary?.toLocaleString('es-CL')}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Turno</dt>
              <dd className="font-medium text-gray-900">{worker.shift || 'No especificado'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Fecha Ingreso</dt>
              <dd className="font-medium text-gray-900">{worker.entry_date || 'No registrada'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">AFP</dt>
              <dd className="font-medium text-gray-900">{worker.pension_fund}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Previsión Salud</dt>
              <dd className="font-medium text-gray-900">{worker.health_institution}</dd>
            </div>
          </dl>
        </div>

        {/* Card 2: Información Personal & Salud */}
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200 hover:shadow-md transition-shadow">
          <h3 className="flex items-center text-base font-semibold leading-6 text-gray-900 border-b border-gray-100 pb-3 mb-4">
            <User className="mr-2 h-5 w-5 text-emerald-500" /> Información Personal
          </h3>
          <dl className="space-y-4 text-sm leading-6">
            <div className="flex justify-between">
              <dt className="text-gray-500">Fecha Nacimiento</dt>
              <dd className="font-medium text-gray-900">{worker.birth_date || 'No registrada'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Email</dt>
              <dd className="font-medium text-gray-900">{worker.email || 'No registrado'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Estado Civil</dt>
              <dd className="font-medium text-gray-900">{worker.marital_status || 'No especificado'}</dd>
            </div>
          </dl>
          
          <h4 className="flex items-center text-sm font-semibold leading-6 text-gray-900 mt-6 mb-2">
            <HeartPulse className="mr-1.5 h-4 w-4 text-rose-500" /> Emergencia
          </h4>
          <div className="rounded-lg bg-rose-50 p-3 ring-1 ring-inset ring-rose-100">
            <p className="text-xs text-rose-700 font-medium">Contacto Principal</p>
            <p className="text-sm font-semibold text-rose-900 mt-1">{worker.emergency_contact_name || 'Sin registro'}</p>
            <p className="text-sm text-rose-800">{worker.emergency_contact_phone || 'Sin teléfono'}</p>
          </div>
        </div>

        {/* Card 3: Tallas EPP */}
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200 hover:shadow-md transition-shadow">
          <h3 className="flex items-center text-base font-semibold leading-6 text-gray-900 border-b border-gray-100 pb-3 mb-4">
            <ShieldCheck className="mr-2 h-5 w-5 text-orange-500" /> Tallas de EPP
          </h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="rounded-lg bg-gray-50 p-2 ring-1 ring-inset ring-gray-200">
              <span className="block text-xs text-gray-500 mb-1">Ropa</span>
              <span className="block font-bold text-gray-900">{worker.clothing_size || '-'}</span>
            </div>
            <div className="rounded-lg bg-gray-50 p-2 ring-1 ring-inset ring-gray-200">
              <span className="block text-xs text-gray-500 mb-1">Calzado</span>
              <span className="block font-bold text-gray-900">{worker.shoe_size || '-'}</span>
            </div>
            <div className="rounded-lg bg-gray-50 p-2 ring-1 ring-inset ring-gray-200">
              <span className="block text-xs text-gray-500 mb-1">Guantes</span>
              <span className="block font-bold text-gray-900">{worker.glove_size || '-'}</span>
            </div>
          </div>
        </div>

        {/* Card 4: Información Bancaria */}
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200 hover:shadow-md transition-shadow">
          <h3 className="flex items-center text-base font-semibold leading-6 text-gray-900 border-b border-gray-100 pb-3 mb-4">
            <Wallet className="mr-2 h-5 w-5 text-blue-500" /> Información Bancaria
          </h3>
          <dl className="space-y-2 text-sm leading-6">
            <div className="flex justify-between">
              <dt className="text-gray-500">Banco</dt>
              <dd className="font-medium text-gray-900">{worker.bank_name || 'No registrado'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Tipo Cuenta</dt>
              <dd className="font-medium text-gray-900">{worker.account_type || '-'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Número</dt>
              <dd className="font-medium text-gray-900">{worker.account_number || '-'}</dd>
            </div>
          </dl>
        </div>

      {/* Documentos Acreditativos */}
      <div className="mt-8 rounded-2xl bg-white shadow-sm ring-1 ring-gray-200 overflow-hidden sm:col-span-2 lg:col-span-3">
        <div className="border-b border-gray-200 bg-gray-50 px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <h3 className="text-lg font-semibold leading-6 text-gray-900 flex items-center">
            <FileText className="mr-2 h-5 w-5 text-indigo-600" /> Documentos Acreditativos
          </h3>
          <button 
            onClick={() => setIsDocModalOpen(true)}
            className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
          >
            Subir Documento
          </button>
        </div>
        <div className="overflow-x-auto">
          {documents.length === 0 ? (
            <div className="p-6 text-center">
              <FileText className="mx-auto h-10 w-10 text-gray-400" />
              <h3 className="mt-2 text-sm font-semibold text-gray-900">No hay documentos</h3>
              <p className="mt-1 text-sm text-gray-500">Sube certificados médicos, finiquitos o credenciales de este trabajador.</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-white">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Documento</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vencimiento</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acción</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {documents.map((doc) => {
                  return (
                    <tr key={doc.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                        {doc.name} <span className="text-gray-500 font-normal">({doc.document_type})</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{doc.expiration_date}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {doc.file_url ? (
                          <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-900 inline-flex items-center">
                            <FileDown className="w-4 h-4 mr-1" /> Descargar
                          </a>
                        ) : (
                          <span className="text-gray-400 text-xs">Sin archivo</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      </div>


      {/* Historial de EPP Integrado */}
      <div className="mt-8 rounded-2xl bg-white shadow-sm ring-1 ring-gray-200 overflow-hidden">
        <div className="border-b border-gray-200 bg-gray-50 px-6 py-5 flex items-center justify-between">
          <h3 className="text-lg font-semibold leading-6 text-gray-900 flex items-center">
            <ShieldCheck className="mr-2 h-5 w-5 text-indigo-600" /> Equipos de Protección Personal (EPP)
          </h3>
          <button className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
            Asignar Nuevo EPP
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-white">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ítem</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha Asignación</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acta</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {ppes.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-sm text-gray-500">
                    Este trabajador no tiene EPP asignados actualmente.
                  </td>
                </tr>
              ) : (
                ppes.map((ppe) => (
                  <tr key={ppe.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{ppe.inventory_items?.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{ppe.quantity}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{ppe.assignment_date}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {ppe.is_returned ? (
                        <span className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">
                          Devuelto ({ppe.return_date})
                        </span>
                      ) : ppe.inventory_items?.is_returnable ? (
                        <button className="text-indigo-600 hover:text-indigo-900 text-sm font-medium">Marcar Devuelto</button>
                      ) : (
                        <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                          Consumible
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <a
                        href={`${API_BASE_URL}/api/v1/ppe/receipt/${ppe.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-900 font-medium text-xs border border-indigo-200 rounded-md px-2 py-1 hover:bg-indigo-50 transition-colors"
                        title="Descargar Acta de Recepción"
                      >
                        <ClipboardList className="w-3.5 h-3.5" /> Acta PDF
                      </a>
                    </td>
                  </tr>
                ))

              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Anticipos de Sueldo */}
      <div className="mt-8 rounded-2xl bg-white shadow-sm ring-1 ring-gray-200 overflow-hidden">
        <div className="border-b border-gray-200 bg-gray-50 px-6 py-5 flex items-center justify-between">
          <h3 className="text-lg font-semibold leading-6 text-gray-900 flex items-center">
            <Banknote className="mr-2 h-5 w-5 text-green-600" /> Anticipos de Sueldo
          </h3>
          <Link 
            to="/advances"
            className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
          >
            Gestionar Anticipos
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-white">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monto</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Motivo</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Comprobante</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {advances.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-sm text-gray-500">
                    Este trabajador no registra anticipos de sueldo.
                  </td>
                </tr>
              ) : (
                advances.map((adv) => (
                  <tr key={adv.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{adv.date}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">${adv.amount.toLocaleString('es-CL')}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {adv.status === 'deducted' ? (
                        <span className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">
                          Descontado
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                          Aprobado (Pendiente)
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 truncate max-w-[200px]" title={adv.reason}>{adv.reason || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <a
                        href={`${API_BASE_URL}/api/v1/advances/comprobante/${adv.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-900 font-medium text-xs border border-indigo-200 rounded-md px-2 py-1 hover:bg-indigo-50 transition-colors"
                      >
                        <FileDown className="w-3.5 h-3.5" /> PDF
                      </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Modals */}
      <WorkerEditModal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        worker={worker} 
        onSave={(updatedWorker) => {
          setWorker(updatedWorker)
        }} 
      />
      
      <DocumentModal 
        isOpen={isDocModalOpen} 
        onClose={() => setIsDocModalOpen(false)} 
        defaultWorkerId={worker.id}
        onSave={(d) => setDocuments([...documents, d])} 
      />

      <DeactivateWorkerModal
        isOpen={isDeactivateModalOpen}
        onClose={() => setIsDeactivateModalOpen(false)}
        worker={worker}
        onDeactivated={(updated) => setWorker(updated)}
      />

      <AdvanceModal
        isOpen={isAdvanceModalOpen}
        onClose={() => setIsAdvanceModalOpen(false)}
        worker={worker}
        onSaved={(adv) => setAdvances([...advances, adv])}
      />

    </div>
  )
}
