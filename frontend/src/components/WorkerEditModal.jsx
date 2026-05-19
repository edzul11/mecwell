import { apiFetch } from '../supabaseClient'
import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

export default function WorkerEditModal({ isOpen, onClose, worker, onSave }) {
  const [formData, setFormData] = useState({})
  const [loading, setLoading] = useState(false)
  const [sites, setSites] = useState([])

  useEffect(() => {
    if (worker) {
      setFormData(worker)
    }
    apiFetch('http://127.0.0.1:8000/api/v1/sites/')
      .then(res => res.json())
      .then(data => setSites(data))
      .catch(err => console.error(err))
  }, [worker])

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const response = await apiFetch(`http://127.0.0.1:8000/api/v1/workers/${worker.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      if (!response.ok) throw new Error('Error al actualizar trabajador')
      
      const updatedWorker = await response.json()
      onSave(updatedWorker)
      onClose()
    } catch (err) {
      alert("Hubo un error al guardar los cambios.")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative z-50">
      <div className="fixed inset-0 bg-gray-500 bg-opacity-75"></div>
      <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
        <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
          <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl sm:my-8 sm:w-full sm:max-w-4xl sm:p-6">
            <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
              <button type="button" onClick={onClose} className="rounded-md bg-white text-gray-400 hover:text-gray-500">
                <span className="sr-only">Cerrar</span>
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="sm:flex sm:items-start w-full">
              <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                <h3 className="text-lg font-semibold leading-6 text-gray-900 mb-6">Editar Perfil de Trabajador</h3>
                
                <form onSubmit={handleSubmit} className="space-y-6 text-sm">
                  <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-3">
                    
                    {/* Basico */}
                    <div className="sm:col-span-3">
                      <h4 className="font-medium text-indigo-600 border-b pb-1 mb-3">Información Básica</h4>
                    </div>
                    <div>
                      <label className="block font-medium text-gray-700">Nombre</label>
                      <input required type="text" name="first_name" value={formData.first_name || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-0 py-1.5 px-2 shadow-sm ring-1 ring-inset ring-gray-300" />
                    </div>
                    <div>
                      <label className="block font-medium text-gray-700">Apellido</label>
                      <input required type="text" name="last_name" value={formData.last_name || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-0 py-1.5 px-2 shadow-sm ring-1 ring-inset ring-gray-300" />
                    </div>
                    <div>
                      <label className="block font-medium text-gray-700">RUT</label>
                      <input required type="text" name="rut" value={formData.rut || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-0 py-1.5 px-2 shadow-sm ring-1 ring-inset ring-gray-300" />
                    </div>
                    
                    <div>
                      <label className="block font-medium text-gray-700">Fecha Nacimiento</label>
                      <input type="date" name="birth_date" value={formData.birth_date || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-0 py-1.5 px-2 shadow-sm ring-1 ring-inset ring-gray-300" />
                    </div>
                    <div>
                      <label className="block font-medium text-gray-700">Email</label>
                      <input type="email" name="email" value={formData.email || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-0 py-1.5 px-2 shadow-sm ring-1 ring-inset ring-gray-300" />
                    </div>
                    <div>
                      <label className="block font-medium text-gray-700">Estado Civil</label>
                      <select name="marital_status" value={formData.marital_status || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-0 py-1.5 px-2 shadow-sm ring-1 ring-inset ring-gray-300">
                        <option value="">Seleccionar...</option>
                        <option value="Soltero/a">Soltero/a</option>
                        <option value="Casado/a">Casado/a</option>
                        <option value="Viudo/a">Viudo/a</option>
                        <option value="Divorciado/a">Divorciado/a</option>
                      </select>
                    </div>

                    {/* Laboral */}
                    <div className="sm:col-span-3 mt-4">
                      <h4 className="font-medium text-indigo-600 border-b pb-1 mb-3">Información Laboral</h4>
                    </div>
                    <div>
                      <label className="block font-medium text-gray-700">Faena Asignada</label>
                      <select name="site_id" value={formData.site_id || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-0 py-1.5 px-2 shadow-sm ring-1 ring-inset ring-gray-300">
                        <option value="">Sin Asignar</option>
                        {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block font-medium text-gray-700">Cargo</label>
                      <input required type="text" name="position" value={formData.position || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-0 py-1.5 px-2 shadow-sm ring-1 ring-inset ring-gray-300" />
                    </div>
                    <div>
                      <label className="block font-medium text-gray-700">Sueldo Base</label>
                      <input required type="number" name="base_salary" value={formData.base_salary || 0} onChange={handleChange} className="mt-1 block w-full rounded-md border-0 py-1.5 px-2 shadow-sm ring-1 ring-inset ring-gray-300" />
                    </div>
                    <div>
                      <label className="block font-medium text-gray-700">Turno</label>
                      <input type="text" name="shift" value={formData.shift || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-0 py-1.5 px-2 shadow-sm ring-1 ring-inset ring-gray-300" />
                    </div>
                    <div>
                      <label className="block font-medium text-gray-700">AFP</label>
                      <select required name="pension_fund" value={formData.pension_fund || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-0 py-1.5 px-2 shadow-sm ring-1 ring-inset ring-gray-300">
                        <option value="">Seleccione AFP</option>
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
                      <label className="block font-medium text-gray-700">Previsión Salud</label>
                      <input required type="text" name="health_institution" value={formData.health_institution || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-0 py-1.5 px-2 shadow-sm ring-1 ring-inset ring-gray-300" />
                    </div>
                    <div>
                      <label className="block font-medium text-gray-700">Fecha de Ingreso</label>
                      <input type="date" name="entry_date" value={formData.entry_date || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-0 py-1.5 px-2 shadow-sm ring-1 ring-inset ring-gray-300" />
                    </div>

                    {/* Bancaria & EPP */}
                    <div className="sm:col-span-3 mt-4">
                      <h4 className="font-medium text-indigo-600 border-b pb-1 mb-3">Banco, Emergencia y EPP</h4>
                    </div>
                    <div>
                      <label className="block font-medium text-gray-700">Banco</label>
                      <input type="text" name="bank_name" value={formData.bank_name || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-0 py-1.5 px-2 shadow-sm ring-1 ring-inset ring-gray-300" />
                    </div>
                    <div>
                      <label className="block font-medium text-gray-700">Tipo de Cuenta</label>
                      <input type="text" name="account_type" value={formData.account_type || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-0 py-1.5 px-2 shadow-sm ring-1 ring-inset ring-gray-300" />
                    </div>
                    <div>
                      <label className="block font-medium text-gray-700">Nº de Cuenta</label>
                      <input type="text" name="account_number" value={formData.account_number || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-0 py-1.5 px-2 shadow-sm ring-1 ring-inset ring-gray-300" />
                    </div>
                    
                    <div>
                      <label className="block font-medium text-gray-700">Contacto Emergencia</label>
                      <input type="text" name="emergency_contact_name" value={formData.emergency_contact_name || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-0 py-1.5 px-2 shadow-sm ring-1 ring-inset ring-gray-300" placeholder="Nombre" />
                    </div>
                    <div>
                      <label className="block font-medium text-gray-700">Teléfono Emergencia</label>
                      <input type="text" name="emergency_contact_phone" value={formData.emergency_contact_phone || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-0 py-1.5 px-2 shadow-sm ring-1 ring-inset ring-gray-300" />
                    </div>
                    
                    <div className="flex gap-2">
                      <div className="w-1/3">
                        <label className="block font-medium text-gray-700 text-xs">Ropa</label>
                        <input type="text" name="clothing_size" value={formData.clothing_size || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-0 py-1.5 px-2 shadow-sm ring-1 ring-inset ring-gray-300" />
                      </div>
                      <div className="w-1/3">
                        <label className="block font-medium text-gray-700 text-xs">Calzado</label>
                        <input type="text" name="shoe_size" value={formData.shoe_size || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-0 py-1.5 px-2 shadow-sm ring-1 ring-inset ring-gray-300" />
                      </div>
                      <div className="w-1/3">
                        <label className="block font-medium text-gray-700 text-xs">Guantes</label>
                        <input type="text" name="glove_size" value={formData.glove_size || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-0 py-1.5 px-2 shadow-sm ring-1 ring-inset ring-gray-300" />
                      </div>
                    </div>

                  </div>

                  <div className="mt-8 sm:flex sm:flex-row-reverse border-t border-gray-200 pt-5">
                    <button type="submit" disabled={loading} className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 sm:ml-3 sm:w-auto">
                      {loading ? 'Guardando...' : 'Guardar Cambios'}
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
  )
}
