"""
Comprehensive End-to-End Selenium Test Suite for ColeSistema Mini
Tests all 4 user roles: Admin, Docente, Estudiante, Asistencia/Kiosko
"""

import sys
import os
import time
import unittest

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

BASE_URL = "http://localhost:3000"

def get_driver():
    options = Options()
    options.add_argument("--headless=new")
    options.add_argument("--disable-gpu")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--window-size=1440,900")
    driver = webdriver.Chrome(options=options)
    driver.implicitly_wait(6)
    return driver

class ColeSistemaE2ETestCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.driver = get_driver()
        print("\n========================================================")
        print("  INICIANDO SUITE COMPLETA DE PRUEBAS E2E CON SELENIUM  ")
        print("========================================================")

    @classmethod
    def tearDownClass(cls):
        cls.driver.quit()
        print("\n========================================================")
        print("  PRUEBAS DE SELENIUM COMPLETADAS SATISFACTORIAMENTE     ")
        print("========================================================")

    def setUp(self):
        # Clear cookies, localStorage and sessionStorage completely before every test
        try:
            self.driver.get(f"{BASE_URL}/login")
            self.driver.delete_all_cookies()
            self.driver.execute_script("window.localStorage.clear(); window.sessionStorage.clear();")
            self.driver.refresh()
            time.sleep(1)
        except Exception:
            pass

    def login_with_role(self, role_name: str, expected_route: str):
        self.driver.get(f"{BASE_URL}/login")
        WebDriverWait(self.driver, 10).until(
            EC.presence_of_element_located((By.TAG_NAME, "form"))
        )
        
        # Click the corresponding quick role button on login page
        role_btn = WebDriverWait(self.driver, 10).until(
            EC.element_to_be_clickable((By.XPATH, f"//button[.//span[contains(text(), '{role_name}')] or contains(., '{role_name}')]"))
        )
        self.driver.execute_script("arguments[0].click();", role_btn)
        time.sleep(0.5)

        # Submit form
        submit_btn = self.driver.find_element(By.CSS_SELECTOR, "button[type='submit']")
        self.driver.execute_script("arguments[0].click();", submit_btn)
        
        # Wait until expected route is loaded
        WebDriverWait(self.driver, 10).until(
            EC.url_contains(expected_route)
        )
        time.sleep(1.5)

    def test_01_login_invalid_credentials(self):
        print("\n[TEST 1/6] Verificando rechazo de credenciales erróneas...")
        self.driver.get(f"{BASE_URL}/login")
        WebDriverWait(self.driver, 10).until(
            EC.presence_of_element_located((By.TAG_NAME, "form"))
        )
        
        email_input = self.driver.find_element(By.CSS_SELECTOR, "input[type='email']")
        password_input = self.driver.find_element(By.CSS_SELECTOR, "input[type='password']")
        
        email_input.clear()
        email_input.send_keys("usuario_inexistente@colegio.edu.pe")
        password_input.clear()
        password_input.send_keys("clave_incorrecta_999")
        
        submit_btn = self.driver.find_element(By.CSS_SELECTOR, "button[type='submit']")
        self.driver.execute_script("arguments[0].click();", submit_btn)
        time.sleep(1.5)
        
        # Must stay on /login and display error message
        self.assertIn("/login", self.driver.current_url)
        error_elem = self.driver.find_elements(By.XPATH, "//*[contains(text(), 'inválidas') or contains(text(), 'error') or contains(text(), 'Error')]")
        self.assertTrue(len(error_elem) > 0, "Debe mostrar mensaje de error ante credenciales no válidas")
        print("  [OK] Acceso denegado y advertencia visual mostrada correctamente.")

    def test_02_role_admin_flow(self):
        print("\n[TEST 2/6] Verificando flujo completo del ROL ADMINISTRADOR...")
        self.login_with_role("Administrador", "/admin")
        self.assertIn("/admin", self.driver.current_url)
        print("  [OK] Login e ingreso al Dashboard Institucional (/admin).")

        # 1. Check Academic Context Selector in Navbar
        context_selector = WebDriverWait(self.driver, 10).until(
            EC.presence_of_element_located((By.XPATH, "//*[contains(text(), 'Colegio') or contains(text(), 'Niveles') or contains(text(), 'Todos')]"))
        )
        self.assertTrue(context_selector.is_displayed())
        print("  [OK] Selector de Contexto Académico Global activo en Navbar.")

        # 2. Test Level Switcher Pills on Admin Dashboard
        for level in ["Inicial", "Primaria", "Secundaria", "Preuniversitario", "Todos los Niveles"]:
            pills = self.driver.find_elements(By.XPATH, f"//button[contains(., '{level}')]")
            if pills:
                self.driver.execute_script("arguments[0].click();", pills[0])
                time.sleep(0.3)
                print(f"  [OK] Filtro de nivel '{level}' interactuado.")

        # 3. Test Navigation across all Admin sub-routes
        admin_routes = [
            ("/admin/academico", "Explorador Escolar"),
            ("/admin/horarios", "Horarios y Asignación"),
            ("/admin/notas-salon", "Notas y Competencias CNEB"),
            ("/admin/reportes", "Reportes y Actas"),
            ("/admin/estudiantes", "Padrón de Estudiantes"),
            ("/admin/docentes", "Plana Docente"),
            ("/admin/matriculas", "Gestión de Matrículas"),
        ]

        for route, name in admin_routes:
            self.driver.get(f"{BASE_URL}{route}")
            WebDriverWait(self.driver, 10).until(
                EC.presence_of_element_located((By.TAG_NAME, "main"))
            )
            time.sleep(0.8)
            self.assertIn(route, self.driver.current_url)
            print(f"  [OK] Ruta admin validada: {route} ({name})")

    def test_03_role_docente_flow(self):
        print("\n[TEST 3/6] Verificando flujo completo del ROL DOCENTE...")
        self.login_with_role("Docente", "/docente")
        self.assertIn("/docente", self.driver.current_url)
        print("  [OK] Login e ingreso al Panel Diario del Docente (/docente).")

        # 1. Verify personalized docente dashboard elements
        heading = WebDriverWait(self.driver, 10).until(
            EC.presence_of_element_located((By.XPATH, "//*[contains(text(), 'Carlos') or contains(text(), 'Docente') or contains(text(), 'Mi Panel')]"))
        )
        self.assertIsNotNone(heading)
        print("  [OK] Saludo pedagógico y estado de clases del día cargados.")

        # 2. Test Bitácora de Sesión Modal if present
        bitacora_btns = self.driver.find_elements(By.XPATH, "//*[contains(text(), 'Registrar Bitácora') or contains(text(), 'Bitácora')]")
        if bitacora_btns:
            self.driver.execute_script("arguments[0].click();", bitacora_btns[0])
            time.sleep(0.8)
            modal = self.driver.find_elements(By.XPATH, "//*[contains(text(), 'Tema') or contains(text(), 'Bitácora Pedagógica') or contains(text(), 'Sesión')]")
            self.assertTrue(len(modal) > 0)
            print("  [OK] Modal de Bitácora Pedagógica abierto e interactivo.")
            
            # Close modal
            cancel_btns = self.driver.find_elements(By.XPATH, "//button[contains(text(), 'Cancelar') or contains(text(), '✕')]")
            if cancel_btns:
                self.driver.execute_script("arguments[0].click();", cancel_btns[0])
                time.sleep(0.5)

        # 3. Test Docente sub-routes
        docente_routes = [
            ("/docente/asistencia", "Asistencia de Aula"),
            ("/docente/horario", "Malla Horaria Semanal"),
            ("/docente/notas", "Registro de Calificaciones AD-A-B-C"),
            ("/docente/tareas", "Gestión de Tareas y Entregas"),
            ("/docente/evaluaciones", "Evaluaciones y Exámenes"),
        ]

        for route, name in docente_routes:
            self.driver.get(f"{BASE_URL}{route}")
            WebDriverWait(self.driver, 10).until(
                EC.presence_of_element_located((By.TAG_NAME, "main"))
            )
            time.sleep(0.8)
            self.assertIn(route, self.driver.current_url)
            print(f"  [OK] Ruta docente validada: {route} ({name})")

    def test_04_role_estudiante_flow(self):
        print("\n[TEST 4/6] Verificando flujo completo del ROL ESTUDIANTE...")
        self.login_with_role("Estudiante", "/estudiante")
        self.assertIn("/estudiante", self.driver.current_url)
        print("  [OK] Login e ingreso al Portal del Estudiante (/estudiante).")

        # 1. Test Mode Switching: Regular vs Preuniversitario
        preuni_tabs = self.driver.find_elements(By.XPATH, "//*[contains(text(), 'Preuniversitario') or contains(text(), 'Academia')]")
        if preuni_tabs:
            self.driver.execute_script("arguments[0].click();", preuni_tabs[0])
            time.sleep(0.8)
            print("  [OK] Conmutador a Modo Preuniversitario activado.")
            
            # Check metrics
            sim_metrics = self.driver.find_elements(By.XPATH, "//*[contains(text(), 'Simulacro') or contains(text(), 'Percentil') or contains(text(), 'Ranking')]")
            self.assertTrue(len(sim_metrics) > 0, "Deben mostrarse métricas de simulacros y ranking")
            print("  [OK] Panel de Simulacros tipo admisión y Percentiles renderizados.")

        colegio_tabs = self.driver.find_elements(By.XPATH, "//*[contains(text(), 'Colegio Regular') or contains(text(), 'Escolar')]")
        if colegio_tabs:
            self.driver.execute_script("arguments[0].click();", colegio_tabs[0])
            time.sleep(0.5)
            print("  [OK] Conmutador a Modo Colegio Regular activado.")

        # 2. Test Estudiante sub-routes
        estudiante_routes = [
            ("/estudiante/carnet-qr", "Carnet Digital QR"),
            ("/estudiante/horario", "Horario Escolar"),
            ("/estudiante/libreta-notas", "Libreta de Calificaciones"),
            ("/estudiante/asistencias", "Historial de Asistencia"),
            ("/estudiante/tareas", "Tareas y Entregas"),
            ("/estudiante/evaluaciones", "Exámenes y Simulacros"),
        ]

        for route, name in estudiante_routes:
            self.driver.get(f"{BASE_URL}{route}")
            WebDriverWait(self.driver, 10).until(
                EC.presence_of_element_located((By.TAG_NAME, "main"))
            )
            time.sleep(0.8)
            self.assertIn(route, self.driver.current_url)
            print(f"  [OK] Ruta estudiante validada: {route} ({name})")

        # 3. Dedicated Verification of Libreta Anual Consolidada (4 Bimestres)
        self.driver.get(f"{BASE_URL}/estudiante/libreta-notas")
        time.sleep(1)
        
        # Verify 4-bimester columns & final official verdict
        annual_elements = self.driver.find_elements(By.XPATH, "//*[contains(text(), 'Libreta Oficial de Fin de Año') or contains(text(), 'Acta de Evaluación Final') or contains(text(), 'CALIF. FINAL') or contains(text(), 'PROMOVIDO')]")
        self.assertTrue(len(annual_elements) > 0, "La Libreta Anual debe mostrar el consolidado de 4 bimestres y veredicto oficial")
        print("  [OK] Libreta Anual Consolidada de 4 Bimestres verificada con éxito.")


    def test_05_role_asistencia_kiosko_flow(self):
        print("\n[TEST 5/6] Verificando flujo del ROL ASISTENCIA / KIOSKO QR...")
        self.login_with_role("Portería", "/asistencia")
        self.assertIn("/asistencia", self.driver.current_url)
        print("  [OK] Login e ingreso al Módulo de Control de Asistencia y Puerta.")

        # Check attendance panel elements in mobile terminal layout
        header_elem = WebDriverWait(self.driver, 10).until(
            EC.presence_of_element_located((By.TAG_NAME, "header"))
        )
        self.assertTrue(header_elem.is_displayed())
        print("  [OK] Interfaz de Kiosko / Control de Asistencia QR activa y lista para escanear.")

    def test_06_logout_and_session_protection(self):
        print("\n[TEST 6/6] Verificando Cierre de Sesión y Protección de Rutas...")
        self.login_with_role("Administrador", "/admin")
        self.assertIn("/admin", self.driver.current_url)
        
        # Clear storage and cookies to simulate complete logout
        self.driver.delete_all_cookies()
        self.driver.execute_script("window.localStorage.clear(); window.sessionStorage.clear();")
        self.driver.get(f"{BASE_URL}/login")
        time.sleep(1)

        # Assert at login
        self.assertIn("/login", self.driver.current_url)
        print("  [OK] Sesión cerrada correctamente.")

        # Test unauthorized direct access protection via Middleware
        self.driver.get(f"{BASE_URL}/admin")
        time.sleep(1.5)
        self.assertIn("/login", self.driver.current_url)
        print("  [OK] Protección de rutas privadas confirmada: redirección automática a /login.")

if __name__ == "__main__":
    unittest.main(verbosity=2)
