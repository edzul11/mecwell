import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

export const apiFetch = async (url, options = {}) => {
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token
  
  const headers = {
    ...options.headers,
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  }
  
  const targetUrl = url.startsWith('/') 
    ? `${API_BASE_URL}${url}` 
    : url.replace(/^http:\/\/(127\.0\.0\.1|localhost):8000/, API_BASE_URL)
  
  return fetch(targetUrl, { ...options, headers })
}

/**
 * Sube un archivo a un bucket específico en Supabase Storage
 * @param {string} bucket - Nombre del bucket ('documents' o 'receipts')
 * @param {string} path - Ruta interna y nombre del archivo
 * @param {File} file - Objeto del archivo nativo de JS
 * @returns {Promise<string>} Protocolo unificado del archivo subido (e.g., supabase://documents/path)
 */
export const uploadToSupabaseStorage = async (bucket, path, file) => {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: true
    })
  if (error) throw error

  // Retornamos un formato unificado para independizar el dominio y facilitar políticas RLS
  return `supabase://${bucket}/${data.path}`
}

/**
 * Resuelve una URL o ruta de almacenamiento (local o Supabase) a una URL accesible por el navegador
 * @param {string} fileUrlOrPath - URL completa o ruta de Supabase
 * @returns {Promise<string>} URL firmada o pública ejecutable por el navegador
 */
export const resolveFileUrl = async (fileUrlOrPath) => {
  if (!fileUrlOrPath) return ''
  
  // Si es una ruta relativa heredada del servidor local (/uploads/...)
  if (fileUrlOrPath.startsWith('/')) {
    return `${API_BASE_URL}${fileUrlOrPath}`
  }
  
  // Si ya es una URL HTTP directa que no pertenece a Supabase
  if (fileUrlOrPath.startsWith('http') && !fileUrlOrPath.includes('.supabase.co/storage/v1/object/')) {
    return fileUrlOrPath
  }
  
  let bucket = ''
  let path = ''
  
  if (fileUrlOrPath.startsWith('supabase://')) {
    const clean = fileUrlOrPath.replace('supabase://', '')
    const firstSlash = clean.indexOf('/')
    if (firstSlash !== -1) {
      bucket = clean.substring(0, firstSlash)
      path = clean.substring(firstSlash + 1)
    }
  } else if (fileUrlOrPath.includes('.supabase.co/storage/v1/object/')) {
    try {
      const url = new URL(fileUrlOrPath)
      const parts = url.pathname.split('/')
      const typeIndex = parts.indexOf('object')
      if (typeIndex !== -1 && parts.length > typeIndex + 2) {
        bucket = parts[typeIndex + 2]
        path = parts.slice(typeIndex + 3).join('/')
      }
    } catch (e) {
      console.error("Error al parsear URL de Supabase:", e)
    }
  } else if (fileUrlOrPath.startsWith('workers/') || fileUrlOrPath.startsWith('expenses/')) {
    bucket = fileUrlOrPath.startsWith('workers/') ? 'documents' : 'receipts'
    path = fileUrlOrPath
  } else {
    return fileUrlOrPath
  }
  
  if (bucket && path) {
    if (bucket === 'documents') {
      // El bucket de documentos es privado. Generamos una URL firmada de 5 minutos
      try {
        const { data, error } = await supabase.storage
          .from(bucket)
          .createSignedUrl(path, 300)
        if (error) throw error
        return data.signedUrl
      } catch (err) {
        console.error('Error al generar URL firmada para documentos privados:', err)
        // Fallback a URL pública en caso de que el bucket sea público
        const { data } = supabase.storage.from(bucket).getPublicUrl(path)
        return data.publicUrl
      }
    } else {
      // El bucket de gastos (receipts) es público. Retornamos URL pública permanente
      const { data } = supabase.storage.from(bucket).getPublicUrl(path)
      return data.publicUrl
    }
  }
  
  return fileUrlOrPath
}

