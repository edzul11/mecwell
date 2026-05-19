import React, { useState } from 'react'
import { apiFetch } from '../supabaseClient'
import { X } from 'lucide-react'

export default function AdvanceModal({ isOpen, onClose, worker, onSaved }) {
  const [formData, setFormData] = useState({
    amount: '',
    date: new Date().toISOString().split('T')[0],
    reason: ''
  })
  const [loading, setLoading] = useState(false)

  if (!isOpen || !worker) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const payload = {
        worker_id: worker.id,
        amount: parseFloat(formData.amount),
        date: formData.date,
        reason: formData.reason
      }
      const res = await apiFetch('http://127.0.0.1:8000/api/v1/advances/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.detail || 'Error al guardar anticipo')
      }
      const saved = await res.json()
      onSaved(saved)
      setFormData({ amount: '', date: new Date().toISOString().split('T')[0], reason: '' })
      onClose()
    } catch (err) {
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">Solicitar Anticipo</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Monto Solicitado ($)</label>
            <input
              type="number"
              required
              max={worker.base_salary}
              value={formData.amount}
              onChange={e => setFormData({...formData, amount: e.target.value})}
              className="w-full p-2 border border-gray-300 rounded-lg text-sm"
              placeholder={`Máx: $${worker.base_salary}`}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Fecha</label>
            <input
              type="date"
              required
              value={formData.date}
              onChange={e => setFormData({...formData, date: e.target.value})}
              className="w-full p-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Motivo / Observación</label>
            <textarea
              value={formData.reason}
              onChange={e => setFormData({...formData, reason: e.target.value})}
              className="w-full p-2 border border-gray-300 rounded-lg text-sm h-20"
            />
          </div>

          <div className="pt-4 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="flex-1 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50">
              {loading ? 'Guardando...' : 'Confirmar Anticipo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
