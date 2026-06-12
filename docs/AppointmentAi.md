# AppointmentAi: PRD Ejecutable & Blueprint de Arquitectura

**Versión:** 2.0 - Production Ready  
**Fecha:** Junio 2026  
**Última actualización:** 12/06/2026  
**Estado:** 🟢 Ready for Automode Development

---

## Table of Contents

1. [Visión General](#1-visión-general)
2. [Problema & Solución](#2-problema--solución)
3. [MVP Funcional](#3-mvp-funcional)
4. [Stack Tecnológico](#4-stack-tecnológico)
5. [Requisitos No Funcionales](#5-requisitos-no-funcionales)
6. [Arquitectura & Clean Code](#6-arquitectura--clean-code)
7. [Diseño de Base de Datos](#7-diseño-de-base-de-datos)
8. [Implementación Fase por Fase](#8-implementación-fase-por-fase)
9. [Testing & Quality Assurance](#9-testing--quality-assurance)
10. [Escalabilidad & Performance](#10-escalabilidad--performance)
11. [Errores Conocidos & Soluciones](#11-errores-conocidos--soluciones)
12. [Checklist de Deploy](#12-checklist-de-deploy)

---

## 1. Visión General

### 1.1 Qué es AppointmentAi

**AppointmentAi** (antes TurnoYa) es una plataforma SaaS de autogestión de turnos para:
- Pequeños negocios (peluquerías, barbershops, consultorios)
- Profesionales independientes (médicos, abogados, psicólogos)
- Comercios de cercanía (estéticas, salones de masajes)

**Propuesta de valor:**
- Clientes reservan online sin fricciones (sin crear cuenta)
- Negocios reducen ausentismo (no-shows) con recordatorios automáticos
- Disponibilidad en tiempo real, cero doble-booking
- Link único que comparten en Instagram/WhatsApp

### 1.2 KPIs de Éxito MVP

| Métrica | Target |
|---------|--------|
| **Adopción** | 100+ negocios registrados en 3 meses |
| **Conversión** | 70%+ de visitantes → reserva |
| **Retención** | 50%+ active users después 30 días |
| **No-shows** | Reducción 30% vs. baseline (sin app) |
| **Performance** | <100ms latencia p95 |
| **Uptime** | 99.9% SLA |

---

## 2. Problema & Solución

### 2.1 Problema del Oferente (Business Owner)

```
❌ Procesos manuales:
  - Manejo de WhatsApp/llamadas para coordinar turnos (2-3 horas/día)
  - Conflictos de disponibilidad (overbooking manual)
  - Ausentismo sin notificación (30-40% no-show rate)
  - Sin visibilidad de flujos

✅ Solución AppointmentAi:
  - Reservas automáticas, 24/7, sin intervención
  - Zero double-booking (validación en BD con trigger)
  - Recordatorios automáticos 24h y 2h antes (reduce no-shows 30%)
  - Dashboard con analytics básicos
```

### 2.2 Problema del Cliente (Consumer)

```
❌ Fricción actual:
  - No sabe qué horarios están disponibles (debe preguntar)
  - Espera confirmación manual
  - Depende de horarios de atención del negocio
  - Sin transparencia de precios

✅ Solución AppointmentAi:
  - Ve disponibilidad real en calendario
  - Confirmación inmediata
  - Reserva en cualquier momento (24/7)
  - Información clara de precios
```

---

## 3. MVP Funcional

### 3.1 Usuarios Target

#### Rol: Profesional/Dueño de Negocio
**Necesidades:**
- Crear cuenta y perfil (nombre, logo, datos)
- Configurar horarios (lun-dom, breaks)
- Crear servicios (nombre, duración, precio)
- Ver turnos en dashboard
- Recibir notificaciones

#### Rol: Cliente/Consumidor
**Necesidades:**
- Acceder a link público SIN crear cuenta
- Ver servicios disponibles
- Elegir fecha/hora en calendario
- Completar datos básicos
- Recibir confirmación

### 3.2 Features del MVP

#### 📊 Profesional - Panel de Control

| Feature | Priority |
|---------|----------|
| **Registro & Auth** | CRÍTICO |
| Crear perfil (nombre, logo) | CRÍTICO |
| Gestionar servicios (CRUD) | CRÍTICO |
| Configurar horarios | CRÍTICO |
| Dashboard de turnos | CRÍTICO |
| Ver stats (próximos 30d) | ALTO |

#### 👤 Cliente - Página Pública

| Feature | Priority |
|---------|----------|
| Acceso público sin auth | CRÍTICO |
| Ver servicios | CRÍTICO |
| Seleccionar fecha | CRÍTICO |
| Seleccionar horario | CRÍTICO |
| Llenar datos (nombre, email) | CRÍTICO |
| Confirmar reserva | CRÍTICO |

---

## 4. Stack Tecnológico

### 4.1 Frontend

```typescript
// Language & Framework
Framework         : React 18 (Hooks + FC)
Language          : TypeScript strict mode
Build tool        : Vite 5+
Styling           : Tailwind CSS 3+ + shadcn/ui
Routing           : React Router v6
State Management  : Context API + useReducer
Form validation   : Built-in HTML5 + custom hooks

// Key Libraries
- date-fns: Timezone-safe date manipulation
- zod: Runtime schema validation
- swr: Data fetching + caching

// Testing
- Vitest: Unit tests
- React Testing Library: Component tests
- Playwright: E2E tests
```

### 4.2 Backend & Persistence

```typescript
Backend           : Supabase (PostgreSQL 14+)
Auth              : Supabase Auth + JWT
Database          : PostgreSQL (RLS enabled)
API Layer         : Supabase REST API + Edge Functions
Realtime          : Supabase Realtime (websockets)
File Storage      : Supabase Storage
Edge Computing    : Deno runtime (serverless)

// Key Patterns
- Row Level Security (RLS): Multi-tenant data isolation
- Triggers: Business logic validation (no double-booking)
- Functions (PL/pgSQL): Complex operations
```

### 4.3 Deployment

```bash
Frontend          : Cloudflare Pages (auto-deploy from git)
Backend           : Supabase (managed PostgreSQL)
DNS & CDN         : Cloudflare
Email             : SendGrid / Supabase Mail (future)
Analytics         : PostHog (behavioral)
Monitoring        : Sentry (error tracking)
```

### 4.4 Enforced Standards

```typescript
// TypeScript
- Strict mode: true
- NO implicit any
- All external APIs typed
- Type narrowing with discriminated unions

// Code Quality
- ESLint: typescript-eslint rules
- Prettier: Opinionated formatting
- Husky + lint-staged: Pre-commit hooks

// Architecture
- Clean Architecture: Separation of concerns
- SOLID Principles: Single Responsibility, etc.
- Domain-Driven Design: Models + Services
```

---

## 5. Requisitos No Funcionales

### 5.1 Performance

```
Métrica                | Target      | Validación
----------------------|-------------|-----------------------------------
Latencia (p95)        | <100ms      | Medido en Edge Function
Latencia (p99)        | <500ms      | Spike máximo aceptado
TTFB (First Byte)     | <200ms      | CDN edge cache
Tamaño bundle JS      | <100KB      | Gzipped
Lighthouse Score      | >90         | desktop + mobile
CLS (Layout Shift)    | <0.05       | Core Web Vitals
```

### 5.2 Seguridad

```
Requisito                 | Implementation
--------------------------|-----------------------------------------------
Autenticación             | JWT vía Supabase Auth
Autorización              | Row Level Security (RLS)
Datos en tránsito         | HTTPS/TLS 1.3+
Datos en reposo           | PostgreSQL native encryption
CSRF                      | SameSite cookies + CORS
XSS                       | React auto-escapes, CSP headers
SQL Injection             | Parametrized queries (Supabase SDK)
Rate limiting             | Cloudflare WAF
GDPR Compliance           | Data export + deletion flows
```

### 5.3 Disponibilidad

```
Requisito              | Implementación
-----------------------|-----------------------------------------------
Uptime                 | 99.9% SLA (Supabase Standard Plan)
Backups                | Auto daily (Supabase managed)
Disaster Recovery      | RTO <4h, RPO <24h
Horizontal Scaling     | Supabase auto-scaling
Connection Pooling     | pgBouncer (Supabase)
Cache Strategy         | Browser cache + localStorage
```

### 5.4 Mobile First

```
Requisito           | Target
--------------------|----------------------------------------------
Viewport width      | 320px mín (iPhone SE)
Touch targets       | 48x48px mín (WCAG 2.1)
Responsive          | Fluid layouts con media queries
Offline support     | Read-only cached data via Service Worker
Install prompt      | PWA (future 2.0)
```

---

## 6. Arquitectura & Clean Code

### 6.1 Estructura de Carpetas

```
web/src/
├── app/                          # App initialization
│   ├── App.tsx                   # Router setup
│   ├── main.tsx                  # Entry point
│   └── index.css                 # Global styles
│
├── features/                     # Feature-based modules
│   ├── auth/
│   │   ├── pages/AuthPage.tsx
│   │   ├── components/
│   │   │   ├── LoginForm.tsx
│   │   │   └── SignUpForm.tsx
│   │   ├── hooks/useAuth.ts
│   │   ├── services/authService.ts
│   │   ├── types/auth.ts
│   │   └── __tests__/
│   │
│   ├── dashboard/
│   │   ├── pages/DashboardPage.tsx
│   │   ├── components/
│   │   │   ├── AppointmentTable.tsx
│   │   │   ├── StatsCard.tsx
│   │   │   └── DateFilter.tsx
│   │   ├── services/appointmentService.ts
│   │   └── __tests__/
│   │
│   ├── booking/
│   │   ├── pages/PublicBookingPage.tsx
│   │   ├── components/
│   │   │   ├── ServiceSelector.tsx
│   │   │   ├── DateTimePicker.tsx
│   │   │   ├── CustomerForm.tsx
│   │   │   └── ConfirmationScreen.tsx
│   │   ├── services/bookingService.ts
│   │   └── __tests__/
│   │
│   └── settings/
│       ├── pages/SettingsPage.tsx
│       ├── components/
│       │   ├── ProfileForm.tsx
│       │   ├── ServiceManager.tsx
│       │   └── ScheduleManager.tsx
│       └── services/
│
├── shared/                       # Shared utilities
│   ├── components/
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Modal.tsx
│   │   └── LoadingSpinner.tsx
│   ├── hooks/
│   │   ├── useAsync.ts
│   │   ├── useLocalStorage.ts
│   │   └── useDebounce.ts
│   ├── utils/
│   │   ├── date.ts               # Timezone-safe helpers
│   │   ├── validation.ts         # Form validation
│   │   ├── format.ts             # String formatting
│   │   └── error.ts              # Error handling
│   ├── constants/
│   │   └── config.ts
│   ├── types/
│   │   ├── database.ts           # From Supabase
│   │   ├── api.ts               # API types
│   │   └── common.ts            # Shared types
│   └── services/
│       ├── supabase.ts           # Supabase client
│       ├── availability.ts       # Slot calculation
│       └── api.ts                # API wrapper
│
├── contexts/
│   ├── AuthContext.tsx           # Authentication state
│   ├── NotificationContext.tsx   # Toast messages
│   └── ThemeContext.tsx          # Dark mode (future)
│
└── __tests__/
    ├── setup.ts                  # Vitest setup
    └── e2e/                      # Playwright tests
```

### 6.2 SOLID Principles in Code

**S: Single Responsibility** - Cada componente/servicio hace una cosa
**O: Open/Closed** - Extensible sin modificar código existente
**L: Liskov Substitution** - Subtipos intercambiables
**I: Interface Segregation** - Interfaces específicas
**D: Dependency Inversion** - Depender de abstracciones

---

## 7. Diseño de Base de Datos

### 7.1 Tablas (Normalización 3FN)

```sql
profiles          → Comercios/profesionales
services          → Servicios ofrecidos
working_hours     → Horarios regulares (lun-dom)
blocked_times     → Bloques no disponibles
customers         → Clientes sin cuenta
appointments      → Turnos reservados
notifications     → Registro de emails
```

### 7.2 RLS Policies (Multi-tenancy)

```
- Usuarios ven SOLO su perfil
- Usuarios anónimos ven perfiles activos
- Cada usuario aislado por RLS
```

### 7.3 Triggers for Business Logic

```
- check_appointment_overlap() → Previene double-booking
- update_updated_at() → Auto-timestamp
```

---

## 8. Implementación Fase por Fase

### 8.1 Fase 1A: Database Foundation
**Duración:** 2-4 horas  
**Output:** 7 tablas + índices + RLS + triggers

### 8.2 Fase 1B: Profile Settings
**Duración:** 4 horas  
**Output:** SettingsPage.tsx + form validation

### 8.3 Fase 1C: Services CRUD
**Duración:** 3 hours  
**Output:** ServicesPage.tsx + modal

### 8.4 Fase 1D: Working Hours
**Duración:** 3 hours  
**Output:** SchedulePage.tsx (Timezone-safe)

### 8.5 Fase 1E: Availability Engine
**Duración:** 5-6 hours  
**Output:** availability.ts + unit tests

### 8.6 Fase 1F: Public Booking
**Duración:** 6-7 hours  
**Output:** 4-step booking flow

### 8.7 Fase 1G: Dashboard
**Duración:** 3 hours  
**Output:** Appointments table

---

## 9. Testing & Quality Assurance

### 9.1 Coverage Targets

- Unit tests: >80%
- Component tests: Main features
- E2E tests: Happy path + errors

### 9.2 Pre-commit Hooks

```bash
- TypeScript check (strict)
- ESLint
- Prettier
- Unit tests
```

---

## 10. Escalabilidad & Performance

### 10.1 MVP Limits

```
10K users | 50 QPS | <100ms p95 | 1M slots
```

### 10.2 Optimizations

- Database indexes (compound keys)
- Client caching (localStorage)
- Image optimization
- Code splitting

### 10.3 Monitoring

```
Sentry: Error tracking
PostHog: Behavioral analytics
Supabase: Database metrics
Cloudflare: CDN performance
```

---

## 11. Errores Conocidos & Soluciones

### 11.1 Timezone (CRÍTICO)

**Problem:** Dates parsed as UTC instead of local

**Solution:**
```typescript
// ✅ RIGHT
const [year, month, day] = '2026-06-12'.split('-').map(Number);
const date = new Date(year, month - 1, day, 0, 0, 0); // LOCAL
```

### 11.2 RLS Policies

**Solution:** Separate policies by role (authenticated vs anon)

### 11.3 toLocaleString() Bug

**Solution:** Manual formatting using getHours(), getMinutes()

### 11.4 Double-Booking Race

**Solution:** 
1. DB trigger (prevents data corruption)
2. Edge Function pre-check (better UX)
3. Future: Reservation hold system

---

## 12. Checklist de Deploy

### Pre-Launch

```
[ ] Database schema complete
[ ] Frontend builds without errors
[ ] TypeScript strict: 0 errors
[ ] Coverage >80%
[ ] E2E tests pass
[ ] Lighthouse >90
[ ] Security: API keys in .env
[ ] RLS policies tested
[ ] Timezone handling verified
[ ] No double-booking
[ ] Performance <100ms p95
[ ] Monitoring configured
[ ] Disaster recovery plan
[ ] Runbooks written
```

### Launch Steps

```bash
1. npm run lint && npm run type-check
2. npm run test:coverage
3. npm run build
4. Deploy to staging
5. Smoke tests
6. Deploy to production
7. Monitor 24h
```

---

## Summary

**AppointmentAi** es una plataforma MVP completa, production-ready, construida con:

✅ **TypeScript strict mode** - Zero any types  
✅ **Clean Architecture** - SOLID principles  
✅ **Automated testing** - Unit + Component + E2E  
✅ **Zero double-booking** - DB triggers + pre-checks  
✅ **Timezone-safe** - Local parsing, UTC storage  
✅ **Multi-tenant** - RLS policies  
✅ **Scalable** - Indexed queries, caching  
✅ **Documented** - Complete PRD  

**Ready for automode implementation and deployment.**

---

**Generated:** 12/06/2026
