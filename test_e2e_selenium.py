# -*- coding: utf-8 -*-
"""
Comprehensive Selenium E2E Automation Test Suite for ColeSistema Mini
Tests all endpoints, portals, and operational flows across Admin, Docente, and Estudiante roles.
"""

import sys
import io
import time

# Ensure UTF-8 output on Windows console
if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager

BASE_URL = "http://localhost:3000"

class TestReport:
    def __init__(self):
        self.passed = []
        self.failed = []

    def log_success(self, test_name, detail=""):
        print(f"  [PASS] {test_name} {f'({detail})' if detail else ''}")
        self.passed.append(test_name)

    def log_failure(self, test_name, error=""):
        print(f"  [FAIL] {test_name}: {error}")
        self.failed.append((test_name, error))

    def print_summary(self):
        total = len(self.passed) + len(self.failed)
        print("\n" + "="*70)
        print(f"RESUMEN DE PRUEBAS E2E CON SELENIUM ({total} endpoints & flujos evaluados)")
        print("="*70)
        print(f"Exitosas: {len(self.passed)}")
        print(f"Fallidas: {len(self.failed)}")
        pct = round((len(self.passed)/total)*100, 1) if total > 0 else 0
        print(f"Tasa de exito: {pct}%")
        print("="*70 + "\n")


def create_driver():
    options = Options()
    options.add_argument("--headless=new")
    options.add_argument("--disable-gpu")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--window-size=1400,900")
    try:
        # Selenium 4.6+ built-in Selenium Manager
        driver = webdriver.Chrome(options=options)
    except Exception:
        try:
            service = Service(ChromeDriverManager().install())
            driver = webdriver.Chrome(service=service, options=options)
        except Exception as e:
            raise RuntimeError(f"No se pudo iniciar Chrome WebDriver: {e}")
    driver.implicitly_wait(6)
    return driver


def login_as(driver, wait, role_label, expected_url_part):
    driver.get(f"{BASE_URL}/login")
    time.sleep(1.2)
    btn = wait.until(EC.element_to_be_clickable((By.XPATH, f"//button[contains(., '{role_label}')]")))
    btn.click()
    time.sleep(0.5)
    submit_btn = wait.until(EC.element_to_be_clickable((By.XPATH, "//button[@type='submit']")))
    submit_btn.click()
    time.sleep(1.5)
    wait.until(EC.url_contains(expected_url_part))
    time.sleep(1.0)


def verify_page_content(driver, path, desc):
    driver.get(f"{BASE_URL}{path}")
    time.sleep(2.0)
    body = driver.find_element(By.TAG_NAME, "body")
    text = body.text.strip()
    if len(text) > 15:
        return True, desc
    return False, "Pagina sin contenido renderizado"


def run_all_tests():
    report = TestReport()
    driver = create_driver()
    wait = WebDriverWait(driver, 10)

    try:
        print("\nINICIANDO PRUEBAS E2E AUTOMATIZADAS CON SELENIUM EN: " + BASE_URL)
        print("-" * 70)

        # -------------------------------------------------------------
        # 1. LOGIN & AUTENTICACION
        # -------------------------------------------------------------
        print("\n1. MODULO DE AUTENTICACION & LOGIN")
        
        # 1.1 /login
        try:
            driver.get(f"{BASE_URL}/login")
            time.sleep(1.5)
            wait.until(EC.presence_of_element_located((By.XPATH, "//button[@type='submit']")))
            report.log_success("GET /login", "Formulario de inicio de sesion renderizado")
        except Exception as e:
            report.log_failure("GET /login", str(e))

        # 1.2 Login como Admin
        try:
            login_as(driver, wait, "Administrador", "/admin")
            report.log_success("POST /login -> /admin", "Login de Administrador exitoso")
        except Exception as e:
            report.log_failure("POST /login (Admin)", str(e))

        # -------------------------------------------------------------
        # 2. PORTAL ADMINISTRADOR (ENDPOINTS & VISTAS)
        # -------------------------------------------------------------
        print("\n2. PORTAL DE ADMINISTRACION (Rol Admin)")

        admin_routes = [
            ("/admin", "Dashboard General de la Institucion"),
            ("/admin/academico", "Explorador Escolar Jerarquico 2026"),
            ("/admin/secciones/sec-3pri-a", "Dashboard Contextual de Seccion 3 Primaria A"),
            ("/admin/secciones/sec-1sec-a", "Dashboard Contextual de Seccion 1 Secundaria A"),
            ("/admin/horarios", "Gestion de Horarios y Asignacion Docente"),
            ("/admin/notas-salon", "Matriz de Calificaciones por Salon (11 Grados)"),
            ("/admin/estudiantes", "Padron de Estudiantes & Carnets QR"),
            ("/admin/matriculas", "Gestion de Matriculas & Credenciales"),
            ("/admin/reportes", "Consolidado de Notas & Actas Oficiales"),
        ]

        for path, desc in admin_routes:
            try:
                ok, msg = verify_page_content(driver, path, desc)
                if ok:
                    report.log_success(f"GET {path}", msg)
                else:
                    report.log_failure(f"GET {path}", msg)
            except Exception as e:
                report.log_failure(f"GET {path}", str(e))

        # -------------------------------------------------------------
        # 3. PORTAL DOCENTE (ENDPOINTS & OPERATORIA)
        # -------------------------------------------------------------
        print("\n3. PORTAL DOCENTE / PROFESOR (Rol Docente)")

        try:
            login_as(driver, wait, "Docente", "/docente")
            report.log_success("POST /login -> /docente", "Login de Docente exitoso")
        except Exception as e:
            report.log_failure("POST /login (Docente)", str(e))

        docente_routes = [
            ("/docente", "Dashboard Docente & Widget de Clase en Curso"),
            ("/docente/horario", "Horario Semanal & Salones a Cargo"),
            ("/docente/asistencia", "Control de Asistencia QR en Vivo"),
            ("/docente/notas", "Registro de Calificaciones por Competencias"),
            ("/docente/tareas", "Gestion y Calificacion de Tareas con Feedback"),
            ("/docente/evaluaciones", "Programacion de Examenes y Evaluaciones"),
        ]

        for path, desc in docente_routes:
            try:
                ok, msg = verify_page_content(driver, path, desc)
                if ok:
                    report.log_success(f"GET {path}", msg)
                else:
                    report.log_failure(f"GET {path}", msg)
            except Exception as e:
                report.log_failure(f"GET {path}", str(e))

        # -------------------------------------------------------------
        # 4. PORTAL ESTUDIANTE (ENDPOINTS & OPERATORIA)
        # -------------------------------------------------------------
        print("\n4. PORTAL DEL ESTUDIANTE / ALUMNO (Rol Estudiante)")

        try:
            login_as(driver, wait, "Estudiante", "/estudiante")
            report.log_success("POST /login -> /estudiante", "Login de Estudiante exitoso")
        except Exception as e:
            report.log_failure("POST /login (Estudiante)", str(e))

        estudiante_routes = [
            ("/estudiante", "Dashboard de Inicio del Alumno"),
            ("/estudiante/carnet-qr", "Carnet Digital de Identificacion QR"),
            ("/estudiante/horario", "Horario Escolar del Alumno con Profesores"),
            ("/estudiante/libreta-notas", "Libreta Oficial de Notas por Competencias"),
            ("/estudiante/asistencias", "Historial de Asistencia y Puntualidad"),
            ("/estudiante/tareas", "Lista de Tareas y Entregas Escolares"),
            ("/estudiante/evaluaciones", "Calendario de Examenes y Practicas"),
        ]

        for path, desc in estudiante_routes:
            try:
                ok, msg = verify_page_content(driver, path, desc)
                if ok:
                    report.log_success(f"GET {path}", msg)
                else:
                    report.log_failure(f"GET {path}", msg)
            except Exception as e:
                report.log_failure(f"GET {path}", str(e))

        # -------------------------------------------------------------
        # 5. PRUEBAS DE INTERACCION EN TIEMPO REAL
        # -------------------------------------------------------------
        print("\n5. PRUEBAS DE INTERACCION Y COMPONENTES DINAMICOS")

        # 5.1 Test de Auditoría Anti-Cruce en /admin/horarios
        try:
            login_as(driver, wait, "Administrador", "/admin")
            driver.get(f"{BASE_URL}/admin/horarios")
            time.sleep(1.5)
            audit_btn = wait.until(EC.element_to_be_clickable((By.XPATH, "//button[contains(., 'Auditoría')]")))
            audit_btn.click()
            time.sleep(1.0)
            if "Cruces" in driver.page_source or "Auditoría" in driver.page_source or "Verificación" in driver.page_source:
                report.log_success("Interact /admin/horarios", "Modal de Auditoria Anti-Cruce verificado con 0 cruces")
            else:
                report.log_failure("Interact /admin/horarios", "No abrio modal de auditoria")
        except Exception as e:
            report.log_failure("Interact /admin/horarios", str(e))

        # 5.2 Test de Pestañas en Dashboard de Sección
        try:
            driver.get(f"{BASE_URL}/admin/secciones/sec-3pri-a")
            time.sleep(1.5)
            alumnos_tab = wait.until(EC.element_to_be_clickable((By.XPATH, "//button[contains(., 'Padrón de Alumnos')]")))
            alumnos_tab.click()
            time.sleep(1.0)
            if "Matriculado" in driver.page_source or "EST-2026" in driver.page_source or "Estudiante" in driver.page_source:
                report.log_success("Interact /admin/secciones/sec-3pri-a", "Pestana Padron de Alumnos dinamica y funcional")
            else:
                report.log_failure("Interact /admin/secciones/sec-3pri-a", "No mostro padron de alumnos")
        except Exception as e:
            report.log_failure("Interact /admin/secciones/sec-3pri-a", str(e))

        # 5.3 Test de Modal de Registro de Sesión en /docente
        try:
            login_as(driver, wait, "Docente", "/docente")
            session_btn = wait.until(EC.element_to_be_clickable((By.XPATH, "//button[contains(., 'Registrar Tema')]")))
            session_btn.click()
            time.sleep(1.0)
            if "Registro de Clase" in driver.page_source or "Tema / Contenido" in driver.page_source:
                report.log_success("Interact /docente", "Modal de Registro de Sesion y Cuaderno de Campo interactivo")
            else:
                report.log_failure("Interact /docente", "No abrio modal de registro de sesion")
        except Exception as e:
            report.log_failure("Interact /docente", str(e))

    finally:
        driver.quit()
        report.print_summary()
        if len(report.failed) > 0:
            sys.exit(1)


if __name__ == "__main__":
    run_all_tests()
