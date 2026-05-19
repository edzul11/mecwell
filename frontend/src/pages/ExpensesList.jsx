import { apiFetch } from '../supabaseClient'
import { useState, useEffect } from 'react'
import { Plus, X, ExternalLink, TrendingUp, Filter, FileText, UploadCloud, Calendar, DollarSign, Tag } from 'lucide-react'
import { PageWrapper, PageHeader, PrimaryButton, MwTable, MwTr, MwTd, Card } from '../components/MecwellUI'

export default function ExpensesList() {
  const [expenses, setExpenses] = useState([])
  const [sites, setSites] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedSiteFilter, setSelectedSiteFilter] = useState('ALL')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEdit, setIsEdit] = useState(false)
  const [selectedExpense, setSelectedExpense] = useState(null)

  // Uploading state
  const [uploadingFile, setUploadingFile] = useState(false)

  // Form State
  const [formData, setFormData] = useState({
    amount: 0,
    expense_date: new Date().toISOString().split('T')[0],
    description: '',
    receipt_url: '',
    site_id: ''
  })

  // Optional category custom field - we use description tags or standard ones
  const [expenseCategory, setExpenseCategory] = useState('Materiales Menores')

  useEffect(() => {
    fetchExpenses()
    fetchSites()
  }, [])

  const fetchExpenses = () => {
    setLoading(true)
    apiFetch('/api/v1/expenses/')
      .then(r => r.json())
      .then(data => {
        setExpenses(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setLoading(false)
      })
  }

  const fetchSites = () => {
    apiFetch('/api/v1/sites/')
      .then(r => r.json())
      .then(data => {
        setSites(Array.isArray(data) ? data : [])
      })
      .catch(err => console.error(err))
  }

  const handleOpenAdd = () => {
    setIsEdit(false)
    setFormData({
      amount: 0,
      expense_date: new Date().toISOString().split('T')[0],
      description: '',
      receipt_url: '',
      site_id: sites[0]?.id || ''
    })
    setExpenseCategory('Materiales Menores')
    setIsModalOpen(true)
  }

  const handleOpenEdit = (exp) => {
    setIsEdit(true)
    setSelectedExpense(exp)
    setFormData({
      amount: exp.amount || 0,
      expense_date: exp.expense_date || new Date().toISOString().split('T')[0],
      description: exp.description ? exp.description.replace(/^\[.*?\]\s*/, '') : '',
      receipt_url: exp.receipt_url || '',
      site_id: exp.site_id || ''
    })
    
    // Extract category from bracket format e.g. "[Combustible] Carga camioneta"
    const catMatch = exp.description ? exp.description.match(/^\[(.*?)\]/) : null
    if (catMatch) {
      setExpenseCategory(catMatch[1])
    } else {
      setExpenseCategory('Otros')
    }
    setIsModalOpen(true)
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setUploadingFile(true)
    const fileData = new FormData()
    fileData.append('file', file)

    try {
      const res = await apiFetch('/api/v1/documents/upload', {
        method: 'POST',
        body: fileData
      })
      if (res.ok) {
        const data = await res.json()
        setFormData(prev => ({ ...prev, receipt_url: data.url }))
      } else {
        alert("Error al subir el comprobante.")
      }
    } catch (err) {
      console.error(err)
      alert("Error en el servidor al subir el archivo.")
    } finally {
      setUploadingFile(false)
    }
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!formData.site_id) {
      alert("Por favor seleccione la Faena/Obra asociada al gasto.")
      return
    }
    if (formData.amount <= 0) {
      alert("Por favor ingrese un monto válido mayor a $0.")
      return
    }

    // Append category to description for richer structure
    const enrichedDescription = `[${expenseCategory}] ${formData.description || 'Gasto operacional'}`
    const submitData = {
      ...formData,
      description: enrichedDescription
    }

    try {
      const url = isEdit ? `/api/v1/expenses/${selectedExpense.id}` : '/api/v1/expenses/'
      const method = isEdit ? 'PATCH' : 'POST'
      const res = await apiFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData)
      })

      if (res.ok) {
        setIsModalOpen(false)
        fetchExpenses()
      } else {
        const errData = await res.json()
        alert(`Error al guardar: ${errData.detail || 'Error desconocido'}`)
      }
    } catch (err) {
      console.error(err)
      alert("Error al guardar el gasto.")
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm("¿Está seguro de que desea eliminar este registro de gasto?")) return
    try {
      const res = await apiFetch(`/api/v1/expenses/${id}`, { method: 'DELETE' })
      if (res.ok) {
        fetchExpenses()
      } else {
        alert("Error al eliminar el gasto.")
      }
    } catch (err) {
      console.error(err)
    }
  }

  // Filtrado
  const filteredExpenses = expenses.filter(exp => {
    if (selectedSiteFilter === 'ALL') return true
    return exp.site_id === selectedSiteFilter
  })

  // Totales
  const totalAmount = filteredExpenses.reduce((acc, e) => acc + (parseFloat(e.amount) || 0), 0)

  // Desglose de Categorías
  const categoryBreakdown = {}
  filteredExpenses.forEach(exp => {
    const match = exp.description ? exp.description.match(/^\[(.*?)\]/) : null
    const cat = match ? match[1] : 'Otros'
    categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + (parseFloat(exp.amount) || 0)
  })

  const sortedCategories = Object.entries(categoryBreakdown).sort((a, b) => b[1] - a[1])

  return (
    <PageWrapper>
      <PageHeader
        title="Gastos Operacionales"
        subtitle="Control financiero por Faenas y Proyectos Activos"
        action={
          <PrimaryButton onClick={handleOpenAdd}>
            <Plus style={{ width: 15, height: 15 }} /> Registrar Gasto
          </PrimaryButton>
        }
      />

      {/* Grid de Estadísticas Financieras */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, marginBottom: 24 }}>
        <Card style={{ padding: '20px 24px', borderTop: '4px solid #1E4D8C', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <TrendingUp style={{ width: 22, height: 22, color: '#1E4D8C' }} />
          </div>
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', marginBottom: 2 }}>Total Gastos Consolidados</p>
            <p style={{ fontSize: 24, fontWeight: 700, color: '#1E4D8C' }}>${totalAmount.toLocaleString('es-CL')}</p>
          </div>
        </Card>

        {/* Desglose de Categorías con barras visuales */}
        <Card style={{ padding: '16px 20px', borderTop: '4px solid #10B981' }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', marginBottom: 10 }}>Mayor Consumo por Rubro</p>
          {sortedCategories.length === 0 ? (
            <p style={{ fontSize: 12, color: '#94A3B8', margin: 0 }}>Sin datos en esta faena.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {sortedCategories.slice(0, 3).map(([cat, val]) => {
                const percentage = totalAmount > 0 ? (val / totalAmount) * 100 : 0
                return (
                  <div key={cat} style={{ fontSize: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#334155', fontWeight: 600, marginBottom: 2 }}>
                      <span>{cat}</span>
                      <span>${val.toLocaleString('es-CL')} ({percentage.toFixed(0)}%)</span>
                    </div>
                    <div style={{ width: '100%', height: 6, backgroundColor: '#F1F5F9', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ width: `${percentage}%`, height: '100%', backgroundColor: '#10B981', borderRadius: 3 }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>
      </div>

      {/* Panel de Filtro de Faena */}
      <Card style={{ padding: '12px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#64748B', fontSize: 13, fontWeight: 600 }}>
          <Filter style={{ width: 16, height: 16 }} />
          Filtrar por Faena:
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            onClick={() => setSelectedSiteFilter('ALL')}
            style={{
              padding: '5px 12px', borderRadius: 16, border: '1px solid #E2E8F0',
              fontSize: 12, fontWeight: 600, cursor: 'pointer',
              backgroundColor: selectedSiteFilter === 'ALL' ? '#1E4D8C' : '#fff',
              color: selectedSiteFilter === 'ALL' ? '#fff' : '#64748B',
            }}
          >
            Todas las Faenas
          </button>
          {sites.map(site => (
            <button
              key={site.id}
              onClick={() => setSelectedSiteFilter(site.id)}
              style={{
                padding: '5px 12px', borderRadius: 16, border: '1px solid #E2E8F0',
                fontSize: 12, fontWeight: 600, cursor: 'pointer',
                backgroundColor: selectedSiteFilter === site.id ? '#1E4D8C' : '#fff',
                color: selectedSiteFilter === site.id ? '#fff' : '#64748B',
              }}
            >
              {site.name}
            </button>
          ))}
        </div>
      </Card>

      {/* Tabla Principal */}
      <MwTable
        loading={loading}
        headers={['Fecha', 'Categoría', 'Descripción', 'Faena / Obra', 'Monto', { label: 'Comprobante', right: true }]}
      >
        {filteredExpenses.length === 0 ? (
          <tr>
            <td colSpan={6} style={{ padding: '48px 20px', textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>
              No hay gastos registrados.
            </td>
          </tr>
        ) : filteredExpenses.map(exp => {
          const match = exp.description ? exp.description.match(/^\[(.*?)\]/) : null
          const category = match ? match[1] : 'Operacional'
          const cleanDesc = exp.description ? exp.description.replace(/^\[.*?\]\s*/, '') : ''

          return (
            <MwTr key={exp.id}>
              <MwTd muted>
                {exp.expense_date ? new Date(exp.expense_date).toLocaleDateString('es-CL') : '—'}
              </MwTd>
              <MwTd>
                <span style={{
                  padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700,
                  backgroundColor: '#F1F5F9', color: '#475569'
                }}>
                  {category}
                </span>
              </MwTd>
              <MwTd bold>{cleanDesc || 'Gastos Operacionales'}</MwTd>
              <MwTd>
                <span style={{
                  padding: '3px 10px', borderRadius: 99,
                  fontSize: 11, fontWeight: 600,
                  backgroundColor: '#EFF6FF', color: '#1E4D8C',
                }}>
                  {exp.sites?.name || 'Cargando...'}
                </span>
              </MwTd>
              <MwTd>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#1A1C20' }}>
                  ${parseFloat(exp.amount || 0).toLocaleString('es-CL')}
                </span>
              </MwTd>
              <MwTd right>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', alignItems: 'center' }}>
                  {exp.receipt_url ? (
                    <a href={exp.receipt_url} target="_blank" rel="noopener noreferrer"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, color: '#1E4D8C', textDecoration: 'none' }}
                    >
                      <ExternalLink style={{ width: 13, height: 13 }} /> Ver Boleta
                    </a>
                  ) : (
                    <span style={{ fontSize: 11, color: '#CBD5E1' }}>Sin boleta</span>
                  )}
                  <button
                    onClick={() => handleOpenEdit(exp)}
                    style={{
                      padding: '4px 8px', borderRadius: 4, border: '1px solid #E2E8F0',
                      backgroundColor: '#fff', fontSize: 11, fontWeight: 600, color: '#1E4D8C', cursor: 'pointer'
                    }}
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(exp.id)}
                    style={{
                      padding: '4px 8px', borderRadius: 4, border: '1px solid #FCA5A5',
                      backgroundColor: '#FEF2F2', fontSize: 11, fontWeight: 600, color: '#DC2626', cursor: 'pointer'
                    }}
                  >
                    Borrar
                  </button>
                </div>
              </MwTd>
            </MwTr>
          )
        })}
      </MwTable>

      {/* Modal de Registro de Gasto */}
      {isModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(30, 41, 59, 0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{
            backgroundColor: '#fff', borderRadius: 16, width: '100%', maxWidth: 500,
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', padding: 32, position: 'relative'
          }}>
            <button
              onClick={() => setIsModalOpen(false)}
              style={{ position: 'absolute', top: 20, right: 20, background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}
            >
              <X className="w-5 h-5" />
            </button>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1E4D8C', marginBottom: 20 }}>
              {isEdit ? 'Editar Gasto Registrado' : 'Registrar Gasto Operacional'}
            </h3>

            <form onSubmit={handleSave} className="space-y-4">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: 4 }}>Fecha Gasto</label>
                  <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #CBD5E1', borderRadius: 8, padding: '8px 10px' }}>
                    <Calendar style={{ width: 14, height: 14, color: '#94A3B8', marginRight: 6 }} />
                    <input
                      type="date"
                      required
                      style={{ border: 'none', outline: 'none', fontSize: 13, width: '100%' }}
                      value={formData.expense_date}
                      onChange={e => setFormData({ ...formData, expense_date: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: 4 }}>Monto Gasto (CLP)</label>
                  <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #CBD5E1', borderRadius: 8, padding: '8px 10px' }}>
                    <DollarSign style={{ width: 14, height: 14, color: '#94A3B8', marginRight: 6 }} />
                    <input
                      type="number"
                      required
                      min="1"
                      placeholder="Monto total en pesos"
                      style={{ border: 'none', outline: 'none', fontSize: 13, width: '100%' }}
                      value={formData.amount}
                      onChange={e => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: 4 }}>Asociado a Faena</label>
                  <select
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #CBD5E1', borderRadius: 8, fontSize: 13 }}
                    value={formData.site_id}
                    onChange={e => setFormData({ ...formData, site_id: e.target.value })}
                  >
                    <option value="" disabled>Seleccione una faena</option>
                    {sites.map(site => (
                      <option key={site.id} value={site.id}>{site.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: 4 }}>Categoría / Rubro</label>
                  <select
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #CBD5E1', borderRadius: 8, fontSize: 13 }}
                    value={expenseCategory}
                    onChange={e => setExpenseCategory(e.target.value)}
                  >
                    <option value="Combustible">Combustible</option>
                    <option value="Alimentación">Alimentación</option>
                    <option value="Materiales Menores">Materiales Menores</option>
                    <option value="Viáticos">Viáticos</option>
                    <option value="Repuestos">Repuestos / Mantención</option>
                    <option value="Otros">Otros</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: 4 }}>Descripción / Detalle</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Carga de combustible para generador eléctrico"
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #CBD5E1', borderRadius: 8, fontSize: 13 }}
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              {/* Subida de boleta */}
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: 4 }}>Subir Boleta / Comprobante</label>
                <div style={{
                  border: '2px dashed #CBD5E1', borderRadius: 12, padding: '16px 20px',
                  textAlign: 'center', backgroundColor: '#F8FAFC', cursor: 'pointer', position: 'relative'
                }}>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={handleFileUpload}
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                    disabled={uploadingFile}
                  />
                  <UploadCloud style={{ width: 28, height: 28, color: '#64748B', margin: '0 auto 8px' }} />
                  <p style={{ fontSize: 12, fontWeight: 600, color: '#475569', margin: 0 }}>
                    {uploadingFile ? "Subiendo archivo..." : "Haga clic para cargar una imagen o PDF"}
                  </p>
                  <p style={{ fontSize: 10, color: '#94A3B8', marginTop: 4 }}>Máximo 10MB</p>
                </div>
                {formData.receipt_url && (
                  <div style={{ marginTop: 8, padding: '8px 12px', backgroundColor: '#ECFDF5', borderRadius: 8, display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 11, color: '#065F46', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <FileText style={{ width: 14, height: 14 }} /> Boleta cargada correctamente
                    </span>
                    <a href={formData.receipt_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, fontWeight: 700, color: '#1E4D8C', textDecoration: 'none' }}>Ver archivo</a>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: 12, paddingTop: 16, borderTop: '1px solid #E2E8F0' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{ flex: 1, padding: '10px', border: '1px solid #CBD5E1', borderRadius: 8, backgroundColor: '#fff', fontSize: 13, fontWeight: 600, color: '#475569', cursor: 'pointer' }}
                >
                  Cancelar
                </button>
                <PrimaryButton type="submit" style={{ flex: 1 }}>
                  Guardar Gasto
                </PrimaryButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageWrapper>
  )
}
