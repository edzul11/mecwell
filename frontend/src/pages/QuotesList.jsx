import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiFetch } from '../supabaseClient'
import { MwPage, MwCard, MwTable, MwTr, MwTd, MwButton } from '../components/MecwellUI'
import { FileSpreadsheet, Plus, Download, Edit, Copy, Trash2, Search, Filter } from 'lucide-react'

// Custom status badge mapper for Quotes
function QuoteStatusBadge({ status }) {
  const map = {
    borrador:   { bg: '#E2E8F0', text: '#475569', label: 'Borrador' },
    enviada:    { bg: '#DBEAFE', text: '#1E40AF', label: 'Enviada' },
    aprobada:   { bg: '#D1FAE5', text: '#065F46', label: 'Aprobada' },
    rechazada:  { bg: '#FEE2E2', text: '#991B1B', label: 'Rechazada' },
    vencida:    { bg: '#FEE2E2', text: '#991B1B', label: 'Vencida' },
    'por pagar': { bg: '#FEF3C7', text: '#92400E', label: 'Por Pagar' },
    pagada:     { bg: '#D1FAE5', text: '#065F46', label: 'Pagada' }
  }
  const key = (status || '').toLowerCase()
  const c = map[key] || { bg: '#E2E8F0', text: '#475569', label: status || '—' }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '3px 10px', borderRadius: 99,
      fontSize: 11, fontWeight: 700,
      backgroundColor: c.bg, color: c.text,
    }}>
      {c.label}
    </span>
  )
}

export default function QuotesList() {
  const navigate = useNavigate()
  const [quotes, setQuotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    fetchQuotes()
  }, [])

  const fetchQuotes = async () => {
    setLoading(true)
    try {
      const res = await apiFetch('http://127.0.0.1:8000/api/v1/quotes/')
      if (res.ok) {
        const data = await res.json()
        setQuotes(data)
      } else {
        console.error('Error fetching quotes')
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id, number) => {
    if (!window.confirm(`¿Estás seguro de que deseas eliminar la cotización ${number}?`)) {
      return
    }

    try {
      const res = await apiFetch(`http://127.0.0.1:8000/api/v1/quotes/${id}`, {
        method: 'DELETE'
      })
      if (res.ok) {
        setQuotes(quotes.filter(q => q.id !== id))
      } else {
        alert('Error al eliminar la cotización')
      }
    } catch (e) {
      console.error(e)
      alert('Error en el servidor al intentar eliminar')
    }
  }

  const handleDownloadPDF = async (id, number) => {
    try {
      const res = await apiFetch(`http://127.0.0.1:8000/api/v1/quotes/${id}/pdf`)
      if (res.ok) {
        const blob = await res.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `cotizacion_${number.replace(/\s+/g, '_')}.pdf`
        document.body.appendChild(a)
        a.click()
        a.remove()
      } else {
        alert('Error al descargar el PDF de la cotización')
      }
    } catch (e) {
      console.error(e)
      alert('Error en el servidor al descargar PDF')
    }
  }

  // Calculate Net Total of a quote
  const getQuoteTotal = (q) => {
    const labor = (q.labor_items || []).reduce((acc, x) => acc + (parseFloat(x.total) || 0), 0)
    const materials = (q.material_items || []).reduce((acc, x) => acc + (parseFloat(x.total) || 0), 0)
    const equipment = (q.equipment_items || []).reduce((acc, x) => acc + (parseFloat(x.total) || 0), 0)
    const other = (q.other_expense_items || []).reduce((acc, x) => acc + (parseFloat(x.total) || 0), 0)
    
    const costo_directo = labor + materials + equipment + other
    const overhead = costo_directo * (q.overhead_percent || 0.15)
    const utility = costo_directo * (q.utility_percent || 0.15)
    
    return costo_directo + overhead + utility
  }

  // Filter quotes based on search and status filter
  const filteredQuotes = quotes.filter(q => {
    const matchesSearch = 
      (q.quote_number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (q.client_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (q.service_name || '').toLowerCase().includes(searchTerm.toLowerCase())
      
    const matchesStatus = statusFilter === '' || q.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  return (
    <MwPage title="Cotizaciones de Servicios" icon={FileSpreadsheet}>
      <div className="flex justify-between items-center mb-6">
        <div>
          <p className="text-gray-600">Presupuestos y cotizaciones interactivas de servicios para clientes.</p>
        </div>
        <MwButton variant="primary" icon={Plus} onClick={() => navigate('/quotes/new')}>
          Nueva Cotización
        </MwButton>
      </div>

      {/* Filter and Search Panel */}
      <MwCard style={{ padding: '16px 20px', marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          
          {/* Search bar */}
          <div style={{ position: 'relative', flex: 1, minWidth: 260 }}>
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}>
              <Search size={16} />
            </span>
            <input
              type="text"
              placeholder="Buscar por número, cliente o servicio..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px 9px 36px',
                border: '1px solid #CBD5E1',
                borderRadius: 8,
                fontSize: 13,
                outline: 'none',
                transition: 'border-color 0.15s'
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--color-secondary)'}
              onBlur={(e) => e.target.style.borderColor = '#CBD5E1'}
            />
          </div>

          {/* Status filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: '#64748B', fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}>
              <Filter size={15} /> Estado:
            </span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                padding: '9px 12px',
                border: '1px solid #CBD5E1',
                borderRadius: 8,
                fontSize: 13,
                outline: 'none',
                backgroundColor: '#ffffff'
              }}
            >
              <option value="">Todos los estados</option>
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

      {/* Quotes Table */}
      <MwTable
        loading={loading}
        headers={['Nº Cotización', 'Cliente', 'Servicio', 'Fecha Emisión', 'Total Neto', 'Estado', { label: 'Acciones', right: true }]}
      >
        {filteredQuotes.map(q => {
          const total = getQuoteTotal(q)
          return (
            <MwTr key={q.id}>
              <MwTd bold>{q.quote_number}</MwTd>
              <MwTd>{q.client_name}</MwTd>
              <MwTd style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} muted>
                {q.service_name}
              </MwTd>
              <MwTd muted>{q.issue_date}</MwTd>
              <MwTd bold className="text-emerald-700">
                ${Math.round(total).toLocaleString('es-CL')}
              </MwTd>
              <MwTd>
                <QuoteStatusBadge status={q.status} />
              </MwTd>
              <MwTd right>
                <div style={{ display: 'inline-flex', gap: 6 }}>
                  
                  {/* Download PDF */}
                  <button
                    onClick={() => handleDownloadPDF(q.id, q.quote_number)}
                    title="Descargar PDF"
                    style={{
                      padding: 6,
                      backgroundColor: 'rgba(30, 77, 140, 0.05)',
                      border: 'none',
                      borderRadius: 6,
                      cursor: 'pointer',
                      color: 'var(--color-secondary)'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(30, 77, 140, 0.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(30, 77, 140, 0.05)'}
                  >
                    <Download size={15} />
                  </button>

                  {/* Edit */}
                  <button
                    onClick={() => navigate(`/quotes/edit/${q.id}`)}
                    title="Editar Cotización"
                    style={{
                      padding: 6,
                      backgroundColor: 'rgba(30, 77, 140, 0.05)',
                      border: 'none',
                      borderRadius: 6,
                      cursor: 'pointer',
                      color: 'var(--color-secondary)'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(30, 77, 140, 0.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(30, 77, 140, 0.05)'}
                  >
                    <Edit size={15} />
                  </button>

                  {/* Clone */}
                  <button
                    onClick={() => navigate(`/quotes/new?clone=${q.id}`)}
                    title="Duplicar / Clonar"
                    style={{
                      padding: 6,
                      backgroundColor: 'rgba(16, 185, 129, 0.05)',
                      border: 'none',
                      borderRadius: 6,
                      cursor: 'pointer',
                      color: '#10B981'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(16, 185, 129, 0.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(16, 185, 129, 0.05)'}
                  >
                    <Copy size={15} />
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => handleDelete(q.id, q.quote_number)}
                    title="Eliminar"
                    style={{
                      padding: 6,
                      backgroundColor: 'rgba(239, 68, 68, 0.05)',
                      border: 'none',
                      borderRadius: 6,
                      cursor: 'pointer',
                      color: '#EF4444'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.05)'}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </MwTd>
            </MwTr>
          )
        })}
        {filteredQuotes.length === 0 && !loading && (
          <tr>
            <td colSpan={7} style={{ padding: '40px 20px', textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>
              No se encontraron cotizaciones registradas.
            </td>
          </tr>
        )}
      </MwTable>
    </MwPage>
  )
}
