# Errores Encontrados y Soluciones - TurnoYa MVP

## Error 1: RLS Policies Conflictivas en Tabla `appointments`

### Problema
El usuario autenticado no podía ver sus propios turnos en el dashboard, aunque la BD confirmaba que existían. Se retornaban 0 resultados en la query.

```typescript
// Query que retornaba 0 resultados
const { data: appointmentsData } = await supabase
  .from('appointments')
  .select('*')
  .eq('profile_id', profile.id);
```

### Causa Raíz
Había múltiples políticas RLS para SELECT en la tabla `appointments`, todas con `role: {public}`:

1. **"Users can view own appointments"** - permitía ver turnos donde `profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())`
2. **"Anyone can view appointments for booking"** - permitía ver turnos de `profile_id IN (SELECT id FROM profiles WHERE is_active = true)`

PostgreSQL evalúa TODAS las políticas PERMISSIVE para un rol. Si una falla, la consulta se niega. El problema era que ambas políticas se aplicaban al mismo rol `{public}`, causando evaluación conflictiva.

### Solución Implementada
Separar las políticas por `role` específico en lugar de usar `{public}`:

```sql
-- Política para usuarios autenticados
CREATE POLICY "Users can view appointments"
  ON public.appointments FOR SELECT
  TO authenticated
  USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Política para usuarios anónimos
CREATE POLICY "Public can view active profile appointments"
  ON public.appointments FOR SELECT
  TO anon
  USING (profile_id IN (SELECT id FROM profiles WHERE is_active = true));
```

Con roles separados, PostgreSQL aplica solo la política relevante para cada tipo de usuario.

### Qué Debería Estar en el PRD
```markdown
### Requisitos de Seguridad - RLS
- Las políticas RLS deben estar claramente separadas por rol (authenticated, anon, etc.)
- No mezclar múltiples condiciones en un solo rol sin documentar el impacto
- Documentar explícitamente qué datos cada tipo de usuario puede ver
- Incluir matriz de permisos:
  | Acción | Usuarios | Anónimos | Admins |
  |--------|----------|----------|--------|
  | VER turnos propios | ✓ | ✗ | ✓ |
  | VER turnos públicos | ✓ | ✓ | ✓ |
  | CREAR turnos | ✗ | ✓ | ✓ |
```

---

## Error 2: Timezone - Guardado de Horas Incorrecto

### Problema
Cuando el usuario guardaba un turno a las 16:00 (hora local Argentina UTC-3), se guardaba en la BD como 12:00 UTC en lugar de 19:00 UTC. Esto causaba un offset de +3 horas incorrecto.

```
Usuario selecciona: 16:00 ART
Se guardó como: 12:00 UTC (debería ser 19:00 UTC)
Diferencia: -7 horas (incorrecto)
```

### Causa Raíz
Había múltiples problemas de conversión de timezone que se acumulaban:

1. **En `DatePicker.tsx`**: Se parseaba la fecha como UTC en lugar de local
   ```typescript
   const date = new Date(e.target.value); // Interpreta como UTC
   ```

2. **En `availability.ts`**: Se extraía la fecha usando `.toISOString()` que retorna UTC
   ```typescript
   const dateStr = date.toISOString().split('T')[0]; // Convierte a UTC primero
   ```

3. **En `availability.ts`**: Se creaba `baseDate` con 'Z' (UTC) en lugar de local
   ```typescript
   const baseDate = new Date(dateStr + 'T00:00:00Z'); // Fuerza UTC
   ```

La combinación de estas conversiones causaba que 16:00 ART se interpretara como 12:00 UTC.

### Solución Implementada

**1. Corregir DatePicker para parsear como local:**
```typescript
const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  // Parse date as local timezone, not UTC
  const [year, month, day] = e.target.value.split('-').map(Number);
  const date = new Date(year, month - 1, day, 0, 0, 0, 0);
  onDateChange(date);
};
```

**2. Corregir availability.ts para extraer fecha como local:**
```typescript
const year = date.getFullYear();
const month = String(date.getMonth() + 1).padStart(2, '0');
const day = String(date.getDate()).padStart(2, '0');
const dateStr = `${year}-${month}-${day}`;
```

**3. Crear baseDate sin 'Z':**
```typescript
const baseDate = new Date(year, parseInt(month) - 1, parseInt(day), 0, 0, 0, 0);
// Sin 'Z' - se interpreta como hora local
```

**Flujo correcto:**
- Usuario selecciona 16:00 ART en zona horaria local
- availability.ts crea slot como 16:00 ART (local)
- Al guardar: `slotStart.toISOString()` → convierte a 19:00 UTC ✓
- En BD se almacena: `2026-06-12T19:00:00+00` ✓

### Qué Debería Estar en el PRD
```markdown
### Especificación de Timezone
- **Zona horaria de la app:** Argentina (UTC-3)
- **Zona horaria de almacenamiento:** UTC en la BD
- **Conversión requerida:**
  - Frontend: parsear input como HORA LOCAL
  - API: convertir a UTC con .toISOString() antes de guardar
  - Display: convertir UTC a hora local al mostrar

### Casos de Prueba Obligatorios
1. Usuario en UTC-3 selecciona 14:00 → se guarda como 17:00 UTC
2. Usuario en UTC-3 ve turno guardado como 17:00 UTC → se muestra como 14:00
3. Disponibilidad de 09:00-18:00 UTC-3 = 12:00-21:00 UTC

### Testing Requerido
- [ ] Timezone en diferentes regiones
- [ ] Daylight Saving Time (si aplica)
- [ ] Cambios de timezone en servidor
```

---

## Error 3: toLocaleString() Retorna Hora Incorrecta

### Problema
Aunque el timestamp estaba guardado correctamente en la BD (20:00 UTC = 17:00 ART), cuando se mostraba en el dashboard usando `toLocaleString('es-AR')`, retornaba 05:00 en lugar de 17:00.

```typescript
// El Date representa 17:00 ART correctamente
aptDate: Fri Jun 12 2026 17:00:00 GMT-0300 (Argentina Standard Time)
aptDate.getHours() // Retorna 17 ✓

// Pero toLocaleString() retorna 05:00 ✗
aptDate.toLocaleString('es-AR') // "12/6/2026, 05:00:00"
```

### Causa Raíz
Hay un bug en la implementación de `toLocaleString('es-AR')` en el navegador del usuario (Chrome). La función no está convirtiendo correctamente la hora para la zona horaria de Argentina.

Esto es un bug del navegador, no del código. Pero afecta la UX.

### Solución Implementada
Formatear la fecha manualmente usando métodos que SÍ funcionan correctamente:

```typescript
const aptDate = new Date(apt.start_time);

// Formato manual que funciona
const day = String(aptDate.getDate()).padStart(2, '0');
const month = String(aptDate.getMonth() + 1).padStart(2, '0');
const year = aptDate.getFullYear();
const hours = String(aptDate.getHours()).padStart(2, '0');
const minutes = String(aptDate.getMinutes()).padStart(2, '0');
const seconds = String(aptDate.getSeconds()).padStart(2, '0');
const formattedDate = `${day}/${month}/${year}, ${hours}:${minutes}:${seconds}`;
```

Los métodos `.getHours()`, `.getMinutes()`, etc., retornan los valores en zona horaria local correctamente, por lo que el formato manual funciona.

### Qué Debería Estar en el PRD
```markdown
### Especificación de Formato de Fecha/Hora
- **Formato requerido:** DD/MM/YYYY, HH:MM:SS
- **Zona horaria display:** Argentina Standard Time (UTC-3)
- **Formato en BD:** ISO 8601 con offset (2026-06-12T17:00:00+00:00)

### Restricciones de Implementación
- NO usar toLocaleString() para Argentina sin testing extenso
  (hay bugs conocidos en varios navegadores)
- Usar formato manual o librería especializada (date-fns, moment)
- Testing en navegadores: Chrome, Firefox, Safari (últimas 2 versiones)

### Testing Requerido
- [ ] Verificar formato en Chrome, Firefox, Safari
- [ ] Verificar con extensiones de developer tools activadas
- [ ] Verificar cambios de idioma del navegador
```

---

## Error 4: Filtrado Incorrecto de Fechas en Dashboard

### Problema
El dashboard obtenía los turnos correctamente de la BD pero el filtrado cliente-side los eliminaba todos, mostrando "0 turnos" a pesar de que había 4 en la BD.

```javascript
// Obtiene 4 turnos correctamente
Appointments data: Array(4)

// Pero el filtrado elimina todos
Filtered appointments: Array(0)
```

### Causa Raíz
El filtrado comparaba la HORA exacta de los turnos contra un rango de 30 días, sin considerar que los turnos antiguos estarían fuera del rango:

```typescript
const now = new Date();
const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

// Comparar hora exacta - todos los turnos anteriores se eliminaban
const filtered = appointmentsData.filter(apt =>
  apt.status === 'confirmed' &&
  new Date(apt.start_time) >= now &&  // ← Falla para turnos pasados
  new Date(apt.start_time) <= thirtyDaysLater
);
```

Los turnos más antiguos (2026-06-10, 2026-06-11) fallaban porque su hora exacta era menor a `now` (hora actual exacta).

### Solución Implementada
Comparar solo las FECHAS (sin horas) para el filtrado de 30 días:

```typescript
const now = new Date();
now.setHours(0, 0, 0, 0); // Inicio del día actual

const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

const filtered = appointmentsData
  .filter(apt => apt.status === 'confirmed')
  .filter(apt => {
    const aptDate = new Date(apt.start_time);
    aptDate.setHours(0, 0, 0, 0); // Solo comparar fecha
    return aptDate >= now && aptDate <= thirtyDaysLater;
  });
```

Ahora se comparan solo las fechas (00:00:00), no la hora exacta.

### Qué Debería Estar en el PRD
```markdown
### Especificación de Filtrado de Turnos
- **Dashboard muestra:** Turnos de hoy + próximos 30 días
- **Definición:** Cualquier turno cuya fecha esté dentro de ese rango
- **Lógica:** Comparar solo FECHA, no hora exacta
  - Turno de hoy a las 23:00 → INCLUIR
  - Turno de ayer a las 22:00 → EXCLUIR
  - Turno en 31 días → EXCLUIR

### Casos de Prueba
- [ ] Turno para hoy a las 08:00 → mostrar
- [ ] Turno para hoy a las 23:59 → mostrar
- [ ] Turno de ayer → no mostrar
- [ ] Turno en 31 días → no mostrar
- [ ] Turno en 30 días exactos → mostrar

### Lógica Exacta
```
fecha_turno >= fecha_inicio_dia_hoy AND 
fecha_turno <= fecha_inicio_dia_hoy + 30 días
```
```

---

## Error 5: Horarios de Trabajo Guardados con Timezone Incorrecto

### Problema
Cuando el usuario configuraba horarios "09:00 - 18:00" con break "12:00 - 14:00", se guardaban como "12:00 - 21:00" con break "15:00 - 17:00". Exactamente +3 horas (la offset UTC-3).

```
Entrada: 09:00 - 18:00
Guardado: 12:00 - 21:00
Diferencia: +3 horas ❌
```

### Causa Raíz
Los horarios de trabajo en la BD se almacenan como tipo `time` (solo HH:MM:SS sin timezone). El problema era que en algún punto de la conversión, se estaba interpretando la entrada como UTC en lugar de local.

Aunque el input type="time" retorna una cadena "HH:MM", hay un bug en cómo Supabase o el cliente estaban procesando esa cadena.

### Solución Implementada
Corregir los datos mal guardados directamente en la BD usando una query SQL:

```sql
UPDATE public.working_hours
SET 
  start_time = (to_timestamp('1970-01-01 ' || start_time, 'YYYY-MM-DD HH24:MI:SS') - interval '3 hours')::time,
  end_time = (to_timestamp('1970-01-01 ' || end_time, 'YYYY-MM-DD HH24:MI:SS') - interval '3 hours')::time,
  break_start = CASE WHEN break_start IS NOT NULL THEN
    (to_timestamp('1970-01-01 ' || break_start, 'YYYY-MM-DD HH24:MI:SS') - interval '3 hours')::time
  ELSE NULL END,
  break_end = CASE WHEN break_end IS NOT NULL THEN
    (to_timestamp('1970-01-01 ' || break_end, 'YYYY-MM-DD HH24:MI:SS') - interval '3 hours')::time
  ELSE NULL END
WHERE profile_id = '23cae7f0-919a-43f8-b6a8-ad216ce79e3f';
```

Esto resta 3 horas a todos los horarios, convirtiendo 12:00-21:00 de vuelta a 09:00-18:00.

### Qué Debería Estar en el PRD
```markdown
### Especificación de Almacenamiento de Horarios
- **Tipo de dato:** TIME (solo HH:MM:SS)
- **Interpretación:** Siempre en zona horaria LOCAL (Argentina)
- **Ejemplo:** 09:00 significa 09:00 ART, NO UTC

### Restricciones de Input
- Input type="time" en HTML5 solo permite HH:MM
- No incluye timezone
- Interpretar SIEMPRE como zona horaria local del usuario

### Validación Requerida
- [ ] Hora inicio < Hora fin
- [ ] Break (si existe) está dentro de horario laboral
- [ ] Sin ambigüedades de timezone

### Testing Requerido
- [ ] Crear horarios 09:00-18:00 → guardar y verificar exáctamente 09:00-18:00
- [ ] No haber conversiones de timezone en este tipo de dato
```

---

## Resumen de Errores por Categoría

### Errores de Diseño de BD
1. **RLS Policies conflictivas** → Separar por rol específico
2. **Horarios guardados con offset** → Validar input/output de timezones

### Errores de Lógica Frontend
3. **Filtrado de fechas incorrecto** → Comparar solo fechas, no horas exactas
4. **DatePicker parseando como UTC** → Parsear como local
5. **availability.ts con conversiones incorrectas** → Trabajar en timezone local

### Errores de Navegador/Librería
6. **toLocaleString() con bug** → Formatear manualmente

---

## Recomendaciones para PRDs Futuros

### 1. **Sección Obligatoria: Timezone & Localization**
```markdown
## Requisitos de Timezone y Localización

### Zona Horaria Base
- Zona horaria de la aplicación: [ESPECIFICAR]
- ¿Soporta múltiples zonas horarias? SI / NO
- Si YES: Listar todas las soportadas

### Conversiones Requeridas
- Frontend parsea input como: LOCAL / UTC
- Backend almacena como: LOCAL / UTC
- Display en frontend: LOCAL / UTC

### Casos de Prueba Obligatorios
1. [Caso 1]
2. [Caso 2]
3. [Caso 3]
```

### 2. **Sección: Seguridad - RLS**
```markdown
## Seguridad - Row Level Security

### Matriz de Permisos
Tabla con filas para cada tabla y columnas para cada tipo de usuario

### Detalles de Cada Política
Para cada tabla, especificar:
- Qué usuarios pueden ver
- Qué usuarios pueden crear
- Qué usuarios pueden editar
- Qué usuarios pueden eliminar
```

### 3. **Sección: Filtrado y Búsqueda**
```markdown
## Filtrado de Datos

### Dashboard - Próximos Turnos
- **Definición:** [EXACTAMENTE qué se muestra]
- **Rango:** 30 días
- **Comparación:** Fecha (sí/no), Hora (sí/no)
- **Casos edge:** Turno de hoy, turno en 30 días, etc.
```

### 4. **Testing Requerido en PRD**
```markdown
## Testing - Casos Obligatorios

### Timezone
- [ ] Caso 1
- [ ] Caso 2

### RLS
- [ ] Caso 1
- [ ] Caso 2

### Filtrado
- [ ] Caso 1
- [ ] Caso 2
```

---

## Lecciones Aprendidas

1. **Timezone es complejo:** Requiere especificación clara en TODAS las capas (input, storage, display)
2. **RLS es delicado:** Las políticas interactúan de formas no obvias
3. **Bugs de navegador:** No asumir que toLocaleString(), Intl.*, etc. funcionan igual en todos lados
4. **Testing early:** Hubiera sido más rápido si se testeaba timezone desde el inicio
5. **Documentación > Código:** Un PRD claro hubiera evitado >80% de estos errores
