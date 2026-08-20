'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search, ChevronDown, ChevronUp, Loader2, AlertCircle, BookOpen } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Registro {
  id: string
  periodo: string | null
  nrc: string
  descripcionCurso: string | null
  idInst: string | null
  instructor: string | null
  tipoReunion: string | null
  inicio: string | null
  fin: string | null
  horario: string | null
  edificio: string | null
  salon: string | null
  lun: string | null
  mar: string | null
  mie: string | null
  jue: string | null
  vie: string | null
  sab: string | null
  dom: string | null
}

const FIELD_LABELS: Record<string, string> = {
  periodo: 'Período',
  nrc: 'NRC',
  descripcionCurso: 'Descripción del Curso',
  idInst: 'ID Instructor',
  instructor: 'Instructor',
  tipoReunion: 'Tipo de Reunión',
  inicio: 'Fecha Inicio',
  fin: 'Fecha Fin',
  horario: 'Horario',
  edificio: 'Edificio',
  salon: 'Salón',
  lun: 'Lunes',
  mar: 'Martes',
  mie: 'Miércoles',
  jue: 'Jueves',
  vie: 'Viernes',
  sab: 'Sábado',
  dom: 'Domingo',
}

function getDias(registro: Registro): string {
  const dias: string[] = []
  if (registro.lun) dias.push('Lun')
  if (registro.mar) dias.push('Mar')
  if (registro.mie) dias.push('Mié')
  if (registro.jue) dias.push('Jue')
  if (registro.vie) dias.push('Vie')
  if (registro.sab) dias.push('Sáb')
  if (registro.dom) dias.push('Dom')
  return dias.join(' / ')
}

export default function NrcSearch() {
  const [nrc, setNrc] = useState('')
  const [periodo, setPeriodo] = useState('')
  const [instructor, setInstructor] = useState('')
  const [tipoReunion, setTipoReunion] = useState('')
  const [edificio, setEdificio] = useState('')
  const [registros, setRegistros] = useState<Registro[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const { toast } = useToast()

  const buscar = useCallback(async () => {
    if (!nrc.trim()) {
      toast({ title: 'Ingrese un NRC', variant: 'destructive' })
      return
    }

    setLoading(true)
    setSearched(true)
    try {
      const params = new URLSearchParams({ nrc: nrc.trim() })
      if (periodo) params.set('periodo', periodo)
      if (instructor) params.set('instructor', instructor)
      if (tipoReunion) params.set('tipoReunion', tipoReunion)
      if (edificio) params.set('edificio', edificio)

      const res = await fetch(`/api/horarios?${params}`)
      const data = await res.json()

      if (!res.ok) {
        toast({ title: 'Error', description: data.error, variant: 'destructive' })
        setRegistros([])
        return
      }

      setRegistros(data.registros)
      setExpandedId(null)
    } catch {
      toast({ title: 'Error de conexión', description: 'No se pudo conectar al servidor', variant: 'destructive' })
      setRegistros([])
    } finally {
      setLoading(false)
    }
  }, [nrc, periodo, instructor, tipoReunion, edificio, toast])

  const limpiarFiltros = () => {
    setPeriodo('')
    setInstructor('')
    setTipoReunion('')
    setEdificio('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') buscar()
  }

  return (
    <div className="space-y-6">
      {/* Búsqueda principal */}
      <Card className="border-[#0033CC]/20 bg-gradient-to-br from-[#F0F4FF]/80 to-white">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Label htmlFor="nrc-input" className="mb-1.5 block text-sm font-medium text-[#1A0B7B]">
                Ingrese el NRC
              </Label>
              <Input
                id="nrc-input"
                placeholder="Ej: 9853"
                value={nrc}
                onChange={(e) => setNrc(e.target.value)}
                onKeyDown={handleKeyDown}
                className="h-12 text-lg focus-visible:ring-[#0033CC]"
              />
            </div>
            <div className="flex items-end">
              <Button onClick={buscar} disabled={loading} className="h-12 px-8 gap-2 bg-[#0033CC] hover:bg-[#002AA3] text-white">
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
                Buscar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-muted-foreground">Filtros Opcionales</h3>
            <Button variant="ghost" size="sm" onClick={limpiarFiltros} className="text-xs h-7">
              Limpiar filtros
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <Label className="text-xs mb-1 block">Período</Label>
              <Input
                placeholder="Ej: 202605"
                value={periodo}
                onChange={(e) => setPeriodo(e.target.value)}
                className="h-9"
              />
            </div>
            <div>
              <Label className="text-xs mb-1 block">Instructor</Label>
              <Input
                placeholder="Nombre del instructor"
                value={instructor}
                onChange={(e) => setInstructor(e.target.value)}
                className="h-9"
              />
            </div>
            <div>
              <Label className="text-xs mb-1 block">Tipo Reunión</Label>
              <Select value={tipoReunion} onValueChange={setTipoReunion}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CLAS">CLAS</SelectItem>
                  <SelectItem value="VAEE">VAEE</SelectItem>
                  <SelectItem value="REMT">REMT</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs mb-1 block">Edificio</Label>
              <Input
                placeholder="Ej: SV-EV"
                value={edificio}
                onChange={(e) => setEdificio(e.target.value)}
                className="h-9"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resultados */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-[#0033CC]" />
          <p className="text-sm text-muted-foreground">Buscando registros...</p>
        </div>
      )}

      {!loading && searched && registros.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <AlertCircle className="h-10 w-10 text-muted-foreground" />
          <p className="text-muted-foreground font-medium">No se encontraron registros para el NRC ingresado</p>
          <p className="text-sm text-muted-foreground">Verifique que el NRC sea correcto o que exista un archivo cargado</p>
        </div>
      )}

      {!loading && registros.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {registros.length} registro{registros.length > 1 ? 's' : ''} encontrado{registros.length > 1 ? 's' : ''}
          </p>
          {registros.map((registro) => {
            const isExpanded = expandedId === registro.id
            return (
              <Card key={registro.id} className="overflow-hidden transition-all border-[#0033CC]/10">
                {/* Cabecera de la tarjeta */}
                <div
                  className="p-4 sm:p-5 cursor-pointer hover:bg-[#F0F4FF]/50 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : registro.id)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      {/* Descripción del curso - dato principal */}
                      <div className="flex items-center gap-2 mb-2">
                        <BookOpen className="h-4 w-4 text-[#0033CC] shrink-0" />
                        <h3 className="font-semibold text-base text-[#1A0B7B] truncate">
                          {registro.descripcionCurso || 'Sin descripción'}
                        </h3>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary" className="font-mono text-xs bg-[#0033CC] text-white hover:bg-[#0033CC]">
                          NRC: {registro.nrc}
                        </Badge>
                        {registro.periodo && (
                          <Badge variant="outline" className="text-xs border-[#1A0B7B]/30 text-[#1A0B7B]">
                            {registro.periodo}
                          </Badge>
                        )}
                        {registro.horario && (
                          <Badge variant="outline" className="text-xs">
                            {registro.horario}
                          </Badge>
                        )}
                        {registro.edificio && (
                          <Badge variant="outline" className="text-xs">
                            {registro.edificio} {registro.salon ? `- ${registro.salon}` : ''}
                          </Badge>
                        )}
                        {registro.tipoReunion && registro.tipoReunion !== ':-:' && (
                          <Badge className="text-xs bg-[#00D4FF] text-[#1A0B7B] hover:bg-[#00D4FF] font-medium">
                            {registro.tipoReunion}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="shrink-0 text-[#0033CC]">
                      {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                    </Button>
                  </div>
                </div>

                {/* Detalles expandidos */}
                {isExpanded && (
                  <div className="border-t bg-gradient-to-br from-[#F0F4FF]/30 to-white px-4 sm:px-5 py-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                      {Object.entries(FIELD_LABELS).map(([key, label]) => {
                        const value = registro[key as keyof Registro]
                        if (key === 'nrc') return null
                        return (
                          <div key={key} className="flex flex-col">
                            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{label}</span>
                            <span className="text-sm mt-0.5">
                              {key === 'lun' || key === 'mar' || key === 'mie' || key === 'jue' || key === 'vie' || key === 'sab' || key === 'dom'
                                ? (value ? 'Sí' : '—')
                                : (value || '—')}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                    <div className="mt-3 pt-3 border-t">
                      <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Días de Clase</span>
                      <p className="text-sm mt-0.5 font-medium text-[#0033CC]">
                        {getDias(registro) || 'Sin información de días'}
                      </p>
                    </div>
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}