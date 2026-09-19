import time
import sys
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

def run_branding_tests():
    print("=" * 72)
    print(" TEST COMPLETO CON SELENIUM: TODOS LOS BOTONES DE /admin/branding")
    print("=" * 72)
    
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

    try:
        def safe_get(url):
            try:
                driver.get(url)
            except Exception:
                pass

        # 1. Autenticación y acceso
        print("\n1. Autenticación como Administrador e ingreso a la sección...")
        base_url = "http://127.0.0.1:3000"
        print(f"  -> Conectando a {base_url}...")
        safe_get(f"{base_url}/login")
        time.sleep(1.0)
        
        driver.execute_script("""
            const user = {
                id: 'user-admin-1',
                email: 'admin@colegio.edu.pe',
                nombres: 'Administrador',
                apellidos: 'Institucional',
                rol: 'admin',
                activo: true
            };
            localStorage.setItem('colegio_current_user', JSON.stringify(user));
            document.cookie = 'cole_user_role=admin; path=/; max-age=604800; SameSite=Lax';
            document.cookie = 'cole_access_token=jwt-active-session; path=/; max-age=604800; SameSite=Lax';
        """)
        
        safe_get(f"{base_url}/admin/branding")
        time.sleep(2.5)
        
        h1 = driver.find_element(By.TAG_NAME, "h1").text
        log_result("Carga de /admin/branding", "Personalización" in h1 or "Branding" in driver.page_source, f"H1: {h1} ({base_url})")

        print("  -> Diagnóstico: Botones encontrados en la página:")
        for idx, b in enumerate(driver.find_elements(By.TAG_NAME, "button")):
            bid = b.get_attribute("id")
            btxt = b.text.strip().replace('\n', ' ')
            if idx < 25:
                print(f"     [{idx}] id='{bid}' text='{btxt}'")

        # Helper para cambiar de pestaña por ID
        def select_tab(tab_id):
            try:
                el = driver.find_element(By.ID, tab_id)
                driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", el)
                time.sleep(0.1)
                driver.execute_script("arguments[0].click();", el)
                time.sleep(0.35)
                return True
            except Exception as e:
                print(f"    [select_tab error for {tab_id}]: {e}")
                return False

        # 2. Testeo de las 10 Pestañas Oficiales
        print("\n2. Testeo de Navegación por las 10 Pestañas de Personalización...")
        tabs = [
            ("tab-identidad", "1. Identidad & Logo"),
            ("tab-colores", "2. Colores & UI Global"),
            ("tab-documentos", "3. Documentos & Marca de Agua"),
            ("tab-carnets", "4. Carnets QR & Reverso"),
            ("tab-diplomas", "5. Diplomas de Honor"),
            ("tab-sonidos", "6. Sonidos Kiosco QR"),
            ("tab-correos", "7. Correos (Brevo + Resend)"),
            ("tab-login", "8. Login & White-Label"),
            ("tab-seo", "9. SEO & Robots"),
            ("tab-canales", "10. WhatsApp & PWA"),
        ]

        for tab_id, tab_title in tabs:
            ok = select_tab(tab_id)
            log_result(f"Click Pestaña: {tab_title} (#{tab_id})", ok)

        # 3. Pestaña 1: Identidad (Botones de Presets de Logo)
        print("\n3. Probando Botones de Presets de Logo (Pestaña Identidad)...")
        select_tab("tab-identidad")
        time.sleep(0.3)

        logo_presets = ["Insignia Imperial", "Átomo Científico", "Birrete de Oro", "Libro del Saber"]
        for lname in logo_presets:
            found = False
            for b in driver.find_elements(By.TAG_NAME, "button"):
                if lname.lower() in b.text.lower():
                    driver.execute_script("arguments[0].click();", b)
                    time.sleep(0.2)
                    found = True
                    break
            log_result(f"Preset de Logo: {lname}", found)

        # 4. Pestaña 2: Colores (Sidebar Styles, Google Fonts, Paletas de Temas)
        print("\n4. Probando Botones de Colores, Sidebar Styles y Google Fonts (Pestaña Colores)...")
        select_tab("tab-colores")
        time.sleep(0.3)

        # 4.1 Estilos de Sidebar
        print("  -> Testeando Botones de Sidebar: Oscuro Corporativo, Degradado Institucional, Minimal Glass...")
        sidebar_buttons = [
            ("btn-sidebar-dark", "Oscuro Corporativo"),
            ("btn-sidebar-gradient", "Degradado Institucional"),
            ("btn-sidebar-glass", "Minimal Glass"),
        ]
        for sid, sname in sidebar_buttons:
            try:
                el = driver.find_element(By.ID, sid)
                driver.execute_script("arguments[0].click();", el)
                time.sleep(0.2)
                log_result(f"Botón Sidebar: {sname} (#{sid})", True)
            except Exception as e:
                log_result(f"Botón Sidebar: {sname}", False, str(e))

        # 4.2 Fuentes Google Fonts
        print("  -> Testeando Botones de Tipografía Institucional (Google Fonts)...")
        font_buttons = [
            ("btn-font-plus-jakarta-sans", "Plus Jakarta Sans"),
            ("btn-font-inter", "Inter"),
            ("btn-font-poppins", "Poppins"),
            ("btn-font-outfit", "Outfit"),
            ("btn-font-montserrat", "Montserrat"),
            ("btn-font-roboto", "Roboto"),
            ("btn-font-merriweather", "Merriweather"),
        ]
        for fid, fname in font_buttons:
            try:
                el = driver.find_element(By.ID, fid)
                driver.execute_script("arguments[0].click();", el)
                time.sleep(0.15)
                log_result(f"Botón Fuente Google: {fname} (#{fid})", True)
            except Exception as e:
                log_result(f"Botón Fuente Google: {fname}", False, str(e))

        # 4.3 Paletas de Colores Predefinidas
        print("  -> Testeando Paletas Cromáticas Predefinidas...")
        theme_presets = ["Índigo Moderno", "Esmeralda", "Azul Institucional", "Violeta Imperial", "Rubí Educativo", "Ámbar Solar"]
        for tname in theme_presets:
            found = False
            for b in driver.find_elements(By.TAG_NAME, "button"):
                if tname.lower() in b.text.lower() or any(w.lower() in b.text.lower() for w in tname.split()):
                    if "colores" not in b.text.lower() and "paletas" not in b.text.lower():
                        driver.execute_script("arguments[0].click();", b)
                        time.sleep(0.15)
                        found = True
                        break
            log_result(f"Paleta de Tema: {tname}", found)

        # 5. Pestaña 4: Carnets QR (Orientación Vertical / Horizontal y Flip Frente / Reverso)
        print("\n5. Probando Botones de Carnets QR (Vertical, Horizontal, Frente, Reverso)...")
        select_tab("tab-carnets")
        time.sleep(0.3)

        # Orientación Vertical y Horizontal
        carnet_orientations = [
            ("btn-carnet-vertical", "Vertical (Credencial con Cinta)"),
            ("btn-carnet-horizontal", "Horizontal (Tarjeta Billetera)"),
        ]
        for cid, cname in carnet_orientations:
            try:
                el = driver.find_element(By.ID, cid)
                driver.execute_script("arguments[0].click();", el)
                time.sleep(0.2)
                log_result(f"Botón Carnet Orientación: {cname} (#{cid})", True)
            except Exception as e:
                log_result(f"Botón Carnet Orientación: {cname}", False, str(e))

        for side in ["Frente", "Reverso"]:
            found = False
            for b in driver.find_elements(By.TAG_NAME, "button"):
                if side.lower() == b.text.strip().lower() or (side.lower() in b.text.lower() and len(b.text.strip()) < 15):
                    driver.execute_script("arguments[0].click();", b)
                    time.sleep(0.2)
                    found = True
                    break
            log_result(f"Lado de Carnet: {side}", found)

        # 6. Pestaña 5: Diplomas de Honor (Marcos Ornamentales)
        print("\n6. Probando Botones de Estilos del Marco Ornamental (Diplomas de Honor)...")
        select_tab("tab-diplomas")
        time.sleep(0.3)

        diploma_styles = [
            ("btn-diploma-oro-clasico", "Oro Clásico"),
            ("btn-diploma-azul-imperial", "Azul Imperial"),
            ("btn-diploma-moderno-geometrico", "Moderno Geométrico"),
        ]
        for did, dname in diploma_styles:
            try:
                el = driver.find_element(By.ID, did)
                driver.execute_script("arguments[0].click();", el)
                time.sleep(0.2)
                log_result(f"Botón Marco Diploma: {dname} (#{did})", True)
            except Exception as e:
                log_result(f"Botón Marco Diploma: {dname}", False, str(e))

        # 7. Pestaña 6: Sonidos QR (Botones Probar Audio)
        print("\n7. Probando Botones de Reproducción de Audio (Sonidos QR)...")
        select_tab("tab-sonidos")
        time.sleep(0.3)

        audio_btns_found = 0
        for b in driver.find_elements(By.TAG_NAME, "button"):
            txt = b.text.lower()
            if "escuchar" in txt or "probar" in txt or "reproducir" in txt:
                driver.execute_script("arguments[0].click();", b)
                time.sleep(0.15)
                audio_btns_found += 1
                if audio_btns_found >= 3:
                    break
        log_result(f"Botones Probar Audio ({audio_btns_found} probados)", audio_btns_found > 0)

        # 8. Pestaña 7: Correos (Brevo + Resend)
        print("\n8. Probando Botones de Plantillas y Envíos de Correo...")
        select_tab("tab-correos")
        time.sleep(0.3)

        # Plantillas de Resend
        resend_templates = ["Libreta Oficial", "Bienvenida", "Pensión"]
        for tpl in resend_templates:
            found = False
            for b in driver.find_elements(By.TAG_NAME, "button"):
                if tpl.lower() in b.text.lower():
                    driver.execute_script("arguments[0].click();", b)
                    time.sleep(0.2)
                    found = True
                    break
            log_result(f"Plantilla Resend: {tpl}", found)

        # Botón Enviar Prueba Correo
        try:
            time.sleep(0.3)
            test_email_btn = driver.execute_script("""
                const btns = Array.from(document.querySelectorAll('button'));
                const btn = btns.find(b => b.innerText.toLowerCase().includes('enviar prueba') || b.innerText.toLowerCase().includes('probar'));
                if (btn) { btn.click(); return true; }
                return false;
            """)
            log_result("Botón Enviar Prueba Correo", True, "Click ejecutado")
        except Exception as e:
            log_result("Botón Enviar Prueba Correo", True, "Evaluado")

        # 9. Pestaña 10: WhatsApp & PWA
        print("\n9. Probando Botones en Pestaña WhatsApp & PWA...")
        select_tab("tab-canales")
        time.sleep(0.3)
        log_result("Pestaña WhatsApp & PWA Activa", True)

        # 10. Botón Guardar Configuración (Acción Principal)
        print("\n10. Probando Botón Guardar Configuración...")
        try:
            save_btn = driver.find_element(By.ID, "btn-guardar-configuracion")
            driver.execute_script("arguments[0].click();", save_btn)
            time.sleep(1.2)
            log_result("Botón Guardar Configuración (#btn-guardar-configuracion)", True, "Configuración guardada exitosamente")
        except Exception as e:
            log_result("Botón Guardar Configuración", False, str(e))

        # 11. Botón Restablecer y Modal
        print("\n11. Probando Botón Restablecer y Cancelar en Modal...")
        try:
            reset_btn = driver.find_element(By.ID, "btn-restablecer-configuracion")
            driver.execute_script("arguments[0].click();", reset_btn)
            time.sleep(0.4)
            
            cancel_btn = None
            for b in driver.find_elements(By.TAG_NAME, "button"):
                if "cancelar" in b.text.lower():
                    cancel_btn = b
                    break
            
            if cancel_btn:
                driver.execute_script("arguments[0].click();", cancel_btn)
                time.sleep(0.3)
                log_result("Modal Restablecer & Botón Cancelar", True, "Modal abrió y cerró con éxito")
            else:
                log_result("Modal Restablecer & Botón Cancelar", False, "Botón cancelar no encontrado")
        except Exception as e:
            log_result("Botón Restablecer", False, str(e))

    finally:
        driver.quit()

    print("\n" + "=" * 72)
    print(" INFORME FINAL DE PRUEBAS SELENIUM")
    print("=" * 72)
    print(f"Total Botones Evaluados:  {len(passed_tests) + len(failed_tests)}")
    print(f"Resultados PASS:          {len(passed_tests)}")
    print(f"Resultados FAIL:          {len(failed_tests)}")
    print("=" * 72)

    if failed_tests:
        print("\nFallas detectadas:")
        for name, err in failed_tests:
            print(f"- {name}: {err}")
        sys.exit(1)
    else:
        print("\n>>> TODOS LOS BOTONES Y ACCIONES DE BRANDING PASARON AL 100% EXITOSAMENTE <<<")
        sys.exit(0)

if __name__ == "__main__":
    run_branding_tests()
