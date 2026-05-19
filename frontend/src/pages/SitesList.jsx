import { apiFetch } from '../supabaseClient'
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Plus, ChevronRight, MapPin, Users, Trash2 } from 'lucide-react'
import SiteModal from '../components/SiteModal'
import { PageWrapper, PageHeader, PrimaryButton, MwTable, MwTr, MwTd, StatusBadge } from '../components/MecwellUI'

export default function SitesList() {
  const [sites, setSites] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    apiFetch('http://127.0.0.1:8000/api/v1/sites/')
      .then(r => r.json())
      .then(data => { setSites(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(err => { console.error(err); setLoading(false) })
  }, [])

  const handleDelete = async (siteId, siteName) => {
    const confirmed = window.confirm(`¿Estás seguro de que deseas eliminar la faena "${siteName}"?\nLos trabajadores no se eliminarán, quedarán desasociados.`);
    if (!confirmed) return;

    try {
      const res = await apiFetch(`http://127.0.0.1:8000/api/v1/sites/${siteId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setSites(prev => prev.filter(s => s.id !== siteId));
      } else {
        const errData = await res.json();
        alert(`Error al eliminar la faena: ${errData.detail || 'Error de servidor'}`);
      }
    } catch (err) {
      console.error(err);
      alert('Error de conexión al eliminar la faena.');
    }
  };

  return (
    <PageWrapper>
      <PageHeader
        title="Faenas"
        subtitle={`${sites.length} proyectos registrados`}
        action={
          <PrimaryButton onClick={() => setIsModalOpen(true)}>
            <Plus style={{ width: 15, height: 15 }} /> Añadir Faena
          </PrimaryButton>
        }
      />

      <MwTable
        loading={loading}
        headers={['Nombre del Proyecto', 'Ubicación', 'Estado', { label: '', right: true }]}
      >
        {sites.length === 0 ? (
          <tr>
            <td colSpan={4} style={{ padding: '48px 20px', textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>
              No hay faenas registradas.
            </td>
          </tr>
        ) : sites.map(site => (
          <MwTr key={site.id}>
            <MwTd>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                  backgroundColor: '#EFF6FF',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Users style={{ width: 16, height: 16, color: '#1E4D8C' }} />
                </div>
                <Link to={`/sites/${site.id}`} style={{ fontSize: 13, fontWeight: 600, color: '#1A1C20', textDecoration: 'none' }}
                  onMouseEnter={e => e.target.style.color = '#1E4D8C'}
                  onMouseLeave={e => e.target.style.color = '#1A1C20'}
                >
                  {site.name}
                </Link>
              </div>
            </MwTd>
            <MwTd>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 13, color: '#64748B' }}>
                <MapPin style={{ width: 13, height: 13 }} />
                {site.location || '—'}
              </span>
            </MwTd>
            <MwTd><StatusBadge status={site.status || 'active'} /></MwTd>
            <MwTd right>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 16 }}>
                <Link to={`/sites/${site.id}`} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  fontSize: 12, fontWeight: 600, color: '#1E4D8C', textDecoration: 'none',
                }}>
                  Ver Faena <ChevronRight style={{ width: 14, height: 14 }} />
                </Link>
                <button
                  onClick={() => handleDelete(site.id, site.name)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    padding: 4, borderRadius: 6, display: 'inline-flex', alignItems: 'center',
                    color: '#94A3B8', transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = '#EF4444'}
                  onMouseLeave={e => e.currentTarget.style.color = '#94A3B8'}
                  title="Eliminar Faena"
                >
                  <Trash2 style={{ width: 15, height: 15 }} />
                </button>
              </div>
            </MwTd>
          </MwTr>
        ))}
      </MwTable>

      <SiteModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={s => setSites([...sites, s])} />
    </PageWrapper>
  )
}
