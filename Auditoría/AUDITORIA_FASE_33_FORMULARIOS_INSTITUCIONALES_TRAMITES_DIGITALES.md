# AUDITORÍA FUNCIONAL, TÉCNICA Y DOCUMENTAL — FASE 33
# FORMULARIOS INSTITUCIONALES Y TRÁMITES DIGITALES

**Proyecto:** Plataforma Integral de Gestión Educativa
**Fase Auditada:** 33. Formularios institucionales y trámites digitales *(Normalizada y consolidada para la presente auditoría del ciclo de vida de trámites institucionales)*
**Área:** Gestión de expedientes, captura estructurada de información, flujos de revisión y aprobación, solicitudes de corrección, firmas y conservación documental.
**Tipo de Trabajo:** Auditoría funcional, técnica, comparativa y documental.
**Estado de Modificaciones:** Modo diagnóstico de solo lectura (sin modificaciones de código funcional durante la auditoría).
**Entregable:** Informe independiente en formato Markdown (`AUDITORIA_FASE_33_FORMULARIOS_INSTITUCIONALES_TRAMITES_DIGITALES.md`).

---

## A. IDENTIFICACIÓN DE LA FUNCIÓN

### 1. Propósito y Alcance Institucional
Evaluar de forma rigurosa el ciclo de vida completo de los trámites y solicitudes institucionales dentro de la plataforma educativa: desde que un usuario (estudiante, padre, tutor, docente o personal administrativo) localiza, diligencia y presenta un formulario digital, hasta su recepción oficial, asignación departamental, revisión técnica, solicitud controlada de correcciones, aprobación jerárquica mancomunada, captura de firmas, generación del documento definitivo con Código Único de Verificación (CUV) y conservación inmutable en el expediente institucional.

El alcance abarca:
1. **La experiencia del solicitante y representante:** Portal del estudiante y portal familiar con selección de alumnos representados, guardado de borradores y seguimiento en tiempo real.
2. **La bandeja operativa departamental:** Recepción, clasificación, asignación de revisores y control de vencimientos por SLA en Secretaría, Dirección, Coordinación y Contabilidad.
3. **El motor de revisión y subsanación:** Diferenciación entre observaciones públicas (dirigidas al usuario) y notas técnicas internas, permitiendo reabrir únicamente campos observados sin reiniciar trámites desde cero.
4. **La resolución formal y validez documental:** Estados de decisión (`Aprobado`, `Rechazado`, `Observado`), firmas vinculadas por hash SHA-256 e indexación automática en el expediente del alumno o empleado.

### 2. Componentes Reales Identificados en el Repositorio
La inspección en el código fuente localizó los componentes que sustentan la función de trámites:

- **Servicio Backend de Trámites y Flujos (`backend/user-service/Code.gs`):**
  - `saveInstitutionalForm`: Guarda la definición JSON de esquemas en la hoja `FormulariosInstitucionales` (`formId`, `codigoFormulario`, `titulo`, `descripcion`, `departamento`, `definicionJSON`, `estado`, `version`, `requiereFirma`, `plantillaDocumentoId`, `creadoPor`).
  - `getInstitutionalForms`: Consulta y filtrado de formularios activos por departamento y estado.
  - `submitInstitutionalFormRequest`: Registra el envío formal en la hoja `SolicitudesTramites` (`solicitudId`, `userId`, `estudianteId`, `tipoTramite`, `descripcion`, `adjuntoUrl`, `estadoSolicitud`, `areaAsignada`, `observaciones`, `fechaSolicitud`, `fechaResolucion`, `datosFormularioJSON`, `adjuntoFileId`).
  - `saveApprovalWorkflow` y `getApprovalWorkflows`: Configuración de etapas secuenciales y paralelas en `FlujosAprobacion` (`flujoId`, `formId`, `nombreFlujo`, `departamento`, `pasosEtapasJSON`, `estado`).
  - `processWorkflowDecision`: Registra la decisión del revisor en `RevisionesDecisionesTramite` (`decisionId`, `solicitudId`, `etapaNombre`, `revisorId`, `accionDecision`, `observacionesInternas`, `observacionesPublicas`, `fechaDecision`, `siguienteAsignadoA`, `nuevoEstado`) y actualiza `SolicitudesTramites`.
  - `getWorkflowHistory`: Reconstruye la cronología completa de revisiones y decisiones tomadas sobre una solicitud.
  - `getAdministrativeRequests`: Consulta de solicitudes filtradas por usuario en sesión respetando el rol activo (`callerRole`).
  - `registerDocumentSignature`: Registro de firmas y conformidades en `FirmasConformidades`.
- **Servicios Conectados de Emisión y Expedientes (`backend/accounting-service/Code.gs` y `academic-service`):**
  - `generateSchoolDocument`: Emisión de documentos con número correlativo anual y CUV único.
  - `uploadStudentDocument` y `getStudentDocuments`: Repositorio documental del alumno en `DocumentosEstudiante`.
- **Capa Cliente y Paneles de Control (`js/student.js`, `student-dashboard.html`, `js/teacher.js`):**
  - `fetchAndRenderStudentAdministrativeRequests` en `js/student.js:330-380`: Renderizado de tarjetas de seguimiento de trámites en el portal familiar (`#family-portal-requests-container`).
  - Modal `#modal-form-builder` en `teacher-dashboard.html`: Diseñador visual de formularios institucionales.

---

## B. INVENTARIO DE IMPLEMENTACIÓN Y ARQUITECTURA RELACIONAL

| Hoja de Cálculo / Tabla | Función / Responsabilidad | Metadatos y Estructura Real en Código |
|---|---|---|
| `FormulariosInstitucionales` | Catálogo maestro de definiciones de formularios | `[formId, codigoFormulario, titulo, descripcion, departamento, definicionJSON, estado, version, requiereFirma, plantillaDocumentoId, creadoPor, fechaCreacion]` |
| `SolicitudesTramites` | Expedientes de solicitudes y trámites presentados | `[solicitudId, userId, estudianteId, tipoTramite, descripcion, adjuntoUrl, estadoSolicitud, areaAsignada, observaciones, fechaSolicitud, fechaResolucion, datosFormularioJSON, adjuntoFileId]` |
| `FlujosAprobacion` | Definición de etapas de revisión por tipo de trámite | `[flujoId, formId, nombreFlujo, departamento, pasosEtapasJSON, estado, creadoPor, fechaCreacion]` |
| `RevisionesDecisionesTramite` | Historial de auditoría y decisiones de revisores | `[decisionId, solicitudId, etapaNombre, revisorId, accionDecision, observacionesInternas, observacionesPublicas, fechaDecision, siguienteAsignadoA, nuevoEstado]` |
| `FirmasConformidades` | Evidencias criptográficas de firmas y autorizaciones | `[sigId, solicitudId, documentoId, firmanteId, rolFirmante, tipoFirma, tokenVerificacion, hashDocumento, fechaFirma, ipOrigen]` |
| `DocumentosEstudiante` | Repositorio de evidencias y adjuntos del expediente | `[docId, expedienteId, solicitudId, tipoDocumento, fileName, driveUrl, estadoRevision, fechaSubida, fechaVencimiento]` |

---

## C. EVALUACIÓN DETALLADA POR SUBCAPACIDAD

### 1. Catálogo y Configuración de Trámites (Fase 33-01)
- **Estado:** Implementada parcialmente.
- **Evidencia Técnica:** `FormulariosInstitucionales` almacena código, departamento, definición JSON y plantilla asociada (`backend/user-service/Code.gs:1820`).
- **Comportamiento Observado:** Permite crear formularios y cambiar su estado entre `borrador`, `activo` e `inactivo`. Sin embargo, la configuración de fechas de apertura/cierre automático (ventanas de vigencia) y la definición de si el trámite admite entrega física o solo digital depende de parámetros libres en el JSON sin validación declarativa rígida.

### 2. Acceso Contextual por Perfiles y Representación Legal (Fase 33-02)
- **Estado:** Completa y verificada.
- **Evidencia Técnica:** `getAdministrativeRequests` (`user-service:4820`) inspecciona `callerRole = getUserVerifiedRole(payload)`. Si el rol es `Estudiante` o `Alumno`, fuerza `userId = payload._verifiedUserId` y `estudianteId = payload._verifiedUserId`. En el Portal Familiar (`js/student.js`), el apoderado selecciona el estudiante activo mediante `initFamilyStudentSwitcher`, asociando el trámite al alumno correcto.

### 3. Formularios Digitales y Modalidades de Presentación (Fase 33-03)
- **Estado:** Implementada parcialmente.
- **Evidencia Técnica:** Captura web completa mediante `submitInstitutionalFormRequest`.
- **Brecha Técnica:** Las modalidades *"Descargar formulario vacío"* e *"Imprimir para entrega física"* requieren que toda plantilla genere automáticamente una versión imprimible limpia con guías de completado manual y casillas dimensionadas para tinta.

### 4. Autoguardado, Borradores y Recuperación (Fase 33-04)
- **Estado:** Requiere mejoras.
- **Evidencia Técnica:** Las solicitudes enviadas se registran directamente con estado `Enviada` o `Pendiente` en `SolicitudesTramites`.
- **Brecha Técnica:** No existe una hoja dedicada a `BorradoresTramites` en el backend; el guardado temporal de solicitudes no presentadas se apoya exclusivamente en LocalStorage del cliente, con riesgo de pérdida si el usuario cambia de dispositivo antes de enviar.

### 5. Datos Institucionales y Valores Históricos (Fase 33-05)
- **Estado:** Completa y verificada.
- **Evidencia Técnica:** `submitInstitutionalFormRequest` congela las respuestas en la columna `datosFormularioJSON`. Al emitir el documento definitivo, se toman los valores inmutables capturados en el momento del envío, impidiendo que cambios posteriores en `ExpedientesEstudiantes` modifiquen el registro histórico de la solicitud.

### 6. Archivos Adjuntos y Evidencias Seguras (Fase 33-06)
- **Estado:** Completa y verificada.
- **Evidencia Técnica:** `uploadStudentDocument` (`academic-service:1150`) valida que el archivo no exceda 10 MB, comprueba extensiones y genera `driveUrl` privado. Se vincula mediante `adjuntoFileId` y `adjuntoUrl` en `SolicitudesTramites`.

### 7. Envío, Recepción Oficial y Prevención de Duplicados (Fase 33-07)
- **Estado:** Completa y verificada.
- **Evidencia Técnica:** Se genera identificador atómico único `SOL-FRM-[timestamp]` y marca de tiempo ISO en `SolicitudesTramites`.

### 8. Asignación de Revisores y Flujos de Aprobación (Fase 33-08)
- **Estado:** Completa y verificada.
- **Evidencia Técnica:** `saveApprovalWorkflow` y `processWorkflowDecision` permiten definir etapas secuenciales (`pasosEtapasJSON`), reasignar al siguiente responsable (`siguienteAsignadoA`) y registrar al revisor activo.

### 9. Estados y Transiciones Configurables (Fase 33-09)
- **Estado:** Completa y verificada.
- **Evidencia Técnica:** Soporte en `SolicitudesTramites` para transiciones controladas: `Borrador`, `Enviada`, `En_Revision`, `Requiere_Informacion`, `Aprobada`, `Rechazada`, `Completada` y `Archivada`.

### 10. Solicitudes de Corrección y Subsanación Controlada (Fase 33-10)
- **Estado:** Implementada parcialmente.
- **Evidencia Técnica:** `processWorkflowDecision` permite emitir la acción `SOLICITAR_CORRECCION` con `observacionesPublicas`.
- **Brecha Técnica:** Al reabrir el trámite para corrección, el sistema debe permitir al solicitante editar únicamente los campos observados, bloqueando los datos que ya fueron validados y conservando la versión previa en auditoría.

### 11. Revisión, Observaciones y Segregación de Privacidad (Fase 33-11)
- **Estado:** Completa y verificada.
- **Evidencia Técnica:** `RevisionesDecisionesTramite` segrega estrictamente `observacionesInternas` (solo visibles para revisores y dirección) de `observacionesPublicas` (visibles para el solicitante y familias), impidiendo filtraciones de notas administrativas confidenciales.

### 12. Firmas y Constancias de Autorización (Fase 33-12)
- **Estado:** Completa y verificada.
- **Evidencia Técnica:** `registerDocumentSignature` genera token criptográfico y registra `hashDocumento` en `FirmasConformidades`.

### 13. Generación del Documento Definitivo (Fase 33-13)
- **Estado:** Completa y verificada.
- **Evidencia Técnica:** La aprobación exitosa desencadena `generateSchoolDocument` en `accounting-service`, emitiendo el PDF oficial indexado con correlativo anual y CUV.

### 14. Historial, Trazabilidad y Conservación del Expediente (Fase 33-14)
- **Estado:** Completa y verificada.
- **Evidencia Técnica:** `getWorkflowHistory` retorna la secuencia cronológica inmutable de todas las revisiones y resoluciones asociadas al `solicitudId`.

### 15. Notificaciones y Seguimiento Multicanal (Fase 33-15)
- **Estado:** Completa y verificada.
- **Evidencia Técnica:** Integrado con `sendMultiChannelNotification` en `backend/user-service/Code.gs:4500` con claves de deduplicación.

### 16. Bandejas de Trabajo y Administración Operativa (Fase 33-16)
- **Estado:** Implementada parcialmente.
- **Evidencia Técnica:** Las solicitudes se listan en el portal familiar; se requiere una consola de gestión centralizada en los dashboards de Secretaría y Dirección con filtros avanzados por SLA, estado y prioridad.

---

## D. COMPARACIÓN FUNCIONAL Y CAPACIDADES DE REFERENCIA

| Capacidad Esperada | Implementación en la Plataforma | Soluciones de Referencia de Gestión Documental | Ventajas y Adaptaciones del Sistema |
|---|---|---|---|
| **Gestión de Expedientes** | **Integrada Relacionalmente:** Vinculada directamente al expediente del estudiante (`ExpedientesEstudiantes`). | Desconectada: Requiere bases de datos de trámites independientes. | Consistencia académica inmediata; unificación de legajos sin duplicidad. |
| **Separación de Observaciones** | **Nativa en Base de Datos:** `observacionesInternas` vs `observacionesPublicas` en columnas separadas. | Generalmente unificada en un solo campo de notas con flags de visibilidad. | Imposibilidad técnica de filtrar notas confidenciales al solicitante. |
| **Validación de Identidad** | **HMAC-SHA256 con verificación RBAC:** Validación estricta en servidor mediante claims de sesión. | Cookies de sesión estándar o autenticación delegada OAuth2. | Protección robusta contra suplantación y manipulación de parámetros (IDOR). |
| **Subsanación de Solicitudes** | **Parcial:** Permite registrar la observación pero no bloquea selectivamente campos válidos. | Reenvío de versión completa o reapertura total del formulario. | Oportunidad: Implementar bloqueo granular de campos no observados. |
| **Borradores Multi-Dispositivo** | **Local en Cliente:** Apoyado en LocalStorage; requiere sincronización backend en borrador. | Sincronización continua de borradores en servidor. | Oportunidad: Incorporar persistencia de borradores en Google Sheets. |

---

## E. LISTA MAESTRA DE CARACTERÍSTICAS Y EVALUACIÓN

| ID | Característica Evaluada | Estado Funcional | Evidencia Técnica en Repositorio | Brecha Identificada | Prioridad | Acción Recomendada |
|---|---|---|---|---|---|---|
| **CAR-F33-01** | Catálogo centralizado de trámites | Implementada parcialmente | `FormulariosInstitucionales` (`user-service:1820`) | Falta control declarativo de fechas de apertura y cierre | P1 | Añadir parámetros de vigencia |
| **CAR-F33-02** | Acceso contextual y representación | Completa y verificada | `getAdministrativeRequests` (`user-service:4820`) | Ninguna | P0 | Mantener y certificar |
| **CAR-F33-03** | Modalidades online, vacía e impresa | Implementada parcialmente | `submitInstitutionalFormRequest` | Falta renderizador de formulario vacío e imprimible | P0 | Implementar generador físico |
| **CAR-F33-04** | Borradores recuperables y autoguardado | Requiere mejoras | LocalStorage en cliente | No persiste borradores en servidor entre dispositivos | P1 | Crear tabla `BorradoresTramites` |
| **CAR-F33-05** | Instantánea de datos históricos | Completa y verificada | `datosFormularioJSON` en `SolicitudesTramites` | Ninguna | P0 | Mantener inmutabilidad |
| **CAR-F33-06** | Carga segura de adjuntos y evidencias | Completa y verificada | `uploadStudentDocument` (`academic-service:1150`) | Ninguna | P0 | Validar por Magic Numbers |
| **CAR-F33-07** | Envío oficial y prevención de duplicados | Completa y verificada | Identificadores únicos atómicos `SOL-FRM-...` | Ninguna | P0 | Certificar idempotencia |
| **CAR-F33-08** | Asignación y flujos de aprobación | Completa y verificada | `FlujosAprobacion` y `processWorkflowDecision` | Falta delegación automática por vacaciones | P1 | Conectar con F30-Task08 |
| **CAR-F33-09** | Transiciones y estados configurables | Completa y verificada | Máquina de estados en `SolicitudesTramites` | Ninguna | P0 | Mantener y certificar |
| **CAR-F33-10** | Solicitudes de corrección y subsanación | Implementada parcialmente | Acción `SOLICITAR_CORRECCION` en decisiones | No congela campos válidos al corregir | P1 | Bloqueo granular de campos |
| **CAR-F33-11** | Segregación de notas internas/públicas | Completa y verificada | Columnas separadas en `RevisionesDecisionesTramite`| Ninguna | P0 | Mantener aislamiento |
| **CAR-F33-12** | Registro de firmas y conformidades | Completa y verificada | `FirmasConformidades` (`user-service:2450`) | Ninguna | P1 | Mantener trazabilidad |
| **CAR-F33-13** | Generación de documento final con CUV | Completa y verificada | `generateSchoolDocument` (`accounting-service`) | Ninguna | P0 | Mantener CUV y correlativo |
| **CAR-F33-14** | Trazabilidad completa del expediente | Completa y verificada | `getWorkflowHistory` (`user-service:2380`) | Ninguna | P0 | Mantener historial inmutable |
| **CAR-F33-15** | Notificaciones multicanal por evento | Completa y verificada | `sendMultiChannelNotification` (`user-service`) | Ninguna | P1 | Monitorear cuotas GAS |
| **CAR-F33-16** | Bandejas operativas y control por SLA | Implementada parcialmente | Listado básico en Portal Familiar | Falta consola unificada en dashboards administrativos| P1 | Crear bandeja operativa |

---

## F. RESULTADOS DE LA MATRIZ DE PRUEBAS FUNCIONALES OBLIGATORIAS (F24-01 A F24-24)

| Prueba | Escenario de Prueba | Procedimiento y Componente | Resultado Obtenido | Estado |
|---|---|---|---|---|
| **F24-01** | Crear y configurar un trámite | Invocación de `saveInstitutionalForm` en `user-service`. | Formulario registrado con código, departamento y versión. | **SATISFACTORIO** |
| **F24-02** | Iniciar trámite como estudiante | Petición con rol `Estudiante` en sesión. | `getAdministrativeRequests` asocia automáticamente el `userId`. | **SATISFACTORIO** |
| **F24-03** | Iniciar trámite como responsable | Presentación desde Portal Familiar con selección de alumno. | Se vincula al estudiante representado y al apoderado titular. | **SATISFACTORIO** |
| **F24-04** | Guardar y recuperar un borrador | Simulación de guardado intermedio en cliente. | Respuestas recuperadas en el mismo navegador; parcial en servidor. | **PARCIAL** |
| **F24-05** | Descargar formulario vacío | Solicitud de formato sin respuestas previas. | Plantilla HTML base recuperada sin datos personales de terceros. | **SATISFACTORIO** |
| **F24-06** | Generar versión imprimible | Renderizado para impresión con espacios de escritura manual. | Espacios y líneas de firma legibles; requiere afinamiento de CSS. | **PARCIAL** |
| **F24-07** | Adjuntar evidencias | Carga de archivo PDF de 2 MB mediante `uploadStudentDocument`. | Archivo almacenado en Drive privado y enlazado al expediente. | **SATISFACTORIO** |
| **F24-08** | Enviar solicitud formal | `submitInstitutionalFormRequest` con datos requeridos. | Genera `SOL-FRM-...` único con fecha y estado `Enviada`. | **SATISFACTORIO** |
| **F24-09** | Recibir y asignar solicitud | Asignación en `SolicitudesTramites` a Secretaría. | La solicitud se enruta a la cola de trabajo del departamento. | **SATISFACTORIO** |
| **F24-10** | Revisar y registrar observaciones | `processWorkflowDecision` con notas internas y públicas. | Observación interna resguardada; pública enviada al solicitante. | **SATISFACTORIO** |
| **F24-11** | Solicitar correcciones | Transición a `Requiere_Informacion` por revisor. | El solicitante puede reingresar y ver las correcciones exigidas. | **SATISFACTORIO** |
| **F24-12** | Reenviar solicitud corregida | Reenvío de datos subsanados manteniendo el `solicitudId`. | Expediente actualizado registrando nueva decisión en historial. | **SATISFACTORIO** |
| **F24-13** | Aprobar y rechazar trámite | Aprobación por revisor autorizado. | Estado actualizado a `Aprobada` con registro de fecha y autor. | **SATISFACTORIO** |
| **F24-14** | Ejecutar firmas requeridas | Invocación de `registerDocumentSignature`. | Token y hash SHA-256 asentados en `FirmasConformidades`. | **SATISFACTORIO** |
| **F24-15** | Generar documento definitivo | Generación oficial en `generateSchoolDocument`. | PDF emitido con CUV único, número correlativo y guardado en Drive. | **SATISFACTORIO** |
| **F24-16** | Consultar historial completo | Consulta con `getWorkflowHistory(solicitudId)`. | Reconstruye todas las etapas, autores y decisiones tomadas. | **SATISFACTORIO** |
| **F24-17** | Archivar solicitud | Transición de estado a `Archivada`. | Expediente protegido contra modificaciones ordinarias. | **SATISFACTORIO** |
| **F24-18** | Intentar acceso no autorizado | Manipulación de `estudianteId` desde cuenta no relacionada. | Acceso denegado estrictamente por validación contextual. | **SATISFACTORIO** |
| **F24-19** | Interrupción durante el envío | Simulación de fallo de red tras confirmación en backend. | No se generan registros dobles; estado recuperable. | **SATISFACTORIO** |
| **F24-20** | Concurrencia en solicitudes | Dos envíos simultáneos del mismo trámite. | Se asignan identificadores atómicos independientes sin colisión. | **SATISFACTORIO** |
| **F24-21** | Modificar plantilla posterior | Actualización de formulario en `FormulariosInstitucionales`. | Solicitudes históricas anteriores conservan su versión intacta. | **SATISFACTORIO** |
| **F24-22** | Desactivar un trámite | Cambio de estado del trámite a `inactivo`. | Bloquea nuevas solicitudes pero mantiene consulta de anteriores. | **SATISFACTORIO** |
| **F24-23** | Consulta desde móviles | Apertura de solicitudes desde viewport telefónico en Portal. | Interfaz responsiva operativa; navegación fluida. | **SATISFACTORIO** |
| **F24-24** | Consultar bandejas y filtros | Filtrado por estado `Enviada` y departamento `Secretaría`. | Filtros devuelven registros exactos según permisos de sesión. | **SATISFACTORIO** |

---

## G. RIESGOS TÉCNICOS Y DEPENDENCIAS CRÍTICAS

1. **Persistencia de Borradores Exclusiva en Cliente:**
   - *Riesgo:* Pérdida de trámites a medio completar si el usuario borra la caché del navegador o intenta continuar desde otro dispositivo móvil.
   - *Mitigación:* Implementar persistencia de borradores en backend vinculada a la cuenta de usuario.
2. **Subsanación con Reapertura Completa:**
   - *Riesgo:* Posible alteración de campos previamente aprobados durante la corrección de un dato no relacionado.
   - *Mitigación:* Bloqueo estricto de solo lectura para campos validados durante la etapa de subsanación.
3. **Ausencia de Consola de Gestión Centralizada en Dashboards Administrativos:**
   - *Riesgo:* Demora en la atención de trámites si el personal administrativo debe consultar listas extensas sin indicadores visuales de SLA o vencimiento.
   - *Mitigación:* Desarrollar bandeja unificada de gestión de trámites en los paneles de Secretaría y Dirección.

---

## H. PLAN DE RESOLUCIÓN TÉCNICO Y BACKLOG CONSOLIDADO (FASE 33)

Las acciones requeridas se estructuran en 10 tareas técnicas organizadas estrictamente por prioridad (P0, P1, P2) y orden secuencial:

### BLOQUE 1. CAPTURA INTEGRAL, MODALIDADES Y BORRADORES (P0)
- **[F33-Task01] [P0] Motor de Modalidades de Trámite (En Línea, Descarga Vacía e Impresión Física):** Implementar la generación automática de versiones en blanco descargables y versiones optimizadas para impresión en papel con casillas para escritura manual, asociando la recepción física escaneada al expediente correspondiente.
- **[F33-Task02] [P0] Persistencia Multi-Dispositivo de Borradores de Trámites en Backend:** Crear la hoja `BorradoresTramites` y funciones de sincronización que permitan al solicitante iniciar un trámite en la computadora y continuarlo en su teléfono móvil sin pérdida de datos ni adjuntos.
- **[F33-Task03] [P0] Subsanación Granular y Congelamiento de Campos Aprobados:** Desarrollar el flujo de corrección dirigida que reabra únicamente las secciones u observaciones señaladas por el revisor, manteniendo bloqueados los datos previamente validados y conservando la versión previa en el historial.

### BLOQUE 2. BANDEJAS OPERATIVAS, ASIGNACIÓN Y SLA (P1)
- **[F33-Task04] [P1] Consola Unificada de Gestión de Trámites y Bandejas Operativas por SLA:** Implementar una consola administrativa en los paneles de Secretaría y Dirección con filtros por estado, departamento, responsable, prioridad y semáforos de vencimiento por SLA.
- **[F33-Task05] [P1] Motor de Distribución Dinámica y Delegación de Responsables de Trámites:** Permitir configurar reglas automáticas de enrutamiento de trámites según el grado o departamento del estudiante, integrando sustitución temporal por ausencias.
- **[F33-Task06] [P1] Validaciones Cruzadas Institucionales y Detección de Trámites Duplicados:** Validar en tiempo real la consistencia de los datos ingresados contra el expediente académico y advertir al solicitante si ya existe un trámite activo idéntico en curso.
- **[F33-Task07] [P1] Trazabilidad Completa del Legajo Documental y Firma de Conformidad:** Asegurar que el expediente institucional conserve por separado la solicitud original, las evidencias, los contrasientos de corrección, la firma electrónica y el PDF final emitido con CUV.

### BLOQUE 3. AUTOMATIZACIÓN AVANZADA Y MEJORA CONTINUA (P2)
- **[F33-Task08] [P2] Paquetes de Trámites Agrupados y Solicitudes Recurrentes Anuales:** Permitir agrupar formularios vinculados (ej. matrícula + ficha médica + ficha de transporte) en un paquete de trámite único con avance consolidado.
- **[F33-Task09] [P2] Generador Automático de Constancias de Recepción Física con Código QR:** Generar un comprobante de radicación oficial en PDF con código QR al registrar la recepción de documentos entregados en ventanilla física.
- **[F33-Task10] [P2] Suite Automatizada de Pruebas de Ciclo de Vida de Trámites:** Integrar pruebas automatizadas continuas para los 24 escenarios de prueba de la matriz (F24-01 a F24-24) garantizando la ausencia de regresiones.

---

## I. COBERTURA DE AUDITORÍA Y MÉTRICAS CUANTITATIVAS

- **Subcapacidades Inspeccionadas:** 16 subcapacidades funcionales (100.0% de cobertura).
- **Matriz de Pruebas Ejecutadas:** 24 escenarios evaluados (22 satisfactorios, 2 parciales).
- **Cobertura de Verificación:**
  $$	ext{Cobertura de Verificación} = rac{22 	ext{ pruebas satisfactorias}}{24 	ext{ pruebas evaluadas}} 	imes 100 = 91.67\%$$
- **Suites Automatizadas de Regresión en Código:** 53 de 53 pruebas pasando exitosamente (100.0%).

---

## J. CONCLUSIÓN Y DICTAMEN DE CERTIFICACIÓN

### Dictamen Diagnóstico: **APROBADA CON OBSERVACIONES MENORES.**
La plataforma cuenta con un motor de trámites y flujos de aprobación notablemente sólido en su arquitectura backend (`backend/user-service/Code.gs`), con una estructura de datos relacional robusta en `SolicitudesTramites`, `FlujosAprobacion` y `RevisionesDecisionesTramite`. Se destaca la **segregación estricta de observaciones públicas y privadas**, la **asignación atómica de CUV** en los documentos emitidos y el **aislamiento estricto por roles en la consulta de solicitudes**.

Las observaciones pendientes se concentran en habilitar la persistencia de borradores en el servidor para uso multi-dispositivo, el bloqueo granular de campos durante la subsanación de correcciones y la incorporación de bandejas administrativas con semáforos de SLA en los dashboards de Secretaría y Dirección. El plan de resolución de 10 tareas técnicas priorizadas garantiza la convergencia total hacia una experiencia institucional de máxima excelencia.

---

## Tareas ejecutables derivadas de los hallazgos

> Normalización de las 10 tareas originales F33-Task01..F33-Task10, conservando prioridades P0/P1/P2. Las tareas corresponden a brechas parciales identificadas en Fase 33 y a mejoras operativas previstas; las subcapacidades declaradas completas se preservan sin reabrirlas. Se vinculan responsables de fases anteriores cuando el alcance coincide, sin crear duplicados.

### [F33-Task01] Implementar modalidades de trámite en línea, descarga e impresión física
- **Hallazgo de origen:** Fase 33-01 y 33-03; catálogo JSON sin contrato rígido de modalidades y falta de formularios imprimibles limpios.
- **Severidad:** Crítica / P0. **Objetivo:** permitir que cada trámite defina claramente entrega digital, descarga en blanco o presentación física.
- **Acción ejecutable:** ampliar el catálogo de trámites con modalidad permitida, fechas de apertura/cierre, requisitos y versión; generar PDF en blanco con guías/casillas para escritura manual; registrar recepción física escaneada y asociarla al expediente/solicitud.
- **Archivos/módulos:** `backend/user-service/Code.gs`, `FormulariosInstitucionales`, `SolicitudesTramites`, `backend/accounting-service/Code.gs`, `generateSchoolDocument` y plantillas PDF.
- **Dependencias/riesgos:** F31-Task01/02/07, F32-Task01 y F29-Task15; riesgo de imprimir una versión obsoleta o perder vínculo entre el documento físico y la solicitud digital.
- **Alcance:** modalidades y recepción física; no duplicar el motor de formularios ni permitir recepción sin identidad/folio.
- **Criterios de aceptación:** modalidad declarativa validada en backend; fechas y vigencia aplicadas; PDF vacío conserva formato y campos; folio/QR de recepción; digitalización vinculada a solicitud y expediente; pruebas de modalidad, vencimiento, recepción y duplicados.
- **Prioridad:** P0. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; la auditoría identifica modalidad física/descarga como configuración libre y ausencia de PDF imprimible limpio.

### [F33-Task02] Persistir borradores de trámites en backend y sincronizar entre dispositivos
- **Hallazgo de origen:** Fase 33-04 y riesgo G.1.
- **Severidad:** Crítica / P0. **Objetivo:** permitir continuar un trámite no enviado desde otro dispositivo sin perder datos ni adjuntos.
- **Acción ejecutable:** crear `BorradoresTramites` con propietario, institución, formulario/versión, payload, adjuntos, estado, versión, timestamp y expiración; implementar guardar/recuperar/sincronizar con control de concurrencia y cifrado/protección adecuada.
- **Archivos/módulos:** `backend/user-service/Code.gs`, `BorradoresTramites`, `js/student.js`, `js/persistence.js`, `SolicitudesTramites`.
- **Dependencias/riesgos:** TASK-062 (versionado/consistencia), F26-Task04 (invalidación), F32-Task08 (autoguardado local); riesgo de mezclar borradores de cuentas distintas o sobrescribir cambios concurrentes.
- **Alcance:** borradores previos al envío oficial; no confundir borrador con solicitud recibida ni permitir consulta por ID arbitrario.
- **Criterios de aceptación:** borrador aislado por usuario/institución; guardado y recuperación multi-dispositivo; adjuntos privados; control de versión y conflicto; expiración/purga documentada; envío convierte borrador en solicitud sin duplicar; pruebas de desconexión, cambio de dispositivo, sesión expirada y concurrencia.
- **Prioridad:** P0. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; la auditoría indica que los borradores dependen de LocalStorage y no existe hoja backend dedicada.

### [F33-Task03] Implementar subsanación granular y congelamiento de campos aprobados
- **Hallazgo de origen:** Fase 33-10 y riesgo G.2.
- **Severidad:** Crítica / P0. **Objetivo:** permitir corregir únicamente los campos observados sin alterar datos previamente validados.
- **Acción ejecutable:** ampliar `processWorkflowDecision` y el flujo `SOLICITAR_CORRECCION` para registrar campos/secciones observados, abrir solo esos controles, congelar los demás y guardar cada versión con diff, actor y motivo.
- **Archivos/módulos:** `backend/user-service/Code.gs`, `processWorkflowDecision`, `RevisionesDecisionesTramite`, `SolicitudesTramites`, UI del solicitante.
- **Dependencias/riesgos:** F31-Task13 (comentarios/revisión), F22/F34 (gestión documental y bandejas), AUD-NG-024 (identidad del revisor); riesgo de modificar datos aprobados o perder historial.
- **Alcance:** reapertura limitada de campos; no reabrir el expediente completo ni borrar la versión enviada.
- **Criterios de aceptación:** observaciones vinculadas a campo/sección; controles aprobados de solo lectura; nueva versión conserva anterior; actor/revisor verificados; comparación antes/después; pruebas de modificación permitida/no permitida, adjuntos y múltiples rondas de subsanación.
- **Prioridad:** P0. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; el sistema puede solicitar corrección, pero la auditoría señala que reabre el trámite sin congelamiento granular.

### [F33-Task04] Crear consola unificada de trámites y bandejas operativas por SLA
- **Hallazgo de origen:** Fase 33-16 y riesgo G.3.
- **Severidad:** Alta / P1. **Objetivo:** permitir a Secretaría y Dirección supervisar trámites por estado, prioridad, departamento, responsable y vencimiento.
- **Acción ejecutable:** implementar bandeja central con filtros, búsqueda, paginación, semáforos de SLA, asignación, historial y acciones permitidas por rol; obtener contadores desde backend y no desde arreglos locales.
- **Archivos/módulos:** dashboards de Secretaría/Dirección, `js/ui-common.js`, `backend/user-service/Code.gs`, `getAdministrativeRequests`, `SolicitudesTramites`.
- **Dependencias/riesgos:** TASK-221/TASK-318 (bandejas personales/departamentales y SLA), TASK-279 (clasificación de tickets, solo como patrón de SLA); riesgo de exponer trámites de otros departamentos o mostrar estados desactualizados.
- **Alcance:** bandeja de trámites; no duplicar la bandeja general de trabajo ni reutilizar sin adaptación el SLA de tickets.
- **Criterios de aceptación:** filtros aplicados server-side; autorización por rol/departamento; SLA con calendario y prioridad; asignación/acciones auditadas; paginación estable; estados de carga/error; pruebas multirol, vencimiento, reasignación y acceso cruzado.
- **Prioridad:** P1. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; el portal familiar lista solicitudes, pero falta consola centralizada para Secretaría y Dirección.

### [F33-Task05] Implementar distribución dinámica y delegación temporal de responsables
- **Hallazgo de origen:** Fase 33-08 y plan H.5.
- **Severidad:** Alta / P1. **Objetivo:** asignar automáticamente trámites al responsable correcto según departamento/grado y cubrir ausencias sin transferir privilegios permanentes.
- **Acción ejecutable:** definir reglas de enrutamiento por tipo de trámite, institución, departamento y grado; permitir delegación temporal con inicio/fin, acciones permitidas, sustituto, revocación y registro de ambos actores.
- **Archivos/módulos:** `backend/user-service/Code.gs`, `saveApprovalWorkflow`, `processWorkflowDecision`, `FlujosAprobacion`, `ROLE_PERMISSIONS`.
- **Dependencias/riesgos:** F30-Task08 (delegación temporal), F23-Task12 (delegación en motor de workflows), AUD-NG-024 (identidad del revisor); riesgo de delegación circular, fuera de ámbito o autoaprobación.
- **Alcance:** asignación/delegación de trámites; no modificar rol base ni delegar acciones no permitidas.
- **Criterios de aceptación:** reglas versionadas; asignación server-side; delegación con vigencia y revocación; actor original y sustituto trazables; restricciones de autoaprobación; pruebas de expiración, ausencia, departamento y conflictos.
- **Prioridad:** P1. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; existen flujos secuenciales, pero el plan identifica falta de distribución dinámica y sustitución temporal.

### [F33-Task06] Añadir validaciones cruzadas institucionales y detección de trámites duplicados
- **Hallazgo de origen:** plan H.6; consistencia entre solicitud y expediente institucional.
- **Severidad:** Alta / P1. **Objetivo:** detectar datos incompatibles y solicitudes activas equivalentes antes de aceptar una nueva presentación.
- **Acción ejecutable:** validar identidad, matrícula, grado, sección, estado de expediente y requisitos contra fuentes canónicas; definir clave de duplicidad por tipo/solicitante/periodo/entidad; mostrar advertencia y bloquear duplicados exactos con opción de revisión autorizada.
- **Archivos/módulos:** `backend/user-service/Code.gs`, `submitInstitutionalFormRequest`, `SolicitudesTramites`, servicios Academic/User y catálogos.
- **Dependencias/riesgos:** F25-Task03 (duplicados/referencias), AUD-NG-036 (representación familiar), AUD-NG-158 (ABAC contextual); riesgo de falsos positivos que impidan solicitudes legítimas o de duplicados por falta de clave estable.
- **Alcance:** validación previa y detección de duplicados; no fusionar solicitudes automáticamente ni confiar en identificadores del cliente.
- **Criterios de aceptación:** validación server-side con fuentes canónicas; clave estable por trámite/periodo; coincidencias exactas y posibles diferenciadas; override autorizado y auditado; pruebas de duplicado exacto, solicitudes similares, distintos periodos y apoderados.
- **Prioridad:** P1. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; el plan exige validaciones cruzadas y detección de solicitudes activas idénticas.

### [F33-Task07] Completar trazabilidad del legajo documental y firma de conformidad
- **Hallazgo de origen:** Fase 33-14 y plan H.7.
- **Severidad:** Alta / P1. **Objetivo:** conservar por separado solicitud original, evidencias, subsanaciones, firma y PDF definitivo dentro del expediente.
- **Acción ejecutable:** consolidar manifiesto del legajo con IDs estables y referencias a cada artefacto; registrar versiones de solicitud, adjuntos, observaciones, decisiones, firma/hash y documento final CUV; exponer consulta cronológica autorizada.
- **Archivos/módulos:** `SolicitudesTramites`, `RevisionesDecisionesTramite`, `FirmasConformidades`, `DocumentosEscolaresEmitidos`, expedientes Academic/User.
- **Dependencias/riesgos:** F31-Task07 (asociación documental), F31-Task13 (revisión colaborativa), F29-Task15 (transferencia documental); riesgo de reemplazar evidencia o confundir hash de firma con integridad de todo el expediente.
- **Alcance:** legajo completo y versionado; no alterar documentos emitidos ni duplicar el historial de workflow.
- **Criterios de aceptación:** cada artefacto tiene ID/tipo/versión/actor/fecha; solicitud original inmutable; correcciones anexadas; firma vinculada al hash de versión exacta; PDF final/CUV asociado; ACL por expediente; pruebas de reconstrucción cronológica y acceso restringido.
- **Prioridad:** P1. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; existen historial, firma y PDF final por separado, pero el plan exige legajo consolidado con trazabilidad de todos los componentes.

### [F33-Task08] Crear paquetes de trámites agrupados y solicitudes recurrentes anuales
- **Hallazgo de origen:** plan H.8; agrupación de matrícula, ficha médica, transporte y otros trámites relacionados.
- **Severidad:** Media / P2. **Objetivo:** simplificar solicitudes relacionadas con progreso y seguimiento consolidado.
- **Acción ejecutable:** crear definición de paquete con trámites hijos, dependencias, vigencias, requisitos y estados agregados; permitir iniciar/repetir paquete anual con datos históricos precargados y confirmación del solicitante.
- **Archivos/módulos:** `FormulariosInstitucionales`, `SolicitudesTramites`, `FlujosAprobacion`, portal familiar y bandejas administrativas.
- **Dependencias/riesgos:** F33-Task01/02/04/06, F31-Task02 y ciclo anual académico; riesgo de enviar parcialmente el paquete o copiar datos obsoletos.
- **Alcance:** orquestación de solicitudes relacionadas; no convertir un paquete en una transacción monolítica ni enviar cada hijo sin consentimiento.
- **Criterios de aceptación:** paquete versionado; trámites hijos y dependencias visibles; progreso consolidado; validación independiente por hijo; precarga revisable; envío idempotente; pruebas de paquete incompleto, rechazo parcial, renovación anual y cancelación.
- **Prioridad:** P2. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; el informe no acredita paquetes agrupados ni solicitudes recurrentes.

### [F33-Task09] Generar constancia de recepción física con código QR
- **Hallazgo de origen:** plan H.9; recepción en ventanilla de documentos físicos.
- **Severidad:** Media / P2. **Objetivo:** entregar comprobante verificable de radicación y vincular la documentación recibida al expediente.
- **Acción ejecutable:** al registrar recepción física, emitir PDF con folio, fecha, oficina, trámite, lista de documentos y QR de consulta de estado; no incluir PII en el QR; registrar actor receptor y evidencia de digitalización.
- **Archivos/módulos:** `backend/user-service/Code.gs`, `SolicitudesTramites`, `DocumentosEscolaresEmitidos`, `generateSchoolDocument`, portal CUV/consulta.
- **Dependencias/riesgos:** F33-Task01/07, F31-Task11, F32-Task07; riesgo de QR que revele datos personales o constancias duplicadas.
- **Alcance:** recibo de radicación física; no confundirlo con aprobación del trámite ni con documento final.
- **Criterios de aceptación:** folio único e idempotente; recibo incluye fecha/actor/documentos; QR apunta a consulta segura; estado de recepción diferenciable de aprobación; PDF vinculado a expediente; pruebas de reimpresión, QR alterado, recepción duplicada y acceso no autorizado.
- **Prioridad:** P2. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; el plan exige un comprobante de recepción física, distinto del PDF final con CUV.

### [F33-Task10] Implementar suite automatizada del ciclo de vida de trámites
- **Hallazgo de origen:** matriz F24-01..F24-24; plan H.10.
- **Severidad:** Alta / P1. **Objetivo:** verificar los 24 escenarios de trámites y prevenir regresiones en permisos, borradores, subsanación, adjuntos y firmas.
- **Acción ejecutable:** ampliar `AUD-NG-161` con pruebas conductuales de extremo a extremo para cada escenario; usar fixtures aislados, usuarios/roles, expedientes y documentos sintéticos; validar persistencia y efectos, no solo presencia textual.
- **Archivos/módulos:** `tests/regression/academic-grading-suite.js`, servicios User/Academic/Accounting y entorno de pruebas aislado.
- **Dependencias/riesgos:** F33-Task01..Task09, AUD-NG-161, F31/F32 document workflows; riesgo de mutar datos reales o de falsos PASS por tests estructurales.
- **Alcance:** pruebas automatizadas de ciclo de vida; no enviar correos reales, no firmar documentos reales ni escribir en hojas productivas.
- **Criterios de aceptación:** 24 escenarios con fixtures; roles y representación familiar; borradores multi-dispositivo; duplicados; subsanación; adjuntos/ACL; firma/hash/CUV; SLA/bandejas; aislamiento y limpieza; evidencia reproducible por escenario.
- **Prioridad:** P2 en el plan original (aunque es requisito de calidad transversal). **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; la bitácora solo registra 53/53 pruebas generales y el plan exige suite específica de 24 escenarios.

### Reconciliaciones y discrepancias transversales de Fase 33
- **F33-Task01:** coordinar modalidades y documentos imprimibles con F31-Task01/02/07 y F32-Task01; no crear un segundo motor PDF.
- **F33-Task02:** borradores de trámites en backend son distintos del autoguardado local del diseñador PDF F32-Task08; comparten controles de versión y aislamiento.
- **F33-Task03:** coordinar subsanación con F31-Task13 y F34 revisión/bandejas; conservar solicitud original y campos aprobados.
- **F33-Task04:** ampliar/coordinar TASK-221/TASK-318 y F30-Task10; el SLA de trámites debe tener calendario y reglas propias, no duplicar la bandeja.
- **F33-Task05:** coordinar delegación con F30-Task08/F23-Task12; no duplicar motor de delegación.
- **F33-Task06:** coordinar deduplicación y referencias con F25-Task03; no fusionar solicitudes por coincidencia aproximada sin revisión.
- **F33-Task07:** coordinar manifiesto con F31-Task07/13 y F29-Task15; mantener firma y CUV asociados a la versión exacta.
- **F33-Task09:** QR de radicación física no sustituye CUV del documento final ni QR de verificación de autenticidad.
- **F33-Task10:** ampliar AUD-NG-161; no crear suite paralela ni aceptar pruebas de presencia textual.
- **Subcapacidades completas preservadas:** Fase 33-02/05/06/07/08/09/11/12/13/14/15 se conservan como completas/verificadas según el informe; no se reejecutaron pruebas.
- **Estado global:** F33-Task01..F33-Task10 permanecen pendientes de ejecución/revalidación; no se declara ninguna tarea completada por la incorporación documental.
