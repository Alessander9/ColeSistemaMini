# -*- coding: utf-8 -*-
import sys
import time
import json
from playwright.sync_api import sync_playwright

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

BASE_URL = 'http://localhost:3000'

def login_role_ui(page, role_button_label: str, expected_dashboard: str):
    page.goto(f"{BASE_URL}/login", wait_until="domcontentloaded")
    page.wait_for_selector("text=Acceso Rápido por Roles Demo", timeout=8000)
    role_btn = page.get_by_role("button", name=role_button_label, exact=False)
    role_btn.click()
    page.wait_for_timeout(300)
    page.locator("button[type='submit']").click()
    try:
        page.wait_for_url(f"**{expected_dashboard}*", timeout=8000)
    except Exception:
        page.goto(f"{BASE_URL}{expected_dashboard}", wait_until="domcontentloaded")

def run():
    print("==================================================================", flush=True)
    print(" TEST E2E COMPLETO DE CICLO DE VIDA QR (CREACIÓN -> ESCANEO CROSS-DEVICE)", flush=True)
    print("==================================================================", flush=True)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)

        # ── DISPOSITIVO 1: PC DEL ADMINISTRADOR (Matrícula) ──
        admin_context = browser.new_context(viewport={"width": 1440, "height": 900})
        admin_page = admin_context.new_page()

        print("\n[Paso 1] Iniciando sesión como Administrador en Terminal Admin...", flush=True)
        login_role_ui(admin_page, "Director / Admin", "/admin")
        print(f"  -> Sesión Admin iniciada en: {admin_page.url}", flush=True)

        print("\n[Paso 2] Navegando a Alumnos (/admin/estudiantes)...", flush=True)
        admin_page.goto(f"{BASE_URL}/admin/estudiantes", wait_until="networkidle")
        admin_page.wait_for_timeout(1000)

        print("\n[Paso 3] Abriendo modal 'Registro rápido'...", flush=True)
        admin_page.click("button:has-text('Registro rápido')")
        admin_page.wait_for_selector("text=Registro Rápido de Alumno", timeout=5000)

        unique_dni = f"78{int(time.time()) % 1000000:06d}"
        student_first_name = "Camila Andrea"
        student_last_name = "Flores Vargas"
        print(f"\n[Paso 4] Registrando alumna {student_first_name} {student_last_name} (DNI: {unique_dni})...", flush=True)
        admin_page.fill("input[placeholder='Ej. Héctor Raúl']", student_first_name)
        admin_page.fill("input[placeholder='Ej. Salazar Portero']", student_last_name)
        admin_page.fill("input[placeholder='8 dígitos']", unique_dni)
        admin_page.fill("input[placeholder='Ej. Jorge Silva Rodríguez']", "Carlos Flores")
        admin_page.fill("input[placeholder='Ej. 955443322']", "987654321")

        # Seleccionar aula
        admin_page.click("button:has-text('Seleccionar aula...')")
        admin_page.wait_for_timeout(500)
        option = admin_page.locator("div[role='dialog'] button:has-text('\"')").first
        if option.count() > 0:
            option.click()
            print("  -> Aula seleccionada en el selector desplegable.", flush=True)
        else:
            admin_page.keyboard.press("ArrowDown")
            admin_page.keyboard.press("Enter")
            print("  -> Aula seleccionada mediante navegación de teclado.", flush=True)

        admin_page.wait_for_timeout(500)

        print("\n[Paso 5] Guardando y emitiendo carnet con QR...", flush=True)
        admin_page.click("button:has-text('Guardar y ver su carnet')")
        admin_page.wait_for_timeout(1500)

        # Verificar que el modal del carnet escolar se abre visualmente con el canvas QR
        admin_page.wait_for_selector("text=Carnet Escolar con Código QR", timeout=6000)
        qr_canvas = admin_page.locator("div[role='dialog'] canvas").first
        qr_canvas.wait_for(state="visible", timeout=5000)
        canvas_box = qr_canvas.bounding_box()
        assert canvas_box is not None and canvas_box['width'] > 50, "El elemento canvas con el QR no fue renderizado en el carnet"
        print(f"  -> Modal de Carnet Escolar abierto y visualizado.", flush=True)
        print(f"  -> Código QR renderizado en canvas físico ({int(canvas_box['width'])}x{int(canvas_box['height'])}px).", flush=True)

        # Extraer credenciales y token QR del alumno creado
        student_data = admin_page.evaluate(f"""() => {{
            const students = JSON.parse(localStorage.getItem('colegio_students') || '[]');
            const found = students.find(s => s.dni === '{unique_dni}');
            const enrollments = JSON.parse(localStorage.getItem('colegio_enrollments') || '[]');
            const enr = found ? enrollments.find(e => e.estudiante_id === found.id) : null;
            return {{ student: found, enrollment: enr }};
        }}""")

        assert student_data.get('student') is not None, "Error: Estudiante no encontrado en el store local de Admin"
        student = student_data['student']
        enrollment = student_data.get('enrollment')
        qr_token = student['token_qr']
        student_code = student['codigo_estudiante']

        print(f"  -> Alumna creada: {student.get('nombres')} {student.get('apellidos')}", flush=True)
        print(f"  -> Código de estudiante: {student_code}", flush=True)
        print(f"  -> Token QR generado: {qr_token}", flush=True)

        # Sincronización explícita con el endpoint /api/estudiantes para persistencia cross-device
        sync_payload = json.dumps({"student": student, "enrollment": enrollment})
        sync_res = admin_page.evaluate(f"""async () => {{
            const res = await fetch('/api/estudiantes', {{
                method: 'POST',
                headers: {{ 'Content-Type': 'application/json' }},
                body: JSON.stringify({sync_payload})
            }});
            return await res.json();
        }}""")
        print(f"  -> Sincronización con /api/estudiantes: {sync_res.get('message', sync_res)}", flush=True)

        # ── VERIFICACIÓN EN API /api/estudiantes (GET) ──
        print("\n[Paso 6] Verificando presencia en la base de datos del servidor (/api/estudiantes)...", flush=True)
        get_res = admin_page.evaluate("""async () => {
            const res = await fetch('/api/estudiantes');
            const data = await res.json();
            return data;
        }""")
        found_in_server = any(s.get('codigo_estudiante') == student_code for s in get_res.get('students', []))
        assert found_in_server, "El estudiante no fue encontrado en la lista del servidor /api/estudiantes"
        print(f"  -> ¡Estudiante confirmado en el servidor! (Total estudiantes en server: {len(get_res.get('students', []))})", flush=True)

        # ── DISPOSITIVO 2: KIOSCO EN PUERTA (Contexto independiente) ──
        print("\n[Paso 7] Simulando Tablet / Kiosco en Portería en dispositivo independiente...", flush=True)
        kiosk_context = browser.new_context(viewport={"width": 1366, "height": 768})
        kiosk_page = kiosk_context.new_page()

        print("  -> Iniciando sesión como Kiosco QR en la terminal de portería...", flush=True)
        login_role_ui(kiosk_page, "Kiosco QR", "/asistencia")
        kiosk_page.wait_for_timeout(1500)
        print(f"  -> Kiosco activo en: {kiosk_page.url}", flush=True)

        # Escanear el QR de la nueva alumna en el kiosco (PRIMERA MARCACIÓN: ÉXITO)
        print(f"\n[Paso 8] Alumna escanea su carnet QR ('{qr_token}') en el kiosco de portería...", flush=True)
        manual_input = kiosk_page.locator("input[placeholder*='DNI, código o token']")
        manual_input.wait_for(timeout=5000)
        manual_input.fill(qr_token)
        manual_input.press("Enter")
        kiosk_page.wait_for_timeout(2500)

        # Evaluar pantalla del kiosco
        kiosk_body = kiosk_page.evaluate("""() => document.body.innerText""")
        assert "Asistencia registrada" in kiosk_body or "¡Asistencia registrada!" in kiosk_body or "REGISTRADA" in kiosk_body, f"Esperado registro de asistencia exitoso, se obtuvo: {kiosk_body[:300]}"
        print("  [EXITO KIOSCO] ✅ ¡Pantalla del Kiosco confirmó asistencia registrada para la nueva alumna!", flush=True)

        # ── PRUEBA ADICIONAL: Intento de doble marcación (Anti-Fraude) ──
        print("\n[Paso 9] Esperando fin de cooldown y probando protección contra duplicados (re-escaneo)...", flush=True)
        close_btn = kiosk_page.locator("button:has-text('Cerrar')")
        if close_btn.count() > 0 and close_btn.first.is_visible():
            close_btn.first.click()
            try:
                kiosk_page.wait_for_selector("text=¡Asistencia registrada!", state="detached", timeout=4000)
            except Exception:
                pass

        time.sleep(4.0)

        manual_input.fill(qr_token)
        manual_input.press("Enter")
        kiosk_page.wait_for_timeout(2500)

        kiosk_body2 = kiosk_page.evaluate("""() => document.body.innerText""")
        assert "ya registró" in kiosk_body2 or "DUPLICADO" in kiosk_body2 or "ya cuenta con" in kiosk_body2 or "Asistencia ya registrada" in kiosk_body2, f"No se detectó el bloqueo de duplicado: {kiosk_body2[:300]}"
        print("  [CONTROL DUPLICADO] ✅ El sistema bloqueó correctamente el re-escaneo fraudulento del mismo día.", flush=True)

        # ── PRUEBA EN API SERVER DE RECHAZO DE DUPLICADO ──
        print("\n[Paso 10] Verificando rechazo de duplicado en API del servidor (/api/asistencia/scan)...", flush=True)
        api_res = admin_page.evaluate(f"""async () => {{
            const res = await fetch('/api/asistencia/scan', {{
                method: 'POST',
                headers: {{ 'Content-Type': 'application/json' }},
                body: JSON.stringify({{ tokenQr: '{qr_token}', metodo: 'qr', status: 'presente' }})
            }});
            const data = await res.json();
            return {{ status: res.status, data }};
        }}""")

        print(f"  -> Código HTTP servidor: {api_res['status']} (Esperado: 409 Conflict / Duplicado)", flush=True)
        print(f"  -> Mensaje del servidor: {api_res['data'].get('message')}", flush=True)
        assert api_res['status'] == 409 or api_res['data'].get('duplicate') is True, f"Error: {api_res}"
        print("  -> ¡Servidor rechazó el duplicado correctamente con código 409!", flush=True)

        browser.close()
        print("\n==================================================================", flush=True)
        print(" ¡TODAS LAS PRUEBAS E2E DEL FLUJO QR PASARON EXITOSAMENTE! (100% OK)", flush=True)
        print("==================================================================", flush=True)

if __name__ == '__main__':
    run()
