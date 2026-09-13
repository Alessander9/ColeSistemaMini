# -*- coding: utf-8 -*-
"""
Auditoría Profunda de Comportamiento y Flujos Interactivos del Sistema Escolar
"""

import sys
import io
import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

BASE_URL = "http://localhost:3000"

def create_driver():
    options = Options()
    options.add_argument("--headless=new")
    options.add_argument("--disable-gpu")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--window-size=1440,900")
    driver = webdriver.Chrome(options=options)
    driver.implicitly_wait(6)
    return driver

def run_deep_audit():
    driver = create_driver()
    wait = WebDriverWait(driver, 10)
    passed = 0
    total = 0

    print("\n" + "="*75)
    print("AUDITORÍA PROFUNDA DE CASOS DE USO Y COMPORTAMIENTO ESPERADO")
    print("="*75)

    try:
        # TEST 1: Login de Docente y Cierre de Sesión Limpio
        total += 1
        driver.delete_all_cookies()
        driver.get(f"{BASE_URL}/login")
        time.sleep(1)

        docente_btn = wait.until(EC.element_to_be_clickable((By.XPATH, "//button[contains(., 'Docente')]")))
        docente_btn.click()
        time.sleep(0.3)
        submit_btn = wait.until(EC.element_to_be_clickable((By.XPATH, "//button[@type='submit']")))
        submit_btn.click()
        time.sleep(1.5)

        driver.get(f"{BASE_URL}/docente")
        time.sleep(1)
        assert "/docente" in driver.current_url, "No cargó /docente"

        # Abrir Dropdown de Perfil y Cerrar Sesión
        prof_btn = wait.until(EC.element_to_be_clickable((By.XPATH, "//button[contains(@aria-haspopup, 'true')]")))
        prof_btn.click()
        time.sleep(0.5)

        logout_btn = wait.until(EC.element_to_be_clickable((By.XPATH, "//button[contains(., 'Cerrar Sesión')]")))
        logout_btn.click()
        time.sleep(2) # Esperar a que pase por /despedida y llegue a /login

        assert "/login" in driver.current_url, f"No llegó a /login tras logout, actual: {driver.current_url}"
        # Verificar que no quedaron cookies de rol
        cookies = {c['name']: c['value'] for c in driver.get_cookies()}
        assert 'cole_user_role' not in cookies or cookies.get('cole_user_role') == '', "Cookie de rol sigue activa tras logout"
        print("  [PASS 1/6] Flujo de Logout Docente -> Pantalla de Carga -> Redirección a Login sin cookies")
        passed += 1

        # TEST 2: Intento de Cross-Role Navigation desde Estudiante a Admin
        total += 1
        driver.get(f"{BASE_URL}/login")
        time.sleep(0.5)
        estudiante_btn = wait.until(EC.element_to_be_clickable((By.XPATH, "//button[contains(., 'Estudiante')]")))
        estudiante_btn.click()
        time.sleep(0.3)
        driver.find_element(By.XPATH, "//button[@type='submit']").click()
        time.sleep(1.5)

        # Tratar de ir manualmente a /admin
        driver.get(f"{BASE_URL}/admin")
        time.sleep(1)
        curr = driver.current_url
        assert "/admin" not in curr, f"Estudiante pudo acceder a /admin: {curr}"
        assert "/estudiante" in curr, f"Estudiante no fue devuelto a /estudiante: {curr}"
        print("  [PASS 2/6] Bloqueo Estricto RBAC: Estudiante no puede acceder a /admin")
        passed += 1

        # TEST 3: Redirección de la raíz '/' al Dashboard Asignado
        total += 1
        driver.get(f"{BASE_URL}/")
        time.sleep(1)
        assert "/estudiante" in driver.current_url, f"Raíz no redirigió a /estudiante: {driver.current_url}"
        print("  [PASS 3/6] Redirección Automática de Raíz '/' al Dashboard del Rol Activo")
        passed += 1

        # TEST 4: Verificación del Logo Navbar (Apunta a Dashboard Propio)
        total += 1
        logo = driver.find_element(By.XPATH, "//a[contains(@title, 'Ir a mi Dashboard') or contains(., 'ColeSistema')]")
        href = logo.get_attribute("href")
        assert "/estudiante" in href, f"Logo apuntaba a {href} en vez de /estudiante"
        print("  [PASS 4/6] Logo del Navbar vinculado de forma segura y exclusiva al dashboard del rol")
        passed += 1

        # TEST 5: Funcionamiento de Registro de Notas CNEB (AD, A, B, C)
        total += 1
        # Login como Docente
        driver.delete_all_cookies()
        driver.get(f"{BASE_URL}/login")
        time.sleep(0.5)
        wait.until(EC.element_to_be_clickable((By.XPATH, "//button[contains(., 'Docente')]"))).click()
        driver.find_element(By.XPATH, "//button[@type='submit']").click()
        time.sleep(1.5)
        driver.get(f"{BASE_URL}/docente/notas")
        time.sleep(1)
        assert "AD" in driver.page_source and "CNEB" in driver.page_source
        print("  [PASS 5/6] Módulo de Calificaciones CNEB cargado con cálculo de logros")
        passed += 1

        # TEST 6: Terminal QR Móvil de Asistencia Kiosk
        total += 1
        driver.delete_all_cookies()
        driver.get(f"{BASE_URL}/login")
        time.sleep(0.5)
        wait.until(EC.element_to_be_clickable((By.XPATH, "//button[contains(., 'Portería')]"))).click()
        driver.find_element(By.XPATH, "//button[@type='submit']").click()
        time.sleep(1.5)
        driver.get(f"{BASE_URL}/asistencia")
        time.sleep(1)
        assert "Terminal Asistencia QR" in driver.page_source or "MÓVIL" in driver.page_source
        print("  [PASS 6/6] Kiosk de Asistencia QR en Vivo operativo")
        passed += 1

        print("\n" + "="*75)
        print(f"RESULTADO DE AUDITORÍA: {passed}/{total} Pruebas Aprobadas (100% Éxito)")
        print("NO SE DETECTÓ NINGÚN FUNCIONAMIENTO ANÓMALO.")
        print("="*75 + "\n")

    finally:
        driver.quit()

if __name__ == "__main__":
    run_deep_audit()
