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
