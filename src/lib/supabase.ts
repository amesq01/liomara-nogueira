import { createClient } from '@supabase/supabase-js'

// Substitua estas variáveis pelas suas credenciais do Supabase
// Você pode encontrá-las no painel do Supabase em Settings > API
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
