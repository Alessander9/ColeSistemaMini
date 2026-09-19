# 🏫 Guía de Usuario y Manual de Operaciones — ColeSistema Mini
**Manual Práctico No Técnico para Directores, Docentes, Estudiantes, Apoderados y Personal de Portería.**

---

## 🌟 1. ¿Qué es ColeSistema Mini?

**ColeSistema Mini** es una plataforma digital moderna y sencilla diseñada para gestionar toda la vida diaria del colegio en un solo lugar:
- **Control de Asistencia por Código QR**: Registro rápido en la entrada sin filas ni papel.
- **Libretas y Notas Oficiales CNEB**: Calificaciones con escala de letras (**AD**, **A**, **B**, **C**) y conclusiones descriptivas.
- **Portal para la Familia**: Los padres pueden ver en tiempo real si su hijo llegó al colegio y revisar sus notas desde el celular.
- **Aula Virtual & Tareas**: Los profesores dejan tareas y los alumnos envían sus trabajos por internet.
- **Carnet Escolar Oficial**: Credencial digital con foto, datos de emergencia y código QR personal.

---

## ⏰ 2. El Día a Día Escolar: Flujo Operativo Diario

A continuación se muestra cómo todos los miembros de la comunidad educativa interactúan con el sistema a lo largo de un día escolar típico:

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
1. **En la Puerta del Colegio**: El personal de portería enciende la pantalla del **Kiosco QR** (`/asistencia`).
2. **El Alumno llega**: Muestra su **Carnet Escolar** (impreso o en la pantalla de su celular).
3. **El Kiosco escanea**: En menos de un segundo, la pantalla se ilumina en **verde**, suena un tono agradable, cae una lluvia de confetti y muestra la foto del alumno con el mensaje: *"¡Bienvenido Mateo Torres! Ingreso puntual: 07:48 AM"*.
4. **Alarma de Tardanza**: Si el alumno llega después de las 08:00 AM, la pantalla cambia a color **ámbar** y registra automáticamente los minutos de tardanza.
5. **Notificación al Padre**: En ese mismo instante, el apoderado puede ver en su portal que su hijo ya está dentro del colegio.

### 2. Primera hora de la mañana (08:00 AM – 08:30 AM) — *Revisión de Dirección*
1. El **Director o Administrador** entra a su panel (`/admin`).
2. Ve en su pantalla el medidor de asistencia en tiempo real: cuántos alumnos llegaron, cuántos tienen tardanza y cuántos faltaron.
3. Puede ver qué salones tienen 100% de asistencia y atender cualquier alerta.

### 3. Durante las clases (08:30 AM – 01:45 PM) — *Trabajo Pedagógico*
1. El **Profesor** entra con su cuenta (`/docente`) desde su laptop o tablet.
2. Abre la **Asistencia de Aula** para verificar que todos los alumnos escaneados en la puerta estén sentados en su salón.
3. En la sección de **Calificaciones**, registra el progreso de los alumnos en escala de letras (**AD**, **A**, **B**, **C**) y escribe comentarios motivadores.
4. En **Tareas**, publica la actividad para la casa adjuntando indicaciones o lecturas en PDF.

### 4. Por la tarde (02:00 PM – 05:00 PM) — *La Familia en Casa*
1. El **Estudiante** entra a su portal (`/estudiante`) para ver qué tareas le dejaron hoy y subir sus archivos resueltos.
2. El **Apoderado** entra a su portal (`/apoderado`) desde su celular:
   - Confirma que su hijo asistió puntualmente.
   - Si su hijo no pudo asistir por motivos de salud, llena el formulario de **Justificación de Inasistencia** y adjunta el motivo para que el tutor lo sepa.
   - Revisa la **Libreta de Notas Oficial** y puede imprimirla con un clic.

---

## 📖 3. Guía Paso a Paso para Cada Rol

---

### 👑 ROL 1: ADMINISTRADOR Y DIRECCIÓN
*Para directores, coordinadores académicos y administradores.*

```
   [1. Personalizar] ➔ [2. Matricular] ➔ [3. Asignar Profesores] ➔ [4. Imprimir Carnets] ➔ [5. Supervisar]
```

#### Paso 1: Personalizar la Imagen de tu Colegio
1. Ingresa a la barra lateral y haz clic en **"Personalización / Branding"** (`/admin/branding`).
2. Escribe el **Nombre Oficial** de tu institución (ej. *Colegio San Agustín*), el lema y los datos de contacto.
3. Sube el **Logo del Colegio** y la **Firma Digital de la Dirección**.
4. Elige los **Colores Institucionales** (el sistema cambiará automáticamente el diseño para que coincida con tu colegio).

#### Paso 2: Crear Salones y Matricular Estudiantes
1. Ve a **"Estructura Académica"** (`/admin/academico`) para ver tus grados en Inicial, Primaria y Secundaria.
2. Si un salón tiene muchos alumnos, puedes habilitar fácilmente las **Secciones A y B**.
3. Entra a **"Matrículas"** (`/admin/matriculas`), haz clic en **"Nueva Matrícula"**, selecciona al estudiante, su grado y salón. El sistema le generará automáticamente su código único escolar.

#### Paso 3: Asignar Profesores y Horarios
1. En **"Docentes"** (`/admin/docentes`), registra a los maestros, sus correos y teléfonos.
2. Designa quién será el **Tutor** principal de cada salón.
3. En **"Horarios"** (`/admin/horarios`), arrastra los cursos a la cuadrícula semanal (de Lunes a Viernes) para armar el horario escolar.

#### Paso 4: Generar e Imprimir los Carnets Escolares QR
1. Entra a **"Branding"** y abre la pestaña **"Carnets QR"**.
2. Elige el formato que prefieras:
   - 📱 **Vertical**: Ideal para micas de fotocheck con cinta colgante.
   - 💳 **Horizontal**: Estilo tarjeta PVC para llevar en la billetera.
3. El carnet incluye foto, datos de emergencia, grupo sanguíneo, código QR y el sello brillante *"Matriculado 2026"*.
4. Haz clic en **Imprimir Todos los Carnets** para entregárselos a los padres al inicio del año.

#### Paso 5: Supervisar Notas y Cerrar Bimestres
1. Entra a **"Notas por Salón"** (`/admin/notas-salon`).
2. Selecciona cualquier grado para ver las actas completas de calificaciones.
3. Al finalizar cada periodo (1°, 2°, 3° o 4° Bimestre), haz clic en **"Cerrar Bimestre"** para proteger las notas y dejarlas listas para el reporte a los padres.

---

### 👨‍🏫 ROL 2: DOCENTE / PROFESOR
*Para maestros de aula, profesores de curso y tutores.*

```
   [1. Mi Horario] ➔ [2. Asistencia en Aula] ➔ [3. Calificar CNEB] ➔ [4. Dejar Tareas] ➔ [5. Exámenes]
```

#### Paso 1: Conocer mi Horario y Mis Salones
1. Al iniciar sesión en `/docente`, verás tu **Panel Principal** con los cursos que te tocan dictar el día de hoy.
2. En **"Mi Horario"** (`/docente/horario`), consulta la distribución de todas tus clases de la semana.

#### Paso 2: Tomar Asistencia en el Salón
1. Haz clic en **"Asistencia"** (`/docente/asistencia`).
2. Selecciona tu salón y fecha de hoy.
3. Verás la lista de alumnos con un botón de estado para cada uno:
   - 🟢 **Presente**: Alumno en clase.
   - 🟡 **Tardanza**: Alumno ingresó tarde al aula.
   - 🔴 **Falta**: Alumno ausente.
   - 🔵 **Justificado**: Alumno con permiso médico validado.
4. Haz clic en **"Guardar Asistencia"**.

#### Paso 3: Calificar Notas por Competencias (CNEB)
1. Ve a **"Registro de Notas"** (`/docente/notas`).
2. Selecciona tu curso (ej. *Matemática*) y el Bimestre actual.
3. Elige la letra correspondiente para cada alumno:
   - **AD**: Logro Destacado (superó lo esperado).
   - **A**: Logro Esperado (alcanzó el nivel).
   - **B**: En Proceso (requiere acompañamiento).
   - **C**: En Inicio (dificultades significativas).
4. Escribe la **Conclusión Descriptiva** en el casillero para explicarle al estudiante y a sus padres qué aspectos debe reforzar.

#### Paso 4: Dejar Tareas y Calificar Entregas
1. Ve a **"Tareas"** (`/docente/tareas`) y haz clic en **"+ Crear Nueva Tarea"**.
2. Escribe el título, instrucciones, fecha máxima de entrega y adjunta materiales si es necesario.
3. Cuando los alumnos suban sus trabajos, entra a la tarea para ver la lista de entregas, calificar con un clic y escribirles una felicitación o sugerencia.

---

### 🎓 ROL 3: ESTUDIANTE / ALUMNO
*Para los alumnos del colegio.*

```
   [1. Mi Carnet QR] ➔ [2. Mis Tareas] ➔ [3. Mis Calificaciones] ➔ [4. Mis Asistencias]
```

#### Paso 1: Usar mi Carnet QR para Entrar al Colegio
1. Entra a tu cuenta en `/estudiante` y abre **"Mi Carnet QR"** (`/estudiante/carnet-qr`).
2. Puedes guardar la imagen en tu teléfono o llevar tu fotocheck impreso.
3. Al llegar a la puerta del colegio, muéstralo frente a la cámara del Kiosco para registrar tu ingreso.

#### Paso 2: Ver mis Tareas y Enviar Mis Trabajos
1. Entra a **"Tareas"** (`/estudiante/tareas`).
2. Verás dos pestañas: **Pendientes** y **Entregadas**.
3. Haz clic en una tarea para leer las indicaciones del profesor, haz clic en **"Subir Archivo / Entregar"**, selecciona tu documento o foto de tu cuaderno y confirma el envío.

#### Paso 3: Revisar mi Libreta de Notas
1. Entra a **"Libreta de Notas"** (`/estudiante/libreta-notas`).
2. Podrás ver tus notas por cada materia, tus promedios en letras (**AD, A, B, C**) y los comentarios que tus profesores escribieron para ti.

#### Paso 4: Ver mis Asistencias y Horario
1. En **"Asistencias"** puedes ver a qué hora exacta marcaste tu ingreso cada día del mes.
2. En **"Horario"** consulta qué cursos te tocan mañana y qué materiales debes alistar en tu mochila.

---

### 👨‍👩‍👦 ROL 4: APODERADO / PADRE DE FAMILIA
*Para papás, mamás y tutores legales.*

```
   [1. Elegir Hijo] ➔ [2. Ver Asistencia en Vivo] ➔ [3. Justificar Falta] ➔ [4. Ver Libreta Oficial]
```

#### Paso 1: Cambiar entre mis Hijos
1. Ingresa a `/apoderado`.
2. Si tienes más de un hijo en el colegio, en la parte superior verás las tarjetas con sus nombres y fotos. Haz clic sobre el hijo que deseas consultar.

#### Paso 2: Saber si mi Hijo ya está en el Colegio
1. En la pantalla principal verás el indicador **"Asistencia de Hoy"**:
   - Si ya ingresó, verás la hora exacta (ej. *Marcó ingreso a las 07:49 AM en Kiosco QR*).
   - Verás también el porcentaje de puntualidad del mes.

#### Paso 3: Justificar una Falta o Tardanza por Salud
1. Si tu hijo se enfermó o tiene cita médica, haz clic en el botón **"Justificar Inasistencia"**.
2. Selecciona la fecha, el motivo (Salud, Cita Médica, Emergencia Familiar) y escribe una breve explicación.
3. Al enviar, el profesor tutor y la dirección recibirán la justificación inmediatamente.

#### Paso 4: Ver, Descargar e Imprimir la Libreta Oficial
1. En la sección de notas, haz clic en el botón azul **"Ver Libreta Oficial"**.
2. Se abrirá el documento con el formato oficial del colegio, firmas digitales de la dirección y sello legal.
3. Haz clic en el botón **"Imprimir"** para imprimirla directamente en papel o guardarla en formato **PDF** en tu computadora o teléfono.

#### Paso 5: Contactar al Tutor de Salón
1. En la parte inferior derecha de tu pantalla verás la **Ficha del Tutor**: nombre del profesor a cargo del salón, correo electrónico y horario de atención para padres.

---

### 📷 ROL 5: KIOSCO DE ASISTENCIA QR (PORTERÍA)
*Para el personal de seguridad, portería y auxiliares de entrada.*

```
   [1. Abrir Kiosco] ➔ [2. Apuntar Cámara] ➔ [3. Alumno Escanea] ➔ [4. Pantalla Verde/Ámbar]
```

#### Paso 1: Poner la Pantalla en Modo Kiosco
1. Abre el navegador y entra a la dirección `/asistencia`.
2. Haz clic en el botón de pantalla completa si lo deseas.
3. Asegúrate de que la cámara esté encendida (puedes alternar entre cámara frontal o trasera con un botón en pantalla).

#### Paso 2: Escanear al Alumno
1. El alumno sostiene su fotocheck o celular frente a la cámara a unos 15 centímetros de distancia.
2. El sistema lee el código al instante:
   - ✅ **Ingreso Puntual**: Suena tono de éxito, se reproduce animación verde con confetti y muestra nombre, foto y salón del alumno.
   - ⏰ **Tardanza**: Si ya pasaron las 08:00 AM, la pantalla se muestra en color ámbar y registra la tardanza.
   - ⚠️ **Doble Marcación**: Si un alumno intenta pasar dos veces seguidas en menos de 5 minutos, el sistema le avisa que ya fue registrado para evitar duplicados.

#### Paso 3: ¿Qué hacer si el alumno olvidó su carnet?
1. En la parte inferior de la pantalla del Kiosco hay una casilla de **"Ingreso Manual por DNI o Código"**.
2. Escribe el DNI o código del estudiante (ej. `EST-2026-0042`) y presiona Enter para registrar su ingreso normalmente.

---

## ❓ 4. Preguntas Frecuentes (FAQ)

### ¿Qué pasa si se corta el internet en el colegio?
El sistema cuenta con tecnología **Offline-First**. Puede seguir funcionando y registrando datos en la memoria local de la computadora. Cuando regrese el internet, los datos se sincronizan sin perder nada.

### ¿Puedo abrir el sistema desde mi teléfono celular?
Sí. Toda la plataforma está optimizada para verse perfectamente en celulares Android, iPhone, tablets y computadoras de escritorio.

### ¿Cómo cambio mi contraseña o foto de perfil?
Haz clic en tu nombre o foto en la esquina superior derecha de cualquier pantalla y selecciona **"Mi Perfil"**. Allí podrás actualizar tu información y contraseña.

---
*ColeSistema Mini — Educación, Tecnología y Seguridad para toda la Comunidad Escolar.*
