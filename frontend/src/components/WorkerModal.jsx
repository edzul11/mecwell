import { apiFetch } from '../supabaseClient'
import { useState, useEffect } from 'react'
import { X, HardHat } from 'lucide-react'

export default function WorkerModal({ isOpen, onClose, onSave }) {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    rut: '',
    email: '',
    position: '',
    base_salary: 0,
    health_institution: 'Fonasa',
    pension_fund: 'Modelo',
    shift: '',
    birth_date: '',
    entry_date: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    clothing_size: '',
    shoe_size: '',
    glove_size: '',
    bank_name: '',
    account_type: '',
    account_number: '',
    marital_status: '',
    site_id: '',
  })

  const [sites, setSites] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      apiFetch('http://127.0.0.1:8000/api/v1/sites/')
        .then(r => r.json())
        .then(data => setSites(Array.isArray(data) ? data : []))
        .catch(console.error)
    }
  }, [isOpen])

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'base_salary' ? Number(value) : value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const response = await apiFetch('http://127.0.0.1:8000/api/v1/workers/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      if (!response.ok) throw new Error('Error al crear trabajador')

      const newWorker = await response.json()
      onSave(newWorker)
      onClose()
      setFormData({
        first_name: '', last_name: '', rut: '', email: '',
        position: '', base_salary: 0, health_institution: 'Fonasa', pension_fund: 'Modelo',
        shift: '', birth_date: '', entry_date: '', emergency_contact_name: '', emergency_contact_phone: '',
        clothing_size: '', shoe_size: '', glove_size: '', bank_name: '', account_type: '', account_number: '',
        marital_status: '', site_id: '',
      })
    } catch (err) {
      alert("Hubo un error al guardar. Revisa que el RUT no esté duplicado.")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative z-50" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
      <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
        <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
          <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl sm:p-6">
            <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
              <button type="button" className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none" onClick={onClose}>
                <span className="sr-only">Cerrar</span>
                <X className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>
            
            <div className="sm:flex sm:items-start">
              <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                <h3 className="text-base font-semibold leading-6 text-gray-900" id="modal-title">
                  Añadir Nuevo Trabajador
                </h3>
                {/* Faena — required at top for visibility */}
                <div className="mt-4 p-3 rounded-lg" style={{ backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE' }}>
                  <label className="block text-sm font-semibold" style={{ color: '#1E4D8C', marginBottom: 6 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
                      Faena Asignada *
                    </span>
                  </label>
                  <select
                    required
                    name="site_id"
                    value={formData.site_id}
                    onChange={handleChange}
                    style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: '1px solid #BFDBFE', fontSize: 13, color: '#1A1C20', backgroundColor: '#fff' }}
                  >
                    <option value="">-- Seleccionar faena --</option>
                    {sites.map(s => (
                      <option key={s.id} value={s.id}>{s.name} {s.location ? `(${s.location})` : ''}</option>
                    ))}
                  </select>
                  {sites.length === 0 && (
                    <p style={{ fontSize: 11, color: '#DC2626', marginTop: 4 }}>⚠ No hay faenas creadas. Crea una faena primero.</p>
                  )}
                </div>
                <div className="mt-4">
                  <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                    
                    <div>
                      <label className="block text-sm font-medium leading-6 text-gray-900">Nombre</label>
                      <input required type="text" name="first_name" value={formData.first_name} onChange={handleChange} className="pl-2 mt-2 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6" />
                    </div>

                    <div>
                      <label className="block text-sm font-medium leading-6 text-gray-900">Apellido</label>
                      <input required type="text" name="last_name" value={formData.last_name} onChange={handleChange} className="pl-2 mt-2 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6" />
                    </div>

                    <div>
                      <label className="block text-sm font-medium leading-6 text-gray-900">RUT</label>
                      <input required type="text" name="rut" value={formData.rut} onChange={handleChange} placeholder="12.345.678-9" className="pl-2 mt-2 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6" />
                    </div>

                    <div>
                      <label className="block text-sm font-medium leading-6 text-gray-900">Email (Opcional)</label>
                      <input type="email" name="email" value={formData.email} onChange={handleChange} className="pl-2 mt-2 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6" />
                    </div>

                    <div>
                      <label className="block text-sm font-medium leading-6 text-gray-900">Cargo</label>
                      <input required type="text" name="position" value={formData.position} onChange={handleChange} className="pl-2 mt-2 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6" />
                    </div>

                    <div>
                      <label className="block text-sm font-medium leading-6 text-gray-900">Sueldo Base ($)</label>
                      <input required type="number" name="base_salary" value={formData.base_salary} onChange={handleChange} min="0" className="pl-2 mt-2 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6" />
                    </div>

                    <div>
                      <label className="block text-sm font-medium leading-6 text-gray-900">Previsión Salud</label>
                      <select name="health_institution" value={formData.health_institution} onChange={handleChange} className="pl-2 mt-2 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6">
                        <option value="Fonasa">Fonasa</option>
                        <option value="Colmena">Isapre Colmena</option>
                        <option value="Cruz Blanca">Isapre Cruz Blanca</option>
                        <option value="Consalud">Isapre Consalud</option>
                        <option value="Banmédica">Isapre Banmédica</option>
                        <option value="Vida Tres">Isapre Vida Tres</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium leading-6 text-gray-900">AFP</label>
                      <select name="pension_fund" value={formData.pension_fund} onChange={handleChange} className="pl-2 mt-2 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6">
                        <option value="Modelo">Modelo</option>
                        <option value="Habitat">Habitat</option>
                        <option value="Capital">Capital</option>
                        <option value="Cuprum">Cuprum</option>
                        <option value="Provida">Provida</option>
                        <option value="PlanVital">PlanVital</option>
                        <option value="Uno">Uno</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium leading-6 text-gray-900">Turno</label>
                      <input type="text" name="shift" value={formData.shift} onChange={handleChange} className="pl-2 mt-2 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6" />
                    </div>

                    <div>
                      <label className="block text-sm font-medium leading-6 text-gray-900">Fecha Nacimiento</label>
                      <input type="date" name="birth_date" value={formData.birth_date} onChange={handleChange} className="pl-2 mt-2 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6" />
                    </div>

                    <div>
                      <label className="block text-sm font-medium leading-6 text-gray-900">Talla Ropa / Calzado</label>
                      <div className="flex gap-2">
                        <input type="text" name="clothing_size" placeholder="Ropa" value={formData.clothing_size} onChange={handleChange} className="pl-2 mt-2 block w-1/2 rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6" />
                        <input type="text" name="shoe_size" placeholder="Calzado" value={formData.shoe_size} onChange={handleChange} className="pl-2 mt-2 block w-1/2 rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium leading-6 text-gray-900">Contacto de Emergencia</label>
                      <input type="text" name="emergency_contact_name" placeholder="Nombre" value={formData.emergency_contact_name} onChange={handleChange} className="pl-2 mt-2 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6" />
                      <input type="text" name="emergency_contact_phone" placeholder="Teléfono" value={formData.emergency_contact_phone} onChange={handleChange} className="pl-2 mt-2 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6" />
                    </div>

                    <div className="mt-5 sm:col-span-2 sm:mt-6 sm:flex sm:flex-row-reverse">
                      <button type="submit" disabled={loading} className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 sm:ml-3 sm:w-auto">
                        {loading ? 'Guardando...' : 'Guardar'}
                      </button>
                      <button type="button" onClick={onClose} className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto">
                        Cancelar
                      </button>
                    </div>

                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
