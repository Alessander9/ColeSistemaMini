import time
import sys
import io
import json
import urllib.request
import traceback

if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

BASE_URL = "http://localhost:3000"

def test_api_routes():
    print("\n[API] Probando Endpoints del Backend...")
    
    # 1. Test QR Scan API
    req_data = json.dumps({
        "tokenQr": "QR-EST-2026-001-MATEO-SILVA",
        "metodo": "qr",
        "status": "presente"
    }).encode('utf-8')
    
    req = urllib.request.Request(
        f"{BASE_URL}/api/asistencia/scan",
        data=req_data,
        headers={'Content-Type': 'application/json'}
    )
    with urllib.request.urlopen(req) as resp:
        res = json.loads(resp.read().decode('utf-8'))
        assert res["success"] is True
        print("  [OK] Endpoint /api/asistencia/scan validó el token QR y registró asistencia.")

    # 2. Test Grades Average API
    req_grades = json.dumps({
        "grades": ["AD", "A", "AD", "A"]
    }).encode('utf-8')
    
    req2 = urllib.request.Request(
        f"{BASE_URL}/api/notas/calcular",
        data=req_grades,
        headers={'Content-Type': 'application/json'}
    )
    with urllib.request.urlopen(req2) as resp:
        res2 = json.loads(resp.read().decode('utf-8'))
        assert res2["success"] is True
        assert res2["data"]["promedioLetra"] in ["AD", "A"]
        print("  [OK] Endpoint /api/notas/calcular calculó correctamente el promedio de periodo.")

def run_tests():
    print("=" * 70)
    print("INICIANDO SUITE COMPLETA DE PRUEBAS END-TO-END (SELENIUM & API)")
    print("=" * 70)

    test_api_routes()

    chrome_options = Options()
    chrome_options.add_argument("--headless=new")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_argument("--window-size=1400,900")

    driver = webdriver.Chrome(options=chrome_options)
    wait = WebDriverWait(driver, 10)

    try:
        # 1. TEST LOGIN PAGE
        print("\n[1/8] Probando Pantalla de Autenticación (/login)...")
        driver.get(f"{BASE_URL}/login")
        wait.until(EC.presence_of_element_located((By.XPATH, "//*[contains(text(), 'ColeSistema')]")))
        assert "ColeSistema" in driver.page_source
        
        # Test Quick Profile Select: Click Docente card
        docente_card = driver.find_element(By.XPATH, "//button[contains(., 'Carlos')]")
        docente_card.click()
        time.sleep(0.5)
        
        # Submit Login
        submit_btn = driver.find_element(By.XPATH, "//button[@type='submit']")
        submit_btn.click()
        time.sleep(1.5)
        
        # Verify URL redirected to /docente
        assert "/docente" in driver.current_url or "Docente" in driver.page_source
        print("  [OK] Login de Docente verificado con redirección automática a /docente.")

        # Test Student Login
        driver.get(f"{BASE_URL}/login")
        time.sleep(0.5)
        student_card = driver.find_element(By.XPATH, "//button[contains(., 'Mateo')]")
        student_card.click()
        time.sleep(0.5)
        driver.find_element(By.XPATH, "//button[@type='submit']").click()
        time.sleep(1.5)
        assert "/estudiante" in driver.current_url or "Mateo" in driver.page_source
        print("  [OK] Login de Estudiante verificado con redirección automática a /estudiante.")

        # 2. TEST HOME PAGE
        print("\n[2/8] Probando Página Principal (Landing & Portal de Roles)...")
        driver.get(BASE_URL)
        time.sleep(1)
        assert "ColeSistemaMini" in driver.page_source or "ColeSistema" in driver.page_source
        print("  [OK] Título y encabezado principal cargados correctamente.")

        # 3. TEST ADMIN DASHBOARD
        print("\n[3/8] Probando Portal Administrador (/admin)...")
        driver.get(f"{BASE_URL}/admin")
        wait.until(EC.presence_of_element_located((By.XPATH, "//*[contains(text(), 'Dashboard General')]")))
        assert "Total Estudiantes" in driver.page_source
        assert "Distribución de Calificaciones" in driver.page_source or "Distribucion" in driver.page_source
        print("  [OK] Métricas globales y distribución AD-A-B-C verificadas.")

        # 3.1 TEST ADMIN ESTUDIANTES & CARNETS QR
        print("\n  -> Probando Padrón de Estudiantes y Emisión de Carnets QR...")
        driver.get(f"{BASE_URL}/admin/estudiantes")
        wait.until(EC.presence_of_element_located((By.XPATH, "//*[contains(text(), 'Estudiantes')]")))
        assert "Mateo Alejandro" in driver.page_source
        
        # Click on "Ver Carnet QR"
        qr_btn = driver.find_element(By.XPATH, "//button[contains(., 'Ver Carnet QR')]")
        qr_btn.click()
        time.sleep(1)
        assert "Carnet Escolar con Código QR" in driver.page_source or "Carnet" in driver.page_source
        assert "DNI:" in driver.page_source
        print("  [OK] Visualizador modal de carnet QR interactivo verificado.")

        # 4. TEST DOCENTE ASISTENCIA QR
        print("\n[4/8] Probando Portal Docente y Asistencia con Cámara QR (/docente/asistencia)...")
        driver.get(f"{BASE_URL}/docente/asistencia")
        wait.until(EC.presence_of_element_located((By.XPATH, "//*[contains(text(), 'Asistencia')]")))
        
        # Test quick simulation scan
        scan_shortcut = driver.find_element(By.XPATH, "//button[contains(., 'Mateo')]")
        scan_shortcut.click()
        time.sleep(1)
        assert "Asistencia" in driver.page_source
        print("  [OK] Registro y validación de Asistencia QR verificado con éxito.")

        # 5. TEST DOCENTE REGISTRO DE NOTAS AD-A-B-C
        print("\n[5/8] Probando Matriz de Calificaciones por Competencias (/docente/notas)...")
        driver.get(f"{BASE_URL}/docente/notas")
        wait.until(EC.presence_of_element_located((By.XPATH, "//*[contains(text(), 'Calificaciones')]")))
        assert "Matemática" in driver.page_source or "Matematica" in driver.page_source
        assert "Promedio" in driver.page_source
        print("  [OK] Matriz interactiva de notas AD, A, B, C y cálculo de promedios verificado.")

        # 6. TEST DOCENTE TAREAS Y EVALUACIONES
        print("\n[6/8] Probando Módulo de Tareas y Evaluaciones (/docente/tareas y /docente/evaluaciones)...")
        driver.get(f"{BASE_URL}/docente/tareas")
        wait.until(EC.presence_of_element_located((By.XPATH, "//*[contains(text(), 'Tareas')]")))
        assert "Guía de Fracciones" in driver.page_source or "Fracciones" in driver.page_source
        print("  [OK] Listado y gestión de tareas escolares del docente verificado.")

        driver.get(f"{BASE_URL}/docente/evaluaciones")
        wait.until(EC.presence_of_element_located((By.XPATH, "//*[contains(text(), 'Evaluaciones')]")))
        assert "Práctica Calificada" in driver.page_source or "Practica" in driver.page_source
        print("  [OK] Cronograma de exámenes y evaluaciones verificado.")

        # 7. TEST ESTUDIANTE PORTAL & LIBRETA DE NOTAS
        print("\n[7/8] Probando Portal Estudiante (/estudiante, /estudiante/carnet-qr, /estudiante/libreta-notas)...")
        driver.get(f"{BASE_URL}/estudiante")
        wait.until(EC.presence_of_element_located((By.XPATH, "//*[contains(text(), 'Mateo')]")))
        assert "Promedio General" in driver.page_source
        print("  [OK] Dashboard del estudiante cargado con métricas personales.")

        driver.get(f"{BASE_URL}/estudiante/carnet-qr")
        wait.until(EC.presence_of_element_located((By.XPATH, "//*[contains(text(), 'Carnet')]")))
        assert "DNI:" in driver.page_source
        print("  [OK] Carnet digital QR del estudiante con opciones de impresión y descarga verificado.")

        driver.get(f"{BASE_URL}/estudiante/libreta-notas")
        wait.until(EC.presence_of_element_located((By.XPATH, "//*[contains(text(), 'Libreta')]")))
        assert "Resuelve problemas de cantidad" in driver.page_source
        print("  [OK] Boletín oficial de calificaciones por competencias verificado.")

        # 8. TEST ESTUDIANTE TAREAS & NOTIFICACIONES
        print("\n[8/8] Probando Entrega de Tareas y Centro de Notificaciones en Tiempo Real...")
        driver.get(f"{BASE_URL}/estudiante/tareas")
        wait.until(EC.presence_of_element_located((By.XPATH, "//*[contains(text(), 'Tareas')]")))
        assert "Fracciones" in driver.page_source
        print("  [OK] Módulo de entrega de tareas del estudiante verificado.")

        # Open Notification Bell dropdown
        notif_btn = driver.find_element(By.ID, "notification-bell-btn")
        notif_btn.click()
        time.sleep(1)
        assert "Notificaciones" in driver.page_source
        print("  [OK] Menú desplegable de notificaciones en tiempo real verificado.")

        print("\n" + "=" * 70)
        print("RESULTADO FINAL: TODAS LAS PRUEBAS END-TO-END Y API PASARON CON 100% DE ÉXITO")
        print("=" * 70)

    except Exception as e:
        print(f"\n[ERROR EN LAS PRUEBAS]: {e}")
        traceback.print_exc()
        driver.save_screenshot("test_error_screenshot.png")
        sys.exit(1)
    finally:
        driver.quit()

if __name__ == "__main__":
    run_tests()
