# Guía Total de Desarrollo: ColeSistemaMini

Esta guía documenta la arquitectura técnica basada en componentes reutilizables, integración con **Gentle.ai** y **CodeGraph**, modelo de datos en PostgreSQL (Supabase), motor de cálculo de notas **AD-A-B-C**, módulos de **Tareas**, **Evaluaciones**, **Notificaciones**, flujo de asistencia QR y despliegue en **Vercel + Supabase**.

---

## 1. Integración con Gentle.ai & CodeGraph

El proyecto incorpora indexación y análisis estructural mediante **Gentle.ai**:
* **Índice de Grafo de Código:** `.codegraph/` permite consultar llamadas, referencias, impacto y relaciones entre componentes y módulos de datos.
* **Comandos de Soporte Gentle.ai:**
  * Sincronización automática mediante watcher de código.
  * Consultas rápidas de símbolos y dependencias estructurales para evitar código duplicado o refactorizaciones rotas.

---

## 2. Arquitectura de Componentes Reutilizables (Component-Driven UI)

```text
src/components/
├── ui/                              # ÁTOMOS & MOLÉCULAS DE UI REUTILIZABLES
│   ├── StatCard.tsx                 # Tarjeta de KPI/Estadística con icono y tendencias
│   ├── DataTable.tsx                # Tabla genérica con filtros de búsqueda y paginación
│   ├── Modal.tsx                    # Diálogo modal accesible con overlay y animaciones
│   ├── Badge.tsx                    # Badges semánticos para roles, estados y niveles
│   ├── NotificationBell.tsx         # Campana de notificaciones con badge de no leídos
│   ├── CommandPalette.tsx           # Buscador global universal (CTRL+K)
│   └── PageHeader.tsx               # Encabezado estándar para todas las páginas
├── layout/                          # ESTRUCTURA Y NAVEGACIÓN
│   ├── Navbar.tsx                   # Barra superior con selector de roles y notificaciones
│   └── Sidebar.tsx                  # Navegación lateral reactiva por rol
├── qr/                              # DOMINIO: ASISTENCIA & CÓDIGOS QR
│   ├── QrCard.tsx                   # Carnet digital imprimible/descargable con QR
│   └── QrScanner.tsx                # Escáner de cámara con html5-qrcode y feedback
├── notas/                           # DOMINIO: SISTEMA DE CALIFICACIONES
│   ├── GradeBadge.tsx               # Insignia de nota con color según escala AD, A, B, C
│   ├── GradeSelector.tsx            # Selector rápido con 1-clic para docentes
│   ├── GradeMatrixTable.tsx         # Matriz editable de notas con llenado rápido y sugerencias CNEB
│   └── SubsanacionModal.tsx         # Modal de examen de recuperación y subsanación
├── tareas/                          # DOMINIO: GESTIÓN DE TAREAS Y ENTREGAS
│   ├── TaskCard.tsx                 # Tarjeta de tarea con estado, fecha límite y adjuntos
│   ├── TaskFormModal.tsx            # Modal para que el docente cree y asigne tareas
│   └── TaskSubmissionList.tsx       # Lista de alumnos con entregas y opción de calificar
├── evaluaciones/                    # DOMINIO: EVALUACIONES Y EXÁMENES
│   ├── ExamCard.tsx                 # Tarjeta de examen programado por competencia
│   └── ExamScheduleCalendar.tsx     # Cronograma de evaluaciones del periodo
└── notificaciones/                  # DOMINIO: AVISOS Y COMUNICADOS
    ├── NotificationDropdown.tsx     # Menú desplegable de avisos
    └── NotificationCard.tsx         # Tarjeta de alerta (Asistencia, Tarea, Calificación)

src/lib/
├── cneb/                            # MOTOR CURRICULAR OFICIAL MINEDU
│   ├── officialCurriculum.ts        # Áreas, competencias y capacidades CNEB
│   └── conclusionesDescriptivasTemplates.ts # Banco de conclusiones formativas automáticas
├── export/                          # SERVICIOS DE EXPORTACIÓN EXTERNA
│   └── siagieExportService.ts       # Generador CSV con BOM UTF-8 para MINEDU SIAGIE
├── pdf/                             # GENERADORES VECTORIALES JSPDF
│   ├── reportCardPdfGenerator.ts    # Libreta de notas oficial anual
│   ├── consolidadoSalonPdfGenerator.ts # Acta consolidada por sección
│   ├── batchQrCardsPdfGenerator.ts  # Planilla de 8 carnets QR por página A4
│   ├── registroAuxiliarPdfGenerator.ts # Registro auxiliar de campo en blanco
│   ├── generateEnrollmentFichaPdf.ts # Ficha oficial de matrícula
│   └── certificatePdfGenerator.ts   # Constancias oficiales de estudio
└── constants/                       # CONSTANTES COMPARTIDAS
    └── schedule.ts                  # Bloques horarios y días de la semana centralizados
```

---

## 3. Modelo de Base de Datos Extendido (PostgreSQL en Supabase)

### Nuevas Tablas Incorporadas:

#### A. `tareas` (Asignaciones Escolares)
```sql
CREATE TABLE IF NOT EXISTS public.tareas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    curso_id UUID NOT NULL REFERENCES public.cursos(id) ON DELETE CASCADE,
    seccion_id UUID NOT NULL REFERENCES public.secciones(id) ON DELETE CASCADE,
    docente_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    competencia_id UUID REFERENCES public.competencias(id) ON DELETE SET NULL,
    titulo TEXT NOT NULL,
    descripcion TEXT NOT NULL,
    fecha_limite TIMESTAMP WITH TIME ZONE NOT NULL,
    archivo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
```

#### B. `entregas_tareas` (Entregas y Calificaciones de Alumnos)
```sql
CREATE TABLE IF NOT EXISTS public.entregas_tareas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tarea_id UUID NOT NULL REFERENCES public.tareas(id) ON DELETE CASCADE,
    matricula_id UUID NOT NULL REFERENCES public.matriculas(id) ON DELETE CASCADE,
    fecha_entrega TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    archivo_url TEXT,
    comentario_estudiante TEXT,
    calificacion_letra calificacion_letra, -- 'AD', 'A', 'B', 'C'
    retroalimentacion_docente TEXT,
    calificado_por UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    calificado_en TIMESTAMP WITH TIME ZONE,
    CONSTRAINT uq_tarea_matricula UNIQUE (tarea_id, matricula_id)
);
```

#### C. `evaluaciones` (Exámenes y Prácticas Calificadas)
```sql
CREATE TABLE IF NOT EXISTS public.evaluaciones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    curso_id UUID NOT NULL REFERENCES public.cursos(id) ON DELETE CASCADE,
    seccion_id UUID NOT NULL REFERENCES public.secciones(id) ON DELETE CASCADE,
    periodo_evaluacion_id UUID NOT NULL REFERENCES public.periodos_evaluacion(id) ON DELETE CASCADE,
    competencia_id UUID NOT NULL REFERENCES public.competencias(id) ON DELETE CASCADE,
    titulo TEXT NOT NULL, -- ej. "Examen Mensual de Álgebra"
    tipo VARCHAR(50) NOT NULL DEFAULT 'examen', -- 'examen', 'practica', 'proyecto'
    fecha_programada DATE NOT NULL,
    hora_inicio TIME,
    duracion_minutos INTEGER DEFAULT 60,
    ponderacion NUMERIC(4,2) DEFAULT 1.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
```

#### D. `notificaciones` (Avisos en Tiempo Real)
```sql
CREATE TABLE IF NOT EXISTS public.notificaciones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    tipo VARCHAR(50) NOT NULL, -- 'asistencia', 'tarea', 'nota', 'comunicado'
    titulo TEXT NOT NULL,
    mensaje TEXT NOT NULL,
    leido BOOLEAN NOT NULL DEFAULT false,
    url_redireccion TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
```

---

## 4. Lógica del Sistema de Calificación (AD – A – B – C)

### A. Escala Cualitativa y Equivalencias
| Calificación | Nivel de Logro | Equivalente Numérico | Rango Referencial | Color UI |
| :--- | :--- | :---: | :---: | :--- |
| **AD** | Logro Destacado | 4 | 18 - 20 | `emerald-600` (Verde Esmeralda) |
| **A** | Logro Esperado | 3 | 14 - 17 | `blue-600` (Azul) |
| **B** | En Proceso | 2 | 11 - 13 | `amber-500` (Ámbar) |
| **C** | En Inicio | 1 | 00 - 10 | `rose-600` (Rojo) |

### B. Algoritmo de Cálculo de Promedios
* **Promedio por Competencia y Periodo:** $\text{Promedio} = \frac{\sum \text{Valor Numérico}}{\text{N° Competencias}}$
  * $\ge 3.5 \rightarrow \mathbf{AD}$
  * $\ge 2.5 \text{ y } < 3.5 \rightarrow \mathbf{A}$
  * $\ge 1.5 \text{ y } < 2.5 \rightarrow \mathbf{B}$
  * $< 1.5 \rightarrow \mathbf{C}$

---

## 5. Flujos Clave del Sistema

### A. Flujo de Asistencia con Código QR y Notificación Instantánea
1. El estudiante presenta su **Carnet QR Digital**.
2. El docente/portería escanea el código con la cámara web o del móvil (`QrScanner`).
3. El sistema valida la matrícula y registra la asistencia (Presente o Tardanza).
4. Se despacha una **notificación automática** al apoderado: *"Mateo Silva ingresó al colegio a las 07:48 AM (Puntual)"*.

### B. Flujo de Tareas Escolares
1. El docente publica una tarea vinculada a una competencia y asigna una fecha límite.
2. Los estudiantes reciben una notificación en su panel y visualizan la tarea en su lista de pendientes.
3. El alumno entrega la tarea adjuntando su archivo o enlace.
4. El docente revisa la entrega, califica con **AD, A, B o C** e ingresa una conclusión pedagógica.

### C. Flujo de Evaluaciones
1. El docente agenda una práctica o examen en el cronograma.
2. La evaluación se refleja en el calendario del estudiante.
3. Las notas ingresadas alimentan directamente la matriz de calificaciones y el cálculo automático de promedios.

---

## 6. Despliegue en Producción (Vercel + Supabase)

1. **Supabase:** Crear proyecto en Supabase y ejecutar `supabase/schema.sql` y `supabase/seed.sql` en el SQL Editor.
2. **Vercel:** Importar repositorio Git, asignar variables de entorno (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) y desplegar con CI/CD automático.
