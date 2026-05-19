import React, { useState, useEffect } from 'react'
import { apiFetch } from '../supabaseClient'
import { AlertTriangle, X, UserMinus } from 'lucide-react'

export default function DeactivateWorkerModal({ isOpen, onClose, worker, onDeactivated }) {
  const [causales, setCausales] = useState([])
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    termination_date: new Date().toISOString().split('T')[0],
    termination_causal: '',
    termination_reason: '',
    blacklisted: false,
    blacklist_category: '',
    blacklist_reason: ''
  })

  useEffect(() => {
    if (isOpen) {
      apiFetch('http://127.0.0.1:8000/api/v1/finiquitos/causales')
        .then(r => r.json())
        .then(data => setCausales(data))
        .catch(console.error)
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await apiFetch(`http://127.0.0.1:8000/api/v1/workers/${worker.id}/deactivate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      if (!res.ok) throw new Error()
      const updated = await res.json()
      onDeactivated(updated)
      onClose()
    } catch (err) {
      alert('Error al desvincular al trabajador.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-gray-200">
        <div className="bg-red-600 px-6 py-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <UserMinus className="w-5 h-5" />
            <h2 className="text-lg font-bold">Desvincular Trabajador</h2>
          </div>
          <button onClick={onClose} className="hover:bg-red-700 p-1 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg flex gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-sm text-red-700">
              Estás a punto de desvincular a <strong>{worker.first_name} {worker.last_name}</strong>. 
              Se retirará de su faena actual y su estado pasará a Inactivo.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Fecha de Término</label>
              <input
                type="date"
                required
                className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                value={formData.termination_date}
                onChange={e => setFormData({ ...formData, termination_date: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Causal Legal</label>
              <select
                required
                className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                value={formData.termination_causal}
                onChange={e => setFormData({ ...formData, termination_causal: e.target.value })}
              >
                <option value="">Seleccione causal...</option>
                {causales.map(c => (
                  <option key={c.id} value={`${c.articulo} ${c.numero || ''}`}>
                    {c.articulo} {c.numero}: {c.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Observaciones / Motivo Detallado</label>
            <textarea
              className="w-full p-2 border border-gray-300 rounded-lg text-sm h-20"
              placeholder="Describa el motivo de la salida..."
              value={formData.termination_reason}
              onChange={e => setFormData({ ...formData, termination_reason: e.target.value })}
            />
          </div>

          <div className="pt-4 border-t border-gray-100">
            <label className="flex items-center gap-2 cursor-pointer mb-3">
              <input
                type="checkbox"
                className="w-4 h-4 rounded text-red-600"
                checked={formData.blacklisted}
                onChange={e => setFormData({ ...formData, blacklisted: e.target.checked })}
              />
              <span className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                Agregar a Lista Negra (No Recontratable)
              </span>
            </label>

            {formData.blacklisted && (
              <div className="bg-gray-50 p-4 rounded-xl space-y-3 animate-in fade-in duration-200">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Categoría de Bloqueo</label>
                  <select
                    className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                    value={formData.blacklist_category}
                    onChange={e => setFormData({ ...formData, blacklist_category: e.target.value })}
                  >
                    <option value="">Seleccione categoría...</option>
                    <option value="CONDUCTA_GRAVE">Conducta Grave</option>
                    <option value="ROBO">Robo / Hurto</option>
                    <option value="ABANDONO">Abandono de Trabajo</option>
                    <option value="BUN">Bajo Desempeño</option>
                    <option value="OTROS">Otros</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Motivo Bloqueo</label>
                  <input
                    type="text"
                    className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                    placeholder="Justificación del bloqueo..."
                    value={formData.blacklist_reason}
                    onChange={e => setFormData({ ...formData, blacklist_reason: e.target.value })}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 disabled:bg-red-300 shadow-sm"
            >
              {loading ? 'Procesando...' : 'Confirmar Desvinculación'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
