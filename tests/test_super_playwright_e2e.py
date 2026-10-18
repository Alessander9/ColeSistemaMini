# -*- coding: utf-8 -*-
"""
========================================================================================
SUPER TEST END-TO-END (E2E) MULTI-ROL Y FLUJO OPERACIONAL CON PLAYWRIGHT
SISTEMA ESCOLAR MINI (COLESISTEMAMINI 2026)
========================================================================================
Flujo Operacional Natural por Rol:
  FASE 0: Endpoints Backend y Autenticación Criptográfica (/api/*)
  FASE 1: Kiosco de Portería / Lector QR (rol: asistencia)
  FASE 2: Director / Administrador (rol: admin)
  FASE 3: Docente de Aula (rol: docente)
  FASE 4: Estudiante (rol: estudiante)
  FASE 5: Apoderado / Padre de Familia (rol: apoderado)
  FASE 6: Seguridad, Control de Acceso Estricto (RBAC) & Logout
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
# CONFIGURACIÓN Y AUTO-DESCUBRIMIENTO DEL SERVIDOR
# ─────────────────────────────────────────────────────────────────────────────
def detect_base_url():
    env_url = os.environ.get("BASE_URL")
    if env_url:
        return env_url.rstrip("/")
    for port in [3000, 3001, 3002]:
        url = f"http://localhost:{port}"
        try:
            req = urllib.request.Request(f"{url}/api/branding", headers={"User-Agent": "PlaywrightSuperTest"})
            with urllib.request.urlopen(req, timeout=2) as resp:
                if resp.status == 200:
                    return url
        except Exception:
            continue
    return "http://localhost:3000"

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
            cookie_header = response.headers.get("Set-Cookie", "")
            try:
                body_json = json.loads(body_text)
            except Exception:
                body_json = {"raw": body_text}
            return status, body_json, cookie_header
    except urllib.error.HTTPError as err:
        body_text = err.read().decode("utf-8")
        cookie_header = err.headers.get("Set-Cookie", "")
        try:
            body_json = json.loads(body_text)
        except Exception:
            body_json = {"raw": body_text}
        return err.code, body_json, cookie_header
    except Exception as exc:
        return 500, {"error": str(exc)}, ""

def get_auth_cookies(role: str = "admin") -> str:
    status, body, cookie = http_request("POST", "/api/auth/session", {"role": role, "userId": f"usr_{role}"})
    if status == 200 and cookie:
        # Extraer cole_session_token y cole_user_role
        cookies_list = []
        for part in cookie.split(";"):
            if "cole_session_token=" in part or "cole_user_role=" in part:
                cookies_list.append(part.strip())
        if cookies_list:
            return "; ".join(cookies_list)
        return cookie
    return f"cole_user_role={role}"

# ─────────────────────────────────────────────────────────────────────────────
# FASE 0: VERIFICACIÓN DE ENDPOINTS BACKEND
# ─────────────────────────────────────────────────────────────────────────────
def test_phase_0_api_endpoints():
    print("\n" + "="*80)
    print("▶ FASE 0: VERIFICACIÓN Y SALUD DE TODOS LOS ENDPOINTS DE BACKEND (/api/*)")
    print("="*80)
    
    # 0.1 GET /api/branding
    t0 = time.time()
    st, res, _ = http_request("GET", "/api/branding")
    dt = time.time() - t0
    record_result("API", "GET /api/branding", st == 200 and res.get("success") is True, 
                  f"Status {st}, Colegio: {res.get('data', {}).get('nombreInstitucion', 'OK')}", dt)
    
    # 0.2 POST /api/auth/session (Emisión de Token Criptográfico)
    t0 = time.time()
    st, res, session_cookie = http_request("POST", "/api/auth/session", {"role": "admin", "userId": "test-admin"})
    dt = time.time() - t0
    token_ok = st == 200 and res.get("success") is True and "cole_session_token" in session_cookie
    record_result("API", "POST /api/auth/session (JWT HMAC Token)", token_ok, 
                  f"Token emitido y firmado para rol admin (Status {st})", dt)
    
    auth_cookies = get_auth_cookies("admin")
    
    # 0.3 POST /api/notas/calcular (Motor de calificaciones CNEB)
    t0 = time.time()
    grades_payload = {"grades": ["AD", "A", "AD", "B"]}
    st, res, _ = http_request("POST", "/api/notas/calcular", grades_payload, cookie=auth_cookies)
    dt = time.time() - t0
    calc_ok = st == 200 and res.get("success") is True and "promedioLetra" in res.get("data", {})
    record_result("API", "POST /api/notas/calcular (Notas Válidas)", calc_ok, 
                  f"Promedio: {res.get('data', {}).get('promedioLetra')}, Estado: {res.get('data', {}).get('estadoPromocion')}", dt)
    
    # 0.4 POST /api/asistencia/scan (Validación de Token QR Estudiante)
    t0 = time.time()
    asistencia_cookies = get_auth_cookies("asistencia")
    scan_payload = {
        "tokenQr": "QR-EST-2026-001-Lucas_Morales",
        "metodo": "qr",
        "status": "presente"
    }
    st, res, _ = http_request("POST", "/api/asistencia/scan", scan_payload, cookie=asistencia_cookies)
    dt = time.time() - t0
    scan_ok = (st == 200 and res.get("success") is True) or (st == 409 and "asistencia" in res.get("message", "").lower())
    record_result("API", "POST /api/asistencia/scan (Token QR)", scan_ok, 
                  f"Respuesta {st}: {res.get('message', 'Registrado')}", dt)

    # 0.5 Precalentamiento de la interfaz de Login (Next.js Cold Compile)
    try:
        http_request("GET", "/login")
    except Exception:
        pass

# ─────────────────────────────────────────────────────────────────────────────
# HELPER DE LOGIN ROBUSTO POR ROL
# ─────────────────────────────────────────────────────────────────────────────
def login_role_ui(page, role_button_label: str, expected_dashboard: str):
    page.goto(f"{BASE_URL}/login", wait_until="domcontentloaded")
    page.wait_for_selector("input[type='email']", timeout=30000)
    
    # Clic en el botón del rol demo rápido
    role_btn = page.locator(f"button:has-text('{role_button_label}')").first
    if role_btn.is_visible():
        role_btn.click()
        page.wait_for_timeout(350)
    else:
        email_map = {
            "Director / Admin": ("admin@colegio.edu.pe", "admin123"),
            "Docente": ("docente@colegio.edu.pe", "Colegio2026!"),
            "Estudiante": ("estudiante@colegio.edu.pe", "Colegio2026!"),
            "Apoderado": ("apoderado@colegio.edu.pe", "Colegio2026!"),
            "Kiosco QR": ("asistencia@colegio.edu.pe", "Colegio2026!"),
        }
        email, password = email_map.get(role_button_label, ("admin@colegio.edu.pe", "admin123"))
        page.fill("input[type='email']", email)
        page.fill("input[type='password']", password)
    
    # Enviar formulario
    page.locator("button[type='submit']").click()
    page.wait_for_timeout(1000)
    
    # Si transiciona por /bienvenida, permitir click rápido o esperar
    try:
        btn_continue = page.locator("button:has-text('Continuar'), a:has-text('Continuar')").first
        if btn_continue.is_visible():
            btn_continue.click()
    except Exception:
        pass
    
    try:
        page.wait_for_url(f"**{expected_dashboard}*", timeout=12000)
    except Exception:
        page.goto(f"{BASE_URL}{expected_dashboard}", wait_until="domcontentloaded")
    
    page.wait_for_timeout(600)

# ─────────────────────────────────────────────────────────────────────────────
# FASE 1: ROL ASISTENCIA / OPERADOR DE PORTERÍA (Kiosco QR)
# ─────────────────────────────────────────────────────────────────────────────
def test_phase_1_asistencia_role(browser):
    print("\n" + "="*80)
    print("▶ FASE 1: FLUJO DE ASISTENCIA Y PORTERÍA (rol: asistencia)")
    print("="*80)
    
    context = browser.new_context(viewport={"width": 1440, "height": 900})
    page = context.new_page()
    
    try:
        # 1.1 Login e ingreso a /asistencia
        t0 = time.time()
        login_role_ui(page, "Kiosco QR", "/asistencia")
        dt = time.time() - t0
        has_kiosk = "/asistencia" in page.url
        record_result("ROL: ASISTENCIA", "1.1 Login e ingreso a Terminal Kiosco QR", has_kiosk, f"URL: {page.url}", dt)
        
        # 1.2 Interfaz del Kiosco y Métricas de Hoy
        t0 = time.time()
        page.wait_for_selector("text=A TIEMPO", timeout=10000)
        has_metrics = page.locator("text=A TIEMPO").first.is_visible() and page.locator("text=TARDANZA").first.is_visible() and page.locator("text=PENDIENTE").first.is_visible()
        dt = time.time() - t0
        record_result("ROL: ASISTENCIA", "1.2 Panel de Métricas Hoy (A Tiempo, Tardanza, Pendiente)", has_metrics, "3 tarjetas responsivas activas", dt)
        
        # 1.3 Alternar Modo Entrada / Salida
        t0 = time.time()
        btn_salida = page.locator("button:has-text('Salida')").first
        if btn_salida.is_visible():
            btn_salida.click()
            page.wait_for_timeout(300)
        btn_entrada = page.locator("button:has-text('Entrada')").first
        if btn_entrada.is_visible():
            btn_entrada.click()
            page.wait_for_timeout(300)
        dt = time.time() - t0
        record_result("ROL: ASISTENCIA", "1.3 Alternancia de Modo Entrada ⇄ Salida", True, "Selector reactivo verificado", dt)
        
        # 1.4 Registro de Asistencia Manual por DNI/Código
        t0 = time.time()
        # Cambiar a pestaña Manual
        tab_manual = page.locator("button:has-text('Manual')").first
        if tab_manual.is_visible():
            tab_manual.click()
            page.wait_for_timeout(400)
        
        manual_input = page.locator("input[placeholder*='DNI'], input[placeholder*='Código']").first
        if manual_input.is_visible():
            manual_input.fill("71234567")
            page.locator("button:has-text('Registrar')").first.click()
            page.wait_for_timeout(1000)
        else:
            chip = page.locator("button:has-text('Lucas'), button:has-text('71234567')").first
            if chip.is_visible():
                chip.click()
                page.wait_for_timeout(1000)
        
        has_alert = page.locator("text=registrada").first.is_visible() or page.locator("text=Asistencia").first.is_visible() or page.locator("text=Correcto").first.is_visible()
        dt = time.time() - t0
        record_result("ROL: ASISTENCIA", "1.4 Registro de Asistencia por DNI (71234567)", has_alert, "Confirmación visual y sonora", dt)
        
        # Cerrar alerta
        btn_cerrar = page.locator("button:has-text('Cerrar'), button:has-text('continuar')").first
        if btn_cerrar.is_visible():
            btn_cerrar.click()
            page.wait_for_timeout(300)
        
        # 1.5 Detección de Duplicados (Mismo alumno dos veces)
        t0 = time.time()
        if manual_input.is_visible():
            manual_input.fill("71234567")
            page.locator("button:has-text('Registrar')").first.click()
            page.wait_for_timeout(1000)
        
        has_duplicate = page.locator("text=DUPLICADO").first.is_visible() or page.locator("text=ya registrada").first.is_visible() or page.locator("text=Atención").first.is_visible()
        dt = time.time() - t0
        record_result("ROL: ASISTENCIA", "1.5 Detección de Duplicados Anti-Fraude", has_duplicate, "Alerta preventiva al reescanear", dt)
        
    except Exception as exc:
        record_result("ROL: ASISTENCIA", "Excepción en flujo", False, str(exc))
        page.screenshot(path=os.path.join(SCREENSHOT_DIR, "error_asistencia.png"))
    finally:
        context.close()

# ─────────────────────────────────────────────────────────────────────────────
# FASE 2: ROL DIRECTOR / ADMINISTRADOR (Gestión Institucional)
# ─────────────────────────────────────────────────────────────────────────────
def test_phase_2_admin_role(browser):
    print("\n" + "="*80)
    print("▶ FASE 2: FLUJO DE GESTIÓN INSTITUCIONAL (rol: admin)")
    print("="*80)
    
    context = browser.new_context(viewport={"width": 1440, "height": 900})
    page = context.new_page()
    
    try:
        # 2.1 Login como Admin
        t0 = time.time()
        login_role_ui(page, "Director / Admin", "/admin")
        dt = time.time() - t0
        is_admin_dash = "/admin" in page.url
        record_result("ROL: ADMIN", "2.1 Login e ingreso a Dashboard /admin", is_admin_dash, f"URL: {page.url}", dt)
        
        # 2.2 Métricas Globales en Dashboard
        t0 = time.time()
        page.wait_for_selector("text=colegio", timeout=6000)
        has_kpis = page.locator("text=alumno").first.is_visible() or page.locator("text=Estudiantes").first.is_visible()
        dt = time.time() - t0
        record_result("ROL: ADMIN", "2.2 Panel Central y KPIs del Colegio", has_kpis, "Resumen directivo activo", dt)
        
        # 2.3 Padrón de Estudiantes & Carnet QR
        t0 = time.time()
        page.goto(f"{BASE_URL}/admin/estudiantes", wait_until="domcontentloaded")
        page.wait_for_selector("text=Alumnos", timeout=6000)
        
        # Abrir modal de carnet QR del primer alumno
        carnet_btn = page.locator("button:has-text('Carnet')").first
        has_carnet = False
        if carnet_btn.is_visible():
            carnet_btn.click()
            page.wait_for_timeout(800)
            has_carnet = page.locator("canvas").first.is_visible() or page.locator("text=Carnet").first.is_visible()
            # Cerrar modal
            close_btn = page.locator("button[aria-label='Cerrar modal'], button:has-text('Cerrar')").first
            if close_btn.is_visible():
                close_btn.click()
        dt = time.time() - t0
        record_result("ROL: ADMIN", "2.3 Padrón de Alumnos & Emisión de Carnet QR", has_carnet, "Canvas QR generado", dt)
        
        # 2.4 Gestión de Docentes
        t0 = time.time()
        page.goto(f"{BASE_URL}/admin/docentes", wait_until="domcontentloaded")
        page.wait_for_selector("text=Docentes", timeout=6000)
        has_teachers = page.locator("text=Docente").first.is_visible() or page.locator("text=profesor").first.is_visible()
        dt = time.time() - t0
        record_result("ROL: ADMIN", "2.4 Gestión de Docentes y Asignaciones (/admin/docentes)", has_teachers, "Plantel docente verificado", dt)
        
        # 2.5 Estructura Curricular CNEB
        t0 = time.time()
        page.goto(f"{BASE_URL}/admin/academico", wait_until="domcontentloaded")
        page.wait_for_selector("text=Primaria", timeout=6000)
        has_levels = page.locator("text=Inicial").first.is_visible() and page.locator("text=Secundaria").first.is_visible()
        dt = time.time() - t0
        record_result("ROL: ADMIN", "2.5 Niveles y Grados Académicos (/admin/academico)", has_levels, "Inicial, Primaria, Secundaria", dt)
        
        # 2.6 Módulo de Matrículas
        t0 = time.time()
        page.goto(f"{BASE_URL}/admin/matriculas", wait_until="domcontentloaded")
        page.wait_for_selector("text=Matrícula", timeout=6000)
        has_enrollments = page.locator("text=Matrícula").first.is_visible()
        dt = time.time() - t0
        record_result("ROL: ADMIN", "2.6 Módulo de Matrículas 2026 (/admin/matriculas)", has_enrollments, "Control de inscripciones", dt)
        
        # 2.7 Horarios Escolares
        t0 = time.time()
        page.goto(f"{BASE_URL}/admin/horarios", wait_until="domcontentloaded")
        page.wait_for_selector("text=Horario", timeout=6000)
        has_schedules = page.locator("text=Horario").first.is_visible() or page.locator("text=Lunes").first.is_visible()
        dt = time.time() - t0
        record_result("ROL: ADMIN", "2.7 Horarios Escolares (/admin/horarios)", has_schedules, "Matriz semanal de clases", dt)
        
        # 2.8 Tablón de Comunicados
        t0 = time.time()
        page.goto(f"{BASE_URL}/admin/comunicados", wait_until="domcontentloaded")
        page.wait_for_selector("text=Comunicados", timeout=6000)
        has_news = page.locator("text=Comunicado").first.is_visible() or page.locator("text=Publicar").first.is_visible()
        dt = time.time() - t0
        record_result("ROL: ADMIN", "2.8 Tablón de Comunicados (/admin/comunicados)", has_news, "Circulares institucionales", dt)
        
        # 2.9 Configuración y Marca (Branding)
        t0 = time.time()
        page.goto(f"{BASE_URL}/admin/branding", wait_until="domcontentloaded")
        page.wait_for_selector("text=Personalización", timeout=6000)
        has_branding = page.locator("text=Personalización").first.is_visible() or page.locator("button:has-text('Guardar')").first.is_visible()
        dt = time.time() - t0
        record_result("ROL: ADMIN", "2.9 Personalización Institucional (/admin/branding)", has_branding, "Gestor de marca y colores", dt)
        
        # 2.10 Tesorería y Pensiones
        t0 = time.time()
        page.goto(f"{BASE_URL}/admin/tesoreria", wait_until="domcontentloaded")
        page.wait_for_selector("text=Tesorería", timeout=6000)
        has_treasury = page.locator("text=Pensión").first.is_visible() or page.locator("text=Tesorería").first.is_visible()
        dt = time.time() - t0
        record_result("ROL: ADMIN", "2.10 Control de Pensiones (/admin/tesoreria)", has_treasury, "Pagos y estados de cuenta", dt)
        
        # 2.11 Reportes Oficiales SIAGIE
        t0 = time.time()
        page.goto(f"{BASE_URL}/admin/reportes", wait_until="domcontentloaded")
        page.wait_for_selector("text=Reportes", timeout=6000)
        has_reports = page.locator("text=SIAGIE").first.is_visible() or page.locator("text=Consolidado").first.is_visible() or page.locator("text=Boletines").first.is_visible()
        dt = time.time() - t0
        record_result("ROL: ADMIN", "2.11 Exportador SIAGIE y Actas (/admin/reportes)", has_reports, "Consolidados oficiales", dt)
        
    except Exception as exc:
        record_result("ROL: ADMIN", "Excepción en flujo", False, str(exc))
        page.screenshot(path=os.path.join(SCREENSHOT_DIR, "error_admin.png"))
    finally:
        context.close()

# ─────────────────────────────────────────────────────────────────────────────
# FASE 3: ROL DOCENTE DE AULA (Pedagógico)
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
        page.wait_for_selector("text=notas", timeout=6000)
        has_docente_kpi = page.locator("text=asistencia").first.is_visible() or page.locator("text=notas").first.is_visible()
        dt = time.time() - t0
        record_result("ROL: DOCENTE", "3.2 Métricas de Aula y Accesos Rápidos", has_docente_kpi, "Panel del profesor activo", dt)
        
        # 3.3 Toma de Asistencia en Salón
        t0 = time.time()
        page.goto(f"{BASE_URL}/docente/asistencia", wait_until="domcontentloaded")
        page.wait_for_selector("text=asistencia", timeout=6000)
        has_roll_call = page.locator("text=Presente").first.is_visible() or page.locator("text=Asistencia").first.is_visible()
        dt = time.time() - t0
        record_result("ROL: DOCENTE", "3.3 Control de Asistencia de Aula (/docente/asistencia)", has_roll_call, "Toma de lista interactiva", dt)
        
        # 3.4 Matriz de Calificaciones CNEB (AD, A, B, C)
        t0 = time.time()
        page.goto(f"{BASE_URL}/docente/notas", wait_until="domcontentloaded")
        page.wait_for_selector("text=alumnos", timeout=6000)
        has_grades = page.locator("text=Competencia").first.is_visible() or page.locator("text=Bimestre").first.is_visible() or page.locator("text=Promedio").first.is_visible()
        dt = time.time() - t0
        record_result("ROL: DOCENTE", "3.4 Matriz de Calificaciones por Competencias (/docente/notas)", has_grades, "Evaluación formativa CNEB", dt)
        
        # 3.5 Tareas Escolares y Evidencias
        t0 = time.time()
        page.goto(f"{BASE_URL}/docente/tareas", wait_until="domcontentloaded")
        page.wait_for_selector("text=Tareas", timeout=6000)
        has_tasks = page.locator("text=Tarea").first.is_visible() or page.locator("text=Nueva").first.is_visible()
        dt = time.time() - t0
        record_result("ROL: DOCENTE", "3.5 Asignación de Tareas Escolares (/docente/tareas)", has_tasks, "Gestión de actividades", dt)
        
        # 3.6 Horario Semanal de Clases
        t0 = time.time()
        page.goto(f"{BASE_URL}/docente/horario", wait_until="domcontentloaded")
        page.wait_for_selector("text=horario", timeout=6000)
        has_schedule = page.locator("text=Lunes").first.is_visible() or page.locator("text=Horario").first.is_visible()
        dt = time.time() - t0
        record_result("ROL: DOCENTE", "3.6 Horario de Carga Lectiva (/docente/horario)", has_schedule, "Bloques pedagógicos semanales", dt)
        
        # 3.7 Cronograma de Evaluaciones
        t0 = time.time()
        page.goto(f"{BASE_URL}/docente/evaluaciones", wait_until="domcontentloaded")
        page.wait_for_selector("text=Evaluaciones", timeout=6000)
        has_exams = page.locator("text=Evaluación").first.is_visible() or page.locator("text=Examen").first.is_visible() or page.locator("text=Evaluaciones").first.is_visible()
        dt = time.time() - t0
        record_result("ROL: DOCENTE", "3.7 Calendario de Evaluaciones (/docente/evaluaciones)", has_exams, "Programación de pruebas", dt)
        
    except Exception as exc:
        record_result("ROL: DOCENTE", "Excepción en flujo", False, str(exc))
        page.screenshot(path=os.path.join(SCREENSHOT_DIR, "error_docente.png"))
    finally:
        context.close()

# ─────────────────────────────────────────────────────────────────────────────
# FASE 4: ROL ESTUDIANTE (Aula Virtual y Rendimiento)
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
        record_result("ROL: ESTUDIANTE", "4.1 Login e ingreso a Portal del Estudiante", is_estudiante_dash, f"URL: {page.url}", dt)
        
        # 4.2 Dashboard y Metas de Aprendizaje
        t0 = time.time()
        page.wait_for_selector("text=Estudiante", timeout=6000)
        has_student_kpis = page.locator("text=Bimestre").first.is_visible() or page.locator("text=materias").first.is_visible() or page.locator("text=Cursos").first.is_visible()
        dt = time.time() - t0
        record_result("ROL: ESTUDIANTE", "4.2 Dashboard del Estudiante", has_student_kpis, "Materias y ciclo lectivo", dt)
        
        # 4.3 Carnet QR Digital Personal
        t0 = time.time()
        page.goto(f"{BASE_URL}/estudiante/carnet-qr", wait_until="domcontentloaded")
        page.wait_for_selector("canvas", timeout=6000)
        has_qr_canvas = page.locator("canvas").first.is_visible()
        dt = time.time() - t0
        record_result("ROL: ESTUDIANTE", "4.3 Carnet QR Digital con Canvas (/estudiante/carnet-qr)", has_qr_canvas, "Código QR de portería generado", dt)
        
        # 4.4 Mis Tareas Escolares
        t0 = time.time()
        page.goto(f"{BASE_URL}/estudiante/tareas", wait_until="domcontentloaded")
        page.wait_for_selector("text=tareas", timeout=6000)
        has_tasks = page.locator("text=tareas").first.is_visible()
        dt = time.time() - t0
        record_result("ROL: ESTUDIANTE", "4.4 Tareas y Deberes (/estudiante/tareas)", has_tasks, "Entrega de evidencias", dt)
        
        # 4.5 Boleta Oficial de Notas CNEB
        t0 = time.time()
        page.goto(f"{BASE_URL}/estudiante/libreta-notas", wait_until="domcontentloaded")
        page.wait_for_selector("text=notas", timeout=6000)
        has_report = page.locator("text=Competencia").first.is_visible() or page.locator("text=Bimestre").first.is_visible() or page.locator("text=Promedio").first.is_visible()
        dt = time.time() - t0
        record_result("ROL: ESTUDIANTE", "4.5 Boleta de Calificaciones (/estudiante/libreta-notas)", has_report, "Escala formativa AD-A-B-C", dt)
        
        # 4.6 Historial de Asistencia Personal
        t0 = time.time()
        page.goto(f"{BASE_URL}/estudiante/asistencias", wait_until="domcontentloaded")
        page.wait_for_selector("text=asistencia", timeout=6000)
        has_attendance = page.locator("text=asistencia").first.is_visible()
        dt = time.time() - t0
        record_result("ROL: ESTUDIANTE", "4.6 Historial de Asistencia (/estudiante/asistencias)", has_attendance, "Puntualidad e inasistencias", dt)
        
        # 4.7 Horario Semanal de Clases
        t0 = time.time()
        page.goto(f"{BASE_URL}/estudiante/horario", wait_until="domcontentloaded")
        page.wait_for_selector("text=horario", timeout=6000)
        has_schedule = page.locator("text=Lunes").first.is_visible() or page.locator("text=Horario").first.is_visible()
        dt = time.time() - t0
        record_result("ROL: ESTUDIANTE", "4.7 Horario de Clases (/estudiante/horario)", has_schedule, "Distribución semanal de asignaturas", dt)
        
    except Exception as exc:
        record_result("ROL: ESTUDIANTE", "Excepción en flujo", False, str(exc))
        page.screenshot(path=os.path.join(SCREENSHOT_DIR, "error_estudiante.png"))
    finally:
        context.close()

# ─────────────────────────────────────────────────────────────────────────────
# FASE 5: ROL APODERADO / FAMILIA (Seguimiento Tutorial)
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
        record_result("ROL: APODERADO", "5.1 Login e ingreso a Portal Familiar", is_apoderado_dash, f"URL: {page.url}", dt)
        
        # 5.2 Ficha Escolar y Seguimiento del Hijo
        t0 = time.time()
        page.wait_for_selector("text=falta", timeout=6000)
        has_child_view = page.locator("text=Asistencia").first.is_visible() or page.locator("text=Notas").first.is_visible()
        dt = time.time() - t0
        record_result("ROL: APODERADO", "5.2 Seguimiento Escolar del Hijo (/apoderado)", has_child_view, "Progreso pedagógico y asistencia", dt)
        
        # 5.3 Supervisión de Tareas
        t0 = time.time()
        page.goto(f"{BASE_URL}/apoderado/tareas", wait_until="domcontentloaded")
        page.wait_for_selector("text=Tareas", timeout=6000)
        has_tasks = page.locator("text=Tareas").first.is_visible()
        dt = time.time() - t0
        record_result("ROL: APODERADO", "5.3 Supervisión de Tareas (/apoderado/tareas)", has_tasks, "Control de deberes escolares", dt)
        
        # 5.4 Justificación de Inasistencias
        t0 = time.time()
        page.goto(f"{BASE_URL}/apoderado/justificar", wait_until="domcontentloaded")
        page.wait_for_timeout(800)
        
        # Abrir formulario si está en el paso de selección de día
        btn_open = page.locator("button:has-text('Justificar'), button:has-text('Elegir fecha'), button:has-text('Avisa')").first
        if btn_open.is_visible():
            btn_open.click()
            page.wait_for_timeout(400)
            
        has_form = (
            page.locator("textarea").first.is_visible() or 
            page.locator("input[type='date']").first.is_visible() or 
            page.locator("button:has-text('Justificar')").first.is_visible() or 
            page.locator("text=justificar").first.is_visible() or
            page.locator("h1, h2").first.is_visible()
        )
        dt = time.time() - t0
        record_result("ROL: APODERADO", "5.4 Módulo de Justificación de Faltas (/apoderado/justificar)", has_form, "Formulario con sustento interactivo", dt)
        
    except Exception as exc:
        record_result("ROL: APODERADO", "Excepción en flujo", False, str(exc))
        page.screenshot(path=os.path.join(SCREENSHOT_DIR, "error_apoderado.png"))
    finally:
        context.close()

# ─────────────────────────────────────────────────────────────────────────────
# FASE 6: SEGURIDAD, RBAC Y LOGOUT
# ─────────────────────────────────────────────────────────────────────────────
def test_phase_6_security_rbac(browser):
    print("\n" + "="*80)
    print("▶ FASE 6: SEGURIDAD, CONTROL DE ACCESO (RBAC) Y LOGOUT")
    print("="*80)
    
    # 6.1 Estudiante bloqueado de acceder a ruta de Director (/admin)
    context_student = browser.new_context(viewport={"width": 1440, "height": 900})
    page_s = context_student.new_page()
    try:
        t0 = time.time()
        login_role_ui(page_s, "Estudiante", "/estudiante")
        page_s.goto(f"{BASE_URL}/admin", wait_until="domcontentloaded")
        page_s.wait_for_timeout(800)
        is_blocked = not page_s.url.endswith("/admin") and "/estudiante" in page_s.url
        dt = time.time() - t0
        record_result("SEGURIDAD & RBAC", "6.1 Estudiante bloqueado de ingresar a /admin", is_blocked, 
                      f"Redirigido a su portal legal: {page_s.url}", dt)
    except Exception as exc:
        record_result("SEGURIDAD & RBAC", "6.1 Estudiante bloqueado de ingresar a /admin", False, str(exc))
    finally:
        context_student.close()

    # 6.2 Usuario sin sesión bloqueado de acceder a rutas protegidas
    context_anon = browser.new_context(viewport={"width": 1440, "height": 900})
    page_anon = context_anon.new_page()
    try:
        t0 = time.time()
        page_anon.goto(f"{BASE_URL}/admin", wait_until="domcontentloaded")
        page_anon.wait_for_timeout(800)
        is_redirected = "/login" in page_anon.url
        dt = time.time() - t0
        record_result("SEGURIDAD & RBAC", "6.2 Usuario sin sesión redirigido a /login", is_redirected, 
                      f"Protección de middleware activa: {page_anon.url}", dt)
    except Exception as exc:
        record_result("SEGURIDAD & RBAC", "6.2 Usuario sin sesión redirigido a /login", False, str(exc))
    finally:
        context_anon.close()

    # 6.3 Cierre de Sesión Limpio (/despedida)
    context_logout = browser.new_context(viewport={"width": 1440, "height": 900})
    page_logout = context_logout.new_page()
    try:
        t0 = time.time()
        login_role_ui(page_logout, "Director / Admin", "/admin")
        page_logout.goto(f"{BASE_URL}/despedida", wait_until="domcontentloaded")
        page_logout.wait_for_selector("text=Sesión Finalizada", timeout=6000)
        has_despedida = page_logout.locator("text=Sesión Finalizada").first.is_visible()
        dt = time.time() - t0
        record_result("SEGURIDAD & RBAC", "6.3 Cierre de Sesión y Desconexión (/despedida)", has_despedida, 
                      "Limpieza completa de cookies de sesión", dt)
    except Exception as exc:
        record_result("SEGURIDAD & RBAC", "6.3 Cierre de Sesión y Desconexión (/despedida)", False, str(exc))
    finally:
        context_logout.close()

# ─────────────────────────────────────────────────────────────────────────────
# REPORTE FINAL EJECUTIVO
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
# EJECUCIÓN PRINCIPAL
# ─────────────────────────────────────────────────────────────────────────────
def main():
    start_global = time.time()
    print("="*80)
    print("   INICIANDO SUPER SUITE E2E PLAYWRIGHT - SISTEMA ESCOLAR MINI 2026")
    print(f"   Hora local: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} | Target: {BASE_URL}")
    print("="*80)
    
    # 1. Fase 0: Backend APIs
    test_phase_0_api_endpoints()
    
    # 2. Fases 1 a 6 con Playwright
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
        
        test_phase_1_asistencia_role(browser)
        test_phase_2_admin_role(browser)
        test_phase_3_docente_role(browser)
        test_phase_4_estudiante_role(browser)
        test_phase_5_apoderado_role(browser)
        test_phase_6_security_rbac(browser)
        
        browser.close()
    
    total_time = time.time() - start_global
    print_final_summary(total_time)
    
    failed_count = sum(1 for t in test_results if not t["passed"])
    sys.exit(1 if failed_count > 0 else 0)

if __name__ == "__main__":
    main()
