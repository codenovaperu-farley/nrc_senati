import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { supabase, isSupabaseConfigured, supabaseConfigError } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {

    // Guarda: si Supabase no está configurado, dar un mensaje claro en vez de 500
    if (!isSupabaseConfigured) {
      return supabaseConfigError()
    }
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const { nombre, totalRegistros } = await request.json()

    // Desactivar archivo anterior
    await supabase.from('archivos').update({ activo: false }).eq('activo', true)

    const { data: archivo, error } = await supabase
      .from('archivos')
      .insert({ nombre, total_registros: totalRegistros, activo: true })
      .select('id')
      .single()

    if (error) {
      console.error('Error creando archivo:', error)
      return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
    }

    return NextResponse.json({ id: archivo.id })
  } catch {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}
