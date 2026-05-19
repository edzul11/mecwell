import { apiFetch } from '../supabaseClient'
import { useState, useEffect } from 'react'
import { FileSignature, Download, Settings, Plus, Trash2, Eye, X, ChevronDown, ChevronUp, CheckSquare, Square } from 'lucide-react'

export default function ContractsList() {
  const [workers, setWorkers] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedWorkerIds, setSelectedWorkerIds] = useState([])
  
  // Initialize from localStorage or defaults for global data
  const getInitialGlobalState = () => {
    const saved = localStorage.getItem('contractGlobalSettings')
    if (saved) return JSON.parse(saved)
    return {
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
      work_schedule: "44 horas semanales, distribuidas de lunes a jueves de 08:00 a 18:00 y los dias viernes de 08:00 a 17:00 horas, un tiempo intermedio destinado a colación de 1 horas",
      include_clause_13_14: true,
      old_employer_company: "MECWELL LIMITADA",
      old_employer_rut: "77.273.364-K",
      old_labor_start_date: "23 de febrero del 2026",
      custom_clauses: []
    }
  }

  const [globalFormData, setGlobalFormData] = useState(getInitialGlobalState())
  const [workersData, setWorkersData] = useState({}) // { workerId: WorkerSpecificData }
  const [expandedWorkerId, setExpandedWorkerId] = useState(null) // for accordion
  
  const [showPreview, setShowPreview] = useState(false)
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState(null)
  const [isPreviewLoading, setIsPreviewLoading] = useState(false)

  useEffect(() => {
    apiFetch('http://127.0.0.1:8000/api/v1/workers/')
      .then((res) => res.json())
      .then((data) => {
        setWorkers(data)
        setLoading(false)
      })
      .catch((err) => {
        console.error("Error fetching workers:", err)
        setLoading(false)
      })
  }, [])

  const toggleWorkerSelection = (worker) => {
    setSelectedWorkerIds(prev => {
      if (prev.includes(worker.id)) {
        // Remove worker
        const nextIds = prev.filter(id => id !== worker.id)
        if (expandedWorkerId === worker.id) setExpandedWorkerId(null)
        return nextIds
      } else {
        // Add worker
        setWorkersData(prevData => {
          if (!prevData[worker.id]) {
            return {
              ...prevData,
              [worker.id]: {
                worker_id: worker.id,
                worker_rut: worker.rut,
                worker_address: worker.address || "", // Assuming address might exist or be added later
                worker_commune: worker.commune || "Antofagasta",
                worker_region: worker.region || "Antofagasta",
                worker_nationality: worker.nationality || "chilena",
                worker_civil_status: worker.marital_status || "soltero(a)",
                worker_birth_date: worker.birth_date ? new Date(worker.birth_date).toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' }) : "01 de enero de 1990",
                job_position: worker.position || "maestro mayor",
                base_salary: worker.base_salary || 539000,
                site_id: worker.site_id || "",
              }
            }
          }
          return prevData
        })
        if (prev.length === 0) setExpandedWorkerId(worker.id) // expand the first one selected automatically
        return [...prev, worker.id]
      }
    })
  }

  const handleGlobalInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setGlobalFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleWorkerInputChange = (workerId, e) => {
    const { name, value } = e.target
    setWorkersData(prev => ({
      ...prev,
      [workerId]: {
        ...prev[workerId],
        [name]: value
      }
    }))
  }

  const handleAddCustomClause = () => {
    setGlobalFormData(prev => ({
      ...prev,
      custom_clauses: [...(prev.custom_clauses || []), ""]
    }))
  }

  const handleCustomClauseChange = (index, value) => {
    setGlobalFormData(prev => {
      const newClauses = [...(prev.custom_clauses || [])]
      newClauses[index] = value
      return { ...prev, custom_clauses: newClauses }
    })
  }

  const handleRemoveCustomClause = (index) => {
    setGlobalFormData(prev => {
      const newClauses = [...(prev.custom_clauses || [])]
      newClauses.splice(index, 1)
      return { ...prev, custom_clauses: newClauses }
    })
  }

  const getOrdinalSpanish = (num) => {
    const ordinals = {
        1: "PRIMERO", 2: "SEGUNDO", 3: "TERCERO", 4: "CUARTO", 5: "QUINTO",
        6: "SEXTO", 7: "SEPTIMO", 8: "OCTAVO", 9: "NOVENO", 10: "DECIMO",
        11: "DECIMO PRIMERO", 12: "DECIMO SEGUNDO", 13: "DECIMO TERCERO",
        14: "DECIMO CUARTO", 15: "DECIMO QUINTO", 16: "DECIMO SEXTO",
        17: "DECIMO SEPTIMO", 18: "DECIMO OCTAVO", 19: "DECIMO NOVENO",
        20: "VIGESIMO", 21: "VIGESIMO PRIMERO", 22: "VIGESIMO SEGUNDO",
        23: "VIGESIMO TERCERO", 24: "VIGESIMO CUARTO", 25: "VIGESIMO QUINTO",
        26: "VIGESIMO SEXTO", 27: "VIGESIMO SEPTIMO", 28: "VIGESIMO OCTAVO",
        29: "VIGESIMO NOVENO", 30: "TRIGESIMO"
    }
    return ordinals[num] || num.toString()
  }

  const buildPayload = () => {
    const workersPayload = selectedWorkerIds.map(id => workersData[id])
    return {
      ...globalFormData,
      workers: workersPayload
    }
  }

  const handleGeneratePDF = async () => {
    if (selectedWorkerIds.length === 0) return
    
    localStorage.setItem('contractGlobalSettings', JSON.stringify(globalFormData))
    
    try {
      const payload = buildPayload()
      
      const response = await apiFetch(`http://127.0.0.1:8000/api/v1/contracts/generate-bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      
      if (!response.ok) throw new Error("Error generating PDF")
        
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      // If single worker, it downloads as PDF. If multiple, as ZIP.
      const isZip = response.headers.get('content-type') === 'application/zip' || selectedWorkerIds.length > 1
      a.download = isZip ? 'contratos.zip' : `contrato.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
    } catch (error) {
      console.error(error)
      alert("Hubo un error al generar los contratos.")
    }
  }

  const handlePreviewPDF = async () => {
    if (selectedWorkerIds.length === 0) return
    setIsPreviewLoading(true)
    setShowPreview(true)
    
    localStorage.setItem('contractGlobalSettings', JSON.stringify(globalFormData))
    
    try {
      // Preview only the first selected worker to avoid generating ZIP in preview
      const previewPayload = {
        ...globalFormData,
        workers: [workersData[selectedWorkerIds[0]]]
      }
      
      const response = await apiFetch(`http://127.0.0.1:8000/api/v1/contracts/generate-bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(previewPayload)
      })
      
      if (!response.ok) throw new Error("Error generating PDF preview")
        
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      setPdfPreviewUrl(url)
    } catch (error) {
      console.error(error)
      alert("Hubo un error al previsualizar el contrato.")
      setShowPreview(false)
    } finally {
      setIsPreviewLoading(false)
    }
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      
      {/* Lado Izquierdo: Lista de Trabajadores con Checkboxes */}
      <div className="w-1/3 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900 flex items-center mb-1">
            <FileSignature className="w-5 h-5 mr-2 text-indigo-600" /> Contratos
          </h1>
          <p className="text-sm text-gray-500 mt-1">Selecciona uno o más trabajadores para generar sus contratos.</p>
        </div>
        
        <div className="overflow-y-auto flex-1 p-4 space-y-2">
          {loading ? (
            <p className="text-center text-gray-500 py-4 animate-pulse">Cargando...</p>
          ) : workers.map(w => {
            const isSelected = selectedWorkerIds.includes(w.id)
            return (
              <div 
                key={w.id} 
                onClick={() => toggleWorkerSelection(w)}
                className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center ${isSelected ? 'border-indigo-500 bg-indigo-50 shadow-sm ring-1 ring-indigo-500' : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'}`}
              >
                <div className="mr-4 text-indigo-600">
                  {isSelected ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5 text-gray-400" />}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{w.first_name} {w.last_name}</h3>
                  <p className="text-xs text-gray-500 mt-1">{w.rut} - {w.position}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Lado Derecho: Formulario */}
      <div className="w-2/3 bg-gray-50 overflow-y-auto">
        {selectedWorkerIds.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <FileSignature className="w-16 h-16 mb-4 text-gray-300" />
            <h2 className="text-lg font-medium text-gray-900">Selecciona Trabajadores</h2>
            <p className="text-sm">Elige trabajadores de la lista para configurar los contratos.</p>
          </div>
        ) : (
          <div className="p-8 max-w-4xl mx-auto space-y-8">
            
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex justify-between items-center sticky top-0 z-10">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Configuración de Contratos</h2>
                <div className="mt-1 text-sm text-gray-500">
                  Seleccionados: <span className="font-semibold">{selectedWorkerIds.length} trabajador{selectedWorkerIds.length > 1 ? 'es' : ''}</span>
                </div>
              </div>
              <div className="flex space-x-3">
                <button 
                  onClick={showPreview ? () => setShowPreview(false) : handlePreviewPDF}
                  className={`inline-flex items-center rounded-md px-4 py-2.5 text-sm font-semibold shadow-sm transition-colors ${showPreview ? 'bg-gray-200 text-gray-800 hover:bg-gray-300' : 'bg-white text-indigo-600 border border-indigo-200 hover:bg-indigo-50'}`}
                >
                  <Eye className="mr-2 h-4 w-4" /> {showPreview ? 'Ocultar Vista Previa' : 'Vista Previa (1ro)'}
                </button>
                <button 
                  onClick={handleGeneratePDF}
                  className="inline-flex items-center rounded-md bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors"
                >
                  <Download className="mr-2 h-4 w-4" /> Descargar {selectedWorkerIds.length > 1 ? 'ZIP' : 'PDF'}
                </button>
              </div>
            </div>

            {showPreview && (
              <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-200 shadow-sm animate-in fade-in slide-in-from-top-4 relative">
                <button 
                  onClick={() => setShowPreview(false)} 
                  className="absolute top-4 right-4 text-indigo-400 hover:text-indigo-600"
                >
                  <X className="w-5 h-5" />
                </button>
                <h3 className="font-semibold text-indigo-900 mb-4 flex items-center">
                  <Eye className="w-5 h-5 mr-2" /> Vista Previa del Documento (Primer Trabajador)
                </h3>
                
                {isPreviewLoading ? (
                  <div className="flex justify-center items-center h-[600px] bg-white rounded-lg border border-indigo-100">
                    <div className="animate-pulse text-indigo-400 flex flex-col items-center">
                      <FileSignature className="w-12 h-12 mb-2" />
                      <p>Generando PDF en tiempo real...</p>
                    </div>
                  </div>
                ) : pdfPreviewUrl ? (
                  <iframe 
                    src={pdfPreviewUrl} 
                    className="w-full h-[600px] rounded-lg border border-indigo-100 shadow-sm"
                    title="Vista Previa PDF"
                  />
                ) : null}
              </div>
            )}

            {/* Accordion List for Specific Worker Data */}
            <div className="space-y-4">
              <h3 className="font-bold text-gray-900 text-lg border-b pb-2">Antecedentes Personales Específicos</h3>
              {selectedWorkerIds.map(workerId => {
                const w = workers.find(x => x.id === workerId)
                const isExpanded = expandedWorkerId === workerId
                return (
                  <div key={workerId} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div 
                      onClick={() => setExpandedWorkerId(isExpanded ? null : workerId)}
                      className={`px-6 py-4 flex justify-between items-center cursor-pointer hover:bg-gray-50 transition-colors ${isExpanded ? 'bg-indigo-50/50 border-b border-gray-200' : ''}`}
                    >
                      <div>
                        <h4 className="font-semibold text-gray-900">{w.first_name} {w.last_name}</h4>
                        <p className="text-xs text-gray-500">{w.rut}</p>
                      </div>
                      {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                    </div>
                    {isExpanded && (
                      <div className="p-6 grid grid-cols-2 gap-4 bg-white animate-in slide-in-from-top-2">
                        <div className="col-span-2">
                          <label className="block text-xs font-medium text-gray-700">Domicilio Particular</label>
                          <input type="text" name="worker_address" value={workersData[workerId]?.worker_address || ''} onChange={(e) => handleWorkerInputChange(workerId, e)} className="mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 sm:text-sm" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700">Comuna</label>
                          <input type="text" name="worker_commune" value={workersData[workerId]?.worker_commune || ''} onChange={(e) => handleWorkerInputChange(workerId, e)} className="mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 sm:text-sm" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700">Región</label>
                          <input type="text" name="worker_region" value={workersData[workerId]?.worker_region || ''} onChange={(e) => handleWorkerInputChange(workerId, e)} className="mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 sm:text-sm" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700">Nacionalidad</label>
                          <input type="text" name="worker_nationality" value={workersData[workerId]?.worker_nationality || ''} onChange={(e) => handleWorkerInputChange(workerId, e)} className="mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 sm:text-sm" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700">Estado Civil</label>
                          <input type="text" name="worker_civil_status" value={workersData[workerId]?.worker_civil_status || ''} onChange={(e) => handleWorkerInputChange(workerId, e)} className="mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 sm:text-sm" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700">Fecha de Nacimiento</label>
                          <input type="text" name="worker_birth_date" placeholder="ej. 01 de julio de 1983" value={workersData[workerId]?.worker_birth_date || ''} onChange={(e) => handleWorkerInputChange(workerId, e)} className="mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 sm:text-sm" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700">Cargo Específico</label>
                          <input type="text" name="job_position" value={workersData[workerId]?.job_position || ''} onChange={(e) => handleWorkerInputChange(workerId, e)} className="mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 sm:text-sm" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700">Sueldo Base ($)</label>
                          <input type="number" name="base_salary" value={workersData[workerId]?.base_salary || ''} onChange={(e) => handleWorkerInputChange(workerId, e)} className="mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 sm:text-sm" />
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Global Settings */}
            <div className="space-y-6">
              <div className="bg-indigo-50/50 rounded-xl p-4 border border-indigo-100 flex items-start">
                <Settings className="w-5 h-5 text-indigo-500 mr-3 mt-0.5 shrink-0" />
                <p className="text-sm text-indigo-800">
                  Los datos globales ingresados a continuación se guardarán automáticamente y aplicarán para <strong>todos</strong> los contratos seleccionados.
                </p>
              </div>

              {/* Bloque: Datos del Empleador */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-4 border-b pb-2">1. Datos Globales del Empleador (Empresa)</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700">Razón Social</label>
                    <input type="text" name="employer_company" value={globalFormData.employer_company} onChange={handleGlobalInputChange} className="mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 sm:text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700">RUT Empresa</label>
                    <input type="text" name="employer_rut" value={globalFormData.employer_rut} onChange={handleGlobalInputChange} className="mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 sm:text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700">Representante Legal</label>
                    <input type="text" name="employer_rep" value={globalFormData.employer_rep} onChange={handleGlobalInputChange} className="mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 sm:text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700">RUT Representante</label>
                    <input type="text" name="employer_rep_rut" value={globalFormData.employer_rep_rut} onChange={handleGlobalInputChange} className="mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 sm:text-sm" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-700">Domicilio Empresa</label>
                    <input type="text" name="employer_address" value={globalFormData.employer_address} onChange={handleGlobalInputChange} className="mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 sm:text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700">Ciudad Empresa</label>
                    <input type="text" name="employer_city" value={globalFormData.employer_city} onChange={handleGlobalInputChange} className="mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 sm:text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700">Correo Electrónico</label>
                    <input type="email" name="employer_email" value={globalFormData.employer_email} onChange={handleGlobalInputChange} className="mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 sm:text-sm" />
                  </div>
                </div>
              </div>

              {/* Bloque: Condiciones y Tiempos */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-4 border-b pb-2">2. Condiciones Globales (Faena y Tiempos)</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700">Fecha Redacción Contrato</label>
                    <input type="text" name="contract_date" value={globalFormData.contract_date} onChange={handleGlobalInputChange} className="mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 sm:text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700">Fecha Inicio Relación Laboral</label>
                    <input type="text" name="contract_start_date" value={globalFormData.contract_start_date} onChange={handleGlobalInputChange} className="mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 sm:text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700">Duración del Contrato</label>
                    <input type="text" name="contract_duration" placeholder="ej. 60 DIAS o Indefinido" value={globalFormData.contract_duration} onChange={handleGlobalInputChange} className="mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 sm:text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700">Ciudad de Desempeño</label>
                    <input type="text" name="job_city" value={globalFormData.job_city} onChange={handleGlobalInputChange} className="mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 sm:text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700">Empresa Mandante / Dependencia</label>
                    <input type="text" name="job_site" value={globalFormData.job_site} onChange={handleGlobalInputChange} className="mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 sm:text-sm" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-700">Dirección Faena / Obra</label>
                    <input type="text" name="job_site_address" value={globalFormData.job_site_address} onChange={handleGlobalInputChange} className="mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 sm:text-sm" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-700">Labor Específica</label>
                    <input type="text" name="job_specific_task" value={globalFormData.job_specific_task} onChange={handleGlobalInputChange} className="mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 sm:text-sm" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-700">Jornada Laboral y Horarios</label>
                    <textarea name="work_schedule" value={globalFormData.work_schedule} onChange={handleGlobalInputChange} rows={3} className="mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 sm:text-sm" />
                  </div>
                </div>
              </div>

              {/* Bloque: Cláusulas Especiales */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-4 border-b pb-2">3. Cláusulas Especiales (Continuidad Laboral)</h3>
                
                <label className="flex items-center space-x-3 mb-6 cursor-pointer">
                  <input type="checkbox" name="include_clause_13_14" checked={globalFormData.include_clause_13_14} onChange={handleGlobalInputChange} className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600" />
                  <span className="text-sm font-medium text-gray-900">Incluir Cláusulas 13 y 14 (Traspaso y continuidad de antigua empresa)</span>
                </label>

                {globalFormData.include_clause_13_14 && (
                  <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg border border-gray-100">
                    <div className="col-span-2">
                      <p className="text-xs text-gray-500 mb-4">Ingresa los datos de la razón social ANTERIOR del trabajador para dejar constancia de la continuidad laboral.</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700">Antigua Razón Social</label>
                      <input type="text" name="old_employer_company" value={globalFormData.old_employer_company} onChange={handleGlobalInputChange} className="mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 sm:text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700">RUT Antigua Empresa</label>
                      <input type="text" name="old_employer_rut" value={globalFormData.old_employer_rut} onChange={handleGlobalInputChange} className="mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 sm:text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700">Fecha Inicio Contrato Antiguo</label>
                      <input type="text" name="old_labor_start_date" value={globalFormData.old_labor_start_date} onChange={handleGlobalInputChange} className="mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 sm:text-sm" />
                    </div>
                  </div>
                )}

                <div className="mt-8 border-t border-gray-100 pt-6">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-medium text-gray-900">4. Cláusulas Adicionales Personalizadas</h4>
                    <button 
                      onClick={handleAddCustomClause}
                      className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                    >
                      <Plus className="w-4 h-4 mr-1" /> Añadir Cláusula
                    </button>
                  </div>
                  
                  {(!globalFormData.custom_clauses || globalFormData.custom_clauses.length === 0) ? (
                    <p className="text-sm text-gray-500 italic">No hay cláusulas adicionales.</p>
                  ) : (
                    <div className="space-y-4">
                      {globalFormData.custom_clauses.map((clause, index) => {
                        const clauseNumber = 12 + (globalFormData.include_clause_13_14 ? 2 : 0) + index + 1;
                        return (
                          <div key={index} className="flex gap-3 items-start bg-gray-50 p-3 rounded-lg border border-gray-100">
                            <div className="font-semibold text-gray-700 text-sm whitespace-nowrap pt-2 w-32">
                              {getOrdinalSpanish(clauseNumber)}:
                            </div>
                            <textarea 
                              value={clause}
                              onChange={(e) => handleCustomClauseChange(index, e.target.value)}
                              placeholder="Redacta la cláusula aquí..."
                              rows={3}
                              className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 sm:text-sm"
                            />
                            <button 
                              onClick={() => handleRemoveCustomClause(index)}
                              className="text-red-400 hover:text-red-600 p-2"
                              title="Eliminar cláusula"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  )
}
