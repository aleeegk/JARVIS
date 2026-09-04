# JARVIS — Paquete con Gmail real integrado

## Qué incluye este ZIP

- `jarvis_v5.py` — tu programa principal, tal cual lo subiste.
- `jarvis_app.py` — la interfaz gráfica de escritorio, tal cual la subiste.
- `modules/email.py` — **NUEVO**: reemplaza al anterior, ahora usa la API real de Gmail (leer y enviar de verdad, con OAuth2).
- `modules/credentials.json` — tus credenciales de OAuth, tal como las descargaste de Google Cloud Console.
- `modules/__init__.py` — vacío, necesario para que Python trate `modules/` como paquete.

## ⚠️ Lo que este ZIP NO incluye (y necesitas añadir tú)

`jarvis_v5.py` importa además estos módulos, que tú ya tenías funcionando antes pero que nunca me subiste, así que no puedo empaquetarlos:

- `modules/mensajeria.py`
- `modules/musica.py`
- `modules/productividad.py`
- `modules/vision.py`
- `modules/compras.py`

**Cópialos desde tu proyecto actual a la carpeta `modules/` de este ZIP** (o simplemente descomprime este ZIP encima de tu proyecto existente, sobrescribiendo solo `jarvis_v5.py`, `jarvis_app.py` y `modules/email.py`). Si te falta alguno de esos módulos porque nunca llegamos a construirlo en el chat, dímelo y lo hacemos.

## Cómo ponerlo en marcha

1. Descomprime el ZIP en la carpeta de tu proyecto (o sobrescribe encima de la que ya tienes).
2. Asegúrate de que faltan los módulos de la lista de arriba — cópialos si los tienes en otro lado.
3. Instala las dependencias:
   ```
   pip install -r requirements.txt
   ```
4. Ejecuta:
   ```
   python jarvis_v5.py
   ```
5. La primera vez que le pidas algo relacionado con el correo (ej. "lee mis emails"), se abrirá el navegador pidiéndote autorizar el acceso a tu cuenta de Gmail. Verás un aviso de "app no verificada" — es normal, es tu propia app personal (pulsa "Avanzado" → continuar). Después de aceptar, se crea `modules/token.json` y no lo vuelve a pedir.

## Nota de seguridad sobre `credentials.json`

Este archivo identifica tu app ante Google, pero **no da acceso a tu cuenta por sí solo** — hace falta que tú apruebes el permiso la primera vez (paso 5). Aun así, no lo subas a repositorios públicos de GitHub ni lo compartas: si alguien más lo usara, podría hacer que tu app pida acceso a cuentas de Gmail en su nombre. Para un proyecto personal como este, no es motivo de alarma, solo mantenlo fuera de sitios públicos.
