import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'
import { supabase } from './supabase'
import { SignJWT, jwtVerify } from 'jose'

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'sistema-nrc-senati-secret-2024')

export interface SessionPayload {
  userId: string
  email: string
  name: string | null
  role: 'admin' | 'profesor'
}

export async function verifyCredentials(email: string, password: string) {
  // Normalizar el correo: sin espacios y en minúsculas (evita fallos de login
  // cuando el usuario escribe su correo con mayúsculas)
  const normalizedEmail = (email || '').trim().toLowerCase()

  const { data, error } = await supabase
    .from('users')
    .select('id, email, name, role, password')
    .eq('email', normalizedEmail)
    .single()

  if (error || !data) return null

  const valid = await bcrypt.compare(password, data.password)
  if (!valid) return null

  return {
    userId: data.id,
    email: data.email,
    name: data.name,
    role: data.role as 'admin' | 'profesor',
  }
}

export async function createToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('8h')
    .setIssuedAt()
    .sign(JWT_SECRET)
}

export async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as unknown as SessionPayload
  } catch {
    return null
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth-token')?.value
  if (!token) return null
  return verifyToken(token)
}