# Auditoría TAREA-15

Fecha: 2026-11-05  
Repositorio: i-miss-cocaine/IMA  
Rama de trabajo: `NG_beta_0.0.0.1_work`  
Rama base: `NG_beta_0.0.0.1`  
Dictamen: **CUMPLE PARCIALMENTE**.

## Alcance

[TAREA-15] Completar la supervisión institucional de servicios, errores y recuperación:
1. Registro de versiones desplegadas por servicio.
2. Monitoreo de disponibilidad, latencia y errores clasificados.
3. Panel de salud para administradores sin secretos ni PII.
4. Identificador de trazabilidad `requestId` entre frontend y microservicios.
5. Alertas preventivas por fallos repetidos o dependencias caídas.
6. Procedimientos de recuperación probables en entorno de prueba sin modificar producción.

La entrada de `completadas.md` remite a `AUDITORIA_FASE1_PLANIFICACION_EXPANSION.md`, que no está presente en la rama inspeccionada. Se usa el alcance y los criterios explícitos de `completadas.md`.

## Archivos inspeccionados y respaldo SHA

| Archivo | SHA |
|---|---|
| `backend/user-service/Code.gs` | `12079dd410aa6d8afbce55a4bc62a79dea605f9f` |
| `backend/academic-service/Code.gs` | `daf1883ec0b8d4f0ff2bc673af8a4e8c5bbd03fc` |
| `backend/accounting-service/Code.gs` | `38b979d41596b85e888b4a7060b37bbac0840a28` |
| `js/ui-common.js` | `986938b8a311a41ed4cb3d135b66b6aaea4bed67` |
| `js/api.js` | `6b24f666db30a811a8e9b38d466fc6001cf6dfa9` |
| `js/developer.js` | `6fa4c4bd9be580c974b1fbede4f0cf79485dc331` |
| `js/config.js` | `49ef90807e5b9dfe1379f76d66efdb4ccd2b6cdc` |
| `backend/developer-service/Code.gs` | `8aa4bac67cfe5c8c54da51a0784a56fef633e412` |

Los cuatro archivos indicados directamente por TAREA-15 tienen SHA idéntico en `NG_beta_0.0.0.1` y `NG_beta_0.0.0.1_work`. También coinciden los archivos de soporte consultados; no se observaron correcciones posteriores de esos módulos en la rama de auditoría.

## Evidencia de cumplimiento parcial

### 1. Registro de versiones desplegadas

- `getServiceHealthReport` (user-service, líneas 73-140) incluye `serviceVersions`, pero fija USER, ACADEMIC, TASK, EXAM y ACCOUNTING en `1.0.0`; no consulta un registro de deployments, SHA de código, fecha de despliegue ni versión efectiva.
- Los encabezados inspeccionados identifican USER como v8.2.0, ACADEMIC como v8.4.0 y ACCOUNTING como v8.0.0. El mapa fijo no representa esas versiones. Tampoco incluye DEVELOPER.
- La versión declarada no prueba qué deployment de Apps Script está activo. La verificación de endpoint real y estado ACTIVE corresponde además a AUD-NG-131/AUD-NG-144.

### 2. Disponibilidad, latencia y clasificación de errores

- `getServiceHealthReport` consulta `LogsSistema` y cuenta errores, advertencias y categorías globales. No agrupa por servicio, acción ni ventana temporal; tampoco devuelve latencia, última falla por servicio ni tendencias. El estado se define como degradado solo si `errorsCount > 50`, sin umbral configurable ni período de observación.
- `getOperationalCapacityMetrics` (user-service, 4080-4148) sí calcula latencia media y tasa de error por servicio, pero depende de `BitacoraTrazabilidad`. El registro no se genera de forma transversal para cada llamada frontend/microservicio, por lo que el desglose no representa necesariamente todo el tráfico.
- `checkMicroserviceHealth` (api.js, 207-239) ejecuta `ping`; `checkAllMicroservicesHealth` (245-251) solo incluye USER, ACADEMIC, TASK y EXAM. Omite ACCOUNTING y DEVELOPER, y TASK/EXAM no tienen dispatcher para `ping`.
- Los ping existentes en USER (1552), ACADEMIC (964) y ACCOUNTING (834) devuelven `dbConnected: true` como literal, sin abrir ni probar la dependencia. La comprobación puede marcar servicio online sin acreditar acceso real al Spreadsheet.
- El helper solicita timeout de 6 segundos, pero `fetchApi` fija 60 segundos (api.js, 26-37) y no consume `options.timeout`; un health check puede tardar mucho más de lo esperado.
- `js/developer.js` ejecuta el chequeo al cargar la consola (90-180), pero recibe resultados incompletos por la lista de servicios y los ping ausentes.

### 3. Panel de salud institucional

- `openInstitutionalHealthDashboardModal` (ui-common.js, 1938-1996) usa `window.getServiceHealthMetrics`; esa función no está definida en los 21 scripts JavaScript del repositorio. Por tanto cae en un objeto vacío con contadores en cero y presenta los servicios como OPERATIVO y el estado global SALUDABLE.
- El modal no llama a `getServiceHealthReport` ni a `checkAllMicroservicesHealth`; el botón “Actualizar Mediciones” vuelve a abrir el modal y lee el mismo proveedor ausente.
- El endpoint `getServiceHealthReport` sí comprueba el rol verificado y limita el reporte a Administrador, Desarrollador o Director, y su respuesta es agregada. Sin embargo, no se encontró integración desde el panel de salud con ese endpoint.
- `getSecurityAndComplianceDashboardData` sí incorpora `getOperationalCapacityMetrics`, pero es otra ruta y depende de la bitácora de trazabilidad, no del reporte de TAREA-15.

### 4. Trazabilidad requestId entre frontend y servicios

- `fetchApi` (api.js, 11-60) envía únicamente `action` y `payload`; no genera ni propaga `requestId` o `correlationId`.
- El esquema `LogsSistema` de USER/ACADEMIC/ACCOUNTING (user-service 50-70; academic-service 29-77; accounting-service 52-99) guarda ID, timestamp, servicio, función, severidad, código, mensaje, payload y rol, pero no requestId/correlationId.
- `createInterServiceEnvelope` y `verifyInterServiceEnvelope` existen en user-service (1009-1063), pero solo se encontró su declaración, sin llamadas reales en los servicios revisados. `recordTraceabilityLog` (4548-4573) usa correlationId y tiene puntos de registro limitados, no un middleware transversal por petición.
- En consecuencia, una petición iniciada en frontend no puede reconstruirse de forma confiable entre todos los microservicios. Esta brecha se integra con AUD-NG-083 y AUD-NG-145, sin crear otra tarea de protocolo/bitácora.

### 5. Alertas preventivas

- `getServiceHealthReport` devuelve `operationalStatus` según un umbral fijo de 50 errores; no genera notificación, incidente, alerta deduplicada ni seguimiento de dependencia.
- `getOperationalCapacityMetrics` usa umbrales fijos (tasa de error superior a 10% o más de cinco errores de cuota) y devuelve un estado de advertencia; no se verificó un flujo que convierta ese resultado en alerta preventiva deduplicada para administradores.
- El panel institucional no consume métricas reales, por lo que tampoco puede demostrar alertas basadas en ellas.
- El inventario y proyección de cuotas, umbrales configurables y alertas están ya cubiertos por TASK-064. No se crea un duplicado (AUD-NG-163 permanece marcado como duplicado/consolidado).

### 6. Privacidad y recuperación

- El reporte de salud devuelve agregados y no incluye directamente PII, lo cual es positivo.
- No obstante, `sanitizePayloadForLog` solo enmascara password/clave/token/secret/credencial/authorization; no elimina nombres, correos, teléfonos, RTN, cuentas ni otros datos personales/financieros. `getStructuredLogs` devuelve el campo payload. Esta brecha pertenece a AUD-NG-145.
- El endpoint de reporte es de lectura y no modifica producción, pero no se encontró un procedimiento de recuperación/rollback probado en entorno aislado como parte de TAREA-15. Las pruebas reproducibles con fixtures y sin datos productivos se coordinan con AUD-NG-161.

## Reconciliación de hallazgos

**No se crea AUD-NG-170.** Las brechas detectadas ya están cubiertas por tareas existentes:
- **AUD-NG-131:** endpoint real, versiones coherentes y estado ACTIVE verificado.
- **AUD-NG-144:** health checks reales para todos los microservicios, ping auténtico y latencia/fallback.
- **AUD-NG-145:** bitácora central, filtros, sanitización PII/financiera y trazabilidad.
- **AUD-NG-083:** integración real del protocolo interservicio y correlación entre emisor/receptor.
- **TASK-064:** métricas de capacidad/cuotas, umbrales configurables y alertas preventivas.
- **AUD-NG-161:** pruebas aisladas de recuperación, integridad y concurrencia.
- **AUD-NG-163:** permanece marcado DUPLICADA y consolidado en tareas anteriores; no ejecutarlo independientemente.

## Dictamen y límites

TAREA-15 **CUMPLE PARCIALMENTE**: existe un reporte administrativo agregado, una función de métricas basada en trazabilidad y helpers de ping, pero no se registra la versión real del deployment, el panel institucional no consume fuentes válidas, el monitor no cubre todos los servicios, los ping no verifican la base de datos, no existe requestId transversal ni alertamiento preventivo verificable.

Auditoría estática/manual. No se ejecutaron health checks en despliegues productivos, pruebas de caída, cuota, latencia, alertas, trazabilidad distribuida ni recuperación/rollback. No se modificó código fuente, `completadas.md`, `completadas_legacy.md`, `ChangesLogs.txt` ni `METODOLOGIA_DESARROLLO.md`.

## Próxima continuidad

Progreso: 21/183 identificadores auditados; 162 pendientes. La siguiente entrada después de TAREA-15 en `completadas.md` es **TAREA-16**.
