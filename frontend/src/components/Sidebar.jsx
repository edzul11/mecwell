import { NavLink } from 'react-router-dom'
import {
  LogOut, ChevronDown, Globe, Building2, TreePalm, FileX, LayoutDashboard, Users, UserPlus, HardHat, FileText, FileSignature, Wallet, Package, Receipt, Calendar, Banknote
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useFaena } from '../context/FaenaContext'
import { useState } from 'react'

import mecwellLogo from '../assets/mecwell_img.png'

const navigationGroups = [
  {
    title: 'Principal',
    items: [
      { name: 'Dashboard',    href: '/',          icon: LayoutDashboard },
    ]
  },
  {
    title: 'Gestión de Personal',
    items: [
      { name: 'Trabajadores', href: '/workers',   icon: Users           },
      { name: 'Contratación', href: '/hiring',    icon: UserPlus        },
      { name: 'Faenas',       href: '/sites',     icon: HardHat         },
      { name: 'Asistencia',   href: '/attendance',icon: Calendar        },
    ]
  },
  {
    title: 'Legal y Contratos',
    items: [
      { name: 'Documentos',    href: '/documents', icon: FileText        },
      { name: 'Contratos',     href: '/contracts', icon: FileSignature   },
    ]
  },
  {
    title: 'Remuneraciones y Términos',
    items: [
      { name: 'Liquidaciones', href: '/payslips',  icon: Wallet          },
      { name: 'Anticipos',     href: '/advances',  icon: Banknote        },
      { name: 'Vacaciones',    href: '/vacations', icon: TreePalm        },
      { name: 'Finiquitos',    href: '/finiquitos',icon: FileX           },
    ]
  },
  {
    title: 'Logística y Finanzas',
    items: [
      { name: 'Inventario',    href: '/inventory', icon: Package         },
      { name: 'Gastos',        href: '/expenses',  icon: Receipt         },
    ]
  }
]

export default function Sidebar() {
  const { user, signOut } = useAuth()
  const { faenas, activeFaena, activeFaenaId, setActiveFaena } = useFaena()
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const initials = user?.email?.charAt(0).toUpperCase() || 'U'

  return (
    <div style={{
      width: 256,
      minHeight: '100vh',
      backgroundColor: '#ffffff',
      borderRight: '1px solid #E2E8F0',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
    }}>

      {/* Logo */}
      <div style={{ padding: '24px 24px 20px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'center' }}>
        <div className="flex items-center gap-2.5">
          <img src={mecwellLogo} alt="Mecwell Logo" style={{ maxHeight: 75, maxWidth: '100%', objectFit: 'contain' }} />
        </div>
      </div>

      {/* Selector de Faena */}
      <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid #F1F5F9', position: 'relative' }}>
        <p style={{ fontSize: 10, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8, paddingLeft: 4 }}>
          Faena Activa
        </p>
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          style={{
            width: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '9px 12px',
            backgroundColor: activeFaena ? '#EFF6FF' : '#F8FAFC',
            border: `1px solid ${activeFaena ? '#BFDBFE' : '#E2E8F0'}`,
            borderRadius: 8,
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}
        >
          <div className="flex items-center gap-2 truncate">
            {activeFaena ? (
              <>
                <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: '#059669', flexShrink: 0 }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: '#1E4D8C', truncate: true }}>{activeFaena.name}</span>
              </>
            ) : (
              <>
                <Globe style={{ width: 14, height: 14, color: '#64748B', flexShrink: 0 }} />
                <span style={{ fontSize: 12, fontWeight: 500, color: '#64748B' }}>Vista Global</span>
              </>
            )}
          </div>
          <ChevronDown style={{
            width: 14, height: 14, color: '#94A3B8', flexShrink: 0,
            transform: dropdownOpen ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.15s'
          }} />
        </button>

        {dropdownOpen && (
          <div style={{
            position: 'absolute', left: 16, right: 16, top: '100%',
            backgroundColor: '#fff',
            border: '1px solid #E2E8F0',
            borderRadius: 10,
            boxShadow: '0 8px 24px rgba(30,77,140,0.12)',
            zIndex: 100,
            overflow: 'hidden',
          }}>
            <button
              onClick={() => { setActiveFaena(null); setDropdownOpen(false) }}
              style={{
                width: '100%', textAlign: 'left',
                padding: '10px 14px',
                display: 'flex', alignItems: 'center', gap: 8,
                fontSize: 13, fontWeight: !activeFaenaId ? 600 : 400,
                color: !activeFaenaId ? '#1E4D8C' : '#64748B',
                backgroundColor: !activeFaenaId ? '#EFF6FF' : 'transparent',
                border: 'none', cursor: 'pointer',
              }}
            >
              <Globe style={{ width: 14, height: 14 }} />
              Vista Global (Todas)
            </button>
            <div style={{ height: 1, backgroundColor: '#F1F5F9' }} />
            {faenas.map(f => (
              <button
                key={f.id}
                onClick={() => { setActiveFaena(f.id); setDropdownOpen(false) }}
                style={{
                  width: '100%', textAlign: 'left',
                  padding: '10px 14px',
                  display: 'flex', alignItems: 'center', gap: 8,
                  fontSize: 13, fontWeight: activeFaenaId === f.id ? 600 : 400,
                  color: activeFaenaId === f.id ? '#1E4D8C' : '#374151',
                  backgroundColor: activeFaenaId === f.id ? '#EFF6FF' : 'transparent',
                  border: 'none', cursor: 'pointer',
                }}
              >
                <span style={{
                  width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
                  backgroundColor: f.status === 'active' ? '#059669' : '#CBD5E1'
                }} />
                <span style={{ flex: 1 }}>{f.name}</span>
                {f.location && <span style={{ fontSize: 11, color: '#CBD5E1' }}>{f.location}</span>}
              </button>
            ))}
            {faenas.length === 0 && (
              <p style={{ padding: '10px 14px', fontSize: 12, color: '#94A3B8', fontStyle: 'italic' }}>Sin faenas registradas</p>
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '12px 10px', overflowY: 'auto' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {navigationGroups.map((group) => (
            <div key={group.title} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <h3 style={{ 
                padding: '0 12px', 
                fontSize: 10, 
                fontWeight: 700, 
                color: '#94A3B8', 
                textTransform: 'uppercase', 
                letterSpacing: '0.05em',
                marginBottom: 4
              }}>
                {group.title}
              </h3>
              {group.items.map((item) => {
                const Icon = item.icon
                return (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    end={item.href === '/'}
                    onClick={() => setDropdownOpen(false)}
                    style={({ isActive }) => ({
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '8px 12px',
                      borderRadius: 8,
                      textDecoration: 'none',
                      fontSize: 13,
                      fontWeight: isActive ? 600 : 500,
                      color: isActive ? '#1E4D8C' : '#475569',
                      backgroundColor: isActive ? '#EFF6FF' : 'transparent',
                      transition: 'all 0.15s',
                    })}
                    className={({ isActive }) => !isActive ? 'hover:bg-slate-50 hover:text-gray-800' : ''}
                  >
                    <Icon style={{ width: 17, height: 17, flexShrink: 0 }} />
                    {item.name}
                  </NavLink>
                )
              })}
            </div>
          ))}
        </div>
      </nav>

      {/* User / Footer */}
      <div style={{ borderTop: '1px solid #F1F5F9', padding: '14px 16px' }}>
        <div className="flex items-center gap-3 mb-3">
          <div style={{
            width: 34, height: 34, borderRadius: '50%',
            backgroundColor: '#1E4D8C',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 700, color: '#fff', flexShrink: 0,
          }}>
            {initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: '#1A1C20', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.email?.split('@')[0] || 'Usuario'}
            </p>
            {activeFaena && (
              <p style={{ fontSize: 11, color: '#059669', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {activeFaena.name}
              </p>
            )}
          </div>
        </div>
        <button
          onClick={signOut}
          className="flex items-center gap-2 w-full"
          style={{
            padding: '8px 10px', borderRadius: 8, border: 'none', cursor: 'pointer',
            backgroundColor: 'transparent', fontSize: 12, fontWeight: 500,
            color: '#94A3B8', transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#FEE2E2'; e.currentTarget.style.color = '#DC2626' }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#94A3B8' }}
        >
          <LogOut style={{ width: 15, height: 15 }} />
          Cerrar Sesión
        </button>
      </div>
    </div>
  )
}
