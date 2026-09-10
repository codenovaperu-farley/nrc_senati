'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Upload, FileSpreadsheet, Trash2, CheckCircle, AlertCircle, Eye, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface ArchivoInfo {
  id: string
  nombre: string
  fechaCarga: string
  totalRegistros: number
}

const COLUMN_LABELS: Record<string, string> = {
  PERIODO: 'Período',
  NRC: 'NRC',
  'DESCRIPCIÓN_CURSO': 'Curso',
  ID_INST: 'ID Inst.',
  INSTRUCTOR: 'Instructor',
  TIPO_REUNION: 'Tipo Reunión',
  INICIO: 'Inicio',
  FIN: 'Fin',
  HORARIO: 'Horario',
  EDIFICIO: 'Edificio',
  SALON: 'Salón',
  LUN: 'Lun',
  MAR: 'Mar',
  MIE: 'Mié',
  JUE: 'Jue',
  VIE: 'Vie',
  SAB: 'Sáb',
  DOM: 'Dom',
}

const DISPLAY_COLUMNS = ['PERIODO', 'NRC', 'DESCRIPCIÓN_CURSO', 'INSTRUCTOR', 'HORARIO', 'EDIFICIO']

export default function ExcelUploader() {
  const [archivo, setArchivo] = useState<ArchivoInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [preview, setPreview] = useState<Record<string, unknown>[] | null>(null)
  const [previewTotal, setPreviewTotal] = useState(0)
  const [showPreviewDialog, setShowPreviewDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const fetchArchivo = useCallback(async () => {
    try {
      const res = await fetch('/api/archivos')
      if (res.ok) {
        const data = await res.json()
        setArchivo(data.archivo)
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchArchivo()
  }, [fetchArchivo])

  const validateFile = async (file: File) => {
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/horarios', { method: 'PUT', body: formData })
      const data = await res.json()
      if (!res.ok) {
        toast({ title: 'Error de validación', description: data.error, variant: 'destructive' })
        return
      }
      setPreview(data.preview)
      setPreviewTotal(data.totalRows)
      setPendingFile(file)
      setShowPreviewDialog(true)
    } catch {
      toast({ title: 'Error', description: 'No se pudo procesar el archivo', variant: 'destructive' })
    } finally {
      setUploading(false)
    }
  }

  const confirmUpload = async () => {
    if (!pendingFile) return
    setUploading(true)
    try {
      const buffer = await pendingFile.arrayBuffer()
      const XLSX = await import('xlsx')
      const workbook = XLSX.read(buffer, { type: 'array' })
      const sheet = workbook.Sheets[workbook.SheetNames[0]]
      const records = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' })

      // Crear archivo en DB
      const archivoRes = await fetch('/api/archivos/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: pendingFile.name, totalRegistros: records.length }),
      })
      const archivoData = await archivoRes.json()

      // Insertar registros
      const res = await fetch('/api/horarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ records, archivoId: archivoData.id }),
      })
      const data = await res.json()

      if (!res.ok) {
        toast({ title: 'Error', description: data.error, variant: 'destructive' })
        return
      }

      toast({ title: 'Éxito', description: `Se cargaron ${data.total} registros correctamente` })
      setShowPreviewDialog(false)
      setPendingFile(null)
      setPreview(null)
      fetchArchivo()
    } catch {
      toast({ title: 'Error', description: 'Error al procesar el archivo', variant: 'destructive' })
    } finally {
      setUploading(false)
    }
  }

  const deleteArchivo = async () => {
    try {
      const res = await fetch('/api/archivos', { method: 'DELETE' })
      if (res.ok) {
        toast({ title: 'Eliminado', description: 'El archivo y los registros fueron eliminados' })
        setArchivo(null)
        fetchArchivo()
      }
    } catch {
      toast({ title: 'Error', description: 'No se pudo eliminar', variant: 'destructive' })
    } finally {
      setShowDeleteDialog(false)
    }
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file && file.name.endsWith('.xlsx')) {
      validateFile(file)
    } else {
      toast({ title: 'Formato inválido', description: 'Solo se aceptan archivos .xlsx', variant: 'destructive' })
    }
  }, [validateFile, toast])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) validateFile(file)
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-PE', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    })
  }

  return (
    <div className="space-y-6">
      {/* Archivo actual */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileSpreadsheet className="h-5 w-5 text-[#0033CC]" />
            Archivo Actual
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Cargando...
            </div>
          ) : archivo ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <p className="font-medium">{archivo.nombre}</p>
                <p className="text-sm text-muted-foreground">
                  Cargado: {formatDate(archivo.fechaCarga)}
                </p>
                <p className="text-sm text-muted-foreground">
                  Registros: <span className="font-semibold text-[#0033CC]">{archivo.totalRegistros.toLocaleString()}</span>
                </p>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowDeleteDialog(true)}
                className="gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Eliminar Excel
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-muted-foreground py-4 justify-center">
              <AlertCircle className="h-4 w-4" />
              No hay ningún archivo cargado
            </div>
          )}
        </CardContent>
      </Card>

      {/* Subir nuevo archivo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Upload className="h-5 w-5 text-[#0033CC]" />
            Subir Nuevo Excel
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={
              `border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
              ${dragOver ? 'border-[#0033CC] bg-[#F0F4FF]' : 'border-muted-foreground/25 hover:border-[#0033CC] hover:bg-[#F0F4FF]/50'}
              ${uploading ? 'pointer-events-none opacity-50' : ''}`
            }
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx"
              onChange={handleFileSelect}
              className="hidden"
            />
            {uploading ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-[#0033CC]" />
                <p className="text-sm text-muted-foreground">Procesando archivo...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Upload className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm font-medium">
                  Arrastra tu archivo .xlsx aquí o haz clic para seleccionar
                </p>
                <p className="text-xs text-muted-foreground">
                  Se reemplazará el archivo anterior completamente
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Diálogo de vista previa */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-[#0033CC]" />
              Vista Previa del Excel
            </DialogTitle>
          </DialogHeader>
          <div className="text-sm text-muted-foreground">
            Total de registros: <span className="font-semibold text-foreground">{previewTotal.toLocaleString()}</span>
            {' '}(mostrando los primeros {preview?.length} registros)
          </div>
          <div className="flex-1 overflow-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="bg-[#1A0B7B] hover:bg-[#1A0B7B]">
                  {DISPLAY_COLUMNS.map(col => (
                    <TableHead key={col} className="whitespace-nowrap text-xs text-white">{COLUMN_LABELS[col]}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {preview?.map((row, i) => (
                  <TableRow key={i}>
                    {DISPLAY_COLUMNS.map(col => (
                      <TableCell key={col} className="whitespace-nowrap text-xs">
                        {(row[col] as string) || '—'}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowPreviewDialog(false)} disabled={uploading}>
              Cancelar
            </Button>
            <Button onClick={confirmUpload} disabled={uploading} className="gap-2 bg-[#0033CC] hover:bg-[#002AA3]">
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
              Confirmar Carga
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de confirmación de eliminación */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar el archivo actual?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminarán todos los registros cargados. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={deleteArchivo} className="bg-destructive text-white hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}