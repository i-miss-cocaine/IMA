# Backlog consolidado — Secretaria

**Estado operativo del Plan Maestro (reinicio global):** todas las tareas de este backlog quedan en estado `Pendiente` al inicio de la ejecución. Ninguna tarea se considera `Completada`; marcas, etiquetas o declaraciones históricas de cierre son únicamente antecedentes y no acreditan estado vigente. Una tarea solo podrá cambiar de estado tras su implementación y verificación conforme al Plan Maestro.

**Fuentes integradas:** informes de auditoría de `AUDITORIAS/`, `Pendientes.md`, `completadas.md` y los archivos departamentales preexistentes. Los registros con el mismo identificador se reúnen en una sola tarea.

**Integridad:** se conservan los requisitos originales sin resumen ni paráfrasis. Se eliminan líneas exactamente repetidas tras normalizar espacios/capitalización. Los títulos alternativos se conservan como referencia. Las fuentes originales se mantienen sin alteración para trazabilidad.

---

<!-- ID: F10-TASK01 | Fuentes: Pendientes.md ; pendientes/Secretaria/Pendientes.md -->
### [ ] [F10-TASK01] Fortalecer la confidencialidad y el control de acceso a expedientes sensibles
- **Origen del Hallazgo:** `AUDITORIA_FASE_10_ASISTENCIA_DISCIPLINA_CONVIVENCIA.md` / Tarea F10-Task01 (P0) y Tarea 10.7
- **Prioridad:** P0
- **Severidad/Clasificación:** Crítica (Privacidad, confidencialidad y protección de datos sensibles)
- **Archivos Involucrados:**
  - `backend/academic-service/Code.gs`
  - `backend/user-service/Code.gs`
  - `backend/exam-service/Code.gs`
- **Dependencias Expuestas:** Expediente del estudiante, casos de seguimiento y permisos por rol
- **Descripción del Alcance:**
  Garantizar el aislamiento estricto de las notas confidenciales y expedientes de consejería/orientación respecto a docentes generales y personal no autorizado.
  Requisitos Funcionales:
  1. Establecer permisos diferenciados para consultar, crear, modificar, revisar, aprobar, cerrar, reabrir, exportar, eliminar y consultar evidencias.
  2. Verificar que las notas de seguimiento de consejería sólo sean accesibles para los roles autorizados (`Consejeros`, `Orientación`, `Dirección`).
  3. Bloquear consultas directas a la hoja `CasosSeguimiento` por identificadores manipulados.
  4. Anonimizar o filtrar observaciones confidenciales en reportes generales de asistencia o expediente.
  5. Si existen disputas o requerimientos contradictorios entre el nivel de visibilidad institucional y la confidencialidad del profesional, implementar parámetros de visibilidad configurables en la plataforma (`ConfiguracionAcademica`) para definir el nivel de restricción por departamento.
- **Criterios de Aceptación:**
  - Un docente no puede consultar notas confidenciales de consejería de un alumno.
  - Las consultas no autorizadas registran eventos `UNAUTHORIZED_ACCESS_ATTEMPT`.
  - Las configuraciones de visibilidad disputadas son parametrizables desde la plataforma.
- **Estado:** Pendiente

---

<!-- ID: F11-TASK01 | Fuentes: AUDITORIAS/AUDITORIA-FASE-11-COMUNICACION-BIENESTAR-SUPERVISION-FINANZAS.md ; Pendientes.md ; pendientes/Secretaria/Pendientes.md -->
### [ ] [F11-TASK01] Garantizar el aislamiento y la confidencialidad de los expedientes de bienestar

**Otros títulos originales:**
- Fortalecer la seguridad, privacidad y aislamiento de expedientes de bienestar estudiantil
- **Hallazgo de origen:** sección 2.C.3 (seguridad/confidencialidad de observaciones de Consejería y Orientación) y sección 5.8-9 (riesgo P0 de privacidad).
- **Severidad:** Crítica. **Objetivo:** impedir que docentes generales u otros roles no autorizados accedan a notas, expedientes y seguimientos de bienestar.
- **Acción ejecutable:** verificar y completar controles de autorización por rol, alcance y relación institucional en cada lectura/escritura; aislar observaciones confidenciales; registrar intentos no autorizados y probar accesos positivos y negativos.
- **Archivos/módulos:** `backend/academic-service/Code.gs`, `CasosSeguimiento`, `RegistrosOrientacion`, endpoints y vistas consumidoras.
- **Dependencias/riesgos:** modelo de roles y permisos, identidad autenticada y auditoría de accesos; exposición de datos sensibles si una ruta omite el control.
- **Alcance:** expedientes y observaciones de bienestar/orientación; no ampliar permisos generales por conveniencia.
- **Criterios de aceptación:** roles no autorizados no pueden consultar ni modificar datos confidenciales por ninguna ruta; los accesos autorizados conservan la funcionalidad; cada rechazo queda trazado sin revelar el contenido protegido.
- **Prioridad:** P0. **Estado:** Pendiente (estado original del backlog).
- **Evidencia de cierre:** pendiente. **Discrepancia:** sección 2.C.3 declara seguridad completa y verificada y la vincula con F10-Task01, mientras la conclusión consolidada mantiene el riesgo P0. Se requiere reconciliar la evidencia antes de cambiar el estado.
- **Origen del Hallazgo:** `AUDITORIA-FASE-11-COMUNICACION-BIENESTAR-SUPERVISION-FINANZAS.md` / Área II (P0)
- **Prioridad:** P0
- **Severidad/Clasificación:** Crítica (Privacidad y protección de datos sensibles de menores)
- **Archivos Involucrados:**
  - `backend/academic-service/Code.gs`
  - `backend/user-service/Code.gs`
- **Dependencias Expuestas:** CasosSeguimiento, RegistrosOrientacion, AsignacionesAmbitosRoles
- **Descripción del Alcance:**
  Garantizar el aislamiento estricto de notas confidenciales de orientación y casos de bienestar respecto a docentes generales, bloqueando accesos por identificador manipulado y registrando auditoría `UNAUTHORIZED_ACCESS_ATTEMPT`.
- **Criterios de Aceptación:**
  - Un docente sin rol autorizado no puede consultar notas privadas de orientación de un estudiante.
- **Estado:** Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 83-98; clave F11-Task03; asignación única: Secretaria -->

---

<!-- ID: F19-TASK02 | Fuentes: AUDITORIAS/AUDITORIA_FASE_19_INVENTARIO_ACTIVOS_MANTENIMIENTO.md -->
### [ ] [F19-TASK02] Implementar devolución y recepción formal de activos bajo custodia
- **Hallazgo de origen:** secciones B, C.2.6, D, E/F19-06 y registro posterior TASK-020.
- **Severidad:** Crítica. **Objetivo:** cerrar correctamente la custodia y liberar o enviar a mantenimiento el activo devuelto.
- **Acción ejecutable:** implementar `returnAssetCustody` con bloqueo transaccional; exigir asignación activa; registrar fecha, custodio, receptor, condición física y acta; si el activo está dañado/incompleto, cambiarlo a mantenimiento y crear orden; si está conforme, limpiar custodio y dejarlo disponible; impedir nuevas asignaciones si el activo no está disponible.
- **Archivos/módulos:** `backend/accounting-service/Code.gs`, `assignAssetCustody`, `getAssetAssignments`, `manageAssetItem`, `manageMaintenanceOrder`, `ROLE_PERMISSIONS`, `doPost`, `js/accounting.js`, hojas `ActivosPatrimoniales`, `AsignacionesActivos`, `MantenimientoOrdenes`.
- **Dependencias/riesgos:** estado operativo del activo, actas, mantenimiento y permisos; riesgo de doble custodia, reasignación de activos dañados o pérdida del historial de entrega.
- **Alcance:** devolución, inspección y liberación; no eliminar actas ni permitir devolución de una asignación ya cerrada.
- **Criterios de aceptación:** solo asignaciones activas pueden devolverse; cierre registra fecha/receptor/condición/acta; activo conforme pasa a available; activo dañado pasa a maintenance con orden; asignación de activos no disponibles es rechazada; operación idempotente.
- **Prioridad:** P0. **Estado:** Pendiente.
- **Reconciliación:** TASK-020/F19-Task02 registra el diagnóstico y el plan, pero no se encontró un resultado posterior que demuestre la implementación. No se marca completada por la sola existencia del plan.
- **Evidencia de cierre:** pendiente; falta evidencia de endpoint, UI, permisos y pruebas de devolución.

---

<!-- ID: F19-TASK16 | Fuentes: AUDITORIAS/AUDITORIA_FASE_19_INVENTARIO_ACTIVOS_MANTENIMIENTO.md -->
### [ ] [F19-TASK16] Hacer idempotente el registro de bajas patrimoniales
- **Hallazgo de origen:** AUD-NG-142, REQ-EXP-015, evidencia sobre `registerAssetDisposal`.
- **Severidad:** Crítica. **Objetivo:** impedir que reintentos o solicitudes repetidas generen múltiples bajas del mismo activo.
- **Acción ejecutable:** exigir estado patrimonial elegible; usar clave/id de disposición única y lock; registrar una sola acta y transición de estado; reintentos deben devolver la baja existente sin repetir efectos.
- **Archivos/módulos:** `backend/accounting-service/Code.gs`, `registerAssetDisposal`, `getAssetDisposals`, `ActivosPatrimoniales`, `BajasBienes`.
- **Dependencias/riesgos:** custodia, mantenimiento, contabilidad y actas; riesgo de doble baja o registros patrimoniales inconsistentes.
- **Alcance:** baja lógica y expediente; no eliminar activo ni su historial.
- **Criterios de aceptación:** una disposición por activo/evento; duplicados bloqueados; estado y acta se actualizan atómicamente; auditoría registra actor, motivo y fecha; historial consultable.
- **Prioridad:** P0 (asignada por severidad crítica de AUD-NG-142). **Estado:** Pendiente. **Tipo:** nueva tarea derivada de hallazgo posterior.
- **Evidencia de cierre:** pendiente; AUD-NG-142 documenta que la función no es idempotente.

---

<!-- ID: F22-TASK03 | Fuentes: AUDITORIAS/AUDITORIA_FASE_22_GESTION_DOCUMENTAL_FORMULARIOS_FIRMA_ELECTRONICA.md -->
### [ ] [F22-TASK03] Persistir un certificado probatorio inmutable al completar válidamente cada proceso de firma
- **Hallazgo de origen:** secciones B, C.7, D/F22-19, G.3 y H P0; ampliación AUD-NG-061.
- **Severidad:** Crítica. **Objetivo:** conservar un expediente probatorio descargable y verificable de cada documento firmado.
- **Acción ejecutable:** generar certificado final como artefacto independiente (PDF/JSON firmado según diseño), persistirlo en Drive con ID/version/hash y vincularlo al CUV; incluir documento y versión, firmantes ordenados, roles verificados, correos, timestamps, IP obtenida de fuente confiable, tokens y hash del documento; generar solo cuando todos los pasos requeridos estén completados y válidos.
- **Archivos/módulos:** `backend/user-service/Code.gs`, `generateSignatureAuditCertificate`, `registerDocumentSignature`, `checkAdvancedSignatureStatus`, `backend/accounting-service/Code.gs`, `verifySchoolDocumentByCUV`, `FirmasConformidades`, `DocumentosEscolaresEmitidos`.
- **Dependencias/riesgos:** F22-Task02, F22-Task04, flujo de múltiples firmantes y estados de trámite; riesgo de declarar completado un trámite pendiente/cancelado o no conservar evidencia.
- **Alcance:** certificado final y pista probatoria; no tratar un objeto JavaScript devuelto en memoria como certificado persistido.
- **Criterios de aceptación:** certificado almacenado e inmutable; se genera una sola vez al completar todos los firmantes; estados Pendiente/Cancelada/Vencida/Rechazada nunca se etiquetan como exitosos; orden y firmas se validan; CUV permite recuperar certificado y verificar hashes; correcciones generan nueva evidencia versionada.
- **Prioridad:** P0. **Estado:** Pendiente.
- **Reconciliación:** TASK-040/F22-Task03 registró generador y 227/227 pruebas, pero AUD-NG-061 encuentra certificado solo en memoria, sin persistencia ni disparador automático, y clasifica cualquier estado distinto de Rechazado como CompletadoConExito. Coordinar con TASK-351/AUD-NG-061 para la verificación CUV sin duplicar.
- **Evidencia de cierre:** pendiente; no existe evidencia de certificado independiente persistido y emitido tras finalización válida.

---

<!-- ID: F22-TASK04 | Fuentes: AUDITORIAS/AUDITORIA_FASE_22_GESTION_DOCUMENTAL_FORMULARIOS_FIRMA_ELECTRONICA.md -->
### [ ] [F22-TASK04] Integrar firma electrónica avanzada con PSC real y proteger credenciales
- **Hallazgo de origen:** secciones A.1.6, B, C.7, D/F22-16/F22-38, G.3 y H P0; ampliaciones AUD-NG-062 y AUD-NG-063.
- **Severidad:** Crítica. **Objetivo:** distinguir conformidad simple de firma avanzada verificable bajo el marco legal hondureño.
- **Acción ejecutable:** diseñar adaptador desacoplado para PSC acreditado; enviar solicitud real autenticada con documento/hash; validar callback por firma del proveedor, token/nonce, certificado X.509, cadena de confianza, sello de tiempo y hash recuperado del PDF; almacenar secretos en gestor de secretos/PropertiesService protegido, nunca en texto claro en hojas.
- **Archivos/módulos:** `backend/user-service/Code.gs`, `configureAdvancedSignatureProvider`, `getAdvancedSignatureProviderConfig`, `createAdvancedSignatureRequest`, `checkAdvancedSignatureStatus`, `ConfiguracionFirmaAvanzada`, `TransaccionesFirmaAvanzada`, `ROLE_PERMISSIONS`, `doPost`.
- **Dependencias/riesgos:** proveedor PSC acreditado, credenciales, PKI, certificados, callback y F22-Task02/03; riesgo crítico de aceptar estados falsos o exponer API keys.
- **Alcance:** integración real y verificación criptográfica; no afirmar firma avanzada por un estado local ni usar proveedor predeterminado simulado como prueba.
- **Criterios de aceptación:** comunicación real con endpoint PSC; callback autenticado y anti-replay; certificado y cadena validados; hash corresponde al PDF final; estado no puede cambiarse por payload libre; secretos cifrados/gestionados fuera de hojas; auditoría completa de transacción.
- **Prioridad:** P0. **Estado:** Pendiente.
- **Reconciliación:** TASK-041/F22-Task04 registró funciones de configuración/solicitud/estado y 227/227 pruebas, pero AUD-NG-062 demuestra que no hay llamada HTTP ni validación criptográfica del proveedor y que el payload puede fijar Completada; AUD-NG-063 detecta apiKey en texto claro en `ConfiguracionFirmaAvanzada`. La marca [ ] del inventario contradice el estado interno pendiente.
- **Evidencia de cierre:** pendiente; no se ha demostrado conexión con PSC ni custodia segura de credenciales.

---

<!-- ID: F30-TASK01 | Fuentes: AUDITORIAS/AUDITORIA_FASE_30_CONSOLIDACION_CERTIFICACION_MEJORA_CONTINUA.md -->
### [ ] [F30-TASK01] Implementar orquestador de transacciones interdepartamentales y compensación automática
- **Hallazgo de origen:** F30-01; brecha de saga/compensación entre Admisión, Matrícula y Cobranza.
- **Severidad:** Crítica / P0. **Objetivo:** evitar estados parciales cuando un proceso distribuido falla después de crear registros en uno o varios servicios.
- **Acción ejecutable:** definir saga con pasos, estado durable, clave idempotente, orden de ejecución, compensaciones y política de reintentos; cubrir conversión de admisión, matrícula, cargo inicial, biblioteca y transporte; exponer estado y causa de fallo.
- **Archivos/módulos:** servicios Academic/User/Accounting y módulos de admisión, matrícula, cargos, biblioteca y transporte; `AuditoriaMigraciones` o bitácora transaccional.
- **Dependencias/riesgos:** AUD-NG-006 (idempotencia), AUD-NG-129 (matrícula), AUD-NG-133 (pagos), AUD-NG-161 (pruebas conductuales); riesgo de compensar una operación financiera ya confirmada o de duplicar efectos.
- **Alcance:** orquestación y compensación explícita; no simular atomicidad distribuida con varios appendRow ni borrar asientos confirmados.
- **Criterios de aceptación:** estado durable por paso; idempotencia por operación; compensación definida para cada efecto; reanudación segura; intervención manual para efectos no compensables; pruebas de fallo en cada etapa y conciliación final de expedientes/cargos/asientos.
- **Prioridad:** P0. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; F30-01 indica que la matrícula puede quedar creada sin cargo financiero y que biblioteca/transporte no se reflejan siempre en cuenta consolidada.

---

<!-- ID: F31-TASK02 | Fuentes: AUDITORIAS/AUDITORIA_FASE_31_DISENADOR_UNIVERSAL_DOCUMENTOS_PLANTILLAS.md -->
### [ ] [F31-TASK02] Crear diseñador visual de formularios digitales y constructor de campos
- **Hallazgo de origen:** F31-04; matriz B y plan G.2.
- **Severidad:** Crítica / P0. **Objetivo:** permitir crear formularios vinculados a plantillas sin editar manualmente JSON ni código.
- **Acción ejecutable:** implementar constructor drag-and-drop para texto, números, fechas, catálogos, adjuntos y firmas; definir tipo, etiqueta, obligatoriedad, validaciones, orden, visibilidad, ámbito y enlace a variable/plantilla; guardar esquemas versionados.
- **Archivos/módulos:** `backend/user-service/Code.gs`, `FormulariosInstitucionales`, `SolicitudesTramites`, UI administrativa y renderizador de documentos.
- **Dependencias/riesgos:** F26-Task03 (motor de campos dinámicos), F33 (trámites/formularios), F31-Task06; riesgo de XSS, esquemas incompatibles y respuestas sin versión.
- **Alcance:** definición visual y asociación de formularios; no ejecutar scripts arbitrarios ni aceptar validaciones confiadas únicamente al cliente.
- **Criterios de aceptación:** campos permitidos y tipados; esquema versionado; validación server-side; previsualización; compatibilidad de respuestas históricas; permisos por rol/ámbito; pruebas de XSS, tipos, obligatoriedad, migración de esquema y acceso cruzado.
- **Prioridad:** P0. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; existe `definicionJSON`, pero el informe identifica ausencia de constructor visual.

---

<!-- ID: F33-TASK01 | Fuentes: AUDITORIAS/AUDITORIA_FASE_33_FORMULARIOS_INSTITUCIONALES_TRAMITES_DIGITALES.md -->
### [ ] [F33-TASK01] Implementar modalidades de trámite en línea, descarga e impresión física
- **Hallazgo de origen:** Fase 33-01 y 33-03; catálogo JSON sin contrato rígido de modalidades y falta de formularios imprimibles limpios.
- **Severidad:** Crítica / P0. **Objetivo:** permitir que cada trámite defina claramente entrega digital, descarga en blanco o presentación física.
- **Acción ejecutable:** ampliar el catálogo de trámites con modalidad permitida, fechas de apertura/cierre, requisitos y versión; generar PDF en blanco con guías/casillas para escritura manual; registrar recepción física escaneada y asociarla al expediente/solicitud.
- **Archivos/módulos:** `backend/user-service/Code.gs`, `FormulariosInstitucionales`, `SolicitudesTramites`, `backend/accounting-service/Code.gs`, `generateSchoolDocument` y plantillas PDF.
- **Dependencias/riesgos:** F31-Task01/02/07, F32-Task01 y F29-Task15; riesgo de imprimir una versión obsoleta o perder vínculo entre el documento físico y la solicitud digital.
- **Alcance:** modalidades y recepción física; no duplicar el motor de formularios ni permitir recepción sin identidad/folio.
- **Criterios de aceptación:** modalidad declarativa validada en backend; fechas y vigencia aplicadas; PDF vacío conserva formato y campos; folio/QR de recepción; digitalización vinculada a solicitud y expediente; pruebas de modalidad, vencimiento, recepción y duplicados.
- **Prioridad:** P0. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; la auditoría identifica modalidad física/descarga como configuración libre y ausencia de PDF imprimible limpio.

---

<!-- ID: F33-TASK03 | Fuentes: AUDITORIAS/AUDITORIA_FASE_33_FORMULARIOS_INSTITUCIONALES_TRAMITES_DIGITALES.md -->
### [ ] [F33-TASK03] Implementar subsanación granular y congelamiento de campos aprobados
- **Hallazgo de origen:** Fase 33-10 y riesgo G.2.
- **Severidad:** Crítica / P0. **Objetivo:** permitir corregir únicamente los campos observados sin alterar datos previamente validados.
- **Acción ejecutable:** ampliar `processWorkflowDecision` y el flujo `SOLICITAR_CORRECCION` para registrar campos/secciones observados, abrir solo esos controles, congelar los demás y guardar cada versión con diff, actor y motivo.
- **Archivos/módulos:** `backend/user-service/Code.gs`, `processWorkflowDecision`, `RevisionesDecisionesTramite`, `SolicitudesTramites`, UI del solicitante.
- **Dependencias/riesgos:** F31-Task13 (comentarios/revisión), F22/F34 (gestión documental y bandejas), AUD-NG-024 (identidad del revisor); riesgo de modificar datos aprobados o perder historial.
- **Alcance:** reapertura limitada de campos; no reabrir el expediente completo ni borrar la versión enviada.
- **Criterios de aceptación:** observaciones vinculadas a campo/sección; controles aprobados de solo lectura; nueva versión conserva anterior; actor/revisor verificados; comparación antes/después; pruebas de modificación permitida/no permitida, adjuntos y múltiples rondas de subsanación.
- **Prioridad:** P0. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; el sistema puede solicitar corrección, pero la auditoría señala que reabre el trámite sin congelamiento granular.

---

<!-- ID: F34-TASK01 | Fuentes: AUDITORIAS/AUDITORIA_FASE_34_BANDEJAS_REVISION_FIRMAS.md -->
### [ ] [F34-TASK01] Unificar ciclo de vida de justificaciones y sincronización con asistencia
- **Hallazgo de origen:** F34-12, F34-07 y PT-F34-04; dualidad entre user-service y academic-service.
- **Severidad:** Crítica / P0. **Objetivo:** garantizar que toda justificación aprobada actualice el registro oficial de asistencia sin importar el canal de presentación.
- **Acción ejecutable:** unificar el flujo de presentación/revisión o crear una operación interservicio canónica; al aprobar, actualizar `RegistrosAsistencia` con `Justificada=true`, conservar la justificación y el evento de decisión; hacer la operación idempotente y reconciliable.
- **Archivos/módulos:** `backend/user-service/Code.gs` (`submitStudentAbsenceJustification`, `reviewAbsenceJustification`); `backend/academic-service/Code.gs` (`submitAttendanceJustification`, `reviewAttendanceJustification`); `SolicitudesTramites`, `JustificacionesAsistencia`, `RegistrosAsistencia`.
- **Dependencias/riesgos:** F33-Task01/03, AUD-NG-006 (idempotencia), AUD-NG-158 (contexto/ámbito); riesgo de doble aprobación, actualización parcial o marcar justificada una sesión incorrecta.
- **Alcance:** una fuente de verdad y sincronización de estado; no mantener dos flujos que puedan divergir ni sobrescribir correcciones históricas.
- **Criterios de aceptación:** una justificación tiene ID estable y vínculo a alumno/sesión/periodo; aprobación en cualquier interfaz actualiza asistencia; operación idempotente; rechazo/revocación conserva historial; errores generan estado reconciliable; pruebas de ambos canales, duplicados, periodos y concurrencia.
- **Prioridad:** P0. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; PT-F34-04 falla cuando la excusa se tramita desde user-service porque no actualiza `RegistrosAsistencia`.

---

<!-- ID: F35-TASK01 | Fuentes: AUDITORIAS/AUDITORIA_FASE_35_IMPORTADOR_INTELIGENTE.md -->
### [ ] [F35-TASK01] Implementar reconocimiento semántico de encabezados y mapeo interactivo
- **Hallazgo de origen:** F35-03/F35-04; CAR-F35-03/CAR-F35-04.
- **Severidad:** Crítica / P0. **Objetivo:** permitir correspondencias automáticas y manuales entre columnas de origen y campos destino sin depender de la posición de la primera columna.
- **Acción ejecutable:** crear diccionario versionado de sinónimos por entidad; calcular coincidencia exacta/fuzzy con umbrales configurables; mostrar tabla interactiva origen→destino con confianza, tipo y opción de excluir; requerir confirmación del usuario antes de persistir el perfil.
- **Archivos/módulos:** `js/teacher.js`, `#modal-excel-importer`, `importDataWithColumnMapping`, `validateImportPreview`, catálogo de entidades y campos destino.
- **Dependencias/riesgos:** F35-Task15/17, F25-Task02 (perfiles de mapeo), F26-Task02 (locale); riesgo de mapear campos semánticamente parecidos pero incompatibles.
- **Alcance:** sugerencias y mapeo visual; no ejecutar mapeo automático sin confirmación ni aceptar campos destino no permitidos.
- **Criterios de aceptación:** sinónimos por entidad; score/umbral visible; usuario puede cambiar/excluir mapeo; campos incompatibles se rechazan; mapeo versionado; pruebas con encabezados ambiguos, sinónimos, idiomas, orden variable y falsos positivos.
- **Prioridad:** P0. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; frontend envía rígidamente la primera columna como identificador y no existe interfaz visual de correspondencias.

---

<!-- ID: F35-TASK03 | Fuentes: AUDITORIAS/AUDITORIA_FASE_35_IMPORTADOR_INTELIGENTE.md -->
### [ ] [F35-TASK03] Validar referencias relacionales y detectar duplicados/conflictos
- **Hallazgo de origen:** F35-08/F35-09; CAR-F35-08/CAR-F35-09.
- **Severidad:** Crítica / P0. **Objetivo:** impedir inserciones huérfanas y clasificar correctamente registros nuevos, existentes o conflictivos.
- **Acción ejecutable:** verificar referencias a estudiantes, matrículas, cuentas y entidades destino; detectar duplicados internos y contra la base; clasificar Crear/Actualizar/Omitir/Conflicto; exigir política de resolución explícita.
- **Archivos/módulos:** `backend/accounting-service/Code.gs`, `validateImportPreview`, `importDataWithColumnMapping`, catálogos maestros y hojas destino.
- **Dependencias/riesgos:** F25-Task03 (duplicados y referencias), F29-Task01/07 (identidad/conciliación); riesgo de fusionar personas distintas o sobrescribir registros oficiales.
- **Alcance:** validación y clasificación previa; no fusionar automáticamente por nombre ni actualizar registros sin permiso.
- **Criterios de aceptación:** referencias existen y están activas; claves naturales normalizadas; duplicados internos/externos separados; conflicto bloquea escritura; política crear/actualizar/omitir aprobada y auditada; pruebas con huérfanos, duplicados, IDs ambiguos y referencias inactivas.
- **Prioridad:** P0. **Estado:** Pendiente (ampliación coordinada con F25-Task03).
- **Evidencia de cierre:** pendiente; el importador no valida existencia de estudiantes/cuentas ni compara duplicados contra la base.

---

<!-- ID: TAREA-F5-002 | Fuentes: completadas.md -->
### [ ] [TAREA-F5-002] Implementar una máquina de estados y reglas de transición para las solicitudes
- **Origen del Hallazgo:** `Auditoria.txt` (HALLAZGOS F5: HALLAZGOS-F5-P0-03) / `AUDITORIA_FASE_5_ADMISIONES_PORTAL_FAMILIAS.md` (Subcapacidad 5.4, Brecha P0-03)
- **Severidad/Clasificación:** Crítico
- **Archivos Involucrados:** `backend/academic-service/Code.gs` (l. 779-799), `backend/user-service/Code.gs`
- **Dependencias Expuestas:** Hoja `SolicitudesAdmision`, `HistorialCambiosEntidad`, `ALLOWED_ADMISSION_STATE_TRANSITIONS`
- **Descripción del Alcance:**
  1. Definir formalmente los estados de una solicitud y las transiciones autorizadas mediante la constante `ALLOWED_ADMISSION_STATE_TRANSITIONS`.
  2. Implementar, como mínimo, el siguiente flujo obligatorio: `Recibida` → `En_Revision` → `Evaluacion` → `Admitida` / `Rechazada`. Añadir el estado `En_Espera` para las solicitudes incorporadas a una lista de espera y `Convertida` para las solicitudes cuyo proceso de matrícula haya finalizado.
  3. Permitir que la solicitud avance a `Evaluacion` únicamente cuando se hayan cumplido los requisitos previos configurados para esa etapa.
  4. Exigir una justificación obligatoria (mínimo 10 caracteres) para rechazos y decisiones que requieran motivación institucional.
  5. Validar los requisitos documentales, las evaluaciones y las condiciones administrativas antes de permitir una decisión definitiva.
  6. Evitar que una solicitud rechazada o convertida vuelva a un estado anterior mediante una actualización ordinaria.
  7. Si se necesita reabrir un expediente, permitirlo únicamente a usuarios con rol `Director` / `Administrador`, mediante una operación explícita (`reopenAdmissionRequest`) que conserve la decisión original y su historial.
  8. Registrar el estado anterior, el nuevo estado, el responsable del cambio, la fecha, la justificación y el identificador de la operación en `HistorialCambiosEntidad` y `logStructuredEvent`.
  9. Proteger las transiciones frente a solicitudes concurrentes con `LockService` y frente a reintentos con claves de idempotencia.
  10. Separar explícitamente el estado de admisión del estado de matrícula para que una solicitud admitida no se considere automáticamente matriculada.
- **Criterios de Aceptación:**
  - [ ] Un estado desconocido es rechazado por el servidor con error `INVALID_ADMISSION_STATE`.
  - [ ] No se permite pasar directamente de `Recibida` a `Convertida`.
  - [ ] No se permite convertir una solicitud sin aprobación previa en estado `Admitida`.
  - [ ] Un rechazo sin justificación obligatoria se rechaza sin modificar el estado.
  - [ ] Una solicitud con requisitos obligatorios pendientes no puede avanzar a una etapa que los requiera.
  - [ ] Un usuario sin autorización no puede modificar estados aunque invoque directamente el endpoint backend.
  - [ ] Dos cambios simultáneos no sobrescriben silenciosamente una decisión más reciente.
  - [ ] Un reintento no genera decisiones, notificaciones ni registros duplicados.
  - [ ] El historial en `HistorialCambiosEntidad` permite reconstruir cada transición y su autor.
  - [ ] Reabrir una solicitud no elimina ni altera el registro de su decisión anterior.
- **Estado:** Pendiente

---

<!-- ID: TAREA-F5-005 | Fuentes: completadas.md -->
### [ ] [TAREA-F5-005] Crear la consola administrativa de revisión y decisión de admisiones
- **Origen del Hallazgo:** `Auditoria.txt` (HALLAZGOS F5: HALLAZGOS-F5-P0-01) / `AUDITORIA_FASE_5_ADMISIONES_PORTAL_FAMILIAS.md` (Subcapacidad 5.6, Brecha P0-01)
- **Severidad/Clasificación:** Crítico
- **Archivos Involucrados:** `dashboard-direccion.html`, `teacher-dashboard.html`, `js/teacher.js`, `backend/academic-service/Code.gs` (l. 748, 779, 800)
- **Dependencias Expuestas:** Endpoints `getAdmissionRequests`, `updateAdmissionStatus`, `convertAdmissionToStudent`, `setupAdvancedTableFilters`
- **Descripción del Alcance:**
  1. Crear la vista administrativa e interfaz de tabla para consultar, filtrar y administrar solicitudes de admisión.
  2. Implementar filtros avanzados por año lectivo, grado solicitado, estado, fecha de recepción y presencia de requisitos pendientes (`setupAdvancedTableFilters`).
  3. Mostrar modal de detalle integral con datos del aspirante, responsable declarado, documentos adjuntos, entrevistas, evaluaciones y timeline de estados.
  4. Distinguir visualmente solicitudes incompletas, en revisión, evaluadas y listas para decisión final.
  5. Permitir asignar responsables de revisión e ingresar observaciones internas confidenciales.
  6. Renderizar únicamente los botones de transición de estado autorizados según el estado actual de la solicitud y el rol del usuario.
  7. Exigir justificación obligatoria en campo de texto antes de confirmar rechazos o cambios de estado críticos.
  8. Mostrar advertencias si faltan documentos obligatorios, evaluaciones o si la capacidad de la sección está agotada.
  9. Sincronizar el estado visual con la respuesta real del backend (impedir marcas de éxito si el backend falla).
  10. Permitir ejecutar la conversión a matrícula con un solo clic desde solicitudes en estado `Admitida`, navegando directamente al expediente resultante.
  11. Implementar paginación en servidor e indicadores de carga (`renderUIProgressSkeleton`).
  12. Aplicar restricciones ABAC/RBAC para que el personal de nivel sólo acceda a las solicitudes de su departamento asignado.
- **Criterios de Aceptación:**
  - [ ] El personal autorizado de Secretaría y Dirección puede consultar y filtrar solicitudes en tiempo real.
  - [ ] Los filtros producen resultados coherentes con los registros persistidos en la hoja.
  - [ ] El modal de detalle permite revisar todos los componentes del expediente sin cambiar de pantalla.
  - [ ] Los botones de acción muestran únicamente transiciones válidas para el estado activo.
  - [ ] Una respuesta de error mantiene visible el estado real persistido en el servidor.
  - [ ] El rechazo sin justificación obligatoria no se puede confirmar.
  - [ ] Un usuario no autorizado no puede consultar ni decidir solicitudes invocando directamente el endpoint.
  - [ ] La paginación navega limpiamente sin omitir ni duplicar filas.
  - [ ] Se detectan cambios concurrentes realizados por otro usuario antes de sobrescribir una decisión.
- **Estado:** Pendiente

---

<!-- ID: TAREA-F5-012 | Fuentes: completadas.md -->
### [ ] [TAREA-F5-012] Incorporar seguimiento de aspirantes en el portal familiar
- **Origen del Hallazgo:** `Auditoria.txt` (HALLAZGOS F5: HALLAZGOS-F5-P0-01) / `AUDITORIA_FASE_5_ADMISIONES_PORTAL_FAMILIAS.md` (Subcapacidad 5.9 y 5.14, Brecha P0-01)
- **Severidad/Clasificación:** Alto
- **Archivos Involucrados:** `student-dashboard.html`, `js/student.js` (l. 180-260), `backend/user-service/Code.gs`
- **Dependencias Expuestas:** Endpoints `getGuardianStudents`, `getAdmissionRequests`, `initFamilyStudentSwitcher`
- **Descripción del Alcance:**
  1. Habilitar en el Portal Familiar la consulta de solicitudes de admisión de aspirantes vinculados junto a los estudiantes matriculados.
  2. Extender el selector multiestudiante (`initFamilyStudentSwitcher`) para categorizar entre "🎓 Estudiantes Matriculados" y "📝 Aspirantes en Admisión".
  3. Desplegar panel de seguimiento de admisión con el estado actual del trámite, fecha de recepción y código de seguimiento.
  4. Renderizar línea de tiempo visual con las etapas completadas y pendientes (Solicitud -> Documentos -> Entrevista -> Decisión -> Matrícula).
  5. Mostrar lista de documentos requeridos, resaltando archivos aprobados, pendientes y rechazados con botón para subir la sustitución.
  6. Desplegar citas de entrevistas y pruebas de ingreso agendadas, con fecha, hora, ubicación/enlace e instrucciones.
  7. Mostrar observaciones públicas del equipo de admisiones y solicitudes de información adicional.
  8. Permitir retomar el llenado de solicitudes incompletas o borradores guardados.
  9. Notificar ofertas de plazas vacantes y proporcionar botón para aceptar o rechazar la vacante desde el portal.
  10. Mantener una separación clara entre los expedientes de aspirantes y los expedientes académicos/financieros de alumnos activos.
  11. Aplicar aislamiento IDOR para que los tutores consulten únicamente las solicitudes de sus aspirantes autorizados.
  12. Diferenciar claramente entre "Sin información registrada", "Falta de permisos" y "Error de carga del servidor".
  13. Evitar atribuir cobros de admisión como deudas de matrícula de estudiantes activos.
- **Criterios de Aceptación:**
  - [ ] Un tutor autenticado puede conmutar entre sus hijos matriculados y sus hijos postulantes desde el portal.
  - [ ] Intento de consultar solicitudes de aspirantes ajenos modificando IDs es bloqueado en el backend.
  - [ ] Las solicitudes de admisión se distinguen visualmente con etiquetas y colores de las matrículas activas.
  - [ ] El panel muestra el estado real de los documentos, citas y decisiones de admisión.
  - [ ] Cambios realizados por admisiones se reflejan inmediatamente al actualizar el portal familiar.
  - [ ] Los errores de servidor muestran alertas descriptivas sin presentar datos vacíos como inexistentes.
  - [ ] La interfaz guía a la familia sobre los pasos exactos para completar la admisión.
  - [ ] Al convertirse en estudiante, el aspirante pasa automáticamente a la sección de estudiantes matriculados.
- **Estado:** Pendiente

---

<!-- ID: TAREA-F5-017 | Fuentes: completadas.md -->
### [ ] [TAREA-F5-017] Mejorar la gestión de duplicados, validación y calidad de los datos de aspirantes
- **Origen del Hallazgo:** `Auditoria.txt` (HALLAZGOS F5: HALLAZGOS-F5-P0-01) / `AUDITORIA_FASE_5_ADMISIONES_PORTAL_FAMILIAS.md` (Subcapacidad 5.1 y 5.6, Brecha P0-01)
- **Severidad/Clasificación:** Medio
- **Archivos Involucrados:** `backend/academic-service/Code.gs` (l. 714, 4615-4650), `js/student.js`
- **Dependencias Expuestas:** Endpoint `findDuplicateStudents`, `normalizeString`, `SolicitudesAdmision`
- **Descripción del Alcance:**
  1. Implementar reglas estrictas de validación de formato en el servidor para DNI, pasaportes, números telefónicos, correos y fechas de nacimiento.
  2. Implementar la normalización diacrítica de texto (`normalizeString`) eliminando tildes, caracteres especiales y espacios redundantes antes de comparar.
  3. Extender `findDuplicateStudents` para comparar solicitudes de admisión activas contra expedientes existentes y otras solicitudes recibidas.
  4. Algoritmo de detección que clasifique:
     - Coincidencia Exacta (Mismo DNI / Identificación Nacional) -> Bloqueo preventivo de solicitud duplicada.
     - Coincidencia Alta (Mismos Nombres, Apellidos y Fecha de Nacimiento) -> Alerta de revisión para Secretaría.
     - Coincidencia Media (Mismo Email y Teléfono con Nombres Similares) -> Advertencia de posible duplicado.
  5. Prohibir la fusión o vinculación automática de registros sin la verificación manual de Secretaría.
  6. Proteger la privacidad evitando que los mensajes de alerta de duplicidad expongan datos personales de los expedientes existentes a usuarios no autorizados.
  7. Panel de resolución de duplicados para que Secretaría apruebe la creación de un nuevo expediente o vincule a una persona existente.
  8. Registrar la decisión de resolución de duplicados en la bitácora de auditoría.
  9. Validar que la corrección de datos en una solicitud conserve la trazabilidad original.
- **Criterios de Aceptación:**
  - [ ] Intentos de registrar un aspirante con un DNI ya existente en `SolicitudesAdmision` o `ExpedientesEstudiantes` son detectados e informados.
  - [ ] No se realizan fusiones automáticas de personas basadas únicamente en coincidencias de nombres.
  - [ ] La consola de administración despliega alertas de duplicidad para la revisión de Secretaría.
  - [ ] Los mensajes de validación no revelan información confidencial de terceros.
  - [ ] La resolución de duplicados queda documentada con el usuario, fecha y decisión en la bitácora.
- **Estado:** Pendiente

---

<!-- ID: TASK-029 | Fuentes: Pendientes.md ; pendientes/Secretaria/Pendientes.md -->
### [ ] [TASK-029] Control estricto de cupos, capacidad vehicular y asignaciones de transporte
- **Origen del Hallazgo:** `AUDITORIA_FASE_21_TRANSPORTE_SERVICIOS_COMPLEMENTARIOS.md` / Sección E (PT-21-02), Sección G (Defecto 1) y Plan de Implementación TAREA 01
- **Prioridad:** P0
- **Severidad/Clasificación:** Crítica (Seguridad física de estudiantes, cumplimiento de límites legales de capacidad vehicular y prevención de sobrecupos)
- **Archivos Involucrados:**
  - `backend/accounting-service/Code.gs` (`assignStudentTransport`, `getTransportRoutes`, `getTransportAssignments`)
  - `TransporteRutas`
  - `TransporteAsignaciones`
  - `TransporteVehiculos`
  - `js/accounting.js`
- **Dependencias Expuestas:** `TransporteRutas`, `TransporteAsignaciones`, `TransporteVehiculos`, `LockService`
- **Descripción del Alcance:**
  La función actual `assignStudentTransport` inserta registros mediante `appendRow` sin comprobar la cantidad de estudiantes que ya ocupan una ruta, permitiendo superar la capacidad configurada. Tampoco comprueba si un estudiante ya tiene otra asignación incompatible en el mismo horario.
  Requerimientos Funcionales Detallados:
  1. Capacidad vehicular independiente y tope de ruta:
     - Establecer la capacidad máxima autorizada de cada vehículo (`capacidadPasajeros` en `TransporteVehiculos`) como dato maestro independiente de la ruta.
     - La capacidad operativa de una ruta nunca podrá superar la capacidad autorizada del vehículo asignado a ella.
     - Si se cambia el vehículo asignado a una ruta, actualizar de inmediato la capacidad efectiva disponible.
  2. Cálculo estricto de ocupación y estados de cupo:
     - Contabilizar únicamente las asignaciones activas y vigentes para determinar la ocupación.
     - Mantener y diferenciar en tiempo real: Cupos totales autorizados, Cupos ocupados, Cupos disponibles, Cupos reservados y Estudiantes en lista de espera.
     - Adquirir candado de script (`LockService.getScriptLock()`) para evitar que dos solicitudes simultáneas consuman el último cupo disponible.
  3. Validaciones de asignación y prevención de colisiones:
     - Impedir de forma terminante que se asignen estudiantes por encima de la capacidad disponible.
     - Detectar asignaciones duplicadas para el mismo estudiante, ruta, jornada y período.
     - Detectar conflictos cuando un estudiante tenga dos rutas asignadas que coincidan en horario.
     - Permitir que un estudiante tenga rutas diferentes para ida y regreso, y asignaciones para días específicos de la semana.
     - Liberar el cupo automáticamente cuando una asignación se cancela, vence o queda inactiva.
     - Mantener el historial inalterable de asignaciones y cancelaciones.
- **Criterios de Aceptación:**
  - Una ruta con capacidad para 2 estudiantes acepta 2 asignaciones activas y rechaza la tercera por cupo agotado.
  - La capacidad se calcula considerando el vehículo realmente asignado a la ruta.
  - Una asignación cancelada o vencida libera el cupo inmediatamente.
  - Se detectan y bloquean asignaciones duplicadas o colisiones de horario en el mismo estudiante.
  - Las solicitudes simultáneas concurrentes no producen sobrecupos.
  - Los reportes de ocupación coinciden con las asignaciones reales.
- **Estado:** Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 1813-1846; clave TASK-030; asignación única: Secretaria -->

---

<!-- ID: TASK-030 | Fuentes: Pendientes.md ; pendientes/Secretaria/Pendientes.md -->
### [ ] [TASK-030] Protección de datos de transporte y aislamiento de consultas por usuario (RBAC/ABAC)
- **Origen del Hallazgo:** `AUDITORIA_FASE_21_TRANSPORTE_SERVICIOS_COMPLEMENTARIOS.md` / Sección E (PT-21-49), Sección G (Defecto 2) y Plan de Implementación TAREA 02
- **Prioridad:** P0
- **Severidad/Clasificación:** Crítica (Privacidad y protección de datos de menores, FERPA y prevención de fuga de geolocalización y paradas a terceros)
- **Archivos Involucrados:**
  - `backend/accounting-service/Code.gs` (`getTransportAssignments`, `getTransportRoutes`, `getTransportTripLiveLocation`)
  - `TransporteAsignaciones`
  - `ExpedientesFamiliares`
  - `ROLE_PERMISSIONS`
- **Dependencias Expuestas:** `ROLE_PERMISSIONS`, `validateRolePermission`, `ExpedientesFamiliares`
- **Descripción del Alcance:**
  `getTransportAssignments` devuelve todas las asignaciones institucionales cuando se invoca sin el parámetro `estudianteUserId`, permitiendo a usuarios con rol `Padre` o `Estudiante` consultar rutas, horarios y paradas de otros menores ajenos a su núcleo familiar.
  Requerimientos Funcionales Detallados:
  1. Aislamiento estricto por rol e identidad verificada:
     - Los padres y tutores únicamente podrán consultar estudiantes vinculados a sus relaciones familiares autorizadas en `ExpedientesFamiliares`.
     - Los estudiantes únicamente podrán consultar su propia información personal de transporte.
     - Los conductores y acompañantes únicamente podrán consultar las rutas, paradas y pasajeros que tengan asignados para sus recorridos vigentes.
     - Los administradores y directores podrán consultar información global según sus privilegios.
  2. Blindaje de consultas sin parámetros:
     - La ausencia de filtros o parámetros no debe provocar una consulta general; debe devolver exclusivamente el ámbito autorizado del usuario autenticado.
     - Las solicitudes que intenten consultar estudiantes ajenos deben rechazarse con registro de auditoría (`UNAUTHORIZED_ACCESS_ATTEMPT`).
     - Las coordenadas GPS, direcciones residenciales y horarios de menores deben tratarse como información restringida; los enlaces de seguimiento no deben permitir acceso público a la ubicación de vehículos sin token de sesión válido.
     - Revocar los accesos de forma inmediata cuando cambie la relación familiar, el rol o la asignación del personal.
- **Criterios de Aceptación:**
  - Un padre no puede consultar estudiantes de otra familia, incluso manipulando el ID en la solicitud.
  - Un estudiante no puede consultar las asignaciones de otro estudiante.
  - Un conductor no puede consultar rutas ajenas a su asignación activa.
  - Una consulta sin filtros nunca devuelve todos los estudiantes de la institución a un rol no directivo.
  - Las coordenadas GPS no son accesibles mediante enlaces públicos sin autenticación.
  - Se auditan los intentos de acceso no autorizado.
- **Estado:** Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 1847-1878; clave TASK-031; asignación única: Secretaria -->

---

<!-- ID: TASK-031 | Fuentes: Pendientes.md ; pendientes/Secretaria/Pendientes.md -->
### [ ] [TASK-031] Control de abordaje, descenso y asistencia de pasajeros mediante QR y registro asistido
- **Origen del Hallazgo:** `AUDITORIA_FASE_21_TRANSPORTE_SERVICIOS_COMPLEMENTARIOS.md` / Sección E (PT-21-20), Sección G (Defecto 3) y Plan de Implementación TAREA 03
- **Prioridad:** P0
- **Severidad/Clasificación:** Crítica (Seguridad de menores a bordo, prevención de extravíos y trazabilidad de viaje)
- **Archivos Involucrados:**
  - `backend/accounting-service/Code.gs` (nuevas funciones `recordStudentBoarding`, `recordStudentAlighting`, `getTripPassengerManifest`)
  - Hoja `TransporteAsistenciaViajes`
  - Hoja `TransporteViajes`
- **Dependencias Expuestas:** `TransporteAsignaciones`, `TransporteRutas`, `sendMultiChannelNotification`
- **Descripción del Alcance:**
  No existe un mecanismo para registrar cuándo un estudiante sube o baja del vehículo escolar, ni se conoce quién permanece a bordo durante el trayecto.
  Requerimientos Funcionales Detallados:
  1. Registro individual de eventos de abordaje y descenso:
     - Vincular cada evento con: Estudiante, Recorrido (`viajeId`), Ruta, Vehículo, Parada, Fecha/Hora, Usuario registrador y Conductor/Acompañante responsable.
     - Identificar al estudiante mediante credencial QR individual institucional.
     - Permitir registro manual asistido en pantalla táctil cuando el escaneo óptico no esté disponible, registrando quién ejecutó la acción.
  2. Validaciones operativas y prevención de duplicados:
     - Validar que el estudiante pertenezca al recorrido y jornada correspondientes; si un alumno intenta abordar una ruta incorrecta, alertar de inmediato.
     - Evitar registros duplicados de abordaje o descenso (descartar doble escaneo accidental).
     - Identificar estudiantes asignados que debían abordar en la parada y no lo hicieron (ausencias en parada).
     - Identificar en tiempo real qué estudiantes fueron registrados como abordados pero aún no registran descenso.
     - Mantener el historial inmutable de eventos con soporte para almacenamiento local offline y sincronización posterior.
- **Criterios de Aceptación:**
  - Un estudiante asignado registra su abordaje mediante QR o marcado manual con hora exacta.
  - Un estudiante ajeno a la ruta es advertido y rechazado salvo autorización excepcional registrada.
  - Un escaneo repetido no duplica el evento ni altera las métricas de pasajeros a bordo.
  - El descenso queda vinculado exactamente al mismo viaje de abordaje.
  - El personal de ruta puede consultar en todo momento la lista de pasajeros esperados y el estado individual de cada uno.
- **Estado:** Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 1879-1908; clave TASK-032; asignación única: Secretaria -->

---

<!-- ID: TASK-032 | Fuentes: Pendientes.md ; pendientes/Secretaria/Pendientes.md -->
### [ ] [TASK-032] Gestión de personas autorizadas para recoger y recibir estudiantes en paradas
- **Origen del Hallazgo:** `AUDITORIA_FASE_21_TRANSPORTE_SERVICIOS_COMPLEMENTARIOS.md` / Sección E (PT-21-15, PT-21-16), Sección C (1.8) y Plan de Implementación TAREA 04
- **Prioridad:** P0
- **Severidad/Clasificación:** Crítica (Custodia legal, seguridad en entrega de infantes y prevención de entregas a personas no autorizadas)
- **Archivos Involucrados:**
  - `backend/accounting-service/Code.gs` (nuevas funciones `getAuthorizedPickupPersons`, `recordStudentSafeDelivery`)
  - Hoja `TransportePersonasAutorizadas`
  - `ExpedientesFamiliares`
- **Dependencias Expuestas:** `ExpedientesFamiliares`, `TransporteAsignaciones`, `F21-Task03`
- **Descripción del Alcance:**
  No existe una relación funcional entre las asignaciones de transporte y las personas autorizadas en los expedientes familiares para recibir a los menores en las paradas residenciales.
  Requerimientos Funcionales Detallados:
  1. Catálogo de personas autorizadas por estudiante:
     - Consultar personas autorizadas registradas en el expediente familiar con nombre completo, documento de identidad (DPI/DNI), parentesco, teléfono y fotografía.
     - Permitir autorizaciones permanentes y temporales con fechas de inicio y finalización.
     - Permitir revocación inmediata de autorizaciones y registrar restricciones especiales de entrega (ej. medidas de protección legal).
  2. Protocolo de entrega y validación en parada:
     - Al registrar el descenso de un menor que requiere entrega a un adulto, la app del acompañante debe mostrar exclusivamente los adultos autorizados vigentes.
     - Registrar obligatoriamente el responsable que realiza la entrega, el adulto que recibe, fecha, hora y ubicación física.
     - Impedir la entrega ordinaria a personas que no figuren como autorizadas; ante emergencias familiares, exigir autorización formal de Dirección con registro documentado.
- **Criterios de Aceptación:**
  - Solo se muestran los adultos autorizados vigentes para el estudiante en su parada de destino.
  - Una autorización vencida o revocada bloquea la entrega ordinaria.
  - Se registra con precisión quién entregó y quién recibió al menor.
  - Las excepciones requieren autorización documentada de un perfil facultado.
  - Los documentos de identidad no son visibles para usuarios sin privilegios.
- **Estado:** Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 1909-1938; clave TASK-033; asignación única: Secretaria -->

---

<!-- ID: TASK-033 | Fuentes: Pendientes.md ; pendientes/Secretaria/Pendientes.md -->
### [ ] [TASK-033] Administración de flota vehicular, conductores, acompañantes y documentación habilitante
- **Origen del Hallazgo:** `AUDITORIA_FASE_21_TRANSPORTE_SERVICIOS_COMPLEMENTARIOS.md` / Sección E (PT-21-01, PT-21-03, PT-21-04), Sección C (1.1, 1.2) y Plan de Implementación TAREA 05
- **Prioridad:** P0
- **Severidad/Clasificación:** Crítica (Habilitación legal de transporte escolar, pólizas de seguros vigentes y licencias de conducir pesada)
- **Archivos Involucrados:**
  - `backend/accounting-service/Code.gs` (nuevas funciones `manageTransportVehicle`, `getTransportVehicles`, `manageTransportDriver`, `getTransportDrivers`)
  - Hoja `TransporteVehiculos`
  - Hoja `TransporteConductores`
  - `TransporteRutas`
- **Dependencias Expuestas:** `TransporteRutas`, `MantenimientoOrdenes`, `ROLE_PERMISSIONS`
- **Descripción del Alcance:**
  Las rutas utilizan campos de texto libre para `UnidadCodigo` y `ConductorEmpleadoId` sin una entidad independiente que administre placas, capacidad oficial de asientos, vigencia de seguros de accidentes, revisión mecánico-técnica ni licencias de conducir.
  Requerimientos Funcionales Detallados:
  1. Gestión de vehículos:
     - Registrar: código interno único, placa/matrícula, marca, modelo, año, capacidad oficial autorizada, tipo de vehículo (autobús, microbús, camioneta), características de accesibilidad, propietario/proveedor, estado operativo (`Disponible`, `Asignado`, `EnMantenimiento`, `FueraServicio`, `Retirado`), pólizas de seguro, revisión mecánica, fechas de vencimiento y kilometraje.
     - Impedir la asignación operativa de vehículos con seguro o revisión vencida.
  2. Gestión de conductores y acompañantes:
     - Conductores: vincular con expediente de personal, registrar licencia, categoría (pesada/comercial), vigencia, capacitaciones, estado de habilitación, y clasificar conductores titulares y sustitutos. Impedir asignaciones con licencia vencida.
     - Acompañantes (monitoras): registrar personal acompañante, capacitaciones y permitir asignar uno o varios acompañantes por ruta con trazabilidad de sustituciones.
- **Criterios de Aceptación:**
  - Se puede crear, editar y consultar vehículos y personal en maestros independientes.
  - La placa y el código interno no generan duplicados indebidos.
  - La capacidad se obtiene directamente del registro vehicular autorizado.
  - Un vehículo fuera de servicio o con póliza vencida no puede asignarse a una ruta activa.
  - Un conductor con licencia vencida queda bloqueado para operar recorridos.
  - Las sustituciones quedan registradas sin borrar la asignación titular histórica.
- **Estado:** Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 1939-1969; clave TASK-034; asignación única: Secretaria -->

---

<!-- ID: TASK-034 | Fuentes: Pendientes.md ; pendientes/Secretaria/Pendientes.md -->
### [ ] [TASK-034] Cierre obligatorio de recorrido, control de pasajeros y confirmación de unidad vacía
- **Origen del Hallazgo:** `AUDITORIA_FASE_21_TRANSPORTE_SERVICIOS_COMPLEMENTARIOS.md` / Sección E (PT-21-24), Sección C (1.9) y Plan de Implementación TAREA 06
- **Prioridad:** P0
- **Severidad/Clasificación:** Crítica (Seguridad infantil absoluta, prevención de niños olvidados a bordo y protocolo de fin de viaje)
- **Archivos Involucrados:**
  - `backend/accounting-service/Code.gs` (nueva función `finalizeTransportTrip`)
  - Hoja `TransporteViajes`
  - Hoja `TransporteAsistenciaViajes`
- **Dependencias Expuestas:** `F21-Task03`, `TransporteRutas`, `sendMultiChannelNotification`
- **Descripción del Alcance:**
  No existe un procedimiento de cierre que compruebe que todos los estudiantes han descendido del vehículo escolar, dejando desprotegida una situación de alto riesgo infantil.
  Requerimientos Funcionales Detallados:
  1. Protocolo de fin de recorrido:
     - Incorporar estados de recorrido: `Programado`, `Iniciado`, `EnCurso`, `PendienteDeCierre`, `CerradoNormal`, `CerradoConIncidencia`.
     - Comparar la lista de pasajeros abordados contra los eventos de descenso registrados.
     - Si existen estudiantes que continúan registrados a bordo sin descenso, bloquear el cierre ordinario del viaje y disparar una alarma prioritaria en pantalla.
  2. Confirmación de inspección física (Barrido de asientos):
     - Exigir una inspección física del interior de la unidad al conductor y acompañante.
     - Registrar la confirmación explícita y obligatoria: "Inspección física realizada: 0 estudiantes a bordo".
     - Permitir cierre excepcional únicamente mediante justificación documentada con autorización directiva.
     - Registrar hora exacta, usuarios responsables y resultado de la inspección.
- **Criterios de Aceptación:**
  - El sistema detecta automáticamente pasajeros sin descenso registrado.
  - El cierre normal se bloquea taxativamente si quedan pasajeros pendientes a bordo.
  - La inspección física final queda registrada con responsable y fecha.
  - Se generan alertas inmediatas cuando se detecta un pasajero sin descenso confirmado.
  - El historial permite reconstruir con exactitud el cierre de cada recorrido escolar.
- **Estado:** Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 1970-1999; clave TASK-035; asignación única: Secretaria -->

---

<!-- ID: TASK-035 | Fuentes: Pendientes.md ; pendientes/Secretaria/Pendientes.md -->
### [ ] [TASK-035] Integración con mantenimiento y bloqueo de vehículos no disponibles
- **Origen del Hallazgo:** `AUDITORIA_FASE_21_TRANSPORTE_SERVICIOS_COMPLEMENTARIOS.md` / Sección E (PT-21-36), Sección C (1.13) y Plan de Implementación TAREA 07
- **Prioridad:** P0
- **Severidad/Clasificación:** Crítica (Seguridad vial, prevención de fallas mecánicas en ruta y coherencia con activos fijos)
- **Archivos Involucrados:**
  - `backend/accounting-service/Code.gs`
  - `TransporteVehiculos`
  - `ActivosPatrimoniales`
  - `MantenimientoOrdenes`
- **Dependencias Expuestas:** `TransporteVehiculos`, `ActivosPatrimoniales`, `MantenimientoOrdenes`, `F19-Task06`
- **Descripción del Alcance:**
  Las órdenes de mantenimiento de la Fase 19 no están relacionadas funcionalmente con los vehículos de transporte. Una unidad en taller mecánico podría continuar asignada a una ruta escolar activa.
  Requerimientos Funcionales Detallados:
  1. Vinculación con activos patrimoniales y órdenes de trabajo:
     - Relacionar cada vehículo con su registro de activo institucional en `ActivosPatrimoniales`.
     - Vincular las órdenes de mantenimiento en `MantenimientoOrdenes` con el vehículo correspondiente (`VehiculoID`).
  2. Bloqueo operativo automático:
     - Consultar el estado de mantenimiento antes de asignar o iniciar una ruta.
     - Si el vehículo tiene una orden que implique inmovilización, bloquear su asignación y marcarlo como `FueraServicio / EnMantenimiento`.
     - Si ya tiene recorridos programados, advertir el conflicto y facilitar la asignación de un vehículo sustituto.
     - La reincorporación al servicio activo exige que la orden de mantenimiento haya sido formalmente cerrada y verificada.
- **Criterios de Aceptación:**
  - Un vehículo con orden de mantenimiento abierta no puede asignarse a rutas activas.
  - La disponibilidad cambia automáticamente al abrir y cerrar órdenes de trabajo.
  - Se conserva el historial de reparaciones y costos por unidad vehicular.
  - La sustitución vehicular queda asociada al recorrido afectado sin duplicar activos patrimoniales.
- **Estado:** Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 2000-2029; clave TASK-036; asignación única: Secretaria -->

---

<!-- ID: TASK-036 | Fuentes: Pendientes.md ; pendientes/Secretaria/Pendientes.md -->
### [ ] [TASK-036] Auditoría de integridad de datos y transición de las estructuras actuales de transporte
- **Origen del Hallazgo:** `AUDITORIA_FASE_21_TRANSPORTE_SERVICIOS_COMPLEMENTARIOS.md` / Sección E, Sección G y Plan de Implementación TAREA 34
- **Prioridad:** P0
- **Severidad/Clasificación:** Crítica (Migración segura de datos, preservación de rutas existentes y prevención de relaciones huérfanas)
- **Archivos Involucrados:**
  - `backend/accounting-service/Code.gs`
  - `TransporteRutas`
  - `TransporteAsignaciones`
  - `TransporteVehiculos`
  - `TransporteConductores`
- **Dependencias Expuestas:** `TransporteRutas`, `TransporteAsignaciones`, `F21-Task01`, `F21-Task05`
- **Descripción del Alcance:**
  Las estructuras existentes almacenan rutas y asignaciones con información limitada (paradas en JSON, choferes como texto libre). La ampliación del sistema requiere migrar esos datos sin perder registros ni producir relaciones ficticias.
  Requerimientos Funcionales Detallados:
  1. Diagnóstico y migración controlada:
     - Identificar todos los registros existentes en `TransporteRutas` y `TransporteAsignaciones`.
     - Identificar rutas que utilizan códigos de unidad sin vehículo asociado y choferes almacenados como texto.
     - Extraer las paradas embebidas en JSON y migrarlas a la nueva estructura relacional de paradas.
     - Conservar identificadores existentes (`RutaID`, `AsignacionTranspID`) garantizando compatibilidad retrospectiva.
     - Los registros ambiguos deben quedar identificados en un reporte de inconsistencias para revisión manual, sin inventar entidades ficticias.
     - Validar que no se pierda ninguna asignación activa de estudiantes tras la migración.
- **Criterios de Aceptación:**
  - Se identifican y migran todos los registros existentes sin pérdida de información.
  - Las consultas antiguas continúan funcionando mientras se activa la nueva estructura.
  - No se generan duplicados de rutas ni asignaciones huérfanas.
  - Se genera un reporte claro de registros que requieran conciliación manual.
- **Estado:** Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 2071-2113; clave TASK-038; asignación única: Secretaria -->

---

<!-- ID: TASK-038 | Fuentes: AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F5-006.md ; Pendientes.md ; pendientes/Secretaria/Pendientes.md -->
### [ ] [TASK-038] TAREAS DERIVADAS DE AUDITORÍA — TASK-038 A TASK-042 / FASE 22 (2026-11-04)

**Otros títulos originales:**
- Validación binaria, seguridad e integridad de archivos adjuntos
- **Hallazgos:** H2.
- **Severidad/Prioridad:** CRÍTICO / P0.
- **Objetivo:** validar el contenido real antes de crear archivos en Drive.
- **Archivos/módulos:** backend/academic-service/Code.gs, uploadStudentDocument y validador binario compartido.
- **Dependencias:** Magic Bytes, Utilities.base64Decode, DriveApp, límites configurables.
- **Alcance:** aceptar solo formatos autorizados para F5-006; verificar firma binaria, extensión y MIME; detectar PDF/imagen corruptos o truncados; mantener máximo 10 MB; rechazar sin crear archivo ni fila; registrar motivo.
- **Criterios de aceptación:** ejecutable con MIME PDF se rechaza; MIME falso se detecta; PDF/JPEG/PNG válidos se aceptan; archivos corruptos, truncados, vacíos, WEBP si no está autorizado por el catálogo F5-006 y mayores de 10 MB se rechazan antes de Drive; ningún rechazo crea registro huérfano.
- **Estado:** Pendiente (ampliación de TASK-038).
- **Origen del Hallazgo:** `AUDITORIA_FASE_22_GESTION_DOCUMENTAL_FORMULARIOS_FIRMA_ELECTRONICA.md` / Sección E (F22-11), Sección G (Defecto 1) y Plan de Trabajo TAREA 22-01
- **Prioridad:** P0
- **Severidad/Clasificación:** Crítica (Seguridad perimetral, prevención de inyección de código malicioso y validación de tipos binarios reales)
- **Archivos Involucrados:**
  - `backend/accounting-service/Code.gs`
  - `backend/user-service/Code.gs` (`submitInstitutionalFormRequest`)
  - Google Drive API
- **Dependencias Expuestas:** Google Drive, servicios de recepción de archivos, formularios institucionales, solicitudes y trámites, expedientes estudiantiles y laborales.
- **Descripción del Alcance:**
  La plataforma valida principalmente la extensión declarada en el nombre del archivo. Esto permite que un archivo ejecutable, corrupto o con contenido distinto al formato anunciado pueda presentarse como PDF o imagen y llegar al almacenamiento institucional en Google Drive.
  Requerimientos Funcionales Detallados:
  1. Validación del contenido binario real:
     - Centralizar la validación de archivos para que todos los módulos que reciben adjuntos utilicen los mismos controles de seguridad.
     - Implementar validación del contenido binario real del archivo, sin confiar exclusivamente en el nombre, la extensión, el MIME declarado por el navegador ni el tipo de archivo seleccionado en el formulario.
     - Reconocer y validar las firmas binarias (Magic Bytes) de los formatos permitidos, como mínimo:
       * PDF: debe comenzar obligatoriamente con `%PDF-` (`0x25, 0x50, 0x44, 0x46, 0x2D`).
       * JPEG/JPG: debe comenzar con `0xFF, 0xD8, 0xFF`.
       * PNG: debe comenzar con `0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A`.
       * WEBP: contenedor RIFF con firma `WEBP`.
       * DOCX / XLSX: contenedores PKZip (`0x50, 0x4B, 0x03, 0x04`) con validación de estructura de paquete OpenXML interna.
  2. Comprobación estructural y rechazos preventivos:
     - Comprobar que la estructura interna del archivo sea coherente con el formato detectado.
     - Rechazar: ejecutables renombrados como documentos (`.exe`, `.sh`, `.bat`), archivos con extensión y contenido incompatibles, archivos corruptos o incompletos, archivos vacíos (0 bytes), formatos no autorizados y archivos que excedan los límites establecidos configurables (ej. 10 MB).
     - Evitar que se acepten archivos con contenido activo o potencialmente peligroso cuando el formato o el contexto no lo requieran.
     - Incorporar análisis antimalware mediante un mecanismo o servicio compatible cuando esté disponible.
     - Registrar el resultado de la validación y el motivo específico de rechazo para orientar al usuario.
     - Ejecutar la validación en el servidor antes de guardar definitivamente el archivo en Google Drive; un archivo rechazado no debe generar registros documentales incompletos ni asociarse a expedientes.
     - Mantener el nombre original como metadato, sin utilizarlo como prueba del formato real.
- **Criterios de Aceptación:**
  - [ ] Un ejecutable renombrado como PDF es rechazado inmediatamente por discrepancia binaria.
  - [ ] Un archivo con MIME falso es identificado y catalogado por su contenido real.
  - [ ] Un PDF válido puede cargarse y abrirse correctamente en el visor.
  - [ ] Un PDF corrupto o truncado es rechazado con mensaje descriptivo.
  - [ ] Una imagen válida es aceptada únicamente si corresponde a un formato permitido.
  - [ ] Los archivos demasiado grandes son rechazados antes de su almacenamiento definitivo en Drive.
  - [ ] Los errores de validación no generan registros documentales incompletos en las hojas.
  - [ ] La validación se aplica a todos los módulos que permiten adjuntar documentos.
  - [ ] Se conserva la trazabilidad del archivo y del resultado de su validación.
- **Estado:** [ ] Pendiente

### [AUD-NG-055] Completar la validación binaria y estructural de todos los formatos autorizados
- **Origen del Hallazgo:** Auditoria.txt / AUD-NG-055 (TASK-038 / F22-Task01)
- **Severidad/Clasificación:** Crítico
- **Archivos Involucrados:** backend/accounting-service/Code.gs; backend/user-service/Code.gs; componente compartido de validación de archivos
- **Dependencias Expuestas:** validateFileBinaryIntegrity, Magic Bytes, MIME, PDF, JPEG, PNG, WEBP, ZIP/OOXML, uploadPaymentVoucher y submitInstitutionalFormRequest.
- **Descripción del Alcance:** Reforzar la detección de formato con firmas completas y reglas de correspondencia entre extensión, MIME y bytes reales. Exigir %PDF- completo; validar la estructura interna PDF/imagen y comprobar la integridad de paquetes DOCX/XLSX (ZIP y partes OpenXML requeridas), rechazando ZIP genérico, cabeceras truncadas, contenido desconocido y formatos incompatibles. No devolver valid:true para detectedFormat unknown. Mantener límites configurables y mensajes de rechazo específicos.
- **Criterios de Aceptación:** Un PDF sin el quinto byte esperado se rechaza; un archivo con cabecera parcial o contenido truncado se rechaza; un ZIP genérico no se acepta como DOCX/XLSX; WEBP/DOCX/XLSX deben coincidir con extensión y estructura; MIME falso no cambia la detección; los formatos no autorizados y desconocidos son rechazados.

### [AUD-NG-056] Unificar la política de validación de adjuntos entre microservicios
- **Origen del Hallazgo:** Auditoria.txt / AUD-NG-056 (TASK-038 / F22-Task01)
- **Severidad/Clasificación:** Alto
- **Archivos Involucrados:** backend/accounting-service/Code.gs; backend/user-service/Code.gs; arquitectura de servicios compartidos
- **Dependencias Expuestas:** validateFileBinaryIntegrity, uploadPaymentVoucher, submitInstitutionalFormRequest y política institucional de adjuntos.
- **Descripción del Alcance:** Definir un componente o contrato compartido de validación para todos los servicios que reciben archivos, evitando copias independientes. Asegurar que límites, extensiones, firmas, estructura, mensajes y versiones de política sean iguales y trazables en cada integración.
- **Criterios de Aceptación:** Los servicios consumen la misma política/versionado de validación; una batería común de archivos válidos e inválidos produce resultados idénticos; ningún endpoint conserva una implementación divergente o bypass no documentado.

### [AUD-NG-057] Impedir adjuntos no validados y evitar respuestas exitosas tras fallos de Drive
- **Origen del Hallazgo:** Auditoria.txt / AUD-NG-057 (TASK-038 / F22-Task01)
- **Archivos Involucrados:** backend/accounting-service/Code.gs; backend/user-service/Code.gs
- **Dependencias Expuestas:** uploadPaymentVoucher, submitInstitutionalFormRequest, DriveApp, ComprobantesPago y SolicitudesTramites.
- **Descripción del Alcance:** Validar obligatoriamente todo archivo recibido, tanto Base64 como referencias externas, recuperando el contenido desde una fuente confiable antes de asociarlo al expediente. Rechazar cargas parciales (datos sin nombre o nombre sin datos), URL/ID no verificadas y fallos de almacenamiento. Diseñar persistencia consistente para que el registro no se confirme si el archivo no existe y es accesible; si una etapa posterior falla, limpiar o registrar de forma recuperable el archivo huérfano.
- **Criterios de Aceptación:** No se registra un comprobante/solicitud con adjunto inválido o no persistido; cada respuesta success contiene una referencia verificada; un fallo de Drive devuelve error y no crea un registro incompleto; los archivos huérfanos se evitan o quedan en cola de recuperación auditable.

### [AUD-NG-058] Restringir los adjuntos institucionales a acceso privado autorizado
- **Origen del Hallazgo:** Auditoria.txt / AUD-NG-058 (TASK-038 / F22-Task01)
- **Archivos Involucrados:** backend/accounting-service/Code.gs; backend/user-service/Code.gs; políticas de Google Drive y servicio de entrega de archivos
- **Dependencias Expuestas:** DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW, ComprobantesPago, SolicitudesTramites y RBAC/ABAC.
- **Descripción del Alcance:** Sustituir la compartición pública por enlace por almacenamiento privado y entrega mediada por un endpoint que verifique sesión, rol, vínculo con expediente y autorización contextual antes de emitir o servir el archivo. Revisar también los enlaces existentes conforme a una política de migración aprobada, sin eliminar evidencia histórica.
- **Criterios de Aceptación:** Un usuario no autenticado o sin relación autorizada no puede abrir el archivo; los permisos se comprueban en cada descarga; no se generan nuevos enlaces ANYONE_WITH_LINK; se conserva trazabilidad de acceso y migración.

### [AUD-NG-059] Calcular y verificar el hash SHA-256 sobre el PDF definitivo almacenado
- **Origen del Hallazgo:** Auditoria.txt / AUD-NG-059 (TASK-039 / F22-Task02)
- **Archivos Involucrados:** backend/accounting-service/Code.gs; Google Drive; DocumentosEscolaresEmitidos
- **Dependencias Expuestas:** generateSchoolDocument, verifySchoolDocumentByCUV, computeDocumentSHA256, DriveApp y DocumentosEscolaresEmitidos.
- **Descripción del Alcance:** Generar el archivo PDF definitivo y recuperar sus bytes reales antes de calcular SHA-256. Persistir ID de archivo, versión y hash vinculados; al verificar por CUV, recuperar el archivo y recalcular su huella actual. Si el documento cambia, marcar discrepancia y exigir nueva versión/firma; no presentar una cadena de metadatos como hash del archivo.
- **Criterios de Aceptación:** El hash guardado coincide con los bytes descargados del PDF; modificar un byte hace fallar la verificación; la URL/ID apunta a un archivo real; cada versión conserva su hash independiente y las firmas no se heredan.

### [AUD-NG-060] Vincular cada firma a identidad verificada, documento existente y versión inmutable
- **Origen del Hallazgo:** Auditoria.txt / AUD-NG-060 (TASK-039 / F22-Task02)
- **Archivos Involucrados:** backend/user-service/Code.gs; backend/accounting-service/Code.gs; FirmasConformidades; DocumentosEscolaresEmitidos
- **Dependencias Expuestas:** registerDocumentSignature, validateRolePermission, _verifiedUserId, documentoHash, signatureHash y control de versiones.
- **Descripción del Alcance:** Derivar al firmante de la sesión autenticada, no de identificadores arbitrarios del cliente; recuperar el documento y versión vigentes en servidor; recalcular/verificar su hash antes de aceptar la firma; persistir la versión exacta, método de autenticación y transacción. Impedir firmas sobre documentos inexistentes, hashes suministrados sin verificación y duplicados por reintentos.
- **Criterios de Aceptación:** La firma queda vinculada a un documento/versión existente y hash recalculado; cambiar el documento invalida el intento; identidad e IP provienen de contexto confiable; la repetición de la misma operación no crea firmas duplicadas; una versión nueva exige nueva firma.

### [AUD-NG-061] Persistir y emitir certificados probatorios solo para procesos de firma completados
- **Origen del Hallazgo:** Auditoria.txt / AUD-NG-061 (TASK-040 / F22-Task03)
- **Archivos Involucrados:** backend/user-service/Code.gs; backend/accounting-service/Code.gs; FirmasConformidades; DocumentosEscolaresEmitidos; Google Drive
- **Dependencias Expuestas:** generateSignatureAuditCertificate, registerDocumentSignature, checkAdvancedSignatureStatus y verifySchoolDocumentByCUV.
- **Descripción del Alcance:** Definir estados terminales y transiciones válidas; generar automáticamente el certificado al completar todas las firmas requeridas; persistirlo como artefacto independiente y vincularlo al documento/versión y expediente. Incluir solo firmantes y eventos confirmados, ordenar por timestamp/orden de flujo, incorporar CUV y hash real del PDF, y conservar hash del certificado para verificación posterior. No etiquetar Pendiente, Cancelada, Rechazada o Expirada como completada.
- **Criterios de Aceptación:** Solo una transacción efectivamente completada genera certificado; el archivo persiste y puede recuperarse; su hash se verifica; estados cancelados/rechazados/vencidos no aparecen como completados; la pista coincide con el historial real y conserva el orden de firma.

### [AUD-NG-062] Implementar comunicación real y verificación criptográfica de proveedores PSC
- **Origen del Hallazgo:** Auditoria.txt / AUD-NG-062 (TASK-041 / F22-Task04)
- **Archivos Involucrados:** backend/user-service/Code.gs; integración PSC; TransaccionesFirmaAvanzada; ConfiguracionFirmaAvanzada
- **Dependencias Expuestas:** createAdvancedSignatureRequest, checkAdvancedSignatureStatus, UrlFetchApp, HMAC/firma del proveedor, certificados X.509 y sellado de tiempo.
- **Descripción del Alcance:** Implementar adaptadores reales por proveedor para crear, consultar y recuperar transacciones/documentos. Autenticar callbacks o respuestas mediante el mecanismo oficial del PSC; validar emisor, firma, cadena de certificados, vigencia, revocación, sellado de tiempo y hash del documento. Rechazar cualquier cambio de estado originado por datos de cliente no autenticados y aplicar idempotencia/transiciones terminales.
- **Criterios de Aceptación:** No se crea una transacción como enviada sin confirmación del proveedor; un callback manipulado es rechazado; una firma solo se marca completada tras validar evidencia del PSC y hash coincidente; reintentos no duplican operaciones; se conservan respuestas/certificados verificables.

### [AUD-NG-063] Proteger secretos y credenciales de proveedores de firma
- **Origen del Hallazgo:** Auditoria.txt / AUD-NG-063 (TASK-041 / F22-Task04)
- **Archivos Involucrados:** backend/user-service/Code.gs; ConfiguracionFirmaAvanzada; almacenamiento seguro de configuración
- **Dependencias Expuestas:** configureAdvancedSignatureProvider, getAdvancedSignatureProviderConfig, apiKey y permisos de acceso a hojas.
- **Descripción del Alcance:** Retirar credenciales en texto claro de hojas accesibles a operadores; almacenar secretos en un gestor de secretos o propiedades restringidas, con cifrado/rotación según capacidades del entorno. Exponer únicamente metadatos no sensibles y estado de configuración; registrar quién rota o revoca credenciales sin revelar el valor.
- **Criterios de Aceptación:** Ninguna consulta ordinaria devuelve ni permite leer el secreto; las hojas operativas no contienen API keys en claro; las credenciales pueden rotarse/revocarse; los logs no registran valores secretos.

### [AUD-NG-064] Sustituir pruebas superficiales de Fase 22 por pruebas funcionales verificables
- **Origen del Hallazgo:** Auditoria.txt / AUD-NG-064 (TASK-042 / F22-Task13)
- **Archivos Involucrados:** backend/accounting-service/Code.gs; backend/developer-service/Code.gs; tests/regression/academic-grading-suite.js; tests/regression/
- **Dependencias Expuestas:** PT22-01 a PT22-12, PT22-DEV-01 a PT22-DEV-03, generateSchoolDocument, validateFileBinaryIntegrity, registerDocumentSignature, generateSignatureAuditCertificate y checkAdvancedSignatureStatus.
- **Descripción del Alcance:** Implementar pruebas que invoquen operaciones reales en entorno aislado y verifiquen bytes, archivos, persistencia, estados, permisos, hashes, certificados y respuestas PSC. Reemplazar casos que solo calculan un hash local o verifican la longitud/cadena por aserciones sobre resultados y datos persistidos. Eliminar resultados hardcodeados pass:true y validaciones de presencia como sustituto de pruebas.
- **Criterios de Aceptación:** Cada criterio de TASK-038 a TASK-041 tiene al menos una prueba funcional reproducible; se prueban archivos falsificados/corruptos, cambios de bytes, duplicados, estados no terminales, callback falsificado y permisos; los casos fallidos producen FAIL; no hay expected/actual constantes que se aprueben sin ejecutar la comprobación.

### [AUD-NG-065] Aislar los datos de prueba y corregir la referencia de plantilla de PT22-02
- **Origen del Hallazgo:** Auditoria.txt / AUD-NG-065 (TASK-042 / F22-Task13)
- **Archivos Involucrados:** backend/accounting-service/Code.gs; tests/regression/academic-grading-suite.js; entorno de pruebas de Google Sheets/Drive
- **Dependencias Expuestas:** runPhase22DocumentManagementAndSACERegressionSuite, configureSchoolDocumentTemplate, generateSchoolDocument, PlantillasEscolares y DocumentosEscolaresEmitidos.
- **Descripción del Alcance:** Crear un entorno de prueba desechable o dobles de persistencia; generar IDs de plantilla una sola vez y reutilizar exactamente el mismo ID en los casos dependientes; limpiar los artefactos de prueba al finalizar sin tocar datos institucionales. Separar las pruebas de integración de cualquier Spreadsheet configurado para producción.
- **Criterios de Aceptación:** PT22-02 usa el ID creado por PT22-01; ejecutar la suite repetidamente produce resultados deterministas; las hojas y Drive institucionales no reciben registros de prueba; los fallos limpian o aíslan los artefactos; se conserva evidencia de entorno y resultados.

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 2114-2152; clave TASK-039; asignación única: Secretaria -->

---

<!-- ID: TASK-039 | Fuentes: AUDITORIAS/AUDITORIA_COMPLETADAS_FASE2-T05.md ; Pendientes.md ; pendientes/Secretaria/Pendientes.md -->
### [ ] [TASK-039] Hash SHA-256 y vinculación criptográfica de las firmas con los documentos
- **Hallazgo de origen:** AUD-NG-059; requisito 9; emisión y verificación CUV.
- **Severidad:** Crítica. **Objetivo:** demostrar integridad del archivo emitido y detectar alteraciones posteriores, no solo conservar un hash de metadatos.
- **Acción ejecutable:** generar/obtener el PDF definitivo; calcular SHA-256 sobre sus bytes; persistir hash asociado a versión/archivo; recuperar el binario durante verificación CUV y recalcular hash; bloquear o marcar como alterado si falta el archivo o el hash no coincide.
- **Archivos/módulos:** `backend/accounting-service/Code.gs`; `computeDocumentSHA256`; `generateSchoolDocument`; `verifySchoolDocumentByCUV`; `DocumentosEscolaresEmitidos`; almacenamiento Drive.
- **Dependencias/riesgos:** generación y custodia real del PDF; TASK-351 para estado/privacidad CUV; riesgo de confundir hash de metadatos con integridad binaria.
- **Alcance:** integridad del binario final y su versión exacta; SHA-256 no prueba por sí solo autoría ni validez legal de una firma.
- **Criterios de aceptación:** el PDF existe como archivo persistido; hash calculado sobre bytes; hash se conserva por versión; verificación vuelve a calcular y comparar; alteración, ausencia o sustitución genera rechazo/alerta; pruebas de corrupción y re-subida.
- **Prioridad:** P0. **Estado:** Pendiente de ejecución/revalidación.
- **Evidencia de cierre:** pendiente; el informe indica hash de metadatos y referencia Drive sintética, sin recálculo de bytes del PDF.
- **Origen del Hallazgo:** `AUDITORIA_FASE_22_GESTION_DOCUMENTAL_FORMULARIOS_FIRMA_ELECTRONICA.md` / Sección E (F22-15), Sección G (Defecto 2) y Plan de Trabajo TAREA 22-02
- **Prioridad:** P0
- **Severidad/Clasificación:** Crítica (Integridad documental matemática, valor probatorio inalterable y no repudio)
- **Archivos Involucrados:**
  - `backend/accounting-service/Code.gs` (`generateSchoolDocument`, `verifySchoolDocumentByCUV`)
  - `backend/user-service/Code.gs` (`registerDocumentSignature`)
  - `DocumentosEscolaresEmitidos`
  - `FirmasConformidades`
- **Dependencias Expuestas:** Generación documental, almacenamiento de Drive, registros de firmas, control de versiones y certificados de finalización.
- **Descripción del Alcance:**
  El sistema registra una conformidad digital mediante un token, una fecha y una dirección IP, pero no demuestra criptográficamente que el archivo firmado sea exactamente el mismo que existía al momento de la aceptación.
  Requerimientos Funcionales Detallados:
  1. Huella criptográfica SHA-256 sobre bytes definitivos:
     - Calcular una huella criptográfica SHA-256 del documento definitivo que será aceptado o firmado:
       `hashSHA256 = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, documentBytes)`
       `hashHex = bytesToHex(hashSHA256)`
     - Calcular el hash sobre los bytes del archivo PDF definitivo, no únicamente sobre el HTML de la plantilla o los datos JSON utilizados para generarlo.
     - Asociar la huella al registro de firma y al documento correspondiente en `FirmasConformidades` y `DocumentosEscolaresEmitidos`.
  2. Metadatos de la vinculación criptográfica:
     - Registrar: identificador del documento, identificador de la solicitud de firma, hash SHA-256, versión del documento, identidad del firmante, rol del firmante, fecha y hora de aceptación, método de autenticación utilizado e identificador de la transacción.
     - Diferenciar entre: Hash del documento antes de la firma, Hash del documento final firmado y Hash de los anexos o evidencias (cuando corresponda).
  3. Verificación de inmutabilidad:
     - Impedir que una modificación posterior del documento se presente como parte de la misma firma.
     - Permitir verificar la integridad de un documento comparando su hash actual con el hash registrado al momento de la firma.
     - Si el documento cambia, generar una nueva versión y solicitar nuevamente las firmas que correspondan; una nueva versión nunca hereda las firmas anteriores.
     - Vincular cada firma con una versión concreta e inmutable del documento.
- **Criterios de Aceptación:**
  - [ ] Cada documento firmado tiene un hash SHA-256 asociado y persistido en la base de datos.
  - [ ] El hash corresponde al archivo PDF definitivo generado en Drive.
  - [ ] La verificación de un archivo sin modificaciones devuelve un resultado válido.
  - [ ] La modificación de un solo byte provoca que la verificación de integridad falle inmediatamente.
  - [ ] Una nueva versión del documento no hereda las firmas de una versión anterior.
  - [ ] Las firmas conservan su vínculo con el documento y versión originales.
  - [ ] El historial permite identificar cuándo se generó cada huella y a qué archivo corresponde.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 2153-2200; clave TASK-040; asignación única: Secretaria -->

---

<!-- ID: TASK-040 | Fuentes: AUDITORIAS/AUDITORIA_COMPLETADAS_FASE2-T05.md ; Pendientes.md ; pendientes/Secretaria/Pendientes.md -->
### [ ] [TASK-040] Certificado de finalización y expediente probatorio de cada firma
- **Hallazgo de origen:** AUD-NG-061; requisito 9; flujo de firmas y verificación CUV.
- **Severidad:** Crítica. **Objetivo:** emitir un certificado probatorio persistente y coherente con el estado real, las firmas y la versión exacta del documento.
- **Acción ejecutable:** persistir el certificado como artefacto inmutable con ID/versionado; invocar su generación al completar el flujo; determinar estado final con una máquina de estados explícita; verificar orden y estado de cada firmante; vincular certificado al hash binario y versión documental; permitir consultar su vigencia sin reconstruirlo únicamente en memoria.
- **Archivos/módulos:** `backend/user-service/Code.gs`; `generateSignatureAuditCertificate`; `registerDocumentSignature`; `FirmasConformidades`; `SolicitudesTramites`; `backend/accounting-service/Code.gs`; `verifySchoolDocumentByCUV`.
- **Dependencias/riesgos:** TASK-039 para hash del binario; TASK-351 para exposición CUV; riesgo de declarar completado un trámite pendiente/cancelado/vencido o presentar metadatos como certificado conservado.
- **Alcance:** certificado de finalización y expediente probatorio; no atribuir validez legal avanzada sin mecanismo de firma y análisis aplicables.
- **Criterios de aceptación:** certificado se crea y persiste al cumplirse condiciones de finalización; contiene secuencia/identidad/fecha/estado y hash de la versión exacta; estados Pendiente, Cancelada, Rechazada o Vencida no se etiquetan como exitosos; verificación consulta el artefacto persistido; alteración invalida comprobación.
- **Prioridad:** P0. **Estado:** Pendiente de ejecución/revalidación.
- **Evidencia de cierre:** pendiente; la auditoría detecta objeto en memoria, ausencia de persistencia y clasificación incorrecta de estados.
- **Origen del Hallazgo:** `AUDITORIA_FASE_22_GESTION_DOCUMENTAL_FORMULARIOS_FIRMA_ELECTRONICA.md` / Sección E (F22-19), Sección D y Plan de Trabajo TAREA 22-03
- **Prioridad:** P0
- **Severidad/Clasificación:** Crítica (Pista de auditoría probatoria, evidencia legal de consentimiento y estándar Certificate of Completion)
- **Archivos Involucrados:**
  - `backend/user-service/Code.gs` (`registerDocumentSignature`, nueva función `generateSignatureAuditCertificate`)
  - `backend/accounting-service/Code.gs`
  - `FirmasConformidades`
  - `DocumentosEscolaresEmitidos`
- **Dependencias Expuestas:** `F22-Task02`, gestión de firmas, almacenamiento documental y trazabilidad.
- **Descripción del Alcance:**
  La plataforma conserva información básica de las conformidades, pero no genera un documento consolidado que permita revisar y verificar las evidencias de una transacción de firma para su validez legal ante terceros.
  Requerimientos Funcionales Detallados:
  1. Generador de Certificado de Finalización (Audit Trail):
     - Generar automáticamente un certificado de finalización asociado a cada proceso de firma completado, conteniendo:
       * Identificador único de la transacción.
       * Identificador y tipo de documento.
       * Nombre o descripción del documento.
       * Versión firmada.
       * Hash SHA-256 del archivo.
       * Relación completa de firmantes.
       * Nombre e identidad de cada firmante (según los datos verificados disponibles).
       * Rol con el que participó cada firmante.
       * Método de autenticación utilizado.
       * Fecha y hora exacta de cada aceptación (en formato UTC y Hora Oficial de Honduras GMT-6).
       * Orden en el que se realizaron las firmas.
       * Dirección IP y demás evidencias técnicas proporcionadas.
       * Resultado final del proceso.
       * Token o código de verificación (CUV).
       * Identificador del proveedor de firma (cuando se utilice uno externo).
  2. Preservación del expediente probatorio:
     - El certificado debe permitir distinguir claramente entre una conformidad electrónica simple y una firma avanzada respaldada por un proveedor acreditado.
     - Vincular el certificado al documento y al expediente correspondiente.
     - Conservar el certificado como archivo independiente y relacionarlo con el PDF firmado (o como hoja anexa final del PDF).
     - Evitar que el certificado pueda editarse o regenerarse con datos diferentes a los registrados originalmente.
     - Incorporar verificación de integridad del certificado y del documento al que hace referencia.
- **Criterios de Aceptación:**
  - [ ] Una transacción completada genera su certificado automáticamente.
  - [ ] El certificado identifica a todos los firmantes y sus respectivas actuaciones.
  - [ ] Los datos coinciden con el historial real de la transacción.
  - [ ] El certificado identifica el hash del documento firmado.
  - [ ] El certificado puede descargarse y consultarse desde el expediente escolar.
  - [ ] Una modificación del documento no altera retroactivamente el certificado.
  - [ ] Las transacciones canceladas, rechazadas o vencidas no se presentan como firmas completadas.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 2201-2242; clave TASK-041; asignación única: Secretaria -->

---

<!-- ID: TASK-041 | Fuentes: Pendientes.md ; pendientes/Secretaria/Pendientes.md -->
### [ ] [TASK-041] Integración con firma electrónica avanzada y proveedores de certificación (Decreto 149-2013)
- **Origen del Hallazgo:** `AUDITORIA_FASE_22_GESTION_DOCUMENTAL_FORMULARIOS_FIRMA_ELECTRONICA.md` / Sección C (7), Sección E (F22-16) y Plan de Trabajo TAREA 22-04
- **Prioridad:** P0
- **Severidad/Clasificación:** Crítica (Cumplimiento normativo hondureño, contratos de matrícula vinculantes y convenios laborales docentes)
- **Archivos Involucrados:**
  - `backend/accounting-service/Code.gs`
  - `backend/user-service/Code.gs`
  - Hoja `ConfiguracionFirmaAvanzada`
- **Dependencias Expuestas:** `F22-Task02`, `F22-Task03`, gestión documental, control de versiones, proveedores de certificación y revisión jurídica.
- **Descripción del Alcance:**
  La plataforma dispone de mecanismos de aceptación electrónica simple, pero no de una integración con un Prestador de Servicios de Certificación (PSC) que permita gestionar los casos que requieran firma electrónica avanzada bajo el marco legal de Honduras.
  Requerimientos Funcionales Detallados:
  1. Arquitectura de integración con proveedores de certificación:
     - Diseñar una arquitectura de integración con proveedores de firma electrónica y certificación compatibles con el marco normativo hondureño (Decreto Legislativo No. 149-2013 y Acuerdo Ejecutivo No. 41-2014).
     - Incorporar una capa de integración desacoplada del proveedor específico que permita configurar credenciales, endpoints, certificados y parámetros de cada proveedor de forma segura.
     - Permitir seleccionar el mecanismo de firma según la naturaleza del documento:
       * Aceptación electrónica simple.
       * Firma electrónica mediante proveedor externo.
       * Firma electrónica avanzada (con certificado X.509 v3 y sellado de tiempo cualificado), cuando corresponda.
  2. Gestión transaccional y validación:
     - Soportar: creación de solicitudes de firma, identificación y autenticación de firmantes, entrega del documento, recepción del resultado, recuperación del documento firmado, recepción y validación de certificados y consulta del estado de la transacción.
     - Verificar la autenticidad del resultado recibido y la integridad del documento.
     - Registrar el identificador de transacción proporcionado por el proveedor.
     - Gestionar fallos de comunicación, solicitudes pendientes, vencimientos, cancelaciones y reintentos sin generar firmas duplicadas.
     - No considerar una firma completada hasta recibir y verificar la confirmación correspondiente del proveedor.
  3. Consideraciones normativas hondureñas:
     - La plataforma no debe afirmar que una firma dibujada, un nombre escrito, un token o una casilla constituyen automáticamente una firma electrónica avanzada.
     - Los contratos de matrícula y laborales deben someterse a revisión jurídica para definir el mecanismo obligatorio.
- **Criterios de Aceptación:**
  - [ ] Los tipos de documentos pueden configurarse según el mecanismo de firma requerido.
  - [ ] Una solicitud externa puede crearse y consultarse.
  - [ ] La plataforma identifica correctamente los estados pendientes, completados, rechazados, cancelados y vencidos.
  - [ ] Un documento no se marca como firmado si el proveedor no confirma el resultado.
  - [ ] Se verifica la integridad del documento recibido.
  - [ ] Se conserva la evidencia de la transacción.
  - [ ] Los fallos de conexión no generan firmas duplicadas ni documentos inconsistentes.
  - [ ] La solución permite sustituir o incorporar otro proveedor sin reconstruir todo el módulo.
  - [ ] No se presentan como avanzadas las firmas que no cumplen los requisitos correspondientes.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 4022-4056; clave TASK-085; asignación única: Secretaria -->

---

<!-- ID: TASK-091 | Fuentes: Pendientes.md ; pendientes/Secretaria/Pendientes.md -->
### [ ] [TASK-091] [F31-T01] [P0] Editor Universal de Documentos Enriquecidos (WYSIWYG)
- **Orden de Ejecución:** 1
- **Prioridad:** P0 (Crítica)
- **Componentes Afectados:**
  - `backend/accounting-service/Code.gs` (`saveDocumentTemplateWysiwyg`, `previewWysiwygDocument`)
  - `js/teacher.js`, `js/ui-common.js`
  - Hoja: `PlantillasEscolares`
- **Subcapacidades Relacionadas:** F31-01, F31-02, F31-10.
- **Origen del Hallazgo:** `AUDITORIA_FASE_31_DISENADOR_UNIVERSAL_DOCUMENTOS_PLANTILLAS.md` / Sección B (F31-01, F31-02) y Backlog de Implementación F31-T01.
- **Problema o Carencia:**
  La plataforma permite configurar contenido HTML y posicionar campos dinámicos sobre documentos PDF, pero todavía no ofrece una experiencia completa de edición de documentos desde cero. El editor actual no sustituye las capacidades de un procesador de textos para elaborar circulares, actas, contratos, reglamentos, constancias, informes y documentos institucionales extensos.
- **Requisitos Funcionales y Técnicos Convergentes:**
  1. *Edición de contenido:*
     - Crear documentos en blanco y a partir de plantillas existentes.
     - Insertar, seleccionar, modificar, copiar, cortar, pegar y eliminar contenido.
     - Deshacer y rehacer operaciones con pila de historial fluida.
     - Seleccionar fragmentos, párrafos, tablas e imágenes.
     - Permitir copiar contenido desde otras aplicaciones conservando, cuando sea posible, el formato compatible.
     - Opciones configurables de pegado: conservar formato original, adaptar al estilo del documento o pegar únicamente texto plano (`MODO_PEGADO_PREDETERMINADO`).
     - Mantener la edición fluida en documentos extensos sin bloqueos de memoria.
  2. *Formato de texto:*
     - Familia tipográfica, tamaño, color y resaltado.
     - Negrita, cursiva, subrayado, tachado y subíndice/superíndice.
     - Alineación izquierda, derecha, centrada y justificada.
     - Interlineado, espaciado anterior y posterior, sangrías y tabulaciones.
     - Listas numeradas y con viñetas, incluyendo listas multinivel.
     - Estilos reutilizables para títulos (H1, H2, H3), subtítulos, párrafos, citas y notas.
     - Aplicación y actualización coherente de estilos en todo el documento.
  3. *Configuración de página:*
     - Tamaños normalizados A4, Carta (Letter), Oficio (Legal) y tamaños personalizados.
     - Orientación vertical y horizontal con márgenes independientes (superior, inferior, izquierdo, derecho).
     - Saltos de página y de sección controlados.
     - Columnas y distribución de contenido periodístico/multicolumna.
     - Configuración diferenciada de encabezados y pies de página.
     - Numeración automática de páginas con formato (`Página X de Y`), posición y numeración inicial configurable.
     - Diferenciación de primera página y páginas pares e impares.
  4. *Tablas estructuradas:*
     - Insertar tablas y configurar filas y columnas.
     - Agregar y eliminar filas o columnas dinámicamente.
     - Combinar y dividir celdas horizontal y verticalmente.
     - Configurar bordes, colores, alineación, márgenes internos (padding) y dimensiones.
     - Controlar ajuste de texto y tamaño de celdas evitando que excedan los márgenes de impresión.
     - Permitir que las tablas continúen entre páginas controlando el comportamiento de sus filas (evitar cortes a mitad de renglón).
     - Permitir marcar filas de encabezado para que se repitan en páginas posteriores.
  5. *Imágenes y elementos insertables:*
     - Insertar imágenes desde archivos o recursos institucionales autorizados.
     - Modificar tamaño, proporción, alineación y posición relativa.
     - Controlar el ajuste del texto alrededor de las imágenes (en línea, cuadrado, detrás/delante del texto).
     - Insertar logotipos, sellos, líneas divisoras, formas y otros elementos gráficos.
     - Permitir insertar enlaces e identificativos institucionales, asegurando que las imágenes embebidas no desaparezcan al exportar o trasladar el documento.
  6. *Compatibilidad y coexistencia:*
     - Separar el contenido, los estilos y la configuración de página para permitir su reutilización.
     - Representación de página visual que se aproxime fielmente al resultado final de impresión.
     - Conservar la compatibilidad con el editor PDF Overlay, que debe continuar disponible para trabajar sobre documentos preimpresos.
- **Criterios de Aceptación:**
  - [ ] Se puede crear, editar, guardar, cerrar y volver a abrir un documento sin perder su contenido ni formato.
  - [ ] Las operaciones de deshacer y rehacer funcionan sobre las acciones principales.
  - [ ] Se pueden insertar y modificar tablas con celdas combinadas.
  - [ ] Los saltos de página, encabezados, pies y numeración se conservan en el PDF.
  - [ ] La vista previa y el archivo exportado mantienen una distribución coherente.
  - [ ] Los documentos extensos no producen bloqueos, pérdida de contenido ni degradación inaceptable del editor.
  - [ ] El editor PDF Overlay sigue funcionando de forma independiente y compatible con el nuevo editor.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 4287-4328; clave TASK-092; asignación única: Secretaria -->

---

<!-- ID: TASK-092 | Fuentes: Pendientes.md ; pendientes/Secretaria/Pendientes.md -->
### [ ] [TASK-092] [F31-T02] [P0] Motor de Maquetación, Paginación y Fidelidad de Impresión
- **Orden de Ejecución:** 2
- **Prioridad:** P0 (Crítica)
- **Componentes Afectados:**
  - `backend/accounting-service/Code.gs` (`renderPaginatedDocumentHtml`, `validateDocumentLayoutPrintability`)
  - `js/ui-common.js`
- **Subcapacidades Relacionadas:** F31-02, F31-10.
- **Origen del Hallazgo:** `AUDITORIA_FASE_31_DISENADOR_UNIVERSAL_DOCUMENTOS_PLANTILLAS.md` / Sección B (F31-02, F31-10) y Backlog de Implementación F31-T02.
- **Problema o Carencia:**
  La generación PDF ya produce documentos de varias páginas y supera pruebas básicas de impresión. Sin embargo, se requiere ampliar la maquetación para asegurar que el motor conserve fielmente diseños complejos elaborados con el editor enriquecido o importados desde DOCX/PDF, evitando cortes inadecuados de tablas o imágenes desplazadas.
- **Requisitos Funcionales y Técnicos Convergentes:**
  1. *Fidelidad de representación física:*
     - Representación de páginas que respete estrictamente los límites físicos del papel (A4, Carta, Oficio).
     - Correspondencia milimétrica entre las dimensiones del editor y las dimensiones del PDF generado.
     - Control estricto de saltos automáticos y manuales de página.
  2. *Prevención de desbordamientos y cortes:*
     - Evitar encabezados y pies superpuestos al contenido.
     - Evitar que párrafos, títulos o filas de tablas queden divididos de manera inadecuada (control de líneas viudas y huérfanas).
     - Permitir controlar si un párrafo debe mantenerse junto al siguiente (`keep_with_next`).
     - Mantener encabezados de tabla al continuar una tabla en otra página.
     - Controlar imágenes para que no se desplacen, deformen o invadan márgenes.
  3. *Secciones y tipografías:*
     - Soportar documentos con orientación (vertical/horizontal) y márgenes diferentes por sección.
     - Diferenciar encabezados y pies de primera página, páginas pares e impares.
     - Gestión de fuentes instaladas, fuentes web incorporadas y sustituciones tipográficas controladas.
     - Evitar cortes de texto, caracteres sustituidos, elementos invisibles y páginas vacías inesperadas.
     - Mantener enlaces, numeración, tablas y elementos gráficos durante la exportación.
  4. *Herramientas de validación:*
     - Validaciones previas a la exportación para detectar desbordamientos y advertir al usuario.
     - Vista previa de impresión con navegación fluida entre páginas antes de emitir.
- **Criterios de Aceptación:**
  - [ ] Se generan documentos de varias páginas con tablas extensas, imágenes y encabezados diferenciados.
  - [ ] No se pierden filas, párrafos, imágenes ni elementos por desbordamientos.
  - [ ] Los encabezados de tablas se repiten cuando se configura esa opción.
  - [ ] Los márgenes y tamaños de papel coinciden con la configuración seleccionada.
  - [ ] La vista previa permite detectar los mismos problemas que aparecerían en el PDF.
  - [ ] Se comprueba el resultado en documentos de distintas extensiones y complejidades.
  - [ ] Se verifica la impresión desde navegadores de escritorio y dispositivos móviles compatibles.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 4329-4370; clave TASK-093; asignación única: Secretaria -->

---

<!-- ID: TASK-093 | Fuentes: Pendientes.md ; pendientes/Secretaria/Pendientes.md -->
### [ ] [TASK-093] [F31-T03] [P0] Importación Avanzada de Documentos DOCX (Word 2013-2017+)
- **Orden de Ejecución:** 3
- **Prioridad:** P0 (Crítica)
- **Componentes Afectados:**
  - `backend/accounting-service/Code.gs` (`importDocxDocumentBinary`, `parseOpenXmlDocumentStructure`)
  - `js/teacher.js`
  - Hoja: `PlantillasEscolares`
- **Subcapacidades Relacionadas:** F31-08.
- **Origen del Hallazgo:** `AUDITORIA_FASE_31_DISENADOR_UNIVERSAL_DOCUMENTOS_PLANTILLAS.md` / Sección B (F31-08) y Backlog de Implementación F31-T03.
- **Problema o Carencia:**
  La importación actual permite recuperar contenido textual y generar borradores HTML, pero no reconstruye de forma suficiente la estructura interna de documentos DOCX. Esto limita la reutilización de documentos institucionales elaborados previamente en procesadores de texto Word (2013, 2016 y 2017).
- **Requisitos Funcionales y Técnicos Convergentes:**
  1. *Compatibilidad OpenXML completa:*
     - Importar archivos DOCX generados por Word 2013, 2016 y 2017, así como versiones posteriores.
     - Reconocer las estructuras OpenXML correspondientes y advertir formatos binarios antiguos no soportados (.doc de Word 97-2003).
     - No presentar un archivo como totalmente compatible cuando solo se haya recuperado su texto.
  2. *Elementos que deben recuperarse y mapearse:*
     - Texto y estructura de párrafos, tipografías, tamaños, colores y estilos.
     - Títulos y jerarquías de encabezados (H1, H2, H3).
     - Alineación, interlineado, sangrías y listas multinivel.
     - Tablas con bordes, dimensiones relativas, alineación y celdas combinadas o anidadas.
     - Imágenes incrustadas, extrayéndolas como adjuntos y preservando su posición relativa y proporciones.
     - Encabezados, pies de página, numeración de páginas y listas.
     - Márgenes, orientación, tamaño de papel, saltos de página y de sección.
     - Hipervínculos, notas al pie y marcadores que puedan convertirse en variables dinámicas.
  3. *Conversión, revisión y seguridad:*
     - Convertir el DOCX en un borrador editable en el diseñador sin alterar el archivo original.
     - Informe de importación detallando elementos conservados, transformados, omitidos o sustituidos.
     - Permitir corregir manualmente los elementos cuya conversión no sea exacta antes de guardar.
     - Prohibición estricta de ejecución de macros, scripts VBA o contenidos activos procedentes de los archivos importados.
- **Criterios de Aceptación:**
  - [ ] Se importan documentos de prueba creados con Word 2013, 2016 y 2017.
  - [ ] Se conservan textos, estilos, tablas, imágenes, encabezados y configuración de página en los casos compatibles.
  - [ ] Las tablas anidadas y las celdas combinadas se recuperan correctamente cuando estén soportadas.
  - [ ] Se identifican los elementos no compatibles y no se descartan silenciosamente.
  - [ ] El documento original permanece intacto en Google Drive.
  - [ ] Se comparan visualmente el original y el resultado importado mediante un conjunto de documentos representativos.
  - [ ] La importación de un archivo inválido, incompleto o manipulado no bloquea el sistema ni compromete otros documentos.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 4371-4406; clave TASK-094; asignación única: Secretaria -->

---

<!-- ID: TASK-094 | Fuentes: Pendientes.md ; pendientes/Secretaria/Pendientes.md -->
### [ ] [TASK-094] [F31-T04] [P0] Importación Avanzada de PDF y Reutilización de Documentos Preimpresos
- **Orden de Ejecución:** 4
- **Prioridad:** P0 (Crítica)
- **Componentes Afectados:**
  - `js/teacher.js` (`openPdfOverlayEditor`, `renderPdfPage`, `savePdfOverlayTemplate`)
  - `backend/accounting-service/Code.gs`
  - Hoja: `PlantillasEscolares`
- **Subcapacidades Relacionadas:** F31-09, F31-02.
- **Origen del Hallazgo:** `AUDITORIA_FASE_31_DISENADOR_UNIVERSAL_DOCUMENTOS_PLANTILLAS.md` / Sección B (F31-09) y Backlog de Implementación F31-T04.
- **Problema o Carencia:**
  El editor PDF Overlay permite visualizar documentos y posicionar campos superpuestos. Sin embargo, visualizar un PDF y superponer campos no equivale a interpretar, editar o reutilizar toda su estructura documental ni diferenciar entre PDFs vectoriales nativos y documentos escaneados.
- **Requisitos Funcionales y Técnicos Convergentes:**
  1. *Análisis e importación de archivos PDF:*
     - Importar PDF digitales con texto seleccionable y PDF escaneados compuestos por imágenes de mapa de bits.
     - Identificar si cada página contiene texto vectorial, imágenes o combinación de ambos.
     - Conservar el archivo PDF original como fuente inalterable de referencia en Google Drive.
     - Mantener el orden, tamaño, orientación y rotación de las páginas importadas.
     - Reconocer, cuando sea técnicamente viable, formularios PDF interactivos existentes (AcroForms) y sus campos.
  2. *Reutilización de documentos preimpresos:*
     - Trabajar sobre el PDF original como fondo fijo inalterable y colocar campos dinámicos superpuestos encima.
     - Definir el tipo de documento: formulario rellenable, documento de emisión oficial o plantilla de impresión.
     - Incorporar OCR cuando exista una capacidad técnicamente disponible para recuperar texto de documentos escaneados, diferenciando con claridad el texto reconocido por OCR del texto vectorial original.
     - Herramientas de alineación, ajuste magnético a rejilla, selección múltiple y posicionamiento milimétrico de campos superpuestos.
     - Seleccionar páginas específicas para aplicar campos dinámicos.
     - Mantener la alineación de los campos con el documento base en diferentes tamaños de pantalla y durante la exportación final a PDF.
- **Criterios de Aceptación:**
  - [ ] Se importan PDF digitales y escaneados de varias páginas conservando orientación y dimensiones originales.
  - [ ] Los campos superpuestos mantienen su posición milimétrica exacta al generar el PDF final.
  - [ ] El sistema no presenta un PDF escaneado como si su texto fuera editable cuando no se ha aplicado OCR.
  - [ ] El documento fuente no se altera en el almacenamiento.
  - [ ] La descarga final conserva el fondo original y los campos dinámicos agregados.
  - [ ] El editor Overlay continúa siendo plenamente funcional en navegadores y dispositivos compatibles.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 4407-4453; clave TASK-095; asignación única: Secretaria -->

---

<!-- ID: TASK-095 | Fuentes: Pendientes.md ; pendientes/Secretaria/Pendientes.md -->
### [ ] [TASK-095] [F31-T05] [P0] Sistema de Campos Dinámicos, Variables Institucionales y Secciones Repetibles
- **Orden de Ejecución:** 5
- **Prioridad:** P0 (Crítica)
- **Componentes Afectados:**
  - `backend/accounting-service/Code.gs` (`renderDynamicDocumentTemplate`, `evaluateTemplateLoopingSections`)
  - `backend/academic-service/Code.gs`
  - Hoja: `CatalogoVariablesDocumentales`
- **Subcapacidades Relacionadas:** F31-06, F31-23.
- **Origen del Hallazgo:** `AUDITORIA_FASE_31_DISENADOR_UNIVERSAL_DOCUMENTOS_PLANTILLAS.md` / Sección B (F31-06) y Backlog de Implementación F31-T05.
- **Problema o Carencia:**
  El catálogo actual permite insertar variables individuales escalares relacionadas con estudiantes, institución, trámites y documentos. No obstante, no ofrece una solución completa para representar colecciones de datos de longitud variable dentro de una plantilla, como asignaturas, calificaciones, responsables, conceptos de cobro o registros de asistencia.
- **Requisitos Funcionales y Técnicos Convergentes:**
  1. *Catálogo centralizado de variables dinámicas:*
     - Mantener catálogo clasificado por entidad y departamento (Estudiante, Familia, Personal, Académico, Financiero, Administrativo).
     - Nombre legible, descripción, tipo de dato, origen y perfiles autorizados para su uso.
     - Diferenciar campos individuales, campos calculados y colecciones iterables.
     - Incorporar nuevas fuentes institucionales sin necesidad de modificar individualmente cada plantilla.
  2. *Secciones repetibles (Looping Tags):*
     - Bloques de iteración: `{{#each asignaturas}}...{{/each}}`, `{{#each cargos}}...{{/each}}`, `{{#each abonos}}...{{/each}}`.
     - Tablas dinámicas con filas generadas automáticamente según los registros reales del alumno o trámite.
     - Definir encabezados, filas de detalle y filas de totales/subtotales calculados.
     - Configuración de comportamiento cuando la colección está vacía (`TEXTO_VACIO`, `OCULTAR_TABLA`, `ADVERTENCIA_BLOQUEANTE`).
     - Filtros y ordenamientos autorizados sobre los elementos de la colección.
     - Anidamiento de estructuras repetibles controlado y predecible.
  3. *Ejemplos y fuentes cubiertas:*
     - Boletines y cuadros de notas con asignaturas, períodos, calificaciones ponderadas y observaciones.
     - Estados de cuenta con conceptos, cargos arancelarios, abonos, descuentos y saldos.
     - Constancias con múltiples responsables, tutores o participantes.
     - Informes de asistencia acumulada e incidencias disciplinarias.
     - Documentos administrativos con inventario de bienes o insumos despachados.
  4. *Resolución segura y preservación de valores:*
     - Resolver únicamente variables autorizadas para el usuario y contexto mediante validación estricta en servidor.
     - Formatos configurables para fechas (`formatDate`), cantidades, moneda hondureña (`formatCurrency:"HNL"`) y conversión de números a letras (`numberToWords`).
     - Evitar que datos ingresados por usuarios se interpreten como código ejecutable.
     - Capturar instantánea inmutable de los datos utilizados al momento de generar el documento oficial, asegurando que cambios posteriores en expedientes, notas o cobros no alteren documentos históricos emitidos.
- **Criterios de Aceptación:**
  - [ ] Las variables escalares existentes continúan funcionando con compatibilidad retrospectiva total.
  - [ ] Una plantilla puede generar tablas con cantidades diferentes de filas según los registros de la base de datos.
  - [ ] Las colecciones vacías, incompletas o con valores nulos se procesan según su configuración.
  - [ ] Los cálculos y totales coinciden con los datos de origen de las hojas transaccionales.
  - [ ] Los datos no autorizados no pueden recuperarse mediante manipulación de variables o peticiones directas.
  - [ ] Los documentos generados conservan una instantánea de los valores utilizados al emitir.
  - [ ] Los cambios posteriores en expedientes, notas o pagos no modifican documentos emitidos anteriormente.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 4454-4490; clave TASK-096; asignación única: Secretaria -->

---

<!-- ID: TASK-096 | Fuentes: Pendientes.md ; pendientes/Secretaria/Pendientes.md -->
### [ ] [TASK-096] [F31-T06] [P0] Generación Masiva de Documentos y Procesamiento Resiliente por Lotes
- **Orden de Ejecución:** 6
- **Prioridad:** P0 (Crítica)
- **Componentes Afectados:**
  - `backend/accounting-service/Code.gs` (`generateBulkSchoolDocumentsBatch`, `downloadDocumentPackageZip`, `resumeBulkGenerationProcess`)
  - Hoja: `DocumentosEscolaresEmitidos`, `LotesGeneracionDocumental`
- **Subcapacidades Relacionadas:** F31-07, F31-19.
- **Origen del Hallazgo:** `AUDITORIA_FASE_31_DISENADOR_UNIVERSAL_DOCUMENTOS_PLANTILLAS.md` / Sección B (F31-07) y Backlog de Implementación F31-T06.
- **Problema o Carencia:**
  La generación individual y por lotes está contemplada en el motor actual, pero se requiere una solución operativa completa para emitir documentos de grupos, grados, secciones o conjuntos de usuarios sin depender de una ejecución sincrónica prolongada que pueda agotar las cuotas o tiempos máximos de Google Apps Script.
- **Requisitos Funcionales y Técnicos Convergentes:**
  1. *Selección y previsualización de destinatarios:*
     - Seleccionar grupos mediante filtros autorizados: grado, sección, nivel, departamento o lote de expedientes.
     - Mostrar el número exacto de destinatarios antes de iniciar el procesamiento.
     - Seleccionar la plantilla y verificar que corresponde a una versión publicada y aprobada.
     - Previsualizar una muestra aleatoria antes de lanzar la generación masiva completa.
  2. *Procesamiento resiliente en bloques:*
     - Ejecución segmentada en bloques (ej. 10 a 15 documentos por bloque) con persistencia de estado intermedio en `LotesGeneracionDocumental`.
     - Mostrar barra de progreso en tiempo real identificando documentos exitosos, fallidos y pendientes.
     - Concurrencia atómica con `LockService` garantizando numeración correlativa secuencial y CUV único sin colisiones.
     - Los fallos individuales en un registro no invalidan ni detienen el resto del lote.
  3. *Reanudación, descarga consolidada y auditoría:*
     - Capacidad de reanudar un lote interrumpido procesando únicamente los elementos pendientes, sin regenerar ni duplicar correlativos de documentos ya emitidos.
     - Generación de paquete ZIP descargable conteniendo todos los archivos PDF emitidos con nomenclatura de archivo estandarizada.
     - Registro de auditoría completo: usuario que inició, fecha, plantilla, versión, destinatarios y resultado.
     - Políticas de expiración y limpieza automática de archivos temporales en Drive.
- **Criterios de Aceptación:**
  - [ ] Se generan documentos para grupos con diferentes cantidades de destinatarios sin exceder tiempos de ejecución de Apps Script.
  - [ ] Cada documento contiene los datos del destinatario correcto.
  - [ ] El progreso refleja los resultados reales y los fallos individuales no abortan el lote completo.
  - [ ] Los reintentos no duplican documentos ni correlativos institucionales.
  - [ ] El paquete ZIP contiene todos los documentos exitosos organizados con nombres legibles.
  - [ ] Se puede consultar el historial del proceso y verificar los límites reales antes de configurar tamaños de lote.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 4494-4533; clave TASK-098; asignación única: Secretaria -->

---

<!-- ID: TASK-098 | Fuentes: Pendientes.md ; pendientes/Secretaria/Pendientes.md -->
### [ ] [TASK-098] [P0] Motor de Estampado Binario y Aplanado de Campos sobre el PDF Original
- **Orden de Ejecución:** 1
- **Prioridad:** P0 (Crítica)
- **Componentes Afectados:**
  - `backend/accounting-service/Code.gs` (`stampOverlayFieldsOnPdfBinary`, `generateFlattenedSchoolDocumentPdf`, `verifySchoolDocumentByCUV`)
  - `js/teacher.js`
  - Hoja: `DocumentosEscolaresEmitidos`, `PlantillasEscolares`
- **Subcapacidades Relacionadas:** F32-09, F32-10.
- **Origen del Hallazgo:** `AUDITORIA_FASE_32_EDITOR_VISUAL_PDF_CAMPOS_SUPERPUESTOS.md` / Sección B (10), Sección G y Backlog F32-Task01.
- **Problema Detectado y Riesgos:**
  La plataforma conserva las coordenadas relativas de los campos y registra emisiones oficiales con correlativo y CUV. Sin embargo, la generación documental todavía depende principalmente de la conversión de HTML a PDF. No está consolidada la incorporación directa de los valores sobre el archivo PDF binario original, impidiendo garantizar que los documentos generados conserven exactamente el diseño, dimensiones y geometría del documento preimpreso.
- **Requisitos Funcionales y Técnicos Convergentes:**
  1. *Motor de composición y estampado binario:*
     - Abrir el archivo binario original del PDF y agregar contenido sobre sus páginas sin reconstruirlas mediante HTML.
     - Recuperar la configuración de `overlayFields` y asociar cada valor capturado con su campo correspondiente.
     - Convertir coordenadas normalizadas en coordenadas reales del documento: posición horizontal ($X$), vertical ($Y$), ancho ($W$) y alto ($H$).
     - Considerar dimensiones reales de cada página, su orientación y rotación, así como los límites de cuadros de página PDF (`MediaBox`, `CropBox` y `BleedBox`).
     - Resolver matemáticamente la diferencia entre el origen de coordenadas de la interfaz (esquina superior izquierda, eje Y hacia abajo) y el formato PDF (esquina inferior izquierda, eje Y hacia arriba):
       $$X_{pdf} = xRatio 	imes Ancho_{pagina}, \quad Y_{pdf} = Alto_{pagina} - (yRatio + hRatio) 	imes Alto_{pagina}$$
     - Aplicar los valores capturados exactamente sobre la página correspondiente manteniendo intactos elementos gráficos, textos, imágenes, fondos, sellos, membretes, logotipos, tablas y líneas del documento original.
  2. *Tipos de campos procesados y modalidades de emisión:*
     - Estampar: texto plano, texto multilínea, fechas, casillas marcadas, selecciones, firmas manuscritas digitalizadas, imágenes y códigos QR.
     - Modalidad interactiva vs aplanada: permitir emitir PDF interactivo con campos rellenables activos o PDF aplanado (*flattened*) donde los valores quedan incrustados visualmente al contenido sin controles editables. En caso de discrepancia en requerimientos, habilitar parámetro configurable en la plantilla (`MODO_EMISION_PDF`: `APLANADO_INMUTABLE` vs `INTERACTIVO_RELLENABLE`).
     - Configurar fuentes tipográficas, tamaños, alineación, colores y ajuste de texto.
  3. *Trazabilidad, CUV y atomicidad:*
     - Incorporar el CUV (`CUV-YYYY-XXXXXX`) y el número correlativo anual (`YYYY-XXXXXX`) en el pie o encabezado sin alterar la integridad del documento base.
     - Generar el hash criptográfico SHA-256 del documento final una vez completadas todas las operaciones de estampado.
     - Bloqueo de concurrencia atómico mediante `LockService.getScriptLock()` para impedir colisiones o folios duplicados.
     - Si la operación falla, rechazar la transacción y no registrar como emitido un documento incompleto o corrupto.
- **Criterios de Aceptación:**
  - [ ] Genera documentos a partir de PDFs de una página y multipágina verticales y horizontales conservando el 100% del fondo original.
  - [ ] Los valores aparecen exactamente en las coordenadas configuradas sin desplazamiento geométrico perceptible.
  - [ ] Se verifica en Adobe Acrobat Reader, Foxit y lectores web independientes que los campos aplanados no son editables.
  - [ ] La modalidad interactiva conserva los campos activos cuando así se configure.
  - [ ] El CUV y correlativo identifican unívocamente el documento emitido y su hash coincide en la base de datos.
  - [ ] Los reintentos de red no producen documentos duplicados con folios inconsistentes.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 4534-4564; clave TASK-099; asignación única: Secretaria -->

---

<!-- ID: TASK-099 | Fuentes: Pendientes.md ; pendientes/Secretaria/Pendientes.md -->
### [ ] [TASK-099] [P0] Sistema de Coordenadas de Precisión, Entradas Numéricas y Rejilla Magnética
- **Orden de Ejecución:** 2
- **Prioridad:** P0 (Crítica)
- **Componentes Afectados:**
  - `teacher-dashboard.html` (`#field-props-form`)
  - `js/teacher.js` (`updateFieldPropsPanel`, `applyFieldCoordInputs`, `toggleGridSnapping`)
- **Subcapacidades Relacionadas:** F32-03, F32-05.
- **Origen del Hallazgo:** `AUDITORIA_FASE_32_EDITOR_VISUAL_PDF_CAMPOS_SUPERPUESTOS.md` / Sección B (4), Sección G y Backlog F32-Task02.
- **Problema Detectado y Riesgos:**
  El editor utiliza `xRatio`, `yRatio`, `wRatio` y `hRatio`, lo que mantiene la posición relativa al variar el zoom. Sin embargo, la colocación depende exclusivamente del mouse y los valores de posición solo se leen como texto informativo, sin permitir entradas numéricas de precisión ni rejilla magnética para alinear casillas contiguas en formularios densos.
- **Requisitos Funcionales y Técnicos Convergentes:**
  1. *Entradas numéricas bidireccionales de coordenadas:*
     - Entradas numéricas editables en el panel de propiedades para: X, Y, Ancho y Alto.
     - Permitir introducir y visualizar valores en porcentajes (`%`) y en unidades físicas reales: milímetros (`mm`) y puntos tipográficos PDF (`pt`).
     - Conversión automática bidireccional entre unidades sin pérdida de precisión ni redondeos acumulativos.
     - Permitir configurar el origen de referencia (esquina superior izquierda por defecto).
  2. *Rejilla visual y ajuste magnético (Snap to Grid):*
     - Rejilla visual superpuesta activable y desactivable con espaciado configurable (1%, 2%, 5% o medidas en mm).
     - Ajuste magnético de campos a: líneas de rejilla, bordes de página, bordes de otros campos y centros de elementos cercanos.
     - Guías dinámicas de alineación inteligente (*smart guides*) que se iluminan cuando dos o más campos comparten bordes o centros.
     - Restricción de campos dentro de los límites físicos de la página salvo excepción autorizada.
     - Mantener la precisión geométrica inalterada independientemente del nivel de zoom del visor.
- **Criterios de Aceptación:**
  - [ ] El usuario puede posicionar un campo introduciendo valores numéricos exactos en milímetros, puntos o porcentaje.
  - [ ] Al cambiar el nivel de zoom o rotación de página, la posición del campo permanece milimétricamente inalterada.
  - [ ] El ajuste magnético facilita alinear casillas adyacentes sin generar desplazamientos acumulativos al arrastrar.
  - [ ] Las coordenadas guardadas en la plantilla reproducen fielmente la misma posición al reabrir el editor y al generar el PDF.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 4565-4599; clave TASK-100; asignación única: Secretaria -->

---

<!-- ID: TASK-100 | Fuentes: Pendientes.md ; pendientes/Secretaria/Pendientes.md -->
### [ ] [TASK-100] [P0] Motor Inteligente de Ajuste Tipográfico y Control de Desbordamiento (Auto-Shrink)
- **Orden de Ejecución:** 3
- **Prioridad:** P0 (Crítica)
- **Componentes Afectados:**
  - `js/teacher.js` (`calculateAutoShrinkFontSize`)
  - `backend/accounting-service/Code.gs`
- **Subcapacidades Relacionadas:** F32-05, F32-11.
- **Origen del Hallazgo:** `AUDITORIA_FASE_32_EDITOR_VISUAL_PDF_CAMPOS_SUPERPUESTOS.md` / Sección B (5, 11), Sección G y Backlog F32-Task03.
- **Problema Detectado y Riesgos:**
  Los textos extensos (nombres largos, motivos de excusas, observaciones pedagógicas) quedan truncados o desbordan la caja si las dimensiones son fijas, comprometiendo la legibilidad y validez oficial del certificado.
- **Requisitos Funcionales y Técnicos Convergentes:**
  1. *Ajuste tipográfico automático (Auto-Shrink):*
     - Reducción progresiva y controlada del tamaño de fuente cuando el texto no quepa en el ancho o alto disponible.
     - Configuración de tamaño preferido, tamaño máximo y tamaño mínimo admisible por campo (ej. mínimo 7 pt para garantizar legibilidad en impresión).
     - Cálculo de espacio ocupado mediante métricas tipográficas reales basadas en Canvas `measureText()` y fuentes PDF reales.
  2. *Políticas configurables de desbordamiento:*
     - Opciones disponibles por campo:
       - `REDUCCION_AUTOMATICA`: Reduce el tamaño de fuente hasta el límite mínimo configurado.
       - `AJUSTE_MULTILINEA`: Divide en líneas aprovechando el espacio vertical disponible.
       - `RESTRICCION_LONGITUD`: Limita caracteres impidiendo ingresar más texto del permitido.
       - `AMPLIACION_DINAMICA`: Expande el campo hacia abajo si no invade elementos contiguos.
       - `ADVERTENCIA_BLOQUEANTE`: Advierte durante la previsualización y bloquea la emisión si se pierde contenido.
  3. *Tratamiento de campos multilínea y caracteres especiales:*
     - Respetar saltos de línea explícitos (`
`) y espaciado entre renglones sin superponer caracteres.
     - Soporte completo de acentos, eñes y signos de puntuación en español bajo codificación UTF-8.
- **Criterios de Aceptación:**
  - [ ] Nombres extensos o compuestos se ajustan reduciendo la fuente sin perder apellidos ni truncar caracteres.
  - [ ] El tamaño de fuente respeta estrictamente el umbral mínimo configurado para impedir textos ilegibles.
  - [ ] Los campos multilínea realizan saltos de línea automáticos dentro de los márgenes de la caja sin desbordar el casillero preimpreso.
  - [ ] La previsualización en pantalla y el archivo PDF definitivo muestran exactamente el mismo tamaño y distribución de texto.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 4603-4645; clave TASK-102; asignación única: Secretaria -->

---

<!-- ID: TASK-102 | Fuentes: Pendientes.md ; pendientes/Secretaria/Pendientes.md -->
### [ ] [TASK-102] [P0] Motor de Modalidades de Trámite: Formulario en Línea, Descarga Vacía e Impresión Física
- **Orden de Ejecución:** 1
- **Prioridad:** P0 (Crítica)
- **Componentes Afectados:**
  - `backend/user-service/Code.gs` (`getFormBlankTemplatePdf`, `registerPhysicalFormReception`)
  - `backend/accounting-service/Code.gs`
  - Hoja: `FormulariosInstitucionales`, `SolicitudesTramites`, `DocumentosEstudiante`
- **Subcapacidades Relacionadas:** F33-01, F33-03.
- **Origen del Hallazgo:** `AUDITORIA_FASE_33_FORMULARIOS_INSTITUCIONALES_TRAMITES_DIGITALES.md` / Sección C (F33-01, F33-03) y Plan de Implementación F33-Task01.
- **Problema Detectado y Riesgos:**
  La plataforma permite completar y enviar formularios digitalmente, pero las modalidades de descarga en blanco e impresión física no están completamente desarrolladas. La prueba de descarga del formulario vacío fue satisfactoria, pero la versión imprimible requiere ajustes de maquetación para asegurar espacios suficientes de escritura manual a tinta e instrucciones de presentación física en ventanilla escolar.
- **Requisitos Funcionales y Técnicos Convergentes:**
  1. *Mecanismo de presentación configurable por trámite:*
     - Completar y enviar en línea desde el portal web.
     - Descargar formulario vacío en PDF oficial.
     - Generar versión imprimible optimizada para diligenciamiento manual a tinta.
     - Registrar posteriormente la recepción física del formulario y sus anexos digitalizados en ventanilla.
     - Configuración por formulario: definir cuáles modalidades están habilitadas (`MODALIDADES_PERMITIDAS`: `SOLO_ONLINE`, `SOLO_FISICA`, `HIBRIDA_ONLINE_Y_FISICA`).
  2. *Generación de formulario vacío limpio:*
     - Generar el PDF vacío a partir de la definición vigente, sin respuestas de usuarios, datos personales ajenos, valores privados ni información de borradores.
  3. *Versión imprimible de alta fidelidad:*
     - Identidad visual institucional completa (encabezados, logotipos, membretes, títulos y advertencias legales).
     - Márgenes y áreas seguras de impresión con líneas continuas/punteadas y espacios amplios para escritura manual.
     - Casillas de verificación con dimensiones adecuadas para marcar con bolígrafo.
     - Campos de fecha, DNI/identidad, firmas y recuadro de observaciones.
     - Saltos de página controlados y numeración formal de páginas.
     - Contraste optimizado para legibilidad en impresión monocromática (blanco y negro).
  4. *Instrucciones y radicación de trámites físicos:*
     - Instrucciones de diligenciamiento impresas: secciones obligatorias, documentos requeridos y ventanilla de entrega.
     - Registrar la recepción física asociándola a un trámite existente o creando un expediente nuevo:
       - Tipo de trámite, persona que presenta, estudiante/titular relacionado, fecha y hora exacta, funcionario receptor, documentos entregados, observaciones iniciales y archivo escaneado/fotografiado adjunto.
     - Conservar inmutable la versión de la definición del formulario utilizada para generar el documento descargable o impreso.
- **Criterios de Aceptación:**
  - [ ] Generar un formulario vacío y comprobar que no incluya respuestas, datos ajenos ni información residual de borradores.
  - [ ] Imprimir formularios de una y varias páginas y verificar que no existan campos cortados, superpuestos o sin espacio para escribir.
  - [ ] Comprobar que la impresión en escala de grises conserve total legibilidad y nitidez.
  - [ ] Desactivar la modalidad física en un trámite y verificar que se oculten las opciones de descarga para impresión física.
  - [ ] Registrar una recepción física en ventanilla y verificar que se vincule al expediente correcto con sus adjuntos escaneados.
  - [ ] Una modificación posterior de la plantilla no altera los documentos descargados o radicados bajo versiones previas.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 4646-4682; clave TASK-103; asignación única: Secretaria -->

---

<!-- ID: TASK-103 | Fuentes: Pendientes.md ; pendientes/Secretaria/Pendientes.md -->
### [ ] [TASK-103] [P0] Persistencia de Borradores en Servidor y Sincronización Multidispositivo
- **Orden de Ejecución:** 2
- **Prioridad:** P0 (Crítica)
- **Componentes Afectados:**
  - `backend/user-service/Code.gs` (`saveFormDraftSubmission`, `getFormDraftSubmission`, `discardFormDraft`, `resolveDraftConcurrencyConflict`)
  - `js/student.js`, `js/ui-common.js`
  - Hoja: `BorradoresTramites`
- **Subcapacidades Relacionadas:** F33-04.
- **Origen del Hallazgo:** `AUDITORIA_FASE_33_FORMULARIOS_INSTITUCIONALES_TRAMITES_DIGITALES.md` / Sección C (F33-04) y Plan de Implementación F33-Task02.
- **Problema Detectado y Riesgos:**
  Los borradores se conservan principalmente en `LocalStorage`. Esto permite recuperar el trabajo en el mismo navegador, pero no garantiza continuidad entre dispositivos y expone al usuario a perder información si limpia los datos del navegador, cambia de equipo o utiliza otra sesión.
- **Requisitos Funcionales y Técnicos Convergentes:**
  1. *Persistencia de borradores en el backend (`BorradoresTramites`):*
     - Estructura: `[draftId, formId, versionFormulario, userId, estudianteId, respuestasJSON, adjuntosTemporalesJSON, fechaCreacion, fechaUltimaModificacion, estadoBorrador, versionEdicion, fechaUltimoGuardadoConfirmado]`.
     - Permitir iniciar el trámite en una computadora y continuarlo en un teléfono móvil recuperando datos y adjuntos.
  2. *Autoguardado inteligente y estados de sincronización:*
     - Autoguardado tras cambios relevantes, cambio de sección o abandono de campo sin saturar la red con peticiones por tecla.
     - Indicador visual claro del estado: `Guardando...`, `Guardado`, `Pendiente de sincronización` o `Error de conexión`.
     - Guardado manual explícito como alternativa para el usuario.
  3. *Control de concurrencia y recuperación ante fallos de conexión:*
     - Control mediante número de versión de edición (`versionEdicion`). Detectar y advertir si dos sesiones modifican el mismo borrador antes de sobrescribir.
     - Mantener cambios locales temporalmente si se interrumpe la red, sincronizando al reanudar sin duplicar registros.
     - Distinguir archivos adjuntos temporales de los archivos formalmente presentados con la solicitud definitiva.
     - Reglas de expiración y limpieza automática de borradores abandonados (configurable, por defecto 30 días, `DIAS_EXPIRACION_BORRADORES`).
     - Tratamiento ante cambios de versión del formulario: advertir si el borrador necesita actualización o migración.
     - Privacidad estricta: los borradores solo son accesibles por su propietario y no aparecen en bandejas de solicitudes recibidas.
- **Criterios de Aceptación:**
  - [ ] Iniciar un formulario en computadora, guardar y recuperarlo intacto desde un teléfono móvil con la misma cuenta.
  - [ ] Borrar los datos del navegador local y comprobar que el borrador del servidor sigue disponible para su recuperación.
  - [ ] Interrumpir la conexión durante la edición y verificar que se informe qué cambios están pendientes sin perder datos.
  - [ ] Abrir el mismo borrador en dos sesiones simultáneas y comprobar que se detecta el conflicto de edición.
  - [ ] Un usuario no puede consultar borradores de otros estudiantes manipulando identificadores de petición.
  - [ ] Al presionar enviar formalmente, el borrador se convierte en solicitud definitiva sin duplicidad de datos.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 4683-4716; clave TASK-104; asignación única: Secretaria -->

---

<!-- ID: TASK-104 | Fuentes: Pendientes.md ; pendientes/Secretaria/Pendientes.md -->
### [ ] [TASK-104] [P0] Subsanación Granular y Congelamiento de Campos Validados
- **Orden de Ejecución:** 3
- **Prioridad:** P0 (Crítica)
- **Componentes Afectados:**
  - `backend/user-service/Code.gs` (`requestFormCorrectionStep`, `submitFormCorrectionRevision`, `validateSubsanacionPermissions`)
  - `js/student.js`
  - Hoja: `SolicitudesTramites`, `RevisionesDecisionesTramite`
- **Subcapacidades Relacionadas:** F33-10, F33-11.
- **Origen del Hallazgo:** `AUDITORIA_FASE_33_FORMULARIOS_INSTITUCIONALES_TRAMITES_DIGITALES.md` / Sección C (F33-10) y Plan de Implementación F33-Task03.
- **Problema Detectado y Riesgos:**
  La plataforma permite solicitar correcciones mediante `SOLICITAR_CORRECCION` y el estado `Requiere_Informacion`, pero la reapertura del formulario no garantiza que únicamente puedan modificarse los campos observados. Esto expone información ya validada a cambios innecesarios o no autorizados.
- **Requisitos Funcionales y Técnicos Convergentes:**
  1. *Mecanismo de observaciones vinculadas a campos y adjuntos:*
     - Registrar por observación: campo/sección/documento observado, valor original, motivo, instrucción de subsanación, revisor responsable, fecha de solicitud, plazo límite de respuesta y estado de la observación.
  2. *Reapertura dirigida y congelamiento de datos válidos:*
     - Habilitar para edición exclusivamente los campos o documentos observados.
     - Bloquear en modo solo lectura (`read-only`) todos los campos previamente validados, tanto en interfaz como mediante validación estricta en el backend.
     - Permitir observaciones generales sin que ello habilite automáticamente la edición de todo el formulario.
     - Estados individuales por observación: `Pendiente`, `Corregida`, `Validada`, `No_Subsanada`.
  3. *Comparación de versiones e impacto en aprobaciones:*
     - Al reenviar, generar nueva versión de las respuestas conservando el `solicitudId` original e indexar en el historial.
     - Presentar al revisor un comparador visual que destaque: campos modificados, valores previos vs nuevos y archivos sustituidos.
     - Permitir aceptar o rechazar individualmente cada subsanación.
     - Regla de impacto en aprobaciones previas: cambios menores (datos de contacto) no reinician aprobaciones sustantivas previas; cambios sustantivos reactivan únicamente las etapas del flujo afectadas (`REINICIO_SELECTIVO_APROBACIONES`).
- **Criterios de Aceptación:**
  - [ ] Solicitar la corrección de un único campo y comprobar que solo ese control quede editable en la interfaz del usuario.
  - [ ] Intentar modificar un campo bloqueado mediante petición directa a la API; el servidor rechaza la modificación.
  - [ ] Corregir un dato y verificar que el valor anterior se conserve intacto en el historial para auditoría.
  - [ ] Reenviar la solicitud corregida conservando el identificador único del expediente.
  - [ ] El revisor puede comparar las versiones y confirmar que cada observación fue atendida satisfactoriamente.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 4779-4831; clave TASK-106; asignación única: Secretaria -->

---

<!-- ID: TASK-106 | Fuentes: Pendientes.md ; pendientes/Secretaria/Pendientes.md -->
### [ ] [TASK-106] [P0] Integridad criptográfica, versionado y protección contra sustitución de evidencias documentales
- **Prioridad:** P0 (Crítica)
- **Orden de Ejecución:** 2 (Garantía de inmutabilidad previa a aprobaciones y firmas)
- **Componentes Afectados:**
  - `backend/user-service/Code.gs` (`submitInstitutionalFormRequest`, `submitStudentAbsenceJustification`, `verifyDocumentEvidenceIntegrity`)
  - `backend/academic-service/Code.gs` (`submitAttendanceJustification`)
  - `backend/accounting-service/Code.gs`
  - Hojas de Cálculo: `SolicitudesTramites`, `JustificacionesAsistencia`, `EvidenciasDocumentales`
- **Subcapacidades Relacionadas:** F34-05, F34-09, F34-10.
- **Origen del Hallazgo:** `AUDITORIA_FASE_34_BANDEJAS_REVISION_FIRMAS.md` / Sección C (F34-10), Matriz CAR-F34-05 y Especificación Técnica ChatGPT/Jules.
- **Problema Detectado y Riesgos:**
  Los archivos adjuntos se almacenan en Google Drive y se referencian mediante URLs o IDs de archivo, pero no se calcula ni se almacena un hash SHA-256 del contenido binario recibido. Si un archivo es sustituido, editado o corrompido en el almacenamiento externo, el sistema carece de mecanismos para detectar que la evidencia actual difiere de la aportada originalmente, comprometiendo la legalidad de autorizaciones, excusas médicas y resoluciones disciplinarias.
- **Requerimientos Funcionales y Técnicos Convergentes:**
  1. *Cálculo y persistencia de hash criptográfico SHA-256:*
     - Calcular obligatoriamente el hash SHA-256 del contenido binario de cada archivo en el momento exacto de su recepción en servidor.
     - Almacenar junto al registro documental estructurado:
       * Identificador del archivo (`evidenciaId`).
       * Identificador de la solicitud (`solicitudId`).
       * Nombre original del archivo.
       * Tipo MIME verificado.
       * Tamaño exacto en bytes.
       * Fecha y hora ISO de recepción.
       * Usuario que lo aportó (`userId`).
       * Hash criptográfico SHA-256 en hexadecimal.
       * Identificador de versión (`versionNumero`).
       * Ubicación y referencia segura de almacenamiento en Google Drive.
  2. *Auditoría activa y verificación de integridad:*
     - Comprobar la integridad del archivo al consultarlo, revisarlo o descargarlo en operaciones críticas.
     - Detectar discrepancias entre el hash del contenido actual en Drive y el hash registrado originalmente.
     - Registrar los fallos de integridad como incidencias de seguridad (`EVIDENCE_TAMPERING_DETECTED`) y evitar que el sistema presente el archivo como evidencia válida cuando no pueda verificarse.
  3. *Inmutabilidad y versionado ante subsanaciones:*
     - Impedir la sustitución silenciosa o sobrescritura de un documento que haya servido de base para aprobar o firmar una solicitud.
     - Si el solicitante aporta una fotografía o documento corregido tras una observación, almacenar una nueva versión documental vinculada (`v2`, `v3`) conservando intacta la versión previa para auditoría histórica.
     - Permitir múltiples archivos adjuntos por solicitud, conservando cada uno su propio hash y metadatos independientes.
     - Mantener la protección de privacidad de los archivos en Drive, garantizando que la comprobación de integridad no requiera hacer públicos los enlaces.
  4. *Parametrización configurable en plataforma:*
     - Ajuste institucional en `ConfiguracionInstitucional`: `BLOQUEO_AUTOMATICO_POR_DISCREPANCIA_HASH` (Valores: `ESTRICTO_BLOQUEAR_ACCESO_Y_NOTIFICAR_AUDITORIA` vs. `ADVERTENCIA_VISUAL_REVISOR`).
- **Criterios de Aceptación:**
  - [ ] Subir un archivo y comprobar que se calcula y almacena su hash SHA-256.
  - [ ] Descargar el mismo archivo y comprobar que el hash recalculado coincide exactamente.
  - [ ] Sustituir o modificar el archivo en el almacenamiento y verificar que el sistema detecta y alerta la discrepancia.
  - [ ] Presentar una nueva evidencia subsanada y comprobar que la original sigue disponible y consultable por los roles autorizados.
  - [ ] Aprobar una solicitud y comprobar que la decisión queda vinculada a los hashes de las evidencias efectivamente revisadas.
  - [ ] Verificar que un usuario sin permisos no puede sustituir ni eliminar archivos aprobados.
  - [ ] Simular un fallo al calcular o verificar el hash y comprobar que el archivo no se marca como verificado.
  - [ ] Comprobar que cada adjunto de una solicitud mantiene un identificador y hash independiente.
  - [ ] Verificar que los enlaces privados continúan protegidos contra accesos no autenticados.
  - [ ] Comprobar que las evidencias históricas pueden verificarse sin alterar su contenido ni marcas temporales.
- **Dependencias:** Almacenamiento documental existente, sistema de permisos, F34-Task01.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 4882-4941; clave TASK-108; asignación única: Secretaria -->

---

<!-- ID: TASK-108 | Fuentes: Pendientes.md ; pendientes/Secretaria/Pendientes.md -->
### [ ] [TASK-108] [P0] Bandeja de salida institucional y control de entregas con acuses de recibo
- **Prioridad:** P0 (Crítica)
- **Orden de Ejecución:** 4 (Trazabilidad y fehaciencia de comunicaciones despachadas)
- **Componentes Afectados:**
  - `backend/user-service/Code.gs` (`getDepartmentalOutbox`, `recordDocumentDeliveryReceipt`, `recordDocumentOpenReceipt`, `sendInstitutionalDispatch`)
  - `backend/accounting-service/Code.gs`
  - Hoja de Cálculo: `EntregasDocumentales`
- **Subcapacidades Relacionadas:** F34-02, F34-09, F34-10.
- **Origen del Hallazgo:** `AUDITORIA_FASE_34_BANDEJAS_REVISION_FIRMAS.md` / Sección C (F34-02), Matriz CAR-F34-02 y Especificación Técnica ChatGPT/Jules.
- **Problema Detectado y Riesgos:**
  Existe consulta de trámites enviados por usuarios mediante `getAdministrativeRequests`, pero no existe una bandeja formal de salida para que Secretaría, Dirección, Contabilidad y otros departamentos puedan controlar los documentos que emiten y verificar qué ocurrió después del envío. Actualmente no se diferencian de forma suficiente el envío solicitado, la entrega, la apertura, la lectura y la recepción formal, dejando a la institución sin respaldo legal probatorio ante citaciones o notificaciones oficiales.
- **Requerimientos Funcionales y Técnicos Convergentes:**
  1. *Bandeja de salida personal y departamental:*
     - Incorporar vistas de bandeja de salida personal (`mis despachos`) y departamental (`despachos del departamento`).
     - Registrar y consultar cada emisión con:
       * Identificador único de entrega (`entregaId`).
       * Identificador del documento (`documentoId`).
       * Identificador del trámite o expediente relacionado (`tramiteId`).
       * Remitente (`emisorUserId`).
       * Departamento de origen.
       * Destinatario o destinatarios (individual o lista).
       * Fecha y hora ISO de emisión y despacho.
       * Documento y versión exacta enviada.
       * Archivos adjuntos y sus hashes asociados.
       * Medio o canal de entrega (portal institucional, correo, notificación push).
       * Estado individualizado de cada destinatario.
  2. *Diferenciación rigurosa de estados y acontecimientos de entrega:*
     - Diferenciar inequívocamente y sin equiparaciones automáticas:
       * `Preparado`: Documento elaborado en borrador.
       * `Envío Solicitado`: Encolado para despacho.
       * `Enviado`: Emitido por el servidor.
       * `Entregado`: Depositado en el canal o casilla del destinatario.
       * `Abierto o Consultado`: El destinatario abrió o descargó el documento.
       * `Recibido Formalmente`: El destinatario confirmó la recepción expresa.
       * `Respondido`: El trámite derivó en una contestación.
       * `Devuelto o Rechazado`: Rebotado por dirección inválida o rechazo.
       * `Fallido`: Error técnico de transmisión.
     - Regla estricta: La apertura de una notificación o recepción de un correo jamás debe interpretarse como recepción formal de un documento oficial vinculante.
  3. *Acuses de recibo verificables y reenvíos:*
     - Generar acuse de recibo con identificador único, marca temporal, IP y hash del documento recibido al momento en que el destinatario confirme la recepción.
     - En envíos multidestinatario, conservar el estado de entrega y lectura independiente para cada uno.
     - Permitir reenviar documentos ante fallos de entrega sin sobrescribir ni borrar los intentos fallidos previos.
     - Mantener la relación con el expediente original evitando generar copias huérfanas.
  4. *Parametrización configurable en plataforma:*
     - Parámetro en `ConfiguracionInstitucional`: `MODALIDAD_ACUSE_RECIBO_NOTIFICACIONES`: Valores `EXPLICITO_CLIC_CONFIRMACION` (exige botón de aceptación de recibido) vs. `AUTOMATICO_POR_LECTURA` (toma la apertura como recepción con advertencia).
- **Criterios de Aceptación:**
  - [ ] Emitir un documento desde un departamento y comprobar que aparece de inmediato en su bandeja de salida.
  - [ ] Verificar que remitente, destinatario, fecha, versión documental y hashes quedan registrados en `EntregasDocumentales`.
  - [ ] Comprobar que un fallo de transmisión no se marque falsamente como entrega exitosa.
  - [ ] Abrir el documento desde la cuenta del destinatario y verificar que se registra la consulta sin marcarlo automáticamente como "Recibido Formalmente".
  - [ ] Confirmar formalmente la recepción y comprobar la generación del acuse con IP y marca de tiempo.
  - [ ] Enviar a múltiples destinatarios y verificar que cada uno conserva su propio estado de lectura y entrega.
  - [ ] Intentar consultar la bandeja de salida de otro departamento sin autorización y verificar que el acceso es denegado (error 403).
  - [ ] Comprobar que un reenvío conserva el historial del intento previo sin destruirlo.
  - [ ] Modificar una copia posterior del documento y verificar que el acuse original permanece vinculado a la versión efectivamente recibida.
- **Dependencias:** F34-Task04 (integridad criptográfica), F34-Task06 (notificaciones de envío y entrega), historial institucional.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 5723-5755; clave TASK-130; asignación única: Secretaria -->

---

<!-- ID: TASK-130 | Fuentes: Pendientes.md ; pendientes/Secretaria/Pendientes.md -->
### [ ] [TASK-130] [P0] Integración de ayudas permanentes y descripciones completas en formularios
- **Prioridad:** P0 (Bloqueante / Esencial)
- **Orden de Ejecución:** 3 (Instrucciones visibles y confirmaciones independientes)
- **Componentes Afectados:**
  - Formularios de matrícula, cobros, calificaciones y trámites en dashboards
  - `js/ui-common.js`
- **Subcapacidades Relacionadas:** F38-04, F38-11, F38-13.
- **Origen del Hallazgo:** `AUDITORIA_FASE_38_AYUDA_CONTEXTUAL_METADATOS_APRENDIZAJE.md` / Sección C (F38-04, F38-13), Matriz CAR-F38-04, CAR-F38-13 y Especificación Técnica ChatGPT/Jules.
- **Problema Detectado y Riesgos:**
  Los formularios de matrícula, calificaciones, importaciones y operaciones administrativas carecen de explicaciones contextuales suficientes. Se ocultan requisitos indispensables de formato (ej. DNI hondureño de 13 dígitos, importes monetarios o tipos de archivo) en placeholders o modales de soporte, provocando envíos fallidos y frustración del usuario por validaciones tardías.
- **Requerimientos Funcionales y Técnicos Convergentes:**
  1. *Instrucciones visibles permanentes junto al campo:*
     - Incorporar micro-instrucciones permanentes (`help-text` visible bajo el control) para campos complejos o con restricciones legales/institucionales.
     - Sustituir los placeholders utilizados como única explicación por etiquetas claras y ayudas independientes.
     - Mostrar ejemplos reales aceptados por el backend (ej. `Formato: 0801-1990-12345 o 13 dígitos continuos`).
     - Diferenciar visualmente campos obligatorios (asterisco rojo y atributo `required`) de opcionales.
     - Aclarar formatos numéricos, rangos permitidos, fechas y restricciones temporales del ciclo lectivo.
  2. *Información en archivos e importaciones:*
     - En campos de subida de archivos, indicar formatos admitidos (PDF, PNG, JPG, XLSX), tamaño máximo real y advertir sobre condiciones de legibilidad.
  3. *Independencia absoluta de advertencias críticas:*
     - Las confirmaciones de operaciones sensibles (eliminar horarios, anular pagos, cerrar actas de calificaciones) deben presentarse mediante diálogos modales obligatorios que jamás puedan ser suprimidos por haber descartado tutoriales o guías previas.
     - Explicar las consecuencias exactas de la acción antes de ejecutarla (si es irreversible, si afecta a un registro o a un período completo).
- **Criterios de Aceptación:**
  - [ ] Las restricciones y formatos críticos son visibles permanentemente sin depender de abrir burbujas flotantes.
  - [ ] Descartar guías interactivas o tutoriales no suprime las advertencias o confirmaciones obligatorias de seguridad.
  - [ ] Los ejemplos de formato mostrados son validados exitosamente por el backend sin contradicciones.
  - [ ] Los mensajes de error de validación aparecen junto al campo correspondiente y no sustituyen la ayuda descriptiva.
  - [ ] Una operación crítica cancelada por el usuario no altera ningún dato en la plataforma.
- **Dependencias:** F38-Task01, F38-Task02.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 5788-5825; clave TASK-132; asignación única: Secretaria -->

---

<!-- ID: TASK-132 | Fuentes: Pendientes.md ; pendientes/Secretaria/Pendientes.md -->
### [ ] [TASK-132] [P0] Implementación del inventario documental institucional y clasificación de archivos legados
- **Prioridad:** P0 (Prioridad crítica / Bloqueante)
- **Orden de Ejecución:** 1 (Inventario inicial y clasificación documental institucional)
- **Componentes Afectados:**
  - `backend/accounting-service/Code.gs` (`registerLegacyDocumentInventory`, `getLegacyDocumentInventory`)
  - `backend/user-service/Code.gs`
  - Hoja de Cálculo: `InventarioDocumentalLegado`
- **Subcapacidades Relacionadas:** 3.1, 3.9, 3.12.
- **Origen del Hallazgo:** `AUDITORIA_FASE_39_DIGITALIZACION_TRANSICION.md` / Sección C (3.1), Matriz CAR-F39-01 y Especificación Técnica ChatGPT/Jules.
- **Problema Detectado y Riesgos:**
  No existe un inventario centralizado que permita identificar qué documentos utiliza cada departamento, dónde se encuentran, qué función cumplen y cuáles deben digitalizarse. Sin un inventario institucional, la migración se realiza a ciegas, arriesgando pérdida de actas históricas, omisión de expedientes antiguos y duplicaciones documentales desordenadas.
- **Requerimientos Funcionales y Técnicos Convergentes:**
  1. *Registro estructurado de documentos físicos y digitales:*
     - Crear un inventario institucional que permita registrar documentos físicos y digitales, independientemente de que ya estén almacenados en la plataforma.
     - Auto-crear la hoja `InventarioDocumentalLegado` (`DocumentoId`, `DepartamentoPropietario`, `AreaResponsable`, `NombreArchivoOriginal`, `DescripcionProposito`, `FormatoSoporte`, `UbicacionOrigen`, `ResponsableDocumento`, `CantidadRegistrosPaginas`, `FrecuenciaUso`, `FechaCreacionPeriodo`, `NivelConfidencialidad`, `EstadoConservacion`, `CategoriaDocumental`, `EstadoDigitalizacion`, `ExpedienteRelacionadoId`, `ObservacionesHistoricas`, `FechaRegistro`, `UsuarioRegistro`).
  2. *Clasificación documental en tres categorías principales:*
     - *Registros de datos:* Archivos tabulares que contienen información organizada en filas, columnas, tablas o estructuras a convertir en registros institucionales (listados, notas, matrículas, nóminas).
     - *Plantillas:* Documentos reutilizados repetidamente para elaborar constancias, actas, solicitudes, informes y formularios.
     - *Documentos históricos:* Documentación cerrada de periodos anteriores a conservar como evidencia o antecedentes (actas antiguas, expedientes cerrados).
     - Permitir subcategorías configurables por departamento sin limitar el inventario a etiquetas fijas.
  3. *Estados de transición y filtros:*
     - Estados de digitalización admitidos: `Inventariado`, `Pendiente_Revision`, `Pendiente_Digitalizacion`, `En_Proceso_Importacion`, `Importado`, `Pendiente_Validacion`, `Validado`, `Requiere_Correccion`, `Archivado`, `Excluido_Migracion`.
     - Permitir registrar documentos físicos pendientes de escaneo.
     - Modificar clasificación y estado conservando historial (usuario, fecha, valor anterior y nuevo).
     - Filtros por departamento, categoría, formato, responsable, período histórico y estado.
     - Exportar el inventario y generar listados de documentos pendientes para seguimiento directivo.
- **Criterios de Aceptación:**
  - [ ] Permite registrar documentos físicos y digitales sin necesidad de cargarlos inmediatamente a Drive.
  - [ ] Un documento inventariado conserva su identificador único aunque cambie de ubicación o clasificación.
  - [ ] Un mismo documento no genera registros duplicados por cambios de nombre.
  - [ ] Los cambios de clasificación conservan usuario, fecha, valor anterior y valor nuevo.
  - [ ] Los departamentos consultan su propio inventario sin acceder a información restringida de otras áreas.
  - [ ] Dirección puede consultar el inventario consolidado de toda la institución.
- **Dependencias:** Estructura de departamentos, roles, permisos y almacenamiento institucional.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 5826-5863; clave TASK-133; asignación única: Secretaria -->

---

<!-- ID: TASK-133 | Fuentes: Pendientes.md ; pendientes/Secretaria/Pendientes.md -->
### [ ] [TASK-133] [P0] Implementación de un motor de validación multinivel de archivos y documentos
- **Prioridad:** P0 (Prioridad crítica / Bloqueante)
- **Orden de Ejecución:** 2 (Validación profunda previa a cualquier incorporación)
- **Componentes Afectados:**
  - `backend/academic-service/Code.gs` (`validateEvidenceFileAndPermissions`)
  - `backend/accounting-service/Code.gs` (`validateImportPreview`)
  - `js/teacher.js`, `teacher-dashboard.html`
- **Subcapacidades Relacionadas:** 3.3.
- **Origen del Hallazgo:** `AUDITORIA_FASE_39_DIGITALIZACION_TRANSICION.md` / Sección C (3.3) y Matriz CAR-F39-03.
- **Problema Detectado y Riesgos:**
  La validación actual se limita a verificar la extensión declarada, el tamaño y encabezados tabulares. No existe una validación documental integral para garantizar que los archivos importados sean utilizables y que sus datos sean confiables. Poder abrir un archivo no significa que su contenido sea válido; procesar archivos corruptos o mal estructurados corrompe la base de datos de producción.
- **Requerimientos Funcionales y Técnicos Convergentes:**
  1. *Validación física del archivo:*
     - Comprobar que no esté vacío (tamaño > 0 bytes) y pueda leerse completamente sin truncamientos.
     - Verificar correspondencia estricta entre extensión declarada y tipo MIME real analizando cabeceras binarias (Magic Bytes).
     - Detectar archivos dañados, cifrados/protegidos con contraseña que impidan extracción o con contenido potencialmente peligroso.
  2. *Validación estructural por formato:*
     - *Excel:* Libros con múltiples hojas (visibles y ocultas), encabezados desplazados o repetidos, celdas combinadas, filas vacías, fórmulas no resueltas e inconsistencias de tipos.
     - *Word (DOCX):* Estructura interna de párrafos, tablas, controles de contenido y campos de formulario.
     - *PDF:* Cantidad de páginas, páginas vacías, distinción entre texto vectorial seleccionable, páginas escaneadas puras (raster) y documentos mixtos.
  3. *Validación semántica y relacional:*
     - Comprobar que los valores extraídos correspondan al contexto institucional (fechas válidas, identificadores institucionales existentes, catálogos permitidos).
     - Detectar referencias huérfanas a estudiantes o empleados inexistentes y advertir si valores entrantes sobrescriben datos existentes.
  4. *Informe de validación y previsualización:*
     - Diferenciar errores bloqueantes, advertencias y observaciones informativas.
     - Presentar vista de resultados para corregir mapeos antes de cualquier persistencia de negocio.
- **Criterios de Aceptación:**
  - [ ] Archivos con discrepancia entre extensión y contenido real son rechazados de inmediato.
  - [ ] Documentos dañados, truncados o protegidos son identificados con explicación clara del motivo.
  - [ ] Se detecta con precisión si un PDF es vectorial, escaneado o mixto.
  - [ ] Las inconsistencias estructurales de Excel y referencias a estudiantes inexistentes se señalan antes de escribir.
  - [ ] Los registros válidos no se pierden por errores aislados de otras filas.
  - [ ] Los errores nunca se transforman silenciosamente en valores predeterminados.
- **Dependencias:** F39-Task01.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 5864-5896; clave TASK-134; asignación única: Secretaria -->

---

<!-- ID: TASK-134 | Fuentes: Pendientes.md ; pendientes/Secretaria/Pendientes.md -->
### [ ] [TASK-134] [P0] Implementación de detección criptográfica de duplicados mediante SHA-256
- **Prioridad:** P0 (Prioridad crítica / Bloqueante)
- **Orden de Ejecución:** 3 (Deduplicación criptográfica exacta en repositorio)
- **Componentes Afectados:**
  - `backend/academic-service/Code.gs` (`uploadStudentDocument`, `verifyDocumentIntegritySha256`)
  - `backend/accounting-service/Code.gs`
  - Hoja de Cálculo: `DocumentosEstudiantes`, `InventarioDocumentalLegado`
- **Subcapacidades Relacionadas:** 3.4, 3.10.
- **Origen del Hallazgo:** `AUDITORIA_FASE_39_DIGITALIZACION_TRANSICION.md` / Sección C (3.4, 3.10) y Matriz CAR-F39-02, CAR-F39-04.
- **Problema Detectado y Riesgos:**
  La plataforma no calcula hashes criptográficos de los archivos importados. Por tanto, un mismo documento escaneado puede almacenarse múltiples veces en Google Drive con nombres diferentes, saturando el almacenamiento y generando expedientes contradictorios.
- **Requerimientos Funcionales y Técnicos Convergentes:**
  1. *Cálculo y registro de huella digital SHA-256:*
     - Calcular obligatoriamente el hash SHA-256 del contenido binario original de cada archivo antes de su incorporación definitiva.
     - Almacenar el hash en columna dedicada `HashSHA256` en `DocumentosEstudiantes` e `InventarioDocumentalLegado`.
  2. *Deduplicación inteligente y respuesta diferenciada:*
     - Comparar el hash con los documentos previamente registrados en la plataforma.
     - Diferenciar: archivo completamente nuevo, duplicado exacto dentro del mismo lote, duplicado existente en el repositorio y documento idéntico vinculado a otro expediente.
     - Si es un duplicado exacto, permitir asociar la referencia a múltiples expedientes legítimos sin duplicar el archivo físico en Google Drive.
  3. *Auditoría activa de integridad:*
     - Verificar periódicamente la integridad al descargar o consultar un documento comprobando que el binario actual en Drive coincida con el hash SHA-256 registrado al inicio.
  4. *Parametrización configurable en plataforma:*
     - Parámetro en `ConfiguracionInstitucional`: `POLITICA_DUPLICADOS_DOCUMENTALES`: Valores `RECHAZAR_DUPLICADO_EXACTO` (por defecto) vs. `CREAR_ENLACE_REFERENCIA_SIN_DUPLICAR_ARCHIVO`.
- **Criterios de Aceptación:**
  - [ ] Dos archivos binariamente idénticos con nombres diferentes producen el mismo hash y son reconocidos como duplicados exactos.
  - [ ] Se evita almacenar nuevamente el mismo binario en Google Drive cuando ya existe registrado.
  - [ ] Un archivo modificado produce un hash diferente y se clasifica como nueva versión o documento independiente.
  - [ ] La verificación de integridad detecta si un archivo en Drive fue alterado o sustituido con posterioridad.
- **Dependencias:** F39-Task03.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 5897-5928; clave TASK-135; asignación única: Secretaria -->

---

<!-- ID: TASK-135 | Fuentes: AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F5-006.md ; Pendientes.md ; pendientes/Secretaria/Pendientes.md -->
### [ ] [TASK-135] [P0] Implementación de custodia protegida de originales y trazabilidad documental
- **Hallazgo:** H5 y H7.
- **Severidad/Prioridad:** CRÍTICO / P0.
- **Objetivo:** impedir que una carga fallida deje archivos huérfanos o destruya la referencia histórica.
- **Archivos/módulos:** backend/academic-service/Code.gs, uploadStudentDocument, HistorialVersionesDocumentos y DriveApp.
- **Dependencias:** TASK-134/TASK-144 para hashes; TASK-118 para IDs; operación compensatoria Drive/Sheets.
- **Alcance:** persistir y verificar el historial antes de sustituir la referencia vigente; compensar/eliminar o poner en cuarentena el archivo físico si falla la escritura tabular; registrar estado de operación y permitir reconciliación.
- **Criterios de aceptación:** fallo de Drive no crea fila; fallo de Sheets tras crear Drive no deja archivo huérfano sin registro de compensación; fallo al guardar versión histórica impide sobrescribir la vigente; cada versión conserva su propio ID, archivo, fecha, usuario y hash.
- **Estado:** Pendiente (ampliación de TASK-135).
- **Prioridad:** P0 (Prioridad crítica / Bloqueante)
- **Orden de Ejecución:** 4 (Custodia de evidencia original y trazabilidad forense)
- **Componentes Afectados:**
  - `backend/academic-service/Code.gs` (`uploadStudentDocument`, `restoreDocumentVersion`)
  - `backend/accounting-service/Code.gs`
  - Google Drive institucional (`Drive/DocumentosOriginales/[Departamento]/[AnoLectivo]/`)
- **Subcapacidades Relacionadas:** 3.10, 3.12.
- **Origen del Hallazgo:** `AUDITORIA_FASE_39_DIGITALIZACION_TRANSICION.md` / Sección C (3.10) y Matriz CAR-F39-10.
- **Problema Detectado y Riesgos:**
  Los archivos originales se almacenan en Drive sin garantías criptográficas de inmutabilidad. Si una plantilla es editada o un documento es convertido a formulario, existe el riesgo de sobrescribir el archivo histórico que sirvió de base, privando a la institución de respaldo probatorio ante reclamos legales o auditorías.
- **Requerimientos Funcionales y Técnicos Convergentes:**
  1. *Separación conceptual y estructura de custodia:*
     - Separar estrictamente: archivo original, copia de trabajo, documento procesado, registro estructurado extraído y plantilla/formulario derivado.
     - Conservar el archivo original sin alteraciones durante todos los procesos de extracción, OCR y conversión.
     - Almacenar los originales en carpetas institucionales protegidas con permisos de solo lectura para operadores.
  2. *Trazabilidad de metadatos y retención:*
     - Registrar por documento: identificador documental, hash SHA-256, nombre original, ruta de procedencia, fecha/hora ISO, usuario responsable, departamento, operación de importación y expedientes relacionados.
     - Registrar toda acción de consulta, descarga, modificación de metadatos o restauración.
     - Impedir la eliminación accidental de documentos originales custodiados por usuarios sin autorización directiva.
     - Alertar de inmediato si un archivo original desaparece o no coincide con su hash registrado.
- **Criterios de Aceptación:**
  - [ ] La conversión de un documento tradicional a formulario o plantilla no modifica el archivo original.
  - [ ] Restaurar una versión previa no altera el registro de procedencia ni la custodia del original.
  - [ ] Sustituir un archivo en Drive es detectado automáticamente mediante comprobación criptográfica.
  - [ ] Los usuarios sin permisos especiales no pueden eliminar archivos originales protegidos.
  - [ ] Es posible rastrear cualquier registro estructurado o formulario hasta su archivo original en Drive.
- **Dependencias:** F39-Task04.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 5929-5960; clave TASK-136; asignación única: Secretaria -->

---

<!-- ID: TASK-136 | Fuentes: Pendientes.md ; pendientes/Secretaria/Pendientes.md -->
### [ ] [TASK-136] [P0] Implementación de importación masiva de documentos mediante ZIP y carpetas
- **Prioridad:** P0 (Prioridad crítica / Bloqueante)
- **Orden de Ejecución:** 5 (Procesamiento por lotes y colecciones documentales)
- **Componentes Afectados:**
  - `backend/academic-service/Code.gs` (`processCompressedDocumentBatch`)
  - `js/teacher.js`, `js/secretary.js`
  - Google Drive institucional
- **Subcapacidades Relacionadas:** 3.2, 4.2.
- **Origen del Hallazgo:** `AUDITORIA_FASE_39_DIGITALIZACION_TRANSICION.md` / Sección C (3.2), Matriz CAR-F39-02 y Especificación Técnica ChatGPT/Jules.
- **Problema Detectado y Riesgos:**
  La plataforma permite importar archivos individuales y lotes tabulares, pero no dispone de un mecanismo completo para importar colecciones masivas de documentos tradicionales. Cargar cientos de expedientes uno por uno consume semanas de trabajo manual y propicia omisiones.
- **Requerimientos Funcionales y Técnicos Convergentes:**
  1. *Descompresión y análisis de paquetes ZIP:*
     - Incorporar importación de archivos ZIP conteniendo múltiples documentos (PDF, DOCX, XLSX, imágenes), conservando la estructura de carpetas como metadatos de clasificación.
     - Identificar automáticamente nombre, extensión, tipo MIME real, tamaño, carpeta de procedencia y patrones de nombres con identificadores institucionales (ej. `[DNI]_[TipoDoc].pdf`).
  2. *Flujo controlado por etapas:*
     - Recepción del paquete -> Descompresión y enumeración -> Inspección preliminar -> Detección de duplicados SHA-256 -> Clasificación/asignación de destinos -> Validación estructural -> Confirmación con vista previa -> Almacenamiento en Drive -> Reporte final.
     - Permitir reglas de asignación automática por prefijo o carpeta y correcciones manuales antes de confirmar.
     - Procesar cada archivo de forma aislada: el fallo de un archivo no debe interrumpir el procesamiento de los demás.
     - Reanudación de lotes interrumpidos sin reprocesar documentos ya confirmados.
     - Límites configurables de tamaño y cantidad de archivos para no agotar la memoria ni los tiempos de ejecución de Google Apps Script.
- **Criterios de Aceptación:**
  - [ ] Importar un ZIP con múltiples formatos y preservar su estructura original de carpetas en metadatos.
  - [ ] Detección automática de códigos de estudiantes o empleados en el nombre de los archivos.
  - [ ] Rechazar archivos dañados o peligrosos sin detener el procesamiento del resto del lote.
  - [ ] Reanudar un lote interrumpido procesa únicamente los archivos pendientes sin duplicar los confirmados.
  - [ ] Generar un reporte consolidado con resultados individuales por archivo (exitoso, duplicado, rechazado, pendiente).
- **Dependencias:** F39-Task01, F39-Task03, F39-Task04, F39-Task05.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 5994-6024; clave TASK-138; asignación única: Secretaria -->

---

<!-- ID: TASK-138 | Fuentes: Pendientes.md ; pendientes/Secretaria/Pendientes.md -->
### [ ] [TASK-138] [P0] Implementación de vinculación asistida de documentos históricos con expedientes actuales
- **Prioridad:** P0 (Prioridad crítica / Bloqueante)
- **Orden de Ejecución:** 7 (Reconciliación de expedientes históricos con identidades actuales)
- **Componentes Afectados:**
  - `backend/academic-service/Code.gs` (`linkHistoricalDocumentToStudent`, `getUnassignedHistoricalDocuments`)
  - `js/secretary.js`
  - Hoja de Cálculo: `DocumentosHistoricosPendientes`
- **Subcapacidades Relacionadas:** 3.5, 3.4.
- **Origen del Hallazgo:** `AUDITORIA_FASE_39_DIGITALIZACION_TRANSICION.md` / Sección C (3.5), Matriz CAR-F39-05 y Especificación Técnica ChatGPT/Jules.
- **Problema Detectado y Riesgos:**
  Documentos históricos de periodos anteriores (actas viejas, constancias de egresados) carecen de identificadores institucionales actuales o presentan variaciones de nombres/apellidos por matrimonios o traslados. Sin una bandeja asistida, estos documentos quedan huérfanos o se asignan erróneamente a alumnos homónimos.
- **Requerimientos Funcionales y Técnicos Convergentes:**
  1. *Detección de candidatos y niveles de coincidencia:*
     - Analizar metadatos y texto extraído para detectar posibles referencias a estudiantes, docentes o expedientes.
     - Clasificar coincidencias en: exacta por ID, exacta por nombre completo y fecha, probable por similitud, ambigua entre varios candidatos y sin coincidencia identificable.
     - Prohibir terminantemente la asignación automática en coincidencias ambiguas o basadas únicamente en nombres.
  2. *Bandeja de resolución y confirmación auditada:*
     - Auto-crear la hoja `DocumentosHistoricosPendientes` para documentos no asignados.
     - Proveer interfaz para que el funcionario de Secretaría/Archivo visualice el documento, compare los expedientes candidatos propuestos y confirme o descarte manualmente la asociación.
     - Conservar la identidad histórica original del documento sin modificar sus nombres antiguos para forzar coincidencias.
     - Auditar en bitácora el usuario responsable, fecha, documento, expediente vinculado y candidatos descartados.
- **Criterios de Aceptación:**
  - [ ] Identifica y sugiere candidatos para documentos históricos con variaciones de nombres o sin código oficial.
  - [ ] Evita asignaciones automáticas dudosas requiriendo confirmación humana auditada.
  - [ ] Conserva los datos históricos originales en el documento digitalizado.
  - [ ] Permite corregir o revertir una asociación errónea sin eliminar el archivo original.
- **Dependencias:** F39-Task01, F39-Task03, F39-Task05.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 6025-6065; clave TASK-139; asignación única: Secretaria -->

---

<!-- ID: TASK-139 | Fuentes: Pendientes.md ; pendientes/Secretaria/Pendientes.md -->
### [ ] [TASK-139] [P0] Completar el control granular de permisos por operación documental (F40-21)
- **Prioridad:** P0 (Prioridad crítica / Bloqueante)
- **Orden de Ejecución:** 1 (Matriz base de autorización por operación)
- **Componentes Afectados:**
  - `backend/academic-service/Code.gs` (`ROLE_PERMISSIONS`, `validateRolePermission`)
  - `backend/accounting-service/Code.gs` (`ROLE_PERMISSIONS`, `validateRolePermission`)
  - `backend/user-service/Code.gs` (`ROLE_PERMISSIONS`, `savePermissionMatrix`, `getPermissionMatrix`)
  - `backend/developer-service/Code.gs` (`ROLE_PERMISSIONS`)
  - Hojas de Cálculo: `MatrizPermisosDocumentales`, `ConfiguracionInstitucional`
- **Subcapacidades Relacionadas:** F40-01, F40-02, F40-03, F40-21.
- **Origen del Hallazgo:** `AUDITORIA_FASE_40_SEGURIDAD_DOCUMENTAL_TRAZABILIDAD_Y_CONSERVACION.md` / Secciones C (F40-01) y Especificación Técnica ChatGPT/Jules.
- **Problema Detectado y Riesgos:**
  La matriz actual de permisos no separa suficientemente la lectura de metadatos, la vista previa en pantalla, la descarga de archivos y otras operaciones sensibles. Esto permite que una autorización general de consulta pueda terminar concediendo acceso irrestricto al contenido binario del documento.
- **Requerimientos Funcionales y Técnicos Convergentes:**
  1. *Definición de permisos independientes por operación:*
     - Establecer permisos atómicos e independientes para: `Consultar metadatos`, `Ver el historial`, `Visualizar el contenido (vista previa)`, `Descargar el original`, `Descargar una copia derivada`, `Subir documentos`, `Sustituir versiones`, `Restaurar versiones`, `Editar metadatos`, `Cambiar clasificación`, `Aprobar o rechazar`, `Firmar o registrar conformidad`, `Compartir`, `Revocar acceso`, `Archivar`, `Solicitar disposición`, `Autorizar disposición`, `Ejecutar eliminación autorizada`.
  2. *Configurabilidad y ámbito de aplicación:*
     - Permitir configurar permisos por rol, categoría, sensibilidad, departamento y relación con el expediente.
     - Permitir permisos excepcionales temporales con fecha de expiración y motivo justificado.
     - Establecer que los permisos de operaciones críticas no se hereden automáticamente de permisos de consulta.
     - Incorporar una vista de matriz que permita identificar qué roles pueden realizar cada operación.
     - Aplicar las mismas reglas en la interfaz de usuario y en la validación estricta del backend.
     - Permitir revisar los permisos efectivos de un usuario sobre un documento específico.
     - Registrar los cambios de permisos y sus responsables en la bitácora institucional.
     - Establecer reglas de denegación explícita cuando una restricción de sensibilidad o ámbito prevalezca sobre un permiso general.
     - Permitir revocar autorizaciones sin eliminar el historial de accesos anteriores.
  3. *Parametrización en caso de disputa de políticas:*
     - Parámetro en `ConfiguracionInstitucional`: `POLITICA_HERENCIA_PERMISOS_DOCUMENTALES`: `ESTRICTA_SIN_HERENCIA` (por defecto) vs. `HERENCIA_JERARQUICA_EXPRESA`.
- **Criterios de Aceptación:**
  - [ ] Conceder consulta de metadatos sin descarga permite ver la ficha descriptiva pero deniega la obtención del binario.
  - [ ] Conceder vista previa sin edición permite visualizar el documento pero bloquea la sustitución de archivos.
  - [ ] Conceder descarga sin modificación permite obtener el archivo pero bloquea la alteración de su contenido.
  - [ ] Conceder aprobación sin administración de permisos permite autorizar el trámite sin alterar la matriz de acceso.
  - [ ] Al revocar un permiso, las nuevas operaciones quedan denegadas de inmediato.
  - [ ] Intentos de ejecutar una operación no autorizada directamente contra el backend devuelven denegación de acceso.
  - [ ] La consulta de permisos efectivos muestra con claridad las autorizaciones aplicables y su procedencia.
- **Dependencias:** Matriz de roles y autorización existente.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 6066-6103; clave TASK-140; asignación única: Secretaria -->

---

<!-- ID: TASK-140 | Fuentes: Pendientes.md ; pendientes/Secretaria/Pendientes.md -->
### [ ] [TASK-140] [P0] Incorporar clasificación de sensibilidad y protección por categoría documental (F40-11)
- **Prioridad:** P0 (Prioridad crítica / Bloqueante)
- **Orden de Ejecución:** 2 (Taxonomía formal y reglas de sensibilidad)
- **Componentes Afectados:**
  - `backend/academic-service/Code.gs` (`uploadStudentDocument`, `getStudentDocuments`)
  - `backend/accounting-service/Code.gs` (`uploadEmployeeDocument`, `getEmployeeDocuments`)
  - Hojas de Cálculo: `DocumentosEstudiante`, `DocumentosLaborales`, `CategoriasDocumentalesConfig`
- **Subcapacidades Relacionadas:** F40-02, F40-11.
- **Origen del Hallazgo:** `AUDITORIA_FASE_40_SEGURIDAD_DOCUMENTAL_TRAZABILIDAD_Y_CONSERVACION.md` / Secciones C (F40-02) y Especificación Técnica ChatGPT/Jules.
- **Problema Detectado y Riesgos:**
  Los documentos no poseen una clasificación formal y uniforme de sensibilidad. En particular, los expedientes académicos no diferencian adecuadamente documentos médicos, disciplinarios, financieros, laborales y de identidad que demandan un tratamiento reservado.
- **Requerimientos Funcionales y Técnicos Convergentes:**
  1. *Taxonomía y niveles de sensibilidad configurables:*
     - Incorporar una clasificación documental independiente del tipo o nombre del archivo.
     - Niveles de sensibilidad configurables: `Público institucional`, `Uso interno`, `Confidencial`, `Restringido`, `Especialmente protegido`.
     - Categorías documentales específicas: `Académica`, `Médica`, `Disciplinaria`, `Financiera`, `Laboral`, `Identidad personal`, `Legal`, `Administrativa`.
  2. *Reglas de protección y acceso condicional:*
     - Asociar a cada documento una categoría y un nivel de sensibilidad.
     - Establecer permisos predeterminados por combinación de categoría, sensibilidad, rol y ámbito.
     - Aplicar restricciones especiales a documentos médicos, disciplinarios, financieros y laborales.
     - Evitar que el acceso general a un expediente permita consultar automáticamente todos los documentos sensibles que contiene.
     - Permitir excepciones justificadas y temporales con responsable, motivo, alcance y fecha de vencimiento.
     - Mostrar advertencias de sensibilidad en las vistas documentales y antes de descargar o compartir.
     - Mantener un historial completo de cambios de clasificación.
     - Permitir revisión manual de clasificaciones dudosas y registrar quién confirmó la categoría oficial.
- **Criterios de Aceptación:**
  - [ ] Un documento médico clasificado como `Restringido` es inaccesible para usuarios sin autorización médica específica aunque tengan acceso general al expediente del alumno.
  - [ ] Un contrato laboral clasificado como `Confidencial` no puede ser descargado por personal docente sin permisos de Recursos Humanos.
  - [ ] Consultar un documento desde una cuenta autorizada funciona según las reglas de categoría y ámbito.
  - [ ] Al cambiar la clasificación de un archivo se registra el responsable, fecha y valor anterior.
  - [ ] Los intentos de modificar la clasificación sin autorización son rechazados.
  - [ ] Las excepciones temporales funcionan durante el periodo autorizado y se revocan al expirar.
  - [ ] Búsquedas, vistas previas y exportaciones respetan estrictamente la clasificación asignada.
- **Dependencias:** F40-Task01.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 6104-6138; clave TASK-141; asignación única: Secretaria -->

---

<!-- ID: TASK-141 | Fuentes: Pendientes.md ; pendientes/Secretaria/Pendientes.md -->
### [ ] [TASK-141] [P0] Reforzar la autorización por expediente, departamento y ámbito institucional (F40-12)
- **Prioridad:** P0 (Prioridad crítica / Bloqueante)
- **Orden de Ejecución:** 3 (Control de acceso basado en atributos y contexto - ABAC)
- **Componentes Afectados:**
  - `backend/academic-service/Code.gs` (`assertRecordOwnership`, `validateAcademicResponsibilityAndScopeAccess`)
  - `backend/accounting-service/Code.gs` (`validateRolePermission`)
  - `backend/user-service/Code.gs` (`assignRoleScope`)
- **Subcapacidades Relacionadas:** F40-03, F40-12.
- **Origen del Hallazgo:** `AUDITORIA_FASE_40_SEGURIDAD_DOCUMENTAL_TRAZABILIDAD_Y_CONSERVACION.md` / Secciones C (F40-03) y Especificación Técnica ChatGPT/Jules.
- **Problema Detectado y Riesgos:**
  La validación de pertenencia existente no garantiza que todas las operaciones comprueben la relación entre el usuario, el expediente y el documento solicitado. Manipular un identificador en la petición puede exponer registros ajenos si el rol posee acceso genérico a la función.
- **Requerimientos Funcionales y Técnicos Convergentes:**
  1. *Evaluación multidimensional de atributos en el backend:*
     - Validar en cada operación: Identidad del usuario, Rol y permisos, Departamento o área, Expediente, Relación del usuario con el expediente, Categoría y sensibilidad documental, Operación solicitada, Estado de conservación y seguridad del documento.
     - Aplicar comprobaciones en el backend de forma independiente a los filtros visuales de la interfaz.
     - Verificar la autorización en consultas individuales, listados, búsquedas, descargas, vistas previas, restauraciones y exportaciones.
  2. *Prevención de manipulación de identificadores (IDOR):*
     - Impedir que un usuario altere identificadores de expediente, documento, solicitud o archivo para acceder a información ajena.
     - Diferenciar los permisos de acceso al expediente de los permisos sobre cada documento individual que este contiene.
     - Permitir autorizaciones excepcionales con justificación, responsable y periodo de vigencia.
     - Respuestas de error controladas ante accesos denegados que no revelen la existencia de documentos que el usuario no está facultado a conocer.
     - Registrar en auditoría los intentos de acceso fuera del ámbito autorizado.
- **Criterios de Aceptación:**
  - [ ] Consultar un documento dentro del ámbito asignado es permitido.
  - [ ] Sustituir un identificador por el de otro expediente ajeno resulta en denegación de acceso.
  - [ ] Consultar documentos médicos o disciplinarios sin permiso específico es denegado.
  - [ ] Intentar descargar un archivo cuyo listado de metadatos se puede ver aplica la restricción de descarga.
  - [ ] Invocar directamente el endpoint sin pasar por la interfaz aplica exactamente las mismas restricciones.
  - [ ] Consultar listados con filtros manipulados no retorna registros de otros departamentos.
  - [ ] Las respuestas denegadas no revelan contenido ni metadatos sensibles.
- **Dependencias:** F40-Task01, F40-Task02.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 6139-6175; clave TASK-142; asignación única: Secretaria -->

---

<!-- ID: TASK-142 | Fuentes: AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F5-006.md ; Pendientes.md ; pendientes/Secretaria/Pendientes.md -->
### [ ] [TASK-142] [P0] Streaming autenticado y eliminación total de enlaces públicos (F40-01)
- **Hallazgo:** H6.
- **Severidad/Prioridad:** CRÍTICO / P0.
- **Objetivo:** impedir consulta, modificación o descarga de documentos de expedientes ajenos.
- **Archivos/módulos:** backend/academic-service/Code.gs, getStudentDocuments, updateDocumentStatus, getSecureDocumentStream, assertRecordOwnership, doPost; js/secretary.js.
- **Dependencias:** claims de sesión verificados, relación solicitud-expediente, permisos por operación.
- **Alcance:** derivar userId/role de claims; comprobar pertenencia y ámbito en cada acción; no devolver driveUrl ni enlaces directos; registrar y exponer un proxy autenticado realmente despachado; eliminar confianza en userRole/userId enviados por cliente.
- **Criterios de aceptación:** IDs ajenos devuelven 403 sin metadatos; consulta sin expedienteId/solicitudId se rechaza; el proxy comprueba documento, versión, usuario y permiso; las respuestas no contienen URLs directas de Drive; cambiar el ID del documento no permite acceder a otro archivo.
- **Estado:** Pendiente (ampliación de TASK-142 y TASK-153).
- **Prioridad:** P0 (Prioridad crítica / Bloqueante)
- **Orden de Ejecución:** 4 (Aislamiento de almacenamiento físico en Google Drive)
- **Componentes Afectados:**
  - `backend/accounting-service/Code.gs` (`uploadEmployeeDocument`, `uploadPaymentVoucher`)
  - `backend/academic-service/Code.gs` (`uploadStudentDocument`, `getSecureDocumentStream`)
  - Google Drive institucional (`DriveApp`)
- **Subcapacidades Relacionadas:** F40-01, F40-13, F40-14.
- **Origen del Hallazgo:** `AUDITORIA_FASE_40_SEGURIDAD_DOCUMENTAL_TRAZABILIDAD_Y_CONSERVACION.md` / Secciones C (F40-13), D (E2E-02, E2E-04) y G (Riesgo Crítico 1).
- **Problema Detectado y Riesgos:**
  Las funciones de carga de documentos laborales y comprobantes habilitan acceso público con `DriveApp.Access.ANYONE_WITH_LINK`. Cualquier persona con la URL puede consultar el archivo sin iniciar sesión. La revocación en la aplicación no anula esos enlaces públicos.
- **Requerimientos Funcionales y Técnicos Convergentes:**
  1. *Eliminación de permisos públicos en Google Drive:*
     - Eliminar toda invocación de `DriveApp.Access.ANYONE_WITH_LINK` en procesos que almacenen documentos privados o institucionales.
     - Configurar los archivos para que permanezcan privados en Drive y solo accesibles mediante operaciones autenticadas.
  2. *Mecanismo centralizado de streaming seguro:*
     - Centralizar la entrega mediante streaming seguro validando: sesión activa, permisos sobre el documento específico, ámbito/expediente/departamento, ausencia de bloqueos o revocaciones, y registro previo de la operación.
     - Diferenciar permisos de consulta, vista previa y descarga; la consulta de metadatos no debe conceder acceso al binario.
     - Evitar que las respuestas devuelvan enlaces directos permanentes de Google Drive.
  3. *Tokens temporales efímeros:*
     - Generar tokens de corta duración vinculados a documento, versión, usuario y operación. Validación estricta en servidor.
     - Invalidar tokens al expirar, revocar permiso, cerrar acceso o cambiar el estado de seguridad del archivo.
     - Proteger contra rutas alternativas, miniaturas o enlaces en caché.
     - Mantener acceso público exclusivamente para documentos declarados formalmente como tales; la emisión de CUV no convierte automáticamente el archivo original en público.
- **Criterios de Aceptación:**
  - [ ] Subir un contrato laboral y un comprobante de pago: ambos quedan privados en Drive.
  - [ ] Abrir sus URLs directas desde una sesión anónima: el acceso es denegado.
  - [ ] Intentar consultar el documento con un usuario sin permisos: la solicitud es denegada.
  - [ ] Intentar descargarlo con un usuario que solo tiene permiso de consulta de metadatos: la descarga es denegada.
  - [ ] Revocar el permiso de un usuario y reutilizar su enlace: el acceso es denegado.
  - [ ] Reutilizar un token vencido, revocado o asociado a otra versión: el servidor rechaza la solicitud.
  - [ ] Ningún proceso de carga privado vuelve a establecer `ANYONE_WITH_LINK`.
- **Dependencias:** F40-Task01, F40-Task03.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 6176-6207; clave TASK-143; asignación única: Secretaria -->

---

<!-- ID: TASK-143 | Fuentes: Pendientes.md ; pendientes/Secretaria/Pendientes.md -->
### [ ] [TASK-143] [P0] Auditar y remediar los permisos públicos preexistentes en Google Drive (F40-22)
- **Prioridad:** P0 (Prioridad crítica / Bloqueante)
- **Orden de Ejecución:** 5 (Saneamiento de almacenamiento histórico)
- **Componentes Afectados:**
  - `backend/accounting-service/Code.gs` (`remediateLegacyPublicDrivePermissions`)
  - Google Drive institucional (`DriveApp`)
  - Hoja de Cálculo: `ReporteRemediacionPermisosDrive`
- **Subcapacidades Relacionadas:** F40-13, F40-22.
- **Origen del Hallazgo:** `AUDITORIA_FASE_40_SEGURIDAD_DOCUMENTAL_TRAZABILIDAD_Y_CONSERVACION.md` / Secciones C (F40-13), D (E2E-02) y Especificación Técnica ChatGPT/Jules.
- **Problema Detectado y Riesgos:**
  Eliminar la asignación de enlaces públicos en nuevas cargas no resuelve la exposición de los archivos que ya fueron compartidos históricamente con `ANYONE_WITH_LINK`, los cuales permanecen accesibles en internet si se conoce el identificador.
- **Requerimientos Funcionales y Técnicos Convergentes:**
  1. *Inventario exhaustivo de permisos en Drive:*
     - Barrer carpetas documentales institucionales e identificar permisos generales públicos y permisos heredados.
     - Identificar archivos compartidos con usuarios o grupos desvinculados de la institución.
     - Diferenciar documentos expresamente públicos de aquellos que deben ser privados.
  2. *Reporte de auditoría y revocación automática:*
     - Generar reporte en `ReporteRemediacionPermisosDrive`: Archivo, Categoría, Registro relacionado, Tipo de permiso, Origen del permiso, Fecha de detección, Nivel de riesgo.
     - Ejecutar revocación masiva de permisos públicos no autorizados, verificando el resultado real consultando nuevamente los permisos efectivos del archivo.
     - Detectar permisos heredados desde carpetas superiores y resolverlos en el nivel donde se originan.
     - Permitir revisión manual de casos ambiguos antes de modificar permisos.
- **Criterios de Aceptación:**
  - [ ] Inventaría y clasifica con precisión archivos de prueba públicos vs restringidos.
  - [ ] Identifica permisos públicos heredados desde carpetas padre señalando su origen.
  - [ ] Revoca el permiso público no autorizado y confirma que el archivo deja de ser accesible anónimamente.
  - [ ] Los archivos catalogados formalmente como públicos institucionales no se modifican.
  - [ ] Se conserva la evidencia documental completa de la detección y remediación.
- **Dependencias:** F40-Task04.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 6208-6240; clave TASK-144; asignación única: Secretaria -->

---

<!-- ID: TASK-144 | Fuentes: Pendientes.md ; pendientes/Secretaria/Pendientes.md -->
### [ ] [TASK-144] [P0] Implementar integridad criptográfica SHA-256 para archivos y versiones (F40-02)
- **Prioridad:** P0 (Prioridad crítica / Bloqueante)
- **Orden de Ejecución:** 6 (Integridad criptográfica y detección de alteraciones)
- **Componentes Afectados:**
  - `backend/academic-service/Code.gs` (`uploadStudentDocument`, `verifyDocumentIntegritySha256`)
  - `backend/accounting-service/Code.gs` (`uploadEmployeeDocument`, `generateSchoolDocument`)
  - Hojas de Cálculo: `DocumentosEstudiante`, `DocumentosLaborales`, `DocumentosEscolaresEmitidos`
- **Subcapacidades Relacionadas:** F40-09, F40-10.
- **Origen del Hallazgo:** `AUDITORIA_FASE_40_SEGURIDAD_DOCUMENTAL_TRAZABILIDAD_Y_CONSERVACION.md` / Secciones C (F40-09) y Especificación Técnica ChatGPT/Jules.
- **Problema Detectado y Riesgos:**
  Los archivos subidos carecen de una huella SHA-256 persistida y verificable. El mecanismo `computeSimpleHash` usado en respaldos emplea DJB2, vulnerable a colisiones e inadecuado para probar inalterabilidad. Sustituciones directas en Drive pasan desapercibidas.
- **Requerimientos Funcionales y Técnicos Convergentes:**
  1. *Cálculo y persistencia de hash SHA-256:*
     - Calcular SHA-256 del contenido binario real al incorporar cualquier documento (`Utilities.computeDigest`).
     - Registrar el hash junto con: ID de documento, ID de versión, ID de archivo físico en Drive, tamaño en bytes, tipo MIME validado, fecha de incorporación, usuario o proceso responsable.
     - Calcular una huella independiente para cada versión; una versión nueva nunca debe sobrescribir la huella histórica.
  2. *Verificación obligatoria en puntos de control:*
     - Verificar hash: antes de entregar por streaming, al restaurar versiones, al verificar firmas/aprobaciones, al comprobar respaldos y en conciliaciones periódicas.
     - Si el hash no coincide, bloquear la entrega y generar evento de integridad comprometida.
     - Permitir consulta de integridad sin facultades para alterar el hash. La edición de metadatos ordinarios no debe reemplazar el hash.
     - Para históricos sin hash, permitir migración controlada identificando el hash como calculado retrospectivamente.
- **Criterios de Aceptación:**
  - [ ] Subir un archivo de prueba genera y almacena su huella SHA-256.
  - [ ] Descargarlo mediante streaming verifica y confirma la coincidencia del hash.
  - [ ] Modificar una copia en Drive sin actualizar el hash registrado hace fallar la verificación y bloquea la entrega.
  - [ ] Subir una nueva versión genera una huella nueva preservando la huella histórica previa.
  - [ ] Restaurar una versión comprueba su hash antes de declararla vigente.
  - [ ] Se descarta totalmente DJB2 para fines de integridad criptográfica.
- **Dependencias:** F40-Task04.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 6241-6272; clave TASK-145; asignación única: Secretaria -->

---

<!-- ID: TASK-145 | Fuentes: Pendientes.md ; pendientes/Secretaria/Pendientes.md -->
### [ ] [TASK-145] [P0] Completar la procedencia documental y el registro de responsables (F40-13)
- **Prioridad:** P0 (Prioridad crítica / Bloqueante)
- **Orden de Ejecución:** 7 (Cadena de custodia y metadatos de origen)
- **Componentes Afectados:**
  - `backend/academic-service/Code.gs` (`uploadStudentDocument`, `restoreDocumentVersion`)
  - `backend/accounting-service/Code.gs` (`uploadEmployeeDocument`, `generateSchoolDocument`)
  - Hojas de Cálculo: `DocumentosEstudiante`, `DocumentosLaborales`, `RegistroProcedenciaDocumental`
- **Subcapacidades Relacionadas:** F40-04, F40-13.
- **Origen del Hallazgo:** `AUDITORIA_FASE_40_SEGURIDAD_DOCUMENTAL_TRAZABILIDAD_Y_CONSERVACION.md` / Secciones C (F40-04) y Especificación Técnica ChatGPT/Jules.
- **Problema Detectado y Riesgos:**
  Los registros identifican al usuario y fecha de subida, pero no conservan de forma uniforme el canal de origen ni suficiente metadata técnica para reconstruir la cadena de custodia de cómo llegó el documento a la institución.
- **Requerimientos Funcionales y Técnicos Convergentes:**
  1. *Registro estructurado de canales de procedencia:*
     - Canales reconocidos: Carga manual, Formulario institucional, Portal del estudiante/tutor, Importación masiva, Generación automática, Integración externa, Migración de archivos históricos.
     - Registrar usuario responsable o identidad de proceso automático, fecha/hora ISO, servicio de origen y referencia de operación.
     - Asociar con expediente, solicitud o trámite institucional.
  2. *Segregación de roles de intervención:*
     - Diferenciar: Autor/emisor original, Persona que realizó la carga, Persona que revisó el documento, Persona que aprobó o rechazó, Responsable de su custodia física o digital.
     - Mantener procedencia independiente por versión al reemplazar o restaurar.
     - En documentos migrados, registrar la fuente original conocida sin presentar la fecha de migración como fecha de creación original.
     - Permitir consultar la cadena de procedencia desde el detalle del documento y del expediente.
- **Criterios de Aceptación:**
  - [ ] Cargas manuales registran canal y usuario de carga específico.
  - [ ] Documentos generados identifican el proceso automático y plantilla empleada.
  - [ ] Documentos migrados se marcan como históricos conservando su procedencia original.
  - [ ] Nuevas versiones registran origen y responsable propios sin alterar los anteriores.
  - [ ] Consultar el documento expone la cadena completa diferenciando autor, cargador y aprobador.
- **Dependencias:** F40-Task06.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 6339-6370; clave TASK-148; asignación única: Secretaria -->

---

<!-- ID: TASK-148 | Fuentes: Pendientes.md ; pendientes/Secretaria/Pendientes.md -->
### [ ] [TASK-148] [P0] Vincular criptográficamente firmas, aprobaciones y documentos finales (F40-04)
- **Prioridad:** P0 (Prioridad crítica / Bloqueante)
- **Orden de Ejecución:** 10 (No repudio y validación de versiones aprobadas)
- **Componentes Afectados:**
  - `backend/user-service/Code.gs` (`registerDocumentSignature`)
  - `backend/accounting-service/Code.gs` (`generateSchoolDocument`)
  - Hoja de Cálculo: `FirmasConformidades`
- **Subcapacidades Relacionadas:** F40-07, F40-08.
- **Origen del Hallazgo:** `AUDITORIA_FASE_40_SEGURIDAD_DOCUMENTAL_TRAZABILIDAD_Y_CONSERVACION.md` / Secciones C (F40-08), D (E2E-03) y Especificación Técnica ChatGPT/Jules.
- **Problema Detectado y Riesgos:**
  El registro de firmas usa un token pseudoaleatorio `VERIF-` (`Math.random()`) desconectado del contenido binario del documento. Alterar el archivo con posterioridad a la aprobación no invalida la firma, vulnerando el no repudio.
- **Requerimientos Funcionales y Técnicos Convergentes:**
  1. *Sellado criptográfico y HMAC:*
     - Vincular la firma a: ID de documento, ID de versión, SHA-256 del binario exacto, Identidad del firmante, Fecha/hora ISO, Tipo de aceptación, Contexto de aprobación, Estado de validez.
     - Sustituir el token aleatorio por un identificador seguro HMAC-SHA256 (`Utilities.computeHmacSha256Signature`).
     - Separar conceptualmente: Aceptación interna del usuario, Firma electrónica institucional, Firma electrónica avanzada/certificada externa.
  2. *Bloqueo de versión y versiones correctivas:*
     - Si el documento se modifica tras ser firmado, conservar la versión firmada intacta y registrar la nueva como documento correctivo derivado.
     - Permitir verificar la firma contra el hash del documento y el historial de eventos.
     - Mantener el CUV ampliándolo para verificar la integridad del archivo emitido.
- **Criterios de Aceptación:**
  - [ ] Registrar firma almacena el hash SHA-256 de la versión exacta firmada.
  - [ ] Verificar documento original confirma la validez de la firma.
  - [ ] Alterar el binario provoca que la verificación de firma falle de inmediato.
  - [ ] Sustituir directamente el archivo firmado mediante operaciones ordinarias queda bloqueado.
  - [ ] Crear versiones correctivas preserva la versión firmada original y registra la nueva relación.
  - [ ] El sistema no atribuye validez de firma avanzada certificada si solo representa conformidad interna.
- **Dependencias:** F40-Task06, F40-Task08.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 6371-6405; clave TASK-149; asignación única: Secretaria -->

---

<!-- ID: TASK-149 | Fuentes: AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-07.md ; Pendientes.md ; pendientes/Secretaria/Pendientes.md -->
### [ ] [TASK-149] [P0] Implementar el motor de conservación, archivo y bloqueo legal (F40-06)
- Convertir el archivado de expedientes y registros financieros en una operación real, verificable y trazable; un contador `itemsArchived` no acredita que los datos se hayan archivado.
- Aplicar políticas de conservación y legal hold a los registros y documentos asociados, impidiendo su eliminación mientras exista una obligación de preservación.
- Definir la disposición de respaldos vencidos y documentos retenidos mediante autorización controlada, registro de ejecución y evidencia de eliminación/archivo.
- Validar que las políticas se ejecuten sobre los datos y archivos correspondientes, no solo que estén declaradas o contabilizadas.
- **Prioridad:** P0 (Prioridad crítica / Bloqueante)
- **Orden de Ejecución:** 11 (Ciclo de vida documental y retención WORM / Legal Hold)
- **Componentes Afectados:**
  - `backend/academic-service/Code.gs` (`applyDocumentRetentionPolicies`, `setDocumentLegalHold`, `closeDocumentLifecycleStage`)
  - Hojas de Cálculo: `PoliticasRetencionDocumental`, `BloqueosLegalesDocumentos`, `DocumentosEstudiante`
- **Subcapacidades Relacionadas:** F40-11, F40-12, F40-20.
- **Origen del Hallazgo:** `AUDITORIA_FASE_40_SEGURIDAD_DOCUMENTAL_TRAZABILIDAD_Y_CONSERVACION.md` / Secciones C (F40-11, F40-12) y Especificación Técnica ChatGPT/Jules.
- **Problema Detectado y Riesgos:**
  No existen reglas que definan cuánto tiempo debe conservarse cada categoría documental, cuándo debe pasar a archivo pasivo y qué documentos deben permanecer bloqueados ante investigaciones, arriesgando destrucción prematura de expedientes.
- **Requerimientos Funcionales y Técnicos Convergentes:**
  1. *Políticas de retención configurables:*
     - Crear el modelo en `PoliticasRetencionDocumental`: Categoría y tipos de documentos afectados, Periodo de conservación en años/meses, Evento iniciador del cómputo (creación, cierre de expediente, egreso, fin de contrato), Fecha de inicio y vencimiento estimado, Destino final (conservación permanente, transferencia a archivo, revisión, disposición), Responsable y vigencia de la política.
  2. *Estados de ciclo de vida documental:*
     - Estados diferenciados: `Activo`, `Cerrado`, `En_Conservacion`, `En_Revision_Disposicion`, `Bloqueado_Legal`, `Elegible_Disposicion`, `Archivado_Permanente`, `Dispuesto`.
     - Cierre documental que impida modificaciones ordinarias cuando el documento pase a conservación.
  3. *Mecanismo de Legal Hold (Retención Legal):*
     - Asociar bloqueos a documentos o expedientes con motivo, responsable, fecha y autoridad ordenante.
     - Admitir múltiples bloqueos simultáneos; levantar uno no elimina los demás.
     - Impedir disposición mientras exista al menos un bloqueo activo.
     - Suspender el cómputo de conservación ante litigios o investigaciones.
     - Conservar metadatos de documentos dispuestos cuando la política lo exija.
     - Línea de tiempo completa de hitos de conservación. Plazos configurables por institución sin imposiciones arbitrarias.
- **Criterios de Aceptación:**
  - [ ] Políticas diferenciadas para documentos académicos, laborales, financieros e institucionales.
  - [ ] Cerrar un expediente inicia el cómputo de conservación según la política asociada.
  - [ ] Si se aplican dos bloqueos legales a un documento, retirar uno mantiene el bloqueo activo del otro.
  - [ ] Intentar disponer de un documento con retención legal activa es denegado terminantemente.
  - [ ] Vencer el plazo ordinario traslada el documento a estado de revisión sin destruirlo automáticamente.
  - [ ] Modificar una política conserva la versión histórica asociada a los documentos ya emitidos.
- **Dependencias:** F40-Task02, F40-Task07.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 6406-6440; clave TASK-150; asignación única: Secretaria -->

---

<!-- ID: TASK-150 | Fuentes: Pendientes.md ; pendientes/Secretaria/Pendientes.md -->
### [ ] [TASK-150] [P0] Implementar doble autorización y disposición documental controlada (F40-07)
- **Prioridad:** P0 (Prioridad crítica / Bloqueante)
- **Orden de Ejecución:** 12 (Flujo de cuatro ojos para eliminación y baja documental)
- **Componentes Afectados:**
  - `backend/academic-service/Code.gs` (`requestDocumentDisposal`, `approveDocumentDisposal`, `executeDocumentDisposal`)
  - Hoja de Cálculo: `SolicitudesBajaDocumental`
- **Subcapacidades Relacionadas:** F40-12, F40-21.
- **Origen del Hallazgo:** `AUDITORIA_FASE_40_SEGURIDAD_DOCUMENTAL_TRAZABILIDAD_Y_CONSERVACION.md` / Secciones C (F40-21) y Especificación Técnica ChatGPT/Jules.
- **Problema Detectado y Riesgos:**
  Existe doble aprobación para compras, pero no para la eliminación definitiva de documentos. Cambiar un estado lógico no constituye un flujo formal de autorización, exponiendo a la institución a destrucción de antecedentes por negligencia o acción unilateral.
- **Requerimientos Funcionales y Técnicos Convergentes:**
  1. *Flujo de cuatro ojos para disposición:*
     - Separar etapas: Solicitud, Revisión, Doble Autorización y Ejecución.
     - Exigir dos autorizaciones independientes de roles autorizados (ej. Secretaría + Dirección).
     - Prohibir que el mismo usuario solicite y apruebe su propia petición.
  2. *Validaciones previas a la aceptación:*
     - Comprobar que el documento es elegible por política de retención, carece de bloqueos legales activos, no tiene investigaciones pendientes, no forma parte de expedientes obligatorios ni dependencias vigentes.
     - Exponer a los autorizadores: categoría, motivo, fechas, política, historial y dependencias.
     - Opciones: Aprobar, Rechazar o Devolver con observaciones.
     - Ejecución solo tras reunir todas las firmas requeridas.
     - Evidencia inmutable de disposición: ID, documento, versión, hash previo, fecha, responsables y resultado.
     - Diferenciar baja lógica, archivo pasivo, transferencia y destrucción física/digital.
     - Periodo de gracia configurable entre autorización final y ejecución física con opción de cancelación.
- **Criterios de Aceptación:**
  - [ ] Solicitar disposición crea una solicitud pendiente en la bandeja de trabajo.
  - [ ] La cuenta solicitante no puede aprobar su propia solicitud.
  - [ ] La primera aprobación mantiene la solicitud en estado de espera del segundo autorizador independiente.
  - [ ] Intentar disponer documentos con Legal Hold o plazo no vencido es denegado.
  - [ ] Rechazar una solicitud archiva el motivo sin ejecutar ninguna destrucción.
  - [ ] La ejecución final registra la evidencia completa sin borrar metadatos requeridos por ley.
- **Dependencias:** F40-Task11, F40-Task01.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 6441-6472; clave TASK-151; asignación única: Secretaria -->

---

<!-- ID: TASK-151 | Fuentes: AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-07.md ; Pendientes.md ; pendientes/Secretaria/Pendientes.md -->
### [ ] [TASK-151] [P0] Ampliar los respaldos para incluir archivos binarios y relaciones documentales (F40-09)
- Extender el respaldo más allá de las hojas JSON para incluir los archivos binarios asociados a expedientes y documentos.
- Mantener un manifiesto que relacione cada archivo con su identificador, ubicación lógica, entidad/registro propietario y dependencias documentales.
- Calcular y conservar hashes criptográficos de cada binario y del manifiesto para permitir verificar integridad y detectar omisiones o alteraciones.
- Demostrar que el respaldo cubre los archivos relacionados y no solo las filas que contienen referencias a ellos.
- **Prioridad:** P0 (Prioridad crítica / Bloqueante)
- **Orden de Ejecución:** 13 (Respaldo integral con manifiesto de archivos binarios)
- **Componentes Afectados:**
  - `backend/academic-service/Code.gs` (`createSystemBackup`, `computeSimpleHash`)
  - Google Drive institucional (`DriveApp`)
  - Archivos JSON de Respaldo Institucional
- **Subcapacidades Relacionadas:** F40-15, F40-16.
- **Origen del Hallazgo:** `AUDITORIA_FASE_40_SEGURIDAD_DOCUMENTAL_TRAZABILIDAD_Y_CONSERVACION.md` / Secciones C (F40-15) y Especificación Técnica ChatGPT/Jules.
- **Problema Detectado y Riesgos:**
  `createSystemBackup` respalda hojas de cálculo en JSON pero omite los archivos binarios de Drive. Restaurar una copia recupera los metadatos pero no los documentos a los que hacen referencia, dejando los expedientes vacíos ante pérdida de archivos en Drive.
- **Requerimientos Funcionales y Técnicos Convergentes:**
  1. *Manifiesto de inventario binario y relaciones:*
     - Incluir por cada archivo respaldado: ID documental, ID de versión, ID físico de origen en Drive, Nombre y tipo MIME, Tamaño en bytes, Hash SHA-256 del binario, Fechas de creación/modificación, Categoría y departamento, Relaciones con expedientes, plantillas, formularios, firmas y documentos emitidos.
  2. *Copia independiente y consistencia integral:*
     - Respaldar el contenido binario o una réplica independiente con controles equivalentes de acceso y retención.
     - Garantizar consistencia entre datos tabulares, archivos físicos, versiones, firmas y conservación.
     - Calcular SHA-256 para cada archivo y para el manifiesto completo del respaldo, reemplazando totalmente DJB2.
     - Identificador único de respaldo, fecha, alcance, estado y resultado.
     - Permitir respaldos completos e incrementales; las copias incrementales deben validar la disponibilidad del respaldo base.
     - Protección contra modificaciones y reintentos ante fallos parciales sin duplicación de archivos.
- **Criterios de Aceptación:**
  - [ ] Respaldos completos incluyen inventario y copia recuperable de documentos de Drive.
  - [ ] El manifiesto contiene todos los archivos dentro del alcance con sus huellas SHA-256 exactas.
  - [ ] Eliminar un archivo en el entorno operativo permite verificar que existe copia íntegra en el respaldo.
  - [ ] Interrupciones de respaldo se reanudan sin duplicar archivos.
  - [ ] Alterar un archivo respaldado es detectado por la verificación de integridad del manifiesto.
- **Dependencias:** F40-Task06, F40-Task07.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 6473-6505; clave TASK-152; asignación única: Secretaria -->

---

<!-- ID: TASK-152 | Fuentes: AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-07.md ; Pendientes.md ; pendientes/Secretaria/Pendientes.md -->
### [ ] [TASK-152] [P0] Implementar restauración integral y validación posterior a la recuperación (F40-10)
- Restaurar conjuntamente tablas y archivos binarios respaldados, conservando sus relaciones e identificadores.
- Verificar hashes, estructura, referencias y consistencia posterior a la recuperación; informar archivos ausentes, duplicados o relaciones rotas.
- No declarar completa una restauración cuando solo se hayan recuperado hojas de cálculo o cuando falte parte del manifiesto/binarios.
- **Prioridad:** P0 (Prioridad crítica / Bloqueante)
- **Orden de Ejecución:** 14 (Recuperación integral y verificación de consistencia)
- **Componentes Afectados:**
  - `backend/academic-service/Code.gs` (`restoreSystemBackup`, `previewBackupRestoreImpact`)
  - Google Drive institucional (`DriveApp`)
- **Subcapacidades Relacionadas:** F40-16.
- **Origen del Hallazgo:** `AUDITORIA_FASE_40_SEGURIDAD_DOCUMENTAL_TRAZABILIDAD_Y_CONSERVACION.md` / Secciones C (F40-16) y Especificación Técnica ChatGPT/Jules.
- **Problema Detectado y Riesgos:**
  `restoreSystemBackup` recupera tablas pero no valida ni recupera los archivos binarios de Drive. Restaurar registros no garantiza que los documentos estén disponibles, íntegros o correctamente vinculados.
- **Requerimientos Funcionales y Técnicos Convergentes:**
  1. *Restauración holística de datos y binarios:*
     - Restaurar: Registros institucionales, Archivos binarios en Drive, Versiones anteriores, Relaciones documentales, Metadatos de integridad, Firmas y aprobaciones, Estados de conservación, Historial de operaciones respaldado.
  2. *Vista previa de impacto y comprobación de conflictos:*
     - Mostrar previo a restaurar: Registros a crear/reemplazar, Archivos a recuperar, Conflictos con archivos actuales, Versiones a recuperar y relaciones afectadas.
     - Permitir restauración completa o selectiva (categoría, departamento, expediente).
     - Verificar SHA-256 antes y después de restaurar cada binario.
     - No sobreescribir silenciosamente archivos actuales más recientes que la fecha del respaldo.
     - Reporte final de elementos recuperados, omitidos, fallidos y pendientes.
     - Validación post-recuperación de disponibilidad, hash, vínculos, historial y permisos.
     - Evitar restaurar permisos públicos o inseguros presentes en respaldos antiguos.
- **Criterios de Aceptación:**
  - [ ] Restaurar un respaldo completo recupera archivos binarios y tablas con éxito.
  - [ ] Restaurar documentos individuales restablece sus relaciones correctas con el expediente.
  - [ ] Se verifica el hash SHA-256 de los archivos restaurados.
  - [ ] Archivos con hash discrepante respecto al manifiesto son bloqueados o marcados como fallidos.
  - [ ] Respaldos antiguos frente a archivos actuales más recientes disparan advertencia de conflicto.
  - [ ] Los permisos restaurados son privados y respetan las políticas actuales de seguridad.
- **Dependencias:** F40-Task13.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 6637-6685; clave TASK-156; asignación única: Secretaria -->

---

<!-- ID: TASK-156 | Fuentes: Pendientes.md ; pendientes/Secretaria/Pendientes.md -->
### [ ] [TASK-156] [P0] Gestión integral del ciclo de vida de solicitudes de firma multifirmante
- **Prioridad:** P0 (Prioridad crítica / Bloqueante)
- **Orden de Ejecución:** 4 (Orquestación de firmas, trazabilidad de entrega y no repudio)
- **Componentes Afectados:**
  - `backend/user-service/Code.gs` (`createSignatureWorkflow`, `getSignatureWorkflowStatus`, `registerDocumentSignature`, `cancelSignatureWorkflow`)
  - Hojas de Cálculo: `SolicitudesFirmas`, `FirmasConformidades`, `EventosTrazabilidadFirmas`
- **Subcapacidades Relacionadas:** F41-07.
- **Origen del Hallazgo:** `AUDITORIA_FASE_41_PRUEBAS_INTEGRALES_DIGITALIZACION.md` / Secciones B (F41-07), E (E2E-41-08) y Especificación Técnica ChatGPT/Jules.
- **Problema Detectado y Riesgos:**
  `registerDocumentSignature` solo registra la firma consumada unitaria. No existe seguimiento completo de estados intermedios ni soporte para solicitudes con múltiples firmantes en orden secuencial. El sistema confunde el envío de la solicitud con la entrega real y la visualización por parte del destinatario.
- **Requerimientos Funcionales y Técnicos Convergentes:**
  1. *Máquina de estados formal de solicitudes:*
     - Crear la hoja `SolicitudesFirmas` con estados controlados: `Borrador`, `Enviado`, `Entregado`, `Visto`, `Firmado_Parcial`, `Completado`, `Rechazado`, `Cancelado`, `Vencido`, `Error_Entrega`.
     - No confundir `Entregado` con `Visto`: una notificación aceptada por el servidor no prueba que la persona haya abierto el documento.
  2. *Soporte multifirmante con orden secuencial o paralelo:*
     - Configurar múltiples participantes definiendo el orden de firma (paso 1, paso 2) o firma paralela.
     - Determinar qué participantes firman y cuáles solo reciben copia informativa.
     - Impedir terminantemente que un firmante posterior firme antes que el firmante previo en flujos secuenciales.
     - Identificar en todo momento quién tiene pendiente la siguiente acción.
  3. *Seguridad criptográfica y tokens efímeros:*
     - Vincular cada solicitud al documento exacto, versión y hash SHA-256 del binario.
     - Generar tokens seguros con entropía criptográfica (HMAC-SHA256 con expiración y revocación), descartando `Math.random()`.
     - Validar la identidad y facultades del firmante antes de aceptar su acción.
  4. *Registro de eventos bilaterales y notificaciones:*
     - Registrar en `EventosTrazabilidadFirmas`: Creación, Envío, Entrega, Apertura, Inicio de firma, Firma completada, Rechazo, Cancelación, Vencimiento, Recordatorios y Errores.
     - Notificar bilateralmente al emisor y destinatarios ante avances, rechazos o finalización.
     - Evitar notificaciones duplicadas por reintentos.
  5. *Generación de documento final inmutable:*
     - Generar el PDF final con sellado de tiempo y firmas sólo tras completar todas las firmas requeridas.
     - Relacionar el documento final con las evidencias de cada firmante bloqueando modificaciones posteriores.
- **Criterios de Aceptación:**
  - [ ] Permite enviar una solicitud a dos o más firmantes respetando el orden secuencial configurado.
  - [ ] El firmante posterior no puede completar su acción hasta que el firmante previo haya firmado.
  - [ ] Los estados reflejan eventos reales distinguiendo entre enviado, entregado y visto.
  - [ ] El rechazo o cancelación detiene el flujo y notifica de inmediato al emisor con las observaciones registradas.
  - [ ] La firma queda vinculada al hash SHA-256 de la versión exacta del documento.
  - [ ] El historial permite reconstruir cronológicamente todo el proceso con fechas, IPs y participantes.
- **Dependencias:** F40-Task04, F40-Task02, sistema de notificaciones y usuarios.
- **Estado:** [ ] Pendiente

---

<!-- ID: TASK-221 | Fuentes: AUDITORIAS/AUDITORIA_COMPLETADAS_T-UX-16.md ; Pendientes.md ; pendientes/Secretaria/Pendientes.md -->
### [ ] [TASK-221] [P1] [Bandeja de Entrada - Bandeja Unificada de Trabajo Institucional]
- **Hallazgo de origen:** AUD-NG-204 (CRÍTICO/P0); coordinación con AUD-NG-036 y AUD-NG-024.
- **Severidad:** Crítica. **Objetivo:** asegurar que cada usuario solo lea y modifique notificaciones, tareas y aprobaciones dentro de su identidad y ámbito autorizado.
- **Acción ejecutable:** hacer que `markNotificationAsRead` valide en backend la identidad autenticada y la propiedad del registro antes de mutar; derivar rol/departamento desde contexto verificado y no desde payload; eliminar confianza en IDs de usuario, tutor, revisor o departamento suministrados por el cliente, conservando los alcances específicos de AUD-NG-036/AUD-NG-024.
- **Archivos/módulos:** `backend/user-service/Code.gs`; `markNotificationAsRead`; `getDepartmentalWorkInbox`; `getAuthorizationRequests`; `processWorkflowDecision`; validadores RBAC/ABAC.
- **Dependencias/riesgos:** TASK-318; AUD-NG-036; AUD-NG-024; matriz de permisos institucional. Riesgo de IDOR, lectura cruzada y decisiones atribuidas a otra identidad.
- **Alcance:** controles server-side por usuario, recurso y departamento; no limitarse a ocultar botones en frontend.
- **Criterios de aceptación:** lectura/marcado de notificación ajena denegados; departamento y rol se derivan de identidad verificada; payload manipulado no altera la autoridad efectiva; pruebas negativas con ID ajeno, departamento falso, tutor falso y revisor falso; cada denegación queda trazada.
- **Prioridad:** P0. **Estado:** Pendiente de ejecución/revalidación.
- **Evidencia de cierre:** pendiente; el informe detectó actualización por ID sin comprobación de propietario y confianza en departamento/rol del payload.
- **Componentes Afectados:**
  - `backend/user-service/Code.gs`
  - `js/api.js`
- **Dependencias Expuestas:** `F23-Task02`, `F23-Task07`, `F23-Task15`.
- **Capacidades Relacionadas:** F23-004, F23-016, F23-022, F23-030.
- **Problema Detectado:**
  Las tareas, aprobaciones y solicitudes se encuentran distribuidas entre diferentes registros y módulos. No existe una bandeja consolidada que permita conocer las responsabilidades pendientes de cada usuario.
- **Requisitos Funcionales:**
  1. Consolidar las tareas provenientes de los diferentes módulos.
  2. Incorporar aprobaciones pendientes, trámites, revisiones, solicitudes administrativas y otras actividades que utilicen el motor común.
  3. Crear una vista personal según el usuario autenticado.
  4. Crear una vista departamental según sus permisos.
  5. Diferenciar las tareas asignadas directamente de las tareas disponibles para un grupo o rol.
  6. Mostrar:
     - Tipo de actividad.
     - Descripción.
     - Proceso relacionado.
     - Solicitante.
     - Responsable.
     - Departamento.
     - Prioridad.
     - Estado.
     - Fecha de creación.
     - Fecha límite.
     - Tiempo restante o retraso.
     - Acción disponible.
  7. Incorporar filtros y búsqueda.
  8. Permitir ordenar por prioridad, vencimiento y fecha.
  9. Permitir abrir directamente el trámite original.
  10. Actualizar el estado de las tareas después de cada decisión.
  11. Evitar duplicados al consolidar registros.
  12. Mostrar indicadores de carga por responsable.
  13. Permitir identificar tareas sin asignar y tareas bloqueadas.
- **Mejoras de Experiencia Esperadas:**
  - Indicadores visuales de vencimiento (semáforo de criticidad).
  - Filtros persistentes por estado y departamento.
  - Búsqueda por identificador y solicitante.
  - Acceso rápido a las tareas urgentes.
  - Separación entre pendientes personales y departamentales.
  - Identificación clara de tareas que requieren acción y tareas informativas.
- **Criterios de Aceptación:**
  - [ ] Crear tareas desde dos módulos diferentes (ej. compras y trámites escolares).
  - [ ] Comprobar que ambas aparecen en la bandeja correspondiente del revisor.
  - [ ] Verificar que cada usuario visualiza únicamente las actividades autorizadas.
  - [ ] Reasignar una tarea y comprobar la actualización inmediata de la bandeja.
  - [ ] Completar una tarea y verificar su retiro de la bandeja de pendientes.
  - [ ] Aplicar filtros simultáneos y verificar ordenamiento.
  - [ ] Verificar que una misma actividad no aparece duplicada.

- **Ampliación C1.57 / T-UX-16 (2026-11-06):**
  - **AUD-NG-205 (ALTO/P1):** integrar `window.consolidatePendingApprovalsAndNotifications` con datos reales. En `js/ui-common.js:2081-2114` solo transforma un array; no consulta ni consolida fuentes. No hay referencias directas al helper en `js/api.js`, `js/student.js`, `js/teacher.js`, `js/secretary.js` ni `js/accounting.js`. El backend no contiene `getUserWorkInbox`; `getDepartmentalWorkInbox` solo devuelve solicitudes departamentales. Coordinar con TASK-318 sin duplicar SLA.
  - **AUD-NG-204 (CRÍTICO/P0):** aplicar autorización por registro y departamento en servidor. No confiar en userId, departamento o authRole enviados por el navegador. `markNotificationAsRead` no verifica el propietario y `getDepartmentalWorkInbox` incluye todas las solicitudes si el payload indica direccion/administrador. Reconciliar con AUD-NG-036 (relación legal de tutor) y AUD-NG-024 (identidad del revisor).
  - El contrato debe distinguir notificación informativa, tarea accionable y aprobación pendiente; incluir fuente, registro relacionado, estado, fecha, vencimiento, prioridad, responsable, ámbito y acción disponible. Los contadores deben derivarse del mismo conjunto autorizado.
  - **Criterios adicionales:** usuario A no consulta ni altera elementos de B; Secretaría no obtiene solicitudes de Dirección cambiando el parámetro; cada rol ve solo actividades autorizadas; los enlaces revalidan permisos; tareas completadas salen de pendientes sin perder historial; una actividad duplicada por varias fuentes aparece una sola vez con clave estable.

- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 9030-9071; clave TASK-227; asignación única: Secretaria -->

---

<!-- ID: F10-TASK05 | Fuentes: Pendientes.md ; pendientes/Secretaria/Pendientes.md -->
### [ ] [F10-TASK05] Ampliar la gestión de justificaciones, permisos y salidas anticipadas
- **Origen del Hallazgo:** `AUDITORIA_FASE_10_ASISTENCIA_DISCIPLINA_CONVIVENCIA.md` / Tarea 10.3 (P1)
- **Prioridad:** P1
- **Severidad/Clasificación:** Alta (Justificaciones y salidas)
- **Archivos Involucrados:**
  - `backend/academic-service/Code.gs`
  - `js/secretary.js` / `js/teacher.js`
- **Dependencias Expuestas:** JustificacionesAsistencia, SalidasAnticipadas
- **Descripción del Alcance:**
  Establecer el ciclo de vida completo de solicitudes (Borrador, Presentada, Pendiente, Requiere información, Aprobada, Rechazada, Cancelada), vincular solicitudes con sesiones afectadas y registrar retiradas de alumnos por adultos autorizados.
- **Criterios de Aceptación:**
  - Las justificaciones y salidas aplican transiciones de estado estrictas y actualizan dinámicamente la asistencia.
- **Estado:** Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 364-378; clave F10-Task07; asignación única: Secretaria -->

---

<!-- ID: F10-TASK07 | Fuentes: Pendientes.md ; pendientes/Secretaria/Pendientes.md -->
### [ ] [F10-TASK07] Completar el ciclo de vida de las incidencias de convivencia escolar
- **Origen del Hallazgo:** `AUDITORIA_FASE_10_ASISTENCIA_DISCIPLINA_CONVIVENCIA.md` / Tarea 10.5 (P1)
- **Prioridad:** P1
- **Severidad/Clasificación:** Alta (Convivencia y disciplina)
- **Archivos Involucrados:**
  - `backend/academic-service/Code.gs`
- **Dependencias Expuestas:** IncidenciasAsistencia, CasosSeguimiento
- **Descripción del Alcance:**
  Establecer un ciclo de vida transparente para incidencias disciplinarias (Reportada, Pendiente revisión, En investigación, Confirmada, Cerrada, Reabierta) diferenciando reportes iniciales de decisiones institucionales y medidas correctivas.
- **Criterios de Aceptación:**
  - Las incidencias cumplen el ciclo de vida completo sin aplicar sanciones automáticas prematuras.
- **Estado:** Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 379-393; clave F10-Task08; asignación única: Secretaria -->

---

<!-- ID: F10-TASK08 | Fuentes: Pendientes.md ; pendientes/Secretaria/Pendientes.md -->
### [ ] [F10-TASK08] Estructurar el seguimiento de compromisos, intervenciones y evidencias
- **Origen del Hallazgo:** `AUDITORIA_FASE_10_ASISTENCIA_DISCIPLINA_CONVIVENCIA.md` / Tarea 10.6 (P1)
- **Prioridad:** P1
- **Severidad/Clasificación:** Alta (Seguimiento de acuerdos y evidencias)
- **Archivos Involucrados:**
  - `backend/academic-service/Code.gs`
- **Dependencias Expuestas:** CasosSeguimiento
- **Descripción del Alcance:**
  Normalizar los compromisos y seguimientos dentro de estructuras estables e independientes, permitiendo evaluar plazos, estados de cumplimiento y evidencias adjuntas sin perder historial.
- **Criterios de Aceptación:**
  - Cada compromiso posee identificador inmutable y permite seguimiento individual.
- **Estado:** Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 394-409; clave F10-Task09; asignación única: Secretaria -->

---

<!-- ID: F10-TASK09 | Fuentes: Pendientes.md ; pendientes/Secretaria/Pendientes.md -->
### [ ] [F10-TASK09] Completar el modelo funcional de consejería escolar
- **Origen del Hallazgo:** `AUDITORIA_FASE_10_ASISTENCIA_DISCIPLINA_CONVIVENCIA.md` / Tarea 10.8 (P1)
- **Prioridad:** P1
- **Severidad/Clasificación:** Alta (Acompañamiento escolar y consejería)
- **Archivos Involucrados:**
  - `backend/academic-service/Code.gs`
  - `backend/user-service/Code.gs`
- **Dependencias Expuestas:** CasosSeguimiento, AsignacionesAmbitosRoles
- **Descripción del Alcance:**
  Desarrollar el flujo completo para consejeros escolares: asignación de alumnos, programación de citas, actas de seguimiento, notas de confidencialidad y derivaciones a otros profesionales.
- **Criterios de Aceptación:**
  - Los consejeros gestionan acompañamientos con privacidad y derivación inmutable.
- **Estado:** Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 442-456; clave F10-Task12; asignación única: Secretaria -->

---

<!-- ID: F10-TASK12 | Fuentes: Pendientes.md ; pendientes/Secretaria/Pendientes.md -->
### [ ] [F10-TASK12] Optimizar las notificaciones y las comunicaciones escolares
- **Origen del Hallazgo:** `AUDITORIA_FASE_10_ASISTENCIA_DISCIPLINA_CONVIVENCIA.md` / Tarea 10.11 (P1)
- **Prioridad:** P1
- **Severidad/Clasificación:** Alta (Comunicaciones y deduplicación)
- **Archivos Involucrados:**
  - `backend/user-service/Code.gs`
- **Dependencias Expuestas:** BandejaNotificaciones
- **Descripción del Alcance:**
  Implementar claves de deduplicación por evento/destinatario, plantillas anonimizadas y reintentos seguros para la mensajería de asistencia y convivencia.
- **Criterios de Aceptación:**
  - Las notificaciones escolares aplican deduplicación estricta y protección de privacidad.
- **Estado:** Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 457-472; clave F10-Task13; asignación única: Secretaria -->

---

<!-- ID: F10-TASK13 | Fuentes: Pendientes.md ; pendientes/Secretaria/Pendientes.md -->
### [ ] [F10-TASK13] Mejorar la gestión de evidencias y documentos sensibles
- **Origen del Hallazgo:** `AUDITORIA_FASE_10_ASISTENCIA_DISCIPLINA_CONVIVENCIA.md` / Tarea 10.14 (P1)
- **Prioridad:** P1
- **Severidad/Clasificación:** Alta (Almacenamiento de archivos y seguridad)
- **Archivos Involucrados:**
  - `backend/academic-service/Code.gs`
  - `backend/task-service/Code.gs`
- **Dependencias Expuestas:** Google Drive API, justificaciones y casos de seguimiento
- **Descripción del Alcance:**
  Validar formatos/tamaños de archivos adjuntos en justificantes e incidencias, verificar permisos antes de servir archivos y controlar sustituciones o borrados lógicos.
- **Criterios de Aceptación:**
  - Los archivos de evidencia están protegidos contra descargas por URL directas sin autenticación.
- **Estado:** Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 539-555; clave F10-Task18; asignación única: Secretaria -->

---

<!-- ID: F11-TASK03 | Fuentes: AUDITORIAS/AUDITORIA-FASE-11-COMUNICACION-BIENESTAR-SUPERVISION-FINANZAS.md ; Pendientes.md ; pendientes/Secretaria/Pendientes.md -->
### [ ] [F11-TASK03] Completar el centro unificado de comunicaciones y mensajes contextuales

**Otros títulos originales:**
- Implementar el centro unificado de comunicaciones, mensajes institucionales y avisos
- **Hallazgo de origen:** sección 1.C.1; existen notificaciones dirigidas, pero falta una interfaz unificada de conversaciones bidireccionales por estudiante/trámite.
- **Severidad:** Alta. **Objetivo:** centralizar conversaciones institucionales vinculadas a personas y trámites.
- **Acción ejecutable:** implementar bandejas y conversaciones con participantes, contexto, historial, estados de lectura y permisos; integrar los mensajes con las notificaciones existentes sin duplicar envíos.
- **Archivos/módulos:** `backend/user-service/Code.gs`, `BandejaNotificaciones`, `MensajeriaInstitucional` y vistas de comunicación.
- **Dependencias/riesgos:** identidad, permisos por participante, deduplicación y retención; riesgo de fuga de conversaciones o mensajes duplicados.
- **Alcance:** conversación contextual y consulta de historial; no reemplazar el servicio de notificaciones que el informe declara completo.
- **Criterios de aceptación:** los participantes autorizados envían y consultan mensajes; usuarios ajenos no acceden; el contexto se conserva; notificaciones no se duplican y los errores se presentan de forma recuperable.
- **Prioridad:** P1. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; el informe solo acredita notificaciones dirigidas, no chat bidireccional unificado.
- **Origen del Hallazgo:** `AUDITORIA-FASE-11-COMUNICACION-BIENESTAR-SUPERVISION-FINANZAS.md` / Área I (P1)
- **Prioridad:** P1
- **Severidad/Clasificación:** Alta (Comunicación institucional)
- **Archivos Involucrados:**
  - `backend/user-service/Code.gs`
  - `js/secretary.js` / `js/principal.js`
- **Dependencias Expuestas:** MensajeriaInstitucional, BandejaNotificaciones
- **Descripción del Alcance:**
  Desarrollar la mensajería institucional contextual organizada por estudiante, grupo o trámite, permitiendo conversaciones bidireccionales con trazabilidad y adjuntos seguros.
- **Criterios de Aceptación:**
  - Los mensajes quedan vinculados al contexto original (expediente/trámite) y solo son consultables por participantes autorizados.
- **Estado:** Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 99-113; clave F11-Task04; asignación única: Secretaria -->

---

<!-- ID: F11-TASK04 | Fuentes: AUDITORIAS/AUDITORIA-FASE-11-COMUNICACION-BIENESTAR-SUPERVISION-FINANZAS.md ; Pendientes.md ; pendientes/Secretaria/Pendientes.md -->
### [ ] [F11-TASK04] Implementar un gestor de noticias, anuncios y circulares con vigencia

**Otros títulos originales:**
- Implementar el gestor de noticias, anuncios, circulares y comunicados con vigencia
- **Hallazgo de origen:** sección 1.C.2; hay funciones de avisos, pero falta gestión de publicaciones en borrador/programadas y fechas de vigencia.
- **Severidad:** Alta. **Objetivo:** administrar publicaciones oficiales con ciclo de vida y audiencia definida.
- **Acción ejecutable:** crear operaciones para redactar, guardar borrador, programar, publicar, expirar y archivar circulares; controlar audiencia, autoría, permisos y fechas.
- **Archivos/módulos:** `backend/user-service/Code.gs`, `BandejaNotificaciones`, `MensajeriaInstitucional` y módulo de publicaciones.
- **Dependencias/riesgos:** calendario, roles editoriales y mecanismo de distribución; riesgo de publicar información fuera de vigencia o a destinatarios incorrectos.
- **Alcance:** ciclo editorial de noticias/anuncios/circulares; no duplicar el canal de notificaciones.
- **Criterios de aceptación:** cada publicación conserva autor, audiencia, fechas y estado; las programadas se publican en el momento configurado; las expiradas dejan de mostrarse como vigentes; cambios quedan auditados.
- **Prioridad:** P1. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; la sección 1.C.2 identifica expresamente la capacidad faltante.
- **Origen del Hallazgo:** `AUDITORIA-FASE-11-COMUNICACION-BIENESTAR-SUPERVISION-FINANZAS.md` / Área I (P1)
- **Prioridad:** P1
- **Severidad/Clasificación:** Alta (Difusión e información escolar)
- **Archivos Involucrados:**
  - `backend/user-service/Code.gs`
- **Dependencias Expuestas:** ComunicadosInstitucionales
- **Descripción del Alcance:**
  Permitir publicar avisos, circulares y convocatorias con segmentación por destinatarios, estado de borrador/programado, fechas de vigencia e indicadores visuales de urgencia.
- **Criterios de Aceptación:**
  - Los comunicados programados o vencidos no se presentan a usuarios fuera de su rango de vigencia.
- **Estado:** Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 114-128; clave F11-Task05; asignación única: Secretaria -->

---

<!-- ID: F11-TASK06 | Fuentes: AUDITORIAS/AUDITORIA-FASE-11-COMUNICACION-BIENESTAR-SUPERVISION-FINANZAS.md ; Pendientes.md ; pendientes/Secretaria/Pendientes.md -->
### [ ] [F11-TASK06] Incorporar control de traslapes en calendarios y citas institucionales

**Otros títulos originales:**
- Desarrollar la gestión de calendarios institucionales, convocatorias y prevención de traslapes
- **Hallazgo de origen:** sección 1.C.5; la agenda retorna eventos, pero no detecta colisiones al agendar reuniones.
- **Severidad:** Alta. **Objetivo:** impedir reservas incompatibles de recursos, participantes y horarios.
- **Acción ejecutable:** validar disponibilidad antes de confirmar una cita; detectar intersecciones por participante/recurso, zona horaria y duración; proteger la reserva frente a solicitudes concurrentes.
- **Archivos/módulos:** `backend/user-service/Code.gs`, `getInstitutionalCalendarEvents`, `bookAppointment`, `EventosCalendario`.
- **Dependencias/riesgos:** modelo de eventos, identidad de participantes y control de concurrencia; riesgo de doble reserva.
- **Alcance:** detección y prevención de traslapes; no rediseñar el calendario completo.
- **Criterios de aceptación:** una reserva conflictiva se rechaza con causa clara; reservas concurrentes no confirman el mismo espacio/participante; eventos válidos siguen consultándose correctamente.
- **Prioridad:** P1. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; el informe confirma que la detección de colisiones falta.
- **Origen del Hallazgo:** `AUDITORIA-FASE-11-COMUNICACION-BIENESTAR-SUPERVISION-FINANZAS.md` / Área I (P1)
- **Prioridad:** P1
- **Severidad/Clasificación:** Alta (Planificación y eventos)
- **Archivos Involucrados:**
  - `backend/user-service/Code.gs`
- **Dependencias Expuestas:** EventosCalendario
- **Descripción del Alcance:**
  Permitir la creación y consulta de eventos institucionales y académicos, previniendo choques de horario para los mismos espacios o participantes.
- **Criterios de Aceptación:**
  - El sistema detecta e informa incompatibilidades de horario al agendar reuniones.
- **Estado:** Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 144-158; clave F11-Task07; asignación única: Secretaria -->

---

<!-- ID: F11-TASK07 | Fuentes: AUDITORIAS/AUDITORIA-FASE-11-COMUNICACION-BIENESTAR-SUPERVISION-FINANZAS.md ; Pendientes.md ; pendientes/Secretaria/Pendientes.md -->
### [ ] [F11-TASK07] Consolidar la gestión de citas de orientación y acompañamiento estudiantil

**Otros títulos originales:**
- Fortalecer la gestión de citas de orientación y acompañamiento estudiantil
- **Hallazgo de origen:** sección 2.C.1 declara la capacidad completa y remite a F10-Task09; sección 16 conserva F11-Task07 en el backlog.
- **Severidad:** Alta (prioridad histórica P1). **Objetivo:** mantener un flujo trazable de citas, actas confidenciales y derivaciones.
- **Acción ejecutable:** reconciliar el alcance de F11-Task07 con F10-Task09; verificar que agenda, acta, confidencialidad, derivación y permisos estén cubiertos por la tarea existente; si la cobertura es íntegra, documentar equivalencia y no implementar una segunda solución.
- **Archivos/módulos:** `backend/academic-service/Code.gs`, `scheduleCounselingAppointment`, `recordCounselingSessionAct`, `referCounselingCase`, `CitasOrientacion`.
- **Dependencias/riesgos:** F10-Task09, controles de confidencialidad y agenda; riesgo de duplicar flujos o perder historial.
- **Alcance:** reconciliación de cobertura y cierre documental de la tarea histórica, no desarrollo paralelo.
- **Criterios de aceptación:** matriz requisito-evidencia demuestra cada capacidad; cualquier brecha se vincula al ID existente adecuado; no se crean IDs duplicados ni se altera el historial.
- **Prioridad:** P1. **Estado:** Pendiente (estado original del backlog).
- **Evidencia de cierre:** pendiente. **Discrepancia:** sección 2.C.1 la declara completa y verificada bajo F10-Task09; el backlog F11 la mantiene pendiente. Requiere cotejo de cobertura y estado, no asumir que el duplicado está resuelto.
- **Origen del Hallazgo:** `AUDITORIA-FASE-11-COMUNICACION-BIENESTAR-SUPERVISION-FINANZAS.md` / Área II (P1)
- **Prioridad:** P1
- **Severidad/Clasificación:** Alta (Acompañamiento y bienestar)
- **Archivos Involucrados:**
  - `backend/academic-service/Code.gs`
- **Dependencias Expuestas:** CitasOrientacion, CasosSeguimiento
- **Descripción del Alcance:**
  Gestionar la programación de citas de orientación estudiantil y entrevistas familiares con estados (Programada, Realizada, Reincidencia, Cancelada) y derivación inmutable.
- **Criterios de Aceptación:**
  - Las citas quedan ligadas al caso de seguimiento sin exponer motivos confidenciales en notificaciones públicas.
- **Estado:** Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 332-347; clave F10-Task05; asignación única: Secretaria -->

---

<!-- ID: F22-TASK06 | Fuentes: AUDITORIAS/AUDITORIA_FASE_22_GESTION_DOCUMENTAL_FORMULARIOS_FIRMA_ELECTRONICA.md -->
### [ ] [F22-TASK06] Implementar flujos de firma con múltiples firmantes secuenciales o paralelos
- **Hallazgo de origen:** secciones D/F22-17 y H P1.
- **Severidad:** Alta. **Objetivo:** completar trámites que requieren consentimiento de más de un tutor o responsable.
- **Acción ejecutable:** permitir definir firmantes requeridos, orden, rol, plazo y regla de finalización; bloquear cierre hasta recibir todas las firmas obligatorias y conservar el estado por firmante.
- **Archivos/módulos:** `backend/user-service/Code.gs`, `FlujosAprobacion`, `FirmasConformidades`, `SolicitudesAutorizacion`, dashboards de padres/dirección.
- **Dependencias/riesgos:** F22-Task02/03/04, relaciones familiares y permisos; riesgo de completar trámite con una sola firma cuando se exigen dos.
- **Alcance:** secuencia/paralelo y estados de firma; no sustituir la aprobación administrativa.
- **Criterios de aceptación:** orden y paralelismo configurables; cada firmante validado; rechazo/caducidad bloquea cierre; certificado incluye todas las firmas y su orden; reintentos idempotentes.
- **Prioridad:** P1. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; la matriz identifica múltiples firmantes como ausente.

---

<!-- ID: F29-TASK07 | Fuentes: AUDITORIAS/AUDITORIA_FASE_29_MIGRACION_Y_TRANSICION.md -->
### [ ] [F29-TASK07] Generar conciliación cuantitativa y cualitativa entre origen y destino
- **Hallazgo de origen:** F29-12; secciones C.12, E, G e I.
- **Severidad:** Alta / P1. **Objetivo:** demostrar equivalencia verificable de registros, saldos, notas, relaciones y documentos después de cada lote y del corte final.
- **Acción ejecutable:** ampliar `reconcileInconsistentData` con conteos, sumatorias monetarias, promedios, relaciones, estados, documentos y excepciones; producir acta por origen/lote/entidad con totales y firmas de aprobación.
- **Archivos/módulos:** `backend/accounting-service/Code.gs`, `backend/academic-service/Code.gs`, `AuditoriaMigraciones`, generadores de reportes y fuentes de origen.
- **Dependencias/riesgos:** F29-Task01/02/03/06/11/13/15; riesgo de falsos positivos por unidades, monedas, periodos o fórmulas distintas.
- **Alcance:** conciliación por entidad y dimensión; no reducir la validación a conteo global de filas.
- **Criterios de aceptación:** conteos y totales por origen/entidad/período; fórmulas y monedas documentadas; diferencias explicadas y asignadas; acta reproducible con checksum; aprobación humana; No-Go ante discrepancia crítica; pruebas con registros faltantes, duplicados y saldos desiguales.
- **Prioridad:** P1. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; existe reconciliación básica, pero la matriz H la califica parcial y el plan exige acta cuantitativa/cualitativa.

---

<!-- ID: F29-TASK14 | Fuentes: AUDITORIAS/AUDITORIA_FASE_29_MIGRACION_Y_TRANSICION.md -->
### [ ] [F29-TASK14] Migrar asistencia y registros operativos históricos con contexto temporal
- **Hallazgo de origen:** F29-10; sección C.10 y H.
- **Severidad:** Alta / P1. **Objetivo:** preservar registros históricos de asistencia y operación con su periodo, fecha, actor y estado originales.
- **Acción ejecutable:** definir esquema canónico de asistencia histórica; transformar zonas horarias y calendarios; vincular alumno/docente/grupo/periodo mediante correspondencias; importar lotes con validación de duplicados y conservar correcciones como eventos separados.
- **Archivos/módulos:** `backend/academic-service/Code.gs`, `RegistrosAsistencia`, calendarios, `AuditoriaMigraciones` y reportes históricos.
- **Dependencias/riesgos:** F29-Task01/06/07/09/13 y F26-Task02 (formateo/zona horaria); riesgo de alterar fechas, duplicar asistencia o mezclar periodos.
- **Alcance:** asistencia y registros operativos anteriores; no recalcular presencia/ausencia ni convertir datos desconocidos en faltas.
- **Criterios de aceptación:** cada registro conserva fuente/periodo/fecha/actor; zona horaria documentada; referencias resueltas; duplicados y correcciones distinguidos; conciliación por alumno/grupo/periodo; pruebas de fechas límite, cambio de horario y registros incompletos.
- **Prioridad:** P1. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; la matriz H indica falta de consolidados anuales y necesidad de ampliar la migración operativa.

---

<!-- ID: F31-TASK06 | Fuentes: AUDITORIAS/AUDITORIA_FASE_31_DISENADOR_UNIVERSAL_DOCUMENTOS_PLANTILLAS.md -->
### [ ] [F31-TASK06] Implementar motor de lógica condicional y visibilidad dinámica
- **Hallazgo de origen:** F31-05; plan G.6.
- **Severidad:** Alta / P1. **Objetivo:** mostrar u ocultar campos/secciones y ajustar obligatoriedad según respuestas y tipo de trámite.
- **Acción ejecutable:** definir lenguaje declarativo de reglas con AND/OR, operadores y tipos permitidos; evaluar reglas en cliente para UX y revalidarlas en servidor antes de aceptar respuestas; soportar dependencias entre campos.
- **Archivos/módulos:** `backend/user-service/Code.gs`, `FormulariosInstitucionales`, `SolicitudesTramites`, renderizador de formularios y F33.
- **Dependencias/riesgos:** F31-Task02, F26-Task03 y F33 formularios/trámites; riesgo de bypass si la obligatoriedad solo se evalúa en UI.
- **Alcance:** reglas limitadas y versionadas; no ejecutar código arbitrario ni permitir ciclos infinitos de dependencias.
- **Criterios de aceptación:** operadores y tipos definidos; ciclos detectados; reglas revalidadas server-side; adjuntos obligatorios condicionales; respuestas históricas conservan versión; pruebas AND/OR, campos ocultos, datos falsificados y reglas incompatibles.
- **Prioridad:** P1. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; el informe indica que la lógica condicional depende de código ad-hoc en cliente.

---

<!-- ID: F31-TASK07 | Fuentes: AUDITORIAS/AUDITORIA_FASE_31_DISENADOR_UNIVERSAL_DOCUMENTOS_PLANTILLAS.md -->
### [ ] [F31-TASK07] Vincular automáticamente documentos emitidos con expedientes institucionales
- **Hallazgo de origen:** F31-16; plan G.7.
- **Severidad:** Alta / P1. **Objetivo:** asociar cada PDF oficial con el expediente de estudiante, empleado o trámite correspondiente.
- **Acción ejecutable:** ampliar la emisión para persistir documentId, CUV, targetType, targetId, expediente, categoría, versión, propietario, ACL y metadatos; crear enlace desde expediente y permitir consulta autorizada.
- **Archivos/módulos:** `backend/accounting-service/Code.gs`, `DocumentosEscolaresEmitidos`, `backend/academic-service/Code.gs`, `DocumentosEstudiante`, `SolicitudesTramites`.
- **Dependencias/riesgos:** F29-Task15 (transferencia documental), F33 trámites y permisos contextuales; riesgo de adjuntar un documento al expediente equivocado o exponerlo.
- **Alcance:** asociación automática tras emisión confirmada; no asumir que un enlace Drive equivale a relación de expediente válida.
- **Criterios de aceptación:** targetType/targetId canónicos; asociación idempotente; CUV y versión preservados; permisos revalidados en lectura; documento visible en expediente autorizado; pruebas de estudiante/empleado/trámite, ID inválido y acceso cruzado.
- **Prioridad:** P1. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; existe indexación parcial de targetId/estudianteUserId, pero el plan requiere integración automática completa.

---

<!-- ID: F32-TASK06 | Fuentes: AUDITORIAS/AUDITORIA_FASE_32_EDITOR_VISUAL_PDF_CAMPOS_SUPERPUESTOS.md -->
### [ ] [F32-TASK06] Generar formulario web interactivo desde plantilla PDF
- **Hallazgo de origen:** B.7 y plan H.6.
- **Severidad:** Alta / P1. **Objetivo:** permitir que familias y estudiantes diligencien campos PDF desde una interfaz web adaptable.
- **Acción ejecutable:** generar un formulario HTML tipado a partir de la plantilla/overlays; validar obligatorios, tipos, longitudes, fechas y patrones en cliente y servidor; conservar la referencia al PDF y la versión de plantilla.
- **Archivos/módulos:** `js/teacher.js`, `backend/user-service/Code.gs`, `FormulariosInstitucionales`, `SolicitudesTramites`, PDF Overlay.
- **Dependencias/riesgos:** F31-Task02/06, F33 formularios/trámites y F32-Task05/14; riesgo de desalineación entre el formulario y la versión PDF que se emite.
- **Alcance:** formulario generado desde una plantilla PDF; no reemplazar el motor de trámites institucional ni confiar en validación cliente.
- **Criterios de aceptación:** campos derivan de esquema versionado; validación server-side; responsive y accesible; respuestas vinculadas a plantilla/versión; errores conservan datos; emisión reproduce los valores ingresados; pruebas multiusuario, permisos y plantilla modificada.
- **Prioridad:** P1. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; la matriz CAR-07 muestra validación parcial y el plan pide generación automática del formulario web.

---

<!-- ID: F33-TASK06 | Fuentes: AUDITORIAS/AUDITORIA_FASE_33_FORMULARIOS_INSTITUCIONALES_TRAMITES_DIGITALES.md -->
### [ ] [F33-TASK06] Añadir validaciones cruzadas institucionales y detección de trámites duplicados
- **Hallazgo de origen:** plan H.6; consistencia entre solicitud y expediente institucional.
- **Severidad:** Alta / P1. **Objetivo:** detectar datos incompatibles y solicitudes activas equivalentes antes de aceptar una nueva presentación.
- **Acción ejecutable:** validar identidad, matrícula, grado, sección, estado de expediente y requisitos contra fuentes canónicas; definir clave de duplicidad por tipo/solicitante/periodo/entidad; mostrar advertencia y bloquear duplicados exactos con opción de revisión autorizada.
- **Archivos/módulos:** `backend/user-service/Code.gs`, `submitInstitutionalFormRequest`, `SolicitudesTramites`, servicios Academic/User y catálogos.
- **Dependencias/riesgos:** F25-Task03 (duplicados/referencias), AUD-NG-036 (representación familiar), AUD-NG-158 (ABAC contextual); riesgo de falsos positivos que impidan solicitudes legítimas o de duplicados por falta de clave estable.
- **Alcance:** validación previa y detección de duplicados; no fusionar solicitudes automáticamente ni confiar en identificadores del cliente.
- **Criterios de aceptación:** validación server-side con fuentes canónicas; clave estable por trámite/periodo; coincidencias exactas y posibles diferenciadas; override autorizado y auditado; pruebas de duplicado exacto, solicitudes similares, distintos periodos y apoderados.
- **Prioridad:** P1. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; el plan exige validaciones cruzadas y detección de solicitudes activas idénticas.

---

<!-- ID: F33-TASK07 | Fuentes: AUDITORIAS/AUDITORIA_FASE_33_FORMULARIOS_INSTITUCIONALES_TRAMITES_DIGITALES.md -->
### [ ] [F33-TASK07] Completar trazabilidad del legajo documental y firma de conformidad
- **Hallazgo de origen:** Fase 33-14 y plan H.7.
- **Severidad:** Alta / P1. **Objetivo:** conservar por separado solicitud original, evidencias, subsanaciones, firma y PDF definitivo dentro del expediente.
- **Acción ejecutable:** consolidar manifiesto del legajo con IDs estables y referencias a cada artefacto; registrar versiones de solicitud, adjuntos, observaciones, decisiones, firma/hash y documento final CUV; exponer consulta cronológica autorizada.
- **Archivos/módulos:** `SolicitudesTramites`, `RevisionesDecisionesTramite`, `FirmasConformidades`, `DocumentosEscolaresEmitidos`, expedientes Academic/User.
- **Dependencias/riesgos:** F31-Task07 (asociación documental), F31-Task13 (revisión colaborativa), F29-Task15 (transferencia documental); riesgo de reemplazar evidencia o confundir hash de firma con integridad de todo el expediente.
- **Alcance:** legajo completo y versionado; no alterar documentos emitidos ni duplicar el historial de workflow.
- **Criterios de aceptación:** cada artefacto tiene ID/tipo/versión/actor/fecha; solicitud original inmutable; correcciones anexadas; firma vinculada al hash de versión exacta; PDF final/CUV asociado; ACL por expediente; pruebas de reconstrucción cronológica y acceso restringido.
- **Prioridad:** P1. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; existen historial, firma y PDF final por separado, pero el plan exige legajo consolidado con trazabilidad de todos los componentes.

---

<!-- ID: F33-TASK10 | Fuentes: AUDITORIAS/AUDITORIA_FASE_33_FORMULARIOS_INSTITUCIONALES_TRAMITES_DIGITALES.md -->
### [ ] [F33-TASK10] Implementar suite automatizada del ciclo de vida de trámites
- **Hallazgo de origen:** matriz F24-01..F24-24; plan H.10.
- **Severidad:** Alta / P1. **Objetivo:** verificar los 24 escenarios de trámites y prevenir regresiones en permisos, borradores, subsanación, adjuntos y firmas.
- **Acción ejecutable:** ampliar `AUD-NG-161` con pruebas conductuales de extremo a extremo para cada escenario; usar fixtures aislados, usuarios/roles, expedientes y documentos sintéticos; validar persistencia y efectos, no solo presencia textual.
- **Archivos/módulos:** `tests/regression/academic-grading-suite.js`, servicios User/Academic/Accounting y entorno de pruebas aislado.
- **Dependencias/riesgos:** F33-Task01..Task09, AUD-NG-161, F31/F32 document workflows; riesgo de mutar datos reales o de falsos PASS por tests estructurales.
- **Alcance:** pruebas automatizadas de ciclo de vida; no enviar correos reales, no firmar documentos reales ni escribir en hojas productivas.
- **Criterios de aceptación:** 24 escenarios con fixtures; roles y representación familiar; borradores multi-dispositivo; duplicados; subsanación; adjuntos/ACL; firma/hash/CUV; SLA/bandejas; aislamiento y limpieza; evidencia reproducible por escenario.
- **Prioridad:** P2 en el plan original (aunque es requisito de calidad transversal). **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; la bitácora solo registra 53/53 pruebas generales y el plan exige suite específica de 24 escenarios.

---

<!-- ID: F34-TASK06 | Fuentes: AUDITORIAS/AUDITORIA_FASE_34_BANDEJAS_REVISION_FIRMAS.md -->
### [ ] [F34-TASK06] Enviar notificaciones multicanal reactivas por cambio de estado
- **Hallazgo de origen:** F34-08 y CAR-F34-08.
- **Severidad:** Alta / P1. **Objetivo:** informar al solicitante cuando el trámite requiere corrección, se aprueba o se rechaza.
- **Acción ejecutable:** conectar transiciones autorizadas del workflow con `sendMultiChannelNotification`; incluir estado, acción requerida, fecha límite y enlace seguro; agrupar notificaciones y deduplicar por solicitud/versión/estado/destinatario.
- **Archivos/módulos:** `backend/user-service/Code.gs`, `processWorkflowDecision`, `createUserNotification`, `sendMultiChannelNotification`, `SolicitudesTramites` y preferencias.
- **Dependencias/riesgos:** TASK-316 (multicanal/preferencias/reintentos), TASK-227 (eventos workflow), TASK-064 (cuotas); riesgo de revelar observaciones internas o enviar avisos duplicados.
- **Alcance:** notificación de transiciones al solicitante; no enviar notas internas ni tratar el envío como prueba de recepción.
- **Criterios de aceptación:** evento solo tras commit de transición; contenido público minimizado; deduplicación; canal según preferencias/consentimiento; reintentos y fallos visibles; pruebas de corrección/aprobación/rechazo, cambio repetido y cuota agotada.
- **Prioridad:** P1. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; existe notificación básica al crear trámite, pero no se despachan avisos multicanal reactivos ante cambios de estado.

---

<!-- ID: F34-TASK07 | Fuentes: AUDITORIAS/AUDITORIA_FASE_34_BANDEJAS_REVISION_FIRMAS.md -->
### [ ] [F34-TASK07] Delimitar legalmente las conformidades digitales y firmas avanzadas
- **Hallazgo de origen:** F34-06 y CAR-F34-06; análisis del Decreto 149-2013 de Honduras.
- **Severidad:** Alta / P1. **Objetivo:** evitar que un token interno de aprobación se presente como firma electrónica avanzada certificada.
- **Acción ejecutable:** mostrar leyenda legal en visor/constancias que identifique la conformidad como aprobación digital institucional; clasificar trámites que exigen firma avanzada; definir integración futura con certificados PKI/CAdES/PAdES solo mediante proveedor/acreditación apropiados.
- **Archivos/módulos:** `backend/user-service/Code.gs`, `registerDocumentSignature`, `FirmasConformidades`, visor de documentos, plantillas y portal CUV.
- **Dependencias/riesgos:** F31-Task07/13, F33-Task07, F40 seguridad documental; riesgo de afirmaciones legales incorrectas o confusión entre consentimiento y firma certificada.
- **Alcance:** clasificación, advertencia y gobernanza legal; no declarar cumplimiento de firma avanzada ni implementar PKI sin análisis jurídico/técnico.
- **Criterios de aceptación:** leyenda clara y visible; catálogo de trámites con nivel de firma requerido; conformidad ligada a usuario/documento/hash; aprobación de texto por asesoría legal; rutas que requieren firma avanzada bloqueadas o derivadas al proveedor autorizado; pruebas de presentación y auditoría.
- **Prioridad:** P1. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; la auditoría concluye que el token actual es conformidad digital interna, no firma avanzada PKI.

---

<!-- ID: F39-TASK05 | Fuentes: AUDITORIAS/AUDITORIA_FASE_39_DIGITALIZACION_TRANSICION.md -->
### [ ] [F39-TASK05] Crear bandeja de vinculación asistida de documentos históricos
- **Hallazgo de origen:** 3.5 y CAR-F39-05; P16 no aprobado.
- **Severidad:** Alta / P1 según plan G. **Objetivo:** asociar documentos sin ID o con nombres históricos a expedientes actuales mediante confirmación humana.
- **Acción ejecutable:** generar candidatos por identidad histórica, código externo, nombre normalizado y metadatos; presentar nivel de coincidencia y evidencia; permitir aceptar/rechazar/elevar a revisión, registrando actor y motivo.
- **Archivos/módulos:** servicios Academic/User, `DocumentosEstudiante`, `DocumentosEscolaresEmitidos`, `CorrespondenciaIdentificadores`, bandeja Secretaría/Archivo.
- **Dependencias/riesgos:** F29-Task01/13/15, F35-ID-Task05/08/09, F37-Task02/03; riesgo de vincular documento sensible al estudiante equivocado.
- **Alcance:** sugerencias y resolución humana; no asociar automáticamente por coincidencia de nombre.
- **Criterios de aceptación:** candidatos con score/evidencia; identidad y ámbito verificados; confirmación humana; vínculos previos preservados; auditoría de decisiones; pruebas de nombres similares, traslados, códigos SACE y expediente ambiguo.
- **Prioridad:** P1. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; hoy la asociación depende de coincidencia exacta de expedienteId/estudianteId.

---

<!-- ID: TAREA-F5-007 | Fuentes: completadas.md -->
### [ ] [TAREA-F5-007] Implementar el módulo de entrevistas y evaluaciones de admisión
- **Origen del Hallazgo:** `Auditoria.txt` (HALLAZGOS F5: HALLAZGOS-F5-P1-01) / `AUDITORIA_FASE_5_ADMISIONES_PORTAL_FAMILIAS.md` (Subcapacidad 5.5, Brecha P1-01)
- **Severidad/Clasificación:** Alto
- **Archivos Involucrados:** `backend/academic-service/Code.gs`, `js/secretary.js`, `dashboard-secretaria.html`
- **Dependencias Expuestas:** Hojas `EntrevistasAdmision`, `EvaluacionesAdmision`, `SolicitudesAdmision`
- **Descripción del Alcance:**
  1. Crear el esquema de base de datos e implementar las hojas `EntrevistasAdmision` y `EvaluacionesAdmision`.
  2. Implementar funciones backend `scheduleAdmissionInterview`, `getAdmissionInterviews`, `recordInterviewOutcome`, `saveAdmissionEvaluation` y `getAdmissionEvaluations`.
  3. Permitir agendar entrevistas individuales o grupales, asignando fecha, hora, evaluador, lugar/enlace de reunión y modalidad (Presencial/Virtual).
  4. Gestionar estados de las citas: `Programada`, `Confirmada`, `Reprogramada`, `Completada`, `Cancelada`, `No_Asistio`.
  5. Detectar solapamientos y conflictos de agenda del evaluador impidiendo citas simultáneas.
  6. Permitir reprogramar o cancelar citas registrando el motivo y notificando a los participantes.
  7. Permitir calificar evaluaciones de ingreso con escala numérica o cualitativa, adjuntando rúbricas de evaluación y dictamen pedagógico.
  8. Diferenciar explícitamente entre cita programada, entrevista realizada y evaluación evaluada con notas.
  9. Restringir el acceso a los evaluadores asignados para que consulten únicamente sus expedientes autorizados.
  10. Consolidar el resumen de notas de examen y observaciones de entrevistas dentro del modal del expediente de admisión.
  11. Definir qué evaluaciones son obligatorias según el grado o nivel académico.
  12. Impedir que una solicitud avance al estado `Admitida` si tiene evaluaciones obligatorias pendientes o reprobadas.
  13. Soporte para registrar excepciones autorizadas de evaluación con firma digital y justificación de Dirección.
  14. Permitir registrar múltiples entrevistas o evaluaciones para un aspirante sin sobrescribir registros anteriores.
- **Criterios de Aceptación:**
  - [ ] Se puede agendar una entrevista vinculada a una solicitud existente.
  - [ ] Se puede reprogramar una cita conservando la fecha original en la bitácora.
  - [ ] El sistema detecta y rechaza solapamientos de horario en la agenda del docente evaluador.
  - [ ] Una evaluación programada no aparece como completada hasta registrar la nota.
  - [ ] Las notas y observaciones se conservan e integran al expediente de admisión.
  - [ ] Evaluadores no autorizados no pueden calificar ni modificar entrevistas ajenas.
  - [ ] Múltiples evaluaciones se acumulan cronológicamente sin sobrescribirse.
  - [ ] Solicitudes con evaluaciones obligatorias pendientes no pueden cambiar a `Admitida`.
  - [ ] Excepciones de evaluación quedan documentadas con el usuario autor y motivo.
  - [ ] El historial de auditoría registra quién programó, realizó, evaluó o modificó cada cita.
- **Estado:** Pendiente

---

<!-- ID: TAREA-F5-008 | Fuentes: completadas.md -->
### [ ] [TAREA-F5-008] Implementar listas de espera con orden de prelación y asignación controlada de plazas
- **Origen del Hallazgo:** `Auditoria.txt` (HALLAZGOS F5: HALLAZGOS-F5-P1-01) / `AUDITORIA_FASE_5_ADMISIONES_PORTAL_FAMILIAS.md` (Subcapacidad 5.5 y 5.12, Brecha P1-01)
- **Severidad/Clasificación:** Alto
- **Archivos Involucrados:** `backend/academic-service/Code.gs`, `js/secretary.js`, `dashboard-secretaria.html`
- **Dependencias Expuestas:** Hoja `ListaEsperaAdmision`, `OfertaAcademica`, `SolicitudesAdmision`
- **Descripción del Alcance:**
  1. Crear la hoja `ListaEsperaAdmision` e implementar endpoints `addToWaitlist`, `getWaitlist`, `reorderWaitlist` y `offerWaitlistSlot`.
  2. Incorporar solicitudes con estado `En_Espera` a la lista de espera asociando grado, año lectivo, fecha de ingreso, posición y criterios de prelación (ej. hermanos matriculados, hijos de exalumnos, fecha de postulación).
  3. Permitir configurar y calcular el orden de prioridad automáticamente según las reglas de la institución.
  4. Exigir autorización y registro de trazabilidad si Secretaría o Dirección modifica manualmente la posición de un aspirante.
  5. Desplegar la lista de espera con filtros por año lectivo, grado y disponibilidad de plazas vacantes.
  6. Administrar estados de la oferta: `En_Espera`, `Plaza_Ofrecida`, `Oferta_Aceptada`, `Oferta_Rechazada`, `Oferta_Expirada`, `Retirada`.
  7. Permitir fijar un plazo de caducidad (ej. 48 o 72 horas) para responder a una oferta de plaza y automatizar la expiración.
  8. Enviar avisos y notificaciones automáticas al ofrecer una vacante a la familia en el tope de la lista.
  9. Liberar la plaza reservada y ofrecerla al siguiente en la lista si la familia rechaza o la oferta expira.
  10. Bloquear la reserva simultánea de una misma plaza vacante para múltiples postulantes.
  11. Garantizar que la aceptación de la oferta cambie la solicitud a `Admitida` requiriendo formalizar la matrícula.
  12. Mantener la trazabilidad de todos los movimientos de la lista de espera.
- **Criterios de Aceptación:**
  - [ ] Una solicitud sólo puede entrar a la lista de espera si está en estado elegible.
  - [ ] La posición en la lista se calcula transparentemente según los criterios de prelación definidos.
  - [ ] Reordenamientos manuales exigen justificación y quedan registrados en la bitácora.
  - [ ] Una plaza liberada se asigna únicamente a un aspirante a la vez.
  - [ ] Al rechazar o expirar una oferta, el cupo se libera automáticamente para el siguiente aspirante en la lista.
  - [ ] La aceptación de la oferta actualiza el estado de la solicitud a `Admitida`.
  - [ ] Solicitudes concurrentes no pueden reservar la misma plaza en la lista de espera.
  - [ ] Solicitudes retiradas salen de la lista y no reciben nuevas ofertas de cupo.
  - [ ] La familia sólo consulta la posición relativa de su propia solicitud de admisión.
  - [ ] Se conserva el historial completo de ofertas, vencimientos y aceptaciones.
- **Estado:** Pendiente

---

<!-- ID: TAREA-F5-011 | Fuentes: completadas.md -->
### [ ] [TAREA-F5-011] Implementar notificaciones automáticas y seguimiento del proceso de admisión
- **Origen del Hallazgo:** `Auditoria.txt` (HALLAZGOS F5: HALLAZGOS-F5-P1-03) / `AUDITORIA_FASE_5_ADMISIONES_PORTAL_FAMILIAS.md` (Subcapacidad 5.10, Brecha P1-03)
- **Severidad/Clasificación:** Alto
- **Archivos Involucrados:** `backend/academic-service/Code.gs`, `backend/user-service/Code.gs` (l. 948, 1298)
- **Dependencias Expuestas:** Endpoint `sendMultiChannelNotification`, Hoja `Notificaciones`, `ColaEventosSeguridad`
- **Descripción del Alcance:**
  1. Conectar las funciones del ciclo de vida de admisión (`createAdmissionRequest`, `updateAdmissionStatus`, `convertAdmissionToStudent`) con el motor `sendMultiChannelNotification`.
  2. Disparar notificaciones automáticas ante los siguientes eventos:
     - Recepción formal de solicitud (incluyendo `solicitudId` de seguimiento).
     - Solicitud de documentos pendientes o sustitución por rechazo.
     - Citación, reprogramación o cancelación de entrevistas/evaluaciones.
     - Cambio de estado en el trámite de admisión.
     - Resolución final (`Admitida` con instrucciones de pago / `Rechazada` / `En_Espera`).
     - Oferta o liberación de plaza en lista de espera.
     - Emisión de invitación de vinculación para el tutor.
     - Confirmación de conversión a matrícula estudiantil.
  3. Crear plantillas HTML y de texto plano personalizables para cada tipo de notificación.
  4. Incluir enlaces directos al portal, números de seguimiento e instrucciones claras sin exponer datos privados de menores.
  5. Enviar las notificaciones a los canales autorizados (Correo electrónico `MailApp`, avisos internos del portal).
  6. Desacoplar la notificación de la transacción principal para que un fallo en el envío de correo no revierta la aprobación de una admisión.
  7. Guardar el estado de cada notificación: `Pendiente`, `Enviado`, `Entregado`, `Fallido`, `Reintentado`.
  8. Integrar con la cola de reintentos asíncronos para reenviar notificaciones fallidas por problemas de red.
  9. Aplicar deduplicación para evitar el envío repetido de correos ante reintentos de peticiones.
  10. Respetar las preferencias de notificación de la familia salvo para avisos institucionales obligatorios.
  11. Garantizar la privacidad enviando correos individuales o ocultando destinatarios en avisos masivos.
  12. Consola de monitoreo para que Secretaría verifique el historial de avisos enviados y reenviar manualmente si es necesario.
- **Criterios de Aceptación:**
  - [ ] El registro de una solicitud envía un correo de confirmación con su código de seguimiento.
  - [ ] Cambios de estado en la admisión disparan el correo automático correspondiente a la familia.
  - [ ] Solicitudes rechazadas no envían por error plantillas de aceptación.
  - [ ] Fallos en el servidor de correo activan el reintento en la cola asíncrona sin cancelar la transacción de base de datos.
  - [ ] Reintentos de peticiones no duplican los correos enviados a la familia.
  - [ ] Se registra el estado de entrega de cada mensaje en `BitacoraTraceability`.
  - [ ] Los mensajes son individuales y no revelan direcciones de correo de otros postulantes.
  - [ ] Secretaría puede revisar el log de notificaciones enviadas a cada aspirante.
- **Estado:** Pendiente

---

<!-- ID: TAREA-F6-002 | Fuentes: completadas.md -->
### [ ] [TAREA-F6-002] Robustecer las operaciones del ciclo de vida y prevenir estados de matrícula incompatibles
- **Origen del Hallazgo:** `AUDITORIA_FASE_6_EXPEDIENTE_CICLO_VIDA.md` / Tarea 6 (P1 · Integridad Institucional)
- **Prioridad:** P1
- **Severidad/Clasificación:** Alta (Integridad institucional y transiciones del ciclo de vida)
- **Archivos Involucrados:**
  - `backend/academic-service/Code.gs`
  - `dashboard-secretaria.html`
  - `js/secretary.js`
  - `teacher-dashboard.html`
  - `js/teacher.js`
- **Dependencias Expuestas:** `changeStudentSection`, `recordStudentTransfer`, `recordStudentWithdrawal`, `processStudentReentry`, `renewStudentEnrollment`, `Matriculas`, `ExpedientesEstudiantes`, `LockService`
- **Descripción del Alcance:**
  Consolidar las reglas de transición de estado institucional del estudiante para evitar inconsistencias entre los registros cuando ocurren operaciones concurrentes o interrumpidas durante todo su ciclo de vida (matrícula, cambios de sección/grado, traslados, retiros, reincorporaciones, promociones y graduaciones).

  Requisitos Funcionales:
  1. Definir las transiciones permitidas entre los estados institucionales del estudiante, diferenciando su condición general de la situación de cada matrícula.
  2. Validar que un estudiante no tenga dos matrículas activas incompatibles para el mismo periodo, conforme a las reglas institucionales.
  3. Antes de procesar un movimiento, comprobar que: el expediente existe y no está fusionado, el periodo escolar de destino es válido, la matrícula de origen corresponde al estudiante, el movimiento es compatible con el estado actual y se cumplen las condiciones académicas y administrativas aplicables.
  4. En cambios de grado, sección, jornada o programa, conservar la matrícula anterior y registrar la nueva situación con su fecha efectiva y motivo.
  5. En traslados, registrar institución de destino, fecha de salida, motivo y estado del trámite (diferenciando solicitado de completado).
  6. En retiros, distinguir entre retiro temporal y definitivo sin eliminar antecedentes.
  7. En reincorporaciones, reutilizar la identidad institucional existente y crear el registro de matrícula para el nuevo periodo.
  8. En promociones y repitencias, utilizar resultados académicos del periodo cerrado y registrar la decisión administrativa cuando corresponda.
  9. En graduaciones, verificar los requisitos configurados, registrar la fecha y el programa finalizado y evitar matrículas activas incompatibles posteriores.
  10. Hacer que cada operación crítica sea idempotente y resistente a solicitudes concurrentes mediante script locks (`LockService`).
  11. Disponer de un mecanismo de recuperación o conciliación ante fallos parciales entre hojas o microservicios.
  12. Registrar las operaciones retroactivas con su fecha efectiva y la fecha real de registro, sin alterar silenciosamente el historial.
- **Criterios de Aceptación:**
  - CA-008: Una segunda solicitud idéntica de reincorporación no crea otra matrícula.
  - CA-009: Dos solicitudes concurrentes que intentan ocupar la misma plaza no exceden la capacidad configurada.
  - CA-010: Una transición no permitida es rechazada sin modificar parcialmente el expediente.
  - CA-011: Un traslado incompleto queda identificado como pendiente de resolución, sin presentar al estudiante como correctamente transferido.
  - CA-012: La promoción o repitencia no modifica las calificaciones históricas.
  - CA-013: Una graduación correctamente registrada conserva el acceso autorizado al expediente histórico.
  - CA-014: Las operaciones retroactivas pueden distinguirse de las realizadas en tiempo real.
  - CA-015: Los registros relacionados mantienen una situación coherente después de un fallo simulado y su recuperación.
- **Estado:** Pendiente

---

<!-- ID: TAREA-F7-IMP-06 | Fuentes: completadas.md -->
### [ ] [TAREA-F7-IMP-06] Ampliar la gestión de disponibilidad, equipamiento y capacidad de espacios
- **Origen del Hallazgo:** `AUDITORIA_FASE_7_PLANIFICACION_HORARIOS_RECURSOS.md` / Tarea F7-IMP-06 (P1 · Gestión de Espacios)
- **Prioridad:** P1
- **Severidad/Clasificación:** Alta (Ampliación de recursos compartidos)
- **Archivos Involucrados:**
  - `backend/academic-service/Code.gs`
  - `teacher-dashboard.html`
  - `js/teacher.js`
- **Dependencias Expuestas:** `SedesAulas`, `getClassroomResources`, `saveClassroomResource`, `RecursosReutilizables`, `checkScheduleConflict`
- **Descripción del Alcance:**
  Ampliación de la gestión de aulas y espacios físicos para incluir requerimientos de equipamiento específico, períodos temporales de mantenimiento e indisponibilidad, y comparación entre la capacidad real del espacio y la matrícula efectiva de la sección.

  Requisitos Funcionales:
  1. Permitir registrar las características de cada espacio relevantes para la planificación.
  2. Representar la capacidad máxima y los requisitos de equipamiento cuando sean aplicables.
  3. Identificar los recursos compartidos que pueden utilizarse simultáneamente y aquellos que requieren exclusividad.
  4. Registrar intervalos de indisponibilidad por mantenimiento, reparación u otras causas.
  5. Evitar nuevas asignaciones dentro de intervalos de indisponibilidad.
  6. Detectar las clases futuras afectadas cuando un aula o recurso deje de estar disponible.
  7. Permitir consultar la ocupación por día, semana, período académico y recurso.
  8. Permitir identificar espacios alternativos que satisfagan las restricciones de una actividad.
  9. Distinguir entre espacios activos, temporalmente indisponibles e inactivos.
  10. Evitar que la desactivación de un recurso elimine su historial de utilización.
  11. Integrar la disponibilidad de los recursos con la validación de horarios.
  12. Evitar que la capacidad de un aula se confunda con la matrícula efectiva de una sección.
- **Criterios de Aceptación:**
  - CA-F7-39: Un aula indisponible no puede asignarse a una nueva actividad dentro del intervalo restringido.
  - CA-F7-40: Una actividad que requiere equipamiento específico no se asigna a un espacio incompatible.
  - CA-F7-41: Una restricción nueva identifica las asignaciones futuras afectadas.
  - CA-F7-42: El sistema permite consultar las reservas existentes y sus intervalos.
  - CA-F7-43: La desactivación de un aula no elimina las referencias históricas.
  - CA-F7-44: Las reglas de capacidad solo se aplican cuando existe información suficiente y una política definida.
- **Estado:** Pendiente

---

<!-- ID: TASK-196 | Fuentes: Pendientes.md ; pendientes/Secretaria/Pendientes.md -->
### [ ] [TASK-196] Reestructuración de rutas, paradas, horarios y asignaciones asimétricas
- **Origen del Hallazgo:** `AUDITORIA_FASE_21_TRANSPORTE_SERVICIOS_COMPLEMENTARIOS.md` / Sección E (PT-21-07, PT-21-08) y Plan de Implementación TAREA 08
- **Prioridad:** P1
- **Severidad/Clasificación:** Alta (Rutas independientes de ida/regreso, días lectivos específicos y gestión de paradas)
- **Archivos Involucrados:**
  - `backend/accounting-service/Code.gs` (`manageTransportRoute`, `getTransportRoutes`, `assignStudentTransport`)
  - `TransporteRutas`
  - Hoja `TransporteParadas`
  - `TransporteAsignaciones`
- **Dependencias Expuestas:** `TransporteRutas`, `F21-Task01`, `F21-Task05`
- **Descripción del Alcance:**
  Las paradas están embebidas en cadenas JSON dentro de `TransporteRutas` y no se diferencian las rutas de mañana (ida) de las de tarde (retorno), ni se contemplan días específicos de servicio.
  Requerimientos Funcionales Detallados:
  1. Desacoplamiento de paradas:
     - Crear la hoja `TransporteParadas`: `ParadaID`, `RutaID`, `NombreParada`, `DireccionReferencia`, `Latitud`, `Longitud`, `OrdenSecuencia`, `HorarioPlanificado`, `EstadoParada`.
  2. Rutas asimétricas y días lectivos:
     - Configurar tipo de recorrido: `IdaManana`, `RetornoTarde`, `Completa`.
     - Permitir que un estudiante tenga una ruta de ida y otra distinta de regreso, o paradas diferentes según el sentido.
     - Configurar días de operación de la asignación: `["Lunes", "Martes", "Miercoles", "Jueves", "Viernes"]`.
     - Permitir cambios temporales de parada sin modificar la asignación permanente del alumno.
- **Criterios de Aceptación:**
  - Las paradas se administran individualmente sin manipular JSON plano.
  - Un estudiante puede tener asignaciones independientes de ida y regreso.
  - Los estudiantes que viajan solo ciertos días no figuran en las listas de pasajeros de los días excluidos.
  - Las asignaciones respetan vigencias y horarios sin colisiones.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 8089-8113; clave TASK-197; asignación única: Secretaria -->

---

<!-- ID: TASK-199 | Fuentes: Pendientes.md ; pendientes/Secretaria/Pendientes.md -->
### [ ] [TASK-199] Sistema de notificaciones y comunicación de eventos de transporte
- **Origen del Hallazgo:** `AUDITORIA_FASE_21_TRANSPORTE_SERVICIOS_COMPLEMENTARIOS.md` / Sección E (PT-21-30), Sección C (1.11) y Plan de Implementación TAREA 11
- **Prioridad:** P1
- **Severidad/Clasificación:** Alta (Avisos oportunos de abordaje/descenso, demoras y cambios operativos)
- **Archivos Involucrados:**
  - `backend/accounting-service/Code.gs`
  - `backend/user-service/Code.gs` (`sendMultiChannelNotification`, `retryFailedNotificationsQueue`)
  - `TransporteViajes`
  - `TransporteAsistenciaViajes`
- **Dependencias Expuestas:** `sendMultiChannelNotification`, `F21-Task03`, `F21-Task11`
- **Descripción del Alcance:**
  El servicio de notificaciones no está integrado con los eventos operativos del transporte escolar.
  Requerimientos Funcionales Detallados:
  1. Catálogo de alertas de transporte:
     - Notificar abordaje confirmado y descenso confirmado del menor a sus tutores autorizados.
     - Notificar proximidad del vehículo (ej. a 5 minutos de la parada).
     - Notificar retrasos viales, cambios de ruta o sustituciones de autobús/conductor.
  2. Canales y prevención de duplicados:
     - Envío por notificación interna, correo electrónico o WhatsApp institucional.
     - Prevención de duplicados mediante claves idempotentes y gestión de reintentos controlados.
     - Los fallos en el canal de comunicación no deben alterar el estado operativo del viaje.
- **Criterios de Aceptación:**
  - Cada evento operativo dispara las notificaciones configuradas a los tutores correspondientes.
  - No se envían avisos a destinatarios ajenos a la familia del menor.
  - Se registran fallos y reintentos sin generar mensajes duplicados.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 8199-8226; clave TASK-201; asignación única: Secretaria -->

---

<!-- ID: TASK-201 | Fuentes: Pendientes.md ; pendientes/Secretaria/Pendientes.md -->
### [ ] [TASK-201] Gestión integral de incidencias, averías y emergencias durante recorridos
- **Origen del Hallazgo:** `AUDITORIA_FASE_21_TRANSPORTE_SERVICIOS_COMPLEMENTARIOS.md` / Sección E (PT-21-33), Sección C (1.12) y Plan de Implementación TAREA 13
- **Prioridad:** P1
- **Severidad/Clasificación:** Alta (Seguridad escolar, respuesta ante emergencias, averías mecánicas y escalamiento directivo)
- **Archivos Involucrados:**
  - `backend/accounting-service/Code.gs` (nuevas funciones `reportTransportIncident`, `getTransportIncidents`, `resolveTransportIncident`)
  - Hoja `TransporteIncidencias`
  - `MantenimientoOrdenes`
- **Dependencias Expuestas:** `TransporteRutas`, `TransporteVehiculos`, `sendMultiChannelNotification`, `F21-Task07`
- **Descripción del Alcance:**
  No existe un sistema específico para registrar y atender incidencias viales, averías mecánicas o emergencias médicas durante el transporte.
  Requerimientos Funcionales Detallados:
  1. Expediente de incidencias de transporte:
     - Registrar: averías mecánicas, accidentes, retrasos graves, ausencias no notificadas, emergencias médicas y problemas de conducta.
     - Identificar: recorrido, vehículo, conductor, estudiantes afectados, nivel de gravedad (`Baja`, `Media`, `Alta`, `Critica`) y evidencias.
  2. Escalamiento y resolución:
     - Incidencias críticas alertan de inmediato a Dirección y tutores de los alumnos a bordo.
     - Las fallas mecánicas generan automáticamente órdenes de trabajo en `MantenimientoOrdenes` y marcan la unidad fuera de servicio.
     - Prohibido cerrar incidencias graves sin documentar las medidas adoptadas y el resultado.
- **Criterios de Aceptación:**
  - Los conductores pueden reportar averías o accidentes desde su móvil durante el viaje.
  - Las averías inmovilizantes bloquean el autobús y generan la orden de taller.
  - Dirección y familias reciben avisos inmediatos ante emergencias.
  - Se preserva el historial de resolución de todas las incidencias.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 8227-8251; clave TASK-202; asignación única: Secretaria -->

---

<!-- ID: TASK-202 | Fuentes: Pendientes.md ; pendientes/Secretaria/Pendientes.md -->
### [ ] [TASK-202] Inscripción, contratación, cancelación y lista de espera de servicios complementarios
- **Origen del Hallazgo:** `AUDITORIA_FASE_21_TRANSPORTE_SERVICIOS_COMPLEMENTARIOS.md` / Sección E, Sección C (1.15) y Plan de Implementación TAREA 14
- **Prioridad:** P1
- **Severidad/Clasificación:** Alta (Ciclo formal de contratación de servicios extracurriculares, cupos y listas de espera)
- **Archivos Involucrados:**
  - `backend/accounting-service/Code.gs` (nuevas funciones `enrollComplementaryService`, `cancelComplementaryService`)
  - Hoja `ServiciosInscripciones`
  - `ActividadesExtracurriculares`
- **Dependencias Expuestas:** `ActividadesExtracurriculares`, `CargosEstudiante`, `F21-Task13`
- **Descripción del Alcance:**
  Falta un flujo integrado para formalizar inscripciones, controlar cupos máximos, gestionar listas de espera y procesar cancelaciones de servicios complementarios.
  Requerimientos Funcionales Detallados:
  1. Inscripción y cupos de servicios:
     - Registrar estudiante, servicio, fecha de inicio, condiciones y vigencia.
     - Control de cupo máximo; si se llena, enrutar automáticamente a lista de espera.
     - Gestión de cancelaciones con fecha efectiva y detención de cobros futuros.
     - Consultar solicitudes e inscripciones desde el portal familiar.
- **Criterios de Aceptación:**
  - Se puede inscribir y cancelar un servicio complementario de forma trazable.
  - Se respetan los cupos máximos sin sobrecupos.
  - Las cancelaciones conservan el historial y ajustan la facturación.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 8276-8299; clave TASK-204; asignación única: Secretaria -->

---

<!-- ID: TASK-204 | Fuentes: Pendientes.md ; pendientes/Secretaria/Pendientes.md -->
### [ ] [TASK-204] Solicitudes familiares de cambios temporales o permanentes de transporte
- **Origen del Hallazgo:** `AUDITORIA_FASE_21_TRANSPORTE_SERVICIOS_COMPLEMENTARIOS.md` / Sección E (PT-21-13), Sección C (1.10) y Plan de Implementación TAREA 16
- **Prioridad:** P1
- **Severidad/Clasificación:** Alta (Canal digital formal de solicitudes, eliminación de mensajes informales y control de paradas alternas)
- **Archivos Involucrados:**
  - `backend/accounting-service/Code.gs` (nuevas funciones `requestTransportChange`, `reviewTransportChange`)
  - Hoja `TransporteSolicitudesCambio`
  - `TransporteAsignaciones`
- **Dependencias Expuestas:** `TransporteAsignaciones`, `F21-Task10`, `sendMultiChannelNotification`
- **Descripción del Alcance:**
  Las familias no tienen un medio formal para avisar ausencias de un día o solicitar bajada en una parada alterna, dependiendo de llamadas o mensajes informales al chofer.
  Requerimientos Funcionales Detallados:
  1. Flujo de solicitudes familiares:
     - Solicitar: "No viajará hoy" (evita detenciones innecesarias) o "Bajará en parada alterna autorizada".
     - Establecer vigencia y horario límite de envío matutino y vespertino.
     - Al ser aprobada, actualizar la hoja de ruta del chofer para ese día sin alterar la asignación permanente del alumno.
- **Criterios de Aceptación:**
  - Los padres envían solicitudes de cambio desde su portal web.
  - La hoja de ruta del conductor refleja el cambio temporal automáticamente.
  - La asignación permanente se restituye al expirar la vigencia temporal.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 8323-8347; clave TASK-206; asignación única: Secretaria -->

---

<!-- ID: TASK-206 | Fuentes: Pendientes.md ; pendientes/Secretaria/Pendientes.md -->
### [ ] [TASK-206] Gestión de necesidades especiales de movilidad y accesibilidad en transporte
- **Origen del Hallazgo:** `AUDITORIA_FASE_21_TRANSPORTE_SERVICIOS_COMPLEMENTARIOS.md` / Sección C (1.4, 1.20) y Plan de Implementación TAREA 18
- **Prioridad:** P1
- **Severidad/Clasificación:** Alta (Inclusión escolar, adaptabilidad vehicular y confidencialidad de datos médicos)
- **Archivos Involucrados:**
  - `backend/accounting-service/Code.gs`
  - `TransporteAsignaciones`
  - `TransporteVehiculos`
  - `ExpedientesMedicos`
- **Dependencias Expuestas:** `TransporteVehiculos`, `TransporteAsignaciones`, `F21-Task02`
- **Descripción del Alcance:**
  No se contemplan requerimientos operativos de movilidad o accesibilidad física para estudiantes que requieren rampa, asistencia en abordaje o asientos especiales.
  Requerimientos Funcionales Detallados:
  1. Requerimientos de accesibilidad operativa:
     - Registrar requerimientos de movilidad física autorizados en el expediente del alumno.
     - Validar que la unidad asignada a la ruta cuente con las características de accesibilidad requeridas (ej. rampa hidráulica, espacio para silla de ruedas).
     - Mostrar instrucciones operativas estrictamente al conductor y acompañante de la ruta, manteniendo absoluta confidencialidad frente a otros usuarios.
- **Criterios de Aceptación:**
  - Se pueden registrar requerimientos de accesibilidad física autorizados.
  - La asignación valida la compatibilidad del vehículo.
  - La información operativa es confidencial y solo accesible al personal de ruta.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 8372-8395; clave TASK-208; asignación única: Secretaria -->

---

<!-- ID: TASK-208 | Fuentes: Pendientes.md ; pendientes/Secretaria/Pendientes.md -->
### [ ] [TASK-208] Checklist preoperacional y control de seguridad vehicular diaria
- **Origen del Hallazgo:** `AUDITORIA_FASE_21_TRANSPORTE_SERVICIOS_COMPLEMENTARIOS.md` / Sección E (PT-21-39), Sección C (3.4) y Plan de Implementación TAREA 20
- **Prioridad:** P1
- **Severidad/Clasificación:** Alta (Prevención de accidentes, inspección preoperacional diaria y responsabilidad de choferes)
- **Archivos Involucrados:**
  - `backend/accounting-service/Code.gs` (nuevas funciones `recordPreTripInspection`, `getPreTripInspections`)
  - Hoja `TransporteInspecciones`
  - `TransporteVehiculos`
- **Dependencias Expuestas:** `TransporteVehiculos`, `F21-Task05`, `F21-Task07`
- **Descripción del Alcance:**
  No existe una inspección digital diaria obligatoria del estado del vehículo antes de salir a transportar estudiantes.
  Requerimientos Funcionales Detallados:
  1. Inspección preoperacional móvil:
     - El conductor completa una lista de comprobación antes de arrancar la unidad: frenos, neumáticos, luces, cinturones, extintor y botiquín.
     - Registro de kilometraje matutino inicial.
     - Si se reporta un defecto crítico de seguridad, el sistema bloquea el inicio ordinario de la ruta y genera una orden de mantenimiento correctivo inmediata.
- **Criterios de Aceptación:**
  - El conductor registra el checklist desde su teléfono antes del primer viaje.
  - Los defectos críticos impiden el inicio del recorrido hasta su resolución.
  - Se conserva el historial de inspecciones por unidad vehicular.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 8396-8420; clave TASK-209; asignación única: Secretaria -->

---

<!-- ID: TASK-209 | Fuentes: Pendientes.md ; pendientes/Secretaria/Pendientes.md -->
### [ ] [TASK-209] Optimización de rutas, orden de paradas y planificación de recorridos
- **Origen del Hallazgo:** `AUDITORIA_FASE_21_TRANSPORTE_SERVICIOS_COMPLEMENTARIOS.md` / Sección C (1.4) y Plan de Implementación TAREA 21
- **Prioridad:** P1
- **Severidad/Clasificación:** Alta (Reducción de tiempos de viaje, ahorro de combustible y ordenamiento lógico de paradas)
- **Archivos Involucrados:**
  - `backend/accounting-service/Code.gs` (nueva función `optimizeRouteStopsSequence`)
  - `TransporteParadas`
  - `TransporteRutas`
- **Dependencias Expuestas:** `TransporteParadas`, Geocodificación / Maps API, `F21-Task09`
- **Descripción del Alcance:**
  Las paradas se ingresan en orden manual sin herramientas de optimización ni cálculo de distancias reales entre puntos.
  Requerimientos Funcionales Detallados:
  1. Optimización y ordenamiento de paradas:
     - Con las coordenadas geográficas de las paradas, calcular distancias y tiempos aproximados de recorrido.
     - Ofrecer sugerencias de ordenamiento de paradas para minimizar tiempo y trayecto total, respetando ventanas de horario escolar.
     - Permitir a la administración comparar la ruta actual con la propuesta optimizada y aprobar o rechazar los cambios.
     - Prohibido modificar automáticamente rutas activas sin la confirmación de un operador facultado.
- **Criterios de Aceptación:**
  - Las paradas poseen coordenadas geográficas válidas.
  - Se generan propuestas de ordenamiento lógico de paradas.
  - La propuesta requiere aprobación directiva antes de aplicarse oficialmente.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 8477-8514; clave TASK-212; asignación única: Secretaria -->

---

<!-- ID: TASK-212 | Fuentes: Pendientes.md ; pendientes/Secretaria/Pendientes.md -->
### [ ] [TASK-212] Explorador documental institucional unificado
- **Origen del Hallazgo:** `AUDITORIA_FASE_22_GESTION_DOCUMENTAL_FORMULARIOS_FIRMA_ELECTRONICA.md` / Sección E (F22-01), Sección G (Defecto 4) y Plan de Trabajo TAREA 22-05
- **Prioridad:** P1
- **Severidad/Clasificación:** Alta (Visibilidad institucional, búsqueda 360° de expedientes y eliminación de dispersión documental)
- **Archivos Involucrados:**
  - `dashboard-director.html`
  - `dashboard-secretaria.html`
  - `js/secretaria.js`
  - `backend/accounting-service/Code.gs` (nueva función `searchUnifiedDocumentRepository`)
- **Dependencias Expuestas:** Persistencia documental existente, Google Drive, expedientes estudiantiles y laborales, permisos RBAC/ABAC y registros de trámites.
- **Descripción del Alcance:**
  Los documentos se encuentran distribuidos entre diferentes hojas, carpetas y módulos sin una interfaz centralizada que permita consultar y administrar el archivo documental institucional de forma integral.
  Requerimientos Funcionales Detallados:
  1. Organización y clasificación multidimensional:
     - Desarrollar un explorador centralizado para navegar por: Expedientes de estudiantes, Expedientes familiares, Expedientes de empleados, Departamentos institucionales, Tipos de documentos, Solicitudes y trámites, Documentos emitidos, Documentos pendientes de aprobación, Documentos firmados, Documentos vencidos, Documentos archivados, y Documentos financieros/administrativos.
     - La clasificación debe utilizar metadatos y relaciones documentales, no depender exclusivamente de la ubicación física del archivo en Drive.
  2. Búsqueda y filtros combinables:
     - Filtros por: Nombre del estudiante o empleado, Identificador institucional, Grado y sección, Departamento, Categoría documental, Tipo de trámite, Fechas (creación, emisión, vencimiento), Estado, Responsable, Firmante, Código CUV y Número correlativo.
     - Ordenamiento por fecha, nombre, categoría y estado.
  3. Visualización y acciones autorizadas:
     - Previsualizar el documento (PDF e imágenes), descargarlo, consultar metadatos, ver historial, consultar firmas y evidencias, ver expediente al que pertenece, acceder a versiones anteriores y archivar.
     - Reunir información de registros existentes sin crear copias innecesarias de archivos en Drive.
     - Paginación o carga progresiva, filtros persistentes durante navegación y diseño adaptable a móvil, tablet y escritorio.
- **Criterios de Aceptación:**
  - [ ] Un documento escolar emitido aparece en el explorador.
  - [ ] Un documento laboral aparece en el explorador.
  - [ ] Un archivo adjunto a una solicitud aparece relacionado con ella.
  - [ ] Un mismo documento puede localizarse desde su expediente y desde su categoría sin duplicarse.
  - [ ] Los filtros pueden combinarse.
  - [ ] La búsqueda por CUV y número correlativo funciona.
  - [ ] La previsualización y descarga respetan los permisos.
  - [ ] Un usuario no puede consultar documentos de expedientes ajenos a su ámbito de autorización.
  - [ ] El explorador identifica correctamente documentos pendientes, firmados, vencidos y archivados.
  - [ ] La consulta no depende de que los archivos permanezcan en una carpeta física con un nombre determinado.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 8515-8554; clave TASK-213; asignación única: Secretaria -->

---

<!-- ID: TASK-213 | Fuentes: Pendientes.md ; pendientes/Secretaria/Pendientes.md -->
### [ ] [TASK-213] Gestión de múltiples firmantes y enrutamiento secuencial o paralelo
- **Origen del Hallazgo:** `AUDITORIA_FASE_22_GESTION_DOCUMENTAL_FORMULARIOS_FIRMA_ELECTRONICA.md` / Sección E (F22-17), Sección D y Plan de Trabajo TAREA 22-06
- **Prioridad:** P1
- **Severidad/Clasificación:** Alta (Contratos con firma de ambos padres, convenios laborales firmados por director y docente, y aprobaciones encadenadas)
- **Archivos Involucrados:**
  - `backend/user-service/Code.gs` (`submitAuthorizationRequest`, `respondToAuthorizationRequest`, `registerDocumentSignature`)
  - `SolicitudesAutorizacion`
  - `FirmasConformidades`
- **Dependencias Expuestas:** `F22-Task02`, `F22-Task03`, `F22-Task04`, solicitudes de autorización, notificaciones y expedientes familiares.
- **Descripción del Alcance:**
  El sistema permite registrar conformidades y gestionar autorizaciones de tutores, pero no dispone de un flujo general para que varios participantes firmen el mismo documento siguiendo un orden o participando simultáneamente.
  Requerimientos Funcionales Detallados:
  1. Configuración de múltiples firmantes por documento:
     - Definir para cada firmante: identidad, rol, relación con el estudiante o proceso, tipo de participación, orden de firma, mecanismo de autenticación y fecha límite.
  2. Modalidades secuencial y paralela:
     - Secuencial: el siguiente firmante recibe la solicitud cuando el anterior completa su firma.
     - Paralela: todos los firmantes autorizados pueden firmar sin esperar a los demás.
     - Permitir combinar ambas modalidades mediante etapas.
     - Soportar procesos como: firma de ambos padres o tutores, firma de tutor y dirección, firma de docente y coordinador, firma de empleado y representante institucional.
  3. Reglas de completitud y enrutamiento:
     - Diferenciar entre: todos los firmantes obligatorios, cualquiera de los firmantes autorizados, o firmantes opcionales.
     - Impedir que un participante firme en nombre de otro sin una autorización válida.
     - Registrar cada actuación individualmente.
     - Permitir rechazar, declinar o cancelar una solicitud.
     - Generar el documento final y certificado de finalización cuando se cumplan las condiciones configuradas.
- **Criterios de Aceptación:**
  - [ ] Se puede configurar un proceso con dos o más firmantes.
  - [ ] El flujo secuencial respeta el orden establecido.
  - [ ] El flujo paralelo permite firmar independientemente.
  - [ ] El sistema identifica qué participantes han firmado y cuáles están pendientes.
  - [ ] Una firma no autorizada es rechazada.
  - [ ] Una firma duplicada no altera el estado del proceso.
  - [ ] La negativa de un firmante produce el resultado configurado.
  - [ ] El documento final contiene todas las firmas requeridas.
  - [ ] El certificado identifica el orden y la fecha de cada firma.
  - [ ] Una transacción incompleta no se presenta como finalizada.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 8555-8592; clave TASK-214; asignación única: Secretaria -->

---

<!-- ID: TASK-214 | Fuentes: Pendientes.md ; pendientes/Secretaria/Pendientes.md -->
### [ ] [TASK-214] Formularios descargables, imprimibles y recepción posterior de documentos escaneados
- **Origen del Hallazgo:** `AUDITORIA_FASE_22_GESTION_DOCUMENTAL_FORMULARIOS_FIRMA_ELECTRONICA.md` / Sección E (F22-07), Sección C (2.6) y Plan de Trabajo TAREA 22-07
- **Prioridad:** P1
- **Severidad/Clasificación:** Alta (Inclusión digital, atención a familias sin acceso continuo a internet y digitalización física en ventanilla)
- **Archivos Involucrados:**
  - `backend/user-service/Code.gs`
  - `backend/accounting-service/Code.gs`
  - `FormulariosInstitucionales`
  - `SolicitudesTramites`
- **Dependencias Expuestas:** Diseñador de formularios, generación PDF, repositorio documental, solicitudes y validación de archivos (`F22-Task01`).
- **Descripción del Alcance:**
  El diseñador de formularios digitales está implementado, pero no se dispone de un flujo completo para descargar formularios en blanco, completarlos manualmente y reincorporarlos al expediente institucional.
  Requerimientos Funcionales Detallados:
  1. Versiones imprimibles de formularios:
     - Permitir generar una versión imprimible de cada formulario institucional.
     - Descargar el formulario en PDF sin respuestas ni datos personales cuando se solicite en blanco.
     - Permitir generar versión personalizada con datos institucionales o del estudiante cuando corresponda.
     - Incorporar identificador único de formulario o trámite, instrucciones de llenado y espacios adecuados para datos, fechas, firmas manuscritas y sellos.
  2. Recepción y carga de documentos completados manualmente:
     - Permitir cargar posteriormente el formulario escaneado o fotografiado desde el portal de secretaría o familiar.
     - Relacionar el archivo recibido con el formulario original, la solicitud, el estudiante y el responsable de recepción.
     - Permitir revisar la legibilidad antes de aceptarlo y mantener el archivo original escaneado.
     - Diferenciar documentos completados manualmente de los completados digitalmente.
     - Permitir que secretaría solicite una corrección o nueva carga cuando el escaneo sea ilegible o incompleto.
- **Criterios de Aceptación:**
  - [ ] Un formulario puede descargarse en blanco en formato PDF limpio y legible.
  - [ ] El PDF conserva su estructura y campos legibles al imprimirse.
  - [ ] Cada descarga puede identificarse mediante un código único.
  - [ ] El formulario escaneado puede cargarse posteriormente.
  - [ ] El archivo queda relacionado con la solicitud original.
  - [ ] Un escaneo ilegible puede devolverse para corrección.
  - [ ] El sistema conserva el archivo original recibido.
  - [ ] Se registra quién lo recibió, cuándo y cuál fue el resultado de la revisión.
  - [ ] El proceso funciona desde dispositivos móviles y computadoras.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 8593-8632; clave TASK-215; asignación única: Secretaria -->

---

<!-- ID: TASK-215 | Fuentes: Pendientes.md ; pendientes/Secretaria/Pendientes.md -->
### [ ] [TASK-215] Generación masiva de documentos oficiales por grado, sección o grupo
- **Origen del Hallazgo:** `AUDITORIA_FASE_22_GESTION_DOCUMENTAL_FORMULARIOS_FIRMA_ELECTRONICA.md` / Sección E (F22-37), Sección C (2.4) y Plan de Trabajo TAREA 22-08
- **Prioridad:** P1
- **Severidad/Clasificación:** Alta (Productividad en secretaría de fin de año, emisión masiva de diplomas y constancias escolares)
- **Archivos Involucrados:**
  - `backend/accounting-service/Code.gs` (nueva función `batchGenerateSchoolDocuments`)
  - `PlantillasEscolares`
  - `DocumentosEscolaresEmitidos`
  - `js/teacher.js`
- **Dependencias Expuestas:** Motor de plantillas, CUV, correlativos, expedientes estudiantiles y almacenamiento documental (`F22-Task02`, `LockService`).
- **Descripción del Alcance:**
  La generación documental funciona individualmente, pero no permite emitir eficientemente documentos oficiales para grupos completos de estudiantes en secretaría de fin de ciclo.
  Requerimientos Funcionales Detallados:
  1. Emisión por lotes (Batch Processing):
     - Permitir seleccionar un conjunto de estudiantes mediante criterios: Año lectivo, Nivel educativo, Grado, Sección, Jornada, Grupo, o Estado de matrícula.
     - Seleccionar el tipo de documento y la plantilla que se utilizará.
     - Generar un documento independiente para cada estudiante completando las variables con sus datos particulares.
     - Asignar un correlativo independiente y un CUV único a cada documento del lote.
     - Evitar duplicados cuando se repita una operación por error mediante claves de idempotencia.
     - Permitir excluir estudiantes que no cumplan los requisitos de emisión (ej. retención de notas por morosidad o expediente incompleto).
  2. Experiencia de procesamiento y descarga:
     - Mostrar vista previa y resumen antes de confirmar la operación.
     - Procesar lotes grandes sin bloquear la interfaz mostrando progreso individual y general.
     - Permitir descargar los documentos individualmente o agrupados en un archivo comprimido ZIP.
     - Registrar el resultado de cada documento, separando documentos exitosos de los que presenten errores.
     - Permitir reanudar una operación interrumpida sin duplicar documentos ya emitidos.
- **Criterios de Aceptación:**
  - [ ] Se puede seleccionar un grado y sección completos.
  - [ ] Se genera un documento por cada estudiante elegible.
  - [ ] Cada documento contiene los datos del alumno correspondiente.
  - [ ] No se repiten CUV ni números correlativos.
  - [ ] Un error individual no invalida los documentos correctamente generados del lote.
  - [ ] Se puede consultar el resultado de cada elemento del lote.
  - [ ] Una operación interrumpida puede reanudarse sin duplicaciones.
  - [ ] Los documentos pueden descargarse individualmente y en conjunto (ZIP).
  - [ ] El historial identifica quién ejecutó la emisión y cuándo.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 8802-8854; clave TASK-221; asignación única: Secretaria -->

---

<!-- ID: TASK-227 | Fuentes: AUDITORIAS/AUDITORIA_COMPLETADAS_T-UX-16.md ; Pendientes.md ; pendientes/Secretaria/Pendientes.md -->
### [ ] [TASK-227] [P1] [Notificaciones - Sistema Centralizado de Notificaciones por Eventos del Workflow]
- **Hallazgo de origen:** AUD-NG-203 (ALTO/P1); parte de AUD-NG-206 (ALTO/P1).
- **Severidad:** Alta. **Objetivo:** restablecer la lectura de notificaciones con un contrato único, consistente y compatible con todos los productores.
- **Acción ejecutable:** declarar y validar explícitamente los filtros de `getUnifiedNotifications`; corregir la consulta que hoy puede producir `ReferenceError`; unificar el esquema de `BandejaNotificaciones` y el orden/tipo de sus columnas para `createUserNotification` y `sendMultiChannelNotification`; añadir migración/validación de registros históricos sin desplazar campos.
- **Archivos/módulos:** `backend/user-service/Code.gs`; `getUnifiedNotifications`; `getUserNotifications`; `getOrCreateSheet`; `createUserNotification`; `sendMultiChannelNotification`; hoja `BandejaNotificaciones`.
- **Dependencias/riesgos:** coordinar con TASK-316 y TASK-045; riesgo de interpretar campos desplazados como destinatario, fecha, estado o destino de acción.
- **Alcance:** contrato backend y persistencia de notificaciones; no asumir que la existencia de endpoints demuestra integración con paneles.
- **Criterios de aceptación:** lectura sin excepciones con hoja vacía y con datos; esquema único versionado; ambos productores escriben el mismo orden y tipos; filtros por usuario/categoría/estado funcionan; registros antiguos migrados o rechazados de forma explícita; pruebas de compatibilidad y regresión.
- **Prioridad:** P1. **Estado:** Pendiente de ejecución/revalidación.
- **Evidencia de cierre:** pendiente; el informe documenta variables no declaradas y escrituras incompatibles de nueve y doce columnas.
- **Componentes Afectados:**
  - `backend/user-service/Code.gs`
- **Dependencias Expuestas:** `F23-Task09`, `F23-Task12`, `F23-Task13`.
- **Capacidades Relacionadas:** F23-016, F23-006, F23-004.
- **Problema Detectado:**
  Las notificaciones están distribuidas en diferentes funciones y no todas las transiciones generan avisos automáticos consistentes.
- **Requisitos Funcionales:**
  1. Centralizar la generación de notificaciones vinculadas a eventos del motor de flujos.
  2. Admitir notificaciones por:
     - Creación de solicitudes.
     - Asignación de tareas.
     - Cambio de responsable o derivación.
     - Aprobación de etapa.
     - Rechazo definitivo.
     - Devolución para correcciones.
     - Vencimiento próximo de SLA.
     - Escalamiento jerárquico.
     - Finalización y resolución del trámite.
     - Error crítico de procesamiento.
  3. Permitir configurar destinatarios por rol, departamento o usuario individual.
  4. Permitir definir plantillas dinámicas con variables de contexto.
  5. Incluir datos contextuales y enlaces directos a la operación.
  6. Diferenciar notificaciones informativas de tareas que requieren acción.
  7. Registrar el estado del envío en la bitácora.
  8. Evitar envíos duplicados de notificaciones.
  9. Permitir configuración de preferencias de notificación para avisos opcionales.
  10. Mantener los avisos obligatorios de seguridad y responsabilidad institucional.
  11. Permitir reintentar entregas fallidas.
  12. Evitar que una notificación enviada se interprete erróneamente como una aprobación de facto.
- **Comportamiento Esperado:**
  Los cambios del proceso generarán notificaciones mediante un mecanismo común, sin que cada módulo implemente su propio sistema aislado.
- **Criterios de Aceptación:**
  - [ ] Crear una solicitud y verificar que se despachan los avisos al asignado.
  - [ ] Aprobar y rechazar una etapa y verificar las notificaciones resultantes.
  - [ ] Simular un error de envío y comprobar que se encola para reintento.
  - [ ] Comprobar que no se envían notificaciones duplicadas ante reintentos.
  - [ ] Verificar que los destinatarios no reciben información ajena a sus permisos de acceso.

- **Ampliación C1.57 / T-UX-16 (2026-11-06):**
  - **AUD-NG-203 (ALTO/P1):** `getUnifiedNotifications` (backend/user-service/Code.gs:4033-4072) usa `categoria`, `leido` y `userId` sin declararlos; `getUserNotifications` delega directamente en esta función. Con filas existentes la consulta puede fallar por ReferenceError. Además, getOrCreateSheet define 9 columnas (línea 892), createUserNotification escribe 9 (5007-5030) y sendMultiChannelNotification escribe 12 con orden distinto (4818-4885); el lector interpreta mal las filas multicanal.
  - **AUD-NG-206 (ALTO/P1):** centralizar deduplicación para todos los productores. sendMultiChannelNotification busca la clave y luego hace append sin reserva atómica; llamadas concurrentes pueden duplicar. createUserNotification no acepta ni persiste clave. Coordinar con TASK-045.
  - Definir esquema versionado con ID estable, destinatario, tipo, origen, entidad relacionada, título, mensaje, categoría, prioridad, fecha, leído/fecha de lectura, enlace, acción requerida, estado de entrega y clave de deduplicación. Migrar o leer de forma compatible las filas históricas de 9/12 columnas.
  - Validar enlaces y contenido según TASK-475; no incluir notas internas ni interpretar una notificación como decisión de workflow.
  - **Criterios adicionales:** consultas con y sin filtros funcionan; contadores coinciden con filas autorizadas; los campos se leen correctamente en ambos formatos; dos creaciones concurrentes con la misma clave producen un evento; cada aviso contiene origen, fecha, contexto y destino.

- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 9104-9133; clave TASK-229; asignación única: Secretaria -->

---

<!-- ID: TASK-262 | Fuentes: Pendientes.md ; pendientes/Secretaria/Pendientes.md -->
### [ ] [TASK-262] [P1] Migración e Integridad Criptográfica de Documentos y Archivos Institucionales
- **Orden de Ejecución:** 7
- **Prioridad:** P1 (Alta)
- **Componentes Afectados:**
  - `backend/accounting-service/Code.gs` (`verifyAndMigrateDriveDocumentsBatch`)
  - Google Drive API / Carpetas de almacenamiento institucional
  - Hojas: `DocumentosEscolaresEmitidos`, `ExpedientesAlumnos`
- **Subcapacidades Relacionadas:** F29-08, F29-21.
- **Estado de Partida:** Implementada parcialmente.
- **Dependencias Principales:** [F29-Task01], [F29-Task04].
- **Problema Detectado y Riesgos:**
  Los documentos institucionales se relacionan mediante URLs de Google Drive. Si las carpetas se reorganizan, los enlaces web se rompen. Asimismo, no existe una verificación criptográfica de que los archivos trasladados conservan su contenido íntegro sin alteraciones o corrupciones.
- **Requisitos Funcionales y Técnicos Convergentes:**
  1. *Identificador inmutable y metadatos:*
     - Almacenar el `driveFileId` persistente en lugar de enlaces web temporales.
     - Registrar metadatos: nombre original, tipo MIME, tamaño en bytes, fecha de origen, fecha de migración, expediente relacionado, categoría documental y estado de integridad.
  2. *Verificación de integridad por hash SHA-256:*
     - Calcular y comparar el hash SHA-256 del archivo en origen y en destino para garantizar que no hubo alteraciones.
  3. *Auditoría y saneamiento documental:*
     - Detectar archivos duplicados, corruptos, incompletos o sin expediente asociado.
     - Permitir reconstruir referencias si se reorganizan carpetas.
     - Migración por lotes reanudable y reporte descargable de archivos aceptados y fallidos.
     - Verificación estricta de permisos para evitar que documentos privados queden expuestos públicamente.
- **Criterios de Aceptación:**
  - [ ] Los documentos migrados conservan el mismo SHA-256 que sus archivos originales.
  - [ ] Los enlaces internos funcionan tras reorganizar carpetas en Drive.
  - [ ] Los archivos corruptos o sin expediente se identifican y reportan.
  - [ ] La migración de archivos puede reanudarse sin duplicar elementos.
  - [ ] Los permisos de acceso se ajustan al perfil institucional autorizado.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 10886-10928; clave TASK-288; asignación única: Secretaria -->

---

<!-- ID: TASK-288 | Fuentes: Pendientes.md ; pendientes/Secretaria/Pendientes.md -->
### [ ] [TASK-288] [F31-T07] [P1] Constructor Visual Universal de Formularios Digitales
- **Orden de Ejecución:** 7
- **Prioridad:** P1 (Alta)
- **Componentes Afectados:**
  - `backend/user-service/Code.gs` (`saveInstitutionalFormSchema`, `getFormSchemaWithFields`)
  - `js/ui-common.js` (Constructor visual arrastrar y soltar)
  - Hoja: `FormulariosInstitucionales`
- **Subcapacidades Relacionadas:** F31-04, F31-11.
- **Origen del Hallazgo:** `AUDITORIA_FASE_31_DISENADOR_UNIVERSAL_DOCUMENTOS_PLANTILLAS.md` / Sección B (F31-04) y Backlog de Implementación F31-T07.
- **Problema o Carencia:**
  La plataforma permite almacenar definiciones de formularios y procesar solicitudes, pero la configuración basada en estructuras JSON no ofrece a los responsables institucionales una experiencia suficientemente accesible para diseñar y mantener formularios complejos.
- **Requisitos Funcionales y Técnicos Convergentes:**
  1. *Constructor visual interactivo:*
     - Crear formularios desde cero o duplicar formularios existentes mediante interfaz visual de arrastrar y soltar.
     - Reordenar campos y secciones, agruparlos por categorías y crear formularios multipágina.
     - Configurar títulos, instrucciones y descripciones por sección.
     - Previsualizar el formulario en vistas de escritorio y móvil durante el diseño.
     - Guardar borradores sin publicarlos, duplicar, versionar y archivar formularios.
  2. *Catálogo completo de tipos de campos:*
     - Texto corto y texto multilínea, número entero y decimal.
     - Fecha, hora, fecha y hora combinadas, correo electrónico y teléfono.
     - Listas desplegables, selección múltiple, botones de opción (radio) y casillas de verificación (checkboxes).
     - Campos de dirección, firma manuscrita digitalizada, adjuntos de archivos y campos calculados.
     - Campos ocultos controlados por el sistema, separadores y textos informativos.
     - Selectores alimentados dinámicamente por catálogos institucionales autorizados (grados, secciones, materias).
  3. *Propiedades y configuración de campos:*
     - Etiqueta visible, descripción y texto de ayuda (placeholder), valor predeterminado.
     - Obligatoriedad (requerido/opcional), longitud mínima y máxima, límites numéricos y formato/patrón regex de validación con mensaje de error personalizado.
     - Identificador estable del campo para conservar compatibilidad entre versiones.
     - Configuración de adjuntos por tipos MIME y tamaño máximo permitido.
  4. *Vinculación con plantillas documentales:*
     - Asociar un formulario con una o varias plantillas autorizadas.
     - Mapear las respuestas del formulario a las variables dinámicas de la plantilla.
     - Permitir formularios que solo recopilen información sin emitir documentos, así como formularios que generen automáticamente un documento oficial tras su aprobación.
- **Criterios de Aceptación:**
  - [ ] Se pueden crear formularios complejos con todos los tipos de campos implementados sin escribir JSON manual.
  - [ ] Se pueden reorganizar campos y páginas conservando sus propiedades al guardar y reabrir.
  - [ ] Las respuestas se almacenan con identificadores estables y no se alteran al editar versiones posteriores.
  - [ ] Los formularios publicados se pueden diligenciar desde los perfiles autorizados y generan el documento correspondiente.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 10929-10965; clave TASK-289; asignación única: Secretaria -->

---

<!-- ID: TASK-289 | Fuentes: Pendientes.md ; pendientes/Secretaria/Pendientes.md -->
### [ ] [TASK-289] [F31-T08] [P1] Motor Centralizado de Reglas Condicionales y Formularios Dinámicos
- **Orden de Ejecución:** 8
- **Prioridad:** P1 (Alta)
- **Componentes Afectados:**
  - `backend/user-service/Code.gs` (`evaluateFormConditionalLogic`, `validateFormSubmissionRules`)
  - `js/ui-common.js`
  - Hoja: `FormulariosInstitucionales`
- **Subcapacidades Relacionadas:** F31-05.
- **Origen del Hallazgo:** `AUDITORIA_FASE_31_DISENADOR_UNIVERSAL_DOCUMENTOS_PLANTILLAS.md` / Sección B (F31-05) y Backlog de Implementación F31-T08.
- **Problema o Carencia:**
  La lógica condicional funciona en determinados formularios mediante scripts particulares en el cliente, pero carece de un motor centralizado, estandarizado y verificable en servidor para impedir inconsistencias o peticiones manipuladas.
- **Requisitos Funcionales y Técnicos Convergentes:**
  1. *Constructor y evaluador de reglas condicionales:*
     - Reglas condicionales configurables visualmente desde el constructor.
     - Operadores de comparación: Igual, Diferente, Mayor que, Menor que, Contiene, No contiene, Está vacío y No está vacío.
     - Agrupación lógica de condiciones mediante operadores booleanos AND y OR.
  2. *Acciones dinámicas sobre el formulario:*
     - Mostrar u ocultar campos individuales o secciones completas.
     - Habilitar o deshabilitar campos según elecciones previas.
     - Cambiar dinámicamente la obligatoriedad de un campo (ej. requerir documento de traslado únicamente si el estudiante proviene de otro colegio).
     - Ramificaciones entre páginas del formulario y campos calculados en tiempo real.
     - Detección y prevención de referencias circulares o dependencias contradictorias antes de publicar el formulario.
  3. *Validación en servidor y seguridad:*
     - Validar las reglas condicionales tanto en cliente como en el backend.
     - Los campos ocultados dinámicamente no deben bloquear el envío por reglas de obligatoriedad que ya no aplican.
     - Rechazar en servidor envíos manipulados que intenten inyectar valores en campos que debían estar deshabilitados u ocultos.
     - Definir política para respuestas de campos que dejan de ser visibles al cambiar una opción previa.
- **Criterios de Aceptación:**
  - [ ] Se pueden configurar y evaluar reglas con combinaciones AND y OR complejas.
  - [ ] La visibilidad y obligatoriedad cambian en tiempo real de forma idéntica en escritorio y dispositivos móviles.
  - [ ] El servidor rechaza peticiones que violen las reglas condicionales configuradas.
  - [ ] Se detectan e informan dependencias circulares o reglas inválidas antes de la publicación.
  - [ ] Se pueden probar las reglas en un entorno de simulación previo al lanzamiento.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 10966-10998; clave TASK-290; asignación única: Secretaria -->

---

<!-- ID: TASK-290 | Fuentes: Pendientes.md ; pendientes/Secretaria/Pendientes.md -->
### [ ] [TASK-290] [F31-T09] [P1] Guardado de Borradores, Continuidad de Formularios y Recuperación de Respuestas
- **Orden de Ejecución:** 9
- **Prioridad:** P1 (Alta)
- **Componentes Afectados:**
  - `backend/user-service/Code.gs` (`saveFormDraftSubmission`, `getFormDraftSubmission`, `resolveFormSubmissionConflict`)
  - `js/ui-common.js`, `js/persistence.js`
  - Hoja: `BorradoresFormularios`, `SolicitudesTramites`
- **Subcapacidades Relacionadas:** F31-05, F31-18.
- **Origen del Hallazgo:** `AUDITORIA_FASE_31_DISENADOR_UNIVERSAL_DOCUMENTOS_PLANTILLAS.md` / Sección B (F31-05, F31-18) y Backlog de Implementación F31-T09.
- **Problema o Carencia:**
  Los trámites institucionales extensos que requieren múltiples pasos y adjuntos pueden perderse si el usuario sufre un cierre accidental, interrupción de conexión o cambio de dispositivo antes de enviar, perjudicando los procesos de matrícula y solicitudes.
- **Requisitos Funcionales y Técnicos Convergentes:**
  1. *Persistencia temporal de borradores:*
     - Guardado automático periódico en segundo plano y guardado manual con indicación de fecha y hora.
     - Recuperación fluida del último estado guardado al reanudar la sesión en cualquier dispositivo.
     - Permitir guardar formularios incompletos identificando campos pendientes y errores de validación sin enviar la solicitud formal.
  2. *Ciclo de vida y corrección de solicitudes:*
     - Estados diferenciados: `Borrador`, `Enviado`, `En_Revision`, `Observado`, `Aprobado`, `Rechazado` y `Cerrado`.
     - Permitir subsanar una solicitud observada corrigiendo los campos señalados sin generar un nuevo trámite duplicado.
     - Mantener los archivos adjuntos cargados vinculados al borrador de forma segura.
  3. *Control de concurrencia y expiración:*
     - Controlar conflictos de edición simultánea si el formulario se accede desde múltiples sesiones.
     - Políticas configurables de expiración y purga de borradores abandonados (`DIAS_EXPIRACION_BORRADORES`).
     - Protección contra envíos dobles mediante tokens de transacción (idempotencia).
- **Criterios de Aceptación:**
  - [ ] Un formulario incompleto se guarda en borrador y se recupera intacto tras cerrar la sesión o perder conexión.
  - [ ] El envío definitivo no se duplica ante doble pulsación del botón o reintentos de red.
  - [ ] Una solicitud observada puede ser editada y reenviada conservando su número de trámite original.
  - [ ] Los borradores no son accesibles por usuarios externos no autorizados y caducan según la política configurada.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 10999-11032; clave TASK-291; asignación única: Secretaria -->

---

<!-- ID: TASK-291 | Fuentes: Pendientes.md ; pendientes/Secretaria/Pendientes.md -->
### [ ] [TASK-291] [F31-T10] [P1] Sistema de Estilos Institucionales y Componentes Documentales Reutilizables
- **Orden de Ejecución:** 10
- **Prioridad:** P1 (Alta)
- **Componentes Afectados:**
  - `backend/accounting-service/Code.gs` (`saveCorporateStyleLibrary`, `getCorporateStyleLibrary`, `applyCorporateStyleToTemplate`)
  - `js/ui-common.js`
  - Hoja: `EstilosCorporativosDocumentales`, `ComponentesDocumentalesReutilizables`
- **Subcapacidades Relacionadas:** F31-03.
- **Origen del Hallazgo:** `AUDITORIA_FASE_31_DISENADOR_UNIVERSAL_DOCUMENTOS_PLANTILLAS.md` / Sección B (F31-03) y Backlog de Implementación F31-T10.
- **Problema o Carencia:**
  Las plantillas configuran formatos y estilos de forma aislada, originando inconsistencias visuales en el uso de membretes, sellos, paletas de colores corporativos y tipografías entre departamentos que deberían compartir una identidad visual uniforme.
- **Requisitos Funcionales y Técnicos Convergentes:**
  1. *Perfiles de diseño e identidad institucional:*
     - Configurar perfiles corporativos con logotipos oficiales en alta resolución, encabezados, pies de página, sellos digitales y datos de contacto.
     - Paletas de colores aprobadas y tipografías autorizadas con tamaños jerárquicos.
     - Estilos reutilizables para títulos, subtítulos, texto normal, tablas y notas legales al pie.
  2. *Bloques y componentes institucionales reutilizables:*
     - Bloques predefinidos: bloques de firmas mancomunadas, declaraciones juradas, advertencias legales y cajas de contacto.
     - Diseños diferenciados por departamento o categoría documental.
     - Encabezados y pies de página distintos para la primera página y para páginas pares/impares (impresión dúplex).
     - Configuración de la ubicación del CUV, código QR, folio correlativo y fecha de emisión.
  3. *Gobernanza y resolución de conflictos:*
     - Las nuevas plantillas heredan automáticamente el perfil de diseño institucional asignado.
     - Permitir excepciones locales justificadas en plantillas particulares sin alterar el perfil global.
     - Los cambios en los perfiles globales de diseño aplican únicamente a nuevas emisiones, respetando la inmutabilidad de los documentos emitidos históricos.
- **Criterios de Aceptación:**
  - [ ] Se pueden crear y asignar perfiles de diseño institucional por departamento.
  - [ ] Las nuevas plantillas heredan los estilos y componentes corporativos de forma transparente.
  - [ ] Las modificaciones en la identidad visual no alteran retrospectivamente documentos ya emitidos.
  - [ ] Los encabezados y pies diferenciados (primera página y páginas pares/impares) se renderizan fielmente en el PDF.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 11033-11064; clave TASK-292; asignación única: Secretaria -->

---

<!-- ID: TASK-292 | Fuentes: Pendientes.md ; pendientes/Secretaria/Pendientes.md -->
### [ ] [TASK-292] [F31-T11] [P1] Integración Automática de Documentos Emitidos con Expedientes y Procesos
- **Orden de Ejecución:** 11
- **Prioridad:** P1 (Alta)
- **Componentes Afectados:**
  - `backend/accounting-service/Code.gs` (`linkIssuedDocumentToStudentFile`, `linkIssuedDocumentToEmployeeFile`)
  - `backend/academic-service/Code.gs`, `backend/user-service/Code.gs`
  - Hoja: `DocumentosEscolaresEmitidos`, `DocumentosEstudiante`, `DocumentosEmpleado`, `ExpedientesEstudiantes`
- **Subcapacidades Relacionadas:** F31-16, F31-22.
- **Origen del Hallazgo:** `AUDITORIA_FASE_31_DISENADOR_UNIVERSAL_DOCUMENTOS_PLANTILLAS.md` / Sección B (F31-16, F31-22) y Backlog de Implementación F31-T11.
- **Problema o Carencia:**
  Existen vínculos parciales entre documentos emitidos, expedientes de estudiantes y trámites, pero se requiere consolidar la cobertura para asegurar que todo documento generado (constancias, certificaciones, contratos, amonestaciones) se archive automáticamente en el expediente correcto sin intervención manual.
- **Requisitos Funcionales y Técnicos Convergentes:**
  1. *Indexación automática transversal:*
     - Asociar documentos emitidos con expedientes de estudiantes, expedientes laborales de docentes/personal, responsables de familia y expedientes de trámites administrativos.
     - Registrar metadatos completos: tipo documental, CUV, número correlativo, destinatario, fecha, plantilla, versión y usuario emisor.
     - Diferenciar documentos generados automáticamente por el sistema de documentos externos escaneados y cargados al expediente.
  2. *Consulta y filtrado centralizado:*
     - Consultar y descargar documentos directamente desde la ficha del expediente en los dashboards respectivos (Secretaría, Dirección, Recursos Humanos, Contabilidad).
     - Filtros multicriterio: tipo de documento, fecha, estado, departamento y emisor.
     - Evitar asociaciones ambiguas cuando existan homónimos mediante validación de identificador único institucional.
     - Permitir corregir una asociación errónea mediante una operación auditada con justificación obligatoria.
     - Mantener la integridad de las referencias históricas aunque el expediente sea archivado o transferido.
- **Criterios de Aceptación:**
  - [ ] Los documentos emitidos se asocian de forma automática e inmediata al expediente correspondiente.
  - [ ] Los documentos de un estudiante o empleado no son visibles en expedientes ajenos.
  - [ ] Las referencias se conservan intactas tras cambios de estado, grado o baja del expediente.
  - [ ] Se registran en auditoría todas las correcciones o traslados de asociación documental.
  - [ ] El acceso respeta estrictamente los permisos del expediente y la confidencialidad del documento.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 11065-11095; clave TASK-293; asignación única: Secretaria -->

---

<!-- ID: TASK-293 | Fuentes: Pendientes.md ; pendientes/Secretaria/Pendientes.md -->
### [ ] [TASK-293] [F31-T12] [P1] Ampliación del Catálogo Universal de Documentos y Trámites Departamentales
- **Orden de Ejecución:** 12
- **Prioridad:** P1 (Alta)
- **Componentes Afectados:**
  - `backend/accounting-service/Code.gs` (`initializeDepartmentalDocumentCatalog`)
  - `backend/user-service/Code.gs`, `backend/academic-service/Code.gs`
  - Hoja: `PlantillasEscolares`, `CatalogoTramitesInstitucionales`
- **Subcapacidades Relacionadas:** F31-22.
- **Origen del Hallazgo:** `AUDITORIA_FASE_31_DISENADOR_UNIVERSAL_DOCUMENTOS_PLANTILLAS.md` / Sección B (F31-22) y Backlog de Implementación F31-T12.
- **Problema o Carencia:**
  El catálogo actual contempla constancias escolares y recibos de pago, pero no cubre suficientemente los procesos documentales de todos los departamentos (RRHH, Dirección, Docencia, Operaciones), requiriendo unificar la creación de plantillas bajo el mismo motor universal.
- **Requisitos Funcionales y Técnicos Convergentes:**
  1. *Cobertura departamental estandarizada:*
     - Secretaría: Constancias de estudio, certificados de notas oficiales, historiales académicos, constancias de matrícula, autorizaciones, solicitudes de traslado y comunicaciones a familias.
     - Dirección y Administración: Circulares, memorandos, actas de asamblea, resoluciones, acuerdos directivos y comunicaciones oficiales.
     - Docencia y Coordinación: Informes bimestrales de rendimiento, reportes de evaluación por competencias, actas de reuniones de área, planificaciones y reportes de seguimiento conductual.
     - Contabilidad y Finanzas: Recibos oficiales, estados de cuenta, comprobantes de retención, notificaciones de cobro y actas de arqueo de caja.
     - Recursos Humanos: Contratos laborales y adendas, constancias de trabajo, solicitudes de permisos/vacaciones, actas de descargo y amonestaciones.
     - Operaciones: Formularios de despacho de inventario, actas de recepción de bienes, contratos de transporte y autorizaciones de retiro de alumnos.
  2. *Automatización de trámites de principio a fin:*
     - Iniciar el trámite desde una plantilla del catálogo departamental.
     - Recuperar datos del expediente, completar campos mediante formulario, someter a flujo de aprobación, emitir PDF final con CUV, indexar en el expediente y notificar a los interesados.
- **Criterios de Aceptación:**
  - [ ] Se pueden crear y administrar documentos de diferentes departamentos utilizando el mismo motor central.
  - [ ] Cada categoría documental dispone de sus propios campos, flujos de aprobación y permisos aislados.
  - [ ] Las plantillas de un departamento no son accesibles por perfiles sin autorización.
  - [ ] Se comprueba la ejecución completa de un trámite documental desde su solicitud hasta su archivo en expediente.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 11096-11126; clave TASK-294; asignación única: Secretaria -->

---

<!-- ID: TASK-294 | Fuentes: Pendientes.md ; pendientes/Secretaria/Pendientes.md -->
### [ ] [TASK-294] [F31-T13] [P1] Gestión Avanzada de Versiones y Ciclo de Vida Inmutable de Plantillas
- **Orden de Ejecución:** 13
- **Prioridad:** P1 (Alta)
- **Componentes Afectados:**
  - `backend/accounting-service/Code.gs` (`createDocumentTemplateVersion`, `compareTemplateVersions`, `restoreTemplateVersion`)
  - Hoja: `PlantillasEscolares`, `HistorialVersionesPlantillas`
- **Subcapacidades Relacionadas:** F31-13.
- **Origen del Hallazgo:** `AUDITORIA_FASE_31_DISENADOR_UNIVERSAL_DOCUMENTOS_PLANTILLAS.md` / Sección B (F31-13) y Backlog de Implementación F31-T13.
- **Problema o Carencia:**
  La plataforma registra versiones numéricas y protege documentos emitidos, pero se necesita un ciclo de vida formal que distinga entre borradores, versiones en revisión, aprobadas, publicadas y archivadas, permitiendo comparar cambios y restaurar versiones previas de forma auditable.
- **Requisitos Funcionales y Técnicos Convergentes:**
  1. *Ciclo de vida formal de plantillas:*
     - Estados: `Borrador`, `En_Revision`, `Aprobada`, `Publicada`, `Archivada` y `Obsoleta`.
     - Versionado secuencial inmutable: cambios menores (`v1.1`, `v1.2`) y cambios mayores (`v2.0`).
     - Registrar autor, fecha y hora, motivo justificado y resumen detallado de los cambios realizados.
     - Programación de fechas de vigencia: fecha de entrada en vigor y fecha límite de validez.
  2. *Comparación y restauración segura:*
     - Herramienta visual de comparación (diff) entre dos versiones mostrando variaciones de texto, formato, campos y reglas.
     - Restaurar una versión anterior como una nueva versión activa, sin eliminar el historial intermedio.
     - Retirar o archivar una plantilla impidiendo su uso en nuevos trámites pero conservando el acceso a documentos históricos emitidos bajo dicha versión.
     - Detectar ediciones concurrentes para prevenir sobrescrituras silenciosas mediante control de versiones optimista.
- **Criterios de Aceptación:**
  - [ ] Se conserva el historial completo e inmutable de todas las versiones de cada plantilla.
  - [ ] El comparador identifica con precisión las diferencias de texto, campos y diseño entre dos versiones.
  - [ ] La restauración crea una nueva versión sin destruir versiones previas.
  - [ ] Los documentos emitidos conservan inalterada la referencia a la versión exacta con la que fueron generados.
  - [ ] Los trámites en curso mantienen la versión vigente al momento de su inicio.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 11161-11192; clave TASK-296; asignación única: Secretaria -->

---

<!-- ID: TASK-296 | Fuentes: AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-18.md ; AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-19.md ; Pendientes.md ; pendientes/Secretaria/Pendientes.md -->
### [ ] [TASK-296] [F31-T15] [P1] Seguridad Avanzada y Validación Criptográfica de Archivos Documentales
- Escapar los valores del catálogo al insertarlos en HTML, incluyendo título, descripción, autor, área, categoría y cualquier otro campo persistido; preferir APIs DOM seguras frente a concatenación de HTML.
- Validar URLs por esquema y destino permitido antes de mostrarlas o abrirlas; bloquear esquemas ejecutables, destinos no autorizados y redirecciones inseguras.
- Aplicar sanitización contextual tanto al guardar como al renderizar, sin tratar la sanitización de entrada como sustituto del escape de salida.
- Aplicar las reglas de acceso/ACL a enlaces de Drive o archivos privados; no exponer URLs públicas como sustituto de autorización.
- Añadir pruebas de XSS almacenado con payloads en todos los campos visibles y pruebas de enlaces malformados/no permitidos.

**Reconciliación y límites:** AUD-NG-171 concentra catálogo, deduplicación, versionado inmutable, relaciones Proyecto-Recurso-Versión, contexto temporal e integración UI. AUD-NG-164 conserva el catálogo curricular canónico; AUD-NG-158 conserva ABAC y actor verificado; TASK-296 conserva sanitización/XSS/enlaces/ACL de salida. No se crean IDs adicionales ni se absorben los controles transversales.

**Evidencia requerida:** CRUD con actualización real; deduplicación; historial de versiones no modificable; proyecto con recursos de varias áreas y versiones fijas; filtros efectivos; permisos positivos/negativos por rol y propietario; interfaz operativa; pruebas de XSS almacenado y URLs inseguras; y referencias curriculares válidas/inválidas. La auditoría actual es estática y no acredita estos comportamientos.
- Escapar en contexto todos los datos de asignaturas, equivalencias, observaciones, errores y resultados antes de insertarlos en la interfaz.
- Evitar concatenación de HTML con valores provenientes del catálogo o del proceso de migración; usar APIs DOM seguras.
- Validar URLs/enlaces asociados a documentos o evidencias y respetar las ACL correspondientes.
- Incorporar pruebas de XSS almacenado/reflejado en el panel de equivalencias como parte de la interfaz de administración.

**Reconciliación y límites:** AUD-NG-172 es propietario del flujo específico de migración curricular (equivalencias, prevalidación, snapshot, ejecución, comparación y rollback selectivo). AUD-NG-164 conserva el catálogo y las relaciones de planes; AUD-NG-167 la integridad de calificaciones/boletines; TASK-078 el rollback operativo general; AUD-NG-158 la autorización y actor; TASK-296 el renderizado seguro. El backup general no reemplaza el rollback específico. No se crean IDs adicionales.

**Evidencia requerida:** equivalencias reales y casos ambiguos; prevalidación con duplicados/huérfanos; snapshot recuperable; plan determinista; ejecución idempotente; fallo inducido a mitad de lote; rollback selectivo que preserve cambios posteriores; comparación antes/después de notas, matrículas, códigos y boletines; autorización por rol/ámbito; y pruebas de interfaz. La auditoría actual es estática y no acredita ninguno de estos resultados.
- **Orden de Ejecución:** 15
- **Prioridad:** P1 (Alta)
- **Componentes Afectados:**
  - `backend/academic-service/Code.gs` (`validateBinaryAttachmentSecurity`, `sanitizeUploadedDocumentContent`)
  - `backend/user-service/Code.gs`
- **Subcapacidades Relacionadas:** F31-15, F31-17.
- **Origen del Hallazgo:** `AUDITORIA_FASE_31_DISENADOR_UNIVERSAL_DOCUMENTOS_PLANTILLAS.md` / Sección B (F31-15, F31-17) y Backlog de Implementación F31-T15.
- **Problema o Carencia:**
  La plataforma valida extensiones y tamaños de adjuntos, pero se requiere endurecimiento contra archivos con contenidos maliciosos encubiertos (ejecutables renombrados, macros embebidas o ataques de inyección) para proteger la información institucional y personal almacenada en Google Drive.
- **Requisitos Funcionales y Técnicos Convergentes:**
  1. *Validación binaria de archivos (Magic Numbers):*
     - Validar la firma binaria real del archivo contrastándola con el tipo MIME declarado (PDF, PNG, JPG, DOCX).
     - Rechazar archivos ejecutables (.exe, .bat, .cmd, .sh, .vbs, .js) y archivos con doble extensión.
     - Deshabilitar o neutralizar macros VBA, scripts y acciones ejecutables embebidas en documentos importados.
  2. *Sanitización y mitigación de inyecciones:*
     - Sanitizar contenidos HTML importados para prevenir cross-site scripting (XSS).
     - Prevenir inyecciones de fórmulas (CSV/Excel Formula Injection) cuando datos de formularios se exporten a hojas de cálculo.
     - Validar archivos comprimidos ZIP previniendo ataques de bomba de descompresión (zip bombs) o rutas relativas maliciosas.
  3. *Privacidad y control de enlaces:*
     - Garantizar que los archivos en Google Drive permanezcan en carpetas privadas con permisos controlados.
     - Acceso mediante enlaces temporales firmados criptográficamente (HMAC-SHA256) con expiración configurable.
     - Auditoría estricta de descargas, accesos rechazados y expiraciones sin exponer datos PII.
- **Criterios de Aceptación:**
  - [ ] Un archivo ejecutable con extensión `.pdf` renombrada es bloqueado y rechazado por el servidor.
  - [ ] Los scripts o macros dentro de archivos importados son desarmados sin interrumpir el sistema.
  - [ ] Los documentos privados no se pueden descargar mediante enlaces públicos ni manipulación de identificadores.
  - [ ] Todos los accesos a documentos sensibles quedan registrados en la bitácora de seguridad.
- **Estado:** [ ] Pendiente

- El catálogo docente inserta titulo, area, asignatura, tema, version y urlDrive directamente en innerHTML; manageReusableResource acepta esos valores desde payload. Aplicar escape de salida por contexto y sanitización de contenido.
- Validar urlDrive con allowlist de dominios/esquemas HTTPS y comprobar ID/ACL del archivo Drive; rechazar javascript:, data:, URLs externas no permitidas y enlaces sin permiso.
- Añadir rel="noopener noreferrer" a enlaces target=_blank y pruebas de XSS almacenado usando título/tema/URL maliciosos.

Nota de secuencia: TAREA-15 registró que no debía crearse AUD-NG-170 porque sus brechas ya estaban cubiertas por tareas previas. Ese ID permanece sin asignar. AUD-NG-171 corresponde a un hallazgo nuevo y distinto de TAREA-18.

Progreso de auditoría: 24/183 identificadores únicos; 159 pendientes. Siguiente tarea: TAREA-19.
================================================================

HALLAZGO TAREA-19 - MIGRACIÓN CURRICULAR SIN PÉRDIDA DE DATOS (2026-11-05)
- Escapar nombre/código de asignatura al renderizar equivalencias en el panel y validar los datos mostrados para evitar inyección HTML almacenada desde el catálogo curricular.

Hallazgo nuevo: AUD-NG-172. Progreso de auditoría: 25/183 identificadores únicos; 158 pendientes. Siguiente tarea: TAREA-20.

AMPLIACIÓN DE TAREAS EXISTENTES DERIVADA DE TAREA-20 (2026-11-05)

No se crea AUD-NG nuevo. Se amplían tareas pendientes existentes, sin borrar ni reescribir sus registros originales.

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 11193-11223; clave TASK-297; asignación única: Secretaria -->

---

<!-- ID: TASK-297 | Fuentes: Pendientes.md ; pendientes/Secretaria/Pendientes.md -->
### [ ] [TASK-297] [F31-T16] [P1] Fortalecimiento de Firmas, Conformidades y Evidencias de Aprobación
- **Orden de Ejecución:** 16
- **Prioridad:** P1 (Alta)
- **Componentes Afectados:**
  - `backend/user-service/Code.gs` (`registerDocumentSignature`, `verifyDocumentSignatureIntegrity`)
  - Hoja: `FirmasConformidades`, `DocumentosEscolaresEmitidos`
- **Subcapacidades Relacionadas:** F31-11, F31-15.
- **Origen del Hallazgo:** `AUDITORIA_FASE_31_DISENADOR_UNIVERSAL_DOCUMENTOS_PLANTILLAS.md` / Sección B (F31-11) y Backlog de Implementación F31-T16.
- **Problema o Carencia:**
  El registro de firmas con token y hash aporta trazabilidad, pero se requiere diferenciar con rigor técnico y legal entre aceptación electrónica simple, conformidad registrada, firma manuscrita digitalizada y firma electrónica avanzada bajo el marco normativo aplicable (Decreto 149-2013).
- **Requisitos Funcionales y Técnicos Convergentes:**
  1. *Diferenciación de modalidades de firma:*
     - Aceptación simple (checkbox de consentimiento con marca de tiempo e IP).
     - Firma manuscrita digitalizada (trazo capturado en Canvas incrustado visualmente).
     - Firma electrónica institucional (asociada a la identidad del usuario con hash SHA-256 del documento y token de verificación).
  2. *Metadatos y sellado de integridad:*
     - Identidad del firmante (`userId`, DNI, rol), contexto de la operación, fecha/hora exacta.
     - Hash criptográfico SHA-256 del documento al momento de la firma para verificar que el contenido no ha cambiado posteriormente.
     - Soporte para flujos de múltiples firmantes con orden secuencial de intervención obligatorio.
     - Imposibilidad de reutilizar una evidencia de firma en otro documento o versión distinta.
  3. *Certificado de evidencia de firma:*
     - Generar hoja de evidencias o resumen de firmas anexable al documento PDF con código de verificación.
- **Criterios de Aceptación:**
  - [ ] Cada firma queda indisolublemente vinculada al hash de la versión exacta del documento firmado.
  - [ ] Cualquier alteración posterior del archivo se detecta al recalcular el hash criptográfico.
  - [ ] La interfaz comunica con total claridad el alcance y tipo de firma registrado sin atribuir falsas equivalencias legales.
  - [ ] Se respeta el orden estricto de intervención en flujos de firmas mancomunadas.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 11284-11316; clave TASK-301; asignación única: Secretaria -->

---

<!-- ID: TASK-301 | Fuentes: Pendientes.md ; pendientes/Secretaria/Pendientes.md -->
### [ ] [TASK-301] [P1] Selección Múltiple, Edición Conjunta y Alineación Avanzada de Campos
- **Orden de Ejecución:** 4
- **Prioridad:** P1 (Alta)
- **Componentes Afectados:**
  - `js/teacher.js` (`initMultiFieldSelection`, `alignSelectedFields`, `distributeSelectedFields`, `groupSelectedFields`)
  - `teacher-dashboard.html`
- **Subcapacidades Relacionadas:** F32-05.
- **Origen del Hallazgo:** `AUDITORIA_FASE_32_EDITOR_VISUAL_PDF_CAMPOS_SUPERPUESTOS.md` / Sección B (3, 5) y Backlog F32-Task04.
- **Problema Detectado y Riesgos:**
  La edición se realiza exclusivamente sobre campos individuales, dificultando el diseño de documentos con decenas de casillas repetitivas (fichas de calificaciones o tablas de asistencia).
- **Requisitos Funcionales y Técnicos Convergentes:**
  1. *Mecanismos de selección múltiple:*
     - Selección con combinación de teclas (`Clic + Shift`).
     - Selección elástica por arrastre de marco rectangular (marquee selection).
     - Selección desde la lista de campos del panel lateral o selección de todos los campos de la página activa.
  2. *Operaciones y alineación en bloque:*
     - Mover simultáneamente el conjunto de campos seleccionados conservando distancias relativas.
     - Alinear por: Izquierda, Centro horizontal, Derecha, Arriba, Centro vertical y Abajo.
     - Distribuir uniformemente espacios horizontales y verticales.
     - Igualar ancho y alto tomando como base el primer campo seleccionado.
     - Agrupar y desagrupar campos para moverlos como una sola unidad lógica.
     - Duplicar y copiar/pegar conjuntos de campos asignando identificadores únicos independientes.
     - Bloquear campos para evitar modificaciones accidentales.
     - Historial de deshacer/rehacer (Undo/Redo) para todas las operaciones en grupo.
- **Criterios de Aceptación:**
  - [ ] Permite seleccionar varios campos con Shift o marco rectangular y alinearlos con un solo clic.
  - [ ] Las distancias distribuidas de forma uniforme son geométricamente exactas.
  - [ ] Las operaciones en bloque conservan íntegras las propiedades individuales (fuente dinámica, validaciones) de cada campo.
  - [ ] Deshacer restaura el estado previo del grupo seleccionado de forma consistente.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 11317-11349; clave TASK-302; asignación única: Secretaria -->

---

<!-- ID: TASK-302 | Fuentes: Pendientes.md ; pendientes/Secretaria/Pendientes.md -->
### [ ] [TASK-302] [P1] Ampliación de Tipos de Campos y Controles de Captura Especializados
- **Orden de Ejecución:** 5
- **Prioridad:** P1 (Alta)
- **Componentes Afectados:**
  - `js/teacher.js` (`addOverlayField`, `renderOverlayFieldsForCurrentPage`)
  - `teacher-dashboard.html`
  - `backend/accounting-service/Code.gs`
- **Subcapacidades Relacionadas:** F32-04, F32-06.
- **Origen del Hallazgo:** `AUDITORIA_FASE_32_EDITOR_VISUAL_PDF_CAMPOS_SUPERPUESTOS.md` / Sección B (6) y Backlog F32-Task05.
- **Problema Detectado y Riesgos:**
  El editor dispone de texto corto, multilínea, fecha, checkbox y firma, careciendo de controles especializados para cálculos, monedas, listas desplegables o selecciones excluyentes requeridas en trámites institucionales y boletas de pago.
- **Requisitos Funcionales y Técnicos Convergentes:**
  1. *Controles numéricos y financieros:*
     - Campo numérico entero y decimal con validación de rangos (mínimo, máximo, decimales).
     - Campo monetario en Lempiras (`HNL`) formateado visualmente (`L. 0.00`) conservando el valor numérico en el modelo.
  2. *Controles de selección estructurada:*
     - Listas desplegables con opciones manuales o alimentadas por catálogos institucionales.
     - Grupos de botones de radio (Radio Group) mutuamente excluyentes vinculados a una misma variable.
     - Selección múltiple de casillas con límites mínimos y máximos de selección.
  3. *Campos calculados y gráficos:*
     - Campos calculados con fórmulas sencillas dependientes de otros campos con prevención de referencias circulares.
     - Controles de fecha y hora con restricciones de intervalos y valores predeterminados dinámicos.
     - Imágenes y fotografías adjuntas vinculadas al expediente institucional con ajuste de proporciones.
     - Código QR dinámico enlazado al portal de verificación CUV.
- **Criterios de Aceptación:**
  - [ ] Se pueden insertar y configurar controles numéricos, monetarios, desplegables, radios y calculados.
  - [ ] Los radios de un mismo grupo respetan la exclusión mutua tanto en web como en el PDF final.
  - [ ] Los campos calculados se actualizan en tiempo real al modificar los valores de origen.
  - [ ] Las opciones y propiedades de cada control se serializan y recuperan intactas en la plantilla.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 11350-11380; clave TASK-303; asignación única: Secretaria -->

---

<!-- ID: TASK-303 | Fuentes: Pendientes.md ; pendientes/Secretaria/Pendientes.md -->
### [ ] [TASK-303] [P1] Generador de Formularios Web Dinámicos Vinculado a Plantillas PDF
- **Orden de Ejecución:** 6
- **Prioridad:** P1 (Alta)
- **Componentes Afectados:**
  - `js/ui-common.js` (`renderWebFormFromPdfOverlayTemplate`)
  - `backend/user-service/Code.gs`, `backend/accounting-service/Code.gs`
  - Hoja: `SolicitudesTramites`
- **Subcapacidades Relacionadas:** F32-07, F32-08.
- **Origen del Hallazgo:** `AUDITORIA_FASE_32_EDITOR_VISUAL_PDF_CAMPOS_SUPERPUESTOS.md` / Sección A (1), Sección B (7, 8) y Backlog F32-Task06.
- **Problema Detectado y Riesgos:**
  No se debe forzar a padres o alumnos a manipular un visor PDF complejo en pantallas de teléfonos móviles para rellenar trámites; debe existir un generador automático de formularios web limpios cuyas respuestas se mapeen exactamente a los campos del PDF oficial.
- **Requisitos Funcionales y Técnicos Convergentes:**
  1. *Generación automática de formulario web accesible:*
     - Generar formulario web responsivo a partir de los `overlayFields` y `camposJSON` de la plantilla publicada.
     - Mapeo bidireccional estricto entre el control HTML de captura y las coordenadas del campo en el PDF.
     - Organización en secciones lógicas con títulos e instrucciones de ayuda contextual.
     - Permitir reordenar la presentación de preguntas sin alterar la ubicación física de los campos en el PDF preimpreso.
  2. *Autocompletado con fuentes dinámicas institucionales:*
     - Precargar datos existentes del expediente del alumno: `{{estudiante.nombreCompleto}}`, `{{estudiante.identidad}}`, `{{estudiante.grado}}`, `{{estudiante.seccion}}`, `{{institucion.nombre}}`, `{{institucion.anoLectivo}}`.
     - Diferenciar campos editables por el usuario de campos institucionales bloqueados de solo lectura.
     - Validación en cliente y servidor con guardado de borradores recuperables.
     - Vista previa del PDF resultante antes del envío definitivo.
- **Criterios de Aceptación:**
  - [ ] El formulario web generado permite completar un trámite en móviles de forma limpia y accesible.
  - [ ] Los campos institucionales protegidos no pueden ser alterados por el solicitante.
  - [ ] Las respuestas capturadas se estampan con precisión exacta en las casillas correspondientes del PDF.
  - [ ] La previsualización refleja con exactitud la apariencia del documento final antes de confirmar.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 11381-11411; clave TASK-304; asignación única: Secretaria -->

---

<!-- ID: TASK-304 | Fuentes: Pendientes.md ; pendientes/Secretaria/Pendientes.md -->
### [ ] [TASK-304] [P1] Captura Real de Firmas Manuscritas y Generación de Códigos QR de Verificación
- **Orden de Ejecución:** 7
- **Prioridad:** P1 (Alta)
- **Componentes Afectados:**
  - `js/teacher.js` (`openSignaturePadModal`, `injectSignatureInOverlayField`)
  - `backend/accounting-service/Code.gs`, `backend/user-service/Code.gs`
  - Hoja: `FirmasConformidades`, `DocumentosEscolaresEmitidos`
- **Subcapacidades Relacionadas:** F32-04, F32-08.
- **Origen del Hallazgo:** `AUDITORIA_FASE_32_EDITOR_VISUAL_PDF_CAMPOS_SUPERPUESTOS.md` / Sección B (6, 8) y Backlog F32-Task07.
- **Problema Detectado y Riesgos:**
  El tipo de campo de firma reserva un área visual en el diseñador, pero se requiere un capturador táctil fluido con trazo suavizado en Canvas y la capacidad de estampar la firma y el código QR de verificación CUV como elementos gráficos de alta resolución sin deformaciones.
- **Requisitos Funcionales y Técnicos Convergentes:**
  1. *Captura táctil e incrustación de firma:*
     - Modal de firma manuscrita para mouse, stylus o pantalla táctil con anti-aliasing y botón de borrado/limpieza.
     - Conversión a imagen PNG transparente con conservación de proporciones, adaptándola al área delimitada del PDF.
     - Vinculación formal de la firma con el usuario en sesión, fecha/hora y hash SHA-256 en `FirmasConformidades`.
     - Diferenciar claramente firma manuscrita digitalizada de firma electrónica criptográfica certificada.
  2. *Códigos QR dinámicos para verificación CUV:*
     - Control de código QR posicionable sobre cualquier página del PDF.
     - Generar el QR apuntando a la URL del portal de validación oficial: `https://[dominio]/verify?cuv=CUV-YYYY-XXXXXX`.
     - Resolución nítida garantizada para impresión física y escaneo con smartphone.
     - El portal de verificación muestra el estado del documento, emisor y fecha sin exponer datos PII sensibles.
- **Criterios de Aceptación:**
  - [ ] Permite capturar firmas en dispositivos táctiles con trazo fluido y fondo transparente.
  - [ ] La firma se incorpora al PDF final exactamente en el recuadro asignado sin deformaciones de escala.
  - [ ] El código QR se imprime nítidamente y al escanearse conduce al portal oficial de verificación del CUV.
  - [ ] Un documento o CUV alterado es detectado y rechazado por el validador público.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 11412-11440; clave TASK-305; asignación única: Secretaria -->

---

<!-- ID: TASK-305 | Fuentes: Pendientes.md ; pendientes/Secretaria/Pendientes.md -->
### [ ] [TASK-305] [P1] Autoguardado, Recuperación de Borradores y Control de Concurrencia del Editor
- **Orden de Ejecución:** 8
- **Prioridad:** P1 (Alta)
- **Componentes Afectados:**
  - `js/teacher.js` (`initPdfTemplateAutoSave`, `checkTemplateLockStatus`)
  - `backend/accounting-service/Code.gs`
  - Hoja: `PlantillasEscolares`, `BorradoresPlantillas`
- **Subcapacidades Relacionadas:** F32-09.
- **Origen del Hallazgo:** `AUDITORIA_FASE_32_EDITOR_VISUAL_PDF_CAMPOS_SUPERPUESTOS.md` / Sección B (9) y Backlog F32-Task08.
- **Problema Detectado y Riesgos:**
  Una desconexión transitoria de red o cierre accidental de pestaña durante el diseño de un formulario complejo puede ocasionar la pérdida total de horas de trabajo de posicionamiento. Asimismo, la edición simultánea por dos operadores puede provocar sobrescrituras accidentales.
- **Requisitos Funcionales y Técnicos Convergentes:**
  1. *Autoguardado periódico y recuperación de sesión:*
     - Guardado automático local en IndexedDB/LocalStorage cada 30 segundos y tras cambios estructurales.
     - Al reabrir el editor, detectar borradores no sincronizados y ofrecer restaurarlos con un solo clic.
     - Indicador visual del estado de guardado en la barra superior: `Guardando...`, `Guardado`, `Cambios pendientes` o `Error de conexión`.
  2. *Control de concurrencia y prevención de sobrescrituras:*
     - Bloqueo optimista registrando el usuario que está editando la plantilla y su marca de tiempo.
     - Advertir al segundo usuario si la plantilla está siendo editada en otra sesión y permitir abrir en modo solo lectura.
     - Separación estricta entre borradores de trabajo y versiones oficiales publicadas.
- **Criterios de Aceptación:**
  - [ ] El diseño de campos se recupera íntegro tras una desconexión intencional o recarga forzada de la pestaña.
  - [ ] El estado del guardado se comunica en tiempo real de forma clara en la interfaz.
  - [ ] Se detectan ediciones simultáneas y se impide la sobrescritura silenciosa de plantillas.
  - [ ] La recuperación de un borrador no afecta las versiones publicadas activas.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 11469-11499; clave TASK-307; asignación única: Secretaria -->

---

<!-- ID: TASK-307 | Fuentes: Pendientes.md ; pendientes/Secretaria/Pendientes.md -->
### [ ] [TASK-307] [P1] Motor Unificado de Reglas de Validación y Restricciones de Formularios
- **Orden de Ejecución:** 10
- **Prioridad:** P1 (Alta)
- **Componentes Afectados:**
  - `backend/accounting-service/Code.gs` (`validateTemplateFieldRules`, `validateDocumentEmissionPayload`)
  - `backend/user-service/Code.gs`
  - Hoja: `PlantillasEscolares`, `FormulariosInstitucionales`
- **Subcapacidades Relacionadas:** F32-07, F32-08.
- **Origen del Hallazgo:** `AUDITORIA_FASE_32_EDITOR_VISUAL_PDF_CAMPOS_SUPERPUESTOS.md` / Sección B (7) y Backlog F32-Task13.
- **Problema Detectado y Riesgos:**
  Existe riesgo de que el editor visual, el formulario web de captura y el generador final de PDF manejen reglas de validación discrepantes, permitiendo que datos inválidos o incompletos burlen las comprobaciones si una petición se envía directamente al backend.
- **Requisitos Funcionales y Técnicos Convergentes:**
  1. *Reglas de validación unificadas por campo:*
     - Obligatoriedad (requerido/opcional), longitud mínima y máxima de texto.
     - Límites numéricos (mínimo, máximo, cantidad fija de decimales).
     - Máscaras de entrada y patrones regex para DNI/identidad, teléfonos y correos.
     - Restricciones de fechas (ej. fecha de fin posterior a fecha de inicio, prohibir fechas futuras).
     - Cantidad mínima y máxima de selecciones en casillas y listas.
  2. *Validación cruzada institucional y de backend:*
     - Validar que códigos de matrícula o IDs de estudiantes existan legítimamente en el sistema institucional.
     - Las mismas reglas configuradas en la plantilla se aplican en: editor, formulario web de captura, guardado de borradores y generación definitiva del PDF.
     - El backend valida obligatoriamente la carga útil antes de permitir la emisión oficial con CUV.
     - Mensajes de error contextuales que señalan con precisión el campo defectuoso y cómo corregirlo, conservando los datos válidos previamente ingresados.
- **Criterios de Aceptación:**
  - [ ] Se impide la emisión de cualquier documento si existen campos obligatorios vacíos o formatos inválidos.
  - [ ] Las solicitudes directas a la API que contengan datos no conformes son rechazadas por el backend.
  - [ ] Los mensajes de error identifican claramente el campo con problemas y no borran los datos válidos.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 11541-11573; clave TASK-310; asignación única: Secretaria -->

---

<!-- ID: TASK-310 | Fuentes: Pendientes.md ; pendientes/Secretaria/Pendientes.md -->
### [ ] [TASK-310] [P1] Consola Unificada de Gestión de Trámites y Bandejas Operativas por SLA
- **Orden de Ejecución:** 5
- **Prioridad:** P1 (Alta)
- **Componentes Afectados:**
  - `dashboards/dashboard-secretaria.html`, `dashboards/dashboard-direccion.html`
  - `backend/user-service/Code.gs` (`getDepartmentalRequestsQueue`, `updateRequestOperationalPriority`)
  - Hoja: `SolicitudesTramites`
- **Subcapacidades Relacionadas:** F33-16.
- **Origen del Hallazgo:** `AUDITORIA_FASE_33_FORMULARIOS_INSTITUCIONALES_TRAMITES_DIGITALES.md` / Sección C (F33-16) y Plan de Implementación F33-Task04.
- **Problema Detectado y Riesgos:**
  La plataforma permite consultar solicitudes con filtros básicos, pero carece de una consola administrativa integral para gestionar el volumen operativo desde Secretaría y Dirección. La falta de semáforos de vencimiento, prioridades y carga de trabajo dificulta priorizar solicitudes urgentes.
- **Requisitos Funcionales y Técnicos Convergentes:**
  1. *Bandeja operativa centralizada por vistas de estado:*
     - Segmentación: `Recibidas_Sin_Clasificar`, `Pendientes_Asignacion`, `Asignadas_A_Mi`, `En_Revision`, `Observadas_Esperando_Familia`, `Pendientes_Firma`, `Vencidas`, `Aprobadas` y `Archivadas`.
     - Filtros combinables: tipo de trámite, departamento, estado, prioridad, responsable, estudiante, grado/sección y rango de fechas.
     - Búsqueda instantánea por identificador (`SOL-FRM-...`), DNI del estudiante o nombre del apoderado.
  2. *Semáforos de SLA y control de tiempos hábiles:*
     - Indicadores visuales de cumplimiento: Verde (`En plazo`), Amarillo (`Próximo a vencer < 4h`), Rojo (`Vencido`).
     - Cálculo de plazos en horas o días hábiles conforme al calendario institucional (excluyendo fines de semana y feriados).
     - Suspensión del cómputo de SLA mientras el trámite esté en espera de información por parte del solicitante (`Requiere_Informacion`), reanudándose al recibir la corrección.
  3. *Acciones masivas y optimización de rendimiento:*
     - Acciones masivas controladas para asignar responsables, clasificar o cambiar prioridad.
     - Paginación y carga progresiva en servidor para manejar miles de solicitudes sin degradación en el navegador.
     - Métricas de carga de trabajo por funcionario y departamento para balanceo operativo.
- **Criterios de Aceptación:**
  - [ ] Secretaría y Dirección pueden filtrar, buscar y gestionar solicitudes en una consola unificada.
  - [ ] Los vencimientos por SLA se calculan con precisión respetando días hábiles y suspensiones justificadas.
  - [ ] Las solicitudes vencidas se destacan con alertas visuales y permiten reasignación inmediata.
  - [ ] Las acciones masivas se aplican exclusivamente a los registros seleccionados sin afectar expedientes ajenos.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 11634-11661; clave TASK-313; asignación única: Secretaria -->

---

<!-- ID: TASK-313 | Fuentes: Pendientes.md ; pendientes/Secretaria/Pendientes.md -->
### [ ] [TASK-313] [P1] Fortalecimiento de la Trazabilidad Documental, Integridad Criptográfica y Ciclo de Vida de Firmas
- **Orden de Ejecución:** 8
- **Prioridad:** P1 (Alta)
- **Componentes Afectados:**
  - `backend/user-service/Code.gs` (`registerDocumentSignature`, `verifyDocumentSignatureIntegrity`, `getCompleteRequestDossierAuditTrail`)
  - `backend/accounting-service/Code.gs`
  - Hoja: `SolicitudesTramites`, `RevisionesDecisionesTramite`, `FirmasConformidades`, `DocumentosEscolaresEmitidos`
- **Subcapacidades Relacionadas:** F33-12, F33-14.
- **Origen del Hallazgo:** `AUDITORIA_FASE_33_FORMULARIOS_INSTITUCIONALES_TRAMITES_DIGITALES.md` / Sección C (F33-12, F33-14) y Plan de Implementación F33-Task07.
- **Problema Detectado y Riesgos:**
  Se requiere consolidar la relación indisoluble entre la solicitud original, sus evidencias adjuntas, las subsanaciones intermedias, las firmas electrónicas registradas y el documento final PDF emitido con CUV, certificando que el archivo final no haya sufrido alteraciones posteriores.
- **Requisitos Funcionales y Técnicos Convergentes:**
  1. *Integridad criptográfica mediante Hash SHA-256:*
     - Calcular el hash SHA-256 sobre los bytes exactos del documento final PDF firmado y registrarlo en `FirmasConformidades`.
     - Comprobación de integridad: al consultar o descargar el documento, recalcular el hash; si difiere, alertar sobre alteración documental.
     - Vincular cada firma a la versión exacta del documento; si el trámite sufre correcciones posteriores, la firma anterior no convalida la nueva versión.
  2. *Expediente documental institucional unificado (Legajo Digital):*
     - Ficha consolidada que integra: solicitud original, versiones de subsanación, evidencias adjuntas, historial de decisiones de revisores con marcas de tiempo, firmas registradas y PDF emitido con su CUV y correlativo anual.
     - Consulta pública del CUV que certifique autenticidad sin revelar datos confidenciales protegidos.
- **Criterios de Aceptación:**
  - [ ] El hash SHA-256 coincide exactamente con el archivo almacenado en Drive.
  - [ ] Cualquier alteración manual del archivo PDF firmado es detectada por el verificador de integridad.
  - [ ] Una firma registrada no puede reutilizarse en otra versión o trámite distinto.
  - [ ] El expediente unificado permite auditar el ciclo de vida completo de principio a fin.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 11710-11748; clave TASK-315; asignación única: Secretaria -->

---

<!-- ID: TASK-315 | Fuentes: Pendientes.md ; pendientes/Secretaria/Pendientes.md -->
### [ ] [TASK-315] [P1] Observaciones granulares y subsanación por campo o documento
- **Prioridad:** P1 (Alta)
- **Orden de Ejecución:** 6 (Subsanación quirúrgica sin reproceso global)
- **Componentes Afectados:**
  - `backend/user-service/Code.gs` (`processWorkflowDecision`, `submitFormCorrection`, `getWorkflowHistory`)
  - `js/student.js`, `js/teacher.js`
  - Hoja de Cálculo: `ObservacionesSubsanacionTramite`, `RevisionesDecisionesTramite`
- **Subcapacidades Relacionadas:** F34-05, F34-07, F34-10.
- **Origen del Hallazgo:** `AUDITORIA_FASE_34_BANDEJAS_REVISION_FIRMAS.md` / Sección C (F34-05) y Especificación Técnica ChatGPT/Jules.
- **Problema Detectado y Riesgos:**
  El motor de decisiones actual permite registrar observaciones públicas e internas, pero no ofrece un mecanismo para marcar un campo, dato o archivo específico como observado. Esto obliga a los funcionarios a devolver o rechazar la solicitud completa, forzando a las familias a llenar de nuevo todo el formulario o volver a subir documentos que ya estaban correctos, generando fricción y retrasos operativos.
- **Requerimientos Funcionales y Técnicos Convergentes:**
  1. *Marcado quirúrgico de observaciones:*
     - Permitir vincular una observación a un elemento concreto del expediente:
       * Un campo específico del formulario dinámico.
       * Un archivo adjunto o evidencia particular (ej. fotografía ilegible de carnet).
       * Una fecha o período determinado.
       * La solicitud completa en casos generales.
     - Registrar para cada elemento observado: campo afectado, motivo de la observación, fecha límite de subsanación y si es subsanable o definitivo.
  2. *Bloqueo de campos validados y subsanación focalizada:*
     - Al entrar en estado `Requiere Corrección`, bloquear contra edición los campos y archivos que ya fueron validados y aceptados por el revisor, permitiendo al solicitante editar únicamente los elementos explícitamente observados.
     - Conservar las respuestas originales y generar una nueva versión vinculada para las correcciones aportadas.
     - Permitir al solicitante responder puntualmente a cada observación con comentarios o nuevas evidencias.
     - Mantener la estricta distinción entre notas internas administrativas y requerimientos públicos al solicitante.
     - Determinar automáticamente cuándo se han solventado todas las observaciones obligatorias para reanudar el trámite hacia la siguiente fase de aprobación.
  3. *Parametrización configurable en plataforma:*
     - Parámetro en `ConfiguracionInstitucional`: `MODO_SUBSANACION_CAMPOS`: Valores `QUIRURGICO_CONGELAR_VALIDADOS` (por defecto) vs. `REAPERTURA_TOTAL_FORMULARIO` (permite editar cualquier campo durante la corrección).
- **Criterios de Aceptación:**
  - [ ] Marcar un archivo adjunto específico como observado y verificar que los demás documentos del trámite permanecen validados.
  - [ ] Solicitar la corrección de un campo específico y comprobar que el solicitante ve resaltado exactamente qué debe corregir.
  - [ ] Comprobar que los campos aceptados quedan bloqueados contra modificación si la política así lo establece.
  - [ ] Aportar una nueva evidencia subsanada y verificar que se genera una nueva versión sin destruir el archivo inicial.
  - [ ] Confirmar que las observaciones internas no se exponen al remitente en su consola de subsanación.
  - [ ] Resolver una observación y verificar que el estado del trámite avanza solo cuando todas las correcciones obligatorias han sido aprobadas.
- **Dependencias:** F34-Task04 (integridad criptográfica), F34-Task05, motor de decisiones y formularios.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 11749-11791; clave TASK-316; asignación única: Secretaria -->

---

<!-- ID: TASK-316 | Fuentes: AUDITORIAS/AUDITORIA_COMPLETADAS_T-UX-16.md ; Pendientes.md ; pendientes/Secretaria/Pendientes.md -->
### [ ] [TASK-316] [P1] Notificaciones multicanal reactivas, preferencias y agrupación de avisos
- **Hallazgo de origen:** AUD-NG-206 (ALTO/P1); coordinación con AUD-NG-203.
- **Severidad:** Alta. **Objetivo:** evitar notificaciones duplicadas ante concurrencia y reintentos, con clave persistida y verificable.
- **Acción ejecutable:** incorporar clave de deduplicación estable a `createUserNotification` y productores multicanal; reservar la clave de forma atómica antes de insertar; proteger la operación con mecanismo de concurrencia apropiado; hacer idempotentes los reintentos y registrar el resultado de cada canal.
- **Archivos/módulos:** `backend/user-service/Code.gs`; `createUserNotification`; `sendMultiChannelNotification`; `BandejaNotificaciones`; coordinación con TASK-045.
- **Dependencias/riesgos:** TASK-227; TASK-045; esquema canónico de notificaciones. Riesgo de carrera entre lectura y append, claves no estables y divergencia entre canales.
- **Alcance:** deduplicación persistente y segura para productores; no asumir que una consulta previa seguida de append evita duplicados.
- **Criterios de aceptación:** dos solicitudes concurrentes con la misma clave producen un único registro lógico; reintento devuelve el resultado previo sin duplicar; claves distintas permiten eventos distintos; productor y lector comparten esquema; pruebas de concurrencia, timeout y reintento multicanal.
- **Prioridad:** P1. **Estado:** Pendiente de ejecución/revalidación.
- **Evidencia de cierre:** pendiente; el informe encontró lectura seguida de append sin reserva atómica y ausencia de clave equivalente en `createUserNotification`.
- **Prioridad:** P1 (Alta)
- **Orden de Ejecución:** 7 (Comunicación oportuna y mitigación de fatiga de avisos)
- **Componentes Afectados:**
  - `backend/user-service/Code.gs` (`sendMultiChannelNotification`, `dispatchWorkflowNotification`, `retryFailedNotificationsQueue`)
  - Hoja de Cálculo: `RegistroNotificaciones`, `PreferenciasNotificaciones`
- **Subcapacidades Relacionadas:** F34-06, F34-08.
- **Origen del Hallazgo:** `AUDITORIA_FASE_34_BANDEJAS_REVISION_FIRMAS.md` / Sección C (F34-08), Matriz CAR-F34-08 y Especificación Técnica ChatGPT/Jules.
- **Problema Detectado y Riesgos:**
  La integración actual genera notificaciones básicas al presentar una solicitud, pero no comunica de manera automática y reactiva los cambios de estado posteriores (`Requiere Corrección`, `Aprobada`, `Rechazada`). Además, no existe una estrategia para agrupar avisos menores, arriesgando fatiga por saturación de mensajes que induce a los usuarios a ignorar avisos críticos o citaciones institucionales.
- **Requerimientos Funcionales y Técnicos Convergentes:**
  1. *Despacho reactivo multicanal por eventos de ciclo de vida:*
     - Disparar avisos automáticos vinculados a los acontecimientos clave del documento:
       * Solicitud recibida formalmente.
       * Trámite asignado o reasignado a un responsable.
       * Solicitud observada / Subsanación requerida (indicando plazo e instrucciones).
       * Evidencia complementaria solicitada.
       * Solicitud aprobada o rechazada (con observaciones públicas).
       * Documento firmado oficialmente.
       * Despacho y entrega confirmada.
     - Determinar destinatarios según el rol y su vinculación legal contextual.
     - Enlaces directos seguros que validen credenciales y permisos al abrir el documento.
     - Protección estricta: Jamás incluir notas administrativas internas ni datos confidenciales en el texto de correos o mensajes WhatsApp.
  2. *Agrupación de avisos y preferencias de usuario:*
     - Diferenciar avisos urgentes/críticos (despacho inmediato e individual) de notificaciones informativas de baja prioridad.
     - Implementar mecanismo de digest o resumen consolidado para eventos informativos no urgentes para evitar saturación de bandejas.
     - Registrar el estado de cada notificación: `Generada`, `Pendiente de Envío`, `Enviada`, `Entregada`, `Fallida`.
     - Reintentos controlados con retroceso exponencial sin duplicar envíos exitosos.
  3. *Parametrización configurable en plataforma:*
     - Configuración institucional en `ConfiguracionInstitucional`: `CANALES_NOTIFICACION_TRAMITES`: Lista configurable (`EMAIL`, `SMS`, `WHATSAPP`, `PUSH_INTERNA`) y `FRECUENCIA_RESUMEN_INFORMATIVO` (`INMEDIATO`, `DIARIO_18HRS`).
- **Criterios de Aceptación:**
  - [ ] Cambiar una solicitud a `Requiere Corrección` y verificar que el solicitante recibe la notificación externa con las instrucciones públicas.
  - [ ] Aprobar o rechazar un trámite y verificar el despacho del aviso con el resultado oficial.
  - [ ] Comprobar que las notas internas y comentarios privados jamás se transmiten en mensajes externos.
  - [ ] Verificar que los docentes reciben únicamente notificaciones de justificaciones de sus propios alumnos.
  - [ ] Reintentar un envío fallido y verificar que no se duplica la notificación al destinatario.
  - [ ] Comprobar que la agrupación de avisos informativos no retrasa las alertas críticas o citaciones urgentes.
  - [ ] Abrir el enlace de notificación con un usuario no autorizado y comprobar que el acceso es denegado.
- **Dependencias:** F34-Task02 (bandeja de salida), F34-Task05 (asignaciones), centro de notificaciones multicanal.

- **Ampliación C1.57 / T-UX-16 (2026-11-06):**
  - Reconciliar BandejaNotificaciones: cabecera inicial y createUserNotification usan 9 columnas; sendMultiChannelNotification agrega 12 con orden distinto; retryFailedNotificationsQueue lee columnas 10/11 y no interpreta de forma fiable filas antiguas.
  - getNotificationPreferences (backend/user-service/Code.gs:4973-4988) devuelve valores fijos y no consulta ni persiste preferencias por usuario. La hoja creada se denomina PreferenciasNotificacion (singular), mientras esta tarea menciona PreferenciasNotificaciones (plural); definir nombre canónico.
  - La deduplicación actual es lectura seguida de escritura sin reserva atómica y no cubre createUserNotification. La cola debe controlar intentos, backoff, estado final y concurrencia conservando ID/clave de evento.
  - **Criterios adicionales:** migración de filas de 9/12 columnas; preferencias leídas/guardadas por identidad autenticada; reintentos acotados sin reenviar entregados; deduplicación concurrente; estado de entrega separado de leído/no leído.

- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 11831-11869; clave TASK-318; asignación única: Secretaria -->

---

<!-- ID: TASK-318 | Fuentes: AUDITORIAS/AUDITORIA_COMPLETADAS_T-UX-16.md ; Pendientes.md ; pendientes/Secretaria/Pendientes.md -->
### [ ] [TASK-318] [P1] Bandeja personal unificada, indicadores de atención y control de SLA
- **Hallazgo de origen:** AUD-NG-205 (ALTO/P1); parte de AUD-NG-204 (CRÍTICO/P0).
- **Severidad:** Alta. **Objetivo:** entregar una vista unificada real, contextual y autorizada, no solo un helper que transforma un array ya recibido.
- **Acción ejecutable:** implementar agregador personal backend con contrato estable para notificaciones, tareas y aprobaciones; mapear `notificacionId`, `fechaRegistro`, `enlaceAccion` y los campos reales de cada fuente al modelo canónico; preservar origen, contexto, entidad, vencimiento y acción requerida; conectar consumidores frontend y sincronizar leído/no leído con persistencia y contador.
- **Archivos/módulos:** `backend/user-service/Code.gs`; `getUserWorkInbox` (a implementar); `getUnifiedNotifications`; `js/ui-common.js`; `js/api.js`; paneles Student, Teacher, Secretary, Accounting y Dirección.
- **Dependencias/riesgos:** TASK-221 y TASK-227; integración con fuentes de workflow; riesgo de destino genérico, IDs aleatorios, fecha actual sustitutiva y acciones sin contexto.
- **Alcance:** agregación e integración de la bandeja por usuario/rol; no duplicar motores de aprobación ni productores de notificaciones.
- **Criterios de aceptación:** cada elemento conserva tipo, origen, fecha, contexto, registro relacionado, vencimiento y acción; helper recibe datos de fuentes reales; paneles consumen el contrato; marcar leído persiste y actualiza contador; roles ven solo elementos autorizados; pruebas por rol, fuente, navegación y estados.
- **Prioridad:** P1. **Estado:** Pendiente de ejecución/revalidación.
- **Evidencia de cierre:** pendiente; el helper actual no consulta fuentes, usa nombres de propiedades incompatibles y no se localizaron consumidores conectados.
- **Prioridad:** P1 (Alta)
- **Orden de Ejecución:** 9 (Eficiencia operativa y seguimiento de vencimientos)
- **Componentes Afectados:**
  - `backend/user-service/Code.gs` (`getUserWorkInbox`, `calculateRequestSlaMetrics`, `getDepartmentalWorkInbox`)
  - `js/student.js`, `js/teacher.js`, `js/accounting.js`
  - Hoja de Cálculo: `ConfiguracionSLA`, `SolicitudesTramites`
- **Subcapacidades Relacionadas:** F34-01, F34-03, F34-04.
- **Origen del Hallazgo:** `AUDITORIA_FASE_34_BANDEJAS_REVISION_FIRMAS.md` / Sección C (F34-01), Matriz CAR-F34-01 y Especificación Técnica ChatGPT/Jules.
- **Problema Detectado y Riesgos:**
  Existe una bandeja departamental mediante `getDepartmentalWorkInbox`, pero no una vista personal unificada que consolide todos los documentos asignados nominalmente a un usuario independientemente del departamento de procedencia. Tampoco existen indicadores para detectar solicitudes próximas a vencer o atrasadas respecto a los tiempos máximos de respuesta (SLA), generando cuellos de botella no detectados.
- **Requerimientos Funcionales y Técnicos Convergentes:**
  1. *Bandeja personal unificada:*
     - Implementar `getUserWorkInbox(payload)` que reúna todas las tareas y solicitudes asignadas directamente a la persona (`userId`), segregando:
       * Tareas asignadas nominalmente al usuario como responsable principal.
       * Solicitudes asignadas al departamento (pendientes de toma de responsabilidad).
       * Trámites en los que participa como revisor colegiado.
       * Documentos donde solo debe registrar toma de conocimiento.
       * Historial de solicitudes que ya atendió.
  2. *Motor de cálculo de SLA y tiempos de atención:*
     - Auto-crear la hoja `ConfiguracionSLA` (`TipoTramite`, `Departamento`, `Prioridad`, `PlazoMaximoHoras`, `HorasAlertaVencimiento`).
     - Calcular en tiempo real: tiempo transcurrido desde la recepción, tiempo desde la última asignación, tiempo restante antes de vencer el SLA y tiempo de retraso.
     - Categorizar visualmente: `En Plazo`, `Próximo a Vencer` (alerta ámbar), `Vencido` (alerta roja), `Suspendido por Causa Justificada` y `Resuelto`.
     - Permitir suspender justificadamente el cómputo de SLA cuando el trámite esté en espera de información externa requerida al solicitante.
     - Indicadores agregados para Dirección que identifiquen acumulación de solicitudes por departamento o funcionario.
  3. *Parametrización configurable en plataforma:*
     - Parámetro en `ConfiguracionInstitucional`: `CONSIDERAR_DIAS_HABILES_EN_SLA`: Valores `DIAS_HABILES_EXCLUIR_FINES_Y_FERIADOS` vs. `DIAS_CALENDARIO_CORRIDOS`.
- **Criterios de Aceptación:**
  - [ ] Un funcionario consulta en su bandeja personal todos los documentos asignados a su persona provenientes de distintos departamentos.
  - [ ] Los documentos departamentales no asignados nominalmente se distinguen claramente de las tareas personales.
  - [ ] El tiempo restante de atención se calcula con exactitud según la prioridad y el SLA configurado.
  - [ ] Las solicitudes vencidas se identifican con alerta visual destacada y notifican al supervisor si aplica escalamiento.
  - [ ] Suspender una solicitud por requerimiento de subsanación detiene correctamente el cómputo del SLA.
  - [ ] La Dirección puede consultar métricas consolidadas de tiempos de respuesta por departamento.
- **Dependencias:** F34-Task05 (asignaciones estructuradas), sistema de notificaciones y permisos.

- **Ampliación C1.57 / T-UX-16 (2026-11-06):**
  - **AUD-NG-204 (CRÍTICO/P0):** getDepartmentalWorkInbox (backend/user-service/Code.gs:3916-3939) recibe departamento/authRole del payload; si departamento normalizado es direccion o administrador incluye todas las filas. RBAC acredita permiso de acción, pero no restringe registros a la unidad efectiva del usuario.
  - getUserWorkInbox, declarado como componente de esta tarea, no existe en la versión inspeccionada de backend/user-service/Code.gs. TASK-221 debe consolidar tareas y aprobaciones; TASK-318 debe aportar asignaciones personales, solicitudes departamentales pendientes de toma, historial y métricas SLA.
  - **Criterios adicionales:** cambiar el departamento del payload no amplía resultados; identidad/departamento se derivan de sesión y asignación vigente; las tareas personales y departamentales se distinguen; la bandeja unificada consume solo fuentes autorizadas.

- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 12351-12377; clave TASK-334; asignación única: Secretaria -->

---

<!-- ID: TASK-334 | Fuentes: Pendientes.md ; pendientes/Secretaria/Pendientes.md -->
### [ ] [TASK-334] [P1] Guía especializada para emisión y gestión de documentos oficiales con CUV
- **Prioridad:** P1 (Alta / Importante)
- **Orden de Ejecución:** 10 (Orientación en emisión documental y validez jurídica)
- **Componentes Afectados:**
  - `backend/user-service/Code.gs` (`getHelpGuidesCatalog`)
  - `js/ui-common.js`, `js/teacher.js`
  - Dashboard: `teacher-dashboard.html`, `dashboard-direccion.html`
- **Subcapacidades Relacionadas:** F38-12, F38-14.
- **Origen del Hallazgo:** `AUDITORIA_FASE_38_AYUDA_CONTEXTUAL_METADATOS_APRENDIZAJE.md` / Sección C (F38-12), Matriz CAR-F38-12 y Especificación Técnica ChatGPT/Jules.
- **Problema Detectado y Riesgos:**
  La emisión de constancias, certificados y reportes oficiales con Código Único de Verificación (CUV) genera documentos legales con validez pública. Si el usuario no comprende los requisitos previos o intenta modificar un documento ya emitido, se generan inconsistencias documentales y riesgos de anulación.
- **Requerimientos Funcionales y Técnicos Convergentes:**
  1. *Estructura secuencial de la guía (`GUIDE-DOCUMENT-CUV`):*
     - *Paso 1: Preparación:* Selección de plantilla oficial, datos del estudiante, período y validación de solvencia o requisitos académicos.
     - *Paso 2: Previsualización:* Revisión del borrador en pantalla antes del estampado definitivo.
     - *Paso 3: Emisión Oficial con CUV:* Explicar qué representa el CUV, la generación del correlativo anual y la inmutabilidad del registro en `DocumentosEscolaresEmitidos`.
     - *Paso 4: Verificación Pública y Descarga:* Explicar cómo terceros pueden consultar la autenticidad del documento mediante el portal de verificación CUV con código QR o identificador.
     - *Paso 5: Correcciones y Reemisiones:* Aclarar que un documento oficial emitido no se edita directamente; se debe anular con motivo registrado y emitir un nuevo correlativo.
- **Criterios de Aceptación:**
  - [ ] La guía acompaña el proceso de emisión documental explicando las condiciones indispensables para emitir.
  - [ ] Se advierte claramente sobre la inmutabilidad del CUV y el procedimiento de reemisión.
  - [ ] Solo los roles autorizados (Secretaría, Dirección) tienen acceso a visualizar esta guía.
- **Dependencias:** F38-Task02, F38-Task06.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 12378-12407; clave TASK-335; asignación única: Secretaria -->

---

<!-- ID: TASK-335 | Fuentes: Pendientes.md ; pendientes/Secretaria/Pendientes.md -->
### [ ] [TASK-335] [P1] Implementación de procesamiento OCR para documentos escaneados
- **Prioridad:** P1 (Alta / Importante)
- **Orden de Ejecución:** 8 (Extracción de texto e indexación en imágenes/PDF raster)
- **Componentes Afectados:**
  - `backend/academic-service/Code.gs` (`processDocumentOCR`, `extractDocumentMetadataFromOCR`)
  - `js/teacher.js`, `js/ui-common.js`
- **Subcapacidades Relacionadas:** 4.1.
- **Origen del Hallazgo:** `AUDITORIA_FASE_39_DIGITALIZACION_TRANSICION.md` / Sección 4 (4.1), Matriz CAR-F39-13 y Especificación Técnica ChatGPT/Jules.
- **Problema Detectado y Riesgos:**
  Los documentos PDF escaneados e imágenes de actas históricas no contienen texto seleccionable, impidiendo la búsqueda por contenido, la indexación documental y la extracción automática de datos hacia los expedientes.
- **Requerimientos Funcionales y Técnicos Convergentes:**
  1. *Detección y servicio OCR en español:*
     - Identificar automáticamente PDFs escaneados y páginas con imágenes rasterizadas que requieran OCR.
     - Implementar servicio de reconocimiento óptico de caracteres para español que procese múltiples páginas, detecte bloques de texto, párrafos y tablas.
     - Mantener la relación biunívoca entre el texto extraído y su página de origen, aplicando correcciones de orientación y rotación.
  2. *Extracción de campos y revisión humana:*
     - Detectar entidades clave: nombres, identidades, fechas, números de acta y notas.
     - Mostrar el texto extraído junto a la imagen original resaltando niveles de confianza (baja confianza en ámbar).
     - No convertir datos de OCR en registros oficiales sin validación humana.
     - Indexar el texto reconocido para habilitar búsquedas documentales por contenido respetando permisos.
- **Criterios de Aceptación:**
  - [ ] Procesa PDFs escaneados reconociendo texto impreso en español sin alterar la imagen original.
  - [ ] Muestra el texto extraído en paralelo al documento original permitiendo correcciones manuales.
  - [ ] La información extraída por OCR no genera registros oficiales sin validación y aprobación humana.
  - [ ] El texto reconocido queda indexado permitiendo localizar el documento mediante búsquedas por contenido.
- **Dependencias:** F39-Task03, F39-Task05, F39-Task07.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 12408-12437; clave TASK-336; asignación única: Secretaria -->

---

<!-- ID: TASK-336 | Fuentes: Pendientes.md ; pendientes/Secretaria/Pendientes.md -->
### [ ] [TASK-336] [P1] Implementación de conversión estructural de documentos Word a plantillas institucionales
- **Prioridad:** P1 (Alta / Importante)
- **Orden de Ejecución:** 9 (Conversión de formatos DOCX a plantillas reutilizables)
- **Componentes Afectados:**
  - `backend/accounting-service/Code.gs` (`convertWordDocumentToTemplate`, `configureSchoolDocumentTemplate`)
  - `js/teacher.js`, `teacher-dashboard.html`
  - Hoja de Cálculo: `PlantillasEscolares`
- **Subcapacidades Relacionadas:** 3.7.
- **Origen del Hallazgo:** `AUDITORIA_FASE_39_DIGITALIZACION_TRANSICION.md` / Sección C (3.7) y Especificación Técnica ChatGPT/Jules.
- **Problema Detectado y Riesgos:**
  La plataforma dispone de un editor visual para PDFs, pero no puede procesar documentos Word (.docx) tradicionales para extraer su estructura de tablas y campos variables, obligando al personal a rediseñar formatos desde cero.
- **Requerimientos Funcionales y Técnicos Convergentes:**
  1. *Análisis estructural de archivos DOCX:*
     - Analizar la estructura interna de archivos Word: párrafos, tablas, celdas, bordes, encabezados, controles de contenido e imágenes incrustadas.
     - Detectar posibles campos variables (nombre del estudiante, identidad, grado, fecha, firma) diferenciándolos del texto fijo.
  2. *Conversión asistida a plantilla CUV:*
     - Presentar vista previa de la estructura identificada con los campos detectados.
     - Permitir al usuario confirmar campos, ajustar etiquetas, definir tipos de datos y obligatoriedad.
     - Generar plantillas compatibles con el emisor institucional de documentos con Código Único de Verificación (CUV).
     - Conservar el archivo DOCX original intacto en la carpeta de custodia.
- **Criterios de Aceptación:**
  - [ ] Importar un archivo DOCX identificando tablas y campos variables de formulario.
  - [ ] Permite ajustar y corregir manualmente los campos propuestos antes de generar la plantilla.
  - [ ] Genera una plantilla funcional utilizable para emitir documentos con código CUV.
  - [ ] El documento Word original permanece inalterado en almacenamiento.
- **Dependencias:** F39-Task03, F39-Task05, F39-Task10.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 12438-12465; clave TASK-337; asignación única: Secretaria -->

---

<!-- ID: TASK-337 | Fuentes: Pendientes.md ; pendientes/Secretaria/Pendientes.md -->
### [ ] [TASK-337] [P1] Optimización del catálogo institucional de documentos, plantillas y formatos oficiales
- **Prioridad:** P1 (Alta / Importante)
- **Orden de Ejecución:** 10 (Gobernanza del catálogo de plantillas y control de vigencias)
- **Componentes Afectados:**
  - `backend/accounting-service/Code.gs` (`configureSchoolDocumentTemplate`, `getSchoolDocumentTemplates`, `deprecateDocumentTemplate`)
  - Hoja de Cálculo: `PlantillasEscolares`, `DocumentosEscolaresEmitidos`
- **Subcapacidades Relacionadas:** 3.9.
- **Origen del Hallazgo:** `AUDITORIA_FASE_39_DIGITALIZACION_TRANSICION.md` / Sección C (3.9) y Especificación Técnica ChatGPT/Jules.
- **Problema Detectado y Riesgos:**
  El catálogo `PlantillasEscolares` está operativo, pero carece de un control estricto de vigencias temporales, estados de aprobación formal y trazabilidad de plantillas sustituidas, arriesgando que formatos vencidos o no autorizados se utilicen para emitir certificados oficiales.
- **Requerimientos Funcionales y Técnicos Convergentes:**
  1. *Organización y control de versiones y vigencias:*
     - Organizar formatos por departamento, área, tipo documental, vigencia y nivel de acceso.
     - Ciclo de vida con estados: `Borrador`, `En_Revision`, `Aprobada`, `Publicada`, `Suspendida`, `Vencida`, `Archivada`.
     - Establecer fechas de entrada en vigor y fechas de vencimiento; impedir la emisión automática con plantillas vencidas o suspendidas.
     - Conservar la relación histórica entre los documentos emitidos y la versión exacta de plantilla utilizada al momento de la emisión.
  2. *Flujo de aprobación:*
     - Exigir aprobación formal de revisores asignados por departamento antes de publicar una plantilla como formato oficial.
- **Criterios de Aceptación:**
  - [ ] Permite crear nuevas versiones de plantillas manteniendo las versiones anteriores como históricas.
  - [ ] Bloquea la emisión de documentos utilizando plantillas vencidas o no aprobadas.
  - [ ] Todo documento emitido permite consultar la versión exacta de plantilla con la que fue generado.
  - [ ] La verificación de documentos previamente emitidos mediante CUV permanece inalterada.
- **Dependencias:** F39-Task09, componentes existentes de emisión CUV.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 12466-12493; clave TASK-338; asignación única: Secretaria -->

---

<!-- ID: TASK-338 | Fuentes: Pendientes.md ; pendientes/Secretaria/Pendientes.md -->
### [ ] [TASK-338] [P1] Implementación del asistente inteligente para generar formularios desde documentos existentes
- **Prioridad:** P1 (Alta / Importante)
- **Orden de Ejecución:** 11 (Generación guiada de formularios digitales)
- **Componentes Afectados:**
  - `backend/user-service/Code.gs` (`proposeDigitalFormFromDocument`, `saveInstitutionalForm`)
  - `teacher-dashboard.html`, `js/teacher.js`
  - Hoja de Cálculo: `FormulariosInstitucionales`
- **Subcapacidades Relacionadas:** 3.8.
- **Origen del Hallazgo:** `AUDITORIA_FASE_39_DIGITALIZACION_TRANSICION.md` / Sección C (3.8) y Matriz CAR-F39-08.
- **Problema Detectado y Riesgos:**
  Los formularios institucionales dinámicos se definen manualmente mediante complejas estructuras JSON. No existe un asistente que analice formatos tradicionales (PDF, Word, imágenes) y proponga formularios web interactivos, ralentizando la transición digital de trámites escolares.
- **Requerimientos Funcionales y Técnicos Convergentes:**
  1. *Análisis y propuesta automática de campos:*
     - Analizar documentos de origen (DOCX, PDF vectorial o escaneado con OCR, imágenes) y detectar etiquetas, campos de texto, números, fechas, casillas, selecciones y firmas.
     - Generar propuesta estructurada en `FormulariosInstitucionales`: nombre, descripción, departamento, secciones y campos tipificados.
     - Sugerir vinculación automática con datos ya existentes en la plataforma (nombre, identidad, grado) para evitar capturas redundantes.
  2. *Editor visual y aprobación obligatoria:*
     - Editor interactivo para reordenar secciones, personalizar etiquetas, tipos de datos y validaciones.
     - La generación asistida siempre produce un `Borrador`; se prohíbe la publicación automática sin revisión y aprobación formal humana.
- **Criterios de Aceptación:**
  - [ ] Analiza un formulario tradicional proponiendo una estructura digital editable de campos.
  - [ ] Vincula campos con expedientes institucionales existentes evitando pedir datos ya conocidos.
  - [ ] El formulario solo se publica tras aprobación de Dirección/Secretaría conservando el documento de origen.
- **Dependencias:** F39-Task08, F39-Task09, F39-Task10.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 12494-12519; clave TASK-339; asignación única: Secretaria -->

---

<!-- ID: TASK-339 | Fuentes: Pendientes.md ; pendientes/Secretaria/Pendientes.md -->
### [ ] [TASK-339] [P1] Implementación de detección inteligente de documentos similares y duplicados potenciales
- **Prioridad:** P1 (Alta / Importante)
- **Orden de Ejecución:** 12 (Detección de similitud difusa y documentos re-escaneados)
- **Componentes Afectados:**
  - `backend/academic-service/Code.gs` (`detectDocumentSimilarity`, `getSimilarDocumentCandidates`)
  - Hoja de Cálculo: `RevisionDuplicadosDocumentales`
- **Subcapacidades Relacionadas:** 3.4.
- **Origen del Hallazgo:** `AUDITORIA_FASE_39_DIGITALIZACION_TRANSICION.md` / Sección C (3.4) y Matriz CAR-F39-04.
- **Problema Detectado y Riesgos:**
  SHA-256 detecta únicamente duplicados binarios exactos. Documentos escaneados nuevamente con diferente resolución, copias con nombres ligeramente distintos o archivos con pequeñas variaciones de formato pasan desapercibidos, acumulando duplicaciones en los expedientes.
- **Requerimientos Funcionales y Técnicos Convergentes:**
  1. *Algoritmo de similitud documental:*
     - Comparar texto extraído normalizado (sin espacios extras ni tildes), identificadores institucionales, fechas, nombres y metadatos clave.
     - Clasificar en: duplicado exacto (hash idéntico), duplicado probable (mismos datos clave y texto similar), documento relacionado (mismo expediente/trámite) y documento diferente.
  2. *Bandeja de revisión comparativa:*
     - Mostrar documentos candidatos lado a lado resaltando datos coincidentes y diferencias.
     - Permitir confirmar duplicidad, conservar ambos documentos vinculados o descartar la coincidencia. Prohibir la eliminación o fusión automática sin intervención humana.
- **Criterios de Aceptación:**
  - [ ] Reconoce como duplicado probable un documento re-escaneado a diferente resolución.
  - [ ] Identifica documentos equivalentes que poseen nombres de archivo distintos.
  - [ ] La bandeja comparativa permite resolver la ambigüedad y conserva el registro de la decisión.
- **Dependencias:** F39-Task04, F39-Task07, F39-Task08.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 12520-12546; clave TASK-340; asignación única: Secretaria -->

---

<!-- ID: TASK-340 | Fuentes: Pendientes.md ; pendientes/Secretaria/Pendientes.md -->
### [ ] [TASK-340] [P1] Implementación de búsqueda documental unificada por metadatos y contenido
- **Prioridad:** P1 (Alta / Importante)
- **Orden de Ejecución:** 13 (Indexación y motor de búsqueda documental transversal)
- **Componentes Afectados:**
  - `backend/academic-service/Code.gs` (`searchDocumentsByMetadataAndContent`, `rebuildDocumentSearchIndex`)
  - `js/secretary.js`, `js/teacher.js`
  - Hoja de Cálculo: `IndiceBusquedaDocumental`
- **Subcapacidades Relacionadas:** 4.5.
- **Origen del Hallazgo:** `AUDITORIA_FASE_39_DIGITALIZACION_TRANSICION.md` / Sección 4 (4.5) y Matriz CAR-F39-14.
- **Problema Detectado y Riesgos:**
  Localizar un documento histórico o expediente archivado exige conocer su carpeta exacta o nombre de archivo. No existe una búsqueda unificada que permita localizar archivos por metadatos combinados ni por texto contenido en PDFs u OCRs.
- **Requerimientos Funcionales y Técnicos Convergentes:**
  1. *Búsqueda avanzada multicriterio:*
     - Búsqueda combinada por: nombre, tipo documental, departamento, estudiante, docente, identidad/DNI, número de acta, rango de fechas y estado de digitalización.
     - Búsqueda por contenido en texto indexado de PDFs y documentos procesados por OCR.
  2. *Seguridad y rendimiento:*
     - Mantener un índice estructurado en `IndiceBusquedaDocumental` para evitar recorrer archivos en Google Drive en tiempo real.
     - Respetar estrictamente los permisos del usuario activo: la búsqueda no debe devolver resultados de expedientes o departamentos no autorizados.
- **Criterios de Aceptación:**
  - [ ] Localiza documentos mediante palabras contenidas únicamente en el texto extraído u OCR.
  - [ ] Permite combinar filtros de departamento, estudiante, tipo y fecha en una sola consulta.
  - [ ] Los usuarios sin permisos sobre un departamento no visualizan sus documentos en los resultados.
- **Dependencias:** F39-Task01, F39-Task05, F39-Task08.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 12602-12630; clave TASK-343; asignación única: Secretaria -->

---

<!-- ID: TASK-343 | Fuentes: Pendientes.md ; pendientes/Secretaria/Pendientes.md -->
### [ ] [TASK-343] [P1] Desarrollo de mecanismos de convivencia entre documentos tradicionales y registros digitales
- **Prioridad:** P1 (Alta / Importante)
- **Orden de Ejecución:** 16 (Operación híbrida y coexistencia sin disrupción institucional)
- **Componentes Afectados:**
  - `backend/accounting-service/Code.gs` (`setDepartmentTransitionStatus`, `getDepartmentTransitionStatus`)
  - `backend/user-service/Code.gs`
  - Hoja de Cálculo: `EstadoTransicionDepartamental`
- **Subcapacidades Relacionadas:** 3.12.
- **Origen del Hallazgo:** `AUDITORIA_FASE_39_DIGITALIZACION_TRANSICION.md` / Sección C (3.12) y Matriz CAR-F39-12.
- **Problema Detectado y Riesgos:**
  Forzar a todos los departamentos a abandonar simultáneamente sus archivos tradicionales genera caos operativo. Se requiere un modelo formal de transición que permita la convivencia ordenada de procedimientos físicos, hojas Excel y registros nativos digitales sin contradicciones.
- **Requerimientos Funcionales y Técnicos Convergentes:**
  1. *Estados de transición independientes por departamento:*
     - Auto-crear la hoja `EstadoTransicionDepartamental` (`Departamento`, `NivelTransicion`, `ProcedimientosDigitalizadosJSON`, `ProcedimientosTradicionalesJSON`, `FuenteOficialAutorizadaJSON`, `FechaInicio`, `FechaConsolidacion`).
     - Niveles de transición: `Operacion_Tradicional`, `Transicion_Iniciada`, `Operacion_Hibrida`, `Digitalizacion_Parcial`, `Operacion_Digital_Predominante`, `Digital_Consolidada`.
     - Permitir que Secretaría opere en modo digital mientras Recursos Humanos conserva expedientes físicos en transición.
  2. *Identificación de fuente oficial y resolución de discrepancias:*
     - Cada procedimiento debe definir explícitamente su fuente oficial autorizada durante la fase híbrida.
     - Detectar discrepancias entre registros tradicionales y digitales, requiriendo revisión humana antes de sincronizaciones automáticas.
- **Criterios de Aceptación:**
  - [ ] Dos departamentos pueden operar en diferentes niveles de transición sin interferir entre sí.
  - [ ] Los procesos tradicionales se mantienen consultables mientras se implementa su equivalente digital.
  - [ ] El sistema identifica con precisión la fuente oficial autorizada para cada procedimiento.
  - [ ] Se detectan discrepancias entre archivos legados y registros digitales alertando para su resolución.
- **Dependencias:** F39-Task01, F39-Task05, F39-Task14.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 12631-12658; clave TASK-344; asignación única: Secretaria -->

---

<!-- ID: TASK-344 | Fuentes: Pendientes.md ; pendientes/Secretaria/Pendientes.md -->
### [ ] [TASK-344] [P1] Implementación de recuperación, reversión y control de importaciones documentales
- **Prioridad:** P1 (Alta / Importante)
- **Orden de Ejecución:** 17 (Resiliencia operativa, reintentos selectivos y desecho seguro de lotes)
- **Componentes Afectados:**
  - `backend/accounting-service/Code.gs` (`revertDocumentImportBatch`, `retryFailedDocumentsInBatch`)
  - Hoja de Cálculo: `AuditoriaMigraciones`, `DetalleRegistrosImportados`
- **Subcapacidades Relacionadas:** 3.2, 4.2.
- **Origen del Hallazgo:** `AUDITORIA_FASE_39_DIGITALIZACION_TRANSICION.md` / Sección C (3.2), Matriz CAR-F39-02 y Especificación Técnica ChatGPT/Jules.
- **Problema Detectado y Riesgos:**
  Si una importación masiva de documentos o registros falla a mitad de camino, no existe reanudación completa ni reintentos selectivos de archivos fallidos. Asimismo, no se dispone de un mecanismo de reversión segura que desmonte una carga defectuosa sin borrar documentos legítimos preexistentes.
- **Requerimientos Funcionales y Técnicos Convergentes:**
  1. *Reanudación y reintentos selectivos:*
     - Identificar qué archivos del lote fueron procesados, cuáles fallaron y cuáles quedaron pendientes.
     - Permitir seleccionar únicamente los archivos fallidos y reintentar su procesamiento sin volver a procesar los documentos ya confirmados.
  2. *Reversión controlada de lotes:*
     - Implementar `revertDocumentImportBatch(payload)` que identifique documentos y registros creados por el lote.
     - Validar que los registros no hayan sido modificados posteriormente ni tengan transacciones dependientes (ej. calificaciones asentadas sobre matrículas importadas).
     - Mostrar comparativa previa de los cambios que se desharán y exigir confirmación explícita auditada en bitácora.
- **Criterios de Aceptación:**
  - [ ] Reanuda lotes interrumpidos procesando únicamente los archivos pendientes.
  - [ ] Permite reintentar exclusivamente los archivos que arrojaron error sin duplicar los exitosos.
  - [ ] Revierte un lote de importación sin modificaciones posteriores restaurando el estado original.
  - [ ] Bloquea la reversión de registros que ya tienen operaciones institucionales dependientes.
- **Dependencias:** F39-Task02, F39-Task04, F39-Task05, F39-Task06.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 12659-12690; clave TASK-345; asignación única: Secretaria -->

---

<!-- ID: TASK-345 | Fuentes: AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-06.md ; AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-07.md ; Pendientes.md ; pendientes/Secretaria/Pendientes.md -->
### [ ] [TASK-345] [P1] Crear conciliación documental entre Google Drive y los registros institucionales (F40-08)
- **Hallazgo de origen:** evidencia técnica 4; falta de detección general de archivos/carpetas inexistentes, movidos, inaccesibles, huérfanos o con referencias rotas.
- **Acción ejecutable:** ejecutar conciliación entre IDs de Drive y registros institucionales; detectar discrepancias sin borrar datos automáticamente; registrar estado, causa y acción de reparación autorizada.
- **Criterios de aceptación:** la conciliación identifica archivos faltantes, movidos, inaccesibles, huérfanos y referencias rotas; los resultados son trazables y la reparación respeta permisos y conserva historial.
- **Estado/prioridad:** conservar los valores vigentes de TASK-345.
- Conciliar periódicamente archivos existentes con sus referencias en los registros institucionales.
- Detectar y reportar archivos huérfanos, referencias inexistentes, documentos duplicados y discrepancias de propietario/ubicación.
- Conservar resultados de conciliación y trazabilidad de las correcciones, sin eliminar ni mover archivos automáticamente sin autorización.

**Dependencias y límites:** las tareas se mantienen separadas según su responsabilidad: integridad/orquestación (AUD-NG-146), cobertura binaria (TASK-151), recuperación integral (TASK-152), salvaguarda (TASK-087), granularidad (TASK-251), continuidad (TASK-079), ciclo de vida (TASK-149/TASK-150), capacidad (TASK-064) y conciliación (TASK-345). No se crea una tarea adicional ni se cambia el estado de ninguna tarea existente.
- **Prioridad:** P1 (Alta / Importante)
- **Orden de Ejecución:** 15 (Auditoría periódica de salud documental Drive vs Sheets)
- **Componentes Afectados:**
  - `backend/academic-service/Code.gs` (`reconcileDocumentStorageIntegrity`)
  - Google Drive institucional (`DriveApp`)
  - Hoja de Cálculo: `AuditoriaSaludDocumental`
- **Subcapacidades Relacionadas:** F40-22, F40-23.
- **Origen del Hallazgo:** `AUDITORIA_FASE_40_SEGURIDAD_DOCUMENTAL_TRAZABILIDAD_Y_CONSERVACION.md` / Secciones C (F40-22, F40-23) y Especificación Técnica ChatGPT/Jules.
- **Problema Detectado y Riesgos:**
  No se comparan sistemáticamente los archivos en Drive contra las hojas de cálculo. Existen archivos huérfanos sin registro, registros que apuntan a archivos eliminados y discrepancias de contenido silenciosas.
- **Requerimientos Funcionales y Técnicos Convergentes:**
  1. *Cruce sistemático de almacenamiento:*
     - Conciliar carpetas de Drive contra: Documentos académicos, Documentos laborales, Comprobantes de pago, Plantillas y emitidos, Historial de versiones.
     - Detectar: Archivo en Drive sin registro, Registro sin archivo físico, Archivo compartido injustificadamente, IDs inválidos, Versión discrepante, Hash alterado, Documentos dispuestos que siguen accesibles, Registros duplicados.
     - Diferenciar archivos huérfanos de archivos compartidos legítimamente por varios expedientes.
  2. *Ejecución por lotes y resolución asistida:*
     - Ejecución programada y manual autorizada. Paginación y control de tiempo de ejecución para evitar límites de GAS.
     - Filtros por carpeta, categoría, departamento, discrepancia y fecha.
     - Acciones controladas: Revisar, Vincular a registro existente, Marcar como duplicado, Solicitar recuperación, Solicitar disposición, Excluir del inventario con justificación.
     - Prohibir vinculación o eliminación automática en casos ambiguos.
- **Criterios de Aceptación:**
  - [ ] Registros consistentes pasan la conciliación sin alertas.
  - [ ] Archivos borrados en Drive generan alerta de registro huérfano.
  - [ ] Archivos sueltos en Drive sin registro generan alerta de archivo huérfano.
  - [ ] Alteraciones en Drive sin actualización de hash generan alerta de discrepancia de integridad.
  - [ ] Las decisiones de saneamiento quedan registradas con usuario, fecha y motivo.
- **Dependencias:** F40-Task06, F40-Task13, F40-Task07.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 12691-12720; clave TASK-346; asignación única: Secretaria -->

---

<!-- ID: TASK-348 | Fuentes: Pendientes.md ; pendientes/Secretaria/Pendientes.md -->
### [ ] [TASK-348] [P1] Ampliar las alertas de vencimiento documental y conservación (F40-16)
- **Prioridad:** P1 (Alta / Importante)
- **Orden de Ejecución:** 18 (Alertas de vencimiento y revisión de retención)
- **Componentes Afectados:**
  - `backend/academic-service/Code.gs` (`checkAndNotifyExpiringStudentDocuments`, `checkDocumentRetentionExpirations`)
  - `backend/accounting-service/Code.gs` (`checkExpiringEmployeeDocuments`)
  - Hoja de Cálculo: `AlertasVencimientoDocumental`
- **Subcapacidades Relacionadas:** F40-20.
- **Origen del Hallazgo:** `AUDITORIA_FASE_40_SEGURIDAD_DOCUMENTAL_TRAZABILIDAD_Y_CONSERVACION.md` / Secciones C (F40-20) y Especificación Técnica ChatGPT/Jules.
- **Problema Detectado y Riesgos:**
  Las alertas de vencimiento actuales se limitan a carnés o identidades de alumnos. No cubren contratos laborales, poderes de representación, pólizas ni fechas derivadas del calendario de retención documental.
- **Requerimientos Funcionales y Técnicos Convergentes:**
  1. *Ampliación de categorías y fechas objeto de monitoreo:*
     - Monitorear: Vencimiento de documentos oficiales, Vencimiento de autorizaciones/poderes, Fecha de revisión periódica, Fin de vigencia de plantillas CUV, Fecha de cierre de expediente, Inicio o fin de plazos de retención legal.
     - Configurar anticipación de alertas por tipo documental (ej. 30, 60 o 90 días antes).
  2. *Enrutamiento inteligente de alertas:*
     - Notificar a responsables según categoría y departamento.
     - Evitar notificaciones repetitivas sin cambio de estado.
     - Opciones: Marcar como atendida, Pospuesta o No aplicable con justificación.
     - Integración con Legal Hold: documentos con retención legal nunca deben sugerirse para disposición por simple vencimiento.
- **Criterios de Aceptación:**
  - [ ] Contratos laborales próximos a vencer notifican a Recursos Humanos con la anticipación configurada.
  - [ ] Documentos de identidad estudiantil mantienen sus notificaciones vigentes.
  - [ ] Revisiones de retención documental se programan y notifican oportunamente.
  - [ ] Documentos con retención legal activa son excluidos de sugerencias de destrucción.
- **Dependencias:** F40-Task11.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 12843-12871; clave TASK-351; asignación única: Secretaria -->

---

<!-- ID: TASK-351 | Fuentes: AUDITORIAS/AUDITORIA_COMPLETADAS_FASE2-04.md ; AUDITORIAS/AUDITORIA_COMPLETADAS_FASE2-T05.md ; Pendientes.md ; pendientes/Secretaria/Pendientes.md -->
### [ ] [TASK-351] [P1] Fortalecer la verificación de documentos oficiales mediante CUV e integridad del archivo (F40-23)
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
- **Hallazgo de origen:** requisito 10; exposición en `verifySchoolDocumentByCUV`; reconciliación CUV.
- **Severidad:** Crítica. **Objetivo:** permitir verificación pública limitada sin exponer datos personales, identificadores internos, URLs de Drive, tokens ni metadatos de firma.
- **Acción ejecutable:** definir DTO público mínimo; retirar `datosJSON`, IDs internos, `driveFileId`, `driveUrl`, observaciones sensibles, `firmanteId`, `tokenVerificacion`, `ipOrigen` y `signatureHash`; verificar estado documental vigente y unicidad del CUV antes de responder; diferenciar vigente, revocado, anulado, sustituido, inexistente y alterado; registrar consultas sin filtrar secretos.
- **Archivos/módulos:** `backend/accounting-service/Code.gs`; `PUBLIC_ACTIONS`; `validateRolePermission`; `doPost`; `verifySchoolDocumentByCUV`; `DocumentosEscolaresEmitidos`; `FirmasConformidades`.
- **Dependencias/riesgos:** TASK-039/TASK-040 para integridad y certificado; política de privacidad institucional; riesgo de exposición de PII, tokens y enlaces portadores.
- **Alcance:** respuesta pública del verificador CUV; mantener datos probatorios completos solo en rutas autenticadas y autorizadas.
- **Criterios de aceptación:** respuesta pública contiene solo estado, emisor y datos mínimos aprobados; no incluye tokens, IDs internos, URL/ID Drive ni PII no necesaria; rechaza CUV duplicado, inválido o de documento no vigente; pruebas anónimas de minimización y estados.
- **Prioridad:** P0. **Estado:** Pendiente de ejecución/revalidación.
- **Evidencia de cierre:** pendiente; la auditoría documenta exposición de datosJSON, IDs, URL/Drive y datos de firma, además de ausencia de validación suficiente de estado.
- **Prioridad:** P1 (Alta / Importante)
- **Orden de Ejecución:** 21 (Autenticación documental integral con hash y correlativo)
- **Componentes Afectados:**
  - `backend/accounting-service/Code.gs` (`generateSchoolDocument`, `verifySchoolDocumentByCUV`)
  - Hoja de Cálculo: `DocumentosEscolaresEmitidos`
- **Subcapacidades Relacionadas:** F40-07, F40-09.
- **Origen del Hallazgo:** `AUDITORIA_FASE_40_SEGURIDAD_DOCUMENTAL_TRAZABILIDAD_Y_CONSERVACION.md` / Secciones C (F40-07, F40-09), D (E2E-01) y Especificación Técnica ChatGPT/Jules.
- **Problema Detectado y Riesgos:**
  El CUV valida metadatos pero no comprueba que el PDF presentado sea exactamente el binario emitido. Si alguien sustituye el PDF en Drive con el mismo nombre y correlativo, la consulta CUV puede dar falso positivo de autenticidad.
- **Requerimientos Funcionales y Técnicos Convergentes:**
  1. *Asociación de huella SHA-256 al registro CUV:*
     - Conservar la relación probada: Plantilla, Versión, Entidad, Correlativo anual, CUV y Documento emitido.
     - Asociar obligatoriamente el hash SHA-256 del PDF final generado en la columna correspondiente de `DocumentosEscolaresEmitidos`.
  2. *Verificación binaria pública y estados ampliados:*
     - Permitir que la verificación CUV acepte opcionalmente el archivo para cotejar su hash actual.
     - Estados de respuesta: CUV válido y archivo íntegro, CUV válido pero archivo no disponible, CUV válido pero hash discrepante, CUV inexistente o inválido, Documento revocado o anulado formalmente.
     - No exponer datos personales innecesarios en la consulta pública ni dar acceso a expedientes vinculados.
     - Preservar intactos los registros históricos originales al emitir correcciones.
- **Criterios de Aceptación:**
  - [ ] Generar un documento oficial asocia el correlativo anual, CUV y el hash SHA-256 del PDF.
  - [ ] Cotejar el CUV y el archivo original devuelve resultado válido e íntegro.
  - [ ] Modificar el PDF manteniendo el CUV devuelve alerta de hash discrepante.
  - [ ] Documentos anulados reflejan claramente su condición de no vigencia.
- **Dependencias:** F40-Task06, F40-Task10.

- **Ampliación C1.32 / FASE2-04 (2026-11-05):** `verifySchoolDocumentByCUV` está incluido en `PUBLIC_ACTIONS` (línea 218), por lo que `validateRolePermission` lo autoriza sin token. El handler (15151-15235) devuelve públicamente `datosJSON`, `targetEntityId`, `solicitanteUserId`, `driveFileId`, `driveUrl`, observaciones y hash; cuando hay firmas también expone `firmanteId`, `tokenVerificacion`, `ipOrigen` y `signatureHash`. La consulta debe revelar solo un resumen probatorio mínimo, no el expediente ni datos personales/internos.
- **Estados:** al encontrar un CUV, el handler devuelve `status:"success"` sin comprobar `estadoDoc`; no distingue documento vigente, revocado, anulado o sustituido. No declarar válido un documento no vigente.
- **Revaluación de prioridad:** la exposición no autenticada de datos personales y metadatos de firmas puede tener impacto crítico; revisar la prioridad P1 de TASK-351 para tratamiento P0 antes de publicar el portal.
- **Criterios adicionales:** respuesta pública con campos permitidos explícitos (tipo documental, emisor, fecha y estado); nunca devolver `datosJSON`, IDs internos, URL/ID de Drive, tokens, IP ni metadatos de firmas; validar estado y unicidad del CUV; probar consultas anónimas, documentos vigentes/anulados/revocados, campos sensibles y códigos duplicados. Hash binario sigue en AUD-NG-059 y pruebas de colisión/concurrencia en AUD-NG-161; no duplicar.

- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 12911-12951; clave TASK-353; asignación única: Secretaria -->

---

<!-- ID: TASK-353 | Fuentes: Pendientes.md ; pendientes/Secretaria/Pendientes.md -->
### [ ] [TASK-353] [P1] Motor OCR para documentos escaneados con corrección asistida
- **Prioridad:** P1 (Alta / Importante)
- **Orden de Ejecución:** 6 (Reconocimiento óptico de caracteres y validación humana)
- **Componentes Afectados:**
  - `backend/academic-service/Code.gs` (`processDocumentOCR`, `saveVerifiedOCRData`)
  - `backend/accounting-service/Code.gs`
  - `js/teacher.js`, `teacher-dashboard.html`
  - Almacenamiento: Google Drive institucional
- **Subcapacidades Relacionadas:** F41-05.
- **Origen del Hallazgo:** `AUDITORIA_FASE_41_PRUEBAS_INTEGRALES_DIGITALIZACION.md` / Secciones B (F41-05), E (E2E-41-06) y Especificación Técnica ChatGPT/Jules.
- **Problema Detectado y Riesgos:**
  No existen funciones operativas de OCR en el backend. Los documentos PDF escaneados o fotografías de actas y certificados antiguos requieren transcripción manual obligatoria, limitando la digitalización masiva y generando cuellos de botella operativos.
- **Requerimientos Funcionales y Técnicos Convergentes:**
  1. *Ingesta y reconocimiento óptico:*
     - Admitir PDFs escaneados e imágenes compatibles (JPG, PNG, TIFF) de una o varias páginas.
     - Validar tamaño, formato y legibilidad; detectar páginas en blanco, rotadas o con resolución deficiente.
     - Reconocer texto impreso en español (tildes, eñes, números, fechas y caracteres especiales).
     - Extraer bloques, líneas, palabras y coordenadas espaciales cuando el motor lo permita.
  2. *Extracción estructurada de entidades:*
     - Definir campos a extraer según el tipo documental (nombre, identidad, fecha, número de acta, notas).
     - Diferenciar valores detectados de valores confirmados; señalar campos dudosos o no reconocidos.
  3. *Interfaz comparativa de revisión humana:*
     - Mostrar el documento original escaneado a la izquierda y los campos extraídos a la derecha.
     - Resaltar en la imagen la ubicación del campo seleccionado para verificación inmediata.
     - Permitir al usuario corregir el texto, confirmar valores, marcar campos ilegibles o descartar el resultado.
     - Prohibir terminantemente que datos dudosos de OCR se asienten en la base de datos sin confirmación humana explícita.
  4. *Trazabilidad y resiliencia:*
     - Registrar usuario responsable, motor utilizado, fecha, texto bruto original y valores corregidos.
     - Procesar documentos extensos por páginas o bloques permitiendo reanudar trabajos interrumpidos.
- **Criterios de Aceptación:**
  - [ ] Un PDF escaneado sin texto vectorial es procesado extrayendo su contenido textual visible.
  - [ ] Documentos de varias páginas se procesan manteniendo la correspondencia página por página.
  - [ ] La interfaz comparativa resalta campos dudosos y permite su corrección manual antes de guardar.
  - [ ] La confirmación de datos queda formalmente asociada al usuario responsable en la bitácora.
  - [ ] El archivo escaneado original permanece intacto en custodia protegida en Google Drive.
  - [ ] Documentos ilegibles generan mensajes claros de error sin inventar datos ficticios.
- **Dependencias:** F41-Task06, almacenamiento documental y controles de seguridad de Fase 40.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 12952-12989; clave TASK-354; asignación única: Secretaria -->

---

<!-- ID: TASK-354 | Fuentes: Pendientes.md ; pendientes/Secretaria/Pendientes.md -->
### [ ] [TASK-354] [P1] Conversión de PDF y DOCX a formularios digitales
- **Prioridad:** P1 (Alta / Importante)
- **Orden de Ejecución:** 7 (Transformación de formatos tradicionales en formularios interactivos)
- **Componentes Afectados:**
  - `backend/user-service/Code.gs` (`convertDocumentToInstitutionalForm`, `saveInstitutionalForm`)
  - `js/teacher.js`, `teacher-dashboard.html`
  - Hoja de Cálculo: `FormulariosInstitucionales`
- **Subcapacidades Relacionadas:** F41-04.
- **Origen del Hallazgo:** `AUDITORIA_FASE_41_PRUEBAS_INTEGRALES_DIGITALIZACION.md` / Secciones B (F41-04), E (E2E-41-05) y Especificación Técnica ChatGPT/Jules.
- **Problema Detectado y Riesgos:**
  La plataforma permite crear formularios dinámicos JSON manualmente mediante `saveInstitutionalForm`, pero carece de un conversor estructural para transformar documentos Word (DOCX) y PDF existentes en formularios web. Esto obliga a rediseñar desde cero trámites y solicitudes ya aprobados en papel.
- **Requerimientos Funcionales y Técnicos Convergentes:**
  1. *Conversión estructural de DOCX:*
     - Interpretar párrafos, tablas, celdas y controles de contenido de Word.
     - Reconocer líneas de completar, casillas de verificación y tablas de datos.
     - Preservar encabezados, márgenes y saltos de página transformándolos en secciones de formulario digital.
  2. *Conversión de PDF (vectorial y escaneado):*
     - Identificar campos de formulario AcroForms existentes y texto seleccionable.
     - Permitir superponer campos editables sobre páginas PDF que sirvan como plantilla de fondo.
     - Derivar a OCR cuando el PDF sea una imagen escaneada pura.
  3. *Detección de campos y editor interactivo:*
     - Proponer tipos de campo: texto corto, texto largo, número, fecha, correo, DNI, selección única/múltiple, casilla, firma y adjunto.
     - La detección genera propuestas editables; el usuario puede agregar, mover, redimensionar o eliminar campos.
     - Definir validaciones, campos obligatorios y permisos de visualización/edición por rol.
  4. *Plantillas reutilizables y generación final:*
     - Guardar el formulario convertido como plantilla institucional versionada.
     - Permitir completar datos de prueba y exportar el documento final en PDF comprobando la fidelidad del diseño frente al original.
- **Criterios de Aceptación:**
  - [ ] Un archivo DOCX con tablas y controles de contenido se convierte en un formulario digital interactivo.
  - [ ] Un PDF digital se convierte en formulario conservando sus elementos visuales de referencia.
  - [ ] Los campos detectados automáticamente pueden editarse y reordenarse en el editor visual.
  - [ ] El formulario publicado valida campos obligatorios y genera un PDF final fiel al diseño original.
  - [ ] El documento original utilizado como base permanece inalterado en almacenamiento.
- **Dependencias:** F41-Task05, F41-Task07, F41-Task08.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 13885-13909; clave TASK-384; asignación única: Secretaria -->

---

<!-- ID: TASK-548 | Fuentes: AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F7-IMP-06.md -->
### [ ] [TASK-548] Corregir la comparación entre capacidad física y matrícula efectiva
- **Hallazgo de origen:** AUD-NG-241 / H5.
- **Severidad:** Alta.
- **Objetivo:** comparar la capacidad real del espacio con estudiantes activos de la oferta y período correctos.
- **Acción concreta:** resolver la relación OfertaAcademica -> grado/sección/año/período; contar matrículas activas desde columnas canónicas; no confiar en un conteo arbitrario enviado por el cliente; retirar valores predeterminados de capacidad sin respaldo institucional.
- **Archivos/módulos afectados:** backend/academic-service/Code.gs; Matriculas; OfertaAcademica; SedesAulas; HorariosClase.
- **Dependencias:** getAcademicOfferColumnMap, isAcademicOfferActive, checkScheduleConflict y getSectionCapacityAnalyticsReport.
- **Alcance técnico:** mapeo de columnas por encabezado, ámbito temporal, estados de matrícula y política explícita de capacidad.
- **Criterios de aceptación:** el conteo corresponde a la sección/oferta/año/período solicitado; estudiantes inactivos/retirados no cuentan; la capacidad se compara solo con datos válidos y política explícita; no se inventa un cupo.
- **Prioridad:** P1.
- **Estado:** Pendiente.

---

<!-- ID: TASK-616 | Fuentes: AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F7-IMP-19.md -->
### [ ] [TASK-616] Revalidar horarios afectados después de cada mutación de matrícula
- **Hallazgo de origen:** AUD-NG-256, H3.
- **Severidad:** Alto.
- **Objetivo:** evitar que una modificación de matrícula deje horarios existentes por encima de límites físicos o administrativos sin detección.
- **Acción ejecutable:** crear servicio de impacto que resuelva matrícula/oferta/año/período/sección y horarios/aulas vinculados; invocarlo después de alta, reingreso, promoción, cambio de sección, retiro y traslado; comparar conteo anterior/nuevo con límites efectivos; generar alertas accionables y bloqueos según política; exigir revisión/reubicación antes de publicar o confirmar operaciones que violen límites; persistir actor, motivo, correlación y estado de resolución.
- **Archivos/módulos afectados:** backend/academic-service/Code.gs; Matriculas; OfertaAcademica; HorariosClase; MovimientosEstudiante; bitácora/notificaciones; tests/regression.
- **Dependencias y riesgos:** TASK-548/549/551; AUD-NG-236/241/256; TASK-513/514. Evitar que los triggers de mutación creen ciclos recursivos o dupliquen conteos.
- **Alcance:** impacto de cambios en matrícula sobre asignaciones existentes; no sustituye el cálculo canónico de capacidad (TASK-548) ni el motor de recursos (TASK-549).
- **Criterios de aceptación:** cada mutación cubierta identifica horarios afectados; antes/después reproducible; exceso detectado con aula y límite; no se publica silenciosamente; las alertas se pueden resolver y auditar; no hay datos productivos modificados por pruebas.
- **Prioridad:** P1.
- **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente de pruebas conductuales para alta, movimiento, baja, reingreso, promoción y traslado, más revisión independiente.

---

<!-- ID: TASK-627 | Fuentes: AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F7-IMP-23.md -->
### [ ] [TASK-627] Integrar impresión estudiante con alcance de matrícula verificado
- **Hallazgo de origen:** AUD-NG-272; ampliación de AUD-NG-246.
- **Severidad/Prioridad:** ALTO/P1.
- **Objetivo y acción:** crear un área imprimible específica del horario estudiante y conectar el botón/modal; derivar estudiante, matrícula, grado y sección desde identidad/relación verificada en servidor, no desde parámetros manipulables; mostrar únicamente los datos permitidos y preparar una salida de impresión que no oculte el contenido.
- **Archivos/módulos:** student-dashboard.html, js/student.js, backend/academic-service/Code.gs, css/style.css.
- **Dependencias:** AUD-NG-246, TASK-567, TASK-584..TASK-589, AUD-NG-161.
- **Criterios verificables:** el modal y el área imprimible existen; imprimir/PDF contiene el horario seleccionado y ningún elemento ajeno; cambiar userId/grado/sección en el payload no permite consultar otra matrícula; una respuesta fallida no produce un documento vacío con apariencia de éxito.
- **Estado:** Pendiente.

---

<!-- ID: F10-TASK18 | Fuentes: Pendientes.md ; pendientes/Secretaria/Pendientes.md -->
### [ ] [F10-TASK18] Completar la documentación funcional y operativa de la Fase 10
- **Origen del Hallazgo:** `AUDITORIA_FASE_10_ASISTENCIA_DISCIPLINA_CONVIVENCIA.md` / Tarea 10.17 (P2)
- **Prioridad:** P2
- **Severidad/Clasificación:** Media (Documentación funcional)
- **Archivos Involucrados:**
  - `docs/architecture/`
- **Dependencias Expuestas:** Especificaciones operativas
- **Descripción del Alcance:**
  Documentar las modalidades de asistencia, tablas de transiciones de incidencias y modelos de delegación para la consulta institucional.
- **Criterios de Aceptación:**
  - La documentación funcional refleja con exactitud las capacidades operativas de la Fase 10.
- **Estado:** Pendiente

---

<!-- ID: F22-TASK09 | Fuentes: AUDITORIAS/AUDITORIA_FASE_22_GESTION_DOCUMENTAL_FORMULARIOS_FIRMA_ELECTRONICA.md -->
### [ ] [F22-TASK09] Incorporar OCR asistido con revisión humana obligatoria
- **Hallazgo de origen:** secciones D/F22-30 y H P2.
- **Severidad:** Media. **Objetivo:** precargar datos de documentos escaneados reduciendo digitación sin aceptar extracción automática como verdad.
- **Acción ejecutable:** integrar OCR para certificados/partidas; presentar campos extraídos con nivel de confianza y referencia a página/imagen; exigir confirmación humana antes de persistir.
- **Archivos/módulos:** servicio documental, `FormulariosInstitucionales`, `SolicitudesTramites`, almacenamiento privado y UI de Secretaría.
- **Dependencias/riesgos:** F22-Task01, proveedor OCR, privacidad y revisión humana; riesgo de datos erróneos o extracción de información sensible.
- **Alcance:** asistencia de captura; no tomar decisiones de admisión ni sustituir verificación de documentos.
- **Criterios de aceptación:** extracción con confianza; campos editables; confirmación humana; archivo original preservado; permisos por expediente; registro de correcciones.
- **Prioridad:** P2. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; el informe declara OCR ausente.

---

<!-- ID: F23-TASK15 | Fuentes: AUDITORIAS/AUDITORIA_FASE_23_MOTOR_INSTITUCIONAL_FLUJOS_TRABAJO.md -->
### [ ] [F23-TASK15] Habilitar desistimiento del solicitante y archivo gobernado de trámites
- **Hallazgo de origen:** F23-019/F23-020 y J (cancelación ausente, archivo manual).
- **Severidad:** Media. **Objetivo:** permitir desistir de una solicitud elegible y conservar trámites finalizados según retención.
- **Acción ejecutable:** implementar cancelación con actor verificado, motivo y estado permitido; notificar; automatizar archivo de trámites terminales con retención y búsqueda.
- **Archivos/módulos:** `backend/user-service/Code.gs`, `SolicitudesTramites`, `RevisionesDecisionesTramite`, archivo documental y bandeja.
- **Dependencias/riesgos:** F23-Task01/F23-Task03, retención y F22-Task05; riesgo de cancelar trámites resueltos o eliminar evidencia.
- **Alcance:** desistimiento/archivo lógico; no borrar historial ni documentos probatorios.
- **Criterios de aceptación:** solo solicitante autenticado desiste en estados permitidos; motivo obligatorio; decisiones previas conservadas; notificación/auditoría; archivo automático por política; búsqueda/restauración autorizada.
- **Prioridad:** P2. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; la tabla J registra cancelación ausente y archivo manual.

---

<!-- ID: F29-TASK11 | Fuentes: AUDITORIAS/AUDITORIA_FASE_29_MIGRACION_Y_TRANSICION.md -->
### [ ] [F29-TASK11] Verificar integridad criptográfica de documentos y expedientes migrados
- **Hallazgo de origen:** F29-08; secciones C.8, E e I.
- **Severidad:** Media / P2. **Objetivo:** demostrar que PDFs y archivos conservan su contenido durante extracción, transferencia y almacenamiento.
- **Acción ejecutable:** calcular SHA-256 antes y después del traslado; mantener manifiesto con archivo origen/destino, MIME, tamaño, propietario, ACL, fecha y checksum; verificar permisos y referencias desde expedientes.
- **Archivos/módulos:** servicios Academic/User/Developer, Google Drive, manifiesto de archivos, `AuditoriaMigraciones` y expedientes.
- **Dependencias/riesgos:** F29-Task01/06/07/15, F27-Task03 y TASK-151/152; riesgo de compartir archivos públicamente o de validar checksum sin verificar ACL y vínculo documental.
- **Alcance:** integridad binaria y asociación documental; no publicar enlaces ni copiar permisos más amplios que los autorizados.
- **Criterios de aceptación:** SHA-256 coincide antes/después; archivos faltantes/corruptos quedan bloqueados; propietario y ACL revisados; vínculos de expediente resuelven al archivo destino; manifiesto auditable; pruebas de corrupción, archivo ausente, duplicado y permisos.
- **Prioridad:** P2. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; la matriz H describe referencias de Drive, pero no acredita verificación criptográfica integral del traslado.

---

<!-- ID: F31-TASK14 | Fuentes: AUDITORIAS/AUDITORIA_FASE_31_DISENADOR_UNIVERSAL_DOCUMENTOS_PLANTILLAS.md -->
### [ ] [F31-TASK14] Ampliar el catálogo de documentos institucionales y trámites
- **Hallazgo de origen:** F31-22; matriz B, estado parcialmente implementado y próximo paso de ampliar contratos laborales y circulares directivas.
- **Severidad:** Media / P2. **Objetivo:** cubrir tipos documentales institucionales más allá de constancias, certificados y recibos.
- **Acción ejecutable:** inventariar categorías y propietarios; añadir contratos laborales, circulares directivas y documentos complementarios con plantillas, variables, permisos, flujo de aprobación, retención y asociación al expediente correspondiente.
- **Archivos/módulos:** `backend/accounting-service/Code.gs`, `PlantillasEscolares`, `DocumentosEscolaresEmitidos`, `backend/user-service/Code.gs`, expedientes laborales/estudiantiles y catálogos de trámites.
- **Dependencias/riesgos:** F31-Task07/08/13, F33 formularios/trámites y F40 seguridad documental; riesgo de emitir contratos o circulares con permisos, firmas o retención incorrectos.
- **Alcance:** ampliar catálogo de tipos; no crear documentos jurídicos sin plantilla aprobada ni duplicar módulos de trámites existentes.
- **Criterios de aceptación:** catálogo con tipo/propietario/plantilla/flujo; contratos y circulares con versiones aprobadas; variables validadas; permisos/firmas/retención; vínculo a expediente; pruebas de emisión, aprobación, acceso y archivo.
- **Prioridad:** P2. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; la matriz B confirma catálogo parcial y falta de contratos laborales/circulares.

---

<!-- ID: F33-TASK08 | Fuentes: AUDITORIAS/AUDITORIA_FASE_33_FORMULARIOS_INSTITUCIONALES_TRAMITES_DIGITALES.md -->
### [ ] [F33-TASK08] Crear paquetes de trámites agrupados y solicitudes recurrentes anuales
- **Hallazgo de origen:** plan H.8; agrupación de matrícula, ficha médica, transporte y otros trámites relacionados.
- **Severidad:** Media / P2. **Objetivo:** simplificar solicitudes relacionadas con progreso y seguimiento consolidado.
- **Acción ejecutable:** crear definición de paquete con trámites hijos, dependencias, vigencias, requisitos y estados agregados; permitir iniciar/repetir paquete anual con datos históricos precargados y confirmación del solicitante.
- **Archivos/módulos:** `FormulariosInstitucionales`, `SolicitudesTramites`, `FlujosAprobacion`, portal familiar y bandejas administrativas.
- **Dependencias/riesgos:** F33-Task01/02/04/06, F31-Task02 y ciclo anual académico; riesgo de enviar parcialmente el paquete o copiar datos obsoletos.
- **Alcance:** orquestación de solicitudes relacionadas; no convertir un paquete en una transacción monolítica ni enviar cada hijo sin consentimiento.
- **Criterios de aceptación:** paquete versionado; trámites hijos y dependencias visibles; progreso consolidado; validación independiente por hijo; precarga revisable; envío idempotente; pruebas de paquete incompleto, rechazo parcial, renovación anual y cancelación.
- **Prioridad:** P2. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; el informe no acredita paquetes agrupados ni solicitudes recurrentes.

---

<!-- ID: F33-TASK09 | Fuentes: AUDITORIAS/AUDITORIA_FASE_33_FORMULARIOS_INSTITUCIONALES_TRAMITES_DIGITALES.md -->
### [ ] [F33-TASK09] Generar constancia de recepción física con código QR
- **Hallazgo de origen:** plan H.9; recepción en ventanilla de documentos físicos.
- **Severidad:** Media / P2. **Objetivo:** entregar comprobante verificable de radicación y vincular la documentación recibida al expediente.
- **Acción ejecutable:** al registrar recepción física, emitir PDF con folio, fecha, oficina, trámite, lista de documentos y QR de consulta de estado; no incluir PII en el QR; registrar actor receptor y evidencia de digitalización.
- **Archivos/módulos:** `backend/user-service/Code.gs`, `SolicitudesTramites`, `DocumentosEscolaresEmitidos`, `generateSchoolDocument`, portal CUV/consulta.
- **Dependencias/riesgos:** F33-Task01/07, F31-Task11, F32-Task07; riesgo de QR que revele datos personales o constancias duplicadas.
- **Alcance:** recibo de radicación física; no confundirlo con aprobación del trámite ni con documento final.
- **Criterios de aceptación:** folio único e idempotente; recibo incluye fecha/actor/documentos; QR apunta a consulta segura; estado de recepción diferenciable de aprobación; PDF vinculado a expediente; pruebas de reimpresión, QR alterado, recepción duplicada y acceso no autorizado.
- **Prioridad:** P2. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; el plan exige un comprobante de recepción física, distinto del PDF final con CUV.

---

<!-- ID: TAREA-F5-010 | Fuentes: completadas.md -->
### [ ] [TAREA-F5-010] Integrar las plazas, reservas y matrículas en un control de capacidad consistente
- **Origen del Hallazgo:** `Auditoria.txt` (HALLAZGOS F5: HALLAZGOS-F5-P2-01) / `AUDITORIA_FASE_5_ADMISIONES_PORTAL_FAMILIAS.md` (Subcapacidad 5.12, Brecha P2-01)
- **Severidad/Clasificación:** Alto
- **Archivos Involucrados:** `backend/academic-service/Code.gs` (l. 4938-5015), `js/secretary.js`, `dashboard-secretaria.html`
- **Dependencias Expuestas:** Hojas `OfertaAcademica`, `Matriculas`, `SolicitudesAdmision`, `ListaEsperaAdmision`
- **Descripción del Alcance:**
  1. Definir la capacidad máxima por año lectivo, grado y sección en `OfertaAcademica`.
  2. Actualizar `checkEnrollmentCapacity` para calcular la disponibilidad real restando de la capacidad máxima tanto las `Matriculas` activas como los aspirantes con solicitud `Admitida` (plazas reservadas no vencidas).
  3. Distinguir explícitamente entre solicitud admitida, plaza reservada, oferta aceptada y matrícula confirmada.
  4. Definir reglas y tiempos de caducidad para las reservas de cupo de aspirantes admitidos (ej. 5 días hábiles para pagar la matrícula).
  5. Evitar la doble contabilización cuando una plaza reservada se convierte en matrícula confirmada.
  6. Forzar la verificación de capacidad antes de marcar una solicitud como `Admitida` y antes de ejecutar `convertAdmissionToStudent`.
  7. Proteger el cálculo de capacidad con `LockService` para prevenir condiciones de carrera en matriculaciones simultáneas.
  8. Endpoint de consulta de cupos que desglose: Capacidad Total, Inscritos Confirmados, Plazas Reservadas y Cupos Libres.
  9. Liberar la reserva de cupo cuando una solicitud admitida sea cancelada, rechazada o expire su plazo de pago.
  10. Bloquear reservas de cupo para secciones no abiertas o cerradas en la oferta académica.
  11. Mantener el historial de reservas y liberaciones de cupo en la bitácora de auditoría.
  12. Establecer una política explícita y configurable (`OVERBOOKING_ALLOWED`) para autorizar o prohibir sobrecupos con firma de Dirección.
- **Criterios de Aceptación:**
  - [ ] Secciones sin cupos disponibles bloquean el cambio de estado a `Admitida` y la conversión a matrícula.
  - [ ] Aspirantes admitidos reducen inmediatamente el número de cupos disponibles.
  - [ ] Al convertirse en estudiante matriculado, la plaza reservada se transforma en matrícula activa sin duplicar el descuento de cupo.
  - [ ] La cancelación de una matrícula o expiración de una admisión libera el cupo en tiempo real.
  - [ ] Peticiones simultáneas sobre el último cupo disponible son procesadas de forma atómica (un solo ganador, el otro a lista de espera).
  - [ ] La conversión a matrícula recalcula y valida la disponibilidad real antes de confirmar el registro.
  - [ ] Los reportes de capacidad coinciden con la suma de matrículas activas y reservas no vencidas.
  - [ ] Cambios de capacidad no modifican decisiones de admisión previamente aprobadas.
  - [ ] Excepciones de sobrecupo requieren el parámetro `forceCapacityOverride` con autorización auditada de Dirección.
- **Estado:** Pendiente

---

<!-- ID: TAREA-F6-017 | Fuentes: completadas.md -->
### [ ] [TAREA-F6-017] Completar el flujo de gestión de documentos pendientes, vencidos y faltantes
- **Origen del Hallazgo:** `AUDITORIA_FASE_6_EXPEDIENTE_CICLO_VIDA.md` / Tarea 3 (P2 · Gestión Documental)
- **Prioridad:** P2
- **Severidad/Clasificación:** Medio (Ampliación de gestión documental)
- **Archivos Involucrados:**
  - `backend/academic-service/Code.gs`
  - `dashboard-secretaria.html`
  - `js/secretary.js`
- **Dependencias Expuestas:** `getStudentDocuments`, `uploadStudentDocument`, `updateDocumentStatus`, `DocumentosEstudiante`, `SolicitudesAdmision`
- **Descripción del Alcance:**
  Facilitar que los responsables administrativos identifiquen y gestionen los expedientes con documentación incompleta, autorizaciones pendientes o documentos vencidos durante toda la trayectoria educativa del estudiante.

  Requisitos Funcionales:
  1. Definir requisitos documentales por trámite o condición (admisión inicial, renovación, traslado, graduación, autorizaciones periódicas).
  2. Configurar cada requisito como obligatorio, opcional o condicional (con sus reglas activadoras).
  3. Registrar para cada documento: tipo documental, estudiante/expediente, estado, fecha recepción, fecha vencimiento, revisor, observaciones y versión vigente.
  4. Diferenciar claramente los estados: pendiente, recibido, en revisión, aprobado, rechazado, vencido y exento. Las exenciones de documentos obligatorios deben requerir autorización por rol.
  5. Detectar automáticamente documentos vencidos y próximos a vencer según la zona horaria institucional.
  6. Mostrar los faltantes en el expediente y en los trámites que dependan de ellos con las acciones requeridas para subsanar.
  7. Permitir sustituir documentos rechazados o vencidos sin borrar el archivo previo ni perder el historial de revisiones.
  8. Permitir registrar excepciones justificadas con responsable, fecha, motivo y alcance sin afectar a otros estudiantes.
  9. Evitar que un trámite u expediente aparezca como completo si falta un documento obligatorio no exento.
- **Criterios de Aceptación:**
  - CA-086: Un estudiante con todos los requisitos obligatorios aprobados aparece como documentalmente completo.
  - CA-087: La ausencia de un documento obligatorio impide completar el trámite cuando la normativa configurada así lo exija.
  - CA-088: Un documento opcional faltante no bloquea el trámite.
  - CA-089: Un documento vencido cambia de estado conforme a su fecha, sin modificar el historial de matrículas.
  - CA-090: Una exención autorizada queda registrada y no puede concederla un rol sin permiso.
  - CA-091: La sustitución de un archivo conserva la versión anterior, el autor del cambio y la fecha.
  - CA-092: La lista de pendientes se mantiene consistente tras actualizar o recargar la sesión.
- **Estado:** Pendiente

---

<!-- ID: TAREA-F6-019 | Fuentes: completadas.md -->
### [ ] [TAREA-F6-019] Fortalecer la trazabilidad del expediente y la consulta del historial institucional
- **Origen del Hallazgo:** `AUDITORIA_FASE_6_EXPEDIENTE_CICLO_VIDA.md` / Tarea 5 (P2 · Integridad Histórica)
- **Prioridad:** P2
- **Severidad/Clasificación:** Medio (Trazabilidad y auditoría administrativa)
- **Archivos Involucrados:**
  - `backend/academic-service/Code.gs`
  - `backend/user-service/Code.gs`
  - `dashboard-secretaria.html`
  - `js/secretary.js`
  - `js/teacher.js`
- **Dependencias Expuestas:** `getStudentTimeline`, `MovimientosEstudiante`, `Matriculas`, `HistorialCambiosEntidad`, `getEntityAuditHistory`
- **Descripción del Alcance:**
  Consolidar en una vista cronológica completa y auditable todos los eventos del ciclo de vida del expediente para uso administrativo y legal.

  Requisitos Funcionales:
  1. Consolidar cronológicamente: conversión desde admisión, matrículas, renovaciones, cambios de grado/sección/jornada, promociones, repitencias, retiros, traslados, reincorporaciones, graduación, revisión de documentos, cambios de tutores y correcciones administrativas.
  2. Cada evento debe mostrar: fecha/hora, tipo, autor/sistema, periodo escolar, resultado y referencia al registro original.
  3. Diferenciar claramente la situación actual de los antecedentes históricos.
  4. Registrar correcciones históricas autorizadas como nuevos eventos de auditoría conservando el valor anterior, valor nuevo, responsable y motivo.
  5. Proteger la bitácora frente a ediciones ordinarias para evitar borrado silencioso de eventos.
  6. Incorporar filtros por año lectivo, categoría, responsable y tipo de movimiento, más búsqueda textual.
  7. Permitir exportar el historial a un formato legible respetando permisos y minimizando PII.
  8. Mantener trazabilidad de fusiones de expedientes relacionando origen, destino y elementos consolidados.
- **Criterios de Aceptación:**
  - CA-100: Una trayectoria con múltiples movimientos muestra los eventos en orden cronológico exacto.
  - CA-101: Las correcciones autorizadas son visibles como cambios posteriores, sin borrar la trazabilidad previa.
  - CA-102: Un usuario sin permiso no puede consultar valores sensibles anteriores a una modificación.
  - CA-103: Los filtros por año lectivo devuelven exclusivamente los eventos del periodo seleccionado.
  - CA-104: Las fusiones de expedientes conservan una relación verificable entre origen y destino.
  - CA-105: La exportación coincide con los registros que el usuario está autorizado a consultar.
- **Estado:** Pendiente

---

<!-- ID: TAREA-F6-020 | Fuentes: completadas.md -->
### [ ] [TAREA-F6-020] Mejorar la búsqueda global y la navegación operativa del expediente
- **Origen del Hallazgo:** `AUDITORIA_FASE_6_EXPEDIENTE_CICLO_VIDA.md` / Tarea 7 (P2 · Productividad Administrativa)
- **Prioridad:** P2
- **Severidad/Clasificación:** Medio (Navegación y productividad administrativa)
- **Archivos Involucrados:**
  - `js/ui-common.js`
  - `dashboard-secretaria.html`
  - `teacher-dashboard.html`
  - `js/secretary.js`
  - `js/teacher.js`
- **Dependencias Expuestas:** `searchGlobalOmnibox`, `findDuplicateStudents`, `ExpedientesEstudiantes`, `Matriculas`
- **Descripción del Alcance:**
  Optimizar la búsqueda global y la navegación del expediente para asegurar la localización rápida e inequívoca del estudiante, evitando errores de selección y clics innecesarios.

  Requisitos Funcionales:
  1. Permitir buscar por identificador de expediente, código de estudiante, DNI, nombres y apellidos.
  2. Normalizar mayúsculas, minúsculas, tildes y espacios sin alterar los datos persistidos.
  3. Distinguir coincidencias exactas de aproximadas e incluir identificadores secundarios para evitar confusión entre homónimos.
  4. Mostrar el estado institucional actual y periodo de matrícula en los resultados de búsqueda.
  5. Permitir filtrar por año lectivo, grado, sección, condición de matrícula y estado del expediente.
  6. Permitir acceso directo desde el resultado al expediente, documentos e historial.
  7. Mantener el contexto de búsqueda y filtros al navegar de ida y vuelta al expediente.
  8. Mostrar estados de carga, resultados vacíos, errores y falta de permisos de forma explícita.
  9. Enmascarar PII sensible (como DNI parcial) según los permisos del rol consultante.
  10. Ante coincidencias ambiguas, exigir selección manual en lugar de abrir automáticamente un expediente.
- **Criterios de Aceptación:**
  - CA-106: La búsqueda encuentra un estudiante por su identificador institucional o DNI.
  - CA-107: Variaciones de tildes o mayúsculas no impiden encontrar el registro.
  - CA-108: Homónimos se presentan como registros independientes claramente diferenciables.
  - CA-109: Un estudiante retirado o graduado puede localizarse indicando su estado real.
  - CA-110: Los fallos de conexión no se presentan como cero resultados.
  - CA-111: La navegación mantiene su funcionamiento en pantallas móviles y de escritorio.
- **Estado:** Pendiente

---

<!-- ID: TAREA-F6-023 | Fuentes: completadas.md -->
### [ ] [TAREA-F6-023] Desarrollar un resumen institucional del expediente orientado a cada perfil autorizado
- **Origen del Hallazgo:** `AUDITORIA_FASE_6_EXPEDIENTE_CICLO_VIDA.md` / Tarea 10 (P2 · Experiencia de Usuario)
- **Prioridad:** P2
- **Severidad/Clasificación:** Medio (UX y visualización unificada por rol)
- **Archivos Involucrados:**
  - `dashboard-secretaria.html`
  - `teacher-dashboard.html`
  - `student-dashboard.html`
  - `js/secretary.js`
  - `js/teacher.js`
  - `js/student.js`
- **Dependencias Expuestas:** `getStudentFile`, `getStudentEnrollments`, `getStudentDocuments`, `ROLE_PERMISSIONS`
- **Descripción del Alcance:**
  Crear una vista de resumen inicial del expediente contextualizada según el rol del usuario (Secretaría, Docente, Estudiante/Padre), sin duplicar lógica de almacenamiento.

  Requisitos Funcionales:
  1. Presentar resumen con: identidad institucional, estado actual, matrícula vigente, movimientos recientes, documentos pendientes y accesos directos autorizados.
  2. Secretaría ve datos administrativos completos para matrículas y trámites.
  3. Docente ve únicamente información académica y de grupo sin controles administrativos.
  4. Estudiante/Familia ve sus propios datos y los de sus estudiantes vinculados según permisos de vínculo.
  5. Diferenciar visualmente datos no disponibles por permisos de datos no registrados.
  6. Mostrar marcas de fecha de actualización de cada sección.
  7. Permitir navegación fluida desde el resumen hacia los detalles sin duplicar formularios.
  8. Ante fallos de sub-servicios, renderizar las secciones disponibles e indicar el fallo de la sección afectada.
  9. Garantizar diseño adaptable e intuitivo en móviles.
- **Criterios de Aceptación:**
  - CA-122: Cada perfil visualiza exclusivamente las secciones autorizadas para su rol.
  - CA-123: El estado de matrícula coincide con el registro oficial.
  - CA-124: El fallo de un módulo no rompe la carga del resto del resumen.
  - CA-125: Los datos históricos se distinguen visualmente de los actuales.
- **Estado:** Pendiente

---

<!-- ID: TAREA-F6-024 | Fuentes: completadas.md -->
### [ ] [TAREA-F6-024] Incorporar notificaciones y seguimiento de trámites del expediente
- **Origen del Hallazgo:** `AUDITORIA_FASE_6_EXPEDIENTE_CICLO_VIDA.md` / Tarea 11 (P2 · Automatización Administrativa)
- **Prioridad:** P2
- **Severidad/Clasificación:** Medio (Notificaciones y trámites)
- **Archivos Involucrados:**
  - `backend/user-service/Code.gs`
  - `backend/academic-service/Code.gs`
  - `dashboard-secretaria.html`
  - `js/secretary.js`
- **Dependencias Expuestas:** `sendMultiChannelNotification`, `SolicitudesAdmision`, `DocumentosEstudiante`, `Matriculas`
- **Descripción del Alcance:**
  Implementar notificaciones automáticas e hilos de seguimiento para eventos clave del expediente (documentos vencidos, renovaciones pendientes, traslados, resoluciones).

  Requisitos Funcionales:
  1. Generar notificaciones para: documentos pendientes/vencidos, matrículas incompletas, cambios de sección/grado, reincorporaciones, revisiones documentales.
  2. Configurar destinatarios según evento, rol y autorizaciones del vínculo familiar.
  3. Registrar fecha de emisión, canal, destinatario y estado de entrega.
  4. Ofrecer panel de seguimiento de trámites pendientes con filtros por estado y fecha.
  5. Evitar PII sensible en mensajes externos (SMS/WhatsApp/Email); remitir al portal autenticado.
  6. Evitar notificaciones duplicadas en reintentos de operación.
  7. Permitir configurar recordatorios y alertas con frecuencia parametrizable.
  8. Respetar preferencias y revocaciones de contacto del tutor.
- **Criterios de Aceptación:**
  - CA-126: La proximidad de vencimiento documental dispara la notificación configurada.
  - CA-127: Reintentar un trámite no genera múltiples notificaciones idénticas.
  - CA-128: Un tutor revocado no recibe notificaciones posteriores.
  - CA-129: El estado de entrega se registra sin bloquear el trámite si el canal falla.
- **Estado:** Pendiente

---

<!-- ID: TAREA-F6-025 | Fuentes: completadas.md -->
### [ ] [TAREA-F6-025] Crear un mecanismo de revisión y recuperación de fusiones de expedientes
- **Origen del Hallazgo:** `AUDITORIA_FASE_6_EXPEDIENTE_CICLO_VIDA.md` / Tarea 12 (P2 · Integridad de Identidad)
- **Prioridad:** P2
- **Severidad/Clasificación:** Medio (Auditoría y reversión de fusiones)
- **Archivos Involucrados:**
  - `backend/academic-service/Code.gs`
  - `dashboard-secretaria.html`
  - `js/secretary.js`
- **Dependencias Expuestas:** `findDuplicateStudents`, `mergeStudentFiles`, `ExpedientesEstudiantes`, `HistorialCambiosEntidad`
- **Descripción del Alcance:**
  Desarrollar una interfaz de pre-visualización comparativa antes de fusionar expedientes y un protocolo de auditoría/desvinculación controlada en caso de fusión errónea.

  Requisitos Funcionales:
  1. Mostrar cuadro comparativo lado a lado (datos personales, matrículas, documentos, tutores, historial) antes de confirmar la fusión.
  2. Resaltar contradicciones de datos para resolución manual antes de fusionar.
  3. Exigir confirmación explícita con motivo registrado, responsable y fecha.
  4. Preservar la relación entre el expediente origen (marcado 'Fusionado') y el expediente destino.
  5. Registrar en la bitácora la lista exacta de entidades transferidas.
  6. Proporcionar un procedimiento administrativo documentado para separar o corregir fusiones erróneas.
  7. Prohibir fusiones automáticas sin intervención del personal autorizado.
- **Criterios de Aceptación:**
  - CA-130: La fusión requiere revisión previa de contradicciones y confirmación explícita.
  - CA-131: Todas las entidades transferidas son rastreables hasta su expediente original.
  - CA-132: Los identificadores históricos del expediente origen se conservan y no se eliminan.
  - CA-133: El procedimiento de corrección permite restituir asociaciones erróneas.
- **Estado:** Pendiente

---

<!-- ID: TAREA-F6-026 | Fuentes: completadas.md -->
### [ ] [TAREA-F6-026] Incorporar informes administrativos y exportación controlada del expediente
- **Origen del Hallazgo:** `AUDITORIA_FASE_6_EXPEDIENTE_CICLO_VIDA.md` / Tarea 13 (P2 · Información Institucional)
- **Prioridad:** P2
- **Severidad/Clasificación:** Medio (Informes ejecutivos y exportación de datos)
- **Archivos Involucrados:**
  - `backend/academic-service/Code.gs`
  - `dashboard-secretaria.html`
  - `js/secretary.js`
- **Dependencias Expuestas:** `getStudentEnrollments`, `getStudentDocuments`, `ExpedientesEstudiantes`, `Matriculas`
- **Descripción del Alcance:**
  Construir un catálogo de informes administrativos sobre el estado y trayectoria de los expedientes con exportación en CSV/Excel y trazabilidad de descargas.

  Requisitos Funcionales:
  1. Generar reportes de: estado de expedientes (activos, retirados, traslados, graduados), matrículas por año/grado/sección/jornada, reincorporaciones, documentos faltantes/vencidos, inconsistencias.
  2. Incluir filtros por rango de fechas, grado, sección y estado.
  3. Exportación a CSV/Excel con minimización de datos (solo campos necesarios).
  4. Registrar en la bitácora de auditoría toda exportación masiva que contenga PII.
  5. Restringir la generación de reportes según los permisos del rol del usuario.
  6. Marcar claramente informes incompletos por fallos parciales de consulta.
- **Criterios de Aceptación:**
  - CA-134: Los reportes filtrados contienen exclusivamente registros del periodo y criterios seleccionados.
  - CA-135: La exportación CSV coincide exactamente con la grilla de datos visualizada.
  - CA-136: La descarga de información sensible queda registrada en la bitácora de trazabilidad.
  - CA-137: Usuarios sin permisos no pueden ejecutar exportaciones masivas.
- **Estado:** Pendiente

---

<!-- ID: TASK-384 | Fuentes: Pendientes.md ; pendientes/Secretaria/Pendientes.md -->
### [ ] [TASK-384] Gestión de transporte extraordinario, excursiones y eventos deportivos
- **Origen del Hallazgo:** `AUDITORIA_FASE_21_TRANSPORTE_SERVICIOS_COMPLEMENTARIOS.md` / Sección E (PT-21-38), Sección C (3.8) y Plan de Implementación TAREA 22
- **Prioridad:** P2
- **Severidad/Clasificación:** Media (Movilidad fuera de sede, visitas pedagógicas, torneos y autorizaciones firmadas)
- **Archivos Involucrados:**
  - `backend/accounting-service/Code.gs` (nuevas funciones `createExtraordinaryTrip`, `getExtraordinaryTrips`)
  - Hoja `TransporteViajesEspeciales`
  - `ActividadesExtracurriculares`
  - `SolicitudesAutorizacion`
- **Dependencias Expuestas:** `TransporteVehiculos`, `TransporteConductores`, `ActividadesExtracurriculares`
- **Descripción del Alcance:**
  No existe un módulo para organizar viajes fuera de las rutas regulares (visitas culturales, torneos intercolegiales).
  Requerimientos Funcionales Detallados:
  1. Viajes extraordinarios y autorizaciones:
     - Registrar destino, fecha/hora de ida y vuelta, docente responsable, vehículo y chofer habilitados.
     - Padrón de estudiantes participantes con verificación obligatoria de autorización firmada por los padres en el portal familiar (`SolicitudesAutorizacion`) antes de permitir el abordaje.
     - Lista de abordaje y regreso exclusiva con confirmación de cierre seguro de viaje.
- **Criterios de Aceptación:**
  - Se pueden crear viajes especiales sin desconfigurar las rutas regulares.
  - Se bloquea el abordaje de alumnos que no tengan autorización firmada de sus tutores.
  - Se genera el listado oficial de pasajeros para fines de seguro y logística.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 13910-13933; clave TASK-385; asignación única: Secretaria -->

---

<!-- ID: TASK-385 | Fuentes: Pendientes.md ; pendientes/Secretaria/Pendientes.md -->
### [ ] [TASK-385] Planificación anual de transporte y renovación de asignaciones
- **Origen del Hallazgo:** `AUDITORIA_FASE_21_TRANSPORTE_SERVICIOS_COMPLEMENTARIOS.md` / Sección C (3.7) y Plan de Implementación TAREA 23
- **Prioridad:** P2
- **Severidad/Clasificación:** Media (Planificación del ciclo lectivo siguiente, renovación masiva y transición académica)
- **Archivos Involucrados:**
  - `backend/accounting-service/Code.gs` (nueva función `cloneTransportSetupForNextYear`)
  - `TransporteRutas`
  - `TransporteAsignaciones`
- **Dependencias Expuestas:** `TransporteRutas`, `TransporteAsignaciones`, Matrícula escolar
- **Descripción del Alcance:**
  No se pueden preparar las rutas y asignaciones del siguiente año escolar sin alterar la operación activa del ciclo en curso.
  Requerimientos Funcionales Detallados:
  1. Entorno de planificación anual:
     - Crear un borrador de rutas y asignaciones para el próximo año lectivo basado en el ciclo anterior.
     - Excluir automáticamente a los estudiantes graduados o retirados.
     - Permitir ajustar paradas y unidades antes de publicarlas de forma definitiva en la fecha de inicio del nuevo ciclo escolar.
- **Criterios de Aceptación:**
  - Se prepara la planificación futura sin alterar la operación vigente.
  - Los alumnos retirados se excluyen de la renovación automática.
  - Los ciclos lectivos conservan historiales de asignación independientes.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 14031-14053; clave TASK-390; asignación única: Secretaria -->

---

<!-- ID: TASK-390 | Fuentes: Pendientes.md ; pendientes/Secretaria/Pendientes.md -->
### [ ] [TASK-390] Integración con calendario académico y suspensión en días no lectivos
- **Origen del Hallazgo:** `AUDITORIA_FASE_21_TRANSPORTE_SERVICIOS_COMPLEMENTARIOS.md` / Sección C (1.21) y Plan de Implementación TAREA 28
- **Prioridad:** P2
- **Severidad/Clasificación:** Media (Coherencia operativa, suspensión automática en feriados y avisos familiares)
- **Archivos Involucrados:**
  - `backend/accounting-service/Code.gs`
  - `CalendarioInstitucional`
  - `TransporteRutas`
- **Dependencias Expuestas:** `CalendarioInstitucional`, `F11-Task06`, `sendMultiChannelNotification`
- **Descripción del Alcance:**
  Las rutas no están vinculadas con los días no lectivos del calendario escolar, generando avisos innecesarios en feriados o vacaciones.
  Requerimientos Funcionales Detallados:
  1. Sincronización con calendario escolar:
     - Consultar días lectivos y feriados en `CalendarioInstitucional`.
     - Suspender automáticamente la programación de rutas ordinarias en días no lectivos.
     - Notificar con anticipación a las familias ante suspensiones de servicio por asuetos o jornadas pedagógicas.
- **Criterios de Aceptación:**
  - No se programan recorridos ordinarios en días marcados como feriado o no lectivo.
  - Se despachan avisos oportunos a las familias sobre la suspensión del servicio.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 14104-14133; clave TASK-393; asignación única: Secretaria -->

---

<!-- ID: TASK-393 | Fuentes: Pendientes.md ; pendientes/Secretaria/Pendientes.md -->
### [ ] [TASK-393] OCR y extracción asistida de información documental
- **Origen del Hallazgo:** `AUDITORIA_FASE_22_GESTION_DOCUMENTAL_FORMULARIOS_FIRMA_ELECTRONICA.md` / Sección E (F22-30), Sección C (2.22) y Plan de Trabajo TAREA 22-11
- **Prioridad:** P2
- **Severidad/Clasificación:** Media (Productividad en secretaría, digitalización ágil y extracción de datos en partidas de nacimiento)
- **Archivos Involucrados:**
  - `backend/user-service/Code.gs` (nueva función `extractDocumentDataOCR`)
  - Google Drive OCR API
- **Dependencias Expuestas:** Repositorio documental, validación de archivos, expedientes y servicio OCR.
- **Descripción del Alcance:**
  La plataforma no dispone de reconocimiento óptico de caracteres para extraer información de documentos escaneados, obligando a transcribir manualmente datos de certificados y partidas de nacimiento.
  Requerimientos Funcionales Detallados:
  1. Extracción óptica asistida (OCR):
     - Incorporar OCR para documentos PDF escaneados e imágenes de uso frecuente: Partidas de nacimiento, Certificados de estudio, Identificaciones (DNI), Constancias y Documentos de admisión.
     - Extraer campos configurables: Nombre, Apellidos, Fecha de nacimiento, Número de identidad, Lugar de nacimiento, Nombres de tutores, Fechas de emisión e Institución emisora.
  2. Revisión humana obligatoria:
     - Mostrar los datos extraídos en una interfaz de revisión indicando nivel de confianza o campos dudosos.
     - Permitir corregir manualmente la información.
     - Conservar el documento original y registrar quién confirmó los datos.
     - Prohibir taxativamente sobrescribir información institucional existente sin autorización y confirmación humana.
- **Criterios de Aceptación:**
  - [ ] Se puede procesar un PDF escaneado o imagen de documento oficial.
  - [ ] Los datos extraídos se presentan en pantalla para revisión previa.
  - [ ] Los campos dudosos se identifican visualmente.
  - [ ] La persona autorizada puede corregir los resultados antes de guardar.
  - [ ] No se modifican registros institucionales sin confirmación humana explícita.
  - [ ] El documento original permanece íntegro y disponible.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 14134-14165; clave TASK-394; asignación única: Secretaria -->

---

<!-- ID: TASK-394 | Fuentes: Pendientes.md ; pendientes/Secretaria/Pendientes.md -->
### [ ] [TASK-394] Importación y exportación masiva de documentos y metadatos
- **Origen del Hallazgo:** `AUDITORIA_FASE_22_GESTION_DOCUMENTAL_FORMULARIOS_FIRMA_ELECTRONICA.md` / Sección E (F22-32), Sección C (2.24) y Plan de Trabajo TAREA 22-12
- **Prioridad:** P2
- **Severidad/Clasificación:** Media (Migración de archivos históricos, respaldo masivo y exportación estructurada)
- **Archivos Involucrados:**
  - `backend/accounting-service/Code.gs`
  - `backend/user-service/Code.gs`
  - Google Drive API
- **Dependencias Expuestas:** Repositorio documental, expedientes, permisos y almacenamiento de Drive.
- **Descripción del Alcance:**
  La importación y exportación documental está parcialmente implementada y no proporciona un mecanismo completo para migrar, consultar o administrar grandes volúmenes de documentos institucionales.
  Requerimientos Funcionales Detallados:
  1. Importación masiva con metadatos:
     - Permitir importar documentos acompañados de sus metadatos desde archivos estructurados (CSV y XLSX): Identificador del estudiante/empleado, Tipo documental, Categoría, Fecha, Descripción, Estado y Relación con expediente.
     - Asociar los archivos físicos con los registros importados validando relaciones e identificadores.
     - Detectar duplicados por hash SHA-256 e identificadores.
     - Mostrar vista previa de los registros antes de confirmar.
  2. Exportación masiva y respaldos:
     - Permitir exportar listados de metadatos según filtros y permisos RBAC.
     - Descargar documentos seleccionados individualmente o en archivo comprimido ZIP.
     - Registrar el resultado de cada importación y permitir reanudar procesos interrumpidos sin duplicar registros.
- **Criterios de Aceptación:**
  - [ ] Se pueden importar metadatos desde archivos CSV o XLSX.
  - [ ] Los archivos físicos se asocian con los registros correspondientes.
  - [ ] Se detectan y alertan registros duplicados por hash.
  - [ ] Los errores se muestran claramente antes de confirmar la importación.
  - [ ] Se exporta información filtrada respetando estrictamente los permisos.
  - [ ] Las operaciones interrumpidas pueden recuperarse sin duplicar información.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 14243-14272; clave TASK-398; asignación única: Secretaria -->

---

<!-- ID: TASK-435 | Fuentes: Pendientes.md ; pendientes/Secretaria/Pendientes.md -->
### [ ] [TASK-435] [P2] Manuales Operativos y Guías de Usuario por Departamento con Ayuda Contextual
- **Orden de Ejecución:** 17
- **Prioridad:** P2 (Media)
- **Componentes Afectados:**
  - `docs/manuals/` (`manual-direccion.md`, `manual-secretaria.md`, `manual-coordinacion.md`, `manual-docentes.md`, `manual-contabilidad.md`, `manual-rrhh.md`, `manual-operaciones.md`, `manual-estudiantes-familias.md`, `manual-administracion-tecnica.md`)
  - `js/ui-common.js` (modal interactivo de ayuda contextual y buscador)
- **Subcapacidades Relacionadas:** F30-11.
- **Origen del Hallazgo:** `AUDITORIA_FASE_30_CONSOLIDACION_CERTIFICACION_MEJORA_CONTINUA.md` / Sección C (F30-11).
- **Problema Detectado y Riesgos:**
  Existe documentación técnica de arquitectura, pero faltan manuales de usuario final orientados a procedimientos integrales por rol. Los usuarios dependen continuamente del equipo de desarrollo para solventar inquietudes operativas rutinarias.
- **Requisitos Funcionales y Técnicos Convergentes:**
  1. *Manuales por departamento y rol:*
     - Dirección, Secretaría, Coordinación Académica, Docentes, Contabilidad/Tesorería, Recursos Humanos, Operaciones, Estudiantes, Padres/Tutores y Administración Técnica.
     - Contenido por procedimiento: propósito, requisitos previos, roles necesarios, paso a paso detallado, datos requeridos, validaciones del sistema, documentos emitidos, notificaciones automáticas, errores comunes y acciones de contingencia.
  2. *Referencias visuales y actualización gráfica:*
     - Capturas de pantalla actualizadas y diagramas de flujo de trabajo reales.
     - Explicación de estados de trámites, matrículas, notas, pagos y cierres de actas.
  3. *Ayuda contextual integrada y versionado:*
     - Botón de ayuda interactiva en cada dashboard que abre la guía correspondiente a la vista activa.
     - Motor de búsqueda por palabras clave y categorías temáticas.
     - Versionado de manuales con registro de fecha de última revisión.
     - Procedimiento para reportar errores técnicos adjuntando evidencias sin exponer datos PII innecesarios.
- **Criterios de Aceptación:**
  - [ ] Cada rol institucional dispone de su manual correspondiente publicado y accesible desde el panel.
  - [ ] Los procedimientos coinciden fielmente con el comportamiento real del sistema.
  - [ ] El buscador de ayuda contextual retorna guías relevantes por rol y palabra clave.
  - [ ] Las actualizaciones de software desencadenan la revisión de los manuales afectados.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 15887-15912; clave TASK-440; asignación única: Secretaria -->

---

<!-- ID: TASK-440 | Fuentes: Pendientes.md ; pendientes/Secretaria/Pendientes.md -->
### [ ] [TASK-440] [F31-T17] [P2] Optimización de Experiencia Móvil, Accesibilidad y Usabilidad del Diseñador
- **Orden de Ejecución:** 19
- **Prioridad:** P2 (Media)
- **Componentes Afectados:**
  - `js/ui-common.js`, `js/teacher.js`, `css/style.css`
- **Subcapacidades Relacionadas:** F31-18.
- **Origen del Hallazgo:** `AUDITORIA_FASE_31_DISENADOR_UNIVERSAL_DOCUMENTOS_PLANTILLAS.md` / Sección B (F31-18) y Backlog de Implementación F31-T17.
- **Problema o Carencia:**
  Las herramientas de diseño visual y edición de campos superpuestos sobre PDF presentan limitaciones en dispositivos móviles (dificultad para arrastrar con precisión táctil, controles fuera de vista o menús contextuales invasivos).
- **Requisitos Funcionales y Técnicos Convergentes:**
  1. *Adaptación táctil del editor visual:*
     - Controles táctiles precisos para mover, redimensionar y alinear cajas de texto superpuestas en pantallas pequeñas.
     - Soporte para gestos de pellizco para zoom (pinch-to-zoom) y desplazamiento panorámico sin deseleccionar elementos.
     - Modo de previsualización de lectura independiente de las barras de herramientas de edición.
  2. *Accesibilidad WCAG 2.2 AA y formularios móviles:*
     - Formularios multipágina optimizados para diligenciamiento vertical sin desplazamientos horizontales.
     - Navegación por teclado completa con indicador de foco visible en todos los botones y campos interactivos.
     - Contraste de colores accesible, mensajes de validación contextuales junto al campo correspondiente y soporte para lectores de pantalla (`aria-live`).
- **Criterios de Aceptación:**
  - [ ] Se puede completar y firmar un formulario institucional multipágina desde un teléfono móvil con fluidez.
  - [ ] Se pueden ajustar campos superpuestos con precisión táctil sin desbordar el área visible.
  - [ ] Cumple con las pautas de accesibilidad WCAG 2.2 AA en contrastes, etiquetas y navegación asistida.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 15913-15941; clave TASK-441; asignación única: Secretaria -->

---

<!-- ID: TASK-441 | Fuentes: Pendientes.md ; pendientes/Secretaria/Pendientes.md -->
### [ ] [TASK-441] [F31-T18] [P2] Generación de Códigos QR Dinámicos y Verificación Documental CUV Ampliada
- **Orden de Ejecución:** 20
- **Prioridad:** P2 (Media)
- **Componentes Afectados:**
  - `backend/accounting-service/Code.gs` (`injectQRCodeInDocumentPdf`, `verifySchoolDocumentByCUV`)
  - `js/teacher.js`
  - Hoja: `DocumentosEscolaresEmitidos`
- **Subcapacidades Relacionadas:** F31-23.
- **Origen del Hallazgo:** `AUDITORIA_FASE_31_DISENADOR_UNIVERSAL_DOCUMENTOS_PLANTILLAS.md` / Sección B (F31-23) y Backlog de Implementación F31-T18.
- **Problema o Carencia:**
  Actualmente el Código Único de Verificación (CUV) se plasma únicamente como texto alfanumérico, exigiendo que terceros que deseen autenticar un certificado deban escribir manualmente el código en lugar de escanear un código QR con su smartphone.
- **Requisitos Funcionales y Técnicos Convergentes:**
  1. *Generación e incrustación de Código QR:*
     - Generar automáticamente código QR dinámico por cada documento emitido que encadene la URL oficial de verificación: `https://[dominio]/verify?cuv=CUV-YYYY-XXXXXX`.
     - Configurar tamaño, posición y visibilidad del QR en la plantilla (membrete o pie de página).
     - Garantizar contraste y legibilidad óptima tanto en pantalla como al imprimir en blanco y negro.
  2. *Portal público de verificación seguro:*
     - Desplegar resultado oficial: estado del documento (`Válido`, `Revocado`, `Sustituido`), fecha de emisión, tipo documental, nombre del titular y emisor institucional.
     - Protección estricta de datos personales: no exponer notas individuales confidenciales, teléfonos ni direcciones en la consulta pública.
     - Registro de auditoría de consultas de verificación para detectar posibles sondeos maliciosos.
- **Criterios de Aceptación:**
  - [ ] Cada documento oficial emitido incorpora un código QR escaneable y nítido.
  - [ ] Al escanear el QR se abre la página oficial confirmando la validez del documento en menos de 2 segundos.
  - [ ] La consulta pública no expone información sensible protegida por la ley de privacidad.
  - [ ] El QR permanece asociado de forma inmutable al documento emitido.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 15942-15968; clave TASK-442; asignación única: Secretaria -->

---

<!-- ID: TASK-442 | Fuentes: Pendientes.md ; pendientes/Secretaria/Pendientes.md -->
### [ ] [TASK-442] [F31-T19] [P2] Plantillas Multilingües Sincronizadas y Localización Documental
- **Orden de Ejecución:** 21
- **Prioridad:** P2 (Media)
- **Componentes Afectados:**
  - `backend/accounting-service/Code.gs` (`configureMultilingualDocumentTemplate`, `getLocalizedTemplateContent`)
  - Hoja: `PlantillasEscolares`
- **Subcapacidades Relacionadas:** F31-23.
- **Origen del Hallazgo:** `AUDITORIA_FASE_31_DISENADOR_UNIVERSAL_DOCUMENTOS_PLANTILLAS.md` / Sección B (F31-23) y Backlog de Implementación F31-T19.
- **Problema o Carencia:**
  Para emitir documentos en otros idiomas (como constancias en inglés para aplicaciones al extranjero), las instituciones suelen duplicar plantillas de forma manual, ocasionando desincronización de formatos y divergencias de mantenimiento.
- **Requisitos Funcionales y Técnicos Convergentes:**
  1. *Estructura multilingüe sincronizada:*
     - Asociar múltiples variantes lingüísticas (Español / Inglés) a una misma plantilla lógica maestra.
     - Mantener idénticos los identificadores de variables dinámicas, reglas de formato y esquemas de CUV.
     - Permitir traducir textos fijos, etiquetas y encabezados sin alterar el origen de los datos institucionales.
  2. *Localización y selección en emisión:*
     - Selector de idioma al momento de emitir el documento individual o por lotes.
     - Aplicación de formatos regionales correspondientes al idioma seleccionado (fechas y puntuación decimal).
     - Advertir al usuario si una variante lingüística se encuentra desactualizada respecto a la plantilla principal.
- **Criterios de Aceptación:**
  - [ ] Se pueden crear y vincular traducciones oficiales dentro de una misma plantilla maestra.
  - [ ] El documento se genera en el idioma elegido manteniendo la sustitución exacta de las variables dinámicas.
  - [ ] Los correlativos y códigos CUV se mantienen consistentes independientemente del idioma de emisión.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 15969-15995; clave TASK-443; asignación única: Secretaria -->

---

<!-- ID: TASK-443 | Fuentes: Pendientes.md ; pendientes/Secretaria/Pendientes.md -->
### [ ] [TASK-443] [F31-T20] [P2] Revisión Colaborativa y Comentarios sobre Plantillas
- **Orden de Ejecución:** 22
- **Prioridad:** P2 (Media)
- **Componentes Afectados:**
  - `backend/accounting-service/Code.gs` (`addTemplateReviewComment`, `getTemplateReviewComments`, `resolveTemplateReviewComment`)
  - `js/teacher.js`
  - Hoja: `ComentariosRevisionPlantillas`
- **Subcapacidades Relacionadas:** F31-14, F31-20, F31-23.
- **Origen del Hallazgo:** `AUDITORIA_FASE_31_DISENADOR_UNIVERSAL_DOCUMENTOS_PLANTILLAS.md` / Sección B (F31-14, F31-23) y Backlog de Implementación F31-T20.
- **Problema o Carencia:**
  La creación y ajuste de nuevas plantillas institucionales antes de su aprobación carece de un espacio de comunicación interna formal, obligando a coordinadores, secretaría y dirección a realizar observaciones fuera del sistema.
- **Requisitos Funcionales y Técnicos Convergentes:**
  1. *Comentarios y notas de revisión:*
     - Permitir a revisores autorizados insertar comentarios asociados al documento completo o a fragmentos específicos.
     - Registrar autor, fecha y hora, estado de la observación (`Pendiente`, `Resuelta`, `Descartada`) y respuestas en hilo.
     - Solicitar modificaciones formales al creador de la plantilla antes de elevarla a publicación.
  2. *Aislamiento y trazabilidad:*
     - Los comentarios de revisión son de carácter estrictamente interno y no aparecen jamás en el documento PDF emitido.
     - Condicionar la aprobación directiva final a la resolución de las observaciones obligatorias pendientes.
- **Criterios de Aceptación:**
  - [ ] Los revisores pueden dejar y responder observaciones sobre versiones en borrador.
  - [ ] Las notas de revisión se conservan para auditoría y nunca se filtran al archivo final generado.
  - [ ] Se restringe la visualización de comentarios según el departamento y roles autorizados.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 15996-16021; clave TASK-444; asignación única: Secretaria -->

---

<!-- ID: TASK-444 | Fuentes: Pendientes.md ; pendientes/Secretaria/Pendientes.md -->
### [ ] [TASK-444] [F31-T21] [P2] Búsqueda Avanzada, Clasificación y Administración del Repositorio Documental
- **Orden de Ejecución:** 23
- **Prioridad:** P2 (Media)
- **Componentes Afectados:**
  - `backend/accounting-service/Code.gs` (`searchDocumentRepositoryAdvanced`, `manageDocumentCategoriesAndTags`)
  - `js/teacher.js`, `js/ui-common.js`
- **Subcapacidades Relacionadas:** F31-12.
- **Origen del Hallazgo:** `AUDITORIA_FASE_31_DISENADOR_UNIVERSAL_DOCUMENTOS_PLANTILLAS.md` / Sección B (F31-12) y Backlog de Implementación F31-T21.
- **Problema o Carencia:**
  El catálogo actual filtra plantillas básicas por departamento y categoría, pero a medida que el acervo documental crece con cientos de emisiones y plantillas departamentales, se requiere una búsqueda avanzada y clasificación ágil para localizar archivos sin latencia.
- **Requisitos Funcionales y Técnicos Convergentes:**
  1. *Búsqueda avanzada y filtros combinados:*
     - Búsqueda por nombre, código interno, descripción, categoría, departamento, etiquetas personalizadas y responsable.
     - Filtros por estado: Activas, En Borrador, En Revisión, Aprobadas, Archivadas y Obsoletas.
     - Búsqueda de documentos emitidos por CUV, número correlativo, estudiante, empleado o fecha de emisión.
  2. *Organización y acceso seguro:*
     - Marcado de plantillas favoritas y lista de documentos utilizados recientemente.
     - Aplicación estricta de permisos RBAC sobre los resultados para impedir que usuarios no autorizados descubran la existencia de documentos confidenciales.
- **Criterios de Aceptación:**
  - [ ] Los filtros de búsqueda se combinan de forma fluida retornando resultados en menos de 1 segundo.
  - [ ] Es posible localizar cualquier documento emitido mediante su CUV o número correlativo.
  - [ ] Los resultados de búsqueda respetan rigurosamente el alcance de permisos del usuario en sesión.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 16077-16102; clave TASK-447; asignación única: Secretaria -->

---

<!-- ID: TASK-447 | Fuentes: Pendientes.md ; pendientes/Secretaria/Pendientes.md -->
### [ ] [TASK-447] [P2] Detector Heurístico de Líneas Guía, Casillas y Espacios de Captura
- **Orden de Ejecución:** 11
- **Prioridad:** P2 (Media)
- **Componentes Afectados:**
  - `js/teacher.js` (`detectFormLinesHeuristic`, `suggestOverlayFieldsFromCanvas`)
- **Subcapacidades Relacionadas:** F32-02.
- **Origen del Hallazgo:** `AUDITORIA_FASE_32_EDITOR_VISUAL_PDF_CAMPOS_SUPERPUESTOS.md` / Sección B (2), Sección G y Backlog F32-Task09.
- **Problema Detectado y Riesgos:**
  Los documentos preimpresos suelen contener patrones repetitivos de líneas de llenado o casillas de verificación que actualmente obligan al diseñador a colocar manualmente cada recuadro uno por uno.
- **Requisitos Funcionales y Técnicos Convergentes:**
  1. *Análisis visual de píxeles en Canvas:*
     - Analizar la matriz de imagen del PDF renderizado en busca de líneas horizontales continuas y rectángulos vacíos.
     - Identificar posibles casillas de verificación (cuadrados de 10 a 20 pt) y líneas de escritura.
     - Estimar dimensiones y proponer cajas sugeridas posicionadas automáticamente sobre las áreas detectadas.
  2. *Revisión y confirmación humana:*
     - Mostrar las sugerencias como cajas preliminares resaltadas con borde punteado.
     - Permitir al diseñador aceptar, ajustar o descartar individualmente o en bloque las sugerencias.
     - La detección heurística opera como un asistente acelerador, sin sustituir jamás la aprobación humana.
- **Criterios de Aceptación:**
  - [ ] Identifica con éxito líneas de llenado y casillas en formularios estructurados.
  - [ ] El diseñador puede aceptar o rechazar sugerencias con un solo clic.
  - [ ] Las cajas aceptadas se integran normalmente al conjunto de campos con coordenadas normalizadas.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 16103-16128; clave TASK-448; asignación única: Secretaria -->

---

<!-- ID: TASK-448 | Fuentes: Pendientes.md ; pendientes/Secretaria/Pendientes.md -->
### [ ] [TASK-448] [P2] Motor OCR y Reconocimiento Semántico Asistido para Documentos Escaneados
- **Orden de Ejecución:** 12
- **Prioridad:** P2 (Media)
- **Componentes Afectados:**
  - `backend/developer-service/Code.gs` (`processScannedPdfOcrRecognition`)
  - `js/teacher.js`
- **Subcapacidades Relacionadas:** F32-02, F32-10.
- **Origen del Hallazgo:** `AUDITORIA_FASE_32_EDITOR_VISUAL_PDF_CAMPOS_SUPERPUESTOS.md` / Sección B (2, 10), Sección G y Backlog F32-Task10.
- **Problema Detectado y Riesgos:**
  Los documentos escaneados antiguos que carecen de texto digital seleccionable no ofrecen detección automática de etiquetas impresas ("Nombre del Estudiante:", "Grado:"), obligando a una transcripción manual.
- **Requisitos Funcionales y Técnicos Convergentes:**
  1. *Detección de contenido escaneado:*
     - Comprobar si las páginas contienen texto digital seleccionable (`page.getTextContent()`).
     - Si la página es predominantemente una imagen de mapa de bits, advertir al usuario y sugerir escaneo OCR asistido.
  2. *Reconocimiento semántico asistido:*
     - Conexión opcional con motor OCR ligero para extraer palabras clave y coordenadas aproximadas en español.
     - Proponer campos de texto situados a la derecha de etiquetas reconocidas ("Nombre:", "DNI:").
     - Mantener el PDF escaneado original intacto en el fondo sin alteraciones destructivas de píxeles.
- **Criterios de Aceptación:**
  - [ ] Detecta con precisión si un PDF requiere OCR y emite la recomendación pertinente.
  - [ ] Las sugerencias semánticas reconocen etiquetas comunes en documentos escolares en español.
  - [ ] El archivo PDF original permanece inalterado.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 16129-16159; clave TASK-449; asignación única: Secretaria -->

---

<!-- ID: TASK-449 | Fuentes: Pendientes.md ; pendientes/Secretaria/Pendientes.md -->
### [ ] [TASK-449] [P2] Biblioteca de Plantillas, Duplicación y Reutilización de Formatos Institucionales
- **Orden de Ejecución:** 13
- **Prioridad:** P2 (Media)
- **Componentes Afectados:**
  - `backend/accounting-service/Code.gs` (`duplicateSchoolDocumentTemplate`, `getPreloadedSchoolFormTemplates`)
  - `teacher-dashboard.html`, `js/teacher.js`
  - Hoja: `PlantillasEscolares`
- **Subcapacidades Relacionadas:** F32-01, F32-09.
- **Origen del Hallazgo:** `AUDITORIA_FASE_32_EDITOR_VISUAL_PDF_CAMPOS_SUPERPUESTOS.md` / Sección B (1, 9), Sección H y Backlog F32-Task12.
- **Problema Detectado y Riesgos:**
  Para diseñar formatos con pequeñas variaciones (excusas de primaria vs secundaria, o constancias de conducta), los secretarios deben recrear todos los campos desde cero si no pueden clonar plantillas existentes.
- **Requisitos Funcionales y Técnicos Convergentes:**
  1. *Duplicación de plantillas con un solo clic:*
     - Duplicar una plantilla PDF existente clonando su PDF base, metadatos y la totalidad de sus `overlayFields` bajo un nuevo `plantillaId` y título editable.
     - La nueva plantilla es completamente independiente: sus modificaciones posteriores no alteran la plantilla matriz ni los documentos emitidos bajo versiones previas.
  2. *Catálogo de formatos escolares hondureños precargados:*
     - Biblioteca de formatos institucionales de uso frecuente: Excusas estudiantiles por inasistencia, Solicitud de matrícula ordinaria, Compromiso de convivencia y Pagaré de colegiatura.
     - Permitir a la institución subir sus propios formatos preimpresos y clasificarlos por categoría y ciclo lectivo.
     - Archivo controlado de plantillas obsoletas impidiendo su uso en nuevos trámites pero preservando el histórico.
- **Criterios de Aceptación:**
  - [ ] Permite clonar cualquier plantilla PDF conservando el 100% de sus campos y coordenadas.
  - [ ] La copia es independiente y puede editarse sin afectar la plantilla original ni los registros históricos.
  - [ ] La biblioteca de formatos permite iniciar nuevos trámites a partir de plantillas modelo precargadas.
- **Estado:** [ ] Pendiente

---

<!-- ID: TASK-451 | Fuentes: Pendientes.md ; pendientes/Secretaria/Pendientes.md -->
### [ ] [TASK-451] [P2] Constancias de Recepción Física con Código QR y Verificación Documental
- **Orden de Ejecución:** 9
- **Prioridad:** P2 (Media)
- **Componentes Afectados:**
  - `backend/accounting-service/Code.gs` (`generatePhysicalFilingReceiptPdf`)
  - `backend/user-service/Code.gs`
  - Hoja: `ConstanciasRecepcionFisica`, `SolicitudesTramites`
- **Subcapacidades Relacionadas:** F33-03, F33-13.
- **Origen del Hallazgo:** `AUDITORIA_FASE_33_FORMULARIOS_INSTITUCIONALES_TRAMITES_DIGITALES.md` / Sección C (F33-03, F33-13) y Plan de Implementación F33-Task09.
- **Problema Detectado y Riesgos:**
  Al radicar un trámite en ventanilla física, el solicitante requiere un comprobante institucional descargable o imprimible que certifique la entrega de documentos, la fecha y el funcionario receptor, permitiendo seguimiento mediante código QR.
- **Requisitos Funcionales y Técnicos Convergentes:**
  1. *Generación automática de constancia de radicación en PDF:*
     - Emitir comprobante al registrar una recepción física con: membrete institucional, identificador de radicación, número de solicitud, titular, persona que entrega, fecha/hora, funcionario receptor, relación de documentos entregados y observaciones.
     - Soporte para recepciones parciales: señalar claramente qué documentos se recibieron y cuáles quedan pendientes.
     - Generación de constancias complementarias vinculadas a la radicación inicial.
  2. *Código QR de seguimiento en línea:*
     - Incrustar código QR que conduzca a la página oficial de verificación de estado del trámite sin exponer datos sensibles no autenticados.
     - Permitir reimprimir la constancia manteniendo el identificador y fecha de emisión original.
- **Criterios de Aceptación:**
  - [ ] Al radicar documentos en ventanilla se emite de inmediato la constancia PDF con código QR.
  - [ ] El código QR permite a la familia consultar el estado del trámite escaneándolo con su teléfono.
  - [ ] Las recepciones parciales identifican con total claridad los documentos pendientes de entrega.
  - [ ] La constancia queda indexada en el expediente institucional del estudiante.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 16208-16235; clave TASK-452; asignación única: Secretaria -->

---

<!-- ID: TASK-452 | Fuentes: Pendientes.md ; pendientes/Secretaria/Pendientes.md -->
### [ ] [TASK-452] [P2] Paquetes de Trámites Agrupados y Solicitudes Recurrentes Anuales
- **Orden de Ejecución:** 10
- **Prioridad:** P2 (Media)
- **Componentes Afectados:**
  - `backend/user-service/Code.gs` (`createBundleFormRequest`, `getBundleRequestProgress`)
  - `js/student.js`
  - Hoja: `PaquetesTramites`
- **Subcapacidades Relacionadas:** F33-01, F33-03.
- **Origen del Hallazgo:** `AUDITORIA_FASE_33_FORMULARIOS_INSTITUCIONALES_TRAMITES_DIGITALES.md` / Sección C (F33-01) y Plan de Implementación F33-Task08.
- **Problema Detectado y Riesgos:**
  En temporadas de matrícula o inicio de año escolar, los padres deben buscar y llenar múltiples trámites independientes (matrícula, ficha médica, transporte, salidas autorizadas), generando fatiga de captura y solicitudes incompletas.
- **Requisitos Funcionales y Técnicos Convergentes:**
  1. *Paquetes de trámites encadenados (Bundles):*
     - Agrupar varios formularios relacionados bajo un solo proceso guiado con barra de progreso consolidada.
     - Reutilización de datos compartidos: los datos generales ingresados en el primer formulario se propagan automáticamente a los demás del paquete sin duplicar captura.
     - Mantener expedientes individuales e independientes para cada formulario del paquete, respetando sus propios flujos de revisión.
  2. *Solicitudes recurrentes y campañas anuales:*
     - Generar paquetes de actualización periódica anual con precarga de datos del año anterior para confirmación o modificación de variaciones.
     - Asignar paquetes masivamente a grupos de estudiantes por grado o sección con monitoreo directivo de avance global.
- **Criterios de Aceptación:**
  - [ ] Las familias pueden completar un paquete de trámites agrupados en un solo recorrido fluido.
  - [ ] Los datos generales se comparten entre los formularios del paquete evitando capturas redundantes.
  - [ ] Cada trámite conserva su propio expediente y trazabilidad de aprobación individual.
  - [ ] La institución puede supervisar el porcentaje de avance global de la campaña por grado o sección.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 16240-16271; clave TASK-453; asignación única: Secretaria -->

---

<!-- ID: TASK-453 | Fuentes: Pendientes.md ; pendientes/Secretaria/Pendientes.md -->
### [ ] [TASK-453] [P2] Filtros multicriterio, búsqueda avanzada, paginación y ordenamiento reactivo
- **Prioridad:** P2 (Media / Mejora)
- **Orden de Ejecución:** 10 (Usabilidad y escalabilidad de consultas documentales)
- **Componentes Afectados:**
  - `backend/user-service/Code.gs` (`getAdministrativeRequestsAdvancedFilter`, `getDepartmentalWorkInbox`)
  - `js/student.js`, `js/accounting.js`
- **Subcapacidades Relacionadas:** F34-03, F34-08.
- **Origen del Hallazgo:** `AUDITORIA_FASE_34_BANDEJAS_REVISION_FIRMAS.md` / Sección C (F34-03), Matriz CAR-F34-09 y Especificación Técnica ChatGPT/Jules.
- **Problema Detectado y Riesgos:**
  Las consultas actuales poseen filtros básicos en memoria del cliente por usuario o estudiante. A medida que el volumen histórico de solicitudes crece (cientos o miles por año), transferir todos los registros al navegador causa lentitud, desbordamiento de memoria y carece de búsquedas por rangos de fechas, estado, departamento y prioridad combinadas.
- **Requerimientos Funcionales y Técnicos Convergentes:**
  1. *Motor de filtrado multicriterio en servidor:*
     - Incorporar filtros combinables en backend: por estudiante, empleado, departamento, remitente, destinatario, responsable asignado, tipo de trámite, rango de fechas, estado, prioridad y texto libre en asunto/descripción.
     - Permitir ordenamiento reactivo por: fecha de recepción, antigüedad, fecha de vencimiento SLA, prioridad y estado.
  2. *Paginación eficiente y estados visuales:*
     - Implementar paginación en servidor (`limite`, `offset`) para consultar grandes volúmenes sin sobrecargar el cliente.
     - Mantener los criterios de búsqueda al navegar entre páginas.
     - Botón de limpieza rápida de filtros y recuperación de la vista por defecto.
     - Estados visuales claros: cargando, sin coincidencias encontradas y error de consulta.
     - Garantizar que los filtros respeten las restricciones de autorización sin exponer datos de otros departamentos.
- **Criterios de Aceptación:**
  - [ ] Filtrar por estudiante y rango de fechas y comprobar que los resultados coinciden con exactitud.
  - [ ] Combinar simultáneamente estado, departamento y prioridad en una sola consulta.
  - [ ] Ordenar por antigüedad y verificar que los resultados respetan el orden seleccionado.
  - [ ] Navegar entre páginas y comprobar que los filtros se mantienen inalterados.
  - [ ] Limpiar los filtros y comprobar el restablecimiento de los resultados iniciales.
  - [ ] Comprobar que grandes volúmenes de datos se paginan eficientemente sin degradar el rendimiento del navegador.
- **Dependencias:** F34-Task08, servicios de consulta de bandejas.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 16272-16301; clave TASK-454; asignación única: Secretaria -->

---

<!-- ID: TASK-454 | Fuentes: Pendientes.md ; pendientes/Secretaria/Pendientes.md -->
### [ ] [TASK-454] [P2] Interfaz responsiva y experiencia móvil para bandejas documentales
- **Prioridad:** P2 (Media / Mejora)
- **Orden de Ejecución:** 11 (Accesibilidad táctil y movilidad en teléfonos)
- **Componentes Afectados:**
  - `js/student.js`, `js/teacher.js`, `js/accounting.js`
  - `student-dashboard.html`, `teacher-dashboard.html`, `dashboard-recursos-humanos.html`
- **Subcapacidades Relacionadas:** F34-01, F34-03, F34-11.
- **Origen del Hallazgo:** `AUDITORIA_FASE_34_BANDEJAS_REVISION_FIRMAS.md` / Sección E, Matriz CAR-F34-10 y Especificación Técnica ChatGPT/Jules.
- **Problema Detectado y Riesgos:**
  Las tablas de solicitudes institucionales presentan numerosas columnas que provocan desbordamiento horizontal en pantallas de teléfonos móviles. Padres, docentes y directivos que acceden desde smartphones encuentran dificultades para leer observaciones completas o presionar botones de acción táctiles, desincentivando la resolución ágil de trámites.
- **Requerimientos Funcionales y Técnicos Convergentes:**
  1. *Diseño responsivo basado en tarjetas táctiles:*
     - Adaptar las bandejas personales, departamentales y de salida: sustituir tablas extensas por tarjetas responsivas compactas en pantallas menores a 768px.
     - Cada tarjeta móvil debe sintetizar: identificador, estudiante o empleado, tipo de documento, estado con insignia de color, prioridad, fecha y responsable actual.
     - Botones de acción táctiles con dimensiones accesibles (mínimo 44x44px): Abrir, Revisar, Observar, Aprobar, Firmar e Historial.
  2. *Visor móvil de adjuntos y accesibilidad visual:*
     - Adaptar el visor de imágenes y documentos PDF para visualización fluida y zoom en pantallas pequeñas.
     - Identificar prioridades y estados mediante combinaciones de íconos, texto y color para asegurar accesibilidad a usuarios con daltonismo.
     - Preservar íntegra la funcionalidad completa en escritorios de pantalla ancha.
- **Criterios de Aceptación:**
  - [ ] Acceder a las bandejas desde teléfonos móviles y comprobar que no existe desbordamiento horizontal.
  - [ ] Visualizar los trámites en tarjetas responsivas con información clara y legible.
  - [ ] Abrir documentos adjuntos y verificar su correcta visualización en pantallas táctiles.
  - [ ] Ejecutar aprobaciones, observaciones y firmas directamente desde dispositivos móviles.
  - [ ] Los filtros y controles permanecen plenamente accesibles y operables de forma táctil.
- **Dependencias:** F34-Task10, componentes visuales de bandejas.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 16371-16401; clave TASK-457; asignación única: Secretaria -->

---

<!-- ID: TASK-457 | Fuentes: Pendientes.md ; pendientes/Secretaria/Pendientes.md -->
### [ ] [TASK-457] [P2] Implementar clasificación documental automática asistida (F40-19)
- **Prioridad:** P2 (Media / Complementaria)
- **Orden de Ejecución:** 22 (Clasificación inteligente con validación humana obligatoria)
- **Componentes Afectados:**
  - `backend/academic-service/Code.gs` (`suggestDocumentClassification`)
  - `js/teacher.js`, `js/secretary.js`
- **Subcapacidades Relacionadas:** F40-25.
- **Origen del Hallazgo:** `AUDITORIA_FASE_40_SEGURIDAD_DOCUMENTAL_TRAZABILIDAD_Y_CONSERVACION.md` / Secciones C (F40-25) y Especificación Técnica ChatGPT/Jules.
- **Problema Detectado y Riesgos:**
  La clasificación manual provoca omisiones o asignaciones erróneas de sensibilidad, dejando documentos delicados (médicos o disciplinarios) sin la protección correspondiente.
- **Requerimientos Funcionales y Técnicos Convergentes:**
  1. *Análisis asistido de contenido:*
     - Analizar metadatos, nombre de archivo, estructura y texto OCR para sugerir: Tipo documental, Categoría, Nivel de sensibilidad, Departamento responsable, Expediente relacionado.
     - Detectar palabras clave e indicadores de contenido médico, financiero, laboral, disciplinario o de identidad.
     - Mostrar sugerencia con nivel de confianza y fundamentos visuales.
  2. *Revisión humana y principio conservador:*
     - Diferenciar sugerencia de clasificación oficial confirmada.
     - Opciones del usuario: Aceptar, Modificar, Rechazar o Solicitar revisión.
     - Una sugerencia automática nunca puede rebajar el nivel de protección de un documento.
     - Ante incertidumbre, asignar clasificación conservadora (`Restringido`) o remitir a revisión.
     - Registrar en auditoría la sugerencia, confianza y decisión humana final.
- **Criterios de Aceptación:**
  - [ ] Contratos laborales sugieren automáticamente categoría laboral y sensibilidad confidencial.
  - [ ] Comprobantes sugieren categoría financiera.
  - [ ] Documentos ambiguos se envían a revisión humana sin rebajar su protección.
  - [ ] Se registra la sugerencia y la decisión del usuario en la bitácora.
- **Dependencias:** F40-Task02, extracción de texto/OCR.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 16402-16430; clave TASK-458; asignación única: Secretaria -->

---

<!-- ID: TASK-458 | Fuentes: Pendientes.md ; pendientes/Secretaria/Pendientes.md -->
### [ ] [TASK-458] [P2] Incorporar marcas de agua dinámicas y control de copias visualizadas (F40-20)
- **Prioridad:** P2 (Media / Complementaria)
- **Orden de Ejecución:** 23 (Trazabilidad visual y prevención de fugas de pantalla)
- **Componentes Afectados:**
  - `backend/academic-service/Code.gs` (`generateWatermarkedDocumentCopy`)
  - `js/teacher.js`, `js/ui-common.js`
- **Subcapacidades Relacionadas:** F40-26.
- **Origen del Hallazgo:** `AUDITORIA_FASE_40_SEGURIDAD_DOCUMENTAL_TRAZABILIDAD_Y_CONSERVACION.md` / Secciones C (F40-26) y Especificación Técnica ChatGPT/Jules.
- **Problema Detectado y Riesgos:**
  Los documentos descargados o visualizados no incorporan marcas identificatorias. Si un archivo es divulgado mediante captura o impresión, no es posible vincularlo a la sesión que lo obtuvo.
- **Requerimientos Funcionales y Técnicos Convergentes:**
  1. *Marcas de agua dinámicas sobre copias derivadas:*
     - Configurar marcas de agua para categorías sensibles con: Identificador/nombre del usuario, Fecha y hora de generación, Identificador de sesión no secreto, Leyenda institucional (ej. "Copia de consulta"), ID parcial del documento.
     - Diferenciar: Visualización protegida, Descarga de copia marcada, y Descarga de original autorizada.
  2. *Preservación del original:*
     - La marca de agua se aplica exclusivamente sobre una copia derivada, sin alterar el binario original ni su hash SHA-256.
     - Evitar cubrir información esencial del documento.
     - Registrar qué usuario generó la copia, fecha y versión.
     - Permitir desactivar la marca en documentos donde interfiera con su validez oficial.
- **Criterios de Aceptación:**
  - [ ] Consultar un documento restringido muestra la marca de agua con los datos del usuario activo.
  - [ ] Descargar una copia marcada registra el evento en auditoría.
  - [ ] El hash del archivo original permanece intacto e inalterado.
  - [ ] La marca de agua no oculta información esencial ni impide la lectura.
- **Dependencias:** F40-Task04, F40-Task06, F40-Task02.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 16496-16534; clave TASK-461; asignación única: Secretaria -->

---

<!-- ID: TASK-461 | Fuentes: Pendientes.md ; pendientes/Secretaria/Pendientes.md -->
### [ ] [TASK-461] [P2] Catálogo institucional y administración de plantillas y formularios
- **Prioridad:** P2 (Media / Complementaria)
- **Orden de Ejecución:** 11 (Gobernanza del catálogo de plantillas y ciclo de vida de versiones)
- **Componentes Afectados:**
  - `backend/accounting-service/Code.gs` (`manageSchoolDocumentTemplateCatalog`)
  - `backend/user-service/Code.gs` (`manageInstitutionalFormCatalog`)
  - Hojas de Cálculo: `PlantillasEscolares`, `FormulariosInstitucionales`
- **Subcapacidades Relacionadas:** F41-04.
- **Origen del Hallazgo:** `AUDITORIA_FASE_41_PRUEBAS_INTEGRALES_DIGITALIZACION.md` / Secciones B (F41-04) y Especificación Técnica ChatGPT/Jules.
- **Problema Detectado y Riesgos:**
  La creación de formularios dinámicos y plantillas CUV carece de una consola de gobernanza centralizada para catalogar formatos por trámite o departamento, controlar versiones activas y evitar que la actualización de una plantilla altere retroactivamente documentos emitidos en periodos anteriores.
- **Requerimientos Funcionales y Técnicos Convergentes:**
  1. *Catálogo centralizado y taxonomía:*
     - Organizar plantillas y formularios por trámite, departamento responsable y tipo documental.
     - Asignar responsables, vigencias y niveles de confidencialidad.
     - Permitir duplicar plantillas existentes para acelerar la creación de nuevas variantes.
  2. *Control de versiones y preservación histórica:*
     - Mantener versionado formal (`1.0`, `1.1`, `2.0`).
     - Permitir activar, suspender o archivar plantillas.
     - Una plantilla actualizada genera una nueva versión; los documentos emitidos previamente conservan su vínculo inmutable con la versión exacta de plantilla con la que fueron generados.
     - Plantillas inactivas dejan de estar disponibles para nuevas emisiones pero sus documentos históricos permanecen consultables y verificables mediante CUV.
     - Permitir compartir plantillas específicas entre departamentos bajo autorización formal.
- **Criterios de Aceptación:**
  - [ ] El catálogo permite organizar y filtrar plantillas por departamento y trámite.
  - [ ] Actualizar una plantilla crea una nueva versión sin alterar los documentos generados con versiones previas.
  - [ ] Todo documento oficial emitido identifica con precisión la versión de plantilla utilizada.
  - [ ] Plantillas desactivadas son excluidas de nuevos trámites pero mantienen vigentes sus documentos emitidos.
- **Dependencias:** F41-Task06, F41-Task08 y sistema de documentos institucionales.
- **Estado:** [ ] Pendiente

---

<!-- ID: TASK-639 | Fuentes: AUDITORIAS/AUDITORIA_COMPLETADAS_F8-TASK02.md; Auditoría/AUDITORIA_TASK-639_C1.302.md -->
### [x] [TASK-639] Verificar duplicaciones, símbolos globales y ciclos
- **Referencia:** AUD-NG-283; resultados C1.302: AUD-NG-374..376.
- **Severidad:** MEDIO.
- **Prioridad:** P2.
- **Estado:** Completada.
- **Resultado:** inspección estática de 24 archivos JS y 6 servicios Apps Script; propietarios, redefiniciones, consumidores, acoplamientos y grafo interservicio documentados con referencias exactas. Ciclos estáticos no observados; ciclos runtime no verificables.
- **Expediente principal:** Auditoría/AUDITORIA_TASK-639_C1.302.md.
- **Tareas derivadas:** TASK-691, TASK-692 y TASK-693 en pendientes/Dirección/Pendientes.md.
- **Criterios de aceptación:** satisfechos para el alcance estático; no se modificó código durante la auditoría.

---

<!-- ID: TAREA-F5-019 | Fuentes: completadas.md -->
### [ ] [TAREA-F5-019] Implementar herramientas de seguimiento operativo y análisis de admisiones
- **Origen del Hallazgo:** `Auditoria.txt` (HALLAZGOS F5: HALLAZGOS-F5-P3-01) / `AUDITORIA_FASE_5_ADMISIONES_PORTAL_FAMILIAS.md` (Subcapacidad 5.15, Brecha P3-01)
- **Severidad/Clasificación:** Bajo
- **Archivos Involucrados:** `dashboard-direccion.html`, `js/teacher.js`, `backend/academic-service/Code.gs`
- **Dependencias Expuestas:** Endpoints `getAdmissionRequests`, `getSecurityAndComplianceDashboardData`
- **Descripción del Alcance:**
  1. Crear un panel de indicadores métricos y analítica de admisiones en `dashboard-direccion.html`.
  2. Calcular métricas clave en tiempo real:
     - Total de Solicitudes Recibidas, En Revisión, Evaluadas, Admitidas, Rechazadas, En Espera y Convertidas.
     - Tasa de Conversión (% de admitidos que completan la matrícula).
     - Tiempo Promedio de Tramitación (Días entre recepción de solicitud y decisión final).
     - Embudo de Conversión por Grado y Nivel Académico.
  3. Desplegar filtros por año lectivo, periodo, nivel y departamento.
  4. Identificar embotellamientos operativos (solicitudes estancadas por falta de documentos o citas de evaluación).
  5. Analizar los motivos principales de rechazo o de abandono de solicitudes de admisión.
  6. Exportación de reportes analíticos en formato CSV/PDF para reuniones de junta directiva.
  7. Garantizar que las consultas analíticas se ejecuten sin alterar los estados o datos de los expedientes.
- **Criterios de Aceptación:**
  - [ ] El cuadro de mando despliega métricas exactas calculadas desde los registros reales de `SolicitudesAdmision`.
  - [ ] Los indicadores permiten filtrar dinámicamente por año lectivo y grado.
  - [ ] Se calculan con precisión los tiempos promedios de atención y las tasas de conversión.
  - [ ] La exportación de datos genera reportes sanitizados sin exponer contraseñas ni secrets.
  - [ ] La generación de reportes no degrada el rendimiento de las operaciones ordinarias.
- **Estado:** Pendiente

---

<!-- ID: AUD-NG-035 | Fuentes: Pendientes.md -->
### [ ] [AUD-NG-035] Incorporar vigencia, programación y segmentación autenticada en comunicados institucionales
- **Origen del Hallazgo:** Auditoria.txt / AUD-NG-035 (F11-Task04)
- **Severidad/Clasificación:** Alto
- **Archivos Involucrados:** backend/user-service/Code.gs
- **Dependencias Expuestas:** createInstitutionalAnnouncement, getInstitutionalAnnouncements, ComunicadosInstitucionales, validateRolePermission, _verifiedUserId, _verifiedRole
- **Descripción del Alcance:** Ampliar el modelo con inicio/fin de vigencia y estados de borrador, programado, publicado y retirado. Validar fechas y transiciones en servidor. Resolver audiencia y permisos desde la sesión verificada y relaciones institucionales persistidas, no desde el payload. Excluir comunicados fuera de vigencia o cuya fecha de publicación no haya llegado.
- **Criterios de Aceptación:** Se pueden guardar borradores; los programados no aparecen antes de su inicio; los vencidos dejan de mostrarse; los cambios de estado requieren permisos verificados; manipular audiencia o rol no permite consultar comunicados ajenos; se prueban límites temporales y transiciones inválidas.
- **Estado:** [ ] Pendiente

---

<!-- ID: AUD-NG-061 | Fuentes: Pendientes.md -->
### [ ] [AUD-NG-061] Persistir y emitir certificados probatorios solo para procesos de firma completados
- **Origen del Hallazgo:** Auditoria.txt / AUD-NG-061 (TASK-040 / F22-Task03)
- **Severidad/Clasificación:** Crítico
- **Archivos Involucrados:** backend/user-service/Code.gs; backend/accounting-service/Code.gs; FirmasConformidades; DocumentosEscolaresEmitidos; Google Drive
- **Dependencias Expuestas:** generateSignatureAuditCertificate, registerDocumentSignature, checkAdvancedSignatureStatus y verifySchoolDocumentByCUV.
- **Descripción del Alcance:** Definir estados terminales y transiciones válidas; generar automáticamente el certificado al completar todas las firmas requeridas; persistirlo como artefacto independiente y vincularlo al documento/versión y expediente. Incluir solo firmantes y eventos confirmados, ordenar por timestamp/orden de flujo, incorporar CUV y hash real del PDF, y conservar hash del certificado para verificación posterior. No etiquetar Pendiente, Cancelada, Rechazada o Expirada como completada.
- **Criterios de Aceptación:** Solo una transacción efectivamente completada genera certificado; el archivo persiste y puede recuperarse; su hash se verifica; estados cancelados/rechazados/vencidos no aparecen como completados; la pista coincide con el historial real y conserva el orden de firma.
- **Estado:** [ ] Pendiente

---

<!-- ID: AUD-NG-062 | Fuentes: Pendientes.md -->
### [ ] [AUD-NG-062] Implementar comunicación real y verificación criptográfica de proveedores PSC
- **Origen del Hallazgo:** Auditoria.txt / AUD-NG-062 (TASK-041 / F22-Task04)
- **Severidad/Clasificación:** Crítico
- **Archivos Involucrados:** backend/user-service/Code.gs; integración PSC; TransaccionesFirmaAvanzada; ConfiguracionFirmaAvanzada
- **Dependencias Expuestas:** createAdvancedSignatureRequest, checkAdvancedSignatureStatus, UrlFetchApp, HMAC/firma del proveedor, certificados X.509 y sellado de tiempo.
- **Descripción del Alcance:** Implementar adaptadores reales por proveedor para crear, consultar y recuperar transacciones/documentos. Autenticar callbacks o respuestas mediante el mecanismo oficial del PSC; validar emisor, firma, cadena de certificados, vigencia, revocación, sellado de tiempo y hash del documento. Rechazar cualquier cambio de estado originado por datos de cliente no autenticados y aplicar idempotencia/transiciones terminales.
- **Criterios de Aceptación:** No se crea una transacción como enviada sin confirmación del proveedor; un callback manipulado es rechazado; una firma solo se marca completada tras validar evidencia del PSC y hash coincidente; reintentos no duplican operaciones; se conservan respuestas/certificados verificables.
- **Estado:** [ ] Pendiente

---

<!-- ID: AUD-NG-064 | Fuentes: Pendientes.md -->
### [ ] [AUD-NG-064] Sustituir pruebas superficiales de Fase 22 por pruebas funcionales verificables
- **Origen del Hallazgo:** Auditoria.txt / AUD-NG-064 (TASK-042 / F22-Task13)
- **Severidad/Clasificación:** Alto
- **Archivos Involucrados:** backend/accounting-service/Code.gs; backend/developer-service/Code.gs; tests/regression/academic-grading-suite.js; tests/regression/
- **Dependencias Expuestas:** PT22-01 a PT22-12, PT22-DEV-01 a PT22-DEV-03, generateSchoolDocument, validateFileBinaryIntegrity, registerDocumentSignature, generateSignatureAuditCertificate y checkAdvancedSignatureStatus.
- **Descripción del Alcance:** Implementar pruebas que invoquen operaciones reales en entorno aislado y verifiquen bytes, archivos, persistencia, estados, permisos, hashes, certificados y respuestas PSC. Reemplazar casos que solo calculan un hash local o verifican la longitud/cadena por aserciones sobre resultados y datos persistidos. Eliminar resultados hardcodeados pass:true y validaciones de presencia como sustituto de pruebas.
- **Criterios de Aceptación:** Cada criterio de TASK-038 a TASK-041 tiene al menos una prueba funcional reproducible; se prueban archivos falsificados/corruptos, cambios de bytes, duplicados, estados no terminales, callback falsificado y permisos; los casos fallidos producen FAIL; no hay expected/actual constantes que se aprueben sin ejecutar la comprobación.
- **Estado:** [ ] Pendiente

---

<!-- ID: AUD-NG-087 | Fuentes: Pendientes.md -->
### [ ] [AUD-NG-087] Verificar la continuidad real de la cadena y rechazar hashes ausentes
- **Origen del Hallazgo:** Auditoria.txt / AUD-NG-087 (TASK-049 / F23-Task06)
- **Severidad/Clasificación:** Crítico
- **Archivos Involucrados:** backend/user-service/Code.gs; RevisionesDecisionesTramite; servicio de auditoría
- **Dependencias Expuestas:** verifyWorkflowDecisionAuditChain, hashPrevio, hashActual, hash génesis y checkpoints.
- **Descripción del Alcance:** Validar cada hash y además comprobar que hashPrevio coincida exactamente con hashActual del evento inmediatamente anterior, comenzando por el valor génesis. Marcar como inconsistencia cualquier hash vacío, enlace roto, evento eliminado o secuencia incompleta; al filtrar por solicitud, verificar el tramo global correspondiente sin perder continuidad.
- **Criterios de Aceptación:** Cambiar un dato, quitar un hash, alterar un enlace o eliminar una fila de prueba produce cadena inválida; una cadena completa se verifica de forma determinista; el último hash se compara con un checkpoint confiable.
- **Estado:** [ ] Pendiente

---

<!-- ID: AUD-NG-123 | Fuentes: Pendientes.md -->
### [ ] [AUD-NG-123] Restringir la consulta de asistencia de padres y tutores a sus representados
- **Origen del Hallazgo:** Auditoria.txt / AUD-NG-123 (REQ-EXP-004).
- **Severidad/Clasificación:** Crítico
- **Archivos Involucrados:** `backend/academic-service/Code.gs`; módulo de relaciones familiares.
- **Dependencias Expuestas:** `getDailyAttendance`, `getClassAttendance`, `getStudentAttendanceSummary`, `ROLE_PERMISSIONS`, `validateContextualAccess` y `RelacionesFamiliares`.
- **Descripción del Alcance:** Los roles Padre, Tutor y Responsable tienen permisos para consultar asistencia. `getDailyAttendance` devuelve todos los registros de una fecha, `getClassAttendance` puede devolver todos los registros si no se envía sesionId y `getStudentAttendanceSummary` acepta cualquier userId. La validación contextual restringe al propio estudiante, pero no comprueba la relación familiar de estos roles. Validar cada consulta contra los vínculos activos del titular y denegar consultas institucionales amplias.
- **Criterios de Aceptación:** Un padre/tutor solo puede consultar los estudiantes vinculados y vigentes; no puede consultar otro userId ni la asistencia completa de una fecha/grupo; estudiantes solo ven su propia información; pruebas cruzadas con dos familias.
- **Estado:** [ ] Pendiente

---

<!-- ID: AUD-NG-125 | Fuentes: Pendientes.md -->
### [ ] [AUD-NG-125] Preservar historial inmutable de correcciones de asistencia
- **Origen del Hallazgo:** Auditoria.txt / AUD-NG-125 (REQ-EXP-004).
- **Severidad/Clasificación:** Alto
- **Archivos Involucrados:** `backend/academic-service/Code.gs`; pruebas de asistencia.
- **Dependencias Expuestas:** `saveClassAttendance`, `saveDailyAttendance`, `RegistrosAsistencia`, actor autenticado y registro de auditoría.
- **Descripción del Alcance:** Las funciones de guardado actualizan en sitio los campos de asistencia de una sesión/estudiante y reemplazan la marca temporal; no conservan el estado anterior ni registran quién realizó la corrección. Añadir un historial append-only antes de modificar una fila existente, sin impedir correcciones autorizadas.
- **Criterios de Aceptación:** Cada corrección conserva estado/observación/justificación anterior y nuevo, actor, fecha y motivo; la fila actual refleja el último estado; los registros de auditoría no se editan ni borran; pruebas cubren múltiples correcciones y concurrencia.
- **Estado:** [ ] Pendiente

---

<!-- ID: TASK-229 | Fuentes: Pendientes.md ; pendientes/Secretaria/Pendientes.md -->
### [ ] [TASK-229] [P1] [Ciclo de Vida de Trámites - Devolución, Rechazo y Corrección Controlada de Trámites]
- **Componentes Afectados:**
  - `backend/user-service/Code.gs`
- **Dependencias Expuestas:** `SolicitudesTramites`, `RevisionesDecisionesTramite`, `F23-Task01`, `F23-Task07`.
- **Capacidades Relacionadas:** F23-018, F23-014.
- **Problema Detectado:**
  Las devoluciones están implementadas parcialmente y las observaciones no siempre son obligatorias.
- **Requisitos Funcionales:**
  1. Exigir una justificación obligatoria en devoluciones para corrección y rechazos definitivos.
  2. Diferenciar formalmente devolución para corrección (`DEVUELTO_CORRECCION`) de rechazo definitivo (`RECHAZADO`).
  3. Identificar los campos, anexos o documentos que deben corregirse cuando corresponda.
  4. Permitir que el solicitante corrija exclusivamente la información autorizada.
  5. Conservar la versión anterior de la solicitud antes de las correcciones.
  6. Registrar las modificaciones posteriores con trazabilidad de cambios.
  7. Permitir reenviar el trámite a revisión una vez completadas las correcciones.
  8. Determinar qué etapas deben repetirse después de una corrección según las reglas del flujo.
  9. Impedir modificaciones de campos reservados que no corresponden al solicitante.
  10. Notificar al solicitante las observaciones y acciones necesarias de corrección.
- **Comportamiento Esperado:**
  Una solicitud devuelta debe regresar al responsable correspondiente para su corrección, conservando las decisiones y observaciones anteriores.
- **Criterios de Aceptación:**
  - [ ] Intentar devolver una solicitud sin observaciones y comprobar que la operación es rechazada.
  - [ ] Devolver la solicitud con observaciones válidas y verificar el cambio de estado a `Requiere Corrección`.
  - [ ] Corregir la información requerida como solicitante y reenviar a revisión.
  - [ ] Verificar el historial de versiones y decisiones preservando los eventos previos.
  - [ ] Comprobar que las etapas se repiten o reanudan según las reglas configuradas.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 9134-9164; clave TASK-230; asignación única: Secretaria -->

---

<!-- ID: TASK-230 | Fuentes: Pendientes.md ; pendientes/Secretaria/Pendientes.md -->
### [ ] [TASK-230] [P1] [Ciclo de Vida de Trámites - Cancelación y Desistimiento de Solicitudes por el Solicitante]
- **Componentes Afectados:**
  - `backend/user-service/Code.gs`
- **Dependencias Expuestas:** `SolicitudesTramites`, `F23-Task01`, `F23-Task12`.
- **Capacidades Relacionadas:** F23-019.
- **Problema Detectado:**
  No existe una capacidad formal para que el solicitante retire un trámite cuando todavía es posible cancelarlo.
- **Requisitos Funcionales:**
  1. Permitir al solicitante gestionar el desistimiento o cancelación de un trámite propio.
  2. Definir en qué estados iniciales o intermedios se permite el desistimiento voluntario.
  3. Impedir la cancelación cuando la operación ya haya producido efectos irreversibles (ej. pagos aplicados, actas emitidas), salvo procedimiento de reversión formal.
  4. Registrar el motivo detallado del desistimiento.
  5. Notificar a los revisores y responsables involucrados en la etapa activa.
  6. Cancelar automáticamente las tareas pendientes asociadas en la bandeja unificada.
  7. Detener recordatorios, alertas y temporizadores de escalamiento de SLA.
  8. Registrar en auditoría las acciones que ya se habían ejecutado previo a la cancelación.
  9. Permitir que un administrador gestione excepciones justificadas de cancelación.
  10. Mantener el expediente histórico del proceso cancelado con estado `Desistida_Por_Usuario`.
- **Comportamiento Esperado:**
  El solicitante podrá desistir de operaciones pendientes dentro de las condiciones permitidas, sin eliminar los registros ni alterar el historial de auditoría.
- **Criterios de Aceptación:**
  - [ ] Cancelar un trámite recién presentado y comprobar su paso a estado `Desistida_Por_Usuario`.
  - [ ] Intentar cancelar un trámite ya resuelto o aprobado definitivamente y comprobar su bloqueo.
  - [ ] Cancelar un trámite con aprobaciones parciales y verificar la detención de etapas subsiguientes.
  - [ ] Verificar la cancelación y retiro de tareas dependientes en la bandeja unificada.
  - [ ] Comprobar que se detienen los temporizadores y recordatorios de SLA.
  - [ ] Consultar el historial y verificar el registro del motivo de desistimiento.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 9449-9496; clave TASK-239; asignación única: Secretaria -->

---

<!-- ID: TASK-239 | Fuentes: Pendientes.md ; pendientes/Secretaria/Pendientes.md -->
### [ ] [TASK-239] [P1] [Distribución y Seguridad - Distribución Segura y Compartición de Informes Institucionales]
- **Componentes Afectados:**
  - `backend/user-service/Code.gs`
- **Dependencias Expuestas:** Programador (`F24-Task10`), exportador (`F24-Task08`), catálogo y permisos (`F24-Task01`).
- **Capacidades Relacionadas:** F24-015, F24-010.
- **Problema Detectado:**
  No existe un mecanismo institucional para enviar informes automáticamente por correo electrónico ni para compartirlos mediante enlaces temporales protegidos.
- **Requisitos Funcionales:**
  1. Permitir distribuir informes generados a destinatarios autorizados de forma segura.
  2. Incorporar despacho por correo electrónico institucional (`MailApp` / notificaciones multicanal).
  3. Permitir seleccionar destinatarios individuales y grupos o departamentos institucionales.
  4. Permitir adjuntar archivos estructurados o enviar enlaces temporales protegidos.
  5. Incorporar enlaces de acceso seguro con:
     - Identificador criptográfico único.
     - Fecha y hora de vencimiento.
     - Estado activo o revocado.
     - Lista de destinatarios autorizados por email/userId.
     - Permisos de solo consulta sin reenvío no autorizado.
  6. Evitar enlaces públicos o URLs abiertas que permitan acceder a información institucional restringida sin autenticación.
  7. Revalidar los permisos institucionales al momento en que el usuario abre un enlace compartido.
  8. Permitir revocar anticipadamente el acceso a un enlace distribuido.
  9. Registrar fecha, usuario emisor, informe, destinatarios y aperturas en bitácora de distribución.
  10. Integrar la distribución con las programaciones automáticas de informes.
  11. Permitir notificar inmediatamente a los administradores ante fallos de entrega.
  12. Evitar envíos duplicados mediante claves de idempotencia en la distribución.
- **Cambios Necesarios:**
  - Incorporar un servicio de distribución institucional (`distributeInstitutionalReport`).
  - Integrar el envío con el programador de tareas y el exportador de archivos.
  - Implementar control de acceso y verificación de identidad en enlaces temporales.
  - Incorporar registro de entregas en hoja `DistribucionInformesLogs`.
  - Implementar plantillas de correo institucionales formales con advertencias de confidencialidad.
  - Añadir controles de validación de destinatarios y permisos antes del despacho.
- **Comportamiento Esperado:**
  Un informe podrá enviarse automáticamente a los responsables autorizados. Si se utiliza un enlace, el acceso estará sujeto a identidad, permisos y vigencia.
  El archivo enviado no debe contener información que el destinatario no tenga derecho a consultar.
- **Criterios de Aceptación:**
  - [ ] Un informe puede enviarse exitosamente a un destinatario institucional autorizado.
  - [ ] Un intento de envío a un destinatario no autorizado es bloqueado por el servidor.
  - [ ] Un enlace temporal vencido o revocado impide el acceso al informe.
  - [ ] La modificación o revocación de permisos se refleja inmediatamente en el siguiente intento de acceso.
  - [ ] Todos los envíos de informes quedan debidamente registrados en la bitácora de auditoría.
  - [ ] Un fallo de entrega de correo no se registra falsamente como envío satisfactorio.
  - [ ] Los reintentos controlados no generan envíos duplicados hacia los destinatarios.
  - [ ] La distribución automática conserva fielmente los filtros y el período de datos configurados.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 9790-9850; clave TASK-248; asignación única: Secretaria -->

---

<!-- ID: TASK-248 | Fuentes: Pendientes.md ; pendientes/Secretaria/Pendientes.md -->
### [ ] [TASK-248] [P1] [Formularios Dinámicos - Ampliar los Formularios Institucionales con un Constructor Visual de Campos Dinámicos]
- **Componentes Afectados:**
  - `backend/user-service/Code.gs`
  - Hojas `FormulariosInstitucionales`, `RespuestasFormularios`
  - `js/ui-common.js`
- **Subcapacidad Relacionada:** F26-007.
- **Estado de Partida:** Implementada parcialmente.
- **Dependencias Expuestas:** `FormulariosInstitucionales`, almacenamiento de registros, roles y permisos, catálogos existentes y motor de precedencia.
- **Problema Detectado:**
  Existe una estructura `FormulariosInstitucionales` con esquemas JSON de campos, pero falta una herramienta visual para crear y administrar campos personalizados sin modificar directamente el código. La plataforma necesita convertir la definición de formularios en una capacidad administrable, con validaciones, reglas condicionales, reutilización y control de permisos.
- **Requisitos Funcionales:**
  1. Constructor visual de campos:
     - Interfaz para crear, editar, ordenar y configurar campos personalizados.
     - Agregar campos, editar etiquetas y descripciones, seleccionar tipos de datos, definir obligatoriedad, establecer valores predeterminados y límites.
     - Ordenar campos mediante controles visuales y agrupar por secciones temáticas.
     - Previsualizar el formulario interactivo en tiempo real.
     - Guardar borradores y publicar versiones oficiales.
     - Desactivar campos sin destruir información histórica previamente capturada.
     - Trabajar sobre el esquema JSON existente sin crear un motor paralelo.
  2. Tipos de campos soportados:
     - Texto corto, texto extenso, número entero, número decimal, fecha, fecha y hora, casilla de selección (checkbox), lista desplegable (select), selección múltiple, referencia a catálogo institucional, referencia a entidad interna y archivo adjunto.
     - Controles específicos por tipo: longitud mín/máx en texto, límites numéricos y precisión, rangos de fecha, formatos de archivo y tamaño máximo en megabytes.
  3. Campos condicionales declarativos:
     - Reglas de visibilidad y obligatoriedad dependientes del valor de otros campos (ej. mostrar campo adicional según categoría seleccionada).
     - Almacenar condiciones como reglas declarativas controladas (JSON), no como JavaScript ejecutable arbitrario.
  4. Validación estricta en frontend y backend:
     - Toda validación relevante debe ejecutarse también en el servidor (`doPost`).
     - Verificar pertenencia del campo al formulario, tipo de dato, permisos de usuario, opciones autorizadas del catálogo, límites y cumplimiento de condiciones de obligatoriedad.
  5. Versionado y compatibilidad histórica:
     - Generar versiones controladas (`v1.0`, `v1.1`, `v2.0`).
     - Los registros históricos conservan la versión exacta con la que fueron llenados.
     - Desactivar un campo no borra las respuestas históricas asociadas.
  6. Ámbitos y permisos:
     - Formularios institucionales y formularios específicos por departamento respetando la jerarquía de `F26-Task01`.
     - Control de acceso RBAC sobre campos con información confidencial o restringida.
- **Cambios Necesarios:**
  - Ampliar la administración de `FormulariosInstitucionales` en backend (`saveFormDefinition`, `getFormDefinitions`).
  - Implementar el constructor visual en la interfaz administrativa.
  - Incorporar validaciones declarativas server-side en el envío de respuestas (`submitInstitutionalFormRequest`).
  - Adaptar el renderizador de formularios para generar controles según el esquema dinámico.
  - Añadir versionado de esquemas y relacionar respuestas con la versión del formulario.
  - Integrar permisos por rol y ámbito en el catálogo de formularios.
- **Comportamiento Esperado:**
  Un administrador o responsable autorizado puede agregar un campo desde la interfaz, publicarlo y utilizarlo en el formulario correspondiente. Los datos se guardan, consultan y validan sin necesidad de modificar código para cada nuevo campo.
- **Criterios de Aceptación:**
  - [ ] Crear un formulario y agregar campos de diferentes tipos de datos desde la interfaz.
  - [ ] Modificar etiquetas, descripciones y obligatoriedad con vista previa en tiempo real.
  - [ ] Previsualizar el formulario antes de publicarlo.
  - [ ] Guardar un registro utilizando campos personalizados y verificar persistencia íntegra.
  - [ ] Consultar posteriormente los valores guardados comprobando fidelidad de datos.
  - [ ] Enviar datos inválidos directamente al backend y comprobar que se rechazan con mensaje de error específico.
  - [ ] Comprobar que las reglas condicionales se aplican tanto en cliente como en servidor.
  - [ ] Cambiar una versión del formulario y verificar que los registros históricos conservan su estructura.
  - [ ] Desactivar un campo y comprobar que no se pierden los datos históricos existentes.
  - [ ] Intentar utilizar un campo desde otro formulario y comprobar que el servidor valida su pertenencia.
  - [ ] Intentar modificar un formulario sin permisos y comprobar que la operación se bloquea.
  - [ ] Comprobar que los campos personalizados no alteran formularios institucionales ajenos.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 10273-10305; clave TASK-262; asignación única: Secretaria -->

---

<!-- ID: TASK-398 | Fuentes: Pendientes.md ; pendientes/Secretaria/Pendientes.md -->
### [ ] [TASK-398] [P2] [Gestión Documental - Administración Avanzada del Archivo y Conservación de Trámites]
- **Componentes Afectados:**
  - `backend/user-service/Code.gs`
- **Dependencias Expuestas:** `F23-Task06`, `F23-Task13`.
- **Capacidades Relacionadas:** F23-020.
- **Problema Detectado:**
  El archivo de trámites está implementado parcialmente y su depuración es principalmente manual.
- **Requisitos Funcionales:**
  1. Establecer políticas de conservación y retención por tipo de trámite según directrices institucionales.
  2. Archivar automáticamente los procesos finalizados cuando expire su periodo activo.
  3. Diferenciar formalmente el estado de archivo histórico de la eliminación física de registros.
  4. Mantener acceso de sólo lectura autorizado a los expedientes archivados.
  5. Conservar documentos, firmas digitales y referencias asociadas en almacenamiento seguro.
  6. Permitir búsquedas históricas sobre el archivo pasivo por CUV, fecha o solicitante.
  7. Establecer restricciones estrictas de eliminación física según las leyes de retención aplicables.
  8. Permitir la exportación íntegra de expedientes archivados en paquetes estructurados.
  9. Registrar todas las operaciones de archivo, desarchivo y consulta en la bitácora de seguridad.
  10. Evitar que las tareas de depuración eliminen registros requeridos por otros módulos contables o académicos.
- **Comportamiento Esperado:**
  Los procesos resueltos podrán pasar a un almacenamiento histórico organizado, sin perder su trazabilidad ni sus relaciones institucionales.
- **Criterios de Aceptación:**
  - [ ] Archivar un trámite finalizado y verificar su traslado a la partición o estado de archivo.
  - [ ] Consultar el trámite archivado mediante búsqueda por identificador y verificar lectura correcta.
  - [ ] Comprobar que conserva intactos los documentos adjuntos y las firmas registradas.
  - [ ] Intentar archivar un proceso activo y comprobar que la operación es rechazada.
  - [ ] Ejecutar una política de retención automática y verificar la integridad de las referencias vinculadas.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 14835-14891; clave TASK-412; asignación única: Secretaria -->

---

<!-- ID: TASK-412 | Fuentes: Pendientes.md ; pendientes/Secretaria/Pendientes.md -->
### [ ] [TASK-412] [P2] [Calendarios - Integración Externa con Calendarios Institucionales (Google Calendar / iCal)]
- **Componentes Afectados:**
  - `backend/user-service/Code.gs`
  - Hoja `CalendarioInstitucional`
- **Estado de Partida:** Implementación parcial.
- **Dependencias Expuestas:** F25-001, F25-012, F25-014 y F25-015.
- **Capacidades Relacionadas:** F25-010, F25-014.
- **Problema que Resuelve:**
  La plataforma dispone de un calendario institucional interno y detección de solapamientos, pero no ofrece sincronización bidireccional con calendarios externos.
- **Requisitos Funcionales:**
  1. Ampliar el calendario para permitir conexiones externas autorizadas (Google Calendar e intercambio iCalendar `.ics`).
  2. Distinguir entre exportar un archivo `.ics`, importar eventos y mantener sincronización permanente.
  3. Operaciones esperadas:
     - Exportar eventos institucionales a formato estándar iCalendar (`.ics`).
     - Importar eventos externos desde archivos `.ics`.
     - Crear, actualizar y cancelar eventos en Google Calendar mediante APIs autorizadas.
     - Consultar cambios y disponibilidad horaria.
     - Identificar eventos duplicados mediante correlación de identificadores.
     - Gestionar calendarios y permisos diferenciados.
  4. Identificación y sincronización de eventos:
     - Cada evento sincronizado debe conservar `eventoIdInterno`, `eventoIdExterno`, servicio de origen, calendario asociado, fecha de última sincronización y estado.
     - Utilizar sincronización incremental mediante tokens cuando el servicio externo lo soporte.
     - Si un token de sincronización se invalida, realizar una sincronización completa controlada.
  5. Resolución de conflictos:
     - Manejar eventos modificados internamente o externamente.
     - Manejar cancelaciones y eliminaciones.
     - Gestionar diferencias de zona horaria y eventos recurrentes.
     - Conservar y aplicar la detección de solapamientos preexistente (`checkCalendarEventOverlap`) al importar eventos externos.
  6. Seguridad: conexión con permisos específicos y revocables sin exponer calendarios ajenos.
- **Cambios Necesarios:**
  1. Incorporar conectores de calendario externos en `user-service`.
  2. Implementar generador y parseador de archivos iCalendar (`.ics`).
  3. Implementar integración con Google Calendar API cuando existan credenciales y autorización.
  4. Relacionar eventos internos y externos en `CalendarioInstitucional`.
  5. Incorporar sincronización incremental con tokens.
  6. Integrar la detección de solapamientos existente.
  7. Implementar resolución de conflictos horológicos.
  8. Registrar sincronizaciones y errores en bitácora.
- **Comportamiento Esperado:**
  Los eventos institucionales autorizados deben poder intercambiarse con calendarios externos sin generar duplicados ni perder información.
  Los cambios deben identificarse y procesarse conforme a la política de autoridad definida para cada calendario.
- **Criterios de Aceptación:**
  - [ ] Exportar eventos institucionales a un archivo `.ics` válido y compatible con clientes de correo.
  - [ ] Importar un archivo `.ics` válido e incorporar los eventos al calendario interno.
  - [ ] Probar eventos con diferentes zonas horarias verificando conversión correcta.
  - [ ] Comprobar soporte para eventos recurrentes sin desfasajes de fecha.
  - [ ] Conectar un calendario externo de pruebas y crear/actualizar eventos autorizados.
  - [ ] Comprobar que los cambios externos se identifican y sincronizan en la plataforma.
  - [ ] Verificar que los eventos no se duplican al repetir la sincronización.
  - [ ] Probar conflictos entre cambios internos y externos aplicando la política de autoridad.
  - [ ] Comprobar que se conservan intactas las reglas de detección de solapamientos.
  - [ ] Revocar una conexión y verificar que las operaciones posteriores quedan bloqueadas.
  - [ ] Comprobar la recuperación automática ante tokens de sincronización inválidos.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 15717-15747; clave TASK-435; asignación única: Secretaria -->

---

<!-- ID: TASK-472 | Fuentes: Pendientes.md ; pendientes/Secretaria/Pendientes.md -->
### [ ] [TASK-472] [P3] [Firmas Institucionales - Optimización de Firmas y Conformidades dentro de los Procesos]
- **Componentes Afectados:**
  - `backend/user-service/Code.gs`
- **Dependencias Expuestas:** `FirmasConformidades`, `F23-Task06`, `F23-Task24`.
- **Capacidades Relacionadas:** F23-017.
- **Estado de Partida:** Completa y verificada. No requiere reconstrucción.
- **Requisitos Funcionales:**
  1. Conservar el mecanismo existente de registro de firmas y conformidades en `FirmasConformidades`.
  2. Mantener la vinculación estrecha entre firma, documento emitido, usuario firmante, proceso y etapa del workflow.
  3. Preservar los mecanismos de integridad criptográfica existentes (cálculo y validación de hash SHA-256).
  4. Permitir consultar y previsualizar las conformidades firmadas directamente desde el historial del proceso.
  5. Mejorar la presentación visual del estado de firma en la interfaz institucional.
  6. Diferenciar claramente los estados: `Pendiente de Firma`, `Firmado`, `Rechazado`, `Firma Inválida / Revocada`.
  7. Evitar registrar dos veces la misma conformidad sobre una etapa resuelta.
  8. Mantener inalterables las firmas históricas aunque el flujo cambie de versión o estructura.
- **Criterios de Aceptación:**
  - [ ] Firmar digitalmente una etapa de workflow de prueba.
  - [ ] Consultar la conformidad y verificar su vinculación con el documento y la decisión.
  - [ ] Intentar firmar dos veces la misma etapa y comprobar que se bloquea la duplicación.
  - [ ] Publicar una nueva versión del flujo y comprobar que las firmas de instancias previas permanecen válidas.
  - [ ] Verificar que la verificación criptográfica confirma la autenticidad de la firma registrada.
- **Estado:** [ ] Pendiente


---

<!-- ID: TASK-686 | Fuentes: AUDITORIA_TASK-638_C1.293.md -->
### [ ] [TASK-686] Proteger lectura y escritura de borradores de admisión
- **Hallazgo:** AUD-NG-357, ALTO/P1.
- **Objetivo:** evitar lectura o sobrescritura de borradores mediante email/identificación conocida.
- **Archivos:** backend/academic-service/Code.gs, admision.html, BorradoresAdmision.
- **Acción:** retirar la autorización basada solo en draftKey/email; usar capacidad aleatoria de alta entropía vinculada al borrador y con expiración; validar firma/propiedad en lectura y escritura; auditar revocación y cambios.
- **Criterios:** conocer email/DNI no permite leer ni sobrescribir; solo una capacidad válida recupera/actualiza; capacidad expirada/revocada falla; no se exponen borradores ajenos; pruebas de concurrencia y reintentos.
- **Estado:** Pendiente.
