'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { LogOut, GraduationCap, Shield, Loader2, BookOpen } from 'lucide-react'
import ExcelUploader from '@/components/ExcelUploader'
import NrcSearch from '@/components/NrcSearch'

interface User {
  email: string
  name: string | null
  role: 'admin' | 'profesor'
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [loginLoading, setLoginLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [showLogoutDialog, setShowLogoutDialog] = useState(false)

  const checkSession = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me')
      if (res.ok) {
        const data = await res.json()
        setUser(data.user)
      }
    } catch {
      // no session
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { checkSession() }, [checkSession])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError('')
    setLoginLoading(true)
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setLoginError(data.error)
        return
      }
      setUser(data.user)
    } catch {
      setLoginError('Error de conexión')
    } finally {
      setLoginLoading(false)
    }
  }

  const handleLogout = async () => {
    await fetch('/api/auth', { method: 'DELETE' })
    setUser(null)
    setEmail('')
    setPassword('')
    setShowLogoutDialog(false)
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0A0520] via-[#1A0B7B] to-[#0033CC]">
        <Loader2 className="h-8 w-8 animate-spin text-[#00D4FF]" />
      </div>
    )
  }

  // Login screen
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[#0A0520] via-[#1A0B7B] to-[#0033CC]">
        <Card className="w-full max-w-md shadow-2xl border-white/10 bg-white/95 backdrop-blur-sm">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[#0033CC]">
              <BookOpen className="h-7 w-7 text-white" />
            </div>
            <CardTitle className="text-xl text-[#1A0B7B]">Consulta de Horarios</CardTitle>
            <CardDescription className="text-[#6B7280]">Ingrese sus credenciales para acceder</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              {loginError && (
                <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive text-center">
                  {loginError}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[#1A0B7B]">Correo electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="correo@sistema.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="focus-visible:ring-[#0033CC]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-[#1A0B7B]">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="focus-visible:ring-[#0033CC]"
                />
              </div>
              <Button
                type="submit"
                className="w-full h-11 bg-[#0033CC] hover:bg-[#002AA3] text-white"
                disabled={loginLoading}
              >
                {loginLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Iniciar Sesión
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Authenticated views
  return (
    <div className="min-h-screen flex flex-col bg-gray-50/50">
      {/* Header */}
      <header className="bg-gradient-to-r from-[#1A0B7B] to-[#0033CC] border-b sticky top-0 z-50 shadow-md">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
              {user.role === 'admin' ? (
                <Shield className="h-4 w-4 text-white" />
              ) : (
                <GraduationCap className="h-4 w-4 text-white" />
              )}
            </div>
            <div>
              <h1 className="text-sm font-semibold leading-tight text-white">Consulta de Horarios</h1>
              <p className="text-xs text-white/70">{user.role === 'admin' ? 'Administrador' : 'Profesor'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-white/80 hidden sm:block">
              {user.name || user.email}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowLogoutDialog(true)}
              className="text-white/80 hover:text-white hover:bg-white/10 gap-1.5"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Salir</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-6">
        {user.role === 'admin' ? <ExcelUploader /> : <NrcSearch />}
      </main>

      {/* Footer */}
      <footer className="border-t bg-white mt-auto">
        <div className="max-w-5xl mx-auto px-4 py-3 text-center text-xs text-muted-foreground">
          Sistema de Consulta de Horarios por NRC — <span className="font-semibold text-[#0033CC]">SENATI</span>
        </div>
      </footer>

      {/* Logout dialog */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Cerrar sesión?</AlertDialogTitle>
            <AlertDialogDescription>
              Se cerrará su sesión actual.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout}>Cerrar sesión</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}