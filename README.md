# TurnoYa - Plataforma de Gestión de Turnos

Aplicación web para que comercios y profesionales independientes gestionen su agenda de turnos.

## 📋 Estructura del Proyecto

```
AppointmentAi/
├── web/                          # React + Vite (Frontend)
│   ├── src/
│   │   ├── pages/               # Páginas principales
│   │   ├── components/          # Componentes reutilizables
│   │   ├── contexts/            # Context API (Auth)
│   │   ├── types/               # TypeScript types
│   │   ├── lib/                 # Utilidades (Supabase client)
│   │   └── App.tsx              # Rutas principales
│   ├── .env.local               # Variables de entorno
│   └── package.json
├── supabase/
│   ├── migrations/              # Migraciones SQL
│   └── config.toml              # Configuración local
├── docs/
│   ├── PRD.md                   # Product Requirements
│   ├── SCHEMA.md                # Esquema de BD
│   └── SCALABILITY.md           # Análisis de escalabilidad
└── README.md
```

## 🚀 Comenzar

### 1. Clonar repositorio

```bash
cd /home/mauromarod/Documents/UNAJ/AppointmentAi
```

### 2. Instalar dependencias

```bash
cd web
npm install
```

### 3. Configurar variables de entorno

Copiar `.env.example` a `.env.local` y completar con tus claves de Supabase:

```bash
cp .env.example .env.local
```

Obtener las claves desde: https://app.supabase.com/project/qgkgqfajtuycallceqil/settings/api

### 4. Aplicar migraciones de BD

**Opción A: Usar Supabase CLI (recomendado)**

```bash
# Instalar Supabase CLI si no está instalado
npm install -g supabase

# Desde la raíz del proyecto
supabase link --project-ref qgkgqfajtuycallceqil

# Aplicar migraciones
supabase db push
```

**Opción B: Ejecutar SQL manualmente**

Ir a: https://app.supabase.com/project/qgkgqfajtuycallceqil/sql

Copiar y ejecutar en orden:
1. `supabase/migrations/20260611000000_create_tables.sql`
2. `supabase/migrations/20260611000001_create_indexes.sql`
3. `supabase/migrations/20260611000002_create_functions_triggers.sql`
4. `supabase/migrations/20260611000003_enable_rls.sql`

### 5. Ejecutar desarrollo local

```bash
cd web
npm run dev
```

La aplicación estará disponible en: http://localhost:5173

## 📱 Flujos Principales

### Para Profesionales (Autenticados)

1. **Registro/Login** → `/auth`
2. **Configuración de Perfil** → `/dashboard/configuracion`
3. **Panel Principal** → `/dashboard`
4. **Gestión de Servicios** → `/dashboard/servicios`
5. **Agenda de Turnos** → `/dashboard/agenda`

### Para Clientes (Públicos)

1. Acceder a: `turnoya.com/{slug-profesional}`
2. Ver servicios disponibles
3. Seleccionar fecha/hora
4. Completar formulario
5. Confirmación de turno

## 🛠️ Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | React 18+ (TypeScript, Vite) |
| Estilos | Tailwind CSS |
| Backend | Supabase (PostgreSQL, Auth) |
| Autenticación | Supabase Auth |
| BD | PostgreSQL |
| Despliegue | Cloudflare Pages (próximamente) |

## 📚 Documentación

- **[PRD.md](./PRD.md)** - Requerimientos del producto
- **[SCHEMA.md](./SCHEMA.md)** - Esquema de base de datos
- **[SCALABILITY.md](./SCALABILITY.md)** - Análisis de escalabilidad y concurrencia

## 🔒 Seguridad

- ✅ Row Level Security (RLS) habilitado en todas las tablas
- ✅ Autenticación via Supabase Auth
- ✅ Validación en BD (triggers)
- ✅ HTTPS requerido en producción
- ✅ Credenciales en `.env.local` (nunca versionadas)

## 📊 Estado Actual

### MVP (Fase 1) - En Desarrollo

- [x] Estructura del proyecto
- [x] Autenticación básica
- [x] CRUD de perfil de profesional
- [ ] Gestión de servicios
- [ ] Gestión de horarios
- [ ] Búsqueda de disponibilidad
- [ ] Reserva de turnos (pública)
- [ ] Notificaciones por email

### Growth (Fase 2) - Planeado

- [ ] Reservation Hold (10 min antes de confirmar)
- [ ] Caché con Redis
- [ ] Dashboard avanzado
- [ ] Integración WhatsApp

### Scale (Fase 3) - Planeado

- [ ] Elasticsearch para búsquedas
- [ ] CQRS (Event-driven)
- [ ] Multi-zona horaria
- [ ] App móvil

## 📝 Scripts Disponibles

```bash
# Desarrollo
npm run dev

# Build
npm run build

# Preview de build
npm run preview

# Linting
npm run lint
```

## 🤝 Contribuir

1. Crear rama desde `main`
2. Hacer cambios
3. Crear PR
4. Pasar tests y revisión

## 📧 Contacto

Para preguntas sobre el proyecto, contactar a: mauromarod@gmail.com

## 📄 Licencia

Privado - Todos los derechos reservados
