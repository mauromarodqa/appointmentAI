# Plan de Implementación - TurnoYa

**Fecha:** 11 de Junio de 2026  
**Estado:** Fase 1 - Estructura Base Completada

---

## ✅ Lo que se ha completado

### 1. Documentación (100%)
- [x] PRD.md - Definición del producto
- [x] SCHEMA.md - Diseño de base de datos
- [x] SCALABILITY.md - Análisis de escalabilidad y concurrencia
- [x] README.md - Guía de inicio

### 2. Infraestructura (100%)
- [x] Proyecto React + Vite configurado
- [x] TypeScript configurado
- [x] Tailwind CSS configurado
- [x] Variables de entorno (.env.local)
- [x] Cliente Supabase inicializado
- [x] Carpeta de migraciones SQL creada

### 3. Base de Datos (100%)
- [x] Migraciones SQL creadas (4 archivos)
  - `20260611000000_create_tables.sql` - 7 tablas con constraints
  - `20260611000001_create_indexes.sql` - Índices optimizados
  - `20260611000002_create_functions_triggers.sql` - Funciones y triggers
  - `20260611000003_enable_rls.sql` - Seguridad (RLS + políticas)
- [ ] Migraciones aplicadas en Supabase (pendiente)

### 4. Estructura Frontend (80%)
- [x] Rutas principales (React Router)
- [x] Contexto de autenticación (AuthContext)
- [x] Páginas base:
  - [x] LandingPage - Página de inicio
  - [x] AuthPage - Registro/Login
  - [x] DashboardLayout - Layout del panel
  - [x] DashboardPage - Panel principal
  - [x] PublicBookingPage - Página pública de reservas
- [x] Types de TypeScript
- [ ] Componentes específicos (formularios, calendario, etc.)

### 5. Integraciones (20%)
- [x] Cliente Supabase inicializado
- [x] Autenticación conectada
- [ ] Queries a BD para servicios
- [ ] Queries a BD para turnos
- [ ] Notificaciones por email

---

## 🚀 Próximos Pasos (Orden de Prioridad)

### Fase 1A: Aplicar Migraciones (1-2 horas)
**Dependencia:** Credenciales Supabase

```bash
# Opción 1: CLI
supabase link --project-ref qgkgqfajtuycallceqil
supabase db push

# Opción 2: Dashboard web
# Ir a: https://app.supabase.com/project/.../sql
# Ejecutar migraciones manualmente
```

**Checklist:**
- [ ] Conectar Supabase CLI
- [ ] Ejecutar migraciones
- [ ] Verificar tablas creadas
- [ ] Verificar índices creados
- [ ] Verificar RLS habilitado

---

### Fase 1B: Completar Flujo de Autenticación (2-3 horas)

**1. Página de Configuración del Perfil**

```bash
# Crear archivo
src/pages/dashboard/SettingsPage.tsx
```

Incluir:
- Form con campos:
  - business_name (nombre del negocio) - requerido
  - slug (URL única) - requerido, validar que sea único
  - description (descripción) - opcional
  - phone (teléfono) - opcional
  - address (dirección) - opcional
  - timezone (zona horaria) - predefinida, seleccionable
  - logo_url (URL del logo) - opcional
- Botón guardar
- Validaciones cliente
- Manejo de errores

**Checklist:**
- [ ] Crear SettingsPage.tsx
- [ ] Conectar con AuthContext
- [ ] Agregar ruta en App.tsx
- [ ] Testear en dev

---

### Fase 1C: CRUD de Servicios (3-4 horas)

**1. Listar Servicios**
```bash
src/pages/dashboard/ServicesPage.tsx
```

- Tabla con servicios
- Columnas: nombre, duración, precio, acciones
- Botón "Agregar servicio"

**2. Crear/Editar Servicio**
```bash
src/components/services/ServiceForm.tsx
```

- Modal o página separada
- Campos:
  - name (nombre) - requerido
  - description (descripción) - opcional
  - duration_minutes (duración) - requerido, > 0
  - price (precio) - opcional
  - color (color para calendario) - predefinido
  - is_active (activo) - toggle

**Checklist:**
- [ ] Crear ServicesPage.tsx
- [ ] Crear ServiceForm.tsx
- [ ] Implementar CREATE
- [ ] Implementar UPDATE
- [ ] Implementar DELETE (soft delete recomendado)
- [ ] Testear CRUD completo

---

### Fase 1D: Configuración de Horarios (2-3 horas)

**1. Gestión de Horarios Regulares**
```bash
src/pages/dashboard/SchedulePage.tsx
```

- Vista semanal (7 días)
- Por cada día:
  - Toggle: "¿Laborable?"
  - Hora inicio
  - Hora fin
  - Break inicio (opcional)
  - Break fin (opcional)
- Botón guardar

**Checklist:**
- [ ] Crear SchedulePage.tsx
- [ ] Cargar working_hours existentes
- [ ] Validar que start_time < end_time
- [ ] Guardar cambios
- [ ] Mostrar confirmación

---

### Fase 1E: Búsqueda de Disponibilidad (4-6 horas)

**Este es el corazón de la app**

```typescript
// src/lib/availability.ts

export function getAvailableSlots(
  services: Service[],
  workingHours: WorkingHours[],
  blockedTimes: BlockedTime[],
  appointments: Appointment[],
  dateRange: { start: Date; end: Date },
  slotDuration: number = 15 // minutos
): {
  date: Date;
  time: string;
  available: boolean;
}[]
```

**Lógica:**
1. Iterar cada día en dateRange
2. Obtener working_hours para ese día
3. Generar slots de `slotDuration` minutos
4. Restar blocked_times
5. Restar appointments confirmados
6. Retornar slots disponibles

**Checklist:**
- [ ] Crear lib/availability.ts
- [ ] Implementar lógica de cálculo
- [ ] Considerar timezones
- [ ] Testing exhaustivo (edge cases)
- [ ] Optimizar performance (caché)

---

### Fase 1F: Reserva Pública de Turnos (5-7 horas)

**Completar PublicBookingPage.tsx**

```bash
src/pages/PublicBookingPage.tsx
```

**Pasos:**
1. ✓ Cargar perfil por slug (DONE)
2. ✓ Listar servicios (DONE)
3. Selector de fecha/hora
   - Calendario intuitivo
   - Mostrar slots disponibles
4. Formulario de cliente
   - first_name, last_name, email, phone
5. Confirmación
   - Resumen del turno
   - Botón confirmar
6. Éxito
   - Mostrar código de reserva
   - Enviar email

**Checklist:**
- [ ] Implementar date picker
- [ ] Integrar getAvailableSlots()
- [ ] Crear formulario de cliente
- [ ] Crear turnos (INSERT appointments)
- [ ] Edge case: dos usuarios simultáneos
- [ ] Crear Edge Function para email

---

### Fase 1G: Dashboard de Turnos (2-3 horas)

**Mejorar DashboardPage.tsx**

```bash
src/pages/DashboardPage.tsx
```

- Próximos 10 turnos
- Tabla con: cliente, servicio, fecha, estado
- Acciones: ver detalles, cancelar
- Link para copiar URL pública

**Checklist:**
- [ ] Mostrar turnos correctamente
- [ ] Expandir para ver detalles
- [ ] Cambiar estado (completar, cancelar)
- [ ] Copiar link al portapapeles

---

## 📊 Timeline Estimado

| Fase | Tarea | Horas | Fecha Estimada |
|------|-------|-------|---|
| **1A** | Aplicar migraciones | 1-2 | 11/06 |
| **1B** | Autenticación + Settings | 2-3 | 11/06 |
| **1C** | CRUD Servicios | 3-4 | 12/06 |
| **1D** | Configuración de Horarios | 2-3 | 12/06 |
| **1E** | Búsqueda de Disponibilidad | 4-6 | 13/06 |
| **1F** | Reserva Pública | 5-7 | 13-14/06 |
| **1G** | Dashboard de Turnos | 2-3 | 14/06 |
| **TEST** | Testing QA | 4-6 | 14-15/06 |
| **MVP** | **LANZAMIENTO** | | **15/06** |

---

## 🔧 Comandos Útiles

```bash
# Instalar dependencias
npm install

# Ejecutar dev
npm run dev

# Build
npm run build

# Aplicar migraciones (desde raíz)
supabase link --project-ref qgkgqfajtuycallceqil
supabase db push

# Ver logs de Supabase
supabase logs --local

# Resetear BD local
supabase db reset
```

---

## 📝 Notas Importantes

### Variables de Entorno Necesarias

```bash
# .env.local
VITE_SUPABASE_URL=https://qgkgqfajtuycallceqil.supabase.co
VITE_SUPABASE_ANON_KEY=<obtener de https://app.supabase.com/project/.../settings/api>
```

### Credenciales de Supabase

Proyecto: `qgkgqfajtuycallceqil`
- Ir a: https://app.supabase.com/project/qgkgqfajtuycallceqil
- Settings → API
- Copiar `URL` y `anon key`

### Testing Manual

Para cada feature implementada:
1. Probar flujo happy path
2. Probar validaciones
3. Probar edge cases (concurrencia, timezones, etc.)
4. Verificar BD (ejecutar queries)

---

## 🚨 Riesgos Identificados

| Riesgo | Mitigación |
|--------|-----------|
| Migraciones no aplicadas | Aplicar manualmente en web UI |
| Credenciales faltantes | Obtener de dashboard Supabase |
| Solapamiento de turnos | Trigger + validación en Edge Function |
| Timezone incorrecto | Almacenar en UTC, convertir en cliente |
| Performance lenta | Implementar caché localStorage |
| Autenticación falla | Verificar JWT y sesión |

---

## ✨ Siguientes Fases (Post-MVP)

- **Fase 2 (Growth):** Reservation Hold, notificaciones mejoradas, caché
- **Fase 3 (Scale):** Elasticsearch, CQRS, multi-profesional
- **Fase 4 (Monetización):** Pagos, planes, analytics

---

**Última actualización:** 11/06/2026  
**Responsable:** Claude Code
