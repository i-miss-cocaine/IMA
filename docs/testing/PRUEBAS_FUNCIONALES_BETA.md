# Plan y registro maestro de pruebas funcionales beta — IMA

**Estado:** Preparación del catálogo; la fase beta no se declara iniciada.
**Repositorio:** `i-miss-cocaine/IMA`
**Rama de trabajo:** `NG_beta_0.0.0.1_work`
**Metodología rectora:** `METODOLOGIA_DESARROLLO.md`, sección 21.

## 1. Separación de estados
- **Implementación Completada:** requisitos implementados, verificaciones internas aplicables y autoauditoría satisfactorias, Code Review interno aprobado.
- **Prueba beta Pendiente:** el escenario funcional integral todavía no se ejecutó en ambiente beta.
- No marcar PASS porque el código exista, compile o haya superado Code Review.
- La ausencia de pruebas beta no impide cerrar una tarea de implementación terminada. Un defecto beta genera incidencia/seguimiento sin falsificar el historial.

## 2. Preparación antes de abrir beta
Registrar build/commit, ambiente y configuración (sin secretos), fechas, responsables, módulos habilitados, roles/cuentas de prueba, datos sintéticos/anonimizados, servicios externos, cuotas, respaldo/restauración, criterios de entrada/salida, severidad y matriz de navegadores/dispositivos.
**Seguridad:** ambiente aislado; prohibido usar datos personales reales o ejecutar pruebas destructivas contra producción. No guardar credenciales ni datos sensibles.

## 3. Formato obligatorio de cada caso
Cada caso debe incluir: ID único BETA-FUNC-###; área/módulo y rol; requisito e ID de tarea; objetivo; prioridad; precondiciones; ambiente/build; datos de prueba; pasos reproducibles; resultado esperado y real; estado (Pendiente/PASS/FAIL/BLOCKED/No aplica); severidad; evidencia sin secretos; incidencia/tarea derivada; fecha y responsable.

## 4. Catálogo de tipos de pruebas
### 4.1 Smoke y disponibilidad
Login/logout, recuperación de sesión, carga inicial, navegación y servicios críticos.
### 4.2 Flujos funcionales por rol
Dirección: panel, autorizaciones, reportes y supervisión. Secretaría: admisión, expediente, matrícula, traslados y trámites. Contabilidad: cargos, pagos, recibos, conciliaciones, caja y cierres. Docente: grupos, horarios, asistencia, evaluaciones y calificaciones. Estudiante: horario, asistencia, calificaciones y documentos autorizados. Padre: estudiantes vinculados, pagos, avisos y trámites autorizados. Otros: biblioteca, transporte, RR. HH., inventario y módulos complementarios. Validar acciones permitidas y denegaciones por perfil.
### 4.3 CRUD y reglas de negocio
Altas, consultas, ediciones, bajas lógicas, campos obligatorios, formatos, límites, duplicados, estados inválidos y transiciones.
### 4.4 Persistencia e integridad
Guardado/recuperación tras recarga, unicidad, claves, relaciones, huérfanos, conciliación y ausencia de pérdida/duplicación/escritura parcial.
### 4.5 Integración y contratos API
Payloads, compatibilidad, autenticación interservicio, errores, timeouts, reintentos, idempotencia, deduplicación y correlación.
### 4.6 E2E y workflows interdepartamentales
Procesos completos, transferencias entre áreas, aprobaciones, rechazos, subsanaciones, delegaciones, vencimientos y estado final.
### 4.7 Documentos, formularios y firmas
Carga/descarga, versiones, PDF, hash, firmas, acuses, retención y permisos por expediente/ámbito.
### 4.8 Notificaciones y eventos
Destinatarios, contenido, orden, oportunidad, deduplicación, reintentos y recuperación de entregas fallidas.
### 4.9 Seguridad, privacidad y aislamiento
Autenticación, expiración/revocación, RBAC/ABAC, permisos positivos/negativos, IDOR, aislamiento institucional y logs sin datos sensibles.
### 4.10 Concurrencia y consistencia
Doble envío, operaciones simultáneas, edición concurrente, conflictos, bloqueos, transacciones e idempotencia.
### 4.11 Migración e importación
Conteos, hashes, relaciones, duplicados, huérfanos, rechazos, lotes reanudables, conciliación y rollback.
### 4.12 Compatibilidad, accesibilidad y usabilidad
Navegadores/dispositivos, responsive, navegación móvil, teclado, foco, etiquetas, contraste, lectores de pantalla y mensajes de error.
### 4.13 Rendimiento y capacidad
Tiempos de respuesta, carga, concurrencia, picos, paginación, cuotas, límites y timeouts Apps Script/servicios.
### 4.14 Resiliencia y recuperación
Pérdida de red, caída de servicios, reintentos, colas, estados parciales, respaldo, restauración y continuidad.
### 4.15 Regresión funcional
Reejecución de flujos críticos afectados y consumidores; suite de regresión por módulo/rol.
### 4.16 Auditoría y observabilidad
Trazas correlacionadas, bitácoras, atribución actor/rol/ámbito, métricas y alertas sin filtrar información sensible.

## 5. Matriz inicial de grupos (todos Pendientes)
| ID | Grupo | Prioridad | Estado |
|---|---|---|---|
| BETA-GRP-001 | Smoke/disponibilidad | P0 | Pendiente |
| BETA-GRP-002 | Autenticación/permisos | P0 | Pendiente |
| BETA-GRP-003 | Persistencia/integridad | P0 | Pendiente |
| BETA-GRP-004 | Secretaría/expediente | P0 | Pendiente |
| BETA-GRP-005 | Flujos académicos | P0 | Pendiente |
| BETA-GRP-006 | Contabilidad/finanzas | P0 | Pendiente |
| BETA-GRP-007 | Workflows/integración | P0 | Pendiente |
| BETA-GRP-008 | Documentos/firmas | P1 | Pendiente |
| BETA-GRP-009 | Notificaciones | P1 | Pendiente |
| BETA-GRP-010 | Migración/conciliación | P0 | Pendiente |
| BETA-GRP-011 | Compatibilidad/accesibilidad | P2 | Pendiente |
| BETA-GRP-012 | Rendimiento/capacidad | P1 | Pendiente |
| BETA-GRP-013 | Resiliencia/recuperación | P1 | Pendiente |
| BETA-GRP-014 | Regresión transversal | P0 | Pendiente |
| BETA-GRP-015 | Auditoría/observabilidad | P1 | Pendiente |

## 6. Severidad y criterios de salida
- **P0/Bloqueante:** seguridad, privacidad, pérdida/corrupción de datos, pagos/matrícula incorrectos o indisponibilidad crítica; detiene salida beta.
- **P1/Alto:** proceso central degradado o integración esencial fallida; corregir o aceptar formalmente el riesgo antes de salir.
- **P2/Medio:** defecto acotado con alternativa segura; documentar y priorizar.
- **P3/Bajo:** defecto menor; registrar y priorizar.
Salida beta: escenarios críticos ejecutados, cero P0 abiertos, tratamiento explícito de P1, regresión crítica, seguridad/integridad, respaldo/restauración y decisión documentada de continuar/corregir/detener.

## 7. Registro de ejecución
**La fase beta aún no se ha iniciado.** No hay pruebas funcionales PASS registradas.
| Fecha | Build/commit | Grupos ejecutados | PASS | FAIL | BLOCKED | Pendientes | Evidencia |
|---|---|---|---:|---:|---:|---:|---|
| — | — | — | 0 | 0 | 0 | Todos | Campaña no iniciada |

## 8. Historial
- C1.288 (2026-11-09): catálogo creado y separación entre cierre de implementación y certificación beta formalizada.


## 9. Casos beta pendientes derivados de auditorías
Todos quedan Pendientes; ejecutar después de implementar las tareas, en beta/staging aislado con datos sintéticos y build registrado. No se infiere PASS.

### BETA-FUNC-001 — Evaluaciones por identidad (AUD-NG-356 / TASK-685, P0)
Área EXAM; Estudiante, Padre/tutor y Docente. Precondición: TASK-685 implementada y relaciones sintéticas. Pasos: consulta sin token; alterar userId; probar tutor no vinculado/docente no asignado; repetir con relaciones autorizadas. Esperado: anónimos/no relacionados rechazados, identidad derivada de claims y datos mínimos autorizados. Estado Pendiente. Evidencia saneada. Derivación TASK-685.

### BETA-FUNC-002 — Borradores de admisión (AUD-NG-357 / TASK-686, P0)
Área ACADEMIC; Secretaría/solicitante. Precondición: TASK-686 implementada; capacidades sintéticas válidas, expiradas y revocadas. Pasos: recuperar con email solamente; alterar clave ajena; probar capacidades inválidas/expiradas/revocadas y válidas; concurrencia/reintentos. Esperado: email no autoriza; solo titular con capacidad válida accede; sin sobrescrituras/duplicados. Estado Pendiente. Evidencia con IDs sintéticos. Derivación TASK-686.

### BETA-FUNC-003 — Contratos API desarrollador (AUD-NG-358 / TASK-687, P1)
Área USER/ACADEMIC; Desarrollador/Administrador. Precondición: TASK-687 implementada; respaldos sintéticos. Pasos: ejecutar getBackupsList, restoreSpreadsheetBackup, runSystemMaintenance y exportSchoolYearArchive; repetir sin privilegios y provocar errores. Esperado: wrappers llegan a handlers reales; no autorizado rechazado; sin mocks como éxito. Estado Pendiente. Evidencia de requests/respuestas saneadas. Derivación TASK-687.

### BETA-FUNC-004 — Handlers y atomicidad (AUD-NG-359 / TASK-688, P0)
Área USER/ACADEMIC/TASK; administrador/usuarios autorizados. Precondición: TASK-688 implementada. Pasos: invocar acciones; inducir fallos antes/después de persistencia; repetir eventos; verificar manageAccountState/reintentos. Esperado: cero handlers inexistentes; estado/evento atómicos o recuperables; sin duplicación ni respuesta ambigua. Estado Pendiente. Evidencia antes/después. Derivación TASK-688.

### BETA-FUNC-005 — QuizPro IDs y bancos vacíos (AUD-NG-360 / TASK-689, P1)
Área QuizPro; Estudiante/Docente. Precondición: TASK-689 implementada; bancos sintéticos. Pasos: cargar pregunta repetidamente; reiniciar sesión; revisar historial/refuerzo/analítica; seleccionar bancos vacíos/deshabilitados. Esperado: ID constante, referencias persistentes, sin bucle de recarga y con alternativa/indisponibilidad explícita. Estado Pendiente. Evidencia IDs/conteos. Derivación TASK-689.

### BETA-FUNC-006 — Recuperación y secretos (AUD-NG-361 / TASK-690, P0)
Área USER; solicitante/administrador. Precondición: TASK-690 implementada; secreto protegido en beta. Pasos: configuración ausente; flujo legítimo; token falso/alterado/expirado/reutilizado; rotación y revocación. Esperado: falla cerrada sin secreto, sin fallback; tokens inválidos/revocados/reutilizados rechazados; token válido de un solo uso. Estado Pendiente. Evidencia saneada sin secretos/tokens. Derivación TASK-690.
