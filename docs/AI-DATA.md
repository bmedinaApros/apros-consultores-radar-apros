# Datos que Radar envía al proveedor de IA

Aplica solo cuando `AI_PROVIDER=anthropic` (opcional). Con `rules` (el valor por defecto: plantillas y reglas, sin IA) no sale nada de la máquina.

## Qué se envía (por diagnóstico)
- **Instrucciones fijas** (`diagnostico-v1`): reglas de evidencia y lenguaje, más la guía del rubro (editable por un administrador).
- **Empresa:** nombre comercial, dominio y rubro.
- **Observaciones del analizador** (ya guardadas en Radar): nombre de la señal, estado (detectada / no detectada), confianza, valores compactos y un extracto corto del HTML público cuando existe. Todo texto que viene del sitio se limpia (sin `<`, `>` ni caracteres de control), se acota y se marca como **dato no confiable**.
- **Nombres de los servicios de APROS** (catálogo) y los nombres de señales que no se pudieron verificar (sin su contenido).

## Qué NO se envía
Correos, teléfonos o nombres de personas de contacto, notas internas, puntajes, ajustes manuales, razones de rechazo, listas de no contactar, clientes, credenciales, datos de otros usuarios, ni ninguna cabecera de sesión.

## Controles
- Sin herramientas, sin navegación y sin ejecución de código en la llamada: el modelo solo devuelve JSON con esquema fijo.
- La salida se trata como no confiable: se valida contra el esquema, se limpia y se marcan afirmaciones sin evidencia, números sin respaldo, lenguaje prohibido, promesas, enlaces ajenos, datos personales y eco de instrucciones.
- Cada llamada queda en `ai_generations` (proveedor, modelo, versión del prompt, tokens, costo estimado, estado) sin modificar.
- Topes diario y mensual en USD; el peor caso se comprueba **antes** de llamar.
- Solo API de Anthropic con `ANTHROPIC_API_KEY`. Nunca credenciales de Claude Pro/Max ni de Claude Code.

## Pendiente antes de producción
Confirmar con la empresa las condiciones de retención/uso de datos de la cuenta de API y, si corresponde, informarlo en la política de privacidad. Con datos reales solo se envía contenido público de sitios web de empresas.
