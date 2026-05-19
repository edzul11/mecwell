import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiFetch, API_BASE_URL } from '../supabaseClient'
import { 
  MwPage, MwCard, MwButton 
} from '../components/MecwellUI'
import { 
  X, TreePalm, Calculator, Calendar, AlertCircle, CheckCircle2, ArrowRight, ArrowLeft
} from 'lucide-react'

export default function VacationRegistrationPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [workers, setWorkers] = useState([])
  const [balances, setBalances] = useState({})
  const [savedId, setSavedId] = useState(null)
  
  const [formData, setFormData] = useState({
    worker_id: '',
    fecha_inicio: '',
    fecha_fin: '',
    dias_habiles: 0,
    observaciones: ''
  })

  const [step, setStep] = useState(1) // 1: Input, 2: Success
  const selectedWorker = workers.find(w => w.id === formData.worker_id)
  const currentBalance = balances[formData.worker_id]

  useEffect(() => {
    fetchWorkers()
  }, [])

  const fetchWorkers = async () => {
    try {
      const res = await apiFetch('http://127.0.0.1:8000/api/v1/workers/')
      const data = await res.json()
      const active = Array.isArray(data) ? data.filter(w => {
        const s = (w.status || '').toLowerCase()
        return s === 'active' || s === 'activo'
      }) : []
      setWorkers(active)
    } catch (err) {
      console.error(err)
    }
  }

  const handleWorkerChange = async (wId) => {
    setFormData({ ...formData, worker_id: wId })
    if (wId) {
      try {
        const res = await apiFetch(`http://127.0.0.1:8000/api/v1/vacaciones/saldo/${wId}`)
        const data = await res.json()
        setBalances(prev => ({ ...prev, [wId]: data }))
      } catch (err) {
        console.error(err)
      }
    }
  }

  const handleSubmit = async () => {
    if (!formData.worker_id || !formData.fecha_inicio || !formData.fecha_fin || !formData.dias_habiles) {
      alert("Por favor complete todos los campos requeridos.")
      return
    }

    setLoading(true)
    try {
      const res = await apiFetch('http://127.0.0.1:8000/api/v1/vacaciones/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      const data = await res.json()
      setSavedId(data.id)
      setStep(2)
    } catch (err) {
      alert('Error al registrar vacaciones.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <MwPage title="Registrar Vacaciones" icon={TreePalm}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        
        <MwCard style={{ overflow: 'hidden', padding: 0 }}>
          {/* Header al estilo Finiquito */}
          <div style={{ backgroundColor: '#1E4D8C', padding: '32px 40px', color: '#fff' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: 10, borderRadius: 12 }}>
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>Registro de Ausencia / Vacaciones</h2>
                  <p style={{ fontSize: 12, opacity: 0.8, marginTop: 2 }}>Gestión de días legales y administrativos.</p>
                </div>
              </div>
            </div>
          </div>

          <div style={{ padding: 40 }}>
            {step === 1 && (
              <div className="space-y-8">
                <div className="grid grid-cols-2 gap-6">
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Seleccionar Trabajador</label>
                    <select
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-500"
                      value={formData.worker_id}
                      onChange={e => handleWorkerChange(e.target.value)}
                    >
                      <option value="">Seleccione un trabajador...</option>
                      {workers.map(w => (
                        <option key={w.id} value={w.id}>{w.first_name} {w.last_name} ({w.rut})</option>
                      ))}
                    </select>
                  </div>

                  {selectedWorker && (
                    <div className="col-span-2 bg-blue-50/50 p-4 rounded-2xl border border-blue-100 flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-lg">
                        {selectedWorker.first_name[0]}{selectedWorker.last_name[0]}
                      </div>
                      <div className="flex-1 grid grid-cols-3 gap-4">
                        <div>
                          <p className="text-[10px] font-bold text-blue-400 uppercase">Saldo Actual</p>
                          <p className={`text-sm font-bold ${currentBalance?.saldo_actual < 0 ? 'text-red-600' : 'text-blue-900'}`}>
                            {currentBalance ? `${currentBalance.saldo_actual.toFixed(1)} días` : 'Cargando...'}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-blue-400 uppercase">Días Tomados</p>
                          <p className="text-sm font-bold text-blue-900">{currentBalance ? currentBalance.total_tomadas : '-'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-blue-400 uppercase">Faena Actual</p>
                          <p className="text-sm font-bold text-blue-900">{selectedWorker.site_id || 'Sin asignar'}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Fecha Inicio</label>
                    <input
                      type="date"
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                      value={formData.fecha_inicio}
                      onChange={e => setFormData({ ...formData, fecha_inicio: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Fecha Fin</label>
                    <input
                      type="date"
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                      value={formData.fecha_fin}
                      onChange={e => setFormData({ ...formData, fecha_fin: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Días Hábiles Utilizados</label>
                    <input
                      type="number"
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-[#1E4D8C]"
                      value={formData.dias_habiles}
                      onChange={e => setFormData({ ...formData, dias_habiles: parseInt(e.target.value) || 0 })}
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Observaciones</label>
                    <textarea
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none h-24"
                      value={formData.observaciones}
                      onChange={e => setFormData({ ...formData, observaciones: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 24, borderTop: '1px solid #F1F5F9' }}>
                  <MwButton 
                    onClick={() => navigate('/vacations')}
                    style={{ backgroundColor: '#fff', color: '#475569', border: '1px solid #E2E8F0' }}
                  >
                    <ArrowLeft className="w-4 h-4 mr-1" /> Cancelar
                  </MwButton>
                  
                  <MwButton onClick={handleSubmit} disabled={loading} style={{ backgroundColor: '#1E4D8C' }}>
                    {loading ? 'Procesando...' : 'Confirmar y Guardar'} <ArrowRight className="w-4 h-4 ml-1" />
                  </MwButton>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="text-center py-10">
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="w-10 h-10 text-emerald-600" />
                </div>
                <h3 style={{ fontSize: 24, fontWeight: 800, color: '#1E4D8C' }}>¡Registro Exitoso!</h3>
                <p style={{ color: '#64748B', marginTop: 8, marginBottom: 32 }}>Las vacaciones se han descontado del saldo del trabajador.</p>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {savedId && (
                    <MwButton 
                      onClick={() => window.open(`${API_BASE_URL}/api/v1/vacaciones/comprobante/${savedId}`, '_blank')}
                      style={{ width: '100%', backgroundColor: '#1E4D8C' }}
                    >
                      Descargar Comprobante PDF
                    </MwButton>
                  )}
                  <MwButton onClick={() => navigate('/vacations')} style={{ width: '100%', backgroundColor: '#111827' }}>
                    Volver a la Lista de Vacaciones
                  </MwButton>
                </div>
              </div>
            )}
          </div>
        </MwCard>
      </div>
    </MwPage>
  )
}
