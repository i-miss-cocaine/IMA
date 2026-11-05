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
