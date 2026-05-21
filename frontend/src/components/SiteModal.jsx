import { apiFetch } from '../supabaseClient'
import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

export default function SiteModal({ isOpen, onClose, onSave, initialData = null }) {
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    status: 'active',
    client_name: '',
    client_rut: '',
    client_city: '',
    client_phone: '',
    client_contact: '',
    client_area: '',
    client_email: '',
    client_contact_phone: ''
  })
  
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          name: initialData.name || '',
          location: initialData.location || '',
          status: initialData.status || 'active',
          client_name: initialData.client_name || '',
          client_rut: initialData.client_rut || '',
          client_city: initialData.client_city || '',
          client_phone: initialData.client_phone || '',
          client_contact: initialData.client_contact || '',
          client_area: initialData.client_area || '',
          client_email: initialData.client_email || '',
          client_contact_phone: initialData.client_contact_phone || ''
        })
      } else {
        setFormData({
          name: '', location: '', status: 'active',
          client_name: '', client_rut: '', client_city: '', client_phone: '', client_contact: '', client_area: '', client_email: '', client_contact_phone: ''
        })
      }
    }
  }, [isOpen, initialData])

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const url = initialData 
        ? `http://127.0.0.1:8000/api/v1/sites/${initialData.id}` 
        : 'http://127.0.0.1:8000/api/v1/sites/'
      const method = initialData ? 'PUT' : 'POST'
      
      const response = await apiFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      if (!response.ok) throw new Error('Error al guardar faena')
      
      const savedSite = await response.json()
      onSave(savedSite)
      onClose()
    } catch (err) {
      alert("Hubo un error al guardar.")
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
          <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl sm:my-8 sm:w-full sm:max-w-2xl sm:p-6">
            <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
              <button type="button" onClick={onClose} className="rounded-md bg-white text-gray-400 hover:text-gray-500">
                <span className="sr-only">Cerrar</span>
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="sm:flex sm:items-start">
              <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                <h3 className="text-base font-semibold leading-6 text-gray-900">
                  {initialData ? 'Editar Faena' : 'Añadir Nueva Faena'}
                </h3>
                <div className="mt-4">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Datos Faena */}
                      <div className="col-span-1 md:col-span-2 bg-gray-50 p-3 rounded-md">
                        <h4 className="text-xs font-semibold text-gray-500 uppercase mb-3">Datos del Proyecto</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium leading-6 text-gray-900">Nombre de Faena *</label>
                            <input required type="text" name="name" value={formData.name} onChange={handleChange} className="pl-2 mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium leading-6 text-gray-900">Ubicación / Ciudad</label>
                            <input type="text" name="location" value={formData.location} onChange={handleChange} className="pl-2 mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm" />
                          </div>
                        </div>
                      </div>

                      {/* Datos Mandante / Facturación */}
                      <div className="col-span-1 md:col-span-2 bg-blue-50 p-3 rounded-md mt-2">
                        <h4 className="text-xs font-semibold text-blue-700 uppercase mb-3">Información del Cliente / Empresa</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium leading-6 text-gray-900">Cliente / Razón Social</label>
                            <input type="text" name="client_name" value={formData.client_name} onChange={handleChange} placeholder="Ej. Minera Escondida Ltda." className="mt-1 block w-full rounded-md border-0 py-1.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium leading-6 text-gray-900">RUT</label>
                            <input type="text" name="client_rut" value={formData.client_rut} onChange={handleChange} placeholder="Ej. 76.123.456-K" className="mt-1 block w-full rounded-md border-0 py-1.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium leading-6 text-gray-900">Ciudad / Comuna</label>
                            <input type="text" name="client_city" value={formData.client_city} onChange={handleChange} placeholder="Ej. Antofagasta" className="mt-1 block w-full rounded-md border-0 py-1.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium leading-6 text-gray-900">Teléfono Empresa</label>
                            <input type="text" name="client_phone" value={formData.client_phone} onChange={handleChange} placeholder="Ej. +56 55 2123456" className="mt-1 block w-full rounded-md border-0 py-1.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6" />
                          </div>
                        </div>
                        
                        <h4 className="text-xs font-semibold text-blue-700 uppercase mt-4 mb-3">Información del Contacto</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium leading-6 text-gray-900">Contacto Principal</label>
                            <input type="text" name="client_contact" value={formData.client_contact} onChange={handleChange} placeholder="Ej. Juan Pérez" className="mt-1 block w-full rounded-md border-0 py-1.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium leading-6 text-gray-900">Área / Cargo</label>
                            <input type="text" name="client_area" value={formData.client_area} onChange={handleChange} placeholder="Ej. Jefe de Proyecto" className="mt-1 block w-full rounded-md border-0 py-1.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium leading-6 text-gray-900">Email</label>
                            <input type="email" name="client_email" value={formData.client_email} onChange={handleChange} className="pl-2 mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium leading-6 text-gray-900">Teléfono</label>
                            <input type="text" name="client_phone" value={formData.client_phone} onChange={handleChange} className="pl-2 mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm" />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 sm:mt-6 sm:flex sm:flex-row-reverse">
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
