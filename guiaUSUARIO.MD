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

## 🛠️ 2. Configuración Previa y Puesta a Punto del Colegio (Paso a Paso)

Antes de iniciar el año escolar o abrir la portería el primer día de clases, la **Dirección / Administración** debe completar esta configuración base. Una vez realizada, todo el sistema funcionará de forma automática y fluida.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                  RUTA DE CONFIGURACIÓN PREVIA (8 PASOS)                       │
├──────────────────────────────────────────────────────────────────────────────┤
│ 1. Identidad ➔ 2. Salones ➔ 3. Cursos ➔ 4. Docentes ➔ 5. Horarios            │
│ ➔ 6. Matrícula Alumnos ➔ 7. Imprimir Carnets ➔ 8. Kiosco en Puerta           │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

### Paso 1: Identidad Institucional y Datos Oficiales (`/admin/branding`)
El primer paso es personalizar el sistema con los datos y colores de tu institución educativa:
1. **Datos Principales**:
   - **Nombre Oficial de la Institución**: Ej. *Colegio Nacional San Agustín*.
   - **Código Modular y UGEL**: Datos oficiales del MINEDU para que aparezcan en las libretas y certificados.
   - **Lema Institucional**: Frase representativa del colegio.
   - **Dirección, Teléfono y Correo Institucional**.
2. **Identidad Visual**:
   - **Logo del Colegio**: Sube la imagen del escudo o insignia oficial.
   - **Firma y Sello de la Dirección**: Sube la imagen de la firma/sello digital para que todas las libretas generadas salgan firmadas automáticamente.
   - **Colores Corporativos**: Elige el color principal (ej. Azul Marino, Granate, Verde Botella). Toda la plataforma se adaptará a esos tonos.

---

### Paso 2: Configuración de Niveles, Grados y Salones (`/admin/academico`)
Define los grados y cuántas aulas funcionarán este año escolar:
1. **Niveles Educativos**:
   - 🧸 **Inicial**: 3 años, 4 años y 5 años.
   - ✏️ **Primaria**: 1° a 6° de Primaria.
   - 🎓 **Secundaria**: 1° a 5° de Secundaria.
2. **Creación de Secciones (Aulas A y B)**:
   - Para cada grado, crea las secciones necesarias (ej. *1° de Secundaria - Sección "A"* y *1° de Secundaria - Sección "B"*).
   - Define el **Aforo Máximo** de cada salón (por defecto 30 o 35 alumnos) para que el sistema controle la capacidad y evite sobrecupos.
   - Asigna el aula física (ej. *Pabellón B - Aula 204*).

---

### Paso 3: Catálogo de Cursos y Competencias MINEDU (`/admin/academico`)
El sistema ya viene pre-cargado con el Currículo Nacional de la Educación Básica (CNEB), pero puedes verificar y ajustar las materias:
1. **Malla Curricular Oficial**:
   - **Matemática** (Resuelve problemas de cantidad, regularidad, forma y gestión de datos).
   - **Comunicación** (Se comunica oralmente, lee diversos tipos de textos, escribe textos).
   - **Ciencia y Tecnología** (Indaga mediante métodos científicos, explica el mundo físico, diseña soluciones tecnológicas).
   - **Personal Social / Ciencias Sociales** (Construye su identidad, convive democráticamente, construye interpretaciones históricas).
   - **Inglés como Lengua Extranjera**.
   - **Arte y Cultura**.
   - **Educación Física**.
   - **Educación Religiosa**.
2. Cada curso cuenta con su color distintivo para que los horarios y libretas sean fáciles de leer para padres y estudiantes.

---

### Paso 4: Plana Docente y Asignación de Tutorías (`/admin/docentes`)
Registra a todos los profesores que enseñarán en el colegio:
1. **Registro de Profesores**:
   - Haz clic en **"+ Nuevo Docente"**.
   - Ingresa: Nombres, Apellidos, DNI, Teléfono y Especialidad (ej. *Licenciado en Matemáticas y Física*).
   - El sistema le generará automáticamente su correo institucional (ej. `carlos.mendoza@colegio.edu.pe`) y su contraseña de acceso.
2. **Designación de Tutores**:
   - Asigna un **Profesor Tutor** a cada salón. El tutor será el responsable del seguimiento conductual, justificaciones médicas y atención directa a los padres de esa aula.
3. **Asignación de Cursos**:
   - Vincula qué materias dictará cada profesor en cada grado y sección.

---

### Paso 5: Armado de la Malla Horaria Semanal (`/admin/horarios`)
Organiza el horario de clases para evitar cruces de profesores o aulas:
1. **Estructura Diaria de 7 Bloques**:
   - **1° Hora**: 08:00 AM – 08:45 AM
   - **2° Hora**: 08:45 AM – 09:30 AM
   - **3° Hora**: 09:30 AM – 10:15 AM
   - 🥪 **RECREO GENERAL**: 10:15 AM – 10:45 AM
   - **4° Hora**: 10:45 AM – 11:30 AM
   - **5° Hora**: 11:30 AM – 12:15 PM
   - **6° Hora**: 12:15 PM – 01:00 PM
   - **7° Hora**: 01:00 PM – 01:45 PM
2. **Diseñador Visual**:
   - Selecciona el salón (ej. *5to Secundaria "A"*).
   - Arrastra cada materia al día y hora correspondiente de Lunes a Viernes.
   - El sistema te avisará con una alerta roja si intentas asignar al mismo profesor en dos salones al mismo tiempo.

---

### Paso 6: Padrón de Estudiantes, Apoderados y Matrícula (`/admin/matriculas`)
Registra a la comunidad de alumnos y formaliza su matrícula:
1. **Ficha del Alumno**:
   - Nombres, Apellidos, DNI y Fecha de Nacimiento.
   - Datos Médicos: Grupo sanguíneo (ej. *O Positivo*), alergias o condiciones especiales.
2. **Datos del Apoderado (Papá / Mamá / Tutor)**:
   - Nombre completo, teléfono celular (para llamadas de emergencia y WhatsApp) y correo electrónico.
   - *Nota*: Un mismo apoderado puede tener 2 o más hijos vinculados y verlos a todos desde una sola cuenta.
3. **Confirmación de Matrícula**:
   - Selecciona el Grado, la Sección (A o B) y el Año Académico (2026).
   - Al confirmar, el sistema le asigna su **Código Oficial de Estudiante** (ej. `EST-2026-0042`) y genera su **Token QR único de Asistencia**.

---

### Paso 7: Emisión e Impresión de Carnets Escolares QR (`/admin/branding` ➔ *Carnets QR*)
Con los alumnos ya matriculados, imprime sus credenciales para el primer día de clases:
1. **Selecciona el Formato de Carnet**:
   - 📱 **Vertical (Credencial con cinta)**: Para micas transparentes colgantes.
   - 💳 **Horizontal (Tarjeta PVC)**: Tamaño billetera.
2. **Elementos del Carnet Oficial**:
   - **Anverso (Frente)**: Foto del estudiante, Nombre completo, Grado y Sección, Código Escolar, Código QR de alta resolución y sello brillante animado *"Matriculado Oficial 2026"*.
   - **Reverso**: Normas de uso del colegio, teléfono de emergencia de la enfermería/tópico y grupo sanguíneo.
3. Haz clic en **"Imprimir Carnets"** o descárgalos en PDF listos para plastificar y entregar a los padres.

---

### Paso 8: Puesta a Punto de la Estación de Portería (`/asistencia`)
1. Coloca una computadora portátil, tablet o monitor táctil en la mesa de ingreso del colegio.
2. Conecta una cámara web o lector de código de barras QR apuntando hacia los alumnos.
3. Abre la dirección `/asistencia` y haz clic en el botón de pantalla completa.
4. **¡Listo!** El colegio está 100% operativo para recibir a los estudiantes.

---

### 📋 Checklist de Verificación para el Primer Día de Clases
Antes de que suene el timbre del primer día, verifica que:
- [x] Los datos y logos del colegio estén actualizados.
- [x] Todas las secciones tengan su profesor tutor asignado.
- [x] Los horarios semanales no tengan cruces de profesores.
- [x] Todos los alumnos tengan su código QR generado y carnet entregado.
- [x] La cámara del Kiosco en la puerta esté enfocada y con buena iluminación.

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
