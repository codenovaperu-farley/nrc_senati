# 🚀 Guía de Despliegue — Sistema de Consulta de Horarios por NRC (SENATI)

Esta guía corrige el problema de **"desplegué en Vercel pero no puedo acceder"**.
Sigue los pasos EN ORDEN. Son 5 pasos y toma unos 10 minutos.

---

## ¿Por qué no podía acceder? (causes encontradas y corregidas)

1. **`output: "standalone"` en `next.config.ts`** → en Vercel rompe la entrega de
   archivos estáticos (pantalla en blanco o 404). ✅ Ya fue eliminado.
2. **El script `build` usaba comandos `cp -r`** que fallan en Vercel. ✅ Corregido a `next build`.
3. **Prisma + SQLite** → Vercel no tiene disco persistente, y tu app ni siquiera
   usaba Prisma (usa Supabase). ✅ Fue eliminado por completo.
4. **Si faltan las variables de entorno de Supabase, la app crasheaba** con
   "Error del servidor" sin explicación. ✅ Ahora muestra mensajes claros y un
   aviso amarillo en la pantalla de login indicando exactamente qué falta.
5. **No había forma de crear tu usuario** → aunque todo estuviera configurado,
   la tabla `users` estaba vacía y el login era imposible. ✅ Ahora existe el
   endpoint `/api/setup` para crear tu primer admin.

---

## PASO 1 — Crear las tablas en Supabase (2 min)

1. Entra a tu proyecto en [supabase.com](https://supabase.com)
2. Menú lateral: **SQL Editor** → botón **New query**
3. Abre el archivo `supabase-setup.sql` (incluido en este proyecto), copia TODO su contenido, pégalo y presiona **Run**
4. Debe decir "Success. No rows returned". Con eso quedan creadas las tablas `users`, `archivos` y `horarios`.

> ⚠️ Si ya habías ejecutado este script antes, no pasa nada: se puede volver a
> ejecutar porque usa `create table if not exists`.

## PASO 2 — Obtener las llaves de Supabase (1 min)

1. En tu proyecto de Supabase: **Project Settings** (⚙️) → **API**
2. Copia estos 3 valores:
   - **Project URL** → es tu `NEXT_PUBLIC_SUPABASE_URL`
   - **anon / public key** (Project API Keys) → es tu `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → es tu `SUPABASE_SERVICE_ROLE_KEY`
3. Inventa una clave secreta cualquiera (una frase larga) → será tu `JWT_SECRET`

## PASO 3 — Subir el proyecto corregido a GitHub (2 min)

1. Crea un repositorio nuevo en GitHub (privado está bien)
2. Sube TODO el contenido de este proyecto corregido:
   ```bash
   git init
   git add .
   git commit -m "Sistema NRC SENATI - versión corregida para Vercel"
   git branch -M main
   git remote add origin https://github.com/TU-USUARIO/TU-REPO.git
   git push -u origin main
   ```
   > ⚠️ NO subas `node_modules` ni `.env.local` (el `.gitignore` ya lo evita).

## PASO 4 — Configurar Vercel (2 min)

1. Entra a [vercel.com](https://vercel.com) → tu proyecto (o **Add New → Project** si es nuevo)
2. **Si ya tenías el proyecto desplegado:** mejor elimínalo y créalo de nuevo
   importando este repo corregido, para que no quede la configuración vieja.
3. **NO cambies** el Build Command ni el Output Directory (deja los que Vercel
   detecta solo para Next.js).
4. Ve a **Settings → Environment Variables** y agrega las 4 variables:

   | Nombre | Valor |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | (Project URL del Paso 2) |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | (anon public key del Paso 2) |
   | `SUPABASE_SERVICE_ROLE_KEY` | (service role key del Paso 2) |
   | `JWT_SECRET` | (cualquier frase larga secreta) |

5. Guarda y haz **Deploy** (o **Redeploy** si el proyecto ya existía).

## PASO 5 — Crear tu usuario admin y entrar (1 min)

1. Cuando el deploy termine, abre en tu navegador:
   ```
   https://TU-APP.vercel.app/api/setup?email=tucorreo@ejemplo.com&password=MICLAVE123
   ```
   (cambia el correo y la contraseña por los tuyos; mínimo 6 caracteres)
2. Debe responder: `"Usuario admin creado..."`
3. Ahora ve a la página principal `https://TU-APP.vercel.app` e inicia sesión con ese correo y contraseña.
4. Ese primer usuario es **admin** (puede cargar Excel). Para crear profesores,
   crea más usuarios desde Supabase → Table Editor → users, o pide que se
   agregue una pantalla de registro.

---

## 🔧 Solución de problemas

### Abre `/api/health` — tu centro de diagnóstico
```
https://TU-APP.vercel.app/api/health
```
- Si responde `"status": "config_incompleta"` → te dice EXACTAMENTE qué
  variables faltan. Agrégalas en Vercel y haz Redeploy.
- Si responde `"status": "ok"` → la configuración está bien; el problema puede
  ser que no creaste tu usuario (Paso 5) o que no ejecutaste el SQL (Paso 1).

### La pantalla de login muestra un aviso amarillo "⚠ Servidor sin configurar"
Significa que faltan variables de entorno en Vercel. El aviso te dice cuáles.

### "Credenciales inválidas"
- Verifica correo y contraseña.
- ¿Ejecutaste el Paso 5 (`/api/setup`)? Si no, la tabla de usuarios está vacía.
- Si olvidaste tu contraseña: Supabase → Table Editor → users → borra la fila
  del usuario, y vuelve a usar `/api/setup`.

### Error 500 al buscar NRC o al subir Excel
- ¿Ejecutaste el `supabase-setup.sql`? (Paso 1)
- ¿El Excel tiene exactamente las columnas: PERIODO, NRC, DESCRIPCIÓN_CURSO,
  ID_INST, INSTRUCTOR, TIPO_REUNION, INICIO, FIN, HORARIO, EDIFICIO, SALON,
  LUN, MAR, MIE, JUE, VIE, SAB, DOM?

### Cambié variables de entorno pero sigue igual
Debes hacer **Redeploy** después de cambiar variables en Vercel
(Deployments → ⋯ → Redeploy).

---

## Estructura del proyecto

```
src/
├── app/
│   ├── api/
│   │   ├── auth/          # Login y logout (JWT en cookie httpOnly)
│   │   ├── auth/me/       # Sesión actual
│   │   ├── health/        # ⭐ Diagnóstico de configuración
│   │   ├── setup/         # ⭐ Crea el primer usuario admin
│   │   ├── horarios/      # Búsqueda y carga de horarios
│   │   └── archivos/      # Control de archivos Excel cargados
│   ├── page.tsx           # Login + vistas (admin / profesor)
│   └── layout.tsx
├── components/
│   ├── ExcelUploader.tsx  # Vista admin: carga de Excel
│   └── NrcSearch.tsx      # Vista profesor: búsqueda por NRC
└── lib/
    ├── auth.ts            # JWT + bcrypt
    └── supabase.ts        # Cliente Supabase (a prueba de mala config)
supabase-setup.sql         # ⭐ Script de creación de tablas
.env.example               # Plantilla de variables de entorno
```

## Desarrollo local (opcional)

```bash
npm install
cp .env.example .env.local   # y llena los valores
npm run dev
```
