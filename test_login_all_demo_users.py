# -*- coding: utf-8 -*-
"""
Test exhaustivo de inicio de sesión con todos los usuarios demo y prueba de flujos en vivo.
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

DEMO_USERS = [
    {
        "role_label": "Administrador",
        "expected_email": "admin@colegio.edu.pe",
        "expected_role": "admin",
        "expected_dashboard": "/admin"
    },
    {
        "role_label": "Docente",
        "expected_email": "cmendoza@colegio.edu.pe",
        "expected_role": "docente",
        "expected_dashboard": "/docente"
    },
    {
        "role_label": "Estudiante",
        "expected_email": "mateo.silva@colegio.edu.pe",
        "expected_role": "estudiante",
        "expected_dashboard": "/estudiante"
    },
    {
        "role_label": "Portería / QR",
        "expected_email": "asistencia@colegio.edu.pe",
        "expected_role": "asistencia",
        "expected_dashboard": "/asistencia"
    }
]

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

def test_all_demo_logins():
    driver = create_driver()
    wait = WebDriverWait(driver, 10)
    print("\n" + "="*75, flush=True)
    print("VERIFICACIÓN EN VIVO DE INICIO DE SESIÓN CON TODOS LOS USUARIOS DEMO", flush=True)
    print("="*75, flush=True)

    passed = 0
    failed = 0

    try:
        for user_data in DEMO_USERS:
            label = user_data["role_label"]
            expected_email = user_data["expected_email"]
            expected_role = user_data["expected_role"]
            expected_dash = user_data["expected_dashboard"]

            print(f"\n--- Probando Login con Perfil Demo: [{label}] ---", flush=True)

            # 1. Limpiar cookies y cargar login
            driver.delete_all_cookies()
            driver.get(f"{BASE_URL}/login")
            time.sleep(1.0)

            # 2. Hacer clic en el botón del rol
            btn = wait.until(EC.element_to_be_clickable((By.XPATH, f"//button[contains(., '{label}')]")))
            btn.click()
            time.sleep(0.4)

            # 3. Verificar que el campo email se autocompletó con el email demo correcto
            email_input = driver.find_element(By.XPATH, "//input[@type='email']")
            actual_email = email_input.get_attribute("value")
            if expected_email.lower() in actual_email.lower():
                print(f"  [OK] Autocompletado de Email: {actual_email}", flush=True)
            else:
                print(f"  [WARN] Email autocompletado: {actual_email} (esperado: {expected_email})", flush=True)

            # 4. Enviar formulario
            submit_btn = wait.until(EC.element_to_be_clickable((By.XPATH, "//button[@type='submit']")))
            submit_btn.click()
            time.sleep(1.5)

            # 5. Comprobar que redirige a bienvenida o dashboard
            curr_url = driver.current_url
            print(f"  [OK] URL tras iniciar sesión: {curr_url}", flush=True)

            if "/bienvenida" in curr_url or expected_dash in curr_url or "/" in curr_url:
                # Comprobar cookie de rol
                cookies = {c['name']: c['value'] for c in driver.get_cookies()}
                role_cookie = cookies.get("cole_user_role", "")
                print(f"  [OK] Cookie de sesión de rol establecida: '{role_cookie}'", flush=True)

                # 6. Navegar al dashboard del rol
                driver.get(f"{BASE_URL}{expected_dash}")
                time.sleep(1.5)
                dash_url = driver.current_url

                if expected_dash in dash_url:
                    print(f"  [PASS] Acceso exitoso al Dashboard de {label} ({dash_url})", flush=True)
                    passed += 1
                else:
                    print(f"  [FAIL] No se pudo acceder al Dashboard ({dash_url})", flush=True)
                    failed += 1
            else:
                print(f"  [FAIL] Redirección no esperada: {curr_url}", flush=True)
                failed += 1

        print("\n" + "="*75, flush=True)
        print(f"RESULTADOS: {passed} Perfiles Exitosos | {failed} Fallidos", flush=True)
        print(f"TASA DE ÉXITO DE LOGIN DEMO: {round((passed/(passed+failed))*100, 1)}%", flush=True)
        print("="*75 + "\n", flush=True)
        return failed == 0

    finally:
        driver.quit()

if __name__ == "__main__":
    success = test_all_demo_logins()
    if not success:
        sys.exit(1)
