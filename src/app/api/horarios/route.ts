import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

const EXPECTED_COLUMNS = [
  'PERIODO', 'NRC', 'DESCRIPCIÓN_CURSO', 'ID_INST', 'INSTRUCTOR',
  'TIPO_REUNION', 'INICIO', 'FIN', 'HORARIO', 'EDIFICIO', 'SALON',
  'LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB', 'DOM'
]

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const nrc = searchParams.get('nrc')
    const periodo = searchParams.get('periodo')
    const instructor = searchParams.get('instructor')
    const tipoReunion = searchParams.get('tipoReunion')
    const edificio = searchParams.get('edificio')

    if (!nrc) {
      return NextResponse.json({ error: 'El parámetro NRC es requerido' }, { status: 400 })
    }

    let query = supabase.from('horarios').select('*').eq('nrc', nrc)

    if (periodo) query = query.eq('periodo', periodo)
    if (tipoReunion) query = query.eq('tipo_reunion', tipoReunion)
    if (edificio) query = query.eq('edificio', edificio)
    if (instructor) query = query.ilike('instructor', `%${instructor}%`)

    query = query.order('periodo', { ascending: false })

    const { data: registros, error } = await query

    if (error) {
      console.error('Error en búsqueda:', error)
      return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
    }

    // Mapear snake_case a camelCase para el frontend
    const mapped = (registros || []).map(r => ({
      id: r.id,
      periodo: r.periodo,
      nrc: r.nrc,
      descripcionCurso: r.descripcion_curso,
      idInst: r.id_inst,
      instructor: r.instructor,
      tipoReunion: r.tipo_reunion,
      inicio: r.inicio,
      fin: r.fin,
      horario: r.horario,
      edificio: r.edificio,
      salon: r.salon,
      lun: r.lun,
      mar: r.mar,
      mie: r.mie,
      jue: r.jue,
      vie: r.vie,
      sab: r.sab,
      dom: r.dom,
    }))

    return NextResponse.json({ registros: mapped, total: mapped.length })
  } catch (error) {
    console.error('Error en búsqueda:', error)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const { records, archivoId } = await request.json()

    if (!records || !Array.isArray(records) || records.length === 0) {
      return NextResponse.json({ error: 'No hay registros para insertar' }, { status: 400 })
    }

    // Desactivar archivo anterior
    await supabase.from('archivos').update({ activo: false }).eq('activo', true)

    // Eliminar registros antiguos
    await supabase.from('horarios').delete().neq('id', '00000000-0000-0000-0000-000000000000')

    // Insertar nuevos registros en lotes
    const BATCH_SIZE = 200
    for (let i = 0; i < records.length; i += BATCH_SIZE) {
      const batch = records.slice(i, i + BATCH_SIZE)
      const rows = batch.map((r: Record<string, unknown>) => ({
        periodo: (r.PERIODO as string) || null,
        nrc: (r.NRC as string) || '',
        descripcion_curso: (r['DESCRIPCIÓN_CURSO'] as string) || null,
        id_inst: (r.ID_INST as string) || null,
        instructor: (r.INSTRUCTOR as string) || null,
        tipo_reunion: (r.TIPO_REUNION as string) || null,
        inicio: (r.INICIO as string) || null,
        fin: (r.FIN as string) || null,
        horario: (r.HORARIO as string) || null,
        edificio: (r.EDIFICIO as string) || null,
        salon: (r.SALON as string) || null,
        lun: (r.LUN as string) || null,
        mar: (r.MAR as string) || null,
        mie: (r.MIE as string) || null,
        jue: (r.JUE as string) || null,
        vie: (r.VIE as string) || null,
        sab: (r.SAB as string) || null,
        dom: (r.DOM as string) || null,
        archivo_id: archivoId,
      }))

      const { error } = await supabase.from('horarios').insert(rows)
      if (error) {
        console.error('Error insertando lote:', error)
        return NextResponse.json({ error: 'Error al insertar registros' }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true, total: records.length })
  } catch (error) {
    console.error('Error al guardar horarios:', error)
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
  } catch (error) {
    console.error('Error al eliminar horarios:', error)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}

// Validar y obtener vista previa del Excel
export async function PUT(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No se proporcionó archivo' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const XLSX = await import('xlsx')
    const workbook = XLSX.read(buffer, { type: 'buffer' })
    const sheetName = workbook.SheetNames[0]
    const sheet = workbook.Sheets[sheetName]
    const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' })

    if (data.length === 0) {
      return NextResponse.json({ error: 'El archivo está vacío' }, { status: 400 })
    }

    const headers = Object.keys(data[0])
    const missingCols = EXPECTED_COLUMNS.filter(c => !headers.includes(c))
    const extraCols = headers.filter(h => !EXPECTED_COLUMNS.includes(h))

    if (missingCols.length > 0) {
      return NextResponse.json({
        error: `Columnas faltantes: ${missingCols.join(', ')}`,
      }, { status: 400 })
    }

    const preview = data.slice(0, 10).map(row => {
      const clean: Record<string, unknown> = {}
      for (const col of EXPECTED_COLUMNS) {
        clean[col] = row[col] ?? ''
      }
      return clean
    })

    return NextResponse.json({
      valid: true,
      totalRows: data.length,
      preview,
      extraCols,
    })
  } catch (error) {
    console.error('Error al validar Excel:', error)
    return NextResponse.json({ error: 'Error al procesar el archivo Excel' }, { status: 500 })
  }
}
