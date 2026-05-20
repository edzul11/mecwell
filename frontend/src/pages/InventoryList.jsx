import { apiFetch } from '../supabaseClient'
import { useState, useEffect } from 'react'
import { Plus, X, Package, AlertTriangle, ArrowRight, Wrench, ShieldAlert } from 'lucide-react'
import { PageWrapper, PageHeader, PrimaryButton, MwTable, MwTr, MwTd, StatusBadge, Card } from '../components/MecwellUI'
import { useConfirmAlert } from '../context/ConfirmAlertContext'

export default function InventoryList() {
  const { showConfirm, showAlert } = useConfirmAlert()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('ALL')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEdit, setIsEdit] = useState(false)
  const [selectedItem, setSelectedItem] = useState(null)

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    category: 'EPP',
    stock_quantity: 0,
    unit_price: 0,
    unit_measure: 'unid.',
    is_returnable: false,
    minimum_stock: 0,
    acquisition_value: 0
  })

  useEffect(() => {
    fetchItems()
  }, [])

  const fetchItems = () => {
    setLoading(true)
    apiFetch('/api/v1/inventory/items')
      .then(r => r.json())
      .then(data => { 
        setItems(Array.isArray(data) ? data : [])
        setLoading(false) 
      })
      .catch(err => { 
        console.error(err)
        setLoading(false) 
      })
  }

  const handleOpenAdd = () => {
    setIsEdit(false)
    setFormData({
      name: '',
      category: 'EPP',
      stock_quantity: 0,
      unit_price: 0,
      unit_measure: 'unid.',
      is_returnable: false,
      minimum_stock: 0,
      acquisition_value: 0
    })
    setIsModalOpen(true)
  }

  const handleOpenEdit = (item) => {
    setIsEdit(true)
    setSelectedItem(item)
    setFormData({
      name: item.name,
      category: item.category,
      stock_quantity: item.stock_quantity || 0,
      unit_price: item.unit_price || 0,
      unit_measure: item.unit_measure || 'unid.',
      is_returnable: item.is_returnable || false,
      minimum_stock: item.minimum_stock || 0,
      acquisition_value: item.acquisition_value || 0
    })
    setIsModalOpen(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!formData.name) {
      showAlert("Validación", "Por favor ingrese un nombre para el ítem.")
      return
    }

    try {
      const url = isEdit ? `/api/v1/inventory/items/${selectedItem.id}` : '/api/v1/inventory/items'
      const method = isEdit ? 'PATCH' : 'POST'
      const res = await apiFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (res.ok) {
        setIsModalOpen(false)
        fetchItems()
      } else {
        const errData = await res.json()
        showAlert("Error al guardar", `Error al guardar: ${errData.detail || 'Error desconocido'}`, true)
      }
    } catch (err) {
      console.error(err)
      showAlert("Error", "Error al intentar guardar el ítem.", true)
    }
  }

  const handleDelete = async (id) => {
    const confirmed = await showConfirm({
      title: '⚠️ ¿ELIMINAR ÍTEM?',
      message: '¿Está seguro de que desea eliminar este ítem del inventario? Esta acción no se puede deshacer.',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      isDestructive: true
    })
    if (!confirmed) return

    try {
      const res = await apiFetch(`/api/v1/inventory/items/${id}`, { method: 'DELETE' })
      if (res.ok) {
        fetchItems()
      } else {
        showAlert("Error", "No se pudo eliminar el ítem.", true)
      }
    } catch (err) {
      console.error(err)
      showAlert("Error", "Error de conexión al eliminar el ítem.", true)
    }
  }

  const categories = ['ALL', 'EPP', 'Herramienta', 'Maquinaria', 'Vehículo', 'Material']

  // Filtrado
  const filteredItems = items.filter(item => {
    if (selectedCategory === 'ALL') return true
    return item.category === selectedCategory
  })

  // Estadísticas e Insumos Críticos
  const totalStock = items.reduce((acc, i) => acc + (i.stock_quantity || 0), 0)
  const criticalItems = items.filter(i => (i.stock_quantity || 0) <= (i.minimum_stock || 0))
  const assetValue = items
    .filter(i => i.category === 'Maquinaria' || i.category === 'Vehículo')
    .reduce((acc, i) => acc + (i.acquisition_value || 0) * (i.stock_quantity || 1), 0)

  return (
    <PageWrapper>
      <PageHeader
        title="Gestión de Inventario"
        subtitle={`${items.length} ítems registrados en bodega`}
        action={
          <PrimaryButton onClick={handleOpenAdd}>
            <Plus style={{ width: 15, height: 15 }} /> Añadir Ítem
          </PrimaryButton>
        }
      />

      {/* Tarjetas de Estadísticas Rápidas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
        <Card style={{ padding: '16px 20px', borderTop: '4px solid #1E4D8C', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: '#EFF6FF', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center' }}>
            <Package className="w-5 h-5 text-blue-700" />
          </div>
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', marginBottom: 2 }}>Stock Total</p>
            <p style={{ fontSize: 18, fontWeight: 700, color: '#1E4D8C' }}>{totalStock} unid.</p>
          </div>
        </Card>

        <Card style={{ padding: '16px 20px', borderTop: '4px solid #EF4444', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: '#FEF2F2', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center' }}>
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', marginBottom: 2 }}>Bajo Stock / Críticos</p>
            <p style={{ fontSize: 18, fontWeight: 700, color: '#EF4444' }}>{criticalItems.length} Alertas</p>
          </div>
        </Card>

        <Card style={{ padding: '16px 20px', borderTop: '4px solid #10B981', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: '#ECFDF5', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center' }}>
            <Wrench className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', marginBottom: 2 }}>Valor en Activos</p>
            <p style={{ fontSize: 18, fontWeight: 700, color: '#10B981' }}>${assetValue.toLocaleString('es-CL')}</p>
          </div>
        </Card>
      </div>

      {/* Banner de Advertencia de Stock Crítico */}
      {criticalItems.length > 0 && (
        <div style={{
          backgroundColor: '#FFFBEB', border: '1px solid #F59E0B', borderRadius: 12,
          padding: '16px 20px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12
        }}>
          <ShieldAlert className="w-6 h-6 text-amber-600 flex-shrink-0" />
          <div>
            <h4 style={{ fontSize: 13, fontWeight: 700, color: '#92400E', margin: 0 }}>Atención: Insumos bajo el límite mínimo</h4>
            <p style={{ fontSize: 12, color: '#B45309', margin: '2px 0 0 0' }}>
              Los siguientes elementos requieren reposición: {criticalItems.map(i => i.name).join(', ')}.
            </p>
          </div>
        </div>
      )}

      {/* Filtros de Categorías */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, overflowX: 'auto', paddingBottom: 4 }}>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            style={{
              padding: '6px 14px', borderRadius: 20, border: '1px solid #E2E8F0',
              fontSize: 12, fontWeight: 600, cursor: 'pointer',
              backgroundColor: selectedCategory === cat ? '#1E4D8C' : '#fff',
              color: selectedCategory === cat ? '#fff' : '#64748B',
              transition: 'all 0.15s'
            }}
          >
            {cat === 'ALL' ? 'Todos' : cat}
          </button>
        ))}
      </div>

      {/* Tabla Principal */}
      <MwTable
        loading={loading}
        headers={['Ítem', 'Categoría', 'Stock', 'Unidad', 'Alerta Stock Mín.', 'Valor Activo (CapEx)', 'Tipo', { label: 'Acciones', right: true }]}
      >
        {filteredItems.length === 0 ? (
          <tr>
            <td colSpan={8} style={{ padding: '48px 20px', textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>
              No hay ítems en la categoría seleccionada.
            </td>
          </tr>
        ) : filteredItems.map(item => {
          const isLow = (item.stock_quantity || 0) <= (item.minimum_stock || 0)
          return (
            <MwTr key={item.id}>
              <MwTd>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8,
                    backgroundColor: isLow ? '#FEF2F2' : (item.is_returnable ? '#DBEAFE' : '#F0FDF4'),
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <Package style={{ width: 15, height: 15, color: isLow ? '#EF4444' : (item.is_returnable ? '#1E4D8C' : '#059669') }} />
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#1A1C20' }}>
                    {item.name}
                    {isLow && <span style={{ marginLeft: 6, fontSize: 10, backgroundColor: '#FEE2E2', color: '#991B1B', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>BAJO STOCK</span>}
                  </span>
                </div>
              </MwTd>
              <MwTd muted>{item.category || '—'}</MwTd>
              <MwTd>
                <span style={{
                  fontSize: 15, fontWeight: 700,
                  color: isLow ? '#EF4444' : '#1E4D8C',
                }}>
                  {item.stock_quantity ?? 0}
                </span>
              </MwTd>
              <MwTd muted>{item.unit_measure || 'unid.'}</MwTd>
              <MwTd>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#64748B' }}>
                  {item.minimum_stock || 0}
                </span>
              </MwTd>
              <MwTd>
                <span style={{ fontSize: 13, fontWeight: 600, color: item.acquisition_value > 0 ? '#10B981' : '#94A3B8' }}>
                  {item.acquisition_value > 0 ? `$${item.acquisition_value.toLocaleString('es-CL')}` : 'N/A'}
                </span>
              </MwTd>
              <MwTd>
                <StatusBadge status={item.is_returnable ? 'retornable' : 'consumible'} />
              </MwTd>
              <MwTd right>
                <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                  <button 
                    onClick={() => handleOpenEdit(item)}
                    style={{
                      padding: '5px 12px', borderRadius: 6, border: '1px solid #E2E8F0',
                      backgroundColor: '#fff', fontSize: 12, fontWeight: 600, color: '#1E4D8C', cursor: 'pointer',
                    }}
                  >
                    Editar
                  </button>
                  <button 
                    onClick={() => handleDelete(item.id)}
                    style={{
                      padding: '5px 12px', borderRadius: 6, border: '1px solid #FCA5A5',
                      backgroundColor: '#FEF2F2', fontSize: 12, fontWeight: 600, color: '#DC2626', cursor: 'pointer',
                    }}
                  >
                    Eliminar
                  </button>
                </div>
              </MwTd>
            </MwTr>
          )
        })}
      </MwTable>

      {/* Modal de Registro y Edición */}
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
              {isEdit ? 'Editar Ítem del Inventario' : 'Añadir Nuevo Ítem'}
            </h3>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: 4 }}>Nombre del Ítem</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Zapatos de Seguridad, Retroexcavadora"
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #CBD5E1', borderRadius: 8, fontSize: 13 }}
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: 4 }}>Categoría</label>
                  <select
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #CBD5E1', borderRadius: 8, fontSize: 13 }}
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                  >
                    <option value="EPP">EPP</option>
                    <option value="Herramienta">Herramienta</option>
                    <option value="Maquinaria">Maquinaria</option>
                    <option value="Vehículo">Vehículo</option>
                    <option value="Material">Material</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: 4 }}>Unidad de Medida</label>
                  <input
                    type="text"
                    placeholder="unid., kg, par, etc."
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #CBD5E1', borderRadius: 8, fontSize: 13 }}
                    value={formData.unit_measure}
                    onChange={e => setFormData({ ...formData, unit_measure: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: 4 }}>Stock Inicial</label>
                  <input
                    type="number"
                    min="0"
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #CBD5E1', borderRadius: 8, fontSize: 13 }}
                    value={formData.stock_quantity}
                    onChange={e => setFormData({ ...formData, stock_quantity: parseFloat(e.target.value) || 0 })}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: 4 }}>Límite Stock Mínimo</label>
                  <input
                    type="number"
                    min="0"
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #CBD5E1', borderRadius: 8, fontSize: 13 }}
                    value={formData.minimum_stock}
                    onChange={e => setFormData({ ...formData, minimum_stock: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              {/* Si es Maquinaria o Vehículo, habilitar valor CapEx */}
              {(formData.category === 'Maquinaria' || formData.category === 'Vehículo') ? (
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: 4 }}>Valor de Adquisición (CapEx)</label>
                  <input
                    type="number"
                    placeholder="Monto de compra total en CLP"
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #CBD5E1', borderRadius: 8, fontSize: 13 }}
                    value={formData.acquisition_value}
                    onChange={e => setFormData({ ...formData, acquisition_value: parseFloat(e.target.value) || 0 })}
                  />
                  <p style={{ fontSize: 10, color: '#64748B', marginTop: 4 }}>Este valor se registrará como activo fijo, no como gasto mensual.</p>
                </div>
              ) : (
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: 4 }}>Precio Unitario Estimado</label>
                  <input
                    type="number"
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #CBD5E1', borderRadius: 8, fontSize: 13 }}
                    value={formData.unit_price}
                    onChange={e => setFormData({ ...formData, unit_price: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 0' }}>
                <input
                  type="checkbox"
                  id="is_returnable"
                  checked={formData.is_returnable}
                  onChange={e => setFormData({ ...formData, is_returnable: e.target.checked })}
                  style={{ width: 16, height: 16, cursor: 'pointer' }}
                />
                <label htmlFor="is_returnable" style={{ fontSize: 12, fontWeight: 600, color: '#334155', cursor: 'pointer' }}>
                  El ítem es retornable (ej. arneses, cascos, taladros)
                </label>
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
                  Guardar Cambios <ArrowRight style={{ width: 15, height: 15 }} />
                </PrimaryButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageWrapper>
  )
}
