# Uso personal y compartido (tu Mac prendida)

Hay dos formas de abrir Radar APROS, que pueden estar encendidas a la vez y comparten la misma base:

| | Comando | Dirección | Acceso |
|---|---|---|---|
| **Personal** | `npm run dev` | `http://localhost:3000` | Entra directo, sin usuario ni clave (requiere `LOCAL_MODE=true` en `.env`). Solo se puede abrir desde tu propia Mac. |
| **Compartida** | `npm run share` | `http://<IP-de-tu-Mac>:3001` | Otros equipos de la misma red entran con **su usuario y clave**. El acceso directo y el acceso de desarrollo están desactivados aquí. |

## Un solo comando
```bash
npm run iniciar
```
Levanta la base de datos, el worker (la lista de los lunes 8:30), la versión personal (puerto 3000) y la compartida (puerto 3001), evita que la Mac se duerma y muestra la dirección para tus compañeros. `Ctrl + C` detiene todo. Requiere Docker Desktop abierto.

## Que se levante solo al iniciar sesión (macOS)
```bash
npm run autoarranque -- instalar
```
Desde el siguiente inicio de sesión en la Mac, Radar APROS se levanta solo (abre Docker Desktop si estaba cerrado, y arranca base, worker y las dos versiones). Registro en `~/Library/Logs/radar-apros.log`. Para quitarlo: `npm run autoarranque -- quitar`; para ver si está activo: `npm run autoarranque -- estado`. Funciona con la Mac encendida y tu sesión iniciada; no corre con la pantalla de inicio de sesión sin entrar.

## Pasos (manual)
1. En `.env` agrega `LOCAL_MODE=true` (solo para tu uso personal; la app se niega a arrancar así en producción).
2. Con Docker abierto: `docker compose up -d db`, luego `npm run dev` en una ventana y `npm run share` en otra.
3. Averigua la IP de tu Mac: `ipconfig getifaddr en0` (si usas cable: `en1`). Quien esté en la misma red abre `http://ESA-IP:3001`.
4. Crea una cuenta por persona en el modo personal: **Configuración → Usuarios y accesos** (o `npm run user:create`). Rol sugerido para consulta: `read_only`; para quien también promueva empresas: `salesperson`.
5. La primera vez macOS pregunta si permites conexiones entrantes a «node»: acepta.
6. Para que la Mac no se duerma mientras otros la usan: `caffeinate -d` en otra ventana.

## Límites a tener presentes
- Solo funciona **mientras tu Mac esté prendida, despierta y conectada a la red**; si se apaga, los demás pierden el acceso.
- La red local usa HTTP sin cifrar: las claves viajan en claro dentro de esa red. Úsalo solo en una red de confianza (oficina), no en Wi-Fi público. Para internet o más personas, el siguiente paso es un servidor con HTTPS.
- La carga del padrón y los análisis corren en el worker (`npm run worker`) de tu Mac.
- El modo compartido usa el servidor de desarrollo: es más lento que uno de producción, pero basta para pocas personas.
