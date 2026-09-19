# 🏫 Guía de Usuario y Manual de Operaciones — ColeSistema Mini
**Manual Práctico No Técnico para Directores, Docentes, Estudiantes, Apoderados y Personal de Portería.**

---

## 🌟 1. ¿Qué es ColeSistema Mini?

**ColeSistema Mini** es una plataforma digital moderna y sencilla diseñada para gestionar toda la vida diaria del colegio en un solo lugar:
- **Control de Asistencia por Código QR**: Registro instantáneo en la entrada sin filas, papel ni demoras.
- **Libretas y Notas Oficiales CNEB**: Calificaciones con la escala nacional de letras (**AD**, **A**, **B**, **C**) y conclusiones descriptivas obligatorias.
- **Portal para la Familia**: Los padres pueden monitorear en vivo si su hijo llegó al colegio y consultar sus notas desde el celular.
- **Aula Virtual & Tareas**: Los profesores dejan tareas con adjuntos y los alumnos suben sus trabajos por internet.
- **Carnet Escolar Oficial**: Credencial digital y física con foto, datos de emergencia y código QR personal.

---

## 🛠️ 2. Configuración Previa y Puesta a Punto del Colegio (Flujo Oficial de 5 Pasos)

Antes de iniciar el año escolar o abrir la portería el primer día de clases, la **Dirección / Administración** debe completar la configuración en el orden lógico natural establecido en la plataforma.

El nuevo **Panel de Administración (`/admin`)** incluye un **Asistente Interactivo de 5 Pasos** con indicador de avance en tiempo real, y el menú lateral (*Sidebar*) está organizado exactamente en esta secuencia:

```
┌──────────────────────────────────────────────────────────────────────────────┐
│             FLUJO OFICIAL DE CONFIGURACIÓN INICIAL (5 PASOS)                 │
├──────────────────────────────────────────────────────────────────────────────┤
│ 1. Cursos & Materias ➔ 2. Grados & Secciones ➔ 3. Plana Docente              │
│ ➔ 4. Horarios por Aula ➔ 5. Matrícula de Alumnos & Fichas PDF                │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

### Paso 1: Malla Curricular, Cursos y Competencias CNEB (`/admin/academico`)
*¿Por qué primero?* Para poder asignar materias a los profesores y armar horarios, primero deben existir los cursos oficiales del colegio.

1. **Catálogo Curricular Nacional**:
   - El sistema viene pre-cargado con las áreas oficiales del Currículo Nacional de la Educación Básica (**CNEB**): *Matemática, Comunicación, Ciencia y Tecnología, Personal Social, Inglés, Arte y Cultura, Educación Física y Educación Religiosa*.
2. **Personalización de Cursos**:
   - Puedes crear cursos adicionales o talleres (ej. *Robótica, Computación, Ajedrez*).
   - Asigna a cada curso su color distintivo y sus competencias de evaluación con conclusiones descriptivas.

---

### Paso 2: Grados, Niveles y Aulas / Secciones (`/admin/academico`)
*¿Por qué segundo?* Los profesores y horarios necesitan un salón físico y una sección a la cual pertenecer.

1. **Niveles Educativos**:
   - 🧸 **Inicial**: 3 años, 4 años y 5 años.
   - ✏️ **Primaria**: 1° a 6° de Primaria.
   - 🎓 **Secundaria**: 1° a 5° de Secundaria.
2. **Creación de Secciones (Aulas A y B)**:
   - Crea las secciones correspondientes (ej. *1° de Secundaria - Sección "A"* y *1° de Secundaria - Sección "B"*).
   - Configura el **Aforo Máximo** de cada salón (ej. 30 o 35 estudiantes) para control automático de capacidad y prevención de sobrecupos.
   - Asigna el aula física (ej. *Pabellón B - Aula 204*).

---

### Paso 3: Plana Docente, Tutorías y Credenciales de Acceso (`/admin/docentes`)
*¿Por qué tercero?* Con los cursos y salones listos, ya puedes registrar a cada profesor y asignarle su aula tutora y especialidad.

1. **Registro del Docente**:
   - Haz clic en **"+ Nuevo Docente"**.
   - Ingresa: Nombres, Apellidos, DNI, Teléfono y Especialidad (ej. *Licenciado en Matemáticas y Física*).
2. **Credenciales y Acceso al Sistema**:
   - El sistema genera o permite personalizar el usuario institucional (ej. `carlos.mendoza@colegio.edu.pe`) y su contraseña de ingreso para que el profesor entre a `/docente`.
3. **Designación de Tutoría de Aula**:
   - Asigna al docente como **Profesor Tutor** de una sección específica. El tutor será el responsable del seguimiento conductual, justificaciones médicas y atención directa a los padres.
4. **Asignación de Cursos**:
   - Vincula las materias que dictará en cada grado y sección.

---

### Paso 4: Horarios Semanales por Aula sin Cruces (`/admin/horarios`)
*¿Por qué cuarto?* Ahora que los profesores tienen cursos y salones asignados, se diseña el horario semanal para que los alumnos y maestros conozcan su rutina diaria.

1. **Estructura Diaria de 7 Bloques**:
   - **1° Hora**: 08:00 AM – 08:45 AM
   - **2° Hora**: 08:45 AM – 09:30 AM
   - **3° Hora**: 09:30 AM – 10:15 AM
   - 🥪 **RECREO GENERAL**: 10:15 AM – 10:45 AM
   - **4° Hora**: 10:45 AM – 11:30 AM
   - **5° Hora**: 11:30 AM – 12:15 PM
   - **6° Hora**: 12:15 PM – 01:00 PM
   - **7° Hora**: 01:00 PM – 01:45 PM
2. **Diseñador Visual Anti-Cruces**:
   - Selecciona el salón (ej. *5to Secundaria "A"*).
   - Distribuye las materias de Lunes a Viernes. El sistema detecta y bloquea en rojo si intentas programar al mismo profesor en dos salones al mismo tiempo.

---

### Paso 5: Matrícula de Alumnos, Credenciales y Descarga Automática de Ficha PDF (`/admin/matriculas`)
*¿Por qué quinto?* El alumno ingresa a un salón que ya tiene horario, materias y docentes completamente definidos.

1. **Datos del Estudiante y Apoderado**:
   - Nombres, Apellidos, DNI, Fecha de Nacimiento y datos médicos (grupo sanguíneo, alergias).
   - Datos del Apoderado (Papá / Mamá / Tutor): Nombre completo, teléfono celular y correo.
2. **Configuración de Credenciales de Acceso**:
   - Puedes definir o editar el usuario y contraseña de acceso para el **Estudiante** (portal `/estudiante`) y para el **Apoderado** (portal `/apoderado`).
3. **Confirmación y Descarga Automática de Ficha de Matrícula en PDF**:
   - Al confirmar la matrícula, el sistema:
     - Asigna el **Código Oficial de Estudiante** (ej. `EST-2026-0042`).
     - Genera su **Token QR Único de Asistencia**.
     - **Descarga automáticamente la Ficha de Matrícula Oficial en PDF**, la cual incluye:
       - Datos completos del alumno y grado/sección asignado.
       - Datos del apoderado registrado.
       - **Credenciales de acceso a la plataforma** (usuario y contraseña para el portal del alumno y del apoderado).
       - Espacios para firma de compromiso y sello de la dirección.
4. **Cero Datos Ficticios**:
   - El estudiante recién matriculado inicia limpiamente con su récord en blanco: sin notas ni asistencias inventadas, listo para registrar su progreso real.

---

### Pasos Complementarios de Soporte y Portería

#### A. Identidad Institucional y Branding (`/admin/branding`)
- Personaliza el Nombre del Colegio, Código Modular, UGEL, Lema, Colores Corporativos, Logo oficial y la Firma/Sello Digital de la Dirección para que aparezcan en todas las libretas y certificados.

#### B. Directorio Estudiantil y Emisión de Carnets QR (`/admin/estudiantes` y `/admin/branding`)
- Imprime los fotochecks escolares en formato Vertical (con cinta) u Horizontal (tarjeta PVC). Cada carnet incluye foto, código QR de alta resolución, sello brillante *"Matriculado Oficial 2026"* y teléfonos de emergencia.

#### C. Puesta a Punto de la Estación de Portería (`/asistencia`)
- Coloca una computadora o tablet en la puerta de ingreso con cámara web o lector QR.
- Abre la pantalla `/asistencia` a pantalla completa. ¡El colegio está listo para operar!

---

### 📋 Checklist de Verificación para el Primer Día de Clases
Antes de iniciar las clases, verifica que:
- [x] La Malla Curricular y Cursos estén configurados.
- [x] Todas las secciones tengan su aula física y aforo establecido.
- [x] Toda la plana docente tenga sus usuarios activos y tutores asignados.
- [x] La matriz de horarios semanales esté completa y sin cruces.
- [x] Los alumnos estén matriculados y sus Fichas PDF con credenciales entregadas a los padres.
- [x] Los carnets escolares QR estén impresos y la cámara del Kiosco en puerta conectada.

---

## ⏰ 3. El Día a Día Escolar: Flujo Operativo Diario Cronológico

Así interactúa toda la comunidad educativa a lo largo de una jornada escolar:

```
┌───────────────────────────────────────────────────────────────────────────────┐
│                     CRONOGRAMA DE UN DÍA ESCOLAR TÍPICO                       │
├─────────────────┬─────────────────────────────────────────────────────────────┤
│  07:00 - 08:00  │ 🚪 ENTRADA Y PORTERÍA: Escaneo de Carnets QR en el Kiosco   │
│  08:00 - 08:30  │ 🛡️ DIRECCIÓN: Monitoreo en vivo de asistencia y aforo        │
│  08:30 - 13:45  │ 👨‍🏫 EN AULA: Docentes dictan clases, califican y toman lista │
│  14:00 - 17:00  │ 👨‍👩‍👦 EN CASA: Familias revisan asistencia, notas y tareas     │
│  17:00 - 18:00  │ 📋 CIERRE: Reportes oficiales y justificaciones médicas     │
└─────────────────┴─────────────────────────────────────────────────────────────┘
```

### 1. Mañana temprano (07:00 AM – 08:00 AM) — *La Llegada al Colegio*
1. **En la Puerta del Colegio**: El personal de portería tiene el **Kiosco QR** abierto (`/asistencia`).
2. **El Alumno llega**: Muestra su **Carnet Escolar** (físico o desde su celular).
3. **El Kiosco escanea**: En menos de 1 segundo, la pantalla se ilumina en **verde**, suena un tono agradable, cae una lluvia de confetti y muestra la foto del alumno con el mensaje: *"¡Bienvenido Mateo Torres! Ingreso puntual: 07:48 AM"*.
4. **Alarma de Tardanza**: Si el alumno llega después de las 08:00 AM, la pantalla cambia a color **ámbar** y registra automáticamente los minutos de retraso.
5. **Notificación al Padre**: En ese mismo instante, el apoderado puede ver en su celular que su hijo ya ingresó al colegio.

### 2. Primera hora de la mañana (08:00 AM – 08:30 AM) — *Revisión de Dirección*
1. El **Director o Administrador** entra a su panel (`/admin`).
2. Ve en su pantalla el medidor de asistencia en tiempo real: cuántos alumnos llegaron, cuántos tienen tardanza y cuántos faltaron.
3. Puede ver qué salones tienen 100% de asistencia y atender cualquier alerta.

### 3. Durante las clases (08:30 AM – 01:45 PM) — *Trabajo Pedagógico*
1. El **Profesor** entra con su cuenta (`/docente`) desde su laptop o tablet.
2. Abre la **Asistencia de Aula** para verificar que todos los alumnos escaneados en la puerta estén en sus asientos.
3. En la sección de **Calificaciones**, registra el progreso de los alumnos en escala de letras (**AD**, **A**, **B**, **C**) y escribe comentarios motivadores.
4. En **Tareas**, publica la actividad para la casa adjuntando indicaciones o lecturas en PDF.

### 4. Por la tarde (02:00 PM – 05:00 PM) — *La Familia en Casa*
1. El **Estudiante** entra a su portal (`/estudiante`) para ver qué tareas le dejaron hoy y subir sus archivos resueltos.
2. El **Apoderado** entra a su portal (`/apoderado`) desde su celular:
   - Confirma que su hijo asistió puntualmente.
   - Si su hijo faltó por salud, llena el formulario de **Justificación de Inasistencia** y adjunta el motivo para que el tutor lo sepa.
   - Revisa la **Libreta de Notas Oficial** y puede imprimirla con un clic.

---

## 📖 4. Guía Paso a Paso para Cada Rol

---

### 👑 ROL 1: ADMINISTRADOR Y DIRECCIÓN
*Para directores, coordinadores académicos y administradores.*

#### 1. Panel de Control y Auditoría (`/admin`)
- Monitorea el porcentaje de asistencia diaria en vivo, capacidad de aforo de los salones y el balance de notas CNEB.
- Observa el ticker en tiempo real con el último estudiante que marcó ingreso.

#### 2. Gestión de Estudiantes y Secciones (`/admin/estudiantes` y `/admin/academico`)
- Modifica datos de contacto, cambia de sección a un estudiante o imprime credenciales individuales.

#### 3. Notas por Salón y Cierre Bimestral (`/admin/notas-salon`)
- Consulta las actas de notas completas de cualquier grado o curso.
- Al terminar el bimestre, haz clic en **"Cerrar Periodo"** para congelar las actas y permitir la emisión de libretas.

---

### 👨‍🏫 ROL 2: DOCENTE / PROFESOR
*Para maestros de aula, profesores de curso y tutores.*

#### 1. Mi Horario y Clases del Día (`/docente` y `/docente/horario`)
- Consulta qué salones te tocan hoy y la distribución de horas de toda la semana.

#### 2. Tomar Asistencia en Salón (`/docente/asistencia`)
- Marca con un toque: 🟢 Presente, 🟡 Tardanza, 🔴 Falta o 🔵 Justificado. Haz clic en **Guardar**.

#### 3. Calificar por Competencias CNEB (`/docente/notas`)
- Selecciona tu curso y califica con **AD**, **A**, **B** o **C**.
- Escribe la conclusión descriptiva con recomendaciones claras para el estudiante.

#### 4. Dejar Tareas y Revisar Entregas (`/docente/tareas`)
- Crea tareas con fecha límite y archivos adjuntos.
- Revisa los trabajos enviados por los alumnos, califícalos y envíales tu retroalimentación.

---

### 🎓 ROL 3: ESTUDIANTE / ALUMNO
*Para los alumnos del colegio.*

#### 1. Mi Carnet QR Digital (`/estudiante/carnet-qr`)
- Muestra este código en la puerta del colegio para registrar tu ingreso en el Kiosco.

#### 2. Mis Tareas y Entregas (`/estudiante/tareas`)
- Revisa las tareas pendientes, descarga los archivos de los profesores y sube tus trabajos resueltos.

#### 3. Mi Libreta de Calificaciones (`/estudiante/libreta-notas`)
- Consulta tus notas bimestrales, tu promedio anual y los comentarios de tus profesores.

---

### 👨‍👩‍👦 ROL 4: APODERADO / PADRE DE FAMILIA
*Para papás, mamás y tutores legales.*

#### 1. Selector Multi-Hijo
- Si tienes varios hijos en el colegio, cambia entre ellos con un solo clic en la parte superior.

#### 2. Monitoreo de Asistencia en Tiempo Real
- Verifica a qué hora exacta ingresó tu hijo hoy y su récord mensual de puntualidad.

#### 3. Justificación de Inasistencias
- Justifica faltas por motivos de salud o emergencia familiar directamente desde tu celular.

#### 4. Ver e Imprimir Libreta Oficial
- Haz clic en **"Ver Libreta Oficial"** para abrir el documento formal con firmas digitales de la dirección y presiona **"Imprimir / Guardar en PDF"**.

#### 5. Contacto con el Tutor
- Consulta el nombre, correo y horario de atención del profesor tutor de tu hijo.

---

### 📷 ROL 5: KIOSCO DE ASISTENCIA QR (PORTERÍA)
*Para el personal de seguridad y auxiliares.*

1. **Abrir la pantalla**: Entra a `/asistencia` y activa la cámara.
2. **Escaneo del Alumno**: El alumno muestra su código frente al lente a 15 cm.
3. **Confirmación**: Pantalla verde y sonido de confirmación para ingreso a tiempo; pantalla ámbar para tardanza.
4. **Ingreso Manual de Emergencia**: Si el alumno no trajo su carnet, escribe su DNI o código escolar en la barra inferior y presiona Enter.

---

## ❓ 5. Preguntas Frecuentes (FAQ)

### ¿Qué pasa si se corta el internet en el colegio?
El sistema cuenta con tecnología **Offline-First**. Sigue funcionando y guardando asistencias en la memoria de la computadora. Al restablecerse la conexión, todo se sincroniza sin perder registros.

### ¿Se puede usar en teléfonos celulares?
Sí. El diseño es 100% adaptable para celulares Android, iPhone, tablets y computadoras.

### ¿Dónde configuro el horario de tardanzas?
Por defecto la hora límite de puntualidad son las **08:00 AM**. Todo escaneo posterior se clasifica automáticamente como tardanza y calcula los minutos exactos de retraso.

---
*ColeSistema Mini — Educación, Tecnología y Seguridad para toda la Comunidad Escolar.*
