import urllib.request
import urllib.error
import json

BASE = 'http://localhost:3001'

print("=== VERIFICACIÓN DE REMEDIACIONES DE SEGURIDAD ===")

# Test 1: Forged cookie attack on /admin
req1 = urllib.request.Request(f'{BASE}/admin', headers={'Cookie': 'cole_user_role=admin'})
res1 = urllib.request.urlopen(req1)
is_blocked_1 = '/login' in res1.geturl()
print(f"Test 1 (Cookie Forging /admin): Final URL = {res1.geturl()} -> {'[OK - REMEDIADO - BLOQUEADO]' if is_blocked_1 else '[FALLO - VULNERABLE]'}")

# Test 2: Unauthenticated POST /api/branding
try:
    payload = json.dumps({'nombreInstitucion': 'Hacked'}).encode('utf-8')
    req2 = urllib.request.Request(f'{BASE}/api/branding', data=payload, headers={'Content-Type': 'application/json'}, method='POST')
    res2 = urllib.request.urlopen(req2)
    print(f"Test 2 (POST /api/branding): Status = {res2.status} -> [FALLO - VULNERABLE]")
except urllib.error.HTTPError as e:
    print(f"Test 2 (POST /api/branding): Bloqueado con HTTP {e.code} -> [OK - REMEDIADO - DENEGADO]")

# Test 3: Unauthenticated POST /api/notifications/resend
try:
    payload = json.dumps({'recipientEmail': 'victim@test.com', 'type': 'bienvenida'}).encode('utf-8')
    req3 = urllib.request.Request(f'{BASE}/api/notifications/resend', data=payload, headers={'Content-Type': 'application/json'}, method='POST')
    res3 = urllib.request.urlopen(req3)
    print(f"Test 3 (POST /api/notifications/resend): Status = {res3.status} -> [FALLO - VULNERABLE]")
except urllib.error.HTTPError as e:
    print(f"Test 3 (POST /api/notifications/resend): Bloqueado con HTTP {e.code} -> [OK - REMEDIADO - DENEGADO]")

# Test 4: Verify that GET /api/branding is still allowed for public UI
try:
    req4 = urllib.request.Request(f'{BASE}/api/branding')
    res4 = urllib.request.urlopen(req4)
    print(f"Test 4 (GET /api/branding publico): Status = {res4.status} -> [OK - OPERATIVO]")
except Exception as e:
    print(f"Test 4 (GET /api/branding): Error = {e}")
