import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiFetch } from '../supabaseClient'
import { 
  MwPage, MwCard, MwButton, MwTd, StatusBadge 
} from '../components/MecwellUI'
import { 
  X, ArrowRight, ArrowLeft, Calculator, FileText, AlertCircle, HardHat, CheckCircle2, Download
} from 'lucide-react'

export default function FiniquitoWizardPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [workers, setWorkers] = useState([])
  const [causales, setCausales] = useState([])
  const [sites, setSites] = useState([])
  
  const [formData, setFormData] = useState({
    worker_id: '',
    site_id: '',
    fecha_finiquito: new Date().toISOString().split('T')[0],
    fecha_ultimo_dia: '',
    causal_articulo: '',
    causal_numero: '',
    causal_descripcion: '',
    observaciones: '',
    deudas: [
      { tipo: 'descuento_epp', nombre: 'EPP no devuelto', valor: 0 },
      { tipo: 'descuento_prestamo', nombre: 'Préstamo empresa', valor: 0 }
    ]
  })

  const [calculation, setCalculation] = useState({
    haberes_imponibles: 0,
    haberes_no_imponibles: 0,
    descuentos: 0,
    neto: 0
  })

  const [createdId, setCreatedId] = useState(null)

  const selectedWorker = workers.find(w => w.id === formData.worker_id)

  useEffect(() => {
    fetchInitialData()
  }, [])

  const fetchInitialData = async () => {
    try {
      const wRes = await apiFetch('http://127.0.0.1:8000/api/v1/workers/')
      const wData = await wRes.json()
      setWorkers(Array.isArray(wData) ? wData : [])

      const cRes = await apiFetch('http://127.0.0.1:8000/api/v1/finiquitos/causales')
      const cData = await cRes.json()
      if (Array.isArray(cData) && cData.length > 0) {
        setCausales(cData)
      } else {
        // Fallback Chilean labor law causales
        setCausales([
          { id: 1, articulo: '159', numero: '1', nombre: 'Mutuo acuerdo de las partes' },
          { id: 2, articulo: '159', numero: '2', nombre: 'Renuncia del trabajador' },
          { id: 3, articulo: '159', numero: '4', nombre: 'Vencimiento del plazo convenido' },
          { id: 4, articulo: '159', numero: '5', nombre: 'Conclusión del trabajo o servicio' },
          { id: 5, articulo: '161', numero: '1', nombre: 'Necesidades de la empresa' },
          { id: 6, articulo: '160', numero: '1', nombre: 'Conductas indebidas graves' },
          { id: 7, articulo: '160', numero: '7', nombre: 'Incumplimiento grave de las obligaciones' }
        ])
      }

      const sRes = await apiFetch('http://127.0.0.1:8000/api/v1/sites/')
      const sData = await sRes.json()
      setSites(Array.isArray(sData) ? sData : [])
    } catch (err) {
      console.error("Error loading wizard data", err)
    }
  }

  useEffect(() => {
    if (step === 3 && selectedWorker) {
      calculateFiniquito()
    }
  }, [step, selectedWorker])

  const handleWorkerChange = (wId) => {
    const w = workers.find(x => x.id === wId)
    setFormData({
      ...formData,
      worker_id: wId,
      site_id: w?.site_id || '',
      // We could also set a default termination date if needed
    })
  }

  const calculateFiniquito = () => {
    if (!selectedWorker) return
    const base = selectedWorker.base_salary || 0
    const daily = base / 30
    const daysWorkedMonth = 15 // Mocked
    const hab_mes = Math.round(daily * daysWorkedMonth)
    const hab_vac = Math.round(daily * 10) // Mocked

    const totalHaberes = hab_mes + hab_vac
    const totalDescuentos = formData.deudas.reduce((acc, d) => acc + d.valor, 0)
    
    setCalculation({
      haberes_imponibles: hab_mes,
      haberes_no_imponibles: hab_vac,
      descuentos: totalDescuentos,
      neto: totalHaberes - totalDescuentos
    })
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const payload = {
        ...formData,
        total_haberes_imponibles: calculation.haberes_imponibles,
        total_haberes_no_imponibles: calculation.haberes_no_imponibles,
        monto_bruto: calculation.haberes_imponibles + calculation.haberes_no_imponibles,
        monto_neto: calculation.neto,
        total_descuentos_deudas: calculation.descuentos,
        items: [
          { tipo: 'habere_imponible', nombre: 'Sueldo Proporcional', valor: calculation.haberes_imponibles },
          { tipo: 'habere_no_imponible', nombre: 'Vacaciones Proporcionales', valor: calculation.haberes_no_imponibles },
          ...formData.deudas.filter(d => d.valor > 0).map(d => ({ tipo: 'descuento_deuda', nombre: d.nombre, valor: d.valor, signo: '-' }))
        ]
      }
      
      const res = await apiFetch('http://127.0.0.1:8000/api/v1/finiquitos/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (!res.ok) {
        const errorData = await res.json()
        console.error("Finiquito POST Error:", errorData)
        throw new Error(errorData.detail ? JSON.stringify(errorData.detail) : 'Error desconocido')
      }
      const saved = await res.json()
      setCreatedId(saved.id)
      setStep(4)
    } catch (err) {
      alert(`Error al guardar finiquito: ${err.message}`)
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async (type) => {
    const url = `http://127.0.0.1:8000/api/v1/finiquitos/${createdId}/${type}`
    try {
      const response = await apiFetch(url)
      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = downloadUrl
      a.download = `${type}_${selectedWorker.rut}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
    } catch (err) {
      alert('Error al descargar el documento.')
    }
  }

  return (
    <MwPage title="Asistente de Finiquito" icon={Calculator}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        
        {/* Progress Bar */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          marginBottom: 32,
          padding: '0 20px'
        }}>
          {[1, 2, 3, 4].map(i => (
            <React.Fragment key={i}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 700,
                  backgroundColor: step === i ? '#1E4D8C' : step > i ? '#059669' : '#fff',
                  color: step >= i ? '#fff' : '#94A3B8',
                  border: step >= i ? 'none' : '2px solid #E2E8F0',
                  transition: 'all 0.3s'
                }}>
                  {step > i ? '✓' : i}
                </div>
                <span style={{ 
                  fontSize: 10, 
                  fontWeight: 700, 
                  color: step === i ? '#1E4D8C' : '#94A3B8',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  {i === 1 ? 'Término' : i === 2 ? 'Ajustes' : i === 3 ? 'Cálculo' : 'Éxito'}
                </span>
              </div>
              {i < 4 && <div style={{ flex: 1, height: 2, backgroundColor: step > i ? '#059669' : '#E2E8F0', margin: '0 10px', marginTop: -18 }} />}
            </React.Fragment>
          ))}
        </div>

        <MwCard style={{ padding: 40 }}>
          {step === 1 && (
            <div className="space-y-6">
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1E4D8C', marginBottom: 20 }}>1. Datos de Término</h3>
              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Trabajador a Finiquitar</label>
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
                  <div className="col-span-2 bg-blue-50/50 p-4 rounded-2xl border border-blue-100 flex items-center gap-4 animate-in fade-in slide-in-from-top-2">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-lg">
                      {selectedWorker.first_name[0]}{selectedWorker.last_name[0]}
                    </div>
                    <div className="flex-1 grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-[10px] font-bold text-blue-400 uppercase">RUT</p>
                        <p className="text-sm font-bold text-blue-900">{selectedWorker.rut}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-blue-400 uppercase">Cargo</p>
                        <p className="text-sm font-bold text-blue-900">{selectedWorker.position}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-blue-400 uppercase">Sueldo Base</p>
                        <p className="text-sm font-bold text-blue-900">${selectedWorker.base_salary?.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Fecha Último Día</label>
                  <input
                    type="date"
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none"
                    value={formData.fecha_ultimo_dia}
                    onChange={e => setFormData({ ...formData, fecha_ultimo_dia: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Faena de Término</label>
                  <select
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none"
                    value={formData.site_id}
                    onChange={e => setFormData({ ...formData, site_id: e.target.value })}
                  >
                    <option value="">Seleccione faena...</option>
                    {sites.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Causal Legal</label>
                  <select
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none"
                    value={formData.causal_articulo}
                    onChange={e => {
                      const c = causales.find(cx => `${cx.articulo} ${cx.numero || ''}` === e.target.value)
                      setFormData({ 
                        ...formData, 
                        causal_articulo: e.target.value,
                        causal_descripcion: c?.nombre || ''
                      })
                    }}
                  >
                    <option value="">Seleccione causal...</option>
                    {causales.map(c => (
                      <option key={c.id} value={`${c.articulo} ${c.numero || ''}`}>
                        Art. {c.articulo} {c.numero ? `N°${c.numero}` : ''}: {c.nombre}
                      </option>
                    ))}
                  </select>
                  {causales.length === 0 && <p className="text-[10px] text-red-500 mt-1">* No se cargaron causales. Contacte a soporte.</p>}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1E4D8C', marginBottom: 20 }}>2. Descuentos y Deudas</h3>
              <div className="bg-amber-50 p-4 rounded-xl flex gap-3 mb-6">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                <p className="text-sm text-amber-700">Ingrese deudas pendientes (EPP no devuelto, préstamos, etc.)</p>
              </div>

              {formData.deudas.map((d, i) => (
                <div key={i} className="flex gap-4 items-center mb-4">
                  <input
                    type="text"
                    className="flex-1 p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                    value={d.nombre}
                    onChange={e => {
                      const newD = [...formData.deudas]; newD[i].nombre = e.target.value;
                      setFormData({ ...formData, deudas: newD })
                    }}
                  />
                  <input
                    type="number"
                    className="w-32 p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-red-600"
                    value={d.valor}
                    onChange={e => {
                      const newD = [...formData.deudas]; newD[i].valor = parseInt(e.target.value) || 0;
                      setFormData({ ...formData, deudas: newD })
                    }}
                  />
                </div>
              ))}
              <MwButton onClick={() => setFormData({ ...formData, deudas: [...formData.deudas, { tipo: 'otro', nombre: 'Otro descuento', valor: 0 }] })}>
                + Añadir Descuento
              </MwButton>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1E4D8C', marginBottom: 20 }}>3. Resumen de Liquidación</h3>
              <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-600">Sueldo Proporcional</span>
                  <span className="font-bold">${calculation.haberes_imponibles.toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-600">Vacaciones Proporcionales</span>
                  <span className="font-bold">${calculation.haberes_no_imponibles.toLocaleString()}</span>
                </div>
                {formData.deudas.map((d, i) => d.valor > 0 && (
                  <div key={i} className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-red-600">{d.nombre}</span>
                    <span className="font-bold text-red-600">-${d.valor.toLocaleString()}</span>
                  </div>
                ))}
                <div className="flex justify-between pt-6">
                  <span className="text-lg font-bold text-gray-900">NETO A PAGAR</span>
                  <span className="text-xl font-black text-[#1E4D8C]">${calculation.neto.toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="text-center py-10">
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-10 h-10 text-emerald-600" />
              </div>
              <h3 style={{ fontSize: 24, fontWeight: 800, color: '#1E4D8C' }}>¡Proceso Completado!</h3>
              <p style={{ color: '#64748B', marginTop: 8, marginBottom: 32 }}>El finiquito se ha registrado y los documentos están listos.</p>
              
              <div className="grid grid-cols-2 gap-4">
                <button onClick={() => handleDownload('pdf')} className="flex flex-col items-center gap-3 p-6 border-2 border-dashed border-gray-200 rounded-2xl hover:border-blue-500 hover:bg-blue-50 group">
                  <FileText className="w-10 h-10 text-blue-600 group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-bold">Descargar Finiquito</span>
                </button>
                <button onClick={() => handleDownload('carta-aviso')} className="flex flex-col items-center gap-3 p-6 border-2 border-dashed border-gray-200 rounded-2xl hover:border-blue-500 hover:bg-blue-50 group">
                  <FileText className="w-10 h-10 text-blue-600 group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-bold">Descargar Carta Aviso</span>
                </button>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 40, paddingTop: 24, borderTop: '1px solid #F1F5F9' }}>
            {step < 4 && (
              <>
                <MwButton 
                  onClick={() => step === 1 ? navigate('/finiquitos') : setStep(s => s - 1)}
                  style={{ backgroundColor: '#fff', color: '#475569', border: '1px solid #E2E8F0' }}
                >
                  {step === 1 ? 'Cancelar' : 'Anterior'}
                </MwButton>
                
                {step < 3 ? (
                  <MwButton 
                    disabled={step === 1 && (!formData.worker_id || !formData.fecha_ultimo_dia || !formData.causal_articulo)}
                    onClick={() => setStep(s => s + 1)}
                  >
                    Siguiente Paso <ArrowRight className="w-4 h-4 ml-1" />
                  </MwButton>
                ) : (
                  <MwButton onClick={handleSubmit} disabled={loading} style={{ backgroundColor: '#059669' }}>
                    {loading ? 'Procesando...' : 'Confirmar y Generar'}
                  </MwButton>
                )}
              </>
            )}
            {step === 4 && (
              <MwButton onClick={() => navigate('/finiquitos')} style={{ width: '100%', backgroundColor: '#111827' }}>Volver a la Lista de Finiquitos</MwButton>
            )}
          </div>
        </MwCard>
      </div>
    </MwPage>
  )
}
