import urllib.request
import json
import time

# Configurations matching backend services
USER_SERVICE_URL = "http://localhost:8080/auth/login"
IVR_SERVICE_CALL = "http://localhost:8082/ivr/call"
IVR_SERVICE_CONFIRM = "http://localhost:8082/ivr/confirm"

credentials = {
    "email": "admin@voicepay.com",
    "password": "password123"
}

print("[KEY] Step 1: Obteniendo token JWT seguro desde user-service...")
req_login = urllib.request.Request(
    USER_SERVICE_URL,
    data=json.dumps(credentials).encode("utf-8"),
    headers={"Content-Type": "application/json"},
    method="POST"
)

try:
    with urllib.request.urlopen(req_login) as response:
        res_data = json.loads(response.read().decode("utf-8"))
        jwt_token = res_data["token"]
        print("[SUCCESS] Token JWT obtenido con éxito.")
except Exception as e:
    print("[ERROR] Error al iniciar sesión en el backend:", e)
    exit(1)

# Authorized headers
headers = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {jwt_token}"
}

print("\n[CALL] Step 2: Simulando llamada entrante de Pedro (+34655443322)...")
call_payload = {
    "from": "+34655443322"
}

req_call = urllib.request.Request(
    IVR_SERVICE_CALL,
    data=json.dumps(call_payload).encode("utf-8"),
    headers=headers,
    method="POST"
)

try:
    with urllib.request.urlopen(req_call) as response:
        res_call = json.loads(response.read().decode("utf-8"))
        print("\n[BOT] Respuesta del BOT IVR:")
        print(f"-> \"{res_call['message']}\"")
        print("\n[ACTIVE] Llamada activa! Ve a tu navegador y abre la Consola de Agente (http://localhost:5173/agent-console).")
        print("[HINT] Pon tu estado en 'Available' (Disponible) para poder recibir la llamada.")
except Exception as e:
    print("[ERROR] Error al simular llamada entrante:", e)
    exit(1)

print("\n[WAIT] Esperando 4 segundos antes de transferir al agente...")
for i in range(4, 0, -1):
    print(f"{i} segundos restantes...", end="\r")
    time.sleep(1)

print("\n[KEYPAD] Step 3: Simulando que el usuario selecciona Opcion '2' (Hablar con un Agente)...")
confirm_payload = {
    "userId": 71,
    "option": "2"
}

req_confirm = urllib.request.Request(
    IVR_SERVICE_CONFIRM,
    data=json.dumps(confirm_payload).encode("utf-8"),
    headers=headers,
    method="POST"
)

try:
    with urllib.request.urlopen(req_confirm) as response:
        res_confirm = json.loads(response.read().decode("utf-8"))
        print("\n[BOT] Respuesta del BOT IVR:")
        print(f"-> \"{res_confirm['message']}\"")
        print("\n[TRANSFER] Llamada transferida al agente!")
        print("[HINT] En tu navegador la Consola de Agente deberia abrirse y comenzar a SONAR (timbre acustico) sincronamente.")
        print("[HINT] Podras hacer clic en 'Aceptar' para establecer la comunicacion y luego 'Transferir a IVR Seguro' cuando termines.")
except Exception as e:
    print("[ERROR] Error al procesar la opcion del IVR:", e)
    exit(1)

print("\n[WAIT] El script mantendra la sesion abierta por 20 segundos para darte tiempo de probar las interacciones...")
for i in range(20, 0, -1):
    print(f"{i} segundos restantes...", end="\r")
    time.sleep(1)
print("\n[FINISHED] Simulacion completada.")
