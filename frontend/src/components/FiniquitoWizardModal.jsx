import React, { useState, useEffect } from 'react'
import { apiFetch } from '../supabaseClient'
import { X, ArrowRight, ArrowLeft, FileX, Calculator, FileText, AlertCircle, HardHat } from 'lucide-react'

export default function FiniquitoWizardModal({ isOpen, onClose, workers, onSave }) {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
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
      // Fetch causales
      const cRes = await apiFetch('http://127.0.0.1:8000/api/v1/finiquitos/causales')
      const cData = await cRes.json()
      setCausales(cData)

      // Fetch sites
      const sRes = await apiFetch('http://127.0.0.1:8000/api/v1/sites/')
      const sData = await sRes.json()
      setSites(sData)
    } catch (err) {
      console.error("Error loading wizard data", err)
    }
  }

  useEffect(() => {
    if (step === 3 && selectedWorker) {
      calculateFiniquito()
    }
  }, [step, selectedWorker])

  const handleNext = () => setStep(s => s + 1)
  const handleBack = () => setStep(s => s - 1)

  const calculateFiniquito = () => {
    // Basic mock calculation for demo/wizard feedback
    const base = selectedWorker.base_salary || 0
    const daily = base / 30
    
    // 1. Proportional month days (if any)
    const daysWorkedMonth = 15 // Mocked for now
    const hab_mes = Math.round(daily * daysWorkedMonth)
    
    // 2. Proportional Vacations (Mock 1.25 days per month)
    // In a real app we'd fetch this from the balance endpoint
    const hab_vac = Math.round(daily * 10) 

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
        monto_bruto: calculation.haberes_imponibles + calculation.haberes_no_imponibles,
        monto_neto: calculation.neto,
        total_descuentos_deudas: calculation.descuentos,
        items: [
          { tipo: 'habere_imponible', nombre: 'Sueldo Proporcional', valor: calculation.haberes_imponibles },
          { tipo: 'habere_no_imponible', nombre: 'Vacaciones Proporcionales', valor: calculation.haberes_no_imponibles },
          ...formData.deudas.map(d => ({ tipo: 'descuento_deuda', nombre: d.nombre, valor: d.valor, signo: '-' }))
        ]
      }
      
      const res = await apiFetch('http://127.0.0.1:8000/api/v1/finiquitos/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (!res.ok) throw new Error()
      const saved = await res.json()
      setCreatedId(saved.id)
      setStep(4) // Move to success/documents step
      onSave()
    } catch (err) {
      alert('Error al guardar finiquito.')
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-gray-100">
        {/* Header con Steps */}
        <div className="bg-[#1E4D8C] px-8 py-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-xl">
                <Calculator className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-xl font-bold tracking-tight">Asistente de Finiquito</h2>
            </div>
            <button onClick={onClose} className="hover:bg-white/10 p-2 rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex items-center gap-4 mt-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${
                  step === i ? 'bg-white text-[#1E4D8C] border-white scale-110 shadow-lg' : 
                  step > i ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-transparent border-white/30 text-white/50'
                }`}>
                  {step > i ? '✓' : i}
                </div>
                <span className={`text-xs font-semibold uppercase tracking-wider ${step === i ? 'text-white' : 'text-white/40'}`}>
                  {i === 1 ? 'Término' : i === 2 ? 'Ajustes' : i === 3 ? 'Cálculo' : 'Documentos'}
                </span>
                {i < 4 && <div className="w-8 h-px bg-white/20 mx-1" />}
              </div>
            ))}
          </div>
        </div>

        <div className="p-8 max-h-[70vh] overflow-y-auto">
          {step === 1 && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <div className="grid grid-cols-2 gap-5">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 tracking-wider">Seleccionar Trabajador</label>
                  <select
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formData.worker_id}
                    onChange={e => setFormData({ ...formData, worker_id: e.target.value })}
                  >
                    <option value="">Buscar por nombre...</option>
                    {workers.map(w => (
                      <option key={w.id} value={w.id}>{w.first_name} {w.last_name} ({w.rut})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 tracking-wider">Fecha Último Día</label>
                  <input
                    type="date"
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                    value={formData.fecha_ultimo_dia}
                    onChange={e => setFormData({ ...formData, fecha_ultimo_dia: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 tracking-wider">Faena de Término</label>
                  <select
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm"
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
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 tracking-wider">Causal Legal (Código del Trabajo)</label>
                  <select
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm"
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
                        {c.articulo} {c.numero}: {c.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-lg flex gap-3 mb-6">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                <p className="text-xs text-amber-700 leading-relaxed">
                  Ingrese cualquier deuda pendiente o descuento especial que deba aplicarse al finiquito del trabajador.
                </p>
              </div>

              {formData.deudas.map((d, i) => (
                <div key={i} className="flex items-end gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <div className="flex-1">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Concepto</label>
                    <input
                      type="text"
                      className="w-full p-2 border-b border-gray-300 bg-transparent text-sm focus:border-blue-500 outline-none"
                      value={d.nombre}
                      onChange={e => {
                        const newDeudas = [...formData.deudas]
                        newDeudas[i].nombre = e.target.value
                        setFormData({ ...formData, deudas: newDeudas })
                      }}
                    />
                  </div>
                  <div className="w-32">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Monto ($)</label>
                    <input
                      type="number"
                      className="w-full p-2 border-b border-gray-300 bg-transparent text-sm font-bold text-red-600 outline-none"
                      value={d.valor}
                      onChange={e => {
                        const newDeudas = [...formData.deudas]
                        newDeudas[i].valor = parseInt(e.target.value) || 0
                        setFormData({ ...formData, deudas: newDeudas })
                      }}
                    />
                  </div>
                </div>
              ))}
              
              <button 
                onClick={() => setFormData({ ...formData, deudas: [...formData.deudas, { tipo: 'descuento_otro', nombre: 'Otro descuento', valor: 0 }] })}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 mt-2"
              >
                + Añadir otro descuento
              </button>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-in zoom-in-95 duration-300">
               <div className="bg-emerald-50 rounded-2xl p-6 border border-emerald-100">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-emerald-900">Resumen de Cálculo</h3>
                    <span className="text-xs font-bold px-3 py-1 bg-emerald-200 text-emerald-800 rounded-full">Automático</span>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm py-2 border-b border-emerald-100/50">
                      <span className="text-emerald-700">Sueldo Proporcional (Días mes)</span>
                      <span className="font-bold text-emerald-900">${calculation.haberes_imponibles.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm py-2 border-b border-emerald-100/50">
                      <span className="text-emerald-700">Vacaciones Proporcionales</span>
                      <span className="font-bold text-emerald-900">${calculation.haberes_no_imponibles.toLocaleString()}</span>
                    </div>
                    {formData.deudas.map((d, i) => d.valor > 0 && (
                      <div key={i} className="flex justify-between text-sm py-2 border-b border-emerald-100/50">
                        <span className="text-red-600 font-medium">{d.nombre}</span>
                        <span className="font-bold text-red-600">-${d.valor.toLocaleString()}</span>
                      </div>
                    ))}
                    <div className="flex justify-between text-lg font-black pt-4">
                      <span className="text-emerald-950">TOTAL NETO A PAGAR</span>
                      <span className="text-[#1E4D8C]">${calculation.neto.toLocaleString()}</span>
                    </div>
                  </div>
               </div>
            </div>
          )}

          {step === 4 && (
            <div className="text-center py-6 space-y-6 animate-in fade-in duration-500">
              <div className="bg-emerald-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">¡Finiquito Generado con Éxito!</h3>
                <p className="text-gray-500 mt-1 text-sm">Los documentos legales ya están disponibles para su descarga.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => handleDownload('pdf')}
                  className="flex flex-col items-center gap-3 p-6 bg-white border border-gray-200 rounded-2xl hover:border-blue-500 hover:bg-blue-50 transition-all group"
                >
                  <FileText className="w-10 h-10 text-blue-600 group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-bold text-gray-700">Descargar Finiquito</span>
                </button>
                <button 
                  onClick={() => handleDownload('carta-aviso')}
                  className="flex flex-col items-center gap-3 p-6 bg-white border border-gray-200 rounded-2xl hover:border-blue-500 hover:bg-blue-50 transition-all group"
                >
                  <FileText className="w-10 h-10 text-blue-600 group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-bold text-gray-700">Descargar Carta Aviso</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer con Navegación */}
        <div className="p-8 bg-gray-50 border-t border-gray-100 flex justify-between gap-4">
          {step < 4 && (
            <button
              onClick={step === 1 ? onClose : handleBack}
              className="px-6 py-3 border border-gray-300 rounded-2xl text-sm font-bold text-gray-600 hover:bg-white transition-all flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> {step === 1 ? 'Cancelar' : 'Anterior'}
            </button>
          )}
          
          {step < 3 ? (
            <button
              onClick={handleNext}
              disabled={step === 1 && (!formData.worker_id || !formData.fecha_ultimo_dia || !formData.causal_articulo)}
              className="ml-auto px-8 py-3 bg-[#1E4D8C] text-white rounded-2xl text-sm font-bold hover:bg-[#163d6f] disabled:bg-gray-300 shadow-lg shadow-blue-900/10 transition-all flex items-center gap-2"
            >
              Siguiente <ArrowRight className="w-4 h-4" />
            </button>
          ) : step === 3 ? (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-10 py-3 bg-emerald-600 text-white rounded-2xl text-sm font-bold hover:bg-emerald-700 disabled:bg-gray-300 shadow-lg shadow-emerald-900/10 transition-all"
            >
              {loading ? 'Generando...' : 'Confirmar y Generar Finiquito'}
            </button>
          ) : (
            <button
              onClick={onClose}
              className="w-full py-3 bg-gray-900 text-white rounded-2xl text-sm font-bold hover:bg-black transition-all"
            >
              Cerrar Asistente
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
