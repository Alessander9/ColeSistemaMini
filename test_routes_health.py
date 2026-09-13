# -*- coding: utf-8 -*-
import urllib.request
import urllib.error
import sys

BASE_URL = "http://localhost:3000"

ROUTES = [
    # Auth
    ("/login", "Login Page"),
    
    # Admin Portal
    ("/admin", "Admin Dashboard"),
    ("/admin/academico", "Explorador Escolar Jerárquico"),
    ("/admin/docentes", "Gestion de Docentes & Asignacion"),
    ("/admin/secciones/sec-3pri-a", "Hub Seccion 3 Primaria A"),
    ("/admin/secciones/sec-1sec-a", "Hub Seccion 1 Secundaria A"),
    ("/admin/horarios", "Gestion de Horarios y Asignacion Docente"),
    ("/admin/notas-salon", "Matriz de Calificaciones por Salon"),
    ("/admin/estudiantes", "Padron de Estudiantes & Carnets QR"),
    ("/admin/matriculas", "Gestion de Matriculas & Credenciales"),
    ("/admin/reportes", "Consolidado de Notas & Reportes"),
    
    # Docente Portal
    ("/docente", "Dashboard Docente"),
    ("/docente/horario", "Horario Semanal Docente"),
    ("/docente/asistencia", "Control de Asistencia QR en Vivo"),
    ("/docente/notas", "Registro de Calificaciones por Competencias"),
    ("/docente/tareas", "Gestion y Calificacion de Tareas"),
    ("/docente/evaluaciones", "Programacion de Examenes y Evaluaciones"),
    
    # Estudiante Portal
    ("/estudiante", "Dashboard de Inicio del Alumno"),
    ("/estudiante/carnet-qr", "Carnet Digital de Identificacion QR"),
    ("/estudiante/horario", "Horario Escolar del Alumno"),
    ("/estudiante/libreta-notas", "Libreta Oficial de Notas por Competencias"),
    ("/estudiante/asistencias", "Historial de Asistencia y Puntualidad"),
    ("/estudiante/tareas", "Lista de Tareas y Entregas"),
    ("/estudiante/evaluaciones", "Calendario de Examenes y Practicas"),
]

def check_all_routes():
    passed = 0
    failed = 0
    print("=" * 70)
    print("VERIFICACION DE SALUD & RESPUESTA DE TODOS LOS ENDPOINTS (HTTP GET)")
    print("=" * 70)

    for path, name in ROUTES:
        url = f"{BASE_URL}{path}"
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req, timeout=5) as response:
                status = response.getcode()
                body = response.read().decode('utf-8')
                if status == 200 and len(body) > 200:
                    print(f" [PASS 200 OK] {path:<32} -> {name}")
                    passed += 1
                else:
                    print(f" [FAIL {status}]   {path:<32} -> {name} (Body len: {len(body)})")
                    failed += 1
        except Exception as e:
            print(f" [ERROR]       {path:<32} -> {name} ({e})")
            failed += 1

    print("=" * 70)
    print(f"TOTAL EVALUADOS: {passed + failed} | EXITOSOS: {passed} | FALLIDOS: {failed}")
    print(f"TASA DE EXITO: {round(passed / (passed + failed) * 100, 1)}%")
    print("=" * 70)
    if failed > 0:
        sys.exit(1)

if __name__ == "__main__":
    check_all_routes()
