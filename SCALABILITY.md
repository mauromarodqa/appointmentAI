# Análisis de Escalabilidad y Concurrencia - TurnoYa

**Versión:** 1.0  
**Fecha:** Junio 2026  
**Estado:** Diseño Arquitectónico

---

## Tabla de Contenidos

1. [Estado Actual](#1-estado-actual)
2. [Análisis de Escalabilidad](#2-análisis-de-escalabilidad)
3. [Análisis de Concurrencia](#3-análisis-de-concurrencia)
4. [Problemas Identificados](#4-problemas-identificados)
5. [Soluciones para MVP](#5-soluciones-para-mvp)
6. [Mejoras a Mediano Plazo](#6-mejoras-a-mediano-plazo)
7. [Soluciones a Largo Plazo](#7-soluciones-a-largo-plazo)
8. [Roadmap de Implementación](#8-roadmap-de-implementación)

---

## 1. Estado Actual

### 1.1 Stack Tecnológico

```
┌─────────────────────────────────────────────────────────────┐
│                     Cliente (React + Vite)                   │
│  - Consulta disponibilidad                                   │
│  - Valida en cliente (false positives posibles)              │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│              Edge Functions (Supabase)                        │
│  - Valida nuevamente disponibilidad                          │
│  - Crea turno (INSERT)                                       │
│  - Envía emails                                              │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│         PostgreSQL (Supabase) - Single Database              │
│  - Tabla appointments (todas las empresas)                   │
│  - RLS para isolamiento de datos                             │
│  - Trigger check_appointment_overlap para validación         │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 Características Actuales

| Aspecto | Implementación |
|---------|----------------|
| **Base de datos** | PostgreSQL 14+ (Supabase) |
| **Queries de disponibilidad** | Realizadas en cliente (JavaScript) |
| **Validación de conflictos** | Trigger SQL `check_appointment_overlap()` |
| **Caché** | Ninguno (cada consulta toca BD) |
| **Aislamiento de transacciones** | READ COMMITTED (default PostgreSQL) |
| **Reserva preliminar** | No existe (se confirma directamente) |
| **Locking** | Implícito por TRIGGER |
| **Monitoreo** | Supabase dashboard básico |

---

## 2. Análisis de Escalabilidad

### 2.1 Complejidad de Búsqueda de Disponibilidad

**Algoritmo actual:**

```javascript
// Cliente (React)
async function getAvailableSlots(profileId, dateRange, serviceDuration) {
  // 1. Obtener working_hours
  const workingHours = await getWorkingHours(profileId);
  
  // 2. Obtener blocked_times
  const blockedTimes = await getBlockedTimes(profileId, dateRange);
  
  // 3. Obtener appointments confirmados
  const appointments = await getAppointments(profileId, dateRange);
  
  // 4. Calcular slots disponibles (O(n*m))
  const slots = [];
  for (let date of dateRange) {
    for (let hour of workingHours[date.dayOfWeek]) {
      for (let slot of generateSlots(hour, serviceDuration)) {
        if (!isBlocked(slot, blockedTimes) && !isBooked(slot, appointments)) {
          slots.push(slot);
        }
      }
    }
  }
  return slots;
}
```

**Complejidad temporal:**
- d = días a consultar (30)
- s = slots por día (96 para intervalos de 15 min)
- a = appointments en ese período (300)
- Complejidad: **O(d × s × a) = O(30 × 96 × 300) = ~864,000 operaciones**

**Costo en tiempo:**
- Con índices optimizados: **50-150ms por consulta**
- Sin optimizaciones: **500ms-2s**

### 2.2 Escalabilidad por Número de Usuarios

| Métrica | 1K usuarios | 10K usuarios | 100K usuarios | 1M usuarios |
|---------|------------|-------------|---------------|------------|
| **Turnos/mes estimado** | 50K | 500K | 5M | 50M |
| **Tamaño tabla appointments** | 50MB | 500MB | 5GB | 50GB |
| **Queries/segundo pico** | 50 | 200 | 1,000 | 5,000 |
| **Latencia (Índices)** | 50ms | 150ms | 500ms | 2s+ |
| **Latencia (Sin caché)** | 100ms | 300ms | 800ms | 5s+ |
| **Costo infraestructura** | $50/mes | $200/mes | $1,500/mes | $10,000/mes |
| **Viable sin cambios** | ✅ | ⚠️ | 🔴 | 🔴 |

### 2.3 Cuello de Botella: La Tabla `appointments`

**Sin optimizaciones:**
```sql
-- Query ejecutada frecuentemente
SELECT * FROM appointments 
WHERE profile_id = 'uuid-xyz'
  AND start_time >= '2026-06-11'::timestamp
  AND start_time <= '2026-07-11'::timestamp
  AND status = 'confirmed';
```

**Con 5M de turnos globales:**
- PostgreSQL debe recorrer toda la tabla
- Incluso con índice en profile_id, escanea ~500 filas promedio
- En 200 QPS simultáneas → contención de índices

**Solución:** Índice compound
```sql
CREATE INDEX appointments_search_idx 
ON appointments(profile_id, status, start_time)
WHERE status = 'confirmed';
```

**Impacto:**
- Antes: 500ms
- Después: 50ms ✅

---

## 3. Análisis de Concurrencia

### 3.1 El Problema: Race Condition

**Escenario:** Dos clientes intentan reservar el mismo turno simultáneamente.

```
Cliente A                          Tiempo  | Cliente B
────────────────────────────────────────────────────────────
Consulta disponibilidad    ────── T1 ───── Consulta disponibilidad
"14:00-15:00 ✅ Disponible"             "14:00-15:00 ✅ Disponible"

Completa formulario        ────── T2 ───── Completa formulario

Click en "Reservar"        ────── T3 ───── Click en "Reservar"

BEGIN TRANSACTION          ────── T4 ───── (esperando)
  INSERT appointment               │
  Trigger validate                 │
  COMMIT ✅                        │
                           ────── T5 ───── BEGIN TRANSACTION
                                   │       INSERT appointment
                                   │       Trigger validate
                                   │       ❌ EXCEPTION: Overlap!
                                   │       ROLLBACK
                           ────── T6 ───── Error al usuario
```

### 3.2 Defensa Actual: Trigger SQL

```sql
CREATE OR REPLACE FUNCTION check_appointment_overlap()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM appointments
    WHERE profile_id = NEW.profile_id
      AND id != NEW.id
      AND status NOT IN ('cancelled', 'no_show')
      AND (start_time, end_time) OVERLAPS (NEW.start_time, NEW.end_time)
  ) THEN
    RAISE EXCEPTION 'Appointment overlaps with existing booking';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER appointment_overlap_check
  BEFORE INSERT OR UPDATE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION check_appointment_overlap();
```

**¿Qué garantiza?**
- ✅ Impide fisicamente dos turnos superpuestos
- ✅ Funciona con cualquier isolation level
- ✅ A nivel base de datos (confiable)

**¿Qué NO garantiza?**
- ❌ No previene que DOS usuarios pasen validación
- ❌ Uno siempre recibe error después de ver "disponible"
- ❌ Mala experiencia de usuario

### 3.3 Isolation Levels de PostgreSQL

PostgreSQL soporta 3 niveles:

| Nivel | Comportamiento | Impacto en TurnoYa |
|-------|---|---|
| **READ UNCOMMITTED** | Lee datos sin commitear (no en PG) | N/A |
| **READ COMMITTED** | Lee datos ya commitados (default) | Ambos clientes ven slot libre → ambos INSERT |
| **REPEATABLE READ** | Snapshot de BD al iniciar transacción | Mejor aislamiento pero posibles "phantom reads" |
| **SERIALIZABLE** | Transactions completamente secuenciales | Guarantía total pero LENTO |

**Problema con READ COMMITTED (actual):**
```
A: BEGIN → SELECT (ve 0 conflictos) → INSERT → COMMIT
B: BEGIN → SELECT (ve 0 conflictos) → INSERT → ❌ TRIGGER ERROR
```

---

## 4. Problemas Identificados

### 4.1 Problemas de Escalabilidad

| Problema | Severidad | Detalle |
|----------|-----------|--------|
| **Queries sin caché** | 🔴 CRÍTICO | Cada búsqueda toca BD, sin reutilización |
| **Tabla única para todos** | 🟠 ALTO | Una empresa con 10K turnos ralentiza a otras |
| **Índices insuficientes** | 🟠 ALTO | Falta índice compound en (profile_id, status, start_time) |
| **Cálculo en cliente** | 🟡 MEDIO | N+1 queries: cliente valida + servidor valida |
| **Sin particionamiento** | 🟡 MEDIO | Tabla appointments crece sin límites |
| **Timezone dinámico** | 🟡 MEDIO | Conversiones en cada query (sin materialización) |

### 4.2 Problemas de Concurrencia

| Problema | Severidad | Impacto |
|----------|-----------|--------|
| **Race condition en reserva** | 🔴 CRÍTICO | Uno de dos clientes siempre falla |
| **Sin reserva preliminar** | 🟠 ALTO | Cliente puede "perder" el turno mientras completa datos |
| **Confirmation mutable** | 🟠 ALTO | Cliente puede cambiar datos DESPUÉS de confirmar |
| **Sin locks explícitos** | 🟡 MEDIO | Dependemos del trigger (más lento) |
| **Edge cases en timezone** | 🟡 MEDIO | Si cliente está en otra zona horaria → bugs |

### 4.3 Impacto en Usuarios

**Escenario: 2 clientes compiten por el último slot de una peluquería a las 17:00**

```
Tiempo | Cliente A                    | Cliente B               | Sistema
-------|------------------------------|------------------------|----------
T1     | Ve 1 slot disponible         | Ve 1 slot disponible    | BD: 1 libre
T2     | Completa datos (30s)         | Completa datos (30s)    | Ambos llenan formulario
T3     | Intenta reservar             | Intenta reservar        | Carrera
T4     | ✅ Turno confirmado          | ❌ "No disponible"      | A gana
T5     | Recibe email                 | Vuelve al calendario    | B molesto
       |                              | Ya no ve slots          |
```

**Tasa de abandono estimada:** 40-50% de los competidores pierden

---

## 5. Soluciones para MVP

### 5.1 Estado: Mínimo Viable (Sin cambios mayores)

**El MVP actual YA TIENE defensa contra double-booking:**
- ✅ Trigger SQL impide turnos superpuestos
- ✅ Supabase RLS asegura multi-tenancy
- ✅ Índices básicos en place

**Pero tiene UX pobre:**
```
⚠️ Cada 20-30 clientes concurrentes, 1-2 verán error
⚠️ Sensación de que "el turno desapareció"
⚠️ Tasa de conversión baja
```

### 5.2 Mejoras Rápidas para MVP (Costo: Bajo)

#### A. Optimizar Índices

```sql
-- Agregar índice compound que el esquema actual NO tiene
CREATE INDEX appointments_search_optimized_idx 
ON appointments(profile_id, status, start_time, end_time)
WHERE status = 'confirmed';

-- Impacto: Reduce latencia 50% (100ms → 50ms)
-- Tiempo implementación: 5 minutos
-- Costo: Negligible (10MB extra por millón de turnos)
```

#### B. Caché en Cliente (localStorage)

```javascript
// Cache 30 minutos de disponibilidad en el navegador
async function getAvailableSlots(profileId, dateRange) {
  const cacheKey = `availability:${profileId}:${dateRange}`;
  const cached = localStorage.getItem(cacheKey);
  
  if (cached && !isExpired(cached)) {
    return JSON.parse(cached.data);
  }
  
  // Si no hay caché, consultar
  const slots = await fetchFromServer(profileId, dateRange);
  
  // Guardar con timestamp
  localStorage.setItem(cacheKey, JSON.stringify({
    data: slots,
    expiresAt: Date.now() + 30 * 60 * 1000
  }));
  
  return slots;
}

// Impacto: Reduce queries 60-70%
// Tiempo implementación: 30 minutos
// Costo: Cero (localStorage es local)
```

#### C. Validación Doble en Edge Function

```typescript
// En la Edge Function (antes de INSERT)
async function createAppointment(req: Request) {
  const { profileId, startTime, endTime, serviceId, customerData } = await req.json();
  
  // 1. Validar en servidor (NO confiar en cliente)
  const conflicts = await supabase
    .from('appointments')
    .select('id')
    .eq('profile_id', profileId)
    .eq('status', 'confirmed')
    .gte('start_time', startTime)
    .lt('end_time', endTime);
  
  if (conflicts.data.length > 0) {
    return new Response(
      JSON.stringify({ error: 'Turno no disponible' }),
      { status: 409 } // Conflict
    );
  }
  
  // 2. Crear turno (el trigger hará validación final)
  const { data, error } = await supabase
    .from('appointments')
    .insert([{
      profile_id: profileId,
      start_time: startTime,
      end_time: endTime,
      service_id: serviceId,
      // ... otros datos
    }]);
  
  if (error?.code === 'new row violates row-level security policy') {
    return new Response(
      JSON.stringify({ error: 'Turno ocupado (conflict)' }),
      { status: 409 }
    );
  }
  
  return new Response(JSON.stringify({ success: true, data }), { status: 201 });
}

// Impacto: Detecta conflictos antes del trigger (mejor error handling)
// Tiempo implementación: 1 hora
// Costo: +1 query por reserva
```

#### D. Mensaje UX Honesto

```javascript
// En el frontend, ser honesto sobre concurrencia
async function reservarTurno(slot) {
  try {
    const result = await createAppointment(slot);
    showSuccess("¡Turno reservado!");
  } catch (error) {
    if (error.status === 409) {
      showError(
        "Lo sentimos, alguien reservó este turno justo ahora. " +
        "Intenta con otro horario disponible."
      );
      // Refrescar disponibilidad
      refreshAvailability();
    }
  }
}

// Impacto: Cliente entiende qué pasó (no es error del sistema)
// Tiempo implementación: 15 minutos
// Costo: UX mejorado
```

### 5.3 Recomendación MVP

✅ **Implementar todas las mejoras rápidas (A + B + C + D)**

**Beneficio:**
- Latencia: 100ms → 50ms
- Queries BD: -60%
- UX mejorada con mensajes claros
- Costo de desarrollo: ~2 horas
- Mantenimiento: Mínimo

**Limitación:**
- Sigue sin resolver race condition perfectamente
- ~5% de clientes verán error (mejora de 20% a 5%)

---

## 6. Mejoras a Mediano Plazo

### 6.1 Solución: Reservation Hold (10K+ usuarios)

**Problema que resuelve:** Cuando cliente está completando datos, el turno se le puede "robar"

**Cómo funciona:**

```sql
-- Agregar columnas a appointments
ALTER TABLE appointments ADD COLUMN (
  hold_status TEXT DEFAULT 'confirmed' 
    CHECK (hold_status IN ('confirmed', 'held', 'expired')),
  hold_token UUID,
  hold_until TIMESTAMP
);

-- Índice para limpiar holds rápido
CREATE INDEX appointments_hold_cleanup_idx 
ON appointments(hold_status, hold_until)
WHERE hold_status = 'held';
```

**Flujo:**

```javascript
// 1. Usuario selecciona horario → crear HOLD por 10 minutos
async function holdSlot(profileId, startTime, endTime, serviceDuration) {
  const holdToken = crypto.randomUUID();
  
  const { data, error } = await supabase.rpc('hold_appointment_slot', {
    p_profile_id: profileId,
    p_service_id: serviceId,
    p_start_time: startTime,
    p_end_time: endTime,
    p_hold_token: holdToken,
    p_hold_until: new Date(Date.now() + 10 * 60 * 1000)
  });
  
  if (error) {
    // Otra persona lo tomó
    return { success: false, message: 'No disponible' };
  }
  
  return { success: true, holdToken }; // Guardar en sesión
}

// 2. Usuario completa datos (hasta 10 min)
async function confirmAppointment(holdToken, customerData) {
  const { data, error } = await supabase.rpc('confirm_held_appointment', {
    p_hold_token: holdToken,
    p_customer_data: customerData
  });
  
  if (error?.code === 'HOLD_EXPIRED') {
    return { success: false, message: 'Tiempo expirado, intenta otro turno' };
  }
  
  return { success: true, data };
}
```

**SQL Function:**
```sql
CREATE FUNCTION hold_appointment_slot(
  p_profile_id UUID,
  p_service_id UUID,
  p_start_time TIMESTAMP,
  p_end_time TIMESTAMP,
  p_hold_token UUID,
  p_hold_until TIMESTAMP
) RETURNS TABLE (success BOOLEAN, appointment_id UUID) AS $$
DECLARE
  v_conflict_count INT;
  v_new_id UUID;
BEGIN
  -- Validar que NO hay conflictos
  SELECT COUNT(*) INTO v_conflict_count FROM appointments
  WHERE profile_id = p_profile_id
    AND (
      (status = 'confirmed') OR 
      (hold_status = 'held' AND hold_until > now())
    )
    AND (start_time, end_time) OVERLAPS (p_start_time, p_end_time);
  
  IF v_conflict_count > 0 THEN
    RAISE EXCEPTION 'SLOT_NOT_AVAILABLE';
  END IF;
  
  -- Crear hold
  INSERT INTO appointments (
    profile_id, service_id, start_time, end_time,
    hold_status, hold_token, hold_until, status
  ) VALUES (
    p_profile_id, p_service_id, p_start_time, p_end_time,
    'held', p_hold_token, p_hold_until, 'pending'
  )
  RETURNING id INTO v_new_id;
  
  RETURN QUERY SELECT true, v_new_id;
EXCEPTION WHEN OTHERS THEN
  RETURN QUERY SELECT false, NULL::UUID;
END;
$$ LANGUAGE plpgsql;

-- Limpiar holds expirados (cron)
CREATE FUNCTION cleanup_expired_holds() RETURNS void AS $$
BEGIN
  DELETE FROM appointments 
  WHERE hold_status = 'held' 
    AND hold_until < now()
    AND status = 'pending';
END;
$$ LANGUAGE plpgsql;
```

**Ventajas:**
- ✅ Garantía 100% de concurrencia
- ✅ UX excelente (usuario tiene 10 min)
- ✅ Fair: Primero que clickea gana
- ✅ Escalable hasta 100K usuarios

**Desventajas:**
- ⚠️ Más código (~200 líneas)
- ⚠️ Necesita cron job
- ⚠️ Slots se pueden "bloquear" si cliente abandona

**Cuándo implementar:**
- Si tasa de conversión cae <70%
- Si tener <5% de errores por concurrencia
- Al llegar a 5K+ usuarios activos

---

## 7. Soluciones a Largo Plazo

### 7.1 Escala: 100K+ usuarios

**Problema:** PostgreSQL no escala para 10K QPS

**Solución: CQRS (Command Query Responsibility Segregation)**

```
┌─────────────────────────────────────────┐
│   Frontend React                        │
└────────────┬────────────────────────────┘
             │
      ┌──────┴──────┐
      │             │
      ▼             ▼
 QUERIES      COMMANDS
 (búsqueda)   (crear)
      │             │
      │             ▼
      │        ┌─────────────────┐
      │        │  PostgreSQL     │
      │        │  (transactional)│
      │        └─────────────────┘
      │             │
      │             ▼
      │        ┌─────────────────┐
      │        │  Event Bus      │
      │        │  (Kafka/PubSub) │
      │        └─────────────────┘
      │             │
      ▼             ▼
 ┌─────────────────────────┐
 │  Elasticsearch / Redis  │
 │  (read model)           │
 └─────────────────────────┘
```

**Cómo funciona:**

1. **Command (CREATE APPOINTMENT):**
   - Cliente → Edge Function → PostgreSQL
   - Transaccional, ACID garantizado
   - Publica evento: `appointment.created`

2. **Query (GET AVAILABILITY):**
   - Cliente → Edge Function → Elasticsearch
   - Lee datos denormalizados
   - <10ms de latencia, soporta 10K QPS

3. **Event Sync:**
   - PostgreSQL publica evento
   - Listener actualiza Elasticsearch
   - Asincrónico, no bloquea usuario

**Implementación:**

```typescript
// CREATE: Transactional (PostgreSQL)
async function createAppointment(req: Request) {
  const { profileId, startTime, endTime } = await req.json();
  
  // 1. Insertar en PostgreSQL (con trigger validation)
  const { data: appointment, error } = await supabase
    .from('appointments')
    .insert([{ profile_id: profileId, start_time: startTime, ... }])
    .select();
  
  if (error) return errorResponse(409);
  
  // 2. Publicar evento (async, no esperar)
  await pubsub.publish('appointment.created', {
    appointmentId: appointment.id,
    profileId: profileId,
    startTime: startTime,
    endTime: endTime
  });
  
  return successResponse(appointment);
}

// QUERY: From Elasticsearch (Fast)
async function getAvailableSlots(req: Request) {
  const { profileId, dateRange } = req.query;
  
  // Elasticsearch tiene índice desnormalizado de disponibilidad
  const results = await elasticsearch.search({
    index: 'availability',
    body: {
      query: {
        bool: {
          must: [
            { term: { profileId } },
            { range: { date: { gte: dateRange.start } } }
          ]
        }
      }
    }
  });
  
  return successResponse(results.hits.hits.map(hit => hit._source));
}

// LISTENER: Sincronizar BD con Elasticsearch
async function onAppointmentCreated(event) {
  const { profileId, startTime, endTime } = event;
  
  // Recalcular disponibilidad en Elasticsearch
  const newAvailability = await calculateAvailability(profileId);
  
  await elasticsearch.update({
    index: 'availability',
    id: `${profileId}:${startTime}`,
    body: { doc: newAvailability }
  });
}
```

**Ventajas:**
- ✅ Soporta 100K+ usuarios
- ✅ Queries <10ms
- ✅ PostgreSQL solo para transacciones (no bloqueado)
- ✅ Escalable horizontalmente

**Desventajas:**
- ❌ Complejidad significativa
- ❌ Eventual consistency (disponibilidad puede estar 1-2s desactualizada)
- ❌ Infraestructura adicional (Elasticsearch, PubSub)

**Costo:**
- Elasticsearch: $200-1000/mes
- Event Bus: $500/mes
- Desarrollo: 2-4 semanas

### 7.2 Tabla `appointments` Particionada

**Para 100M+ turnos:**

```sql
-- Particionar por mes
CREATE TABLE appointments_2026_06 PARTITION OF appointments
  FOR VALUES FROM ('2026-06-01') TO ('2026-07-01');

CREATE TABLE appointments_2026_07 PARTITION OF appointments
  FOR VALUES FROM ('2026-07-01') TO ('2026-08-01');

-- Beneficio: Queries más rápidas en rangos de fechas
-- Mantenimiento: Limpiar particiones viejas automáticamente
```

### 7.3 Read Replicas

**Para alta concurrencia de lectura:**

```
┌──────────────────┐
│   Master (RW)    │ ← Escrituras
│  PostgreSQL      │
└────────┬─────────┘
         │
    ┌────┴────────────────┐
    │                     │
    ▼                     ▼
┌─────────┐        ┌─────────────┐
│ Replica1│ ← Lecturas
│ (RO)    │        │   Replica2  │
└─────────┘        │   (RO)      │
                   └─────────────┘
```

**Implementación en Supabase:**
```typescript
// Leer desde replica para búsquedas
const searchClient = supabase.replica();
const appointments = await searchClient
  .from('appointments')
  .select('*')
  .eq('profile_id', profileId);

// Escribir siempre a master
const { data } = await supabase
  .from('appointments')
  .insert([newAppointment]);
```

---

## 8. Roadmap de Implementación

### Fase 1: MVP (Ahora - Semana 1)
**Duración: 2 días de desarrollo**

Objetivo: Lanzar con escalabilidad básica

```
[ ] 1. Agregar índice compound appointments_search_optimized_idx
[ ] 2. Implementar caché localStorage (30 min)
[ ] 3. Validación doble en Edge Function (1 hora)
[ ] 4. Mensajes UX claros para concurrencia (30 min)
[ ] 5. Testing de concurrencia (crear 100 requests simultáneas)
[ ] 6. Monitoreo en Supabase (observar latencia)

Criterio de éxito:
✅ Latencia <100ms
✅ <5% de errores por concurrencia
✅ Cero turnos dobles
```

### Fase 2: Growth (5-10K usuarios - Semana 4-8)
**Duración: 1 semana de desarrollo**

Objetivo: Mejorar UX bajo carga

```
[ ] 1. Implementar Reservation Hold (2 días)
[ ] 2. Crear cron job para limpiar holds (1 hora)
[ ] 3. Agregar Redis para caché (1 día)
[ ] 4. Monitoreo y alertas en Datadog/Sentry (1 día)
[ ] 5. Testing de carga (Locust: simular 500 QPS)

Criterio de éxito:
✅ Latencia <50ms en p95
✅ Tasa de conversión >85%
✅ <1% abandonos por timeout
```

### Fase 3: Scale (50K+ usuarios - Semana 12+)
**Duración: 4 semanas de desarrollo**

Objetivo: Arquitectura de larga escala

```
[ ] 1. Setup Elasticsearch cluster (2 días)
[ ] 2. Implementar CQRS (evento-driven) (2 semanas)
[ ] 3. Migrar queries READ a Elasticsearch (1 semana)
[ ] 4. Setup read replicas PostgreSQL (3 días)
[ ] 5. Implementar particionamiento por fecha (1 semana)
[ ] 6. Migration testing end-to-end (5 días)

Criterio de éxito:
✅ Soporta 1000+ QPS
✅ Latencia p95 <100ms
✅ Eventual consistency <2s
✅ Zero downtime deployment
```

---

## 9. Monitoreo y Métricas

### Métricas Clave para Monitorear

```javascript
// En cada Edge Function:
const startTime = performance.now();

const result = await createAppointment(req);

const duration = performance.now() - startTime;

// Reportar métricas
await metrics.record({
  operation: 'create_appointment',
  duration_ms: duration,
  success: !error,
  error_code: error?.code,
  timestamp: new Date()
});
```

**Dashboard recomendado:**

| Métrica | Alerta | Acción |
|---------|--------|--------|
| Latencia p95 >200ms | 🔴 | Revisar índices, caché |
| Error rate >2% | 🔴 | Revisar trigger, concurrencia |
| Queries BD >300 QPS | 🟠 | Agregar caché, replicas |
| Conflicts/min >10 | 🟠 | Implementar Reservation Hold |
| Tabla appointments >10GB | 🟠 | Planear particionamiento |

---

## 10. Resumen Ejecutivo

| Aspecto | MVP | Growth | Scale |
|--------|-----|--------|-------|
| **Usuarios max** | 10K | 50K | 1M+ |
| **Solución concurrencia** | Trigger SQL | Reservation Hold | Elasticsearch |
| **Latencia p95** | 100ms | 50ms | 100ms |
| **Costo/mes** | $50 | $500 | $5K+ |
| **Complejidad** | Baja | Media | Alta |
| **Tiempo implementación** | 2 días | 1 semana | 4 semanas |

**Recomendación:** Comenzar con MVP, monitorear métricas, migrar a Growth cuando se alcancen 5K usuarios activos.

---

## Apéndice A: Performance Testing

### Script de Prueba de Concurrencia

```bash
#!/bin/bash
# Simular 100 clientes intentando reservar el mismo slot

for i in {1..100}; do
  curl -X POST https://api.turnoya.com/appointments \
    -H "Content-Type: application/json" \
    -d '{
      "profileId": "abc123",
      "startTime": "2026-06-15T14:00:00",
      "endTime": "2026-06-15T15:00:00",
      "customerId": "client-'$i'"
    }' &
done

wait

# Esperar resultados y analizar:
# - Cuántos exitosos (esperado: 1)
# - Cuántos fallaron con conflict (esperado: 99)
# - Latencia promedio
```

### Comando para Load Testing

```bash
# Instalar locust
pip install locust

# Ejecutar test
locust -f locustfile.py --host=https://api.turnoya.com -u 500 -r 50 --run-time 5m
```

