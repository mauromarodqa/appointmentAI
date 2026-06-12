# Product Requirements Document (PRD): TurnoYa

**Versión:** 1.0  
**Fecha:** Junio 2026  
**Estado:** En revisión

---

## 1. Visión General del Proyecto

TurnoYa es una plataforma web orientada a comercios de cercanía y profesionales independientes. Permite la autogestión de una agenda de turnos, optimizando la asignación de franjas horarias, reduciendo el ausentismo (no-shows) y eliminando la fricción de la reserva manual (vía WhatsApp o teléfono).

---

## 2. Definición del Problema

### Para el comercio / profesional (el oferente):
- Pierden tiempo valioso respondiendo mensajes para coordinar horarios.
- Sufren ausentismo cuando los clientes olvidan el turno.
- Cometen errores de doble reserva (overlapping).

### Para el cliente final (el consumidor):
- La reserva depende de los horarios de atención del comercio.
- Deben esperar confirmación manualmente.
- No pueden ver de forma transparente qué horarios están disponibles.

---

## 3. Usuarios Objetivo (User Personas)

### Administrador / Profesional (El Oferente)
Dueño de un negocio o profesional independiente (ej. peluquero, dentista, masajista).

**Necesidad:** Una interfaz simple para ver su día/semana, configurar sus horarios de trabajo, agregar servicios y bloquear horarios no disponibles.

### Cliente Final (El Consumidor)
Persona que necesita reservar un servicio.

**Necesidad:** Acceder a un link (por ejemplo, desde el Instagram del comercio), elegir el servicio, ver disponibilidad real y reservar en menos de 2 minutos sin crear cuentas complejas.

---

## 4. Historias de Usuario y Funcionalidades Clave (MVP)

### 4.1. Módulo del Profesional (Panel de Control)

| Funcionalidad | Descripción |
|---|---|
| **Configuración de Perfil** | Cargar nombre del comercio, logo, dirección y datos de contacto. |
| **Gestión de Horarios** | Configurar días y horarios de atención (ej. Lunes a Viernes 9:00–18:00), duración promedio de turnos y tiempos de descanso. |
| **Catálogo de Servicios** | Crear servicios con nombre, descripción, duración y precio (opcional). |
| **Calendario Interactivo** | Vista diaria y semanal de turnos reservados. Agendar turnos manualmente, cancelar y reprogramar. |
| **Enlace Público (Link in Bio)** | Generación de una URL única (ej. `turnoya.com/mi-negocio`) para compartir con clientes. |

### 4.2. Módulo del Cliente (Vista Pública)

| Funcionalidad | Descripción |
|---|---|
| **Selección de Servicio** | Interfaz limpia donde el cliente visualiza la oferta del comercio y selecciona el servicio. |
| **Selector de Fecha y Hora** | Calendario intuitivo que solo muestra franjas horarias disponibles reales, calculadas en base a la duración del servicio y la disponibilidad del profesional. |
| **Formulario de Reserva** | Recolección de datos básicos: Nombre, Apellido, Teléfono/WhatsApp, Email. |
| **Confirmación de Turno** | Pantalla de éxito con los detalles completos del turno reservado. |

### 4.3. Sistema de Notificaciones (Crucial para el valor del producto)

| Notificación | Detalle |
|---|---|
| **Confirmación inmediata** | Resumen del turno enviado al cliente al momento de reservar (email o integración básica con WhatsApp). |
| **Recordatorio 24hs antes** | Notificación automática para reducir ausentismo. |
| **Recordatorio 2hs antes** | Segunda notificación de recordatorio cercana al turno. |

---

## 5. Requisitos No Funcionales

| Requisito | Descripción |
|---|---|
| **Mobile-First** | El 90% de los usuarios accederá desde teléfonos móviles. La interfaz debe ser completamente responsiva. |
| **Fricción Cero** | El cliente final no debe necesitar descargar una app ni crear una cuenta con contraseña para reservar un turno. |
| **Disponibilidad 24/7** | El sistema debe estar activo permanentemente, garantizando que el comercio pueda recibir reservas fuera de horario comercial. |

---

## 6. Stack Tecnológico

| Capa | Tecnología |
|---|---|
| **Frontend** | React 18+ (Componentes Funcionales y Hooks), inicializado con Vite |
| **Lenguaje** | TypeScript estricto — no se permite el uso implícito o explícito del tipo `any` |
| **Estilos** | Shadcn/UI + Tailwind CSS (diseño responsivo, mobile-first) |
| **Backend & Persistencia** | Supabase (PostgreSQL, Auth, Storage, Edge Functions) |
| **Despliegue** | Cloudflare Pages (automatizado vía CI/CD o CLI) |

---

## 7. Métricas de Éxito (KPIs para el MVP)

1. **Adopción:** Cantidad de comercios/profesionales registrados activos.
2. **Volumen:** Número total de turnos procesados a través de la plataforma por mes.
3. **Reducción de ausentismo:** Porcentaje de reducción medido a través de feedback de los comercios.
4. **Conversión:** Tasa de conversión de la página de reservas (visitas al link público vs. turnos concretados).

---

## 8. Alcance del MVP

### Incluido en v1.0
- Registro y autenticación del profesional (via Supabase Auth).
- Configuración de perfil, horarios y servicios.
- Página pública de reserva sin registro del cliente.
- Cálculo automático de disponibilidad.
- Calendario del profesional (vista diaria/semanal).
- Notificaciones por email (confirmación y recordatorios).
- Enlace público único por profesional.

### Fuera de alcance (post-MVP)
- App móvil nativa.
- Integración directa con WhatsApp Business API.
- Pagos online.
- Multi-profesional (equipos / salones).
- Integración con Google Calendar / Outlook.
- Panel de analytics avanzado.
