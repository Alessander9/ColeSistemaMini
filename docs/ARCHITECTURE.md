# Arquitectura del Sistema: ColeSistemaMini

Este documento describe la arquitectura técnica, componentes clave, flujo de datos, modelo de seguridad y la metodología de ingeniería de software **RUP (Rational Unified Process)** con modelado **UML (Unified Modeling Language)** de **ColeSistemaMini**.

---

## 1. Visión General de la Solución

ColeSistemaMini es una plataforma web moderna para la gestión escolar de Educación Básica Regular (Inicial, Primaria y Secundaria). Está construida sobre el ecosistema **Next.js (App Router)** y utiliza servicios serverless para autenticación, base de datos relacional, almacenamiento de medios y entrega de notificaciones.

```mermaid
flowchart TD
    subgraph Clientes["Capa de Clientes (Frontend)"]
        WebAdmin["Portal Administrador (/admin)"]
        WebDocente["Portal Docente (/docente)"]
        WebEstudiante["Portal Estudiante (/estudiante)"]
        WebApoderado["Portal Apoderado (/apoderado)"]
        Kiosco["Kiosco QR de Portería (/asistencia)"]
    end

    subgraph Edge["Next.js Edge & Middleware"]
        MW["Middleware (RBAC, Rate Limiting, Signed Session)"]
    end

    subgraph AppServer["Next.js App Router (Servidor)"]
        RSC["React Server Components"]
        API["Route Handlers (/api/*)"]
        SA["Server Actions / Lib Services"]
    end

    subgraph BackendServices["Servicios Externos & Persistencia"]
        SB_Auth["Supabase Auth"]
        SB_DB[("PostgreSQL (Supabase)")]
        Cloudinary["Cloudinary (Fotos / Carnets)"]
        MailService["Resend / Brevo (Email Transaccional)"]
    end

    Clientes --> MW
    MW --> AppServer
    API --> SB_Auth
    API --> SB_DB
    API --> Cloudinary
    API --> MailService
    SA --> SB_DB
```

---

## 2. Metodología RUP (Rational Unified Process)

El desarrollo del proyecto se estructura en base a las 4 fases de RUP y sus disciplinas clave:

### Fases del Ciclo de Vida RUP

1. **Fase de Inicio (Inception):**
   - **Objetivo:** Definir la visión del producto escolar, delimitación del alcance y viabilidad técnica.
   - **Entregables:** Documento de visión y contexto (`contexto.md`), identificación de actores (Directores, Docentes, Estudiantes, Apoderados, Operador de Kiosco) y casos de uso críticos.
   - **Alcance estricto:** Educación Básica Regular (EBR) — Inicial, Primaria y Secundaria.

2. **Fase de Elaboración (Elaboration):**
   - **Objetivo:** Establecer la línea base arquitectónica ejecutable y mitigar los riesgos principales.
   - **Mitigación de Riesgos:** Auditoría de seguridad (Claude-BugHunter), resolución de vulnerabilidades críticas en cookies mediante firmas HMAC SHA-256 (`SESSION_SECRET`), diseño del esquema relacional en PostgreSQL (Supabase) y definición del sistema de componentes atómicos.

3. **Fase de Construcción (Construction):**
   - **Objetivo:** Desarrollo iterativo e incremental de la funcionalidad completa del sistema escolar:
     - *Iteración 1:* Sistema bi-modal de asistencia por QR y lectoras USB con feedback de audio y confeti.
     - *Iteración 2:* Registro de calificaciones CNEB (AD, A, B, C) con asistente de conclusiones descriptivas y exportador oficial SIAGIE MINEDU.
     - *Iteración 3:* Módulo de admisiones y matrículas masivas (Excel/CSV), generación de planillas A4 de carnets y portal apoderado multi-hijo.
     - *Iteración 4:* Aula virtual LMS, tareas escolares y comunicados multicanal con acuse de lectura y formateo a WhatsApp.

4. **Fase de Transición (Transition):**
   - **Objetivo:** Despliegue en producción en Vercel, aseguramiento de calidad con 177 pruebas unitarias automatizadas (Vitest) y pruebas E2E con Playwright, elaboración de manuales de usuario y entrega operativa.

---

## 3. Especificación y Modelado UML

### A. Diagrama de Casos de Uso (UML Use Case Diagram)

```mermaid
flowchart LR
    Admin(["«Actor»<br/>Administrador"])
    Docente(["«Actor»<br/>Docente"])
    Estudiante(["«Actor»<br/>Estudiante"])
    Apoderado(["«Actor»<br/>Apoderado"])
    Porteria(["«Actor»<br/>Operador Portería"])

    subgraph CasosDeUso["Casos de Uso del Sistema Escolar (UML)"]
        UC1(["Gestionar Matrículas y Carnets QR"])
        UC2(["Configurar Identidad y Branding"])
        UC3(["Tomar Asistencia en Aula"])
        UC4(["Registrar Notas CNEB y Conclusiones"])
        UC5(["Exportar Planilla SIAGIE (MINEDU)"])
        UC6(["Escanear QR en Kiosco"])
        UC7(["Consultar Tareas y Horarios"])
        UC8(["Seguimiento Académico Multi-Hijo"])
        UC9(["Emitir y Leer Comunicados"])
    end

    Admin --> UC1
    Admin --> UC2
    Admin --> UC5
    Admin --> UC9
    Docente --> UC3
    Docente --> UC4
    Docente --> UC7
    Docente --> UC9
    Porteria --> UC6
    Estudiante --> UC7
    Apoderado --> UC8
    Apoderado --> UC9
```

---

### B. Diagrama de Clases del Dominio (UML Class Diagram)

```mermaid
classDiagram
    direction TB
    class Usuario {
        +String id
        +String email
        +String rol
        +Boolean activo
        +autenticar()
        +cerrarSesion()
    }
    class Estudiante {
        +String dni
        +String nombres
        +String apellidos
        +String nivel
        +String grado
        +String seccion
        +String qrCode
        +String estado
        +consultarLibreta()
        +entregarTarea()
    }
    class Docente {
        +String dni
        +String especialidad
        +String telefono
        +registrarAsistencia()
        +registrarNotas()
    }
    class Apoderado {
        +String dni
        +String parentesco
        +String celularWhatsApp
        +consultarHijos()
        +confirmarComunicado()
    }
    class Asistencia {
        +String id
        +Date fecha
        +Time horaMarcacion
        +String metodo
        +String estado
        +validarTardanza()
    }
    class EvaluacionCNEB {
        +String id
        +String periodo
        +String competenciaId
        +String calificacionCualitativa
        +Float notaVigesimal
        +String conclusionDescriptiva
        +calcularPromedio()
    }
    class Comunicado {
        +String id
        +String titulo
        +String contenido
        +String categoria
        +Date fechaPublicacion
        +enviarPorWhatsApp()
    }

    Usuario <|-- Docente : hereda
    Usuario <|-- Estudiante : hereda
    Usuario <|-- Apoderado : hereda

    Apoderado "1..*" --> "1..*" Estudiante : representa
    Estudiante "1" --> "*" Asistencia : registra
    Estudiante "1" --> "*" EvaluacionCNEB : obtiene
    Docente "1" --> "*" EvaluacionCNEB : evalua
    Docente "1" --> "*" Asistencia : toma
    Usuario "*" --> "*" Comunicado : recibe
```

---

### C. Diagrama de Secuencia (UML Sequence Diagram): Control de Asistencia QR

```mermaid
sequenceDiagram
    autonumber
    actor Alumno as Estudiante
    participant Kiosco as Kiosco QR (/asistencia)
    participant MW as Middleware (Auth/Session)
    participant Svc as AttendanceService
    participant DB as Supabase PostgreSQL
    participant Notif as NotificationService (Resend/Brevo)
    actor Padre as Apoderado

    Alumno->>Kiosco: Presenta Carnet con Código QR
    Kiosco->>Kiosco: Decodifica Hash Criptográfico del QR
    Kiosco->>MW: POST /api/attendance/scan (Payload QR)
    MW->>MW: Valida firma de sesión y Rate Limiting
    MW->>Svc: Invoca registrarMarcacion(estudianteId, timestamp)
    Svc->>DB: INSERT / UPDATE asistencia (estado: Presente/Tardanza)
    DB-->>Svc: Confirmación de registro exitoso
    Svc-->>Kiosco: Respuesta HTTP 200 OK + Datos Alumno
    Kiosco->>Kiosco: Emite sonido sintetizado (Web Audio) + Confeti
    Kiosco-->>Alumno: Mensaje visual en pantalla ("¡Bienvenido!")
    opt Notificación Automática al Padre
        Svc->>Notif: dispararAlertaAsistencia(apoderadoEmail, estado)
        Notif-->>Padre: Correo / Notificación en App en tiempo real
    end
```

---

### D. Diagrama de Estados (UML State Machine Diagram): Ciclo de Vida del Estudiante

```mermaid
stateDiagram-v2
    [*] --> Postulante : Registro Inicial / Admisión
    Postulante --> EnRevision : Carga de Documentos (DNI, Ficha)
    EnRevision --> Matriculado : Asignación de Nivel, Grado y Sección
    Matriculado --> EnCurso : Generación de Carnet QR y Credenciales
    
    state EnCurso {
        [*] --> PeriodoActivo
        PeriodoActivo --> EvaluacionCNEB : Registro de notas (AD, A, B, C)
        EvaluacionCNEB --> AsistenciaRegular : Monitoreo diario por QR
        AsistenciaRegular --> CierreBimestre : Consolidado de notas
        CierreBimestre --> PeriodoActivo : Siguiente Bimestre
    }

    EnCurso --> Promovido : Cumple competencias anuales CNEB
    EnCurso --> RecuperacionPedagogica : Requiere refuerzo (Calificación C)
    RecuperacionPedagogica --> Promovido : Supera evaluación de recuperación
    Promovido --> [*] : Promoción al siguiente grado escolar
```

---

## 4. Componentes y Capas de la Aplicación

### A. Capa de Presentación (UI & UX)
- **Framework:** Next.js 14 con TypeScript y Tailwind CSS.
- **Componentes Atómicos Reutilizables:** Diseñados bajo principios de Atomic Design en `src/components/ui/` (`DataTable`, `StatCard`, `Modal`, `Badge`, `NotificationCenter`).
- **Componentes de Dominio:** Elementos específicos como `GradeBadge` (AD, A, B, C), `QrCard`, `QrScanner` y `EvaluationCalendar`.

### B. Capa de Enrutamiento y Seguridad (Middleware)
- Ubicación: `src/middleware.ts`.
- **Control de Acceso Basado en Roles (RBAC):** Restringe el acceso a rutas `/admin/*`, `/docente/*`, `/estudiante/*` y `/apoderado/*` evaluando sesiones validadas.
- **Firmas de Sesión:** Emplea HMAC SHA-256 (`SESSION_SECRET`) para impedir la manipulación y forja de cookies en el cliente.
- **Defensas Anti-Abuso:** Rate limiting por IP y cabeceras seguras para prevenir fuerza bruta y escaneo automatizado.

### C. Capa de Servicios y Lógica de Negocio
- Ubicación: `src/lib/services/`.
- `authService.ts`: Gestión de login, roles y credenciales.
- `attendanceService.ts`: Procesamiento de asistencias por QR o lista manual.
- `gradeService.ts`: Registro de notas bimestrales, cálculo de conclusiones CNEB y promedios.
- `brandingService.ts`: Personalización institucional en tiempo real.
- `siagieExportService.ts`: Generación de archivos CSV compatibles con la plataforma oficial MINEDU (UTF-8 BOM).

### D. Capa de Integraciones Externas
- **Supabase:** Base de datos PostgreSQL relacional y autenticación centralizada.
- **Cloudinary:** Almacenamiento optimizado de fotografías de perfil y plantillas de carnet.
- **Resend / Brevo:** Envío de correos de bienvenida, alertas de asistencia y comunicados.
