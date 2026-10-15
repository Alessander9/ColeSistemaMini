# 📘 Guía Maestra de Configuración, Operación por Roles y Testing Manual
## Sistema Escolar ColeSistemaMini — Año Escolar 2026

---

## 📑 Tabla de Contenidos
1. [Requisitos y Configuración del Entorno](#1-requisitos-y-configuración-del-entorno)
2. [Modo Demo Local vs. Modo Supabase Cloud](#2-modo-demo-local-vs-modo-supabase-cloud)
3. [Orden Lógico de Ingreso de Información (Setup de Colegio desde Cero)](#3-orden-lógico-de-ingreso-de-información-setup-de-colegio-desde-cero)
4. [Flujo Operativo del Día a Día (Rol por Rol)](#4-flujo-operativo-del-día-a-día-rol-por-rol)
5. [Guía de Testing Manual Paso a Paso (Credenciales y Casos de Prueba)](#5-guía-de-testing-manual-paso-a-paso-credenciales-y-casos-de-prueba)
6. [Matriz de URLs y Módulos por Rol](#6-matriz-de-urls-y-módulos-por-rol)

---

## 1. Requisitos y Configuración del Entorno

### 1.1 Prerrequisitos de Software
* **Node.js**: Versión 18.18.0 o superior (recomendado Node.js 20 LTS o Node.js 22).
* **NPM**: Versión 9+ (incluido con Node).
* **Navegador Web Moderno**: Google Chrome, Microsoft Edge, Brave o Firefox.
* *(Opcional para tests automatizados)*: Python 3.10+ con `playwright`.

### 1.2 Instalación Rápida
Abre una terminal en la carpeta raíz del proyecto (`ColeSistemaMini-dev/ColeSistemaMini-dev`) y ejecuta:

```bash
# 1. Instalar dependencias del proyecto
npm install

# 2. Configurar el archivo de variables de entorno
# En Windows PowerShell:
if (!(Test-Path ".env.local")) { Copy-Item ".env.example" ".env.local" }

# En Linux / Mac:
cp -n .env.example .env.local

# 3. Iniciar el servidor de desarrollo
npm run dev
```

El servidor estará disponible en:
👉 **`http://localhost:3000`** *(o `http://localhost:3001` si el 3000 está en uso)*.

---

## 2. Modo Demo Local vs. Modo Supabase Cloud

El sistema cuenta con una **detección inteligente automática** (`isSupabaseConfigured()`) en `src/lib/supabase/config.ts`:

### 🧪 A. Modo Demo Local (Por defecto)
* **¿Cuándo se activa?**: Automáticamente cuando el archivo `.env.local` contiene los valores de ejemplo (`your-project-id.supabase.co`, `your-anon-key`).
* **Persistencia**: Los datos se cargan desde el catálogo curricular oficial en memoria y persisten reactivamente en `localStorage` del navegador.
* **Ventaja**: Permite probar, demostrar y testear el 100% de los módulos sin configurar tarjetas de crédito, servidores ni bases de datos remotas.
* **Servicios de correo (Resend / Brevo)**: Simulan el despacho inmediato en consola y devuelven confirmación exitosa `simulated: true`.

### ☁️ B. Modo Supabase Cloud (Producción)
Para conectar una base de datos PostgreSQL real en la nube:
1. Crea un proyecto en [Supabase](https://supabase.com).
2. Ejecuta el script SQL ubicado en `supabase/schema.sql` en el SQL Editor de Supabase.
3. Edita `.env.local` con tus credenciales reales:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
4. Reinicia el servidor con `npm run dev`.

---

## 3. Orden Lógico de Ingreso de Información (Setup de Colegio desde Cero)

> ⚠️ **REGLA DE ORO DE DEPENDENCIAS DE DATOS:**
> En un sistema escolar no puedes matricular alumnos si no existen aulas; no puedes asignar horarios si no hay docentes ni materias; y no puedes tomar asistencia por QR si no se han emitido los carnets.

Sigue rigurosamente este orden cronológico para configurar un colegio por primera vez:

```text
  PASO 1: Identidad y Marca (Admin)
     │
     ▼
  PASO 2: Estructura de Aulas y Grados (Admin)
     │
     ▼
  PASO 3: Padrón del Plantel Docente (Admin)
     │
     ▼
  PASO 4: Carga Lectiva y Horarios (Admin)
     │
     ▼
  PASO 5: Matrícula de Alumnos y Familias (Admin)
     │
     ▼
  PASO 6: Emisión de Carnets Escolares QR (Admin)
     │
     ▼
  PASO 7: Comunicado de Apertura del Año (Admin)
```

---

### Detalle Paso a Paso de la Configuración Inicial:

### 🏛️ PASO 1: Identidad del Colegio y Reglas del Sistema
* **Rol**: `Director / Administrador`
* **Ruta**: `/admin/branding`
* **Acciones a realizar**:
  1. Ingresa el **Nombre Oficial de la Institución** (ej. *Colegio San Martín de Porres*).
  2. Define las **Siglas** (ej. *CSMP*) y el **Lema Institucional**.
  3. Carga el **Logotipo** y selecciona la **Paleta de Colores** (Primario y Acento).
  4. Configura el tipo de gestión:
     * **Pública**: Deshabilita automáticamente el módulo de pensiones y tesorería.
     * **Privada**: Habilita cronogramas de pensiones, caja y recibos A5.
  5. Haz clic en **Guardar cambios**.

---

### 📚 PASO 2: Estructura Curricular y Aulas
* **Rol**: `Director / Administrador`
* **Ruta**: `/admin/academico`
* **Acciones a realizar**:
  1. Verifica los niveles habilitados: **Inicial**, **Primaria** y **Secundaria**.
  2. Crea las secciones correspondientes a cada grado (ej. `1.° de Primaria "A"`, `3.° de Primaria "B"`).
  3. Establece la capacidad máxima de vacantes por aula (ej. 30 alumnos por sección).

---

### 👨‍🏫 PASO 3: Registro de la Plana Docente
* **Rol**: `Director / Administrador`
* **Ruta**: `/admin/docentes`
* **Acciones a realizar**:
  1. Presiona **Nuevo Docente**.
  2. Ingresa DNI, Nombres, Apellidos, Teléfono y Correo institucional.
  3. Asigna la especialidad principal (ej. *Matemática*, *Comunicación*, *Ciencia y Tecnología*).
  4. Guarda el registro para generar sus credenciales de acceso al portal docente.

---

### ⏰ PASO 4: Asignación de Cursos y Horario Semanal
* **Rol**: `Director / Administrador`
* **Ruta**: `/admin/horarios` y `/admin/academico`
* **Acciones a realizar**:
  1. Asigna qué docente es el titular de cada curso en cada sección (ej. *Prof. Tomás Pérez -> Matemática en 3° Primaria A*).
  2. Designa al **Tutor de Aula** responsable de cada salón.
  3. Distribuye las horas en la malla de bloques (Lunes a Viernes de 07:30 a 14:00).

---

### 🎒 PASO 5: Matrícula de Estudiantes y Vinculación Familiar
* **Rol**: `Director / Administrador`
* **Ruta**: `/admin/matriculas` o `/admin/estudiantes`
* **Acciones a realizar**:
  * **Opción Individual**:
    1. Presiona **Matricular Alumno**.
    2. Completa los datos personales del estudiante (DNI de 8 dígitos, nombres, fecha de nacimiento).
    3. Selecciona el **Aula / Sección** de destino.
    4. Registra los datos del **Padre o Apoderado** (DNI, teléfono y correo electrónico para notificaciones).
    5. Guarda el registro. El sistema genera automáticamente el código único (ej. `EST-2026-001`), el usuario y la contraseña inicial.
  * **Opción Masiva**:
    1. Selecciona **Importar desde Excel / CSV**.
    2. Carga la lista consolidada de alumnos del colegio.

---

### 📇 PASO 6: Emisión y Distribución de Carnets QR
* **Rol**: `Director / Administrador`
* **Ruta**: `/admin/estudiantes`
* **Acciones a realizar**:
  1. En el padrón de alumnos, haz clic en el botón **Carnet** de cualquier estudiante para previsualizarlo con su QR criptográfico.
  2. Para emisión masiva: Haz clic en **Generar Planilla A4** en `/admin/matriculas` para descargar las láminas de 8 carnets por hoja con guías de corte listas para laminar y entregar a los alumnos.

---

### 📢 PASO 7: Lanzamiento y Publicación de Comunicado
* **Rol**: `Director / Administrador`
* **Ruta**: `/admin/comunicados`
* **Acciones a realizar**:
  1. Haz clic en **Nuevo Comunicado**.
  2. Redacta el mensaje de bienvenida al Año Escolar 2026.
  3. Segmenta a: *Todos los Apoderados y Docentes*.
  4. Activa la casilla *Confirmación obligatoria de lectura*.
  5. Haz clic en **Publicar**.

---

## 4. Flujo Operativo del Día a Día (Rol por Rol)

Así interactúan los usuarios en la jornada escolar cotidiana:

```text
 07:15 AM - 08:00 AM   [PORTERÍA]  Escaneo de Carnets QR en Entrada (/asistencia)
         │
 08:00 AM - 01:30 PM   [DOCENTE]   Toma de Asistencia, LMS, Tareas y Notas (/docente)
         │
 02:00 PM - 06:00 PM   [ALUMNO]    Revisión de Tareas y Libreta Digital (/estudiante)
         │
 06:00 PM - 08:00 PM   [FAMILIA]   Seguimiento, Justificación de Faltas (/apoderado)
         │
 FIN DE MES / BIMESTRE [ADMIN]     Consolidado SIAGIE y Auditoría (/admin/reportes)
```

---

### 🚪 Momento 1: Ingreso Matutino (07:15 AM - 08:15 AM)
* **Actor**: `Operador de Portería / Kiosco QR`
* **Portal**: `/asistencia`
* **Operación**:
  1. Abre el modo Kiosco en la laptop, tablet o PC de la entrada.
  2. Los estudiantes acercan su carnet escolar a la cámara web o pistola lectora USB.
  3. **Feedback instantáneo**:
     * Pantalla verde + campana auditiva: *¡Bienvenido(a)! Ingreso A tiempo.*
     * Pantalla ámbar + alerta: *Ingreso registrado como Tardanza.*
  4. Si un alumno olvidó su carnet: El operador escribe su DNI o código en **Registro Manual** y presiona **Registrar**.
  5. El apoderado recibe automáticamente un correo de confirmación de ingreso seguro.

---

### 👨‍🏫 Momento 2: Jornada Pedagógica en Aulas (08:00 AM - 01:30 PM)
* **Actor**: `Docente de Aula`
* **Portal**: `/docente`
* **Operación**:
  1. **Asistencia de Aula (`/docente/asistencia`)**: Al iniciar la clase, el docente abre su salón. Todos figuran presentes por defecto; solo desmarca con 1 clic a los ausentes.
  2. **Registro Auxiliar de Notas (`/docente/notas`)**:
     * Selecciona su sección, curso y el bimestre en curso.
     * Evalúa por competencias CNEB con la escala oficial: **AD** (Logro destacado), **A** (Logro esperado), **B** (En proceso), **C** (En inicio).
     * El sistema calcula de inmediato el promedio del área.
  3. **Aula Virtual y Tareas (`/docente/tareas`)**:
     * Publica tareas con fecha límite de entrega, instrucciones y archivos adjuntos.
     * Revisa y califica las evidencias enviadas por los alumnos.

---

### 🎓 Momento 3: Tarde de Estudio del Alumno (02:00 PM - 06:00 PM)
* **Actor**: `Estudiante`
* **Portal**: `/estudiante`
* **Operación**:
  1. **Aula Virtual (`/estudiante/tareas`)**: Revisa las tareas pendientes asignadas para el día y sube la foto o documento de su tarea resuelta.
  2. **Carnet Digital (`/estudiante/carnet-qr`)**: Muestra su carnet escolar en el celular para identificarse en biblioteca o actividades escolares.
  3. **Boletín de Notas (`/estudiante/libreta-notas`)**: Monitorea sus calificaciones bimestrales y conclusiones descriptivas formativas.

---

### 👨‍👩‍👧 Momento 4: Monitoreo Familiar (06:00 PM - 08:00 PM)
* **Actor**: `Apoderado / Padre de Familia`
* **Portal**: `/apoderado`
* **Operación**:
  1. **Dashboard Familiar (`/apoderado`)**: Si tiene más de un hijo, cambia de pestaña entre ellos. Revisa si su hijo ingresó puntual y sus calificaciones actuales.
  2. **Supervisión de Deberes (`/apoderado/tareas`)**: Verifica qué tareas tiene pendientes y cuáles ya fueron calificadas por los profesores.
  3. **Módulo de Justificaciones (`/apoderado/justificar`)**: Si su hijo faltó por salud o cita médica, selecciona la fecha, el motivo (*Salud / Cita médica*), escribe una breve explicación y envía la justificación a la dirección.

---

### 📊 Momento 5: Cierre de Bimestre y SIAGIE (Fin de Periodo)
* **Actor**: `Director / Administrador`
* **Portal**: `/admin`
* **Operación**:
  1. **Monitoreo de Calificaciones (`/admin/notas-salon`)**: Verifica que todos los docentes hayan cerrado sus notas al 100%.
  2. **Exportador Oficial SIAGIE (`/admin/reportes`)**: Descarga el archivo CSV estructurado bajo normativa UTF-8 BOM del Ministerio de Educación (MINEDU) para subirlo a la plataforma estatal SIAGIE.
  3. **Emisión de Libretas**: Genera e imprime las Libretas Oficiales de Calificaciones en PDF.

---

## 5. Guía de Testing Manual Paso a Paso (Credenciales y Casos de Prueba)

### 🔑 Tabla de Cuentas Demo Oficiales

Puedes iniciar sesión con cualquiera de estos perfiles utilizando los **botones de 1 clic** en `/login`:

| Rol | Botón de Acceso Rápido | Correo Demo | Contraseña | Dashboard Destino |
| :--- | :--- | :--- | :--- | :--- |
| **Director / Admin** | `Director / Admin` | `admin@colegio.edu.pe` | `admin123` | `/admin` |
| **Docente** | `Docente` | `docente@colegio.edu.pe` | `Colegio2026!` | `/docente` |
| **Estudiante** | `Estudiante` | `estudiante@colegio.edu.pe` | `Colegio2026!` | `/estudiante` |
| **Apoderado** | `Apoderado` | `apoderado@colegio.edu.pe` | `Colegio2026!` | `/apoderado` |
| **Portería / QR** | `Kiosco QR` | `asistencia@colegio.edu.pe` | `Colegio2026!` | `/asistencia` |

---

### 🧪 Casos de Prueba Manuales Sugeridos (Paso a Paso)

#### Test Case 1: Prueba del Kiosco de Asistencia QR
1. Ve a `/login`.
2. Haz clic en el botón rápido **Kiosco QR** y luego en **Iniciar Sesión**.
3. Verifica que carga la pantalla completa oscura en `/asistencia`.
4. En la barra inferior de **Registro Manual**, escribe el código `EST-2026-001` y presiona **Registrar**.
5. **Resultado esperado**: Debe sonar un chime auditivo y mostrarse una tarjeta modal verde confirmando la asistencia de **Lucas Morales Vega** con fecha y hora actual.

#### Test Case 2: Prueba de Emisión de Carnet QR (Administrador)
1. Ve a `/login`, clic en **Director / Admin** y presiona **Iniciar Sesión**.
2. En el menú lateral o superior, ve a **Alumnos** (`/admin/estudiantes`).
3. En la tarjeta del primer alumno, haz clic en el botón con icono QR: **Carnet**.
4. **Resultado esperado**: Se abre el modal *"Carnet Escolar con Código QR"* mostrando los datos del alumno, grado, sección y el código QR generado en tiempo real sobre un elemento `<canvas>`.
5. Cierra el modal con la X.

#### Test Case 3: Prueba de Calificación CNEB (Docente)
1. Ve a `/login`, clic en **Docente** y presiona **Iniciar Sesión**.
2. Dirígete a **Notas de mis alumnos** (`/docente/notas`).
3. Elige la sección (*3° Primaria A*), curso (*Matemática*) y el bimestre.
4. En cualquier casillero de nota de un alumno, haz clic para cambiar la calificación entre **AD**, **A**, **B** y **C**.
5. **Resultado esperado**: La insignia de nota actualiza su color (AD=Azul/Celeste, A=Verde, B=Ámbar, C=Rojo) y el promedio final del estudiante se recalcula al instante.

#### Test Case 4: Prueba del Portal Estudiante y Tareas
1. Ve a `/login`, clic en **Estudiante** y presiona **Iniciar Sesión**.
2. En `/estudiante`, comprueba el saludo personalizado (*¡Hola, Lucas!*) y los indicadores de aula.
3. Ve a **Mis tareas** (`/estudiante/tareas`).
4. Haz clic sobre una tarea pendiente para ver los detalles, fecha límite y el botón de subida de archivos de evidencia.
5. Ve a **Boletín de notas** (`/estudiante/libreta-notas`) y verifica que se listen los cursos con las calificaciones otorgadas por los profesores.

#### Test Case 5: Prueba de Justificación de Faltas (Apoderado)
1. Ve a `/login`, clic en **Apoderado** y presiona **Iniciar Sesión**.
2. En `/apoderado`, haz clic en el botón superior **Justificar falta** (`/apoderado/justificar`).
3. Selecciona el motivo: **Salud o cita médica**.
4. Escribe un mensaje de ejemplo en el cuadro de texto.
5. Haz clic en **Enviar Justificación**.
6. **Resultado esperado**: El sistema emite un aviso de confirmación y registra la solicitud en el historial.

#### Test Case 6: Prueba de Seguridad y Control de Acceso (RBAC)
1. Estando con sesión de **Estudiante** iniciada, intenta ingresar manualmente en la barra del navegador a:
   `http://localhost:3001/admin`
2. **Resultado esperado**: El middleware de seguridad intercepta la petición, bloquea el acceso no autorizado y te redirige de vuelta a `/estudiante`.
3. Cierra sesión yendo a `/despedida`: Se mostrará la animación *"Sesión Finalizada"* y te redirigirá a `/login`.
4. Sin iniciar sesión, intenta acceder directamente a `http://localhost:3001/admin`:
5. **Resultado esperado**: Te redirige automáticamente a `/login?redirect=/admin`.

---

## 6. Matriz de URLs y Módulos por Rol

Para referencia rápida durante tus pruebas manuales:

| Módulo / Funcionalidad | Ruta URL | Rol Principal |
| :--- | :--- | :--- |
| **Inicio de Sesión** | `/login` | Público / Todos |
| **Pantalla de Bienvenida** | `/bienvenida` | Redirección post-login |
| **Cierre de Sesión Seguro** | `/despedida` | Todos |
| **Kiosco de Asistencia QR** | `/asistencia` | `asistencia`, `admin` |
| **Dashboard del Director** | `/admin` | `admin` |
| **Padrón de Alumnos y Carnets** | `/admin/estudiantes` | `admin` |
| **Plantel Docente** | `/admin/docentes` | `admin` |
| **Estructura Curricular CNEB** | `/admin/academico` | `admin` |
| **Matrículas y Admisiones** | `/admin/matriculas` | `admin` |
| **Comunicados Institucionales** | `/admin/comunicados` | `admin` |
| **Personalización y Branding** | `/admin/branding` | `admin` |
| **Tesorería y Pensiones** | `/admin/tesoreria` | `admin` (en colegios privados) |
| **Reportes y SIAGIE MINEDU** | `/admin/reportes` | `admin` |
| **Consolidado de Calificaciones** | `/admin/notas-salon` | `admin` |
| **Dashboard del Docente** | `/docente` | `docente` |
| **Control de Asistencia en Aula** | `/docente/asistencia` | `docente` |
| **Registro Auxiliar de Notas** | `/docente/notas` | `docente` |
| **Tareas y LMS Docente** | `/docente/tareas` | `docente` |
| **Exámenes y Prácticas** | `/docente/evaluaciones` | `docente` |
| **Horario del Profesor** | `/docente/horario` | `docente` |
| **Dashboard del Alumno** | `/estudiante` | `estudiante` |
| **Carnet Digital QR Personal** | `/estudiante/carnet-qr` | `estudiante` |
| **Mis Tareas y Evidencias** | `/estudiante/tareas` | `estudiante` |
| **Libreta Oficial de Notas** | `/estudiante/libreta-notas` | `estudiante` |
| **Historial de Puntualidad** | `/estudiante/asistencias` | `estudiante` |
| **Horario Escolar** | `/estudiante/horario` | `estudiante` |
| **Portal Familiar** | `/apoderado` | `apoderado` |
| **Supervisión de Tareas de Hijos** | `/apoderado/tareas` | `apoderado` |
| **Justificación de Inasistencias** | `/apoderado/justificar` | `apoderado` |

---

### 💡 Verificación Automatizada Complementaria
Recuerda que también puedes correr en cualquier momento el test suite integral automatizado que valida estos 43 casos en ~60 segundos:
```bash
npm run test:e2e
```
