import React, { useState } from 'react'
import { apiFetch } from '../supabaseClient'
import { X, TreePalm } from 'lucide-react'

export default function VacationModal({ isOpen, onClose, workers, onSave }) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    worker_id: '',
    fecha_inicio: '',
    fecha_fin: '',
    dias_habiles: 0,
    observaciones: ''
  })

  if (!isOpen) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await apiFetch('http://127.0.0.1:8000/api/v1/vacaciones/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      onSave(data)
      onClose()
    } catch (err) {
      alert('Error al registrar vacaciones.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="bg-indigo-600 px-6 py-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <TreePalm className="w-5 h-5" />
            <h2 className="text-lg font-bold">Registrar Vacaciones</h2>
          </div>
          <button onClick={onClose} className="hover:bg-indigo-700 p-1 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Trabajador</label>
            <select
              required
              className="w-full p-2 border border-gray-300 rounded-lg text-sm"
              value={formData.worker_id}
              onChange={e => setFormData({ ...formData, worker_id: e.target.value })}
            >
              <option value="">Seleccione trabajador...</option>
              {workers.map(w => (
                <option key={w.id} value={w.id}>{w.first_name} {w.last_name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Fecha Inicio</label>
              <input
                type="date"
                required
                className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                value={formData.fecha_inicio}
                onChange={e => setFormData({ ...formData, fecha_inicio: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Fecha Fin</label>
              <input
                type="date"
                required
                className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                value={formData.fecha_fin}
                onChange={e => setFormData({ ...formData, fecha_fin: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Días Hábiles Utilizados</label>
            <input
              type="number"
              required
              min="1"
              className="w-full p-2 border border-gray-300 rounded-lg text-sm"
              value={formData.dias_habiles}
              onChange={e => setFormData({ ...formData, dias_habiles: parseInt(e.target.value) })}
            />
            <p className="text-[10px] text-gray-400 mt-1">* Ingrese solo días de lunes a viernes (o según contrato)</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Observaciones</label>
            <textarea
              className="w-full p-2 border border-gray-300 rounded-lg text-sm h-20"
              value={formData.observaciones}
              onChange={e => setFormData({ ...formData, observaciones: e.target.value })}
            />
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
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:bg-indigo-300 shadow-sm"
            >
              {loading ? 'Guardando...' : 'Guardar Registro'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
