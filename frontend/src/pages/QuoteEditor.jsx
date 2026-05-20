import React, { useState, useEffect } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { apiFetch } from '../supabaseClient'
import { MwPage, MwCard, MwButton } from '../components/MecwellUI'
import { FileSpreadsheet, ArrowLeft, Save, Plus, Trash2, Calculator, User, Info } from 'lucide-react'

// Badge de estado para el header
const STATUS_CONFIG = {
  'Borrador':  { bg: '#E2E8F0', text: '#475569' },
  'Enviada':   { bg: '#DBEAFE', text: '#1E40AF' },
  'Aprobada':  { bg: '#D1FAE5', text: '#065F46' },
  'Rechazada': { bg: '#FEE2E2', text: '#991B1B' },
  'Vencida':   { bg: '#FEE2E2', text: '#991B1B' },
  'Por Pagar': { bg: '#FEF3C7', text: '#92400E' },
  'Pagada':    { bg: '#D1FAE5', text: '#065F46' },
}

// ─── Estilos de input para la grilla tipo Excel ───────────────────────────────
const cellInputStyle = {
  width: '100%',
  padding: '5px 8px',
  backgroundColor: '#F9FAFB',
  border: '1px solid #E2E8F0',
  borderRadius: 4,
  fontSize: 13,
  outline: 'none',
  transition: 'border-color 0.15s',
}

const cellInputStyleRight = { ...cellInputStyle, textAlign: 'right' }
const cellInputStyleCenter = { ...cellInputStyle, textAlign: 'center' }

export default function QuoteEditor() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const cloneId = searchParams.get('clone')

  const isEditMode = !!id && !cloneId
  const loadId = id || cloneId

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  // Datos del folio
  const [quoteNumber, setQuoteNumber] = useState('')
  const [serviceName, setServiceName] = useState('')
  const [status, setStatus] = useState('Borrador')
  const [issueDate, setIssueDate] = useState(new Date().toISOString().substring(0, 10))
  const [expirationDate, setExpirationDate] = useState('')

  // Datos del cliente
  const [clientName, setClientName] = useState('')
  const [clientRut, setClientRut] = useState('')
  const [clientCity, setClientCity] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [clientContact, setClientContact] = useState('')
  const [clientArea, setClientArea] = useState('')
  const [clientEmail, setClientEmail] = useState('')

  // Tablas de costos
  const [laborItems, setLaborItems] = useState([])
  const [materialItems, setMaterialItems] = useState([])
  const [equipmentItems, setEquipmentItems] = useState([])
  const [otherExpenseItems, setOtherExpenseItems] = useState([])

  // Porcentajes (en %, ej 15 = 15%)
  const [overheadPercent, setOverheadPercent] = useState(15)
  const [utilityPercent, setUtilityPercent] = useState(15)

  useEffect(() => {
    if (loadId) {
      fetchQuote(loadId)
    } else {
      const year = new Date().getFullYear()
      const rand = Math.floor(1000 + Math.random() * 9000)
      setQuoteNumber(`COT-${year}-${rand}`)
    }
  }, [loadId])

  const fetchQuote = async (quoteId) => {
    setLoading(true)
    try {
      const res = await apiFetch(`http://127.0.0.1:8000/api/v1/quotes/${quoteId}`)
      if (res.ok) {
        const d = await res.json()
        if (cloneId) {
          const year = new Date().getFullYear()
          setQuoteNumber(`COT-${year}-${Math.floor(1000 + Math.random() * 9000)}-CLON`)
          setStatus('Borrador')
        } else {
          setQuoteNumber(d.quote_number || '')
          setStatus(d.status || 'Borrador')
        }
        setServiceName(d.service_name || '')
        setIssueDate(d.issue_date || new Date().toISOString().substring(0, 10))
        setExpirationDate(d.expiration_date || '')
        setClientName(d.client_name || '')
        setClientRut(d.client_rut || '')
        setClientCity(d.client_city || '')
        setClientPhone(d.client_phone || '')
        setClientContact(d.client_contact || '')
        setClientArea(d.client_area || '')
        setClientEmail(d.client_email || '')
        setLaborItems(d.labor_items || [])
        setMaterialItems(d.material_items || [])
        setEquipmentItems(d.equipment_items || [])
        setOtherExpenseItems(d.other_expense_items || [])
        setOverheadPercent(Math.round((d.overhead_percent ?? 0.15) * 100))
        setUtilityPercent(Math.round((d.utility_percent ?? 0.15) * 100))
      }
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  // ─── Handlers Mano de Obra ────────────────────────────────────────────────
  const addLaborRow = () => setLaborItems([...laborItems,
    { role: '', unit: 'HH', qty: 0, days: 0, hh_per_day: 0, unit_price: 0, total: 0 }])
  const removeLaborRow = (i) => setLaborItems(laborItems.filter((_, idx) => idx !== i))
  const changeLaborField = (i, field, val) => {
    const rows = [...laborItems]
    const r = { ...rows[i] }
    r[field] = (field === 'role' || field === 'unit') ? val : (parseFloat(val) || 0)
    if (field !== 'role' && field !== 'unit') {
      const q = field === 'qty' ? (parseFloat(val) || 0) : r.qty
      const d = field === 'days' ? (parseFloat(val) || 0) : r.days
      const hh = field === 'hh_per_day' ? (parseFloat(val) || 0) : r.hh_per_day
      const p = field === 'unit_price' ? (parseFloat(val) || 0) : r.unit_price
      r.total = Math.round(q * d * hh * p)
    }
    rows[i] = r; setLaborItems(rows)
  }

  // ─── Handlers Materiales ─────────────────────────────────────────────────
  const addMaterialRow = () => setMaterialItems([...materialItems,
    { name: '', unit: 'UN', qty: 0, unit_price: 0, total: 0 }])
  const removeMaterialRow = (i) => setMaterialItems(materialItems.filter((_, idx) => idx !== i))
  const changeMaterialField = (i, field, val) => {
    const rows = [...materialItems]
    const r = { ...rows[i] }
    r[field] = (field === 'name' || field === 'unit') ? val : (parseFloat(val) || 0)
    if (field !== 'name' && field !== 'unit') {
      const q = field === 'qty' ? (parseFloat(val) || 0) : r.qty
      const p = field === 'unit_price' ? (parseFloat(val) || 0) : r.unit_price
      r.total = Math.round(q * p)
    }
    rows[i] = r; setMaterialItems(rows)
  }

  // ─── Handlers Equipos ────────────────────────────────────────────────────
  const addEquipmentRow = () => setEquipmentItems([...equipmentItems,
    { name: '', unit: 'Día', qty: 0, unit_price: 0, total: 0 }])
  const removeEquipmentRow = (i) => setEquipmentItems(equipmentItems.filter((_, idx) => idx !== i))
  const changeEquipmentField = (i, field, val) => {
    const rows = [...equipmentItems]
    const r = { ...rows[i] }
    r[field] = (field === 'name' || field === 'unit') ? val : (parseFloat(val) || 0)
    if (field !== 'name' && field !== 'unit') {
      const q = field === 'qty' ? (parseFloat(val) || 0) : r.qty
      const p = field === 'unit_price' ? (parseFloat(val) || 0) : r.unit_price
      r.total = Math.round(q * p)
    }
    rows[i] = r; setEquipmentItems(rows)
  }

  // ─── Handlers Otros Gastos ───────────────────────────────────────────────
  const addOtherRow = () => setOtherExpenseItems([...otherExpenseItems,
    { name: '', unit: 'GL', qty: 0, unit_price: 0, total: 0 }])
  const removeOtherRow = (i) => setOtherExpenseItems(otherExpenseItems.filter((_, idx) => idx !== i))
  const changeOtherField = (i, field, val) => {
    const rows = [...otherExpenseItems]
    const r = { ...rows[i] }
    r[field] = (field === 'name' || field === 'unit') ? val : (parseFloat(val) || 0)
    if (field !== 'name' && field !== 'unit') {
      const q = field === 'qty' ? (parseFloat(val) || 0) : r.qty
      const p = field === 'unit_price' ? (parseFloat(val) || 0) : r.unit_price
      r.total = Math.round(q * p)
    }
    rows[i] = r; setOtherExpenseItems(rows)
  }

  // ─── Cálculo financiero — idéntico a la fórmula del Excel ────────────────
  // Excel: AD52=mano+mat+equipo+otros, AD53=%*(AD52-equipo), AD54=%*(AD52+AD53-equipo)
  const subtotalLabor     = laborItems.reduce((s, x)        => s + (parseFloat(x.total) || 0), 0)
  const subtotalMaterials = materialItems.reduce((s, x)     => s + (parseFloat(x.total) || 0), 0)
  const subtotalEquipment = equipmentItems.reduce((s, x)    => s + (parseFloat(x.total) || 0), 0)
  const subtotalOthers    = otherExpenseItems.reduce((s, x) => s + (parseFloat(x.total) || 0), 0)

  const costoDirecto    = subtotalLabor + subtotalMaterials + subtotalEquipment + subtotalOthers
  // Base para gastos = costo directo sin equipos (equipos se traspasan sin markup)
  const baseMarkup      = costoDirecto - subtotalEquipment
  const overheadAmount  = Math.round(baseMarkup * (overheadPercent / 100))
  // Base para utilidades = costo directo + gastos generales, sin equipos
  const utilityAmount   = Math.round((baseMarkup + overheadAmount) * (utilityPercent / 100))
  const netTotal        = costoDirecto + overheadAmount + utilityAmount

  // ─── Guardar ─────────────────────────────────────────────────────────────
  const handleSave = async (e) => {
    e && e.preventDefault()
    if (!quoteNumber.trim()) return alert('Debes ingresar un número de cotización.')
    if (!clientName.trim()) return alert('Debes ingresar el nombre del cliente.')
    if (!serviceName.trim()) return alert('Debes ingresar el nombre del servicio.')
    setSaving(true)
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
      status,
      issue_date: issueDate,
      expiration_date: expirationDate || null,
      labor_items: laborItems.filter(x => x.role.trim() !== ''),
      material_items: materialItems.filter(x => x.name.trim() !== ''),
      equipment_items: equipmentItems.filter(x => x.name.trim() !== ''),
      other_expense_items: otherExpenseItems.filter(x => x.name.trim() !== ''),
      overhead_percent: overheadPercent / 100,
      utility_percent: utilityPercent / 100,
    }
    try {
      const url = isEditMode
        ? `http://127.0.0.1:8000/api/v1/quotes/${id}`
        : 'http://127.0.0.1:8000/api/v1/quotes/'
      const res = await apiFetch(url, {
        method: isEditMode ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (res.ok) navigate('/quotes')
      else { const err = await res.json(); alert(`Error: ${err.detail || 'Verifique los campos.'}`) }
    } catch (e) { console.error(e); alert('Error de conexión al guardar.') }
    finally { setSaving(false) }
  }

  if (loading) return (
    <MwPage title="Cargando cotización..." icon={FileSpreadsheet}>
      <div style={{ padding: '100px 0', textAlign: 'center', color: '#94A3B8' }}>Cargando datos...</div>
    </MwPage>
  )

  const statusCfg = STATUS_CONFIG[status] || STATUS_CONFIG['Borrador']

  return (
    <MwPage title={isEditMode ? `Editar Cotización` : 'Nueva Cotización'} icon={FileSpreadsheet}>

      {/* ── Barra superior ────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <MwButton
            onClick={() => navigate('/quotes')}
            style={{ backgroundColor: '#fff', color: '#475569', border: '1px solid #CBD5E1' }}
          >
            <ArrowLeft size={15} /> Volver
          </MwButton>

          {/* ── ESTADO — aquí, prominente en el header ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#64748B' }}>Estado:</span>
            <select
              value={status}
              onChange={e => setStatus(e.target.value)}
              style={{
                padding: '5px 10px',
                borderRadius: 20,
                border: `1.5px solid ${statusCfg.text}`,
                backgroundColor: statusCfg.bg,
                color: statusCfg.text,
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              {Object.keys(STATUS_CONFIG).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <MwButton onClick={handleSave} disabled={saving} style={{ backgroundColor: '#1E4D8C' }}>
          <Save size={15} /> {saving ? 'Guardando...' : 'Guardar Cotización'}
        </MwButton>
      </div>

      <form onSubmit={handleSave} className="space-y-6">

        {/* ── FOLIO + CLIENTE ───────────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 20 }}>

          {/* Folio */}
          <MwCard style={{ padding: 24 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1E4D8C', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Info size={15} /> Información del Folio
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: 5 }}>
                  Nº Cotización <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input
                  type="text" required
                  style={{ ...cellInputStyle, fontWeight: 700, fontSize: 14 }}
                  value={quoteNumber}
                  onChange={e => setQuoteNumber(e.target.value)}
                  onFocus={e => e.target.style.borderColor = '#1E4D8C'}
                  onBlur={e => e.target.style.borderColor = '#E2E8F0'}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: 5 }}>
                  Nombre del Servicio <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input
                  type="text" required
                  placeholder="ej. Reparación Motor CAT 3512"
                  style={cellInputStyle}
                  value={serviceName}
                  onChange={e => setServiceName(e.target.value)}
                  onFocus={e => e.target.style.borderColor = '#1E4D8C'}
                  onBlur={e => e.target.style.borderColor = '#E2E8F0'}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: 5 }}>Fecha Emisión</label>
                  <input type="date" required style={cellInputStyle}
                    value={issueDate} onChange={e => setIssueDate(e.target.value)}
                    onFocus={e => e.target.style.borderColor = '#1E4D8C'}
                    onBlur={e => e.target.style.borderColor = '#E2E8F0'}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: 5 }}>Vencimiento</label>
                  <input type="date" style={cellInputStyle}
                    value={expirationDate} onChange={e => setExpirationDate(e.target.value)}
                    onFocus={e => e.target.style.borderColor = '#1E4D8C'}
                    onBlur={e => e.target.style.borderColor = '#E2E8F0'}
                  />
                </div>
              </div>
            </div>
          </MwCard>

          {/* Cliente */}
          <MwCard style={{ padding: 24 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1E4D8C', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
              <User size={15} /> Identificación del Cliente
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {[
                { label: 'Cliente / Razón Social', key: 'clientName', val: clientName, set: setClientName, req: true, ph: 'ej. Minera Escondida Ltda.' },
                { label: 'RUT Cliente', key: 'clientRut', val: clientRut, set: setClientRut, ph: 'ej. 76.123.456-K' },
                { label: 'Ciudad / Comuna', key: 'clientCity', val: clientCity, set: setClientCity, ph: 'ej. Antofagasta' },
                { label: 'Contacto Principal', key: 'clientContact', val: clientContact, set: setClientContact, ph: 'ej. Juan Pérez' },
                { label: 'Área / Departamento', key: 'clientArea', val: clientArea, set: setClientArea, ph: 'ej. Abastecimiento' },
                { label: 'Correo Electrónico', key: 'clientEmail', val: clientEmail, set: setClientEmail, ph: 'ej. contacto@empresa.cl', type: 'email' },
                { label: 'Teléfono', key: 'clientPhone', val: clientPhone, set: setClientPhone, ph: 'ej. +56 9 8765 4321' },
              ].map(f => (
                <div key={f.key} style={f.key === 'clientName' ? { gridColumn: 'span 2' } : {}}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: 5 }}>
                    {f.label}{f.req && <span style={{ color: '#EF4444' }}> *</span>}
                  </label>
                  <input
                    type={f.type || 'text'}
                    required={f.req}
                    placeholder={f.ph}
                    style={cellInputStyle}
                    value={f.val}
                    onChange={e => f.set(e.target.value)}
                    onFocus={e => e.target.style.borderColor = '#1E4D8C'}
                    onBlur={e => e.target.style.borderColor = '#E2E8F0'}
                  />
                </div>
              ))}
            </div>
          </MwCard>
        </div>

        {/* ── TÍTULO PLANILLA ───────────────────────────────────────────────── */}
        <div style={{ marginTop: 8, marginBottom: 4 }}>
          <h2 style={{ fontSize: 17, fontWeight: 800, color: '#1E4D8C' }}>Planilla de Costos</h2>
          <p style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>
            Edite las celdas directamente. Totales y márgenes se calculan en tiempo real según la fórmula del Excel oficial.
          </p>
        </div>

        {/* ── 1. MANO DE OBRA ──────────────────────────────────────────────── */}
        {renderSection({
          title: '1. Mano de Obra',
          subtitle: 'Personal Técnico / Ingeniería',
          subtotal: subtotalLabor,
          headers: ['Cargo / Rol', 'Unidad', 'Nº Pers.', 'Días', 'HH/Día', 'P. Unitario', 'Total', ''],
          rows: laborItems.map((item, idx) => (
            <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
              <td style={{ padding: '5px 10px' }}>
                <input style={cellInputStyle} placeholder="ej. Supervisor Mecánico"
                  value={item.role} onChange={e => changeLaborField(idx, 'role', e.target.value)}
                  onFocus={e => e.target.style.borderColor='#1E4D8C'} onBlur={e => e.target.style.borderColor='#E2E8F0'}
                />
              </td>
              <td style={{ padding: '5px 6px', width: 70 }}>
                <input style={cellInputStyleCenter} value={item.unit}
                  onChange={e => changeLaborField(idx, 'unit', e.target.value)}
                  onFocus={e => e.target.style.borderColor='#1E4D8C'} onBlur={e => e.target.style.borderColor='#E2E8F0'}
                />
              </td>
              <td style={{ padding: '5px 6px', width: 75 }}>
                <input type="number" min="0" style={cellInputStyleCenter} value={item.qty || ''}
                  onChange={e => changeLaborField(idx, 'qty', e.target.value)}
                  onFocus={e => e.target.style.borderColor='#1E4D8C'} onBlur={e => e.target.style.borderColor='#E2E8F0'}
                />
              </td>
              <td style={{ padding: '5px 6px', width: 70 }}>
                <input type="number" min="0" style={cellInputStyleCenter} value={item.days || ''}
                  onChange={e => changeLaborField(idx, 'days', e.target.value)}
                  onFocus={e => e.target.style.borderColor='#1E4D8C'} onBlur={e => e.target.style.borderColor='#E2E8F0'}
                />
              </td>
              <td style={{ padding: '5px 6px', width: 75 }}>
                <input type="number" min="0" step="0.5" style={cellInputStyleCenter} value={item.hh_per_day || ''}
                  onChange={e => changeLaborField(idx, 'hh_per_day', e.target.value)}
                  onFocus={e => e.target.style.borderColor='#1E4D8C'} onBlur={e => e.target.style.borderColor='#E2E8F0'}
                />
              </td>
              <td style={{ padding: '5px 6px', width: 110 }}>
                <input type="number" min="0" style={cellInputStyleRight} value={item.unit_price || ''}
                  onChange={e => changeLaborField(idx, 'unit_price', e.target.value)}
                  onFocus={e => e.target.style.borderColor='#1E4D8C'} onBlur={e => e.target.style.borderColor='#E2E8F0'}
                />
              </td>
              <td style={{ padding: '5px 10px', textAlign: 'right', fontWeight: 700, color: '#1E293B', whiteSpace: 'nowrap', width: 110 }}>
                ${Math.round(item.total || 0).toLocaleString('es-CL')}
              </td>
              <td style={{ padding: '5px 8px', textAlign: 'center', width: 36 }}>
                <button type="button" onClick={() => removeLaborRow(idx)} title="Eliminar fila"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#CBD5E1', padding: 2 }}
                  onMouseEnter={e => e.currentTarget.style.color = '#EF4444'}
                  onMouseLeave={e => e.currentTarget.style.color = '#CBD5E1'}
                ><Trash2 size={14} /></button>
              </td>
            </tr>
          )),
          addLabel: '+ Añadir Fila de Mano de Obra',
          onAdd: addLaborRow,
          emptyMsg: 'Sin personal cotizado.',
          colCount: 8,
        })}

        {/* ── 2. MATERIALES ────────────────────────────────────────────────── */}
        {renderSection({
          title: '2. Materiales',
          subtitle: 'Insumos y Materiales Directos',
          subtotal: subtotalMaterials,
          headers: ['Descripción Material', 'Unidad', 'Cantidad', 'P. Unitario', 'Total', ''],
          rows: materialItems.map((item, idx) => (
            <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
              <td style={{ padding: '5px 10px' }}>
                <input style={cellInputStyle} placeholder="ej. Acero Estructural A36"
                  value={item.name} onChange={e => changeMaterialField(idx, 'name', e.target.value)}
                  onFocus={e => e.target.style.borderColor='#1E4D8C'} onBlur={e => e.target.style.borderColor='#E2E8F0'}
                />
              </td>
              <td style={{ padding: '5px 6px', width: 80 }}>
                <input style={cellInputStyleCenter} placeholder="UN" value={item.unit}
                  onChange={e => changeMaterialField(idx, 'unit', e.target.value)}
                  onFocus={e => e.target.style.borderColor='#1E4D8C'} onBlur={e => e.target.style.borderColor='#E2E8F0'}
                />
              </td>
              <td style={{ padding: '5px 6px', width: 90 }}>
                <input type="number" min="0" step="any" style={cellInputStyleCenter} value={item.qty || ''}
                  onChange={e => changeMaterialField(idx, 'qty', e.target.value)}
                  onFocus={e => e.target.style.borderColor='#1E4D8C'} onBlur={e => e.target.style.borderColor='#E2E8F0'}
                />
              </td>
              <td style={{ padding: '5px 6px', width: 120 }}>
                <input type="number" min="0" style={cellInputStyleRight} value={item.unit_price || ''}
                  onChange={e => changeMaterialField(idx, 'unit_price', e.target.value)}
                  onFocus={e => e.target.style.borderColor='#1E4D8C'} onBlur={e => e.target.style.borderColor='#E2E8F0'}
                />
              </td>
              <td style={{ padding: '5px 10px', textAlign: 'right', fontWeight: 700, color: '#1E293B', whiteSpace: 'nowrap', width: 110 }}>
                ${Math.round(item.total || 0).toLocaleString('es-CL')}
              </td>
              <td style={{ padding: '5px 8px', textAlign: 'center', width: 36 }}>
                <button type="button" onClick={() => removeMaterialRow(idx)} title="Eliminar fila"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#CBD5E1', padding: 2 }}
                  onMouseEnter={e => e.currentTarget.style.color = '#EF4444'}
                  onMouseLeave={e => e.currentTarget.style.color = '#CBD5E1'}
                ><Trash2 size={14} /></button>
              </td>
            </tr>
          )),
          addLabel: '+ Añadir Fila de Materiales',
          onAdd: addMaterialRow,
          emptyMsg: 'Sin materiales cotizados.',
          colCount: 6,
        })}

        {/* ── 3. EQUIPOS ───────────────────────────────────────────────────── */}
        {renderSection({
          title: '3. Equipos y Herramientas',
          subtitle: 'Se traspasan al cliente sin margen de utilidad',
          subtotal: subtotalEquipment,
          accentColor: '#0F766E',
          headers: ['Descripción Equipo', 'Unidad', 'Cantidad', 'P. Unitario', 'Total', ''],
          rows: equipmentItems.map((item, idx) => (
            <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
              <td style={{ padding: '5px 10px' }}>
                <input style={cellInputStyle} placeholder="ej. Camioneta 4x4 equipada"
                  value={item.name} onChange={e => changeEquipmentField(idx, 'name', e.target.value)}
                  onFocus={e => e.target.style.borderColor='#0F766E'} onBlur={e => e.target.style.borderColor='#E2E8F0'}
                />
              </td>
              <td style={{ padding: '5px 6px', width: 80 }}>
                <input style={cellInputStyleCenter} placeholder="Día" value={item.unit}
                  onChange={e => changeEquipmentField(idx, 'unit', e.target.value)}
                  onFocus={e => e.target.style.borderColor='#0F766E'} onBlur={e => e.target.style.borderColor='#E2E8F0'}
                />
              </td>
              <td style={{ padding: '5px 6px', width: 90 }}>
                <input type="number" min="0" step="any" style={cellInputStyleCenter} value={item.qty || ''}
                  onChange={e => changeEquipmentField(idx, 'qty', e.target.value)}
                  onFocus={e => e.target.style.borderColor='#0F766E'} onBlur={e => e.target.style.borderColor='#E2E8F0'}
                />
              </td>
              <td style={{ padding: '5px 6px', width: 120 }}>
                <input type="number" min="0" style={cellInputStyleRight} value={item.unit_price || ''}
                  onChange={e => changeEquipmentField(idx, 'unit_price', e.target.value)}
                  onFocus={e => e.target.style.borderColor='#0F766E'} onBlur={e => e.target.style.borderColor='#E2E8F0'}
                />
              </td>
              <td style={{ padding: '5px 10px', textAlign: 'right', fontWeight: 700, color: '#1E293B', whiteSpace: 'nowrap', width: 110 }}>
                ${Math.round(item.total || 0).toLocaleString('es-CL')}
              </td>
              <td style={{ padding: '5px 8px', textAlign: 'center', width: 36 }}>
                <button type="button" onClick={() => removeEquipmentRow(idx)} title="Eliminar fila"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#CBD5E1', padding: 2 }}
                  onMouseEnter={e => e.currentTarget.style.color = '#EF4444'}
                  onMouseLeave={e => e.currentTarget.style.color = '#CBD5E1'}
                ><Trash2 size={14} /></button>
              </td>
            </tr>
          )),
          addLabel: '+ Añadir Fila de Equipos',
          onAdd: addEquipmentRow,
          emptyMsg: 'Sin equipos cotizados.',
          colCount: 6,
        })}

        {/* ── 4. OTROS GASTOS ──────────────────────────────────────────────── */}
        {renderSection({
          title: '4. Otros Gastos',
          subtitle: 'Viáticos, Traslados y Gastos Directos',
          subtotal: subtotalOthers,
          headers: ['Descripción del Gasto', 'Unidad', 'Cantidad', 'P. Unitario', 'Total', ''],
          rows: otherExpenseItems.map((item, idx) => (
            <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
              <td style={{ padding: '5px 10px' }}>
                <input style={cellInputStyle} placeholder="ej. Traslado, Alojamiento, Viáticos"
                  value={item.name} onChange={e => changeOtherField(idx, 'name', e.target.value)}
                  onFocus={e => e.target.style.borderColor='#1E4D8C'} onBlur={e => e.target.style.borderColor='#E2E8F0'}
                />
              </td>
              <td style={{ padding: '5px 6px', width: 80 }}>
                <input style={cellInputStyleCenter} placeholder="GL" value={item.unit}
                  onChange={e => changeOtherField(idx, 'unit', e.target.value)}
                  onFocus={e => e.target.style.borderColor='#1E4D8C'} onBlur={e => e.target.style.borderColor='#E2E8F0'}
                />
              </td>
              <td style={{ padding: '5px 6px', width: 90 }}>
                <input type="number" min="0" step="any" style={cellInputStyleCenter} value={item.qty || ''}
                  onChange={e => changeOtherField(idx, 'qty', e.target.value)}
                  onFocus={e => e.target.style.borderColor='#1E4D8C'} onBlur={e => e.target.style.borderColor='#E2E8F0'}
                />
              </td>
              <td style={{ padding: '5px 6px', width: 120 }}>
                <input type="number" min="0" style={cellInputStyleRight} value={item.unit_price || ''}
                  onChange={e => changeOtherField(idx, 'unit_price', e.target.value)}
                  onFocus={e => e.target.style.borderColor='#1E4D8C'} onBlur={e => e.target.style.borderColor='#E2E8F0'}
                />
              </td>
              <td style={{ padding: '5px 10px', textAlign: 'right', fontWeight: 700, color: '#1E293B', whiteSpace: 'nowrap', width: 110 }}>
                ${Math.round(item.total || 0).toLocaleString('es-CL')}
              </td>
              <td style={{ padding: '5px 8px', textAlign: 'center', width: 36 }}>
                <button type="button" onClick={() => removeOtherRow(idx)} title="Eliminar fila"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#CBD5E1', padding: 2 }}
                  onMouseEnter={e => e.currentTarget.style.color = '#EF4444'}
                  onMouseLeave={e => e.currentTarget.style.color = '#CBD5E1'}
                ><Trash2 size={14} /></button>
              </td>
            </tr>
          )),
          addLabel: '+ Añadir Fila de Otros Gastos',
          onAdd: addOtherRow,
          emptyMsg: 'Sin otros gastos cotizados.',
          colCount: 6,
        })}

        {/* ── RESUMEN FINANCIERO ───────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 8 }}>

          {/* Notas */}
          <MwCard style={{ padding: 22 }}>
            <h4 style={{ fontSize: 13, fontWeight: 700, color: '#475569', marginBottom: 10 }}>Notas y Condiciones</h4>
            <div style={{ fontSize: 12, color: '#64748B', lineHeight: 1.7 }}>
              <p>• Valores expresados en pesos chilenos, netos de IVA.</p>
              <p>• Los equipos se traspasan al cliente a costo directo sin markup.</p>
              <p>• Forma de pago: 30 días contra factura aceptada.</p>
              <p>• Validez: 30 días desde la fecha de emisión.</p>
              <p style={{ marginTop: 10, fontWeight: 600, color: '#1E4D8C' }}>
                Emitido por Sergio Hans Farías Anabalón — Mecwell Limitada
              </p>
            </div>
          </MwCard>

          {/* Resumen */}
          <MwCard style={{ padding: 22, backgroundColor: '#FAFBFF' }}>
            <h4 style={{ fontSize: 14, fontWeight: 700, color: '#1E4D8C', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Calculator size={15} /> Resumen de Liquidación
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13 }}>

              {/* Subtotales informativos */}
              {[
                { label: 'Mano de Obra', val: subtotalLabor },
                { label: 'Materiales', val: subtotalMaterials },
                { label: 'Equipos (sin markup)', val: subtotalEquipment, muted: true },
                { label: 'Otros Gastos', val: subtotalOthers },
              ].map(r => (
                <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', color: r.muted ? '#94A3B8' : '#475569' }}>
                  <span>{r.label}</span>
                  <span style={{ fontWeight: 600 }}>${Math.round(r.val).toLocaleString('es-CL')}</span>
                </div>
              ))}

              <div style={{ borderTop: '2px solid #E2E8F0', paddingTop: 10, display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: '#1E293B' }}>
                <span>Costo Directo Total</span>
                <span>${Math.round(costoDirecto).toLocaleString('es-CL')}</span>
              </div>

              {/* Gastos Generales */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dashed #E2E8F0', paddingTop: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ color: '#475569' }}>Gastos Generales</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <input
                      type="number" min="0" max="100"
                      style={{ width: 46, padding: '3px 6px', border: '1px solid #CBD5E1', borderRadius: 4, fontSize: 12, fontWeight: 700, color: '#DC2626', textAlign: 'center', backgroundColor: '#FEF2F2' }}
                      value={overheadPercent}
                      onChange={e => setOverheadPercent(parseInt(e.target.value) || 0)}
                    />
                    <span style={{ fontSize: 11, color: '#DC2626', fontWeight: 700 }}>%</span>
                  </div>
                </div>
                <span style={{ fontWeight: 600, color: '#475569' }}>+ ${Math.round(overheadAmount).toLocaleString('es-CL')}</span>
              </div>

              {/* Utilidades */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ color: '#475569' }}>Utilidades</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <input
                      type="number" min="0" max="100"
                      style={{ width: 46, padding: '3px 6px', border: '1px solid #CBD5E1', borderRadius: 4, fontSize: 12, fontWeight: 700, color: '#DC2626', textAlign: 'center', backgroundColor: '#FEF2F2' }}
                      value={utilityPercent}
                      onChange={e => setUtilityPercent(parseInt(e.target.value) || 0)}
                    />
                    <span style={{ fontSize: 11, color: '#DC2626', fontWeight: 700 }}>%</span>
                  </div>
                </div>
                <span style={{ fontWeight: 600, color: '#475569' }}>+ ${Math.round(utilityAmount).toLocaleString('es-CL')}</span>
              </div>

              {/* Total final */}
              <div style={{ borderTop: '2px solid #1E4D8C', paddingTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#EFF6FF', borderRadius: 8, padding: 14, marginTop: 4 }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: '#1E4D8C' }}>Subtotal Neto a Facturar</span>
                <span style={{ fontSize: 20, fontWeight: 900, color: '#065F46' }}>${Math.round(netTotal).toLocaleString('es-CL')}</span>
              </div>
            </div>
          </MwCard>
        </div>

        {/* Botones finales */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, paddingTop: 16, borderTop: '1px solid #E2E8F0' }}>
          <MwButton onClick={() => navigate('/quotes')} style={{ backgroundColor: '#fff', color: '#475569', border: '1px solid #CBD5E1' }}>
            Cancelar
          </MwButton>
          <MwButton onClick={handleSave} disabled={saving} style={{ backgroundColor: '#1E4D8C' }}>
            <Save size={15} /> {saving ? 'Guardando...' : 'Confirmar y Guardar'}
          </MwButton>
        </div>
      </form>
    </MwPage>
  )
}

// ─── Helper para renderizar cada sección de tabla ──────────────────────────
function renderSection({ title, subtitle, subtotal, accentColor = '#1E4D8C', headers, rows, addLabel, onAdd, emptyMsg, colCount }) {
  return (
    <MwCard style={{ overflow: 'hidden', padding: 0 }}>
      {/* Header azul */}
      <div style={{ backgroundColor: accentColor, padding: '10px 18px', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{title}</span>
          {subtitle && <span style={{ fontSize: 11, opacity: 0.75, marginLeft: 8 }}>— {subtitle}</span>}
        </div>
        <span style={{ fontSize: 12, backgroundColor: 'rgba(255,255,255,0.2)', padding: '2px 10px', borderRadius: 4, fontWeight: 700 }}>
          Subtotal: ${Math.round(subtotal).toLocaleString('es-CL')}
        </span>
      </div>

      {/* Tabla */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '2px solid #E2E8F0' }}>
              {headers.map((h, i) => (
                <th key={i} style={{
                  padding: '9px 10px',
                  textAlign: i === 0 ? 'left' : i === headers.length - 1 ? 'center' : (i >= headers.length - 3 ? 'right' : 'center'),
                  fontWeight: 600, fontSize: 11, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em',
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows}
            {rows.length === 0 && (
              <tr>
                <td colSpan={colCount} style={{ padding: '20px', textAlign: 'center', color: '#CBD5E1', fontStyle: 'italic', fontSize: 13 }}>
                  {emptyMsg}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Botón añadir */}
      <div style={{ padding: '10px 18px', borderTop: '1px solid #F1F5F9', backgroundColor: '#FAFBFD' }}>
        <button type="button" onClick={onAdd} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: 12, fontWeight: 700, color: accentColor, display: 'flex', alignItems: 'center', gap: 4,
        }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.7'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
          <Plus size={13} /> {addLabel}
        </button>
      </div>
    </MwCard>
  )
}
