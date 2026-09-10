import { NextResponse } from 'next/server'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

/**
 * Indica si Supabase está configurado correctamente.
 * Las rutas API usan esta bandera para responder con un mensaje claro
 * (503) en lugar de crashear con "Error del servidor" sin explicación.
 */
export const isSupabaseConfigured = Boolean(
  supabaseUrl.startsWith('http') && supabaseAnonKey
)

/**
 * Variables faltantes (para diagnóstico en /api/health y mensajes de error).
 */
export const missingEnvVars = [
  ...(supabaseUrl.startsWith('http') ? [] : ['NEXT_PUBLIC_SUPABASE_URL']),
  ...(supabaseAnonKey ? [] : ['NEXT_PUBLIC_SUPABASE_ANON_KEY']),
  ...(supabaseServiceKey ? [] : ['SUPABASE_SERVICE_ROLE_KEY (opcional)']),
]

function makeClient(key: string): SupabaseClient {
  // createClient('') lanza una excepción que tumba toda la app.
  // Con un placeholder evitamos el crash al importar y las rutas API
  // pueden responder con errores claros y en español.
  const url = supabaseUrl.startsWith('http')
    ? supabaseUrl
    : 'https://placeholder.supabase.co'
  return createClient(url, key || 'placeholder-anon-key', {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export const supabase = makeClient(supabaseAnonKey)
export const supabaseAdmin = makeClient(supabaseServiceKey)

/**
 * Respuesta estándar para cuando el servidor no tiene Supabase configurado.
 * Así el usuario ve EXACTAMENTE qué falta en lugar de un 500 genérico.
 */
export function supabaseConfigError() {
  return NextResponse.json(
    {
      error:
        'El servidor no está configurado: faltan las variables de entorno de Supabase. ' +
        'Agrégalas en Vercel → tu proyecto → Settings → Environment Variables ' +
        '(NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY) y vuelve a desplegar. ' +
        'Puedes verificar el estado en /api/health.',
    },
    { status: 503 }
  )
}
