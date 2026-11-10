# AUDITORÍA FUNCIONAL, TÉCNICA Y DOCUMENTAL — FASE 41
# PRUEBAS INTEGRALES Y ACEPTACIÓN DE LA DIGITALIZACIÓN

**Plataforma Integral de Gestión Educativa**
**Fase Auditada:** Fase 41 — Pruebas Integrales y Aceptación de la Digitalización
**Fecha de Emisión:** 2026-10-31
**Auditor Responsable:** Jules (Software Engineer / Auditor Técnico Independiente)
**Estado de la Fase:** Requiere Mejoras / No Aprobada para Producción Crítica

---

## A. IDENTIFICACIÓN Y ALCANCE

### 1. Propósito y Contexto de la Auditoría
La presente auditoría evalúa el flujo integral de digitalización de la plataforma, abarcando desde la ingesta de archivos tabulares y documentos tradicionales, normalización e interpretación de datos, generación dinámica de formularios y plantillas, precisión visual de campos superpuestos, flujos de firma electrónica, aislamiento departamental, hasta la resiliencia operativa, recuperación ante fallos y reversión transaccional sin pérdida de datos posteriores.

### 2. Alcance Previsto vs. Alcance Efectivamente Evaluado
- **Alcance Previsto:** Evaluación de 10 subcapacidades maestras (`F41-01` a `F41-10`) y 12 pruebas integrales de extremo a extremo (`E2E-41-01` a `E2E-41-12`).
- **Alcance Efectivamente Evaluado:**
  - Inspección exhaustiva de los servicios backend: `backend/accounting-service/Code.gs` (`validateImportPreview`, `importDataWithColumnMapping`, `generateSchoolDocument`), `backend/academic-service/Code.gs` (`generateInstitutionalId`, `uploadStudentDocument`, `restoreDocumentVersion`), `backend/user-service/Code.gs` (`saveInstitutionalForm`, `registerDocumentSignature`, `generateInstitutionalId`), `backend/developer-service/Code.gs`.
  - Frontend y componentes visuales: `js/teacher.js`, `teacher-dashboard.html`, `js/ui-common.js`, `dashboard-direccion.html`.
  - Tablas de persistencia: `AuditoriaMigraciones`, `SecuenciasIDs`, `PlantillasEscolares`, `DocumentosEscolaresEmitidos`, `FirmasConformidades`, `DocumentosEstudiante`, `HistorialVersionesDocumentos`.

### 3. Funciones Localizadas y Roles Involucrados
- **Importador de Datos:** `validateImportPreview`, `importDataWithColumnMapping` (Contabilidad, Secretaría, Administrador).
- **Generador de Secuencias e IDs:** `generateInstitutionalId` con `LockService` (Administrador, Sistema).
- **Editor y Plantillas CUV:** `configureSchoolDocumentTemplate`, `generateSchoolDocument`, `verifySchoolDocumentByCUV` (Secretaría, Dirección).
- **Formularios Dinámicos y Firmas:** `saveInstitutionalForm`, `registerDocumentSignature` (Docentes, Estudiantes, Padres).

---

## B. ESTADO ACTUAL DE LAS SUBCAPACIDADES EVALUADAS

| ID | Área / Subcapacidad | Prioridad | Estado Funcional | Implementación Real Encontrada | Limitaciones y Brechas Principales |
|---|---|---|---|---|---|
| **F41-01** | Importación adaptable de Excel | P0 | Implementada parcialmente | `validateImportPreview` y `importDataWithColumnMapping` en `backend/accounting-service/Code.gs` (l. 10167). | Solo procesa la primera hoja; sensible a encabezados vacíos intermedios; no almacena copia del archivo fuente original. |
| **F41-02** | Compatibilidad e integridad de identificadores | P0 | Implementada parcialmente | `SecuenciasIDs` en `backend/academic-service/Code.gs` (l. 3120). | No distingue formalmente registros históricos cerrados de registros activos en la ingesta; no valida ceros iniciales en cadenas de texto plano. |
| **F41-03** | Concurrencia de identificadores | P0 | Completa y verificada | `generateInstitutionalId` con `LockService.getScriptLock()` y `waitLock(10000)`. | Excelente protección atómica contra colisiones concurrentes en Sheets. |
| **F41-04** | Creación y conversión de formularios | P1 | Implementada parcialmente | `saveInstitutionalForm` en `backend/user-service/Code.gs` (l. 6378). | Permite crear formularios dinámicos JSON, pero carece de convertidor automático de archivos Word (DOCX) y PDF a formulario. |
| **F41-05** | OCR y revisión de datos | P1 | Ausente | No se encontraron funciones operativas de OCR en backend. | No existe motor de extracción de texto para PDFs escaneados ni panel de corrección humana lado a lado. |
| **F41-06** | Precisión de campos superpuestos | P1 | Implementada parcialmente | `previewSchoolDocument` y editor visual en `js/teacher.js`. | Maneja coordenadas porcentuales (`xRatio`, `yRatio`), pero presenta leves desplazamientos al imprimir en formatos de página distintos a Carta. |
| **F41-07** | Solicitudes, notificaciones y firmas | P0 | Requiere mejoras | `registerDocumentSignature` en `backend/user-service/Code.gs` (l. 6553). | Genera token pseudoaleatorio; no hace tracking de estados intermedios (entregado, abierto, vencido) ni orden secuencial entre múltiples firmantes. |
| **F41-08** | Aislamiento departamental | P0 | Implementada parcialmente | `ROLE_PERMISSIONS` y validaciones básicas en servicios. | Los endpoints de consulta devuelven datos si el rol tiene permiso general, sin validar siempre el departamento del solicitante frente al documento. |
| **F41-09** | Recuperación y reintentos | P0 | Requiere mejoras | Sin mecanismos de reanudación automática ni idempotencia por lotes en importaciones masivas. | Si una importación de 500 filas falla en la fila 250, no se puede reanudar desde el fallo sin reprocesar o duplicar las primeras 249. |
| **F41-10** | Auditoría y reversión | P0 | Defectuosa | `AuditoriaMigraciones` registra el lote (`MIG-timestamp`), pero no existe función de reversión. | No es posible deshacer una importación defectuosa sin alterar manualmente la base de datos de producción. |

---

## C. COMPARACIÓN FUNCIONAL Y BENCHMARK EXTERNO

| Capacidad Esperada | Estado en Plataforma Educativa | Referencia Externa (PowerSchool / Adobe Acrobat / DocuSign) | Brecha e Impacto | Mejora Recomendada |
|---|---|---|---|---|
| **Mapeo Adaptable** | Mapeo por diccionario simple; si el encabezado difiere, exige mapeo manual. | PowerSchool Data Import Manager reconoce automáticamente sinónimos y variaciones de acentos/espacios. | **MEDIO:** Mayor carga de configuración manual para secretaría. | Incorporar normalizador de cadenas (Levenshtein / similitud difusa) en encabezados. |
| **Concurrencia de IDs** | `LockService` con espera de 10s en `SecuenciasIDs`. | Concurrencia atómica equivalente a transacciones ACID de bases de datos relacionales. | **SATISFACTORIO:** Cumple los más altos estándares de inmutabilidad y unicidad. | Mantener arquitectura `LockService`. |
| **Extracción OCR** | Inexistente en backend; solo se admiten PDFs vectoriales o imágenes directas. | Adobe Acrobat Pro / Google Cloud Vision OCR con resaltado de baja confianza. | **ALTO:** Imposibilidad de digitalizar actas históricas escaneadas sin transcribir manualmente. | Integrar microservicio OCR para PDF escaneados con vista comparativa de corrección. |
| **Tracking de Firmas** | Registra firma directamente (`FirmasConformidades`); sin tracking intermedio. | DocuSign / Adobe Sign rastrean: enviado, entregado, abierto, firmado, declinado, revocado. | **ALTO:** Incertidumbre institucional sobre si el padre/empleado recibió o leyó el trámite. | Implementar ciclo de vida completo de solicitud de firma en `SolicitudesFirmas`. |
| **Reversión de Lotes** | Registro en `AuditoriaMigraciones`, pero sin función `revertImportBatch`. | PowerSchool permite "Rollback Import" restituyendo valores previos si no hay transacciones dependientes. | **CRÍTICO:** Errores de carga masiva corrompen datos históricos irreversiblemente. | Implementar `revertDataImportBatch` con snapshot de valores previos y validación de dependencias. |

---

## D. LISTA MAESTRA DE CARACTERÍSTICAS Y CRITERIOS DE ACEPTACIÓN

| ID | Característica | Prioridad | Estado | Criterios de Aceptación Obligatorios |
|---|---|---|---|---|
| **CAR-F41-01** | Normalización Automática de Encabezados | P0 | Implementada parcialmente | Reconocer columnas reordenadas, variaciones de mayúsculas, tildes y sinónimos comunes sin fallar. |
| **CAR-F41-02** | Protección de Identificadores y Secuencias | P0 | Completa y verificada | Ninguna colisión de IDs en 100 peticiones concurrentes simultáneas. |
| **CAR-F41-03** | Motor de Reversión Segura de Importaciones | P0 | Defectuosa | Deshacer un lote de importación eliminando registros creados y restaurando valores previos si no hay transacciones hijas. |
| **CAR-F41-04** | Aislamiento Departamental Estricto (ABAC) | P0 | Implementada parcialmente | Denegar consultas y escrituras directas sobre expedientes de otros departamentos en backend. |
| **CAR-F41-05** | Flujo de Firma Multietapa con Notificación | P0 | Requiere mejoras | Ciclo de vida: Enviado -> Entregado -> Visto -> Firmado / Rechazado, con reintentos controlados. |
| **CAR-F41-06** | Procesamiento OCR con Revisión Humana | P1 | Ausente | Extraer texto de PDFs escaneados y presentar pantalla de corrección asistida antes de persistir. |
| **CAR-F41-07** | Fidelidad Visual e Impresión de PDF Final | P1 | Implementada parcialmente | Impresión idéntica a pantalla sin recorte de campos ni desplazamientos tipográficos. |
| **CAR-F41-08** | Reanudación Idempotente de Importaciones | P0 | Requiere mejoras | Reintentar lotes fallidos procesando únicamente filas pendientes sin duplicar las exitosas. |

---

## E. RESULTADOS DE LA MATRIZ DE PRUEBAS INTEGRALES (E2E-41-01 a E2E-41-12)

| Prueba | Escenario Evaluado | Resultado Esperado | Resultado Observado | Estado |
|---|---|---|---|---|
| **E2E-41-01** | Importar Excel con columnas reordenadas y tildes | Correspondencias correctas y datos íntegros | `validateImportPreview` permite mapeo interactivo y respeta correspondencias | **Aprobada** |
| **E2E-41-02** | Importar registros nuevos vs existentes | Identificadores conservados; duplicados detectados | Duplicados en archivo no se validan antes de la inserción masiva | **Aprobada con observaciones** |
| **E2E-41-03** | Concurrencia de 50 peticiones simultáneas de IDs | Unicidad de identificadores sin colisiones | 50 identificadores únicos generados secuencialmente gracias a `LockService` | **Aprobada** |
| **E2E-41-04** | Crear formulario desde cero y generar PDF | Formulario guardado y exportado en PDF | Se guarda JSON en `FormulariosInstitucionales` y se previsualiza | **Aprobada** |
| **E2E-41-05** | Convertir PDF/DOCX a formulario digital | Extracción automática de campos | No existe conversor automático de DOCX; requiere diseño manual de campos | **Fallida (Brecha Funcional)** |
| **E2E-41-06** | Procesar documento escaneado con OCR | Extracción de texto y corrección humana | No existe función backend de OCR; prueba bloqueada por falta de componente | **Bloqueada** |
| **E2E-41-07** | Superposición de campos en plantilla CUV | Posición exacta en PDF descargado | Coordenadas preservadas en PDF; leve variación en impresión A4 vs Carta | **Aprobada con observaciones** |
| **E2E-41-08** | Enviar documento a dos firmantes secuenciales | Destinatarios notificados y estados correctos | Solo se admite firma unitaria inmediata; no hay flujo secuencial de 2 firmas | **Fallida (Requiere Mejoras)** |
| **E2E-41-09** | Acceso a expediente desde departamento ajeno | Acceso denegado en backend | Si se altera el ID en la petición, la consulta puede retornar datos generales | **Fallida (Riesgo P0)** |
| **E2E-41-10** | Interrupción a mitad de carga y reintento | Reanudación sin duplicaciones | Reintentar el archivo duplica las filas procesadas antes de la caída | **Fallida (Riesgo P0)** |
| **E2E-41-11** | Revertir importación con cambios posteriores | Reversión selectiva que detecta conflictos | No existe función de reversión; operación requiere intervención manual | **Fallida (Riesgo P0)** |
| **E2E-41-12** | Auditoría y trazabilidad de extremo a extremo | Historial completo de operaciones | Operaciones registradas en `AuditoriaMigraciones` y `LogsSistema` | **Aprobada** |

---

## F. PLAN DE RESOLUCIÓN PRIORIZADO (BACKLOG FASE 41)

### Bloque P0: Integridad Transaccional, Concurrencia y Aislamiento Crítico
- **[F41-Task01] [P0] Implementación del motor de reversión segura de importaciones masivas:** Desarrollar `revertDataImportBatch` que consulte el snapshot de valores previos en `DetalleRegistrosImportados`, verifique que los registros no tengan transacciones hijas posteriores y deshaga los cambios atómicamente.
- **[F41-Task02] [P0] Reanudación idempotente de importaciones interrumpidas:** Incorporar claves de idempotencia por fila (`idempotencyKey`) y punto de control (`batchCheckpoint`) para permitir reanudar importaciones fallidas sin reprocesar filas ya consolidadas.
- **[F41-Task03] [P0] Blindaje de aislamiento departamental en endpoints de consulta:** Reforzar las validaciones perimetrales en backend exigiendo correspondencia estricta entre el departamento del usuario autenticado y el departamento propietario del documento o expediente.
- **[F41-Task04] [P0] Ciclo de vida y tracking de estados de solicitudes de firma:** Implementar máquina de estados formal (`Borrador`, `Enviado`, `Entregado`, `Visto`, `Firmado`, `Rechazado`, `Cancelado`, `Vencido`) con soporte para firmas secuenciales multifirmante.

### Bloque P1: Automatización Documental, OCR y Fidelidad Visual
- **[F41-Task05] [P1] Servicio OCR para documentos escaneados con corrección asistida:** Integrar microservicio de OCR para español y desarrollar interfaz comparativa lado a lado que resalte campos dudosos para su validación humana obligatoria.
- **[F41-Task06] [P1] Convertidor estructural de documentos Word (DOCX) a formularios digitales:** Implementar parser de tablas y controles de contenido en archivos DOCX para acelerar la conversión de trámites físicos a formularios web.
- **[F41-Task07] [P1] Normalizador inteligente de encabezados y correspondencia de columnas:** Incorporar coincidencia difusa (fuzzy matching) en `validateImportPreview` para detectar automáticamente sinónimos y variaciones ortográficas de encabezados comunes.
- **[F41-Task08] [P1] Calibración de fidelidad visual e impresión multiformato:** Normalizar el renderizado PDF en plantillas CUV para garantizar que no existan desbordamientos tipográficos en formatos Carta, Oficio y A4.

---

## G. CONCLUSIÓN Y MÉTRICAS CUANTITATIVAS DE AUDITORÍA

### Fórmulas Cuantitativas Obligatorias

$$\text{Cobertura de Inspección} = \frac{\text{Subcapacidades Inspeccionadas}}{\text{Subcapacidades Identificadas y Aplicables}} \times 100 = \frac{10}{10} \times 100 = 100.0\%$$

$$\text{Cobertura de Ejecución} = \frac{\text{Subcapacidades con Pruebas Ejecutadas}}{\text{Subcapacidades Identificadas y Aplicables}} \times 100 = \frac{9}{10} \times 100 = 90.0\%$$

$$\text{Cobertura de Verificación} = \frac{\text{Subcapacidades Verificadas Concluyentemente}}{\text{Subcapacidades Identificadas y Aplicables}} \times 100 = \frac{8}{10} \times 100 = 80.0\%$$

### Distribución de Estados Funcionales
- **Completa y verificada:** 1 subcapacidad (10.0%)
- **Implementada parcialmente:** 4 subcapacidades (40.0%)
- **Requiere mejoras:** 2 subcapacidades (20.0%)
- **Defectuosa:** 1 subcapacidad (10.0%)
- **Ausente:** 1 subcapacidad (10.0%)
- **Bloqueada:** 1 subcapacidad (10.0%)

### Dictamen Final
**FASE 41: REQUIERE MEJORAS / NO APROBADA PARA PRODUCCIÓN CRÍTICA.**
La plataforma cuenta con un excelente control de concurrencia para identificadores institucionales mediante `LockService` y una importación tabular estructurada. Sin embargo, la ausencia de un motor de reversión transaccional para importaciones masivas, la falta de OCR operativo y las brechas de reanudación ante caídas impiden otorgar la certificación de aceptación integral en esta etapa.

---

## H. REGISTRO CONSOLIDADO DE AVANCE

| ID | Subcapacidad | Estado Funcional | Inspección | Ejecución | Verificación | Evidencia de Código | Bloqueo / Brecha | Próximo Paso |
|---|---|---|---|---|---|---|---|---|
| F41-01 | Importación adaptable | Implementada parcialmente | 100% | Sí | Concluyente | `validateImportPreview` | Solo lee primera hoja | Multi-hoja y fuzzy matching |
| F41-02 | Integridad de IDs | Implementada parcialmente | 100% | Sí | Concluyente | `SecuenciasIDs` | No valida ceros iniciales string | Preservar tipos literales |
| F41-03 | Concurrencia de IDs | Completa y verificada | 100% | Sí | Concluyente | `LockService.waitLock` | Ninguno | Mantener arquitectura |
| F41-04 | Creación formularios | Implementada parcialmente | 100% | Sí | Concluyente | `saveInstitutionalForm` | Sin conversor DOCX | Desarrollar parser DOCX |
| F41-05 | OCR y revisión | Ausente | 100% | No | Bloqueada | N/A | Sin microservicio OCR | Integrar Cloud Vision / Tesseract |
| F41-06 | Campos superpuestos | Implementada parcialmente | 100% | Sí | Concluyente | `previewSchoolDocument` | Leve salto en A4 | Normalizar CSS print |
| F41-07 | Tracking de firmas | Requiere mejoras | 100% | Sí | Concluyente | `registerDocumentSignature` | Solo registra éxito final | Implementar ciclo de vida |
| F41-08 | Aislamiento departamental | Implementada parcialmente | 100% | Sí | Concluyente | `ROLE_PERMISSIONS` | Sin validación de ámbito ABAC | Forzar filtro departamental |
| F41-09 | Recuperación y reintentos | Requiere mejoras | 100% | Sí | Concluyente | Sin checkpoints por fila | Duplica filas al reintentar | Implementar idempotencia |
| F41-10 | Auditoría y reversión | Defectuosa | 100% | Sí | Concluyente | `AuditoriaMigraciones` | Sin función rollback | Desarrollar `revertImportBatch` |

---
## Tareas ejecutables derivadas de los hallazgos

> Se formalizan las ocho tareas descritas explícitamente en el Plan de Resolución (F41-Task01..F41-Task08), conservando prioridades y alcance. La bitácora histórica confirma que el backlog consolidado llegó a once tareas (F41-Task01..F41-Task11), con Task09..Task11 en P2, pero no conserva sus descripciones ni criterios. No se reconstruyen por conjetura ni se crean sustitutos. La subcapacidad F41-03/CAR-F41-02 permanece completa y verificada, por lo que no genera remediación nueva.

### [F41-Task01] Motor de reversión segura de importaciones masivas
- **Hallazgo de origen:** F41-10; CAR-F41-03; E2E-41-11.
- **Severidad:** Crítica. **Objetivo:** revertir un lote defectuoso sin borrar ni sobrescribir cambios posteriores o registros dependientes.
- **Acción ejecutable:** implementar `revertDataImportBatch`; recuperar snapshots de `DetalleRegistrosImportados`; comprobar transacciones hijas y modificaciones posteriores; preparar un plan de reversión; aplicar cambios con bloqueo y control transaccional; registrar conflictos por fila.
- **Archivos/módulos:** `backend/accounting-service/Code.gs`, `AuditoriaMigraciones`, `DetalleRegistrosImportados` y funciones de importación/persistencia.
- **Dependencias/riesgos:** snapshots íntegros; coordinación con F41-Task02; riesgo de pérdida de cambios posteriores, reversión parcial y concurrencia.
- **Alcance:** reversión de lotes con restauración de valores previos; prohibidos los borrados masivos ciegos.
- **Criterios de aceptación:** reversión completa en lote de prueba; protección y reporte de registros dependientes o modificados después; operación atómica o estado recuperable explícito; auditoría de actor, lote, filas y resultado; pruebas de rollback total, parcial, concurrencia y conflicto.
- **Prioridad:** P0. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; el informe indica que no existe función de reversión y E2E-41-11 falló.

### [F41-Task02] Reanudación idempotente de importaciones interrumpidas
- **Hallazgo de origen:** F41-09; CAR-F41-08; E2E-41-10.
- **Severidad:** Crítica. **Objetivo:** reanudar desde la última fila confirmada sin duplicar registros consolidados.
- **Acción ejecutable:** generar `idempotencyKey` estable por fila; persistir `batchCheckpoint` y estado durable por fila; consultar el estado antes de escribir; separar filas pendientes, confirmadas y fallidas; permitir reanudación tras timeout o reinicio.
- **Archivos/módulos:** `backend/accounting-service/Code.gs`, `validateImportPreview`, `importDataWithColumnMapping` y tablas de lotes/detalle/auditoría.
- **Dependencias/riesgos:** coordinar con F41-Task01 y mecanismos de idempotencia/concurrencia; riesgo de claves inestables y confirmaciones prematuras.
- **Alcance:** importaciones masivas por lote y fila, con trazabilidad de cada intento.
- **Criterios de aceptación:** una carga interrumpida de 500 filas se reanuda sin duplicar filas confirmadas; checkpoint sobrevive reinicios; reintentos concurrentes no duplican escrituras; errores por fila pueden reintentarse aisladamente; pruebas de caída antes/después de escritura y confirmación.
- **Prioridad:** P0. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; el informe describe duplicación al reintentar y E2E-41-10 falló.

### [F41-Task03] Blindaje del aislamiento departamental en endpoints
- **Hallazgo de origen:** F41-08; CAR-F41-04; E2E-41-09.
- **Severidad:** Crítica. **Objetivo:** impedir consultas o modificaciones de expedientes ajenos aunque se manipule el identificador.
- **Acción ejecutable:** aplicar autorización ABAC server-side en endpoints de lectura/escritura; resolver departamento desde identidad autenticada y contrastarlo con el ámbito propietario del recurso; denegar por defecto y registrar intentos fuera de ámbito.
- **Archivos/módulos:** `backend/user-service/Code.gs`, `backend/academic-service/Code.gs`, `backend/accounting-service/Code.gs`, `ROLE_PERMISSIONS` y endpoints de expedientes/documentos/formularios.
- **Dependencias/riesgos:** coordinar con RBAC/ABAC institucional y aislamiento F37; no confiar en departamento, rol o ID enviados por el cliente; riesgo IDOR/fuga interdepartamental.
- **Alcance:** autorización por recurso y departamento en backend, no solo controles de interfaz.
- **Criterios de aceptación:** ID de otro departamento denegado en todos los endpoints; ámbito derivado de sesión autenticada; excepciones privilegiadas explícitas; pruebas negativas con ID manipulado, cambio de rol y llamadas directas.
- **Prioridad:** P0. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; E2E-41-09 falló al retornar datos generales tras alterar el ID.

### [F41-Task04] Ciclo de vida y tracking de solicitudes de firma
- **Hallazgo de origen:** F41-07; CAR-F41-05; E2E-41-08.
- **Severidad:** Alta. **Objetivo:** gestionar firmas multietapa con estados verificables, orden de firmantes y notificaciones controladas.
- **Acción ejecutable:** implementar estados `Borrador`, `Enviado`, `Entregado`, `Visto`, `Firmado`, `Rechazado`, `Cancelado` y `Vencido`; soportar secuencia de firmantes, tokens criptográficamente seguros, vencimiento/revocación y reintentos de notificación; registrar transiciones.
- **Archivos/módulos:** `backend/user-service/Code.gs`, `registerDocumentSignature`, `SolicitudesFirmas`, `FirmasConformidades` y notificaciones.
- **Dependencias/riesgos:** identidad, firma electrónica, trazabilidad y notificaciones; riesgo de enlaces reutilizables, transiciones inválidas y firmas fuera de orden.
- **Alcance:** ciclo de vida de solicitudes; el registro final no sustituye evidencia de entrega o lectura.
- **Criterios de aceptación:** transiciones validadas por estado/actor; dos o más firmantes completan el orden configurado; tokens impredecibles, de un solo uso y revocables; estados consultables; reintentos no duplican eventos/firmas; pruebas de rechazo, expiración, revocación y orden.
- **Prioridad:** P0. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; el informe registra firma unitaria inmediata sin tracking y E2E-41-08 falló.

### [F41-Task05] Servicio OCR con corrección humana asistida
- **Hallazgo de origen:** F41-05; CAR-F41-06; E2E-41-06.
- **Severidad:** Alta. **Objetivo:** extraer texto de documentos escaneados y validar/corregir resultados antes de persistirlos.
- **Acción ejecutable:** integrar OCR para español; procesar PDF escaneado e imágenes; devolver texto, coordenadas y confianza por campo; crear interfaz comparativa que marque baja confianza y exija revisión humana.
- **Archivos/módulos:** servicio OCR/adaptador backend, almacenamiento temporal, frontend de digitalización y flujo de formularios.
- **Dependencias/riesgos:** definir proveedor, costo, privacidad, retención y límites; riesgo de errores OCR y exposición de datos sensibles.
- **Alcance:** extracción asistida con revisión humana obligatoria; no persistir como dato validado automáticamente.
- **Criterios de aceptación:** PDF escaneado produce texto/campos con confianza; valores dudosos resaltados; corrección humana registrada; confirmación requerida antes de persistir; pruebas con baja resolución, inclinación, tablas y caracteres españoles.
- **Prioridad:** P1. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; no se localizaron funciones OCR y E2E-41-06 quedó bloqueada.

### [F41-Task06] Convertidor estructural DOCX a formularios digitales
- **Hallazgo de origen:** F41-04; E2E-41-05.
- **Severidad:** Media. **Objetivo:** convertir documentos Word en propuestas de formularios digitales conservando su estructura reconocible.
- **Acción ejecutable:** implementar parser DOCX para tablas, etiquetas y controles de contenido; generar esquema editable; exigir revisión y aprobación antes de publicar.
- **Archivos/módulos:** backend de formularios, `saveInstitutionalForm`, frontend de creación/edición y almacenamiento de plantillas.
- **Dependencias/riesgos:** catálogo de campos, validaciones y seguridad de archivos; riesgo de interpretar texto ordinario como campo o perder formato.
- **Alcance:** conversión asistida DOCX; OCR de PDF escaneado pertenece a F41-Task05.
- **Criterios de aceptación:** DOCX de prueba con tablas/controles genera esquema editable; etiquetas, tipos y orden preservados; ambigüedades marcadas; publicación requiere aprobación; pruebas con tablas anidadas, celdas combinadas y controles vacíos.
- **Prioridad:** P1. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; existe creación JSON, pero no convertidor DOCX y E2E-41-05 falló.

### [F41-Task07] Normalizador inteligente de encabezados y correspondencia de columnas
- **Hallazgo de origen:** F41-01; CAR-F41-01; E2E-41-01/E2E-41-02.
- **Severidad:** Media. **Objetivo:** reconocer encabezados equivalentes pese a diferencias de acentos, mayúsculas, espacios, orden y sinónimos.
- **Acción ejecutable:** normalizar Unicode, tildes, espacios y puntuación; aplicar diccionario de sinónimos y similitud difusa con umbral configurable; mostrar sugerencias y exigir confirmación en casos ambiguos.
- **Archivos/módulos:** `backend/accounting-service/Code.gs`, `validateImportPreview` e interfaz de mapeo.
- **Dependencias/riesgos:** conservar mapeo manual y tipos/valores originales; riesgo de emparejamiento falso y asignación a columna incorrecta.
- **Alcance:** sugerencia de correspondencia de encabezados; no modificar celdas ni inferir silenciosamente casos ambiguos.
- **Criterios de aceptación:** reconoce tildes, mayúsculas, espacios, orden y sinónimos; muestra confianza; umbral bajo requiere aprobación; pruebas con encabezados desconocidos, duplicados y falsos amigos.
- **Prioridad:** P1. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; existe mapeo interactivo, pero el informe recomienda normalización y similitud difusa.

### [F41-Task08] Calibración de fidelidad visual e impresión multiformato
- **Hallazgo de origen:** F41-06; CAR-F41-07; E2E-41-07; registro H.
- **Severidad:** Media. **Objetivo:** mantener posición y tipografía de campos superpuestos al previsualizar, exportar e imprimir en Carta, Oficio y A4.
- **Acción ejecutable:** normalizar coordenadas/dimensiones por formato; establecer CSS de impresión y escalado; comparar PDF con plantilla de referencia; corregir desbordamientos y desplazamientos.
- **Archivos/módulos:** `js/teacher.js`, `previewSchoolDocument`, editor CUV y generación PDF backend.
- **Dependencias/riesgos:** diseñador universal de documentos/plantillas; riesgo de regresión y diferencias entre motores de impresión.
- **Alcance:** renderizado y fidelidad de campos en los formatos indicados, preservando plantillas vigentes.
- **Criterios de aceptación:** posiciones dentro de tolerancia definida en Carta, Oficio y A4; sin recortes/desbordamientos; regresión visual con varias plantillas, escalas y navegadores.
- **Prioridad:** P1. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; se observó desplazamiento A4 vs Carta y E2E-41-07 fue aprobada con observaciones.

### Reconciliación, discrepancias y límites
- **F41-Task01..F41-Task08:** formalizadas desde el Plan de Resolución; IDs, prioridades y estados preservados.
- **F41-Task09..F41-Task11:** la bitácora confirma su existencia histórica como tareas P2, pero no conserva sus descripciones; quedan pendientes de recuperación documental, sin inventar objetivos ni criterios.
- **F41-03/CAR-F41-02:** completa y verificada según el informe; no se crea tarea correctiva para concurrencia de identificadores.
- **E2E-41-01..E2E-41-12 y métricas 100%/90%/80%:** resultados históricos; esta normalización no reejecuta pruebas ni certifica el estado actual del código.
- **Dictamen:** Requiere Mejoras / No Aprobada para Producción Crítica; añadir este bloque no cierra brechas funcionales.


## Revalidación TASK-153 — IMA-EXEC-20261110-0042Z-01 — C1.385

**Fuentes existentes reutilizadas:** F41-08 y E2E-41-09. No se crea un nuevo informe ni se duplica el hallazgo.

**Hallazgos confirmados en el HEAD previo C1.384:**
1. `validateAcademicResponsibilityAndScopeAccess` usa `payload.userId` y `payload.role` como identidad, y concede acceso general a roles administrativos sin verificar un ámbito departamental. La acción aparece expuesta en el router, pero no está integrada como control perimetral de los endpoints de datos.
2. `assertRecordOwnership` permite por defecto a roles distintos de estudiante; su comprobación de propietario no equivale a una validación de departamento.
3. `getStudentDocuments` puede devolver el conjunto completo cuando no recibe filtro; `getStudentFile` no aplica comprobación departamental propia.
4. En USER, `getUserScopeConfig` acepta un `userId` del payload, `validateRoleScopeAccess` lo utilizaba para resolver ámbitos y `assignRoleScope` priorizaba `payload.authRole` antes de la identidad verificada. No existía `getUserContextScope`.

**Corrección parcial C1.385:**
- Nuevo `getUserContextScope(payload)`: obtiene identidad mediante `getUserVerifiedRole`/sesión firmada; ignora `userId` y `role` del cliente; devuelve solo asignaciones activas del usuario y rol verificados, dentro de su vigencia.
- El alcance institucional solo se reconoce mediante una asignación explícita `INSTITUCION` cuyo valor coincide con la institución configurada; el rol por sí solo no concede acceso global.
- `validateRoleScopeAccess` consulta el contexto verificado y deniega valores fuera del ámbito.
- `assignRoleScope` exige actor verificado, requiere `roleId` y actualiza asignaciones por usuario+rol+tipo de ámbito.
- Se agrega el contrato determinista `tests/security/department-scope-contract.test.js` y workflow limitado a `NG_beta_0.0.0.1_work`.

**Estado:** implementación parcial. La suite CI C1.385 está pendiente; aún no se aplican los controles a todos los endpoints Academic/Accounting ni se implementan las referencias compartidas, por lo que TASK-153 permanece **En ejecución** y sus criterios de aceptación globales siguen pendientes.

### Seguimiento F41-08 / E2E-41-09 — TASK-153 — C1.386–C1.388
- **Estado:** En corrección; sin cierre global.
- **Implementado parcialmente:** Academic valida identidad firmada, ámbito departamental, relación estudiante/tutor y propiedad de documentos; Accounting limita documentos laborales por departamento y configura nuevas cargas como privadas.
- **Controles locales:** identity mapping run 42737873813 success; department scope run 42737873883 success; task-service run 42737665503 success. C1.386 falló inicialmente por colisión de variable, corregida en C1.387.
- **Limitación estructural:** expedientes/documentos estudiantiles carecen de DepartamentoID; el backend falla cerrado para usuarios departamentales cuando no puede resolver propietario. La suite positiva usa fixtures con propietario explícito; no certifica el esquema real existente.
- **Estructuras no encontradas:** ExpedientesInstitucionales, SolicitudesFirmas y CatalogoDepartamentos; existe DepartamentosAcademicos. ExpedientesLaborales.Departamento permite resolver el ámbito de documentos laborales.
- **Riesgos relacionados pendientes:** archivos laborales existentes pueden mantener permisos públicos; validateEvidenceFileAndPermissions rechaza evidencia no vinculada a DocumentosEstudiante; uploadPaymentVoucher conserva ANYONE_WITH_LINK y confía en payload.userId.
- **Pendiente funcional:** referencias compartidas revocables; descarga/firma/compartir/exportar/eliminar/restaurar; filtros de búsqueda/importación; parametrización de política estricta.
- Se reutilizan F41-08/E2E-41-09; no se crea ID duplicado. TASK-153 permanece En ejecución.

### Seguimiento F41-08 / E2E-41-09 — comprobantes de pago — C1.390–C1.391
- **Corrección:** uploadPaymentVoucher verifica identidad firmada y propiedad del usuario objetivo; tutor requiere relación activa y acceso de portal; personal requiere alcance departamental/institucional. Nuevos archivos privados.
- **Lectura/revisión:** getPaymentVouchers filtra por propietario y ámbito; reviewPaymentVoucher exige actor firmado y autorización sobre el propietario antes de cambiar estado.
- **CI:** identity mapping run 42738762937 success; department scope run 42738862173 success. La primera suite C1.390 falló por una llamada de test con parámetro adicional; corregida y aprobada en C1.391.
- **Límites:** expedientes/documentos estudiantiles no tienen DepartamentoID; no existe aún endpoint de preview/stream autorizado para comprobantes privados; comprobantes históricos y documentos laborales anteriores pueden conservar permisos públicos. TASK-153 continúa En ejecución.
- Se mantiene F41-08/E2E-41-09; no se crea ID de auditoría duplicado.



### Seguimiento F41-08 / E2E-41-09 — lectura autenticada de comprobantes privados — C1.393
- **Corrección:** ACCOUNTING incorpora getPaymentVoucherFile, que exige identidad firmada, localiza el comprobante por ID interno y deriva el file ID de la fila almacenada; no acepta un file ID del cliente.
- **Autorización del recurso:** reutiliza assertPaymentVoucherOwnerAccess_ para estudiante propietario, tutor con relación activa/portal, personal con ámbito departamental o acceso institucional explícito.
- **Protección del contenido:** archivos en papelera, vacíos, mayores de 10 MiB o con extensión/MIME fuera de PDF/JPG/JPEG/PNG/WEBP se rechazan; la respuesta entrega Base64 solo después de autorizar.
- **Pruebas:** el contrato Accounting agrega casos positivos y negativos de IDOR, tutor, departamento, ámbito institucional, sesión inválida, comprobante inexistente y file ID inyectado ignorado.
- **CI:** identity mapping run 42739904392 success; department scope run 42739904420 success. La segunda ejecución incluye los contratos Academic y Accounting.
- **Pendiente:** no se integró aún el cliente/UI; los permisos públicos de archivos históricos requieren inventario y revocación controlada; no se ejecutó integración real Apps Script/Sheets/Drive. TASK-153 permanece En ejecución; no se crea un nuevo ID F41-08/E2E-41-09.
