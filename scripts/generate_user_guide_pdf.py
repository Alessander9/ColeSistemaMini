import os
import sys
import time
import base64
import json
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SCREENSHOTS_DIR = os.path.join(BASE_DIR, "docs", "screenshots")
os.makedirs(SCREENSHOTS_DIR, exist_ok=True)

BASE_URL = "https://cole-sistema-mini.vercel.app"

def capture_screenshots():
    print(f"[1/3] Iniciando navegador Chrome Headless para capturar pantallas desde {BASE_URL}...")
    chrome_options = Options()
    chrome_options.add_argument("--headless=new")
    chrome_options.add_argument("--window-size=1440,960")
    chrome_options.add_argument("--disable-gpu")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_argument("--hide-scrollbars")
    chrome_options.add_argument("--force-device-scale-factor=1.25")
    
    driver = webdriver.Chrome(options=chrome_options)
    driver.implicitly_wait(6)

    def set_auth(role, user_id, nombres, apellidos, email):
        driver.execute_script(f"""
            const user = {{
                id: '{user_id}',
                email: '{email}',
                nombres: '{nombres}',
                apellidos: '{apellidos}',
                rol: '{role}',
                activo: true
            }};
            localStorage.setItem('colegio_current_user', JSON.stringify(user));
            document.cookie = 'cole_user_role={role}; path=/; max-age=604800; SameSite=Lax';
            document.cookie = 'cole_access_token=jwt-active-session; path=/; max-age=604800; SameSite=Lax';
        """)

    screenshots = {}

    try:
        # 1. Login
        print("  -> Capturando Login...")
        driver.get(f"{BASE_URL}/login")
        time.sleep(2.5)
        path = os.path.join(SCREENSHOTS_DIR, "01_login.png")
        driver.save_screenshot(path)
        screenshots["login"] = path

        # 2. Admin Dashboard
        print("  -> Capturando Admin Dashboard...")
        set_auth('admin', 'user-admin', 'Administrador', 'General', 'admin@colegio.edu.pe')
        driver.get(f"{BASE_URL}/admin")
        time.sleep(2.5)
        path = os.path.join(SCREENSHOTS_DIR, "02_admin_dashboard.png")
        driver.save_screenshot(path)
        screenshots["admin_dashboard"] = path

        # 3. Admin Branding & Carnets
        print("  -> Capturando Branding & Carnets QR...")
        driver.get(f"{BASE_URL}/admin/branding")
        time.sleep(2.5)
        path = os.path.join(SCREENSHOTS_DIR, "03_admin_branding.png")
        driver.save_screenshot(path)
        screenshots["admin_branding"] = path

        # 4. Estructura Academica & Salones
        print("  -> Capturando Estructura Académica...")
        driver.get(f"{BASE_URL}/admin/academico")
        time.sleep(2.5)
        path = os.path.join(SCREENSHOTS_DIR, "04_admin_academico.png")
        driver.save_screenshot(path)
        screenshots["admin_academico"] = path

        # 5. Horarios Semanales
        print("  -> Capturando Horarios...")
        driver.get(f"{BASE_URL}/admin/horarios")
        time.sleep(2.5)
        path = os.path.join(SCREENSHOTS_DIR, "05_admin_horarios.png")
        driver.save_screenshot(path)
        screenshots["admin_horarios"] = path

        # 6. Docente - Asistencia y Notas
        print("  -> Capturando Docente Notas...")
        set_auth('docente', 'user-docente-1', 'Carlos', 'Mendoza', 'carlos.mendoza@colegio.edu.pe')
        driver.get(f"{BASE_URL}/docente/notas")
        time.sleep(2.5)
        path = os.path.join(SCREENSHOTS_DIR, "06_docente_notas.png")
        driver.save_screenshot(path)
        screenshots["docente_notas"] = path

        # 7. Docente - Tareas
        print("  -> Capturando Docente Tareas...")
        driver.get(f"{BASE_URL}/docente/tareas")
        time.sleep(2.5)
        path = os.path.join(SCREENSHOTS_DIR, "07_docente_tareas.png")
        driver.save_screenshot(path)
        screenshots["docente_tareas"] = path

        # 8. Estudiante - Carnet QR
        print("  -> Capturando Estudiante Carnet QR...")
        set_auth('estudiante', 'user-estudiante-1', 'Mateo', 'Torres', 'mateo.torres@colegio.edu.pe')
        driver.get(f"{BASE_URL}/estudiante/carnet-qr")
        time.sleep(2.5)
        path = os.path.join(SCREENSHOTS_DIR, "08_estudiante_carnet.png")
        driver.save_screenshot(path)
        screenshots["estudiante_carnet"] = path

        # 9. Estudiante - Libreta de Notas
        print("  -> Capturando Libreta de Notas...")
        driver.get(f"{BASE_URL}/estudiante/libreta-notas")
        time.sleep(2.5)
        path = os.path.join(SCREENSHOTS_DIR, "09_estudiante_libreta.png")
        driver.save_screenshot(path)
        screenshots["estudiante_libreta"] = path

        # 10. Apoderado Dashboard
        print("  -> Capturando Portal Apoderado...")
        set_auth('apoderado', 'user-apoderado-1', 'Héctor', 'Vargas', 'apoderado@colegio.edu.pe')
        driver.get(f"{BASE_URL}/apoderado")
        time.sleep(2.5)
        path = os.path.join(SCREENSHOTS_DIR, "10_apoderado.png")
        driver.save_screenshot(path)
        screenshots["apoderado"] = path

        # 11. Kiosco QR
        print("  -> Capturando Kiosco QR...")
        driver.get(f"{BASE_URL}/asistencia")
        time.sleep(2.5)
        path = os.path.join(SCREENSHOTS_DIR, "11_kiosco_asistencia.png")
        driver.save_screenshot(path)
        screenshots["kiosco"] = path

    finally:
        driver.quit()

    print(f"[✓] {len(screenshots)} capturas obtenidas con éxito.")
    return screenshots

def to_base64(img_path):
    if os.path.exists(img_path):
        with open(img_path, "rb") as f:
            return "data:image/png;base64," + base64.b64encode(f.read()).decode("utf-8")
    return ""

def generate_pdf():
    screenshots = capture_screenshots()

    print("[2/3] Generando plantilla HTML para PDF...")
    img_login = to_base64(screenshots.get("login", ""))
    img_admin = to_base64(screenshots.get("admin_dashboard", ""))
    img_branding = to_base64(screenshots.get("admin_branding", ""))
    img_academico = to_base64(screenshots.get("admin_academico", ""))
    img_horarios = to_base64(screenshots.get("admin_horarios", ""))
    img_doc_notas = to_base64(screenshots.get("docente_notas", ""))
    img_doc_tareas = to_base64(screenshots.get("docente_tareas", ""))
    img_est_carnet = to_base64(screenshots.get("estudiante_carnet", ""))
    img_est_libreta = to_base64(screenshots.get("estudiante_libreta", ""))
    img_apoderado = to_base64(screenshots.get("apoderado", ""))
    img_kiosco = to_base64(screenshots.get("kiosco", ""))

    html_content = f"""<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Guía de Usuario — ColeSistema Mini</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap');

  @page {{
    size: A4 portrait;
    margin: 18mm 14mm 18mm 14mm;
    @top-right {{
      content: "ColeSistema Mini — Guía Oficial";
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 8pt;
      color: #94a3b8;
    }}
    @bottom-center {{
      content: "Página " counter(page) " de " counter(pages);
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 8pt;
      color: #94a3b8;
    }}
  }}

  * {{
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }}

  body {{
    font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    color: #1e293b;
    background: #ffffff;
    line-height: 1.55;
    font-size: 9.5pt;
  }}

  .page-break {{
    page-break-before: always;
  }}

  .no-break {{
    page-break-inside: avoid;
  }}

  /* PORTADA */
  .cover {{
    height: 100%;
    min-height: 250mm;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 20mm 10mm 15mm 10mm;
    background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #312e81 100%);
    color: #ffffff;
    border-radius: 12px;
    margin-bottom: 20mm;
    page-break-after: always;
  }}

  .cover-badge {{
    display: inline-block;
    background: rgba(99, 102, 241, 0.3);
    border: 1px solid rgba(165, 180, 252, 0.4);
    padding: 6px 14px;
    border-radius: 999px;
    font-size: 9pt;
    font-weight: 700;
    letter-spacing: 1px;
    text-transform: uppercase;
    color: #c7d2fe;
    width: fit-content;
  }}

  .cover-title {{
    font-size: 26pt;
    font-weight: 800;
    line-height: 1.2;
    margin-top: 15px;
    color: #ffffff;
  }}

  .cover-subtitle {{
    font-size: 13pt;
    font-weight: 400;
    color: #cbd5e1;
    margin-top: 12px;
    max-width: 90%;
    line-height: 1.4;
  }}

  .cover-features {{
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin: 25px 0;
  }}

  .cover-feature-card {{
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.12);
    padding: 12px 14px;
    border-radius: 10px;
    font-size: 9pt;
  }}

  .cover-feature-card strong {{
    display: block;
    color: #38bdf8;
    font-size: 9.5pt;
    margin-bottom: 3px;
  }}

  .cover-footer {{
    border-top: 1px solid rgba(255, 255, 255, 0.15);
    padding-top: 15px;
    display: flex;
    justify-content: space-between;
    font-size: 8.5pt;
    color: #94a3b8;
  }}

  /* ENCABEZADOS Y SECCIONES */
  h1 {{
    font-size: 18pt;
    font-weight: 800;
    color: #0f172a;
    border-bottom: 2.5px solid #4f46e5;
    padding-bottom: 6px;
    margin-top: 20px;
    margin-bottom: 14px;
    display: flex;
    align-items: center;
    gap: 8px;
  }}

  h2 {{
    font-size: 13pt;
    font-weight: 700;
    color: #1e1b4b;
    margin-top: 16px;
    margin-bottom: 8px;
  }}

  h3 {{
    font-size: 11pt;
    font-weight: 700;
    color: #334155;
    margin-top: 12px;
    margin-bottom: 6px;
  }}

  p {{
    margin-bottom: 8px;
    color: #334155;
  }}

  /* TARJETAS Y CALLOUTS */
  .callout {{
    padding: 10px 14px;
    border-radius: 8px;
    margin: 10px 0;
    font-size: 9pt;
  }}

  .callout-info {{
    background: #eef2ff;
    border-left: 4px solid #4f46e5;
    color: #312e81;
  }}

  .callout-success {{
    background: #ecfdf5;
    border-left: 4px solid #10b981;
    color: #065f46;
  }}

  .callout-warning {{
    background: #fffbeb;
    border-left: 4px solid #f59e0b;
    color: #92400e;
  }}

  /* TABLAS */
  table {{
    width: 100%;
    border-collapse: collapse;
    margin: 12px 0;
    font-size: 8.5pt;
  }}

  th {{
    background: #f1f5f9;
    color: #0f172a;
    text-align: left;
    padding: 8px 10px;
    font-weight: 700;
    border-bottom: 2px solid #cbd5e1;
  }}

  td {{
    padding: 7px 10px;
    border-bottom: 1px solid #e2e8f0;
    color: #334155;
  }}

  tr:nth-child(even) {{
    background: #f8fafc;
  }}

  /* CAPTURAS DE PANTALLA */
  .screenshot-container {{
    margin: 12px 0 16px 0;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    background: #f8fafc;
    page-break-inside: avoid;
  }}

  .screenshot-header {{
    background: #e2e8f0;
    padding: 5px 12px;
    font-size: 7.5pt;
    font-weight: 700;
    color: #475569;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid #cbd5e1;
  }}

  .screenshot-img {{
    width: 100%;
    height: auto;
    display: block;
  }}

  .screenshot-caption {{
    padding: 6px 12px;
    font-size: 8pt;
    color: #64748b;
    font-style: italic;
    background: #ffffff;
    border-top: 1px solid #e2e8f0;
  }}

  /* PASOS NUMERADOS */
  .step-box {{
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 10px 14px;
    margin-bottom: 10px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.03);
  }}

  .step-title {{
    font-size: 10pt;
    font-weight: 700;
    color: #1e1b4b;
    margin-bottom: 4px;
    display: flex;
    align-items: center;
    gap: 6px;
  }}

  .badge-step {{
    background: #4f46e5;
    color: #ffffff;
    font-size: 7.5pt;
    padding: 2px 7px;
    border-radius: 999px;
    font-weight: 800;
  }}

  ul, ol {{
    margin-left: 18px;
    margin-bottom: 8px;
  }}

  li {{
    margin-bottom: 3px;
  }}
</style>
</head>
<body>

<!-- ═══════════════════════════════════════════════════════════════ -->
<!-- PORTADA DEL DOCUMENTO                                          -->
<!-- ═══════════════════════════════════════════════════════════════ -->
<div class="cover">
  <div>
    <div class="cover-badge">ColeSistema Mini • Versión Oficial 2026</div>
    <h1 class="cover-title">Manual Integral y Guía de Operaciones Escolar</h1>
    <p class="cover-subtitle">
      Guía práctica no técnica para la configuración institucional, control de asistencia QR en portería, calificaciones CNEB, aula virtual LMS y portal para familias.
    </p>

    <div class="cover-features">
      <div class="cover-feature-card">
        <strong>🛡️ Gestión de Dirección</strong>
        Control institucional, aforo en vivo, actas de notas y personalización White-Label.
      </div>
      <div class="cover-feature-card">
        <strong>👨‍🏫 Trabajo Pedagógico</strong>
        Asistencia por salón, escalas CNEB (AD/A/B/C), tareas y evaluaciones.
      </div>
      <div class="cover-feature-card">
        <strong>👨‍👩‍👦 Portal para Apoderados</strong>
        Seguimiento de ingreso en tiempo real, libretas oficiales en PDF y justificación médica.
      </div>
      <div class="cover-feature-card">
        <strong>📷 Kiosco QR en Puerta</strong>
        Escaneo ultrarrápido sin filas, lluvia de confetti y detección automática de tardanzas.
      </div>
    </div>
  </div>

  <div class="cover-footer">
    <div><strong>Colegio:</strong> Sistema Escolar Inteligente</div>
    <div><strong>Año Lectivo:</strong> 2026</div>
    <div><strong>Plataforma:</strong> cole-sistema-mini.vercel.app</div>
  </div>
</div>

<!-- ═══════════════════════════════════════════════════════════════ -->
<!-- SECCIÓN 1: INTRODUCCIÓN Y ACCESO RÁPIDO                        -->
<!-- ═══════════════════════════════════════════════════════════════ -->
<h1>🌟 1. Introducción y Acceso al Sistema</h1>
<p>
  <strong>ColeSistema Mini</strong> es una plataforma integral diseñada para simplificar la administración del colegio, modernizar el control de asistencia y acercar a las familias con la vida académica de sus hijos en tiempo real.
</p>

<div class="callout callout-info">
  <strong>💡 Acceso Rápido con 1 Clic:</strong> En la pantalla de inicio de sesión (<span style="font-family: monospace;">/login</span>), encontrarás botones directos para ingresar con cualquier rol demo sin necesidad de escribir contraseñas.
</div>

<div class="screenshot-container">
  <div class="screenshot-header">
    <span>PANTALLA DE INICIO DE SESIÓN (/login)</span>
    <span>SISTEMA DE ACCESO RÁPIDO</span>
  </div>
  <img class="screenshot-img" src="{img_login}" alt="Pantalla de Login" />
  <div class="screenshot-caption">
    Figura 1.1: Pantalla de inicio de sesión con selector de roles interactivo (Admin, Docente, Estudiante, Apoderado).
  </div>
</div>

<table>
  <thead>
    <tr>
      <th>Rol</th>
      <th>Usuario / Correo</th>
      <th>Contraseña</th>
      <th>Pantalla Principal</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>👑 Administrador</strong></td>
      <td>admin@colegio.edu.pe</td>
      <td>admin123</td>
      <td>/admin</td>
    </tr>
    <tr>
      <td><strong>👨‍🏫 Docente (Tutor)</strong></td>
      <td>carlos.mendoza@colegio.edu.pe</td>
      <td>docente123</td>
      <td>/docente</td>
    </tr>
    <tr>
      <td><strong>🎓 Estudiante</strong></td>
      <td>mateo.torres@colegio.edu.pe</td>
      <td>alumno123</td>
      <td>/estudiante</td>
    </tr>
    <tr>
      <td><strong>👨‍👩‍👦 Apoderado</strong></td>
      <td>apoderado@colegio.edu.pe</td>
      <td>padre123</td>
      <td>/apoderado</td>
    </tr>
    <tr>
      <td><strong>📷 Kiosco QR</strong></td>
      <td><em>Acceso directo</em></td>
      <td><em>N/A</em></td>
      <td>/asistencia</td>
    </tr>
  </tbody>
</table>

<!-- ═══════════════════════════════════════════════════════════════ -->
<!-- SECCIÓN 2: CONFIGURACIÓN PREVIA Y PUESTA A PUNTO               -->
<!-- ═══════════════════════════════════════════════════════════════ -->
<div class="page-break"></div>
<h1>🛠️ 2. Configuración Previa: Puesta a Punto (8 Pasos)</h1>
<p>
  Antes de iniciar el año escolar o abrir las puertas el primer día, la Dirección debe completar la siguiente ruta de 8 pasos para dejar el sistema 100% operativo:
</p>

<div class="step-box">
  <div class="step-title"><span class="badge-step">PASO 1</span> Identidad Institucional y Branding (/admin/branding)</div>
  <p>Configura el nombre del colegio, código modular, UGEL, lema, colores institucionales y sube el logo oficial y la firma digital de la Dirección para los documentos legales.</p>
</div>

<div class="screenshot-container">
  <div class="screenshot-header">
    <span>MÓDULO DE BRANDING INSTITUCIONAL (/admin/branding)</span>
    <span>PERSONALIZACIÓN TOTAL</span>
  </div>
  <img class="screenshot-img" src="{img_branding}" alt="Personalización de Branding" />
  <div class="screenshot-caption">
    Figura 2.1: Diseñador de identidad visual, carnet escolar PVC y firma digital de la dirección.
  </div>
</div>

<div class="step-box">
  <div class="step-title"><span class="badge-step">PASO 2</span> Estructura de Niveles y Salones (/admin/academico)</div>
  <p>Habilita los grados en Inicial (3, 4, 5 años), Primaria (1° a 6°) y Secundaria (1° a 5°). Crea las <strong>Secciones A y B</strong> con su límite de aforo (ej. 30 alumnos).</p>
</div>

<div class="screenshot-container">
  <div class="screenshot-header">
    <span>ESTRUCTURA ACADÉMICA (/admin/academico)</span>
    <span>GRADOS Y SECCIONES</span>
  </div>
  <img class="screenshot-img" src="{img_academico}" alt="Estructura Académica" />
  <div class="screenshot-caption">
    Figura 2.2: Organización de niveles educativos, grados y secciones A/B con control de capacidad.
  </div>
</div>

<div class="step-box">
  <div class="step-title"><span class="badge-step">PASO 3</span> Malla de Cursos y Competencias MINEDU</div>
  <p>Verifica las materias curriculares (Matemática, Comunicación, Ciencia, Personal Social, Inglés, etc.) y sus competencias oficiales CNEB precargadas.</p>
</div>

<div class="step-box">
  <div class="step-title"><span class="badge-step">PASO 4</span> Plana Docente y Asignación de Tutorías (/admin/docentes)</div>
  <p>Registra a los profesores con sus datos de contacto y designa al <strong>Tutor de Salón</strong> responsable de cada aula.</p>
</div>

<div class="step-box">
  <div class="step-title"><span class="badge-step">PASO 5</span> Malla Horaria Semanal (/admin/horarios)</div>
  <p>Distribuye las materias en los 7 bloques horarios diarios (08:00 AM a 01:45 PM). El sistema cuenta con detección inteligente anti-cruces de profesores.</p>
</div>

<div class="screenshot-container">
  <div class="screenshot-header">
    <span>MATRIZ DE HORARIOS SEMANALES (/admin/horarios)</span>
    <span>DISTRIBUCIÓN DE CLASES</span>
  </div>
  <img class="screenshot-img" src="{img_horarios}" alt="Matriz de Horarios" />
  <div class="screenshot-caption">
    Figura 2.3: Diseñador visual de horarios de Lunes a Viernes con bloques de 45 minutos y recreo.
  </div>
</div>

<div class="step-box">
  <div class="step-title"><span class="badge-step">PASO 6</span> Padrón de Estudiantes y Matrícula (/admin/matriculas)</div>
  <p>Registra al estudiante con su DNI, datos médicos y apoderado. Al matricularlo en su sección, el sistema le generará su <strong>Código Oficial</strong> y <strong>Token QR</strong>.</p>
</div>

<div class="step-box">
  <div class="step-title"><span class="badge-step">PASO 7</span> Emisión e Impresión de Carnets QR</div>
  <p>Imprime los fotochecks en formato Vertical (con cinta) u Horizontal (tarjeta PVC). Cada carnet incluye foto, código QR, sello <em>"Matriculado 2026"</em> y datos de emergencia.</p>
</div>

<div class="step-box">
  <div class="step-title"><span class="badge-step">PASO 8</span> Puesta a Punto del Kiosco en Portería (/asistencia)</div>
  <p>Enciende la computadora o tablet de la puerta, apunta la cámara web hacia los alumnos y abre el Kiosco en pantalla completa.</p>
</div>

<!-- ═══════════════════════════════════════════════════════════════ -->
<!-- SECCIÓN 3: FLUJO OPERATIVO DIARIO                              -->
<!-- ═══════════════════════════════════════════════════════════════ -->
<div class="page-break"></div>
<h1>⏰ 3. Cronograma del Flujo Operativo Diario</h1>
<p>
  El siguiente cronograma describe la interacción continua de la comunidad educativa desde la primera hora de la mañana hasta el cierre de la jornada:
</p>

<table>
  <thead>
    <tr>
      <th style="width: 25%;">Horario</th>
      <th style="width: 25%;">Actor Principal</th>
      <th style="width: 50%;">Acción y Flujo en el Sistema</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>07:00 - 08:00 AM</strong></td>
      <td>🚪 Portería & Alumnos</td>
      <td>
        <strong>Llegada y Escaneo en Kiosco:</strong> Los alumnos muestran su carnet QR. Pantalla verde y confetti para ingresos puntuales; pantalla ámbar con registro de minutos para tardanzas.
      </td>
    </tr>
    <tr>
      <td><strong>08:00 - 08:30 AM</strong></td>
      <td>🛡️ Dirección</td>
      <td>
        <strong>Auditoría en Vivo:</strong> El director revisa en su dashboard el porcentaje de asistencia, aforo en tiempo real y lista de inasistencias del día.
      </td>
    </tr>
    <tr>
      <td><strong>08:30 - 01:45 PM</strong></td>
      <td>👨‍🏫 Docentes en Aula</td>
      <td>
        <strong>Labor Pedagógica:</strong> Verificación de asistencia en aula, dictado según horario semanal, calificación de notas CNEB y asignación de tareas con adjuntos.
      </td>
    </tr>
    <tr>
      <td><strong>02:00 - 05:00 PM</strong></td>
      <td>👨‍👩‍👦 Familias en Casa</td>
      <td>
        <strong>Seguimiento Familiar:</strong> El alumno sube sus tareas resueltas; el apoderado consulta la hora exacta de ingreso de su hijo, revisa notas y envía justificaciones médicas.
      </td>
    </tr>
    <tr>
      <td><strong>05:00 - 06:00 PM</strong></td>
      <td>📋 Administración</td>
      <td>
        <strong>Cierre Diario:</strong> Revisión de justificaciones médicas aprobadas por tutores y emisión de reportes oficiales consolidados.
      </td>
    </tr>
  </tbody>
</table>

<!-- ═══════════════════════════════════════════════════════════════ -->
<!-- SECCIÓN 4: GUÍA POR ROLES                                      -->
<!-- ═══════════════════════════════════════════════════════════════ -->
<div class="page-break"></div>
<h1>👑 4. Guía del Administrador / Dirección (/admin)</h1>
<p>
  La Dirección tiene acceso al centro de mando con métricas 100% en vivo, seguridad y control académico general.
</p>

<div class="screenshot-container">
  <div class="screenshot-header">
    <span>PANEL DE CONTROL GENERAL (/admin)</span>
    <span>MÉTRICAS EN TIEMPO REAL</span>
  </div>
  <img class="screenshot-img" src="{img_admin}" alt="Admin Dashboard" />
  <div class="screenshot-caption">
    Figura 4.1: Dashboard principal con aforo en vivo, gráfico de puntualidad, balance CNEB y ticker de escaneo.
  </div>
</div>

<h3>Funciones Clave del Director:</h3>
<ul>
  <li><strong>Monitoreo de Asistencia:</strong> Gráfico dinámico con alumnos presentes, tardanzas y faltas filtrables por nivel (Inicial, Primaria, Secundaria).</li>
  <li><strong>Actas de Calificaciones (/admin/notas-salon):</strong> Visualización de las matrices de notas de cualquier grado y opción de <em>Cierre de Bimestre</em>.</li>
  <li><strong>Gestión de Seguridad (/admin/alertas):</strong> Auditoría de accesos y prevención de incidentes.</li>
</ul>

<!-- ═══════════════════════════════════════════════════════════════ -->
<!-- SECCIÓN 5: GUÍA DEL DOCENTE                                    -->
<!-- ═══════════════════════════════════════════════════════════════ -->
<div class="page-break"></div>
<h1>👨‍🏫 5. Guía del Docente / Profesor (/docente)</h1>
<p>
  El portal del profesor está optimizado para agilizar el trabajo pedagógico diario en aula:
</p>

<div class="screenshot-container">
  <div class="screenshot-header">
    <span>REGISTRO DE CALIFICACIONES CNEB (/docente/notas)</span>
    <span>EVALUACIÓN POR COMPETENCIAS</span>
  </div>
  <img class="screenshot-img" src="{img_doc_notas}" alt="Docente Notas" />
  <div class="screenshot-caption">
    Figura 5.1: Matriz de evaluación CNEB con escala literal (AD, A, B, C) y conclusiones descriptivas.
  </div>
</div>

<div class="screenshot-container">
  <div class="screenshot-header">
    <span>GESTIÓN DE TAREAS Y DEBERES (/docente/tareas)</span>
    <span>AULA VIRTUAL LMS</span>
  </div>
  <img class="screenshot-img" src="{img_doc_tareas}" alt="Docente Tareas" />
  <div class="screenshot-caption">
    Figura 5.2: Creación de tareas con fecha límite, adjuntos y bandeja de revisión de entregas.
  </div>
</div>

<!-- ═══════════════════════════════════════════════════════════════ -->
<!-- SECCIÓN 6: GUÍA DEL ESTUDIANTE Y APODERADO                     -->
<!-- ═══════════════════════════════════════════════════════════════ -->
<div class="page-break"></div>
<h1>🎓 6. Guía del Estudiante y Apoderado</h1>

<h2>Para el Estudiante (/estudiante)</h2>
<p>El estudiante cuenta con su carnet digital interactivo y acceso a todas sus calificaciones oficiales:</p>

<div class="screenshot-container">
  <div class="screenshot-header">
    <span>CARNET ESCOLAR DIGITAL QR (/estudiante/carnet-qr)</span>
    <span>CREDENCIAL OFICIAL</span>
  </div>
  <img class="screenshot-img" src="{img_est_carnet}" alt="Carnet Estudiante" />
  <div class="screenshot-caption">
    Figura 6.1: Carnet digital con foto, datos de emergencia, QR de alta resolución y sello oficial.
  </div>
</div>

<div class="screenshot-container">
  <div class="screenshot-header">
    <span>LIBRETA OFICIAL DE CALIFICACIONES (/estudiante/libreta-notas)</span>
    <span>INFORME DE PROGRESO</span>
  </div>
  <img class="screenshot-img" src="{img_est_libreta}" alt="Libreta de Notas" />
  <div class="screenshot-caption">
    Figura 6.2: Informe de progreso con promedio anual, notas por área y conclusiones formativas.
  </div>
</div>

<h2>Para el Apoderado / Padre de Familia (/apoderado)</h2>
<p>El portal familiar brinda tranquilidad total con monitoreo de ingreso en vivo, selector multihijo y descarga directa de la libreta oficial para impresión:</p>

<div class="screenshot-container">
  <div class="screenshot-header">
    <span>PORTAL DE LA FAMILIA (/apoderado)</span>
    <span>SEGUIMIENTO INTEGRAL</span>
  </div>
  <img class="screenshot-img" src="{img_apoderado}" alt="Portal Apoderado" />
  <div class="screenshot-caption">
    Figura 6.3: Dashboard del apoderado con asistencia en vivo, selector de hijos y botón de impresión de libreta.
  </div>
</div>

<!-- ═══════════════════════════════════════════════════════════════ -->
<!-- SECCIÓN 7: OPERACIÓN DEL KIOSCO QR                             -->
<!-- ═══════════════════════════════════════════════════════════════ -->
<div class="page-break"></div>
<h1>📷 7. Operación del Kiosco QR en Puerta (/asistencia)</h1>
<p>
  El Kiosco de Asistencia es la primera cara del colegio cada mañana. Funciona de manera autónoma con cualquier cámara web estándar:
</p>

<div class="screenshot-container">
  <div class="screenshot-header">
    <span>ESTACIÓN DE KIOSCO EN PORTERÍA (/asistencia)</span>
    <span>ESCANEO INSTANTÁNEO</span>
  </div>
  <img class="screenshot-img" src="{img_kiosco}" alt="Kiosco Asistencia" />
  <div class="screenshot-caption">
    Figura 7.1: Estación de escaneo en portería con detector facial/QR, audio y barra de marcación manual.
  </div>
</div>

<div class="callout callout-success">
  <strong>🎉 Experiencia Positiva:</strong> Cada alumno que marca su ingreso antes de las 08:00 AM recibe una animación interactiva con su nombre, fotografía y lluvia de confetti, motivando su puntualidad diaria.
</div>

<!-- ═══════════════════════════════════════════════════════════════ -->
<!-- SECCIÓN 8: PREGUNTAS FRECUENTES                                -->
<!-- ═══════════════════════════════════════════════════════════════ -->
<div class="no-break">
  <h2>❓ Preguntas Frecuentes (FAQ)</h2>
  <table>
    <tbody>
      <tr>
        <td style="width: 30%;"><strong>¿Funciona sin conexión a internet?</strong></td>
        <td>Sí. Cuenta con arquitectura <em>Offline-First</em> que guarda los escaneos en memoria y los sincroniza al volver la red.</td>
      </tr>
      <tr>
        <td><strong>¿Cómo se justifican las inasistencias?</strong></td>
        <td>Los padres pueden entrar a <span style="font-family: monospace;">/apoderado</span>, presionar <em>"Justificar Inasistencia"</em> y enviar el motivo al tutor del aula.</td>
      </tr>
      <tr>
        <td><strong>¿Cómo se emiten las libretas para impresión?</strong></td>
        <td>Tanto el Director como el Apoderado pueden hacer clic en <em>"Ver Libreta Oficial"</em> y presionar el botón <strong>Imprimir / Guardar PDF</strong> con sellos y firmas digitales incluidas.</td>
      </tr>
    </tbody>
  </table>
</div>

<div style="margin-top: 25px; padding-top: 10px; border-top: 1px solid #cbd5e1; font-size: 8pt; color: #94a3b8; text-align: center;">
  Documento generado automáticamente • ColeSistema Mini © 2026 • Plataforma de Gestión Escolar Inteligente
</div>

</body>
</html>"""

    html_path = os.path.join(BASE_DIR, "guia_usuario_preview.html")
    with open(html_path, "w", encoding="utf-8") as f:
        f.write(html_content)
    print(f"[✓] Documento HTML generado en: {html_path}")

    # 3. Render HTML to PDF via Chrome Headless
    print("[3/3] Compilando PDF de alta calidad con Chrome Headless...")
    chrome_options = Options()
    chrome_options.add_argument("--headless=new")
    chrome_options.add_argument("--disable-gpu")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_argument("--run-all-compositor-stages-before-draw")
    
    driver = webdriver.Chrome(options=chrome_options)
    try:
        driver.get(f"file:///{html_path.replace(os.sep, '/')}")
        time.sleep(3.0)

        # Print to PDF using Chrome DevTools Protocol
        print_options = {
            'landscape': False,
            'displayHeaderFooter': False,
            'printBackground': True,
            'preferCSSPageSize': True,
            'marginTop': 0,
            'marginBottom': 0,
            'marginLeft': 0,
            'marginRight': 0,
            'scale': 1.0
        }
        result = driver.execute_cdp_cmd("Page.printToPDF", print_options)
        pdf_bytes = base64.b64decode(result['data'])

        pdf_path = os.path.join(BASE_DIR, "Guia_Usuario_ColeSistema_Mini.pdf")
        with open(pdf_path, "wb") as f:
            f.write(pdf_bytes)

        print(f"\n[🎉 ÉXITO] PDF Generado Exitosamente:")
        print(f"  -> Archivo: {pdf_path}")
        print(f"  -> Tamaño: {len(pdf_bytes) / 1024:.2f} KB")

    finally:
        driver.quit()

if __name__ == "__main__":
    generate_pdf()
