# Manual Integral del Sistema ColeSistemaMini
## Sistema de Gestión Escolar, Académica y LMS Multi-Nivel

---

## 1. Visión General y Propósito

**ColeSistemaMini** es una plataforma integral de gestión educativa y LMS (Learning Management System) diseñada para modernizar y centralizar toda la operación académica y administrativa de instituciones educativas de cualquier escala.

El sistema soporta de manera nativa los cuatro niveles educativos:
* **Inicial** (3, 4 y 5 años)
* **Primaria** (1.° a 6.° grado)
* **Secundaria** (1.° a 5.° año)
* **Preuniversitario** (Ciclos intensivos, semestrales y anuales de preparación superior)

### Objetivo Principal
Eliminar la fragmentación operativa integrando en una sola plataforma:
1. **Control de Admisiones y Matrículas**.
2. **Gestión de Carga Académica, Secciones y Horarios**.
3. **Control de Asistencia Digital en Tiempo Real** (con lectura de Carnet QR).
4. **Registro y Ponderación de Calificaciones** bajo estándares curriculares (CNEB 4 Bimestres, escala vigesimal 0-20 y cualitativa AD, A, B, C).
5. **Generación Automatizada de la Libreta Oficial de Notas Anual**.
6. **Aula Virtual y Entorno LMS** (publicación de tareas, entregas, evaluaciones en línea y materiales de clase).

---

## 2. Arquitectura y Tecnologías

* **Frontend & Framework**: Next.js 14 (App Router) con React 18 y TypeScript.
* **Estilos y UI/UX**: Vanilla CSS puro con variables semánticas, Tailwind-free, paleta de colores institucional corporativa (Azul Índigo, Azul Marino, Verde Esmeralda, Ámbar, Rojo Coral).
* **Gestión de Estado**: Context API (`AppContext`) con persistencia local (`localStorage`) reactiva y resiliente ante recargas.
* **Iconografía**: `lucide-react`.
* **Pruebas y QA**: Jest, React Testing Library y Suite End-to-End con Selenium WebDriver.
* **Infraestructura**: Despliegue en la nube con Vercel (`https://cole-sistema-mini.vercel.app`) y contenedorización multi-etapa en Docker.

---

## 3. Roles del Sistema y Matriz de Accesos

El sistema cuenta con **3 roles principales de usuario** más un **Módulo Kiosco de Asistencia**:

| Rol | Propósito Principal | Panel de Acceso |
| :--- | :--- | :--- |
| 🛡️ **Administrador** | Control total institucional, altas/bajas, matrículas, asignación de cursos, gestión de docentes, reportes y supervisión global. | `/admin` |
| 👨‍🏫 **Docente** | Gestión de sus clases asignadas, pase de lista, registro de notas por criterio, creación de tareas y publicación de exámenes. | `/docente` |
| 🎓 **Estudiante** | Visualización de horario, consulta de libreta de notas oficial, descarga de carnet QR, envío de tareas y realización de evaluaciones. | `/estudiante` |
| 📲 **Kiosco QR / Puerta** | Terminal de escaneo rápido para control de ingresos y salidas en portería con retroalimentación visual y auditiva. | `/asistencia` |

---

## 4. Funcionamiento Detallado por Cada Rol

### 🛡️ 1. Rol Administrador (Director / Coordinador Académico)

El Administrador tiene una visión panorámica de la institución y herramientas de configuración estructural.

#### Funciones y Capacidades:
1. **Dashboard Principal (`/admin`)**:
   * Indicadores clave de rendimiento (KPIs): Total de estudiantes matriculados, docentes activos, cursos dictados, asistencia global del día.
   * Filtros dinámicos por nivel (Inicial, Primaria, Secundaria, Preuniversitario) y período lectivo.
   * Gráficos interactivos de distribución de alumnos por grado y tasa de asistencia.
   * Acceso rápido a auditoría de alertas académicas (estudiantes con bajo rendimiento o inasistencias reiteradas).

2. **Gestión de Estudiantes y Matrículas (`/admin/estudiantes` y `/admin/matriculas`)**:
   * Registro individual y masivo de estudiantes con datos completos (DNI, nombres, nivel, grado, sección, apoderado, contacto).
   * Proceso de matrícula por año lectivo y asignación de sección (A, B, C, etc.).
   * Generación y visualización del código QR identificador único de cada alumno.
   * Filtros de búsqueda en tiempo real por nombre, DNI, nivel y grado.

3. **Gestión de Docentes (`/admin/docentes`)**:
   * Directorio de profesores con especialidades, datos de contacto y estado.
   * Asignación de carga horaria y cursos por nivel educativo.
   * Asignación de tutorías de aula.

4. **Gestión Académica y Secciones (`/admin/academico` y `/admin/secciones/[id]`)**:
   * Creación de planes de estudio y malla curricular por nivel.
   * Configuración de competencias y criterios de evaluación.
   * Detalle por sección: lista de alumnos, docentes a cargo, avance curricular y estadísticas de notas.

5. **Gestor de Horarios Institucionales (`/admin/horarios`)**:
   * Matriz horaria semanal (Lunes a Viernes) por bloques y turnos (Mañana / Tarde).
   * Validación automática contra cruces de horarios entre docentes y aulas.

6. **Consolidados de Notas y Supervisión (`/admin/notas-salon` y `/admin/reportes`)**:
   * Consulta del acta de notas consolidada por salón y por bimestre.
   * Reportes estadísticos exportables a Excel/PDF.
   * Detección temprana de estudiantes en riesgo académico.

---

### 👨‍🏫 2. Rol Docente (Profesor / Tutor)

El entorno del docente está enfocado en la agilidad del día a día en el aula física o virtual.

#### Funciones y Capacidades:
1. **Dashboard del Docente (`/docente`)**:
   * Resumen de sus clases del día con horario y aula.
   * Accesos directos a "Pasar Asistencia", "Registrar Notas" y "Nueva Tarea".
   * Notificaciones de tareas pendientes de revisión o mensajes institucionales.

2. **Control de Asistencia de Clase (`/docente/asistencia`)**:
   * Lista interactiva de los alumnos de la sección con estados: **Presente**, **Tarde**, **Falta Justificada** y **Falta Injustificada**.
   * Botón de marcación rápida ("Marcar todos presente").
   * Registro con guardado instantáneo y cálculo de porcentaje de asistencia del aula.

3. **Registro y Ponderación de Calificaciones (`/docente/notas`)**:
   * Selector por Bimestre (1.° Bimestre a 4.° Bimestre).
   * Registro de notas en tiempo real por cada competencia o criterio evaluativo.
   * Conversión y cálculo automático del promedio bimestral tanto en escala vigesimal (0 a 20) como en escala cualitativa oficial (AD = Logro Destacado, A = Logro Esperado, B = En Proceso, C = En Inicio).

4. **Gestor de Tareas y Actividades (`/docente/tareas`)**:
   * Publicación de tareas con título, descripción detallada, fecha límite y curso.
   * Bandeja de recepción de entregas de los alumnos con estado (Entregado a tiempo, Entregado con retraso, No entregado).
   * Calificación y retroalimentación directa a cada estudiante.

5. **Creación de Evaluaciones (`/docente/evaluaciones`)**:
   * Programación de exámenes, prácticas calificadas y simulacros (esencial para nivel Preuniversitario).
   * Configuración de fecha, hora de inicio, duración y peso porcentual en el promedio.

6. **Mi Horario Semanal (`/docente/horario`)**:
   * Cronograma interactivo de clases semanales organizado por horas y secciones asignadas.

---

### 🎓 3. Rol Estudiante (Alumno / Apoderado)

El portal del estudiante brinda total transparencia sobre el progreso académico, asistencia y deberes.

#### Funciones y Capacidades:
1. **Dashboard del Estudiante (`/estudiante`)**:
   * Saludo personalizado con su nivel, grado y sección.
   * Tarjetas de progreso general: Promedio ponderado acumulado, porcentaje de asistencia, tareas pendientes y próximas evaluaciones.
   * Lista de cursos matriculados con acceso directo a su detalle.

2. **Libreta Oficial de Notas Anual (`/estudiante/libreta-notas`)**:
   * Visualización integral de los **4 Bimestres** curso por curso.
   * **Cálculo de la Nota Final Anual**: Determinada por la suma y promedio de los 4 periodos bimestrales.
   * Equivalencia cualitativa (AD, A, B, C) y estado de aprobación del año lectivo (**Promovido / Requiere Recuperación**).
   * Botón para **Imprimir / Exportar Libreta Oficial en formato PDF limpio**.

3. **Bandeja de Tareas y Deberes (`/estudiante/tareas`)**:
   * Listado organizado por: *Pendientes*, *Entregadas* y *Calificadas*.
   * Formulario de entrega de tareas con opción para subir enlaces o archivos de solución.

4. **Calendario de Evaluaciones (`/estudiante/evaluaciones`)**:
   * Cronograma de exámenes parciales, bimestrales y simulacros tipo admisión.

5. **Historial de Asistencias (`/estudiante/asistencias`)**:
   * Registro diario de puntualidad con fechas, horas exactas de ingreso y porcentaje global.

6. **Carnet Digital con Código QR (`/estudiante/carnet-qr`)**:
   * Credencial estudiantil virtual con fotografía, datos personales, código de matrícula y Código QR de alta resolución.
   * Listo para ser escaneado en el módulo de portería/kiosco para registro instantáneo de entrada y salida.

7. **Horario de Clases (`/estudiante/horario`)**:
   * Vista semanal de las asignaturas, horas y docentes correspondientes a su sección.

---

### 📲 4. Módulo Kiosco de Asistencia QR (`/asistencia`)

* Diseñado para operar en pantallas táctiles o dispositivos de portería/recepción con cámara o lector de código de barras/QR 2D.
* **Flujo**: El estudiante acerca su carnet QR -> El sistema decodifica el código -> Registra la marca de tiempo (Timestamp) -> Muestra pantalla de confirmación con nombre, foto y estado (**"Ingreso Registrado - A Tiempo"** o **"Tardanza"**).

---

## 5. Motores Clave y Lógica del Negocio

### 📐 A. Motor de Calificaciones Anuales (4 Bimestres)
1. **Cálculo Bimestral**: El docente registra las evaluaciones de cada competencia en el bimestre; el sistema calcula el promedio bimestral ($PB_1, PB_2, PB_3, PB_4$).
2. **Cálculo de la Nota Final Anual**:
   $$\text{Promedio Final} = \frac{PB_1 + PB_2 + PB_3 + PB_4}{4}$$
3. **Escala de Conversión CNEB**:
   * **AD (18 - 20)**: Logro Destacado
   * **A (14 - 17)**: Logro Esperado
   * **B (11 - 13)**: En Proceso
   * **C (00 - 10)**: En Inicio / Desaprobado
4. **Condición Final de Año**:
   * Si el promedio de cada curso es $\ge 11$ (o Logro A/AD): **PROMOVIDO DE GRADO**.
   * Si tiene cursos con promedio $< 11$: **REQUIERE RECUPERACIÓN PEDAGÓGICA (Vacacional)**.

---

## 6. Credenciales de Acceso para Demostración

El sistema incluye usuarios preconfigurados para pruebas y auditorías en el portal `/login`:

| Rol | Usuario / DNI | Contraseña | Nivel / Perfil |
| :--- | :--- | :--- | :--- |
| 🛡️ **Administrador** | `admin` | `admin123` | Control Total del Sistema |
| 👨‍🏫 **Docente** | `DOC001` | `123456` | Prof. Carlos Mendoza (Matemáticas) |
| 🎓 **Estudiante** | `EST001` | `123456` | Alumno Juan Pérez (Secundaria) |

---

## 7. Enlaces y Recursos

* **🌐 Aplicación en Producción**: [https://cole-sistema-mini.vercel.app](https://cole-sistema-mini.vercel.app)
* **🐳 Dockerfile**: Listo para despliegues independientes en servidores propios (`docker build -t colesistema-mini .`).
