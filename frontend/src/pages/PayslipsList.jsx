import { apiFetch } from '../supabaseClient'
import { useState, useEffect } from 'react'
import { FileText, Calculator, Download, AlertCircle, Users } from 'lucide-react'

const STEEL = '#1E4D8C'

function InputRow({ label, name, value, onChange }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #F8FAFC' }}>
      <label style={{ fontSize: 13, color: '#374151' }}>{label}</label>
      <input
        type="number" name={name} value={value} onChange={onChange}
        style={{
          width: 120, padding: '6px 10px', textAlign: 'right',
          border: '1px solid #E2E8F0', borderRadius: 6, fontSize: 13, color: '#1A1C20',
          outline: 'none',
        }}
        onFocus={e => e.target.style.borderColor = STEEL}
        onBlur={e => e.target.style.borderColor = '#E2E8F0'}
      />
    </div>
  )
}

function FormSection({ title, children }) {
  return (
    <div style={{ backgroundColor: '#fff', borderRadius: 10, padding: '18px 20px', boxShadow: '0 1px 3px rgba(30,77,140,0.06)' }}>
      <h3 style={{ fontSize: 12, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>{title}</h3>
      {children}
    </div>
  )
}

export default function PayslipsList() {
  const [workers, setWorkers]                 = useState([])
  const [loading, setLoading]                 = useState(true)
  const [selectedWorkerIds, setSelectedWorkerIds] = useState([])
  const [formData, setFormData] = useState({
    period_month: new Date().getMonth() + 1,
    period_year: new Date().getFullYear(),
    days_worked: 30,
    gratification: 0,
    bono_responsabilidad: 0,
    horas_extras_amount: 0,
    colacion: 100000,
    movilizacion: 100000,
    viatico: 50000,
    anticipo: 0,
  })

  useEffect(() => {
    apiFetch('http://127.0.0.1:8000/api/v1/workers/')
      .then(r => r.json())
      .then(data => { setWorkers(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const toggleWorker = (id, e) => {
    e.stopPropagation()
    setSelectedWorkerIds(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id])
  }
  const toggleAll = () => setSelectedWorkerIds(selectedWorkerIds.length === workers.length && workers.length > 0 ? [] : workers.map(w => w.id))
  const handleInput = e => setFormData(p => ({ ...p, [e.target.name]: Number(e.target.value) }))

  const handleGeneratePDF = async () => {
    if (!selectedWorkerIds.length) return
    try {
      if (selectedWorkerIds.length === 1) {
        const w = workers.find(x => x.id === selectedWorkerIds[0])
        const res = await apiFetch(`http://127.0.0.1:8000/api/v1/payslips/generate/${w.id}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) })
        if (!res.ok) throw new Error()
        const url = URL.createObjectURL(await res.blob())
        Object.assign(document.createElement('a'), { href: url, download: `liquidacion_${w.rut}_${formData.period_month}_${formData.period_year}.pdf` }).click()
      } else {
        const res = await apiFetch(`http://127.0.0.1:8000/api/v1/payslips/generate_bulk`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ worker_ids: selectedWorkerIds, payload: formData }) })
        if (!res.ok) throw new Error()
        const url = URL.createObjectURL(await res.blob())
        Object.assign(document.createElement('a'), { href: url, download: `liquidaciones_${formData.period_month}_${formData.period_year}.zip` }).click()
      }
    } catch { alert('Error al generar la liquidación.') }
  }

  const activeWorker = selectedWorkerIds.length === 1 ? workers.find(w => w.id === selectedWorkerIds[0]) : null
  const isBulk       = selectedWorkerIds.length > 1

  // Live preview calc
  const propBase   = activeWorker ? (activeWorker.base_salary / 30) * formData.days_worked : 0
  const totImp     = propBase + formData.gratification + formData.bono_responsabilidad + formData.horas_extras_amount
  const totDisc    = totImp * (0.1144 + 0.07 + 0.006)
  const totNoImp   = formData.colacion + formData.movilizacion + formData.viatico
  const alcance    = (totImp + totNoImp) - totDisc
  const liqPagar   = alcance - formData.anticipo

  const fmt = n => `$${Math.round(n).toLocaleString('es-CL')}`

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 0px)', overflow: 'hidden', backgroundColor: '#F4F6F9' }}>

      {/* LEFT — worker list */}
      <div style={{ width: 280, flexShrink: 0, backgroundColor: '#fff', borderRight: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid #F1F5F9' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <FileText style={{ width: 16, height: 16, color: STEEL }} />
              <h1 style={{ fontSize: 15, fontWeight: 700, color: '#1A1C20' }}>Remuneraciones</h1>
            </div>
            <button onClick={toggleAll} style={{
              fontSize: 11, fontWeight: 600, color: STEEL,
              backgroundColor: '#EFF6FF', border: 'none', borderRadius: 6,
              padding: '4px 8px', cursor: 'pointer',
            }}>Todos</button>
          </div>
          <p style={{ fontSize: 12, color: '#94A3B8' }}>Selecciona uno o más trabajadores.</p>
        </div>

        <div style={{ overflowY: 'auto', flex: 1, padding: '10px 12px' }}>
          {loading ? (
            <p style={{ textAlign: 'center', color: '#94A3B8', fontSize: 13, padding: 20 }}>Cargando...</p>
          ) : workers.map(w => {
            const selected = selectedWorkerIds.includes(w.id)
            return (
              <div key={w.id} onClick={() => setSelectedWorkerIds([w.id])}
                style={{
                  padding: '12px 14px', borderRadius: 10, marginBottom: 6, cursor: 'pointer',
                  border: `1px solid ${selected ? STEEL : '#E2E8F0'}`,
                  backgroundColor: selected ? '#EFF6FF' : '#fff',
                  transition: 'all 0.1s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <input type="checkbox" checked={selected} onChange={e => toggleWorker(w.id, e)} onClick={e => e.stopPropagation()}
                    style={{ marginTop: 3, accentColor: STEEL }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#1A1C20', marginBottom: 2 }}>{w.first_name} {w.last_name}</p>
                    <p style={{ fontSize: 11, color: '#94A3B8' }}>{w.position}</p>
                    <span style={{ display: 'inline-block', marginTop: 5, fontSize: 11, fontWeight: 600, color: '#059669', backgroundColor: '#D1FAE5', padding: '2px 8px', borderRadius: 99 }}>
                      ${w.base_salary?.toLocaleString('es-CL')}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* RIGHT — calculator */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 28 }}>
        {!selectedWorkerIds.length ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94A3B8' }}>
            <Calculator style={{ width: 48, height: 48, color: '#E2E8F0', marginBottom: 16 }} />
            <p style={{ fontSize: 15, fontWeight: 600, color: '#64748B', marginBottom: 6 }}>Calculadora inactiva</p>
            <p style={{ fontSize: 13 }}>Selecciona un trabajador del panel izquierdo.</p>
          </div>
        ) : (
          <div style={{ maxWidth: 800, margin: '0 auto' }}>

            {/* Worker header */}
            <div style={{ backgroundColor: '#fff', borderRadius: 12, padding: '18px 24px', boxShadow: '0 1px 3px rgba(30,77,140,0.06)', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                {isBulk ? (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <Users style={{ width: 16, height: 16, color: STEEL }} />
                      <h2 style={{ fontSize: 17, fontWeight: 700, color: '#1A1C20' }}>Generación Masiva</h2>
                    </div>
                    <p style={{ fontSize: 13, color: '#64748B' }}>{selectedWorkerIds.length} trabajadores seleccionados — se generará un ZIP</p>
                  </>
                ) : (
                  <>
                    <h2 style={{ fontSize: 17, fontWeight: 700, color: '#1A1C20', marginBottom: 4 }}>
                      {activeWorker.first_name} {activeWorker.last_name}
                    </h2>
                    <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#64748B' }}>
                      <span>RUT: {activeWorker.rut}</span>
                      <span>AFP: {activeWorker.pension_fund}</span>
                      <span>Salud: {activeWorker.health_institution}</span>
                    </div>
                  </>
                )}
              </div>
              <button onClick={handleGeneratePDF} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '9px 20px', borderRadius: 8, border: 'none',
                backgroundColor: STEEL, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}>
                <Download style={{ width: 15, height: 15 }} />
                {isBulk ? 'Generar ZIP' : 'Generar PDF'}
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {/* Form inputs */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <FormSection title="Período">
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                    {[['Mes (1-12)', 'period_month'], ['Año', 'period_year'], ['Días Trab.', 'days_worked']].map(([label, name]) => (
                      <div key={name}>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#64748B', marginBottom: 4 }}>{label}</label>
                        <input type="number" name={name} value={formData[name]} onChange={handleInput}
                          style={{ width: '100%', padding: '6px 8px', border: '1px solid #E2E8F0', borderRadius: 6, fontSize: 13 }}
                          onFocus={e => e.target.style.borderColor = STEEL}
                          onBlur={e => e.target.style.borderColor = '#E2E8F0'}
                        />
                      </div>
                    ))}
                  </div>
                </FormSection>
                <FormSection title="Bonos Imponibles ($)">
                  <InputRow label="Gratificación" name="gratification" value={formData.gratification} onChange={handleInput} />
                  <InputRow label="Bono Responsabilidad" name="bono_responsabilidad" value={formData.bono_responsabilidad} onChange={handleInput} />
                  <InputRow label="Horas Extras" name="horas_extras_amount" value={formData.horas_extras_amount} onChange={handleInput} />
                </FormSection>
                <FormSection title="Asignaciones No Imponibles ($)">
                  <InputRow label="Colación" name="colacion" value={formData.colacion} onChange={handleInput} />
                  <InputRow label="Movilización" name="movilizacion" value={formData.movilizacion} onChange={handleInput} />
                  <InputRow label="Viático" name="viatico" value={formData.viatico} onChange={handleInput} />
                </FormSection>
                <FormSection title="Descuentos Adicionales ($)">
                  <InputRow label="Anticipo" name="anticipo" value={formData.anticipo} onChange={handleInput} />
                </FormSection>
              </div>

              {/* Live preview */}
              <div style={{ position: 'sticky', top: 0 }}>
                {isBulk ? (
                  <div style={{ backgroundColor: STEEL, borderRadius: 12, padding: '24px', color: '#fff' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                      <AlertCircle style={{ width: 18, height: 18, color: '#93C5FD' }} />
                      <h3 style={{ fontSize: 15, fontWeight: 700 }}>Modo Masivo</h3>
                    </div>
                    <p style={{ fontSize: 13, color: '#BFDBFE', lineHeight: 1.6, marginBottom: 12 }}>
                      Se generarán {selectedWorkerIds.length} liquidaciones individuales empaquetadas en un archivo ZIP.
                    </p>
                    <div style={{ backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 8, padding: '12px 14px', fontSize: 12, color: '#DBEAFE' }}>
                      Los días, bonos y descuentos se aplican igual a todos. El sueldo base y AFP de cada trabajador se respetan.
                    </div>
                  </div>
                ) : (
                  <div style={{ backgroundColor: '#0F172A', borderRadius: 12, padding: '24px', color: '#fff' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                      <Calculator style={{ width: 18, height: 18, color: '#60A5FA' }} />
                      <h3 style={{ fontSize: 15, fontWeight: 700 }}>Resumen en Vivo</h3>
                    </div>
                    {[
                      { label: 'Sueldo Base (Prop.)',   val: fmt(propBase),               color: '#CBD5E1' },
                      { label: 'Total Imponible',       val: fmt(totImp),                 color: '#fff',    bold: true, border: true },
                      { label: 'Descuentos (Aprox.)',   val: `- ${fmt(totDisc)}`,         color: '#FCA5A5' },
                      { label: 'Total No Imponibles',   val: `+ ${fmt(totNoImp)}`,        color: '#6EE7B7', border: true },
                      { label: 'Alcance Líquido',       val: fmt(alcance),                color: '#CBD5E1' },
                      { label: 'Anticipo',              val: `- ${fmt(formData.anticipo)}`, color: '#FCD34D', border: true },
                    ].map(row => (
                      <div key={row.label} style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '8px 0',
                        borderBottom: row.border ? '1px solid rgba(255,255,255,0.1)' : 'none',
                        marginBottom: row.border ? 6 : 0,
                      }}>
                        <span style={{ fontSize: 13, color: '#94A3B8' }}>{row.label}</span>
                        <span style={{ fontSize: 13, fontWeight: row.bold ? 700 : 500, color: row.color }}>{row.val}</span>
                      </div>
                    ))}
                    <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.15)' }}>
                      <p style={{ fontSize: 10, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Líquido a Pagar</p>
                      <p style={{ fontSize: 32, fontWeight: 800, color: '#fff', lineHeight: 1 }}>{fmt(liqPagar)}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
