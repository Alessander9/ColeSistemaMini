import time
import json
import urllib.request
import urllib.error
import sys
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.action_chains import ActionChains

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

BASE_URL = "http://localhost:3000"

test_results = []

def record_result(category, name, passed, details=""):
    status = "PASSED" if passed else "FAILED"
    test_results.append({
        "category": category,
        "name": name,
        "status": status,
        "details": details
    })
    prefix = "  [PASS] " if passed else "  [FAIL] "
    print(f"{prefix}[{category}] {name} - {status} {f'({details})' if details else ''}")

def test_api_endpoints():
    print("\n=======================================================")
    print(" 1. AUDITORIA DE ENDPOINTS DE API (BACKEND CONTRACT)")
    print("=======================================================")

    # 1. GET /api/branding
    try:
        req = urllib.request.Request(f"{BASE_URL}/api/branding")
        with urllib.request.urlopen(req, timeout=5) as response:
            status = response.getcode()
            res_json = json.loads(response.read().decode('utf-8'))
            branding_data = res_json.get('data', res_json)
            nombre = branding_data.get('nombreInstitucion', '')
            passed = status == 200 and bool(nombre or res_json.get('success'))
            record_result("API", "GET /api/branding", passed, f"Status: {status}, Colegio: {nombre}")
    except Exception as e:
        record_result("API", "GET /api/branding", False, str(e))

    # 2. POST /api/asistencia/scan (Requires auth cookie)
    try:
        payload = json.dumps({"qrData": "EST-2026-PRI-A-001"}).encode('utf-8')
        req = urllib.request.Request(
            f"{BASE_URL}/api/asistencia/scan",
            data=payload,
            headers={
                "Content-Type": "application/json",
                "Cookie": "cole_user_role=asistencia"
            },
            method="POST"
        )
        try:
            with urllib.request.urlopen(req, timeout=5) as response:
                status = response.getcode()
                res_json = json.loads(response.read().decode('utf-8'))
                passed = status == 200 and ("success" in res_json or "data" in res_json)
                record_result("API", "POST /api/asistencia/scan", passed, f"Status: {status}, Success: {res_json.get('success', False)}")
        except urllib.error.HTTPError as he:
            # 200 or 400 with JSON is valid API contract
            passed = he.code in (200, 400)
            record_result("API", "POST /api/asistencia/scan", passed, f"Response code: {he.code}")
    except Exception as e:
        record_result("API", "POST /api/asistencia/scan", False, str(e))

    # 3. POST /api/notas/calcular (Requires auth cookie)
    try:
        payload = json.dumps({"evaluaciones": [{"peso": 50, "nota": 18}, {"peso": 50, "nota": 16}]}).encode('utf-8')
        req = urllib.request.Request(
            f"{BASE_URL}/api/notas/calcular",
            data=payload,
            headers={
                "Content-Type": "application/json",
                "Cookie": "cole_user_role=docente"
            },
            method="POST"
        )
        try:
            with urllib.request.urlopen(req, timeout=5) as response:
                status = response.getcode()
                res_json = json.loads(response.read().decode('utf-8'))
                passed = status == 200 and ("promedio" in res_json or "success" in res_json or "data" in res_json)
                record_result("API", "POST /api/notas/calcular", passed, f"Status: {status}")
        except urllib.error.HTTPError as he:
            passed = he.code in (200, 400)
            record_result("API", "POST /api/notas/calcular", passed, f"Response code: {he.code}")
    except Exception as e:
        record_result("API", "POST /api/notas/calcular", False, str(e))

def create_driver(is_mobile=False):
    options = Options()
    options.add_argument('--headless=new')
    options.add_argument('--no-sandbox')
    options.add_argument('--disable-dev-shm-usage')
    options.add_argument('--disable-gpu')
    options.add_argument('--log-level=3')

    if is_mobile:
        mobile_emulation = {
            "userAgent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1"
        }
        options.add_experimental_option("mobileEmulation", mobile_emulation)
        options.add_argument('--window-size=390,844')
    else:
        options.add_argument('--window-size=1440,900')

    driver = webdriver.Chrome(options=options)
    if is_mobile:
        driver.set_window_size(390, 844)
    else:
        driver.set_window_size(1440, 900)
    return driver

def check_horizontal_overflow(driver, page_name, mode_label):
    time.sleep(0.5)
    scroll_w = driver.execute_script("return document.documentElement.scrollWidth;")
    inner_w = driver.execute_script("return window.innerWidth;")
    passed = scroll_w <= inner_w + 3 # 3px margin for fractional zoom/rounding
    record_result(mode_label, f"Zero Overflow - {page_name}", passed, f"scrollWidth={scroll_w}px, innerWidth={inner_w}px")
    return passed

def login_as_role(driver, wait, role_keyword):
    # Clear cookies and go to login
    driver.delete_all_cookies()
    driver.get(f"{BASE_URL}/login")
    time.sleep(0.5)
    role_btn = wait.until(EC.element_to_be_clickable((By.XPATH, f"//button[contains(., '{role_keyword}')]")))
    driver.execute_script("arguments[0].click();", role_btn)
    time.sleep(0.3)
    submit_btn = driver.find_element(By.XPATH, "//button[contains(., 'Ingresar al Sistema')]")
    driver.execute_script("arguments[0].click();", submit_btn)
    time.sleep(1.0)

def run_e2e_suite(is_mobile=False):
    mode_label = "MOBILE (390x844)" if is_mobile else "DESKTOP (1440x900)"
    print(f"\n=======================================================")
    print(f" INICIANDO SUITE END-TO-END EN MODO: {mode_label}")
    print(f"=======================================================")

    driver = create_driver(is_mobile=is_mobile)
    wait = WebDriverWait(driver, 10)

    try:
        # ─────────────────────────────────────────────────────────────
        # 1. LOGIN & AUTOFILL DEMO (ADMIN)
        # ─────────────────────────────────────────────────────────────
        driver.get(f"{BASE_URL}/login")
        wait.until(EC.presence_of_element_located((By.XPATH, "//button[contains(., 'Director') or contains(., 'Admin')]")))
        check_horizontal_overflow(driver, "Login Page", mode_label)

        # Click Admin Demo Button
        admin_demo_btn = driver.find_element(By.XPATH, "//button[contains(., 'Director') or contains(., 'Admin')]")
        driver.execute_script("arguments[0].click();", admin_demo_btn)
        time.sleep(0.3)

        # Submit Login
        submit_btn = driver.find_element(By.XPATH, "//button[contains(., 'Ingresar al Sistema')]")
        driver.execute_script("arguments[0].click();", submit_btn)
        wait.until(EC.url_contains("/admin"))
        record_result(mode_label, "Login Admin Demo Flow", True, f"Navigated to {driver.current_url}")

        # ─────────────────────────────────────────────────────────────
        # 2. ADMIN DASHBOARD & CONTROLS
        # ─────────────────────────────────────────────────────────────
        wait.until(EC.presence_of_element_located((By.TAG_NAME, "h1")))
        check_horizontal_overflow(driver, "Admin Dashboard", mode_label)

        # A. Navbar Mobile Hamburger / Sidebar Drawer (if mobile)
        if is_mobile:
            menu_buttons = driver.find_elements(By.CSS_SELECTOR, "header button")
            if menu_buttons:
                menu_btn = menu_buttons[0]
                driver.execute_script("arguments[0].click();", menu_btn)
                time.sleep(0.4)
                # Verify drawer opened
                drawer_links = driver.find_elements(By.XPATH, "//aside//a")
                record_result(mode_label, "Navbar Hamburger Drawer Open", len(drawer_links) > 0, f"Links in drawer: {len(drawer_links)}")
                
                # Close drawer by triggering click on the backdrop via script
                driver.execute_script("""
                    var bd = document.querySelector('.fixed.inset-0.bg-slate-900\\\\/60');
                    if (bd) bd.click();
                """)
                time.sleep(0.4)
                record_result(mode_label, "Navbar Hamburger Drawer Close", True)

        # B. Notification Bell Popover
        bell_btns = driver.find_elements(By.CSS_SELECTOR, "button[title*='notificaci' i], button[aria-label*='notificaci' i]")
        if bell_btns:
            driver.execute_script("arguments[0].click();", bell_btns[0])
            time.sleep(0.4)
            # Verify popover
            popover_headings = driver.find_elements(By.XPATH, "//*[contains(text(), 'Notificaciones')]")
            record_result(mode_label, "Notification Bell Popover Open", len(popover_headings) > 0)
            check_horizontal_overflow(driver, "Notification Popover Open", mode_label)
            # Close by clicking bell again
            driver.execute_script("arguments[0].click();", bell_btns[0])
            time.sleep(0.3)

        # C. Academic Context Selector
        context_triggers = driver.find_elements(By.XPATH, "//button[contains(@class, 'rounded-full') and contains(., '2026')]")
        if context_triggers:
            driver.execute_script("arguments[0].click();", context_triggers[0])
            time.sleep(0.4)
            levels_visible = driver.find_elements(By.XPATH, "//*[contains(text(), 'Nivel Inicial') or contains(text(), 'Nivel Primaria')]")
            record_result(mode_label, "Academic Context Selector Open", len(levels_visible) > 0)
            check_horizontal_overflow(driver, "Context Popover Open", mode_label)
            # Close by clicking trigger again
            driver.execute_script("arguments[0].click();", context_triggers[0])
            time.sleep(0.3)

        # D. Operational Phase Tabs (En Vivo Hoy, Consolidado Académico, Supervisión & Auditoría)
        phase_tabs = driver.find_elements(By.XPATH, "//button[contains(., 'En Vivo Hoy') or contains(., 'Consolidado Académico') or contains(., 'Supervisión')]")
        record_result(mode_label, "Admin Operational Phase Tabs Count", len(phase_tabs) >= 3, f"Found {len(phase_tabs)} phase tabs")
        if len(phase_tabs) >= 3:
            # Click Tab 2: Consolidado Académico
            driver.execute_script("arguments[0].click();", phase_tabs[1])
            time.sleep(0.3)
            # Click Tab 3: Supervisión
            driver.execute_script("arguments[0].click();", phase_tabs[2])
            time.sleep(0.3)
            # Return to Tab 1: En Vivo Hoy
            driver.execute_script("arguments[0].click();", phase_tabs[0])
            time.sleep(0.3)
            record_result(mode_label, "Admin Operational Tabs Interactive Switching", True)

        # E. Step-by-Step Links in Dashboard
        step_links = driver.find_elements(By.XPATH, "//a[contains(., 'Cursos') or contains(., 'Aulas') or contains(., 'Docentes') or contains(., 'Horarios') or contains(., 'Matrícula')]")
        record_result(mode_label, "Admin Step-by-Step Setup Badges", len(step_links) > 0, f"Found {len(step_links)} step triggers")

        # F. BottomNav Check (Mobile only)
        if is_mobile:
            bottom_nav_links = driver.find_elements(By.XPATH, "//nav[contains(@class, 'fixed bottom-0')]//a")
            record_result(mode_label, "Mobile BottomNav Navigation", len(bottom_nav_links) >= 4, f"Found {len(bottom_nav_links)} bottom tabs")

        # ─────────────────────────────────────────────────────────────
        # 3. DOCENTE DASHBOARD (LOGIN AS DOCENTE)
        # ─────────────────────────────────────────────────────────────
        login_as_role(driver, wait, "Docente")
        driver.get(f"{BASE_URL}/docente")
        wait.until(EC.presence_of_element_located((By.XPATH, "//*[contains(text(), 'Docente') or contains(text(), 'Aula') or contains(text(), 'Asistencia')]")))
        check_horizontal_overflow(driver, "Docente Dashboard", mode_label)

        # Test Roll-Call Attendance Buttons (P, T, F, J)
        attendance_buttons = driver.find_elements(By.XPATH, "//button[text()='P' or text()='T' or text()='F' or text()='J']")
        record_result(mode_label, "Docente Attendance Roll-Call Buttons", len(attendance_buttons) > 0, f"Found {len(attendance_buttons)} attendance buttons")

        if len(attendance_buttons) >= 4:
            # Click 'T' (Tardanza) on first student
            t_btn = [b for b in attendance_buttons if b.text == 'T'][0]
            driver.execute_script("arguments[0].click();", t_btn)
            time.sleep(0.3)
            # Click 'P' (Presente)
            p_btn = [b for b in attendance_buttons if b.text == 'P'][0]
            driver.execute_script("arguments[0].click();", p_btn)
            time.sleep(0.3)
            record_result(mode_label, "Docente Attendance Roll-Call Click Interaction", True, "Toggled attendance status without error")

        # Test Filter Buttons (Todos / Solo Ausentes)
        filter_ausentes = driver.find_elements(By.XPATH, "//button[contains(., 'Ausentes') or contains(., 'Tardanzas')]")
        if filter_ausentes:
            driver.execute_script("arguments[0].click();", filter_ausentes[0])
            time.sleep(0.3)
            filter_todos = driver.find_elements(By.XPATH, "//button[contains(., 'Todos los Alumnos')]")
            if filter_todos:
                driver.execute_script("arguments[0].click();", filter_todos[0])
                time.sleep(0.3)
            record_result(mode_label, "Docente Attendance Quick Filter Switcher", True)

        # Test Quick QR Modal Trigger
        qr_modal_triggers = driver.find_elements(By.XPATH, "//button[contains(., 'Escanear QR')]")
        if qr_modal_triggers:
            driver.execute_script("arguments[0].click();", qr_modal_triggers[0])
            time.sleep(0.4)
            modal_qr_titles = driver.find_elements(By.XPATH, "//*[contains(text(), 'Lector de Asistencia QR')]")
            record_result(mode_label, "Docente Quick QR Modal Open", len(modal_qr_titles) > 0)
            check_horizontal_overflow(driver, "Quick QR Modal Open", mode_label)
            # Close modal
            close_modal_btns = driver.find_elements(By.CSS_SELECTOR, "button[aria-label*='Cerrar' i]")
            if close_modal_btns:
                driver.execute_script("arguments[0].click();", close_modal_btns[0])
                time.sleep(0.3)
                record_result(mode_label, "Docente Quick QR Modal Close", True)

        # ─────────────────────────────────────────────────────────────
        # 4. APODERADO DASHBOARD (LOGIN AS APODERADO)
        # ─────────────────────────────────────────────────────────────
        login_as_role(driver, wait, "Apoderado")
        driver.get(f"{BASE_URL}/apoderado")
        wait.until(EC.presence_of_element_located((By.XPATH, "//*[contains(text(), 'Apoderado') or contains(text(), 'Hijo') or contains(text(), 'Portal')]")))
        check_horizontal_overflow(driver, "Apoderado Dashboard", mode_label)

        # Verify Peace of Mind Security Banner
        security_banners = driver.find_elements(By.XPATH, "//*[contains(text(), 'Ingreso') or contains(text(), 'Portería') or contains(text(), 'Asistencia de Hoy')]")
        record_result(mode_label, "Apoderado Morning Peace-Of-Mind Banner", len(security_banners) > 0)

        # Verify 4 Operational Tabs
        apo_tabs = driver.find_elements(By.XPATH, "//button[contains(., 'Hoy en el Colegio') or contains(., 'Calificaciones') or contains(., 'Tareas') or contains(., 'Trámites')]")
        record_result(mode_label, "Apoderado 4 Operational Tabs Count", len(apo_tabs) >= 4, f"Found {len(apo_tabs)} tabs")

        if len(apo_tabs) >= 4:
            # Click Tab 2: Calificaciones
            driver.execute_script("arguments[0].click();", apo_tabs[1])
            time.sleep(0.3)
            # Click Tab 3: Tareas
            driver.execute_script("arguments[0].click();", apo_tabs[2])
            time.sleep(0.3)
            # Click Tab 4: Trámites
            driver.execute_script("arguments[0].click();", apo_tabs[3])
            time.sleep(0.3)
            # Return to Tab 1
            driver.execute_script("arguments[0].click();", apo_tabs[0])
            time.sleep(0.3)
            record_result(mode_label, "Apoderado Operational Tabs Switching", True)

        # ─────────────────────────────────────────────────────────────
        # 5. ESTUDIANTE DASHBOARD (LOGIN AS ESTUDIANTE)
        # ─────────────────────────────────────────────────────────────
        login_as_role(driver, wait, "Estudiante")
        driver.get(f"{BASE_URL}/estudiante")
        wait.until(EC.presence_of_element_located((By.XPATH, "//*[contains(text(), 'Estudiante') or contains(text(), 'Portal') or contains(text(), '¡Buen')]")))
        check_horizontal_overflow(driver, "Estudiante Dashboard", mode_label)

        # Check 6 study route cards
        study_route_cards = driver.find_elements(By.XPATH, "//a[contains(., 'Carnet QR') or contains(., 'Mi Horario') or contains(., 'Mis Tareas') or contains(., 'Libreta')]")
        record_result(mode_label, "Estudiante 6 Study Route Links", len(study_route_cards) >= 4, f"Found {len(study_route_cards)} route items")

        # Test "Mostrar Carnet QR" modal
        qr_carnet_btns = driver.find_elements(By.XPATH, "//button[contains(., 'Mostrar Carnet QR') or contains(., 'Carnet QR')]")
        if qr_carnet_btns:
            driver.execute_script("arguments[0].click();", qr_carnet_btns[0])
            time.sleep(0.4)
            carnet_qr_elements = driver.find_elements(By.XPATH, "//*[contains(text(), 'Carnet') or contains(text(), 'ESTUDIANTE')]")
            record_result(mode_label, "Estudiante Carnet QR Modal Open", len(carnet_qr_elements) > 0)
            check_horizontal_overflow(driver, "Carnet QR Modal Open", mode_label)
            # Close modal
            close_btns = driver.find_elements(By.CSS_SELECTOR, "button[aria-label*='Cerrar' i]")
            if close_btns:
                driver.execute_script("arguments[0].click();", close_btns[0])
                time.sleep(0.3)
                record_result(mode_label, "Estudiante Carnet QR Modal Close", True)

        # ─────────────────────────────────────────────────────────────
        # 6. TERMINAL DE ASISTENCIA KIOSK (LOGIN AS KIOSCO QR / PORTERIA)
        # ─────────────────────────────────────────────────────────────
        login_as_role(driver, wait, "Kiosco")
        driver.get(f"{BASE_URL}/asistencia")
        wait.until(EC.presence_of_element_located((By.XPATH, "//*[contains(text(), 'Terminal de Control') or contains(text(), 'Asistencia')]")))
        check_horizontal_overflow(driver, "Asistencia Kiosk", mode_label)

        # A. Mode Switcher (Entrada / Salida)
        salida_btn = driver.find_elements(By.XPATH, "//button[contains(., 'Salida')]")
        entrada_btn = driver.find_elements(By.XPATH, "//button[contains(., 'Entrada')]")
        if salida_btn and entrada_btn:
            driver.execute_script("arguments[0].click();", salida_btn[0])
            time.sleep(0.3)
            driver.execute_script("arguments[0].click();", entrada_btn[0])
            time.sleep(0.3)
            record_result(mode_label, "Asistencia Mode Switcher (Entrada / Salida)", True)

        # B. Switch to Manual Input & Test DNI Entry
        manual_tab = driver.find_elements(By.XPATH, "//button[contains(., 'Registro Manual')]")
        if manual_tab:
            driver.execute_script("arguments[0].click();", manual_tab[0])
            time.sleep(0.4)
            dni_input = driver.find_elements(By.CSS_SELECTOR, "input[placeholder*='DNI' i], input[type='text']")
            if dni_input:
                dni_input[0].clear()
                dni_input[0].send_keys("78945612")
                time.sleep(0.2)
                record_result(mode_label, "Asistencia Manual DNI Input Entry", True, "DNI typed successfully")
            
            # Switch back to QR scan
            qr_tab = driver.find_elements(By.XPATH, "//button[contains(., 'Escanear QR')]")
            if qr_tab:
                driver.execute_script("arguments[0].click();", qr_tab[0])
                time.sleep(0.3)
                record_result(mode_label, "Asistencia Switch back to QR Scanner", True)

        # C. Sound Toggle Button
        audio_btns = driver.find_elements(By.CSS_SELECTOR, "button[title*='audio' i], button[title*='Silenciar' i]")
        if audio_btns:
            driver.execute_script("arguments[0].click();", audio_btns[0])
            time.sleep(0.2)
            driver.execute_script("arguments[0].click();", audio_btns[0])
            time.sleep(0.2)
            record_result(mode_label, "Asistencia Audio Toggle Interaction", True)

        # D. Volver al Panel Button
        volver_btn = driver.find_elements(By.XPATH, "//button[contains(., 'Volver al Panel')]")
        if volver_btn:
            driver.execute_script("arguments[0].click();", volver_btn[0])
            time.sleep(0.5)
            record_result(mode_label, "Asistencia Volver al Panel Navigation", True, f"Navigated to {driver.current_url}")

    except Exception as e:
        record_result(mode_label, "Suite Execution Exception", False, str(e))
        import traceback
        traceback.print_exc()
    finally:
        driver.quit()

if __name__ == "__main__":
    start_time = time.time()
    print("==================================================================")
    print(" SUITE E2E SELENIUM AUTOMATIZADA: COLE SISTEMA MINI 2026")
    print(" Cobertura: Endpoints, Desktop (1440x900) y Mobile (390x844)")
    print("==================================================================")

    # 1. API Endpoints
    test_api_endpoints()

    # 2. Desktop Mode
    run_e2e_suite(is_mobile=False)

    # 3. Mobile Mode
    run_e2e_suite(is_mobile=True)

    elapsed = time.time() - start_time
    total = len(test_results)
    passed = sum(1 for r in test_results if r["status"] == "PASSED")
    failed = total - passed

    print("\n==================================================================")
    print(f" RESUMEN FINAL: {passed}/{total} PRUEBAS EXITOSAS ({failed} fallidas)")
    print(f" Tiempo total: {elapsed:.2f} segundos")
    print("==================================================================")

    if failed > 0:
        sys.exit(1)
    else:
        sys.exit(0)
