import { apiFetch, uploadToSupabaseStorage } from '../supabaseClient'
import { useState, useEffect } from 'react'
import { X, UploadCloud } from 'lucide-react'

export default function DocumentModal({ isOpen, onClose, onSave, defaultWorkerId = '' }) {
  const [workers, setWorkers] = useState([])
  const [formData, setFormData] = useState({
    worker_id: defaultWorkerId,
    name: '',
    document_type: 'Certificado Médico',
    expiration_date: '',
    file_url: ''
  })
  
  const [file, setFile] = useState(null)
  
  // Update formData when defaultWorkerId changes
  useEffect(() => {
    setFormData(prev => ({ ...prev, worker_id: defaultWorkerId }))
  }, [defaultWorkerId])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      apiFetch('http://127.0.0.1:8000/api/v1/workers/')
        .then(res => res.json())
        .then(data => setWorkers(data))
        .catch(err => console.error(err))
    }
  }, [isOpen])

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      let uploadedUrl = null
      
      // Upload file first if exists
      if (file) {
        const fileExt = file.name.split('.').pop()
        const cleanType = formData.document_type.replace(/\s+/g, '')
        const storagePath = `workers/${formData.worker_id}/${Date.now()}-${cleanType}.${fileExt}`
        
        uploadedUrl = await uploadToSupabaseStorage('documents', storagePath, file)
      }

      // Save document record
      const finalData = { ...formData, file_url: uploadedUrl }
      const response = await apiFetch('http://127.0.0.1:8000/api/v1/documents/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalData)
      })
      
      if (!response.ok) throw new Error('Error al guardar documento')
      
      const newDoc = await response.json()
      // Inject worker name for UI
      const worker = workers.find(w => w.id === newDoc.worker_id)
      onSave({ ...newDoc, workers: worker })
      onClose()
      setFormData({ worker_id: '', name: '', document_type: 'Certificado Médico', expiration_date: '', file_url: '' })
      setFile(null)
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
                <h3 className="text-base font-semibold leading-6 text-gray-900">Adjuntar Nuevo Documento</h3>
                <div className="mt-4">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium leading-6 text-gray-900">Trabajador</label>
                      <select required name="worker_id" value={formData.worker_id} onChange={handleChange} className="pl-2 mt-2 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm">
                        <option value="" disabled>Seleccione un trabajador...</option>
                        {workers.map(w => (
                          <option key={w.id} value={w.id}>{w.first_name} {w.last_name}</option>
                        ))}
                      </select>
                    </div>

                    {formData.worker_id && (
                      <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-100 flex items-center gap-3">
                        <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold text-xs">
                          {workers.find(w => w.id === formData.worker_id)?.first_name[0]}
                          {workers.find(w => w.id === formData.worker_id)?.last_name[0]}
                        </div>
                        <div className="text-xs">
                          <p className="font-bold text-indigo-900">
                            {workers.find(w => w.id === formData.worker_id)?.first_name} {workers.find(w => w.id === formData.worker_id)?.last_name}
                          </p>
                          <p className="text-indigo-600">{workers.find(w => w.id === formData.worker_id)?.rut}</p>
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium leading-6 text-gray-900">Tipo de Documento</label>
                      <select required name="document_type" value={formData.document_type} onChange={handleChange} className="pl-2 mt-2 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm">
                        <option value="Certificado Médico">Certificado Médico</option>
                        <option value="Inducción">Inducción SSO</option>
                        <option value="Certificación">Certificación Técnica</option>
                        <option value="Licencia Conducir">Licencia de Conducir</option>
                        <option value="Otro">Otro</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium leading-6 text-gray-900">Nombre o Descripción</label>
                      <input required type="text" name="name" value={formData.name} onChange={handleChange} className="pl-2 mt-2 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm" />
                    </div>

                    <div>
                      <label className="block text-sm font-medium leading-6 text-gray-900">Fecha de Vencimiento</label>
                      <input required type="date" name="expiration_date" value={formData.expiration_date} onChange={handleChange} className="pl-2 mt-2 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm" />
                    </div>

                    <div>
                      <label className="block text-sm font-medium leading-6 text-gray-900">Archivo Adjunto (Opcional)</label>
                      <input type="file" onChange={(e) => setFile(e.target.files[0])} className="mt-2 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
                    </div>

                    <div className="mt-5 sm:mt-6 sm:flex sm:flex-row-reverse">
                      <button type="submit" disabled={loading} className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 sm:ml-3 sm:w-auto">
                        {loading ? 'Subiendo...' : 'Guardar y Subir'}
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
