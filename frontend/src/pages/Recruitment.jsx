import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiFetch, uploadToSupabaseStorage } from '../supabaseClient'
import { 
  MwPage, MwCard, MwButton, MwTable, MwTr, MwTd, StatusBadge 
} from '../components/MecwellUI'
import { 
  User, Briefcase, FileText, CheckCircle, UploadCloud, AlertTriangle, Eye, Download, Info
} from 'lucide-react'

export default function Recruitment() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('personales') // 'personales', 'laborales', 'documentos', 'contrato', 'exito'
  const [loading, setLoading] = useState(false)
  const [sites, setSites] = useState([])
  const [createdWorker, setCreatedWorker] = useState(null)

  const [birthDay, setBirthDay] = useState('')
  const [birthMonth, setBirthMonth] = useState('')
  const [birthYear, setBirthYear] = useState('')

  // Step 1: Personal Data
  const [personalData, setPersonalData] = useState({
    first_name: '',
    last_name: '',
    rut: '',
    email: '',
    birth_date: '',
    marital_status: 'soltero(a)',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    bank_name: '',
    account_type: '',
    account_number: '',
    clothing_size: '',
    shoe_size: '',
    glove_size: ''
  })

  // Step 2: Labor Data
  const [laborData, setLaborData] = useState({
    position: '',
    base_salary: 539000,
    health_institution: 'Fonasa',
    pension_fund: 'Modelo',
    shift: '5x2',
    entry_date: new Date().toISOString().split('T')[0],
    site_id: '',
    deliver_epp: false
  })

  // Step 3: Document uploads
  const [documents, setDocuments] = useState({
    ci: null,
    examen: null,
    afp: null,
    salud: null
  })
  const [docUploadStatus, setDocUploadStatus] = useState({
    ci: 'pending', // 'pending', 'uploading', 'success', 'error'
    examen: 'pending',
    afp: 'pending',
    salud: 'pending'
  })

  // Step 4: Contract Settings
  const [contractSettings, setContractSettings] = useState({
    employer_company: "MECWELL LIMITADA",
    employer_rut: "78.349.631-3",
    employer_rep: "Sergio Hans Farías Anabalón",
    employer_rep_rut: "15.019.122-k",
    employer_address: "Uribe # 636 depto. 302",
    employer_city: "Antofagasta",
    employer_email: "mecwelllimitada@gmail.com",
    contract_date: new Date().toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' }),
    contract_start_date: new Date().toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' }),
    contract_duration: "60 DIAS",
    job_city: "Mejillones",
    job_site: "NORACID",
    job_site_address: "Tercera Industrial # 850",
    job_specific_task: "Levantamiento condiciones de riesgo",
    work_schedule: "44 horas semanales, distribuidas de lunes a jueves de 08:00 a 18:00 y los dias viernes de 08:00 a 17:00 horas, un tiempo intermedio destinado a colación de 1 horas",
    include_clause_13_14: false,
    old_employer_company: "MECWELL LIMITADA",
    old_employer_rut: "77.273.364-K",
    old_labor_start_date: new Date().toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' }),
    custom_clauses: []
  })

  const [workerSpecificContract, setWorkerSpecificContract] = useState({
    worker_address: '',
    worker_commune: 'Antofagasta',
    worker_region: 'Antofagasta',
    worker_nationality: 'chilena',
    worker_civil_status: 'soltero(a)',
    worker_birth_date: '',
    job_position: '',
    base_salary: 539000
  })

  const [showPreview, setShowPreview] = useState(false)
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState(null)
  const [isPreviewLoading, setIsPreviewLoading] = useState(false)

  // Fetch sites for assignment
  useEffect(() => {
    apiFetch('http://127.0.0.1:8000/api/v1/sites/')
      .then(r => r.json())
      .then(data => setSites(Array.isArray(data) ? data : []))
      .catch(console.error)
  }, [])

  // Sync three birth date selectors to personalData.birth_date
  useEffect(() => {
    if (birthDay && birthMonth && birthYear) {
      const dd = String(birthDay).padStart(2, '0')
      const mm = String(birthMonth).padStart(2, '0')
      const yyyy = birthYear
      setPersonalData(prev => ({ ...prev, birth_date: `${yyyy}-${mm}-${dd}` }))
    } else {
      setPersonalData(prev => ({ ...prev, birth_date: '' }))
    }
  }, [birthDay, birthMonth, birthYear])

  // Sync personal/labor details with contract preview when transitioning
  useEffect(() => {
    if (createdWorker) {
      setWorkerSpecificContract({
        worker_address: personalData.worker_address || '',
        worker_commune: 'Antofagasta',
        worker_region: 'Antofagasta',
        worker_nationality: 'chilena',
        worker_civil_status: personalData.marital_status || 'soltero(a)',
        worker_birth_date: personalData.birth_date ? new Date(personalData.birth_date).toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' }) : '',
        job_position: laborData.position || '',
        base_salary: laborData.base_salary || 539000
      })

      // Sync site location info
      const selectedSite = sites.find(s => s.id === laborData.site_id)
      if (selectedSite) {
        setContractSettings(prev => ({
          ...prev,
          job_site: selectedSite.name,
          job_city: selectedSite.location || 'Antofagasta'
        }))
      }
    }
  }, [createdWorker, sites])

  const handlePersonalChange = (e) => {
    const { name, value } = e.target
    setPersonalData(prev => ({ ...prev, [name]: value }))
  }

  const handleLaborChange = (e) => {
    const { name, value, type, checked } = e.target
    setLaborData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : (name === 'base_salary' ? Number(value) : value) 
    }))
  }

  const handleContractSettingsChange = (e) => {
    const { name, value, type, checked } = e.target
    setContractSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleWorkerSpecificContractChange = (e) => {
    const { name, value } = e.target
    setWorkerSpecificContract(prev => ({ ...prev, [name]: value }))
  }

  // Step 1 to Step 2
  const nextToLabor = (e) => {
    e.preventDefault()
    if (!personalData.first_name || !personalData.last_name || !personalData.rut) {
      alert("Por favor rellene los campos obligatorios (*)")
      return
    }
    setActiveTab('laborales')
  }

  // Step 2 Save to Database (Creates Worker record)
  const saveWorkerAndContinue = async (e) => {
    e.preventDefault()
    if (!laborData.position || !laborData.site_id) {
      alert("Por favor seleccione un cargo y una faena de asignación (*)")
      return
    }
    setLoading(true)
    try {
      const fullWorkerPayload = {
        ...personalData,
        ...laborData,
        status: 'active'
      }

      // 1. Post to API to create worker
      const response = await apiFetch('http://127.0.0.1:8000/api/v1/workers/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fullWorkerPayload)
      })

      if (!response.ok) {
        throw new Error('Error al crear el perfil del trabajador. Compruebe que el RUT no esté duplicado.')
      }

      const newWorker = await response.json()
      setCreatedWorker(newWorker)

      // 2. Deliver initial EPP if delivery option is checked
      if (laborData.deliver_epp) {
        // We deliver a standard basic safety kit (Zapatos, Casco, Chaleco Reflectante)
        const eppItems = [
          { item_name: 'Zapatos de Seguridad', category: 'Calzado', size: personalData.shoe_size || '42', quantity: 1, cost: 25000, condition: 'Nuevo' },
          { item_name: 'Casco de Seguridad', category: 'Cabecera', size: 'Única', quantity: 1, cost: 8000, condition: 'Nuevo' },
          { item_name: 'Chaleco Reflectante', category: 'Vestuario', size: personalData.clothing_size || 'L', quantity: 1, cost: 5000, condition: 'Nuevo' }
        ]
        
        for (const item of eppItems) {
          await apiFetch('http://127.0.0.1:8000/api/v1/ppe/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              worker_id: newWorker.id,
              ...item,
              delivery_date: new Date().toISOString().split('T')[0]
            })
          }).catch(err => console.error("Error creating PPE record:", err))
        }
      }

      setActiveTab('documentos')
    } catch (err) {
      alert(err.message)
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Document upload logic
  const uploadDoc = async (type, file, docTypeName, docFriendlyName) => {
    if (!file || !createdWorker) return
    setDocUploadStatus(prev => ({ ...prev, [type]: 'uploading' }))
    try {
      const fileExt = file.name.split('.').pop()
      const cleanType = docTypeName.replace(/\s+/g, '')
      const storagePath = `workers/${createdWorker.id}/${Date.now()}-${cleanType}.${fileExt}`
      
      const uploadedUrl = await uploadToSupabaseStorage('documents', storagePath, file)

      // Save document record in database linked to this worker
      const response = await apiFetch('http://127.0.0.1:8000/api/v1/documents/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          worker_id: createdWorker.id,
          name: docFriendlyName,
          document_type: docTypeName,
          expiration_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0], // 1 year expiry
          file_url: uploadedUrl
        })
      })
      
      if (!response.ok) throw new Error('Error al guardar documento')
      setDocUploadStatus(prev => ({ ...prev, [type]: 'success' }))
    } catch (err) {
      setDocUploadStatus(prev => ({ ...prev, [type]: 'error' }))
      console.error(err)
    }
  }

  const handleFileChange = (type, e, docTypeName, docFriendlyName) => {
    const file = e.target.files[0]
    if (file) {
      setDocuments(prev => ({ ...prev, [type]: file }))
      uploadDoc(type, file, docTypeName, docFriendlyName)
    }
  }

  // Preview Contract
  const handlePreviewPDF = async () => {
    if (!createdWorker) return
    setIsPreviewLoading(true)
    setShowPreview(true)
    
    try {
      const previewPayload = {
        ...contractSettings,
        workers: [
          {
            worker_id: createdWorker.id,
            ...workerSpecificContract
          }
        ]
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

  // Trigger preview automatically when reaching the contract step
  useEffect(() => {
    if (activeTab === 'contrato' && createdWorker) {
      handlePreviewPDF()
    }
  }, [activeTab])

  // Generate & Download Contract
  const handleGenerateContract = async () => {
    if (!createdWorker) return
    setLoading(true)
    try {
      const payload = {
        ...contractSettings,
        workers: [
          {
            worker_id: createdWorker.id,
            ...workerSpecificContract
          }
        ]
      }
      
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
      a.download = `contrato_${personalData.rut}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      
      setActiveTab('exito')
    } catch (error) {
      console.error(error)
      alert("Hubo un error al generar y descargar el contrato.")
    } finally {
      setLoading(false)
    }
  }

  const missingDocs = Object.keys(documents).filter(key => !documents[key])

  return (
    <MwPage title="Contratación de Trabajadores" icon={Briefcase}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        
        {/* Step Indicator (Tab Header style) */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          marginBottom: 32,
          padding: '0 20px'
        }}>
          {[
            { id: 'personales', label: '1. Datos Personales', icon: User },
            { id: 'laborales', label: '2. Laborales y Faena', icon: Briefcase },
            { id: 'documentos', label: '3. Documentación', icon: UploadCloud },
            { id: 'contrato', label: '4. Contrato', icon: FileText }
          ].map((step, idx) => {
            const stepIndex = idx + 1
            const currentIdx = ['personales', 'laborales', 'documentos', 'contrato', 'exito'].indexOf(activeTab) + 1
            const isCompleted = currentIdx > stepIndex
            const isActive = activeTab === step.id
            
            return (
              <React.Fragment key={step.id}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, fontWeight: 700,
                    backgroundColor: isActive ? '#1E4D8C' : isCompleted ? '#059669' : '#fff',
                    color: (isActive || isCompleted) ? '#fff' : '#94A3B8',
                    border: (isActive || isCompleted) ? 'none' : '2px solid #E2E8F0',
                    boxShadow: isActive ? '0 0 0 4px rgba(30,77,140,0.15)' : 'none',
                    transition: 'all 0.3s'
                  }}>
                    {isCompleted ? '✓' : stepIndex}
                  </div>
                  <span style={{ 
                    fontSize: 11, 
                    fontWeight: 700, 
                    color: isActive ? '#1E4D8C' : isCompleted ? '#059669' : '#94A3B8',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    {step.label.split('. ')[1]}
                  </span>
                </div>
                {idx < 3 && <div style={{ flex: 1, height: 2, backgroundColor: isCompleted ? '#059669' : '#E2E8F0', margin: '0 10px', marginTop: -20 }} />}
              </React.Fragment>
            )
          })}
        </div>

        {/* Tab Contents */}
        <MwCard style={{ padding: 40, border: '1px solid #E2E8F0', borderRadius: 16 }}>
          
          {/* Step 1: Personal Data */}
          {activeTab === 'personales' && (
            <form onSubmit={nextToLabor}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1E4D8C', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
                <User className="w-5 h-5 text-indigo-600" /> 1. Antecedentes Personales del Trabajador
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Nombre *</label>
                  <input required type="text" name="first_name" value={personalData.first_name} onChange={handlePersonalChange} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Apellidos *</label>
                  <input required type="text" name="last_name" value={personalData.last_name} onChange={handlePersonalChange} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">RUT *</label>
                  <input required type="text" name="rut" placeholder="12.345.678-9" value={personalData.rut} onChange={handlePersonalChange} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-500" />
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Correo Electrónico</label>
                  <input type="email" name="email" value={personalData.email} onChange={handlePersonalChange} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Fecha de Nacimiento</label>
                  <div className="grid grid-cols-3 gap-2">
                    <select
                      value={birthDay}
                      onChange={(e) => setBirthDay(e.target.value)}
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-500"
                    >
                      <option value="">Día</option>
                      {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                    <select
                      value={birthMonth}
                      onChange={(e) => setBirthMonth(e.target.value)}
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-500"
                    >
                      <option value="">Mes</option>
                      {[
                        { val: 1, name: 'Enero' },
                        { val: 2, name: 'Febrero' },
                        { val: 3, name: 'Marzo' },
                        { val: 4, name: 'Abril' },
                        { val: 5, name: 'Mayo' },
                        { val: 6, name: 'Junio' },
                        { val: 7, name: 'Julio' },
                        { val: 8, name: 'Agosto' },
                        { val: 9, name: 'Septiembre' },
                        { val: 10, name: 'Octubre' },
                        { val: 11, name: 'Noviembre' },
                        { val: 12, name: 'Diciembre' }
                      ].map(m => (
                        <option key={m.val} value={m.val}>{m.name}</option>
                      ))}
                    </select>
                    <select
                      value={birthYear}
                      onChange={(e) => setBirthYear(e.target.value)}
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-500"
                    >
                      <option value="">Año</option>
                      {Array.from({ length: 2026 - 1940 + 1 }, (_, i) => 2026 - i).map(y => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Estado Civil</label>
                  <select name="marital_status" value={personalData.marital_status} onChange={handlePersonalChange} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none">
                    <option value="soltero(a)">Soltero(a)</option>
                    <option value="casado(a)">Casado(a)</option>
                    <option value="divorciado(a)">Divorciado(a)</option>
                    <option value="viudo(a)">Viudo(a)</option>
                  </select>
                </div>

                <div className="col-span-1 md:col-span-3 border-t border-gray-100 pt-6">
                  <h4 className="font-semibold text-gray-800 text-sm mb-4">Contacto de Emergencia</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Nombre Contacto</label>
                      <input type="text" name="emergency_contact_name" value={personalData.emergency_contact_name} onChange={handlePersonalChange} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Teléfono Contacto</label>
                      <input type="text" name="emergency_contact_phone" value={personalData.emergency_contact_phone} onChange={handlePersonalChange} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none" />
                    </div>
                  </div>
                </div>

                <div className="col-span-1 md:col-span-3 border-t border-gray-100 pt-6">
                  <h4 className="font-semibold text-gray-800 text-sm mb-4">Tallas EPP Básicas</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Talla Calzado</label>
                      <input type="text" placeholder="ej. 42" name="shoe_size" value={personalData.shoe_size} onChange={handlePersonalChange} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Talla Vestuario (Ropa)</label>
                      <input type="text" placeholder="ej. L" name="clothing_size" value={personalData.clothing_size} onChange={handlePersonalChange} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Talla Guantes</label>
                      <input type="text" placeholder="ej. M" name="glove_size" value={personalData.glove_size} onChange={handlePersonalChange} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none" />
                    </div>
                  </div>
                </div>

                <div className="col-span-1 md:col-span-3 border-t border-gray-100 pt-6">
                  <h4 className="font-semibold text-gray-800 text-sm mb-4">Información Bancaria (Para Remuneraciones)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Nombre Banco</label>
                      <input type="text" name="bank_name" value={personalData.bank_name} onChange={handlePersonalChange} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Tipo de Cuenta</label>
                      <input type="text" placeholder="ej. Vista, Corriente" name="account_type" value={personalData.account_type} onChange={handlePersonalChange} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Número de Cuenta</label>
                      <input type="text" name="account_number" value={personalData.account_number} onChange={handlePersonalChange} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none" />
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 40, paddingTop: 24, borderTop: '1px solid #F1F5F9' }}>
                <MwButton type="submit">
                  Continuar a Laborales
                </MwButton>
              </div>
            </form>
          )}

          {/* Step 2: Labor Data */}
          {activeTab === 'laborales' && (
            <form onSubmit={saveWorkerAndContinue}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1E4D8C', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Briefcase className="w-5 h-5 text-indigo-600" /> 2. Antecedentes Laborales y Asignación de Faena
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Cargo / Ocupación *</label>
                  <input required type="text" placeholder="ej. Maestro Mayor" name="position" value={laborData.position} onChange={handleLaborChange} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Sueldo Base Mensual ($) *</label>
                  <input required type="number" name="base_salary" value={laborData.base_salary} onChange={handleLaborChange} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold outline-none" />
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Institución de Salud</label>
                  <select name="health_institution" value={laborData.health_institution} onChange={handleLaborChange} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none">
                    <option value="Fonasa">Fonasa</option>
                    <option value="Colmena">Isapre Colmena</option>
                    <option value="Cruz Blanca">Isapre Cruz Blanca</option>
                    <option value="Consalud">Isapre Consalud</option>
                    <option value="Banmédica">Isapre Banmédica</option>
                    <option value="Vida Tres">Isapre Vida Tres</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">AFP (Fondo de Pensiones)</label>
                  <select name="pension_fund" value={laborData.pension_fund} onChange={handleLaborChange} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none">
                    <option value="Modelo">Modelo</option>
                    <option value="Habitat">Habitat</option>
                    <option value="Capital">Capital</option>
                    <option value="Cuprum">Cuprum</option>
                    <option value="Provida">Provida</option>
                    <option value="PlanVital">PlanVital</option>
                    <option value="Uno">Uno</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Faena Asignada *</label>
                  <select required name="site_id" value={laborData.site_id} onChange={handleLaborChange} className="w-full p-3 bg-blue-50/50 border border-blue-200 text-blue-900 rounded-xl text-sm font-bold outline-none">
                    <option value="">-- Seleccionar Faena --</option>
                    {sites.map(s => (
                      <option key={s.id} value={s.id}>{s.name} {s.location ? `(${s.location})` : ''}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Turno Laboral</label>
                  <input type="text" name="shift" placeholder="ej. 5x2, 14x14" value={laborData.shift} onChange={handleLaborChange} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Fecha de Ingreso</label>
                  <input type="date" name="entry_date" value={laborData.entry_date} onChange={handleLaborChange} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none" />
                </div>

                <div className="col-span-1 md:col-span-2 bg-[#EFF6FF] p-5 rounded-2xl border border-[#BFDBFE] mt-4">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input type="checkbox" name="deliver_epp" checked={laborData.deliver_epp} onChange={handleLaborChange} className="h-5 w-5 rounded border-blue-300 text-blue-600 focus:ring-blue-500" />
                    <span className="text-sm font-semibold text-blue-900">¿Entregar Kit de Seguridad EPP Básico al Ingreso?</span>
                  </label>
                  <p className="text-xs text-blue-700 mt-2 pl-8">
                    Si se selecciona, el sistema registrará automáticamente la entrega inicial de Casco de Seguridad, Zapatos de Seguridad (Talla {personalData.shoe_size || 'N/D'}) y Chaleco Reflectante (Talla {personalData.clothing_size || 'N/D'}) en la ficha de cargo de EPP del trabajador.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 40, paddingTop: 24, borderTop: '1px solid #F1F5F9' }}>
                <MwButton onClick={() => setActiveTab('personales')} style={{ backgroundColor: '#fff', color: '#475569', border: '1px solid #E2E8F0' }}>
                  Atrás
                </MwButton>
                <MwButton type="submit" disabled={loading} style={{ backgroundColor: '#1E4D8C' }}>
                  {loading ? 'Creando Perfil...' : 'Crear Ficha y Continuar'}
                </MwButton>
              </div>
            </form>
          )}

          {/* Step 3: Document uploads */}
          {activeTab === 'documentos' && (
            <div className="space-y-6">
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1E4D8C', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <UploadCloud className="w-5 h-5 text-indigo-600" /> 3. Checklist y Carga de Documentos Legales
              </h3>
              <p className="text-xs text-gray-500 mb-6">
                Sube la documentación del trabajador. Si falta algún documento, se mostrará una advertencia, pero se permitirá continuar con la contratación.
              </p>

              {missingDocs.length > 0 && (
                <div className="bg-amber-50 p-4 rounded-xl flex gap-3 mb-6 border border-amber-200">
                  <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                  <div>
                    <h4 className="font-bold text-amber-900 text-xs">Advertencia de Documentación</h4>
                    <p className="text-xs text-amber-700 mt-1">
                      Falta adjuntar: {missingDocs.map(d => d.toUpperCase()).join(', ')}. Recuerde subirlos para cumplir con el estándar legal de faena.
                    </p>
                  </div>
                </div>
              )}

              {/* Document rows */}
              <div className="space-y-4">
                {[
                  { key: 'ci', name: 'Cédula de Identidad (CI / RUT)', desc: 'Copia legible de ambos lados', typeName: 'Otro' },
                  { key: 'examen', name: 'Examen de Altura / Ocupacional', desc: 'Certificado aptitud de salud vigente', typeName: 'Certificado Médico' },
                  { key: 'afp', name: 'Certificado de Afiliación AFP', desc: 'Emitido por la AFP correspondiente', typeName: 'Certificación' },
                  { key: 'salud', name: 'Certificado de Afiliación Salud (Fonasa/Isapre)', desc: 'Comprobante de salud vigente', typeName: 'Otro' }
                ].map(doc => (
                  <div key={doc.key} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-2xl gap-4">
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm">{doc.name}</h4>
                      <p className="text-xs text-gray-500 mt-0.5">{doc.desc}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      {docUploadStatus[doc.key] === 'success' ? (
                        <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">✓ Listo</span>
                      ) : docUploadStatus[doc.key] === 'uploading' ? (
                        <span className="text-xs text-blue-600 animate-pulse font-semibold">Subiendo...</span>
                      ) : (
                        <span className="text-xs font-medium text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">Pendiente</span>
                      )}
                      
                      <label className="inline-flex items-center justify-center rounded-xl bg-white border border-gray-200 px-4 py-2 text-xs font-bold text-gray-700 shadow-sm hover:bg-gray-50 cursor-pointer">
                        <UploadCloud className="w-4 h-4 mr-1.5 text-gray-400" />
                        Seleccionar Archivo
                        <input 
                          type="file" 
                          className="hidden" 
                          onChange={(e) => handleFileChange(doc.key, e, doc.typeName, doc.name)} 
                        />
                      </label>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 40, paddingTop: 24, borderTop: '1px solid #F1F5F9' }}>
                <div />
                <MwButton onClick={() => setActiveTab('contrato')} style={{ backgroundColor: '#1E4D8C' }}>
                  Continuar a Contrato
                </MwButton>
              </div>
            </div>
          )}

          {/* Step 4: Contract Settings */}
          {activeTab === 'contrato' && (
            <div className="space-y-6">
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1E4D8C', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <FileText className="w-5 h-5 text-indigo-600" /> 4. Redacción del Contrato de Trabajo
              </h3>
              <p className="text-xs text-gray-500 mb-6">
                Revise y ajuste los datos del contrato para el trabajador <strong>{personalData.first_name} {personalData.last_name}</strong>. Podrá modificar variables para previsualizar el PDF antes de su descarga definitiva.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-6 rounded-2xl border border-gray-200">
                <div className="col-span-1 md:col-span-2">
                  <h4 className="font-bold text-gray-800 text-xs uppercase border-b pb-1.5 mb-3">Variables Específicas del Trabajador</h4>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700">Domicilio Particular</label>
                  <input type="text" name="worker_address" value={workerSpecificContract.worker_address} onChange={handleWorkerSpecificContractChange} className="mt-1 block w-full rounded-md border border-gray-200 p-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700">Comuna</label>
                  <input type="text" name="worker_commune" value={workerSpecificContract.worker_commune} onChange={handleWorkerSpecificContractChange} className="mt-1 block w-full rounded-md border border-gray-200 p-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700">Región</label>
                  <input type="text" name="worker_region" value={workerSpecificContract.worker_region} onChange={handleWorkerSpecificContractChange} className="mt-1 block w-full rounded-md border border-gray-200 p-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700">Nacionalidad</label>
                  <input type="text" name="worker_nationality" value={workerSpecificContract.worker_nationality} onChange={handleWorkerSpecificContractChange} className="mt-1 block w-full rounded-md border border-gray-200 p-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700">Estado Civil</label>
                  <input type="text" name="worker_civil_status" value={workerSpecificContract.worker_civil_status} onChange={handleWorkerSpecificContractChange} className="mt-1 block w-full rounded-md border border-gray-200 p-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700">Fecha de Nacimiento escrita</label>
                  <input type="text" placeholder="ej. 23 de noviembre de 1989" name="worker_birth_date" value={workerSpecificContract.worker_birth_date} onChange={handleWorkerSpecificContractChange} className="mt-1 block w-full rounded-md border border-gray-200 p-2 text-sm" />
                </div>

                <div className="col-span-1 md:col-span-2 pt-4">
                  <h4 className="font-bold text-gray-800 text-xs uppercase border-b pb-1.5 mb-3">Condiciones Generales del Contrato</h4>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700">Razón Social Empleador</label>
                  <input type="text" name="employer_company" value={contractSettings.employer_company} onChange={handleContractSettingsChange} className="mt-1 block w-full rounded-md border border-gray-200 p-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700">RUT Empleador</label>
                  <input type="text" name="employer_rut" value={contractSettings.employer_rut} onChange={handleContractSettingsChange} className="mt-1 block w-full rounded-md border border-gray-200 p-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700">Representante Legal</label>
                  <input type="text" name="employer_rep" value={contractSettings.employer_rep} onChange={handleContractSettingsChange} className="mt-1 block w-full rounded-md border border-gray-200 p-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700">Fecha Redacción Contrato</label>
                  <input type="text" name="contract_date" value={contractSettings.contract_date} onChange={handleContractSettingsChange} className="mt-1 block w-full rounded-md border border-gray-200 p-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700">Fecha Inicio Labores</label>
                  <input type="text" name="contract_start_date" value={contractSettings.contract_start_date} onChange={handleContractSettingsChange} className="mt-1 block w-full rounded-md border border-gray-200 p-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700">Duración del Contrato</label>
                  <input type="text" name="contract_duration" value={contractSettings.contract_duration} onChange={handleContractSettingsChange} className="mt-1 block w-full rounded-md border border-gray-200 p-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700">Faena de Desempeño</label>
                  <input type="text" name="job_site" value={contractSettings.job_site} onChange={handleContractSettingsChange} className="mt-1 block w-full rounded-md border border-gray-200 p-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700">Ciudad Obra / Faena</label>
                  <input type="text" name="job_city" value={contractSettings.job_city} onChange={handleContractSettingsChange} className="mt-1 block w-full rounded-md border border-gray-200 p-2 text-sm" />
                </div>
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-xs font-medium text-gray-700">Labor Específica</label>
                  <input type="text" name="job_specific_task" value={contractSettings.job_specific_task} onChange={handleContractSettingsChange} className="mt-1 block w-full rounded-md border border-gray-200 p-2 text-sm" />
                </div>
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-xs font-medium text-gray-700">Jornada y Horario de Trabajo</label>
                  <textarea rows={3} name="work_schedule" value={contractSettings.work_schedule} onChange={handleContractSettingsChange} className="mt-1 block w-full rounded-md border border-gray-200 p-2 text-sm" />
                </div>
              </div>

              {/* Action Buttons & Preview */}
              <div className="flex gap-4 pt-4">
                <MwButton 
                  onClick={showPreview ? () => setShowPreview(false) : handlePreviewPDF}
                  style={{ backgroundColor: '#fff', color: '#1E4D8C', border: '1px solid #BFDBFE' }}
                >
                  <Eye className="w-4 h-4 mr-1.5" />
                  {showPreview ? 'Ocultar Vista Previa' : 'Previsualizar Contrato'}
                </MwButton>
                
                <MwButton 
                  onClick={handleGenerateContract}
                  disabled={loading}
                  style={{ backgroundColor: '#059669' }}
                >
                  <Download className="w-4 h-4 mr-1.5" />
                  {loading ? 'Generando...' : 'Generar y Descargar PDF'}
                </MwButton>
              </div>

              {showPreview && (
                <div className="bg-[#EFF6FF] p-6 rounded-2xl border border-[#BFDBFE] mt-6 relative animate-in fade-in slide-in-from-top-4">
                  <h4 className="font-semibold text-blue-900 mb-4 flex items-center gap-2">
                    <Info className="w-5 h-5 text-blue-700" /> Vista Previa Digital
                  </h4>
                  {isPreviewLoading ? (
                    <div className="flex justify-center items-center h-[500px] bg-white rounded-xl border border-blue-200">
                      <div className="animate-pulse text-blue-500 flex flex-col items-center">
                        <FileText className="w-12 h-12 mb-3" />
                        <p className="text-sm font-semibold">Renderizando PDF en tiempo real...</p>
                      </div>
                    </div>
                  ) : pdfPreviewUrl ? (
                    <iframe 
                      src={pdfPreviewUrl} 
                      className="w-full h-[600px] rounded-xl border border-blue-200 bg-white"
                      title="Vista Previa Contrato"
                    />
                  ) : null}
                </div>
              )}
            </div>
          )}

          {/* Step 5: Success */}
          {activeTab === 'exito' && (
            <div className="text-center py-10">
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-emerald-600" />
              </div>
              <h3 style={{ fontSize: 24, fontWeight: 800, color: '#1E4D8C' }}>¡Contratación Exitosa!</h3>
              <p style={{ color: '#64748B', marginTop: 8, marginBottom: 32 }}>
                El perfil de <strong>{personalData.first_name} {personalData.last_name}</strong> se ha registrado correctamente. 
                Los documentos legales y el contrato de trabajo han sido enlazados exitosamente en la base de datos.
              </p>
              
              <div className="flex justify-center gap-4">
                <MwButton onClick={() => navigate('/workers')} style={{ backgroundColor: '#111827' }}>
                  Volver a Trabajadores
                </MwButton>
                <MwButton onClick={() => {
                  setCreatedWorker(null)
                  setPersonalData({
                    first_name: '', last_name: '', rut: '', email: '', birth_date: '',
                    marital_status: 'soltero(a)', emergency_contact_name: '', emergency_contact_phone: '',
                    bank_name: '', account_type: '', account_number: '', clothing_size: '', shoe_size: '', glove_size: ''
                  })
                  setLaborData({
                    position: '', base_salary: 539000, health_institution: 'Fonasa', pension_fund: 'Modelo',
                    shift: '5x2', entry_date: new Date().toISOString().split('T')[0], site_id: '', deliver_epp: false
                  })
                  setDocuments({ ci: null, examen: null, afp: null, salud: null })
                  setDocUploadStatus({ ci: 'pending', examen: 'pending', afp: 'pending', salud: 'pending' })
                  setBirthDay('')
                  setBirthMonth('')
                  setBirthYear('')
                  setActiveTab('personales')
                }}>
                  Contratar Otro Trabajador
                </MwButton>
              </div>
            </div>
          )}

        </MwCard>
      </div>
    </MwPage>
  )
}
