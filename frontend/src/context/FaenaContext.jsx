import { createContext, useContext, useState, useEffect } from 'react'
import { apiFetch } from '../supabaseClient'

const FaenaContext = createContext(null)

export function FaenaProvider({ children }) {
  const [faenas, setFaenas] = useState([])
  const [activeFaenaId, setActiveFaenaId] = useState(() => {
    return localStorage.getItem('activeFaenaId') || null // null = Vista Global
  })

  useEffect(() => {
    apiFetch('http://127.0.0.1:8000/api/v1/sites/')
      .then(res => res.json())
      .then(data => setFaenas(Array.isArray(data) ? data : []))
      .catch(err => console.error('Error cargando faenas:', err))
  }, [])

  const setActiveFaena = (id) => {
    setActiveFaenaId(id)
    if (id) {
      localStorage.setItem('activeFaenaId', id)
    } else {
      localStorage.removeItem('activeFaenaId')
    }
  }

  const activeFaena = faenas.find(f => f.id === activeFaenaId) || null

  return (
    <FaenaContext.Provider value={{ faenas, activeFaenaId, activeFaena, setActiveFaena }}>
      {children}
    </FaenaContext.Provider>
  )
}

export function useFaena() {
  const ctx = useContext(FaenaContext)
  if (!ctx) throw new Error('useFaena must be used inside FaenaProvider')
  return ctx
}
