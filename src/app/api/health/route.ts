import { NextResponse } from 'next/server'
import { isSupabaseConfigured, missingEnvVars } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

/**
 * Endpoint de diagnóstico: abre https://tu-app.vercel.app/api/health
 * para saber exactamente qué variable de entorno falta en Vercel.
 * Nunca expone valores, solo indica qué falta.
 */
export async function GET() {
  const configured = isSupabaseConfigured
  return NextResponse.json(
    {
      status: configured ? 'ok' : 'config_incompleta',
      mensaje: configured
        ? 'Supabase está configurado. Si no puedes iniciar sesión, verifica que ejecutaste supabase-setup.sql y creaste tu usuario con /api/setup.'
        : 'Faltan variables de entorno en Vercel (Settings → Environment Variables). Agrega las que aparecen en "faltantes" y vuelve a desplegar.',
      supabase_configurado: configured,
      faltantes: configured ? [] : missingEnvVars,
      instrucciones: [
        '1. Crea las tablas en Supabase ejecutando el archivo supabase-setup.sql (SQL Editor).',
        '2. En Vercel agrega NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY y JWT_SECRET.',
        '3. Haz "Redeploy" del proyecto en Vercel.',
        '4. Crea tu usuario admin abriendo: /api/setup?email=tu@correo.com&password=tuclave',
      ],
    },
    { status: configured ? 200 : 503 }
  )
}
