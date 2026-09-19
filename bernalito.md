# 📚 Guía Maestra de Configuración y Uso — ColeSistema Mini
**ColeSistema Mini**: Plataforma Integral de Gestión Escolar, Control de Asistencia QR, Calificaciones CNEB, LMS y Branding White-Label.

---

## 🌐 1. Enlaces del Proyecto

- **Producción (Vercel):** [https://cole-sistema-mini.vercel.app](https://cole-sistema-mini.vercel.app)
- **Desarrollo Local:** [http://localhost:3000](http://localhost:3000) *(o `http://localhost:3001` si el puerto 3000 está ocupado)*
- **Repositorio:** [GitHub - ColeSistemaMini](https://github.com/Alessander9/ColeSistemaMini.git)

---

## ⚙️ 2. Guía Básica de Configuración e Instalación

### 2.1. Requisitos Previos
- **Node.js**: v18.17.0 o superior (Recomendado v20.x o v24.x LTS).
- **NPM**: v9.x o superior.
- **Git**: Instalado en el sistema.

### 2.2. Clonación e Instalación
```bash
# 1. Clonar el repositorio
git clone https://github.com/Alessander9/ColeSistemaMini.git
cd ColeSistemaMini

# 2. Instalar dependencias
npm install
```

### 2.3. Variables de Entorno (`.env.local`)
El sistema está diseñado con una arquitectura híbrida resiliente: **funciona de forma 100% autónoma y offline** mediante almacenamiento local persistente (LocalStorage + Mock State), y se sincroniza con proveedores cloud si se configuran las credenciales.

Crea o edita el archivo `.env.local` en la raíz del proyecto:

```env
# ── CONFIGURACIÓN SUPABASE (Opcional para persistencia Cloud) ──
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key-de-supabase
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key

# ── PROVEEDORES DE NOTIFICACIONES Y EMAIL (Opcionales) ──
# Brevo (Envío de alertas de asistencia por Email/WhatsApp)
BREVO_API_KEY=tu_api_key_de_brevo
BREVO_SENDER_EMAIL=asistencia@colegio.edu.pe

# Resend (Envío de reportes y libretas de notas)
RESEND_API_KEY=tu_api_key_de_resend
RESEND_FROM_EMAIL=comunicados@colegio.edu.pe

# ── SEGURIDAD Y JWT ──
JWT_SECRET=super-secure-colegio-secret-token-2026-minedu
```

### 2.4. Comandos Principales
```bash
# Iniciar servidor en modo desarrollo
npm run dev

# Ejecutar suite de pruebas unitarias y de integración
npm run test

# Verificar análisis estático y reglas de código
npm run lint

# Compilar proyecto optimizado para producción
npm run build

# Iniciar servidor de producción local
npm start
```

---

## 🔑 3. Acceso Rápido y Credenciales Demo

En la pantalla de inicio de sesión (`/login`), dispones de **botones de 1 solo clic** para ingresar directamente con cualquier rol sin necesidad de escribir contraseñas. 

Si deseas ingresar manualmente, las credenciales preconfiguradas son:

| Rol | Correo / Usuario | Contraseña | Pantalla Principal |
| :--- | :--- | :--- | :--- |
| 🛡️ **Administrador** | `admin@colegio.edu.pe` | `admin123` | `/admin` |
| 👨‍🏫 **Docente (Tutor)** | `carlos.mendoza@colegio.edu.pe` | `docente123` | `/docente` |
| 👩‍🏫 **Docente (Curso)** | `patricia.garcia@colegio.edu.pe` | `docente123` | `/docente` |
| 🎓 **Estudiante** | `mateo.torres@colegio.edu.pe` (o `74829104`) | `alumno123` | `/estudiante` |
| 👨‍👩‍👦 **Apoderado** | `apoderado@colegio.edu.pe` | `padre123` | `/apoderado` |
| 📷 **Kiosco QR** | *Acceso directo desde navbar o login* | *N/A* | `/asistencia` |

---

## 🎯 4. Guía de Usuario: Flujos y Funciones por Rol

---

### 👑 ROL 1: ADMINISTRADOR (`/admin`)
Tiene el control institucional completo del colegio.

#### 1. Panel de Control y Auditoría (`/admin`)
- **Métricas Reales**: Indicadores de aforo en vivo, tasa de asistencia diaria, desglose de calificaciones CNEB (AD, A, B, C) y resumen por nivel (Inicial, Primaria, Secundaria).
- **Ticker en Vivo**: Registro instantáneo del último estudiante escaneado en el Kiosco QR.

#### 2. Gestión Académica y Estructura (`/admin/academico`)
- **Niveles y Grados**: Configuración de Inicial (3, 4, 5 años), Primaria (1° a 6°) y Secundaria (1° a 5°).
- **Secciones A y B**: Creación y gestión de aulas divididas por turnos y capacidades de aforo.
- **Cursos y Competencias MINEDU**: Malla curricular estándar por competencias CNEB.

#### 3. Estudiantes y Matrículas (`/admin/estudiantes` y `/admin/matriculas`)
- **Registro de Alumnos**: Alta de estudiantes con generación automática de código oficial y DNI.
- **Matrícula Escolar**: Asignación de alumno a grado, sección (A/B) y año académico 2026.
- **Ficha Integral del Alumno**: Historial médico, apoderado, contacto y descarga de fotocheck individual.

#### 4. Gestión de Docentes y Horarios (`/admin/docentes` y `/admin/horarios`)
- **Plana Docente**: Registro de profesores, especialidad y asignación de tutores de aula.
- **Matriz de Horarios**: Diseñador visual semanal de bloques de clases (Lunes a Viernes de 08:00 a 13:45) con detección anti-solapamiento.

#### 5. Notas por Salón y Cierre Bimestral (`/admin/notas-salon`)
- **Matriz de Calificaciones**: Vista global de actas de notas por sección y competencia.
- **Cierre de Bimestre**: Bloqueo y apertura de periodos para evitar alteraciones extemporáneas.

#### 6. Seguridad y Alertas Anti-DDoS (`/admin/alertas`)
- **Monitor de Seguridad**: Registro de peticiones sospechosas, intentos de fuerza bruta, alertas de ausentismo crítico y auditoría de eventos administrativos.

#### 7. Personalización Institucional & White-Label (`/admin/branding`)
- **Identidad Visual**: Nombre del colegio, lema, colores primario/secundario y logotipos oficiales.
- **Diseñador de Carnets QR**: Formato Vertical (credencial porta-fotocheck) u Horizontal (tarjeta PVC), con sello holográfico animado "Matriculado 2026", reglamento al reverso y datos de emergencia.
- **Personalización de Correo y Login**: Integración con Brevo/Resend y pantalla de login customizada.

---

### 👨‍🏫 ROL 2: DOCENTE (`/docente`)
Diseñado para la labor pedagógica en aula y seguimiento de tutoría.

#### 1. Dashboard del Profesor (`/docente`)
- Resumen de clases del día, accesos directos a sus salones a cargo y lista de alumnos en tutoría.

#### 2. Asistencia de Aula (`/docente/asistencia`)
- Registro de asistencia por bloque de clase o día completo (Presente, Tardanza, Falta, Justificado).
- Generación de reportes rápidos de ausentismo del salón.

#### 3. Calificaciones CNEB (`/docente/notas`)
- Registro de notas en escala literal (**AD**, **A**, **B**, **C**) por cada competencia curricular evaluada.
- Campo para **Conclusiones Descriptivas** obligatorias para retroalimentación formativa.

#### 4. Gestión de Tareas y Deberes (`/docente/tareas`)
- **Creación de Tareas**: Título, descripción, fecha/hora límite de entrega, archivos adjuntos y puntaje.
- **Revisión y Calificación**: Bandeja de entregas recibidas de los alumnos con retroalimentación personalizada.

#### 5. Evaluaciones y Exámenes (`/docente/evaluaciones`)
- Programación de prácticas calificadas, exámenes bimestrales o proyectos con temporizador y ponderación.

#### 6. Horario Semanal (`/docente/horario`)
- Visualización de la carga horaria semanal del docente distribuida por salones.

---

### 🎓 ROL 3: ESTUDIANTE (`/estudiante`)
Portal intuitivo y motivador para el alumno.

#### 1. Panel del Alumno (`/estudiante`)
- Saludo personalizado, resumen de asistencia del mes y lista de tareas pendientes.

#### 2. Carnet Escolar QR Digital (`/estudiante/carnet-qr`)
- Código QR personal e intransferible generado en tiempo real.
- Permite acercar el celular o carnet impreso al Kiosco de la entrada del colegio para registrar su ingreso.

#### 3. Mis Asistencias (`/estudiante/asistencias`)
- Historial completo con hora exacta de ingreso, estado (puntual / tardanza) y método utilizado.

#### 4. Libreta de Calificaciones (`/estudiante/libreta-notas`)
- Informe oficial de progreso bimestral y consolidado anual.
- Gráficos de rendimiento por área curricular y conclusiones del docente.

#### 5. Tareas y Evaluaciones (`/estudiante/tareas` y `/estudiante/evaluaciones`)
- Consulta de deberes asignados, descarga de material de clase y botón para subir archivos de respuesta.

#### 6. Mi Horario (`/estudiante/horario`)
- Consulta interactiva del horario de clases diario y semanal.

---

### 👨‍👩‍👦 ROL 4: APODERADO / PADRE DE FAMILIA (`/apoderado`)
Brinda tranquilidad y transparencia total a las familias.

#### 1. Selector Multi-Hijo
- Si el padre tiene varios hijos matriculados, puede alternar entre ellos con un solo clic en la barra superior.

#### 2. Monitoreo de Asistencia en Tiempo Real
- Notificación inmediata del estado de ingreso del día (ej. *Ingreso registrado a las 07:52 AM vía Kiosco QR*).
- Gráfico circular de puntualidad acumulada.

#### 3. Módulo de Justificación de Inasistencias
- Formulario directo para justificar tardanzas o faltas por motivos de salud o fuerza mayor, adjuntando detalles para el tutor.

#### 4. Libreta Oficial Imprimible
- Botón **"Ver Libreta Oficial"**: Abre una ventana modal de alta fidelidad con el formato oficial del MINEDU / SIAGIE, firma digital de la dirección y opción directa de **Imprimir / Guardar en PDF**.

#### 5. Contacto Directo con el Tutor
- Ficha con nombre, foto, correo y horario de atención del docente tutor asignado al salón del estudiante.

---

### 📷 ROL 5: KIOSCO DE ASISTENCIA QR (`/asistencia`)
Pantalla táctil o estación fija ubicada en la portería/entrada del colegio.

1. **Escaneo Ultra Rápido**: Compatible con cámaras web de laptop, cámaras USB industriales y lectores de código de barras QR.
2. **Selector de Cámara y Modo**: Alternancia entre cámara frontal y trasera con selector de resolución.
3. **Validación Instantánea**:
   - ✅ **Ingreso a Tiempo** (Antes de las 08:00 AM): Pantalla verde, felicitación auditiva y lluvia de confetti.
   - ⏰ **Tardanza** (Después de las 08:00 AM): Pantalla ámbar con registro de minutos de retraso.
   - ⚠️ **Doble Marcación**: Detección inteligente para evitar registros duplicados en un lapso menor a 5 minutos.
4. **Pantalla de Bienvenida / Despedida Dinámica (`/bienvenida` y `/despedida`)**: Interfaz visual de confirmación con nombre, foto y grado del estudiante.

---

## 🧪 5. Guía de Prueba Rápida Recomendada (Paso a Paso)

Para experimentar todo el flujo del sistema en menos de 5 minutos, sigue estos pasos:

1. **Ingreso como Administrador**:
   - Ve a `/login` y haz clic en el botón rápido **"Admin"**.
   - Ingresa a `/admin/branding` y cambia el nombre o color institucional para ver cómo se propaga en toda la plataforma.
   - Revisa `/admin/alertas` para ver el log de auditoría del sistema.

2. **Probar el Kiosco QR**:
   - Abre `/asistencia` desde la barra de navegación.
   - Coloca el QR de un estudiante o escribe su código (`EST-2026-0042`) para simular la marcación en vivo.
   - Observa la animación de bienvenida en pantalla.

3. **Ingreso como Docente**:
   - Cierra sesión y entra con el botón rápido **"Docente"** (`carlos.mendoza@colegio.edu.pe`).
   - Ve a `/docente/notas` y califica una competencia con **AD** o **A** agregando una conclusión descriptiva.
   - Ve a `/docente/tareas` y crea una nueva tarea para el salón.

4. **Ingreso como Estudiante**:
   - Entra con el botón rápido **"Estudiante"**.
   - Ve a `/estudiante/carnet-qr` para ver tu credencial digital con sello holográfico.
   - Ve a `/estudiante/libreta-notas` para ver tus notas recién calificadas por el profesor.

5. **Ingreso como Apoderado**:
   - Entra con el botón rápido **"Apoderado"**.
   - Comprueba la asistencia en vivo de tu hijo, abre el modal de **Libreta Oficial** y haz clic en **Imprimir**.
   - Envía una justificación de inasistencia para la fecha de hoy.

---

## 🛡️ 6. Arquitectura y Tecnologías Clave

- **Frontend & Framework:** Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS.
- **Componentes & UI:** Lucide React, Canvas Confetti, HTML5-QRCode, QRCode.react.
- **Generación Documentaria:** jsPDF, html2canvas (Exportación de actas, libretas y credenciales).
- **Backend & Seguridad:** Next.js API Routes, Rate Limiting adaptativo en memoria, Sanitización XSS/Payload Guard, CSRF Tokens, Cookies HttpOnly seguras con SameSite.
- **Despliegue:** Optimizado para Vercel Serverless & Static Site Generation (SSG).

---
*ColeSistema Mini — Sistema de Gestión Escolar Inteligente.*
