# Auditoría F8-Task16 / TAREA-ARQ-01 — Independencia funcional y comunicación entre roles

- Fecha: 2026-11-09.
- ID de sesión operativo: IMA-AUDIT-20261109-0010Z-05 (identificador documental; no ID nativo de ChatGPT).
- Checkpoint inicial: C1.275. Checkpoint de cierre previsto: C1.276.
- Repositorio: i-miss-cocaine/IMA.
- Rama: NG_beta_0.0.0.1_work.
- HEAD de partida: 8c5b6ed11cd92e167792442582679daf28b69f7c.
- Rama base: NG_beta_0.0.1 @ 44d9891132332e692dbe2ba8602b41f50a508a59; 344 commits adelante, 0 detrás.
- Tarea auditada: F8-Task16 / TAREA-ARQ-01, marcada [X] en completadas.md, líneas 5144–5166.
- Informe individual previo: no existe AUDITORIAS/AUDITORIA_COMPLETADAS_F8-TASK16.md; se ejecutó la auditoría directamente.
- Dictamen: NO CUMPLE. CA-ARQ-101 y CA-ARQ-102 NO CUMPLEN.

## 1. Objetivo y criterios

Comprobar la separación entre fuentes maestras, espacios operativos por rol y vistas/proyecciones; la capacidad de mantener varios roles/responsabilidades por usuario; y las comunicaciones inter-rol mediante solicitudes, notificaciones, eventos e identificadores estables.

- CA-ARQ-101: matrículas, expedientes e historial conservan una única fuente de verdad.
- CA-ARQ-102: comunicaciones inter-rol usan servicios/eventos sin duplicar registros maestros en hojas locales.
- Requisitos complementarios: catálogo configurable de responsabilidades/permisos/ámbitos; espacios funcionales reales por rol; múltiples roles simultáneos; configuración organizacional sin cambios de código.

## 2. Fuentes e integridad

| Fuente | SHA | Alcance |
|---|---|---|
| completadas.md | f57f1aef832e81e44fc4f7ec36a852d50e464676 | F8-Task16 [X], 5144–5166; F8-Task17–23, 5170–5343 |
| METODOLOGIA_DESARROLLO.md | cf796728bb384a32537392df2f9c72a339fa03ee | Inicio/cierre, sección 3.4 y reglas de auditoría |
| Pendientes.md | blob 676a3f798715f0cdd7d4bc75768472545b8465ee | Consultado por instrucción expresa de esta tarea; 1.786.011 caracteres, 20.224 líneas, máximo TASK-636; sin cambios |
| backend/developer-service/Code.gs | 8aa4bac67cfe5c8c54da51a0784a56fef633e412 | 2.901 líneas |
| backend/user-service/Code.gs | 12079dd410aa6d8afbce55a4bc62a79dea605f9f | 9.808 líneas |
| backend/academic-service/Code.gs | df87a2eea9f0ef79d0b966d03fd5bbe432003df5 | 14.449 líneas |
| AUDITORIAS/AUDITORIA_COMPLETADAS_PLAN.md | ea3a3393f983e04e68ea86c08ed50048cad5406a | Plan acumulativo |
| AUDITORIAS/Auditoria.txt | 332408ae93865726f505befc72dd83de4e3dc692 | Bitácora histórica |
| AUDITORIAS/Contexto_personal.txt | 8e72e4a30327c986b99c7516e825e7137a0290eb | Checkpoint C1.275 |
| AUDITORIAS/MapaDependencias.md | 8c7900094b36a154fd259daba8e26adc3f6a7b7d | Mapa/bitácora arquitectónica |

Nota de precedencia: la metodología 3.4 indica que Pendientes.md queda fuera del flujo, pero la instrucción explícita de esta auditoría exige consultarlo. Se siguió la instrucción específica; el archivo no se modificó. La metodología se mantuvo para auditoría manual, trazabilidad, checkpoint acumulativo y un solo commit.

## 3. Evidencia técnica

### 3.1 Espacios funcionales y aprovisionamiento simulados

**developer-service/Code.gs**
- Líneas 223–291: getCentralSpreadsheetConfigRegistry enumera hojas esperadas, pero solo lee RegistroSpreadsheets si puede abrir el Spreadsheet del servicio. Si no encuentra registros, acepta registeredSpreadsheets desde payload. No crea ni valida las hojas listadas.
- Líneas 6 y 235–238: SPREADSHEET_ID es el literal 1DEVELOPER-CONTROL-PLANE-SPREADSHEET-ID; el método intenta abrirlo y captura el error. El registro central no queda conectado con la configuración presente.
- Líneas 1638–1670: getRoleFunctionalSpaceConfig devuelve el primer registro o un localTables sintético TablasOperativas_<rol>. allowedMasterAccess es descriptivo; no instala protecciones ni restringe escrituras. singleSourceOfTruthVerified se calcula con una condición estática, no con permisos/datos reales.
- Líneas 1673–1745: auditRoleIndependenceAndMasterDataIntegrity determina aislamiento mirando esa etiqueta. Si no puede abrir el Spreadsheet, no registra hojas faltantes; isSuccess no incorpora missingMasterSheets; interRoleEventsEnabled se devuelve como true literal. El contador de duplicados puede ser incrementado desde payload.
- Líneas 1303–1348: provisionRoleSpreadsheet no crea archivos de Google Drive. Construye 1SP_<rol>_<timestamp>, arma un objeto y devuelve éxito. No copia plantilla, no aplica permisos, no escribe RegistroSpreadsheets ni persiste historial.
- Líneas 1286–1301: recordProvisioningHistory solo devuelve un objeto HIST-...; no escribe HistorialProvisionamiento.
- Líneas 27–33 y 166–168: ROLE_PERMISSIONS del Developer es una lista estática.

**Conclusión:** no se acredita que los roles tengan Spreadsheets reales, plantillas, permisos mínimos ni registro persistente. El método de auditoría puede informar éxito sin verificar recursos. Se incumplen los requisitos 2 y 5 y se reconfirman F8-Task19, F8-Task20 y F8-Task22.

### 3.2 Fuente maestra sin límites de escritura por servicio y atributos de identidad repetidos

- user-service/Code.gs línea 6 y academic-service/Code.gs línea 5 declaran el mismo Spreadsheet ID 1txfudU4TR4AhVtvFgGRT5Wtmwjl78hK4bfR4XbRwwww.
- user-service líneas 1619–1687 crea/consulta Personas; createPerson almacena nombres, apellidos, identificación, correo y teléfono. registerUser líneas 2393–2452 almacena nuevamente nombre, correo y teléfono en Usuarios. linkPersonAccount líneas 1690–1703 enlaza ambos registros por personaId, pero no define autoridad ni sincronización para esos atributos repetidos.
- academic-service líneas 2155–2385 ejecuta conversión de admisión y escribe ExpedientesEstudiantes, Matriculas y MovimientosEstudiante; también lee Usuarios y RelacionesFamiliares para vincular tutores (2268–2311).
- academic-service líneas 12800–12873 escribe Matriculas y CargosEstudiante directamente; no delega la escritura de matrícula al servicio propietario mediante contrato interservicio.
- El archivo compartido para USER y ACADEMIC no tiene un límite técnico de propiedad de tablas que impida a un servicio modificar datos que otro dominio considera propios.
- No se certifica el estado de datos productivos ni se afirma que existan duplicados físicos de matrícula/expediente: la evidencia acredita múltiples escritores y atributos de identidad repetidos sin política de sincronización.

**Conclusión:** no se demuestra una fuente de verdad gobernada por un único propietario de escritura para cada entidad maestra. CA-ARQ-101 no se aprueba y CA-ARQ-102 queda incumplido en la exigencia de evitar copias inconsistentes/escrituras fuera del servicio propietario.

### 3.3 Múltiples roles simultáneos no soportados de extremo a extremo

- user-service líneas 1065–1080 genera token con un único campo role: user.role; loginUser líneas 2510–2517 lo alimenta desde una sola celda row[6].
- getUserVerifiedRole líneas 1146–1162 devuelve claims.role singular. validateRolePermission líneas 1253–1279 evalúa permisos para un único rol.
- assignRoleScope líneas 9117–9181 identifica asignación por userId + scopeType (9149–9164), sin incluir roleId en la clave. Una segunda asignación del mismo usuario y tipo de ámbito sustituye la anterior.
- getInternalRoleAssignments líneas 9767–9803 puede leer múltiples filas, pero el upsert anterior no conserva dos roles para el mismo userId y scopeType.
- Existe catálogo editable de responsabilidades y ámbitos, pero ROLE_PERMISSIONS continúa codificado por rol y el token no agrega el conjunto de roles/asignaciones vigentes.

**Conclusión:** el requisito de múltiples roles y responsabilidades simultáneas no se cumple de forma consistente. La configuración organizacional requiere cambios de código en varios puntos de RBAC.

### 3.4 Solicitudes inter-rol no persistidas y eventos sin enrutamiento entre servicios

- user-service líneas 9443–9479 devuelve esquema de siete tablas de comunicaciones y transiciones permitidas, pero no crea ni consulta un Spreadsheet SP_ComunicacionesInstitucionales.
- createInstitutionalServiceRequest líneas 9481–9536 genera SOL-<timestamp> y devuelve un objeto. No inserta en Solicitudes ni ParticipantesSolicitud ni conserva historial. CacheService solo almacena idempotencia por 600 segundos.
- updateInstitutionalServiceRequestStatus líneas 9538–9575 valida transición usando currentState del caller (o Pendiente por defecto) y devuelve objeto. No lee el estado persistido, no actualiza solicitud ni escribe HistorialSolicitudes; actorRole/actorId se reciben en payload.
- registerAndDispatchEvent líneas 4618–4698 escribe BitacoraEventos y puede enviar notificación a BandejaNotificaciones. El evento se considera PROCESADO tras la notificación; no se enruta a un servicio destinatario ni hay consumidores/confirmación de procesamiento por el dominio destino.
- retryFailedEventsQueue líneas 4700–4745 reintenta el envío de notificaciones, no la ejecución de un handler de otro microservicio.
- createUserNotification líneas 5007–5032 sí persiste notificación local, pero no convierte la solicitud inter-rol en flujo persistente.
- academic-service convierte admisiones y registra evento estructurado local (línea 2376), pero no llama al dispatcher inter-rol ni publica evento dirigido a otro servicio.

**Conclusión:** existen piezas de notificación, bitácora y esquema, pero no el servicio durable solicitado por F8-Task21. CA-ARQ-102 NO CUMPLE.

## 4. Hallazgos

### AUD-NG-339 — Espacios funcionales y aprovisionamiento simulados; auditoría de aislamiento con falsos positivos
- Severidad/Prioridad: CRÍTICO/P0 para aprovisionamiento y verificación; ALTO/P1 para aislamiento.
- Evidencia: developer-service/Code.gs:223–291, 1286–1301, 1303–1348, 1638–1745.
- Descripción: registro no conectado por ID placeholder, fallback de registros desde payload, espacios sintéticos, permisos declarativos, IDs ficticios y ausencia de persistencia en RegistroSpreadsheets/HistorialProvisionamiento. La auditoría puede informar éxito sin inspección real.
- Impacto: usuarios pueden creer que trabajan en espacios separados/protegidos cuando no se han creado ni protegido archivos reales.
- Reconciliación: amplía F8-Task19, F8-Task20, F8-Task22 y F8-Task23.

### AUD-NG-340 — Escrituras cruzadas y atributos de identidad repetidos sin autoridad/sincronización
- Severidad/Prioridad: ALTO/P1.
- Evidencia: user-service/Code.gs:6, 1619–1703, 2393–2452; academic-service/Code.gs:5, 2155–2385, 12800–12873.
- Descripción: USER y ACADEMIC usan el mismo Spreadsheet, pero ambos escriben entidades relacionadas sin límites de propiedad. Academic escribe Usuarios/RelacionesFamiliares además de Expedientes/Matrículas; User crea Personas y Usuarios con atributos personales repetidos sin política explícita de sincronización.
- Impacto: datos de identidad pueden divergir entre Personas y Usuarios; cambios de esquema/permisos de un servicio pueden afectar entidades de otro dominio.
- Reconciliación: amplía F8-Task16 y F8-Task23 (CA-ARQ-101/102/115).

### AUD-NG-341 — Sesión y asignación de ámbitos no soportan múltiples roles simultáneos
- Severidad/Prioridad: ALTO/P1.
- Evidencia: user-service/Code.gs:1065–1080, 1146–1162, 1253–1279, 9117–9181, 9767–9803; loginUser:2510–2517.
- Descripción: token/RBAC usa un único role; assignRoleScope upserta por userId+scopeType e ignora roleId en la clave, sobrescribiendo asignaciones.
- Impacto: una persona con dos responsabilidades del mismo tipo no puede mantener ambos ámbitos en paralelo; la autorización no agrega responsabilidades vigentes.
- Reconciliación: amplía F8-Task16 y F8-Task19; se propone tarea específica para sesión/RBAC end-to-end.

### AUD-NG-342 — Solicitudes inter-rol no persistidas y eventos sin entrega a servicios destinatarios
- Severidad/Prioridad: CRÍTICO/P0 para solicitudes; ALTO/P1 para eventos.
- Evidencia: user-service/Code.gs:4618–4745, 9443–9575, 5007–5032; academic-service/Code.gs:2376.
- Descripción: crear/actualizar solicitudes solo produce objetos en memoria; transiciones no consultan ni persisten estado/historial. El dispatcher registra bitácora y notificaciones, pero no enruta eventos a otros servicios; los reintentos solo reenvían notificaciones.
- Impacto: solicitudes pueden desaparecer al terminar la ejecución; no hay trazabilidad persistente ni garantía de entrega/consumo por el dominio destinatario.
- Reconciliación: amplía F8-Task21 y F8-Task23 (CA-ARQ-111/112/115).

## 5. Matriz de aceptación

| Requisito | Dictamen | Evidencia |
|---|---|---|
| Catálogo de responsabilidades, permisos, ámbitos y herramientas | PARCIAL | Catálogo/ámbitos dinámicos; capacidades y ROLE_PERMISSIONS parcialmente hardcodeados |
| Espacio funcional real por rol sin duplicar maestros | NO CUMPLE | Configuración sintética; aprovisionamiento no crea archivos ni registra historial |
| Múltiples roles/responsabilidades simultáneas | NO CUMPLE | Token/RBAC singular; asignación por userId+scopeType sobrescribe |
| Comunicaciones inter-rol con IDs, solicitudes, notificaciones y eventos | NO CUMPLE | Notificación local sí; solicitud no persistida y evento sin enrutamiento |
| Configuración sin cambiar código | PARCIAL | Responsabilidades/ámbitos dinámicos; RBAC y sesión conservan dependencias estáticas |
| CA-ARQ-101 | NO CUMPLE | No hay propiedad única de escritura ni sincronización definida para entidades maestras |
| CA-ARQ-102 | NO CUMPLE | Solicitudes no persistidas y eventos no entregados a servicios destinatarios |

## 6. Tareas ejecutables derivadas de los hallazgos de la auditoría

Se revisaron completadas.md, el plan previo, el backlog solicitado y los informes F8. No se encontró TASK-679–TASK-682 en el blob de Pendientes.md. Conforme a la metodología, el registro oficial de estas tareas queda en este informe; no se modifica Pendientes.md. F8-Task19/20/21/22/23 aparecen como completadas, pero los hallazgos demuestran brechas; se amplían, no se consideran evidencia de cumplimiento.

### TASK-679 — Definir propiedad de escritura y fuente de verdad por entidad maestra
- Origen: AUD-NG-340; también AUD-NG-339.
- Severidad/Prioridad: ALTO/P1. Estado: Pendiente.
- Objetivo/acción: asignar propietario único de escritura por entidad (Persona, Usuario, Expediente, Matrícula, Historial); hacer que servicios consumidores consulten/modifiquen por contratos autenticados del servicio propietario; eliminar escrituras cruzadas en academic-service; definir autoridad/sincronización entre Personas y Usuarios; publicar vistas/proyecciones derivadas sin copias maestras.
- Archivos/módulos: backend/user-service/Code.gs; backend/academic-service/Code.gs; backend/developer-service/Code.gs; js/api.js.
- Dependencias: contratos API, IDs estables, permisos por servicio, estrategia de migración.
- Aceptación: cada entidad tiene un único escritor; llamadas cruzadas usan endpoint/contrato; no hay mutaciones directas fuera del propietario; atributos repetidos tienen política de autoridad/sincronización probada; vistas de solo lectura reconstruibles.
- Amplía: F8-Task16 y F8-Task23 (CA-ARQ-101/102/115).

### TASK-680 — Implementar aprovisionamiento real y verificable de espacios funcionales
- Origen: AUD-NG-339.
- Severidad/Prioridad: CRÍTICO/P0. Estado: Pendiente.
- Objetivo/acción: conectar registro central a Spreadsheet real configurado por Script Properties; crear/copiar plantillas en Drive; asignar permisos mínimos y protecciones; persistir RegistroSpreadsheets e HistorialProvisionamiento; hacer idempotente el proceso; rechazar IDs sintéticos y eliminar fallbacks que reporten éxito si no se creó/reabrió el recurso; validar acceso efectivo por rol.
- Archivos/módulos: backend/developer-service/Code.gs; backend/user-service/Code.gs; backend/academic-service/Code.gs.
- Dependencias: F8-Task19, F8-Task20, F8-Task22; configuración de Drive y propiedades.
- Aceptación: archivo existe y se abre por ID real; registro/historial persistidos; permisos de Drive/hojas comprobados; segunda ejecución no duplica; errores de creación/acceso producen FAIL, nunca PASS simulado.
- Amplía: F8-Task19/20/22.

### TASK-681 — Persistir solicitudes y entregar eventos interservicio con garantías
- Origen: AUD-NG-342.
- Severidad/Prioridad: CRÍTICO/P0. Estado: Pendiente.
- Objetivo/acción: provisionar SP_ComunicacionesInstitucionales; persistir solicitudes, participantes, conversaciones, mensajes e historial; validar estado real y permisos del actor desde claims; crear outbox/event store con destinatario, handler, correlationId e idempotencyKey; implementar consumidores por servicio, confirmaciones, DLQ/reintentos y auditoría de entrega; conectar ACADEMIC y otros servicios por contratos.
- Archivos/módulos: backend/user-service/Code.gs; backend/academic-service/Code.gs; backend/developer-service/Code.gs; js/api.js; js/ui-common.js.
- Dependencias: F8-Task21, F8-Task23; catálogo de servicios/contratos y permisos.
- Aceptación: solicitudes/transiciones sobreviven a nuevas ejecuciones; historial inmutable; autorización de servidor; evento recibido y confirmado por servicio destino; reintentos idempotentes sin duplicar notificaciones/mutaciones; fallos quedan en DLQ observable.
- Amplía: F8-Task21/23 (CA-ARQ-111/112/115).

### TASK-682 — Soportar múltiples roles simultáneos y ámbitos independientes por rol
- Origen: AUD-NG-341.
- Severidad/Prioridad: ALTO/P1. Estado: Pendiente.
- Objetivo/acción: modelar claims de sesión con roles/asignaciones vigentes; resolver permisos efectivos como unión restringida por ámbito/delegación; cambiar clave de upsert para incluir roleId+scopeType y preservar historial/vigencia; invalidar caché al cambiar roles/ámbitos; cubrir cambios de rol y revocación.
- Archivos/módulos: backend/user-service/Code.gs; backend/developer-service/Code.gs; js/api.js y dashboards por rol.
- Dependencias: catálogo de roles/responsabilidades, matriz de permisos, asignaciones de ámbito y auditoría.
- Aceptación: un usuario puede tener dos o más roles vigentes en una sesión; cada acción se autoriza con rol/ámbito correcto; asignar segundo rol no sobrescribe primero; revocar/expirar uno no elimina los demás; pruebas positivas/negativas de conflicto de permisos.
- Nueva tarea: no se encontró equivalente; no duplica F8-Task19 porque resuelve sesión/RBAC end-to-end.

## 7. Pruebas y límites

- Auditoría manual por funciones/bloques: developer-service 223–291, 1286–1301, 1303–1348, 1638–1745; user-service 1065–1080, 1146–1162, 1253–1279, 1619–1703, 2393–2452, 4618–4745, 9117–9181, 9443–9575, 9631–9803; academic-service 5–6, 84–140, 2155–2385, 12800–12873.
- Revisión de tareas completadas: F8-Task16–23, completadas.md 5144–5343.
- Informes F8-Task16–22 consultados: ausentes en las rutas individuales consultadas.
- No ejecutados: Apps Script runtime, Google Drive/Sheets productivos, despliegue, concurrencia, pruebas E2E ni integración real.
- No se modificó código ni datos productivos. No se afirma la existencia de duplicados físicos de matrícula/expediente.

## 8. Continuidad

- Última tarea auditada: F8-Task16 / TAREA-ARQ-01.
- Checkpoint inicial: C1.275. Checkpoint de cierre previsto: C1.276.
- Siguiente tarea: F8-Task17 — identificadores estables y columnas comunes de control, marcada [X] en completadas.md líneas 5170–5193.
- Próxima acción: comprobar si existe AUDITORIAS/AUDITORIA_COMPLETADAS_F8-TASK17.md; no existe en la ruta consultada. Auditar directamente developer/user/academic/task/exam/accounting services y validar IDs/columnas reales en tablas concretas, no solo el catálogo estático.
