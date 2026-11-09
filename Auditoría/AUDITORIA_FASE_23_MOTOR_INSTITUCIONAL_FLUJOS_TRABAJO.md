# AUDITORÍA FUNCIONAL, TÉCNICA Y DOCUMENTAL — FASE 23
# Motor Institucional de Flujos de Trabajo y Arquitectura Distribuida Multicuenta

**Proyecto:** Plataforma Integral de Gestión Educativa
**Fase Auditada:** 23
**Área:** Motor Institucional de Flujos de Trabajo (BPM), Trámites, Orquestación Distribuida Multicuenta GAS y Gobernanza
**Tipo de Trabajo:** Auditoría Funcional, Inspección Técnica y Verificación de Arquitectura
**Estado de Modificaciones en Código:** No autorizadas durante esta fase de auditoría diagnóstica
**Fecha de Emisión:** 2025

---

## A. Identificación

### 1. Propósito y Alcance
La Fase 23 tiene como objetivo evaluar y formalizar la arquitectura del **Motor Institucional de Flujos de Trabajo (BPM / Workflows)** y el desacoplamiento mediante una **Arquitectura Distribuida Multicuenta** sobre Google Workspace / Google Apps Script (GAS). Esta arquitectura garantiza que las solicitudes, trámites administrativos, aprobaciones presupuestarias, revisiones disciplinarias, sustituciones docentes y permisos de personal circulen a través de máquinas de estado gobernadas, transiciones atómicas, colas de trabajo por rol/departamento, escalamientos automáticos por SLA, y desacoplamiento de almacenamiento para evadir los límites de cuota (límites de 10 millones de celdas por hoja, límites de ejecución de 6 minutos y cuotas diarias de llamadas `UrlFetchApp` y `LockService`).

### 2. Componentes y Servicios Evaluados
- **Controlador Central de Trámites y Flujos:** `backend/user-service/Code.gs` (funciones de workflows `saveApprovalWorkflow`, `getApprovalWorkflows`, `processWorkflowDecision`, `getWorkflowHistory`, y trámites `submitAdministrativeRequest`, `getAdministrativeRequests`, `updateRequestStatus`).
- **Catálogo Central de Spreadsheets y Rutas Distribuidas:** `backend/accounting-service/Code.gs` (`CatalogoSpreadsheets`, `resolveSpreadsheetSource`, `registerSpreadsheetSource`).
- **Plano de Control y Gobernanza de Microservicios:** `backend/developer-service/Code.gs` (`CatalogoContratos`, `CatalogoServicios`, `batchSpreadsheetReadOperations`, `migrateSpreadsheetSchema`, `auditServiceBackendIsolationAndDriveSecurity`).
- **Interfaz y Capa de Transporte de Cliente:** `js/api.js` (despacho a endpoints GAS, manejo de tokens HMAC y almacenamiento local offline).

### 3. Roles Operativos Involucrados
- **Administrador del Sistema:** Diseñador y configurador de workflows, administrador de pasarelas y catálogos de cuentas de servicio.
- **Dirección / Rectoría:** Aprobador de última instancia para flujos críticos (presupuestos de alto valor, bajas de activos, despidos o expedientes disciplinarios graves).
- **Subdirección / Coordinación Académica:** Revisor y aprobador de trámites académicos (convalidaciones, cambios de sección, sustituciones y planificaciones).
- **Secretaría General:** Recepción, validación documental inicial y emisión de resoluciones.
- **Personal / Docente / Empleado:** Iniciador de trámites institucionales, requisiciones y permisos.
- **Padres de Familia / Tutores Legales / Estudiantes:** Iniciadores de solicitudes de constancias, becas, justificaciones de inasistencia y reclamos de calificaciones.

---

## B. Inventario Real de Implementaciones

1. **Definición de Flujos de Aprobación (`FlujosAprobacion`):**
   - Implementado en `backend/user-service/Code.gs:6365` (`saveApprovalWorkflow`, `getApprovalWorkflows`).
   - Permite registrar plantillas de flujo con campos `FlujoID`, `FormID`, `NombreFlujo`, `Departamento`, `PasosEtapasJSON`, `Estado`, `Version`, `FechaCreacion`, `CreadoPor`.
   - Soporta versionamiento secuencial automático al actualizar un flujo existente.
2. **Registro de Decisiones de Revisión (`RevisionesDecisionesTramite`):**
   - Implementado en `backend/user-service/Code.gs:6456` (`processWorkflowDecision`, `getWorkflowHistory`).
   - Registra transiciones con `DecisionID`, `SolicitudID`, `EtapaNombre`, `RevisorID`, `AccionDecisión` (`APROBADO`, `RECHAZADO`, `DEVUELTO_CORRECCION`, `DERIVADO`), observaciones internas/públicas, fecha y metadatos IP.
   - Sincroniza el estado en `SolicitudesTramites`.
3. **Catálogo de Spreadsheets Distribuidos (`CatalogoSpreadsheets`):**
   - Implementado en `backend/accounting-service/Code.gs:9510` (`registerSpreadsheetSource`, `resolveSpreadsheetSource`, `getSpreadsheetCatalog`).
   - Permite mapear áreas de dominio y años lectivos hacia IDs de hojas independientes, aislando la carga de I/O.
4. **Firmas y Trazabilidad de Conformidades (`FirmasConformidades`):**
   - Implementado en `backend/user-service/Code.gs:6546` (`registerDocumentSignature`), integrado a la historia del workflow.
5. **Comunicación Inter-Servicio Básica:**
   - Mecanismo en `backend/user-service/Code.gs:7020` (`delegateToTaskService`) utilizando `UrlFetchApp.fetch` con fallback local en caso de fallo de red.

---

## C. Estado Funcional y Comparación Externa

A partir del análisis de motores de flujo líderes en entornos educativos y corporativos (Camunda BPM, Microsoft Power Automate, Google AppSheet, ServiceNow Educational Workflows):

| Capacidad Estándar de la Industria | Estado en la Plataforma Actual | Brecha Técnica Identificada |
| :--- | :--- | :--- |
| **Diseñador Visual de Flujos (BPMN 2.0 / No-Code)** | JSON plano en columna `PasosEtapasJSON`. | Falta un generador interactivo con validación de sintaxis de etapas y compuertas lógicas (AND/OR). |
| **Temporizadores y Vencimiento de SLA** | Ausente; las solicitudes permanecen indefinidamente en estado actual sin auto-escalamiento. | Requiere un cron job (`Time-driven trigger`) que evalúe tiempos límite por etapa y escale a superiores. |
| **Compuertas Condicionales (Gateway branching)** | Transición fija y lineal manual en `processWorkflowDecision`. | No evalúa expresiones lógicas basadas en el payload (ej. "si monto > L 50,000 requerir Dirección"). |
| **Bandeja Unificada de Tareas Pendientes (Inbox)** | Dispersa en múltiples hojas (`SolicitudesTramites`, `SolicitudesAutorizacion`, etc.). | Ausencia de un índice consolidado `TareasPendientesUsuario` que agregue todas las aprobaciones asignadas. |
| **Topología Distribuida Multicuenta de Google Apps Script** | Enlace estático por `SPREADSHEET_ID` único en cada servicio. | No implementa rotación dinámica de cuentas ni enrutamiento hacia hojas particionadas por ciclo lectivo de forma ubicua. |

---

## D. Arquitectura Distribuida y Gobernanza Multicuenta

1. **Topología de Cuentas y Repartición de Responsabilidades:**
   - La arquitectura actual de la plataforma divide las responsabilidades en cuatro proyectos Apps Script independientes (`user-service`, `academic-service`, `accounting-service`, `developer-service`).
   - Cada servicio puede residir en una cuenta de Google Workspace distinta (Cuentas de Servicio Institucionales) para evitar agotar cuotas individuales de ejecución de Apps Script (`UrlFetchApp`, `MailApp`, llamadas a SpreadsheetApp).
2. **Registro Central de Servicios y Spreadsheets (`CatalogoSpreadsheets`):**
   - El catálogo mapea `FuenteID`, `DominioArea`, `AnoLectivo`, `SpreadsheetId`, `UrlAcceso`, `Estado`, `SchemaVersion`, `Observaciones`.
   - Permite particionar horizontalmente datos por año lectivo (ej. `ACAD_2024`, `ACAD_2025`, `FINANZAS_2025`).
3. **Mecanismo de Autenticación Inter-Servicio:**
   - Firmas HMAC-SHA256 computadas mediante claves secretas compartidas en `PropertiesService`, evitando la exposición de contraseñas o tokens estáticos en URLs.
4. **Límites de Cuota y Mecanismos de Tolerancia:**
   - Google Apps Script impone un límite de 6 minutos por ejecución y 20,000 peticiones diarias `UrlFetchApp`. La arquitectura requiere colas de reintentos idempotentes y retroceso exponencial (`exponential backoff`) en operaciones inter-servicios.

---

## E. Lista Maestra de Características (32 Capacidades Obligatorias)

| ID | Característica / Capacidad | Origen | Ubicación en Código | Estado Funcional | Prioridad | Acción |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **F23-001** | Definición de Esquemas de Flujo Multi-Etapa | Requisito Central | `backend/user-service/Code.gs:6365` | Implementada parcialmente | Alta | Ampliar |
| **F23-002** | Registro y Ejecución Atómica de Decisiones de Etapa | Requisito Central | `backend/user-service/Code.gs:6456` | Implementada parcialmente | Crítica | Corregir |
| **F23-003** | Trazabilidad Integral e Historial de Revisiones | Requisito Central | `backend/user-service/Code.gs:6516` | Completa y verificada | Media | Mantener |
| **F23-004** | Bandeja de Entrada Unificada de Tareas Pendientes por Rol | Requisito Central | Ausente | Ausente | Alta | Proponer |
| **F23-005** | Reglas de Enrutamiento Condicional y Compuertas Lógicas | Requisito Central | Disperso en lógica de negocio | Requiere mejoras | Alta | Proponer |
| **F23-006** | Temporizadores de SLA y Escalamiento Automático | Propuesta / Mejora | Ausente | Ausente | Alta | Proponer |
| **F23-007** | Delegación Temporal de Aprobaciones por Ausencia / Vacaciones | Requisito Central | `backend/user-service/Code.gs:1594` | Implementada parcialmente | Media | Ampliar |
| **F23-008** | Catálogo Centralizado de Spreadsheets Distribuidos | Arquitectura | `backend/accounting-service/Code.gs:9510` | Implementada parcialmente | Alta | Ampliar |
| **F23-009** | Enrutador Ubicuo de Particiones de Datos (`SpreadsheetRouter`) | Arquitectura | Ausente en `academic-service` | Requiere mejoras | Crítica | Proponer |
| **F23-010** | Protocolo Seguro de Comunicación Inter-Servicios con HMAC | Seguridad | `backend/user-service/Code.gs:980` | Implementada parcialmente | Crítica | Ampliar |
| **F23-011** | Manejador de Cuotas GAS y Reintentos con Retroceso Exponencial | Resiliencia | Ausente | Ausente | Alta | Proponer |
| **F23-012** | Registro y Auditoría Estructurada de Eventos del Motor | Observabilidad | `backend/user-service/Code.gs:142` | Implementada parcialmente | Media | Ampliar |
| **F23-013** | Aislamiento Transaccional y Candados por Flujo (`LockService`) | Requisito Central | `backend/user-service/Code.gs:6456` | Requiere mejoras | Crítica | Corregir |
| **F23-014** | Validación de Precondiciones y Estados Anteriores en Decisiones | Requisito Central | `backend/user-service/Code.gs:6485` | Implementada parcialmente | Alta | Ampliar |
| **F23-015** | Idempotencia en Envíos de Formularios y Trámites | Requisito Central | Ausente en `submitAdministrativeRequest` | Ausente | Crítica | Corregir |
| **F23-016** | Despacho de Notificaciones Multicanal al Cambiar de Etapa | Requisito Central | `backend/user-service/Code.gs:5022` | Implementada parcialmente | Media | Ampliar |
| **F23-017** | Integración de Firmas Digitales y Aceptaciones en Etapas | Requisito Central | `backend/user-service/Code.gs:6546` | Completa y verificada | Media | Mantener |
| **F23-018** | Reversión y Devolución con Observaciones Obligatorias | Requisito Central | `backend/user-service/Code.gs:6480` | Implementada parcialmente | Alta | Ampliar |
| **F23-019** | Cancelación y Desistimiento de Trámites por el Solicitante | Requisito Central | Ausente en `updateRequestStatus` | Ausente | Media | Proponer |
| **F23-020** | Archivo y Depuración Programada de Trámites Resueltos | Requisito Central | `backend/user-service/Code.gs:1968` | Implementada parcialmente | Baja | Mantener |
| **F23-021** | Configuración Dinámica de Pasos Paralelos (Compuertas AND) | Arquitectura | Ausente en `PasosEtapasJSON` | Ausente | Alta | Proponer |
| **F23-022** | Asignación Dinámica por Criterios de Carga de Trabajo (Round-Robin)| Arquitectura | Ausente | Ausente | Media | Proponer |
| **F23-023** | Soporte Multicuenta de Cuentas de Servicio Google Workspace | Arquitectura | `backend/developer-service/Code.gs:1550` | Implementada parcialmente | Alta | Ampliar |
| **F23-024** | Monitoreo de Estado de Salud de Cuentas Distribuidas | Arquitectura | `backend/developer-service/Code.gs:1619` | Implementada parcialmente | Media | Mantener |
| **F23-025** | Registro de Transacciones Inter-Servicio con Correlation ID | Observabilidad | `backend/user-service/Code.gs:2327` | Implementada parcialmente | Alta | Ampliar |
| **F23-026** | Fallback Automático en Caídas de Comunicación Inter-Servicios | Resiliencia | `backend/user-service/Code.gs:7026` | Implementada parcialmente | Alta | Ampliar |
| **F23-027** | Exportación de Métricas de Rendimiento de Flujos (Tiempos de Ciclo)| Rendimiento | Ausente | Ausente | Media | Proponer |
| **F23-028** | Auditoría Anti-Manipulación de Decisiones Históricas | Seguridad | `backend/user-service/Code.gs:6523` | Implementada parcialmente | Crítica | Corregir |
| **F23-029** | Validación Criptográfica de Tokens Inter-Cuentas GAS | Seguridad | `backend/user-service/Code.gs:980` | Completa y verificada | Alta | Mantener |
| **F23-030** | Detección de Cuellos de Botella y Alertas de Sobrecarga de Revisor| Operatividad | Ausente | Ausente | Media | Proponer |
| **F23-031** | Registro de Versiones de Definición de Flujos e Histórico de Cambios| Gobernanza | `backend/user-service/Code.gs:6390` | Completa y verificada | Baja | Mantener |
| **F23-032** | Suite de Regresión Automatizada de Flujos y Multicuenta | Calidad | `backend/developer-service/Code.gs:1267` | Implementada parcialmente | Crítica | Ampliar |

---

## F. Brechas, Riesgos y Limitaciones Técnicas

1. **Riesgo de Cuello de Botella en Hoja Única (`SPREADSHEET_ID`):** Aunque existe `CatalogoSpreadsheets` en `accounting-service`, los servicios `academic-service` y `user-service` aún referencian una constante global `SPREADSHEET_ID` para la mayoría de tablas transaccionales, corriendo el riesgo de superar el límite de 10 millones de celdas y generar contención de candados (`LockService`).
2. **Falta de Despacho Asíncrono para Tareas Pesadas:** Las transiciones de workflow que involucran múltiples acciones (notificar por correo, generar PDFs, emitir asientos contables) se ejecutan de forma sincrónica en la llamada `doPost`, aproximándose peligrosamente al límite de tiempo de ejecución de 6 minutos de Google Apps Script.
3. **Ausencia de un Motor de Expresiones para Decisiones:** El enrutamiento de la siguiente etapa actualmente depende de parámetros enviados manualmente desde el frontend (`siguienteAsignadoA`, `nuevoEstadoSolicitud`), permitiendo potenciales manipulaciones si el cliente no envía la secuencia estricta definida en `PasosEtapasJSON`.

---

## G. Criterios de Aceptación

- **CA-F23-01:** La creación de un flujo institucional debe validar la presencia obligatoria de al menos un paso inicial, un paso de revisión y un estado terminal (`Aprobado`, `Rechazado`).
- **CA-F23-02:** Una decisión de workflow (`processWorkflowDecision`) no debe poder ser ejecutada por un usuario cuyo rol o ID no coincida con el asignado a la etapa activa.
- **CA-F23-03:** Las transiciones deben ser protegidas mediante `LockService` para prevenir condiciones de carrera cuando dos revisores intentan decidir sobre el mismo trámite simultáneamente.
- **CA-F23-04:** La resolución de hojas distribuidas mediante `resolveSpreadsheetSource` debe estar estandarizada en todos los microservicios del ecosistema.
- **CA-F23-05:** Todo error en llamadas inter-servicios debe registrar un evento estructurado con severidad `WARN` o `ERROR` y correlación de trazabilidad (`correlationId`).

---

## H. Plan de Resolución

1. **Prioridad Crítica:**
   - Incorporar `LockService.getScriptLock()` en `processWorkflowDecision` y validar autorización estricta del revisor según la etapa activa (`F23-Task01`).
   - Estandarizar la resolución dinámica de fuentes de datos mediante `resolveSpreadsheetSource` en `academic-service` y `user-service` (`F23-Task02`).
2. **Prioridad Alta:**
   - Implementar función `getUnifiedWorkInbox` que consolide trámites, solicitudes de compra y justificaciones asignadas al usuario o a su rol (`F23-Task03`).
   - Crear un motor de evaluación de reglas condicionales para transiciones automáticas según monto, categoría o urgencia (`F23-Task04`).
3. **Prioridad Media:**
   - Diseñar `processWorkflowSLAEscalations` para detectar trámites estancados y reasignarlos automáticamente con notificación de alerta (`F23-Task05`).

---

## I. Cobertura de Auditoría y Métricas

A continuación se presentan las métricas formales de auditoría según las directrices establecidas:

### Fórmulas de Cálculo:
1. **Cobertura de Inspección:**
   $$\text{Cobertura de Inspección} = \frac{\text{Elementos Inspeccionados}}{\text{Total de Elementos Identificados}} \times 100$$
   - Total Identificados: 32 capacidades (`F23-001` a `F23-032`).
   - Inspeccionados: 32.
   - **Resultado:** $\frac{32}{32} \times 100 = 100.0\%$

2. **Cobertura de Ejecución:**
   $$\text{Cobertura de Ejecución} = \frac{\text{Elementos con Pruebas Ejecutadas}}{\text{Elementos que Requieren Pruebas}} \times 100$$
   - Elementos que requieren pruebas: 32.
   - Elementos con pruebas ejecutadas (en suite de regresión 53/53): 14.
   - **Resultado:** $\frac{14}{32} \times 100 = 43.75\%$

3. **Cobertura de Verificación:**
   $$\text{Cobertura de Verificación} = \frac{\text{Elementos que Cumplieron Criterios}}{\text{Total de Elementos Verificados}} \times 100$$
   - Elementos verificados: 14.
   - Elementos que cumplieron criterios: 8.
   - **Resultado:** $\frac{8}{14} \times 100 = 57.14\%$

4. **Elementos Bloqueados:**
   - 0 elementos bloqueados técnicamente por entorno; 18 elementos clasificados como ausentes o pendientes de implementación formal.

---

## J. Registro Consolidado de Avance de Subcapacidades

| ID | Subcapacidad | Estado Funcional | Avance de Auditoría | Pruebas Ejecutadas | Evidencias en Código | Brechas Detectadas | Bloqueos | Acción Pendiente | Próximo Paso |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **F23-001** | Definición de Esquemas de Flujo | Implementada parcialmente | Verificado | Sí | `user-service:6365` | Falta diseñador visual | Ninguno | Ampliar | Validación de sintaxis |
| **F23-002** | Decisiones Atómicas de Etapa | Implementada parcialmente | Verificado | Sí | `user-service:6456` | Sin LockService | Ninguno | Corregir | Añadir scriptLock |
| **F23-003** | Historial de Revisiones | Completa y verificada | Verificado | Sí | `user-service:6516` | Ninguna | Ninguno | Mantener | Optimizar consulta |
| **F23-004** | Bandeja Unificada Inbox | Ausente | Inspeccionado | No | Ausente | No existe vista agregada | Ninguno | Proponer | Crear getUnifiedWorkInbox |
| **F23-005** | Enrutamiento Condicional | Requiere mejoras | Inspeccionado | No | Disperso | Sin motor de expresiones | Ninguno | Proponer | Motor de reglas |
| **F23-006** | Temporizadores y SLA | Ausente | Inspeccionado | No | Ausente | Trámites estancados | Ninguno | Proponer | Cron job de escalamiento |
| **F23-007** | Delegación Temporal | Implementada parcialmente | Verificado | Sí | `user-service:1594` | No transfiere trámites | Ninguno | Ampliar | Conectar a workflow |
| **F23-008** | Catálogo Spreadsheets | Implementada parcialmente | Verificado | Sí | `accounting:9510` | Sólo en contabilidad | Ninguno | Ampliar | Estandarizar catálogo |
| **F23-009** | Enrutador SpreadsheetRouter | Requiere mejoras | Inspeccionado | No | Ausente en academic | SPREADSHEET_ID rígido | Ninguno | Proponer | Router transversal |
| **F23-010** | Comunicación Inter-Servicio HMAC | Implementada parcialmente | Verificado | Sí | `user-service:980` | Clave estática | Ninguno | Ampliar | Rotación de llaves |
| **F23-011** | Manejo de Cuotas GAS | Ausente | Inspeccionado | No | Ausente | Sin backoff exponencial | Ninguno | Proponer | Middleware de reintentos |
| **F23-012** | Auditoría Estructurada | Implementada parcialmente | Verificado | Sí | `user-service:142` | Faltan eventos de flujo | Ninguno | Ampliar | Eventos BPMN |
| **F23-013** | Candados por Flujo | Requiere mejoras | Inspeccionado | No | `user-service:6456` | Riesgo de colisión | Ninguno | Corregir | Implementar LockService |
| **F23-014** | Precondiciones de Etapa | Implementada parcialmente | Inspeccionado | No | `user-service:6485` | Salto de etapas manual | Ninguno | Ampliar | Validar estado previo |
| **F23-015** | Idempotencia en Trámites | Ausente | Inspeccionado | No | Ausente | Duplicación por reenvío | Ninguno | Corregir | Idempotency-Key |
| **F23-016** | Notificaciones por Etapa | Implementada parcialmente | Inspeccionado | No | `user-service:5022` | No automática en BPM | Ninguno | Ampliar | Hook de notificación |
| **F23-017** | Firmas Digitales en Flujo | Completa y verificada | Verificado | Sí | `user-service:6546` | Ninguna | Ninguno | Mantener | Preservar hash |
| **F23-018** | Devolución y Corrección | Implementada parcialmente | Verificado | Sí | `user-service:6480` | Observación opcional | Ninguno | Ampliar | Forzar justificación |
| **F23-019** | Cancelación por Solicitante | Ausente | Inspeccionado | No | Ausente | No puede desistir | Ninguno | Proponer | Endpoint de desistimiento |
| **F23-020** | Archivo de Trámites | Implementada parcialmente | Inspeccionado | No | `user-service:1968` | Manual | Ninguno | Mantener | Purgado por política |
| **F23-021** | Pasos Paralelos (Compuertas AND) | Ausente | Inspeccionado | No | Ausente | Sólo lineal secuencial | Ninguno | Proponer | Definición de fork/join |
| **F23-022** | Balanceo Round-Robin | Ausente | Inspeccionado | No | Ausente | Asignación manual | Ninguno | Proponer | Algoritmo de reparto |
| **F23-023** | Soporte Multicuenta GAS | Implementada parcialmente | Inspeccionado | No | `developer:1550` | Enlaces fijos | Ninguno | Ampliar | Catálogo de cuentas |
| **F23-024** | Salud de Cuentas | Implementada parcialmente | Verificado | Sí | `developer:1619` | Sólo servicio local | Ninguno | Mantener | Ping distribuido |
| **F23-025** | Correlation ID Inter-Servicios | Implementada parcialmente | Verificado | Sí | `user-service:2327` | No universal | Ninguno | Ampliar | Propagar correlationId |
| **F23-026** | Fallback de Red | Implementada parcialmente | Inspeccionado | No | `user-service:7026` | Solo en taskService | Ninguno | Ampliar | Circuito breaker |
| **F23-027** | Métricas de Tiempos de Ciclo | Ausente | Inspeccionado | No | Ausente | Sin analítica de SLA | Ninguno | Proponer | Dashboard de tiempos |
| **F23-028** | Auditoría Anti-Manipulación | Implementada parcialmente | Inspeccionado | No | `user-service:6523` | Registros editables | Ninguno | Corregir | Hash encadenado |
| **F23-029** | Validación Criptográfica Tokens | Completa y verificada | Verificado | Sí | `user-service:980` | Ninguna | Ninguno | Mantener | Preservar HMAC |
| **F23-030** | Alertas de Sobrecarga Revisor | Ausente | Inspeccionado | No | Ausente | Sin detección de colapso | Ninguno | Proponer | Alerta por > N trámites |
| **F23-031** | Versionamiento de Flujos | Completa y verificada | Verificado | Sí | `user-service:6390` | Ninguna | Ninguno | Mantener | Preservar versiones |
| **F23-032** | Suite de Regresión Automatizada | Implementada parcialmente | Verificado | Sí | `developer:1267` | Faltan casos multicuenta | Ninguno | Ampliar | Expandir suite |

---

## K. Fuentes y Documentación Consultada
1. *Google Apps Script Quotas and Limits Reference* (developers.google.com/apps-script/guides/services/quotas).
2. *Workflow Patterns and Best Practices for Cloud BPM Engines* (workflowpatterns.com).
3. *Microservices Decomposition in Serverless Architectures* (Martin Fowler, microservices.io).
4. *HMAC SHA-256 Inter-Service Authentication Architecture* (RFC 2104).

---

## Tareas ejecutables derivadas de los hallazgos

> Normalización de las 32 subcapacidades de Fase 23 y de las auditorías posteriores. Se conservan los cinco IDs originales F23-Task01..F23-Task05 y sus prioridades P0/P1/P2. Los registros TASK-044..TASK-049 reutilizan algunos números para alcances distintos; la correspondencia se decide por contenido, no por coincidencia numérica. Se crean F23-Task06..F23-Task15 para capacidades accionables no cubiertas por un ID original. No se modifican IDs AUD-NG existentes ni se renumeran F23-001..F23-032.

### [F23-Task01] Proteger las decisiones de workflow con autorización contextual y transiciones atómicas
- **Hallazgo de origen:** CA-F23-01..03; F23-002, F23-013, F23-014 y F23-031; TASK-044 y AUD-NG-024.
- **Severidad:** Crítica. **Objetivo:** garantizar que cada decisión sea ejecutada por el revisor autenticado y asignado a la etapa activa.
- **Acción ejecutable:** adquirir ScriptLock antes de leer/validar/mutar; derivar actor de `_verifiedUserId` y `_verifiedRole`; comprobar asignación real a solicitud/etapa; calcular en servidor la siguiente etapa y estado permitido desde `PasosEtapasJSON`; validar estado previo, transición terminal y versión del flujo.
- **Archivos/módulos:** `backend/user-service/Code.gs`, `processWorkflowDecision`, `validateRolePermission`, `FlujosAprobacion`, `SolicitudesTramites`, `RevisionesDecisionesTramite`.
- **Dependencias/riesgos:** identidad autenticada, F23-Task02 y delegaciones; riesgo crítico de suplantación o decisión concurrente.
- **Alcance:** decisiones y transiciones; no confiar en `revisorId`, `siguienteAsignadoA` ni `nuevoEstadoSolicitud` aportados por cliente.
- **Criterios de aceptación:** actor coincide con sesión/asignación; etapa activa corresponde a la solicitud; transición calculada en backend; dos decisiones simultáneas producen una sola resolución; precondiciones/versionado verificados; errores no dejan estado parcial.
- **Prioridad:** P0. **Estado:** Pendiente de ampliación.
- **Reconciliación:** TASK-044/F23-Task01 registra lock y transiciones del lado servidor, pero AUD-NG-024 demuestra que `processWorkflowDecision` prioriza `revisorId` del payload y no comprueba la asignación contextual. Ampliar TASK-044; no duplicar el motor.
- **Evidencia de cierre:** pendiente para AUD-NG-024; la implementación histórica no acredita autorización contextual.

### [F23-Task02] Estandarizar el enrutamiento dinámico y validado de fuentes distribuidas
- **Hallazgo de origen:** CA-F23-04; F23-008, F23-009 y F23-023; TASK-046 y AUD-NG-073..077.
- **Severidad:** Crítica. **Objetivo:** resolver hojas por dominio, año lectivo, departamento y servicio sin depender de SPREADSHEET_ID rígido.
- **Acción ejecutable:** centralizar `resolveSpreadsheetSource`/`registerSpreadsheetSource`; incluir dimensiones completas en clave; validar existencia, acceso y esquema; aplicar fallback solo con política explícita; migrar consumidores User/Academic/Accounting al resolver y preservar historial.
- **Archivos/módulos:** servicios User/Academic/Accounting, `resolveSpreadsheetSource`, `registerSpreadsheetSource`, `CatalogoSpreadsheets`.
- **Dependencias/riesgos:** F23-Task10, catálogo de cuentas/servicios y permisos Drive; riesgo de leer/escribir en Spreadsheet equivocado.
- **Alcance:** resolución de fuentes y migración de consumidores; no crear catálogos divergentes.
- **Criterios de aceptación:** clave incluye dominio/año/departamento/servicio; fuente única; existencia/permisos/esquema/version verificados; fuente deshabilitada produce error controlado; fallback autorizado; consumidores dejan de abrir SPREADSHEET_ID directamente para dominios particionados.
- **Prioridad:** P0. **Estado:** Pendiente de ampliación.
- **Reconciliación:** TASK-046 está etiquetada F23-Task03, pero su alcance real coincide con F23-Task02 del informe. AUD-NG-073..077 documentan router no integrado, catálogos locales, clave incompleta, fallback inseguro y falta de validación/versionado. Conservar TASK-046 y mapear por alcance.
- **Evidencia de cierre:** pendiente; no se declara ejecución ni verificación en esta migración.
### [F23-Task03] Crear bandeja unificada de trabajo con asignación por rol/departamento
- **Hallazgo de origen:** F23-004 y F23-022; H (getUnifiedWorkInbox); AUD-NG-205.
- **Severidad:** Alta. **Objetivo:** reunir trámites, autorizaciones, compras y justificaciones asignadas en una vista segura.
- **Acción ejecutable:** implementar `getUnifiedWorkInbox` con esquema canónico de origen, responsable, rol/departamento, estado, vencimiento, SLA y enlaces; conectar frontend; incluir asignación round-robin/carga cuando la política lo permita.
- **Archivos/módulos:** `backend/user-service/Code.gs`, `js/api.js`, dashboards por rol, `SolicitudesTramites`, `SolicitudesAutorizacion` y bandeja unificada.
- **Dependencias/riesgos:** F23-Task01/F23-Task10, RBAC/ABAC y contratos de productores; riesgo de tareas omitidas, duplicadas o visibles a departamentos ajenos.
- **Alcance:** agregación y asignación; no duplicar bandejas existentes.
- **Criterios de aceptación:** esquema estable/versionado; productores definidos agregados; responsable/departamento verificados; filtros/paginación; contadores conciliados; lectura/acciones persistentes; round-robin respeta carga y turno.
- **Prioridad:** P1. **Estado:** Pendiente.
- **Reconciliación:** AUD-NG-205 indica helper frontend desconectado y ausencia de `getUserWorkInbox`. TASK-221/TASK-318 son relacionados; reutilizar si cubren el contrato, sin declarar cobertura completa sin agregador real.
- **Evidencia de cierre:** pendiente; no se declara ejecución ni verificación en esta migración.
### [F23-Task04] Implementar motor de reglas condicionales y compuertas AND/OR
- **Hallazgo de origen:** F23-005 y F23-021; sección C y H.
- **Severidad:** Alta. **Objetivo:** enrutar trámites según reglas institucionales sin permitir que el cliente elija la siguiente etapa.
- **Acción ejecutable:** definir lenguaje de expresiones seguro; evaluar monto, categoría, urgencia y departamento; soportar compuertas AND/OR y fork/join; versionar reglas junto al flujo.
- **Archivos/módulos:** `backend/user-service/Code.gs`, `saveApprovalWorkflow`, `processWorkflowDecision`, `FlujosAprobacion`, `PasosEtapasJSON`.
- **Dependencias/riesgos:** F23-Task01 y esquema/versionado; riesgo de ejecución arbitraria o saltos de aprobación.
- **Alcance:** reglas definidas por Administrador; no evaluar JavaScript libre.
- **Criterios de aceptación:** expresiones validan sintaxis/tipos; variables permitidas por lista; reglas reproducibles; fork/join correcto; rutas no elegibles rechazadas; cambios versionados y auditados.
- **Prioridad:** P1. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; el informe describe transición lineal/manual y ausencia del motor.

### [F23-Task05] Implementar temporizadores SLA, escalamiento, notificaciones y métricas
- **Hallazgo de origen:** F23-006, F23-016, F23-027 y F23-030; H; AUD-NG-206.
- **Severidad:** Alta. **Objetivo:** detectar trámites estancados, escalar responsables y alertar sobre sobrecarga.
- **Acción ejecutable:** trigger programado que evalúe vencimiento por etapa/rol; registrar pausas y tiempos de ciclo; escalar según política; notificar con deduplicación atómica; generar alertas de carga excesiva.
- **Archivos/módulos:** `backend/user-service/Code.gs`, `processWorkflowSLAEscalations`, `FlujosAprobacion`, `SolicitudesTramites`, `BandejaNotificaciones`, `sendMultiChannelNotification`, `createUserNotification`.
- **Dependencias/riesgos:** F23-Task03, TASK-316/TASK-318 y preferencias; riesgo de spam o escalamiento incorrecto.
- **Alcance:** SLA y alertas; no crear segundo motor multicanal.
- **Criterios de aceptación:** trigger reanudable/idempotente; escalamiento usa etapa/rol vigente; pausas excluidas según política; deduplicación resistente a concurrencia; entregas/fallos registrados; métricas y sobrecarga calculadas.
- **Prioridad:** P2. **Estado:** Pendiente.
- **Reconciliación:** TASK-318/TASK-316 son componentes relacionados; AUD-NG-206 detecta lectura+append no atómica y ausencia de `deduplicationKey` persistida. Coordinar sin duplicar notificaciones.
- **Evidencia de cierre:** pendiente; no se declara ejecución ni verificación en esta migración.
### [F23-Task06] Garantizar idempotencia durable y reserva atómica de operaciones
- **Hallazgo de origen:** F23-015; TASK-045 y AUD-NG-025.
- **Severidad:** Crítica. **Objetivo:** evitar duplicados cuando clientes reintentan solicitudes con efectos secundarios.
- **Acción ejecutable:** sustituir consulta-ejecución-guardado de CacheService por reserva atómica y registro durable del resultado; vincular clave a usuario, acción, payload y recurso; coordinar locks y transacciones.
- **Archivos/módulos:** `backend/user-service/Code.gs`, `doPost`, `checkAndRegisterIdempotencyKey`, `saveIdempotentResult`, almacenamiento durable.
- **Dependencias/riesgos:** F23-Task01 y servicios consumidores; riesgo de doble decisión ante solicitudes simultáneas o expiración de caché.
- **Alcance:** operaciones con efectos secundarios; CacheService no es garantía durable.
- **Criterios de aceptación:** clave reservada antes de ejecutar; concurrentes comparten resultado; misma clave con payload distinto se rechaza; resultado durable; expiración no permite repetir operación confirmada.
- **Prioridad:** P0. **Estado:** Pendiente de ampliación.
- **Reconciliación:** TASK-045 está etiquetada F23-Task02, pero su alcance real es idempotencia y no el router del informe. AUD-NG-025 demuestra que CacheService no ofrece reserva atómica/durable. Se asigna F23-Task06 para evitar colisión.
- **Evidencia de cierre:** pendiente; no se declara ejecución ni verificación en esta migración.
### [F23-Task07] Integrar protocolo HMAC interservicio real con secretos rotables
- **Hallazgo de origen:** F23-010, F23-025 y F23-029; TASK-048 y AUD-NG-083..086.
- **Severidad:** Crítica. **Objetivo:** autenticar cada llamada entre servicios, impedir replay y autorizar emisor/receptor/acción.
- **Acción ejecutable:** conectar `createInterServiceEnvelope` a llamadas salientes y `verifyInterServiceEnvelope` antes del dispatcher; usar secretos aleatorios por par de servicios con rotación/revocación; validar HMAC antes de reservar requestId; autorizar sourceService/acción; incluir versión y correlationId.
- **Archivos/módulos:** servicios User/Academic/Accounting/Developer, `createInterServiceEnvelope`, `verifyInterServiceEnvelope`, `getAuthTokenSecret`.
- **Dependencias/riesgos:** F23-Task10, gestor de secretos y catálogo; riesgo de spoofing, replay o privilegios excesivos.
- **Alcance:** protocolo entre servicios; helpers declarados no equivalen a integración.
- **Criterios de aceptación:** llamadas reales firman/verifican; secreto ausente falla cerrado; HMAC antes de reservar nonce; replay concurrente bloqueado; emisor activo/autorizado; target, TTL, versión y esquema validados; correlationId propagado.
- **Prioridad:** P0. **Estado:** Pendiente de ampliación.
- **Reconciliación:** TASK-048 está etiquetada F23-Task05, pero su alcance es HMAC, no SLA. AUD-NG-083 helpers no conectados; AUD-NG-084 fallback predecible; AUD-NG-085 reserva nonce antes de verificar firma; AUD-NG-086 no autoriza emisor/acción ni valida versión/esquema. Se asigna F23-Task07.
- **Evidencia de cierre:** pendiente; no se declara ejecución ni verificación en esta migración.
### [F23-Task08] Proteger la cadena criptográfica de decisiones y correcciones
- **Hallazgo de origen:** F23-018 y F23-028; TASK-049 y AUD-NG-026/AUD-NG-087..089.
- **Severidad:** Crítica. **Objetivo:** detectar alteración, omisión o corrección no autorizada de decisiones.
- **Acción ejecutable:** incluir en hash actor, acción, observaciones, IP confiable, decisión original y motivo; verificar continuidad de hashes; marcar hashes ausentes; proteger correcciones con lock, actor verificado, vínculo a solicitud original y lista cerrada de acciones.
- **Archivos/módulos:** `backend/user-service/Code.gs`, `processWorkflowDecision`, `verifyWorkflowDecisionAuditChain`, `recordWorkflowDecisionCorrection`, `RevisionesDecisionesTramite`.
- **Dependencias/riesgos:** F23-Task01, identidad y almacenamiento inmutable; riesgo de historial aparentemente íntegro pero manipulable.
- **Alcance:** historial de decisiones/correcciones.
- **Criterios de aceptación:** hash cubre campos probatorios; cadena enlaza eventos; hash ausente/desconectado falla; consultas parciales validan cadena completa; corrección exige actor/permiso y misma solicitud; lock evita ramas concurrentes.
- **Prioridad:** P0. **Estado:** Pendiente de ampliación.
- **Reconciliación:** TASK-049 está etiquetada F23-Task06, ID ausente del plan original; se asigna F23-Task08. AUD-NG-026/087 continuidad y hashes ausentes; AUD-NG-088 campos probatorios excluidos; AUD-NG-089 actor/solicitud/acción no validados y falta de lock.
- **Evidencia de cierre:** pendiente; no se declara ejecución ni verificación en esta migración.
### [F23-Task09] Implementar suite conductual e integración de regresión de workflows
- **Hallazgo de origen:** F23-032, métricas I, AUD-NG-081 y AUD-NG-090.
- **Severidad:** Alta (calidad crítica). **Objetivo:** demostrar contratos funcionales, seguridad y no regresión de las 32 capacidades.
- **Acción ejecutable:** ejecutar decisiones, idempotencia, resolución real de fuentes, catálogo de servicios, HMAC entre servicios, cadena de decisiones/correcciones, Inbox, SLA y ramas condicionales sobre fixtures aislados.
- **Archivos/módulos:** `tests/regression/academic-grading-suite.js`, `backend/developer-service/Code.gs`, servicios User/Academic/Accounting.
- **Dependencias/riesgos:** F23-Task01..08 y F23-Task10; riesgo de PASS estructural.
- **Alcance:** pruebas conductuales aisladas; no usar hojas productivas.
- **Criterios de aceptación:** persistencia/estado/permisos/concurrencia/rollback verificados; llamadas interservicio reales en entorno de prueba; replay/firma inválida rechazados; cobertura trazable de 32 capacidades; fixtures y limpieza deterministas.
- **Prioridad:** P0 Calidad. **Estado:** Pendiente.
- **Reconciliación:** AUD-NG-081 encuentra aserciones estructurales para TASK-046/047; AUD-NG-090 encuentra `includes` para TASK-048/049 sin ejecutar comunicación ni manipulación real. Los resultados 235/235, 239/239 y 243/243 no sustituyen evidencia conductual.
- **Evidencia de cierre:** pendiente; no se declara ejecución ni verificación en esta migración.
### [F23-Task10] Crear catálogo central de servicios/cuentas y control de plano autenticado
- **Hallazgo de origen:** F23-023/F23-024; TASK-047 y AUD-NG-078..082.
- **Severidad:** Crítica. **Objetivo:** mantener fuente de verdad de servicios, cuentas propietarias, endpoints, Spreadsheets, dominios y permisos.
- **Acción ejecutable:** exigir metadatos al registrar servicio; validar propiedad/acceso/recurso; rechazar wildcard por defecto; eliminar defaults ficticios y success ante errores; versionar cambios con actor verificado y escritura atómica; exigir sesión autenticada para el plano de control.
- **Archivos/módulos:** `backend/developer-service/Code.gs`, `registerServiceInstance`, `getCentralServiceRegistry`, `updateServiceStatus`, `CatalogoServicios`, `HistorialServiciosDistribuidos`, `ROLE_PERMISSIONS`, `doPost`.
- **Dependencias/riesgos:** F23-Task02/F23-Task07, cuentas Workspace y secretos; riesgo de privilegios globales o datos enviados a cuenta incorrecta.
- **Alcance:** catálogo y administración de instancias; no confiar en authRole del payload.
- **Criterios de aceptación:** endpoint/propietario/Spreadsheet/dominio/permisos obligatorios; wildcard denegado salvo excepción; errores explícitos; estado e historial atómicos; actor desde sesión; sin token falla cerrado; salud de cuenta verificada.
- **Prioridad:** P0. **Estado:** Pendiente de ampliación.
- **Reconciliación:** TASK-047 está etiquetada F23-Task04, pero su alcance es catálogo de servicios, no motor condicional. AUD-NG-078 registro incompleto/wildcard; AUD-NG-079 fallback hardcodeado; AUD-NG-080 actor cliente e historial no atómico; AUD-NG-082 authRole cliente sin token. Se asigna F23-Task10.
- **Evidencia de cierre:** pendiente; no se declara ejecución ni verificación en esta migración.
### [F23-Task11] Diseñar interfaz visual de flujos con validación de etapas
- **Hallazgo de origen:** F23-001 y sección C (diseñador BPMN/No-Code).
- **Severidad:** Media. **Objetivo:** permitir configurar flujos sin editar JSON plano manualmente.
- **Acción ejecutable:** crear editor visual de etapas, roles, transiciones, condiciones y estados terminales; validar esquema/referencias antes de publicar; versionar cambios.
- **Archivos/módulos:** dashboard de administración, `backend/user-service/Code.gs`, `saveApprovalWorkflow`, `FlujosAprobacion`.
- **Dependencias/riesgos:** F23-Task01/F23-Task04, esquema BPMN/JSON y permisos; riesgo de publicar flujos inválidos.
- **Alcance:** diseñador/validador; no ejecutar código arbitrario.
- **Criterios de aceptación:** crear/editar visualmente; validar pasos iniciales/revisión/terminales; detectar referencias/compuertas inválidas; vista previa; publicación versionada y auditada.
- **Prioridad:** P2 (propuesta operativa). **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; el informe identifica JSON plano y ausencia de diseñador.

### [F23-Task12] Integrar delegaciones temporales con transferencia efectiva de trámites
- **Hallazgo de origen:** F23-007 y J (delegación parcial).
- **Severidad:** Alta. **Objetivo:** dar continuidad durante ausencias sin perder responsabilidad ni trazabilidad.
- **Acción ejecutable:** al activar delegación vigente, transferir/compartir tareas según alcance y fechas; al vencer/revocar, reasignar pendientes al titular/supervisor; registrar cadena de delegación.
- **Archivos/módulos:** `backend/user-service/Code.gs`, delegaciones de seguridad, `SolicitudesTramites`, `RevisionesDecisionesTramite`, bandeja.
- **Dependencias/riesgos:** F23-Task03 y autorización contextual; riesgo de transferir fuera de ámbito o mantener acceso tras vencimiento.
- **Alcance:** delegación de tareas; no elevar permisos ni cambiar titularidad histórica.
- **Criterios de aceptación:** delegación con inicio/fin/alcance; tareas transferidas según política; vencimiento restaura asignación; decisiones atribuidas al autenticado; historial consultable.
- **Prioridad:** P1. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; la tabla J declara que la delegación no transfiere trámites.

### [F23-Task13] Implementar colas asíncronas, control de cuotas, backoff y circuit breaker
- **Hallazgo de origen:** F23-011/F23-026 y secciones A/D/F/J.
- **Severidad:** Alta. **Objetivo:** evitar que tareas pesadas bloqueen el dispatcher o queden incompletas ante cuotas/red.
- **Acción ejecutable:** separar notificaciones, PDFs y asientos de la respuesta síncrona; encolar trabajos con ID/correlationId, estado, intentos y próxima ejecución; aplicar backoff exponencial, límites, circuit breaker y recuperación idempotente.
- **Archivos/módulos:** servicios User/Academic/Accounting/Developer, cola de trabajos, triggers, `delegateToTaskService`.
- **Dependencias/riesgos:** F23-Task06/F23-Task07, cuotas GAS y persistencia; riesgo de pérdida/duplicación o ejecución superior a seis minutos.
- **Alcance:** trabajos pesados y comunicación interservicio; no crear colas paralelas incompatibles.
- **Criterios de aceptación:** trabajo pesado retorna estado; cola persiste; reintentos exponenciales limitados; circuit breaker evita cascadas; fallos terminales visibles; idempotencia y correlationId preservados.
- **Prioridad:** P1. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; el informe identifica ejecución síncrona y ausencia de backoff/circuit breaker.

### [F23-Task14] Estandarizar auditoría estructurada de eventos de workflow
- **Hallazgo de origen:** F23-012 y J (eventos incompletos); coordinación con AUD-NG-145/AUD-NG-224 y TASK-504.
- **Severidad:** Alta. **Objetivo:** registrar transiciones, asignaciones, delegaciones, errores y escalamiento con actor y correlación.
- **Acción ejecutable:** integrar escritor canónico de eventos con actor autenticado, correlationId, entidad/solicitud, acción, estado anterior/nuevo, severidad y timestamp; sanitizar PII y no silenciar fallos.
- **Archivos/módulos:** `backend/user-service/Code.gs`, `RevisionesDecisionesTramite`, `HistorialCambiosEntidad`, logger institucional.
- **Dependencias/riesgos:** F23-Task01/F23-Task08, esquema canónico; riesgo de PII expuesta o mutaciones sin evidencia.
- **Alcance:** eventos workflow; reutilizar AUD-NG-145/AUD-NG-224 y TASK-504, no crear segundo sistema.
- **Criterios de aceptación:** eventos de todas las transiciones; actor desde sesión; correlationId propagado; datos sensibles redactados; append fallido genera error/recuperación; consulta por solicitud/actor/fecha.
- **Prioridad:** P1. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; la tabla J identifica cobertura de auditoría incompleta.

### [F23-Task15] Habilitar desistimiento del solicitante y archivo gobernado de trámites
- **Hallazgo de origen:** F23-019/F23-020 y J (cancelación ausente, archivo manual).
- **Severidad:** Media. **Objetivo:** permitir desistir de una solicitud elegible y conservar trámites finalizados según retención.
- **Acción ejecutable:** implementar cancelación con actor verificado, motivo y estado permitido; notificar; automatizar archivo de trámites terminales con retención y búsqueda.
- **Archivos/módulos:** `backend/user-service/Code.gs`, `SolicitudesTramites`, `RevisionesDecisionesTramite`, archivo documental y bandeja.
- **Dependencias/riesgos:** F23-Task01/F23-Task03, retención y F22-Task05; riesgo de cancelar trámites resueltos o eliminar evidencia.
- **Alcance:** desistimiento/archivo lógico; no borrar historial ni documentos probatorios.
- **Criterios de aceptación:** solo solicitante autenticado desiste en estados permitidos; motivo obligatorio; decisiones previas conservadas; notificación/auditoría; archivo automático por política; búsqueda/restauración autorizada.
- **Prioridad:** P2. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; la tabla J registra cancelación ausente y archivo manual.

### Reconciliaciones y discrepancias transversales de Fase 23
- **TASK-044:** corresponde por alcance a F23-Task01; AUD-NG-024 mantiene pendiente autorización contextual del revisor.
- **TASK-045:** rotulada F23-Task02, pero su alcance es idempotencia; se asigna F23-Task06 y AUD-NG-025.
- **TASK-046:** rotulada F23-Task03, pero su alcance es SpreadsheetRouter; se mapea a F23-Task02 y AUD-NG-073..077.
- **TASK-047:** rotulada F23-Task04, pero su alcance es catálogo de servicios/control de plano; se asigna F23-Task10 y AUD-NG-078..082.
- **TASK-048:** rotulada F23-Task05, pero su alcance es HMAC; se asigna F23-Task07 y AUD-NG-083..086.
- **TASK-049:** rotulada F23-Task06, pero su alcance es cadena de auditoría; se asigna F23-Task08 y AUD-NG-026/AUD-NG-087..089.
- **AUD-NG-081/AUD-NG-090:** pruebas estructurales sin comportamiento; se incorporan a F23-Task09.
- **AUD-NG-205/AUD-NG-206:** se vinculan a Inbox/SLA y notificaciones, coordinando TASK-221/TASK-227/TASK-316/TASK-318 sin duplicar componentes.
- **AUD-NG-175:** no se atribuye a Fase 23; su alcance es catálogo académico.
- **Estado global:** las tareas históricas de motor/routing/idempotencia/HMAC/cadena/servicios quedan pendientes de ampliación por hallazgos; Inbox/reglas/SLA y tareas 11..15 pendientes de ejecución/evidencia; suite pendiente de pruebas conductuales.
