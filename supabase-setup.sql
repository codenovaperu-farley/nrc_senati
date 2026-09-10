-- ============================================================================
-- SISTEMA DE CONSULTA DE HORARIOS POR NRC — SENATI
-- Script de instalación de la base de datos en Supabase
--
-- CÓMO USARLO:
--   1. Entra a https://supabase.com y abre tu proyecto
--   2. Menú lateral: SQL Editor → "New query"
--   3. Pega TODO este archivo y presiona "Run" (Ejecutar)
--   4. Listo. Las 3 tablas quedarán creadas.
-- ============================================================================

-- 1) TABLA DE USUARIOS (login del sistema)
create table if not exists public.users (
  id         uuid primary key default gen_random_uuid(),
  email      text unique not null,
  password   text not null,
  name       text,
  role       text not null default 'profesor' check (role in ('admin', 'profesor')),
  created_at timestamptz not null default now()
);

-- 2) TABLA DE ARCHIVOS EXCEL CARGADOS (control histórico de cargas)
create table if not exists public.archivos (
  id              uuid primary key default gen_random_uuid(),
  nombre          text not null,
  fecha_carga     timestamptz not null default now(),
  total_registros integer,
  activo          boolean not null default true,
  created_at      timestamptz not null default now()
);

-- 3) TABLA DE HORARIOS (cada fila del Excel cargado)
create table if not exists public.horarios (
  id                uuid primary key default gen_random_uuid(),
  periodo           text,
  nrc               text not null default '',
  descripcion_curso text,
  id_inst           text,
  instructor        text,
  tipo_reunion      text,
  inicio            text,
  fin               text,
  horario           text,
  edificio          text,
  salon             text,
  lun               text,
  mar               text,
  mie               text,
  jue               text,
  vie               text,
  sab               text,
  dom               text,
  archivo_id        uuid references public.archivos(id) on delete set null,
  created_at        timestamptz not null default now()
);

-- ÍNDICES para que las búsquedas por NRC sean rápidas
create index if not exists horarios_nrc_idx      on public.horarios (nrc);
create index if not exists horarios_periodo_idx  on public.horarios (periodo);
create index if not exists horarios_edificio_idx on public.horarios (edificio);
create index if not exists horarios_archivo_idx  on public.horarios (archivo_id);
create index if not exists users_email_idx       on public.users (email);

-- ============================================================================
-- NOTA SOBRE SEGURIDAD (RLS):
-- Esta aplicación consulta Supabase SOLO desde el servidor (las rutas API de
-- Next.js en Vercel), nunca directamente desde el navegador del usuario.
-- Por eso NO se activa Row Level Security: si se activara sin políticas,
-- el servidor quedaría bloqueado y la app dejaría de funcionar.
-- La protección real está en el login con JWT (cookie httpOnly) y en que las
-- llaves de Supabase viven SOLO en las variables de entorno de Vercel.
-- ============================================================================
