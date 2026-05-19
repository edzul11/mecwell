import { apiFetch } from '../supabaseClient'
import { useState, useEffect } from 'react'
import { Plus, ExternalLink, TrendingUp } from 'lucide-react'
import { PageWrapper, PageHeader, PrimaryButton, MwTable, MwTr, MwTd, Card } from '../components/MecwellUI'

export default function ExpensesList() {
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiFetch('http://127.0.0.1:8000/api/v1/expenses/')
      .then(r => r.json())
      .then(data => { setExpenses(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(err => { console.error(err); setLoading(false) })
  }, [])

  const totalAmount = expenses.reduce((acc, e) => acc + (parseFloat(e.amount) || 0), 0)

  return (
    <PageWrapper>
      <PageHeader
        title="Gastos de Empresa"
        subtitle="Registro de gastos por compra de materiales y EPP"
        action={
          <PrimaryButton>
            <Plus style={{ width: 15, height: 15 }} /> Registrar Gasto
          </PrimaryButton>
        }
      />

      {/* Summary card */}
      <div style={{ marginBottom: 20 }}>
        <Card style={{ display: 'inline-flex', alignItems: 'center', gap: 16, padding: '16px 24px', borderTop: '4px solid #1E4D8C' }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            backgroundColor: '#EFF6FF',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <TrendingUp style={{ width: 20, height: 20, color: '#1E4D8C' }} />
          </div>
          <div>
            <p style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>
              Total Gastos
            </p>
            <p style={{ fontSize: 22, fontWeight: 700, color: '#1E4D8C' }}>
              ${totalAmount.toLocaleString('es-CL')}
            </p>
          </div>
        </Card>
      </div>

      <MwTable
        loading={loading}
        headers={['Fecha', 'Descripción', 'Obra / Faena', 'Monto', { label: 'Comprobante', right: true }]}
      >
        {expenses.length === 0 ? (
          <tr>
            <td colSpan={5} style={{ padding: '48px 20px', textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>
              No hay gastos registrados.
            </td>
          </tr>
        ) : expenses.map(exp => (
          <MwTr key={exp.id}>
            <MwTd muted>
              {exp.expense_date
                ? new Date(exp.expense_date).toLocaleDateString('es-CL')
                : '—'}
            </MwTd>
            <MwTd bold>{exp.description}</MwTd>
            <MwTd>
              <span style={{
                padding: '3px 10px', borderRadius: 99,
                fontSize: 11, fontWeight: 600,
                backgroundColor: '#EFF6FF', color: '#1E4D8C',
              }}>
                {exp.sites?.name || 'General'}
              </span>
            </MwTd>
            <MwTd>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#1A1C20' }}>
                ${parseFloat(exp.amount || 0).toLocaleString('es-CL')}
              </span>
            </MwTd>
            <MwTd right>
              {exp.receipt_url ? (
                <a href={exp.receipt_url} target="_blank" rel="noopener noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, color: '#1E4D8C', textDecoration: 'none' }}
                >
                  <ExternalLink style={{ width: 13, height: 13 }} /> Ver
                </a>
              ) : (
                <span style={{ fontSize: 12, color: '#CBD5E1' }}>Sin comprobante</span>
              )}
            </MwTd>
          </MwTr>
        ))}
      </MwTable>
    </PageWrapper>
  )
}
