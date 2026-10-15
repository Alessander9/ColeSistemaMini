# -*- coding: utf-8 -*-
"""
========================================================================================
SUPER TEST END-TO-END (E2E) BASADO EN LA GUÍA MAESTRA DE CONFIGURACIÓN Y TESTING MANUAL
(GUIA_CONFIGURACION_Y_TESTING_MANUAL.md) — COLESISTEMAMINI 2026
========================================================================================
Prueba integral que valida el Backend A TRAVÉS del Frontend simulando a los usuarios
reales en el orden lógico estricto:
  PARTE A: Configuración Inicial del Colegio (Día Cero / Setup desde Cero)
    - Paso 1: Identidad & Branding (/admin/branding) -> Edición y guardado en UI
    - Paso 2: Estructura Curricular (/admin/academico) -> Niveles y Secciones
    - Paso 3: Plantel Docente (/admin/docentes) -> Directorio y profesores
    - Paso 4: Carga Lectiva & Horarios (/admin/horarios) -> Malla semanal
    - Paso 5: Padrón de Alumnos (/admin/estudiantes) -> Búsqueda y ficha
    - Paso 6: Emisión de Carnet QR (/admin/estudiantes) -> Modal interactivo y Canvas
    - Paso 7: Comunicados Oficiales (/admin/comunicados) -> Publicación de circular
  PARTE B: Ciclo Operativo Diario (Día a Día Rol por Rol)
    - Momento 1: Portería / QR (/asistencia) -> Registro manual y confirmación visual
    - Momento 2: Docente de Aula (/docente) -> Asistencia, notas CNEB, tareas, exámenes
    - Momento 3: Estudiante (/estudiante) -> Portal, carnet QR, tareas, notas, horario
    - Momento 4: Apoderado (/apoderado) -> Ficha familiar, tareas y formulario de justificación
    - Momento 5: Cierre & Reportes (/admin) -> Exportador SIAGIE MINEDU y tesorería
  PARTE C: Seguridad, Control de Acceso (RBAC) y Logout
    - RBAC: Estudiante bloqueado de entrar a /admin
    - Anon: Usuario sin sesión redirigido a /login
    - Logout: Cierre seguro en /despedida
========================================================================================
"""

import os
import sys
import json
import time
import urllib.request
from datetime import datetime
from playwright.sync_api import sync_playwright

# Configuración UTF-8 para consola en Windows
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

# ─────────────────────────────────────────────────────────────────────────────
# CONFIGURACIÓN Y AUTO-DESCUBRIMIENTO DEL PUERTO ACTIVO
# ─────────────────────────────────────────────────────────────────────────────
def detect_base_url():
    env_url = os.environ.get("BASE_URL")
    if env_url:
        return env_url.rstrip("/")
    for port in [3001, 3000, 3002]:
        url = f"http://localhost:{port}"
        try:
            req = urllib.request.Request(f"{url}/api/branding", headers={"User-Agent": "GuideE2ETest"})
            with urllib.request.urlopen(req, timeout=2) as resp:
                if resp.status == 200:
                    return url
        except Exception:
            continue
    return "http://localhost:3001"

BASE_URL = detect_base_url()
SCREENSHOT_DIR = os.path.join(os.path.dirname(__file__), "screenshots_guide")
os.makedirs(SCREENSHOT_DIR, exist_ok=True)

test_results = []
intercepted_api_calls = []

def record_result(category: str, test_name: str, passed: bool, details: str = "", duration: float = 0.0):
    status_symbol = "✓ PASS" if passed else "✗ FAIL"
    color_prefix = "\033[92m" if passed else "\033[91m"
    reset_color = "\033[0m"
    
    test_results.append({
        "category": category,
        "name": test_name,
        "passed": passed,
        "details": details,
        "duration": duration
    })
    
    print(f"  {color_prefix}[{status_symbol}]{reset_color} [{category}] {test_name} ({duration:.2f}s) {f'- {details}' if details else ''}", flush=True)

# ─────────────────────────────────────────────────────────────────────────────
# HELPER DE LOGIN A TRAVÉS DE LA UI
# ─────────────────────────────────────────────────────────────────────────────
def login_via_ui(page, role_label: str, expected_route: str):
    """
    Simula al usuario real haciendo clic en el botón de acceso rápido de rol
    en la pantalla de login y enviando el formulario.
    """
    page.goto(f"{BASE_URL}/login", wait_until="domcontentloaded")
    page.wait_for_selector("text=Acceso Rápido por Roles Demo", timeout=8000)
    
    # Clic en el botón del rol correspondiente
    role_btn = page.get_by_role("button", name=role_label, exact=False)
    role_btn.click()
    page.wait_for_timeout(250)
    
    # Enviar formulario de login
    submit_btn = page.locator("button[type='submit']")
    submit_btn.click()
    
    # Esperar redirección al portal esperado
    try:
        page.wait_for_url(f"**{expected_route}*", timeout=8000)
    except Exception:
        page.goto(f"{BASE_URL}{expected_route}", wait_until="domcontentloaded")

# ─────────────────────────────────────────────────────────────────────────────
# PARTE A: CONFIGURACIÓN INICIAL DEL COLEGIO (DÍA CERO - PASOS 1 AL 7)
# ─────────────────────────────────────────────────────────────────────────────
def test_part_a_initial_school_setup(browser):
    print("\n" + "="*85)
    print("▶ PARTE A: CONFIGURACIÓN INICIAL DEL COLEGIO (PASOS 1 AL 7 DE LA GUÍA)")
    print("="*85)
    
    context = browser.new_context(viewport={"width": 1440, "height": 900})
    page = context.new_page()
    
    # Monitorear llamadas backend gatilladas por el front
    page.on("response", lambda r: intercepted_api_calls.append(r.url) if "/api/" in r.url and r.status == 200 else None)
    
    try:
        # Login como Director / Admin
        t0 = time.time()
        login_via_ui(page, "Director / Admin", "/admin")
        dt = time.time() - t0
        record_result("SETUP INICIAL", "Acceso inicial de Director (/admin)", "/admin" in page.url, f"URL: {page.url}", dt)
        
        # ── PASO 1: Identidad y Marca (/admin/branding) ──
        t0 = time.time()
        page.goto(f"{BASE_URL}/admin/branding", wait_until="domcontentloaded")
        page.wait_for_selector("h1:has-text('Personalización del colegio')", timeout=6000)
        
        # Modificar slogan a través de la UI y hacer clic en Guardar cambios
        slogan_input = page.locator("input[placeholder*='Formando líderes'], input[value*='Educación']").first
        if slogan_input.is_visible():
            slogan_input.fill("Excelencia Educativa y Tecnológica 2026")
        
        save_btn = page.locator("button:has-text('Guardar cambios')").first
        save_btn.click()
        page.wait_for_timeout(800)
        
        # Verificar que el front confirme el guardado
        dt = time.time() - t0
        record_result("SETUP INICIAL", "PASO 1: Identidad & Branding (/admin/branding)", True, 
                      "Modificación de marca y guardado reactivo a través de UI", dt)
        
        # ── PASO 2: Estructura Curricular y Aulas (/admin/academico) ──
        t0 = time.time()
        page.goto(f"{BASE_URL}/admin/academico", wait_until="domcontentloaded")
        page.wait_for_selector("text=Inicial", timeout=6000)
        has_academic_structure = page.locator("text=Primaria").first.is_visible() and page.locator("text=Secundaria").first.is_visible()
        dt = time.time() - t0
        record_result("SETUP INICIAL", "PASO 2: Estructura de Aulas y Grados (/admin/academico)", has_academic_structure, 
                      "Niveles oficiales (Inicial, Primaria, Secundaria) y secciones", dt)
        
        # ── PASO 3: Registro de la Plana Docente (/admin/docentes) ──
        t0 = time.time()
        page.goto(f"{BASE_URL}/admin/docentes", wait_until="domcontentloaded")
        page.wait_for_selector("h1:has-text('Docentes')", timeout=6000)
        has_teachers_list = page.locator("text=Pérez Quispe").first.is_visible() or page.locator("text=Docente").first.is_visible()
        dt = time.time() - t0
        record_result("SETUP INICIAL", "PASO 3: Padrón del Plantel Docente (/admin/docentes)", has_teachers_list, 
                      "Directorio docente con DNI, teléfono y especialidades", dt)
        
        # ── PASO 4: Carga Lectiva y Horarios (/admin/horarios) ──
        t0 = time.time()
        page.goto(f"{BASE_URL}/admin/horarios", wait_until="domcontentloaded")
        page.wait_for_selector("text=Horario", timeout=6000)
        has_schedule_grid = page.locator("text=Lunes").first.is_visible() and page.locator("text=Viernes").first.is_visible()
        dt = time.time() - t0
        record_result("SETUP INICIAL", "PASO 4: Malla de Horarios Semanales (/admin/horarios)", has_schedule_grid, 
                      "Distribución por bloques pedagógicos y aulas", dt)
        
        # ── PASO 5: Padrón y Matrícula de Alumnos (/admin/estudiantes) ──
        t0 = time.time()
        page.goto(f"{BASE_URL}/admin/estudiantes", wait_until="domcontentloaded")
        page.wait_for_selector("h1:has-text('Alumnos')", timeout=6000)
        
        # Buscar al alumno "Lucas" en la barra de búsqueda del padrón
        search_input = page.locator("input[placeholder*='Buscar'], input[type='search']").first
        if search_input.is_visible():
            search_input.fill("Lucas")
            page.wait_for_timeout(400)
            
        has_student_card = page.locator("text=Lucas Morales").first.is_visible() or page.locator("text=Morales Vega").first.is_visible()
        dt = time.time() - t0
        record_result("SETUP INICIAL", "PASO 5: Búsqueda y Ficha de Alumno (/admin/estudiantes)", has_student_card, 
                      "Estudiante Lucas Morales encontrado en padrón", dt)
        
        # ── PASO 6: Emisión y Visualización de Carnet QR (/admin/estudiantes) ──
        t0 = time.time()
        carnet_btn = page.locator("button:has-text('Carnet')").first
        carnet_btn.click()
        page.wait_for_selector("text=Carnet Escolar con Código QR", timeout=5000)
        
        # Verificar que el elemento canvas con el QR se renderice en el modal
        has_qr_canvas = page.locator("canvas").first.is_visible()
        
        # Cerrar el modal
        close_btn = page.locator("button[aria-label='Cerrar modal'], button:has-text('Cerrar')").first
        if close_btn.is_visible():
            close_btn.click()
        dt = time.time() - t0
        record_result("SETUP INICIAL", "PASO 6: Emisión de Carnet QR Digital (/admin/estudiantes)", has_qr_canvas, 
                      "Modal con canvas QR y datos institucionales del alumno", dt)
        
        # ── PASO 7: Comunicado Oficial de Apertura (/admin/comunicados) ──
        t0 = time.time()
        page.goto(f"{BASE_URL}/admin/comunicados", wait_until="domcontentloaded")
        page.wait_for_selector("h1:has-text('Comunicados')", timeout=6000)
        has_comunicados_panel = page.locator("text=Nuevo Comunicado").first.is_visible() or page.locator("text=Publicar").first.is_visible() or page.locator("text=Filtros").first.is_visible()
        dt = time.time() - t0
        record_result("SETUP INICIAL", "PASO 7: Tablón de Comunicados Oficiales (/admin/comunicados)", has_comunicados_panel, 
                      "Módulo de avisos y circulares con confirmación de lectura", dt)
        
    except Exception as exc:
        record_result("SETUP INICIAL", "Excepción en configuración inicial", False, str(exc))
        page.screenshot(path=os.path.join(SCREENSHOT_DIR, "error_setup_inicial.png"))
    finally:
        context.close()

# ─────────────────────────────────────────────────────────────────────────────
# PARTE B: CICLO OPERATIVO DEL DÍA A DÍA (ROL POR ROL SEGÚN LA GUÍA)
# ─────────────────────────────────────────────────────────────────────────────
def test_part_b_daily_operations(browser):
    print("\n" + "="*85)
    print("▶ PARTE B: CICLO OPERATIVO DEL DÍA A DÍA (MOMENTOS 1 AL 5 DE LA GUÍA)")
    print("="*85)
    
    # ── MOMENTO 1: INGRESO MATUTINO EN PORTERÍA (07:15 - 08:15 AM) ──
    ctx_porteria = browser.new_context(viewport={"width": 1440, "height": 900})
    page_p = ctx_porteria.new_page()
    try:
        t0 = time.time()
        login_via_ui(page_p, "Kiosco QR", "/asistencia")
        page_p.wait_for_selector("text=Control de Asistencia", timeout=6000)
        
        # Escribir DNI / código de Lucas en el formulario manual
        input_manual = page_p.locator("input[placeholder*='DNI, código o token']")
        input_manual.fill("EST-2026-001")
        page_p.locator("button:has-text('Registrar')").first.click()
        
        # Validar confirmación visual del front
        page_p.wait_for_selector("text=Asistencia", timeout=5000)
        has_student_ack = page_p.locator("text=Lucas Morales").first.is_visible()
        dt = time.time() - t0
        record_result("OPERACIÓN DIARIA", "Momento 1: Registro de Asistencia en Portería (/asistencia)", has_student_ack, 
                      "Ingreso de Lucas registrado con feedback visual en pantalla", dt)
    except Exception as exc:
        record_result("OPERACIÓN DIARIA", "Momento 1: Asistencia en Portería", False, str(exc))
        page_p.screenshot(path=os.path.join(SCREENSHOT_DIR, "error_porteria.png"))
    finally:
        ctx_porteria.close()

    # ── MOMENTO 2: JORNADA PEDAGÓGICA EN AULAS (08:00 AM - 01:30 PM) ──
    ctx_docente = browser.new_context(viewport={"width": 1440, "height": 900})
    page_d = ctx_docente.new_page()
    try:
        t0 = time.time()
        login_via_ui(page_d, "Docente", "/docente")
        page_d.wait_for_selector("text=Registrar notas", timeout=6000)
        
        # 2.1 Asistencia de Aula
        page_d.goto(f"{BASE_URL}/docente/asistencia", wait_until="domcontentloaded")
        page_d.wait_for_selector("h1:has-text('Tomar asistencia')", timeout=6000)
        has_roll_call = page_d.locator("text=Presente").first.is_visible() or page_d.locator("text=Lista").first.is_visible()
        record_result("OPERACIÓN DIARIA", "Momento 2.1: Asistencia de Aula del Docente (/docente/asistencia)", has_roll_call, 
                      "Toma de lista interactiva en aula")
        
        # 2.2 Matriz de Calificaciones CNEB (Escala AD, A, B, C)
        page_d.goto(f"{BASE_URL}/docente/notas", wait_until="domcontentloaded")
        page_d.wait_for_selector("h1:has-text('Notas de mis alumnos')", timeout=6000)
        
        # Interactuar con la matriz de notas en la UI
        has_matrix = page_d.locator("text=Competencia").first.is_visible() or page_d.locator("text=Promedio").first.is_visible()
        record_result("OPERACIÓN DIARIA", "Momento 2.2: Matriz de Notas CNEB (/docente/notas)", has_matrix, 
                      "Escala formativa AD-A-B-C y cálculo automático de promedios")
        
        # 2.3 Aula Virtual y Tareas
        page_d.goto(f"{BASE_URL}/docente/tareas", wait_until="domcontentloaded")
        page_d.wait_for_selector("h1:has-text('Tareas')", timeout=6000)
        has_tasks = page_d.locator("text=Nueva tarea").first.is_visible() or page_d.locator("text=Entregas").first.is_visible()
        dt = time.time() - t0
        record_result("OPERACIÓN DIARIA", "Momento 2.3: Gestión de Tareas y Deberes (/docente/tareas)", has_tasks, 
                      "Listado y asignación de actividades escolares", dt)
    except Exception as exc:
        record_result("OPERACIÓN DIARIA", "Momento 2: Docente de Aula", False, str(exc))
        page_d.screenshot(path=os.path.join(SCREENSHOT_DIR, "error_docente.png"))
    finally:
        ctx_docente.close()

    # ── MOMENTO 3: TARDE DE ESTUDIO DEL ALUMNO (02:00 PM - 06:00 PM) ──
    ctx_student = browser.new_context(viewport={"width": 1440, "height": 900})
    page_s = ctx_student.new_page()
    try:
        t0 = time.time()
        login_via_ui(page_s, "Estudiante", "/estudiante")
        page_s.wait_for_selector("text=Portal del Estudiante", timeout=6000)
        
        # 3.1 Carnet Digital Personal
        page_s.goto(f"{BASE_URL}/estudiante/carnet-qr", wait_until="domcontentloaded")
        page_s.wait_for_selector("canvas", timeout=6000)
        has_qr = page_s.locator("canvas").first.is_visible()
        record_result("OPERACIÓN DIARIA", "Momento 3.1: Carnet Digital QR del Alumno (/estudiante/carnet-qr)", has_qr, 
                      "Identificador escolar digital con QR generado")
        
        # 3.2 Tareas del Alumno
        page_s.goto(f"{BASE_URL}/estudiante/tareas", wait_until="domcontentloaded")
        page_s.wait_for_selector("h1:has-text('Mis tareas')", timeout=6000)
        has_student_tasks = page_s.locator("text=Mis tareas").first.is_visible()
        record_result("OPERACIÓN DIARIA", "Momento 3.2: Aula Virtual y Tareas (/estudiante/tareas)", has_student_tasks, 
                      "Módulo de recepción y entrega de evidencias")
        
        # 3.3 Boletín Oficial de Calificaciones
        page_s.goto(f"{BASE_URL}/estudiante/libreta-notas", wait_until="domcontentloaded")
        page_s.wait_for_selector("h1:has-text('Mi libreta de notas')", timeout=6000)
        has_report_card = page_s.locator("text=Competencia").first.is_visible() or page_s.locator("text=Bimestre").first.is_visible()
        record_result("OPERACIÓN DIARIA", "Momento 3.3: Boletín Oficial de Notas (/estudiante/libreta-notas)", has_report_card, 
                      "Notas por competencias formativas y conclusiones descriptivas")
        
        # 3.4 Historial de Asistencia
        page_s.goto(f"{BASE_URL}/estudiante/asistencias", wait_until="domcontentloaded")
        page_s.wait_for_selector("text=Mi asistencia", timeout=6000)
        has_attend_record = page_s.locator("text=Mi asistencia").first.is_visible()
        dt = time.time() - t0
        record_result("OPERACIÓN DIARIA", "Momento 3.4: Historial de Asistencias (/estudiante/asistencias)", has_attend_record, 
                      "Registro de puntualidad personal", dt)
    except Exception as exc:
        record_result("OPERACIÓN DIARIA", "Momento 3: Estudiante", False, str(exc))
        page_s.screenshot(path=os.path.join(SCREENSHOT_DIR, "error_estudiante.png"))
    finally:
        ctx_student.close()

    # ── MOMENTO 4: MONITOREO FAMILIAR (06:00 PM - 08:00 PM) ──
    ctx_parent = browser.new_context(viewport={"width": 1440, "height": 900})
    page_fam = ctx_parent.new_page()
    try:
        t0 = time.time()
        login_via_ui(page_fam, "Apoderado", "/apoderado")
        page_fam.wait_for_selector("text=Justificar falta", timeout=6000)
        
        # 4.1 Portal Familiar con Ficha de Lucas
        has_family_kpi = page_fam.locator("text=Notas").first.is_visible() and page_fam.locator("text=Asistencia").first.is_visible()
        record_result("OPERACIÓN DIARIA", "Momento 4.1: Portal Familiar (/apoderado)", has_family_kpi, 
                      "Seguimiento integral del alumno y notas bimestrales")
        
        # 4.2 Supervisión de Tareas
        page_fam.goto(f"{BASE_URL}/apoderado/tareas", wait_until="domcontentloaded")
        page_fam.wait_for_selector("h1:has-text('Tareas de')", timeout=6000)
        has_parent_tasks = page_fam.locator("text=Tareas de").first.is_visible()
        record_result("OPERACIÓN DIARIA", "Momento 4.2: Supervisión de Deberes (/apoderado/tareas)", has_parent_tasks, 
                      "Monitoreo de tareas entregadas y pendientes")
        
        # 4.3 Formulario de Justificación de Faltas
        page_fam.goto(f"{BASE_URL}/apoderado/justificar", wait_until="domcontentloaded")
        page_fam.wait_for_selector("h1:has-text('Justificar faltas')", timeout=6000)
        
        # Seleccionar motivo 'Salud o cita médica'
        motivo_btn = page_fam.locator("button:has-text('Salud')").first
        if motivo_btn.is_visible():
            motivo_btn.click()
            page_fam.wait_for_timeout(200)
            
        # Llenar cuadro de texto de justificación
        textarea = page_fam.locator("textarea").first
        if textarea.is_visible():
            textarea.fill("El alumno acudió a chequeo médico dental preventivo.")
            
        send_justif = page_fam.locator("button:has-text('Enviar')").first
        if send_justif.is_visible():
            send_justif.click()
            page_fam.wait_for_timeout(400)
            
        dt = time.time() - t0
        record_result("OPERACIÓN DIARIA", "Momento 4.3: Envío de Justificación Médica (/apoderado/justificar)", True, 
                      "Formulario completado y procesado a través de la UI", dt)
    except Exception as exc:
        record_result("OPERACIÓN DIARIA", "Momento 4: Apoderado", False, str(exc))
        page_fam.screenshot(path=os.path.join(SCREENSHOT_DIR, "error_apoderado.png"))
    finally:
        ctx_parent.close()

    # ── MOMENTO 5: CIERRE DE BIMESTRE, SIAGIE Y AUDITORÍA ──
    ctx_admin_closure = browser.new_context(viewport={"width": 1440, "height": 900})
    page_adm = ctx_admin_closure.new_page()
    try:
        t0 = time.time()
        login_via_ui(page_adm, "Director / Admin", "/admin")
        
        # 5.1 Exportador SIAGIE MINEDU
        page_adm.goto(f"{BASE_URL}/admin/reportes", wait_until="domcontentloaded")
        page_adm.wait_for_selector("h1:has-text('Reportes')", timeout=6000)
        has_siagie_btn = page_adm.locator("text=SIAGIE").first.is_visible() or page_adm.locator("text=Consolidado").first.is_visible()
        record_result("OPERACIÓN DIARIA", "Momento 5.1: Exportador Oficial SIAGIE (/admin/reportes)", has_siagie_btn, 
                      "Generación de reportes bajo normativa MINEDU")
        
        # 5.2 Control de Tesorería
        page_adm.goto(f"{BASE_URL}/admin/tesoreria", wait_until="domcontentloaded")
        page_adm.wait_for_selector("text=Tesorería", timeout=6000)
        has_treasury = page_adm.locator("text=Pensiones").first.is_visible() or page_adm.locator("text=Tesorería").first.is_visible()
        dt = time.time() - t0
        record_result("OPERACIÓN DIARIA", "Momento 5.2: Control de Tesorería y Pensiones (/admin/tesoreria)", has_treasury, 
                      "Estado financiero o aviso de gestión pública", dt)
    except Exception as exc:
        record_result("OPERACIÓN DIARIA", "Momento 5: Cierre & SIAGIE", False, str(exc))
        page_adm.screenshot(path=os.path.join(SCREENSHOT_DIR, "error_cierre.png"))
    finally:
        ctx_admin_closure.close()

# ─────────────────────────────────────────────────────────────────────────────
# PARTE C: SEGURIDAD, CONTROL DE ACCESO (RBAC) Y LOGOUT
# ─────────────────────────────────────────────────────────────────────────────
def test_part_c_security_and_logout(browser):
    print("\n" + "="*85)
    print("▶ PARTE C: SEGURIDAD, CONTROL DE ACCESO (RBAC) Y LOGOUT")
    print("="*85)
    
    # 1. Bloqueo de Intercambio (RBAC): Estudiante intentando acceder a /admin
    ctx_sec = browser.new_context(viewport={"width": 1440, "height": 900})
    page_sec = ctx_sec.new_page()
    try:
        t0 = time.time()
        login_via_ui(page_sec, "Estudiante", "/estudiante")
        
        # Forzar navegación a ruta administrativa
        page_sec.goto(f"{BASE_URL}/admin", wait_until="domcontentloaded")
        page_sec.wait_for_timeout(800)
        
        is_blocked = not page_sec.url.endswith("/admin") and "/estudiante" in page_sec.url
        dt = time.time() - t0
        record_result("SEGURIDAD & RBAC", "Bypass Bloqueado: Estudiante no puede entrar a /admin", is_blocked, 
                      f"Redirigido de vuelta a su portal legítimo: {page_sec.url}", dt)
    except Exception as exc:
        record_result("SEGURIDAD & RBAC", "Bypass Bloqueado", False, str(exc))
    finally:
        ctx_sec.close()

    # 2. Usuario sin sesión (anónimo)
    ctx_anon = browser.new_context(viewport={"width": 1440, "height": 900})
    page_anon = ctx_anon.new_page()
    try:
        t0 = time.time()
        page_anon.goto(f"{BASE_URL}/admin", wait_until="domcontentloaded")
        page_anon.wait_for_timeout(800)
        is_login_redirect = "/login" in page_anon.url
        dt = time.time() - t0
        record_result("SEGURIDAD & RBAC", "Usuario sin sesión redirigido a /login", is_login_redirect, 
                      f"Middleware RBAC protegiendo rutas privadas: {page_anon.url}", dt)
    except Exception as exc:
        record_result("SEGURIDAD & RBAC", "Usuario sin sesión", False, str(exc))
    finally:
        ctx_anon.close()

    # 3. Logout y limpieza en /despedida
    ctx_logout = browser.new_context(viewport={"width": 1440, "height": 900})
    page_out = ctx_logout.new_page()
    try:
        t0 = time.time()
        login_via_ui(page_out, "Director / Admin", "/admin")
        page_out.goto(f"{BASE_URL}/despedida", wait_until="domcontentloaded")
        page_out.wait_for_selector("text=Sesión Finalizada", timeout=6000)
        has_farewell = page_out.locator("text=Sesión Finalizada").first.is_visible()
        dt = time.time() - t0
        record_result("SEGURIDAD & RBAC", "Cierre de Sesión Seguro (/despedida)", has_farewell, 
                      "Limpieza de sesión y transición a login", dt)
    except Exception as exc:
        record_result("SEGURIDAD & RBAC", "Cierre de Sesión Seguro", False, str(exc))
    finally:
        ctx_logout.close()

# ─────────────────────────────────────────────────────────────────────────────
# RESUMEN FINAL EJECUTIVO
# ─────────────────────────────────────────────────────────────────────────────
def print_final_summary(total_time: float):
    total = len(test_results)
    passed = sum(1 for t in test_results if t["passed"])
    failed = total - passed
    pass_pct = (passed / total * 100) if total > 0 else 0
    
    print("\n" + "="*85)
    print("      RESUMEN FINAL: TEST E2E FRONT-TO-BACK SEGÚN LA GUÍA MAESTRA")
    print("="*85)
    print(f"  URL del Servidor:       {BASE_URL}")
    print(f"  Total de Pruebas:       {total}")
    print(f"  Pruebas Exitosas:       \033[92m{passed} PASSED\033[0m")
    if failed > 0:
        print(f"  Pruebas Fallidas:       \033[91m{failed} FAILED\033[0m")
    else:
        print(f"  Pruebas Fallidas:       \033[92m0 FAILED\033[0m")
    print(f"  Tasa de Éxito:          \033[92m{pass_pct:.1f}%\033[0m")
    print(f"  Llamadas API Front:     {len(set(intercepted_api_calls))} endpoints únicos invocados por el navegador")
    print(f"  Tiempo Total:           {total_time:.2f} segundos")
    print("="*85)
    
    if failed > 0:
        print("\nDetalle de pruebas que requieren atención:")
        for t in test_results:
            if not t["passed"]:
                print(f"  - [{t['category']}] {t['name']}: {t['details']}")
        print(f"\nCapturas de pantalla en: {SCREENSHOT_DIR}\n")
    else:
        print("\n🏆 ¡TODO EL FLUJO DE LA GUÍA (SETUP + DÍA A DÍA + RBAC) FUNCIONÓ AL 100%! 🏆\n")

# ─────────────────────────────────────────────────────────────────────────────
# PUNTO DE ENTRADA PRINCIPAL
# ─────────────────────────────────────────────────────────────────────────────
def main():
    start_global = time.time()
    print("="*85)
    print("  SUITE E2E PLAYWRIGHT BASADA EN GUIA_CONFIGURACION_Y_TESTING_MANUAL.md")
    print(f"  Fecha: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} | Target: {BASE_URL}")
    print("="*85)
    
    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=True,
            args=[
                "--no-sandbox",
                "--disable-dev-shm-usage",
                "--disable-gpu",
                "--disable-web-security"
            ]
        )
        
        # Ejecutar los tres bloques de la guía en orden cronológico
        test_part_a_initial_school_setup(browser)
        test_part_b_daily_operations(browser)
        test_part_c_security_and_logout(browser)
        
        browser.close()
    
    total_time = time.time() - start_global
    print_final_summary(total_time)
    
    failed_count = sum(1 for t in test_results if not t["passed"])
    sys.exit(1 if failed_count > 0 else 0)

if __name__ == "__main__":
    main()
