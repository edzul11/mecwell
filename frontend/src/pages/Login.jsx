import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { Building2, Lock, Mail, AlertCircle } from 'lucide-react'

import mecwellLogo from '../assets/mecwell_img.png'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message === 'Invalid login credentials' ? 'Credenciales incorrectas. Verifique su correo y contraseña.' : error.message)
      setLoading(false)
    } else {
      navigate('/')
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      backgroundColor: '#eef0f2',
    }}>
      {/* Panel izquierdo — branding */}
      <div style={{
        width: 420, flexShrink: 0,
        backgroundColor: '#F8FAFC',
        borderRight: '1px solid #E2E8F0',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: 48,
      }}>
        <div style={{ textAlign: 'center' }}>
          <img src={mecwellLogo} alt="Mecwell Logo" style={{ maxWidth: '85%', maxHeight: 180, objectFit: 'contain', marginBottom: 48 }} />
          <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: 32 }}>
            <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.7, fontWeight: 500 }}>
              Sistema de Gestión Integral para<br />
              administración de personal, faenas,<br />
              contratos e inventario.
            </p>
          </div>
        </div>
      </div>

      {/* Panel derecho — formulario */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 48,
      }}>
        <div style={{ width: '100%', maxWidth: 380 }}>
          <div style={{ marginBottom: 36 }}>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: '#1a1c20', marginBottom: 6 }}>
              Iniciar Sesión
            </h2>
            <p style={{ fontSize: 13, color: '#64748B' }}>
              Ingrese sus credenciales para acceder al sistema.
            </p>
          </div>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {error && (
              <div style={{
                display: 'flex', alignItems: 'flex-start', gap: 10,
                padding: '12px 16px', borderRadius: 'var(--radius-card)',
                backgroundColor: 'var(--color-error-light)', color: 'var(--color-error)', fontSize: 13,
              }}>
                <AlertCircle style={{ width: 16, height: 16, flexShrink: 0, marginTop: 1 }} />
                {error}
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
                Correo Electrónico
              </label>
              <div style={{ position: 'relative' }}>
                <Mail style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: '#94A3B8' }} />
                <input
                  id="email" type="email" autoComplete="email" required
                  value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="usuario@mecwell.cl"
                  style={{
                    width: '100%', padding: '10px 12px 10px 38px',
                    border: '1px solid #E2E8F0', borderRadius: 'var(--radius-button)',
                    fontSize: 13, color: '#1A1C20',
                    outline: 'none', transition: 'border 0.15s',
                    backgroundColor: '#fff',
                  }}
                  onFocus={e => e.target.style.borderColor = 'var(--color-primary)'}
                  onBlur={e => e.target.style.borderColor = '#E2E8F0'}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
                Contraseña
              </label>
              <div style={{ position: 'relative' }}>
                <Lock style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: '#94A3B8' }} />
                <input
                  id="password" type="password" autoComplete="current-password" required
                  value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{
                    width: '100%', padding: '10px 12px 10px 38px',
                    border: '1px solid #E2E8F0', borderRadius: 'var(--radius-button)',
                    fontSize: 13, color: '#1A1C20',
                    outline: 'none', transition: 'border 0.15s',
                    backgroundColor: '#fff',
                  }}
                  onFocus={e => e.target.style.borderColor = 'var(--color-primary)'}
                  onBlur={e => e.target.style.borderColor = '#E2E8F0'}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '11px',
                backgroundColor: loading ? 'var(--color-secondary-container)' : 'var(--color-primary-accent)',
                color: 'var(--color-primary)', border: 'none', borderRadius: 'var(--radius-button)',
                fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s', marginTop: 4,
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
              }}
              onMouseEnter={e => { if (!loading) { e.currentTarget.style.backgroundColor = 'var(--color-secondary-container)'; e.currentTarget.style.transform = 'translateY(-1px)' } }}
              onMouseLeave={e => { if (!loading) { e.currentTarget.style.backgroundColor = 'var(--color-primary-accent)'; e.currentTarget.style.transform = 'none' } }}
            >
              {loading ? 'Verificando...' : 'Ingresar al Sistema'}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: 12, color: '#94A3B8', marginTop: 32 }}>
            MECWELL LIMITADA · Sistema de Gestión Interno
          </p>
        </div>
      </div>
    </div>
  )
}
