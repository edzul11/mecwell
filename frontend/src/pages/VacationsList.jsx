import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiFetch } from '../supabaseClient'
import { MwPage, MwCard, MwTable, MwButton, MwTr, MwTd, StatusBadge } from '../components/MecwellUI'
import { TreePalm, Plus, Calendar } from 'lucide-react'

export default function VacationsList() {
  const navigate = useNavigate()
  const [workers, setWorkers] = useState([])
  const [balances, setBalances] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const wRes = await apiFetch('http://127.0.0.1:8000/api/v1/workers/')
      const wData = await wRes.json()
      const activeWorkers = Array.isArray(wData) ? wData.filter(w => {
        const s = (w.status || '').toLowerCase()
        return s === 'active' || s === 'activo'
      }) : []
      setWorkers(activeWorkers)

      // Fetch balances for each active worker
      const balanceMap = {}
      await Promise.all(activeWorkers.map(async (w) => {
        try {
          const bRes = await apiFetch(`http://127.0.0.1:8000/api/v1/vacaciones/saldo/${w.id}`)
          const bData = await bRes.json()
          balanceMap[w.id] = bData
        } catch (e) {
          console.error(`Error fetching balance for ${w.id}`, e)
        }
      }))
      setBalances(balanceMap)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <MwPage title="Gestión de Vacaciones" icon={TreePalm}>
      <div className="flex justify-between items-center mb-6">
        <div>
          <p className="text-gray-600">Control de días tomados y saldos acumulados por trabajador.</p>
          <p className="text-xs text-gray-400 mt-1 italic">* Cálculos basados en 1.25 días acumulados por mes trabajado.</p>
        </div>
        <MwButton variant="primary" icon={Plus} onClick={() => navigate('/vacations/new')}>Registrar Vacaciones</MwButton>
      </div>

      <MwCard>
        <MwTable
          loading={loading}
          headers={['Trabajador', 'Fecha Ingreso', 'Días Acumulados', 'Días Tomados', 'Saldo Actual', { label: 'Estado', right: true }]}
        >
          {workers.map(w => {
            const b = balances[w.id]
            return (
              <MwTr key={w.id}>
                <MwTd bold>{w.first_name} {w.last_name}</MwTd>
                <MwTd muted>{w.entry_date || 'No registrada'}</MwTd>
                <MwTd>{b ? b.total_acumulado.toFixed(1) : '-'}</MwTd>
                <MwTd>{b ? b.total_tomadas : '-'}</MwTd>
                <MwTd>
                  <span className={`font-bold ${b?.saldo_actual < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                    {b ? b.saldo_actual.toFixed(1) : '-'}
                  </span>
                </MwTd>
                <MwTd right>
                  <StatusBadge status={b?.saldo_actual > 0 ? 'vigente' : 'vencido'} />
                </MwTd>
              </MwTr>
            )
          })}
          {workers.length === 0 && !loading && (
            <tr>
              <td colSpan={6} className="p-8 text-center text-gray-400">No hay trabajadores activos registrados.</td>
            </tr>
          )}
        </MwTable>
      </MwCard>
    </MwPage>
  )
}
