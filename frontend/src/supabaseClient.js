import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export const apiFetch = async (url, options = {}) => {
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token
  
  const headers = {
    ...options.headers,
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  }
  
  // Reemplazar la URL base local por la variable de entorno en producción si está definida
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'
  const targetUrl = url.replace(/^http:\/\/(127\.0\.0\.1|localhost):8000/, apiBaseUrl)
  
  return fetch(targetUrl, { ...options, headers })
}
