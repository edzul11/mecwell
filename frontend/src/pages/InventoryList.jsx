import { apiFetch } from '../supabaseClient'
import { useState, useEffect } from 'react'
import { Plus, ExternalLink, Package } from 'lucide-react'
import { PageWrapper, PageHeader, PrimaryButton, MwTable, MwTr, MwTd, StatusBadge } from '../components/MecwellUI'

export default function InventoryList() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiFetch('http://127.0.0.1:8000/api/v1/inventory/items')
      .then(r => r.json())
      .then(data => { setItems(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(err => { console.error(err); setLoading(false) })
  }, [])

  const totalStock = items.reduce((acc, i) => acc + (i.stock_quantity || 0), 0)

  return (
    <PageWrapper>
      <PageHeader
        title="Inventario"
        subtitle={`${items.length} ítems · ${totalStock} unidades en bodega`}
        action={
          <PrimaryButton>
            <Plus style={{ width: 15, height: 15 }} /> Añadir Ítem
          </PrimaryButton>
        }
      />

      <MwTable
        loading={loading}
        headers={['Ítem', 'Categoría', 'Stock', 'Unidad', 'Tipo', { label: 'Acciones', right: true }]}
      >
        {items.length === 0 ? (
          <tr>
            <td colSpan={6} style={{ padding: '48px 20px', textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>
              No hay ítems en el inventario.
            </td>
          </tr>
        ) : items.map(item => (
          <MwTr key={item.id}>
            <MwTd>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8,
                  backgroundColor: item.is_returnable ? '#DBEAFE' : '#F0FDF4',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <Package style={{ width: 15, height: 15, color: item.is_returnable ? '#1E4D8C' : '#059669' }} />
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#1A1C20' }}>{item.name}</span>
              </div>
            </MwTd>
            <MwTd muted>{item.category || '—'}</MwTd>
            <MwTd>
              <span style={{
                fontSize: 15, fontWeight: 700,
                color: (item.stock_quantity || 0) === 0 ? '#DC2626' : '#1E4D8C',
              }}>
                {item.stock_quantity ?? 0}
              </span>
            </MwTd>
            <MwTd muted>{item.unit_measure || 'unid.'}</MwTd>
            <MwTd>
              <StatusBadge status={item.is_returnable ? 'retornable' : 'consumible'} />
            </MwTd>
            <MwTd right>
              <button style={{
                padding: '5px 12px', borderRadius: 6,
                border: '1px solid #E2E8F0',
                backgroundColor: '#fff', fontSize: 12, fontWeight: 600,
                color: '#64748B', cursor: 'pointer',
              }}>
                Editar
              </button>
            </MwTd>
          </MwTr>
        ))}
      </MwTable>
    </PageWrapper>
  )
}
