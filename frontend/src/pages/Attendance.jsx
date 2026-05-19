import { useState, useEffect } from 'react'
import { apiFetch } from '../supabaseClient'
import { useFaena } from '../context/FaenaContext'
import { PageWrapper, PageHeader, PrimaryButton, MwTable, MwTr, MwTd } from '../components/MecwellUI'
import { Calendar as CalendarIcon, CheckCircle2, Save, HardHat } from 'lucide-react'

export default function Attendance() {
  const { faenas } = useFaena()
  const [localFaenaId, setLocalFaenaId] = useState(null)
  
  const activeFaena = faenas.find(f => f.id === localFaenaId)
  
  // Default to today (YYYY-MM-DD)
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [workers, setWorkers] = useState([])
  const [attendance, setAttendance] = useState({}) // { [workerId]: { status, overtime_hours } }
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  // Auto-select first faena if none selected and faenas exist
  useEffect(() => {
    if (!localFaenaId && faenas.length > 0) {
      setLocalFaenaId(faenas[0].id)
    }
  }, [faenas, localFaenaId])

  // Fetch workers when faena changes
  useEffect(() => {
    if (!localFaenaId) {
      setWorkers([])
      return
    }
    setLoading(true)
    apiFetch('http://127.0.0.1:8000/api/v1/workers/')
      .then(r => r.json())
      .then(data => {
        const siteWorkers = (Array.isArray(data) ? data : []).filter(w => {
          const s = (w.status || '').toLowerCase()
          return w.site_id === localFaenaId && (s === 'active' || s === 'activo')
        })
        setWorkers(siteWorkers)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [localFaenaId])

  // Fetch attendance when faena or date changes
  useEffect(() => {
    if (!localFaenaId || !date || workers.length === 0) return
    
    setLoading(true)
    Promise.all([
      apiFetch(`http://127.0.0.1:8000/api/v1/attendance/${localFaenaId}/${date}`).then(r => r.json()),
      apiFetch(`http://127.0.0.1:8000/api/v1/vacaciones/`).then(r => r.json())
    ])
      .then(([attendanceData, vacationData]) => {
        const attMap = {}
        const vacationsList = Array.isArray(vacationData) ? vacationData : []

        // 1. Initialize with vacations if active on this day, else empty status
        workers.forEach(w => {
          const hasVacation = vacationsList.find(v => 
            v.worker_id === w.id && 
            v.estado === 'aprobado' && 
            v.fecha_inicio <= date && 
            date <= v.fecha_fin
          )
          
          attMap[w.id] = { 
            status: hasVacation ? 'Vacaciones' : '', 
            overtime_hours: 0,
            isOnVacation: !!hasVacation,
            vacationDetails: hasVacation
          }
        })
        
        // 2. Rellenar con datos de la base de datos si existen
        if (Array.isArray(attendanceData)) {
          attendanceData.forEach(record => {
            if (attMap[record.worker_id]) {
               attMap[record.worker_id] = {
                 status: record.status || attMap[record.worker_id].status,
                 overtime_hours: record.overtime_hours || 0,
                 isOnVacation: attMap[record.worker_id].isOnVacation,
                 vacationDetails: attMap[record.worker_id].vacationDetails
               }
            }
          })
        }
        setAttendance(attMap)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [localFaenaId, date, workers.length])

  const handleStatusChange = (workerId, newStatus) => {
    setAttendance(prev => ({
      ...prev,
      [workerId]: { ...prev[workerId], status: newStatus }
    }))
  }

  const handleOvertimeChange = (workerId, hours) => {
    setAttendance(prev => ({
      ...prev,
      [workerId]: { ...prev[workerId], overtime_hours: hours }
    }))
  }

  const handleMarkAllPresent = () => {
    const newAtt = { ...attendance }
    workers.forEach(w => {
      // Don't overwrite if the worker has an active vacation
      if (!newAtt[w.id]?.isOnVacation) {
        newAtt[w.id] = { ...newAtt[w.id], status: 'Presente' }
      }
    })
    setAttendance(newAtt)
  }

  const handleSave = async () => {
    if (!localFaenaId) return
    setSaving(true)
    
    const records = workers.map(w => ({
      worker_id: w.id,
      site_id: localFaenaId,
      date: date,
      status: attendance[w.id]?.status || 'Presente', // Default if empty
      overtime_hours: parseFloat(attendance[w.id]?.overtime_hours) || 0
    }))

    try {
      const res = await apiFetch('http://127.0.0.1:8000/api/v1/attendance/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ records })
      })
      if (!res.ok) throw new Error('Error saving attendance')
      alert('Asistencia guardada correctamente.')
    } catch (err) {
      console.error(err)
      alert('Hubo un error al guardar.')
    } finally {
      setSaving(false)
    }
  }

  const statuses = ['Presente', 'Ausente', 'Licencia', 'Vacaciones', 'Permiso']

  return (
    <PageWrapper>
      <PageHeader 
        title="Asistencia y Horas Extras"
        subtitle="Control diario de personal en faena"
        action={
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, backgroundColor: '#fff', border: '1px solid #E2E8F0', padding: '6px 12px', borderRadius: 8 }}>
              <CalendarIcon style={{ width: 16, height: 16, color: '#64748B' }} />
              <input 
                type="date" 
                value={date} 
                onChange={(e) => setDate(e.target.value)}
                style={{ border: 'none', outline: 'none', fontSize: 13, fontWeight: 500, color: '#334155' }}
              />
            </div>
            <button
              onClick={handleMarkAllPresent}
              disabled={!localFaenaId || workers.length === 0}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '9px 15px', borderRadius: 8, border: '1px solid #E2E8F0',
                backgroundColor: (!localFaenaId || workers.length === 0) ? '#F1F5F9' : '#fff', 
                fontSize: 13, fontWeight: 600, color: '#334155', 
                cursor: (!localFaenaId || workers.length === 0) ? 'not-allowed' : 'pointer'
              }}
            >
              <CheckCircle2 style={{ width: 16, height: 16, color: (!localFaenaId || workers.length === 0) ? '#94A3B8' : '#059669' }} /> 
              Marcar Todos Presentes
            </button>
            <PrimaryButton onClick={handleSave} disabled={saving || !localFaenaId || workers.length === 0}>
              <Save style={{ width: 16, height: 16 }} />
              {saving ? 'Guardando...' : 'Guardar Asistencia'}
            </PrimaryButton>
          </div>
        }
      />

      {/* Faena Selector (Icon Grid) */}
      <div style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 13, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
          Seleccionar Faena
        </h3>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {faenas.map(f => {
            const isActive = localFaenaId === f.id
            return (
              <button
                key={f.id}
                onClick={() => setLocalFaenaId(f.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 16px', borderRadius: 12,
                  backgroundColor: isActive ? '#1E4D8C' : '#fff',
                  border: `1px solid ${isActive ? '#1E4D8C' : '#E2E8F0'}`,
                  boxShadow: isActive ? '0 4px 12px rgba(30,77,140,0.2)' : '0 1px 2px rgba(0,0,0,0.05)',
                  cursor: 'pointer', transition: 'all 0.2s',
                  minWidth: 180
                }}
              >
                <div style={{ 
                  backgroundColor: isActive ? 'rgba(255,255,255,0.2)' : '#F1F5F9', 
                  padding: 8, borderRadius: 8 
                }}>
                  <HardHat style={{ width: 20, height: 20, color: isActive ? '#fff' : '#64748B' }} />
                </div>
                <div style={{ textAlign: 'left' }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: isActive ? '#fff' : '#1E293B', marginBottom: 2 }}>{f.name}</p>
                  {f.location && <p style={{ fontSize: 11, color: isActive ? 'rgba(255,255,255,0.8)' : '#94A3B8' }}>{f.location}</p>}
                </div>
              </button>
            )
          })}
          {faenas.length === 0 && (
            <p style={{ fontSize: 13, color: '#94A3B8' }}>No hay faenas registradas en el sistema.</p>
          )}
        </div>
      </div>

      <MwTable 
        loading={loading}
        headers={['Trabajador', 'RUT', 'Estado', 'Horas Extras', '']}
      >
        {workers.length === 0 ? (
          <tr>
             <td colSpan={5} style={{ padding: '48px 20px', textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>
                No hay trabajadores activos registrados en esta faena.
             </td>
          </tr>
        ) : workers.map(w => {
          const record = attendance[w.id] || { status: '', overtime_hours: 0 }
          
          return (
            <MwTr key={w.id}>
              <MwTd>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#1A1C20', display: 'flex', alignItems: 'center', gap: 6 }}>
                  {w.first_name} {w.last_name}
                  {record.isOnVacation && (
                    <span style={{ 
                      fontSize: 10, 
                      fontWeight: 700, 
                      color: '#047857', 
                      backgroundColor: '#D1FAE5', 
                      padding: '2px 6px', 
                      borderRadius: 4,
                      whiteSpace: 'nowrap'
                    }}>
                      En Vacaciones
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 12, color: '#94A3B8' }}>{w.position}</div>
              </MwTd>
              <MwTd muted>{w.rut}</MwTd>
              <MwTd>
                <select
                  value={record.status}
                  onChange={(e) => handleStatusChange(w.id, e.target.value)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 6,
                    border: '1px solid #E2E8F0',
                    fontSize: 13,
                    color: record.status === 'Ausente' ? '#DC2626' : '#334155',
                    backgroundColor: record.status === 'Ausente' ? '#FEF2F2' : '#fff',
                    outline: 'none',
                    fontWeight: 500
                  }}
                >
                  <option value="" disabled>Seleccionar estado...</option>
                  {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </MwTd>
              <MwTd>
                <input 
                  type="number" 
                  min="0" 
                  step="0.5"
                  value={record.overtime_hours || ''}
                  onChange={(e) => handleOvertimeChange(w.id, e.target.value)}
                  placeholder="0"
                  style={{
                    width: 70,
                    padding: '6px 10px',
                    borderRadius: 6,
                    border: '1px solid #E2E8F0',
                    fontSize: 13,
                    textAlign: 'center',
                    outline: 'none'
                  }}
                />
              </MwTd>
              <MwTd right>
                 {/* Visual indicator if saved vs not saved? */}
              </MwTd>
            </MwTr>
          )
        })}
      </MwTable>
    </PageWrapper>
  )
}
