import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { supabase, isSupabaseConfigured, supabaseConfigError } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

/**
 * Bootstrap de primer usuario (solo funciona cuando la tabla users está vacía).
 *
 * Uso tras desplegar en Vercel:
 *   https://tu-app.vercel.app/api/setup?email=tu@correo.com&password=tuclave
 *
 * Por seguridad, si ya existe al menos un usuario este endpoint no hace nada.
 */
export async function GET(request: NextRequest) {
  try {
    if (!isSupabaseConfigured) {
      return supabaseConfigError()
    }

    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')?.trim().toLowerCase()
    const password = searchParams.get('password')

    if (!email || !password) {
      return NextResponse.json(
        {
          error: 'Faltan parámetros. Usa: /api/setup?email=tu@correo.com&password=tuclave',
          ejemplo: '/api/setup?email=admin@senati.edu&password=MiClave2024',
        },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 6 caracteres' },
        { status: 400 }
      )
    }

    // ¿La tabla users existe?
    const { count, error: countError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })

    if (countError) {
      return NextResponse.json(
        {
          error:
            'No se pudo leer la tabla "users". Probablemente no ejecutaste el script supabase-setup.sql. ' +
            'Ábrelo en Supabase → SQL Editor y ejecútalo completo. Detalle: ' + countError.message,
        },
        { status: 500 }
      )
    }

    // Solo el PRIMER usuario puede crearse aquí (rol admin)
    if ((count || 0) > 0) {
      return NextResponse.json(
        {
          success: false,
          mensaje:
            'Ya existe al menos un usuario registrado. Por seguridad, este endpoint ya no crea más usuarios. ' +
            'Si olvidaste tu contraseña, borra el usuario desde Supabase (Table Editor → users) y vuelve a abrir este enlace.',
        },
        { status: 200 }
      )
    }

    const hash = await bcrypt.hash(password, 10)
    const { error: insertError } = await supabase
      .from('users')
      .insert({ email, password: hash, name: 'Administrador', role: 'admin' })

    if (insertError) {
      return NextResponse.json(
        { error: 'No se pudo crear el usuario: ' + insertError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      mensaje: `Usuario admin creado: ${email}. Ya puedes iniciar sesión en la página principal.`,
    })
  } catch (error) {
    console.error('Error en /api/setup:', error)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}
