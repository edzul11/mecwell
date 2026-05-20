import { createContext, useContext, useState, useEffect } from 'react'
import ConfirmModal from '../components/ConfirmModal'

const ConfirmAlertContext = createContext({})

export const useConfirmAlert = () => useContext(ConfirmAlertContext)

export const ConfirmAlertProvider = ({ children }) => {
  const [modalState, setModalState] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirmar',
    cancelText: 'Cancelar',
    isDestructive: false,
    onConfirm: () => {},
    onCancel: () => {}
  })

  const showConfirm = (options) => {
    return new Promise((resolve) => {
      setModalState({
        isOpen: true,
        title: options.title || '¿Estás seguro?',
        message: options.message || '',
        confirmText: options.confirmText || 'Confirmar',
        cancelText: options.cancelText || 'Cancelar',
        isDestructive: options.isDestructive || false,
        onConfirm: () => {
          setModalState(prev => ({ ...prev, isOpen: false }))
          resolve(true)
        },
        onCancel: () => {
          setModalState(prev => ({ ...prev, isOpen: false }))
          resolve(false)
        }
      })
    })
  }

  const showAlert = (title, message, isError = false) => {
    return new Promise((resolve) => {
      setModalState({
        isOpen: true,
        title: title,
        message: message,
        confirmText: 'Aceptar',
        cancelText: null,
        isDestructive: isError,
        onConfirm: () => {
          setModalState(prev => ({ ...prev, isOpen: false }))
          resolve(true)
        },
        onCancel: () => {
          setModalState(prev => ({ ...prev, isOpen: false }))
          resolve(false)
        }
      })
    })
  }

  useEffect(() => {
    window.alert = (message) => {
      const isError = typeof message === 'string' && (
        message.toLowerCase().includes('error') || 
        message.toLowerCase().includes('falló') || 
        message.toLowerCase().includes('duplicado') ||
        message.toLowerCase().includes('inválido') ||
        message.toLowerCase().includes('no se pudo')
      )
      showAlert(isError ? "Error" : "Aviso", message, isError)
    }
  }, [])

  return (
    <ConfirmAlertContext.Provider value={{ showConfirm, showAlert }}>
      {children}
      <ConfirmModal
        isOpen={modalState.isOpen}
        title={modalState.title}
        message={modalState.message}
        confirmText={modalState.confirmText}
        cancelText={modalState.cancelText}
        isDestructive={modalState.isDestructive}
        onConfirm={modalState.onConfirm}
        onCancel={modalState.onCancel}
      />
    </ConfirmAlertContext.Provider>
  )
}

