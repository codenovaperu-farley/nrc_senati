import { NextRequest, NextResponse } from 'next/server'
import { verifyCredentials, createToken } from '@/lib/auth'
import { isSupabaseConfigured, supabaseConfigError } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Correo y contraseña son requeridos' }, { status: 400 })
    }

    // Guarda: si Supabase no está configurado, dar un mensaje claro en vez de 500
    if (!isSupabaseConfigured) {
      return supabaseConfigError()
    }

    const user = await verifyCredentials(email, password)
    if (!user) {
      return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 })
    }

    const token = await createToken(user)
    const response = NextResponse.json({ success: true, user: { email: user.email, name: user.name, role: user.role } })
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 8 * 60 * 60, // 8 horas
      path: '/',
    })
    return response
  } catch {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true })
  response.cookies.set('auth-token', '', { maxAge: 0, path: '/' })
  return response
}
