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
   * 6 KPIs institucionales (Total Alumnos, % Asistencia Hoy, Plana Docente, Cursos Activos, Matrículas del Mes, Alertas).
   * Widget de Asistencia del Día por Nivel con barra de progreso.
   * Widget de Rendimiento Académico por Grado.
   * Centro de Alertas Prioritarias (resueltas con 1 clic).
   * Timeline de Auditoría en tiempo real.

2. **Módulo de Comunicados Masivos & Citaciones (`/admin/comunicados`)**:
   * Envío de circulares con segmentación multidimensional (Nivel, Grados, Secciones y Roles).
   * Categorías: General, Urgente, Académico, Evento y Citaciones Oficiales.
   * Plantillas rápidas predefinidas (Entrega de libretas, Feriado, Seguridad).
   * Botón de formateo directo para WhatsApp y contador de familias alcanzadas en tiempo real.
   * Confirmación obligatoria de lectura y acuse de recibo para apoderados y docentes.

3. **Padrón de Estudiantes y Perfil 360° (`/admin/estudiantes` y `/admin/estudiantes/[id]`)**:
   * Listado con búsqueda reactiva, filtros de nivel/sección y estados.
   * Perfil integral con 11 pestañas especializadas.
   * Emisión e impresión de Carnets QR en lote o individual.

4. **Matrículas y Admisiones (`/admin/matriculas`)**:
   * **Wizard de Matrícula Individual**: 6 pasos completos con generación instantánea de credenciales y carnet QR.
   * **📥 Importación Masiva Excel / CSV**: Carga de lotes completos de estudiantes con plantilla estandarizada y validación automática de campos.
   * **📇 Planilla Masiva de Carnets (A4)**: Generación en 1 clic de láminas de 8 carnets QR con guías de corte listas para imprenta.

5. **Consolidado de Calificaciones y SIAGIE (`/admin/notas-salon` y `/admin/reportes`)**:
   * Sábana completa de calificaciones por sección y bimestre.
   * **📑 Exportador Oficial SIAGIE MINEDU**: Generación de archivos CSV con codificación UTF-8 BOM estructurados para el sistema oficial del MINEDU.
   * **🏆 Cuadro de Mérito y Padrón de Excelencia**: Ranking ponderado de primeros puestos según la escala CNEB (AD, A, B, C).
   * Descarga masiva de libretas consolidadas y actas oficiales en PDF.

---

### 👨‍🏫 B. Portal Docente

1. **Dashboard del Profesor (`/docente`)**:
   * Clases del día con horario y aula actual.
   * Muro de comunicados y citaciones docentes con botón de acuse de recibo *"✓ Recibido y Leído"*.
   * Resumen de tareas pendientes de corrección y alertas del tutor.

2. **Toma de Asistencia Ultrarrápida (`/docente/asistencia`)**:
   * Todos los alumnos marcados como "Presente" de manera predeterminada.
   * Cambio de estado con un solo clic (Tardanza, Falta, Justificado).
   * Auto-guardado instantáneo con confirmación visual.

3. **Registro de Notas CNEB & Productividad (`/docente/notas`)**:
   * **⚡ Llenado Rápido por Columna**: Botón relámpago en cada competencia para asignar notas masivas (`AD`, `A`, `B`, `C`) a todo el salón.
   * **🪄 Asistente de Conclusiones Descriptivas Sugeridas CNEB**: Recomendaciones pedagógicas formativas automáticas según el área y la escala obtenida.
   * Cálculo en tiempo real del promedio de período y anual.

4. **Panel de Tutoría & Bienestar Estudiantil (`/docente/tutoria`)**:
   * Semáforo académico del salón con detección de cursos en riesgo.
   * Bitácora de incidencias, acuerdos de convivencia y directorio telefónico de emergencia de padres.

5. **Gestor de Tareas y Evaluaciones (`/docente/tareas`, `/docente/evaluaciones`)**:
   * Publicación de actividades con rúbrica, fecha límite y adjuntos.
   * Revisión de entregas con calificación CNEB y retroalimentación personalizada.

---

### 🎓 C. Portal Estudiante

1. **Dashboard Escolar (`/estudiante`)**:
   * Carnet digital QR interactivo para acceso en portería.
   * Mural de comunicados y avisos institucionales del salón.
   * Horario semanal y próximas evaluaciones bimestrales.
   * Tareas pendientes con botón de entrega de evidencias.
   * Consulta en vivo de libreta oficial de calificaciones por competencias.

---

### 👨‍👩‍👧 D. Portal Apoderado

1. **Dashboard Familiar Multi-Hijo (`/apoderado`)**:
   * Switcher de hijos con sincronización inmediata de datos.
   * Muro de comunicados y citaciones escolares con botón de confirmación de asistencia.
   * Agenda escolar unificada (tareas, exámenes y feriados).
   * Descarga directa de Ficha Oficial de Matrícula y Libreta de Notas en PDF.
   * Formulario de justificación de inasistencias con seguimiento de estado.

---

### 📲 E. Kiosco de Asistencia QR en Portería (`/asistencia`)

1. **Operación en Puerta de Ingreso / Salida**:
   * **🔫 Soporte Nativo para Pistolas Lectoras USB**: Captura global de ráfagas de teclado sin requerir foco en pantalla.
   * **Decodificador Inteligente Multi-Formato**: Lectura de JSON, URLs, Tokens, DNI y carnets docentes.
   * **Feedback Auditivo con Web Audio API**: Tonos diferenciados para puntualidad, tardanza y alerta de duplicados.
   * **Modo Entrada / Salida**: Control de ingreso matutino y retiro escolar.
---

## 4. Búsqueda Rápida Command Palette (`CTRL + K`)

En cualquier lugar de la aplicación, presionar `CTRL + K` (o `CMD + K` en macOS) para abrir el buscador universal:
* Búsqueda de estudiantes por nombres, apellidos, DNI o código.
* Búsqueda de docentes por nombre o especialidad.
* Búsqueda de cursos y secciones del plan de estudios.
* Accesos rápidos a acciones del sistema (Nueva Matrícula, Terminal QR, Comunicados, Consolidado).

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

---

## 6. Despliegue y Acceso en la Nube

* **URL de Producción:** [https://cole-sistema-mini.vercel.app](https://cole-sistema-mini.vercel.app)
* **Repositorio Git:** [https://github.com/Alessander9/ColeSistemaMini.git](https://github.com/Alessander9/ColeSistemaMini.git)
* **Normativa Curricular:** Currículo Nacional de la Educación Básica (CNEB) — RVM 094-2020-MINEDU.
