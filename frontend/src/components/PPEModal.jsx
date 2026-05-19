import { apiFetch } from '../supabaseClient'
import { useState, useEffect } from 'react'

export default function PPEModal({ isOpen, onClose, workerId, workerName }) {
  const [ppes, setPpes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isOpen && workerId) {
      setLoading(true)
      apiFetch(`http://127.0.0.1:8000/api/v1/ppe/worker/${workerId}`)
        .then((res) => res.json())
        .then((data) => {
          setPpes(data)
          setLoading(false)
        })
        .catch((err) => {
          console.error("Error fetching worker PPEs:", err)
          setLoading(false)
        })
    }
  }, [isOpen, workerId])

  if (!isOpen) return null

  return (
    <div className="relative z-10" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
      <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
        <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
          <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl sm:p-6">
            <div>
              <div className="mt-3 text-center sm:mt-5">
                <h3 className="text-base font-semibold leading-6 text-gray-900" id="modal-title">
                  Historial de EPP - {workerName}
                </h3>
                <div className="mt-2">
                  {loading ? (
                    <p className="text-sm text-gray-500">Cargando historial...</p>
                  ) : ppes.length === 0 ? (
                    <p className="text-sm text-gray-500">Este trabajador no tiene EPP asignados.</p>
                  ) : (
                    <div className="mt-4 overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                      <table className="min-w-full divide-y divide-gray-300 text-left">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 py-3.5 text-sm font-semibold text-gray-900">Ítem</th>
                            <th className="px-3 py-3.5 text-sm font-semibold text-gray-900">Cantidad</th>
                            <th className="px-3 py-3.5 text-sm font-semibold text-gray-900">Fecha Asignación</th>
                            <th className="px-3 py-3.5 text-sm font-semibold text-gray-900">Estado</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                          {ppes.map((ppe) => (
                            <tr key={ppe.id}>
                              <td className="px-3 py-4 text-sm text-gray-500">{ppe.inventory_items?.name}</td>
                              <td className="px-3 py-4 text-sm text-gray-500">{ppe.quantity}</td>
                              <td className="px-3 py-4 text-sm text-gray-500">{ppe.assignment_date}</td>
                              <td className="px-3 py-4 text-sm text-gray-500">
                                {ppe.is_returned ? (
                                  <span className="text-green-600">Devuelto ({ppe.return_date})</span>
                                ) : ppe.inventory_items?.is_returnable ? (
                                  <button className="text-indigo-600 hover:text-indigo-900">Marcar Devuelto</button>
                                ) : (
                                  <span className="text-gray-400">Consumible</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
              <button
                type="button"
                className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 sm:col-start-2"
              >
                Asignar Nuevo EPP
              </button>
              <button
                type="button"
                className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:col-start-1 sm:mt-0"
                onClick={onClose}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
