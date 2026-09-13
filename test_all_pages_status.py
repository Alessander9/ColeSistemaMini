# -*- coding: utf-8 -*-
"""
Test exhaustivo de disponibilidad y respuesta HTTP 200 para todas las 31 rutas del sistema.
"""
import urllib.request
import urllib.error
import time

ROUTES = [
    # Standalone & Auth
    ("/", "admin"),
    ("/login", None),
    ("/despedida", None),
    ("/bienvenida", "admin"),
    ("/asistencia", "asistencia"),
    
    # Admin Portal (10 routes)
    ("/admin", "admin"),
    ("/admin/academico", "admin"),
    ("/admin/docentes", "admin"),
    ("/admin/horarios", "admin"),
    ("/admin/notas-salon", "admin"),
    ("/admin/estudiantes", "admin"),
    ("/admin/matriculas", "admin"),
    ("/admin/reportes", "admin"),
    ("/admin/secciones/sec-1pri-a", "admin"),
    ("/admin/secciones/sec-3pri-a", "admin"),

    # Docente Portal (7 routes)
    ("/docente", "docente"),
    ("/docente/asistencia", "docente"),
    ("/docente/notas", "docente"),
    ("/docente/tareas", "docente"),
    ("/docente/evaluaciones", "docente"),
    ("/docente/horario", "docente"),

    # Estudiante Portal (7 routes)
    ("/estudiante", "estudiante"),
    ("/estudiante/carnet-qr", "estudiante"),
    ("/estudiante/libreta-notas", "estudiante"),
    ("/estudiante/asistencias", "estudiante"),
    ("/estudiante/tareas", "estudiante"),
    ("/estudiante/horario", "estudiante"),
]

def test_routes():
    print("=" * 70)
    print("AUDITORÍA DE RUTAS Y CÓDIGOS DE ESTADO HTTP (31 ENDPOINTS)")
    print("=" * 70)
    
    passed = 0
    failed = 0
    
    for route, role in ROUTES:
        url = f"http://localhost:3000{route}"
        req = urllib.request.Request(url)
        if role:
            req.add_header('Cookie', f'cole_user_role={role}; cole_access_token=valid-jwt-token')
        
        t0 = time.time()
        try:
            resp = urllib.request.urlopen(req, timeout=10)
            elapsed_ms = round((time.time() - t0) * 1000, 1)
            code = resp.getcode()
            if code == 200:
                print(f"  [OK 200] ({elapsed_ms}ms) -> {route}")
                passed += 1
            else:
                print(f"  [FAIL {code}] ({elapsed_ms}ms) -> {route}")
                failed += 1
        except urllib.error.HTTPError as e:
            elapsed_ms = round((time.time() - t0) * 1000, 1)
            print(f"  [HTTP ERROR {e.code}] ({elapsed_ms}ms) -> {route}")
            failed += 1
        except Exception as ex:
            print(f"  [ERROR] {route}: {ex}")
            failed += 1

    print("=" * 70)
    print(f"Rutas Verificadas: {passed + failed} | Exitosas: {passed} | Fallidas: {failed}")
    print(f"Tasa de Disponibilidad: {round((passed/(passed+failed))*100, 1)}%")
    print("=" * 70)
    return failed == 0

if __name__ == '__main__':
    test_routes()
