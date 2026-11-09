# AUDITORÍA TÉCNICA - TAREA-F6-005: Microservicios administrativos y financieros

**Fecha:** 2026-11-07  
**Repositorio:** i-miss-cocaine/IMA  
**Rama:** NG_beta_0.0.0.1_work  
**Checkpoint inicial:** C1.221  
**Checkpoint de cierre:** C1.222  
**Sesión:** IMA-AUDIT-20261107-2030Z  
**Dictamen:** **NO CUMPLE**  
**Estado histórico en completadas.md:** [X] (se conserva sin modificación).

> Esta auditoría también cubre TAREA-F6-030, que repite el mismo título y amplía el alcance y los criterios de TAREA-F6-005. Ambos registros están marcados [X] y carecían de informe individual. Se crean dos informes para conservar la trazabilidad por ID, pero comparten un único bloque canónico de tareas F6-005-A01..A06 para no duplicar trabajo.

## 1. Continuidad, fuentes y alcance

### 1.1 Estado Git y registros
- HEAD inicial de la rama NG_beta_0.0.0.1_work: c578aecb7503cdfe7e942a1e927b2416dcb0d739 (checkpoint C1.221).
- Rama base: NG_beta_0.0.0.1; la comparación anterior era 289 commits adelante y 0 detrás. La rama base no se modifica.
- completadas.md SHA f57f1aef832e81e44fc4f7ec36a852d50e464676:
  - TAREA-F6-005 [X], líneas 2619-2657; ocho requisitos y CA-031..CA-036.
  - TAREA-F6-030 [X], líneas 3443-3516; mismo título, alcance ampliado y CA-053..CA-060/CA-148..CA-150.
- Pendientes.md: lectura ordinaria 0 caracteres; se recuperó y consultó el blob Git SHA 631b4c2dbf0e86d5704b63625382d73ccb8ceb3c (1.803.672 bytes, 1.782.094 caracteres, 20.182 líneas, sin U+FFFD). No contiene TAREA-F6-005 ni TAREA-F6-030; no se modificó.
- ChangesLogs.txt SHA 5b5cff1926b73a05d1b92087a7bf4b2db75326ff:
  - líneas 1962-1965 afirma que TAREA-F6-005 se completó verificando initializeFinancialDriveStructure.
  - líneas 2130-2136 afirma que TAREA-F6-030 aisló carpetas financieras y que initializeDirectionSecretaryDriveStructure fue registrada en ROLE_PERMISSIONS y doPost.
  - La función de Dirección/Secretaría sí está en doPost, pero no aparece en ROLE_PERMISSIONS; no configura permisos Drive.
- AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F6-005.md y AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F6-030.md no existían en el árbol actual. Se crean ambos.
- AUDITORIAS/Auditoria.txt ya documenta F5-013 y AUD-NG-132..135: creación/deduplicación de cargos, integridad de pagos, recibo PDF no generado y facturación SAR. También existen AUD-NG-055..065 sobre seguridad de adjuntos y exposición de archivos. Estos hallazgos se amplían, no se duplican.
- TAREA-F6-030 repite el título de TAREA-F6-005 y añade requisitos detallados de Drive, módulos, multirol y trazabilidad. Se auditan ambos conjuntos de criterios con la misma evidencia.

### 1.2 Archivos y secciones inspeccionados
- backend/accounting-service/Code.gs SHA 38b979d41596b85e888b4a7060b37bbac0840a28, 17.740 líneas:
  - ROLE_PERMISSIONS: 196-215; validateContextualAccess/validateRolePermission: 418-484.
  - doPost y dispatchers: 572-760.
  - getParentDriveFolder/getOrCreateFolder: 101-113.
  - createAdmissionCharge: 2398-2421.
  - recordStudentPayment: 3891-3965.
  - uploadPaymentVoucher: 4100-4122; reviewPaymentVoucher/generatePaymentReceiptPDF: 4183-4260.
  - createFiscalInvoice/getFiscalInvoices: 4357-4575.
  - uploadEmployeeDocument: 5941-5957.
  - initializeFinancialDriveStructure: 10147-10197.
- backend/academic-service/Code.gs SHA df87a2eea9f0ef79d0b966d03fd5bbe432003df5, 14.449 líneas:
  - ROLE_PERMISSIONS y dispatcher: 178-230 y 671-900.
  - getStudentFile: 2510-2600.
  - initializeDirectionSecretaryDriveStructure: 4246-4278; route doPost: 871.
  - registerStudentEnrollment: 12800-12875.
- backend/user-service/Code.gs SHA 12079dd410aa6d8afbce55a4bc62a79dea605f9f, 9.808 líneas:
  - roles Dirección/Secretaría: 926-982.
  - generateSessionToken: 1065-1085; getUserVerifiedRole: 1146-1170.
  - assignRoleScope: 9100-9215; getUserDynamicDashboardConfig: 9270-9305; getInternalRoleAssignments: 9767-9807.
  - getParentDriveFolder/uploadNewsImage/getOrCreateFolderNews: 6634-6659.
- backend/developer-service/Code.gs SHA 8aa4bac67cfe5c8c54da51a0784a56fef633e412, manageUserMultiRolePermissions: 2585-2596.
- completadas.md, Pendientes.md (blob), ChangesLogs.txt, Auditoria.txt y MapaDependencias.md.

### 1.3 Limitaciones
Revisión estática/manual. No se ejecutó Apps Script ni se invocaron endpoints, Drive, hojas productivas o cuentas reales. No se realizaron pruebas de permisos efectivos, carga/descarga ni facturación SAR. La estructura de código de ACCOUNTING presenta un bloque de función sin cierre; no se ejecutó un parser ni se intentó desplegarlo. No se usaron datos productivos.

## 2. Hallazgos

### H1 - CRÍTICO/P0: createAdmissionCharge está incompleta y deja abierto el bloque de función
En backend/accounting-service/Code.gs:
- createAdmissionCharge abre en la línea 2398.
- El único cierre visible en la línea 2418 corresponde al bloque if (dup).
- No existe cierre de la función antes de que comience function previewBatchMonthlyCharges en la línea 2421.
- El archivo termina en la línea 17740 con el cierre de su última función, sin un cierre adicional para el bloque exterior.
- Para un cargo nuevo, el cuerpo solo comprueba duplicados y retorna el cargo existente si lo encuentra; no contiene appendRow ni un camino de creación y respuesta para un cargo inexistente.
- doPost sí despacha createAdmissionCharge (línea 640), y ROLE_PERMISSIONS incluye el action para Padre/Tutor/Responsable.
**Impacto:** el archivo presenta una estructura sintáctica incompleta; las declaraciones posteriores quedan dentro del ámbito abierto o el parser rechaza el archivo. No se puede certificar la compilación ni la disponibilidad de las operaciones contables. El endpoint de creación no implementa el camino nuevo.

### H2 - CRÍTICO/P0: la cadena cargo -> pago -> factura -> recibo no mantiene integridad referencial
- processPaymentReceipt no aparece en backend/accounting-service, user-service ni academic-service, ni existe un case con ese nombre en el dispatcher contable. Hay funciones parciales reviewPaymentVoucher y recordStudentPayment, pero no el flujo solicitado como operación integrada.
- registerStudentEnrollment (academic-service:12800-12875) escribe directamente en CargosEstudiante. ACCOUNTING también pretende crear cargos mediante createAdmissionCharge. No existe una única ruta transaccional de creación y ambos servicios escriben el mismo tipo de entidad.
- getStudentFile (academic-service:2510-2600) devuelve matrículas, tutores, documentos y movimientos; no integra cargos, pagos, facturas ni recibos.
- recordStudentPayment (accounting-service:3891-3965) puede registrar el pago aunque no encuentre el cargo; si se envía cargoId, busca solo por ID y no verifica que el propietario de la fila coincida con userId. Tampoco limita el abono al saldo pendiente ni utiliza un LockService propio. Esto coincide con AUD-NG-133.
- reviewPaymentVoucher (4183-4220) cambia primero el estado del comprobante y después llama recordStudentPayment; si el registro de pago falla, el comprobante puede permanecer aprobado sin el asiento correspondiente.
- generatePaymentReceiptPDF (4223-4260) devuelve un objeto JSON receiptData; no crea PDF, no genera archivo Drive ni URL descargable. Ya documentado por AUD-NG-134.
- createFiscalInvoice (4357-4575) acepta reciboCajaId opcional y lo almacena en FacturasFiscales, pero no comprueba que exista un pago/recibo confirmado ni que la referencia sea única y corresponda al mismo cliente.
- La emisión fiscal y el correlativo CAI tienen controles adicionales ya registrados en AUD-NG-135; no compensan la falta de integridad entre pago y recibo.
**Impacto:** pueden existir cargos ausentes, pagos huérfanos o cruzados, facturas asociadas a referencias inválidas y comprobantes aprobados sin pago. CA-034/CA-058 no se cumplen.

### H3 - CRÍTICO/P0: documentos financieros y laborales quedan expuestos por enlace público y fuera de la jerarquía definida
- getParentDriveFolder (accounting-service:101-107) usa PARENT_FOLDER_ID si existe, pero ante ausencia o error devuelve DriveApp.getRootFolder().
- initializeFinancialDriveStructure (10147-10197) crea Administracion_Financiera, Contabilidad, Recursos_Humanos, Facturacion_Recibos, Inventarios_Tienda y Bancos_Caja, además de subcarpetas. No establece permisos, ACL, miembros autorizados ni herencia.
- uploadPaymentVoucher (4110-4118) crea Comprobantes_Pago directamente bajo getParentDriveFolder, no bajo Facturacion_Recibos/Comprobantes_Ventanilla, y aplica DriveApp.Access.ANYONE_WITH_LINK.
- uploadEmployeeDocument (5946-5957) crea Documentos_Laborales directamente bajo getParentDriveFolder, no bajo Recursos_Humanos/Expedientes_Laborales, y aplica ANYONE_WITH_LINK.
- initializeDirectionSecretaryDriveStructure (academic-service:4246-4278) crea New Generation/Direccion, Secretaria y Compartido_Direccion_Secretaria, pero no aplica permisos de carpeta/archivo ni ACL diferenciadas. Usa DriveApp.getRootFolder directamente.
- getOrCreateFolder/getOrCreateSubFolder solo devuelven la primera coincidencia y no usan bloqueo; dos inicializaciones concurrentes pueden crear duplicados. No hay reconciliación de carpetas duplicadas preexistentes.
- La función initializeDirectionSecretaryDriveStructure está en el dispatcher (academic-service:871), pero no aparece en ROLE_PERMISSIONS; por tanto, los roles ordinarios Dirección/Secretaría no tienen un grant estático para ejecutarla. Solo roles con wildcard pueden superar ese control, salvo una matriz dinámica no verificada.
**Impacto:** la jerarquía existe parcialmente, pero los documentos no se almacenan en las subcarpetas que deberían protegerlos y los enlaces públicos eluden la separación por rol. CA-031/032/033/055/056/057 no se acreditan.

### H4 - ALTO/P1: multirol existe como datos/ámbitos parciales, pero no como contexto de autorización efectivo
- generateSessionToken (user-service:1065-1085) incluye solo user.role en el claim; getUserVerifiedRole (1146-1170) devuelve claims.role.
- accounting-service validateRolePermission (434-484) autoriza usando un solo claims.role y ROLE_PERMISSIONS[userRole]; no evalúa una colección de roles activos por usuario.
- manageUserMultiRolePermissions (developer-service:2585-2596) solo devuelve roles y assignedAreas recibidos; no los persiste ni los conecta con el token o los dispatchers.
- user-service sí tiene assignRoleScope/getInternalRoleAssignments, pero almacenan ámbitos y roleId; getUserDynamicDashboardConfig (9270-9305) consulta el rol principal de Usuarios y construye módulos desde ese único rol. No se observó integración de esas asignaciones en la autorización de ACCOUNTING.
- La ROLE_PERMISSIONS de ACCOUNTING (196-215) no contiene una entrada estática para Secretaría/Secretaria ni le concede recordStudentPayment/createFiscalInvoice; existe una matriz dinámica, pero no se verificó un registro que autorice esos actions.
- recordStudentPayment guarda userId del alumno, pago, referencia y observaciones, pero no registra el operador verificado, rol activo ni contexto de autorización. reviewPaymentVoucher/createFiscalInvoice registran payload.authRole, no el claim verificado _verifiedRole.
**Impacto:** no se demuestra que una sola identidad ejecute funciones de varias áreas con permisos separados ni que Secretaría pueda cobrar/facturar en ventanilla sin otra cuenta. CA-035/CA-148/CA-149/CA-150 no se cumplen.

### H5 - ALTO/P1: módulos financieros no son independientes ni extensibles mediante configuración
- ACCOUNTING concentra 17.740 líneas en un único Code.gs, un único doPost y un switch de operaciones.
- ROLE_PERMISSIONS y los cases del dispatcher contienen listas de acciones codificadas; initializeFinancialDriveStructure define las áreas y subáreas como objetos estáticos.
- No se identificó un catálogo de módulos financieros que permita registrar una subárea con operaciones, validaciones, permisos, almacenamiento y estado sin modificar el código/dispatcher.
- Los módulos comparten el mismo servicio, contexto de ejecución y Spreadsheet. Una falla de compilación o indisponibilidad del servicio contable afecta todas sus funciones; no existe aislamiento operativo por módulo.
**Impacto:** existen agrupaciones funcionales, pero no módulos independientes ni extensibles por configuración. CA-032/CA-036/CA-054/CA-059/CA-060 no se cumplen.

### H6 - ALTO/P1: la separación Dirección/Secretaría es nominal, no una política de acceso
- academic-service mantiene roles Director y Secretaría y una función de creación de carpetas separadas.
- initializeDirectionSecretaryDriveStructure no aplica ACL, no registra miembros, no configura permisos de lectura/escritura y no impide que las carpetas hereden permisos amplios del root.
- La acción no figura en ROLE_PERMISSIONS aunque sí aparece en doPost, contradiciendo ChangesLogs.txt:2130-2136.
- user-service utiliza un PARENT_FOLDER_ID común con fallback a Drive root para sus cargas genéricas; no acredita una estructura documental privada por rol.
**Impacto:** crear tres carpetas con nombres distintos no demuestra aislamiento de documentos ni de operaciones. CA-031/CA-053/CA-057 son parciales o incumplidos.

### H7 - ALTO/P1: la trazabilidad de transacciones no conserva el actor y rol verificados
- recordStudentPayment no escribe operador, rol activo, área, autorización, correlación ni referencia a la sesión en la fila de PagosAbonos.
- reviewPaymentVoucher y createFiscalInvoice utilizan payload.authRole en sus eventos; validateRolePermission almacena _verifiedRole, pero esos registros no consumen ese claim verificado.
- La identidad del alumno/cliente se mezcla con el actor que ejecuta el cobro; no existe evidencia suficiente para reconstruir quién realizó cada operación y bajo qué responsabilidad.
**Impacto:** se incumplen los requisitos de auditoría contextual y trazabilidad entre usuarios/áreas (R7, CA-150).

### H8 - ALTO/P1: la configuración y las pruebas no demuestran extensibilidad ni aislamiento de módulos
- La estructura Drive y el dispatcher son listas hardcodeadas; añadir subáreas requiere cambios de código.
- No se ejecutaron pruebas E2E que demuestren que la caída de RRHH no afecta cobros, que la caída de facturación no bloquea contabilidad, o que una persona con varios roles no hereda permisos de otras áreas.
- No se dispone de un entorno de prueba multi-cuenta/Drive aislado. Las suites existentes no fueron ejecutadas durante esta auditoría.
**Impacto:** CA-036/CA-059/CA-060 no están acreditados.

## 3. Matriz de requisitos

### TAREA-F6-005 (R1-R8, CA-031..CA-036)
| Requisito | Dictamen | Motivo |
|---|---|---|
| R1 Dirección/Secretaría comparten microservicio y Spreadsheet cuando corresponda, con Drive y permisos separados | Parcial | academic-service y roles existen; carpetas creadas sin ACL ni política efectiva. |
| R2 microservicio financiero con módulos internos | Parcial | existe ACCOUNTING con funciones de varios dominios, pero un único archivo/dispatcher y almacenamiento compartido. |
| R3 vínculo cobro-factura-recibo sin duplicación | No cumple | createAdmissionCharge incompleta; processPaymentReceipt ausente; receipt PDF no se genera; referencias no verificadas. |
| R4 jerarquía Drive automática | Parcial | initializer crea subcarpetas, pero uploads no las usan y no se configuran permisos. |
| R5 múltiples roles desde una cuenta | No cumple | token y enforcement consumen un único role; helper multirol solo devuelve payload. |
| R6 Secretaría cobra y factura en ventanilla | No acreditado | ROLE_PERMISSIONS contable no incluye Secretaría; no hay prueba de matriz dinámica. |
| R7 auditar contexto de cada transacción | No cumple | pagos no guardan actor/rol/contexto verificado. |
| R8 nuevas subáreas mediante configuración | No cumple | módulos, carpetas y actions están codificados en objetos/switch. |
| CA-031 | Parcial | carpeta separada sin ACL. |
| CA-032 | Parcial | funciones agrupadas, sin independencia interna y con documentos públicos. |
| CA-033 | Parcial | getOrCreateFolder encuentra primera coincidencia, pero no controla concurrencia ni duplica preexistente. |
| CA-034 | No cumple | referencias cargo/pago/factura/recibo no son transaccionales ni validadas. |
| CA-035 | No cumple | multirol no llega al token ni a la autorización contable. |
| CA-036 | No cumple | un único servicio/archivo y sin pruebas de aislamiento de fallos. |

### TAREA-F6-030 (alcance ampliado, CA-053..CA-060 y CA-148..CA-150)
| Criterio | Dictamen | Motivo |
|---|---|---|
| CA-053 Dirección/Secretaría compartido, permisos diferenciados y sin duplicar entidades | Parcial | servicio/roles/carpeta existen; no hay ACL y la acción de inicialización no está autorizada en ROLE_PERMISSIONS. |
| CA-054 módulos financieros con separación interna | Parcial | funciones por dominio, pero un Code.gs, un dispatcher y una fuente de datos común. |
| CA-055 carpetas sin duplicados | Parcial | comprobación getFoldersByName; sin lock ni reconciliación de duplicados existentes. |
| CA-056 documentos asociados a área/subárea | No cumple | cargas de comprobantes y RRHH se guardan en carpetas genéricas fuera de la jerarquía. |
| CA-057 acceso restringido | No cumple | ANYONE_WITH_LINK y ausencia de ACL por carpeta/rol. |
| CA-058 referencias factura/cobro/recibo | No cumple | reciboCajaId opcional sin validación y recibo no generado como PDF. |
| CA-059 nuevas subáreas configurables | No cumple | carpetas/roles/actions hardcodeados. |
| CA-060 indisponibilidad de un módulo no bloquea otros | No cumple | un único servicio y ejecución; sin aislamiento ni pruebas de fallos. |
| CA-148 múltiples roles desde una identidad | Parcial | hay catálogo/ámbitos, pero no se convierten en roles activos de sesión. |
| CA-149 permisos de subárea no se extienden | No cumple | la autorización contable no evalúa roles/subáreas activas independientes. |
| CA-150 trazabilidad con responsabilidades múltiples | No cumple | pagos/facturas no registran actor/rol/contexto verificados. |

## 4. Reconciliación con auditorías y tareas existentes

No se crean IDs globales AUD-NG nuevos para problemas ya documentados.
- F5-013 y AUD-NG-132: cargos mensuales, esquema/deduplicación y createAdmissionCharge.
- AUD-NG-133: pago sin validar propiedad del cargo/saldo e idempotencia no atómica.
- AUD-NG-134: portal financiero sin handlers y generatePaymentReceiptPDF que no genera PDF; comprobantes con enlace público.
- AUD-NG-135: controles de CAI/correlativo fiscal.
- AUD-NG-055..065: validación de adjuntos, permisos Drive, enlaces públicos y trazabilidad documental.
- TAREA-F6-030: duplicado/expansión de alcance de TAREA-F6-005; se conserva el ID y se crea informe individual que referencia el mismo bloque canónico de tareas.
- Los hallazgos F6-005-A01..A06 siguientes amplían esos registros, no los sustituyen ni duplican.

## 5. Tareas ejecutables derivadas de los hallazgos

Los siguientes IDs son locales a esta auditoría. TAREA-F6-030 referencia este mismo bloque; no se crean tareas duplicadas.

### F6-005-A01 - Reparar la estructura y creación de cargos del servicio contable
- **Origen:** H1.
- **Prioridad:** P0 / Crítico.
- **Acción:** cerrar correctamente el bloque de createAdmissionCharge; recuperar las declaraciones globales; implementar creación real de cargo con esquema canónico, ID inmutable, monto/concepto/vencimiento y deduplicación atómica; ejecutar parser/linter antes de despliegue.
- **Criterios:** Code.gs compila; funciones del dispatcher permanecen globales; un cargo nuevo persiste y devuelve cargoId; un duplicado devuelve el existente; dos solicitudes concurrentes no duplican cargos.
- **Referencias:** F5-013, AUD-NG-132 y hallazgo nuevo H1.
- **Estado:** Pendiente.

### F6-005-A02 - Unificar el ciclo de cobro, pago, factura y recibo
- **Origen:** H2.
- **Prioridad:** P0 / Crítico.
- **Acción:** establecer una única fuente de cargos; integrar matrícula con ACCOUNTING mediante contrato; validar propiedad y saldo; asegurar idempotencia atómica; hacer transaccional la revisión de comprobantes; validar recibo/pago antes de emitir factura; generar y almacenar el PDF real con referencia estable; definir processPaymentReceipt o documentar el contrato equivalente.
- **Criterios:** no hay pagos huérfanos/cruzados/sobrepagos; invoice y receipt apuntan a transacciones confirmadas; fallos revierten o compensan el estado; claves únicas persistentes; auditoría conserva relaciones.
- **Referencias:** AUD-NG-132..135 y F5-013-A01..A10.
- **Estado:** Pendiente.

### F6-005-A03 - Aplicar privacidad y permisos efectivos a Drive
- **Origen:** H3 y H6.
- **Prioridad:** P0 / Crítico.
- **Acción:** eliminar ANYONE_WITH_LINK de documentos financieros/laborales; usar carpetas de la jerarquía para cargas; fallar cerrado si falta PARENT_FOLDER_ID; aplicar ACL por rol/área/operación; crear carpetas Dirección/Secretaría/Compartido con permisos explícitos; usar bloqueo e idempotencia para inicialización.
- **Criterios:** documentos no públicos; RRHH/planillas separados de finanzas; sólo roles autorizados acceden; los uploads retornan IDs/URLs privadas; carpetas duplicadas se detectan y reconcilian.
- **Referencias:** AUD-NG-055..065 y AUD-NG-134.
- **Estado:** Pendiente.

### F6-005-A04 - Integrar multirol, permisos de Secretaría y contexto de autorización
- **Origen:** H4 y H7.
- **Prioridad:** P1 / Alto.
- **Acción:** incorporar roles activos/ámbitos vigentes al token o resolverlos server-side; integrar AsignacionesAmbitosRoles con validateRolePermission; definir permisos de Secretaría para cobros/facturación; validar actor/objeto/área; registrar actor verificado, rol activo, acción, entidad y correlationId en cada transacción.
- **Criterios:** un usuario mantiene una sola identidad con varios roles; cada operación exige rol/ámbito específico; permisos no se heredan; registros usan claims verificados y no authRole del cliente.
- **Estado:** Pendiente.

### F6-005-A05 - Separar módulos y habilitar subáreas mediante configuración
- **Origen:** H5 y H8.
- **Prioridad:** P1 / Alto.
- **Acción:** definir catálogo de módulos con operaciones, validaciones, permisos, almacenamiento, Drive y versión; separar módulos internos y sus dependencias; resolver nuevos módulos desde configuración sin añadir cases/listas manuales; definir límites de fallo y degradación.
- **Criterios:** una subárea nueva se registra por configuración; módulos tienen contratos y pruebas propios; caída de uno no impide operaciones independientes; no hay rutas no registradas.
- **Estado:** Pendiente.

### F6-005-A06 - Crear pruebas E2E de administración y finanzas
- **Origen:** H1-H8.
- **Prioridad:** P1 / Alto.
- **Acción:** crear entorno de prueba separado para USER/ACADEMIC/ACCOUNTING/DEVELOPER; probar cargos, pagos, recibos PDF, facturas, Drive ACL, Secretaría, múltiples roles, concurrencia y fallos selectivos; usar fixtures y limpieza.
- **Criterios:** pruebas repetibles sin producción; trazas de actor/rol; cobertura de CA-031..036 y CA-053..060/148..150; evidencias expected/actual; no falsos PASS.
- **Referencias:** TAREA-F6-003-A09, AUD-NG-132..135 y AUD-NG-055..065.
- **Estado:** Pendiente.

## 6. Cierre
- TAREA-F6-005: NO CUMPLE.
- TAREA-F6-030: NO CUMPLE; mismo alcance base con criterios ampliados.
- Ambos registros permanecen [X] en completadas.md como estado histórico; no se modifican.
- Pendientes.md se leyó desde el blob íntegro y no se modificó.
- Se crean dos informes individuales para IDs distintos, con un único bloque canónico F6-005-A01..A06 compartido.
- No se modificó código, configuración, tests, datos productivos ni ChangesLogs.txt.
- No se ejecutaron Apps Script, HTTP, Drive ni facturación real.
- Siguiente tarea secuencial: TAREA-F6-006 - Crear una plantilla de microservicio académico reutilizable para múltiples áreas; localizar informe individual e historial antes de auditar.

## 7. Referencias
- completadas.md SHA f57f1aef832e81e44fc4f7ec36a852d50e464676, líneas 2619-2657 y 3443-3516.
- Pendientes.md blob SHA 631b4c2dbf0e86d5704b63625382d73ccb8ceb3c.
- ChangesLogs.txt SHA 5b5cff1926b73a05d1b92087a7bf4b2db75326ff, líneas 1962-1965 y 2130-2136.
- backend/accounting-service/Code.gs SHA 38b979d41596b85e888b4a7060b37bbac0840a28.
- backend/academic-service/Code.gs SHA df87a2eea9f0ef79d0b966d03fd5bbe432003df5.
- backend/user-service/Code.gs SHA 12079dd410aa6d8afbce55a4bc62a79dea605f9f.
- backend/developer-service/Code.gs SHA 8aa4bac67cfe5c8c54da51a0784a56fef633e412.
