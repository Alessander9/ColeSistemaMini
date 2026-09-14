# Manual Integral del Sistema ColeSistemaMini
## SaaS Educativo Premium — School Management & LMS Multi-Nivel

---

## 1. Visión General y Propósito

**ColeSistemaMini** es una plataforma SaaS integral de gestión escolar y LMS (Learning Management System) diseñada para modernizar, automatizar y centralizar toda la operación académica, formativa y administrativa de colegios e instituciones educativas de educación básica regular.

El sistema soporta de manera exclusiva y rigurosa los **tres niveles educativos oficiales**:
* 🧸 **Inicial** (3, 4 y 5 años — Ciclo II)
* 📚 **Primaria** (1.° a 6.° grado — Ciclos III, IV y V)
* 🎓 **Secundaria** (1.° a 5.° año — Ciclos VI y VII)

*(Nota: La plataforma no incluye ni soporta programas preuniversitarios, garantizando un enfoque 100% escolarizado y pedagógico).*

### Objetivos y Capacidades Centrales
1. **Contexto Académico Global Persistente**: Selector de nivel (`Inicial`, `Primaria`, `Secundaria` o `Todos`) con filtrado en tiempo real en toda la plataforma.
2. **Búsqueda Global Instantánea (`CTRL + K`)**: Command Palette universal para estudiantes, docentes, cursos, secciones y accesos directos.
3. **Control de Admisiones y Matrículas**: Asistente (Wizard) de 6 pasos para registro de postulante, apoderados, sección, documentación y generación de credenciales automáticas.
4. **Perfil 360° del Estudiante**: Vista consolidada con 11 pestañas de análisis (Resumen, Académico, Asistencia, Finanzas, Documentos, Apoderados, LMS, Salud, Disciplina, Observaciones y Auditoría).
5. **Control de Asistencia Bi-Modal**: Asistencia ultrarrápida para docentes en aula (todos presentes por defecto, 1 clic para excepciones) y Kiosco QR en pantalla completa para portería con audio sintetizado.
6. **Evaluación Curricular CNEB & Escala Vigésimal**: Registro por competencias (AD, A, B, C) o cuantitativo (0–20), con ponderación automática para la Libreta Anual Oficial.
7. **Portal Multi-Hijo para Apoderados**: Monitoreo en vivo de asistencia, tareas, libreta oficial y canal de comunicación con tutores.
8. **Aula Virtual LMS**: Módulos por lecciones con tracking de progreso y subida de evidencias.

---

## 2. Arquitectura de Navegación y Roles

El sistema cuenta con **4 roles de usuario** y un **Modo Kiosco**:

| Rol | Icono | Portal | Propósito Principal |
| :--- | :---: | :--- | :--- |
| **Administrador** | 🛡️ | `/admin` | Dirección y gestión: matrículas, perfil 360, asignación docente, horarios, centro de alertas y auditoría. |
| **Docente** | 👨‍🏫 | `/docente` | Gestión de aula: asistencia ultrarrápida, registro de notas CNEB, tareas, exámenes y feedback. |
| **Estudiante** | 🎓 | `/estudiante` | Alumno: carnet digital QR, cursos LMS, horarios, libreta oficial y entrega de tareas. |
| **Apoderado** | 👨‍👩‍👧 | `/apoderado` | Padres y tutores: selector multi-hijo, progreso académico, alertas de asistencia y tutores. |
| **Kiosco QR** | 📲 | `/asistencia` | Pantalla completa para control de acceso en puerta con confirmación audiovisual. |

---

## 3. Guía por Módulo y Funcionalidad

### 🛡️ A. Portal Administrador

1. **Dashboard Principal (`/admin`)**:
   * 6 KPIs institucionales (Total Alumnos, % Asistencia Hoy, Plana Docente, Cursos Activos, Matrículas del Mes, Cobranza).
   * Widget de Asistencia del Día por Nivel con barra de progreso.
   * Widget de Rendimiento Académico por Grado.
   * Centro de Alertas Prioritarias (resueltas con 1 clic).
   * Timeline de Auditoría en tiempo real.

2. **Padrón de Estudiantes y Perfil 360° (`/admin/estudiantes` y `/admin/estudiantes/[id]`)**:
   * Listado con búsqueda reactiva, filtros de nivel/sección y estados.
   * Perfil integral con 11 pestañas especializadas.
   * Emisión e impresión de Carnets QR en lote o individual.

3. **Wizard de Matrícula (`/admin/matriculas`)**:
   * Paso 1: Datos Personales del Estudiante.
   * Paso 2: Información de Padres / Apoderados.
   * Paso 3: Asignación de Nivel, Grado y Sección.
   * Paso 4: Carga y Validación de Documentos.
   * Paso 5: Registro de Concepto de Pago / Matrícula.
   * Paso 6: Resumen y Generación de Credenciales de Acceso.

4. **Gestión de Horarios y Plana Docente (`/admin/horarios` y `/admin/docentes`)**:
   * Matriz horaria semanal por aula con prevención de cruces de docentes y aulas.
   * Directorio de profesores con especialidad y asignaciones de cursos.

5. **Consolidado de Calificaciones (`/admin/notas-salon` y `/admin/reportes`)**:
   * Sábana completa de calificaciones por sección y bimestre.
   * Descarga de actas e informes en PDF.

---

### 👨‍🏫 B. Portal Docente

1. **Dashboard del Profesor (`/docente`)**:
   * Clases del día con horario y aula actual.
   * Resumen de tareas pendientes de corrección y alertas del tutor.

2. **Toma de Asistencia Ultrarrápida (`/docente/asistencia`)**:
   * Todos los alumnos marcados como "Presente" de manera predeterminada.
   * Cambio de estado con un solo clic (Tardanza, Falta, Justificado).
   * Auto-guardado instantáneo con confirmación visual.

3. **Registro de Notas CNEB (`/docente/notas`)**:
   * Matriz interactiva de calificaciones por competencia con escala AD / A / B / C o numérica.
   * Cálculo en tiempo real del promedio de período y anual.

4. **Gestor de Tareas y Evaluaciones (`/docente/tareas`, `/docente/evaluaciones`)**:
   * Publicación de actividades con rúbrica, fecha límite y adjuntos.
   * Revisión de entregas con calificación y retroalimentación personalizada.

---

### 🎓 C. Portal Estudiante

1. **Dashboard Escolar (`/estudiante`)**:
   * Horario del día y materias en curso.
   * Pendientes de entrega y recordatorios de exámenes.

2. **Carnet Digital QR (`/estudiante/carnet-qr`)**:
   * Identificación oficial con código QR dinámico de alta resolución para acceso en puerta.

3. **Libreta de Notas Oficial (`/estudiante/libreta-notas`)**:
   * Boleta de calificaciones por bimestres (I, II, III, IV) y promedio ponderado anual.

4. **Aula Virtual LMS (`/estudiante/tareas`)**:
   * Acceso a lecciones, material multimedia y formulario de entrega de tareas.

---

### 👨‍👩‍👧 D. Portal Apoderado (Familia)

1. **Selector Multi-Hijo (`/apoderado`)**:
   * Pestañas para alternar entre hijos matriculados en la institución.

2. **Métricas de Rendimiento y Asistencia**:
   * Porcentaje de asistencia mensual, asistencias a tiempo y alertas de tardanzas.
   * Promedio ponderado y estatus en cada curso.

3. **Canal de Tutoría y Avisos**:
   * Información de contacto del tutor de salón y avisos de dirección.

---

### 📲 E. Kiosco de Control QR en Puerta (`/asistencia`)

* Modo pantalla completa diseñado para tablets o monitores en recepción.
* Mensaje gigante **"ACERCA TU CARNET ESCOLAR"**.
* Lectura por cámara web o pistola lectora de código de barras / QR USB.
* Respuesta audiovisual inmediata con mensaje de voz ("¡Bienvenido, [Nombre]!").
* Retorno automático al estado de espera tras 4 segundos.

---

## 4. Búsqueda Rápida Command Palette (`CTRL + K`)

En cualquier lugar de la aplicación, presionar `CTRL + K` (o `CMD + K` en macOS) para abrir el buscador universal:
* Búsqueda de estudiantes por nombres, apellidos, DNI o código.
* Búsqueda de docentes por nombre o especialidad.
* Búsqueda de cursos y secciones del plan de estudios.
* Accesos rápidos a acciones del sistema (Nueva Matrícula, Terminal QR, Consolidado).

---

## 5. Cuentas Demo para Pruebas Inmediatas

En la pantalla de inicio de sesión (`/login`), se encuentran disponibles tarjetas de acceso con 1 clic:

| Perfil | Rol | Correo Electrónico | Contraseña |
| :--- | :--- | :--- | :--- |
| **Dirección General** | Administrador | `admin@colegio.edu.pe` | `admin123` |
| **Prof. Carlos Mendoza** | Docente | `docente@colegio.edu.pe` | `profesor123` |
| **Mateo Quispe** | Estudiante | `alumno@colegio.edu.pe` | `alumno123` |
| **María Elena Rojas** | Apoderado | `apoderado@colegio.edu.pe` | `123456` |
| **Control Puerta** | Portería / QR | `porteria@colegio.edu.pe` | `porteria123` |
