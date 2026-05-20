import React, { useState, useEffect } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { apiFetch } from '../supabaseClient'
import { MwPage, MwCard, MwButton } from '../components/MecwellUI'
import { 
  FileSpreadsheet, ArrowLeft, Save, Plus, Trash2, HelpCircle, 
  Calculator, User, Briefcase, Calendar, Info
} from 'lucide-react'

export default function QuoteEditor() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const cloneId = searchParams.get('clone')
  
  const isEditMode = !!id && !cloneId
  const loadId = id || cloneId

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  // Standard Form State
  const [quoteNumber, setQuoteNumber] = useState('')
  const [serviceName, setServiceName] = useState('')
  const [status, setStatus] = useState('Borrador')
  const [issueDate, setIssueDate] = useState(new Date().toISOString().substring(0, 10))
  const [expirationDate, setExpirationDate] = useState('')

  // Client Info State
  const [clientName, setClientName] = useState('')
  const [clientRut, setClientRut] = useState('')
  const [clientCity, setClientCity] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [clientContact, setClientContact] = useState('')
  const [clientArea, setClientArea] = useState('')
  const [clientEmail, setClientEmail] = useState('')

  // Spreadsheet tables State
  const [laborItems, setLaborItems] = useState([])
  const [materialItems, setMaterialItems] = useState([])
  const [equipmentItems, setEquipmentItems] = useState([])
  const [otherExpenseItems, setOtherExpenseItems] = useState([])

  // Markup/Percentages (Stored as float, editable as percentage in UI)
  const [overheadPercent, setOverheadPercent] = useState(15) // default 15%
  const [utilityPercent, setUtilityPercent] = useState(15)  // default 15%

  // Load quote details if editing or cloning
  useEffect(() => {
    if (loadId) {
      fetchQuote(loadId)
    } else {
      // Set a default quote number format e.g. COT-YYYY-XXXX
      const randomNum = Math.floor(1000 + Math.random() * 9000)
      const year = new Date().getFullYear()
      setQuoteNumber(`COT-${year}-${randomNum}`)
      
      // Seed with one empty row each to guide the user visually
      handleAddLaborRow()
      handleAddMaterialRow()
    }
  }, [loadId])

  const fetchQuote = async (quoteId) => {
    setLoading(true)
    try {
      const res = await apiFetch(`http://127.0.0.1:8000/api/v1/quotes/${quoteId}`)
      if (res.ok) {
        const data = await res.json()
        
        if (cloneId) {
          // If cloning, modify the quote number to prevent collision
          const year = new Date().getFullYear()
          const randomNum = Math.floor(1000 + Math.random() * 9000)
          setQuoteNumber(`COT-${year}-${randomNum}-CLON`)
          setStatus('Borrador')
        } else {
          setQuoteNumber(data.quote_number || '')
          setStatus(data.status || 'Borrador')
        }

        setServiceName(data.service_name || '')
        setIssueDate(data.issue_date || new Date().toISOString().substring(0, 10))
        setExpirationDate(data.expiration_date || '')

        setClientName(data.client_name || '')
        setClientRut(data.client_rut || '')
        setClientCity(data.client_city || '')
        setClientPhone(data.client_phone || '')
        setClientContact(data.client_contact || '')
        setClientArea(data.client_area || '')
        setClientEmail(data.client_email || '')

        setLaborItems(data.labor_items || [])
        setMaterialItems(data.material_items || [])
        setEquipmentItems(data.equipment_items || [])
        setOtherExpenseItems(data.other_expense_items || [])

        setOverheadPercent(Math.round((data.overhead_percent ?? 0.15) * 100))
        setUtilityPercent(Math.round((data.utility_percent ?? 0.15) * 100))
      } else {
        alert('Error al cargar los datos de la cotización.')
      }
    } catch (e) {
      console.error(e)
      alert('Error en el servidor al obtener cotización')
    } finally {
      setLoading(false)
    }
  }

  // --- Labor handlers ---
  const handleAddLaborRow = () => {
    setLaborItems([
      ...laborItems,
      { role: '', unit: 'HH', qty: 0, days: 0, hh_per_day: 0, unit_price: 0, total: 0 }
    ])
  }

  const handleRemoveLaborRow = (index) => {
    setLaborItems(laborItems.filter((_, i) => i !== index))
  }

  const handleLaborFieldChange = (index, field, value) => {
    const updated = [...laborItems]
    const row = { ...updated[index] }
    
    if (field === 'role' || field === 'unit') {
      row[field] = value
    } else {
      row[field] = parseFloat(value) || 0
    }
    
    // Auto recalculation of row total: qty * days * hh_per_day * unit_price
    if (field !== 'role' && field !== 'unit') {
      const q = field === 'qty' ? parseFloat(value) || 0 : row.qty
      const d = field === 'days' ? parseFloat(value) || 0 : row.days
      const hh = field === 'hh_per_day' ? parseFloat(value) || 0 : row.hh_per_day
      const price = field === 'unit_price' ? parseFloat(value) || 0 : row.unit_price
      row.total = Math.round(q * d * hh * price * 100) / 100
    }

    updated[index] = row
    setLaborItems(updated)
  }

  // --- Material handlers ---
  const handleAddMaterialRow = () => {
    setMaterialItems([
      ...materialItems,
      { name: '', unit: 'UN', qty: 0, unit_price: 0, total: 0 }
    ])
  }

  const handleRemoveMaterialRow = (index) => {
    setMaterialItems(materialItems.filter((_, i) => i !== index))
  }

  const handleMaterialFieldChange = (index, field, value) => {
    const updated = [...materialItems]
    const row = { ...updated[index] }

    if (field === 'name' || field === 'unit') {
      row[field] = value
    } else {
      row[field] = parseFloat(value) || 0
    }

    // Auto recalculation: qty * unit_price
    if (field !== 'name' && field !== 'unit') {
      const q = field === 'qty' ? parseFloat(value) || 0 : row.qty
      const price = field === 'unit_price' ? parseFloat(value) || 0 : row.unit_price
      row.total = Math.round(q * price * 100) / 100
    }

    updated[index] = row
    setMaterialItems(updated)
  }

  // --- Equipment handlers ---
  const handleAddEquipmentRow = () => {
    setEquipmentItems([
      ...equipmentItems,
      { name: '', unit: 'Día', qty: 0, unit_price: 0, total: 0 }
    ])
  }

  const handleRemoveEquipmentRow = (index) => {
    setEquipmentItems(equipmentItems.filter((_, i) => i !== index))
  }

  const handleEquipmentFieldChange = (index, field, value) => {
    const updated = [...equipmentItems]
    const row = { ...updated[index] }

    if (field === 'name' || field === 'unit') {
      row[field] = value
    } else {
      row[field] = parseFloat(value) || 0
    }

    // Auto recalculation: qty * unit_price
    if (field !== 'name' && field !== 'unit') {
      const q = field === 'qty' ? parseFloat(value) || 0 : row.qty
      const price = field === 'unit_price' ? parseFloat(value) || 0 : row.unit_price
      row.total = Math.round(q * price * 100) / 100
    }

    updated[index] = row
    setEquipmentItems(updated)
  }

  // --- Other Expenses handlers ---
  const handleAddOtherRow = () => {
    setOtherExpenseItems([
      ...otherExpenseItems,
      { name: '', unit: 'GL', qty: 0, unit_price: 0, total: 0 }
    ])
  }

  const handleRemoveOtherRow = (index) => {
    setOtherExpenseItems(otherExpenseItems.filter((_, i) => i !== index))
  }

  const handleOtherFieldChange = (index, field, value) => {
    const updated = [...otherExpenseItems]
    const row = { ...updated[index] }

    if (field === 'name' || field === 'unit') {
      row[field] = value
    } else {
      row[field] = parseFloat(value) || 0
    }

    // Auto recalculation: qty * unit_price
    if (field !== 'name' && field !== 'unit') {
      const q = field === 'qty' ? parseFloat(value) || 0 : row.qty
      const price = field === 'unit_price' ? parseFloat(value) || 0 : row.unit_price
      row.total = Math.round(q * price * 100) / 100
    }

    updated[index] = row
    setOtherExpenseItems(updated)
  }

  // --- Calculate Math Subtotals and Cost Summary ---
  const subtotalLabor = laborItems.reduce((acc, x) => acc + (parseFloat(x.total) || 0), 0)
  const subtotalMaterials = materialItems.reduce((acc, x) => acc + (parseFloat(x.total) || 0), 0)
  const subtotalEquipment = equipmentItems.reduce((acc, x) => acc + (parseFloat(x.total) || 0), 0)
  const subtotalOthers = otherExpenseItems.reduce((acc, x) => acc + (parseFloat(x.total) || 0), 0)

  const costoDirecto = subtotalLabor + subtotalMaterials + subtotalEquipment + subtotalOthers
  const overheadAmount = Math.round(costoDirecto * (overheadPercent / 100))
  const utilityAmount = Math.round(costoDirecto * (utilityPercent / 100))
  const netTotal = costoDirecto + overheadAmount + utilityAmount

  // --- Save / Submit ---
  const handleSave = async (e) => {
    e.preventDefault()

    if (!quoteNumber.trim()) {
      alert('Debes ingresar un número de cotización.')
      return
    }
    if (!clientName.trim()) {
      alert('Debes ingresar el nombre del cliente.')
      return
    }
    if (!serviceName.trim()) {
      alert('Debes ingresar el nombre del servicio cotizado.')
      return
    }

    setSaving(true)

    // filter out entirely empty rows to keep the DB clean
    const cleanLabor = laborItems.filter(x => x.role.trim() !== '')
    const cleanMaterials = materialItems.filter(x => x.name.trim() !== '')
    const cleanEquipment = equipmentItems.filter(x => x.name.trim() !== '')
    const cleanOthers = otherExpenseItems.filter(x => x.name.trim() !== '')

    const payload = {
      quote_number: quoteNumber.trim(),
      client_name: clientName.trim(),
      client_rut: clientRut.trim() || null,
      client_city: clientCity.trim() || null,
      client_phone: clientPhone.trim() || null,
      client_contact: clientContact.trim() || null,
      client_area: clientArea.trim() || null,
      client_email: clientEmail.trim() || null,
      service_name: serviceName.trim(),
      status: status,
      issue_date: issueDate,
      expiration_date: expirationDate || null,
      labor_items: cleanLabor,
      material_items: cleanMaterials,
      equipment_items: cleanEquipment,
      other_expense_items: cleanOthers,
      overhead_percent: overheadPercent / 100,
      utility_percent: utilityPercent / 100
    }

    try {
      const url = isEditMode 
        ? `http://127.0.0.1:8000/api/v1/quotes/${id}`
        : 'http://127.0.0.1:8000/api/v1/quotes/'
      
      const method = isEditMode ? 'PUT' : 'POST'

      const res = await apiFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        navigate('/quotes')
      } else {
        const errorData = await res.json()
        alert(`Error al guardar: ${errorData.detail || 'Verifique los campos.'}`)
      }
    } catch (e) {
      console.error(e)
      alert('Error de conexión con el servidor al intentar guardar.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <MwPage title="Planilla de Cotización" icon={FileSpreadsheet}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '100px 0' }}>
          <p className="text-gray-500 font-medium">Cargando datos de la cotización...</p>
        </div>
      </MwPage>
    )
  }

  return (
    <MwPage title={isEditMode ? `Editar Cotización ${quoteNumber}` : "Nueva Cotización de Servicio"} icon={FileSpreadsheet}>
      
      {/* Top action bar */}
      <div className="flex justify-between items-center mb-6">
        <MwButton 
          onClick={() => navigate('/quotes')}
          style={{ backgroundColor: '#ffffff', color: '#475569', border: '1px solid #CBD5E1' }}
        >
          <ArrowLeft size={16} /> Volver
        </MwButton>
        <MwButton 
          onClick={handleSave} 
          disabled={saving} 
          style={{ backgroundColor: '#1E4D8C', color: '#ffffff' }}
        >
          <Save size={16} /> {saving ? 'Guardando...' : 'Guardar Cotización'}
        </MwButton>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Quote Metadata & Client Card */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Metadata Block */}
          <MwCard className="lg:col-span-1" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1E4D8C', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Info size={16} /> Información del Folio
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Nº Cotización <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500 font-bold"
                  value={quoteNumber}
                  onChange={e => setQuoteNumber(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Nombre del Servicio <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="ej. Reparación de Motor Caterpillar 3512"
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500"
                  value={serviceName}
                  onChange={e => setServiceName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Fecha Emisión</label>
                  <input
                    type="date"
                    required
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-xs"
                    value={issueDate}
                    onChange={e => setIssueDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Vencimiento</label>
                  <input
                    type="date"
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-xs"
                    value={expirationDate}
                    onChange={e => setExpirationDate(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Estado</label>
                <select
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500"
                  value={status}
                  onChange={e => setStatus(e.target.value)}
                >
                  <option value="Borrador">Borrador</option>
                  <option value="Enviada">Enviada</option>
                  <option value="Aprobada">Aprobada</option>
                  <option value="Rechazada">Rechazada</option>
                  <option value="Vencida">Vencida</option>
                  <option value="Por Pagar">Por Pagar</option>
                  <option value="Pagada">Pagada</option>
                </select>
              </div>
            </div>
          </MwCard>

          {/* Client Details Block */}
          <MwCard className="lg:col-span-2" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1E4D8C', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
              <User size={16} /> Identificación del Cliente
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Cliente / Razón Social <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="ej. Minera Escondida Ltda."
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500"
                  value={clientName}
                  onChange={e => setClientName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">RUT Cliente</label>
                <input
                  type="text"
                  placeholder="ej. 76.123.456-K"
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500"
                  value={clientRut}
                  onChange={e => setClientRut(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Ciudad / Comuna</label>
                <input
                  type="text"
                  placeholder="ej. Antofagasta"
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500"
                  value={clientCity}
                  onChange={e => setClientCity(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Contacto Principal</label>
                <input
                  type="text"
                  placeholder="ej. Juan Pérez"
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500"
                  value={clientContact}
                  onChange={e => setClientContact(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Área / Departamento</label>
                <input
                  type="text"
                  placeholder="ej. Abastecimiento y Contratos"
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500"
                  value={clientArea}
                  onChange={e => setClientArea(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Correo Electrónico</label>
                <input
                  type="email"
                  placeholder="ej. contacto@cliente.cl"
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500"
                  value={clientEmail}
                  onChange={e => setClientEmail(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Teléfono</label>
                <input
                  type="text"
                  placeholder="ej. +56 9 8765 4321"
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500"
                  value={clientPhone}
                  onChange={e => setClientPhone(e.target.value)}
                />
              </div>
            </div>
          </MwCard>
        </div>

        {/* --- Dynamic Spreadsheets Grid (Excel Mode) --- */}
        <h2 style={{ fontSize: 18, fontWeight: 800, color: '#1E4D8C', marginTop: 32, marginBottom: 8 }}>
          Planilla de Costos e Ítems
        </h2>
        <p className="text-sm text-gray-500 -mt-2 mb-6">
          Modifique los valores directos en la grilla. Se calcularán subtotales y costos finales en tiempo real.
        </p>

        {/* 1. MANO DE OBRA */}
        <MwCard style={{ overflow: 'hidden', padding: 0 }}>
          <div style={{ backgroundColor: '#1E4D8C', padding: '12px 20px', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              1. Mano de Obra (Personal Técnico/Ingeniería)
            </span>
            <span style={{ fontSize: 12, backgroundColor: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>
              Subtotal: ${Math.round(subtotalLabor).toLocaleString('es-CL')}
            </span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #CBD5E1' }}>
                  <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: '#475569', width: '35%' }}>Cargo / Rol</th>
                  <th style={{ padding: '10px 16px', textAlign: 'center', fontWeight: 600, color: '#475569', width: '10%' }}>Unidad</th>
                  <th style={{ padding: '10px 16px', textAlign: 'center', fontWeight: 600, color: '#475569', width: '10%' }}>Nº Pers. (Cant)</th>
                  <th style={{ padding: '10px 16px', textAlign: 'center', fontWeight: 600, color: '#475569', width: '10%' }}>Días</th>
                  <th style={{ padding: '10px 16px', textAlign: 'center', fontWeight: 600, color: '#475569', width: '10%' }}>HH/Día</th>
                  <th style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 600, color: '#475569', width: '12%' }}>P. Unitario</th>
                  <th style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 600, color: '#475569', width: '12%' }}>Total</th>
                  <th style={{ padding: '10px 16px', textAlign: 'center', width: '6%' }}></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {laborItems.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td style={{ padding: '6px 12px' }}>
                      <input
                        type="text"
                        placeholder="ej. Supervisor Mecánico"
                        className="w-full p-1 bg-transparent border-0 border-b border-dashed border-gray-200 hover:border-gray-400 focus:border-blue-500 focus:border-solid focus:ring-0 outline-none font-medium"
                        value={item.role}
                        onChange={e => handleLaborFieldChange(idx, 'role', e.target.value)}
                      />
                    </td>
                    <td style={{ padding: '6px 12px' }}>
                      <input
                        type="text"
                        className="w-full p-1 bg-transparent border-0 border-b border-dashed border-gray-200 text-center outline-none"
                        value={item.unit}
                        onChange={e => handleLaborFieldChange(idx, 'unit', e.target.value)}
                      />
                    </td>
                    <td style={{ padding: '6px 12px' }}>
                      <input
                        type="number"
                        min="0"
                        className="w-full p-1 bg-transparent border-0 border-b border-dashed border-gray-200 text-center outline-none"
                        value={item.qty || ''}
                        onChange={e => handleLaborFieldChange(idx, 'qty', e.target.value)}
                      />
                    </td>
                    <td style={{ padding: '6px 12px' }}>
                      <input
                        type="number"
                        min="0"
                        className="w-full p-1 bg-transparent border-0 border-b border-dashed border-gray-200 text-center outline-none"
                        value={item.days || ''}
                        onChange={e => handleLaborFieldChange(idx, 'days', e.target.value)}
                      />
                    </td>
                    <td style={{ padding: '6px 12px' }}>
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        className="w-full p-1 bg-transparent border-0 border-b border-dashed border-gray-200 text-center outline-none"
                        value={item.hh_per_day || ''}
                        onChange={e => handleLaborFieldChange(idx, 'hh_per_day', e.target.value)}
                      />
                    </td>
                    <td style={{ padding: '6px 12px' }}>
                      <input
                        type="number"
                        min="0"
                        className="w-full p-1 bg-transparent border-0 border-b border-dashed border-gray-200 text-right outline-none font-semibold text-emerald-800"
                        value={item.unit_price || ''}
                        onChange={e => handleLaborFieldChange(idx, 'unit_price', e.target.value)}
                      />
                    </td>
                    <td style={{ padding: '6px 12px', textAlign: 'right', fontWeight: 700 }} className="text-gray-800">
                      ${Math.round(item.total || 0).toLocaleString('es-CL')}
                    </td>
                    <td style={{ padding: '6px 12px', textAlign: 'center' }}>
                      <button
                        type="button"
                        onClick={() => handleRemoveLaborRow(idx)}
                        className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
                {laborItems.length === 0 && (
                  <tr>
                    <td colSpan={8} style={{ padding: '20px', textAlign: 'center' }} className="text-gray-400 italic">
                      No hay personal cotizado. Haz clic en "Añadir Fila" para comenzar.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div style={{ padding: '12px 20px', borderTop: '1px solid #E2E8F0', backgroundColor: '#F8FAFC' }}>
            <button
              type="button"
              onClick={handleAddLaborRow}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1E4D8C] hover:text-[#163d6f] transition-all"
            >
              <Plus size={14} /> Añadir Fila de Mano de Obra
            </button>
          </div>
        </MwCard>


        {/* 2. MATERIALES */}
        <MwCard style={{ overflow: 'hidden', padding: 0 }}>
          <div style={{ backgroundColor: '#1E4D8C', padding: '12px 20px', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              2. Materiales e Insumos Directos
            </span>
            <span style={{ fontSize: 12, backgroundColor: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>
              Subtotal: ${Math.round(subtotalMaterials).toLocaleString('es-CL')}
            </span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #CBD5E1' }}>
                  <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: '#475569', width: '55%' }}>Descripción Material</th>
                  <th style={{ padding: '10px 16px', textAlign: 'center', fontWeight: 600, color: '#475569', width: '10%' }}>Unidad</th>
                  <th style={{ padding: '10px 16px', textAlign: 'center', fontWeight: 600, color: '#475569', width: '10%' }}>Cantidad</th>
                  <th style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 600, color: '#475569', width: '12%' }}>P. Unitario</th>
                  <th style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 600, color: '#475569', width: '12%' }}>Total</th>
                  <th style={{ padding: '10px 16px', textAlign: 'center', width: '6%' }}></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {materialItems.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td style={{ padding: '6px 12px' }}>
                      <input
                        type="text"
                        placeholder="ej. Acero Estructural A36"
                        className="w-full p-1 bg-transparent border-0 border-b border-dashed border-gray-200 hover:border-gray-400 focus:border-blue-500 focus:border-solid focus:ring-0 outline-none font-medium"
                        value={item.name}
                        onChange={e => handleMaterialFieldChange(idx, 'name', e.target.value)}
                      />
                    </td>
                    <td style={{ padding: '6px 12px' }}>
                      <input
                        type="text"
                        placeholder="UN"
                        className="w-full p-1 bg-transparent border-0 border-b border-dashed border-gray-200 text-center outline-none"
                        value={item.unit}
                        onChange={e => handleMaterialFieldChange(idx, 'unit', e.target.value)}
                      />
                    </td>
                    <td style={{ padding: '6px 12px' }}>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        className="w-full p-1 bg-transparent border-0 border-b border-dashed border-gray-200 text-center outline-none"
                        value={item.qty || ''}
                        onChange={e => handleMaterialFieldChange(idx, 'qty', e.target.value)}
                      />
                    </td>
                    <td style={{ padding: '6px 12px' }}>
                      <input
                        type="number"
                        min="0"
                        className="w-full p-1 bg-transparent border-0 border-b border-dashed border-gray-200 text-right outline-none font-semibold text-emerald-800"
                        value={item.unit_price || ''}
                        onChange={e => handleMaterialFieldChange(idx, 'unit_price', e.target.value)}
                      />
                    </td>
                    <td style={{ padding: '6px 12px', textAlign: 'right', fontWeight: 700 }} className="text-gray-800">
                      ${Math.round(item.total || 0).toLocaleString('es-CL')}
                    </td>
                    <td style={{ padding: '6px 12px', textAlign: 'center' }}>
                      <button
                        type="button"
                        onClick={() => handleRemoveMaterialRow(idx)}
                        className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
                {materialItems.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ padding: '20px', textAlign: 'center' }} className="text-gray-400 italic">
                      No hay materiales cotizados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div style={{ padding: '12px 20px', borderTop: '1px solid #E2E8F0', backgroundColor: '#F8FAFC' }}>
            <button
              type="button"
              onClick={handleAddMaterialRow}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1E4D8C] hover:text-[#163d6f] transition-all"
            >
              <Plus size={14} /> Añadir Fila de Materiales
            </button>
          </div>
        </MwCard>


        {/* 3. EQUIPOS */}
        <MwCard style={{ overflow: 'hidden', padding: 0 }}>
          <div style={{ backgroundColor: '#1E4D8C', padding: '12px 20px', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              3. Equipos, Herramientas y Elementos Anexos
            </span>
            <span style={{ fontSize: 12, backgroundColor: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>
              Subtotal: ${Math.round(subtotalEquipment).toLocaleString('es-CL')}
            </span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #CBD5E1' }}>
                  <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: '#475569', width: '55%' }}>Descripción Equipo</th>
                  <th style={{ padding: '10px 16px', textAlign: 'center', fontWeight: 600, color: '#475569', width: '10%' }}>Unidad</th>
                  <th style={{ padding: '10px 16px', textAlign: 'center', fontWeight: 600, color: '#475569', width: '10%' }}>Cantidad</th>
                  <th style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 600, color: '#475569', width: '12%' }}>P. Unitario</th>
                  <th style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 600, color: '#475569', width: '12%' }}>Total</th>
                  <th style={{ padding: '10px 16px', textAlign: 'center', width: '6%' }}></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {equipmentItems.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td style={{ padding: '6px 12px' }}>
                      <input
                        type="text"
                        placeholder="ej. Camioneta 4x4 equipada"
                        className="w-full p-1 bg-transparent border-0 border-b border-dashed border-gray-200 hover:border-gray-400 focus:border-blue-500 focus:border-solid focus:ring-0 outline-none font-medium"
                        value={item.name}
                        onChange={e => handleEquipmentFieldChange(idx, 'name', e.target.value)}
                      />
                    </td>
                    <td style={{ padding: '6px 12px' }}>
                      <input
                        type="text"
                        placeholder="Día"
                        className="w-full p-1 bg-transparent border-0 border-b border-dashed border-gray-200 text-center outline-none"
                        value={item.unit}
                        onChange={e => handleEquipmentFieldChange(idx, 'unit', e.target.value)}
                      />
                    </td>
                    <td style={{ padding: '6px 12px' }}>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        className="w-full p-1 bg-transparent border-0 border-b border-dashed border-gray-200 text-center outline-none"
                        value={item.qty || ''}
                        onChange={e => handleEquipmentFieldChange(idx, 'qty', e.target.value)}
                      />
                    </td>
                    <td style={{ padding: '6px 12px' }}>
                      <input
                        type="number"
                        min="0"
                        className="w-full p-1 bg-transparent border-0 border-b border-dashed border-gray-200 text-right outline-none font-semibold text-emerald-800"
                        value={item.unit_price || ''}
                        onChange={e => handleEquipmentFieldChange(idx, 'unit_price', e.target.value)}
                      />
                    </td>
                    <td style={{ padding: '6px 12px', textAlign: 'right', fontWeight: 700 }} className="text-gray-800">
                      ${Math.round(item.total || 0).toLocaleString('es-CL')}
                    </td>
                    <td style={{ padding: '6px 12px', textAlign: 'center' }}>
                      <button
                        type="button"
                        onClick={() => handleRemoveEquipmentRow(idx)}
                        className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
                {equipmentItems.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ padding: '20px', textAlign: 'center' }} className="text-gray-400 italic">
                      No hay equipos cotizados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div style={{ padding: '12px 20px', borderTop: '1px solid #E2E8F0', backgroundColor: '#F8FAFC' }}>
            <button
              type="button"
              onClick={handleAddEquipmentRow}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1E4D8C] hover:text-[#163d6f] transition-all"
            >
              <Plus size={14} /> Añadir Fila de Equipos
            </button>
          </div>
        </MwCard>


        {/* 4. OTROS GASTOS */}
        <MwCard style={{ overflow: 'hidden', padding: 0 }}>
          <div style={{ backgroundColor: '#1E4D8C', padding: '12px 20px', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              4. Otros Gastos y Viáticos Directos
            </span>
            <span style={{ fontSize: 12, backgroundColor: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>
              Subtotal: ${Math.round(subtotalOthers).toLocaleString('es-CL')}
            </span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #CBD5E1' }}>
                  <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: '#475569', width: '55%' }}>Descripción del Gasto</th>
                  <th style={{ padding: '10px 16px', textAlign: 'center', fontWeight: 600, color: '#475569', width: '10%' }}>Unidad</th>
                  <th style={{ padding: '10px 16px', textAlign: 'center', fontWeight: 600, color: '#475569', width: '10%' }}>Cantidad</th>
                  <th style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 600, color: '#475569', width: '12%' }}>P. Unitario</th>
                  <th style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 600, color: '#475569', width: '12%' }}>Total</th>
                  <th style={{ padding: '10px 16px', textAlign: 'center', width: '6%' }}></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {otherExpenseItems.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td style={{ padding: '6px 12px' }}>
                      <input
                        type="text"
                        placeholder="ej. Traslado de Personal, Alojamiento o Viáticos"
                        className="w-full p-1 bg-transparent border-0 border-b border-dashed border-gray-200 hover:border-gray-400 focus:border-blue-500 focus:border-solid focus:ring-0 outline-none font-medium"
                        value={item.name}
                        onChange={e => handleOtherFieldChange(idx, 'name', e.target.value)}
                      />
                    </td>
                    <td style={{ padding: '6px 12px' }}>
                      <input
                        type="text"
                        placeholder="GL"
                        className="w-full p-1 bg-transparent border-0 border-b border-dashed border-gray-200 text-center outline-none"
                        value={item.unit}
                        onChange={e => handleOtherFieldChange(idx, 'unit', e.target.value)}
                      />
                    </td>
                    <td style={{ padding: '6px 12px' }}>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        className="w-full p-1 bg-transparent border-0 border-b border-dashed border-gray-200 text-center outline-none"
                        value={item.qty || ''}
                        onChange={e => handleOtherFieldChange(idx, 'qty', e.target.value)}
                      />
                    </td>
                    <td style={{ padding: '6px 12px' }}>
                      <input
                        type="number"
                        min="0"
                        className="w-full p-1 bg-transparent border-0 border-b border-dashed border-gray-200 text-right outline-none font-semibold text-emerald-800"
                        value={item.unit_price || ''}
                        onChange={e => handleOtherFieldChange(idx, 'unit_price', e.target.value)}
                      />
                    </td>
                    <td style={{ padding: '6px 12px', textAlign: 'right', fontWeight: 700 }} className="text-gray-800">
                      ${Math.round(item.total || 0).toLocaleString('es-CL')}
                    </td>
                    <td style={{ padding: '6px 12px', textAlign: 'center' }}>
                      <button
                        type="button"
                        onClick={() => handleRemoveOtherRow(idx)}
                        className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
                {otherExpenseItems.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ padding: '20px', textAlign: 'center' }} className="text-gray-400 italic">
                      No hay otros gastos cotizados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div style={{ padding: '12px 20px', borderTop: '1px solid #E2E8F0', backgroundColor: '#F8FAFC' }}>
            <button
              type="button"
              onClick={handleAddOtherRow}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1E4D8C] hover:text-[#163d6f] transition-all"
            >
              <Plus size={14} /> Añadir Fila de Otros Gastos
            </button>
          </div>
        </MwCard>

        {/* --- COST SUMMARY CARD (Excel math logic) --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          
          <MwCard style={{ padding: 24 }}>
            <h4 style={{ fontSize: 14, fontWeight: 700, color: '#475569', marginBottom: 12 }}>Notas y Condiciones comerciales</h4>
            <div className="text-xs text-slate-500 space-y-2 leading-relaxed">
              <p>• Los valores expresados no incluyen IVA.</p>
              <p>• Plazo de entrega estimado se acordará según la emisión de la orden de compra.</p>
              <p>• Forma de pago: 30 días contra factura aceptada.</p>
              <p>• Validez de la cotización: 30 días desde la fecha de emisión.</p>
              <p className="mt-4 pt-4 border-t border-slate-100 font-semibold text-slate-700">Emitido por Sergio Hans Farías Anabalón en representación de Mecwell Limitada.</p>
            </div>
          </MwCard>

          <MwCard style={{ padding: 24, backgroundColor: '#FAFBFD' }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1E4D8C', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Calculator size={17} /> Resumen de Liquidación de Planilla
            </h3>

            <div className="space-y-3.5 text-sm">
              <div className="flex justify-between items-center py-1">
                <span className="font-semibold text-gray-700">1. Total Costo Directo:</span>
                <span className="font-bold text-gray-800">${Math.round(costoDirecto).toLocaleString('es-CL')}</span>
              </div>

              <div className="grid grid-cols-3 gap-2 items-center py-1 border-t border-dashed border-gray-200">
                <span className="text-gray-600 col-span-1">2. Gastos Generales:</span>
                <div className="col-span-1 flex items-center gap-1">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    className="w-12 p-1 text-center bg-white border border-gray-300 rounded font-semibold text-xs text-[#1E4D8C]"
                    value={overheadPercent}
                    onChange={e => setOverheadPercent(parseInt(e.target.value) || 0)}
                  />
                  <span className="text-xs font-bold text-gray-500">%</span>
                </div>
                <span className="text-right font-semibold text-gray-700 col-span-1">
                  + ${Math.round(overheadAmount).toLocaleString('es-CL')}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 items-center py-1 border-t border-dashed border-gray-200">
                <span className="text-gray-600 col-span-1">3. Margen Utilidad:</span>
                <div className="col-span-1 flex items-center gap-1">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    className="w-12 p-1 text-center bg-white border border-gray-300 rounded font-semibold text-xs text-[#1E4D8C]"
                    value={utilityPercent}
                    onChange={e => setUtilityPercent(parseInt(e.target.value) || 0)}
                  />
                  <span className="text-xs font-bold text-gray-500">%</span>
                </div>
                <span className="text-right font-semibold text-gray-700 col-span-1">
                  + ${Math.round(utilityAmount).toLocaleString('es-CL')}
                </span>
              </div>

              <div className="flex justify-between items-center pt-3 border-t-2 border-slate-300 bg-blue-50/50 p-3 rounded-lg">
                <span style={{ fontSize: 15, fontWeight: 800, color: '#1E4D8C' }}>Subtotal Neto a Facturar:</span>
                <span style={{ fontSize: 18, fontWeight: 900, color: '#065F46' }}>
                  ${Math.round(netTotal).toLocaleString('es-CL')}
                </span>
              </div>
            </div>
          </MwCard>

        </div>

        {/* Action bar bottom */}
        <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
          <MwButton 
            onClick={() => navigate('/quotes')}
            style={{ backgroundColor: '#ffffff', color: '#475569', border: '1px solid #CBD5E1' }}
          >
            Cancelar
          </MwButton>
          <MwButton 
            onClick={handleSave} 
            disabled={saving} 
            style={{ backgroundColor: '#1E4D8C', color: '#ffffff' }}
          >
            <Save size={16} /> {saving ? 'Guardando...' : 'Confirmar y Guardar'}
          </MwButton>
        </div>

      </form>
    </MwPage>
  )
}
