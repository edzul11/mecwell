import { apiFetch } from '../supabaseClient'
import { useState } from 'react'
import { X } from 'lucide-react'

export default function SiteModal({ isOpen, onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    status: 'active'
  })
  
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const response = await apiFetch('http://127.0.0.1:8000/api/v1/sites/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      if (!response.ok) throw new Error('Error al crear faena')
      
      const newSite = await response.json()
      onSave(newSite)
      onClose()
      setFormData({ name: '', location: '', status: 'active' })
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
          <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
            <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
              <button type="button" onClick={onClose} className="rounded-md bg-white text-gray-400 hover:text-gray-500">
                <span className="sr-only">Cerrar</span>
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="sm:flex sm:items-start">
              <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                <h3 className="text-base font-semibold leading-6 text-gray-900">Añadir Nueva Faena</h3>
                <div className="mt-4">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium leading-6 text-gray-900">Nombre de Faena</label>
                      <input required type="text" name="name" value={formData.name} onChange={handleChange} className="pl-2 mt-2 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium leading-6 text-gray-900">Ubicación</label>
                      <input type="text" name="location" value={formData.location} onChange={handleChange} className="pl-2 mt-2 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm" />
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
