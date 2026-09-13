# Contexto del Proyecto: Sistema Escolar Mini (ColeSistemaMini)

**Última actualización:** 13 de Septiembre, 2026  
**Framework de Agente & Herramientas:** Gentle.ai (CodeGraph Indexing & Tooling)  
**Arquitectura de Frontend:** Component-Driven Architecture (Componentes Atómicos Reutilizables)  
**Estado:** Ampliación Funcional (Evaluaciones, Tareas y Notificaciones)  

---

## 1. Visión General del Proyecto
**ColeSistemaMini** es un sistema de gestión escolar integral, modular, ultra-rápido y liviano orientado a instituciones educativas (primaria y secundaria). Sus objetivos clave son:
1. **Control de Asistencia Instantáneo:** Escaneo de carnets con códigos QR mediante cámara web o dispositivos móviles.
2. **Evaluación por Competencias (AD, A, B, C):** Registro, modificación de calificaciones y cálculo ponderado de promedios de periodo y anuales.
3. **Módulo de Tareas Escolares:** Asignación de tareas por curso/sección, fechas límite de entrega, archivos adjuntos y control de entregas.
4. **Módulo de Evaluaciones Continuas:** Programación de exámenes, prácticas calificadas y rúbricas por competencia.
5. **Centro de Notificaciones Multicanal:** Avisos en tiempo real para apoderados y estudiantes sobre asistencias (tardanzas/faltas), publicación de notas, tareas pendientes y comunicados de dirección.
6. **Portales y Dashboards por Rol:** Experiencias optimizadas para **Administrador**, **Docente** y **Estudiante/Apoderado**.

---

## 2. Metodología de Desarrollo con Gentle.ai y Arquitectura de Componentes

### A. Integración con Gentle.ai & CodeGraph
* Indexación estructural en `.codegraph/` para trazabilidad de dependencias, navegación rápida y validación de tipos entre componentes y endpoints.

### B. Arquitectura de Componentes Reutilizables (Component-Driven UI)
* **Átomos y Moléculas UI (`src/components/ui/`):**
  * `StatCard`: Tarjetas de KPI e indicadores de rendimiento.
  * `DataTable`: Tabla dinámica con búsqueda instantánea, paginación y filtros.
  * `Modal`: Diálogos modales accesibles para registro de estudiantes, creación de tareas y publicación de comunicados.
  * `Badge`: Badges de estado (*Entregado*, *Pendiente*, *Revisado*, *Leído*).
  * `NotificationCenter`: Menú flotante de notificaciones en tiempo real con contador de no leídos.
* **Componentes de Dominio Escolar:**
  * `GradeBadge` & `GradeSelector`: Gestión de escala cualitativa AD, A, B, C.
  * `QrCard` & `QrScanner`: Carnet escolar y escáner de cámara con sonido y confeti.
  * `AssignmentCard`: Tarjeta de tarea con cuenta regresiva de entrega y estado.
  * `EvaluationCalendar`: Cronograma visual de exámenes y prácticas.

---

## 3. Stack Tecnológico Seleccionado
* **Frontend & Backend API:** Next.js (App Router, Server Actions, Route Handlers, TypeScript).
* **Asistencia y Navegación de Código:** Gentle.ai + CodeGraph.
* **UI / Estilos:** Tailwind CSS, Lucide React Icons, diseño responsivo y Glassmorphism.
* **Base de Datos & Auth:** Supabase (PostgreSQL relacional, Supabase Auth con Roles y RLS).
* **Gestión y Lectura QR:** `qrcode.react` y `html5-qrcode`.
* **Despliegue & Hosting:**
  * Frontend & API: **Vercel**
  * Base de Datos, Auth, Storage y Realtime: **Supabase**

---

## 4. Requerimientos Funcionales Expandidos

### 1. Asistencia mediante Código QR
* Generación de carnets digitales con QR criptográfico único.
* Escaneo por cámara para docentes y portería con registro de fecha, hora y estado (*Presente*, *Tardanza*, *Falta*, *Justificado*).

### 2. Sistema de Calificación (AD – A – B – C)
* Escala cualitativa oficial (**AD**: Logro Destacado, **A**: Logro Esperado, **B**: En Proceso, **C**: En Inicio).
* Cálculo automático de promedios por competencia, periodo (bimestre) y condición final anual de promoción.

### 3. Módulo de Tareas Escolares (Assignments)
* Creación de tareas por el docente con título, descripción, fecha/hora límite, curso y competencia asociada.
* Los estudiantes pueden ver sus tareas pendientes, fechas límite y adjuntar entregas o marcar como completadas.
* El docente califica la tarea con la escala AD-A-B-C y deja retroalimentación pedagógica.

### 4. Módulo de Evaluaciones Continuas
* Programación de exámenes mensuales, bimestrales y prácticas calificadas.
* Calendario consolidado de evaluaciones para estudiantes y apoderados.

### 5. Sistema de Notificaciones en Tiempo Real
* Notificación automática al apoderado cuando el alumno registra asistencia (o ante tardanza/falta).
* Alertas de nuevas tareas asignadas y recordatorios de fechas límite de entrega.
* Publicación de comunicados institucionales y circulares de dirección.
