import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const { data: archivo, error } = await supabase
      .from('archivos')
      .select('id, nombre, fecha_carga, activo')
      .eq('activo', true)
      .single()

    if (error || !archivo) {
      return NextResponse.json({ archivo: null })
    }

    // Contar registros asociados
    const { count } = await supabase
      .from('horarios')
      .select('*', { count: 'exact', head: true })
      .eq('archivo_id', archivo.id)

    return NextResponse.json({
      archivo: {
        id: archivo.id,
        nombre: archivo.nombre,
        fechaCarga: archivo.fecha_carga,
        totalRegistros: count || 0,
      },
    })
  } catch {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    await supabase.from('horarios').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabase.from('archivos').update({ activo: false }).eq('activo', true)

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}
