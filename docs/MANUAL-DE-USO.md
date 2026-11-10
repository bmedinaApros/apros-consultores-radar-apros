# Manual de uso de Radar APROS

Radar APROS sirve para **encontrar empresas peruanas** en el padrón de SUNAT, **revisar su presencia digital** y **preparar un informe de oportunidades** para APROS. Este manual explica qué se puede hacer en cada opción del menú.

> Cada persona ve solo lo que su rol permite. Roles: **Administrador**, **Líder de ventas**, **Consultor**, **Vendedor** y **Solo lectura**.

---

## 1. Buscar (pantalla de inicio)
**Para qué sirve:** encontrar empresas en el padrón de SUNAT (873 mil registros).

1. Escribe una **palabra clave** en la caja: `inmobiliaria`, `clínicas Arequipa`, `transporte en Lima` o un RUC (`20100193117`). Radar entiende departamentos y plurales.
2. Revisa «Lo que entendí» debajo de la caja para confirmar cómo interpretó tu frase.
3. En los resultados verás RUC, razón social, dirección, departamento, estado, rubro sugerido y avisos («No contactar», «Cliente activo», «Ya no aparece»).
4. **Descargar resultados (CSV):** baja hasta 5.000 filas para abrir en Excel.
5. **Filtros avanzados** (plegados): razón social exacta, departamento, ubigeo, rubro, estado, condición, tipo de persona y «solo las que aún no están en la base».
6. Pulsa un **RUC** para ver la ficha de la empresa en el padrón: domicilio fiscal, rubro sugerido, fuente y establecimientos anexos.

**Pasar empresas a la base de trabajo («promover»):** marca las casillas y pulsa **Promover seleccionadas** (máximo 200 a la vez). Las empresas en «No contactar» o clientes activos no se pueden promover. Si hay una empresa de nombre parecido ya en la base, Radar avisa para que **vincules el RUC** en lugar de duplicar.

Quién puede: todos buscan; promover es de Administrador, Líder, Consultor y Vendedor.

## 2. Cargar padrón
**Para qué sirve:** actualizar el padrón cuando SUNAT publique un archivo nuevo. **Si ya está cargado, no hace falta usarlo.**

1. Descarga el padrón reducido de SUNAT y cópialo a la carpeta `data/import` del proyecto (acepta `.zip`, `.gz`, `.txt`).
2. Elige el archivo, escribe una nota de la fuente (por ejemplo «Actualizado al 07/11/2026») y pulsa **Cargar**.
3. Se procesa en segundo plano (requiere `npm run worker` activo). Verás el avance y puedes **cancelar** o **reanudar** si se interrumpe.
4. Por defecto solo guarda personas jurídicas, activas y habidas. Las personas naturales nunca se guardan.
5. El **archivo de locales anexos** se carga igual, después del archivo principal.

La lista de abajo es el historial de cargas (cuándo, cuántas filas, si terminó bien). Quién puede: Administrador y Líder de ventas.

## 3. Más
### Empresas de la base
Las empresas que ya promoviste. Puedes buscarlas y filtrarlas, abrir su ficha y editarla (rubro, ciudad, responsable, etapa). En la ficha:
- **Sitio web:** Radar puede **buscarlo solo**: prueba direcciones probables a partir del nombre y comprueba que sean de la empresa (botón «Buscar sitio automáticamente»; en «Empresas de la base» hay uno para un lote de 20, y cada lunes lo hace solo con hasta 40). Si el RUC aparece en la portada, lo asigna; si solo coincide el nombre, queda **sugerido** para que lo confirmes con un clic. También puedes escribirlo a mano: Radar comprueba que exista, que responda y qué permite su `robots.txt` antes de guardarlo. No acepta redes sociales ni correos gratuitos.
- **Analizar sitio:** lee la portada y unas pocas páginas públicas y registra señales (SEO, medición, formularios, WhatsApp, móvil…). Lo que no se detecta se dice con honestidad: «no detectado» no prueba que no exista.
- **Generar diagnóstico:** crea el borrador del informe de oportunidades.
- **Puntaje:** prioridad calculada con el modelo del rubro, con su explicación y la posibilidad de ajustarlo con criterios manuales.
- **Señales externas (registro manual):** botones que abren en otra pestaña la búsqueda en Computrabajo, Bumeran, Laborum, Biblioteca de anuncios de Meta e Indecopi. Lo que veas, lo registras con tipo, fuente, fecha, enlace y tu nombre queda anotado. Radar no lee esos sitios por su cuenta.

### Diagnósticos
Lista de los diagnósticos y su estado: **Borrador → En revisión → Aprobado** (o Rechazado).
1. Abre un diagnóstico, revísalo y edítalo si hace falta (cada cambio crea una versión nueva).
2. **Enviar a revisión** y luego **Aprobar** (Administrador, Líder o Consultor). Si hay afirmaciones marcadas sin sustento, no se puede aprobar.
3. Aprobado y vigente, aparecen las descargas: **informe (PDF de varias páginas con la marca APROS)**, **resumen de 1 página (PDF)** y **PPTX**.
4. Si cambia la evidencia (nuevo análisis del sitio), el diagnóstico queda **desactualizado** y hay que regenerarlo y volver a aprobarlo.

### Lista semanal
La lista de empresas candidatas que Radar arma cada **lunes a las 8:30** (con el worker activo), de hasta 50 empresas: busca el sitio de las que no lo tienen, lo analiza, puntúa y arma la lista. También se puede pedir a «Comité IA» («muéstrame la lista de esta semana», «corre la lista ahora»). Es la lista de empresas candidatas que Radar arma cada semana a partir de las fuentes activas, analizada y puntuada, para que una persona la revise.

### Bandeja de revisión
Empresas con puntaje, de mayor a menor. Aprueba o descarta cada una. Los puntajes de rubros distintos usan modelos distintos y solo se comparan si el modelo es el mismo.

### Importar CSV
Sube una lista propia de empresas en CSV. Primero ves una **vista previa**; no se crea nada hasta que confirmas. Se omiten duplicados y empresas en «No contactar».

### Duplicados
Empresas con nombre muy parecido. Tú decides si son la misma; nada se fusiona solo.

### Fuentes
Fuentes de empresas disponibles. Todas están desactivadas por defecto y solo se activan después de revisar sus términos de uso.

## 4. Configuración (Administrador; el Líder ve «No contactar» y «Auditoría»)
| Opción | Qué se hace |
|---|---|
| Rubros | Crear y editar los rubros (sectores) que se asignan a las empresas |
| Reglas de rubro | Palabras que, en la razón social, sugieren un rubro. Tras editarlas se recalculan las sugerencias del padrón |
| Señales por rubro | Señales propias de cada rubro, detectadas por palabras clave del sitio |
| Modelos de puntaje | Pesos del puntaje (suman 100). Cada cambio crea una versión nueva; las anteriores siguen reproducibles |
| Servicios de APROS | Catálogo de servicios que el diagnóstico puede proponer y las señales que los justifican |
| Ejecución semanal | Activar o pausar la corrida semanal, ver su presupuesto y su historial |
| IA y presupuesto | Muestra con qué se generan los diagnósticos (por defecto, plantillas y reglas, sin costo) y los topes si se activara IA |
| Usuarios y accesos | Crear usuarios, asignar rol, restablecer claves, desactivar cuentas. La clave temporal se muestra una sola vez |
| No contactar | Lista de empresas, dominios o correos que nunca deben usarse. Se aplica en todo el sistema; el motivo es obligatorio |
| Clientes activos | Clientes de APROS que se excluyen automáticamente de los prospectos |
| Auditoría | Registro de solo lectura de quién hizo qué y cuándo; no se puede editar |

## 5. Otras funciones
- **Búsqueda global** (caja de arriba, atajo `/`): busca empresas, RUC o dominios desde cualquier pantalla.
- **Colapsar menú:** flecha junto al logo de APROS (arriba del menú), o `Cmd + B`. Colapsado, solo queda la flecha para volver a abrirlo.
- **Menú de cuenta** (arriba a la derecha): cambiar tu clave y cerrar sesión.
- **Conector de Claude:** permite que la conversación «APROS – Comité IA» consulte Radar (solo lectura). Ver `docs/CONECTOR-CLAUDE.md`.
- **Usar desde otros equipos** mientras tu Mac está prendida: ver `docs/USO-EN-RED.md`.

## 6. Reglas que Radar siempre respeta
- Un diagnóstico **no se exporta** si no está aprobado por una persona, está desactualizado o tiene afirmaciones sin sustento.
- Las empresas en **No contactar** y los **clientes activos** no se promueven ni se usan comercialmente.
- Radar solo lee **información pública** y respeta el `robots.txt` de cada sitio.
- Todo lo importante queda en la **auditoría**.
