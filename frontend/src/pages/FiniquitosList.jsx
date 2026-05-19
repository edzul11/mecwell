import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiFetch } from '../supabaseClient'
import { MwPage, MwCard, MwTable, MwButton, MwTr, MwTd, StatusBadge } from '../components/MecwellUI'
import { FileX, Plus, Download, Eye } from 'lucide-react'

export default function FiniquitosList() {
  const navigate = useNavigate()
  const [finiquitos, setFiniquitos] = useState([])
  const [workers, setWorkers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const fRes = await apiFetch('http://127.0.0.1:8000/api/v1/finiquitos/')
      const fData = await fRes.json()
      setFiniquitos(Array.isArray(fData) ? fData : [])

      const wRes = await apiFetch('http://127.0.0.1:8000/api/v1/workers/')
      const wData = await wRes.json()
      setWorkers(Array.isArray(wData) ? wData : [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const getWorkerName = (id) => {
    const w = workers.find(x => x.id === id)
    return w ? `${w.first_name} ${w.last_name}` : 'Cargando...'
  }

  return (
    <MwPage title="Gestión de Finiquitos" icon={FileX}>
      <div className="flex justify-between items-center mb-6">
        <p className="text-gray-600">Procesos de término de contrato y cálculos legales.</p>
        <MwButton variant="primary" icon={Plus} onClick={() => navigate('/finiquitos/new')}>Nuevo Finiquito</MwButton>
      </div>

      <MwCard>
        <MwTable
          loading={loading}
          headers={['Trabajador', 'Fecha Término', 'Causal', 'Monto Neto', 'Estado', { label: 'Acciones', right: true }]}
        >
          {finiquitos.map(f => (
            <MwTr key={f.id}>
              <MwTd bold>{getWorkerName(f.worker_id)}</MwTd>
              <MwTd muted>{f.fecha_ultimo_dia}</MwTd>
              <MwTd>{f.causal_articulo}</MwTd>
              <MwTd bold className="text-emerald-700">${f.monto_neto.toLocaleString()}</MwTd>
              <MwTd><StatusBadge status={f.estado} /></MwTd>
              <MwTd right>
                <div className="flex justify-end gap-2">
                  <button className="p-1 hover:bg-gray-100 rounded" title="Ver Detalle"><Eye className="w-4 h-4 text-gray-500" /></button>
                  <button className="p-1 hover:bg-indigo-50 rounded" title="Descargar PDF"><Download className="w-4 h-4 text-indigo-600" /></button>
                </div>
              </MwTd>
            </MwTr>
          ))}
          {finiquitos.length === 0 && !loading && (
            <tr>
              <td colSpan={6} className="p-8 text-center text-gray-400">No hay procesos de finiquito registrados.</td>
            </tr>
          )}
        </MwTable>
      </MwCard>
    </MwPage>
  )
}
