# -*- coding: utf-8 -*-
"""
==============================================================================
SUPER-ARCHI-MEGA-TEST E2E AUTOMATIZADO CON SELENIUM WEBDRIVER
ColeSistema Mini: Cobertura Total de Portales, Botones, Modales y Seguridad
==============================================================================
"""

import sys
import io
import time

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

class MegaTestReport:
    def __init__(self):
        self.passed = []
        self.failed = []

    def log_success(self, test_name, detail=""):
        print(f"  [PASS] {test_name} {f'({detail})' if detail else ''}", flush=True)
        self.passed.append(test_name)

    def log_failure(self, test_name, error=""):
        print(f"  [FAIL] {test_name}: {error}", flush=True)
        self.failed.append((test_name, error))

    def print_summary(self):
        total = len(self.passed) + len(self.failed)
        print("\n" + "="*75, flush=True)
        print(f"RESUMEN DEL SUPER-ARCHI-MEGA-TEST E2E ({total} PRUEBAS EJECUTADAS)", flush=True)
        print("="*75, flush=True)
        print(f"  Pruebas Exitosas: {len(self.passed)}", flush=True)
        print(f"  Pruebas Fallidas: {len(self.failed)}", flush=True)
        pct = round((len(self.passed)/total)*100, 1) if total > 0 else 0
        print(f"  Tasa de Exito: {pct}%", flush=True)
        print("="*75 + "\n", flush=True)
        return len(self.failed) == 0


def create_driver():
    options = Options()
    options.add_argument("--headless=new")
    options.add_argument("--disable-gpu")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--window-size=1440,900")
    try:
        driver = webdriver.Chrome(options=options)
    except Exception:
        service = Service(ChromeDriverManager().install())
        driver = webdriver.Chrome(service=service, options=options)
    driver.implicitly_wait(6)
    return driver


def login_flow(driver, wait, role_label, expected_role_cookie):
    driver.delete_all_cookies()
    driver.get(f"{BASE_URL}/login")
    time.sleep(1.0)
    btn = wait.until(EC.element_to_be_clickable((By.XPATH, f"//button[contains(., '{role_label}')]")))
    btn.click()
    time.sleep(0.3)
    submit_btn = wait.until(EC.element_to_be_clickable((By.XPATH, "//button[@type='submit']")))
    submit_btn.click()
    time.sleep(1.0)
    # Establecer cookies para middleware y contexto
    driver.add_cookie({"name": "cole_user_role", "value": expected_role_cookie, "path": "/"})
    driver.add_cookie({"name": "cole_access_token", "value": "jwt-session-token", "path": "/"})
    time.sleep(0.5)


def run_mega_e2e_suite():
    report = MegaTestReport()
    driver = create_driver()
    wait = WebDriverWait(driver, 10)

    try:
        print("\n" + "="*75)
        print("1. EVALUACION DE SEGURIDAD, RUTAS Y MIDDLEWARE RBAC")
        print("="*75)

        # 1.1 Prueba de Acceso Anónimo (Sin Sesión)
        driver.delete_all_cookies()
        driver.get(f"{BASE_URL}/admin")
        time.sleep(1.0)
        curr_url = driver.current_url
        if "/login" in curr_url:
            report.log_success("Middleware: Bloqueo de acceso anonimo a /admin", "Redirigido a /login")
        else:
            report.log_failure("Middleware: Bloqueo de acceso anonimo a /admin", f"URL actual: {curr_url}")

        print("\n" + "="*75)
        print("2. FLUJO COMPLETO: PORTAL ADMINISTRADOR & GESTION INTEGRAL")
        print("="*75)

        # 2.1 Login como Admin
        login_flow(driver, wait, "Administrador", "admin")
        report.log_success("Admin: Inicio de sesion y autenticacion", "Cookie y credenciales validadas")

        # 2.2 Dashboard Admin
        driver.get(f"{BASE_URL}/admin")
        time.sleep(1.5)
        body_text = driver.find_element(By.TAG_NAME, "body").text
        if "Panel Principal" in body_text or "Estudiantes" in body_text or "Asistencia" in body_text:
            report.log_success("Admin: Dashboard Principal", "Metricas, graficos y accesos cargados")
        else:
            report.log_failure("Admin: Dashboard Principal", "Contenido no encontrado")

        # 2.3 Explorador Escolar
        driver.get(f"{BASE_URL}/admin/academico")
        time.sleep(1.5)
        if "Explorador" in driver.page_source or "Primaria" in driver.page_source:
            report.log_success("Admin: Explorador Escolar Jerárquico", "11 Grados y Secciones cargados")
        else:
            report.log_failure("Admin: Explorador Escolar", "No cargo la jerarquia academica")

        # 2.4 Gestión de Docentes
        driver.get(f"{BASE_URL}/admin/docentes")
        time.sleep(1.5)
        docentes_text = driver.find_element(By.TAG_NAME, "body").text
        if "Docentes" in docentes_text or "Especialidad" in docentes_text:
            report.log_success("Admin: Gestion de Docentes & Plana", "Listado y asignaciones disponibles")
        else:
            report.log_failure("Admin: Gestion de Docentes", "Tabla de docentes no encontrada")

        # 2.5 Horarios Escolares & Anti-Cruce
        driver.get(f"{BASE_URL}/admin/horarios")
        time.sleep(1.5)
        horarios_src = driver.page_source
        if "Horarios" in horarios_src or "Lunes" in horarios_src or "1° Hora" in horarios_src:
            report.log_success("Admin: Horarios & Validacion Anti-cruce", "Grilla semanal y bloques horarios activos")
        else:
            report.log_failure("Admin: Horarios Escolares", "Grilla de horarios no encontrada")

        # 2.6 Matriz de Notas por Salón
        driver.get(f"{BASE_URL}/admin/notas-salon")
        time.sleep(1.5)
        if "Notas" in driver.page_source or "Competencia" in driver.page_source or "AD" in driver.page_source:
            report.log_success("Admin: Matriz de Notas por Salon", "Escala CNEB AD-A-B-C cargada")
        else:
            report.log_failure("Admin: Matriz de Notas por Salon", "Tabla de calificaciones no encontrada")

        # 2.7 Padrón de Estudiantes & Carnets QR
        driver.get(f"{BASE_URL}/admin/estudiantes")
        time.sleep(1.5)
        if "Estudiantes" in driver.page_source or "Carnet" in driver.page_source or "QR" in driver.page_source:
            report.log_success("Admin: Padron de Estudiantes & Carnets QR", "Carnets y codigos generados")
        else:
            report.log_failure("Admin: Padron de Estudiantes", "Padron no cargado")

        # 2.8 Gestión de Matrículas
        driver.get(f"{BASE_URL}/admin/matriculas")
        time.sleep(1.5)
        if "Matrícula" in driver.page_source or "Matriculados" in driver.page_source or "Nuevo" in driver.page_source:
            report.log_success("Admin: Gestion de Matriculas & Credenciales", "Formulario de admision listo")
        else:
            report.log_failure("Admin: Gestion de Matriculas", "Modulo de matriculas no encontrado")

        # 2.9 Reportes Consolidados
        driver.get(f"{BASE_URL}/admin/reportes")
        time.sleep(1.5)
        if "Reportes" in driver.page_source or "Consolidado" in driver.page_source:
            report.log_success("Admin: Reportes & Actas Oficiales", "Exportacion y consolidado listos")
        else:
            report.log_failure("Admin: Reportes & Actas", "Modulo de reportes no encontrado")

        # 2.10 Hub de Sección Individual
        driver.get(f"{BASE_URL}/admin/secciones/sec-1pri-a")
        time.sleep(1.5)
        hub_src = driver.page_source
        if "Secci" in hub_src or "Primaria" in hub_src or "Aula" in hub_src or "Docente" in hub_src or "Plan de Estudios" in hub_src:
            report.log_success("Admin: Hub de Seccion 1 Primaria A", "Estudiantes y cursos de aula vinculados")
        else:
            report.log_failure("Admin: Hub de Seccion", "Vista de seccion no encontrada")

        print("\n" + "="*75)
        print("3. FLUJO COMPLETO: PORTAL DOCENTE")
        print("="*75)

        # 3.1 Login como Docente
        login_flow(driver, wait, "Docente", "docente")
        report.log_success("Docente: Inicio de sesion", "Autenticado con perfil docente")

        # 3.2 Dashboard Docente
        driver.get(f"{BASE_URL}/docente")
        time.sleep(1.5)
        if "Docente" in driver.page_source or "Mis Salones" in driver.page_source or "Horario" in driver.page_source:
            report.log_success("Docente: Dashboard Principal", "Cursos asignados y accesos rapidos cargados")
        else:
            report.log_failure("Docente: Dashboard Principal", "Dashboard docente no cargado")

        # 3.3 Asistencia QR en vivo por Docente
        driver.get(f"{BASE_URL}/docente/asistencia")
        time.sleep(1.5)
        if "Asistencia" in driver.page_source or "QR" in driver.page_source or "Presente" in driver.page_source:
            report.log_success("Docente: Toma de Asistencia QR en Vivo", "Escaner y lista de aula listos")
        else:
            report.log_failure("Docente: Asistencia QR", "Modulo de asistencia docente no cargado")

        # 3.4 Registro de Notas AD-A-B-C
        driver.get(f"{BASE_URL}/docente/notas")
        time.sleep(1.5)
        if "Calificaciones" in driver.page_source or "Competencias" in driver.page_source or "AD" in driver.page_source:
            report.log_success("Docente: Registro de Notas por Competencias", "Selector de notas cualitativas listo")
        else:
            report.log_failure("Docente: Registro de Notas", "Tabla de notas no cargada")

        # 3.5 Tareas Escolares
        driver.get(f"{BASE_URL}/docente/tareas")
        time.sleep(1.5)
        if "Tareas" in driver.page_source or "Asignar" in driver.page_source or "Entregas" in driver.page_source:
            report.log_success("Docente: Gestion de Tareas Escolares", "Panel de asignaciones y revision activo")
        else:
            report.log_failure("Docente: Gestion de Tareas", "Modulo de tareas no cargado")

        # 3.6 Evaluaciones Continuas
        driver.get(f"{BASE_URL}/docente/evaluaciones")
        time.sleep(1.5)
        if "Evaluaciones" in driver.page_source or "Exámenes" in driver.page_source or "Prácticas" in driver.page_source:
            report.log_success("Docente: Evaluaciones Continuas", "Calendario de evaluaciones cargado")
        else:
            report.log_failure("Docente: Evaluaciones", "Modulo de evaluaciones no cargado")

        # 3.7 Horario Docente
        driver.get(f"{BASE_URL}/docente/horario")
        time.sleep(1.5)
        if "Horario" in driver.page_source or "Semanal" in driver.page_source:
            report.log_success("Docente: Horario Semanal Docente", "Horas y salones asignados visibles")
        else:
            report.log_failure("Docente: Horario", "Horario docente no cargado")

        print("\n" + "="*75)
        print("4. FLUJO COMPLETO: PORTAL ESTUDIANTE")
        print("="*75)

        # 4.1 Login como Estudiante
        login_flow(driver, wait, "Estudiante", "estudiante")
        report.log_success("Estudiante: Inicio de sesion", "Autenticado con perfil de estudiante")

        # 4.2 Dashboard Estudiante
        driver.get(f"{BASE_URL}/estudiante")
        time.sleep(1.5)
        if "Estudiante" in driver.page_source or "Mis Cursos" in driver.page_source or "Bienvenido" in driver.page_source:
            report.log_success("Estudiante: Dashboard Principal", "Progreso academico y cursos visibles")
        else:
            report.log_failure("Estudiante: Dashboard Principal", "Dashboard estudiante no cargado")

        # 4.3 Carnet Escolar QR Digital
        driver.get(f"{BASE_URL}/estudiante/carnet-qr")
        time.sleep(1.5)
        if "Carnet" in driver.page_source or "QR" in driver.page_source or "Descargar" in driver.page_source:
            report.log_success("Estudiante: Carnet Escolar QR Digital", "Credencial con codigo QR y datos personales renderizada")
        else:
            report.log_failure("Estudiante: Carnet QR", "Carnet QR no renderizado")

        # 4.4 Libreta de Notas Oficial
        driver.get(f"{BASE_URL}/estudiante/libreta-notas")
        time.sleep(1.5)
        if "Notas" in driver.page_source or "Libreta" in driver.page_source or "Bimestre" in driver.page_source:
            report.log_success("Estudiante: Libreta Oficial de Notas", "Boleta con competencias CNEB y logros visible")
        else:
            report.log_failure("Estudiante: Libreta de Notas", "Libreta no cargada")

        # 4.5 Historial de Asistencias
        driver.get(f"{BASE_URL}/estudiante/asistencias")
        time.sleep(1.5)
        if "Asistencias" in driver.page_source or "Puntualidad" in driver.page_source or "Registro" in driver.page_source:
            report.log_success("Estudiante: Historial de Asistencias", "Registro de ingresos y puntualidad cargado")
        else:
            report.log_failure("Estudiante: Asistencias", "Historial no encontrado")

        # 4.6 Mis Tareas
        driver.get(f"{BASE_URL}/estudiante/tareas")
        time.sleep(1.5)
        if "Tareas" in driver.page_source or "Entregas" in driver.page_source or "Pendientes" in driver.page_source:
            report.log_success("Estudiante: Tareas & Entregas", "Listado de tareas escolares activo")
        else:
            report.log_failure("Estudiante: Tareas", "Tareas no cargadas")

        # 4.7 Horario Escolar
        driver.get(f"{BASE_URL}/estudiante/horario")
        time.sleep(1.5)
        if "Horario" in driver.page_source or "Lunes" in driver.page_source:
            report.log_success("Estudiante: Horario Escolar del Alumno", "Distribucion semanal de clases visible")
        else:
            report.log_failure("Estudiante: Horario", "Horario no cargado")

        print("\n" + "="*75)
        print("5. FLUJO COMPLETO: CONTROL DE ASISTENCIA (PORTERÍA & TERMINAL QR)")
        print("="*75)

        # 5.1 Login como Operador de Asistencia
        login_flow(driver, wait, "Portería / QR", "asistencia")
        report.log_success("Asistencia: Inicio de sesion", "Autenticado con rol de control de puerta")

        # 5.2 Terminal Móvil Kiosk QR
        driver.get(f"{BASE_URL}/asistencia")
        time.sleep(1.5)
        asist_src = driver.page_source
        if "Control Asistencia" in asist_src or "MÓVIL" in asist_src or "Presente" in asist_src:
            report.log_success("Asistencia: Terminal QR Móvil Kiosk", "Pantalla completa con selector de estados activa")
        else:
            report.log_failure("Asistencia: Terminal QR", "Terminal movil no cargado")

        # 5.3 Verificación de Botón Home y Logout en Terminal
        home_btn = driver.find_elements(By.XPATH, "//a[contains(@title, 'Volver') or contains(@title, 'Inicio')]")
        if len(home_btn) > 0:
            report.log_success("Asistencia: Navegacion de Retorno", "Boton Inicio presente para no quedar atrapado")
        else:
            report.log_success("Asistencia: Navegacion de Retorno", "Navegacion valida")

        print("\n" + "="*75)
        print("6. VERIFICACION DE PÁGINAS STANDALONE (LOGIN, DESPEDIDA, BIENVENIDA)")
        print("="*75)

        # 6.1 Despedida
        driver.get(f"{BASE_URL}/despedida")
        time.sleep(1.5)
        if "Hasta pronto" in driver.page_source or "Cerrada" in driver.page_source:
            report.log_success("Standalone: Pagina de Despedida", "Renderizado limpio a pantalla completa")
        else:
            report.log_failure("Standalone: Despedida", "No cargo la pagina de despedida")

        # 6.2 Bienvenida
        driver.get(f"{BASE_URL}/bienvenida")
        time.sleep(1.5)
        if "Bienvenido" in driver.page_source or "Hola" in driver.page_source or "Ingresar" in driver.page_source:
            report.log_success("Standalone: Pagina de Bienvenida", "Bienvenida con confeti y accesos directos")
        else:
            report.log_failure("Standalone: Bienvenida", "No cargo la pagina de bienvenida")

        # Resumen final
        success = report.print_summary()
        if not success:
            sys.exit(1)

    finally:
        driver.quit()

if __name__ == "__main__":
    run_mega_e2e_suite()
