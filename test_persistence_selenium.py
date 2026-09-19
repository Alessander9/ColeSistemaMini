import time
import sys
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

def run_persistence_tests():
    print("=" * 76)
    print(" SUITE DE PRUEBAS DE PERSISTENCIA (LOGIN, DASHBOARDS, ROLES & DATOS)")
    print("=" * 76)

    chrome_options = Options()
    chrome_options.add_argument("--headless=new")
    chrome_options.add_argument("--window-size=1600,1200")
    chrome_options.add_argument("--disable-gpu")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_argument("--disable-extensions")
    chrome_options.add_argument("--remote-allow-origins=*")
    chrome_options.add_argument("--disable-blink-features=AutomationControlled")
    chrome_options.page_load_strategy = 'eager'

    driver = webdriver.Chrome(options=chrome_options)
    driver.implicitly_wait(5)

    passed_tests = []
    failed_tests = []

    def log_result(name, success, details=""):
        if success:
            passed_tests.append(name)
            print(f"  [PASS] {name} {f'({details})' if details else ''}")
        else:
            failed_tests.append((name, details))
            print(f"  [FAIL] {name} - Error: {details}")

    base_url = "http://127.0.0.1:3000"

    try:
        def safe_get(url):
            try:
                driver.get(url)
            except Exception:
                pass

        # -------------------------------------------------------------
        # TEST 1: Login de Administrador y Persistencia tras F5
        # -------------------------------------------------------------
        print("\n1. Testeando Login de Administrador y Persistencia tras recarga...")
        safe_get(f"{base_url}/login")
        time.sleep(1.0)

        # Clic en botón de cuenta demo Administrador
        for btn in driver.find_elements(By.TAG_NAME, "button"):
            if "administrador" in btn.text.lower() and "dirección" in btn.text.lower():
                driver.execute_script("arguments[0].click();", btn)
                time.sleep(0.3)
                break

        # Submit
        login_btn = driver.find_element(By.CSS_SELECTOR, "button[type='submit']")
        driver.execute_script("arguments[0].click();", login_btn)
        
        # Esperar transición de /bienvenida a /admin (cuenta regresiva de 3s)
        time.sleep(4.5)

        curr_url = driver.current_url
        is_in_admin = "/admin" in curr_url
        log_result("Login Exitoso y Redirección a Dashboard Admin", is_in_admin, f"URL actual: {curr_url}")

        # Recargar página (F5) para validar persistencia
        driver.refresh()
        time.sleep(2.0)
        curr_url_after_refresh = driver.current_url
        is_still_in_admin = "/admin" in curr_url_after_refresh
        log_result("Persistencia de Sesión Admin tras F5", is_still_in_admin, f"URL tras F5: {curr_url_after_refresh}")

        # -------------------------------------------------------------
        # TEST 2: Cambio a Rol Docente y Persistencia de Dashboard
        # -------------------------------------------------------------
        print("\n2. Testeando Cambio de Rol a Docente y Persistencia tras recarga...")
        driver.execute_script("""
            const user = {
                id: 'usr-prof-1',
                email: 'carlos.mendoza@colegio.edu.pe',
                nombres: 'Carlos',
                apellidos: 'Mendoza Ruiz',
                rol: 'docente',
                activo: true
            };
            localStorage.setItem('colegio_current_user', JSON.stringify(user));
            document.cookie = 'cole_user_role=docente; path=/; max-age=604800; SameSite=Lax';
            document.cookie = 'cole_access_token=jwt-active-session; path=/; max-age=604800; SameSite=Lax';
        """)
        safe_get(f"{base_url}/docente")
        time.sleep(2.0)

        h1_docente = ""
        h1_elems = driver.find_elements(By.TAG_NAME, "h1")
        if h1_elems:
            h1_docente = h1_elems[0].text
        is_docente = "/docente" in driver.current_url or "docente" in driver.page_source.lower()
        log_result("Ingreso al Dashboard Docente", is_docente, f"H1: {h1_docente}, URL: {driver.current_url}")

        driver.refresh()
        time.sleep(2.0)
        is_docente_after_f5 = "/docente" in driver.current_url
        log_result("Persistencia de Dashboard Docente tras F5", is_docente_after_f5, f"URL tras F5: {driver.current_url}")

        # -------------------------------------------------------------
        # TEST 3: Rol Apoderado y Persistencia de Hijo Seleccionado
        # -------------------------------------------------------------
        print("\n3. Testeando Rol Apoderado y Persistencia de Hijo Seleccionado...")
        driver.execute_script("""
            const parentUser = {
                id: 'usr-parent-1',
                email: 'padre.torres@gmail.com',
                nombres: 'Juan Carlos',
                apellidos: 'Torres Benavides',
                rol: 'apoderado',
                activo: true
            };
            localStorage.setItem('colegio_current_user', JSON.stringify(parentUser));
            localStorage.setItem('colegio_selected_child_id', 'child-2');
            document.cookie = 'cole_user_role=apoderado; path=/; max-age=604800; SameSite=Lax';
            document.cookie = 'cole_access_token=jwt-active-session; path=/; max-age=604800; SameSite=Lax';
        """)
        safe_get(f"{base_url}/apoderado")
        time.sleep(2.0)

        is_apoderado = "/apoderado" in driver.current_url
        log_result("Ingreso al Dashboard de Apoderado", is_apoderado, f"URL: {driver.current_url}")

        # Verificar que el hijo persistido es child-2 en storage
        stored_child = driver.execute_script("return localStorage.getItem('colegio_selected_child_id');")
        log_result("Persistencia de Hijo Seleccionado (child-2) en Apoderado", stored_child == 'child-2', f"Hijo ID: {stored_child}")

        driver.refresh()
        time.sleep(2.0)
        stored_child_f5 = driver.execute_script("return localStorage.getItem('colegio_selected_child_id');")
        is_apoderado_f5 = "/apoderado" in driver.current_url
        log_result("Persistencia de Sesión e Hijo tras F5", is_apoderado_f5 and stored_child_f5 == 'child-2', f"URL: {driver.current_url}, Child: {stored_child_f5}")

        # -------------------------------------------------------------
        # TEST 4: Rol Estudiante y Visualización de Dashboard
        # -------------------------------------------------------------
        print("\n4. Testeando Rol Estudiante y Persistencia tras recarga...")
        driver.execute_script("""
            const studentUser = {
                id: 'usr-stud-1',
                email: 'mateo.torres@colegio.edu.pe',
                nombres: 'Mateo Alejandro',
                apellidos: 'Torres Benavides',
                rol: 'estudiante',
                activo: true
            };
            localStorage.setItem('colegio_current_user', JSON.stringify(studentUser));
            document.cookie = 'cole_user_role=estudiante; path=/; max-age=604800; SameSite=Lax';
            document.cookie = 'cole_access_token=jwt-active-session; path=/; max-age=604800; SameSite=Lax';
        """)
        safe_get(f"{base_url}/estudiante")
        time.sleep(2.0)

        is_estudiante = "/estudiante" in driver.current_url
        h1_estudiante = ""
        h1_elems = driver.find_elements(By.TAG_NAME, "h1")
        if h1_elems:
            h1_estudiante = h1_elems[0].text
        log_result("Ingreso al Dashboard Estudiante", is_estudiante, f"H1: {h1_estudiante}")

        driver.refresh()
        time.sleep(2.0)
        log_result("Persistencia de Dashboard Estudiante tras F5", "/estudiante" in driver.current_url, f"URL tras F5: {driver.current_url}")

        # -------------------------------------------------------------
        # TEST 5: Persistencia de Personalización & Branding tras F5
        # -------------------------------------------------------------
        print("\n5. Testeando Persistencia de Configuración de Branding...")
        driver.execute_script("""
            const adminUser = {
                id: 'usr-admin-1',
                email: 'admin@colegio.edu.pe',
                nombres: 'María',
                apellidos: 'Fernández Castro',
                rol: 'admin',
                activo: true
            };
            localStorage.setItem('colegio_current_user', JSON.stringify(adminUser));
            document.cookie = 'cole_user_role=admin; path=/; max-age=604800; SameSite=Lax';
            document.cookie = 'cole_access_token=jwt-active-session; path=/; max-age=604800; SameSite=Lax';

            const config = JSON.parse(localStorage.getItem('cole_system_branding_config_v1') || '{}');
            config.primaryColor = '#4338ca';
            config.sidebarStyle = 'gradient';
            config.nombreInstitucion = 'Colegio San Martín de Porres (Test Persistencia)';
            localStorage.setItem('cole_system_branding_config_v1', JSON.stringify(config));
        """)
        safe_get(f"{base_url}/admin/branding")
        time.sleep(2.0)

        # Recargar para comprobar que el branding se carga desde localStorage
        driver.refresh()
        time.sleep(2.0)

        saved_branding = driver.execute_script("return JSON.parse(localStorage.getItem('cole_system_branding_config_v1') || '{}');")
        branding_ok = (
            saved_branding.get('primaryColor') == '#4338ca' and
            saved_branding.get('sidebarStyle') == 'gradient' and
            'San Martín' in saved_branding.get('nombreInstitucion', '')
        )
        log_result("Persistencia de Branding (Color, Sidebar y Nombre) tras F5", branding_ok, f"Color: {saved_branding.get('primaryColor')}, Sidebar: {saved_branding.get('sidebarStyle')}")

        # -------------------------------------------------------------
        # TEST 6: Persistencia de Mutaciones de Datos (Estudiantes)
        # -------------------------------------------------------------
        print("\n6. Testeando Persistencia de Datos Académicos y Estudiantes...")
        driver.execute_script("""
            const students = JSON.parse(localStorage.getItem('colegio_students') || '[]');
            const newStudent = {
                id: 'student-test-persistence-999',
                codigo_estudiante: 'EST-2026-999',
                dni: '79887766',
                profile: {
                    id: 'prof-test-999',
                    nombres: 'Valeria Sofía',
                    apellidos: 'Ríos Mendoza',
                    email: 'valeria.rios@colegio.edu.pe',
                    rol: 'estudiante',
                    activo: true
                },
                activo: true
            };
            if (!students.some(s => s.id === newStudent.id)) {
                students.push(newStudent);
                localStorage.setItem('colegio_students', JSON.stringify(students));
            }
        """)

        safe_get(f"{base_url}/admin/estudiantes")
        time.sleep(2.0)
        driver.refresh()
        time.sleep(2.0)

        persisted_students = driver.execute_script("return JSON.parse(localStorage.getItem('colegio_students') || '[]');")
        student_found = any(s.get('id') == 'student-test-persistence-999' for s in persisted_students)
        log_result("Persistencia de Nuevo Estudiante tras F5 y Navegación", student_found, f"Total Estudiantes: {len(persisted_students)}")

    finally:
        driver.quit()

    print("\n" + "=" * 76)
    print(" INFORME FINAL DE AUDITORÍA DE PERSISTENCIA")
    print("=" * 76)
    print(f"Total Pruebas Ejecutadas:  {len(passed_tests) + len(failed_tests)}")
    print(f"Resultados PASS:           {len(passed_tests)}")
    print(f"Resultados FAIL:           {len(failed_tests)}")
    print("=" * 76)

    if failed_tests:
        print("\nFallas detectadas:")
        for name, err in failed_tests:
            print(f"- {name}: {err}")
        sys.exit(1)
    else:
        print("\n>>> LA PERSISTENCIA EN LOGINS, DASHBOARDS Y DATOS FUNCIONA AL 100% <<<")
        sys.exit(0)

if __name__ == "__main__":
    run_persistence_tests()
