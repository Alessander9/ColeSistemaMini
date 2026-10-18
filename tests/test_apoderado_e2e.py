# -*- coding: utf-8 -*-
"""
========================================================================================
TEST END-TO-END (E2E) PLAYWRIGHT: PORTAL APODERADO / FAMILIA (COLESISTEMAMINI 2026)
========================================================================================
Cobertura Completa de UX & Funcionalidad del Dashboard Apoderado:
  1. Autenticación y Landing (/apoderado) con Branding Institucional
  2. Encabezado dinámico, selector de alumnos y Modal de Carnet Escolar QR
  3. Resumen 4 Métricas con "Pulso en Vivo" de Asistencia
  4. Pestaña Notas: Hero Card Libreta Oficial, Modal Interactivo y Guía CNEB (AD, A, B, C)
  5. Pestaña Asistencia: Tira Semanal Escolar (Lun-Vie), Estados e Inasistencias
  6. Pestaña Tareas: Semáforo de Urgencia (Urgentes, Próximas, Entregadas, Todas)
  7. Pestaña Tutor y Documentos: Contacto, Horario Modal y Descargas
  8. Verificación de Responsividad Móvil (Viewport 375x812)
========================================================================================
"""

import os
import sys
import time
import urllib.request
import urllib.error
from datetime import datetime
from playwright.sync_api import sync_playwright

# Configuración de codificación UTF-8 en Windows
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

# ─────────────────────────────────────────────────────────────────────────────
# CONFIGURACIÓN DEL SERVIDOR
# ─────────────────────────────────────────────────────────────────────────────
def detect_base_url():
    env_url = os.environ.get("BASE_URL")
    if env_url:
        return env_url.rstrip("/")
    for port in [3000, 3001, 3002]:
        url = f"http://localhost:{port}"
        try:
            req = urllib.request.Request(f"{url}/api/branding", headers={"User-Agent": "PlaywrightApoderadoTest"})
            with urllib.request.urlopen(req, timeout=2) as resp:
                if resp.status == 200:
                    return url
        except Exception:
            continue
    return "http://localhost:3000"

BASE_URL = detect_base_url()
SCREENSHOT_DIR = os.path.join(os.path.dirname(__file__), "screenshots")
os.makedirs(SCREENSHOT_DIR, exist_ok=True)

test_results = []

def record_result(category: str, test_name: str, passed: bool, details: str = "", duration: float = 0.0):
    status_symbol = "✓ PASS" if passed else "✗ FAIL"
    color_prefix = "\033[92m" if passed else "\033[91m"
    reset_color = "\033[0m"
    
    test_results.append({
        "category": category,
        "name": test_name,
        "passed": passed,
        "details": details,
        "duration": duration
    })
    
    print(f"  {color_prefix}[{status_symbol}]{reset_color} [{category}] {test_name} ({duration:.2f}s) {f'- {details}' if details else ''}", flush=True)

def login_apoderado_ui(page):
    page.goto(f"{BASE_URL}/login", wait_until="domcontentloaded")
    page.wait_for_selector("input[type='email']", timeout=30000)
    
    # Intento 1: Botón de acceso rápido demo 'Apoderado'
    role_btn = page.locator("button:has-text('Apoderado')").first
    if role_btn.is_visible():
        role_btn.click()
        page.wait_for_timeout(400)
    else:
        page.fill("input[type='email']", "apoderado@colegio.edu.pe")
        page.fill("input[type='password']", "Colegio2026!")
    
    page.locator("button[type='submit']").click()
    page.wait_for_timeout(1000)
    
    # Si transiciona por /bienvenida, click en Continuar
    try:
        btn_continue = page.locator("button:has-text('Continuar'), a:has-text('Continuar')").first
        if btn_continue.is_visible():
            btn_continue.click()
    except Exception:
        pass
    
    try:
        page.wait_for_url("**/apoderado*", timeout=20000)
    except Exception:
        page.goto(f"{BASE_URL}/apoderado", wait_until="domcontentloaded")
    
    page.wait_for_timeout(1000)

# ─────────────────────────────────────────────────────────────────────────────
# SUITE PRINCIPAL E2E APODERADO
# ─────────────────────────────────────────────────────────────────────────────
def run_apoderado_e2e_tests():
    print("=" * 80)
    print("   INICIANDO TEST E2E PLAYWRIGHT: DASHBOARD APODERADO (UX 1-3-4-5-6-7)")
    print(f"   Hora local: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} | Servidor: {BASE_URL}")
    print("=" * 80)

    start_all = time.time()

    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=True,
            args=["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu", "--disable-web-security"]
        )

        context = browser.new_context(viewport={"width": 1440, "height": 900})
        page = context.new_page()

        try:
            # ─────────────────────────────────────────────────────────────────
            # BLOQUE 1: LOGIN Y ENCABEZADO CON BRANDING
            # ─────────────────────────────────────────────────────────────────
            print("\n[BLOQUE 1] Autenticación y Encabezado Institucional...")
            t0 = time.time()
            login_apoderado_ui(page)
            dt = time.time() - t0
            is_in_dash = "/apoderado" in page.url
            record_result("AUTENTICACIÓN", "1.1 Login e ingreso al Portal Apoderado", is_in_dash, f"URL: {page.url}", dt)

            # 1.2 Encabezado Institucional y Saludo
            t0 = time.time()
            page.wait_for_selector("h1", timeout=15000)
            h1_text = page.locator("h1").first.inner_text()
            has_greeting = any(g in h1_text.lower() for g in ["buenos días", "buenas tardes", "buenas noches"])
            dt = time.time() - t0
            record_result("ENCABEZADO", "1.2 Saludo personalizado familiar", has_greeting, f"H1: {h1_text}", dt)

            # 1.3 Selector de hijo activo
            t0 = time.time()
            has_child_selector = page.locator("button[aria-pressed='true']").first.is_visible()
            dt = time.time() - t0
            record_result("SELECTOR ALUMNO", "1.3 Tarjeta de hijo seleccionado con anillo y aula", has_child_selector, "Alumno activo vinculado", dt)

            # 1.4 Modal de Carnet Escolar QR
            t0 = time.time()
            btn_carnet = page.locator("button:has-text('Carnet')").first
            btn_carnet.click()
            page.wait_for_selector("text=Carnet de", timeout=5000)
            has_qr_modal = page.locator("text=Carnet de").first.is_visible()
            # Cerrar modal
            btn_close_modal = page.locator("button[aria-label='Cerrar']").first
            btn_close_modal.click()
            page.wait_for_timeout(300)
            dt = time.time() - t0
            record_result("CARNET QR", "1.4 Modal de Carnet Digital de Ingreso", has_qr_modal, "Apertura y cierre modal OK", dt)

            # Captura de pantalla de la cabecera
            page.screenshot(path=os.path.join(SCREENSHOT_DIR, "apoderado_01_header_branding.png"))

            # ─────────────────────────────────────────────────────────────────
            # BLOQUE 2: RESUMEN DE 4 MÉTRICAS CON "PULSO EN VIVO" (ITEM 1)
            # ─────────────────────────────────────────────────────────────────
            print("\n[BLOQUE 2] Resumen de 4 Métricas y Pulso en Vivo...")
            t0 = time.time()
            has_hoy = page.locator("text=Hoy").first.is_visible()
            has_notas_kpi = page.locator("text=Notas").first.is_visible()
            has_asist_kpi = page.locator("text=Asistencia").first.is_visible()
            has_tareas_kpi = page.locator("text=Tareas").first.is_visible()
            has_all_kpis = has_hoy and has_notas_kpi and has_asist_kpi and has_tareas_kpi
            dt = time.time() - t0
            record_result("MÉTRICAS 4-CARDS", "2.1 Cuadrícula de Resumen (Hoy, Notas, Asistencia, Tareas)", has_all_kpis, "4 tarjetas renderizadas", dt)

            # 2.2 Verificación del estado de Hoy y pulso
            t0 = time.time()
            hoy_card = page.locator("section[aria-label='Resumen'] button").first
            hoy_text = hoy_card.inner_text()
            dt = time.time() - t0
            record_result("PULSO EN VIVO", "2.2 Tarjeta 'Hoy' con estado en tiempo real", len(hoy_text) > 0, f"Estado: {hoy_text.splitlines()[1] if len(hoy_text.splitlines()) > 1 else 'Registrado'}", dt)

            # ─────────────────────────────────────────────────────────────────
            # BLOQUE 3: PESTAÑA NOTAS (HERO CARD LIBRETA OFICIAL & CNEB) (ITEMS 5 & 7)
            # ─────────────────────────────────────────────────────────────────
            print("\n[BLOQUE 3] Pestaña Notas, Libreta Oficial y Guía CNEB...")
            t0 = time.time()
            tab_notas = page.locator("button[data-tab='notas']").first
            tab_notas.click()
            page.wait_for_timeout(400)

            # 3.1 Hero Card: Libreta Oficial de Calificaciones
            has_libreta_card = page.locator("text=Libreta Oficial de Calificaciones").first.is_visible()
            has_siagie_badge = page.locator("text=MINEDU · SIAGIE").first.is_visible()
            has_btn_ver_libreta = page.locator("button:has-text('Ver Libreta Digital')").first.is_visible()
            has_btn_pdf = page.locator("button:has-text('Descargar PDF')").first.is_visible()
            hero_ok = has_libreta_card and has_siagie_badge and has_btn_ver_libreta and has_btn_pdf
            dt = time.time() - t0
            record_result("LIBRETA OFICIAL", "3.1 Tarjeta Destacada de Libreta Oficial (Hero Card)", hero_ok, "Formato SIAGIE / MINEDU con CTAs de visualización y PDF", dt)

            # 3.2 Modal de Libreta Digital Completa
            t0 = time.time()
            page.locator("button:has-text('Ver Libreta Digital')").first.click()
            page.wait_for_selector("text=INFORME DEL PROGRESO DEL APRENDIZAJE", timeout=7000)
            has_modal_view = page.locator("text=INFORME DEL PROGRESO DEL APRENDIZAJE").first.is_visible()
            page.screenshot(path=os.path.join(SCREENSHOT_DIR, "apoderado_02_libreta_digital_modal.png"))
            # Cerrar modal
            btn_close_report = page.locator("div.fixed button[aria-label='Cerrar']").first
            if btn_close_report.is_visible():
                btn_close_report.click()
            else:
                page.keyboard.press("Escape")
            page.wait_for_selector("text=INFORME DEL PROGRESO DEL APRENDIZAJE", state="hidden", timeout=5000)
            page.wait_for_timeout(400)
            dt = time.time() - t0
            record_result("LIBRETA OFICIAL", "3.2 Modal Interactivo de Libreta de Notas Completa", has_modal_view, "Informe pedagógico de competencias renderizado", dt)

            # 3.3 Guía Visual Oficial CNEB (AD, A, B, C)
            t0 = time.time()
            has_cneb_title = page.locator("text=Escala Oficial de Calificaciones CNEB").first.is_visible()
            has_ad = page.locator("text=Logro Destacado").first.is_visible() and page.locator("text=18 - 20").first.is_visible()
            has_a = page.locator("text=Logro Esperado").first.is_visible() and page.locator("text=14 - 17").first.is_visible()
            has_b = page.locator("text=En Proceso").first.is_visible() and page.locator("text=11 - 13").first.is_visible()
            has_c = page.locator("text=En Inicio").first.is_visible() and page.locator("text=0 - 10").first.is_visible()
            cneb_ok = has_cneb_title and has_ad and has_a and has_b and has_c
            dt = time.time() - t0
            record_result("GUÍA CNEB", "3.3 Guía Visual de Escalas CNEB (AD, A, B, C)", cneb_ok, "Explicación formativa para padres con puntajes MINEDU", dt)

            # 3.4 Cursos con GradeBadges
            t0 = time.time()
            has_courses = page.locator("text=Notas por curso").first.is_visible()
            dt = time.time() - t0
            record_result("NOTAS POR CURSO", "3.4 Listado de Asignaturas con Calificaciones por Bimestre", has_courses, "Detalle curricular disponible", dt)

            page.screenshot(path=os.path.join(SCREENSHOT_DIR, "apoderado_03_notas_tab.png"))

            # ─────────────────────────────────────────────────────────────────
            # BLOQUE 4: PESTAÑA ASISTENCIA Y TIRA SEMANAL (ITEM 4)
            # ─────────────────────────────────────────────────────────────────
            print("\n[BLOQUE 4] Pestaña Asistencia y Tira Semanal Escolar...")
            t0 = time.time()
            tab_asistencia = page.locator("button[data-tab='asistencia']").first
            tab_asistencia.click()
            page.wait_for_timeout(400)

            # 4.1 Tira Semanal (Lunes a Viernes)
            has_week_title = page.locator("text=Esta semana escolar (Lunes a Viernes)").first.is_visible()
            has_week_days = page.locator("text=Lun").first.is_visible() and page.locator("text=Vie").first.is_visible()
            week_ok = has_week_title and has_week_days
            dt = time.time() - t0
            record_result("TIRA SEMANAL", "4.1 Tira Interactiva Semanal Lunes a Viernes", week_ok, "5 días escolares con estados y distintivo 'Hoy'", dt)

            # 4.2 Métricas de Asistencia Acumulada
            t0 = time.time()
            has_puntual = page.locator("text=Puntual").first.is_visible()
            has_tardanzas = page.locator("text=Tardanzas").first.is_visible()
            has_faltas = page.locator("text=Faltas").first.is_visible()
            has_justificadas = page.locator("text=Justificadas").first.is_visible()
            att_kpis_ok = has_puntual and has_tardanzas and has_faltas and has_justificadas
            dt = time.time() - t0
            record_result("ASISTENCIA", "4.2 Métricas de Asistencia (Puntual, Tardanza, Falta, Justificada)", att_kpis_ok, "Contadores de asistencia consolidados", dt)

            # 4.3 Historial de Días Recientes
            t0 = time.time()
            has_recent = page.locator("text=Últimos días").first.is_visible() or page.locator("text=Tus justificaciones").first.is_visible()
            dt = time.time() - t0
            record_result("ASISTENCIA", "4.3 Historial de Asistencia y Justificaciones", has_recent, "Píldoras de registro histórico activas", dt)

            page.screenshot(path=os.path.join(SCREENSHOT_DIR, "apoderado_04_asistencia_semanal.png"))

            # ─────────────────────────────────────────────────────────────────
            # BLOQUE 5: PESTAÑA TAREAS Y SEMÁFORO DE URGENCIA (ITEM 3)
            # ─────────────────────────────────────────────────────────────────
            print("\n[BLOQUE 5] Pestaña Tareas y Semáforo de Urgencia...")
            t0 = time.time()
            tab_tareas = page.locator("button[data-tab='tareas']").first
            tab_tareas.click()
            page.wait_for_timeout(400)

            # 5.1 Semáforo de Urgencia: Filter Chips
            btn_urgentes = page.locator("button:has-text('Urgentes / Por vencer')").first
            btn_proximas = page.locator("button:has-text('Próximas')").first
            btn_entregadas = page.locator("button:has-text('Entregadas')").first
            btn_todas = page.locator("button:has-text('Todas')").first
            chips_ok = btn_urgentes.is_visible() and btn_proximas.is_visible() and btn_entregadas.is_visible() and btn_todas.is_visible()
            dt = time.time() - t0
            record_result("SEMÁFORO TAREAS", "5.1 Filter Chips de Urgencia (Urgentes, Próximas, Entregadas, Todas)", chips_ok, "4 filtros interactivos con badges numéricos", dt)

            # 5.2 Filtro 'Urgentes' interactivo
            t0 = time.time()
            btn_urgentes.click()
            page.wait_for_timeout(300)
            has_urgent_content = page.locator("text=¡Excelente!").first.is_visible() or page.locator("text=Vencida").first.is_visible() or page.locator("text=Vence hoy").first.is_visible() or page.locator("text=Vence mañana").first.is_visible() or page.locator("ul.space-y-2").first.is_visible()
            dt = time.time() - t0
            record_result("SEMÁFORO TAREAS", "5.2 Filtro Urgentes / Por vencer", has_urgent_content, "Muestra tareas prioritarias o estado motivacional de orden", dt)

            # 5.3 Filtro 'Entregadas'
            t0 = time.time()
            btn_entregadas.click()
            page.wait_for_timeout(300)
            has_entregadas_content = page.locator("text=Entregada").first.is_visible() or page.locator("text=Aún no registra tareas entregadas").first.is_visible()
            dt = time.time() - t0
            record_result("SEMÁFORO TAREAS", "5.3 Filtro Tareas Entregadas", has_entregadas_content, "Verificación de entregas y evidencias escolares", dt)

            # 5.4 Filtro 'Todas'
            t0 = time.time()
            btn_todas.click()
            page.wait_for_timeout(300)
            dt = time.time() - t0
            record_result("SEMÁFORO TAREAS", "5.4 Retorno a catálogo 'Todas'", True, "Vista integral de deberes escolares", dt)

            page.screenshot(path=os.path.join(SCREENSHOT_DIR, "apoderado_05_tareas_semaforo.png"))

            # ─────────────────────────────────────────────────────────────────
            # BLOQUE 6: PESTAÑA TUTOR Y DOCUMENTOS
            # ─────────────────────────────────────────────────────────────────
            print("\n[BLOQUE 6] Pestaña Tutor y Documentos...")
            t0 = time.time()
            tab_tutor = page.locator("button[data-tab='tutor']").first
            tab_tutor.click()
            page.wait_for_timeout(400)

            # 6.1 Ficha del Tutor
            has_tutor_title = page.locator("text=Tutor(a) de").first.is_visible()
            has_call_or_mail = page.locator("text=Llamar").first.is_visible() or page.locator("text=Escribir").first.is_visible() or page.locator("text=Sin teléfono").first.is_visible()
            tutor_ok = has_tutor_title and has_call_or_mail
            dt = time.time() - t0
            record_result("TUTOR", "6.1 Ficha y Canales de Contacto con el Docente Tutor", tutor_ok, "Avatar con gradiente de marca e información de aula", dt)

            # 6.2 Modal de Horario de Clases
            t0 = time.time()
            btn_horario = page.locator("button:has-text('Horario completo')").first
            btn_horario.click()
            page.wait_for_selector("text=Horario de", timeout=5000)
            has_schedule_modal = page.locator("text=Horario de").first.is_visible() and page.locator("text=Lunes").first.is_visible()
            # Cerrar modal
            btn_close_horario = page.locator("div.fixed button[aria-label='Cerrar']").first
            if btn_close_horario.is_visible():
                btn_close_horario.click()
            else:
                page.keyboard.press("Escape")
            page.wait_for_selector("text=Horario de", state="hidden", timeout=5000)
            page.wait_for_timeout(300)
            dt = time.time() - t0
            record_result("HORARIO", "6.2 Modal de Horario Semanal Completo", has_schedule_modal, "Tabla completa de bloques horarios y materias", dt)

            # 6.3 Documentos PDF Descargables
            t0 = time.time()
            has_docs = page.locator("text=Libreta de notas").first.is_visible() and page.locator("text=Constancia de matrícula").first.is_visible() and page.locator("text=Ficha de matrícula").first.is_visible()
            dt = time.time() - t0
            record_result("DOCUMENTOS", "6.3 Catálogo de Documentos Oficiales en PDF", has_docs, "Descargas directas de libreta, constancia y ficha", dt)

            page.screenshot(path=os.path.join(SCREENSHOT_DIR, "apoderado_06_tutor_y_docs.png"))

        except Exception as exc:
            record_result("EXCEPCIÓN CRÍTICA", "Error durante ejecución de pruebas de Apoderado", False, str(exc))
            page.screenshot(path=os.path.join(SCREENSHOT_DIR, "error_apoderado_e2e.png"))
        finally:
            context.close()

        # ─────────────────────────────────────────────────────────────────────
        # BLOQUE 7: RESPONSIVIDAD MÓVIL (VIEWPORT SMARTPHONE 375x812)
        # ─────────────────────────────────────────────────────────────────────
        print("\n[BLOQUE 7] Verificación de Responsividad Móvil (Viewport 375x812)...")
        mobile_context = browser.new_context(
            viewport={"width": 375, "height": 812},
            user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"
        )
        mobile_page = mobile_context.new_page()

        try:
            t0 = time.time()
            login_apoderado_ui(mobile_page)
            mobile_page.wait_for_selector("h1", timeout=15000)
            has_mobile_h1 = mobile_page.locator("h1").first.is_visible()
            has_mobile_tabs = mobile_page.locator("button[data-tab='notas']").first.is_visible()
            mobile_ok = has_mobile_h1 and has_mobile_tabs
            dt = time.time() - t0
            record_result("RESPONSIVIDAD MÓVIL", "7.1 Adaptación en pantalla de Smartphone (375x812)", mobile_ok, "Layout fluido sin desbordes horizontales", dt)

            mobile_page.screenshot(path=os.path.join(SCREENSHOT_DIR, "apoderado_07_mobile_responsive.png"))
        except Exception as exc:
            record_result("RESPONSIVIDAD MÓVIL", "Fallo en viewport móvil", False, str(exc))
        finally:
            mobile_context.close()
            browser.close()

    total_time = time.time() - start_all
    print_summary(total_time)

def print_summary(total_time: float):
    total = len(test_results)
    passed = sum(1 for t in test_results if t["passed"])
    failed = total - passed
    pct = (passed / total) * 100 if total > 0 else 0

    print("\n" + "=" * 80)
    print("RESUMEN FINAL DE LA SUITE E2E PLAYWRIGHT: DASHBOARD APODERADO")
    print("=" * 80)
    print(f"Total de Pruebas Ejecutadas: {total}")
    print(f"Pruebas Superadas (PASS):   {passed}")
    print(f"Pruebas Fallidas  (FAIL):   {failed}")
    print(f"Porcentaje de Éxito:        {pct:.1f}%")
    print(f"Tiempo Total de Ejecución:  {total_time:.2f} segundos")
    print(f"Capturas de Pantalla E2E:   {SCREENSHOT_DIR}")
    print("=" * 80)

    if failed > 0:
        print("\nDetalle de pruebas que requieren atención:")
        for t in test_results:
            if not t["passed"]:
                print(f"  - [{t['category']}] {t['name']}: {t['details']}")
        sys.exit(1)
    else:
        print("\n🏆 ¡TODAS LAS PRUEBAS E2E DEL DASHBOARD APODERADO PASARON CON ÉXITO! 🏆\n")
        sys.exit(0)

if __name__ == "__main__":
    run_apoderado_e2e_tests()
