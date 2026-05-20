import { apiFetch, resolveFileUrl } from '../supabaseClient'
import { useState, useEffect } from 'react'
import { FileDown, FileText, FolderOpen, Plus, Clock, CheckCircle2, AlertCircle } from 'lucide-react'
import DocumentModal from '../components/DocumentModal'
import { PageWrapper, PageHeader, PrimaryButton, MwTable, MwTr, MwTd } from '../components/MecwellUI'

function getDocStatus(expDateStr) {
  if (!expDateStr) return { label: 'Sin fecha', bg: '#F1F5F9', text: '#64748B', Icon: FileText }
  const today = new Date(); today.setHours(0,0,0,0)
  const diffDays = Math.ceil((new Date(expDateStr) - today) / 86400000)
  if (diffDays < 0)  return { label: 'Vencido',         bg: '#FEE2E2', text: '#991B1B', Icon: AlertCircle,   days: Math.abs(diffDays) }
  if (diffDays <= 15) return { label: `Vence en ${diffDays}d`, bg: '#FEF3C7', text: '#92400E', Icon: Clock, days: diffDays }
  return                      { label: 'Vigente',         bg: '#D1FAE5', text: '#065F46', Icon: CheckCircle2, days: diffDays }
}

export default function DocumentsList() {
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleDownloadFile = async (e, url) => {
    e.preventDefault()
    if (!url) return
    try {
      const resolved = await resolveFileUrl(url)
      window.open(resolved, '_blank', 'noopener,noreferrer')
    } catch (err) {
      console.error("Error al abrir el archivo:", err)
    }
  }

  useEffect(() => {
    apiFetch('http://127.0.0.1:8000/api/v1/documents/')
      .then(r => r.json())
      .then(data => { setDocuments(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(err => { console.error(err); setLoading(false) })
  }, [])

  const vencidos   = documents.filter(d => d.expiration_date && Math.ceil((new Date(d.expiration_date) - new Date()) / 86400000) < 0).length
  const porVencer  = documents.filter(d => { const diff = Math.ceil((new Date(d.expiration_date) - new Date()) / 86400000); return diff >= 0 && diff <= 15 }).length

  return (
    <PageWrapper>
      <PageHeader
        title="Documentos y Credenciales"
        subtitle="Control de vigencia de exámenes médicos, inducciones y certificaciones"
        action={
          <PrimaryButton onClick={() => setIsModalOpen(true)}>
            <Plus style={{ width: 15, height: 15 }} /> Adjuntar Documento
          </PrimaryButton>
        }
      />

      {/* Summary pills */}
      {documents.length > 0 && (
        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
          <span style={{ padding: '5px 14px', borderRadius: 99, fontSize: 12, fontWeight: 600, backgroundColor: '#D1FAE5', color: '#065F46' }}>
            ✓ {documents.length - vencidos - porVencer} vigentes
          </span>
          {porVencer > 0 && (
            <span style={{ padding: '5px 14px', borderRadius: 99, fontSize: 12, fontWeight: 600, backgroundColor: '#FEF3C7', color: '#92400E' }}>
              ⚠ {porVencer} por vencer
            </span>
          )}
          {vencidos > 0 && (
            <span style={{ padding: '5px 14px', borderRadius: 99, fontSize: 12, fontWeight: 600, backgroundColor: '#FEE2E2', color: '#991B1B' }}>
              ✕ {vencidos} vencidos
            </span>
          )}
        </div>
      )}

      <MwTable
        loading={loading}
        headers={['Trabajador', 'Documento', 'Vencimiento', 'Estado', { label: 'Archivo', right: true }]}
      >
        {documents.length === 0 && !loading ? (
          <tr>
            <td colSpan={5}>
              <div style={{ padding: '60px 20px', textAlign: 'center' }}>
                <FolderOpen style={{ width: 40, height: 40, color: '#E2E8F0', margin: '0 auto 12px' }} />
                <p style={{ fontSize: 14, fontWeight: 600, color: '#64748B', marginBottom: 6 }}>Sin documentos registrados</p>
                <p style={{ fontSize: 13, color: '#94A3B8', marginBottom: 20 }}>Adjunta exámenes o certificaciones para llevar un control visual.</p>
                <PrimaryButton onClick={() => setIsModalOpen(true)}>
                  <Plus style={{ width: 14, height: 14 }} /> Subir primer documento
                </PrimaryButton>
              </div>
            </td>
          </tr>
        ) : documents.map(doc => {
          const st = getDocStatus(doc.expiration_date)
          const workerName = doc.workers ? `${doc.workers.first_name} ${doc.workers.last_name}` : '—'
          const initials = doc.workers ? `${doc.workers.first_name[0]}${doc.workers.last_name[0]}` : '?'
          return (
            <MwTr key={doc.id}>
              <MwTd>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                    backgroundColor: '#EFF6FF',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 700, color: '#1E4D8C',
                  }}>{initials}</div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#1A1C20' }}>{workerName}</p>
                    {doc.workers?.rut && <p style={{ fontSize: 11, color: '#94A3B8' }}>{doc.workers.rut}</p>}
                  </div>
                </div>
              </MwTd>
              <MwTd>
                <p style={{ fontSize: 13, fontWeight: 500, color: '#1A1C20' }}>{doc.name}</p>
                <p style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>{doc.document_type}</p>
              </MwTd>
              <MwTd muted>
                {doc.expiration_date
                  ? new Date(doc.expiration_date).toLocaleDateString('es-CL')
                  : '—'}
              </MwTd>
              <MwTd>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600,
                  backgroundColor: st.bg, color: st.text,
                }}>
                  <st.Icon style={{ width: 12, height: 12 }} />
                  {st.label}
                </span>
              </MwTd>
              <MwTd right>
                {doc.file_url ? (
                  <a href="#" onClick={(e) => handleDownloadFile(e, doc.file_url)}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      padding: '5px 12px', borderRadius: 6,
                      backgroundColor: '#EFF6FF', color: '#1E4D8C',
                      fontSize: 12, fontWeight: 600, textDecoration: 'none',
                    }}
                  >
                    <FileDown style={{ width: 13, height: 13 }} /> Descargar
                  </a>
                ) : (
                  <span style={{ fontSize: 12, color: '#CBD5E1', fontStyle: 'italic' }}>Sin adjunto</span>
                )}
              </MwTd>
            </MwTr>
          )
        })}
      </MwTable>

      <DocumentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={d => setDocuments([...documents, d])}
      />
    </PageWrapper>
  )
}
