# Esquema de Base de Datos - TurnoYa

**Última actualización:** Junio 2026  
**Versión:** 1.0  
**Base de datos:** PostgreSQL (Supabase)

---

## 1. Visión General

El esquema de base de datos de TurnoYa está diseñado para:
- Gestionar profesionales/comercios y sus configuraciones
- Registrar servicios ofrecidos y sus características
- Mantener disponibilidad horaria y turnos
- Almacenar datos de clientes y sus reservas
- Registrar notificaciones enviadas
- Soportar cálculo automático de disponibilidad

**Principios de diseño:**
- Normalización relacional (hasta 3FN)
- Soporte para múltiples zonas horarias
- Constrains explícitos para evitar overlaps
- Row Level Security (RLS) para multi-tenancy
- Auditoría mediante timestamps (created_at, updated_at)

---

## 2. Diagrama de Entidades

```
┌─────────────────────┐
│      users          │
├─────────────────────┤
│ id (PK)             │
│ email (UNIQUE)      │
│ password_hash       │
│ created_at          │
│ updated_at          │
└──────────┬──────────┘
           │
           │ 1:1
           ▼
┌─────────────────────┐
│     profiles        │
├─────────────────────┤
│ id (PK)             │
│ user_id (FK)        │
│ business_name       │
│ description         │
│ logo_url            │
│ address             │
│ phone               │
│ timezone            │
│ slug (UNIQUE)       │
│ created_at          │
│ updated_at          │
└──────────┬──────────┘
           │
      ┌────┴────────────┬─────────────────────┐
      │                 │                     │
      │ 1:N             │ 1:N                 │ 1:N
      ▼                 ▼                     ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────────┐
│  services    │  │working_hours │  │ blocked_times    │
├──────────────┤  ├──────────────┤  ├──────────────────┤
│ id (PK)      │  │ id (PK)      │  │ id (PK)          │
│ profile_id   │  │ profile_id   │  │ profile_id       │
│ name         │  │ day_of_week  │  │ start_time       │
│ description  │  │ start_time   │  │ end_time         │
│ duration_min │  │ end_time     │  │ reason           │
│ price        │  │ is_active    │  │ created_at       │
│ created_at   │  │ created_at   │  │ updated_at       │
│ updated_at   │  │ updated_at   │  └──────────────────┘
└──────┬───────┘  └──────────────┘
       │
       │ 1:N
       ▼
┌──────────────────┐
│  appointments    │
├──────────────────┤
│ id (PK)          │
│ profile_id (FK)  │
│ service_id (FK)  │
│ customer_id (FK) │
│ start_time       │
│ end_time         │
│ status           │
│ notes            │
│ created_at       │
│ updated_at       │
└──────┬───────────┘
       │
       │ 1:N
       ▼
┌──────────────────┐
│ notifications    │
├──────────────────┤
│ id (PK)          │
│ appointment_id   │
│ type             │
│ recipient_email  │
│ sent_at          │
│ status           │
│ created_at       │
└──────────────────┘

┌──────────────┐
│  customers   │
├──────────────┤
│ id (PK)      │
│ email        │
│ phone        │
│ first_name   │
│ last_name    │
│ created_at   │
│ updated_at   │
└──────────────┘
```

---

## 3. Definición de Tablas

### 3.1. `users`
Usuarios profesionales registrados en la plataforma. Creada automáticamente por Supabase Auth.

| Columna | Tipo | Constraints | Descripción |
|---------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | ID autogenerado por Auth |
| email | TEXT | UNIQUE, NOT NULL | Email único del usuario |
| created_at | TIMESTAMP | NOT NULL, DEFAULT now() | Fecha de creación |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT now() | Última actualización |

**Índices:**
- `users_pkey`: PRIMARY KEY (id)
- `users_email_key`: UNIQUE (email)

---

### 3.2. `profiles`
Perfil del comercio/profesional. Una relación 1:1 con `users`.

| Columna | Tipo | Constraints | Descripción |
|---------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | ID autogenerado |
| user_id | UUID | UNIQUE, NOT NULL, FK → users.id | Referencia al usuario |
| business_name | TEXT | NOT NULL | Nombre del comercio/profesional |
| description | TEXT | | Descripción de los servicios |
| logo_url | TEXT | | URL de la imagen del logo |
| address | TEXT | | Dirección del comercio |
| phone | TEXT | | Teléfono de contacto |
| timezone | TEXT | NOT NULL, DEFAULT 'America/Argentina/Buenos_Aires' | Zona horaria |
| slug | TEXT | UNIQUE, NOT NULL | URL slug único (ej: "mi-negocio") |
| is_active | BOOLEAN | NOT NULL, DEFAULT true | Estado del perfil |
| created_at | TIMESTAMP | NOT NULL, DEFAULT now() | Fecha de creación |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT now() | Última actualización |

**Índices:**
- `profiles_pkey`: PRIMARY KEY (id)
- `profiles_user_id_key`: UNIQUE (user_id)
- `profiles_slug_key`: UNIQUE (slug)
- `profiles_slug_idx`: INDEX (slug) — para búsquedas rápidas

**Foreign Keys:**
- profiles.user_id → users.id ON DELETE CASCADE

---

### 3.3. `services`
Servicios ofrecidos por el profesional.

| Columna | Tipo | Constraints | Descripción |
|---------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | ID autogenerado |
| profile_id | UUID | NOT NULL, FK → profiles.id | Comercio propietario |
| name | TEXT | NOT NULL | Nombre del servicio |
| description | TEXT | | Descripción detallada |
| duration_minutes | INT | NOT NULL, CHECK > 0 | Duración en minutos |
| price | NUMERIC(10,2) | | Precio (NULL = sin precio) |
| color | TEXT | DEFAULT '#3b82f6' | Color para el calendario |
| is_active | BOOLEAN | NOT NULL, DEFAULT true | Disponibilidad del servicio |
| created_at | TIMESTAMP | NOT NULL, DEFAULT now() | Fecha de creación |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT now() | Última actualización |

**Constraints:**
- `services_duration_positive`: CHECK (duration_minutes > 0)

**Índices:**
- `services_pkey`: PRIMARY KEY (id)
- `services_profile_id_idx`: INDEX (profile_id)

**Foreign Keys:**
- services.profile_id → profiles.id ON DELETE CASCADE

---

### 3.4. `working_hours`
Horarios de atención regulares del profesional (configuración semanal).

| Columna | Tipo | Constraints | Descripción |
|---------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | ID autogenerado |
| profile_id | UUID | NOT NULL, FK → profiles.id | Comercio propietario |
| day_of_week | INT | NOT NULL, CHECK (0-6) | Día de la semana (0=DOM, 6=SAB) |
| start_time | TIME | NOT NULL | Hora de inicio (ej: 09:00) |
| end_time | TIME | NOT NULL | Hora de fin (ej: 18:00) |
| break_start | TIME | | Hora inicio del descanso (opcional) |
| break_end | TIME | | Hora fin del descanso (opcional) |
| is_active | BOOLEAN | NOT NULL, DEFAULT true | ¿Día laboral? |
| created_at | TIMESTAMP | NOT NULL, DEFAULT now() | Fecha de creación |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT now() | Última actualización |

**Constraints:**
- `working_hours_day_valid`: CHECK (day_of_week >= 0 AND day_of_week <= 6)
- `working_hours_time_valid`: CHECK (start_time < end_time)
- `working_hours_break_valid`: CHECK (break_start IS NULL OR (break_start < break_end AND break_start >= start_time AND break_end <= end_time))

**Índices:**
- `working_hours_pkey`: PRIMARY KEY (id)
- `working_hours_profile_id_idx`: INDEX (profile_id, day_of_week)

**Foreign Keys:**
- working_hours.profile_id → profiles.id ON DELETE CASCADE

---

### 3.5. `blocked_times`
Bloques horarios específicos no disponibles (vacaciones, mantenimiento, etc.).

| Columna | Tipo | Constraints | Descripción |
|---------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | ID autogenerado |
| profile_id | UUID | NOT NULL, FK → profiles.id | Comercio propietario |
| start_time | TIMESTAMP | NOT NULL | Inicio del bloqueo |
| end_time | TIMESTAMP | NOT NULL | Fin del bloqueo |
| reason | TEXT | | Motivo del bloqueo |
| created_at | TIMESTAMP | NOT NULL, DEFAULT now() | Fecha de creación |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT now() | Última actualización |

**Constraints:**
- `blocked_times_range_valid`: CHECK (start_time < end_time)

**Índices:**
- `blocked_times_pkey`: PRIMARY KEY (id)
- `blocked_times_profile_id_idx`: INDEX (profile_id)
- `blocked_times_range_idx`: INDEX (profile_id, start_time, end_time)

**Foreign Keys:**
- blocked_times.profile_id → profiles.id ON DELETE CASCADE

---

### 3.6. `customers`
Datos de clientes que realizan reservas (sin crear cuenta en el sistema).

| Columna | Tipo | Constraints | Descripción |
|---------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | ID autogenerado |
| email | TEXT | NOT NULL | Email del cliente |
| phone | TEXT | NOT NULL | Teléfono/WhatsApp |
| first_name | TEXT | NOT NULL | Nombre |
| last_name | TEXT | NOT NULL | Apellido |
| created_at | TIMESTAMP | NOT NULL, DEFAULT now() | Fecha de creación |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT now() | Última actualización |

**Índices:**
- `customers_pkey`: PRIMARY KEY (id)
- `customers_email_phone_idx`: INDEX (email, phone)

---

### 3.7. `appointments`
Turnos/citas reservados por clientes.

| Columna | Tipo | Constraints | Descripción |
|---------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | ID autogenerado |
| profile_id | UUID | NOT NULL, FK → profiles.id | Comercio propietario |
| service_id | UUID | NOT NULL, FK → services.id | Servicio reservado |
| customer_id | UUID | NOT NULL, FK → customers.id | Cliente |
| start_time | TIMESTAMP | NOT NULL | Inicio del turno (en zona horaria del perfil) |
| end_time | TIMESTAMP | NOT NULL | Fin del turno |
| status | TEXT | NOT NULL, DEFAULT 'confirmed' | Estado (confirmed, cancelled, no_show, completed) |
| notes | TEXT | | Notas del profesional |
| reminder_24h_sent | BOOLEAN | DEFAULT false | ¿Se envió recordatorio 24hs? |
| reminder_2h_sent | BOOLEAN | DEFAULT false | ¿Se envió recordatorio 2hs? |
| created_at | TIMESTAMP | NOT NULL, DEFAULT now() | Fecha de creación |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT now() | Última actualización |

**Constraints:**
- `appointments_time_valid`: CHECK (start_time < end_time)
- `appointments_status_valid`: CHECK (status IN ('confirmed', 'cancelled', 'no_show', 'completed'))

**Índices:**
- `appointments_pkey`: PRIMARY KEY (id)
- `appointments_profile_id_idx`: INDEX (profile_id)
- `appointments_customer_id_idx`: INDEX (customer_id)
- `appointments_service_id_idx`: INDEX (service_id)
- `appointments_status_idx`: INDEX (profile_id, status)
- `appointments_time_idx`: INDEX (profile_id, start_time, end_time) — para evitar overlaps
- `appointments_customer_email_idx`: INDEX (customer_id, profile_id)

**Foreign Keys:**
- appointments.profile_id → profiles.id ON DELETE CASCADE
- appointments.service_id → services.id ON DELETE RESTRICT
- appointments.customer_id → customers.id ON DELETE CASCADE

---

### 3.8. `notifications`
Registro de notificaciones enviadas (auditoría y debugging).

| Columna | Tipo | Constraints | Descripción |
|---------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | ID autogenerado |
| appointment_id | UUID | NOT NULL, FK → appointments.id | Turno asociado |
| type | TEXT | NOT NULL | Tipo (confirmation, reminder_24h, reminder_2h, cancellation) |
| recipient_email | TEXT | NOT NULL | Email destinatario |
| subject | TEXT | | Asunto del email |
| body | TEXT | | Cuerpo del email |
| sent_at | TIMESTAMP | NOT NULL, DEFAULT now() | Fecha de envío |
| status | TEXT | DEFAULT 'sent' | Estado (sent, pending, failed, bounced) |
| error_message | TEXT | | Mensaje de error si falló |
| created_at | TIMESTAMP | NOT NULL, DEFAULT now() | Fecha de registro |

**Índices:**
- `notifications_pkey`: PRIMARY KEY (id)
- `notifications_appointment_id_idx`: INDEX (appointment_id)
- `notifications_status_idx`: INDEX (status, sent_at)

**Foreign Keys:**
- notifications.appointment_id → appointments.id ON DELETE CASCADE

---

## 4. Políticas de Row Level Security (RLS)

Todas las tablas relacionadas con `profiles` cuentan con RLS habilitado para asegurar que cada usuario solo acceda a sus propios datos.

### 4.1. `profiles` RLS
```sql
-- Los usuarios solo pueden ver su propio perfil
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = user_id);

-- Los usuarios solo pueden actualizar su propio perfil
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Los usuarios solo pueden insertar su propio perfil
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

### 4.2. `services` RLS
```sql
-- Los usuarios solo ven servicios de su perfil
CREATE POLICY "Users can view own services"
  ON services FOR SELECT
  USING (
    profile_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

-- Los usuarios solo pueden modificar servicios de su perfil
CREATE POLICY "Users can manage own services"
  ON services FOR INSERT
  WITH CHECK (
    profile_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );
```

### 4.3. `appointments` RLS
```sql
-- Los usuarios ven turnos de su perfil
CREATE POLICY "Users can view own appointments"
  ON appointments FOR SELECT
  USING (
    profile_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

-- Los usuarios pueden crear turnos en su perfil
CREATE POLICY "Users can create appointments"
  ON appointments FOR INSERT
  WITH CHECK (
    profile_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );
```

### 4.4. `working_hours`, `blocked_times` RLS
Se aplican políticas similares a las anteriores.

---

## 5. Funciones y Triggers SQL

### 5.1. Trigger: Evitar solapamiento de turnos
```sql
CREATE OR REPLACE FUNCTION check_appointment_overlap()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM appointments
    WHERE profile_id = NEW.profile_id
      AND id != NEW.id
      AND status NOT IN ('cancelled', 'no_show')
      AND (
        (start_time, end_time) OVERLAPS (NEW.start_time, NEW.end_time)
      )
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

### 5.2. Trigger: Actualizar `updated_at` automáticamente
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar a todas las tablas que tengan updated_at:
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ... etc para otras tablas
```

---

## 6. Vistas Útiles

### 6.1. Vista: Próximos turnos (sin confirmación)
```sql
CREATE VIEW upcoming_appointments_needing_reminders AS
SELECT
  a.id,
  a.appointment_id,
  a.customer_id,
  a.profile_id,
  a.start_time,
  a.reminder_24h_sent,
  a.reminder_2h_sent
FROM appointments a
WHERE a.status = 'confirmed'
  AND a.start_time > now()
  AND a.start_time <= now() + INTERVAL '24 hours'
  AND a.reminder_24h_sent = false;
```

### 6.2. Vista: Disponibilidad en tiempo real
```sql
CREATE VIEW available_slots AS
SELECT
  p.id as profile_id,
  p.slug,
  s.id as service_id,
  s.name as service_name,
  s.duration_minutes,
  -- Lógica: generar slots disponibles basado en working_hours - appointments
  -- Esta vista requiere lógica más compleja (mejor implementar en la aplicación)
  1 as placeholder
FROM profiles p
JOIN services s ON s.profile_id = p.id
WHERE p.is_active = true AND s.is_active = true;
```

---

## 7. Migraciones

Las migraciones de Supabase se ejecutarán en orden:

1. **001_create_initial_schema.sql** — Crear tablas base (users es manejada por Auth)
2. **002_create_indexes.sql** — Crear índices para performance
3. **003_create_functions_triggers.sql** — Crear funciones y triggers
4. **004_enable_rls.sql** — Habilitar Row Level Security
5. **005_create_views.sql** — Crear vistas útiles

---

## 8. Consideraciones de Performance

- **Índices en foreign keys:** Todas las FK tienen índices para optimizar JOINs.
- **Índices en búsquedas frecuentes:** Slug, status, dates.
- **Particionamiento futuro:** La tabla `appointments` podría particionarse por fecha si crece significativamente.
- **Caché de disponibilidad:** La lógica de cálculo de slots disponibles debe implementarse en la aplicación, no en SQL, para mejor performance.

---

## 9. Ejemplo de flujo de datos

### Reservar un turno:
1. Cliente accede a `/turnoya.com/mi-negocio`
2. Frontend consulta servicios via `SELECT * FROM services WHERE profile_id = ?`
3. Cliente selecciona servicio y fecha
4. Frontend calcula slots disponibles (lógica en JS/React)
5. Cliente completa formulario (nombre, email, teléfono)
6. Backend crea registro en `customers` y `appointments`
7. Trigger `check_appointment_overlap()` valida no solapamiento
8. Edge Function envía email de confirmación → registra en `notifications`

---

## 10. Diccionario de Estados

### `appointments.status`
- `confirmed`: Turno confirmado y pendiente
- `completed`: Turno realizado
- `cancelled`: Cancelado por cliente o profesional
- `no_show`: Cliente no asistió

### `notifications.status`
- `sent`: Email enviado exitosamente
- `pending`: En cola para enviar
- `failed`: Error al enviar
- `bounced`: Email rechazado por servidor destino

---

## Notas de Implementación

1. **Timezone:** Todos los timestamps deben almacenarse en UTC. La conversión a zona horaria del usuario ocurre en la aplicación.
2. **No-shows:** Implementar una cron job que marque automáticamente como `no_show` si han pasado más de 15 minutos de la hora de inicio.
3. **Limpieza de datos:** Considerar política de retention para clientes sin turnos activos.
4. **Auditoría:** La tabla `notifications` actúa como auditoría para comunicaciones.
