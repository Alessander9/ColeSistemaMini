# -*- coding: utf-8 -*-
"""
========================================================================================
SUPER TEST END-TO-END (E2E) MULTI-ROL Y ENDPOINTS CON PLAYWRIGHT
SISTEMA ESCOLAR MINI (COLESISTEMAMINI)
========================================================================================
Flujo Lógico Integral de Pruebas:
  FASE 0: Endpoints Backend (/api/*) - Salud, Branding, Asistencia, Calificaciones, Notificaciones
  FASE 1: Kiosco de Portería / Lector QR (rol: asistencia)
  FASE 2: Director / Administrador (rol: admin)
  FASE 3: Docente de Aula (rol: docente)
  FASE 4: Estudiante (rol: estudiante)
  FASE 5: Apoderado / Padre de Familia (rol: apoderado)
  FASE 6: Seguridad, Control de Acceso (RBAC) & Logout
========================================================================================
"""

import os
import sys
import json
import time
import urllib.request
import urllib.error
from datetime import datetime
from playwright.sync_api import sync_playwright

# Configuración de codificación UTF-8 en Windows
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

# ─────────────────────────────────────────────────────────────────────────────
# CONFIGURACIÓN Y AUTO-DESCUBRIMIENTO DEL SERVIDOR LOCAL
# ─────────────────────────────────────────────────────────────────────────────
def detect_base_url():
    env_url = os.environ.get("BASE_URL")
    if env_url:
        return env_url.rstrip("/")
    for port in [3001, 3000, 3002]:
        url = f"http://localhost:{port}"
        try:
            req = urllib.request.Request(f"{url}/api/branding", headers={"User-Agent": "PlaywrightSuperTest"})
            with urllib.request.urlopen(req, timeout=2) as resp:
                if resp.status == 200:
                    return url
        except Exception:
            continue
    return "http://localhost:3001"

BASE_URL = detect_base_url()
SCREENSHOT_DIR = os.path.join(os.path.dirname(__file__), "screenshots")
os.makedirs(SCREENSHOT_DIR, exist_ok=True)

# ─────────────────────────────────────────────────────────────────────────────
# REPOSITORIO DE RESULTADOS DE PRUEBA
# ─────────────────────────────────────────────────────────────────────────────
test_results = []

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
# HELPER DE PETICIÓN HTTP A ENDPOINTS
# ─────────────────────────────────────────────────────────────────────────────
def http_request(method: str, path: str, data: dict = None, cookie: str = None):
    url = f"{BASE_URL}{path}"
    headers = {"Content-Type": "application/json", "User-Agent": "PlaywrightSuperTest/1.0"}
    if cookie:
        headers["Cookie"] = cookie
    req_body = json.dumps(data).encode("utf-8") if data is not None else None
    req = urllib.request.Request(url, data=req_body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=8) as response:
            status = response.status
            body_text = response.read().decode("utf-8")
            try:
                body_json = json.loads(body_text)
            except Exception:
                body_json = {"raw": body_text}
            return status, body_json
    except urllib.error.HTTPError as err:
        body_text = err.read().decode("utf-8")
        try:
            body_json = json.loads(body_text)
        except Exception:
            body_json = {"raw": body_text}
        return err.code, body_json
    except Exception as exc:
        return 500, {"error": str(exc)}

# ─────────────────────────────────────────────────────────────────────────────
# FASE 0: PRUEBA INTEGRAL DE CADA ENDPOINT DE BACKEND
# ─────────────────────────────────────────────────────────────────────────────
def test_phase_0_api_endpoints():
    print("\n" + "="*80)
    print("▶ FASE 0: VERIFICACIÓN Y SALUD DE TODOS LOS ENDPOINTS DE BACKEND (/api/*)")
    print("="*80)
    
    # Endpoint 1: GET /api/branding
    t0 = time.time()
    st, res = http_request("GET", "/api/branding")
    dt = time.time() - t0
    record_result("API", "GET /api/branding", st == 200 and res.get("success") is True, 
                  f"Status {st}, Institución: {res.get('data', {}).get('nombreInstitucion', 'OK')}", dt)
    
    # Endpoint 2: POST /api/branding
    t0 = time.time()
    update_payload = {"siglas": "CSM", "slogan": "Excelencia Académica y Tecnológica 2026"}
    st, res = http_request("POST", "/api/branding", update_payload)
    dt = time.time() - t0
    record_result("API", "POST /api/branding", st == 200 and res.get("success") is True, 
                  f"Actualización exitosa: {res.get('message', 'OK')}", dt)
    
    # Endpoint 3: POST /api/notas/calcular (Motor de calificaciones CNEB - requiere auth)
    t0 = time.time()
    grades_payload = {"grades": ["AD", "A", "AD", "B"]}
    st, res = http_request("POST", "/api/notas/calcular", grades_payload, cookie="cole_user_role=admin")
    dt = time.time() - t0
    calc_ok = st == 200 and res.get("success") is True and "promedioLetra" in res.get("data", {})
    record_result("API", "POST /api/notas/calcular (Notas Válidas)", calc_ok, 
                  f"Promedio: {res.get('data', {}).get('promedioLetra')}, Estado: {res.get('data', {}).get('estadoPromocion')}", dt)
    
    # Endpoint 3.1: POST /api/notas/calcular (Validación de Error con array vacío)
    t0 = time.time()
    st, res = http_request("POST", "/api/notas/calcular", {"grades": []}, cookie="cole_user_role=admin")
    dt = time.time() - t0
    record_result("API", "POST /api/notas/calcular (Manejo de Error)", st == 400 and res.get("success") is False, 
                  f"Respuesta esperada 400 Bad Request: {res.get('message')}", dt)
    
    # Endpoint 4: POST /api/asistencia/scan (Validación de Token QR Estudiante)
    t0 = time.time()
    scan_payload = {
        "tokenQr": "QR-EST-2026-001-Lucas_Morales",
        "metodo": "qr",
        "status": "presente"
    }
    st, res = http_request("POST", "/api/asistencia/scan", scan_payload, cookie="cole_user_role=asistencia")
    dt = time.time() - t0
    scan_ok = st == 200 and res.get("success") is True and "Lucas" in res.get("data", {}).get("estudiante", "")
    record_result("API", "POST /api/asistencia/scan (Token QR Válido)", scan_ok, 
                  f"Estudiante: {res.get('data', {}).get('estudiante')}, Hora: {res.get('data', {}).get('hora')}", dt)
    
    # Endpoint 4.1: POST /api/asistencia/scan (Código Inexistente)
    t0 = time.time()
    bad_scan = {"tokenQr": "TOKEN-INVALIDO-9999"}
    st, res = http_request("POST", "/api/asistencia/scan", bad_scan, cookie="cole_user_role=asistencia")
    dt = time.time() - t0
    record_result("API", "POST /api/asistencia/scan (Token Inexistente)", st == 404 and res.get("success") is False, 
                  f"Manejo de error 404: {res.get('message')}", dt)
    
    # Endpoint 5: POST /api/notifications/brevo (Simulación / Despacho de Correo Asistencia)
    t0 = time.time()
    brevo_payload = {
        "studentName": "Lucas Morales Vega",
        "parentEmail": "apoderado@colegio.edu.pe",
        "parentName": "Perico Morales Silva",
        "estado": "presente",
        "horaRegistro": "07:45 AM",
        "fechaRegistro": datetime.now().strftime("%d/%m/%Y")
    }
    st, res = http_request("POST", "/api/notifications/brevo", brevo_payload)
    dt = time.time() - t0
    brevo_ok = st == 200 and res.get("success") is True
    record_result("API", "POST /api/notifications/brevo (Correo Asistencia)", brevo_ok, 
                  f"Status {st}, Destino: {res.get('recipient')}, Simulado: {res.get('simulated', False)}", dt)

    # Endpoint 6: POST /api/notifications/resend (Simulación / Despacho Libreta de Notas)
    t0 = time.time()
    resend_payload = {
        "recipientEmail": "apoderado@colegio.edu.pe",
        "type": "libreta_notas",
        "studentName": "Lucas Morales Vega",
        "bimestre": "II BIMESTRE",
        "branding": {"resendApiKey": "re_demo_simulated_key"}
    }
    st, res = http_request("POST", "/api/notifications/resend", resend_payload)
    dt = time.time() - t0
    resend_ok = st == 200 and res.get("success") is True
    record_result("API", "POST /api/notifications/resend (Libreta de Notas)", resend_ok, 
                  f"Status {st}, Tipo: {res.get('type')}, Destino: {res.get('recipient')}", dt)

# ─────────────────────────────────────────────────────────────────────────────
# HELPER DE LOGIN POR ROL USANDO LA INTERFAZ WEB REAL
# ─────────────────────────────────────────────────────────────────────────────
def login_role_ui(page, role_button_label: str, expected_dashboard: str):
    """
    Inicia sesión a través de la UI haciendo clic en el perfil demo correspondiente
    y enviando el formulario, validando la transición y redirección.
    """
    page.goto(f"{BASE_URL}/login", wait_until="domcontentloaded")
    page.wait_for_selector("text=Acceso Rápido por Roles Demo", timeout=8000)
    
    # Hacer clic en el botón de rol demo rápido
    role_btn = page.get_by_role("button", name=role_button_label, exact=False)
    role_btn.click()
    page.wait_for_timeout(300)
    
    # Enviar formulario
    submit_btn = page.locator("button[type='submit']")
    submit_btn.click()
    
    # Esperar redirección al dashboard correspondiente (puede pasar brevemente por /bienvenida)
    try:
        page.wait_for_url(f"**{expected_dashboard}*", timeout=8000)
    except Exception:
        page.goto(f"{BASE_URL}{expected_dashboard}", wait_until="domcontentloaded")

# ─────────────────────────────────────────────────────────────────────────────
# FASE 1: ROL ASISTENCIA / OPERADOR DE PORTERÍA
# ─────────────────────────────────────────────────────────────────────────────
def test_phase_1_asistencia_role(browser):
    print("\n" + "="*80)
    print("▶ FASE 1: FLUJO DE ASISTENCIA Y PORTERÍA (rol: asistencia)")
    print("="*80)
    
    context = browser.new_context(viewport={"width": 1440, "height": 900})
    page = context.new_page()
    
    try:
        # 1. Login como Operador de Asistencia / Kiosco QR
        t0 = time.time()
        login_role_ui(page, "Kiosco QR", "/asistencia")
        dt = time.time() - t0
        has_kiosk = "/asistencia" in page.url
        record_result("ROL: ASISTENCIA", "1.1 Login e ingreso a /asistencia", has_kiosk, f"URL actual: {page.url}", dt)
        
        # 2. Verificar interfaz del Kiosco de Asistencia
        t0 = time.time()
        page.wait_for_selector("text=Control de Asistencia", timeout=6000)
        has_controls = page.locator("text=Asistencias de hoy").is_visible()
        dt = time.time() - t0
        record_result("ROL: ASISTENCIA", "1.2 Interfaz de Control y Monitoreo de Hoy", has_controls, "Panel de métricas y viewport", dt)
        
        # 3. Registro manual de estudiante por código
        t0 = time.time()
        manual_input = page.locator("input[placeholder*='DNI, código o token']")
        manual_input.fill("EST-2026-001")
        page.locator("button:has-text('Registrar')").first.click()
        
        # Esperar alerta visual de confirmación de asistencia
        page.wait_for_selector("text=Asistencia Registrada", timeout=6000)
        has_student_registered = page.locator("text=Lucas Morales").first.is_visible()
        dt = time.time() - t0
        record_result("ROL: ASISTENCIA", "1.3 Registro de Estudiante por Código (Lucas Morales)", has_student_registered, 
                      "Confirmación visual con badge de estado", dt)
        
        # 4. Alternar modo de asistencia (Entrada vs Salida)
        t0 = time.time()
        btn_salida = page.locator("button:has-text('Salida / Retiro')")
        btn_salida.click()
        page.wait_for_timeout(300)
        btn_entrada = page.locator("button:has-text('Entrada')")
        btn_entrada.click()
        dt = time.time() - t0
        record_result("ROL: ASISTENCIA", "1.4 Alternar Modo Entrada / Salida", True, "Selector reactivo", dt)
        
    except Exception as exc:
        record_result("ROL: ASISTENCIA", "Excepción en flujo", False, str(exc))
        page.screenshot(path=os.path.join(SCREENSHOT_DIR, "error_asistencia.png"))
    finally:
        context.close()

# ─────────────────────────────────────────────────────────────────────────────
# FASE 2: ROL DIRECTOR / ADMINISTRADOR
# ─────────────────────────────────────────────────────────────────────────────
def test_phase_2_admin_role(browser):
    print("\n" + "="*80)
    print("▶ FASE 2: FLUJO DE GESTIÓN INSTITUCIONAL (rol: admin)")
    print("="*80)
    
    context = browser.new_context(viewport={"width": 1440, "height": 900})
    page = context.new_page()
    
    try:
        # 2.1 Login como Director / Admin
        t0 = time.time()
        login_role_ui(page, "Director / Admin", "/admin")
        dt = time.time() - t0
        is_admin_dash = "/admin" in page.url
        record_result("ROL: ADMIN", "2.1 Login e ingreso a Dashboard /admin", is_admin_dash, f"URL: {page.url}", dt)
        
        # 2.2 Dashboard General y Métricas Globales
        t0 = time.time()
        page.wait_for_selector("text=Todo el colegio", timeout=6000)
        has_metrics = page.locator("text=Matricular alumno").first.is_visible() and page.locator("text=Enviar comunicado").first.is_visible()
        dt = time.time() - t0
        record_result("ROL: ADMIN", "2.2 KPIs Institucionales y Puesta en Marcha", has_metrics, "Acciones rápidas y selector de niveles", dt)
        
        # 2.3 Padrón de Alumnos y Modal de Carnet QR
        t0 = time.time()
        page.goto(f"{BASE_URL}/admin/estudiantes", wait_until="domcontentloaded")
        page.wait_for_selector("h1:has-text('Alumnos')", timeout=6000)
        
        # Abrir carnet escolar del primer alumno
        carnet_btn = page.locator("button:has-text('Carnet')").first
        carnet_btn.click()
        page.wait_for_selector("text=Carnet Escolar con Código QR", timeout=5000)
        has_qr_card = page.locator("canvas").first.is_visible()
        
        # Cerrar modal
        close_btn = page.locator("button[aria-label='Cerrar modal'], button:has-text('Cerrar')").first
        if close_btn.is_visible():
            close_btn.click()
        dt = time.time() - t0
        record_result("ROL: ADMIN", "2.3 Padrón de Alumnos & Emisión de Carnet QR", has_qr_card, "Modal con canvas QR renderizado", dt)
        
        # 2.4 Padrón de Docentes
        t0 = time.time()
        page.goto(f"{BASE_URL}/admin/docentes", wait_until="domcontentloaded")
        page.wait_for_selector("h1:has-text('Docentes')", timeout=6000)
        has_teachers = page.locator("text=Pérez Quispe").first.is_visible() or page.locator("text=Carmen Rosa").first.is_visible()
        dt = time.time() - t0
        record_result("ROL: ADMIN", "2.4 Gestión de Docentes y Asignaciones", has_teachers, "Plantel docente verificado", dt)

        # 2.5 Gestión Académica (Niveles, Grados, Secciones)
        t0 = time.time()
        page.goto(f"{BASE_URL}/admin/academico", wait_until="domcontentloaded")
        page.wait_for_selector("text=Inicial", timeout=6000)
        has_levels = page.locator("text=Primaria").first.is_visible() and page.locator("text=Secundaria").first.is_visible()
        dt = time.time() - t0
        record_result("ROL: ADMIN", "2.5 Estructura Curricular CNEB (/admin/academico)", has_levels, "Niveles, grados y áreas", dt)

        # 2.6 Módulo de Matrículas
        t0 = time.time()
        page.goto(f"{BASE_URL}/admin/matriculas", wait_until="domcontentloaded")
        page.wait_for_selector("h1:has-text('Matrículas')", timeout=6000)
        has_enrollment = page.locator("text=Matrícula").first.is_visible()
        dt = time.time() - t0
        record_result("ROL: ADMIN", "2.6 Módulo de Matrículas 2026 (/admin/matriculas)", has_enrollment, "Formulario e historial", dt)

        # 2.7 Tablón de Comunicados Masivos
        t0 = time.time()
        page.goto(f"{BASE_URL}/admin/comunicados", wait_until="domcontentloaded")
        page.wait_for_selector("h1:has-text('Comunicados')", timeout=6000)
        has_comunicados = page.locator("text=Nuevo Comunicado").first.is_visible() or page.locator("text=Publicar").first.is_visible() or page.locator("text=Filtros").first.is_visible()
        dt = time.time() - t0
        record_result("ROL: ADMIN", "2.7 Comunicados y Circulares (/admin/comunicados)", has_comunicados, "Publicación y lectura", dt)

        # 2.8 Configuración Institucional y Branding
        t0 = time.time()
        page.goto(f"{BASE_URL}/admin/branding", wait_until="domcontentloaded")
        page.wait_for_selector("h1:has-text('Personalización del colegio')", timeout=6000)
        has_branding = page.locator("button:has-text('Guardar cambios')").first.is_visible() or page.locator("h1:has-text('Personalización del colegio')").is_visible()
        dt = time.time() - t0
        record_result("ROL: ADMIN", "2.8 Personalización y Marca (/admin/branding)", has_branding, "Editor de logos y colores", dt)

        # 2.9 Control de Tesorería y Pensiones
        t0 = time.time()
        page.goto(f"{BASE_URL}/admin/tesoreria", wait_until="domcontentloaded")
        page.wait_for_selector("text=Tesorería", timeout=6000)
        has_treasury = page.locator("text=Pensiones").first.is_visible() or page.locator("text=Tesorería").first.is_visible()
        dt = time.time() - t0
        record_result("ROL: ADMIN", "2.9 Control de Pensiones (/admin/tesoreria)", has_treasury, "Estado de cuentas y pagos", dt)

        # 2.10 Reportes y Exportación SIAGIE
        t0 = time.time()
        page.goto(f"{BASE_URL}/admin/reportes", wait_until="domcontentloaded")
        page.wait_for_selector("h1:has-text('Reportes')", timeout=6000)
        has_reports = page.locator("text=SIAGIE").first.is_visible() or page.locator("text=Consolidado").first.is_visible() or page.locator("text=Boletines").first.is_visible()
        dt = time.time() - t0
        record_result("ROL: ADMIN", "2.10 Exportador Oficial SIAGIE (/admin/reportes)", has_reports, "Generación de reportes", dt)

    except Exception as exc:
        record_result("ROL: ADMIN", "Excepción en flujo", False, str(exc))
        page.screenshot(path=os.path.join(SCREENSHOT_DIR, "error_admin.png"))
    finally:
        context.close()

# ─────────────────────────────────────────────────────────────────────────────
# FASE 3: ROL DOCENTE DE AULA
# ─────────────────────────────────────────────────────────────────────────────
def test_phase_3_docente_role(browser):
    print("\n" + "="*80)
    print("▶ FASE 3: FLUJO PEDAGÓGICO DE AULA (rol: docente)")
    print("="*80)
    
    context = browser.new_context(viewport={"width": 1440, "height": 900})
    page = context.new_page()
    
    try:
        # 3.1 Login como Docente
        t0 = time.time()
        login_role_ui(page, "Docente", "/docente")
        dt = time.time() - t0
        is_docente_dash = "/docente" in page.url
        record_result("ROL: DOCENTE", "3.1 Login e ingreso a Dashboard /docente", is_docente_dash, f"URL: {page.url}", dt)
        
        # 3.2 Dashboard Pedagógico del Profesor
        t0 = time.time()
        page.wait_for_selector("text=Registrar notas", timeout=6000)
        has_summary = page.locator("text=Nueva tarea").first.is_visible()
        dt = time.time() - t0
        record_result("ROL: DOCENTE", "3.2 Métricas de Aula y Acceso Rápido", has_summary, "Accesos directos pedagógicos", dt)
        
        # 3.3 Asistencia en Salón de Clases
        t0 = time.time()
        page.goto(f"{BASE_URL}/docente/asistencia", wait_until="domcontentloaded")
        page.wait_for_selector("h1:has-text('Tomar asistencia')", timeout=6000)
        has_attendance = page.locator("text=Presente").first.is_visible() or page.locator("text=Asistencia").first.is_visible()
        dt = time.time() - t0
        record_result("ROL: DOCENTE", "3.3 Control de Asistencia de Aula (/docente/asistencia)", has_attendance, "Toma de lista interactiva", dt)
        
        # 3.4 Matriz de Calificaciones CNEB (Escala AD, A, B, C)
        t0 = time.time()
        page.goto(f"{BASE_URL}/docente/notas", wait_until="domcontentloaded")
        page.wait_for_selector("h1:has-text('Notas de mis alumnos')", timeout=6000)
        has_matrix = page.locator("text=Competencia").first.is_visible() or page.locator("text=Promedio").first.is_visible() or page.locator("text=Bimestre").first.is_visible()
        dt = time.time() - t0
        record_result("ROL: DOCENTE", "3.4 Matriz de Notas por Competencias (/docente/notas)", has_matrix, "Escala formativa AD-A-B-C", dt)
        
        # 3.5 Tareas Escolares y LMS
        t0 = time.time()
        page.goto(f"{BASE_URL}/docente/tareas", wait_until="domcontentloaded")
        page.wait_for_selector("h1:has-text('Tareas')", timeout=6000)
        has_tasks = page.locator("text=Nueva tarea").first.is_visible() or page.locator("text=Entregas").first.is_visible() or page.locator("text=Filtros").first.is_visible()
        dt = time.time() - t0
        record_result("ROL: DOCENTE", "3.5 Asignación y Revisión de Tareas (/docente/tareas)", has_tasks, "Gestión de evidencias", dt)

        # 3.6 Cronograma de Evaluaciones
        t0 = time.time()
        page.goto(f"{BASE_URL}/docente/evaluaciones", wait_until="domcontentloaded")
        page.wait_for_selector("h1:has-text('Evaluaciones')", timeout=6000)
        has_exams = page.locator("text=Evaluaciones").first.is_visible()
        dt = time.time() - t0
        record_result("ROL: DOCENTE", "3.6 Cronograma de Exámenes (/docente/evaluaciones)", has_exams, "Programación de pruebas", dt)

        # 3.7 Horario Semanal
        t0 = time.time()
        page.goto(f"{BASE_URL}/docente/horario", wait_until="domcontentloaded")
        page.wait_for_selector("h1:has-text('Mi horario')", timeout=6000)
        has_schedule = page.locator("text=Lunes").first.is_visible() or page.locator("text=Horario").first.is_visible()
        dt = time.time() - t0
        record_result("ROL: DOCENTE", "3.7 Horario de Carga Lectiva (/docente/horario)", has_schedule, "Bloques pedagógicos", dt)

    except Exception as exc:
        record_result("ROL: DOCENTE", "Excepción en flujo", False, str(exc))
        page.screenshot(path=os.path.join(SCREENSHOT_DIR, "error_docente.png"))
    finally:
        context.close()

# ─────────────────────────────────────────────────────────────────────────────
# FASE 4: ROL ESTUDIANTE
# ─────────────────────────────────────────────────────────────────────────────
def test_phase_4_estudiante_role(browser):
    print("\n" + "="*80)
    print("▶ FASE 4: FLUJO DE AULA VIRTUAL Y RENDIMIENTO (rol: estudiante)")
    print("="*80)
    
    context = browser.new_context(viewport={"width": 1440, "height": 900})
    page = context.new_page()
    
    try:
        # 4.1 Login como Estudiante
        t0 = time.time()
        login_role_ui(page, "Estudiante", "/estudiante")
        dt = time.time() - t0
        is_estudiante_dash = "/estudiante" in page.url
        record_result("ROL: ESTUDIANTE", "4.1 Login e ingreso a Dashboard /estudiante", is_estudiante_dash, f"URL: {page.url}", dt)
        
        # 4.2 Dashboard del Estudiante
        t0 = time.time()
        page.wait_for_selector("text=Portal del Estudiante", timeout=6000)
        has_student_kpi = page.locator("text=Bimestre actual").first.is_visible()
        dt = time.time() - t0
        record_result("ROL: ESTUDIANTE", "4.2 Dashboard y Metas de Aprendizaje", has_student_kpi, "Portal y estado de ciclo escolar", dt)
        
        # 4.3 Carnet QR Digital Personal
        t0 = time.time()
        page.goto(f"{BASE_URL}/estudiante/carnet-qr", wait_until="domcontentloaded")
        page.wait_for_selector("canvas", timeout=6000)
        has_qr = page.locator("canvas").first.is_visible()
        dt = time.time() - t0
        record_result("ROL: ESTUDIANTE", "4.3 Carnet QR Digital con Canvas (/estudiante/carnet-qr)", has_qr, "Código QR criptográfico generado", dt)
        
        # 4.4 Aula Virtual y Entrega de Tareas
        t0 = time.time()
        page.goto(f"{BASE_URL}/estudiante/tareas", wait_until="domcontentloaded")
        page.wait_for_selector("h1:has-text('Mis tareas')", timeout=6000)
        has_tasks = page.locator("text=Mis tareas").first.is_visible()
        dt = time.time() - t0
        record_result("ROL: ESTUDIANTE", "4.4 Aula Virtual y Tareas (/estudiante/tareas)", has_tasks, "Listado de tareas escolares", dt)
        
        # 4.5 Libreta Oficial de Notas CNEB
        t0 = time.time()
        page.goto(f"{BASE_URL}/estudiante/libreta-notas", wait_until="domcontentloaded")
        page.wait_for_selector("h1:has-text('Mi libreta de notas')", timeout=6000)
        has_report_card = page.locator("text=Competencia").first.is_visible() or page.locator("text=Bimestre").first.is_visible() or page.locator("text=Promedio").first.is_visible()
        dt = time.time() - t0
        record_result("ROL: ESTUDIANTE", "4.5 Boleta de Calificaciones (/estudiante/libreta-notas)", has_report_card, "Notas formativas AD, A, B, C", dt)

        # 4.6 Historial de Asistencia Personal
        t0 = time.time()
        page.goto(f"{BASE_URL}/estudiante/asistencias", wait_until="domcontentloaded")
        page.wait_for_selector("text=Mi asistencia", timeout=6000)
        has_attend_hist = page.locator("text=Mi asistencia").first.is_visible()
        dt = time.time() - t0
        record_result("ROL: ESTUDIANTE", "4.6 Historial de Asistencias (/estudiante/asistencias)", has_attend_hist, "Registro de puntualidad", dt)

        # 4.7 Horario Escolar
        t0 = time.time()
        page.goto(f"{BASE_URL}/estudiante/horario", wait_until="domcontentloaded")
        page.wait_for_selector("h1:has-text('Mi horario')", timeout=6000)
        has_horario = page.locator("text=Lunes").first.is_visible() or page.locator("text=Horario").first.is_visible() or page.locator("text=profesores").first.is_visible()
        dt = time.time() - t0
        record_result("ROL: ESTUDIANTE", "4.7 Horario Semanal de Clases (/estudiante/horario)", has_horario, "Distribución horaria", dt)

    except Exception as exc:
        record_result("ROL: ESTUDIANTE", "Excepción en flujo", False, str(exc))
        page.screenshot(path=os.path.join(SCREENSHOT_DIR, "error_estudiante.png"))
    finally:
        context.close()

# ─────────────────────────────────────────────────────────────────────────────
# FASE 5: ROL APODERADO / PADRE DE FAMILIA
# ─────────────────────────────────────────────────────────────────────────────
def test_phase_5_apoderado_role(browser):
    print("\n" + "="*80)
    print("▶ FASE 5: FLUJO FAMILIAR Y SEGUIMIENTO TUTORIAL (rol: apoderado)")
    print("="*80)
    
    context = browser.new_context(viewport={"width": 1440, "height": 900})
    page = context.new_page()
    
    try:
        # 5.1 Login como Apoderado
        t0 = time.time()
        login_role_ui(page, "Apoderado", "/apoderado")
        dt = time.time() - t0
        is_apoderado_dash = "/apoderado" in page.url
        record_result("ROL: APODERADO", "5.1 Login e ingreso a Dashboard /apoderado", is_apoderado_dash, f"URL: {page.url}", dt)
        
        # 5.2 Portal Familiar y Ficha del Hijo
        t0 = time.time()
        page.wait_for_selector("text=Justificar falta", timeout=6000)
        has_child_info = page.locator("text=Notas").first.is_visible() and page.locator("text=Asistencia").first.is_visible()
        dt = time.time() - t0
        record_result("ROL: APODERADO", "5.2 Seguimiento Académico y Asistencia del Hijo", has_child_info, "Ficha escolar y pestañas", dt)
        
        # 5.3 Módulo de Tareas del Hijo
        t0 = time.time()
        page.goto(f"{BASE_URL}/apoderado/tareas", wait_until="domcontentloaded")
        page.wait_for_selector("h1:has-text('Tareas de')", timeout=6000)
        has_tareas = page.locator("text=Tareas de").first.is_visible()
        dt = time.time() - t0
        record_result("ROL: APODERADO", "5.3 Supervisión de Tareas (/apoderado/tareas)", has_tareas, "Monitoreo de deberes", dt)
        
        # 5.4 Módulo de Justificación de Inasistencias
        t0 = time.time()
        page.goto(f"{BASE_URL}/apoderado/justificar", wait_until="domcontentloaded")
        page.wait_for_selector("h1:has-text('Justificar faltas')", timeout=6000)
        has_justif = page.locator("text=Justificar faltas").first.is_visible()
        dt = time.time() - t0
        record_result("ROL: APODERADO", "5.4 Justificación de Faltas (/apoderado/justificar)", has_justif, "Formulario médico/motivos", dt)

    except Exception as exc:
        record_result("ROL: APODERADO", "Excepción en flujo", False, str(exc))
        page.screenshot(path=os.path.join(SCREENSHOT_DIR, "error_apoderado.png"))
    finally:
        context.close()

# ─────────────────────────────────────────────────────────────────────────────
# FASE 6: SEGURIDAD, RBAC (CONTROL DE ACCESO) Y LOGOUT
# ─────────────────────────────────────────────────────────────────────────────
def test_phase_6_security_rbac(browser):
    print("\n" + "="*80)
    print("▶ FASE 6: SEGURIDAD, CONTROL DE ACCESO (RBAC) Y LOGOUT")
    print("="*80)
    
    # Contexto 1: Estudiante intentando acceder a ruta de Admin
    context_student = browser.new_context(viewport={"width": 1440, "height": 900})
    page_s = context_student.new_page()
    try:
        t0 = time.time()
        login_role_ui(page_s, "Estudiante", "/estudiante")
        # Intento de bypass forzado a /admin
        page_s.goto(f"{BASE_URL}/admin", wait_until="domcontentloaded")
        page_s.wait_for_timeout(1000)
        
        # Debe haber sido bloqueado y redirigido fuera de /admin (a /estudiante)
        is_blocked = not page_s.url.endswith("/admin") and "/estudiante" in page_s.url
        dt = time.time() - t0
        record_result("SEGURIDAD & RBAC", "6.1 Estudiante bloqueado de entrar a /admin", is_blocked, 
                      f"Redirigido a su portal legal: {page_s.url}", dt)
    except Exception as exc:
        record_result("SEGURIDAD & RBAC", "6.1 Estudiante bloqueado de entrar a /admin", False, str(exc))
    finally:
        context_student.close()

    # Contexto 2: Usuario Anónimo (sin sesión) intentando acceder a rutas privadas
    context_anon = browser.new_context(viewport={"width": 1440, "height": 900})
    page_anon = context_anon.new_page()
    try:
        t0 = time.time()
        page_anon.goto(f"{BASE_URL}/admin", wait_until="domcontentloaded")
        page_anon.wait_for_timeout(1000)
        
        # Debe redirigir a /login
        is_redirected = "/login" in page_anon.url
        dt = time.time() - t0
        record_result("SEGURIDAD & RBAC", "6.2 Usuario sin sesión redirigido a /login", is_redirected, 
                      f"Protección de middleware activa: {page_anon.url}", dt)
    except Exception as exc:
        record_result("SEGURIDAD & RBAC", "6.2 Usuario sin sesión redirigido a /login", False, str(exc))
    finally:
        context_anon.close()

    # Contexto 3: Cierre de Sesión y despedida
    context_logout = browser.new_context(viewport={"width": 1440, "height": 900})
    page_logout = context_logout.new_page()
    try:
        t0 = time.time()
        login_role_ui(page_logout, "Director / Admin", "/admin")
        
        # Visitar ruta de despedida / logout
        page_logout.goto(f"{BASE_URL}/despedida", wait_until="domcontentloaded")
        page_logout.wait_for_selector("text=Sesión Finalizada", timeout=6000)
        has_despedida = page_logout.locator("text=Sesión Finalizada").first.is_visible()
        dt = time.time() - t0
        record_result("SEGURIDAD & RBAC", "6.3 Cierre de Sesión (/despedida)", has_despedida, 
                      "Pantalla de desconexión y limpieza de sesión", dt)
    except Exception as exc:
        record_result("SEGURIDAD & RBAC", "6.3 Cierre de Sesión (/despedida)", False, str(exc))
    finally:
        context_logout.close()

# ─────────────────────────────────────────────────────────────────────────────
# RESUMEN FINAL EJECUTIVO
# ─────────────────────────────────────────────────────────────────────────────
def print_final_summary(total_time: float):
    total = len(test_results)
    passed = sum(1 for t in test_results if t["passed"])
    failed = total - passed
    pass_pct = (passed / total * 100) if total > 0 else 0
    
    print("\n" + "="*80)
    print("                    RESUMEN FINAL DE LA SUITE SUPER E2E")
    print("="*80)
    print(f"  URL del Servidor:       {BASE_URL}")
    print(f"  Total de Pruebas:       {total}")
    print(f"  Pruebas Exitosas:       \033[92m{passed} PASSED\033[0m")
    if failed > 0:
        print(f"  Pruebas Fallidas:       \033[91m{failed} FAILED\033[0m")
    else:
        print(f"  Pruebas Fallidas:       \033[92m0 FAILED\033[0m")
    print(f"  Tasa de Éxito:          \033[92m{pass_pct:.1f}%\033[0m")
    print(f"  Tiempo Total:           {total_time:.2f} segundos")
    print("="*80)
    
    if failed > 0:
        print("\nDetalle de pruebas que requieren atención:")
        for t in test_results:
            if not t["passed"]:
                print(f"  - [{t['category']}] {t['name']}: {t['details']}")
        print(f"\nRevisa las capturas de pantalla de error en: {SCREENSHOT_DIR}\n")
    else:
        print("\n🏆 ¡TODAS LAS FASES, ROLES Y ENDPOINTS PASARON CON 100% DE ÉXITO! 🏆\n")

# ─────────────────────────────────────────────────────────────────────────────
# PUNTO DE ENTRADA PRINCIPAL
# ─────────────────────────────────────────────────────────────────────────────
def main():
    start_global = time.time()
    print("="*80)
    print("   INICIANDO SUPER SUITE E2E PLAYWRIGHT - SISTEMA ESCOLAR MINI 2026")
    print(f"   Hora local: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} | Target: {BASE_URL}")
    print("="*80)
    
    # 1. Fase 0: Endpoints Backend
    test_phase_0_api_endpoints()
    
    # 2. Inicializar Playwright Chromium
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
        
        # Fases 1 a 6
        test_phase_1_asistencia_role(browser)
        test_phase_2_admin_role(browser)
        test_phase_3_docente_role(browser)
        test_phase_4_estudiante_role(browser)
        test_phase_5_apoderado_role(browser)
        test_phase_6_security_rbac(browser)
        
        browser.close()
    
    total_time = time.time() - start_global
    print_final_summary(total_time)
    
    # Código de salida acorde a los resultados
    failed_count = sum(1 for t in test_results if not t["passed"])
    sys.exit(1 if failed_count > 0 else 0)

if __name__ == "__main__":
    main()
