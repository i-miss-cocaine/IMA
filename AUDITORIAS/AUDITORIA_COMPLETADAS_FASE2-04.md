AUDITORÍA DE TAREAS COMPLETADAS - FASE2-04
FECHA: 2026-11-05
REPOSITORIO: i-miss-cocaine/IMA
RAMA: NG_beta_0.0.0.1_work
HEAD DE PARTIDA: f22612474e721ce34a716fce2329717654d70d30
ARCHIVO PRINCIPAL: backend/accounting-service/Code.gs
SHA: 38b979d41596b85e888b4a7060b37bbac0840a28
================================================================
DICTAMEN: CUMPLE PARCIALMENTE, CON BRECHAS CRÍTICAS.

La entrada de completadas.md solo conserva título, origen, severidad y archivo involucrado. El informe original AUDITORIA_FASE2_ARQUITECTURA_INTEROPERABILIDAD.md no está en la rama. El alcance se reconstruyó mediante el título FASE2-04 y se contrastó con FASE2-T05 y tareas posteriores.

1. IDENTIFICADORES Y ESQUEMA
- generateSchoolDocument (15040-15149) genera docId con DOC-EM- + año + Date.now() (15083), sin UUID ni comprobación persistente de unicidad.
- No se encontró Utilities.getUuid ni integración del generador institucional en la emisión documental de Accounting.
- targetId se toma del payload y cae a GENERICO; solicitanteUserId también se toma del payload y, si falta, se iguala a targetId. No se valida la entidad objetivo ni se deriva el actor desde _verifiedUserId.
- getOrCreateSheet (115-160) declara ocho encabezados para DocumentosEscolaresEmitidos, pero generateSchoolDocument agrega quince campos (15114-15130) y verifySchoolDocumentByCUV consume índices hasta 14. Los campos adicionales quedan sin encabezados al crear la hoja.
- El correlativo usa el máximo de r[12] de todas las filas (15072-15082), sin filtrar el año actual.

2. GENERACIÓN CUV
- El CUV se genera como CUV-YYYY-###### con Math.random() (15090-15100), verificando candidatos existentes bajo LockService.
- Tras 100 intentos, el fallback genera CUV-YYYY-Date.now() (15102-15104) sin volver a comprobar unicidad.
- Este fallback y la ausencia de prueba conductual están registrados en AUD-NG-161; no se duplica.

3. VERIFICACIÓN PÚBLICA
- PUBLIC_ACTIONS incluye verifySchoolDocumentByCUV (218); validateRolePermission autoriza la acción antes de validar token.
- El handler (15151-15235) devuelve documentoId, plantillaId, targetEntityId, solicitanteUserId, datosJSON, estadoDoc, CUV, driveFileId, driveUrl, fecha, observaciones, versión, correlativo y hash.
- Cuando hay firmas, certificadoAuditoria agrega firmanteId, tokenVerificacion, IP y signatureHash.
- Devuelve success para cualquier fila encontrada sin validar que estadoDoc sea vigente ni distinguir revocado/anulado/sustituido.
- TASK-351 ya cubre minimización pública, estados y verificación CUV; se amplía con evidencia concreta.

4. INTEGRIDAD Y RECONCILIACIÓN
- generateSchoolDocument calcula SHA-256 sobre una cadena de metadatos, no bytes de un PDF definitivo; el driveFileId se construye como DRV- + docId. verifySchoolDocumentByCUV devuelve el hash guardado sin recalcularlo. AUD-NG-059 ya cubre esta brecha.
- AUD-NG-061 ya cubre certificado probatorio no persistido y estados de firma.
- FASE2-T05 figura completada, pero generateInstitutionalId sigue duplicada en user-service (1706-1740) y academic-service (2100-2160). Academic permite skipLock desde payload; Accounting no integra el generador para docId.
- TASK-118 se amplía con ID temporal, esquema, actor/titular y correlativo anual. AUD-NG-161 mantiene pruebas de colisiones/fallback/concurrencia. No se crean nuevos AUD-NG.

5. CALIDAD Y PRUEBAS
- El lock se libera en finally, pero no existe idempotencia propia de la solicitud.
- La persistencia no coincide con el esquema declarado; la respuesta pública no minimiza campos ni comprueba vigencia.
- Inspección estática/manual. No se ejecutaron HTTP, Apps Script, pruebas de concurrencia ni operaciones productivas sobre Drive/Sheets.
- No se modificó código fuente, completadas.md, completadas_legacy.md, ChangesLogs.txt ni METODOLOGIA_DESARROLLO.md.

CONCLUSIÓN:
FASE2-04 solo cumple parcialmente. Existe emisión con correlativo, CUV y bloqueo parcial, pero no un sistema unificado UUID; la hoja tiene esquema desalineado; el correlativo no segmenta año; el fallback CUV no valida unicidad; y la consulta pública expone datos internos sin comprobar vigencia. Los trabajos correctivos quedan vinculados a TASK-118, TASK-351, AUD-NG-059, AUD-NG-061 y AUD-NG-161.
================================================================
FIN DEL INFORME

## Tareas ejecutables derivadas de los hallazgos

### [TASK-118] Unificar generación de identificadores y validar relaciones institucionales
- **Hallazgo de origen:** FASE2-04, apartados 1 y 4; ampliación de TASK-118.
- **Severidad:** Crítico.
- **Objetivo:** garantizar unicidad, consistencia de esquema y referencias válidas al emitir documentos institucionales.
- **Acción ejecutable:** sustituir el ID temporal DOC-EM por el generador institucional; validar actor y entidad objetivo desde identidad autenticada; alinear los 15 campos escritos/leídos con los encabezados reales; filtrar correlativos por año; eliminar fallbacks que no vuelvan a comprobar unicidad; exigir idempotencia de solicitud.
- **Archivos/módulos afectados:** backend/accounting-service/Code.gs; integración con generadores USER/ACADEMIC.
- **Dependencias y riesgos:** TASK-118 se coordina con AUD-NG-161 y las referencias de seguridad; no duplicar el generador transversal.
- **Alcance:** emisión documental, identidad, correlativo y esquema de persistencia.
- **Criterios de aceptación:** encabezados y DTO coinciden exactamente; actor/titular se derivan y validan; IDs/correlativos son únicos bajo concurrencia y segmentados por año; repetición de la misma solicitud no duplica documentos.
- **Prioridad:** P0.
- **Estado:** Pendiente.
- **Evidencia de cierre:** pruebas de concurrencia/idempotencia y verificación de esquema.

### [AUD-NG-059] Vincular SHA-256 a los bytes del documento definitivo
- **Hallazgo de origen:** AUD-NG-059; apartado 4.
- **Severidad:** Crítico.
- **Objetivo:** que la huella pruebe integridad del archivo PDF real, no de metadatos.
- **Acción ejecutable:** crear y conservar el PDF definitivo; calcular SHA-256 sobre sus bytes; recuperar el archivo al verificar el CUV y comparar su hash actual con el hash firmado.
- **Archivos/módulos afectados:** backend/accounting-service/Code.gs; DocumentosEscolaresEmitidos; almacenamiento Drive.
- **Dependencias y riesgos:** generación PDF y ciclo de vida de documentos; preservar versiones históricas.
- **Alcance:** hash binario y verificación de alteraciones.
- **Criterios de aceptación:** PDF persistido con identificador real; hash de 64 caracteres calculado desde bytes; una alteración, sustitución o ausencia del archivo invalida la verificación.
- **Prioridad:** P0.
- **Estado:** Pendiente.
- **Evidencia de cierre:** pruebas con documento original, modificado, sustituido y ausente.

### [AUD-NG-061] Persistir el certificado probatorio y validar el estado real de la firma
- **Hallazgo de origen:** AUD-NG-061; apartado 4.
- **Severidad:** Crítico.
- **Objetivo:** impedir que procesos pendientes/cancelados se presenten como completados y conservar un certificado verificable.
- **Acción ejecutable:** generar el certificado al completar el flujo de firma; almacenarlo como artefacto independiente e inmutable; ordenar y validar la secuencia de firmantes; clasificar estados terminales de forma explícita y calcular integridad sobre el archivo conservado.
- **Archivos/módulos afectados:** backend/user-service/Code.gs, backend/accounting-service/Code.gs; FirmasConformidades y almacenamiento documental.
- **Dependencias y riesgos:** AUD-NG-059 para integridad binaria; estados de workflow.
- **Alcance:** certificado, transición final y prueba de firma.
- **Criterios de aceptación:** solo un flujo realmente completado emite certificado; pendiente/cancelado/rechazado/vencido no se etiqueta como éxito; certificado persistido con hash verificable y orden de firmas comprobado.
- **Prioridad:** P0.
- **Estado:** Pendiente.
- **Evidencia de cierre:** pruebas de cada estado y verificación posterior del certificado.

### [TASK-351] Minimizar y proteger la verificación pública CUV
- **Hallazgo de origen:** FASE2-04, apartado 3; ampliación de TASK-351.
- **Severidad:** Alto.
- **Objetivo:** evitar exposición pública de datos internos/personales y estados no vigentes.
- **Acción ejecutable:** limitar la respuesta pública a los campos mínimos de autenticidad; retirar datosJSON, IDs internos, enlaces privados, observaciones y datos de firmantes/tokens/IP; validar estadoDoc y estado de firma antes de responder.
- **Archivos/módulos afectados:** backend/accounting-service/Code.gs; verifySchoolDocumentByCUV y PUBLIC_ACTIONS.
- **Dependencias y riesgos:** AUD-NG-059/AUD-NG-061; conservar una ruta privada autenticada para detalles internos.
- **Alcance:** respuesta pública de consulta CUV.
- **Criterios de aceptación:** respuestas públicas no contienen PII, datosJSON, tokens, IP ni identificadores internos; documentos anulados/revocados/sustituidos no se muestran como vigentes; pruebas por rol y estado.
- **Prioridad:** P1.
- **Estado:** Pendiente.
- **Evidencia de cierre:** pruebas de minimización y matriz de estados.

### [AUD-NG-161] Sustituir pruebas nominales por pruebas conductuales de concurrencia e integridad
- **Hallazgo de origen:** FASE2-04, apartado 4; referencia ampliada, sin duplicar su objetivo.
- **Severidad:** Alto.
- **Objetivo:** demostrar unicidad, idempotencia y recuperación con escenarios reales y aislados.
- **Acción ejecutable:** añadir pruebas de colisión CUV/ID, dos solicitudes concurrentes, pérdida de respuesta, reintento con la misma clave, fallo parcial y verificación binaria.
- **Archivos/módulos afectados:** tests/regression y suites de Accounting/Academic.
- **Dependencias y riesgos:** TASK-118, AUD-NG-059, AUD-NG-061.
- **Alcance:** pruebas automatizadas aisladas; no operar sobre datos productivos.
- **Criterios de aceptación:** pruebas fallan ante duplicados/estados incorrectos; ejecutan operaciones reales de prueba y verifican persistencia/rollback; no asignan PASS por conteo o presencia de símbolos.
- **Prioridad:** P1.
- **Estado:** Pendiente.
- **Evidencia de cierre:** resultados reproducibles de la suite aislada.
